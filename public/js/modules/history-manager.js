// HistoryManager: Handles history page functionality including loading, filtering, and displaying operation history
// Provides comprehensive history management with filtering, real-time updates, and expandable details

class HistoryManager {
    constructor() {
        this.historyContainer = null;
        this.refreshButton = null;
        this.clearButton = null;
        this.currentHistory = [];
        this.isAutoRefresh = true;
        this.refreshInterval = null;
        this.filterType = '';
        this.filterPopulation = '';
        this.filterStartDate = '';
        this.filterEndDate = '';
        this.filterText = '';
        
        this.initialize();
    }
    
    initialize() {
        this.setupElements();
        this.setupEventListeners();
        this.startAutoRefresh();
        this.loadHistory();
        this.loadPopulations();
    }
    
    setupElements() {
        this.historyContainer = document.getElementById('history-container');
        this.refreshButton = document.getElementById('refresh-history');
        this.clearButton = document.getElementById('clear-history');
        
        if (!this.historyContainer) {
            console.warn('History container not found');
            return;
        }
        
        if (!this.refreshButton) {
            console.warn('Refresh history button not found');
        }
        
        if (!this.clearButton) {
            console.warn('Clear history button not found');
        }
    }
    
    setupEventListeners() {
        if (this.refreshButton) {
            this.refreshButton.addEventListener('click', () => this.loadHistory());
        }
        
        if (this.clearButton) {
            this.clearButton.addEventListener('click', () => this.clearHistory());
        }
        
        // Setup filter controls
        this.setupFilterControls();
        
        // Setup search functionality
        this.setupSearchControls();
    }
    
