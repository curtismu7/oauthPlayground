/**
 * Centralized Callback URI Management Service
 *
 * This service provides dynamic, environment-aware callback URI management
 * to eliminate hardcoded localhost URLs and ensure proper flow-specific routing.
 */

import { FLOW_REDIRECT_URI_MAPPING } from '../utils/flowRedirectUriMapping';

const OVERRIDE_STORAGE_KEY = 'callback_uri_overrides';

export interface CallbackUriConfig {
	origin: string;
	environment?: 'development' | 'staging' | 'production';
	customPaths?: Record<string, string>;
}

export interface FlowCallbackUris {
	authzCallback: string;
	implicitCallback: string;
	logoutCallback: string;
	hybridCallback: string;
	oauthV3Callback: string;
	workerTokenCallback: string;
	clientCredentialsCallback: string;
	deviceCodeCallback: string;
	dashboardCallback: string;
	p1authCallback: string;
	unifiedMFACallback: string;
	authzLogoutCallback: string;
	implicitLogoutCallback: string;
	hybridLogoutCallback: string;
	deviceLogoutCallback: string;
	workerTokenLogoutCallback: string;
	clientCredentialsLogoutCallback: string;
	p1authLogoutCallback: string;
	dashboardLogoutCallback: string;
	unifiedMFALogoutCallback: string;
}

class CallbackUriService {
	private config: CallbackUriConfig;
	private cache: Map<string, string> = new Map();
	private callbackOverrides: Partial<Record<keyof FlowCallbackUris, string>> = {};

	private readonly defaultPaths: Record<keyof FlowCallbackUris, string> = {
		authzCallback: '/authz-callback',
		implicitCallback: '/implicit-callback',
		logoutCallback: '/logout-callback',
		hybridCallback: '/hybrid-callback',
		oauthV3Callback: '/oauth-v3-callback',
		workerTokenCallback: '/worker-token-callback',
		clientCredentialsCallback: '/client-credentials-callback',
		deviceCodeCallback: '/device-code-status',
		dashboardCallback: '/dashboard-callback',
		p1authCallback: '/p1auth-callback',
		unifiedMFACallback: '/v8/unified-mfa-callback',
		authzLogoutCallback: '/logout-callback',
		implicitLogoutCallback: '/logout-callback-implicit',
		hybridLogoutCallback: '/hybrid-logout-callback',
		deviceLogoutCallback: '/device-logout-callback',
		workerTokenLogoutCallback: '/worker-token-logout-callback',
		clientCredentialsLogoutCallback: '/client-credentials-logout-callback',
		p1authLogoutCallback: '/p1auth-logout-callback',
		dashboardLogoutCallback: '/dashboard-logout-callback',
		unifiedMFALogoutCallback: '/v8/unified-mfa-logout-callback',
	};

	constructor(config?: Partial<CallbackUriConfig>) {
		this.config = {
			origin: this.detectOrigin(),
			environment: this.detectEnvironment(),
			customPaths: {},
			...config,
		};

		this.loadOverrides();
	}

	private detectOrigin(): string {
		if (typeof window === 'undefined') {
			return 'https://localhost:3000';
		}

		// Ensure HTTPS is used for security, even in development
		const origin = window.location.origin;
		if (origin.startsWith('http://localhost')) {
			return origin.replace('http://', 'https://');
		}
		return origin;
	}

	private detectEnvironment(): 'development' | 'staging' | 'production' {
		if (typeof window === 'undefined') {
			return 'development';
		}

		const hostname = window.location.hostname;

		if (hostname === 'localhost' || hostname === '127.0.0.1') {
			return 'development';
		}

		if (hostname.includes('staging') || hostname.includes('dev')) {
			return 'staging';
		}

		return 'production';
	}

	private normalizeOverride(uri?: string | null): string | null {
		if (!uri) {
			return null;
		}

		const trimmed = uri.trim();
		if (!trimmed) {
			return null;
		}

		if (/^https?:\/\//i.test(trimmed)) {
			return trimmed;
		}

		return trimmed.startsWith('/')
			? `${this.config.origin}${trimmed}`
			: `${this.config.origin}/${trimmed}`;
	}

