/**
 * @file idTokenValidationServiceV8.ts
 * @module v8/services
 * @description Comprehensive ID token validation per OIDC Core 1.0 Section 3.1.3.7
 * @version 8.0.0
 * @since 2025-01-27
 *
 * Implements full ID token validation including:
 * - JWKS-based signature verification
 * - Claim validation (iss, aud, exp, iat, nonce, azp)
 * - Educational value: Teaches cryptographic verification
 */

import { decodeJwt, type JWTPayload, jwtVerify, type JWK } from 'jose';
import { JWKSCacheServiceV8 } from './jwksCacheServiceV8';

const MODULE_TAG = '[✅ ID-TOKEN-VALIDATION-V8]';

export interface IDTokenValidationResult {
	valid: boolean;
	claims?: JWTPayload;
	errors: string[];
	warnings: string[];
	validationDetails: {
		signatureVerified: boolean;
		issuerValid: boolean;
		audienceValid: boolean;
		expirationValid: boolean;
		issuedAtValid: boolean;
		nonceValid?: boolean;
		authorizedPartyValid?: boolean;
	};
}

export interface IDTokenValidationOptions {
	idToken: string;
	clientId: string;
	issuer: string;
	nonce?: string;
	jwksUri?: string;
}

/**
 * ID Token Validation Service
 * Implements OIDC Core 1.0 Section 3.1.3.7 validation requirements
 */
