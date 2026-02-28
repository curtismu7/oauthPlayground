// src/services/configCheckerService.tsx
// Service wrapper for ConfigCheckerButtons that adds collapsible header

import React from 'react';
import { FiSettings } from '@icons';
import { ConfigCheckerButtons } from '../components/ConfigCheckerButtons';
import { CollapsibleHeader } from './collapsibleHeaderService';

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
			icon={<FiSettings />}
			theme="orange"
		>
			<ConfigCheckerButtons {...props} />
		</CollapsibleHeader>
	);
};

export default ConfigCheckerService;
