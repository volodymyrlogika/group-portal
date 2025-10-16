from django import forms
from .models import Subredit, Coments, Answers

class Post(forms.ModelForm):
    class Meta:
        model = Subredit
        fields = ["name", "description", "image"]
        

class CommentForm(forms.ModelForm):
    class Meta:
        model = Coments
        fields = ["name", "description"]


class Answertocom(forms.ModelForm):
    class Meta:
        model = Answers
        fields = ["description"]