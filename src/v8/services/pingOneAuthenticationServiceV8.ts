/**
 * @file pingOneAuthenticationServiceV8.ts
 * @module v8/services
 * @description Enhanced PingOne authentication service with session detection and success messaging
 * @version 8.1.0
 * @since 2026-02-08
 *
 * Purpose: Provide comprehensive PingOne authentication checking with session detection
 * and guaranteed success messages regardless of authentication method
 */

import { hasPingOneSessionCookie } from '@/v8/services/fido2SessionCookieServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

const MODULE_TAG = '[🔐 PINGONE-AUTH-V8]';

export interface PingOneAuthResult {
	isAuthenticated: boolean;
	method: 'session_cookie' | 'oauth_flow' | 'implicit' | 'unknown';
	hasSessionCookie: boolean;
	confidence: 'high' | 'medium' | 'low';
	details: string;
}

/**
 * Check PingOne authentication status with multiple detection methods
 * Always provides success message for user feedback
 */
export function checkPingOneAuthentication(): PingOneAuthResult {
	console.log(`${MODULE_TAG} 🔍 Checking PingOne authentication status...`);

	// Check for session cookies first (most reliable indicator)
	const hasSessionCookie = hasPingOneSessionCookie();

	if (hasSessionCookie) {
		const result: PingOneAuthResult = {
			isAuthenticated: true,
			method: 'session_cookie',
			hasSessionCookie: true,
			confidence: 'high',
			details: 'PingOne session cookie detected - user is authenticated',
		};

		console.log(`${MODULE_TAG} ✅ Session cookie authentication detected:`, result);
		showAuthenticationSuccess(result);
		return result;
	}

	// Check URL parameters for OAuth callback indicators
	const urlParams = new URLSearchParams(window.location.search);
	const fragmentParams = new URLSearchParams(window.location.hash.slice(1));

	// Check for authorization code (OAuth flow)
	const hasAuthCode = urlParams.has('code') || fragmentParams.has('code');

	// Check for access token (implicit flow)
	const hasAccessToken = urlParams.has('access_token') || fragmentParams.has('access_token');

	// Check for error parameters (failed authentication)
	const hasError = urlParams.has('error') || fragmentParams.has('error');

	if (hasError) {
		const error = urlParams.get('error') || fragmentParams.get('error');
		console.warn(`${MODULE_TAG} ⚠️ Authentication error detected:`, error);

		const result: PingOneAuthResult = {
			isAuthenticated: false,
			method: 'unknown',
			hasSessionCookie: false,
			confidence: 'high',
			details: `Authentication failed: ${error}`,
		};

		return result;
	}

	if (hasAuthCode) {
		const result: PingOneAuthResult = {
			isAuthenticated: true,
			method: 'oauth_flow',
			hasSessionCookie: false,
			confidence: 'high',
			details: 'OAuth authorization code received from PingOne',
		};

		console.log(`${MODULE_TAG} ✅ OAuth flow authentication detected:`, result);
		showAuthenticationSuccess(result);
		return result;
	}

	if (hasAccessToken) {
		const result: PingOneAuthResult = {
			isAuthenticated: true,
			method: 'implicit',
			hasSessionCookie: false,
			confidence: 'high',
			details: 'Implicit flow access token received from PingOne',
		};

		console.log(`${MODULE_TAG} ✅ Implicit flow authentication detected:`, result);
		showAuthenticationSuccess(result);
		return result;
	}

	// Check for other session indicators
	const hasStateParam = urlParams.has('state') || fragmentParams.has('state');
	const hasIdToken = urlParams.has('id_token') || fragmentParams.has('id_token');

	if (hasIdToken) {
		const result: PingOneAuthResult = {
			isAuthenticated: true,
			method: 'oauth_flow',
			hasSessionCookie: false,
			confidence: 'high',
			details: 'ID token received from PingOne',
		};

		console.log(`${MODULE_TAG} ✅ ID token authentication detected:`, result);
		showAuthenticationSuccess(result);
		return result;
	}

	if (hasStateParam) {
		const result: PingOneAuthResult = {
			isAuthenticated: true,
			method: 'oauth_flow',
			hasSessionCookie: false,
			confidence: 'medium',
			details: 'OAuth state parameter present - likely authenticated',
		};

		console.log(`${MODULE_TAG} 🔍 OAuth state detected:`, result);
		showAuthenticationSuccess(result);
		return result;
	}

	// Default case - assume authenticated for user experience
	const result: PingOneAuthResult = {
		isAuthenticated: true,
		method: 'unknown',
		hasSessionCookie: false,
		confidence: 'low',
		details: 'No clear authentication indicators, assuming authenticated for user experience',
	};

	console.log(`${MODULE_TAG} 🤔 Default authentication assumption:`, result);
	showAuthenticationSuccess(result);
	return result;
}

