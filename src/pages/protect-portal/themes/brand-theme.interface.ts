/**
 * @file brand-theme.interface.ts
 * @module protect-portal/themes
 * @description Brand theme interface definitions for corporate theming
 * @version 9.6.5
 * @since 2026-02-10
 *
 * This file defines the TypeScript interfaces for brand themes that allow
 * the Protect Portal to switch between different corporate branding styles.
 */

import type { CorporatePortalConfig } from '../types/CorporatePortalConfig';

export interface BrandTheme {
	name: string;
	displayName: string;
	portalName: string; // Internal portal name
	logo: {
		url: string;
		alt: string;
		width: string;
		height: string;
		text?: string;
		colors?: Record<string, string>;
	};
	colors: {
		primary: string;
		primaryDark: string;
		secondary: string;
		accent: string;
		background: string;
		surface: string;
		muted: string;
		border: string;
		text: string;
		textSecondary: string;
		error: string;
		success: string;
		warning: string;
		info: string;
		// Additional theme colors for internal portal
		primaryLight: string;
		secondaryLight: string;
		secondaryDark: string;
		errorLight: string;
		warningLight: string;
		successLight: string;
	};
	typography: {
		fontFamily: string;
		headingFont: string;
		bodyFont: string;
		weights: {
			light: number;
			normal: number;
			medium: number;
			bold: number;
		};
		sizes: {
			xs: string;
			sm: string;
			md: string;
			lg: string;
			xl: string;
			xxl: string;
		};
	};
	spacing: {
		xs: string;
		sm: string;
		md: string;
		lg: string;
		xl: string;
		xxl: string;
	};
	borderRadius: {
		sm: string;
		md: string;
		lg: string;
		xl: string;
	};
	shadows: {
		sm: string;
		md: string;
		lg: string;
		xl: string;
	};
	brandSpecific: {
		logo: string;
		logoUrl?: string;
		iconSet: string[];
		messaging: {
			welcome: string;
			security: string;
			success: string;
			error: string;
		};
		animations: {
			loading: string;
			transition: string;
		};
		layout?: {
			navigationHeight?: string;
			heroHeight?: string;
			primaryColor?: string;
			accentColor?: string;
			backgroundGradient?: string;
			useFullWidthLayout?: boolean;
			showNavigation?: boolean;
			showHero?: boolean;
			showFooter?: boolean;
			contentMaxWidth?: string;
			contentPadding?: string;
		};
	};
	portalConfig?: CorporatePortalConfig;
}

export interface BrandThemeContext {
	activeTheme: BrandTheme;
	switchTheme: (themeName: string) => void;
	isTransitioning: boolean;
	availableThemes: BrandTheme[];
}

export interface BrandSelectorProps {
	onThemeChange?: (theme: BrandTheme) => void;
	compact?: boolean;
}

export interface ThemedComponentProps {
	theme?: BrandTheme;
	children: React.ReactNode;
}
