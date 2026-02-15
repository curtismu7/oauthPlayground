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
import type { CorporatePortalConfig } from '../types/CorporatePortalConfig';

export const bankOfAmericaConfig: CorporatePortalConfig = {
  company: {
    name: 'bank-of-america',
    displayName: 'Bank of America',
    industry: 'banking',
    logo: {
      url: '',
      alt: 'Bank of America Logo',
      width: '140px',
      height: '40px',
      text: 'BANK OF AMERICA',
      colors: {
        primary: '#012169',
        accent: '#E31837',
      },
    },
  },
  login: {
    pattern: 'embedded',
    position: 'hero',
    animation: { type: 'fadeIn', duration: '0.4s' },
  },
  navigation: {
    style: 'corporate',
    showBrandSelector: true,
    stickyHeader: true,
  },
  content: {
    customerTerminology: true,
    tone: 'corporate',
    heroTitle: 'Online Banking',
    heroSubtitle: 'Open new accounts, manage your finances, and access banking services',
    features: [
      {
        title: 'Open Checking Account',
        description: 'Start your banking journey with our secure checking account options',
        icon: 'account',
      },
      {
        title: 'Open Savings Account',
        description: 'Build your savings with competitive interest rates and flexible terms',
        icon: 'transfer',
      },
      {
        title: 'Open IRA Account',
        description: 'Plan for retirement with our individual retirement account options',
        icon: 'cards',
      },
    ],
  },
  branding: {
    colors: {
      primary: '#012169', // Bank of America blue
      primaryDark: '#011a58',
      secondary: '#FFFFFF',
      accent: '#E31837', // Bank of America red
      background: '#FFFFFF',
      surface: '#FFFFFF',
      muted: '#6b7280',
      border: '#d1d5db',
      text: '#1F2937',
      textSecondary: '#6B7280',
      error: '#E31837',
      success: '#059669',
      warning: '#D97706',
      info: '#012169',
      primaryLight: '#0033A0',
      secondaryLight: '#F8F9FA',
      secondaryDark: '#E9ECEF',
      errorLight: '#FEE2E2',
      warningLight: '#FEF3C7',
      successLight: '#D1FAE5',
    },
    typography: {
      heading: 'Arial, Helvetica Neue, sans-serif',
      body: 'Arial, Helvetica Neue, sans-serif',
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

export const bankOfAmericaTheme: BrandTheme = {
	name: 'bank-of-america',
	displayName: 'Bank of America',
	portalName: 'Bank of America Online Banking',
	logo: {
		url: '', // Text-based logo only
		alt: 'Bank of America Logo',
		width: '140px',
		height: '40px',
		text: 'BANK OF AMERICA',
		colors: {
			bank: '#012169',
			of: '#E31837',
			america: '#012169',
		},
	},
	colors: {
		primary: '#012169', // Bank of America Blue (official primary color)
		primaryDark: '#010E40', // Darker blue for hover states
		secondary: '#111827', // Updated to match mockup secondary
		accent: '#E31837', // Bank of America Red (official accent color)
		background: '#f7fafc', // Updated to match mockup bg
		surface: '#ffffff', // Updated to match mockup surface
		muted: '#6b7280', // Updated to match mockup muted
		border: '#d1d5db', // Updated to match mockup border
		text: '#1F2937',
		textSecondary: '#6B7280',
		error: '#E31837', // Use Bank of America red for errors
		success: '#059669',
		warning: '#F59E0B',
		info: '#012169', // Use Bank of America blue for info
		// Additional theme colors with official Bank of America palette
		primaryLight: '#1E3A8A',
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
	portalConfig: bankOfAmericaConfig,
};
