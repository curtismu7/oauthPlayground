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
import styled from 'styled-components';
import { StepProgressBarProps } from '@/v8/types/stepNavigation';
import { logger } from '@/v8u/services/unifiedFlowLoggerServiceV8U';

const _MODULE_TAG = '[📊 STEP-PROGRESS-V8]';

// Styled components
const ProgressContainer = styled.div`
	display: flex;
	flex-direction: column;
	gap: 12px;
	padding: 16px;
	background: #f5f5f5;
	border-radius: 8px;
	margin-bottom: 24px;
`;

const ProgressText = styled.div`
	display: flex;
	gap: 8px;
	font-size: 14px;
	font-weight: 500;
	color: #333;

	.progress-percentage {
		font-weight: 600;
		color: #2196f3;
	}

	.progress-steps {
		color: #666;
	}
`;

const ProgressBarContainer = styled.div`
	width: 100%;
	height: 8px;
	background: #e0e0e0;
	border-radius: 4px;
	overflow: hidden;
`;

const ProgressBarFill = styled.div<{ width: number }>`
	height: 100%;
	background: linear-gradient(
		90deg,
		#2196f3 0%,
		#1976d2 100%
	);
	border-radius: 4px;
	width: ${(props) => props.width}%;
	transition: width 0.3s ease-in-out;
`;

const StepIndicators = styled.div`
	display: flex;
	justify-content: space-between;
	gap: 8px;
`;

const StepIndicator = styled.div<{
	completed?: boolean;
	active?: boolean;
	locked?: boolean;
}>`
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 32px;
	height: 32px;
	border-radius: 50%;
	background: ${(props) => {
		if (props.completed) return '#4caf50';
		if (props.active) return '#2196f3';
		if (props.locked) return '#f5f5f5';
		return '#e0e0e0';
	}};
	color: ${(props) => {
		if (props.completed || props.active) return 'white';
		if (props.locked) return '#999';
		return '#666';
	}};
	font-size: 12px;
	font-weight: 600;
	transition: all 0.3s ease;
	cursor: default;
	box-shadow: ${(props) => (props.active ? '0 2px 8px rgba(33, 150, 243, 0.3)' : 'none')};
	border: ${(props) => (props.locked ? '1px solid #ddd' : 'none')};

	.indicator-icon,
	.indicator-number {
		display: inline-block;
	}

	@media (max-width: 600px) {
		width: 28px;
		height: 28px;
		font-size: 10px;
	}
`;

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
	logger.debug('Rendering progress bar', {
		currentStep,
		totalSteps,
		completedSteps: completedSteps.length,
	});

	// Calculate progress percentage
	// Current step counts as 1 step in progress
	const stepsCompleted = completedSteps.length;
	const progressPercentage = Math.round(((stepsCompleted + 1) / totalSteps) * 100);

	return (
		<ProgressContainer className={`step-progress-bar-v8 ${className}`}>
			{/* Progress Text */}
			<ProgressText>
				<span className="progress-percentage">{progressPercentage}%</span>
				<span className="progress-steps">
					({stepsCompleted + 1} of {totalSteps})
				</span>
			</ProgressText>

			{/* Progress Bar Container */}
			<ProgressBarContainer>
				<ProgressBarFill
					width={progressPercentage}
					role="progressbar"
					aria-valuenow={progressPercentage}
					aria-valuemin={0}
					aria-valuemax={100}
					aria-label={`Progress: ${progressPercentage}% complete`}
				/>
			</ProgressBarContainer>

			{/* Step Indicators */}
			<StepIndicators>
				{Array.from({ length: totalSteps }).map((_, index) => {
					const isCompleted = completedSteps.includes(index);
					const isActive = index === currentStep;
					const isAccessible = index <= currentStep;

					return (
						<StepIndicator
							key={index}
							completed={isCompleted}
							active={isActive}
							locked={!isAccessible}
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
						</StepIndicator>
					);
				})}
			</StepIndicators>
		</ProgressContainer>
	);
};
