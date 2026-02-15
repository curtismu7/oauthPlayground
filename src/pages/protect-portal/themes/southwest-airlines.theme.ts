/**
 * @file southwest-airlines.theme.ts
 * @module protect-portal/themes
 * @description Southwest Airlines brand theme configuration
 * @version 9.6.5
 * @since 2026-02-10
 *
 * Southwest Airlines brand theme with blue, red, and gold colors, friendly aviation styling.
 */

import type { BrandTheme } from './brand-theme.interface';
import type { CorporatePortalConfig } from '../types/CorporatePortalConfig';

export const southwestAirlinesConfig: CorporatePortalConfig = {
  company: {
    name: 'southwest-airlines',
    displayName: 'Southwest Airlines',
    industry: 'aviation',
    logo: {
      url: '',
      alt: 'Southwest Airlines Logo',
      width: '120px',
      height: '40px',
      text: 'SOUTHWEST',
      colors: {
        primary: '#304CB2',
        accent: '#EE3124',
      },
    },
  },
  login: {
    pattern: 'dropdown',
    position: 'header',
    animation: { type: 'slideDown', duration: '0.3s' },
  },
  navigation: {
    style: 'friendly',
    showBrandSelector: true,
    stickyHeader: true,
  },
  content: {
    customerTerminology: true,
    tone: 'friendly',
    heroTitle: 'Customer Portal',
    heroSubtitle: 'Book flights, check in, and manage your travel with no change fees',
    features: [
      {
        title: 'Book a Flight',
        description: 'Find low fares, choose your seat, and book your next adventure',
        icon: 'plane',
      },
      {
        title: 'My Trips',
        description: 'Check in online, change flights, and view your travel details',
        icon: 'trips',
      },
      {
        title: 'Low Fares',
        description: 'Explore our competitive prices and special flight deals',
        icon: 'calendar',
      },
    ],
  },
  branding: {
    colors: {
      primary: '#304CB2', // Southwest blue
      primaryDark: '#253a8a',
      secondary: '#FFFFFF',
      accent: '#EE3124', // Southwest heart red
      background: '#FFFFFF',
      surface: '#FFFFFF',
      muted: '#6b7280',
      border: '#d1d5db',
      text: '#1F2937',
      textSecondary: '#6B7280',
      error: '#EE3124',
      success: '#059669',
      warning: '#f4c542', // Southwest gold
      info: '#304CB2',
      primaryLight: '#5B7DD8',
      secondaryLight: '#F8F9FA',
      secondaryDark: '#E9ECEF',
      errorLight: '#FEE2E2',
      warningLight: '#FEF3C7',
      successLight: '#D1FAE5',
    },
    typography: {
      heading: 'Lato, Arial, sans-serif',
      body: 'Lato, Arial, sans-serif',
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

export const southwestAirlinesTheme: BrandTheme = {
	name: 'southwest-airlines',
	displayName: 'Southwest Airlines',
	portalName: 'Southwest Airlines Customer Portal',
	logo: {
		url: '', // Text-based logo only
		alt: 'Southwest Airlines Logo',
		width: '120px',
		height: '40px',
		text: 'SOUTHWEST',
		colors: {
			southwest: '#304CB2',
			heart: '#EE3124',
		},
	},
	colors: {
		primary: '#304cb2', // Updated to match mockup primary
		primaryDark: '#253a8a', // Updated to match mockup primaryDark
		secondary: '#111827', // Updated to match mockup secondary
		accent: '#f4c542', // Updated to match mockup accent
		background: '#f5f6f8', // Updated to match mockup bg
		surface: '#ffffff', // Updated to match mockup surface
		muted: '#6b7280', // Updated to match mockup muted
		border: '#d1d5db', // Updated to match mockup border
		text: '#1F2937',
		textSecondary: '#6B7280',
		error: '#E51D23', // Use Southwest red for errors
		success: '#059669',
		warning: '#F9B612', // Use Southwest gold for warnings
		info: '#304cb2', // Use Southwest blue for info
		// Additional theme colors
		primaryLight: '#4A6BC4',
		secondaryLight: '#F8F9FA',
		secondaryDark: '#E9ECEF',
		errorLight: '#FEE2E2',
		warningLight: '#FEF3C7',
		successLight: '#D1FAE5',
	},
	typography: {
		fontFamily: '"Southwest Sans", "Helvetica Neue", Arial, sans-serif',
		headingFont: '"Southwest Sans", "Helvetica Neue", Arial, sans-serif',
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
		sm: '0 1px 2px 0 rgba(46, 75, 177, 0.05)',
		md: '0 4px 6px -1px rgba(46, 75, 177, 0.1), 0 2px 4px -1px rgba(46, 75, 177, 0.06)',
		lg: '0 10px 15px -3px rgba(46, 75, 177, 0.1), 0 4px 6px -2px rgba(46, 75, 177, 0.05)',
		xl: '0 20px 25px -5px rgba(46, 75, 177, 0.1), 0 10px 10px -5px rgba(46, 75, 177, 0.04)',
	},
	brandSpecific: {
		logo: '❤️',
		logoUrl: 'https://www.southwest.com/favicon.ico',
		iconSet: ['❤️', '✈️', '🛫', '🎫', '☀️'],
		messaging: {
			welcome: 'Welcome to Southwest Airlines Secure Portal',
			security: 'Transfarency in everything we do',
			success: 'Flight booked successfully',
			error: 'Unable to process your request',
		},
		animations: {
			loading: 'spin 1s linear infinite',
			transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
		},
	},
	portalConfig: southwestAirlinesConfig,
};
