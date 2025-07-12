// File: app.js
// Description: Main application entry point for PingOne user import tool
// 
// This file orchestrates the entire application, managing:
// - UI state and view transitions
// - File upload and CSV processing
// - Import/export/modify/delete operations
// - Real-time progress tracking via SSE
// - Settings management and population selection
// - Error handling and user feedback
// - Disclaimer agreement and feature flags

import { Logger } from './modules/logger.js';
import { FileLogger } from './modules/file-logger.js';
import { SettingsManager } from './modules/settings-manager.js';
import { UIManager } from './modules/ui-manager.js';
import { LocalAPIClient } from './modules/local-api-client.js';
import { PingOneClient } from './modules/pingone-client.js';
import TokenManager from './modules/token-manager.js';
import { FileHandler } from './modules/file-handler.js';
import { VersionManager } from './modules/version-manager.js';
import { apiFactory, initAPIFactory } from './modules/api-factory.js';
import { progressManager } from './modules/progress-manager.js';

/**
 * Secret Field Toggle Component
 * 
 * Manages the visibility toggle for sensitive input fields (like API secrets).
 * Provides a secure way to show/hide sensitive data with visual feedback.
 * 
 * Features:
 * - Toggle between visible and masked input
 * - Visual eye icon that changes based on state
 * - Maintains actual value while showing masked version
 * - Prevents accidental exposure of sensitive data
 */
class SecretFieldToggle {
    constructor() {
        // Core DOM elements for the toggle functionality
        this.inputElement = null;
        this.eyeButton = null;
        
        // State tracking for visibility and initialization
        this.isVisible = false;
        this.actualValue = '';
        this.isInitialized = false;
    }

    /**
     * Initialize the secret field toggle component
     * 
     * Sets up DOM element references and event handlers for the toggle functionality.
     * Called during app initialization to prepare the secret field for user interaction.
     * 
     * @returns {void}
     */
    init() {
        // Prevent double initialization
        if (this.isInitialized) {
            return;
        }

        // Get references to the required DOM elements
        this.inputElement = document.getElementById('api-secret');
        this.eyeButton = document.getElementById('toggle-api-secret-visibility');

        // Validate that both elements exist before proceeding
        if (!this.inputElement || !this.eyeButton) {
            console.error('❌ Secret field elements not found');
            console.error('Input element:', !!this.inputElement);
            console.error('Eye button:', !!this.eyeButton);
            return;
        }

        console.log('✅ Secret field elements found');
        console.log('Input element ID:', this.inputElement.id);
        console.log('Eye button ID:', this.eyeButton.id);

        // Set up event handlers for user interaction
        this.setupToggleHandler();
        this.handleInputChange();
        
        // Mark as initialized to prevent re-initialization
        this.isInitialized = true;
        console.log('✅ Secret field toggle initialized');
    }

    /**
     * Set up the toggle button click handler
     * 
     * Binds the click event to the eye button for toggling visibility.
     * Ensures proper event handling and prevents memory leaks.
     * 
     * @returns {void}
     */
    setupToggleHandler() {
        // Remove any existing listeners to prevent duplicates
        this.eyeButton.removeEventListener('click', this.handleToggleClick);
        
        // Add the click handler with proper binding
        this.eyeButton.addEventListener('click', this.handleToggleClick.bind(this));
        
        console.log('Secret field toggle handler set up');
    }

    /**
     * Handle the toggle button click event
     * 
     * Toggles the visibility state of the secret field and updates the UI accordingly.
     * Prevents event bubbling and provides visual feedback to the user.
     * 
     * @param {Event} e - The click event object
     * @returns {void}
     */
    handleToggleClick(e) {
        // Prevent default behavior and stop event propagation
        e.preventDefault();
        e.stopPropagation();
        
        console.log('🔍 Eye button clicked!');
        console.log('Current visibility:', this.isVisible);
        console.log('Current value length:', this.actualValue.length);
        
        // Toggle the visibility state
        this.isVisible = !this.isVisible;
        
        // Update the input field display based on new state
        this.updateInputField();
        
        // Update the eye icon to reflect current state
        this.updateEyeIcon();
        
        console.log('✅ Toggle completed!');
        console.log('New visibility:', this.isVisible);
        console.log('Input type:', this.inputElement.type);
        console.log('Input value length:', this.inputElement.value.length);
    }

    /**
     * Update the input field display based on visibility state
     * 
     * Switches between text and password input types to show/hide the actual value.
     * Maintains the actual value while providing visual masking for security.
     * 
     * @returns {void}
     */
    updateInputField() {
        if (!this.inputElement) {
            return;
        }

        if (this.isVisible) {
            // Show the actual value in plain text
            this.inputElement.type = 'text';
            this.inputElement.value = this.actualValue;
        } else {
            // Show masked value using password input type
            this.inputElement.type = 'password';
            this.inputElement.value = this.actualValue || '';
        }
    }

    /**
     * Update the eye icon to reflect current visibility state
     * 
     * Changes the FontAwesome icon class to show either an open eye (visible)
     * or crossed-out eye (hidden) based on the current state.
     * 
     * @returns {void}
     */
    updateEyeIcon() {
        if (!this.eyeButton) {
            return;
        }

        // Find the icon element within the button
        const iconElement = this.eyeButton.querySelector('i');
        if (!iconElement) {
            return;
        }

        if (this.isVisible) {
            // Show open eye icon for visible state
            iconElement.classList.remove('fa-eye-slash');
            iconElement.classList.add('fa-eye');
        } else {
            // Show crossed-out eye icon for hidden state
            iconElement.classList.remove('fa-eye');
            iconElement.classList.add('fa-eye-slash');
        }
    }

    /**
     * Set the secret value and update display
     * 
     * Called when the form is populated with existing settings.
     * Always starts in hidden state for security.
     * 
     * @param {string} value - The secret value to store
     * @returns {void}
     */
    setValue(value) {
        this.actualValue = value || '';
        
        // Always start in hidden state for security
        this.isVisible = false;
        
        // Update the display to reflect the new value
        this.updateInputField();
        this.updateEyeIcon();
        
        console.log('Secret field value set, length:', this.actualValue.length);
    }

    /**
     * Get the current secret value
     * 
     * Returns the actual stored value, not the displayed value.
     * 
     * @returns {string} The current secret value
     */
    getValue() {
        return this.actualValue;
    }

    /**
     * Handle input changes when user types in the field
     * 
     * Updates the stored value to match what the user is typing.
     * Ensures the actual value stays synchronized with user input.
     * 
     * @returns {void}
     */
    handleInputChange() {
        if (!this.inputElement) {
            return;
        }

        // Listen for input changes and update stored value
        this.inputElement.addEventListener('input', (e) => {
            this.actualValue = e.target.value;
            console.log('Secret field input changed, new length:', this.actualValue.length);
        });
    }
}

/**
 * Main Application Class
 * 
 * Orchestrates the entire PingOne user import tool application.
 * Manages all UI interactions, API calls, file processing, and state management.
 * 
 * Key Responsibilities:
 * - Initialize and coordinate all component modules
 * - Handle user interactions and view transitions
 * - Manage import/export/modify/delete operations
 * - Provide real-time progress feedback via SSE
 * - Handle error states and user notifications
 * - Manage settings and population selection
 */
class App {
    constructor() {
        // Production environment detection
        this.isProduction = window.location.hostname !== 'localhost' && 
                           window.location.hostname !== '127.0.0.1' &&
                           !window.location.hostname.includes('dev');
        
        // Initialize core dependencies with safety checks
        try {
            this.logger = new Logger();
            this.fileLogger = new FileLogger();
            this.settingsManager = new SettingsManager();
            this.uiManager = new UIManager();
            this.localClient = new LocalAPIClient();
            this.versionManager = new VersionManager();
            
            // Create a safe logger wrapper to prevent undefined method errors
            this.safeLogger = {
                info: (msg, data) => {
                    try {
                        if (this.logger && typeof this.logger.info === 'function') {
                            this.logger.info(msg, data);
                        } else {
                            console.log(`[INFO] ${msg}`, data);
                        }
                    } catch (error) {
                        console.log(`[INFO] ${msg}`, data);
                    }
                },
                warn: (msg, data) => {
                    try {
                        if (this.logger && typeof this.logger.warn === 'function') {
                            this.logger.warn(msg, data);
                        } else {
                            console.warn(`[WARN] ${msg}`, data);
                        }
                    } catch (error) {
                        console.warn(`[WARN] ${msg}`, data);
                    }
                },
                error: (msg, data) => {
                    try {
                        if (this.logger && typeof this.logger.error === 'function') {
                            this.logger.error(msg, data);
                        } else {
                            console.error(`[ERROR] ${msg}`, data);
                        }
                    } catch (error) {
                        console.error(`[ERROR] ${msg}`, data);
                    }
                }
            };
            
            // Initialize state variables with safe defaults
            this.currentView = 'home';
            this.selectedPopulationId = null;
            this.selectedPopulationName = null;
            this.populationChoice = null;
            this.importErrors = [];
            this.importSessionId = null;
            
            // Initialize components that might fail
            this.secretFieldToggle = null;
            this.fileHandler = null;
            this.pingOneClient = null;
            
            console.log('✅ App constructor completed successfully');
            
            // Production-specific configurations
            if (this.isProduction) {
                // Disable debug mode in production
                window.DEBUG_MODE = false;
                
                // Add production error reporting
                window.addEventListener('error', (event) => {
                    this.safeLogger.error('Unhandled error in production', {
                        message: event.message,
                        filename: event.filename,
                        lineno: event.lineno,
                        colno: event.colno,
                        error: event.error?.stack
                    });
                });
                
                // Add unhandled promise rejection handler
                window.addEventListener('unhandledrejection', (event) => {
                    this.safeLogger.error('Unhandled promise rejection in production', {
                        reason: event.reason,
                        promise: event.promise
                    });
                });
            }
        } catch (error) {
            console.error('❌ Error in App constructor:', error);
            // Ensure basic functionality even if some components fail
            this.logger = { error: console.error, warn: console.warn, info: console.log };
        }
    }

