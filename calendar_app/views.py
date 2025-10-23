from django.shortcuts import render
from .models import CalendarEvent, Tag, PersonalEventColor

def calendar_view(request):
    context= {
        'events' : CalendarEvent.objects.all(),
        'tag' : Tag.objects.all(),
        'color' : PersonalEventColor.objects.all()

    }
    return render(request, 'calendar_app/calendar_tasks.html', context=context)
