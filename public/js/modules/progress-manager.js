/**
 * Progress Manager Module
 * 
 * Production-ready progress UI system with real-time updates for all operations:
 * - Import, Export, Delete, Modify
 * - Non-blocking UI updates
 * - Responsive controls
 * - Enhanced import logic with duplicate handling
 * - Modern progress indicators
 * 
 * Features:
 * - Real-time progress updates via SSE
 * - Responsive progress bars and status indicators
 * - Operation-specific progress tracking
 * - Duplicate user handling with user choice
 * - Error handling and recovery
 * - Production-ready logging
 */

import { createWinstonLogger } from './winston-logger.js';
import { ElementRegistry } from './element-registry.js';

// Enable debug mode for development (set to false in production)
const DEBUG_MODE = process.env.NODE_ENV !== 'production';

/**
 * Progress Manager Class
 * 
 * Manages all progress-related UI updates and operation tracking
 */
class ProgressManager {
    constructor() {
        // Initialize Winston logger
        this.logger = createWinstonLogger({
            service: 'pingone-progress',
            environment: process.env.NODE_ENV || 'development'
        });

        // Operation state tracking
        this.currentOperation = null;
        this.operationStartTime = null;
        this.operationStats = {
            processed: 0,
            total: 0,
            success: 0,
            failed: 0,
            skipped: 0,
            duplicates: 0
        };

        // Progress UI elements
        this.progressContainer = null;
        this.progressBar = null;
        this.progressText = null;
        this.progressDetails = null;
        this.operationStatus = null;
        this.cancelButton = null;

        // Duplicate handling
        this.duplicateUsers = [];
        this.duplicateHandlingMode = 'skip'; // 'skip', 'add', 'prompt'

        // Event listeners
        this.onProgressUpdate = null;
        this.onOperationComplete = null;
        this.onOperationCancel = null;

        // Initialize
        this.initialize();
    }

    /**
     * Initialize the progress manager
     */
    initialize() {
        try {
            this.setupElements();
            this.setupEventListeners();
            this.logger.info('Progress manager initialized successfully');
        } catch (error) {
            this.logger.error('Failed to initialize progress manager', { error: error.message });
        }
    }

    /**
     * Setup DOM elements
     */
    setupElements() {
        try {
            // Main progress container
            this.progressContainer = document.getElementById('progress-container') || 
                                   this.createProgressContainer();

            // Progress bar
            this.progressBar = this.progressContainer.querySelector('.progress-bar-fill') ||
                              this.createProgressBar();

            // Progress text
            this.progressText = this.progressContainer.querySelector('.progress-text') ||
                               this.createProgressText();

            // Progress details
            this.progressDetails = this.progressContainer.querySelector('.progress-details') ||
                                  this.createProgressDetails();

            // Operation status
            this.operationStatus = this.progressContainer.querySelector('.operation-status') ||
                                  this.createOperationStatus();

            // Cancel button
            this.cancelButton = this.progressContainer.querySelector('.cancel-operation') ||
                               this.createCancelButton();

            this.logger.debug('Progress elements setup completed');
        } catch (error) {
            this.logger.error('Error setting up progress elements', { error: error.message });
        }
    }

    /**
     * Create progress container if it doesn't exist
     */
    createProgressContainer() {
        const container = document.createElement('div');
        container.id = 'progress-container';
        container.className = 'progress-container';
        container.style.display = 'none';
        
        container.innerHTML = `
            <div class="progress-header">
                <h3 class="operation-title">Operation in Progress</h3>
                <button class="cancel-operation" type="button">Cancel</button>
            </div>
            <div class="progress-content">
                <div class="progress-bar">
                    <div class="progress-bar-fill"></div>
                </div>
                <div class="progress-text">Preparing...</div>
                <div class="progress-details"></div>
                <div class="operation-status"></div>
            </div>
            <div class="duplicate-handling" style="display: none;">
                <h4>Duplicate Users Found</h4>
                <div class="duplicate-options">
                    <label>
                        <input type="radio" name="duplicate-handling" value="skip" checked>
                        Skip duplicates
                    </label>
                    <label>
                        <input type="radio" name="duplicate-handling" value="add">
                        Add to PingOne
                    </label>
                </div>
                <div class="duplicate-list"></div>
            </div>
        `;

        document.body.appendChild(container);
        return container;
    }

