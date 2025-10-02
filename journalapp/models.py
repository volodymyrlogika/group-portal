from django.db import models
from django.contrib.auth.models import User

class JournalStudents(models.Model):
    GRADES = [
        ('Н', 'Не оцінено'),
        ('1', '1 бал'),
        ('2', '2 бали'),
        ('3', '3 бали'),
        ('4', '4 бали'),
        ('5', '5 балів'),
        ('6', '6 балів'),
        ('7', '7 балів'),
        ('8', '8 балів'),
        ('9', '9 балів'),
        ('10', '10 балів'),
        ('11', '11 балів'),
        ('12', '12 балів'),
    ]
    student_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='students_grades')
    grade = models.CharField(max_length=2, choices=GRADES)
    homework_grade = models.CharField(max_length=2, choices=GRADES)
    date = models.DateField()
    lesson = models.ForeignKey('Lesson', on_delete=models.CASCADE, null=True, blank=True, related_name='lesson_grades')

    def __str__(self):
        return f"{self.student_user.username} - {self.grade} on {self.date}"

class JournalHomework(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    due_date = models.DateField()

    def __str__(self):
        return self.title

class Lesson(models.Model):
    topic = models.CharField(max_length=200)
    date = models.DateField()
    homework = models.ForeignKey(JournalHomework, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"{self.topic} on {self.date}"
