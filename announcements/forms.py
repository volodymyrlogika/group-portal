from django import forms
from .models import Announcements

class AnnouncementsForm(forms.ModelForm):
    class Meta:
        model = Announcements
        fields = ['title', 'content', 'attachment', 'status']
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        for field in self.fields:
            self.fields[field].widget.attrs.update({'class': 'form-control mb-2', })