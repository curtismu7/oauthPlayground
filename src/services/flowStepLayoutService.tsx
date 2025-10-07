// src/services/flowStepLayoutService.tsx
// ⭐ V6 SERVICE - Service for standardized step-by-step flow layout patterns
// Used in: OAuthAuthorizationCodeFlowV6 (and can be used by other flows)
// Purpose: Provides consistent step headers, containers, and navigation

import React from 'react';
import styled from 'styled-components';

export interface FlowStepLayoutConfig {
	flowType: 'oauth' | 'oidc' | 'pingone';
	showStepper?: boolean;
	enableAutoAdvance?: boolean;
	theme?: 'blue' | 'green' | 'orange' | 'purple' | 'red';
}

export class FlowStepLayoutService {
	// Step container - wraps entire step content
	static getStepContainer() {
		return styled.div`
			padding: 2rem;
			
			@media (max-width: 768px) {
				padding: 1.5rem 1rem;
			}
		`;
	}

	// Step header - displays step title and metadata
	static getStepHeader(theme: string = 'blue') {
		const gradients = {
			blue: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
			green: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
			orange: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
			purple: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
			red: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
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

	// Step header left section
	static getStepHeaderLeft() {
		return styled.div`
			display: flex;
			flex-direction: column;
			gap: 0.5rem;
		`;
	}

	// Version badge
	static getVersionBadge() {
		return styled.div`
			display: inline-flex;
			align-items: center;
			background: rgba(255, 255, 255, 0.2);
			backdrop-filter: blur(10px);
			padding: 0.375rem 0.75rem;
			border-radius: 50px;
			font-size: 0.75rem;
			font-weight: 600;
			text-transform: uppercase;
			letter-spacing: 0.5px;
			border: 1px solid rgba(255, 255, 255, 0.3);
			width: fit-content;
		`;
	}

	// Step header title
	static getStepHeaderTitle() {
		return styled.h2`
			font-size: 1.5rem;
			font-weight: 700;
			margin: 0;
			line-height: 1.2;

			@media (max-width: 768px) {
				font-size: 1.25rem;
			}
		`;
	}

	// Step header subtitle
	static getStepHeaderSubtitle() {
		return styled.p`
			font-size: 1rem;
			margin: 0;
			opacity: 0.9;
			line-height: 1.4;

			@media (max-width: 768px) {
				font-size: 0.875rem;
			}
		`;
	}

	// Step content wrapper
	static getStepContent() {
		return styled.div`
			padding: 2rem;

			@media (max-width: 768px) {
				padding: 1.5rem 1rem;
			}
		`;
	}

	// Step navigation container
	static getStepNavigation() {
		return styled.div`
			display: flex;
			gap: 1rem;
			padding: 1.5rem 2rem;
			border-top: 1px solid #e5e7eb;
			background: #f9fafb;

			@media (max-width: 768px) {
				padding: 1rem;
				flex-direction: column;
			}
		`;
	}

	// Navigation button
	static getNavigationButton(variant: 'primary' | 'secondary' | 'danger' = 'primary') {
		const styles = {
			primary: {
				background: '#3b82f6',
				hoverBackground: '#2563eb',
				color: '#ffffff'
			},
			secondary: {
				background: '#6b7280',
				hoverBackground: '#4b5563',
				color: '#ffffff'
			},
			danger: {
				background: '#ef4444',
				hoverBackground: '#dc2626',
				color: '#ffffff'
			}
		};

		const style = styles[variant];

		return styled.button<{ $variant?: string }>`
			padding: 0.75rem 1.5rem;
			background: ${style.background};
			color: ${style.color};
			border: none;
			border-radius: 6px;
			font-weight: 600;
			cursor: pointer;
			transition: all 0.2s ease;

			&:hover:not(:disabled) {
				background: ${style.hoverBackground};
				transform: translateY(-1px);
				box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
			}

			&:disabled {
				opacity: 0.5;
				cursor: not-allowed;
			}

			@media (max-width: 768px) {
				width: 100%;
				padding: 0.875rem 1rem;
			}
		`;
	}

	// Step progress indicator
	static getStepProgress() {
		return styled.div`
			display: flex;
			align-items: center;
			gap: 0.5rem;
			margin-left: auto;
			color: #6b7280;
			font-size: 0.875rem;
			font-weight: 500;

			@media (max-width: 768px) {
				margin-left: 0;
				margin-top: 0.5rem;
			}
		`;
	}

	// Method to create a complete step layout
	static createStepLayout(config: FlowStepLayoutConfig) {
		const theme = config.theme || 'blue';

		return {
			StepContainer: this.getStepContainer(),
			StepHeader: this.getStepHeader(theme),
			StepHeaderLeft: this.getStepHeaderLeft(),
			VersionBadge: this.getVersionBadge(),
			StepHeaderTitle: this.getStepHeaderTitle(),
			StepHeaderSubtitle: this.getStepHeaderSubtitle(),
			StepContent: this.getStepContent(),
			StepNavigation: this.getStepNavigation(),
			PrimaryButton: this.getNavigationButton('primary'),
			SecondaryButton: this.getNavigationButton('secondary'),
			DangerButton: this.getNavigationButton('danger'),
			StepProgress: this.getStepProgress(),
		};
	}
}

export default FlowStepLayoutService;

