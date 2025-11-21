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
			console.log(
				`[CONFIG-COMPARISON] Fetching fresh PingOne data at ${new Date(timestamp).toISOString()}`
			);
			// Use proxy endpoint instead of direct API call
			const applicationsUrl = `http://localhost:3001/api/pingone/applications?environmentId=${this.environmentId}&clientId=${this.clientId}&clientSecret=${this.clientSecret}&workerToken=${encodeURIComponent(this.token)}&region=${this.region}&t=${timestamp}&_=${Math.random()}`;
			const response = await fetch(applicationsUrl);
			const responseData = await response.json();
			const applications = responseData._embedded?.applications || [];
			console.log(`[CONFIG-COMPARISON] Fetched ${applications.length} applications from PingOne`);

			// Find the application with matching clientId
			const app = applications.find((app: any) => app.clientId === clientId);

			console.log('[CONFIG-COMPARISON] Looking for clientId:', clientId);
			console.log(
				'[CONFIG-COMPARISON] Available applications:',
				applications.map((app: any) => ({
					name: app.name,
					clientId: app.clientId,
					grantTypes: app.grantTypes,
				}))
			);
			console.log(
				'[CONFIG-COMPARISON] Found app:',
				app
					? {
							name: app.name,
							clientId: app.clientId,
							grantTypes: app.grantTypes,
						}
					: 'NOT FOUND'
			);

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
					console.log('[CONFIG-COMPARISON] No scopes found in app, trying resources endpoint...');
					// Use proxy endpoint instead of direct API call
					const resourcesUrl = `http://localhost:3001/api/pingone/applications/${app.id}/resources?environmentId=${this.environmentId}&clientId=${this.clientId}&clientSecret=${this.clientSecret}&workerToken=${encodeURIComponent(this.token)}&region=${this.region}`;
					const resourcesResponse = await fetch(resourcesUrl);
					const resourcesData = await resourcesResponse.json();
					console.log('[CONFIG-COMPARISON] Resources response:', resourcesData);

					if (resourcesData._embedded?.resources) {
						const allScopes: string[] = [];
						resourcesData._embedded.resources.forEach((resource: any) => {
							if (resource.scopes && Array.isArray(resource.scopes)) {
								allScopes.push(...resource.scopes);
							}
						});
						if (allScopes.length > 0) {
							appWithScopes.scopes = [...new Set(allScopes)];
							console.log(
								'[CONFIG-COMPARISON] Extracted scopes from resources endpoint:',
								appWithScopes.scopes
							);
						}
					}
				} catch (resourcesError) {
					console.log('[CONFIG-COMPARISON] Resources endpoint failed:', resourcesError);
				}

				// If still no scopes, try OIDC discovery endpoint
				if (!appWithScopes.scopes || appWithScopes.scopes.length === 0) {
					try {
						console.log('[CONFIG-COMPARISON] No scopes from resources, trying OIDC discovery...');
						// Use proxy endpoint instead of direct API call
						const discoveryUrl = `http://localhost:3001/api/pingone/oidc-config?environmentId=${this.environmentId}&region=${this.region}`;
						const discoveryResponse = await fetch(discoveryUrl);
						const discoveryData = await discoveryResponse.json();
						console.log('[CONFIG-COMPARISON] OIDC discovery response:', discoveryData);

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
								console.log(
									'[CONFIG-COMPARISON] Extracted scopes from OIDC discovery:',
									appWithScopes.scopes
								);
							}
						}
					} catch (discoveryError) {
						console.log('[CONFIG-COMPARISON] OIDC discovery failed:', discoveryError);
					}
				}

				// Final fallback: use default PingOne scopes if still none found
				if (!appWithScopes.scopes || appWithScopes.scopes.length === 0) {
					console.log('[CONFIG-COMPARISON] No scopes found anywhere, using default PingOne scopes');
					appWithScopes.scopes = ['openid', 'p1:read:user', 'p1:update:user'];
				}
			}

			// Debug logging to see what PingOne API returns
			console.log('[CONFIG-COMPARISON] PingOne app data:', {
				clientId: appWithScopes.clientId,
				grantTypes: appWithScopes.grantTypes,
				tokenEndpointAuthMethod: appWithScopes.tokenEndpointAuthMethod,
				clientAuthMethod: appWithScopes.clientAuthMethod,
				clientAuthenticationMethod: appWithScopes.clientAuthenticationMethod,
				scopes: appWithScopes.scopes,
				resources: appWithScopes.resources,
				allowedScopes: appWithScopes.allowedScopes,
				allKeys: Object.keys(appWithScopes),
				fullApp: appWithScopes,
			});

			const normalizedRemote = this.normalize(appWithScopes);
			const normalizedDesired = this.normalize(formData);

			console.log('[CONFIG-COMPARISON] Raw grantTypes from PingOne:', appWithScopes.grantTypes);
			console.log(
				'[CONFIG-COMPARISON] Normalized grantTypes from PingOne:',
				normalizedRemote.grantTypes
			);
			console.log(
				'[CONFIG-COMPARISON] Normalized grantTypes from Our App:',
				normalizedDesired.grantTypes
			);
			console.log('[CONFIG-COMPARISON] Normalized comparison:', {
				remote: normalizedRemote,
				desired: normalizedDesired,
			});

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
		console.log('[CONFIG-COMPARISON] Normalizing tokenEndpointAuthMethod:', {
			original: method,
			type: typeof method,
			isString: typeof method === 'string',
		});

		if (!method || typeof method !== 'string') {
			console.log('[CONFIG-COMPARISON] Method is not a string or is falsy, returning undefined');
			return undefined;
		}

		const normalized = method.toLowerCase().trim();
		console.log('[CONFIG-COMPARISON] Normalized method:', normalized);

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
		console.log('[CONFIG-COMPARISON] Final normalized result:', result);
		return result;
	}

	/**
	 * Extract scopes from PingOne application data structure
	 */
	private extractScopesFromPingOneApp(app: Record<string, unknown>): string[] | undefined {
		console.log('[CONFIG-COMPARISON] Extracting scopes from PingOne app:', {
			appKeys: Object.keys(app),
			hasScopes: 'scopes' in app,
			hasScope: 'scope' in app,
			hasAllowedScopes: 'allowedScopes' in app,
			hasResources: 'resources' in app,
			hasResourceScopes: 'resourceScopes' in app,
			fullApp: app,
		});

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
			console.log(`[CONFIG-COMPARISON] Checking field '${field}':`, value);

			if (value) {
				if (Array.isArray(value)) {
					console.log(`[CONFIG-COMPARISON] Found array in '${field}':`, value);
					return value;
				} else if (typeof value === 'string') {
					const scopes = value.split(/[\s,]+/).filter((s) => s.trim());
					console.log(`[CONFIG-COMPARISON] Found string in '${field}', parsed to:`, scopes);
					return scopes;
				} else if (typeof value === 'object' && value !== null) {
					// Handle nested structure like resources with scopes
					const nestedScopes =
						(value as any).scopes ||
						(value as any).allowedScopes ||
						(value as any).scopes_supported;
					if (Array.isArray(nestedScopes)) {
						console.log(`[CONFIG-COMPARISON] Found nested scopes in '${field}':`, nestedScopes);
						return nestedScopes;
					}
				}
			}
		}

		// Try to extract from _embedded resources if available
		if (app._embedded && typeof app._embedded === 'object') {
			const embedded = app._embedded as any;
			if (embedded.resources && Array.isArray(embedded.resources)) {
				console.log('[CONFIG-COMPARISON] Found _embedded.resources:', embedded.resources);
				// Extract scopes from resources
				const allScopes: string[] = [];
				embedded.resources.forEach((resource: any) => {
					if (resource.scopes && Array.isArray(resource.scopes)) {
						allScopes.push(...resource.scopes);
					}
				});
				if (allScopes.length > 0) {
					console.log('[CONFIG-COMPARISON] Extracted scopes from _embedded.resources:', allScopes);
					return [...new Set(allScopes)]; // Remove duplicates
				}
			}
		}

		console.log('[CONFIG-COMPARISON] No scopes found in any field');
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

		console.log('[CONFIG-COMPARISON] Redirect URI comparison:', {
			expectedUris,
			actualUris,
			expectedCount: expectedUris.length,
			actualCount: actualUris.length,
		});

		// If either is empty, they're not equal
		if (expectedUris.length === 0 || actualUris.length === 0) {
			const result = expectedUris.length === actualUris.length;
			console.log('[CONFIG-COMPARISON] Empty array comparison result:', result);
			return result;
		}

		// Check if any expected URI matches any actual URI
		// Our app typically has 1 redirect URI, PingOne might have multiple
		// So we check if our app's URI is in PingOne's list
		const match = expectedUris.some((expectedUri) =>
			actualUris.some((actualUri) => {
				const expectedTrimmed = String(expectedUri).trim();
				const actualTrimmed = String(actualUri).trim();
				const isMatch = expectedTrimmed === actualTrimmed;
				console.log('[CONFIG-COMPARISON] URI comparison:', {
					expected: expectedTrimmed,
					actual: actualTrimmed,
					isMatch,
				});
				return isMatch;
			})
		);

		console.log('[CONFIG-COMPARISON] Redirect URI match result:', match);
		return match;
	}
}
