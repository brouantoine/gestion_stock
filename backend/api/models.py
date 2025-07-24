# models.py
import uuid
from datetime import datetime
from decimal import Decimal

# Django imports
from django.db import models
from django.contrib.auth.models import AbstractUser, Group, Permission
from django.core.validators import MinValueValidator
from django.utils import timezone
from django.db import transaction
from django.db.models import Count, Sum, Q, F, DecimalField
from django.db.models.functions import Coalesce
from django.contrib.auth import get_user_model

class Taxe(models.Model):
    """Gestion des taxes (TVA, etc.)"""
    nom = models.CharField(max_length=50)  # Nom de la taxe (ex: "TVA 20%")
    taux = models.DecimalField(max_digits=5, decimal_places=2)  # Taux en pourcentage
    code_comptable = models.CharField(max_length=20, blank=True)  # Code compta associé
    
    def __str__(self):
        return f"{self.nom} ({self.taux}%)"

class Utilisateur(AbstractUser):
    """Utilisateur personnalisé avec système de rôles"""
    # Rôles disponibles
    ROLES = (
        ('admin', 'Administrateur'),  # Accès complet
        ('gestionnaire', 'Gestionnaire de stock'),  # Gestion stock
        ('vendeur', 'Vendeur'),  # Ventes seulement
    )
    
    role = models.CharField(max_length=20, choices=ROLES, default='vendeur')
    telephone = models.CharField(max_length=20, blank=True, null=True)  # Tel portable
    date_creation = models.DateTimeField(auto_now_add=True)  # Date d'inscription
    is_active = models.BooleanField(default=True)  # Compte actif ou désactivé
    
    # Permissions custom en plus des groupes
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
        permissions = [
            ("manage_users", "Peut gérer les utilisateurs"),
            ("reset_password", "Peut réinitialiser les mots de passe"),
            ("change_role", "Peut modifier les rôles"),
        ]

    # Stats pour le dashboard
    def get_nb_commandes(self, start_date, end_date):
        """Nombre de commandes passées par cet utilisateur"""
        return self.commandes.filter(
            date_creation__range=(start_date, end_date)
        ).count()
    
    def get_total_ca(self, start_date, end_date):
        """Chiffre d'affaires généré par l'utilisateur"""
        return self.commandes.filter(
            date_creation__range=(start_date, end_date)
        ).aggregate(
            total=Coalesce(Sum(
                F('lignes__quantite') * F('lignes__prix_unitaire') * (1 - F('lignes__remise_ligne')/100),
                output_field=DecimalField(max_digits=12, decimal_places=2)
            ), 0)
        )['total']

class Client(models.Model):
    """Fiche client pour les commandes"""
    nom_client = models.CharField(max_length=255)  # Raison sociale
    adresse = models.TextField()  # Adresse complète
    code_postal = models.CharField(max_length=10)  # Code postal
    ville = models.CharField(max_length=100)  # Ville
    pays = models.CharField(max_length=100, default="France")  # Pays par défaut
    telephone = models.CharField(max_length=20)  # Téléphone principal
    email = models.EmailField()  # Email de contact
    date_creation = models.DateTimeField(auto_now_add=True)  # Date de création fiche
    notes = models.TextField(blank=True, null=True)  # Infos supplémentaires
    is_direct = models.BooleanField(default=False)  # Vente sans client enregistré
    
    def __str__(self):
        return self.nom_client

class Fournisseur(models.Model):
    """Fiche fournisseur pour les approvisionnements"""
    nom_fournisseur = models.CharField(max_length=255)  # Raison sociale
    adresse = models.TextField()  # Adresse complète
    code_postal = models.CharField(max_length=10)  # Code postal
    ville = models.CharField(max_length=100)  # Ville
    pays = models.CharField(max_length=100, default="France")  # Pays par défaut
    telephone = models.CharField(max_length=20)  # Téléphone principal
    email = models.EmailField()  # Email de contact
    siret = models.CharField(max_length=14)  # SIRET obligatoire
    date_creation = models.DateTimeField(auto_now_add=True)  # Date création fiche
    notes = models.TextField(blank=True, null=True)  # Infos supplémentaires

    def __str__(self):
        return self.nom_fournisseur

class Categorie(models.Model):
    """Catégorie pour classer les produits"""
    nom = models.CharField(max_length=100)  # Nom de la catégorie
    description = models.TextField(blank=True, null=True)  # Description

    def __str__(self):
        return self.nom

