/**
 * History Manager Module
 * 
 * Handles loading and displaying operation history from the server.
 * Provides functionality to load, filter, and display operation logs.
 */

export class HistoryManager {
    constructor() {
        this.history = [];
        this.isLoading = false;
        this.currentPage = 1;
        this.itemsPerPage = 50;
        this.totalItems = 0;
    }

    /**
     * Load operation history from the server
     * @param {Object} options - Loading options
     * @param {number} options.limit - Number of items to load
     * @param {number} options.offset - Offset for pagination
     * @param {string} options.filter - Filter by operation type
     * @param {string} options.search - Search term
     * @returns {Promise<Array>} - Array of history items
     */
    async loadHistory(options = {}) {
        try {
            this.isLoading = true;
            
            const params = new URLSearchParams();
            
            if (options.limit) {
                params.append('limit', options.limit);
            }
            
            if (options.offset) {
                params.append('offset', options.offset);
            }
            
            if (options.filter) {
                params.append('filter', options.filter);
            }
            
            if (options.search) {
                params.append('search', options.search);
            }

            const response = await fetch(`/api/history?${params.toString()}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.success === false) {
                throw new Error(data.error || 'Failed to load history');
            }

            this.history = data.history || data;
            this.totalItems = data.total || this.history.length;
            
            return this.history;
            
        } catch (error) {
            console.error('Error loading history:', error);
            throw error;
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Get current history data
     * @returns {Array} - Current history items
     */
    getHistory() {
        return this.history;
    }

    /**
     * Check if currently loading
     * @returns {boolean} - Loading state
     */
    isLoading() {
        return this.isLoading;
    }

    /**
     * Get pagination info
     * @returns {Object} - Pagination information
     */
    getPaginationInfo() {
        return {
            currentPage: this.currentPage,
            itemsPerPage: this.itemsPerPage,
            totalItems: this.totalItems,
            totalPages: Math.ceil(this.totalItems / this.itemsPerPage)
        };
    }

    /**
     * Load next page of history
     * @returns {Promise<Array>} - Next page of history items
     */
    async loadNextPage() {
        this.currentPage++;
        const offset = (this.currentPage - 1) * this.itemsPerPage;
        
        return await this.loadHistory({
            limit: this.itemsPerPage,
            offset: offset
        });
    }

    /**
     * Load previous page of history
     * @returns {Promise<Array>} - Previous page of history items
     */
    async loadPreviousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            const offset = (this.currentPage - 1) * this.itemsPerPage;
            
            return await this.loadHistory({
                limit: this.itemsPerPage,
                offset: offset
            });
        }
        
        return this.history;
    }

    /**
     * Filter history by operation type
     * @param {string} filter - Filter type (import, delete, modify, export)
     * @returns {Promise<Array>} - Filtered history items
     */
    async filterByType(filter) {
        return await this.loadHistory({
            limit: this.itemsPerPage,
            filter: filter
        });
    }

    /**
     * Search history
     * @param {string} searchTerm - Search term
     * @returns {Promise<Array>} - Search results
     */
    async searchHistory(searchTerm) {
        return await this.loadHistory({
            limit: this.itemsPerPage,
            search: searchTerm
        });
    }

    /**
     * Clear current history data
     */
    clearHistory() {
        this.history = [];
        this.currentPage = 1;
        this.totalItems = 0;
    }
} 