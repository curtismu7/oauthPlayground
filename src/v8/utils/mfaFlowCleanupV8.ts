/**
 * @file mfaFlowCleanupV8.ts
 * @module v8/utils
 * @description Cleanup utilities for MFA flows when navigating away
 * @version 8.0.0
 * 
 * Cleans up temporary flow state (sessionStorage) when navigating away from MFA flows.
 * Preserves credentials and tokens as requested.
 */

const MODULE_TAG = '[🧹 MFA-FLOW-CLEANUP-V8]';

/**
 * SessionStorage keys used for MFA flows that should be cleaned up
 */
const SESSION_STORAGE_KEYS_TO_CLEAN = [
	'user_login_state_v8',
	'user_login_code_verifier_v8',
	'user_login_credentials_temp_v8',
	'user_login_redirect_uri_v8',
	'user_login_return_to_mfa',
	'mfa_flow_state_after_oauth',
] as const;

/**
 * Clean up temporary MFA flow state from sessionStorage
 * 
 * This clears:
 * - OAuth callback state (user login flow)
 * - PKCE verifiers
 * - Temporary credentials
 * - Return path markers (ONLY if not in the middle of an OAuth callback)
 * - Flow state after OAuth
 * 
 * This does NOT clear:
 * - Credentials (stored in localStorage)
 * - Tokens (worker tokens, user tokens)
 * - API display preferences
 * 
 * @param logCleanup - Whether to log cleanup actions (default: true)
 * @param preserveOAuthCallback - If true, preserves return path during OAuth callback (default: false)
 */
export function cleanupMfaFlowState(logCleanup: boolean = true, preserveOAuthCallback: boolean = false): void {
	if (typeof window === 'undefined' || !window.sessionStorage) {
		return;
	}

	// Check if we're in the middle of an OAuth callback
	// If we have a code in the URL and user_login_state_v8, we're in a callback
	const isOAuthCallback = preserveOAuthCallback || (
		window.location.search.includes('code=') && 
		sessionStorage.getItem('user_login_state_v8')
	);

	let cleanedCount = 0;

	SESSION_STORAGE_KEYS_TO_CLEAN.forEach((key) => {
		// Preserve return path if we're in the middle of an OAuth callback
		if (key === 'user_login_return_to_mfa' && isOAuthCallback) {
			if (logCleanup) {
				console.log(`${MODULE_TAG} Preserving return path during OAuth callback: ${key}`);
			}
			return;
		}
		
		if (sessionStorage.getItem(key)) {
			sessionStorage.removeItem(key);
			cleanedCount++;
			if (logCleanup) {
				console.log(`${MODULE_TAG} Cleaned up: ${key}`);
			}
		}
	});

	if (logCleanup && cleanedCount > 0) {
		console.log(`${MODULE_TAG} ✅ Cleaned up ${cleanedCount} sessionStorage item(s)`);
	} else if (logCleanup) {
		console.log(`${MODULE_TAG} No sessionStorage items to clean up`);
	}
}

/**
 * Clean up URL parameters (code, state, error) from the current URL
 * Useful when navigating away from OAuth callback pages
 */
export function cleanupUrlParameters(): void {
	if (typeof window === 'undefined') {
		return;
	}

	const url = new URL(window.location.href);
	const hasOAuthParams = url.searchParams.has('code') || 
	                      url.searchParams.has('state') || 
	                      url.searchParams.has('error');

	if (hasOAuthParams) {
		// Remove OAuth callback parameters
		url.searchParams.delete('code');
		url.searchParams.delete('state');
		url.searchParams.delete('error');
		url.searchParams.delete('error_description');
		url.searchParams.delete('error_uri');

		window.history.replaceState({}, document.title, url.toString());
		console.log(`${MODULE_TAG} Cleaned up OAuth callback parameters from URL`);
	}
}

/**
 * Complete cleanup: sessionStorage + URL parameters
 * Call this when navigating away from MFA flows
 * 
 * @param logCleanup - Whether to log cleanup actions (default: true)
 */
export function cleanupMfaFlowComplete(logCleanup: boolean = true): void {
	cleanupMfaFlowState(logCleanup);
	cleanupUrlParameters();
}

/**
 * Navigate to MFA hub with cleanup
 * Helper function to ensure cleanup happens when navigating away
 * 
 * @param navigate - React Router navigate function
 * @param logCleanup - Whether to log cleanup actions (default: true)
 */
export function navigateToMfaHubWithCleanup(
	navigate: (path: string) => void,
	logCleanup: boolean = true
): void {
	cleanupMfaFlowComplete(logCleanup);
	navigate('/v8/mfa-hub');
}

