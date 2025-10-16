from django.shortcuts import render , redirect,  get_object_or_404
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.decorators import login_required
from .models import Subredit , Coments , Answers
from .forum import Post , CommentForm , Answertocom
# Create your views here.

@login_required
def forum(request):
    subredits = Subredit.objects.all()
    com = Coments.objects.all()
    ans = Answers.objects.all()


    post_form = Post()
    comment_form = CommentForm()
    ans_form = Answertocom()
    return render(request, "forum/forum.html", {"subredits" : subredits , 
                                                "com" : com,
                                                "ans" : ans,
                                                "post_form" : post_form,
                                                "comment_form" : comment_form,
                                                "ans_form" : ans_form,
                                                })

@login_required
def post_form(request):
    form = Post()
    if request.user.is_superuser:
        if request.method == "POST":
            form = Post(request.POST, request.FILES)
            if form.is_valid():
                new_post = form.save(commit=False)
                new_post.author = request.user
                new_post.save()
                return redirect("subredts")
            else:
                print(form.errors) 
            
    return render(request, "forum/crform.html", {"post_form":form})

@login_required
def del_post(request, id_post):
    if request.user.is_superuser:
        post_del = get_object_or_404(Subredit, id=id_post)
        if request.method == "POST":
            post_del.delete()
            return redirect("subredts")
            
        return render(request, "forum/updform.html", {"post":post_del})
            


@login_required
def update_form(request, id_post):
    post = get_object_or_404(Subredit, id=id_post)
    if request.user.is_superuser:
        if request.method == "POST":
            form = Post(request.POST, request.FILES, instance=post)
            if form.is_valid():
                form.save()
                return redirect("updform", id_post=post.id)
        else:
            form = Post(instance=post)
    return render(request, "forum/updform.html", {"form":form,
                                                  "subredits":[post]})

@login_required
def add_comment(request, id_post):
    post = get_object_or_404(Subredit, id=id_post)
    if request.method == "POST":
        comment_form = CommentForm(request.POST)
        if comment_form.is_valid():
            comment = comment_form.save(commit= False)
            comment.comsubredit = post
            comment.username = request.user
            comment.save()
            return redirect("subredts")
    else: 
        comment_form = CommentForm()
    return render(request, "forum/createcom.html", {"post":post,
                                                    "comment":comment_form})

@login_required
def del_comment(request, id_com):
    comment = get_object_or_404(Coments, id=id_com)
    if request.user == comment.username or request.user.is_superuser:
        if request.method == "POST":
            comment.delete()

    return redirect("subredts")
    

@login_required
def add_answer(request, id_com):
    post = get_object_or_404(Coments, id=id_com)
    if request.method == "POST":
        answer_form = Answertocom(request.POST)
        if answer_form.is_valid():
            answer = answer_form.save(commit=False)
            answer.answercomments = post
            answer.username = request.user
            answer.save()
            return redirect("subredts")
    else:
        answer_form = Answertocom()
    return render(request, "forum/addanswer.html", {"post":post,
                                                    "answer":answer_form})

@login_required
def del_answer(request, id_answer):
    answer = get_object_or_404(Answers, id=id_answer)
    if request.user == answer.username or request.user.is_superuser:
        if request.method == "POST":
            answer.delete()
        
    return redirect("subredts")