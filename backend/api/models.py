# models.py
import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator
from datetime import datetime
from api import permissions


class Taxe(models.Model):
    nom = models.CharField(max_length=50)
    taux = models.DecimalField(max_digits=5, decimal_places=2)  # 20.00 pour 20%
    code_comptable = models.CharField(max_length=20, blank=True)
    
from django.contrib.auth.models import AbstractUser, Group, Permission
from django.db import models

class Utilisateur(AbstractUser):
    ROLES = (
        ('admin', 'Administrateur'),
        ('gestionnaire', 'Gestionnaire de stock'),
        ('vendeur', 'Vendeur'),
    )
    role = models.CharField(max_length=20, choices=ROLES, default='vendeur')
    telephone = models.CharField(max_length=20, blank=True, null=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    est_actif = models.BooleanField(default=True)
    
    # Relations many-to-many pour les permissions spécifiques
    custom_permissions = models.ManyToManyField(
        Permission,
        verbose_name='Permissions personnalisées',
        blank=True,
        related_name='utilisateurs_custom'
    )
    
    def __str__(self):
        return f"{self.get_full_name()} ({self.role})"

    class Meta:
        verbose_name = "Utilisateur"
        verbose_name_plural = "Utilisateurs"
        permissions = [
            ("manage_users", "Peut gérer les utilisateurs"),
            ("reset_password", "Peut réinitialiser les mots de passe"),
            ("change_role", "Peut modifier les rôles"),
        ]


from django.db import models
from django.core.validators import MinValueValidator
import uuid
from datetime import datetime

class Commande(models.Model):
    STATUS_CHOICES = [
        ('BROUILLON', 'Brouillon'),
        ('VALIDEE', 'Validée'),
        ('LIVREE', 'Livrée'),
        ('ANNULEE', 'Annulée'),
    ]
    
    code_commande = models.CharField(max_length=20, unique=True, editable=False)
    fournisseur = models.ForeignKey('Fournisseur', on_delete=models.PROTECT, related_name='commandes')
    type_produit = models.CharField(max_length=50)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_validation = models.DateTimeField(null=True, blank=True)
    statut = models.CharField(max_length=20, choices=STATUS_CHOICES, default='BROUILLON')
    utilisateur = models.ForeignKey('Utilisateur', on_delete=models.PROTECT)
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"{self.code_commande} - {self.fournisseur.nom_fournisseur}"

    def generate_code(self):
        date_part = self.date_creation.strftime('%Y%m%d')
        unique_part = uuid.uuid4().hex[:6].upper()
        return f"CMD-{date_part}-{unique_part}"

    def save(self, *args, **kwargs):
        if not self.code_commande:
            self.code_commande = self.generate_code()
        super().save(*args, **kwargs)

    @property
    def prix_total(self):
        return sum(ligne.total_ligne_ht for ligne in self.lignes.all())

class LigneCommande(models.Model):
    STATUT_LIVRAISON_CHOICES = [
        ('A_LIVRER', 'À livrer'),
        ('PARTIELLE', 'Livraison partielle'),
        ('LIVREE', 'Livrée'),
    ]
    
    commande = models.ForeignKey(Commande, on_delete=models.CASCADE, related_name='lignes')
    produit = models.ForeignKey('Produit', on_delete=models.PROTECT, related_name='lignecommandes')
    quantite = models.IntegerField(validators=[MinValueValidator(1)])
    prix_unitaire = models.DecimalField(max_digits=10, decimal_places=2)
    remise_ligne = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    date_livraison_prevue = models.DateField(null=True, blank=True)
    statut_livraison = models.CharField(
        max_length=20, 
        choices=STATUT_LIVRAISON_CHOICES, 
        default='A_LIVRER'
    )

    def __str__(self):
        return f"{self.quantite}x {self.produit.reference}"

    @property
    def total_ligne_ht(self):
        return (self.quantite * self.prix_unitaire) * (1 - self.remise_ligne / 100)

class Client(models.Model):
    nom_client = models.CharField(max_length=255)
    adresse = models.TextField()
    code_postal = models.CharField(max_length=10)
    ville = models.CharField(max_length=100)
    pays = models.CharField(max_length=100, default="France")
    telephone = models.CharField(max_length=20)
    email = models.EmailField()
    siret = models.CharField(max_length=14, blank=True, null=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True, null=True)
    is_direct = models.BooleanField(default=False) 
    def __str__(self):
        return self.nom_client

class Fournisseur(models.Model):
    nom_fournisseur = models.CharField(max_length=255)
    adresse = models.TextField()
    code_postal = models.CharField(max_length=10)
    ville = models.CharField(max_length=100)
    pays = models.CharField(max_length=100, default="France")
    telephone = models.CharField(max_length=20)
    email = models.EmailField()
    siret = models.CharField(max_length=14)
    date_creation = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.nom_fournisseur

class Categorie(models.Model):
    nom = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.nom

from django.db import models

from django.db import models

class Produit(models.Model):
    UNITE_CHOICES = (
        ('unite', 'Unité'),
        ('kg', 'Kilogramme'),
        ('g', 'Gramme'),
        ('l', 'Litre'),
        ('m', 'Mètre'),
    )
    categorie = models.ForeignKey('Categorie', on_delete=models.SET_NULL, null=True)
    reference = models.CharField(max_length=50, unique=True, blank=True)
    designation = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    prix_achat = models.DecimalField(max_digits=10, decimal_places=2, default=0, blank=True, null=True)
    prix_vente = models.DecimalField(max_digits=10, decimal_places=2)
    quantite_stock = models.IntegerField(default=0)
    seuil_alerte = models.IntegerField(default=5)
    unite_mesure = models.CharField(max_length=10, choices=UNITE_CHOICES, default='unite')
    date_creation = models.DateTimeField(auto_now_add=True)
    est_actif = models.BooleanField(default=True, verbose_name="Actif")
    image = models.ImageField(upload_to='produits/', blank=True)
    code_barre = models.CharField(max_length=50, blank=True)
    tva = models.ForeignKey(Taxe, on_delete=models.PROTECT, null=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['reference'],
                name='unique_reference'
            )
        ]

    def save(self, *args, **kwargs):
        """Génère automatiquement la référence à la création uniquement"""
        if not self.pk and not self.reference:
            prefix = "PRD"
            last_id = Produit.objects.order_by('-id').values_list('id', flat=True).first() or 0
            self.reference = f"{prefix}{str(last_id + 1).zfill(5)}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.designation} ({self.reference})"
    
    def delete(self, *args, **kwargs):
        """Override delete to archive instead"""
        if self.can_be_deleted():
            return super().delete(*args, **kwargs)
        self.est_actif = False
        self.save()
        return (1, {}) 
    
    def can_be_deleted(self):
        """Vérifie si le produit peut être supprimé"""
        return not self.lignecommandes.exists()

    def mark_as_inactive(self):
        """Marque le produit comme inactif au lieu de le supprimer"""
        self.est_actif = False
        self.save()
        return True

