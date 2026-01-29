/**
 * @file UnifiedButtonV8U.tsx
 * @module v8u/components
 * @description Clean, consistent button component for all unified pages
 * @version 8.0.0
 * @since 2024-11-27
 *
 * This component provides a clean, consistent button design that can be used
 * across all unified pages to replace the inconsistent inline button styles.
 */

import React from 'react';

interface UnifiedButtonV8UProps {
	children: React.ReactNode;
	onClick?: () => void;
	variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
	size?: 'sm' | 'md' | 'lg';
	disabled?: boolean;
	type?: 'button' | 'submit' | 'reset';
	href?: string;
	target?: string;
	title?: string;
	className?: string;
	style?: React.CSSProperties;
}

export const UnifiedButtonV8U: React.FC<UnifiedButtonV8UProps> = ({
	children,
	onClick,
	variant = 'primary',
	size = 'md',
	disabled = false,
	type = 'button',
	href,
	target,
	title,
	className,
	style,
}) => {
	// Variant styles
	const variantStyles = {
		primary: {
			background: '#3b82f6',
			color: '#ffffff',
			border: '1px solid #3b82f6',
			hoverBackground: '#2563eb',
			hoverBorder: '#2563eb',
			hoverShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
		},
		secondary: {
			background: '#ffffff',
			color: '#374151',
			border: '1px solid #d1d5db',
			hoverBackground: '#f9fafb',
			hoverBorder: '#9ca3af',
			hoverShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
		},
		success: {
			background: '#10b981',
			color: '#ffffff',
			border: '1px solid #10b981',
			hoverBackground: '#059669',
			hoverBorder: '#059669',
			hoverShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
		},
		warning: {
			background: '#f59e0b',
			color: '#ffffff',
			border: '1px solid #f59e0b',
			hoverBackground: '#d97706',
			hoverBorder: '#d97706',
			hoverShadow: '0 4px 12px rgba(245, 158, 11, 0.4)',
		},
		danger: {
			background: '#ef4444',
			color: '#ffffff',
			border: '1px solid #ef4444',
			hoverBackground: '#dc2626',
			hoverBorder: '#dc2626',
			hoverShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
		},
		info: {
			background: '#8b5cf6',
			color: '#ffffff',
			border: '1px solid #8b5cf6',
			hoverBackground: '#7c3aed',
			hoverBorder: '#7c3aed',
			hoverShadow: '0 4px 12px rgba(139, 92, 246, 0.4)',
		},
	};

	// Size styles
	const sizeStyles = {
		sm: {
			padding: '6px 12px',
			fontSize: '13px',
			borderRadius: '6px',
		},
		md: {
			padding: '8px 16px',
			fontSize: '14px',
			borderRadius: '8px',
		},
		lg: {
			padding: '12px 24px',
			fontSize: '16px',
			borderRadius: '10px',
		},
	};

	const currentVariant = variantStyles[variant];
	const currentSize = sizeStyles[size];

	const baseStyle: React.CSSProperties = {
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		gap: '8px',
		fontWeight: '600',
		textDecoration: 'none',
		cursor: disabled ? 'not-allowed' : 'pointer',
		transition: 'all 0.2s ease',
		transform: 'translateY(0)',
		boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
		opacity: disabled ? 0.6 : 1,
		...currentVariant,
		...currentSize,
		...style,
	};

	const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
		if (!disabled) {
			e.currentTarget.style.background = currentVariant.hoverBackground;
			e.currentTarget.style.borderColor = currentVariant.hoverBorder;
			e.currentTarget.style.transform = 'translateY(-1px)';
			e.currentTarget.style.boxShadow = currentVariant.hoverShadow;
		}
	};

	const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
		if (!disabled) {
			e.currentTarget.style.background = currentVariant.background;
			e.currentTarget.style.borderColor = currentVariant.border;
			e.currentTarget.style.transform = 'translateY(0)';
			e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.1)';
		}
	};

	const commonProps = {
		className,
		style: baseStyle,
		onClick,
		title,
		onMouseEnter: handleMouseEnter,
		onMouseLeave: handleMouseLeave,
	};

	if (href && !disabled) {
		return (
			<a
				{...commonProps}
				href={href}
				target={target}
				rel={target === '_blank' ? 'noopener noreferrer' : undefined}
			>
				{children}
			</a>
		);
	}

	return (
		<button {...commonProps} type={type} disabled={disabled}>
			{children}
		</button>
	);
};
