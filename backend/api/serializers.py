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
    
    class Meta:
        model = LigneCommandeClient
        fields = [
            'id', 'produit', 'quantite', 'prix_unitaire', 
            'remise_ligne', 'total_ligne_ht'
        ]
        read_only_fields = ['id', 'total_ligne_ht']
        extra_kwargs = {
            'quantite': {'min_value': 1, 'required': True},
            'prix_unitaire': {'min_value': 0, 'required': True}
        }

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