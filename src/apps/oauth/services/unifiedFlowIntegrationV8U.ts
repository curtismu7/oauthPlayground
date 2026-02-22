/**
 * @file unifiedFlowIntegrationV8U.ts
 * @module apps/oauth/services
 * @description Unified flow integration service - delegates to V8 services (real PingOne APIs) - OAUTH SERVICE
 * @version 8.0.0
 * @since 2024-11-16
 *
 * This service acts as a facade to V8 services, providing a unified interface
 * for V8U flows. All API calls use real PingOne endpoints.
 */

import {
	type ClientCredentialsCredentials,
	ClientCredentialsIntegrationServiceV8,
} from '@/v8/services/clientCredentialsIntegrationServiceV8';
import {
	type DeviceCodeCredentials,
	DeviceCodeIntegrationServiceV8,
} from '@/v8/services/deviceCodeIntegrationServiceV8';
import {
	type HybridFlowCredentials,
	HybridFlowIntegrationServiceV8,
} from '@/v8/services/hybridFlowIntegrationServiceV8';
import { ImplicitFlowIntegrationServiceV8 } from '@/v8/services/implicitFlowIntegrationServiceV8';
import {
	type OAuthCredentials,
	OAuthIntegrationServiceV8,
} from '@/v8/services/oauthIntegrationServiceV8';
import { RedirectUriServiceV8 } from '@/v8/services/redirectUriServiceV8';

const MODULE_TAG = '[🔗 UNIFIED-FLOW-INTEGRATION-OAUTH]';

export interface UnifiedFlowCredentials {
	environmentId: string;
	clientId: string;
	clientSecret?: string;
	redirectUri?: string;
	postLogoutRedirectUri?: string;
	logoutUri?: string;
	scopes?: string;
	clientAuthMethod?:
		| 'none'
		| 'client_secret_basic'
		| 'client_secret_post'
		| 'client_secret_jwt'
		| 'private_key_jwt';
	responseType?: string;
	issuerUrl?: string;
	prompt?: 'none' | 'login' | 'consent';
	loginHint?: string;
	maxAge?: number;
	display?: 'page' | 'popup' | 'touch' | 'wap';
	responseMode?: string;
	useRedirectless?: boolean;
	[key: string]: unknown;
}

export interface TokenExchangeResult {
	accessToken?: string;
	refreshToken?: string;
	idToken?: string;
	tokenType?: string;
	expiresIn?: number;
	scope?: string;
	error?: string;
	errorDescription?: string;
}

export interface UserInfoResult {
	sub?: string;
	name?: string;
	email?: string;
	preferred_username?: string;
	given_name?: string;
	family_name?: string;
	picture?: string;
	email_verified?: boolean;
	locale?: string;
	[key: string]: unknown;
}

/**
 * UnifiedFlowIntegrationServiceV8U
 *
 * Facade service that delegates to V8 services for real PingOne API calls.
 * Provides a unified interface for all OAuth/OIDC flows.
 */
export class UnifiedFlowIntegrationServiceV8U {
	/**
	 * Exchange authorization code for tokens (OAuth Authorization Code Flow)
	 */
	static async exchangeAuthorizationCode(
		credentials: UnifiedFlowCredentials,
		code: string,
		redirectUri: string,
		codeVerifier?: string
	): Promise<TokenExchangeResult> {
		console.log(`${MODULE_TAG} Exchanging authorization code`, {
			hasCode: !!code,
			hasCodeVerifier: !!codeVerifier,
			redirectUri,
		});

		const oauthCredentials: OAuthCredentials = {
			environmentId: credentials.environmentId,
			clientId: credentials.clientId,
			clientSecret: credentials.clientSecret,
			redirectUri,
			clientAuthMethod: credentials.clientAuthMethod || 'client_secret_basic',
			codeVerifier,
		};

		return await OAuthIntegrationServiceV8.exchangeAuthorizationCode(oauthCredentials, code);
	}

	/**
	 * Exchange implicit flow tokens from fragment
	 */
	static async exchangeImplicitTokens(
		_credentials: UnifiedFlowCredentials,
		accessToken: string,
		idToken?: string
	): Promise<TokenExchangeResult> {
		console.log(`${MODULE_TAG} Processing implicit flow tokens`, {
			hasAccessToken: !!accessToken,
			hasIdToken: !!idToken,
		});

		return await ImplicitFlowIntegrationServiceV8.processTokens(accessToken, idToken);
	}

	/**
	 * Exchange hybrid flow tokens
	 */
	static async exchangeHybridTokens(
		credentials: UnifiedFlowCredentials,
		code: string,
		redirectUri: string,
		codeVerifier?: string
	): Promise<TokenExchangeResult> {
		console.log(`${MODULE_TAG} Exchanging hybrid flow tokens`, {
			hasCode: !!code,
			hasCodeVerifier: !!codeVerifier,
			redirectUri,
		});

		const hybridCredentials: HybridFlowCredentials = {
			environmentId: credentials.environmentId,
			clientId: credentials.clientId,
			clientSecret: credentials.clientSecret,
			redirectUri,
			clientAuthMethod: credentials.clientAuthMethod || 'client_secret_basic',
			codeVerifier,
		};

		return await HybridFlowIntegrationServiceV8.exchangeAuthorizationCode(hybridCredentials, code);
	}

