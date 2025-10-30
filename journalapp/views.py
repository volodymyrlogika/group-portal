from datetime import date, datetime
from django.shortcuts import redirect, render
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

def save_journal(request):
    if request.method == "POST":
        for key in request.POST:
            if key.startswith("grade_"):
                student_id = key.split("_")[1] 
                try:
                    student = JournalStudents.objects.get(id=student_id)
                    student.grade = request.POST.get(f"grade_{student_id}")
                    student.homework_grade = request.POST.get(f"homework_grade_{student_id}")

                    date_input = request.POST.get(f"date_{student_id}", "")
                    if date_input:
                        try:
                            dt = datetime.strptime(date_input, "%d %B %Y р.")
                            student.date = dt.date()
                        except ValueError:
                            student.date = date.today()
                    else:
                        student.date = date.today()

                    student.save()
                except JournalStudents.DoesNotExist:
                    continue
    return redirect('home')

