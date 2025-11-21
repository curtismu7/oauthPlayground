import { useCallback } from 'react';
import type { StepCredentials } from '../components/steps/CommonSteps';
import { type UseCredentialGuardOptions, useCredentialGuard } from './useCredentialGuard';

export interface UseStepNavigationWithCredentialsOptions extends UseCredentialGuardOptions {
	credentials: StepCredentials | null | undefined;
	currentStep: number;
	totalSteps: number;
	onStepChange: (step: number) => void;
	validateStep?: (step: number) => boolean;
}

export interface UseStepNavigationWithCredentialsReturn {
	canNavigateNext: boolean;
	canNavigatePrevious: boolean;
	handleNext: () => void;
	handlePrevious: () => void;
	handleReset: () => void;
	CredentialGuardModal: React.FC;
}

/**
 * Hook for step navigation with automatic credential validation
 * Prevents users from advancing to step 1+ without required credentials
 */
export const useStepNavigationWithCredentials = (
	options: UseStepNavigationWithCredentialsOptions
): UseStepNavigationWithCredentialsReturn => {
	const {
		credentials,
		currentStep,
		totalSteps,
		onStepChange,
		validateStep,
		...credentialGuardOptions
	} = options;

	const { checkCredentialsAndProceed, CredentialGuardModal } =
		useCredentialGuard(credentialGuardOptions);

	// Check if we can navigate to next step
	const canNavigateNext = useCallback((): boolean => {
		// Always allow staying on step 0
		if (currentStep === 0) {
			return true;
		}

		// For step 1+, check if step is valid
		if (validateStep) {
			return validateStep(currentStep) && currentStep < totalSteps - 1;
		}

		// Default: allow if not last step
		return currentStep < totalSteps - 1;
	}, [currentStep, totalSteps, validateStep]);

	// Check if we can navigate to previous step
	const canNavigatePrevious = useCallback((): boolean => {
		return currentStep > 0;
	}, [currentStep]);

	// Handle next step navigation with credential validation
	const handleNext = useCallback(() => {
		// If trying to go from step 0 to step 1, validate credentials first
		if (currentStep === 0) {
			checkCredentialsAndProceed(credentials, () => {
				if (canNavigateNext()) {
					onStepChange(currentStep + 1);
				}
			});
		} else {
			// For other steps, just check if navigation is allowed
			if (canNavigateNext()) {
				onStepChange(currentStep + 1);
			}
		}
	}, [currentStep, credentials, checkCredentialsAndProceed, canNavigateNext, onStepChange]);

	// Handle previous step navigation
	const handlePrevious = useCallback(() => {
		if (canNavigatePrevious()) {
			onStepChange(currentStep - 1);
		}
	}, [canNavigatePrevious, currentStep, onStepChange]);

	// Handle flow reset
	const handleReset = useCallback(() => {
		onStepChange(0);
	}, [onStepChange]);

	return {
		canNavigateNext: canNavigateNext(),
		canNavigatePrevious: canNavigatePrevious(),
		handleNext,
		handlePrevious,
		handleReset,
		CredentialGuardModal,
	};
};
