// src/services/implicitFlowSharedService.ts
/**
 * Implicit Flow Shared Service
 *
 * Consolidates ALL shared logic between OAuth Implicit V5 and OIDC Implicit V5
 * to ensure perfect synchronization. Any update here automatically applies to both flows.
 */

import { useCallback, useState } from 'react';
import type { PingOneApplicationState } from '../components/PingOneApplicationConfig';
import type { StepCredentials } from '../components/steps/CommonSteps';
import { v4ToastManager } from '../utils/v4ToastMessages';
import { validateForStep } from './credentialsValidationService';

export type ImplicitFlowVariant = 'oauth' | 'oidc';

/**
 * Session Storage Management
 * Ensures proper callback routing by setting flow-specific flags
 */
const SESSION_FLAG_CONFIG = {
	default: {
		v5: 'implicit-v5-active',
		v6: 'implicit-v6-active',
		v7: 'implicit-v7-active',
	},
	oauth: {
		v5: 'oauth-implicit-v5-flow-active',
		v6: 'oauth-implicit-v6-flow-active',
		v7: 'implicit-flow-v7-oauth-active',
	},
	oidc: {
		v5: 'oidc-implicit-v5-flow-active',
		v6: 'oidc-implicit-v6-flow-active',
		v7: 'implicit-flow-v7-oidc-active',
	},
} as const;

export class SessionStorageManager {
	/**
	 * Set session storage flag for the active flow (clears the other)
	 */
	static setActiveFlow(variant: ImplicitFlowVariant, version: 'v5' | 'v6' | 'v7' = 'v5'): void {
		const keys = SESSION_FLAG_CONFIG[variant];
		const activeKey = keys[version];
		const otherVariant = variant === 'oauth' ? 'oidc' : 'oauth';
		const otherKey = SESSION_FLAG_CONFIG[otherVariant][version];

		sessionStorage.removeItem(otherKey);
		sessionStorage.setItem(activeKey, 'true');

		console.log(
			`[SessionStorageManager] ${variant.toUpperCase()} Implicit ${version.toUpperCase()} flow marked as active`
		);

		if (version === 'v7') {
			sessionStorage.setItem(SESSION_FLAG_CONFIG.default.v7, variant);
		}
	}

	/**
	 * Clear all implicit flow session storage flags
	 */
	static clearAllFlowFlags(): void {
		Object.values(SESSION_FLAG_CONFIG.oauth).forEach((key) => sessionStorage.removeItem(key));
		Object.values(SESSION_FLAG_CONFIG.oidc).forEach((key) => sessionStorage.removeItem(key));
		console.log('[SessionStorageManager] All implicit flow flags cleared');
	}

	/**
	 * Check which flow is currently active (v7 takes precedence)
	 */
	static getActiveFlow(version: 'v5' | 'v6' | 'v7' = 'v5'): ImplicitFlowVariant | null {
		if (version === 'v7') {
			const selected = sessionStorage.getItem(SESSION_FLAG_CONFIG.default.v7);
			return selected === 'oidc' || selected === 'oauth' ? selected : null;
		}

		const hasOAuth = sessionStorage.getItem(SESSION_FLAG_CONFIG.oauth[version]) === 'true';
		const hasOIDC = sessionStorage.getItem(SESSION_FLAG_CONFIG.oidc[version]) === 'true';

		if (hasOAuth && !hasOIDC) return 'oauth';
		if (hasOIDC && !hasOAuth) return 'oidc';
		return null;
	}

	/**
	 * Save PingOne app configuration to session storage
	 */
	static savePingOneConfig(
		variant: ImplicitFlowVariant,
		config: PingOneApplicationState,
		version: 'v5' | 'v6' | 'v7' = 'v5'
	): void {
		const key = `${variant}-implicit-${version}-app-config`;
		sessionStorage.setItem(key, JSON.stringify(config));
		console.log(
			`[SessionStorageManager] ${variant.toUpperCase()} Implicit ${version.toUpperCase()} PingOne config saved`
		);
	}

