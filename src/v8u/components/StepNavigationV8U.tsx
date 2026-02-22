/**
 * @file StepNavigationV8U.tsx
 * @module v8u/components
 * @description Main step navigation component combining all step UI elements
 * @version 8.0.0
 * @since 2024-11-16
 *
 * Combines:
 * - Step progress bar
 * - Step action buttons
 * - Validation feedback
 * - Step indicator
 *
 * @example
 * <StepNavigationV8U
 *   currentStep={0}
 *   totalSteps={4}
 *   stepLabels={['Config', 'Auth URL', 'Callback', 'Tokens']}
 *   completedSteps={[]}
 *   onStepClick={(step) => goToStep(step)}
 * />
 */

import React from 'react';
import styled from 'styled-components';
import { StepNavigationV8Props } from '@/v8/types/stepNavigation';
import { logger } from '@/v8u/services/unifiedFlowLoggerServiceV8U';
import { StepActionButtonsV8U } from './StepActionButtonsV8U';
import { StepProgressBarV8U } from './StepProgressBarV8U';

const _MODULE_TAG = '[🧭 STEP-NAVIGATION-V8U]';

// Styled components
const NavigationContainer = styled.div`
	display: flex;
	flex-direction: column;
	gap: 16px;
	padding: 16px;
	background: #ffffff;
	border-radius: 8px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	margin-bottom: 24px;
`;

const StepInfo = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
	
	.step-title {
		font-size: 18px;
		font-weight: 600;
		color: #333;
		margin: 0;
	}
	
	.step-description {
		font-size: 14px;
		color: #666;
		margin: 0;
	}
`;

/**
 * StepNavigationV8U Component
 *
 * Main navigation component that displays:
 * - Progress bar with step indicators
 * - Current step label and description
 * - Step navigation controls
 */
export const StepNavigationV8U: React.FC<StepNavigationV8Props> = ({
	currentStep,
	totalSteps,
	stepLabels,
	completedSteps,
	className = '',
}) => {
	logger.debug('Rendering navigation', {
		currentStep,
		totalSteps,
		completedSteps: completedSteps.length,
	});

	const currentStepLabel = stepLabels[currentStep] || `Step ${currentStep + 1}`;

	return (
		<NavigationContainer className={`step-navigation-v8 ${className}`}>
			{/* Step Progress Bar */}
			<StepProgressBarV8U
				currentStep={currentStep}
				totalSteps={totalSteps}
				completedSteps={completedSteps}
			/>

			{/* Current Step Information */}
			<StepInfo>
				<h3 className="step-title">{currentStepLabel}</h3>
				<p className="step-description">
					{completedSteps.includes(currentStep)
						? 'This step is completed. You can proceed to the next step.'
						: 'Complete this step to continue with the flow.'}
				</p>
			</StepInfo>

			{/* Step Action Buttons */}
			<StepActionButtonsV8U
				currentStep={currentStep}
				totalSteps={totalSteps}
				isNextDisabled={false}
				nextDisabledReason=""
				onPrevious={() => {
					logger.debug('Previous navigation requested', { currentStep });
				}}
				onNext={() => {
					logger.debug('Next navigation requested', { currentStep });
				}}
			/>
		</NavigationContainer>
	);
};
