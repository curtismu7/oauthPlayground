/**
 * @file configCheckerServiceV8.ts
 * @module v8/services
 * @description Configuration checker service for V8 flows
 * @version 8.0.0
 * @since 2024-11-16
 *
 * Fetches and validates PingOne application configuration.
 * Shows user what tokens, flows, and features are enabled.
 *
 * @example
 * // Fetch app configuration
 * const config = await ConfigCheckerServiceV8.fetchAppConfig(
 *   environmentId,
 *   clientId,
 *   workerToken
 * );
 *
 * // Compare with user config
 * const comparison = ConfigCheckerServiceV8.compareConfigs(userConfig, pingOneConfig);
 */

const MODULE_TAG = '[🔍 CONFIG-CHECKER-V8]';

// ============================================================================
// TYPES
// ============================================================================

export interface PingOneApplication {
	id: string;
	name: string;
	description?: string;
	enabled: boolean;
	type: 'NATIVE_APP' | 'WEB_APP' | 'SINGLE_PAGE_APP' | 'SERVICE';
	grantTypes: string[];
	responseTypes: string[];
	tokenEndpointAuthMethod: string;
	redirectUris: string[];
	allowedOrigins?: string[];
	postLogoutRedirectUris?: string[];
	initiateLoginUri?: string;
	logoUri?: string;
	policyUri?: string;
	termsOfServiceUri?: string;
	clientUri?: string;
	contacts?: string[];
	createdAt: string;
	updatedAt: string;
	// Advanced features
	pkceRequired?: boolean;
	pkceEnforced?: boolean;
	refreshTokenDuration?: number;
	refreshTokenRollingWindow?: boolean;
	accessTokenDuration?: number;
	idTokenSigningAlgorithm?: string;
	// Token settings
	tokenFormat?: 'OPAQUE' | 'JWT';
	accessTokenFormat?: 'OPAQUE' | 'JWT';
	idTokenFormat?: 'OPAQUE' | 'JWT';
	// CORS
	corsSettings?: {
		corsAllowedOrigins?: string[];
		corsAllowCredentials?: boolean;
	};
	// Additional settings
	requireSignedRequestObject?: boolean;
	requestObjectSigningAlgorithm?: string;
	requestObjectEncryptionAlgorithm?: string;
	requestObjectEncryptionEncAlgorithm?: string;
	// Scopes
	allowedScopes?: string[];
}

export interface ConfigComparison {
	clientId: { match: boolean; message?: string };
	redirectUris: { match: boolean; missing?: string[]; extra?: string[]; message?: string };
	grantTypes: { match: boolean; missing?: string[]; message?: string };
	responseTypes: { match: boolean; missing?: string[]; message?: string };
	tokenEndpointAuthMethod: { match: boolean; message?: string };
	pkce: {
		match: boolean;
		level: 'required' | 'enforced' | 'optional' | 'disabled';
		message?: string;
	};
	tokenFormats: { match: boolean; message?: string };
	enabled: { match: boolean; message?: string };
}

export interface FixSuggestion {
	field: string;
	issue: string;
	action: string;
	copyValue?: string;
	severity: 'error' | 'warning' | 'info';
	learnMoreUrl?: string;
}

// ============================================================================
// CONFIG CHECKER SERVICE CLASS
// ============================================================================