class MouvementStock(models.Model):
    TYPE_MOUVEMENT = (
        ('entree', 'Entrée'),
        ('sortie', 'Sortie'),
        ('ajustement', 'Ajustement'),
    )
    produit = models.ForeignKey(Produit, on_delete=models.PROTECT, related_name='mouvements')
    utilisateur = models.ForeignKey(Utilisateur, on_delete=models.PROTECT)
    commande = models.ForeignKey(Commande, on_delete=models.SET_NULL, null=True, blank=True)
    fournisseur = models.ForeignKey(Fournisseur, on_delete=models.SET_NULL, null=True, blank=True)
    type_mouvement = models.CharField(max_length=20, choices=TYPE_MOUVEMENT)
    quantite = models.IntegerField()
    date_mouvement = models.DateTimeField(auto_now_add=True)
    motif = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.type_mouvement} de {self.quantite} {self.produit.unite_mesure} pour {self.produit}"

    from django.db import models
from django.utils import timezone
from django.db import transaction
from django.db.models import Count, Sum, Q

class Statistique(models.Model):
    """Modèle pour stocker les statistiques quotidiennes pré-calculées"""
    date = models.DateField(unique=True)
    
    # Données brutes (non agrégées)
    nb_commandes = models.IntegerField(default=0)  # Commandes fournisseurs
    nb_ventes = models.IntegerField(default=0)     # Commandes clients
    
    # Détails des ventes
    nb_ventes_directes = models.IntegerField(default=0)
    nb_commandes_clients = models.IntegerField(default=0)
    
    # Chiffres d'affaires
    montant_total = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    montant_ventes_directes = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    montant_commandes = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    # Autres métriques
    nouveaux_clients = models.IntegerField(default=0)
    nouveaux_fournisseurs = models.IntegerField(default=0)
    produits_actifs = models.IntegerField(default=0)
    mouvements_stock = models.IntegerField(default=0)
    produits_rupture = models.IntegerField(default=0)
    produits_alerte = models.IntegerField(default=0)
    utilisateurs_actifs = models.IntegerField(default=0)

    class Meta:
        verbose_name = "Statistique quotidienne"
        verbose_name_plural = "Statistiques quotidiennes"
        ordering = ['-date']

    def __str__(self):
        return f"Stats du {self.date.strftime('%d/%m/%Y')}"

    @classmethod
    def update_daily_stats(cls):
        """Met à jour les stats pour la journée actuelle"""
        from api.models import Commande, CommandeClient, Client, Fournisseur, Produit, MouvementStock, Utilisateur
        
        today = timezone.now().date()
        
        with transaction.atomic():
            stats, created = cls.objects.get_or_create(date=today)
            
            # Commandes fournisseurs
            stats.nb_commandes = Commande.objects.filter(
                date_creation__date=today
            ).count()
            
            # Commandes clients
            ventes_data = CommandeClient.objects.filter(
                date_creation__date=today,
                statut__in=['VALIDEE', 'LIVREE']
            ).aggregate(
                total=Count('id'),
                ventes_directes=Count('id', filter=Q(client__isnull=True) | Q(client__id='3')),
                montant_total=Sum('total_commande'),
                montant_direct=Sum('total_commande', filter=Q(client__isnull=True) | Q(client__id='3'))
            )
            
            stats.nb_ventes = ventes_data['total'] or 0
            stats.nb_ventes_directes = ventes_data['ventes_directes'] or 0
            stats.nb_commandes_clients = stats.nb_ventes - stats.nb_ventes_directes
            stats.montant_total = ventes_data['montant_total'] or 0
            stats.montant_ventes_directes = ventes_data['montant_direct'] or 0
            stats.montant_commandes = stats.montant_total - stats.montant_ventes_directes
            
            # Autres métriques
            stats.nouveaux_clients = Client.objects.filter(
                date_creation__date=today
            ).count()
            
            stats.nouveaux_fournisseurs = Fournisseur.objects.filter(
                date_creation__date=today
            ).count()
            
            stats.produits_actifs = Produit.objects.filter(
                est_actif=True
            ).count()
            
            stats.produits_rupture = Produit.objects.filter(
                quantite_stock=0
            ).count()
            
            stats.produits_alerte = Produit.objects.filter(
                quantite_stock__gt=0,
                quantite_stock__lte=models.F('seuil_alerte')
            ).count()
            
            stats.mouvements_stock = MouvementStock.objects.filter(
                date_mouvement__date=today
            ).count()
            
            stats.utilisateurs_actifs = Utilisateur.objects.filter(
                est_actif=True
            ).count()
            
            stats.save()
        
        return stats

    
    
