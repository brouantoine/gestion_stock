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

class LigneCommandeClientSerializer(serializers.ModelSerializer):
    produit = serializers.PrimaryKeyRelatedField(queryset=Produit.objects.all())
    total_ligne_ht = serializers.SerializerMethodField()  # Champ calculé
    
    class Meta:
        model = LigneCommandeClient
        fields = [
            'id', 'produit', 'quantite', 'prix_unitaire', 
            'remise_ligne', 'total_ligne_ht'  # Maintenant valide car c'est un SerializerMethodField
        ]
        read_only_fields = ['id', 'total_ligne_ht']
        extra_kwargs = {
            'quantite': {'min_value': 1, 'required': True},
            'prix_unitaire': {'min_value': 0, 'required': True}
        }

    def get_total_ligne_ht(self, obj):
        """Calcule le total HT de la ligne"""
        try:
            return (obj.quantite * obj.prix_unitaire) * (1 - obj.remise_ligne / 100)
        except (TypeError, AttributeError):
            return 0

class CommandeClientSerializer(serializers.ModelSerializer):
    lignes = LigneCommandeClientSerializer(many=True)
    
    class Meta:
        model = CommandeClient
        fields = [
            'id', 'client', 'date_creation', 'statut',
            'is_vente_directe', 'notes', 'lignes', 'total_ht'
        ]
        read_only_fields = ['id', 'date_creation', 'total_ht']
        extra_kwargs = {
            'client': {'required': False}
        }

    def validate(self, data):
        if not data.get('is_vente_directe') and not data.get('client'):
            raise serializers.ValidationError(
                "Un client est requis pour les commandes non-directes"
            )
        return data

    def create(self, validated_data):
        # Extraire les données des lignes de commande
        lignes_data = validated_data.pop('lignes')
        
        # Créer la commande client
        commande = CommandeClient.objects.create(**validated_data)
        
        # Créer les lignes de commande associées
        for ligne_data in lignes_data:
            LigneCommandeClient.objects.create(commande=commande, **ligne_data)
        
        return commande

    def update(self, instance, validated_data):
        # Gestion des lignes lors de la mise à jour
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
                LigneCommandeClient.objects.create(commande=instance, **ligne_data)
        
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