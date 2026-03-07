// src/services/v9/v9ComprehensiveCredentialsService.tsx
// V9 Wrapper for ComprehensiveCredentialsService - Modern Messaging Compliant

import React from 'react';
// Import Modern Messaging (V9) - proper migration to non-toast messaging
import { modernMessaging } from '../../components/v9/V9ModernMessagingComponents';
import ComprehensiveCredentialsService from '../comprehensiveCredentialsService';

// V9 Wrapper Component
export interface V9ComprehensiveCredentialsProps {
	flowType: string;
	onDiscoveryComplete?: (result: unknown) => void;
	onCredentialsChange?: (credentials: unknown) => void;
	onSaveCredentials?: () => void;
	[key: string]: unknown; // Allow other props to pass through
}

const V9ComprehensiveCredentialsService: React.FC<V9ComprehensiveCredentialsProps> = (props) => {
	// Wrap discovery callback with Modern Messaging
	const handleDiscoveryComplete = (result: unknown) => {
		try {
			modernMessaging.showFooterMessage({
				type: 'info',
				message: 'Discovery completed successfully!',
				duration: 4000,
			});
			props.onDiscoveryComplete?.(result);
		} catch (_error) {
			modernMessaging.showCriticalError({
				title: 'Discovery Callback Failed',
				message: 'Discovery completed but callback failed',
				contactSupport: false,
			});
		}
	};

	// Wrap credentials change with Modern Messaging
	const handleCredentialsChange = (credentials: unknown) => {
		try {
			props.onCredentialsChange?.(credentials);
		} catch (_error) {
			modernMessaging.showCriticalError({
				title: 'Credentials Update Failed',
				message: 'Failed to update credentials',
				contactSupport: false,
			});
		}
	};

	// Wrap save with Modern Messaging
	const handleSaveCredentials = () => {
		try {
			modernMessaging.showFooterMessage({
				type: 'info',
				message: 'Credentials saved successfully!',
				duration: 3000,
			});
			props.onSaveCredentials?.();
		} catch (_error) {
			modernMessaging.showCriticalError({
				title: 'Credentials Save Failed',
				message: 'Failed to save credentials',
				contactSupport: false,
			});
		}
	};

	return (
		<ComprehensiveCredentialsService
			{...props}
			onDiscoveryComplete={handleDiscoveryComplete}
			onCredentialsChange={handleCredentialsChange}
			onSaveCredentials={handleSaveCredentials}
		/>
	);
};

export default V9ComprehensiveCredentialsService;
