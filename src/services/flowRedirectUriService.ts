// src/services/flowRedirectUriService.ts
// Service for managing flow-specific redirect URIs using centralized mapping

import { 
	generateRedirectUriForFlow, 
	getFlowRedirectUriConfig, 
	flowRequiresRedirectUri,
	type FlowRedirectUriConfig 
} from '../utils/flowRedirectUriMapping';

/**
 * Service for managing OAuth/OIDC flow redirect URIs
 */
export class FlowRedirectUriService {
	/**
	 * Get the default redirect URI for a flow type
	 * @param flowType - The flow type identifier
	 * @param baseUrl - Optional base URL (defaults to window.location.origin)
	 * @returns The redirect URI or null if not required
	 */
	static getDefaultRedirectUri(flowType: string, baseUrl?: string): string | null {
		return generateRedirectUriForFlow(flowType, baseUrl);
	}

	/**
	 * Get the flow configuration for a specific flow type
	 * @param flowType - The flow type identifier
	 * @returns The flow configuration or null if not found
	 */
	static getFlowConfig(flowType: string): FlowRedirectUriConfig | null {
		return getFlowRedirectUriConfig(flowType);
	}

	/**
	 * Check if a flow type requires a redirect URI
	 * @param flowType - The flow type identifier
	 * @returns true if the flow requires a redirect URI
	 */
	static requiresRedirectUri(flowType: string): boolean {
		return flowRequiresRedirectUri(flowType);
	}

	/**
	 * Get redirect URI with fallback for a flow type
	 * @param flowType - The flow type identifier
	 * @param customRedirectUri - Custom redirect URI to use if provided
	 * @param baseUrl - Optional base URL (defaults to window.location.origin)
	 * @returns The redirect URI (custom or default)
	 */
	static getRedirectUri(
		flowType: string, 
		customRedirectUri?: string, 
		baseUrl?: string
	): string | null {
		// If custom redirect URI is provided and valid, use it
		if (customRedirectUri && customRedirectUri.trim()) {
			return customRedirectUri;
		}

		// Otherwise, use the default for this flow type
		return this.getDefaultRedirectUri(flowType, baseUrl);
	}

	/**
	 * Validate a redirect URI against the flow's expected pattern
	 * @param flowType - The flow type identifier
	 * @param redirectUri - The redirect URI to validate
	 * @param baseUrl - Optional base URL for validation
	 * @returns true if the redirect URI is valid for this flow
	 */
	static validateRedirectUri(
		flowType: string, 
		redirectUri: string, 
		baseUrl?: string
	): boolean {
		const config = this.getFlowConfig(flowType);
		
		// If flow doesn't require redirect URI, any URI is valid
		if (!config || !config.requiresRedirectUri) {
			return true;
		}

		// Get expected redirect URI
		const expectedUri = this.getDefaultRedirectUri(flowType, baseUrl);
		
		// If we can't determine expected URI, consider it valid
		if (!expectedUri) {
			return true;
		}

		// Check if the provided URI matches the expected pattern
		const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://localhost:3000');
		const expectedPath = expectedUri.replace(base, '');
		const providedPath = redirectUri.replace(base, '');

		return providedPath === expectedPath;
	}

	/**
	 * Get redirect URI for use in authorization URL generation
	 * @param flowType - The flow type identifier
	 * @param credentials - Flow credentials object
	 * @param baseUrl - Optional base URL
	 * @returns The redirect URI to use in authorization requests
	 */
	static getAuthorizationRedirectUri(
		flowType: string,
		credentials: { redirectUri?: string },
		baseUrl?: string
	): string | null {
		return this.getRedirectUri(flowType, credentials.redirectUri, baseUrl);
	}

	/**
	 * Get redirect URI for use in token exchange requests
	 * @param flowType - The flow type identifier
	 * @param credentials - Flow credentials object
	 * @param baseUrl - Optional base URL
	 * @returns The redirect URI to use in token requests
	 */
	static getTokenExchangeRedirectUri(
		flowType: string,
		credentials: { redirectUri?: string },
		baseUrl?: string
	): string | null {
		// For token exchange, we need the exact same URI used in authorization
		return this.getAuthorizationRedirectUri(flowType, credentials, baseUrl);
	}

	/**
	 * Log redirect URI information for debugging
	 * @param flowType - The flow type identifier
	 * @param credentials - Flow credentials object
	 * @param baseUrl - Optional base URL
	 */
	static logRedirectUriInfo(
		flowType: string,
		credentials: { redirectUri?: string },
		baseUrl?: string
	): void {
		const config = this.getFlowConfig(flowType);
		const defaultUri = this.getDefaultRedirectUri(flowType, baseUrl);
		const finalUri = this.getRedirectUri(flowType, credentials.redirectUri, baseUrl);

		console.log(`[FlowRedirectUriService] Flow: ${flowType}`, {
			flowConfig: config,
			requiresRedirectUri: config?.requiresRedirectUri || false,
			customRedirectUri: credentials.redirectUri || 'none',
			defaultRedirectUri: defaultUri || 'none',
			finalRedirectUri: finalUri || 'none',
			baseUrl: baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'unknown')
		});
	}
}
