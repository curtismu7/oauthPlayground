/**
 * @file designTokens.ts
 * @module v8/styles
 * @description Design System Tokens for V3 Architecture
 * @version 3.0.0
 *
 * Centralized design tokens to replace inline styles throughout the application.
 * This provides consistency, maintainability, and easy theming support.
 *
 * Based on Tailwind CSS color palette and spacing system for familiarity.
 */

// ============================================================================
// COLOR TOKENS
// ============================================================================

export const colors = {
	// Primary Colors (Blue)
	primary: {
		50: '#eff6ff',
		100: '#dbeafe',
		200: '#bfdbfe',
		300: '#93c5fd',
		400: '#60a5fa',
		500: '#3b82f6', // Main primary color
		600: '#2563eb',
		700: '#1d4ed8',
		800: '#1e40af',
		900: '#1e3a8a',
	},

	// Success Colors (Green)
	success: {
		50: '#f0fdf4',
		100: '#dcfce7',
		200: '#bbf7d0',
		300: '#86efac',
		400: '#4ade80',
		500: '#10b981', // Main success color
		600: '#059669',
		700: '#047857',
		800: '#065f46',
		900: '#064e3b',
	},

	// Warning Colors (Amber)
	warning: {
		50: '#fffbeb',
		100: '#fef3c7',
		200: '#fde68a',
		300: '#fcd34d',
		400: '#fbbf24',
		500: '#f59e0b', // Main warning color
		600: '#d97706',
		700: '#b45309',
		800: '#92400e',
		900: '#78350f',
	},

	// Error/Danger Colors (Red)
	error: {
		50: '#fef2f2',
		100: '#fee2e2',
		200: '#fecaca',
		300: '#fca5a5',
		400: '#f87171',
		500: '#ef4444',
		600: '#dc2626', // Main error color
		700: '#b91c1c',
		800: '#991b1b',
		900: '#7f1d1d',
	},

	// Info Colors (Cyan)
	info: {
		50: '#ecfeff',
		100: '#cffafe',
		200: '#a5f3fc',
		300: '#67e8f9',
		400: '#22d3ee',
		500: '#06b6d4', // Main info color
		600: '#0891b2',
		700: '#0e7490',
		800: '#155e75',
		900: '#164e63',
	},

	// Purple (for policies, special features)
	purple: {
		50: '#faf5ff',
		100: '#f3e8ff',
		200: '#e9d5ff',
		300: '#d8b4fe',
		400: '#c084fc',
		500: '#a855f7',
		600: '#8b5cf6', // Main purple color
		700: '#7c3aed',
		800: '#6d28d9',
		900: '#5b21b6',
	},

	// Neutral/Gray Colors
	gray: {
		50: '#f9fafb',
		100: '#f3f4f6',
		200: '#e5e7eb',
		300: '#d1d5db',
		400: '#9ca3af',
		500: '#6b7280',
		600: '#4b5563',
		700: '#374151',
		800: '#1f2937',
		900: '#111827',
	},

	// Semantic Colors (shortcuts to commonly used colors)
	background: {
		primary: '#ffffff',
		secondary: '#f9fafb',
		tertiary: '#f3f4f6',
	},

	text: {
		primary: '#1f2937',
		secondary: '#4b5563',
		tertiary: '#6b7280',
		inverse: '#ffffff',
	},

	border: {
		light: '#e5e7eb',
		medium: '#d1d5db',
		dark: '#9ca3af',
	},
} as const;

// ============================================================================
// SPACING TOKENS
// ============================================================================

export const spacing = {
	0: '0',
	1: '4px',
	2: '8px',
	3: '12px',
	4: '16px',
	5: '20px',
	6: '24px',
	7: '28px',
	8: '32px',
	10: '40px',
	12: '48px',
	16: '64px',
	20: '80px',
	24: '96px',
} as const;

// ============================================================================
// TYPOGRAPHY TOKENS
// ============================================================================

