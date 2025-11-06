from django.shortcuts import render, get_object_or_404, redirect
from django.views.generic import ListView, DetailView
from .models import Survey, Question, Choice, UserSurvey, UserAnswer


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


def survey_question(request, survey_id, order):
 
    if not request.user.is_authenticated:
        return redirect('login')

    survey = get_object_or_404(Survey, id=survey_id)
    question = survey.questions.order_by('order').filter(order=order).first()
    if not question:
        return redirect('surveys:survey_results', survey_id=survey.id)

    user_survey, created = UserSurvey.objects.get_or_create(user=request.user, survey=survey)

    if request.method == 'POST':
        choice_id = request.POST.get('choice')
        if choice_id:
            choice = get_object_or_404(Choice, id=choice_id)
         
            UserAnswer.objects.filter(user_survey=user_survey, question=question).delete()
            UserAnswer.objects.create(user_survey=user_survey, question=question, choice=choice)

        
            next_question = survey.questions.order_by('order').filter(order__gt=question.order).first()
            if next_question:
                return redirect('surveys:survey_question', survey_id=survey.id, order=next_question.order)
            return redirect('surveys:survey_results', survey_id=survey.id)

    total = survey.questions.count()
    current = list(survey.questions.order_by('order')).index(question) + 1
    progress = int(current / total * 100) if total else 0

    return render(request, 'surveys/survey_question.html', {
        'survey': survey,
        'question': question,
        'current': current,
        'total': total,
        'progress': progress,
    })


def survey_results(request, survey_id):
    survey = get_object_or_404(Survey, id=survey_id)
    user_survey = UserSurvey.objects.filter(user=request.user, survey=survey).first()
    answers = user_survey.answers.all() if user_survey else []

    return render(request, 'surveys/survey_results.html', {
        'survey': survey,
        'answers': answers
    })
