/**
 * @file fedex.theme.ts
 * @module protect-portal/themes
 * @description FedEx brand theme configuration
 * @version 9.6.5
 * @since 2026-02-10
 *
 * FedEx brand theme with purple and orange colors, professional logistics styling.
 */

import type { BrandTheme } from './brand-theme.interface';

export const fedexTheme: BrandTheme = {
	name: 'fedex',
	displayName: 'FedEx',
	portalName: 'FedEx Employee Portal',
	logo: {
		url: 'https://www.fedex.com/favicon.ico',
		alt: 'FedEx Logo',
		width: '140px',
		height: '60px',
		text: 'FedEx',
		colors: {
			fed: '#4D148C',
			ex: '#FF6600',
		},
	},
	colors: {
		primary: '#4D148C', // FedEx Purple (official brand color)
		secondary: '#FFFFFF', // White
		accent: '#FF6600', // FedEx Orange (official accent color)
		background: '#FFFFFF', // Changed to solid white for Protect app
		surface: '#FFFFFF',
		text: '#1F2937',
		textSecondary: '#6B7280',
		error: '#DC2626',
		success: '#059669',
		warning: '#FF6600', // Use FedEx Orange for warnings
		info: '#4D148C', // Use FedEx Purple for info
		// Additional theme colors with official FedEx palette
		primaryLight: '#6B1E8E',
		primaryDark: '#3E0F70',
		secondaryLight: '#F8F9FA',
		secondaryDark: '#E9ECEF',
		errorLight: '#FEE2E2',
		warningLight: '#FEF3C7',
		successLight: '#D1FAE5',
	},
	typography: {
		fontFamily: '"FedSans", "Helvetica Neue", Arial, sans-serif',
		headingFont: '"FedSans", "Helvetica Neue", Arial, sans-serif',
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
		sm: '0 1px 2px 0 rgba(77, 20, 140, 0.05)',
		md: '0 4px 6px -1px rgba(77, 20, 140, 0.1), 0 2px 4px -1px rgba(77, 20, 140, 0.06)',
		lg: '0 10px 15px -3px rgba(77, 20, 140, 0.1), 0 4px 6px -2px rgba(77, 20, 140, 0.05)',
		xl: '0 20px 25px -5px rgba(77, 20, 140, 0.1), 0 10px 10px -5px rgba(77, 20, 140, 0.04)',
	},
	brandSpecific: {
		logo: '📦',
		logoUrl: 'https://www.fedex.com/favicon.ico',
		iconSet: ['📦', '🚚', '✈️', '📬', '🚁'],
		messaging: {
			welcome: 'Welcome to FedEx Secure Portal',
			security: 'Your shipment security is our priority',
			success: 'Delivery confirmed successfully',
			error: 'Unable to process your request',
		},
		animations: {
			loading: 'spin 1s linear infinite',
			transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
		},
	},
};
