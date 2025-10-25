import React from 'react';
import { StepNavigationWithCredentials, type StepNavigationWithCredentialsProps } from './StepNavigationWithCredentials';
import type { StepCredentials } from '../components/steps/CommonSteps';

export interface FlowWithCredentialGuardProps {
	children: React.ReactNode;
	credentials: StepCredentials | null | undefined;
	currentStep: number;
	totalSteps: number;
	onStepChange: (step: number) => void;
	validateStep?: (step: number) => boolean;
	requiredFields: string[];
	fieldLabels?: Record<string, string>;
	flowName?: string;
	onStartOver?: () => void;
	className?: string;
}

/**
 * Wrapper component that adds credential validation to any flow
 * Prevents users from advancing to step 1+ without required credentials
 */
export const FlowWithCredentialGuard: React.FC<FlowWithCredentialGuardProps> = ({
	children,
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
	return (
		<>
			{children}
			<StepNavigationWithCredentials
				credentials={credentials}
				currentStep={currentStep}
				totalSteps={totalSteps}
				onStepChange={onStepChange}
				validateStep={validateStep}
				requiredFields={requiredFields}
				fieldLabels={fieldLabels}
				flowName={flowName}
				onStartOver={onStartOver}
				className={className}
			/>
		</>
	);
};
