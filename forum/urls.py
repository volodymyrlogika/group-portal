from django.urls import path
from .views import forum , post_form , update_form,\
del_post, add_comment, del_comment, add_answer , del_answer , helloworldpage


urlpatterns = [
   path('sub/', forum, name="subredts"),
   path('create-post/', post_form, name="crform"),
   path("update-post/<int:id_post>/", update_form, name="updform"),
   path('delete-post/<int:id_post>/', del_post, name="delform"),
   path('addcomment-post/<int:id_post>/', add_comment, name="addcom"),
   path('del_comment-post/<int:id_com>/', del_comment, name="dlcom"),
   path('add_answer-comment/<int:id_com>/', add_answer, name="addanswer"),
   path('del_answer-comment/<int:id_answer>/', del_answer, name="delanswer"),
   path("helloworld", helloworldpage, name="hiworldp"),
]