from django.shortcuts import render

from journalapp.models import JournalStudents, Lesson

def home(request):
    lessons = Lesson.objects.all()
    journal_students = JournalStudents.objects.all()
    return render(request, 'journal/journal.html', {'journal_students': journal_students, 'lessons': lessons})


