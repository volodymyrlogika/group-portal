from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from .models import MediaItem
from .forms import MediaUploadForm

def gallery_list(request):
    items = MediaItem.objects.filter(approved=True).order_by('-created_at')
    return render(request, 'gallery/gallery_list.html', context={'items': items})

def gallery_detail(request, pk):
    item = get_object_or_404(MediaItem, pk=pk)
    return render(request, 'gallery/gallery_detail.html', context={'item': item})

@login_required
def gallery_upload(request):
    if request.method == 'POST':
        form = MediaUploadForm(request.POST, request.FILES)
        if form.is_valid():
            new_item = form.save(commit=False)
            new_item.uploaded_by = request.user
            new_item.save()
            return redirect('gallery_list')
    else:
        form = MediaUploadForm()
    return render(request, 'gallery/gallery_upload.html', context={'form': form})