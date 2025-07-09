from django.core.management.base import BaseCommand
from django.apps import apps
from api.models import Module

class Command(BaseCommand):
    help = 'Initialize modules and assign them to models'

    def handle(self, *args, **options):
        # Créer tous les modules définis
        for code, name in Module.CODE_MODULES:
            Module.objects.get_or_create(code=code, defaults={'nom': name})
        
        # Assigner les modules aux modèles existants
        for model in apps.get_models():
            if hasattr(model, 'get_module_code'):
                module_code = model.get_module_code()
                if module_code:
                    module = Module.objects.get(code=module_code)
                    model.objects.filter(module__isnull=True).update(module=module)
        
        self.stdout.write(self.style.SUCCESS('Modules initialisés avec succès'))