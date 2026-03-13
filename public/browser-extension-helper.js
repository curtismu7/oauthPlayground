/**
 * Browser Extension Helper Script
 * Helps identify and handle browser extension conflicts
 */

(function() {
    'use strict';

    // Detect common problematic extensions
    const problematicExtensions = [
        'bootstrap-autofill-overlay',
        'lastpass',
        '1password',
        'bitwarden',
        'dashlane',
        'autofill',
        'password-manager'
    ];

    // Extension detection utility
    function detectExtensions() {
        const warnings = [];
        
        // Check for known extension patterns in error messages
        const originalConsoleError = console.error;
        const originalConsoleWarn = console.warn;
        
        console.error = function(...args) {
            const message = args[0];
            if (typeof message === 'string') {
                problematicExtensions.forEach(ext => {
                    if (message.includes(ext)) {
                        warnings.push({
                            type: 'extension_error',
                            extension: ext,
                            message: message,
                            timestamp: new Date().toISOString()
                        });
                    }
                });
            }
            originalConsoleError.apply(console, args);
        };

        console.warn = function(...args) {
            const message = args[0];
            if (typeof message === 'string') {
                problematicExtensions.forEach(ext => {
                    if (message.includes(ext)) {
                        warnings.push({
                            type: 'extension_warning',
                            extension: ext,
                            message: message,
                            timestamp: new Date().toISOString()
                        });
                    }
                });
            }
            originalConsoleWarn.apply(console, args);
        };

        return warnings;
    }

    // Create extension helper UI
    function createExtensionHelper() {
        const helper = document.createElement('div');
        helper.id = 'browser-extension-helper';
        helper.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            padding: 12px;
            max-width: 300px;
            z-index: 999999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: none;
        `;

        helper.innerHTML = `
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <span style="font-weight: bold; color: #856404;">⚠️ Browser Extension Detected</span>
                <button onclick="this.parentElement.parentElement.style.display='none'" style="margin-left: auto; background: none; border: none; font-size: 18px; cursor: pointer;">×</button>
            </div>
            <div style="color: #856404; margin-bottom: 8px; font-size: 12px;">
                A browser extension may be interfering with this application. Consider disabling autofill or password manager extensions while using this OAuth playground.
            </div>
            <button onclick="window.open('https://github.com/your-repo/oauth-playground/wiki/Troubleshooting#browser-extensions', '_blank')" style="background: #ffc107; border: none; padding: 4px 8px; border-radius: 4px; font-size: 12px; cursor: pointer;">
                Learn More
            </button>
        `;

        return helper;
    }

    // Show helper when extension errors are detected
    function showExtensionHelper() {
        const warnings = detectExtensions();
        
        if (warnings.length > 0) {
            const helper = createExtensionHelper();
            document.body.appendChild(helper);
            
            // Show the helper
            setTimeout(() => {
                helper.style.display = 'block';
            }, 1000);

            // Auto-hide after 10 seconds
            setTimeout(() => {
                if (helper.parentElement) {
                    helper.style.display = 'none';
                }
            }, 10000);

            // Log warnings for debugging
            console.group('🔍 Browser Extension Issues Detected');
            warnings.forEach(warning => {
                console.warn(`${warning.extension}: ${warning.message}`);
            });
            console.groupEnd();

            return true;
        }

        return false;
    }

    // Initialize extension helper
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', showExtensionHelper);
    } else {
        showExtensionHelper();
    }

    // Expose helper functions globally for debugging
    window.BrowserExtensionHelper = {
        detectExtensions,
        showExtensionHelper,
        problematicExtensions
    };

})();
