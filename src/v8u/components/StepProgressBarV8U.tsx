/**
 * @file StepProgressBarV8U.tsx
 * @module v8u/components
 * @description Visual progress bar showing step completion status
 * @version 8.0.0
 * @since 2024-11-16
 *
 * Displays:
 * - Progress percentage (0-100%)
 * - Current step indicator
 * - Step completion status
 * - Visual progress bar
 *
 * @example
 * <StepProgressBarV8U
 *   currentStep={1}
 *   totalSteps={4}
 *   completedSteps={[0]}
 * />
 */

import React from 'react';
import { StepProgressBarProps } from '@/v8/types/stepNavigation';
import { logger } from '@/v8u/services/unifiedFlowLoggerServiceV8U';

const _MODULE_TAG = '[📊 STEP-PROGRESS-V8]';

/**
 * StepProgressBarV8U Component
 *
 * Shows visual progress through the flow with:
 * - Percentage complete
 * - Current step number
 * - Progress bar visualization
 */
export const StepProgressBarV8U: React.FC<StepProgressBarProps> = ({
	currentStep,
	totalSteps,
	completedSteps,
	className = '',
}) => {
	logger.debug(Rendering progress bar`, {
		currentStep,
		totalSteps,
		completedSteps: completedSteps.length,
	});

	// Calculate progress percentage
	// Current step counts as 1 step in progress
	const stepsCompleted = completedSteps.length;
	const progressPercentage = Math.round(((stepsCompleted + 1) / totalSteps) * 100);

	return (
		<div className={`step-progress-bar-v8 ${className}`}>
			{/* Progress Text */}
			<div className="progress-text">
				<span className="progress-percentage">{progressPercentage}%</span>
				<span className="progress-steps">
					({stepsCompleted + 1} of {totalSteps})
				</span>
			</div>

			{/* Progress Bar Container */}
			<div className="progress-bar-container">
				<div
					className="progress-bar-fill"
					style={{
						width: `${progressPercentage}%`,
						transition: 'width 0.3s ease-in-out',
					}}
					role="progressbar"
					aria-valuenow={progressPercentage}
					aria-valuemin={0}
					aria-valuemax={100}
					aria-label={`Progress: ${progressPercentage}% complete`}
				/>
			</div>
			<div className="step-indicators">
				{Array.from({ length: totalSteps }).map((_, index) => {
					const isCompleted = completedSteps.includes(index);
					const isActive = index === currentStep;
					const isAccessible = index <= currentStep;

					return (
						<div
							key={index}
							className={`step-indicator ${
								isCompleted ? 'completed' : ''
							} ${isActive ? 'active' : ''} ${!isAccessible ? 'locked' : ''}`}
							title={`Step ${index + 1}${
								isCompleted ? ' (completed)' : ''
							}${isActive ? ' (current)' : ''}${!isAccessible ? ' (locked)' : ''}`}
						>
							{isCompleted ? (
								<span className="indicator-icon">✓</span>
							) : isActive ? (
								<span className="indicator-icon">▶</span>
							) : isAccessible ? (
								<span className="indicator-number">{index + 1}</span>
							) : (
								<span className="indicator-icon">🔒</span>
							)}
						</div>
					);
				})}
			</div>

			<style>{`
				.step-progress-bar-v8 
					display: flex;
					flex-direction: column;
					gap: 12px;
					padding: 16px;
					background: #f5f5f5;
					border-radius: 8px;
					margin-bottom: 24px;

				.progress-text 
					display: flex;
					gap: 8px;
					font-size: 14px;
					font-weight: 500;
					color: #333;

				.progress-percentage 
					font-weight: 600;
					color: #2196f3;

				.progress-steps 
					color: #666;

				.progress-bar-container 
					width: 100%;
					height: 8px;
					background: #e0e0e0;
					border-radius: 4px;
					overflow: hidden;

				.progress-bar-fill 
					height: 100%;
					background: linear-gradient(
						90deg,
						#2196f3 0%,
						#1976d2 100%
					);
					border-radius: 4px;

				.step-indicators 
					display: flex;
					justify-content: space-between;
					gap: 8px;

				.step-indicator 
					flex: 1;
					display: flex;
					align-items: center;
					justify-content: center;
					width: 32px;
					height: 32px;
					border-radius: 50%;
					background: #e0e0e0;
					color: #666;
					font-size: 12px;
					font-weight: 600;
					transition: all 0.3s ease;
					cursor: default;

				.step-indicator.completed 
					background: #4caf50;
					color: white;

				.step-indicator.active 
					background: #2196f3;
					color: white;
					box-shadow: 0 2px 8px rgba(33, 150, 243, 0.3);

				.step-indicator.locked 
					background: #f5f5f5;
					color: #999;
					border: 1px solid #ddd;

				.indicator-icon 
					display: inline-block;

				.indicator-number 
					display: inline-block;

				/* Mobile responsive */
				@media (max-width: 600px) 
					.step-progress-bar-v8 
						padding: 12px;
						gap: 8px;

					.progress-text 
						font-size: 12px;

					.step-indicator 
						width: 28px;
						height: 28px;
						font-size: 10px;
			`}</style>
		</div>
	);
};

export default StepProgressBarV8U;
