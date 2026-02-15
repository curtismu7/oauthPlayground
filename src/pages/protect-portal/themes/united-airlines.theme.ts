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
import type { CorporatePortalConfig } from '../types/CorporatePortalConfig';

export const unitedAirlinesConfig: CorporatePortalConfig = {
  company: {
    name: 'united-airlines',
    displayName: 'United Airlines',
    industry: 'aviation',
    logo: {
      url: '',
      alt: 'United Airlines Logo',
      width: '120px',
      height: '40px',
      text: 'UNITED',
      colors: {
        primary: '#0033A0',
        accent: '#FF6600',
      },
    },
  },
  login: {
    pattern: 'right-popout',
    position: 'right',
    animation: { type: 'slideIn', duration: '0.3s' },
  },
  navigation: {
    style: 'corporate',
    showBrandSelector: true,
    stickyHeader: true,
  },
  content: {
    customerTerminology: true,
    tone: 'corporate',
    heroTitle: 'Customer Portal',
    heroSubtitle: 'Book flights, manage reservations, and access your travel account',
    features: [
      {
        title: 'Book Flights',
        description: 'Search and book flights to destinations worldwide with exclusive deals',
        icon: 'plane',
      },
      {
        title: 'Manage Trips',
        description: 'View upcoming flights, check in online, and modify reservations',
        icon: 'trips',
      },
      {
        title: 'Flight Status',
        description: 'Track flight status, delays, and gate information in real-time',
        icon: 'calendar',
      },
    ],
  },
  branding: {
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
      heading: 'United, Helvetica Neue, Arial, sans-serif',
      body: 'United, Helvetica Neue, Arial, sans-serif',
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

export const unitedAirlinesTheme: BrandTheme = {
	name: 'united-airlines',
	displayName: 'United Airlines',
	portalName: 'United Airlines Customer Portal',
	logo: {
		url: '', // Text-based logo only
		alt: 'United Airlines Logo',
		width: '120px',
		height: '40px',
		text: 'UNITED',
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
		fontFamily: 'United, Helvetica Neue, Arial, sans-serif',
		headingFont: 'United, Helvetica Neue, Arial, sans-serif',
		bodyFont: 'United, Helvetica Neue, Arial, sans-serif',
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
	shadows: {
		sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
		md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
		lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
		xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
	},
	brandSpecific: {
		logo: 'UNITED',
		logoUrl: '',
		iconSet: ['plane', 'calendar', 'support'],
		messaging: {
			welcome: 'Welcome to United Airlines',
			security: 'Your security is our priority',
			success: 'Successfully authenticated',
			error: 'Authentication failed',
		},
		animations: {
			loading: 'spin 1s linear infinite',
			transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
		},
		layout: {
			navigationHeight: '60px',
			heroHeight: '400px',
			primaryColor: '#0033A0',
			accentColor: '#FF6600',
			backgroundGradient: 'linear-gradient(135deg, #0033A0 0%, #002880 100%)',
			useFullWidthLayout: true,
			showNavigation: true,
			showHero: true,
			showFooter: true,
			contentMaxWidth: '1200px',
			contentPadding: '2rem',
		},
	},
	portalConfig: unitedAirlinesConfig,
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
		md: '0.375rem',
		lg: '0.5rem',
		xl: '0.75rem',
	},
};
