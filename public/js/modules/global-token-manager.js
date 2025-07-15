/**
 * Global Token Manager Module
 * 
 * Provides a prominent global token status display in the sidebar
 * with real-time countdown timer and enhanced visibility across all windows.
 */

const GlobalTokenManager = {
    // Timer for updating token status
    globalTokenTimer: null,

    /**
     * Initialize the global token manager
     */
    init() {
        console.log('Initializing Global Token Manager...');
        this.initGlobalTokenStatus();
    },

    /**
     * Create the global token status window
     */
    createGlobalTokenStatus() {
        // Check if it already exists
        if (document.getElementById('global-token-status')) {
            return;
        }

        // Create the status window with the same structure as provided
        const statusHTML = `
            <div id="global-token-status" class="global-token-status missing">
                <div class="global-token-header">
                    <i class="fas fa-key"></i>
                    <span class="global-token-title">Token Status</span>
                    <div class="global-token-time">
                        <span class="global-token-countdown" style="color: rgb(255, 107, 107); font-weight: bold;">No Token</span>
                    </div>
                </div>
                <div class="global-token-content">
                    <div class="global-token-status-display">
                        <span class="global-token-icon">❌</span>
                        <span class="global-token-text">No valid token</span>
                    </div>
                    <div class="global-token-actions">
                        <button id="global-refresh-token" class="btn btn-sm btn-outline-secondary" title="Refresh token status">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                        <button id="global-get-token" class="btn btn-sm btn-success" title="Get new token" style="display: inline-block;">
                            <i class="fas fa-key"></i> Get Token
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Insert into the sidebar
        const sidebar = document.querySelector('.sidebar') || document.querySelector('#sidebar');
        if (sidebar) {
            sidebar.insertAdjacentHTML('beforeend', statusHTML);
            console.log('Global token status window created');
        } else {
            console.warn('Sidebar not found, cannot create global token status');
        }
    },

    /**
     * Update the global token status display
     */
    updateGlobalTokenStatus() {
        const statusBox = document.getElementById('global-token-status');
        if (!statusBox) {
            this.createGlobalTokenStatus();
            return;
        }

        const countdown = statusBox.querySelector('.global-token-countdown');
        const icon = statusBox.querySelector('.global-token-icon');
        const text = statusBox.querySelector('.global-token-text');
        const getTokenBtn = document.getElementById('global-get-token');

        if (!countdown || !icon || !text) {
            console.warn('Global token status elements not found');
            return;
        }

        // Get current token info
        const tokenInfo = this.getTokenInfo();
        
        if (tokenInfo.hasToken) {
            // Token exists
            const timeLeft = tokenInfo.timeLeft;
            const formattedTime = this.formatTime(timeLeft);
            
            // Update countdown with color coding
            countdown.textContent = formattedTime;
            if (timeLeft <= 300) { // 5 minutes or less
                countdown.style.color = 'rgb(255, 107, 107)'; // Red
                countdown.style.fontWeight = 'bold';
            } else if (timeLeft <= 900) { // 15 minutes or less
                countdown.style.color = 'rgb(255, 193, 7)'; // Orange
                countdown.style.fontWeight = 'bold';
            } else {
                countdown.style.color = 'rgb(40, 167, 69)'; // Green
                countdown.style.fontWeight = 'normal';
            }

            // Update icon and text
            if (timeLeft <= 0) {
                icon.textContent = '❌';
                text.textContent = 'Token expired';
                statusBox.className = 'global-token-status expired';
            } else if (timeLeft <= 300) {
                icon.textContent = '⚠️';
                text.textContent = 'Token expiring soon';
                statusBox.className = 'global-token-status warning';
            } else {
                icon.textContent = '✅';
                text.textContent = 'Token valid';
                statusBox.className = 'global-token-status valid';
            }

            // Show/hide Get Token button
            if (getTokenBtn) {
                getTokenBtn.style.display = timeLeft <= 0 ? 'inline-block' : 'none';
            }
        } else {
            // No token
            countdown.textContent = 'No Token';
            countdown.style.color = 'rgb(255, 107, 107)';
            countdown.style.fontWeight = 'bold';
            icon.textContent = '❌';
            text.textContent = 'No valid token';
            statusBox.className = 'global-token-status missing';
            
            // Show Get Token button
            if (getTokenBtn) {
                getTokenBtn.style.display = 'inline-block';
            }
        }
    },

    /**
     * Format time in mm:ss format
     */
    formatTime(seconds) {
        if (isNaN(seconds) || seconds < 0) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    },

    /**
     * Get current token information
     */
    getTokenInfo() {
        try {
            if (window.app && window.app.pingOneClient) {
                const token = window.app.pingOneClient.getAccessToken();
                if (token && token.expiresAt) {
                    const now = Math.floor(Date.now() / 1000);
                    const timeLeft = Math.max(0, token.expiresAt - now);
                    return {
                        hasToken: true,
                        timeLeft: timeLeft,
                        expiresAt: token.expiresAt
                    };
                }
            }
            return { hasToken: false, timeLeft: 0 };
        } catch (error) {
            console.error('Error getting token info:', error);
            return { hasToken: false, timeLeft: 0 };
        }
    },

    /**
     * Initialize the global token status
     */
    initGlobalTokenStatus() {
        // Create the status window
        this.createGlobalTokenStatus();
        
        // Set up event listeners
        this.setupGlobalTokenEventListeners();
        
        // Start the update timer
        this.startGlobalTokenTimer();
        
        // Initial update
        this.updateGlobalTokenStatus();
    },

    /**
     * Set up event listeners for global token buttons
     */
    setupGlobalTokenEventListeners() {
        // Refresh button
        const refreshBtn = document.getElementById('global-refresh-token');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.updateGlobalTokenStatus();
            });
        }

        // Get Token button
        const getTokenBtn = document.getElementById('global-get-token');
        if (getTokenBtn) {
            getTokenBtn.addEventListener('click', () => {
                this.getNewToken();
            });
        }
    },

    /**
     * Start the timer to update token status every second
     */
    startGlobalTokenTimer() {
        if (this.globalTokenTimer) {
            clearInterval(this.globalTokenTimer);
        }
        
        this.globalTokenTimer = setInterval(() => {
            this.updateGlobalTokenStatus();
        }, 1000);
    },

    /**
     * Get new token
     */
    async getNewToken() {
        try {
            console.log('Getting new token via global token manager...');
            
            // Trigger token refresh through the main app's getToken method
            if (window.app && typeof window.app.getToken === 'function') {
                await window.app.getToken();
                this.updateGlobalTokenStatus();
                console.log('Token refreshed successfully');
            } else {
                console.warn('App getToken method not available');
            }
        } catch (error) {
            console.error('Error getting new token:', error);
        }
    },

    /**
     * Update status (called from external modules)
     */
    updateStatus() {
        this.updateGlobalTokenStatus();
    }
};

// Export the module
export default GlobalTokenManager; 