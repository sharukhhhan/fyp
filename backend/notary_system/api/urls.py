from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    RegisterNotaryView,
    RegisterUserView,
    CustomTokenObtainPairView,
    UserProfileView,
    DocumentViewSet,
    VerificationRequestViewSet,
    VideoSessionViewSet,
    SignedDocumentViewSet,
    IdentityDocumentViewSet,
    AIChatView
)

# Create a router and register our viewsets
router = DefaultRouter()
router.register(r'documents', DocumentViewSet, basename='document')
router.register(r'requests', VerificationRequestViewSet, basename='request')
router.register(r'sessions', VideoSessionViewSet, basename='session')
router.register(r'signed-documents', SignedDocumentViewSet, basename='signed-document')
router.register(r'identity-documents', IdentityDocumentViewSet, basename='identity-document')

# API URL patterns
urlpatterns = [
    # Authentication endpoints
    path('register/', RegisterUserView.as_view(), name='register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # User profile
    path('profile/', UserProfileView.as_view(), name='profile'),
    
    # AI Chat endpoint
    path('ai-chat/', AIChatView.as_view(), name='ai-chat'),
 

    path('register/notary/', RegisterNotaryView.as_view(), name='register-notary'),
    
    # Include the router URLs
    path('', include(router.urls)),
]