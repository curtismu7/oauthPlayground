import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Theme Types
export interface BrandTheme {
	name: string;
	displayName: string;
	logo: {
		url: string;
		alt: string;
		width: string;
		height: string;
	};
	colors: {
		primary: string;
		secondary: string;
		accent: string;
		background: string;
		surface: string;
		text: string;
		textSecondary: string;
		error: string;
		warning: string;
		success: string;
		info: string;
	};
	typography: {
		fontFamily: string;
		fontSize: {
			xs: string;
			sm: string;
			base: string;
			lg: string;
			xl: string;
			'2xl': string;
			'3xl': string;
		};
		fontWeight: {
			light: number;
			normal: number;
			medium: number;
			semibold: number;
			bold: number;
		};
	};
	spacing: {
		xs: string;
		sm: string;
		md: string;
		lg: string;
		xl: string;
		'2xl': string;
	};
	borderRadius: {
		sm: string;
		md: string;
		lg: string;
		xl: string;
		full: string;
	};
	shadows: {
		sm: string;
		md: string;
		lg: string;
		xl: string;
	};
}

// Predefined Themes
export const brandThemes: Record<string, BrandTheme> = {
	pingone: {
		name: 'pingone',
		displayName: 'PingOne',
		logo: {
			url: '/logos/pingone-logo.svg',
			alt: 'PingOne Logo',
			width: '120px',
			height: '40px',
		},
		colors: {
			primary: '#0066CC',
			secondary: '#003D7A',
			accent: '#FF6B35',
			background: '#F8FAFC',
			surface: '#FFFFFF',
			text: '#1A202C',
			textSecondary: '#4A5568',
			error: '#E53E3E',
			warning: '#DD6B20',
			success: '#38A169',
			info: '#3182CE',
		},
		typography: {
			fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
			fontSize: {
				xs: '0.75rem',
				sm: '0.875rem',
				base: '1rem',
				lg: '1.125rem',
				xl: '1.25rem',
				'2xl': '1.5rem',
				'3xl': '1.875rem',
			},
			fontWeight: {
				light: 300,
				normal: 400,
				medium: 500,
				semibold: 600,
				bold: 700,
			},
		},
		spacing: {
			xs: '0.25rem',
			sm: '0.5rem',
			md: '1rem',
			lg: '1.5rem',
			xl: '2rem',
			'2xl': '3rem',
		},
		borderRadius: {
			sm: '0.25rem',
			md: '0.375rem',
			lg: '0.5rem',
			xl: '0.75rem',
			full: '9999px',
		},
		shadows: {
			sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
			md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
			lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
			xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
		},
	},
	fedex: {
		name: 'fedex',
		displayName: 'FedEx',
		logo: {
			url: '/logos/fedex-logo.svg',
			alt: 'FedEx Logo',
			width: '100px',
			height: '40px',
		},
		colors: {
			primary: '#FF6600',
			secondary: '#660066',
			accent: '#00CC00',
			background: '#F5F5F5',
			surface: '#FFFFFF',
			text: '#333333',
			textSecondary: '#666666',
			error: '#FF0000',
			warning: '#FF9900',
			success: '#00CC00',
			info: '#0066CC',
		},
		typography: {
			fontFamily: '"FedExSans", "Helvetica Neue", Arial, sans-serif',
			fontSize: {
				xs: '0.75rem',
				sm: '0.875rem',
				base: '1rem',
				lg: '1.125rem',
				xl: '1.25rem',
				'2xl': '1.5rem',
				'3xl': '1.875rem',
			},
			fontWeight: {
				light: 300,
				normal: 400,
				medium: 500,
				semibold: 600,
				bold: 700,
			},
		},
		spacing: {
			xs: '0.25rem',
			sm: '0.5rem',
			md: '1rem',
			lg: '1.5rem',
			xl: '2rem',
			'2xl': '3rem',
		},
		borderRadius: {
			sm: '0.25rem',
			md: '0.375rem',
			lg: '0.5rem',
			xl: '0.75rem',
			full: '9999px',
		},
		shadows: {
			sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
			md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
			lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
			xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
		},
	},
	// Add more brand themes as needed
};

