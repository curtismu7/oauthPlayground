/**
 * @file ThemeContext.tsx
 * @module v8u/contexts
 * @description Theme context for user management app
 * @version 1.0.0
 * @since 2026-02-12
 */

import React, { createContext, ReactNode, useContext } from 'react';

interface ThemeColors {
	primary: string;
	secondary: string;
	accent: string;
	background: string;
	surface: string;
	text: string;
	textSecondary: string;
	error: string;
	success: string;
	warning: string;
	info: string;
}

interface ThemeContextType {
	currentTheme: {
		colors: ThemeColors;
	};
	toggleDarkMode: () => void;
	isDarkMode: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
	children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
	const [isDarkMode, setIsDarkMode] = React.useState(false);

	const currentTheme = {
		colors: {
			primary: '#3b82f6',
			secondary: '#ffffff',
			accent: '#f59e0b',
			background: isDarkMode ? '#1f2937' : '#ffffff',
			surface: isDarkMode ? '#374151' : '#f9fafb',
			text: isDarkMode ? '#f9fafb' : '#1f2937',
			textSecondary: isDarkMode ? '#9ca3af' : '#6b7280',
			error: '#ef4444',
			success: '#10b981',
			warning: '#f59e0b',
			info: '#3b82f6',
		},
	};

	const toggleDarkMode = () => {
		setIsDarkMode(!isDarkMode);
	};

	const value: ThemeContextType = {
		currentTheme,
		toggleDarkMode,
		isDarkMode,
	};

	return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => {
	const context = useContext(ThemeContext);
	if (context === undefined) {
		throw new Error('useTheme must be used within a ThemeProvider');
	}
	return context;
};
