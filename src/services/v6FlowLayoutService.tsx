// src/services/v6FlowLayoutService.tsx
/**
 * V6 Flow Layout Service
 * 
 * Provides standardized layout components for all V6 flows
 * - Matches V5 visual structure
 * - Customizable color themes (blue, green, purple, etc.)
 * - Consistent spacing and responsive design
 * - Reusable across all flow types
 */

import React from 'react';
import styled from 'styled-components';

export type ThemeColor = 'blue' | 'green' | 'purple' | 'red' | 'orange' | 'teal';

export interface ThemeConfig {
	primary: string;
	primaryDark: string;
	primaryLight: string;
	primaryLighter: string;
	text: string;
	textLight: string;
}

const THEME_COLORS: Record<ThemeColor, ThemeConfig> = {
	blue: {
		primary: '#3b82f6',
		primaryDark: '#2563eb',
		primaryLight: '#60a5fa',
		primaryLighter: '#bfdbfe',
		text: '#1e40af',
		textLight: '#3b82f6',
	},
	green: {
		primary: '#16a34a',
		primaryDark: '#15803d',
		primaryLight: '#4ade80',
		primaryLighter: '#bbf7d0',
		text: '#14532d',
		textLight: '#16a34a',
	},
	purple: {
		primary: '#9333ea',
		primaryDark: '#7e22ce',
		primaryLight: '#a855f7',
		primaryLighter: '#d8b4fe',
		text: '#581c87',
		textLight: '#9333ea',
	},
	red: {
		primary: '#dc2626',
		primaryDark: '#b91c1c',
		primaryLight: '#f87171',
		primaryLighter: '#fecaca',
		text: '#991b1b',
		textLight: '#dc2626',
	},
	orange: {
		primary: '#f97316',
		primaryDark: '#ea580c',
		primaryLight: '#fb923c',
		primaryLighter: '#fed7aa',
		text: '#9a3412',
		textLight: '#f97316',
	},
	teal: {
		primary: '#14b8a6',
		primaryDark: '#0d9488',
		primaryLight: '#2dd4bf',
		primaryLighter: '#99f6e4',
		text: '#115e59',
		textLight: '#14b8a6',
	},
};

export class V6FlowLayoutService {
	/**
	 * Get theme configuration
	 */
	static getTheme(color: ThemeColor = 'blue'): ThemeConfig {
		return THEME_COLORS[color];
	}

	/**
	 * Create container component
	 */
	static createContainer() {
		return styled.div`
			min-height: 100vh;
			background-color: #f9fafb;
			padding: 2rem 0 6rem;
		`;
	}

	/**
	 * Create content wrapper
	 */
	static createContentWrapper() {
		return styled.div`
			max-width: 64rem;
			margin: 0 auto;
			padding: 0 1rem;
		`;
	}

	/**
	 * Create main card
	 */
	static createMainCard() {
		return styled.div`
			background-color: #ffffff;
			border-radius: 1rem;
			box-shadow: 0 20px 40px rgba(15, 23, 42, 0.1);
			border: 1px solid #e2e8f0;
			overflow: hidden;
		`;
	}

	/**
	 * Create step header
	 */
	static createStepHeader(theme: ThemeColor = 'blue') {
		const colors = THEME_COLORS[theme];
		return styled.div`
			background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%);
			color: #ffffff;
			padding: 2rem;
			display: flex;
			align-items: center;
			justify-content: space-between;
		`;
	}

	/**
	 * Create step header left section
	 */
	static createStepHeaderLeft() {
		return styled.div`
			display: flex;
			flex-direction: column;
			gap: 0.5rem;
		`;
	}

	/**
	 * Create version badge
	 */
	static createVersionBadge(theme: ThemeColor = 'blue') {
		const colors = THEME_COLORS[theme];
		return styled.span`
			align-self: flex-start;
			background: rgba(59, 130, 246, 0.2);
			border: 1px solid ${colors.primaryLight};
			color: ${colors.primaryLighter};
			font-size: 0.75rem;
			font-weight: 600;
			letter-spacing: 0.08em;
			text-transform: uppercase;
			padding: 0.25rem 0.75rem;
			border-radius: 9999px;
		`;
	}

	/**
	 * Create step header title
	 */
	static createStepHeaderTitle() {
		return styled.h2`
			font-size: 2rem;
			font-weight: 700;
			margin: 0;
		`;
	}

	/**
	 * Create step header subtitle
	 */
	static createStepHeaderSubtitle() {
		return styled.p`
			font-size: 1rem;
			color: rgba(255, 255, 255, 0.85);
			margin: 0;
		`;
	}

	/**
	 * Create step header right section
	 */
	static createStepHeaderRight() {
		return styled.div`
			text-align: right;
		`;
	}

	/**
	 * Create step number
	 */
	static createStepNumber() {
		return styled.div`
			font-size: 2.5rem;
			font-weight: 700;
			line-height: 1;
		`;
	}

	/**
	 * Create step total
	 */
	static createStepTotal() {
		return styled.div`
			font-size: 0.875rem;
			color: rgba(255, 255, 255, 0.75);
			letter-spacing: 0.05em;
		`;
	}

	/**
	 * Create step content wrapper
	 */
	static createStepContentWrapper() {
		return styled.div`
			padding: 2rem;
			background: #ffffff;
		`;
	}

	/**
	 * Create requirements indicator
	 */
	static createRequirementsIndicator() {
		return styled.div`
			background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
			border: 1px solid #f59e0b;
			border-radius: 8px;
			padding: 1rem;
			margin: 1rem 0;
			display: flex;
			align-items: flex-start;
			gap: 0.75rem;
		`;
	}

	/**
	 * Create requirements icon
	 */
	static createRequirementsIcon() {
		return styled.div`
			color: #d97706;
			font-size: 1.25rem;
			margin-top: 0.125rem;
			flex-shrink: 0;
		`;
	}

	/**
	 * Create requirements text
	 */
	static createRequirementsText() {
		return styled.div`
			color: #92400e;
			font-size: 0.875rem;
			line-height: 1.5;

			strong {
				font-weight: 600;
				display: block;
				margin-bottom: 0.5rem;
			}

			ul {
				margin: 0;
				padding-left: 1.25rem;
			}

			li {
				margin-bottom: 0.25rem;
			}
		`;
	}

	/**
	 * Get all layout components at once
	 */
	static createFlowLayout(theme: ThemeColor = 'blue') {
		return {
			Container: this.createContainer(),
			ContentWrapper: this.createContentWrapper(),
			MainCard: this.createMainCard(),
			StepHeader: this.createStepHeader(theme),
			StepHeaderLeft: this.createStepHeaderLeft(),
			VersionBadge: this.createVersionBadge(theme),
			StepHeaderTitle: this.createStepHeaderTitle(),
			StepHeaderSubtitle: this.createStepHeaderSubtitle(),
			StepHeaderRight: this.createStepHeaderRight(),
			StepNumber: this.createStepNumber(),
			StepTotal: this.createStepTotal(),
			StepContentWrapper: this.createStepContentWrapper(),
			RequirementsIndicator: this.createRequirementsIndicator(),
			RequirementsIcon: this.createRequirementsIcon(),
			RequirementsText: this.createRequirementsText(),
			theme: this.getTheme(theme),
		};
	}
}

export default V6FlowLayoutService;

