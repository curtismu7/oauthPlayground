/**
 * @file authorizationUrlBuilderServiceV8U.ts
 * @module v8u/services
 * @description Unified authorization URL builder for all OAuth/OIDC flows
 * @version 8.0.0
 * @since 2025-11-23
 *
 * Centralizes authorization URL generation logic to eliminate duplication
 * across implicit, oauth-authz, and hybrid flows.
 */

import type { ResponseMode } from '@/services/responseModeService';
import { RedirectUriServiceV8 } from '@/v8/services/redirectUriServiceV8';
import type { FlowType, SpecVersion } from '@/v8/services/specVersionServiceV8';
import type { UnifiedFlowCredentials } from './unifiedFlowIntegrationV8U';
import { UnifiedFlowLoggerService } from './unifiedFlowLoggerServiceV8U';

const MODULE_TAG = '[🔗 AUTHORIZATION-URL-BUILDER-V8U]';

export interface AuthorizationUrlParams {
	specVersion: SpecVersion;
	flowType: FlowType;
	credentials: UnifiedFlowCredentials;
	pkceCodes?: {
		codeVerifier: string;
		codeChallenge: string;
		codeChallengeMethod: 'S256' | 'plain';
	};
	state?: string;
	nonce?: string;
}

export interface AuthorizationUrlResult {
	authorizationUrl: string;
	state: string;
	nonce?: string;
	codeVerifier?: string;
	codeChallenge?: string;
}

/**
 * AuthorizationUrlBuilderService
 *
 * Unified service for building authorization URLs across all flow types.
 * Eliminates duplication in authorization URL generation.
 */
export class AuthorizationUrlBuilderService {
	/**
	 * Get the correct redirect URI for the flow type
	 * 
	 * Prioritizes user's configured redirect URI (matches PingOne config) over auto-generated default.
	 * Only falls back to auto-generated URI if credentials.redirectUri is empty.
	 */
	private static getRedirectUri(flowType: FlowType, credentials: UnifiedFlowCredentials): string {
		const flowKey = `${flowType}-v8u`;
		const defaultRedirectUri = RedirectUriServiceV8.getRedirectUriForFlow(flowKey);
		// Prioritize user's configured redirect URI (matches PingOne config) over auto-generated default
		const redirectUriToUse = credentials.redirectUri?.trim() || defaultRedirectUri || '';

		UnifiedFlowLoggerService.debug('Redirect URI validation', {
			flowType,
			flowKey,
			credentialsRedirectUri: credentials.redirectUri,
			defaultRedirectUri,
			redirectUriToUse,
			usingConfigured: !!credentials.redirectUri?.trim(),
		});

		return redirectUriToUse;
	}

	/**
	 * Get response mode for the flow
	 */
	private static getResponseMode(
		flowType: FlowType,
		credentials: UnifiedFlowCredentials
	): ResponseMode {
		// Use explicit responseMode if provided
		if (credentials.responseMode) {
			return credentials.responseMode;
		}

		// Legacy: useRedirectless flag
		if (credentials.useRedirectless) {
			return 'pi.flow';
		}

		// Default response modes by flow type
		switch (flowType) {
			case 'implicit':
			case 'hybrid':
				return 'fragment';
			case 'oauth-authz':
				return 'query';
			default:
				return 'query';
		}
	}

	/**
	 * Build base authorization URL parameters
	 */
	private static buildBaseParams(
		flowType: FlowType,
		credentials: UnifiedFlowCredentials,
		state: string,
		redirectUri: string
	): URLSearchParams {
		const params = new URLSearchParams();

		params.set('client_id', credentials.clientId);
		params.set('redirect_uri', redirectUri);
		params.set('scope', credentials.scopes || 'openid profile email');
		params.set('state', state);

		// Add prompt parameter if specified
		if (credentials.prompt) {
			params.set('prompt', credentials.prompt);
		}

		// Add login_hint parameter if specified
		if (credentials.loginHint) {
			params.set('login_hint', credentials.loginHint);
			UnifiedFlowLoggerService.debug('Added login_hint', {
				loginHint: credentials.loginHint,
			});
		}

		// Add max_age parameter if specified
		if (credentials.maxAge !== undefined) {
			params.set('max_age', credentials.maxAge.toString());
			UnifiedFlowLoggerService.debug('Added max_age', {
				maxAge: credentials.maxAge,
			});
		}

		// Add display parameter if specified
		if (credentials.display) {
			params.set('display', credentials.display);
			UnifiedFlowLoggerService.debug('Added display', {
				display: credentials.display,
			});
		}

		return params;
	}

