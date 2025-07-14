/**
 * Credentials Modal Module
 * Shows current PingOne credentials and asks user if they want to use them or configure new ones
 */
class CredentialsModal {
    constructor() {
        this.isActive = false;
        this.focusableElements = [];
        this.firstFocusableElement = null;
        this.lastFocusableElement = null;
        this.previousActiveElement = null;
        this.credentials = null;
        
        this.init();
    }

    async init() {
        await this.loadCredentials();
        this.createModal();
        this.bindEvents();
        this.showModal();
    }

    async loadCredentials() {
        try {
            const response = await fetch('/api/settings');
            if (response.ok) {
                const data = await response.json();
                this.credentials = {
                    environmentId: data.settings['environment-id'] || data.settings.environmentId,
                    clientId: data.settings['api-client-id'] || data.settings.apiClientId,
                    region: data.settings.region || 'NorthAmerica'
                };
            } else {
                console.warn('Failed to load credentials from settings');
                this.credentials = null;
            }
        } catch (error) {
            console.error('Error loading credentials:', error);
            this.credentials = null;
        }
    }

    createModal() {
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.className = 'credentials-modal-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-labelledby', 'credentials-title');
        overlay.setAttribute('aria-describedby', 'credentials-content');

        const hasCredentials = this.credentials && this.credentials.environmentId && this.credentials.clientId;
        
        // Create modal content
        overlay.innerHTML = `
            <div class="credentials-modal" tabindex="-1">
                <div class="credentials-modal-header">
                    <h2 id="credentials-title">
                        <span class="credentials-icon" aria-hidden="true">🔐</span>
                        <span>PingOne Credentials</span>
                    </h2>
                </div>
                
                <div class="credentials-modal-body">
                    <div id="credentials-content" class="credentials-content">
                        ${hasCredentials ? this.createCredentialsContent() : this.createNoCredentialsContent()}
                    </div>
                </div>
                
                <div class="credentials-modal-footer">
                    <div class="credentials-actions">
                        ${hasCredentials ? this.createCredentialsActions() : this.createNoCredentialsActions()}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        this.overlay = overlay;
        this.modal = overlay.querySelector('.credentials-modal');
        this.useCredentialsBtn = overlay.querySelector('#use-credentials-btn');
        this.configureBtn = overlay.querySelector('#configure-credentials-btn');
        this.skipBtn = overlay.querySelector('#skip-credentials-btn');
    }

    createCredentialsContent() {
        return `
            <h3>📋 Current Credentials Found</h3>
            <p>We found the following PingOne credentials in your settings:</p>
            
            <div class="credentials-display">
                <div class="credential-item">
                    <label>Environment ID:</label>
                    <div class="credential-value">
                        <code>${this.maskCredential(this.credentials.environmentId)}</code>
                        <button class="btn btn-sm btn-outline-secondary copy-btn" data-value="${this.credentials.environmentId}" title="Copy to clipboard">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                </div>
                
                <div class="credential-item">
                    <label>Client ID:</label>
                    <div class="credential-value">
                        <code>${this.maskCredential(this.credentials.clientId)}</code>
                        <button class="btn btn-sm btn-outline-secondary copy-btn" data-value="${this.credentials.clientId}" title="Copy to clipboard">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                </div>
                
                <div class="credential-item">
                    <label>Region:</label>
                    <div class="credential-value">
                        <code>${this.credentials.region}</code>
                    </div>
                </div>
            </div>
            
            <div class="credentials-warning">
                <h4>⚠️ Important Notes:</h4>
                <ul>
                    <li>These credentials will be used to authenticate with PingOne APIs</li>
                    <li>Make sure these are the correct credentials for your environment</li>
                    <li>You can change these credentials later in the Settings page</li>
                    <li>Credentials are stored locally and not shared with Ping Identity</li>
                </ul>
            </div>
        `;
    }

    createNoCredentialsContent() {
        return `
            <h3>🔧 No Credentials Found</h3>
            <p>No PingOne credentials were found in your settings. You'll need to configure them to use this tool.</p>
            
            <div class="credentials-info">
                <h4>📋 Required Information:</h4>
                <ul>
                    <li><strong>Environment ID:</strong> Your PingOne environment identifier</li>
                    <li><strong>Client ID:</strong> Your PingOne API client identifier</li>
                    <li><strong>Client Secret:</strong> Your PingOne API client secret</li>
                    <li><strong>Region:</strong> Your PingOne environment region</li>
                </ul>
            </div>
            
