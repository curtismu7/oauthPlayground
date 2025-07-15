// File: ui-manager.js
// Description: UI management for PingOne user import tool
// 
// This module handles all user interface interactions and state management:
// - Status notifications and user feedback
// - Progress tracking and real-time updates
// - View transitions and navigation
// - Debug logging and error display
// - Connection status indicators
// - Form handling and validation feedback
// 
// Provides a centralized interface for updating the UI based on application events.

import { createWinstonLogger } from './winston-logger.js';
import { createCircularProgress } from './circular-progress.js';
import { ElementRegistry } from './element-registry.js';
import progressManager from './progress-manager.js';

// Enable debug mode for development (set to false in production)
const DEBUG_MODE = true;

/**
 * UI Manager Class
 * 
 * Manages all user interface interactions and updates with Winston logging.
 */
class UIManager {
    constructor() {
        // Initialize Winston logger
        this.logger = createWinstonLogger({
            service: 'pingone-import-ui',
            environment: process.env.NODE_ENV || 'development'
        });
        
        this.notificationContainer = null;
        this.progressContainer = null;
        this.tokenStatusElement = null;
        this.connectionStatusElement = null;
        
        this.initialize();
    }
    
    /**
     * Initialize UI manager
     */
    initialize() {
        try {
            this.setupElements();
            this.logger.info('UI Manager initialized successfully');
        } catch (error) {
            this.logger.error('Failed to initialize UI Manager', { error: error.message });
        }
    }
    
    /**
     * Initialize UI manager (alias for initialize for compatibility)
     */
    async init() {
        this.initialize();
        return Promise.resolve();
    }
    
    /**
     * Setup UI elements
     */
    setupElements() {
        try {
            // Initialize core UI elements with safe fallbacks
            this.notificationContainer = ElementRegistry.notificationContainer ? ElementRegistry.notificationContainer() : null;
            this.progressContainer = ElementRegistry.progressContainer ? ElementRegistry.progressContainer() : null;
            this.tokenStatusElement = ElementRegistry.tokenStatus ? ElementRegistry.tokenStatus() : null;
            this.connectionStatusElement = ElementRegistry.connectionStatus ? ElementRegistry.connectionStatus() : null;
            
            // Initialize navigation items for safe access
            this.navItems = document.querySelectorAll('[data-view]');
            
            if (!this.notificationContainer) {
                this.logger.warn('Notification container not found');
            }
            
            if (!this.progressContainer) {
                this.logger.warn('Progress container not found');
            }
            
            this.logger.debug('UI elements setup completed', {
                hasNotificationContainer: !!this.notificationContainer,
                hasProgressContainer: !!this.progressContainer,
                hasTokenStatusElement: !!this.tokenStatusElement,
                hasConnectionStatusElement: !!this.connectionStatusElement,
                navItemsCount: this.navItems ? this.navItems.length : 0
            });
        } catch (error) {
            this.logger.error('Error setting up UI elements', { error: error.message });
        }
    }
    
    /**
     * Show a persistent, animated status bar message
     * type: info, success, warning, error
     * message: string
     * options: { autoDismiss: boolean, duration: ms }
     */
    showStatusBar(message, type = 'info', options = {}) {
        const bar = ElementRegistry.statusBar ? ElementRegistry.statusBar() : null;
        if (!bar) {
            this.logger.warn('Status bar element not found');
            return;
        }
        
        // Clear any existing auto-dismiss timers
        if (this.statusBarTimer) {
            clearTimeout(this.statusBarTimer);
            this.statusBarTimer = null;
        }
        
        // Remove previous content and classes
        bar.className = 'status-bar';
        bar.innerHTML = '';
        
        // Create icon element
        const icon = document.createElement('span');
        icon.className = 'status-icon';
        icon.innerHTML = {
            info: '<i class="fas fa-info-circle"></i>',
            success: '<i class="fas fa-check-circle"></i>',
            warning: '<i class="fas fa-exclamation-triangle"></i>',
            error: '<i class="fas fa-times-circle"></i>'
        }[type] || '<i class="fas fa-info-circle"></i>';
        bar.appendChild(icon);
        
        // Create message element
        const msg = document.createElement('span');
        msg.className = 'status-message';
        msg.textContent = message;
        bar.appendChild(msg);
        
        // Add dismiss button for error/warning (persistent messages)
        if (type === 'error' || type === 'warning') {
            const dismiss = document.createElement('button');
            dismiss.className = 'status-dismiss';
            dismiss.innerHTML = '&times;';
            dismiss.setAttribute('aria-label', 'Dismiss message');
            dismiss.onclick = () => this.clearStatusBar();
            bar.appendChild(dismiss);
        }
        
        // Animate in with a slight delay for smooth transition
        setTimeout(() => {
            bar.classList.add('visible', type);
        }, 10);
        
        // Auto-dismiss for success/info messages
        const shouldAutoDismiss = options.autoDismiss !== false && (type === 'success' || type === 'info');
        if (shouldAutoDismiss) {
            const duration = options.duration || (type === 'success' ? 4000 : 3000);
            this.statusBarTimer = setTimeout(() => {
                this.clearStatusBar();
            }, duration);
        }
        
        // Log the status bar message
        this.logger.info('Status bar message shown', { 
            type, 
            message: message.substring(0, 100), 
            autoDismiss: shouldAutoDismiss,
            duration: options.duration 
        });
    }
    
