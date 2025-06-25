# management/commands/init_modules.py
from django.core.management.base import BaseCommand
from api import Module

MODULES = [
    {'code': 'PRODUCTS', 'name': 'Produits'},
    {'code': 'SALES', 'name': 'Ventes'},
    {'code': 'ORDERS', 'name': 'Commandes'},
    {'code': 'CUSTOMERS', 'name': 'Clients'},
    {'code': 'REPORTS', 'name': 'Statistiques'},
]

class Command(BaseCommand):
    def handle(self, *args, **options):
        for module in MODULES:
            Module.objects.get_or_create(**module)
        self.stdout.write(self.style.SUCCESS('Modules initialisés'))