export class ConfigCheckerServiceV8 {
	/**
	 * Fetch application configuration from PingOne
	 * @param environmentId - PingOne environment ID
	 * @param clientId - Application client ID
	 * @param workerToken - Worker token for API access
	 * @returns Application configuration
	 * @example
	 * const config = await ConfigCheckerServiceV8.fetchAppConfig(
	 *   '12345678-1234-1234-1234-123456789012',
	 *   'my-client-id',
	 *   'worker-token-xyz'
	 * );
	 */
	static async fetchAppConfig(
		environmentId: string,
		clientId: string,
		workerToken: string
	): Promise<PingOneApplication | null> {
		try {
			console.log(`${MODULE_TAG} Fetching app config`, { environmentId, clientId });

			// Use backend proxy to avoid CORS issues
			// The backend endpoint /api/pingone/applications returns all apps, so we'll filter by clientId
			const searchParams = new URLSearchParams({
				environmentId: environmentId,
				region: 'na', // Default to North America region
				workerToken: workerToken,
			});

			const proxyUrl = `/api/pingone/applications?${searchParams.toString()}`;

			console.log(`${MODULE_TAG} Fetching app config via backend proxy`, { proxyUrl });

			// Fetch from backend proxy
			const response = await fetch(proxyUrl, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				console.error(`${MODULE_TAG} Failed to fetch app config`, {
					status: response.status,
					statusText: response.statusText,
					error: errorData,
				});
				return null;
			}

			const data = await response.json();

			// The backend returns all applications, so we need to find the one matching clientId
			// In PingOne, the application ID is the client ID
			const applications = data._embedded?.applications || [];
			const rawApp = applications.find(
				(app: { id: string; clientId?: string }) => app.id === clientId || app.clientId === clientId
			);

			if (!rawApp) {
				console.error(`${MODULE_TAG} Application not found`, {
					clientId,
					availableApps: applications.map((a: { id: string; clientId?: string }) => ({
						id: a.id,
						clientId: a.clientId || a.id,
					})),
				});
				return null;
			}

			// Explicitly map all fields including tokenEndpointAuthMethod to ensure it's captured
			const app: PingOneApplication = {
				id: rawApp.id,
				name: rawApp.name,
				description: rawApp.description,
				enabled: rawApp.enabled !== false, // Default to true if not specified
				type: rawApp.type || 'SINGLE_PAGE_APP',
				grantTypes: rawApp.grantTypes || [],
				responseTypes: rawApp.responseTypes || [],
				tokenEndpointAuthMethod: rawApp.tokenEndpointAuthMethod || rawApp.token_endpoint_auth_method || 'client_secret_post',
				redirectUris: rawApp.redirectUris || rawApp.redirect_uris || [],
				allowedOrigins: rawApp.allowedOrigins || rawApp.allowed_origins,
				postLogoutRedirectUris: rawApp.postLogoutRedirectUris || rawApp.post_logout_redirect_uris,
				initiateLoginUri: rawApp.initiateLoginUri || rawApp.initiate_login_uri,
				logoUri: rawApp.logoUri || rawApp.logo_uri,
				policyUri: rawApp.policyUri || rawApp.policy_uri,
				termsOfServiceUri: rawApp.termsOfServiceUri || rawApp.terms_of_service_uri,
				clientUri: rawApp.clientUri || rawApp.client_uri,
				contacts: rawApp.contacts || [],
				createdAt: rawApp.createdAt || rawApp.created_at || new Date().toISOString(),
				updatedAt: rawApp.updatedAt || rawApp.updated_at || new Date().toISOString(),
			};

			console.log(`${MODULE_TAG} App config fetched successfully`, {
				appId: app.id,
				appName: app.name,
				grantTypes: app.grantTypes,
				responseTypes: app.responseTypes,
				tokenEndpointAuthMethod: app.tokenEndpointAuthMethod,
			});

			return app;
		} catch (error) {
			console.error(`${MODULE_TAG} Error fetching app config`, {
				error: error instanceof Error ? error.message : String(error),
			});
			return null;
		}
	}

