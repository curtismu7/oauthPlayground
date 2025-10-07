// src/services/flowUIService.ts
// Comprehensive UI component library for V5 flows
// Consolidates all common UI patterns from OAuth flows

import React from 'react';
import styled from 'styled-components';
import { FiInfo, FiAlertCircle, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';

import { CollapsibleIcon } from '../components/CollapsibleIcon';

export interface FlowUIConfig {
	flowType: string;
	theme: 'green' | 'orange' | 'blue' | 'purple' | 'red';
	showEducationalContent?: boolean;
	showApiCallExamples?: boolean;
	compactMode?: boolean;
}

export interface CollapsibleSectionProps {
	title: string;
	children: React.ReactNode;
	isCollapsed: boolean;
	onToggle: () => void;
	icon?: React.ReactNode;
	variant?: 'default' | 'info' | 'warning' | 'success';
}

export interface InfoBoxProps {
	title?: string;
	children: React.ReactNode;
	variant?: 'info' | 'warning' | 'success' | 'danger';
	icon?: React.ReactNode;
}

export interface ParameterGridProps {
	children: React.ReactNode;
	columns?: number;
	gap?: string;
}

export interface ActionRowProps {
	children: React.ReactNode;
	justify?: 'start' | 'center' | 'end' | 'space-between';
	gap?: string;
	wrap?: boolean;
}

export interface ButtonProps {
	children: React.ReactNode;
	variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'outline';
	size?: 'sm' | 'md' | 'lg';
	disabled?: boolean;
	loading?: boolean;
	onClick?: () => void;
	type?: 'button' | 'submit' | 'reset';
	fullWidth?: boolean;
}

export interface ResultsSectionProps {
	title: string;
	children: React.ReactNode;
	icon?: React.ReactNode;
	variant?: 'default' | 'success' | 'warning' | 'info';
}

export class FlowUIService {
	// ============================================================================
	// LAYOUT COMPONENTS
	// ============================================================================

	static getContainer() {
		return styled.div`
			min-height: 100vh;
			background-color: #f9fafb;
			padding: 2rem 0 6rem;
		`;
	}

	static getContentWrapper() {
		return styled.div`
			max-width: 64rem;
			margin: 0 auto;
			padding: 0 1rem;
		`;
	}

	static getMainCard() {
		return styled.div`
			background-color: #ffffff;
			border-radius: 1rem;
			box-shadow: 0 20px 40px rgba(15, 23, 42, 0.1);
			border: 1px solid #e2e8f0;
			overflow: hidden;
		`;
	}

	// ============================================================================
	// STEP HEADER COMPONENTS
	// ============================================================================

	static getStepHeader(theme: string) {
		const gradients = {
			green: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
			orange: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
			blue: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
			purple: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
			red: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
		};

		return styled.div`
			background: ${gradients[theme as keyof typeof gradients] || gradients.blue};
			color: #ffffff;
			padding: 2rem;
			display: flex;
			align-items: center;
			justify-content: space-between;
		`;
	}

	static getStepHeaderLeft() {
		return styled.div`
			display: flex;
			flex-direction: column;
			gap: 0.5rem;
		`;
	}

	static getStepHeaderRight() {
		return styled.div`
			text-align: right;
		`;
	}

	static getVersionBadge(theme: string) {
		const themeColors = {
			green: { background: 'rgba(22, 163, 74, 0.2)', border: '#4ade80', color: '#bbf7d0' },
			orange: { background: 'rgba(249, 115, 22, 0.2)', border: '#fb923c', color: '#fed7aa' },
			blue: { background: 'rgba(59, 130, 246, 0.2)', border: '#3b82f6', color: '#dbeafe' },
			purple: { background: 'rgba(139, 92, 246, 0.2)', border: '#8b5cf6', color: '#ede9fe' },
			red: { background: 'rgba(239, 68, 68, 0.2)', border: '#ef4444', color: '#fecaca' },
		};

		const colors = themeColors[theme as keyof typeof themeColors] || themeColors.blue;

		return styled.span`
			align-self: flex-start;
			background: ${colors.background};
			border: 1px solid ${colors.border};
			color: ${colors.color};
			font-size: 0.75rem;
			font-weight: 600;
			letter-spacing: 0.08em;
			text-transform: uppercase;
			padding: 0.25rem 0.75rem;
			border-radius: 9999px;
		`;
	}

	static getStepHeaderTitle() {
		return styled.h2`
			font-size: 2rem;
			font-weight: 700;
			margin: 0;
		`;
	}

	static getStepHeaderSubtitle() {
		return styled.p`
			font-size: 1rem;
			color: rgba(255, 255, 255, 0.85);
			margin: 0;
		`;
	}

	static getStepNumber() {
		return styled.div`
			font-size: 2.5rem;
			font-weight: 700;
			line-height: 1;
		`;
	}

	static getStepTotal() {
		return styled.div`
			font-size: 0.875rem;
			color: rgba(255, 255, 255, 0.75);
			letter-spacing: 0.05em;
		`;
	}

	static getStepContentWrapper() {
		return styled.div`
			padding: 2rem;
			background: #ffffff;
		`;
	}

	// ============================================================================
	// COLLAPSIBLE SECTIONS
	// ============================================================================

	static getCollapsibleSection() {
		return styled.section`
			border: 1px solid #e2e8f0;
			border-radius: 0.75rem;
			margin-bottom: 1.5rem;
			background-color: #ffffff;
			box-shadow: 0 10px 20px rgba(15, 23, 42, 0.05);
		`;
	}

	static getCollapsibleHeaderButton(theme: string) {
		const themeColors = {
			green: {
				background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf3 100%)',
				hover: 'linear-gradient(135deg, #dcfce7 0%, #ecfdf3 100%)',
				color: '#14532d',
			},
			orange: {
				background: 'linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%)',
				hover: 'linear-gradient(135deg, #fed7aa 0%, #fdba74 100%)',
				color: '#7c2d12',
			},
			blue: {
				background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
				hover: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
				color: '#0c4a6e',
			},
			purple: {
				background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
				hover: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
				color: '#581c87',
			},
			red: {
				background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
				hover: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
				color: '#7f1d1d',
			},
		};

		const colors = themeColors[theme as keyof typeof themeColors] || themeColors.blue;

		return styled.button<{ $collapsed?: boolean }>`
			display: flex;
			align-items: center;
			justify-content: space-between;
			width: 100%;
			padding: 1.25rem 1.5rem;
			background: ${colors.background};
			border: none;
			border-radius: 0.75rem;
			cursor: pointer;
			font-size: 1.1rem;
			font-weight: 600;
			color: ${colors.color};
			transition: background 0.2s ease;

			&:hover {
				background: ${colors.hover};
			}
		`;
	}

	static getCollapsibleTitle() {
		return styled.span`
			display: flex;
			align-items: center;
			gap: 0.75rem;
		`;
	}

	static getCollapsibleToggleIcon(theme: string) {
		const themeColors = {
			green: '#16a34a',
			orange: '#ea580c',
			blue: '#3b82f6',
			purple: '#8b5cf6',
			red: '#ef4444',
		};

		const background = themeColors[theme as keyof typeof themeColors] || themeColors.blue;

		return styled(CollapsibleIcon).attrs<{ $collapsed?: boolean }>(({ $collapsed }) => ({
			isExpanded: !$collapsed,
		}))<{ $collapsed?: boolean }>`
			display: inline-flex;
			align-items: center;
			justify-content: center;
			width: 32px;
			height: 32px;
			border-radius: 50%;
			background: ${background};
			color: white;
			box-shadow: 0 6px 16px ${background}33;
			transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;

			svg {
				width: 16px;
				height: 16px;
			}

			&:hover {
				transform: translateY(-1px);
				box-shadow: 0 8px 20px ${background}4d;
			}
		`;
	}

	static getCollapsibleContent() {
		return styled.div`
			padding: 1.5rem;
			padding-top: 0;
			animation: fadeIn 0.2s ease;

			@keyframes fadeIn {
				from {
					opacity: 0;
				}
				to {
					opacity: 1;
				}
			}
		`;
	}

	// ============================================================================
	// INFO BOXES
	// ============================================================================

	static getInfoBox() {
		return styled.div<{ $variant?: 'info' | 'warning' | 'success' | 'danger' }>`
			border-radius: 0.75rem;
			padding: 1.5rem;
			margin-bottom: 1.5rem;
			display: flex;
			gap: 1rem;
			align-items: flex-start;
			border: 1px solid
				${({ $variant }) => {
					switch ($variant) {
						case 'warning': return '#f59e0b';
						case 'success': return '#22c55e';
						case 'danger': return '#ef4444';
						default: return '#3b82f6';
					}
				}};
			background-color:
				${({ $variant }) => {
					switch ($variant) {
						case 'warning': return '#fef3c7';
						case 'success': return '#dcfce7';
						case 'danger': return '#fee2e2';
						default: return '#dbeafe';
					}
				}};
		`;
	}

	static getInfoTitle() {
		return styled.h3`
			font-size: 1rem;
			font-weight: 600;
			color: #0f172a;
			margin: 0 0 0.5rem 0;
		`;
	}

	static getInfoText() {
		return styled.p`
			font-size: 0.95rem;
			color: #3f3f46;
			line-height: 1.7;
			margin: 0;
		`;
	}

	static getInfoList() {
		return styled.ul`
			font-size: 0.875rem;
			color: #334155;
			line-height: 1.5;
			margin: 0.5rem 0 0;
			padding-left: 1.5rem;
		`;
	}

	// ============================================================================
	// PARAMETER GRID
	// ============================================================================

	static getParameterGrid() {
		return styled.div<{ $columns?: number; $gap?: string }>`
			display: grid;
			grid-template-columns: repeat(${({ $columns }) => $columns || 'auto-fit'}, minmax(300px, 1fr));
			gap: ${({ $gap }) => $gap || '1rem'};
			margin-bottom: 1rem;
		`;
	}

	static getParameterItem() {
		return styled.div`
			background: white;
			border: 1px solid #e5e7eb;
			border-radius: 0.5rem;
			padding: 1rem;
		`;
	}

	static getParameterLabel() {
		return styled.div`
			font-weight: 500;
			color: #374151;
			font-size: 0.875rem;
			margin-bottom: 0.25rem;
		`;
	}

	static getParameterValue() {
		return styled.div`
			font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
			font-size: 0.875rem;
			color: #1f2937;
			word-break: break-all;
			background: #f9fafb;
			padding: 0.5rem;
			border-radius: 0.375rem;
		`;
	}

	// ============================================================================
	// ACTION ROWS AND BUTTONS
	// ============================================================================

	static getActionRow() {
		return styled.div<{ $justify?: string; $gap?: string; $wrap?: boolean }>`
			display: flex;
			flex-wrap: ${({ $wrap }) => $wrap ? 'wrap' : 'nowrap'};
			gap: ${({ $gap }) => $gap || '1rem'};
			align-items: center;
			justify-content: ${({ $justify }) => $justify || 'center'};
			margin-top: 1.5rem;
		`;
	}

	static getButton() {
		return styled.button<ButtonProps>`
			display: inline-flex;
			align-items: center;
			justify-content: center;
			gap: 0.5rem;
			padding: ${({ size }) => {
				switch (size) {
					case 'sm': return '0.5rem 1rem';
					case 'lg': return '0.875rem 2rem';
					default: return '0.75rem 1.5rem';
				}
			}};
			border-radius: 0.5rem;
			font-size: ${({ size }) => size === 'sm' ? '0.875rem' : '0.875rem'};
			font-weight: 600;
			cursor: ${({ disabled }) => disabled ? 'not-allowed' : 'pointer'};
			transition: all 0.2s;
			border: 1px solid transparent;
			width: ${({ fullWidth }) => fullWidth ? '100%' : 'auto'};
			opacity: ${({ disabled }) => disabled ? 0.6 : 1};

			${({ variant }) => {
				switch (variant) {
					case 'primary':
						return `
							background-color: #3b82f6;
							color: #ffffff;
							border: 1px solid #ffffff;
							&:hover:not(:disabled) {
								background-color: #2563eb;
								border-color: #ffffff;
							}
						`;
					case 'success':
						return `
							background-color: #22c55e;
							color: #ffffff;
							&:hover:not(:disabled) {
								background-color: #16a34a;
							}
						`;
					case 'secondary':
						return `
							background-color: #6b7280;
							color: #ffffff;
							&:hover:not(:disabled) {
								background-color: #4b5563;
							}
						`;
					case 'danger':
						return `
							background-color: #ef4444;
							color: #ffffff;
							&:hover:not(:disabled) {
								background-color: #dc2626;
							}
						`;
					case 'outline':
						return `
							background-color: transparent;
							color: #3b82f6;
							border-color: #3b82f6;
							&:hover:not(:disabled) {
								background-color: #f8fafc;
								border-color: #2563eb;
							}
						`;
					default:
						return `
							background-color: #f3f4f6;
							color: #374151;
							&:hover:not(:disabled) {
								background-color: #e5e7eb;
							}
						`;
				}
			}}
		`;
	}

	static getHighlightedActionButton() {
		return styled.button<{ $priority: 'primary' | 'success' }>`
			position: relative;
			background: ${({ $priority }) =>
				$priority === 'primary'
					? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
					: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'};
			box-shadow: ${({ $priority }) =>
				$priority === 'primary'
					? '0 6px 18px rgba(59, 130, 246, 0.35)'
					: '0 6px 18px rgba(34, 197, 94, 0.35)'};
			color: #ffffff;
			padding-right: 2.5rem;

			&:hover {
				transform: scale(1.02);
			}

			&:disabled {
				background: ${({ $priority }) =>
					$priority === 'primary'
						? 'linear-gradient(135deg, rgba(59,130,246,0.6) 0%, rgba(37,99,235,0.6) 100%)'
						: 'linear-gradient(135deg, rgba(34,197,94,0.6) 0%, rgba(22,163,74,0.6) 100%)'};
				box-shadow: none;
			}
		`;
	}

	// ============================================================================
	// RESULTS PANELS
	// ============================================================================

	static getResultsSection() {
		return styled.div`
			background: #f8fafc;
			border: 1px solid #e2e8f0;
			border-radius: 0.75rem;
			padding: 1.5rem;
			margin: 1.5rem 0;
		`;
	}

	static getResultsHeading() {
		return styled.h3`
			font-size: 1.125rem;
			font-weight: 600;
			color: #1f2937;
			margin: 0 0 1rem 0;
			display: flex;
			align-items: center;
			gap: 0.5rem;
		`;
	}

	static getCodeBlock() {
		return styled.pre`
			background: #1f2937;
			color: #f9fafb;
			padding: 1rem;
			border-radius: 0.5rem;
			font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
			font-size: 0.875rem;
			line-height: 1.5;
			overflow-x: auto;
			margin: 0;
		`;
	}

	// ============================================================================
	// FORM COMPONENTS
	// ============================================================================

	static getFormGroup() {
		return styled.div`
			margin-bottom: 1rem;
		`;
	}

	static getLabel() {
		return styled.label`
			display: block;
			margin-bottom: 0.5rem;
			font-weight: 500;
			color: #374151;
		`;
	}

	static getInput() {
		return styled.input`
			width: 100%;
			padding: 0.75rem;
			border: 1px solid #d1d5db;
			border-radius: 0.5rem;
			font-size: 0.875rem;
			transition: border-color 0.2s, box-shadow 0.2s;

			&:focus {
				outline: none;
				border-color: #3b82f6;
				box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
			}

			&:disabled {
				background-color: #f9fafb;
				color: #6b7280;
				cursor: not-allowed;
			}
		`;
	}

	static getTextArea() {
		return styled.textarea`
			width: 100%;
			padding: 0.75rem;
			border: 1px solid #d1d5db;
			border-radius: 0.5rem;
			font-size: 0.875rem;
			font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
			min-height: 100px;
			resize: vertical;
			transition: border-color 0.2s, box-shadow 0.2s;

			&:focus {
				outline: none;
				border-color: #3b82f6;
				box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
			}

			&:disabled {
				background-color: #f9fafb;
				color: #6b7280;
				cursor: not-allowed;
			}
		`;
	}

	// ============================================================================
	// UTILITY COMPONENTS
	// ============================================================================

	static getSectionDivider() {
		return styled.div`
			margin: 2rem 0;
			height: 1px;
			background: linear-gradient(90deg, #e2e8f0 0%, #f1f5f9 50%, #e2e8f0 100%);
		`;
	}

	static getHelperText() {
		return styled.p`
			font-size: 0.875rem;
			color: #6b7280;
			margin: 0.5rem 0 1rem 0;
			line-height: 1.5;
		`;
	}

	static getEmptyState() {
		return styled.div`
			text-align: center;
			padding: 2rem;
			color: #6b7280;
		`;
	}

	static getEmptyStateIcon() {
		return styled.div`
			font-size: 3rem;
			margin-bottom: 1rem;
			color: #d1d5db;
		`;
	}

	static getEmptyStateTitle() {
		return styled.h3`
			font-size: 1.125rem;
			font-weight: 600;
			color: #374151;
			margin: 0 0 0.5rem 0;
		`;
	}

	static getEmptyStateText() {
		return styled.p`
			font-size: 0.875rem;
			color: #6b7280;
			margin: 0;
		`;
	}

	// ============================================================================
	// UTILITY METHODS
	// ============================================================================

	static getThemeFromVariant(variant: string): string {
		const themeMap: Record<string, string> = {
			info: 'blue',
			warning: 'orange',
			success: 'green',
			danger: 'red',
			default: 'blue',
		};
		return themeMap[variant] || themeMap.default;
	}

	static getThemeColors(theme: string) {
		const themes = {
			green: {
				primary: '#16a34a',
				primaryHover: '#15803d',
				secondary: '#22c55e',
				secondaryHover: '#16a34a',
				background: 'rgba(22, 163, 74, 0.2)',
				border: '#4ade80',
				text: '#bbf7d0',
			},
			orange: {
				primary: '#f97316',
				primaryHover: '#ea580c',
				secondary: '#fb923c',
				secondaryHover: '#f97316',
				background: 'rgba(249, 115, 22, 0.2)',
				border: '#fb923c',
				text: '#fed7aa',
			},
			blue: {
				primary: '#3b82f6',
				primaryHover: '#2563eb',
				secondary: '#60a5fa',
				secondaryHover: '#3b82f6',
				background: 'rgba(59, 130, 246, 0.2)',
				border: '#3b82f6',
				text: '#dbeafe',
			},
			purple: {
				primary: '#8b5cf6',
				primaryHover: '#7c3aed',
				secondary: '#a78bfa',
				secondaryHover: '#8b5cf6',
				background: 'rgba(139, 92, 246, 0.2)',
				border: '#8b5cf6',
				text: '#ede9fe',
			},
			red: {
				primary: '#ef4444',
				primaryHover: '#dc2626',
				secondary: '#f87171',
				secondaryHover: '#ef4444',
				background: 'rgba(239, 68, 68, 0.2)',
				border: '#ef4444',
				text: '#fecaca',
			},
		};

		return themes[theme as keyof typeof themes] || themes.blue;
	}

	static getFlowUIConfig(flowType: string): FlowUIConfig {
		const configs: Record<string, FlowUIConfig> = {
			'implicit': {
				flowType: 'implicit',
				theme: 'orange',
				showEducationalContent: true,
				showApiCallExamples: true,
				compactMode: false,
			},
			'authorization-code': {
				flowType: 'authorization-code',
				theme: 'green',
				showEducationalContent: true,
				showApiCallExamples: true,
				compactMode: false,
			},
			'client-credentials': {
				flowType: 'client-credentials',
				theme: 'green',
				showEducationalContent: true,
				showApiCallExamples: true,
				compactMode: false,
			},
			'device-authorization': {
				flowType: 'device-authorization',
				theme: 'purple',
				showEducationalContent: true,
				showApiCallExamples: true,
				compactMode: false,
			},
		};

		return configs[flowType] || configs['authorization-code'];
	}

	// ============================================================================
	// NEW METHOD: GET FLOW UI COMPONENTS
	// ============================================================================

	static getFlowUIComponents() {
		return {
			// Layout components
			Container: this.getContainer(),
			ContentWrapper: this.getContentWrapper(),
			MainCard: this.getMainCard(),

			// Step header components
			StepHeader: this.getStepHeader('blue'), // Default theme
			StepHeaderLeft: this.getStepHeaderLeft(),
			StepHeaderRight: this.getStepHeaderRight(),
			VersionBadge: this.getVersionBadge('blue'), // Default theme
			StepHeaderTitle: this.getStepHeaderTitle(),
			StepHeaderSubtitle: this.getStepHeaderSubtitle(),
			StepNumber: this.getStepNumber(),
			StepTotal: this.getStepTotal(),
			StepContentWrapper: this.getStepContentWrapper(),

			// Collapsible sections
			CollapsibleSection: this.getCollapsibleSection(),
			CollapsibleHeaderButton: this.getCollapsibleHeaderButton('blue'), // Default theme
			CollapsibleTitle: this.getCollapsibleTitle(),
			CollapsibleToggleIcon: this.getCollapsibleToggleIcon('blue'), // Default theme
			CollapsibleContent: this.getCollapsibleContent(),

			// Info boxes
			InfoBox: this.getInfoBox(),
			InfoTitle: this.getInfoTitle(),
			InfoText: this.getInfoText(),
			InfoList: this.getInfoList(),

			// Parameter grid
			ParameterGrid: this.getParameterGrid(),
			ParameterLabel: this.getParameterLabel(),
			ParameterValue: this.getParameterValue(),

			// Action components
			ActionRow: this.getActionRow(),
			Button: this.getButton(),
			HighlightedActionButton: this.getHighlightedActionButton(),

			// Results components
			ResultsSection: this.getResultsSection(),
			ResultsHeading: this.getResultsHeading(),
			CodeBlock: this.getCodeBlock(),

			// Form components
			FormGroup: this.getFormGroup(),
			Label: this.getLabel(),
			Input: this.getInput(),
			TextArea: this.getTextArea(),

			// Utility components
			SectionDivider: this.getSectionDivider(),
			HelperText: this.getHelperText(),

			// Typography
			StrongText: styled.span`
				font-weight: 600;
				color: #1f2937;
			`,

			// Flow diagram components
			FlowDiagram: styled.div`
				display: flex;
				flex-direction: column;
				gap: 1rem;
				margin: 1.5rem 0;
				padding: 1.5rem;
				background: #f8fafc;
				border-radius: 0.75rem;
				border: 1px solid #e2e8f0;
			`,
			FlowStep: styled.div`
				display: flex;
				align-items: flex-start;
				gap: 1rem;
			`,
			FlowStepNumber: styled.div`
				display: flex;
				align-items: center;
				justify-content: center;
				width: 2rem;
				height: 2rem;
				border-radius: 50%;
				background: #3b82f6;
				color: white;
				font-weight: 600;
				font-size: 0.875rem;
				flex-shrink: 0;
			`,
			FlowStepContent: styled.div`
				flex: 1;
			`,

			// Additional components
			GeneratedContentBox: styled.div`
				background: #f8fafc;
				border: 1px solid #e2e8f0;
				border-radius: 0.5rem;
				padding: 1rem;
				margin: 1rem 0;
			`,
			GeneratedLabel: styled.div`
				font-weight: 600;
				color: #374151;
				margin-bottom: 0.5rem;
				font-size: 0.875rem;
			`,
			ExplanationSection: styled.div`
				margin: 1.5rem 0;
			`,
			ExplanationHeading: styled.h3`
				font-size: 1.125rem;
				font-weight: 600;
				color: #1f2937;
				margin: 0 0 1rem 0;
				display: flex;
				align-items: center;
				gap: 0.5rem;
			`,
			NextSteps: styled.div`
				margin-top: 1rem;
			`,
			HighlightBadge: styled.span`
				display: inline-flex;
				align-items: center;
				justify-content: center;
				width: 1.5rem;
				height: 1.5rem;
				border-radius: 50%;
				background: #22c55e;
				color: white;
				font-size: 0.75rem;
				font-weight: 600;
				margin-left: 0.5rem;
			`,
			RequirementsIndicator: styled.div`
				background: #fef3c7;
				border: 1px solid #f59e0b;
				border-radius: 0.5rem;
				padding: 1rem;
				margin-bottom: 1rem;
				display: flex;
				align-items: flex-start;
				gap: 1rem;
			`,
			RequirementsIcon: styled.div`
				color: #f59e0b;
				flex-shrink: 0;
			`,
			RequirementsText: styled.div`
				flex: 1;
			`,
		};
	}
}

