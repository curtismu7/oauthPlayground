// src/v8/flows/PingOnePARFlowV8/hooks/usePARFlowState.ts
// PAR Flow State Management - Following V7.1 pattern

import { useCallback, useEffect, useState } from 'react';
import { PKCEStorageServiceV8U } from '@/v8u/services/pkceStorageServiceV8U';
import { PAR_FLOW_CONSTANTS } from '../constants/parFlowConstants';
import type {
	FlowCredentials,
	FlowVariant,
	PARFlowState,
	PKCECodes,
	StepCompletionState,
	TokenResponse,
	UserInfo,
} from '../types/parFlowTypes';

const STORAGE_PREFIX = 'par-flow-v8';
const FLOW_KEY = 'par-flow-v8';

const createInitialState = (): PARFlowState => ({
	currentStep: 0,
	flowVariant: PAR_FLOW_CONSTANTS.DEFAULT_FLOW_VARIANT,
	collapsedSections: {},
	parRequestUri: null,
	parExpiresIn: null,
	authCode: null,
});

const createInitialCredentials = (): FlowCredentials => ({
	environmentId: '',
	clientId: '',
	clientSecret: '',
	redirectUri: PAR_FLOW_CONSTANTS.DEFAULT_REDIRECT_URI,
	scope: PAR_FLOW_CONSTANTS.DEFAULT_OIDC_SCOPE,
	responseType: 'code',
	grantType: 'authorization_code',
	issuerUrl: '',
	authorizationEndpoint: '',
	tokenEndpoint: '',
	userInfoEndpoint: '',
	clientAuthMethod: 'client_secret_post',
});

const createInitialPKCE = (): PKCECodes => ({
	codeVerifier: '',
	codeChallenge: '',
	codeChallengeMethod: PAR_FLOW_CONSTANTS.PKCE_CHALLENGE_METHOD,
});

