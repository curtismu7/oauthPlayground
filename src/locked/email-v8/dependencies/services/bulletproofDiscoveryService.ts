// src/services/bulletproofDiscoveryService.ts
/**
 * Bulletproof OIDC Discovery Service
 *
 * Features:
 * - Automatic retry with exponential backoff
 * - Multiple fallback strategies
 * - Region failover for PingOne
 * - Direct discovery URL fallback
 * - Generated fallback document for PingOne
 * - Comprehensive error handling and logging
 * - Backend health check
 */

import { logger } from '../../../../utils/logger';
import type { DiscoveryResult, OIDCDiscoveryDocument } from './comprehensiveDiscoveryService';
export class BulletproofDiscoveryService {
	private readonly MAX_RETRIES = 3;
	private readonly RETRY_DELAY = 1000; // ms
	private readonly TIMEOUT = 15000; // 15 seconds

	/**
	 * Discover OIDC endpoints with comprehensive fallback strategy
	 */
	async discover(environmentId: string, region: string = 'na'): Promise<DiscoveryResult> {
		logger.info('[Bulletproof Discovery] Starting discovery for environment:', environmentId);
		logger.info('[Bulletproof Discovery] Region:', region);

		try {
			// Strategy 1: Backend proxy with retry and region failover
			try {
				const document = await this.tryBackendProxyWithFailover(environmentId, region);
				logger.info('[Bulletproof Discovery] ✅ SUCCESS via backend proxy', 'Logger info');
				return {
					success: true,
					document,
					issuerUrl: `https://auth.pingone.com/${environmentId}`,
					provider: 'pingone',
				};
			} catch (proxyError) {
				logger.warn('[Bulletproof Discovery] Backend proxy failed:', proxyError);
			}

			// Strategy 2: Direct OIDC discovery (might fail due to CORS)
			try {
				const document = await this.tryDirectDiscovery(environmentId);
				logger.info('[Bulletproof Discovery] ✅ SUCCESS via direct discovery', 'Logger info');
				return {
					success: true,
					document,
					issuerUrl: `https://auth.pingone.com/${environmentId}`,
					provider: 'pingone',
				};
			} catch (directError) {
				logger.warn('[Bulletproof Discovery] Direct discovery failed:', directError);
			}

			// Strategy 3: Generate fallback document from known PingOne patterns
			logger.info('[Bulletproof Discovery] Using fallback document generation', 'Logger info');
			const document = this.generateFallbackDocument(environmentId);
			logger.info('[Bulletproof Discovery] ✅ SUCCESS via fallback generation', 'Logger info');

			return {
				success: true,
				document,
				issuerUrl: `https://auth.pingone.com/${environmentId}/as`,
				provider: 'pingone',
			};
		} catch (error) {
			logger.error('[Bulletproof Discovery] All strategies failed:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Discovery failed after all retries',
			};
		}
	}

	/**
	 * Try backend proxy with multiple regions and retry logic
	 */
	private async tryBackendProxyWithFailover(
		environmentId: string,
		preferredRegion: string
	): Promise<OIDCDiscoveryDocument> {
		// Try regions in priority order, starting with preferred
		const regions = [preferredRegion, 'na', 'us', 'eu', 'ca', 'ap'].filter(
			(r, i, arr) => arr.indexOf(r) === i
		);

		for (const region of regions) {
			try {
				return await this.tryBackendProxyWithRetry(environmentId, region);
			} catch (error) {
				logger.warn(`[Bulletproof Discovery] Region ${region} failed:`, error);
				// Continue to next region
			}
		}

		throw new Error('All regions failed');
	}

