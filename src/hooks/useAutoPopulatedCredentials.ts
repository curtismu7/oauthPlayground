// src/hooks/useAutoPopulatedCredentials.ts
// React hook for auto-populating credentials in mock flows

import { useEffect, useState } from 'react';
import type { FlowCredentials } from '../config/mockFlowCredentials';
import { getDefaultCredentials } from '../config/mockFlowCredentials';
import { V9CredentialStorageService, type V9FlowCredentials } from '../services/v9/V9CredentialStorageService';

interface UseAutoPopulatedCredentialsOptions {
	flowKey: string;
	flowType: string;
	defaults?: Partial<FlowCredentials>;
}

interface UseAutoPopulatedCredentialsReturn {
	credentials: V9FlowCredentials;
	setCredentials: (credentials: V9FlowCredentials) => void;
	updateCredential: (key: string, value: string) => void;
	resetToDefaults: () => void;
	isLoading: boolean;
}

/**
 * Hook for auto-populating credentials in mock flows
 * 
 * Features:
 * - Loads saved credentials from storage
 * - Falls back to sensible defaults
 * - Enables zero-field entry
 * - Persists user customizations
 * 
 * @param options - Configuration options
 * @returns Credentials state and update functions
 * 
 * @example
 * ```typescript
 * const { credentials, updateCredential } = useAutoPopulatedCredentials({
 *   flowKey: 'v9:client-credentials',
 *   flowType: 'client-credentials'
 * });
 * ```
 */
export function useAutoPopulatedCredentials({
	flowKey,
	flowType,
	defaults = {},
}: UseAutoPopulatedCredentialsOptions): UseAutoPopulatedCredentialsReturn {
	const [isLoading, setIsLoading] = useState(true);
	const [credentials, setCredentialsState] = useState<V9FlowCredentials>(() => {
		const baseDefaults = getDefaultCredentials(flowType);
		return { ...baseDefaults, ...defaults } as V9FlowCredentials;
	});

	useEffect(() => {
		const loadCredentials = async () => {
			try {
				const saved = V9CredentialStorageService.loadSync(flowKey);
				const baseDefaults = getDefaultCredentials(flowType);
				const mergedDefaults = { ...baseDefaults, ...defaults };

				if (saved && Object.keys(saved).length > 0) {
					setCredentialsState({ ...mergedDefaults, ...saved } as V9FlowCredentials);
				} else {
					// Just set state, don't save to avoid quota issues
					setCredentialsState(mergedDefaults as V9FlowCredentials);
				}
			} catch (error) {
				console.error('Failed to load credentials:', error);
				const baseDefaults = getDefaultCredentials(flowType);
				setCredentialsState({ ...baseDefaults, ...defaults } as V9FlowCredentials);
			} finally {
				setIsLoading(false);
			}
		};

		loadCredentials();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [flowKey, flowType]);

	const setCredentials = (newCredentials: V9FlowCredentials) => {
		setCredentialsState(newCredentials);
		V9CredentialStorageService.save(flowKey, newCredentials);
	};

	const updateCredential = (key: string, value: string) => {
		setCredentialsState((prev) => {
			const updated = { ...prev, [key]: value } as V9FlowCredentials;
			V9CredentialStorageService.save(flowKey, updated);
			return updated;
		});
	};

	const resetToDefaults = () => {
		const baseDefaults = getDefaultCredentials(flowType);
		const mergedDefaults = { ...baseDefaults, ...defaults } as V9FlowCredentials;
		setCredentialsState(mergedDefaults);
		V9CredentialStorageService.save(flowKey, mergedDefaults);
	};

	return {
		credentials,
		setCredentials,
		updateCredential,
		resetToDefaults,
		isLoading,
	};
}
