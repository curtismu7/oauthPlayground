/**
 * @file MFACredentialContext.tsx
 * @module v8/contexts
 * @description React Context for MFA credential management
 * @version 8.0.0
 * @since 2026-01-29
 *
 * Purpose: Provide React Context wrapper for MFACredentialManagerV8
 * - Makes credential state available to all MFA components
 * - Provides hooks for easy credential access
 * - Handles subscription lifecycle automatically
 *
 * @example
 * // Wrap your app with the provider
 * <MFACredentialProvider>
 *   <UnifiedMFARegistrationFlowV8 />
 * </MFACredentialProvider>
 *
 * @example
 * // Use the hook in components
 * const { credentials, saveCredentials, isLoading } = useCredentialManager();
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { MFACredentials } from '../flows/shared/MFATypes';
import type { ValidationResult } from '../services/mfaCredentialManagerV8';
import { MFACredentialManagerV8 } from '../services/mfaCredentialManagerV8';

interface MFACredentialContextValue {
	credentials: MFACredentials | null;
	loadCredentials: (flowKey?: string) => MFACredentials;
	loadCredentialsWithBackup: (flowKey?: string) => Promise<MFACredentials>;
	saveCredentials: (flowKey: string, credentials: MFACredentials) => void;
	clearCredentials: (flowKey?: string) => void;
	validateCredentials: (credentials: Partial<MFACredentials>) => ValidationResult;
	getEnvironmentId: () => string | null;
	setEnvironmentId: (environmentId: string) => void;
	hasCredentialsChanged: (newCredentials: MFACredentials) => boolean;
	isLoading: boolean;
}

const MFACredentialContext = createContext<MFACredentialContextValue | null>(null);

/**
 * Provider component for MFA credential management
 *
 * Wraps components that need access to credential state.
 * Automatically manages subscription lifecycle.
 */
export const MFACredentialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const manager = React.useMemo(() => MFACredentialManagerV8.getInstance(), []);
	const [credentials, setCredentials] = useState<MFACredentials | null>(manager.getCredentials());
	const [isLoading, setIsLoading] = useState(false);

	// Subscribe to credential updates
	useEffect(() => {
		const unsubscribe = manager.subscribe((creds) => {
			setCredentials(creds);
			setIsLoading(false);
		});

		return () => unsubscribe();
	}, [manager]);

	// Load credentials synchronously
	const loadCredentials = (flowKey?: string) => {
		setIsLoading(true);
		const loaded = manager.loadCredentials(flowKey);
		setIsLoading(false);
		return loaded;
	};

	// Load credentials with backup (async)
	const loadCredentialsWithBackup = async (flowKey?: string) => {
		setIsLoading(true);
		try {
			const loaded = await manager.loadCredentialsWithBackup(flowKey);
			return loaded;
		} finally {
			setIsLoading(false);
		}
	};

	// Save credentials
	const saveCredentials = (flowKey: string, creds: MFACredentials) => {
		setIsLoading(true);
		manager.saveCredentials(flowKey, creds);
		// Loading state will be cleared by subscription callback
	};

	// Clear credentials
	const clearCredentials = (flowKey?: string) => {
		setIsLoading(true);
		manager.clearCredentials(flowKey);
		// Loading state will be cleared by subscription callback
	};

	// Validate credentials
	const validateCredentials = (creds: Partial<MFACredentials>) => {
		return manager.validateCredentials(creds);
	};

	// Get environment ID
	const getEnvironmentId = () => {
		return manager.getEnvironmentId();
	};

	// Set environment ID
	const setEnvironmentId = (environmentId: string) => {
		manager.setEnvironmentId(environmentId);
	};

	// Check if credentials changed
	const hasCredentialsChanged = (newCredentials: MFACredentials) => {
		return manager.hasCredentialsChanged(newCredentials);
	};

	return (
		<MFACredentialContext.Provider
			value={{
				credentials,
				loadCredentials,
				loadCredentialsWithBackup,
				saveCredentials,
				clearCredentials,
				validateCredentials,
				getEnvironmentId,
				setEnvironmentId,
				hasCredentialsChanged,
				isLoading,
			}}
		>
			{children}
		</MFACredentialContext.Provider>
	);
};

/**
 * Hook to access credential manager from any component
 *
 * @throws Error if used outside MFACredentialProvider
 * @returns Credential manager context value
 *
 * @example
 * const { credentials, saveCredentials } = useCredentialManager();
 * if (credentials) {
 *   console.log('Current user:', credentials.username);
 * }
 */
export const useCredentialManager = (): MFACredentialContextValue => {
	const context = useContext(MFACredentialContext);
	if (!context) {
		throw new Error('useCredentialManager must be used within MFACredentialProvider');
	}
	return context;
};

/**
 * Hook to get current credentials (convenience hook)
 *
 * @returns Current credentials or null
 *
 * @example
 * const credentials = useCredentials();
 * if (credentials?.environmentId) {
 *   // Use environment ID
 * }
 */
export const useCredentials = (): MFACredentials | null => {
	const { credentials } = useCredentialManager();
	return credentials;
};

/**
 * Hook to get environment ID (convenience hook)
 *
 * @returns Environment ID or null
 *
 * @example
 * const environmentId = useEnvironmentId();
 */
export const useEnvironmentId = (): string | null => {
	const { getEnvironmentId } = useCredentialManager();
	return getEnvironmentId();
};
