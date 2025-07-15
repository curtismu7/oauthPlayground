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
     * Initialize UI manager and setup core functionality
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
     * @returns {Promise<void>} Promise that resolves when initialization is complete
     */
    async init() {
        this.initialize();
        return Promise.resolve();
    }
    
    /**
     * Setup UI elements and initialize core DOM references
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
     * @param {string} message - The message to display
     * @param {string} type - Message type: info, success, warning, error
     * @param {Object} options - Additional options for display behavior
     * @param {boolean} options.autoDismiss - Whether to auto-dismiss the message
     * @param {number} options.duration - Duration in milliseconds before auto-dismiss
     */
    showStatusBar(message, type = 'info', options = {}) {
        // Status bar has been removed from the UI, so we'll just log the message
        this.logger.info('Status bar message (element removed)', { 
            type, 
            message: message.substring(0, 100), 
            autoDismiss: options.autoDismiss,
            duration: options.duration 
        });
        return;
        
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
        // Status bar has been removed from the UI, so we'll just clear any timers
        if (this.statusBarTimer) {
            clearTimeout(this.statusBarTimer);
            this.statusBarTimer = null;
        }
        
        this.logger.debug('Status bar cleared (element removed)');
    }
    
    /**
     * Show a temporary success message with auto-dismiss
     * @param {string} message - Success message to display
     * @param {string} details - Additional details (optional)
     */
    showSuccess(message, details = '') {
        this.showStatusBar(message, 'success', { 
            autoDismiss: true, 
            duration: 4000 
        });
        
        if (details) {
            this.logger.info('Success message shown', { message, details });
        }
    }
    
    /**
     * Show an error message with persistent display
     * @param {string} title - Error title
     * @param {string} message - Error message
     */
    showError(title, message) {
        const errorMessage = title && message ? `${title}: ${message}` : title || message;
        this.showStatusBar(errorMessage, 'error', { autoDismiss: false });
        this.logger.error('Error message shown', { title, message });
    }
    
    /**
     * Show a warning message with persistent display
     * @param {string} message - Warning message
     */
    showWarning(message) {
        this.showStatusBar(message, 'warning', { autoDismiss: false });
        this.logger.warn('Warning message shown', { message });
    }
    
    /**
     * Show an informational message with auto-dismiss
     * @param {string} message - Info message
     */
    showInfo(message) {
        this.showStatusBar(message, 'info', { 
            autoDismiss: true, 
            duration: 3000 
        });
        this.logger.info('Info message shown', { message });
    }
    
    /**
     * Show loading indicator with message
     * @param {string} message - Loading message to display
     */
    showLoading(message = 'Processing...') {
        this.showStatusBar(message, 'info', { autoDismiss: false });
        this.logger.debug('Loading indicator shown', { message });
    }
    
    /**
     * Hide loading indicator and optionally show success message
     * @param {string} successMessage - Optional success message to show after hiding loading
     */
    hideLoading(successMessage = null) {
        this.clearStatusBar();
        
        if (successMessage) {
            this.showSuccess(successMessage);
        }
        
        this.logger.debug('Loading indicator hidden');
    }
    
    /**
     * Update progress bar with current and total values
     * @param {number} current - Current progress value
     * @param {number} total - Total progress value
     * @param {string} message - Progress message
     */
    updateProgress(current, total, message = '') {
        console.log('🔍 [UI MANAGER DEBUG] updateProgress() called with:', { current, total, message });
        
        if (!this.progressContainer) {
            console.error('🔍 [UI MANAGER DEBUG] Progress container not found in updateProgress');
            this.logger.warn('Progress container not found');
            return;
        }
        
        console.log('🔍 [UI MANAGER DEBUG] Progress container found, calculating percentage...');
        const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
        console.log('🔍 [UI MANAGER DEBUG] Calculated percentage:', percentage);
        
        // Update progress bar
        const progressBar = this.progressContainer.querySelector('.progress-bar-fill');
        console.log('🔍 [UI MANAGER DEBUG] Progress bar element:', progressBar);
        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
            console.log('🔍 [UI MANAGER DEBUG] Progress bar updated to:', `${percentage}%`);
        } else {
            console.error('🔍 [UI MANAGER DEBUG] Progress bar element not found');
        }
        
        // Update percentage text
        const percentageElement = this.progressContainer.querySelector('.progress-percentage');
        console.log('🔍 [UI MANAGER DEBUG] Percentage element:', percentageElement);
        if (percentageElement) {
            percentageElement.textContent = `${percentage}%`;
            console.log('🔍 [UI MANAGER DEBUG] Percentage text updated to:', `${percentage}%`);
        } else {
            console.error('🔍 [UI MANAGER DEBUG] Percentage element not found');
        }
        
        // Update progress text
        const progressText = this.progressContainer.querySelector('.progress-text');
        console.log('🔍 [UI MANAGER DEBUG] Progress text element:', progressText);
        if (progressText && message) {
            progressText.textContent = message;
            console.log('🔍 [UI MANAGER DEBUG] Progress text updated to:', message);
        } else {
            console.error('🔍 [UI MANAGER DEBUG] Progress text element not found or no message');
        }
        
        this.logger.debug('Progress updated', { current, total, percentage, message });
        console.log('🔍 [UI MANAGER DEBUG] updateProgress() completed');
    }
    
    /**
     * Update token status display
     * @param {string} status - Token status (valid, expired, etc.)
     * @param {string} message - Status message
     */
    updateTokenStatus(status, message = '') {
        if (!this.tokenStatusElement) {
            this.logger.warn('Token status element not found');
            return;
        }
        
        this.tokenStatusElement.className = `token-status ${status}`;
        this.tokenStatusElement.textContent = message || status;
        
        this.logger.debug('Token status updated', { status, message });
    }
    
    /**
     * Update connection status display
     * @param {string} status - Connection status (connected, disconnected, etc.)
     * @param {string} message - Status message
     */
    updateConnectionStatus(status, message = '') {
        if (!this.connectionStatusElement) {
            this.logger.warn('Connection status element not found');
            return;
        }
        
        this.connectionStatusElement.className = `connection-status ${status}`;
        this.connectionStatusElement.textContent = message || status;
        
        this.logger.debug('Connection status updated', { status, message });
    }
    
    /**
     * Show current token status with detailed information
     * @param {Object} tokenInfo - Token information object
     */
    showCurrentTokenStatus(tokenInfo) {
        if (!tokenInfo) {
            this.logger.warn('No token info provided');
            return;
        }
        
        const { isValid, expiresAt, timeRemaining } = tokenInfo;
        
        if (!isValid) {
            this.updateTokenStatus('expired', 'Token expired');
            return;
        }
        
        const timeRemainingText = timeRemaining ? ` (${timeRemaining})` : '';
        this.updateTokenStatus('valid', `Token valid${timeRemainingText}`);
        
        this.logger.info('Current token status displayed', { 
            isValid, 
            expiresAt, 
            timeRemaining 
        });
    }
    
    /**
     * Update universal token status bar
     * @param {Object} tokenInfo - Token information object
     */
    updateUniversalTokenStatus(tokenInfo) {
        // Redirect to token-status-indicator instead of universal-token-status
        const tokenStatusBar = document.getElementById('token-status-indicator');
        if (!tokenStatusBar) {
            this.logger.warn('Token status indicator not found');
            return;
        }
        
        if (!tokenInfo) {
            tokenStatusBar.style.display = 'none';
            return;
        }
        
        const { isValid, expiresAt, timeRemaining } = tokenInfo;
        const statusContent = tokenStatusBar.querySelector('.token-status-content');
        
        if (statusContent) {
            const icon = statusContent.querySelector('.token-status-icon');
            const text = statusContent.querySelector('.token-status-text');
            const time = statusContent.querySelector('.token-status-time');
            
            if (isValid) {
                icon.textContent = '✅';
                text.textContent = 'Token valid';
                time.textContent = timeRemaining || '';
            } else {
                icon.textContent = '❌';
                text.textContent = 'Token expired';
                time.textContent = '';
            }
        }
        
        tokenStatusBar.style.display = 'block';
        this.logger.debug('Token status indicator updated', { isValid, timeRemaining });
    }
    
    /**
     * Update home page token status
     * @param {boolean} isLoading - Whether to show loading state
     * @param {string} message - Status message
     */
    updateHomeTokenStatus(isLoading = false, message = '') {
        const homeTokenStatus = document.getElementById('home-token-status');
        if (!homeTokenStatus) {
            this.logger.warn('Home token status element not found');
            return;
        }
        
        if (isLoading) {
            homeTokenStatus.innerHTML = '';
        } else {
            // Use the provided token-status-indicator markup for unavailable state, with a Get New Token button
            homeTokenStatus.innerHTML = `
                <div id="token-status-indicator" class="token-status-indicator valid" role="status" aria-live="polite" style="display: block;">
                    Token expired
                    <button id="get-token-btn" class="btn btn-sm btn-success" style="margin-left: 12px;">
                        <i class="fas fa-key"></i> Get New Token
                    </button>
                </div>
            `;
            // Wire up the button to call getNewToken if available
            const getTokenBtn = document.getElementById('get-token-btn');
            if (getTokenBtn) {
                getTokenBtn.addEventListener('click', () => {
                    if (window.tokenStatusIndicator && typeof window.tokenStatusIndicator.getNewToken === 'function') {
                        window.tokenStatusIndicator.getNewToken();
                    } else if (typeof this.getNewToken === 'function') {
                        this.getNewToken();
                    } else {
                        alert('Get New Token functionality is not available.');
                    }
                });
            }
        }
        
        homeTokenStatus.style.display = 'block';
        this.logger.debug('Home token status updated', { isLoading, message });
    }
    
    /**
     * Update settings save status with message and type
     * @param {string} message - Status message
     * @param {string} type - Message type (success, error, warning, info)
     */
    updateSettingsSaveStatus(message, type = 'info') {
        const settingsStatus = document.querySelector('.settings-save-status');
        if (!settingsStatus) {
            this.logger.warn('Settings save status element not found');
            return;
        }
        
        // Update classes
        settingsStatus.className = `settings-save-status ${type} show`;
        
        // Create simple HTML structure with text on the left, icon on the right
        const iconClass = this.getStatusIcon(type);
        settingsStatus.innerHTML = `
            <span>${message}</span>
            <i class="fas ${iconClass}"></i>
        `;
        
        // Auto-hide success messages after 3 seconds
        if (type === 'success') {
            setTimeout(() => {
                settingsStatus.classList.remove('show');
            }, 3000);
        }
        
        this.logger.info('Settings save status updated', { message, type });
    }
    
    /**
     * Show settings action status with enhanced options
     * @param {string} message - Status message
     * @param {string} type - Message type (success, error, warning, info)
     * @param {Object} options - Additional display options
     * @param {boolean} options.autoDismiss - Whether to auto-dismiss
     * @param {number} options.duration - Duration before auto-dismiss
     */
    showSettingsActionStatus(message, type = 'info', options = {}) {
        const settingsActionStatus = document.getElementById('settings-action-status');
        if (!settingsActionStatus) {
            this.logger.warn('Settings action status element not found');
            return;
        }
        
        // Clear existing content
        settingsActionStatus.innerHTML = '';
        settingsActionStatus.className = `settings-action-status ${type}`;
        
        // Create status content
        const statusContent = document.createElement('div');
        statusContent.className = 'status-content';
        
        const text = document.createElement('span');
        text.textContent = message;
        statusContent.appendChild(text);
        
        const icon = document.createElement('i');
        icon.className = `fas ${this.getStatusIcon(type)}`;
        statusContent.appendChild(icon);
        
        settingsActionStatus.appendChild(statusContent);
        settingsActionStatus.style.display = 'block';
        
        // No auto-dismiss for any type
        this.logger.info('Settings action status shown', { message, type, autoDismiss: false });
    }
    
    /**
     * Get appropriate icon class for status type
     * @param {string} type - Status type
     * @returns {string} Icon class name
     */
    getStatusIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-times-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }
    
    /**
     * Hide settings action status
     */
    hideSettingsActionStatus() {
        const settingsActionStatus = document.getElementById('settings-action-status');
        if (settingsActionStatus) {
            settingsActionStatus.style.display = 'none';
            this.logger.debug('Settings action status hidden');
        }
    }
    
    /**
     * Show import status with operation details
     * @param {string} status - Import status
     * @param {string} message - Status message
     * @param {Object} details - Additional details
     */
    showImportStatus(status, message = '', details = {}) {
        const importStatus = document.getElementById('import-status');
        if (!importStatus) {
            this.logger.warn('Import status element not found');
            return;
        }
        
        importStatus.style.display = 'block';
        importStatus.className = `import-status ${status}`;
        
        const statusText = importStatus.querySelector('.status-text');
        if (statusText) {
            statusText.textContent = message || status;
        }
        
        this.logger.info('Import status shown', { status, message, details });
    }
    
    /**
     * Clear all notifications from the UI
     */
    clearNotifications() {
        if (this.notificationContainer) {
            this.notificationContainer.innerHTML = '';
            this.logger.debug('All notifications cleared');
        }
        
        this.clearStatusBar();
    }
    
    /**
     * Hide progress display
     */
    hideProgress() {
        if (this.progressContainer) {
            this.progressContainer.style.display = 'none';
            this.logger.debug('Progress display hidden');
        }
    }
    
    /**
     * Show progress section with enhanced debugging and fallback mechanisms
     */
    showProgress() {
        console.log('🔍 [UI MANAGER DEBUG] showProgress() called');
        console.log('🔍 [UI MANAGER DEBUG] this.progressContainer:', this.progressContainer);
        
        // Try multiple ways to get the progress container
        let progressContainer = this.progressContainer;
        
        if (!progressContainer) {
            console.log('🔍 [UI MANAGER DEBUG] Progress container not found in UI manager, trying direct access...');
            progressContainer = document.getElementById('progress-container');
        }
        
        if (!progressContainer) {
            console.log('🔍 [UI MANAGER DEBUG] Progress container not found by ID, trying ElementRegistry...');
            if (typeof ElementRegistry !== 'undefined' && ElementRegistry.progressContainer) {
                progressContainer = ElementRegistry.progressContainer();
            }
        }
        
        if (!progressContainer) {
            console.log('🔍 [UI MANAGER DEBUG] Progress container not found by ElementRegistry, trying class selector...');
            progressContainer = document.querySelector('.progress-container');
        }
        
        if (!progressContainer) {
            console.error('🔍 [UI MANAGER DEBUG] Progress container not found by any method');
            console.error('🔍 [UI MANAGER DEBUG] Available containers with "progress" in ID:', 
                Array.from(document.querySelectorAll('[id*="progress"]')).map(el => el.id));
            console.error('🔍 [UI MANAGER DEBUG] Available containers with "progress" in class:', 
                Array.from(document.querySelectorAll('[class*="progress"]')).map(el => ({ id: el.id, className: el.className })));
            return;
        }
        
        console.log('🔍 [UI MANAGER DEBUG] Progress container found, showing...');
        console.log('🔍 [UI MANAGER DEBUG] Current display style:', progressContainer.style.display);
        console.log('🔍 [UI MANAGER DEBUG] Current visibility:', progressContainer.offsetParent !== null ? 'visible' : 'hidden');
        
        // Force show the progress container
        progressContainer.style.display = 'block';
        progressContainer.style.visibility = 'visible';
        progressContainer.style.opacity = '1';
        
        // Ensure it's not hidden by CSS
        progressContainer.classList.remove('hidden', 'd-none');
        progressContainer.classList.add('visible');
        
        // Force layout recalculation
        progressContainer.offsetHeight;
        
        console.log('🔍 [UI MANAGER DEBUG] Display style after setting to block:', progressContainer.style.display);
        console.log('🔍 [UI MANAGER DEBUG] Container visibility:', progressContainer.offsetParent !== null ? 'visible' : 'hidden');
        console.log('🔍 [UI MANAGER DEBUG] Container dimensions:', {
            offsetWidth: progressContainer.offsetWidth,
            offsetHeight: progressContainer.offsetHeight,
            clientWidth: progressContainer.clientWidth,
            clientHeight: progressContainer.clientHeight
        });
        
        // Scroll into view if needed
        if (progressContainer.offsetParent !== null) {
            progressContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        // Update UI manager's reference
        this.progressContainer = progressContainer;
        
        this.logger.debug('Progress display shown');
        
        // Additional verification
        setTimeout(() => {
            const isVisible = progressContainer.offsetParent !== null;
            const rect = progressContainer.getBoundingClientRect();
            console.log('🔍 [UI MANAGER DEBUG] Final verification:', {
                isVisible,
                dimensions: { width: rect.width, height: rect.height },
                display: progressContainer.style.display,
                computedDisplay: window.getComputedStyle(progressContainer).display
            });
        }, 100);
    }
    
    /**
     * Set button loading state
     * @param {string} buttonId - Button element ID
     * @param {boolean} isLoading - Whether to show loading state
     */
    setButtonLoading(buttonId, isLoading) {
        const button = document.getElementById(buttonId);
        if (!button) {
            // Don't log warning for buttons that are intentionally hidden or optional
            if (buttonId === 'get-token-quick') {
                this.logger.debug(`Button with ID '${buttonId}' not found (may be hidden)`);
            } else {
                this.logger.warn(`Button with ID '${buttonId}' not found`);
            }
            return;
        }
        
        if (isLoading) {
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
            button.classList.add('loading');
        } else {
            button.disabled = false;
            button.innerHTML = button.getAttribute('data-original-text') || 'Submit';
            button.classList.remove('loading');
        }
        
        this.logger.debug('Button loading state updated', { buttonId, isLoading });
    }
    
    /**
     * Update population dropdown fields with available populations
     * @param {Array} populations - Array of population objects
     */
    updatePopulationFields(populations) {
        if (!populations || !Array.isArray(populations)) {
            this.logger.warn('Invalid populations data provided');
            return;
        }
        
        const populationSelects = document.querySelectorAll('select[id*="population"]');
        
        populationSelects.forEach(select => {
            // Store current selection
            const currentValue = select.value;
            
            // Clear existing options
            select.innerHTML = '';
            
            // Add default option
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = 'Select a population...';
            select.appendChild(defaultOption);
            
            // Add population options
            populations.forEach(population => {
                const option = document.createElement('option');
                option.value = population.id;
                option.textContent = population.name;
                select.appendChild(option);
            });
            
            // Restore selection if it still exists
            if (currentValue && select.querySelector(`option[value="${currentValue}"]`)) {
                select.value = currentValue;
            }
        });
        
        this.logger.info('Population fields updated', { 
            populationCount: populations.length,
            selectCount: populationSelects.length 
        });
    }
    
    /**
     * Show notification with enhanced options
     * @param {string} title - Notification title
     * @param {string} message - Notification message
     * @param {string} type - Notification type (success, error, warning, info)
     * @param {Object} options - Additional display options
     * @param {boolean} options.autoDismiss - Whether to auto-dismiss
     * @param {number} options.duration - Duration before auto-dismiss
     */
    showNotification(title, message, type = 'info', options = {}) {
        if (!this.notificationContainer) {
            this.logger.warn('Notification container not found');
            return;
        }
        
        // Clear existing content
        this.notificationContainer.innerHTML = '';
        
        // Create status header content
        const statusContent = document.createElement('div');
        statusContent.className = 'status-content';
        
        // Add icon
        const icon = document.createElement('i');
        icon.className = `fas ${this.getStatusIcon(type)}`;
        statusContent.appendChild(icon);
        
        // Add text
        const text = document.createElement('span');
        if (title && message) {
            text.textContent = `${title}: ${message}`;
        } else {
            text.textContent = title || message;
        }
        statusContent.appendChild(text);
        
        // Add to container
        this.notificationContainer.appendChild(statusContent);
        
        // Auto-dismiss if specified (but keep persistent for success messages)
        const shouldAutoDismiss = options.autoDismiss !== false && type !== 'error' && type !== 'success';
        if (shouldAutoDismiss) {
            const duration = options.duration || 5000;
            setTimeout(() => {
                if (this.notificationContainer && this.notificationContainer.contains(statusContent)) {
                    this.notificationContainer.innerHTML = '';
                }
            }, duration);
        }
        
        this.logger.info('Status header updated', { title, message, type, autoDismiss: shouldAutoDismiss });
    }
    
    /**
     * Update import progress with detailed statistics
     * @param {number} current - Current progress value
     * @param {number} total - Total progress value
     * @param {string} message - Progress message
     * @param {Object} counts - Statistics counts
     * @param {number} counts.processed - Number of processed items
     * @param {number} counts.success - Number of successful items
     * @param {number} counts.failed - Number of failed items
     * @param {number} counts.skipped - Number of skipped items
     * @param {string} populationName - Population name
     * @param {string} populationId - Population ID
     */
    updateImportProgress(current, total, message = '', counts = {}, populationName = '', populationId = '') {
        // Update main progress
        this.updateProgress(current, total, message);
        
        // Update statistics if provided
        if (counts && typeof counts === 'object') {
            Object.entries(counts).forEach(([key, value]) => {
                const statElement = document.querySelector(`.stat-value.${key}`);
                if (statElement) {
                    statElement.textContent = value || 0;
                }
            });
        }
        
        // Update population information if provided
        if (populationName || populationId) {
            const populationElement = document.querySelector('.detail-value.population-info');
            if (populationElement) {
                populationElement.textContent = populationName || populationId || 'Unknown';
            }
        }
        
        this.logger.debug('Import progress updated', { 
            current, 
            total, 
            message, 
            counts, 
            populationName, 
            populationId 
        });
    }
    
    /**
     * Start import operation with progress tracking
     * @param {Object} options - Operation options
     * @param {string} options.operationType - Type of operation
     * @param {number} options.totalUsers - Total number of users
     * @param {string} options.populationName - Population name
     * @param {string} options.populationId - Population ID
     */
    startImportOperation(options = {}) {
        console.log('🔍 [UI MANAGER DEBUG] startImportOperation() called with options:', options);
        
        const { operationType, totalUsers, populationName, populationId } = options;
        
        console.log('🔍 [UI MANAGER DEBUG] About to call showProgress()...');
        this.showProgress();
        console.log('🔍 [UI MANAGER DEBUG] showProgress() completed');
        
        console.log('🔍 [UI MANAGER DEBUG] About to call updateProgress()...');
        this.updateProgress(0, totalUsers || 0, 'Starting import operation...');
        console.log('🔍 [UI MANAGER DEBUG] updateProgress() completed');
        
        // Update operation details
        const operationTypeElement = document.querySelector('.detail-value.operation-type');
        console.log('🔍 [UI MANAGER DEBUG] Operation type element:', operationTypeElement);
        if (operationTypeElement) {
            operationTypeElement.textContent = operationType || 'Import';
            console.log('🔍 [UI MANAGER DEBUG] Operation type updated to:', operationType || 'Import');
        } else {
            console.error('🔍 [UI MANAGER DEBUG] Operation type element not found');
        }
        
        this.logger.info('Import operation started', { operationType, totalUsers, populationName, populationId });
        console.log('🔍 [UI MANAGER DEBUG] startImportOperation() completed');
    }
    
    /**
     * Update import operation with session ID
     * @param {string} sessionId - Session ID for tracking
     */
    updateImportOperationWithSessionId(sessionId) {
        if (!sessionId) {
            this.logger.warn('No session ID provided for import operation');
            return;
        }
        
        const sessionElement = document.querySelector('.detail-value.session-id');
        if (sessionElement) {
            sessionElement.textContent = sessionId;
        }
        
        this.logger.info('Import operation session ID updated', { sessionId });
    }
    
    /**
     * Start export operation with progress tracking
     * @param {Object} options - Operation options
     * @param {number} options.totalUsers - Total number of users
     * @param {string} options.populationName - Population name
     */
    startExportOperation(options = {}) {
        const { totalUsers, populationName } = options;
        
        this.showProgress();
        this.updateProgress(0, totalUsers || 0, 'Starting export operation...');
        
        const operationTypeElement = document.querySelector('.detail-value.operation-type');
        if (operationTypeElement) {
            operationTypeElement.textContent = 'Export';
        }
        
        this.logger.info('Export operation started', { totalUsers, populationName });
    }
    
    /**
     * Start delete operation with progress tracking
     * @param {Object} options - Operation options
     * @param {number} options.totalUsers - Total number of users
     * @param {string} options.populationName - Population name
     */
    startDeleteOperation(options = {}) {
        const { totalUsers, populationName } = options;
        
        this.showProgress();
        this.updateProgress(0, totalUsers || 0, 'Starting delete operation...');
        
        const operationTypeElement = document.querySelector('.detail-value.operation-type');
        if (operationTypeElement) {
            operationTypeElement.textContent = 'Delete';
        }
        
        this.logger.info('Delete operation started', { totalUsers, populationName });
    }
    
    /**
     * Start modify operation with progress tracking
     * @param {Object} options - Operation options
     * @param {number} options.totalUsers - Total number of users
     * @param {string} options.populationName - Population name
     */
    startModifyOperation(options = {}) {
        const { totalUsers, populationName } = options;
        
        this.showProgress();
        this.updateProgress(0, totalUsers || 0, 'Starting modify operation...');
        
        const operationTypeElement = document.querySelector('.detail-value.operation-type');
        if (operationTypeElement) {
            operationTypeElement.textContent = 'Modify';
        }
        
        this.logger.info('Modify operation started', { totalUsers, populationName });
    }
    
    /**
     * Complete operation with results
     * @param {Object} results - Operation results
     * @param {number} results.processed - Number of processed items
     * @param {number} results.success - Number of successful items
     * @param {number} results.failed - Number of failed items
     * @param {number} results.skipped - Number of skipped items
     */
    completeOperation(results = {}) {
        const { processed, success, failed, skipped } = results;
        
        this.updateProgress(processed || 0, processed || 0, 'Operation completed');
        
        // Show completion message
        const message = `Operation completed: ${success || 0} successful, ${failed || 0} failed, ${skipped || 0} skipped`;
        this.showSuccess(message);
        
        // Hide progress after delay
        setTimeout(() => {
            this.hideProgress();
        }, 2000);
        
        this.logger.info('Operation completed', { processed, success, failed, skipped });
    }
    
    /**
     * Handle duplicate users with decision callback
     * @param {Array} duplicates - Array of duplicate user objects
     * @param {Function} onDecision - Callback function for user decision
     */
    handleDuplicateUsers(duplicates, onDecision) {
        if (!duplicates || duplicates.length === 0) {
            this.logger.warn('No duplicates provided for handling');
            return;
        }
        
        const message = `Found ${duplicates.length} duplicate users. How would you like to proceed?`;
        this.showWarning(message);
        
        // In a real implementation, you would show a modal or dialog here
        // For now, we'll just log the decision
        this.logger.info('Duplicate users found', { count: duplicates.length });
        
        if (onDecision && typeof onDecision === 'function') {
            onDecision('skip'); // Default to skip
        }
    }
    
    /**
     * Debug logging for development
     * @param {string} area - Debug area
     * @param {string} message - Debug message
     */
    debugLog(area, message) {
        if (DEBUG_MODE) {
            this.logger.debug(`[${area}] ${message}`);
        }
    }
    
    /**
     * Show status message with type
     * @param {string} type - Message type
     * @param {string} message - Message content
     * @param {string} details - Additional details
     */
    showStatusMessage(type, message, details = '') {
        const fullMessage = details ? `${message}: ${details}` : message;
        this.showNotification('Status Update', fullMessage, type);
    }
    
    /**
     * Show export status
     */
    showExportStatus() {
        this.showProgress();
        this.updateProgress(0, 100, 'Preparing export...');
        this.logger.info('Export status shown');
    }
    
    /**
     * Update export progress
     * @param {number} current - Current progress
     * @param {number} total - Total progress
     * @param {string} message - Progress message
     * @param {Object} counts - Statistics counts
     */
    updateExportProgress(current, total, message, counts = {}) {
        this.updateProgress(current, total, message);
        
        // Update export-specific statistics
        if (counts && typeof counts === 'object') {
            Object.entries(counts).forEach(([key, value]) => {
                const statElement = document.querySelector(`.stat-value.${key}`);
                if (statElement) {
                    statElement.textContent = value || 0;
                }
            });
        }
        
        this.logger.debug('Export progress updated', { current, total, message, counts });
    }
    
    /**
     * Show delete status
     * @param {number} totalUsers - Total number of users
     * @param {string} populationName - Population name
     * @param {string} populationId - Population ID
     */
    showDeleteStatus(totalUsers, populationName, populationId) {
        this.showProgress();
        this.updateProgress(0, totalUsers || 0, 'Preparing delete operation...');
        
        const operationTypeElement = document.querySelector('.detail-value.operation-type');
        if (operationTypeElement) {
            operationTypeElement.textContent = 'Delete';
        }
        
        this.logger.info('Delete status shown', { totalUsers, populationName, populationId });
    }
    
    /**
     * Update delete progress
     * @param {number} current - Current progress
     * @param {number} total - Total progress
     * @param {string} message - Progress message
     * @param {Object} counts - Statistics counts
     * @param {string} populationName - Population name
     * @param {string} populationId - Population ID
     */
    updateDeleteProgress(current, total, message, counts = {}, populationName = '', populationId = '') {
        this.updateProgress(current, total, message);
        
        // Update delete-specific statistics
        if (counts && typeof counts === 'object') {
            Object.entries(counts).forEach(([key, value]) => {
                const statElement = document.querySelector(`.stat-value.${key}`);
                if (statElement) {
                    statElement.textContent = value || 0;
                }
            });
        }
        
        this.logger.debug('Delete progress updated', { 
            current, 
            total, 
            message, 
            counts, 
            populationName, 
            populationId 
        });
    }
    
    /**
     * Show modify status
     * @param {number} totalUsers - Total number of users
     */
    showModifyStatus(totalUsers) {
        this.showProgress();
        this.updateProgress(0, totalUsers || 0, 'Preparing modify operation...');
        
        const operationTypeElement = document.querySelector('.detail-value.operation-type');
        if (operationTypeElement) {
            operationTypeElement.textContent = 'Modify';
        }
        
        this.logger.info('Modify status shown', { totalUsers });
    }
    
    /**
     * Update modify progress
     * @param {number} current - Current progress
     * @param {number} total - Total progress
     * @param {string} message - Progress message
     * @param {Object} counts - Statistics counts
     */
    updateModifyProgress(current, total, message, counts = {}) {
        this.updateProgress(current, total, message);
        
        // Update modify-specific statistics
        if (counts && typeof counts === 'object') {
            Object.entries(counts).forEach(([key, value]) => {
                const statElement = document.querySelector(`.stat-value.${key}`);
                if (statElement) {
                    statElement.textContent = value || 0;
                }
            });
        }
        
        this.logger.debug('Modify progress updated', { current, total, message, counts });
    }
}

// Export the UIManager class
export { UIManager };
