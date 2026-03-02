// src/services/v9/v9FlowCompletionService.tsx
// V9 Wrapper for FlowCompletionService - Modern Messaging Compliant

import React from 'react';
import { FlowCompletionConfig, FlowCompletionService } from '../flowCompletionService';
// Import Modern Messaging (V8) - established migration pattern
import { ToastNotificationsV8 as toastV8 } from '../../v8/utils/toastNotificationsV8';

// V9 Wrapper Component
export interface V9FlowCompletionProps {
	config: FlowCompletionConfig;
	collapsed?: boolean;
	onToggleCollapsed?: () => void;
}

const V9FlowCompletionService: React.FC<V9FlowCompletionProps> = (props) => {
	// Wrap config callbacks with Modern Messaging
	const wrappedConfig: FlowCompletionConfig = {
		...props.config,
		onStartNewFlow: () => {
			try {
				toastV8.info('Starting new flow...');
				props.config.onStartNewFlow();
			} catch (error) {
				toastV8.error('Failed to start new flow');
				console.error('Start new flow error:', error);
			}
		},
	};

	// Wrap toggle collapsed with Modern Messaging
	const handleToggleCollapsed = () => {
		try {
			props.onToggleCollapsed?.();
		} catch (error) {
			toastV8.error('Failed to toggle completion section');
			console.error('Toggle collapsed error:', error);
		}
	};

	return (
		<FlowCompletionService
			config={wrappedConfig}
			collapsed={props.collapsed ?? false}
			onToggleCollapsed={handleToggleCollapsed}
		/>
	);
};

// Export types for convenience
export type { FlowCompletionConfig } from '../flowCompletionService';

export default V9FlowCompletionService;
