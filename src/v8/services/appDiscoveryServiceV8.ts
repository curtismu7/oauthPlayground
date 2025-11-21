/**
 * @file appDiscoveryServiceV8.ts
 * @module v8/services
 * @description Application discovery service for V8 flows
 * @version 8.0.0
 * @since 2024-11-16
 *
 * Discovers all PingOne applications in an environment using worker token.
 * Auto-fills form fields when app is selected.
 * Manages worker token storage and retrieval.
 *
 * @example
 * // Get or prompt for worker token
 * const token = await AppDiscoveryServiceV8.getWorkerToken();
 *
 * // Discover all apps
 * const apps = await AppDiscoveryServiceV8.discoverApplications(
 *   environmentId,
 *   token
 * );
 *
 * // Get app config for auto-fill
 * const config = AppDiscoveryServiceV8.getAppConfig(app);
 */

const MODULE_TAG = '[🔎 APP-DISCOVERY-V8]';

// ============================================================================
// TYPES
// ============================================================================

export interface DiscoveredApplication {
	id: string;
	name: string;
	description?: string;
	type: 'NATIVE_APP' | 'WEB_APP' | 'SINGLE_PAGE_APP' | 'SERVICE';
	enabled: boolean;
	grantTypes: string[];
	responseTypes: string[];
	redirectUris: string[];
	tokenEndpointAuthMethod: string;
	pkceRequired?: boolean;
	pkceEnforced?: boolean;
	accessTokenDuration?: number;
	refreshTokenDuration?: number;
	tokenFormat?: 'OPAQUE' | 'JWT';
}

export interface AppConfig {
	clientId: string;
	clientSecret?: string;
	redirectUri: string;
	scopes: string[];
	grantType: string;
	responseType: string;
	tokenEndpointAuthMethod: string;
	usePkce: boolean;
	accessTokenDuration?: number;
	refreshTokenDuration?: number;
	tokenFormat?: string;
}

export interface WorkerTokenInfo {
	token: string;
	storedAt: number;
	expiresAt?: number;
}

// ============================================================================
// APP DISCOVERY SERVICE CLASS
// ============================================================================

// DualStorageServiceV8 import removed - no longer needed for worker token storage
// import { DualStorageServiceV8 } from './dualStorageServiceV8';
import { workerTokenServiceV8 } from './workerTokenServiceV8';

export class AppDiscoveryServiceV8 {
	// Worker token storage constants removed - now using workerTokenServiceV8
	// Legacy constants kept for backwards compatibility during migration
	private static readonly WORKER_TOKEN_KEY = 'v8:worker-token'; // DEPRECATED - use workerTokenServiceV8
	private static readonly WORKER_TOKEN_DIRECTORY = 'v8'; // DEPRECATED
	private static readonly WORKER_TOKEN_FILENAME = 'worker-token.json'; // DEPRECATED
	private static readonly WORKER_TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

	/**
	 * Get or prompt for worker token
	 * @returns Worker token
	 * @example
	 * const token = await AppDiscoveryServiceV8.getWorkerToken();
	 */
	static async getWorkerToken(): Promise<string | null> {
		console.log(`${MODULE_TAG} Getting worker token`);

		// Try to get from storage (async)
		const stored = await AppDiscoveryServiceV8.getStoredWorkerToken();
		if (stored) {
			console.log(`${MODULE_TAG} Using stored worker token`);
			return stored;
		}

		// Prompt user
		const token = prompt(
			'🔑 Worker Token Required\n\n' +
				'Enter your PingOne worker token to discover applications.\n' +
				'This will be stored securely in your browser.\n\n' +
				'Get a worker token from:\n' +
				'PingOne Console → Connections → Applications → Worker Token'
		);

		if (!token) {
			console.log(`${MODULE_TAG} User cancelled worker token prompt`);
			return null;
		}

		// Store token (async)
		await AppDiscoveryServiceV8.storeWorkerToken(token);
		console.log(`${MODULE_TAG} Worker token stored`);

		return token;
	}

