// src/services/authorizationCodeSharedService.ts
/**
 * Authorization Code Flow Shared Service
 * 
 * Consolidates ALL shared logic between OAuth Authorization Code V5 and OIDC Authorization Code V5
 * to ensure perfect synchronization. Any update here automatically applies to both flows.
 * 
 * Based on the proven ImplicitFlowSharedService pattern.
 */

import { useCallback, useState } from 'react';
import { v4ToastManager } from '../utils/v4ToastMessages';
import { validateForStep } from './credentialsValidationService';
import type { PingOneApplicationState } from '../components/PingOneApplicationConfig';
import type { StepCredentials } from '../components/steps/CommonSteps';

export type AuthzFlowVariant = 'oauth' | 'oidc';

/**
 * Session Storage Management
 * Ensures proper callback routing by setting flow-specific flags
 */
export class AuthzSessionStorageManager {
	/**
	 * Set session storage flag for the active flow (clears the other)
	 */
	static setActiveFlow(variant: AuthzFlowVariant): void {
		if (variant === 'oauth') {
			sessionStorage.removeItem('oidc-authz-v5-flow-active');
			sessionStorage.setItem('oauth-authz-v5-flow-active', 'true');
			console.log('[SessionStorageManager] OAuth Authorization Code V5 flow marked as active');
		} else {
			sessionStorage.removeItem('oauth-authz-v5-flow-active');
			sessionStorage.setItem('oidc-authz-v5-flow-active', 'true');
			console.log('[SessionStorageManager] OIDC Authorization Code V5 flow marked as active');
		}
	}

	/**
	 * Clear all authorization code flow session storage flags
	 */
	static clearAllFlowFlags(): void {
		sessionStorage.removeItem('oauth-authz-v5-flow-active');
		sessionStorage.removeItem('oidc-authz-v5-flow-active');
		console.log('[SessionStorageManager] All authorization code flow flags cleared');
	}

	/**
	 * Check which flow is currently active
	 */
	static getActiveFlow(): AuthzFlowVariant | null {
		const hasOAuth = sessionStorage.getItem('oauth-authz-v5-flow-active') === 'true';
		const hasOIDC = sessionStorage.getItem('oidc-authz-v5-flow-active') === 'true';

		if (hasOAuth && !hasOIDC) return 'oauth';
		if (hasOIDC && !hasOAuth) return 'oidc';
		return null;
	}

	/**
	 * Save PingOne app configuration to session storage
	 */
	static savePingOneConfig(variant: AuthzFlowVariant, config: PingOneApplicationState): void {
		const key = variant === 'oauth' 
			? 'oauth-authz-v5-app-config' 
			: 'oidc-authz-v5-app-config';
		sessionStorage.setItem(key, JSON.stringify(config));
		console.log(`[SessionStorageManager] ${variant.toUpperCase()} PingOne config saved`);
	}

	/**
	 * Load PingOne app configuration from session storage
	 */
	static loadPingOneConfig(variant: AuthzFlowVariant): PingOneApplicationState | null {
		const key = variant === 'oauth' 
			? 'oauth-authz-v5-app-config' 
			: 'oidc-authz-v5-app-config';
		const stored = sessionStorage.getItem(key);
		return stored ? JSON.parse(stored) : null;
	}
}

/**
 * Toast Notification Manager
 * Provides consistent toast messages across both flows
 */
export class AuthzFlowToastManager {
	/**
	 * Show success toast for PingOne config save
	 */
	static showPingOneConfigSaved(): void {
		v4ToastManager.showSuccess('PingOne configuration saved successfully!');
	}

	/**
	 * Show success toast for credentials save
	 */
	static showCredentialsSaved(): void {
		v4ToastManager.showSuccess('Credentials saved successfully!');
	}

	/**
	 * Show error toast for credentials save failure
	 */
	static showCredentialsSaveFailed(error?: Error): void {
		console.error('[AuthzFlowToastManager] Failed to save credentials:', error);
		v4ToastManager.showError('Failed to save credentials');
	}

