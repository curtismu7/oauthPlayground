/**
 * Enhanced Progress Manager Module
 * 
 * Modern, real-time progress UI system with Socket.IO and WebSocket fallback:
 * - Real-time updates via Socket.IO (primary)
 * - WebSocket fallback for reliability
 * - Professional Ping Identity design system
 * - Responsive and accessible
 * - Enhanced visual feedback
 * - Step-by-step progress tracking
 * 
 * Features:
 * - Real-time progress updates via Socket.IO
 * - WebSocket fallback for connection issues
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
 * Manages all progress-related UI updates with real-time Socket.IO and WebSocket integration
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
        
        // Real-time communication
        this.socket = null;
        this.websocket = null;
        this.connectionType = null; // 'socketio' or 'websocket'
        this.connectionRetries = 0;
        this.maxRetries = 3;
        
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
                                    <div class="detail-item">
                                        <span class="detail-label">Connection:</span>
                                        <span class="detail-value connection-type">-</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="duplicate-handling" style="display: none;">
                            <div class="duplicate-header">
                                <h4><i class="fas fa-exclamation-triangle"></i> Duplicate Handling</h4>
                            </div>
                            <div class="duplicate-content">
                                <div class="duplicate-mode">
                                    <label>
                                        <input type="radio" name="duplicateMode" value="skip" checked>
                                        <span>Skip duplicates</span>
                                    </label>
                                    <label>
                                        <input type="radio" name="duplicateMode" value="update">
                                        <span>Update existing</span>
                                    </label>
                                    <label>
                                        <input type="radio" name="duplicateMode" value="create">
                                        <span>Create new</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Cache important elements
            this.progressBar = this.progressContainer.querySelector('.progress-bar-fill');
            this.progressPercentage = this.progressContainer.querySelector('.progress-percentage');
            this.progressText = this.progressContainer.querySelector('.progress-text');
            this.operationTitle = this.progressContainer.querySelector('.operation-title .title-text');
            this.operationSubtitle = this.progressContainer.querySelector('.operation-subtitle');
            this.statusText = this.progressContainer.querySelector('.status-text');
            this.connectionType = this.progressContainer.querySelector('.connection-type');
            this.cancelButton = this.progressContainer.querySelector('.cancel-operation');
            this.steps = this.progressContainer.querySelectorAll('.step');
            this.statsElements = {
                processed: this.progressContainer.querySelector('.stat-value.processed'),
                success: this.progressContainer.querySelector('.stat-value.success'),
                failed: this.progressContainer.querySelector('.stat-value.failed'),
                skipped: this.progressContainer.querySelector('.stat-value.skipped')
            };
            this.timingElements = {
                elapsed: this.progressContainer.querySelector('.elapsed-value'),
                eta: this.progressContainer.querySelector('.eta-value')
            };
            this.detailElements = {
                operationType: this.progressContainer.querySelector('.detail-value.operation-type'),
                populationName: this.progressContainer.querySelector('.detail-value.population-name'),
                fileName: this.progressContainer.querySelector('.detail-value.file-name')
            };

            this.logger.debug('Progress elements setup complete');
        } catch (error) {
            this.logger.error('Error setting up progress elements', { error: error.message });
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        try {
            if (this.cancelButton) {
                this.cancelButton.addEventListener('click', () => this.cancelOperation());
            }

            // Duplicate handling mode changes
            const duplicateModeInputs = this.progressContainer.querySelectorAll('input[name="duplicateMode"]');
            duplicateModeInputs.forEach(input => {
                input.addEventListener('change', (e) => {
                    this.duplicateHandlingMode = e.target.value;
                    this.logger.debug('Duplicate handling mode changed', { mode: this.duplicateHandlingMode });
                });
            });

            this.logger.debug('Event listeners setup complete');
        } catch (error) {
            this.logger.error('Error setting up event listeners', { error: error.message });
        }
    }

    /**
     * Start a new operation with enhanced real-time communication
     */
    startOperation(operationType, options = {}) {
        try {
            this.logger.info('Starting operation', { operationType, options });
            
            this.currentOperation = operationType;
            this.isActive = true;
            this.startTime = Date.now();
            this.connectionRetries = 0;
            
            // Reset stats
            this.resetOperationStats();
            
            // Update operation details
            this.updateOperationTitle(operationType);
            this.updateOperationDetails(options);
            this.updateOperationStatus('initializing', 'Starting operation...');
            
            // Show progress UI
            this.showProgress();
            
            // Start timing updates
            this.startTimingUpdates();
            
            // Initialize real-time connection when session ID is available
            if (options.sessionId) {
                this.initializeRealTimeConnection(options.sessionId);
            }
            
            this.logger.info('Operation started successfully', { operationType });
            
        } catch (error) {
            this.logger.error('Error starting operation', { error: error.message, operationType });
            this.handleOperationError('Failed to start operation', { error: error.message });
        }
    }

    /**
     * Initialize real-time connection with Socket.IO and WebSocket fallback
     */
    initializeRealTimeConnection(sessionId) {
        try {
            if (!sessionId) {
                this.logger.warn('No session ID provided for real-time connection');
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
                    startTime: this.startTime,
                    stats: this.stats
                });
            } else {
                this.logger.warn('Session manager not available - proceeding without session validation');
            }

            this.currentSessionId = sessionId;
            
            // Close existing connections
            this.closeConnections();
            
            // Try Socket.IO first, then WebSocket fallback
            this.trySocketIOConnection(sessionId);
            
        } catch (error) {
            this.logger.error('Error initializing real-time connection', { error: error.message, sessionId });
        }
    }

    /**
     * Try Socket.IO connection first
     */
    trySocketIOConnection(sessionId) {
        try {
            this.logger.info('Attempting Socket.IO connection', { sessionId });
            this.updateOperationStatus('connecting', 'Establishing Socket.IO connection...');
            
            // Check if Socket.IO is available
            if (typeof io === 'undefined') {
                this.logger.warn('Socket.IO not available, trying WebSocket fallback');
                this.tryWebSocketConnection(sessionId);
                return;
            }

            // Create Socket.IO connection
            this.socket = io({
                timeout: 5000,
                forceNew: true
            });

            // Register session
            this.socket.emit('registerSession', sessionId);

            // Handle connection events
            this.socket.on('connect', () => {
                this.logger.info('Socket.IO connection established', { sessionId });
                this.connectionType = 'socketio';
                this.updateConnectionType('Socket.IO');
                this.updateOperationStatus('connected', 'Real-time connection established via Socket.IO');
            });

            this.socket.on('disconnect', () => {
                this.logger.warn('Socket.IO connection disconnected', { sessionId });
                this.updateOperationStatus('disconnected', 'Connection lost. Attempting to reconnect...');
            });

            this.socket.on('connect_error', (error) => {
                this.logger.error('Socket.IO connection error', { error: error.message, sessionId });
                this.updateOperationStatus('error', 'Socket.IO connection failed. Trying WebSocket fallback...');
                this.tryWebSocketConnection(sessionId);
            });

            // Handle progress events
            this.socket.on('progress', (data) => {
                this.logger.info('Socket.IO progress event received', { data });
                this.handleProgressEvent(data);
            });

            this.socket.on('completion', (data) => {
                this.logger.info('Socket.IO completion event received', { data });
                this.handleCompletionEvent(data);
            });

            this.socket.on('error', (data) => {
                this.logger.error('Socket.IO error event received', { data });
                this.handleErrorEvent(data);
            });

        } catch (error) {
            this.logger.error('Error setting up Socket.IO connection', { error: error.message, sessionId });
            this.tryWebSocketConnection(sessionId);
        }
    }

    /**
     * Try WebSocket connection as fallback
     */
    tryWebSocketConnection(sessionId) {
        try {
            this.logger.info('Attempting WebSocket connection', { sessionId });
            this.updateOperationStatus('connecting', 'Establishing WebSocket connection...');
            
            // Check if WebSocket is available
            if (typeof WebSocket === 'undefined') {
                this.logger.error('WebSocket not available');
                this.updateOperationStatus('error', 'No real-time communication available');
                return;
            }

            // Create WebSocket connection
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.host}`;
            this.websocket = new WebSocket(wsUrl);

            // Handle WebSocket events
            this.websocket.onopen = () => {
                this.logger.info('WebSocket connection established', { sessionId });
                this.connectionType = 'websocket';
                this.updateConnectionType('WebSocket');
                this.updateOperationStatus('connected', 'Real-time connection established via WebSocket');
                
                // Register session
                this.websocket.send(JSON.stringify({ sessionId }));
            };

            this.websocket.onclose = () => {
                this.logger.warn('WebSocket connection closed', { sessionId });
                this.updateOperationStatus('disconnected', 'WebSocket connection closed');
            };

            this.websocket.onerror = (error) => {
                this.logger.error('WebSocket connection error', { error: error.message, sessionId });
                this.updateOperationStatus('error', 'WebSocket connection failed');
                this.handleConnectionFailure();
            };

            this.websocket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.logger.info('WebSocket message received', { data });
                    this.handleProgressEvent(data);
                } catch (error) {
                    this.logger.error('Error parsing WebSocket message', { error: error.message, data: event.data });
                }
            };

        } catch (error) {
            this.logger.error('Error setting up WebSocket connection', { error: error.message, sessionId });
            this.handleConnectionFailure();
        }
    }

    /**
     * Handle connection failure and retry logic
     */
    handleConnectionFailure() {
        this.connectionRetries++;
        
        if (this.connectionRetries < this.maxRetries) {
            this.logger.warn('Connection failed, retrying', { 
                retry: this.connectionRetries, 
                maxRetries: this.maxRetries 
            });
            this.updateOperationStatus('retrying', `Connection failed. Retrying (${this.connectionRetries}/${this.maxRetries})...`);
            
            // Retry after delay
            setTimeout(() => {
                if (this.currentSessionId) {
                    this.initializeRealTimeConnection(this.currentSessionId);
                }
            }, 2000 * this.connectionRetries); // Exponential backoff
        } else {
            this.logger.error('Max connection retries reached');
            this.updateOperationStatus('error', 'Failed to establish real-time connection after multiple attempts');
        }
    }

    /**
     * Close all connections
     */
    closeConnections() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        
        if (this.websocket) {
            this.websocket.close();
            this.websocket = null;
        }
        
        this.connectionType = null;
    }

    /**
     * Update session ID after operation starts
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
            this.currentSessionId = sessionId;
            
            // Re-initialize real-time connection with new session ID
            this.initializeRealTimeConnection(sessionId);
            
        } catch (error) {
            this.logger.error('Error updating session ID', { error: error.message, sessionId });
        }
    }

    /**
     * Handle progress events from real-time connections
     */
    handleProgressEvent(data) {
        try {
            this.logger.info('Progress event received', { data });
            
            if (!this.progressReceived && data.type === 'progress') {
                this.progressReceived = true;
                if (this.progressTimeout) {
                    clearTimeout(this.progressTimeout);
                    this.progressTimeout = null;
                }
            }

            // Format the event message for better readability
            const formattedMessage = messageFormatter.formatProgressMessage(
                this.currentOperation || 'import',
                data.current || 0,
                data.total || 0,
                data.message || '',
                data.counts || {}
            );

            this.updateProgress(data.current, data.total, data.message, data.counts);
            
        } catch (error) {
            this.logger.error('Error handling progress event', { error: error.message, data });
        }
    }

    /**
     * Handle completion events from real-time connections
     */
    handleCompletionEvent(data) {
        try {
            this.logger.info('Completion event received', { data });
            this.completeOperation(data);
        } catch (error) {
            this.logger.error('Error handling completion event', { error: error.message, data });
        }
    }

    /**
     * Handle error events from real-time connections
     */
    handleErrorEvent(data) {
        try {
            this.logger.error('Error event received', { data });
            this.handleOperationError(data.message || 'Operation error', data.details || {});
        } catch (error) {
            this.logger.error('Error handling error event', { error: error.message, data });
        }
    }

    /**
     * Update progress with enhanced visual feedback
     */
    updateProgress(current, total, message = '', details = {}) {
        try {
            // Update stats
            if (details.processed !== undefined) this.stats.processed = details.processed;
            if (details.success !== undefined) this.stats.success = details.success;
            if (details.failed !== undefined) this.stats.failed = details.failed;
            if (details.skipped !== undefined) this.stats.skipped = details.skipped;

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
            if (this.progressCallback) {
                this.progressCallback(current, total, message, details);
            }

            this.logger.debug('Progress updated', { 
                current, 
                total, 
                percentage, 
                message,
                stats: this.stats 
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
            if (this.statsElements.processed) {
                this.statsElements.processed.textContent = this.stats.processed;
            }
            if (this.statsElements.success) {
                this.statsElements.success.textContent = this.stats.success;
            }
            if (this.statsElements.failed) {
                this.statsElements.failed.textContent = this.stats.failed;
            }
            if (this.statsElements.skipped) {
                this.statsElements.skipped.textContent = this.stats.skipped;
            }
        } catch (error) {
            this.logger.error('Error updating stats display', { error: error.message });
        }
    }

    /**
     * Update step indicator based on progress percentage
     */
    updateStepIndicatorBasedOnProgress(percentage) {
        try {
            let step = 'init';
            
            if (percentage > 0 && percentage < 25) {
                step = 'validate';
            } else if (percentage >= 25 && percentage < 90) {
                step = 'process';
            } else if (percentage >= 90) {
                step = 'complete';
            }
            
            this.updateStepIndicator(step);
        } catch (error) {
            this.logger.error('Error updating step indicator', { error: error.message });
        }
    }

    /**
     * Update step indicator
     */
    updateStepIndicator(step) {
        try {
            this.steps.forEach(stepElement => {
                stepElement.classList.remove('active', 'completed');
                
                if (stepElement.dataset.step === step) {
                    stepElement.classList.add('active');
                } else if (this.getStepOrder(stepElement.dataset.step) < this.getStepOrder(step)) {
                    stepElement.classList.add('completed');
                }
            });
        } catch (error) {
            this.logger.error('Error updating step indicator', { error: error.message });
        }
    }

    /**
     * Get step order for comparison
     */
    getStepOrder(step) {
        const order = { 'init': 0, 'validate': 1, 'process': 2, 'complete': 3 };
        return order[step] || 0;
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
            if (!this.startTime) return;
            
            const elapsed = Date.now() - this.startTime;
            const elapsedFormatted = this.formatDuration(elapsed);
            
            if (this.timingElements.elapsed) {
                this.timingElements.elapsed.textContent = elapsedFormatted;
            }
            
            // Calculate ETA based on progress
            if (this.stats.total > 0 && this.stats.processed > 0) {
                const progress = this.stats.processed / this.stats.total;
                const estimatedTotal = elapsed / progress;
                const remaining = estimatedTotal - elapsed;
                const etaFormatted = this.formatDuration(remaining);
                
                if (this.timingElements.eta) {
                    this.timingElements.eta.textContent = etaFormatted;
                }
            } else {
                if (this.timingElements.eta) {
                    this.timingElements.eta.textContent = 'Calculating...';
                }
            }
        } catch (error) {
            this.logger.error('Error updating timing', { error: error.message });
        }
    }

    /**
     * Complete operation
     */
    completeOperation(results = {}) {
        try {
            this.logger.info('Operation completed', { results });
            
            this.isActive = false;
            
            // Stop timing updates
            if (this.timingInterval) {
                clearInterval(this.timingInterval);
                this.timingInterval = null;
            }
            
            // Update final progress
            if (results.total) {
                this.updateProgress(results.total, results.total, 'Operation completed', results);
            }
            
            // Update step indicator
            this.updateStepIndicator('complete');
            
            // Update operation status
            this.updateOperationStatus('completed', 'Operation completed successfully');
            
            // Show completion message
            if (this.progressText) {
                const successCount = results.success || this.stats.success;
                const totalCount = results.total || this.stats.total;
                this.progressText.textContent = `Operation completed! Processed ${totalCount} items with ${successCount} successful.`;
            }
            
            // Trigger completion callback
            if (this.completeCallback) {
                this.completeCallback(results);
            }
            
            // Auto-hide after delay
            setTimeout(() => {
                this.hideProgress();
            }, 3000);
            
        } catch (error) {
            this.logger.error('Error completing operation', { error: error.message, results });
        }
    }

    /**
     * Handle operation error
     */
    handleOperationError(message, details = {}) {
        try {
            this.logger.error('Operation error', { message, details });
            
            this.isActive = false;
            
            // Stop timing updates
            if (this.timingInterval) {
                clearInterval(this.timingInterval);
                this.timingInterval = null;
            }
            
            // Update operation status
            this.updateOperationStatus('error', message);
            
            // Show error message
            if (this.progressText) {
                this.progressText.textContent = `Error: ${message}`;
            }
            
            // Update step indicator to show error
            this.steps.forEach(step => {
                step.classList.remove('active', 'completed');
                step.classList.add('error');
            });
            
        } catch (error) {
            this.logger.error('Error handling operation error', { error: error.message });
        }
    }

    /**
     * Cancel operation
     */
    cancelOperation() {
        try {
            this.logger.info('Operation cancelled by user');
            
            this.isActive = false;
            
            // Stop timing updates
            if (this.timingInterval) {
                clearInterval(this.timingInterval);
                this.timingInterval = null;
            }
            
            // Close connections
            this.closeConnections();
            
            // Update operation status
            this.updateOperationStatus('cancelled', 'Operation cancelled by user');
            
            // Trigger cancel callback
            if (this.cancelCallback) {
                this.cancelCallback();
            }
            
            // Hide progress
            this.hideProgress();
            
        } catch (error) {
            this.logger.error('Error cancelling operation', { error: error.message });
        }
    }

    /**
     * Show progress UI
     */
    showProgress() {
        try {
            if (this.progressContainer) {
                this.progressContainer.style.display = 'block';
                this.progressContainer.classList.add('active');
            }
        } catch (error) {
            this.logger.error('Error showing progress', { error: error.message });
        }
    }

    /**
     * Hide progress UI
     */
    hideProgress() {
        try {
            if (this.progressContainer) {
                this.progressContainer.classList.remove('active');
                setTimeout(() => {
                    this.progressContainer.style.display = 'none';
                }, 300);
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
            if (this.operationTitle) {
                const titles = {
                    'import': 'Import Operation',
                    'export': 'Export Operation',
                    'delete': 'Delete Operation',
                    'update': 'Update Operation'
                };
                this.operationTitle.textContent = titles[operationType] || 'Operation in Progress';
            }
        } catch (error) {
            this.logger.error('Error updating operation title', { error: error.message });
        }
    }

    /**
     * Update operation details
     */
    updateOperationDetails(options = {}) {
        try {
            if (this.detailElements.operationType) {
                this.detailElements.operationType.textContent = options.operationType || this.currentOperation || '-';
            }
            if (this.detailElements.populationName) {
                this.detailElements.populationName.textContent = options.populationName || '-';
            }
            if (this.detailElements.fileName) {
                this.detailElements.fileName.textContent = options.fileName || '-';
            }
        } catch (error) {
            this.logger.error('Error updating operation details', { error: error.message });
        }
    }

    /**
     * Update operation status
     */
    updateOperationStatus(status, message = '') {
        try {
            if (this.statusText) {
                this.statusText.textContent = message || status;
            }
        } catch (error) {
            this.logger.error('Error updating operation status', { error: error.message });
        }
    }

    /**
     * Update connection type display
     */
    updateConnectionType(type) {
        try {
            if (this.connectionType) {
                this.connectionType.textContent = type || '-';
            }
        } catch (error) {
            this.logger.error('Error updating connection type', { error: error.message });
        }
    }

    /**
     * Reset operation stats
     */
    resetOperationStats() {
        try {
            this.stats = {
                processed: 0,
                success: 0,
                failed: 0,
                skipped: 0,
                total: 0
            };
            this.updateStatsDisplay();
        } catch (error) {
            this.logger.error('Error resetting operation stats', { error: error.message });
        }
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
     * Set progress callback
     */
    setProgressCallback(callback) {
        this.progressCallback = callback;
    }

    /**
     * Set completion callback
     */
    setCompleteCallback(callback) {
        this.completeCallback = callback;
    }

    /**
     * Set cancel callback
     */
    setCancelCallback(callback) {
        this.cancelCallback = callback;
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
     * Destroy progress manager
     */
    destroy() {
        try {
            this.closeConnections();
            
            if (this.timingInterval) {
                clearInterval(this.timingInterval);
                this.timingInterval = null;
            }
            
            this.isActive = false;
            this.currentOperation = null;
            this.currentSessionId = null;
            
            this.logger.info('Progress manager destroyed');
        } catch (error) {
            this.logger.error('Error destroying progress manager', { error: error.message });
        }
    }
}

// Create and export singleton instance
const progressManager = new ProgressManager();

export default progressManager; 