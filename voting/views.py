from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required, user_passes_test
from django.utils import timezone
from django.contrib import messages
from django.urls import reverse
from django.views import View
from django.views.generic import ListView, DetailView, CreateView, UpdateView, DeleteView
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from .models import Poll, Question, Choice, Vote

# РОЛІ
def is_moderator_or_admin(user):
    return user.is_superuser or user.groups.filter(name__in=["Модератори", "Адміністратори"]).exists()


# СПИСОК ОПИТУВАНЬ
class PollListView(LoginRequiredMixin, ListView):
    model = Poll
    template_name = "voting/poll_list.html"
    context_object_name = "polls"

    def get_queryset(self):
        return Poll.objects.filter(is_active=True).order_by("-created_at")


# ДЕТАЛІ ОПИТУВАННЯ!
@login_required
def poll_detail(request, pk):
    poll = get_object_or_404(Poll, pk=pk)
    if not poll.is_open():
        messages.warning(request, "Це опитування наразі закрите.")
        return redirect("voting:poll_list")

    if request.method == "POST":
        for question in poll.questions.all():
            choice_id = request.POST.get(str(question.id))
            if not choice_id:
                continue
            choice = get_object_or_404(Choice, id=choice_id)
            Vote.objects.update_or_create(
                user=request.user,
                question=question,
                defaults={"poll": poll, "choice": choice}
            )
        messages.success(request, "Ваш голос успішно збережено!")
        return redirect("voting:poll_detail", pk=poll.pk)

    # отримати попередні голоси користувача
    user_votes = {vote.question_id: vote.choice_id for vote in Vote.objects.filter(user=request.user, poll=poll)}
    return render(request, "voting/poll_detail.html", {"poll": poll, "user_votes": user_votes})


# СТВОРЕННЯ/РЕДАГУВАННЯ/ВИДАЛЕННЯ
class PollCreateView(LoginRequiredMixin, UserPassesTestMixin, CreateView):
    model = Poll
    fields = ["title", "description", "is_active", "allow_revote", "start_at", "end_at"]
    template_name = "voting/poll_form.html"

    def form_valid(self, form):
        form.instance.created_by = self.request.user
        return super().form_valid(form)

    def test_func(self):
        return is_moderator_or_admin(self.request.user)


class PollUpdateView(LoginRequiredMixin, UserPassesTestMixin, UpdateView):
    model = Poll
    fields = ["title", "description", "is_active", "allow_revote", "start_at", "end_at"]
    template_name = "voting/poll_form.html"

    def test_func(self):
        return is_moderator_or_admin(self.request.user)


class PollDeleteView(LoginRequiredMixin, UserPassesTestMixin, DeleteView):
    model = Poll
    template_name = "voting/poll_confirm_delete.html"

    def test_func(self):
        return is_moderator_or_admin(self.request.user)

    def get_success_url(self):
        return reverse("voting:poll_list")
