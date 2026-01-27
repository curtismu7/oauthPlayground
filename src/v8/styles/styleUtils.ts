/**
 * @file styleUtils.ts
 * @module v8/styles
 * @description Style Utility Functions for V3 Architecture
 * @version 3.0.0
 *
 * Utility functions to make it easy to use design tokens in React components.
 * Provides helpers for common styling patterns and reduces inline style verbosity.
 */

import { CSSProperties } from 'react';
import {
	borderRadius,
	colors,
	components,
	shadows,
	spacing,
	transitions,
	typography,
} from './designTokens';

// ============================================================================
// LAYOUT UTILITIES
// ============================================================================

/**
 * Create flexbox layout styles
 */
export const flex = {
	row: (align?: string, justify?: string): CSSProperties => ({
		display: 'flex',
		flexDirection: 'row',
		alignItems: align || 'center',
		justifyContent: justify || 'flex-start',
	}),

	column: (align?: string, justify?: string): CSSProperties => ({
		display: 'flex',
		flexDirection: 'column',
		alignItems: align || 'flex-start',
		justifyContent: justify || 'flex-start',
	}),

	center: (): CSSProperties => ({
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
	}),

	between: (): CSSProperties => ({
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
	}),
};

/**
 * Create gap spacing
 */
export const gap = (size: keyof typeof spacing): CSSProperties => ({
	gap: spacing[size],
});

/**
 * Create padding styles
 */
export const padding = {
	all: (size: keyof typeof spacing): CSSProperties => ({
		padding: spacing[size],
	}),

	x: (size: keyof typeof spacing): CSSProperties => ({
		paddingLeft: spacing[size],
		paddingRight: spacing[size],
	}),

	y: (size: keyof typeof spacing): CSSProperties => ({
		paddingTop: spacing[size],
		paddingBottom: spacing[size],
	}),

	top: (size: keyof typeof spacing): CSSProperties => ({
		paddingTop: spacing[size],
	}),

	bottom: (size: keyof typeof spacing): CSSProperties => ({
		paddingBottom: spacing[size],
	}),

	left: (size: keyof typeof spacing): CSSProperties => ({
		paddingLeft: spacing[size],
	}),

	right: (size: keyof typeof spacing): CSSProperties => ({
		paddingRight: spacing[size],
	}),
};

/**
 * Create margin styles
 */
export const margin = {
	all: (size: keyof typeof spacing): CSSProperties => ({
		margin: spacing[size],
	}),

	x: (size: keyof typeof spacing): CSSProperties => ({
		marginLeft: spacing[size],
		marginRight: spacing[size],
	}),

	y: (size: keyof typeof spacing): CSSProperties => ({
		marginTop: spacing[size],
		marginBottom: spacing[size],
	}),

	top: (size: keyof typeof spacing): CSSProperties => ({
		marginTop: spacing[size],
	}),

	bottom: (size: keyof typeof spacing): CSSProperties => ({
		marginBottom: spacing[size],
	}),

	left: (size: keyof typeof spacing): CSSProperties => ({
		marginLeft: spacing[size],
	}),

	right: (size: keyof typeof spacing): CSSProperties => ({
		marginRight: spacing[size],
	}),
};

// ============================================================================
// COMPONENT STYLE BUILDERS
// ============================================================================

/**
 * Create button styles
 */
