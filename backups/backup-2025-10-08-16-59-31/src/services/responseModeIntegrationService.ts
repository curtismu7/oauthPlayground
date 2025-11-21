// src/services/responseModeIntegrationService.ts
// Centralized service for integrating response mode selection across OAuth/OIDC flows

import { useCallback, useEffect, useState } from 'react';

export type ResponseMode = 'query' | 'fragment' | 'form_post' | 'pi.flow';

interface ResponseModeIntegrationOptions {
	flowKey: string;
	credentials: any; // Generic credentials object
	setCredentials: (creds: any) => void;
	logPrefix?: string;
}

interface ResponseModeIntegrationResult {
	responseMode: ResponseMode;
	setResponseMode: (mode: ResponseMode) => void;
	responseModeChanged: boolean;
	setResponseModeChanged: (changed: boolean) => void;
	updateCredentialsWithResponseMode: () => void;
	clearAuthUrl: () => void;
}

/**
 * Centralized service for integrating response mode selection across flows
 * This service handles:
 * - Response mode state management
 * - Automatic credential updates when response mode changes
 * - URL regeneration triggers
 * - Consistent logging across flows
 */
export const useResponseModeIntegration = (
	options: ResponseModeIntegrationOptions
): ResponseModeIntegrationResult => {
	const { flowKey, credentials, setCredentials, logPrefix = '[🪪 RESPONSE-MODE]' } = options;

	const [responseMode, setResponseMode] = useState<ResponseMode>('fragment');
	const [responseModeChanged, setResponseModeChanged] = useState(false);

	// Logging helper
	const log = useCallback(
		(level: 'info' | 'warn' | 'error', message: string, ...args: any[]) => {
			const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
			console[level](`${timestamp} ${logPrefix} [${level.toUpperCase()}]`, message, ...args);
		},
		[logPrefix]
	);

	// Update credentials with current response mode
	const updateCredentialsWithResponseMode = useCallback(() => {
		if (!credentials || !responseMode) {
			log('warn', 'Cannot update credentials: missing credentials or response mode');
			return;
		}

		const updatedCredentials = {
			...credentials,
			responseMode: responseMode,
		};

		setCredentials(updatedCredentials);
		log('info', `Updated credentials with response mode: ${responseMode}`, {
			flowKey,
			responseMode,
			hasClientId: !!credentials.clientId,
			hasEnvironmentId: !!credentials.environmentId,
		});
	}, [credentials, responseMode, setCredentials, flowKey, log]);

	// Clear authorization URL when response mode changes
	const clearAuthUrl = useCallback(() => {
		// This will be implemented by individual flows that need to clear their auth URL
		log('info', 'Response mode changed - auth URL should be cleared', { flowKey, responseMode });
	}, [flowKey, responseMode, log]);

	// Handle response mode changes
	const handleResponseModeChange = useCallback(
		(mode: ResponseMode) => {
			log('info', `Response mode changing from ${responseMode} to ${mode}`, {
				flowKey,
				previousMode: responseMode,
				newMode: mode,
			});

			setResponseMode(mode);
			setResponseModeChanged(true);

			// Update credentials immediately
			if (credentials) {
				const updatedCredentials = {
					...credentials,
					responseMode: mode,
				};
				setCredentials(updatedCredentials);
				log('info', 'Credentials updated immediately with new response mode', {
					flowKey,
					responseMode: mode,
				});
			}
		},
		[responseMode, credentials, setCredentials, flowKey, log]
	);

	// Auto-update credentials when response mode changes (backup mechanism)
	useEffect(() => {
		if (responseModeChanged && credentials) {
			updateCredentialsWithResponseMode();
			setResponseModeChanged(false); // Reset the changed flag
		}
	}, [responseModeChanged, credentials, updateCredentialsWithResponseMode]);

	return {
		responseMode,
		setResponseMode: handleResponseModeChange,
		responseModeChanged,
		setResponseModeChanged,
		updateCredentialsWithResponseMode,
		clearAuthUrl,
	};
};

/**
 * Helper function to add response_mode parameter to URL parameters
 * This can be used by any flow's URL generation logic
 */
export const addResponseModeToUrlParams = (
	params: URLSearchParams,
	responseMode: ResponseMode
): URLSearchParams => {
	// Only add response_mode if it's not the default fragment mode
	if (responseMode && responseMode !== 'fragment') {
		params.set('response_mode', responseMode);
	}
	return params;
};

/**
 * Helper function to get default response mode for a flow type
 */
export const getDefaultResponseMode = (flowType: string): ResponseMode => {
	switch (flowType) {
		case 'authorization-code':
		case 'oidc-authorization-code':
			return 'query';
		case 'implicit':
		case 'oidc-implicit':
			return 'fragment';
		case 'hybrid':
		case 'oidc-hybrid':
			return 'fragment';
		case 'redirectless':
			return 'pi.flow';
		default:
			return 'fragment';
	}
};

/**
 * Helper function to check if a flow supports response mode selection
 */
export const supportsResponseModeSelection = (flowType: string): boolean => {
	const supportedFlows = [
		'authorization-code',
		'oidc-authorization-code',
		'implicit',
		'oidc-implicit',
		'hybrid',
		'oidc-hybrid',
		'redirectless',
	];
	return supportedFlows.includes(flowType);
};

export default useResponseModeIntegration;
