// src/services/authConfigurationService.ts

import type { AuthAppConfig } from '../types/auth';
import { credentialManager } from '../utils/credentialManager';
import { logger } from '../utils/logger';
import { loadFlowCredentialsIsolated } from './flowCredentialService';
import { pingOneConfigService } from './pingoneConfigService';

interface WindowWithPingOne extends Window {
	__PINGONE_ENVIRONMENT_ID__?: string;
	__PINGONE_API_URL__?: string;
	__PINGONE_CLIENT_ID__?: string;
	__PINGONE_CLIENT_SECRET__?: string;
	__PINGONE_REDIRECT_URI__?: string;
	__PINGONE_AUTH_SERVER_ID__?: string;
	__PINGONE_ALLOW_REDIRECT_URI_PATTERNS__?: string;
}

const DEFAULT_SCOPES = ['openid', 'profile', 'email'] as const;
const CONFIG_CHANGE_EVENT = 'pingone-config-changed';

let isLoadingConfiguration = false;

const getWindow = (): WindowWithPingOne | undefined => {
	if (typeof window === 'undefined') {
		return undefined;
	}
	return window as WindowWithPingOne;
};

const getOrigin = (): string => {
	const win = getWindow();
	return win?.location?.origin ?? '';
};

const buildEndpoints = (environmentId?: string) => {
	if (!environmentId) {
		return {
			authorizationEndpoint: '',
			tokenEndpoint: '',
			userInfoEndpoint: '',
			endSessionEndpoint: '',
		};
	}

	const baseUrl = `https://auth.pingone.com/${environmentId}/as`;
	return {
		authorizationEndpoint: `${baseUrl}/authorize`,
		tokenEndpoint: `${baseUrl}/token`,
		userInfoEndpoint: `${baseUrl}/userinfo`,
		endSessionEndpoint: `${baseUrl}/signoff`,
	};
};

const normaliseScopes = (scopes?: string | string[]) => {
	if (!scopes) {
		return [...DEFAULT_SCOPES];
	}
	if (Array.isArray(scopes)) {
		return scopes;
	}
	return scopes.split(' ').filter(Boolean);
};

const buildConfigFromCredentials = (
	credentials: Record<string, unknown>,
	defaultRedirect?: string
): AuthAppConfig => {
	const environmentId = (credentials.environmentId ?? '') as string;
	const redirectUri = (credentials.redirectUri ??
		credentials.postLogoutRedirectUri ??
		defaultRedirect ??
		`${getOrigin()}/authz-callback`) as string;

	const endpoints = buildEndpoints(environmentId);

	const authorizationEndpoint = (credentials.authorizationEndpoint ??
		credentials.authEndpoint ??
		endpoints.authorizationEndpoint) as string;
	const tokenEndpoint = (credentials.tokenEndpoint ?? endpoints.tokenEndpoint) as string;
	const userInfoEndpoint = (credentials.userInfoEndpoint ?? endpoints.userInfoEndpoint) as string;
	const endSessionEndpoint = (credentials.endSessionEndpoint ??
		endpoints.endSessionEndpoint) as string;

	return {
		disableLogin: false,
		clientId: (credentials.clientId ?? '') as string,
		clientSecret: (credentials.clientSecret ?? '') as string,
		redirectUri,
		authorizationEndpoint,
		tokenEndpoint,
		userInfoEndpoint,
		endSessionEndpoint,
		scopes: (credentials.scopes ??
			credentials.scope ?? [
				...normaliseScopes(credentials.scopes ?? credentials.scope),
			]) as string[],
		environmentId,
		hasConfigError: false,
		pingone: {
			clientId: (credentials.clientId ?? '') as string,
			clientSecret: (credentials.clientSecret ?? '') as string,
			environmentId,
			redirectUri,
			authEndpoint: authorizationEndpoint,
			tokenEndpoint,
			userInfoEndpoint,
			endSessionEndpoint,
		},
	};
};

export const createDefaultAuthConfig = (): AuthAppConfig => ({
	disableLogin: false,
	clientId: '',
	clientSecret: '',
	redirectUri: `${getOrigin()}/authz-callback`,
	authorizationEndpoint: '',
	tokenEndpoint: '',
	userInfoEndpoint: '',
	endSessionEndpoint: '',
	scopes: [...DEFAULT_SCOPES],
	environmentId: '',
	hasConfigError: false,
});

const buildEnvConfig = (): AuthAppConfig => {
	const win = getWindow();
	const envConfig = {
		disableLogin: false,
		clientId: win?.__PINGONE_CLIENT_ID__ ?? '',
		clientSecret: win?.__PINGONE_CLIENT_SECRET__ ?? '',
		redirectUri: win?.__PINGONE_REDIRECT_URI__ ?? `${getOrigin()}/authz-callback`,
		authorizationEndpoint: '',
		tokenEndpoint: '',
		userInfoEndpoint: '',
		endSessionEndpoint: '',
		scopes: [...DEFAULT_SCOPES],
		environmentId: win?.__PINGONE_ENVIRONMENT_ID__ ?? '',
		hasConfigError: false,
	};

	logger.info('AuthConfigurationService', 'Environment configuration resolved', {
		hasClientId: Boolean(envConfig.clientId),
		hasEnvironmentId: Boolean(envConfig.environmentId),
	});

	return envConfig;
};

