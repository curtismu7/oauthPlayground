/**
 * @file theme-provider.tsx
 * @module protect-portal/themes
 * @description Brand theme provider component for dynamic theming
 * @version 9.6.5
 * @since 2026-02-10
 *
 * This component provides theme context and switching functionality for
 * the Protect Portal corporate branding system.
 */

import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { fedexTheme } from './fedex.theme';
import { americanAirlinesTheme } from './american-airlines.theme';
import { unitedAirlinesTheme } from './united-airlines.theme';
import { southwestAirlinesTheme } from './southwest-airlines.theme';
import { bankOfAmericaTheme } from './bank-of-america.theme';
import type { BrandTheme, BrandThemeContext } from './brand-theme.interface';

// Available themes
const availableThemes: BrandTheme[] = [
	fedexTheme,
	americanAirlinesTheme,
	unitedAirlinesTheme,
	southwestAirlinesTheme,
	bankOfAmericaTheme,
];

// Create context
const ThemeContext = createContext<BrandThemeContext | undefined>(undefined);

// Theme Provider Component
export const BrandThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [activeTheme, setActiveTheme] = useState<BrandTheme>(fedexTheme);
	const [isTransitioning, setIsTransitioning] = useState(false);

	// Load saved theme from localStorage on mount
	useEffect(() => {
		const savedTheme = localStorage.getItem('protect-portal-theme');
		if (savedTheme) {
			const theme = availableThemes.find((t) => t.name === savedTheme);
			if (theme) {
				setActiveTheme(theme);
			}
		}
	}, []);

	// Save theme to localStorage when it changes
	useEffect(() => {
		localStorage.setItem('protect-portal-theme', activeTheme.name);
	}, [activeTheme]);

	// Switch theme with smooth transition
	const switchTheme = useCallback((themeName: string) => {
		const newTheme = availableThemes.find((t) => t.name === themeName);
		if (!newTheme || newTheme.name === activeTheme.name) {
			return;
		}

		setIsTransitioning(true);
		
		// Add transition class to body
		document.body.classList.add('theme-transitioning');
		
		// Switch theme after brief delay for smooth transition
		setTimeout(() => {
			setActiveTheme(newTheme);
			
			// Remove transition class after theme change
			setTimeout(() => {
				document.body.classList.remove('theme-transitioning');
				setIsTransitioning(false);
			}, 300);
		}, 150);
	}, [activeTheme.name]);

	// Apply theme CSS variables to document
	useEffect(() => {
		const root = document.documentElement;
		
		// Apply color variables
		root.style.setProperty('--brand-primary', activeTheme.colors.primary);
		root.style.setProperty('--brand-secondary', activeTheme.colors.secondary);
		root.style.setProperty('--brand-accent', activeTheme.colors.accent);
		root.style.setProperty('--brand-background', activeTheme.colors.background);
		root.style.setProperty('--brand-surface', activeTheme.colors.surface);
		root.style.setProperty('--brand-text', activeTheme.colors.text);
		root.style.setProperty('--brand-text-secondary', activeTheme.colors.textSecondary);
		root.style.setProperty('--brand-error', activeTheme.colors.error);
		root.style.setProperty('--brand-success', activeTheme.colors.success);
		root.style.setProperty('--brand-warning', activeTheme.colors.warning);
		root.style.setProperty('--brand-info', activeTheme.colors.info);
		
		// Apply additional color variables
		root.style.setProperty('--brand-primary-light', activeTheme.colors.primaryLight);
		root.style.setProperty('--brand-primary-dark', activeTheme.colors.primaryDark);
		root.style.setProperty('--brand-secondary-light', activeTheme.colors.secondaryLight);
		root.style.setProperty('--brand-secondary-dark', activeTheme.colors.secondaryDark);
		root.style.setProperty('--brand-error-light', activeTheme.colors.errorLight);
		root.style.setProperty('--brand-warning-light', activeTheme.colors.warningLight);
		root.style.setProperty('--brand-success-light', activeTheme.colors.successLight);
		root.style.setProperty('--brand-accent-dark', activeTheme.colors.primaryDark);
		
		// Apply typography variables
		root.style.setProperty('--brand-font-family', activeTheme.typography.fontFamily);
		root.style.setProperty('--brand-heading-font', activeTheme.typography.headingFont);
		root.style.setProperty('--brand-body-font', activeTheme.typography.bodyFont);
		
		// Apply spacing variables
		root.style.setProperty('--brand-spacing-xs', activeTheme.spacing.xs);
		root.style.setProperty('--brand-spacing-sm', activeTheme.spacing.sm);
		root.style.setProperty('--brand-spacing-md', activeTheme.spacing.md);
		root.style.setProperty('--brand-spacing-lg', activeTheme.spacing.lg);
		root.style.setProperty('--brand-spacing-xl', activeTheme.spacing.xl);
		root.style.setProperty('--brand-spacing-xxl', activeTheme.spacing.xxl);
		
		// Apply border radius variables
		root.style.setProperty('--brand-radius-sm', activeTheme.borderRadius.sm);
		root.style.setProperty('--brand-radius-md', activeTheme.borderRadius.md);
		root.style.setProperty('--brand-radius-lg', activeTheme.borderRadius.lg);
		root.style.setProperty('--brand-radius-xl', activeTheme.borderRadius.xl);
		
		// Apply shadow variables
		root.style.setProperty('--brand-shadow-sm', activeTheme.shadows.sm);
		root.style.setProperty('--brand-shadow-md', activeTheme.shadows.md);
		root.style.setProperty('--brand-shadow-lg', activeTheme.shadows.lg);
		root.style.setProperty('--brand-shadow-xl', activeTheme.shadows.xl);
		
		// Apply animation variables
		root.style.setProperty('--brand-loading-animation', activeTheme.brandSpecific.animations.loading);
		root.style.setProperty('--brand-transition', activeTheme.brandSpecific.animations.transition);
	}, [activeTheme]);

	const contextValue: BrandThemeContext = {
		activeTheme,
		switchTheme,
		isTransitioning,
		availableThemes,
	};

	return (
		<ThemeContext.Provider value={contextValue}>
			{children}
		</ThemeContext.Provider>
	);
};

// Hook to use theme context
export const useBrandTheme = (): BrandThemeContext => {
	const context = useContext(ThemeContext);
	if (context === undefined) {
		throw new Error('useBrandTheme must be used within a BrandThemeProvider');
	}
	return context;
};

// Export themes for direct access
export {
	fedexTheme,
	americanAirlinesTheme,
	unitedAirlinesTheme,
	southwestAirlinesTheme,
	availableThemes,
};
