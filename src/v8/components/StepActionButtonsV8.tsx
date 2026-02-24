/**
 * @file StepActionButtonsV8.tsx
 * @module v8/components
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
 * <StepActionButtonsV8
 *   currentStep={0}
 *   totalSteps={4}
 *   isNextDisabled={true}
 *   nextDisabledReason="Missing required fields: Environment ID, Client ID"
 *   onPrevious={() => goToPrevious()}
 *   onNext={() => goToNext()}
 * />
 */

import React, { useState } from 'react';
import BootstrapButton from '@/components/bootstrap/BootstrapButton';
import { StepActionButtonsProps } from '@/v8/types/stepNavigation';
import 'bootstrap/dist/css/bootstrap.min.css';
// import 'styles/bootstrap/pingone-bootstrap.css'; // Temporarily disabled for build

const MODULE_TAG = '[🔘 STEP-BUTTONS-V8]';

/**
 * StepActionButtonsV8 Component
 *
 * Provides navigation buttons with:
 * - Disabled state for next button when validation fails
 * - Tooltip explaining why next is disabled
 * - Previous button to go back
 * - Final button for last step
 */
export const StepActionButtonsV8: React.FC<
	StepActionButtonsProps & { children?: React.ReactNode }
> = ({
	currentStep,
	totalSteps,
	isNextDisabled,
	nextDisabledReason,
	hideNextButton = false,
	hidePreviousButton = false,
	onPrevious,
	onNext,
	onFinal,
	nextLabel = 'Next Step',
	finalLabel = 'Start New Flow',
	className = '',
	children,
}) => {
	const [showTooltip, setShowTooltip] = useState(false);

	const isLastStep = currentStep === totalSteps - 1;
	const canGoPrevious = currentStep > 0;

	const handlePreviousClick = () => {
		console.log(`${MODULE_TAG} Previous button clicked`, { currentStep });
		onPrevious();
	};

	const handleNextClick = () => {
		if (!isNextDisabled) {
			console.log(`${MODULE_TAG} Next button clicked`, { currentStep });
			onNext();
		}
	};

	const handleFinalClick = () => {
		console.log(`${MODULE_TAG} Final button clicked`, { currentStep });
		if (onFinal) {
			onFinal();
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'ArrowLeft' && canGoPrevious && !hidePreviousButton) {
			e.preventDefault();
			handlePreviousClick();
		} else if (e.key === 'ArrowRight' && !isNextDisabled && !isLastStep) {
			e.preventDefault();
			handleNextClick();
		}
	};

	return (
		<div
			className={`step-action-buttons-v8 d-flex justify-content-end align-items-center gap-3 p-2 mt-3 ${className}`}
			onKeyDown={handleKeyDown}
			role="group"
			aria-label="Step navigation buttons"
		>
			{/* Previous Button */}
			{!hidePreviousButton && (
				<BootstrapButton
					variant="secondary"
					onClick={handlePreviousClick}
					disabled={!canGoPrevious}
					aria-label="Go to previous step"
					title={canGoPrevious ? 'Go to previous step (Arrow Left)' : 'Cannot go to previous step'}
					className="me-auto"
				>
					<span>◀</span>
					<span>Previous</span>
				</BootstrapButton>
			)}

			{children}

			{/* Next/Final Button */}
			{hideNextButton ? null : isLastStep ? (
				<BootstrapButton
					variant="success"
					onClick={handleFinalClick}
					aria-label={finalLabel}
					title={finalLabel}
					whiteBorder={true}
				>
					<span>{finalLabel}</span>
				</BootstrapButton>
			) : (
				<div className="next-button-wrapper position-relative">
					<BootstrapButton
						variant="success"
						onClick={handleNextClick}
						disabled={isNextDisabled}
						aria-label={nextLabel}
						aria-disabled={isNextDisabled}
						title={
							isNextDisabled
								? `${nextLabel} (disabled: ${nextDisabledReason || 'validation failed'})`
								: `${nextLabel} (Arrow Right)`
						}
						whiteBorder={true}
						onMouseEnter={() => isNextDisabled && setShowTooltip(true)}
						onMouseLeave={() => setShowTooltip(false)}
						onFocus={() => isNextDisabled && setShowTooltip(true)}
						onBlur={() => setShowTooltip(false)}
					>
						<span>{nextLabel}</span>
						<span>▶</span>
					</BootstrapButton>

					{/* Tooltip for disabled state */}
					{isNextDisabled && showTooltip && nextDisabledReason && (
						<div className="tooltip" role="tooltip">
							{nextDisabledReason}
						</div>
					)}
				</div>
			)}

			{/* Bootstrap tooltip styles */}
			<style>{`
				.next-button-wrapper .tooltip {
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

				.next-button-wrapper .tooltip::after {
					content: '';
					position: absolute;
					top: 100%;
					left: 50%;
					transform: translateX(-50%);
					border: 4px solid transparent;
					border-top-color: #333;
				}

				@keyframes slideUp {
					from {
						opacity: 0;
						transform: translateX(-50%) translateY(4px);
					}
					to {
						opacity: 1;
						transform: translateX(-50%) translateY(0);
					}
				}

				/* Mobile responsive */
				@media (max-width: 600px) {
					.step-action-buttons-v8 {
						flex-direction: column;
						gap: 8px;
					}

					.btn {
						width: 100%;
						justify-content: center;
						padding: 12px 16px;
					}

					.next-button-wrapper {
						width: 100%;
						max-width: none;
					}

					.tooltip {
						white-space: normal;
						max-width: 200px;
					}
				}
			`}</style>
		</div>
	);
};

export default StepActionButtonsV8;