	/**
	 * Compare user configuration with PingOne application settings
	 * @param userConfig - User's configuration
	 * @param pingOneConfig - PingOne application configuration
	 * @returns Comparison result
	 * @example
	 * const comparison = ConfigCheckerServiceV8.compareConfigs(userConfig, pingOneConfig);
	 */
	static compareConfigs(
		userConfig: {
			clientId?: string;
			redirectUri?: string;
			grantType?: string;
			responseType?: string;
			clientAuthMethod?: string;
			usePkce?: boolean;
		},
		pingOneConfig: PingOneApplication
	): ConfigComparison {
		console.log(`${MODULE_TAG} Comparing configurations`);

		const comparison: ConfigComparison = {
			clientId: { match: userConfig.clientId === pingOneConfig.id },
			redirectUris: { match: false },
			grantTypes: { match: false },
			responseTypes: { match: false },
			tokenEndpointAuthMethod: { match: false },
			pkce: { match: false, level: 'optional' },
			tokenFormats: { match: false },
			enabled: { match: pingOneConfig.enabled },
		};

		// Check redirect URIs
		if (userConfig.redirectUri) {
			const isRegistered = pingOneConfig.redirectUris.includes(userConfig.redirectUri);
			const missingUris = isRegistered ? undefined : [userConfig.redirectUri];
			const extraUris = pingOneConfig.redirectUris.filter((uri) => uri !== userConfig.redirectUri);
			comparison.redirectUris = {
				match: isRegistered,
				...(missingUris ? { missing: missingUris } : {}),
				...(extraUris.length > 0 ? { extra: extraUris } : {}),
				message: isRegistered
					? `✓ Redirect URI registered`
					: `✗ Redirect URI not registered in PingOne`,
			};
		}

		// Check grant types
		if (userConfig.grantType) {
			const isSupported = pingOneConfig.grantTypes.includes(userConfig.grantType);
			const missingGrantTypes = isSupported ? undefined : [userConfig.grantType];
			comparison.grantTypes = {
				match: isSupported,
				...(missingGrantTypes ? { missing: missingGrantTypes } : {}),
				message: isSupported ? `✓ Grant type supported` : `✗ Grant type not enabled in PingOne`,
			};
		}

		// Check response types
		if (userConfig.responseType) {
			const isSupported = pingOneConfig.responseTypes.includes(userConfig.responseType);
			const missingResponseTypes = isSupported ? undefined : [userConfig.responseType];
			comparison.responseTypes = {
				match: isSupported,
				...(missingResponseTypes ? { missing: missingResponseTypes } : {}),
				message: isSupported
					? `✓ Response type supported`
					: `✗ Response type not enabled in PingOne`,
			};
		}

		// Check token endpoint auth method
		if (userConfig.clientAuthMethod) {
			const matches = pingOneConfig.tokenEndpointAuthMethod === userConfig.clientAuthMethod;
			comparison.tokenEndpointAuthMethod = {
				match: matches,
				message: matches
					? `✓ Auth method matches`
					: `✗ Auth method mismatch (PingOne: ${pingOneConfig.tokenEndpointAuthMethod})`,
			};
		}

		// Check PKCE
		const pkceRequired = pingOneConfig.pkceRequired || pingOneConfig.pkceEnforced;
		const pkceLevel = pingOneConfig.pkceEnforced
			? 'enforced'
			: pingOneConfig.pkceRequired
				? 'required'
				: 'optional';
		comparison.pkce = {
			match: userConfig.usePkce === pkceRequired,
			level: pkceLevel,
			message: pkceRequired ? `⚠️ PKCE ${pkceLevel} in PingOne` : `ℹ️ PKCE optional in PingOne`,
		};

		// Check token formats
		const userTokenFormat = userConfig.clientAuthMethod ? 'JWT' : 'OPAQUE';
		const pingOneTokenFormat = pingOneConfig.tokenFormat || 'OPAQUE';
		comparison.tokenFormats = {
			match: userTokenFormat === pingOneTokenFormat,
			message: `Token format: ${pingOneTokenFormat}`,
		};

		console.log(`${MODULE_TAG} Configuration comparison complete`, {
			matches: Object.values(comparison).filter((c) => c.match).length,
			total: Object.keys(comparison).length,
		});

		return comparison;
	}

	/**
	 * Generate fix suggestions based on comparison
	 * @param comparison - Configuration comparison
	 * @returns Array of fix suggestions
	 * @example
	 * const suggestions = ConfigCheckerServiceV8.generateFixSuggestions(comparison);
	 */
	static generateFixSuggestions(comparison: ConfigComparison): FixSuggestion[] {
		const suggestions: FixSuggestion[] = [];

		// Redirect URI issues
		if (!comparison.redirectUris.match && comparison.redirectUris.missing) {
			suggestions.push({
				field: 'redirectUri',
				issue: 'Redirect URI not registered in PingOne',
				action: 'Add the redirect URI to your application in PingOne console',
				copyValue: comparison.redirectUris.missing[0],
				severity: 'error',
				learnMoreUrl: '/docs/setup/redirect-uris',
			});
		}

		// Grant type issues
		if (!comparison.grantTypes.match && comparison.grantTypes.missing) {
			suggestions.push({
				field: 'grantType',
				issue: 'Grant type not enabled in PingOne',
				action: 'Enable the grant type in your application settings',
				copyValue: comparison.grantTypes.missing[0],
				severity: 'error',
				learnMoreUrl: '/docs/setup/grant-types',
			});
		}

		// Response type issues
		if (!comparison.responseTypes.match && comparison.responseTypes.missing) {
			suggestions.push({
				field: 'responseType',
				issue: 'Response type not enabled in PingOne',
				action: 'Enable the response type in your application settings',
				copyValue: comparison.responseTypes.missing[0],
				severity: 'error',
				learnMoreUrl: '/docs/setup/response-types',
			});
		}

		// Auth method issues
		if (!comparison.tokenEndpointAuthMethod.match) {
			suggestions.push({
				field: 'tokenEndpointAuthMethod',
				issue: 'Token endpoint auth method mismatch',
				action: 'Update your client authentication method to match PingOne settings',
				severity: 'warning',
				learnMoreUrl: '/docs/security/client-authentication',
			});
		}

		// PKCE issues
		if (!comparison.pkce.match && comparison.pkce.level !== 'optional') {
			suggestions.push({
				field: 'pkce',
				issue: `PKCE is ${comparison.pkce.level} in PingOne`,
				action: 'Enable PKCE in your application configuration',
				severity: 'warning',
				learnMoreUrl: '/docs/security/pkce',
			});
		}

		// Application disabled
		if (!comparison.enabled.match) {
			suggestions.push({
				field: 'enabled',
				issue: 'Application is disabled in PingOne',
				action: 'Enable the application in PingOne console',
				severity: 'error',
				learnMoreUrl: '/docs/setup/enable-application',
			});
		}

		console.log(`${MODULE_TAG} Generated ${suggestions.length} fix suggestions`);

		return suggestions;
	}

