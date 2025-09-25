from django.db import models
from django.contrib.auth.models import User
# Create your models here.

class Subredit(models.Model): # Імя , опис , картинка , автор
    name = models.CharField(max_length=150, verbose_name="Ім'я")
    description = models.TextField(null=True, blank=True, verbose_name="Опис")
    image = models.ImageField(upload_to='subreditamg', verbose_name="Картинка")
    author = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="aвтор")


class Coments(models.Model): # Імя , опис , людина яка опублікувала цей комент
    name = models.CharField(max_length=150, verbose_name="Ім'я")
    description = models.TextField(null=False , blank=False)
    username = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="Ім'я коментатора")

    def __str__(self):
        return f"{self.name} --- {self.username}"