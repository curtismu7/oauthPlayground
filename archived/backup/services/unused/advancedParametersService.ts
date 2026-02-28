// src/services/advancedParametersService.ts
// Service for adding advanced OAuth/OIDC parameters to authorization URLs

import { ClaimsRequestStructure } from '../components/ClaimsRequestBuilder';
import { DisplayMode } from '../components/DisplayParameterSelector';

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

const isValidDisplayMode = (value: string): value is DisplayMode =>
	['page', 'popup', 'touch', 'wap'].includes(value);

const isValidClaims = (claims: ClaimsRequestStructure): boolean => {
	if (!claims || typeof claims !== 'object') {
		return false;
	}

	const hasUserInfo = Boolean(claims.userinfo && Object.keys(claims.userinfo).length > 0);
	const hasIdToken = Boolean(claims.id_token && Object.keys(claims.id_token).length > 0);

	return hasUserInfo || hasIdToken;
};

const enhanceAuthorizationUrl = (baseUrl: string, parameters: AdvancedOAuthParameters): string => {
	try {
		const url = new URL(baseUrl);
		const params = url.searchParams;

		if (parameters.display && parameters.display !== 'page') {
			params.set('display', parameters.display);
		}

		if (parameters.claims && isValidClaims(parameters.claims)) {
			params.set('claims', JSON.stringify(parameters.claims));
		}

		if (parameters.uiLocales?.trim()) {
			params.set('ui_locales', parameters.uiLocales.trim());
		}

		if (parameters.claimsLocales?.trim()) {
			params.set('claims_locales', parameters.claimsLocales.trim());
		}

		if (parameters.audience?.trim()) {
			params.set('audience', parameters.audience.trim());
		}

		if (parameters.resource?.length) {
			parameters.resource.forEach((res) => {
				if (res.trim()) {
					params.append('resource', res.trim());
				}
			});
		}

		if (parameters.prompt?.trim()) {
			params.set('prompt', parameters.prompt.trim());
		}

		if (parameters.maxAge && parameters.maxAge > 0) {
			params.set('max_age', parameters.maxAge.toString());
		}

		if (parameters.idTokenHint?.trim()) {
			params.set('id_token_hint', parameters.idTokenHint.trim());
		}

		if (parameters.acrValues?.trim()) {
			params.set('acr_values', parameters.acrValues.trim());
		}

		return url.toString();
	} catch (error) {
		console.error('[AdvancedParametersService] Failed to enhance URL:', error);
		return baseUrl;
	}
};

const extractFromUrl = (url: string): Partial<AdvancedOAuthParameters> => {
	try {
		const urlObj = new URL(url);
		const params = urlObj.searchParams;
		const extracted: Partial<AdvancedOAuthParameters> = {};

		const display = params.get('display');
		if (display && isValidDisplayMode(display)) {
			extracted.display = display;
		}

		const claims = params.get('claims');
		if (claims) {
			try {
				const parsed = JSON.parse(claims) as ClaimsRequestStructure;
				if (isValidClaims(parsed)) {
					extracted.claims = parsed;
				}
			} catch {
				// Ignore invalid JSON
			}
		}

		const uiLocales = params.get('ui_locales');
		if (uiLocales) {
			extracted.uiLocales = uiLocales;
		}

		const claimsLocales = params.get('claims_locales');
		if (claimsLocales) {
			extracted.claimsLocales = claimsLocales;
		}

		const audience = params.get('audience');
		if (audience) {
			extracted.audience = audience;
		}

		const resources = params.getAll('resource');
		if (resources.length > 0) {
			extracted.resource = resources;
		}

		const prompt = params.get('prompt');
		if (prompt) {
			extracted.prompt = prompt;
		}

		const maxAge = params.get('max_age');
		if (maxAge) {
			const parsed = Number.parseInt(maxAge, 10);
			if (!Number.isNaN(parsed)) {
				extracted.maxAge = parsed;
			}
		}

		const idTokenHint = params.get('id_token_hint');
		if (idTokenHint) {
			extracted.idTokenHint = idTokenHint;
		}

		const acrValues = params.get('acr_values');
		if (acrValues) {
			extracted.acrValues = acrValues;
		}

		return extracted;
	} catch (error) {
		console.error('[AdvancedParametersService] Failed to extract from URL:', error);
		return {};
	}
};

const getSummary = (parameters: AdvancedOAuthParameters): string[] => {
	const summary: string[] = [];

	if (parameters.display && parameters.display !== 'page') {
		summary.push(`Display: ${parameters.display}`);
	}

	if (parameters.claims && isValidClaims(parameters.claims)) {
		const locations: string[] = [];
		if (parameters.claims.userinfo) {
			locations.push('UserInfo');
		}
		if (parameters.claims.id_token) {
			locations.push('ID Token');
		}
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

	if (parameters.resource?.length) {
		summary.push(`Resources: ${parameters.resource.length} specified`);
	}

	if (parameters.prompt) {
		summary.push(`Prompt: ${parameters.prompt}`);
	}

	if (parameters.maxAge) {
		summary.push(`Max Age: ${parameters.maxAge}s`);
	}

	return summary;
};

const hasAnyParameters = (parameters: AdvancedOAuthParameters): boolean =>
	Boolean(
		(parameters.display && parameters.display !== 'page') ||
			(parameters.claims && isValidClaims(parameters.claims)) ||
			parameters.uiLocales?.trim() ||
			parameters.claimsLocales?.trim() ||
			parameters.audience?.trim() ||
			(parameters.resource && parameters.resource.length > 0) ||
			parameters.prompt?.trim() ||
			(parameters.maxAge && parameters.maxAge > 0) ||
			parameters.idTokenHint?.trim() ||
			parameters.acrValues?.trim()
	);

export { enhanceAuthorizationUrl, extractFromUrl, getSummary, hasAnyParameters };

export const AdvancedParametersService = {
	enhanceAuthorizationUrl,
	extractFromUrl,
	getSummary,
	hasAnyParameters,
};

export default AdvancedParametersService;
