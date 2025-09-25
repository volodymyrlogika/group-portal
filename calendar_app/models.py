from django.db import models

# Create your models here.
class CalendarEvent(models.Model):
    COLORS = {
        'red' : 'Red',
        'blue' : 'Blue',
        'green' : 'Green',
        'magenta' : 'Magenta',
        'cyan' : 'cyan',
        'purple' : 'purple',
        'dark-blue' : 'Dark Blue'
    }

    date = models.DateField(verbose_name='Дата')
    name = models.CharField(max_length=255, verbose_name='Назва')
    color = models.CharField(choices=COLORS, default='blue', verbose_name="Колір")
    

    # Not necessary fields
    time_start = models.TimeField(null=True, blank=True, verbose_name="Початок події")
    time_finish = models.TimeField(null=True, blank=True, verbose_name='Кінець події')
    description = models.TextField(null=True, blank=True, verbose_name="Опис")
    
    def __str__(self):
        return f'{self.name} на {self.date}'