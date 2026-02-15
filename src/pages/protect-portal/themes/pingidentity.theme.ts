/**
 * @file pingidentity.theme.ts
 * @module protect-portal/themes
 * @description PingIdentity brand theme configuration
 * @version 9.6.5
 * @since 2026-02-11
 *
 * PingIdentity brand theme with professional blue and white colors,
 * enterprise security styling, and modern tech company aesthetics.
 */

import type { BrandTheme } from './brand-theme.interface';
import type { CorporatePortalConfig } from '../types/CorporatePortalConfig';

export const pingidentityConfig: CorporatePortalConfig = {
  company: {
    name: 'pingidentity',
    displayName: 'PingIdentity',
    industry: 'tech',
    logo: {
      url: '',
      alt: 'PingIdentity Logo',
      width: '130px',
      height: '40px',
      text: 'PingIdentity',
      colors: {
        primary: '#0066CC',
        accent: '#003366',
      },
    },
  },
  login: {
    pattern: 'two-step-otp',
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
    heroTitle: 'PingIdentity Customer Portal',
    heroSubtitle: 'Secure access to your identity and access management solutions',
    features: [
      {
        title: 'Identity Management',
        description: 'Manage user identities, directories, and authentication services',
        icon: 'shield',
      },
      {
        title: 'API Access',
        description: 'Access developer tools, APIs, and integration resources',
        icon: 'api',
      },
      {
        title: 'Support Center',
        description: 'Get technical support, documentation, and training resources',
        icon: 'support',
      },
    ],
  },
  branding: {
    colors: {
      primary: '#0066CC', // PingIdentity Blue
      primaryDark: '#0052A3',
      secondary: '#FFFFFF',
      accent: '#003366', // PingIdentity Dark Blue
      background: '#FFFFFF',
      surface: '#FFFFFF',
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

export const pingidentityTheme: BrandTheme = {
	name: 'pingidentity',
	displayName: 'PingIdentity',
	portalName: 'PingIdentity Customer Portal',
	logo: {
		url: '', // Text-based logo only
		alt: 'PingIdentity Logo',
		width: '130px',
		height: '40px',
		text: 'PingIdentity',
		colors: {
			ping: '#0066CC',
			identity: '#003366',
		},
	},
	colors: {
		primary: '#0066CC', // PingIdentity Blue (official primary color)
		primaryDark: '#0052A3', // Darker blue for hover states
		secondary: '#111827', // Updated to match mockup secondary
		accent: '#0066CC', // PingIdentity Blue (accent)
		background: '#ffffff', // Updated to match mockup bg
		surface: '#ffffff', // Updated to match mockup surface
		muted: '#6b7280', // Updated to match mockup muted
		border: '#d1d5db', // Updated to match mockup border
		text: '#1F2937',
		textSecondary: '#6B7280',
		error: '#DC2626',
		success: '#059669',
		warning: '#F59E0B', // Amber for warnings
		info: '#0066CC', // Use PingIdentity Blue for info
		// Additional theme colors with PingIdentity palette
		primaryLight: '#3385FF',
		secondaryLight: '#F8F9FA',
		secondaryDark: '#E9ECEF',
		errorLight: '#FEE2E2',
		warningLight: '#FEF3C7',
		successLight: '#D1FAE5',
	},
	typography: {
		fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
		headingFont: '"Inter", "Helvetica Neue", Arial, sans-serif',
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
		sm: '0 1px 2px 0 rgba(0, 102, 204, 0.05)',
		md: '0 4px 6px -1px rgba(0, 102, 204, 0.1), 0 2px 4px -1px rgba(0, 102, 204, 0.06)',
		lg: '0 10px 15px -3px rgba(0, 102, 204, 0.1), 0 4px 6px -2px rgba(0, 102, 204, 0.05)',
		xl: '0 20px 25px -5px rgba(0, 102, 204, 0.1), 0 10px 10px -5px rgba(0, 102, 204, 0.04)',
	},
	brandSpecific: {
		logo: '🔐',
		logoUrl: 'https://www.pingidentity.com/favicon.ico',
		iconSet: ['🔐', '🛡️', '🔑', '🔒', '🏢', '🌐'],
		messaging: {
			welcome: 'Welcome to PingIdentity Secure Portal',
			security: 'Enterprise-grade identity security',
			success: 'Authentication successful',
			error: 'Unable to process your request',
		},
		animations: {
			loading: 'spin 1s linear infinite',
			transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
		},
	},
	portalConfig: pingidentityConfig,
};
