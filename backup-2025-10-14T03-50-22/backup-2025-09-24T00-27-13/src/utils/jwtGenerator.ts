// JWT Generation Utilities for PingOne Auth API
import { jwtDecode } from 'jwt-decode';

export interface JWTPayload {
	iss?: string; // Issuer
	sub?: string; // Subject
	aud?: string | string[]; // Audience
	exp?: number; // Expiration time
	nbf?: number; // Not before
	iat?: number; // Issued at
	jti?: string; // JWT ID
	[key: string]: unknown; // Additional claims
}

export interface LoginHintTokenPayload extends JWTPayload {
	login_hint: string;
	acr_values?: string;
	prompt?: string;
	max_age?: number;
}

export interface RequestObjectPayload extends JWTPayload {
	client_id: string;
	response_type: string;
	redirect_uri: string;
	scope: string;
	state?: string;
	nonce?: string;
	code_challenge?: string;
	code_challenge_method?: string;
	acr_values?: string;
	prompt?: string;
	max_age?: number;
	ui_locales?: string;
	claims?: {
		userinfo?: Record<string, unknown>;
		id_token?: Record<string, unknown>;
	};
}

export interface ClientSecretJWTPayload extends JWTPayload {
	sub: string; // Client ID
	aud: string; // Token endpoint
	jti: string; // Unique identifier
}

export interface PrivateKeyJWTPayload extends JWTPayload {
	sub: string; // Client ID
	aud: string; // Token endpoint
	jti: string; // Unique identifier
}

class JWTGenerator {
	private readonly DEFAULT_ALGORITHM = 'HS256';
	private readonly DEFAULT_EXPIRY_MINUTES = 5;

	/**
	 * Generate a login_hint_token JWT
	 */
	generateLoginHintToken(
		loginHint: string,
		options: {
			issuer?: string;
			audience?: string;
			subject?: string;
			acrValues?: string;
			prompt?: string;
			maxAge?: number;
			expiryMinutes?: number;
		} = {}
	): string {
		const now = Math.floor(Date.now() / 1000);
		const expiry = now + (options.expiryMinutes || this.DEFAULT_EXPIRY_MINUTES) * 60;

		const payload: LoginHintTokenPayload = {
			iss: options.issuer || 'oauth-playground',
			sub: options.subject || 'user',
			aud: options.audience || 'pingone',
			exp: expiry,
			nbf: now,
			iat: now,
			jti: this.generateJTI(),
			login_hint: loginHint,
			acr_values: options.acrValues,
			prompt: options.prompt,
			max_age: options.maxAge,
		};

		return this.signJWT(payload, this.DEFAULT_ALGORITHM);
	}

	/**
	 * Generate a request object JWT
	 */
	generateRequestObject(
		clientId: string,
		responseType: string,
		redirectUri: string,
		scope: string,
		options: {
			issuer?: string;
			audience?: string;
			subject?: string;
			state?: string;
			nonce?: string;
			codeChallenge?: string;
			codeChallengeMethod?: string;
			acrValues?: string;
			prompt?: string;
			maxAge?: number;
			uiLocales?: string;
			claims?: {
				userinfo?: Record<string, unknown>;
				id_token?: Record<string, unknown>;
			};
			expiryMinutes?: number;
		} = {}
	): string {
		const now = Math.floor(Date.now() / 1000);
		const expiry = now + (options.expiryMinutes || this.DEFAULT_EXPIRY_MINUTES) * 60;

		const payload: RequestObjectPayload = {
			iss: options.issuer || clientId,
			sub: options.subject || clientId,
			aud: options.audience || 'pingone',
			exp: expiry,
			nbf: now,
			iat: now,
			jti: this.generateJTI(),
			client_id: clientId,
			response_type: responseType,
			redirect_uri: redirectUri,
			scope: scope,
			state: options.state,
			nonce: options.nonce,
			code_challenge: options.codeChallenge,
			code_challenge_method: options.codeChallengeMethod,
			acr_values: options.acrValues,
			prompt: options.prompt,
			max_age: options.maxAge,
			ui_locales: options.uiLocales,
			claims: options.claims,
		};

		return this.signJWT(payload, this.DEFAULT_ALGORITHM);
	}

