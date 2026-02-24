/**
 * @file MDIIcon.tsx
 * @module components
 * @description Centralized MDI Icon Component for Material Design Icons
 * @version 1.0.0
 *
 * This component provides a consistent way to render Material Design Icons
 * across the entire application. All components should use this centralized
 * MDIIcon component instead of defining their own.
 */

import React from 'react';

interface MDIIconProps {
	icon: string;
	size?: number;
	className?: string;
	'aria-label'?: string;
	'aria-hidden'?: boolean;
	style?: React.CSSProperties;
	color?: string;
}

/**
 * Centralized MDI Icon Component
 *
 * Renders Material Design Icons using CSS classes. This component ensures
 * consistent icon rendering across the entire application.
 *
 * @param props - Component props
 * @param props.icon - MDI icon name (without 'mdi-' prefix)
 * @param props.size - Icon size in pixels (default: 20)
 * @param props.className - Additional CSS classes
 * @param props.ariaLabel - Accessibility label for screen readers
 * @param props.ariaHidden - Whether icon should be hidden from screen readers
 * @param props.style - Additional inline styles
 * @param props.color - Icon color (will be added to style)
 *
 * @returns JSX element with MDI icon
 */
const MDIIcon: React.FC<MDIIconProps> = ({
	icon,
	size = 20,
	className = '',
	'aria-label': ariaLabel,
	'aria-hidden': ariaHidden,
	style,
	color,
}) => {
	// Ensure icon doesn't have 'mdi-' prefix (avoid double prefix)
	const cleanIcon = icon.startsWith('mdi-') ? icon.substring(4) : icon;

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
		<span
			className={`mdi mdi-${cleanIcon} ${className}`}
			style={iconStyle}
			aria-label={ariaLabel}
			aria-hidden={ariaHidden}
		/>
	);
};

export default MDIIcon;