    /**
     * Initialize the application and all its components
     * 
     * Sets up all modules, loads settings, establishes connections,
     * and prepares the UI for user interaction. This is the main
     * entry point after the app is constructed.
     * 
     * @returns {Promise<void>}
     */
    async init() {
        try {
            console.log('Initializing app...');
            
            // Ensure DOM is ready before proceeding with UI-dependent operations
            if (document.readyState === 'loading') {
                console.log('DOM still loading, waiting for DOMContentLoaded...');
                await new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        reject(new Error('DOM ready timeout - page may be unresponsive'));
                    }, 30000); // 30 second timeout
                    
                    document.addEventListener('DOMContentLoaded', () => {
                        clearTimeout(timeout);
                        resolve();
                    }, { once: true });
                });
            }
            
            // Additional validation to ensure critical elements exist
            const criticalElements = [
                'notification-area',
                'universal-token-status',
                'connection-status'
            ];
            
            const missingElements = criticalElements.filter(id => !document.getElementById(id));
            if (missingElements.length > 0) {
                throw new Error(`Critical UI elements missing: ${missingElements.join(', ')}`);
            }
            
            // Validate core dependencies before proceeding
            if (!this.logger) {
                throw new Error('Logger not initialized');
            }
            
            if (!this.settingsManager) {
                throw new Error('SettingsManager not initialized');
            }
            
            if (!this.uiManager) {
                throw new Error('UIManager not initialized');
            }
            
            // Initialize API Factory first to establish API client infrastructure
            await this.initAPIFactory();
            
            // Initialize API clients for PingOne communication with safety check
            if (apiFactory) {
                this.pingOneClient = apiFactory.getPingOneClient(this.logger, this.settingsManager);
            } else {
                this.logger.warn('API Factory not available, PingOne client not initialized');
            }
            
            // Initialize UI manager for interface management
            if (this.uiManager && typeof this.uiManager.init === 'function') {
                await this.uiManager.init();
            } else {
                this.logger.warn('UIManager not properly initialized');
            }
            
            // Initialize settings manager for configuration handling
            if (this.settingsManager && typeof this.settingsManager.init === 'function') {
                await this.settingsManager.init();
            } else {
                this.logger.warn('SettingsManager not properly initialized');
            }
            
            // Initialize file handler for CSV processing with safety check
            try {
                this.fileHandler = new FileHandler(this.logger, this.uiManager);
            } catch (error) {
                this.logger.error('Failed to initialize FileHandler:', error);
                this.fileHandler = null;
            }
            
            // Initialize secret field toggle for secure input handling with safety check
            try {
                this.secretFieldToggle = new SecretFieldToggle();
                if (this.secretFieldToggle && typeof this.secretFieldToggle.init === 'function') {
                    this.secretFieldToggle.init();
                }
            } catch (error) {
                this.logger.error('Failed to initialize SecretFieldToggle:', error);
                this.secretFieldToggle = null;
            }
            
            // Load application settings from storage with safety check
            try {
                await this.loadSettings();
            } catch (error) {
                this.logger.error('Failed to load settings:', error);
            }
            
            // Initialize universal token status after UI manager is ready
            try {
                this.updateUniversalTokenStatus();
            } catch (error) {
                this.logger.error('Failed to update universal token status:', error);
            }
            
            // Set up event listeners with safety check
            try {
                this.setupEventListeners();
            } catch (error) {
                this.logger.error('Failed to setup event listeners:', error);
            }
            
            // Check disclaimer status and setup if needed
            // Ensures user has accepted terms before using the tool
            try {
                const disclaimerPreviouslyAccepted = this.checkDisclaimerStatus();
                if (!disclaimerPreviouslyAccepted) {
                    console.log('Disclaimer not previously accepted, setting up disclaimer agreement');
                    this.setupDisclaimerAgreement();
                } else {
                    console.log('Disclaimer previously accepted, tool already enabled');
                }
            } catch (error) {
                this.logger.error('Failed to setup disclaimer:', error);
            }
            
            // Check server connection status to ensure backend is available
            try {
                await this.checkServerConnectionStatus();
            } catch (error) {
                this.logger.error('Failed to check server connection status:', error);
            }
            
            // Update import button state after initialization
            // Ensures UI reflects current application state
            try {
                this.updateImportButtonState();
            } catch (error) {
                this.logger.error('Failed to update import button state:', error);
            }
            
            // Update version information in UI for user reference
            try {
                if (this.versionManager && typeof this.versionManager.updateTitle === 'function') {
                    this.versionManager.updateTitle();
                }
            } catch (error) {
                this.logger.error('Failed to update version information:', error);
            }
            
            console.log('App initialization complete');
            console.log("✅ Moved Import Progress section below Import Users button");
            
        } catch (error) {
            console.error('Error initializing app:', error);
            this.logger.error('App initialization failed', error);
            
            // Show user-friendly error message
            try {
                if (this.uiManager && typeof this.uiManager.showError === 'function') {
                    this.uiManager.showError('Initialization Error', 'Failed to initialize the application. Please refresh the page and try again.');
                }
            } catch (uiError) {
                console.error('Failed to show error message:', uiError);
            }
        }
    }

    async initAPIFactory() {
        try {
            await initAPIFactory(this.logger, this.settingsManager);
            console.log('✅ API Factory initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize API Factory:', error);
            throw error;
        }
    }

    /**
     * Generic population loader for any dropdown by ID
     */
    async loadPopulationsForDropdown(dropdownId) {
        const select = document.getElementById(dropdownId);
        if (select) {
            select.disabled = true;
            select.innerHTML = '<option value="">Loading populations...</option>';
        }
        this.hidePopulationRetryButton(dropdownId);
        try {
            if (!this.localClient) throw new Error('Internal error: API client unavailable');
            const response = await this.localClient.get('/api/pingone/populations');
            if (Array.isArray(response)) {
                this.populatePopulationDropdown(dropdownId, response);
                this.hidePopulationRetryButton(dropdownId);
            } else {
                this.showPopulationLoadError(dropdownId, 'Invalid response from server');
            }
        } catch (error) {
            this.showPopulationLoadError(dropdownId, error && error.message ? error.message : 'Failed to load populations');
        }
    }

    /**
     * Populate a dropdown with populations
     */
    populatePopulationDropdown(dropdownId, populations) {
        const select = document.getElementById(dropdownId);
        if (!select) return;
        select.innerHTML = '';
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Select a population...';
        select.appendChild(defaultOption);
        populations.forEach(population => {
            const option = document.createElement('option');
            option.value = population.id;
            option.textContent = population.name;
            select.appendChild(option);
        });
        select.disabled = false;
        // Attach change listener if needed (only for main import)
        if (dropdownId === 'import-population-select') {
            this.attachPopulationChangeListener();
            this.updateImportButtonState();
        }
    }

    /**
     * Show error and retry for a dropdown
     */
    showPopulationLoadError(dropdownId, message) {
        const select = document.getElementById(dropdownId);
        if (select) {
            select.innerHTML = `<option value="">${message || 'Failed to load populations'}</option>`;
            select.disabled = true;
        }
        this.showPopulationRetryButton(dropdownId);
        if (dropdownId === 'import-population-select') {
            this.uiManager.showError('Failed to load populations', message || 'Please check your PingOne connection and try again.');
        }
    }

    /**
     * Show retry button for a dropdown
     */
    showPopulationRetryButton(dropdownId) {
        const retryId = `retry-${dropdownId}`;
        let retryBtn = document.getElementById(retryId);
        if (!retryBtn) {
            retryBtn = document.createElement('button');
            retryBtn.id = retryId;
            retryBtn.textContent = 'Retry';
            retryBtn.className = 'btn btn-secondary';
            retryBtn.style.marginTop = '10px';
            const parent = document.getElementById(dropdownId)?.parentElement;
            if (parent) parent.appendChild(retryBtn);
        }
        retryBtn.onclick = () => {
            retryBtn.disabled = true;
            this.loadPopulationsForDropdown(dropdownId);
        };
        retryBtn.style.display = 'inline-block';
    }

    /**
     * Hide retry button for a dropdown
     */
    hidePopulationRetryButton(dropdownId) {
        const retryBtn = document.getElementById(`retry-${dropdownId}`);
        if (retryBtn) retryBtn.style.display = 'none';
    }

    // Update all usages to use the generic loader
    async loadPopulations() {
        await this.loadPopulationsForDropdown('import-population-select');
    }
    // For dashboard, delete, modify, and main population select
    async loadAllPopulationDropdowns() {
        await Promise.all([
            this.loadPopulationsForDropdown('import-population-select'),
            this.loadPopulationsForDropdown('dashboard-population-select'),
            this.loadPopulationsForDropdown('delete-population-select'),
            this.loadPopulationsForDropdown('modify-population-select')
        ]);
    }

    updateImportButtonState() {
        try {
            const populationSelect = document.getElementById('import-population-select');
            const hasFile = this.fileHandler && this.fileHandler.getCurrentFile() !== null;
            
            // Validate file handler exists
            if (!this.fileHandler) {
                console.warn('File handler not initialized');
            }
            
            // Check both the dropdown value and the stored properties
            const dropdownValue = populationSelect ? populationSelect.value : '';
            const storedPopulationId = this.selectedPopulationId || '';
            const hasPopulation = (dropdownValue && dropdownValue !== '') || (storedPopulationId && storedPopulationId !== '');
            
            // Production logging (reduced verbosity)
            if (window.DEBUG_MODE) {
                console.log('=== Update Import Button State ===');
                console.log('Has file:', hasFile);
                console.log('Has population:', hasPopulation);
                console.log('Dropdown value:', dropdownValue);
                console.log('Stored population ID:', storedPopulationId);
                console.log('Stored population name:', this.selectedPopulationName);
                console.log('Population select element exists:', !!populationSelect);
                console.log('====================================');
            }
            
            // Get both import buttons with validation
            const topImportBtn = document.getElementById('start-import');
            const bottomImportBtn = document.getElementById('bottom-start-import');
            
            const shouldEnable = hasFile && hasPopulation;
            
            // Safely update button states
            if (topImportBtn && typeof topImportBtn.disabled !== 'undefined') {
                topImportBtn.disabled = !shouldEnable;
            }
            
            if (bottomImportBtn && typeof bottomImportBtn.disabled !== 'undefined') {
                bottomImportBtn.disabled = !shouldEnable;
            }
            
            if (window.DEBUG_MODE) {
                console.log('Import buttons enabled:', shouldEnable);
            }
            
            // Update population display in import stats if available
            if (hasPopulation) {
                const populationNameElement = document.getElementById('import-population-name');
                const populationIdElement = document.getElementById('import-population-id');
                
                if (populationNameElement && typeof populationNameElement.textContent !== 'undefined') {
                    populationNameElement.textContent = this.selectedPopulationName || populationSelect?.selectedOptions[0]?.text || 'Selected';
                }
                
                if (populationIdElement && typeof populationIdElement.textContent !== 'undefined') {
                    populationIdElement.textContent = this.selectedPopulationId || dropdownValue || 'Set';
                }
            }
            
            // At the end, show the population prompt if needed
            this.showPopulationChoicePrompt();
            
        } catch (error) {
            console.error('Error updating import button state:', error);
            // Fallback: disable buttons on error
            const buttons = document.querySelectorAll('#start-import, #bottom-start-import');
            buttons.forEach(btn => {
                if (btn && typeof btn.disabled !== 'undefined') {
                    btn.disabled = true;
                }
            });
        }
    }

    async loadSettings() {
        try {
            const response = await this.localClient.get('/api/settings');
            
            if (response.success && response.data) {
                // Convert kebab-case to camelCase for the form
                let populationId = response.data['population-id'] || '';
                if (populationId === 'not set') populationId = '';
                const settings = {
                    environmentId: response.data['environment-id'] || '',
                    apiClientId: response.data['api-client-id'] || '',
                    apiSecret: response.data['api-secret'] || '',
                    populationId,
                    region: response.data['region'] || 'NorthAmerica',
                    rateLimit: response.data['rate-limit'] || 90
                };
                
                this.populateSettingsForm(settings);
                this.logger.info('Settings loaded and populated into form');
                
                // Show current token status if PingOneClient is available
                if (this.pingOneClient) {
                    const tokenInfo = this.pingOneClient.getCurrentTokenTimeRemaining();
                    this.uiManager.showCurrentTokenStatus(tokenInfo);
                    
                    if (window.DEBUG_MODE) {
                        console.log('Current token status:', tokenInfo);
                    }
                }
            } else {
                this.logger.warn('No settings found or failed to load settings');
            }
        } catch (error) {
            this.logger.error('Failed to load settings:', error);
        }
    }

    setupEventListeners() {
        // File upload event listeners
        const csvFileInput = document.getElementById('csv-file');
        if (csvFileInput) {
            csvFileInput.addEventListener('change', (event) => {
                const file = event.target.files[0];
                if (file) {
                    this.handleFileSelect(file);
                }
            });
        }

        // Population selection change listener
        this.attachPopulationChangeListener();

        // Import event listeners with error handling
        const startImportBtn = document.getElementById('start-import');
        if (startImportBtn) {
            startImportBtn.addEventListener('click', async (e) => {
                try {
                    e.preventDefault();
                    e.stopPropagation();
                    await this.startImport();
                } catch (error) {
                    console.error('Error in start import handler:', error);
                    if (this.uiManager && typeof this.uiManager.showError === 'function') {
                        this.uiManager.showError('Import Error', 'Failed to start import. Please try again.');
                    }
                }
            });
        }

        const startImportBtnBottom = document.getElementById('bottom-start-import');
        if (startImportBtnBottom) {
            startImportBtnBottom.addEventListener('click', async (e) => {
                try {
                    e.preventDefault();
                    e.stopPropagation();
                    await this.startImport();
                } catch (error) {
                    console.error('Error in bottom start import handler:', error);
                    if (this.uiManager && typeof this.uiManager.showError === 'function') {
                        this.uiManager.showError('Import Error', 'Failed to start import. Please try again.');
                    }
                }
            });
        }

        const cancelImportBtn = document.getElementById('cancel-import-btn');
        if (cancelImportBtn) {
            cancelImportBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.cancelImport();
            });
        }

        const cancelImportBtnBottom = document.getElementById('cancel-import-btn-bottom');
        if (cancelImportBtnBottom) {
            cancelImportBtnBottom.addEventListener('click', (e) => {
                e.preventDefault();
                this.cancelImport();
            });
        }

        // Export event listeners
        const startExportBtn = document.getElementById('start-export-btn');
        if (startExportBtn) {
            startExportBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                await this.startExport();
            });
        }

        const cancelExportBtn = document.getElementById('cancel-export-btn');
        if (cancelExportBtn) {
            cancelExportBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.cancelExport();
            });
        }

        // Delete event listeners
        const startDeleteBtn = document.getElementById('start-delete-btn');
        if (startDeleteBtn) {
            startDeleteBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                await this.startDelete();
            });
        }

        const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
        if (cancelDeleteBtn) {
            cancelDeleteBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.cancelDelete();
            });
        }

        // Modify event listeners
        const startModifyBtn = document.getElementById('start-modify-btn');
        if (startModifyBtn) {
            startModifyBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                await this.startModify();
            });
        }

        const cancelModifyBtn = document.getElementById('cancel-modify-btn');
        if (cancelModifyBtn) {
            cancelModifyBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.cancelModify();
            });
        }

        // Population delete event listeners
        const startPopulationDeleteBtn = document.getElementById('start-population-delete-btn');
        if (startPopulationDeleteBtn) {
            startPopulationDeleteBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                await this.startPopulationDelete();
            });
        }

        const cancelPopulationDeleteBtn = document.getElementById('cancel-population-delete-btn');
        if (cancelPopulationDeleteBtn) {
            cancelPopulationDeleteBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.cancelPopulationDelete();
            });
        }

        // Settings form event listeners
        const settingsForm = document.getElementById('settings-form');
        if (settingsForm) {
            settingsForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(settingsForm);
                
                // Get API secret from SecretFieldManager
                const apiSecret = this.secretFieldToggle.getValue();
                
                const settings = {
                    environmentId: formData.get('environment-id'),
                    apiClientId: formData.get('api-client-id'),
                    apiSecret: apiSecret,
                    populationId: formData.get('population-id'),
                    region: formData.get('region'),
                    rateLimit: parseInt(formData.get('rate-limit')) || 90
                };
                await this.handleSaveSettings(settings);
            });
        }

        // Test connection button
        const testConnectionBtn = document.getElementById('test-connection-btn');
        if (testConnectionBtn) {
            testConnectionBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                await this.testConnection();
            });
        }

        // Population dropdown event listener
        const populationSelect = document.getElementById('import-population-select');
        if (populationSelect) {
            console.log('Setting up population select event listener...');
            populationSelect.addEventListener('change', (e) => {
                const selectedPopulationId = e.target.value;
                const selectedPopulationName = e.target.selectedOptions[0]?.text || '';
                
                console.log('=== Population Selection Changed ===');
                console.log('Selected Population ID:', selectedPopulationId);
                console.log('Selected Population Name:', selectedPopulationName);
                console.log('Event target:', e.target);
                console.log('All options:', Array.from(e.target.options).map(opt => ({ value: opt.value, text: opt.text, selected: opt.selected })));
                console.log('====================================');
                
                // Update the import button state based on population selection
                this.updateImportButtonState();
                
                // Scrolls user to Import button immediately after selecting a population to ensure visibility of next action
                if (selectedPopulationId && selectedPopulationId !== '') {
                    setTimeout(() => {
                        const importButton = document.getElementById('start-import-btn');
                        if (importButton) {
                            importButton.scrollIntoView({
                                behavior: 'smooth',
                                block: 'center',
                                inline: 'nearest'
                            });
                            console.log('[Population Select] ✅ Scrolled to Import button smoothly');
                        } else {
                            console.warn('[Population Select] Import button not found for scrolling');
                        }
                    }, 100); // Small delay to ensure UI updates are complete
                }
            });
        } else {
            console.warn('Population select element not found in DOM');
        }

        // Get token button
        const getTokenBtn = document.getElementById('get-token-btn');
        if (getTokenBtn) {
            console.log('Setting up Get Token button event listener...');
            getTokenBtn.addEventListener('click', async (e) => {
                console.log('Get Token button clicked!');
                e.preventDefault();
                e.stopPropagation();
                await this.getToken();
            });
        } else {
            console.warn('Get Token button not found in DOM');
        }

        // Navigation event listeners
        const navItems = document.querySelectorAll('[data-view]');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const view = item.getAttribute('data-view');
                this.showView(view);
            });
        });

        // Feature flags panel toggle - Enhanced with full functionality
        const featureFlagsToggle = document.getElementById('feature-flags-toggle');
        if (featureFlagsToggle) {
            featureFlagsToggle.addEventListener('click', () => {
                const panel = document.getElementById('feature-flags-panel');
                if (panel) {
                    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
                }
            });
        }

        // Feature flag toggles - Enhanced with data attributes
        const featureFlagToggles = document.querySelectorAll('[data-feature-flag]');
        featureFlagToggles.forEach(toggle => {
            toggle.addEventListener('change', async (e) => {
                const flag = e.target.getAttribute('data-feature-flag');
                const enabled = e.target.checked;
                await this.toggleFeatureFlag(flag, enabled);
            });
        });

        // Feature flags close button - Prevents user confusion due to broken UI controls
        const closeFeatureFlagsBtn = document.getElementById('close-feature-flags');
        if (closeFeatureFlagsBtn) {
            closeFeatureFlagsBtn.addEventListener('click', () => {
                const panel = document.getElementById('feature-flags-panel');
                if (panel) {
                    panel.style.display = 'none';
                }
            });
        }

        // Feature flags reset button - Ensures visibility and full control of feature flags for debugging and configuration
        const resetFeatureFlagsBtn = document.getElementById('reset-feature-flags');
        if (resetFeatureFlagsBtn) {
            resetFeatureFlagsBtn.addEventListener('click', async () => {
                try {
                    await this.resetFeatureFlags();
                    this.showFeatureFlagsStatus('All feature flags reset to defaults', 'success');
                } catch (error) {
                    this.showFeatureFlagsStatus('Failed to reset feature flags', 'error');
                }
            });
        }

        // Add new feature flag functionality
        const addFeatureFlagBtn = document.getElementById('add-feature-flag');
        if (addFeatureFlagBtn) {
            addFeatureFlagBtn.addEventListener('click', async () => {
                await this.addNewFeatureFlag();
            });
        }

        // Import progress close button
        const closeImportStatusBtn = document.getElementById('close-import-status');
        if (closeImportStatusBtn) {
            closeImportStatusBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const importStatus = document.getElementById('import-status');
                if (importStatus) {
                    importStatus.style.display = 'none';
                }
            });
        }
    }

    async checkServerConnectionStatus() {
        try {
            console.log('🔄 Starting server connection check...');
            const response = await this.localClient.get('/api/health');
            console.log('✅ Health check response received:', response);
            
            // The localClient.get() returns the response data directly, not wrapped in a data property
            // Handle the response structure correctly
            const responseData = response || {};
            const serverInfo = responseData?.server || {};
            const checks = responseData?.checks || {};
            
            console.log('📊 Parsed response data:', {
                responseData,
                serverInfo,
                checks
            });
            
            // Safely extract pingOne status with multiple fallback paths
            const pingOneInitialized = serverInfo?.pingOneInitialized || 
                                     serverInfo?.pingOne?.initialized || 
                                     checks?.pingOneConnected === 'ok' || 
                                     false;
            
            // Additional check: if pingOneConnected is 'ok', consider it initialized
            const isConnected = checks?.pingOneConnected === 'ok';
            
            // Safely extract error information with multiple fallback paths
            const lastError = serverInfo?.lastError || 
                            serverInfo?.error || 
                            checks?.pingOneConfigured === 'error' ? 'Configuration error' : null ||
                            null;
            
            console.log('🔍 Status analysis:', {
                pingOneInitialized,
                lastError,
                checks
            });
            
            if (pingOneInitialized || isConnected) {
                this.safeLogger.info('Server is connected to PingOne');
                this.uiManager.updateConnectionStatus('connected', 'Connected to PingOne');
                
                // Check if we have a valid cached token before hiding home token status
                let hasValidToken = false;
                if (this.pingOneClient && typeof this.pingOneClient.getCachedToken === 'function') {
                    const cachedToken = this.pingOneClient.getCachedToken();
                    if (cachedToken) {
                        if (typeof localStorage !== 'undefined') {
                            const expiry = localStorage.getItem('pingone_token_expiry');
                            if (expiry) {
                                const expiryTime = parseInt(expiry);
                                if (Date.now() < expiryTime) {
                                    hasValidToken = true;
                                }
                            }
                        }
                    }
                } else if (this.pingOneClient) {
                    this.safeLogger.warn('pingOneClient.getCachedToken is not a function', this.pingOneClient);
                }
                
                if (hasValidToken) {
                    this.uiManager.updateHomeTokenStatus(false);
                } else {
                    this.uiManager.updateHomeTokenStatus(true, 'You need to configure your PingOne API credentials and get a token before using this tool.');
                }
                return true;
            } else {
                const errorMessage = lastError || 'Not connected to PingOne';
                this.safeLogger.warn('Server is not connected to PingOne', { error: errorMessage });
                this.uiManager.updateConnectionStatus('disconnected', errorMessage);
                
                // Check if we have a valid cached token before showing home token status
                hasValidToken = false;
                if (this.pingOneClient && typeof this.pingOneClient.getCachedToken === 'function') {
                    const cachedToken = this.pingOneClient.getCachedToken();
                    if (cachedToken) {
                        if (typeof localStorage !== 'undefined') {
                            const expiry = localStorage.getItem('pingone_token_expiry');
                            if (expiry) {
                                const expiryTime = parseInt(expiry);
                                if (Date.now() < expiryTime) {
                                    hasValidToken = true;
                                }
                            }
                        }
                    }
                } else if (this.pingOneClient) {
                    this.safeLogger.warn('pingOneClient.getCachedToken is not a function', this.pingOneClient);
                }
                
                if (hasValidToken) {
                    this.uiManager.updateHomeTokenStatus(false);
                } else {
                    this.uiManager.updateHomeTokenStatus(true, 'You need to configure your PingOne API credentials and get a token before using this tool.');
                }
                return false;
            }
        } catch (error) {
            // Handle network errors, malformed responses, or server unavailability
            const errorMessage = error?.message || (typeof error === 'string' ? error : JSON.stringify(error));
            const statusMessage = `Failed to check server status: ${errorMessage}`;
            
            // Always log as a string
            console.error('❌ Server connection check failed:', errorMessage);
            this.safeLogger.error('Server connection check failed', errorMessage);
            
            this.uiManager.updateConnectionStatus('error', statusMessage);
            
            // Check if we have a valid cached token before showing home token status
            hasValidToken = false;
            if (this.pingOneClient && typeof this.pingOneClient.getCachedToken === 'function') {
                const cachedToken = this.pingOneClient.getCachedToken();
                if (cachedToken) {
                    if (typeof localStorage !== 'undefined') {
                        const expiry = localStorage.getItem('pingone_token_expiry');
                        if (expiry) {
                            const expiryTime = parseInt(expiry);
                            if (Date.now() < expiryTime) {
                                hasValidToken = true;
                            }
                        }
                    }
                }
            } else if (this.pingOneClient) {
                this.safeLogger.warn('pingOneClient.getCachedToken is not a function', this.pingOneClient);
            }
            
            if (hasValidToken) {
                this.uiManager.updateHomeTokenStatus(false);
            } else {
                this.uiManager.updateHomeTokenStatus(true, 'You need to configure your PingOne API credentials and get a token before using this tool.');
            }
            return false;
        }
    }

    showView(view) {
        if (!view) return;
        
        // Hide all views with safe iteration
        const views = document.querySelectorAll('.view');
        if (views && views.length > 0) {
            views.forEach(v => {
                if (v && v.style) {
                    v.style.display = 'none';
                }
            });
        }
        
        // Show selected view
        const selectedView = document.getElementById(`${view}-view`);
        if (selectedView) {
            selectedView.style.display = 'block';
            this.currentView = view;
            
            // Handle universal token status visibility
            this.handleTokenStatusVisibility(view);
            
            // Refresh progress page when progress view is shown
            if (view === 'progress') {
                this.refreshProgressPage();
            }
            
            // Load settings when navigating to settings view
            if (view === 'settings') {
                this.loadSettings();
                this.uiManager.updateSettingsSaveStatus('Please configure your API credentials and test the connection.', 'info');
            }
            
            // Load populations when navigating to import view
            if (view === 'import') {
                console.log('🔄 Navigating to import view, loading populations...');
                this.loadPopulations();
            }
            
            // Update navigation with safe navItems handling
            this.updateNavigationActiveState(view);
            
            // Update universal token status when switching views
            this.updateUniversalTokenStatus();
        }
    }

    /**
     * Safely update navigation active state
     * 
     * Handles navigation item updates with proper null checks and fallbacks.
     * Prevents crashes when navItems is undefined or DOM elements are missing.
     * 
     * @param {string} view - The current view being displayed
     */
    updateNavigationActiveState(view) {
        try {
            // Get navItems safely with fallback
            let navItems = [];
            
            // Try to get navItems from UIManager first
            if (this.uiManager && this.uiManager.navItems) {
                navItems = this.uiManager.navItems;
            } else {
                // Fallback to direct DOM query
                navItems = document.querySelectorAll('[data-view]');
            }
            
            // Ensure navItems is an array-like object before iterating
            if (navItems && navItems.length > 0) {
                navItems.forEach(item => {
                    if (item && item.classList) {
                        item.classList.remove('active');
                        if (item.getAttribute('data-view') === view) {
                            item.classList.add('active');
                        }
                    }
                });
            } else {
                // Log warning if no navigation items found
                this.logger?.warn('No navigation items found for view update', { view });
            }
        } catch (error) {
            // Log error but don't crash the app
            console.error('Error updating navigation state:', error);
            this.logger?.error('Failed to update navigation state', { 
                error: error.message, 
                view 
            });
        }
    }

    /**
     * Handle token status visibility based on current view
     * 
     * Controls when the universal token status bar should be visible
     * based on the current page. This ensures users see token status
     * on functional pages but not on the home page with disclaimer.
     * 
     * @param {string} view - The current view being displayed
     */
    handleTokenStatusVisibility(view) {
        try {
            const tokenStatusBar = document.getElementById('universal-token-status');
            if (!tokenStatusBar) return;
            
            // Hide token status on home page (disclaimer page)
            if (view === 'home') {
                tokenStatusBar.style.display = 'none';
            } else {
                // Show token status on all other pages
                tokenStatusBar.style.display = 'block';
            }
            
        } catch (error) {
            console.error('Error handling token status visibility:', error);
        }
    }

    async handleSaveSettings(settings) {
        try {
            this.logger.info('Saving settings', settings);
            
            // Update settings save status to show saving
            this.uiManager.updateSettingsSaveStatus('Saving settings...', 'info');
            
            // Just save settings without testing connections
            const response = await this.localClient.post('/api/settings', settings);
            
            // Update settings manager
            this.settingsManager.updateSettings(settings);
            
            // Update API clients with new settings
            this.pingOneClient = apiFactory.getPingOneClient(this.logger, this.settingsManager);
            
            // Update settings save status to show success
            this.uiManager.updateSettingsSaveStatus('✅ Settings saved successfully', 'success');
            // Show green notification
            this.uiManager.showSuccess('Settings saved for PingOne');
            
            // Repopulate the form (if needed)
            this.populateSettingsForm(settings);
            
            // Now update connection status area with check mark and message
            const connStatus = document.getElementById('settings-connection-status');
            if (connStatus) {
                connStatus.textContent = '✅ Settings saved! Please - Get token';
                connStatus.classList.remove('status-disconnected', 'status-error');
                connStatus.classList.add('status-success');
                console.log('Updated #settings-connection-status after save (post-populate)');
            }
        } catch (error) {
            this.logger.error('Failed to save settings', { error: error.message });
            this.uiManager.updateSettingsSaveStatus('❌ Failed to save settings: ' + error.message, 'error');
        }
    }

    populateSettingsForm(settings) {
        if (!settings) {
            this.logger.warn('No settings provided to populate form');
            return;
        }
        
        const fields = {
            'environment-id': settings.environmentId || '',
            'api-client-id': settings.apiClientId || '',
            'api-secret': settings.apiSecret || '',
            'population-id': settings.populationId || '',
            'region': settings.region || 'NorthAmerica',
            'rate-limit': settings.rateLimit || 90
        };
        
        const missingFields = [];
        
        for (const [id, value] of Object.entries(fields)) {
            try {
                const element = document.getElementById(id);
                if (!element) {
                    missingFields.push(id);
                    continue;
                }
                
                // Handle API secret using SecretFieldManager
                if (id === 'api-secret') {
                    this.secretFieldToggle.setValue(value);
                } else {
                    element.value = value;
                }
            } catch (error) {
                this.logger.error(`Error setting field ${id}`, { error: error.message });
                missingFields.push(id);
            }
        }
        
        if (missingFields.length > 0) {
            this.logger.warn('Missing form fields', { missingFields });
        }
    }

    // Helper: Validate UUID v4
    isValidUUID(uuid) {
        return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid);
    }

    /**
     * Handles file selection from the UI, parses CSV, and triggers population conflict logic if needed
     * @param {File} file - The selected CSV file
     */
    async handleFileSelect(file) {
        try {
            // Log file selection for debugging
            this.uiManager.debugLog("FileUpload", `File selected: ${file.name}, size: ${file.size}`);
            await this.fileHandler.setFile(file);
            this.uiManager.showSuccess('File selected successfully', `Selected file: ${file.name}`);
            // Update import button state after file selection
            this.updateImportButtonState();

            // --- ALWAYS IGNORE CSV POPULATION DATA ---
            // Get users from CSV for logging purposes only
            const users = this.fileHandler.getParsedUsers ? this.fileHandler.getParsedUsers() : [];
            // Log number of users parsed from CSV
            this.uiManager.debugLog("CSV", `Parsed ${users.length} users from CSV`);
            
            // Get selected population from UI dropdown
            const populationSelect = document.getElementById('import-population-select');
            const uiPopulationId = populationSelect && populationSelect.value;
            
            // Log selected population
            this.uiManager.debugLog("Population", `Selected population: ${uiPopulationId}`);
            
            // ALWAYS use UI population selection and ignore any CSV population data
            if (uiPopulationId) {
                // Overwrite all user records with UI populationId, ignoring any CSV population data
                users.forEach(u => {
                    // Remove any existing population data from CSV
                    delete u.populationId;
                    delete u.population_id;
                    delete u.populationName;
                    delete u.population_name;
                    
                    // Set the UI-selected population
                    u.populationId = uiPopulationId;
                });
                
                this.populationChoice = 'ui';
                this.uiManager.showInfo('Using UI dropdown population selection (CSV population data ignored)');
                
                // Log the population assignment
                this.uiManager.debugLog("Population", `Assigned UI population ${uiPopulationId} to all ${users.length} users`);
            } else {
                // No UI population selected - this will be handled by validation later
                this.populationChoice = 'ui';
                this.uiManager.showWarning('No population selected in UI dropdown');
            }
            
            // Show population prompt if needed (legacy)
            this.showPopulationChoicePrompt();
        } catch (error) {
            this.uiManager.showError('Failed to select file', error.message);
        }
    }

    /**
     * Starts the user import flow with real-time progress tracking
     * 
     * Validates user inputs, sends CSV data to the server, and establishes
     * a Server-Sent Events (SSE) connection for real-time progress updates.
     * Handles error states, retry logic, and user feedback throughout the process.
     * 
     * @returns {Promise<void>}
     */
    async startImport() {
        // Prevent multiple simultaneous imports
        if (this.isImporting) {
            this.logger.warn('Import already in progress');
            return;
        }

        // Enhanced logging for import start
        console.log('🚀 [IMPORT] Starting import process');
        this.logger.info('Starting import process');

        // Fetch selected population name and ID from dropdown
        const popSelect = document.getElementById('import-population-select');
        let populationId = popSelect && popSelect.value ? popSelect.value : '';
        let populationName = '';
        if (popSelect) {
            const selectedOption = popSelect.options[popSelect.selectedIndex];
            populationName = selectedOption ? selectedOption.text : '';
        }
        
        // Debug logging for population selection
        console.log('🔍 [Population Debug] Dropdown state:', {
            element: popSelect,
            selectedIndex: popSelect ? popSelect.selectedIndex : 'N/A',
            value: populationId,
            text: populationName,
            optionsCount: popSelect ? popSelect.options.length : 0
        });
        
        // Store for use in progress updates
        this.selectedPopulationId = populationId;
        this.selectedPopulationName = populationName;
        
        // Debug logging for stored values
        console.log('🔍 [Population Debug] Stored values:', {
            selectedPopulationId: this.selectedPopulationId,
            selectedPopulationName: this.selectedPopulationName
        });
        
        // Log at import trigger to confirm the correct value is being used
        console.log('🚀 [Import Trigger] Using population:', {
            id: populationId,
            name: populationName
        });
        
        // Debug warning if population name is "Test"
        if (populationName === 'Test') {
            console.warn('⚠️ [Population Debug] WARNING: Population name is "Test" - this might be a default value');
            console.log('⚠️ [Population Debug] Dropdown state when "Test" selected:', {
                selectedIndex: popSelect ? popSelect.selectedIndex : 'N/A',
                allOptions: popSelect ? Array.from(popSelect.options).map((opt, idx) => ({
                    index: idx,
                    value: opt.value,
                    text: opt.text,
                    selected: opt.selected
                })) : []
            });
        }

        // Initialize SSE status indicator and fallback polling
        ensureSSEStatusIndicator();
        this.robustSSE = null;
        this.fallbackPolling = null;
        
        /**
         * Establishes robust SSE connection for real-time import progress updates
         * 
         * Uses the new RobustEventSource wrapper with exponential backoff,
         * connection status indicators, and automatic fallback to polling.
         * 
         * @param {string} sessionId - Unique session identifier for this import
         */
        const connectRobustSSE = (sessionId) => {
            // Validate sessionId before attempting connection
            if (!sessionId || typeof sessionId !== 'string' || sessionId.trim() === '') {
                console.error("SSE: ❌ Invalid sessionId - cannot establish connection", { sessionId });
                this.uiManager.debugLog("SSE", "❌ Invalid sessionId - cannot establish connection", { sessionId });
                this.uiManager.showError('SSE Connection Error', 'Invalid session ID. Cannot establish progress connection.');
                this.uiManager.showError('SSE Connection Failed', 'Missing session ID');
                this.isImporting = false;
                return;
            }

            // Check if EventSource is supported in the browser
            if (!window.EventSource) {
                console.error("SSE: ❌ EventSource not supported in this browser");
                this.uiManager.debugLog("SSE", "❌ EventSource not supported in this browser");
                this.uiManager.showError('SSE Not Supported', 'Your browser does not support Server-Sent Events. Progress updates will not be available.');
                this.uiManager.showError('SSE Not Supported', 'Server-Sent Events not supported in this browser');
                this.isImporting = false;
                return;
            }

            // Log SSE connection attempt for debugging
            console.log("SSE: 🔌 Establishing robust SSE connection with sessionId:", sessionId);
            this.uiManager.debugLog("SSE", `🔄 Establishing robust SSE connection with sessionId: ${sessionId}`);
            this.uiManager.showInfo(`SSE: Opening robust connection with sessionId: ${sessionId}`);
            
            // Create robust SSE connection with enhanced features
            const sseUrl = `/api/import/progress/${sessionId}`;
            this.robustSSE = new RobustEventSource(sseUrl, {
                maxRetries: 5,
                baseDelay: 1000,
                maxDelay: 30000,
                
                // Connection status updates
                onStatus: (status, data) => {
                    console.log(`SSE: Status update - ${status}`, data);
                    this.uiManager.debugLog("SSE", `Status update: ${status}`, data);
                    updateSSEStatusIndicator(status, false);
                    
                    // Update UI based on connection status
                    switch (status) {
                        case 'connecting':
                            this.uiManager.showInfo('SSE: Connecting to server...');
                            break;
                        case 'connected':
                            this.uiManager.showSuccess('SSE: Real-time connection established');
                            // Stop fallback polling if it was active
                            if (this.fallbackPolling) {
                                stopFallbackPolling();
                                this.fallbackPolling = null;
                            }
                            break;
                        case 'reconnecting':
                            this.uiManager.showWarning(`SSE: Reconnecting... Attempt ${data.attempt}/${data.maxRetries}`);
                            break;
                        case 'failed':
                            this.uiManager.showError('SSE Connection Failed', 'Switching to fallback mode');
                            // Start fallback polling
                            if (!this.fallbackPolling) {
                                this.fallbackPolling = startFallbackPolling(sseUrl, (progressData) => {
                                    this.handleProgressUpdate(progressData);
                                });
                            }
                            break;
                        case 'disconnected':
                            this.uiManager.showWarning('SSE: Connection lost');
                            break;
                    }
                },
                
                // Handle progress messages
                onMessage: (event) => {
                    console.log("SSE: 📩 Progress message received:", event.data);
                    this.uiManager.debugLog("SSE", "📊 Progress message received", { 
                        data: event.data,
                        lastEventId: event.lastEventId,
                        origin: event.origin 
                    });
                    
                    let data;
                    try {
                        data = JSON.parse(event.data);
                        console.log("SSE: ✅ Progress data parsed successfully:", data);
                        this.uiManager.debugLog("SSE", "✅ Progress data parsed successfully", data);
                    } catch (e) {
                        console.error("SSE: ❌ Failed to parse progress event data:", e.message, "Raw data:", event.data);
                        this.uiManager.debugLog("SSE", "❌ Failed to parse progress event data", { 
                            rawData: event.data, 
                            error: e.message 
                        });
                        this.uiManager.showError('SSE Data Error', 'Received malformed progress data from server');
                        return;
                    }

                    // Handle different event types
                    this.handleProgressUpdate(data);
                },
                
                // Handle connection opened
                onOpen: (event) => {
                    console.log("SSE: ✅ Robust SSE connection opened:", event);
                    this.uiManager.debugLog("SSE", "✅ Robust SSE connection opened", { 
                        event: event 
                    });
                    this.uiManager.showInfo(`SSE connected for import (sessionId: ${sessionId})`);
                    this.uiManager.showStatusMessage('success', 'Real-time connection established', 
                        'Progress updates will be shown in real-time during the import process.');
                },
                
                // Handle connection errors
                onError: (event) => {
                    console.error("SSE: ❌ Robust SSE connection error:", event);
                    this.uiManager.debugLog("SSE", "❌ Robust SSE connection error", { 
                        error: event 
                    });
                                            this.uiManager.showError('SSE Connection Error', 'Connection error occurred');
                    
                    // If robust SSE fails completely, start fallback polling
                    if (!this.fallbackPolling) {
                        console.log("SSE: 🔄 Starting fallback polling due to connection failure");
                        this.uiManager.showWarning('SSE: Switching to fallback polling mode');
                        this.fallbackPolling = startFallbackPolling(sseUrl, (progressData) => {
                            this.handleProgressUpdate(progressData);
                        });
                    }
                }
            });

            // Start the robust connection
            robustSSE.connect();
        };

                /**
         * Handles progress updates from SSE or fallback polling with enhanced progress manager
         * 
         * @param {Object} data - Progress data from server
         */
        this.handleProgressUpdate = (data) => {
            // Validate required fields in progress data
            if (data.current === undefined || data.total === undefined) {
                console.error("Progress: ❌ Progress event missing required fields:", data);
                this.uiManager.debugLog("Progress", "❌ Progress event missing required fields", data);
                this.uiManager.showError('Progress Error', 'Missing required fields (current/total)');
                return;
            }

            // Log which user is currently being processed
            if (data.user) {
                console.log("Progress: 👤 Processing user:", data.user.username || data.user.email || 'unknown');
                this.uiManager.debugLog("Progress", `👤 Processing user: ${data.user.username || data.user.email || 'unknown'}`);
            }

            // Log progress update with current/total counts
            if (data.current !== undefined && data.total !== undefined) {
                const percentage = Math.round(data.current/data.total*100);
                console.log(`Progress: 📈 Progress update: ${data.current} of ${data.total} (${percentage}%)`);
                this.uiManager.debugLog("Progress", `📈 Progress update: ${data.current} of ${data.total} (${percentage}%)`);
            }

            // Handle duplicate users with enhanced progress manager
            if (data.duplicates && data.duplicates.length > 0) {
                console.log("Progress: 🔄 Handling duplicate users:", data.duplicates.length);
                this.uiManager.handleDuplicateUsers(data.duplicates, (mode, duplicates) => {
                    console.log('🔄 [IMPORT] User chose duplicate handling mode:', mode);
                    // Continue import with selected mode
                    this.continueImportWithDuplicateMode(mode, duplicates);
                });
            }

            // Update UI with enhanced progress information
            this.uiManager.updateImportProgress(
                data.current || 0, 
                data.total || 0, 
                data.message || '', 
                data.counts || {}, 
                data.populationName || '', 
                data.populationId || ''
            );

            // Display status message to user if provided
            if (data.message) {
                this.uiManager.showInfo(data.message);
            }
            
            // Log current user being processed if available
            if (data.user) {
                const userName = data.user.username || data.user.email || 'unknown';
                this.uiManager.showInfo(`Processing: ${userName}`);
            }
            
            // Handle skipped users with detailed information
            if (data.status === 'skipped' && data.statusDetails) {
                const skipReason = data.statusDetails.reason || 'User already exists';
                const existingUser = data.statusDetails.existingUser;
                
                // Log detailed skip information
                console.log("Progress: ⚠️ User skipped:", {
                    user: data.user,
                    reason: skipReason,
                    existingUser: existingUser
                });
                
                // Show warning message with skip details
                let skipMessage = `⚠️ Skipped: ${data.user.username || data.user.email || 'unknown user'}`;
                if (existingUser) {
                    skipMessage += ` (exists as ${existingUser.username || existingUser.email} in ${existingUser.population})`;
                } else {
                    skipMessage += ` (${skipReason})`;
                }
                
                this.uiManager.showWarning(skipMessage);
                
                // Update UI with skip information
                if (data.counts && data.counts.skipped !== undefined) {
                    console.log(`Progress: 📊 Skipped count updated: ${data.counts.skipped}`);
                    this.uiManager.debugLog("Progress", `📊 Skipped count updated: ${data.counts.skipped}`);
                }
            }

            // Handle completion with enhanced progress manager
            if (data.status === 'complete' || data.current === data.total) {
                console.log("Progress: ✅ Import completed");
                this.uiManager.completeOperation({
                    success: data.counts?.success || 0,
                    failed: data.counts?.failed || 0,
                    skipped: data.counts?.skipped || 0,
                    duplicates: data.counts?.duplicates || 0
                });
                
                // Clean up connections
                if (this.robustSSE) {
                    this.robustSSE.close();
                    this.robustSSE = null;
                }
                if (this.fallbackPolling) {
                    stopFallbackPolling();
                    this.fallbackPolling = null;
                }
                
                this.isImporting = false;
            }

            // Handle errors
            if (data.status === 'error') {
                console.error("Progress: ❌ Import error:", data.error);
                this.uiManager.showError('Import Error', data.error || 'Unknown error');
                
                // Clean up connections
                if (this.robustSSE) {
                    this.robustSSE.close();
                    this.robustSSE = null;
                }
                if (this.fallbackPolling) {
                    stopFallbackPolling();
                    this.fallbackPolling = null;
                }
                
                this.isImporting = false;
            }
        };

        try {
            // Set import state to prevent multiple simultaneous imports
            this.isImporting = true;
            this.importAbortController = new AbortController();
            
            // Validate import options (file, population, etc.)
            const importOptions = this.getImportOptions();
            if (!importOptions) {
                console.log('❌ [IMPORT] Import options validation failed');
                this.isImporting = false;
                return;
            }

            console.log('✅ [IMPORT] Import options validated:', {
                totalUsers: importOptions.totalUsers,
                populationId: importOptions.selectedPopulationId,
                populationName: importOptions.selectedPopulationName,
                fileName: importOptions.file?.name
            });

            // Start import operation with enhanced progress manager
            this.uiManager.startImportOperation({
                total: importOptions.totalUsers,
                populationName: importOptions.selectedPopulationName,
                populationId: importOptions.selectedPopulationId,
                fileName: importOptions.file?.name
            });

            // Prepare FormData for file upload to server
            // Includes file, population selection, and metadata
            const formData = new FormData();
            formData.append('file', importOptions.file);
            formData.append('selectedPopulationId', importOptions.selectedPopulationId);
            formData.append('selectedPopulationName', importOptions.selectedPopulationName);
            formData.append('totalUsers', importOptions.totalUsers);
            
            // Debug logging for backend request
            console.log('🔍 [Backend Request Debug] Population info being sent:', {
                populationId: importOptions.selectedPopulationId,
                populationName: importOptions.selectedPopulationName,
                totalUsers: importOptions.totalUsers
            });
            
            // Send CSV data and population info to backend for processing
            // The server will start the import process and return a session ID
            console.log('📤 [IMPORT] Sending request to backend...');
            const response = await fetch('/api/import', {
                method: 'POST',
                body: formData,
                signal: this.importAbortController.signal
            });
            
            console.log('📥 [IMPORT] Backend response received:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok
            });
            
            const result = await response.json();
            console.log('📋 [IMPORT] Backend response data:', result);
            
            const sessionId = result.sessionId;
            
            // Validate session ID is present (required for SSE connection)
            if (!sessionId) {
                console.error('❌ [IMPORT] Session ID is missing from backend response');
                this.uiManager.debugLog("Import", "Session ID is undefined. Import cannot proceed.");
                this.uiManager.showError('Import failed', 'Session ID is undefined. Import cannot proceed.');
                this.isImporting = false;
                return;
            }
            
            console.log('✅ [IMPORT] Session ID received:', sessionId);
            
            // Log session ID and establish robust SSE connection for progress updates
            this.uiManager.debugLog("Import", "Session ID received", { sessionId });
            console.log('🔌 [IMPORT] Establishing robust SSE connection with sessionId:', sessionId);
            connectRobustSSE(sessionId);
        } catch (error) {
            console.error('❌ [IMPORT] Error during import process:', error);
            this.uiManager.debugLog("Import", "Error starting import", error);
            this.uiManager.showError('Import failed', error.message || error);
            this.isImporting = false;
        }
    }

    /**
     * Continue import with user's duplicate handling choice
     * 
     * @param {string} mode - Duplicate handling mode ('skip' or 'add')
     * @param {Array} duplicates - Array of duplicate users
     */
    continueImportWithDuplicateMode(mode, duplicates) {
        try {
            console.log('🔄 [IMPORT] Continuing import with duplicate mode:', mode);
            this.uiManager.debugLog("Import", `Continuing import with duplicate mode: ${mode}`);

            // Send the user's choice to the server
            fetch('/api/import/duplicates', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    mode: mode,
                    duplicates: duplicates
                })
            }).then(response => {
                if (response.ok) {
                    console.log('✅ [IMPORT] Duplicate handling choice sent successfully');
                    this.uiManager.showInfo(`Continuing import with ${mode} mode for duplicates`);
                } else {
                    console.error('❌ [IMPORT] Failed to send duplicate handling choice');
                    this.uiManager.showError('Duplicate Handling Error', 'Failed to process duplicate handling choice');
                }
            }).catch(error => {
                console.error('❌ [IMPORT] Error sending duplicate handling choice:', error);
                this.uiManager.showError('Duplicate Handling Error', error.message || 'Unknown error');
            });
        } catch (error) {
            console.error('❌ [IMPORT] Error in continueImportWithDuplicateMode:', error);
            this.uiManager.showError('Duplicate Handling Error', error.message || 'Unknown error');
        }
    }

    /**
     * Validates and retrieves import configuration options
     * 
     * Checks that a population is selected and a CSV file is loaded.
     * Returns the configuration needed to start the import process.
     * Shows appropriate error messages if validation fails.
     * 
     * @returns {Object|null} Import options or null if validation fails
     */
    getImportOptions() {
        const selectedPopulationId = document.getElementById('import-population-select')?.value;
        const selectedPopulationName = document.getElementById('import-population-select')?.selectedOptions[0]?.text || '';
        const skipDuplicatesByEmail = document.getElementById('skip-duplicates')?.checked || false;
        const skipDuplicatesByUsername = document.getElementById('skip-duplicates-username')?.checked || false;
        const sendWelcomeEmail = document.getElementById('send-welcome-email')?.checked || false;
        
        if (!selectedPopulationId) {
            this.uiManager.showError('No population selected', 'Please select a population before starting the import.');
            return null;
        }
        
        // Validate CSV file contains users to import
        const totalUsers = this.fileHandler.getTotalUsers();
        if (!totalUsers || totalUsers === 0) {
            this.uiManager.showError('No users to import', 'Please select a CSV file with users to import.');
            return null;
        }
        
        // Return validated import configuration
        return {
            selectedPopulationId,
            selectedPopulationName,
            totalUsers,
            file: this.fileHandler.getCurrentFile(),
            skipDuplicatesByEmail,
            skipDuplicatesByUsername,
            sendWelcomeEmail
        };
    }

    // Enhanced method to get current population selection with validation
    getCurrentPopulationSelection() {
        const populationSelect = document.getElementById('import-population-select');
        if (!populationSelect) {
            console.error('Population select element not found');
            return null;
        }
        
        // Check both dropdown value and stored properties
        const dropdownValue = populationSelect.value;
        const dropdownText = populationSelect.selectedOptions[0]?.text || '';
        const storedPopulationId = this.selectedPopulationId || '';
        const storedPopulationName = this.selectedPopulationName || '';
        
        // Use stored values if available, otherwise use dropdown values
        const selectedPopulationId = storedPopulationId || dropdownValue;
        const selectedPopulationName = storedPopulationName || dropdownText;
        
        console.log('=== getCurrentPopulationSelection ===');
        console.log('Dropdown ID:', dropdownValue);
        console.log('Dropdown Name:', dropdownText);
        console.log('Stored ID:', storedPopulationId);
        console.log('Stored Name:', storedPopulationName);
        console.log('Final ID:', selectedPopulationId);
        console.log('Final Name:', selectedPopulationName);
        console.log('Select element exists:', !!populationSelect);
        console.log('====================================');
        
        if (!selectedPopulationId || selectedPopulationId === '') {
            return null;
        }
        
        return {
            id: selectedPopulationId,
            name: selectedPopulationName
        };
    }

    // Force refresh population selection to ensure it's current
    forceRefreshPopulationSelection() {
        const populationSelect = document.getElementById('import-population-select');
        if (!populationSelect) {
            console.error('Population select element not found for refresh');
            return null;
        }
        
        // Force a re-read of the current selection
        const currentValue = populationSelect.value;
        const currentText = populationSelect.selectedOptions[0]?.text || '';
        
        console.log('=== forceRefreshPopulationSelection ===');
        console.log('Forced refresh - Population ID:', currentValue);
        console.log('Forced refresh - Population Name:', currentText);
        console.log('==========================================');
        
        return {
            id: currentValue,
            name: currentText
        };
    }

    cancelImport() {
        // Abort the import request
        if (this.importAbortController) {
            this.importAbortController.abort();
        }
        
        // Clean up robust SSE connection if it exists
        if (this.robustSSE) {
            console.log("Import: 🧹 Cleaning up robust SSE connection on cancel");
            this.uiManager.debugLog("Import", "🧹 Cleaning up robust SSE connection on cancel");
            this.robustSSE.close();
            this.robustSSE = null;
        }
        
        // Stop fallback polling if it's active
        if (this.fallbackPolling) {
            console.log("Import: 🧹 Stopping fallback polling on cancel");
            this.uiManager.debugLog("Import", "🧹 Stopping fallback polling on cancel");
            stopFallbackPolling();
            this.fallbackPolling = null;
        }
        
        // Update status indicator
        updateSSEStatusIndicator('disconnected', false);
        
        // Reset import state
        this.isImporting = false;
        
        // Log cancellation
                    this.uiManager.showInfo('Import cancelled by user');
        console.log("Import: 🚫 Import cancelled by user");
    }

    /**
     * Starts the user export flow by validating options, sending request to the server, and handling progress
     */
    async startExport() {
        if (this.isExporting) {
            this.logger.warn('Export already in progress');
            return;
        }
        try {
            this.isExporting = true;
            this.exportAbortController = new AbortController();
            const exportOptions = this.getExportOptions();
            // If no export options, show error and stop
            if (!exportOptions) {
                this.isExporting = false;
                return;
            }
            // Show export status in UI
            this.uiManager.showExportStatus();
            // Send export request to backend
            const response = await this.localClient.post('/api/export-users', exportOptions, {
                signal: this.exportAbortController.signal,
                onProgress: (current, total, message, counts) => {
                    // Update UI with export progress
                    this.uiManager.updateExportProgress(current, total, message, counts);
                }
            });
            // Handle completion
            if (response.success) {
                this.uiManager.updateExportProgress(exportOptions.totalUsers, exportOptions.totalUsers, 'Export completed successfully', response.counts);
                this.uiManager.showSuccess('Export completed successfully', response.message);
            } else {
                this.uiManager.updateExportProgress(0, exportOptions.totalUsers, 'Export failed', response.counts);
                this.uiManager.showError('Export failed', response.error);
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                this.uiManager.updateExportProgress(0, 0, 'Export cancelled');
                this.uiManager.showInfo('Export cancelled');
            } else {
                this.uiManager.updateExportProgress(0, 0, 'Export failed: ' + error.message);
                this.uiManager.showError('Export failed', error.message);
            }
        } finally {
            this.isExporting = false;
            this.exportAbortController = null;
        }
    }

    getExportOptions() {
        const selectedPopulationId = document.getElementById('export-population-select')?.value;
        const selectedPopulationName = document.getElementById('export-population-select')?.selectedOptions[0]?.text || '';
        
        if (!selectedPopulationId) {
            this.uiManager.showError('No population selected', 'Please select a population before starting the export.');
            return null;
        }
        
        return {
            selectedPopulationId,
            selectedPopulationName,
            fields: document.getElementById('export-fields-select')?.value || 'all',
            format: document.getElementById('export-format-select')?.value || 'csv',
            ignoreDisabledUsers: document.getElementById('export-ignore-disabled')?.checked || false
        };
    }

    cancelExport() {
        if (this.exportAbortController) {
            this.exportAbortController.abort();
        }
    }

    /**
     * Starts the user delete flow by validating options, sending request to the server, and handling progress
     */
    async startDelete() {
        if (this.isDeleting) {
            this.logger.warn('Delete already in progress');
            return;
        }
        try {
            this.isDeleting = true;
            this.deleteAbortController = new AbortController();
            const deleteOptions = this.getDeleteOptions();
            // If no delete options, show error and stop
            if (!deleteOptions) {
                this.isDeleting = false;
                return;
            }
            // Show delete status in UI
            this.uiManager.showDeleteStatus(deleteOptions.totalUsers, deleteOptions.populationName, deleteOptions.populationId);
            // Send delete request to backend
            const response = await this.localClient.post('/api/delete-users', deleteOptions, {
                signal: this.deleteAbortController.signal,
                onProgress: (current, total, message, counts) => {
                    // Update UI with delete progress
                    this.uiManager.updateDeleteProgress(current, total, message, counts, deleteOptions.populationName, deleteOptions.populationId);
                }
            });
            // Handle completion
            if (response.success) {
                this.uiManager.updateDeleteProgress(deleteOptions.totalUsers, deleteOptions.totalUsers, 'Delete completed successfully', response.counts, deleteOptions.populationName, deleteOptions.populationId);
                this.uiManager.showSuccess('Delete completed successfully', response.message);
            } else {
                this.uiManager.updateDeleteProgress(0, deleteOptions.totalUsers, 'Delete failed', response.counts, deleteOptions.populationName, deleteOptions.populationId);
                this.uiManager.showError('Delete failed', response.error);
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                this.uiManager.updateDeleteProgress(0, 0, 'Delete cancelled');
                this.uiManager.showInfo('Delete cancelled');
            } else {
                this.uiManager.updateDeleteProgress(0, 0, 'Delete failed: ' + error.message);
                this.uiManager.showError('Delete failed', error.message);
            }
        } finally {
            this.isDeleting = false;
            this.deleteAbortController = null;
        }
    }

    getDeleteOptions() {
        const selectedPopulationId = document.getElementById('delete-population-select')?.value;
        const selectedPopulationName = document.getElementById('delete-population-select')?.selectedOptions[0]?.text || '';
        
        if (!selectedPopulationId) {
            this.uiManager.showError('No population selected', 'Please select a population before starting the delete.');
            return null;
        }
        
        const totalUsers = this.fileHandler.getTotalUsers();
        if (!totalUsers || totalUsers === 0) {
            this.uiManager.showError('No users to delete', 'Please select a CSV file with users to delete.');
            return null;
        }
        
        return {
            selectedPopulationId,
            selectedPopulationName,
            totalUsers,
            file: this.fileHandler.getCurrentFile()
        };
    }

    cancelDelete() {
        if (this.deleteAbortController) {
            this.deleteAbortController.abort();
        }
    }

    /**
     * Starts the user modify flow by validating options, sending request to the server, and handling progress
     */
    async startModify() {
        if (this.isModifying) {
            this.logger.warn('Modify already in progress');
            return;
        }
        try {
            this.isModifying = true;
            this.modifyAbortController = new AbortController();
            const modifyOptions = this.getModifyOptions();
            // If no modify options, show error and stop
            if (!modifyOptions) {
                this.isModifying = false;
                return;
            }
            // Show modify status in UI
            this.uiManager.showModifyStatus(modifyOptions.totalUsers);
            // Send modify request to backend
            const response = await this.localClient.post('/api/modify-users', modifyOptions, {
                signal: this.modifyAbortController.signal,
                onProgress: (current, total, message, counts) => {
                    // Update UI with modify progress
                    this.uiManager.updateModifyProgress(current, total, message, counts);
                }
            });
            // Handle completion
            if (response.success) {
                this.uiManager.updateModifyProgress(modifyOptions.totalUsers, modifyOptions.totalUsers, 'Modify completed successfully', response.counts);
                this.uiManager.showSuccess('Modify completed successfully', response.message);
            } else {
                this.uiManager.updateModifyProgress(0, modifyOptions.totalUsers, 'Modify failed', response.counts);
                this.uiManager.showError('Modify failed', response.error);
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                this.uiManager.updateModifyProgress(0, 0, 'Modify cancelled');
                this.uiManager.showInfo('Modify cancelled');
            } else {
                this.uiManager.updateModifyProgress(0, 0, 'Modify failed: ' + error.message);
                this.uiManager.showError('Modify failed', error.message);
            }
        } finally {
            this.isModifying = false;
            this.modifyAbortController = null;
        }
    }

    getModifyOptions() {
        const selectedPopulationId = document.getElementById('modify-population-select')?.value;
        const selectedPopulationName = document.getElementById('modify-population-select')?.selectedOptions[0]?.text || '';
        
        if (!selectedPopulationId) {
            this.uiManager.showError('No population selected', 'Please select a population before starting the modify.');
            return null;
        }
        
        const totalUsers = this.fileHandler.getTotalUsers();
        if (!totalUsers || totalUsers === 0) {
            this.uiManager.showError('No users to modify', 'Please select a CSV file with users to modify.');
            return null;
        }
        
        return {
            selectedPopulationId,
            selectedPopulationName,
            totalUsers,
            file: this.fileHandler.getCurrentFile()
        };
    }

    cancelModify() {
        if (this.modifyAbortController) {
            this.modifyAbortController.abort();
        }
    }

    async startPopulationDelete() {
        try {
            const selectedPopulationId = document.getElementById('population-delete-select')?.value;
            const selectedPopulationName = document.getElementById('population-delete-select')?.selectedOptions[0]?.text || '';
            
            if (!selectedPopulationId) {
                this.uiManager.showError('No population selected', 'Please select a population to delete.');
                return;
            }
            
            // Show population delete status
            this.uiManager.showPopulationDeleteStatus(selectedPopulationName);
            
            // Start population delete process
            const response = await this.localClient.post('/api/population-delete', {
                populationId: selectedPopulationId,
                populationName: selectedPopulationName
            });
            
            // Handle completion
            if (response.success) {
                this.uiManager.updatePopulationDeleteProgress(1, 1, 'Population delete completed successfully');
                this.uiManager.showSuccess('Population delete completed successfully', response.message);
            } else {
                this.uiManager.updatePopulationDeleteProgress(0, 1, 'Population delete failed');
                this.uiManager.showError('Population delete failed', response.error);
            }
            
        } catch (error) {
            this.uiManager.updatePopulationDeleteProgress(0, 1, 'Population delete failed: ' + error.message);
            this.uiManager.showError('Population delete failed', error.message);
        }
    }

    cancelPopulationDelete() {
        this.uiManager.updatePopulationDeleteProgress(0, 0, 'Population delete cancelled');
        this.uiManager.showInfo('Population delete cancelled');
    }

    async testConnection() {
        try {
            // Set button loading state
            this.uiManager.setButtonLoading('test-connection-btn', true);
            this.uiManager.updateConnectionStatus('connecting', 'Testing connection...');
            
            const response = await this.localClient.post('/api/pingone/test-connection');
            
            if (response.success) {
                this.uiManager.updateConnectionStatus('connected', 'Connection test successful');
                this.uiManager.showSuccess('Connection test successful', response.message);
            } else {
                this.uiManager.updateConnectionStatus('error', 'Connection test failed');
                this.uiManager.showError('Connection test failed', response.error);
            }
            
        } catch (error) {
            this.uiManager.updateConnectionStatus('error', 'Connection test failed: ' + error.message);
            this.uiManager.showError('Connection test failed', error.message);
        } finally {
            // Always reset button loading state
            this.uiManager.setButtonLoading('test-connection-btn', false);
        }
    }

    /**
     * Format duration in seconds to a human-readable string
     * @param {number} seconds - Duration in seconds
     * @returns {string} Formatted duration string
     */
    formatDuration(seconds) {
        if (!seconds || seconds <= 0) {
            return '0s';
        }
        
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        let result = '';
        if (hours > 0) {
            result += `${hours}h `;
        }
        if (minutes > 0 || hours > 0) {
            result += `${minutes}m `;
        }
        result += `${secs}s`;
        
        return result.trim();
    }

    /**
     * Get time remaining until expiration from JWT token
     * @param {string} token - JWT token
     * @returns {number|null} Time remaining in seconds, or null if invalid
     */
    getTimeRemainingFromJWT(token) {
        try {
            // Simple JWT decode (just the payload part)
            const parts = token.split('.');
            if (parts.length !== 3) {
                return null;
            }
            
            const payload = JSON.parse(atob(parts[1]));
            if (!payload.exp) {
                return null;
            }
            
            const now = Math.floor(Date.now() / 1000);
            const timeRemaining = payload.exp - now;
            
            return timeRemaining > 0 ? timeRemaining : 0;
        } catch (error) {
            console.error('Error decoding JWT token:', error);
            return null;
        }
    }

    async getToken() {
        try {
            console.log('Get Token button clicked - starting token retrieval...');
            
            // Set button loading state
            this.uiManager.setButtonLoading('get-token-btn', true);
            this.uiManager.updateConnectionStatus('connecting', 'Getting token...');
            
            console.log('Using PingOneClient to get token (with localStorage storage)...');
            
            // Use PingOneClient which handles localStorage storage
            if (!this.pingOneClient) {
                throw new Error('PingOneClient not initialized');
            }
            
            const token = await this.pingOneClient.getAccessToken();
            
            console.log('Token retrieved successfully via PingOneClient');
            
            // Verify localStorage storage
            if (typeof localStorage !== 'undefined') {
                const storedToken = localStorage.getItem('pingone_worker_token');
                const storedExpiry = localStorage.getItem('pingone_token_expiry');
                console.log('localStorage verification:', {
                    hasStoredToken: !!storedToken,
                    hasStoredExpiry: !!storedExpiry,
                    tokenLength: storedToken ? storedToken.length : 0,
                    expiryTime: storedExpiry ? new Date(parseInt(storedExpiry)).toISOString() : null
                });
            }
            
            if (token) {
                // Calculate time remaining
                let timeLeft = '';
                const storedExpiry = localStorage.getItem('pingone_token_expiry');
                
                if (storedExpiry) {
                    const expiryTime = parseInt(storedExpiry, 10);
                    const now = Date.now();
                    const timeRemainingSeconds = Math.max(0, Math.floor((expiryTime - now) / 1000));
                    timeLeft = this.formatDuration(timeRemainingSeconds);
                } else {
                    // Fallback: try to decode JWT if no expiry stored
                    const timeRemainingSeconds = this.getTimeRemainingFromJWT(token);
                    if (timeRemainingSeconds !== null) {
                        timeLeft = this.formatDuration(timeRemainingSeconds);
                    }
                }
                
                // Show success message with time remaining
                const successMessage = timeLeft ? 
                    `✅ New token acquired. Time left on token: ${timeLeft}` :
                    '✅ New token acquired successfully';
                
                this.uiManager.updateConnectionStatus('connected', successMessage);
                this.uiManager.showSuccess('Token retrieved and stored successfully', 
                    timeLeft ? `Token has been saved to your browser. Time left: ${timeLeft}` : 
                    'Token has been saved to your browser for future use.');
                this.uiManager.updateHomeTokenStatus(false);
                
                // Refresh token status display on settings page
                if (this.pingOneClient) {
                    const tokenInfo = this.pingOneClient.getCurrentTokenTimeRemaining();
                    this.uiManager.showCurrentTokenStatus(tokenInfo);
                }
                
                // Update universal token status across all pages
                this.updateUniversalTokenStatus();
                
                // Log success message if DEBUG_MODE is enabled
                if (window.DEBUG_MODE) {
                    console.log('Token acquisition successful:', {
                        tokenLength: token.length,
                        timeLeft: timeLeft,
                        successMessage: successMessage
                    });
                }
            } else {
                this.uiManager.updateConnectionStatus('error', 'Failed to get token');
                this.uiManager.showError('Failed to get token', 'No token received from server');
            }
            
        } catch (error) {
            console.error('Error in getToken:', error);
            this.uiManager.updateConnectionStatus('error', 'Failed to get token: ' + error.message);
            this.uiManager.showError('Failed to get token', error.message);
        } finally {
            // Always reset button loading state
            console.log('Resetting Get Token button loading state...');
            this.uiManager.setButtonLoading('get-token-btn', false);
        }
    }

    async toggleFeatureFlag(flag, enabled) {
        try {
            const response = await this.localClient.post(`/api/feature-flags/${flag}`, { enabled });
            
            if (response.success) {
                this.uiManager.showSuccess(`Feature flag ${flag} ${enabled ? 'enabled' : 'disabled'}`);
            } else {
                this.uiManager.showError(`Failed to toggle feature flag ${flag}`, response.error);
            }
            
        } catch (error) {
            this.uiManager.showError(`Failed to toggle feature flag ${flag}`, error.message);
        }
    }

    async resetFeatureFlags() {
        try {
            const response = await this.localClient.post('/api/feature-flags/reset', {});
            
            if (response.success) {
                // Reset all checkboxes to default values
                const checkboxes = document.querySelectorAll('[data-feature-flag]');
                checkboxes.forEach(checkbox => {
                    const flag = checkbox.getAttribute('data-feature-flag');
                    checkbox.checked = false; // Default to false
                });
                console.log('All feature flags reset to defaults');
            } else {
                console.error('Failed to reset feature flags');
            }
        } catch (error) {
            console.error('Error resetting feature flags:', error);
        }
    }

    async addNewFeatureFlag() {
        try {
            const flagName = document.getElementById('new-flag-name').value.trim();
            const description = document.getElementById('new-flag-description').value.trim();
            const enabled = document.getElementById('new-flag-enabled').checked;

            if (!flagName) {
                this.showFeatureFlagsStatus('Please enter a flag name', 'warning');
                return;
            }

            if (!description) {
                this.showFeatureFlagsStatus('Please enter a description', 'warning');
                return;
            }

            // Create new flag item in the UI
            const flagsContainer = document.querySelector('.feature-flags-content');
            const newFlagItem = document.createElement('div');
            newFlagItem.className = 'feature-flag-item';
            newFlagItem.innerHTML = `
                <label class="feature-flag-label">
                    <input type="checkbox" id="flag${flagName}" class="feature-flag-checkbox" data-feature-flag="${flagName}" ${enabled ? 'checked' : ''}>
                    <span class="feature-flag-text">Feature Flag ${flagName}</span>
                </label>
                <span class="feature-flag-description">${description}</span>
            `;

            // Insert before the add section
            const addSection = document.querySelector('.feature-flag-add-section');
            flagsContainer.insertBefore(newFlagItem, addSection);

            // Add event listener to the new checkbox
            const newCheckbox = newFlagItem.querySelector(`#flag${flagName}`);
            newCheckbox.addEventListener('change', async (e) => {
                const flag = e.target.getAttribute('data-feature-flag');
                const enabled = e.target.checked;
                await this.toggleFeatureFlag(flag, enabled);
            });

            // Clear the form
            document.getElementById('new-flag-name').value = '';
            document.getElementById('new-flag-description').value = '';
            document.getElementById('new-flag-enabled').checked = false;

            this.showFeatureFlagsStatus(`Feature flag "${flagName}" added successfully`, 'success');

        } catch (error) {
            console.error('Error adding new feature flag:', error);
            this.showFeatureFlagsStatus('Failed to add feature flag', 'error');
        }
    }

    showFeatureFlagsStatus(message, type = 'info') {
        const statusElement = document.getElementById('feature-flags-status');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = `feature-flags-status ${type}`;
            
            // Auto-hide after 3 seconds
            setTimeout(() => {
                statusElement.style.display = 'none';
            }, 3000);
        }
    }

    refreshProgressPage() {
        // Refresh progress data if needed
        this.uiManager.refreshProgressData();
    }

    // Test function to verify population selection
    testPopulationSelection() {
        console.log('=== Testing Population Selection ===');
        const populationSelect = document.getElementById('import-population-select');
        console.log('Population select element:', populationSelect);
        console.log('Current value:', populationSelect?.value);
        console.log('Selected option text:', populationSelect?.selectedOptions[0]?.text);
        console.log('All options:', populationSelect ? Array.from(populationSelect.options).map(opt => ({ value: opt.value, text: opt.text })) : 'No select element');
        
        // Test getImportOptions
        const options = this.getImportOptions();
        console.log('getImportOptions result:', options);
        
        // Test getCurrentPopulationSelection
        const currentSelection = this.getCurrentPopulationSelection();
        console.log('getCurrentPopulationSelection result:', currentSelection);
        
        // Test forceRefreshPopulationSelection
        const forceRefresh = this.forceRefreshPopulationSelection();
        console.log('forceRefreshPopulationSelection result:', forceRefresh);
        
        // Validate consistency
        if (options && currentSelection && forceRefresh) {
            const isConsistent = options.selectedPopulationId === currentSelection.id && 
                               currentSelection.id === forceRefresh.id;
            console.log('Population selection consistency:', isConsistent);
            if (!isConsistent) {
                console.warn('Population selection inconsistency detected!');
            }
        }
        
        console.log('===============================');
        return {
            options,
            currentSelection,
            forceRefresh
        };
    }

    // Simplifies UX for disclaimer acknowledgment while still ensuring legal consent
    setupDisclaimerAgreement() {
        // Validate presence of disclaimer elements before attaching listeners  
        // Prevents crash when elements are missing or page changes structure
        try {
            // Get required elements with defensive programming
            const disclaimerCheckbox = document.getElementById('disclaimer-agreement');
            const acceptButton = document.getElementById('accept-disclaimer');
            const disclaimerBox = document.getElementById('disclaimer');

            // Presence check for all required elements
            if (!disclaimerCheckbox || !acceptButton || !disclaimerBox) {
                console.warn('[Disclaimer] Required disclaimer elements not found:', {
                    disclaimerCheckbox: !!disclaimerCheckbox,
                    acceptButton: !!acceptButton,
                    disclaimerBox: !!disclaimerBox
                });
                
                // Retry mechanism: if elements are not found, try again after a short delay
                if (document.readyState === 'loading') {
                    console.log('[Disclaimer] DOM still loading, retrying in 100ms...');
                    setTimeout(() => this.setupDisclaimerAgreement(), 100);
                    return;
                }
                
                // Optional: Show a user-friendly message if disclaimer is broken
                if (disclaimerBox) {
                    disclaimerBox.innerHTML = '<div class="alert alert-danger">Unable to load disclaimer controls. Please refresh or contact support.</div>';
                }
                return;
            }

            console.log('[Disclaimer] All required elements found successfully');

            // Function to check if the checkbox is checked
            const checkAgreementStatus = () => {
                const isChecked = disclaimerCheckbox.checked;
                acceptButton.disabled = !isChecked;
                
                // Update button appearance based on checkbox status
                if (isChecked) {
                    acceptButton.classList.remove('btn-secondary');
                    acceptButton.classList.add('btn-danger');
                    console.log('[Disclaimer] ✅ Button enabled');
                } else {
                    acceptButton.classList.remove('btn-danger');
                    acceptButton.classList.add('btn-secondary');
                    console.log('[Disclaimer] ❌ Button disabled');
                }
            };

            // Attach event listener to checkbox
            disclaimerCheckbox.addEventListener('change', (e) => {
                console.log('[Disclaimer] Checkbox changed:', e.target.checked);
                checkAgreementStatus();
            });

            // Attach event listener to accept button
            acceptButton.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('[Disclaimer] Accept button clicked');
                
                // Validate checkbox is still checked
                if (disclaimerCheckbox.checked) {
                    console.log('[Disclaimer] ✅ Disclaimer accepted - enabling tool');
                    this.enableToolAfterDisclaimer();
                } else {
                    console.warn('[Disclaimer] ❌ Button clicked but checkbox not checked');
                    this.uiManager.showError('Disclaimer Error', 'Please check the agreement box before proceeding.');
                }
            });

            // Initial status check
            checkAgreementStatus();
            console.log('[Disclaimer] Setup completed successfully');
            
        } catch (err) {
            console.error('[Disclaimer] Error in setupDisclaimerAgreement:', err);
        }
    }

    // Check if disclaimer was previously accepted
    checkDisclaimerStatus() {
        if (typeof localStorage !== 'undefined') {
            const disclaimerAccepted = localStorage.getItem('disclaimerAccepted');
            const disclaimerDate = localStorage.getItem('disclaimerAcceptedDate');
            
            console.log('Disclaimer status check:', {
                accepted: disclaimerAccepted,
                date: disclaimerDate
            });
            
            if (disclaimerAccepted === 'true') {
                console.log('Disclaimer previously accepted, enabling tool');
                this.enableToolAfterDisclaimer();
                return true;
            }
        }
        
        return false;
    }

    showPopulationChoicePrompt() {
        // Only show once per import session
        if (this.populationPromptShown) return;
        // Check if both file and population are selected
        const file = this.fileHandler.getCurrentFile && this.fileHandler.getCurrentFile();
        const populationSelect = document.getElementById('import-population-select');
        const populationId = populationSelect && populationSelect.value;
        if (!file || !populationId) return;
        // Check if CSV has a populationId column
        const users = this.fileHandler.getParsedUsers ? this.fileHandler.getParsedUsers() : [];
        if (!users.length) return;
        const hasPopulationColumn = Object.keys(users[0]).some(
            h => h.toLowerCase() === 'populationid' || h.toLowerCase() === 'population_id'
        );
        if (!hasPopulationColumn) return; // Don't prompt if no populationId in CSV
        // Show the modal
        const modal = document.getElementById('population-warning-modal');
        if (!modal) return;
        modal.style.display = 'flex';
        this.populationPromptShown = true;
        // Set up modal buttons
        const okBtn = document.getElementById('population-warning-ok');
        const settingsBtn = document.getElementById('population-warning-settings');
        // Optionally, add override/ignore/use-csv buttons if you want more than just OK/Settings
        // For now, just close on OK
        if (okBtn) {
            okBtn.onclick = () => {
                modal.style.display = 'none';
                this.populationChoice = 'use-csv'; // Default to use CSV if present
            };
        }
        if (settingsBtn) {
            settingsBtn.onclick = () => {
                modal.style.display = 'none';
                this.populationChoice = 'settings';
                this.showView('settings');
            };
        }
    }

    showPopulationConflictModal(conflictData, sessionId) {
        console.log('Showing population conflict modal:', conflictData);
        
        // Create modal HTML if it doesn't exist
        let modal = document.getElementById('population-conflict-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'population-conflict-modal';
            modal.className = 'modal fade show';
            modal.style.display = 'flex';
            modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            modal.style.position = 'fixed';
            modal.style.top = '0';
            modal.style.left = '0';
            modal.style.width = '100%';
            modal.style.height = '100%';
            modal.style.zIndex = '9999';
            
            modal.innerHTML = `
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Population Conflict Detected</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="alert alert-warning">
                                <strong>Conflict:</strong> Your CSV file contains population data AND you selected a population in the UI.
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="card">
                                        <div class="card-header">
                                            <h6>CSV Population Data</h6>
                                        </div>
                                        <div class="card-body">
                                            <p><strong>Users with population IDs:</strong> ${conflictData.csvPopulationCount}</p>
                                            <p>Users in your CSV file have their own population assignments.</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="card">
                                        <div class="card-header">
                                            <h6>UI Selected Population</h6>
                                        </div>
                                        <div class="card-body">
                                            <p><strong>Selected population:</strong> ${conflictData.uiSelectedPopulation}</p>
                                            <p>You selected this population in the dropdown.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="mt-3">
                                <p><strong>Please choose which population to use:</strong></p>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" id="use-csv-population">
                                Use CSV Population Data
                            </button>
                            <button type="button" class="btn btn-primary" id="use-ui-population">
                                Use UI Selected Population
                            </button>
                            <button type="button" class="btn btn-outline-secondary" id="cancel-conflict-resolution">
                                Cancel Import
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
        } else {
            modal.style.display = 'flex';
        }
        
        // Set up event listeners
        const useCsvBtn = document.getElementById('use-csv-population');
        const useUiBtn = document.getElementById('use-ui-population');
        const cancelBtn = document.getElementById('cancel-conflict-resolution');
        
        const closeModal = () => {
            modal.style.display = 'none';
        };
        
        const resolveConflict = async (useCsvPopulation) => {
            try {
                const response = await fetch('/api/import/resolve-conflict', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        sessionId,
                        useCsvPopulation,
                        useUiPopulation: !useCsvPopulation
                    })
                });
                
                const result = await response.json();
                if (result.success) {
                    closeModal();
                    this.uiManager.showSuccess('Conflict resolved', 'Import will continue with your selection.');
                    
                    // Restart the import with the resolved conflict
                    await this.startImport();
                } else {
                    this.uiManager.showError('Failed to resolve conflict', result.error || 'Unknown error');
                }
            } catch (error) {
                this.uiManager.showError('Failed to resolve conflict', error.message);
            }
        };
        
        useCsvBtn.onclick = () => resolveConflict(true);
        useUiBtn.onclick = () => resolveConflict(false);
        cancelBtn.onclick = () => {
            closeModal();
            this.uiManager.showInfo('Import cancelled', 'Population conflict resolution was cancelled.');
        };
    }

    showInvalidPopulationModal(invalidData, sessionId) {
        console.log('Showing invalid population modal:', invalidData);
        // Get UI-selected population
        let uiPopulationName = '';
        let uiPopulationId = '';
        const populationSelect = document.getElementById('import-population-select');
        if (populationSelect) {
            uiPopulationId = populationSelect.value;
            uiPopulationName = populationSelect.selectedOptions[0]?.text || '';
        }
        // Create modal HTML if it doesn't exist
        let modal = document.getElementById('invalid-population-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'invalid-population-modal';
            modal.className = 'modal fade show';
            modal.style.display = 'flex';
            modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            modal.style.position = 'fixed';
            modal.style.top = '0';
            modal.style.left = '0';
            modal.style.width = '100%';
            modal.style.height = '100%';
            modal.style.zIndex = '9999';
            modal.innerHTML = `
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Invalid Populations Detected</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="alert alert-warning">
                                <strong>Warning:</strong> Your CSV file contains population IDs that don't exist in PingOne.
                            </div>
                            <div class="ui-selected-population" style="background:#f8f9fa; border:1px solid #dee2e6; border-radius:5px; padding:8px 12px; margin-bottom:12px;">
                                <strong>UI-selected population:</strong> ${uiPopulationName ? uiPopulationName : '(none selected)'}${uiPopulationId ? ` <span style='color:#888'>(ID: ${uiPopulationId})</span>` : ''}
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="card">
                                        <div class="card-header">
                                            <h6>Invalid Populations</h6>
                                        </div>
                                        <div class="card-body">
                                            <p><strong>Invalid population IDs:</strong></p>
                                            <ul>
                                                ${invalidData.invalidPopulations.map(id => `<li><code>${id}</code></li>`).join('')}
                                            </ul>
                                            <p><strong>Affected users:</strong> ${invalidData.affectedUserCount}</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="card">
                                        <div class="card-header">
                                            <h6>Select Valid Population</h6>
                                        </div>
                                        <div class="card-body">
                                            <p>Please select a valid population to use for these users:</p>
                                            <select class="form-select" id="valid-population-select">
                                                <option value="">Loading populations...</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-primary" id="use-selected-population" disabled>
                                Use Selected Population
                            </button>
                            <button type="button" class="btn btn-outline-secondary" id="cancel-invalid-population-resolution">
                                Cancel Import
                            </button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        } else {
            // Update UI-selected population info if modal already exists
            const uiPopDiv = modal.querySelector('.ui-selected-population');
            if (uiPopDiv) {
                uiPopDiv.innerHTML = `<strong>UI-selected population:</strong> ${uiPopulationName ? uiPopulationName : '(none selected)'}${uiPopulationId ? ` <span style='color:#888'>(ID: ${uiPopulationId})</span>` : ''}`;
            }
            modal.style.display = 'flex';
        }
        // Use a different variable for the modal's population select
        const modalPopulationSelect = document.getElementById('valid-population-select');
        // Load available populations
        this.loadPopulationsForModal(invalidData, sessionId);
        
        // Set up event listeners
        const useSelectedBtn = document.getElementById('use-selected-population');
        const cancelBtn = document.getElementById('cancel-invalid-population-resolution');
        const populationSelectForModal = document.getElementById('valid-population-select');
        
        const closeModal = () => {
            modal.style.display = 'none';
        };
        
        const resolveInvalidPopulation = async (selectedPopulationId) => {
            try {
                const response = await fetch('/api/import/resolve-invalid-population', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        sessionId,
                        selectedPopulationId
                    })
                });
                
                const result = await response.json();
                if (result.success) {
                    closeModal();
                    this.uiManager.showSuccess('Invalid population resolved', 'Import will continue with the selected population.');
                    
                    // Restart the import with the resolved invalid population
                    await this.startImport();
                } else {
                    this.uiManager.showError('Failed to resolve invalid population', result.error || 'Unknown error');
                }
            } catch (error) {
                this.uiManager.showError('Failed to resolve invalid population', error.message);
            }
        };
        
        useSelectedBtn.onclick = () => {
            const selectedPopulationId = populationSelectForModal.value;
            if (selectedPopulationId) {
                // Apply selected population to all affected users (fallback to all if indexes missing)
                const users = this.fileHandler.getParsedUsers ? this.fileHandler.getParsedUsers() : [];
                let indexes = [];
                if (invalidData && Array.isArray(invalidData.affectedUserIndexes) && invalidData.affectedUserIndexes.length > 0) {
                    indexes = invalidData.affectedUserIndexes;
                } else {
                    indexes = users.map((_, idx) => idx);
                }
                console.log("Affected indexes:", indexes);
                console.log("Users before update:", users.slice(0, 5));
                indexes.forEach(idx => {
                    if (users[idx]) users[idx].populationId = selectedPopulationId;
                });
                console.log("User resolved population conflict with:", selectedPopulationId);
                this.uiManager.showInfo(`User resolved population conflict with: ${selectedPopulationId}`);
                closeModal();
                // Resume import
                this.startImport();
            }
        };
        
        cancelBtn.onclick = () => {
            closeModal();
            this.uiManager.showInfo('Import cancelled', 'Invalid population resolution was cancelled.');
        };
        
        // Enable/disable button based on selection
        populationSelectForModal.addEventListener('change', () => {
            useSelectedBtn.disabled = !populationSelectForModal.value;
        });
    }

    async loadPopulationsForModal(invalidData, sessionId) {
        await this.loadPopulationsForDropdown('valid-population-select');
        // The rest of the modal logic should assume the dropdown is now loaded or shows error/retry
        // Remove the old fetch logic below:
        // try {
        //     const response = await fetch('/api/pingone/populations');
        //     if (response.ok) {
        //         const populations = await response.json();
        //         const populationSelect = document.getElementById('valid-population-select');
        //         if (populationSelect) {
        //             populationSelect.innerHTML = '<option value="">Select a population...</option>';
        //             populations.forEach(population => {
        //                 const option = document.createElement('option');
        //                 option.value = population.id;
        //                 option.textContent = population.name;
        //                 populationSelect.appendChild(option);
        //             });
        //         }
        //     } else {
        //         console.error('Failed to load populations for modal');
        //     }
        // } catch (error) {
        //     console.error('Error loading populations for modal:', error);
        // }
    }

    // Error tracking methods for import operations
    trackImportError(errorMessage) {
        this.importErrors.push(errorMessage);
        this.updateImportErrorDisplay();
    }

    clearImportErrors() {
        this.importErrors = [];
        this.uiManager.hideImportErrorStatus();
    }

    updateImportErrorDisplay() {
        if (this.importErrors.length > 0) {
            const errorSummary = `Import completed with ${this.importErrors.length} error(s)`;
            this.uiManager.updateImportErrorStatus(errorSummary, this.importErrors);
        } else {
            this.uiManager.hideImportErrorStatus();
        }
    }

    resetImportErrorTracking() {
        this.importErrors = [];
        this.uiManager.hideImportErrorStatus();
    }

    // Prompt user to pick a valid population if none is selected
    async promptForPopulationSelection(affectedIndexes, users) {
        return new Promise((resolve) => {
            // Build modal
            let modal = document.getElementById('pick-population-modal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'pick-population-modal';
                modal.className = 'modal fade show';
                modal.style.display = 'flex';
                modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                modal.style.position = 'fixed';
                modal.style.top = '0';
                modal.style.left = '0';
                modal.style.width = '100%';
                modal.style.height = '100%';
                modal.style.zIndex = '9999';
                modal.innerHTML = `
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Select Population for Import</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <div class="alert alert-warning">
                                    <strong>Warning:</strong> No valid population is selected. Please pick a population to use for all users missing or with invalid population IDs.
                                </div>
                                <div class="form-group">
                                    <label for="pick-population-select">Select Population:</label>
                                    <select class="form-select" id="pick-population-select">
                                        <option value="">Loading populations...</option>
                                    </select>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-primary" id="pick-population-confirm" disabled>Use Selected Population</button>
                                <button type="button" class="btn btn-outline-secondary" id="pick-population-cancel">Cancel Import</button>
                            </div>
                        </div>
                    </div>
                `;
                document.body.appendChild(modal);
            } else {
                modal.style.display = 'flex';
            }
            // Populate dropdown
            const populationSelect = document.getElementById('pick-population-select');
            populationSelect.innerHTML = '<option value="">Select a population...</option>';
            const importPopSelect = document.getElementById('import-population-select');
            if (importPopSelect) {
                Array.from(importPopSelect.options).forEach(opt => {
                    if (opt.value) {
                        const option = document.createElement('option');
                        option.value = opt.value;
                        option.textContent = opt.text;
                        populationSelect.appendChild(option);
                    }
                });
            }
            // Enable confirm button only if a valid selection
            const confirmBtn = document.getElementById('pick-population-confirm');
            populationSelect.addEventListener('change', () => {
                confirmBtn.disabled = !populationSelect.value;
            });
            // Confirm handler
            confirmBtn.onclick = () => {
                const selectedId = populationSelect.value;
                if (selectedId) {
                    // Set the UI dropdown to this value
                    if (importPopSelect) importPopSelect.value = selectedId;
                    modal.style.display = 'none';
                    resolve(selectedId);
                }
            };
            // Cancel handler
            document.getElementById('pick-population-cancel').onclick = () => {
                modal.style.display = 'none';
                this.uiManager.showInfo('Import cancelled', 'No population selected.');
                resolve(null);
            };
        });
    }

    /**
     * Update universal token status across all pages
     * 
     * This method provides a centralized way to update the token status
     * display that appears on all pages. It ensures consistent token
     * status visibility and helps users understand their token state
     * without navigating to the settings page.
     * 
     * Called after token acquisition, expiration, or manual refresh
     * to keep all pages synchronized with current token state.
     */
    updateUniversalTokenStatus() {
        try {
            if (this.uiManager && this.uiManager.updateUniversalTokenStatus) {
                // Get current token info for accurate display
                let tokenInfo = null;
                if (this.pingOneClient) {
                    tokenInfo = this.pingOneClient.getCurrentTokenTimeRemaining();
                }
                
                // Update the universal token status bar
                this.uiManager.updateUniversalTokenStatus(tokenInfo);
                
                if (window.DEBUG_MODE) {
                    console.log('Universal token status updated:', tokenInfo);
                }
            }
        } catch (error) {
            console.error('Error updating universal token status:', error);
        }
    }

    // Enable the tool after disclaimer is accepted
    enableToolAfterDisclaimer() {
        console.log('[Disclaimer] === Enabling Tool After Disclaimer ===');
        try {
            // Hide the disclaimer section
            const disclaimerSection = document.getElementById('disclaimer');
            if (disclaimerSection) {
                disclaimerSection.style.display = 'none';
                console.log('[Disclaimer] Disclaimer section hidden');
            }

            // Enable navigation tabs
            const navItems = document.querySelectorAll('[data-view]');
            navItems.forEach(item => {
                item.style.pointerEvents = 'auto';
                item.style.opacity = '1';
            });

            // Enable feature cards
            const featureCards = document.querySelectorAll('.feature-card');
            featureCards.forEach(card => {
                card.style.pointerEvents = 'auto';
                card.style.opacity = '1';
            });

            // Show success message
            this.uiManager.showSuccess('Tool Enabled', 'You have accepted the disclaimer. The tool is now enabled.');

            // Store disclaimer acceptance in localStorage
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('disclaimerAccepted', 'true');
                localStorage.setItem('disclaimerAcceptedDate', new Date().toISOString());
            }

            // Scroll to top of page smoothly after disclaimer acceptance
            // Ensures users are redirected to the top of the page immediately after accepting the disclaimer
            // Helps surface important UI elements like token status, navigation icons, or action buttons
            setTimeout(() => {
                window.scrollTo({
                    top: 0,
                    left: 0,
                    behavior: 'smooth'
                });
                console.log('[Disclaimer] ✅ Scrolled to top of page smoothly');
            }, 100); // Small delay to ensure UI updates are complete

            console.log('[Disclaimer] ✅ Tool enabled successfully after disclaimer acceptance');
        } catch (error) {
            console.error('[Disclaimer] Error enabling tool after disclaimer:', error);
            this.uiManager.showError('Error', 'Failed to enable tool after disclaimer acceptance.');
        }
    }

    attachPopulationChangeListener() {
        console.log('🔄 Attaching population change listener...');
        
        const populationSelectEl = document.getElementById('import-population-select');
        if (!populationSelectEl) {
            console.error('❌ Population select element not found for event listener');
            console.error('❌ Available select elements:', document.querySelectorAll('select[id*="population"]').length);
            return;
        }
        
        console.log('✅ Population select element found for event listener');
        
        // Remove existing listener to prevent duplicates
        populationSelectEl.removeEventListener('change', this.handlePopulationChange.bind(this));
        console.log('🔄 Removed existing event listener');
        
        // Add the change listener
        populationSelectEl.addEventListener('change', this.handlePopulationChange.bind(this));
        console.log('✅ Population change listener attached');
    }
    
    handlePopulationChange(e) {
        const populationSelectEl = e.target;
        const selectedId = populationSelectEl.value;
        const selectedName = populationSelectEl.selectedOptions[0]?.text || '';
        
        this.selectedPopulationId = selectedId;
        this.selectedPopulationName = selectedName;
        
        console.log('[Population] Dropdown changed:', { id: selectedId, name: selectedName });
        
        // Update import button state when population selection changes
        this.updateImportButtonState();
        
        // Update population display in import stats
        const populationNameElement = document.getElementById('import-population-name');
        const populationIdElement = document.getElementById('import-population-id');
        
        if (populationNameElement) {
            populationNameElement.textContent = selectedName || 'Not selected';
        }
        
        if (populationIdElement) {
            populationIdElement.textContent = selectedId || 'Not set';
        }
    }

    // If you have a modal or function that uses pick-population-select, add:
    async loadPickPopulationModal() {
        await this.loadPopulationsForDropdown('pick-population-select');
        // The rest of the modal logic should assume the dropdown is now loaded or shows error/retry
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const app = new App();
        await app.init();
        
        // Make app globally available for debugging
        window.app = app;
        
    } catch (error) {
        console.error('Failed to initialize app:', error);
    }
});

