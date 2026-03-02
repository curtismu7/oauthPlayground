// src/services/v9/v9FlowHeaderService.tsx
// V9 Wrapper for FlowHeaderService - Modern Messaging Compliant

import React from 'react';
import { FlowHeaderService } from '../flowHeaderService';
// Import Modern Messaging (V8) - established migration pattern
import { ToastNotificationsV8 as toastV8 } from '../../v8/utils/toastNotificationsV8';

// V9 Wrapper Component
export interface V9FlowHeaderProps {
	flowId?: string;
	flowType?: string;
	customConfig?: Partial<FlowHeaderService.FlowHeaderConfig>;
}

const V9FlowHeader: React.FC<V9FlowHeaderProps> = (props) => {
	// Add V9-specific logging and error handling
	React.useEffect(() => {
		const configKey = props.flowId || props.flowType;
		if (!configKey) {
			toastV8.warning('FlowHeader: No flowId or flowType provided');
		}
	}, [props.flowId, props.flowType]);

	// Simply wrap the original FlowHeader with V9 error handling
	try {
		return <FlowHeader {...props} />;
	} catch (error) {
		toastV8.error('Failed to render flow header');
		console.error('FlowHeader error:', error);
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
export const getV9FlowConfig = (flowId: string): FlowHeaderConfig | null => {
	try {
		return getFlowConfig(flowId);
	} catch (error) {
		toastV8.error(`Failed to get flow config for ${flowId}`);
		console.error('Get flow config error:', error);
		return null;
	}
};

export default V9FlowHeader;
