// V9 Color Standards - Accessibility Compliant
// Ensures proper contrast ratios for all UI elements

export const V9_COLORS = {
	// Primary colors with proper contrast
	PRIMARY: {
		GREEN: '#10b981', // emerald-500
		GREEN_DARK: '#059669', // emerald-600
		GREEN_LIGHT: '#34d399', // emerald-400
		BLUE: '#3b82f6', // blue-500
		BLUE_DARK: '#2563eb', // blue-600
		RED: '#ef4444', // red-500
		RED_DARK: '#dc2626', // red-600
		YELLOW: '#f59e0b', // amber-500
		YELLOW_DARK: '#d97706', // amber-600
		PURPLE: '#8b5cf6', // violet-500 - special flows (Postman, Device)
		PURPLE_DARK: '#7c3aed', // violet-600
	},

	// Text colors with proper contrast
	TEXT: {
		WHITE: '#ffffff',
		BLACK: '#000000',
		GRAY_DARK: '#1f2937', // gray-800
		GRAY_MEDIUM: '#6b7280', // gray-500
		GRAY_LIGHT: '#9ca3af', // gray-400
		GRAY_LIGHTER: '#e5e7eb', // gray-200
		INFO: '#ffffff', // white — on solid blue INFO background
	},

	// Background colors
	BG: {
		WHITE: '#ffffff',
		GRAY_LIGHT: '#f8fafc', // slate-50
		GRAY_MEDIUM: '#f1f5f9', // slate-100
		INFO_LIGHT: '#3b82f6', // blue-500 — solid, white text readable
		SUCCESS: '#ecfdf5', // emerald-50
		SUCCESS_BORDER: '#10b981', // emerald-500
		WARNING: '#fef3c7', // amber-50
		WARNING_BORDER: '#f59e0b', // amber-500
		ERROR: '#fef2f2', // red-50
		ERROR_BORDER: '#ef4444', // red-500
	},

	// Border colors
	BORDER: {
		GRAY: '#e5e7eb', // gray-200
		INFO: '#2563eb', // blue-600
	},

	// Status colors
	STATUS: {
		WARNING: '#f59e0b', // amber-500
	},

	// Button styles with proper contrast
	BUTTON: {
		PRIMARY: {
			background: '#10b981',
			backgroundHover: '#059669',
			color: '#ffffff',
			border: '#10b981',
		},
		SECONDARY: {
			background: '#3b82f6',
			backgroundHover: '#2563eb',
			color: '#ffffff',
			border: '#3b82f6',
		},
		DANGER: {
			background: '#ef4444',
			backgroundHover: '#dc2626',
			color: '#ffffff',
			border: '#ef4444',
		},
		DISABLED: {
			background: '#9ca3af',
			color: '#ffffff',
			border: '#9ca3af',
		},
	},

	// Banner colors with proper contrast
	BANNER: {
		SUCCESS: {
			background: '#10b981',
			color: '#ffffff',
			border: '#059669',
		},
		ERROR: {
			background: '#ef4444',
			color: '#ffffff',
			border: '#dc2626',
		},
		WARNING: {
			background: '#f59e0b',
			color: '#ffffff',
			border: '#d97706',
		},
		INFO: {
			background: '#3b82f6',
			color: '#ffffff',
			border: '#2563eb',
		},
	},

	// Step indicator colors
	STEP: {
		ACTIVE: {
			background: '#10b981',
			color: '#ffffff',
			border: '#10b981',
		},
		INACTIVE: {
			background: '#e5e7eb',
			color: '#6b7280',
			border: '#e5e7eb',
		},
		COMPLETED: {
			background: '#10b981',
			color: '#ffffff',
			border: '#10b981',
		},
	},
};

// Helper functions for consistent styling
export const getButtonStyles = (
	variant: 'primary' | 'secondary' | 'danger' | 'disabled' = 'primary',
	disabled = false
) => {
	const buttonType = disabled
		? 'DISABLED'
		: (variant.toUpperCase() as keyof typeof V9_COLORS.BUTTON);
	const styles = V9_COLORS.BUTTON[buttonType];

	return {
		background: styles.background,
		color: styles.color,
		border: `1px solid ${styles.border}`,
		opacity: disabled ? 0.6 : 1,
		cursor: disabled ? 'not-allowed' : 'pointer',
		transition: 'all 0.2s ease',
	};
};

export const getBannerStyles = (type: 'success' | 'error' | 'warning' | 'info') => {
	const bannerType = type.toUpperCase() as keyof typeof V9_COLORS.BANNER;
	const styles = V9_COLORS.BANNER[bannerType];

	return {
		background: styles.background,
		color: styles.color,
		border: `1px solid ${styles.border}`,
	};
};

export const getStepStyles = (isActive: boolean, isCompleted: boolean) => {
	if (isCompleted) {
		return V9_COLORS.STEP.COMPLETED;
	}
	if (isActive) {
		return V9_COLORS.STEP.ACTIVE;
	}
	return V9_COLORS.STEP.INACTIVE;
};