// Debug log filtering functions
window.clearDebugLog = function() {
    const debugContent = document.getElementById('debug-log-content');
    if (debugContent) {
        debugContent.innerHTML = '';
    }
};

window.toggleDebugFilter = function(area) {
    // Store filter state
    if (!window.debugFilters) window.debugFilters = {};
    window.debugFilters[area] = !window.debugFilters[area];
    applyDebugFilters();
};

window.applyDebugFilters = function() {
    const debugContent = document.getElementById('debug-log-content');
    if (!debugContent) return;
    
    const entries = debugContent.querySelectorAll('.debug-log-entry');
    entries.forEach(entry => {
        const area = entry.getAttribute('data-area');
        const isVisible = !window.debugFilters || window.debugFilters[area] !== false;
        entry.style.display = isVisible ? 'block' : 'none';
    });
};

// Initialize debug filters
window.debugFilters = {};

// Global click handler for log entries to enable expand/collapse functionality
document.addEventListener('click', (e) => {
    // Check if the clicked element is a log entry or inside one
    const logEntry = e.target.closest('.log-entry');
    if (!logEntry) return;
    
    // Check if the clicked element is an expand icon
    const expandIcon = e.target.closest('.log-expand-icon');
    if (expandIcon) {
        e.stopPropagation(); // Prevent triggering the log entry click
    }
    
    // Find the details and icon elements
    const details = logEntry.querySelector('.log-details');
    const icon = logEntry.querySelector('.log-expand-icon');
    
    if (details && icon) {
        const isExpanded = details.style.display !== 'none';
        
        if (isExpanded) {
            // Collapse
            details.style.display = 'none';
            icon.innerHTML = '▶';
            logEntry.classList.remove('expanded');
        } else {
            // Expand
            details.style.display = 'block';
            icon.innerHTML = '▼';
            logEntry.classList.add('expanded');
        }
    }
});

