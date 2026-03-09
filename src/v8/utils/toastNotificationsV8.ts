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
 * import { modernMessaging } from '@/services/v9/V9ModernMessagingService';
 *
 * // Success notification
 * modernMessaging.showFooterMessage({ type: 'info', message: 'Credentials saved successfully', duration: 3000 });
 *
 * // Error notification
 * modernMessaging.showBanner({ type: 'error', title: 'Error', message: 'Failed to generate authorization URL', dismissible: true });
 *
 * // Warning notification
 * modernMessaging.showBanner({ type: 'warning', title: 'Warning', message: 'Please fill in all required fields', dismissible: true });
 *
 * // Info notification
 * modernMessaging.showFooterMessage({ type: 'info', message: 'Authorization URL copied to clipboard', duration: 3000 });
 */

import { modernMessaging } from '@/services/v9/V9ModernMessagingService';

/**
 * V8 Toast Notification Service
 * Wrapper around modernMessaging for consistent V8 messaging
 */
export class ToastNotificationsV8 {
	private static readonly MODULE_TAG = '[🔔 TOAST-V8]';

	/**
	 * Show success notification
	 * @param message - Success message to display
	 * @param options - Optional configuration
	 * @example
	 * modernMessaging.showFooterMessage({ type: 'info', message: 'Configuration saved successfully', duration: 3000 });
	 */
	static success(message: string, options?: { duration?: number }): void {
		console.log(`${ToastNotificationsV8.MODULE_TAG} Success:`, message);
		modernMessaging.showFooterMessage({
			type: 'info',
			message,
			duration: options?.duration ?? 3000,
		});
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
	 * modernMessaging.showBanner({ type: 'error', title: 'Error', message: 'Failed to validate credentials', dismissible: true });
	 */
	static error(message: string, _options?: { duration?: number }): void {
		console.log(`${ToastNotificationsV8.MODULE_TAG} Error:`, message);
		const shortMessage = ToastNotificationsV8.extractShortSummary(message);
		modernMessaging.showBanner({
			type: 'error',
			title: 'Error',
			message: shortMessage,
			dismissible: true,
		});
	}

	/**
	 * Show warning notification
	 * @param message - Warning message to display
	 * @param options - Optional configuration
	 * @example
	 * modernMessaging.showBanner({ type: 'warning', title: 'Warning', message: 'Please fill in all required fields', dismissible: true });
	 */
	static warning(message: string, _options?: { duration?: number }): void {
		console.log(`${ToastNotificationsV8.MODULE_TAG} Warning:`, message);
		modernMessaging.showBanner({ type: 'warning', title: 'Warning', message, dismissible: true });
	}

	/**
	 * Show info notification
	 * @param message - Info message to display
	 * @param options - Optional configuration
	 * @example
	 * modernMessaging.showFooterMessage({ type: 'info', message: 'Authorization URL copied to clipboard', duration: 3000 });
	 */
	static info(message: string, _options?: { duration?: number }): void {
		console.log(`${ToastNotificationsV8.MODULE_TAG} Info:`, message);
		modernMessaging.showFooterMessage({ type: 'info', message, duration: 3000 });
	}

	/**
	 * Show copy success notification
	 * @param itemName - Name of item copied
	 * @example
	 * modernMessaging.showFooterMessage({ type: 'info', message: 'Copied to clipboard', duration: 3000 });
	 */
	static copiedToClipboard(itemName: string): void {
		ToastNotificationsV8.success(`${itemName} copied to clipboard`);
	}

	/**
	 * Show validation error notification
	 * @param fields - Array of field names that failed validation
	 * @example
	 * modernMessaging.showBanner({ type: 'error', title: 'Validation Error', message: 'Validation failed', dismissible: true });
	 */
	static validationError(fields: string[]): void {
		const fieldList = fields.join(', ');
		ToastNotificationsV8.error(`Please fill in required fields: ${fieldList}`);
	}

	/**
	 * Show network error notification
	 * @param operation - Name of operation that failed
	 * @example
	 * modernMessaging.showBanner({ type: 'error', title: 'Network Error', message: 'A network error occurred', dismissible: true });
	 */
	static networkError(operation: string): void {
		ToastNotificationsV8.error(`Network error during ${operation}. Please check your connection.`);
	}

	/**
	 * Show step completion notification
	 * @param stepNumber - Step number completed
	 * @example
	 * modernMessaging.showFooterMessage({ type: 'info', message: `Step ${1} completed`, duration: 3000 });
	 */
	static stepCompleted(stepNumber: number): void {
		ToastNotificationsV8.success(`Step ${stepNumber} completed`);
	}

	/**
	 * Show flow completion notification
	 * @example
	 * modernMessaging.showFooterMessage({ type: 'info', message: 'Flow completed successfully', duration: 3000 });
	 */
	static flowCompleted(): void {
		ToastNotificationsV8.success('🎉 OAuth Flow Complete!', { duration: 8000 });
	}

	/**
	 * Show loading/processing notification
	 * @param operation - Name of operation in progress
	 * @example
	 * modernMessaging.showFooterMessage({ type: 'info', message: `${'Exchanging authorization code for tokens'}…`, duration: 3000 });
	 */
	static processing(operation: string): void {
		ToastNotificationsV8.info(`${operation}...`);
	}

	/**
	 * Show credentials saved notification
	 * @example
	 * modernMessaging.showFooterMessage({ type: 'info', message: 'Credentials saved successfully', duration: 3000 });
	 */
	static credentialsSaved(): void {
		ToastNotificationsV8.success('Credentials saved successfully');
	}

	/**
	 * Show credentials loaded notification
	 * @example
	 * modernMessaging.showFooterMessage({ type: 'info', message: 'Credentials loaded successfully', duration: 3000 });
	 */
	static credentialsLoaded(): void {
		ToastNotificationsV8.success('Credentials loaded successfully');
	}

	/**
	 * Show PKCE generated notification
	 * @example
	 * modernMessaging.showFooterMessage({ type: 'info', message: 'PKCE parameters generated', duration: 3000 });
	 */
	static pkceGenerated(): void {
		ToastNotificationsV8.success('PKCE parameters generated successfully');
	}

	/**
	 * Show authorization URL generated notification
	 * @example
	 * modernMessaging.showFooterMessage({ type: 'info', message: 'Authorization URL generated', duration: 3000 });
	 */
	static authUrlGenerated(): void {
		ToastNotificationsV8.success('Authorization URL generated successfully');
	}

	/**
	 * Show token exchange success notification
	 * @example
	 * modernMessaging.showFooterMessage({ type: 'info', message: 'Tokens exchanged successfully', duration: 3000 });
	 */
	static tokenExchangeSuccess(): void {
		ToastNotificationsV8.success('Tokens exchanged successfully');
	}

	/**
	 * Show token introspection success notification
	 * @example
	 * modernMessaging.showFooterMessage({ type: 'info', message: 'Token introspection completed successfully', duration: 3000 });
	 */
	static tokenIntrospectionSuccess(): void {
		ToastNotificationsV8.success('Token introspection completed successfully');
	}

	/**
	 * Show user info fetched notification
	 * @example
	 * modernMessaging.showFooterMessage({ type: 'info', message: 'User information retrieved successfully', duration: 3000 });
	 */
	static userInfoFetched(): void {
		ToastNotificationsV8.success('User information retrieved successfully');
	}

	/**
	 * Show app discovery success notification
	 * @example
	 * modernMessaging.showFooterMessage({ type: 'info', message: 'Application discovered successfully', duration: 3000 });
	 */
	static appDiscoverySuccess(): void {
		ToastNotificationsV8.success('Application discovered successfully');
	}

	/**
	 * Show configuration checked notification
	 * @example
	 * modernMessaging.showFooterMessage({ type: 'info', message: 'Configuration check completed', duration: 3000 });
	 */
	static configurationChecked(): void {
		ToastNotificationsV8.success('Configuration check completed');
	}

	/**
	 * Show flow reset notification
	 * @example
	 * modernMessaging.showFooterMessage({ type: 'info', message: 'Flow reset', duration: 3000 });
	 */
	static flowReset(): void {
		ToastNotificationsV8.success('Flow reset. Tokens cleared, credentials preserved.');
	}

	/**
	 * Show scope required warning
	 * @param scope - Scope name that was added
	 * @example
	 * modernMessaging.showBanner({ type: 'warning', title: 'Warning', message: 'Required scope is missing', dismissible: true });
	 */
	static scopeRequired(scope: string): void {
		ToastNotificationsV8.warning(`Added required "${scope}" scope for compliance`);
	}

	/**
	 * Show discovery endpoint notification
	 * @example
	 * modernMessaging.showFooterMessage({ type: 'info', message: 'Discovery endpoint loaded', duration: 3000 });
	 */
	static discoveryEndpointLoaded(): void {
		ToastNotificationsV8.success('Discovery endpoint loaded successfully');
	}

	/**
	 * Show environment ID extracted notification
	 * @example
	 * modernMessaging.showFooterMessage({ type: 'info', message: 'Environment ID extracted', duration: 3000 });
	 */
	static environmentIdExtracted(): void {
		ToastNotificationsV8.success('Environment ID extracted from discovery');
	}

	/**
	 * Show formatted success message with Message: X, Detail: Y format
	 * @param message - Primary message
	 * @param detail - Optional detail information
	 * @example
	 * modernMessaging.showFooterMessage({ type: 'info', message: 'Device registered', duration: 3000 });
	 */
	static formattedSuccess(message: string, detail?: string): void {
		const formattedMessage = detail
			? `Message: ${message} | Detail: ${detail}`
			: `Message: ${message}`;
		ToastNotificationsV8.success(formattedMessage);
	}

	/**
	 * Show formatted error message with Message: X, Detail: Y format
	 * @param message - Primary error message
	 * @param detail - Optional detail information
	 * @example
	 * modernMessaging.showBanner({ type: 'error', title: 'Error', message: 'Registration failed', dismissible: true });
	 */
	static formattedError(message: string, detail?: string): void {
		const formattedMessage = detail
			? `Message: ${message} | Detail: ${detail}`
			: `Message: ${message}`;
		ToastNotificationsV8.error(formattedMessage);
	}

	/**
	 * Show formatted warning message with Message: X, Detail: Y format
	 * @param message - Primary warning message
	 * @param detail - Optional detail information
	 * @example
	 * modernMessaging.showBanner({ type: 'warning', title: 'Warning', message: 'Policy required', dismissible: true });
	 */
	static formattedWarning(message: string, detail?: string): void {
		const formattedMessage = detail
			? `Message: ${message} | Detail: ${detail}`
			: `Message: ${message}`;
		ToastNotificationsV8.warning(formattedMessage);
	}

	/**
	 * Show formatted info message with Message: X, Detail: Y format
	 * @param message - Primary info message
	 * @param detail - Optional detail information
	 * @example
	 * modernMessaging.showFooterMessage({ type: 'info', message: 'Token loaded', duration: 3000 });
	 */
	static formattedInfo(message: string, detail?: string): void {
		const formattedMessage = detail
			? `Message: ${message} | Detail: ${detail}`
			: `Message: ${message}`;
		ToastNotificationsV8.info(formattedMessage);
	}

	/**
	 * Show MFA device registration success with standardized format
	 * @param deviceType - Type of MFA device (SMS, Email, WhatsApp, etc.)
	 * @param status - Device status (ACTIVE, ACTIVATION_REQUIRED, etc.)
	 * @example
	 * modernMessaging.showFooterMessage({ type: 'info', message: 'MFA device registered successfully', duration: 3000 });
	 */
	static mfaDeviceRegistered(deviceType: string, status?: string): void {
		const message = `${deviceType} device registered successfully`;
		const detail = status ? `Device status: ${status}` : 'Device is ready to use';
		ToastNotificationsV8.formattedSuccess(message, detail);
	}

	/**
	 * Show MFA authentication success with standardized format
	 * @param deviceType - Type of MFA device used
	 * @param username - Username that authenticated
	 * @example
	 * modernMessaging.showFooterMessage({ type: 'info', message: 'MFA authentication successful', duration: 3000 });
	 */
	static mfaAuthenticationSuccess(deviceType: string, username?: string): void {
		const message = `${deviceType} authentication successful`;
		const detail = username ? `User: ${username}` : 'Authentication completed';
		ToastNotificationsV8.formattedSuccess(message, detail);
	}

	/**
	 * Show MFA operation error with standardized format
	 * @param operation - Type of operation (registration, authentication, etc.)
	 * @param reason - Reason for failure
	 * @example
	 * modernMessaging.showBanner({ type: 'error', title: 'MFA Error', message: 'registration', dismissible: true });
	 */
	static mfaOperationError(operation: string, reason: string): void {
		const message = `MFA ${operation} failed`;
		const detail = reason;
		ToastNotificationsV8.formattedError(message, detail);
	}

	/**
	 * Show Unified flow operation success with standardized format
	 * @param operation - Type of operation (credentials saved, flow completed, etc.)
	 * @param detail - Additional detail about the operation
	 * @example
	 * modernMessaging.showFooterMessage({ type: 'info', message: 'Credentials saved', duration: 3000 });
	 */
	static unifiedFlowSuccess(operation: string, detail?: string): void {
		const message = `Unified flow: ${operation}`;
		ToastNotificationsV8.formattedSuccess(message, detail);
	}

	/**
	 * Show Unified flow operation error with standardized format
	 * @param operation - Type of operation (token exchange, authorization, etc.)
	 * @param reason - Reason for failure
	 * @example
	 * modernMessaging.showBanner({ type: 'error', title: 'Error', message: 'Token exchange', dismissible: true });
	 */
	static unifiedFlowError(operation: string, reason: string): void {
		const message = `Unified flow: ${operation} failed`;
		const detail = reason;
		ToastNotificationsV8.formattedError(message, detail);
	}
}

// Export singleton instance
export const toastV8 = ToastNotificationsV8;