	/**
	 * Get application summary for display
	 * @param config - PingOne application configuration
	 * @returns Summary object
	 * @example
	 * const summary = ConfigCheckerServiceV8.getApplicationSummary(config);
	 */
	static getApplicationSummary(config: PingOneApplication): {
		name: string;
		type: string;
		enabled: boolean;
		grantTypes: string[];
		responseTypes: string[];
		redirectUris: string[];
		tokenEndpointAuthMethod: string;
		pkceRequired: boolean;
		tokenFormat: string;
		accessTokenDuration: number;
		refreshTokenDuration: number;
	} {
		return {
			name: config.name,
			type: config.type,
			enabled: config.enabled,
			grantTypes: config.grantTypes,
			responseTypes: config.responseTypes,
			redirectUris: config.redirectUris,
			tokenEndpointAuthMethod: config.tokenEndpointAuthMethod,
			pkceRequired: config.pkceRequired || false,
			tokenFormat: config.tokenFormat || 'OPAQUE',
			accessTokenDuration: config.accessTokenDuration || 3600,
			refreshTokenDuration: config.refreshTokenDuration || 604800,
		};
	}

	/**
	 * Format configuration for display
	 * @param config - PingOne application configuration
	 * @returns Formatted configuration string
	 * @example
	 * const formatted = ConfigCheckerServiceV8.formatConfigForDisplay(config);
	 */
	static formatConfigForDisplay(config: PingOneApplication): string {
		const lines: string[] = [
			`Application: ${config.name}`,
			`Type: ${config.type}`,
			`Status: ${config.enabled ? '✓ Enabled' : '✗ Disabled'}`,
			'',
			'Grant Types:',
			...config.grantTypes.map((gt) => `  • ${gt}`),
			'',
			'Response Types:',
			...config.responseTypes.map((rt) => `  • ${rt}`),
			'',
			'Redirect URIs:',
			...config.redirectUris.map((uri) => `  • ${uri}`),
			'',
			'Token Endpoint Auth Method:',
			`  • ${config.tokenEndpointAuthMethod}`,
			'',
			'Advanced Features:',
			`  • PKCE: ${config.pkceRequired ? 'Required' : config.pkceEnforced ? 'Enforced' : 'Optional'}`,
			`  • Token Format: ${config.tokenFormat || 'OPAQUE'}`,
			`  • Access Token Duration: ${config.accessTokenDuration || 3600}s`,
			`  • Refresh Token Duration: ${config.refreshTokenDuration || 604800}s`,
		];

		return lines.join('\n');
	}

	/**
	 * Validate configuration
	 * @param config - PingOne application configuration
	 * @returns Validation result
	 * @example
	 * const validation = ConfigCheckerServiceV8.validateConfiguration(config);
	 */
	static validateConfiguration(config: PingOneApplication): {
		valid: boolean;
		errors: string[];
		warnings: string[];
	} {
		const errors: string[] = [];
		const warnings: string[] = [];

		// Check if enabled
		if (!config.enabled) {
			errors.push('Application is disabled');
		}

		// Check grant types
		if (!config.grantTypes || config.grantTypes.length === 0) {
			errors.push('No grant types configured');
		}

		// Check response types
		if (!config.responseTypes || config.responseTypes.length === 0) {
			errors.push('No response types configured');
		}

		// Check redirect URIs
		if (!config.redirectUris || config.redirectUris.length === 0) {
			errors.push('No redirect URIs configured');
		}

		// Check PKCE
		if (!config.pkceRequired && !config.pkceEnforced) {
			warnings.push('PKCE is not required (recommended for security)');
		}

		// Check token format
		if (config.tokenFormat === 'OPAQUE') {
			warnings.push('Using opaque tokens (JWT recommended for better security)');
		}

		return {
			valid: errors.length === 0,
			errors,
			warnings,
		};
	}
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default ConfigCheckerServiceV8;