class Produit(models.Model):
    """Fiche produit avec gestion de stock"""
    # Unités de mesure disponibles
    UNITE_CHOICES = (
        ('unite', 'Unité'),
        ('kg', 'Kilogramme'),
        ('g', 'Gramme'),
        ('l', 'Litre'),
        ('m', 'Mètre'),
    )
    
    categorie = models.ForeignKey('Categorie', on_delete=models.SET_NULL, null=True)  # Catégorie
    reference = models.CharField(max_length=50, unique=True, blank=True)  # Réf auto-générée
    designation = models.CharField(max_length=255)  # Désignation produit
    description = models.TextField(blank=True, null=True)  # Description détaillée
    prix_achat = models.DecimalField(max_digits=10, decimal_places=2, default=0, blank=True, null=True)  # Prix d'achat HT
    prix_vente = models.DecimalField(max_digits=10, decimal_places=2)  # Prix de vente HT
    quantite_stock = models.IntegerField(default=0)  # Stock actuel
    seuil_alerte = models.IntegerField(default=5)  # Seuil pour alerte stock faible
    unite_mesure = models.CharField(max_length=10, choices=UNITE_CHOICES, default='unite')  # Unité de vente
    date_creation = models.DateTimeField(auto_now_add=True)  # Date création fiche
    est_actif = models.BooleanField(default=True, verbose_name="Actif")  # Produit actif ou non
    image = models.ImageField(upload_to='produits/', blank=True)  # Photo du produit
    code_barre = models.CharField(max_length=50, blank=True)  # Code barre EAN
    tva = models.ForeignKey(Taxe, on_delete=models.PROTECT, null=True)  # Taxe applicable

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['reference'], name='unique_reference')
        ]

    def save(self, *args, **kwargs):
        """Auto-génère la référence à la création"""
        if not self.pk and not self.reference:
            prefix = "PRD"
            last_id = Produit.objects.order_by('-id').values_list('id', flat=True).first() or 0
            self.reference = f"{prefix}{str(last_id + 1).zfill(5)}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.designation} ({self.reference})"
    
    # Gestion suppression "douce" (archivage)
    def delete(self, *args, **kwargs):
        """Supprime seulement si pas utilisé dans des commandes"""
        if self.can_be_deleted():
            return super().delete(*args, **kwargs)
        self.est_actif = False
        self.save()
        return (1, {}) 
    
    def can_be_deleted(self):
        """Vérifie si le produit n'est pas utilisé"""
        return not self.lignecommandes.exists()

    def mark_as_inactive(self):
        """Désactive le produit sans supprimer"""
        self.est_actif = False
        self.save()
        return True

class Commande(models.Model):
    """Commande fournisseur pour réapprovisionnement"""
    STATUS_CHOICES = [
        ('BROUILLON', 'Brouillon'),  # En préparation
        ('VALIDEE', 'Validée'),  # Confirmée
        ('LIVREE', 'Livrée'),  # Réceptionnée
        ('ANNULEE', 'Annulée'),  # Abandonnée
    ]
    
    utilisateur = models.ForeignKey('Utilisateur', on_delete=models.PROTECT, related_name='commandes')  # Créateur
    code_commande = models.CharField(max_length=20, unique=True, editable=False)  # Code auto
    fournisseur = models.ForeignKey('Fournisseur', on_delete=models.PROTECT, related_name='commandes')  # Fournisseur
    type_produit = models.CharField(max_length=50)  # Type de produits commandés
    date_creation = models.DateTimeField(auto_now_add=True)  # Date création
    date_validation = models.DateTimeField(null=True, blank=True)  # Date validation
    statut = models.CharField(max_length=20, choices=STATUS_CHOICES, default='BROUILLON')  # État
    notes = models.TextField(blank=True)  # Notes supplémentaires

    def __str__(self):
        return f"{self.code_commande} - {self.fournisseur.nom_fournisseur}"

    def generate_code(self):
        """Génère un code unique pour la commande"""
        date_part = self.date_creation.strftime('%Y%m%d')
        unique_part = uuid.uuid4().hex[:6].upper()
        return f"CMD-{date_part}-{unique_part}"

    def save(self, *args, **kwargs):
        """Génère le code à la création"""
        if not self.code_commande:
            self.code_commande = self.generate_code()
        super().save(*args, **kwargs)

    @property
    def prix_total(self):
        """Calcule le total HT de la commande"""
        return sum(ligne.total_ligne_ht for ligne in self.lignes.all())

