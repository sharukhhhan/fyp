import os
import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.conf import settings
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

class UserManager(BaseUserManager):
    """Manager for custom User model"""
    
    def create_user(self, email, password=None, **extra_fields):
        """Create and save a new user"""
        if not email:
            raise ValueError('User must have an email address')
        
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        """Create and save a new superuser"""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')
        
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """Custom user model"""
    ROLE_CHOICES = (
        ('user', 'User'),
        ('notary', 'Notary'),
        ('admin', 'Administrator'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(_('email address'), unique=True)
    full_name = models.CharField(_('full name'), max_length=255)
    role = models.CharField(_('role'), max_length=10, choices=ROLE_CHOICES, default='user')
    is_verified = models.BooleanField(_('verified'), default=False)
    is_active = models.BooleanField(_('active'), default=True)
    is_staff = models.BooleanField(_('staff status'), default=False)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    
    objects = UserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']
    
    class Meta:
        verbose_name = _('user')
        verbose_name_plural = _('users')
        
    def __str__(self):
        return self.email


def document_file_path(instance, filename):
    """Generate file path for new document"""
    ext = os.path.splitext(filename)[1]
    filename = f"{uuid.uuid4()}{ext}"
    
    # Если это перевод, сохраняем в отдельную папку
    if instance.source == 'translation':
        return os.path.join('uploads/translated_documents/', filename)
    else:
        return os.path.join('uploads/documents/', filename)


class Document(models.Model):
    """Document model for storing identity documents or documents for verification"""
    TYPE_CHOICES = (
        ('passport', 'Passport'),
        ('driver_license', 'Driver License'),
        ('custom', 'Custom Document'),
    )
    
    SOURCE_CHOICES = (
        ('upload', 'Загружен пользователем'),
        ('ai_generated', 'Создан с помощью AI'),
        ('template', 'Создан из шаблона'),
        ('translation', 'Перевод другого документа'),
    )
    
    LANGUAGE_CHOICES = (
        ('ru', 'Русский'),
        ('kg', 'Кыргызский'),
        ('en', 'English'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='documents'
    )
    file = models.FileField(_('file'), upload_to=document_file_path)
    title = models.CharField(_('title'), max_length=255)
    type = models.CharField(_('type'), max_length=15, choices=TYPE_CHOICES, default='custom')
    source = models.CharField(_('source'), max_length=20, choices=SOURCE_CHOICES, default='upload')
    language = models.CharField(_('language'), max_length=2, choices=LANGUAGE_CHOICES, default='ru')
    is_verified = models.BooleanField(_('verified'), default=False)
    uploaded_at = models.DateTimeField(_('uploaded at'), auto_now_add=True)
    
    # Поля для AI-сгенерированных документов
    generation_prompt = models.TextField(_('generation prompt'), blank=True, null=True)
    generation_history = models.JSONField(_('generation history'), blank=True, null=True)
    revision_count = models.IntegerField(_('revision count'), default=0)
    
    # Поля для финализации
    is_finalized = models.BooleanField(_('finalized'), default=False)
    finalized_at = models.DateTimeField(_('finalized at'), null=True, blank=True)
    
    # Поля для документов-переводов
    original_document = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='translations'
    )
    source_language = models.CharField(
        _('source language'), 
        max_length=2, 
        choices=LANGUAGE_CHOICES, 
        null=True, 
        blank=True
    )
    translation_timestamp = models.DateTimeField(_('translation date'), null=True, blank=True)
    translation_model = models.CharField(_('translation model'), max_length=50, blank=True, null=True)
    
    class Meta:
        verbose_name = _('document')
        verbose_name_plural = _('documents')
        indexes = [
            models.Index(fields=['source', 'language']),
            models.Index(fields=['source', 'original_document']),
        ]
        
    def __str__(self):
        return f"{self.title} [{self.get_language_display()}] - {self.user.email}"
    
    def save(self, *args, **kwargs):
        """Переопределяем save чтобы автоматически устанавливать нужные поля для переводов"""
        if self.source == 'translation' and self.original_document:
            # Автоматически устанавливаем source_language из оригинального документа
            if not self.source_language:
                self.source_language = self.original_document.language
            
            # Устанавливаем timestamp перевода если его еще нет
            if not self.translation_timestamp:
                self.translation_timestamp = timezone.now()
            
            # Автоматически генерируем название если оно не задано
            if not self.title:
                self.title = f"{self.original_document.title} ({self.original_document.get_language_display()} → {self.get_language_display()})"
        
        super().save(*args, **kwargs)

class VerificationRequest(models.Model):
    """Model for verification requests"""
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('signed', 'Signed'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document = models.ForeignKey(
        Document,
        on_delete=models.CASCADE,
        related_name='verification_requests'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='verification_requests'
    )
    notary = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='handled_requests'
    )
    status = models.CharField(_('status'), max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    notes = models.TextField(_('notes'), blank=True)
    
    class Meta:
        verbose_name = _('verification request')
        verbose_name_plural = _('verification requests')
        
    def __str__(self):
        return f"Request for {self.document.title} - {self.status}"

class NotaryProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notary_profile'
    )
    license_number = models.CharField(max_length=50, unique=True)
    jurisdiction = models.CharField(max_length=100)
    verified_at = models.DateTimeField(null=True, blank=True)
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='verified_notaries'
    )

    class Meta:
        verbose_name = _('notary profile')
        verbose_name_plural = _('notary profiles')

    def __str__(self):
        return f"Notary: {self.user.full_name}"

    @property
    def is_verified(self):
        return bool(self.verified_at)

class VideoSession(models.Model):
    """Model for video sessions between user and notary"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    request = models.OneToOneField(
        VerificationRequest,
        on_delete=models.CASCADE,
        related_name='video_session'
    )
    room_url = models.CharField(_('room URL'), max_length=255)
    room_id = models.CharField(_('room ID'), max_length=100, unique=True)
    scheduled_time = models.DateTimeField(_('scheduled time'), null=True, blank=True)
    start_time = models.DateTimeField(_('start time'), null=True, blank=True)
    end_time = models.DateTimeField(_('end time'), null=True, blank=True)
    is_active = models.BooleanField(_('active'), default=True)
    moderator_token = models.CharField(_('moderator token'), max_length=255, blank=True)
    participant_token = models.CharField(_('participant token'), max_length=255, blank=True)
    
    class Meta:
        verbose_name = _('video session')
        verbose_name_plural = _('video sessions')
        
    def __str__(self):
        return f"Session for request {self.request.id}"
    
    def save(self, *args, **kwargs):
        """Generate room ID and URL if not provided"""
        # Convert scheduled_time to datetime if it's a string
        if isinstance(self.scheduled_time, str):
            try:
                self.scheduled_time = timezone.datetime.fromisoformat(
                    self.scheduled_time.replace('Z', '+00:00')
                )
            except ValueError:
                self.scheduled_time = None
        
        if not self.room_id:
            self.room_id = f"notary-{uuid.uuid4().hex[:12]}"
        
        if not self.room_url:
            base_url = settings.VIDEO_CONFERENCE_BASE_URL.rstrip('/')
            self.room_url = f"{base_url}/{self.room_id}"

        # Generate tokens if not present
        if not self.moderator_token:
            self.moderator_token = str(uuid.uuid4())
        if not self.participant_token:
            self.participant_token = str(uuid.uuid4())
            
        super().save(*args, **kwargs)


def signed_document_file_path(instance, filename):
    """Generate file path for signed documents"""
    ext = os.path.splitext(filename)[1]
    filename = f"signed_{uuid.uuid4()}{ext}"
    return os.path.join('uploads/signed_documents/', filename)


class SignedDocument(models.Model):
    """Model for storing signed documents"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    original_document = models.ForeignKey(
        Document,
        on_delete=models.CASCADE,
        related_name='signed_versions'
    )
    signed_file = models.FileField(_('signed file'), upload_to=signed_document_file_path)
    signature_hash = models.CharField(_('signature hash'), max_length=255)
    signed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='signed_documents'
    )
    signed_at = models.DateTimeField(_('signed at'), default=timezone.now)
    
    class Meta:
        verbose_name = _('signed document')
        verbose_name_plural = _('signed documents')
        
    def __str__(self):
        return f"Signed {self.original_document.title}"


