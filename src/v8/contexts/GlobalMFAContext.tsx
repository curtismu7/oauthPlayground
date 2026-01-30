/**
 * @file GlobalMFAContext.tsx
 * @module v8/contexts
 * @description Global MFA Context - Provides global state for Environment ID and Worker Token
 * @version 9.2.0
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { globalEnvironmentService } from '@/v8/services/globalEnvironmentService';
import { globalWorkerTokenService } from '@/v8/services/globalWorkerTokenService';
import type { WorkerTokenStatus } from '@/types/credentials';

interface GlobalMFAState {
	environmentId: string | null;
	workerTokenStatus: WorkerTokenStatus | null;
	isConfigured: boolean;
	isLoading: boolean;
}

interface GlobalMFAContextValue extends GlobalMFAState {
	setEnvironmentId: (id: string) => void;
	refreshWorkerToken: () => Promise<void>;
}

const GlobalMFAContext = createContext<GlobalMFAContextValue | null>(null);

interface GlobalMFAProviderProps {
	children: ReactNode;
}

/**
 * Global MFA Provider
 * 
 * Provides global state for:
 * - Environment ID (single source of truth)
 * - Worker Token status (automatic refresh)
 * - Configuration status
 */
export const GlobalMFAProvider: React.FC<GlobalMFAProviderProps> = ({ children }) => {
	const [environmentId, setEnvironmentIdState] = useState<string | null>(null);
	const [workerTokenStatus, setWorkerTokenStatus] = useState<WorkerTokenStatus | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	// Initialize on mount
	useEffect(() => {
		console.log('[GlobalMFAContext] Initializing...');
		
		// Initialize environment service
		globalEnvironmentService.initialize();
		setEnvironmentIdState(globalEnvironmentService.getEnvironmentId());

		// Subscribe to environment ID changes
		const unsubEnv = globalEnvironmentService.subscribe((id) => {
			console.log('[GlobalMFAContext] Environment ID changed:', id);
			setEnvironmentIdState(id);
		});

		// Subscribe to worker token status changes
		const unsubToken = globalWorkerTokenService.subscribe((status) => {
			console.log('[GlobalMFAContext] Worker Token status changed:', status);
			setWorkerTokenStatus(status);
		});

		// Load initial worker token status
		globalWorkerTokenService.getStatus().then((status) => {
			setWorkerTokenStatus(status);
			setIsLoading(false);
		});

		return () => {
			unsubEnv();
			unsubToken();
		};
	}, []);

	// Set environment ID
	const setEnvironmentId = (id: string) => {
		globalEnvironmentService.setEnvironmentId(id);
	};

	// Refresh worker token
	const refreshWorkerToken = async () => {
		try {
			await globalWorkerTokenService.forceRefresh();
		} catch (error) {
			console.error('[GlobalMFAContext] Failed to refresh worker token:', error);
			throw error;
		}
	};

	// Determine if fully configured
	const isConfigured = !!(
		environmentId && 
		workerTokenStatus?.hasCredentials && 
		workerTokenStatus?.tokenValid
	);

	const value: GlobalMFAContextValue = {
		environmentId,
		workerTokenStatus,
		isConfigured,
		isLoading,
		setEnvironmentId,
		refreshWorkerToken,
	};

	return (
		<GlobalMFAContext.Provider value={value}>
			{children}
		</GlobalMFAContext.Provider>
	);
};

/**
 * Hook to use Global MFA Context
 * 
 * @throws Error if used outside GlobalMFAProvider
 */
export const useGlobalMFA = (): GlobalMFAContextValue => {
	const context = useContext(GlobalMFAContext);
	if (!context) {
		throw new Error('useGlobalMFA must be used within GlobalMFAProvider');
	}
	return context;
};