    /**
     * Clear the status bar with smooth animation
     */
    clearStatusBar() {
        const bar = ElementRegistry.statusBar ? ElementRegistry.statusBar() : null;
        if (!bar) return;
        
        // Clear any pending timers
        if (this.statusBarTimer) {
            clearTimeout(this.statusBarTimer);
            this.statusBarTimer = null;
        }
        
        // Remove visible class to trigger fade out animation
        bar.classList.remove('visible');
        
        // Clear content after animation completes
        setTimeout(() => { 
            bar.innerHTML = ''; 
            bar.className = 'status-bar';
        }, 400);
        
        this.logger.debug('Status bar cleared');
    }
    
    /**
     * Show a temporary success message with auto-dismiss
     */
    showSuccess(message, details = '') {
        this.showStatusBar(message, 'success', { 
            autoDismiss: true, 
            duration: 4000 
        });
        
        if (details) {
            this.logger.info('Success notification with details', { message, details });
        } else {
            this.logger.info('Success notification shown', { message });
        }
    }
    
    /**
     * Show an error message that stays until dismissed
     */
    showError(title, message) {
        const fullMessage = title && message ? `${title}: ${message}` : (title || message);
        this.showStatusBar(fullMessage, 'error', { autoDismiss: false });
        this.logger.error('Error notification shown', { title, message });
    }
    
    /**
     * Show a warning message that stays until dismissed
     */
    showWarning(message) {
        this.showStatusBar(message, 'warning', { autoDismiss: false });
        this.logger.warn('Warning notification shown', { message });
    }
    
    /**
     * Show an info message with auto-dismiss
     */
    showInfo(message) {
        this.showStatusBar(message, 'info', { 
            autoDismiss: true, 
            duration: 3000 
        });
        this.logger.info('Info notification shown', { message });
    }
    
    /**
     * Show a loading message that stays until cleared
     */
    showLoading(message = 'Processing...') {
        this.showStatusBar(message, 'info', { autoDismiss: false });
        this.logger.info('Loading notification shown', { message });
    }
    
    /**
     * Clear loading state and show completion message
     */
    hideLoading(successMessage = null) {
        this.clearStatusBar();
        if (successMessage) {
            this.showSuccess(successMessage);
        }
    }
    
    /**
     * Update progress with Winston logging
     */
    updateProgress(current, total, message = '') {
        try {
            const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
            
            this.logger.debug('Progress updated', { 
                current, 
                total, 
                percentage, 
                message: message.substring(0, 50) 
            });
            
            if (this.progressContainer) {
                const progressBar = this.progressContainer.querySelector('.progress-bar');
                const progressText = this.progressContainer.querySelector('.progress-text');
                
                if (progressBar) {
                    progressBar.style.width = `${percentage}%`;
                }
                
                if (progressText) {
                    progressText.textContent = message || `${current} of ${total} (${percentage}%)`;
                }
            }
        } catch (error) {
            this.logger.error('Error updating progress', { error: error.message, current, total });
        }
    }
    
    /**
     * Update token status with Winston logging
     */
    updateTokenStatus(status, message = '') {
        try {
            this.logger.info('Token status updated', { status, message });
            
            if (this.tokenStatusElement) {
                this.tokenStatusElement.className = `token-status ${status}`;
                this.tokenStatusElement.textContent = message || status;
            } else {
                this.logger.warn('Token status element not found');
            }
        } catch (error) {
            this.logger.error('Error updating token status', { error: error.message, status, message });
        }
    }
    
