// src/services/flowRedirectUriService.ts
// Service for managing flow-specific redirect URIs using centralized mapping

import {
	type FlowRedirectUriConfig,
	flowRequiresRedirectUri,
	getFlowRedirectUriConfig,
} from '../utils/flowRedirectUriMapping';
import { callbackUriService } from './callbackUriService';

/**
 * Service for managing OAuth/OIDC flow redirect URIs
 */
export class FlowRedirectUriService {
	/**
	 * Get the default redirect URI for a flow type
	 * @param flowType - The flow type identifier
	 * @returns The redirect URI or null if not required
	 */
	static getDefaultRedirectUri(flowType: string): string | null {
		const config = getFlowRedirectUriConfig(flowType);

		if (config && !config.requiresRedirectUri) {
			return null;
		}

		const { redirectUri } = callbackUriService.getCallbackUriForFlow(flowType);
		return redirectUri || null;
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
		if (customRedirectUri?.trim()) {
			return customRedirectUri;
		}

		const defaultUri = FlowRedirectUriService.getDefaultRedirectUri(flowType);

		if (!defaultUri) {
			return null;
		}

		if (!baseUrl) {
			return defaultUri;
		}

		try {
			const defaultUrl = new URL(defaultUri);
			const targetBase = new URL(baseUrl, defaultUrl.origin);
			return `${targetBase.origin}${defaultUrl.pathname}`;
		} catch (error) {
			console.warn('[FlowRedirectUriService] Failed to remap redirect URI base:', error);
			return defaultUri;
		}
	}

	/**
	 * Validate a redirect URI against the flow's expected pattern
	 * @param flowType - The flow type identifier
	 * @param redirectUri - The redirect URI to validate
	 * @returns true if the redirect URI is valid for this flow
	 */
	static validateRedirectUri(flowType: string, redirectUri: string): boolean {
		const config = FlowRedirectUriService.getFlowConfig(flowType);

		if (!config || !config.requiresRedirectUri) {
			return true;
		}

		const expectedUri = FlowRedirectUriService.getDefaultRedirectUri(flowType);

		if (!expectedUri) {
			return true;
		}

		try {
			const expectedUrl = new URL(expectedUri);
			const providedUrl = new URL(redirectUri, expectedUrl.origin);
			return expectedUrl.href === providedUrl.href;
		} catch (error) {
			console.warn(
				'[FlowRedirectUriService] Failed to normalise redirect URI for validation:',
				error
			);
			return false;
		}
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
		return FlowRedirectUriService.getRedirectUri(flowType, credentials.redirectUri, baseUrl);
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
		return FlowRedirectUriService.getAuthorizationRedirectUri(flowType, credentials, baseUrl);
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
		const config = FlowRedirectUriService.getFlowConfig(flowType);
		const defaultUri = FlowRedirectUriService.getDefaultRedirectUri(flowType);
		const finalUri = FlowRedirectUriService.getRedirectUri(
			flowType,
			credentials.redirectUri,
			baseUrl
		);

		console.log(`[FlowRedirectUriService] Flow: ${flowType}`, {
			flowConfig: config,
			requiresRedirectUri: config?.requiresRedirectUri || false,
			customRedirectUri: credentials.redirectUri || 'none',
			defaultRedirectUri: defaultUri || 'none',
			finalRedirectUri: finalUri || 'none',
			baseUrl: baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'unknown'),
		});
	}
}