	/**
	 * Get stored worker token if valid (uses global workerTokenServiceV8)
	 * @returns Worker token or null if not found or expired
	 */
	static async getStoredWorkerToken(): Promise<string | null> {
		try {
			// Use global worker token service
			const token = await workerTokenServiceV8.getToken();
			if (token) {
				console.log(`${MODULE_TAG} Retrieved stored worker token from global service`);
			}
			return token;
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to get stored worker token`, {
				error: error instanceof Error ? error.message : String(error),
			});
			return null;
		}
	}

	/**
	 * Synchronous version for backwards compatibility (browser storage only)
	 * @returns Worker token or null if not found or expired
	 */
	static getStoredWorkerTokenSync(): string | null {
		try {
			// Use global worker token service (sync version)
			const credentials = workerTokenServiceV8.loadCredentialsSync();
			if (!credentials) {
				return null;
			}

			// Try to get token from browser storage (service stores it there)
			const stored = localStorage.getItem('v8:worker_token');
			if (!stored) {
				return null;
			}

			const data = JSON.parse(stored) as { token?: string; expiresAt?: number };
			if (!data.token) {
				return null;
			}

			// Check if expired
			if (data.expiresAt && Date.now() > data.expiresAt) {
				console.log(`${MODULE_TAG} Stored worker token expired`);
				// Clear token asynchronously (can't await in sync method)
				workerTokenServiceV8.clearToken().catch((err) => {
					console.error(`${MODULE_TAG} Failed to clear expired token`, err);
				});
				return null;
			}

			console.log(`${MODULE_TAG} Retrieved stored worker token from global service (sync)`);
			return data.token;
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to get stored worker token (sync)`, {
				error: error instanceof Error ? error.message : String(error),
			});
			return null;
		}
	}

	/**
	 * Store worker token (uses global workerTokenServiceV8)
	 * @param token - Worker token to store
	 * @param expiresInSeconds - Optional expiry in seconds from now (if not provided, uses default 24 hours)
	 * @note This method requires credentials to be saved first via workerTokenServiceV8.saveCredentials()
	 */
	static async storeWorkerToken(token: string, expiresInSeconds?: number): Promise<void> {
		try {
			// Check if credentials exist first
			const credentials = await workerTokenServiceV8.loadCredentials();
			if (!credentials) {
				console.warn(
					`${MODULE_TAG} Cannot store token - credentials not found. Please save credentials first via workerTokenServiceV8.saveCredentials()`
				);
				return;
			}

			const expiresIn = expiresInSeconds
				? expiresInSeconds * 1000
				: AppDiscoveryServiceV8.WORKER_TOKEN_EXPIRY;

			const expiresAt = Date.now() + expiresIn;

			// Save token using global service
			await workerTokenServiceV8.saveToken(token, expiresAt);

			console.log(`${MODULE_TAG} Worker token stored to global service`, {
				expiresIn: `${expiresIn / 1000 / 60 / 60} hours`,
				expiresAt: new Date(expiresAt).toISOString(),
			});
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to store worker token`, {
				error: error instanceof Error ? error.message : String(error),
			});
		}
	}

	/**
	 * Synchronous version for backwards compatibility (browser storage only)
	 * @param token - Worker token to store
	 * @param expiresInSeconds - Optional expiry in seconds from now
	 * @note This is a legacy method. For new code, use storeWorkerToken() which uses the global service.
	 * @note This method requires credentials to be saved first via workerTokenServiceV8.saveCredentials()
	 */
	static storeWorkerTokenSync(token: string, expiresInSeconds?: number): void {
		try {
			// Check if credentials exist first
			const credentials = workerTokenServiceV8.loadCredentialsSync();
			if (!credentials) {
				console.warn(
					`${MODULE_TAG} Cannot store token (sync) - credentials not found. Please save credentials first via workerTokenServiceV8.saveCredentials()`
				);
				return;
			}

			const expiresIn = expiresInSeconds
				? expiresInSeconds * 1000
				: AppDiscoveryServiceV8.WORKER_TOKEN_EXPIRY;

			const expiresAt = Date.now() + expiresIn;

			// Save to browser storage directly (service will sync to IndexedDB on next access)
			const stored = localStorage.getItem('v8:worker_token');
			if (stored) {
				const data = JSON.parse(stored);
				data.token = token;
				data.expiresAt = expiresAt;
				data.savedAt = Date.now();
				localStorage.setItem('v8:worker_token', JSON.stringify(data));
			} else {
				// Create new entry
				const data = {
					...credentials,
					token,
					expiresAt,
					savedAt: Date.now(),
				};
				localStorage.setItem('v8:worker_token', JSON.stringify(data));
			}

			console.log(`${MODULE_TAG} Worker token stored to browser storage (sync)`, {
				expiresIn: `${expiresIn / 1000 / 60 / 60} hours`,
				expiresAt: new Date(expiresAt).toISOString(),
			});
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to store worker token to browser (sync)`, {
				error: error instanceof Error ? error.message : String(error),
			});
		}
	}

	/**
	 * Clear stored worker token (uses global workerTokenServiceV8)
	 * @note This clears only the token, not the credentials
	 */
	static async clearWorkerToken(): Promise<void> {
		try {
			await workerTokenServiceV8.clearToken();
			console.log(`${MODULE_TAG} Worker token cleared from global service`);
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to clear worker token`, {
				error: error instanceof Error ? error.message : String(error),
			});
		}
	}

	/**
	 * Discover all applications in environment
	 * @param environmentId - PingOne environment ID
	 * @param workerToken - Worker token for API access
	 * @returns Array of discovered applications
	 * @example
	 * const apps = await AppDiscoveryServiceV8.discoverApplications(
	 *   '12345678-1234-1234-1234-123456789012',
	 *   'worker-token-xyz'
	 * );
	 */
	static async discoverApplications(
		environmentId: string,
		workerToken: string
	): Promise<DiscoveredApplication[]> {
		try {
			// Validate worker token is actually a string (not a Promise)
			// Check if it's a Promise by checking for 'then' method (duck typing)
			if (workerToken && typeof workerToken === 'object' && 'then' in workerToken) {
				const thenable = workerToken as { then: unknown };
				if (typeof thenable.then === 'function') {
					console.error(
						`${MODULE_TAG} Error: workerToken is a Promise, not a string. Did you forget to await?`
					);
					throw new Error(
						'Worker token must be a string, not a Promise. Ensure getStoredWorkerToken() is awaited.'
					);
				}
			}

			if (typeof workerToken !== 'string' || !workerToken.trim()) {
				console.error(`${MODULE_TAG} Error: Invalid worker token`, {
					type: typeof workerToken,
					value: workerToken,
				});
				throw new Error('Invalid worker token: must be a non-empty string');
			}

			console.log(`${MODULE_TAG} Discovering applications`, {
				environmentId,
				tokenPreview: `${workerToken.substring(0, 20)}...`,
				tokenType: typeof workerToken,
			});

			// Use backend proxy to avoid CORS issues
			const searchParams = new URLSearchParams({
				environmentId: environmentId,
				region: 'na', // Default to North America region
				workerToken: workerToken.trim(),
			});

			const proxyUrl = `/api/pingone/applications?${searchParams.toString()}`;

			console.log(`${MODULE_TAG} Fetching applications via backend proxy`, { proxyUrl });

			// Fetch from backend proxy
			const response = await fetch(proxyUrl, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				console.error(`${MODULE_TAG} Failed to discover applications`, {
					status: response.status,
					statusText: response.statusText,
					error: errorData,
				});
				return [];
			}

			const data = await response.json();

			// Debug: Log full response to see what we're getting
			console.log(`${MODULE_TAG} API Response`, {
				hasEmbedded: !!data._embedded,
				hasApplications: !!data._embedded?.applications,
				dataKeys: Object.keys(data),
				embeddedKeys: data._embedded ? Object.keys(data._embedded) : [],
				fullData: data,
			});

			const applications = data._embedded?.applications || [];

			console.log(`${MODULE_TAG} Applications discovered`, {
				count: applications.length,
				apps: applications.map((app: DiscoveredApplication) => ({ id: app.id, name: app.name })),
			});

			return applications as DiscoveredApplication[];
		} catch (error) {
			console.error(`${MODULE_TAG} Error discovering applications`, {
				error: error instanceof Error ? error.message : String(error),
			});
			return [];
		}
	}

	/**
	 * Get application configuration for auto-fill
	 * @param app - Discovered application
	 * @returns Application configuration
	 * @example
	 * const config = AppDiscoveryServiceV8.getAppConfig(app);
	 */
	static getAppConfig(app: DiscoveredApplication): AppConfig {
		console.log(`${MODULE_TAG} Getting app config`, { appId: app.id, appName: app.name });

		// Determine best grant type (with null safety)
		const grantType = app.grantTypes?.includes('authorization_code')
			? 'authorization_code'
			: app.grantTypes?.[0] || 'authorization_code';

		// Determine best response type (with null safety)
		const responseType = app.responseTypes?.includes('code')
			? 'code'
			: app.responseTypes?.[0] || 'code';

		// Get first redirect URI (with null safety)
		const redirectUri = app.redirectUris?.[0] || '';

		// Determine default scopes based on app type
		const scopes =
			app.type === 'SINGLE_PAGE_APP'
				? ['openid', 'profile', 'email']
				: ['openid', 'profile', 'email'];

		const config: AppConfig = {
			clientId: app.id,
			redirectUri,
			scopes,
			grantType,
			responseType,
			tokenEndpointAuthMethod: app.tokenEndpointAuthMethod,
			usePkce: app.pkceRequired || app.pkceEnforced || false,
			accessTokenDuration: app.accessTokenDuration || 3600,
			refreshTokenDuration: app.refreshTokenDuration || 604800,
			tokenFormat: app.tokenFormat || 'OPAQUE',
		};

		console.log(`${MODULE_TAG} App config prepared`, {
			clientId: config.clientId,
			grantType: config.grantType,
			responseType: config.responseType,
			usePkce: config.usePkce,
		});

		return config;
	}

	/**
	 * Format applications for dropdown
	 * @param apps - Discovered applications
	 * @returns Formatted options
	 * @example
	 * const options = AppDiscoveryServiceV8.formatForDropdown(apps);
	 */
	static formatForDropdown(apps: DiscoveredApplication[]): Array<{
		value: string;
		label: string;
		description: string;
	}> {
		return apps
			.filter((app) => app.enabled)
			.map((app) => ({
				value: app.id,
				label: app.name,
				description: `${app.type} • ${app.grantTypes.join(', ')}`,
			}))
			.sort((a, b) => a.label.localeCompare(b.label));
	}

	/**
	 * Get application by ID
	 * @param apps - Array of applications
	 * @param appId - Application ID to find
	 * @returns Application or null
	 */
	static getApplicationById(
		apps: DiscoveredApplication[],
		appId: string
	): DiscoveredApplication | null {
		return apps.find((app) => app.id === appId) || null;
	}

	/**
	 * Check if worker token is valid
	 * @param token - Worker token to check
	 * @returns True if token appears valid
	 */
	static isValidWorkerToken(token: string): boolean {
		// Basic validation - worker tokens are typically long strings
		return Boolean(token && token.length > 20);
	}

	/**
	 * Get worker token expiry info (uses global workerTokenServiceV8)
	 * @returns Expiry information or null
	 */
	static getWorkerTokenExpiryInfo(): {
		expiresAt: number;
		expiresIn: number;
		expiresInHours: number;
		isExpired: boolean;
	} | null {
		try {
			// Read from global service storage
			const stored = localStorage.getItem('v8:worker_token');
			if (!stored) {
				return null;
			}

			const data = JSON.parse(stored) as { expiresAt?: number };
			if (!data.expiresAt) {
				return null;
			}

			const now = Date.now();
			const expiresIn = data.expiresAt - now;
			const isExpired = expiresIn <= 0;

			return {
				expiresAt: data.expiresAt,
				expiresIn,
				expiresInHours: Math.round(expiresIn / 1000 / 60 / 60),
				isExpired,
			};
		} catch {
			return null;
		}
	}

	/**
	 * Refresh worker token (prompt user for new one)
	 * @returns New worker token or null
	 */
	static async refreshWorkerToken(): Promise<string | null> {
		console.log(`${MODULE_TAG} Refreshing worker token`);

		AppDiscoveryServiceV8.clearWorkerToken();
		return AppDiscoveryServiceV8.getWorkerToken();
	}

	/**
	 * Convenience method: Discover apps with automatic worker token retrieval
	 * @param environmentId - PingOne environment ID
	 * @returns Array of discovered applications
	 * @example
	 * const apps = await AppDiscoveryServiceV8.discoverApps('12345678-1234-1234-1234-123456789012');
	 */
	static async discoverApps(environmentId: string): Promise<DiscoveredApplication[]> {
		console.log(`${MODULE_TAG} Discovering apps (convenience method)`, { environmentId });

		// Get worker token from global service
		const workerToken = await AppDiscoveryServiceV8.getStoredWorkerToken();
		if (!workerToken) {
			console.error(`${MODULE_TAG} No worker token available for discovery`);
			throw new Error('Worker token required. Please generate a worker token first.');
		}

		// Call the main discovery method
		return AppDiscoveryServiceV8.discoverApplications(environmentId, workerToken);
	}
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default AppDiscoveryServiceV8;
