/**
 * @file bank-of-america.theme.ts
 * @module protect-portal/themes
 * @description Bank of America brand theme with red, white, and blue colors, professional banking styling.
 * @version 9.6.5
 * @since 2026-02-11
 *
 * This theme implements the Bank of America corporate brand identity with
 * their signature red and blue colors, maintaining professional banking aesthetics.
 */

import type { BrandTheme } from './brand-theme.interface';

export const bankOfAmericaTheme: BrandTheme = {
	name: 'bank-of-america',
	displayName: 'Bank of America',
	portalName: 'Bank of America Employee Portal',
	logo: {
		url: 'https://raw.githubusercontent.com/curtismu7/CDN/74b2535cf2ff57c98c702071ff3de3e9eda63929/bofa.svg',
		alt: 'Bank of America Logo',
		width: '180px',
		height: '60px',
		text: 'Bank of America',
		colors: {
			bank: '#012169',
			of: '#E31837',
			america: '#012169'
		}
	},
	colors: {
		primary: '#012169', // Bank of America Blue (official brand color)
		secondary: '#FFFFFF', // White
		accent: '#E31837', // Bank of America Red (official accent color)
		background: 'linear-gradient(180deg, #012169 0%, #001847 30%, #FFFFFF 100%)',
		surface: '#FFFFFF',
		text: '#1F2937',
		textSecondary: '#6B7280',
		error: '#E31837', // Use Bank of America red for errors
		success: '#059669',
		warning: '#F59E0B',
		info: '#012169', // Use Bank of America blue for info
		// Additional theme colors with official Bank of America palette
		primaryLight: '#1E3A8A',
		primaryDark: '#001847',
		secondaryLight: '#F8F9FA',
		secondaryDark: '#E9ECEF',
		errorLight: '#FEE2E2',
		warningLight: '#FEF3C7',
		successLight: '#D1FAE5',
	},
	typography: {
		fontFamily: '"Helvetica Neue", "Arial", sans-serif',
		headingFont: '"Helvetica Neue", "Arial", sans-serif',
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
		sm: '0 1px 2px 0 rgba(1, 33, 105, 0.05)',
		md: '0 4px 6px -1px rgba(1, 33, 105, 0.1), 0 2px 4px -1px rgba(1, 33, 105, 0.06)',
		lg: '0 10px 15px -3px rgba(1, 33, 105, 0.1), 0 4px 6px -2px rgba(1, 33, 105, 0.05)',
		xl: '0 20px 25px -5px rgba(1, 33, 105, 0.1), 0 10px 10px -5px rgba(1, 33, 105, 0.04)',
	},
	brandSpecific: {
		logo: 'Bank of America',
		logoUrl: '/src/pages/protect-portal/assets/logos/bank-of-america-logo.png',
		iconSet: ['bank', 'shield', 'lock'],
		messaging: {
			welcome: 'Welcome to Bank of America',
			security: 'Your security is our priority',
			success: 'Transaction completed successfully',
			error: 'Please verify your information',
		},
		animations: {
			loading: 'fadeIn 0.3s ease-in-out',
			transition: 'all 0.2s ease-in-out',
		},
	},
};