// ============================================================================
// REACT COMPONENTS (Separate from class to avoid JSX issues)
// ============================================================================

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
	title,
	children,
	isCollapsed,
	onToggle,
	icon,
	variant = 'default'
}) => {
	const theme = FlowUIService.getThemeFromVariant(variant);
	const Section = FlowUIService.getCollapsibleSection();
	const HeaderButton = FlowUIService.getCollapsibleHeaderButton(theme);
	const Title = FlowUIService.getCollapsibleTitle();
	const ToggleIcon = FlowUIService.getCollapsibleToggleIcon(theme);
	const Content = FlowUIService.getCollapsibleContent();

	return (
		<Section>
			<HeaderButton onClick={onToggle} $collapsed={isCollapsed}>
				<Title>
					{icon}
					{title}
				</Title>
				<ToggleIcon $collapsed={isCollapsed} />
			</HeaderButton>
			{!isCollapsed && <Content>{children}</Content>}
		</Section>
	);
};

export const InfoBox: React.FC<InfoBoxProps> = ({
	title,
	children,
	variant = 'info',
	icon
}) => {
	const Box = FlowUIService.getInfoBox();
	const Title = FlowUIService.getInfoTitle();
	const Text = FlowUIService.getInfoText();

	const defaultIcons = {
		info: <FiInfo size={20} />,
		warning: <FiAlertTriangle size={20} />,
		success: <FiCheckCircle size={20} />,
		danger: <FiAlertCircle size={20} />
	};

	return (
		<Box $variant={variant}>
			{icon || defaultIcons[variant]}
			<div>
				{title && <Title>{title}</Title>}
				{typeof children === 'string' ? <Text>{children}</Text> : children}
			</div>
		</Box>
	);
};

