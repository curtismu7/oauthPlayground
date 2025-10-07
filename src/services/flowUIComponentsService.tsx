// src/services/flowUIComponentsService.tsx
// ⭐ V6 SERVICE - Common UI components used across all flows
// Used in: OAuthAuthorizationCodeFlowV6
// Purpose: Centralizes UI components (InfoBox, Buttons, ParameterGrid, etc.)

import styled from 'styled-components';

export interface FlowUIConfig {
	theme?: 'blue' | 'green' | 'orange' | 'purple' | 'red';
	enableAnimations?: boolean;
}

export class FlowUIComponentsService {
	// InfoBox - for success/warning/info/error messages
	static getInfoBox() {
		return styled.div<{ variant?: 'success' | 'warning' | 'info' | 'error' }>`
			padding: 1rem 1.25rem;
			border-radius: 0.5rem;
			margin-bottom: 1.5rem;
			display: flex;
			align-items: flex-start;
			gap: 0.75rem;
			font-size: 0.9375rem;
			line-height: 1.6;

			${({ variant = 'info' }) => {
				switch (variant) {
					case 'success':
						return `
							background: #f0fdf4;
							border: 1px solid #bbf7d0;
							color: #166534;
						`;
					case 'warning':
						return `
							background: #fffbeb;
							border: 1px solid #fde68a;
							color: #92400e;
						`;
					case 'error':
						return `
							background: #fef2f2;
							border: 1px solid #fecaca;
							color: #991b1b;
						`;
					default:
						return `
							background: #eff6ff;
							border: 1px solid #bfdbfe;
							color: #1e40af;
						`;
				}
			}}
		`;
	}

	// Parameter Grid - for displaying key-value pairs
	static getParameterGrid() {
		return styled.div`
			display: grid;
			grid-template-columns: auto 1fr;
			gap: 0.75rem 1.5rem;
			align-items: center;
			margin: 1rem 0;

			@media (max-width: 768px) {
				grid-template-columns: 1fr;
				gap: 0.5rem;
			}
		`;
	}

	// Parameter Label
	static getParameterLabel() {
		return styled.div`
			font-weight: 600;
			color: #374151;
			font-size: 0.875rem;

			@media (max-width: 768px) {
				font-size: 0.8125rem;
			}
		`;
	}

	// Parameter Value
	static getParameterValue() {
		return styled.div`
			color: #6b7280;
			font-size: 0.875rem;
			font-family: 'SF Mono', Monaco, monospace;
			word-break: break-all;

			@media (max-width: 768px) {
				font-size: 0.8125rem;
			}
		`;
	}

	// Action Row - for button groups
	static getActionRow() {
		return styled.div<{ $justify?: string }>`
			display: flex;
			gap: 1rem;
			margin: 1.5rem 0;
			justify-content: ${props => props.$justify || 'flex-start'};
			flex-wrap: wrap;

			@media (max-width: 768px) {
				flex-direction: column;
			}
		`;
	}

	// Button component with variants
	static getButton() {
		return styled.button<{ 
			variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'success';
			size?: 'sm' | 'md' | 'lg';
		}>`
			display: inline-flex;
			align-items: center;
			justify-content: center;
			gap: 0.5rem;
			font-weight: 600;
			border-radius: 0.5rem;
			cursor: pointer;
			transition: all 0.2s ease;
			border: 1px solid transparent;

			${({ size = 'md' }) => {
				switch (size) {
					case 'sm':
						return 'padding: 0.5rem 1rem; font-size: 0.875rem;';
					case 'lg':
						return 'padding: 1rem 2rem; font-size: 1.125rem;';
					default:
						return 'padding: 0.75rem 1.5rem; font-size: 1rem;';
				}
			}}

			${({ variant = 'primary' }) => {
				switch (variant) {
					case 'primary':
						return `
							background: #3b82f6;
							color: white;
							&:hover:not(:disabled) {
								background: #2563eb;
								transform: translateY(-1px);
								box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
							}
						`;
					case 'secondary':
						return `
							background: #6b7280;
							color: white;
							&:hover:not(:disabled) {
								background: #4b5563;
								transform: translateY(-1px);
							}
						`;
					case 'danger':
						return `
							background: #ef4444;
							color: white;
							&:hover:not(:disabled) {
								background: #dc2626;
								transform: translateY(-1px);
							}
						`;
					case 'success':
						return `
							background: #10b981;
							color: white;
							&:hover:not(:disabled) {
								background: #059669;
								transform: translateY(-1px);
							}
						`;
					case 'outline':
						return `
							background: transparent;
							color: #3b82f6;
							border: 1px solid #3b82f6;
							&:hover:not(:disabled) {
								background: #eff6ff;
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

			@media (max-width: 768px) {
				width: 100%;
			}
		`;
	}

	// Generated Content Box
	static getGeneratedContentBox() {
		return styled.div`
			background: #f8fafc;
			border: 1px solid #e2e8f0;
			border-radius: 0.75rem;
			padding: 1.5rem;
			margin: 1.5rem 0;
		`;
	}

	// Section Divider
	static getSectionDivider() {
		return styled.hr`
			border: none;
			border-top: 1px solid #e2e8f0;
			margin: 2rem 0;
		`;
	}

	// Card variants
	static getCard() {
		return styled.div<{ variant?: 'elevated' | 'outlined' | 'default' }>`
			background: white;
			border-radius: 0.75rem;
			padding: 1.5rem;
			margin-bottom: 1.5rem;

			${({ variant = 'default' }) => {
				switch (variant) {
					case 'elevated':
						return `
							box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
							border: none;
						`;
					case 'outlined':
						return `
							border: 1px solid #e2e8f0;
							box-shadow: none;
						`;
					default:
						return `
							border: 1px solid #e2e8f0;
							box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
						`;
				}
			}}
		`;
	}

	// Method to create all components at once
	static createComponents() {
		return {
			InfoBox: this.getInfoBox(),
			ParameterGrid: this.getParameterGrid(),
			ParameterLabel: this.getParameterLabel(),
			ParameterValue: this.getParameterValue(),
			ActionRow: this.getActionRow(),
			Button: this.getButton(),
			GeneratedContentBox: this.getGeneratedContentBox(),
			SectionDivider: this.getSectionDivider(),
			Card: this.getCard(),
		};
	}
}

export default FlowUIComponentsService;

