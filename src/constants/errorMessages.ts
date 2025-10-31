// src/constants/errorMessages.ts
/**
 * Standardized Error Message Templates
 * 
 * Central repository of error messages with helpful suggestions for users.
 * Used by FlowErrorService to display consistent, helpful error messages.
 */

export enum ErrorCategory {
	CONFIGURATION = 'configuration',
	AUTHORIZATION = 'authorization',
	TOKEN_EXCHANGE = 'token_exchange',
	NETWORK = 'network',
	VALIDATION = 'validation',
	EXPIRED = 'expired',
	PERMISSION = 'permission',
	UNKNOWN = 'unknown'
}

export interface ErrorTemplate {
	title: string;
	message: string;
	suggestions: string[];
	icon: string; // React icon name (e.g., 'FiAlertTriangle')
	category: ErrorCategory;
	severity: 'error' | 'warning' | 'info';
}

/**
 * Complete error message templates
 */
export const ERROR_MESSAGES: Record<string, ErrorTemplate> = {
	// Configuration Errors
	'invalid_client': {
		title: 'Invalid Client Credentials',
		message: 'There is an issue with your client ID or client secret.',
		suggestions: [
			'Verify your Client ID and Client Secret in PingOne Admin are correct',
			'Check that the application is enabled in PingOne',
			'Ensure you\'re using the correct environment ID',
			'Confirm the client secret hasn\'t been regenerated',
		],
		icon: 'FiAlertTriangle',
		category: ErrorCategory.CONFIGURATION,
		severity: 'error',
	},

	'redirect_uri_mismatch': {
		title: 'Redirect URI Mismatch',
		message: 'The redirect URI in your request does not match the configured URI in PingOne.',
		suggestions: [
			'Check redirect URI matches exactly in PingOne Admin (case-sensitive)',
			'Ensure no trailing slashes unless configured in PingOne',
			'Verify protocol matches (http vs https)',
			'Check for typos or extra spaces',
		],
		icon: 'FiLink',
		category: ErrorCategory.CONFIGURATION,
		severity: 'error',
	},

	'invalid_request': {
		title: 'Invalid Request',
		message: 'The authorization request is missing required parameters or contains invalid values.',
		suggestions: [
			'Check that all required parameters are included',
			'Verify parameter values are correctly formatted',
			'Ensure response_type matches your application configuration',
			'Check that scope values are supported by PingOne',
		],
		icon: 'FiXCircle',
		category: ErrorCategory.VALIDATION,
		severity: 'error',
	},

	'unauthorized_client': {
		title: 'Unauthorized Client',
		message: 'The client is not authorized to use this grant type or flow.',
		suggestions: [
			'Check that the grant type is enabled for your application in PingOne',
			'Verify the application type matches the flow (Web vs Native vs SPA)',
			'Ensure the client has permission for the requested operation',
		],
		icon: 'FiShield',
		category: ErrorCategory.PERMISSION,
		severity: 'error',
	},

	'access_denied': {
		title: 'Access Denied',
		message: 'The user or authorization server denied the request.',
		suggestions: [
			'The user may have clicked "Cancel" during authentication',
			'Check user permissions and group memberships in PingOne',
			'Verify the user has access to the application',
			'Review any policy configurations that might block access',
		],
		icon: 'FiLock',
		category: ErrorCategory.PERMISSION,
		severity: 'warning',
	},

	// Token Exchange Errors
	'authorization_code_expired': {
		title: 'Authorization Code Expired',
		message: 'This authorization code has already been used or has expired.',
		suggestions: [
			'Authorization codes are single-use only',
			'Start the authorization flow again to get a new code',
			'Check for clock skew between client and server',
			'Codes expire after 60 seconds - exchange them quickly',
		],
		icon: 'FiClock',
		category: ErrorCategory.EXPIRED,
		severity: 'error',
	},

	'invalid_grant': {
		title: 'Invalid Grant',
		message: 'The authorization code, refresh token, or credentials are invalid.',
		suggestions: [
			'The authorization code may have expired or already been used',
			'Verify the code verifier matches the code challenge (PKCE)',
			'Check that the redirect URI matches the one used in authorization',
			'Ensure the refresh token hasn\'t been revoked',
		],
		icon: 'FiX',
		category: ErrorCategory.TOKEN_EXCHANGE,
		severity: 'error',
	},

	'pkce_verification_failed': {
		title: 'PKCE Verification Failed',
		message: 'The code verifier does not match the code challenge.',
		suggestions: [
			'Ensure the same code verifier is used for authorization and token exchange',
			'Check that PKCE parameters are stored correctly across the flow',
			'Verify the code challenge was properly generated (SHA256)',
			'Make sure no browser refresh occurred during the flow',
		],
		icon: 'FiKey',
		category: ErrorCategory.TOKEN_EXCHANGE,
		severity: 'error',
	},

	// Network Errors
	'network_error': {
		title: 'Network Error',
		message: 'Unable to connect to the authorization server.',
		suggestions: [
			'Check your internet connection',
			'Verify the authorization server URL is correct',
			'Check if PingOne services are operational',
			'Try again in a few moments',
		],
		icon: 'FiWifi',
		category: ErrorCategory.NETWORK,
		severity: 'error',
	},

	'timeout': {
		title: 'Request Timeout',
		message: 'The request took too long to complete.',
		suggestions: [
			'Check your internet connection speed',
			'Try again - the server may be temporarily slow',
			'Verify there are no network firewall issues',
		],
		icon: 'FiClock',
		category: ErrorCategory.NETWORK,
		severity: 'warning',
	},

	// Validation Errors
	'missing_required_fields': {
		title: 'Missing Required Fields',
		message: 'One or more required fields are missing.',
		suggestions: [
			'Fill in all required fields (Environment ID, Client ID, Client Secret)',
			'Check that no fields contain only whitespace',
			'Verify all credentials are entered correctly',
		],
		icon: 'FiAlertCircle',
		category: ErrorCategory.VALIDATION,
		severity: 'error',
	},

	'invalid_scope': {
		title: 'Invalid Scope',
		message: 'One or more requested scopes are not supported or allowed.',
		suggestions: [
			'Check that all scope values are supported by PingOne',
			'Verify scopes are enabled for your application',
			'Ensure openid scope is included for OIDC flows',
			'Remove any custom scopes that aren\'t configured',
		],
		icon: 'FiList',
		category: ErrorCategory.VALIDATION,
		severity: 'error',
	},

	// Token/Session Errors
	'token_expired': {
		title: 'Token Expired',
		message: 'The access token has expired.',
		suggestions: [
			'Use the refresh token to obtain a new access token',
			'Re-authenticate if you don\'t have a refresh token',
			'Check token expiration times in your implementation',
		],
		icon: 'FiClock',
		category: ErrorCategory.EXPIRED,
		severity: 'warning',
	},

	'invalid_token': {
		title: 'Invalid Token',
		message: 'The token is malformed, invalid, or has been revoked.',
		suggestions: [
			'Verify the token hasn\'t been modified',
			'Check that the token hasn\'t been revoked',
			'Ensure the token is from the correct issuer',
			'Re-authenticate to obtain a new token',
		],
		icon: 'FiShield',
		category: ErrorCategory.VALIDATION,
		severity: 'error',
	},

	// Server Errors
	'server_error': {
		title: 'Server Error',
		message: 'The authorization server encountered an unexpected error.',
		suggestions: [
			'Try again in a few moments',
			'Check PingOne status page for any outages',
			'Contact support if the issue persists',
			'Review server logs for more details',
		],
		icon: 'FiServer',
		category: ErrorCategory.UNKNOWN,
		severity: 'error',
	},

	'temporarily_unavailable': {
		title: 'Service Temporarily Unavailable',
		message: 'The authorization server is temporarily unavailable.',
		suggestions: [
			'Try again in a few moments',
			'The server may be undergoing maintenance',
			'Check PingOne status page',
		],
		icon: 'FiAlertOctagon',
		category: ErrorCategory.NETWORK,
		severity: 'warning',
	},

	// Device Flow Errors
	'authorization_pending': {
		title: 'Authorization Pending',
		message: 'The user hasn\'t completed the authorization yet.',
		suggestions: [
			'Wait for the user to complete authorization',
			'The application will continue polling',
			'User should visit the verification URL and enter the user code',
		],
		icon: 'FiClock',
		category: ErrorCategory.AUTHORIZATION,
		severity: 'info',
	},

	'slow_down': {
		title: 'Polling Too Fast',
		message: 'The polling interval is too short.',
		suggestions: [
			'Increase the time between polling requests',
			'Follow the interval specified in the device authorization response',
		],
		icon: 'FiPause',
		category: ErrorCategory.VALIDATION,
		severity: 'warning',
	},

	'expired_token': {
		title: 'Device Code Expired',
		message: 'The device code has expired.',
		suggestions: [
			'Start the device authorization flow again',
			'Complete authorization faster next time',
			'Device codes typically expire after 10 minutes',
		],
		icon: 'FiClock',
		category: ErrorCategory.EXPIRED,
		severity: 'error',
	},

	// Missing Credentials Error
	'client_id_is_required': {
		title: 'Missing OAuth Credentials',
		message: 'OAuth credentials are required to complete this flow.',
		suggestions: [
			'Navigate to an OAuth flow page (e.g., /flows/oauth-authorization-code-v7)',
			'Configure your OAuth credentials in Step 0',
			'Do not access authorization callback URLs directly',
			'Restart the flow from the beginning if you cleared your browser session',
		],
		icon: 'FiKey',
		category: ErrorCategory.CONFIGURATION,
		severity: 'error',
	},

	// Generic catch-all
	'unknown_error': {
		title: 'Unknown Error',
		message: 'An unexpected error occurred.',
		suggestions: [
			'Try again in a few moments',
			'Check the console for more details',
			'Contact support if the issue persists',
		],
		icon: 'FiHelpCircle',
		category: ErrorCategory.UNKNOWN,
		severity: 'error',
	},
};

/**
 * Get error template by error code
 * Returns unknown_error template if not found
 */
export function getErrorTemplate(errorCode: string): ErrorTemplate {
	const normalizedCode = errorCode.toLowerCase().replace(/\s+/g, '_');
	return ERROR_MESSAGES[normalizedCode] || ERROR_MESSAGES['unknown_error'];
}

/**
 * Categorize an error based on its code or message
 */
export function categorizeError(errorCode: string, errorMessage?: string): ErrorCategory {
	const template = getErrorTemplate(errorCode);
	return template.category;
}

/**
 * Get all errors in a specific category
 */
export function getErrorsByCategory(category: ErrorCategory): ErrorTemplate[] {
	return Object.values(ERROR_MESSAGES).filter(error => error.category === category);
}

/**
 * Check if an error code is known
 */
export function isKnownError(errorCode: string): boolean {
	const normalizedCode = errorCode.toLowerCase().replace(/\s+/g, '_');
	return normalizedCode in ERROR_MESSAGES;
}

export default {
	ERROR_MESSAGES,
	getErrorTemplate,
	categorizeError,
	getErrorsByCategory,
	isKnownError,
};

