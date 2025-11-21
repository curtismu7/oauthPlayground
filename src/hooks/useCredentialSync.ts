// src/hooks/useCredentialSync.ts
// React hook for cross-tab credential synchronization

import { useEffect, useRef, useState } from 'react';
import { CredentialSyncEvent, credentialSyncService } from '../services/credentialSyncService';
import { FlowCredentialService } from '../services/flowCredentialService';

export interface UseCredentialSyncOptions {
	flowKey: string;
	onCredentialsChanged?: (credentials: any) => void;
	enableAutoRefresh?: boolean;
}

export interface UseCredentialSyncReturn {
	credentials: any | null;
	isLoading: boolean;
	refreshCredentials: () => Promise<void>;
	lastSyncTime: number | null;
}

/**
 * Hook for cross-tab credential synchronization
 */
export const useCredentialSync = (options: UseCredentialSyncOptions): UseCredentialSyncReturn => {
	const { flowKey, onCredentialsChanged, enableAutoRefresh = true } = options;

	const [credentials, setCredentials] = useState<any | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);

	const unsubscribeRef = useRef<(() => void) | null>(null);
	const isInitializedRef = useRef(false);

	// Initialize credential sync service
	useEffect(() => {
		if (!isInitializedRef.current) {
			credentialSyncService.initialize();
			isInitializedRef.current = true;
		}
	}, []);

	// Load initial credentials
	useEffect(() => {
		const loadInitialCredentials = async () => {
			setIsLoading(true);
			try {
				console.log(`🔄 [useCredentialSync:${flowKey}] Loading initial credentials...`);

				const { credentials: loadedCredentials } = await FlowCredentialService.loadFlowCredentials({
					flowKey,
					defaultCredentials: {},
				});

				setCredentials(loadedCredentials);
				setLastSyncTime(Date.now());

				console.log(`✅ [useCredentialSync:${flowKey}] Loaded initial credentials:`, {
					hasCredentials: !!(loadedCredentials?.environmentId || loadedCredentials?.clientId),
					environmentId: loadedCredentials?.environmentId,
					clientId: loadedCredentials?.clientId
						? `${loadedCredentials.clientId.substring(0, 8)}...`
						: 'none',
				});
			} catch (error) {
				console.error(
					`❌ [useCredentialSync:${flowKey}] Failed to load initial credentials:`,
					error
				);
			} finally {
				setIsLoading(false);
			}
		};

		loadInitialCredentials();
	}, [flowKey]);

	// Set up cross-tab synchronization
	useEffect(() => {
		if (!enableAutoRefresh) return;

		const handleCredentialChange = async (event: CredentialSyncEvent) => {
			console.log(`🔄 [useCredentialSync:${flowKey}] Received credential change event:`, {
				type: event.type,
				flowKey: event.flowKey,
				timestamp: event.timestamp,
			});

			// Check if this event is relevant to our flow
			const isRelevant =
				event.type === 'credentials-changed' || // General credential changes affect all flows
				(event.type === 'flow-credentials-changed' && event.flowKey === flowKey);

			if (!isRelevant) return;

			// Refresh credentials
			setIsLoading(true);
			try {
				const refreshedCredentials = await credentialSyncService.refreshFlowCredentials(flowKey);
				setCredentials(refreshedCredentials);
				setLastSyncTime(Date.now());

				console.log(`✅ [useCredentialSync:${flowKey}] Refreshed credentials from other tab:`, {
					hasCredentials: !!(refreshedCredentials?.environmentId || refreshedCredentials?.clientId),
					environmentId: refreshedCredentials?.environmentId,
					clientId: refreshedCredentials?.clientId
						? `${refreshedCredentials.clientId.substring(0, 8)}...`
						: 'none',
				});

				// Notify parent component
				if (onCredentialsChanged && refreshedCredentials) {
					onCredentialsChanged(refreshedCredentials);
				}
			} catch (error) {
				console.error(`❌ [useCredentialSync:${flowKey}] Failed to refresh credentials:`, error);
			} finally {
				setIsLoading(false);
			}
		};

		// Subscribe to credential changes
		const unsubscribe = credentialSyncService.subscribe(flowKey, handleCredentialChange);
		unsubscribeRef.current = unsubscribe;

		// Also subscribe to general credential changes
		const unsubscribeGeneral = credentialSyncService.subscribe('*', handleCredentialChange);

		return () => {
			unsubscribe();
			unsubscribeGeneral();
		};
	}, [flowKey, enableAutoRefresh, onCredentialsChanged]);

	// Manual refresh function
	const refreshCredentials = async (): Promise<void> => {
		setIsLoading(true);
		try {
			console.log(`🔄 [useCredentialSync:${flowKey}] Manual refresh requested...`);

			const refreshedCredentials = await credentialSyncService.refreshFlowCredentials(flowKey);
			setCredentials(refreshedCredentials);
			setLastSyncTime(Date.now());

			console.log(`✅ [useCredentialSync:${flowKey}] Manual refresh completed:`, {
				hasCredentials: !!(refreshedCredentials?.environmentId || refreshedCredentials?.clientId),
			});

			// Notify parent component
			if (onCredentialsChanged && refreshedCredentials) {
				onCredentialsChanged(refreshedCredentials);
			}
		} catch (error) {
			console.error(`❌ [useCredentialSync:${flowKey}] Manual refresh failed:`, error);
		} finally {
			setIsLoading(false);
		}
	};

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (unsubscribeRef.current) {
				unsubscribeRef.current();
			}
		};
	}, []);

	return {
		credentials,
		isLoading,
		refreshCredentials,
		lastSyncTime,
	};
};

export default useCredentialSync;
