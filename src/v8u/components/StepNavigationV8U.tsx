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
import { StepNavigationV8Props } from '@/v8/types/stepNavigation';
import StepProgressBarV8U from './StepProgressBarV8U';

const MODULE_TAG = '[🧭 STEP-NAVIGATION-V8U]';

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
	console.log(`${MODULE_TAG} Rendering navigation`, {
		currentStep,
		totalSteps,
		completedSteps: completedSteps.length,
	});

	const currentLabel = stepLabels[currentStep] || `Step ${currentStep + 1}`;

	return (
		<div className={`step-navigation-v8 ${className}`}>
			{/* Progress Bar */}
			<StepProgressBarV8U
				currentStep={currentStep}
				totalSteps={totalSteps}
				completedSteps={completedSteps}
			/>

			{/* Step Indicator */}
			<div className="step-indicator">
				<div className="step-number">
					Step {currentStep + 1} of {totalSteps}
				</div>
				<div className="step-label">{currentLabel}</div>
			</div>

			<style>{`
				.step-navigation-v8 {
					display: flex;
					flex-direction: column;
					gap: 16px;
				}

				.step-indicator {
					display: flex;
					flex-direction: column;
					gap: 4px;
				}

				.step-number {
					font-size: 12px;
					font-weight: 600;
					color: #666;
					text-transform: uppercase;
					letter-spacing: 0.5px;
				}

				.step-label {
					font-size: 18px;
					font-weight: 600;
					color: #333;
				}

				/* Mobile responsive */
				@media (max-width: 600px) {
					.step-number {
						font-size: 11px;
					}

					.step-label {
						font-size: 16px;
					}
				}
			`}</style>
		</div>
	);
};

export default StepNavigationV8U;
