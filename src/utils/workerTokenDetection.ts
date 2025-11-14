// src/utils/workerTokenDetection.ts
// Utility for detecting worker tokens across different storage keys

/**
 * Checks for a worker token in multiple possible storage locations.
 * Returns the first valid token found, or null if none exist.
 * 
 * Checks in order:
 * 1. worker_token (legacy/generic key)
 * 2. pingone_worker_token (alternative generic key)
 * 3. pingone_worker_token_worker-token-v7 (Worker Token V7 flow)
 * 4. Any key starting with pingone_worker_token_ (flow-specific keys)
 */
export function getAnyWorkerToken(): string | null {
	if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
		return null;
	}

	// Check common keys first
	const commonKeys = [
		'worker_token',
		'pingone_worker_token',
		'pingone_worker_token_worker-token-v7',
	];

	for (const key of commonKeys) {
		const token = localStorage.getItem(key);
		if (token && token.trim()) {
			return token.trim();
		}
	}

	// Check for any flow-specific worker token keys
	try {
		const allKeys = Object.keys(localStorage);
		const workerTokenKey = allKeys.find(key => 
			key.startsWith('pingone_worker_token_') && 
			!key.includes('expires_at') &&
			!key.includes('credentials')
		);

		if (workerTokenKey) {
			const token = localStorage.getItem(workerTokenKey);
			if (token && token.trim()) {
				return token.trim();
			}
		}
	} catch (error) {
		console.warn('[workerTokenDetection] Error checking localStorage:', error);
	}

	return null;
}

/**
 * Checks if any worker token exists in storage.
 * Useful for conditional rendering of features that require a worker token.
 */
export function hasWorkerToken(): boolean {
	return getAnyWorkerToken() !== null;
}

/**
 * Gets all worker token keys found in localStorage.
 * Useful for debugging or showing users which tokens they have.
 */
export function getAllWorkerTokenKeys(): string[] {
	if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
		return [];
	}

	try {
		const allKeys = Object.keys(localStorage);
		return allKeys.filter(key => 
			(key === 'worker_token' || key.startsWith('pingone_worker_token_')) &&
			!key.includes('expires_at') &&
			!key.includes('credentials')
		);
	} catch (error) {
		console.warn('[workerTokenDetection] Error getting all keys:', error);
		return [];
	}
}