    /**
     * Update connection status with Winston logging
     */
    updateConnectionStatus(status, message = '') {
        try {
            this.logger.info('Connection status updated', { status, message });
            
            if (this.connectionStatusElement) {
                this.connectionStatusElement.className = `connection-status ${status}`;
                this.connectionStatusElement.textContent = message || status;
            } else {
                this.logger.warn('Connection status element not found');
            }
        } catch (error) {
            this.logger.error('Error updating connection status', { error: error.message, status, message });
        }
    }
    
    /**
     * Show current token status with Winston logging
     */
    showCurrentTokenStatus(tokenInfo) {
        try {
            this.logger.debug('Showing current token status', { 
                hasToken: !!tokenInfo.token,
                timeRemaining: tokenInfo.timeRemaining,
                isExpired: tokenInfo.isExpired
            });
            
            const statusElement = ElementRegistry.currentTokenStatus ? ElementRegistry.currentTokenStatus() : null;
            if (statusElement) {
                if (tokenInfo.isExpired) {
                    statusElement.className = 'token-status expired';
                    statusElement.textContent = 'Token expired';
                } else if (tokenInfo.token) {
                    statusElement.className = 'token-status valid';
                    statusElement.textContent = `Token valid (${tokenInfo.timeRemaining})`;
                } else {
                    statusElement.className = 'token-status none';
                    statusElement.textContent = 'No token available';
                }
            } else {
                this.logger.warn('Current token status element not found');
            }
        } catch (error) {
            this.logger.error('Error showing current token status', { error: error.message, tokenInfo });
        }
    }
    
    /**
     * Update universal token status with Winston logging
     */
    updateUniversalTokenStatus(tokenInfo) {
        try {
            this.logger.debug('Universal token status updated', { 
                hasToken: !!tokenInfo.token,
                timeRemaining: tokenInfo.timeRemaining
            });
            
            const universalStatusBar = ElementRegistry.universalTokenStatus ? ElementRegistry.universalTokenStatus() : null;
            if (universalStatusBar) {
                if (tokenInfo.isExpired) {
                    universalStatusBar.className = 'universal-token-status expired';
                    universalStatusBar.textContent = '🔴 Token Expired';
                } else if (tokenInfo.token) {
                    universalStatusBar.className = 'universal-token-status valid';
                    universalStatusBar.textContent = `🟢 Token Valid (${tokenInfo.timeRemaining})`;
                } else {
                    universalStatusBar.className = 'universal-token-status none';
                    universalStatusBar.textContent = '⚪ No Token';
                }
            } else {
                this.logger.warn('Universal token status bar not found');
            }
        } catch (error) {
            this.logger.error('Error updating universal token status', { error: error.message, tokenInfo });
        }
    }
    
    /**
     * Update home token status with Winston logging
     */
    updateHomeTokenStatus(isLoading = false) {
        try {
            this.logger.debug('Home token status updated', { isLoading });
            
            const homeTokenStatus = ElementRegistry.homeTokenStatus ? ElementRegistry.homeTokenStatus() : null;
            if (homeTokenStatus) {
                if (isLoading) {
                    homeTokenStatus.className = 'home-token-status loading';
                    homeTokenStatus.textContent = '🔄 Checking token...';
                } else {
                    homeTokenStatus.className = 'home-token-status ready';
                    homeTokenStatus.textContent = '✅ Token ready';
                }
            } else {
                this.logger.warn('Home token status element not found');
            }
        } catch (error) {
            this.logger.error('Error updating home token status', { error: error.message, isLoading });
        }
    }
    
    /**
     * Update settings save status with Winston logging
     */
    updateSettingsSaveStatus(success, message = '') {
        try {
            this.logger.info('Settings save status updated', { success, message });
            
            const saveStatusElement = ElementRegistry.settingsSaveStatus ? ElementRegistry.settingsSaveStatus() : null;
            if (saveStatusElement) {
                if (success) {
                    saveStatusElement.className = 'settings-save-status success';
                    saveStatusElement.textContent = '✅ Settings saved successfully';
                } else {
                    saveStatusElement.className = 'settings-save-status error';
                    saveStatusElement.textContent = `❌ ${message || 'Failed to save settings'}`;
                }
            } else {
                this.logger.warn('Settings save status element not found');
            }
        } catch (error) {
            this.logger.error('Error updating settings save status', { error: error.message, success, message });
        }
    }
    
