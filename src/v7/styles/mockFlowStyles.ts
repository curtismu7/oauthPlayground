// src/v7/styles/mockFlowStyles.ts
// Centralized styles for Mock Flows so all flows look and behave consistently.

import type { CSSProperties } from 'react';

/** Page wrapper for Mock Flow pages */
export const MOCK_FLOW_CONTAINER_STYLE: CSSProperties = {
	padding: 24,
};

/** Educational Mock banner wrapper (yellow strip) */
export const MOCK_FLOW_BANNER_STYLE: CSSProperties = {
	background: '#fef3c7',
	border: '1px solid #fbbf24',
	borderRadius: 8,
	padding: 12,
	marginBottom: 16,
};

/** Banner description paragraph */
export const MOCK_FLOW_BANNER_DESC_STYLE: CSSProperties = {
	margin: '8px 0 0 0',
	fontSize: 14,
};

/** Section card wrapper (bordered block) */
export const MOCK_SECTION_STYLE: CSSProperties = {
	marginTop: 16,
	border: '1px solid #e5e7eb',
	borderRadius: 8,
};

/** Section header bar padding/layout; background comes from variant */
export const MOCK_SECTION_HEADER_BASE: CSSProperties = {
	padding: '10px 12px',
	display: 'flex',
	alignItems: 'center',
	gap: 8,
};

export type SectionHeaderVariant = 'default' | 'info' | 'success' | 'warning';

/** Light blue used for all section headers so collapse icons and header colors are consistent across Mock flows. */
const MOCK_SECTION_HEADER_LIGHT_BLUE = '#dbeafe';

const SECTION_HEADER_BACKGROUNDS: Record<SectionHeaderVariant, string> = {
	default: MOCK_SECTION_HEADER_LIGHT_BLUE,
	info: MOCK_SECTION_HEADER_LIGHT_BLUE,
	success: MOCK_SECTION_HEADER_LIGHT_BLUE,
	warning: MOCK_SECTION_HEADER_LIGHT_BLUE,
};

/** Section header style for a given variant */
export function getSectionHeaderStyle(variant: SectionHeaderVariant = 'default'): CSSProperties {
	return {
		...MOCK_SECTION_HEADER_BASE,
		background: SECTION_HEADER_BACKGROUNDS[variant],
	};
}

/** Section body (content area inside card) */
export const MOCK_SECTION_BODY_STYLE: CSSProperties = {
	padding: 12,
};

/** Section body with optional max width for forms */
export function getSectionBodyStyle(maxWidth?: number): CSSProperties {
	return maxWidth != null ? { ...MOCK_SECTION_BODY_STYLE, maxWidth } : MOCK_SECTION_BODY_STYLE;
}

/** Text input / select */
export const MOCK_INPUT_STYLE: CSSProperties = {
	display: 'block',
	width: '100%',
	padding: '6px 8px',
	border: '1px solid #cbd5e1',
	borderRadius: 6,
	marginTop: 4,
};

/** Primary action button (e.g. Request Token, Authorize) */
export const MOCK_PRIMARY_BTN: CSSProperties = {
	marginTop: 10,
	padding: '8px 12px',
	borderRadius: 6,
	border: '1px solid #0891b2',
	background: '#06b6d4',
	color: '#fff',
	cursor: 'pointer',
};

/** Secondary button (e.g. Copy, Back) */
export const MOCK_SECONDARY_BTN: CSSProperties = {
	padding: '6px 10px',
	borderRadius: 6,
	border: '1px solid #94a3b8',
	background: '#fff',
	color: '#0f172a',
	cursor: 'pointer',
};

/** Disabled primary button (e.g. when step 3 failed) */
export const MOCK_PRIMARY_BTN_DISABLED: CSSProperties = {
	...MOCK_PRIMARY_BTN,
	background: '#94a3b8',
	borderColor: '#94a3b8',
	cursor: 'not-allowed',
	opacity: 0.8,
};

/** Reset flow button (clears state and returns to first step) */
export const MOCK_RESET_BTN: CSSProperties = {
	padding: '6px 12px',
	borderRadius: 6,
	border: '1px solid #64748b',
	background: '#f1f5f9',
	color: '#475569',
	cursor: 'pointer',
	fontSize: 14,
};

/** Small copy/clipboard button next to code snippets */
export const MOCK_COPY_BTN: CSSProperties = {
	marginLeft: 8,
	padding: '4px 8px',
	borderRadius: 4,
	border: '1px solid #94a3b8',
	background: '#fff',
	color: '#0f172a',
	cursor: 'pointer',
	fontSize: 12,
};
