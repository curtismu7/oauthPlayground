// src/services/rsaKeyGenerationService.ts
// RSA Private Key Generation Service for JWT Authentication Flows

import { v4ToastManager } from '../utils/v4ToastMessages';

export interface RSAKeyPair {
	privateKeyPEM: string;
	publicKeyPEM: string;
	keyId: string;
	algorithm: string;
	keySize: number;
	generatedAt: string;
}

export interface KeyGenerationOptions {
	keySize?: 2048 | 3072 | 4096;
	keyId?: string;
	algorithm?: 'RSASSA-PKCS1-v1_5' | 'RSA-PSS';
	hash?: 'SHA-256' | 'SHA-384' | 'SHA-512';
}

export class RSAKeyGenerationService {
	private static instance: RSAKeyGenerationService;

	public static getInstance(): RSAKeyGenerationService {
		if (!RSAKeyGenerationService.instance) {
			RSAKeyGenerationService.instance = new RSAKeyGenerationService();
		}
		return RSAKeyGenerationService.instance;
	}

	/**
	 * Generate an RSA key pair for JWT authentication
	 */
	async generateKeyPair(options: KeyGenerationOptions = {}): Promise<RSAKeyPair> {
		const {
			keySize = 2048,
			keyId = this.generateKeyId(),
			algorithm = 'RSASSA-PKCS1-v1_5',
			hash = 'SHA-256',
		} = options;

		try {
			console.log('🔑 [RSAKeyGenerationService] Generating RSA key pair', {
				keySize,
				algorithm,
				hash,
				keyId,
			});

			// Generate RSA key pair using Web Crypto API
			const keyPair = await crypto.subtle.generateKey(
				{
					name: algorithm,
					modulusLength: keySize,
					publicExponent: new Uint8Array([1, 0, 1]), // 65537
					hash,
				},
				true, // extractable
				['sign', 'verify']
			);

			// Export private key in PKCS#8 format
			const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
			const privateKeyPEM = this.bufferToPEM(privateKeyBuffer, 'PRIVATE KEY');

			// Export public key in SPKI format
			const publicKeyBuffer = await crypto.subtle.exportKey('spki', keyPair.publicKey);
			const publicKeyPEM = this.bufferToPEM(publicKeyBuffer, 'PUBLIC KEY');

			const result: RSAKeyPair = {
				privateKeyPEM,
				publicKeyPEM,
				keyId,
				algorithm,
				keySize,
				generatedAt: new Date().toISOString(),
			};

			console.log('✅ [RSAKeyGenerationService] RSA key pair generated successfully', {
				keyId,
				keySize,
				algorithm,
			});

			return result;
		} catch (error) {
			console.error('❌ [RSAKeyGenerationService] Failed to generate RSA key pair:', error);
			v4ToastManager.showError('Failed to generate RSA key pair. Please try again.');
			throw new Error('Failed to generate RSA key pair. Please try again.');
		}
	}

	/**
	 * Generate a private key for JWT Bearer Token Flow
	 */
	async generatePrivateKeyForJWT(options: KeyGenerationOptions = {}): Promise<{
		privateKeyPEM: string;
		publicKeyPEM: string;
		keyId: string;
		pingOneConfig: {
			privateKeyPEM: string;
			publicKeyPEM: string;
			keyId: string;
			algorithm: string;
			keySize: number;
		};
	}> {
		const keyPair = await this.generateKeyPair(options);
		return {
			privateKeyPEM: keyPair.privateKeyPEM,
			publicKeyPEM: keyPair.publicKeyPEM,
			keyId: keyPair.keyId,
			pingOneConfig: {
				privateKeyPEM: keyPair.privateKeyPEM,
				publicKeyPEM: keyPair.publicKeyPEM,
				keyId: keyPair.keyId,
				algorithm: keyPair.algorithm,
				keySize: keyPair.keySize,
			},
		};
	}

	/**
	 * Generate a key pair for PAR (Pushed Authorization Request) flows
	 */
	async generateKeyPairForPAR(options: KeyGenerationOptions = {}): Promise<RSAKeyPair> {
		return this.generateKeyPair({
			...options,
			keySize: options.keySize || 2048,
			algorithm: 'RSASSA-PKCS1-v1_5',
			hash: 'SHA-256',
		});
	}

	/**
	 * Generate a key pair for Client Credentials with JWT authentication
	 */
	async generateKeyPairForClientCredentials(
		options: KeyGenerationOptions = {}
	): Promise<RSAKeyPair> {
		return this.generateKeyPair({
			...options,
			keySize: options.keySize || 2048,
			algorithm: 'RSASSA-PKCS1-v1_5',
			hash: 'SHA-256',
		});
	}

