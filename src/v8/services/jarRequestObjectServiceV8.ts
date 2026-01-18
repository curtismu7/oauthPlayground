// src/v8/services/jarRequestObjectServiceV8.ts
/**
 * JAR (JWT-secured Authorization Request) Service V8
 * 
 * Implements RFC 9101 - JWT-secured Authorization Request (JAR)
 * Converts OAuth authorization request parameters into signed JWT request objects
 * 
 * @see https://datatracker.ietf.org/doc/html/rfc9101
 */

// Note: SignJWT and importPKCS8 are imported dynamically in methods to match createClientAssertion pattern

const MODULE_TAG = '[🔐 JAR-REQUEST-OBJECT-V8]';

/**
 * OAuth authorization request parameters
 */
export interface OAuthAuthorizationParams {
	/** Client ID - required for all flows */
	clientId: string;
	/** Response type - e.g., 'code', 'token id_token', 'code id_token' */
	responseType: string;
	/** Redirect URI - where to send the user after authorization */
	redirectUri: string;
	/** Scopes - space-separated list of scopes */
	scope: string;
	/** State parameter for CSRF protection */
	state?: string;
	/** Nonce for OIDC (required for id_token) */
	nonce?: string;
	/** PKCE code challenge */
	codeChallenge?: string;
	/** PKCE code challenge method ('S256' or 'plain') */
	codeChallengeMethod?: string;
	/** Maximum authentication age (seconds) */
	maxAge?: number;
	/** Prompt parameter (none, login, consent, select_account) */
	prompt?: string;
	/** Display mode (page, popup, touch, wap) */
	display?: string;
	/** UI locales */
	uiLocales?: string;
	/** ACR values */
	acrValues?: string;
	/** Login hint */
	loginHint?: string;
	/** Claims request */
	claims?: {
		userinfo?: Record<string, unknown>;
		id_token?: Record<string, unknown>;
	};
	/** Request URI (for PAR) */
	requestUri?: string;
	/** Any additional parameters */
	[key: string]: unknown;
}

/**
 * JAR signing configuration
 */
export interface JARSigningConfig {
	/** Signing algorithm - HS256 (client secret) or RS256 (private key) */
	algorithm: 'HS256' | 'RS256';
	/** Client secret (required for HS256) */
	clientSecret?: string;
	/** Private key in PKCS#8 format (required for RS256) */
	privateKey?: string;
	/** Key ID (optional, for RS256) */
	keyId?: string;
	/** Issuer - defaults to clientId */
	issuer?: string;
	/** Subject - defaults to clientId */
	subject?: string;
	/** Audience - authorization endpoint URL */
	audience: string;
	/** Request object expiration time (seconds, default: 300 = 5 minutes) */
	expirySeconds?: number;
}

/**
 * Request object JWT payload (RFC 9101 compliant)
 */
export interface RequestObjectPayload {
	/** Issuer - typically the client ID */
	iss: string;
	/** Audience - authorization endpoint URL */
	aud: string;
	/** Response type */
	response_type: string;
	/** Client ID (repeated in payload per spec) */
	client_id: string;
	/** Redirect URI */
	redirect_uri: string;
	/** Scope */
	scope: string;
	/** State parameter */
	state?: string;
	/** Nonce for OIDC */
	nonce?: string;
	/** PKCE code challenge */
	code_challenge?: string;
	/** PKCE code challenge method */
	code_challenge_method?: string;
	/** Maximum authentication age */
	max_age?: number;
	/** Prompt parameter */
	prompt?: string;
	/** Display mode */
	display?: string;
	/** UI locales */
	ui_locales?: string;
	/** ACR values */
	acr_values?: string;
	/** Login hint */
	login_hint?: string;
	/** Claims request */
	claims?: {
		userinfo?: Record<string, unknown>;
		id_token?: Record<string, unknown>;
	};
	/** Request URI (for PAR) */
	request_uri?: string;
	/** Issued at timestamp */
	iat: number;
	/** Expiration timestamp */
	exp: number;
	/** JWT ID - unique identifier for this request */
	jti: string;
}

/**
 * Result of request object generation
 */
export interface RequestObjectResult {
	/** Success indicator */
	success: boolean;
	/** Signed request object JWT (if successful) */
	requestObject?: string;
	/** Error message (if failed) */
	error?: string;
	/** Decoded payload for debugging (if successful) */
	payload?: RequestObjectPayload;
	/** JWT header for debugging (if successful) */
	header?: Record<string, unknown>;
}

/**
 * JAR Request Object Service V8
 * 
 * Generates RFC 9101-compliant signed request objects for JWT-secured Authorization Requests
 */
export class JARRequestObjectServiceV8 {
	/**
	 * Generate a unique JWT ID (jti)
	 */
	private generateJTI(): string {
		const timestamp = Date.now().toString(36);
		const random = Math.random().toString(36).substring(2, 15);
		return `jar-${timestamp}-${random}`;
	}

