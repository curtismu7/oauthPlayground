// src/services/unifiedFlowLayoutService.ts
/**
 * Unified Flow Layout Service - V8 Architecture
 *
 * Combines the best of V5 and V6 approaches:
 * - Theme-centric design from V6FlowLayoutService
 * - Comprehensive styling methods from FlowLayoutService
 * - Backward compatibility for legacy flows
 * - Type-safe theme system
 * - Modular component factory pattern
 *
 * This service unifies the layout architecture while maintaining
 * compatibility with existing V5, V6, and V7 flows.
 */

import styled from 'styled-components';

// Theme system from V6FlowLayoutService
export type ThemeColor = 'blue' | 'green' | 'purple' | 'red' | 'orange' | 'teal';

export interface ThemeConfig {
	primary: string;
	primaryDark: string;
	primaryLight: string;
	primaryLighter: string;
	text: string;
	textLight: string;
}

// Extended theme interface for V5 compatibility
export interface ExtendedThemeConfig extends ThemeConfig {
	secondary: string;
	secondaryHover: string;
	background: string;
	border: string;
}

const THEME_COLORS: Record<ThemeColor, ExtendedThemeConfig> = {
	blue: {
		primary: '#3b82f6',
		primaryDark: '#2563eb',
		primaryLight: '#60a5fa',
		primaryLighter: '#bfdbfe',
		text: '#1e40af',
		textLight: '#3b82f6',
		secondary: '#60a5fa',
		secondaryHover: '#3b82f6',
		background: 'rgba(59, 130, 246, 0.2)',
		border: '#3b82f6',
	},
	green: {
		primary: '#16a34a',
		primaryDark: '#15803d',
		primaryLight: '#4ade80',
		primaryLighter: '#bbf7d0',
		text: '#14532d',
		textLight: '#16a34a',
		secondary: '#22c55e',
		secondaryHover: '#16a34a',
		background: 'rgba(22, 163, 74, 0.2)',
		border: '#4ade80',
	},
	purple: {
		primary: '#9333ea',
		primaryDark: '#7e22ce',
		primaryLight: '#a855f7',
		primaryLighter: '#d8b4fe',
		text: '#581c87',
		textLight: '#9333ea',
		secondary: '#a855f7',
		secondaryHover: '#9333ea',
		background: 'rgba(139, 92, 246, 0.2)',
		border: '#8b5cf6',
	},
	red: {
		primary: '#dc2626',
		primaryDark: '#b91c1c',
		primaryLight: '#f87171',
		primaryLighter: '#fecaca',
		text: '#991b1b',
		textLight: '#dc2626',
		secondary: '#f87171',
		secondaryHover: '#dc2626',
		background: 'rgba(239, 68, 68, 0.2)',
		border: '#ef4444',
	},
	orange: {
		primary: '#f97316',
		primaryDark: '#ea580c',
		primaryLight: '#fb923c',
		primaryLighter: '#fed7aa',
		text: '#9a3412',
		textLight: '#f97316',
		secondary: '#fb923c',
		secondaryHover: '#f97316',
		background: 'rgba(249, 115, 22, 0.2)',
		border: '#fb923c',
	},
	teal: {
		primary: '#14b8a6',
		primaryDark: '#0d9488',
		primaryLight: '#2dd4bf',
		primaryLighter: '#99f6e4',
		text: '#115e59',
		textLight: '#14b8a6',
		secondary: '#2dd4bf',
		secondaryHover: '#14b8a6',
		background: 'rgba(20, 184, 166, 0.2)',
		border: '#2dd4bf',
	},
};

/**
 * Unified Flow Layout Service
 * Combines V5 comprehensive styling with V6 theme architecture
 */
export class UnifiedFlowLayoutService {
	// ==========================================
	// V6 THEME SYSTEM (PRIMARY INTERFACE)
	// ==========================================

	/**
	 * Get theme configuration (V6 approach)
	 */
	static getTheme(color: ThemeColor = 'blue'): ThemeConfig {
		return THEME_COLORS[color];
	}

	/**
	 * Get extended theme configuration (V5 compatibility)
	 */
	static getExtendedTheme(color: ThemeColor = 'blue'): ExtendedThemeConfig {
		return THEME_COLORS[color];
	}

	// ==========================================
	// COMPONENT FACTORIES (V6 APPROACH)
	// ==========================================

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
	 * Create step header with theme
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
	 * Create collapsible section
	 */
	static createCollapsibleSection() {
		return styled.section`
			border: 1px solid #e2e8f0;
			border-radius: 0.75rem;
			margin-bottom: 1.5rem;
			background-color: #ffffff;
			box-shadow: 0 10px 20px rgba(15, 23, 42, 0.05);
		`;
	}

