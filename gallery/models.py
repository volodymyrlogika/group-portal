from  django.db import models
from django.contrib.auth.models import User

class GalleryItem(models.Model):
    MEDIA_TYPES = (
        ('photo', 'Фото'),
        ('video', 'Відео'),
    )

    title = models.CharField(max_length=200, verbose_name="Назва")
    description = models.TextField(blank=True, verbose_name="Опис")
    media_type = models.CharField(max_length=10, choices=MEDIA_TYPES, default='photo')
    file = models.FileField(upload_to='gallery/')
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="Користувач")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title