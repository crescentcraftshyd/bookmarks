// Bookmark Manager Application
class BookmarkManager {
    constructor() {
        this.bookmarks = [
            { url: "https://refactoring.guru/design-patterns/prototype", title: "Prototype Design Pattern" },
            { url: "https://imresizer.com/", title: "Image Resizer" },
            { url: "https://sellercentral.amazon.in/home", title: "Amazon Seller Central" },
            { url: "https://picsart.com/", title: "Picsart" }
        ];
        this.currentPage = 1;
        this.itemsPerPage = 8;
        this.editIndex = -1;
        
        this.init();
    }
    
    init() {
        this.loadBookmarks();
        this.render();
        this.attachEventListeners();
    }
    
    // Load bookmarks from localStorage if available
    loadBookmarks() {
        const savedBookmarks = localStorage.getItem('bookmarks');
        if (savedBookmarks) {
            this.bookmarks = JSON.parse(savedBookmarks);
        }
    }
    
    // Save bookmarks to localStorage
    saveBookmarks() {
        localStorage.setItem('bookmarks', JSON.stringify(this.bookmarks));
    }
    
    // Add a new bookmark
    addBookmark(url, title) {
        // If title is empty, extract domain name from URL
        if (!title) {
            try {
                const domain = new URL(url).hostname.replace('www.', '');
                title = domain.charAt(0).toUpperCase() + domain.slice(1);
            } catch (e) {
                title = "Untitled";
            }
        }
        
        this.bookmarks.push({ url, title });
        this.saveBookmarks();
        this.render();
        
        // Show success animation
        this.showNotification("Bookmark added successfully!", "success");
    }
    
    // Edit an existing bookmark
    editBookmark(index, url, title) {
        if (index >= 0 && index < this.bookmarks.length) {
            // If title is empty, extract domain name from URL
            if (!title) {
                try {
                    const domain = new URL(url).hostname.replace('www.', '');
                    title = domain.charAt(0).toUpperCase() + domain.slice(1);
                } catch (e) {
                    title = "Untitled";
                }
            }
            
            this.bookmarks[index] = { url, title };
            this.saveBookmarks();
            this.render();
            
            // Show success animation
            this.showNotification("Bookmark updated successfully!", "success");
        }
    }
    
    // Delete a bookmark
    deleteBookmark(index) {
        if (index >= 0 && index < this.bookmarks.length) {
            this.bookmarks.splice(index, 1);
            this.saveBookmarks();
            
            // Adjust current page if needed
            const totalPages = Math.ceil(this.bookmarks.length / this.itemsPerPage);
            if (this.currentPage > totalPages && totalPages > 0) {
                this.currentPage = totalPages;
            }
            
            this.render();
            this.showNotification("Bookmark deleted successfully!", "success");
        }
    }
    
    // Get bookmarks for current page
    getCurrentPageBookmarks() {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        return this.bookmarks.slice(startIndex, endIndex);
    }
    
    // Render bookmarks and pagination
    render() {
        this.renderBookmarks();
        this.renderPagination();
    }
    
