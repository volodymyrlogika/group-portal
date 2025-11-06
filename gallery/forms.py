from django import forms
from .models import GalleryItem

class MediaUploadForm(forms.ModelForm):
    class Meta:
        model = GalleryItem
        fields = ['title', 'description', 'media_type', 'file']