	/**
	 * Build request object payload from OAuth parameters
	 * Converts OAuth query parameters into RFC 9101-compliant JWT claims
	 * 
	 * @param params - OAuth authorization request parameters
	 * @param config - JAR signing configuration
	 * @returns Request object payload
	 */
	buildRequestObjectPayload(
		params: OAuthAuthorizationParams,
		config: JARSigningConfig
	): RequestObjectPayload {
		const now = Math.floor(Date.now() / 1000);
		const expiry = now + (config.expirySeconds || 300); // Default 5 minutes

		// Validate required parameters
		if (!params.clientId || !params.responseType || !params.redirectUri || !params.scope) {
			throw new Error(
				'Missing required parameters: clientId, responseType, redirectUri, and scope are required'
			);
		}

		// Build RFC 9101-compliant request object payload
		const payload: RequestObjectPayload = {
			// Required JWT claims
			iss: config.issuer || params.clientId, // Issuer = client ID (per RFC 9101)
			aud: config.audience, // Audience = authorization endpoint URL
			iat: now, // Issued at
			exp: expiry, // Expiration (short-lived per spec)
			jti: this.generateJTI(), // Unique JWT ID

			// Required OAuth parameters
			response_type: params.responseType,
			client_id: params.clientId,
			redirect_uri: params.redirectUri,
			scope: params.scope,

			// Optional OAuth/OIDC parameters
			...(params.state && { state: params.state }),
			...(params.nonce && { nonce: params.nonce }),
			...(params.codeChallenge && { code_challenge: params.codeChallenge }),
			...(params.codeChallengeMethod && { code_challenge_method: params.codeChallengeMethod }),
			...(params.maxAge !== undefined && { max_age: params.maxAge }),
			...(params.prompt && { prompt: params.prompt }),
			...(params.display && { display: params.display }),
			...(params.uiLocales && { ui_locales: params.uiLocales }),
			...(params.acrValues && { acr_values: params.acrValues }),
			...(params.loginHint && { login_hint: params.loginHint }),
			...(params.claims && { claims: params.claims }),
			...(params.requestUri && { request_uri: params.requestUri }),
		};

		console.log(`${MODULE_TAG} Request object payload built`, {
			iss: payload.iss,
			aud: payload.aud,
			response_type: payload.response_type,
			client_id: payload.client_id,
			exp: new Date(payload.exp * 1000).toISOString(),
			jti: payload.jti,
		});

		return payload;
	}

	/**
	 * Sign request object using HS256 (HMAC-SHA256) with client secret
	 * 
	 * @param payload - Request object payload
	 * @param clientSecret - Client secret for signing
	 * @param keyId - Optional key ID for JWT header
	 * @returns Signed request object JWT
	 */
	private async signWithHS256(
		payload: RequestObjectPayload,
		clientSecret: string,
		keyId?: string
	): Promise<string> {
		try {
			if (!clientSecret || clientSecret.trim().length === 0) {
				throw new Error('Client secret is required for HS256 signing');
			}

			// Import SignJWT dynamically (matches createClientAssertion pattern)
			const { SignJWT } = await import('jose');

			const header: Record<string, unknown> = { alg: 'HS256', typ: 'JWT' };
			if (keyId) {
				header.kid = keyId;
			}

			// Sign with client secret (HMAC-SHA256)
			// Note: jose library accepts Uint8Array directly for HS256
			// Convert payload to plain object (remove type assertion to avoid issues)
			const payloadObj: Record<string, unknown> = { ...payload };
			const secretKey = new TextEncoder().encode(clientSecret);

			const jwt = await new SignJWT(payloadObj)
				.setProtectedHeader(header)
				.sign(secretKey);

			console.log(`${MODULE_TAG} Request object signed with HS256`, {
				jti: payload.jti,
				hasKeyId: !!keyId,
			});

			return jwt;
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Unknown error during HS256 signing';
			console.error(`${MODULE_TAG} HS256 signing failed:`, errorMessage);
			throw new Error(`Failed to sign request object with HS256: ${errorMessage}`);
		}
	}

