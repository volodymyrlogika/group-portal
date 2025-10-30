from django.urls import path
from . import views

urlpatterns = [
    path('', views.gallery_list, name='gallery_list'),
    path('<int:pk>/', views.gallery_detail, name='gallery_detail'),
    path('upload/', views.gallery_upload, name='gallery_upload'),
]