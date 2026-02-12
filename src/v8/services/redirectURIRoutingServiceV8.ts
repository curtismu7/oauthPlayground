/**
 * Redirect URI Routing Service
 * 
 * SWE-15 Compliant service for handling redirect URI preservation and table-based step routing.
 * Follows Single Responsibility Principle by separating URI preservation from routing logic.
 */

import { useCallback } from 'react';

// Redirect URI routing table based on inventory documentation
interface RedirectURIRouteEntry {
	redirectUri: string;
	flowType: 'registration' | 'hub' | 'legacy' | 'oauth-authz';
	returnTarget: number;
	description: string;
}

// Redirect URI reference table from UNIFIED_MFA_INVENTORY.md lines 1705, 1720, 1735
const REDIRECT_URI_ROUTING_TABLE: RedirectURIRouteEntry[] = [
	{
		redirectUri: '/mfa-unified-callback',
		flowType: 'registration',
		returnTarget: 3,
		description: 'Unified MFA registration flow'
	},
	{
		redirectUri: '/mfa-hub-callback',
		flowType: 'hub',
		returnTarget: 3,
		description: 'MFA hub registration flow'
	},
	{
		redirectUri: '/unified-mfa-callback',
		flowType: 'legacy',
		returnTarget: 2,
		description: 'Legacy unified MFA flow'
	},
	{
		redirectUri: '/callback',
		flowType: 'oauth-authz',
		returnTarget: 2,
		description: 'Standard OAuth authorization code flow'
	},
	{
		redirectUri: '/user-login-callback',
		flowType: 'oauth-authz',
		returnTarget: 2,
		description: 'User authentication flows'
	},
	{
		redirectUri: '/authz-callback',
		flowType: 'oauth-authz',
		returnTarget: 2,
		description: 'Standard OAuth flows'
	}
];

export interface RedirectURIRoutingResult {
	targetStep: number;
	flowType: string;
	originalUri: string;
	routeEntry?: RedirectURIRouteEntry;
}

/**
 * Determines flow type from redirect URI pattern
 * Single Responsibility: Flow type detection logic
 */
const determineFlowType = (redirectUri: string): string => {
	if (redirectUri.includes('mfa-unified')) return 'registration';
	if (redirectUri.includes('mfa-hub')) return 'hub';
	if (redirectUri.includes('unified-mfa')) return 'legacy';
	if (redirectUri.includes('callback') || redirectUri.includes('authz')) return 'oauth-authz';
	return 'unknown';
};

/**
 * Gets default step for unknown redirect URIs
 * Open/Closed Principle: Can be extended without modifying existing logic
 */
const getDefaultStep = (redirectUri: string): number => {
	// Default to step 2 for OAuth flows, step 3 for MFA flows
	const flowType = determineFlowType(redirectUri);
	return flowType.includes('mfa') ? 3 : 2;
};

/**
 * Hook for redirect URI preservation and table-based routing
 * Dependency Inversion: Depends on abstractions (routing table) not concretions
 */
export const useRedirectURIRouting = () => {
	/**
	 * Routes to correct step based on redirect URI using lookup table
	 * Single Responsibility: URI preservation and routing logic
	 */
	const routeToCorrectStep = useCallback((redirectUri: string): RedirectURIRoutingResult => {
		// Preserve original redirect URI from PingOne - DO NOT MODIFY
		const originalUri = redirectUri;
		
		// Extract path from full URI if needed
		const uriPath = originalUri.includes(window.location.host) 
			? new URL(originalUri).pathname 
			: originalUri;
		
		// Consult redirect URI reference tables
		const routeEntry = REDIRECT_URI_ROUTING_TABLE.find(entry => 
			uriPath.includes(entry.redirectUri) || entry.redirectUri.includes(uriPath)
		);
		
		if (routeEntry) {
			console.log(`[RedirectURIRouting] ✅ Found route entry for ${uriPath}`, {
				routeEntry: routeEntry.description,
				targetStep: routeEntry.returnTarget,
				flowType: routeEntry.flowType
			});
			
			return {
				targetStep: routeEntry.returnTarget,
				flowType: routeEntry.flowType,
				originalUri: originalUri, // Preserve for debugging
				routeEntry: routeEntry
			};
		}
		
		// Fallback to default routing
		const defaultStep = getDefaultStep(uriPath);
		const defaultFlowType = determineFlowType(uriPath);
		
		console.warn(`[RedirectURIRouting] ⚠️ No route entry found for ${uriPath}, using default`, {
			defaultStep,
			flowType: defaultFlowType
		});
		
		return {
			targetStep: defaultStep,
			flowType: defaultFlowType,
			originalUri: originalUri
		};
	}, []);

	/**
	 * Validates redirect URI against known table entries
 * Interface Segregation: Focused validation interface
	 */
	const validateRedirectURI = useCallback((redirectUri: string): boolean => {
		const uriPath = redirectUri.includes(window.location.host) 
			? new URL(redirectUri).pathname 
			: redirectUri;
		
		const isValid = REDIRECT_URI_ROUTING_TABLE.some(entry => 
			uriPath.includes(entry.redirectUri) || entry.redirectUri.includes(uriPath)
		);
		
		console.log(`[RedirectURIRouting] Validation for ${uriPath}: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
		return isValid;
	}, []);

	/**
	 * Gets all available redirect URI routes for debugging
	 * Open/Closed Principle: Easy to extend without modifying
	 */
	const getAllRoutes = useCallback((): RedirectURIRouteEntry[] => {
		return [...REDIRECT_URI_ROUTING_TABLE];
	}, []);

	return {
		routeToCorrectStep,
		validateRedirectURI,
		getAllRoutes
	};
};

/**
 * Service for direct access (non-hook usage)
 * Liskov Substitution: Consistent interface across usage patterns
 */
export const RedirectURIRoutingService = {
	routeToCorrectStep: (redirectUri: string): RedirectURIRoutingResult => {
		const { routeToCorrectStep } = useRedirectURIRouting();
		return routeToCorrectStep(redirectUri);
	},
	
	validateRedirectURI: (redirectUri: string): boolean => {
		const { validateRedirectURI } = useRedirectURIRouting();
		return validateRedirectURI(redirectUri);
	},
	
	getAllRoutes: (): RedirectURIRouteEntry[] => {
		const { getAllRoutes } = useRedirectURIRouting();
		return getAllRoutes();
	}
};
