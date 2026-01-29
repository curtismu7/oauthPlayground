// src/services/v5StepperService.tsx
// ⭐ V6 SERVICE - V5Stepper Service for step-by-step flow layout
// Used in: OAuthAuthorizationCodeFlowV6 and other V6 flows
// Purpose: Provides V5-style step layout with consistent styling and navigation

import styled from 'styled-components';

export interface StepMetadata {
	id: string;
	title: string;
	subtitle: string;
}

export interface V5StepperConfig {
	theme?: 'blue' | 'green' | 'orange' | 'purple' | 'red';
	showProgress?: boolean;
	enableAutoAdvance?: boolean;
}

export class V5StepperService {
	// Main step container
	static getStepContainer({
		maxWidth = '960px',
		fullWidth = false,
	}: {
		maxWidth?: string;
		fullWidth?: boolean;
	} = {}) {
		return styled.div`
			background: white;
			border-radius: 12px;
			box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
			border: 1px solid #e5e7eb;
			overflow: hidden;
			width: ${fullWidth ? '100%' : 'auto'};
			max-width: ${maxWidth};
			min-width: min(100%, 720px);
		`;
	}

	// Step header with gradient background
	static getStepHeader(theme: string = 'blue') {
		const gradients = {
			blue: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
			green: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
			orange: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
			purple: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
			red: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
		};

		return styled.div`
			background: ${gradients[theme as keyof typeof gradients] || gradients.blue};
			color: white;
			padding: 1.5rem 2rem;
			display: flex;
			align-items: center;
			justify-content: space-between;
			border-bottom: 1px solid #e2e8f0;

			@media (max-width: 768px) {
				padding: 1rem 1.5rem;
				flex-direction: column;
				align-items: flex-start;
				gap: 1rem;
			}
		`;
	}

	// Left side of step header
	static getStepHeaderLeft() {
		return styled.div`
			display: flex;
			flex-direction: column;
			gap: 0.5rem;
		`;
	}

	// Right side of step header
	static getStepHeaderRight() {
		return styled.div`
			display: flex;
			align-items: center;
			gap: 1rem;
		`;
	}

	// Version badge
	static getVersionBadge() {
		return styled.div`
			background: rgba(255, 255, 255, 0.2);
			color: white;
			padding: 0.25rem 0.75rem;
			border-radius: 9999px;
			font-size: 0.75rem;
			font-weight: 600;
			text-transform: uppercase;
			letter-spacing: 0.05em;
		`;
	}

	// Step title
	static getStepHeaderTitle() {
		return styled.h2`
			font-size: 1.5rem;
			font-weight: 700;
			color: white;
			margin: 0;
			line-height: 1.2;

			@media (max-width: 768px) {
				font-size: 1.25rem;
			}
		`;
	}

	// Step subtitle
	static getStepHeaderSubtitle() {
		return styled.p`
			font-size: 0.875rem;
			color: rgba(255, 255, 255, 0.9);
			margin: 0;
			line-height: 1.4;
		`;
	}

	// Step number display
	static getStepNumber() {
		return styled.div`
			background: rgba(255, 255, 255, 0.2);
			color: white;
			width: 2.5rem;
			height: 2.5rem;
			border-radius: 50%;
			display: flex;
			align-items: center;
			justify-content: center;
			font-weight: 700;
			font-size: 1rem;
		`;
	}

	// Step total display
	static getStepTotal() {
		return styled.div`
			color: rgba(255, 255, 255, 0.8);
			font-size: 0.875rem;
			font-weight: 500;
		`;
	}

	// Step content wrapper
	static getStepContent() {
		return styled.div`
			padding: 2rem;
			min-height: 400px;

			@media (max-width: 768px) {
				padding: 1.5rem 1rem;
			}
		`;
	}

