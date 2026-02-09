/**
 * @file Button.tsx
 * @module v8/components
 * @description Reusable button component with variants and sizes
 * @version 9.1.0
 */

import React, { ButtonHTMLAttributes } from 'react';
import { borderRadius, colors, spacing, transitions, typography } from '@/v8/design/tokens';
import { LoadingSpinner } from './LoadingSpinner';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
	size?: 'sm' | 'md' | 'lg';
	fullWidth?: boolean;
	loading?: boolean;
	leftIcon?: React.ReactNode;
	rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
	variant = 'primary',
	size = 'md',
	fullWidth = false,
	loading = false,
	leftIcon,
	rightIcon,
	children,
	disabled,
	style,
	...props
}) => {
	const variantStyles = {
		primary: {
			background: colors.primary[500],
			color: 'white',
			border: 'none',
			hover: colors.primary[600],
		},
		secondary: {
			background: colors.neutral[100],
			color: colors.neutral[900],
			border: `1px solid ${colors.neutral[300]}`,
			hover: colors.neutral[200],
		},
		outline: {
			background: 'transparent',
			color: colors.primary[500],
			border: `2px solid ${colors.primary[500]}`,
			hover: colors.primary[50],
		},
		ghost: {
			background: 'transparent',
			color: colors.neutral[700],
			border: 'none',
			hover: colors.neutral[100],
		},
		danger: {
			background: colors.error[500],
			color: 'white',
			border: 'none',
			hover: colors.error[600],
		},
	};

	const sizeStyles = {
		sm: {
			padding: `${spacing.sm} ${spacing.md}`,
			fontSize: typography.fontSize.sm,
			height: '36px',
		},
		md: {
			padding: `${spacing.md} ${spacing.lg}`,
			fontSize: typography.fontSize.base,
			height: '44px',
		},
		lg: {
			padding: `${spacing.lg} ${spacing.xl}`,
			fontSize: typography.fontSize.lg,
			height: '52px',
		},
	};

	const currentVariant = variantStyles[variant];
	const currentSize = sizeStyles[size];

	const [isHovered, setIsHovered] = React.useState(false);

	return (
		<button
			{...props}
			disabled={disabled || loading}
			onMouseEnter={(e) => {
				setIsHovered(true);
				props.onMouseEnter?.(e);
			}}
			onMouseLeave={(e) => {
				setIsHovered(false);
				props.onMouseLeave?.(e);
			}}
			style={{
				display: 'inline-flex',
				alignItems: 'center',
				justifyContent: 'center',
				gap: spacing.sm,
				width: fullWidth ? '100%' : 'auto',
				...currentSize,
				background:
					isHovered && !disabled && !loading ? currentVariant.hover : currentVariant.background,
				color: currentVariant.color,
				border: currentVariant.border,
				borderRadius: borderRadius.md,
				fontWeight: typography.fontWeight.semibold,
				cursor: disabled || loading ? 'not-allowed' : 'pointer',
				opacity: disabled || loading ? 0.6 : 1,
				transition: `all ${transitions.base} ease`,
				fontFamily: typography.fontFamily.sans,
				...style,
			}}
		>
			{loading && (
				<LoadingSpinner
					size="small"
					color={variant === 'outline' ? colors.primary[500] : 'white'}
				/>
			)}
			{!loading && leftIcon}
			{children}
			{!loading && rightIcon}
		</button>
	);
};