export const button = {
	primary: (disabled = false): CSSProperties => ({
		padding: components.button.padding.base,
		border: 'none',
		borderRadius: components.button.borderRadius,
		background: disabled ? colors.gray[400] : colors.primary[500],
		color: colors.text.inverse,
		cursor: disabled ? 'not-allowed' : 'pointer',
		fontWeight: components.button.fontWeight,
		fontSize: components.button.fontSize.base,
		transition: transitions.base,
		opacity: disabled ? 0.6 : 1,
	}),

	success: (disabled = false): CSSProperties => ({
		padding: components.button.padding.base,
		border: 'none',
		borderRadius: components.button.borderRadius,
		background: disabled ? colors.gray[400] : colors.success[500],
		color: colors.text.inverse,
		cursor: disabled ? 'not-allowed' : 'pointer',
		fontWeight: components.button.fontWeight,
		fontSize: components.button.fontSize.base,
		transition: transitions.base,
		opacity: disabled ? 0.6 : 1,
	}),

	warning: (disabled = false): CSSProperties => ({
		padding: components.button.padding.base,
		border: 'none',
		borderRadius: components.button.borderRadius,
		background: disabled ? colors.gray[400] : colors.warning[500],
		color: colors.text.inverse,
		cursor: disabled ? 'not-allowed' : 'pointer',
		fontWeight: components.button.fontWeight,
		fontSize: components.button.fontSize.base,
		transition: transitions.base,
		opacity: disabled ? 0.6 : 1,
	}),

	error: (disabled = false): CSSProperties => ({
		padding: components.button.padding.base,
		border: 'none',
		borderRadius: components.button.borderRadius,
		background: disabled ? colors.gray[400] : colors.error[600],
		color: colors.text.inverse,
		cursor: disabled ? 'not-allowed' : 'pointer',
		fontWeight: components.button.fontWeight,
		fontSize: components.button.fontSize.base,
		transition: transitions.base,
		opacity: disabled ? 0.6 : 1,
	}),

	secondary: (disabled = false): CSSProperties => ({
		padding: components.button.padding.base,
		border: `1px solid ${colors.border.medium}`,
		borderRadius: components.button.borderRadius,
		background: colors.background.primary,
		color: colors.text.secondary,
		cursor: disabled ? 'not-allowed' : 'pointer',
		fontWeight: components.button.fontWeight,
		fontSize: components.button.fontSize.base,
		transition: transitions.base,
		opacity: disabled ? 0.6 : 1,
	}),
};

/**
 * Create input styles
 */
export const input = {
	base: (disabled = false): CSSProperties => ({
		width: '100%',
		padding: components.input.padding,
		border: components.input.border,
		borderRadius: components.input.borderRadius,
		fontSize: components.input.fontSize,
		outline: 'none',
		opacity: disabled ? 0.6 : 1,
		cursor: disabled ? 'not-allowed' : 'text',
	}),
};

/**
 * Create card styles
 */
export const card = {
	base: (): CSSProperties => ({
		background: components.card.background,
		borderRadius: components.card.borderRadius,
		padding: components.card.padding,
		boxShadow: components.card.shadow,
		border: components.card.border,
		marginBottom: components.section.marginBottom,
	}),

	interactive: (): CSSProperties => ({
		...card.base(),
		cursor: 'pointer',
		transition: transitions.base,
	}),
};

/**
 * Create badge/status styles
 */
export const badge = {
	success: (): CSSProperties => ({
		display: 'inline-block',
		padding: `${spacing[1]} ${spacing[2]}`,
		borderRadius: borderRadius.sm,
		fontSize: typography.fontSize.xs,
		fontWeight: typography.fontWeight.medium,
		background: colors.success[100],
		color: colors.success[800],
	}),

	warning: (): CSSProperties => ({
		display: 'inline-block',
		padding: `${spacing[1]} ${spacing[2]}`,
		borderRadius: borderRadius.sm,
		fontSize: typography.fontSize.xs,
		fontWeight: typography.fontWeight.medium,
		background: colors.warning[100],
		color: colors.warning[800],
	}),

	error: (): CSSProperties => ({
		display: 'inline-block',
		padding: `${spacing[1]} ${spacing[2]}`,
		borderRadius: borderRadius.sm,
		fontSize: typography.fontSize.xs,
		fontWeight: typography.fontWeight.medium,
		background: colors.error[100],
		color: colors.error[800],
	}),

	info: (): CSSProperties => ({
		display: 'inline-block',
		padding: `${spacing[1]} ${spacing[2]}`,
		borderRadius: borderRadius.sm,
		fontSize: typography.fontSize.xs,
		fontWeight: typography.fontWeight.medium,
		background: colors.info[100],
		color: colors.info[800],
	}),

	neutral: (): CSSProperties => ({
		display: 'inline-block',
		padding: `${spacing[1]} ${spacing[2]}`,
		borderRadius: borderRadius.sm,
		fontSize: typography.fontSize.xs,
		fontWeight: typography.fontWeight.medium,
		background: colors.gray[100],
		color: colors.gray[700],
	}),
};

