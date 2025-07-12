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

import { createWinstonLogger } from './winston-logger.js';
import { UIManager } from './ui-manager.js';
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
        this.logger = createWinstonLogger({
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
            this.logger.error('Failed to initialize PingOne client', { error: error.message });
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
            this.logger.error('Error loading token from storage', { error: error.message });
        }
    }
    
    /**
     * Save token to localStorage
     */
    saveTokenToStorage(token, expiresIn) {
        try {
            if (typeof localStorage !== 'undefined') {
                const expiryTime = Date.now() + (expiresIn * 1000);
                
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
            this.logger.error('Error saving token to storage', { error: error.message });
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
            this.logger.error('Error clearing token from storage', { error: error.message });
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
            this.logger.error('Error getting token time remaining', { error: error.message });
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
        const minutes = Math.floor((seconds % 3600) / 60);
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
            
            this.logger.debug('Fetch response', { status: response.status, ok: response.ok });
            
            if (!response.ok) {
                const errorMsg = await response.text();
                this.logger.error('Fetch error', { status: response.status, error: errorMsg });
                throw new Error(`Failed to get token: ${response.status} ${errorMsg}`);
            }
            
            const data = await response.json();
            this.logger.debug('Data received from server', { 
                hasAccessToken: !!data.access_token,
                expiresIn: data.expires_in
            });
            
            if (!data.access_token) {
                this.logger.warn('No access_token in server response', { data });
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
            this.logger.error('Error in getAccessToken', { error: error.message });
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
                    this.logger.error(`API request error (attempt ${attempt})`, { error: error.message });
                    
                    if (attempt === retryAttempts) {
                        throw error;
                    }
                    
                    // Wait before retry
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                }
            }
        } catch (error) {
            this.logger.error('All API request attempts failed', { error: error.message });
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
                enableUsers = true
            } = options;
            
            this.logger.debug('Initial setup completed', { batchSize, retryAttempts, enableUsers });
            
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
                    this.logger.debug('Using selected population from dropdown', { fallbackPopulationId });
                } else {
                    // Try to get from settings
                    const settings = JSON.parse(localStorage.getItem('pingone-import-settings') || '{}');
                    fallbackPopulationId = settings.populationId;
                    this.logger.debug('Using default population from settings', { fallbackPopulationId });
                }
            }
            
            // Check if CSV has population data
            const hasPopulationData = csvData.some(user => user.populationId);
            
            if (hasPopulationData) {
                this.logger.debug('CSV has population data, will use individual population IDs from CSV');
            } else if (fallbackPopulationId) {
                this.logger.debug('CSV population ID enabled but no population data found in CSV');
            } else {
                this.logger.debug('No population selected, showing modal...');
                
                // Show population selection modal
                const modal = document.getElementById('population-selection-modal');
                if (modal) {
                    modal.style.display = 'block';
                    
                    // Wait for user selection
                    return new Promise((resolve, reject) => {
                        const confirmButton = document.getElementById('confirm-population-btn');
                        const cancelButton = document.getElementById('cancel-population-btn');
                        
                        const handleConfirm = () => {
                            const selectedPopulation = document.getElementById('population-select').value;
                            if (selectedPopulation) {
                                modal.style.display = 'none';
                                this.logger.debug('User chose to continue without population selection, using default population');
                                resolve(this.importUsers(csvData, { ...options, populationId: selectedPopulation }));
                            }
                        };
                        
                        const handleCancel = () => {
                            modal.style.display = 'none';
                            this.logger.debug('User cancelled population selection');
                            reject(new Error('Population selection cancelled'));
                        };
                        
                        confirmButton.onclick = handleConfirm;
                        cancelButton.onclick = handleCancel;
                    });
                } else {
                    // Try to get first available population as fallback
                    try {
                        const populations = await this.makeRequest('GET', '/environments/current/populations');
                        if (populations._embedded && populations._embedded.populations.length > 0) {
                            fallbackPopulationId = populations._embedded.populations[0].id;
                            this.logger.debug('Using first available population as fallback', { fallbackPopulationId });
                        } else {
                            this.logger.debug('No populations available, skipping all users');
                            return { success: false, message: 'No populations available' };
                        }
                    } catch (error) {
                        this.logger.error('Error getting populations', { error: error.message });
                        throw error;
                    }
                }
            }
            
            this.logger.debug('Population selection completed', { fallbackPopulationId });
            
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
                this.logger.debug(`Processing batch ${Math.floor(i/batchSize) + 1}`, { 
                    users: `${i+1}-${Math.min(i+batchSize, totalUsers)}`,
                    batchSize: batch.length
                });
                
                for (const user of batch) {
                    try {
                        const userPopulationId = user.populationId || fallbackPopulationId;
                        
                        if (!userPopulationId) {
                            const error = `Missing population – user not processed. Username: ${user.email || user.username}`;
                            this.logger.error(`Line ${csvData.indexOf(user) + 2}: ${error}`);
                            results.errors.push(error);
                            results.skipped++;
                            continue;
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
                        if (user.title) userData.title = user.title;
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
                                    this.logger.warn(`Failed to disable user ${result.userId}`, { error: statusError.message });
                                }
                            }
                        } else {
                            results.failed++;
                            results.errors.push(result.error);
                        }
                        
                        results.processed++;
                        
                    } catch (error) {
                        this.logger.error(`Unexpected error for user ${user.email || user.username}`, { error: error.message });
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
            this.logger.error('Import users failed', { error: error.message });
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
                        this.logger.info(successMessage, { userId: result.id, populationId: userData.population.id });
                        
                        return {
                            success: true,
                            userId: result.id,
                            user: result
                        };
                    } else {
                        this.logger.warn('Invalid response structure - no ID found', { result });
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
                    
                    this.logger.error(`API request failed for user ${userData.email || userData.username} (attempt ${attempt})`, { error: error.message });
                    
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
            this.logger.error('Create user failed', { error: error.message, userData });
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// Create and export default instance
const pingOneClient = new PingOneClient();

// Export the class and instance
export { PingOneClient, pingOneClient };