// src/services/authorizationRequestService.ts
// Shared helpers for building and managing PingOne authorization requests

import { addResponseModeToUrlParams, ResponseMode } from './responseModeIntegrationService';

export type AuthorizationEndpointConfig = {
	environmentId?: string;
	baseUrlOverride?: string;
};

export type AuthorizationRequestConfig = {
	clientId: string;
	redirectUri?: string;
	scope: string;
	state: string;
	responseType?: string;
	responseMode?: ResponseMode;
	nonce?: string;
	codeChallenge?: string;
	codeChallengeMethod?: 'S256' | 'plain';
	extraParams?: Record<string, string | undefined | null>;
	requestUri?: string;
};

export interface AuthorizationRequestResult {
	url: string;
	endpoint: string;
	params: URLSearchParams;
}

const DEFAULT_REGION_BASE = 'https://auth.pingone.com';

/**
 * Resolve the PingOne authorization endpoint for a flow.
 */
export const resolveAuthorizationEndpoint = (
	config: AuthorizationEndpointConfig
): string => {
	if (config.baseUrlOverride) {
		return config.baseUrlOverride;
	}

	if (!config.environmentId) {
		throw new Error('Missing environmentId for authorization endpoint resolution.');
	}

	return `${DEFAULT_REGION_BASE}/${config.environmentId}/as/authorize`;
};

/**
 * Build an authorization request URL, automatically applying response mode, PKCE, and extra parameters.
 */
export const buildAuthorizationRequest = (
	endpointConfig: AuthorizationEndpointConfig,
	reqConfig: AuthorizationRequestConfig
): AuthorizationRequestResult => {
	const endpoint = resolveAuthorizationEndpoint(endpointConfig);

	if (!reqConfig.clientId) {
		throw new Error('Cannot build authorization URL without clientId.');
	}

	if (!reqConfig.requestUri && !reqConfig.redirectUri) {
		throw new Error('redirectUri is required when request_uri is not provided.');
	}

	const params = new URLSearchParams();

	if (reqConfig.requestUri) {
		params.set('client_id', reqConfig.clientId.trim());
		params.set('request_uri', reqConfig.requestUri.trim());
	} else {
		params.set('client_id', reqConfig.clientId.trim());
		params.set('redirect_uri', (reqConfig.redirectUri ?? '').trim());
		params.set('response_type', (reqConfig.responseType ?? 'code').trim());
		params.set('scope', reqConfig.scope.trim());
		params.set('state', reqConfig.state.trim());

		if (reqConfig.nonce) {
			params.set('nonce', reqConfig.nonce.trim());
		}

		if (reqConfig.codeChallenge) {
			params.set('code_challenge', reqConfig.codeChallenge.trim());
			params.set('code_challenge_method', (reqConfig.codeChallengeMethod ?? 'S256').trim());
		}
	}

	const responseMode = reqConfig.responseMode;
	if (responseMode) {
		addResponseModeToUrlParams(params, responseMode);
	}

	if (reqConfig.extraParams) {
		Object.entries(reqConfig.extraParams).forEach(([key, value]) => {
			if (value === undefined || value === null || value === '') {
				return;
			}
			params.set(key, value);
		});
	}

	const url = `${endpoint}?${params.toString()}`;

	return {
		url,
		endpoint,
		params,
	};
};

/**
 * Helper to merge additional parameters into an existing authorization request.
 */
export const mergeAuthorizationParams = (
	params: URLSearchParams,
	extra: Record<string, string | undefined | null>
) => {
	Object.entries(extra).forEach(([key, value]) => {
		if (!value) return;
		params.set(key, value);
	});

	return params;
};