export const typography = {
	fontFamily: {
		sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
		mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
	},

	fontSize: {
		xs: '12px',
		sm: '13px',
		base: '14px',
		md: '15px',
		lg: '16px',
		xl: '18px',
		'2xl': '20px',
		'3xl': '24px',
		'4xl': '32px',
	},

	fontWeight: {
		normal: '400',
		medium: '500',
		semibold: '600',
		bold: '700',
	},

	lineHeight: {
		tight: '1.25',
		normal: '1.5',
		relaxed: '1.75',
	},
} as const;

// ============================================================================
// BORDER RADIUS TOKENS
// ============================================================================

export const borderRadius = {
	none: '0',
	sm: '4px',
	base: '6px',
	md: '8px',
	lg: '12px',
	xl: '16px',
	full: '9999px',
} as const;

// ============================================================================
// SHADOW TOKENS
// ============================================================================

export const shadows = {
	none: 'none',
	sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
	base: '0 1px 3px rgba(0, 0, 0, 0.1)',
	md: '0 4px 6px rgba(0, 0, 0, 0.1)',
	lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
	xl: '0 20px 25px rgba(0, 0, 0, 0.1)',
	focus: '0 0 0 3px rgba(59, 130, 246, 0.3)', // Primary color focus ring
	focusSuccess: '0 0 0 3px rgba(16, 185, 129, 0.3)',
	focusWarning: '0 0 0 3px rgba(245, 158, 11, 0.3)',
	focusError: '0 0 0 3px rgba(220, 38, 38, 0.3)',
} as const;

// ============================================================================
// TRANSITION TOKENS
// ============================================================================

export const transitions = {
	fast: 'all 0.15s ease',
	base: 'all 0.2s ease',
	slow: 'all 0.3s ease',
} as const;

// ============================================================================
// Z-INDEX TOKENS
// ============================================================================

export const zIndex = {
	base: 0,
	dropdown: 1000,
	sticky: 1020,
	fixed: 1030,
	modalBackdrop: 1040,
	modal: 1050,
	popover: 1060,
	tooltip: 1070,
} as const;

// ============================================================================
// COMPONENT-SPECIFIC TOKENS
// ============================================================================

export const components = {
	button: {
		padding: {
			sm: `${spacing[2]} ${spacing[3]}`,
			base: `${spacing[2]} ${spacing[4]}`,
			lg: `${spacing[3]} ${spacing[5]}`,
		},
		borderRadius: borderRadius.base,
		fontSize: {
			sm: typography.fontSize.sm,
			base: typography.fontSize.base,
			lg: typography.fontSize.md,
		},
		fontWeight: typography.fontWeight.medium,
	},

	input: {
		padding: `${spacing[2]} ${spacing[3]}`,
		borderRadius: borderRadius.base,
		fontSize: typography.fontSize.base,
		border: `1px solid ${colors.border.medium}`,
	},

	card: {
		padding: spacing[6],
		borderRadius: borderRadius.md,
		shadow: shadows.base,
		border: `1px solid ${colors.border.light}`,
		background: colors.background.primary,
	},

	section: {
		marginBottom: spacing[6],
	},
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get color with optional opacity
 */
export const getColor = (color: string, opacity?: number): string => {
	if (opacity !== undefined && opacity < 1) {
		// Convert hex to rgba
		const hex = color.replace('#', '');
		const r = parseInt(hex.substring(0, 2), 16);
		const g = parseInt(hex.substring(2, 4), 16);
		const b = parseInt(hex.substring(4, 6), 16);
		return `rgba(${r}, ${g}, ${b}, ${opacity})`;
	}
	return color;
};

/**
 * Create focus ring style
 */
export const focusRing = (color: keyof typeof shadows = 'focus') => ({
	outline: 'none',
	boxShadow: shadows[color],
});

/**
 * Create hover state
 */
export const hoverState = (property: string, value: string) => ({
	transition: transitions.base,
	[`&:hover`]: {
		[property]: value,
	},
});

// ============================================================================
// EXPORT ALL TOKENS
// ============================================================================

export const designTokens = {
	colors,
	spacing,
	typography,
	borderRadius,
	shadows,
	transitions,
	zIndex,
	components,
} as const;

export default designTokens;