	/**
	 * Create collapsible header button with theme
	 */
	static createCollapsibleHeaderButton(theme: ThemeColor = 'blue') {
		const colors = THEME_COLORS[theme];
		return styled.button<{ $collapsed?: boolean }>`
			display: flex;
			align-items: center;
			justify-content: space-between;
			width: 100%;
			padding: 1.25rem 1.5rem;
			background: linear-gradient(135deg, ${colors.primaryLighter}20 0%, ${colors.primaryLighter}30 100%);
			border: none;
			border-radius: 0.75rem;
			cursor: pointer;
			font-size: 1.1rem;
			font-weight: 600;
			color: ${colors.text};
			transition: background 0.2s ease;

			&:hover {
				background: linear-gradient(135deg, ${colors.primaryLighter}30 0%, ${colors.primaryLighter}40 100%);
			}

			&:focus {
				outline: 2px solid ${colors.primary};
				outline-offset: 2px;
			}
		`;
	}

	/**
	 * Create collapsible content
	 */
	static createCollapsibleContent() {
		return styled.div`
			padding: 1.5rem;
			border-top: 1px solid #e2e8f0;
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
	 * Create parameter label with theme
	 */
	static createParameterLabel(theme: ThemeColor = 'blue') {
		const colors = THEME_COLORS[theme];
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
	 * Create parameter value with theme
	 */
	static createParameterValue(theme: ThemeColor = 'blue') {
		const colors = THEME_COLORS[theme];
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
	 * Create generated content box with theme
	 */
	static createGeneratedContentBox(theme: ThemeColor = 'blue') {
		const colors = THEME_COLORS[theme];
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
	 * Create generated label with theme
	 */
	static createGeneratedLabel(theme: ThemeColor = 'blue') {
		const colors = THEME_COLORS[theme];
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

	// ==========================================
	// V5-STYLE INDIVIDUAL METHODS (BACKWARD COMPATIBILITY)
	// ==========================================

	/**
	 * Get container styles (V5 compatibility)
	 */
	static getContainerStyles() {
		return styled.div`
			min-height: 100vh;
			background-color: #f9fafb;
			padding: 2rem 0 6rem;
		`;
	}

	/**
	 * Get content wrapper styles (V5 compatibility)
	 */
	static getContentWrapperStyles() {
		return styled.div`
			max-width: 64rem;
			margin: 0 auto;
			padding: 0 1rem;
		`;
	}

	/**
	 * Get main card styles (V5 compatibility)
	 */
	static getMainCardStyles() {
		return styled.div`
			background-color: #ffffff;
			border-radius: 1rem;
			box-shadow: 0 20px 40px rgba(15, 23, 42, 0.1);
			border: 1px solid #e2e8f0;
			overflow: hidden;
		`;
	}

	/**
	 * Get step header styles with theme parameter (V5 compatibility)
	 */
	static getStepHeaderStyles(theme: string) {
		const gradients = {
			green: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
			orange: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
			blue: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
			purple: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
			red: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
		};

		return styled.div`
			background: ${gradients[theme as keyof typeof gradients] || gradients.green};
			color: #ffffff;
			padding: 2rem;
			display: flex;
			align-items: center;
			justify-content: space-between;
		`;
	}

	/**
	 * Get step header left styles (V5 compatibility)
	 */
	static getStepHeaderLeftStyles() {
		return styled.div`
			display: flex;
			flex-direction: column;
			gap: 0.5rem;
		`;
	}

	/**
	 * Get step header right styles (V5 compatibility)
	 */
	static getStepHeaderRightStyles() {
		return styled.div`
			text-align: right;
		`;
	}

	/**
	 * Get version badge styles with theme (V5 compatibility)
	 */
	static getVersionBadgeStyles(theme: string) {
		const themeColors = {
			green: {
				background: 'rgba(22, 163, 74, 0.2)',
				border: '#4ade80',
				color: '#bbf7d0',
			},
			orange: {
				background: 'rgba(249, 115, 22, 0.2)',
				border: '#fb923c',
				color: '#fed7aa',
			},
			blue: {
				background: 'rgba(59, 130, 246, 0.2)',
				border: '#3b82f6',
				color: '#dbeafe',
			},
			purple: {
				background: 'rgba(139, 92, 246, 0.2)',
				border: '#8b5cf6',
				color: '#ede9fe',
			},
			red: {
				background: 'rgba(239, 68, 68, 0.2)',
				border: '#ef4444',
				color: '#fecaca',
			},
		};

		const colors = themeColors[theme as keyof typeof themeColors] || themeColors.green;

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

	/**
	 * Get step header title styles (V5 compatibility)
	 */
	static getStepHeaderTitleStyles() {
		return styled.h2`
			font-size: 2rem;
			font-weight: 700;
			margin: 0;
		`;
	}

	/**
	 * Get step header subtitle styles (V5 compatibility)
	 */
	static getStepHeaderSubtitleStyles() {
		return styled.p`
			font-size: 1rem;
			color: rgba(255, 255, 255, 0.85);
			margin: 0;
		`;
	}

	/**
	 * Get step number styles (V5 compatibility)
	 */
	static getStepNumberStyles() {
		return styled.div`
			font-size: 2.5rem;
			font-weight: 700;
			line-height: 1;
		`;
	}

	/**
	 * Get step total styles (V5 compatibility)
	 */
	static getStepTotalStyles() {
		return styled.div`
			font-size: 0.875rem;
			color: rgba(255, 255, 255, 0.75);
			letter-spacing: 0.05em;
		`;
	}

	/**
	 * Get step content wrapper styles (V5 compatibility)
	 */
	static getStepContentWrapperStyles() {
		return styled.div`
			padding: 2rem;
			background: #ffffff;
		`;
	}

	/**
	 * Get collapsible section styles (V5 compatibility)
	 */
	static getCollapsibleSectionStyles() {
		return styled.section`
			border: 1px solid #e2e8f0;
			border-radius: 0.75rem;
			margin-bottom: 1.5rem;
			background-color: #ffffff;
			box-shadow: 0 10px 20px rgba(15, 23, 42, 0.05);
		`;
	}

	/**
	 * Get collapsible header button styles (V5 compatibility)
	 */
	static getCollapsibleHeaderButtonStyles(theme: string) {
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

		const colors = themeColors[theme as keyof typeof themeColors] || themeColors.green;

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

	/**
	 * Get collapsible content styles (V5 compatibility)
	 */
	static getCollapsibleContentStyles() {
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

	// ==========================================
	// UTILITY METHODS
	// ==========================================

	/**
	 * Get theme colors (V5 compatibility)
	 */
	static getThemeColors(theme: string): ExtendedThemeConfig {
		const themeMap: Record<string, ThemeColor> = {
			'green': 'green',
			'orange': 'orange',
			'blue': 'blue',
			'purple': 'purple',
			'red': 'red',
			'teal': 'teal',
		};

		const mappedTheme = themeMap[theme] || 'blue';
		return THEME_COLORS[mappedTheme];
	}

	/**
	 * Get flow layout config (V5 compatibility)
	 */
	static getFlowLayoutConfig(flowType: string): any {
		const configs: Record<string, any> = {
			implicit: {
				flowType: 'implicit',
				theme: 'orange',
				stepCount: 5,
				hasPkce: false,
				hasTokenExchange: false,
				hasUserInfo: false,
			},
			'authorization-code': {
				flowType: 'authorization-code',
				theme: 'green',
				stepCount: 7,
				hasPkce: true,
				hasTokenExchange: true,
				hasUserInfo: false,
			},
			'client-credentials': {
				flowType: 'client-credentials',
				theme: 'green',
				stepCount: 4,
				hasPkce: false,
				hasTokenExchange: false,
				hasUserInfo: false,
			},
			'device-authorization': {
				flowType: 'device-authorization',
				theme: 'purple',
				stepCount: 6,
				hasPkce: false,
				hasTokenExchange: true,
				hasUserInfo: false,
			},
			'resource-owner-password': {
				flowType: 'resource-owner-password',
				theme: 'red',
				stepCount: 4,
				hasPkce: false,
				hasTokenExchange: false,
				hasUserInfo: false,
			},
			'jwt-bearer': {
				flowType: 'jwt-bearer',
				theme: 'blue',
				stepCount: 4,
				hasPkce: false,
				hasTokenExchange: false,
				hasUserInfo: false,
			},
		};

		return configs[flowType] || {
			flowType,
			theme: 'blue',
			stepCount: 4,
			hasPkce: false,
			hasTokenExchange: false,
			hasUserInfo: false,
		};
	}

	// ==========================================
	// FACTORY METHODS FOR COMPLETE COMPONENTS
	// ==========================================

	/**
	 * Create flow layout components (V6 approach)
	 */
	static createFlowLayout(theme: ThemeColor = 'blue') {
		return {
			Container: UnifiedFlowLayoutService.createContainer(),
			ContentWrapper: UnifiedFlowLayoutService.createContentWrapper(),
			MainCard: UnifiedFlowLayoutService.createMainCard(),
			StepHeader: UnifiedFlowLayoutService.createStepHeader(theme),
			StepHeaderLeft: UnifiedFlowLayoutService.createStepHeaderLeft(),
			VersionBadge: UnifiedFlowLayoutService.createVersionBadge(theme),
			StepHeaderTitle: UnifiedFlowLayoutService.createStepHeaderTitle(),
			StepHeaderSubtitle: UnifiedFlowLayoutService.createStepHeaderSubtitle(),
			StepHeaderRight: UnifiedFlowLayoutService.createStepHeaderRight(),
			StepNumber: UnifiedFlowLayoutService.createStepNumber(),
			StepTotal: UnifiedFlowLayoutService.createStepTotal(),
			StepContentWrapper: UnifiedFlowLayoutService.createStepContentWrapper(),
			RequirementsIndicator: UnifiedFlowLayoutService.createRequirementsIndicator(),
			RequirementsIcon: UnifiedFlowLayoutService.createRequirementsIcon(),
			RequirementsText: UnifiedFlowLayoutService.createRequirementsText(),
			theme: UnifiedFlowLayoutService.getTheme(theme),
		};
	}

	/**
	 * Create collapsible components (V6 approach)
	 */
	static createCollapsibleComponents(theme: ThemeColor = 'blue') {
		return {
			CollapsibleSection: UnifiedFlowLayoutService.createCollapsibleSection(),
			CollapsibleHeaderButton: UnifiedFlowLayoutService.createCollapsibleHeaderButton(theme),
			CollapsibleTitle: UnifiedFlowLayoutService.createCollapsibleTitle(),
			CollapsibleToggleIcon: UnifiedFlowLayoutService.createCollapsibleToggleIcon(theme),
			CollapsibleContent: UnifiedFlowLayoutService.createCollapsibleContent(),
		};
	}

	/**
	 * Create parameter display components (V6 approach)
	 */
	static createParameterComponents(theme: ThemeColor = 'blue') {
		return {
			ParameterGrid: UnifiedFlowLayoutService.createParameterGrid(),
			ParameterLabel: UnifiedFlowLayoutService.createParameterLabel(theme),
			ParameterValue: UnifiedFlowLayoutService.createParameterValue(theme),
			GeneratedContentBox: UnifiedFlowLayoutService.createGeneratedContentBox(theme),
			GeneratedLabel: UnifiedFlowLayoutService.createGeneratedLabel(theme),
		};
	}

	// ==========================================
	// MISSING V5 METHODS (ADD BACK FOR COMPATIBILITY)
	// ==========================================

	static createStepHeaderLeft() {
		return styled.div`
			display: flex;
			flex-direction: column;
			gap: 0.5rem;
		`;
	}

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

	static createStepHeaderTitle() {
		return styled.h2`
			font-size: 2rem;
			font-weight: 700;
			margin: 0;
		`;
	}

	static createStepHeaderSubtitle() {
		return styled.p`
			font-size: 1rem;
			color: rgba(255, 255, 255, 0.85);
			margin: 0;
		`;
	}

	static createStepHeaderRight() {
		return styled.div`
			text-align: right;
		`;
	}

	static createStepNumber() {
		return styled.div`
			font-size: 2.5rem;
			font-weight: 700;
			line-height: 1;
		`;
	}

	static createStepTotal() {
		return styled.div`
			font-size: 0.875rem;
			color: rgba(255, 255, 255, 0.75);
			letter-spacing: 0.05em;
		`;
	}

	static createStepContentWrapper() {
		return styled.div`
			padding: 2rem;
			background: #ffffff;
		`;
	}

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

	static createRequirementsIcon() {
		return styled.div`
			color: #d97706;
			font-size: 1.25rem;
			margin-top: 0.125rem;
			flex-shrink: 0;
		`;
	}

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

	static createCollapsibleTitle() {
		return styled.span`
			display: flex;
			align-items: center;
			gap: 0.75rem;
		`;
	}

	static createCollapsibleToggleIcon(theme: ThemeColor = 'blue') {
		const colors = THEME_COLORS[theme];
		return styled.span<{ $collapsed?: boolean }>`
			display: inline-flex;
			align-items: center;
			justify-content: center;
			width: 32px;
			height: 32px;
			border-radius: 50%;
			background: ${colors.primary};
			color: white;
			transition: transform 0.2s ease;
			transform: ${({ $collapsed }) => ($collapsed ? 'rotate(-90deg)' : 'rotate(0deg)')};

			svg {
				width: 16px;
				height: 16px;
			}

			&:hover {
				transform: ${({ $collapsed }) =>
					$collapsed ? 'rotate(-90deg) scale(1.1)' : 'rotate(0deg) scale(1.1)'};
			}
		`;
	}
}

// ==========================================
// BACKWARD COMPATIBILITY ALIASES
// ==========================================

/**
 * V6FlowLayoutService alias for backward compatibility
 */
export const V6FlowLayoutService = UnifiedFlowLayoutService;

/**
 * FlowLayoutService alias for backward compatibility
 */
export const FlowLayoutService = UnifiedFlowLayoutService;

export default UnifiedFlowLayoutService;
