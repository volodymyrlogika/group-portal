from django.urls import path
from . import views


urlpatterns = [
    path('', views.SurveyListView.as_view(), name='survey_list'),
    path('surveys/<int:pk>/', views.SurveyDetailView.as_view(), name='survey_detail'),
    path('surveys/<int:pk>/results/', views.SurveyResultsView.as_view(), name='survey_results'),
    path('surveys/<int:pk>/question/<int:order>/', views.survey_question, name='survey_question'),
]
