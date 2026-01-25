/**
 * @file StepNavigation.tsx
 * @description Simple step navigation component
 * @author OAuth Playground Team
 * @version 1.0.0
 * @since 2026-01-25
 */

import React from 'react';
import { FiArrowLeft, FiArrowRight, FiRotateCcw } from 'react-icons/fi';
import { useStepNavigation } from '../hooks/useStepNavigation';

export interface StepNavigationProps {
	/** Total number of steps */
	totalSteps: number;
	/** Current step (0-based) */
	currentStep?: number;
	/** Callback when step changes */
	onStepChange?: (step: number) => void;
	/** Show/hide specific buttons */
	showPrevious?: boolean;
	showNext?: boolean;
	showReset?: boolean;
	showIndicator?: boolean;
	/** Custom labels */
	previousLabel?: string;
	nextLabel?: string;
	resetLabel?: string;
	/** Custom styling */
	className?: string;
	style?: React.CSSProperties;
}

/**
 * Clean, professional step navigation component
 */
export function StepNavigation({
	totalSteps,
	currentStep,
	onStepChange,
	showPrevious = true,
	showNext = true,
	showReset = true,
	showIndicator = true,
	previousLabel = 'Previous',
	nextLabel = 'Next',
	resetLabel = 'Reset',
	className = '',
	style,
}: StepNavigationProps) {
	const navigation = useStepNavigation({
		totalSteps,
		currentStep: currentStep ?? 0,
		onStepChange: onStepChange || (() => {}),
	});

	const handlePrevious = () => {
		navigation.navigateToPrevious();
	};

	const handleNext = () => {
		navigation.navigateToNext();
	};

	const handleReset = () => {
		navigation.reset();
	};

	const navigationContainerStyle: React.CSSProperties = {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: '1rem',
		borderTop: '1px solid #e2e8f0',
		background: '#f8fafc',
		marginTop: 'auto',
		gap: '0.5rem',
		...style,
	};

	const buttonGroupStyle: React.CSSProperties = {
		display: 'flex',
		gap: '0.5rem',
		alignItems: 'center',
	};

	const stepIndicatorStyle: React.CSSProperties = {
		fontSize: '0.875rem',
		color: '#6b7280',
		fontWeight: '500',
		textAlign: 'center',
	};

	const buttonStyle: React.CSSProperties = {
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		gap: '0.5rem',
		padding: '0.5rem 1rem',
		border: '1px solid #d1d5db',
		borderRadius: '0.375rem',
		background: '#ffffff',
		color: '#374151',
		cursor: 'pointer',
		fontSize: '0.875rem',
		fontWeight: '500',
		transition: 'all 0.2s ease',
		minHeight: '2.5rem',
		minWidth: '4rem',
	};

	const primaryButtonStyle: React.CSSProperties = {
		...buttonStyle,
		background: '#10b981',
		color: 'white',
		borderColor: '#10b981',
	};

	const dangerButtonStyle: React.CSSProperties = {
		...buttonStyle,
		background: '#ef4444',
		color: 'white',
		borderColor: '#ef4444',
	};

	const disabledButtonStyle: React.CSSProperties = {
		...buttonStyle,
		background: '#f9fafb',
		color: '#9ca3af',
		cursor: 'not-allowed',
		borderColor: '#e5e7eb',
	};

	return (
		<div className={className} style={navigationContainerStyle}>
			{/* Previous Button */}
			{showPrevious && (
				<button
					onClick={handlePrevious}
					disabled={!navigation.canGoPrevious}
					title="Go to previous step"
					style={!navigation.canGoPrevious ? disabledButtonStyle : buttonStyle}
				>
					<FiArrowLeft size={16} />
					{previousLabel}
				</button>
			)}

			{/* Step Indicator */}
			{showIndicator && (
				<div style={stepIndicatorStyle}>
					{navigation.stepLabel}
				</div>
			)}

			{/* Next and Reset Buttons */}
			<div style={buttonGroupStyle}>
				{/* Reset Button */}
				{showReset && (
					<button
						onClick={handleReset}
						title="Reset to first step"
						style={dangerButtonStyle}
					>
						<FiRotateCcw size={16} />
						{resetLabel}
					</button>
				)}

				{/* Next Button */}
				{showNext && (
					<button
						onClick={handleNext}
						disabled={!navigation.canGoNext}
						title="Go to next step"
						style={!navigation.canGoNext ? disabledButtonStyle : primaryButtonStyle}
					>
						{nextLabel}
						<FiArrowRight size={16} />
					</button>
				)}
			</div>
		</div>
	);
}

export default StepNavigation;
