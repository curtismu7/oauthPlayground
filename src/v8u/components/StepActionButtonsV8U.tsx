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
import { StepActionButtonsProps } from '@/v8/types/stepNavigation';
import { logger } from '@/v8u/services/unifiedFlowLoggerServiceV8U';

const _MODULE_TAG = '[🔘 STEP-BUTTONS-V8]';

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
	const [_showTooltip, _setShowTooltip] = useState(false);

	const _isLastStep = currentStep === totalSteps - 1;
	const _canGoPrevious = currentStep > 0;

	const _handlePreviousClick = () => {
		logger.debug(Previous button clicked`, { currentStep });
		onPrevious();
	};

	const handleNextClick = () => {
		if (!isNextDisabled) {
			logger.debug(Next button clicked`, { currentStep });
			onNext();
		}
	};

	const _handleFinalClick = () => {
		logger.debug(Final button clicked`, { currentStep });
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
		<div
			className={`step-action-buttons-v8 ${className}`}
			onKeyDown={handleKeyDown}
			role="group"
			aria-label="Step navigation buttons"
		>
			{/* Previous Button */}
			<button
				className={`btn btn-previous ${!canGoPrevious ? 'disabled' : ''}`}
				onClick={handlePreviousClick}
				disabled={!canGoPrevious}
				aria-label="Go to previous step"
				title={canGoPrevious ? 'Go to previous step (Arrow Left)' : 'Cannot go to previous step'}
			>
				<span className="btn-icon">◀</span>
				<span className="btn-text">Previous</span>
			</button>

			{/* Next/Final Button */}
			{isLastStep ? (
				<button
					className="btn btn-final"
					onClick={handleFinalClick}
					aria-label={finalLabel}
					title={finalLabel}
				>
					<span className="btn-text">{finalLabel}</span>
				</button>
			) : (
				<div className="next-button-wrapper">
					<button
						className={`btn btn-next ${isNextDisabled ? 'disabled' : ''}`}
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
						<FiArrowRight size={16} className="btn-icon" style={{ marginLeft: '4px' }} />
					</button>

					{/* Tooltip for disabled state */}
					{isNextDisabled && showTooltip && nextDisabledReason && (
						<div className="tooltip" role="tooltip">
							{nextDisabledReason}
						</div>
					)}
				</div>
			)}

			<style>{`
				.step-action-buttons-v8 {
					display: flex;
					gap: 12px;
					justify-content: space-between;
					align-items: center;
					padding: 16px 0;
					margin-top: 24px;
				}

				.btn {
					display: flex;
					align-items: center;
					gap: 8px;
					padding: 10px 20px;
					border: none;
					border-radius: 6px;
					font-size: 14px;
					font-weight: 500;
					cursor: pointer;
					transition: all 0.2s ease;
					outline: none;
				}

				.btn:focus-visible {
					outline: 2px solid #2196f3;
					outline-offset: 2px;
				}

				/* Previous Button */
				.btn-previous {
					background: #f5f5f5;
					color: #333;
					border: 1px solid #ddd;
				}

				.btn-previous:hover:not(.disabled) {
					background: #e8e8e8;
					border-color: #bbb;
				}

				.btn-previous:active:not(.disabled) {
					transform: translateY(1px);
				}

				.btn-previous.disabled {
					background: #f5f5f5;
					color: #999;
					cursor: not-allowed;
					opacity: 0.5;
				}

				/* Next Button */
				.next-button-wrapper {
					position: relative;
					flex: 1;
					max-width: 200px;
				}

				.btn-next {
					width: 100%;
					background: #10b981;
					color: #ffffff;
					border: none;
					font-weight: 600;
				}

				.btn-next:hover:not(.disabled) {
					background: #059669;
					box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
					transform: translateY(-1px);
				}

				.btn-next:active:not(.disabled) {
					transform: translateY(0);
				}

				.btn-next.disabled {
					background: #9ca3af;
					color: #ffffff;
					cursor: not-allowed;
					opacity: 0.6;
				}

				/* Final Button */
				.btn-final {
					background: #4caf50;
					color: white;
					border: none;
					padding: 12px 20px;
					font-size: 14px;
					font-weight: 600;
					border-radius: 6px;
					cursor: pointer;
					transition: all 0.2s ease;
				}

				.btn-final:hover {
					background: #45a049;
					box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
					transform: translateY(-1px);
				}

				.btn-final:active {
					transform: translateY(0);
				}

				/* Tooltip */
				.tooltip {
					position: absolute;
					bottom: 100%;
					left: 50%;
					transform: translateX(-50%);
					margin-bottom: 8px;
					padding: 8px 12px;
					background: #333;
					color: white;
					font-size: 12px;
					border-radius: 4px;
					white-space: nowrap;
					z-index: 1000;
					pointer-events: none;
					animation: slideUp 0.2s ease;
				}

				.tooltip::after {
					content: '';
					position: absolute;
					top: 100%;
					left: 50%;
					transform: translateX(-50%);
					border: 4px solid transparent;
					border-top-color: #333;
				}

				@keyframes slideUp {
					from 
						opacity: 0;
						transform: translateX(-50%) translateY(4px);
					to 
						opacity: 1;
						transform: translateX(-50%) translateY(0);
				}

				.btn-icon {
					display: inline-block;
					font-size: 12px;
				}

				.btn-text {
					display: inline-block;
				}

				/* Mobile responsive */
				@media (max-width: 600px) {
					.step-action-buttons-v8 
						flex-direction: column;
						gap: 8px;

					.btn 
						width: 100%;
						justify-content: center;
						padding: 12px 16px;

					.next-button-wrapper 
						width: 100%;
						max-width: none;

					.tooltip 
						white-space: normal;
						max-width: 200px;
				}
			`}</style>
		</div>
	);
};

export default StepActionButtonsV8U;
