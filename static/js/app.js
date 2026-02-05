class ImageGallery {
    constructor() {
        this.images = [];
        this.filteredImages = [];
        this.tags = [];
        this.currentImageId = null;
        this.currentUserId = null;
        
        this.initializeElements();
        this.bindEvents();
        this.loadImages();
        this.loadTags();
        this.getCurrentUser();
    }
    
    initializeElements() {
        this.imageGrid = document.getElementById('imageGrid');
        this.searchInput = document.getElementById('searchInput');
        this.tagFilter = document.getElementById('tagFilter');
        this.uploadBtn = document.getElementById('uploadBtn');
        this.uploadModal = document.getElementById('uploadModal');
        this.previewModal = document.getElementById('previewModal');
        this.editModal = document.getElementById('editModal');
        this.uploadForm = document.getElementById('uploadForm');
        this.editForm = document.getElementById('editForm');
        this.editImageBtn = document.getElementById('editImageBtn');
        this.deleteImageBtn = document.getElementById('deleteImageBtn');
        this.cancelEditBtn = document.getElementById('cancelEdit');
    }
    
    bindEvents() {
        // Search and filter
        this.searchInput?.addEventListener('input', () => this.filterImages());
        this.tagFilter?.addEventListener('change', () => this.filterImages());
        
        // Upload modal
        this.uploadBtn?.addEventListener('click', () => this.showUploadModal());
        this.uploadForm?.addEventListener('submit', (e) => this.handleUpload(e));
        
        // Edit and delete
        this.editImageBtn?.addEventListener('click', () => this.showEditModal());
        this.deleteImageBtn?.addEventListener('click', () => this.handleDelete());
        this.editForm?.addEventListener('submit', (e) => this.handleEdit(e));
        this.cancelEditBtn?.addEventListener('click', () => this.editModal.style.display = 'none');
        
        // Modal close buttons
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                e.target.closest('.modal').style.display = 'none';
            });
        });
        
        // Close modals on outside click
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
    }
    
    async loadImages() {
        try {
            const response = await fetch('/api/images');
            this.images = await response.json();
            this.filteredImages = [...this.images];
            this.renderImages();
        } catch (error) {
            console.error('Error loading images:', error);
            this.showError('Failed to load images');
        }
    }
    
    async loadTags() {
        try {
            const response = await fetch('/api/tags');
            this.tags = await response.json();
            this.renderTagFilter();
        } catch (error) {
            console.error('Error loading tags:', error);
        }
    }
    
    renderTagFilter() {
        if (!this.tagFilter) return;
        
        // Clear existing options except "All Tags"
        this.tagFilter.innerHTML = '<option value="">All Tags</option>';
        
        this.tags.forEach(tag => {
            const option = document.createElement('option');
            option.value = tag;
            option.textContent = tag;
            this.tagFilter.appendChild(option);
        });
    }
    
    filterImages() {
        const searchTerm = this.searchInput?.value.toLowerCase().trim() || '';
        const selectedTag = this.tagFilter?.value.trim() || '';
        
        this.filteredImages = this.images.filter(image => {
            const matchesSearch = !searchTerm || 
                image.title.toLowerCase().includes(searchTerm) ||
                (image.description && image.description.toLowerCase().includes(searchTerm));
            
            const matchesTag = !selectedTag || 
                image.tags.some(tag => tag.toLowerCase().trim() === selectedTag.toLowerCase());
            
            return matchesSearch && matchesTag;
        });
        
        this.renderImages();
    }
    
    renderImages() {
        if (!this.imageGrid) return;
        
        if (this.filteredImages.length === 0) {
            this.imageGrid.innerHTML = '<div class="loading">No images found</div>';
            return;
        }
        
        this.imageGrid.innerHTML = this.filteredImages.map(image => {
            const isOwner = this.currentUserId && image.uploaded_by === this.currentUserId;
            return `
                <div class="image-item" onclick="gallery.showPreview(${image.id})" style="position: relative;">
                    <img src="/static/uploads/${image.filename}" alt="${image.title}" loading="lazy">
                    ${isOwner ? `
                        <div class="image-actions">
                            <button class="action-btn edit" onclick="event.stopPropagation(); gallery.quickEdit(${image.id})" title="Edit">✏️</button>
                            <button class="action-btn delete" onclick="event.stopPropagation(); gallery.quickDelete(${image.id})" title="Delete">🗑️</button>
                        </div>
                    ` : ''}
                    <div class="image-info">
                        <div class="image-title">${this.escapeHtml(image.title)}</div>
                        <div class="image-description">${this.escapeHtml(image.description || '')}</div>
                        <div class="tag-list">
                            ${image.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    showPreview(imageId) {
        const image = this.images.find(img => img.id === imageId);
        if (!image || !this.previewModal) return;
        
        this.currentImageId = imageId;
        
        document.getElementById('previewImage').src = `/static/uploads/${image.filename}`;
        document.getElementById('previewTitle').textContent = image.title;
        document.getElementById('previewDescription').textContent = image.description || 'No description';
        document.getElementById('previewTags').innerHTML = 
            image.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('');
        document.getElementById('previewDate').textContent = 
            `Uploaded: ${new Date(image.created_at).toLocaleDateString()}`;
        
        // Show/hide action buttons based on ownership
        const actionsDiv = document.getElementById('previewActions');
        if (actionsDiv) {
            const isOwner = this.currentUserId && image.uploaded_by === this.currentUserId;
            actionsDiv.style.display = isOwner ? 'flex' : 'none';
        }
        
        this.previewModal.style.display = 'block';
    }
    
    showUploadModal() {
        if (this.uploadModal) {
            this.uploadModal.style.display = 'block';
        }
    }
    
    async handleUpload(e) {
        e.preventDefault();
        
        const formData = new FormData(this.uploadForm);
        
        try {
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (response.ok) {
                this.showSuccess('Image uploaded successfully!');
                this.uploadModal.style.display = 'none';
                this.uploadForm.reset();
                this.loadImages();
                this.loadTags();
            } else {
                this.showError(result.error || 'Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            this.showError('Upload failed');
        }
    }
    
    showSuccess(message) {
        this.showMessage(message, 'success');
    }
    
    showError(message) {
        this.showMessage(message, 'error');
    }
    
    showMessage(message, type) {
        // Create a temporary message element
        const messageEl = document.createElement('div');
        messageEl.className = `flash-message ${type}`;
        messageEl.textContent = message;
        
        const container = document.querySelector('.main-content');
        if (container) {
            container.insertBefore(messageEl, container.firstChild);
            
            // Remove after 3 seconds
            setTimeout(() => {
                messageEl.remove();
            }, 3000);
        }
    }
    
    async getCurrentUser() {
        try {
            const response = await fetch('/api/user');
            const user = await response.json();
            this.currentUserId = user.id;
        } catch (error) {
            console.error('Error getting current user:', error);
        }
    }
    
    quickEdit(imageId) {
        this.currentImageId = imageId;
        this.showEditModal();
    }
    
    async quickDelete(imageId) {
        if (confirm('Are you sure you want to delete this image?')) {
            await this.deleteImage(imageId);
        }
    }
    
    showEditModal() {
        const image = this.images.find(img => img.id === this.currentImageId);
        if (!image || !this.editModal) return;
        
        document.getElementById('editTitle').value = image.title;
        document.getElementById('editDescription').value = image.description || '';
        document.getElementById('editTags').value = image.tags.join(', ');
        
        this.editModal.style.display = 'block';
    }
    
    async handleEdit(e) {
        e.preventDefault();
        
        const formData = new FormData(this.editForm);
        const data = {
            title: formData.get('title'),
            description: formData.get('description'),
            tags: formData.get('tags')
        };
        
        try {
            const response = await fetch(`/api/images/${this.currentImageId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                this.showSuccess('Image updated successfully!');
                this.editModal.style.display = 'none';
                this.previewModal.style.display = 'none';
                this.loadImages();
                this.loadTags();
            } else {
                this.showError(result.error || 'Update failed');
            }
        } catch (error) {
            console.error('Edit error:', error);
            this.showError('Update failed');
        }
    }
    
    async handleDelete() {
        if (!confirm('Are you sure you want to delete this image? This action cannot be undone.')) {
            return;
        }
        
        await this.deleteImage(this.currentImageId);
        this.previewModal.style.display = 'none';
    }
    
    async deleteImage(imageId) {
        try {
            const response = await fetch(`/api/images/${imageId}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            
            if (response.ok) {
                this.showSuccess('Image deleted successfully!');
                this.loadImages();
                this.loadTags();
            } else {
                this.showError(result.error || 'Delete failed');
            }
        } catch (error) {
            console.error('Delete error:', error);
            this.showError('Delete failed');
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the gallery when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('imageGrid')) {
        window.gallery = new ImageGallery();
    }
});