	/**
	 * Add PKCE parameters to URL params
	 */
	private static addPKCEParams(
		params: URLSearchParams,
		pkceCodes?: {
			codeVerifier: string;
			codeChallenge: string;
			codeChallengeMethod: 'S256' | 'plain';
		}
	): void {
		if (pkceCodes) {
			params.set('code_challenge', pkceCodes.codeChallenge);
			params.set('code_challenge_method', pkceCodes.codeChallengeMethod);
		}
	}

	/**
	 * Add response mode to URL params
	 */
	private static addResponseModeParams(params: URLSearchParams, responseMode: ResponseMode): void {
		params.set('response_mode', responseMode);
		UnifiedFlowLoggerService.debug('Response mode set', {
			responseMode,
		});
	}

	/**
	 * Prefix state with flow type for callback routing
	 */
	private static prefixState(flowType: FlowType, state: string): string {
		return `v8u-${flowType}-${state}`;
	}

	/**
	 * Build authorization URL for implicit flow
	 */
	private static buildImplicitUrl(params: AuthorizationUrlParams): AuthorizationUrlResult {
		const { credentials, pkceCodes, state, nonce } = params;

		// Get correct redirect URI
		const redirectUri = AuthorizationUrlBuilderService.getRedirectUri('implicit', credentials);

		// Get response mode
		const responseMode = AuthorizationUrlBuilderService.getResponseMode('implicit', credentials);

		// Prefix state for callback routing
		const prefixedState = state
			? AuthorizationUrlBuilderService.prefixState('implicit', state)
			: AuthorizationUrlBuilderService.prefixState('implicit', `state-${Date.now()}`);

		// Build base parameters
		const urlParams = AuthorizationUrlBuilderService.buildBaseParams(
			'implicit',
			credentials,
			prefixedState,
			redirectUri
		);

		// Set response type for implicit flow
		urlParams.set('response_type', 'token id_token');

		// Add nonce (required for OIDC implicit flow)
		if (nonce) {
			urlParams.set('nonce', nonce);
		}

		// Add response mode
		AuthorizationUrlBuilderService.addResponseModeParams(urlParams, responseMode);

		// Build authorization URL
		const authorizationEndpoint = `https://auth.pingone.com/${credentials.environmentId}/as/authorize`;
		const authorizationUrl = `${authorizationEndpoint}?${urlParams.toString()}`;

		UnifiedFlowLoggerService.success('Implicit flow URL generated', {
			flowType: 'implicit',
			hasAuthUrl: !!authorizationUrl,
			prefixedState,
			responseMode,
		});

		return {
			authorizationUrl,
			state: prefixedState,
			nonce,
		};
	}