class LigneCommande(models.Model):
    """Ligne de commande fournisseur"""
    STATUT_LIVRAISON_CHOICES = [
        ('A_LIVRER', 'À livrer'),  # En attente
        ('PARTIELLE', 'Livraison partielle'),  # Partiellement livré
        ('LIVREE', 'Livrée'),  # Totalement livré
    ]
    
    commande = models.ForeignKey(Commande, on_delete=models.CASCADE, related_name='lignes')  # Commande parente
    produit = models.ForeignKey('Produit', on_delete=models.PROTECT, related_name='lignecommandes')  # Produit commandé
    quantite = models.IntegerField(validators=[MinValueValidator(1)])  # Quantité
    prix_unitaire = models.DecimalField(max_digits=10, decimal_places=2)  # Prix unitaire HT
    remise_ligne = models.DecimalField(max_digits=5, decimal_places=2, default=0)  # Remise en %
    date_livraison_prevue = models.DateField(null=True, blank=True)  # Date prévue
    statut_livraison = models.CharField(max_length=20, choices=STATUT_LIVRAISON_CHOICES, default='A_LIVRER')  # État livraison
    total_ligne_ht = models.DecimalField(max_digits=10, decimal_places=2, editable=False, default=0)  # Total HT auto-calculé

    def __str__(self):
        return f"{self.quantite}x {self.produit.reference}"

    def save(self, *args, **kwargs):
        """Calcule automatiquement le total HT"""
        self.total_ligne_ht = (self.quantite * self.prix_unitaire) * (1 - self.remise_ligne / 100)
        super().save(*args, **kwargs)

class MouvementStock(models.Model):
    """Trace les entrées/sorties de stock"""
    TYPE_MOUVEMENT = (
        ('entree', 'Entrée'),  # Réception fournisseur
        ('sortie', 'Sortie'),  # Vente client
        ('ajustement', 'Ajustement'),  # Correction stock
    )
    
    produit = models.ForeignKey(Produit, on_delete=models.PROTECT, related_name='mouvements')  # Produit concerné
    utilisateur = models.ForeignKey(Utilisateur, on_delete=models.PROTECT)  # Responsable
    commande = models.ForeignKey(Commande, on_delete=models.SET_NULL, null=True, blank=True)  # Lien commande
    fournisseur = models.ForeignKey(Fournisseur, on_delete=models.SET_NULL, null=True, blank=True)  # Fournisseur
    type_mouvement = models.CharField(max_length=20, choices=TYPE_MOUVEMENT)  # Type mouvement
    quantite = models.IntegerField()  # Quantité (+ ou - selon type)
    date_mouvement = models.DateTimeField(auto_now_add=True)  # Date/heure
    motif = models.TextField(blank=True, null=True)  # Raison si nécessaire

    def __str__(self):
        return f"{self.type_mouvement} de {self.quantite} {self.produit.unite_mesure} pour {self.produit}"

class CommandeClient(models.Model):
    """Commande passée par un client"""
    STATUT_CHOICES = [
        ('VALIDEE', 'Validée par le client'),  # Confirmée
    ]

    MODE_RETRAIT = [
        ('MAGASIN', 'Retrait en magasin'),  # Click & collect
        ('LIVRAISON', 'Livraison à domicile'),  # Livraison
    ]
    
    numero_commande = models.CharField(max_length=20, unique=True, blank=True)  # Numéro auto
    client = models.ForeignKey('Client', on_delete=models.PROTECT, related_name='commandes')  # Client
    utilisateur = models.ForeignKey('Utilisateur', on_delete=models.PROTECT, null=True, blank=True, related_name='commandes_client')  # Vendeur
    tva = models.ForeignKey('Taxe', on_delete=models.PROTECT, null=True, blank=True, default=1)  # TVA applicable
    mode_retrait = models.CharField(max_length=10, choices=MODE_RETRAIT, default='MAGASIN')  # Mode retrait
    adresse_livraison = models.TextField(blank=True)  # Adresse si livraison
    date_creation = models.DateTimeField(auto_now_add=True)  # Date création
    date_livraison_prevue = models.DateTimeField(null=True, blank=True)  # Date prévue
    date_livraison_reelle = models.DateTimeField(null=True, blank=True)  # Date réelle
    is_vente_directe = models.BooleanField(default=False)  # Vente sans client
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='VALIDEE')  # État
    est_payee = models.BooleanField(default=True)  # Payée ou non
    remise = models.DecimalField(max_digits=5, decimal_places=2, default=0)  # Remise globale
    total_commande = models.DecimalField(max_digits=10, decimal_places=2, default=0, blank=True)  # Total TTC
    notes = models.TextField(blank=True)  # Notes

    class Meta:
        verbose_name = "Commande client"
        ordering = ['-date_creation']

    def __str__(self):
        return f"Commande {self.numero_commande} - {self.client.nom_client if self.client else 'Vente directe'}"

    def save(self, *args, **kwargs):
        """Génère le numéro de commande à la création"""
        if not self.numero_commande:
            prefix = "CMD"
            last_id = CommandeClient.objects.order_by('-id').values_list('id', flat=True).first() or 0
            self.numero_commande = f"{prefix}-{str(last_id + 1).zfill(3)}"
        super().save(*args, **kwargs)

    def can_be_deleted(self):
        """Vérifie si la commande peut être supprimée"""
        return not (self.statut == 'VALIDEE' or self.est_payee)
    
    def add_lignes(self, lignes_data):
        """Ajoute des lignes à la commande en groupant les doublons"""
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
        """Calcule le total TTC de la commande"""
        total = Decimal('0')
        for ligne in self.lignes.all():
            total += (ligne.quantite * ligne.prix_unitaire) * (1 - ligne.remise_ligne / 100)
        
        # Application TVA
        tva_rate = self.tva.taux / 100 if self.tva else Decimal('0.20')
        self.total_commande = total * (1 + tva_rate)
        self.save(update_fields=['total_commande'])

