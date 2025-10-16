from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
# Create your models here.

class Subredit(models.Model): # Імя , опис , картинка , автор
    name = models.CharField(max_length=150, verbose_name="Ім'я")
    description = models.TextField(verbose_name="Опис")
    image = models.ImageField(null=True , blank=True, upload_to='subreditamg', verbose_name="Картинка")
    author = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="aвтор")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} --- {self.author}"


class Coments(models.Model): # Імя , опис , людина яка опублікувала цей комент
    username = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="Ім'я коментатора")
    comsubredit = models.ForeignKey(Subredit, on_delete=models.CASCADE, related_name="comments") 
    name = models.CharField(max_length=150, verbose_name="Ім'я")
    description = models.TextField(null=False , blank=False)
    created_at = models.DateTimeField(auto_now_add=True)
    

    def __str__(self):
        return f"{self.name} --- {self.username} {self.description}"

class Answers(models.Model):
    username = models.ForeignKey(User, on_delete=models.CASCADE)
    answercomments = models.ForeignKey(Coments, on_delete=models.CASCADE, related_name="answers")
    description = models.TextField(null=False, blank=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.username} -- {self.answercomments}"