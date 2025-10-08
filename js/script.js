// Smart Todo App with History Feature
class SmartTodoApp {
    constructor() {
        this.todos = [];
        this.completedHistory = [];
        this.productivityStats = {};
        
        this.initializeElements();
        this.attachEventListeners();
        this.loadFromLocalStorage();
        this.render();
        this.updateAnalytics();
        
        // Mobile-specific optimizations
        this.optimizeForMobile();
    }

    // Initialize DOM Elements
    initializeElements() {
        // Input elements
        this.todoInput = document.getElementById('todoInput');
        this.addBtn = document.getElementById('addBtn');
        this.taskDueDate = document.getElementById('taskDueDate');
        this.taskPriority = document.getElementById('taskPriority');
        
        // Containers
        this.todoList = document.getElementById('todoList');
        this.historyList = document.getElementById('historyList');
        
        // Buttons
        this.clearCompleted = document.getElementById('clearCompleted');
        this.exportTasks = document.getElementById('exportTasks');
        this.clearHistory = document.getElementById('clearHistory');
        
        // Count elements
        this.activeTasksCount = document.getElementById('activeTasksCount');
        this.totalTasksCount = document.getElementById('totalTasksCount');
        this.completedTasksCount = document.getElementById('completedTasksCount');
        this.pendingTasksCount = document.getElementById('pendingTasksCount');
        this.totalCompleted = document.getElementById('totalCompleted');
        
        // Analytics elements
        this.todayProgress = document.getElementById('todayProgress');
        this.todayProgressBar = document.getElementById('todayProgressBar');
        this.weeklyAverage = document.getElementById('weeklyAverage');
        this.weeklyAverageBar = document.getElementById('weeklyAverageBar');
        this.bestDay = document.getElementById('bestDay');
        
        // Set default due date to today
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];
        this.taskDueDate.value = formattedDate;
    }

    // Attach Event Listeners
    attachEventListeners() {
        // Add task
        this.addBtn.addEventListener('click', () => this.addTodo());
        this.todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTodo();
        });

        // Action buttons
        this.clearCompleted.addEventListener('click', () => this.completeAllTasks());
        this.exportTasks.addEventListener('click', () => this.exportTasksToFile());
        this.clearHistory.addEventListener('click', () => this.clearHistoryData());

        // History filters
        document.querySelectorAll('.history-filter').forEach(btn => {
            btn.addEventListener('click', (e) => this.filterHistory(e.target.dataset.filter));
        });

        // Mobile swipe support for history
        this.enableSwipeSupport();
    }

    // Mobile Optimization
    optimizeForMobile() {
        // Improve touch experience
        if ('ontouchstart' in window) {
            document.querySelectorAll('button, input, select').forEach(element => {
                element.style.minHeight = '44px';
            });
        }
        
        // Handle virtual keyboard
        this.todoInput.addEventListener('focus', () => {
            setTimeout(() => {
                document.documentElement.scrollTop = 0;
            }, 300);
        });
    }

    // Enable Swipe Support for Mobile
    enableSwipeSupport() {
        let startX = 0;
        let endX = 0;

        this.historyList.addEventListener('touchstart', (e) => {
            startX = e.changedTouches[0].screenX;
        });

        this.historyList.addEventListener('touchend', (e) => {
            endX = e.changedTouches[0].screenX;
            this.handleSwipe(startX, endX);
        });
    }

    handleSwipe(startX, endX) {
        const diff = startX - endX;
        const swipeThreshold = 50;

        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                // Swipe left - next filter
                this.cycleFilter('next');
            } else {
                // Swipe right - previous filter
                this.cycleFilter('prev');
            }
        }
    }

    cycleFilter(direction) {
        const filters = ['all', 'today', 'week'];
        const currentFilter = document.querySelector('.history-filter.active').dataset.filter;
        let currentIndex = filters.indexOf(currentFilter);
        
        if (direction === 'next') {
            currentIndex = (currentIndex + 1) % filters.length;
        } else {
            currentIndex = (currentIndex - 1 + filters.length) % filters.length;
        }
        
        this.filterHistory(filters[currentIndex]);
    }

    // Add New Todo
    addTodo() {
        const taskText = this.todoInput.value.trim();
        const dueDate = this.taskDueDate.value;
        const priority = this.taskPriority.value;
        
        if (!taskText) {
            this.showNotification('Please enter a task!', 'error');
            return;
        }

        const newTodo = {
            id: Date.now(),
            text: taskText,
            completed: false,
            createdAt: new Date().toISOString(),
            dueDate: dueDate,
            priority: priority,
            completedAt: null
        };

        this.todos.push(newTodo);
        this.todoInput.value = '';
        this.render();
        this.saveToLocalStorage();
        this.showNotification('Task added successfully!', 'success');
        
        // Close virtual keyboard on mobile
        this.todoInput.blur();
    }

    // Render All Components
    render() {
        this.renderActiveTasks();
        this.renderHistory();
        this.updateCounts();
    }

    // Render Active Tasks
    renderActiveTasks() {
        const activeTodos = this.todos.filter(todo => !todo.completed);
        
        if (activeTodos.length === 0) {
            this.todoList.innerHTML = `
                <div id="emptyActive" class="text-center py-6 sm:py-8 text-gray-500 fade-in">
                    <i class="fas fa-clipboard-list text-3xl sm:text-4xl text-gray-300 mb-2 sm:mb-3"></i>
                    <p class="text-sm sm:text-base">No active tasks. Add a task to get started!</p>
                </div>
            `;
            return;
        }

        this.todoList.innerHTML = activeTodos.map(todo => `
            <div class="task-item flex items-center justify-between p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200 fade-in ${this.getPriorityClass(todo.priority)}">
                <div class="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <input 
                        type="checkbox" 
                        onchange="todoApp.toggleTodo(${todo.id})"
                        class="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 rounded focus:ring-blue-400 cursor-pointer transition-all duration-200 flex-shrink-0"
                    >
                    <div class="flex-1 min-w-0">
                        <span class="text-gray-800 font-medium text-sm sm:text-base break-words">${todo.text}</span>
                        <div class="flex flex-wrap gap-1 sm:gap-2 mt-1 text-xs text-gray-500">
                            ${todo.dueDate ? `
                                <span class="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                                    <i class="fas fa-calendar text-xs"></i>
                                    ${new Date(todo.dueDate).toLocaleDateString()}
                                </span>
                            ` : ''}
                            <span class="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                                <i class="fas fa-flag ${this.getPriorityIconColor(todo.priority)} text-xs"></i>
                                ${todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1)}
                            </span>
                        </div>
                    </div>
                </div>
                <div class="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                    <button 
                        onclick="todoApp.editTodo(${todo.id})" 
                        class="text-blue-400 hover:text-blue-600 p-1 sm:p-2 rounded-full hover:bg-blue-50 transition-all duration-200"
                        title="Edit task"
                    >
                        <i class="fas fa-edit text-sm"></i>
                    </button>
                    <button 
                        onclick="todoApp.deleteTodo(${todo.id})" 
                        class="text-red-400 hover:text-red-600 p-1 sm:p-2 rounded-full hover:bg-red-50 transition-all duration-200"
                        title="Delete task"
                    >
                        <i class="fas fa-trash text-sm"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Render History
    renderHistory(filter = 'all') {
        let filteredHistory = this.completedHistory;
        
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

        if (filter === 'today') {
            filteredHistory = this.completedHistory.filter(item => 
                new Date(item.completedAt) >= today
            );
        } else if (filter === 'week') {
            filteredHistory = this.completedHistory.filter(item => 
                new Date(item.completedAt) >= weekAgo
            );
        }

        if (filteredHistory.length === 0) {
            this.historyList.innerHTML = `
                <div id="emptyHistory" class="text-center py-6 sm:py-8 text-gray-500 fade-in">
                    <i class="fas fa-history text-2xl sm:text-3xl text-gray-300 mb-2 sm:mb-3"></i>
                    <p class="text-xs sm:text-sm">No completed tasks ${filter !== 'all' ? 'in this period' : 'yet'}</p>
                </div>
            `;
            return;
        }

        this.historyList.innerHTML = filteredHistory.slice(0, 10).map(item => `
            <div class="history-item completed-task p-2 sm:p-3 rounded-lg border border-green-200 fade-in">
                <div class="flex items-start justify-between">
                    <div class="flex-1 min-w-0">
                        <span class="text-gray-700 line-through text-sm sm:text-base break-words">${item.text}</span>
                        <div class="flex items-center gap-1 sm:gap-2 mt-1 text-xs text-gray-500 flex-wrap">
                            <span class="flex items-center gap-1 bg-white px-1 sm:px-2 py-0.5 rounded">
                                <i class="fas fa-check-circle text-green-500 text-xs"></i>
                                ${new Date(item.completedAt).toLocaleDateString()}
                            </span>
                            <span class="flex items-center gap-1 bg-white px-1 sm:px-2 py-0.5 rounded">
                                <i class="fas fa-clock text-xs"></i>
                                ${new Date(item.completedAt).toLocaleTimeString()}
                            </span>
                        </div>
                    </div>
                    <button 
                        onclick="todoApp.restoreTask('${item.id}')" 
                        class="text-blue-400 hover:text-blue-600 p-1 rounded transition-all duration-200 ml-2 flex-shrink-0"
                        title="Restore task"
                    >
                        <i class="fas fa-undo text-sm"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Toggle Todo Completion
    toggleTodo(id) {
        const todoIndex = this.todos.findIndex(todo => todo.id === id);
        if (todoIndex === -1) return;

        const todo = this.todos[todoIndex];
        todo.completed = !todo.completed;
        
        if (todo.completed) {
            // Move to history
            todo.completedAt = new Date().toISOString();
            this.completedHistory.unshift({...todo});
            this.todos.splice(todoIndex, 1);
            this.showNotification('Task completed! 🎉', 'success');
        }

        this.render();
        this.saveToLocalStorage();
        this.updateAnalytics();
    }

    // Edit Todo
    editTodo(id) {
        const todo = this.todos.find(todo => todo.id === id);
        if (!todo) return;

        const newText = prompt('Edit your task:', todo.text);
        if (newText !== null && newText.trim() !== '') {
            todo.text = newText.trim();
            this.render();
            this.saveToLocalStorage();
            this.showNotification('Task updated successfully!', 'success');
        }
    }

    // Delete Todo
    deleteTodo(id) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.todos = this.todos.filter(todo => todo.id !== id);
            this.render();
            this.saveToLocalStorage();
            this.showNotification('Task deleted!', 'info');
        }
    }

    // Restore Task from History
    restoreTask(historyId) {
        const historyIndex = this.completedHistory.findIndex(item => item.id == historyId);
        if (historyIndex === -1) return;

        const task = {...this.completedHistory[historyIndex]};
        task.completed = false;
        task.completedAt = null;
        
        this.todos.push(task);
        this.completedHistory.splice(historyIndex, 1);
        
        this.render();
        this.saveToLocalStorage();
        this.showNotification('Task restored!', 'success');
    }

    // Complete All Tasks
    completeAllTasks() {
        if (this.todos.length === 0) {
            this.showNotification('No tasks to complete!', 'info');
            return;
        }

        const completedCount = this.todos.length;
        const now = new Date().toISOString();
        
        this.todos.forEach(todo => {
            todo.completedAt = now;
            this.completedHistory.unshift({...todo});
        });
        
        this.todos = [];
        this.render();
        this.saveToLocalStorage();
        this.updateAnalytics();
        this.showNotification(`All ${completedCount} tasks completed! 🎉`, 'success');
    }

    // Filter History
    filterHistory(filter) {
        // Update active filter button
        document.querySelectorAll('.history-filter').forEach(btn => {
            btn.classList.remove('active', 'bg-blue-500', 'text-white');
            btn.classList.add('bg-gray-200', 'text-gray-700');
        });
        
        const activeBtn = document.querySelector(`[data-filter="${filter}"]`);
        activeBtn.classList.add('active', 'bg-blue-500', 'text-white');
        activeBtn.classList.remove('bg-gray-200', 'text-gray-700');
        
        this.renderHistory(filter);
    }

    // Update Counts
    updateCounts() {
        const total = this.todos.length + this.completedHistory.length;
        const completed = this.completedHistory.length;
        const pending = this.todos.length;

        this.activeTasksCount.textContent = pending;
        this.totalTasksCount.textContent = total;
        this.completedTasksCount.textContent = completed;
        this.pendingTasksCount.textContent = pending;
        this.totalCompleted.textContent = completed;
    }

    // Update Analytics
    updateAnalytics() {
        const today = new Date().toDateString();
        const todayCompleted = this.completedHistory.filter(item => 
            new Date(item.completedAt).toDateString() === today
        ).length;

        const totalToday = todayCompleted + this.todos.length;
        const todayProgress = totalToday > 0 ? Math.round((todayCompleted / totalToday) * 100) : 0;

        this.todayProgress.textContent = `${todayProgress}%`;
        this.todayProgressBar.style.width = `${todayProgress}%`;

        // Weekly average (simplified)
        const weeklyCompleted = this.completedHistory.filter(item => {
            const itemDate = new Date(item.completedAt);
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            return itemDate >= weekAgo;
        }).length;

        const weeklyAverage = weeklyCompleted > 0 ? Math.min(100, weeklyCompleted * 10) : 0;
        this.weeklyAverage.textContent = `${weeklyAverage}%`;
        this.weeklyAverageBar.style.width = `${weeklyAverage}%`;

        // Best day (simplified)
        if (this.completedHistory.length > 0) {
            this.bestDay.textContent = 'Today';
        }
    }

    // Export Tasks to File
    exportTasksToFile() {
        const data = {
            activeTasks: this.todos,
            completedHistory: this.completedHistory,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `todo-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        this.showNotification('Tasks exported successfully!', 'success');
    }

    // Clear History Data
    clearHistoryData() {
        if (this.completedHistory.length === 0) {
            this.showNotification('No history to clear!', 'info');
            return;
        }

        if (confirm('Are you sure you want to clear all history? This action cannot be undone.')) {
            this.completedHistory = [];
            this.render();
            this.saveToLocalStorage();
            this.updateAnalytics();
            this.showNotification('History cleared!', 'info');
        }
    }

    // Utility Methods
    getPriorityClass(priority) {
        switch(priority) {
            case 'high': return 'priority-high';
            case 'medium': return 'priority-medium';
            case 'low': return 'priority-low';
            default: return '';
        }
    }

    getPriorityIconColor(priority) {
        switch(priority) {
            case 'high': return 'text-red-500';
            case 'medium': return 'text-orange-500';
            case 'low': return 'text-green-500';
            default: return 'text-gray-500';
        }
    }

    // Show Notification
    showNotification(message, type) {
        // Remove existing notifications
        document.querySelectorAll('.notification').forEach(notif => notif.remove());

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="flex items-center gap-2 justify-center">
                <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation-triangle' : 'info-circle'}"></i>
                <span class="text-sm">${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Save to LocalStorage
    saveToLocalStorage() {
        const data = {
            todos: this.todos,
            completedHistory: this.completedHistory,
            lastUpdated: new Date().toISOString()
        };
        localStorage.setItem('smartTodoData', JSON.stringify(data));
    }

    // Load from LocalStorage
    loadFromLocalStorage() {
        try {
            const saved = localStorage.getItem('smartTodoData');
            if (saved) {
                const data = JSON.parse(saved);
                this.todos = data.todos || [];
                this.completedHistory = data.completedHistory || [];
            }
        } catch (error) {
            console.error('Error loading data:', error);
            this.showNotification('Error loading saved data', 'error');
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.todoApp = new SmartTodoApp();
});