            <div class="credentials-help">
                <h4>💡 How to Get Credentials:</h4>
                <ol>
                    <li>Log into your PingOne Admin Console</li>
                    <li>Navigate to Applications → Applications</li>
                    <li>Create a new application or use an existing one</li>
                    <li>Copy the Environment ID, Client ID, and Client Secret</li>
                    <li>Configure them in the Settings page</li>
                </ol>
            </div>
        `;
    }

    createCredentialsActions() {
        return `
            <button type="button" class="credentials-btn credentials-btn-secondary" id="configure-credentials-btn">
                <i class="fas fa-cog"></i>
                Configure Different Credentials
            </button>
            <button type="button" class="credentials-btn credentials-btn-primary" id="use-credentials-btn">
                <i class="fas fa-check"></i>
                Use These Credentials
            </button>
        `;
    }

    createNoCredentialsActions() {
        return `
            <button type="button" class="credentials-btn credentials-btn-primary" id="configure-credentials-btn">
                <i class="fas fa-cog"></i>
                Go to Settings
            </button>
            <button type="button" class="credentials-btn credentials-btn-secondary" id="skip-credentials-btn">
                <i class="fas fa-times"></i>
                Skip for Now
            </button>
        `;
    }

    maskCredential(value) {
        if (!value) return 'Not set';
        if (value.length <= 8) return value;
        return value.substring(0, 8) + '...' + value.substring(value.length - 4);
    }

    bindEvents() {
        // Use credentials button
        if (this.useCredentialsBtn) {
            this.useCredentialsBtn.addEventListener('click', () => {
                this.useCurrentCredentials();
            });
        }

        // Configure credentials button
        if (this.configureBtn) {
            this.configureBtn.addEventListener('click', () => {
                this.goToSettings();
            });
        }

        // Skip button
        if (this.skipBtn) {
            this.skipBtn.addEventListener('click', () => {
                this.skipCredentials();
            });
        }

        // Copy buttons
        this.modal.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const value = e.target.closest('.copy-btn').dataset.value;
                this.copyToClipboard(value, e.target.closest('.copy-btn'));
            });
        });

        // Keyboard events for accessibility
        this.overlay.addEventListener('keydown', (e) => {
            this.handleKeyboardNavigation(e);
        });

        // Prevent clicks outside modal from closing it
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                // Don't close on outside click - require explicit action
                this.logEvent('credentials_outside_click_prevented');
            }
        });

        // Escape key handling
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isActive) {
                e.preventDefault();
                this.skipCredentials();
            }
        });
    }

    handleKeyboardNavigation(e) {
        if (!this.isActive) return;

        const focusableElements = this.getFocusableElements();
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        // Tab key navigation with focus trapping
        if (e.key === 'Tab') {
            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        }
    }

    getFocusableElements() {
        const focusableSelectors = [
            'button:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            'a[href]',
            '[tabindex]:not([tabindex="-1"])'
        ];

        return Array.from(this.modal.querySelectorAll(focusableSelectors.join(', ')));
    }

    showModal() {
        this.isActive = true;
        this.previousActiveElement = document.activeElement;
        
        // Add classes to body and app container
        document.body.classList.add('credentials-modal-open');
        const appContainer = document.querySelector('.app-container');
        if (appContainer) {
            appContainer.classList.add('credentials-modal-active');
        }

        // Show modal with animation
        this.overlay.classList.add('active');
        
        // Focus management
        this.modal.focus();
        this.setupFocusTrap();
        
        this.logEvent('credentials_modal_shown');
        
        // Announce to screen readers
        this.announceToScreenReader('Credentials configuration modal opened. Please review your PingOne credentials and choose an action.');
    }

    setupFocusTrap() {
        this.focusableElements = this.getFocusableElements();
        this.firstFocusableElement = this.focusableElements[0];
        this.lastFocusableElement = this.focusableElements[this.focusableElements.length - 1];
    }

    useCurrentCredentials() {
        this.logEvent('credentials_used', { 
            hasCredentials: !!this.credentials,
            environmentId: this.credentials?.environmentId ? 'set' : 'not_set',
            clientId: this.credentials?.clientId ? 'set' : 'not_set'
        });
        
        this.hideModal();
        this.enableApplication();
        
        // Show success message
        this.showSuccessMessage('Using current credentials. You can change them anytime in Settings.');
    }

    goToSettings() {
        this.logEvent('credentials_configure_clicked');
        
        this.hideModal();
        this.enableApplication();
        
        // Navigate to settings
        setTimeout(() => {
            const settingsNav = document.querySelector('[data-view="settings"]');
            if (settingsNav) {
                settingsNav.click();
            }
        }, 100);
    }

    skipCredentials() {
        this.logEvent('credentials_skipped');
        
        this.hideModal();
        this.enableApplication();
        
        // Show info message
        this.showInfoMessage('You can configure credentials later in the Settings page.');
    }

    hideModal() {
        this.isActive = false;
        
        // Remove classes
        document.body.classList.remove('credentials-modal-open');
        const appContainer = document.querySelector('.app-container');
        if (appContainer) {
            appContainer.classList.remove('credentials-modal-active');
        }

        // Hide modal with animation
        this.overlay.classList.remove('active');
        
        // Restore focus
        if (this.previousActiveElement) {
            this.previousActiveElement.focus();
        }
        
        // Clean up
        setTimeout(() => {
            if (this.overlay && this.overlay.parentNode) {
                this.overlay.parentNode.removeChild(this.overlay);
            }
        }, 300);
        
        this.logEvent('credentials_modal_hidden');
    }

    enableApplication() {
        // Enable the application
        const appContainer = document.querySelector('.app-container');
        if (appContainer) {
            appContainer.classList.remove('credentials-modal-active');
        }
        
        this.logEvent('application_enabled_after_credentials');
    }

    copyToClipboard(text, button) {
        navigator.clipboard.writeText(text).then(() => {
            // Show success feedback
            const originalIcon = button.innerHTML;
            button.innerHTML = '<i class="fas fa-check"></i>';
            button.classList.add('copied');
            
            setTimeout(() => {
                button.innerHTML = originalIcon;
                button.classList.remove('copied');
            }, 2000);
            
            this.logEvent('credential_copied');
        }).catch(err => {
            console.error('Failed to copy to clipboard:', err);
            this.logEvent('credential_copy_failed', { error: err.message });
        });
    }

    showSuccessMessage(message) {
        // Create and show a success notification
        const notification = document.createElement('div');
        notification.className = 'notification notification-success';
        notification.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        `;
        
