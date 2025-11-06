from django.urls import path
from . import views

app_name = 'surveys'

urlpatterns = [
    path('', views.SurveyListView.as_view(), name='survey_list'),
    path('<int:pk>/', views.SurveyDetailView.as_view(), name='survey_detail'),
    path('<int:survey_id>/question/<int:order>/', views.survey_question, name='survey_question'),
    path('<int:survey_id>/results/', views.survey_results, name='survey_results'),
]