    // Render bookmark cards
    renderBookmarks() {
        const container = document.getElementById('cardsContainer');
        const currentPageBookmarks = this.getCurrentPageBookmarks();
        
        if (currentPageBookmarks.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-bookmark fa-3x"></i>
                    <h3>No bookmarks yet</h3>
                    <p>Click "Add New Bookmark" to get started</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = '';
        
        currentPageBookmarks.forEach((bookmark, index) => {
            const globalIndex = (this.currentPage - 1) * this.itemsPerPage + index;
            const card = this.createCardElement(bookmark, globalIndex);
            container.appendChild(card);
        });
    }
    
    // Create a card element
    createCardElement(bookmark, index) {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.index = index;
        
        // Add ripple effect
        card.addEventListener('click', (e) => {
            if (e.target.closest('.card-btn')) return;
            this.createRipple(e, card);
        });
        
        // Extract domain for favicon
        let domain = '';
        try {
            domain = new URL(bookmark.url).hostname.replace('www.', '');
        } catch (e) {
            domain = 'link';
        }
        
        card.innerHTML = `
            <div class="card-preview">
                <i class="fas fa-${this.getIconForDomain(domain)}"></i>
            </div>
            <div class="card-content">
                <h3 class="card-title">${this.escapeHtml(bookmark.title)}</h3>
                <p class="card-url">${this.escapeHtml(bookmark.url)}</p>
                <div class="card-actions">
                    <button class="card-btn edit-btn" data-action="edit">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="card-btn delete-btn" data-action="delete">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
        
        return card;
    }
    
    // Get appropriate icon for domain
    getIconForDomain(domain) {
        const domainIcons = {
            'amazon': 'amazon',
            'google': 'google',
            'github': 'github',
            'youtube': 'youtube',
            'facebook': 'facebook',
            'twitter': 'twitter',
            'instagram': 'instagram',
            'linkedin': 'linkedin',
            'pinterest': 'pinterest',
            'reddit': 'reddit',
            'stackoverflow': 'stack-overflow',
            'wikipedia': 'wikipedia-w',
            'paypal': 'paypal',
            'spotify': 'spotify',
            'netflix': 'netflix',
            'dropbox': 'dropbox',
            'slack': 'slack',
            'trello': 'trello',
            'whatsapp': 'whatsapp',
            'telegram': 'telegram'
        };
        
        for (const [key, icon] of Object.entries(domainIcons)) {
            if (domain.includes(key)) {
                return icon;
            }
        }
        
        return 'globe';
    }
    
    // Escape HTML to prevent XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Render pagination controls
    renderPagination() {
        const totalPages = Math.ceil(this.bookmarks.length / this.itemsPerPage);
        const pageInfo = document.getElementById('pageInfo');
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');
        
        if (totalPages <= 1) {
            pageInfo.textContent = `Page 1 of 1`;
            prevBtn.disabled = true;
            nextBtn.disabled = true;
            return;
        }
        
        pageInfo.textContent = `Page ${this.currentPage} of ${totalPages}`;
        prevBtn.disabled = this.currentPage === 1;
        nextBtn.disabled = this.currentPage === totalPages;
    }
    
    // Navigate to next page
    nextPage() {
        const totalPages = Math.ceil(this.bookmarks.length / this.itemsPerPage);
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.render();
        }
    }
    
    // Navigate to previous page
    prevPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.render();
        }
    }
    
    // Change items per page
    changeItemsPerPage(value) {
        this.itemsPerPage = parseInt(value);
        this.currentPage = 1; // Reset to first page
        this.render();
    }
    
    // Open add bookmark modal
    openAddModal() {
        this.editIndex = -1;
        document.getElementById('modalTitle').textContent = 'Add New Bookmark';
        document.getElementById('url').value = '';
        document.getElementById('title').value = '';
        document.getElementById('editIndex').value = '';
        document.getElementById('modal').style.display = 'block';
    }
    
    // Open edit bookmark modal
    openEditModal(index) {
        this.editIndex = index;
        const bookmark = this.bookmarks[index];
        document.getElementById('modalTitle').textContent = 'Edit Bookmark';
        document.getElementById('url').value = bookmark.url;
        document.getElementById('title').value = bookmark.title;
        document.getElementById('editIndex').value = index;
        document.getElementById('modal').style.display = 'block';
    }
    
    // Close modal
    closeModal() {
        document.getElementById('modal').style.display = 'none';
        document.getElementById('deleteModal').style.display = 'none';
    }
    
    // Submit form
    submitForm(e) {
        e.preventDefault();
        const url = document.getElementById('url').value.trim();
        const title = document.getElementById('title').value.trim();
        
        if (!url) return;
        
        if (this.editIndex === -1) {
            this.addBookmark(url, title);
        } else {
            this.editBookmark(this.editIndex, url, title);
        }
        
        this.closeModal();
    }
    
    // Open delete confirmation modal
    openDeleteModal(index) {
        this.deleteIndex = index;
        document.getElementById('deleteModal').style.display = 'block';
    }
    
    // Confirm delete
    confirmDelete() {
        if (this.deleteIndex !== undefined && this.deleteIndex >= 0) {
            this.deleteBookmark(this.deleteIndex);
            this.closeModal();
        }
    }
    
    // Create ripple effect
    createRipple(event, element) {
        const circle = document.createElement("span");
        circle.classList.add("ripple");
        
        const diameter = Math.max(element.clientWidth, element.clientHeight);
        const radius = diameter / 2;
        
        const rect = element.getBoundingClientRect();
        const x = event.clientX - rect.left - radius;
        const y = event.clientY - rect.top - radius;
        
        circle.style.width = circle.style.height = `${diameter}px`;
        circle.style.left = `${x}px`;
        circle.style.top = `${y}px`;
        
        element.appendChild(circle);
        
        // Remove ripple after animation completes
        setTimeout(() => {
            circle.remove();
        }, 600);
    }
    
    // Show notification
    showNotification(message, type) {
        // Remove existing notifications
        const existing = document.querySelector('.notification');
        if (existing) existing.remove();
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateY(0)';
            notification.style.opacity = '1';
        }, 10);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateY(-100px)';
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    // Attach event listeners
    attachEventListeners() {
        // Add button
        document.getElementById('addBtn').addEventListener('click', () => {
            this.openAddModal();
        });
        
        // Form submission
        document.getElementById('bookmarkForm').addEventListener('submit', (e) => {
            this.submitForm(e);
        });
        
        // Cancel buttons
        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.closeModal();
        });
        
        document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
            this.closeModal();
        });
        
        // Close modal when clicking on X or outside modal
        document.querySelectorAll('.close, .modal').forEach(el => {
            el.addEventListener('click', (e) => {
                if (e.target === el || e.target.classList.contains('close')) {
                    this.closeModal();
                }
            });
        });
        
        // Prevent closing when clicking inside modal content
        document.querySelectorAll('.modal-content').forEach(el => {
            el.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        });
        
        // Pagination
        document.getElementById('prevPage').addEventListener('click', () => {
            this.prevPage();
        });
        
        document.getElementById('nextPage').addEventListener('click', () => {
            this.nextPage();
        });
        
        document.getElementById('itemsPerPage').addEventListener('change', (e) => {
            this.changeItemsPerPage(e.target.value);
        });
        
        // Confirm delete
        document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
            this.confirmDelete();
        });
        
        // Handle card actions using event delegation
        document.getElementById('cardsContainer').addEventListener('click', (e) => {
            const card = e.target.closest('.card');
            if (!card) return;
            
            const index = parseInt(card.dataset.index);
            const actionButton = e.target.closest('.card-btn');
            
            if (actionButton) {
                const action = actionButton.dataset.action;
                if (action === 'edit') {
                    this.openEditModal(index);
                } else if (action === 'delete') {
                    this.openDeleteModal(index);
                }
                return;
            }
            
            // Open link in new tab when clicking on card (but not on buttons)
            if (index >= 0 && index < this.bookmarks.length) {
                window.open(this.bookmarks[index].url, '_blank');
            }
        });
        
        // Close modals with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.bookmarkManager = new BookmarkManager();
});

// Add notification styles dynamically
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        transform: translateY(-100px);
        opacity: 0;
        transition: all 0.3s ease;
    }
    
    .notification-success {
        background: linear-gradient(135deg, #4CAF50, #45a049);
    }
    
    .notification-error {
        background: linear-gradient(135deg, #f44336, #da190b);
    }
    
    .empty-state {
        grid-column: 1 / -1;
        text-align: center;
        padding: 40px 20px;
        background: rgba(255, 255, 255, 0.8);
        border-radius: 15px;
        color: #666;
    }
    
    .empty-state i {
        margin-bottom: 15px;
        color: #667eea;
    }
    
    .empty-state h3 {
        margin-bottom: 10px;
        color: #333;
    }
`;

document.head.appendChild(notificationStyles);