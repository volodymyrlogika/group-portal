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

    # --- ДОДАНО: month/year та навігація для маленького календаря і заголовка ---
    try:
        month = int(request.GET.get('month', today.month))
    except (TypeError, ValueError):
        month = today.month
    try:
        year = int(request.GET.get('year', today.year))
    except (TypeError, ValueError):
        year = today.year

    months_ua = [
        "Січень", "Лютий", "Березень", "Квітень", "Травень", "Червень",
        "Липень", "Серпень", "Вересень", "Жовтень", "Листопад", "Грудень"
    ]

    # Тижні місяця для small calendar (list of weeks -> each week is list of date objects)
    cal = calendar.Calendar(firstweekday=0)  # Monday as first day
    weeks = cal.monthdatescalendar(year, month)

    # попередній / наступний місяць (коректно з роком)
    first_of_month = date(year, month, 1)
    prev_date = first_of_month - timedelta(days=1)
    next_date = first_of_month + timedelta(days=calendar.monthrange(year, month)[1])
    prev_month = prev_date.month
    prev_year = prev_date.year
    next_month = next_date.month
    next_year = next_date.year

    # week_pairs — список пар (абревіатура, date) для верхньої навігації днів тижня
    day_abbrs = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд']
    week_pairs = []
    for i in range(7):
        d = start_of_week + timedelta(days=i)
        week_pairs.append((day_abbrs[i], d))

    weekly_events = CalendarEvent.objects.filter(
        date__gte=start_of_week,
        date__lte=end_of_week
    ).select_related('user').prefetch_related('tags').order_by('date', 'time_start')

    all_tags = Tag.objects.all()

    events_by_day = {i: [] for i in range(7)}
    for event in weekly_events:
        events_by_day[event.date.weekday()].append(event)

    # --- ДОДАНО: підготувати структуру для рендерингу в сітці ---
    hours = list(range(24))
    # map (hour, weekday) -> list of event dicts (timed start/end)
    grid_events = {}
    # all-day (no time_start) events per weekday (show без орба та зверху колонки)
    all_day = {i: [] for i in range(7)}

    for event in weekly_events:
        wd = event.date.weekday()
        color = event.color or 'blue'
        frame_class = f"{color}-frame"
        orb_class = f"{color}-orb"
        inner_orb_class = f"{color}-inner-orb"

        if not event.time_start:
            # all-day/top event (без орба)
            all_day[wd].append({
                'name': event.name,
                'topic': event.topic,
                'date': event.date,
                'description': event.description,
                'tags': [t.name for t in event.tags.all()],
                'user': str(event.user),
                'frame_class': frame_class,
                'id': event.id,
            })
        else:
            # timed: створюємо два блоки — start і end з однаковим числовим id
            start_hour = event.time_start.hour
            end_hour = (event.time_finish.hour if event.time_finish else start_hour)

            start_obj = {
                'kind': 'start',
                'name': f"Початок: {event.name}",
                'event_id': event.id,
                'frame_class': frame_class,
                'orb_class': orb_class,
                'inner_orb_class': inner_orb_class,
                'time_start': event.time_start.strftime('%H:%M') if event.time_start else None,
                'time_finish': event.time_finish.strftime('%H:%M') if event.time_finish else None,
                'date': event.date,
                'topic': event.topic,
                'description': event.description,
                'tags': [t.name for t in event.tags.all()],
                'user': str(event.user),
            }
            end_obj = {
                'kind': 'end',
                'name': f"Кінець: {event.name}",
                'event_id': event.id,
                'frame_class': frame_class,
                'orb_class': orb_class,
                'inner_orb_class': inner_orb_class,
                'time_start': event.time_start.strftime('%H:%M') if event.time_start else None,
                'time_finish': event.time_finish.strftime('%H:%M') if event.time_finish else None,
                'date': event.date,
                'topic': event.topic,
                'description': event.description,
                'tags': [t.name for t in event.tags.all()],
                'user': str(event.user),
            }

            grid_events.setdefault((start_hour, wd), []).append(start_obj)
            grid_events.setdefault((end_hour, wd), []).append(end_obj)

    # --- ДОДАНО: зручніші структури для шаблону ---
    # weekday indices для ітерації у шаблоні
    weekday_indices = list(range(7))

    # Перетворити ключі tuple -> строка "H-WD" щоб легко звертатись з шаблона
    grid_events_str = {}
    for (hour, wd), lst in grid_events.items():
        grid_events_str[f"{hour}-{wd}"] = lst

    # --- ДОДАНО: nested dict hour -> weekday -> list, простіше для шаблону ---
    grid_events_by_hour = {h: {wd: [] for wd in range(7)} for h in hours}
    for key, lst in grid_events_str.items():
        try:
            hour_s, wd_s = key.split('-', 1)
            hour_i = int(hour_s); wd_i = int(wd_s)
            grid_events_by_hour.setdefault(hour_i, {})[wd_i] = lst
        except Exception:
            continue

    # додати в context
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
        'hours': hours,
        'grid_events': grid_events,
        'grid_events_str': grid_events_str,
        'grid_events_by_hour': grid_events_by_hour,  # <-- додано
        'all_day': all_day,
        'weekday_indices': weekday_indices,  # <-- додано
    }

    return render(request, 'calendar_app/calendar_tasks.html', context)
# ...existing code...