    /**
     * Create progress bar element
     */
    createProgressBar() {
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar-fill';
        progressBar.style.width = '0%';
        return progressBar;
    }

    /**
     * Create progress text element
     */
    createProgressText() {
        const progressText = document.createElement('div');
        progressText.className = 'progress-text';
        progressText.textContent = 'Preparing...';
        return progressText;
    }

    /**
     * Create progress details element
     */
    createProgressDetails() {
        const progressDetails = document.createElement('div');
        progressDetails.className = 'progress-details';
        return progressDetails;
    }

    /**
     * Create operation status element
     */
    createOperationStatus() {
        const operationStatus = document.createElement('div');
        operationStatus.className = 'operation-status';
        return operationStatus;
    }

    /**
     * Create cancel button element
     */
    createCancelButton() {
        const cancelButton = document.createElement('button');
        cancelButton.className = 'cancel-operation';
        cancelButton.type = 'button';
        cancelButton.textContent = 'Cancel';
        return cancelButton;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        try {
            // Cancel button
            if (this.cancelButton) {
                this.cancelButton.addEventListener('click', () => {
                    this.cancelOperation();
                });
            }

            // Duplicate handling radio buttons
            const duplicateRadios = this.progressContainer.querySelectorAll('input[name="duplicate-handling"]');
            duplicateRadios.forEach(radio => {
                radio.addEventListener('change', (e) => {
                    this.duplicateHandlingMode = e.target.value;
                    this.logger.debug('Duplicate handling mode changed', { mode: this.duplicateHandlingMode });
                });
            });

            this.logger.debug('Progress event listeners setup completed');
        } catch (error) {
            this.logger.error('Error setting up progress event listeners', { error: error.message });
        }
    }

    /**
     * Start a new operation
     * 
     * @param {string} operationType - Type of operation (import, export, delete, modify)
     * @param {Object} options - Operation options
     */
    startOperation(operationType, options = {}) {
        try {
            this.currentOperation = {
                type: operationType,
                startTime: Date.now(),
                options: options
            };

            this.operationStartTime = Date.now();
            this.resetOperationStats();
            this.showProgress();
            this.updateOperationTitle(operationType);
            this.updateProgress(0, options.total || 0, 'Preparing operation...');

            this.logger.info('Operation started', { 
                type: operationType, 
                options: options 
            });

            // Trigger progress update callback
            if (this.onProgressUpdate) {
                this.onProgressUpdate({
                    type: 'start',
                    operation: operationType,
                    options: options
                });
            }
        } catch (error) {
            this.logger.error('Error starting operation', { 
                error: error.message, 
                operationType, 
                options 
            });
        }
    }

    /**
     * Update progress
     * 
     * @param {number} current - Current progress
     * @param {number} total - Total items
     * @param {string} message - Progress message
     * @param {Object} details - Additional details
     */
    updateProgress(current, total, message = '', details = {}) {
        try {
            const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
            
            // Update progress bar
            if (this.progressBar) {
                this.progressBar.style.width = `${percentage}%`;
                this.progressBar.setAttribute('aria-valuenow', current);
                this.progressBar.setAttribute('aria-valuemax', total);
            }

            // Update progress text
            if (this.progressText) {
                this.progressText.textContent = message || `${current} of ${total} (${percentage}%)`;
            }

            // Update progress details
            if (this.progressDetails && Object.keys(details).length > 0) {
                this.updateProgressDetails(details);
            }

            // Update operation stats
            this.operationStats.processed = current;
            this.operationStats.total = total;

            this.logger.debug('Progress updated', { 
                current, 
                total, 
                percentage, 
                message: message.substring(0, 100) 
            });

            // Trigger progress update callback
            if (this.onProgressUpdate) {
                this.onProgressUpdate({
                    type: 'progress',
                    current,
                    total,
                    percentage,
                    message,
                    details
                });
            }
        } catch (error) {
            this.logger.error('Error updating progress', { 
                error: error.message, 
                current, 
                total, 
                message 
            });
        }
    }