	// Step navigation
	static getStepNavigation() {
		return styled.div`
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 1.5rem 2rem;
			background: #f9fafb;
			border-top: 1px solid #e5e7eb;

			@media (max-width: 768px) {
				padding: 1rem 1.5rem;
				flex-direction: column;
				gap: 1rem;
			}
		`;
	}

	// Navigation buttons
	static getNavigationButton(_variant: 'primary' | 'secondary' | 'danger' = 'primary') {
		return styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
			display: inline-flex;
			align-items: center;
			gap: 0.5rem;
			padding: 0.75rem 1.5rem;
			border-radius: 0.5rem;
			font-weight: 600;
			font-size: 0.875rem;
			cursor: pointer;
			transition: all 0.2s;
			border: 1px solid transparent;

			${({ $variant = 'primary' }) => {
				switch ($variant) {
					case 'primary':
						return `
							background-color: #3b82f6;
							color: white;
							border-color: #3b82f6;
							&:hover:not(:disabled) {
								background-color: #2563eb;
								border-color: #2563eb;
							}
						`;
					case 'secondary':
						return `
							background-color: #f3f4f6;
							color: #374151;
							border-color: #d1d5db;
							&:hover:not(:disabled) {
								background-color: #e5e7eb;
								border-color: #9ca3af;
							}
						`;
					case 'danger':
						return `
							background-color: #ef4444;
							color: white;
							border-color: #ef4444;
							&:hover:not(:disabled) {
								background-color: #dc2626;
								border-color: #dc2626;
							}
						`;
					default:
						return '';
				}
			}}

			&:disabled {
				opacity: 0.5;
				cursor: not-allowed;
			}
		`;
	}

	// Step progress indicator
	static getStepProgress() {
		return styled.div`
			display: flex;
			align-items: center;
			gap: 0.5rem;
			margin-top: 1rem;
		`;
	}

	// Progress bar
	static getProgressBar() {
		return styled.div<{ $progress: number }>`
			flex: 1;
			height: 4px;
			background: #e5e7eb;
			border-radius: 2px;
			overflow: hidden;

			&::after {
				content: '';
				display: block;
				height: 100%;
				width: ${(props) => props.$progress}%;
				background: #3b82f6;
				transition: width 0.3s ease;
			}
		`;
	}

	// Progress text
	static getProgressText() {
		return styled.span`
			font-size: 0.75rem;
			color: #6b7280;
			font-weight: 500;
		`;
	}

	// Create a complete step layout component
	static createStepLayout(config: V5StepperConfig = {}) {
		const { theme = 'blue', showProgress = true, enableAutoAdvance = false } = config;

		const StepContainer = V5StepperService.getStepContainer({
			maxWidth: '1100px',
			fullWidth: true,
		});
		const StepHeader = V5StepperService.getStepHeader(theme);
		const StepHeaderLeft = V5StepperService.getStepHeaderLeft();
		const StepHeaderRight = V5StepperService.getStepHeaderRight();
		const VersionBadge = V5StepperService.getVersionBadge();
		const StepHeaderTitle = V5StepperService.getStepHeaderTitle();
		const StepHeaderSubtitle = V5StepperService.getStepHeaderSubtitle();
		const StepNumber = V5StepperService.getStepNumber();
		const StepTotal = V5StepperService.getStepTotal();
		const StepContent = V5StepperService.getStepContent();
		const StepNavigation = V5StepperService.getStepNavigation();
		const NavigationButton = V5StepperService.getNavigationButton();
		const StepProgress = V5StepperService.getStepProgress();
		const ProgressBar = V5StepperService.getProgressBar();
		const ProgressText = V5StepperService.getProgressText();

		return {
			StepContainer,
			StepHeader,
			StepHeaderLeft,
			StepHeaderRight,
			VersionBadge,
			StepHeaderTitle,
			StepHeaderSubtitle,
			StepNumber,
			StepTotal,
			StepContent,
			StepNavigation,
			NavigationButton,
			StepProgress,
			ProgressBar,
			ProgressText,
		};
	}
}

export default V5StepperService;
