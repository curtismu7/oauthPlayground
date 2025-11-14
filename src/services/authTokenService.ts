// src/services/authTokenService.ts
import type { OAuthTokens, UserInfo } from '../types/storage';
import { logger } from '../utils/logger';
import { oauthStorage } from '../utils/storage';

const LEGACY_TOKEN_KEYS = [
	'pingone_secure_tokens',
	'pingone_tokens',
	'tokens',
	'oauth_tokens',
	'oidc_tokens',
	'implicit_tokens',
	'device_code_tokens',
	'client_credentials_tokens',
	'hybrid_tokens',
	'worker_token_tokens',
	'authz_flow_tokens',
	'oauth2_implicit_tokens',
	'oidc_implicit_tokens',
	'oauth2_client_credentials_tokens',
	'oidc_client_credentials_tokens',
	'device_code_oidc_tokens',
	'worker_token_v3_tokens',
] as const;

/**
 * Determine whether the supplied token set is still valid.
 */
export const isTokenValid = (tokens: OAuthTokens | null): boolean => {
	if (!tokens?.access_token) {
		return false;
	}
	const now = Date.now();
	const expiresAt = tokens.expires_at ?? 0;
	return expiresAt ? now < expiresAt : false;
};

/**
 * Determine whether the supplied refresh token is still valid.
 */
export const isRefreshTokenValid = (tokens: OAuthTokens | null): boolean => {
	if (!tokens?.refresh_token) {
		return false;
	}
	const now = Date.now();
	const refreshExpiresAt = tokens.refresh_expires_at ?? 0;
	return refreshExpiresAt ? now < refreshExpiresAt : false;
};

/**
 * Safely retrieve the most recent tokens from secure storage.
 */
export const getStoredTokens = (): OAuthTokens | null => {
	try {
		const tokens = oauthStorage.getTokens();
		return tokens ? JSON.parse(JSON.stringify(tokens)) : null;
	} catch (error) {
		logger.error('AuthTokenService', 'Error parsing stored tokens', error);
		return null;
	}
};

/**
 * Locate valid tokens across all historic storage locations.
 */
export const getAllStoredTokens = (): OAuthTokens | null => {
	try {
		for (const key of LEGACY_TOKEN_KEYS) {
			try {
				const sessionData = sessionStorage.getItem(key);
				if (sessionData) {
					try {
						const parsed = JSON.parse(sessionData);
						if (parsed?.access_token && isTokenValid(parsed)) {
							logger.info('AuthTokenService', `Found valid session tokens in ${key}`, {
								key,
								hasAccessToken: Boolean(parsed.access_token),
								hasIdToken: Boolean(parsed.id_token),
								tokenType: parsed.token_type,
							});
							return parsed;
						}
					} catch (parseError) {
						logger.warn('AuthTokenService', `Invalid JSON in sessionStorage ${key}, clearing`, {
							key,
							error: parseError instanceof Error ? parseError.message : 'Unknown error',
							dataPreview: `${sessionData.substring(0, 50)}...`,
						});
						sessionStorage.removeItem(key);
					}
				}

				const localData = localStorage.getItem(key);
				if (localData) {
					try {
						const parsed = JSON.parse(localData);
						if (parsed?.access_token && isTokenValid(parsed)) {
							logger.info('AuthTokenService', `Found valid local tokens in ${key}`, {
								key,
								hasAccessToken: Boolean(parsed.access_token),
								hasIdToken: Boolean(parsed.id_token),
								tokenType: parsed.token_type,
							});
							return parsed;
						}
					} catch (parseError) {
						logger.warn('AuthTokenService', `Invalid JSON in localStorage ${key}, clearing`, {
							key,
							error: parseError instanceof Error ? parseError.message : 'Unknown error',
							dataPreview: `${localData.substring(0, 50)}...`,
						});
						localStorage.removeItem(key);
					}
				}
			} catch (storageError) {
				logger.debug('AuthTokenService', `Error checking ${key}`, storageError);
			}
		}

		const tokens = oauthStorage.getTokens();
		if (tokens && isTokenValid(tokens)) {
			logger.info('AuthTokenService', 'Found valid tokens in oauthStorage');
			return tokens;
		}

		logger.info('AuthTokenService', 'No valid tokens discovered in any storage location');
		return null;
	} catch (error) {
		logger.error('AuthTokenService', 'Failed to inspect stored tokens', error);
		return null;
	}
};

/**
 * Retrieve the stored user profile from secure storage.
 */
export const getStoredUser = (): UserInfo | null => {
	try {
		const user = oauthStorage.getUserInfo();
		return user ? JSON.parse(JSON.stringify(user)) : null;
	} catch (error) {
		logger.error('AuthTokenService', 'Error parsing stored user info', error);
		return null;
	}
};





