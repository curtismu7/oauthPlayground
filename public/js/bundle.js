(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

function _interopRequireDefault(e) {
  return e && e.__esModule ? e : {
    "default": e
  };
}
module.exports = _interopRequireDefault, module.exports.__esModule = true, module.exports["default"] = module.exports;

},{}],2:[function(require,module,exports){
"use strict";

// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;
function defaultSetTimout() {
  throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout() {
  throw new Error('clearTimeout has not been defined');
}
(function () {
  try {
    if (typeof setTimeout === 'function') {
      cachedSetTimeout = setTimeout;
    } else {
      cachedSetTimeout = defaultSetTimout;
    }
  } catch (e) {
    cachedSetTimeout = defaultSetTimout;
  }
  try {
    if (typeof clearTimeout === 'function') {
      cachedClearTimeout = clearTimeout;
    } else {
      cachedClearTimeout = defaultClearTimeout;
    }
  } catch (e) {
    cachedClearTimeout = defaultClearTimeout;
  }
})();
function runTimeout(fun) {
  if (cachedSetTimeout === setTimeout) {
    //normal enviroments in sane situations
    return setTimeout(fun, 0);
  }
  // if setTimeout wasn't available but was latter defined
  if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
    cachedSetTimeout = setTimeout;
    return setTimeout(fun, 0);
  }
  try {
    // when when somebody has screwed with setTimeout but no I.E. maddness
    return cachedSetTimeout(fun, 0);
  } catch (e) {
    try {
      // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
      return cachedSetTimeout.call(null, fun, 0);
    } catch (e) {
      // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
      return cachedSetTimeout.call(this, fun, 0);
    }
  }
}
function runClearTimeout(marker) {
  if (cachedClearTimeout === clearTimeout) {
    //normal enviroments in sane situations
    return clearTimeout(marker);
  }
  // if clearTimeout wasn't available but was latter defined
  if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
    cachedClearTimeout = clearTimeout;
    return clearTimeout(marker);
  }
  try {
    // when when somebody has screwed with setTimeout but no I.E. maddness
    return cachedClearTimeout(marker);
  } catch (e) {
    try {
      // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
      return cachedClearTimeout.call(null, marker);
    } catch (e) {
      // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
      // Some versions of I.E. have different rules for clearTimeout vs setTimeout
      return cachedClearTimeout.call(this, marker);
    }
  }
}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;
function cleanUpNextTick() {
  if (!draining || !currentQueue) {
    return;
  }
  draining = false;
  if (currentQueue.length) {
    queue = currentQueue.concat(queue);
  } else {
    queueIndex = -1;
  }
  if (queue.length) {
    drainQueue();
  }
}
function drainQueue() {
  if (draining) {
    return;
  }
  var timeout = runTimeout(cleanUpNextTick);
  draining = true;
  var len = queue.length;
  while (len) {
    currentQueue = queue;
    queue = [];
    while (++queueIndex < len) {
      if (currentQueue) {
        currentQueue[queueIndex].run();
      }
    }
    queueIndex = -1;
    len = queue.length;
  }
  currentQueue = null;
  draining = false;
  runClearTimeout(timeout);
}
process.nextTick = function (fun) {
  var args = new Array(arguments.length - 1);
  if (arguments.length > 1) {
    for (var i = 1; i < arguments.length; i++) {
      args[i - 1] = arguments[i];
    }
  }
  queue.push(new Item(fun, args));
  if (queue.length === 1 && !draining) {
    runTimeout(drainQueue);
  }
};

// v8 likes predictible objects
function Item(fun, array) {
  this.fun = fun;
  this.array = array;
}
Item.prototype.run = function () {
  this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};
function noop() {}
process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;
process.listeners = function (name) {
  return [];
};
process.binding = function (name) {
  throw new Error('process.binding is not supported');
};
process.cwd = function () {
  return '/';
};
process.chdir = function (dir) {
  throw new Error('process.chdir is not supported');
};
process.umask = function () {
  return 0;
};

},{}],3:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _logger = require("./modules/logger.js");
var _fileLogger = require("./modules/file-logger.js");
var _settingsManager = require("./modules/settings-manager.js");
var _uiManager = require("./modules/ui-manager.js");
var _localApiClient = require("./modules/local-api-client.js");
var _pingoneClient = require("./modules/pingone-client.js");
var _tokenManager = _interopRequireDefault(require("./modules/token-manager.js"));
var _fileHandler = require("./modules/file-handler.js");
var _versionManager = require("./modules/version-manager.js");
var _apiFactory = require("./modules/api-factory.js");
var _progressManager = require("./modules/progress-manager.js");
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
    this.inputElement.addEventListener('input', e => {
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
    this.isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' && !window.location.hostname.includes('dev');

    // Initialize core dependencies with safety checks
    try {
      this.logger = new _logger.Logger();
      this.fileLogger = new _fileLogger.FileLogger();
      this.settingsManager = new _settingsManager.SettingsManager();
      this.uiManager = new _uiManager.UIManager();
      this.localClient = new _localApiClient.LocalAPIClient();
      this.versionManager = new _versionManager.VersionManager();

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
        window.addEventListener('error', event => {
          this.safeLogger.error('Unhandled error in production', {
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            error: event.error?.stack
          });
        });

        // Add unhandled promise rejection handler
        window.addEventListener('unhandledrejection', event => {
          this.safeLogger.error('Unhandled promise rejection in production', {
            reason: event.reason,
            promise: event.promise
          });
        });
      }
    } catch (error) {
      console.error('❌ Error in App constructor:', error);
      // Ensure basic functionality even if some components fail
      this.logger = {
        error: console.error,
        warn: console.warn,
        info: console.log
      };
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
          }, {
            once: true
          });
        });
      }

      // Additional validation to ensure critical elements exist
      const criticalElements = ['notification-area', 'universal-token-status', 'connection-status'];
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
      if (_apiFactory.apiFactory) {
        this.pingOneClient = _apiFactory.apiFactory.getPingOneClient(this.logger, this.settingsManager);
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

      // Initialize FileHandler with safety check
      try {
        this.fileHandler = new _fileHandler.FileHandler(this.logger, this.uiManager);
        // Initialize global drag-and-drop prevention and routing
        if (this.fileHandler && typeof this.fileHandler.initializeGlobalDragAndDrop === 'function') {
          this.fileHandler.initializeGlobalDragAndDrop();
        }
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
      await (0, _apiFactory.initAPIFactory)(this.logger, this.settingsManager);
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
    await Promise.all([this.loadPopulationsForDropdown('import-population-select'), this.loadPopulationsForDropdown('dashboard-population-select'), this.loadPopulationsForDropdown('delete-population-select'), this.loadPopulationsForDropdown('modify-population-select')]);
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
      const hasPopulation = dropdownValue && dropdownValue !== '' || storedPopulationId && storedPopulationId !== '';

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
      csvFileInput.addEventListener('change', event => {
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
      startImportBtn.addEventListener('click', async e => {
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
      startImportBtnBottom.addEventListener('click', async e => {
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
      cancelImportBtn.addEventListener('click', e => {
        e.preventDefault();
        this.cancelImport();
      });
    }
    const cancelImportBtnBottom = document.getElementById('cancel-import-btn-bottom');
    if (cancelImportBtnBottom) {
      cancelImportBtnBottom.addEventListener('click', e => {
        e.preventDefault();
        this.cancelImport();
      });
    }

    // Export event listeners
    const startExportBtn = document.getElementById('start-export-btn');
    if (startExportBtn) {
      startExportBtn.addEventListener('click', async e => {
        e.preventDefault();
        await this.startExport();
      });
    }
    const cancelExportBtn = document.getElementById('cancel-export-btn');
    if (cancelExportBtn) {
      cancelExportBtn.addEventListener('click', e => {
        e.preventDefault();
        this.cancelExport();
      });
    }

    // Delete event listeners
    const startDeleteBtn = document.getElementById('start-delete-btn');
    if (startDeleteBtn) {
      startDeleteBtn.addEventListener('click', async e => {
        e.preventDefault();
        await this.startDelete();
      });
    }
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
    if (cancelDeleteBtn) {
      cancelDeleteBtn.addEventListener('click', e => {
        e.preventDefault();
        this.cancelDelete();
      });
    }

    // Modify event listeners
    const startModifyBtn = document.getElementById('start-modify-btn');
    if (startModifyBtn) {
      startModifyBtn.addEventListener('click', async e => {
        e.preventDefault();
        await this.startModify();
      });
    }
    const cancelModifyBtn = document.getElementById('cancel-modify-btn');
    if (cancelModifyBtn) {
      cancelModifyBtn.addEventListener('click', e => {
        e.preventDefault();
        this.cancelModify();
      });
    }

    // Population delete event listeners
    const startPopulationDeleteBtn = document.getElementById('start-population-delete-btn');
    if (startPopulationDeleteBtn) {
      startPopulationDeleteBtn.addEventListener('click', async e => {
        e.preventDefault();
        await this.startPopulationDelete();
      });
    }
    const cancelPopulationDeleteBtn = document.getElementById('cancel-population-delete-btn');
    if (cancelPopulationDeleteBtn) {
      cancelPopulationDeleteBtn.addEventListener('click', e => {
        e.preventDefault();
        this.cancelPopulationDelete();
      });
    }

    // Settings form event listeners
    const settingsForm = document.getElementById('settings-form');
    if (settingsForm) {
      settingsForm.addEventListener('submit', async e => {
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
      testConnectionBtn.addEventListener('click', async e => {
        e.preventDefault();
        await this.testConnection();
      });
    }

    // Population dropdown event listener
    const populationSelect = document.getElementById('import-population-select');
    if (populationSelect) {
      console.log('Setting up population select event listener...');
      populationSelect.addEventListener('change', e => {
        const selectedPopulationId = e.target.value;
        const selectedPopulationName = e.target.selectedOptions[0]?.text || '';
        console.log('=== Population Selection Changed ===');
        console.log('Selected Population ID:', selectedPopulationId);
        console.log('Selected Population Name:', selectedPopulationName);
        console.log('Event target:', e.target);
        console.log('All options:', Array.from(e.target.options).map(opt => ({
          value: opt.value,
          text: opt.text,
          selected: opt.selected
        })));
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
      getTokenBtn.addEventListener('click', async e => {
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
      item.addEventListener('click', e => {
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
      toggle.addEventListener('change', async e => {
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
      closeImportStatusBtn.addEventListener('click', e => {
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
      const pingOneInitialized = serverInfo?.pingOneInitialized || serverInfo?.pingOne?.initialized || checks?.pingOneConnected === 'ok' || false;

      // Additional check: if pingOneConnected is 'ok', consider it initialized
      const isConnected = checks?.pingOneConnected === 'ok';

      // Safely extract error information with multiple fallback paths
      const lastError = serverInfo?.lastError || serverInfo?.error || checks?.pingOneConfigured === 'error' ? 'Configuration error' : null || null;
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
        this.safeLogger.warn('Server is not connected to PingOne', {
          error: errorMessage
        });
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
        this.logger?.warn('No navigation items found for view update', {
          view
        });
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
      this.pingOneClient = _apiFactory.apiFactory.getPingOneClient(this.logger, this.settingsManager);

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
      this.logger.error('Failed to save settings', {
        error: error.message
      });
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
        this.logger.error(`Error setting field ${id}`, {
          error: error.message
        });
        missingFields.push(id);
      }
    }
    if (missingFields.length > 0) {
      this.logger.warn('Missing form fields', {
        missingFields
      });
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
    const connectRobustSSE = sessionId => {
      // Validate sessionId before attempting connection
      if (!sessionId || typeof sessionId !== 'string' || sessionId.trim() === '') {
        console.error("SSE: ❌ Invalid sessionId - cannot establish connection", {
          sessionId
        });
        this.uiManager.debugLog("SSE", "❌ Invalid sessionId - cannot establish connection", {
          sessionId
        });
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
                this.fallbackPolling = startFallbackPolling(sseUrl, progressData => {
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
        onMessage: event => {
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
        onOpen: event => {
          console.log("SSE: ✅ Robust SSE connection opened:", event);
          this.uiManager.debugLog("SSE", "✅ Robust SSE connection opened", {
            event: event
          });
          this.uiManager.showInfo(`SSE connected for import (sessionId: ${sessionId})`);
          this.uiManager.showStatusMessage('success', 'Real-time connection established', 'Progress updates will be shown in real-time during the import process.');
        },
        // Handle connection errors
        onError: event => {
          console.error("SSE: ❌ Robust SSE connection error:", event);
          this.uiManager.debugLog("SSE", "❌ Robust SSE connection error", {
            error: event
          });
          this.uiManager.showError('SSE Connection Error', 'Connection error occurred');

          // If robust SSE fails completely, start fallback polling
          if (!this.fallbackPolling) {
            console.log("SSE: 🔄 Starting fallback polling due to connection failure");
            this.uiManager.showWarning('SSE: Switching to fallback polling mode');
            this.fallbackPolling = startFallbackPolling(sseUrl, progressData => {
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
    this.handleProgressUpdate = data => {
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
        const percentage = Math.round(data.current / data.total * 100);
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
      this.uiManager.updateImportProgress(data.current || 0, data.total || 0, data.message || '', data.counts || {}, data.populationName || '', data.populationId || '');

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
      formData.append('populationId', importOptions.selectedPopulationId);
      formData.append('populationName', importOptions.selectedPopulationName);
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
      this.uiManager.debugLog("Import", "Session ID received", {
        sessionId
      });
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
    const populationFilter = document.getElementById('export-population-filter')?.value || 'all';
    if (!selectedPopulationId) {
      this.uiManager.showError('No population selected', 'Please select a population before starting the export.');
      return null;
    }
    return {
      selectedPopulationId,
      selectedPopulationName,
      populationFilter,
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
    const minutes = Math.floor(seconds % 3600 / 60);
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
        const successMessage = timeLeft ? `✅ New token acquired. Time left on token: ${timeLeft}` : '✅ New token acquired successfully';
        this.uiManager.updateConnectionStatus('connected', successMessage);
        this.uiManager.showSuccess('Token retrieved and stored successfully', timeLeft ? `Token has been saved to your browser. Time left: ${timeLeft}` : 'Token has been saved to your browser for future use.');
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
      const response = await this.localClient.post(`/api/feature-flags/${flag}`, {
        enabled
      });
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
      newCheckbox.addEventListener('change', async e => {
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
    // No-op: No refreshProgressData method exists; navigation should not throw errors.
    // If needed, call a real method here (e.g., this.uiManager.startExportOperation()), but only if required.
  }

  // Test function to verify population selection
  testPopulationSelection() {
    console.log('=== Testing Population Selection ===');
    const populationSelect = document.getElementById('import-population-select');
    console.log('Population select element:', populationSelect);
    console.log('Current value:', populationSelect?.value);
    console.log('Selected option text:', populationSelect?.selectedOptions[0]?.text);
    console.log('All options:', populationSelect ? Array.from(populationSelect.options).map(opt => ({
      value: opt.value,
      text: opt.text
    })) : 'No select element');

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
      const isConsistent = options.selectedPopulationId === currentSelection.id && currentSelection.id === forceRefresh.id;
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
    // New disclaimer modal system - check if disclaimer was previously accepted
    console.log('[Disclaimer] Setting up disclaimer agreement system');
    try {
      // Check if disclaimer was previously accepted
      if (window.DisclaimerModal && window.DisclaimerModal.isDisclaimerAccepted()) {
        console.log('[Disclaimer] Disclaimer previously accepted, enabling tool');
        this.enableToolAfterDisclaimer();
        this.showDisclaimerStatus();
        return;
      }

      // If disclaimer modal is available, let it handle the disclaimer flow
      if (window.DisclaimerModal) {
        console.log('[Disclaimer] Using new disclaimer modal system');
        // The modal will handle the disclaimer flow automatically
        return;
      }

      // Fallback to old disclaimer system if modal is not available
      console.warn('[Disclaimer] Disclaimer modal not available, using fallback system');
      this.setupFallbackDisclaimer();
    } catch (err) {
      console.error('[Disclaimer] Error in setupDisclaimerAgreement:', err);
    }
  }
  setupFallbackDisclaimer() {
    // Fallback disclaimer system for when modal is not available
    try {
      const disclaimerCheckbox = document.getElementById('disclaimer-agreement');
      const acceptButton = document.getElementById('accept-disclaimer');
      const disclaimerBox = document.getElementById('disclaimer');
      if (!disclaimerCheckbox || !acceptButton || !disclaimerBox) {
        console.warn('[Disclaimer] Fallback disclaimer elements not found');
        return;
      }
      console.log('[Disclaimer] Setting up fallback disclaimer system');
      const checkAgreementStatus = () => {
        const isChecked = disclaimerCheckbox.checked;
        acceptButton.disabled = !isChecked;
        if (isChecked) {
          acceptButton.classList.remove('btn-secondary');
          acceptButton.classList.add('btn-danger');
        } else {
          acceptButton.classList.remove('btn-danger');
          acceptButton.classList.add('btn-secondary');
        }
      };
      disclaimerCheckbox.addEventListener('change', e => {
        console.log('[Disclaimer] Checkbox changed:', e.target.checked);
        checkAgreementStatus();
      });
      acceptButton.addEventListener('click', e => {
        e.preventDefault();
        console.log('[Disclaimer] Accept button clicked');
        if (disclaimerCheckbox.checked) {
          console.log('[Disclaimer] ✅ Disclaimer accepted - enabling tool');
          this.enableToolAfterDisclaimer();
        } else {
          console.warn('[Disclaimer] ❌ Button clicked but checkbox not checked');
          this.uiManager.showError('Disclaimer Error', 'Please check the agreement box before proceeding.');
        }
      });
      checkAgreementStatus();
      console.log('[Disclaimer] Fallback disclaimer setup completed');
    } catch (err) {
      console.error('[Disclaimer] Error in setupFallbackDisclaimer:', err);
    }
  }

  // Check if disclaimer was previously accepted
  checkDisclaimerStatus() {
    // Use the new disclaimer modal system if available
    if (window.DisclaimerModal && window.DisclaimerModal.isDisclaimerAccepted()) {
      console.log('[Disclaimer] Disclaimer previously accepted via modal system');
      this.enableToolAfterDisclaimer();
      this.showDisclaimerStatus();
      return true;
    }

    // Fallback to localStorage check
    if (typeof localStorage !== 'undefined') {
      const disclaimerAccepted = localStorage.getItem('disclaimerAccepted');
      const disclaimerDate = localStorage.getItem('disclaimerAcceptedDate');
      console.log('[Disclaimer] Status check:', {
        accepted: disclaimerAccepted,
        date: disclaimerDate
      });
      if (disclaimerAccepted === 'true') {
        console.log('[Disclaimer] Disclaimer previously accepted, enabling tool');
        this.enableToolAfterDisclaimer();
        this.showDisclaimerStatus();
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
    const hasPopulationColumn = Object.keys(users[0]).some(h => h.toLowerCase() === 'populationid' || h.toLowerCase() === 'population_id');
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
    const resolveConflict = async useCsvPopulation => {
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
    const resolveInvalidPopulation = async selectedPopulationId => {
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
    return new Promise(resolve => {
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

      // Show disclaimer status instead of success message
      this.showDisclaimerStatus();

      // Store disclaimer acceptance in localStorage
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('disclaimerAccepted', 'true');
        localStorage.setItem('disclaimerAcceptedDate', new Date().toISOString());
      }

      // Scroll to top of page smoothly after disclaimer acceptance
      setTimeout(() => {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'smooth'
        });
        console.log('[Disclaimer] ✅ Scrolled to top of page smoothly');
      }, 100);
      console.log('[Disclaimer] ✅ Tool enabled successfully after disclaimer acceptance');
    } catch (error) {
      console.error('[Disclaimer] Error enabling tool after disclaimer:', error);
      this.uiManager.showError('Error', 'Failed to enable tool after disclaimer acceptance.');
    }
  }
  showDisclaimerStatus() {
    // Show the disclaimer status section
    const disclaimerStatus = document.getElementById('disclaimer-status');
    if (disclaimerStatus) {
      disclaimerStatus.style.display = 'block';
      console.log('[Disclaimer] Disclaimer status shown');
    }

    // Log the disclaimer acceptance
    if (window.logManager) {
      window.logManager.log('info', 'Disclaimer accepted by user', {
        source: 'app',
        type: 'disclaimer',
        timestamp: new Date().toISOString()
      });
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
    console.log('[Population] Dropdown changed:', {
      id: selectedId,
      name: selectedName
    });

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
window.clearDebugLog = function () {
  const debugContent = document.getElementById('debug-log-content');
  if (debugContent) {
    debugContent.innerHTML = '';
  }
};
window.toggleDebugFilter = function (area) {
  // Store filter state
  if (!window.debugFilters) window.debugFilters = {};
  window.debugFilters[area] = !window.debugFilters[area];
  applyDebugFilters();
};
window.applyDebugFilters = function () {
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
document.addEventListener('click', e => {
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
window.addExpandIconsToLogEntries = function () {
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
    if (forceOpen === true || !isOpen && forceOpen === undefined) {
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
  constructor(url, {
    onMessage,
    onOpen,
    onError,
    onStatus,
    maxRetries = 10,
    baseDelay = 1000,
    maxDelay = 30000
  } = {}) {
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
    this.eventSource.onopen = e => {
      this.retryCount = 0;
      this._emitStatus('connected');
      if (this.onOpen) this.onOpen(e);
      console.log('[SSE] Connected:', this.url);
    };
    this.eventSource.onmessage = e => {
      if (this.onMessage) this.onMessage(e);
    };
    this.eventSource.onerror = e => {
      this._emitStatus('error');
      if (this.onError) this.onError(e);
      console.error('[SSE] Error:', e);
      this.eventSource.close();
      if (!this.closed) this._scheduleReconnect();
    };
    this.eventSource.onclose = e => {
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
  let color = '#6c757d',
    msg = 'Unknown';
  if (status === 'connected') {
    color = '#28a745';
    msg = 'Connected';
  } else if (status === 'connecting') {
    color = '#ffc107';
    msg = 'Connecting...';
  } else if (status === 'reconnecting') {
    color = '#ffc107';
    msg = 'Reconnecting...';
  } else if (status === 'error') {
    color = '#dc3545';
    msg = 'Connection Error';
  } else if (status === 'closed') {
    color = '#dc3545';
    msg = 'Disconnected';
  } else if (status === 'failed') {
    color = '#dc3545';
    msg = 'Failed';
  }
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
    fetch(progressUrl).then(r => r.json()).then(data => {
      if (onProgress) onProgress({
        data: JSON.stringify(data)
      });
    }).catch(err => {
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
    onMessage: e => {
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
        if (ui) ui.showStatusBar(userMessage, errorType, {
          autoDismiss: false
        });
      }).catch(() => {
        if (ui) ui.showStatusBar(userMessage, errorType, {
          autoDismiss: false
        });
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
    ui.showStatusBar('Processing...', 'info', {
      autoDismiss: false
    });
  }

  // Submit with error handling
  submitFn(form).catch(error => {
    handleAppError(error, {
      context: 'Form submission failed'
    });
  });
  return true;
}

// Enhanced fallback UI for critical errors
function showFallbackUI(type) {
  const ui = window.app && window.app.uiManager;
  switch (type) {
    case '404':
      ui && ui.showStatusBar('Page not found. Please return to Home.', 'warning', {
        autoDismiss: false
      });
      break;
    case '500':
      ui && ui.showStatusBar('Server error – please try again later.', 'error', {
        autoDismiss: false
      });
      break;
    case 'maintenance':
      ui && ui.showStatusBar('Service is under maintenance. Please try again later.', 'info', {
        autoDismiss: false
      });
      break;
    case 'network':
      ui && ui.showStatusBar('Network connection lost. Please check your connection.', 'error', {
        autoDismiss: false
      });
      break;
    case 'timeout':
      ui && ui.showStatusBar('Request timed out. Please try again.', 'warning', {
        autoDismiss: true
      });
      break;
    default:
      ui && ui.showStatusBar('An unexpected error occurred.', 'error', {
        autoDismiss: false
      });
  }
}

// Enhanced input validation with status bar feedback
function validateInput(input, rules = {}) {
  const ui = window.app && window.app.uiManager;
  const value = input.value.trim();

  // Required field validation
  if (rules.required && !value) {
    const message = rules.requiredMessage || 'This field is required.';
    if (ui) ui.showStatusBar(message, 'warning', {
      autoDismiss: true
    });
    return false;
  }

  // Email validation
  if (rules.email && value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      const message = rules.emailMessage || 'Please enter a valid email address.';
      if (ui) ui.showStatusBar(message, 'warning', {
        autoDismiss: true
      });
      return false;
    }
  }

  // URL validation
  if (rules.url && value) {
    try {
      new URL(value);
    } catch {
      const message = rules.urlMessage || 'Please enter a valid URL.';
      if (ui) ui.showStatusBar(message, 'warning', {
        autoDismiss: true
      });
      return false;
    }
  }

  // Min length validation
  if (rules.minLength && value.length < rules.minLength) {
    const message = rules.minLengthMessage || `Must be at least ${rules.minLength} characters.`;
    if (ui) ui.showStatusBar(message, 'warning', {
      autoDismiss: true
    });
    return false;
  }

  // Max length validation
  if (rules.maxLength && value.length > rules.maxLength) {
    const message = rules.maxLengthMessage || `Must be no more than ${rules.maxLength} characters.`;
    if (ui) ui.showStatusBar(message, 'warning', {
      autoDismiss: true
    });
    return false;
  }

  // Custom validation
  if (rules.custom && !rules.custom(value)) {
    const message = rules.customMessage || 'Invalid input.';
    if (ui) ui.showStatusBar(message, 'warning', {
      autoDismiss: true
    });
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
  dropZone.addEventListener('dragover', e => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });
  dropZone.addEventListener('dragleave', e => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
  });
  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleDashboardFileSelect(files[0], app, fileFeedback, importOptions, importActions);
    }
  });
  // Fallback file input
  fileInput.addEventListener('change', e => {
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
    region
    // ... other settings ...
  };
}

// Helper to get selected region info from dropdown
function getSelectedRegionInfo() {
  const regionSelect = document.getElementById('region');
  if (!regionSelect) return {
    code: 'NA',
    tld: 'com',
    label: 'North America (excluding Canada)'
  };
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

// ... existing code ...
// After fileHandler and UIManager are initialized and import view is set up:
function setupImportDropZone() {
  const dropZone = document.getElementById('import-drop-zone');
  const fileInput = document.getElementById('csv-file');
  if (dropZone && fileInput && window.fileHandler) {
    window.fileHandler.initializeDropZone(dropZone);
    // Make clicking the drop zone open the file picker
    dropZone.addEventListener('click', () => fileInput.click());
    // Keyboard accessibility: Enter/Space triggers file input
    dropZone.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        fileInput.click();
      }
    });
  }
}

// Call this after import view is shown (or on DOMContentLoaded if always visible)
document.addEventListener('DOMContentLoaded', () => {
  setupImportDropZone();
});
// ... existing code ...

// ... existing code ...
// After fileHandler and UIManager are initialized and modify view is set up:
function setupModifyDropZone() {
  const dropZone = document.getElementById('modify-drop-zone');
  const fileInput = document.getElementById('modify-csv-file');
  if (dropZone && fileInput && window.fileHandler) {
    window.fileHandler.initializeDropZone(dropZone);
    // Make clicking the drop zone open the file picker
    dropZone.addEventListener('click', () => fileInput.click());
    // Keyboard accessibility: Enter/Space triggers file input
    dropZone.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        fileInput.click();
      }
    });
  } else {
    if (!dropZone) console.warn('[Modify] Drop zone element missing');
    if (!fileInput) console.warn('[Modify] File input element missing');
    if (!window.fileHandler) console.warn('[Modify] FileHandler not initialized');
  }
}

// Call this after modify view is shown
function onModifyViewShown() {
  setupModifyDropZone();
  // Check for required token and population elements
  const tokenStatus = document.getElementById('current-token-status');
  const homeTokenStatus = document.getElementById('home-token-status');
  const getTokenBtn = document.getElementById('get-token-btn');
  if (!tokenStatus) console.warn('[Modify] #current-token-status element missing');
  if (!homeTokenStatus) console.warn('[Modify] #home-token-status element missing');
  if (!getTokenBtn) console.warn('[Modify] Get Token button missing');
  // Only run population/token logic if elements exist
  if (tokenStatus && homeTokenStatus && getTokenBtn) {
    // Place any population or token logic here
    // e.g., this.loadPopulationsForDropdown('modify-population-select');
  }
}

// Patch showView to call onModifyViewShown for modify view
const originalShowView = window.app && window.app.showView;
if (originalShowView) {
  window.app.showView = function (view) {
    originalShowView.call(this, view);
    if (view === 'modify') {
      onModifyViewShown();
    }
  };
} else {
  document.addEventListener('DOMContentLoaded', () => {
    if (window.app && typeof window.app.showView === 'function') {
      const orig = window.app.showView;
      window.app.showView = function (view) {
        orig.call(this, view);
        if (view === 'modify') {
          onModifyViewShown();
        }
      };
    }
  });
}
// ... existing code ...

// ... existing code ...
window.enableToolAfterDisclaimer = () => {
  if (window.app && typeof window.app.enableToolAfterDisclaimer === 'function') {
    window.app.enableToolAfterDisclaimer();
  }
};
// ... existing code ...

},{"./modules/api-factory.js":4,"./modules/file-handler.js":8,"./modules/file-logger.js":9,"./modules/local-api-client.js":10,"./modules/logger.js":11,"./modules/pingone-client.js":12,"./modules/progress-manager.js":13,"./modules/settings-manager.js":14,"./modules/token-manager.js":15,"./modules/ui-manager.js":16,"./modules/version-manager.js":17,"@babel/runtime/helpers/interopRequireDefault":1}],4:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.apiFactory = exports.APIFactory = void 0;
exports.createAutoRetryAPIClient = createAutoRetryAPIClient;
exports.createPingOneAPIClient = createPingOneAPIClient;
exports.initAPIFactory = exports.getAPIFactory = exports.default = void 0;
var _tokenManager = _interopRequireDefault(require("./token-manager.js"));
var _localApiClient = require("./local-api-client.js");
var _pingoneClient = require("./pingone-client.js");
/**
 * API Factory - Creates API clients with automatic token re-authentication
 * 
 * This module provides a factory for creating API clients that automatically
 * handle token expiration by detecting 401 responses and retrying with new tokens
 * using stored credentials.
 */

/**
 * Create an API client with automatic token re-authentication
 * @param {Object} settings - API settings including credentials
 * @param {Object} logger - Logger instance
 * @returns {Object} API client with auto-retry capabilities
 */
function createAutoRetryAPIClient(settings, logger) {
  const tokenManager = new _tokenManager.default(logger, settings);

  /**
   * Make an API request with automatic token re-authentication
   * @param {string} url - The API endpoint URL
   * @param {Object} options - Request options
   * @returns {Promise<Object>} The API response
   */
  async function makeRequest(url, options = {}) {
    return await tokenManager.retryWithNewToken(async token => {
      const requestOptions = {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      };
      const response = await fetch(url, requestOptions);

      // Check for token expiration
      if (response.status === 401) {
        const responseText = await response.text().catch(() => '');
        const isTokenExpired = responseText.includes('token_expired') || responseText.includes('invalid_token') || responseText.includes('expired');
        if (isTokenExpired) {
          throw new Error('TOKEN_EXPIRED');
        }
      }
      return response;
    });
  }

  /**
   * GET request with auto-retry
   * @param {string} url - The API endpoint URL
   * @param {Object} options - Request options
   * @returns {Promise<Object>} The API response
   */
  async function get(url, options = {}) {
    return await makeRequest(url, {
      ...options,
      method: 'GET'
    });
  }

  /**
   * POST request with auto-retry
   * @param {string} url - The API endpoint URL
   * @param {Object} data - Request body data
   * @param {Object} options - Request options
   * @returns {Promise<Object>} The API response
   */
  async function post(url, data = null, options = {}) {
    const requestOptions = {
      ...options,
      method: 'POST'
    };
    if (data) {
      requestOptions.body = JSON.stringify(data);
    }
    return await makeRequest(url, requestOptions);
  }

  /**
   * PUT request with auto-retry
   * @param {string} url - The API endpoint URL
   * @param {Object} data - Request body data
   * @param {Object} options - Request options
   * @returns {Promise<Object>} The API response
   */
  async function put(url, data = null, options = {}) {
    const requestOptions = {
      ...options,
      method: 'PUT'
    };
    if (data) {
      requestOptions.body = JSON.stringify(data);
    }
    return await makeRequest(url, requestOptions);
  }

  /**
   * DELETE request with auto-retry
   * @param {string} url - The API endpoint URL
   * @param {Object} options - Request options
   * @returns {Promise<Object>} The API response
   */
  async function del(url, options = {}) {
    return await makeRequest(url, {
      ...options,
      method: 'DELETE'
    });
  }

  /**
   * PATCH request with auto-retry
   * @param {string} url - The API endpoint URL
   * @param {Object} data - Request body data
   * @param {Object} options - Request options
   * @returns {Promise<Object>} The API response
   */
  async function patch(url, data = null, options = {}) {
    const requestOptions = {
      ...options,
      method: 'PATCH'
    };
    if (data) {
      requestOptions.body = JSON.stringify(data);
    }
    return await makeRequest(url, requestOptions);
  }

  /**
   * Get token information
   * @returns {Object|null} Token info
   */
  function getTokenInfo() {
    return tokenManager.getTokenInfo();
  }

  /**
   * Update settings and clear token cache if credentials changed
   * @param {Object} newSettings - New settings
   */
  function updateSettings(newSettings) {
    tokenManager.updateSettings(newSettings);
  }
  return {
    get,
    post,
    put,
    del,
    patch,
    getTokenInfo,
    updateSettings,
    tokenManager
  };
}

/**
 * Create a PingOne API client with automatic token re-authentication
 * @param {Object} settings - PingOne API settings
 * @param {Object} logger - Logger instance
 * @returns {Object} PingOne API client
 */
function createPingOneAPIClient(settings, logger) {
  const baseURL = getPingOneBaseURL(settings.region);
  const apiClient = createAutoRetryAPIClient(settings, logger);

  /**
   * Get PingOne base URL for the region
   * @param {string} region - The region
   * @returns {string} Base URL
   */
  function getPingOneBaseURL(region) {
    const baseURLs = {
      'NorthAmerica': 'https://api.pingone.com',
      'Europe': 'https://api.eu.pingone.com',
      'Canada': 'https://api.ca.pingone.com',
      'Asia': 'https://api.apsoutheast.pingone.com',
      'Australia': 'https://api.aus.pingone.com',
      'US': 'https://api.pingone.com',
      'EU': 'https://api.eu.pingone.com',
      'AP': 'https://api.apsoutheast.pingone.com'
    };
    return baseURLs[region] || 'https://api.pingone.com';
  }

  /**
   * Make a PingOne API request
   * @param {string} endpoint - API endpoint (without base URL)
   * @param {Object} options - Request options
   * @returns {Promise<Object>} The API response
   */
  async function pingOneRequest(endpoint, options = {}) {
    const url = `${baseURL}/v1${endpoint}`;
    return await apiClient.makeRequest(url, options);
  }

  /**
   * Get users from PingOne
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Users response
   */
  async function getUsers(options = {}) {
    const queryParams = new URLSearchParams(options).toString();
    const endpoint = `/environments/${settings.environmentId}/users${queryParams ? `?${queryParams}` : ''}`;
    return await pingOneRequest(endpoint, {
      method: 'GET'
    });
  }

  /**
   * Create user in PingOne
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Create user response
   */
  async function createUser(userData) {
    const endpoint = `/environments/${settings.environmentId}/users`;
    return await pingOneRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  /**
   * Update user in PingOne
   * @param {string} userId - User ID
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Update user response
   */
  async function updateUser(userId, userData) {
    const endpoint = `/environments/${settings.environmentId}/users/${userId}`;
    return await pingOneRequest(endpoint, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  }

  /**
   * Delete user from PingOne
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Delete user response
   */
  async function deleteUser(userId) {
    const endpoint = `/environments/${settings.environmentId}/users/${userId}`;
    return await pingOneRequest(endpoint, {
      method: 'DELETE'
    });
  }

  /**
   * Get populations from PingOne
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Populations response
   */
  async function getPopulations(options = {}) {
    const queryParams = new URLSearchParams(options).toString();
    const endpoint = `/environments/${settings.environmentId}/populations${queryParams ? `?${queryParams}` : ''}`;
    return await pingOneRequest(endpoint, {
      method: 'GET'
    });
  }

  /**
   * Create population in PingOne
   * @param {Object} populationData - Population data
   * @returns {Promise<Object>} Create population response
   */
  async function createPopulation(populationData) {
    const endpoint = `/environments/${settings.environmentId}/populations`;
    return await pingOneRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(populationData)
    });
  }

  /**
   * Delete population from PingOne
   * @param {string} populationId - Population ID
   * @returns {Promise<Object>} Delete population response
   */
  async function deletePopulation(populationId) {
    const endpoint = `/environments/${settings.environmentId}/populations/${populationId}`;
    return await pingOneRequest(endpoint, {
      method: 'DELETE'
    });
  }
  return {
    // API methods
    getUsers,
    createUser,
    updateUser,
    deleteUser,
    getPopulations,
    createPopulation,
    deletePopulation,
    // Token management
    getTokenInfo: apiClient.getTokenInfo,
    updateSettings: apiClient.updateSettings,
    // Raw request method
    request: pingOneRequest
  };
}

/**
 * API Factory class - Backward compatibility
 */
class APIFactory {
  /**
   * Create a new APIFactory instance
   * @param {Object} logger - Logger instance
   * @param {Object} settingsManager - Settings manager instance
   */
  constructor(logger, settingsManager) {
    this.logger = logger || console;
    this.settingsManager = settingsManager;
    this.clients = new Map();
  }

  /**
   * Get or create a PingOne API client
   * @returns {PingOneClient} PingOne API client instance
   */
  getPingOneClient() {
    if (!this.clients.has('pingone')) {
      this.clients.set('pingone', new _pingoneClient.PingOneClient(this.logger, this.settingsManager));
    }
    return this.clients.get('pingone');
  }

  /**
   * Get or create a local API client
   * @param {string} [baseUrl=''] - Base URL for the API
   * @returns {LocalAPIClient} Local API client instance
   */
  getLocalClient(baseUrl = '') {
    const cacheKey = `local_${baseUrl}`;
    if (!this.clients.has(cacheKey)) {
      this.clients.set(cacheKey, new _localApiClient.LocalAPIClient(this.logger, baseUrl));
    }
    return this.clients.get(cacheKey);
  }

  /**
   * Get the default local API client (singleton)
   * @returns {LocalAPIClient} Default local API client instance
   */
  getDefaultLocalClient() {
    return _localApiClient.localAPIClient;
  }
}

// Create a singleton instance but don't export it directly
exports.APIFactory = APIFactory;
let _apiFactoryInstance = null;
let isInitializing = false;
let initializationPromise = null;

/**
 * Initialize the API factory with required dependencies
 * @param {Object} logger - Logger instance
 * @param {Object} settingsManager - Settings manager instance
 * @returns {Promise<APIFactory>} Initialized API factory instance
 */
const initAPIFactory = async (logger, settingsManager) => {
  // If already initialized, return the existing instance
  if (_apiFactoryInstance) {
    return _apiFactoryInstance;
  }

  // If initialization is in progress, wait for it to complete
  if (isInitializing) {
    if (initializationPromise) {
      return initializationPromise;
    }
  }

  // Set initialization flag and create a new promise
  isInitializing = true;
  initializationPromise = new Promise(async (resolve, reject) => {
    try {
      // Create the factory instance
      const factory = new APIFactory(logger, settingsManager);

      // Set the instance
      _apiFactoryInstance = factory;
      defaultAPIFactory = factory;

      // Log successful initialization
      if (logger && logger.info) {
        logger.info('API Factory initialized successfully');
      } else {
        console.log('API Factory initialized successfully');
      }
      resolve(factory);
    } catch (error) {
      const errorMsg = `Failed to initialize API Factory: ${error.message}`;
      if (logger && logger.error) {
        logger.error(errorMsg, {
          error
        });
      } else {
        console.error(errorMsg, error);
      }
      reject(new Error(errorMsg));
    } finally {
      isInitializing = false;
      initializationPromise = null;
    }
  });
  return initializationPromise;
};

// Export the singleton instance and initialization function
exports.initAPIFactory = initAPIFactory;
// For backward compatibility, export a default instance (will be initialized when initAPIFactory is called)
let defaultAPIFactory = null;
const apiFactory = exports.apiFactory = {
  getPingOneClient: () => {
    if (!defaultAPIFactory) {
      throw new Error('API Factory not initialized. Call initAPIFactory() first.');
    }
    return defaultAPIFactory.getPingOneClient();
  },
  getLocalClient: (baseUrl = '') => {
    if (!defaultAPIFactory) {
      throw new Error('API Factory not initialized. Call initAPIFactory() first.');
    }
    return defaultAPIFactory.getLocalClient(baseUrl);
  }
};

// For backward compatibility
const getAPIFactory = () => defaultAPIFactory;
exports.getAPIFactory = getAPIFactory;
var _default = exports.default = {
  createAutoRetryAPIClient,
  createPingOneAPIClient,
  initAPIFactory,
  apiFactory
};

},{"./local-api-client.js":10,"./pingone-client.js":12,"./token-manager.js":15,"@babel/runtime/helpers/interopRequireDefault":1}],5:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createCircularProgress = createCircularProgress;
/**
 * Circular Progress Spinner Component
 * Usage: createCircularProgress({ value, label, state, id })
 * - value: 0-100 (percent)
 * - label: status message (optional)
 * - state: '', 'error', 'warning', 'complete', 'ready' (optional)
 * - id: DOM id (optional)
 * 
 * Fixes visual duplication and rendering bugs in progress spinner during async operations
 */
function createCircularProgress({
  value = 0,
  label = '',
  state = '',
  id = ''
} = {}) {
  // Ensure proper sizing and rendering calculations
  const size = 80;
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  // Clamp value between 0 and 100
  const percent = Math.max(0, Math.min(100, value));

  // Calculate stroke dash array for proper circular progress
  const dashOffset = circumference - percent / 100 * circumference;

  // Generate unique ID if not provided
  const elementId = id || `circular-progress-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Create wrapper element with proper state management
  const wrapper = document.createElement('div');
  wrapper.className = `circular-progress${state ? ' ' + state : ''}`;
  wrapper.id = elementId;
  wrapper.setAttribute('role', 'progressbar');
  wrapper.setAttribute('aria-valuenow', percent);
  wrapper.setAttribute('aria-valuemin', 0);
  wrapper.setAttribute('aria-valuemax', 100);
  wrapper.setAttribute('aria-label', label ? `${label} ${percent}%` : `${percent}%`);

  // Add data attributes for debugging and state tracking
  wrapper.setAttribute('data-percent', percent);
  wrapper.setAttribute('data-state', state);
  wrapper.setAttribute('data-created', new Date().toISOString());

  // Create SVG with proper viewBox and dimensions
  wrapper.innerHTML = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <!-- Background circle -->
      <circle 
        class="circular-bg" 
        cx="${size / 2}" 
        cy="${size / 2}" 
        r="${radius}" 
        fill="none"
        stroke="#e0e0e0"
        stroke-width="${stroke}"
      />
      <!-- Foreground progress circle -->
      <circle 
        class="circular-fg" 
        cx="${size / 2}" 
        cy="${size / 2}" 
        r="${radius}" 
        fill="none"
        stroke="var(--brand-color, #7c3aed)"
        stroke-width="${stroke}"
        stroke-linecap="round"
        stroke-dasharray="${circumference}"
        stroke-dashoffset="${dashOffset}"
        transform="rotate(-90 ${size / 2} ${size / 2})"
      />
    </svg>
    <!-- Percentage label -->
    <span class="circular-label">${Math.round(percent)}%</span>
    ${label ? `<span class="circular-status">${label}</span>` : ''}
  `;

  // Add debug logging for spinner creation
  console.debug('Circular Progress Created:', {
    id: elementId,
    percent,
    state,
    size,
    stroke,
    radius,
    circumference,
    dashOffset,
    label
  });
  return wrapper;
}

},{}],6:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.cryptoUtils = exports.CryptoUtils = void 0;
// File: crypto-utils.js
// Description: Cryptographic utilities for secure data handling
// 
// This module provides encryption and decryption functionality for
// sensitive data like API secrets and user credentials. Uses the
// Web Crypto API for secure cryptographic operations.
// 
// Features:
// - PBKDF2 key derivation for secure key generation
// - AES-GCM encryption for authenticated encryption
// - Base64 encoding for storage compatibility
// - Error handling for decryption failures

/**
 * Cryptographic Utilities Class
 * 
 * Provides secure encryption and decryption using the Web Crypto API.
 * Uses PBKDF2 for key derivation and AES-GCM for authenticated encryption.
 * All methods are static for easy use throughout the application.
 */
class CryptoUtils {
  /**
   * Generate a cryptographic key for encryption/decryption
   * 
   * Uses PBKDF2 key derivation to create a secure key from a password.
   * The key is suitable for AES-GCM encryption operations.
   * 
   * @param {string} password - The password to derive the key from
   * @returns {Promise<CryptoKey>} A CryptoKey object for encryption/decryption
   */
  static async generateKey(password) {
    // Convert password to key material using PBKDF2
    const encoder = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits', 'deriveKey']);

    // Derive the actual encryption key using PBKDF2
    return window.crypto.subtle.deriveKey({
      name: 'PBKDF2',
      salt: new TextEncoder().encode('PingOneImportSalt'),
      // Should be unique per user in production
      iterations: 100000,
      hash: 'SHA-256'
    }, keyMaterial, {
      name: 'AES-GCM',
      length: 256
    }, false, ['encrypt', 'decrypt']);
  }

  /**
   * Encrypt a string using AES-GCM
   * 
   * Encrypts text using AES-GCM with a random initialization vector (IV).
   * The IV is prepended to the encrypted data for secure storage.
   * Returns the result as base64-encoded string.
   * 
   * @param {string} text - The text to encrypt
   * @param {CryptoKey} key - The encryption key
   * @returns {Promise<string>} Encrypted text as base64 string
   */
  static async encrypt(text, key) {
    // Convert text to UTF-8 bytes
    const encoder = new TextEncoder();
    const data = encoder.encode(text);

    // Generate a random IV (Initialization Vector) for security
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    // Encrypt the data using AES-GCM
    const encrypted = await window.crypto.subtle.encrypt({
      name: 'AES-GCM',
      iv
    }, key, data);

    // Combine IV and encrypted data into a single array
    // IV is prepended for secure storage and retrieval
    const result = new Uint8Array(iv.length + encrypted.byteLength);
    result.set(iv, 0);
    result.set(new Uint8Array(encrypted), iv.length);

    // Convert to base64 for storage compatibility
    return btoa(String.fromCharCode(...result));
  }

  /**
   * Decrypt a string
   * @param {string} encryptedBase64 - The encrypted text in base64 format
   * @param {CryptoKey} key - The decryption key
   * @returns {Promise<string>} Decrypted text
   */
  static async decrypt(encryptedBase64, key) {
    try {
      // Convert from base64 to Uint8Array
      const encryptedData = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));

      // Extract the IV (first 12 bytes)
      const iv = encryptedData.slice(0, 12);
      const data = encryptedData.slice(12);
      const decrypted = await window.crypto.subtle.decrypt({
        name: 'AES-GCM',
        iv
      }, key, data);
      return new TextDecoder().decode(decrypted);
    } catch (error) {
      // Don't log the error here - let the calling code handle it
      throw error;
    }
  }
}

// Export the class and a singleton instance
exports.CryptoUtils = CryptoUtils;
const cryptoUtils = exports.cryptoUtils = new CryptoUtils();

},{}],7:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ElementRegistry = void 0;
// ElementRegistry: Centralized DOM element lookup utility
// Provides safe, memoized access to all required UI elements with logging for missing elements
// Usage: import { ElementRegistry } from './element-registry.js';

const elementCache = {};
function getElement(selector, description, required = true) {
  // Input validation
  if (!selector || typeof selector !== 'string') {
    console.error(`[ElementRegistry] Invalid selector provided: ${selector}`);
    return null;
  }

  // Security: Prevent potential XSS through selector injection
  // Allow valid attribute selectors with quotes but prevent script injection
  if (selector.includes('<') || selector.includes('>') || selector.includes('"') && !selector.includes('[') && !selector.includes(']') || selector.includes("'") && !selector.includes('[') && !selector.includes(']')) {
    console.error(`[ElementRegistry] Potentially unsafe selector detected: ${selector}`);
    return null;
  }

  // Check cache first
  if (elementCache[selector]) {
    return elementCache[selector];
  }
  try {
    const el = document.querySelector(selector);
    if (!el && required) {
      console.warn(`[ElementRegistry] Missing required element: ${description} (${selector})`);
    } else if (!el) {
      console.info(`[ElementRegistry] Optional element not found: ${description} (${selector})`);
    } else {
      // Validate element is still in DOM
      if (!document.contains(el)) {
        console.warn(`[ElementRegistry] Element found but not in DOM: ${description} (${selector})`);
        elementCache[selector] = null;
        return null;
      }
    }
    elementCache[selector] = el;
    return el;
  } catch (error) {
    console.error(`[ElementRegistry] Error finding element: ${description} (${selector})`, error);
    elementCache[selector] = null;
    return null;
  }
}
const ElementRegistry = exports.ElementRegistry = {
  // Main UI elements
  importButton: () => getElement('#import-btn', 'Import Button'),
  fileInput: () => getElement('#csv-file', 'File Input'),
  statusBar: () => getElement('#status-bar', 'Status Bar'),
  dashboardTab: () => getElement('#dashboard-tab', 'Dashboard Tab'),
  dragDropArea: () => getElement('#drag-drop-area', 'Drag-and-Drop Area', false),
  // Notification and progress containers
  notificationContainer: () => getElement('#notification-area', 'Notification Container'),
  progressContainer: () => getElement('#progress-container', 'Progress Container'),
  // Token and connection status elements
  tokenStatus: () => getElement('#universal-token-status', 'Token Status'),
  connectionStatus: () => getElement('#connection-status', 'Connection Status'),
  currentTokenStatus: () => getElement('#current-token-status', 'Current Token Status'),
  universalTokenStatus: () => getElement('#universal-token-status', 'Universal Token Status'),
  homeTokenStatus: () => getElement('#home-token-status', 'Home Token Status'),
  // File handling elements
  fileInfo: () => getElement('#file-info', 'File Info'),
  previewContainer: () => getElement('#dashboard-preview', 'Preview Container'),
  fileInputLabel: () => getElement('label[for="csv-file"]', 'File Input Label'),
  deleteFileInput: () => getElement('#delete-csv-file', 'Delete File Input'),
  deleteFileInputLabel: () => getElement('label[for="delete-csv-file"]', 'Delete File Input Label'),
  modifyFileInput: () => getElement('#modify-csv-file', 'Modify File Input'),
  modifyFileInputLabel: () => getElement('label[for="modify-csv-file"]', 'Modify File Input Label'),
  // Population selection elements
  importPopulationSelect: () => getElement('#import-population-select', 'Import Population Select'),
  deletePopulationSelect: () => getElement('#delete-population-select', 'Delete Population Select'),
  modifyPopulationSelect: () => getElement('#modify-population-select', 'Modify Population Select'),
  dashboardPopulationSelect: () => getElement('#dashboard-population-select', 'Dashboard Population Select'),
  // Import buttons
  startImportBtn: () => getElement('#start-import', 'Start Import Button'),
  startImportBtnBottom: () => getElement('#bottom-start-import', 'Bottom Start Import Button'),
  // Settings elements
  settingsSaveStatus: () => getElement('#settings-save-status', 'Settings Save Status'),
  // Import status elements
  importStatus: () => getElement('#import-status', 'Import Status'),
  // Population checkboxes
  useDefaultPopulationCheckbox: () => getElement('#use-default-population', 'Use Default Population Checkbox'),
  useCsvPopulationIdCheckbox: () => getElement('#use-csv-population-id', 'Use CSV Population ID Checkbox'),
  // Get Token button
  getTokenBtn: () => getElement('#get-token-btn', 'Get Token Button'),
  // Population ID form field
  populationIdField: () => getElement('#population-id', 'Population ID Field')
};

},{}],8:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FileHandler = void 0;
var _elementRegistry = require("./element-registry.js");
// File: file-handler.js
// Description: CSV file processing and validation for PingOne user import
// 
// This module handles all file-related operations including:
// - CSV file reading and parsing
// - User data validation and error checking
// - File preview generation
// - File information display and management
// - Folder path tracking for better UX
// - Validation summary and error reporting
// 
// Provides comprehensive CSV processing with detailed validation feedback.

/**
 * File Handler Class
 * 
 * Manages CSV file processing, validation, and user data preparation
 * for the PingOne import tool. Handles file selection, parsing,
 * validation, and preview generation.
 * 
 * @param {Object} logger - Logger instance for debugging
 * @param {Object} uiManager - UI manager for status updates
 */
class FileHandler {
  constructor(logger, uiManager) {
    this.logger = logger;
    this.uiManager = uiManager;

    // Required fields for user validation
    this.requiredFields = ['username'];

    // Validation tracking for processed files
    this.validationResults = {
      total: 0,
      valid: 0,
      errors: 0,
      warnings: 0
    };

    // File processing state
    this.lastParsedUsers = [];
    this.currentFile = null;

    // Initialize UI elements for file handling
    this.fileInput = _elementRegistry.ElementRegistry.fileInput ? _elementRegistry.ElementRegistry.fileInput() : null;
    this.fileInfo = _elementRegistry.ElementRegistry.fileInfo ? _elementRegistry.ElementRegistry.fileInfo() : null;
    this.previewContainer = _elementRegistry.ElementRegistry.previewContainer ? _elementRegistry.ElementRegistry.previewContainer() : null;

    // Load last file info from localStorage for better UX
    this.lastFileInfo = this.loadLastFileInfo();

    // Initialize event listeners for file input
    this.initializeFileInput();
  }

  // ======================
  // File Info Management
  // ======================

  loadLastFileInfo() {
    try {
      const savedFile = localStorage.getItem('lastSelectedFile');
      return savedFile ? JSON.parse(savedFile) : null;
    } catch (error) {
      this.logger.error('Error loading last file info:', error);
      return null;
    }
  }

  /**
   * Get the current file being processed
   * 
   * Returns the File object that is currently loaded and ready for processing.
   * Used by other modules to access the file for upload operations.
   * 
   * @returns {File|null} The current file or null if none is loaded
   */
  getCurrentFile() {
    return this.currentFile;
  }

  /**
   * Set a file and process it for import
   * 
   * Validates the file, processes its contents, and prepares it for
   * import operations. Updates UI with file information and validation results.
   * 
   * @param {File} file - The file to set and process
   * @returns {Promise<Object>} Promise that resolves with processing result
   */
  async setFile(file) {
    try {
      this.logger.info('Setting file', {
        fileName: file.name,
        fileSize: file.size
      });

      // Store the current file reference for later use
      this.currentFile = file;

      // Process the file using the existing internal method
      // This includes validation, parsing, and UI updates
      await this._handleFileInternal(file);
      return {
        success: true,
        file
      };
    } catch (error) {
      this.logger.error('Failed to set file', {
        error: error.message,
        fileName: file.name
      });
      throw error;
    }
  }

  /**
   * Get the list of parsed users from the current file
   * 
   * Returns the array of user objects that were successfully parsed
   * from the CSV file. Each user object contains validated data.
   * 
   * @returns {Array} Array of user objects with validated data
   */
  getUsers() {
    return this.lastParsedUsers || [];
  }

  /**
   * Get the total number of users parsed from the CSV file
   * 
   * Returns the total count of users found in the processed CSV file.
   * This count includes all rows, regardless of validation status.
   * 
   * @returns {number} Total number of users in the CSV file
   */
  getTotalUsers() {
    const totalUsers = this.validationResults.total || 0;
    console.log('[CSV] getTotalUsers() called, returning:', totalUsers, 'validationResults:', this.validationResults);
    return totalUsers;
  }

  /**
   * Read file as text using FileReader API
   * 
   * Asynchronously reads a file and returns its contents as a string.
   * Used for processing CSV files and other text-based formats.
   * 
   * @param {File} file - The file to read
   * @returns {Promise<string>} Promise that resolves with file content as string
   */
  readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = event => resolve(event.target.result);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  /**
   * Save the last folder path that was used
   * @param {File} file - The selected file
   * @param {string} operationType - The operation type ('import', 'delete', 'modify')
   */
  saveLastFolderPath(file, operationType = 'import') {
    try {
      let folderPath = null;

      // Try to extract folder path from different sources
      if (file.webkitRelativePath) {
        // For webkitRelativePath, get the directory part
        const pathParts = file.webkitRelativePath.split('/');
        if (pathParts.length > 1) {
          folderPath = pathParts.slice(0, -1).join('/');
        }
      } else if (file.name) {
        // For regular files, try to extract from the file name
        // This is a fallback since we can't get the full path due to security restrictions
        const fileName = file.name;
        const lastSlashIndex = fileName.lastIndexOf('/');
        if (lastSlashIndex !== -1) {
          folderPath = fileName.substring(0, lastSlashIndex);
        }
      }
      if (folderPath) {
        // Save with operation-specific key
        const storageKey = `lastFolderPath_${operationType}`;
        localStorage.setItem(storageKey, folderPath);
        this.logger.info(`Saved last folder path for ${operationType}:`, folderPath);
      }

      // Also save a general last folder path
      if (folderPath) {
        localStorage.setItem('lastFolderPath', folderPath);
      }
    } catch (error) {
      this.logger.warn('Could not save folder path:', error.message);
    }
  }

  /**
   * Get the last folder path that was used
   * @param {string} operationType - The operation type ('import', 'delete', 'modify')
   * @returns {string|null} The last folder path or null if not available
   */
  getLastFolderPath(operationType = 'import') {
    try {
      // First try to get operation-specific folder path
      const operationKey = `lastFolderPath_${operationType}`;
      let folderPath = localStorage.getItem(operationKey);

      // Fall back to general last folder path
      if (!folderPath) {
        folderPath = localStorage.getItem('lastFolderPath');
      }
      return folderPath;
    } catch (error) {
      this.logger.warn('Could not get last folder path:', error.message);
      return null;
    }
  }

  /**
   * Update the file input label to show last folder path
   * @param {string} operationType - The operation type ('import', 'delete', 'modify')
   */
  updateFileLabel(operationType = 'import') {
    try {
      // Find the appropriate file label based on operation type
      let fileLabel = null;
      let fileInput = null;
      switch (operationType) {
        case 'import':
          fileLabel = _elementRegistry.ElementRegistry.fileInputLabel ? _elementRegistry.ElementRegistry.fileInputLabel() : null;
          fileInput = _elementRegistry.ElementRegistry.fileInput ? _elementRegistry.ElementRegistry.fileInput() : null;
          break;
        case 'delete':
          fileLabel = _elementRegistry.ElementRegistry.deleteFileInputLabel ? _elementRegistry.ElementRegistry.deleteFileInputLabel() : null;
          fileInput = _elementRegistry.ElementRegistry.deleteFileInput ? _elementRegistry.ElementRegistry.deleteFileInput() : null;
          break;
        case 'modify':
          fileLabel = _elementRegistry.ElementRegistry.modifyFileInputLabel ? _elementRegistry.ElementRegistry.modifyFileInputLabel() : null;
          fileInput = _elementRegistry.ElementRegistry.modifyFileInput ? _elementRegistry.ElementRegistry.modifyFileInput() : null;
          break;
        default:
          fileLabel = _elementRegistry.ElementRegistry.fileInputLabel ? _elementRegistry.ElementRegistry.fileInputLabel() : null;
          break;
      }
      if (fileLabel) {
        const lastFolderPath = this.getLastFolderPath(operationType);
        if (lastFolderPath) {
          // Show a shortened version of the path for better UI
          const shortPath = this.shortenPath(lastFolderPath);
          fileLabel.textContent = `Choose CSV File (Last: ${shortPath})`;
          fileLabel.title = `Last used folder: ${lastFolderPath}`;
        } else {
          fileLabel.textContent = 'Choose CSV File';
          fileLabel.title = 'Select a CSV file to process';
        }
      }
    } catch (error) {
      this.logger.warn('Could not update file label:', error.message);
    }
  }

  /**
   * Shorten a file path for display in the UI
   * @param {string} path - The full path
   * @returns {string} The shortened path
   */
  shortenPath(path) {
    if (!path) return '';
    const maxLength = 30;
    if (path.length <= maxLength) {
      return path;
    }

    // Try to keep the most relevant parts
    const parts = path.split('/');
    if (parts.length <= 2) {
      return path.length > maxLength ? '...' + path.slice(-maxLength + 3) : path;
    }

    // Keep first and last parts, add ellipsis in middle
    const firstPart = parts[0];
    const lastPart = parts[parts.length - 1];
    const middleParts = parts.slice(1, -1);
    let result = firstPart;
    if (middleParts.length > 0) {
      result += '/.../' + lastPart;
    } else {
      result += '/' + lastPart;
    }
    return result.length > maxLength ? '...' + result.slice(-maxLength + 3) : result;
  }
  saveFileInfo(fileInfo) {
    try {
      const fileData = {
        name: fileInfo.name,
        size: fileInfo.size,
        lastModified: fileInfo.lastModified,
        type: fileInfo.type
      };
      localStorage.setItem('lastSelectedFile', JSON.stringify(fileData));
      this.lastFileInfo = fileData;
    } catch (error) {
      this.logger.error('Error saving file info:', error);
    }
  }
  clearFileInfo() {
    try {
      localStorage.removeItem('lastSelectedFile');
      this.lastFileInfo = null;
      if (this.fileInfo) {
        this.fileInfo.innerHTML = 'No file selected';
      }
    } catch (error) {
      this.logger.error('Error clearing file info:', error);
    }
  }

  /**
   * Clear the last folder path
   */
  clearLastFolderPath() {
    try {
      localStorage.removeItem('lastFolderPath');
      this.updateFileLabel();
      this.logger.info('Cleared last folder path');
    } catch (error) {
      this.logger.warn('Could not clear last folder path:', error.message);
    }
  }

  // ======================
  // File Handling
  // ======================

  initializeFileInput() {
    if (!this.fileInput) return;

    // Remove existing event listeners
    const newFileInput = this.fileInput.cloneNode(true);
    this.fileInput.parentNode.replaceChild(newFileInput, this.fileInput);
    this.fileInput = newFileInput;

    // Add new event listener
    this.fileInput.addEventListener('change', event => this.handleFileSelect(event));

    // Update file label to show last folder path if available
    this.updateFileLabel();
  }

  /**
   * Handle a File object directly (not an event)
   * @param {File} file
   */
  async handleFileObject(file) {
    await this._handleFileInternal(file);
  }

  /**
   * Handle file selection from an input event
   * @param {Event} event
   */
  async handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) {
      this.logger.warn('No file selected');
      return;
    }

    // Save the folder path for next time
    this.saveLastFolderPath(file, 'import');
    await this._handleFileInternal(file, event);
  }

  /**
   * Shared internal file handling logic
   * @param {File} file
   * @param {Event} [event]
   * @private
   */
  async _handleFileInternal(file, event) {
    console.log('[CSV] _handleFileInternal called with file:', file.name, 'size:', file.size);
    try {
      this.logger.info('Processing file', {
        fileName: file.name,
        fileSize: file.size
      });

      // Validate file type - allow files without extensions or with any extension except known bad ones
      const fileName = file.name || '';
      const fileExt = this.getFileExtension(fileName).toLowerCase();
      const knownBadExts = ['exe', 'js', 'png', 'jpg', 'jpeg', 'gif', 'pdf', 'zip', 'tar', 'gz'];
      if (fileExt && knownBadExts.includes(fileExt)) {
        const errorMsg = `Unsupported file type: ${fileExt}. Please upload a CSV or text file.`;
        this.logger.error(errorMsg, {
          fileName,
          fileExt
        });
        throw new Error(errorMsg);
      }
      // Accept all other extensions and blank/unknown types (including files with no extension)

      // Validate file size (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error('File too large. Please select a file smaller than 10MB.');
      }

      // Read file content
      const content = await this.readFileAsText(file);
      console.log('[CSV] _handleFileInternal: About to parse CSV content, length:', content.length);
      // Parse CSV with enhanced validation
      const parseResults = this.parseCSV(content);
      console.log('[CSV] _handleFileInternal: parseCSV completed, parseResults:', parseResults);

      // Store parsed users
      this.parsedUsers = parseResults.users;
      this.lastParsedUsers = [...parseResults.users];

      // Update validation results for getTotalUsers() method
      this.validationResults = {
        total: parseResults.users.length,
        valid: parseResults.validUsers || parseResults.users.length,
        errors: parseResults.errors.length,
        warnings: parseResults.warnings.length
      };

      // Add debug logging
      console.log('[CSV] File parsed successfully:', {
        totalUsers: this.validationResults.total,
        validUsers: this.validationResults.valid,
        errors: this.validationResults.errors,
        warnings: this.validationResults.warnings
      });

      // Update UI with results
      const message = `File processed: ${parseResults.validUsers} valid users, ${parseResults.invalidRows} invalid rows`;
      this.uiManager.showNotification(message, parseResults.invalidRows > 0 ? 'warning' : 'success');

      // Update UI with enhanced file info display
      this.updateFileInfoForElement(file, 'file-info');

      // Update file label to show last folder path
      this.updateFileLabel('import');

      // Log detailed errors for debugging
      if (parseResults.errors.length > 0) {
        this.logger.warn('CSV parsing errors', {
          errorCount: parseResults.errors.length,
          errors: parseResults.errors.slice(0, 10) // Log first 10 errors
        });
      }

      // Update import button state based on population selection
      if (window.app && window.app.updateImportButtonState) {
        window.app.updateImportButtonState();
      }
    } catch (error) {
      this.logger.error('Failed to process CSV file', {
        error: error.message,
        fileName: file.name
      });
      console.error('Error in _handleFileInternal:', error);
      let errorMessage = 'Failed to process CSV file. ';
      if (error.message.includes('Missing required headers')) {
        errorMessage += error.message;
      } else if (error.message.includes('Invalid file type')) {
        errorMessage += 'Please select a valid CSV file.';
      } else if (error.message.includes('File too large')) {
        errorMessage += 'Please select a smaller file (max 10MB).';
      } else {
        errorMessage += error.message;
      }
      this.uiManager.showNotification(errorMessage, 'error');

      // Clear file input
      if (event && event.target && event.target.value) {
        event.target.value = '';
      }
    }
  }

  /**
   * Process a CSV file for user import
   * 
   * Validates the file format, reads its contents, parses CSV data,
   * and prepares user objects for import. Handles file validation,
   * CSV parsing, and error reporting.
   * 
   * @param {File} file - The CSV file to process
   * @returns {Promise<Object>} Promise that resolves with parsing results
   */
  async processCSV(file) {
    // Log file object for debugging
    this.logger.log('Processing file object:', 'debug', file);

    // Validate file exists and is not empty
    if (!file) {
      this.logger.error('No file provided to processCSV');
      throw new Error('No file selected');
    }
    if (file.size === 0) {
      this.logger.error('Empty file provided', {
        fileName: file.name,
        size: file.size
      });
      throw new Error('File is empty');
    }

    // Only block known bad extensions, allow all others
    const fileName = file.name || '';
    const fileExt = this.getFileExtension(fileName).toLowerCase();
    const knownBadExts = ['exe', 'js', 'png', 'jpg', 'jpeg', 'gif', 'pdf', 'zip', 'tar', 'gz'];
    if (fileExt && knownBadExts.includes(fileExt)) {
      const errorMsg = `Unsupported file type: ${fileExt}. Please upload a CSV or text file.`;
      this.logger.error(errorMsg, {
        fileName,
        fileExt
      });
      throw new Error(errorMsg);
    }
    // Accept all other extensions and blank/unknown types
    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error(`File is too large. Maximum size is ${this.formatFileSize(maxSize)}`);
    }

    // Update UI
    this.saveFileInfo(file);
    this.updateFileInfo(file);

    // Store the current file reference
    this.currentFile = file;
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = event => {
        try {
          const text = event.target.result;
          if (!text || text.trim() === '') {
            throw new Error('File is empty or contains no text');
          }
          console.log('[CSV] About to parse CSV text, length:', text.length);
          const {
            headers,
            rows
          } = this.parseCSV(text);
          console.log('[CSV] parseCSV completed, headers:', headers, 'rows count:', rows.length);

          // Validate required fields
          const missingHeaders = this.requiredFields.filter(field => !headers.includes(field));
          if (missingHeaders.length > 0) {
            throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
          }

          // Convert rows to user objects and store them
          this.lastParsedUsers = rows.map(row => {
            const user = {};
            headers.forEach((header, index) => {
              user[header] = row[header] || '';
            });
            return user;
          });

          // Also store in parsedUsers for compatibility with getParsedUsers
          this.parsedUsers = this.lastParsedUsers;

          // Update validation results for getTotalUsers() method
          this.validationResults = {
            total: this.lastParsedUsers.length,
            valid: this.lastParsedUsers.length,
            errors: 0,
            warnings: 0
          };

          // Add debug logging
          console.log('[CSV] File parsed successfully (processCSV):', {
            totalUsers: this.validationResults.total,
            validUsers: this.validationResults.valid,
            errors: this.validationResults.errors,
            warnings: this.validationResults.warnings
          });
          resolve({
            success: true,
            headers,
            rows: this.lastParsedUsers,
            userCount: this.lastParsedUsers.length
          });
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };
      reader.readAsText(file);
    });
  }

  // ======================
  // CSV Parsing Methods
  // ======================

  /**
   * Parse CSV content into headers and data rows
   * 
   * Splits CSV content into lines, extracts headers, and validates
   * required and recommended columns. Handles header mapping for
   * different naming conventions.
   * 
   * @param {string} content - Raw CSV content as string
   * @returns {Object} Object containing headers and parsed rows
   */
  parseCSV(content) {
    // Split content into lines and filter out empty lines
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header row and one data row');
    }

    // Parse headers from first line
    const headers = this.parseCSVLine(lines[0]);

    // Define required and recommended headers for validation
    const requiredHeaders = ['username'];
    const recommendedHeaders = ['firstName', 'lastName', 'email'];

    // Log all headers for debugging
    console.log('[CSV] All headers:', headers);
    console.log('[CSV] Required headers:', requiredHeaders);
    console.log('[CSV] Recommended headers:', recommendedHeaders);

    // Validate headers
    const missingRequired = requiredHeaders.filter(h => {
      const hasHeader = headers.some(header => {
        const headerLower = header.toLowerCase();
        const mappedHeader = this.getHeaderMapping(headerLower);
        const matches = headerLower === h.toLowerCase() || mappedHeader === h;
        console.log(`[CSV] Checking header "${header}" (${headerLower}) -> "${mappedHeader}" for required "${h}": ${matches}`);
        return matches;
      });
      console.log(`[CSV] Required header "${h}" found: ${hasHeader}`);
      return !hasHeader;
    });
    const missingRecommended = recommendedHeaders.filter(h => {
      const hasHeader = headers.some(header => {
        const headerLower = header.toLowerCase();
        const mappedHeader = this.getHeaderMapping(headerLower);
        const matches = headerLower === h.toLowerCase() || mappedHeader === h;
        console.log(`[CSV] Checking header "${header}" (${headerLower}) -> "${mappedHeader}" for recommended "${h}": ${matches}`);
        return matches;
      });
      console.log(`[CSV] Recommended header "${h}" found: ${hasHeader}`);
      return !hasHeader;
    });
    if (missingRequired.length > 0) {
      const errorMsg = `Missing required headers: ${missingRequired.join(', ')}. At minimum, you need a 'username' column.`;
      this.logger.error('CSV validation failed - missing required headers', {
        missingRequired,
        availableHeaders: headers,
        errorMsg
      });
      throw new Error(errorMsg);
    }
    if (missingRecommended.length > 0) {
      const warningMsg = `Missing recommended headers: ${missingRecommended.join(', ')}. These are not required but recommended for better user data.`;
      this.logger.warn('CSV validation warning - missing recommended headers', {
        missingRecommended,
        availableHeaders: headers,
        warningMsg
      });
      // Show warning but don't throw error
      if (window.app && window.app.uiManager) {
        window.app.uiManager.showNotification(warningMsg, 'warning');
      }
    }
    const users = [];
    const errors = [];
    const warnings = [];
    let rowNumber = 1; // Start from 1 since 0 is header

    for (let i = 1; i < lines.length; i++) {
      rowNumber = i + 1; // +1 because we start from header row
      const line = lines[i].trim();
      if (!line) continue; // Skip empty lines

      try {
        const user = this.parseUserRow(line, headers, rowNumber);

        // Validate user data
        const validationResult = this.validateUserData(user, rowNumber);
        if (validationResult.isValid) {
          users.push(user);
        } else {
          errors.push({
            row: rowNumber,
            user: user,
            errors: validationResult.errors,
            warnings: validationResult.warnings
          });

          // Add warnings to warnings array
          warnings.push(...validationResult.warnings.map(w => ({
            row: rowNumber,
            ...w
          })));
        }
      } catch (error) {
        errors.push({
          row: rowNumber,
          error: error.message,
          line: line
        });
      }
    }

    // Log comprehensive validation results
    const validationSummary = {
      totalRows: lines.length - 1,
      validUsers: users.length,
      invalidRows: errors.length,
      warnings: warnings.length,
      missingRequiredHeaders: missingRequired,
      missingRecommendedHeaders: missingRecommended,
      availableHeaders: headers
    };
    this.logger.info('CSV parsing completed', validationSummary);
    if (errors.length > 0) {
      const errorDetails = errors.map(e => ({
        row: e.row,
        errors: e.errors || [e.error],
        warnings: e.warnings || []
      }));
      this.logger.warn('CSV validation issues found', {
        totalErrors: errors.length,
        errorDetails: errorDetails.slice(0, 10) // Log first 10 errors
      });
    }

    // Show user-friendly summary
    this.showValidationSummary(validationSummary, errors, warnings);
    return {
      users,
      errors,
      warnings,
      totalRows: lines.length - 1,
      validUsers: users.length,
      invalidRows: errors.length,
      headerCount: headers.length,
      availableHeaders: headers
    };
  }

  /**
   * Parse a single CSV line
   * @param {string} line - CSV line to parse
   * @param {string} delimiter - Delimiter character
   * @returns {Array<string>} Array of field values
   */
  parseCSVLine(line, delimiter = ',') {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      if (char === '"') {
        if (nextChar === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result.map(field => field.trim());
  }

  /**
   * Parse a user row from CSV
   * @param {string} line - CSV line to parse
   * @param {Array<string>} headers - Header row
   * @param {number} rowNumber - Row number for error reporting
   * @returns {Object} Parsed user object
   */
  parseUserRow(line, headers, rowNumber) {
    const values = this.parseCSVLine(line);
    if (values.length !== headers.length) {
      throw new Error(`Row ${rowNumber}: Number of columns (${values.length}) doesn't match headers (${headers.length})`);
    }
    const user = {};
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i].toLowerCase().trim();
      let value = values[i].trim();

      // Handle boolean values
      if (header === 'enabled') {
        const valueLower = value.toLowerCase();
        if (valueLower === 'true' || value === '1') {
          value = true;
        } else if (valueLower === 'false' || value === '0') {
          value = false;
        } else if (value === '') {
          value = true; // Default to enabled
        } else {
          throw new Error(`Row ${rowNumber}: Invalid enabled value '${value}'. Must be true/false or 1/0`);
        }
      }

      // Map common header variations
      const mappedHeader = this.getHeaderMapping(header);
      console.log(`[CSV] Mapping header: "${header}" -> "${mappedHeader}"`);
      user[mappedHeader] = value;
    }

    // Set default username if not provided
    if (!user.username && user.email) {
      user.username = user.email;
    }
    return user;
  }

  /**
   * Validate user data for a specific row
   * @param {Object} user - User object to validate
   * @param {number} rowNumber - Row number for error reporting
   * @returns {Object} Validation result with isValid, errors, and warnings
   */
  validateUserData(user, rowNumber) {
    const errors = [];
    const warnings = [];

    // Check required fields
    if (!user.username || user.username.trim() === '') {
      errors.push('Username is required and cannot be empty');
    }

    // Check recommended fields
    if (!user.firstName || user.firstName.trim() === '') {
      warnings.push('firstName is recommended for better user data');
    }
    if (!user.lastName || user.lastName.trim() === '') {
      warnings.push('lastName is recommended for better user data');
    }
    if (!user.email || user.email.trim() === '') {
      warnings.push('email is recommended for better user data');
    }

    // Validate email format if provided
    if (user.email && user.email.trim() !== '' && !this.isValidEmail(user.email)) {
      errors.push('Invalid email format');
    }

    // Validate username format if provided
    if (user.username && !this.isValidUsername(user.username)) {
      errors.push('Username contains invalid characters (no spaces or special characters allowed)');
    }
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Show validation summary to user
   * @param {Object} summary - Validation summary
   * @param {Array} errors - Array of errors
   * @param {Array} warnings - Array of warnings
   */
  showValidationSummary(summary, errors, warnings) {
    let message = '';
    let type = 'success';
    if (summary.invalidRows > 0) {
      type = 'error';
      message = `File validation failed!\n\n`;
      message += `• Total rows: ${summary.totalRows}\n`;
      message += `• Valid users: ${summary.validUsers}\n`;
      message += `• Invalid rows: ${summary.invalidRows}\n`;
      message += `• Warnings: ${warnings.length}\n\n`;
      if (summary.missingRequiredHeaders.length > 0) {
        message += `❌ Missing required headers: ${summary.missingRequiredHeaders.join(', ')}\n`;
      }
      if (errors.length > 0) {
        message += `❌ Data errors found in ${errors.length} row(s)\n`;
        // Show first few specific errors
        const firstErrors = errors.slice(0, 3);
        firstErrors.forEach(error => {
          if (error.errors) {
            message += `  Row ${error.row}: ${error.errors.join(', ')}\n`;
          } else if (error.error) {
            message += `  Row ${error.row}: ${error.error}\n`;
          }
        });
        if (errors.length > 3) {
          message += `  ... and ${errors.length - 3} more errors\n`;
        }
      }
    } else if (warnings.length > 0) {
      type = 'warning';
      message = `File loaded with warnings:\n\n`;
      message += `• Total rows: ${summary.totalRows}\n`;
      message += `• Valid users: ${summary.validUsers}\n`;
      message += `• Warnings: ${warnings.length}\n\n`;
      if (summary.missingRecommendedHeaders.length > 0) {
        message += `⚠️ Missing recommended headers: ${summary.missingRecommendedHeaders.join(', ')}\n`;
      }

      // Show first few warnings
      const firstWarnings = warnings.slice(0, 3);
      firstWarnings.forEach(warning => {
        message += `  Row ${warning.row}: ${warning.message || warning}\n`;
      });
      if (warnings.length > 3) {
        message += `  ... and ${warnings.length - 3} more warnings\n`;
      }
    } else {
      message = `File loaded successfully!\n\n`;
      message += `• Total rows: ${summary.totalRows}\n`;
      message += `• Valid users: ${summary.validUsers}\n`;
      message += `• Headers found: ${summary.availableHeaders.join(', ')}`;
    }

    // Show notification to user
    if (window.app && window.app.uiManager) {
      window.app.uiManager.showNotification(message, type);
    }

    // Log to server
    this.logger.info('CSV validation summary shown to user', {
      summary,
      message,
      type
    });
  }

  /**
   * Get header mapping for common variations
   * @param {string} header - Header to map
   * @returns {string} Mapped header name
   */
  getHeaderMapping(header) {
    const headerMap = {
      'firstname': 'firstName',
      'first_name': 'firstName',
      'givenname': 'firstName',
      'given_name': 'firstName',
      'lastname': 'lastName',
      'last_name': 'lastName',
      'familyname': 'lastName',
      'family_name': 'lastName',
      'surname': 'lastName',
      'emailaddress': 'email',
      'email_address': 'email',
      'userid': 'username',
      'user_id': 'username',
      'login': 'username',
      'user': 'username',
      'populationid': 'populationId',
      'population_id': 'populationId',
      'popid': 'populationId',
      'pop_id': 'populationId'
    };
    return headerMap[header] || header;
  }

  /**
   * Check if email is valid
   * @param {string} email - Email to validate
   * @returns {boolean} True if valid
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Check if username is valid
   * @param {string} username - Username to validate
   * @returns {boolean} True if valid
   */
  isValidUsername(username) {
    // Username should not contain spaces or special characters
    const usernameRegex = /^[a-zA-Z0-9._-]+$/;
    return usernameRegex.test(username);
  }

  // ======================
  // UI Updates
  // ======================

  /**
   * Update file info for any file info container element
   * @param {File} file - The file object
   * @param {string} containerId - The ID of the container element to update
   */
  updateFileInfoForElement(file, containerId) {
    const container = document.getElementById(containerId);
    console.log('updateFileInfoForElement called:', {
      containerId,
      container: !!container,
      file: !!file
    });
    if (!container || !file) {
      console.warn('updateFileInfoForElement: container or file is null', {
        containerId,
        hasContainer: !!container,
        hasFile: !!file
      });
      return;
    }
    const fileSize = this.formatFileSize(file.size);
    const lastModified = new Date(file.lastModified).toLocaleString();
    const fileType = file.type || this.getFileExtension(file.name);
    const fileExtension = this.getFileExtension(file.name);

    // Get file path information (if available)
    let filePath = 'Unknown';
    if (file.webkitRelativePath) {
      filePath = file.webkitRelativePath;
    } else if (file.name) {
      // Try to extract directory from file name if it contains path separators
      const pathParts = file.name.split(/[\/\\]/);
      if (pathParts.length > 1) {
        filePath = pathParts.slice(0, -1).join('/');
      } else {
        filePath = 'Current Directory';
      }
    }

    // Calculate additional file properties
    const isCSV = fileExtension === 'csv';
    const isText = fileExtension === 'txt';
    const isValidType = isCSV || isText || fileType === 'text/csv' || fileType === 'text/plain';
    const fileSizeInKB = Math.round(file.size / 1024);
    const fileSizeInMB = Math.round(file.size / 1024 / 1024 * 100) / 100;

    // Create comprehensive file info display
    const fileInfoHTML = `
            <div class="file-info-details" style="background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 5px; padding: 15px; margin: 10px 0;">
                <div class="file-info-header" style="margin-bottom: 10px;">
                    <h5 style="margin: 0; color: #495057;">
                        <i class="fas fa-file-csv"></i> File Information
                    </h5>
                </div>
                
                <div class="file-info-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.9em;">
                    <div class="file-info-item">
                        <strong style="color: #495057;">📁 Filename:</strong><br>
                        <span style="color: #6c757d; word-break: break-all;">${file.name}</span>
                    </div>
                    
                    <div class="file-info-item">
                        <strong style="color: #495057;">📊 File Size:</strong><br>
                        <span style="color: #6c757d;">${fileSize} (${fileSizeInKB} KB, ${fileSizeInMB} MB)</span>
                    </div>
                    
                    <div class="file-info-item">
                        <strong style="color: #495057;">📂 Directory:</strong><br>
                        <span style="color: #6c757d;">${filePath}</span>
                    </div>
                    
                    <div class="file-info-item">
                        <strong style="color: #495057;">📅 Last Modified:</strong><br>
                        <span style="color: #6c757d;">${lastModified}</span>
                    </div>
                    
                    <div class="file-info-item">
                        <strong style="color: #495057;">🔤 File Type:</strong><br>
                        <span style="color: #6c757d;">${fileType || 'Unknown'}</span>
                    </div>
                    
                    <div class="file-info-item">
                        <strong style="color: #495057;">📄 Extension:</strong><br>
                        <span style="color: ${isValidType ? '#28a745' : '#dc3545'}; font-weight: bold;">
                            ${fileExtension ? '.' + fileExtension : 'None'}
                        </span>
                    </div>
                </div>
                
                <div class="file-info-status" style="margin-top: 10px; padding: 8px; border-radius: 3px; background: ${isValidType ? '#d4edda' : '#f8d7da'}; border: 1px solid ${isValidType ? '#c3e6cb' : '#f5c6cb'};">
                    <i class="fas ${isValidType ? 'fa-check-circle' : 'fa-exclamation-triangle'}" style="color: ${isValidType ? '#155724' : '#721c24'};"></i>
                    <span style="color: ${isValidType ? '#155724' : '#721c24'}; font-weight: bold;">
                        ${isValidType ? 'File type is supported' : 'Warning: File type may not be optimal'}
                    </span>
                </div>
                
                ${file.size > 5 * 1024 * 1024 ? `
                <div class="file-info-warning" style="margin-top: 10px; padding: 8px; border-radius: 3px; background: #fff3cd; border: 1px solid #ffeaa7;">
                    <i class="fas fa-exclamation-triangle" style="color: #856404;"></i>
                    <span style="color: #856404; font-weight: bold;">Large file detected - processing may take longer</span>
                </div>
                ` : ''}
            </div>
        `;
    container.innerHTML = fileInfoHTML;
  }
  updateFileInfo(file) {
    this.updateFileInfoForElement(file, 'file-info');
  }
  showPreview(rows) {
    if (!this.previewContainer) return;
    if (!rows || rows.length === 0) {
      this.previewContainer.innerHTML = '<div class="alert alert-info">No data to display</div>';
      // Disable import button if no rows
      const importBtnBottom = _elementRegistry.ElementRegistry.startImportBtnBottom ? _elementRegistry.ElementRegistry.startImportBtnBottom() : null;
      if (importBtnBottom) {
        importBtnBottom.disabled = true;
      }
      return;
    }
    const headers = Object.keys(rows[0]);
    const previewRows = rows.slice(0, 5); // Show first 5 rows

    let html = `
            <div class="table-responsive">
                <table class="table table-sm table-striped">
                    <thead>
                        <tr>
                            ${headers.map(h => `<th>${h}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${previewRows.map(row => `
                            <tr>
                                ${headers.map(h => `<td>${row[h] || ''}</td>`).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                ${rows.length > 5 ? `<small class="text-muted">Showing 5 of ${rows.length} rows</small>` : ''}
            </div>
        `;
    this.previewContainer.innerHTML = html;

    // Check if population choice has been made
    const hasPopulationChoice = this.checkPopulationChoice();

    // Enable import button after showing preview (only if population choice is made)
    const importBtnBottom = _elementRegistry.ElementRegistry.startImportBtnBottom ? _elementRegistry.ElementRegistry.startImportBtnBottom() : null;
    if (importBtnBottom) {
      importBtnBottom.disabled = !hasPopulationChoice;
      this.logger.log(`Import button ${hasPopulationChoice ? 'enabled' : 'disabled'}`, 'debug');
    } else {
      this.logger.warn('Could not find import button to enable', 'warn');
    }
  }

  /**
   * Check if user has made a population choice
   * @returns {boolean} True if a population choice has been made
   */
  checkPopulationChoice() {
    const selectedPopulationId = _elementRegistry.ElementRegistry.importPopulationSelect ? _elementRegistry.ElementRegistry.importPopulationSelect().value || '' : '';
    const useDefaultPopulation = _elementRegistry.ElementRegistry.useDefaultPopulationCheckbox ? _elementRegistry.ElementRegistry.useDefaultPopulationCheckbox().checked || false : false;
    const useCsvPopulationId = _elementRegistry.ElementRegistry.useCsvPopulationIdCheckbox ? _elementRegistry.ElementRegistry.useCsvPopulationIdCheckbox().checked || false : false;
    const hasSelectedPopulation = selectedPopulationId && selectedPopulationId.trim() !== '';
    return hasSelectedPopulation || useDefaultPopulation || useCsvPopulationId;
  }

  // ======================
  // Utility Methods
  // ======================

  getFileExtension(filename) {
    if (!filename || typeof filename !== 'string') return '';

    // Handle cases where filename might be a path
    const lastDot = filename.lastIndexOf('.');
    const lastSlash = Math.max(filename.lastIndexOf('/'), filename.lastIndexOf('\\'));

    // If there's no dot, or the dot is before the last slash, return empty string
    if (lastDot === -1 || lastSlash > lastDot) return '';

    // Extract and return the extension (without the dot)
    return filename.slice(lastDot + 1).toLowerCase().trim();
  }
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  generateTemporaryPassword() {
    const length = 16;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]\\:;?><,./-';
    let password = '';

    // Ensure at least one of each character type
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    password += '0123456789'[Math.floor(Math.random() * 10)];
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)];

    // Fill the rest of the password
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }

    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * Get parsed users for import
   * @returns {Array<Object>} Array of validated user objects
   */
  getParsedUsers() {
    this.logger.info('getParsedUsers called', {
      hasParsedUsers: !!this.parsedUsers,
      parsedUsersType: typeof this.parsedUsers,
      parsedUsersLength: this.parsedUsers ? this.parsedUsers.length : 0,
      hasLastParsedUsers: !!this.lastParsedUsers,
      lastParsedUsersType: typeof this.lastParsedUsers,
      lastParsedUsersLength: this.lastParsedUsers ? this.lastParsedUsers.length : 0
    });
    if (!this.parsedUsers || !Array.isArray(this.parsedUsers)) {
      this.logger.warn('No parsed users available');
      return [];
    }
    this.logger.info('Retrieving parsed users for import', {
      userCount: this.parsedUsers.length,
      hasUsers: this.parsedUsers.length > 0
    });
    return this.parsedUsers;
  }

  /**
   * Get parsing results for debugging
   * @returns {Object|null} Parsing results or null if not available
   */
  getParseResults() {
    return this.parseResults || null;
  }

  /**
   * Initialize drag-and-drop support for a drop zone element
   * @param {HTMLElement} dropZone - The drop zone element
   */
  initializeDropZone(dropZone) {
    if (!dropZone) return;

    // Remove any previous listeners
    dropZone.removeEventListener('dragenter', this._onDragEnter);
    dropZone.removeEventListener('dragover', this._onDragOver);
    dropZone.removeEventListener('dragleave', this._onDragLeave);
    dropZone.removeEventListener('drop', this._onDrop);

    // Bind event handlers to this instance
    this._onDragEnter = e => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add('drag-over');
    };
    this._onDragOver = e => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add('drag-over');
    };
    this._onDragLeave = e => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('drag-over');
    };
    this._onDrop = async e => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('drag-over');
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        try {
          await this.setFile(files[0]);
        } catch (error) {
          this.logger.error('Drag-and-drop file error', {
            error: error.message
          });
          this.uiManager.showNotification('Failed to process dropped file: ' + error.message, 'error');
        }
      }
    };

    // Attach listeners
    dropZone.addEventListener('dragenter', this._onDragEnter);
    dropZone.addEventListener('dragover', this._onDragOver);
    dropZone.addEventListener('dragleave', this._onDragLeave);
    dropZone.addEventListener('drop', this._onDrop);
  }

  /**
   * Initialize global drag-and-drop prevention and routing
   * This prevents the browser from trying to open files and routes them to the app
   */
  initializeGlobalDragAndDrop() {
    // Prevent browser default behavior for file drops anywhere on the page
    const preventDefaultDragEvents = e => {
      e.preventDefault();
      e.stopPropagation();
    };

    // Handle file drops anywhere on the document
    const handleGlobalDrop = async e => {
      e.preventDefault();
      e.stopPropagation();

      // Remove body drag-over class
      document.body.classList.remove('drag-over');
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        const file = files[0];

        // Check if it's a supported file type
        const fileName = file.name || '';
        const fileExt = this.getFileExtension(fileName).toLowerCase();
        const supportedExts = ['csv', 'txt'];
        const knownBadExts = ['exe', 'js', 'png', 'jpg', 'jpeg', 'gif', 'pdf', 'zip', 'tar', 'gz'];
        if (fileExt && knownBadExts.includes(fileExt)) {
          this.uiManager.showNotification(`Unsupported file type: ${fileExt}. Please upload a CSV or text file.`, 'error');
          return;
        }

        // Route to appropriate handler based on current view
        const currentView = this.getCurrentView();
        let targetDropZone = null;
        switch (currentView) {
          case 'import':
            targetDropZone = document.getElementById('import-drop-zone');
            break;
          case 'modify':
            targetDropZone = document.getElementById('modify-drop-zone');
            break;
          case 'import-dashboard':
            targetDropZone = document.getElementById('upload-zone');
            break;
          default:
            // Default to import view if no specific view is active
            targetDropZone = document.getElementById('import-drop-zone');
            break;
        }

        // Show visual feedback on the target drop zone
        if (targetDropZone) {
          targetDropZone.classList.add('drag-over');
          setTimeout(() => {
            targetDropZone.classList.remove('drag-over');
          }, 2000);
        }
        try {
          await this.setFile(file);
          this.uiManager.showNotification(`File "${file.name}" processed successfully`, 'success');
        } catch (error) {
          this.logger.error('Global drag-and-drop file error', {
            error: error.message
          });
          this.uiManager.showNotification('Failed to process dropped file: ' + error.message, 'error');
        }
      }
    };

    // Add visual feedback when dragging files over the document
    const handleGlobalDragEnter = e => {
      e.preventDefault();
      e.stopPropagation();

      // Only add visual feedback if dragging files
      if (e.dataTransfer.types.includes('Files')) {
        document.body.classList.add('drag-over');
      }
    };
    const handleGlobalDragLeave = e => {
      e.preventDefault();
      e.stopPropagation();

      // Only remove visual feedback if leaving the document entirely
      if (e.target === document || e.target === document.body) {
        document.body.classList.remove('drag-over');
      }
    };

    // Add global event listeners
    document.addEventListener('dragover', preventDefaultDragEvents);
    document.addEventListener('dragenter', handleGlobalDragEnter);
    document.addEventListener('dragleave', handleGlobalDragLeave);
    document.addEventListener('drop', handleGlobalDrop);

    // Store references for cleanup
    this._globalDragHandlers = {
      preventDefaultDragEvents,
      handleGlobalDragEnter,
      handleGlobalDragLeave,
      handleGlobalDrop
    };
    this.logger.info('Global drag-and-drop prevention initialized');
  }

  /**
   * Clean up global drag-and-drop event listeners
   */
  cleanupGlobalDragAndDrop() {
    if (this._globalDragHandlers) {
      document.removeEventListener('dragover', this._globalDragHandlers.preventDefaultDragEvents);
      document.removeEventListener('dragenter', this._globalDragHandlers.handleGlobalDragEnter);
      document.removeEventListener('dragleave', this._globalDragHandlers.handleGlobalDragLeave);
      document.removeEventListener('drop', this._globalDragHandlers.handleGlobalDrop);
      this._globalDragHandlers = null;
    }

    // Remove any remaining visual feedback
    document.body.classList.remove('drag-over');
  }

  /**
   * Get the current active view
   * @returns {string} The current view name
   */
  getCurrentView() {
    const activeView = document.querySelector('.view[style*="block"]') || document.querySelector('.view:not([style*="none"])');
    if (!activeView) return 'import';
    const viewId = activeView.id;
    if (viewId === 'import-dashboard-view') return 'import-dashboard';
    if (viewId === 'modify-csv-view') return 'modify';
    if (viewId === 'delete-csv-view') return 'delete';
    if (viewId === 'export-view') return 'export';
    if (viewId === 'settings-view') return 'settings';
    if (viewId === 'logs-view') return 'logs';
    return 'import'; // Default to import view
  }
}
exports.FileHandler = FileHandler;

},{"./element-registry.js":7}],9:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FileLogger = void 0;
/**
 * FileLogger - Handles writing logs to a client.log file using the File System Access API
 */
class FileLogger {
  /**
   * Create a new FileLogger instance
   * @param {string} filename - Name of the log file (default: 'client.log')
   */
  constructor(filename = 'client.log') {
    this.filename = filename;
    this.fileHandle = null;
    this.writableStream = null;
    this.initialized = false;
    this.logQueue = [];
    this.initializationPromise = null;
  }

  /**
   * Initialize the file logger
   * @private
   */
  async _initialize() {
    if (this.initialized) return true;
    if (this.initializationPromise) {
      return this.initializationPromise;
    }
    this.initializationPromise = (async () => {
      try {
        // Check if we're in a secure context and the API is available
        if (!window.isSecureContext || !window.showSaveFilePicker) {
          throw new Error('File System Access API not available in this context');
        }

        // Only proceed if we're handling a user gesture
        if (!window.__fileLoggerUserGesture) {
          // Set up event listeners
          window.addEventListener('online', () => this.handleOnline());
          window.addEventListener('offline', () => this.handleOffline());

          // Set up user gesture detection for file logger
          const handleUserGesture = () => {
            window.__fileLoggerUserGesture = true;
            window.removeEventListener('click', handleUserGesture);
            window.removeEventListener('keydown', handleUserGesture);

            // Try to initialize the file logger if it hasn't been initialized yet
            if (this.fileLogger && !this.fileLogger._initialized && this.fileLogger._logger === null) {
              this.fileLogger._ensureInitialized().catch(console.warn);
            }
          };
          window.addEventListener('click', handleUserGesture, {
            once: true,
            passive: true
          });
          window.addEventListener('keydown', handleUserGesture, {
            once: true,
            passive: true
          });
          throw new Error('Waiting for user gesture to initialize file logger');
        }
        try {
          this.fileHandle = await window.showSaveFilePicker({
            suggestedName: this.filename,
            types: [{
              description: 'Log File',
              accept: {
                'text/plain': ['.log']
              }
            }],
            excludeAcceptAllOption: true
          });
          this.writableStream = await this.fileHandle.createWritable({
            keepExistingData: true
          });
          this.initialized = true;
          await this._processQueue();
          return true;
        } catch (error) {
          console.warn('File System Access API not available:', error);
          this.initialized = false;
          return false;
        }
      } catch (error) {
        console.warn('File logger initialization deferred:', error.message);
        this.initialized = false;
        return false;
      }
    })();
    return this.initializationPromise;
  }

  /**
   * Process any queued log messages
   * @private
   */
  async _processQueue() {
    if (this.logQueue.length === 0) return;
    const queue = [...this.logQueue];
    this.logQueue = [];
    for (const {
      level,
      message,
      timestamp
    } of queue) {
      await this._writeLog(level, message, timestamp);
    }
  }

  /**
   * Write a log message to the file
   * @private
   */
  async _writeLog(level, message, timestamp) {
    if (!this.initialized) {
      await this._initialize();
    }
    const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
    if (this.writableStream) {
      try {
        await this.writableStream.write(logEntry);
      } catch (error) {
        console.error('Error writing to log file:', error);
        this.initialized = false;
        await this._initialize();
        await this.writableStream.write(logEntry);
      }
    } else {
      console[level](`[FileLogger] ${logEntry}`);
    }
  }

  /**
   * Log a message
   * @param {string} level - Log level (info, warn, error, debug)
   * @param {string} message - The message to log
   */
  async log(level, message) {
    const timestamp = new Date().toISOString();
    if (!this.initialized) {
      this.logQueue.push({
        level,
        message,
        timestamp
      });
      await this._initialize();
    } else {
      await this._writeLog(level, message, timestamp);
    }
  }

  /**
   * Log an info message
   * @param {string} message - The message to log
   */
  info(message) {
    return this.log('info', message);
  }

  /**
   * Log a warning message
   * @param {string} message - The message to log
   */
  warn(message) {
    return this.log('warn', message);
  }

  /**
   * Log an error message
   * @param {string} message - The message to log
   */
  error(message) {
    return this.log('error', message);
  }

  /**
   * Log a debug message
   * @param {string} message - The message to log
   */
  debug(message) {
    return this.log('debug', message);
  }

  /**
   * Close the log file
   */
  async close() {
    if (this.writableStream) {
      try {
        await this.writableStream.close();
      } catch (error) {
        console.error('Error closing log file:', error);
      } finally {
        this.initialized = false;
        this.writableStream = null;
        this.fileHandle = null;
      }
    }
  }
}
exports.FileLogger = FileLogger;

},{}],10:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.localAPIClient = exports.LocalAPIClient = void 0;
/**
 * Local API Client
 * Handles all API calls to the local server (localhost:4000)
 */

class LocalAPIClient {
  /**
   * Create a new LocalAPIClient instance
   * @param {Object} logger - Logger instance
   * @param {string} [baseUrl=''] - Base URL for the API (defaults to relative path)
   */
  constructor(logger, baseUrl = '') {
    this.logger = logger || console;
    this.baseUrl = baseUrl;
  }

  /**
   * Make an API request to the local server
   * @param {string} method - HTTP method (GET, POST, PUT, DELETE, etc.)
   * @param {string} endpoint - API endpoint (without base URL)
   * @param {Object} [data] - Request body (for POST/PUT/PATCH)
   * @param {Object} [options] - Additional options
   * @returns {Promise<Object>} Response data
   */
  async request(method, endpoint, data = null, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const startTime = Date.now();

    // Enhanced options with retry logic
    const requestOptions = {
      ...options,
      retries: options.retries || 3,
      retryDelay: options.retryDelay || 1000 // 1 second base delay
    };

    // Prepare headers
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    // Add authorization if available
    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    // Prepare request body
    let body = null;
    if (data && method !== 'GET') {
      body = JSON.stringify(data);
    }

    // Log the request with minimal details to avoid rate limiting
    const requestLog = {
      type: 'api_request',
      method,
      url,
      timestamp: new Date().toISOString(),
      source: 'local-api-client'
    };
    this.logger.debug('🔄 Local API Request:', requestLog);

    // Retry logic
    let lastError = null;
    for (let attempt = 1; attempt <= requestOptions.retries; attempt++) {
      try {
        const response = await fetch(url, {
          method,
          headers,
          body
        });
        const responseData = await this._handleResponse(response);

        // Log successful response with minimal details
        const responseLog = {
          type: 'api_response',
          status: response.status,
          method,
          duration: Date.now() - startTime,
          attempt: attempt,
          source: 'local-api-client'
        };
        this.logger.debug('✅ Local API Response:', responseLog);
        return responseData;
      } catch (error) {
        lastError = error;
        this.logger.error(`Local API Error (attempt ${attempt}/${requestOptions.retries}):`, error);

        // Get the friendly error message if available
        const friendlyMessage = error.friendlyMessage || error.message;
        const isRateLimit = error.status === 429;

        // Calculate baseDelay and delay here, before using them
        const baseDelay = isRateLimit ? requestOptions.retryDelay * 2 : requestOptions.retryDelay;
        const delay = baseDelay * Math.pow(2, attempt - 1);

        // Show appropriate UI messages based on error type
        if (window.app && window.app.uiManager) {
          if (isRateLimit) {
            if (attempt < requestOptions.retries) {
              // Use enhanced rate limit warning with retry information
              window.app.uiManager.showRateLimitWarning(friendlyMessage, {
                isRetrying: true,
                retryAttempt: attempt,
                maxRetries: requestOptions.retries,
                retryDelay: delay
              });
            } else {
              window.app.uiManager.showError(friendlyMessage);
            }
          } else if (attempt === requestOptions.retries) {
            // For other errors, show friendly message on final attempt
            window.app.uiManager.showError(friendlyMessage);
          }
        }

        // If this is the last attempt, throw with friendly message
        if (attempt === requestOptions.retries) {
          throw error;
        }

        // Only retry for rate limits (429) and server errors (5xx)
        const shouldRetry = isRateLimit || error.status >= 500 || !error.status;
        if (!shouldRetry) {
          // Don't retry for client errors (4xx except 429), throw immediately
          throw error;
        }

        // Use the delay calculated above
        this.logger.info(`Retrying request in ${delay}ms... (attempt ${attempt + 1}/${requestOptions.retries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // If all retries fail, throw the last error
    throw lastError;
  }

  /**
   * Handle API response
   * @private
   */
  async _handleResponse(response) {
    const contentType = response.headers.get('content-type');
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    if (!response.ok) {
      let errorMessage;

      // Provide user-friendly error messages based on status code
      switch (response.status) {
        case 400:
          errorMessage = this._getBadRequestMessage(data, response.url);
          break;
        case 401:
          errorMessage = this._getUnauthorizedMessage();
          break;
        case 403:
          errorMessage = this._getForbiddenMessage(data, response.url);
          break;
        case 404:
          errorMessage = this._getNotFoundMessage(data, response.url);
          break;
        case 429:
          errorMessage = this._getRateLimitMessage();
          break;
        case 500:
        case 501:
        case 502:
        case 503:
        case 504:
          errorMessage = this._getServerErrorMessage(response.status);
          break;
        default:
          errorMessage = data.message || `Request failed with status ${response.status}`;
      }
      const error = new Error(errorMessage);
      error.status = response.status;
      error.details = data;
      error.friendlyMessage = errorMessage;
      throw error;
    }
    return data;
  }

  /**
   * Get user-friendly error message for 400 Bad Request errors
   * @private
   */
  _getBadRequestMessage(data, url) {
    // Check if it's an import endpoint error
    if (url.includes('/import')) {
      if (data && data.error) {
        // Return the specific error message from the server
        return data.error;
      }
      if (data && data.message) {
        return data.message;
      }
      return '🔍 Import failed. Please check your CSV file and settings.';
    }

    // Check if it's a user modification endpoint
    if (url.includes('/users/') && url.includes('PUT')) {
      return '🔍 User data validation failed. Please check the user information and try again.';
    }

    // Check if it's a user creation endpoint
    if (url.includes('/users') && url.includes('POST')) {
      return '🔍 User creation failed due to invalid data. Please check required fields and try again.';
    }

    // Check if it's a population-related error
    if (url.includes('/populations')) {
      return '🔍 Population data is invalid. Please check your population settings.';
    }

    // Generic 400 error
    return '🔍 Request data is invalid. Please check your input and try again.';
  }

  /**
   * Get user-friendly error message for 401 Unauthorized errors
   * @private
   */
  _getUnauthorizedMessage() {
    return '🔑 Authentication failed. Please check your PingOne credentials and try again.';
  }

  /**
   * Get user-friendly error message for 403 Forbidden errors
   * @private
   */
  _getForbiddenMessage(data, url) {
    // Check if it's a user modification endpoint
    if (url.includes('/users/') && url.includes('PUT')) {
      return '🚫 Permission denied. Your PingOne application may not have permission to modify users.';
    }

    // Check if it's a user creation endpoint
    if (url.includes('/users') && url.includes('POST')) {
      return '🚫 Permission denied. Your PingOne application may not have permission to create users.';
    }

    // Check if it's a user deletion endpoint
    if (url.includes('/users/') && url.includes('DELETE')) {
      return '🚫 Permission denied. Your PingOne application may not have permission to delete users.';
    }

    // Generic 403 error
    return '🚫 Access denied. Your PingOne application may not have the required permissions for this operation.';
  }

  /**
   * Get user-friendly error message for 404 Not Found errors
   * @private
   */
  _getNotFoundMessage(data, url) {
    // Check if it's a user-related endpoint
    if (url.includes('/users/')) {
      return '🔍 User not found. The user may have been deleted or the ID is incorrect.';
    }

    // Check if it's a population-related endpoint
    if (url.includes('/populations')) {
      return '🔍 Population not found. Please check your population settings.';
    }

    // Check if it's an environment-related endpoint
    if (url.includes('/environments/')) {
      return '🔍 PingOne environment not found. Please check your environment ID.';
    }

    // Generic 404 error
    return '🔍 Resource not found. Please check the ID or settings and try again.';
  }

  /**
   * Get user-friendly error message for 429 Too Many Requests errors
   * @private
   */
  _getRateLimitMessage() {
    return '⏰ You are sending requests too quickly. Please wait a moment and try again.';
  }

  /**
   * Get user-friendly error message for 500+ server errors
   * @private
   */
  _getServerErrorMessage(status) {
    if (status >= 500) {
      return '🔧 PingOne service is experiencing issues. Please try again in a few minutes.';
    }
    return '🔧 An unexpected error occurred. Please try again.';
  }

  // Convenience methods for common HTTP methods
  get(endpoint, options = {}) {
    return this.request('GET', endpoint, null, options);
  }
  post(endpoint, data, options = {}) {
    return this.request('POST', endpoint, data, options);
  }

  /**
   * Send a POST request with FormData (for file uploads)
   * @param {string} endpoint - API endpoint
   * @param {FormData} formData - FormData object
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Response data
   */
  async postFormData(endpoint, formData, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const startTime = Date.now();

    // Enhanced options with retry logic
    const requestOptions = {
      ...options,
      retries: options.retries || 3,
      retryDelay: options.retryDelay || 1000 // 1 second base delay
    };

    // Prepare headers for FormData (don't set Content-Type, let browser set it with boundary)
    const headers = {
      'Accept': 'application/json'
    };

    // Add authorization if available
    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    // Log the request with minimal details to avoid rate limiting
    const requestLog = {
      type: 'api_request',
      method: 'POST',
      url,
      timestamp: new Date().toISOString(),
      source: 'local-api-client',
      contentType: 'multipart/form-data'
    };
    this.logger.debug('🔄 Local API FormData Request:', requestLog);

    // Retry logic
    let lastError = null;
    for (let attempt = 1; attempt <= requestOptions.retries; attempt++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: formData
        });
        const responseData = await this._handleResponse(response);

        // Log successful response with minimal details
        const responseLog = {
          type: 'api_response',
          status: response.status,
          method: 'POST',
          duration: Date.now() - startTime,
          attempt: attempt,
          source: 'local-api-client'
        };
        this.logger.debug('✅ Local API FormData Response:', responseLog);
        return responseData;
      } catch (error) {
        lastError = error;
        this.logger.error(`Local API FormData Error (attempt ${attempt}/${requestOptions.retries}):`, error);

        // Get the friendly error message if available
        const friendlyMessage = error.friendlyMessage || error.message;
        const isRateLimit = error.status === 429;

        // Calculate baseDelay and delay here, before using them
        const baseDelay = isRateLimit ? requestOptions.retryDelay * 2 : requestOptions.retryDelay;
        const delay = baseDelay * Math.pow(2, attempt - 1);

        // Show appropriate UI messages based on error type
        if (window.app && window.app.uiManager) {
          if (isRateLimit) {
            if (attempt < requestOptions.retries) {
              // Use enhanced rate limit warning with retry information
              window.app.uiManager.showRateLimitWarning(friendlyMessage, {
                isRetrying: true,
                retryAttempt: attempt,
                maxRetries: requestOptions.retries,
                retryDelay: delay
              });
            } else {
              window.app.uiManager.showError(friendlyMessage);
            }
          } else if (attempt === requestOptions.retries) {
            // For other errors, show friendly message on final attempt
            window.app.uiManager.showError(friendlyMessage);
          }
        }

        // If this is the last attempt, throw with friendly message
        if (attempt === requestOptions.retries) {
          throw error;
        }

        // Only retry for rate limits (429) and server errors (5xx)
        const shouldRetry = isRateLimit || error.status >= 500 || !error.status;
        if (!shouldRetry) {
          // Don't retry for client errors (4xx except 429), throw immediately
          throw error;
        }

        // Use the delay calculated above
        this.logger.info(`Retrying FormData request in ${delay}ms... (attempt ${attempt + 1}/${requestOptions.retries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // If all retries fail, throw the last error
    throw lastError;
  }
  put(endpoint, data, options = {}) {
    return this.request('PUT', endpoint, data, options);
  }
  delete(endpoint, options = {}) {
    return this.request('DELETE', endpoint, null, options);
  }
}

// Export a singleton instance
exports.LocalAPIClient = LocalAPIClient;
const localAPIClient = exports.localAPIClient = new LocalAPIClient(console);

},{}],11:[function(require,module,exports){
(function (process){(function (){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Logger = void 0;
var _winstonLogger = require("./winston-logger.js");
var _uiManager = require("./ui-manager.js");
/**
 * @fileoverview Winston-compatible logger for frontend environment
 * 
 * This module provides a Winston-like logging interface for the frontend
 * that maintains consistency with server-side Winston logging while
 * working within browser constraints.
 * 
 * Features:
 * - Winston-compatible API (info, warn, error, debug)
 * - Structured logging with metadata
 * - Timestamp formatting
 * - Log level filtering
 * - Console and server transport support
 * - Error stack trace handling
 * - Environment-aware configuration
 */

const ui = window.app && window.app.uiManager;

/**
 * Winston-compatible logger for browser environment
 */
class Logger {
  constructor(logElement = null) {
    this.logElement = logElement;
    this.logs = [];
    this.validCount = 0;
    this.errorCount = 0;
    this.initialized = false;
    this.serverLoggingEnabled = true;
    this.isLoadingLogs = false;
    this.offlineLogs = [];

    // Initialize Winston-compatible logger
    this.winstonLogger = (0, _winstonLogger.createWinstonLogger)({
      service: 'pingone-import-frontend',
      environment: process.env.NODE_ENV || 'development',
      enableServerLogging: true,
      enableConsoleLogging: true
    });
    this.initialize();
  }

  /**
   * Initialize the logger
   */
  initialize() {
    try {
      this.winstonLogger.info('Logger initialized successfully');
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize logger:', error);
    }
  }

  /**
   * Temporarily disable server logging to prevent feedback loops
   */
  disableServerLogging() {
    this.serverLoggingEnabled = false;
    this.winstonLogger.setServerLogging(false);
    this.winstonLogger.debug('Server logging disabled');
  }

  /**
   * Re-enable server logging
   */
  enableServerLogging() {
    this.serverLoggingEnabled = true;
    this.winstonLogger.setServerLogging(true);
    this.winstonLogger.debug('Server logging enabled');
  }

  /**
   * Set flag to indicate we're loading logs (prevents server logging)
   */
  setLoadingLogs(isLoading) {
    this.isLoadingLogs = isLoading;
    this.winstonLogger.debug(`Loading logs flag set to: ${isLoading}`);
  }

  /**
   * Create a safe file logger that handles initialization and errors
   * @private
   */
  _createSafeFileLogger() {
    const logger = {
      _initialized: false,
      _logger: null,
      _queue: [],
      _initializing: false,
      async init() {
        if (this._initialized || this._initializing) return;
        this._initializing = true;
        try {
          // Simulate file logger initialization
          this._logger = {
            log: (level, message, data) => {
              this.winstonLogger.log(level, message, data);
            }
          };
          this._initialized = true;
          this._processQueue();
        } catch (error) {
          this.winstonLogger.error('Failed to initialize file logger', {
            error: error.message
          });
        } finally {
          this._initializing = false;
        }
      },
      _processQueue() {
        while (this._queue.length > 0) {
          const {
            level,
            message,
            data
          } = this._queue.shift();
          this._logger.log(level, message, data);
        }
      },
      log(level, message, data) {
        if (this._initialized) {
          this._logger.log(level, message, data);
        } else {
          this._queue.push({
            level,
            message,
            data
          });
          if (!this._initializing) {
            this.init();
          }
        }
      }
    };
    return logger;
  }

  /**
   * Parse log arguments into structured format
   * @private
   */
  _parseLogArgs(args) {
    let message = 'Log message';
    let data = null;
    let context = null;
    if (args.length > 0) {
      if (typeof args[0] === 'string') {
        message = args[0];
        if (args.length > 1 && typeof args[1] === 'object') {
          data = args[1];
          if (args.length > 2 && typeof args[2] === 'object') {
            context = args[2];
          }
        }
      } else if (typeof args[0] === 'object') {
        data = args[0];
        message = 'Log data';
        if (args.length > 1 && typeof args[1] === 'object') {
          context = args[1];
        }
      }
    }
    return [message, data, context];
  }

  /**
   * Main logging method with Winston integration
   */
  log(level, message, data = {}) {
    try {
      // Parse arguments if needed
      if (typeof level === 'string' && typeof message === 'string') {
        // Direct call: log(level, message, data)
        this._logToWinston(level, message, data);
      } else {
        // Legacy call: log(message, level)
        const [parsedMessage, parsedData, context] = this._parseLogArgs(arguments);
        this._logToWinston(level || 'info', parsedMessage, {
          ...parsedData,
          ...context
        });
      }

      // Update UI if log element exists
      this._updateLogUI({
        level,
        message,
        data,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error in logger.log:', error);
    }
  }

  /**
   * Log to Winston with proper formatting
   * @private
   */
  _logToWinston(level, message, data = {}) {
    const logData = {
      ...data,
      component: 'frontend-logger',
      timestamp: new Date().toISOString()
    };
    this.winstonLogger.log(level, message, logData);
  }

  /**
   * Log info level message
   */
  info(message, data = {}) {
    this.log('info', message, data);
  }

  /**
   * Log warn level message
   */
  warn(message, data = {}) {
    this.log('warn', message, data);
  }

  /**
   * Log error level message
   */
  error(message, data = {}) {
    this.log('error', message, data);
    if (ui) ui.showStatusBar(message, 'error', {
      autoDismiss: false
    });
    this.errorCount++;
    this.updateSummary();
  }

  /**
   * Log debug level message
   */
  debug(message, data = {}) {
    this.log('debug', message, data);
  }

  /**
   * Log success level message
   */
  success(message, data = {}) {
    this.log('info', message, {
      ...data,
      type: 'success'
    });
    this.validCount++;
    this.updateSummary();
  }

  /**
   * Log error with stack trace
   */
  errorWithStack(message, error, data = {}) {
    this.winstonLogger.errorWithStack(message, error, data);
    this.errorCount++;
    this.updateSummary();
  }

  /**
   * Update log UI with new entry
   * @private
   */
  _updateLogUI(logEntry) {
    if (!this.logElement) return;
    try {
      const logElement = document.createElement('div');
      logElement.className = `log-entry ${logEntry.level}`;

      // Create timestamp
      const timestamp = document.createElement('span');
      timestamp.className = 'log-timestamp';
      timestamp.textContent = new Date(logEntry.timestamp).toLocaleTimeString();
      logElement.appendChild(timestamp);

      // Create level badge
      const levelBadge = document.createElement('span');
      levelBadge.className = 'log-level';
      levelBadge.textContent = logEntry.level.toUpperCase();
      logElement.appendChild(levelBadge);

      // Create message
      const message = document.createElement('span');
      message.className = 'log-message';
      message.textContent = logEntry.message;
      logElement.appendChild(message);

      // Add details if present
      if (logEntry.data && Object.keys(logEntry.data).length > 0) {
        const detailsElement = document.createElement('div');
        detailsElement.className = 'log-details';
        const detailsTitle = document.createElement('h4');
        detailsTitle.textContent = 'Details';
        detailsElement.appendChild(detailsTitle);
        const detailsContent = document.createElement('pre');
        detailsContent.className = 'log-detail-json';
        detailsContent.textContent = JSON.stringify(logEntry.data, null, 2);
        detailsElement.appendChild(detailsContent);
        logElement.appendChild(detailsElement);
      }

      // Insert at top (newest first)
      if (this.logElement.firstChild) {
        this.logElement.insertBefore(logElement, this.logElement.firstChild);
      } else {
        this.logElement.appendChild(logElement);
      }

      // Auto-scroll to top
      this.logElement.scrollTop = 0;

      // Limit UI logs
      const maxUILogs = 100;
      while (this.logElement.children.length > maxUILogs) {
        this.logElement.removeChild(this.logElement.lastChild);
      }
    } catch (error) {
      console.error('Error updating log UI:', error);
    }
  }

  /**
   * Send log to server
   * @private
   */
  async _sendToServer(logEntry) {
    if (!this.serverLoggingEnabled || this.isLoadingLogs) {
      return;
    }
    try {
      await fetch('/api/logs/ui', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          level: logEntry.level,
          message: logEntry.message,
          data: logEntry.data
        })
      });
    } catch (error) {
      this.winstonLogger.warn('Failed to send log to server', {
        error: error.message
      });
      this.offlineLogs.push(logEntry);
    }
  }

  /**
   * Render all logs to UI
   */
  renderLogs() {
    if (!this.logElement) return;
    this.logElement.innerHTML = '';
    this.logs.forEach(log => this._updateLogUI(log));
    this.logElement.scrollTop = this.logElement.scrollHeight;
  }

  /**
   * Clear all logs
   */
  clearLogs() {
    this.logs = [];
    if (this.logElement) {
      this.logElement.innerHTML = '';
    }
    this.winstonLogger.info('Logs cleared');
  }

  /**
   * Get all logs
   */
  getLogs() {
    return [...this.logs];
  }

  /**
   * Update summary display
   */
  updateSummary() {
    // Implementation depends on UI structure
    this.winstonLogger.debug('Summary updated', {
      validCount: this.validCount,
      errorCount: this.errorCount
    });
  }

  /**
   * Clear summary
   */
  clearSummary() {
    this.validCount = 0;
    this.errorCount = 0;
    this.winstonLogger.debug('Summary cleared');
  }
}

// Export the Logger class
exports.Logger = Logger;

}).call(this)}).call(this,require('_process'))
},{"./ui-manager.js":16,"./winston-logger.js":18,"_process":2}],12:[function(require,module,exports){
(function (process){(function (){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.pingOneClient = exports.PingOneClient = void 0;
var _winstonLogger = require("./winston-logger.js");
var _uiManager = require("./ui-manager.js");
/**
 * @fileoverview PingOne Client Class
 * 
 * Handles authentication and API communication with PingOne services.
 * Manages token acquisition, caching, and API requests with Winston logging.
 * 
 * Features:
 * - Token management with localStorage caching
 * - Automatic token refresh
 * - API request handling with retry logic
 * - User import and modification operations
 * - Winston logging integration
 */

const ui = window.app && window.app.uiManager;
function handleClientError(error) {
  let userMessage = 'An unexpected error occurred. Please try again.';
  if (error && error.message) {
    if (error.message.includes('Network')) {
      userMessage = 'Network error – check your connection.';
    } else if (error.message.includes('timeout')) {
      userMessage = 'Request timed out – try again.';
    } else if (error.message.includes('401')) {
      userMessage = 'Session expired – please log in again.';
    } else if (error.message.includes('404')) {
      userMessage = 'Resource not found.';
    }
  }
  if (ui) ui.showStatusBar(userMessage, 'error');
}

/**
 * PingOne Client Class
 * 
 * Manages PingOne API authentication and requests with Winston logging.
 */
class PingOneClient {
  constructor() {
    // Initialize Winston logger
    this.logger = (0, _winstonLogger.createWinstonLogger)({
      service: 'pingone-import-client',
      environment: process.env.NODE_ENV || 'development'
    });
    this.accessToken = null;
    this.tokenExpiry = null;
    this.baseUrl = '/api/pingone';
    this.initialize();
  }

  /**
   * Initialize the client
   */
  initialize() {
    try {
      this.loadTokenFromStorage();
      this.logger.info('PingOne client initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize PingOne client', {
        error: error.message
      });
    }
  }

  /**
   * Load token from localStorage
   */
  loadTokenFromStorage() {
    try {
      if (typeof localStorage !== 'undefined') {
        const storedToken = localStorage.getItem('pingone_worker_token');
        const storedExpiry = localStorage.getItem('pingone_token_expiry');
        if (storedToken && storedExpiry) {
          const expiryTime = parseInt(storedExpiry, 10);
          const now = Date.now();
          if (expiryTime > now) {
            this.accessToken = storedToken;
            this.tokenExpiry = expiryTime;
            this.logger.info('Token loaded from storage', {
              hasToken: !!this.accessToken,
              expiryTime: new Date(this.tokenExpiry).toISOString()
            });
          } else {
            this.logger.warn('Stored token has expired');
            this.clearToken();
          }
        } else {
          this.logger.debug('No stored token found');
        }
      } else {
        this.logger.warn('localStorage is not available');
      }
    } catch (error) {
      this.logger.error('Error loading token from storage', {
        error: error.message
      });
    }
  }

  /**
   * Save token to localStorage
   */
  saveTokenToStorage(token, expiresIn) {
    try {
      if (typeof localStorage !== 'undefined') {
        const expiryTime = Date.now() + expiresIn * 1000;
        localStorage.setItem('pingone_worker_token', token);
        localStorage.setItem('pingone_token_expiry', expiryTime.toString());
        this.accessToken = token;
        this.tokenExpiry = expiryTime;
        this.logger.info('Token saved to storage', {
          tokenLength: token.length,
          expiresIn,
          expiryTime: new Date(expiryTime).toISOString()
        });
        return true;
      } else {
        this.logger.warn('localStorage is not available, cannot save token');
        return false;
      }
    } catch (error) {
      this.logger.error('Error saving token to storage', {
        error: error.message
      });
      return false;
    }
  }

  /**
   * Clear token from storage
   */
  clearToken() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('pingone_worker_token');
        localStorage.removeItem('pingone_token_expiry');
      }
      this.accessToken = null;
      this.tokenExpiry = null;
      this.logger.info('Token cleared from storage');
    } catch (error) {
      this.logger.error('Error clearing token from storage', {
        error: error.message
      });
    }
  }

  /**
   * Get cached token (alias for getCurrentTokenTimeRemaining for compatibility)
   * Production-ready with comprehensive error handling and validation
   */
  getCachedToken() {
    try {
      // Validate token existence and format
      if (!this.accessToken || typeof this.accessToken !== 'string') {
        this.logger.debug('No valid cached token available');
        return null;
      }

      // Validate expiry timestamp
      if (!this.tokenExpiry || typeof this.tokenExpiry !== 'number') {
        this.logger.warn('Invalid token expiry timestamp');
        this.clearToken(); // Clean up invalid state
        return null;
      }
      const now = Date.now();
      const isExpired = this.tokenExpiry <= now;

      // Add buffer time (5 minutes) to prevent edge cases
      const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
      const isNearExpiry = this.tokenExpiry - now <= bufferTime;
      if (isExpired) {
        this.logger.debug('Cached token is expired');
        this.clearToken(); // Clean up expired token
        return null;
      }
      if (isNearExpiry) {
        this.logger.warn('Token is near expiry, consider refreshing');
      }

      // Validate token format (basic JWT structure check)
      if (!this.accessToken.includes('.') || this.accessToken.split('.').length !== 3) {
        this.logger.error('Invalid token format detected');
        this.clearToken(); // Clean up invalid token
        return null;
      }
      this.logger.debug('Returning valid cached token');
      return this.accessToken;
    } catch (error) {
      this.logger.error('Error getting cached token', {
        error: error.message,
        stack: error.stack,
        tokenLength: this.accessToken ? this.accessToken.length : 0
      });
      // Don't expose token in logs for security
      return null;
    }
  }

  /**
   * Get current token time remaining
   */
  getCurrentTokenTimeRemaining() {
    try {
      if (!this.accessToken || !this.tokenExpiry) {
        return {
          token: null,
          timeRemaining: null,
          isExpired: true
        };
      }
      const now = Date.now();
      const timeRemaining = Math.max(0, this.tokenExpiry - now);
      const isExpired = timeRemaining === 0;
      const timeRemainingFormatted = this.formatDuration(Math.floor(timeRemaining / 1000));
      this.logger.debug('Token time remaining calculated', {
        timeRemaining: timeRemainingFormatted,
        isExpired
      });
      return {
        token: this.accessToken,
        timeRemaining: timeRemainingFormatted,
        isExpired
      };
    } catch (error) {
      this.logger.error('Error getting token time remaining', {
        error: error.message
      });
      return {
        token: null,
        timeRemaining: null,
        isExpired: true
      };
    }
  }

  /**
   * Format duration in human-readable format
   */
  formatDuration(seconds) {
    if (seconds <= 0) return 'Expired';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor(seconds % 3600 / 60);
    const remainingSeconds = seconds % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  }

  /**
   * Get access token with caching and refresh logic
   */
  async getAccessToken() {
    try {
      this.logger.debug('getAccessToken called');

      // Check if we have a valid cached token
      const tokenInfo = this.getCurrentTokenTimeRemaining();
      if (tokenInfo.token && !tokenInfo.isExpired) {
        this.logger.debug('Using cached token', {
          tokenPreview: tokenInfo.token.substring(0, 8) + '...',
          timeRemaining: tokenInfo.timeRemaining
        });
        return tokenInfo.token;
      }
      this.logger.debug('Fetching token from /api/pingone/get-token');

      // Fetch new token from server
      const response = await fetch('/api/pingone/get-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      this.logger.debug('Fetch response', {
        status: response.status,
        ok: response.ok
      });
      if (!response.ok) {
        const errorMsg = await response.text();
        this.logger.error('Fetch error', {
          status: response.status,
          error: errorMsg
        });
        throw new Error(`Failed to get token: ${response.status} ${errorMsg}`);
      }
      const data = await response.json();
      this.logger.debug('Data received from server', {
        hasAccessToken: !!data.access_token,
        expiresIn: data.expires_in
      });
      if (!data.access_token) {
        this.logger.warn('No access_token in server response', {
          data
        });
        throw new Error('No access token received from server');
      }

      // Save token to storage
      const tokenSaved = this.saveTokenToStorage(data.access_token, data.expires_in);
      if (tokenSaved) {
        this.logger.debug('Token saved to localStorage', {
          tokenLength: data.access_token.length,
          expiresIn: data.expires_in
        });
      } else {
        this.logger.warn('Failed to store token in localStorage');
      }
      return data.access_token;
    } catch (error) {
      this.logger.error('Error in getAccessToken', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Make authenticated API request with retry logic
   */
  async makeRequest(method, url, data = null, retryAttempts = 3) {
    try {
      const token = await this.getAccessToken();
      for (let attempt = 1; attempt <= retryAttempts; attempt++) {
        try {
          this.logger.debug(`Making API request (attempt ${attempt})`, {
            method,
            url,
            hasData: !!data
          });
          const requestOptions = {
            method,
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          };
          if (data) {
            requestOptions.body = JSON.stringify(data);
          }
          const response = await fetch(`${this.baseUrl}${url}`, requestOptions);
          this.logger.debug(`API request completed (attempt ${attempt})`, {
            status: response.status,
            ok: response.ok
          });
          if (response.ok) {
            const responseData = await response.json();
            return responseData;
          } else {
            const errorText = await response.text();
            this.logger.warn(`API request failed (attempt ${attempt})`, {
              status: response.status,
              error: errorText
            });
            if (attempt === retryAttempts) {
              throw new Error(`API request failed: ${response.status} ${errorText}`);
            }
          }
        } catch (error) {
          this.logger.error(`API request error (attempt ${attempt})`, {
            error: error.message
          });
          if (attempt === retryAttempts) {
            throw error;
          }

          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    } catch (error) {
      this.logger.error('All API request attempts failed', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Import users from CSV data
   */
  async importUsers(csvData, options = {}) {
    try {
      this.logger.info('importUsers method called', {
        userCount: csvData.length,
        options: Object.keys(options)
      });
      const {
        populationId = null,
        batchSize = 10,
        retryAttempts = 3,
        enableUsers = true,
        skipDuplicatesByEmail = false,
        skipDuplicatesByUsername = false
      } = options;
      this.logger.debug('Initial setup completed', {
        batchSize,
        retryAttempts,
        enableUsers,
        skipDuplicatesByEmail,
        skipDuplicatesByUsername
      });

      // Validate input
      if (!csvData || !Array.isArray(csvData) || csvData.length === 0) {
        throw new Error('Invalid CSV data: must be a non-empty array');
      }
      this.logger.debug('Input validation completed');

      // Handle population selection
      let fallbackPopulationId = populationId;
      if (!fallbackPopulationId) {
        const populationSelect = document.getElementById('import-population-select');
        if (populationSelect && populationSelect.value) {
          fallbackPopulationId = populationSelect.value;
          this.logger.debug('Using selected population from dropdown', {
            fallbackPopulationId
          });
        } else {
          // Try to get from settings
          const settings = JSON.parse(localStorage.getItem('pingone-import-settings') || '{}');
          fallbackPopulationId = settings.populationId;
          this.logger.debug('Using default population from settings', {
            fallbackPopulationId
          });
        }
      }

      // Prepare sets for duplicate detection
      const seenEmails = new Set();
      const seenUsernames = new Set();

      // Process users in batches
      const totalUsers = csvData.length;
      const results = {
        success: true,
        processed: 0,
        created: 0,
        skipped: 0,
        failed: 0,
        errors: []
      };
      this.logger.debug('Starting user processing loop...');
      for (let i = 0; i < totalUsers; i += batchSize) {
        const batch = csvData.slice(i, i + batchSize);
        this.logger.debug(`Processing batch ${Math.floor(i / batchSize) + 1}`, {
          users: `${i + 1}-${Math.min(i + batchSize, totalUsers)}`,
          batchSize: batch.length
        });
        for (const user of batch) {
          try {
            const userPopulationId = user.populationId || fallbackPopulationId;
            if (!userPopulationId) {
              const error = `Missing population – user not processed. Username: ${user.email || user.username}`;
              results.errors.push(error);
              results.skipped++;
              continue;
            }

            // Duplicate detection
            if (skipDuplicatesByEmail && user.email) {
              if (seenEmails.has(user.email.toLowerCase())) {
                this.logger.info(`Skipping duplicate user by email: ${user.email}`);
                results.skipped++;
                continue;
              }
              seenEmails.add(user.email.toLowerCase());
            }
            if (skipDuplicatesByUsername && user.username) {
              if (seenUsernames.has(user.username.toLowerCase())) {
                this.logger.info(`Skipping duplicate user by username: ${user.username}`);
                results.skipped++;
                continue;
              }
              seenUsernames.add(user.username.toLowerCase());
            }

            // Create user
            const userData = {
              username: user.username || user.email,
              email: user.email,
              name: {
                given: user.firstName || user.givenName || '',
                family: user.lastName || user.familyName || ''
              },
              enabled: enableUsers,
              population: {
                id: userPopulationId
              }
            };

            // Add optional fields
            if (user.phoneNumber) userData.phoneNumber = user.phoneNumber;
            if (user.company) userData.company = user.company;
            const result = await this.createUser(userData, retryAttempts);
            if (result.success) {
              results.created++;
              // Disable user if requested
              if (!enableUsers && result.userId) {
                this.logger.debug(`Disabling user ${result.userId} after creation`);
                try {
                  await this.makeRequest('PATCH', `/environments/current/users/${result.userId}`, {
                    enabled: false
                  });
                  this.logger.debug(`Successfully disabled user ${result.userId}`);
                } catch (statusError) {
                  this.logger.warn(`Failed to disable user ${result.userId}`, {
                    error: statusError.message
                  });
                }
              }
            } else {
              results.failed++;
              results.errors.push(result.error);
            }
            results.processed++;
          } catch (error) {
            results.failed++;
            results.errors.push(error.message);
          }
        }
      }
      this.logger.info('Batch import summary', {
        total: totalUsers,
        processed: results.processed,
        created: results.created,
        skipped: results.skipped,
        failed: results.failed
      });
      return results;
    } catch (error) {
      this.logger.error('Import users failed', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Create a single user
   */
  async createUser(userData, retryAttempts = 3) {
    try {
      for (let attempt = 1; attempt <= retryAttempts; attempt++) {
        try {
          this.logger.debug(`Making API request for user ${userData.email || userData.username} (attempt ${attempt}/${retryAttempts})`);
          const result = await this.makeRequest('POST', '/environments/current/users', userData);
          this.logger.debug(`API request completed for user ${userData.email || userData.username}`);
          if (result.id) {
            const successMessage = `Successfully created user: ${userData.username || userData.email}`;
            this.logger.info(successMessage, {
              userId: result.id,
              populationId: userData.population.id
            });
            return {
              success: true,
              userId: result.id,
              user: result
            };
          } else {
            this.logger.warn('Invalid response structure - no ID found', {
              result
            });
            return {
              success: false,
              error: 'Invalid response structure'
            };
          }
        } catch (error) {
          if (error.message.includes('already exists')) {
            this.logger.debug(`User already exists: ${userData.email || userData.username}`);
            return {
              success: true,
              userId: null,
              user: null,
              message: 'User already exists'
            };
          }
          this.logger.error(`API request failed for user ${userData.email || userData.username} (attempt ${attempt})`, {
            error: error.message
          });
          if (attempt === retryAttempts) {
            return {
              success: false,
              error: error.message
            };
          }

          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    } catch (error) {
      this.logger.error('Create user failed', {
        error: error.message,
        userData
      });
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Create and export default instance
exports.PingOneClient = PingOneClient;
const pingOneClient = exports.pingOneClient = new PingOneClient();

// Export the class and instance

}).call(this)}).call(this,require('_process'))
},{"./ui-manager.js":16,"./winston-logger.js":18,"_process":2}],13:[function(require,module,exports){
(function (process){(function (){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.progressManager = exports.ProgressManager = void 0;
var _winstonLogger = require("./winston-logger.js");
var _elementRegistry = require("./element-registry.js");
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
    this.logger = (0, _winstonLogger.createWinstonLogger)({
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
      this.logger.error('Failed to initialize progress manager', {
        error: error.message
      });
    }
  }

  /**
   * Setup DOM elements
   */
  setupElements() {
    try {
      // Main progress container
      this.progressContainer = document.getElementById('progress-container') || this.createProgressContainer();

      // Progress bar
      this.progressBar = this.progressContainer.querySelector('.progress-bar-fill') || this.createProgressBar();

      // Progress text
      this.progressText = this.progressContainer.querySelector('.progress-text') || this.createProgressText();

      // Progress details
      this.progressDetails = this.progressContainer.querySelector('.progress-details') || this.createProgressDetails();

      // Operation status
      this.operationStatus = this.progressContainer.querySelector('.operation-status') || this.createOperationStatus();

      // Cancel button
      this.cancelButton = this.progressContainer.querySelector('.cancel-operation') || this.createCancelButton();
      this.logger.debug('Progress elements setup completed');
    } catch (error) {
      this.logger.error('Error setting up progress elements', {
        error: error.message
      });
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
        radio.addEventListener('change', e => {
          this.duplicateHandlingMode = e.target.value;
          this.logger.debug('Duplicate handling mode changed', {
            mode: this.duplicateHandlingMode
          });
        });
      });
      this.logger.debug('Progress event listeners setup completed');
    } catch (error) {
      this.logger.error('Error setting up progress event listeners', {
        error: error.message
      });
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
      const percentage = total > 0 ? Math.round(current / total * 100) : 0;

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
      const detailsHTML = Object.entries(details).map(([key, value]) => {
        const label = key.charAt(0).toUpperCase() + key.slice(1);
        return `<div class="detail-item">
                        <span class="detail-label">${label}:</span>
                        <span class="detail-value">${value}</span>
                    </div>`;
      }).join('');
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
      this.logger.info('Operation status updated', {
        status,
        message
      });
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
      this.logger.error('Error showing progress', {
        error: error.message
      });
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
      this.logger.error('Error hiding progress', {
        error: error.message
      });
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
exports.ProgressManager = ProgressManager;
const progressManager = exports.progressManager = new ProgressManager();

// Export the class and instance

}).call(this)}).call(this,require('_process'))
},{"./element-registry.js":7,"./winston-logger.js":18,"_process":2}],14:[function(require,module,exports){
(function (process){(function (){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SettingsManager = void 0;
var _winstonLogger = require("./winston-logger.js");
var _cryptoUtils = require("./crypto-utils.js");
/**
 * @fileoverview Settings Manager Class
 * 
 * Manages application settings with secure storage and encryption.
 * Handles API credentials, user preferences, and configuration data
 * with automatic encryption for sensitive information.
 * 
 * @param {Object} logger - Winston logger instance for debugging
 */

class SettingsManager {
  constructor(logger = null) {
    // Initialize settings with default values
    this.settings = this.getDefaultSettings();
    this.storageKey = 'pingone-import-settings';
    this.crypto = new _cryptoUtils.CryptoUtils();
    this.encryptionKey = null;

    // Initialize Winston logger for debugging and error reporting
    this.initializeLogger(logger);

    // Encryption will be initialized in the init method
    this.encryptionInitialized = false;
  }

  /**
   * Initialize the settings manager
   */
  async init() {
    try {
      await this.initializeEncryption();
      this.encryptionInitialized = true;
      this.logger.info('Settings manager initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize settings manager', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Initialize Winston logger
   */
  initializeLogger(logger) {
    if (logger && typeof logger.child === 'function') {
      this.logger = logger.child({
        component: 'settings-manager'
      });
    } else {
      this.logger = (0, _winstonLogger.createWinstonLogger)({
        service: 'pingone-import-settings',
        environment: process.env.NODE_ENV || 'development'
      });
    }
  }

  /**
   * Create a default console logger if none provided
   */
  createDefaultLogger() {
    return {
      log: (msg, level = 'info') => this.logger.log(level, `[Settings] ${msg}`),
      info: msg => this.logger.info(`[Settings] ${msg}`),
      warn: msg => this.logger.warn(`[Settings] ${msg}`),
      error: msg => this.logger.error(`[Settings] ${msg}`),
      debug: msg => this.logger.debug(`[Settings] ${msg}`)
    };
  }

  /**
   * Get region info by code
   * @param {string} code - Region code (e.g., 'NA', 'CA', 'EU', 'AU', 'SG', 'AP')
   * @returns {{code: string, tld: string, label: string}}
   */
  static getRegionInfo(code) {
    const regions = {
      NA: {
        code: 'NA',
        tld: 'com',
        label: 'North America (excluding Canada)'
      },
      CA: {
        code: 'CA',
        tld: 'ca',
        label: 'Canada'
      },
      EU: {
        code: 'EU',
        tld: 'eu',
        label: 'European Union'
      },
      AU: {
        code: 'AU',
        tld: 'com.au',
        label: 'Australia'
      },
      SG: {
        code: 'SG',
        tld: 'sg',
        label: 'Singapore'
      },
      AP: {
        code: 'AP',
        tld: 'asia',
        label: 'Asia-Pacific'
      }
    };
    return regions[code] || regions['NA'];
  }

  /**
   * Get default settings
   */
  getDefaultSettings() {
    return {
      environmentId: '',
      region: 'NA',
      apiClientId: '',
      populationId: '',
      rateLimit: 50,
      connectionStatus: 'disconnected',
      connectionMessage: 'Not connected',
      lastConnectionTest: null,
      autoSave: true,
      lastUsedDirectory: '',
      theme: 'light',
      pageSize: 50,
      showNotifications: true
    };
  }

  /**
   * Load settings from storage
   */
  async loadSettings() {
    try {
      if (!this.encryptionInitialized) {
        this.logger.warn('Encryption not initialized, loading settings without decryption');
        return this.settings;
      }
      const storedData = localStorage.getItem(this.storageKey);
      if (!storedData) {
        this.logger.info('No stored settings found, using defaults');
        return this.settings;
      }
      const decryptedData = await this.crypto.decrypt(storedData, this.encryptionKey);
      const parsedSettings = JSON.parse(decryptedData);

      // Merge with defaults to ensure all properties exist
      this.settings = {
        ...this.getDefaultSettings(),
        ...parsedSettings
      };
      this.logger.info('Settings loaded successfully', {
        hasEnvironmentId: !!this.settings.environmentId,
        hasApiClientId: !!this.settings.apiClientId,
        region: this.settings.region
      });
      return this.settings;
    } catch (error) {
      this.logger.error('Failed to load settings', {
        error: error.message
      });
      // Return default settings on error
      return this.settings;
    }
  }

  /**
   * Save settings to storage
   */
  async saveSettings(settings = null) {
    try {
      if (settings) {
        this.settings = {
          ...this.settings,
          ...settings
        };
      }
      if (!this.encryptionInitialized) {
        this.logger.warn('Encryption not initialized, saving settings without encryption');
        localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
        return;
      }
      const jsonData = JSON.stringify(this.settings);
      const encryptedData = await this.crypto.encrypt(jsonData, this.encryptionKey);
      localStorage.setItem(this.storageKey, encryptedData);
      this.logger.info('Settings saved successfully', {
        hasEnvironmentId: !!this.settings.environmentId,
        hasApiClientId: !!this.settings.apiClientId,
        region: this.settings.region
      });
    } catch (error) {
      this.logger.error('Failed to save settings', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get a specific setting
   */
  getSetting(key) {
    return this.settings[key];
  }

  /**
   * Set a specific setting
   */
  async setSetting(key, value) {
    try {
      this.settings[key] = value;
      await this.saveSettings();
      this.logger.debug('Setting updated', {
        key,
        value: typeof value === 'string' ? value : '[object]'
      });
    } catch (error) {
      this.logger.error('Failed to update setting', {
        key,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get all settings
   */
  getAllSettings() {
    return {
      ...this.settings
    };
  }

  /**
   * Update multiple settings at once
   */
  async updateSettings(newSettings) {
    try {
      this.settings = {
        ...this.settings,
        ...newSettings
      };
      await this.saveSettings();
      this.logger.info('Multiple settings updated', {
        updatedKeys: Object.keys(newSettings),
        hasEnvironmentId: !!this.settings.environmentId,
        hasApiClientId: !!this.settings.apiClientId
      });
    } catch (error) {
      this.logger.error('Failed to update settings', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Reset settings to defaults
   */
  async resetSettings() {
    try {
      this.settings = this.getDefaultSettings();
      await this.saveSettings();
      this.logger.info('Settings reset to defaults');
    } catch (error) {
      this.logger.error('Failed to reset settings', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Clear all settings
   */
  async clearSettings() {
    try {
      localStorage.removeItem(this.storageKey);
      this.settings = this.getDefaultSettings();
      this.logger.info('Settings cleared');
    } catch (error) {
      this.logger.error('Failed to clear settings', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Initialize encryption with a key derived from browser and user-specific data
   */
  async initializeEncryption() {
    try {
      let deviceId = await this.getDeviceId();
      if (typeof deviceId !== 'string') deviceId = String(deviceId || '');
      if (!deviceId) deviceId = 'fallback-device-id';
      this.encryptionKey = await _cryptoUtils.CryptoUtils.generateKey(deviceId);
      this.logger.debug('Encryption initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize encryption', {
        error: error.message
      });
      // Fallback to a less secure but functional approach
      this.encryptionKey = await _cryptoUtils.CryptoUtils.generateKey('fallback-encryption-key');
      this.logger.warn('Using fallback encryption key');
    }
  }

  /**
   * Generate a device ID based on browser and system information
   * @returns {Promise<string>} A unique device ID
   */
  async getDeviceId() {
    try {
      // Try to get a stored device ID first
      if (this.isLocalStorageAvailable()) {
        const storedDeviceId = localStorage.getItem('pingone-device-id');
        if (storedDeviceId && typeof storedDeviceId === 'string') {
          return storedDeviceId;
        }
      }
      // Generate device ID from browser info
      const navigatorInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        hardwareConcurrency: navigator.hardwareConcurrency,
        deviceMemory: navigator.deviceMemory,
        maxTouchPoints: navigator.maxTouchPoints
      };
      const encoder = new TextEncoder();
      const data = encoder.encode(JSON.stringify(navigatorInfo));
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const deviceId = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      if (typeof deviceId !== 'string' || !deviceId) return 'fallback-device-id';
      return deviceId;
    } catch (error) {
      this.logger.error('Failed to generate device ID:', error);
      // Fallback to a random string if crypto API fails
      return 'fallback-' + Math.random().toString(36).substring(2, 15);
    }
  }

  /**
   * Check if localStorage is available
   */
  isLocalStorageAvailable() {
    try {
      const test = 'test';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (error) {
      this.logger.warn('localStorage not available', {
        error: error.message
      });
      return false;
    }
  }

  /**
   * Export settings (for backup)
   */
  async exportSettings() {
    try {
      const exportData = {
        settings: this.settings,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };
      this.logger.info('Settings exported', {
        exportDate: exportData.exportDate
      });
      return exportData;
    } catch (error) {
      this.logger.error('Failed to export settings', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Import settings (from backup)
   */
  async importSettings(importData) {
    try {
      if (!importData.settings) {
        throw new Error('Invalid import data: missing settings');
      }
      this.settings = {
        ...this.getDefaultSettings(),
        ...importData.settings
      };
      await this.saveSettings();
      this.logger.info('Settings imported successfully', {
        importDate: importData.exportDate,
        hasEnvironmentId: !!this.settings.environmentId,
        hasApiClientId: !!this.settings.apiClientId
      });
    } catch (error) {
      this.logger.error('Failed to import settings', {
        error: error.message
      });
      throw error;
    }
  }
}

// Export the SettingsManager class
exports.SettingsManager = SettingsManager;

}).call(this)}).call(this,require('_process'))
},{"./crypto-utils.js":6,"./winston-logger.js":18,"_process":2}],15:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
/**
 * TokenManager - Handles OAuth 2.0 token acquisition and caching with automatic re-authentication
 * 
 * Features:
 * - Automatic token refresh before expiry
 * - Detection of token expiration via 401 responses
 * - Automatic retry of failed requests with new tokens
 * - Secure credential storage and retrieval
 * - Rate limiting to prevent API abuse
 */
class TokenManager {
  /**
   * Create a new TokenManager instance
   * @param {Object} logger - Logger instance for logging messages
   * @param {Object} settings - Settings object containing API credentials
   */
  constructor(logger, settings) {
    this.logger = logger || console;
    this.settings = settings || {};
    this.tokenCache = {
      accessToken: null,
      expiresAt: 0,
      tokenType: 'Bearer',
      lastRefresh: 0
    };
    this.tokenExpiryBuffer = 5 * 60 * 1000; // 5 minutes buffer before token expiry
    this.isRefreshing = false;
    this.refreshQueue = [];

    // Auto-retry configuration
    this.maxRetries = 1; // Only retry once with new token
    this.retryDelay = 1000; // 1 second delay before retry

    // Bind methods
    this.getAccessToken = this.getAccessToken.bind(this);
    this._requestNewToken = this._requestNewToken.bind(this);
    this._isTokenValid = this._isTokenValid.bind(this);
    this.handleTokenExpiration = this.handleTokenExpiration.bind(this);
    this.retryWithNewToken = this.retryWithNewToken.bind(this);
  }

  /**
   * Get a valid access token, either from cache or by requesting a new one
   * @returns {Promise<string>} The access token
   */
  async getAccessToken() {
    // Check if we have a valid cached token
    if (this._isTokenValid()) {
      this.logger.debug('Using cached access token');
      return this.tokenCache.accessToken;
    }

    // If a refresh is already in progress, queue this request
    if (this.isRefreshing) {
      return new Promise(resolve => {
        this.refreshQueue.push(resolve);
      });
    }

    // Otherwise, request a new token
    try {
      this.isRefreshing = true;
      const token = await this._requestNewToken();

      // Resolve all queued requests
      while (this.refreshQueue.length > 0) {
        const resolve = this.refreshQueue.shift();
        resolve(token);
      }
      return token;
    } catch (error) {
      // Clear token cache on error
      this.tokenCache = {
        accessToken: null,
        expiresAt: 0,
        tokenType: 'Bearer',
        lastRefresh: 0
      };

      // Reject all queued requests
      while (this.refreshQueue.length > 0) {
        const resolve = this.refreshQueue.shift();
        resolve(Promise.reject(error));
      }
      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Handle token expiration detected from API response
   * @param {Object} response - The failed API response
   * @param {Function} retryFn - Function to retry the original request
   * @returns {Promise<Object>} The retry result
   */
  async handleTokenExpiration(response, retryFn) {
    this.logger.warn('Token expiration detected, attempting automatic re-authentication');

    // Clear the expired token
    this.tokenCache = {
      accessToken: null,
      expiresAt: 0,
      tokenType: 'Bearer',
      lastRefresh: 0
    };
    try {
      // Get a new token using stored credentials
      const newToken = await this.getAccessToken();
      if (!newToken) {
        throw new Error('Failed to obtain new token for retry');
      }
      this.logger.info('Successfully obtained new token, retrying request');

      // Wait a moment before retrying to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, this.retryDelay));

      // Retry the original request with the new token
      return await retryFn(newToken);
    } catch (error) {
      this.logger.error('Failed to re-authenticate and retry request', {
        error: error.message,
        originalStatus: response.status
      });
      throw error;
    }
  }

  /**
   * Retry a failed request with a new token
   * @param {Function} requestFn - Function that makes the API request
   * @param {Object} options - Request options
   * @returns {Promise<Object>} The API response
   */
  async retryWithNewToken(requestFn, options = {}) {
    let retryCount = 0;
    while (retryCount <= this.maxRetries) {
      try {
        // Get current token
        const token = await this.getAccessToken();

        // Make the request
        const response = await requestFn(token);

        // Check if the response indicates token expiration
        if (response.status === 401) {
          const responseText = await response.text().catch(() => '');
          const isTokenExpired = responseText.includes('token_expired') || responseText.includes('invalid_token') || responseText.includes('expired');
          if (isTokenExpired && retryCount < this.maxRetries) {
            this.logger.warn(`Token expired on attempt ${retryCount + 1}, retrying with new token`);

            // Clear expired token and get new one
            this.tokenCache = {
              accessToken: null,
              expiresAt: 0,
              tokenType: 'Bearer',
              lastRefresh: 0
            };
            retryCount++;
            continue;
          }
        }

        // If we get here, the request was successful or we've exhausted retries
        return response;
      } catch (error) {
        if (retryCount >= this.maxRetries) {
          throw error;
        }
        this.logger.warn(`Request failed on attempt ${retryCount + 1}, retrying`, {
          error: error.message
        });
        retryCount++;

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      }
    }
    throw new Error('Max retries exceeded');
  }

  /**
   * Create a request wrapper that automatically handles token expiration
   * @param {Function} requestFn - Function that makes the API request
   * @returns {Function} Wrapped function that handles token expiration
   */
  createAutoRetryWrapper(requestFn) {
    return async (...args) => {
      return await this.retryWithNewToken(async token => {
        // Add the token to the request arguments
        const requestArgs = [...args];

        // If the first argument is an options object, add the token to it
        if (requestArgs[0] && typeof requestArgs[0] === 'object') {
          requestArgs[0].headers = {
            ...requestArgs[0].headers,
            'Authorization': `Bearer ${token}`
          };
        }
        return await requestFn(...requestArgs);
      });
    };
  }

  /**
   * Get token information including expiry details
   * @returns {Object|null} Token info object or null if no token
   */
  getTokenInfo() {
    if (!this.tokenCache.accessToken) {
      return null;
    }
    const now = Date.now();
    const expiresIn = Math.max(0, this.tokenCache.expiresAt - now);
    return {
      accessToken: this.tokenCache.accessToken,
      expiresIn: Math.floor(expiresIn / 1000),
      // Convert to seconds
      tokenType: this.tokenCache.tokenType,
      expiresAt: this.tokenCache.expiresAt,
      lastRefresh: this.tokenCache.lastRefresh,
      isValid: this._isTokenValid()
    };
  }

  /**
   * Check if the current token is still valid
   * @returns {boolean} True if token is valid, false otherwise
   * @private
   */
  _isTokenValid() {
    const now = Date.now();
    return this.tokenCache.accessToken && this.tokenCache.expiresAt > now + this.tokenExpiryBuffer &&
    // Ensure token isn't too old (max 1 hour)
    now - this.tokenCache.lastRefresh < 60 * 60 * 1000;
  }

  /**
   * Get the auth domain for a given region
   * @private
   */
  _getAuthDomain(region) {
    const authDomainMap = {
      'NorthAmerica': 'auth.pingone.com',
      'Europe': 'auth.eu.pingone.com',
      'Canada': 'auth.ca.pingone.com',
      'Asia': 'auth.apsoutheast.pingone.com',
      'Australia': 'auth.aus.pingone.com',
      'US': 'auth.pingone.com',
      'EU': 'auth.eu.pingone.com',
      'AP': 'auth.apsoutheast.pingone.com'
    };
    return authDomainMap[region] || 'auth.pingone.com';
  }

  /**
   * Request a new access token from PingOne using stored credentials
   * @returns {Promise<string>} The new access token
   * @private
   */
  async _requestNewToken() {
    const {
      apiClientId,
      apiSecret,
      environmentId,
      region = 'NorthAmerica'
    } = this.settings;
    const requestId = `req_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    // Validate required settings
    if (!apiClientId || !apiSecret || !environmentId) {
      const error = new Error('Missing required API credentials in settings');
      this.logger.error('Token request failed: Missing credentials', {
        requestId,
        hasClientId: !!apiClientId,
        hasSecret: !!apiSecret,
        hasEnvId: !!environmentId
      });
      throw error;
    }

    // Prepare request
    const authDomain = this._getAuthDomain(region);
    const tokenUrl = `https://${authDomain}/${environmentId}/as/token`;
    const credentials = btoa(`${apiClientId}:${apiSecret}`);
    try {
      this.logger.debug('Requesting new access token from PingOne...', {
        requestId,
        authDomain,
        environmentId,
        region
      });
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${credentials}`
        },
        body: 'grant_type=client_credentials',
        credentials: 'omit'
      });
      const responseTime = Date.now() - startTime;
      let responseData;
      try {
        responseData = await response.json();
      } catch (e) {
        const text = await response.text().catch(() => 'Failed to read response text');
        throw new Error(`Invalid JSON response: ${e.message}. Response: ${text}`);
      }
      if (!response.ok) {
        const errorMsg = responseData.error_description || responseData.error || `HTTP ${response.status} ${response.statusText}`;
        this.logger.error('Token request failed', {
          requestId,
          status: response.status,
          error: responseData.error,
          errorDescription: responseData.error_description,
          responseTime: `${responseTime}ms`,
          url: tokenUrl
        });
        throw new Error(errorMsg);
      }
      if (!responseData.access_token) {
        throw new Error('No access token in response');
      }

      // Update token cache
      const expiresInMs = (responseData.expires_in || 3600) * 1000;
      this.tokenCache = {
        accessToken: responseData.access_token,
        expiresAt: Date.now() + expiresInMs,
        tokenType: responseData.token_type || 'Bearer',
        lastRefresh: Date.now()
      };
      this.logger.info('Successfully obtained new access token', {
        requestId,
        tokenType: this.tokenCache.tokenType,
        expiresIn: Math.floor(expiresInMs / 1000) + 's',
        responseTime: `${responseTime}ms`
      });
      return this.tokenCache.accessToken;
    } catch (error) {
      this.logger.error('Error getting access token', {
        requestId,
        error: error.toString(),
        message: error.message,
        url: tokenUrl,
        responseTime: `${Date.now() - startTime}ms`
      });

      // Clear token cache on error
      this.tokenCache = {
        accessToken: null,
        expiresAt: 0,
        tokenType: 'Bearer',
        lastRefresh: 0
      };
      throw error;
    }
  }

  /**
   * Update settings and clear token cache if credentials changed
   * @param {Object} newSettings - New settings object
   */
  updateSettings(newSettings) {
    const credentialsChanged = newSettings.apiClientId !== this.settings.apiClientId || newSettings.apiSecret !== this.settings.apiSecret || newSettings.environmentId !== this.settings.environmentId || newSettings.region !== this.settings.region;
    this.settings = {
      ...this.settings,
      ...newSettings
    };
    if (credentialsChanged) {
      this.logger.debug('API credentials changed, clearing token cache');
      this.tokenCache = {
        accessToken: null,
        expiresAt: 0,
        tokenType: 'Bearer',
        lastRefresh: 0
      };
    }
  }
}
var _default = exports.default = TokenManager;

},{}],16:[function(require,module,exports){
(function (process){(function (){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.uiManager = exports.UIManager = void 0;
var _winstonLogger = require("./winston-logger.js");
var _circularProgress = require("./circular-progress.js");
var _elementRegistry = require("./element-registry.js");
var _progressManager = require("./progress-manager.js");
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
    this.logger = (0, _winstonLogger.createWinstonLogger)({
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
      this.logger.error('Failed to initialize UI Manager', {
        error: error.message
      });
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
    this.notificationContainer = _elementRegistry.ElementRegistry.notificationContainer ? _elementRegistry.ElementRegistry.notificationContainer() : null;
    this.progressContainer = _elementRegistry.ElementRegistry.progressContainer ? _elementRegistry.ElementRegistry.progressContainer() : null;
    this.tokenStatusElement = _elementRegistry.ElementRegistry.tokenStatus ? _elementRegistry.ElementRegistry.tokenStatus() : null;
    this.connectionStatusElement = _elementRegistry.ElementRegistry.connectionStatus ? _elementRegistry.ElementRegistry.connectionStatus() : null;

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
  }

  /**
   * Show a persistent, animated status bar message
   * type: info, success, warning, error
   * message: string
   * options: { autoDismiss: boolean, duration: ms }
   */
  showStatusBar(message, type = 'info', options = {}) {
    const bar = _elementRegistry.ElementRegistry.statusBar ? _elementRegistry.ElementRegistry.statusBar() : null;
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
    const bar = _elementRegistry.ElementRegistry.statusBar ? _elementRegistry.ElementRegistry.statusBar() : null;
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
      this.logger.info('Success notification with details', {
        message,
        details
      });
    } else {
      this.logger.info('Success notification shown', {
        message
      });
    }
  }

  /**
   * Show an error message that stays until dismissed
   */
  showError(title, message) {
    const fullMessage = title && message ? `${title}: ${message}` : title || message;
    this.showStatusBar(fullMessage, 'error', {
      autoDismiss: false
    });
    this.logger.error('Error notification shown', {
      title,
      message
    });
  }

  /**
   * Show a warning message that stays until dismissed
   */
  showWarning(message) {
    this.showStatusBar(message, 'warning', {
      autoDismiss: false
    });
    this.logger.warn('Warning notification shown', {
      message
    });
  }

  /**
   * Show an info message with auto-dismiss
   */
  showInfo(message) {
    this.showStatusBar(message, 'info', {
      autoDismiss: true,
      duration: 3000
    });
    this.logger.info('Info notification shown', {
      message
    });
  }

  /**
   * Show a loading message that stays until cleared
   */
  showLoading(message = 'Processing...') {
    this.showStatusBar(message, 'info', {
      autoDismiss: false
    });
    this.logger.info('Loading notification shown', {
      message
    });
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
      const percentage = total > 0 ? Math.round(current / total * 100) : 0;
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
      this.logger.error('Error updating progress', {
        error: error.message,
        current,
        total
      });
    }
  }

  /**
   * Update token status with Winston logging
   */
  updateTokenStatus(status, message = '') {
    try {
      this.logger.info('Token status updated', {
        status,
        message
      });
      if (this.tokenStatusElement) {
        this.tokenStatusElement.className = `token-status ${status}`;
        this.tokenStatusElement.textContent = message || status;
      } else {
        this.logger.warn('Token status element not found');
      }
    } catch (error) {
      this.logger.error('Error updating token status', {
        error: error.message,
        status,
        message
      });
    }
  }

  /**
   * Update connection status with Winston logging
   */
  updateConnectionStatus(status, message = '') {
    try {
      this.logger.info('Connection status updated', {
        status,
        message
      });
      if (this.connectionStatusElement) {
        this.connectionStatusElement.className = `connection-status ${status}`;
        this.connectionStatusElement.textContent = message || status;
      } else {
        this.logger.warn('Connection status element not found');
      }
    } catch (error) {
      this.logger.error('Error updating connection status', {
        error: error.message,
        status,
        message
      });
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
      const statusElement = _elementRegistry.ElementRegistry.currentTokenStatus ? _elementRegistry.ElementRegistry.currentTokenStatus() : null;
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
      this.logger.error('Error showing current token status', {
        error: error.message,
        tokenInfo
      });
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
      const universalStatusBar = _elementRegistry.ElementRegistry.universalTokenStatus ? _elementRegistry.ElementRegistry.universalTokenStatus() : null;
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
      this.logger.error('Error updating universal token status', {
        error: error.message,
        tokenInfo
      });
    }
  }

  /**
   * Update home token status with Winston logging
   */
  updateHomeTokenStatus(isLoading = false) {
    try {
      this.logger.debug('Home token status updated', {
        isLoading
      });
      const homeTokenStatus = _elementRegistry.ElementRegistry.homeTokenStatus ? _elementRegistry.ElementRegistry.homeTokenStatus() : null;
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
      this.logger.error('Error updating home token status', {
        error: error.message,
        isLoading
      });
    }
  }

  /**
   * Update settings save status with Winston logging
   */
  updateSettingsSaveStatus(success, message = '') {
    try {
      this.logger.info('Settings save status updated', {
        success,
        message
      });
      const saveStatusElement = _elementRegistry.ElementRegistry.settingsSaveStatus ? _elementRegistry.ElementRegistry.settingsSaveStatus() : null;
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
      this.logger.error('Error updating settings save status', {
        error: error.message,
        success,
        message
      });
    }
  }

  /**
   * Show import status with Winston logging
   */
  showImportStatus(status, message = '', details = {}) {
    try {
      this.logger.info('Import status shown', {
        status,
        message,
        details
      });
      const statusElement = _elementRegistry.ElementRegistry.importStatus ? _elementRegistry.ElementRegistry.importStatus() : null;
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
      this.logger.error('Error showing import status', {
        error: error.message,
        status,
        message
      });
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
      this.logger.error('Error clearing notifications', {
        error: error.message
      });
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
      this.logger.error('Error hiding progress', {
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
      this.logger.error('Error showing progress', {
        error: error.message
      });
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
        this.logger.debug('Button loading state updated', {
          buttonId,
          isLoading
        });
      } else {
        this.logger.warn(`Button with ID '${buttonId}' not found`);
      }
    } catch (error) {
      this.logger.error('Error setting button loading state', {
        error: error.message,
        buttonId,
        isLoading
      });
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
      this.logger.error('Error updating population fields', {
        error: error.message,
        populations
      });
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
      this.logger.info('Notification shown', {
        title,
        message,
        type
      });
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
      _progressManager.progressManager.updateProgress(current, total, message, {
        ...counts,
        population: populationName,
        populationId: populationId
      });

      // Update operation stats
      if (counts.success !== undefined) _progressManager.progressManager.operationStats.success = counts.success;
      if (counts.failed !== undefined) _progressManager.progressManager.operationStats.failed = counts.failed;
      if (counts.skipped !== undefined) _progressManager.progressManager.operationStats.skipped = counts.skipped;
      if (counts.duplicates !== undefined) _progressManager.progressManager.operationStats.duplicates = counts.duplicates;
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
   * Start import operation with progress manager
   * 
   * @param {Object} options - Import options
   */
  startImportOperation(options = {}) {
    try {
      _progressManager.progressManager.startOperation('import', options);
      this.logger.info('Import operation started', {
        options
      });
    } catch (error) {
      this.logger.error('Error starting import operation', {
        error: error.message,
        options
      });
    }
  }

  /**
   * Start export operation with progress manager
   * 
   * @param {Object} options - Export options
   */
  startExportOperation(options = {}) {
    try {
      _progressManager.progressManager.startOperation('export', options);
      this.logger.info('Export operation started', {
        options
      });
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
      _progressManager.progressManager.startOperation('delete', options);
      this.logger.info('Delete operation started', {
        options
      });
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
      _progressManager.progressManager.startOperation('modify', options);
      this.logger.info('Modify operation started', {
        options
      });
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
      _progressManager.progressManager.completeOperation(results);
      this.logger.info('Operation completed', {
        results
      });
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
      _progressManager.progressManager.handleDuplicates(duplicates, onDecision);
      this.logger.info('Duplicate users handled', {
        count: duplicates.length
      });
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
}

// Create and export default instance
exports.UIManager = UIManager;
const uiManager = exports.uiManager = new UIManager();

// Export the class and instance

}).call(this)}).call(this,require('_process'))
},{"./circular-progress.js":5,"./element-registry.js":7,"./progress-manager.js":13,"./winston-logger.js":18,"_process":2}],17:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.VersionManager = void 0;
class VersionManager {
  constructor() {
    this.version = '5.1'; // Update this with each new version
    console.log(`Version Manager initialized with version ${this.version}`);
  }
  getVersion() {
    return this.version;
  }
  getFormattedVersion() {
    return `v${this.version}`;
  }
  updateTitle() {
    // Update the main title
    const title = document.querySelector('h1');
    if (title) {
      // Remove any existing version number
      const baseTitle = title.textContent.replace(/\s*\(v\d+\.\d+\.\d+\)\s*$/, '').trim();
      title.textContent = `${baseTitle} (${this.getFormattedVersion()})`;
    }

    // Update the document title
    document.title = `PingOne User Import ${this.getFormattedVersion()}`;

    // Update the import button text
    this.updateImportButton();

    // Update the top version badge
    this.updateTopVersionBadge();

    // Add version badge to the UI
    this.addVersionBadge();
  }
  updateImportButton() {
    const importButton = document.getElementById('start-import-btn');
    if (importButton) {
      const baseText = importButton.textContent.replace(/\s*\(v\d+\.\d+\.\d+\)\s*$/, '').trim();
      importButton.innerHTML = `<i class="pi pi-upload"></i> ${baseText} (${this.getFormattedVersion()})`;
    }
  }
  updateTopVersionBadge() {
    const versionText = document.getElementById('version-text');
    if (versionText) {
      versionText.textContent = this.getFormattedVersion();
    }
  }
  addVersionBadge() {
    // Check if badge already exists
    if (document.getElementById('version-badge')) {
      return;
    }

    // Create version badge
    const badge = document.createElement('div');
    badge.id = 'version-badge';
    badge.textContent = this.getFormattedVersion();
    badge.style.position = 'fixed';
    badge.style.bottom = '10px';
    badge.style.right = '10px';
    badge.style.backgroundColor = '#333';
    badge.style.color = 'white';
    badge.style.padding = '2px 6px';
    badge.style.borderRadius = '3px';
    badge.style.fontSize = '12px';
    badge.style.fontFamily = 'monospace';
    badge.style.zIndex = '1000';
    document.body.appendChild(badge);
  }
}

// ES Module export
exports.VersionManager = VersionManager;

},{}],18:[function(require,module,exports){
(function (process){(function (){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.apiLogger = exports.WinstonLogger = void 0;
exports.createComponentLogger = createComponentLogger;
exports.createWinstonLogger = createWinstonLogger;
exports.uiLogger = exports.tokenLogger = exports.settingsLogger = exports.fileLogger = exports.defaultLogger = void 0;
/**
 * @fileoverview Winston-compatible logger for frontend/browser environment
 * 
 * This module provides a Winston-like logging interface for the frontend
 * that maintains consistency with server-side Winston logging while
 * working within browser constraints.
 * 
 * Features:
 * - Winston-compatible API (info, warn, error, debug)
 * - Structured logging with metadata
 * - Timestamp formatting
 * - Log level filtering
 * - Console and server transport support
 * - Error stack trace handling
 * - Environment-aware configuration
 */

/**
 * Winston-compatible logger for browser environment
 */
class WinstonLogger {
  constructor(options = {}) {
    this.level = options.level || this.getDefaultLevel();
    this.service = options.service || 'pingone-import-frontend';
    this.environment = options.environment || process.env.NODE_ENV || 'development';
    this.enableServerLogging = options.enableServerLogging !== false;
    this.enableConsoleLogging = options.enableConsoleLogging !== false;

    // Log level hierarchy
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };

    // Initialize transports
    this.transports = [];
    this.initializeTransports();
  }

  /**
   * Get default log level based on environment
   */
  getDefaultLevel() {
    if (this.environment === 'production') {
      return 'info';
    } else if (this.environment === 'test') {
      return 'warn';
    } else {
      return 'debug';
    }
  }

  /**
   * Initialize logging transports
   */
  initializeTransports() {
    // Console transport
    if (this.enableConsoleLogging) {
      this.transports.push({
        name: 'console',
        log: (level, message, meta) => this.logToConsole(level, message, meta)
      });
    }

    // Server transport (if enabled)
    if (this.enableServerLogging) {
      this.transports.push({
        name: 'server',
        log: (level, message, meta) => this.logToServer(level, message, meta)
      });
    }
  }

  /**
   * Check if a log level should be logged
   */
  shouldLog(level) {
    return this.levels[level] <= this.levels[this.level];
  }

  /**
   * Format timestamp
   */
  formatTimestamp() {
    return new Date().toISOString();
  }

  /**
   * Format log entry
   */
  formatLogEntry(level, message, meta = {}) {
    const timestamp = this.formatTimestamp();
    return {
      timestamp,
      level,
      message,
      service: this.service,
      environment: this.environment,
      ...meta
    };
  }

  /**
   * Log to console with Winston-like formatting
   */
  logToConsole(level, message, meta = {}) {
    if (!this.shouldLog(level)) return;
    const logEntry = this.formatLogEntry(level, message, meta);
    const timestamp = logEntry.timestamp;
    const levelUpper = level.toUpperCase();

    // Create formatted console message
    let consoleMessage = `[${timestamp}] [${this.service}] ${levelUpper}: ${message}`;

    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      consoleMessage += `\n${JSON.stringify(meta, null, 2)}`;
    }

    // Use appropriate console method
    switch (level) {
      case 'error':
        console.error(consoleMessage);
        break;
      case 'warn':
        console.warn(consoleMessage);
        break;
      case 'info':
        console.info(consoleMessage);
        break;
      case 'debug':
        console.debug(consoleMessage);
        break;
      default:
        console.log(consoleMessage);
    }
  }

  /**
   * Log to server via API endpoint
   */
  async logToServer(level, message, meta = {}) {
    if (!this.shouldLog(level)) return;
    try {
      const logEntry = this.formatLogEntry(level, message, meta);

      // Send to server logging endpoint
      await fetch('/api/logs/ui', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(logEntry)
      });
    } catch (error) {
      // Fallback to console if server logging fails
      console.warn('Server logging failed, falling back to console:', error.message);
      this.logToConsole(level, message, meta);
    }
  }

  /**
   * Main logging method
   */
  log(level, message, meta = {}) {
    if (!this.shouldLog(level)) return;

    // Send to all transports
    this.transports.forEach(transport => {
      try {
        transport.log(level, message, meta);
      } catch (error) {
        console.error(`Error in ${transport.name} transport:`, error);
      }
    });
  }

  /**
   * Log info level message
   */
  info(message, meta = {}) {
    this.log('info', message, meta);
  }

  /**
   * Log warn level message
   */
  warn(message, meta = {}) {
    this.log('warn', message, meta);
  }

  /**
   * Log error level message
   */
  error(message, meta = {}) {
    this.log('error', message, meta);
  }

  /**
   * Log debug level message
   */
  debug(message, meta = {}) {
    this.log('debug', message, meta);
  }

  /**
   * Log error with stack trace
   */
  errorWithStack(message, error, meta = {}) {
    const errorMeta = {
      ...meta,
      error: {
        message: error.message,
        stack: error.stack,
        code: error.code,
        name: error.name
      }
    };
    this.error(message, errorMeta);
  }

  /**
   * Create child logger with additional metadata
   */
  child(additionalMeta = {}) {
    const childLogger = new WinstonLogger({
      level: this.level,
      service: this.service,
      environment: this.environment,
      enableServerLogging: this.enableServerLogging,
      enableConsoleLogging: this.enableConsoleLogging
    });

    // Override formatLogEntry to include additional metadata
    childLogger.formatLogEntry = (level, message, meta = {}) => {
      const baseEntry = this.formatLogEntry(level, message, meta);
      return {
        ...baseEntry,
        ...additionalMeta
      };
    };
    return childLogger;
  }

  /**
   * Set log level
   */
  setLevel(level) {
    if (this.levels.hasOwnProperty(level)) {
      this.level = level;
    } else {
      this.warn(`Invalid log level: ${level}`);
    }
  }

  /**
   * Enable/disable server logging
   */
  setServerLogging(enabled) {
    this.enableServerLogging = enabled;

    // Update transports
    this.transports = this.transports.filter(t => t.name !== 'server');
    if (enabled) {
      this.transports.push({
        name: 'server',
        log: (level, message, meta) => this.logToServer(level, message, meta)
      });
    }
  }

  /**
   * Enable/disable console logging
   */
  setConsoleLogging(enabled) {
    this.enableConsoleLogging = enabled;

    // Update transports
    this.transports = this.transports.filter(t => t.name !== 'console');
    if (enabled) {
      this.transports.push({
        name: 'console',
        log: (level, message, meta) => this.logToConsole(level, message, meta)
      });
    }
  }
}

/**
 * Create default logger instance
 */
exports.WinstonLogger = WinstonLogger;
function createWinstonLogger(options = {}) {
  return new WinstonLogger(options);
}

/**
 * Create component-specific logger
 */
function createComponentLogger(component, options = {}) {
  return createWinstonLogger({
    ...options,
    service: `${options.service || 'pingone-import'}-${component}`
  });
}

/**
 * Default logger instances
 */
const defaultLogger = exports.defaultLogger = createWinstonLogger();
const apiLogger = exports.apiLogger = createComponentLogger('api');
const uiLogger = exports.uiLogger = createComponentLogger('ui');
const fileLogger = exports.fileLogger = createComponentLogger('file');
const settingsLogger = exports.settingsLogger = createComponentLogger('settings');
const tokenLogger = exports.tokenLogger = createComponentLogger('token');

// Export the class for custom instances

}).call(this)}).call(this,require('_process'))
},{"_process":2}]},{},[3]);
