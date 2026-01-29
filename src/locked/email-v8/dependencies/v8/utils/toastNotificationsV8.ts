/**
 * @file toastNotificationsV8.ts
 * @module v8/utils
 * @description V8 Toast Notification Wrapper
 * @version 8.0.0
 * @since 2024-11-16
 *
 * Provides V8-specific toast notification utilities using the V4 toast manager.
 * All V8 code should use these methods for consistent user feedback.
 *
 * @example
 * import { toastV8 } from './toastNotificationsV8.ts';
 *
 * // Success notification
 * toastV8.success('Credentials saved successfully');
 *
 * // Error notification
 * toastV8.error('Failed to generate authorization URL');
 *
 * // Warning notification
 * toastV8.warning('Please fill in all required fields');
 *
 * // Info notification
 * toastV8.info('Authorization URL copied to clipboard');
 */

import { v4ToastManager } from '../../utils/v4ToastMessages.ts';

/**
 * V8 Toast Notification Service
 * Wrapper around v4ToastManager for consistent V8 messaging
 */
export class ToastNotificationsV8 {
	private static readonly MODULE_TAG = '[🔔 TOAST-V8]';

	/**
	 * Show success notification
	 * @param message - Success message to display
	 * @param options - Optional configuration
	 * @example
	 * toastV8.success('Configuration saved successfully');
	 */
	static success(message: string, options?: { duration?: number }): void {
		console.log(`${ToastNotificationsV8.MODULE_TAG} Success:`, message);
		v4ToastManager.showSuccess(message, {}, options);
	}

	/**
	 * Extract a short summary from a long error message for toast display
	 * @param message - Full error message
	 * @returns Short summary suitable for toast
	 */
	private static extractShortSummary(message: string): string {
		// If message is short (under 150 chars), use as-is
		if (message.length <= 150) {
			return message;
		}

		// Try to extract the first meaningful line (before first \n\n)
		const firstParagraph = message.split(/\n\n/)[0];
		if (firstParagraph && firstParagraph.length <= 150) {
			return firstParagraph;
		}

		// Try to extract just the error title (before first colon or period)
		const titleMatch = message.match(/^([^:.]{1,100})/);
		if (titleMatch) {
			return titleMatch[1];
		}

		// Fallback: truncate to 120 chars with ellipsis
		return `${message.substring(0, 120)}...`;
	}

	/**
	 * Show error notification
	 * @param message - Error message to display (will be truncated if too long)
	 * @param options - Optional configuration
	 * @example
	 * toastV8.error('Failed to validate credentials');
	 */
	static error(message: string, _options?: { duration?: number }): void {
		console.log(`${ToastNotificationsV8.MODULE_TAG} Error:`, message);
		const shortMessage = ToastNotificationsV8.extractShortSummary(message);
		v4ToastManager.showError(shortMessage);
	}

	/**
	 * Show warning notification
	 * @param message - Warning message to display
	 * @param options - Optional configuration
	 * @example
	 * toastV8.warning('Please fill in all required fields');
	 */
	static warning(message: string, _options?: { duration?: number }): void {
		console.log(`${ToastNotificationsV8.MODULE_TAG} Warning:`, message);
		v4ToastManager.showWarning(message);
	}

	/**
	 * Show info notification
	 * @param message - Info message to display
	 * @param options - Optional configuration
	 * @example
	 * toastV8.info('Authorization URL copied to clipboard');
	 */
	static info(message: string, _options?: { duration?: number }): void {
		console.log(`${ToastNotificationsV8.MODULE_TAG} Info:`, message);
		v4ToastManager.showInfo(message);
	}

	/**
	 * Show copy success notification
	 * @param itemName - Name of item copied
	 * @example
	 * toastV8.copiedToClipboard('Authorization URL');
	 */
	static copiedToClipboard(itemName: string): void {
		ToastNotificationsV8.success(`${itemName} copied to clipboard`);
	}

	/**
	 * Show validation error notification
	 * @param fields - Array of field names that failed validation
	 * @example
	 * toastV8.validationError(['Client ID', 'Redirect URI']);
	 */
	static validationError(fields: string[]): void {
		const fieldList = fields.join(', ');
		ToastNotificationsV8.error(`Please fill in required fields: ${fieldList}`);
	}

