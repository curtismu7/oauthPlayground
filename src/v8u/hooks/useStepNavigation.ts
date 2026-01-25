/**
 * @file useStepNavigation.ts
 * @description React hook for StepNavigationService
 * @author OAuth Playground Team
 * @version 1.0.0
 * @since 2026-01-25
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { stepNavigationService, StepNavigationConfig, StepNavigationEvent, StepNavigationState } from '../services/StepNavigationService';

export interface UseStepNavigationOptions extends StepNavigationConfig {
	/** Auto-initialize on mount */
	autoInitialize?: boolean;
}

export interface UseStepNavigationReturn extends StepNavigationState {
	/** Navigation methods */
	navigateToStep: (step: number) => Promise<boolean>;
	navigateToNext: () => Promise<boolean>;
	navigateToPrevious: () => Promise<boolean>;
	reset: () => Promise<boolean>;
	
	/** Utility methods */
	canGoNext: boolean;
	canGoPrevious: boolean;
	isFirstStep: boolean;
	isLastStep: boolean;
	progress: number;
	stepLabel: string;
	
	/** Actions */
	clearError: () => void;
	updateTotalSteps: (totalSteps: number) => void;
	
	/** Event handling */
	isLoading: boolean;
}

/**
 * React hook for StepNavigationService
 * 
 * Provides reactive state and navigation methods with automatic cleanup.
 */
export function useStepNavigation(options: UseStepNavigationOptions): UseStepNavigationReturn {
	const { autoInitialize = true, ...config } = options;
	
	// State management
	const [state, setState] = useState<StepNavigationState>(() => stepNavigationService.getState());
	const [isLoading, setIsLoading] = useState(false);
	
	// Ref to track mounted state
	const mountedRef = useRef(true);
	
	// Update state from service
	const updateState = useCallback(() => {
		if (mountedRef.current) {
			setState(stepNavigationService.getState());
		}
	}, []);
	
	// Handle navigation events
	const handleNavigationEvent = useCallback((event: StepNavigationEvent) => {
		if (!mountedRef.current) return;
		
		switch (event.type) {
			case 'navigationStarted':
				setIsLoading(true);
				break;
			case 'navigationEnded':
				setIsLoading(false);
				break;
			case 'stepChanged':
			case 'error':
				updateState();
				break;
		}
	}, [updateState]);
	
	// Initialize service
	const initialize = useCallback(() => {
		stepNavigationService.initialize(config);
		updateState();
	}, [config, updateState]);
	
	// Navigation methods
	const navigateToStep = useCallback(async (step: number) => {
		return await stepNavigationService.navigateToStep(step);
	}, []);
	
	const navigateToNext = useCallback(async () => {
		return await stepNavigationService.navigateToNext();
	}, []);
	
	const navigateToPrevious = useCallback(async () => {
		return await stepNavigationService.navigateToPrevious();
	}, []);
	
	const reset = useCallback(async () => {
		return await stepNavigationService.reset();
	}, []);
	
	// Utility methods
	const clearError = useCallback(() => {
		stepNavigationService.clearError();
		updateState();
	}, [updateState]);
	
	const updateTotalSteps = useCallback((totalSteps: number) => {
		stepNavigationService.updateTotalSteps(totalSteps);
		updateState();
	}, [updateState]);
	
	// Computed values
	const canGoNext = stepNavigationService.canGoNext();
	const canGoPrevious = stepNavigationService.canGoPrevious();
	const isFirstStep = stepNavigationService.isFirstStep();
	const isLastStep = stepNavigationService.isLastStep();
	const progress = stepNavigationService.getProgress();
	const stepLabel = stepNavigationService.getStepLabel();
	
	// Setup effect
	useEffect(() => {
		// Initialize if requested
		if (autoInitialize) {
			initialize();
		}
		
		// Add event listener
		const unsubscribe = stepNavigationService.addListener(handleNavigationEvent);
		
		// Cleanup
		return () => {
			unsubscribe();
			mountedRef.current = false;
		};
	}, [autoInitialize, initialize, handleNavigationEvent]);
	
	return {
		// State
		...state,
		isLoading,
		
		// Navigation methods
		navigateToStep,
		navigateToNext,
		navigateToPrevious,
		reset,
		
		// Utility methods
		canGoNext,
		canGoPrevious,
		isFirstStep,
		isLastStep,
		progress,
		stepLabel,
		clearError,
		updateTotalSteps,
	};
}
