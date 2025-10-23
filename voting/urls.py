from django.urls import path
from . import views


urlpatterns = [
    path("", views.PollListView.as_view(), name="poll_list"),
    path("<int:pk>/", views.poll_detail, name="poll_detail"),
    path("create/", views.PollCreateView.as_view(), name="poll_create"),
    path("<int:pk>/edit/", views.PollUpdateView.as_view(), name="poll_edit"),
    path("<int:pk>/delete/", views.PollDeleteView.as_view(), name="poll_delete"),
]
