from django.contrib import admin
from .models import Produit

from .models import *
admin.site.register([Utilisateur, Client, Fournisseur, Commande, LigneCommande, MouvementStock, Categorie,Taxe, Produit, Statistique])


class ProduitAdmin(admin.ModelAdmin):
    exclude = ('reference',)  # ou utilise exclude = ('reference',) si tu veux le cacher
    list_display = ('designation', 'reference', 'prix_vente', 'quantite_stock')

from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Sum, F, ExpressionWrapper, DecimalField

class LigneCommandeClientInline(admin.TabularInline):
    model = LigneCommandeClient
    extra = 0
    readonly_fields = ('sous_total_ht',)
    fields = ('produit', 'quantite', 'prix_unitaire', 'remise_ligne', 'sous_total_ht')

@admin.register(CommandeClient)
class CommandeClientAdmin(admin.ModelAdmin):
    inlines = [LigneCommandeClientInline]
    readonly_fields = (
        'numero_commande',
        'total_ht',
        'total_ttc',
        'date_creation',
        'display_lignes_summary'
    )
    
    fieldsets = (
        # ... (votre configuration fieldsets existante)
    )

    def display_lignes_summary(self, obj):
        lignes = obj.lignes.annotate(
            st_ht=ExpressionWrapper(
                F('quantite') * F('prix_unitaire') * (1 - F('remise_ligne')/100),
                output_field=DecimalField()
            )
        )
        
        total_ht = lignes.aggregate(total=Sum('st_ht'))['total'] or 0
        
        html = "<h3>Détail des articles</h3>"
        html += "<table><tr><th>Produit</th><th>Quantité</th><th>Prix unitaire</th><th>Remise</th><th>Sous-total HT</th></tr>"
        
        for ligne in lignes:
            html += f"""
            <tr>
                <td>{ligne.produit.designation if ligne.produit else 'N/A'}</td>
                <td>{ligne.quantite if ligne.quantite is not None else 0}</td>
                <td>{ligne.prix_unitaire if ligne.prix_unitaire is not None else 0} €</td>
                <td>{ligne.remise_ligne} %</td>
                <td>{ligne.st_ht:.2f} €</td>
            </tr>
            """
        
        html += f"""
        <tr style='border-top: 2px solid #666;'>
            <td colspan='4'><strong>Total HT</strong></td>
            <td><strong>{total_ht:.2f} €</strong></td>
        </tr>
        <tr>
            <td colspan='4'><strong>TVA ({obj.tva.taux if obj.tva else 0}%)</strong></td>
            <td><strong>{(total_ht * (obj.tva.taux/100 if obj.tva else 0)):.2f} €</strong></td>
        </tr>
        <tr>
            <td colspan='4'><strong>Total TTC</strong></td>
            <td><strong>{(total_ht * (1 + (obj.tva.taux/100 if obj.tva else 0))):.2f} €</strong></td>
        </tr>
        </table>
        """
        return format_html(html)

class RoleChangeLog(models.Model):
    user = models.ForeignKey(Utilisateur, on_delete=models.CASCADE, related_name='role_changes')
    old_role = models.CharField(max_length=20)
    new_role = models.CharField(max_length=20)
    changed_by = models.ForeignKey(Utilisateur, on_delete=models.PROTECT, related_name='modified_roles')
    timestamp = models.DateTimeField(auto_now_add=True)