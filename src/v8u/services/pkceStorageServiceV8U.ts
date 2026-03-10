/**
 * @file pkceStorageServiceV8U.ts
 * @module v8u/services
 * @description Bulletproof PKCE code storage with multiple redundancy layers - MIGRATED TO UNIFIED STORAGE
 * @version 8.0.0
 * @since 2024-11-18
 *
 * This service now uses unifiedTokenStorageService for better performance and reliability.
 * All existing API methods are preserved for backward compatibility.
 */

const MODULE_TAG = '[🔐 PKCE-STORAGE-V8U-MIGRATED]';

import type { V8UPKCECodes } from '../../services/unifiedTokenStorageService';
import { unifiedTokenStorage } from '../../services/unifiedTokenStorageService';
import { logger } from '../../utils/logger';

// Re-export type for backward compatibility
export type PKCECodes = V8UPKCECodes;

// ============================================================================
// MIGRATION STATE
// ============================================================================

// V8U → unified storage PKCE migration is complete — bridge removed.
const ensureMigration = async (): Promise<void> => {};

// ============================================================================
// PKCE STORAGE SERVICE (Compatibility Layer)
// ============================================================================

/**
 * Bulletproof PKCE storage service
 * Now uses unified storage with automatic migration from legacy storage
 * Maintains quadruple redundancy: unified storage + sessionStorage + localStorage + memory cache
 */

const memoryCache: Map<string, PKCECodes> = new Map();

/**
 * Save PKCE codes with enhanced redundancy (now uses unified storage)
 */
export async function savePKCECodes(
	flowKey: string,
	codes: { codeVerifier: string; codeChallenge: string; codeChallengeMethod?: string }
): Promise<void> {
	try {
		await ensureMigration();

		const pkceData: PKCECodes = {
			codeVerifier: codes.codeVerifier,
			codeChallenge: codes.codeChallenge,
			codeChallengeMethod: codes.codeChallengeMethod || 'S256',
			savedAt: Date.now(),
			flowKey,
		};

		// PRIMARY: Save to unified storage (IndexedDB + SQLite backup)
		await unifiedTokenStorage.saveV8UPKCECodes(flowKey, pkceData);

		// BACKUP 1: Save to sessionStorage for immediate access
		try {
			const jsonData = JSON.stringify(pkceData);
			sessionStorage.setItem(`v8u_pkce_${flowKey}`, jsonData);
			sessionStorage.setItem('v8u_pkce_codes', jsonData); // Legacy key for compatibility
			logger.info(`${MODULE_TAG} ✅ Saved to sessionStorage`, { flowKey });
		} catch (err) {
			logger.error('PkceStorageServiceV8U', `Failed to save to sessionStorage`, undefined, err);
		}

		// BACKUP 2: Save to localStorage (backup)
		try {
			const jsonData = JSON.stringify(pkceData);
			localStorage.setItem(`v8u_pkce_${flowKey}`, jsonData);
			logger.info(`${MODULE_TAG} ✅ Saved to localStorage (backup)`, { flowKey });
		} catch (err) {
			logger.error('PkceStorageServiceV8U', `Failed to save to localStorage`, undefined, err);
		}

		// BACKUP 3: Save to memory cache (fastest access)
		memoryCache.set(flowKey, pkceData);
		logger.info(`${MODULE_TAG} ✅ Saved to memory cache`, { flowKey });

		logger.info(`${MODULE_TAG} 🎯 PKCE codes saved with QUADRUPLE redundancy`, {
			flowKey,
			verifierLength: codes.codeVerifier.length,
			challengeLength: codes.codeChallenge.length,
			savedAt: new Date(pkceData.savedAt).toISOString(),
			locations: ['unified storage', 'sessionStorage', 'localStorage', 'memory'],
		});
	} catch (error) {
		logger.error('PkceStorageServiceV8U', `Failed to save PKCE codes`, { flowKey, error });
		throw error;
	}
}

/**
 * Load PKCE codes with fallback chain (now uses unified storage)
 * Tries: memory → sessionStorage → localStorage → unified storage
 */