def identity_document_file_path(instance, filename):
    """Generate file path for identity documents"""
    ext = os.path.splitext(filename)[1]
    filename = f"{uuid.uuid4()}{ext}"
    print(os.path.join('uploads/identity_documents', instance.type, filename))
    return os.path.join('uploads/identity_documents', instance.type, filename)

class IdentityDocument(models.Model):
    """Model for storing user identity documents (passport, driver's license)"""
    TYPE_CHOICES = (
        ('passport', 'Passport'),
        ('driver_license', 'Driver License'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='identity_documents'
    )
    # TODO: проверить, почему не сохраняется в uploads/identity_documents и в таблицу SQL
    file = models.FileField(
        _('file'),
        upload_to=identity_document_file_path
    )
    type = models.CharField(_('type'), max_length=15, choices=TYPE_CHOICES)
    document_number = models.CharField(_('document number'), max_length=30)
    full_name = models.CharField(_('full name'), max_length=255)
    date_of_birth = models.DateField(_('date of birth'))
    issue_date = models.DateField(_('issue date'))
    expiry_date = models.DateField(_('expiry date'), null=True, blank=True)
    is_verified = models.BooleanField(_('verified'), default=False)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    
    class Meta:
        verbose_name = _('identity document')
        verbose_name_plural = _('identity documents')
        unique_together = ('user', 'type')
        
    def __str__(self):
        return f"{self.get_type_display()} - {self.user.email}"
    


class GeneratedDocument(models.Model):
    """Model for AI-generated documents based on templates"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='generated_documents'
    )
    title = models.CharField(_('title'), max_length=255)
    content = models.TextField(_('content'))
    file = models.FileField(
        _('file'), 
        upload_to='uploads/generated_documents/', 
        null=True, 
        blank=True
    )
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    is_finalized = models.BooleanField(_('finalized'), default=False)
    
    class Meta:
        verbose_name = _('generated document')
        verbose_name_plural = _('generated documents')
        
    def __str__(self):
        return f"{self.title} - {self.user.email}"