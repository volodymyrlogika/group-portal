from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from journalapp.models import JournalStudents, Lesson

def home(request):
    lessons = Lesson.objects.all()
    journal_students = JournalStudents.objects.all()
    return render(request, 'journal/journal.html', {'journal_students': journal_students, 'lessons': lessons})

@login_required
def edit_journal(request):
    lessons = Lesson.objects.all()
    journal_students = JournalStudents.objects.all()
    return render(request, 'journal/edit_journal.html', {'journal_students': journal_students, 'lessons': lessons})



