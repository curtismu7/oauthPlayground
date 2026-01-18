// src/services/dpopService.ts
/**
 * DPoP (Demonstration of Proof of Possession) Service
 * RFC 9449 - OAuth 2.0 Demonstrating Proof of Possession (DPoP)
 *
 * Provides DPoP token generation and validation for enhanced OAuth security.
 * Particularly useful for Client Credentials and other OAuth flows to prevent
 * token replay attacks and provide proof of possession.
 */

import { v4ToastManager } from '../utils/v4ToastMessages';

export interface DPoPKeyPair {
	publicKey: CryptoKey;
	privateKey: CryptoKey;
	jwk: JsonWebKey;
}

export interface DPoPProof {
	jwt: string;
	jti: string;
	iat: number;
	htm: string;
	htu: string;
}

export interface DPoPConfig {
	algorithm: 'ES256' | 'RS256';
	keySize?: number; // For RSA keys
	namedCurve?: string; // For EC keys
}

/**
 * DPoP Service for generating and managing DPoP proofs
 */
export class DPoPService {
	private static keyPair: DPoPKeyPair | null = null;
	private static config: DPoPConfig = {
		algorithm: 'ES256',
		namedCurve: 'P-256',
	};

	/**
	 * Generate a new DPoP key pair
	 */
	static async generateKeyPair(config?: Partial<DPoPConfig>): Promise<DPoPKeyPair> {
		try {
			const finalConfig = { ...DPoPService.config, ...config };

			let keyGenParams: RsaHashedKeyGenParams | EcKeyGenParams;

			if (finalConfig.algorithm === 'RS256') {
				keyGenParams = {
					name: 'RSASSA-PKCS1-v1_5',
					modulusLength: finalConfig.keySize || 2048,
					publicExponent: new Uint8Array([1, 0, 1]),
					hash: 'SHA-256',
				};
			} else {
				keyGenParams = {
					name: 'ECDSA',
					namedCurve: finalConfig.namedCurve || 'P-256',
				};
			}

			const cryptoKeyPair = await window.crypto.subtle.generateKey(
				keyGenParams,
				true, // extractable
				['sign', 'verify']
			);

			const jwk = await window.crypto.subtle.exportKey('jwk', cryptoKeyPair.publicKey);

			// Remove private key components from JWK
			delete jwk.d;
			delete jwk.dp;
			delete jwk.dq;
			delete jwk.p;
			delete jwk.q;
			delete jwk.qi;

			const keyPair: DPoPKeyPair = {
				publicKey: cryptoKeyPair.publicKey,
				privateKey: cryptoKeyPair.privateKey,
				jwk,
			};

			DPoPService.keyPair = keyPair;
			console.log('🔐 [DPoP] Generated new key pair:', {
				algorithm: finalConfig.algorithm,
				keyType: jwk.kty,
				curve: jwk.crv || 'N/A',
			});

			return keyPair;
		} catch (error) {
			console.error('❌ [DPoP] Failed to generate key pair:', error);
			throw new Error('Failed to generate DPoP key pair');
		}
	}

	/**
	 * Create a DPoP proof JWT
	 */
	static async createProof(
		httpMethod: string,
		httpUri: string,
		accessToken?: string,
		nonce?: string
	): Promise<DPoPProof> {
		try {
			if (!DPoPService.keyPair) {
				await DPoPService.generateKeyPair();
			}

			const jti = DPoPService.generateJti();
			const iat = Math.floor(Date.now() / 1000);

			// DPoP JWT Header
			const header = {
				typ: 'dpop+jwt',
				alg: DPoPService.config.algorithm,
				jwk: DPoPService.keyPair!.jwk,
			};

			// DPoP JWT Payload
			const payload: any = {
				jti,
				htm: httpMethod.toUpperCase(),
				htu: httpUri,
				iat,
			};

			// Add access token hash if provided
			if (accessToken) {
				payload.ath = await DPoPService.generateAccessTokenHash(accessToken);
			}

			// Add nonce if provided by server
			if (nonce) {
				payload.nonce = nonce;
			}

			const jwt = await DPoPService.signJWT(header, payload);

			console.log('🔐 [DPoP] Created proof:', {
				jti,
				htm: payload.htm,
				htu: payload.htu,
				hasAccessToken: !!accessToken,
				hasNonce: !!nonce,
			});

			return {
				jwt,
				jti,
				iat,
				htm: payload.htm,
				htu: payload.htu,
			};
		} catch (error) {
			console.error('❌ [DPoP] Failed to create proof:', error);
			throw new Error('Failed to create DPoP proof');
		}
	}

