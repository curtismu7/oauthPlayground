// PingOne Error Interpreter - Translates technical PingOne errors into user-friendly messages
export interface PingOneError {
	error: string;
	error_description?: string;
	error_uri?: string;
	state?: string;
	details?: Record<string, unknown>;
}

export interface InterpretedError {
	title: string;
	message: string;
	suggestion: string;
	technicalDetails: string;
	severity: 'error' | 'warning' | 'info';
	category:
		| 'configuration'
		| 'authentication'
		| 'authorization'
		| 'network'
		| 'validation'
		| 'unknown';
}

export class PingOneErrorInterpreter {
	private static readonly ERROR_PATTERNS = {
		// Configuration errors
		invalid_client: {
			title: 'Invalid Client Configuration',
			message: 'The client application is not properly configured in PingOne.',
			suggestion:
				"1. Verify your Client ID is correct in the Configuration page\n2. Ensure your PingOne application is active and not disabled\n3. Check that your Environment ID matches the application's environment\n4. Verify the application type supports the OAuth flows you're trying to use\n5. Make sure your application has the necessary scopes configured",
			category: 'configuration' as const,
			severity: 'error' as const,
		},
		unauthorized_client: {
			title: 'Unauthorized Client',
			message: 'This client is not authorized to use the requested grant type.',
			suggestion:
				'1. Check your application type in PingOne Admin (Web App, SPA, Native, etc.)\n2. Ensure the grant type is enabled for your application\n3. Verify your application has the correct OAuth 2.0 settings\n4. Check if your application requires specific scopes or permissions',
			category: 'configuration' as const,
			severity: 'error' as const,
		},
		unsupported_grant_type: {
			title: 'Unsupported Grant Type',
			message: 'The requested OAuth grant type is not supported for this client.',
			suggestion:
				"1. Go to PingOne Admin → Applications → Your App → OAuth 2.0\n2. Check which grant types are enabled (Authorization Code, Implicit, etc.)\n3. Enable the grant type you're trying to use\n4. Save the configuration and try again",
			category: 'configuration' as const,
			severity: 'error' as const,
		},
		invalid_redirect_uri: {
			title: 'Invalid Redirect URI',
			message: 'The redirect URI does not match what is configured in PingOne.',
			suggestion:
				'1. Go to PingOne Admin → Applications → Your App → OAuth 2.0\n2. Check the Redirect URIs section\n3. Add or update the redirect URI to match exactly: {redirect_uri}\n4. Ensure there are no trailing slashes or extra characters\n5. Save the configuration and try again',
			category: 'configuration' as const,
			severity: 'error' as const,
		},
		invalid_scope: {
			title: 'Invalid Scope',
			message: 'One or more requested scopes are not valid or not authorized.',
			suggestion: 'Check the available scopes for your application in PingOne Admin.',
			category: 'configuration' as const,
			severity: 'error' as const,
		},
		NOT_FOUND: {
			title: 'Resource Not Found',
			message:
				'The requested resource could not be found. This usually means your Client ID, Environment ID, or application configuration is incorrect.',
			suggestion:
				'1. Double-check your Client ID in the Configuration page\n2. Verify your Environment ID matches your PingOne environment\n3. Ensure your PingOne application is active and not deleted\n4. Check that your application exists in the correct environment\n5. Verify the token endpoint URL is correct for your environment',
			category: 'configuration' as const,
			severity: 'error' as const,
		},
		invalid_client_id: {
			title: 'Invalid Client ID',
			message: 'The provided Client ID is not valid or does not exist in your PingOne environment.',
			suggestion:
				"1. Go to PingOne Admin → Applications\n2. Find your application and copy the exact Client ID\n3. Update the Client ID in the Configuration page\n4. Ensure there are no extra spaces or characters\n5. Verify you're using the correct environment",
			category: 'configuration' as const,
			severity: 'error' as const,
		},
		client_not_found: {
			title: 'Client Not Found',
			message: 'The client application could not be found in your PingOne environment.',
			suggestion:
				'1. Verify your Client ID is correct\n2. Check that your application exists in the current environment\n3. Ensure your application is not deleted or disabled\n4. Try creating a new application if needed\n5. Double-check your Environment ID',
			category: 'configuration' as const,
			severity: 'error' as const,
		},

		// Authentication errors
		invalid_grant: {
			title: 'Invalid Grant',
			message: 'The authorization code or refresh token is invalid or expired.',
			suggestion: 'Try starting the OAuth flow again to get a fresh authorization code.',
			category: 'authentication' as const,
			severity: 'error' as const,
		},
		invalid_request: {
			title: 'Invalid Request',
			message: 'The request is missing required parameters or has invalid values.',
			suggestion: 'Check that all required OAuth parameters are included and properly formatted.',
			category: 'validation' as const,
			severity: 'error' as const,
		},
		access_denied: {
			title: 'Access Denied',
			message: 'The user denied the authorization request.',
			suggestion:
				'The user chose not to authorize your application. They can try again and accept the permissions.',
			category: 'authorization' as const,
			severity: 'warning' as const,
		},
		server_error: {
			title: 'Server Error',
			message: 'PingOne encountered an internal error.',
			suggestion:
				'Please try again in a few moments. If the problem persists, contact PingOne support.',
			category: 'network' as const,
			severity: 'error' as const,
		},
		temporarily_unavailable: {
			title: 'Service Temporarily Unavailable',
			message: 'PingOne is temporarily unavailable.',
			suggestion: 'Please try again in a few minutes. This is usually a temporary issue.',
			category: 'network' as const,
			severity: 'warning' as const,
		},

		// PKCE specific errors
		invalid_code_challenge: {
			title: 'Invalid Code Challenge',
			message: 'The PKCE code challenge is invalid or missing.',
			suggestion: 'Ensure PKCE is properly implemented with a valid code challenge.',
			category: 'validation' as const,
			severity: 'error' as const,
		},
		invalid_code_verifier: {
			title: 'Invalid Code Verifier',
			message: 'The PKCE code verifier is invalid or missing.',
			suggestion:
				'Ensure the code verifier matches the code challenge used in the authorization request.',
			category: 'validation' as const,
			severity: 'error' as const,
		},

		// Application type specific errors
		spa_required: {
			title: 'SPA Application Required',
			message: 'This OAuth flow requires a Single Page Application (SPA) type in PingOne.',
			suggestion: 'Change your application type to SPA in PingOne Admin to use PKCE flows.',
			category: 'configuration' as const,
			severity: 'error' as const,
		},
		confidential_client_required: {
			title: 'Confidential Client Required',
			message: 'This OAuth flow requires a confidential client with a client secret.',
			suggestion: 'Use a confidential client type or add a client secret to your application.',
			category: 'configuration' as const,
			severity: 'error' as const,
		},
	};

