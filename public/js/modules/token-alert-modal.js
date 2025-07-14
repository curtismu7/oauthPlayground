// Token Alert Modal - blocks interaction and guides user to settings if no valid token is available
class TokenAlertModal {
    constructor({ tokenStatus = '', expiry = '' } = {}) {
        if (TokenAlertModal.hasShownThisSession()) return;
        TokenAlertModal.setShownThisSession();
        this.createModal(tokenStatus, expiry);
        this.showModal();
    }

    createModal(tokenStatus, expiry) {
        // Overlay
        const overlay = document.createElement('div');
        overlay.className = 'disclaimer-modal-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-labelledby', 'token-alert-title');
        overlay.setAttribute('aria-describedby', 'token-alert-content');

        // Modal content
        overlay.innerHTML = `
            <div class="disclaimer-modal" tabindex="-1">
                <div class="disclaimer-modal-header">
                    <h2 id="token-alert-title">
                        <span class="warning-icon" aria-hidden="true">&#9888;&#65039;</span>
                        <span>Credentials Required</span>
                    </h2>
                </div>
                <div class="disclaimer-modal-body">
                    <div id="token-alert-content" class="disclaimer-content">
                        <h3>🚫 No Valid Token Found</h3>
                        <p><strong>No valid token found. You must add credentials before continuing.</strong></p>
                        ${tokenStatus || expiry ? `<div class="token-status-info">
                            <p><strong>Token status:</strong> ${tokenStatus ? tokenStatus : 'Unavailable'}</p>
                            ${expiry ? `<p><strong>Token expired:</strong> ${expiry}</p>` : ''}
                        </div>` : ''}
                        <p>To restore functionality, please go to the Settings page and add your PingOne credentials, then generate a new token.</p>
                    </div>
                </div>
                <div class="disclaimer-modal-footer">
                    <div class="disclaimer-actions">
                        <button type="button" class="disclaimer-btn disclaimer-btn-primary" id="token-alert-settings-btn">
                            Go to Settings
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        this.overlay = overlay;
        this.modal = overlay.querySelector('.disclaimer-modal');
        this.settingsBtn = overlay.querySelector('#token-alert-settings-btn');
        this.bindEvents();
    }

    bindEvents() {
        this.settingsBtn.addEventListener('click', () => {
            this.hideModal();
            window.location.href = '/settings';
        });
        // Trap focus
        this.overlay.addEventListener('keydown', (e) => this.handleKeyboardNavigation(e));
        // Prevent closing by outside click or escape
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                e.preventDefault();
            }
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
            }
        });
    }

    handleKeyboardNavigation(e) {
        const focusable = this.modal.querySelectorAll('button');
        if (e.key === 'Tab') {
            if (focusable.length === 0) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey) {
                if (document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                }
            } else {
                if (document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        }
    }

    showModal() {
        document.body.classList.add('disclaimer-modal-open');
        this.overlay.classList.add('active');
        this.modal.focus();
    }

    hideModal() {
        this.overlay.classList.remove('active');
        document.body.classList.remove('disclaimer-modal-open');
        setTimeout(() => {
            if (this.overlay && this.overlay.parentNode) {
                this.overlay.parentNode.removeChild(this.overlay);
            }
        }, 300);
    }

    static hasShownThisSession() {
        return sessionStorage.getItem('tokenAlertModalShown') === 'true';
    }
    static setShownThisSession() {
        sessionStorage.setItem('tokenAlertModalShown', 'true');
    }
}

// Export a function to show the modal
export function showTokenAlertModal({ tokenStatus = '', expiry = '' } = {}) {
    new TokenAlertModal({ tokenStatus, expiry });
} 