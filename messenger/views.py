from django.views.generic import DetailView, View, CreateView
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, redirect
from django.contrib.auth.models import User
from django.contrib.auth.mixins import LoginRequiredMixin
from django.urls import reverse_lazy
from .models import Chat, Message
from .forms import MessageForm, GroupForm
from django.db.models import Count
import json

#Вью для створення чату
class CreateChatView(LoginRequiredMixin, View):
    def post(self, request, *args, **kwargs):
        current_user = request.user
        other_user_id = request.POST.get('user_id')

        if not other_user_id:
            return JsonResponse({'error': 'Не вказано користувача'}, status=400)

        other_user = get_object_or_404(User, id=other_user_id)

        chat = (
            Chat.objects.filter(is_group=False)
            .annotate(num_users=Count('users'))
            .filter(num_users=2, users=current_user)
            .filter(users=other_user)
            .first()
        )

        if not chat:
            chat = Chat.objects.create(is_group=False) 
            chat.users.add(current_user, other_user)

        return redirect('chat', pk=chat.id)
    
#Сторінка для створення групи
class CreateGroupView(CreateView):
    model = Chat
    form_class = GroupForm
    template_name = 'messenger/create_group.html'
    success_url = reverse_lazy('main')
    def form_valid(self, form):
        chat = form.save(commit=False)
        chat.is_group = True
        chat.save()
        form.save_m2m()
        chat.users.add(self.request.user)
        return redirect('chat', pk=chat.id)
    

#Основна сторінка виведення чату
class ChatView(LoginRequiredMixin, DetailView):
    model = Chat
    template_name = 'messenger/chat.html'
    context_object_name = 'chat'

    def get_object(self, queryset=None):
        chat = get_object_or_404(Chat, id=self.kwargs['pk'])
        return chat

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        context["messages"] = self.object.messages.all()
        context["users"] = User.objects.all().exclude(id=self.request.user.id)
        context["chats"] = Chat.objects.filter(users=self.request.user)
        context["form"] = MessageForm()
        return context

#Вью для відправки повідомлень
class SendMessageView(LoginRequiredMixin, View):
    def post(self, request, *args, **kwargs):
        form = MessageForm(json.loads(request.body))
        if form.is_valid():
            chat_id = kwargs.get('chat_id') or json.loads(request.body).get('chat_id')
            chat = get_object_or_404(Chat, id=chat_id)
            message = Message.objects.create(
                chat = chat,
                user = request.user,
                text = form.cleaned_data['text']
            )

            return JsonResponse({
                "user": message.user.username,
                "text": message.text,
                "created_at": str(message.created_at)
            })
        return JsonResponse({'errors': form.errors}, status=400)

