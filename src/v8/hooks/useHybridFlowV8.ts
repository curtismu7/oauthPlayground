/**
 * @file useHybridFlowV8.ts
 * @module v8/hooks
 * @description React hook for OIDC Hybrid Flow V8 management
 * @version 8.0.0
 * @since 2024-11-16
 *
 * Provides:
 * - State management for hybrid flow variants
 * - Authorization URL generation
 * - Token exchange and processing
 * - PKCE management
 * - Error handling and validation
 * - Integration with V8 services
 *
 * @example
 * const hybridFlow = useHybridFlowV8();
 * await hybridFlow.initiateAuthentication(credentials);
 * const tokens = await hybridFlow.exchangeCodeForTokens(code);
 */

import { useCallback, useEffect, useState } from 'react';
import { useProductionSpinner } from '@/hooks/useProductionSpinner';
import { CredentialsServiceV8 } from '@/v8/services/credentialsServiceV8';
import type {
	HybridAuthorizationUrlParams,
	HybridFlowCredentials,
	TokenResponse,
} from '@/v8/services/hybridFlowIntegrationServiceV8';
import { HybridFlowIntegrationServiceV8 } from '@/v8/services/hybridFlowIntegrationServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

export interface HybridFlowState {
	// Flow configuration
	variant: 'code id_token' | 'code token' | 'code token id_token';
	credentials: HybridFlowCredentials | null;

	// Authorization state
	authorizationUrl: string | null;
	authParams: HybridAuthorizationUrlParams | null;

	// Token state
	tokens: TokenResponse | null;
	implicitTokens: Record<string, string> | null;

	// Flow state
	isLoading: boolean;
	error: string | null;
	currentStep: number;

	// PKCE state
	pkceCodes: {
		codeVerifier: string;
		codeChallenge: string;
		codeChallengeMethod: 'S256';
	} | null;
}

export interface UseHybridFlowV8Options {
	enableAutoRedirect?: boolean;
	enableTokenValidation?: boolean;
	defaultVariant?: HybridFlowState['variant'];
}

const FLOW_KEY = 'hybrid-flow-v8';
const DEFAULT_VARIANT: HybridFlowState['variant'] = 'code id_token';

