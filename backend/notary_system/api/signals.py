from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from django.core.mail import send_mail
from django.utils.translation import gettext_lazy as _
from django.utils import timezone

from .models import User, VerificationRequest, VideoSession, SignedDocument


@receiver(post_save, sender=User)
def send_welcome_email(sender, instance, created, **kwargs):
    """Send welcome email when a new user is created"""
    if created and settings.EMAIL_HOST_USER:
        subject = _('Welcome to Online Notary System')
        message = _(
            f'Hello {instance.full_name},\n\n'
            f'Thank you for registering with our Online Notary System. '
            f'You can now upload documents and request notarization services.\n\n'
            f'Best regards,\nThe Online Notary Team'
        )
        
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [instance.email],
            fail_silently=True,
        )


@receiver(post_save, sender=VerificationRequest)
def notify_verification_request(sender, instance, created, **kwargs):
    """Send notifications when verification request status changes"""
    # Skip if email settings are not configured
    if not settings.EMAIL_HOST_USER:
        return
    
    if created:
        # Notify admin/notaries about new request
        admin_users = User.objects.filter(role__in=['admin', 'notary'])
        
        if admin_users.exists():
            admin_emails = [user.email for user in admin_users]
            
            subject = _('New Verification Request')
            message = _(
                f'A new verification request has been submitted by {instance.user.full_name} '
                f'for document "{instance.document.title}".\n\n'
                f'Please log in to the system to review it.'
            )
            
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                admin_emails,
                fail_silently=True,
            )
        
        # Notify user about request submission
        user_subject = _('Verification Request Submitted')
        user_message = _(
            f'Hello {instance.user.full_name},\n\n'
            f'Your verification request for "{instance.document.title}" has been submitted successfully. '
            f'A notary will review your request soon.\n\n'
            f'Best regards,\nThe Online Notary Team'
        )
        
        send_mail(
            user_subject,
            user_message,
            settings.DEFAULT_FROM_EMAIL,
            [instance.user.email],
            fail_silently=True,
        )
    
    else:
        # Status changed - notify the user
        if instance.status in ['approved', 'rejected', 'signed']:
            status_map = {
                'approved': _('approved'),
                'rejected': _('rejected'),
                'signed': _('signed')
            }
            
            status_text = status_map.get(instance.status, instance.status)
            
            subject = _('Verification Request Status Update')
            message = _(
                f'Hello {instance.user.full_name},\n\n'
                f'Your verification request for "{instance.document.title}" has been {status_text}.'
            )
            
            if instance.status == 'rejected' and instance.notes:
                message += _('\n\nReason: {0}').format(instance.notes)
                
            if instance.status == 'approved':
                message += _(
                    '\n\nThe notary will schedule a video session for the final verification. '
                    'You will receive an email notification with the session details.'
                )
                
            message += _('\n\nBest regards,\nThe Online Notary Team')
            
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [instance.user.email],
                fail_silently=True,
            )


@receiver(post_save, sender=VideoSession)
def notify_video_session(sender, instance, created, **kwargs):
    """Send notifications when a video session is created or updated"""
    if not settings.EMAIL_HOST_USER:
        return
    
    if created and instance.scheduled_time:
        user = instance.request.user
        notary = instance.request.notary
        
        # Convert string to datetime if needed
        scheduled_time = instance.scheduled_time
        if isinstance(scheduled_time, str):
            try:
                scheduled_time = timezone.datetime.fromisoformat(scheduled_time.replace('Z', '+00:00'))
            except ValueError:
                # Fallback if parsing fails
                scheduled_time = timezone.now()
        
        # Format datetime for email
        formatted_time = scheduled_time.strftime("%d %B %Y, %H:%M") if hasattr(scheduled_time, "strftime") else str(scheduled_time)
        
        # Notify user
        user_subject = _('Video Session Scheduled')
        user_message = _(
            f'Hello {user.full_name},\n\n'
            f'A video session has been scheduled for your verification request for "{instance.request.document.title}".\n\n'
            f'Date and Time: {formatted_time}\n'
            f'Session Link: {instance.room_url}\n\n'
            f'Please be online at the scheduled time. '
            f'If you need to reschedule, please contact us.\n\n'
            f'Best regards,\nThe Online Notary Team'
        )
        
        send_mail(
            user_subject,
            user_message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=True,
        )
        
        # Notify notary
        if notary:
            notary_subject = _('Video Session Scheduled')
            notary_message = _(
                f'Hello {notary.full_name},\n\n'
                f'A video session has been scheduled for verification request from {user.full_name} '
                f'for document "{instance.request.document.title}".\n\n'
                f'Date and Time: {instance.scheduled_time.strftime("%d %B %Y, %H:%M")}\n'
                f'Session Link: {instance.room_url}\n\n'
                f'Best regards,\nThe Online Notary Team'
            )
            
            send_mail(
                notary_subject,
                notary_message,
                settings.DEFAULT_FROM_EMAIL,
                [notary.email],
                fail_silently=True,
            )
    
    elif not created and instance.start_time and not instance.end_time:
        # Session started notification
        user = instance.request.user
        
        user_subject = _('Your Video Session Has Started')
        user_message = _(
            f'Hello {user.full_name},\n\n'
            f'Your scheduled video session for document verification has started.\n\n'
            f'Session Link: {instance.room_url}\n\n'
            f'Please join now if you haven\'t already.\n\n'
            f'Best regards,\nThe Online Notary Team'
        )
        
        send_mail(
            user_subject,
            user_message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=True,
        )


@receiver(post_save, sender=SignedDocument)
def notify_document_signed(sender, instance, created, **kwargs):
    """Send notification when a document is signed"""
    # Skip if email settings are not configured or if not a new record
    if not settings.EMAIL_HOST_USER or not created:
        return
    
    # Get the document owner
    user = instance.original_document.user
    
    subject = _('Document Successfully Signed and Notarized')
    message = _(
        f'Hello {user.full_name},\n\n'
        f'Your document "{instance.original_document.title}" has been successfully signed and notarized '
        f'by {instance.signed_by.full_name}.\n\n'
        f'You can log in to the system to download your signed document.\n\n'
        f'Document Hash: {instance.signature_hash}\n'
        f'Signed Date: {instance.signed_at.strftime("%d %B %Y, %H:%M") if hasattr(instance.signed_at, "strftime") else instance.signed_at}\n\n'
        f'Best regards,\nThe Online Notary Team'
    )
    
    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=True,
    )