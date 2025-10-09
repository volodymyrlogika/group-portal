from django.contrib import admin
from .models import Chat, Message, Attachment, Reaction

admin.site.register(Chat)
admin.site.register(Message)
admin.site.register(Attachment)
admin.site.register(Reaction)