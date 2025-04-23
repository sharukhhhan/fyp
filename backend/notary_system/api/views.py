import uuid
import os
import json
import time
import jwt
import hashlib
from venv import logger
import requests
from datetime import datetime

from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.http import FileResponse, Http404
from django.shortcuts import redirect
from django.http import HttpResponse
from django.core.files.storage import default_storage

from django.core.files.base import ContentFile
import boto3
from botocore.exceptions import ClientError

from rest_framework import viewsets, generics, status, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import action
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.core.files.base import ContentFile
from django.core.cache import cache
from django.utils import timezone
from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from .openapi import OpenAIDocumentService
from .models import Document, IdentityDocument, VerificationRequest
from .serializers import DocumentSerializer, VerificationRequestSerializer
import uuid
import json
import logging

logger = logging.getLogger(__name__)

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.core.files.base import ContentFile
from io import BytesIO
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from .openapi import OpenAIDocumentService
from .models import Document, IdentityDocument
from .serializers import DocumentSerializer
import uuid
import json
import os

from .utils import generate_signed_pdf

from .models import (
    Document,
    VerificationRequest,
    VideoSession,
    SignedDocument,
    IdentityDocument,
    GeneratedDocument,
    NotaryProfile
)
from .serializers import (
    NotaryRegistrationSerializer,
    UserSerializer,
    UserProfileSerializer,
    CustomTokenObtainPairSerializer,
    DocumentSerializer,
    DocumentListSerializer,
    VerificationRequestSerializer,
    VerificationRequestListSerializer,
    VideoSessionSerializer,
    SignedDocumentSerializer,
    IdentityDocumentSerializer,
    GeneratedDocumentSerializer
)
from .permissions import (
    IsOwner,
    IsNotary,
    IsUser,
    IsNotaryOrOwner,
    IsAdmin
)

User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom token view with user data"""
    serializer_class = CustomTokenObtainPairSerializer


class RegisterUserView(generics.CreateAPIView):
    """View for user registration"""
    serializer_class = UserSerializer
    permission_classes = [AllowAny]
    
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Return the created user data
        return Response(
            {
                'message': _('User registered successfully'),
                'user': UserSerializer(user, context=self.get_serializer_context()).data
            },
            status=status.HTTP_201_CREATED
        )


class UserProfileView(generics.RetrieveUpdateAPIView):
    """View for retrieving and updating user profile"""
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        return self.request.user


class IdentityDocumentViewSet(viewsets.ModelViewSet):
    """ViewSet for identity documents"""
    serializer_class = IdentityDocumentSerializer
    permission_classes = [IsAuthenticated, IsOwner]
    
    def get_queryset(self):
        """Return objects for the current authenticated user only"""
        user = self.request.user
        
        if user.role == 'notary':
            # Notaries can see verified identity documents of users who have submitted requests
            return IdentityDocument.objects.filter(
                user__verification_requests__notary=user,
                is_verified=True
            ).distinct()
        
        # Regular users can only see their own identity documents
        return IdentityDocument.objects.filter(user=user)

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Download the identity document file"""
        document = self.get_object()
        
        if not document.file:
            return Response(
                {'detail': _('No file associated with this document.')},
                status=status.HTTP_404_NOT_FOUND
            )
        
        try:
            # Get the file URL from S3
            file_url = document.file.url
            
            # Redirect to S3 URL with the document's original filename
            return redirect(file_url)
            
        except Exception as e:
            return Response(
                {'detail': _('Error accessing file.')},
                status=status.HTTP_404_NOT_FOUND
            )

