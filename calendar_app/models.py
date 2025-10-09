from django.db import models
from django.contrib.auth.models import User 

# Create your models here.
class CalendarEvent(models.Model):
    date = models.DateField(verbose_name='Дата')
    name = models.CharField(max_length=255, verbose_name='Назва')
    

    # Not necessary fields
    time_start = models.TimeField(null=True, blank=True, verbose_name="Початок події")
    time_finish = models.TimeField(null=True, blank=True, verbose_name='Кінець події')
    description = models.TextField(null=True, blank=True, verbose_name="Опис")
    topic = models.CharField(null=True, blank=True, max_length=100, verbose_name='Тема')
    
    def __str__(self):
        return f'{self.name} на {self.date}'

    class Meta:
        verbose_name = 'Подія в календарі'
        verbose_name_plural = 'Події в календарі'


class Tag(models.Model):
    name = models.CharField(max_length=50, verbose_name='Назва теґу')
    event = models.ForeignKey(CalendarEvent, on_delete=models.DO_NOTHING, verbose_name="Подія до якої прив'язаний теґ")

    def __str__(self):
        return f'Теґ: {self.name}'
    
    class Meta:
        verbose_name = 'Теґ до події'
        verbose_name_plural = 'Теґи до подій'

class PersonalEventColor(models.Model):
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

    color = models.CharField(max_length=255, choices=COLORS, default='blue', verbose_name='Персоналізований колір події')
    event = models.ForeignKey(CalendarEvent, on_delete=models.DO_NOTHING, verbose_name='Подія для персоналізованого коліру')
    user = models.ForeignKey(User, on_delete=models.DO_NOTHING, verbose_name='Користувач, який вибирає колір події')

    def __str__(self):
        return f'Колір {self.name} для події "{self.event}" для {self.user}'
    
    class Meta:
        verbose_name = 'Персоналізований колір для події'
        verbose_name_plural = 'Персоналізовані кольори для подій'
