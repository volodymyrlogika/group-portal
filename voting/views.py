from django.shortcuts import render, get_object_or_404, redirect
from django.http import JsonResponse, HttpResponse, HttpResponseForbidden
from django.contrib.auth.decorators import login_required, user_passes_test
from django.utils import timezone
from django.contrib import messages
from django.urls import reverse
from django.views import View
from django.views.generic import ListView, CreateView, UpdateView, DeleteView, DetailView
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.core.paginator import Paginator
from django.db import transaction
import csv

from .models import Poll, Question, Choice, Vote

def is_moderator_or_admin(user):
    return user.is_superuser or user.groups.filter(name__in=["Модератори", "Адміністратори"]).exists()

class PollListView(LoginRequiredMixin, ListView):
    model = Poll
    template_name = "voting/poll_list.html"
    context_object_name = "polls"
    paginate_by = 8

    def get_queryset(self):
        qs = Poll.objects.order_by("-created_at")
        q = self.request.GET.get("q")
        status = self.request.GET.get("status")  # 'active' or 'closed' or None
        if q:
            qs = qs.filter(title__icontains=q)
        if status == "active":
            qs = qs.filter(is_active=True)
        elif status == "closed":
            qs = qs.filter(is_active=False)
        return qs

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        ctx['q'] = self.request.GET.get('q','')
        ctx['status'] = self.request.GET.get('status','')
        return ctx

@login_required
def poll_detail(request, pk):
    poll = get_object_or_404(Poll, pk=pk)
    if not poll.is_open():
        # allow viewing results if closed
        return redirect('voting:poll_results', pk=poll.pk)

    user_votes = {v.question_id: v.choice_id for v in Vote.objects.filter(user=request.user, poll=poll)}
    return render(request, "voting/poll_detail.html", {"poll": poll, "user_votes": user_votes})

class VoteAjaxView(LoginRequiredMixin, View):
    def post(self, request, pk):
        poll = get_object_or_404(Poll, pk=pk)
        if not poll.is_open():
            return JsonResponse({"error": "Poll closed"}, status=400)

        # Expect POST keys like 'question_<id>' with either single value or multiple for multi_select
        with transaction.atomic():
            for q in poll.questions.all():
                key = f"question_{q.pk}"
                if q.multi_select:
                    selected = request.POST.getlist(key)
                else:
                    val = request.POST.get(key)
                    selected = [val] if val else []

                # remove existing votes for this user+question
                Vote.objects.filter(user=request.user, question=q).delete()
                for choice_id in filter(None, selected):
                    choice = get_object_or_404(Choice, pk=choice_id, question=q)
                    Vote.objects.create(poll=poll, question=q, choice=choice, user=request.user)
        return JsonResponse({"ok": True, "redirect": reverse("voting:poll_results", kwargs={"pk": poll.pk})})

class PollResultsView(LoginRequiredMixin, DetailView):
    model = Poll
    template_name = "voting/poll_results.html"

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        poll = self.get_object()
        results = []
        for q in poll.questions.all():
            total = q.votes.count()
            choices = []
            for c in q.choices.all():
                count = c.votes.count()
                percent = (count / total * 100) if total > 0 else 0
                choices.append({"choice": c, "count": count, "percent": percent})
            results.append({"question": q, "total": total, "choices": choices})
        ctx["results"] = results
        return ctx

class PollCreateView(LoginRequiredMixin, UserPassesTestMixin, CreateView):
    model = Poll
    fields = ["title","description","is_active","allow_revote","start_at","end_at"]
    template_name = "voting/poll_form.html"

    def test_func(self):
        return is_moderator_or_admin(self.request.user)

    def form_valid(self, form):
        form.instance.created_by = self.request.user
        return super().form_valid(form)

class PollUpdateView(LoginRequiredMixin, UserPassesTestMixin, UpdateView):
    model = Poll
    fields = ["title","description","is_active","allow_revote","start_at","end_at"]
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

@login_required
@user_passes_test(is_moderator_or_admin)
def poll_duplicate(request, pk):
    orig = get_object_or_404(Poll, pk=pk)
    dup = Poll.objects.create(
        title=f"{orig.title} (copy)",
        description=orig.description,
        is_active=False,
        allow_revote=orig.allow_revote,
        start_at=orig.start_at,
        end_at=orig.end_at,
        created_by=request.user
    )
    for q in orig.questions.all():
        nq = q.__class__.objects.create(poll=dup, text=q.text, order=q.order, multi_select=q.multi_select)
        for c in q.choices.all():
            c.__class__.objects.create(question=nq, text=c.text)
    messages.success(request, "Опитування продубльовано (збережено як неактивне).")
    return redirect("voting:poll_edit", pk=dup.pk)

@login_required
@user_passes_test(is_moderator_or_admin)
def poll_export_csv(request, pk):
    poll = get_object_or_404(Poll, pk=pk)
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="poll_{poll.pk}_results.csv"'
    writer = csv.writer(response)
    writer.writerow(["Question", "Choice", "Votes"])
    for q in poll.questions.all():
        for c in q.choices.all():
            writer.writerow([q.text, c.text, c.votes.count()])
    return response
