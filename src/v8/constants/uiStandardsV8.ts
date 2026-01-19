/**
 * UI Standards Constants for V8 Components
 * 
 * Centralizes all UI/UX standards including colors, typography, spacing, and animations.
 * This file ensures consistency across all V8 components.
 */

// ============================================================================
// Button Color Standards
// ============================================================================

/**
 * Button color semantic meanings:
 * - RED: Token operations (Get Token), destructive actions (Delete, Reset)
 * - GREEN: Next/Forward progression, success actions, confirmations
 * - YELLOW: Warning actions, caution required, optional steps
 * - BLUE: Primary actions, default operations
 * - GRAY: Secondary/utility actions, cancel, back
 * - PURPLE: Special flows (Device flows, FIDO2)
 * - ORANGE: Administrative actions, configuration
 * - TEAL: Information actions, view details
 */
export const BUTTON_COLORS = {
	// Red - Token operations and destructive actions
	danger: {
		background: '#ef4444',
		hover: '#dc2626',
		text: '#ffffff',
		semantic: 'Token operations, destructive actions',
	},
	// Green - Next/Forward/Success
	success: {
		background: '#10b981',
		hover: '#059669',
		text: '#ffffff',
		semantic: 'Next step, forward progress, confirmations',
	},
	// Yellow - Warning/Caution
	warning: {
		background: '#f59e0b',
		hover: '#d97706',
		text: '#ffffff',
		semantic: 'Warning actions, caution required',
	},
	// Blue - Primary actions
	primary: {
		background: '#3b82f6',
		hover: '#2563eb',
		text: '#ffffff',
		semantic: 'Primary actions, default operations',
	},
	// Gray - Secondary/Utility
	secondary: {
		background: '#6b7280',
		hover: '#4b5563',
		text: '#ffffff',
		semantic: 'Secondary actions, utilities, cancel',
	},
	// Purple - Special flows
	purple: {
		background: '#a855f7',
		hover: '#9333ea',
		text: '#ffffff',
		semantic: 'Device flows, FIDO2 operations',
	},
	// Orange - Administrative
	orange: {
		background: '#f97316',
		hover: '#ea580c',
		text: '#ffffff',
		semantic: 'Administrative actions, configuration',
	},
	// Teal - Information
	teal: {
		background: '#14b8a6',
		hover: '#0d9488',
		text: '#ffffff',
		semantic: 'Information actions, view details',
	},
};

// ============================================================================
// Message/Alert Color Standards
// ============================================================================

/**
 * Message box color standards:
 * - SUCCESS: Completed operations, positive confirmations
 * - WARNING: Cautions, non-critical issues, optional actions
 * - ERROR: Failures, critical issues, validation errors
 * - INFO: Informational messages, tips, neutral notifications
 */
export const MESSAGE_COLORS = {
	success: {
		background: '#d1fae5',
		border: '#10b981',
		text: '#064e3b',
		icon: '✅',
		semantic: 'Completed operations, positive confirmations',
	},
	warning: {
		background: '#fef3c7',
		border: '#f59e0b',
		text: '#78350f',
		icon: '⚠️',
		semantic: 'Cautions, non-critical issues',
	},
	error: {
		background: '#fee2e2',
		border: '#ef4444',
		text: '#7f1d1d',
		icon: '❌',
		semantic: 'Failures, critical issues',
	},
	info: {
		background: '#dbeafe',
		border: '#3b82f6',
		text: '#1e3a8a',
		icon: 'ℹ️',
		semantic: 'Informational messages, tips',
	},
};

// ============================================================================
// Typography Standards
// ============================================================================

export const TYPOGRAPHY = {
	// Font families
	fontFamilies: {
		primary: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
		monospace: "'Fira Code', 'Consolas', 'Monaco', monospace",
	},

	// Font sizes
	fontSizes: {
		xs: '0.75rem', // 12px
		sm: '0.875rem', // 14px
		base: '1rem', // 16px
		lg: '1.125rem', // 18px
		xl: '1.25rem', // 20px
		'2xl': '1.5rem', // 24px
		'3xl': '1.875rem', // 30px
	},

	// Font weights
	fontWeights: {
		normal: 400,
		medium: 500,
		semibold: 600,
		bold: 700,
	},

	// Line heights
	lineHeights: {
		tight: 1.25,
		normal: 1.5,
		relaxed: 1.75,
	},
};

// ============================================================================
// Spacing Standards
// ============================================================================

