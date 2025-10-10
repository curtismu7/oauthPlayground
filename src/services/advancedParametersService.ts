// src/services/advancedParametersService.ts
// Service for adding advanced OAuth/OIDC parameters to authorization URLs

import { DisplayMode } from '../components/DisplayParameterSelector';
import { ClaimsRequestStructure } from '../components/ClaimsRequestBuilder';

export interface AdvancedOAuthParameters {
	display?: DisplayMode;
	claims?: ClaimsRequestStructure | null;
	uiLocales?: string;
	claimsLocales?: string;
	audience?: string;
	resource?: string[];
	prompt?: string;
	maxAge?: number;
	idTokenHint?: string;
	acrValues?: string;
}

/**
 * Advanced Parameters Service
 * 
 * Enhances authorization URLs with advanced OAuth/OIDC parameters
 * without requiring controller refactoring.
 * 
 * Supports:
 * - Display parameter (OIDC)
 * - Claims request (OIDC/OAuth)
 * - UI/Claims locales (OIDC)
 * - Audience (OAuth/OIDC)
 * - Resource indicators (OAuth/OIDC)
 * - Prompt, max_age, etc.
 */
export class AdvancedParametersService {
	/**
	 * Add advanced parameters to an existing authorization URL
	 */
	static enhanceAuthorizationUrl(
		baseUrl: string,
		parameters: AdvancedOAuthParameters
	): string {
		try {
			const url = new URL(baseUrl);
			const params = url.searchParams;

			// Display parameter (OIDC only, skip if 'page' default)
			if (parameters.display && parameters.display !== 'page') {
				params.set('display', parameters.display);
			}

			// Claims parameter (OIDC/OAuth)
			if (parameters.claims && this.isValidClaims(parameters.claims)) {
				params.set('claims', JSON.stringify(parameters.claims));
			}

			// UI Locales (OIDC only)
			if (parameters.uiLocales && parameters.uiLocales.trim()) {
				params.set('ui_locales', parameters.uiLocales.trim());
			}

			// Claims Locales (OIDC only)
			if (parameters.claimsLocales && parameters.claimsLocales.trim()) {
				params.set('claims_locales', parameters.claimsLocales.trim());
			}

			// Audience (OAuth/OIDC)
			if (parameters.audience && parameters.audience.trim()) {
				params.set('audience', parameters.audience.trim());
			}

			// Resource indicators (OAuth/OIDC) - can have multiple
			if (parameters.resource && parameters.resource.length > 0) {
				parameters.resource.forEach(res => {
					if (res.trim()) {
						params.append('resource', res.trim());
					}
				});
			}

			// Prompt (OIDC only)
			if (parameters.prompt && parameters.prompt.trim()) {
				params.set('prompt', parameters.prompt.trim());
			}

			// Max Age (OIDC only)
			if (parameters.maxAge !== undefined && parameters.maxAge > 0) {
				params.set('max_age', parameters.maxAge.toString());
			}

			// ID Token Hint (OIDC only)
			if (parameters.idTokenHint && parameters.idTokenHint.trim()) {
				params.set('id_token_hint', parameters.idTokenHint.trim());
			}

			// ACR Values (OIDC only)
			if (parameters.acrValues && parameters.acrValues.trim()) {
				params.set('acr_values', parameters.acrValues.trim());
			}

			return url.toString();
		} catch (error) {
			console.error('[AdvancedParametersService] Failed to enhance URL:', error);
			return baseUrl; // Return original URL if enhancement fails
		}
	}

	/**
	 * Validate claims request structure
	 */
	private static isValidClaims(claims: ClaimsRequestStructure): boolean {
		if (!claims || typeof claims !== 'object') return false;
		
		// Must have at least one location (userinfo or id_token)
		const hasUserInfo = claims.userinfo && Object.keys(claims.userinfo).length > 0;
		const hasIdToken = claims.id_token && Object.keys(claims.id_token).length > 0;
		
		return hasUserInfo || hasIdToken;
	}