	/**
	 * Show success toast for redirect URI save
	 */
	static showRedirectUriSaved(): void {
		v4ToastManager.showSuccess('Redirect URI saved successfully!');
	}

	/**
	 * Show error toast for redirect URI save failure
	 */
	static showRedirectUriSaveFailed(error?: Error): void {
		console.error('[AuthzFlowToastManager] Failed to save redirect URI:', error);
		v4ToastManager.showError('Failed to save redirect URI');
	}

	/**
	 * Show success toast for PKCE generation
	 */
	static showPKCEGenerated(): void {
		v4ToastManager.showSuccess('PKCE parameters generated successfully!');
	}

	/**
	 * Show error toast for PKCE generation failure
	 */
	static showPKCEGenerationFailed(error?: Error): void {
		console.error('[AuthzFlowToastManager] Failed to generate PKCE:', error);
		v4ToastManager.showError('Failed to generate PKCE parameters');
	}

	/**
	 * Show success toast for authorization URL generation
	 */
	static showAuthUrlGenerated(): void {
		v4ToastManager.showSuccess('Authorization URL generated successfully!');
	}

	/**
	 * Show error toast for authorization URL generation failure
	 */
	static showAuthUrlGenerationFailed(error: Error | unknown): void {
		const message = error instanceof Error ? error.message : 'Failed to generate authorization URL';
		v4ToastManager.showError(message);
	}

	/**
	 * Show success toast for authorization code received
	 */
	static showAuthCodeReceived(): void {
		v4ToastManager.showSuccess('Authorization code received successfully!');
	}

	/**
	 * Show success toast for token exchange
	 */
	static showTokenExchangeSuccess(): void {
		v4ToastManager.showSuccess('Tokens exchanged successfully!');
	}

	/**
	 * Show error toast for token exchange failure
	 */
	static showTokenExchangeFailed(error?: Error): void {
		console.error('[AuthzFlowToastManager] Token exchange failed:', error);
		v4ToastManager.showError('Failed to exchange authorization code for tokens');
	}

	/**
	 * Show error toast for missing credentials
	 */
	static showMissingCredentials(): void {
		v4ToastManager.showError('Complete above action: Fill in Client ID and Environment ID first.');
	}

	/**
	 * Show error toast for missing PKCE
	 */
	static showMissingPKCE(): void {
		v4ToastManager.showError('Complete above action: Generate PKCE parameters first.');
	}

	/**
	 * Show error toast for missing auth URL
	 */
	static showMissingAuthUrl(): void {
		v4ToastManager.showError('Complete above action: Generate the authorization URL first.');
	}

	/**
	 * Show error toast for missing auth code
	 */
	static showMissingAuthCode(): void {
		v4ToastManager.showError('Complete above action: Complete authorization to receive the code.');
	}

	/**
	 * Show validation error with missing fields
	 */
	static showValidationError(missingFields: string[]): void {
		const fieldNames = missingFields.join(', ');
		v4ToastManager.showError(`Please fill in required fields: ${fieldNames}`);
	}

	/**
	 * Show step completion error
	 */
	static showStepIncomplete(): void {
		v4ToastManager.showError('Complete the action above to continue.');
	}
}

/**
 * PKCE Management
 * Authorization Code Flow specific - handles PKCE generation and validation
 */
