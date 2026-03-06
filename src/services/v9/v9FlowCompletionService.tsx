// src/services/v9/v9FlowCompletionService.tsx
// V9 Wrapper for FlowCompletionService - Modern Messaging Compliant

import React from 'react';
// Import Modern Messaging (V9) - proper migration to non-toast messaging
import { modernMessaging } from '../../components/v9/V9ModernMessagingComponents';
import { FlowCompletionConfig, FlowCompletionService } from '../flowCompletionService';

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
				modernMessaging.showFooterMessage({
					type: 'info',
					message: 'Starting new flow...',
					duration: 3000,
				});
				props.config.onStartNewFlow();
			} catch (_error) {
				modernMessaging.showCriticalError({
					title: 'Flow Start Failed',
					message: 'Failed to start new flow',
					contactSupport: false,
				});
			}
		},
	};

	// Wrap toggle collapsed with Modern Messaging
	const handleToggleCollapsed = () => {
		try {
			props.onToggleCollapsed?.();
		} catch (_error) {
			modernMessaging.showCriticalError({
				title: 'Toggle Failed',
				message: 'Failed to toggle completion section',
				contactSupport: false,
			});
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
