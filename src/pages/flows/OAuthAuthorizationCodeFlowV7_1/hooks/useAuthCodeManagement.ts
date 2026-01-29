// src/pages/flows/OAuthAuthorizationCodeFlowV7_1/hooks/useAuthCodeManagement.ts
// V7.1 Auth Code Management - Centralized authorization code handling

import { useCallback, useEffect, useState } from 'react';
import { FLOW_CONSTANTS } from '../constants/flowConstants';
import type { AuthCodeState } from '../types/flowTypes';

export const useAuthCodeManagement = () => {
	const [authCode, setAuthCode] = useState<string | null>(null);
	const [authCodeSource, setAuthCodeSource] = useState<AuthCodeState['source']>('manual');
	const [authCodeTimestamp, setAuthCodeTimestamp] = useState<number>(0);

	// Detect authorization code from various sources
	const detectAuthCode = useCallback(() => {
		// URL parameter detection
		const urlParams = new URLSearchParams(window.location.search);
		const urlCode = urlParams.get('code');

		// Session storage detection
		const sessionCode = sessionStorage.getItem(FLOW_CONSTANTS.STORAGE_KEYS.AUTH_CODE);

		// Priority: URL > Session > Manual
		if (urlCode) {
			setAuthCode(urlCode);
			setAuthCodeSource('url');
			setAuthCodeTimestamp(Date.now());
			return urlCode;
		} else if (sessionCode) {
			setAuthCode(sessionCode);
			setAuthCodeSource('session');
			setAuthCodeTimestamp(Date.now());
			return sessionCode;
		}

		return null;
	}, []);

	// Set authorization code manually
	const setAuthCodeManually = useCallback((code: string) => {
		setAuthCode(code);
		setAuthCodeSource('manual');
		setAuthCodeTimestamp(Date.now());

		// Store in session storage
		try {
			sessionStorage.setItem(FLOW_CONSTANTS.STORAGE_KEYS.AUTH_CODE, code);
		} catch (error) {
			console.warn('Failed to store auth code in session storage:', error);
		}
	}, []);

	// Clear authorization code
	const clearAuthCode = useCallback(() => {
		setAuthCode(null);
		setAuthCodeSource('manual');
		setAuthCodeTimestamp(0);

		// Remove from session storage
		try {
			sessionStorage.removeItem(FLOW_CONSTANTS.STORAGE_KEYS.AUTH_CODE);
		} catch (error) {
			console.warn('Failed to remove auth code from session storage:', error);
		}

		// Clean URL parameters
		try {
			const url = new URL(window.location.href);
			url.searchParams.delete('code');
			url.searchParams.delete('state');
			url.searchParams.delete('error');
			url.searchParams.delete('error_description');
			window.history.replaceState({}, '', url.toString());
		} catch (error) {
			console.warn('Failed to clean URL parameters:', error);
		}
	}, []);

	// Validate authorization code format
	const validateAuthCode = useCallback((code: string): boolean => {
		if (!code || typeof code !== 'string') {
			return false;
		}

		// Basic validation - authorization codes are typically alphanumeric
		const authCodePattern = /^[A-Za-z0-9\-._~+/]+=*$/;
		return authCodePattern.test(code) && code.length > 10;
	}, []);

	// Check if authorization code is expired (if we have timestamp)
	const isAuthCodeExpired = useCallback(
		(maxAge: number = 600000): boolean => {
			// 10 minutes default
			if (authCodeTimestamp === 0) {
				return false; // No timestamp, can't determine expiration
			}

			const now = Date.now();
			return now - authCodeTimestamp > maxAge;
		},
		[authCodeTimestamp]
	);

	// Get authorization code state
	const getAuthCodeState = useCallback((): AuthCodeState => {
		return {
			code: authCode,
			source: authCodeSource,
			timestamp: authCodeTimestamp,
		};
	}, [authCode, authCodeSource, authCodeTimestamp]);

	// Auto-detect auth code on mount
	useEffect(() => {
		const detectedCode = detectAuthCode();
		if (detectedCode) {
			console.log('🔍 Auth code detected:', {
				code: `${detectedCode.substring(0, 20)}...`,
				source: authCodeSource,
				timestamp: new Date(authCodeTimestamp).toISOString(),
			});
		}
	}, [detectAuthCode, authCodeSource, authCodeTimestamp]);

	// Clean up URL on unmount if code was from URL
	useEffect(() => {
		return () => {
			if (authCodeSource === 'url') {
				try {
					const url = new URL(window.location.href);
					url.searchParams.delete('code');
					window.history.replaceState({}, '', url.toString());
				} catch (error) {
					console.warn('Failed to clean URL on unmount:', error);
				}
			}
		};
	}, [authCodeSource]);

	return {
		// State
		authCode,
		authCodeSource,
		authCodeTimestamp,

		// Actions
		detectAuthCode,
		setAuthCodeManually,
		clearAuthCode,

		// Validation
		validateAuthCode,
		isAuthCodeExpired,

		// Utilities
		getAuthCodeState,
	};
};

export default useAuthCodeManagement;
