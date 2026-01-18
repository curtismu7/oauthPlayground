// Theme Service for managing UI component styles
// Centralized configuration for colors, styles, and design tokens

export interface CollapseIconTheme {
	background: string;
	backgroundHover: string;
	color: string;
	colorHover: string;
	shadow: string;
	shadowHover: string;
	borderRadius: string;
	size: {
		width: string;
		height: string;
	};
	iconSize: {
		width: string;
		height: string;
	};
	fontSize: string;
	transition: string;
	transform: {
		hover: string;
		active: string;
	};
}

export interface SidebarCollapseTheme {
	background: string;
	backgroundHover: string;
	color: string;
	colorHover: string;
	borderColor: string;
	borderColorHover: string;
	shadow: string;
	shadowHover: string;
	borderRadius: string;
	padding: string;
	fontSize: string;
	transition: string;
	transform: {
		collapsed: string;
		expanded: string;
		hover: string;
		active: string;
	};
}

export interface ThemeColors {
	primary: string;
	primaryDark: string;
	primaryLight: string;
	secondary: string;
	white: string;
	gray100: string;
	gray200: string;
	gray300: string;
	gray400: string;
	gray500: string;
	gray600: string;
	gray700: string;
	gray800: string;
	gray900: string;
	success: string;
	warning: string;
	error: string;
	info: string;
}

class ThemeService {
	private colors: ThemeColors = {
		primary: '#3b82f6',
		primaryDark: '#1d4ed8',
		primaryLight: '#60a5fa',
		secondary: '#2563eb',
		white: '#ffffff',
		gray100: '#f3f4f6',
		gray200: '#e5e7eb',
		gray300: '#d1d5db',
		gray400: '#9ca3af',
		gray500: '#6b7280',
		gray600: '#4b5563',
		gray700: '#374151',
		gray800: '#1f2937',
		gray900: '#111827',
		success: '#10b981',
		warning: '#f59e0b',
		error: '#ef4444',
		info: '#3b82f6',
	};

	// Default collapse icon theme (blue with white arrows)
	private collapseIconTheme: CollapseIconTheme = {
		background: `linear-gradient(135deg, ${this.colors.primary} 0%, ${this.colors.secondary} 100%)`,
		backgroundHover: `linear-gradient(135deg, ${this.colors.secondary} 0%, ${this.colors.primaryDark} 100%)`,
		color: this.colors.white,
		colorHover: this.colors.white,
		shadow: `0 4px 12px rgba(59, 130, 246, 0.3)`,
		shadowHover: `0 6px 20px rgba(59, 130, 246, 0.4)`,
		borderRadius: '10px',
		size: {
			width: '40px',
			height: '40px',
		},
		iconSize: {
			width: '20px',
			height: '20px',
		},
		fontSize: '1.2rem',
		transition: 'all 0.3s ease',
		transform: {
			hover: 'translateY(-2px)',
			active: 'translateY(0)',
		},
	};

	// Sidebar collapse icon theme (matches the new design)
	private sidebarCollapseTheme: SidebarCollapseTheme = {
		background: this.colors.primary,
		backgroundHover: `${this.colors.primary}22`,
		color: this.colors.white,
		colorHover: this.colors.primaryDark,
		borderColor: this.colors.primary,
		borderColorHover: this.colors.primaryDark,
		shadow: `0 2px 4px ${this.colors.primary}33`,
		shadowHover: `0 4px 8px ${this.colors.primary}4D`,
		borderRadius: '6px',
		padding: '0.4rem',
		fontSize: '1.5rem',
		transition: 'all 0.2s ease',
		transform: {
			collapsed: 'rotate(-90deg)',
			expanded: 'rotate(0deg)',
			hover: 'scale(1.1)',
			active: 'scale(1.05)',
		},
	};

	// Get colors
	getColors(): ThemeColors {
		return { ...this.colors };
	}

	getColor(colorName: keyof ThemeColors): string {
		return this.colors[colorName];
	}

	// Get collapse icon theme
	getCollapseIconTheme(): CollapseIconTheme {
		return { ...this.collapseIconTheme };
	}

	// Get sidebar collapse theme
	getSidebarCollapseTheme(): SidebarCollapseTheme {
		return { ...this.sidebarCollapseTheme };
	}

	// Update colors (for future customization)
	updateColors(newColors: Partial<ThemeColors>): void {
		this.colors = { ...this.colors, ...newColors };
		this.updateThemesWithNewColors();
	}

	// Update collapse icon theme
	updateCollapseIconTheme(newTheme: Partial<CollapseIconTheme>): void {
		this.collapseIconTheme = { ...this.collapseIconTheme, ...newTheme };
	}

	// Update sidebar collapse theme
	updateSidebarCollapseTheme(newTheme: Partial<SidebarCollapseTheme>): void {
		this.sidebarCollapseTheme = { ...this.sidebarCollapseTheme, ...newTheme };
	}