from django.db import models
from django.contrib.auth import get_user_model

class ActivityLog(models.Model):
    ACTION_CHOICES = [
        ('LOGIN', 'Connexion'),
        ('LOGOUT', 'Déconnexion'),
        ('CREATE', 'Création'),
        ('UPDATE', 'Mise à jour'),
        ('DELETE', 'Suppression'),
    ]

    user = models.ForeignKey(get_user_model(), on_delete=models.CASCADE)
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    details = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        ordering = ['-timestamp']
        verbose_name = "Log d'activité"
        verbose_name_plural = "Logs d'activité"

    def __str__(self):
        return f"{self.user} - {self.get_action_display()} à {self.timestamp}"
    
class Vente(models.Model):
    STATUS_CHOICES = [
        ('BROUILLON', 'Brouillon'),
        ('VALIDEE', 'Validée'),
        ('PAYEE', 'Payée'),
        ('ANNULEE', 'Annulée'),
    ]
    
    client = models.ForeignKey(Client, on_delete=models.PROTECT)
    date_vente = models.DateTimeField(auto_now_add=True)
    statut = models.CharField(max_length=20, choices=STATUS_CHOICES, default='BROUILLON')
    utilisateur = models.ForeignKey(Utilisateur, on_delete=models.PROTECT)
    remise = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    notes = models.TextField(blank=True)
    numero_facture = models.CharField(max_length=20, unique=True, blank=True)
    # Ajouter dans les deux modèles
    tva = models.ForeignKey(Taxe, on_delete=models.PROTECT)
    date_echeance = models.DateField(blank=True, null=True)  # Pour paiement

class LigneVente(models.Model):
    vente = models.ForeignKey(Vente, on_delete=models.CASCADE, related_name='lignes')
    produit = models.ForeignKey(Produit, on_delete=models.PROTECT)
    quantite = models.IntegerField(validators=[MinValueValidator(1)])
    prix_unitaire = models.DecimalField(max_digits=10, decimal_places=2)

class Inventaire(models.Model):
    date = models.DateTimeField(auto_now_add=True)
    responsable = models.ForeignKey(Utilisateur, on_delete=models.PROTECT)
    complet = models.BooleanField(default=False)

class LigneInventaire(models.Model):
    inventaire = models.ForeignKey(Inventaire, on_delete=models.CASCADE)
    produit = models.ForeignKey(Produit, on_delete=models.PROTECT)
    quantite_theorique = models.IntegerField()
    quantite_reelle = models.IntegerField()
    ecart = models.IntegerField(default=0)

