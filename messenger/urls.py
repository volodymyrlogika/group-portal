from django.urls import path
from .views import ChatView, SendMessageView, CreateGroupView

urlpatterns = [
    path("create_group/", CreateGroupView.as_view(), name="create_group"),
    path("chat/<int:pk>/", ChatView.as_view(), name="chat"),
    path("api/send_message/<int:chat_id>/", SendMessageView.as_view(), name="send_message"),
]