export const ParameterGrid: React.FC<ParameterGridProps> = ({
	children,
	columns = 1,
	gap = '1rem'
}) => {
	const Grid = FlowUIService.getParameterGrid();
	return <Grid $columns={columns} $gap={gap}>{children}</Grid>;
};

export const ActionRow: React.FC<ActionRowProps> = ({
	children,
	justify = 'center',
	gap = '1rem',
	wrap = false
}) => {
	const Row = FlowUIService.getActionRow();
	return <Row $justify={justify} $gap={gap} $wrap={wrap}>{children}</Row>;
};

export const Button: React.FC<ButtonProps> = ({
	children,
	variant = 'primary',
	size = 'md',
	disabled = false,
	loading = false,
	onClick,
	type = 'button',
	fullWidth = false
}) => {
	const StyledButton = FlowUIService.getButton();
	return (
		<StyledButton
			variant={variant}
			size={size}
			disabled={disabled || loading}
			onClick={onClick}
			type={type}
			fullWidth={fullWidth}
		>
			{loading && <span>⟳</span>}
			{children}
		</StyledButton>
	);
};

export const ResultsSection: React.FC<ResultsSectionProps> = ({
	title,
	children,
	icon,
	variant = 'default'
}) => {
	const Section = FlowUIService.getResultsSection();
	const Heading = FlowUIService.getResultsHeading();

	return (
		<Section>
			<Heading>
				{icon}
				{title}
			</Heading>
			{children}
		</Section>
	);
};

export default FlowUIService;