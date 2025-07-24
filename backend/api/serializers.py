# api/serializers.py
from rest_framework import serializers
from .models import (
    Produit, 
    Taxe,
    Commande, 
    LigneCommande,
    Fournisseur,
    Client,
    Utilisateur,
    CommandeClient, 
    LigneCommandeClient
)
from django.contrib.auth.models import Group, Permission
from django.core.validators import ValidationError

class TaxeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Taxe
        fields = '__all__'

class ProduitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Produit
        fields = '__all__'
        extra_kwargs = {
            'reference': {'read_only': True},
            'date_creation': {'read_only': True},
            'prix_vente': {'min_value': 0}
        }

    def validate_prix_vente(self, value):
        if value <= 0:
            raise serializers.ValidationError("Le prix de vente doit être positif")
        return value

class FournisseurSerializer(serializers.ModelSerializer):
    class Meta:
        model = Fournisseur
        fields = '__all__'
        extra_kwargs = {
            'siret': {'required': False}
        }

class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = [
            'id', 'nom_client', 'adresse', 'code_postal', 'ville',
            'pays', 'telephone', 'email', 'siret', 'date_creation', 'notes'
        ]
        read_only_fields = ['id', 'date_creation']
        extra_kwargs = {
            'telephone': {'required': True},
            'email': {'required': False},
            'siret': {'required': False, 'min_length': 14, 'max_length': 14}
        }

    def validate_telephone(self, value):
        if len(value) < 10:
            raise serializers.ValidationError("Le numéro doit contenir au moins 10 chiffres")
        return value

from rest_framework import serializers
from decimal import Decimal
from .models import CommandeClient, LigneCommandeClient, Produit, Taxe

class LigneCommandeClientSerializer(serializers.ModelSerializer):
    produit = ProduitSerializer(read_only=True)  
    produit_id = serializers.PrimaryKeyRelatedField(
        queryset=Produit.objects.all(),
        source='produit',
        write_only=True
    ) 
    total_ligne_ht = serializers.SerializerMethodField()

    class Meta:
        model = LigneCommandeClient
        fields = [
            'id', 'produit', 'produit_id', 'quantite', 'prix_unitaire',
            'remise_ligne', 'total_ligne_ht'
        ]
        read_only_fields = ['id', 'total_ligne_ht']

        extra_kwargs = {
            'quantite': {'min_value': 1, 'required': True},
            'prix_unitaire': {'min_value': 0, 'required': True}
        }

    def get_total_ligne_ht(self, obj):
        try:
            return (obj.quantite * obj.prix_unitaire) * (1 - obj.remise_ligne / 100)
        except (TypeError, AttributeError):
            return 0

class CommandeClientSerializer(serializers.ModelSerializer):
    lignes = LigneCommandeClientSerializer(many=True)
    tva = serializers.PrimaryKeyRelatedField(
        queryset=Taxe.objects.all(),
        required=True,
        error_messages={
            'required': 'Veuillez sélectionner une TVA',
            'does_not_exist': 'La TVA sélectionnée n\'existe pas'
        }
    )

    class Meta:
        model = CommandeClient
        fields = [
            'id', 'client', 'tva', 'date_creation', 'statut',
            'is_vente_directe', 'notes', 'lignes', 'total_commande', 'utilisateur', 'numero_commande'
        ]
        read_only_fields = ['id', 'date_creation', 'total_commande', 'utilisateur']

    def validate(self, data):
        # Validation client pour les commandes non-directes
        if not data.get('is_vente_directe') and not data.get('client'):
            raise serializers.ValidationError(
                "Un client est requis pour les commandes non-directes"
            )
        
        # Validation des doublons dans les lignes
        if 'lignes' in data:
            produits = [line['produit'].id for line in data['lignes']]
            if len(produits) != len(set(produits)):
                raise serializers.ValidationError(
                    {"lignes": "Un produit ne peut apparaître qu'une fois par commande"}
                )
        
        return data

    def create(self, validated_data):
        lignes_data = validated_data.pop('lignes', [])
        commande = CommandeClient.objects.create(**validated_data)
        commande.add_lignes(lignes_data)
        return commande

    def update(self, instance, validated_data):
        lignes_data = validated_data.pop('lignes', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if lignes_data is not None:
            instance.lignes.all().delete()
            instance.add_lignes(lignes_data)

        return instance
    
class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ['id', 'name', 'codename', 'content_type']

class GroupSerializer(serializers.ModelSerializer):
    permissions = PermissionSerializer(many=True, read_only=True)
    
    class Meta:
        model = Group
        fields = ['id', 'name', 'permissions']

class UtilisateurSerializer(serializers.ModelSerializer):
    groups = GroupSerializer(many=True, read_only=True)
    
    class Meta:
        model = Utilisateur
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'telephone', 'is_active', 'groups', 'date_joined'
        ]
        extra_kwargs = {
            'password': {'write_only': True},
            'username': {'required': True},
            'email': {'required': True}
        }

class UserCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Utilisateur
        fields = [
            'id', 'username', 'password', 'email',
            'first_name', 'last_name', 'role',
            'telephone', 'is_active'
        ]
        extra_kwargs = {
            'password': {'write_only': True},
            'is_active': {'default': True}
        }

    def create(self, validated_data):
        user = Utilisateur.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            role=validated_data.get('role', 'vendeur'),
            telephone=validated_data.get('telephone', ''),
            is_active=validated_data.get('is_active', True)
        )
        return user

class LigneCommandeSerializer(serializers.ModelSerializer):
    produit = ProduitSerializer(read_only=True)
    produit_id = serializers.PrimaryKeyRelatedField(
        queryset=Produit.objects.all(),
        source='produit',
        write_only=True
    )
    total_ligne_ht = serializers.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        read_only=True
    )

    class Meta:
        model = LigneCommande
        fields = [
            'id', 'produit', 'produit_id', 'quantite', 
            'prix_unitaire', 'remise_ligne', 'total_ligne_ht',
            'date_livraison_prevue', 'statut_livraison'
        ]
        extra_kwargs = {
            'quantite': {'min_value': 1},
            'prix_unitaire': {'min_value': 0}
        }

class CommandeSerializer(serializers.ModelSerializer):
    fournisseur = serializers.PrimaryKeyRelatedField(
        queryset=Fournisseur.objects.all()
    )
    utilisateur = serializers.PrimaryKeyRelatedField(
        queryset=Utilisateur.objects.all(),
        default=serializers.CurrentUserDefault()
    )
    lignes = LigneCommandeSerializer(many=True, required=False)
    prix_total = serializers.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        read_only=True
    )

    class Meta:
        model = Commande
        fields = [
            'id', 'code_commande', 'fournisseur', 'type_produit',
            'date_creation', 'date_validation', 'statut',
            'utilisateur', 'notes', 'lignes', 'prix_total'
        ]
        read_only_fields = ['code_commande', 'date_creation', 'prix_total']

    def create(self, validated_data):
        lignes_data = validated_data.pop('lignes', [])
        commande = Commande.objects.create(**validated_data)
        
        for ligne_data in lignes_data:
            LigneCommande.objects.create(commande=commande, **ligne_data)
            
        return commande

    def update(self, instance, validated_data):
        lignes_data = validated_data.pop('lignes', None)
        
        # Mise à jour des champs de base
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Gestion des lignes si fournies
        if lignes_data is not None:
            # Supprimer les anciennes lignes
            instance.lignes.all().delete()
            
            # Créer les nouvelles lignes
            for ligne_data in lignes_data:
                LigneCommande.objects.create(commande=instance, **ligne_data)
        
        return instance
    
    from rest_framework import serializers
from .models import Produit

class RapportProduitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Produit
        fields = [
            'id', 'reference', 'designation', 'quantite_stock',
            'seuil_alerte', 'prix_vente', 'est_actif'
        ]
from .models import CommandeClient

class RapportCommandeSerializer(serializers.ModelSerializer):
    client = serializers.CharField(source='client.nom', default='Direct')

    class Meta:
        model = CommandeClient
        fields = [
            'id', 'numero_commande', 'client', 'total_commande', 'statut', 'date_creation', 'is_vente_directe'
        ]
