from django import forms
from .models import Subredit, Coments, Answers

class Post(forms.ModelForm):
    class Meta:
        model = Subredit
        fields = ["name", "description", "image"]
        
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        for field in self.fields:
                self.fields[field].widget.attrs.update({'class': 'form-control mb-2', })


class CommentForm(forms.ModelForm):
    class Meta:
        model = Coments
        fields = ["name", "description"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        for field in self.fields:
                self.fields[field].widget.attrs.update({'class': 'form-control mb-2', })


class Answertocom(forms.ModelForm):
    class Meta:
        model = Answers
        fields = ["description"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        for field in self.fields:
                self.fields[field].widget.attrs.update({'class': 'form-control mb-2', })