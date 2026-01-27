/**
 * @file StartupWrapper.tsx
 * @description Wrapper component that tracks app initialization and shows startup loader
 * @version 1.0.0
 */

import React, { useEffect, useState } from 'react';
import { LoadingSpinnerModalV8U } from '@/v8u/components/LoadingSpinnerModalV8U';
import { useAuth } from '../contexts/NewAuthContext';

interface StartupWrapperProps {
	children: React.ReactNode;
}

/**
 * StartupWrapper - Tracks app initialization and shows loader until ready
 *
 * Monitors:
 * - AuthProvider loading state
 * - App initialization completion
 * - Minimum display time to prevent flicker
 */
export const StartupWrapper: React.FC<StartupWrapperProps> = ({ children }) => {
	const { isLoading: authLoading } = useAuth();
	const [appInitialized, setAppInitialized] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	// Track when app initialization is complete
	useEffect(() => {
		// Wait for critical initialization to complete
		// This includes:
		// - Field editing service initialization
		// - Event listeners setup
		// - Development tools (if in dev mode)
		const initTimer = setTimeout(() => {
			setAppInitialized(true);
		}, 100); // Small delay to ensure useEffect hooks have run

		return () => clearTimeout(initTimer);
	}, []);

	// Update loading state when both auth and app are ready
	useEffect(() => {
		const allReady = !authLoading && appInitialized;
		setIsLoading(!allReady);
	}, [authLoading, appInitialized]);

	return (
		<>
			<LoadingSpinnerModalV8U show={isLoading} message="Initializing application..." theme="blue" />
			{children}
		</>
	);
};

export default StartupWrapper;
