// src/utils/flowStepSystem.ts - Reusable step management system for OAuth flows

import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export interface FlowStepConfig {
	flowType: string;
	persistKey: string;
	defaultStep?: number;
	enableAutoAdvance?: boolean;
}

export interface StepTransition {
	fromStep: number;
	toStep: number;
	condition: () => boolean;
	autoAdvance?: boolean;
}

/**
 * Reusable step management hook for OAuth flows
 * Handles URL parameters, session storage, and step transitions
 */
export const useFlowStepManager = (config: FlowStepConfig) => {
	const location = useLocation();
	const [currentStepIndex, setCurrentStepIndex] = useState(config.defaultStep || 0);
	const [stepMessages, setStepMessages] = useState<{ [key: string]: string }>({});
	const [isInitialized, setIsInitialized] = useState(false);

	// Update step message
	const updateStepMessage = useCallback((stepId: string, message: string) => {
		setStepMessages((prev) => ({ ...prev, [stepId]: message }));
	}, []);

	// Clear step message
	const clearStepMessage = useCallback((stepId: string) => {
		setStepMessages((prev) => {
			const newMessages = { ...prev };
			delete newMessages[stepId];
			return newMessages;
		});
	}, []);

	// Set step with persistence
	const setStep = useCallback(
		(stepIndex: number, reason?: string) => {
			console.log(
				` [${config.flowType}] Setting step to ${stepIndex}${reason ? ` - ${reason}` : ''}`
			);
			setCurrentStepIndex(stepIndex);
			sessionStorage.setItem(`${config.persistKey}-step`, stepIndex.toString());
		},
		[config.flowType, config.persistKey]
	);

	// Reset flow to beginning
	const resetFlow = useCallback(() => {
		console.log(` [${config.flowType}] Resetting flow to step 0`);
		setCurrentStepIndex(0);
		setStepMessages({});
		sessionStorage.removeItem(`${config.persistKey}-step`);
	}, [config.flowType, config.persistKey]);

	// Handle URL parameters and initialize step
	useEffect(() => {
		if (isInitialized) return;

		const urlParams = new URLSearchParams(location.search);
		const urlStep = urlParams.get('step');
		const urlCode = urlParams.get('code');
		const storedStep = sessionStorage.getItem(`${config.persistKey}-step`);

		console.log(` [${config.flowType}] Initializing step manager:`, {
			urlStep,
			hasCode: !!urlCode,
			storedStep,
			currentStep: currentStepIndex,
		});

		// Priority 1: URL step parameter (highest priority)
		if (urlStep) {
			const stepIndex = parseInt(urlStep, 10);
			if (!Number.isNaN(stepIndex)) {
				setStep(stepIndex, 'from URL parameter');
				setIsInitialized(true);
				return;
			}
		}

		// Priority 2: Authorization code in URL (flow-specific logic)
		if (urlCode) {
			// For authorization flows, code means we should be on token exchange step
			const tokenExchangeStep = getTokenExchangeStep(config.flowType);
			setStep(tokenExchangeStep, 'authorization code detected');
			setIsInitialized(true);
			return;
		}

		// Priority 3: Check if this is a fresh navigation (no URL params, no code)
		// If so, always start from step 0 to ensure flows reset when accessed from menu
		const isFreshNavigation = !urlStep && !urlCode && location.pathname.includes('/flows/');
		
		if (isFreshNavigation) {
			console.log(` [${config.flowType}] Fresh navigation detected - starting from step 0`);
			setStep(0, 'fresh navigation from menu');
			setIsInitialized(true);
			return;
		}

		// Priority 4: Stored step from session (only for non-fresh navigations)
		if (storedStep) {
			const stepIndex = parseInt(storedStep, 10);
			if (!Number.isNaN(stepIndex)) {
				setStep(stepIndex, 'from session storage');
				setIsInitialized(true);
				return;
			}
		}

		// Default: Start from beginning
		setStep(config.defaultStep || 0, 'default initialization');
		setIsInitialized(true);
	}, [location.search, isInitialized, config, setStep, currentStepIndex]);

	return {
		currentStepIndex,
		stepMessages,
		setStep,
		updateStepMessage,
		clearStepMessage,
		resetFlow,
		isInitialized,
	};
};

/**
 * Get the token exchange step number for different flow types
 */
const getTokenExchangeStep = (flowType: string): number => {
	switch (flowType) {
		case 'authorization-code':
		case 'enhanced-authorization-code-v2':
			return 5; // Exchange Code for Tokens (7-step flow)
		case 'oidc-authorization-code':
			return 5; // Exchange Code for Tokens (6-step flow: Creds, PKCE, AuthURL, UserAuth, Callback, TokenExchange)
		case 'client-credentials':
			return 1; // Get Client Credentials Token (2-step flow)
		case 'device-code':
			return 3; // Exchange Device Code for Tokens
		case 'implicit':
			return 2; // Parse Token from Fragment
		case 'hybrid':
			return 4; // Process Hybrid Response
		default:
			return 2; // Default token step
	}
};

/**
 * Common step transition rules for OAuth flows
 */
export const createStepTransitions = (flowType: string): StepTransition[] => {
	const transitions: StepTransition[] = [];

	// Common transition: If we have auth code, go to token exchange
	transitions.push({
		fromStep: -1, // Any step
		toStep: getTokenExchangeStep(flowType),
		condition: () => {
			const urlParams = new URLSearchParams(window.location.search);
			return !!urlParams.get('code');
		},
		autoAdvance: true,
	});

	return transitions;
};

/**
 * Apply step transitions based on current conditions
 */
export const applyStepTransitions = (
	currentStep: number,
	transitions: StepTransition[],
	setStep: (step: number, reason?: string) => void
) => {
	for (const transition of transitions) {
		if (
			(transition.fromStep === -1 || transition.fromStep === currentStep) &&
			transition.condition()
		) {
			if (transition.autoAdvance) {
				setStep(transition.toStep, `auto-transition from step ${currentStep}`);
				return true;
			}
		}
	}
	return false;
};
