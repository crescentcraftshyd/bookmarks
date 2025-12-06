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
        this.draggedCard = null;
        this.currentTheme = 'default';
        
        // Calculator properties
        this.displayValue = '0';
        this.firstOperand = null;
        this.waitingForOperand = false;
        this.operator = null;
        
        // Todo list properties
        this.todos = [];
        
        this.init();
    }
    
    init() {
        this.loadBookmarks();
        this.loadTheme();
        this.loadTodos();
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
    
    // Save configuration to ZIP file
    saveConfiguration() {
        const config = {
            bookmarks: this.bookmarks,
            todos: this.todos
        };
        
        // Create a simple text format for the config
        const configText = JSON.stringify(config, null, 2);
        
        // For a real implementation, you would use a library like JSZip
        // But for this demo, we'll save as a text file with .zip extension
        const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(configText);
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "crescentcrafts-config.zip");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        
        this.showNotification("Configuration saved as ZIP successfully!", "success");
    }
    
    // Load configuration from ZIP file
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
                
                if (config.todos) {
                    this.todos = config.todos;
                }
                
                this.currentPage = 1;
                this.saveBookmarks();
                this.saveTodos();
                this.render();
                this.renderTodos();
                
                this.showNotification("Configuration loaded from ZIP successfully!", "success");
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
        
        // Add tooltip with URL
        card.title = bookmark.url;
        
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
            <div class="card-content">
                <h3 class="card-title">${this.escapeHtml(bookmark.title.toUpperCase())}</h3>
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
    
    // Todo List methods
    addTodo(title, notes = '', documents = []) {
        const newTodo = {
            id: Date.now(),
            title: title,
            notes: notes,
            documents: documents,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        this.todos.unshift(newTodo);
        this.saveTodos();
        this.renderTodos();
        this.showNotification('Todo added successfully!', 'success');
    }
    
    editTodo(id, title, notes = '', documents = []) {
        const todoIndex = this.todos.findIndex(todo => todo.id === id);
        if (todoIndex !== -1) {
            this.todos[todoIndex].title = title;
            this.todos[todoIndex].notes = notes;
            this.todos[todoIndex].documents = documents;
            this.saveTodos();
            this.renderTodos();
            this.showNotification('Todo updated successfully!', 'success');
        }
    }
    
    deleteTodo(id) {
        this.todos = this.todos.filter(todo => todo.id !== id);
        this.saveTodos();
        this.renderTodos();
        this.showNotification('Todo deleted successfully!', 'success');
    }
    
    toggleTodoCompletion(id) {
        const todo = this.todos.find(todo => todo.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveTodos();
            this.renderTodos();
        }
    }
    
    renderTodos() {
        const container = document.getElementById('todoList');
        
        if (this.todos.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-tasks fa-3x"></i>
                    <h3>No todos yet</h3>
                    <p>Click "Add Todo" to create your first task</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = '';
        
        this.todos.forEach(todo => {
            const todoElement = this.createTodoElement(todo);
            container.appendChild(todoElement);
        });
    }
    
    createTodoElement(todo) {
        const todoElement = document.createElement('div');
        todoElement.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        todoElement.dataset.id = todo.id;
        
        let documentsHtml = '';
        if (todo.documents && todo.documents.length > 0) {
            documentsHtml = `
                <div class="todo-documents">
                    <h4>Documents:</h4>
                    ${todo.documents.map(doc => `
                        <div class="document-item" data-doc-id="${doc.id}">
                            <i class="fas fa-file"></i>
                            <div class="document-name">${this.escapeHtml(doc.name)}</div>
                            <div class="document-actions">
                                <button class="todo-btn preview-toggle" data-doc-id="${doc.id}">
                                    <i class="fas fa-eye"></i> Preview
                                </button>
                                <button class="todo-btn delete-doc-btn" data-doc-id="${doc.id}">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                        <div class="document-preview" id="preview-${doc.id}" style="display: none;">
                            <iframe class="document-preview-content" src="${doc.url}" frameborder="0"></iframe>
                            <button class="preview-toggle" data-doc-id="${doc.id}">
                                <i class="fas fa-compress"></i> Minimize
                            </button>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        todoElement.innerHTML = `
            <div class="todo-item-header">
                <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''}>
                <h3 class="todo-title">${this.escapeHtml(todo.title)}</h3>
                <div class="todo-actions">
                    <button class="todo-btn edit-todo-btn">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="todo-btn delete-todo-btn">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="todo-content">
                ${todo.notes ? `<div class="todo-notes">${this.escapeHtml(todo.notes)}</div>` : ''}
                ${documentsHtml}
                <button class="add-document-btn">
                    <i class="fas fa-paperclip"></i> Add Document
                </button>
                <input type="file" class="document-upload" style="display: none;" multiple>
            </div>
        `;
        
        return todoElement;
    }
    
    // Todo modal methods
    openAddTodoModal() {
        // For simplicity, we'll just add a basic todo
        const title = prompt('Enter todo title:');
        if (title) {
            this.addTodo(title);
        }
    }
    
    openEditTodoModal(todoId) {
        const todo = this.todos.find(t => t.id === todoId);
        if (todo) {
            const newTitle = prompt('Edit todo title:', todo.title);
            if (newTitle !== null) {
                this.editTodo(todoId, newTitle, todo.notes, todo.documents);
            }
        }
    }
    
    // Document handling methods
    handleDocumentUpload(todoId, files) {
        const todo = this.todos.find(t => t.id === todoId);
        if (!todo) return;
        
        // For this implementation, we'll create object URLs for preview
        // In a real app, you'd want to handle actual file storage
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileUrl = URL.createObjectURL(file);
            
            const document = {
                id: Date.now() + i, // Simple ID generation
                name: file.name,
                url: fileUrl,
                type: file.type
            };
            
            if (!todo.documents) {
                todo.documents = [];
            }
            todo.documents.push(document);
        }
        
        this.saveTodos();
        this.renderTodos();
        this.showNotification(`${files.length} document(s) added successfully!`, 'success');
    }
    
    toggleDocumentPreview(docId) {
        const preview = document.getElementById(`preview-${docId}`);
        if (preview) {
            if (preview.style.display === 'none') {
                preview.style.display = 'block';
                preview.classList.remove('minimized');
            } else {
                preview.style.display = 'none';
            }
        }
    }
    
    deleteDocument(todoId, docId) {
        const todo = this.todos.find(t => t.id === todoId);
        if (todo && todo.documents) {
            todo.documents = todo.documents.filter(doc => doc.id != docId);
            this.saveTodos();
            this.renderTodos();
            this.showNotification('Document deleted successfully!', 'success');
        }
    }
    
    // Calculator methods
    inputDigit(digit) {
        if (this.waitingForOperand) {
            this.displayValue = digit;
            this.waitingForOperand = false;
        } else {
            this.displayValue = this.displayValue === '0' ? digit : this.displayValue + digit;
        }
        this.updateDisplay();
    }
    
    inputDecimal() {
        if (this.waitingForOperand) {
            this.displayValue = '0.';
            this.waitingForOperand = false;
            this.updateDisplay();
            return;
        }
        
        if (this.displayValue.indexOf('.') === -1) {
            this.displayValue += '.';
            this.updateDisplay();
        }
    }
    
    handleOperator(nextOperator) {
        const inputValue = parseFloat(this.displayValue);
        
        if (this.firstOperand === null) {
            this.firstOperand = inputValue;
        } else if (this.operator) {
            const currentValue = this.firstOperand || 0;
            const newValue = this.performCalculation(this.operator, currentValue, inputValue);
            
            this.firstOperand = newValue;
            this.displayValue = String(newValue);
        }
        
        this.waitingForOperand = true;
        this.operator = nextOperator;
        this.updateDisplay();
    }
    
    performCalculation(operator, firstOperand, secondOperand) {
        switch (operator) {
            case '+':
                return firstOperand + secondOperand;
            case '-':
                return firstOperand - secondOperand;
            case '*':
                return firstOperand * secondOperand;
            case '/':
                return firstOperand / secondOperand;
            default:
                return secondOperand;
        }
    }
    
    calculate() {
        const inputValue = parseFloat(this.displayValue);
        
        if (this.firstOperand !== null && this.operator) {
            const newValue = this.performCalculation(this.operator, this.firstOperand, inputValue);
            this.displayValue = String(newValue);
            this.firstOperand = null;
            this.operator = null;
            this.waitingForOperand = true;
            this.updateDisplay();
        }
    }
    
    resetCalculator() {
        this.displayValue = '0';
        this.firstOperand = null;
        this.waitingForOperand = false;
        this.operator = null;
        this.updateDisplay();
    }
    
    clearEntry() {
        this.displayValue = '0';
        this.updateDisplay();
    }
    
    backspace() {
        if (this.displayValue.length > 1) {
            this.displayValue = this.displayValue.slice(0, -1);
        } else {
            this.displayValue = '0';
        }
        this.updateDisplay();
    }
    
    updateDisplay() {
        const display = document.querySelector('.main-display');
        if (display) {
            display.textContent = this.displayValue;
        }
    }
    
    // Unit conversion methods
    convertUnits() {
        const inputValue = parseFloat(document.querySelector('.conversion-input').value);
        if (isNaN(inputValue)) {
            this.showNotification('Please enter a valid number', 'error');
            return;
        }
        
        const fromUnit = document.querySelector('.conversion-from').value;
        const toUnit = document.querySelector('.conversion-to').value;
        
        // Conversion factors to meters
        const conversionFactors = {
            'cm': 0.01,
            'in': 0.0254,
            'm': 1,
            'ft': 0.3048,
            'km': 1000,
            'mi': 1609.344
        };
        
        // Convert to meters first, then to target unit
        const valueInMeters = inputValue * conversionFactors[fromUnit];
        const result = valueInMeters / conversionFactors[toUnit];
        
        document.querySelector('.conversion-output').value = result.toFixed(6);
        
        // Update conversion display
        const conversionDisplay = document.querySelector('.conversion-display');
        if (conversionDisplay) {
            const unitNames = {
                'cm': 'cm',
                'in': 'in',
                'm': 'm',
                'ft': 'ft',
                'km': 'km',
                'mi': 'mi'
            };
            conversionDisplay.textContent = `${inputValue} ${unitNames[fromUnit]} = ${result.toFixed(6)} ${unitNames[toUnit]}`;
        }
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
        
        // Re-render todos when switching to todo tab
        if (tabName === 'todo') {
            this.renderTodos();
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
    
    // Load theme from localStorage
    loadTheme() {
        const savedTheme = localStorage.getItem('bookmarkTheme');
        if (savedTheme) {
            this.currentTheme = savedTheme;
            document.getElementById('themeSelect').value = savedTheme;
            this.applyTheme(savedTheme);
        }
    }
    
    // Load todos from localStorage
    loadTodos() {
        const savedTodos = localStorage.getItem('todos');
        if (savedTodos) {
            this.todos = JSON.parse(savedTodos);
        }
    }
    
    // Save todos to localStorage
    saveTodos() {
        localStorage.setItem('todos', JSON.stringify(this.todos));
    }
    
    // Apply theme to the page
    applyTheme(theme) {
        // Remove all theme classes
        document.body.classList.remove('theme-flower', 'theme-season', 'theme-galaxy', 'theme-environment');
        
        // Add selected theme class
        if (theme !== 'default') {
            document.body.classList.add(`theme-${theme}`);
        }
        
        // Save theme preference
        this.currentTheme = theme;
        localStorage.setItem('bookmarkTheme', theme);
        
        // Re-render cards to apply theme
        this.render();
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
        
        // Theme selection
        document.getElementById('themeSelect').addEventListener('change', (e) => {
            this.applyTheme(e.target.value);
        });
        
        // Todo List functionality
        document.getElementById('addTodoBtn').addEventListener('click', () => {
            this.openAddTodoModal();
        });
        
        // Todo List event delegation
        document.getElementById('todoList').addEventListener('click', (e) => {
            const todoItem = e.target.closest('.todo-item');
            if (!todoItem) return;
            
            const todoId = parseInt(todoItem.dataset.id);
            
            // Checkbox toggle
            if (e.target.classList.contains('todo-checkbox')) {
                this.toggleTodoCompletion(todoId);
            }
            
            // Edit button
            if (e.target.closest('.edit-todo-btn')) {
                this.openEditTodoModal(todoId);
            }
            
            // Delete button
            if (e.target.closest('.delete-todo-btn')) {
                this.deleteTodo(todoId);
            }
            
            // Add document button
            if (e.target.closest('.add-document-btn')) {
                const fileInput = todoItem.querySelector('.document-upload');
                if (fileInput) {
                    fileInput.click();
                }
            }
            
            // Document upload
            if (e.target.classList.contains('document-upload')) {
                const files = e.target.files;
                if (files.length > 0) {
                    this.handleDocumentUpload(todoId, files);
                }
            }
            
            // Preview toggle
            if (e.target.closest('.preview-toggle')) {
                const docId = e.target.closest('.preview-toggle').dataset.docId;
                this.toggleDocumentPreview(docId);
            }
            
            // Delete document
            if (e.target.closest('.delete-doc-btn')) {
                const docId = e.target.closest('.delete-doc-btn').dataset.docId;
                this.deleteDocument(todoId, docId);
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
        
        // Calculator functionality
        const calculatorButtons = document.querySelector('.calculator-buttons');
        if (calculatorButtons) {
            calculatorButtons.addEventListener('click', (e) => {
                if (!e.target.classList.contains('calc-btn')) return;
                
                const value = e.target.dataset.value;
                
                if (!isNaN(value) || value === '.') {
                    if (value === '.') {
                        this.inputDecimal();
                    } else {
                        this.inputDigit(value);
                    }
                } else if (['+', '-', '*', '/'].includes(value)) {
                    this.handleOperator(value);
                } else if (value === '=') {
                    this.calculate();
                } else if (value === 'C') {
                    this.resetCalculator();
                } else if (value === 'CE') {
                    this.clearEntry();
                } else if (value === 'backspace') {
                    this.backspace();
                }
            });
        }
        
        // Unit conversion
        const convertBtn = document.querySelector('.convert-btn');
        if (convertBtn) {
            convertBtn.addEventListener('click', () => {
                this.convertUnits();
            });
        }
        
        // Keyboard support for calculator
        document.addEventListener('keydown', (e) => {
            // Only handle calculator keys when calculator tab is active
            if (!document.getElementById('calculatorTab').classList.contains('active')) return;
            
            const key = e.key;
            
            if (/[0-9]/.test(key)) {
                this.inputDigit(key);
            } else if (key === '.') {
                this.inputDecimal();
            } else if (['+', '-', '*', '/'].includes(key)) {
                this.handleOperator(key);
            } else if (key === '=' || key === 'Enter') {
                this.calculate();
            } else if (key === 'Escape') {
                this.resetCalculator();
            } else if (key === 'Backspace') {
                this.backspace();
            } else if (key === 'Delete') {
                this.clearEntry();
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