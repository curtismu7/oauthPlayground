// Utility functions to check real credential status for different flow types

import { credentialManager } from './credentialManager';
import { logger } from './logger';

export interface FlowCredentialStatus {
	flowType: string;
	flowName: string;
	hasCredentials: boolean;
	credentialStatus: 'configured' | 'partial' | 'missing';
	lastExecutionTime: string;
	missingFields: string[];
}

export interface FlowExecutionTime {
	flowType: string;
	lastExecution: number | null;
}

/**
 * Check if credentials are configured for a specific flow type
 */
export const checkFlowCredentials = (
	flowType: string
): {
	hasCredentials: boolean;
	status: 'configured' | 'partial' | 'missing';
	missingFields: string[];
} => {
	try {
		let credentials: Record<string, any> = {};

		// Load credentials based on flow type
		switch (flowType) {
			case 'oauth-authorization-code-v3':
			case 'oauth-authorization-code-v5':
			case 'enhanced-authorization-code-v3':
			case 'oidc-authorization-code-v5':
				credentials = credentialManager.loadAuthzFlowCredentials();
				break;
			case 'oauth2-implicit-v3':
			case 'oauth-implicit-v5':
			case 'oidc-implicit-v3':
			case 'oidc-implicit-v5':
				credentials = credentialManager.loadImplicitFlowCredentials();
				break;
			case 'oauth2-client-credentials-v3':
			case 'client-credentials-v5':
			case 'oidc-client-credentials-v3':
				// Client credentials flows need environment ID, client ID, and client secret
				credentials = credentialManager.loadConfigCredentials();
				break;
			case 'worker-token-v3':
			case 'worker-token-v5':
				// Worker token flow has its own credential storage
				credentials = credentialManager.loadWorkerFlowCredentials();
				break;
			case 'oidc-hybrid-v3':
			case 'hybrid-v5':
				credentials = credentialManager.loadAuthzFlowCredentials();
				break;
			case 'device-code-oidc':
			case 'device-authorization-v6':
			case 'oidc-device-authorization-v6':
				credentials = credentialManager.loadConfigCredentials();
				break;
			case 'oauth-resource-owner-password':
			case 'oauth-resource-owner-password-v5':
			case 'oidc-resource-owner-password':
				credentials = credentialManager.loadConfigCredentials();
				break;
			case 'ciba-v5':
				credentials = credentialManager.loadConfigCredentials();
				break;
			case 'jwt-bearer-token-v5':
			case 'jwt-bearer-v5':
				// JWT Bearer Token flow uses config credentials but requires private key
				credentials = credentialManager.loadConfigCredentials();
				break;
			case 'rar-v5':
				credentials = credentialManager.loadConfigCredentials();
				break;
			default:
				credentials = credentialManager.loadConfigCredentials();
		}

		const missingFields: string[] = [];

		// Check required fields based on flow type
		// Some flows like dashboard, documentation pages don't need credentials
		const flowsWithoutCredentials = [
			'dashboard',
			'url-decoder',
			'oauth2-security',
			'scopes-best-practices',
			'oidc-overview',
			'auto-discover',
			'oidc-for-ai',
			'oidc-specs',
		];

		if (flowsWithoutCredentials.includes(flowType)) {
			// These flows don't need credentials
			return {
				hasCredentials: true,
				status: 'configured' as const,
				missingFields: [],
			};
		}

		if (!credentials?.environmentId || credentials.environmentId.trim() === '') {
			missingFields.push('Environment ID');
		}

		if (!credentials?.clientId || credentials.clientId.trim() === '') {
			missingFields.push('Client ID');
		}

		// Check client secret for flows that require it
		if (
			[
				'oauth2-client-credentials-v3',
				'client-credentials-v5',
				'oidc-client-credentials-v3',
				'worker-token-v3',
				'worker-token-v5',
				'oauth-resource-owner-password',
				'oauth-resource-owner-password-v5',
				'oidc-resource-owner-password',
				'ciba-v5',
				'rar-v5',
			].includes(flowType)
		) {
			if (!credentials?.clientSecret || credentials.clientSecret.trim() === '') {
				missingFields.push('Client Secret');
			}
		}

		// Check private key for JWT Bearer Token flows
		if (['jwt-bearer-token-v5', 'jwt-bearer-v5'].includes(flowType)) {
			// For JWT Bearer Token flow, check if required fields exist in flow-specific storage
			const flowCredentials = credentialManager.loadFlowCredentials(flowType);
			if (!flowCredentials?.clientId || flowCredentials.clientId.trim() === '') {
				missingFields.push('Client ID');
			}
			if (!flowCredentials?.environmentId || flowCredentials.environmentId.trim() === '') {
				missingFields.push('Environment ID');
			}
			if (!flowCredentials?.privateKey || flowCredentials.privateKey.trim() === '') {
				missingFields.push('Private Key');
			}
		}

		// Check redirect URI for flows that require it
		if (
			[
				'oauth-authorization-code-v3',
				'oauth-authorization-code-v5',
				'enhanced-authorization-code-v3',
				'oidc-authorization-code-v5',
				'oauth2-implicit-v3',
				'oauth-implicit-v5',
				'oidc-implicit-v3',
				'oidc-implicit-v5',
				'oidc-hybrid-v3',
				'hybrid-v5',
			].includes(flowType)
		) {
			if (!credentials?.redirectUri || credentials.redirectUri.trim() === '') {
				missingFields.push('Redirect URI');
			}
		}

		// Determine status
		let status: 'configured' | 'partial' | 'missing' = 'missing';
		if (missingFields.length === 0) {
			status = 'configured';
		} else if (missingFields.length < 3) {
			// Some fields present but not all
			status = 'partial';
		}

		return {
			hasCredentials: missingFields.length === 0,
			status,
			missingFields,
		};
	} catch (error) {
		logger.error('flowCredentialChecker', `Error checking credentials for ${flowType}`, { error });
		return {
			hasCredentials: false,
			status: 'missing',
			missingFields: ['Configuration Error'],
		};
	}
};

