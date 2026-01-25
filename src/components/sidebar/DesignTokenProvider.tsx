/**
 * DesignTokenProvider - Design system tokens and theme management
 * Phase 4: Developer Experience
 * 
 * Provides:
 * - Design tokens for colors, spacing, typography
 * - Theme system with light/dark modes
 * - Customizable design system
 * - Component styling consistency
 */

import React, { createContext, useContext, useCallback, useEffect, useState, ReactNode } from 'react';

// Design token interfaces
export interface ColorTokens {
	// Primary colors
	primary: {
		50: string;
		100: string;
		200: string;
		300: string;
		400: string;
		500: string;
		600: string;
		700: string;
		800: string;
		900: string;
	};
	
	// Semantic colors
	semantic: {
		success: string;
		warning: string;
		error: string;
		info: string;
		neutral: string;
	};
	
	// Neutral colors
	neutral: {
		50: string;
		100: string;
		200: string;
		300: string;
		400: string;
		500: string;
		600: string;
		700: string;
		800: string;
		900: string;
	};
	
	// Background colors
	background: {
		primary: string;
		secondary: string;
		tertiary: string;
		overlay: string;
	};
	
	// Text colors
	text: {
		primary: string;
		secondary: string;
		tertiary: string;
		inverse: string;
	};
	
	// Border colors
	border: {
		primary: string;
		secondary: string;
		focus: string;
		hover: string;
	};
}

export interface SpacingTokens {
	// Scale-based spacing
	xs: string;
	sm: string;
	md: string;
	lg: string;
	xl: string;
	xxl: string;
	
	// Component-specific spacing
	component: {
		padding: {
			small: string;
			medium: string;
			large: string;
		};
		margin: {
			small: string;
			medium: string;
			large: string;
		};
		gap: {
			small: string;
			medium: string;
			large: string;
		};
	};
}

export interface TypographyTokens {
	// Font families
	fontFamily: {
		primary: string;
		secondary: string;
		monospace: string;
	};
	
	// Font sizes
	fontSize: {
		xs: string;
		sm: string;
		md: string;
		lg: string;
		xl: string;
		xxl: string;
		xxxl: string;
	};
	
	// Font weights
	fontWeight: {
		light: number;
		normal: number;
		medium: number;
		semibold: number;
		bold: number;
	};
	
	// Line heights
	lineHeight: {
		tight: number;
		normal: number;
		relaxed: number;
	};
	
	// Letter spacing
	letterSpacing: {
		tight: string;
		normal: string;
		wide: string;
	};
}

export interface ShadowTokens {
	none: string;
	sm: string;
	md: string;
	lg: string;
	xl: string;
	inner: string;
}

export interface BorderRadiusTokens {
	none: string;
	sm: string;
	md: string;
	lg: string;
	xl: string;
	full: string;
}

export interface AnimationTokens {
	// Durations
	duration: {
		fast: string;
		normal: string;
		slow: string;
	};
	
	// Easing functions
	easing: {
		ease: string;
		easeIn: string;
		easeOut: string;
		easeInOut: string;
	};
}

export interface DesignTokens {
	colors: ColorTokens;
	spacing: SpacingTokens;
	typography: TypographyTokens;
	shadows: ShadowTokens;
	borderRadius: BorderRadiusTokens;
	animation: AnimationTokens;
}

export interface Theme {
	name: string;
	tokens: DesignTokens;
	isDark: boolean;
}

export interface DesignTokenContextType {
	theme: Theme;
	setTheme: (theme: Theme) => void;
	tokens: DesignTokens;
	getToken: (path: string) => string | number;
	updateTokens: (updates: Partial<DesignTokens>) => void;
	resetTokens: () => void;
}

// Default light theme tokens
const defaultColorTokens: ColorTokens = {
	primary: {
		50: '#eff6ff',
		100: '#dbeafe',
		200: '#bfdbfe',
		300: '#93c5fd',
		400: '#60a5fa',
		500: '#3b82f6',
		600: '#2563eb',
		700: '#1d4ed8',
		800: '#1e40af',
		900: '#1e3a8a',
	},
	semantic: {
		success: '#22c55e',
		warning: '#f59e0b',
		error: '#ef4444',
		info: '#3b82f6',
		neutral: '#6b7280',
	},
	neutral: {
		50: '#f9fafb',
		100: '#f3f4f6',
		200: '#e5e7eb',
		300: '#d1d5db',
		400: '#9ca3af',
		500: '#6b7280',
		600: '#4b5563',
		700: '#374151',
		800: '#1f2937',
		900: '#111827',
	},
	background: {
		primary: '#ffffff',
		secondary: '#f9fafb',
		tertiary: '#f3f4f6',
		overlay: 'rgba(0, 0, 0, 0.5)',
	},
	text: {
		primary: '#111827',
		secondary: '#4b5563',
		tertiary: '#6b7280',
		inverse: '#ffffff',
	},
	border: {
		primary: '#e5e7eb',
		secondary: '#d1d5db',
		focus: '#3b82f6',
		hover: '#9ca3af',
	},
};