    /**
     * Update progress details
     * 
     * @param {Object} details - Progress details
     */
    updateProgressDetails(details) {
        try {
            if (!this.progressDetails) return;

            const detailsHTML = Object.entries(details)
                .map(([key, value]) => {
                    const label = key.charAt(0).toUpperCase() + key.slice(1);
                    return `<div class="detail-item">
                        <span class="detail-label">${label}:</span>
                        <span class="detail-value">${value}</span>
                    </div>`;
                })
                .join('');

            this.progressDetails.innerHTML = detailsHTML;
        } catch (error) {
            this.logger.error('Error updating progress details', { 
                error: error.message, 
                details 
            });
        }
    }

    /**
     * Handle duplicate users during import
     * 
     * @param {Array} duplicates - Array of duplicate users
     * @param {Function} onDecision - Callback for user decision
     */
    handleDuplicates(duplicates, onDecision) {
        try {
            this.duplicateUsers = duplicates;
            
            const duplicateHandling = this.progressContainer.querySelector('.duplicate-handling');
            const duplicateList = this.progressContainer.querySelector('.duplicate-list');
            
            if (duplicateHandling && duplicateList) {
                // Show duplicate handling section
                duplicateHandling.style.display = 'block';
                
                // Populate duplicate list
                const duplicateHTML = duplicates.map(user => `
                    <div class="duplicate-user">
                        <span class="user-name">${user.username || user.email}</span>
                        <span class="user-email">${user.email}</span>
                        <span class="duplicate-reason">${user.reason || 'Already exists'}</span>
                    </div>
                `).join('');
                
                duplicateList.innerHTML = duplicateHTML;
                
                // Add decision button
                const decisionButton = document.createElement('button');
                decisionButton.className = 'duplicate-decision-btn';
                decisionButton.textContent = 'Continue with Selection';
                decisionButton.addEventListener('click', () => {
                    const selectedMode = this.progressContainer.querySelector('input[name="duplicate-handling"]:checked').value;
                    duplicateHandling.style.display = 'none';
                    onDecision(selectedMode, duplicates);
                });
                
                duplicateHandling.appendChild(decisionButton);
            }

            this.logger.info('Duplicate users handled', { 
                count: duplicates.length,
                mode: this.duplicateHandlingMode 
            });
        } catch (error) {
            this.logger.error('Error handling duplicates', { 
                error: error.message, 
                duplicates 
            });
        }
    }

    /**
     * Update operation status
     * 
     * @param {string} status - Operation status
     * @param {string} message - Status message
     */
    updateOperationStatus(status, message = '') {
        try {
            if (this.operationStatus) {
                this.operationStatus.className = `operation-status ${status}`;
                this.operationStatus.textContent = message || status;
            }

            this.logger.info('Operation status updated', { status, message });
        } catch (error) {
            this.logger.error('Error updating operation status', { 
                error: error.message, 
                status, 
                message 
            });
        }
    }