	static interpret(error: PingOneError | unknown): InterpretedError {
		// Handle different error formats with proper type checking
		const errorObj = error as Record<string, unknown>;
		const errorCode = errorObj?.error || errorObj?.errorCode || errorObj?.code || 'unknown';
		const errorDescription =
			errorObj?.error_description || errorObj?.errorDescription || errorObj?.message || '';
		const errorDetails = errorObj?.details || {};

		// Check for specific error patterns in description
		const description = errorDescription.toLowerCase();

		// SPA specific error detection
		if (description.includes('spa') || description.includes('single page application')) {
			return {
				title: 'SPA Application Required',
				message: 'This OAuth flow requires a Single Page Application (SPA) type in PingOne.',
				suggestion: 'Change your application type to SPA in PingOne Admin to use PKCE flows.',
				technicalDetails: `Error: ${errorCode} - ${errorDescription}`,
				severity: 'error',
				category: 'configuration',
			};
		}

		// PKCE specific error detection
		if (
			description.includes('pkce') ||
			description.includes('code challenge') ||
			description.includes('code verifier')
		) {
			return {
				title: 'PKCE Configuration Error',
				message: 'There is an issue with PKCE (Proof Key for Code Exchange) configuration.',
				suggestion: 'Ensure PKCE is properly implemented with valid code challenge and verifier.',
				technicalDetails: `Error: ${errorCode} - ${errorDescription}`,
				severity: 'error',
				category: 'validation',
			};
		}

		// Redirect URI mismatch detection
		if (description.includes('redirect_uri') || description.includes('redirect uri')) {
			return {
				title: 'Redirect URI Mismatch',
				message: 'The redirect URI does not match what is configured in PingOne.',
				suggestion: `Update your redirect URI in PingOne Admin to match exactly: ${errorDetails.redirect_uri || 'your current redirect URI'}`,
				technicalDetails: `Error: ${errorCode} - ${errorDescription}`,
				severity: 'error',
				category: 'configuration',
			};
		}

		// Client ID/Secret issues
		if (
			description.includes('client_id') ||
			description.includes('client id') ||
			description.includes('client secret')
		) {
			return {
				title: 'Client Credentials Issue',
				message: 'There is an issue with your client ID or client secret.',
				suggestion: 'Verify your Client ID and Client Secret in PingOne Admin are correct.',
				technicalDetails: `Error: ${errorCode} - ${errorDescription}`,
				severity: 'error',
				category: 'configuration',
			};
		}

		// Scope issues
		if (description.includes('scope') || description.includes('permission')) {
			return {
				title: 'Invalid Scope',
				message: 'One or more requested scopes are not valid or not authorized.',
				suggestion: 'Check the available scopes for your application in PingOne Admin.',
				technicalDetails: `Error: ${errorCode} - ${errorDescription}`,
				severity: 'error',
				category: 'configuration',
			};
		}

		// Network/Server issues
		if (
			description.includes('timeout') ||
			description.includes('connection') ||
			description.includes('network')
		) {
			return {
				title: 'Network Error',
				message: 'Unable to connect to PingOne servers.',
				suggestion:
					'Check your internet connection and try again. If the problem persists, PingOne may be experiencing issues.',
				technicalDetails: `Error: ${errorCode} - ${errorDescription}`,
				severity: 'error',
				category: 'network',
			};
		}

		// Check against known error patterns
		const pattern = PingOneErrorInterpreter.ERROR_PATTERNS[errorCode as keyof typeof this.ERROR_PATTERNS];
		if (pattern) {
			return {
				...pattern,
				technicalDetails: `Error: ${errorCode} - ${errorDescription}`,
				suggestion: pattern.suggestion.replace(
					'{redirect_uri}',
					errorDetails.redirect_uri || 'your redirect URI'
				),
			};
		}

		// Default fallback for unknown errors
		return {
			title: 'Unknown Error',
			message: errorDescription || 'An unexpected error occurred.',
			suggestion:
				'Please check your configuration and try again. If the problem persists, contact support.',
			technicalDetails: `Error: ${errorCode} - ${errorDescription}`,
			severity: 'error',
			category: 'unknown',
		};
	}

	static formatErrorForDisplay(error: InterpretedError): string {
		return `${error.title}\n\n${error.message}\n\nSuggestion: ${error.suggestion}`;
	}

	static getErrorIcon(category: string): string {
		switch (category) {
			case 'configuration':
				return '⚙️';
			case 'authentication':
				return '🔐';
			case 'authorization':
				return '🚫';
			case 'network':
				return '🌐';
			case 'validation':
				return '✅';
			default:
				return '❓';
		}
	}

	static getSeverityColor(severity: string): string {
		switch (severity) {
			case 'error':
				return '#ef4444';
			case 'warning':
				return '#f59e0b';
			case 'info':
				return '#3b82f6';
			default:
				return '#6b7280';
		}
	}
}

export default PingOneErrorInterpreter;

// Convenience function for easy usage
export const interpretPingOneError = (error: string | PingOneError): InterpretedError => {
	return PingOneErrorInterpreter.interpret(error);
};