export class AuthzFlowPKCEManager {
	/**
	 * Generate PKCE code verifier and challenge
	 */
	static async generatePKCE(
		variant: AuthzFlowVariant,
		credentials: StepCredentials,
		controller: any
	): Promise<boolean> {
		console.log('[PKCEManager] Starting PKCE generation...', {
			variant,
			clientId: credentials.clientId,
			environmentId: credentials.environmentId,
			hasController: !!controller,
			hasGenerateMethod: !!controller?.generatePkceCodes
		});

		if (!credentials.clientId || !credentials.environmentId) {
			console.log('[PKCEManager] Missing credentials:', {
				clientId: !!credentials.clientId,
				environmentId: !!credentials.environmentId
			});
			AuthzFlowToastManager.showMissingCredentials();
			return false;
		}

		if (!controller?.generatePkceCodes) {
			console.error('[PKCEManager] Controller does not have generatePkceCodes method');
			AuthzFlowToastManager.showPKCEGenerationFailed(new Error('Controller missing generatePkceCodes method'));
			return false;
		}

		try {
			console.log('[PKCEManager] Calling controller.generatePkceCodes()...');
			await controller.generatePkceCodes();
			
			console.log('[PKCEManager] PKCE generation completed, checking results...', {
				codeVerifier: controller.pkceCodes?.codeVerifier ? 'present' : 'missing',
				codeChallenge: controller.pkceCodes?.codeChallenge ? 'present' : 'missing'
			});
			
			AuthzFlowToastManager.showPKCEGenerated();
			console.log(`[${variant.toUpperCase()} Authz V5] PKCE parameters generated successfully`);
			return true;
		} catch (error) {
			console.error('[PKCEManager] Failed to generate PKCE:', error);
			AuthzFlowToastManager.showPKCEGenerationFailed(error as Error);
			return false;
		}
	}

	/**
	 * Validate PKCE parameters are present
	 */
	static validatePKCE(controller: any): boolean {
		// Enhanced validation - checks both controller state and session storage for PKCE codes
		const hasPkceCodes = !!(controller.pkceCodes?.codeVerifier && controller.pkceCodes?.codeChallenge) || 
						   !!sessionStorage.getItem(`${controller.persistKey}-pkce-codes`);
		
		if (!hasPkceCodes) {
			AuthzFlowToastManager.showMissingPKCE();
			return false;
		}
		return true;
	}

	/**
	 * Check if PKCE is generated
	 */
	static hasPKCE(controller: any): boolean {
		// Enhanced validation - checks both controller state and session storage for PKCE codes
		return !!(controller.pkceCodes?.codeVerifier && controller.pkceCodes?.codeChallenge) || 
			   !!sessionStorage.getItem(`${controller.persistKey}-pkce-codes`);
	}
}

/**
 * Validation Manager
 * Centralized validation for both flows
 */
export class AuthzFlowValidationManager {
	/**
	 * Validate navigation from step 0 to step 1
	 */
	static validateStep0ToStep1(
		credentials: StepCredentials,
		variant: AuthzFlowVariant
	): { isValid: boolean; missingFields: string[] } {
		const flowType = variant === 'oauth' ? 'authorization-code' : 'authorization-code';
		const validation = validateForStep(1, credentials, flowType);

		if (!validation.isValid) {
			// Format field names for display
			const fieldNames = validation.missingFields.map(f => {
				switch (f) {
					case 'environmentId': return 'Environment ID';
					case 'clientId': return 'Client ID';
					case 'clientSecret': return 'Client Secret';
					case 'redirectUri': return 'Redirect URI';
					case 'scope': return variant === 'oidc' 
						? 'Scope (must include openid)' 
						: 'Scope';
					default: return f;
				}
			});

			AuthzFlowToastManager.showValidationError(fieldNames);
			return { isValid: false, missingFields: fieldNames };
		}

		return { isValid: true, missingFields: [] };
	}

	/**
	 * Validate step 1 to step 2 (PKCE must be generated)
	 */
	static validateStep1ToStep2(controller: any): boolean {
		return AuthzFlowPKCEManager.validatePKCE(controller);
	}

	/**
	 * Check if credentials are valid for generating auth URL
	 */
	static canGenerateAuthUrl(credentials: StepCredentials, controller: any): boolean {
		if (!credentials.clientId || !credentials.environmentId) {
			AuthzFlowToastManager.showMissingCredentials();
			return false;
		}

		if (!AuthzFlowPKCEManager.validatePKCE(controller)) {
			return false;
		}

		return true;
	}

	/**
	 * Check if auth URL exists for redirect
	 */
	static canRedirect(authUrl: string | undefined): boolean {
		if (!authUrl) {
			AuthzFlowToastManager.showMissingAuthUrl();
			return false;
		}
		return true;
	}

