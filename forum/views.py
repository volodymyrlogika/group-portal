from django.shortcuts import render , redirect,  get_object_or_404
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.decorators import login_required
from .models import Subredit , Coments
from .forum import Post , CommentForm
# Create your views here.

@login_required
def forum(request, pk=None):
    subredits = Subredit.objects.all()
    com = Coments.objects.all()

    post_form = Post()
    form = CommentForm()

    if not request.user.is_superuser:
        if request.method == "POST":
            post_form = Post(request.POST)
            if post_form.is_valid():
                post_form.save()
                return redirect("forum")
            
    if request.method == "POST" and "comment_submit" in request.POST and pk:
        post = get_object_or_404(Post, pk=pk)
        form = CommentForm(request.POST)
        if form.is_valid():
            comment = form.save(commit = False)
            comment.post = post
            comment.user = request.user
            comment.save()
            return redirect("forum/forum.html", pk = post.pk)
    
    return render(request, "forum/forum.html", {"subredits" : subredits , 
                                                "com" : com,
                                                "post_form" : post_form,
                                                "form" : form,

                                                })

    

@login_required
def create_coments(request):
    comments = Coments.objects.all()

    if request.method == "POST":
        form = CommentForm(request.POST)
        if form.is_valid():
            comment = form.save(commit=False)
            comment.user = request.user
            comment.save()
            return redirect("forum")

        else:
            form = CommentForm()

    return render(request, "forum/forum.html", {
        "comments": comments,
    })
    

