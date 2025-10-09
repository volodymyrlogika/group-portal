from django.shortcuts import render
from .models import Announcements


def announcements_list(request):
    announcements = Announcements.objects.filter(status="published").order_by("-created_at")
    return render(request, "announcements/announcements_list.html", {"announcements": announcements})

