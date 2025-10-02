from django.db import models

class Survey(models.Model):
    title = models.CharField(max_length=255, null=True,verbose_name="Назва")
    description = models.TextField(blank=True, verbose_name="Опис")
    author = models.ForeignKey('auth.User', on_delete=models.CASCADE, verbose_name="Автор")
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
    

class Choice(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='choices', verbose_name="Питання")
    text = models.CharField(max_length=255, verbose_name="Текст варіанту")
    image = models.ImageField(upload_to='choice_images/', null=True, blank=True, verbose_name="Зображення")
    is_correct = models.BooleanField(default=False, verbose_name="Правильний варіант")