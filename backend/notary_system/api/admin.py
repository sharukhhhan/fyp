from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from django.utils import timezone

from .models import (
    User,
    Document,
    VerificationRequest,
    VideoSession,
    SignedDocument,
    IdentityDocument,
    NotaryProfile
)


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['email', 'full_name', 'role', 'is_verified', 'created_at']
    list_filter = ['role', 'is_verified']
    search_fields = ['email', 'full_name']
    readonly_fields = ['created_at']

    def get_fieldsets(self, request, obj=None):
        fieldsets = [
            ('User Information', {
                'fields': ('email', 'full_name', 'role', 'is_verified')
            }),
            ('Permissions', {
                'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')
            }),
        ]
        if obj and obj.role == 'notary':
            fieldsets.insert(1, ('Notary Information', {
                'fields': ('notary_profile',)
            }))
        return fieldsets


@admin.register(NotaryProfile)
class NotaryProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'license_number', 'jurisdiction', 'is_verified', 'verified_at']
    list_filter = ['verified_at']
    search_fields = ['user__email', 'user__full_name', 'license_number']
    actions = ['verify_notaries']

    def is_verified(self, obj):
        return bool(obj.verified_at)
    is_verified.boolean = True

    def verify_notaries(self, request, queryset):
        queryset.update(
            verified_at=timezone.now(),
            verified_by=request.user
        )
        # Update associated user accounts
        User.objects.filter(
            notary_profile__in=queryset
        ).update(is_verified=True)
    verify_notaries.short_description = "Verify selected notaries"

@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    """Admin configuration for Document model"""
    list_display = ('title', 'user', 'type', 'is_verified', 'uploaded_at')
    list_filter = ('type', 'is_verified', 'uploaded_at')
    search_fields = ('title', 'user__email', 'user__full_name')
    readonly_fields = ('uploaded_at',)


@admin.register(VerificationRequest)
class VerificationRequestAdmin(admin.ModelAdmin):
    """Admin configuration for VerificationRequest model"""
    list_display = ('id', 'document', 'user', 'notary', 'status', 'created_at', 'updated_at')
    list_filter = ('status', 'created_at')
    search_fields = ('document__title', 'user__email', 'notary__email')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(VideoSession)
class VideoSessionAdmin(admin.ModelAdmin):
    """Admin configuration for VideoSession model"""
    list_display = ('id', 'request', 'room_id', 'scheduled_time', 'start_time', 'end_time', 'is_active')
    list_filter = ('is_active', 'scheduled_time')
    search_fields = ('room_id', 'request__user__email', 'request__notary__email')
    readonly_fields = ('room_id', 'room_url', 'start_time', 'end_time')


@admin.register(SignedDocument)
class SignedDocumentAdmin(admin.ModelAdmin):
    """Admin configuration for SignedDocument model"""
    list_display = ('id', 'original_document', 'signed_by', 'signed_at')
    list_filter = ('signed_at',)
    search_fields = ('original_document__title', 'signed_by__email')
    readonly_fields = ('signature_hash', 'signed_at')


@admin.register(IdentityDocument)
class IdentityDocumentAdmin(admin.ModelAdmin):
    """Admin configuration for IdentityDocument model"""
    list_display = ('id', 'user', 'type', 'document_number', 'is_verified', 'created_at')
    list_filter = ('type', 'is_verified', 'created_at')
    search_fields = ('user__email', 'document_number', 'full_name')
    readonly_fields = ('created_at',)
