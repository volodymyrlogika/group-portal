from django.shortcuts import render
from django.urls import reverse_lazy
from .models import Announcements
from django.shortcuts import render
from django.urls import reverse_lazy
from django.views.generic import ListView, CreateView, UpdateView
from django.contrib.auth.mixins import LoginRequiredMixin
from .forms import AnnouncementsForm

def announcements_list(request):
    announcements = Announcements.objects.filter(status="published").order_by("-created_at")
    return render(request, "announcements/announcements_list.html", {"announcements": announcements})

class AnnouncementsCreateView(LoginRequiredMixin, CreateView):
    model = Announcements
    template_name = 'announcemets_create.html'
    success_url = reverse_lazy('announcements_list')
    form_class = AnnouncementsForm

    def form_valid(self, form):
        form.instance.user = self.request.user
        return super().form_valid(form)


