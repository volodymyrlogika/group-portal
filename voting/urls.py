from django.urls import path
from . import views

app_name = "voting"

urlpatterns = [
    path("", views.PollListView.as_view(), name="poll_list"),
    path("search/", views.PollListView.as_view(), name="poll_search"),  # same view handles q/status
    path("create/", views.PollCreateView.as_view(), name="poll_create"),
    path("<int:pk>/", views.poll_detail, name="poll_detail"),
    path("<int:pk>/vote/", views.VoteAjaxView.as_view(), name="poll_vote"),
    path("<int:pk>/results/", views.PollResultsView.as_view(), name="poll_results"),
    path("<int:pk>/edit/", views.PollUpdateView.as_view(), name="poll_edit"),
    path("<int:pk>/delete/", views.PollDeleteView.as_view(), name="poll_delete"),
    path("<int:pk>/duplicate/", views.poll_duplicate, name="poll_duplicate"),
    path("<int:pk>/export/", views.poll_export_csv, name="poll_export"),
]
