// src/services/v9/v9ComprehensiveCredentialsService.tsx
// V9 Wrapper for ComprehensiveCredentialsService - Modern Messaging Compliant

import React from 'react';
import ComprehensiveCredentialsService from '../comprehensiveCredentialsService';
// Import Modern Messaging (V8) - established migration pattern
import { ToastNotificationsV8 as toastV8 } from '../../v8/utils/toastNotificationsV8';

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
			toastV8.success('Discovery completed successfully!');
			props.onDiscoveryComplete?.(result);
		} catch (error) {
			toastV8.error('Discovery completed but callback failed');
			console.error('Discovery callback error:', error);
		}
	};

	// Wrap credentials change with Modern Messaging
	const handleCredentialsChange = (credentials: unknown) => {
		try {
			props.onCredentialsChange?.(credentials);
		} catch (error) {
			toastV8.error('Failed to update credentials');
			console.error('Credentials change error:', error);
		}
	};

	// Wrap save with Modern Messaging
	const handleSaveCredentials = () => {
		try {
			toastV8.success('Credentials saved successfully!');
			props.onSaveCredentials?.();
		} catch (error) {
			toastV8.error('Failed to save credentials');
			console.error('Save credentials error:', error);
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
