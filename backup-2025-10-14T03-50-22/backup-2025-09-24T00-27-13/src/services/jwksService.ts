// JWKS (JSON Web Key Set) Service for PingOne Auth API
import { jwtGenerator } from '../utils/jwtGenerator';

export interface JWK {
	kty: string; // Key Type
	kid: string; // Key ID
	use: string; // Public Key Use
	alg: string; // Algorithm
	n?: string; // RSA Modulus
	e?: string; // RSA Exponent
	k?: string; // Symmetric Key
	x?: string; // X Coordinate
	y?: string; // Y Coordinate
	crv?: string; // Curve
	x5c?: string[]; // X.509 Certificate Chain
	x5t?: string; // X.509 Certificate SHA-1 Thumbprint
	x5t_S256?: string; // X.509 Certificate SHA-256 Thumbprint
}

export interface JWKS {
	keys: JWK[];
}

export interface JWKSResponse {
	jwks: JWKS;
	jwks_uri: string;
	issuer: string;
	lastUpdated: Date;
}

class JWKSService {
	private readonly CACHE_KEY = 'pingone_playground_jwks_cache';
	private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

	/**
	 * Fetch JWKS from PingOne endpoint
	 */
	async fetchJWKS(environmentId: string): Promise<JWKSResponse> {
		try {
			// Use backend proxy to avoid CORS issues
			const backendUrl =
				process.env.NODE_ENV === 'production'
					? 'https://oauth-playground.vercel.app'
					: 'http://localhost:3001';

			const jwksUri = `${backendUrl}/api/jwks?environment_id=${environmentId}`;

			// Check cache first
			const cached = this.getCachedJWKS(environmentId);
			if (cached) {
				logger.info('JWKSService', 'Using cached JWKS');
				return cached;
			}

			logger.info('JWKSService', `Fetching JWKS via backend proxy`);

			const response = await fetch(jwksUri, {
				method: 'GET',
				headers: {
					Accept: 'application/json',
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				throw new Error(`Failed to fetch JWKS: ${response.status} ${response.statusText}`);
			}

			const jwks: JWKS = await response.json();

			const jwksResponse: JWKSResponse = {
				jwks,
				jwks_uri: jwksUri,
				issuer: `https://auth.pingone.com/${environmentId}/as`,
				lastUpdated: new Date(),
			};

			// Cache the response
			this.cacheJWKS(environmentId, jwksResponse);

			logger.success('JWKSService', 'JWKS fetched successfully', { keyCount: jwks.keys.length });

			return jwksResponse;
		} catch (error) {
			logger.error('JWKSService', 'Failed to fetch JWKS', error);
			throw error;
		}
	}

	/**
	 * Generate a mock JWKS for testing purposes
	 */
	generateMockJWKS(): JWKS {
		const mockKeys: JWK[] = [
			{
				kty: 'RSA',
				kid: 'default',
				use: 'sig',
				alg: 'RS256',
				n: 'mock_modulus_value_for_testing_purposes_only',
				e: 'AQAB',
				x5c: ['mock_certificate_chain'],
				x5t: 'mock_thumbprint',
				x5t_S256: 'mock_thumbprint_sha256',
			},
			{
				kty: 'RSA',
				kid: 'backup',
				use: 'sig',
				alg: 'RS256',
				n: 'mock_backup_modulus_value_for_testing_purposes_only',
				e: 'AQAB',
			},
			{
				kty: 'EC',
				kid: 'ec_key',
				use: 'sig',
				alg: 'ES256',
				crv: 'P-256',
				x: 'mock_x_coordinate',
				y: 'mock_y_coordinate',
			},
		];

		return { keys: mockKeys };
	}

	/**
	 * Validate JWKS structure
	 */
	validateJWKS(jwks: JWKS): { valid: boolean; errors: string[] } {
		const errors: string[] = [];

		if (!jwks.keys || !Array.isArray(jwks.keys)) {
			errors.push('JWKS must contain a "keys" array');
			return { valid: false, errors };
		}

		if (jwks.keys.length === 0) {
			errors.push('JWKS must contain at least one key');
			return { valid: false, errors };
		}

		jwks.keys.forEach((key, index) => {
			if (!key.kty) {
				errors.push(`Key ${index}: missing "kty" (key type)`);
			}
			if (!key.kid) {
				errors.push(`Key ${index}: missing "kid" (key ID)`);
			}
			if (!key.use) {
				errors.push(`Key ${index}: missing "use" (public key use)`);
			}
			if (!key.alg) {
				errors.push(`Key ${index}: missing "alg" (algorithm)`);
			}

			// Validate key type specific fields
			if (key.kty === 'RSA') {
				if (!key.n) {
					errors.push(`RSA Key ${index}: missing "n" (modulus)`);
				}
				if (!key.e) {
					errors.push(`RSA Key ${index}: missing "e" (exponent)`);
				}
			} else if (key.kty === 'EC') {
				if (!key.crv) {
					errors.push(`EC Key ${index}: missing "crv" (curve)`);
				}
				if (!key.x) {
					errors.push(`EC Key ${index}: missing "x" (x coordinate)`);
				}
				if (!key.y) {
					errors.push(`EC Key ${index}: missing "y" (y coordinate)`);
				}
			} else if (key.kty === 'oct') {
				if (!key.k) {
					errors.push(`Symmetric Key ${index}: missing "k" (key value)`);
				}
			}
		});

		return {
			valid: errors.length === 0,
			errors,
		};
	}

	/**
	 * Find a specific key by ID
	 */
	findKeyByID(jwks: JWKS, kid: string): JWK | null {
		return jwks.keys.find((key) => key.kid === kid) || null;
	}

	/**
	 * Find keys by algorithm
	 */
	findKeysByAlgorithm(jwks: JWKS, alg: string): JWK[] {
		return jwks.keys.filter((key) => key.alg === alg);
	}

	/**
	 * Find keys by use
	 */
	findKeysByUse(jwks: JWKS, use: string): JWK[] {
		return jwks.keys.filter((key) => key.use === use);
	}

	/**
	 * Get key statistics
	 */
	getKeyStatistics(jwks: JWKS): {
		totalKeys: number;
		keyTypes: Record<string, number>;
		algorithms: Record<string, number>;
		uses: Record<string, number>;
	} {
		const keyTypes: Record<string, number> = {};
		const algorithms: Record<string, number> = {};
		const uses: Record<string, number> = {};

		jwks.keys.forEach((key) => {
			keyTypes[key.kty] = (keyTypes[key.kty] || 0) + 1;
			algorithms[key.alg] = (algorithms[key.alg] || 0) + 1;
			uses[key.use] = (uses[key.use] || 0) + 1;
		});

		return {
			totalKeys: jwks.keys.length,
			keyTypes,
			algorithms,
			uses,
		};
	}

	/**
	 * Export JWKS as JSON string
	 */
	exportJWKS(jwks: JWKS): string {
		return JSON.stringify(jwks, null, 2);
	}

	/**
	 * Import JWKS from JSON string
	 */
	importJWKS(jsonString: string): JWKS {
		try {
			const jwks = JSON.parse(jsonString);
			const validation = this.validateJWKS(jwks);

			if (!validation.valid) {
				throw new Error(`Invalid JWKS: ${validation.errors.join(', ')}`);
			}

			return jwks;
		} catch (error) {
			throw new Error(
				`Failed to import JWKS: ${error instanceof Error ? error.message : 'Invalid JSON'}`
			);
		}
	}

	/**
	 * Generate JWKS string using the JWT generator
	 */
	generateJWKSString(keys: JWK[]): string {
		return jwtGenerator.generateJWKSString(keys);
	}

	/**
	 * Get cached JWKS
	 */
	private getCachedJWKS(environmentId: string): JWKSResponse | null {
		try {
			const cacheKey = `${this.CACHE_KEY}_${environmentId}`;
			const cached = localStorage.getItem(cacheKey);

			if (!cached) return null;

			const data = JSON.parse(cached);
			const lastUpdated = new Date(data.lastUpdated);
			const now = new Date();

			// Check if cache is still valid
			if (now.getTime() - lastUpdated.getTime() > this.CACHE_DURATION) {
				localStorage.removeItem(cacheKey);
				return null;
			}

			return {
				...data,
				lastUpdated,
			};
		} catch (error) {
			logger.warn('JWKSService', 'Failed to get cached JWKS', error);
			return null;
		}
	}

	/**
	 * Cache JWKS
	 */
	private cacheJWKS(environmentId: string, jwksResponse: JWKSResponse): void {
		try {
			const cacheKey = `${this.CACHE_KEY}_${environmentId}`;
			localStorage.setItem(cacheKey, JSON.stringify(jwksResponse));
		} catch (error) {
			logger.warn('JWKSService', 'Failed to cache JWKS', error);
		}
	}

	/**
	 * Clear JWKS cache
	 */
	clearCache(environmentId?: string): void {
		try {
			if (environmentId) {
				const cacheKey = `${this.CACHE_KEY}_${environmentId}`;
				localStorage.removeItem(cacheKey);
			} else {
				// Clear all JWKS cache entries
				const keys = Object.keys(localStorage);
				keys.forEach((key) => {
					if (key.startsWith(this.CACHE_KEY)) {
						localStorage.removeItem(key);
					}
				});
			}
			logger.info('JWKSService', 'JWKS cache cleared');
		} catch (error) {
			logger.warn('JWKSService', 'Failed to clear JWKS cache', error);
		}
	}
}

export const jwksService = new JWKSService();
export default jwksService;
