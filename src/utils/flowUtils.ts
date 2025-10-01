import { logger } from './logger';
import { storeOAuthTokens } from './tokenStorage';
import { OAuthTokens } from './tokenStorage';

// Common OAuth flow error types
export interface OAuthFlowError {
	code: string;
	message: string;
	description?: string;
	context?: string;
}

// Common OAuth flow result types
export interface OAuthFlowResult {
	success: boolean;
	tokens?: OAuthTokens;
	error?: OAuthFlowError;
	data?: any;
}

// Common OAuth flow configuration
export interface OAuthFlowConfig {
	flowType: string;
	flowName: string;
	clientId: string;
	redirectUri: string;
	scope: string;
	state?: string;
	nonce?: string;
	codeChallenge?: string;
	codeChallengeMethod?: string;
	responseType?: string;
	grantType?: string;
	additionalParams?: Record<string, string>;
}

// Utility function to build OAuth URLs
export const buildOAuthURL = (baseUrl: string, config: OAuthFlowConfig): string => {
	const params = new URLSearchParams({
		client_id: config.clientId,
		redirect_uri: config.redirectUri,
		scope: config.scope,
		...(config.state && { state: config.state }),
		...(config.nonce && { nonce: config.nonce }),
		...(config.codeChallenge && { code_challenge: config.codeChallenge }),
		...(config.codeChallengeMethod && { code_challenge_method: config.codeChallengeMethod }),
		...(config.responseType && { response_type: config.responseType }),
		...(config.grantType && { grant_type: config.grantType }),
		...config.additionalParams,
	});

	return `${baseUrl}?${params.toString()}`;
};

// Utility function to handle OAuth flow errors
export const handleOAuthFlowError = (
	error: any,
	flowType: string,
	context: string
): OAuthFlowError => {
	logger.error(`[${flowType}] ${context}:`, error);

	// Handle different error types
	if (error.response) {
		// HTTP error response
		const status = error.response.status;
		const data = error.response.data;

		return {
			code: `HTTP_${status}`,
			message: data?.error || `HTTP ${status} Error`,
			description: data?.error_description || data?.message || 'An HTTP error occurred',
			context,
		};
	} else if (error.request) {
		// Network error
		return {
			code: 'NETWORK_ERROR',
			message: 'Network Error',
			description: 'Unable to connect to the server. Please check your internet connection.',
			context,
		};
	} else if (error.message) {
		// Generic error
		return {
			code: 'GENERIC_ERROR',
			message: error.message,
			description: 'An unexpected error occurred',
			context,
		};
	} else {
		// Unknown error
		return {
			code: 'UNKNOWN_ERROR',
			message: 'Unknown Error',
			description: 'An unknown error occurred',
			context,
		};
	}
};

// Utility function to store OAuth tokens
export const storeOAuthTokensSafely = async (
	tokens: OAuthTokens,
	flowType: string,
	flowName: string
): Promise<boolean> => {
	try {
		const success = storeOAuthTokens(tokens, flowType, flowName);
		if (success) {
			logger.success(`[${flowType}] Tokens stored successfully for ${flowName}`);
			return true;
		} else {
			logger.error(`[${flowType}] Failed to store tokens for ${flowName}`);
			return false;
		}
	} catch (error) {
		logger.error(`[${flowType}] Error storing tokens for ${flowName}:`, error);
		return false;
	}
};

// Utility function to validate OAuth configuration
export const validateOAuthConfig = (config: Partial<OAuthFlowConfig>): string[] => {
	const errors: string[] = [];

	if (!config.clientId) {
		errors.push('Client ID is required');
	}

	if (!config.redirectUri) {
		errors.push('Redirect URI is required');
	}

	if (!config.scope) {
		errors.push('Scope is required');
	}

	if (!config.flowType) {
		errors.push('Flow type is required');
	}

	if (!config.flowName) {
		errors.push('Flow name is required');
	}

	return errors;
};

// Utility function to generate secure random strings
export const generateSecureRandomString = (length: number = 32): string => {
	const array = new Uint8Array(length);
	crypto.getRandomValues(array);
	return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
};

// Utility function to generate state parameter
export const generateState = (): string => {
	return generateSecureRandomString(16);
};

// Utility function to generate nonce parameter
export const generateNonce = (): string => {
	return generateSecureRandomString(16);
};

