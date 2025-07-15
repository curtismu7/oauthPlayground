/**
 * Token Status Indicator Module
 * 
 * Provides a visible token status indicator across all pages in the application.
 * Shows current PingOne token state with color-coded status and automatic refresh.
 */

class TokenStatusIndicator {
    constructor() {
        this.statusBar = null;
        this.statusIcon = null;
        this.statusText = null;
        this.statusTime = null;
        this.refreshButton = null;
        this.getTokenButton = null;
        this.refreshInterval = null;
        this.refreshIntervalMs = 30000; // 30 seconds
        this.warningThresholdMs = 5 * 60 * 1000; // 5 minutes
        this.isInitialized = false;
        
        this.init();
    }

    /**
     * Initialize the token status indicator
     */
    init() {
        try {
            console.log('Initializing token status indicator...');
            this.createStatusBar();
            this.bindEvents();
            this.startRefreshTimer();
            this.updateStatus();
            this.isInitialized = true;
            
            console.log('✅ Token status indicator initialized successfully');
            console.log('Token status indicator element:', this.statusBar);
            console.log('Refresh button:', this.refreshButton);
            console.log('Get token button:', this.getTokenButton);
        } catch (error) {
            console.error('❌ Error initializing token status indicator:', error);
        }
    }

    /**
     * Create the status bar HTML structure
     */
    createStatusBar() {
        console.log('Creating status bar...');
        // Check if status bar already exists
        if (document.getElementById('token-status-indicator')) {
            console.log('Token status indicator already exists, using existing element');
            this.statusBar = document.getElementById('token-status-indicator');
            this.statusIcon = this.statusBar.querySelector('.token-status-icon');
            this.statusText = this.statusBar.querySelector('.token-status-text');
            this.statusTime = this.statusBar.querySelector('.token-status-time');
            this.refreshButton = this.statusBar.querySelector('#refresh-token-status');
            this.getTokenButton = this.statusBar.querySelector('#get-token-quick');
            console.log('Found existing elements:', {
                statusBar: !!this.statusBar,
                statusIcon: !!this.statusIcon,
                statusText: !!this.statusText,
                statusTime: !!this.statusTime,
                refreshButton: !!this.refreshButton,
                getTokenButton: !!this.getTokenButton
            });
            return;
        }

        // Create status bar
        this.statusBar = document.createElement('div');
        this.statusBar.id = 'token-status-indicator';
        this.statusBar.className = 'token-status-indicator';
        this.statusBar.setAttribute('role', 'status');
        this.statusBar.setAttribute('aria-live', 'polite');

        this.statusBar.innerHTML = `
            <div class="token-status-content">
                <span class="token-status-icon" aria-hidden="true">⏳</span>
                <span class="token-status-text">Checking token status...</span>
                <span class="token-status-time"></span>
            </div>
            <div class="token-status-actions">
                <button id="refresh-token-status" class="btn btn-sm btn-outline-secondary" title="Refresh token status">
                    <i class="fas fa-sync-alt"></i>
                </button>
                <button id="get-token-quick" class="btn btn-sm btn-success" title="Get new token" style="display: none;">
                    <i class="fas fa-key"></i> Get Token
                </button>
            </div>
        `;

        // Get references to elements
        this.statusIcon = this.statusBar.querySelector('.token-status-icon');
        this.statusText = this.statusBar.querySelector('.token-status-text');
        this.statusTime = this.statusBar.querySelector('.token-status-time');
        this.refreshButton = this.statusBar.querySelector('#refresh-token-status');
        this.getTokenButton = this.statusBar.querySelector('#get-token-quick');

        // Add to page
        this.insertStatusBar();
    }

    /**
     * Insert status bar into the page
     */
    insertStatusBar() {
        // Try to find the sidebar first
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            // Insert at the end of the sidebar, after the nav-links
            const navLinks = sidebar.querySelector('.nav-links');
            if (navLinks) {
                // Insert after nav-links
                sidebar.appendChild(this.statusBar);
                return;
            }
        }

        // Fallback: Try to find a good location for the status bar
        const locations = [
            () => document.querySelector('.main-content'),
            () => document.querySelector('#app'),
            () => document.body
        ];

        for (const getLocation of locations) {
            const location = getLocation();
            if (location) {
                // Insert at the beginning of the main content
                location.insertBefore(this.statusBar, location.firstChild);
                return;
            }
        }

        // Fallback to body
        document.body.appendChild(this.statusBar);
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        if (this.refreshButton) {
            this.refreshButton.addEventListener('click', () => {
                this.refreshStatus();
            });
        }

        if (this.getTokenButton) {
            this.getTokenButton.addEventListener('click', () => {
                this.getNewToken();
            });
        }

        // Listen for token updates from other parts of the app
        window.addEventListener('token-updated', () => {
            this.updateStatus();
        });