	/**
	 * Check if auth code exists for token exchange
	 */
	static canExchangeTokens(authCode: string | undefined): boolean {
		if (!authCode) {
			AuthzFlowToastManager.showMissingAuthCode();
			return false;
		}
		return true;
	}
}

/**
 * Credentials Change Handlers
 * Standardized handlers for credential updates
 */
export class AuthzFlowCredentialsHandlers {
	/**
	 * Create environment ID change handler
	 */
	static createEnvironmentIdHandler(
		variant: AuthzFlowVariant,
		controller: any,
		setCredentials: (creds: StepCredentials) => void
	) {
		return (value: string) => {
			const updated = { ...controller.credentials, environmentId: value };
			controller.setCredentials(updated);
			setCredentials(updated);
			console.log(`[${variant.toUpperCase()} Authz V5] Environment ID updated:`, value);
		};
	}

	/**
	 * Create client ID change handler
	 */
	static createClientIdHandler(
		variant: AuthzFlowVariant,
		controller: any,
		setCredentials: (creds: StepCredentials) => void
	) {
		return (value: string) => {
			const updated = { ...controller.credentials, clientId: value };
			controller.setCredentials(updated);
			setCredentials(updated);
			console.log(`[${variant.toUpperCase()} Authz V5] Client ID updated:`, value);
		};
	}

	/**
	 * Create client secret change handler
	 */
	static createClientSecretHandler(
		controller: any,
		setCredentials: (creds: StepCredentials) => void
	) {
		return (value: string) => {
			const updated = { ...controller.credentials, clientSecret: value };
			controller.setCredentials(updated);
			setCredentials(updated);
		};
	}

	/**
	 * Create redirect URI change handler with auto-save
	 */
	static createRedirectUriHandler(
		variant: AuthzFlowVariant,
		controller: any,
		setCredentials: (creds: StepCredentials) => void
	) {
		return (value: string) => {
			const updated = { ...controller.credentials, redirectUri: value };
			controller.setCredentials(updated);
			setCredentials(updated);
			console.log(`[${variant.toUpperCase()} Authz V5] Redirect URI updated:`, value);
			
			// Auto-save redirect URI to persist across refreshes
			controller.saveCredentials()
				.then(() => {
					AuthzFlowToastManager.showRedirectUriSaved();
				})
				.catch((error: Error) => {
					AuthzFlowToastManager.showRedirectUriSaveFailed(error);
				});
		};
	}

	/**
	 * Create scopes change handler
	 */
	static createScopesHandler(
		controller: any,
		setCredentials: (creds: StepCredentials) => void
	) {
		return (value: string) => {
			const updated = { ...controller.credentials, scope: value, scopes: value };
			controller.setCredentials(updated);
			setCredentials(updated);
		};
	}

	/**
	 * Create login hint change handler
	 */
	static createLoginHintHandler(
		controller: any,
		setCredentials: (creds: StepCredentials) => void
	) {
		return (value: string) => {
			const updated = { ...controller.credentials, loginHint: value };
			controller.setCredentials(updated);
			setCredentials(updated);
		};
	}

	/**
	 * Create save credentials handler
	 */
	static createSaveHandler(
		variant: AuthzFlowVariant,
		controller: any
	) {
		return async () => {
			try {
				await controller.saveCredentials();
				AuthzFlowToastManager.showCredentialsSaved();
			} catch (error) {
				console.error(`[${variant.toUpperCase()} Authz V5] Failed to save credentials:`, error);
				AuthzFlowToastManager.showCredentialsSaveFailed(error as Error);
			}
		};
	}

	/**
	 * Create OIDC discovery complete handler
	 */
	static createDiscoveryHandler(variant: AuthzFlowVariant) {
		return (result: any) => {
			console.log(`[${variant.toUpperCase()} Authz V5] OIDC Discovery completed:`, result);
			// Service already handles environment ID extraction
		};
	}

	/**
	 * Create PingOne config save handler
	 */
	static createPingOneConfigHandler(
		variant: AuthzFlowVariant,
		setPingOneConfig: (config: PingOneApplicationState) => void
	) {
		return (config: PingOneApplicationState) => {
			setPingOneConfig(config);
			AuthzSessionStorageManager.savePingOneConfig(variant, config);
			AuthzFlowToastManager.showPingOneConfigSaved();
		};
	}
}