// Function to add expand icons to existing log entries that don't have them
window.addExpandIconsToLogEntries = function() {
    const logEntries = document.querySelectorAll('.log-entry');
    logEntries.forEach(entry => {
        // Check if this entry already has an expand icon
        const existingIcon = entry.querySelector('.log-expand-icon');
        if (existingIcon) return;
        
        // Check if this entry has details that could be expanded
        const details = entry.querySelector('.log-details');
        const hasData = entry.querySelector('.log-data, .log-context, .log-detail-section');
        
        if (details || hasData) {
            // Find the header or create one
            let header = entry.querySelector('.log-header');
            if (!header) {
                // Create a header if it doesn't exist
                header = document.createElement('div');
                header.className = 'log-header';
                header.style.display = 'flex';
                header.style.alignItems = 'center';
                header.style.gap = '8px';
                
                // Move existing content to header
                const children = Array.from(entry.children);
                children.forEach(child => {
                    if (!child.classList.contains('log-details')) {
                        header.appendChild(child);
                    }
                });
                
                entry.insertBefore(header, entry.firstChild);
            }
            
            // Add expand icon
            const expandIcon = document.createElement('span');
            expandIcon.className = 'log-expand-icon';
            expandIcon.innerHTML = '▶';
            expandIcon.style.cursor = 'pointer';
            header.appendChild(expandIcon);
            
            // Ensure details are initially hidden
            if (details) {
                details.style.display = 'none';
            }
        }
    });
};

