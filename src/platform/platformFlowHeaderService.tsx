// src/platform/platformFlowHeaderService.tsx
// V9 Wrapper for FlowHeaderService - Modern Messaging Compliant

import React from 'react';
// Import Modern Messaging (V9) - proper migration to non-toast messaging
import { modernMessaging } from '../components/ModernMessagingComponents';
import { FlowHeader, FlowHeaderConfig, getFlowConfig } from '../services/flowHeaderService';

// V9 Wrapper Component
export interface PlatformFlowHeaderProps {
	flowId?: string;
	flowType?: string;
	customConfig?: Partial<FlowHeaderConfig>;
}

const PlatformFlowHeader: React.FC<PlatformFlowHeaderProps> = (props) => {
	// Add V9-specific logging and error handling
	React.useEffect(() => {
		const configKey = props.flowId || props.flowType;
		if (!configKey) {
			modernMessaging.showBanner({
				type: 'warning',
				title: 'Missing Configuration',
				message: 'FlowHeader: No flowId or flowType provided',
				dismissible: true,
			});
		}
	}, [props.flowId, props.flowType]);

	// Simply wrap the original FlowHeader with V9 error handling
	try {
		return <FlowHeader {...props} />;
	} catch (_error) {
		modernMessaging.showCriticalError({
			title: 'Header Render Failed',
			message: 'Failed to render flow header',
			contactSupport: false,
		});
		return (
			<div
				style={{
					padding: '1rem',
					background: '#f87171',
					color: 'white',
					borderRadius: '0.5rem',
					textAlign: 'center',
				}}
			>
				Flow header unavailable
			</div>
		);
	}
};

// Export utility functions with V9 error handling
export const getPlatformFlowConfig = (flowId: string): FlowHeaderConfig | null => {
	try {
		return getFlowConfig(flowId);
	} catch (_error) {
		modernMessaging.showCriticalError({
			title: 'Flow Config Failed',
			message: `Failed to get flow config for ${flowId}`,
			contactSupport: false,
		});
		return null;
	}
};

export { PlatformFlowHeader };
export default PlatformFlowHeader;
