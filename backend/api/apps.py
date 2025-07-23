from django.apps import AppConfig


class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'

# apps.py
from django.apps import AppConfig

class YourAppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'
    
    def ready(self):
        import api.signals



from django.apps import AppConfig

class ApiConfig(AppConfig):
    name = 'api'

    def ready(self):
        import api.signals  # 👈 charge les signaux automatiquement