/**
 * Get last execution time for a flow type from localStorage
 */
export const getLastExecutionTime = (flowType: string): string => {
	try {
		// Check for execution timestamps in localStorage
		const executionKey = `flow_execution_${flowType}`;
		const lastExecution = localStorage.getItem(executionKey);

		if (!lastExecution) {
			return 'Never';
		}

		const timestamp = parseInt(lastExecution, 10);
		const now = Date.now();
		const diffMs = now - timestamp;
		const diffMinutes = Math.floor(diffMs / (1000 * 60));
		const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

		if (diffMinutes < 1) {
			return 'Just now';
		} else if (diffMinutes < 60) {
			return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
		} else if (diffHours < 24) {
			return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
		} else if (diffDays < 7) {
			return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
		} else {
			return new Date(timestamp).toLocaleDateString();
		}
	} catch (error) {
		logger.error('flowCredentialChecker', `Error getting execution time for ${flowType}`, {
			error,
		});
		return 'Unknown';
	}
};

/**
 * Set execution time for a flow type
 */
export const setLastExecutionTime = (flowType: string): void => {
	try {
		const executionKey = `flow_execution_${flowType}`;
		localStorage.setItem(executionKey, Date.now().toString());
		logger.info('flowCredentialChecker', `Flow execution time recorded for ${flowType}`);
	} catch (error) {
		logger.error('flowCredentialChecker', `Error setting execution time for ${flowType}`, {
			error,
		});
	}
};

/**
 * Track flow completion - call this when a flow completes successfully
 */
export const trackFlowCompletion = (flowType: string, success: boolean = true): void => {
	if (success) {
		setLastExecutionTime(flowType);
	}
	logger.info('flowCredentialChecker', `Flow completion tracked: ${flowType}, success: ${success}`);
};

/**
 * Get comprehensive flow credential status for all flows
 */
export const getAllFlowCredentialStatuses = (): FlowCredentialStatus[] => {
	const flows = [
		// OAuth 2.0 V5 Flows
		{
			flowType: 'oauth-authorization-code-v5',
			flowName: 'Authorization Code Flow - Secure User Authentication',
		},
		{
			flowType: 'oauth-implicit-v5',
			flowName: 'Implicit Flow - Legacy Browser-Based Authentication',
		},
		{
			flowType: 'client-credentials-v5',
			flowName: 'Client Credentials Flow - Server-to-Server Authentication',
		},
		{
			flowType: 'device-authorization-v6',
			flowName: 'Device Authorization Flow - Input-Constrained Devices',
		},
		{
			flowType: 'oauth-resource-owner-password-v5',
			flowName: 'OAuth 2.0 Resource Owner Password Flow (V5)',
		},
		{ flowType: 'worker-token-v5', flowName: 'Worker Token Flow' },
		{ flowType: 'rar-v5', flowName: 'Rich Authorization Requests (RAR) Flow' },

		// OIDC V5 Flows
		{
			flowType: 'oidc-authorization-code-v5',
			flowName: 'Authorization Code Flow - User Identity & Authentication',
		},
		{ flowType: 'oidc-implicit-v5', flowName: 'Implicit Flow - Legacy Browser Authentication' },
		{ flowType: 'hybrid-v5', flowName: 'Hybrid Flow - Combined Authorization Approach' },
		{
			flowType: 'oidc-device-authorization-v6',
			flowName: 'Device Authorization Flow - OIDC for Constrained Devices',
		},
		{ flowType: 'ciba-v5', flowName: 'OIDC CIBA Flow (V5)' },

		// Additional flows
		{
			flowType: 'jwt-bearer-token-v5',
			flowName: 'JWT Bearer Token Flow - JWT Assertion Authentication',
		},
		{ flowType: 'dashboard', flowName: 'Dashboard' },
		{ flowType: 'url-decoder', flowName: 'URL Decoder' },
		{ flowType: 'oauth2-security', flowName: 'OAuth 2.0 Security' },
		{ flowType: 'scopes-best-practices', flowName: 'Scopes Best Practices' },
		{ flowType: 'oidc-overview', flowName: 'OIDC Overview' },
		{ flowType: 'auto-discover', flowName: 'Auto Discover' },
		{ flowType: 'oidc-for-ai', flowName: 'OIDC for AI' },
		{ flowType: 'oidc-specs', flowName: 'OIDC Specs' },
	];

	return flows.map((flow) => {
		const credentialCheck = checkFlowCredentials(flow.flowType);
		const lastExecutionTime = getLastExecutionTime(flow.flowType);

		return {
			flowType: flow.flowType,
			flowName: flow.flowName,
			hasCredentials: credentialCheck.hasCredentials,
			credentialStatus: credentialCheck.status,
			lastExecutionTime,
			missingFields: credentialCheck.missingFields,
		};
	});
};