// Call the function when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Add a small delay to ensure all content is loaded
    setTimeout(() => {
        window.addExpandIconsToLogEntries();
    }, 100);
});

// === DEBUG LOG PANEL TOGGLE LOGIC ===

// === DEBUG LOG PANEL TOGGLE LOGIC ===
// Handles open/close, accessibility, and scroll position for the debug log panel
(function setupDebugLogToggle() {
  const toggleBtn = document.getElementById('debug-log-toggle');
  const panel = document.getElementById('debug-log-panel');
  const logEntries = document.getElementById('log-entries');
  let lastScrollTop = 0;

  if (!toggleBtn || !panel) return; // SAFEGUARD: Only run if elements exist

  // Toggle panel open/close
  function togglePanel(forceOpen) {
    const isOpen = !panel.classList.contains('collapsed');
    if (forceOpen === true || (!isOpen && forceOpen === undefined)) {
      panel.classList.remove('collapsed');
      toggleBtn.setAttribute('aria-expanded', 'true');
      toggleBtn.setAttribute('aria-label', 'Hide Debug Log Console');
      // Restore scroll position
      if (lastScrollTop) logEntries.scrollTop = lastScrollTop;
      panel.focus();
    } else {
      lastScrollTop = logEntries.scrollTop;
      panel.classList.add('collapsed');
      toggleBtn.setAttribute('aria-expanded', 'false');
      toggleBtn.setAttribute('aria-label', 'Show Debug Log Console');
      toggleBtn.focus();
    }
  }

  // Click handler
  toggleBtn.addEventListener('click', () => togglePanel());
  // Keyboard accessibility (Enter/Space)
  toggleBtn.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      togglePanel();
    }
  });
  // Optionally, close with Escape when focused
  panel.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      e.preventDefault();
      togglePanel(false);
    }
  });
  // Default to collapsed
  panel.classList.add('collapsed');
  toggleBtn.setAttribute('aria-expanded', 'false');
  // Optionally, open if hash is #debug-log
  if (window.location.hash === '#debug-log') togglePanel(true);
})();

