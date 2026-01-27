/**
 * @file useStepNavigationV8.ts
 * @module v8/hooks
 * @description Hook for managing step navigation state and logic
 * @version 8.0.0
 * @since 2024-11-16
 *
 * Manages:
 * - Current step tracking
 * - Step completion status
 * - Validation state
 * - Navigation between steps
 *
 * @example
 * const {
 *   currentStep,
 *   completedSteps,
 *   validationErrors,
 *   canGoNext,
 *   goToStep,
 *   goToNext,
 *   goToPrevious,
 *   setValidationErrors,
 *   reset
 * } = useStepNavigationV8(4);
 */

import { useCallback, useState } from 'react';

const MODULE_TAG = '[🪝 STEP-HOOK-V8]';

export interface UseStepNavigationV8Options {
	/** Initial step (default: 0) */
	initialStep?: number;
	/** Callback when step changes */
	onStepChange?: (step: number) => void;
	/** Callback when validation errors change */
	onValidationChange?: (errors: string[]) => void;
}

export interface UseStepNavigationV8Return {
	/** Current active step (0-based) */
	currentStep: number;
	/** Array of completed step indices */
	completedSteps: number[];
	/** Validation errors for current step */
	validationErrors: string[];
	/** Validation warnings for current step */
	validationWarnings: string[];
	/** Whether user can proceed to next step */
	canGoNext: boolean;
	/** Whether user can go to previous step */
	canGoPrevious: boolean;
	/** Go to specific step */
	goToStep: (step: number) => void;
	/** Go to next step */
	goToNext: () => void;
	/** Go to previous step */
	goToPrevious: () => void;
	/** Mark current step as completed */
	markStepComplete: () => void;
	/** Set validation errors for current step */
	setValidationErrors: (errors: string[]) => void;
	/** Set validation warnings for current step */
	setValidationWarnings: (warnings: string[]) => void;
	/** Reset to first step */
	reset: () => void;
	/** Get formatted error message for tooltip */
	getErrorMessage: () => string;
}

/**
 * Hook for managing step navigation
 *
 * @param totalSteps - Total number of steps in the flow
 * @param options - Configuration options
 * @returns Step navigation state and methods
 *
 * @example
 * const nav = useStepNavigationV8(4);
 *
 * // Check if can proceed
 * if (nav.canGoNext) {
 *   nav.goToNext();
 * }
 *
 * // Set validation errors
 * nav.setValidationErrors(['Environment ID is required']);
 */
export const useStepNavigationV8 = (
	totalSteps: number,
	options: UseStepNavigationV8Options = {}
): UseStepNavigationV8Return => {
	const { initialStep = 0, onStepChange, onValidationChange } = options;

	const [currentStep, setCurrentStep] = useState(initialStep);
	const [completedSteps, setCompletedSteps] = useState<number[]>([]);
	const [validationErrors, setValidationErrorsState] = useState<string[]>([]);
	const [validationWarnings, setValidationWarningsState] = useState<string[]>([]);

	// Can go to next step if no validation errors
	const canGoNext = validationErrors.length === 0;

	// Can go to previous step if not on first step
	const canGoPrevious = currentStep > 0;

	// Go to specific step
	const goToStep = useCallback(
		(step: number) => {
			if (step < 0 || step >= totalSteps) {
				console.warn(`${MODULE_TAG} Invalid step`, { step, totalSteps });
				return;
			}

			// Mark current step as completed when leaving it
			if (currentStep < step && !completedSteps.includes(currentStep)) {
				setCompletedSteps((prev) => [...prev, currentStep]);
			}

			setCurrentStep(step);
			setValidationErrorsState([]);
			setValidationWarningsState([]);

			onStepChange?.(step);
		},
		[currentStep, totalSteps, completedSteps, onStepChange]
	);

	// Go to next step
	const goToNext = useCallback(() => {
		if (!canGoNext) {
			console.warn(`${MODULE_TAG} Cannot go to next step - validation errors present`);
			return;
		}

		if (currentStep < totalSteps - 1) {
			goToStep(currentStep + 1);
		}
	}, [currentStep, totalSteps, canGoNext, goToStep]);

	// Go to previous step
	const goToPrevious = useCallback(() => {
		if (canGoPrevious) {
			goToStep(currentStep - 1);
		}
	}, [currentStep, canGoPrevious, goToStep]);

	// Mark current step as completed
	const markStepComplete = useCallback(() => {
		if (!completedSteps.includes(currentStep)) {
			// Removed verbose logging
			setCompletedSteps((prev) => [...prev, currentStep]);
		}
	}, [currentStep, completedSteps]);

	// Set validation errors
	const setValidationErrors = useCallback(
		(errors: string[]) => {
			console.log(`${MODULE_TAG} Setting validation errors`, {
				step: currentStep,
				errorCount: errors.length,
			});

			setValidationErrorsState(errors);
			onValidationChange?.(errors);
		},
		[currentStep, onValidationChange]
	);

	// Set validation warnings
	const setValidationWarnings = useCallback(
		(warnings: string[]) => {
			console.log(`${MODULE_TAG} Setting validation warnings`, {
				step: currentStep,
				warningCount: warnings.length,
			});

			setValidationWarningsState(warnings);
		},
		[currentStep]
	);

	// Reset to first step
	const reset = useCallback(() => {
		console.log(`${MODULE_TAG} Resetting navigation`);

		setCurrentStep(initialStep);
		setCompletedSteps([]);
		setValidationErrorsState([]);
		setValidationWarningsState([]);

		onStepChange?.(initialStep);
	}, [initialStep, onStepChange]);

	// Get formatted error message for tooltip
	const getErrorMessage = useCallback((): string => {
		if (validationErrors.length === 0) {
			return '';
		}

		if (validationErrors.length === 1) {
			return validationErrors[0];
		}

		return `Missing required fields:\n${validationErrors.map((e) => `• ${e}`).join('\n')}`;
	}, [validationErrors]);

	return {
		currentStep,
		completedSteps,
		validationErrors,
		validationWarnings,
		canGoNext,
		canGoPrevious,
		goToStep,
		goToNext,
		goToPrevious,
		markStepComplete,
		setValidationErrors,
		setValidationWarnings,
		reset,
		getErrorMessage,
	};
};

export default useStepNavigationV8;
