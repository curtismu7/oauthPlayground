/**
 * @file useStepNavigation.ts
 * @description Simple React hook for step navigation
 * @author OAuth Playground Team
 * @version 1.0.0
 * @since 2026-01-25
 */

import { useCallback, useState } from 'react';

export interface UseStepNavigationProps {
	totalSteps: number;
	currentStep?: number;
	onStepChange?: (step: number) => void;
}

export interface UseStepNavigationReturn {
	currentStep: number;
	totalSteps: number;
	navigateToStep: (step: number) => void;
	navigateToNext: () => void;
	navigateToPrevious: () => void;
	reset: () => void;
	canGoNext: boolean;
	canGoPrevious: boolean;
	isFirstStep: boolean;
	isLastStep: boolean;
	stepLabel: string;
}

/**
 * Simple React hook for step navigation
 */
export function useStepNavigation({
	totalSteps,
	currentStep = 0,
	onStepChange,
}: UseStepNavigationProps): UseStepNavigationReturn {
	const [step, setStep] = useState(currentStep);

	const navigateToStep = useCallback(
		(targetStep: number) => {
			if (targetStep >= 0 && targetStep < totalSteps) {
				setStep(targetStep);
				onStepChange?.(targetStep);
			}
		},
		[totalSteps, onStepChange]
	);

	const navigateToNext = useCallback(() => {
		if (step < totalSteps - 1) {
			navigateToStep(step + 1);
		}
	}, [step, totalSteps, navigateToStep]);

	const navigateToPrevious = useCallback(() => {
		if (step > 0) {
			navigateToStep(step - 1);
		}
	}, [step, navigateToStep]);

	const reset = useCallback(() => {
		navigateToStep(0);
	}, [navigateToStep]);

	const canGoNext = step < totalSteps - 1;
	const canGoPrevious = step > 0;
	const isFirstStep = step === 0;
	const isLastStep = step === totalSteps - 1;
	const stepLabel = `Step ${step + 1} of ${totalSteps}`;

	return {
		currentStep: step,
		totalSteps,
		navigateToStep,
		navigateToNext,
		navigateToPrevious,
		reset,
		canGoNext,
		canGoPrevious,
		isFirstStep,
		isLastStep,
		stepLabel,
	};
}
