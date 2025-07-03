from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CurrentUserView,
    FournisseurViewSet, 
    ProduitViewSet, 
    ClientViewSet, 
    UtilisateurViewSet,
    CommandeViewSet, 
    LigneCommandeViewSet,
    CommandeClientViewSet,
    UpdateUserRoleView,
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
]

# urlpatterns = [
#     path('api/', include(router.urls)),  # Toutes les URLs auront le préfixe /api/
# ]