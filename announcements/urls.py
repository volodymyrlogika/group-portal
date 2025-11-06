from django.urls import path
from . import views

urlpatterns = [
    path('', views.announcements_list, name='announcements_list'),
    path('create/', views.AnnouncementsCreateView.as_view(), name='announcements_create')
]
