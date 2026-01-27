/**
 * @file UnifiedFlowStateManager.ts
 * @description Centralized state management for Unified flows
 * @author OAuth Playground Team
 * @version 1.0.0
 * @since 2026-01-25
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { FlowType, SpecVersion } from '../../v8/services/specVersionServiceV8';
import type { UnifiedFlowCredentials } from './unifiedFlowIntegrationV8U';

// Flow state interface
export interface FlowState {
	// Token information
	tokens?: {
		accessToken?: string;
		refreshToken?: string;
		idToken?: string;
		tokenType?: string;
		expiresIn?: number;
		scope?: string;
	};

	// PKCE information
	codeVerifier?: string;
	codeChallenge?: string;
	codeChallengeMethod?: string;

	// Device code flow
	deviceCode?: string;
	userCode?: string;
	verificationUri?: string;
	verificationUriComplete?: string;
	expiresIn?: number;
	interval?: number;

	// Authorization URL
	authorizationUrl?: string;

	// Flow metadata
	completedAt?: number;
	lastActivity?: number;

	// Error state
	error?: string;
	warnings?: string[];
}

// Store interface
export interface UnifiedFlowStore {
	// Current flow configuration
	flowType: FlowType;
	specVersion: SpecVersion;
	currentStep: number;
	totalSteps: number;

	// Credentials
	credentials: UnifiedFlowCredentials;

	// Flow state
	flowState: FlowState;

	// UI state
	isLoading: boolean;
	loadingMessage: string;
	completedSteps: number[];

	// Error state
	error?: string | undefined;
	warnings?: string[];

	// Modal states
	modalStates: {
		redirectlessAuth: boolean;
		passwordChange: boolean;
		workerToken: boolean;
		userInfo: boolean;
		pingOneRequest: boolean;
		idTokenValidation: boolean;
		workerTokenVsClientCredentials: boolean;
	};

	// Educational content collapse states
	collapsedSections: Record<string, boolean>;

	// Actions
	setFlowType: (flowType: FlowType) => void;
	setSpecVersion: (specVersion: SpecVersion) => void;
	setCurrentStep: (step: number) => void;
	setCredentials: (credentials: UnifiedFlowCredentials) => void;
	updateFlowState: (updates: Partial<FlowState>) => void;
	resetFlowState: () => void;
	setLoading: (loading: boolean, message?: string) => void;
	markStepCompleted: (step: number) => void;
	setModalState: (modal: keyof UnifiedFlowStore['modalStates'], open: boolean) => void;
	toggleSection: (section: string) => void;
	setError: (error: string | undefined) => void;
	setWarnings: (warnings: string[]) => void;

	// Flow-specific actions
	setTokens: (tokens: FlowState['tokens']) => void;
	setPKCECodes: (codeVerifier: string, codeChallenge: string, method?: string) => void;
	setDeviceCode: (
		deviceCode: string,
		userCode: string,
		verificationUri: string,
		verificationUriComplete: string,
		expiresIn: number,
		interval: number
	) => void;
	setAuthorizationUrl: (url: string) => void;
}

// Helper to calculate total steps based on flow type
const calculateTotalSteps = (flowType: FlowType): number => {
	switch (flowType) {
		case 'oauth-authz':
			return 8; // Config, PKCE, Auth URL, Callback, Tokens, Introspection, UserInfo, Documentation
		case 'hybrid':
			return 8; // Config, PKCE, Auth URL, Fragment/Callback, Tokens, Introspection, UserInfo, Documentation
		case 'implicit':
			return 7; // Config, Auth URL, Fragment, Tokens, Introspection, UserInfo, Documentation
		case 'client-credentials':
			return 6; // Config, Token Request, Tokens, Introspection, UserInfo, Documentation
		case 'device-code':
			return 7; // Config, Device Auth, Poll, Tokens, Introspection, UserInfo, Documentation
		default:
			return 6;
	}
};

// Create the store
export const useUnifiedFlowStore = create<UnifiedFlowStore>()(
	devtools(
		persist(
			(set, get) => ({
				// Initial state
				flowType: 'oauth-authz' as FlowType,
				specVersion: 'oauth20' as SpecVersion,
				currentStep: 0,
				totalSteps: calculateTotalSteps('oauth-authz'),
				credentials: {} as UnifiedFlowCredentials,
				flowState: {},
				isLoading: false,
				loadingMessage: '',
				completedSteps: [],
				modalStates: {
					redirectlessAuth: false,
					passwordChange: false,
					workerToken: false,
					userInfo: false,
					pingOneRequest: false,
					idTokenValidation: false,
					workerTokenVsClientCredentials: false,
				},
				collapsedSections: {},

				// Actions
				setFlowType: (flowType) => {
					const totalSteps = calculateTotalSteps(flowType);
					set({ flowType, totalSteps, currentStep: 0, completedSteps: [] });
					get().resetFlowState();
				},

				setSpecVersion: (specVersion) => set({ specVersion }),

				setCurrentStep: (step) => {
					const { totalSteps } = get();
					if (step >= 0 && step < totalSteps) {
						set({ currentStep: step });
					}
				},

				setCredentials: (credentials) => set({ credentials }),

				updateFlowState: (updates) =>
					set((state) => ({
						flowState: { ...state.flowState, ...updates, lastActivity: Date.now() },
					})),

				resetFlowState: () =>
					set({
						flowState: {},
						error: undefined,
						warnings: [],
						completedSteps: [],
						currentStep: 0,
					} as Partial<UnifiedFlowStore>),

				setLoading: (loading, message = '') => set({ isLoading: loading, loadingMessage: message }),

				markStepCompleted: (step) =>
					set((state) => ({
						completedSteps: state.completedSteps.includes(step)
							? state.completedSteps
							: [...state.completedSteps, step],
					})),

				setModalState: (modal: keyof UnifiedFlowStore['modalStates'], open: boolean) =>
					set((state) => ({
						modalStates: { ...state.modalStates, [modal]: open },
					})),

				toggleSection: (section) =>
					set((state) => ({
						collapsedSections: {
							...state.collapsedSections,
							[section]: !state.collapsedSections[section],
						},
					})),

				setError: (error) => set({ error: error || undefined }),
				setWarnings: (warnings) => set({ warnings }),

				// Flow-specific actions
				setTokens: (tokens) => get().updateFlowState({ tokens }),

				setPKCECodes: (codeVerifier, codeChallenge, method = 'S256') =>
					get().updateFlowState({ codeVerifier, codeChallenge, codeChallengeMethod: method }),

				setDeviceCode: (
					deviceCode,
					userCode,
					verificationUri,
					verificationUriComplete,
					expiresIn,
					interval
				) =>
					get().updateFlowState({
						deviceCode,
						userCode,
						verificationUri,
						verificationUriComplete,
						expiresIn,
						interval,
					}),

				setAuthorizationUrl: (authorizationUrl) => get().updateFlowState({ authorizationUrl }),
			}),
			{
				name: 'unified-flow-store',
				partialize: (state) => ({
					flowType: state.flowType,
					specVersion: state.specVersion,
					currentStep: state.currentStep,
					completedSteps: state.completedSteps,
					collapsedSections: state.collapsedSections,
					// Don't persist sensitive data like tokens or credentials
				}),
			}
		),
		{ name: 'UnifiedFlowStore' }
	)
);

// Selectors for common combinations
export const useFlowConfiguration = () => {
	const store = useUnifiedFlowStore();
	return {
		flowType: store.flowType,
		specVersion: store.specVersion,
		credentials: store.credentials,
		totalSteps: store.totalSteps,
		currentStep: store.currentStep,
		completedSteps: store.completedSteps,
	};
};

export const useFlowState = () => {
	const store = useUnifiedFlowStore();
	return {
		flowState: store.flowState,
		isLoading: store.isLoading,
		loadingMessage: store.loadingMessage,
		error: store.error,
		warnings: store.warnings,
	};
};

export const useModalStates = () => useUnifiedFlowStore((state) => state.modalStates);

export const useEducationalSections = () => useUnifiedFlowStore((state) => state.collapsedSections);

// Flow-specific selectors
export const usePKCEState = () => {
	const { codeVerifier, codeChallenge, codeChallengeMethod } = useUnifiedFlowStore(
		(state) => state.flowState
	);
	return { codeVerifier, codeChallenge, codeChallengeMethod };
};

export const useTokenState = () => {
	const tokens = useUnifiedFlowStore((state) => state.flowState.tokens);
	return tokens;
};

export const useDeviceCodeState = () => {
	const { deviceCode, userCode, verificationUri, verificationUriComplete, expiresIn, interval } =
		useUnifiedFlowStore((state) => state.flowState);
	return { deviceCode, userCode, verificationUri, verificationUriComplete, expiresIn, interval };
};
