// src/services/configComparisonService.ts
// PingOne Configuration Comparison Service for diffing form data against live applications

import { createPingOneClient } from '../utils/apiClient';

export interface ConfigDiffResult {
	hasDiffs: boolean;
	diffs: Array<{
		path: string;
		expected?: unknown;
		actual?: unknown;
		change: 'added' | 'removed' | 'mismatch';
	}>;
	normalizedRemote: Record<string, unknown>;
	normalizedDesired: Record<string, unknown>;
}

export class ConfigComparisonService {
	constructor(
		private token: string,
		private environmentId: string,
		private region: string,
		private clientId?: string,
		private clientSecret?: string,
		private flowType?: string // Add flow type to determine which fields to compare
	) {}

	async compare(clientId: string, formData: Record<string, unknown>): Promise<ConfigDiffResult> {
		try {
			const _client = createPingOneClient(this.token, this.environmentId, this.region);

			// Add timestamp to ensure fresh data is fetched every time
			const timestamp = Date.now();
			// Use proxy endpoint instead of direct API call
			const applicationsUrl = `https://localhost:3001/api/pingone/applications?environmentId=${this.environmentId}&clientId=${this.clientId}&clientSecret=${this.clientSecret}&workerToken=${encodeURIComponent(this.token)}&region=${this.region}&t=${timestamp}&_=${Math.random()}`;
			const response = await fetch(applicationsUrl);
			const responseData = await response.json();
			const applications = responseData._embedded?.applications || [];

			// Find the application with matching clientId
			const app = applications.find((app: any) => app.clientId === clientId);

			if (!app) {
				return {
					hasDiffs: true,
					diffs: [
						{
							path: 'application',
							expected: 'Existing PingOne app',
							actual: 'Not found',
							change: 'removed',
						},
					],
					normalizedRemote: {},
					normalizedDesired: this.normalize(formData),
				};
			}

			// Try to fetch scopes from resources endpoint if not found in app
			const appWithScopes = { ...app };
			if (!app.scopes && !app.allowedScopes && !app.resources) {
				try {
					// Use proxy endpoint instead of direct API call
					const resourcesUrl = `https://localhost:3001/api/pingone/applications/${app.id}/resources?environmentId=${this.environmentId}&clientId=${this.clientId}&clientSecret=${this.clientSecret}&workerToken=${encodeURIComponent(this.token)}&region=${this.region}`;
					const resourcesResponse = await fetch(resourcesUrl);
					const resourcesData = await resourcesResponse.json();

					if (resourcesData._embedded?.resources) {
						const allScopes: string[] = [];
						resourcesData._embedded.resources.forEach((resource: any) => {
							if (resource.scopes && Array.isArray(resource.scopes)) {
								allScopes.push(...resource.scopes);
							}
						});
						if (allScopes.length > 0) {
							appWithScopes.scopes = [...new Set(allScopes)];
						}
					}
				} catch (_resourcesError) {
					// Silently fail and try next method
				}

				// If still no scopes, try OIDC discovery endpoint
				if (!appWithScopes.scopes || appWithScopes.scopes.length === 0) {
					try {
						// Use proxy endpoint instead of direct API call
						const discoveryUrl = `https://localhost:3001/api/pingone/oidc-config?environmentId=${this.environmentId}&region=${this.region}`;
						const discoveryResponse = await fetch(discoveryUrl);
						const discoveryData = await discoveryResponse.json();

						if (discoveryData.scopes_supported && Array.isArray(discoveryData.scopes_supported)) {
							// Filter for PingOne-specific scopes
							const pingOneScopes = discoveryData.scopes_supported.filter(
								(scope: string) =>
									scope.startsWith('p1:') ||
									scope === 'openid' ||
									scope === 'profile' ||
									scope === 'email'
							);
							if (pingOneScopes.length > 0) {
								appWithScopes.scopes = pingOneScopes;
							}
						}
					} catch (_discoveryError) {
						// Silently fail and use default
					}
				}

				// Final fallback: use default PingOne scopes if still none found
				if (!appWithScopes.scopes || appWithScopes.scopes.length === 0) {
					appWithScopes.scopes = ['openid', 'p1:read:user', 'p1:update:user'];
				}
			}

			const normalizedRemote = this.normalize(appWithScopes);
			const normalizedDesired = this.normalize(formData);

			return {
				hasDiffs: JSON.stringify(normalizedRemote) !== JSON.stringify(normalizedDesired),
				diffs: this.diff(normalizedRemote, normalizedDesired),
				normalizedRemote,
				normalizedDesired,
			};
		} catch (error) {
			console.error('[ConfigComparisonService] Error comparing configuration:', error);
			throw new Error(
				`Failed to compare configuration: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	private normalize(source: Record<string, unknown>): Record<string, unknown> {
		const pick = (key: string) => source[key];

		// Determine if this flow uses redirects
		const usesRedirects = this.flowTypeUsesRedirects(this.flowType);
		const usesResponseTypes = this.flowTypeUsesResponseTypes(this.flowType);

		const normalized: Record<string, unknown> = {
			// Skip name and description - these are display-only and not functional
			grantTypes: this.normalizeArray(
				(pick('grantTypes') as string[] | undefined) ||
					(pick('grant_types') as string[] | undefined)
			),
			tokenEndpointAuthMethod: this.normalizeTokenEndpointAuthMethod(
				pick('tokenEndpointAuthMethod') ??
					pick('token_endpoint_auth_method') ??
					pick('clientAuthMethod') ??
					pick('client_auth_method') ??
					pick('clientAuthenticationMethod') ??
					pick('client_authentication_method') ??
					// Check nested configuration objects
					(source as any).configuration?.tokenEndpointAuthMethod ??
					(source as any).configuration?.token_endpoint_auth_method ??
					(source as any).configuration?.clientAuthMethod ??
					(source as any).configuration?.client_auth_method ??
					(source as any).settings?.tokenEndpointAuthMethod ??
					(source as any).settings?.token_endpoint_auth_method ??
					(source as any).settings?.clientAuthMethod ??
					(source as any).settings?.client_auth_method
			),
			pkceEnforcement: pick('pkceEnforcement') ?? pick('pkce_enforcement'),
		};

		// Only include redirect URIs for flows that use them
		if (usesRedirects) {
			normalized.redirectUris = this.normalizeRedirectUris(
				(pick('redirectUris') as string[] | undefined) ||
					(pick('redirect_uris') as string[] | undefined)
			);
			normalized.postLogoutRedirectUris = this.normalizeRedirectUris(
				(pick('postLogoutRedirectUris') as string[] | undefined) ||
					(pick('post_logout_redirect_uris') as string[] | undefined)
			);
		}

		// Only include response types for flows that use them
		if (usesResponseTypes) {
			normalized.responseTypes = this.normalizeArray(
				(pick('responseTypes') as string[] | undefined) ||
					(pick('response_types') as string[] | undefined)
			);
		}

		// Scopes are used by all flows - handle PingOne API structure
		const scopes = this.extractScopesFromPingOneApp(source);
		normalized.scopes = this.normalizeArray(scopes);

		return normalized;
	}

	/**
	 * Normalize token endpoint authentication method to handle case variations
	 */
	private normalizeTokenEndpointAuthMethod(method: unknown): string | undefined {
		if (!method || typeof method !== 'string') {
			return undefined;
		}

		const normalized = method.toLowerCase().trim();

		// Map PingOne API values to our expected values
		const mapping: Record<string, string> = {
			client_secret_basic: 'client_secret_basic',
			client_secret_post: 'client_secret_post',
			client_secret_jwt: 'client_secret_jwt',
			private_key_jwt: 'private_key_jwt',
			none: 'none',
			client_secret: 'client_secret_basic', // PingOne sometimes returns just 'client_secret'
			basic: 'client_secret_basic', // PingOne might return just 'basic'
			post: 'client_secret_post', // PingOne might return just 'post'
			jwt: 'client_secret_jwt', // PingOne might return just 'jwt'
			private_key: 'private_key_jwt', // PingOne might return just 'private_key'
		};

		const result = mapping[normalized] || normalized;
		return result;
	}

	/**
	 * Extract scopes from PingOne application data structure
	 */
	private extractScopesFromPingOneApp(app: Record<string, unknown>): string[] | undefined {
		// Try different possible locations for scopes in PingOne API response
		const possibleScopeFields = [
			'scopes',
			'scope',
			'allowedScopes',
			'allowed_scopes',
			'resources',
			'resourceScopes',
			'resource_scopes',
			'grantTypes', // Sometimes scopes are in grant types
			'grant_types',
		];

		for (const field of possibleScopeFields) {
			const value = app[field];

			if (value) {
				if (Array.isArray(value)) {
					return value;
				} else if (typeof value === 'string') {
					const scopes = value.split(/[\s,]+/).filter((s) => s.trim());
					return scopes;
				} else if (typeof value === 'object' && value !== null) {
					// Handle nested structure like resources with scopes
					const nestedScopes =
						(value as any).scopes ||
						(value as any).allowedScopes ||
						(value as any).scopes_supported;
					if (Array.isArray(nestedScopes)) {
						return nestedScopes;
					}
				}
			}
		}

		// Try to extract from _embedded resources if available
		if (app._embedded && typeof app._embedded === 'object') {
			const embedded = app._embedded as any;
			if (embedded.resources && Array.isArray(embedded.resources)) {
				// Extract scopes from resources
				const allScopes: string[] = [];
				embedded.resources.forEach((resource: any) => {
					if (resource.scopes && Array.isArray(resource.scopes)) {
						allScopes.push(...resource.scopes);
					}
				});
				if (allScopes.length > 0) {
					return [...new Set(allScopes)]; // Remove duplicates
				}
			}
		}

		return undefined;
	}

	/**
	 * Determines if a flow type uses redirect URIs
	 */
	private flowTypeUsesRedirects(flowType?: string): boolean {
		if (!flowType) return true; // Default to true for unknown flows

		const noRedirectFlows = [
			'client-credentials',
			'client_credentials',
			'resource-owner-password',
			'ropc',
			'jwt-bearer',
			'saml-bearer',
			'ciba', // RFC 9436: CIBA uses backchannel endpoint, not redirect URIs
			'device',
			'device-authorization',
		];

		return !noRedirectFlows.some((type) => flowType.toLowerCase().includes(type));
	}

	/**
	 * Determines if a flow type uses response types
	 */
	private flowTypeUsesResponseTypes(flowType?: string): boolean {
		if (!flowType) return true; // Default to true for unknown flows

		console.log('[CONFIG-COMPARISON] Checking if flow type uses response types:', flowType);

		const noResponseTypeFlows = [
			'client-credentials',
			'client_credentials',
			'resource-owner-password',
			'ropc',
			'jwt-bearer',
			'saml-bearer',
			'ciba', // RFC 9436: CIBA uses backchannel endpoint, not authorization endpoint (no response_type)
			'device',
			'device-authorization',
		];

		const result = !noResponseTypeFlows.some((type) => flowType.toLowerCase().includes(type));
		console.log('[CONFIG-COMPARISON] Flow type uses response types:', result);
		return result;
	}

	private normalizeArray(values?: string[]): string[] | undefined {
		if (!values || values.length === 0) return undefined;
		return Array.from(new Set(values.map((value) => value.trim().toLowerCase()))).sort();
	}

	private normalizeRedirectUris(values?: string[]): string[] | undefined {
		if (!values || values.length === 0) return undefined;
		// For redirect URIs, we should preserve case sensitivity but trim whitespace
		return Array.from(new Set(values.map((value) => value.trim()))).sort();
	}

	private diff(
		expected: Record<string, unknown>,
		actual: Record<string, unknown> = {}
	): ConfigDiffResult['diffs'] {
		const keys = new Set([...Object.keys(expected), ...Object.keys(actual)]);
		const diffs: ConfigDiffResult['diffs'] = [];

		keys.forEach((key) => {
			const e = expected[key];
			const a = actual[key];

			if (e === undefined && a === undefined) return;

			if (e !== undefined && a === undefined) {
				diffs.push({ path: key, expected: e, actual: undefined, change: 'added' });
			} else if (e === undefined && a !== undefined) {
				diffs.push({ path: key, expected: undefined, actual: a, change: 'removed' });
			} else if (!this.valuesEqual(e, a, key)) {
				diffs.push({ path: key, expected: e, actual: a, change: 'mismatch' });
			}
		});

		return diffs;
	}

	private valuesEqual(expected: unknown, actual: unknown, key: string): boolean {
		// For grantTypes and responseTypes, we already normalized to lowercase in normalizeArray
		// So they should be equal if they're the same after normalization
		if (key === 'grantTypes' || key === 'responseTypes') {
			return JSON.stringify(expected) === JSON.stringify(actual);
		}

		// For redirectUris, check if any of the expected URIs match any of the actual URIs
		if (key === 'redirectUris') {
			return this.redirectUrisMatch(expected, actual);
		}

		// For tokenEndpointAuthMethod, do case-insensitive comparison
		if (key === 'tokenEndpointAuthMethod') {
			const expectedStr = String(expected || '')
				.toLowerCase()
				.trim();
			const actualStr = String(actual || '')
				.toLowerCase()
				.trim();
			return expectedStr === actualStr;
		}

		// For other fields, use standard comparison
		return JSON.stringify(expected) === JSON.stringify(actual);
	}

	private redirectUrisMatch(expected: unknown, actual: unknown): boolean {
		const expectedUris = Array.isArray(expected) ? expected : [];
		const actualUris = Array.isArray(actual) ? actual : [];

		// If either is empty, they're not equal
		if (expectedUris.length === 0 || actualUris.length === 0) {
			return expectedUris.length === actualUris.length;
		}

		// Check if any expected URI matches any actual URI
		// Our app typically has 1 redirect URI, PingOne might have multiple
		// So we check if our app's URI is in PingOne's list
		const match = expectedUris.some((expectedUri) =>
			actualUris.some((actualUri) => {
				const expectedTrimmed = String(expectedUri).trim();
				const actualTrimmed = String(actualUri).trim();
				return expectedTrimmed === actualTrimmed;
			})
		);

		return match;
	}
}
