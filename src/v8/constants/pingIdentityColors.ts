/**
 * Ping Identity Brand Colors
 * Based on Ping Identity brand guidelines
 */

export const PING_IDENTITY_COLORS = {
	// Primary Brand Colors
	primary: {
		50: '#eff6ff', // Lightest blue
		100: '#dbeafe', // Very light blue
		200: '#bfdbfe', // Light blue
		300: '#93c5fd', // Medium light blue
		400: '#60a5fa', // Medium blue
		500: '#3b82f6', // Primary blue (current app primary)
		600: '#2563eb', // Medium dark blue
		700: '#1d4ed8', // Dark blue
		800: '#1e40af', // Very dark blue
		900: '#1e3a8a', // Darkest blue
	},

	// Secondary/Accent Colors
	accent: {
		pingRed: {
			50: '#fef2f2',
			100: '#fee2e2',
			200: '#fecaca',
			300: '#fca5a5',
			400: '#f87171', // Medium red
			500: '#ef4444', // Primary Ping red
			600: '#dc2626',
			700: '#b91c1c',
			800: '#991b1b',
			900: '#7f1d1d',
		},
		orange: {
			50: '#fff7ed',
			100: '#fed7aa',
			200: '#fdba74',
			300: '#fb923c',
			400: '#f97316', // Primary orange
			500: '#ea580c',
			600: '#dc2626',
			700: '#b91c1c',
			800: '#991b1b',
			900: '#7f1d1d',
		},
		green: {
			50: '#f0fdf4',
			100: '#dcfce7',
			200: '#bbf7d0',
			300: '#86efac',
			400: '#4ade80',
			500: '#22c55e', // Success green
			600: '#16a34a',
			700: '#15803d',
			800: '#166534',
			900: '#14532d',
		},
	},

	// Neutral/Gray Colors
	neutral: {
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

	// Semantic Colors
	semantic: {
		success: '#22c55e',
		warning: '#f97316',
		error: '#ef4444',
		info: '#3b82f6',
	},

	// Gradients
	gradients: {
		primary: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
		primaryDark: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
		pingRed: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
		accent: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
		success: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
		rainbow: 'linear-gradient(90deg, #3b82f6, #ef4444, #06b6d4, #10b981)',
	},

	// Shadows
	shadows: {
		primary: '0 4px 12px rgba(59, 130, 246, 0.15)',
		pingRed: '0 4px 12px rgba(239, 68, 68, 0.15)',
		accent: '0 4px 12px rgba(249, 115, 22, 0.15)',
		success: '0 4px 12px rgba(34, 197, 94, 0.15)',
	},
} as const;

// Common color combinations for UI elements
export const PING_IDENTITY_UI = {
	// Header/Navigation
	header: {
		background: PING_IDENTITY_COLORS.primary[600],
		text: '#ffffff',
		border: PING_IDENTITY_COLORS.primary[700],
	},

	// Primary Actions
	primaryButton: {
		background: PING_IDENTITY_COLORS.primary[500],
		text: '#ffffff',
		border: PING_IDENTITY_COLORS.primary[600],
		hover: PING_IDENTITY_COLORS.primary[600],
	},

	// Secondary Actions
	secondaryButton: {
		background: PING_IDENTITY_COLORS.neutral[100],
		text: PING_IDENTITY_COLORS.neutral[700],
		border: PING_IDENTITY_COLORS.neutral[300],
		hover: PING_IDENTITY_COLORS.neutral[200],
	},

	// Accent Actions
	accentButton: {
		background: PING_IDENTITY_COLORS.accent.orange[400],
		text: '#ffffff',
		border: PING_IDENTITY_COLORS.accent.orange[500],
		hover: PING_IDENTITY_COLORS.accent.orange[500],
	},

	// Ping Red Actions (for emphasis/branding)
	pingRedButton: {
		background: PING_IDENTITY_COLORS.accent.pingRed[500],
		text: '#ffffff',
		border: PING_IDENTITY_COLORS.accent.pingRed[600],
		hover: PING_IDENTITY_COLORS.accent.pingRed[600],
	},

	// Cards/Panels
	card: {
		background: '#ffffff',
		border: PING_IDENTITY_COLORS.neutral[200],
		shadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
	},

	// Form Elements
	input: {
		background: '#ffffff',
		border: PING_IDENTITY_COLORS.neutral[300],
		text: PING_IDENTITY_COLORS.neutral[900],
		focus: PING_IDENTITY_COLORS.primary[500],
		focusShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
	},

	// Status Indicators
	status: {
		success: {
			background: PING_IDENTITY_COLORS.semantic.success,
			text: '#ffffff',
		},
		warning: {
			background: PING_IDENTITY_COLORS.semantic.warning,
			text: '#ffffff',
		},
		error: {
			background: PING_IDENTITY_COLORS.semantic.error,
			text: '#ffffff',
		},
		info: {
			background: PING_IDENTITY_COLORS.semantic.info,
			text: '#ffffff',
		},
	},
} as const;
