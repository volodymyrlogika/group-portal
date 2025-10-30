from django import template
from datetime import date

register = template.Library()

# Українські назви днів і місяців
UKR_DAYS = [
    "Понеділок", "Вівторок", "Середа", "Четвер",
    "Пʼятниця", "Субота", "Неділя"
]

UKR_MONTHS = [
    "січня", "лютого", "березня", "квітня", "травня", "червня",
    "липня", "серпня", "вересня", "жовтня", "листопада", "грудня"
]

@register.filter
def ukr_date(value):
    """Форматує дату як 'Понеділок, 27 жовтня'."""
    if not isinstance(value, date):
        return value
    weekday = UKR_DAYS[value.weekday()]
    month = UKR_MONTHS[value.month - 1]
    return f"{weekday}, {value.day} {month}"

# --- ДОДАНО: безпечний доступ до словника/списку з шаблона ---
@register.filter
def get_item(container, key):
    """
    Повертає container[key] або container.get(key) або [] якщо відсутній.
    Використовується у шаблоні для динамічних звернень до dict/list.
    """
    try:
        if hasattr(container, 'get'):
            return container.get(key, [])
        return container[key]
    except Exception:
        try:
            # для випадку, коли key може бути int у вигляді строки
            k = int(key)
            return container[k]
        except Exception:
            return []
# ...existing code...