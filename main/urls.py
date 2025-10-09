from django.urls import path
from . import views

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    path("announcements/", include("announcements.urls")),
]
