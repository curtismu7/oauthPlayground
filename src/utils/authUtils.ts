import { OAuthTokens, UserInfo } from '../types/storage';
import { logger } from './logger';

export const safeGetTokens = (): OAuthTokens | null => {
	try {
		const tokens = localStorage.getItem('auth_tokens');
		return tokens ? JSON.parse(tokens) : null;
	} catch (error) {
		logger.error('AuthUtils', 'Error parsing auth tokens:', undefined, error as Error);
		return null;
	}
};

export const safeGetUserInfo = (): UserInfo | null => {
	try {
		const user = localStorage.getItem('user_info');
		return user ? JSON.parse(user) : null;
	} catch (error) {
		logger.error('AuthUtils', 'Error parsing user info:', undefined, error as Error);
		return null;
	}
};

export const isTokenValid = (tokens: OAuthTokens | null): boolean => {
	if (!tokens?.access_token) return false;

	const now = Date.now();
	const expiresAt = tokens.expires_at || 0;

	// Consider token valid if it has at least 5 minutes remaining
	return expiresAt ? now < expiresAt - 300000 : false;
};

export const isRefreshTokenValid = (tokens: OAuthTokens | null): boolean => {
	if (!tokens?.refresh_token) return false;

	const now = Date.now();
	const refreshExpiresAt = tokens.refresh_expires_at || 0;

	// Consider refresh token valid if it has at least 5 minutes remaining
	return refreshExpiresAt ? now < refreshExpiresAt - 300000 : false;
};
