# api/views.py

from warnings import filters
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status
from rest_framework.response import Response
import datetime
from rest_framework import viewsets, status
from rest_framework.response import Response
from api.models import Produit
from api.serializers import ProduitSerializer
from api.models import Produit
from api.serializers import ProduitSerializer
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Sum

from api.admin import RoleChangeLog
from .models import Commande, LigneCommande, MouvementStock
from rest_framework import viewsets
from .models import Fournisseur
from .serializers import FournisseurSerializer
from rest_framework.permissions import BasePermission, IsAuthenticated





from rest_framework.views import APIView
from .permissions import IsAdmin, IsSuperAdmin

class AdminDashboard(APIView):
    permission_classes = [IsAdmin]  
    
    def get(self, request):
        return Response("Dashboard Admin")



class IsVendeurOrCaissier(BasePermission):
    def has_permission(self, request, view):
        return request.user.role in ['vendeur', 'caissier']



class ProduitViewSet(viewsets.ModelViewSet):
    queryset = Produit.objects.all()
    serializer_class = ProduitSerializer

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=False)
        
        try:
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Erreur modification produit: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    
   

class FournisseurViewSet(viewsets.ModelViewSet):
    queryset = Fournisseur.objects.all()
    serializer_class = FournisseurSerializer
    
from rest_framework import viewsets
from .models import Client
from .serializers import ClientSerializer

from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Client
from .serializers import ClientSerializer

class ClientViewSet(viewsets.ModelViewSet):
    serializer_class = ClientSerializer
    queryset = Client.objects.all().order_by('-date_creation')
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    
    filterset_fields = ['ville', 'pays', 'is_direct']  # Ajoutez 'is_direct' ici
    search_fields = ['nom_client', 'email', 'telephone', 'siret']
    ordering_fields = ['nom_client', 'date_creation']
    ordering = ['-date_creation']

    def perform_create(self, serializer):
        serializer.save()

    def get_queryset(self):
        queryset = super().get_queryset()
        # Filtre supplémentaire pour is_direct
        is_direct = self.request.query_params.get('is_direct')
        if is_direct in ['true', 'false']:
            queryset = queryset.filter(is_direct=is_direct.lower() == 'true')
        return queryset
        

from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from .models import Utilisateur
from .serializers import UtilisateurSerializer

class UtilisateurViewSet(viewsets.ModelViewSet):
    queryset = Utilisateur.objects.all()
    serializer_class = UtilisateurSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    # Si vous avez besoin de filtres personnalisés
    filter_backends = []  # Explicitement vide si vous n'utilisez pas de filtres
    
    def get_queryset(self):
        # Exemple de queryset de base
        return super().get_queryset()


from django.db.models import Count, Sum
from django.db.models.functions import TruncMonth
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from .models import Utilisateur, Commande

from django.db.models import Count, Sum, F, ExpressionWrapper, FloatField
from django.db.models.functions import TruncMonth
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from .models import Utilisateur, Commande, LigneCommande, ActivityLog

def api_performance_vendeur(request, user_id):
    utilisateur = get_object_or_404(Utilisateur, pk=user_id)
    
    # 1. Calcul des commandes validées
    commandes_validees = Commande.objects.filter(
        utilisateur=utilisateur,
        statut='VALIDEE'
    )
    
    # 2. Détail par mois - Approche optimisée en 2 requêtes
    # Requête pour les counts
    counts_by_month = (
        commandes_validees
        .annotate(mois=TruncMonth('date_validation'))
        .values('mois')
        .annotate(total_commandes=Count('id'))
        .order_by('-mois')
    )
    
    # Requête pour les sommes
    sums_by_month = (
        LigneCommande.objects
        .filter(commande__in=commandes_validees)
        .annotate(mois=TruncMonth('commande__date_validation'))
        .values('mois')
        .annotate(ca_ht=Sum(
            ExpressionWrapper(
                F('quantite') * F('prix_unitaire'),
                output_field=FloatField()
            )
        ))
        .order_by('-mois')
    )
    
    # Fusion des résultats
    monthly_stats = []
    for count in counts_by_month:
        mois = count['mois']
        ca_ht = next(
            (item['ca_ht'] for item in sums_by_month if item['mois'] == mois),
            0.0
        )
        monthly_stats.append({
            'mois': mois,
            'total_commandes': count['total_commandes'],
            'ca_ht': float(ca_ht) if ca_ht else 0.0
        })
    
    # 3. Calcul des totaux globaux
    total_commandes = commandes_validees.count()
    total_ca = sum(item['ca_ht'] for item in monthly_stats)
    
    return JsonResponse({
        'commandes_total': total_commandes,
        'ca_ht_total': total_ca,
        'commandes_par_mois': [
            {
                'mois': stat['mois'].strftime('%Y-%m-%d'),
                'mois_formate': stat['mois'].strftime('%B %Y'),
                'total_commandes': stat['total_commandes'],
                'ca_ht': stat['ca_ht']
            }
            for stat in monthly_stats
        ]
    })