	/**
	 * Validate a PEM-formatted private key
	 */
	async validatePrivateKeyPEM(privateKeyPEM: string): Promise<boolean> {
		try {
			// Remove PEM headers and decode
			const pemContents = privateKeyPEM
				.replace(/-----BEGIN PRIVATE KEY-----/, '')
				.replace(/-----END PRIVATE KEY-----/, '')
				.replace(/\n/g, '')
				.replace(/\s/g, '');

			if (!pemContents) {
				return false;
			}

			// Try to decode as base64
			const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

			// Try to import the key
			await crypto.subtle.importKey(
				'pkcs8',
				binaryDer,
				{
					name: 'RSASSA-PKCS1-v1_5',
					hash: 'SHA-256',
				},
				false,
				['sign']
			);

			return true;
		} catch (error) {
			console.warn('Invalid private key PEM format:', error);
			return false;
		}
	}

	/**
	 * Get key information from a PEM-formatted private key
	 */
	async getKeyInfo(privateKeyPEM: string): Promise<{
		isValid: boolean;
		algorithm?: string;
		keySize?: number;
		error?: string;
	}> {
		try {
			const isValid = await this.validatePrivateKeyPEM(privateKeyPEM);
			if (!isValid) {
				return {
					isValid: false,
					error: 'Invalid PEM format or unsupported key type',
				};
			}

			// For now, we'll assume RSA 2048 if validation passes
			// In a real implementation, you'd parse the ASN.1 structure
			return {
				isValid: true,
				algorithm: 'RSASSA-PKCS1-v1_5',
				keySize: 2048, // This would need to be determined from the key
			};
		} catch (error) {
			return {
				isValid: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			};
		}
	}

	/**
	 * Convert ArrayBuffer to PEM format
	 */
	private bufferToPEM(buffer: ArrayBuffer, type: string): string {
		const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
		const pemKey = `-----BEGIN ${type}-----\n${base64.match(/.{1,64}/g)?.join('\n') || base64}\n-----END ${type}-----`;
		return pemKey;
	}

	/**
	 * Generate a unique key ID
	 */
	private generateKeyId(): string {
		const timestamp = Date.now().toString(36);
		const random = Math.random().toString(36).substring(2, 8);
		return `key-${timestamp}-${random}`;
	}

	/**
	 * Get supported key sizes
	 */
	getSupportedKeySizes(): number[] {
		return [2048, 3072, 4096];
	}

	/**
	 * Get supported algorithms
	 */
	getSupportedAlgorithms(): string[] {
		return ['RSASSA-PKCS1-v1_5', 'RSA-PSS'];
	}

	/**
	 * Get supported hash algorithms
	 */
	getSupportedHashes(): string[] {
		return ['SHA-256', 'SHA-384', 'SHA-512'];
	}

	/**
	 * Get PingOne configuration instructions for JWT Bearer Token Flow (Mock Implementation)
	 */
	getPingOneConfigurationInstructions(): {
		title: string;
		steps: string[];
		requirements: string[];
		notes: string[];
	} {
		return {
			title: 'JWT Bearer Token Flow - Mock Implementation',
			requirements: [
				'This is a demonstration flow that simulates JWT Bearer Token authentication',
				'Generated RSA key pair (2048-bit minimum) for demonstration',
				'Environment ID and Client ID for configuration',
			],
			steps: [
				'This flow demonstrates the JWT Bearer Token authentication process',
				'Enter your Environment ID and Client ID in Step 0',
				'Generate an RSA key pair or enter your private key in Step 1',
				'Configure optional JWT parameters (audience, subject, key ID)',
				'Click "Request JWT Bearer Token" to simulate the authentication flow',
				'View the generated mock tokens and response',
			],
			notes: [
				'🔧 This is a mock implementation for educational purposes',
				'🔑 Generate your RSA key pair using the "Generate Key" button in Step 1',
				'📝 Enter your Environment ID and Client ID in the form fields',
				'📋 The public key display is for educational purposes only',
				'🔐 Private key validation ensures proper PEM format',
				'⚡ This flow does not make actual requests to PingOne',
				'✅ Mock tokens are generated to simulate successful authentication',
				'🎯 Perfect for learning JWT Bearer Token concepts without external dependencies',
			],
		};
	}
}

// Export singleton instance
export const rsaKeyGenerationService = RSAKeyGenerationService.getInstance();

// Export convenience functions
export const generateRSAPrivateKeyPEM = (options?: KeyGenerationOptions) =>
	rsaKeyGenerationService.generatePrivateKeyForJWT(options);

export const generateRSAKeyPair = (options?: KeyGenerationOptions) =>
	rsaKeyGenerationService.generateKeyPair(options);

export const validatePrivateKeyPEM = (privateKeyPEM: string) =>
	rsaKeyGenerationService.validatePrivateKeyPEM(privateKeyPEM);
