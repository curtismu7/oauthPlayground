/**
 * @file BootstrapIcon.tsx
 * @module components
 * @description Centralized Bootstrap Icon Component for Bootstrap-based UI
 * @version 1.0.0
 * 
 * This component provides a consistent way to render Bootstrap Icons
 * across the entire application for PingOne UI Bootstrap migration.
 */

import React from 'react';

interface BootstrapIconProps {
	icon: string;
	size?: number;
	className?: string;
	'aria-label'?: string;
	'aria-hidden'?: boolean;
	style?: React.CSSProperties;
	color?: string;
}

/**
 * Centralized Bootstrap Icon Component
 * 
 * Renders Bootstrap Icons using CSS classes. This component ensures
 * consistent icon rendering across the entire application for Bootstrap-based UI.
 * 
 * @param props - Component props
 * @param props.icon - Bootstrap icon name (without 'bi-' prefix)
 * @param props.size - Icon size in pixels (default: 16)
 * @param props.className - Additional CSS classes
 * @param props.ariaLabel - Accessibility label for screen readers
 * @param props.ariaHidden - Whether icon should be hidden from screen readers
 * @param props.style - Additional inline styles
 * @param props.color - Icon color (will be added to style)
 * 
 * @returns JSX element with Bootstrap icon
 */
const BootstrapIcon: React.FC<BootstrapIconProps> = ({
	icon,
	size = 16,
	className = '',
	'aria-label': ariaLabel,
	'aria-hidden': ariaHidden,
	style,
	color,
}) => {
	// Ensure icon doesn't have 'bi-' prefix (avoid double prefix)
	const cleanIcon = icon.startsWith('bi-') ? icon.substring(3) : icon;
	
	// Build inline styles
	const iconStyle: React.CSSProperties = {
		fontSize: `${size}px`,
		...style,
	};
	
	// Add color if provided
	if (color) {
		iconStyle.color = color;
	}
	
	return (
		<i
			className={`bi bi-${cleanIcon} ${className}`}
			style={iconStyle}
			aria-label={ariaLabel}
			aria-hidden={ariaHidden}
		/>
	);
};

export default BootstrapIcon;
