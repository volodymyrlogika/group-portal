from django.urls import path
from .views import forum


urlpatterns = [
   path('sub/', forum, name="subredts"),
]