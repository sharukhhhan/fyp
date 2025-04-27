from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import (
    Document, 
    VerificationRequest, 
    VideoSession, 
    SignedDocument,
    IdentityDocument
)

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model"""
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    
    class Meta:
        model = User
        fields = ('id', 'email', 'password', 'full_name', 'role', 'is_verified', 'created_at')
        read_only_fields = ('id', 'is_verified', 'created_at')
        extra_kwargs = {'password': {'write_only': True, 'min_length': 8}}
        
    def create(self, validated_data):
        """Create and return a new user"""
        return User.objects.create_user(**validated_data)
    
    def update(self, instance, validated_data):
        """Update and return a user"""
        password = validated_data.pop('password', None)
        user = super().update(instance, validated_data)
        
        if password:
            user.set_password(password)
            user.save()
            
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile (without sensitive data)"""
    
    class Meta:
        model = User
        fields = ('id', 'email', 'full_name', 'role', 'is_verified', 'created_at')
        read_only_fields = ('id', 'email', 'role', 'is_verified', 'created_at')


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom JWT token serializer that includes user data"""
    
    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user
        
        # Add user data to response
        data['user'] = {
            'id': str(user.id),
            'email': user.email,
            'full_name': user.full_name,
            'role': user.role,
            'is_verified': user.is_verified
        }
        
        return data


class IdentityDocumentSerializer(serializers.ModelSerializer):
    """Serializer for identity documents (passport, driver's license)"""
    
    class Meta:
        model = IdentityDocument
        fields = (
            'id', 'user', 'type', 'document_number', 'full_name', 
            'date_of_birth', 'issue_date', 'expiry_date', 'is_verified', 'created_at', 'file'
        )
        read_only_fields = ('id', 'user', 'is_verified', 'created_at')
    
    def create(self, validated_data):
        """Create identity document and associate with current user"""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class DocumentSerializer(serializers.ModelSerializer):
    """Serializer for documents"""
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Document
        fields = (
            'id', 'user', 'file', 'file_url', 'title', 
            'type', 'is_verified', 'uploaded_at'
        )
        read_only_fields = ('id', 'user', 'is_verified', 'uploaded_at', 'file_url')
    
    def get_file_url(self, obj):
        """Get the URL for the document file"""
        request = self.context.get('request')
        if obj.file and hasattr(obj.file, 'url') and request:
            return request.build_absolute_uri(obj.file.url)
        return None
    
    def create(self, validated_data):
        """Create document and associate with current user"""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class DocumentListSerializer(serializers.ModelSerializer):
    """Serializer for listing documents (without file content)"""
    
    class Meta:
        model = Document
        fields = ('id', 'title', 'type', 'is_verified', 'uploaded_at')
        read_only_fields = fields

class NotaryRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)
    license_number = serializers.CharField(required=True)
    jurisdiction = serializers.CharField(required=True)
    
    class Meta:
        model = User
        fields = ['email', 'full_name', 'password', 'confirm_password', 
                 'license_number', 'jurisdiction']
    
    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({'password': 'Passwords must match.'})
        return data

class VerificationRequestSerializer(serializers.ModelSerializer):
    """Serializer for verification requests"""
    document_details = DocumentSerializer(source='document', read_only=True)
    user_details = UserProfileSerializer(source='user', read_only=True)
    notary_details = UserProfileSerializer(source='notary', read_only=True)
    
    class Meta:
        model = VerificationRequest
        fields = (
            'id', 'document', 'document_details', 'user', 'user_details',
            'notary', 'notary_details', 'status', 'created_at', 'updated_at', 'notes'
        )
        read_only_fields = (
            'id', 'user', 'user_details', 'notary', 'notary_details', 
            'created_at', 'updated_at', 'document_details'
        )
    
    def create(self, validated_data):
        """Create verification request and associate with current user"""
        validated_data['user'] = self.context['request'].user
        
        # Verify that the document belongs to the current user
        document = validated_data.get('document')
        if document and document.user != validated_data['user']:
            raise serializers.ValidationError(
                {'document': _('You can only request verification for your own documents.')}
            )
            
        return super().create(validated_data)


class VerificationRequestListSerializer(serializers.ModelSerializer):
    """Serializer for listing verification requests"""
    document_title = serializers.CharField(source='document.title', read_only=True)
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    notary_name = serializers.CharField(source='notary.full_name', read_only=True)
    
    class Meta:
        model = VerificationRequest
        fields = (
            'id', 'document_title', 'user_name', 'notary_name',
            'status', 'created_at', 'updated_at'
        )
        read_only_fields = fields


class VideoSessionSerializer(serializers.ModelSerializer):
    """Serializer for video sessions"""
    request_details = VerificationRequestSerializer(source='request', read_only=True)
    
    class Meta:
        model = VideoSession
        fields = (
            'id', 'request', 'request_details', 'room_url', 'room_id',
            'scheduled_time', 'start_time', 'end_time', 'is_active'
        )
        read_only_fields = ('id', 'room_url', 'room_id', 'start_time', 'end_time', 'request_details')


class SignedDocumentSerializer(serializers.ModelSerializer):
    """Serializer for signed documents"""
    original_document_details = DocumentSerializer(source='original_document', read_only=True)
    signed_by_name = serializers.CharField(source='signed_by.full_name', read_only=True)
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = SignedDocument
        fields = (
            'id', 'original_document', 'original_document_details',
            'signed_file', 'file_url', 'signature_hash', 
            'signed_by', 'signed_by_name', 'signed_at'
        )
        read_only_fields = (
            'id', 'original_document_details', 'signed_by_name',
            'signature_hash', 'signed_at', 'file_url'
        )
    
    def get_file_url(self, obj):
        """Get the URL for the signed document file"""
        request = self.context.get('request')
        if obj.signed_file and hasattr(obj.signed_file, 'url') and request:
            return request.build_absolute_uri(obj.signed_file.url)
        return None