// Global stream tracker for SSE progress streams (by sessionId)
// Prevents undefined reference errors during stream connection lifecycle
if (typeof window.importProgressStreams === 'undefined') {
    window.importProgressStreams = new Map();
}
const importProgressStreams = window.importProgressStreams;

// ===============================
// SSE EventSource Wrapper
// ===============================

/**
 * Robust SSE (EventSource) wrapper with exponential backoff, connection status events, and full lifecycle logging.
 * Usage: const sse = new RobustEventSource(url, { onMessage, onOpen, onError, onStatus });
 */
class RobustEventSource {
    constructor(url, { onMessage, onOpen, onError, onStatus, maxRetries = 10, baseDelay = 1000, maxDelay = 30000 } = {}) {
        this.url = url;
        this.onMessage = onMessage;
        this.onOpen = onOpen;
        this.onError = onError;
        this.onStatus = onStatus;
        this.maxRetries = maxRetries;
        this.baseDelay = baseDelay;
        this.maxDelay = maxDelay;
        this.retryCount = 0;
        this.eventSource = null;
        this.closed = false;
        this.connect();
    }

    connect() {
        if (this.closed) return;
        this.eventSource = new EventSource(this.url);
        this._emitStatus('connecting');
        this.eventSource.onopen = (e) => {
            this.retryCount = 0;
            this._emitStatus('connected');
            if (this.onOpen) this.onOpen(e);
            console.log('[SSE] Connected:', this.url);
        };
        this.eventSource.onmessage = (e) => {
            if (this.onMessage) this.onMessage(e);
        };
        this.eventSource.onerror = (e) => {
            this._emitStatus('error');
            if (this.onError) this.onError(e);
            console.error('[SSE] Error:', e);
            this.eventSource.close();
            if (!this.closed) this._scheduleReconnect();
        };
        this.eventSource.onclose = (e) => {
            this._emitStatus('closed');
            console.warn('[SSE] Closed:', e);
        };
    }