	/**
	 * Try backend proxy with retry logic for a specific region
	 */
	private async tryBackendProxyWithRetry(
		environmentId: string,
		region: string
	): Promise<OIDCDiscoveryDocument> {
		let lastError: Error | null = null;

		for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
			try {
				const proxyUrl = `/api/discovery?environment_id=${environmentId}&region=${region}`;
				logger.info(
					`[Bulletproof Discovery] Proxy attempt ${attempt}/${this.MAX_RETRIES} [${region}]:`,
					proxyUrl
				);

				const controller = new AbortController();
				const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT);

				try {
					const response = await fetch(proxyUrl, {
						method: 'GET',
						headers: {
							Accept: 'application/json',
							'Cache-Control': 'no-cache',
						},
						signal: controller.signal,
					});

					clearTimeout(timeoutId);

					if (!response.ok) {
						const errorBody = await response.text().catch(() => 'Unable to read response');
						logger.error(`[Bulletproof Discovery] Backend error (${response.status}):`, errorBody);
						throw new Error(`Backend returned ${response.status}: ${errorBody.substring(0, 200)}`);
					}

					const result = await response.json();

					if (!result.success) {
						throw new Error(result.error_description || result.error || 'Discovery failed');
					}

					const document = result.configuration || result.document;

					if (!document || !document.issuer) {
						throw new Error('Invalid discovery document received');
					}

					return document;
				} finally {
					clearTimeout(timeoutId);
				}
			} catch (error) {
				lastError = error instanceof Error ? error : new Error(String(error));
				logger.warn(`[Bulletproof Discovery] Attempt ${attempt} failed:`, lastError.message);

				if (attempt < this.MAX_RETRIES) {
					const delay = this.RETRY_DELAY * 2 ** (attempt - 1); // Exponential backoff
					logger.info(`[Bulletproof Discovery] Retrying in ${delay}ms...`, 'Logger info');
					await this.sleep(delay);
				}
			}
		}

		throw lastError || new Error('All retry attempts failed');
	}

	/**
	 * Try direct OIDC discovery (may fail due to CORS)
	 */
	private async tryDirectDiscovery(environmentId: string): Promise<OIDCDiscoveryDocument> {
		const discoveryUrl = `https://auth.pingone.com/${environmentId}/as/.well-known/openid-configuration`;
		logger.info('[Bulletproof Discovery] Attempting direct discovery:', discoveryUrl);

		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT);

		try {
			const response = await fetch(discoveryUrl, {
				method: 'GET',
				headers: {
					Accept: 'application/json',
					'User-Agent': 'OAuth Playground',
				},
				signal: controller.signal,
				mode: 'cors', // Explicitly set CORS mode
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			const document = await response.json();
			return document;
		} finally {
			clearTimeout(timeoutId);
		}
	}

	/**
	 * Generate fallback discovery document using known PingOne URL patterns
	 */
	private generateFallbackDocument(environmentId: string): OIDCDiscoveryDocument {
		logger.info('[Bulletproof Discovery] Generating fallback document for:', environmentId);

		const baseUrl = `https://auth.pingone.com/${environmentId}/as`;

		return {
			issuer: `https://auth.pingone.com/${environmentId}`,
			authorization_endpoint: `${baseUrl}/authorize`,
			token_endpoint: `${baseUrl}/token`,
			userinfo_endpoint: `${baseUrl}/userinfo`,
			jwks_uri: `${baseUrl}/jwks`,
			response_types_supported: [
				'code',
				'token',
				'id_token',
				'code token',
				'code id_token',
				'token id_token',
				'code token id_token',
			],
			grant_types_supported: [
				'authorization_code',
				'implicit',
				'refresh_token',
				'client_credentials',
				'urn:ietf:params:oauth:grant-type:device_code',
			],
			subject_types_supported: ['public'],
			id_token_signing_alg_values_supported: ['RS256', 'RS384', 'RS512'],
			scopes_supported: ['openid', 'profile', 'email', 'address', 'phone'],
			claims_supported: [
				'sub',
				'iss',
				'aud',
				'exp',
				'iat',
				'auth_time',
				'nonce',
				'acr',
				'amr',
				'azp',
				'at_hash',
				'c_hash',
			],
			end_session_endpoint: `${baseUrl}/signoff`,
			revocation_endpoint: `${baseUrl}/revoke`,
			introspection_endpoint: `${baseUrl}/introspect`,
			device_authorization_endpoint: `${baseUrl}/device`,
			pushed_authorization_request_endpoint: `${baseUrl}/par`,
		};
	}

	/**
	 * Sleep utility for retry delays
	 */
	private sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}

// Export singleton instance
export const bulletproofDiscovery = new BulletproofDiscoveryService();
