// src/hooks/usePersistedDiscovery.ts
/**
 * Hook for persisted OIDC discovery
 * 
 * Automatically saves and restores discovery data across the app.
 * Use this hook in any component that needs OIDC discovery.
 * 
 * Features:
 * - Auto-restores last used discovery on mount
 * - Saves discovery results automatically
 * - Provides cached discovery data
 * - Manages discovery state
 */

import { useEffect, useState, useCallback } from 'react';
import { comprehensiveDiscoveryService, DiscoveryResult } from '../services/comprehensiveDiscoveryService';
import { discoveryPersistenceService, PersistedDiscoveryData } from '../services/discoveryPersistenceService';

export interface UsePersistedDiscoveryOptions {
	/**
	 * Environment ID to restore (if known)
	 */
	environmentId?: string;

	/**
	 * Issuer URL to restore (if known)
	 */
	issuerUrl?: string;

	/**
	 * Auto-restore last used discovery on mount
	 */
	autoRestore?: boolean;

	/**
	 * Callback when discovery is restored
	 */
	onRestore?: (data: PersistedDiscoveryData) => void;

	/**
	 * Callback when discovery is saved
	 */
	onSave?: (data: PersistedDiscoveryData) => void;
}

export interface UsePersistedDiscoveryReturn {
	/**
	 * Current persisted discovery data
	 */
	persistedData: PersistedDiscoveryData | null;

	/**
	 * Discover and save
	 */
	discoverAndSave: (input: string) => Promise<DiscoveryResult>;

	/**
	 * Restore discovery from cache
	 */
	restore: (environmentId: string) => PersistedDiscoveryData | null;

	/**
	 * Clear cached discovery
	 */
	clear: (environmentId?: string) => void;

	/**
	 * Get all cached discoveries
	 */
	getAllCached: () => PersistedDiscoveryData[];

	/**
	 * Check if environment has cached discovery
	 */
	hasCached: (environmentId: string) => boolean;

	/**
	 * Loading state
	 */
	isLoading: boolean;

	/**
	 * Error state
	 */
	error: string | null;
}

export function usePersistedDiscovery(
	options: UsePersistedDiscoveryOptions = {}
): UsePersistedDiscoveryReturn {
	const {
		environmentId,
		issuerUrl,
		autoRestore = true,
		onRestore,
		onSave,
	} = options;

	const [persistedData, setPersistedData] = useState<PersistedDiscoveryData | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	/**
	 * Restore discovery from cache
	 */
	const restore = useCallback((envId: string): PersistedDiscoveryData | null => {
		const data = discoveryPersistenceService.getDiscovery(envId);
		if (data) {
			setPersistedData(data);
			onRestore?.(data);
			console.log('[usePersistedDiscovery] Restored discovery for:', envId);
		}
		return data;
	}, [onRestore]);

	/**
	 * Restore by issuer URL
	 */
	const restoreByIssuer = useCallback((issuer: string): PersistedDiscoveryData | null => {
		const data = discoveryPersistenceService.getDiscoveryByIssuer(issuer);
		if (data) {
			setPersistedData(data);
			onRestore?.(data);
			console.log('[usePersistedDiscovery] Restored discovery for issuer:', issuer);
		}
		return data;
	}, [onRestore]);

	/**
	 * Discover and save
	 */
	const discoverAndSave = useCallback(async (input: string): Promise<DiscoveryResult> => {
		setIsLoading(true);
		setError(null);

		try {
			// Check cache first
			const cached = discoveryPersistenceService.getDiscoveryByIssuer(input) ||
						   discoveryPersistenceService.getDiscovery(input);

			if (cached) {
				console.log('[usePersistedDiscovery] Using cached discovery');
				setPersistedData(cached);
				setIsLoading(false);
				return {
					success: true,
					document: cached.document,
					issuerUrl: cached.issuerUrl,
					provider: cached.provider,
					cached: true,
				};
			}

			// Perform discovery
			const result = await comprehensiveDiscoveryService.discover({
				input,
				timeout: 10000,
			});

			if (result.success && result.document && result.issuerUrl) {
				// Extract environment ID from issuer URL
				const envMatch = result.issuerUrl.match(/\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
				const extractedEnvId = envMatch ? envMatch[1] : input;

				// Save to persistence
				const dataToSave: PersistedDiscoveryData = {
					environmentId: extractedEnvId,
					issuerUrl: result.issuerUrl,
					provider: result.provider || 'unknown',
					document: result.document,
					timestamp: Date.now(),
				};

				discoveryPersistenceService.saveDiscovery(dataToSave);
				setPersistedData(dataToSave);
				onSave?.(dataToSave);

				console.log('[usePersistedDiscovery] Discovered and saved:', extractedEnvId);
			} else {
				setError(result.error || 'Discovery failed');
			}

			setIsLoading(false);
			return result;
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Discovery failed';
			setError(errorMessage);
			setIsLoading(false);
			return {
				success: false,
				error: errorMessage,
			};
		}
	}, [onSave]);

	/**
	 * Clear cached discovery
	 */
	const clear = useCallback((envId?: string) => {
		if (envId) {
			discoveryPersistenceService.removeDiscovery(envId);
			if (persistedData?.environmentId === envId) {
				setPersistedData(null);
			}
		} else {
			discoveryPersistenceService.clearAll();
			setPersistedData(null);
		}
	}, [persistedData]);

	/**
	 * Get all cached discoveries
	 */
	const getAllCached = useCallback(() => {
		return discoveryPersistenceService.getAllDiscoveries();
	}, []);

	/**
	 * Check if environment has cached discovery
	 */
	const hasCached = useCallback((envId: string) => {
		return discoveryPersistenceService.hasDiscovery(envId);
	}, []);

	/**
	 * Auto-restore on mount
	 */
	useEffect(() => {
		if (!autoRestore) return;

		// Try to restore by environment ID
		if (environmentId) {
			const data = restore(environmentId);
			if (data) return;
		}

		// Try to restore by issuer URL
		if (issuerUrl) {
			const data = restoreByIssuer(issuerUrl);
			if (data) return;
		}

		// Try to restore last used
		const lastUsed = discoveryPersistenceService.getLastUsedDiscovery();
		if (lastUsed) {
			setPersistedData(lastUsed);
			onRestore?.(lastUsed);
			console.log('[usePersistedDiscovery] Restored last used discovery');
		}
	}, [environmentId, issuerUrl, autoRestore, restore, restoreByIssuer, onRestore]);

	return {
		persistedData,
		discoverAndSave,
		restore,
		clear,
		getAllCached,
		hasCached,
		isLoading,
		error,
	};
}

export default usePersistedDiscovery;











