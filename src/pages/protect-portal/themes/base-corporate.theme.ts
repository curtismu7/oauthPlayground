/**
 * @file base-corporate.theme.ts
 * @module protect-portal/themes
 * @description Base corporate theme configuration
 * @version 9.11.58
 * @since 2026-02-15
 *
 * Base corporate theme that provides default configuration for all companies.
 */

import type { CorporatePortalConfig } from '../types/CorporatePortalConfig';
import type { BrandTheme } from './brand-theme.interface';

export const baseCorporateConfig: Partial<CorporatePortalConfig> = {
	company: {
		name: 'base-corporate',
		displayName: 'Base Corporate',
		industry: 'other',
		logo: {
			url: '',
			alt: 'Corporate Logo',
			width: '120px',
			height: '40px',
			text: 'CORPORATE',
			colors: {
				primary: '#0066CC',
				accent: '#FF6600',
			},
		},
	},
	navigation: {
		style: 'corporate',
		showBrandSelector: true,
		stickyHeader: true,
	},
	content: {
		customerTerminology: true,
		tone: 'corporate',
		heroTitle: 'Corporate Portal',
		heroSubtitle: 'Access your account with secure authentication',
		features: [
			{
				title: 'Account Management',
				description: 'Manage your account settings and preferences',
				icon: 'account',
			},
			{
				title: 'Secure Access',
				description: 'Advanced security features to protect your information',
				icon: 'shield',
			},
			{
				title: 'Customer Support',
				description: 'Get help when you need it from our support team',
				icon: 'support',
			},
		],
	},
	branding: {
		colors: {
			primary: '#0066CC',
			primaryDark: '#0052A3',
			secondary: '#111827',
			accent: '#FF6600',
			background: '#ffffff',
			surface: '#ffffff',
			muted: '#6b7280',
			border: '#d1d5db',
			text: '#1F2937',
			textSecondary: '#6B7280',
			error: '#DC2626',
			success: '#059669',
			warning: '#F59E0B',
			info: '#0066CC',
			primaryLight: '#3385FF',
			secondaryLight: '#F8F9FA',
			secondaryDark: '#E9ECEF',
			errorLight: '#FEE2E2',
			warningLight: '#FEF3C7',
			successLight: '#D1FAE5',
		},
		typography: {
			heading: 'Inter, system-ui, sans-serif',
			body: 'Inter, system-ui, sans-serif',
		},
		spacing: {
			xs: '0.25rem',
			sm: '0.5rem',
			md: '1rem',
			lg: '1.5rem',
			xl: '2rem',
			xxl: '3rem',
		},
	},
};

export const baseCorporateTheme: BrandTheme = {
	name: 'base-corporate',
	displayName: 'Base Corporate',
	portalName: 'Corporate Portal',
	logo: {
		url: '',
		alt: 'Corporate Logo',
		width: '120px',
		height: '40px',
		text: 'CORPORATE',
		colors: {
			primary: '#0066CC',
			accent: '#FF6600',
		},
	},
	colors: {
		primary: '#0066CC',
		primaryDark: '#0052A3',
		secondary: '#111827',
		accent: '#FF6600',
		background: '#ffffff',
		surface: '#ffffff',
		muted: '#6b7280',
		border: '#d1d5db',
		text: '#1F2937',
		textSecondary: '#6B7280',
		error: '#DC2626',
		success: '#059669',
		warning: '#F59E0B',
		info: '#0066CC',
		primaryLight: '#3385FF',
		secondaryLight: '#F8F9FA',
		secondaryDark: '#E9ECEF',
		errorLight: '#FEE2E2',
		warningLight: '#FEF3C7',
		successLight: '#D1FAE5',
	},
	typography: {
		heading: 'Inter, system-ui, sans-serif',
		body: 'Inter, system-ui, sans-serif',
	},
};
