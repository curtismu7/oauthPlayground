/**
 * @file united-airlines.theme.ts
 * @module protect-portal/themes
 * @description United Airlines brand theme configuration
 * @version 9.6.5
 * @since 2026-02-10
 *
 * United Airlines brand theme with blue and white colors, global aviation styling.
 */

import type { BrandTheme } from './brand-theme.interface';

export const unitedAirlinesTheme: BrandTheme = {
	name: 'united-airlines',
	displayName: 'United Airlines',
	portalName: 'United Airlines Employee Portal',
	logo: {
		url: 'https://www.united.com/content/dam/united/brand/united-logo.svg',
		alt: 'United Airlines Logo',
		width: '120px',
		height: '40px',
		text: 'United',
		colors: {
			united: '#0033A0',
		},
	},
	colors: {
		primary: '#0033A0', // United Blue (official brand color)
		primaryDark: '#002880', // Darker blue for hover states
		secondary: '#FFFFFF', // White
		accent: '#FF6600', // United Orange (official accent color)
		background: '#FFFFFF', // Changed to solid white for Protect app
		surface: '#FFFFFF',
		muted: '#6b7280', // Muted gray
		border: '#d1d5db', // Border gray
		text: '#1F2937',
		textSecondary: '#6B7280',
		error: '#DC2626',
		success: '#059669',
		warning: '#FF6600', // Use United Orange for warnings
		info: '#0033A0', // Use United Blue for info
		// Additional theme colors with official United Airlines palette
		primaryLight: '#0056B3',
		secondaryLight: '#F8F9FA',
		secondaryDark: '#E9ECEF',
		errorLight: '#FEE2E2',
		warningLight: '#FEF3C7',
		successLight: '#D1FAE5',
	},
	typography: {
		fontFamily: '"United", "Helvetica Neue", Arial, sans-serif',
		headingFont: '"United", "Helvetica Neue", Arial, sans-serif',
		bodyFont: '"Inter", system-ui, sans-serif',
		weights: {
			light: 300,
			normal: 400,
			medium: 500,
			bold: 700,
		},
		sizes: {
			xs: '0.75rem',
			sm: '0.875rem',
			md: '1rem',
			lg: '1.125rem',
			xl: '1.25rem',
			xxl: '1.5rem',
		},
	},
	spacing: {
		xs: '0.25rem',
		sm: '0.5rem',
		md: '1rem',
		lg: '1.5rem',
		xl: '2rem',
		xxl: '3rem',
	},
	borderRadius: {
		sm: '0.25rem',
		md: '0.5rem',
		lg: '0.75rem',
		xl: '1rem',
	},
	shadows: {
		sm: '0 1px 2px 0 rgba(0, 51, 160, 0.05)',
		md: '0 4px 6px -1px rgba(0, 51, 160, 0.1), 0 2px 4px -1px rgba(0, 51, 160, 0.06)',
		lg: '0 10px 15px -3px rgba(0, 51, 160, 0.1), 0 4px 6px -2px rgba(0, 51, 160, 0.05)',
		xl: '0 20px 25px -5px rgba(0, 51, 160, 0.1), 0 10px 10px -5px rgba(0, 51, 160, 0.04)',
	},
	brandSpecific: {
		logo: '✈️',
		logoUrl: 'https://www.united.com/favicon.ico',
		iconSet: ['✈️', '🌍', '🛫', '🎫', '🌐', '🏢'],
		messaging: {
			welcome: 'Welcome to United Airlines Secure Access',
			security: 'Connecting the world safely and securely',
			success: 'Your session has been established successfully',
			error: 'Unable to authenticate. Please try again.',
		},
		animations: {
			loading: 'spin 1s linear infinite',
			transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
		},
	},
};
