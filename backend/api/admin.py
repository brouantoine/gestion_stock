from django.contrib import admin
from django.utils.html import format_html

from .models import (
    Utilisateur, Client, Fournisseur, Commande, LigneCommande,
    MouvementStock, Categorie, Taxe, Produit, Statistique,
    CommandeClient, LigneCommandeClient
)
from api.models import models

# Enregistrement des modèles de base
admin.site.register([
    Utilisateur, Client, Fournisseur, Commande, LigneCommande,
    MouvementStock, Categorie, Taxe, Produit, Statistique
])

# Admin produit (exemple d’exclusion de champ)
class ProduitAdmin(admin.ModelAdmin):
    exclude = ('reference',)
    list_display = ('designation', 'reference', 'prix_vente', 'quantite_stock')


# INLINE : Détail d’une commande client (affichage simple)
class LigneCommandeClientInline(admin.TabularInline):
    model = LigneCommandeClient
    extra = 0
    readonly_fields = ('produit', 'quantite', 'prix_unitaire', 'remise_ligne')
    fields = ('produit', 'quantite', 'prix_unitaire', 'remise_ligne')


# ADMIN PRINCIPAL : CommandeClient (affichage sans calcul)
@admin.register(CommandeClient)
class CommandeClientAdmin(admin.ModelAdmin):
    inlines = [LigneCommandeClientInline]

    readonly_fields = (
        'numero_commande',
        'date_creation',
        'display_lignes_summary'
    )

    list_display = (
        'id', 'client', 'is_vente_directe', 'statut',
        'utilisateur', 'date_creation'
    )

    list_filter = ('is_vente_directe', 'statut', 'utilisateur')
    search_fields = ('client__nom', 'utilisateur__username')

    def display_lignes_summary(self, obj):
        html = "<h3>Détail des articles enregistrés</h3>"
        html += "<table><tr><th>Produit</th><th>Quantité</th><th>Prix unitaire</th><th>Remise (%)</th></tr>"

        for ligne in obj.lignes.all():
            html += f"""
            <tr>
                <td>{ligne.produit.designation if ligne.produit else 'N/A'}</td>
                <td>{ligne.quantite}</td>
                <td>{ligne.prix_unitaire} €</td>
                <td>{ligne.remise_ligne}</td>
            </tr>
            """

        html += "</table>"
        return format_html(html)

    display_lignes_summary.short_description = "Détails enregistrés"


class RoleChangeLog(models.Model):
    user = models.ForeignKey(Utilisateur, on_delete=models.CASCADE, related_name='role_changes')
    old_role = models.CharField(max_length=20)
    new_role = models.CharField(max_length=20)
    changed_by = models.ForeignKey(Utilisateur, on_delete=models.PROTECT, related_name='modified_roles')
    timestamp = models.DateTimeField(auto_now_add=True)