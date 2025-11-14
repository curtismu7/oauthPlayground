// src/services/flowThemeService.ts
// Flow-specific theming and color management for V5 flows

export interface FlowTheme {
	name: string;
	primary: string;
	primaryDark: string;
	primaryLight: string;
	accent: string;
	background: string;
	surface: string;
	text: string;
	textSecondary: string;
}

export interface ButtonColors {
	primary: string;
	primaryHover: string;
	secondary: string;
	secondaryHover: string;
	success: string;
	successHover: string;
	danger: string;
	dangerHover: string;
	outline: string;
	outlineHover: string;
}

export interface InfoBoxColors {
	info: string;
	infoBackground: string;
	warning: string;
	warningBackground: string;
	success: string;
	successBackground: string;
	danger: string;
	dangerBackground: string;
}

export interface CollapsibleColors {
	header: string;
	headerHover: string;
	title: string;
	icon: string;
	content: string;
}

export class FlowThemeService {
	// Theme definitions
	static getFlowTheme(flowType: string): FlowTheme {
		const themes: Record<string, FlowTheme> = {
			'authorization-code': {
				name: 'Authorization Code',
				primary: '#16a34a',
				primaryDark: '#15803d',
				primaryLight: '#22c55e',
				accent: '#4ade80',
				background: '#f9fafb',
				surface: '#ffffff',
				text: '#0f172a',
				textSecondary: '#64748b',
			},
			implicit: {
				name: 'Implicit',
				primary: '#f97316',
				primaryDark: '#ea580c',
				primaryLight: '#fb923c',
				accent: '#fdba74',
				background: '#f9fafb',
				surface: '#ffffff',
				text: '#0f172a',
				textSecondary: '#64748b',
			},
			'client-credentials': {
				name: 'Client Credentials',
				primary: '#3b82f6',
				primaryDark: '#2563eb',
				primaryLight: '#60a5fa',
				accent: '#93c5fd',
				background: '#f9fafb',
				surface: '#ffffff',
				text: '#0f172a',
				textSecondary: '#64748b',
			},
			'device-authorization': {
				name: 'Device Authorization',
				primary: '#7c3aed',
				primaryDark: '#6d28d9',
				primaryLight: '#a78bfa',
				accent: '#c4b5fd',
				background: '#f9fafb',
				surface: '#ffffff',
				text: '#0f172a',
				textSecondary: '#64748b',
			},
			'resource-owner-password': {
				name: 'Resource Owner Password',
				primary: '#ef4444',
				primaryDark: '#dc2626',
				primaryLight: '#f87171',
				accent: '#fca5a5',
				background: '#f9fafb',
				surface: '#ffffff',
				text: '#0f172a',
				textSecondary: '#64748b',
			},
			'jwt-bearer': {
				name: 'JWT Bearer',
				primary: '#059669',
				primaryDark: '#047857',
				primaryLight: '#10b981',
				accent: '#34d399',
				background: '#f9fafb',
				surface: '#ffffff',
				text: '#0f172a',
				textSecondary: '#64748b',
			},
			ciba: {
				name: 'CIBA',
				primary: '#7c2d12',
				primaryDark: '#92400e',
				primaryLight: '#ea580c',
				accent: '#fb923c',
				background: '#f9fafb',
				surface: '#ffffff',
				text: '#0f172a',
				textSecondary: '#64748b',
			},
			redirectless: {
				name: 'Redirectless',
				primary: '#be185d',
				primaryDark: '#9d174d',
				primaryLight: '#ec4899',
				accent: '#f9a8d4',
				background: '#f9fafb',
				surface: '#ffffff',
				text: '#0f172a',
				textSecondary: '#64748b',
			},
			hybrid: {
				name: 'Hybrid',
				primary: '#0891b2',
				primaryDark: '#0e7490',
				primaryLight: '#22d3ee',
				accent: '#67e8f9',
				background: '#f9fafb',
				surface: '#ffffff',
				text: '#0f172a',
				textSecondary: '#64748b',
			},
		};

		return themes[flowType] || themes['authorization-code'];
	}

	// Styled component themes
	static getStepHeaderGradient(theme: string): string {
		const gradients: Record<string, string> = {
			green: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
			orange: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
			blue: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
			purple: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
			red: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
			teal: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
			brown: 'linear-gradient(135deg, #7c2d12 0%, #92400e 100%)',
			pink: 'linear-gradient(135deg, #be185d 0%, #9d174d 100%)',
			cyan: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)',
		};

