from django.contrib import admin
from .models import CalendarEvent, Tag
# Register your models here.
admin.site.register(CalendarEvent)
admin.site.register(Tag)