class LigneCommandeClient(models.Model):
    """Ligne de commande client"""
    commande = models.ForeignKey(CommandeClient, on_delete=models.CASCADE, related_name='lignes')  # Commande parente
    produit = models.ForeignKey('Produit', on_delete=models.SET_NULL, null=True)  # Produit (peut être supprimé)
    quantite = models.IntegerField(validators=[MinValueValidator(1)])  # Quantité
    prix_unitaire = models.DecimalField(max_digits=10, decimal_places=2)  # Prix unitaire HT
    remise_ligne = models.DecimalField(max_digits=5, decimal_places=2, default=0)  # Remise ligne en %

    def __str__(self):
        produit_designation = self.produit.designation if self.produit else "Produit supprimé"
        return f"{self.quantite}x {produit_designation}"
    
    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['commande', 'produit'],
                name='unique_produit_par_commande'  # Empêche les doublons
            )
        ]

class Statistique(models.Model):
    """Statistiques quotidiennes pré-calculées"""
    date = models.DateField(unique=True)  # Jour concerné
    
    # Commandes
    nb_commandes = models.IntegerField(default=0)  # Commandes fournisseurs
    nb_ventes = models.IntegerField(default=0)  # Commandes clients
    
    # Détails ventes
    nb_ventes_directes = models.IntegerField(default=0)  # Ventes sans client
    nb_commandes_clients = models.IntegerField(default=0)  # Commandes avec client
    
    # Chiffre d'affaires
    montant_total = models.DecimalField(max_digits=15, decimal_places=2, default=0)  # CA total
    montant_ventes_directes = models.DecimalField(max_digits=15, decimal_places=2, default=0)  # CA vente directe
    montant_commandes = models.DecimalField(max_digits=15, decimal_places=2, default=0)  # CA commandes
    
    # Autres métriques
    nouveaux_clients = models.IntegerField(default=0)  # Nouveaux clients
    nouveaux_fournisseurs = models.IntegerField(default=0)  # Nouveaux fournisseurs
    produits_actifs = models.IntegerField(default=0)  # Produits actifs
    mouvements_stock = models.IntegerField(default=0)  # Mouvements stock
    produits_rupture = models.IntegerField(default=0)  # Produits en rupture
    produits_alerte = models.IntegerField(default=0)  # Produits sous seuil
    utilisateurs_actifs = models.IntegerField(default=0)  # Utilisateurs actifs

    class Meta:
        verbose_name = "Statistique quotidienne"
        ordering = ['-date']

    def __str__(self):
        return f"Stats du {self.date.strftime('%d/%m/%Y')}"

    @classmethod
    def update_daily_stats(cls):
        """Met à jour les stats pour aujourd'hui"""
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

class ActivityLog(models.Model):
    """Journal des activités utilisateurs"""
    ACTION_CHOICES = [
        ('LOGIN', 'Connexion'),
        ('LOGOUT', 'Déconnexion'),
        ('CREATE', 'Création'),
        ('UPDATE', 'Mise à jour'),
        ('DELETE', 'Suppression'),
    ]

    user = models.ForeignKey(get_user_model(), on_delete=models.CASCADE)  # Utilisateur
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)  # Action
    details = models.TextField(blank=True)  # Détails supplémentaires
    timestamp = models.DateTimeField(auto_now_add=True)  # Date/heure
    ip_address = models.GenericIPAddressField(null=True, blank=True)  # IP utilisée

    class Meta:
        ordering = ['-timestamp']
        verbose_name = "Log d'activité"

    def __str__(self):
        return f"{self.user} - {self.get_action_display()} à {self.timestamp}"