export class IDTokenValidationServiceV8 {
	/**
	 * Validate ID token comprehensively
	 * @param options - Validation options
	 * @returns Validation result with detailed information
	 */
	static async validate(options: IDTokenValidationOptions): Promise<IDTokenValidationResult> {
		const { idToken, clientId, issuer, nonce, jwksUri } = options;
		const errors: string[] = [];
		const warnings: string[] = [];
		const validationDetails: IDTokenValidationResult['validationDetails'] = {
			signatureVerified: false,
			issuerValid: false,
			audienceValid: false,
			expirationValid: false,
			issuedAtValid: false,
		};

		console.log(`${MODULE_TAG} 🔍 Starting ID token validation with:`, {
			hasIdToken: !!idToken,
			idTokenLength: idToken?.length,
			clientId,
			issuer,
			hasNonce: !!nonce,
		});

		try {
			// Step 1: Decode JWT to get header and payload
			const decoded = decodeJwt(idToken);
			console.log(`${MODULE_TAG} Decoded ID token`, {
				iss: decoded.iss,
				aud: decoded.aud,
				exp: decoded.exp,
				iat: decoded.iat,
				kid: (decoded as JWTPayload & { header?: { kid?: string } }).header?.kid,
			});

			// Step 2: Get JWKS URI (from options or discovery)
			let actualJwksUri = jwksUri;
			if (!actualJwksUri) {
				// Try to get from issuer
				actualJwksUri = `${issuer}/.well-known/jwks.json`;
			}

			// Step 3: Get signing key from JWKS (with caching)
			const header = JSON.parse(atob(idToken.split('.')[0]));
			const kid = header.kid;

			if (!kid) {
				errors.push('ID token header missing "kid" (Key ID) claim');
				return {
					valid: false,
					errors,
					warnings,
					validationDetails,
				};
			}

			// Try cache first
			let signingKey: Record<string, unknown> | null = null;
			try {
				signingKey = await JWKSCacheServiceV8.getCachedJWKByKid(actualJwksUri, kid);
			} catch (error) {
				console.warn(`${MODULE_TAG} Cache lookup failed, fetching JWKS`, { error });
			}

			// If not in cache, fetch JWKS
			if (!signingKey) {
				try {
					// Track API call for documentation
					const { apiCallTrackerService } = await import('@/services/apiCallTrackerService');
					const startTime = Date.now();
					const callId = apiCallTrackerService.trackApiCall({
						method: 'GET',
						url: actualJwksUri,
						actualPingOneUrl: actualJwksUri,
						headers: { Accept: 'application/json' },
						step: 'jwks-fetch',
						flowType: 'oidc-metadata',
						isProxy: false,
					});

					const response = await fetch(actualJwksUri);
					if (!response.ok) {
						// Update API call tracking with error
						apiCallTrackerService.updateApiCallResponse(
							callId,
							{
								status: response.status,
								statusText: response.statusText,
								data: { error: `Failed to fetch JWKS: ${response.status} ${response.statusText}` },
							},
							Date.now() - startTime
						);
						throw new Error(`Failed to fetch JWKS: ${response.status} ${response.statusText}`);
					}
					const jwks = await response.json();
					const keys = jwks.keys as Array<Record<string, unknown>>;

					// Update API call tracking with success
					apiCallTrackerService.updateApiCallResponse(
						callId,
						{
							status: response.status,
							statusText: response.statusText,
							data: {
								note: 'JWKS retrieved successfully for ID token signature verification',
								keyCount: keys.length,
								keys: keys.map((k) => ({ kid: k.kid, kty: k.kty, use: k.use, alg: k.alg })),
							},
						},
						Date.now() - startTime
					);

					// Cache the JWKS
					await JWKSCacheServiceV8.cacheJWKS(actualJwksUri, issuer, keys);

					// Find the key
					signingKey = keys.find((k) => k.kid === kid) || null;

					if (!signingKey) {
						errors.push(`Signing key with kid "${kid}" not found in JWKS`);
						return {
							valid: false,
							errors,
							warnings,
							validationDetails,
						};
					}
				} catch (error) {
					errors.push(
						`Failed to fetch JWKS: ${error instanceof Error ? error.message : 'Unknown error'}`
					);
					return {
						valid: false,
						errors,
						warnings,
						validationDetails,
					};
				}
			}

			// Step 4: Verify signature
			try {
				const { importJWK } = await import('jose');
				const publicKey = await importJWK(signingKey as JWK);
				await jwtVerify(idToken, publicKey);
				validationDetails.signatureVerified = true;
				console.log(`${MODULE_TAG} ✅ Signature verified`);
			} catch (error) {
				errors.push(
					`Signature verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
				);
				return {
					valid: false,
					errors,
					warnings,
					validationDetails,
				};
			}

			// Step 5: Validate claims
			// 5.1: Issuer (iss)
			console.log(`${MODULE_TAG} 🔍 Validating issuer:`, {
				expected: issuer,
				actual: decoded.iss,
				match: decoded.iss === issuer,
			});
			if (decoded.iss !== issuer) {
				errors.push(
					`Issuer mismatch: expected "${issuer}", got "${decoded.iss}". The ID token was not issued by the expected authorization server.`
				);
			} else {
				validationDetails.issuerValid = true;
			}

			// 5.2: Audience (aud)
			const audience = Array.isArray(decoded.aud) ? decoded.aud : [decoded.aud];
			console.log(`${MODULE_TAG} 🔍 Validating audience:`, {
				expected: clientId,
				actual: audience,
				isArray: Array.isArray(decoded.aud),
				includes: audience.includes(clientId),
			});
			if (!audience.includes(clientId)) {
				errors.push(
					`Audience mismatch: client ID "${clientId}" not in audience "${audience.join(', ')}". The ID token was not issued for this client.`
				);
			} else {
				validationDetails.audienceValid = true;
			}

			// 5.3: Expiration (exp)
			const now = Math.floor(Date.now() / 1000);
			console.log(`${MODULE_TAG} 🔍 Validating expiration:`, {
				exp: decoded.exp,
				now,
				expDate: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : 'missing',
				isExpired: decoded.exp ? decoded.exp < now : 'missing',
			});
			if (decoded.exp && decoded.exp < now) {
				errors.push(
					`Token expired: expiration time ${new Date(decoded.exp * 1000).toISOString()} is in the past. Current time: ${new Date().toISOString()}`
				);
			} else if (decoded.exp) {
				validationDetails.expirationValid = true;
			} else {
				errors.push('Token missing "exp" (expiration) claim');
			}

			// 5.4: Issued At (iat)
			if (decoded.iat) {
				if (decoded.iat > now + 60) {
					// Allow 60 second clock skew
					warnings.push(
						`Token issued in the future: iat ${new Date(decoded.iat * 1000).toISOString()} is more than 60 seconds ahead of current time. This may indicate clock skew.`
					);
				} else {
					validationDetails.issuedAtValid = true;
				}
			} else {
				warnings.push('Token missing "iat" (issued at) claim');
			}

			// 5.5: Nonce (if provided)
			if (nonce) {
				console.log(`${MODULE_TAG} 🔍 Validating nonce:`, {
					expected: nonce,
					actual: decoded.nonce,
					match: decoded.nonce === nonce,
				});
				if (decoded.nonce !== nonce) {
					errors.push(
						`Nonce mismatch: expected "${nonce}", got "${decoded.nonce}". This may indicate a replay attack.`
					);
				} else {
					validationDetails.nonceValid = true;
				}
			} else {
				console.log(`${MODULE_TAG} 🔍 No nonce provided for validation`);
			}

			// 5.6: Authorized Party (azp) - if multiple audiences
			if (Array.isArray(decoded.aud) && decoded.aud.length > 1) {
				if (decoded.azp) {
					if (decoded.azp === clientId) {
						validationDetails.authorizedPartyValid = true;
					} else {
						warnings.push(
							`Authorized party "${decoded.azp}" does not match client ID "${clientId}". This may be expected if the token was issued for multiple clients.`
						);
					}
				} else {
					warnings.push('Token has multiple audiences but missing "azp" (authorized party) claim');
				}
			}

			const valid = errors.length === 0;

			console.log(`${MODULE_TAG} 📊 Validation summary:`, {
				valid,
				errorCount: errors.length,
				warningCount: warnings.length,
				errors,
				warnings,
				validationDetails,
			});

			if (valid) {
				console.log(`${MODULE_TAG} ✅ ID token validation passed`, {
					issuer: decoded.iss,
					audience: decoded.aud,
					exp: decoded.exp,
				});
			} else {
				console.error(`${MODULE_TAG} ❌ ID token validation failed`, { errors });
			}

			return {
				valid,
				claims: decoded,
				errors,
				warnings,
				validationDetails,
			};
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown error';
			console.error(`${MODULE_TAG} ❌ Validation error`, { error: message });
			errors.push(`Validation error: ${message}`);
			return {
				valid: false,
				errors,
				warnings,
				validationDetails,
			};
		}
	}

	/**
	 * Get validation summary for UI display
	 */
	static getValidationSummary(result: IDTokenValidationResult): {
		status: 'valid' | 'invalid' | 'warning';
		message: string;
		details: string[];
	} {
		if (result.valid) {
			return {
				status: 'valid',
				message: '✅ ID Token is valid',
				details: [
					'Signature verified',
					'Issuer matches',
					'Audience matches',
					'Token not expired',
					...(result.validationDetails.nonceValid ? ['Nonce matches'] : []),
				],
			};
		}

		if (result.errors.length > 0) {
			return {
				status: 'invalid',
				message: `❌ ID Token validation failed: ${result.errors[0]}`,
				details: result.errors,
			};
		}

		return {
			status: 'warning',
			message: '⚠️ ID Token has warnings',
			details: result.warnings,
		};
	}
}
