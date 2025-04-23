from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _


class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'
    verbose_name = _('Online Notary System')
    
    def ready(self):
        """Register signal handlers when the app is ready"""
        import api.signals