export const useHybridFlowV8 = (options: UseHybridFlowV8Options = {}) => {
	const _spinner = useProductionSpinner('hybrid-flow-v8');

	// State management
	const [state, setState] = useState<HybridFlowState>({
		variant: options.defaultVariant || DEFAULT_VARIANT,
		credentials: null,
		authorizationUrl: null,
		authParams: null,
		tokens: null,
		implicitTokens: null,
		isLoading: false,
		error: null,
		currentStep: 0,
		pkceCodes: null,
	});

	// Load credentials from storage
	const loadCredentials = useCallback(() => {
		try {
			const credentials = CredentialsServiceV8.loadCredentials(FLOW_KEY, {
				flowKey: FLOW_KEY,
				flowType: 'hybrid',
				includeClientSecret: true,
				includeRedirectUri: true,
				includeLogoutUri: false,
				includeScopes: true,
				defaultScopes: 'openid profile email',
				defaultRedirectUri: `${window.location.origin}/flows/hybrid-v8/callback`,
			});

			setState((prev) => ({ ...prev, credentials: credentials as HybridFlowCredentials }));
		} catch (error) {
			console.error('[HybridFlowV8] Failed to load credentials:', error);
			toastV8.error('Failed to load credentials');
		}
	}, []);

	// Save credentials to storage
	const saveCredentials = useCallback((credentials: HybridFlowCredentials) => {
		try {
			CredentialsServiceV8.saveCredentials(FLOW_KEY, credentials);
			setState((prev) => ({ ...prev, credentials }));
		} catch (error) {
			console.error('[HybridFlowV8] Failed to save credentials:', error);
			toastV8.error('Failed to save credentials');
		}
	}, []);

	// Generate PKCE codes
	const generatePKCE = useCallback(async () => {
		try {
			// Generate PKCE manually since service method is private
			const codeVerifier = HybridFlowIntegrationServiceV8['generateRandomString'](32);
			const encoder = new TextEncoder();
			const data = encoder.encode(codeVerifier);
			const hash = await crypto.subtle.digest('SHA-256', data);
			const base64Url = btoa(String.fromCharCode(...new Uint8Array(hash)))
				.replace(/\+/g, '-')
				.replace(/\//g, '_')
				.replace(/=/g, '');

			const pkceCodes = {
				codeVerifier,
				codeChallenge: base64Url,
				codeChallengeMethod: 'S256' as const,
			};

			setState((prev) => ({ ...prev, pkceCodes }));
			return pkceCodes;
		} catch (error) {
			console.error('[HybridFlowV8] Failed to generate PKCE:', error);
			toastV8.error('Failed to generate PKCE codes');
			throw error;
		}
	}, []);

	// Generate authorization URL
	const generateAuthorizationUrl = useCallback(
		async (credentials?: HybridFlowCredentials) => {
			const creds = credentials || state.credentials;
			if (!creds) {
				toastV8.error('Credentials required to generate authorization URL');
				return null;
			}

			try {
				setState((prev) => ({ ...prev, isLoading: true, error: null }));

				// Generate PKCE if not already present
				let pkceCodes = state.pkceCodes;
				if (!pkceCodes) {
					pkceCodes = await generatePKCE();
				}

				// Generate authorization URL
				const authParams = await HybridFlowIntegrationServiceV8.generateAuthorizationUrl(
					{
						...creds,
						responseType: state.variant,
					},
					pkceCodes
				);

				setState((prev) => ({
					...prev,
					authorizationUrl: authParams.authorizationUrl,
					authParams,
					isLoading: false,
					currentStep: 1,
				}));

				toastV8.success('Authorization URL generated successfully');
				return authParams;
			} catch (error) {
				console.error('[HybridFlowV8] Failed to generate authorization URL:', error);
				const errorMessage =
					error instanceof Error ? error.message : 'Failed to generate authorization URL';
				setState((prev) => ({ ...prev, error: errorMessage, isLoading: false }));
				toastV8.error(errorMessage);
				throw error;
			}
		},
		[state.credentials, state.variant, state.pkceCodes, generatePKCE]
	);

	// Exchange authorization code for tokens
	const exchangeCodeForTokens = useCallback(
		async (code: string) => {
			if (!state.credentials || !state.pkceCodes) {
				toastV8.error('Credentials and PKCE codes required for token exchange');
				return null;
			}

			try {
				setState((prev) => ({ ...prev, isLoading: true, error: null }));

				const tokens = await HybridFlowIntegrationServiceV8.exchangeCodeForTokens(
					state.credentials,
					code,
					state.pkceCodes.codeVerifier
				);

				setState((prev) => ({
					...prev,
					tokens,
					isLoading: false,
					currentStep: 2,
				}));

				toastV8.success('Authorization code exchanged successfully');
				return tokens;
			} catch (error) {
				console.error('[HybridFlowV8] Failed to exchange code:', error);
				const errorMessage =
					error instanceof Error ? error.message : 'Failed to exchange authorization code';
				setState((prev) => ({ ...prev, error: errorMessage, isLoading: false }));
				toastV8.error(errorMessage);
				throw error;
			}
		},
		[state.credentials, state.pkceCodes]
	);

	// Process URL fragment for implicit tokens
	const processUrlFragment = useCallback(() => {
		try {
			const fragment = window.location.hash.substring(1);
			if (!fragment) return;

			// Parse fragment manually since service doesn't have this method
			const params = new URLSearchParams(fragment);
			const implicitTokens: Record<string, string> = {};

			for (const [key, value] of params) {
				if (
					key.startsWith('access_token') ||
					key.startsWith('id_token') ||
					key.startsWith('token')
				) {
					implicitTokens[key] = value;
				}
			}

			if (Object.keys(implicitTokens).length > 0) {
				setState((prev) => ({
					...prev,
					implicitTokens,
					currentStep: 2,
				}));

				toastV8.success('Implicit tokens received from URL fragment');
			}
		} catch (error) {
			console.error('[HybridFlowV8] Failed to process URL fragment:', error);
			toastV8.error('Failed to process URL fragment');
		}
	}, []);

	// Set flow variant
	const setVariant = useCallback((variant: HybridFlowState['variant']) => {
		setState((prev) => ({ ...prev, variant }));
	}, []);

	// Update credentials
	const updateCredentials = useCallback(
		(updates: Partial<HybridFlowCredentials>) => {
			if (!state.credentials) return;

			const updatedCredentials = { ...state.credentials, ...updates };
			saveCredentials(updatedCredentials);
		},
		[state.credentials, saveCredentials]
	);

	// Reset flow
	const reset = useCallback(() => {
		setState({
			variant: options.defaultVariant || DEFAULT_VARIANT,
			credentials: state.credentials, // Keep credentials
			authorizationUrl: null,
			authParams: null,
			tokens: null,
			implicitTokens: null,
			isLoading: false,
			error: null,
			currentStep: 0,
			pkceCodes: null,
		});
	}, [state.credentials, options.defaultVariant]);

	// Navigate to authorization URL
	const redirectToAuthorization = useCallback(() => {
		if (!state.authorizationUrl) {
			toastV8.error('No authorization URL available');
			return;
		}

		if (options.enableAutoRedirect) {
			window.location.href = state.authorizationUrl;
		} else {
			window.open(state.authorizationUrl, '_blank', 'noopener,noreferrer');
		}
	}, [state.authorizationUrl, options.enableAutoRedirect]);

	// Get combined tokens (explicit + implicit)
	const getAllTokens = useCallback(() => {
		if (!state.tokens && !state.implicitTokens) return null;

		const combined: Record<string, string> = {};

		// Add explicit tokens
		if (state.tokens) {
			combined.access_token = state.tokens.access_token;
			if (state.tokens.refresh_token) combined.refresh_token = state.tokens.refresh_token;
			if (state.tokens.id_token) combined.id_token = state.tokens.id_token;
		}

		// Add implicit tokens (override if needed)
		if (state.implicitTokens) {
			Object.assign(combined, state.implicitTokens);
		}

		return combined;
	}, [state.tokens, state.implicitTokens]);

	// Validate current step
	const isStepValid = useCallback(
		(step: number) => {
			switch (step) {
				case 0:
					return !!state.credentials?.environmentId && !!state.credentials?.clientId;
				case 1:
					return !!state.authorizationUrl;
				case 2:
					return !!state.tokens || !!state.implicitTokens;
				default:
					return false;
			}
		},
		[state]
	);

	// Initialize on mount
	useEffect(() => {
		loadCredentials();
		processUrlFragment();
	}, [loadCredentials, processUrlFragment]);

	return {
		// State
		...state,

		// Actions
		loadCredentials,
		saveCredentials,
		generatePKCE,
		generateAuthorizationUrl,
		exchangeCodeForTokens,
		processUrlFragment,
		setVariant,
		updateCredentials,
		reset,
		redirectToAuthorization,

		// Utilities
		getAllTokens,
		isStepValid,

		// Computed states
		hasTokens: !!state.tokens || !!state.implicitTokens,
		isComplete: state.currentStep >= 2,
		canProceed: isStepValid(state.currentStep + 1),
	};
};

export type UseHybridFlowV8Return = ReturnType<typeof useHybridFlowV8>;
