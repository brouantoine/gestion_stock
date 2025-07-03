
from django.utils import timezone
from api.models import Statistique, CommandeClient, Produit
from django.db.models import Sum, Count, Q, F

def update_daily_stats():
    """Met à jour les statistiques du jour"""
    today = timezone.now().date()
    stats, _ = Statistique.objects.get_or_create(date=today)
    
    # Commandes clients
    stats.total_ventes = CommandeClient.objects.filter(
        date_creation__date=today,
        statut__in=['VALIDEE', 'LIVREE']
    ).count()
    
    # Produits en alerte
    stats.produits_en_alerte = Produit.objects.filter(
        quantite_stock__lte=F('seuil_alerte'),
        quantite_stock__gt=0
    ).count()
    
    stats.save()