// Theme Context Type
export interface ThemeContextType {
	currentTheme: BrandTheme;
	themeName: string;
	setTheme: (themeName: string) => void;
	availableThemes: string[];
	isDarkMode: boolean;
	toggleDarkMode: () => void;
	customCSS: string;
	setCustomCSS: (css: string) => void;
}

// Context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Provider Component
export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
	const [themeName, setThemeName] = useState<string>('pingone');
	const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
	const [customCSS, setCustomCSS] = useState<string>('');

	const currentTheme = brandThemes[themeName] || brandThemes.pingone;
	const availableThemes = Object.keys(brandThemes);

	// Apply theme to CSS variables
	useEffect(() => {
		const root = document.documentElement;
		const theme = currentTheme;

		// Apply colors
		Object.entries(theme.colors).forEach(([key, value]) => {
			root.style.setProperty(`--brand-${key}`, value);
		});

		// Apply typography
		root.style.setProperty('--brand-font-family', theme.typography.fontFamily);
		Object.entries(theme.typography.fontSize).forEach(([key, value]) => {
			root.style.setProperty(`--brand-font-size-${key}`, value);
		});
		Object.entries(theme.typography.fontWeight).forEach(([key, value]) => {
			root.style.setProperty(`--brand-font-weight-${key}`, value.toString());
		});

		// Apply spacing
		Object.entries(theme.spacing).forEach(([key, value]) => {
			root.style.setProperty(`--brand-spacing-${key}`, value);
		});

		// Apply border radius
		Object.entries(theme.borderRadius).forEach(([key, value]) => {
			root.style.setProperty(`--brand-border-radius-${key}`, value);
		});

		// Apply shadows
		Object.entries(theme.shadows).forEach(([key, value]) => {
			root.style.setProperty(`--brand-shadow-${key}`, value);
		});

		// Apply dark mode
		if (isDarkMode) {
			root.classList.add('dark-mode');
		} else {
			root.classList.remove('dark-mode');
		}
	}, [currentTheme, isDarkMode]);

	// Apply custom CSS
	useEffect(() => {
		let styleElement = document.getElementById('custom-theme-css') as HTMLStyleElement;
		if (!styleElement) {
			styleElement = document.createElement('style');
			styleElement.id = 'custom-theme-css';
			document.head.appendChild(styleElement);
		}
		styleElement.textContent = customCSS;
	}, [customCSS]);

	// Load saved preferences
	useEffect(() => {
		const savedTheme = localStorage.getItem('protect-portal-theme');
		const savedDarkMode = localStorage.getItem('protect-portal-dark-mode');
		const savedCustomCSS = localStorage.getItem('protect-portal-custom-css');

		if (savedTheme && availableThemes.includes(savedTheme)) {
			setThemeName(savedTheme);
		}

		if (savedDarkMode) {
			setIsDarkMode(JSON.parse(savedDarkMode));
		}

		if (savedCustomCSS) {
			setCustomCSS(savedCustomCSS);
		}
	}, [availableThemes]);

	// Save preferences
	const handleSetTheme = (newThemeName: string) => {
		setThemeName(newThemeName);
		localStorage.setItem('protect-portal-theme', newThemeName);
	};

	const handleToggleDarkMode = () => {
		const newDarkMode = !isDarkMode;
		setIsDarkMode(newDarkMode);
		localStorage.setItem('protect-portal-dark-mode', JSON.stringify(newDarkMode));
	};

	const handleSetCustomCSS = (css: string) => {
		setCustomCSS(css);
		localStorage.setItem('protect-portal-custom-css', css);
	};

	const value: ThemeContextType = {
		currentTheme,
		themeName,
		setTheme: handleSetTheme,
		availableThemes,
		isDarkMode,
		toggleDarkMode: handleToggleDarkMode,
		customCSS,
		setCustomCSS: handleSetCustomCSS,
	};

	return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

// Hook
export const useTheme = (): ThemeContextType => {
	const context = useContext(ThemeContext);
	if (context === undefined) {
		throw new Error('useTheme must be used within a ThemeProvider');
	}
	return context;
};
