from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CurrentUserView,
    FournisseurViewSet, 
    ProduitViewSet, 
    ClientViewSet,
    UserModulesView, 
    UtilisateurViewSet,
    CommandeViewSet, 
    LigneCommandeViewSet,
    CommandeClientViewSet,
    UpdateUserRoleView,
    UserViewSet,
    GroupViewSet,
    PermissionViewSet,
    PasswordResetView,
    BarcodeConsumer,
    statistiques_commandes, 
    api_performance_vendeur,
    statistiques_commandes,  # Importez votre vue personnalisée
    user_activity,
)
from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView  # Optionnel
)



router = DefaultRouter()
router.register(r'commandes-client', CommandeClientViewSet, basename='commandeclient')
router.register(r'produits', ProduitViewSet, basename='produit')
router.register(r'commandes', CommandeViewSet, basename='commande')
router.register(r'lignes-commande', LigneCommandeViewSet, basename='lignecommande')
router.register(r'fournisseurs', FournisseurViewSet)
router.register(r'utilisateurs', UtilisateurViewSet, basename='utilisateur')
router.register(r'clients', ClientViewSet, basename='client')
router.register(r'users', UserViewSet, basename='user')
router.register(r'groups', GroupViewSet, basename='group')
router.register(r'permissions', PermissionViewSet, basename='permission')

urlpatterns = [
    path('', include(router.urls)),
    
    # Ajoutez cette ligne pour votre vue personnalisée
    path('utilisateurs/<int:user_id>/performance/', api_performance_vendeur, name='vendeur-performance'),
    # path('api/utilisateurs/<int:user_id>/activity/', user_activity),
    # path('statistiques-commandes/', statistiques_commandes, name='statistiques-commandes'),
    path('utilisateurs/<int:user_id>/update-role/', UpdateUserRoleView.as_view(), name='update-role'),
    path('me/', CurrentUserView.as_view(), name='current-user'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    path('statistiques/', statistiques_commandes, name='statistiques-commandes'),
    path('user/', CurrentUserView.as_view(), name='current-user'),
    path('user/modules/', UserModulesView.as_view(), name='user-modules'),
    path('users/<int:user_id>/reset_password/', PasswordResetView.as_view(), name='reset-password'),
    path("ws/barcode/", BarcodeConsumer.as_asgi()),
]

# urlpatterns = [
#     path('api/', include(router.urls)),  # Toutes les URLs auront le préfixe /api/
# ]