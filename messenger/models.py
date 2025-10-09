from django.db import models
from django.contrib.auth.models import User
from .choices.emoji import EMOJI_CHOICES

class BaseModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

class Chat(BaseModel):
    users = models.ManyToManyField(User, related_name='chats', blank=False)
    background = models.ImageField(upload_to='backgrounds/', null=True, blank=True, default='default/default_bg.png', verbose_name = 'Фон')
    is_group = models.BooleanField(default=False, verbose_name = 'Група')
    title = models.CharField(max_length=200, blank=True, null=True, verbose_name = 'Назва')

    def __str__(self):
        return self.title or f"Чат {self.id}"
    
    class Meta: 
        ordering = ["created_at"]
        verbose_name = 'Чат'
        verbose_name_plural = 'Чати'


class Message(BaseModel):
    chat = models.ForeignKey(Chat, on_delete=models.CASCADE, related_name='messages', null=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='messages', null=False)
    text = models.TextField(null=True, blank=True, verbose_name = 'Текст')

    def __str__(self):
        return f"{self.user}: {self.text[:30] if self.text else '[файл]'}"

    class Meta: 
        ordering = ["created_at"]
        verbose_name = 'Повідомлення'
        verbose_name_plural = 'Повідомлення'

class Attachment(BaseModel):
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='attachments')
    attachment = models.FileField(blank=False, null=False, verbose_name = 'Вкладення')

    def __str__(self):
        return f"Вкладення до повідомлення {self.message}"
    
    class Meta: 
        ordering = ["created_at"]
        verbose_name = 'Вкладення'
        verbose_name_plural = 'Вкладення'

class Reaction(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reactions', null=False)
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='reactions')
    emoji = models.CharField(max_length=10, choices=EMOJI_CHOICES, verbose_name = 'Емодзі')

    def __str__(self):
        return f"{self.emoji} --- {self.message}"
    
    class Meta: 
        ordering = ["created_at"]
        verbose_name = 'Реакція'
        verbose_name_plural = 'Реакції'
        constraints = [
            models.UniqueConstraint(fields=['user', 'message', 'emoji'], name='unique_user_reaction')
        ]


