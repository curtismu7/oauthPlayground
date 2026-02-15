/**
 * @file american-airlines.theme.ts
 * @module protect-portal/themes
 * @description American Airlines brand theme configuration
 * @version 9.6.5
 * @since 2026-02-10
 *
 * American Airlines brand theme with patriotic colors and aviation styling.
 */

import type { BrandTheme } from './brand-theme.interface';
import type { CorporatePortalConfig } from '../types/CorporatePortalConfig';

export const americanAirlinesConfig: CorporatePortalConfig = {
  company: {
    name: 'american-airlines',
    displayName: 'American Airlines',
    industry: 'aviation',
    logo: {
      url: '',
      alt: 'American Airlines Logo',
      width: '120px',
      height: '40px',
      text: 'AMERICAN',
      colors: {
        primary: '#0b4aa2',
        accent: '#e11d48',
      },
    },
  },
  login: {
    pattern: 'new-page',
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
    heroTitle: 'American Airlines Customer Portal',
    heroSubtitle: 'Book flights, manage reservations, and access your AAdvantage account',
    features: [
      {
        title: 'Book a Trip',
        description: 'Search flights, compare prices, and book your next journey',
        icon: 'plane',
      },
      {
        title: 'My Reservations',
        description: 'View upcoming flights, check in, and manage bookings',
        icon: 'calendar',
      },
      {
        title: 'AAdvantage',
        description: 'Earn miles, track rewards, and enjoy member benefits',
        icon: 'mileageplus',
      },
    ],
  },
  branding: {
    colors: {
      primary: '#0b4aa2', // American blue
      primaryDark: '#073a80',
      secondary: '#FFFFFF',
      accent: '#e11d48', // American red
      background: '#FFFFFF',
      surface: '#FFFFFF',
      muted: '#6b7280',
      border: '#d1d5db',
      text: '#1F2937',
      textSecondary: '#6B7280',
      error: '#E31937',
      success: '#059669',
      warning: '#D97706',
      info: '#0b4aa2',
      primaryLight: '#0056B3',
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

export const americanAirlinesTheme: BrandTheme = {
	name: 'american-airlines',
	displayName: 'American Airlines',
	portalName: 'American Airlines Customer Portal',
	logo: {
		url: '', // Text-based logo only
		alt: 'American Airlines Logo',
		width: '120px',
		height: '40px',
		text: 'AMERICAN',
		colors: {
			american: '#0b4aa2', // Updated to match mockup
			airlines: '#e11d48', // Updated to match mockup
		},
	},
	colors: {
		primary: '#0b4aa2', // Updated to match mockup primary
		primaryDark: '#073a80', // Updated to match mockup primaryDark
		secondary: '#111827', // Updated to match mockup secondary
		accent: '#e11d48', // Updated to match mockup accent
		background: '#ffffff', // Updated to match mockup bg
		surface: '#ffffff', // Updated to match mockup surface
		muted: '#6b7280', // Updated to match mockup muted
		border: '#d1d5db', // Updated to match mockup border
		text: '#1F2937',
		textSecondary: '#6B7280',
		error: '#E31937', // Use American red for errors
		success: '#059669',
		warning: '#D97706',
		info: '#0b4aa2', // Use American blue for info
		// Additional theme colors
		primaryLight: '#0056B3',
		secondaryLight: '#F8F9FA',
		secondaryDark: '#E9ECEF',
		errorLight: '#FEE2E2',
		warningLight: '#FEF3C7',
		successLight: '#D1FAE5',
	},
	typography: {
		fontFamily: '"Owners Bold", "Helvetica Neue", Arial, sans-serif',
		headingFont: '"Owners Bold", "Helvetica Neue", Arial, sans-serif',
		bodyFont: '"Inter", system-ui, sans-serif',
		weights: {
			light: 300,
			normal: 400,
			medium: 600,
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
		logo: '🦅',
		logoUrl: 'https://www.aa.com/favicon.ico',
		iconSet: ['✈️', '🦅', '🌍', '🎫', '🛫'],
		messaging: {
			welcome: 'Welcome to American Airlines Secure Portal',
			security: 'Your flight security is our top priority',
			success: 'Check-in completed successfully',
			error: 'Unable to process your request',
		},
		animations: {
			loading: 'spin 1s linear infinite',
			transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
		},
		layout: {
			navigationHeight: '64px',
			heroHeight: '400px',
			primaryColor: '#0033A0',
			accentColor: '#E31937',
			backgroundGradient: 'linear-gradient(135deg, #0033A0 0%, #002880 100%)',
			useFullWidthLayout: true,
			showNavigation: true,
			showHero: true,
			showFooter: true,
			contentMaxWidth: '1200px',
			contentPadding: '2rem',
		},
	},
	portalConfig: americanAirlinesConfig,
};