class Parametres(models.Model):
    seuil_alerte_defaut = models.IntegerField(default=5)
    tva_par_defaut = models.ForeignKey(Taxe, on_delete=models.PROTECT)
    logo = models.ImageField(upload_to='logos/', blank=True)


class Emplacement(models.Model):
    nom = models.CharField(max_length=100)
    adresse = models.TextField()

class StockProduit(models.Model):
    produit = models.ForeignKey(Produit, on_delete=models.CASCADE)
    emplacement = models.ForeignKey(Emplacement, on_delete=models.CASCADE)
    quantite = models.IntegerField(default=0)


from django.db import models
from django.core.validators import MinValueValidator

class CommandeClient(models.Model):
    STATUT_CHOICES = [
        ('BROUILLON', 'Brouillon (panier non validé)'),
        ('VALIDEE', 'Validée par le client'),
        ('EN_PREPARATION', 'En préparation'),
        ('PRETE', 'Prête pour retrait/livraison'),
        ('LIVREE', 'Livrée'),
        ('ANNULEE', 'Annulée'),
    ]

    MODE_RETRAIT = [
        ('MAGASIN', 'Retrait en magasin'),
        ('LIVRAISON', 'Livraison à domicile'),
    ]

    # Identifiant unique (ex: "CMD-2023-001")
    numero_commande = models.CharField(max_length=20, unique=True, blank=True)
    client = models.ForeignKey('Client', on_delete=models.PROTECT, related_name='commandes')
    utilisateur = models.ForeignKey('Utilisateur', on_delete=models.PROTECT, null=True, blank=True)  # Vendeur/Caissier
    
    # Logistique
    mode_retrait = models.CharField(max_length=10, choices=MODE_RETRAIT, default='MAGASIN')
    adresse_livraison = models.TextField(blank=True)  # Si livraison
    date_creation = models.DateTimeField(auto_now_add=True)
    date_livraison_prevue = models.DateTimeField(null=True, blank=True)
    date_livraison_reelle = models.DateTimeField(null=True, blank=True)
    
    # État
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='BROUILLON')
    est_payee = models.BooleanField(default=False)
    
    # Financier
    remise = models.DecimalField(max_digits=5, decimal_places=2, default=0)  # Remise globale en %
    tva = models.ForeignKey('Taxe', on_delete=models.PROTECT)
    notes = models.TextField(blank=True)
    total_commande = models.DecimalField(max_digits=10, decimal_places=2, default=0, blank=True)  # Total TTC
    class Meta:
        verbose_name = "Commande client"
        ordering = ['-date_creation']

    def __str__(self):
        return f"Commande {self.numero_commande} - {self.client.nom_client}"

    def save(self, *args, **kwargs):
        """Sauvegarde la commande sans essayer de calculer le total immédiatement"""
        if not self.numero_commande:
            prefix = "CMD"
            last_id = CommandeClient.objects.order_by('-id').values_list('id', flat=True).first() or 0
            self.numero_commande = f"{prefix}-{str(last_id + 1).zfill(3)}"
        
        # Sauvegarde d'abord pour obtenir un ID
        super().save(*args, **kwargs)
        
        # Calcule le total seulement si la commande existe déjà
        if self.pk:
            self.total_commande = self.total_ttc
            super().save(update_fields=['total_commande'])

    @property
    def total_ht(self):
        if not self.pk:  # Si la commande n'est pas encore sauvegardée
            return 0
        return sum(ligne.sous_total_ht for ligne in self.lignes.all())

    @property
    def total_ttc(self):
        if not self.pk or not hasattr(self, 'tva'):  # Si pas sauvegardé ou pas de TVA
            return 0
        return self.total_ht * (1 + self.tva.taux / 100)
    

class LigneCommandeClient(models.Model):
    commande = models.ForeignKey(CommandeClient, on_delete=models.CASCADE, related_name='lignes')
    produit = models.ForeignKey('Produit', on_delete=models.SET_NULL, null=True)
    quantite = models.IntegerField(validators=[MinValueValidator(1)])
    prix_unitaire = models.DecimalField(max_digits=10, decimal_places=2)  # Prix au moment de la commande
    remise_ligne = models.DecimalField(max_digits=5, decimal_places=2, default=0)  # Remise en % par produit

    def __str__(self):
        return f"{self.quantite}x {self.produit.designation}"

    @property
    def sous_total_ht(self):
        try:
            quantite = self.quantite if self.quantite is not None else 0
            prix = self.prix_unitaire if self.prix_unitaire is not None else 0
            remise = self.remise_ligne if self.remise_ligne is not None else 0
            return (quantite * prix) * (1 - remise / 100)
        except (TypeError, AttributeError):
            return 0