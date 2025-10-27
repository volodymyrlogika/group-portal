from django.shortcuts import render
from .models import CalendarEvent, Tag
from datetime import datetime, timedelta
from datetime import date, timedelta
import calendar
from django.utils.translation import gettext as _

def calendar_view(request):
    today = date.today()
    
    

    # ---- Тиждень ----
    start_of_week = today - timedelta(days=today.weekday())
    end_of_week = start_of_week + timedelta(days=6)

    weekly_events = CalendarEvent.objects.filter(
        date__gte=start_of_week,
        date__lte=end_of_week
    ).order_by('date', 'time_start')

    all_tags = Tag.objects.all()

    # ---- Календар ----
    year = int(request.GET.get('year', today.year))
    month = int(request.GET.get('month', today.month))

    months_ua = [
        "Січень", "Лютий", "Березень", "Квітень", "Травень", "Червень",
        "Липень", "Серпень", "Вересень", "Жовтень", "Листопад", "Грудень"
    ]

    first_day_weekday, num_days = calendar.monthrange(year, month)

    # Старт від понеділка перед першим днем місяця
    start_display = date(year, month, 1) - timedelta(days=(first_day_weekday - 0) % 7)
    days = [start_display + timedelta(days=i) for i in range(42)]

    # Групуємо у тижні (7 днів у кожному)
    weeks = [days[i:i+7] for i in range(0, len(days), 7)]

    prev_month = month - 1 or 12
    next_month = month + 1 if month < 12 else 1
    prev_year = year - 1 if month == 1 else year
    next_year = year + 1 if month == 12 else year

    context = {
        'events': weekly_events,
        'tags': all_tags,
        'today': today,
        'start_of_week': start_of_week,
        'end_of_week': end_of_week,
        'weeks': weeks,
        'month_name': months_ua[month - 1],
        'month': month,
        'year': year,
        'prev_month': prev_month,
        'next_month': next_month,
        'prev_year': prev_year,
        'next_year': next_year,
    }

    return render(request, 'calendar_app/calendar_tasks.html', context)