/**
 * Authorization URL Generation
 * Shared logic for generating and opening authorization URLs
 */
export class AuthzFlowAuthorizationManager {
	/**
	 * Generate authorization URL with proper session storage setup and PKCE
	 */
	static async generateAuthUrl(
		variant: AuthzFlowVariant,
		credentials: StepCredentials,
		controller: any
	): Promise<boolean> {
		console.log(`[${variant.toUpperCase()} Authz V5] Generate URL - Checking credentials:`, {
			local_clientId: credentials.clientId,
			local_environmentId: credentials.environmentId,
			controller_clientId: controller.credentials?.clientId,
			controller_environmentId: controller.credentials?.environmentId,
			has_pkce: AuthzFlowPKCEManager.hasPKCE(controller),
		});

		// Validate credentials and PKCE
		if (!AuthzFlowValidationManager.canGenerateAuthUrl(credentials, controller)) {
			return false;
		}

		// State generation is handled internally by the controller

		try {
			// Set session storage flag for callback routing
			AuthzSessionStorageManager.setActiveFlow(variant);

			// Generate the URL
			await controller.generateAuthorizationUrl();
			
			AuthzFlowToastManager.showAuthUrlGenerated();
			return true;
		} catch (error) {
			console.error(`[${variant.toUpperCase()}AuthzFlowV5] Failed to generate authorization URL:`, error);
			AuthzFlowToastManager.showAuthUrlGenerationFailed(error);
			return false;
		}
	}

	/**
	 * Open authorization URL (redirect to PingOne)
	 */
	static openAuthUrl(authUrl: string | undefined): boolean {
		if (!AuthzFlowValidationManager.canRedirect(authUrl)) {
			return false;
		}
		return true; // Caller handles actual redirect (modal, etc.)
	}
}

/**
 * Authorization Code Processing
 * Handles authorization code received from callback
 */
export class AuthzFlowCodeProcessor {
	/**
	 * Process authorization code from URL callback
	 */
	static processAuthorizationCode(
		code: string,
		state: string | null,
		setAuthCode: (code: string) => void,
		setState: (state: string) => void,
		setCurrentStep: (step: number) => void
	): void {
		console.log('[CodeProcessor] Processing authorization code:', { 
			code: code.substring(0, 20) + '...', 
			state 
		});

		// Store the code
		setAuthCode(code);
		if (state) {
			setState(state);
		}

		// Auto-advance to token exchange step (step 4)
		setCurrentStep(4);

		// Show success message
		AuthzFlowToastManager.showAuthCodeReceived();

		// Clean up URL
		window.history.replaceState({}, '', window.location.pathname);
	}

	/**
	 * Check for authorization code in URL
	 */
	static checkForAuthCode(): { code: string | null; state: string | null; error: string | null } {
		const urlParams = new URLSearchParams(window.location.search);
		const code = urlParams.get('code');
		const state = urlParams.get('state');
		const error = urlParams.get('error');
		const errorDescription = urlParams.get('error_description');

		if (error) {
			console.error('[CodeProcessor] OAuth error:', error, errorDescription);
			v4ToastManager.showError(`Authorization failed: ${errorDescription || error}`);
			return { code: null, state: null, error };
		}

		return { code, state, error: null };
	}
}

/**
 * Token Exchange Manager
 * Handles exchanging authorization code for tokens
 */
export class AuthzFlowTokenExchangeManager {
	/**
	 * Exchange authorization code for tokens
	 */
	static async exchangeCodeForTokens(
		variant: AuthzFlowVariant,
		credentials: StepCredentials,
		authCode: string,
		codeVerifier: string,
		controller: any
	): Promise<boolean> {
		if (!AuthzFlowValidationManager.canExchangeTokens(authCode)) {
			return false;
		}

		try {
			console.log(`[${variant.toUpperCase()} Authz V5] Exchanging authorization code for tokens...`);

			// Use controller's token exchange method
			await controller.exchangeCodeForTokens(authCode, codeVerifier);

			AuthzFlowToastManager.showTokenExchangeSuccess();
			return true;
		} catch (error) {
			console.error('[TokenExchangeManager] Token exchange failed:', error);
			AuthzFlowToastManager.showTokenExchangeFailed(error as Error);
			return false;
		}
	}
}