		return gradients[theme] || gradients.green;
	}

	static getButtonColors(theme: string): ButtonColors {
		const buttonColors: Record<string, ButtonColors> = {
			green: {
				primary: '#22c55e',
				primaryHover: '#16a34a',
				secondary: '#0ea5e9',
				secondaryHover: '#0284c7',
				success: '#16a34a',
				successHover: '#15803d',
				danger: '#ef4444',
				dangerHover: '#dc2626',
				outline: '#22c55e',
				outlineHover: '#16a34a',
			},
			orange: {
				primary: '#fb923c',
				primaryHover: '#f97316',
				secondary: '#0ea5e9',
				secondaryHover: '#0284c7',
				success: '#16a34a',
				successHover: '#15803d',
				danger: '#ef4444',
				dangerHover: '#dc2626',
				outline: '#fb923c',
				outlineHover: '#f97316',
			},
			blue: {
				primary: '#60a5fa',
				primaryHover: '#3b82f6',
				secondary: '#0ea5e9',
				secondaryHover: '#0284c7',
				success: '#16a34a',
				successHover: '#15803d',
				danger: '#ef4444',
				dangerHover: '#dc2626',
				outline: '#60a5fa',
				outlineHover: '#3b82f6',
			},
			purple: {
				primary: '#a78bfa',
				primaryHover: '#7c3aed',
				secondary: '#0ea5e9',
				secondaryHover: '#0284c7',
				success: '#16a34a',
				successHover: '#15803d',
				danger: '#ef4444',
				dangerHover: '#dc2626',
				outline: '#a78bfa',
				outlineHover: '#7c3aed',
			},
			red: {
				primary: '#f87171',
				primaryHover: '#ef4444',
				secondary: '#0ea5e9',
				secondaryHover: '#0284c7',
				success: '#16a34a',
				successHover: '#15803d',
				danger: '#ef4444',
				dangerHover: '#dc2626',
				outline: '#f87171',
				outlineHover: '#ef4444',
			},
		};

		return buttonColors[theme] || buttonColors.green;
	}

	static getInfoBoxColors(theme: string): InfoBoxColors {
		const infoBoxColors: Record<string, InfoBoxColors> = {
			green: {
				info: '#3b82f6',
				infoBackground: '#dbeafe',
				warning: '#f59e0b',
				warningBackground: '#fef3c7',
				success: '#16a34a',
				successBackground: '#dcfce7',
				danger: '#ef4444',
				dangerBackground: '#fee2e2',
			},
			orange: {
				info: '#3b82f6',
				infoBackground: '#dbeafe',
				warning: '#f59e0b',
				warningBackground: '#fef3c7',
				success: '#16a34a',
				successBackground: '#dcfce7',
				danger: '#ef4444',
				dangerBackground: '#fee2e2',
			},
			blue: {
				info: '#3b82f6',
				infoBackground: '#dbeafe',
				warning: '#f59e0b',
				warningBackground: '#fef3c7',
				success: '#16a34a',
				successBackground: '#dcfce7',
				danger: '#ef4444',
				dangerBackground: '#fee2e2',
			},
			purple: {
				info: '#3b82f6',
				infoBackground: '#dbeafe',
				warning: '#f59e0b',
				warningBackground: '#fef3c7',
				success: '#16a34a',
				successBackground: '#dcfce7',
				danger: '#ef4444',
				dangerBackground: '#fee2e2',
			},
			red: {
				info: '#3b82f6',
				infoBackground: '#dbeafe',
				warning: '#f59e0b',
				warningBackground: '#fef3c7',
				success: '#16a34a',
				successBackground: '#dcfce7',
				danger: '#ef4444',
				dangerBackground: '#fee2e2',
			},
		};

		return infoBoxColors[theme] || infoBoxColors.green;
	}

	static getCollapsibleColors(theme: string): CollapsibleColors {
		const collapsibleColors: Record<string, CollapsibleColors> = {
			green: {
				header: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf3 100%)',
				headerHover: 'linear-gradient(135deg, #dcfce7 0%, #ecfdf3 100%)',
				title: '#14532d',
				icon: '#3b82f6',
				content: '#ffffff',
			},
			orange: {
				header: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
				headerHover: 'linear-gradient(135deg, #fed7aa 0%, #ffedd5 100%)',
				title: '#9a3412',
				icon: '#3b82f6',
				content: '#ffffff',
			},
			blue: {
				header: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
				headerHover: 'linear-gradient(135deg, #bfdbfe 0%, #dbeafe 100%)',
				title: '#1e40af',
				icon: '#3b82f6',
				content: '#ffffff',
			},
			purple: {
				header: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
				headerHover: 'linear-gradient(135deg, #e9d5ff 0%, #f3e8ff 100%)',
				title: '#6b21a8',
				icon: '#3b82f6',
				content: '#ffffff',
			},
			red: {
				header: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
				headerHover: 'linear-gradient(135deg, #fecaca 0%, #fee2e2 100%)',
				title: '#991b1b',
				icon: '#3b82f6',
				content: '#ffffff',
			},
		};

		return collapsibleColors[theme] || collapsibleColors.green;
	}

	// Theme-specific styles
	static getThemeStyles(theme: string): Record<string, unknown> {
		const flowTheme = FlowThemeService.getFlowTheme(theme);
		const buttonColors = FlowThemeService.getButtonColors(theme);
		const infoBoxColors = FlowThemeService.getInfoBoxColors(theme);
		const collapsibleColors = FlowThemeService.getCollapsibleColors(theme);

		return {
			colors: {
				primary: flowTheme.primary,
				primaryDark: flowTheme.primaryDark,
				primaryLight: flowTheme.primaryLight,
				accent: flowTheme.accent,
				background: flowTheme.background,
				surface: flowTheme.surface,
				text: flowTheme.text,
				textSecondary: flowTheme.textSecondary,
			},
			buttons: buttonColors,
			infoBoxes: infoBoxColors,
			collapsible: collapsibleColors,
			gradients: {
				stepHeader: FlowThemeService.getStepHeaderGradient(theme),
			},
		};
	}

	// Available themes
	static getAvailableThemes(): string[] {
		return ['green', 'orange', 'blue', 'purple', 'red', 'teal', 'brown', 'pink', 'cyan'];
	}

	// Get theme for flow type
	static getThemeForFlowType(flowType: string): string {
		const themeMap: Record<string, string> = {
			'authorization-code': 'green',
			implicit: 'orange',
			'client-credentials': 'blue',
			'device-authorization': 'purple',
			'resource-owner-password': 'red',
			'jwt-bearer': 'teal',
			ciba: 'brown',
			redirectless: 'pink',
			hybrid: 'cyan',
		};

		return themeMap[flowType] || 'green';
	}

	// Get theme name for display
	static getThemeDisplayName(theme: string): string {
		const displayNames: Record<string, string> = {
			green: 'Green',
			orange: 'Orange',
			blue: 'Blue',
			purple: 'Purple',
			red: 'Red',
			teal: 'Teal',
			brown: 'Brown',
			pink: 'Pink',
			cyan: 'Cyan',
		};

		return displayNames[theme] || 'Green';
	}

	// Get theme description
	static getThemeDescription(theme: string): string {
		const descriptions: Record<string, string> = {
			green: 'Clean and professional, perfect for authorization flows',
			orange: 'Warm and energetic, ideal for implicit flows',
			blue: 'Trustworthy and reliable, great for client credentials',
			purple: 'Creative and innovative, perfect for device flows',
			red: 'Bold and attention-grabbing, ideal for password flows',
			teal: 'Modern and sophisticated, great for JWT flows',
			brown: 'Earthy and grounded, perfect for CIBA flows',
			pink: 'Playful and modern, ideal for redirectless flows',
			cyan: 'Fresh and dynamic, great for hybrid flows',
		};

		return descriptions[theme] || 'Clean and professional theme';
	}

	// Get theme CSS variables
	static getThemeCSSVariables(theme: string): Record<string, string> {
		const flowTheme = FlowThemeService.getFlowTheme(theme);

		return {
			'--flow-primary': flowTheme.primary,
			'--flow-primary-dark': flowTheme.primaryDark,
			'--flow-primary-light': flowTheme.primaryLight,
			'--flow-accent': flowTheme.accent,
			'--flow-background': flowTheme.background,
			'--flow-surface': flowTheme.surface,
			'--flow-text': flowTheme.text,
			'--flow-text-secondary': flowTheme.textSecondary,
		};
	}

	// Apply theme to document
	static applyThemeToDocument(theme: string): void {
		const cssVariables = FlowThemeService.getThemeCSSVariables(theme);
		const root = document.documentElement;

		Object.entries(cssVariables).forEach(([property, value]) => {
			root.style.setProperty(property, value);
		});
	}

	// Get theme contrast ratio
	static getThemeContrastRatio(theme: string): number {
		const contrastRatios: Record<string, number> = {
			green: 4.5,
			orange: 4.2,
			blue: 4.8,
			purple: 4.3,
			red: 4.1,
			teal: 4.6,
			brown: 4.4,
			pink: 4.0,
			cyan: 4.7,
		};

		return contrastRatios[theme] || 4.5;
	}

	// Check if theme meets accessibility standards
	static isThemeAccessible(theme: string): boolean {
		const contrastRatio = FlowThemeService.getThemeContrastRatio(theme);
		return contrastRatio >= 4.5; // WCAG AA standard
	}

	// Get theme recommendations
	static getThemeRecommendations(): Record<string, string[]> {
		return {
			'authorization-code': ['green', 'blue', 'teal'],
			implicit: ['orange', 'pink', 'cyan'],
			'client-credentials': ['blue', 'green', 'teal'],
			'device-authorization': ['purple', 'pink', 'cyan'],
			'resource-owner-password': ['red', 'orange', 'brown'],
			'jwt-bearer': ['teal', 'green', 'blue'],
			ciba: ['brown', 'orange', 'red'],
			redirectless: ['pink', 'purple', 'cyan'],
			hybrid: ['cyan', 'blue', 'teal'],
		};
	}
}
