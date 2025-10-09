from .views import ChatView
from django.urls import path

urlpatterns = [
    path("chat/<int:pk>/", ChatView.as_view(), name="chat"),
]
