import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { NavigationState } from '../types';

export const useFlowNavigation = (
	flowType: string,
	currentStep: number,
	totalSteps: number,
	completedSteps: number[],
	onStepChange?: (step: number) => void,
	onCompletedStepsChange?: (steps: number[]) => void
): NavigationState => {
	const navigate = useNavigate();

	const goToPrevious = useCallback(() => {
		if (currentStep > 0) {
			const newStep = currentStep - 1;
			navigate(`/v8u/unified/${flowType}/${newStep}`, { replace: true });
			onStepChange?.(newStep);
		}
	}, [currentStep, flowType, navigate, onStepChange]);

	const goToNext = useCallback(() => {
		if (currentStep < totalSteps - 1) {
			const newStep = currentStep + 1;
			navigate(`/v8u/unified/${flowType}/${newStep}`, { replace: true });
			onStepChange?.(newStep);
		}
	}, [currentStep, totalSteps, flowType, navigate, onStepChange]);

	const navigateToStep = useCallback(
		(step: number) => {
			if (step < 0 || step >= totalSteps) {
				console.warn('Invalid step', { step, totalSteps });
				return;
			}
			navigate(`/v8u/unified/${flowType}/${step}`, { replace: true });
			onStepChange?.(step);
		},
		[flowType, totalSteps, navigate, onStepChange]
	);

	const markStepComplete = useCallback(() => {
		if (!completedSteps.includes(currentStep) && onCompletedStepsChange) {
			onCompletedStepsChange([...completedSteps, currentStep]);
		}
	}, [currentStep, completedSteps, onCompletedStepsChange]);

	const canGoPrevious = currentStep > 0;
	const canGoNext = currentStep < totalSteps - 1;

	return {
		currentStep,
		totalSteps,
		completedSteps,
		canGoPrevious,
		canGoNext,
		goToPrevious,
		goToNext,
		navigateToStep,
		markStepComplete,
	};
};
