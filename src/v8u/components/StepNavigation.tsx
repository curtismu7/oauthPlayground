/**
 * @file StepNavigation.tsx
 * @description Simple step navigation component
 * @author OAuth Playground Team
 * @version 1.0.0
 * @since 2026-01-25
 */

import React from 'react';
import styled from 'styled-components';
import { FiArrowLeft, FiArrowRight, FiRotateCcw } from 'react-icons/fi';
import { useStepNavigation } from '../hooks/useStepNavigation';

const NavigationContainer = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 1rem;
	border-top: 1px solid #e2e8f0;
	background: #f8fafc;
	margin-top: auto;
	gap: 0.5rem;
`;

const ButtonGroup = styled.div`
	display: flex;
	gap: 0.5rem;
	align-items: center;
`;

const StepIndicator = styled.div`
	font-size: 0.875rem;
	color: #6b7280;
	font-weight: 500;
	text-align: center;
`;

const NavigationButton = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
	padding: 0.5rem 1rem;
	border: 1px solid #d1d5db;
	border-radius: 0.375rem;
	background: #ffffff;
	color: #374151;
	cursor: pointer;
	font-size: 0.875rem;
	font-weight: 500;
	transition: all 0.2s ease;
	min-height: 2.5rem;
	min-width: 4rem;
	
	&:hover:not(:disabled) {
		background: #f9fafb;
		border-color: #9ca3af;
	}
	
	&:disabled {
		background: #f9fafb;
		color: #9ca3af;
		cursor: not-allowed;
		border-color: #e5e7eb;
	}
	
	${({ variant }) => {
		switch (variant) {
			case 'primary':
				return `
					background: #10b981;
					color: white;
					border-color: #10b981;
					
					&:hover:not(:disabled) {
						background: #059669;
						border-color: #059669;
					}
				`;
			case 'danger':
				return `
					background: #ef4444;
					color: white;
					border-color: #ef4444;
					
					&:hover:not(:disabled) {
						background: #dc2626;
						border-color: #dc2626;
					}
				`;
			default:
				return '';
		}
	}}
`;

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
	
	return (
		<NavigationContainer className={className} style={style}>
			{/* Previous Button */}
			{showPrevious && (
				<NavigationButton
					onClick={handlePrevious}
					disabled={!navigation.canGoPrevious}
					title="Go to previous step"
				>
					<FiArrowLeft size={16} />
					{previousLabel}
				</NavigationButton>
			)}
			
			{/* Step Indicator */}
			{showIndicator && (
				<StepIndicator>
					{navigation.stepLabel}
				</StepIndicator>
			)}
			
			{/* Next and Reset Buttons */}
			<ButtonGroup>
				{/* Reset Button */}
				{showReset && (
					<NavigationButton
						onClick={handleReset}
						disabled={false}
						variant="danger"
						title="Reset to first step"
					>
						<FiRotateCcw size={16} />
						{resetLabel}
					</NavigationButton>
				)}
				
				{/* Next Button */}
				{showNext && (
					<NavigationButton
						onClick={handleNext}
						disabled={!navigation.canGoNext || navigation.isLoading}
						variant="primary"
						title="Go to next step"
					>
						{nextLabel}
						<FiArrowRight size={16} />
					</NavigationButton>
				)}
			</ButtonGroup>
		</NavigationContainer>
	);
}

export default StepNavigation;
