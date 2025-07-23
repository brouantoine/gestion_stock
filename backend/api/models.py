# models.py
import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator
from datetime import datetime
from api import permissions


class Taxe(models.Model):
    nom = models.CharField(max_length=50)
    taux = models.DecimalField(max_digits=5, decimal_places=2) 
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
    is_active = models.BooleanField(default=True)

    
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
    def get_nb_commandes(self, start_date, end_date):
        return self.commandes.filter(
            date_creation__range=(start_date, end_date)
        ).count()
    
    def get_total_ca(self, start_date, end_date):
        from django.db.models import Sum, F, DecimalField
        from django.db.models.functions import Coalesce
        
        return self.commandes.filter(
            date_creation__range=(start_date, end_date)
        ).aggregate(
            total=Coalesce(Sum(
                F('lignes__quantite') * F('lignes__prix_unitaire') * (1 - F('lignes__remise_ligne')/100),
                output_field=DecimalField(max_digits=12, decimal_places=2)
            ), 0)
        )['total']

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
    utilisateur = models.ForeignKey('Utilisateur', on_delete=models.PROTECT, related_name='commandes')
    code_commande = models.CharField(max_length=20, unique=True, editable=False)
    fournisseur = models.ForeignKey('Fournisseur', on_delete=models.PROTECT, related_name='commandes')
    type_produit = models.CharField(max_length=50)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_validation = models.DateTimeField(null=True, blank=True)
    statut = models.CharField(max_length=20, choices=STATUS_CHOICES, default='BROUILLON')
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
    total_ligne_ht = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        editable=False,
        default=0
    )
    def __str__(self):
        return f"{self.quantite}x {self.produit.reference}"

    total_ligne_ht = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        editable=False,
        default=0
    )
    def save(self, *args, **kwargs):
        self.total_ligne_ht = (self.quantite * self.prix_unitaire) * (1 - self.remise_ligne / 100)
        super().save(*args, **kwargs)

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
    


from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal

class CommandeClient(models.Model):
    STATUT_CHOICES = [
        ('VALIDEE', 'Validée par le client'),
    ]

    MODE_RETRAIT = [
        ('MAGASIN', 'Retrait en magasin'),
        ('LIVRAISON', 'Livraison à domicile'),
    ]

    numero_commande = models.CharField(max_length=20, unique=True, blank=True)
    client = models.ForeignKey('Client', on_delete=models.PROTECT, related_name='commandes')
    utilisateur = models.ForeignKey('Utilisateur', on_delete=models.PROTECT, null=True, blank=True, related_name='commandes_client')
    tva = models.ForeignKey('Taxe', on_delete=models.PROTECT, null=True, blank=True, default=1)
    mode_retrait = models.CharField(max_length=10, choices=MODE_RETRAIT, default='MAGASIN')
    adresse_livraison = models.TextField(blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_livraison_prevue = models.DateTimeField(null=True, blank=True)
    date_livraison_reelle = models.DateTimeField(null=True, blank=True)
    is_vente_directe = models.BooleanField(default=False)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='VALIDEE')
    est_payee = models.BooleanField(default=True)
    remise = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    total_commande = models.DecimalField(max_digits=10, decimal_places=2, default=0, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        verbose_name = "Commande client"
        ordering = ['-date_creation']

    def __str__(self):
        return f"Commande {self.numero_commande} - {self.client.nom_client if self.client else 'Vente directe'}"

    def save(self, *args, **kwargs):
        if not self.numero_commande:
            prefix = "CMD"
            last_id = CommandeClient.objects.order_by('-id').values_list('id', flat=True).first() or 0
            self.numero_commande = f"{prefix}-{str(last_id + 1).zfill(3)}"
        super().save(*args, **kwargs)

    def can_be_deleted(self):
        return not (self.statut == 'VALIDEE' or self.est_payee)
    
    def add_lignes(self, lignes_data):
        """Méthode pour ajouter des lignes à la commande en évitant les doublons"""
        produits_groupes = {}
        
        for line in lignes_data:
            produit_id = line['produit'].id if hasattr(line['produit'], 'id') else line['produit']
            
            if produit_id in produits_groupes:
                produits_groupes[produit_id]['quantite'] += Decimal(str(line['quantite']))
            else:
                produits_groupes[produit_id] = {
                    'quantite': Decimal(str(line['quantite'])),
                    'prix_unitaire': Decimal(str(line['prix_unitaire'])),
                    'remise_ligne': Decimal(str(line.get('remise_ligne', 0)))
                }

        for produit_id, values in produits_groupes.items():
            LigneCommandeClient.objects.create(
                commande=self,
                produit_id=produit_id,
                quantite=values['quantite'],
                prix_unitaire=values['prix_unitaire'],
                remise_ligne=values['remise_ligne']
            )
        
        self.calculer_total()

    def calculer_total(self):
        """Calcule et met à jour le total de la commande"""
        total = Decimal('0')
        for ligne in self.lignes.all():
            total += (ligne.quantite * ligne.prix_unitaire) * (1 - ligne.remise_ligne / 100)
        
        # Application de la TVA
        tva_rate = self.tva.taux / 100 if self.tva else Decimal('0.20')
        self.total_commande = total * (1 + tva_rate)
        self.save(update_fields=['total_commande'])


class LigneCommandeClient(models.Model):
    commande = models.ForeignKey(CommandeClient, on_delete=models.CASCADE, related_name='lignes')
    produit = models.ForeignKey('Produit', on_delete=models.SET_NULL, null=True)
    quantite = models.IntegerField(validators=[MinValueValidator(1)])
    prix_unitaire = models.DecimalField(max_digits=10, decimal_places=2)
    remise_ligne = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    def __str__(self):
        produit_designation = self.produit.designation if self.produit else "Produit supprimé"
        return f"{self.quantite}x {produit_designation}"
    
    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['commande', 'produit'],
                name='unique_produit_par_commande'
            )
        ]