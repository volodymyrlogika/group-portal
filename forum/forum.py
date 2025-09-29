from django import forms
from .models import Subredit, Coments

class Post(forms.ModelForm):
    class Meta:
        model = Subredit
        fields = ["name", "description", "image", "author"]
        




class CommentForm(forms.ModelForm):
    class Meta:
        model = Coments
        fields = ["username", "comsubredit", "name", "description"]