const loadFromFlowCredentialService = async (): Promise<AuthAppConfig | null> => {
	const candidates: Array<{ key: string; defaultRedirect: string }> = [
		{
			key: 'configuration.credentials',
			defaultRedirect: `${getOrigin()}/callback`,
		},
		{
			key: 'credential-setup-modal',
			defaultRedirect: `${getOrigin()}/authz-callback`,
		},
		{
			key: 'dashboard-login',
			defaultRedirect: `${getOrigin()}/dashboard-callback`,
		},
	];

	for (const candidate of candidates) {
		try {
			const isolated = await loadFlowCredentialsIsolated({
				flowKey: candidate.key,
				defaultCredentials: {
					environmentId: '',
					clientId: '',
					clientSecret: '',
					redirectUri: candidate.defaultRedirect,
					scope: 'openid profile email',
					scopes: 'openid profile email',
					loginHint: '',
					postLogoutRedirectUri: '',
					responseType: 'code',
					grantType: 'authorization_code',
					issuerUrl: '',
					authorizationEndpoint: '',
					tokenEndpoint: '',
					userInfoEndpoint: '',
					clientAuthMethod: 'client_secret_post',
					tokenEndpointAuthMethod: 'client_secret_post',
				},
				useSharedFallback: false,
			});

			const credentials = isolated.credentials;

			if (credentials?.clientId && credentials?.environmentId) {
				logger.info(
					'AuthConfigurationService',
					`Using credentials from FlowCredentialService (${candidate.key})`
				);
				return buildConfigFromCredentials(credentials, candidate.defaultRedirect);
			}
		} catch (error) {
			logger.debug(
				'AuthConfigurationService',
				`FlowCredentialService unavailable for ${candidate.key}`,
				error
			);
		}
	}

	return null;
};

const loadFromCredentialManager = (): AuthAppConfig | null => {
	const permanentCredentials = credentialManager.getAllCredentials();
	if (permanentCredentials?.clientId && permanentCredentials?.environmentId) {
		logger.info('AuthConfigurationService', 'Using credentialManager credentials');
		return buildConfigFromCredentials(permanentCredentials);
	}

	const configCredentials = credentialManager.loadConfigCredentials();
	const authzCredentials = credentialManager.loadAuthzFlowCredentials();
	const primaryCredentials =
		configCredentials.environmentId && configCredentials.clientId
			? configCredentials
			: authzCredentials;

	if (primaryCredentials.environmentId && primaryCredentials.clientId) {
		logger.info(
			'AuthConfigurationService',
			'Using config/authz credentials from credentialManager'
		);
		return buildConfigFromCredentials(primaryCredentials);
	}

	return null;
};

const loadFromPingOneConfigService = (): AuthAppConfig | null => {
	try {
		const config = pingOneConfigService.getConfig();
		if (config?.clientId && config?.environmentId) {
			logger.info('AuthConfigurationService', 'Using pingOneConfigService configuration');
			return buildConfigFromCredentials(config);
		}
	} catch (error) {
		logger.debug('AuthConfigurationService', 'PingOne config service unavailable', error);
	}
	return null;
};

/**
 * Load the active PingOne authentication configuration.
 */
export const loadAuthConfiguration = async (): Promise<AuthAppConfig> => {
	if (isLoadingConfiguration) {
		return new Promise((resolve) => {
			const interval = setInterval(async () => {
				if (!isLoadingConfiguration) {
					clearInterval(interval);
					resolve(loadAuthConfiguration());
				}
			}, 100);
		});
	}

	isLoadingConfiguration = true;

	try {
		logger.info('AuthConfigurationService', 'Loading authentication configuration');

		const flowConfig = await loadFromFlowCredentialService();
		if (flowConfig) {
			return flowConfig;
		}

		const permanentConfig = loadFromCredentialManager();
		if (permanentConfig) {
			return permanentConfig;
		}

		const pingOneConfig = loadFromPingOneConfigService();
		if (pingOneConfig) {
			return pingOneConfig;
		}

		const envConfig = buildEnvConfig();
		if (envConfig.clientId && envConfig.environmentId) {
			logger.info('AuthConfigurationService', 'Using environment fallback configuration');
			return envConfig;
		}

		logger.warn(
			'AuthConfigurationService',
			'Falling back to default configuration - no credentials found'
		);
		return createDefaultAuthConfig();
	} catch (error) {
		logger.error('AuthConfigurationService', 'Error while loading configuration', error);
		const defaultConfig = createDefaultAuthConfig();
		defaultConfig.hasConfigError = true;
		return defaultConfig;
	} finally {
		isLoadingConfiguration = false;
	}
};

type AuthConfigChangeHandler = () => void | Promise<void>;

/**
 * Subscribe to PingOne configuration change notifications.
 */
export const subscribeToAuthConfigurationChanges = (
	handler: AuthConfigChangeHandler
): (() => void) => {
	if (typeof window === 'undefined') {
		return () => undefined;
	}

	const listener = () => {
		try {
			const result = handler();
			if (result instanceof Promise) {
				result.catch((error) => {
					logger.error(
						'AuthConfigurationService',
						'Async configuration change handler failed',
						error
					);
				});
			}
		} catch (error) {
			logger.error(
				'AuthConfigurationService',
				'Synchronous configuration change handler failed',
				error
			);
		}
	};

	window.addEventListener(CONFIG_CHANGE_EVENT, listener);

	return () => {
		window.removeEventListener(CONFIG_CHANGE_EVENT, listener);
	};
};

export const AUTH_CONFIGURATION_EVENT = CONFIG_CHANGE_EVENT;
