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
		let credentials: any = {};

		// Load credentials based on flow type
		switch (flowType) {
			case 'oauth-authorization-code-v3':
			case 'enhanced-authorization-code-v3':
				credentials = credentialManager.loadAuthzFlowCredentials();
				break;
			case 'oauth2-implicit-v3':
			case 'oidc-implicit-v3':
				credentials = credentialManager.loadImplicitFlowCredentials();
				break;
			case 'oauth2-client-credentials-v3':
			case 'oidc-client-credentials-v3':
				// Client credentials flows need environment ID, client ID, and client secret
				credentials = credentialManager.loadConfigCredentials();
				break;
			case 'worker-token-v3':
				// Worker token flow has its own credential storage
				credentials = credentialManager.loadWorkerFlowCredentials();
				break;
			case 'oidc-hybrid-v3':
				credentials = credentialManager.loadAuthzFlowCredentials();
				break;
			case 'device-code-oidc':
				credentials = credentialManager.loadConfigCredentials();
				break;
			case 'oauth-resource-owner-password':
			case 'oidc-resource-owner-password':
				credentials = credentialManager.loadConfigCredentials();
				break;
			default:
				credentials = credentialManager.loadConfigCredentials();
		}

		const missingFields: string[] = [];

		// Check required fields based on flow type
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
				'oidc-client-credentials-v3',
				'worker-token-v3',
				'oauth-resource-owner-password',
				'oidc-resource-owner-password',
			].includes(flowType)
		) {
			if (!credentials?.clientSecret || credentials.clientSecret.trim() === '') {
				missingFields.push('Client Secret');
			}
		}

		// Check redirect URI for flows that require it
		if (
			[
				'oauth-authorization-code-v3',
				'enhanced-authorization-code-v3',
				'oauth2-implicit-v3',
				'oidc-implicit-v3',
				'oidc-hybrid-v3',
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
		logger.error('flowCredentialChecker', `Error checking credentials for ${flowType}`, error);
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
		logger.error('flowCredentialChecker', `Error getting execution time for ${flowType}`, error);
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
		logger.error('flowCredentialChecker', `Error setting execution time for ${flowType}`, error);
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
		{ flowType: 'oauth-authorization-code-v3', flowName: 'OAuth 2.0 Authorization Code (V3)' },
		{ flowType: 'oauth2-implicit-v3', flowName: 'OAuth 2.0 Implicit V3' },
		{ flowType: 'oauth2-client-credentials-v3', flowName: 'OAuth2 Client Credentials V3' },
		{ flowType: 'enhanced-authorization-code-v3', flowName: 'OIDC Authorization Code (V3)' },
		{ flowType: 'oidc-implicit-v3', flowName: 'OIDC Implicit V3' },
		{ flowType: 'oidc-hybrid-v3', flowName: 'OIDC Hybrid V3' },
		{ flowType: 'oidc-client-credentials-v3', flowName: 'OIDC Client Credentials V3' },
		{ flowType: 'device-code-oidc', flowName: 'OIDC Device Code V3' },
		{ flowType: 'worker-token-v3', flowName: 'PingOne Worker Token V3' },
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
