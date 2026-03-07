// src/services/configCheckerService.tsx
// Service wrapper for ConfigCheckerButtons that adds collapsible header

import React from 'react';
import { ConfigCheckerButtons } from '../components/ConfigCheckerButtons';
import { CollapsibleHeader } from './collapsibleHeaderService';

// MDI Icon Component for React Icons migration
const MDIIcon: React.FC<{ icon: string; size?: number; className?: string }> = ({ 
	icon, 
	size = 16, 
	className = '' 
}) => {
	const iconMap: Record<string, string> = {
		'FiSettings': 'mdi-cog',
	};
	
	const mdiIcon = iconMap[icon] || 'mdi-help';
	
	return (
		<i 
			className={`mdi ${mdiIcon} ${className}`}
			style={{ fontSize: `${size}px` }}
		></i>
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
			icon={<MDIIcon icon="FiSettings" />}
			theme="orange"
		>
			<ConfigCheckerButtons {...props} />
		</CollapsibleHeader>
	);
};

export default ConfigCheckerService;
