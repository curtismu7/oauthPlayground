/**
 * @file tokens.ts
 * @module v8/design
 * @description Design tokens for consistent styling across MFA V8 components
 * @version 9.1.0
 */

export const spacing = {
	xs: '4px',
	sm: '8px',
	md: '16px',
	lg: '24px',
	xl: '32px',
	'2xl': '48px',
	'3xl': '64px',
} as const;

export const colors = {
	// Primary
	primary: {
		50: '#eff6ff',
		100: '#dbeafe',
		200: '#bfdbfe',
		300: '#93c5fd',
		400: '#60a5fa',
		500: '#3b82f6',
		600: '#2563eb',
		700: '#1d4ed8',
		800: '#1e40af',
		900: '#1e3a8a',
	},
	// Success
	success: {
		50: '#f0fdf4',
		100: '#dcfce7',
		200: '#bbf7d0',
		300: '#86efac',
		400: '#4ade80',
		500: '#10b981',
		600: '#059669',
		700: '#047857',
		800: '#065f46',
		900: '#064e3b',
	},
	// Error
	error: {
		50: '#fef2f2',
		100: '#fee2e2',
		200: '#fecaca',
		300: '#fca5a5',
		400: '#f87171',
		500: '#ef4444',
		600: '#dc2626',
		700: '#b91c1c',
		800: '#991b1b',
		900: '#7f1d1d',
	},
	// Warning
	warning: {
		50: '#fffbeb',
		100: '#fef3c7',
		200: '#fde68a',
		300: '#fcd34d',
		400: '#fbbf24',
		500: '#f59e0b',
		600: '#d97706',
		700: '#b45309',
		800: '#92400e',
		900: '#78350f',
	},
	// Neutral
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
} as const;

export const typography = {
	fontFamily: {
		sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
		mono: '"SF Mono", "Monaco", "Inconsolata", "Fira Code", monospace',
	},
	fontSize: {
		xs: '12px',
		sm: '14px',
		base: '16px',
		lg: '18px',
		xl: '20px',
		'2xl': '24px',
		'3xl': '30px',
		'4xl': '36px',
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

export const borderRadius = {
	none: '0',
	sm: '4px',
	md: '6px',
	lg: '8px',
	xl: '12px',
	'2xl': '16px',
	full: '9999px',
} as const;

export const shadows = {
	sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
	md: '0 1px 3px rgba(0, 0, 0, 0.1)',
	lg: '0 4px 6px rgba(0, 0, 0, 0.1)',
	xl: '0 10px 15px rgba(0, 0, 0, 0.1)',
	'2xl': '0 20px 25px rgba(0, 0, 0, 0.15)',
} as const;

export const transitions = {
	fast: '150ms',
	base: '200ms',
	slow: '300ms',
	slower: '500ms',
} as const;
