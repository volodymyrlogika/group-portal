from django.views.generic import ListView, DetailView, CreateView, UpdateView, DeleteView, View
from .models import Chat, Message, Reaction, Attachment
from django.urls import reverse_lazy
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User


class ChatView(DetailView):
    model = Chat
    template_name = 'messenger/chat.html'
    context_object_name = 'chat'

    def get_object(self, queryset=None):
        current_user = self.request.user
        other_user = get_object_or_404(User, id=self.kwargs['pk'])
        
        chat = Chat.objects.filter(users=current_user).filter(users=other_user).first()
        if not chat:
            chat = Chat.objects.create()
            chat.users.add(current_user, other_user)
        return chat

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['messages'] = self.object.messages.all().order_by('created_at')
        return context