/**
 * Create alert/message box styles
 */
export const alert = {
	success: (): CSSProperties => ({
		padding: `${spacing[3]} ${spacing[4]}`,
		background: colors.success[50],
		border: `1px solid ${colors.success[500]}`,
		borderRadius: borderRadius.base,
		fontSize: typography.fontSize.base,
		color: colors.success[800],
	}),

	warning: (): CSSProperties => ({
		padding: `${spacing[3]} ${spacing[4]}`,
		background: colors.warning[50],
		border: `1px solid ${colors.warning[400]}`,
		borderRadius: borderRadius.base,
		fontSize: typography.fontSize.base,
		color: colors.warning[800],
	}),

	error: (): CSSProperties => ({
		padding: `${spacing[3]} ${spacing[4]}`,
		background: colors.error[50],
		border: `1px solid ${colors.error[600]}`,
		borderRadius: borderRadius.base,
		fontSize: typography.fontSize.base,
		color: colors.error[800],
	}),

	info: (): CSSProperties => ({
		padding: `${spacing[3]} ${spacing[4]}`,
		background: colors.info[50],
		border: `1px solid ${colors.info[500]}`,
		borderRadius: borderRadius.base,
		fontSize: typography.fontSize.base,
		color: colors.info[800],
	}),
};

// ============================================================================
// TEXT UTILITIES
// ============================================================================

/**
 * Create text styles
 */
export const text = {
	heading: (level: 1 | 2 | 3 = 2): CSSProperties => ({
		fontSize:
			level === 1
				? typography.fontSize['2xl']
				: level === 2
					? typography.fontSize.xl
					: typography.fontSize.lg,
		fontWeight: typography.fontWeight.semibold,
		color: colors.text.primary,
		margin: 0,
	}),

	body: (): CSSProperties => ({
		fontSize: typography.fontSize.base,
		color: colors.text.primary,
		lineHeight: typography.lineHeight.normal,
	}),

	secondary: (): CSSProperties => ({
		fontSize: typography.fontSize.sm,
		color: colors.text.secondary,
		lineHeight: typography.lineHeight.normal,
	}),

	label: (): CSSProperties => ({
		display: 'block',
		fontSize: typography.fontSize.base,
		fontWeight: typography.fontWeight.medium,
		color: colors.text.secondary,
		marginBottom: spacing[2],
	}),
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Merge multiple style objects
 */
export const mergeStyles = (...styles: (CSSProperties | undefined)[]): CSSProperties => {
	return Object.assign({}, ...styles.filter(Boolean));
};

/**
 * Create conditional styles
 */
export const conditionalStyle = (
	condition: boolean,
	trueStyle: CSSProperties,
	falseStyle?: CSSProperties
): CSSProperties => {
	return condition ? trueStyle : falseStyle || {};
};

/**
 * Create focus styles
 */
export const focusStyles = (
	color: 'primary' | 'success' | 'warning' | 'error' = 'primary'
): CSSProperties => ({
	outline: 'none',
	boxShadow:
		shadows[`focus${color.charAt(0).toUpperCase() + color.slice(1)}` as keyof typeof shadows] ||
		shadows.focus,
});

// ============================================================================
// EXPORT ALL UTILITIES
// ============================================================================

export const styleUtils = {
	flex,
	gap,
	padding,
	margin,
	button,
	input,
	card,
	badge,
	alert,
	text,
	mergeStyles,
	conditionalStyle,
	focusStyles,
};

export default styleUtils;