const defaultSpacingTokens: SpacingTokens = {
	xs: '0.25rem',
	sm: '0.5rem',
	md: '1rem',
	lg: '1.5rem',
	xl: '2rem',
	xxl: '3rem',
	component: {
		padding: {
			small: '0.5rem',
			medium: '1rem',
			large: '1.5rem',
		},
		margin: {
			small: '0.25rem',
			medium: '0.5rem',
			large: '1rem',
		},
		gap: {
			small: '0.5rem',
			medium: '1rem',
			large: '1.5rem',
		},
	},
};

const defaultTypographyTokens: TypographyTokens = {
	fontFamily: {
		primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
		secondary: 'Georgia, "Times New Roman", serif',
		monospace: '"SF Mono", Monaco, Inconsolata, "Roboto Mono", Consolas, "Courier New", monospace',
	},
	fontSize: {
		xs: '0.75rem',
		sm: '0.875rem',
		md: '1rem',
		lg: '1.125rem',
		xl: '1.25rem',
		xxl: '1.5rem',
		xxxl: '2rem',
	},
	fontWeight: {
		light: 300,
		normal: 400,
		medium: 500,
		semibold: 600,
		bold: 700,
	},
	lineHeight: {
		tight: 1.25,
		normal: 1.5,
		relaxed: 1.75,
	},
	letterSpacing: {
		tight: '-0.025em',
		normal: '0',
		wide: '0.025em',
	},
};

const defaultShadowTokens: ShadowTokens = {
	none: 'none',
	sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
	md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
	lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
	xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
	inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
};

const defaultBorderRadiusTokens: BorderRadiusTokens = {
	none: '0',
	sm: '0.25rem',
	md: '0.5rem',
	lg: '0.75rem',
	xl: '1rem',
	full: '9999px',
};

const defaultAnimationTokens: AnimationTokens = {
	duration: {
		fast: '150ms',
		normal: '300ms',
		slow: '500ms',
	},
	easing: {
		ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
		easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
		easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
		easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
	},
};

// Default light theme
const lightTheme: Theme = {
	name: 'light',
	tokens: {
		colors: defaultColorTokens,
		spacing: defaultSpacingTokens,
		typography: defaultTypographyTokens,
		shadows: defaultShadowTokens,
		borderRadius: defaultBorderRadiusTokens,
		animation: defaultAnimationTokens,
	},
	isDark: false,
};

// Dark theme
const darkTheme: Theme = {
	name: 'dark',
	tokens: {
		...lightTheme.tokens,
		colors: {
			...defaultColorTokens,
			primary: {
				50: '#1e3a8a',
				100: '#1e40af',
				200: '#1d4ed8',
				300: '#2563eb',
				400: '#3b82f6',
				500: '#60a5fa',
				600: '#93c5fd',
				700: '#bfdbfe',
				800: '#dbeafe',
				900: '#eff6ff',
			},
			background: {
				primary: '#111827',
				secondary: '#1f2937',
				tertiary: '#374151',
				overlay: 'rgba(0, 0, 0, 0.7)',
			},
			text: {
				primary: '#f9fafb',
				secondary: '#d1d5db',
				tertiary: '#9ca3af',
				inverse: '#111827',
			},
			border: {
				primary: '#374151',
				secondary: '#4b5563',
				focus: '#60a5fa',
				hover: '#6b7280',
			},
		},
	},
	isDark: true,
};

const DesignTokenContext = createContext<DesignTokenContextType | undefined>(undefined);

// Storage keys
const STORAGE_KEYS = {
	THEME: 'sidebar.designTokens.theme',
	CUSTOM_TOKENS: 'sidebar.designTokens.custom',
} as const;

interface DesignTokenProviderProps {
	children: ReactNode;
	defaultTheme?: Theme;
	customTokens?: Partial<DesignTokens>;
	enableSystemTheme?: boolean;
}

