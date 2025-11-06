from django.db import models
from django.contrib.auth.models import User 

# Create your models here.
class CalendarEvent(models.Model):
    COLORS = {
        'blue': 'Blue',
        'red': "Red",
        'green': 'Green',
        'magenta': 'Magenta',
        'yellow': 'Yellow',
        'cyan': 'Cyan',
        'purple': 'Purple',
        'pink': 'Pink',
    }

    date = models.DateField(verbose_name='Дата')
    name = models.CharField(max_length=255, verbose_name='Назва')
    

    # Not necessary fields
    time_start = models.TimeField(null=True, blank=True, verbose_name="Початок події")
    time_finish = models.TimeField(null=True, blank=True, verbose_name='Кінець події')
    description = models.TextField(null=True, blank=True, verbose_name="Опис")
    topic = models.CharField(null=True, blank=True, max_length=100, verbose_name='Тема')

    tags = models.ManyToManyField('Tag', blank=True, verbose_name="Теґи")
    color = models.CharField(choices=COLORS, max_length=100, default='blue')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='events')
    
    def __str__(self):
        return f'{self.name} на {self.date}'

    class Meta:
        verbose_name = 'Подія в календарі'
        verbose_name_plural = 'Події в календарі'


class Tag(models.Model):
    name = models.CharField(max_length=50, verbose_name='Назва теґу', unique=True)

    def __str__(self):
        return f'Теґ: {self.name}'
    
    class Meta:
        verbose_name = 'Теґ до події'
        verbose_name_plural = 'Теґи до подій'
