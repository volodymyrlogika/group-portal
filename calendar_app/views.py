# ...existing code...
from django.shortcuts import render, redirect
from .models import CalendarEvent, Tag
from django.contrib.auth.models import User
from datetime import date, timedelta, datetime, time
import calendar
from urllib.parse import urlencode
from django.utils.translation import gettext as _

def calendar_view(request):
    today = date.today()

    # --- Обробка POST: створити нову подію ---
    if request.method == "POST":
        name = request.POST.get('name', '').strip() or 'Нова подія'
        date_str = request.POST.get('date')
        try:
            evt_date = datetime.strptime(date_str, '%Y-%m-%d').date() if date_str else today
        except Exception:
            evt_date = today

        def parse_time(s):
            try:
                return datetime.strptime(s, '%H:%M').time()
            except Exception:
                return None

        time_start = parse_time(request.POST.get('time-start', ''))
        time_finish = parse_time(request.POST.get('time-end', ''))

        topic = request.POST.get('topic', '').strip()
        description = request.POST.get('description', '').strip()
        color = request.POST.get('color', 'blue')

        user = request.user if request.user.is_authenticated else User.objects.first()

        evt = CalendarEvent.objects.create(
            date=evt_date,
            name=name,
            time_start=time_start,
            time_finish=time_finish,
            topic=topic,
            description=description,
            color=color,
            user=user,
        )

        tag_ids = request.POST.getlist('tags')
        if tag_ids:
            tags_qs = Tag.objects.filter(id__in=tag_ids)
            evt.tags.set(tags_qs)

        params = {
            'week': request.GET.get('week', 0),
            'year': request.GET.get('year', today.year),
            'month': request.GET.get('month', today.month),
        }
        return redirect(f"{request.path}?{urlencode(params)}")

    # --- GET: рендер сторінки ---
    try:
        week_offset = int(request.GET.get('week', 0))
    except (TypeError, ValueError):
        week_offset = 0

    start_of_week = today - timedelta(days=today.weekday()) + timedelta(days=week_offset * 7)
    end_of_week = start_of_week + timedelta(days=6)

    weekly_events = CalendarEvent.objects.filter(
        date__gte=start_of_week,
        date__lte=end_of_week
    ).select_related('user').prefetch_related('tags').order_by('date', 'time_start')

    all_tags = Tag.objects.all()

    events_by_day = {i: [] for i in range(7)}
    for event in weekly_events:
        events_by_day[event.date.weekday()].append(event)

    week_abbrs = ["ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ", "НД"]
    week_days = [start_of_week + timedelta(days=i) for i in range(7)]
    week_pairs = list(zip(week_abbrs, week_days))

    year = int(request.GET.get('year', today.year))
    month = int(request.GET.get('month', today.month))

    months_ua = [
        "Січень", "Лютий", "Березень", "Квітень", "Травень", "Червень",
        "Липень", "Серпень", "Вересень", "Жовтень", "Листопад", "Грудень"
    ]

    first_day_weekday, num_days = calendar.monthrange(year, month)
    start_display = date(year, month, 1) - timedelta(days=(first_day_weekday - 0) % 7)
    days = [start_display + timedelta(days=i) for i in range(42)]
    weeks = [days[i:i + 7] for i in range(0, len(days), 7)]

    prev_month = month - 1 or 12
    next_month = month + 1 if month < 12 else 1
    prev_year = year - 1 if month == 1 else year
    next_year = year + 1 if month == 12 else year

    context = {
        'events': weekly_events,
        'events_by_day': events_by_day,
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
        'week_pairs': week_pairs,
        'week_offset': week_offset,
        'week_prev': week_offset - 1,
        'week_next': week_offset + 1,
    }

    return render(request, 'calendar_app/calendar_tasks.html', context)
# ...existing code...