	private buildDefaultUri(callbackType: keyof FlowCallbackUris): string {
		const basePath = this.defaultPaths[callbackType];
		if (/^https?:\/\//i.test(basePath)) {
			return basePath;
		}

		return `${this.config.origin}${basePath}`;
	}

	private buildCallbackUri(callbackType: keyof FlowCallbackUris): string {
		const override = this.callbackOverrides[callbackType];
		if (override) {
			return override;
		}

		return this.buildDefaultUri(callbackType);
	}

	private saveOverrides(): void {
		if (typeof window === 'undefined') {
			return;
		}

		window.localStorage.setItem(OVERRIDE_STORAGE_KEY, JSON.stringify(this.callbackOverrides));
	}

	private loadOverrides(): void {
		if (typeof window === 'undefined') {
			return;
		}

		try {
			const raw = window.localStorage.getItem(OVERRIDE_STORAGE_KEY);
			if (raw) {
				const parsed = JSON.parse(raw) as Partial<Record<keyof FlowCallbackUris, string>>;
				this.callbackOverrides = parsed;
			}
		} catch (error) {
			console.error('[CallbackUriService] Failed to load overrides:', error);
			this.callbackOverrides = {};
		}
	}

	getCallbackUri(flowType: keyof FlowCallbackUris): string {
		const cacheKey = `${this.config.origin}-${flowType}-${this.callbackOverrides[flowType] ?? 'default'}`;

		if (this.cache.has(cacheKey)) {
			return this.cache.get(cacheKey)!;
		}

		const uri = this.buildCallbackUri(flowType);
		this.cache.set(cacheKey, uri);
		return uri;
	}

	private getCallbackTypesForFlow(flowKey: string): {
		redirect: keyof FlowCallbackUris;
		logout: keyof FlowCallbackUris;
	} {
		const normalized = flowKey.toLowerCase();

		// Check for worker-token FIRST (more specific)
		if (normalized.includes('worker-token')) {
			return { redirect: 'workerTokenCallback', logout: 'workerTokenLogoutCallback' };
		}

		// Then check for client-credentials (separate from worker-token)
		if (normalized.includes('client-credentials')) {
			return { redirect: 'clientCredentialsCallback', logout: 'clientCredentialsLogoutCallback' };
		}

		if (normalized.includes('device')) {
			return { redirect: 'deviceCodeCallback', logout: 'deviceLogoutCallback' };
		}

		if (normalized.includes('implicit')) {
			return { redirect: 'implicitCallback', logout: 'implicitLogoutCallback' };
		}

		if (normalized.includes('hybrid')) {
			return { redirect: 'hybridCallback', logout: 'hybridLogoutCallback' };
		}

		if (normalized.includes('dashboard')) {
			return { redirect: 'dashboardCallback', logout: 'dashboardLogoutCallback' };
		}

		if (normalized.includes('pingone') && normalized.includes('auth')) {
			return { redirect: 'p1authCallback', logout: 'p1authLogoutCallback' };
		}

		if (normalized.includes('unified') && normalized.includes('mfa')) {
			return { redirect: 'unifiedMFACallback', logout: 'unifiedMFALogoutCallback' };
		}

		return { redirect: 'authzCallback', logout: 'authzLogoutCallback' };
	}

