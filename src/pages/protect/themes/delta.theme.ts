/**
 * @file delta.theme.ts
 * @module protect-portal/themes
 * @description Delta Air Lines brand theme configuration
 * @version 9.11.58
 * @since 2026-02-16
 *
 * Delta Air Lines brand theme with their signature red and blue colors.
 */

import type { CorporatePortalConfig } from '../types/CorporatePortalConfig';
import type { BrandTheme } from './brand-theme.interface';

export const deltaConfig: CorporatePortalConfig = {
	company: {
		name: 'delta',
		displayName: 'Delta Air Lines',
		industry: 'aviation',
		logo: {
			url: '',
			alt: 'Delta Air Lines Logo',
			width: '140px',
			height: '40px',
			text: 'Delta',
			colors: {
				primary: '#c8102e',
				accent: '#0033a0',
			},
		},
	},
	branding: {
		colors: {
			primary: '#c8102e',
			primaryLight: '#e74c3c',
			primaryDark: '#a91b0d',
			secondary: '#0033a0',
			secondaryLight: '#1e4a8c',
			secondaryDark: '#002580',
			accent: '#ff6b35',
			success: '#27ae60',
			warning: '#f39c12',
			danger: '#e74c3c',
			info: '#3498db',
			light: '#ecf0f1',
			dark: '#2c3e50',
			white: '#ffffff',
			gray100: '#f8f9fa',
			gray200: '#e9ecef',
			gray300: '#dee2e6',
			gray400: '#ced4da',
			gray500: '#adb5bd',
			gray600: '#6c757d',
			gray700: '#495057',
			gray800: '#343a40',
			gray900: '#212529',
			black: '#000000',
		},
		typography: {
			fontFamily: {
				heading: '"Delta Text", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
				body: '"Delta Text", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
				mono: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
			},
			fontSize: {
				xs: '0.75rem',
				sm: '0.875rem',
				base: '1rem',
				lg: '1.125rem',
				xl: '1.25rem',
				'2xl': '1.5rem',
				'3xl': '1.875rem',
				'4xl': '2.25rem',
			},
			fontWeight: {
				light: '300',
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
		},
		spacing: {
			xs: '0.25rem',
			sm: '0.5rem',
			md: '1rem',
			lg: '1.5rem',
			xl: '2rem',
			'2xl': '3rem',
			'3xl': '4rem',
		},
		borderRadius: {
			none: '0',
			sm: '0.125rem',
			base: '0.25rem',
			md: '0.375rem',
			lg: '0.5rem',
			xl: '0.75rem',
			full: '9999px',
		},
		shadows: {
			sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
			base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
			md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
			lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
			xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
		},
		animation: {
			duration: {
				fast: '150ms',
				normal: '300ms',
				slow: '500ms',
			},
			easing: {
				ease: 'ease',
				easeIn: 'ease-in',
				easeOut: 'ease-out',
				easeInOut: 'ease-in-out',
			},
		},
	},
	login: {
		pattern: 'new-page',
		route: '/delta/login',
		animation: { type: 'fadeIn', duration: '0.3s' },
	},
	content: {
		title: 'Delta Air Lines Portal',
		subtitle: 'Secure Employee Access',
		description: 'Access your Delta Air Lines employee account with enhanced security features.',
		welcomeMessage: 'Welcome to Delta Air Lines',
		customerTerminology: 'Customer',
		employeeTerminology: 'Employee',
		loginButtonText: 'Sign In',
		logoutButtonText: 'Sign Out',
		securityFeatures: [
			'Multi-Factor Authentication',
			'Risk-Based Authentication',
			'Single Sign-On (SSO)',
			'Biometric Authentication',
		],
	},
	risk: {
		thresholds: {
			low: 0.3,
			medium: 0.7,
			high: 0.9,
		},
		factors: {
			location: 0.3,
			device: 0.25,
			behavior: 0.2,
			time: 0.15,
			network: 0.1,
		},
	},
};

export const deltaTheme: BrandTheme = {
	name: 'delta',
	displayName: 'Delta Air Lines',
	portalName: 'Delta Customer Portal',
	logo: {
		url: '',
		alt: 'Delta Air Lines Logo',
		width: '120px',
		height: '40px',
		text: 'DELTA',
		colors: {
			primary: '#c8102e',
			accent: '#0033a0',
		},
	},
	colors: {
		primary: '#c8102e',
		primaryDark: '#a91b0d',
		primaryLight: '#f8d7da',
		secondary: '#111827',
		secondaryLight: '#d1d5db',
		secondaryDark: '#1f2937',
		accent: '#ff6b35',
		background: '#ffffff',
		surface: '#ffffff',
		muted: '#6b7280',
		border: '#d1d5db',
		text: '#1F2937',
		textSecondary: '#6B7280',
		error: '#E31937',
		errorLight: '#f8d7da',
		success: '#059669',
		successLight: '#d4edda',
		warning: '#D97706',
		warningLight: '#fff3cd',
		info: '#c8102e',
	},
	typography: {
		fontFamily: '"Delta Text", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
		headingFont: '"Delta Text", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
		bodyFont: '"Delta Text", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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
		sm: '0 1px 2px 0 rgba(200, 16, 46, 0.05)',
		md: '0 4px 6px -1px rgba(200, 16, 46, 0.1), 0 2px 4px -1px rgba(200, 16, 46, 0.06)',
		lg: '0 10px 15px -3px rgba(200, 16, 46, 0.1), 0 4px 6px -2px rgba(200, 16, 46, 0.05)',
		xl: '0 20px 25px -5px rgba(200, 16, 46, 0.1), 0 10px 10px -5px rgba(200, 16, 46, 0.04)',
	},
	brandSpecific: {
		logo: '✈️',
		logoUrl: 'https://www.delta.com/favicon.ico',
		iconSet: ['✈️', '🛫', '🌍', '🎫', '🛃'],
		messaging: {
			welcome: 'Welcome to Delta Air Lines Secure Portal',
			security: 'Your security is our top priority',
			success: 'Transaction completed successfully',
			error: 'Unable to process your request',
		},
		animations: {
			loading: 'spin 1s linear infinite',
			transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
		},
		layout: {
			navigationHeight: '64px',
			heroHeight: '400px',
			primaryColor: '#c8102e',
			accentColor: '#0033a0',
			backgroundGradient: 'linear-gradient(135deg, #c8102e 0%, #a91b0d 100%)',
			useFullWidthLayout: true,
			showNavigation: true,
			showHero: true,
			showFooter: true,
			contentMaxWidth: '1200px',
			contentPadding: '2rem',
		},
	},
	portalConfig: deltaConfig,
};
