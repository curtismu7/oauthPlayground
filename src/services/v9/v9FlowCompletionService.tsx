// src/services/v9/v9FlowCompletionService.tsx
// V9 Wrapper for FlowCompletionService - Modern Messaging Compliant

import React from 'react';
import { FlowCompletionConfig, FlowCompletionService } from '../flowCompletionService';
import { v9MessagingService } from './V9MessagingService';

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
				v9MessagingService.showInfo('Starting new flow...');
				props.config.onStartNewFlow();
			} catch (error) {
				v9MessagingService.showError('Failed to start new flow');
				console.error('Start new flow error:', error);
			}
		},
	};

	// Wrap toggle collapsed with Modern Messaging
	const handleToggleCollapsed = () => {
		try {
			props.onToggleCollapsed?.();
		} catch (error) {
			v9MessagingService.showError('Failed to toggle completion section');
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
