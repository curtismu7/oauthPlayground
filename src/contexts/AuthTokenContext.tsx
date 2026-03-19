/**
 * @file AuthTokenContext.tsx
 * @description Token management context - extracted from NewAuthContext.tsx
 * @version 9.16.24
 */

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { OAuthTokens, UserInfo } from '../types/storage';
import { logger } from '../utils/logger';
import { oauthStorage } from '../utils/storage';

// Helper functions
const isTokenValid = (tokens: OAuthTokens | null): boolean => {
	if (!tokens?.access_token) return false;
	const now = Date.now();
	const expiresAt = tokens.expires_at || 0;
	return expiresAt ? now < expiresAt : false;
};

const isRefreshTokenValid = (tokens: OAuthTokens | null): boolean => {
	if (!tokens?.refresh_token) return false;
	const now = Date.now();
	const refreshExpiresAt = tokens.refresh_expires_at || 0;
	return refreshExpiresAt ? now < refreshExpiresAt : false;
};

// OAuth-specific token keys to check (excluding worker tokens)
const OAUTH_TOKEN_KEYS = [
	'pingone_secure_tokens',
	'pingone_tokens',
	'tokens',
	'oauth_tokens',
	'oidc_tokens',
	'implicit_tokens',
	'device_code_tokens',
	'client_credentials_tokens',
	'hybrid_tokens',
	'authz_flow_tokens',
	'oauth2_implicit_tokens',
	'oidc_implicit_tokens',
	'oauth2_client_credentials_tokens',
	'oidc_client_credentials_tokens',
	'device_code_oidc_tokens',
];

// Load OAuth tokens from storage
const loadOAuthTokens = (): OAuthTokens | null => {
	try {
		for (const key of OAUTH_TOKEN_KEYS) {
			try {
				// Check sessionStorage first
				const sessionData = sessionStorage.getItem(key);
				if (sessionData) {
					const parsedTokens = JSON.parse(sessionData);
					if (parsedTokens?.access_token && isTokenValid(parsedTokens)) {
						logger.info('AuthTokenContext', `Found valid tokens in ${key}`);
						return parsedTokens;
					}
				}

				// Then check localStorage
				const localData = localStorage.getItem(key);
				if (localData) {
					const parsedTokens = JSON.parse(localData);
					if (parsedTokens?.access_token && isTokenValid(parsedTokens)) {
						logger.info('AuthTokenContext', `Found valid tokens in localStorage ${key}`);
						return parsedTokens;
					}
				}
			} catch {
				// Skip invalid entries
			}
		}
		return null;
	} catch (error) {
		logger.error('AuthTokenContext', 'Error loading tokens', error);
		return null;
	}
};

// Load stored user info
const loadStoredUser = (): UserInfo | null => {
	try {
		return oauthStorage.getUserInfo() || null;
	} catch (error) {
		logger.error('AuthTokenContext', 'Error loading user info', error);
		return null;
	}
};

// Context type
interface AuthTokenContextType {
	tokens: OAuthTokens | null;
	user: UserInfo | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	saveTokens: (tokens: OAuthTokens) => void;
	clearTokens: () => void;
	refreshToken: () => Promise<boolean>;
	hasValidToken: boolean;
	hasValidRefreshToken: boolean;
}

// Create context
const AuthTokenContext = createContext<AuthTokenContextType | undefined>(undefined);

// Provider component
export const AuthTokenProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [tokens, setTokens] = useState<OAuthTokens | null>(null);
	const [user, setUser] = useState<UserInfo | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	// Load tokens on mount
	useEffect(() => {
		const loadedTokens = loadOAuthTokens();
		const loadedUser = loadStoredUser();
		setTokens(loadedTokens);
		setUser(loadedUser);
		setIsLoading(false);
	}, []);

	// Listen for token updates
	useEffect(() => {
		const handleTokenUpdate = () => {
			const updatedTokens = loadOAuthTokens();
			setTokens(updatedTokens);
		};

		const handleUserUpdate = () => {
			const updatedUser = loadStoredUser();
			setUser(updatedUser);
		};

		window.addEventListener('workerTokenUpdated', handleTokenUpdate);
		window.addEventListener('storage', handleTokenUpdate);

		return () => {
			window.removeEventListener('workerTokenUpdated', handleTokenUpdate);
			window.removeEventListener('storage', handleTokenUpdate);
		};
	}, []);

	// Save tokens
	const saveTokens = useCallback((newTokens: OAuthTokens) => {
		setTokens(newTokens);
		oauthStorage.saveTokens(newTokens);
		logger.info('AuthTokenContext', 'Tokens saved');
	}, []);

	// Clear tokens
	const clearTokens = useCallback(() => {
		setTokens(null);
		setUser(null);
		oauthStorage.clearTokens();
		logger.info('AuthTokenContext', 'Tokens cleared');
	}, []);

	// Refresh token
	const refreshToken = useCallback(async (): Promise<boolean> => {
		if (!tokens?.refresh_token || !isRefreshTokenValid(tokens)) {
			logger.warn('AuthTokenContext', 'No valid refresh token available');
			return false;
		}

		try {
			logger.info('AuthTokenContext', 'Attempting token refresh');
			// Token refresh logic would go here
			// For now, just return false and let caller handle
			return false;
		} catch (error) {
			logger.error('AuthTokenContext', 'Token refresh failed', error);
			return false;
		}
	}, [tokens]);

	const value: AuthTokenContextType = {
		tokens,
		user,
		isAuthenticated: isTokenValid(tokens),
		isLoading,
		saveTokens,
		clearTokens,
		refreshToken,
		hasValidToken: isTokenValid(tokens),
		hasValidRefreshToken: isRefreshTokenValid(tokens),
	};

	return <AuthTokenContext.Provider value={value}>{children}</AuthTokenContext.Provider>;
};

// Custom hook
export const useAuthToken = (): AuthTokenContextType => {
	const context = useContext(AuthTokenContext);
	if (context === undefined) {
		throw new Error('useAuthToken must be used within an AuthTokenProvider');
	}
	return context;
};