/**
 * Step Navigation Manager
 * Handles step validation and navigation logic
 */
export class AuthzFlowNavigationManager {
	/**
	 * Validate and handle next step navigation
	 */
	static handleNext(
		currentStep: number,
		credentials: StepCredentials,
		variant: AuthzFlowVariant,
		controller: any,
		isStepValid: (step: number) => boolean,
		handleNext: () => void
	): void {
		// Validate credentials before proceeding from step 0 to step 1
		if (currentStep === 0) {
			const result = AuthzFlowValidationManager.validateStep0ToStep1(credentials, variant);
			if (!result.isValid) {
				return; // Toast already shown by validation manager
			}
		}

		// Validate PKCE before proceeding from step 1 to step 2
		if (currentStep === 1) {
			if (!AuthzFlowValidationManager.validateStep1ToStep2(controller)) {
				return; // Toast already shown
			}
		}

		// Check step-specific validity
		if (!isStepValid(currentStep)) {
			AuthzFlowToastManager.showStepIncomplete();
			return;
		}

		// Navigation allowed
		handleNext();
	}

	/**
	 * Check if navigation to next step is allowed
	 */
	static canNavigateNext(
		currentStep: number,
		maxSteps: number,
		isStepValid: (step: number) => boolean
	): boolean {
		return currentStep < maxSteps - 1 && isStepValid(currentStep);
	}
}

/**
 * Default Configuration Provider
 * Provides flow-specific default configurations
 */
export class AuthzFlowDefaults {
	/**
	 * Get default credentials for OAuth Authorization Code
	 */
	static getOAuthDefaults(): Partial<StepCredentials> {
		return {
			redirectUri: require('../services/flowRedirectUriService').FlowRedirectUriService.getDefaultRedirectUri('authorization-code'),
			scope: '',  // OAuth doesn't require openid scope
			scopes: '',
			responseType: 'code',
			grantType: 'authorization_code',
			clientAuthMethod: 'client_secret_post',
		};
	}

	/**
	 * Get default credentials for OIDC Authorization Code
	 */
	static getOIDCDefaults(): Partial<StepCredentials> {
		return {
			redirectUri: require('../services/flowRedirectUriService').FlowRedirectUriService.getDefaultRedirectUri('authorization-code'),
			scope: 'openid profile email',
			scopes: 'openid profile email',
			responseType: 'code',
			grantType: 'authorization_code',
			clientAuthMethod: 'client_secret_post',
		};
	}

	/**
	 * Get default PingOne app config for Authorization Code flows
	 */
	static getDefaultAppConfig(variant: AuthzFlowVariant): PingOneApplicationState {
		return {
			clientAuthMethod: 'client_secret_post',
			allowRedirectUriPatterns: false,
			pkceEnforcement: 'REQUIRED',
			responseTypeCode: true,
			responseTypeToken: false,
			responseTypeIdToken: variant === 'oidc', // Only OIDC returns ID token
			grantTypeAuthorizationCode: true,
			initiateLoginUri: '',
			targetLinkUri: '',
			signoffUrls: [],
			requestParameterSignatureRequirement: 'DEFAULT',
			enableJWKS: false,
			jwksMethod: 'JWKS_URL',
			jwksUrl: '',
			jwks: '',
			requirePushedAuthorizationRequest: false,
			pushedAuthorizationRequestTimeout: 60,
			additionalRefreshTokenReplayProtection: false,
			includeX5tParameter: false,
			oidcSessionManagement: false,
			requestScopesForMultipleResources: false,
			terminateUserSessionByIdToken: false,
			corsOrigins: [],
			corsAllowAnyOrigin: false,
		};
	}