	/**
	 * Show network error notification
	 * @param operation - Name of operation that failed
	 * @example
	 * toastV8.networkError('token exchange');
	 */
	static networkError(operation: string): void {
		ToastNotificationsV8.error(`Network error during ${operation}. Please check your connection.`);
	}

	/**
	 * Show step completion notification
	 * @param stepNumber - Step number completed
	 * @example
	 * toastV8.stepCompleted(1);
	 */
	static stepCompleted(stepNumber: number): void {
		ToastNotificationsV8.success(`Step ${stepNumber} completed`);
	}

	/**
	 * Show flow completion notification
	 * @example
	 * toastV8.flowCompleted();
	 */
	static flowCompleted(): void {
		ToastNotificationsV8.success('🎉 OAuth Flow Complete!', { duration: 8000 });
	}

	/**
	 * Show loading/processing notification
	 * @param operation - Name of operation in progress
	 * @example
	 * toastV8.processing('Exchanging authorization code for tokens');
	 */
	static processing(operation: string): void {
		ToastNotificationsV8.info(`${operation}...`);
	}

	/**
	 * Show credentials saved notification
	 * @example
	 * toastV8.credentialsSaved();
	 */
	static credentialsSaved(): void {
		ToastNotificationsV8.success('Credentials saved successfully');
	}

	/**
	 * Show credentials loaded notification
	 * @example
	 * toastV8.credentialsLoaded();
	 */
	static credentialsLoaded(): void {
		ToastNotificationsV8.success('Credentials loaded successfully');
	}

	/**
	 * Show PKCE generated notification
	 * @example
	 * toastV8.pkceGenerated();
	 */
	static pkceGenerated(): void {
		ToastNotificationsV8.success('PKCE parameters generated successfully');
	}

	/**
	 * Show authorization URL generated notification
	 * @example
	 * toastV8.authUrlGenerated();
	 */
	static authUrlGenerated(): void {
		ToastNotificationsV8.success('Authorization URL generated successfully');
	}

	/**
	 * Show token exchange success notification
	 * @example
	 * toastV8.tokenExchangeSuccess();
	 */
	static tokenExchangeSuccess(): void {
		ToastNotificationsV8.success('Tokens exchanged successfully');
	}

	/**
	 * Show token introspection success notification
	 * @example
	 * toastV8.tokenIntrospectionSuccess();
	 */
	static tokenIntrospectionSuccess(): void {
		ToastNotificationsV8.success('Token introspection completed successfully');
	}

	/**
	 * Show user info fetched notification
	 * @example
	 * toastV8.userInfoFetched();
	 */
	static userInfoFetched(): void {
		ToastNotificationsV8.success('User information retrieved successfully');
	}

	/**
	 * Show app discovery success notification
	 * @example
	 * toastV8.appDiscoverySuccess();
	 */
	static appDiscoverySuccess(): void {
		ToastNotificationsV8.success('Application discovered successfully');
	}

	/**
	 * Show configuration checked notification
	 * @example
	 * toastV8.configurationChecked();
	 */
	static configurationChecked(): void {
		ToastNotificationsV8.success('Configuration check completed');
	}

	/**
	 * Show flow reset notification
	 * @example
	 * toastV8.flowReset();
	 */
	static flowReset(): void {
		ToastNotificationsV8.success('Flow reset. Tokens cleared, credentials preserved.');
	}

	/**
	 * Show scope required warning
	 * @param scope - Scope name that was added
	 * @example
	 * toastV8.scopeRequired('openid');
	 */
	static scopeRequired(scope: string): void {
		ToastNotificationsV8.warning(`Added required "${scope}" scope for compliance`);
	}

	/**
	 * Show discovery endpoint notification
	 * @example
	 * toastV8.discoveryEndpointLoaded();
	 */
	static discoveryEndpointLoaded(): void {
		ToastNotificationsV8.success('Discovery endpoint loaded successfully');
	}

	/**
	 * Show environment ID extracted notification
	 * @example
	 * toastV8.environmentIdExtracted();
	 */
	static environmentIdExtracted(): void {
		ToastNotificationsV8.success('Environment ID extracted from discovery');
	}
}

// Export singleton instance
export const toastV8 = ToastNotificationsV8;