	/**
	 * Get client credentials token
	 */
	static async getClientCredentialsToken(
		credentials: UnifiedFlowCredentials
	): Promise<TokenExchangeResult> {
		console.log(`${MODULE_TAG} Getting client credentials token`);

		const clientCredentials: ClientCredentialsCredentials = {
			environmentId: credentials.environmentId,
			clientId: credentials.clientId,
			clientSecret: credentials.clientSecret,
			scopes: credentials.scopes,
			clientAuthMethod: credentials.clientAuthMethod || 'client_secret_basic',
		};

		return await ClientCredentialsIntegrationServiceV8.getClientCredentialsToken(clientCredentials);
	}

	/**
	 * Start device code flow
	 */
	static async startDeviceCodeFlow(
		credentials: UnifiedFlowCredentials
	): Promise<{ deviceCode: string; userCode: string; verificationUri: string; expiresIn: number }> {
		console.log(`${MODULE_TAG} Starting device code flow`);

		const deviceCredentials: DeviceCodeCredentials = {
			environmentId: credentials.environmentId,
			clientId: credentials.clientId,
			clientSecret: credentials.clientSecret,
			scopes: credentials.scopes,
		};

		return await DeviceCodeIntegrationServiceV8.startDeviceCodeFlow(deviceCredentials);
	}

	/**
	 * Poll for device code token
	 */
	static async pollDeviceCodeToken(
		credentials: UnifiedFlowCredentials,
		deviceCode: string
	): Promise<TokenExchangeResult> {
		console.log(`${MODULE_TAG} Polling for device code token`);

		const deviceCredentials: DeviceCodeCredentials = {
			environmentId: credentials.environmentId,
			clientId: credentials.clientId,
			clientSecret: credentials.clientSecret,
			scopes: credentials.scopes,
		};

		return await DeviceCodeIntegrationServiceV8.pollForToken(deviceCredentials, deviceCode);
	}

	/**
	 * Refresh access token
	 */
	static async refreshToken(
		credentials: UnifiedFlowCredentials,
		refreshToken: string
	): Promise<TokenExchangeResult> {
		console.log(`${MODULE_TAG} Refreshing token`);

		const oauthCredentials: OAuthCredentials = {
			environmentId: credentials.environmentId,
			clientId: credentials.clientId,
			clientSecret: credentials.clientSecret,
			clientAuthMethod: credentials.clientAuthMethod || 'client_secret_basic',
		};

		return await OAuthIntegrationServiceV8.refreshToken(oauthCredentials, refreshToken);
	}

	/**
	 * Revoke token
	 */
	static async revokeToken(
		credentials: UnifiedFlowCredentials,
		token: string,
		tokenTypeHint?: 'access_token' | 'refresh_token'
	): Promise<{ success: boolean; error?: string }> {
		console.log(`${MODULE_TAG} Revoking token`, { tokenTypeHint });

		const oauthCredentials: OAuthCredentials = {
			environmentId: credentials.environmentId,
			clientId: credentials.clientId,
			clientSecret: credentials.clientSecret,
			clientAuthMethod: credentials.clientAuthMethod || 'client_secret_basic',
		};

		return await OAuthIntegrationServiceV8.revokeToken(oauthCredentials, token, tokenTypeHint);
	}

	/**
	 * Get user info from ID token or access token
	 */
	static async getUserInfo(
		credentials: UnifiedFlowCredentials,
		accessToken: string
	): Promise<UserInfoResult> {
		console.log(`${MODULE_TAG} Getting user info`);

		return await OAuthIntegrationServiceV8.getUserInfo(credentials.environmentId, accessToken);
	}

	/**
	 * Introspect token
	 */
	static async introspectToken(
		credentials: UnifiedFlowCredentials,
		token: string
	): Promise<{
		active: boolean;
		scope?: string;
		client_id?: string;
		username?: string;
		token_type?: string;
		exp?: number;
		iat?: number;
		nbf?: number;
		sub?: string;
		aud?: string;
		iss?: string;
		jti?: string;
	}> {
		console.log(`${MODULE_TAG} Introspecting token`);

		const oauthCredentials: OAuthCredentials = {
			environmentId: credentials.environmentId,
			clientId: credentials.clientId,
			clientSecret: credentials.clientSecret,
			clientAuthMethod: credentials.clientAuthMethod || 'client_secret_basic',
		};

		return await OAuthIntegrationServiceV8.introspectToken(oauthCredentials, token);
	}

	/**
	 * Validate ID token
	 */
	static validateIdToken(
		idToken: string,
		issuer?: string,
		clientId?: string
	): {
		valid: boolean;
		payload?: Record<string, unknown>;
		error?: string;
	} {
		console.log(`${MODULE_TAG} Validating ID token`);

		return OAuthIntegrationServiceV8.validateIdToken(idToken, issuer, clientId);
	}

	/**
	 * Get redirect URI for flow
	 */
	static getRedirectUri(flowType: string, credentials?: UnifiedFlowCredentials): string {
		const flowKey = `${flowType}-v8u`;
		const defaultRedirectUri = RedirectUriServiceV8.getRedirectUriForFlow(flowKey);

		// Prioritize user's configured redirect URI over auto-generated default
		const redirectUriToUse = credentials?.redirectUri?.trim() || defaultRedirectUri || '';

		console.log(`${MODULE_TAG} Getting redirect URI`, {
			flowType,
			flowKey,
			credentialsRedirectUri: credentials?.redirectUri,
			defaultRedirectUri,
			redirectUriToUse,
		});

		return redirectUriToUse;
	}
}

export default UnifiedFlowIntegrationServiceV8U;