	/**
	 * Get default collapsed sections state
	 */
	static getDefaultCollapsedSections(): Record<string, boolean> {
		return {
			overview: true,
			flowDiagram: true,
			configuration: false, // Expanded by default (condensed V7)
			credentials: false, // Expanded by default
			pkceOverview: false, // Expanded by default for Step 1
			pkceDetails: true,
			authRequestOverview: false, // Expanded by default for Step 2
			authRequestDetails: true,
			authResponseOverview: false, // Expanded by default for Step 3
			authResponseDetails: true,
			tokenExchangeOverview: false, // Expanded by default for Step 4
			tokenExchangeDetails: false, // Expanded by default for Step 4
			introspectionOverview: true,
			introspectionDetails: false, // Expanded by default for introspection
			securityOverview: true,
			securityDetails: true,
			completionOverview: true,
			completionDetails: true,
			flowSummary: false, // Expanded by default for flow summary
		};
	}
}

/**
 * Token Management Integration
 * Handles navigation to token management page
 */
export class AuthzFlowTokenManagement {
	/**
	 * Navigate to token management page with flow context
	 */
	static navigateToTokenManagement(
		variant: AuthzFlowVariant,
		tokens: any,
		credentials: StepCredentials,
		currentStep: number
	): void {
		const flowId = variant === 'oauth' ? 'oauth-authorization-code-v5' : 'oidc-authorization-code-v5';
		const flowType = variant === 'oauth' ? 'oauth' : 'oidc';

		// Store flow navigation state for back navigation
		const { storeFlowNavigationState } = require('../utils/flowNavigation');
		storeFlowNavigationState(flowId, currentStep, flowType);

		// Set flow source for Token Management page
		sessionStorage.setItem('flow_source', flowId);

		// Store flow context
		const flowContext = {
			flow: flowId,
			tokens: tokens,
			credentials: credentials,
			timestamp: Date.now(),
		};
		sessionStorage.setItem('tokenManagementFlowContext', JSON.stringify(flowContext));

		// Store token for analysis
		if (tokens?.access_token) {
			localStorage.setItem('token_to_analyze', tokens.access_token);
			localStorage.setItem('token_type', 'access');
			localStorage.setItem('flow_source', flowId);
		}

		// Open token management in new tab
		window.open('/token-management', '_blank');
	}
}

/**
 * Step Restoration
 * Handles restoring step from session storage (e.g., returning from token management)
 */
export class AuthzFlowStepRestoration {
	/**
	 * Get initial step with restoration from session storage
	 */
	static getInitialStep(): number {
		const restoreStep = sessionStorage.getItem('restore_step');
		if (restoreStep) {
			const step = parseInt(restoreStep, 10);
			sessionStorage.removeItem('restore_step');
			console.log('[StepRestoration] Restoring to step:', step);
			return step;
		}
		return 0;
	}

	/**
	 * Store step for later restoration
	 */
	static storeStepForRestoration(step: number): void {
		sessionStorage.setItem('restore_step', step.toString());
		console.log('[StepRestoration] Step stored for restoration:', step);
	}

	/**
	 * Scroll to top when step changes (for step navigation)
	 */
	static scrollToTopOnStepChange(): void {
		window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
		document.documentElement.scrollTop = 0;
		document.body.scrollTop = 0;
	}
}

/**
 * Collapsible Sections Manager
 * Manages state for all collapsible sections
 */
export class AuthzFlowCollapsibleSectionsManager {
	/**
	 * Get default collapsed sections state
	 */
	static getDefaultState(): Record<string, boolean> {
		return AuthzFlowDefaults.getDefaultCollapsedSections();
	}

	/**
	 * Create toggle handler
	 */
	static createToggleHandler(
		setCollapsedSections: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
	): (key: string) => void {
		return (key: string) => {
			setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));
		};
	}

	/**
	 * Expand specific sections
	 */
	static expandSections(
		sections: string[],
		setCollapsedSections: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
	): void {
		setCollapsedSections((prev) => {
			const updated = { ...prev };
			sections.forEach(section => {
				updated[section] = false;
			});
			return updated;
		});
	}

	/**
	 * Collapse specific sections
	 */
	static collapseSections(
		sections: string[],
		setCollapsedSections: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
	): void {
		setCollapsedSections((prev) => {
			const updated = { ...prev };
			sections.forEach(section => {
				updated[section] = true;
			});
			return updated;
		});
	}
}

