/**
 * React Hook for Step Navigator Service V8U
 * 
 * Provides a convenient React interface for the StepNavigatorServiceV8U.
 * Ensures consistent navigation behavior across all unified flow components.
 * 
 * @version 8U
 * @since 2026-01-25
 * @author OAuth Playground Team
 */

import { useState, useEffect, useCallback } from 'react';
import { stepNavigatorServiceV8U, StepNavigatorConfig, NavigationButtonConfig } from '../services/stepNavigatorServiceV8U';

export interface UseStepNavigatorOptions {
	totalSteps: number;
	initialStep?: number;
	onStepChange?: (step: number) => void;
	onFlowReset?: () => void;
	disabledSteps?: number[];
	completedSteps?: number[];
}

export interface UseStepNavigatorReturn {
	// Current state
	currentStep: number;
	totalSteps: number;
	completedSteps: number[];
	disabledSteps: number[];
	
	// Navigation methods
	navigateToStep: (step: number) => void;
	navigateToNext: () => void;
	navigateToPrevious: () => void;
	resetFlow: () => void;
	
	// State checks
	canGoNext: boolean;
	canGoPrevious: boolean;
	isStepCompleted: (step: number) => boolean;
	isStepDisabled: (step: number) => boolean;
	
	// UI helpers
	stepLabel: string;
	progressPercentage: number;
	buttonConfig: NavigationButtonConfig;
	
	// Utilities
	markStepCompleted: (step: number) => void;
	markStepDisabled: (step: number, disabled?: boolean) => void;
	validateNavigationState: () => { isValid: boolean; errors: string[] };
}

/**
 * React hook for step navigation
 */
export function useStepNavigator(options: UseStepNavigatorOptions): UseStepNavigatorReturn {
	const {
		totalSteps,
		initialStep = 0,
		onStepChange,
		onFlowReset,
		disabledSteps: initialDisabledSteps = [],
		completedSteps: initialCompletedSteps = [],
	} = options;

	// Local state to sync with service
	const [state, setState] = useState(() => ({
		currentStep: initialStep,
		totalSteps,
		completedSteps: initialCompletedSteps,
		disabledSteps: initialDisabledSteps,
	}));

	// Initialize service
	useEffect(() => {
		const config: StepNavigatorConfig = {
			totalSteps,
			currentStep: initialStep,
			onStepChange: (step) => {
				setState(prev => ({ ...prev, currentStep: step }));
				onStepChange?.(step);
			},
			onFlowReset: () => {
				setState(prev => ({ ...prev, currentStep: 0, completedSteps: [] }));
				onFlowReset?.();
			},
			disabledSteps: initialDisabledSteps,
			completedSteps: initialCompletedSteps,
		};

		stepNavigatorServiceV8U.initialize(config);

		// Subscribe to service changes
		const unsubscribe = stepNavigatorServiceV8U.subscribe(() => {
			const serviceConfig = stepNavigatorServiceV8U.getConfig();
			setState({
				currentStep: serviceConfig.currentStep,
				totalSteps: serviceConfig.totalSteps,
				completedSteps: serviceConfig.completedSteps ?? [],
				disabledSteps: serviceConfig.disabledSteps ?? [],
			});
		});

		return unsubscribe;
	}, [totalSteps, initialStep, onStepChange, onFlowReset, initialDisabledSteps, initialCompletedSteps]);

	// Update total steps when it changes
	useEffect(() => {
		stepNavigatorServiceV8U.setTotalSteps(totalSteps);
	}, [totalSteps]);

	// Navigation methods
	const navigateToStep = useCallback((step: number) => {
		stepNavigatorServiceV8U.navigateToStep(step);
	}, []);

	const navigateToNext = useCallback(() => {
		stepNavigatorServiceV8U.navigateToNext();
	}, []);

	const navigateToPrevious = useCallback(() => {
		stepNavigatorServiceV8U.navigateToPrevious();
	}, []);

	const resetFlow = useCallback(() => {
		stepNavigatorServiceV8U.resetFlow();
	}, []);

	// State checks
	const canGoNext = state.currentStep < state.totalSteps - 1 && 
		!state.disabledSteps.includes(state.currentStep + 1);

	const canGoPrevious = state.currentStep > 0 && 
		!state.disabledSteps.includes(state.currentStep - 1);

	const isStepCompleted = useCallback((step: number) => {
		return stepNavigatorServiceV8U.isStepCompleted(step);
	}, []);

	const isStepDisabled = useCallback((step: number) => {
		return stepNavigatorServiceV8U.isStepDisabled(step);
	}, []);

	// UI helpers
	const stepLabel = `Step ${state.currentStep + 1} of ${state.totalSteps}`;
	const progressPercentage = (state.completedSteps.length / state.totalSteps) * 100;
	const buttonConfig = stepNavigatorServiceV8U.getNavigationButtonConfig();

	// Utilities
	const markStepCompleted = useCallback((step: number) => {
		stepNavigatorServiceV8U.markStepCompleted(step);
	}, []);

	const markStepDisabled = useCallback((step: number, disabled = true) => {
		stepNavigatorServiceV8U.markStepDisabled(step, disabled);
	}, []);

	const validateNavigationState = useCallback(() => {
		return stepNavigatorServiceV8U.validateNavigationState();
	}, []);

	return {
		// Current state
		currentStep: state.currentStep,
		totalSteps: state.totalSteps,
		completedSteps: state.completedSteps,
		disabledSteps: state.disabledSteps,
		
		// Navigation methods
		navigateToStep,
		navigateToNext,
		navigateToPrevious,
		resetFlow,
		
		// State checks
		canGoNext,
		canGoPrevious,
		isStepCompleted,
		isStepDisabled,
		
		// UI helpers
		stepLabel,
		progressPercentage,
		buttonConfig,
		
		// Utilities
		markStepCompleted,
		markStepDisabled,
		validateNavigationState,
	};
}

export default useStepNavigator;
