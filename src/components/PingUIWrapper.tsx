/**
 * @file PingUIWrapper.tsx
 * @module components
 * @description Wrapper component to apply Ping UI namespace to all content
 * @version 1.1.0
 * @since 2025-02-20
 */

import React from 'react';
import './PingUIWrapper.css';

interface PingUIWrapperProps {
	children: React.ReactNode;
	className?: string;
}

/**
 * Ping UI Wrapper Component
 *
 * Applies the end-user-nano CSS namespace to all child components
 * to enable Ping UI styling throughout the application.
 *
 * This wrapper ensures all content within the main application area
 * adheres to Ping UI design standards and styling.
 */
export const PingUIWrapper: React.FC<PingUIWrapperProps> = ({
	children,
	className = 'end-user-nano',
}) => {
	return <div className={className}>{children}</div>;
};

export default PingUIWrapper;