/**
 * Response Type Enforcement
 * Ensures correct response_type for each flow variant
 */
export class AuthzFlowResponseTypeEnforcer {
	/**
	 * Get expected response type for variant (both use 'code')
	 */
	static getExpectedResponseType(_variant: AuthzFlowVariant): string {
		return 'code'; // Both OAuth and OIDC use 'code' for authorization code flow
	}

	/**
	 * Enforce correct response type
	 */
	static enforceResponseType(
		variant: AuthzFlowVariant,
		credentials: StepCredentials,
		setCredentials: (creds: StepCredentials) => void
	): void {
		const expectedType = AuthzFlowResponseTypeEnforcer.getExpectedResponseType(variant);
		
		if (credentials.responseType !== expectedType) {
			console.log(`[ResponseTypeEnforcer] Correcting response_type from '${credentials.responseType}' to '${expectedType}'`);
			setCredentials({
				...credentials,
				responseType: expectedType,
			});
		}
	}
}

/**
 * Credentials Synchronization
 * Keeps local credentials in sync with controller credentials
 */
export class AuthzFlowCredentialsSync {
	/**
	 * Sync credentials from controller to local state
	 */
	static syncCredentials(
		variant: AuthzFlowVariant,
		controllerCredentials: any,
		setCredentials: (creds: StepCredentials) => void
	): void {
		if (controllerCredentials) {
			console.log(`[${variant.toUpperCase()} Authz V5] Syncing credentials from controller:`, controllerCredentials);
			setCredentials(controllerCredentials);
		}
	}
}

/**
 * Modal State Manager
 * Manages success and redirect modals
 */
export class AuthzFlowModalManager {
	/**
	 * Create modal handlers
	 */
	static createHandlers(controller: any) {
		const [showSuccessModal, setShowSuccessModal] = useState(false);
		const [showRedirectModal, setShowRedirectModal] = useState(false);
		const [showCodeReceivedModal, setShowCodeReceivedModal] = useState(false);

		const handleConfirmRedirect = useCallback(() => {
			setShowRedirectModal(false);
			controller.handleRedirectAuthorization();
		}, [controller]);

		const handleCancelRedirect = useCallback(() => {
			setShowRedirectModal(false);
		}, []);

		const handleCloseCodeModal = useCallback(() => {
			setShowCodeReceivedModal(false);
		}, []);

		return {
			showSuccessModal,
			setShowSuccessModal,
			showRedirectModal,
			setShowRedirectModal,
			showCodeReceivedModal,
			setShowCodeReceivedModal,
			handleConfirmRedirect,
			handleCancelRedirect,
			handleCloseCodeModal,
		};
	}
}

/**
 * Main Service Export
 * Single import point for all authorization code flow shared functionality
 */
export const AuthorizationCodeSharedService = {
	SessionStorage: AuthzSessionStorageManager,
	Toast: AuthzFlowToastManager,
	Validation: AuthzFlowValidationManager,
	Navigation: AuthzFlowNavigationManager,
	Defaults: AuthzFlowDefaults,
	TokenManagement: AuthzFlowTokenManagement,
	CredentialsHandlers: AuthzFlowCredentialsHandlers,
	PKCE: AuthzFlowPKCEManager,
	Authorization: AuthzFlowAuthorizationManager,
	CodeProcessor: AuthzFlowCodeProcessor,
	TokenExchange: AuthzFlowTokenExchangeManager,
	StepRestoration: AuthzFlowStepRestoration,
	CollapsibleSections: AuthzFlowCollapsibleSectionsManager,
	ModalManager: AuthzFlowModalManager,
	ResponseTypeEnforcer: AuthzFlowResponseTypeEnforcer,
	CredentialsSync: AuthzFlowCredentialsSync,
};

export default AuthorizationCodeSharedService;

