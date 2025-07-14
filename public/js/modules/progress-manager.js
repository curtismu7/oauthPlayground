/**
 * Enhanced Progress Manager Module
 * 
 * Modern, real-time progress UI system with SSE integration:
 * - Real-time updates via Server-Sent Events
 * - Professional Ping Identity design system
 * - Responsive and accessible
 * - Enhanced visual feedback
 * - Step-by-step progress tracking
 * 
 * Features:
 * - Real-time progress updates via SSE
 * - Professional progress indicators
 * - Step-by-step operation tracking
 * - Enhanced error handling and recovery
 * - Accessibility compliance
 * - Production-ready logging
 */

import { createWinstonLogger } from './winston-logger.js';
import { ElementRegistry } from './element-registry.js';
import { sessionManager } from './session-manager.js';
import messageFormatter from './message-formatter.js';

// Enable debug mode for development (set to false in production)
const DEBUG_MODE = process.env.NODE_ENV !== 'production';

/**
 * Enhanced Progress Manager Class
 * 
 * Manages all progress-related UI updates with real-time SSE integration
 */
class ProgressManager {
    constructor() {
        this.logger = createWinstonLogger('pingone-progress');
        this.isEnabled = true; // Will be set to false if progress container is not found
        this.currentOperation = null;
        this.currentSessionId = null;
        this.isActive = false;
        this.startTime = null;
        this.timingInterval = null;
        this.progressCallback = null;
        this.completeCallback = null;
        this.cancelCallback = null;
        this.duplicateHandlingMode = 'skip';
        
        // Stats tracking
        this.stats = {
            processed: 0,
            success: 0,
            failed: 0,
            skipped: 0,
            total: 0
        };
        
        this.logger.debug('ProgressManager initialized');
    }

    /**
     * Initialize the progress manager
     */
    initialize() {
        try {
            this.setupElements();
            this.setupEventListeners();
            this.logger.info('Enhanced progress manager initialized successfully');
        } catch (error) {
            this.logger.error('Failed to initialize progress manager', { error: error.message });
        }
    }