    /**
     * Show enhanced settings action status
     * @param {string} message - Status message
     * @param {string} type - Status type (success, error, warning, info)
     * @param {Object} options - Additional options
     */
    showSettingsActionStatus(message, type = 'info', options = {}) {
        try {
            this.logger.info('Settings action status shown', { message, type, options });
            
            const statusElement = document.getElementById('settings-action-status');
            const statusIcon = statusElement?.querySelector('.status-icon');
            const statusMessage = statusElement?.querySelector('.status-message');
            const closeButton = statusElement?.querySelector('.status-close');
            
            if (!statusElement || !statusIcon || !statusMessage) {
                this.logger.warn('Settings action status elements not found');
                return;
            }
            
            // Set icon based on type
            const icons = {
                success: '✅',
                error: '❌',
                warning: '⚠️',
                info: 'ℹ️'
            };
            
            statusIcon.textContent = icons[type] || icons.info;
            
            // Set message
            statusMessage.textContent = message;
            
            // Update classes
            statusElement.className = `action-status ${type}`;
            statusElement.style.display = 'block';
            
            // Setup close button
            if (closeButton) {
                closeButton.onclick = () => {
                    this.hideSettingsActionStatus();
                };
            }
            
            // Auto-hide if specified
            if (options.autoHide !== false) {
                const autoHideDelay = options.autoHideDelay || 5000; // 5 seconds default
                setTimeout(() => {
                    this.hideSettingsActionStatus();
                }, autoHideDelay);
            }
            
        } catch (error) {
            this.logger.error('Error showing settings action status', { 
                error: error.message, 
                message, 
                type, 
                options 
            });
        }
    }
    
    /**
     * Hide settings action status
     */
    hideSettingsActionStatus() {
        try {
            const statusElement = document.getElementById('settings-action-status');
            if (statusElement) {
                statusElement.classList.add('auto-hide');
                setTimeout(() => {
                    statusElement.style.display = 'none';
                    statusElement.classList.remove('auto-hide');
                }, 300);
            }
        } catch (error) {
            this.logger.error('Error hiding settings action status', { error: error.message });
        }
    }
    
    /**
     * Show import status with Winston logging
     */
    showImportStatus(status, message = '', details = {}) {
        try {
            this.logger.info('Import status shown', { status, message, details });
            
            const statusElement = ElementRegistry.importStatus ? ElementRegistry.importStatus() : null;
            if (statusElement) {
                statusElement.className = `import-status ${status}`;
                statusElement.textContent = message;
                
                // Add details if provided
                if (Object.keys(details).length > 0) {
                    const detailsElement = document.createElement('div');
                    detailsElement.className = 'import-details';
                    detailsElement.textContent = JSON.stringify(details, null, 2);
                    statusElement.appendChild(detailsElement);
                }
            } else {
                this.logger.warn('Import status element not found');
            }
        } catch (error) {
            this.logger.error('Error showing import status', { error: error.message, status, message });
        }
    }
    
    /**
     * Clear all notifications
     */
    clearNotifications() {
        try {
            if (this.notificationContainer) {
                this.notificationContainer.innerHTML = '';
                this.logger.debug('All notifications cleared');
            }
        } catch (error) {
            this.logger.error('Error clearing notifications', { error: error.message });
        }
    }
    
    /**
     * Hide progress
     */
    hideProgress() {
        try {
            if (this.progressContainer) {
                this.progressContainer.style.display = 'none';
                this.logger.debug('Progress hidden');
            }
        } catch (error) {
            this.logger.error('Error hiding progress', { error: error.message });
        }
    }
    
    /**
     * Show progress
     */
    showProgress() {
        try {
            if (this.progressContainer) {
                this.progressContainer.style.display = 'block';
                this.logger.debug('Progress shown');
            }
        } catch (error) {
            this.logger.error('Error showing progress', { error: error.message });
        }
    }
    
    /**
     * Set button loading state
     */
    setButtonLoading(buttonId, isLoading) {
        try {
            const button = document.getElementById(buttonId);
            if (button) {
                if (isLoading) {
                    button.disabled = true;
                    button.innerHTML = '<span class="spinner"></span> Loading...';
                } else {
                    button.disabled = false;
                    button.innerHTML = button.getAttribute('data-original-text') || 'Submit';
                }
                this.logger.debug('Button loading state updated', { buttonId, isLoading });
            } else {
                this.logger.warn(`Button with ID '${buttonId}' not found`);
            }
        } catch (error) {
            this.logger.error('Error setting button loading state', { error: error.message, buttonId, isLoading });
        }
    }
    
