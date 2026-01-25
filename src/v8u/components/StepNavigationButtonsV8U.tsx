/**
 * Step Navigation Buttons Component V8U
 * 
 * Reusable navigation buttons component that uses the StepNavigatorServiceV8U.
 * Ensures consistent navigation behavior and prevents missing buttons.
 * 
 * @version 8U
 * @since 2026-01-25
 * @author OAuth Playground Team
 */

import React, { useEffect } from 'react';
import { useStepNavigator } from '../hooks/useStepNavigatorV8U';
import { stepNavigatorServiceV8U } from '../services/stepNavigatorServiceV8U';

export interface StepNavigationButtonsV8UProps {
	/** Total number of steps */
	totalSteps?: number;
	/** Current step index */
	currentStep?: number;
	/** Callback when step changes */
	onStepChange?: (step: number) => void;
	/** Callback when flow is reset */
	onFlowReset?: () => void;
	/** Custom styling for the navigation container */
	containerStyle?: React.CSSProperties;
	/** Custom styling for buttons */
	buttonStyle?: React.CSSProperties;
	/** Custom styling for the step indicator */
	indicatorStyle?: React.CSSProperties;
	/** Show/hide specific buttons */
	showPrevious?: boolean;
	showNext?: boolean;
	showRestart?: boolean;
	showStepIndicator?: boolean;
	/** Custom labels */
	previousLabel?: string;
	nextLabel?: string;
	restartLabel?: string;
	/** Custom icons */
	previousIcon?: React.ReactNode;
	nextIcon?: React.ReactNode;
	restartIcon?: React.ReactNode;
	/** Additional CSS classes */
	className?: string;
	/** Disable all navigation (for compliance errors, etc.) */
	disabled?: boolean;
}

/**
 * Step Navigation Buttons Component
 */
export const StepNavigationButtonsV8U: React.FC<StepNavigationButtonsV8UProps> = ({
	totalSteps,
	currentStep,
	onStepChange,
	onFlowReset,
	containerStyle,
	buttonStyle,
	indicatorStyle,
	showPrevious = true,
	showNext = true,
	showRestart = true,
	showStepIndicator = true,
	previousLabel = 'Previous',
	nextLabel = 'Next',
	restartLabel = 'Restart Flow',
	previousIcon = '←',
	nextIcon = '→',
	restartIcon = '🔄',
	className = '',
	disabled = false,
}) => {
	// Initialize the service with current state if provided
	useEffect(() => {
		if (totalSteps !== undefined) {
			stepNavigatorServiceV8U.setTotalSteps(totalSteps);
		}
		if (currentStep !== undefined) {
			stepNavigatorServiceV8U.setCurrentStep(currentStep);
		}
	}, [totalSteps, currentStep]);

	const {
		navigateToPrevious,
		navigateToNext,
		resetFlow,
		stepLabel,
		buttonConfig,
	} = useStepNavigator({
		totalSteps: totalSteps || 1,
		initialStep: currentStep || 0,
		onStepChange: onStepChange || ((step: number) => {}),
		onFlowReset: onFlowReset || (() => {}),
	});

	// Override button config with props
	const effectiveButtonConfig = {
		...buttonConfig,
		showPrevious: showPrevious && buttonConfig.showPrevious,
		showNext: showNext && buttonConfig.showNext,
		showRestart: showRestart && buttonConfig.showRestart,
		showStepIndicator: showStepIndicator && buttonConfig.showStepIndicator,
		previousDisabled: disabled || buttonConfig.previousDisabled,
		nextDisabled: disabled || buttonConfig.nextDisabled,
		restartDisabled: disabled || buttonConfig.restartDisabled,
	};

	const defaultContainerStyle: React.CSSProperties = {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: '1rem',
		borderTop: '1px solid #e2e8f0',
		background: '#f8fafc',
		marginTop: 'auto',
		...containerStyle,
	};

	const defaultButtonStyle: React.CSSProperties = {
		padding: '0.5rem 1rem',
		border: '1px solid #d1d5db',
		borderRadius: '0.375rem',
		background: '#ffffff',
		color: '#374151',
		cursor: 'pointer',
		fontSize: '0.875rem',
		fontWeight: '500',
		transition: 'all 0.2s ease',
		...buttonStyle,
	};

	const defaultIndicatorStyle: React.CSSProperties = {
		fontSize: '0.875rem',
		color: '#6b7280',
		fontWeight: '500',
		...indicatorStyle,
	};

	const handlePreviousClick = () => {
		if (!effectiveButtonConfig.previousDisabled) {
			navigateToPrevious();
		}
	};

	const handleNextClick = () => {
		if (!effectiveButtonConfig.nextDisabled) {
			navigateToNext();
		}
	};

	const handleRestartClick = () => {
		if (!effectiveButtonConfig.restartDisabled) {
			resetFlow();
		}
	};

	return (
		<div
			className={`step-navigation-buttons-v8u ${className}`}
			style={defaultContainerStyle}
		>
			{/* Previous Button */}
			{effectiveButtonConfig.showPrevious && (
				<button
					type="button"
					onClick={handlePreviousClick}
					disabled={effectiveButtonConfig.previousDisabled}
					style={{
						...defaultButtonStyle,
						...(effectiveButtonConfig.previousDisabled && {
							background: '#f9fafb',
							color: '#9ca3af',
							cursor: 'not-allowed',
						}),
					}}
					title="Go to previous step"
				>
					<span style={{ marginRight: '0.5rem' }}>{previousIcon}</span>
					{previousLabel}
				</button>
			)}

			{/* Step Indicator */}
			{effectiveButtonConfig.showStepIndicator && (
				<div style={defaultIndicatorStyle}>
					{stepLabel}
				</div>
			)}

			{/* Restart and Next Buttons */}
			<div style={{ display: 'flex', gap: '0.5rem' }}>
				{/* Restart Button */}
				{effectiveButtonConfig.showRestart && (
					<button
						type="button"
						onClick={handleRestartClick}
						disabled={effectiveButtonConfig.restartDisabled}
						style={{
							...defaultButtonStyle,
							borderColor: '#ef4444',
							color: '#ef4444',
							...(effectiveButtonConfig.restartDisabled && {
								background: '#f9fafb',
								color: '#d1d5db',
								cursor: 'not-allowed',
							}),
						}}
						title="Restart flow from beginning"
					>
						<span style={{ marginRight: '0.5rem' }}>{restartIcon}</span>
						{restartLabel}
					</button>
				)}

				{/* Next Button */}
				{effectiveButtonConfig.showNext && (
					<button
						type="button"
						onClick={handleNextClick}
						disabled={effectiveButtonConfig.nextDisabled}
						style={{
							...defaultButtonStyle,
							borderColor: '#10b981',
							color: '#10b981',
							...(effectiveButtonConfig.nextDisabled && {
								background: '#f9fafb',
								color: '#d1d5db',
								cursor: 'not-allowed',
							}),
						}}
						title="Go to next step"
					>
						{nextLabel}
						<span style={{ marginLeft: '0.5rem' }}>{nextIcon}</span>
					</button>
				)}
			</div>
		</div>
	);
};

export default StepNavigationButtonsV8U;