	getCallbackUriForFlow(flowType: string): {
		redirectUri: string;
		description: string;
		note: string;
		logoutUri: string;
		logoutNote: string;
	} {
		const baseFlowMap = {
			authorization_code: {
				description: 'Authorization Code Flow',
				note: 'Handles authorization code redirects. Required for OAuth/OIDC Authorization Code flows.',
				logoutNote:
					'Handles logout redirects for Authorization Code Flow. Required for RP-initiated logout.',
			},
			implicit: {
				description: 'Implicit Flow',
				note: 'Handles implicit flow token responses. Required for OAuth/OIDC Implicit flows.',
				logoutNote: 'Handles logout redirects for Implicit Flow. Required for RP-initiated logout.',
			},
			hybrid: {
				description: 'OIDC Hybrid Flow',
				note: 'Handles OIDC hybrid flow responses. Required for Hybrid flows.',
				logoutNote: 'Handles logout redirects for OIDC Hybrid Flow.',
			},
			device: {
				description: 'Device Authorization Flow',
				note: 'Handles device authorization polling status.',
				logoutNote: 'Handles logout redirects for Device Authorization Flow.',
			},
			client_credentials: {
				description: 'Worker Token / Client Credentials Flow',
				note: 'Handles worker token callback operations.',
				logoutNote: 'Handles logout redirects for Worker Token Flow.',
			},
			pingone_auth: {
				description: 'PingOne Authentication Flow',
				note: 'Handles PingOne authentication redirects.',
				logoutNote: 'Handles logout redirects for PingOne Authentication.',
			},
			dashboard: {
				description: 'Dashboard Login Flow',
				note: 'Handles dashboard login redirects.',
				logoutNote: 'Handles logout redirects for Dashboard Login.',
			},
		} as const;

		const normalized = flowType.toLowerCase();
		let baseKey: keyof typeof baseFlowMap = 'authorization_code';

		if (normalized.includes('implicit')) {
			baseKey = 'implicit';
		} else if (normalized.includes('hybrid')) {
			baseKey = 'hybrid';
		} else if (normalized.includes('device')) {
			baseKey = 'device';
		} else if (normalized.includes('worker-token') || normalized.includes('client-credentials')) {
			baseKey = 'client_credentials';
		} else if (normalized.includes('pingone') && normalized.includes('auth')) {
			baseKey = 'pingone_auth';
		} else if (normalized.includes('dashboard')) {
			baseKey = 'dashboard';
		}

		const flowInfo = baseFlowMap[baseKey];
		const { redirect, logout } = this.getCallbackTypesForFlow(flowType);

		return {
			redirectUri: this.getCallbackUri(redirect),
			description: flowInfo.description,
			note: flowInfo.note,
			logoutUri: this.getCallbackUri(logout),
			logoutNote: flowInfo.logoutNote,
		};
	}

	/**
	 * Alias for getCallbackUriForFlow for backward compatibility
	 */
	getRedirectUriForFlow(flowType: string): {
		redirectUri: string;
		description: string;
		note: string;
		logoutUri: string;
		logoutNote: string;
	} {
		return this.getCallbackUriForFlow(flowType);
	}

	getAllRedirectUriInfo(): Array<{
		flowType: string;
		redirectUri: string;
		description: string;
		note: string;
		logoutUri: string;
		logoutNote: string;
	}> {
		const flowTypes = [
			'authorization_code',
			'implicit',
			'hybrid',
			'device',
			'client_credentials',
			'pingone_auth',
			'dashboard',
		];

		return flowTypes.map((flowType) => {
			const info = this.getCallbackUriForFlow(flowType);
			return {
				flowType,
				...info,
			};
		});
	}

	getRedirectUriCatalog(): Array<{
		flowType: string;
		description: string;
		specification: string;
		requiresRedirectUri: boolean;
		redirectUri: string;
		logoutUri: string;
		defaultRedirectUri: string;
		defaultLogoutUri: string;
		isOverrideRedirect: boolean;
		isOverrideLogout: boolean;
	}> {
		return FLOW_REDIRECT_URI_MAPPING.map((config) => {
			const { redirect, logout } = this.getCallbackTypesForFlow(config.flowType);
			const redirectUri = config.requiresRedirectUri
				? this.getCallbackUri(redirect)
				: 'Not required';
			const logoutUri = this.getCallbackUri(logout);
			const defaultRedirectUri = config.requiresRedirectUri
				? this.buildDefaultUri(redirect)
				: 'Not required';
			const defaultLogoutUri = this.buildDefaultUri(logout);

			return {
				flowType: config.flowType,
				description: config.description,
				specification: config.specification,
				requiresRedirectUri: config.requiresRedirectUri,
				redirectUri,
				logoutUri,
				defaultRedirectUri,
				defaultLogoutUri,
				isOverrideRedirect: config.requiresRedirectUri ? redirectUri !== defaultRedirectUri : false,
				isOverrideLogout: logoutUri !== defaultLogoutUri,
			};
		});
	}