    /**
     * Update population fields with Winston logging
     */
    updatePopulationFields(populations) {
        try {
            this.logger.debug('Population fields updated', { 
                populationCount: populations.length,
                populationNames: populations.map(p => p.name)
            });
            
            const populationSelect = document.getElementById('import-population-select');
            if (populationSelect) {
                populationSelect.innerHTML = '<option value="">Select Population</option>';
                populations.forEach(population => {
                    const option = document.createElement('option');
                    option.value = population.id;
                    option.textContent = population.name;
                    populationSelect.appendChild(option);
                });
            } else {
                this.logger.warn('Population select element not found');
            }
        } catch (error) {
            this.logger.error('Error updating population fields', { error: error.message, populations });
        }
    }

    /**
     * Show a notification message
     * @param {string} title - Notification title
     * @param {string} message - Notification message
     * @param {string} type - Notification type (success, error, warning, info)
     * @param {Object} options - Additional options
     */
    showNotification(title, message, type = 'info', options = {}) {
        try {
            // Use existing methods based on type
            switch (type) {
                case 'success':
                    this.showSuccess(message);
                    break;
                case 'error':
                    this.showError(title, message);
                    break;
                case 'warning':
                    this.showWarning(message);
                    break;
                case 'info':
                default:
                    this.showInfo(message);
                    break;
            }
            
            this.logger.info('Notification shown', { title, message, type });
        } catch (error) {
            this.logger.error('Failed to show notification', { 
                error: error.message, 
                title, 
                message, 
                type 
            });
            // Fallback to console
            console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
        }
    }

    /**
     * Update import progress with enhanced functionality
     * 
     * @param {number} current - Current progress
     * @param {number} total - Total items
     * @param {string} message - Progress message
     * @param {Object} counts - Progress counts
     * @param {string} populationName - Population name
     * @param {string} populationId - Population ID
     */
    updateImportProgress(current, total, message = '', counts = {}, populationName = '', populationId = '') {
        try {
            // Use the progress manager for enhanced progress handling
            progressManager.updateProgress(current, total, message, {
                ...counts,
                population: populationName,
                populationId: populationId
            });

            // Update operation stats
            if (counts.success !== undefined) progressManager.operationStats.success = counts.success;
            if (counts.failed !== undefined) progressManager.operationStats.failed = counts.failed;
            if (counts.skipped !== undefined) progressManager.operationStats.skipped = counts.skipped;
            if (counts.duplicates !== undefined) progressManager.operationStats.duplicates = counts.duplicates;

            this.logger.debug('Import progress updated', { 
                current, 
                total, 
                message: message.substring(0, 100),
                counts,
                populationName,
                populationId
            });
        } catch (error) {
            this.logger.error('Error updating import progress', { 
                error: error.message, 
                current, 
                total, 
                message 
            });
        }
    }

    /**
     * Start import operation with enhanced progress manager
     */
    startImportOperation(options = {}) {
        try {
            this.logger.info('Starting import operation', { options });
            progressManager.startOperation('import', options);
        } catch (error) {
            this.logger.error('Error starting import operation', { error: error.message, options });
        }
    }

    /**
     * Update import operation with session ID (called after backend response)
     */
    updateImportOperationWithSessionId(sessionId) {
        try {
            if (!sessionId) {
                this.logger.warn('No session ID provided for import operation update');
                return;
            }

            this.logger.info('Updating import operation with session ID', { sessionId });
            
            // Update progress manager with session ID
            if (progressManager && typeof progressManager.updateSessionId === 'function') {
                progressManager.updateSessionId(sessionId);
            } else {
                this.logger.warn('Progress manager not available for session ID update');
            }
            
        } catch (error) {
            this.logger.error('Error updating import operation with session ID', { error: error.message, sessionId });
        }
    }

    /**
     * Start export operation with progress manager
     * 
     * @param {Object} options - Export options
     */
    startExportOperation(options = {}) {
        try {
            progressManager.startOperation('export', options);
            this.logger.info('Export operation started', { options });
        } catch (error) {
            this.logger.error('Error starting export operation', { 
                error: error.message, 
                options 
            });
        }
    }

