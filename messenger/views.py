from django.views.generic import View, CreateView
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.contrib.auth.models import User
from django.contrib.auth.mixins import LoginRequiredMixin
from django.urls import reverse_lazy
from .models import Chat, Message, Reaction
from .forms import MessageForm, GroupForm
from django.db.models import Count
from .choices.emoji import EMOJI_CHOICES
import json

#Вью для створення чату
class CreateChatView(LoginRequiredMixin, View):
    def post(self, request, *args, **kwargs):
        current_user = request.user
        other_user_id = request.POST.get('user_id')

        if not other_user_id:
            return JsonResponse({'error': 'Не вказано користувача'}, status=400)

        other_user = get_object_or_404(User, id=other_user_id)

        chat = Chat.objects.filter(is_group=False, users=current_user).filter(users=other_user).first()
        
        if not chat:
            chat = Chat.objects.create(is_group=False)
            chat.users.add(current_user, other_user)

        return redirect('chat', chat_pk=chat.id)
    
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
        return redirect('chat', chat_pk=chat.id)
    

#Основна сторінка виведення чату
class ChatView(LoginRequiredMixin, View):
    template_name = 'messenger/chat.html'

    def get(self, request, chat_pk=None, *args, **kwargs):
        chat = None
        if chat_pk:
            chat = get_object_or_404(Chat, id=chat_pk, users=request.user)
        else:
            chat = Chat.objects.filter(users=request.user).first()

        messages = []
        if chat:
            messages = (
                chat.messages.all()
                .select_related("user")
                .prefetch_related("reactions")
            )

            for msg in messages:
                msg.reaction_counts = (
                    msg.reactions.values("emoji")
                    .annotate(count=Count("emoji"))
                    .order_by()
                )

        context = {
            "chat": chat,
            "messages": messages,
            "users": User.objects.exclude(id=request.user.id),
            "chats": Chat.objects.filter(users=request.user),
            "form": MessageForm(),
            "emoji_choices": EMOJI_CHOICES,
        }

        return render(request, self.template_name, context)

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
                "id": message.id, 
                "user": message.user.username,
                "text": message.text,
                "created_at": str(message.created_at)
            })
        return JsonResponse({'errors': form.errors}, status=400)


#В'ю для реакцій
class AddReactionView(LoginRequiredMixin, View):
    def post(self, request, message_id, *args, **kwargs):
        data = json.loads(request.body)
        emoji = data.get("emoji")

        if not emoji:
            return JsonResponse({"success": False, "error": "Не вказано емодзі"}, status=400)

        message = get_object_or_404(Message, id=message_id)
        user = request.user

        existing_reaction = Reaction.objects.filter(message=message, user=user).first()

        if existing_reaction:
            if existing_reaction.emoji == emoji:
                existing_reaction.delete()
                return JsonResponse({"success": True, "removed": True, "emoji": emoji})
            else:
                existing_reaction.emoji = emoji
                existing_reaction.save()
                return JsonResponse({"success": True, "changed": True, "emoji": emoji})
        else:
            Reaction.objects.create(message=message, user=user, emoji=emoji)
            return JsonResponse({"success": True, "added": True, "emoji": emoji})