	applyFlowOverrides(
		overrides: Record<string, { redirectUri?: string; logoutUri?: string }>
	): void {
		const updatedOverrides: Partial<Record<keyof FlowCallbackUris, string>> = {};

		FLOW_REDIRECT_URI_MAPPING.forEach((config) => {
			const flowOverride = overrides[config.flowType];
			const { redirect, logout } = this.getCallbackTypesForFlow(config.flowType);

			if (config.requiresRedirectUri) {
				const candidate = this.normalizeOverride(flowOverride?.redirectUri);
				const defaultUri = this.buildDefaultUri(redirect);

				if (candidate && candidate !== defaultUri) {
					updatedOverrides[redirect] = candidate;
				}
			}

			const logoutCandidate = this.normalizeOverride(flowOverride?.logoutUri);
			const defaultLogoutUri = this.buildDefaultUri(logout);

			if (logoutCandidate && logoutCandidate !== defaultLogoutUri) {
				updatedOverrides[logout] = logoutCandidate;
			}
		});

		this.callbackOverrides = updatedOverrides;
		this.cache.clear();
		this.saveOverrides();
	}

	getFlowOverrides(): Record<string, { redirectUri?: string; logoutUri?: string }> {
		const result: Record<string, { redirectUri?: string; logoutUri?: string }> = {};

		FLOW_REDIRECT_URI_MAPPING.forEach((config) => {
			const { redirect, logout } = this.getCallbackTypesForFlow(config.flowType);
			const redirectOverride = this.callbackOverrides[redirect];
			const logoutOverride = this.callbackOverrides[logout];

			if (redirectOverride || logoutOverride) {
				const overridesForFlow: { redirectUri?: string; logoutUri?: string } = {};
				if (redirectOverride) {
					overridesForFlow.redirectUri = redirectOverride;
				}
				if (logoutOverride) {
					overridesForFlow.logoutUri = logoutOverride;
				}

				result[config.flowType] = overridesForFlow;
			}
		});

		return result;
	}

	updateConfig(config: Partial<CallbackUriConfig>): void {
		this.config = { ...this.config, ...config };
		this.cache.clear();
	}

	clearCache(): void {
		this.cache.clear();
	}

	getAllCallbackUris(): FlowCallbackUris {
		return {
			authzCallback: this.getCallbackUri('authzCallback'),
			implicitCallback: this.getCallbackUri('implicitCallback'),
			logoutCallback: this.getCallbackUri('logoutCallback'),
			hybridCallback: this.getCallbackUri('hybridCallback'),
			oauthV3Callback: this.getCallbackUri('oauthV3Callback'),
			workerTokenCallback: this.getCallbackUri('workerTokenCallback'),
			clientCredentialsCallback: this.getCallbackUri('clientCredentialsCallback'),
			deviceCodeCallback: this.getCallbackUri('deviceCodeCallback'),
			dashboardCallback: this.getCallbackUri('dashboardCallback'),
			p1authCallback: this.getCallbackUri('p1authCallback'),
			authzLogoutCallback: this.getCallbackUri('authzLogoutCallback'),
			implicitLogoutCallback: this.getCallbackUri('implicitLogoutCallback'),
			hybridLogoutCallback: this.getCallbackUri('hybridLogoutCallback'),
			deviceLogoutCallback: this.getCallbackUri('deviceLogoutCallback'),
			workerTokenLogoutCallback: this.getCallbackUri('workerTokenLogoutCallback'),
			clientCredentialsLogoutCallback: this.getCallbackUri('clientCredentialsLogoutCallback'),
			p1authLogoutCallback: this.getCallbackUri('p1authLogoutCallback'),
			dashboardLogoutCallback: this.getCallbackUri('dashboardLogoutCallback'),
		};
	}
}

export const callbackUriService = new CallbackUriService();
export const createCallbackUriService = (config?: Partial<CallbackUriConfig>) =>
	new CallbackUriService(config);
