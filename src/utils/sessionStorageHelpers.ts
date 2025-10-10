// src/utils/sessionStorageHelpers.ts
/**
 * Helper utilities for managing OAuth/OIDC flow sessionStorage
 */

/**
 * Clear all OAuth/OIDC flow-related sessionStorage items
 */
export function clearFlowSessionStorage(): void {
	const keysToRemove = [
		'oauth_auth_code',
		'oauth_state',
		'flowContext',
		'oauth-authorization-code-v5-current-step',
		'oidc-authorization-code-v5-current-step',
		'oidc-authorization-code-v6-current-step',
		'oauth-authorization-code-v5-app-config',
		'oidc-authorization-code-v5-app-config',
		'oidc-authorization-code-v6-app-config',
		'restore_step',
	];

	keysToRemove.forEach((key) => {
		sessionStorage.removeItem(key);
	});

	console.log('✅ [SessionStorage] All flow data cleared');
}

/**
 * Check if an authorization code in sessionStorage is stale (older than 10 minutes)
 * Authorization codes typically expire within 5-10 minutes
 */
export function isAuthCodeStale(flowKey: string): boolean {
	const timestampKey = `${flowKey}-auth-code-timestamp`;
	const timestamp = sessionStorage.getItem(timestampKey);

	if (!timestamp) {
		// No timestamp means the code might be from an old session
		return true;
	}

	const ageInMs = Date.now() - Number.parseInt(timestamp, 10);
	const maxAgeMs = 10 * 60 * 1000; // 10 minutes

	return ageInMs > maxAgeMs;
}

/**
 * Set authorization code with timestamp
 */
export function setAuthCodeWithTimestamp(flowKey: string, authCode: string): void {
	sessionStorage.setItem('oauth_auth_code', authCode);
	sessionStorage.setItem(`${flowKey}-auth-code-timestamp`, Date.now().toString());
}

/**
 * Get authorization code if it's not stale, otherwise return null
 */
export function getAuthCodeIfFresh(flowKey: string): string | null {
	const authCode = sessionStorage.getItem('oauth_auth_code');

	if (!authCode) {
		return null;
	}

	if (isAuthCodeStale(flowKey)) {
		console.log(`⏰ [SessionStorage] Authorization code for ${flowKey} is stale, ignoring`);
		sessionStorage.removeItem('oauth_auth_code');
		sessionStorage.removeItem(`${flowKey}-auth-code-timestamp`);
		return null;
	}

	return authCode;
}

/**
 * Clear authorization code and timestamp
 */
export function clearAuthCode(flowKey: string): void {
	sessionStorage.removeItem('oauth_auth_code');
	sessionStorage.removeItem(`${flowKey}-auth-code-timestamp`);
}