    _scheduleReconnect() {
        if (this.retryCount >= this.maxRetries) {
            this._emitStatus('failed');
            console.error('[SSE] Max retries reached. Giving up.');
            return;
        }
        const delay = Math.min(this.baseDelay * Math.pow(2, this.retryCount), this.maxDelay);
        this.retryCount++;
        this._emitStatus('reconnecting', delay);
        console.warn(`[SSE] Reconnecting in ${delay}ms (attempt ${this.retryCount})`);
        setTimeout(() => this.connect(), delay);
    }

    _emitStatus(status, data) {
        if (this.onStatus) this.onStatus(status, data);
    }

    close() {
        this.closed = true;
        if (this.eventSource) this.eventSource.close();
        this._emitStatus('closed');
    }
}
// ===============================

// ===============================
// SSE Status Indicator & Fallback Polling
// ===============================

// Add a status indicator to the DOM (if not present)
function ensureSSEStatusIndicator() {
    let indicator = document.getElementById('sse-status-indicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'sse-status-indicator';
        indicator.style.position = 'fixed';
        indicator.style.bottom = '80px';
        indicator.style.right = '30px';
        indicator.style.zIndex = '2000';
        indicator.style.padding = '10px 18px';
        indicator.style.borderRadius = '8px';
        indicator.style.fontWeight = 'bold';
        indicator.style.fontSize = '15px';
        indicator.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)';
        indicator.style.display = 'flex';
        indicator.style.alignItems = 'center';
        indicator.innerHTML = '<span class="sse-status-dot" style="width:12px;height:12px;border-radius:50%;display:inline-block;margin-right:10px;"></span><span class="sse-status-text"></span>';
        document.body.appendChild(indicator);
    }
    return indicator;
}