    /**
     * Complete operation
     * 
     * @param {Object} results - Operation results
     */
    completeOperation(results = {}) {
        try {
            const duration = Date.now() - this.operationStartTime;
            const durationText = this.formatDuration(duration);

            this.updateOperationStatus('complete', `Operation completed in ${durationText}`);
            this.updateProgress(this.operationStats.total, this.operationStats.total, 'Operation completed');

            // Show completion details
            if (this.progressDetails) {
                const completionHTML = `
                    <div class="completion-summary">
                        <div class="summary-item">
                            <span class="summary-label">Duration:</span>
                            <span class="summary-value">${durationText}</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">Processed:</span>
                            <span class="summary-value">${this.operationStats.processed}</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">Success:</span>
                            <span class="summary-value success">${this.operationStats.success}</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">Failed:</span>
                            <span class="summary-value error">${this.operationStats.failed}</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">Skipped:</span>
                            <span class="summary-value warning">${this.operationStats.skipped}</span>
                        </div>
                    </div>
                `;
                this.progressDetails.innerHTML = completionHTML;
            }

            this.logger.info('Operation completed', { 
                duration,
                stats: this.operationStats,
                results 
            });

            // Trigger completion callback
            if (this.onOperationComplete) {
                this.onOperationComplete({
                    type: 'complete',
                    duration,
                    stats: this.operationStats,
                    results
                });
            }

            // Auto-hide after delay
            setTimeout(() => {
                this.hideProgress();
            }, 5000);
        } catch (error) {
            this.logger.error('Error completing operation', { 
                error: error.message, 
                results 
            });
        }
    }

    /**
     * Cancel operation
     */
    cancelOperation() {
        try {
            this.updateOperationStatus('cancelled', 'Operation cancelled by user');
            
            this.logger.info('Operation cancelled by user');

            // Trigger cancel callback
            if (this.onOperationCancel) {
                this.onOperationCancel({
                    type: 'cancel',
                    operation: this.currentOperation
                });
            }

            // Hide progress after delay
            setTimeout(() => {
                this.hideProgress();
            }, 2000);
        } catch (error) {
            this.logger.error('Error cancelling operation', { 
                error: error.message 
            });
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
     * Hide progress
     */
    hideProgress() {
        try {
            if (this.progressContainer) {
                this.progressContainer.style.display = 'none';
                this.resetOperationStats();
                this.logger.debug('Progress hidden');
            }
        } catch (error) {
            this.logger.error('Error hiding progress', { error: error.message });
        }
    }

    /**
     * Update operation title
     * 
     * @param {string} operationType - Type of operation
     */
    updateOperationTitle(operationType) {
        try {
            const titleMap = {
                'import': 'Importing Users',
                'export': 'Exporting Users',
                'delete': 'Deleting Users',
                'modify': 'Modifying Users'
            };

            const title = titleMap[operationType] || 'Operation in Progress';
            
            const titleElement = this.progressContainer.querySelector('.operation-title');
            if (titleElement) {
                titleElement.textContent = title;
            }
        } catch (error) {
            this.logger.error('Error updating operation title', { 
                error: error.message, 
                operationType 
            });
        }
    }

    /**
     * Reset operation statistics
     */
    resetOperationStats() {
        this.operationStats = {
            processed: 0,
            total: 0,
            success: 0,
            failed: 0,
            skipped: 0,
            duplicates: 0
        };
    }

    /**
     * Format duration in human-readable format
     * 
     * @param {number} milliseconds - Duration in milliseconds
     * @returns {string} Formatted duration
     */
    formatDuration(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }

    /**
     * Set progress update callback
     * 
     * @param {Function} callback - Progress update callback
     */
    setProgressCallback(callback) {
        this.onProgressUpdate = callback;
    }

    /**
     * Set operation complete callback
     * 
     * @param {Function} callback - Operation complete callback
     */
    setCompleteCallback(callback) {
        this.onOperationComplete = callback;
    }

    /**
     * Set operation cancel callback
     * 
     * @param {Function} callback - Operation cancel callback
     */
    setCancelCallback(callback) {
        this.onOperationCancel = callback;
    }

    /**
     * Debug log method for compatibility
     */
    debugLog(area, message) {
        if (DEBUG_MODE) {
            console.debug(`[${area}] ${message}`);
        }
    }
}

// Create and export default instance
const progressManager = new ProgressManager();

// Export the class and instance
export { ProgressManager, progressManager }; 