    /**
     * Setup DOM elements with enhanced design
     */
    setupElements() {
        try {
            // Main progress container - use existing one from HTML
            this.progressContainer = document.getElementById('progress-container');
            
            if (!this.progressContainer) {
                this.logger.warn('Progress container not found in HTML - progress functionality will be disabled');
                this.isEnabled = false;
                return;
            }

            // Create enhanced progress content
            this.progressContainer.innerHTML = `
                <div class="progress-overlay">
                    <div class="progress-modal">
                        <div class="progress-header">
                            <div class="operation-info">
                                <h3 class="operation-title">
                                    <i class="fas fa-cog fa-spin"></i>
                                    <span class="title-text">Operation in Progress</span>
                                </h3>
                                <div class="operation-subtitle">Processing your request...</div>
                            </div>
                            <button class="cancel-operation" type="button" aria-label="Cancel operation">
                                <i class="fas fa-times"></i>
                                <span>Cancel</span>
                            </button>
                        </div>
                        
                        <div class="progress-content">
                            <div class="progress-steps">
                                <div class="step active" data-step="init">
                                    <div class="step-icon">
                                        <i class="fas fa-play"></i>
                                    </div>
                                    <div class="step-label">Initializing</div>
                                </div>
                                <div class="step" data-step="validate">
                                    <div class="step-icon">
                                        <i class="fas fa-check"></i>
                                    </div>
                                    <div class="step-label">Validating</div>
                                </div>
                                <div class="step" data-step="process">
                                    <div class="step-icon">
                                        <i class="fas fa-cogs"></i>
                                    </div>
                                    <div class="step-label">Processing</div>
                                </div>
                                <div class="step" data-step="complete">
                                    <div class="step-icon">
                                        <i class="fas fa-check-circle"></i>
                                    </div>
                                    <div class="step-label">Complete</div>
                                </div>
                            </div>
                            
                            <div class="progress-main">
                                <div class="progress-bar-container">
                                    <div class="progress-bar">
                                        <div class="progress-bar-fill"></div>
                                        <div class="progress-bar-glow"></div>
                                    </div>
                                    <div class="progress-percentage">0%</div>
                                </div>
                                
                                <div class="progress-text">Preparing operation...</div>
                                
                                <div class="progress-stats">
                                    <div class="stat-item">
                                        <span class="stat-label">Processed:</span>
                                        <span class="stat-value processed">0</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-label">Success:</span>
                                        <span class="stat-value success">0</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-label">Failed:</span>
                                        <span class="stat-value failed">0</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-label">Skipped:</span>
                                        <span class="stat-value skipped">0</span>
                                    </div>
                                </div>
                                
                                <div class="progress-timing">
                                    <div class="time-elapsed">
                                        <i class="fas fa-clock"></i>
                                        <span>Time: <span class="elapsed-value">00:00</span></span>
                                    </div>
                                    <div class="time-remaining">
                                        <i class="fas fa-hourglass-half"></i>
                                        <span>ETA: <span class="eta-value">Calculating...</span></span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="progress-details">
                                <div class="details-header">
                                    <h4><i class="fas fa-info-circle"></i> Operation Details</h4>
                                </div>
                                <div class="details-content">
                                    <div class="detail-item">
                                        <span class="detail-label">Operation Type:</span>
                                        <span class="detail-value operation-type">-</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">Population:</span>
                                        <span class="detail-value population-name">-</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">File:</span>
                                        <span class="detail-value file-name">-</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">Status:</span>
                                        <span class="detail-value status-text">Initializing...</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="duplicate-handling" style="display: none;">
                            <div class="duplicate-header">
                                <h4><i class="fas fa-exclamation-triangle"></i> Duplicate Users Found</h4>
                                <p>Choose how to handle duplicate users in your data:</p>
                            </div>
                            <div class="duplicate-options">
                                <label class="option-item">
                                    <input type="radio" name="duplicate-handling" value="skip" checked>
                                    <span class="option-text">
                                        <i class="fas fa-forward"></i>
                                        Skip duplicates
                                    </span>
                                </label>
                                <label class="option-item">
                                    <input type="radio" name="duplicate-handling" value="add">
                                    <span class="option-text">
                                        <i class="fas fa-plus"></i>
                                        Add to PingOne
                                    </span>
                                </label>
                            </div>
                            <div class="duplicate-list"></div>
                        </div>
                    </div>
                </div>
            `;

            // Get references to elements
            this.progressBar = this.progressContainer.querySelector('.progress-bar-fill');
            this.progressText = this.progressContainer.querySelector('.progress-text');
            this.progressDetails = this.progressContainer.querySelector('.progress-details');
            this.operationStatus = this.progressContainer.querySelector('.status-text');
            this.cancelButton = this.progressContainer.querySelector('.cancel-operation');
            this.stepIndicator = this.progressContainer.querySelector('.progress-steps');
            this.timeElapsed = this.progressContainer.querySelector('.elapsed-value');
            this.etaDisplay = this.progressContainer.querySelector('.eta-value');
            this.progressPercentage = this.progressContainer.querySelector('.progress-percentage');

            this.logger.debug('Enhanced progress elements setup completed');
        } catch (error) {
            this.logger.error('Error setting up progress elements', { error: error.message });
            this.isEnabled = false;
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        try {
            if (!this.progressContainer) {
                this.logger.warn('Cannot set up event listeners: progress container not present');
                return;
            }
            // Cancel button
            if (this.cancelButton) {
                this.cancelButton.addEventListener('click', () => {
                    this.cancelOperation();
                });
            }

            // Duplicate handling options
            const duplicateOptions = this.progressContainer.querySelectorAll('input[name="duplicate-handling"]');
            duplicateOptions.forEach(option => {
                option.addEventListener('change', (e) => {
                    this.duplicateHandlingMode = e.target.value;
                    this.logger.debug('Duplicate handling mode changed', { mode: this.duplicateHandlingMode });
                });
            });

            this.logger.debug('Progress event listeners setup completed');
        } catch (error) {
            this.logger.error('Error setting up event listeners', { error: error.message });
        }
    }

    /**
     * Start operation with enhanced UI
     */
    startOperation(operationType, options = {}) {
        try {
            if (!this.isEnabled) {
                this.logger.warn('Progress manager is disabled - operation will proceed without progress UI');
                return;
            }
            
            this.currentOperation = operationType;
            this.operationStartTime = Date.now();
            this.resetOperationStats();
            
            // Update operation title
            this.updateOperationTitle(operationType);
            
            // Update operation details
            this.updateOperationDetails(options);
            
            // Show progress
            this.showProgress();
            
            // Initialize SSE connection
            this.initializeSSEConnection(options.sessionId);
            
            // Start timing updates
            this.startTimingUpdates();
            
            // Update step indicator
            this.updateStepIndicator('init');
            
            this.progressReceived = false;
            if (this.progressTimeout) clearTimeout(this.progressTimeout);
            // Start a timeout: if no progress event in 10s, show error
            this.progressTimeout = setTimeout(() => {
                if (!this.progressReceived) {
                    this.handleOperationError('No progress received from server. The operation may have stalled. Please retry.');
                }
            }, 10000);

            this.logger.info('Operation started', { 
                operationType, 
                options,
                sessionId: options.sessionId 
            });
        } catch (error) {
            this.logger.error('Error starting operation', { error: error.message, operationType });
        }
    }

    /**
     * Initialize SSE connection for real-time updates
     */
    initializeSSEConnection(sessionId) {
        try {
            if (!sessionId) {
                this.logger.warn('No session ID provided for SSE connection - will be updated when received from backend');
                this.updateOperationStatus('info', 'Operation started. Real-time progress will be available once connection is established.');
                return;
            }

            // Use session manager to validate session ID if available
            if (typeof sessionManager !== 'undefined' && sessionManager.validateSessionId) {
                if (!sessionManager.validateSessionId(sessionId)) {
                    this.logger.error('Invalid session ID format', { sessionId, type: typeof sessionId });
                    this.updateOperationStatus('error', 'Invalid session ID format. Real-time progress tracking unavailable.');
                    return;
                }

                // Register session with session manager
                sessionManager.registerSession(sessionId, this.currentOperation || 'unknown', {
                    startTime: this.operationStartTime,
                    stats: this.operationStats
                });
            } else {
                this.logger.warn('Session manager not available - proceeding without session validation');
            }

            this.sessionId = sessionId;
            
            // Close existing connection
            if (this.sseConnection) {
                this.sseConnection.close();
            }

            // Create new SSE connection
            this.sseConnection = new EventSource(`/api/import/progress/${sessionId}`);
            
            // Handle connection open
            this.sseConnection.onopen = () => {
                this.logger.debug('SSE connection established', { sessionId });
                this.updateOperationStatus('connected', 'Real-time connection established');
            };

            // Handle progress events
            this.sseConnection.onmessage = (event) => {
                this.logger.info('SSE event received', { event: event.data });
                try {
                    const data = JSON.parse(event.data);
                    this.handleSSEEvent(data);
                } catch (error) {
                    this.logger.error('Error parsing SSE event', { error: error.message, event: event.data });
                }
            };

            // Handle errors
            this.sseConnection.onerror = (error) => {
                this.logger.error('SSE connection error', { error: error.message, sessionId });
                this.updateOperationStatus('error', 'Connection lost. Retrying...');
                this.handleOperationError('Lost connection to server. Please check your network or retry the operation.');
            };

        } catch (error) {
            this.logger.error('Error initializing SSE connection', { error: error.message, sessionId });
        }
    }

    /**
     * Update session ID after operation starts (for operations that get session ID from backend)
     */
    updateSessionId(sessionId) {
        try {
            if (!sessionId) {
                this.logger.warn('Attempted to update with null/undefined session ID');
                return;
            }

            // Use session manager to validate session ID if available
            if (typeof sessionManager !== 'undefined' && sessionManager.validateSessionId) {
                if (!sessionManager.validateSessionId(sessionId)) {
                    this.logger.error('Invalid session ID provided for update', { sessionId });
                    this.updateOperationStatus('error', 'Invalid session ID format. Real-time progress tracking unavailable.');
                    return;
                }
            } else {
                this.logger.warn('Session manager not available - proceeding without session validation');
            }

            this.logger.info('Updating session ID', { sessionId });
            this.sessionId = sessionId;
            
            // Re-initialize SSE connection with new session ID
            this.initializeSSEConnection(sessionId);
            
        } catch (error) {
            this.logger.error('Error updating session ID', { error: error.message, sessionId });
        }
    }

    /**
     * Handle SSE events
     */
    handleSSEEvent(data) {
        try {
            this.logger.info('Progress SSE event', { type: data.type, data });
            if (!this.progressReceived && data.type === 'progress') {
                this.progressReceived = true;
                if (this.progressTimeout) {
                    clearTimeout(this.progressTimeout);
                    this.progressTimeout = null;
                }
            }

            // Format the SSE event message for better readability
            const formattedMessage = messageFormatter.formatSSEEvent(data);
            this.logger.info('Formatted SSE event', { 
                originalType: data.type, 
                formattedMessage: formattedMessage.substring(0, 100) + '...' 
            });

            switch (data.type) {
                case 'progress':
                    this.updateProgress(data.current, data.total, data.message, data.counts);
                    break;
                case 'completion':
                    this.completeOperation(data);
                    break;
                case 'error':
                    this.handleOperationError(data.message, data.details);
                    break;
                default:
                    this.logger.debug('Unknown SSE event type', { type: data.type, data });
            }
        } catch (error) {
            this.logger.error('Error handling SSE event', { error: error.message, data });
        }
    }

    /**
     * Update progress with enhanced visual feedback
     */
    updateProgress(current, total, message = '', details = {}) {
        try {
            // Update stats
            if (details.processed !== undefined) this.operationStats.processed = details.processed;
            if (details.success !== undefined) this.operationStats.success = details.success;
            if (details.failed !== undefined) this.operationStats.failed = details.failed;
            if (details.skipped !== undefined) this.operationStats.skipped = details.skipped;

            // Calculate percentage
            const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
            
            // Update progress bar
            if (this.progressBar) {
                this.progressBar.style.width = `${percentage}%`;
                this.progressBar.setAttribute('aria-valuenow', percentage);
            }

            // Update percentage display
            if (this.progressPercentage) {
                this.progressPercentage.textContent = `${percentage}%`;
            }

            // Update progress text with formatted message
            if (this.progressText) {
                const formattedProgressMessage = messageFormatter.formatProgressMessage(
                    this.currentOperation || 'import', 
                    current, 
                    total, 
                    message, 
                    details
                );
                this.progressText.textContent = formattedProgressMessage;
            }

            // Update stats display
            this.updateStatsDisplay();

            // Update step indicator based on progress
            this.updateStepIndicatorBasedOnProgress(percentage);

            // Update operation status
            this.updateOperationStatus('processing', message);

            // Trigger callback
            if (this.onProgressUpdate) {
                this.onProgressUpdate(current, total, message, details);
            }

            this.logger.debug('Progress updated', { 
                current, 
                total, 
                percentage, 
                message,
                stats: this.operationStats 
            });
        } catch (error) {
            this.logger.error('Error updating progress', { error: error.message });
        }
    }

    /**
     * Update stats display
     */
    updateStatsDisplay() {
        try {
            if (!this.progressContainer) {
                this.logger.warn('Cannot update stats display: progress container not present');
                return;
            }
            const statElements = {
                processed: this.progressContainer.querySelector('.stat-value.processed'),
                success: this.progressContainer.querySelector('.stat-value.success'),
                failed: this.progressContainer.querySelector('.stat-value.failed'),
                skipped: this.progressContainer.querySelector('.stat-value.skipped')
            };

            if (statElements.processed) {
                statElements.processed.textContent = this.operationStats.processed;
            }
            if (statElements.success) {
                statElements.success.textContent = this.operationStats.success;
            }
            if (statElements.failed) {
                statElements.failed.textContent = this.operationStats.failed;
            }
            if (statElements.skipped) {
                statElements.skipped.textContent = this.operationStats.skipped;
            }
        } catch (error) {
            this.logger.error('Error updating stats display', { error: error.message });
        }
    }

    /**
     * Update step indicator based on progress
     */
    updateStepIndicatorBasedOnProgress(percentage) {
        try {
            let currentStep = 'init';
            
            if (percentage > 0 && percentage < 25) {
                currentStep = 'validate';
            } else if (percentage >= 25 && percentage < 90) {
                currentStep = 'process';
            } else if (percentage >= 90) {
                currentStep = 'complete';
            }

            this.updateStepIndicator(currentStep);
        } catch (error) {
            this.logger.error('Error updating step indicator', { error: error.message });
        }
    }

    /**
     * Update step indicator
     */
    updateStepIndicator(step) {
        try {
            if (!this.stepIndicator) return;

            // Remove active class from all steps
            const steps = this.stepIndicator.querySelectorAll('.step');
            steps.forEach(s => s.classList.remove('active', 'completed'));

            // Add active class to current step and completed to previous steps
            const stepElement = this.stepIndicator.querySelector(`[data-step="${step}"]`);
            if (stepElement) {
                stepElement.classList.add('active');
                
                // Mark previous steps as completed
                const stepOrder = ['init', 'validate', 'process', 'complete'];
                const currentIndex = stepOrder.indexOf(step);
                
                for (let i = 0; i < currentIndex; i++) {
                    const prevStep = this.stepIndicator.querySelector(`[data-step="${stepOrder[i]}"]`);
                    if (prevStep) {
                        prevStep.classList.add('completed');
                    }
                }
            }
        } catch (error) {
            this.logger.error('Error updating step indicator', { error: error.message, step });
        }
    }

    /**
     * Start timing updates
     */
    startTimingUpdates() {
        try {
            this.timingInterval = setInterval(() => {
                this.updateTiming();
            }, 1000);
        } catch (error) {
            this.logger.error('Error starting timing updates', { error: error.message });
        }
    }

    /**
     * Update timing display
     */
    updateTiming() {
        try {
            if (!this.operationStartTime) return;

            const elapsed = Date.now() - this.operationStartTime;
            const elapsedFormatted = this.formatDuration(elapsed);

            if (this.timeElapsed) {
                this.timeElapsed.textContent = elapsedFormatted;
            }

            // Calculate ETA if we have progress data
            if (this.operationStats.processed > 0 && this.operationStats.total > 0) {
                const progress = this.operationStats.processed / this.operationStats.total;
                if (progress > 0) {
                    const estimatedTotal = elapsed / progress;
                    const remaining = estimatedTotal - elapsed;
                    const etaFormatted = this.formatDuration(remaining);
                    
                    if (this.etaDisplay) {
                        this.etaDisplay.textContent = etaFormatted;
                    }
                }
            }
        } catch (error) {
            this.logger.error('Error updating timing', { error: error.message });
        }
    }

    /**
     * Complete operation with enhanced UI
     */
    completeOperation(results = {}) {
        try {
            // Stop timing updates
            if (this.timingInterval) {
                clearInterval(this.timingInterval);
            }

            // Close SSE connection
            if (this.sseConnection) {
                this.sseConnection.close();
                this.sseConnection = null;
            }

            // Clean up session
            if (this.sessionId) {
                sessionManager.unregisterSession(this.sessionId);
                this.sessionId = null;
            }

            // Update final stats
            if (results.processed !== undefined) this.operationStats.processed = results.processed;
            if (results.success !== undefined) this.operationStats.success = results.success;
            if (results.failed !== undefined) this.operationStats.failed = results.failed;
            if (results.skipped !== undefined) this.operationStats.skipped = results.skipped;

            // Update UI for completion
            this.updateStepIndicator('complete');
            this.updateOperationStatus('complete', results.message || 'Operation completed successfully');
            
            // Update progress to 100%
            if (this.progressBar) {
                this.progressBar.style.width = '100%';
            }
            if (this.progressPercentage) {
                this.progressPercentage.textContent = '100%';
            }

            // Show completion message
            if (this.progressText) {
                this.progressText.textContent = results.message || 'Operation completed successfully';
            }

            // Update final stats
            this.updateStatsDisplay();

            // Trigger completion callback
            if (this.onOperationComplete) {
                this.onOperationComplete(results);
            }

            // Auto-hide after delay
            setTimeout(() => {
                this.hideProgress();
            }, 3000);

            this.logger.info('Operation completed', { 
                results, 
                stats: this.operationStats,
                duration: this.operationStartTime ? Date.now() - this.operationStartTime : 0
            });
        } catch (error) {
            this.logger.error('Error completing operation', { error: error.message, results });
        }
    }

    /**
     * Handle operation error
     */
    handleOperationError(message, details = {}) {
        try {
            if (this.progressTimeout) {
                clearTimeout(this.progressTimeout);
                this.progressTimeout = null;
            }
            this.updateOperationStatus('error', message);
            
            if (this.progressText) {
                this.progressText.textContent = `Error: ${message}`;
            }

            // Update step indicator to show error
            this.updateStepIndicator('error');

            this.logger.error('Operation error', { message, details });
        } catch (error) {
            this.logger.error('Error handling operation error', { error: error.message });
        }
    }

    /**
     * Cancel operation
     */
    cancelOperation() {
        try {
            // Close SSE connection
            if (this.sseConnection) {
                this.sseConnection.close();
                this.sseConnection = null;
            }

            // Stop timing updates
            if (this.timingInterval) {
                clearInterval(this.timingInterval);
            }

            // Clean up session
            if (this.sessionId) {
                sessionManager.unregisterSession(this.sessionId);
                this.sessionId = null;
            }

            // Update UI
            this.updateOperationStatus('cancelled', 'Operation cancelled by user');
            
            if (this.progressText) {
                this.progressText.textContent = 'Operation cancelled';
            }

            // Trigger cancel callback
            if (this.onOperationCancel) {
                this.onOperationCancel();
            }

            // Hide progress after delay
            setTimeout(() => {
                this.hideProgress();
            }, 2000);

            this.logger.info('Operation cancelled by user');
        } catch (error) {
            this.logger.error('Error cancelling operation', { error: error.message });
        }
    }

    /**
     * Show progress with enhanced animation
     */
    showProgress() {
        try {
            if (this.progressContainer) {
                // Find the progress overlay within the container
                const progressOverlay = this.progressContainer.querySelector('.progress-overlay');
                if (progressOverlay) {
                    // Show the overlay
                    progressOverlay.style.display = 'flex';
                    
                    // Add visible class for animation
                    setTimeout(() => {
                        progressOverlay.classList.add('visible');
                    }, 10);
                    
                    this.logger.debug('Progress overlay shown');
                } else {
                    // Fallback: show the container directly
                    this.progressContainer.style.display = 'block';
                    setTimeout(() => {
                        this.progressContainer.classList.add('visible');
                    }, 10);
                    this.logger.debug('Progress container shown (fallback)');
                }
            }
        } catch (error) {
            this.logger.error('Error showing progress', { error: error.message });
        }
    }

    /**
     * Hide progress with smooth transition
     */
    hideProgress() {
        try {
            if (this.progressContainer) {
                // Find the progress overlay within the container
                const progressOverlay = this.progressContainer.querySelector('.progress-overlay');
                if (progressOverlay) {
                    // Remove visible class for smooth transition
                    progressOverlay.classList.remove('visible');
                    
                    // Hide after transition
                    setTimeout(() => {
                        progressOverlay.style.display = 'none';
                    }, 300);
                    
                    this.logger.debug('Progress overlay hidden');
                } else {
                    // Fallback: hide the container directly
                    this.progressContainer.classList.remove('visible');
                    setTimeout(() => {
                        this.progressContainer.style.display = 'none';
                    }, 300);
                    this.logger.debug('Progress container hidden (fallback)');
                }
            }
        } catch (error) {
            this.logger.error('Error hiding progress', { error: error.message });
        }
    }

    /**
     * Update operation title
     */
    updateOperationTitle(operationType) {
        try {
            if (!this.progressContainer) {
                this.logger.warn('Cannot update operation title: progress container not present');
                return;
            }
            const titleElement = this.progressContainer.querySelector('.title-text');
            if (titleElement) {
                const titles = {
                    'import': 'Importing Users',
                    'export': 'Exporting Users',
                    'delete': 'Deleting Users',
                    'modify': 'Modifying Users'
                };
                titleElement.textContent = titles[operationType] || 'Operation in Progress';
            }
        } catch (error) {
            this.logger.error('Error updating operation title', { error: error.message, operationType });
        }
    }

    /**
     * Update operation details
     */
    updateOperationDetails(options = {}) {
        try {
            if (!this.progressContainer) {
                this.logger.warn('Cannot update operation details: progress container not present');
                return;
            }
            const details = {
                'operation-type': options.operationType || '-',
                'population-name': options.populationName || '-',
                'file-name': options.fileName || '-'
            };

            Object.entries(details).forEach(([key, value]) => {
                const element = this.progressContainer.querySelector(`.detail-value.${key.replace('-', '-')}`);
                if (element) {
                    element.textContent = value;
                }
            });
        } catch (error) {
            this.logger.error('Error updating operation details', { error: error.message, options });
        }
    }

    /**
     * Update operation status
     */
    updateOperationStatus(status, message = '') {
        try {
            if (this.operationStatus) {
                this.operationStatus.textContent = message;
                this.operationStatus.className = `detail-value status-text ${status}`;
            }
        } catch (error) {
            this.logger.error('Error updating operation status', { error: error.message, status, message });
        }
    }

    /**
     * Reset operation stats
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
     * Format duration in MM:SS format
     */
    formatDuration(milliseconds) {
        try {
            const seconds = Math.floor(milliseconds / 1000);
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        } catch (error) {
            this.logger.error('Error formatting duration', { error: error.message });
            return '00:00';
        }
    }

    /**
     * Set progress update callback
     */
    setProgressCallback(callback) {
        this.onProgressUpdate = callback;
    }

    /**
     * Set operation complete callback
     */
    setCompleteCallback(callback) {
        this.onOperationComplete = callback;
    }

    /**
     * Set operation cancel callback
     */
    setCancelCallback(callback) {
        this.onOperationCancel = callback;
    }

    /**
     * Debug logging
     */
    debugLog(area, message) {
        if (DEBUG_MODE) {
            this.logger.debug(`[${area}] ${message}`);
        }
    }

    /**
     * Cleanup resources
     */
    destroy() {
        try {
            // Close SSE connection
            if (this.sseConnection) {
                this.sseConnection.close();
                this.sseConnection = null;
            }

            // Clear timing interval
            if (this.timingInterval) {
                clearInterval(this.timingInterval);
            }

            // Hide progress
            this.hideProgress();

            this.logger.info('Progress manager destroyed');
        } catch (error) {
            this.logger.error('Error destroying progress manager', { error: error.message });
        }
    }
}

// Create and export default instance
const progressManager = new ProgressManager();

// Export the class and instance
export { ProgressManager, progressManager }; 