function updateSSEStatusIndicator(status, fallback) {
    const indicator = ensureSSEStatusIndicator();
    const dot = indicator.querySelector('.sse-status-dot');
    const text = indicator.querySelector('.sse-status-text');
    let color = '#6c757d', msg = 'Unknown';
    if (status === 'connected') { color = '#28a745'; msg = 'Connected'; }
    else if (status === 'connecting') { color = '#ffc107'; msg = 'Connecting...'; }
    else if (status === 'reconnecting') { color = '#ffc107'; msg = 'Reconnecting...'; }
    else if (status === 'error') { color = '#dc3545'; msg = 'Connection Error'; }
    else if (status === 'closed') { color = '#dc3545'; msg = 'Disconnected'; }
    else if (status === 'failed') { color = '#dc3545'; msg = 'Failed'; }
    dot.style.background = color;
    text.textContent = msg + (fallback ? ' (Fallback Mode)' : '');
    indicator.style.background = fallback ? '#fff3cd' : '#f8f9fa';
    indicator.style.color = fallback ? '#856404' : '#333';
    indicator.style.border = fallback ? '2px solid #ffc107' : '1px solid #dee2e6';
    indicator.style.boxShadow = fallback ? '0 2px 12px #ffe066' : '0 2px 8px rgba(0,0,0,0.12)';
    indicator.title = fallback ? 'Real-time updates unavailable, using fallback polling.' : 'SSE connection status';
}

// Fallback polling logic
let fallbackPollingInterval = null;
function startFallbackPolling(progressUrl, onProgress) {
    if (fallbackPollingInterval) return;
    updateSSEStatusIndicator('failed', true);
    fallbackPollingInterval = setInterval(() => {
        fetch(progressUrl)
            .then(r => r.json())
            .then(data => {
                if (onProgress) onProgress({ data: JSON.stringify(data) });
            })
            .catch(err => {
                console.error('[Fallback Polling] Error:', err);
            });
    }, 5000); // Poll every 5 seconds
    console.warn('[SSE] Fallback polling started.');
}
function stopFallbackPolling() {
    if (fallbackPollingInterval) {
        clearInterval(fallbackPollingInterval);
        fallbackPollingInterval = null;
        console.log('[SSE] Fallback polling stopped.');
    }
}

// Integrate with import progress logic
function setupImportProgressSSE(sessionId, onProgress) {
    const sseUrl = `/api/import/progress/${sessionId}`;
    let fallbackActive = false;
    let sse = new RobustEventSource(sseUrl, {
        onMessage: (e) => {
            if (onProgress) onProgress(e);
        },
        onOpen: () => {
            updateSSEStatusIndicator('connected', false);
            stopFallbackPolling();
            fallbackActive = false;
        },
        onError: () => {
            updateSSEStatusIndicator('error', fallbackActive);
        },
        onStatus: (status, data) => {
            updateSSEStatusIndicator(status, fallbackActive);
            if (status === 'failed') {
                fallbackActive = true;
                // Start fallback polling
                startFallbackPolling(`/api/import/progress-fallback/${sessionId}`, onProgress);
            } else if (status === 'connected') {
                fallbackActive = false;
                stopFallbackPolling();
            }
        }
    });
    return sse;
}
// ... existing code ...
// Example usage in your import logic:
// const sse = setupImportProgressSSE(sessionId, handleProgressEvent);
// When done: sse.close(); stopFallbackPolling();

// Centralized error handler for API/network/form errors
function handleAppError(error, context = {}) {
    const ui = window.app && window.app.uiManager;
    let userMessage = 'An unexpected error occurred. Please try again.';
    let errorType = 'error';
    
    // Handle different error types with specific user-friendly messages
    if (error && error.response) {
        // HTTP error response
        const status = error.response.status;
        if (status === 401) {
            userMessage = 'Session expired – please log in again.';
            errorType = 'warning';
        } else if (status === 403) {
            userMessage = 'Access denied. Please check your permissions.';
            errorType = 'error';
        } else if (status === 404) {
            userMessage = 'Resource not found. Please check your settings.';
            errorType = 'warning';
        } else if (status === 429) {
            userMessage = 'Too many requests. Please wait a moment and try again.';
            errorType = 'warning';
        } else if (status >= 500) {
            userMessage = 'Server error – please try again later.';
            errorType = 'error';
        } else {
            // Try to get error message from response
            error.response.json().then(data => {
                userMessage = data.error || userMessage;
                if (ui) ui.showStatusBar(userMessage, errorType, { autoDismiss: false });
            }).catch(() => {
                if (ui) ui.showStatusBar(userMessage, errorType, { autoDismiss: false });
            });
            return;
        }
    } else if (error && error.message) {
        // Network or other errors
        if (error.message.includes('Network') || error.message.includes('fetch')) {
            userMessage = 'Network error – check your connection and try again.';
            errorType = 'warning';
        } else if (error.message.includes('timeout')) {
            userMessage = 'Request timed out – please try again.';
            errorType = 'warning';
        } else if (error.message.includes('aborted')) {
            userMessage = 'Request was cancelled.';
            errorType = 'info';
            return; // Don't show for user-initiated cancellations
        } else if (error.message.includes('Failed to fetch')) {
            userMessage = 'Cannot connect to server. Please check your connection.';
            errorType = 'error';
        }
    }
    
    // Show error in status bar
    if (ui) {
        ui.showStatusBar(userMessage, errorType, { 
            autoDismiss: errorType === 'info' || errorType === 'success',
            duration: errorType === 'info' ? 3000 : 6000
        });
    }
    
    // Log error for debugging
    console.error('Application error:', error, context);
}

// Enhanced safe API call wrapper with better error handling
async function safeApiCall(apiFn, ...args) {
    try {
        return await apiFn(...args);
    } catch (error) {
        // Handle AbortError separately (user cancellation)
        if (error.name === 'AbortError') {
            console.log('Request was cancelled by user');
            return;
        }
        
        // Handle fetch errors
        if (error instanceof TypeError && error.message.includes('fetch')) {
            handleAppError(new Error('Network error – check your connection.'), { 
                context: 'API call failed',
                function: apiFn.name 
            });
        } else {
            handleAppError(error, { 
                context: 'API call failed',
                function: apiFn.name 
            });
        }
        throw error;
    }
}

// Enhanced form validation with status bar feedback
function validateAndSubmit(form, validateFn, submitFn) {
    const ui = window.app && window.app.uiManager;
    
    // Validate form
    const validation = validateFn(form);
    if (!validation.valid) {
        if (ui) {
            ui.showStatusBar(validation.message, 'warning', { 
                autoDismiss: true, 
                duration: 4000 
            });
        }
        return false;
    }
    
    // Show loading state
    if (ui) {
        ui.showStatusBar('Processing...', 'info', { autoDismiss: false });
    }
    
    // Submit with error handling
    submitFn(form).catch(error => {
        handleAppError(error, { context: 'Form submission failed' });
    });
    
    return true;
}

// Enhanced fallback UI for critical errors
function showFallbackUI(type) {
    const ui = window.app && window.app.uiManager;
    
    switch (type) {
        case '404':
            ui && ui.showStatusBar('Page not found. Please return to Home.', 'warning', { autoDismiss: false });
            break;
        case '500':
            ui && ui.showStatusBar('Server error – please try again later.', 'error', { autoDismiss: false });
            break;
        case 'maintenance':
            ui && ui.showStatusBar('Service is under maintenance. Please try again later.', 'info', { autoDismiss: false });
            break;
        case 'network':
            ui && ui.showStatusBar('Network connection lost. Please check your connection.', 'error', { autoDismiss: false });
            break;
        case 'timeout':
            ui && ui.showStatusBar('Request timed out. Please try again.', 'warning', { autoDismiss: true });
            break;
        default:
            ui && ui.showStatusBar('An unexpected error occurred.', 'error', { autoDismiss: false });
    }
}

// Enhanced input validation with status bar feedback
function validateInput(input, rules = {}) {
    const ui = window.app && window.app.uiManager;
    const value = input.value.trim();
    
    // Required field validation
    if (rules.required && !value) {
        const message = rules.requiredMessage || 'This field is required.';
        if (ui) ui.showStatusBar(message, 'warning', { autoDismiss: true });
        return false;
    }
    
    // Email validation
    if (rules.email && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            const message = rules.emailMessage || 'Please enter a valid email address.';
            if (ui) ui.showStatusBar(message, 'warning', { autoDismiss: true });
            return false;
        }
    }
    
    // URL validation
    if (rules.url && value) {
        try {
            new URL(value);
        } catch {
            const message = rules.urlMessage || 'Please enter a valid URL.';
            if (ui) ui.showStatusBar(message, 'warning', { autoDismiss: true });
            return false;
        }
    }
    
    // Min length validation
    if (rules.minLength && value.length < rules.minLength) {
        const message = rules.minLengthMessage || `Must be at least ${rules.minLength} characters.`;
        if (ui) ui.showStatusBar(message, 'warning', { autoDismiss: true });
        return false;
    }
    
    // Max length validation
    if (rules.maxLength && value.length > rules.maxLength) {
        const message = rules.maxLengthMessage || `Must be no more than ${rules.maxLength} characters.`;
        if (ui) ui.showStatusBar(message, 'warning', { autoDismiss: true });
        return false;
    }
    
    // Custom validation
    if (rules.custom && !rules.custom(value)) {
        const message = rules.customMessage || 'Invalid input.';
        if (ui) ui.showStatusBar(message, 'warning', { autoDismiss: true });
        return false;
    }
    
    return true;
}

// === Import Dashboard Logic ===
function setupImportDashboard(app) {
    const dashboardTab = document.querySelector('.nav-item[data-view="import-dashboard"]');
    const dashboardView = document.getElementById('import-dashboard-view');
    const dropZone = document.getElementById('import-drop-zone');
    const fileInput = document.getElementById('dashboard-csv-file');
    const fileFeedback = document.getElementById('dashboard-file-feedback');
    const importOptions = document.getElementById('dashboard-import-options');
    const importActions = document.getElementById('dashboard-import-actions');

    if (!dashboardTab || !dashboardView || !dropZone || !fileInput) return;

    // Navigation: Show dashboard view, hide others
    dashboardTab.addEventListener('click', () => {
        document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
        dashboardView.style.display = 'block';
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        dashboardTab.classList.add('active');
        // Reset dashboard state
        fileFeedback.textContent = '';
        dropZone.classList.remove('dragover');
        fileInput.value = '';
        importOptions.innerHTML = '';
        importActions.innerHTML = '';
        // Optionally, render import options here
        renderDashboardImportOptions(app, importOptions, importActions);
    });

    // Drag-and-drop events
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });
    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
    });
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            handleDashboardFileSelect(files[0], app, fileFeedback, importOptions, importActions);
        }
    });
    // Fallback file input
    fileInput.addEventListener('change', (e) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleDashboardFileSelect(files[0], app, fileFeedback, importOptions, importActions);
        }
    });
}

function handleDashboardFileSelect(file, app, fileFeedback, importOptions, importActions) {
    if (!file || !file.name.match(/\.csv$|\.txt$/i)) {
        fileFeedback.textContent = 'Please select a valid CSV or TXT file.';
        fileFeedback.classList.add('error');
        return;
    }
    fileFeedback.classList.remove('error');
    fileFeedback.innerHTML = `<i class="fas fa-check-circle" style="color:var(--ping-success-green)"></i> ${file.name} (${file.type || 'text/csv'})`;
    // Use shared file handler logic
    app.fileHandler.handleFile(file).then(() => {
        // Render import options and actions after file is loaded
        renderDashboardImportOptions(app, importOptions, importActions);
    }).catch(err => {
        fileFeedback.textContent = 'File parsing failed: ' + (err.message || err);
        fileFeedback.classList.add('error');
    });
}

function renderDashboardImportOptions(app, importOptions, importActions) {
    // Reuse the same import options UI as the classic import view
    // For simplicity, clone or move the relevant DOM or re-render options here
    // Example: show a submit button
    importOptions.innerHTML = '';
    importActions.innerHTML = '';
    // Add import options (toggles, etc.) as needed
    // ...
    // Add submit button
    const submitBtn = document.createElement('button');
    submitBtn.className = 'btn btn-primary';
    submitBtn.innerHTML = '<i class="fas fa-upload"></i> Start Import';
    submitBtn.onclick = () => app.startImport();
    importActions.appendChild(submitBtn);
}

// Initialize dashboard after app is ready
window.addEventListener('DOMContentLoaded', () => {
    if (window.app) {
        setupImportDashboard(window.app);
    } else {
        setTimeout(() => {
            if (window.app) setupImportDashboard(window.app);
        }, 1000);
    }
});

// In the settings form logic:
// When loading settings, set the region dropdown value to the region code
function populateSettingsForm(settings) {
    // ... existing code ...
    const regionSelect = document.getElementById('region');
    if (regionSelect && settings.region) {
        regionSelect.value = settings.region;
    }
    // ... existing code ...
}

// When saving settings, get the region code from the dropdown
function getSettingsFromForm() {
    // ... existing code ...
    const regionSelect = document.getElementById('region');
    const region = regionSelect ? regionSelect.value : 'NA';
    // ... existing code ...
    return {
        // ... other settings ...
        region,
        // ... other settings ...
    };
}

// Helper to get selected region info from dropdown
function getSelectedRegionInfo() {
    const regionSelect = document.getElementById('region');
    if (!regionSelect) return { code: 'NA', tld: 'com', label: 'North America (excluding Canada)' };
    const selectedOption = regionSelect.options[regionSelect.selectedIndex];
    return {
        code: selectedOption.value,
        tld: selectedOption.getAttribute('data-tld'),
        label: selectedOption.textContent
    };
}

// Ensure region dropdown is accessible
const regionSelect = document.getElementById('region');
if (regionSelect) {
    regionSelect.setAttribute('aria-label', 'Select PingOne region');
}