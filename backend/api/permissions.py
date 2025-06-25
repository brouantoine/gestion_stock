from ast import Module
from rest_framework.permissions import BasePermission

class IsAdmin(BasePermission):
    message = "Seul l'administrateur a accès à cette ressource."
    
    def has_permission(self, request, view):
        return request.user.role == 'admin'

class IsGestionnaireStock(BasePermission):
    message = "Réservé aux gestionnaires de stock."
    
    def has_permission(self, request, view):
        return request.user.role == 'gestionnaire'

class IsVendeur(BasePermission):
    message = "Action autorisée uniquement aux vendeurs."
    
    def has_permission(self, request, view):
        return request.user.role == 'vendeur'

class IsCaissier(BasePermission):
    message = "Seuls les caissiers peuvent effectuer cette action."
    
    def has_permission(self, request, view):
        return request.user.role == 'caissier'

class IsAdminOrGestionnaire(BasePermission):
    message = "Réservé aux admins ou gestionnaires."
    
    def has_permission(self, request, view):
        return request.user.role in ['admin', 'gestionnaire']


class IsTeamMember(BasePermission):
    """Autorise plusieurs rôles."""
    roles_autorises = []
    message = "Vous n'avez pas les droits nécessaires."
  
    def has_permission(self, request, view):
        return request.user.role in self.roles_autorises

from rest_framework.permissions import BasePermission

from rest_framework.permissions import BasePermission

class IsSuperAdmin(BasePermission):
    message = "Accès réservé aux super-administrateurs"
    
    def has_permission(self, request, view):
        # Vérifie d'abord que l'utilisateur est authentifié
        if not request.user.is_authenticated:
            return False
            
        # Ensuite vérifie le rôle et le statut superuser
        return hasattr(request.user, 'role') and request.user.role == 'admin' and request.user.is_superuser

# permissions.py
from rest_framework.permissions import BasePermission

class HasModuleAccess(BasePermission):
    def has_permission(self, request, view):
        # Vérifie si l'utilisateur a accès au module demandé
        user_role = request.user.role
        module_code = view.kwargs.get('module_code')
        
        try:
            module = Module.objects.get(code=module_code)
            return user_role in module.allowed_roles.split(',')
        except Module.DoesNotExist:
            return False