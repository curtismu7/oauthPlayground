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
export class SessionStorageManager {
	/**
	 * Set session storage flag for the active flow (clears the other)
	 */
	static setActiveFlow(variant: ImplicitFlowVariant): void {
		if (variant === 'oauth') {
			sessionStorage.removeItem('oidc-implicit-v5-flow-active');
			sessionStorage.setItem('oauth-implicit-v5-flow-active', 'true');
			console.log('[SessionStorageManager] OAuth Implicit V5 flow marked as active');
		} else {
			sessionStorage.removeItem('oauth-implicit-v5-flow-active');
			sessionStorage.setItem('oidc-implicit-v5-flow-active', 'true');
			console.log('[SessionStorageManager] OIDC Implicit V5 flow marked as active');
		}
	}

	/**
	 * Clear all implicit flow session storage flags
	 */
	static clearAllFlowFlags(): void {
		sessionStorage.removeItem('oauth-implicit-v5-flow-active');
		sessionStorage.removeItem('oidc-implicit-v5-flow-active');
		console.log('[SessionStorageManager] All implicit flow flags cleared');
	}

	/**
	 * Check which flow is currently active
	 */
	static getActiveFlow(): ImplicitFlowVariant | null {
		const hasOAuth = sessionStorage.getItem('oauth-implicit-v5-flow-active') === 'true';
		const hasOIDC = sessionStorage.getItem('oidc-implicit-v5-flow-active') === 'true';

		if (hasOAuth && !hasOIDC) return 'oauth';
		if (hasOIDC && !hasOAuth) return 'oidc';
		return null;
	}

	/**
	 * Save PingOne app configuration to session storage
	 */
	static savePingOneConfig(variant: ImplicitFlowVariant, config: PingOneApplicationState): void {
		const key =
			variant === 'oauth' ? 'oauth-implicit-v5-app-config' : 'oidc-implicit-v5-app-config';
		sessionStorage.setItem(key, JSON.stringify(config));
		console.log(`[SessionStorageManager] ${variant.toUpperCase()} PingOne config saved`);
	}

	/**
	 * Load PingOne app configuration from session storage
	 */
	static loadPingOneConfig(variant: ImplicitFlowVariant): PingOneApplicationState | null {
		const key =
			variant === 'oauth' ? 'oauth-implicit-v5-app-config' : 'oidc-implicit-v5-app-config';
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
		return {
			redirectUri: 'https://localhost:3000/oauth-implicit-callback',
			scope: '', // OAuth doesn't require openid scope
			scopes: '',
			responseType: 'token',
			clientAuthMethod: 'none',
		};
	}

	/**
	 * Get default credentials for OIDC Implicit
	 */
	static getOIDCDefaults(): Partial<StepCredentials> {
		return {
			redirectUri: 'https://localhost:3000/oidc-implicit-callback',
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
};

export default ImplicitFlowSharedService;
