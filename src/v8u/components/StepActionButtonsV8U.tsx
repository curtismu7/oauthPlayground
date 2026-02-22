/**
 * @file StepActionButtonsV8U.tsx
 * @module v8u/components
 * @description Previous/Next buttons with validation state
 * @version 8.0.0
 * @since 2024-11-16
 *
 * Features:
 * - Previous button (enabled after step 0)
 * - Next button (disabled until validation passes)
 * - Tooltip showing why next is disabled
 * - Final step button (e.g., "Start New Flow")
 * - Keyboard support (arrow keys)
 *
 * @example
 * <StepActionButtonsV8U
 *   currentStep={0}
 *   totalSteps={4}
 *   isNextDisabled={true}
 *   nextDisabledReason="Missing required fields: Environment ID, Client ID"
 *   onPrevious={() => goToPrevious()}
 *   onNext={() => goToNext()}
 * />
 */

import React, { useState } from 'react';
import { FiArrowRight } from 'react-icons/fi';
import styled from 'styled-components';
import { StepActionButtonsProps } from '@/v8/types/stepNavigation';
import { logger } from '@/v8u/services/unifiedFlowLoggerServiceV8U';

const _MODULE_TAG = '[🔘 STEP-BUTTONS-V8]';

// Styled components
const ButtonContainer = styled.div`
	display: flex;
	gap: 12px;
	align-items: center;
	padding: 16px 0;
`;

const BaseButton = styled.button<{ disabled?: boolean }>`
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 12px 24px;
	border: none;
	border-radius: 6px;
	font-size: 14px;
	font-weight: 500;
	cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};
	transition: all 0.2s ease;
	
	&:disabled {
		opacity: 0.6;
	}
	
	.btn-icon {
		display: flex;
		align-items: center;
	}
	
	.btn-text {
		display: flex;
		align-items: center;
	}
`;

const PreviousButton = styled(BaseButton)`
	background: #6c757d;
	color: white;
	
	&:hover:not(:disabled) {
		background: #5a6268;
	}
`;

const NextButton = styled(BaseButton)`
	background: #007bff;
	color: white;
	
	&:hover:not(:disabled) {
		background: #0056b3;
	}
`;

const FinalButton = styled(BaseButton)`
	background: #28a745;
	color: white;
	
	&:hover:not(:disabled) {
		background: #1e7e34;
	}
`;

const NextButtonWrapper = styled.div`
	position: relative;
	display: flex;
	align-items: center;
`;

const Tooltip = styled.div`
	position: absolute;
	bottom: 100%;
	left: 50%;
	transform: translateX(-50%);
	background: #333;
	color: white;
	padding: 8px 12px;
	border-radius: 4px;
	font-size: 12px;
	white-space: nowrap;
	z-index: 1000;
	margin-bottom: 8px;
	
	&::after {
		content: '';
		position: absolute;
		top: 100%;
		left: 50%;
		transform: translateX(-50%);
		border: 4px solid transparent;
		border-top-color: #333;
	}
`;

/**
 * StepActionButtonsV8U Component
 *
 * Provides navigation buttons with:
 * - Disabled state for next button when validation fails
 * - Tooltip explaining why next is disabled
 * - Previous button to go back
 * - Final button for last step
 */
export const StepActionButtonsV8U: React.FC<StepActionButtonsProps> = ({
	currentStep,
	totalSteps,
	isNextDisabled,
	nextDisabledReason,
	onPrevious,
	onNext,
	onFinal,
	nextLabel = 'Next Step',
	finalLabel = 'Start New Flow',
	className = '',
}) => {
	const [showTooltip, setShowTooltip] = useState(false);

	const isLastStep = currentStep === totalSteps - 1;
	const canGoPrevious = currentStep > 0;

	const handlePreviousClick = () => {
		logger.debug('Previous button clicked', { currentStep });
		onPrevious();
	};

	const handleNextClick = () => {
		if (!isNextDisabled) {
			logger.debug('Next button clicked', { currentStep });
			onNext();
		}
	};

	const handleFinalClick = () => {
		logger.debug('Final button clicked', { currentStep });
		if (onFinal) {
			onFinal();
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'ArrowLeft' && canGoPrevious) {
			e.preventDefault();
			handlePreviousClick();
		} else if (e.key === 'ArrowRight' && !isNextDisabled && !isLastStep) {
			e.preventDefault();
			handleNextClick();
		}
	};

	return (
		<ButtonContainer
			className={`step-action-buttons-v8 ${className}`}
			onKeyDown={handleKeyDown}
			role="group"
			aria-label="Step navigation buttons"
		>
			{/* Previous Button */}
			<PreviousButton
				onClick={handlePreviousClick}
				disabled={!canGoPrevious}
				aria-label="Go to previous step"
				title={canGoPrevious ? 'Go to previous step (Arrow Left)' : 'Cannot go to previous step'}
			>
				<span className="btn-icon">◀</span>
				<span className="btn-text">Previous</span>
			</PreviousButton>

			{/* Next/Final Button */}
			{isLastStep ? (
				<FinalButton onClick={handleFinalClick} aria-label={finalLabel} title={finalLabel}>
					<span className="btn-text">{finalLabel}</span>
				</FinalButton>
			) : (
				<NextButtonWrapper>
					<NextButton
						onClick={handleNextClick}
						disabled={isNextDisabled}
						aria-label={nextLabel}
						aria-disabled={isNextDisabled}
						title={
							isNextDisabled
								? `${nextLabel} (disabled: ${nextDisabledReason || 'validation failed'})`
								: `${nextLabel} (Arrow Right)`
						}
						onMouseEnter={() => isNextDisabled && setShowTooltip(true)}
						onMouseLeave={() => setShowTooltip(false)}
						onFocus={() => isNextDisabled && setShowTooltip(true)}
						onBlur={() => setShowTooltip(false)}
					>
						<span className="btn-text">{nextLabel}</span>
						<FiArrowRight size={16} className="btn-icon" />
					</NextButton>

					{/* Tooltip for disabled state */}
					{isNextDisabled && showTooltip && nextDisabledReason && (
						<Tooltip role="tooltip">{nextDisabledReason}</Tooltip>
					)}
				</NextButtonWrapper>
			)}
		</ButtonContainer>
	);
};
