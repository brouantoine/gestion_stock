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
from .serializers import CommandeSerializer, LigneCommandeSerializer
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
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Ne pas permettre la modification de la référence
        if 'reference' in request.data:
            request.data.pop('reference')
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        return Response(serializer.data)
    
    
class ProduitViewSet(viewsets.ModelViewSet):
    queryset = Produit.objects.all()
    serializer_class = ProduitSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            


class CommandeViewSet(viewsets.ModelViewSet):
     queryset = Commande.objects.prefetch_related('lignes', 'fournisseur').all() 
     serializer_class = CommandeSerializer

     @action(detail=True, methods=['post'])
     def valider(self, request, pk=None):
         commande = self.get_object()
         commande.statut = 'VALIDEE'
         commande.save()
         return Response({'status': 'Commande validée'})
     @action(detail=False, methods=['get'])
     def stats(self, request):
         aujourdhui = datetime.now()
         debut_mois = aujourdhui.replace(day=1)
        
         stats = {
             'mois_courant': Commande.objects.filter(
                 date_creation__gte=debut_mois
             ).count(),
             'en_attente': Commande.objects.filter(
                 statut='BROUILLON'
             ).count(),
             'ca_ht': Commande.objects.filter(
                 statut='VALIDEE'
             ).aggregate(
                 total=Sum('total_ht')
             )['total'] or 0,
             'fournisseurs_actifs': Commande.objects.values(
                 'fournisseur'
             ).distinct().count(),
         }
        
         return Response(stats)

class LigneCommandeViewSet(viewsets.ModelViewSet):
     queryset = LigneCommande.objects.all()
     serializer_class = LigneCommandeSerializer,
    

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
    
    filterset_fields = ['ville', 'pays']
    search_fields = ['nom_client', 'email', 'telephone', 'siret']
    ordering_fields = ['nom_client', 'date_creation']
    ordering = ['-date_creation']

    def perform_create(self, serializer):
        """Ajoute des logs ou traitement supplémentaire à la création"""
        serializer.save()
        # Exemple: logger.info(f"Nouveau client créé: {serializer.data['nom_client']}")

    def get_queryset(self):
        """Optionnel: Filtrage supplémentaire"""
        queryset = super().get_queryset()
        # Exemple de filtre supplémentaire:
        # if self.request.query_params.get('actifs'):
        #     queryset = queryset.filter(actif=True)
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
from .models import Vente, CommandeClient, LigneCommandeClient
from .serializers import CommandeClientSerializer

from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import CommandeClient, LigneCommandeClient
from .serializers import CommandeClientSerializer

class CommandeClientViewSet(viewsets.ModelViewSet):
    queryset = CommandeClient.objects.all()
    serializer_class = CommandeClientSerializer

    def create(self, request):
        data = request.data
        is_vente_directe = data.get('is_vente_directe', False)
        
        if is_vente_directe:
            data.update({
                'statut': 'VALIDEE',
                'est_payee': True,
                'mode_retrait': 'MAGASIN'
            })
        
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        
        # Création de la commande sans les lignes d'abord
        commande = serializer.save()
        
        # Création des lignes après que la commande a un ID
        lignes_data = data.get('lignes', [])
        for line in lignes_data:
            LigneCommandeClient.objects.create(
                commande=commande,
                produit_id=line['produit'],
                quantite=line['quantite'],
                prix_unitaire=line['prix_unitaire'],
                remise_ligne=line.get('remise_ligne', 0)
            )
            
        if is_vente_directe:
            produit = Produit.objects.get(id=line['produit'])
            produit.quantite_stock -= line['quantite']
            produit.save(update_fields=['quantite_stock'])  # Sauvegarde optimisée
        
        # Optionnel : Ajouter une vérification de stock négatif
        if produit.quantite_stock < 0:
            raise ValidationError(f"Stock insuffisant pour {produit.designation}")
        
        # Force le calcul du total
        commande.total_commande = commande.total_ttc
        commande.save()
        
        return Response(self.get_serializer(commande).data, status=status.HTTP_201_CREATED)


from django.db.models import Sum, Count, F, DecimalField
from django.db.models.functions import TruncMonth
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import CommandeClient, LigneCommandeClient, Utilisateur

@api_view(['GET'])
def statistiques_commandes(request):
    try:
        commandes = CommandeClient.objects.all()
        
        if not commandes.exists():
            return Response({
                'success': True,
                'message': 'Aucune commande trouvée',
                'data': {}
            })

        # Calcul des statistiques
        details = []
        ventes_directes = 0
        commandes_clients = 0
        total_ca_ventes_directes = 0
        total_ca_commandes = 0

        for cmd in commandes:
            is_vente_directe = cmd.client is None or cmd.client.nom_client == 'Client Direct'
            total_cmd = float(cmd.total_commande) if cmd.total_commande else 0
            
            if is_vente_directe:
                ventes_directes += 1
                total_ca_ventes_directes += total_cmd
            else:
                commandes_clients += 1
                total_ca_commandes += total_cmd

            details.append({
                'id': cmd.id,
                'numero': cmd.numero_commande,
                'date': cmd.date_creation.strftime('%Y-%m-%d %H:%M'),
                'client': cmd.client.nom_client if cmd.client else 'Client Direct',
                'is_vente_directe': is_vente_directe,
                'total_ttc': total_cmd,
                # ... autres champs
            })

        # Statistiques vendeurs
        vendeurs_stats = {}
        for cmd in commandes:
            if cmd.utilisateur:
                vendeur_id = cmd.utilisateur.id
                if vendeur_id not in vendeurs_stats:
                    vendeurs_stats[vendeur_id] = {
                        'nom': cmd.utilisateur.get_full_name(),
                        'nb_commandes': 0,
                        'ca_total': 0
                    }
                vendeurs_stats[vendeur_id]['nb_commandes'] += 1
                vendeurs_stats[vendeur_id]['ca_total'] += float(cmd.total_commande) if cmd.total_commande else 0

        return Response({
            'success': True,
            'data': {
                'stats': {
                    'total_commandes': commandes.count(),
                    'ventes_directes': ventes_directes,
                    'commandes_clients': commandes_clients,
                    'chiffre_affaires_total': total_ca_ventes_directes + total_ca_commandes,
                    'chiffre_affaires_ventes_directes': total_ca_ventes_directes,
                    'chiffre_affaires_commandes': total_ca_commandes,
                    'periode': {
                        'debut': commandes.earliest('date_creation').date_creation.strftime('%Y-%m-%d'),
                        'fin': commandes.latest('date_creation').date_creation.strftime('%Y-%m-%d')
                    }
                },
                'details': details,
                'vendeurs': list(vendeurs_stats.values())
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
        user = request.user
        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "is_superuser": user.is_superuser,
            "role": user.role  # Si vous avez un champ personnalisé
        })