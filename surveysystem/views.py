from django.shortcuts import render
from django.views.generic import ListView, DetailView
from .models import Survey





# Create your views here.
class SurveyListView(ListView):
    model = Survey
    template_name = 'surveys/survey_list.html'
    context_object_name = 'surveys'

    def get_queryset(self):
        return Survey.objects.filter(status=True)


class SurveyDetailView(DetailView):
    model = Survey
    template_name = 'surveys/survey_detail.html'
    context_object_name = 'survey'

class SurveyResultsView(DetailView):
    model = Survey
    template_name = 'surveys/survey_results.html'
    context_object_name = 'survey'




def survey_question(request, pk, order):
    survey = Survey.objects.get(pk=pk)
    question = survey.questions.get(order=order)
    context = {
        'survey': survey,
        'question': question,
    }

    
    return render(request, 'surveys/survey_question.html', context)

