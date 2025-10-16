// src/utils/flowNavigation.ts
// Utility for handling flow navigation and step restoration

export interface FlowNavigationState {
	flowSource: string;
	stepIndex: number;
	flowType: string;
	timestamp: number;
}

export const FLOW_ROUTE_MAP: Record<string, string> = {
	'oauth-authorization-code-v5': '/flows/oauth-authorization-code-v5',
	'oidc-authorization-code-v5': '/flows/oidc-authorization-code-v5',
	'client-credentials-v5': '/flows/client-credentials-v5',
	'oauth-implicit-v5': '/flows/oauth-implicit-v5',
	'oidc-implicit-v5': '/flows/oidc-implicit-v5',
	'hybrid-v5': '/flows/oidc-hybrid-v5',
	'device-authorization-v6': '/flows/device-authorization-v6',
	'oidc-device-authorization-v6': '/flows/oidc-device-authorization-v6',
	'ciba-v6': '/flows/ciba-v6',
	'redirectless-v5': '/flows/redirectless-flow-v5',
	'oauth-resource-owner-password-v5': '/flows/oauth-resource-owner-password-v5',
	'oidc-resource-owner-password-v5': '/flows/oidc-resource-owner-password-v5',
	'oauth2-resource-owner-password': '/flows/oauth2-resource-owner-password',
	'worker-token-v5': '/flows/worker-token-v5',
};

export const FLOW_DISPLAY_NAMES: Record<string, string> = {
	'oauth-authorization-code-v5': 'OAuth Authorization Code Flow',
	'oidc-authorization-code-v5': 'OIDC Authorization Code Flow',
	'client-credentials-v5': 'Client Credentials Flow',
	'oauth-implicit-v5': 'OAuth Implicit Flow',
	'oidc-implicit-v5': 'OIDC Implicit Flow',
	'hybrid-v5': 'OIDC Hybrid Flow',
	'device-authorization-v6': 'Device Authorization Flow V6',
	'oidc-device-authorization-v6': 'OIDC Device Authorization Flow V6',
	'ciba-v6': 'CIBA Flow (Mock)',
	'redirectless-v5': 'Redirectless Flow',
	'oauth-resource-owner-password-v5': 'OAuth Resource Owner Password Flow',
	'oidc-resource-owner-password-v5': 'OIDC Resource Owner Password Flow',
	'oauth2-resource-owner-password': 'OAuth2 Resource Owner Password Flow',
	'worker-token-v5': 'Worker Token Flow',
};

/**
 * Store flow navigation state when navigating to token management
 */
export const storeFlowNavigationState = (
	flowSource: string,
	stepIndex: number,
	flowType: string = 'oauth'
): void => {
	const navigationState: FlowNavigationState = {
		flowSource,
		stepIndex,
		flowType,
		timestamp: Date.now(),
	};

	// Store in both localStorage and sessionStorage for cross-tab compatibility
	localStorage.setItem('flow_navigation_state', JSON.stringify(navigationState));
	sessionStorage.setItem('flow_navigation_state', JSON.stringify(navigationState));

	console.log('🔗 [FlowNavigation] Stored navigation state:', navigationState);
};

/**
 * Retrieve flow navigation state
 */
export const getFlowNavigationState = (): FlowNavigationState | null => {
	try {
		// Try localStorage first, then sessionStorage
		const stored =
			localStorage.getItem('flow_navigation_state') ||
			sessionStorage.getItem('flow_navigation_state');

		if (!stored) return null;

		const navigationState = JSON.parse(stored) as FlowNavigationState;

		// Check if the state is not too old (24 hours)
		const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
		if (Date.now() - navigationState.timestamp > maxAge) {
			clearFlowNavigationState();
			return null;
		}

		return navigationState;
	} catch (error) {
		console.error('🔗 [FlowNavigation] Error parsing navigation state:', error);
		return null;
	}
};

/**
 * Clear flow navigation state
 */
export const clearFlowNavigationState = (): void => {
	localStorage.removeItem('flow_navigation_state');
	sessionStorage.removeItem('flow_navigation_state');
	console.log('🔗 [FlowNavigation] Cleared navigation state');
};

/**
 * Get the route for a flow source
 */
export const getFlowRoute = (flowSource: string): string => {
	return FLOW_ROUTE_MAP[flowSource] || '/flows';
};

/**
 * Get the display name for a flow source
 */
export const getFlowDisplayName = (flowSource: string): string => {
	return FLOW_DISPLAY_NAMES[flowSource] || 'OAuth Flow';
};

/**
 * Navigate back to the originating flow with the correct step
 */
export const navigateBackToFlow = (navigate: (path: string) => void): boolean => {
	const navigationState = getFlowNavigationState();

	if (!navigationState) {
		console.warn('🔗 [FlowNavigation] No navigation state found');
		return false;
	}

	const route = getFlowRoute(navigationState.flowSource);

	// Store the step to restore in the flow
	sessionStorage.setItem('restore_step', navigationState.stepIndex.toString());

	console.log('🔗 [FlowNavigation] Navigating back to flow:', {
		flowSource: navigationState.flowSource,
		stepIndex: navigationState.stepIndex,
		route,
	});

	navigate(route);
	return true;
};