        // Listen for page visibility changes to refresh when tab becomes visible
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.updateStatus();
            }
        });
    }

    /**
     * Start the automatic refresh timer
     */
    startRefreshTimer() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }

        this.refreshInterval = setInterval(() => {
            this.updateStatus();
        }, this.refreshIntervalMs);

        console.log(`Token status auto-refresh started (${this.refreshIntervalMs / 1000}s interval)`);
    }

    /**
     * Stop the automatic refresh timer
     */
    stopRefreshTimer() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
            console.log('Token status auto-refresh stopped');
        }
    }

    /**
     * Get current token information
     */
    async getTokenInfo() {
        try {
            // Check localStorage first
            const token = localStorage.getItem('pingone_worker_token');
            const expiry = localStorage.getItem('pingone_token_expiry');

            if (!token || !expiry) {
                return {
                    status: 'missing',
                    message: 'No token available',
                    timeRemaining: null,
                    isExpired: true,
                    isExpiring: false
                };
            }

            const expiryTime = parseInt(expiry, 10);
            const now = Date.now();
            const timeRemaining = expiryTime - now;

            if (timeRemaining <= 0) {
                return {
                    status: 'expired',
                    message: 'Token expired',
                    timeRemaining: 0,
                    isExpired: true,
                    isExpiring: false
                };
            }

            const isExpiring = timeRemaining <= this.warningThresholdMs;
            const status = isExpiring ? 'expiring' : 'valid';
            const message = isExpiring ? 'Token expires soon' : 'Token valid';

            return {
                status,
                message,
                timeRemaining,
                isExpired: false,
                isExpiring
            };
        } catch (error) {
            console.error('Error getting token info:', error);
            return {
                status: 'error',
                message: 'Error retrieving token',
                timeRemaining: null,
                isExpired: true,
                isExpiring: false
            };
        }
    }

    /**
     * Format time remaining
     */
    formatTimeRemaining(ms) {
        if (!ms || ms <= 0) return '0m 0s';

        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);

        if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        } else {
            return `${seconds}s`;
        }
    }

    /**
     * Update the status display
     */
    async updateStatus() {
        try {
            this.setLoadingState();

            const tokenInfo = await this.getTokenInfo();
            this.updateDisplay(tokenInfo);

            console.log('Token status updated:', tokenInfo);
        } catch (error) {
            console.error('Error updating token status:', error);
            this.setErrorState();
        }
    }

    /**
     * Set loading state
     */
    setLoadingState() {
        if (!this.statusBar) return;

        this.statusBar.className = 'token-status-indicator loading';
        this.statusIcon.textContent = '⏳';
        this.statusText.textContent = 'Checking token status...';
        this.statusTime.textContent = '';
        this.getTokenButton.style.display = 'none';
    }

    /**
     * Set error state
     */
    setErrorState() {
        if (!this.statusBar) return;

        this.statusBar.className = 'token-status-indicator error';
        this.statusIcon.textContent = '❌';
        this.statusText.textContent = 'Error retrieving token';
        this.statusTime.textContent = '';
        this.getTokenButton.style.display = 'inline-block';
    }

    /**
     * Update display based on token status
     */
    updateDisplay(tokenInfo) {
        if (!this.statusBar) return;

        const { status, message, timeRemaining, isExpired, isExpiring } = tokenInfo;

        // Update classes
        this.statusBar.className = `token-status-indicator ${status}`;

        // Update icon and text
        switch (status) {
            case 'valid':
                this.statusIcon.textContent = '🟢';
                this.statusText.textContent = message;
                this.statusTime.textContent = `(${this.formatTimeRemaining(timeRemaining)})`;
                this.getTokenButton.style.display = 'none';
                break;

            case 'expiring':
                this.statusIcon.textContent = '🟡';
                this.statusText.textContent = message;
                this.statusText.style.color = '#000'; // Force black text
                this.statusTime.textContent = `(${this.formatTimeRemaining(timeRemaining)})`;
                this.getTokenButton.style.display = 'inline-block';
                break;

            case 'expired':
                this.statusIcon.textContent = '🔴';
                this.statusText.textContent = message;
                this.statusTime.textContent = '';
                this.getTokenButton.style.display = 'inline-block';
                break;

            case 'missing':
                this.statusIcon.textContent = '⚪';
                this.statusText.textContent = message;
                this.statusTime.textContent = '';
                this.getTokenButton.style.display = 'inline-block';
                break;

            case 'error':
                this.statusIcon.textContent = '❌';
                this.statusText.textContent = message;
                this.statusTime.textContent = '';
                this.getTokenButton.style.display = 'inline-block';
                break;

            default:
                this.statusIcon.textContent = '⏳';
                this.statusText.textContent = 'Checking token status...';
                this.statusTime.textContent = '';
                this.getTokenButton.style.display = 'none';
        }
    }

    /**
     * Refresh token status
     */
    async refreshStatus() {
        console.log('Manually refreshing token status...');
        await this.updateStatus();
    }

    /**
     * Get new token
     */
    async getNewToken() {
        try {
            console.log('Requesting new token...');
            
            const response = await fetch('/api/pingone/get-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to get token: ${response.status}`);
            }

            const data = await response.json();
            
            // Store token in localStorage
            const expiryTime = Date.now() + (data.expires_in * 1000);
            localStorage.setItem('pingone_worker_token', data.access_token);
            localStorage.setItem('pingone_token_expiry', expiryTime.toString());

            // Update status
            await this.updateStatus();

            // Dispatch event for other components
            window.dispatchEvent(new CustomEvent('token-updated', {
                detail: { token: data.access_token, expiresIn: data.expires_in }
            }));

            console.log('New token obtained successfully');
        } catch (error) {
            console.error('Error getting new token:', error);
            this.setErrorState();
        }
    }

    /**
     * Show the status indicator
     */
    show() {
        if (this.statusBar) {
            this.statusBar.style.display = 'block';
        }
    }

    /**
     * Hide the status indicator
     */
    hide() {
        if (this.statusBar) {
            this.statusBar.style.display = 'none';
        }
    }

    /**
     * Destroy the indicator
     */
    destroy() {
        this.stopRefreshTimer();
        
        if (this.statusBar && this.statusBar.parentNode) {
            this.statusBar.parentNode.removeChild(this.statusBar);
        }
        
        this.isInitialized = false;
    }

    /**
     * Get current status
     */
    getCurrentStatus() {
        return this.getTokenInfo();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TokenStatusIndicator;
} else {
    // Browser environment
    window.TokenStatusIndicator = TokenStatusIndicator;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.tokenStatusIndicator = new TokenStatusIndicator();
    });
} else {
    window.tokenStatusIndicator = new TokenStatusIndicator();
} 