    setupFilterControls() {
        const typeFilter = document.getElementById('history-type-filter');
        const populationFilter = document.getElementById('history-population-filter');
        const startDateFilter = document.getElementById('history-date-start');
        const endDateFilter = document.getElementById('history-date-end');
        const applyFiltersBtn = document.getElementById('apply-history-filters');
        const clearFiltersBtn = document.getElementById('clear-history-filters');
        
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', () => this.applyFilters());
        }
        
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => this.clearFilters());
        }
        
        // Auto-apply filters on change
        if (typeFilter) {
            typeFilter.addEventListener('change', () => this.applyFilters());
        }
        
        if (populationFilter) {
            populationFilter.addEventListener('input', () => this.applyFilters());
        }
        
        if (startDateFilter) {
            startDateFilter.addEventListener('change', () => this.applyFilters());
        }
        
        if (endDateFilter) {
            endDateFilter.addEventListener('change', () => this.applyFilters());
        }
    }
    
    setupSearchControls() {
        const searchIcon = document.getElementById('history-search-icon');
        const searchInput = document.getElementById('history-search-input');
        
        if (searchIcon && searchInput) {
            searchIcon.addEventListener('click', () => {
                if (searchInput.style.display === 'none') {
                    searchInput.style.display = 'inline-block';
                    searchInput.focus();
                } else {
                    searchInput.value = '';
                    searchInput.style.display = 'none';
                    this.filterText = '';
                    this.applyFilters();
                }
            });
            
            searchInput.addEventListener('input', (e) => {
                this.filterText = e.target.value.toLowerCase();
                this.applyFilters();
            });
            
            // Hide input on Escape
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    searchInput.value = '';
                    searchInput.style.display = 'none';
                    this.filterText = '';
                    this.applyFilters();
                }
            });
        }
    }
    
    async loadHistory() {
        try {
            // Build query parameters
            const params = new URLSearchParams();
            params.append('limit', '100');
            
            if (this.filterType) params.append('type', this.filterType);
            if (this.filterPopulation) params.append('population', this.filterPopulation);
            if (this.filterStartDate) params.append('startDate', this.filterStartDate);
            if (this.filterEndDate) params.append('endDate', this.filterEndDate);
            
            const response = await fetch(`/api/history?${params.toString()}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            if (data.success && data.operations) {
                this.currentHistory = data.operations;
                this.displayHistory();
                this.scrollToTop();
            } else {
                console.warn('No history received or invalid response format');
                this.displayNoHistory();
            }
        } catch (error) {
            console.error('Failed to load history:', error);
            this.displayError('Failed to load history: ' + error.message);
        }
    }
    
    displayHistory() {
        if (!this.historyContainer) return;
        
        this.historyContainer.innerHTML = '';
        
        if (this.currentHistory.length === 0) {
            this.displayNoHistory();
            return;
        }
        
        const filteredHistory = this.getFilteredHistory();
        
        filteredHistory.forEach(operation => {
            const historyElement = this.createHistoryElement(operation);
            this.historyContainer.appendChild(historyElement);
        });
        
        // Update history count
        this.updateHistoryCount(filteredHistory.length, this.currentHistory.length);
    }
    
    getFilteredHistory() {
        return this.currentHistory.filter(operation => {
            // Text search filter
            if (this.filterText) {
                const searchText = `${operation.type} ${operation.fileName} ${operation.population} ${operation.message}`.toLowerCase();
                if (!searchText.includes(this.filterText)) {
                    return false;
                }
            }
            
            return true;
        });
    }
    
    applyFilters() {
        // Get current filter values
        const typeFilter = document.getElementById('history-type-filter');
        const populationFilter = document.getElementById('history-population-filter');
        const startDateFilter = document.getElementById('history-date-start');
        const endDateFilter = document.getElementById('history-date-end');
        
        this.filterType = typeFilter ? typeFilter.value : '';
        this.filterPopulation = populationFilter ? populationFilter.value : '';
        this.filterStartDate = startDateFilter ? startDateFilter.value : '';
        this.filterEndDate = endDateFilter ? endDateFilter.value : '';
        
        // Reload history with new filters
        this.loadHistory();
    }
    
    clearFilters() {
        const typeFilter = document.getElementById('history-type-filter');
        const populationFilter = document.getElementById('history-population-filter');
        const startDateFilter = document.getElementById('history-date-start');
        const endDateFilter = document.getElementById('history-date-end');
        
        if (typeFilter) typeFilter.value = '';
        if (populationFilter) populationFilter.value = '';
        if (startDateFilter) startDateFilter.value = '';
        if (endDateFilter) endDateFilter.value = '';
        
        this.filterType = '';
        this.filterPopulation = '';
        this.filterStartDate = '';
        this.filterEndDate = '';
        
        this.loadHistory();
    }
    
    createHistoryElement(operation) {
        const historyElement = document.createElement('div');
        historyElement.className = `history-entry ${operation.type.toLowerCase()}`;
        historyElement.setAttribute('data-operation-id', operation.id);
        historyElement.setAttribute('tabindex', '0');
        historyElement.setAttribute('role', 'button');
        historyElement.setAttribute('aria-expanded', 'false');
        historyElement.setAttribute('aria-label', `Operation: ${operation.type} - ${operation.fileName}`);
        
        const timestamp = new Date(operation.timestamp).toLocaleString();
        const typeClass = `operation-type ${operation.type.toLowerCase()}`;
        
        // Create result summary
        const resultSummary = this.createResultSummary(operation);
        
        historyElement.innerHTML = `
            <div class="history-header">
                <div class="history-info">
                    <span class="${typeClass}">${operation.type}</span>
                    <span class="history-timestamp">${timestamp}</span>
                </div>
                <div class="history-summary">
                    <span class="history-file">${this.escapeHtml(operation.fileName)}</span>
                    <span class="history-population">${this.escapeHtml(operation.population)}</span>
                    <span class="history-result">${resultSummary}</span>
                </div>
                <span class="history-expand-icon" aria-hidden="true">▶</span>
            </div>
            <div class="history-message">${this.escapeHtml(operation.message)}</div>
            <div class="history-details" role="region" aria-label="Operation details">
                <div class="history-details-content">
                    <div class="history-detail-section">
                        <h5>File Information:</h5>
                        <p><strong>File Name:</strong> ${this.escapeHtml(operation.fileName)}</p>
                        <p><strong>Population:</strong> ${this.escapeHtml(operation.population)}</p>
                        <p><strong>Environment ID:</strong> ${this.escapeHtml(operation.environmentId)}</p>
                    </div>
                    
                    <div class="history-detail-section">
                        <h5>Operation Details:</h5>
                        ${this.createOperationDetails(operation)}
                    </div>
                    
                    ${operation.ip ? `
                        <div class="history-detail-section">
                            <h5>Connection Info:</h5>
                            <p><strong>IP Address:</strong> ${operation.ip}</p>
                            ${operation.userAgent ? `<p><strong>User Agent:</strong> ${this.escapeHtml(operation.userAgent)}</p>` : ''}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        // Enhanced click handler for expand/collapse
        const handleToggle = (event) => {
            event.preventDefault();
            event.stopPropagation();
            
            const isExpanded = historyElement.classList.contains('expanded');
            const expandIcon = historyElement.querySelector('.history-expand-icon');
            const details = historyElement.querySelector('.history-details');
            
            if (isExpanded) {
                // Collapse
                historyElement.classList.remove('expanded');
                historyElement.setAttribute('aria-expanded', 'false');
                if (expandIcon) {
                    expandIcon.textContent = '▶';
                    expandIcon.setAttribute('aria-label', 'Expand operation details');
                }
                if (details) {
                    details.style.display = 'none';
                }
            } else {
                // Expand
                historyElement.classList.add('expanded');
                historyElement.setAttribute('aria-expanded', 'true');
                if (expandIcon) {
                    expandIcon.textContent = '▼';
                    expandIcon.setAttribute('aria-label', 'Collapse operation details');
                }
                if (details) {
                    details.style.display = 'block';
                    // Smooth scroll into view if needed
                    setTimeout(() => {
                        if (details.getBoundingClientRect().bottom > window.innerHeight) {
                            details.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        }
                    }, 100);
                }
            }
        };
        
        // Click handler
        historyElement.addEventListener('click', handleToggle);
        
        // Keyboard accessibility
        historyElement.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handleToggle(event);
            }
        });
        
        // Focus management
        historyElement.addEventListener('focus', () => {
            historyElement.classList.add('focused');
        });
        
        historyElement.addEventListener('blur', () => {
            historyElement.classList.remove('focused');
        });
        
        return historyElement;
    }
    
    createResultSummary(operation) {
        switch (operation.type) {
            case 'IMPORT':
            case 'MODIFY':
                return `✔️ ${operation.success || 0} Success / ❌ ${operation.errors || 0} Errors / ⚠️ ${operation.skipped || 0} Skipped`;
            case 'EXPORT':
                return `📊 ${operation.recordCount || 0} Records / 📁 ${operation.format || 'CSV'}`;
            case 'DELETE':
                return `🗑️ ${operation.deleteCount || 0} Deleted / 📋 ${operation.total || 0} Total`;
            default:
                return '📋 Operation completed';
        }
    }
    
    createOperationDetails(operation) {
        switch (operation.type) {
            case 'IMPORT':
            case 'MODIFY':
                return `
                    <p><strong>Total Processed:</strong> ${operation.total || 0}</p>
                    <p><strong>Successfully Processed:</strong> ${operation.success || 0}</p>
                    <p><strong>Errors:</strong> ${operation.errors || 0}</p>
                    <p><strong>Skipped:</strong> ${operation.skipped || 0}</p>
                `;
            case 'EXPORT':
                return `
                    <p><strong>Record Count:</strong> ${operation.recordCount || 0}</p>
                    <p><strong>Format:</strong> ${operation.format || 'CSV'}</p>
                    <p><strong>File Size:</strong> ${operation.fileSize || 'Unknown'}</p>
                `;
            case 'DELETE':
                return `
                    <p><strong>Delete Type:</strong> ${operation.deleteType || 'file'}</p>
                    <p><strong>Total Users:</strong> ${operation.total || 0}</p>
                    <p><strong>Successfully Deleted:</strong> ${operation.deleteCount || 0}</p>
                `;
            default:
                return '<p>No additional details available</p>';
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    displayNoHistory() {
        if (!this.historyContainer) return;
        this.historyContainer.innerHTML = `
            <div class="no-history-message">
                <i class="fas fa-info-circle"></i>
                <p>No operation history found.</p>
                <small>History will appear here when operations are performed</small>
            </div>
        `;
    }
    
    displayError(message) {
        if (!this.historyContainer) return;
        
        this.historyContainer.innerHTML = `
            <div class="history-error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${this.escapeHtml(message)}</p>
                <button class="btn btn-secondary" onclick="window.historyManager.loadHistory()">
                    <i class="fas fa-sync-alt"></i> Retry
                </button>
            </div>
        `;
    }
    
    updateHistoryCount(filtered, total) {
        const historyHeader = document.querySelector('.history-header h1');
        if (historyHeader) {
            if (filtered === total) {
                historyHeader.textContent = `Operation History (${total})`;
            } else {
                historyHeader.textContent = `Operation History (${filtered}/${total})`;
            }
        }
    }
    
    scrollToTop() {
        if (this.historyContainer) {
            this.historyContainer.scrollTop = 0;
        }
    }
    
    async clearHistory() {
        if (!confirm('Are you sure you want to clear all operation history? This action cannot be undone.')) {
            return;
        }
        
        try {
            const response = await fetch('/api/logs/ui', {
                method: 'DELETE'
            });
            
            if (response.ok) {
                this.currentHistory = [];
                this.displayHistory();
                console.log('History cleared successfully');
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            console.error('Failed to clear history:', error);
            alert('Failed to clear history: ' + error.message);
        }
    }
    
    startAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        
        this.refreshInterval = setInterval(() => {
            if (this.isAutoRefresh) {
                this.loadHistory();
            }
        }, 10000); // Refresh every 10 seconds
    }
    
    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }
    
    async loadPopulations() {
        try {
            const response = await fetch('/api/populations');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            const populations = data.populations || [];
            
            const populationFilter = document.getElementById('history-population-filter');
            if (populationFilter) {
                // Clear existing options except the first one
                populationFilter.innerHTML = '<option value="">All Populations</option>';
                
                // Add population options
                populations.forEach(population => {
                    const option = document.createElement('option');
                    option.value = population.id;
                    option.textContent = population.name;
                    populationFilter.appendChild(option);
                });
                
                console.log(`Loaded ${populations.length} populations for history filter`);
            }
        } catch (error) {
            console.error('Failed to load populations for history filter:', error);
        }
    }
    
    destroy() {
        this.stopAutoRefresh();
    }
}

// Create and export default instance
const historyManager = new HistoryManager();

// Export the class and instance
export { HistoryManager, historyManager }; 