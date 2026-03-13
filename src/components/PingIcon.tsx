// src/components/PingIcon.tsx
// Uses Ping Icons from https://assets.pingone.com/ux/astro-nano/0.1.0-alpha.11/icons.css
// Renders .mdi and .mdi-* classes so icons match the official Ping Astro Nano set.

import React from 'react';

/** Maps semantic icon names to Ping Astro Nano .mdi-* class names (icons.css) */
const MDI_ICON_MAP: Record<string, string> = {
	FiCpu: 'mdi-face-agent',
	FiKey: 'mdi-account-key-outline',
	FiLock: 'mdi-fingerprint',
	FiServer: 'mdi-server',
	FiShield: 'mdi-flag',
	FiZap: 'mdi-lightning-bolt',
	FiCheck: 'mdi-check-circle',
	FiX: 'mdi-alert-circle',
	FiInfo: 'mdi-info',
	FiSearch: 'mdi-eye-outline',
	FiBook: 'mdi-book-open-page-variant',
	FiBookOpen: 'mdi-book-open-page-variant',
	FiCode: 'mdi-code-braces',
	FiExternalLink: 'mdi-open-in-new',
	FiLayers: 'mdi-puzzle-outline',
	FiUsers: 'mdi-face-agent',
};

export interface PingIconProps {
	icon: string;
	size?: number;
	ariaLabel?: string;
	className?: string;
	style?: React.CSSProperties;
}

/**
 * Renders a Ping Icon using the official Ping Astro Nano icons (icons.css).
 * Use semantic names (e.g. FiCpu, FiKey) which map to .mdi-* classes.
 */
export const PingIcon: React.FC<PingIconProps> = ({
	icon,
	size = 20,
	ariaLabel,
	className = '',
	style = {},
}) => {
	const mdiClass = MDI_ICON_MAP[icon] || 'mdi-info';
	return (
		<i
			className={`mdi ${mdiClass} ${className}`.trim()}
			style={{ fontSize: `${size}px`, ...style }}
			{...(ariaLabel ? { 'aria-label': ariaLabel } : { 'aria-hidden': true })}
		/>
	);
};

export default PingIcon;