	/**
	 * Extract advanced parameters from a URL
	 */
	static extractFromUrl(url: string): Partial<AdvancedOAuthParameters> {
		try {
			const urlObj = new URL(url);
			const params = urlObj.searchParams;
			const extracted: Partial<AdvancedOAuthParameters> = {};

			// Display
			const display = params.get('display');
			if (display && this.isValidDisplayMode(display)) {
				extracted.display = display;
			}

			// Claims
			const claims = params.get('claims');
			if (claims) {
				try {
					const parsed = JSON.parse(claims);
					if (this.isValidClaims(parsed)) {
						extracted.claims = parsed;
					}
				} catch {
					// Invalid JSON, skip
				}
			}

			// Locales
			const uiLocales = params.get('ui_locales');
			if (uiLocales) extracted.uiLocales = uiLocales;

			const claimsLocales = params.get('claims_locales');
			if (claimsLocales) extracted.claimsLocales = claimsLocales;

			// Audience
			const audience = params.get('audience');
			if (audience) extracted.audience = audience;

			// Resources (can be multiple)
			const resources = params.getAll('resource');
			if (resources.length > 0) extracted.resource = resources;

			// Other parameters
			const prompt = params.get('prompt');
			if (prompt) extracted.prompt = prompt;

			const maxAge = params.get('max_age');
			if (maxAge) extracted.maxAge = parseInt(maxAge, 10);

			const idTokenHint = params.get('id_token_hint');
			if (idTokenHint) extracted.idTokenHint = idTokenHint;

			const acrValues = params.get('acr_values');
			if (acrValues) extracted.acrValues = acrValues;

			return extracted;
		} catch (error) {
			console.error('[AdvancedParametersService] Failed to extract from URL:', error);
			return {};
		}
	}

	/**
	 * Validate display mode
	 */
	private static isValidDisplayMode(value: string): value is DisplayMode {
		return ['page', 'popup', 'touch', 'wap'].includes(value);
	}

	/**
	 * Get summary of active parameters
	 */
	static getSummary(parameters: AdvancedOAuthParameters): string[] {
		const summary: string[] = [];

		if (parameters.display && parameters.display !== 'page') {
			summary.push(`Display: ${parameters.display}`);
		}

		if (parameters.claims && this.isValidClaims(parameters.claims)) {
			const locations = [];
			if (parameters.claims.userinfo) locations.push('UserInfo');
			if (parameters.claims.id_token) locations.push('ID Token');
			summary.push(`Claims requested in: ${locations.join(', ')}`);
		}

		if (parameters.uiLocales) {
			summary.push(`UI Languages: ${parameters.uiLocales}`);
		}

		if (parameters.claimsLocales) {
			summary.push(`Claim Languages: ${parameters.claimsLocales}`);
		}

		if (parameters.audience) {
			summary.push(`Audience: ${parameters.audience}`);
		}

		if (parameters.resource && parameters.resource.length > 0) {
			summary.push(`Resources: ${parameters.resource.length} specified`);
		}

		if (parameters.prompt) {
			summary.push(`Prompt: ${parameters.prompt}`);
		}

		if (parameters.maxAge) {
			summary.push(`Max Age: ${parameters.maxAge}s`);
		}

		return summary;
	}

	/**
	 * Check if any advanced parameters are set
	 */
	static hasAnyParameters(parameters: AdvancedOAuthParameters): boolean {
		return (
			(parameters.display !== undefined && parameters.display !== 'page') ||
			(parameters.claims !== null && this.isValidClaims(parameters.claims)) ||
			(parameters.uiLocales !== undefined && parameters.uiLocales.trim() !== '') ||
			(parameters.claimsLocales !== undefined && parameters.claimsLocales.trim() !== '') ||
			(parameters.audience !== undefined && parameters.audience.trim() !== '') ||
			(parameters.resource !== undefined && parameters.resource.length > 0) ||
			(parameters.prompt !== undefined && parameters.prompt.trim() !== '') ||
			(parameters.maxAge !== undefined && parameters.maxAge > 0) ||
			(parameters.idTokenHint !== undefined && parameters.idTokenHint.trim() !== '') ||
			(parameters.acrValues !== undefined && parameters.acrValues.trim() !== '')
		);
	}
}

export default AdvancedParametersService;

