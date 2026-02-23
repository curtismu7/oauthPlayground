// src/services/configCheckerService.tsx
// Service wrapper for ConfigCheckerButtons that adds collapsible header

import React from 'react';
import { ConfigCheckerButtons } from '../components/ConfigCheckerButtons';
import { CollapsibleHeader } from './collapsibleHeaderService';

// MDI Icon Helper Functions
interface MDIIconProps {
	icon: string;
	size?: number;
	color?: string;
	ariaLabel: string;
}

const getMDIIconClass = (iconName: string): string => {
	const iconMap: Record<string, string> = {
		FiSettings: 'mdi-cog',
	};
	return iconMap[iconName] || 'mdi-help-circle';
};

const MDIIcon: React.FC<MDIIconProps> = ({ icon, size = 24, color, ariaLabel }) => {
	const iconClass = getMDIIconClass(icon);
	return (
		<span
			className={`mdi ${iconClass}`}
			style={{ fontSize: size, color: color }}
			role="img"
			aria-label={ariaLabel}
			aria-hidden={!ariaLabel}
		></span>
	);
};

// Re-export the Props type for convenience
export type ConfigCheckerServiceProps = React.ComponentProps<typeof ConfigCheckerButtons>;

/**
 * ConfigCheckerService - Wraps ConfigCheckerButtons with a collapsible header
 *
 * This service ensures consistent header presentation across all flows.
 */
export const ConfigCheckerService: React.FC<ConfigCheckerServiceProps> = (props) => {
	return (
		<CollapsibleHeader
			title="PingOne Configuration Checker"
			subtitle={
				<>
					<strong>Check Config:</strong> Compare your current flow settings with existing PingOne
					applications to identify differences.
					<br />
					<strong>Create App:</strong> Automatically create a new PingOne application with your
					current configuration.
				</>
			}
			icon={<MDIIcon icon="FiSettings" ariaLabel="Settings" />}
			theme="orange"
		>
			<ConfigCheckerButtons {...props} />
		</CollapsibleHeader>
	);
};

export default ConfigCheckerService;