export const SPACING = {
	// Standard spacing scale (rem)
	xs: '0.25rem', // 4px
	sm: '0.5rem', // 8px
	md: '1rem', // 16px
	lg: '1.5rem', // 24px
	xl: '2rem', // 32px
	'2xl': '3rem', // 48px

	// Component-specific spacing
	button: {
		paddingX: {
			small: '0.75rem',
			medium: '1rem',
			large: '1.5rem',
		},
		paddingY: {
			small: '0.5rem',
			medium: '0.625rem',
			large: '0.75rem',
		},
		gap: '0.5rem', // Space between icon and text
	},

	messageBox: {
		padding: '1rem',
		gap: '0.75rem',
		marginBottom: '1rem',
	},

	section: {
		padding: '1.5rem',
		marginBottom: '1.5rem',
		gap: '1rem',
	},
};

// ============================================================================
// Border and Radius Standards
// ============================================================================

export const BORDERS = {
	radius: {
		none: '0',
		sm: '0.25rem', // 4px
		md: '0.5rem', // 8px
		lg: '0.75rem', // 12px
		xl: '1rem', // 16px
		full: '9999px',
	},

	width: {
		thin: '1px',
		medium: '2px',
		thick: '3px',
	},

	colors: {
		default: '#d1d5db',
		hover: '#9ca3af',
		focus: '#3b82f6',
	},
};

// ============================================================================
// Animation Standards
// ============================================================================

export const ANIMATIONS = {
	// Transition durations
	duration: {
		fast: '150ms',
		normal: '300ms',
		slow: '500ms',
	},

	// Easing functions
	easing: {
		default: 'ease',
		in: 'ease-in',
		out: 'ease-out',
		inOut: 'ease-in-out',
	},

	// Common transitions
	transitions: {
		color: 'color 150ms ease',
		background: 'background-color 150ms ease',
		transform: 'transform 300ms ease',
		opacity: 'opacity 300ms ease',
		all: 'all 300ms ease',
	},

	// Collapsible section animation
	collapse: {
		duration: '300ms',
		easing: 'ease-in-out',
		properties: ['max-height', 'opacity'],
	},

	// Button hover animation
	buttonHover: {
		duration: '150ms',
		easing: 'ease',
		transform: 'translateY(-2px)',
	},
};

// ============================================================================
// Shadow Standards
// ============================================================================

export const SHADOWS = {
	none: 'none',
	sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
	md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
	lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
	xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
	inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
};

// ============================================================================
// Z-Index Standards
// ============================================================================

export const Z_INDEX = {
	base: 1,
	dropdown: 10,
	modal: 50,
	overlay: 100,
	notification: 200,
	tooltip: 300,
};

// ============================================================================
// Breakpoints (for responsive design)
// ============================================================================

export const BREAKPOINTS = {
	sm: '640px',
	md: '768px',
	lg: '1024px',
	xl: '1280px',
	'2xl': '1536px',
};

// ============================================================================
// Button State Standards
// ============================================================================

/**
 * Button state management rules:
 * 1. Only one action can be in progress at a time per page/section
 * 2. Buttons should be disabled during any async operation
 * 3. Buttons should show loading state during their operation
 * 4. Buttons should be progressively enabled based on prerequisites
 * 5. Buttons should be hidden if their action is not applicable
 */
export const BUTTON_STATE_RULES = {
	singleActionAtTime: true,
	disableDuringProgress: true,
	showLoadingState: true,
	progressiveEnablement: true,
	contextAwareVisibility: true,
};

// ============================================================================
// Section Standards
// ============================================================================

/**
 * Section standards:
 * 1. All major sections should be collapsible
 * 2. Collapsed state should be persisted in localStorage
 * 3. Sections should have consistent styling (border, padding, spacing)
 * 4. Sections should animate smoothly (300ms ease-in-out)
 * 5. Sections should have clear headers with icons
 */
export const SECTION_STANDARDS = {
	collapsible: true,
	persistState: true,
	animationDuration: '300ms',
	animationEasing: 'ease-in-out',
	borderRadius: '8px',
	padding: '1.5rem',
	marginBottom: '1.5rem',
	headerHeight: '3rem',
};

// ============================================================================
// Export all standards as a single object (optional convenience)
// ============================================================================

export const UI_STANDARDS = {
	buttonColors: BUTTON_COLORS,
	messageColors: MESSAGE_COLORS,
	typography: TYPOGRAPHY,
	spacing: SPACING,
	borders: BORDERS,
	animations: ANIMATIONS,
	shadows: SHADOWS,
	zIndex: Z_INDEX,
	breakpoints: BREAKPOINTS,
	buttonStateRules: BUTTON_STATE_RULES,
	sectionStandards: SECTION_STANDARDS,
};

export default UI_STANDARDS;