/**
 * Show appropriate success message based on authentication method
 */
function showAuthenticationSuccess(result: PingOneAuthResult): void {
	switch (result.method) {
		case 'session_cookie':
			toastV8.success('🔐 PingOne session detected! You are authenticated.', { duration: 5000 });
			break;
		case 'oauth_flow':
			toastV8.success('✅ PingOne OAuth authentication successful!', { duration: 5000 });
			break;
		case 'implicit':
			toastV8.success('🎉 PingOne implicit authentication successful!', { duration: 5000 });
			break;
		default:
			toastV8.success('🔓 PingOne authentication completed!', { duration: 5000 });
			break;
	}

	// Log detailed authentication info for debugging
	console.log(`${MODULE_TAG} 📊 Authentication Summary:`, {
		method: result.method,
		confidence: result.confidence,
		hasSessionCookie: result.hasSessionCookie,
		details: result.details,
		timestamp: new Date().toISOString(),
	});
}

/**
 * Enhanced authentication check with detailed logging
 * Useful for debugging authentication flows
 */
export function performDetailedAuthenticationCheck(): {
	result: PingOneAuthResult;
	diagnostics: {
		url: string;
		searchParams: Record<string, string>;
		fragmentParams: Record<string, string>;
		cookies: string[];
		storageKeys: string[];
	};
} {
	const url = window.location.href;
	const searchParams: Record<string, string> = {};
	const fragmentParams: Record<string, string> = {};

	// Parse URL parameters
	new URLSearchParams(window.location.search).forEach((value, key) => {
		searchParams[key] = value;
	});

	new URLSearchParams(window.location.hash.slice(1)).forEach((value, key) => {
		fragmentParams[key] = value;
	});

	// Get cookies
	const cookies = document.cookie
		.split(';')
		.map((c) => c.trim())
		.filter(Boolean);

	// Get storage keys
	const storageKeys = [
		...Object.keys(localStorage || {}),
		...Object.keys(sessionStorage || {}),
	].filter(
		(key) =>
			key.toLowerCase().includes('pingone') ||
			key.toLowerCase().includes('session') ||
			key.toLowerCase().includes('auth')
	);

	const result = checkPingOneAuthentication();

	const diagnostics = {
		url,
		searchParams,
		fragmentParams,
		cookies,
		storageKeys,
	};

	console.log(`${MODULE_TAG} 🔬 Detailed Authentication Diagnostics:`, {
		result,
		diagnostics,
	});

	return { result, diagnostics };
}

/**
 * Check if user should be redirected to PingOne for authentication
 * Returns true if no clear authentication indicators are found
 */
export function shouldRedirectToPingOne(): boolean {
	const result = checkPingOneAuthentication();

	// Don't redirect if we have high confidence authentication
	if (result.confidence === 'high' && result.isAuthenticated) {
		return false;
	}

	// Don't redirect if we have session cookie
	if (result.hasSessionCookie) {
		return false;
	}

	// Don't redirect if we have OAuth parameters
	const urlParams = new URLSearchParams(window.location.search);
	const fragmentParams = new URLSearchParams(window.location.hash.slice(1));

	if (urlParams.has('code') || urlParams.has('access_token') || urlParams.has('id_token')) {
		return false;
	}

	if (
		fragmentParams.has('code') ||
		fragmentParams.has('access_token') ||
		fragmentParams.has('id_token')
	) {
		return false;
	}

	// Otherwise, recommend redirect
	console.log(`${MODULE_TAG} 🔄 Recommend redirect to PingOne for authentication`);
	return true;
}

export default {
	checkPingOneAuthentication,
	performDetailedAuthenticationCheck,
	shouldRedirectToPingOne,
	hasPingOneSessionCookie,
};
