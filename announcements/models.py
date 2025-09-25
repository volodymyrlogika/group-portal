from django.db import models
from django.contrib.auth import User

class Announcements(models.Model):
    STATUS_CHOICES = [
        ("draft", "Чернетка"),
        ("published", "Опубліковане"),
        ("archived", "Архівоване"),
    ]

    title = models.CharField(max_length=200, verbose_name="Заголовок")
    content = models.TextField(verbose_name="Текст оголошення")
    author = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="Автор")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата створення")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Дата оновлення")
    attachment = models.FileField(upload_to='attachment', blank=True, null=True, verbose_name="Вкладення файлів")
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="draft", verbose_name="Статус")