class DocumentViewSet(viewsets.ModelViewSet):
    """ViewSet for handling document operations"""
    serializer_class = DocumentSerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'type']
    ordering_fields = ['uploaded_at', 'title']
    
    def get_queryset(self):
        """Return documents based on user role"""
        user = self.request.user
        
        if user.role == 'notary':
            # Notaries can see documents from verification requests assigned to them
            return Document.objects.filter(
                verification_requests__notary=user
            ).distinct()
        
        # Regular users can only see their own documents
        return Document.objects.filter(user=user)
    
    def get_serializer_class(self):
        """Return appropriate serializer class"""
        if self.action == 'list':
            return DocumentListSerializer
        return DocumentSerializer
    
    def get_permissions(self):
        """Return appropriate permissions for the action"""
        if self.action in ['retrieve', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsOwner()]
        return [IsAuthenticated()]
    
    def perform_create(self, serializer):
        """Create a new document"""
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Download the document file"""
        document = self.get_object()
        
        if not document.file:
            return Response(
                {'detail': _('No file associated with this document.')},
                status=status.HTTP_404_NOT_FOUND
            )
        
        try:
            # Get the file URL from S3
            file_url = document.file.url
            
            # Option 1: Redirect to S3 URL
            return redirect(file_url)
            
            # Option 2: Stream file content
            # file_content = default_storage.open(document.file.name).read()
            # response = HttpResponse(file_content, content_type='application/octet-stream')
            # response['Content-Disposition'] = f'attachment; filename="{os.path.basename(document.file.name)}"'
            # return response
            
        except Exception as e:
            return Response(
                {'detail': _('Error accessing file.')},
                status=status.HTTP_404_NOT_FOUND
            )

class RegisterNotaryView(generics.CreateAPIView):
    serializer_class = NotaryRegistrationSerializer
    permission_classes = [IsAdmin] 

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Create user with notary role
        user = User.objects.create_user(
            email=serializer.validated_data['email'],
            password=serializer.validated_data['password'],
            full_name=serializer.validated_data['full_name'],
            role='notary',
            is_verified=False  # Requires admin verification
        )
        
        # Create notary profile
        NotaryProfile.objects.create(
            user=user,
            license_number=serializer.validated_data['license_number'],
            jurisdiction=serializer.validated_data['jurisdiction']
        )
        
        return Response({
            'message': _('Notary registration submitted for verification'),
            'user': UserSerializer(user, context=self.get_serializer_context()).data
        }, status=status.HTTP_201_CREATED)

class VerificationRequestViewSet(viewsets.ModelViewSet):
    """ViewSet for verification requests"""
    serializer_class = VerificationRequestSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['document__title', 'status']
    ordering_fields = ['created_at', 'updated_at', 'status']
    
    def get_queryset(self):
        """Return verification requests based on user role"""
        user = self.request.user
        
        if user.role == 'notary':
            # Notaries can see requests assigned to them or with no notary assigned
            return VerificationRequest.objects.filter(
                notary=user
            ) | VerificationRequest.objects.filter(
                notary__isnull=True,
                status='pending'
            )
        
        # Regular users can only see their own requests
        return VerificationRequest.objects.filter(user=user)
    
    def get_serializer_class(self):
        """Return appropriate serializer class"""
        if self.action == 'list':
            return VerificationRequestListSerializer
        return VerificationRequestSerializer
    
    def get_permissions(self):
        """Return appropriate permissions for the action"""
        if self.action in ['retrieve', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsNotaryOrOwner()]
        return [IsAuthenticated()]
    
    def perform_create(self, serializer):
        """Create a new verification request"""
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated, IsNotary])
    def assign(self, request, pk=None):
        """Assign the verification request to the current notary"""
        verification_request = self.get_object()
        
        if verification_request.notary:
            return Response(
                {'detail': _('This request is already assigned to a notary.')},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if request.user.role != 'notary':
            return Response(
                {'detail': _('Only notaries can assign requests.')},
                status=status.HTTP_403_FORBIDDEN
            )
        
        verification_request.notary = request.user
        verification_request.save()
        
        serializer = self.get_serializer(verification_request)
        return Response(serializer.data)
    
    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated, IsNotary])
    def approve(self, request, pk=None):
        """Approve the verification request"""
        verification_request = self.get_object()
        
        if verification_request.notary != request.user:
            return Response(
                {'detail': _('You are not assigned to this request.')},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if verification_request.status != 'pending':
            return Response(
                {'detail': _('This request is not in pending status.')},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        verification_request.status = 'approved'
        verification_request.save()
        
        # Mark the document as verified
        document = verification_request.document
        document.is_verified = True
        document.save()
        
        serializer = self.get_serializer(verification_request)
        return Response(serializer.data)
    
    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated, IsNotary])
    def reject(self, request, pk=None):
        """Reject the verification request"""
        verification_request = self.get_object()
        
        if verification_request.notary != request.user:
            return Response(
                {'detail': _('You are not assigned to this request.')},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if verification_request.status != 'pending':
            return Response(
                {'detail': _('This request is not in pending status.')},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        verification_request.status = 'rejected'
        
        # Add rejection notes if provided
        if 'notes' in request.data:
            verification_request.notes = request.data['notes']
            
        verification_request.save()
        
        serializer = self.get_serializer(verification_request)
        return Response(serializer.data)


class VideoSessionViewSet(viewsets.ModelViewSet):
    """ViewSet for video sessions"""
    serializer_class = VideoSessionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return video sessions based on user role"""
        user = self.request.user
        
        if user.role == 'notary':
            # Notaries can see sessions for verification requests assigned to them
            return VideoSession.objects.filter(
                request__notary=user
            )
        

        # Regular users can only see sessions for their own requests
        return VideoSession.objects.filter(
            request__user=user
        )
    
    def create(self, request, *args, **kwargs):
        """Create a new video session for a verification request"""
        request_id = request.data.get('request')
        
        if not request_id:
            return Response(
                {'request': _('This field is required.')},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            verification_request = VerificationRequest.objects.get(id=request_id)
        except VerificationRequest.DoesNotExist:
            return Response(
                {'request': _('Verification request not found.')},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if the current user is authorized
        if (request.user.role == 'notary' and verification_request.notary != request.user) or \
           (request.user.role == 'user' and verification_request.user != request.user):
            return Response(
                {'detail': _('You are not authorized to create a session for this request.')},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if a session already exists
        if hasattr(verification_request, 'video_session'):
            return Response(
                {'detail': _('A video session already exists for this request.')},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create the video session
        room_id = f"notary-{uuid.uuid4().hex[:12]}"
        base_url = settings.VIDEO_CONFERENCE_BASE_URL.rstrip('/')
        room_url = f"{base_url}/{room_id}"
        
        video_session = VideoSession.objects.create(
            request=verification_request,
            room_id=room_id,
            room_url=room_url,
            scheduled_time=request.data.get('scheduled_time')
        )
        
        serializer = self.get_serializer(video_session)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    def _generate_jwt(self, user, room_id, is_moderator=False):
        """Generate JWT token for Jitsi"""
        now = int(time.time())
        
        jwt_payload = {
            'iss': 'notary_app',
            'aud': 'jitsi',
            'sub': settings.VIDEO_CONFERENCE_DOMAIN,
            'room': room_id,
            'exp': now + 24*60*60,  # 24 hours
            'iat': now,
            'context': {
                'user': {
                    'id': str(user.id),
                    'name': user.full_name,
                    'email': user.email,
                    'moderator': is_moderator
                }
            }
        }
        
        return jwt.encode(
            jwt_payload,
            settings.SECRET_KEY,
            algorithm='HS256'
        )
    
    @action(detail=True, methods=['get'])
    def join(self, request, pk=None):
        """Get URL and token for joining session"""
        try:
            # Get the session with related request data
            session = VideoSession.objects.select_related(
                'request', 'request__user', 'request__notary'
            ).get(pk=pk)
            
            user = request.user
            
            # Debug logging
            print(f"Session: {session.id}")
            print(f"Request user: {session.request.user.id}")
            print(f"Request notary: {session.request.notary.id}")
            print(f"Current user: {user.id}")
            
            # Check if user is either the notary or the client
            is_moderator = (user.id == session.request.notary.id)
            is_participant = (user.id == session.request.user.id)
            
            if not (is_moderator or is_participant):
                return Response(
                    {'detail': 'You do not have permission to join this session.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Generate JWT
            jwt_token = self._generate_jwt(
                user=user,
                room_id=session.room_id,
                is_moderator=is_moderator
            )
            
            # Create join URL with JWT
            join_url = (
                f"{settings.VIDEO_CONFERENCE_BASE_URL}/{session.room_id}"
                f"?jwt={jwt_token}"
            )
            
            return Response({
                'room_id': session.room_id,
                'join_url': join_url,
                'jwt_token': jwt_token,
                'is_moderator': is_moderator
            })
            
        except VideoSession.DoesNotExist:
            return Response(
                {'detail': 'Session not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            print(f"Error in join: {str(e)}")
            return Response(
                {'detail': 'Error joining session.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated, IsNotary])
    def start(self, request, pk=None):
        """Mark the video session as started"""
        video_session = self.get_object()
        
        if video_session.start_time:
            return Response(
                {'detail': _('This session has already started.')},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        video_session.start_time = datetime.now()
        video_session.save()
        
        serializer = self.get_serializer(video_session)
        return Response(serializer.data)
    
    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated, IsNotary])
    def end(self, request, pk=None):
        """Mark the video session as ended"""
        video_session = self.get_object()
        
        if not video_session.start_time:
            return Response(
                {'detail': _('This session has not started yet.')},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if video_session.end_time:
            return Response(
                {'detail': _('This session has already ended.')},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        video_session.end_time = datetime.now()
        video_session.is_active = False
        video_session.save()
        
        serializer = self.get_serializer(video_session)
        return Response(serializer.data)


class SignedDocumentViewSet(viewsets.ModelViewSet):
    """ViewSet for signed documents"""
    serializer_class = SignedDocumentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return signed documents based on user role"""
        user = self.request.user
        
        if user.role == 'notary':
            # Notaries can see documents they've signed
            return SignedDocument.objects.filter(signed_by=user)
        
        # Regular users can see documents related to their original documents
        return SignedDocument.objects.filter(
            original_document__user=user
        )
    
    def create(self, request, *args, **kwargs):
        """Create a signed document from original document in S3"""
        if request.user.role != 'notary':
            return Response(
                {'detail': _('Only notaries can sign documents.')},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get the original document
        original_document_id = request.data.get('original_document')
        try:
            original_document = Document.objects.get(id=original_document_id)
        except Document.DoesNotExist:
            return Response(
                {'original_document': _('Document not found.')},
                status=status.HTTP_404_NOT_FOUND
            )

        # Verify request status
        verification_request = VerificationRequest.objects.filter(
            document=original_document,
            notary=request.user,
            status='approved'
        ).first()
        
        if not verification_request:
            return Response(
                {'detail': _('You can only sign documents from approved verification requests.')},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            # Get the original file from S3
            original_file_content = original_document.file.read()
            
            # Generate signed PDF
            signed_pdf = generate_signed_pdf(
                original_file_content,
                notary=request.user,
                document=original_document,
                verification_request=verification_request
            )
            
            # Create signature hash
            signature_hash = hashlib.sha256(
                f"{original_document.id}:{request.user.id}:{timezone.now().isoformat()}".encode()
            ).hexdigest()
            
            # Create the signed document
            signed_document = SignedDocument(
                original_document=original_document,
                signed_by=request.user,
                signature_hash=signature_hash
            )
            
            # Save the signed PDF to S3
            signed_document.signed_file.save(
                f'signed_{original_document.file.name}',
                ContentFile(signed_pdf),
                save=True
            )
            
            # Update verification request status
            verification_request.status = 'signed'
            verification_request.save()
            
            return Response(
                SignedDocumentSerializer(signed_document).data,
                status=status.HTTP_201_CREATED
            )
            
        except Exception as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Download the signed document file"""
        signed_document = self.get_object()
        
        if not signed_document.signed_file:
            return Response(
                {'detail': _('No file associated with this signed document.')},
                status=status.HTTP_404_NOT_FOUND
            )
        
        try:
            # Get the file URL from S3
            file_url = signed_document.signed_file.url
            
            # Redirect to S3 URL
            return redirect(file_url)
            
        except Exception as e:
            return Response(
                {'detail': _('Error accessing file.')},
                status=status.HTTP_404_NOT_FOUND
            )


class AIChatView(APIView):
    """View для взаимодействия с AI ассистентом для генерации документов с унифицированным интерфейсом"""
    permission_classes = [IsAuthenticated]
    
    def get_or_create_session(self, request):
        """Получение или создание сессии чата"""
        session_id = request.data.get('session_id')
        
        if not session_id:
            session_id = str(uuid.uuid4())
            cache.set(f"ai_chat_session_{session_id}", {
                'history': [],
                'document_id': None,
                'language': request.data.get('language', 'ru')
            }, timeout=3600)  # Храним сессию 1 час
        
        return session_id
    
    def get_session_data(self, session_id):
        """Получение данных сессии из кэша"""
        return cache.get(f"ai_chat_session_{session_id}", {
            'history': [],
            'document_id': None,
            'language': 'ru'
        })
    
    def update_session_data(self, session_id, session_data):
        """Обновление данных сессии в кэше"""
        cache.set(f"ai_chat_session_{session_id}", session_data, timeout=3600)
    
    def post(self, request, *args, **kwargs):
        """Обработка сообщения пользователя и выполнение действий"""
        prompt = request.data.get('prompt')
        language = request.data.get('language', 'ru')
        operation = request.data.get('operation', 'chat')  # chat, save, finalize, verify, translate, end
        document_type = request.data.get('document_type')
        
        # Получаем или создаем сессию
        session_id = self.get_or_create_session(request)
        session_data = self.get_session_data(session_id)
        
        # Устанавливаем язык сессии, если он не установлен
        if 'language' not in session_data or not session_data['language']:
            session_data['language'] = language
        
        # Выполняем операцию в зависимости от запроса
        if operation == 'chat' and prompt:
            return self._handle_chat(request, session_id, session_data, prompt, document_type)
        elif operation == 'save' and session_data.get('document_content'):
            return self._handle_save_document(request, session_id, session_data)
        elif operation == 'finalize' and session_data.get('document_id'):
            return self._handle_finalize_document(request, session_id, session_data)
        elif operation == 'verify' and session_data.get('document_id'):
            return self._handle_verify_document(request, session_id, session_data)
        elif operation == 'translate':
            return self._handle_translate_document(request, session_id, session_data)
        elif operation == 'end':
            return self._handle_end_session(request, session_id)
        else:
            return Response(
                {'error': 'Некорректная операция или недостаточно данных'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def _handle_chat(self, request, session_id, session_data, prompt, document_type=None):
        """Обработка обычного сообщения в чате"""
        # Получаем данные из верифицированных документов пользователя
        identity_document = IdentityDocument.objects.filter(
            user=request.user,
            is_verified=True
        ).first()
        
        if not identity_document:
            return Response(
                {'error': 'У вас должен быть верифицированный идентификационный документ'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user_data = {
            'full_name': identity_document.full_name,
            'document_type': identity_document.get_type_display(),
            'document_number': identity_document.document_number,
            'date_of_birth': identity_document.date_of_birth.isoformat(),
            'issue_date': identity_document.issue_date.isoformat(),
            'expiry_date': identity_document.expiry_date.isoformat() if identity_document.expiry_date else None
        }
        
        # Инициализируем сервис AI
        ai_service = OpenAIDocumentService()
        
        # Получаем историю диалога
        conversation_history = session_data.get('history', [])
        
        # Если у нас уже есть документ, используем его содержимое
        current_document = None
        document_id = session_data.get('document_id')
        
        if document_id:
            try:
                current_document = Document.objects.get(
                    id=document_id,
                    user=request.user
                )
            except Document.DoesNotExist:
                session_data['document_id'] = None
        
        # Генерируем ответ
        result = ai_service.generate_document(
            user_data=user_data,
            prompt=prompt,
            document_type=document_type,
            language=session_data.get('language', 'ru'),
            previous_content=current_document.generation_history[-1]['content'] if current_document and current_document.generation_history else None,
            conversation_history=conversation_history
        )
        
        if not result['success']:
            return Response(
                {'error': result['error']},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # Обновляем историю диалога
        conversation_history.append({'role': 'user', 'content': prompt})
        conversation_history.append({'role': 'assistant', 'content': result['content']})
        session_data['history'] = conversation_history
        
        # Если это документ, сохраняем его в сессии
        if result.get('is_document', False):
            session_data['document_content'] = result['content']
        
        # Обновляем сессию
        self.update_session_data(session_id, session_data)
        
        # Если у нас уже есть документ, обновляем его
        if current_document and result.get('is_document', False):
            # Обновляем документ
            if not current_document.generation_history:
                current_document.generation_history = []
            
            current_document.generation_history.append({
                'timestamp': result['timestamp'],
                'prompt': prompt,
                'content': result['content'],
                'action': 'edit',
                'model_used': result.get('model_used'),
                'language': session_data.get('language', 'ru')
            })
            
            current_document.revision_count += 1
            current_document.save()
            
            # Обновляем PDF
            self._generate_pdf(current_document, result['content'])
            
            return Response({
                'message': result['content'],
                'session_id': session_id,
                'document_id': str(current_document.id),
                'is_document': True,
                'file_url': request.build_absolute_uri(current_document.file.url) if current_document.file else None,
                'operation': 'chat'
            })
        
        # Возвращаем результат
        response_data = {
            'message': result['content'],
            'session_id': session_id,
            'is_document': result.get('is_document', False),
            'operation': 'chat'
        }
        
        # Добавляем document_id если есть
        if document_id:
            response_data['document_id'] = document_id
        
        return Response(response_data)
    
    def _handle_save_document(self, request, session_id, session_data):
        """Сохранение документа"""
        document_content = session_data.get('document_content')
        if not document_content:
            return Response(
                {'error': 'Нет содержимого документа для сохранения'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Если документ уже существует, обновляем его
        if session_data.get('document_id'):
            try:
                document = Document.objects.get(
                    id=session_data['document_id'],
                    user=request.user
                )
                
                # Обновляем историю
                if not document.generation_history:
                    document.generation_history = []
                
                document.generation_history.append({
                    'timestamp': timezone.now().isoformat(),
                    'prompt': 'Сохранение документа',
                    'content': document_content,
                    'action': 'save',
                    'language': session_data.get('language', 'ru')
                })
                
                document.revision_count += 1
                document.save()
            except Document.DoesNotExist:
                # Если документ не найден, создаем новый
                document = self._create_document(request, session_data, document_content)
        else:
            # Создаем новый документ
            document = self._create_document(request, session_data, document_content)
        
        # Обновляем документ в сессии
        session_data['document_id'] = str(document.id)
        self.update_session_data(session_id, session_data)
        
        # Генерируем PDF
        self._generate_pdf(document, document_content)
        
        return Response({
            'message': 'Документ успешно сохранен',
            'session_id': session_id,
            'document_id': str(document.id),
            'file_url': request.build_absolute_uri(document.file.url) if document.file else None,
            'operation': 'save'
        })
    
    def _create_document(self, request, session_data, document_content):
        """Создание нового документа"""
        document_type = request.data.get('document_type') or 'Документ'
        title = request.data.get('title') or document_type
        
        document = Document.objects.create(
            user=request.user,
            title=title,
            type='custom',
            source='ai_generated',
            language=session_data.get('language', 'ru'),
            generation_history=[{
                'timestamp': timezone.now().isoformat(),
                'prompt': 'Создание документа',
                'content': document_content,
                'action': 'create',
                'language': session_data.get('language', 'ru')
            }],
            revision_count=1
        )
        
        return document
    
    def _generate_pdf(self, document, content):
        """Генерация PDF для документа с поддержкой кириллицы"""
        try:
            # Импортируем необходимые библиотеки для работы с шрифтами
            from reportlab.pdfbase import pdfmetrics
            from reportlab.pdfbase.ttfonts import TTFont
            import os
            
            # Регистрируем кириллический шрифт 
            # (предполагается, что у вас есть этот шрифт в директории вашего проекта)
            font_path = os.path.join(settings.BASE_DIR, 'fonts')
            
            # Регистрируем шрифт Arial, который поддерживает кириллицу
            # Если у вас нет этого файла, загрузите его или используйте другой кириллический шрифт
            arial_font_path = os.path.join(font_path, 'arial.ttf')
            arial_bold_path = os.path.join(font_path, 'arialbd.ttf')
            
            # Проверяем существование директории шрифтов, создаем если нет
            if not os.path.exists(font_path):
                os.makedirs(font_path)
            
            # Проверяем наличие шрифтов, если нет, используем стандартные
            try:
                if os.path.exists(arial_font_path):
                    pdfmetrics.registerFont(TTFont('Arial', arial_font_path))
                else:
                    # Если шрифт не найден, используем стандартный DejaVuSans
                    from reportlab.pdfbase.ttfonts import TTFont
                    pdfmetrics.registerFont(TTFont('DejaVuSans', 'DejaVuSans.ttf'))
                    arial_font_path = 'DejaVuSans.ttf'  # Используем DejaVuSans вместо Arial
                    
                if os.path.exists(arial_bold_path):
                    pdfmetrics.registerFont(TTFont('Arial-Bold', arial_bold_path))
            except Exception as e:
                logger.warning(f"Failed to register custom fonts: {str(e)}")
            
            buffer = BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=A4)
            styles = getSampleStyleSheet()
            
            # Создаем стили с кириллическими шрифтами
            if os.path.exists(arial_font_path) or 'DejaVuSans' in pdfmetrics.getRegisteredFontNames():
                font_name = 'Arial' if 'Arial' in pdfmetrics.getRegisteredFontNames() else 'DejaVuSans'
                bold_font = 'Arial-Bold' if 'Arial-Bold' in pdfmetrics.getRegisteredFontNames() else font_name
                
                # Обновляем стили для поддержки кириллицы
                styles['Title'].fontName = bold_font
                styles['Normal'].fontName = font_name
                
                title_style = ParagraphStyle(
                    'CustomTitle',
                    parent=styles['Title'],
                    fontName=bold_font,
                    fontSize=16,
                    spaceAfter=30,
                    encoding='utf-8'
                )
                
                content_style = ParagraphStyle(
                    'CustomBody',
                    parent=styles['Normal'],
                    fontName=font_name,
                    fontSize=12,
                    leading=16,
                    encoding='utf-8'
                )
            else:
                # Если шрифты не найдены, используем стандартные стили
                title_style = ParagraphStyle(
                    'CustomTitle',
                    parent=styles['Title'],
                    fontSize=16,
                    spaceAfter=30
                )
                
                content_style = ParagraphStyle(
                    'CustomBody',
                    parent=styles['Normal'],
                    fontSize=12,
                    leading=16
                )
            
            story = []
            
            # Добавляем заголовок с поддержкой кириллицы
            story.append(Paragraph(document.title, title_style))
            
            # Разбиваем текст на абзацы и добавляем их
            paragraphs = content.split('\n')
            for para in paragraphs:
                if para.strip():
                    story.append(Paragraph(para, content_style))
                    story.append(Spacer(1, 10))
            
            # Генерируем PDF
            doc.build(story)
            pdf_content = buffer.getvalue()
            buffer.close()
            
            # Сохраняем PDF в документе
            file_name = f"{document.title.replace(' ', '_')}_{uuid.uuid4().hex[:8]}.pdf"
            document.file.save(file_name, ContentFile(pdf_content))
            
            return True
        except Exception as e:
            logger.exception(f"Error generating PDF: {str(e)}")
            return False
    
    def _handle_finalize_document(self, request, session_id, session_data):
        """Финализация документа"""
        document_id = session_data.get('document_id')
        if not document_id:
            return Response(
                {'error': 'Нет документа для финализации'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            document = Document.objects.get(
                id=document_id,
                user=request.user
            )
        except Document.DoesNotExist:
            return Response(
                {'error': 'Документ не найден'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Помечаем документ как финализированный
        document.is_finalized = True
        document.finalized_at = timezone.now()
        document.save()
        
        # Обновляем информацию в сессии
        session_data['document_finalized'] = True
        self.update_session_data(session_id, session_data)
        
        return Response({
            'message': 'Документ успешно финализирован',
            'session_id': session_id,
            'document_id': str(document.id),
            'file_url': request.build_absolute_uri(document.file.url) if document.file else None,
            'operation': 'finalize'
        })
    
    def _handle_verify_document(self, request, session_id, session_data):
        """Отправка документа на верификацию"""
        document_id = session_data.get('document_id')
        if not document_id:
            return Response(
                {'error': 'Нет документа для верификации'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            document = Document.objects.get(
                id=document_id,
                user=request.user
            )
        except Document.DoesNotExist:
            return Response(
                {'error': 'Документ не найден'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Проверяем, что документ финализирован
        if not document.is_finalized:
            return Response(
                {'error': 'Документ должен быть финализирован перед отправкой на верификацию'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Проверяем, что для документа еще нет запроса на верификацию
        if VerificationRequest.objects.filter(document=document, status__in=['pending', 'approved']).exists():
            return Response(
                {'error': 'Для этого документа уже существует активный запрос на верификацию'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Создаем запрос на верификацию
        verification_request = VerificationRequest.objects.create(
            document=document,
            user=request.user,
            status='pending',
            notes=request.data.get('notes', '')
        )
        
        # Обновляем информацию в сессии
        session_data['verification_request_id'] = str(verification_request.id)
        self.update_session_data(session_id, session_data)
        
        return Response({
            'message': 'Запрос на верификацию успешно создан',
            'session_id': session_id,
            'document_id': str(document.id),
            'verification_request_id': str(verification_request.id),
            'status': verification_request.status,
            'operation': 'verify'
        })
    
    def _handle_translate_document(self, request, session_id, session_data):
        """Перевод документа на другой язык"""
        # Получаем ID документа и язык для перевода
        document_id = request.data.get('document_id') or session_data.get('document_id')
        target_language = request.data.get('target_language')
        
        if not document_id:
            return Response(
                {'error': 'Необходимо указать ID документа для перевода'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not target_language or target_language not in ['ru', 'kg', 'en']:
            return Response(
                {'error': 'Укажите целевой язык (ru или kg)'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            document = Document.objects.get(
                id=document_id,
                user=request.user
            )
        except Document.DoesNotExist:
            return Response(
                {'error': 'Документ не найден'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Проверяем, что язык перевода отличается от языка документа
        if document.language == target_language:
            return Response(
                {'error': 'Целевой язык совпадает с языком документа'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Проверяем, существует ли уже перевод на этот язык
        existing_translation = Document.objects.filter(
            original_document=document,
            language=target_language,
            source='translation'
        ).first()
        
        if existing_translation:
            return Response({
                'message': 'Перевод на этот язык уже существует',
                'document_id': str(existing_translation.id),
                'file_url': request.build_absolute_uri(existing_translation.file.url) if existing_translation.file else None,
                'operation': 'translate'
            })
        
        # Получаем содержимое документа
        document_content = None
        
        if document.source == 'ai_generated' and document.generation_history:
            document_content = document.generation_history[-1]['content']
        else:
            # Если это обычный документ, извлекаем текст из PDF
            ai_service = OpenAIDocumentService()
            
            if document.file:
                try:
                    with document.file.open('rb') as file:
                        result = ai_service.extract_text_from_pdf(file)
                        if result['success']:
                            document_content = result['content']
                except Exception as e:
                    logger.exception(f"Error opening document file: {str(e)}")
            
            if not document_content:
                return Response(
                    {'error': 'Не удалось извлечь текст из документа для перевода'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Выполняем перевод
        ai_service = OpenAIDocumentService()
        result = ai_service.translate_document(
            document_content=document_content,
            from_language=document.language,
            to_language=target_language
        )
        
        if not result['success']:
            return Response(
                {'error': result['error']},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # Создаем документ-перевод
        translated_document = Document.objects.create(
            user=request.user,
            title=f"{document.title} ({document.get_language_display()} → {dict(Document.LANGUAGE_CHOICES)[target_language]})",
            type=document.type,
            source='translation',
            language=target_language,
            original_document=document,
            source_language=document.language,
            translation_timestamp=timezone.now(),
            translation_model=ai_service.model,
            generation_history=[{
                'timestamp': result['timestamp'],
                'prompt': f"Перевод документа с {document.get_language_display()} на {dict(Document.LANGUAGE_CHOICES)[target_language]}",
                'content': result['content'],
                'action': 'translate',
                'from_language': document.language,
                'to_language': target_language
            }]
        )
        
        # Генерируем PDF для перевода
        self._generate_pdf(translated_document, result['content'])
        
        return Response({
            'message': 'Документ успешно переведен',
            'session_id': session_id,
            'original_document_id': str(document.id),
            'translated_document_id': str(translated_document.id),
            'file_url': request.build_absolute_uri(translated_document.file.url) if translated_document.file else None,
            'operation': 'translate'
        })
    
    def _handle_end_session(self, request, session_id):
        """Завершение сессии"""
        # Удаляем сессию из кэша
        cache.delete(f"ai_chat_session_{session_id}")
        
        return Response({
            'message': 'Сессия успешно завершена',
            'operation': 'end'
        })