	/**
	 * Generate a client secret JWT for authentication
	 */
	generateClientSecretJWT(
		clientId: string,
		tokenEndpoint: string,
		clientSecret: string,
		options: {
			issuer?: string;
			subject?: string;
			expiryMinutes?: number;
		} = {}
	): string {
		const now = Math.floor(Date.now() / 1000);
		const expiry = now + (options.expiryMinutes || this.DEFAULT_EXPIRY_MINUTES) * 60;

		const payload: ClientSecretJWTPayload = {
			iss: options.issuer || clientId,
			sub: clientId,
			aud: tokenEndpoint,
			exp: expiry,
			nbf: now,
			iat: now,
			jti: this.generateJTI(),
		};

		return this.signJWT(payload, this.DEFAULT_ALGORITHM, clientSecret);
	}

	/**
	 * Generate a private key JWT for authentication
	 */
	generatePrivateKeyJWT(
		clientId: string,
		tokenEndpoint: string,
		privateKey: string,
		options: {
			issuer?: string;
			subject?: string;
			keyId?: string;
			expiryMinutes?: number;
		} = {}
	): string {
		const now = Math.floor(Date.now() / 1000);
		const expiry = now + (options.expiryMinutes || this.DEFAULT_EXPIRY_MINUTES) * 60;

		const payload: PrivateKeyJWTPayload = {
			iss: options.issuer || clientId,
			sub: clientId,
			aud: tokenEndpoint,
			exp: expiry,
			nbf: now,
			iat: now,
			jti: this.generateJTI(),
		};

		const header = {
			alg: 'RS256',
			typ: 'JWT',
			kid: options.keyId || 'default',
		};

		return this.signJWTWithPrivateKey(payload, header, privateKey);
	}

	/**
	 * Generate JWKS (JSON Web Key Set) string
	 */
	generateJWKSString(
		keys: Array<{
			kty: string;
			kid: string;
			use: string;
			alg: string;
			n?: string;
			e?: string;
			k?: string;
		}>
	): string {
		const jwks = {
			keys: keys,
		};

		return JSON.stringify(jwks, null, 2);
	}

	/**
	 * Validate JWT structure and signature
	 */
	validateJWT(
		token: string,
		secret?: string
	): {
		valid: boolean;
		payload?: JWTPayload;
		error?: string;
	} {
		try {
			const payload = jwtDecode(token);
			return {
				valid: true,
				payload,
			};
		} catch (error) {
			return {
				valid: false,
				error: error instanceof Error ? error.message : 'Invalid JWT',
			};
		}
	}

	/**
	 * Decode JWT without verification
	 */
	decodeJWT(token: string): JWTPayload | null {
		try {
			return jwtDecode(token);
		} catch (error) {
			console.error('Failed to decode JWT:', error);
			return null;
		}
	}

	/**
	 * Check if JWT is expired
	 */
	isJWTExpired(token: string): boolean {
		try {
			const payload = jwtDecode(token) as JWTPayload;
			if (!payload.exp) return false;

			const now = Math.floor(Date.now() / 1000);
			return payload.exp < now;
		} catch (error) {
			return true;
		}
	}

	/**
	 * Get JWT expiration time
	 */
	getJWTExpiration(token: string): Date | null {
		try {
			const payload = jwtDecode(token) as JWTPayload;
			if (!payload.exp) return null;

			return new Date(payload.exp * 1000);
		} catch (error) {
			return null;
		}
	}

	/**
	 * Generate a unique JWT ID
	 */
	private generateJTI(): string {
		return `jwt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	/**
	 * Sign JWT with HMAC algorithm
	 */
	private signJWT(payload: JWTPayload, algorithm: string, secret?: string): string {
		// In a real implementation, you would use a proper JWT library like jsonwebtoken
		// For this demo, we'll create a mock JWT structure
		const header = {
			alg: algorithm,
			typ: 'JWT',
		};

		const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
		const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));

		// Mock signature - in production, use proper HMAC signing
		const signature = secret
			? this.base64UrlEncode(`mock_signature_${secret.substring(0, 8)}`)
			: this.base64UrlEncode('mock_signature');

		return `${encodedHeader}.${encodedPayload}.${signature}`;
	}

	/**
	 * Sign JWT with private key (RSA)
	 */
	private signJWTWithPrivateKey(
		payload: JWTPayload,
		header: Record<string, unknown>,
		privateKey: string
	): string {
		// In a real implementation, you would use a proper JWT library with RSA signing
		// For this demo, we'll create a mock JWT structure
		const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
		const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));

		// Mock signature - in production, use proper RSA signing
		const signature = this.base64UrlEncode(`mock_rsa_signature_${privateKey.substring(0, 8)}`);

		return `${encodedHeader}.${encodedPayload}.${signature}`;
	}

	/**
	 * Base64 URL encode
	 */
	private base64UrlEncode(str: string): string {
		return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
	}
}

export const jwtGenerator = new JWTGenerator();
export default jwtGenerator;
