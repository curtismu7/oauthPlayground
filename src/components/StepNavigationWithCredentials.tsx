import React from 'react';
import { useStepNavigationWithCredentials, type UseStepNavigationWithCredentialsOptions } from '../hooks/useStepNavigationWithCredentials';
import { StepNavigationButtons } from './StepNavigationButtons';
import type { StepCredentials } from '../components/steps/CommonSteps';

export interface StepNavigationWithCredentialsProps extends Omit<UseStepNavigationWithCredentialsOptions, 'credentials'> {
	credentials: StepCredentials | null | undefined;
	onStartOver?: () => void;
	className?: string;
}

/**
 * Step navigation component with automatic credential validation
 * Prevents users from advancing to step 1+ without required credentials
 */
export const StepNavigationWithCredentials: React.FC<StepNavigationWithCredentialsProps> = ({
	credentials,
	currentStep,
	totalSteps,
	onStepChange,
	validateStep,
	requiredFields,
	fieldLabels,
	flowName,
	onStartOver,
	className,
}) => {
	const {
		canNavigateNext,
		canNavigatePrevious,
		handleNext,
		handlePrevious,
		handleReset,
		CredentialGuardModal,
	} = useStepNavigationWithCredentials({
		credentials,
		currentStep,
		totalSteps,
		onStepChange,
		validateStep,
		requiredFields,
		fieldLabels,
		flowName,
	});

	return (
		<>
			<StepNavigationButtons
				currentStep={currentStep}
				totalSteps={totalSteps}
				onPrevious={handlePrevious}
				onNext={handleNext}
				onReset={handleReset}
				onStartOver={onStartOver}
				canNavigateNext={canNavigateNext}
				isFirstStep={currentStep === 0}
				className={className}
			/>
			<CredentialGuardModal />
		</>
	);
};