export const DesignTokenProvider: React.FC<DesignTokenProviderProps> = ({
	children,
	defaultTheme = lightTheme,
	customTokens = {},
	enableSystemTheme = true,
}) => {
	const [theme, setTheme] = useState<Theme>(() => {
		// Load theme from localStorage
		try {
			const saved = localStorage.getItem(STORAGE_KEYS.THEME);
			if (saved === 'dark') return darkTheme;
			if (saved === 'light') return lightTheme;
		} catch {
			// Ignore errors
		}
		
		// Use system theme if enabled
		if (enableSystemTheme && typeof window !== 'undefined') {
			const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
			return systemDark ? darkTheme : lightTheme;
		}
		
		return defaultTheme;
	});

	const [tokens, setTokens] = useState<DesignTokens>(() => {
		// Load custom tokens from localStorage
		try {
			const saved = localStorage.getItem(STORAGE_KEYS.CUSTOM_TOKENS);
			if (saved) {
				const parsed = JSON.parse(saved);
				return { ...defaultTheme.tokens, ...parsed, ...customTokens };
			}
		} catch {
			// Ignore errors
		}
		
		return { ...defaultTheme.tokens, ...customTokens };
	});

	// Save theme to localStorage
	const saveTheme = useCallback((newTheme: Theme) => {
		try {
			localStorage.setItem(STORAGE_KEYS.THEME, newTheme.name);
		} catch {
			// Ignore errors
		}
	}, []);

	// Save custom tokens to localStorage
	const saveTokens = useCallback((newTokens: DesignTokens) => {
		try {
			localStorage.setItem(STORAGE_KEYS.CUSTOM_TOKENS, JSON.stringify(newTokens));
		} catch {
			// Ignore errors
		}
	}, []);

	// Handle system theme changes
	useEffect(() => {
		if (!enableSystemTheme) return;

		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		
		const handleChange = (e: MediaQueryListEvent) => {
			const systemDark = e.matches;
			setTheme(systemDark ? darkTheme : lightTheme);
		};

		mediaQuery.addEventListener('change', handleChange);
		return () => mediaQuery.removeEventListener('change', handleChange);
	}, [enableSystemTheme]);

	// Set theme
	const handleSetTheme = useCallback((newTheme: Theme) => {
		setTheme(newTheme);
		saveTheme(newTheme);
	}, [saveTheme]);

	// Get token by path (e.g., 'colors.primary.500')
	const getToken = useCallback((path: string): string | number => {
		const keys = path.split('.');
		let value: any = tokens;
		
		for (const key of keys) {
			if (value && typeof value === 'object' && key in value) {
				value = value[key];
			} else {
				return '';
			}
		}
		
		return value;
	}, [tokens]);

	// Update tokens
	const updateTokens = useCallback((updates: Partial<DesignTokens>) => {
		const newTokens = { ...tokens };
		
		// Deep merge updates
		const mergeDeep = (target: any, source: any) => {
			for (const key in source) {
				if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
					target[key] = target[key] || {};
					mergeDeep(target[key], source[key]);
				} else {
					target[key] = source[key];
				}
			}
		};
		
		mergeDeep(newTokens, updates);
		setTokens(newTokens);
		saveTokens(newTokens);
	}, [tokens, saveTokens]);

	// Reset tokens to defaults
	const resetTokens = useCallback(() => {
		const defaultTokens = theme.isDark ? darkTheme.tokens : lightTheme.tokens;
		setTokens(defaultTokens);
		saveTokens(defaultTokens);
	}, [theme.isDark, saveTokens]);

	const contextValue: DesignTokenContextType = {
		theme,
		setTheme: handleSetTheme,
		tokens,
		getToken,
		updateTokens,
		resetTokens,
	};

	return (
		<DesignTokenContext.Provider value={contextValue}>
			{children}
		</DesignTokenContext.Provider>
	);
};

export const useDesignTokens = (): DesignTokenContextType => {
	const context = useContext(DesignTokenContext);
	if (context === undefined) {
		throw new Error('useDesignTokens must be used within a DesignTokenProvider');
	}
	return context;
};

// Hook for theme management
export const useTheme = () => {
	const { theme, setTheme } = useDesignTokens();

	const toggleTheme = useCallback(() => {
		const newTheme = theme.isDark ? lightTheme : darkTheme;
		setTheme(newTheme);
	}, [theme, setTheme]);

	const setLightTheme = useCallback(() => {
		setTheme(lightTheme);
	}, [setTheme]);

	const setDarkTheme = useCallback(() => {
		setTheme(darkTheme);
	}, [setTheme]);

	return {
		theme,
		isDark: theme.isDark,
		toggleTheme,
		setLightTheme,
		setDarkTheme,
	};
};

// Hook for token access
export const useTokens = () => {
	const { tokens, getToken, updateTokens, resetTokens } = useDesignTokens();

	return {
		tokens,
		getToken,
		updateTokens,
		resetTokens,
	};
};

// CSS-in-JS utilities
export const createCSSVar = (path: string, prefix = 'sidebar'): string => {
	return `--${prefix}-${path.replace(/\./g, '-')}`;
};

export const createTokenCSS = (tokens: DesignTokens, prefix = 'sidebar'): string => {
	const css: string[] = [];

	const processTokens = (obj: any, path: string = '') => {
		for (const key in obj) {
			const newPath = path ? `${path}.${key}` : key;
			const value = obj[key];

			if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
				processTokens(value, newPath);
			} else {
				const cssVar = createCSSVar(newPath, prefix);
				css.push(`${cssVar}: ${value};`);
			}
		}
	};

	processTokens(tokens);
	return css.join('\n');
};

export default DesignTokenProvider;
