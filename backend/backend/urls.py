from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),  # Le préfixe 'api/' est déjà ici
    path('', RedirectView.as_view(url='/admin/')), 
]