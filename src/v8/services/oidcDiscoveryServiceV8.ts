/**
 * @file oidcDiscoveryServiceV8.ts
 * @module v8/services
 * @description OIDC Discovery service for V8 flows
 * @version 8.0.0
 * @since 2024-11-16
 *
 * Features:
 * - Discover OIDC metadata from issuer URL
 * - Extract endpoints and configuration
 * - Validate discovered configuration
 *
 * @example
 * const result = await OidcDiscoveryServiceV8.discover('https://auth.example.com');
 * if (result.success) {
 *   console.log('Discovered endpoints:', result.data);
 * }
 */

const MODULE_TAG = '[📡 OIDC-DISCOVERY-V8]';

export interface DiscoveryResult {
	success: boolean;
	data?: {
		issuer: string;
		authorizationEndpoint: string;
		tokenEndpoint: string;
		userInfoEndpoint?: string;
		introspectionEndpoint?: string;
		jwksUri?: string;
		scopesSupported?: string[];
		responseTypesSupported?: string[];
		grantTypesSupported?: string[];
	};
	error?: string;
}

export class OidcDiscoveryServiceV8 {
	/**
	 * Discover OIDC configuration from issuer URL
	 * @param issuerUrl - The OIDC issuer URL
	 * @returns Discovery result with endpoints
	 * @example
	 * const result = await OidcDiscoveryServiceV8.discover('https://auth.example.com');
	 */
	static async discover(issuerUrl: string): Promise<DiscoveryResult> {
		console.log(`${MODULE_TAG} Starting OIDC discovery`, { issuerUrl });

		try {
			// Normalize issuer URL
			const normalized = OidcDiscoveryServiceV8.normalizeIssuerUrl(issuerUrl);

			console.log(`${MODULE_TAG} Using backend proxy for discovery`, { issuerUrl: normalized });

			// Use backend proxy to avoid CORS issues
			const response = await fetch('/api/pingone/oidc-discovery', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					issuerUrl: normalized,
				}),
			});

			if (!response.ok) {
				const errorText = await response.text();
				let errorBody: { error?: string; message?: string };
				try {
					errorBody = JSON.parse(errorText) as { error?: string; message?: string };
				} catch {
					errorBody = { error: errorText };
				}
				throw new Error(errorBody.error || errorBody.message || `HTTP ${response.status}: ${response.statusText}`);
			}

			const data = await response.json();

			console.log(`${MODULE_TAG} Discovery successful`, { issuer: data.issuer });

			return {
				success: true,
				data: {
					issuer: data.issuer,
					authorizationEndpoint: data.authorization_endpoint,
					tokenEndpoint: data.token_endpoint,
					userInfoEndpoint: data.userinfo_endpoint,
					introspectionEndpoint: data.introspection_endpoint,
					jwksUri: data.jwks_uri,
					scopesSupported: data.scopes_supported,
					responseTypesSupported: data.response_types_supported,
					grantTypesSupported: data.grant_types_supported,
				},
			};
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown error';
			console.error(`${MODULE_TAG} Discovery failed`, { error: message });

			return {
				success: false,
				error: `Failed to discover OIDC configuration: ${message}`,
			};
		}
	}

	/**
	 * Normalize issuer URL by removing trailing slashes and .well-known path
	 * @param issuerUrl - The issuer URL to normalize
	 * @returns Normalized issuer URL
	 */
	private static normalizeIssuerUrl(issuerUrl: string): string {
		let normalized = issuerUrl.trim();

		// Remove trailing slashes
		while (normalized.endsWith('/')) {
			normalized = normalized.slice(0, -1);
		}

		// Remove .well-known/openid-configuration if present
		if (normalized.endsWith('/.well-known/openid-configuration')) {
			normalized = normalized.replace('/.well-known/openid-configuration', '');
		}

		return normalized;
	}

	/**
	 * Check if a string is a valid issuer URL
	 * @param url - URL to validate
	 * @returns True if valid issuer URL
	 */
	static isValidIssuerUrl(url: string): boolean {
		try {
			const parsed = new URL(url);
			return parsed.protocol === 'https:' || parsed.hostname === 'localhost';
		} catch {
			return false;
		}
	}

	/**
	 * Check if a string is a valid UUID (PingOne environment ID)
	 * @param value - Value to check
	 * @returns True if valid UUID
	 */
	static isValidEnvironmentId(value: string): boolean {
		const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
		return uuidRegex.test(value);
	}

	/**
	 * Attempt to discover from either issuer URL or environment ID
	 * @param input - Either an issuer URL or environment ID
	 * @returns Discovery result
	 */
	static async discoverFromInput(input: string): Promise<DiscoveryResult> {
		console.log(`${MODULE_TAG} Attempting discovery from input`, { input });

		// Check if it's an environment ID (UUID)
		if (OidcDiscoveryServiceV8.isValidEnvironmentId(input)) {
			console.log(`${MODULE_TAG} Input appears to be environment ID, constructing PingOne URL`);
			// Construct PingOne issuer URL from environment ID
			const issuerUrl = `https://auth.pingone.com/${input}/as`;
			return OidcDiscoveryServiceV8.discover(issuerUrl);
		}

		// Otherwise treat as issuer URL
		if (OidcDiscoveryServiceV8.isValidIssuerUrl(input)) {
			return OidcDiscoveryServiceV8.discover(input);
		}

		return {
			success: false,
			error: 'Invalid input - must be a valid issuer URL or PingOne environment ID',
		};
	}
}

export default OidcDiscoveryServiceV8;