from rest_framework.decorators import api_view

from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import ActivityLog

@api_view(['GET'])
def user_activity(request, user_id):
    activities = ActivityLog.objects.filter(user_id=user_id).order_by('-timestamp')[:20]
    data = [{
        'action': act.get_action_display(),
        'timestamp': act.timestamp,
        'details': act.details,
        'ip_address': act.ip_address
    } for act in activities]
    return Response(data)





from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=MouvementStock)
def update_stock(sender, instance, **kwargs):
    produit = instance.produit
    if instance.type_mouvement == 'entree':
        produit.quantite_stock += instance.quantite
    elif instance.type_mouvement == 'sortie':
        produit.quantite_stock -= instance.quantite
    produit.save()



from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import CommandeClient, LigneCommandeClient
from .serializers import CommandeClientSerializer

from django.db import transaction
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError

from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from rest_framework.decorators import action
from django.core.exceptions import ValidationError
from rest_framework.exceptions import APIException

class CommandeClientViewSet(viewsets.ModelViewSet):
    queryset = CommandeClient.objects.all()
    serializer_class = CommandeClientSerializer

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        is_vente_directe = data.get('is_vente_directe', False)
        
        # Configuration automatique pour les ventes directes
        if is_vente_directe:
            data.update({
                'statut': 'VALIDEE',
                'est_payee': True,
                'mode_retrait': 'MAGASIN'
            })

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        
        # Phase 1: Vérification préalable
        lignes_data = data.get('lignes', [])
        produits_a_mettre_a_jour = []
        
        for line in lignes_data:
            try:
                produit = Produit.objects.select_for_update().get(id=line['produit'])
                quantite = int(line['quantite'])
                
                if quantite <= 0:
                    raise ValidationError(f"Quantité invalide pour le produit {produit.designation}")
                
                if is_vente_directe:
                    nouveau_stock = produit.quantite_stock - quantite
                    if nouveau_stock < 0:
                        raise ValidationError(
                            f"Stock insuffisant pour {produit.designation}. "
                            f"Stock actuel: {produit.quantite_stock}, "
                            f"Quantité demandée: {quantite}"
                        )
                    produits_a_mettre_a_jour.append((produit, quantite))
                    
            except Produit.DoesNotExist:
                raise APIException(f"Produit ID {line['produit']} introuvable")
            except KeyError as e:
                raise APIException(f"Champ manquant dans la ligne: {str(e)}")

        try:
            # Phase 2: Création de la commande
            commande = serializer.save()
            
            # Création des lignes de commande
            for line in lignes_data:
                LigneCommandeClient.objects.create(
                    commande=commande,
                    produit_id=line['produit'],
                    quantite=line['quantite'],
                    prix_unitaire=line['prix_unitaire'],
                    remise_ligne=line.get('remise_ligne', 0)
                )

            # Phase 3: Mise à jour du stock
            if is_vente_directe:
                for produit, quantite in produits_a_mettre_a_jour:
                    produit.quantite_stock -= quantite
                    
                    # Vérification du seuil d'alerte
                    if produit.quantite_stock <= produit.seuil_alerte:
                        # Ici vous pourriez déclencher une alerte
                        pass
                    
                    produit.save(update_fields=['quantite_stock'])
            
            # Calcul du total
            commande.refresh_from_db()
            commande.total_commande = commande.total_ttc
            commande.save(update_fields=['total_commande'])
            
            # Retourner la réponse
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
            
        except Exception as e:
            raise APIException(f"Erreur lors de la création de la commande: {str(e)}")

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        
        if not instance.can_be_deleted():
            return Response(
                {
                    "error": "Impossible de supprimer cette commande",
                    "detail": "La commande a déjà été validée ou payée",
                    "solution": "Annulez la commande plutôt que de la supprimer"
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['get'])
    def can_delete(self, request, pk=None):
        commande = self.get_object()
        return Response({
            'can_delete': commande.can_be_deleted(),
            'status': commande.statut,
            'is_paid': commande.est_payee
        })

    @action(detail=True, methods=['patch'])
    def cancel(self, request, pk=None):
        commande = self.get_object()
        if commande.statut == 'ANNULEE':
            return Response({'status': 'already cancelled'}, status=status.HTTP_400_BAD_REQUEST)
        
        commande.statut = 'ANNULEE'
        commande.save()
        return Response({'status': 'cancelled'}, status=status.HTTP_200_OK)

from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from .models import Statistique, CommandeClient
from django.db.models import Sum, Avg

@api_view(['GET'])
def statistiques_commandes(request):
    try:
        # Paramètres de période (par défaut: 30 derniers jours)
        days = int(request.GET.get('days', 30))
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=days)
        
        # Récupération des stats
        stats_queryset = Statistique.objects.filter(
            date__gte=start_date,
            date__lte=end_date
        ).order_by('date')
        
        # Calculs manuels des totaux
        total_data = {
            'total_ca': sum(s.montant_total for s in stats_queryset),
            'total_ventes': sum(s.nb_ventes for s in stats_queryset),
            'ventes_directes': sum(s.nb_ventes_directes for s in stats_queryset),
            'commandes_clients': sum(s.nb_commandes_clients for s in stats_queryset),
            'ca_ventes_directes': sum(s.montant_ventes_directes for s in stats_queryset),
            'ca_commandes': sum(s.montant_commandes for s in stats_queryset),
            'avg_ventes': sum(s.nb_ventes for s in stats_queryset) / days if days > 0 else 0
        }
        
        # Détails quotidiens
        daily_stats = [
            {
                'date': s.date.strftime('%Y-%m-%d'),
                'ca_ht': float(s.montant_total),
                'ventes': s.nb_ventes,
                'ventes_directes': s.nb_ventes_directes,
                'commandes_clients': s.nb_commandes_clients
            } for s in stats_queryset
        ]
        
        # Commandes récentes
        recent_commands = CommandeClient.objects.filter(
            date_creation__gte=start_date
        ).order_by('-date_creation')[:10]
        
        return Response({
            'success': True,
            'data': {
                'periode': {
                    'debut': start_date.strftime('%Y-%m-%d'),
                    'fin': end_date.strftime('%Y-%m-%d')
                },
                'stats_globales': total_data,
                'stats_quotidiennes': daily_stats,
                'commandes_recentes': [
                    {
                        'id': cmd.id,
                        'numero': cmd.numero_commande,
                        'client': cmd.client.nom_client if cmd.client else 'Direct',
                        'total': float(cmd.total_commande) if cmd.total_commande else 0,
                        'date': cmd.date_creation.strftime('%Y-%m-%d %H:%M'),
                        'is_vente_directe': cmd.client is None or cmd.client.id == '3'
                    } for cmd in recent_commands
                ]
            }
        })

    except Exception as e:
        return Response({
            'success': False,
            'error': str(e),
            'message': 'Erreur lors du calcul des statistiques'
        }, status=500)
    
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .permissions import IsAdmin

