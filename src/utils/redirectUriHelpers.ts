// src/utils/redirectUriHelpers.ts
// Utility functions to ensure redirect_uri consistency between authorization request and token exchange

/**
 * Extracts and stores the redirect_uri from a generated authorization URL
 * This ensures the token exchange uses the EXACT same value as the authorization request
 *
 * @param authUrl - The generated authorization URL containing redirect_uri parameter
 * @param flowKey - Unique identifier for the flow (e.g., 'authorization-code-v6')
 * @returns The extracted redirect_uri or null if not found
 */
export function storeRedirectUriFromAuthUrl(authUrl: string, flowKey: string): string | null {
	try {
		const url = new URL(authUrl);
		const redirectUri = url.searchParams.get('redirect_uri');

		if (redirectUri) {
			const storageKey = `${flowKey}_actual_redirect_uri`;
			sessionStorage.setItem(storageKey, redirectUri);
			console.log(`🔐 [RedirectURI] Stored from auth URL for ${flowKey}: ${redirectUri}`);
			return redirectUri;
		}

		console.warn(`⚠️ [RedirectURI] No redirect_uri found in auth URL for ${flowKey}`);
		return null;
	} catch (error) {
		console.error('[RedirectURI] Failed to extract redirect_uri from auth URL:', error);
		return null;
	}
}

/**
 * Retrieves the stored redirect_uri for a flow
 * Falls back to provided value if no stored value exists
 *
 * @param flowKey - Unique identifier for the flow
 * @param fallback - Fallback redirect_uri if no stored value exists
 * @returns The stored or fallback redirect_uri
 */
export function getStoredRedirectUri(flowKey: string, fallback?: string): string {
	const storageKey = `${flowKey}_actual_redirect_uri`;
	const stored = sessionStorage.getItem(storageKey);

	if (stored) {
		console.log(`🔐 [RedirectURI] Retrieved stored value for ${flowKey}: ${stored}`);
		return stored;
	}

	if (fallback) {
		console.warn(`⚠️ [RedirectURI] No stored value for ${flowKey}, using fallback: ${fallback}`);
		return fallback;
	}

	console.error(`❌ [RedirectURI] No stored or fallback value for ${flowKey}`);
	return '';
}

/**
 * Clears the stored redirect_uri for a flow
 * Should be called when resetting the flow
 *
 * @param flowKey - Unique identifier for the flow
 */
export function clearRedirectUri(flowKey: string): void {
	const storageKey = `${flowKey}_actual_redirect_uri`;
	sessionStorage.removeItem(storageKey);
	console.log(`🗑️ [RedirectURI] Cleared for ${flowKey}`);
}

/**
 * Validates that two redirect URIs match (accounting for common variations)
 *
 * @param uri1 - First URI to compare
 * @param uri2 - Second URI to compare
 * @returns true if URIs match
 */
export function redirectUrisMatch(uri1: string, uri2: string): boolean {
	if (!uri1 || !uri2) return false;

	// Normalize URIs (trim, lowercase, remove trailing slashes for comparison)
	const normalize = (uri: string) => uri.trim().toLowerCase().replace(/\/$/, '');

	const match = normalize(uri1) === normalize(uri2);

	if (!match) {
		console.warn('⚠️ [RedirectURI] Mismatch detected:', {
			uri1: normalize(uri1),
			uri2: normalize(uri2),
		});
	}

	return match;
}

/**
 * Audits redirect_uri consistency and logs potential issues
 *
 * @param phase - Current phase (e.g., 'authorization', 'token-exchange')
 * @param redirectUri - The redirect_uri being used
 * @param flowKey - The flow identifier
 */
export function auditRedirectUri(phase: string, redirectUri: string, flowKey: string): void {
	console.log(`🔍 [RedirectURI Audit] ${phase} for ${flowKey}:`, {
		redirectUri,
		hasTrailingSlash: redirectUri.endsWith('/'),
		protocol: redirectUri.split(':')[0],
		length: redirectUri.length,
		trimmed: redirectUri === redirectUri.trim(),
		encoded: redirectUri !== decodeURIComponent(redirectUri),
	});

	// Check against stored value if in token exchange phase
	if (phase === 'token-exchange') {
		const stored = getStoredRedirectUri(flowKey);
		if (stored && !redirectUrisMatch(stored, redirectUri)) {
			console.error('❌ [RedirectURI] MISMATCH DETECTED:', {
				storedInAuth: stored,
				usedInExchange: redirectUri,
				willFail: true,
			});
		} else if (stored) {
			console.log('✅ [RedirectURI] Match confirmed between authorization and token exchange');
		}
	}
}
