
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db import transaction
from api.models import (
    Commande, CommandeClient, Client, 
    Fournisseur, Produit, MouvementStock
)

@receiver([post_save, post_delete], sender=CommandeClient)
def update_stats_on_commande_client(sender, instance, **kwargs):
    """Met à jour les stats quand une commande client change"""
    from .utils.statistics import update_daily_stats
    transaction.on_commit(update_daily_stats)