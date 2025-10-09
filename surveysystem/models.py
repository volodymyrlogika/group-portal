# surveys/models.py
from django.db import models
from django.contrib.auth.models import User

class Survey(models.Model):
    title = models.CharField(max_length=255, null=True, verbose_name="Назва")
    description = models.TextField(blank=True, verbose_name="Опис")
    author = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="Автор")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата створення")
    status = models.BooleanField(default=True, verbose_name="Статус")
    deadline = models.DateTimeField(null=True, blank=True, verbose_name="Дедлайн")

    def __str__(self):
        return self.title


class Question(models.Model):
    order = models.PositiveIntegerField(default=0, verbose_name="Порядок")
    survey = models.ForeignKey(Survey, on_delete=models.CASCADE, related_name='questions', verbose_name="Опитування")
    text = models.TextField(verbose_name="Текст питання")
    image = models.ImageField(upload_to='question_images/', null=True, blank=True, verbose_name="Зображення")

    def __str__(self):
        return f"{self.order}. {self.text[:50]}"


class Choice(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='choices', verbose_name="Питання")
    text = models.CharField(max_length=255, verbose_name="Текст варіанту")
    image = models.ImageField(upload_to='choice_images/', null=True, blank=True, verbose_name="Зображення")

    def __str__(self):
        return self.text


class UserSurvey(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="Користувач")
    survey = models.ForeignKey(Survey, on_delete=models.CASCADE, verbose_name="Опитування")
    completed_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('user', 'survey')


class UserAnswer(models.Model):
    user_survey = models.ForeignKey(UserSurvey, on_delete=models.CASCADE, related_name="answers")
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    choice = models.ForeignKey(Choice, on_delete=models.CASCADE)