        const notificationArea = document.getElementById('notification-area');
        if (notificationArea) {
            notificationArea.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, 5000);
        }
    }

    showInfoMessage(message) {
        // Create and show an info notification
        const notification = document.createElement('div');
        notification.className = 'notification notification-info';
        notification.innerHTML = `
            <i class="fas fa-info-circle"></i>
            <span>${message}</span>
        `;
        
        const notificationArea = document.getElementById('notification-area');
        if (notificationArea) {
            notificationArea.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, 5000);
        }
    }

    announceToScreenReader(message) {
        // Create a temporary element for screen reader announcements
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.style.position = 'absolute';
        announcement.style.left = '-10000px';
        announcement.style.width = '1px';
        announcement.style.height = '1px';
        announcement.style.overflow = 'hidden';
        
        announcement.textContent = message;
        document.body.appendChild(announcement);
        
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }

    logEvent(eventName, data = {}) {
        const eventData = {
            event: eventName,
            timestamp: new Date().toISOString(),
            hasCredentials: !!this.credentials,
            environmentId: this.credentials?.environmentId ? 'set' : 'not_set',
            clientId: this.credentials?.clientId ? 'set' : 'not_set',
            ...data
        };
        
        console.log('Credentials Modal Event:', eventData);
        
        // You can also send this to your logging system
        // fetch('/api/logs', { method: 'POST', body: JSON.stringify(eventData) });
    }

    // Static method to check if credentials modal should be shown
    static shouldShowCredentialsModal() {
        // Show credentials modal if disclaimer is accepted and credentials modal hasn't been shown
        return DisclaimerModal.isDisclaimerAccepted() && 
               !localStorage.getItem('credentialsModalShown');
    }

    // Static method to mark credentials modal as shown
    static setCredentialsModalShown() {
        localStorage.setItem('credentialsModalShown', 'true');
    }

    // Static method to reset credentials modal state
    static resetCredentialsModal() {
        localStorage.removeItem('credentialsModalShown');
    }
}

// Initialize credentials modal when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Credentials Modal: DOMContentLoaded event fired');
    console.log('Disclaimer accepted:', DisclaimerModal.isDisclaimerAccepted());
    console.log('Credentials modal shown:', localStorage.getItem('credentialsModalShown'));
    console.log('Should show credentials modal:', CredentialsModal.shouldShowCredentialsModal());
    
    // Check if disclaimer is already accepted (user returning)
    if (DisclaimerModal.isDisclaimerAccepted() && CredentialsModal.shouldShowCredentialsModal()) {
        console.log('Credentials Modal: Showing modal for returning user');
        // Small delay to ensure disclaimer modal is fully closed
        setTimeout(() => {
            new CredentialsModal();
            CredentialsModal.setCredentialsModalShown();
        }, 1000);
    }
});

// Listen for disclaimer completion events
document.addEventListener('disclaimerAccepted', (event) => {
    console.log('Credentials Modal: Disclaimer accepted event received', event.detail);
    // Wait a bit longer for disclaimer modal to fully close
    setTimeout(() => {
        console.log('Credentials Modal: Checking if should show after disclaimer');
        console.log('Should show credentials modal:', CredentialsModal.shouldShowCredentialsModal());
        if (CredentialsModal.shouldShowCredentialsModal()) {
            console.log('Credentials Modal: Creating modal after disclaimer acceptance');
            new CredentialsModal();
            CredentialsModal.setCredentialsModalShown();
        }
    }, 1500);
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CredentialsModal;
} 