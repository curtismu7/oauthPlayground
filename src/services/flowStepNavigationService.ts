// src/services/flowStepNavigationService.ts
import { v4ToastManager } from '../utils/v4ToastMessages';

export interface StepNavigationOptions {
	currentStep: number;
	totalSteps: number;
	isStepValid: (stepIndex: number) => boolean;
}

export class FlowStepNavigationService {
	/**
	 * Creates step navigation handlers for flows
	 */
	static createStepNavigationHandlers(options: StepNavigationOptions) {
		const { currentStep, totalSteps, isStepValid } = options;

		const canNavigateNext = () => isStepValid(currentStep) && currentStep < totalSteps - 1;

		const createHandleNext = () => (setCurrentStep: (step: number) => void) => {
			if (!canNavigateNext()) {
				const stepName = `Step ${currentStep + 1}`;
				console.log('🚫 Navigation blocked:', stepName);
				v4ToastManager.showError(`Complete ${stepName} before proceeding to the next step.`);
				return;
			}
			console.log('✅ Navigation allowed, moving to next step');
			setCurrentStep(currentStep + 1);
		};

		const createHandlePrev = () => (setCurrentStep: (step: number) => void) => {
			if (currentStep > 0) {
				setCurrentStep(currentStep - 1);
			}
		};

		const createHandleNextClick = () => (setCurrentStep: (step: number) => void) => {
			console.log('🔍 Next button clicked');
			if (!canNavigateNext()) {
				v4ToastManager.showError('Complete the action above to continue.');
				return;
			}
			createHandleNext()(setCurrentStep);
		};

		return {
			canNavigateNext,
			handleNext: createHandleNext(),
			handlePrev: createHandlePrev(),
			handleNextClick: createHandleNextClick(),
		};
	}

	/**
	 * Creates step validation helpers
	 */
	static createStepValidationHelpers() {
		const getStepRequirements = (stepIndex: number): string[] => {
			switch (stepIndex) {
				case 0:
					return ['Review the flow overview and setup credentials'];
				case 1:
					return ['Generate PKCE parameters'];
				case 2:
					return ['Generate authorization URL'];
				case 3:
					return ['Receive authorization code'];
				case 4:
					return ['Exchange authorization code for tokens'];
				case 5:
					return ['Validate tokens'];
				case 6:
					return ['Flow completed successfully'];
				default:
					return [];
			}
		};

		const isStepValid = (stepIndex: number, validators: Record<number, () => boolean>): boolean => {
			const validator = validators[stepIndex];
			return validator ? validator() : stepIndex === 0; // Step 0 is always valid
		};

		return {
			getStepRequirements,
			isStepValid: (stepIndex: number, validators: Record<number, () => boolean>) =>
				isStepValid(stepIndex, validators),
		};
	}
}