// Utility function to format OAuth flow results
export const formatOAuthFlowResult = (
	success: boolean,
	tokens?: OAuthTokens,
	error?: OAuthFlowError,
	data?: any
): OAuthFlowResult => {
	return {
		success,
		tokens,
		error,
		data,
	};
};

// Utility function to log OAuth flow events
export const logOAuthFlowEvent = (event: string, flowType: string, details?: any): void => {
	logger.info(`[${flowType}] ${event}`, details);
};

// Utility function to check if OAuth flow is supported
export const isOAuthFlowSupported = (flowType: string): boolean => {
	const supportedFlows = [
		'authorization-code',
		'implicit',
		'client-credentials',
		'device-code',
		'pkce',
		'hybrid',
		'par',
	];

	return supportedFlows.includes(flowType);
};

// Utility function to get OAuth flow display name
export const getOAuthFlowDisplayName = (flowType: string): string => {
	const displayNames: Record<string, string> = {
		'authorization-code': 'Authorization Code',
		implicit: 'Implicit Grant',
		'client-credentials': 'Client Credentials',
		'device-code': 'Device Code',
		pkce: 'PKCE (Proof Key for Code Exchange)',
		hybrid: 'Hybrid Flow',
		par: 'Pushed Authorization Request (PAR)',
	};

	return displayNames[flowType] || flowType;
};

// Utility function to get OAuth flow description
export const getOAuthFlowDescription = (flowType: string): string => {
	const descriptions: Record<string, string> = {
		'authorization-code':
			'The most secure OAuth 2.0 flow, suitable for server-side applications with the ability to securely store client credentials.',
		implicit:
			'A simplified flow for client-side applications, but less secure due to tokens being exposed in the URL.',
		'client-credentials':
			'Used for server-to-server authentication where the client acts on its own behalf.',
		'device-code':
			'Designed for devices with limited input capabilities, such as smart TVs or IoT devices.',
		pkce: 'An extension to the authorization code flow that adds security for public clients.',
		hybrid:
			'A combination of authorization code and implicit flows, providing both access tokens and ID tokens.',
		par: 'Allows clients to push authorization request parameters to the authorization server in advance.',
	};

	return descriptions[flowType] || 'OAuth 2.0 flow implementation';
};

// Utility function to get OAuth flow security level
export const getOAuthFlowSecurityLevel = (flowType: string): 'high' | 'medium' | 'low' => {
	const securityLevels: Record<string, 'high' | 'medium' | 'low'> = {
		'authorization-code': 'high',
		pkce: 'high',
		par: 'high',
		hybrid: 'medium',
		'client-credentials': 'medium',
		'device-code': 'medium',
		implicit: 'low',
	};

	return securityLevels[flowType] || 'medium';
};

// Utility function to get OAuth flow use cases
export const getOAuthFlowUseCases = (flowType: string): string[] => {
	const useCases: Record<string, string[]> = {
		'authorization-code': [
			'Web applications with server-side components',
			'Mobile applications with secure storage',
			'Desktop applications with secure storage',
		],
		implicit: [
			'Single-page applications (SPAs)',
			'JavaScript applications',
			'Applications without secure storage',
		],
		'client-credentials': [
			'Server-to-server communication',
			'API access without user interaction',
			'Background services',
		],
		'device-code': [
			'Smart TVs and streaming devices',
			'IoT devices with limited input',
			'Command-line tools',
		],
		pkce: [
			'Mobile applications',
			'Single-page applications',
			'Public clients without secure storage',
		],
		hybrid: [
			'Applications requiring both access and ID tokens',
			'Federated identity scenarios',
			'Applications with mixed security requirements',
		],
		par: [
			'High-security applications',
			'Applications with complex authorization parameters',
			'Enterprise applications',
		],
	};

	return useCases[flowType] || [];
};

export default {
	buildOAuthURL,
	handleOAuthFlowError,
	storeOAuthTokensSafely,
	validateOAuthConfig,
	generateSecureRandomString,
	generateState,
	generateNonce,
	formatOAuthFlowResult,
	logOAuthFlowEvent,
	isOAuthFlowSupported,
	getOAuthFlowDisplayName,
	getOAuthFlowDescription,
	getOAuthFlowSecurityLevel,
	getOAuthFlowUseCases,
};
