from django.shortcuts import render
from django.views.generic import ListView
from .models import Survey
from django.views.generic import DetailView




# Create your views here.
class SurveyListView(ListView):
    model = Survey
    template_name = 'surveys/survey_list.html'
    context_object_name = 'surveys'


class SurveyDetailView(DetailView):
    model = Survey
    template_name = 'surveys/survey_detail.html'
    context_object_name = 'survey'

class SurveyResultsView(DetailView):
    model = Survey
    template_name = 'surveys/survey_results.html'
    context_object_name = 'survey'



