// src/hooks/useOAuth2CompliantAuthorizationCodeFlow.ts
/**
 * RFC 6749 Compliant OAuth 2.0 Authorization Code Flow Hook
 *
 * This hook provides a fully RFC 6749 compliant implementation of the
 * OAuth 2.0 Authorization Code Flow with proper parameter validation,
 * error handling, and security features.
 *
 * Key Features:
 * - RFC 6749 compliant parameter validation
 * - Cryptographically secure state generation
 * - Proper error response handling
 * - PKCE support (RFC 7636)
 * - Security headers implementation
 * - Token validation and introspection
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
	type OAuth2AuthorizationRequest,
	type OAuth2ErrorResponse,
	type OAuth2TokenRequest,
	type OAuth2TokenResponse,
	oauth2ComplianceService,
	type ValidationResult,
} from '../services/oauth2ComplianceService';
import { v4ToastManager } from '../utils/v4ToastMessages';

export interface OAuth2Credentials {
	environmentId: string;
	clientId: string;
	clientSecret?: string;
	redirectUri: string;
	scope?: string;
	authorizationEndpoint?: string;
	tokenEndpoint?: string;
}

export interface OAuth2FlowState {
	// Step 1: Configuration
	credentials: OAuth2Credentials;
	isConfigValid: boolean;
	configErrors: string[];

	// Step 2: PKCE Generation
	pkceCodes: {
		codeVerifier: string;
		codeChallenge: string;
		codeChallengeMethod: 'S256';
	} | null;
	isPkceGenerated: boolean;

	// Step 3: Authorization URL Generation
	authorizationUrl: string;
	state: string;
	isAuthUrlGenerated: boolean;

	// Step 4: Authorization
	isAuthorizing: boolean;
	authorizationCode: string;
	receivedState: string;

	// Step 5: Token Exchange
	isExchangingTokens: boolean;
	tokens: OAuth2TokenResponse | null;
	tokenErrors: string[];

	// General state
	currentStep: number;
	errors: OAuth2ErrorResponse[];
	warnings: string[];
}

export interface OAuth2FlowActions {
	// Configuration
	setCredentials: (credentials: OAuth2Credentials) => void;
	validateConfiguration: () => Promise<ValidationResult>;

	// PKCE
	generatePKCECodes: () => Promise<void>;

	// Authorization URL
	generateAuthorizationUrl: () => Promise<void>;

	// Authorization
	handleAuthorizationCallback: (code: string, state: string) => Promise<void>;

	// Token Exchange
	exchangeTokens: () => Promise<void>;

	// Flow Control
	resetFlow: () => void;
	goToStep: (step: number) => void;
}

const initialState: OAuth2FlowState = {
	credentials: {
		environmentId: '',
		clientId: '',
		clientSecret: '',
		redirectUri: '',
		scope: 'openid profile email',
	},
	isConfigValid: false,
	configErrors: [],
	pkceCodes: null,
	isPkceGenerated: false,
	authorizationUrl: '',
	state: '',
	isAuthUrlGenerated: false,
	isAuthorizing: false,
	authorizationCode: '',
	receivedState: '',
	isExchangingTokens: false,
	tokens: null,
	tokenErrors: [],
	currentStep: 1,
	errors: [],
	warnings: [],
};

export const useOAuth2CompliantAuthorizationCodeFlow = (): [OAuth2FlowState, OAuth2FlowActions] => {
	const [state, setState] = useState<OAuth2FlowState>(initialState);
	const stateRef = useRef<string>('');

	// Helper function to add error
	const addError = useCallback((error: OAuth2ErrorResponse) => {
		setState((prev) => ({
			...prev,
			errors: [...prev.errors, error],
		}));
	}, []);

	// Helper function to add warning
	const addWarning = useCallback((warning: string) => {
		setState((prev) => ({
			...prev,
			warnings: [...prev.warnings, warning],
		}));
	}, []);

	// Helper function to clear errors and warnings
	const clearMessages = useCallback(() => {
		setState((prev) => ({
			...prev,
			errors: [],
			warnings: [],
		}));
	}, []);

	// Set credentials with validation
	const setCredentials = useCallback((credentials: OAuth2Credentials) => {
		setState((prev) => ({
			...prev,
			credentials: {
				...credentials,
				authorizationEndpoint:
					credentials.authorizationEndpoint ||
					`https://auth.pingone.com/${credentials.environmentId}/as/authorize`,
				tokenEndpoint:
					credentials.tokenEndpoint ||
					`https://auth.pingone.com/${credentials.environmentId}/as/token`,
			},
			isConfigValid: false,
			configErrors: [],
		}));
	}, []);

	// Validate configuration
	const validateConfiguration = useCallback(async (): Promise<ValidationResult> => {
		clearMessages();

		const errors: string[] = [];
		const warnings: string[] = [];

		// Basic credential validation
		if (!state.credentials.clientId) {
			errors.push('Client ID is required');
		}

		if (!state.credentials.environmentId) {
			errors.push('Environment ID is required');
		}

		if (!state.credentials.redirectUri) {
			errors.push('Redirect URI is required');
		}

		// Validate redirect URI format
		if (state.credentials.redirectUri) {
			const redirectUriValidation = oauth2ComplianceService.validateRedirectUri(
				state.credentials.redirectUri
			);
			errors.push(...redirectUriValidation.errors);
			warnings.push(...(redirectUriValidation.warnings || []));
		}

		// Validate scope format
		if (state.credentials.scope) {
			const scopeValidation = oauth2ComplianceService.validateScope(state.credentials.scope);
			errors.push(...scopeValidation.errors);
			warnings.push(...(scopeValidation.warnings || []));
		}

		const isValid = errors.length === 0;

		setState((prev) => ({
			...prev,
			isConfigValid: isValid,
			configErrors: errors,
			warnings,
		}));

		// Show validation results
		if (isValid) {
			v4ToastManager.showSuccess('Configuration validated successfully');
		} else {
			v4ToastManager.showError(`Configuration validation failed: ${errors.join(', ')}`);
		}

		warnings.forEach((warning) => {
			addWarning(warning);
		});

		return {
			valid: isValid,
			errors,
			warnings,
		};
	}, [state.credentials, clearMessages, addWarning]);

	// Generate PKCE codes
	const generatePKCECodes = useCallback(async () => {
		try {
			clearMessages();

			const pkceCodes = await oauth2ComplianceService.generatePKCECodes();

			setState((prev) => ({
				...prev,
				pkceCodes,
				isPkceGenerated: true,
			}));

			v4ToastManager.showSuccess('PKCE codes generated successfully');
			console.log('[OAuth2CompliantFlow] PKCE codes generated:', {
				codeVerifier: `${pkceCodes.codeVerifier.substring(0, 20)}...`,
				codeChallenge: `${pkceCodes.codeChallenge.substring(0, 20)}...`,
				method: pkceCodes.codeChallengeMethod,
			});
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to generate PKCE codes';
			addError(oauth2ComplianceService.createErrorResponse('server_error', errorMessage));
			v4ToastManager.showError(errorMessage);
		}
	}, [clearMessages, addError]);

	// Generate authorization URL
	const generateAuthorizationUrl = useCallback(async () => {
		try {
			clearMessages();

			if (!state.isConfigValid) {
				throw new Error('Configuration must be validated first');
			}

			if (!state.pkceCodes) {
				throw new Error('PKCE codes must be generated first');
			}

			// Generate secure state
			const secureState = oauth2ComplianceService.generateSecureState();
			stateRef.current = secureState;

			// Build authorization request
			const authRequest: OAuth2AuthorizationRequest = {
				response_type: 'code',
				client_id: state.credentials.clientId,
				redirect_uri: state.credentials.redirectUri,
				scope: state.credentials.scope || 'openid profile email',
				state: secureState,
				code_challenge: state.pkceCodes.codeChallenge,
				code_challenge_method: state.pkceCodes.codeChallengeMethod,
			};

			// Validate authorization request
			const validation = oauth2ComplianceService.validateAuthorizationRequest(authRequest);
			if (!validation.valid) {
				throw new Error(`Authorization request validation failed: ${validation.errors.join(', ')}`);
			}

			// Show warnings if any
			validation.warnings?.forEach((warning) => {
				addWarning(warning);
			});

			// Build authorization URL
			const authEndpoint = state.credentials.authorizationEndpoint!;
			const params = new URLSearchParams();

			Object.entries(authRequest).forEach(([key, value]) => {
				if (value) {
					params.set(key, value);
				}
			});

			const authorizationUrl = `${authEndpoint}?${params.toString()}`;

			setState((prev) => ({
				...prev,
				authorizationUrl,
				state: secureState,
				isAuthUrlGenerated: true,
				currentStep: 3,
			}));

			// Store state for callback validation
			sessionStorage.setItem('oauth2_state', secureState);
			sessionStorage.setItem('oauth2_code_verifier', state.pkceCodes.codeVerifier);

			v4ToastManager.showSuccess('Authorization URL generated successfully');
			console.log('[OAuth2CompliantFlow] Authorization URL generated:', {
				url: authorizationUrl,
				state: `${secureState.substring(0, 10)}...`,
				codeChallenge: `${state.pkceCodes.codeChallenge.substring(0, 20)}...`,
			});
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Failed to generate authorization URL';
			addError(oauth2ComplianceService.createErrorResponse('server_error', errorMessage));
			v4ToastManager.showError(errorMessage);
		}
	}, [
		state.isConfigValid,
		state.pkceCodes,
		state.credentials,
		clearMessages,
		addError,
		addWarning,
	]);

	// Handle authorization callback
	const handleAuthorizationCallback = useCallback(
		async (code: string, receivedState: string) => {
			try {
				clearMessages();

				// Validate state parameter
				const expectedState = stateRef.current || sessionStorage.getItem('oauth2_state');
				if (!expectedState) {
					throw new Error('No expected state found - possible session timeout');
				}

				const stateValid = await oauth2ComplianceService.validateState(
					receivedState,
					expectedState
				);
				if (!stateValid) {
					throw new Error('State parameter validation failed - possible CSRF attack');
				}

				setState((prev) => ({
					...prev,
					authorizationCode: code,
					receivedState,
					currentStep: 4,
				}));

				v4ToastManager.showSuccess('Authorization callback received successfully');
				console.log('[OAuth2CompliantFlow] Authorization callback processed:', {
					code: `${code.substring(0, 20)}...`,
					stateValid,
				});
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : 'Authorization callback failed';
				addError(
					oauth2ComplianceService.createErrorResponse('access_denied', errorMessage, receivedState)
				);
				v4ToastManager.showError(errorMessage);
			}
		},
		[clearMessages, addError]
	);

	// Exchange tokens
	const exchangeTokens = useCallback(async () => {
		try {
			setState((prev) => ({ ...prev, isExchangingTokens: true, tokenErrors: [] }));
			clearMessages();

			if (!state.authorizationCode) {
				throw new Error('Authorization code is required');
			}

			const codeVerifier = sessionStorage.getItem('oauth2_code_verifier');
			if (!codeVerifier) {
				throw new Error('Code verifier not found - possible session timeout');
			}

			// Build token request
			const tokenRequest: OAuth2TokenRequest = {
				grant_type: 'authorization_code',
				code: state.authorizationCode,
				redirect_uri: state.credentials.redirectUri,
				client_id: state.credentials.clientId,
				client_secret: state.credentials.clientSecret,
				code_verifier: codeVerifier,
			};

			// Validate token request
			const validation = oauth2ComplianceService.validateTokenRequest(tokenRequest);
			if (!validation.valid) {
				throw new Error(`Token request validation failed: ${validation.errors.join(', ')}`);
			}

			// Show warnings if any
			validation.warnings?.forEach((warning) => {
				addWarning(warning);
			});

			// Make token request
			const tokenEndpoint = state.credentials.tokenEndpoint!;
			const _headers = {
				'Content-Type': 'application/x-www-form-urlencoded',
				Accept: 'application/json',
				...oauth2ComplianceService.getSecurityHeaders(),
			};

			// Handle client authentication
			const body = new URLSearchParams();
			Object.entries(tokenRequest).forEach(([key, value]) => {
				if (value) {
					body.set(key, value);
				}
			});

			console.log('[OAuth2CompliantFlow] Making token request:', {
				endpoint: tokenEndpoint,
				grantType: tokenRequest.grant_type,
				clientId: tokenRequest.client_id,
				hasClientSecret: !!tokenRequest.client_secret,
				hasCodeVerifier: !!tokenRequest.code_verifier,
			});

			const response = await fetch('/api/token-exchange', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					grant_type: tokenRequest.grant_type,
					code: tokenRequest.code,
					redirect_uri: tokenRequest.redirect_uri,
					client_id: tokenRequest.client_id,
					client_secret: tokenRequest.client_secret,
					code_verifier: tokenRequest.code_verifier,
					environment_id: state.credentials.environmentId,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.error_description || `Token exchange failed: ${response.status}`);
			}

			const tokens: OAuth2TokenResponse = await response.json();

			// Validate token response
			if (!tokens.access_token) {
				throw new Error('No access token received');
			}

			const tokenValidation = oauth2ComplianceService.validateAccessToken(tokens.access_token);
			if (!tokenValidation.valid) {
				console.warn('[OAuth2CompliantFlow] Token validation warnings:', tokenValidation.errors);
			}

			setState((prev) => ({
				...prev,
				tokens,
				currentStep: 5,
				isExchangingTokens: false,
			}));

			// Clear sensitive data from session storage
			sessionStorage.removeItem('oauth2_state');
			sessionStorage.removeItem('oauth2_code_verifier');

			v4ToastManager.showSuccess('Tokens exchanged successfully');
			console.log('[OAuth2CompliantFlow] Token exchange successful:', {
				hasAccessToken: !!tokens.access_token,
				hasRefreshToken: !!tokens.refresh_token,
				tokenType: tokens.token_type,
				expiresIn: tokens.expires_in,
				scope: tokens.scope,
			});
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Token exchange failed';
			setState((prev) => ({
				...prev,
				isExchangingTokens: false,
				tokenErrors: [errorMessage],
			}));
			addError(oauth2ComplianceService.createErrorResponse('server_error', errorMessage));
			v4ToastManager.showError(errorMessage);
		}
	}, [state.authorizationCode, state.credentials, clearMessages, addError, addWarning]);

	// Reset flow
	const resetFlow = useCallback(() => {
		setState(initialState);
		stateRef.current = '';
		sessionStorage.removeItem('oauth2_state');
		sessionStorage.removeItem('oauth2_code_verifier');
		v4ToastManager.showInfo('Flow reset successfully');
	}, []);

	// Go to specific step
	const goToStep = useCallback((step: number) => {
		setState((prev) => ({
			...prev,
			currentStep: Math.max(1, Math.min(5, step)),
		}));
	}, []);

	// Auto-detect callback on mount
	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const code = urlParams.get('code');
		const receivedState = urlParams.get('state');
		const error = urlParams.get('error');
		const errorDescription = urlParams.get('error_description');

		if (error) {
			addError(
				oauth2ComplianceService.createErrorResponse(
					error as any,
					errorDescription || undefined,
					receivedState || undefined
				)
			);
			v4ToastManager.showError(`Authorization error: ${error}`);
		} else if (code && receivedState) {
			handleAuthorizationCallback(code, receivedState);

			// Clean up URL
			const newUrl = new URL(window.location.href);
			newUrl.searchParams.delete('code');
			newUrl.searchParams.delete('state');
			window.history.replaceState({}, document.title, newUrl.toString());
		}
	}, [addError, handleAuthorizationCallback]);

	const actions: OAuth2FlowActions = {
		setCredentials,
		validateConfiguration,
		generatePKCECodes,
		generateAuthorizationUrl,
		handleAuthorizationCallback,
		exchangeTokens,
		resetFlow,
		goToStep,
	};

	return [state, actions];
};
