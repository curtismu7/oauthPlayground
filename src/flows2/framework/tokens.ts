// src/flows2/framework/tokens.ts
//
// Design tokens for the flows2 framework. Single source of truth for the palette,
// spacing scale, and border-radius values. Import this instead of hardcoding hex.

export const tokens = {
	color: {
		// Primary brand (navy)
		primary: '#1e3a8a',
		primaryHover: '#1e40af',
		primarySubtle: '#eff6ff',
		primaryBorder: '#bfdbfe',

		// Signature accent (electric teal) — the look-and-feel anchor adopted from
		// the /v2/flows/authorization-code reference. Used on action buttons,
		// active pills, and the signature FlowDiagram.
		accent: '#14b8a6',
		accentHover: '#0d9488',
		accentBg: '#f0fdfa',

		// Neutral scale (reference DESIGN palette)
		neutral100: '#f9fafb',
		neutral300: '#e5e7eb',
		neutral600: '#4b5563',

		// Text hierarchy
		text: '#0f172a',
		textMuted: '#475569',
		textSecondary: '#334155',

		// Borders
		border: '#e2e8f0',
		borderSubtle: '#cbd5e1',

		// Backgrounds
		bg: '#ffffff',
		bgSubtle: '#f8fafc',
		bgAccent: '#eff6ff',

		// Success
		success: '#16a34a',
		successHover: '#15803d',
		successBg: '#f0fdf4',
		successBorder: '#bbf7d0',

		// Error
		error: '#dc2626',
		errorMuted: '#991b1b',
		errorBg: '#fef2f2',
		errorBorder: '#fecaca',

		// Code block
		codeBg: '#0f172a',
		codeText: '#e2e8f0',
		codeBorder: '#1e293b',
	},
	space: {
		xs: '0.25rem',
		sm: '0.5rem',
		md: '0.75rem',
		lg: '1rem',
		xl: '1.25rem',
		'2xl': '1.5rem',
		'3xl': '2rem',
	},
	radius: {
		sm: '6px',
		md: '8px',
		lg: '10px',
		xl: '14px',
		pill: '999px',
	},
} as const;