class UpdateUserRoleView(APIView):
    permission_classes = [IsAdmin]  # Seul l'admin peut utiliser cette API

    def patch(self, request, user_id):
        try:
            user = Utilisateur.objects.get(id=user_id)
            new_role = request.data.get('role')
            
            if new_role not in dict(Utilisateur.ROLES).keys():
                return Response(
                    {"error": "Rôle invalide"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            user.role = new_role
            user.save()
            return Response({"status": "Rôle mis à jour"})
        
        except Utilisateur.DoesNotExist:
            return Response(
                {"error": "Utilisateur introuvable"}, 
                status=status.HTTP_404_NOT_FOUND
            )
    def patch(self, request, user_id):
        user = Utilisateur.objects.get(id=user_id)
        old_role = user.role
        new_role = request.data.get('role')
        
        user.role = new_role
        user.save()
        
        # Journalisation
        RoleChangeLog.objects.create(
            user=user,
            old_role=old_role,
            new_role=new_role,
            changed_by=request.user
        )
    
        return Response({"status": "Rôle mis à jour"})


# permissions.py


# api/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.authentication import JWTAuthentication
from .permissions import IsSuperAdmin
from .models import Utilisateur

class UpdateUserRoleView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsSuperAdmin]

    def patch(self, request, user_id):
        try:
            user = Utilisateur.objects.get(id=user_id)
            new_role = request.data.get('role')
            
            if new_role not in dict(Utilisateur.ROLES).keys():
                return Response(
                    {"error": "Rôle invalide"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            user.role = new_role
            user.save()
            
            return Response({"status": "Rôle mis à jour"})
            
        except Utilisateur.DoesNotExist:
            return Response(
                {"error": "Utilisateur introuvable"}, 
                status=status.HTTP_404_NOT_FOUND
            )       
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication

class CurrentUserView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            "id": request.user.id,
            "username": request.user.username,
            "role": request.user.role
        })

class UserModulesView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        ROLE_MODULES = {
            'admin': ['VENTE', 'PRODUIT', 'COMMANDE', 'CLIENT', 'STATS', 'UTILISATEUR', 'CONFIGURATION'],
            'gestionnaire': ['PRODUIT', 'COMMANDE', 'STATS'],
            'vendeur': ['VENTE', 'CLIENT', 'STATS']
        }
        return Response({"modules": ROLE_MODULES.get(request.user.role, [])})
    
class ConfigurationView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from django.contrib.auth.models import Group, Permission
from .models import Utilisateur
from .serializers import (
    UserCreateSerializer,
    GroupSerializer,
    PermissionSerializer
)
from django.contrib.auth.hashers import make_password

class UserViewSet(viewsets.ModelViewSet):
    queryset = Utilisateur.objects.all()
    permission_classes = [permissions.IsAdminUser]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return UtilisateurSerializer

    def perform_create(self, serializer):
        password = make_password(self.request.data.get('password'))
        serializer.save(password=password)

class GroupViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.all()
    serializer_class = GroupSerializer
    permission_classes = [permissions.IsAdminUser]

class PermissionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Permission.objects.all()
    serializer_class = PermissionSerializer
    permission_classes = [permissions.IsAdminUser]

class PasswordResetView(APIView):
    permission_classes = [permissions.IsAdminUser]
    
    def post(self, request, user_id):
        try:
            user = Utilisateur.objects.get(id=user_id)
            new_password = request.data.get('new_password')
            user.set_password(new_password)
            user.save()
            return Response({"status": "password reset"})
        except Utilisateur.DoesNotExist:
            return Response(
                {"error": "User not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
from django.http import JsonResponse
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
import json

# Partie WebSocket
class BarcodeConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()
        await self.channel_layer.group_add("barcode_group", self.channel_name)

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard("barcode_group", self.channel_name)

    async def receive(self, text_data):
        # Reçoit les scans du frontend (optionnel)
        data = json.loads(text_data)
        await self.channel_layer.group_send(
            "barcode_group",
            {"type": "broadcast_barcode", "data": data}
        )

    async def broadcast_barcode(self, event):
        # Envoie les données à tous les clients connectés
        await self.send(text_data=json.dumps(event["data"]))

# Partie HTTP (votre vue existante)
def scan_barcode(request):
    if request.method == 'POST':
        barcode = request.POST.get('barcode')
        
        # Envoi temps réel via WebSocket
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            "barcode_group",
            {"type": "broadcast_barcode", "data": {"barcode": barcode}}
        )
        
        return JsonResponse({"status": "success"})