export const usePARFlowState = () => {
	const [flowState, setFlowState] = useState<PARFlowState>(createInitialState);
	const [credentials, setCredentials] = useState<FlowCredentials>(createInitialCredentials);
	const [pkceCodes, setPkceCodes] = useState<PKCECodes>(createInitialPKCE);
	const [tokens, setTokens] = useState<TokenResponse | null>(null);
	const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
	const [stepCompletion, setStepCompletion] = useState<StepCompletionState>({});

	// Load from storage on mount
	useEffect(() => {
		try {
			const stored = sessionStorage.getItem(`${STORAGE_PREFIX}-state`);
			if (stored) {
				const parsed = JSON.parse(stored);
				setFlowState(parsed.flowState || createInitialState());
				setCredentials(parsed.credentials || createInitialCredentials());
				// Try to restore PKCE codes from bulletproof storage first
				const bulletproofPKCE = PKCEStorageServiceV8U.loadPKCECodes(FLOW_KEY);
				setPkceCodes(bulletproofPKCE || parsed.pkceCodes || createInitialPKCE());
				setTokens(parsed.tokens || null);
				setUserInfo(parsed.userInfo || null);
				setStepCompletion(parsed.stepCompletion || {});
			} else {
				// Try to restore PKCE codes from bulletproof storage even if no other state
				const bulletproofPKCE = PKCEStorageServiceV8U.loadPKCECodes(FLOW_KEY);
				if (bulletproofPKCE) {
					setPkceCodes(bulletproofPKCE);
				}
			}
		} catch (error) {
			console.warn('Failed to load PAR flow state:', error);
		}
	}, []);

	// Save to storage on changes
	useEffect(() => {
		try {
			const state = {
				flowState,
				credentials,
				pkceCodes,
				tokens,
				userInfo,
				stepCompletion,
			};
			sessionStorage.setItem(`${STORAGE_PREFIX}-state`, JSON.stringify(state));
			// Also save PKCE codes to bulletproof storage for quadruple redundancy
			if (pkceCodes.codeVerifier && pkceCodes.codeChallenge) {
				PKCEStorageServiceV8U.savePKCECodes(FLOW_KEY, {
					codeVerifier: pkceCodes.codeVerifier,
					codeChallenge: pkceCodes.codeChallenge,
					codeChallengeMethod: pkceCodes.codeChallengeMethod || 'S256',
				});
			}
		} catch (error) {
			console.warn('Failed to save PAR flow state:', error);
		}
	}, [flowState, credentials, pkceCodes, tokens, userInfo, stepCompletion]);

	// Flow state updates
	const updateFlowState = useCallback((updates: Partial<PARFlowState>) => {
		setFlowState((prev) => ({ ...prev, ...updates }));
	}, []);

	const setCurrentStep = useCallback((step: number) => {
		setFlowState((prev) => ({ ...prev, currentStep: step }));
	}, []);

	const setFlowVariant = useCallback((variant: FlowVariant) => {
		setFlowState((prev) => ({ ...prev, flowVariant: variant }));
		// Update scope based on variant
		setCredentials((prev) => ({
			...prev,
			scope:
				variant === 'oidc'
					? PAR_FLOW_CONSTANTS.DEFAULT_OIDC_SCOPE
					: PAR_FLOW_CONSTANTS.DEFAULT_OAUTH_SCOPE,
		}));
	}, []);

	const setPARRequestUri = useCallback((requestUri: string | null, expiresIn: number | null) => {
		setFlowState((prev) => ({
			...prev,
			parRequestUri: requestUri,
			parExpiresIn: expiresIn,
		}));
	}, []);

	const setAuthCode = useCallback((code: string | null) => {
		setFlowState((prev) => ({ ...prev, authCode: code }));
	}, []);

	const toggleSection = useCallback((section: string) => {
		setFlowState((prev) => ({
			...prev,
			collapsedSections: {
				...prev.collapsedSections,
				[section]: !prev.collapsedSections[section],
			},
		}));
	}, []);

	// Credentials updates
	const updateCredentials = useCallback((updates: Partial<FlowCredentials>) => {
		setCredentials((prev) => ({ ...prev, ...updates }));
	}, []);

	// PKCE updates
	const updatePKCE = useCallback((codes: PKCECodes) => {
		setPkceCodes(codes);
	}, []);

	// Token updates
	const updateTokens = useCallback((newTokens: TokenResponse | null) => {
		setTokens(newTokens);
	}, []);

	// User info updates
	const updateUserInfo = useCallback((info: UserInfo | null) => {
		setUserInfo(info);
	}, []);

	// Step completion
	const markStepCompleted = useCallback((step: number) => {
		setStepCompletion((prev) => ({ ...prev, [step]: true }));
	}, []);

	const isStepCompleted = useCallback(
		(step: number) => {
			return stepCompletion[step] === true;
		},
		[stepCompletion]
	);

	// Navigation
	const canGoToStep = useCallback(
		(targetStep: number) => {
			if (targetStep === 0) return true;
			if (targetStep <= flowState.currentStep) return true;
			// Check if previous step is completed
			return isStepCompleted(targetStep - 1);
		},
		[flowState.currentStep, isStepCompleted]
	);

	const goToStep = useCallback(
		(step: number) => {
			if (canGoToStep(step)) {
				setCurrentStep(step);
			}
		},
		[canGoToStep, setCurrentStep]
	);

	// Reset
	const resetFlow = useCallback(() => {
		setFlowState(createInitialState());
		setCredentials(createInitialCredentials());
		setPkceCodes(createInitialPKCE());
		setTokens(null);
		setUserInfo(null);
		setStepCompletion({});
		sessionStorage.removeItem(`${STORAGE_PREFIX}-state`);
		// Clear PKCE codes from bulletproof storage
		PKCEStorageServiceV8U.clearPKCECodes(FLOW_KEY).catch((err) => {
			console.error('Failed to clear PKCE codes from bulletproof storage:', err);
		});
	}, []);

	return {
		// State
		flowState,
		credentials,
		pkceCodes,
		tokens,
		userInfo,
		stepCompletion,

		// Updates
		updateFlowState,
		setCurrentStep,
		setFlowVariant,
		setPARRequestUri,
		setAuthCode,
		toggleSection,
		updateCredentials,
		updatePKCE,
		updateTokens,
		updateUserInfo,
		markStepCompleted,

		// Computed
		isStepCompleted,
		canGoToStep,

		// Actions
		goToStep,
		resetFlow,
	};
};
