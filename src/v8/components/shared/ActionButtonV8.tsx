/**
 * @file ActionButtonV8.tsx
 * @module v8/components/shared
 * @description Shared action button component for consistent styling across Unified and MFA flows
 * @version 1.0.0
 */

import React, { type CSSProperties } from 'react';

export type ButtonVariant =
	| 'primary'
	| 'secondary'
	| 'success'
	| 'warning'
	| 'danger'
	| 'info'
	| 'purple'
	| 'orange'
	| 'teal';
export type ButtonSize = 'small' | 'medium' | 'large';

export interface ActionButtonProps {
	/** Button click handler */
	onClick: () => void;
	/** Visual style variant */
	variant?: ButtonVariant;
	/** Button size */
	size?: ButtonSize;
	/** Button content */
	children: React.ReactNode;
	/** Optional icon to display before text */
	icon?: React.ReactNode;
	/** Optional icon to display after text */
	iconAfter?: React.ReactNode;
	/** Whether button is disabled */
	disabled?: boolean;
	/** Whether button is in loading state */
	isLoading?: boolean;
	/** Whether button should take full width */
	fullWidth?: boolean;
	/** Optional tooltip text */
	title?: string;
	/** Optional custom styles */
	style?: CSSProperties;
	/** Optional CSS class name */
	className?: string;
	/** Button type attribute */
	type?: 'button' | 'submit' | 'reset';
}

/**
 * Predefined button color schemes
 */
const variants: Record<ButtonVariant, { bg: string; hover: string; color: string }> = {
	primary: {
		bg: '#3b82f6',
		hover: '#2563eb',
		color: 'white',
	},
	secondary: {
		bg: '#64748b',
		hover: '#475569',
		color: 'white',
	},
	success: {
		bg: '#10b981',
		hover: '#059669',
		color: 'white',
	},
	warning: {
		bg: '#f59e0b',
		hover: '#d97706',
		color: 'white',
	},
	danger: {
		bg: '#ef4444',
		hover: '#dc2626',
		color: 'white',
	},
	info: {
		bg: '#06b6d4',
		hover: '#0891b2',
		color: 'white',
	},
	purple: {
		bg: '#8b5cf6',
		hover: '#7c3aed',
		color: 'white',
	},
	orange: {
		bg: '#f59e0b',
		hover: '#d97706',
		color: 'white',
	},
	teal: {
		bg: '#14b8a6',
		hover: '#0d9488',
		color: 'white',
	},
};

/**
 * Button size configurations
 */
const sizes: Record<ButtonSize, { padding: string; fontSize: string; iconSize: string }> = {
	small: {
		padding: '6px 12px',
		fontSize: '13px',
		iconSize: '14px',
	},
	medium: {
		padding: '8px 16px',
		fontSize: '14px',
		iconSize: '16px',
	},
	large: {
		padding: '12px 24px',
		fontSize: '16px',
		iconSize: '18px',
	},
};

/**
 * Shared action button component with consistent styling
 *
 * @example
 * // Primary button with icon
 * <ActionButtonV8
 *   onClick={() => handleSubmit()}
 *   variant="primary"
 *   icon={<FiCheck size={16} />}
 * >
 *   Submit
 * </ActionButtonV8>
 *
 * @example
 * // Button with loading state
 * <ActionButtonV8
 *   onClick={() => handleAsync()}
 *   variant="primary"
 *   isLoading={isProcessing}
 * >
 *   Get Token
 * </ActionButtonV8>
 *
 * @example
 * // Success button, full width
 * <ActionButtonV8
 *   onClick={() => handleComplete()}
 *   variant="success"
 *   fullWidth
 * >
 *   Complete
 * </ActionButtonV8>
 */
export const ActionButtonV8: React.FC<ActionButtonProps> = ({
	onClick,
	variant = 'primary',
	size = 'medium',
	children,
	icon,
	iconAfter,
	disabled = false,
	isLoading = false,
	fullWidth = false,
	title,
	style = {},
	className = '',
	type = 'button',
}) => {
	const [isHovered, setIsHovered] = React.useState(false);

	const variantStyle = variants[variant];
	const sizeStyle = sizes[size];

	// Button is effectively disabled if disabled prop or loading
	const isDisabled = disabled || isLoading;

	const buttonStyle: CSSProperties = {
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		gap: '6px',
		padding: sizeStyle.padding,
		background: isDisabled ? '#d1d5db' : isHovered ? variantStyle.hover : variantStyle.bg,
		color: isDisabled ? '#9ca3af' : variantStyle.color,
		border: 'none',
		borderRadius: '8px',
		fontSize: sizeStyle.fontSize,
		fontWeight: '600',
		cursor: isDisabled ? 'not-allowed' : 'pointer',
		transition: 'all 0.2s ease',
		boxShadow: isDisabled
			? 'none'
			: isHovered
				? `0 4px 8px rgba(0, 0, 0, 0.15)`
				: `0 2px 4px rgba(0, 0, 0, 0.1)`,
		transform: isDisabled ? 'none' : isHovered ? 'translateY(-1px)' : 'none',
		width: fullWidth ? '100%' : 'auto',
		opacity: isDisabled ? 0.6 : 1,
		position: 'relative',
		...style,
	};

	// Spinner styles
	const spinnerStyle: CSSProperties = {
		display: 'inline-block',
		width: sizeStyle.iconSize,
		height: sizeStyle.iconSize,
		border: `2px solid ${variantStyle.color}`,
		borderTopColor: 'transparent',
		borderRadius: '50%',
		animation: 'spin 0.8s linear infinite',
	};

	return (
		<>
			{/* Add keyframes for spinner animation */}
			<style>{`
				@keyframes spin {
					to { transform: rotate(360deg); }
				}
			`}</style>

			<button
				type={type}
				onClick={isDisabled ? undefined : onClick}
				onMouseEnter={() => !isDisabled && setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
				title={title}
				disabled={isDisabled}
				style={buttonStyle}
				className={className}
			>
				{isLoading ? (
					<>
						<span style={spinnerStyle} />
						<span style={{ visibility: 'hidden', position: 'absolute' }}>
							{icon && <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>}
							{children}
							{iconAfter && (
								<span style={{ display: 'flex', alignItems: 'center' }}>{iconAfter}</span>
							)}
						</span>
						Loading...
					</>
				) : (
					<>
						{icon && <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>}
						{children}
						{iconAfter && (
							<span style={{ display: 'flex', alignItems: 'center' }}>{iconAfter}</span>
						)}
					</>
				)}
			</button>
		</>
	);
};

/**
 * Helper function to create a button with predefined variant
 */
export const createButtonVariant = (variant: ButtonVariant) => {
	return (props: Omit<ActionButtonProps, 'variant'>) => (
		<ActionButtonV8 {...props} variant={variant} />
	);
};

// Convenience exports for common button types
export const PrimaryButton = createButtonVariant('primary');
export const SecondaryButton = createButtonVariant('secondary');
export const SuccessButton = createButtonVariant('success');
export const WarningButton = createButtonVariant('warning');
export const DangerButton = createButtonVariant('danger');
export const InfoButton = createButtonVariant('info');
export const PurpleButton = createButtonVariant('purple');
export const OrangeButton = createButtonVariant('orange');
export const TealButton = createButtonVariant('teal');
