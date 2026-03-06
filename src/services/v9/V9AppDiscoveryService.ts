// src/services/v9/V9AppDiscoveryService.ts
// V9 wrapper around AppDiscoveryServiceV8 for worker-token-based PingOne app listing.
//
// What this gives every V9 flow:
//   1. discoverApplications() — fetch all apps in the environment using worker token
//   2. applyAppConfig()       — map a discovered app → V9FlowCredentials to fill the form
//   3. getAppsByGrantType()   — filter to relevant apps for a given OAuth grant type
//
// Usage in a V9 flow component:
//   const apps = await V9AppDiscoveryService.discoverApplications(environmentId, workerToken);
//   const creds = V9AppDiscoveryService.applyAppConfig(selectedApp);
//   await V9CredentialStorageService.save('my-flow-v9', { ...existingCreds, ...creds });
//
// The worker token comes from the global hook in the component:
//   const { token, isValid } = useGlobalWorkerToken();
//
// Migration rule: Every V9 flow's credential panel MUST include an app picker
// that calls this service. See docs/migration/V9_MIGRATION_TODOS.md § Mandatory.

import {
	type AppConfig,
	AppDiscoveryServiceV8,
	type DiscoveredApplication,
} from '../../v8/services/appDiscoveryServiceV8';
import type { V9FlowCredentials } from './V9CredentialStorageService';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * A discovered PingOne application, trimmed to what V9 flows need.
 */
export interface V9DiscoveredApp {
	/** PingOne application ID (used as clientId) */
	clientId: string;
	/** Display name */
	name: string;
	/** Optional description */
	description?: string;
	/** Application type */
	type: 'NATIVE_APP' | 'WEB_APP' | 'SINGLE_PAGE_APP' | 'SERVICE';
	/** Whether the app is enabled in PingOne */
	enabled: boolean;
	/** OAuth grant types the app supports */
	grantTypes: string[];
	/** Configured redirect URIs */
	redirectUris: string[];
	/** Whether PKCE is required */
	pkceRequired: boolean;
	/** Raw PingOne application record — use for advanced access */
	_raw: DiscoveredApplication;
}

export interface V9AppDiscoveryResult {
	success: boolean;
	apps: V9DiscoveredApp[];
	error?: string;
}

// ─── Grant-type filter map ─────────────────────────────────────────────────────

const GRANT_TYPE_FILTERS: Record<string, string[]> = {
	authorization_code: ['WEB_APP', 'SINGLE_PAGE_APP', 'NATIVE_APP'],
	implicit: ['SINGLE_PAGE_APP', 'WEB_APP'],
	client_credentials: ['SERVICE'],
	device_code: ['NATIVE_APP'],
	token_exchange: ['SERVICE', 'WEB_APP'],
	'urn:ietf:params:oauth:grant-type:token-exchange': ['SERVICE', 'WEB_APP'],
	par: ['WEB_APP', 'SINGLE_PAGE_APP'],
	ciba: ['WEB_APP', 'SERVICE'],
};

// ─── Service ──────────────────────────────────────────────────────────────────

export const V9AppDiscoveryService = {
	/**
	 * Discover all PingOne applications in an environment.
	 *
	 * @param environmentId - PingOne environment ID
	 * @param workerToken   - Worker token from useGlobalWorkerToken()
	 * @returns Discovery result with apps array
	 */
	async discoverApplications(
		environmentId: string,
		workerToken: string
	): Promise<V9AppDiscoveryResult> {
		if (!environmentId.trim()) {
			return { success: false, apps: [], error: 'Environment ID is required' };
		}
		if (!workerToken.trim()) {
			return {
				success: false,
				apps: [],
				error: 'Worker token is required. Generate one from the Worker Token section.',
			};
		}

		try {
			const rawApps = await AppDiscoveryServiceV8.discoverApplications(environmentId, workerToken);

			const apps: V9DiscoveredApp[] = rawApps.map((app) => ({
				clientId: app.id,
				name: app.name,
				...(app.description !== undefined ? { description: app.description } : {}),
				type: app.type,
				enabled: app.enabled,
				grantTypes: app.grantTypes ?? [],
				redirectUris: app.redirectUris ?? [],
				pkceRequired: app.pkceRequired ?? false,
				_raw: app,
			}));

			return { success: true, apps };
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			return { success: false, apps: [], error: `Failed to discover applications: ${message}` };
		}
	},

	/**
	 * Filter discovered apps to those relevant for a given grant type.
	 *
	 * @param apps      - Apps returned by discoverApplications()
	 * @param grantType - e.g. 'authorization_code', 'client_credentials'
	 */
	getAppsByGrantType(apps: V9DiscoveredApp[], grantType: string): V9DiscoveredApp[] {
		const allowedTypes = GRANT_TYPE_FILTERS[grantType];
		if (!allowedTypes) return apps; // Unknown grant type — show all

		return apps.filter((app) => app.enabled && allowedTypes.includes(app.type));
	},

	/**
	 * Map a discovered app to V9FlowCredentials for form auto-fill.
	 *
	 * Merge the result with your existing credentials to keep fields
	 * the app doesn't provide (e.g. clientSecret entered manually):
	 *   const creds = { ...existing, ...V9AppDiscoveryService.applyAppConfig(app) };
	 *
	 * @param app         - App from discoverApplications()
	 * @param workerToken - Pass in to attempt fetching clientSecret from PingOne API
	 */
	applyAppConfig(app: V9DiscoveredApp): Partial<V9FlowCredentials> {
		const raw = app._raw;

		// Use AppDiscoveryServiceV8.getAppConfig for the canonical mapping
		const config: AppConfig = AppDiscoveryServiceV8.getAppConfig(raw);

		return {
			clientId: app.clientId,
			...(config.clientSecret && { clientSecret: config.clientSecret }),
			...(config.redirectUri && { redirectUri: config.redirectUri }),
			...(config.scopes?.length && { scope: config.scopes.join(' ') }),
		};
	},
} as const;

export default V9AppDiscoveryService;
