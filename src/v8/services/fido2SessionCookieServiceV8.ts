/**
 * FIDO2 Session Cookie Service
 * 
 * Detects PingOne session cookies and determines if FIDO2 platform devices
 * should be preferred for authentication, even if they are not the default device.
 * 
 * Per PingOne MFA API documentation:
 * "If the user is paired with a FIDO2 platform device and a session token cookie 
 * exists on the browser, the FIDO2 platform device is used for authentication 
 * even if it is not the default device."
 */

const MODULE_TAG = '[🔐 FIDO2-SESSION-COOKIE-V8]';

/**
 * PingOne session cookie names to check for
 */
const PINGONE_SESSION_COOKIE_NAMES = [
	'pingone.sid',
	'interactionId',
	'interactionToken',
	'pingone_session',
	'p1_session',
];

/**
 * Check if a PingOne session cookie exists in the browser
 * Note: HTTP-only cookies cannot be read from JavaScript, but we can check
 * for cookies that might be accessible or check server-side indicators
 */
export function hasPingOneSessionCookie(): boolean {
	if (typeof document === 'undefined') {
		return false;
	}

	// Check for cookies in document.cookie (non-HTTP-only cookies)
	const cookies = document.cookie.split(';').map((c) => c.trim());
	
	for (const cookie of cookies) {
		const [name] = cookie.split('=');
		if (PINGONE_SESSION_COOKIE_NAMES.some((pingOneName) => name.toLowerCase().includes(pingOneName.toLowerCase()))) {
			console.log(`${MODULE_TAG} ✅ Found PingOne session cookie: ${name}`);
			return true;
		}
	}

	// Check localStorage/sessionStorage for session indicators
	// (Some implementations store session tokens here)
	try {
		const sessionIndicators = [
			'pingone_session',
			'pingone_sid',
			'interactionId',
			'interactionToken',
			'p1_session_id',
		];

		for (const indicator of sessionIndicators) {
			if (localStorage.getItem(indicator) || sessionStorage.getItem(indicator)) {
				console.log(`${MODULE_TAG} ✅ Found PingOne session indicator in storage: ${indicator}`);
				return true;
			}
		}
	} catch (error) {
		// Storage access might be blocked in some contexts
		console.warn(`${MODULE_TAG} Could not check storage for session indicators:`, error);
	}

	return false;
}

/**
 * Check if we're in a native app context
 * This is a heuristic check - native apps often have specific user agents or window properties
 */
export function isNativeAppContext(): boolean {
	if (typeof window === 'undefined') {
		return false;
	}

	// Check for common native app indicators
	const userAgent = navigator.userAgent || '';
	const isNativeApp = 
		// React Native
		userAgent.includes('ReactNative') ||
		// Cordova/PhoneGap
		userAgent.includes('Cordova') ||
		userAgent.includes('PhoneGap') ||
		// Ionic
		userAgent.includes('Ionic') ||
		// Electron (desktop apps)
		userAgent.includes('Electron') ||
		// Custom app identifiers
		(window as unknown as { __NATIVE_APP__?: boolean }).__NATIVE_APP__ === true;

	if (isNativeApp) {
		console.log(`${MODULE_TAG} ✅ Detected native app context`);
	}

	return isNativeApp;
}

/**
 * Check if device authorization is enabled
 * This checks for device authorization flow indicators in the current context
 */
export function isDeviceAuthorizationEnabled(): boolean {
	if (typeof window === 'undefined') {
		return false;
	}

	// Check URL parameters for device authorization indicators
	const urlParams = new URLSearchParams(window.location.search);
	const hasDeviceCode = urlParams.has('device_code') || urlParams.has('deviceCode');
	const hasDeviceAuth = urlParams.has('device_auth') || urlParams.has('deviceAuth');

	// Check sessionStorage/localStorage for device authorization state
	try {
		const deviceAuthIndicators = [
			'device_authorization_active',
			'device_auth_enabled',
			'device_code',
		];

		for (const indicator of deviceAuthIndicators) {
			if (sessionStorage.getItem(indicator) || localStorage.getItem(indicator)) {
				console.log(`${MODULE_TAG} ✅ Found device authorization indicator: ${indicator}`);
				return true;
			}
		}
	} catch (error) {
		console.warn(`${MODULE_TAG} Could not check storage for device authorization:`, error);
	}

	if (hasDeviceCode || hasDeviceAuth) {
		console.log(`${MODULE_TAG} ✅ Device authorization detected from URL parameters`);
		return true;
	}

	return false;
}

/**
 * Determine if FIDO2 platform device should be preferred
 * 
 * Returns true if:
 * 1. Session cookie exists AND user has FIDO2 platform device (even if not default)
 * 2. Native app context AND device authorization is enabled
 */
export function shouldPreferFIDO2PlatformDevice(): {
	prefer: boolean;
	reason: string;
	sessionCookie: boolean;
	nativeApp: boolean;
	deviceAuth: boolean;
} {
	const hasSessionCookie = hasPingOneSessionCookie();
	const isNative = isNativeAppContext();
	const hasDeviceAuth = isDeviceAuthorizationEnabled();

	let prefer = false;
	let reason = '';

	// Case 1: Session cookie exists - prefer FIDO2 platform device even if not default
	if (hasSessionCookie) {
		prefer = true;
		reason = 'Session token cookie exists - FIDO2 platform device should be used even if not default';
	}

	// Case 2: Native app with device authorization enabled
	if (isNative && hasDeviceAuth) {
		prefer = true;
		reason = 'Native app with device authorization enabled - native device should be used for seamless authentication';
	}

	const result = {
		prefer,
		reason,
		sessionCookie: hasSessionCookie,
		nativeApp: isNative,
		deviceAuth: hasDeviceAuth,
	};

	if (prefer) {
		console.log(`${MODULE_TAG} ✅ Should prefer FIDO2 platform device:`, result);
	}

	return result;
}

/**
 * Get WebAuthn authenticator selection preferences based on context
 * 
 * When session cookies exist or native app device auth is enabled,
 * prefer platform authenticators (Touch ID, Face ID, Windows Hello)
 */
export function getAuthenticatorSelectionPreferences(): {
	authenticatorAttachment?: 'platform' | 'cross-platform';
	userVerification: 'required' | 'preferred' | 'discouraged';
} {
	const { prefer, reason } = shouldPreferFIDO2PlatformDevice();

	if (prefer) {
		console.log(`${MODULE_TAG} Using platform authenticator preference: ${reason}`);
		return {
			authenticatorAttachment: 'platform',
			userVerification: 'preferred',
		};
	}

	// Default: prefer platform but allow cross-platform
	return {
		userVerification: 'preferred',
	};
}