	/**
	 * Sign request object using RS256 (RSA-SHA256) with private key
	 * 
	 * @param payload - Request object payload
	 * @param privateKey - Private key in PKCS#8 format
	 * @param keyId - Optional key ID for JWT header
	 * @returns Signed request object JWT
	 */
	private async signWithRS256(
		payload: RequestObjectPayload,
		privateKey: string,
		keyId?: string
	): Promise<string> {
		try {
			if (!privateKey || privateKey.trim().length === 0) {
				throw new Error('Private key is required for RS256 signing');
			}

			const header: Record<string, unknown> = { alg: 'RS256', typ: 'JWT' };
			if (keyId) {
				header.kid = keyId;
			}

			// Import SignJWT and importPKCS8 dynamically (matches createClientAssertion pattern)
			const { SignJWT, importPKCS8 } = await import('jose');

			// Import private key from PKCS#8 format
			const key = await importPKCS8(privateKey, 'RS256');

			// Convert payload to plain object (remove type assertion to avoid issues)
			const payloadObj: Record<string, unknown> = { ...payload };

			const jwt = await new SignJWT(payloadObj)
				.setProtectedHeader(header)
				.sign(key);

			console.log(`${MODULE_TAG} Request object signed with RS256`, {
				jti: payload.jti,
				hasKeyId: !!keyId,
			});

			return jwt;
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Unknown error during RS256 signing';
			console.error(`${MODULE_TAG} RS256 signing failed:`, errorMessage);

			// Provide helpful error messages for common issues
			if (errorMessage.includes('PKCS8') || errorMessage.includes('parse')) {
				throw new Error(
					`Failed to parse private key for RS256 signing. Ensure the key is in PKCS#8 format (BEGIN PRIVATE KEY). Error: ${errorMessage}`
				);
			}

			throw new Error(`Failed to sign request object with RS256: ${errorMessage}`);
		}
	}

	/**
	 * Sign request object using the specified algorithm
	 * 
	 * @param payload - Request object payload
	 * @param config - JAR signing configuration
	 * @returns Signed request object JWT
	 */
	private async signRequestObject(
		payload: RequestObjectPayload,
		config: JARSigningConfig
	): Promise<string> {
		if (config.algorithm === 'HS256') {
			if (!config.clientSecret) {
				throw new Error('Client secret is required for HS256 signing');
			}
			return this.signWithHS256(payload, config.clientSecret, config.keyId);
		} else if (config.algorithm === 'RS256') {
			if (!config.privateKey) {
				throw new Error('Private key is required for RS256 signing');
			}
			return this.signWithRS256(payload, config.privateKey, config.keyId);
		} else {
			throw new Error(`Unsupported signing algorithm: ${config.algorithm}`);
		}
	}

	/**
	 * Generate a signed request object JWT from OAuth parameters
	 * 
	 * Main entry point for JAR request object generation.
	 * Converts OAuth parameters to RFC 9101-compliant signed JWT.
	 * 
	 * @param params - OAuth authorization request parameters
	 * @param config - JAR signing configuration
	 * @returns Request object result with signed JWT or error
	 * 
	 * @example
	 * ```typescript
	 * const result = await jarService.generateRequestObjectJWT(
	 *   {
	 *     clientId: 'client-123',
	 *     responseType: 'code',
	 *     redirectUri: 'https://app.com/callback',
	 *     scope: 'openid profile',
	 *     state: 'xyz123',
	 *     nonce: 'abc456',
	 *   },
	 *   {
	 *     algorithm: 'HS256',
	 *     clientSecret: 'secret-123',
	 *     audience: 'https://auth.pingone.com/env-id/as/authorize',
	 *   }
	 * );
	 * 
	 * if (result.success) {
	 *   // Use result.requestObject in authorization URL as 'request' parameter
	 *   const authUrl = `https://auth.pingone.com/env-id/as/authorize?client_id=client-123&request=${result.requestObject}`;
	 * }
	 * ```
	 */
	async generateRequestObjectJWT(
		params: OAuthAuthorizationParams,
		config: JARSigningConfig
	): Promise<RequestObjectResult> {
		try {
			// Validate configuration
			if (!config.audience) {
				return {
					success: false,
					error: 'Audience (authorization endpoint URL) is required',
				};
			}

			if (config.algorithm === 'HS256' && !config.clientSecret) {
				return {
					success: false,
					error: 'Client secret is required for HS256 signing',
				};
			}

			if (config.algorithm === 'RS256' && !config.privateKey) {
				return {
					success: false,
					error: 'Private key is required for RS256 signing',
				};
			}

			// Build request object payload
			const payload = this.buildRequestObjectPayload(params, config);

			// Sign the request object
			const requestObject = await this.signRequestObject(payload, config);

			// Decode header for debugging (first part of JWT)
			const parts = requestObject.split('.');
			let header: Record<string, unknown> = {};
			try {
				const headerJson = atob(parts[0].replace(/-/g, '+').replace(/_/g, '/'));
				header = JSON.parse(headerJson);
			} catch {
				// Ignore header decode errors
			}

			console.log(`${MODULE_TAG} ✅ Request object JWT generated successfully`, {
				algorithm: config.algorithm,
				jti: payload.jti,
				length: requestObject.length,
			});

			return {
				success: true,
				requestObject,
				payload,
				header,
			};
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Unknown error during request object generation';
			console.error(`${MODULE_TAG} ❌ Failed to generate request object:`, errorMessage);

			return {
				success: false,
				error: errorMessage,
			};
		}
	}
}

// Export singleton instance
export const jarRequestObjectServiceV8 = new JARRequestObjectServiceV8();

// Export default for convenience
export default jarRequestObjectServiceV8;