	/**
	 * Load PingOne app configuration from session storage
	 */
	static loadPingOneConfig(
		variant: ImplicitFlowVariant,
		version: 'v5' | 'v6' | 'v7' = 'v5'
	): PingOneApplicationState | null {
		const key = `${variant}-implicit-${version}-app-config`;
		const stored = sessionStorage.getItem(key);
		return stored ? JSON.parse(stored) : null;
	}
}

/**
 * Toast Notification Manager
 * Provides consistent toast messages across both flows
 */
export class ImplicitFlowToastManager {
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
		console.error('[ImplicitFlowToastManager] Failed to save credentials:', error);
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
		console.error('[ImplicitFlowToastManager] Failed to save redirect URI:', error);
		v4ToastManager.showError('Failed to save redirect URI');
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
	 * Show error toast for missing credentials
	 */
	static showMissingCredentials(): void {
		v4ToastManager.showError('Complete above action: Fill in Client ID and Environment ID first.');
	}

	/**
	 * Show error toast for missing auth URL
	 */
	static showMissingAuthUrl(): void {
		v4ToastManager.showError('Complete above action: Generate the authorization URL first.');
	}

	/**
	 * Show success toast for tokens received
	 */
	static showTokensReceived(): void {
		v4ToastManager.showSuccess('Tokens received successfully from authorization server!');
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
 * Validation Manager
 * Centralized validation for both flows
 */
export class ImplicitFlowValidationManager {
	/**
	 * Validate navigation from step 0 to step 1
	 */
	static validateStep0ToStep1(
		credentials: StepCredentials,
		variant: ImplicitFlowVariant
	): { isValid: boolean; missingFields: string[] } {
		const flowType = variant === 'oauth' ? 'oauth-implicit' : 'oidc-implicit';
		const validation = validateForStep(1, credentials, flowType);

		if (!validation.isValid) {
			// Format field names for display
			const fieldNames = validation.missingFields.map((f) => {
				switch (f) {
					case 'environmentId':
						return 'Environment ID';
					case 'clientId':
						return 'Client ID';
					case 'redirectUri':
						return 'Redirect URI';
					case 'scope':
						return variant === 'oidc' ? 'Scope (must include openid)' : 'Scope';
					default:
						return f;
				}
			});

			ImplicitFlowToastManager.showValidationError(fieldNames);
			return { isValid: false, missingFields: fieldNames };
		}

		return { isValid: true, missingFields: [] };
	}

	/**
	 * Check if credentials are valid for generating auth URL
	 */
	static canGenerateAuthUrl(credentials: StepCredentials): boolean {
		if (!credentials.clientId || !credentials.environmentId) {
			ImplicitFlowToastManager.showMissingCredentials();
			return false;
		}
		return true;
	}

	/**
	 * Check if auth URL exists for redirect
	 */
	static canRedirect(authUrl: string | undefined): boolean {
		if (!authUrl) {
			ImplicitFlowToastManager.showMissingAuthUrl();
			return false;
		}
		return true;
	}
}

/**
 * Credentials Change Handlers
 * Standardized handlers for credential updates
 */
export class ImplicitFlowCredentialsHandlers {
	/**
	 * Create environment ID change handler
	 */
	static createEnvironmentIdHandler(
		variant: ImplicitFlowVariant,
		controller: any,
		setCredentials: (creds: StepCredentials) => void
	) {
		return (value: string) => {
			const updated = { ...controller.credentials, environmentId: value };
			controller.setCredentials(updated);
			setCredentials(updated);
			console.log(`[${variant.toUpperCase()} Implicit V5] Environment ID updated:`, value);
		};
	}

	/**
	 * Create client ID change handler
	 */
	static createClientIdHandler(
		variant: ImplicitFlowVariant,
		controller: any,
		setCredentials: (creds: StepCredentials) => void
	) {
		return (value: string) => {
			const updated = { ...controller.credentials, clientId: value };
			controller.setCredentials(updated);
			setCredentials(updated);
			console.log(`[${variant.toUpperCase()} Implicit V5] Client ID updated:`, value);
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
		variant: ImplicitFlowVariant,
		controller: any,
		setCredentials: (creds: StepCredentials) => void
	) {
		return (value: string) => {
			const updated = { ...controller.credentials, redirectUri: value };
			controller.setCredentials(updated);
			setCredentials(updated);
			console.log(`[${variant.toUpperCase()} Implicit V5] Redirect URI updated:`, value);

			// Auto-save redirect URI to persist across refreshes
			controller
				.saveCredentials()
				.then(() => {
					ImplicitFlowToastManager.showRedirectUriSaved();
				})
				.catch((error: Error) => {
					ImplicitFlowToastManager.showRedirectUriSaveFailed(error);
				});
		};
	}

	/**
	 * Create scopes change handler
	 */
	static createScopesHandler(controller: any, setCredentials: (creds: StepCredentials) => void) {
		return (value: string) => {
			const updated = { ...controller.credentials, scope: value, scopes: value };
			controller.setCredentials(updated);
			setCredentials(updated);
		};
	}

	/**
	 * Create login hint change handler
	 */
	static createLoginHintHandler(controller: any, setCredentials: (creds: StepCredentials) => void) {
		return (value: string) => {
			const updated = { ...controller.credentials, loginHint: value };
			controller.setCredentials(updated);
			setCredentials(updated);
		};
	}

	/**
	 * Create save credentials handler
	 */
	static createSaveHandler(variant: ImplicitFlowVariant, controller: any) {
		return async () => {
			try {
				await controller.saveCredentials();
				ImplicitFlowToastManager.showCredentialsSaved();
			} catch (error) {
				console.error(`[${variant.toUpperCase()} Implicit V5] Failed to save credentials:`, error);
				ImplicitFlowToastManager.showCredentialsSaveFailed(error as Error);
			}
		};
	}

	/**
	 * Create OIDC discovery complete handler
	 */
	static createDiscoveryHandler(variant: ImplicitFlowVariant) {
		return (result: any) => {
			console.log(`[${variant.toUpperCase()} Implicit V5] OIDC Discovery completed:`, result);
			// Service already handles environment ID extraction
		};
	}

	/**
	 * Create PingOne config save handler
	 */
	static createPingOneConfigHandler(
		variant: ImplicitFlowVariant,
		setPingOneConfig: (config: PingOneApplicationState) => void
	) {
		return (config: PingOneApplicationState) => {
			setPingOneConfig(config);
			SessionStorageManager.savePingOneConfig(variant, config);
			ImplicitFlowToastManager.showPingOneConfigSaved();
		};
	}
}

/**
 * Authorization URL Generation
 * Shared logic for generating and opening authorization URLs
 */
export class ImplicitFlowAuthorizationManager {
	/**
	 * Generate authorization URL with proper session storage setup
	 */
	static async generateAuthUrl(
		variant: ImplicitFlowVariant,
		credentials: StepCredentials,
		controller: any
	): Promise<boolean> {
		console.log(`[${variant.toUpperCase()} Implicit V5] Generate URL - Checking credentials:`, {
			local_clientId: credentials.clientId,
			local_environmentId: credentials.environmentId,
			controller_clientId: controller.credentials?.clientId,
			controller_environmentId: controller.credentials?.environmentId,
		});

		// Validate credentials first
		if (!ImplicitFlowValidationManager.canGenerateAuthUrl(credentials)) {
			return false;
		}

		// Generate nonce and state if not set
		if (!controller.nonce) {
			controller.generateNonce();
		}
		if (!controller.state) {
			controller.generateState();
		}

		try {
			// Set session storage flag for callback routing
			SessionStorageManager.setActiveFlow(variant);

			// Generate the URL
			await controller.generateAuthorizationUrl();

			ImplicitFlowToastManager.showAuthUrlGenerated();
			return true;
		} catch (error) {
			console.error(
				`[${variant.toUpperCase()}ImplicitFlowV5] Failed to generate authorization URL:`,
				error
			);
			ImplicitFlowToastManager.showAuthUrlGenerationFailed(error);
			return false;
		}
	}

	/**
	 * Open authorization URL (redirect to PingOne)
	 */
	static openAuthUrl(authUrl: string | undefined): boolean {
		if (!ImplicitFlowValidationManager.canRedirect(authUrl)) {
			return false;
		}
		return true; // Caller handles actual redirect (modal, etc.)
	}
}

/**
 * Step Navigation Manager
 * Handles step validation and navigation logic
 */
export class ImplicitFlowNavigationManager {
	/**
	 * Validate and handle next step navigation
	 */
	static handleNext(
		currentStep: number,
		credentials: StepCredentials,
		variant: ImplicitFlowVariant,
		isStepValid: (step: number) => boolean,
		handleNext: () => void
	): void {
		// Validate credentials before proceeding from step 0 to step 1
		if (currentStep === 0) {
			const result = ImplicitFlowValidationManager.validateStep0ToStep1(credentials, variant);
			if (!result.isValid) {
				return; // Toast already shown by validation manager
			}
		}

		// Check step-specific validity
		if (!isStepValid(currentStep)) {
			ImplicitFlowToastManager.showStepIncomplete();
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
export class ImplicitFlowDefaults {
	/**
	 * Get default credentials for OAuth Implicit
	 */
	static getOAuthDefaults(): Partial<StepCredentials> {
		const { FlowRedirectUriService } = require('../services/flowRedirectUriService');
		return {
			redirectUri: FlowRedirectUriService.getDefaultRedirectUri('oauth-implicit-v6'),
			scope: 'openid profile email', // Consistent scopes for both OAuth 2.0 and OIDC variants
			scopes: 'openid profile email', // Consistent scopes for both OAuth 2.0 and OIDC variants
			responseType: 'token',
			clientAuthMethod: 'none',
		};
	}

	/**
	 * Get default credentials for OIDC Implicit
	 */
	static getOIDCDefaults(): Partial<StepCredentials> {
		const { FlowRedirectUriService } = require('../services/flowRedirectUriService');
		return {
			redirectUri: FlowRedirectUriService.getDefaultRedirectUri('oidc-implicit-v6'),
			scope: 'openid profile email',
			scopes: 'openid profile email',
			responseType: 'id_token token',
			clientAuthMethod: 'none',
		};
	}

	/**
	 * Get default PingOne app config for Implicit flows
	 */
	static getDefaultAppConfig(variant: ImplicitFlowVariant): PingOneApplicationState {
		return {
			clientAuthMethod: 'none',
			allowRedirectUriPatterns: false,
			pkceEnforcement: 'OPTIONAL',
			responseTypeCode: false,
			responseTypeToken: true,
			responseTypeIdToken: variant === 'oidc', // Only OIDC returns ID token
			grantTypeAuthorizationCode: false,
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
			authRequestOverview: false, // Expanded by default for Step 2
			authRequestDetails: true,
			responseMode: true,
			tokenResponseOverview: true,
			tokenResponseDetails: true,
			tokenResponse: false, // Expanded by default for Step 2
			introspectionOverview: true,
			introspectionDetails: false, // Expanded by default for introspection
			apiCallDisplay: true,
			securityOverview: true,
			securityBestPractices: true,
			flowSummary: false, // Expanded by default for flow summary page
			flowComparison: true,
			completionOverview: true,
			completionDetails: true,
		};
	}
}

/**
 * Token Management Integration
 * Handles navigation to token management page
 */
export class ImplicitFlowTokenManagement {
	/**
	 * Navigate to token management page with flow context
	 */
	static navigateToTokenManagement(
		variant: ImplicitFlowVariant,
		tokens: any,
		credentials: StepCredentials,
		currentStep: number
	): void {
		const flowId = variant === 'oauth' ? 'oauth-implicit-v5' : 'oidc-implicit-v5';
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
		localStorage.setItem('tokenManagementFlowContext', JSON.stringify(flowContext));

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
 * Token Fragment Processing
 * Handles tokens received in URL fragment after OAuth callback
 */
export class ImplicitFlowTokenFragmentProcessor {
	/**
	 * Process tokens from URL fragment
	 */
	static processTokenFragment(
		controller: any,
		setCurrentStep: (step: number) => void,
		setShowSuccessModal: (show: boolean) => void
	): boolean {
		const hash = window.location.hash;
		console.log('[TokenFragmentProcessor] Checking for tokens in hash:', hash);

		if (!hash?.includes('access_token')) {
			console.log('[TokenFragmentProcessor] No access_token found in hash, returning false');
			return false;
		}

		console.log('[TokenFragmentProcessor] Access token found in hash, processing...');

		// Extract and set tokens
		controller.setTokensFromFragment(hash);

		// Navigate to token response step (Step 3: Token Response = index 2)
		console.log('[TokenFragmentProcessor] Setting current step to 2 (Step 3: Token Response)');
		setCurrentStep(2);

		// Show success feedback
		ImplicitFlowToastManager.showTokensReceived();
		setShowSuccessModal(true);

		// Clean up URL
		window.history.replaceState({}, '', window.location.pathname);

		console.log(
			'[TokenFragmentProcessor] Tokens processed from URL fragment, step set to 2 (Token Response)'
		);
		return true;
	}
}

/**
 * Step Restoration
 * Handles restoring step from session storage (e.g., returning from token management)
 */
export class ImplicitFlowStepRestoration {
	/**
	 * Get initial step with restoration from session storage
	 * Priority: Token fragment > Restore step > Default (0)
	 */
	static getInitialStep(): number {
		// Check if we have tokens in the URL fragment first (highest priority)
		const hash = window.location.hash;
		if (hash?.includes('access_token')) {
			console.log(
				'[StepRestoration] Access token found in URL fragment, returning step 2 (Token Response)'
			);
			return 2; // Step 3: Token Response
		}

		// Check for restore step (medium priority)
		const restoreStep = sessionStorage.getItem('restore_step');
		if (restoreStep) {
			const step = parseInt(restoreStep, 10);
			sessionStorage.removeItem('restore_step');
			console.log('[StepRestoration] Restoring to step:', step);
			return step;
		}

		console.log('[StepRestoration] No restore_step found, returning step 0');
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
export class ImplicitFlowCollapsibleSectionsManager {
	/**
	 * Get default collapsed sections state
	 */
	static getDefaultState(): Record<string, boolean> {
		return {
			overview: false,
			flowDiagram: true,
			authRequestOverview: false, // Expanded by default for Step 2
			authRequestDetails: true,
			responseMode: true,
			tokenResponseOverview: false,
			tokenResponseDetails: true,
			tokenResponse: false, // Expanded by default for Step 2
			introspectionOverview: true,
			introspectionDetails: false, // Expanded by default for introspection
			apiCallDisplay: true,
			securityOverview: true,
			securityBestPractices: true,
			flowSummary: false, // Expanded by default for flow summary page
			flowComparison: true,
			completionOverview: true,
			completionDetails: true,
		};
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
			sections.forEach((section) => {
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
			sections.forEach((section) => {
				updated[section] = true;
			});
			return updated;
		});
	}
}

/**
 * Modal State Manager
 * Manages success and redirect modals
 */
export class ImplicitFlowModalManager {
	/**
	 * Create modal handlers
	 */
	static createHandlers(controller: any) {
		const [showSuccessModal, setShowSuccessModal] = useState(false);
		const [showRedirectModal, setShowRedirectModal] = useState(false);

		const handleConfirmRedirect = useCallback(() => {
			setShowRedirectModal(false);
			controller.handleRedirectAuthorization();
		}, [controller]);

		const handleCancelRedirect = useCallback(() => {
			setShowRedirectModal(false);
		}, []);

		return {
			showSuccessModal,
			setShowSuccessModal,
			showRedirectModal,
			setShowRedirectModal,
			handleConfirmRedirect,
			handleCancelRedirect,
		};
	}
}

/**
 * Response Type Enforcement
 * Ensures correct response_type for each flow variant
 */
export class ImplicitFlowResponseTypeEnforcer {
	/**
	 * Get expected response type for variant
	 */
	static getExpectedResponseType(variant: ImplicitFlowVariant): string {
		return variant === 'oauth' ? 'token' : 'id_token token';
	}

	/**
	 * Enforce correct response type
	 */
	static enforceResponseType(
		variant: ImplicitFlowVariant,
		credentials: StepCredentials,
		setCredentials: (creds: StepCredentials) => void
	): void {
		const expectedType = ImplicitFlowResponseTypeEnforcer.getExpectedResponseType(variant);

		if (credentials.responseType !== expectedType) {
			console.log(
				`[ResponseTypeEnforcer] Correcting response_type from '${credentials.responseType}' to '${expectedType}'`
			);
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
export class ImplicitFlowCredentialsSync {
	/**
	 * Sync credentials from controller to local state
	 */
	static syncCredentials(
		variant: ImplicitFlowVariant,
		controllerCredentials: any,
		setCredentials: (creds: StepCredentials) => void
	): void {
		if (controllerCredentials) {
			console.log(
				`[${variant.toUpperCase()} Implicit V5] Syncing credentials from controller:`,
				controllerCredentials
			);
			setCredentials(controllerCredentials);
		}
	}
}

/**
 * V7 Unified Flow Helpers
 * V7-aware helpers keyed by variant for the unified implicit flow
 */
export class ImplicitFlowV7Helpers {
	/**
	 * Get flow-specific metadata for V7
	 */
	static getFlowMetadata(variant: ImplicitFlowVariant) {
		const baseMetadata = {
			version: 'v7',
			type: 'implicit',
		};

		switch (variant) {
			case 'oauth':
				return {
					...baseMetadata,
					name: 'OAuth 2.0 Implicit Flow',
					shortName: 'OAuth Implicit',
					responseType: 'token',
					tokens: ['access_token'],
					scopes: '',
					requiresOpenid: false,
				};
			case 'oidc':
				return {
					...baseMetadata,
					name: 'OIDC Implicit Flow',
					shortName: 'OIDC Implicit',
					responseType: 'id_token token',
					tokens: ['access_token', 'id_token'],
					scopes: 'openid',
					requiresOpenid: true,
				};
		}
	}

	/**
	 * Get educational content keyed by variant
	 */
	static getEducationalContent(variant: ImplicitFlowVariant) {
		switch (variant) {
			case 'oauth':
				return {
					overview:
						'The OAuth 2.0 Implicit Grant is designed for public clients (SPAs, mobile apps) that cannot securely store client secrets.',
					security:
						'Access tokens are returned directly in the URL fragment, making them vulnerable to interception. Always use HTTPS.',
					tokens: 'Only returns an access token. No refresh token is provided.',
				};
			case 'oidc':
				return {
					overview:
						'The OIDC Implicit Flow extends OAuth 2.0 with identity information, providing both access tokens and ID tokens.',
					security:
						'ID tokens contain user identity claims. Access tokens are still vulnerable in URL fragments.',
					tokens:
						'Returns both access token and ID token. The ID token contains verified user identity claims.',
				};
		}
	}

	/**
	 * Get flow diagram steps keyed by variant
	 */
	static getFlowDiagram(variant: ImplicitFlowVariant) {
		const commonSteps = [
			'1. User initiates login',
			'2. Client redirects to authorization server',
			'3. User authenticates and authorizes',
		];

		switch (variant) {
			case 'oauth':
				return [
					...commonSteps,
					'4. Server redirects with access_token in fragment',
					'5. Client extracts token from URL',
				];
			case 'oidc':
				return [
					...commonSteps,
					'4. Server redirects with access_token and id_token in fragment',
					'5. Client extracts tokens and validates ID token',
				];
		}
	}

	/**
	 * Get requirements keyed by variant
	 */
	static getRequirements(variant: ImplicitFlowVariant) {
		const common = [
			'HTTPS redirect URI',
			'Public client (no client secret)',
			'Browser-based application',
		];

		switch (variant) {
			case 'oauth':
				return [...common, 'response_type=token'];
			case 'oidc':
				return [...common, 'response_type=id_token token', 'openid scope required'];
		}
	}

	/**
	 * Get token handling helpers keyed by variant
	 */
	static getTokenHandlers(variant: ImplicitFlowVariant) {
		switch (variant) {
			case 'oauth':
				return {
					expectedTokens: ['access_token'],
					validationChecks: ['token_type', 'expires_in', 'scope'],
					displayFormat: 'Access token only',
				};
			case 'oidc':
				return {
					expectedTokens: ['access_token', 'id_token'],
					validationChecks: ['token_type', 'expires_in', 'scope', 'id_token validation'],
					displayFormat: 'Access token + ID token',
				};
		}
	}

	/**
	 * Get summary content keyed by variant
	 */
	static getSummaryContent(variant: ImplicitFlowVariant) {
		switch (variant) {
			case 'oauth':
				return {
					title: 'OAuth 2.0 Implicit Flow Complete',
					description: 'Successfully obtained an access token for API authorization.',
					nextSteps: [
						'Use access token to call protected APIs',
						'Store token securely (sessionStorage, not localStorage)',
						'Handle token expiration appropriately',
					],
				};
			case 'oidc':
				return {
					title: 'OIDC Implicit Flow Complete',
					description:
						'Successfully obtained access token and ID token for authorization and identity.',
					nextSteps: [
						'Validate ID token signature and claims',
						'Use access token to call protected APIs',
						'Extract user identity from ID token',
						'Store tokens securely',
					],
				};
		}
	}

	/**
	 * Get session helpers for V7
	 */
	static getSessionHelpers(variant: ImplicitFlowVariant) {
		return {
			setActiveFlow: () => SessionStorageManager.setActiveFlow(variant, 'v7'),
			isActiveFlow: () => SessionStorageManager.getActiveFlow('v7') === variant,
			clearFlow: () => SessionStorageManager.clearAllFlowFlags(),
		};
	}
}

/**
 * V9 Helpers - Enhanced version for V9 flows with improved educational content
 */
export class ImplicitFlowV9Helpers {
	/**
	 * Get flow-specific metadata for V9
	 */
	static getFlowMetadata(variant: ImplicitFlowVariant) {
		const baseMetadata = {
			version: 'v9',
			type: 'implicit',
		};

		switch (variant) {
			case 'oauth':
				return {
					...baseMetadata,
					name: 'OAuth 2.0 Implicit Flow (V9)',
					shortName: 'OAuth Implicit V9',
					responseType: 'token',
					tokens: ['access_token'],
					scopes: '',
					requiresOpenid: false,
				};
			case 'oidc':
				return {
					...baseMetadata,
					name: 'OIDC Implicit Flow (V9)',
					shortName: 'OIDC Implicit V9',
					responseType: 'id_token token',
					tokens: ['access_token', 'id_token'],
					scopes: 'openid',
					requiresOpenid: true,
				};
		}
	}

	/**
	 * Get educational content keyed by variant
	 */
	static getEducationalContent(variant: ImplicitFlowVariant) {
		switch (variant) {
			case 'oauth':
				return {
					overview:
						'The OAuth 2.0 Implicit Grant is designed for public clients (SPAs, mobile apps) that cannot securely store client secrets.',
					security:
						'Access tokens are returned directly in the URL fragment, making them vulnerable to interception. Always use HTTPS.',
					tokens: 'Only returns an access token. No refresh token is provided.',
				};
			case 'oidc':
				return {
					overview:
						'The OIDC Implicit Flow extends OAuth 2.0 with identity information, providing both access tokens and ID tokens.',
					security:
						'ID tokens contain user identity claims. Access tokens are still vulnerable in URL fragments.',
					tokens:
						'Returns both access token and ID token. The ID token contains verified user identity claims.',
				};
		}
	}

	/**
	 * Get flow diagram steps keyed by variant
	 */
	static getFlowDiagram(variant: ImplicitFlowVariant) {
		const commonSteps = [
			'1. User initiates login',
			'2. Client redirects to authorization server',
			'3. User authenticates and authorizes',
		];

		switch (variant) {
			case 'oauth':
				return [
					...commonSteps,
					'4. Server redirects with access_token in fragment',
					'5. Client extracts token from URL',
				];
			case 'oidc':
				return [
					...commonSteps,
					'4. Server redirects with access_token and id_token in fragment',
					'5. Client extracts tokens and validates ID token',
				];
		}
	}

	/**
	 * Get requirements keyed by variant
	 */
	static getRequirements(variant: ImplicitFlowVariant) {
		const common = [
			'HTTPS redirect URI',
			'Public client (no client secret)',
			'Browser-based application',
		];

		switch (variant) {
			case 'oauth':
				return [...common, 'response_type=token'];
			case 'oidc':
				return [...common, 'response_type=id_token token', 'openid scope required'];
		}
	}

	/**
	 * Get token handling helpers keyed by variant
	 */
	static getTokenHandlers(variant: ImplicitFlowVariant) {
		switch (variant) {
			case 'oauth':
				return {
					expectedTokens: ['access_token'],
					validationChecks: ['token_type', 'expires_in', 'scope'],
					displayFormat: 'Access token only',
				};
			case 'oidc':
				return {
					expectedTokens: ['access_token', 'id_token'],
					validationChecks: ['token_type', 'expires_in', 'scope', 'id_token validation'],
					displayFormat: 'Access token + ID token',
				};
		}
	}

	/**
	 * Get summary content keyed by variant
	 */
	static getSummaryContent(variant: ImplicitFlowVariant) {
		switch (variant) {
			case 'oauth':
				return {
					title: 'OAuth 2.0 Implicit Flow Complete (V9)',
					description: 'Successfully obtained an access token for API authorization.',
					nextSteps: [
						'Use access token to call protected APIs',
						'Store token securely (sessionStorage, not localStorage)',
						'Handle token expiration appropriately',
					],
				};
			case 'oidc':
				return {
					title: 'OIDC Implicit Flow Complete (V9)',
					description:
						'Successfully obtained access token and ID token for authorization and identity.',
					nextSteps: [
						'Validate ID token signature and claims',
						'Use access token to call protected APIs',
						'Extract user identity from ID token',
						'Store tokens securely',
					],
				};
		}
	}

	/**
	 * Get session helpers for V9
	 */
	static getSessionHelpers(variant: ImplicitFlowVariant) {
		return {
			setActiveFlow: () => SessionStorageManager.setActiveFlow(variant, 'v9'),
			isActiveFlow: () => SessionStorageManager.getActiveFlow('v9') === variant,
			clearFlow: () => SessionStorageManager.clearAllFlowFlags(),
		};
	}
}

/**
 * Main Service Export
 * Single import point for all implicit flow shared functionality
 */
export const ImplicitFlowSharedService = {
	SessionStorage: SessionStorageManager,
	Toast: ImplicitFlowToastManager,
	Validation: ImplicitFlowValidationManager,
	Defaults: ImplicitFlowDefaults,
	TokenManagement: ImplicitFlowTokenManagement,
	CredentialsHandlers: ImplicitFlowCredentialsHandlers,
	Authorization: ImplicitFlowAuthorizationManager,
	Navigation: ImplicitFlowNavigationManager,
	TokenFragmentProcessor: ImplicitFlowTokenFragmentProcessor,
	StepRestoration: ImplicitFlowStepRestoration,
	CollapsibleSections: ImplicitFlowCollapsibleSectionsManager,
	ModalManager: ImplicitFlowModalManager,
	ResponseTypeEnforcer: ImplicitFlowResponseTypeEnforcer,
	CredentialsSync: ImplicitFlowCredentialsSync,
	V7Helpers: ImplicitFlowV7Helpers,
	V9Helpers: ImplicitFlowV9Helpers,
};
