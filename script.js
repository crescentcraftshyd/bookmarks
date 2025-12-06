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
        this.browserPanels = [];
        this.panelCounter = 0;
        this.draggedCard = null;
        
        this.init();
    }
    
    init() {
        this.loadBookmarks();
        this.render();
        this.attachEventListeners();
        this.initBrowserPanels();
    }
    
    // Load bookmarks from localStorage if available
    loadBookmarks() {
        const savedBookmarks = localStorage.getItem('bookmarks');
        if (savedBookmarks) {
            this.bookmarks = JSON.parse(savedBookmarks);
        }
    }
    
    // Save configuration to file
    saveConfiguration() {
        const config = {
            bookmarks: this.bookmarks,
            browserPanels: this.browserPanels
        };
        
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(config, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "bookmark-config.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        
        this.showNotification("Configuration saved successfully!", "success");
    }
    
    // Load configuration from file
    loadConfiguration(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const config = JSON.parse(e.target.result);
                
                if (config.bookmarks) {
                    this.bookmarks = config.bookmarks;
                }
                
                if (config.browserPanels) {
                    this.browserPanels = config.browserPanels;
                    this.panelCounter = config.browserPanels.length;
                }
                
                this.currentPage = 1;
                this.saveBookmarks();
                this.render();
                this.renderBrowserPanels();
                
                this.showNotification("Configuration loaded successfully!", "success");
            } catch (error) {
                console.error("Error loading configuration:", error);
                this.showNotification("Error loading configuration file", "error");
            }
        };
        reader.readAsText(file);
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
        card.draggable = true;
        
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
        
        // Add drag and drop events
        card.addEventListener('dragstart', (e) => this.handleDragStart(e, card, index));
        card.addEventListener('dragend', (e) => this.handleDragEnd(e, card));
        card.addEventListener('dragover', (e) => this.handleDragOver(e));
        card.addEventListener('dragenter', (e) => this.handleDragEnter(e, card));
        card.addEventListener('dragleave', (e) => this.handleDragLeave(e, card));
        card.addEventListener('drop', (e) => this.handleDrop(e, card, index));
        
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
    
    // Initialize browser panels
    initBrowserPanels() {
        // Add initial panel
        this.addBrowserPanel();
    }
    
    // Add a new browser panel
    addBrowserPanel(url = 'https://www.google.com') {
        const panelId = `panel-${this.panelCounter++}`;
        const panel = {
            id: panelId,
            url: url,
            title: 'New Tab',
            minimized: false
        };
        
        this.browserPanels.push(panel);
        this.renderBrowserPanels();
    }
    
    // Remove a browser panel
    removeBrowserPanel(panelId) {
        this.browserPanels = this.browserPanels.filter(panel => panel.id !== panelId);
        this.renderBrowserPanels();
    }
    
    // Toggle panel minimization
    togglePanelMinimize(panelId) {
        const panel = this.browserPanels.find(p => p.id === panelId);
        if (panel) {
            panel.minimized = !panel.minimized;
            this.renderBrowserPanels();
        }
    }
    
    // Update panel URL
    updatePanelUrl(panelId, url) {
        const panel = this.browserPanels.find(p => p.id === panelId);
        if (panel) {
            panel.url = url;
            try {
                const domain = new URL(url).hostname.replace('www.', '');
                panel.title = domain.charAt(0).toUpperCase() + domain.slice(1);
            } catch (e) {
                panel.title = 'New Tab';
            }
            this.renderBrowserPanels();
        }
    }
    
    // Render browser panels
    renderBrowserPanels() {
        const container = document.getElementById('browserContainer');
        container.innerHTML = '';
        
        if (this.browserPanels.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-window-maximize fa-3x"></i>
                    <h3>No browser panels</h3>
                    <p>Click "Add Panel" to create a new browsing panel</p>
                </div>
            `;
            return;
        }
        
        this.browserPanels.forEach(panel => {
            const panelElement = this.createPanelElement(panel);
            container.appendChild(panelElement);
        });
    }
    
    // Create panel element
    createPanelElement(panel) {
        const panelElement = document.createElement('div');
        panelElement.className = `browser-panel ${panel.minimized ? 'minimized' : ''}`;
        panelElement.id = panel.id;
        
        panelElement.innerHTML = `
            <div class="panel-header">
                <div class="panel-title">${this.escapeHtml(panel.title)}</div>
                <div class="panel-controls">
                    <button class="panel-btn minimize-btn" title="${panel.minimized ? 'Maximize' : 'Minimize'}">
                        <i class="fas fa-${panel.minimized ? 'expand' : 'compress'}"></i>
                    </button>
                    <button class="panel-btn close-btn" title="Close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <div class="panel-content">
                <div class="panel-address-bar">
                    <input type="text" class="panel-url" value="${this.escapeHtml(panel.url)}" placeholder="Enter website URL">
                </div>
                <div class="panel-iframe-container">
                    <div class="iframe-placeholder">
                        <p><i class="fas fa-info-circle"></i> Preview may be blocked by site security settings.</p>
                        <p>Click <strong>Open in New Tab</strong> button to view the site.</p>
                        <button class="btn-primary open-tab-btn" data-url="${this.escapeHtml(panel.url)}">
                            <i class="fas fa-external-link-alt"></i> Open in New Tab
                        </button>
                    </div>
                    <iframe src="${this.escapeHtml(panel.url)}" class="panel-iframe" sandbox="allow-same-origin allow-scripts allow-popups allow-forms"></iframe>
                </div>
                <div class="panel-resizer"></div>
            </div>
        `;
        
        // Add event listener for open in new tab button
        const openTabBtn = panelElement.querySelector('.open-tab-btn');
        if (openTabBtn) {
            openTabBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const url = e.target.dataset.url || e.target.closest('.open-tab-btn').dataset.url;
                if (url) {
                    window.open(url, '_blank');
                }
            });
        }
        
        return panelElement;
    }
    
    // Reset browser panels
    resetBrowserPanels() {
        this.browserPanels = [];
        this.panelCounter = 0;
        this.addBrowserPanel();
    }
    
    // Switch tabs
    switchTab(tabName) {
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Remove active class from all tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show selected tab content
        document.getElementById(`${tabName}Tab`).classList.add('active');
        
        // Set active class on clicked tab button
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Re-render browser panels when switching to browser tab
        if (tabName === 'browser') {
            this.renderBrowserPanels();
        }
    }
    
    // Handle drag start
    handleDragStart(e, card, index) {
        this.draggedCard = card;
        card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', card.outerHTML);
    }
    
    // Handle drag end
    handleDragEnd(e, card) {
        card.classList.remove('dragging');
        document.querySelectorAll('.card').forEach(c => {
            c.classList.remove('drop-zone');
        });
        this.draggedCard = null;
    }
    
    // Handle drag over
    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        return false;
    }
    
    // Handle drag enter
    handleDragEnter(e, card) {
        if (card !== this.draggedCard) {
            card.classList.add('drop-zone');
        }
    }
    
    // Handle drag leave
    handleDragLeave(e, card) {
        card.classList.remove('drop-zone');
    }
    
    // Handle drop
    handleDrop(e, card, targetIndex) {
        e.stopPropagation();
        
        if (this.draggedCard !== card) {
            const sourceIndex = parseInt(this.draggedCard.dataset.index);
            
            // Reorder bookmarks array
            const movedBookmark = this.bookmarks.splice(sourceIndex, 1)[0];
            this.bookmarks.splice(targetIndex, 0, movedBookmark);
            
            // Save and re-render
            this.saveBookmarks();
            this.render();
            
            this.showNotification("Bookmark reordered successfully!", "success");
        }
        
        card.classList.remove('drop-zone');
        return false;
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
        
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });
        
        // Browser panel controls (using event delegation)
        document.getElementById('browserContainer').addEventListener('click', (e) => {
            const panel = e.target.closest('.browser-panel');
            if (!panel) return;
            
            const panelId = panel.id;
            
            // Minimize button
            if (e.target.closest('.minimize-btn')) {
                this.togglePanelMinimize(panelId);
                return;
            }
            
            // Close button
            if (e.target.closest('.close-btn')) {
                this.removeBrowserPanel(panelId);
                return;
            }
        });
        
        // URL input handling
        document.getElementById('browserContainer').addEventListener('keypress', (e) => {
            if (e.target.classList.contains('panel-url') && e.key === 'Enter') {
                const panel = e.target.closest('.browser-panel');
                if (panel) {
                    const panelId = panel.id;
                    let url = e.target.value.trim();
                    
                    // Add protocol if missing
                    if (!url.startsWith('http://') && !url.startsWith('https://')) {
                        url = 'https://' + url;
                    }
                    
                    this.updatePanelUrl(panelId, url);
                    
                    // Update iframe source
                    const iframe = panel.querySelector('.panel-iframe');
                    if (iframe) {
                        // For sites that block iframes, we'll show a message
                        iframe.src = url;
                        
                        // Show notification about X-Frame-Options
                        this.showNotification(
                            "Some websites block embedding for security reasons. " +
                            "If the site doesn't load, use the 'Open in New Tab' button.", 
                            "info"
                        );
                    }
                }
            }
        });
        
        // Add panel button
        document.getElementById('addPanelBtn').addEventListener('click', () => {
            this.addBrowserPanel();
        });
        
        // Reset panels button
        document.getElementById('resetPanelsBtn').addEventListener('click', () => {
            this.resetBrowserPanels();
        });
        
        // Panel resizing
        document.getElementById('browserContainer').addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('panel-resizer')) {
                const panel = e.target.closest('.browser-panel');
                if (!panel) return;
                
                const startY = e.clientY;
                const startHeight = panel.offsetHeight;
                
                const doDrag = (e) => {
                    const newHeight = startHeight + (e.clientY - startY);
                    if (newHeight > 200) { // Minimum height
                        panel.style.height = newHeight + 'px';
                    }
                };
                
                const stopDrag = () => {
                    document.removeEventListener('mousemove', doDrag);
                    document.removeEventListener('mouseup', stopDrag);
                };
                
                document.addEventListener('mousemove', doDrag);
                document.addEventListener('mouseup', stopDrag);
            }
        });
        
        // Save configuration
        document.getElementById('saveConfigBtn').addEventListener('click', () => {
            this.saveConfiguration();
        });
        
        // Load configuration
        const loadConfigInput = document.createElement('input');
        loadConfigInput.type = 'file';
        loadConfigInput.id = 'loadConfigInput';
        loadConfigInput.accept = '.json';
        loadConfigInput.style.display = 'none';
        document.body.appendChild(loadConfigInput);
        
        document.getElementById('loadConfigBtn').addEventListener('click', () => {
            loadConfigInput.click();
        });
        
        loadConfigInput.addEventListener('change', (e) => {
            this.loadConfiguration(e);
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
    
    .notification-info {
        background: linear-gradient(135deg, #2196F3, #0b7dda);
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