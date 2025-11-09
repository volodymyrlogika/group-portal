from django.shortcuts import redirect, render
from django.contrib.auth.views import LoginView, LogoutView
from django.views import View
from django.views.generic import CreateView
from .models import CustomUser, Role
from django.urls import reverse_lazy
from django.contrib.auth.mixins import LoginRequiredMixin, PermissionRequiredMixin
from django.contrib.auth import login, logout

from accounts.forms import LoginForm, RegisterForm


class CustomLoginView(LoginView):
    template_name = 'accounts/login.html'
    redirect_authenticated_user = True
    form_class = LoginForm


class CustomLogoutView(View):
    next_page = reverse_lazy('login')

    def get(self, request, *args, **kwargs):
        logout(request)
        return redirect(self.next_page)
        

class RegisterView(CreateView):
    model = CustomUser
    template_name = 'accounts/register.html'
    form_class = RegisterForm
    success_url = reverse_lazy('login')

    def form_valid(self, form):
        form.instance.role = Role.objects.get_or_create(name = "Member")[0]
        return super().form_valid(form)




