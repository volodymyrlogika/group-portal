from django.urls import include, path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('edit/', views.edit_journal, name='edit_journal'),
]