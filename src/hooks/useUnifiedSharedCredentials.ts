/**
 * @file useUnifiedSharedCredentials.ts
 * @description Hook for accessing unified shared credentials across all flows
 * @version 9.0.0
 * @since 2025-01-25
 * 
 * This hook provides a simple interface for all flows to access shared credentials:
 * - Environment ID (global across all flows)
 * - OAuth credentials (clientId, clientSecret, issuerUrl)
 * - Worker Token credentials
 * 
 * Usage:
 * const { credentials, saveEnvironmentId, saveOAuthCredentials, saveWorkerTokenCredentials } = useUnifiedSharedCredentials();
 */

import { useState, useEffect, useCallback } from 'react';
import { unifiedSharedCredentialsService, type UnifiedSharedCredentials } from '@/services/unifiedSharedCredentialsService';

export interface UseUnifiedSharedCredentialsReturn {
	/** Current shared credentials */
	credentials: UnifiedSharedCredentials;
	/** Save Environment ID globally */
	saveEnvironmentId: (environmentId: string, source?: string) => Promise<void>;
	/** Save OAuth credentials */
	saveOAuthCredentials: (credentials: {
		clientId?: string;
		clientSecret?: string;
		issuerUrl?: string;
		clientAuthMethod?: string;
	}, source?: string) => Promise<void>;
	/** Save Worker Token credentials */
	saveWorkerTokenCredentials: (credentials: any, source?: string) => Promise<void>;
	/** Check if user has any credentials */
	hasAnyCredentials: boolean;
	/** Check if user has complete OAuth credentials */
	hasOAuthCredentials: boolean;
	/** Check if user has Worker Token credentials */
	hasWorkerTokenCredentials: boolean;
	/** Get credential status summary */
	getCredentialStatus: () => {
		hasEnvironmentId: boolean;
		hasClientId: boolean;
		hasClientSecret: boolean;
		hasWorkerToken: boolean;
		isComplete: boolean;
	};
	/** Refresh credentials from storage */
	refreshCredentials: () => Promise<void>;
}

/**
 * Hook for accessing unified shared credentials
 */
export function useUnifiedSharedCredentials(): UseUnifiedSharedCredentialsReturn {
	const [credentials, setCredentials] = useState<UnifiedSharedCredentials>({
		lastUpdated: Date.now(),
	});
	const [hasAnyCredentials, setHasAnyCredentials] = useState(false);

	// Load credentials on mount
	useEffect(() => {
		const loadCredentials = async () => {
			try {
				const creds = await unifiedSharedCredentialsService.loadAllCredentials();
				setCredentials(creds);
				setHasAnyCredentials(await unifiedSharedCredentialsService.hasAnyCredentials());
			} catch (error) {
				console.error('[useUnifiedSharedCredentials] Failed to load credentials:', error);
			}
		};

		loadCredentials();

		// Listen for credential updates
		const handleCredentialUpdate = (event: CustomEvent) => {
			console.log('[useUnifiedSharedCredentials] Received credential update:', event.detail);
			loadCredentials();
		};

		window.addEventListener('unifiedSharedCredentialsUpdated', handleCredentialUpdate as EventListener);

		return () => {
			window.removeEventListener('unifiedSharedCredentialsUpdated', handleCredentialUpdate as EventListener);
		};
	}, []);

	// Save Environment ID
	const saveEnvironmentId = useCallback(async (environmentId: string, source?: string) => {
		try {
			await unifiedSharedCredentialsService.saveEnvironmentId(environmentId, source);
			// Refresh credentials after save
			const creds = await unifiedSharedCredentialsService.loadAllCredentials();
			setCredentials(creds);
			setHasAnyCredentials(await unifiedSharedCredentialsService.hasAnyCredentials());
		} catch (error) {
			console.error('[useUnifiedSharedCredentials] Failed to save Environment ID:', error);
			throw error;
		}
	}, []);

	// Save OAuth credentials
	const saveOAuthCredentials = useCallback(async (oauthCreds: {
		clientId?: string;
		clientSecret?: string;
		issuerUrl?: string;
		clientAuthMethod?: string;
	}, source?: string) => {
		try {
			await unifiedSharedCredentialsService.saveOAuthCredentials(oauthCreds, source);
			// Refresh credentials after save
			const creds = await unifiedSharedCredentialsService.loadAllCredentials();
			setCredentials(creds);
			setHasAnyCredentials(await unifiedSharedCredentialsService.hasAnyCredentials());
		} catch (error) {
			console.error('[useUnifiedSharedCredentials] Failed to save OAuth credentials:', error);
			throw error;
		}
	}, []);

	// Save Worker Token credentials
	const saveWorkerTokenCredentials = useCallback(async (workerTokenCreds: any, source?: string) => {
		try {
			await unifiedSharedCredentialsService.saveWorkerTokenCredentials(workerTokenCreds, source);
			// Refresh credentials after save
			const creds = await unifiedSharedCredentialsService.loadAllCredentials();
			setCredentials(creds);
			setHasAnyCredentials(await unifiedSharedCredentialsService.hasAnyCredentials());
		} catch (error) {
			console.error('[useUnifiedSharedCredentials] Failed to save Worker Token credentials:', error);
			throw error;
		}
	}, []);

	// Get credential status
	const getCredentialStatus = useCallback(() => {
		return unifiedSharedCredentialsService.getCredentialStatus();
	}, []);

	// Refresh credentials
	const refreshCredentials = useCallback(async () => {
		try {
			const creds = await unifiedSharedCredentialsService.loadAllCredentials();
			setCredentials(creds);
			setHasAnyCredentials(await unifiedSharedCredentialsService.hasAnyCredentials());
		} catch (error) {
			console.error('[useUnifiedSharedCredentials] Failed to refresh credentials:', error);
		}
	}, []);

	return {
		credentials,
		saveEnvironmentId,
		saveOAuthCredentials,
		saveWorkerTokenCredentials,
		hasAnyCredentials,
		hasOAuthCredentials: unifiedSharedCredentialsService.hasOAuthCredentials(),
		hasWorkerTokenCredentials: unifiedSharedCredentialsService.hasWorkerTokenCredentials(),
		getCredentialStatus,
		refreshCredentials,
	};
}
