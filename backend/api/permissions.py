from ast import Module
from rest_framework.permissions import BasePermission
from rest_framework.permissions import BasePermission

from rest_framework.permissions import BasePermission

class IsAdmin(BasePermission):
    message = "Seul l'administrateur a accès à cette ressource."
    
    def has_permission(self, request, view):
        return request.user.role == 'admin'


class IsSuperAdmin(BasePermission):
    message = "Accès réservé aux super-administrateurs"
    
    def has_permission(self, request, view):
        # Vérifie d'abord que l'utilisateur est authentifié
        if not request.user.is_authenticated:
            return False
            
        # Ensuite vérifie le rôle et le statut superuser
        return hasattr(request.user, 'role') and request.user.role == 'admin' and request.user.is_superuser

from rest_framework.permissions import BasePermission

class IsAdmin(BasePermission):
    """
    Permission personnalisée vérifiant que l'utilisateur a le rôle 'admin'.
    """
    message = "Accès réservé aux administrateurs."

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'

class IsGestionnaireStock(BasePermission):
    """
    Permission pour les gestionnaires de stock.
    """
    message = "Accès réservé aux gestionnaires de stock."

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'gestionnaire'

class IsVendeur(BasePermission):
    """
    Permission pour les vendeurs.
    """
    message = "Accès réservé aux vendeurs."

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'vendeur'