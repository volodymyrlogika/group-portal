from django.urls import path
from . import views
from .views import calendar_view

urlpatterns = [
    path('calendar/', calendar_view, name='calendar'),
] 