    /**
     * Start delete operation with progress manager
     * 
     * @param {Object} options - Delete options
     */
    startDeleteOperation(options = {}) {
        try {
            progressManager.startOperation('delete', options);
            this.logger.info('Delete operation started', { options });
        } catch (error) {
            this.logger.error('Error starting delete operation', { 
                error: error.message, 
                options 
            });
        }
    }

    /**
     * Start modify operation with progress manager
     * 
     * @param {Object} options - Modify options
     */
    startModifyOperation(options = {}) {
        try {
            progressManager.startOperation('modify', options);
            this.logger.info('Modify operation started', { options });
        } catch (error) {
            this.logger.error('Error starting modify operation', { 
                error: error.message, 
                options 
            });
        }
    }

    /**
     * Complete current operation
     * 
     * @param {Object} results - Operation results
     */
    completeOperation(results = {}) {
        try {
            progressManager.completeOperation(results);
            this.logger.info('Operation completed', { results });
        } catch (error) {
            this.logger.error('Error completing operation', { 
                error: error.message, 
                results 
            });
        }
    }

    /**
     * Handle duplicate users during import
     * 
     * @param {Array} duplicates - Array of duplicate users
     * @param {Function} onDecision - Callback for user decision
     */
    handleDuplicateUsers(duplicates, onDecision) {
        try {
            progressManager.handleDuplicates(duplicates, onDecision);
            this.logger.info('Duplicate users handled', { count: duplicates.length });
        } catch (error) {
            this.logger.error('Error handling duplicate users', { 
                error: error.message, 
                duplicates 
            });
        }
    }

    /**
     * Debug log method for compatibility
     */
    debugLog(area, message) {
        if (DEBUG_MODE) {
            console.debug(`[${area}] ${message}`);
        }
    }

    /**
     * Show a status message (compatibility shim)
     * @param {string} type - Message type (success, error, warning, info)
     * @param {string} message - Main message
     * @param {string} [details] - Optional details (shown in log only)
     */
    showStatusMessage(type, message, details = '') {
        this.showStatusBar(message, type, { autoDismiss: type === 'success' || type === 'info' });
        if (details) {
            this.logger.info('Status message details', { type, message, details });
        }
    }

    /**
     * Show export status
     */
    showExportStatus() {
        try {
            this.showStatusBar('Export operation started', 'info');
            this.logger.info('Export status shown');
        } catch (error) {
            this.logger.error('Error showing export status', { error: error.message });
        }
    }

    /**
     * Update export progress
     */
    updateExportProgress(current, total, message, counts = {}) {
        try {
            progressManager.updateProgress(current, total, message, {
                ...counts,
                operation: 'export'
            });
            this.logger.debug('Export progress updated', { current, total, message });
        } catch (error) {
            this.logger.error('Error updating export progress', { error: error.message });
        }
    }

    /**
     * Show delete status
     */
    showDeleteStatus(totalUsers, populationName, populationId) {
        try {
            this.showStatusBar(`Delete operation started for ${totalUsers} users in ${populationName}`, 'warning');
            this.logger.info('Delete status shown', { totalUsers, populationName, populationId });
        } catch (error) {
            this.logger.error('Error showing delete status', { error: error.message });
        }
    }

    /**
     * Update delete progress
     */
    updateDeleteProgress(current, total, message, counts = {}, populationName = '', populationId = '') {
        try {
            progressManager.updateProgress(current, total, message, {
                ...counts,
                population: populationName,
                populationId: populationId,
                operation: 'delete'
            });
            this.logger.debug('Delete progress updated', { current, total, message, populationName });
        } catch (error) {
            this.logger.error('Error updating delete progress', { error: error.message });
        }
    }

    /**
     * Show modify status
     */
    showModifyStatus(totalUsers) {
        try {
            this.showStatusBar(`Modify operation started for ${totalUsers} users`, 'info');
            this.logger.info('Modify status shown', { totalUsers });
        } catch (error) {
            this.logger.error('Error showing modify status', { error: error.message });
        }
    }

    /**
     * Update modify progress
     */
    updateModifyProgress(current, total, message, counts = {}) {
        try {
            progressManager.updateProgress(current, total, message, {
                ...counts,
                operation: 'modify'
            });
            this.logger.debug('Modify progress updated', { current, total, message });
        } catch (error) {
            this.logger.error('Error updating modify progress', { error: error.message });
        }
    }
}

// Create and export default instance
const uiManager = new UIManager();

// Export the class and instance
export { UIManager, uiManager };
