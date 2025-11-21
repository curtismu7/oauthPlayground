/**
 * Centralized Button Styling Utility
 * 
 * Consistent button styling pattern across the application:
 * - Default: Blue background (#3b82f6) with white text
 * - Next Action: Green background (#10b981) with white text
 * - Token (No Token): Red background (#ef4444) with white text
 * - Token (Has Token): Green background (#10b981) with white text
 * - Light Background: Background (#ffffff or light) with black text (#000000)
 * - Dark Background: Background (dark) with white text (#ffffff)
 */

export interface ButtonStyle {
	background: string;
	color: string;
	border?: string;
	hoverBackground?: string;
	hoverColor?: string;
}

/**
 * Button style variants
 */
export const BUTTON_STYLES = {
	// Default - Blue with white text
	default: {
		background: '#3b82f6',
		color: '#ffffff',
		hoverBackground: '#2563eb',
		hoverColor: '#ffffff',
	},
	// Next Action - Green with white text
	next: {
		background: '#10b981',
		color: '#ffffff',
		hoverBackground: '#059669',
		hoverColor: '#ffffff',
	},
	// Token - No token (Red with white text)
	tokenNone: {
		background: '#ef4444',
		color: '#ffffff',
		hoverBackground: '#dc2626',
		hoverColor: '#ffffff',
	},
	// Token - Has token (Green with white text)
	tokenHas: {
		background: '#10b981',
		color: '#ffffff',
		hoverBackground: '#059669',
		hoverColor: '#ffffff',
	},
	// Light background - Black text
	light: {
		background: '#ffffff',
		color: '#000000',
		border: '1px solid #d1d5db',
		hoverBackground: '#f9fafb',
		hoverColor: '#000000',
	},
	// Dark background - White text
	dark: {
		background: '#1f2937',
		color: '#ffffff',
		hoverBackground: '#374151',
		hoverColor: '#ffffff',
	},
} as const;

/**
 * Get button style based on variant
 */
export function getButtonStyle(variant: keyof typeof BUTTON_STYLES): ButtonStyle {
	return BUTTON_STYLES[variant];
}

/**
 * Get token button style based on token presence
 */
export function getTokenButtonStyle(hasToken: boolean): ButtonStyle {
	return hasToken ? BUTTON_STYLES.tokenHas : BUTTON_STYLES.tokenNone;
}

/**
 * Get button style for light background buttons
 */
export function getLightButtonStyle(): ButtonStyle {
	return BUTTON_STYLES.light;
}

/**
 * Get button style for dark background buttons
 */
export function getDarkButtonStyle(): ButtonStyle {
	return BUTTON_STYLES.dark;
}

/**
 * Generate inline styles object for React components
 */
export function getButtonInlineStyles(
	variant: keyof typeof BUTTON_STYLES | 'token' = 'default',
	hasToken?: boolean
): React.CSSProperties {
	let style: ButtonStyle;
	
	if (variant === 'token') {
		style = hasToken ? BUTTON_STYLES.tokenHas : BUTTON_STYLES.tokenNone;
	} else {
		style = BUTTON_STYLES[variant];
	}

	return {
		background: style.background,
		color: style.color,
		border: style.border || 'none',
		padding: '0.75rem 1.5rem',
		borderRadius: '0.5rem',
		fontSize: '0.875rem',
		fontWeight: '500',
		cursor: 'pointer',
		transition: 'all 0.2s ease',
	};
}

/**
 * Check if background is considered "dark" (needs white text)
 */
export function isDarkBackground(background: string): boolean {
	// Remove # and convert to RGB
	const hex = background.replace('#', '');
	const r = parseInt(hex.substr(0, 2), 16);
	const g = parseInt(hex.substr(2, 2), 16);
	const b = parseInt(hex.substr(4, 2), 16);
	
	// Calculate luminance
	const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
	
	// Dark if luminance < 0.5
	return luminance < 0.5;
}

/**
 * Get appropriate text color based on background
 */
export function getTextColorForBackground(background: string): string {
	return isDarkBackground(background) ? '#ffffff' : '#000000';
}

