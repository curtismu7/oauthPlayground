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
     * Setup UI elements
     */
    setupElements() {
        this.notificationContainer = document.getElementById('notification-container');
        this.progressContainer = document.getElementById('progress-container');
        this.tokenStatusElement = document.getElementById('token-status');
        this.connectionStatusElement = document.getElementById('connection-status');
        
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
            hasConnectionStatusElement: !!this.connectionStatusElement
        });
    }
    
    /**
     * Show notification with Winston logging
     */
    showNotification(message, type = 'info', duration = 5000) {
        try {
            this.logger.info('Showing notification', { message, type, duration });
            
            if (!this.notificationContainer) {
                this.logger.warn('Notification container not found, cannot show notification');
                return;
            }
            
            const notification = document.createElement('div');
            notification.className = `notification ${type}`;
            notification.textContent = message;
            
            // Add close button
            const closeButton = document.createElement('button');
            closeButton.className = 'notification-close';
            closeButton.innerHTML = '&times;';
            closeButton.onclick = () => this.removeNotification(notification);
            notification.appendChild(closeButton);
            
            this.notificationContainer.appendChild(notification);
            
            // Auto-remove after duration
            if (duration > 0) {
                setTimeout(() => this.removeNotification(notification), duration);
            }
            
            this.logger.debug('Notification displayed', { 
                message: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
                type,
                duration
            });
            
        } catch (error) {
            this.logger.error('Error showing notification', { error: error.message, message, type });
        }
    }
    
    /**
     * Remove notification
     */
    removeNotification(notification) {
        try {
            if (notification && notification.parentNode) {
                notification.parentNode.removeChild(notification);
                this.logger.debug('Notification removed');
            }
        } catch (error) {
            this.logger.error('Error removing notification', { error: error.message });
        }
    }
    
    /**
     * Show success notification
     */
    showSuccess(message, details = '') {
        this.showNotification(message, 'success');
        if (details) {
            this.logger.info('Success notification with details', { message, details });
        }
    }
    
    /**
     * Show error notification
     */
    showError(title, message) {
        this.showNotification(`${title}: ${message}`, 'error');
        this.logger.error('Error notification shown', { title, message });
    }
    
    /**
     * Show warning notification
     */
    showWarning(message) {
        this.showNotification(message, 'warning');
        this.logger.warn('Warning notification shown', { message });
    }
    
    /**
     * Show info notification
     */
    showInfo(message) {
        this.showNotification(message, 'info');
        this.logger.info('Info notification shown', { message });
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
            
            const statusElement = document.getElementById('current-token-status');
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
            
            const universalStatusBar = document.getElementById('universal-token-status');
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
            
            const homeTokenStatus = document.getElementById('home-token-status');
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
            
            const saveStatusElement = document.getElementById('settings-save-status');
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
     * Show import status with Winston logging
     */
    showImportStatus(status, message = '', details = {}) {
        try {
            this.logger.info('Import status shown', { status, message, details });
            
            const statusElement = document.getElementById('import-status');
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
}

// Create and export default instance
const uiManager = new UIManager();

// Export the class and instance
export { UIManager, uiManager };