	/**
	 * Get the current public key JWK
	 */
	static getPublicKeyJWK(): JsonWebKey | null {
		return DPoPService.keyPair?.jwk || null;
	}

	/**
	 * Clear the current key pair (for testing or key rotation)
	 */
	static clearKeyPair(): void {
		DPoPService.keyPair = null;
		console.log('🔐 [DPoP] Key pair cleared');
	}

	/**
	 * Generate a unique JWT ID
	 */
	private static generateJti(): string {
		const array = new Uint8Array(16);
		window.crypto.getRandomValues(array);
		return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
	}

	/**
	 * Generate access token hash for 'ath' claim
	 */
	private static async generateAccessTokenHash(accessToken: string): Promise<string> {
		const encoder = new TextEncoder();
		const data = encoder.encode(accessToken);
		const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
		const hashArray = new Uint8Array(hashBuffer);

		// Base64url encode the hash
		return btoa(String.fromCharCode(...hashArray))
			.replace(/\+/g, '-')
			.replace(/\//g, '_')
			.replace(/=/g, '');
	}

	/**
	 * Sign a JWT using the private key
	 */
	private static async signJWT(header: any, payload: any): Promise<string> {
		const encoder = new TextEncoder();

		// Base64url encode header and payload
		const encodedHeader = DPoPService.base64urlEncode(JSON.stringify(header));
		const encodedPayload = DPoPService.base64urlEncode(JSON.stringify(payload));

		const signingInput = `${encodedHeader}.${encodedPayload}`;
		const signingInputBytes = encoder.encode(signingInput);

		let algorithm: AlgorithmIdentifier;
		if (DPoPService.config.algorithm === 'RS256') {
			algorithm = 'RSASSA-PKCS1-v1_5';
		} else {
			algorithm = 'ECDSA';
		}

		const signature = await window.crypto.subtle.sign(
			algorithm,
			DPoPService.keyPair!.privateKey,
			signingInputBytes
		);

		const encodedSignature = DPoPService.base64urlEncode(signature);
		return `${signingInput}.${encodedSignature}`;
	}

	/**
	 * Base64url encode data
	 */
	private static base64urlEncode(data: string | ArrayBuffer): string {
		let base64: string;

		if (typeof data === 'string') {
			base64 = btoa(data);
		} else {
			const bytes = new Uint8Array(data);
			base64 = btoa(String.fromCharCode(...bytes));
		}

		return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
	}
}

/**
 * DPoP Integration Helper for HTTP requests
 */
export class DPoPHttpHelper {
	/**
	 * Add DPoP headers to a fetch request
	 */
	static async addDPoPHeaders(
		url: string,
		method: string,
		headers: HeadersInit = {},
		accessToken?: string
	): Promise<HeadersInit> {
		try {
			const proof = await DPoPService.createProof(method, url, accessToken);

			return {
				...headers,
				DPoP: proof.jwt,
			};
		} catch (error) {
			console.error('❌ [DPoP] Failed to add DPoP headers:', error);
			v4ToastManager.showError('Failed to create DPoP proof');
			return headers;
		}
	}

	/**
	 * Make a DPoP-enabled fetch request
	 */
	static async fetch(
		url: string,
		options: RequestInit = {},
		accessToken?: string
	): Promise<Response> {
		const method = options.method || 'GET';

		const dpopHeaders = await DPoPHttpHelper.addDPoPHeaders(
			url,
			method,
			options.headers,
			accessToken
		);

		return fetch(url, {
			...options,
			headers: dpopHeaders,
		});
	}
}

/**
 * DPoP Configuration and Status
 */
export class DPoPStatus {
	/**
	 * Check if DPoP is supported by the browser
	 */
	static isSupported(): boolean {
		return !!(window.crypto?.subtle?.generateKey && window.crypto.subtle.sign);
	}

	/**
	 * Get current DPoP status
	 */
	static getStatus() {
		return {
			supported: DPoPStatus.isSupported(),
			hasKeyPair: !!DPoPService.getPublicKeyJWK(),
			algorithm: DPoPService['config'].algorithm,
			publicKey: DPoPService.getPublicKeyJWK(),
		};
	}
}

export default DPoPService;