	/**
	 * Build authorization URL for authorization code flow
	 */
	private static buildAuthzUrl(params: AuthorizationUrlParams): AuthorizationUrlResult {
		const { credentials, pkceCodes } = params;

		// Get correct redirect URI
		const redirectUri = AuthorizationUrlBuilderService.getRedirectUri('oauth-authz', credentials);

		// Get response mode
		const responseMode = AuthorizationUrlBuilderService.getResponseMode('oauth-authz', credentials);

		// Generate state if not provided (will be prefixed)
		const baseState = params.state || `state-${Date.now()}`;
		const prefixedState = AuthorizationUrlBuilderService.prefixState('oauth-authz', baseState);

		// Build base parameters
		const urlParams = AuthorizationUrlBuilderService.buildBaseParams(
			'oauth-authz',
			credentials,
			prefixedState,
			redirectUri
		);

		// Set response type for authorization code flow
		urlParams.set('response_type', 'code');

		// Add PKCE parameters if provided
		AuthorizationUrlBuilderService.addPKCEParams(urlParams, pkceCodes);

		// Add response mode
		AuthorizationUrlBuilderService.addResponseModeParams(urlParams, responseMode);

		// Build authorization URL
		const authorizationEndpoint = `https://auth.pingone.com/${credentials.environmentId}/as/authorize`;
		const authorizationUrl = `${authorizationEndpoint}?${urlParams.toString()}`;

		UnifiedFlowLoggerService.success('OAuth authz URL generated', {
			flowType: 'oauth-authz',
			prefixedState,
			hasPKCE: !!pkceCodes,
			responseMode,
		});

		return {
			authorizationUrl,
			state: prefixedState,
			...(pkceCodes && {
				codeVerifier: pkceCodes.codeVerifier,
				codeChallenge: pkceCodes.codeChallenge,
			}),
		};
	}

	/**
	 * Build authorization URL for hybrid flow
	 */
	private static buildHybridUrl(params: AuthorizationUrlParams): AuthorizationUrlResult {
		const { credentials, pkceCodes, nonce } = params;

		// Get correct redirect URI
		const redirectUri = AuthorizationUrlBuilderService.getRedirectUri('hybrid', credentials);

		// Get response mode
		const responseMode = AuthorizationUrlBuilderService.getResponseMode('hybrid', credentials);

		// Generate state if not provided (will be prefixed)
		const baseState = params.state || `state-${Date.now()}`;
		const prefixedState = AuthorizationUrlBuilderService.prefixState('hybrid', baseState);

		// Build base parameters
		const urlParams = AuthorizationUrlBuilderService.buildBaseParams(
			'hybrid',
			credentials,
			prefixedState,
			redirectUri
		);

		// Set response type for hybrid flow (default to 'code id_token')
		const responseType =
			(credentials.responseType as 'code id_token' | 'code token' | 'code token id_token') ||
			'code id_token';
		urlParams.set('response_type', responseType);

		// Add nonce (required for OIDC hybrid flow)
		if (nonce) {
			urlParams.set('nonce', nonce);
		}

		// Add PKCE parameters if provided
		AuthorizationUrlBuilderService.addPKCEParams(urlParams, pkceCodes);

		// Add response mode
		AuthorizationUrlBuilderService.addResponseModeParams(urlParams, responseMode);

		// Build authorization URL
		const authorizationEndpoint = `https://auth.pingone.com/${credentials.environmentId}/as/authorize`;
		const authorizationUrl = `${authorizationEndpoint}?${urlParams.toString()}`;

		UnifiedFlowLoggerService.success('Hybrid flow URL generated', {
			flowType: 'hybrid',
			prefixedState,
			responseType,
			responseMode,
		});

		return {
			authorizationUrl,
			state: prefixedState,
			nonce,
		};
	}

	/**
	 * Build authorization URL for any flow type
	 */
	static buildAuthorizationUrl(params: AuthorizationUrlParams): AuthorizationUrlResult {
		UnifiedFlowLoggerService.info('Generating authorization URL', {
			flowType: params.flowType,
			specVersion: params.specVersion,
			hasPKCE: !!params.pkceCodes,
			responseMode: AuthorizationUrlBuilderService.getResponseMode(
				params.flowType,
				params.credentials
			),
		});

		switch (params.flowType) {
			case 'implicit':
				return AuthorizationUrlBuilderService.buildImplicitUrl(params);

			case 'oauth-authz':
				return AuthorizationUrlBuilderService.buildAuthzUrl(params);

			case 'hybrid':
				return AuthorizationUrlBuilderService.buildHybridUrl(params);

			case 'device-code':
			case 'client-credentials':
				throw new Error(
					`The ${params.flowType} flow does not use authorization URLs. Please use the appropriate flow steps.`
				);

			default:
				throw new Error(
					`The ${params.flowType} flow is not supported for authorization URL generation.`
				);
		}
	}
}