	// Generate CSS custom properties for use in styled-components
	getCSSCustomProperties(): Record<string, string> {
		const collapseTheme = this.getCollapseIconTheme();
		const sidebarTheme = this.getSidebarCollapseTheme();

		return {
			// Colors
			'--theme-primary': this.colors.primary,
			'--theme-primary-dark': this.colors.primaryDark,
			'--theme-primary-light': this.colors.primaryLight,
			'--theme-white': this.colors.white,

			// Collapse Icon
			'--collapse-icon-background': collapseTheme.background,
			'--collapse-icon-background-hover': collapseTheme.backgroundHover,
			'--collapse-icon-color': collapseTheme.color,
			'--collapse-icon-shadow': collapseTheme.shadow,
			'--collapse-icon-shadow-hover': collapseTheme.shadowHover,
			'--collapse-icon-border-radius': collapseTheme.borderRadius,
			'--collapse-icon-width': collapseTheme.size.width,
			'--collapse-icon-height': collapseTheme.size.height,

			// Sidebar Collapse
			'--sidebar-collapse-background': sidebarTheme.background,
			'--sidebar-collapse-background-hover': sidebarTheme.backgroundHover,
			'--sidebar-collapse-color': sidebarTheme.color,
			'--sidebar-collapse-color-hover': sidebarTheme.colorHover,
			'--sidebar-collapse-shadow': sidebarTheme.shadow,
			'--sidebar-collapse-shadow-hover': sidebarTheme.shadowHover,
			'--sidebar-collapse-border-radius': sidebarTheme.borderRadius,
		};
	}

	// Generate styled-components theme object
	getStyledComponentsTheme() {
		return {
			colors: this.colors,
			collapseIcon: this.collapseIconTheme,
			sidebarCollapse: this.sidebarCollapseTheme,
		};
	}

	// Helper method to create consistent collapse icon styles
	getCollapseIconStyles() {
		const theme = this.getCollapseIconTheme();
		return `
      width: ${theme.size.width};
      height: ${theme.size.height};
      border-radius: ${theme.borderRadius};
      background: ${theme.background};
      display: flex;
      align-items: center;
      justify-content: center;
      color: ${theme.color};
      font-size: ${theme.fontSize};
      cursor: pointer;
      transition: ${theme.transition};
      box-shadow: ${theme.shadow};
      flex-shrink: 0;

      svg {
        width: ${theme.iconSize.width};
        height: ${theme.iconSize.height};
      }

      &:hover {
        transform: ${theme.transform.hover};
        box-shadow: ${theme.shadowHover};
        background: ${theme.backgroundHover};
        color: ${theme.colorHover};
      }

      &:active {
        transform: ${theme.transform.active};
        box-shadow: ${theme.shadow};
      }
    `;
	}

	// Helper method to create consistent sidebar collapse icon styles
	getSidebarCollapseIconStyles() {
		const theme = this.getSidebarCollapseTheme();
		return `
      transition: ${theme.transition};
      opacity: 1;
      font-size: ${theme.fontSize};
      color: ${theme.color};
      padding: ${theme.padding};
      border-radius: ${theme.borderRadius};
      background: ${theme.background};
      border: 2px solid ${theme.borderColor};
      box-shadow: ${theme.shadow};
      cursor: pointer;
      
      &:hover {
        color: ${theme.colorHover};
        background: ${theme.backgroundHover};
        border-color: ${theme.borderColorHover};
        box-shadow: ${theme.shadowHover};
      }
    `;
	}

	// Update themes when colors change
	private updateThemesWithNewColors(): void {
		this.collapseIconTheme = {
			...this.collapseIconTheme,
			background: `linear-gradient(135deg, ${this.colors.primary} 0%, ${this.colors.secondary} 100%)`,
			backgroundHover: `linear-gradient(135deg, ${this.colors.secondary} 0%, ${this.colors.primaryDark} 100%)`,
			color: this.colors.white,
			colorHover: this.colors.white,
			shadow: `0 4px 12px rgba(59, 130, 246, 0.3)`,
			shadowHover: `0 6px 20px rgba(59, 130, 246, 0.4)`,
		};

		this.sidebarCollapseTheme = {
			...this.sidebarCollapseTheme,
			background: this.colors.primary,
			backgroundHover: `${this.colors.primary}22`,
			color: this.colors.white,
			colorHover: this.colors.primaryDark,
			borderColor: this.colors.primary,
			borderColorHover: this.colors.primaryDark,
			shadow: `0 2px 4px ${this.colors.primary}33`,
			shadowHover: `0 4px 8px ${this.colors.primary}4D`,
		};
	}

	// Preset themes for quick switching
	applyPresetTheme(presetName: 'blue' | 'green' | 'purple' | 'orange'): void {
		const presets = {
			blue: {
				primary: '#3b82f6',
				primaryDark: '#1d4ed8',
				primaryLight: '#60a5fa',
				secondary: '#2563eb',
			},
			green: {
				primary: '#10b981',
				primaryDark: '#047857',
				primaryLight: '#34d399',
				secondary: '#059669',
			},
			purple: {
				primary: '#8b5cf6',
				primaryDark: '#7c3aed',
				primaryLight: '#a78bfa',
				secondary: '#7c3aed',
			},
			orange: {
				primary: '#f59e0b',
				primaryDark: '#d97706',
				primaryLight: '#fbbf24',
				secondary: '#f59e0b',
			},
		};

		this.updateColors(presets[presetName]);
	}
}

// Export singleton instance
export const themeService = new ThemeService();

// Export types for use in components
export type { CollapseIconTheme, SidebarCollapseTheme, ThemeColors };

// Export default
export default themeService;