export async function loadPKCECodesAsync(flowKey: string): Promise<PKCECodes | null> {
	logger.info(`${MODULE_TAG} 🔍 Loading PKCE codes (async)`, { flowKey });

	// 1. Try memory cache first (fastest)
	const memoryData = memoryCache.get(flowKey);
	if (memoryData) {
		logger.info(`${MODULE_TAG} ✅ Found in memory cache`, { flowKey });
		return memoryData;
	}

	// 2. Try sessionStorage
	try {
		const sessionData =
			sessionStorage.getItem(`v8u_pkce_${flowKey}`) || sessionStorage.getItem('v8u_pkce_codes');
		if (sessionData) {
			const parsed = JSON.parse(sessionData) as PKCECodes;
			logger.info(`${MODULE_TAG} ✅ Found in sessionStorage`, { flowKey });
			memoryCache.set(flowKey, parsed);
			return parsed;
		}
	} catch (err) {
		logger.error('PkceStorageServiceV8U', `Failed to load from sessionStorage`, undefined, err);
	}

	// 3. Try localStorage
	try {
		const localData = localStorage.getItem(`v8u_pkce_${flowKey}`);
		if (localData) {
			const parsed = JSON.parse(localData) as PKCECodes;
			logger.info(`${MODULE_TAG} ✅ Found in localStorage`, { flowKey });
			memoryCache.set(flowKey, parsed);
			try {
				sessionStorage.setItem(`v8u_pkce_${flowKey}`, localData);
			} catch {}
			return parsed;
		}
	} catch (err) {
		logger.error('PkceStorageServiceV8U', `Failed to load from localStorage`, undefined, err);
	}

	// 4. Try unified storage (primary storage with fallback)
	try {
		await ensureMigration();
		const unifiedData = await unifiedTokenStorage.loadV8UPKCECodesWithFallback(flowKey);
		if (unifiedData) {
			logger.info(`${MODULE_TAG} ✅ Found in unified storage (ultimate backup)`, { flowKey });
			// Restore to all other storages
			memoryCache.set(flowKey, unifiedData);
			try {
				const jsonData = JSON.stringify(unifiedData);
				sessionStorage.setItem(`v8u_pkce_${flowKey}`, jsonData);
				localStorage.setItem(`v8u_pkce_${flowKey}`, jsonData);
			} catch {}
			return unifiedData;
		}
	} catch (err) {
		logger.error('PkceStorageServiceV8U', `Failed to load from unified storage`, undefined, err);
	}

	logger.warn('PkceStorageServiceV8U', `No PKCE codes found in any storage`, { flowKey });
	return null;
}

/**
 * Synchronous load (tries memory, sessionStorage, localStorage only)
 */
export function loadPKCECodes(flowKey: string): PKCECodes | null {
	logger.info(`${MODULE_TAG} 🔍 Loading PKCE codes (sync)`, { flowKey });

	// 1. Try memory cache
	const memoryData = memoryCache.get(flowKey);
	if (memoryData) {
		logger.info(`${MODULE_TAG} ✅ Found in memory cache`, { flowKey });
		return memoryData;
	}

	// 2. Try sessionStorage
	try {
		const sessionData =
			sessionStorage.getItem(`v8u_pkce_${flowKey}`) || sessionStorage.getItem('v8u_pkce_codes');
		if (sessionData) {
			const parsed = JSON.parse(sessionData) as PKCECodes;
			logger.info(`${MODULE_TAG} ✅ Found in sessionStorage`, { flowKey });
			memoryCache.set(flowKey, parsed);
			return parsed;
		}
	} catch (err) {
		logger.error('PkceStorageServiceV8U', `Failed to load from sessionStorage`, undefined, err);
	}

	// 3. Try localStorage
	try {
		const localData = localStorage.getItem(`v8u_pkce_${flowKey}`);
		if (localData) {
			const parsed = JSON.parse(localData) as PKCECodes;
			logger.info(`${MODULE_TAG} ✅ Found in localStorage`, { flowKey });
			memoryCache.set(flowKey, parsed);
			try {
				sessionStorage.setItem(`v8u_pkce_${flowKey}`, localData);
			} catch {}
			return parsed;
		}
	} catch (err) {
		logger.error('PkceStorageServiceV8U', `Failed to load from localStorage`, undefined, err);
	}

	logger.warn(
		'PkceStorageServiceV8U',
		`No PKCE codes found in sync storage (try async load for unified storage)`,
		{ flowKey }
	);
	return null;
}

/**
 * Clear PKCE codes from all storage locations
 */
export async function clearPKCECodes(flowKey: string): Promise<void> {
	logger.info(`${MODULE_TAG} 🗑️ Clearing PKCE codes`, { flowKey });

	// Clear from all locations
	memoryCache.delete(flowKey);

	try {
		sessionStorage.removeItem(`v8u_pkce_${flowKey}`);
		sessionStorage.removeItem('v8u_pkce_codes');
	} catch {}

	try {
		localStorage.removeItem(`v8u_pkce_${flowKey}`);
	} catch {}

	// Clear from unified storage
	try {
		await ensureMigration();
		await unifiedTokenStorage.clearV8UPKCECodes(flowKey);
	} catch (err) {
		logger.error('PkceStorageServiceV8U', `Failed to clear from unified storage`, undefined, err);
	}

	logger.info(`${MODULE_TAG} ✅ PKCE codes cleared from all 4 storage locations`, { flowKey });
}

/**
 * Check if PKCE codes exist
 */
export async function hasPKCECodes(flowKey: string): Promise<boolean> {
	try {
		await ensureMigration();
		return await unifiedTokenStorage.hasV8UPKCECodes(flowKey);
	} catch {
		return false;
	}
}

// ============================================================================
// LEGACY CLASS EXPORT (for backward compatibility)
// ============================================================================

/**
 * Legacy class wrapper for backward compatibility
 * @deprecated Use the exported functions directly instead
 */
export const PKCEStorageServiceV8U = {
	savePKCECodes,
	loadPKCECodesAsync,
	loadPKCECodes,
	clearPKCECodes,
	hasPKCECodes,
} as const;

export default PKCEStorageServiceV8U;
