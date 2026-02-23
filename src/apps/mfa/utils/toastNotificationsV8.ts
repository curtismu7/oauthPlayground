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
 * import { toastV8 } from '@/v8/utils/toastNotificationsV8';
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

import { v4ToastManager } from '@/utils/v4ToastMessages';

const MODULE_TAG = '[🔔 TOAST-V8]';

/**
 * Extract a short summary from a long error message for toast display
 * @param message - Full error message
 * @returns Short summary suitable for toast
 */
function extractShortSummary(message: string): string {
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
 * Show success notification
 * @param message - Success message to display
 * @param options - Optional configuration
 * @example
 * toastV8.success('Configuration saved successfully');
 */
export function success(message: string, options?: { duration?: number }): void {
	console.log(`${MODULE_TAG} Success:`, message);
	v4ToastManager.showSuccess(message, {}, options);
}

/**
 * Show error notification
 * @param message - Error message to display
 * @param options - Optional configuration
 * @example
 * toastV8.error('Authorization failed');
 */
export function error(message: string): void {
	const shortMessage = extractShortSummary(message);
	console.log(`${MODULE_TAG} Error:`, message);
	v4ToastManager.showError(shortMessage, { title: 'Error' });
}

/**
 * Show warning notification
 * @param message - Warning message to display
 * @param options - Optional configuration
 * @example
 * toastV8.warning('Session will expire soon');
 */
export function warning(message: string): void {
	console.log(`${MODULE_TAG} Warning:`, message);
	v4ToastManager.showWarning(message);
}

/**
 * Show info notification
 * @param message - Info message to display
 * @param options - Optional configuration
 * @example
 * toastV8.info('Authorization URL copied to clipboard');
 */
export function info(message: string): void {
	console.log(`${MODULE_TAG} Info:`, message);
	v4ToastManager.showInfo(message);
}

/**
 * Show copy success notification
 * @param itemName - Name of item copied
 * @example
 * toastV8.copiedToClipboard('Authorization URL');
 */
export function copiedToClipboard(itemName: string): void {
	success(`${itemName} copied to clipboard`);
}

/**
 * Show validation error notification
 * @param fields - Array of field names that failed validation
 * @example
 * toastV8.validationError(['Client ID', 'Redirect URI']);
 */
export function validationError(fields: string[]): void {
	const fieldList = fields.join(', ');
	error(`Please fill in required fields: ${fieldList}`);
}

/**
 * Show network error notification
 * @param operation - Name of operation that failed
 * @example
 * toastV8.networkError('token exchange');
 */
export function networkError(operation: string): void {
	error(`Network error during ${operation}. Please check your connection.`);
}

/**
 * Show step completion notification
 * @param stepNumber - Step number completed
 * @example
 * toastV8.stepCompleted(1);
 */
export function stepCompleted(stepNumber: number): void {
	success(`Step ${stepNumber} completed`);
}

/**
 * Show flow completion notification
 * @example
 * toastV8.flowCompleted();
 */
export function flowCompleted(): void {
	success('🎉 OAuth Flow Complete!', { duration: 8000 });
}

/**
 * Show loading/processing notification
 * @param operation - Name of operation in progress
 * @example
 * toastV8.processing('Exchanging authorization code for tokens');
 */
export function processing(operation: string): void {
	info(`${operation}...`);
}

/**
 * Show credentials saved notification
 * @example
 * toastV8.credentialsSaved();
 */
export function credentialsSaved(): void {
	success('Credentials saved successfully');
}

/**
 * Show credentials loaded notification
 * @example
 * toastV8.credentialsLoaded();
 */
export function credentialsLoaded(): void {
	success('Credentials loaded successfully');
}

/**
 * Show PKCE generated notification
 * @example
 * toastV8.pkceGenerated();
 */
export function pkceGenerated(): void {
	success('PKCE parameters generated successfully');
}

/**
 * Show formatted error with title and details
 * @param title - Error title
 * @param detail - Error detail message
 * @example
 * toastV8.formattedError('Authentication Failed', 'Invalid credentials');
 */
export function formattedError(title: string, detail: string): void {
	console.log(`${MODULE_TAG} Formatted Error:`, title, detail);
	v4ToastManager.showError(detail, { title });
}

/**
 * Show authentication error notification
 * @param reason - Reason for authentication failure
 * @example
 * toastV8.authError('Invalid authorization code');
 */
export function authError(reason: string): void {
	error(`Authentication failed: ${reason}`);
}

/**
 * Show device registration error notification
 * @param reason - Reason for registration failure
 * @example
 * toastV8.registrationError('Device already registered');
 */
export function registrationError(reason: string): void {
	error(`Device registration failed: ${reason}`);
}

/**
 * Show MFA flow error notification
 * @param reason - Reason for MFA failure
 * @example
 * toastV8.mfaError('Too many failed attempts');
 */
export function mfaError(reason: string): void {
	error(`MFA authentication failed: ${reason}`);
}

/**
 * Show unified flow error notification
 * @param operation - Name of operation that failed
 * @param reason - Reason for failure
 * @example
 * toastV8.unifiedFlowError('Token exchange', 'Invalid authorization code');
 */
export function unifiedFlowError(operation: string, reason: string): void {
	const message = `Unified flow: ${operation} failed`;
	const detail = reason;
	formattedError(message, detail);
}

// Export object with all functions for backward compatibility
export const toastV8 = {
	success,
	error,
	warning,
	info,
	copiedToClipboard,
	validationError,
	networkError,
	stepCompleted,
	flowCompleted,
	processing,
	credentialsSaved,
	credentialsLoaded,
	pkceGenerated,
	formattedError,
	authError,
	registrationError,
	mfaError,
	unifiedFlowError,
};
