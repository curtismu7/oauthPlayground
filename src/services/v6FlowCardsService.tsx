// src/services/v6FlowCardsService.tsx
/**
 * V6 Flow Cards Service
 * 
 * Provides specialized card components for flows
 * - Suitability cards (Great Fit, Consider Alternatives, Avoid When)
 * - Parameter grids (showing OAuth/OIDC parameters)
 * - Generated content boxes (highlighting generated values)
 * - Consistent styling and responsive design
 */

import React from 'react';
import styled from 'styled-components';
import { type ThemeColor, V6FlowLayoutService } from './v6FlowLayoutService';

export type SuitabilityVariant = 'success' | 'warning' | 'danger';

export class V6FlowCardsService {
	/**
	 * Create flow suitability container
	 */
	static createFlowSuitability() {
		return styled.div`
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
			gap: 1rem;
			margin: 1.5rem 0 0;
		`;
	}

	/**
	 * Create suitability card
	 */
	static createSuitabilityCard() {
		return styled.div<{ $variant: SuitabilityVariant }>`
			border-radius: 1rem;
			padding: 1.25rem;
			border: 2px solid
				${({ $variant }) => {
					if ($variant === 'success') return '#34d399';
					if ($variant === 'warning') return '#fbbf24';
					return '#f87171';
				}};
			background-color: ${({ $variant }) => {
				if ($variant === 'success') return '#f0fdf4';
				if ($variant === 'warning') return '#fffbeb';
				return '#fef2f2';
			}};

			h4 {
				font-size: 0.875rem;
				font-weight: 600;
				margin: 0 0 0.5rem 0;
				color: ${({ $variant }) => {
					if ($variant === 'success') return '#166534';
					if ($variant === 'warning') return '#92400e';
					return '#991b1b';
				}};
			}

			ul {
				margin: 0;
				padding-left: 1.25rem;
				line-height: 1.6;
				font-size: 0.875rem;
			}

			li {
				margin-bottom: 0.25rem;
			}
		`;
	}

	/**
	 * Create parameter grid
	 */
	static createParameterGrid() {
		return styled.div`
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
			gap: 1rem;
			margin: 1rem 0;
		`;
	}

	/**
	 * Create parameter label
	 */
	static createParameterLabel(theme: ThemeColor = 'blue') {
		const colors = V6FlowLayoutService.getTheme(theme);
		return styled.div`
			font-size: 0.75rem;
			font-weight: 600;
			color: ${colors.primary};
			text-transform: uppercase;
			letter-spacing: 0.05em;
			margin-bottom: 0.5rem;
		`;
	}

	/**
	 * Create parameter value
	 */
	static createParameterValue(theme: ThemeColor = 'blue') {
		const colors = V6FlowLayoutService.getTheme(theme);
		return styled.div`
			font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
			font-size: 0.875rem;
			color: ${colors.text};
			word-break: break-all;
			background-color: ${colors.primaryLighter}20;
			border: 1px solid ${colors.primaryLighter};
			border-radius: 0.375rem;
			padding: 0.5rem;
		`;
	}

	/**
	 * Create generated content box
	 */
	static createGeneratedContentBox(theme: ThemeColor = 'blue') {
		const colors = V6FlowLayoutService.getTheme(theme);
		return styled.div`
			background-color: ${colors.primaryLighter}20;
			border: 1px solid ${colors.primary};
			border-radius: 0.75rem;
			padding: 1.5rem;
			margin: 1.5rem 0;
			position: relative;
		`;
	}

	/**
	 * Create generated label
	 */
	static createGeneratedLabel(theme: ThemeColor = 'blue') {
		const colors = V6FlowLayoutService.getTheme(theme);
		return styled.div`
			position: absolute;
			top: -10px;
			left: 16px;
			background-color: ${colors.primaryDark};
			color: white;
			padding: 0.25rem 0.75rem;
			border-radius: 9999px;
			font-size: 0.75rem;
			font-weight: 600;
		`;
	}

	/**
	 * Create comparison card (for comparing OAuth vs OIDC, etc.)
	 */
	static createComparisonCard(theme: ThemeColor = 'blue') {
		const colors = V6FlowLayoutService.getTheme(theme);
		return styled.div`
			background: white;
			border: 1px solid ${colors.primaryLighter};
			border-radius: 0.75rem;
			padding: 1.5rem;
			margin: 1rem 0;

			h4 {
				font-size: 1rem;
				font-weight: 600;
				color: ${colors.text};
				margin: 0 0 1rem 0;
			}

			table {
				width: 100%;
				border-collapse: collapse;

				th,
				td {
					padding: 0.75rem;
					text-align: left;
					border-bottom: 1px solid #e2e8f0;
				}

				th {
					font-weight: 600;
					color: ${colors.text};
					background-color: ${colors.primaryLighter}10;
				}

				td {
					color: #374151;
				}

				tr:last-child td {
					border-bottom: none;
				}
			}
		`;
	}

	/**
	 * Create code snippet box
	 */
	static createCodeSnippetBox(theme: ThemeColor = 'blue') {
		const colors = V6FlowLayoutService.getTheme(theme);
		return styled.pre`
			background: #1e293b;
			color: #e2e8f0;
			border-radius: 0.5rem;
			padding: 1rem;
			margin: 1rem 0;
			overflow-x: auto;
			font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
			font-size: 0.875rem;
			line-height: 1.5;
			border: 1px solid ${colors.primaryLighter};

			code {
				background: none;
				padding: 0;
				border: none;
			}
		`;
	}

	/**
	 * Get all card components at once
	 */
	static createFlowCards(theme: ThemeColor = 'blue') {
		return {
			FlowSuitability: this.createFlowSuitability(),
			SuitabilityCard: this.createSuitabilityCard(),
			ParameterGrid: this.createParameterGrid(),
			ParameterLabel: this.createParameterLabel(theme),
			ParameterValue: this.createParameterValue(theme),
			GeneratedContentBox: this.createGeneratedContentBox(theme),
			GeneratedLabel: this.createGeneratedLabel(theme),
			ComparisonCard: this.createComparisonCard(theme),
			CodeSnippetBox: this.createCodeSnippetBox(theme),
		};
	}
}

export default V6FlowCardsService;

