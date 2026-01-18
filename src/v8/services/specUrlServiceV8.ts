// src/v8/services/specUrlServiceV8.ts
/**
 * @file specUrlServiceV8.ts
 * @module v8/services
 * @description Service for OAuth 2.0 Authorization Framework (RFC 6749), OAuth 2.1 Authorization Framework (draft), and OpenID Connect Core 1.0 specification URLs
 * @version 8.0.0
 * @since 2024-11-16
 *
 * Provides canonical URLs to official OAuth and OIDC specifications
 */

import type { FlowType, SpecVersion } from './specVersionServiceV8';

const MODULE_TAG = '[📚 SPEC-URL-V8]';

/**
 * Official specification URLs
 */
const SPEC_URLS = {
	// OAuth 2.0 Core Specification (RFC 6749)
	OAUTH2_RFC6749: 'https://datatracker.ietf.org/doc/html/rfc6749',

	// OAuth 2.0 Security Best Current Practice (RFC 8252)
	OAUTH2_BCP_RFC8252: 'https://datatracker.ietf.org/doc/html/rfc8252',

	// OAuth 2.1 (draft - consolidated best practices)
	OAUTH2_1_DRAFT: 'https://www.ietf.org/archive/id/draft-ietf-oauth-v2-1-09.html',

	// OpenID Connect Core 1.0
	OIDC_CORE: 'https://openid.net/specs/openid-connect-core-1_0.html',

	// OpenID Connect Discovery 1.0
	OIDC_DISCOVERY: 'https://openid.net/specs/openid-connect-discovery-1_0.html',

	// PKCE (RFC 7636)
	PKCE_RFC7636: 'https://datatracker.ietf.org/doc/html/rfc7636',

	// Device Authorization Grant (RFC 8628)
	DEVICE_AUTH_RFC8628: 'https://datatracker.ietf.org/doc/html/rfc8628',

	// OAuth 2.0 Token Introspection (RFC 7662)
	TOKEN_INTROSPECTION_RFC7662: 'https://datatracker.ietf.org/doc/html/rfc7662',

	// OAuth 2.0 Token Revocation (RFC 7009)
	TOKEN_REVOCATION_RFC7009: 'https://datatracker.ietf.org/doc/html/rfc7009',

	// OAuth 2.0 Authorization Server Metadata (RFC 8414)
	AUTHZ_METADATA_RFC8414: 'https://datatracker.ietf.org/doc/html/rfc8414',
} as const;

export interface FlowSpecInfo {
	primarySpec: string;
	specLabel: string;
	relatedSpecs?: Array<{
		label: string;
		url: string;
	}>;
}

export class SpecUrlServiceV8 {
	/**
	 * Get specification URLs for a spec version
	 * @param specVersion - Spec version (oauth2.0, oauth2.1, oidc)
	 * @returns Object with primary spec URL and related spec URLs
	 */
	static getSpecUrls(specVersion: SpecVersion): {
		primary: string;
		primaryLabel: string;
		related: Array<{ label: string; url: string }>;
	} {
		console.log(`${MODULE_TAG} Getting spec URLs for`, { specVersion });

		switch (specVersion) {
			case 'oauth2.0':
				return {
					primary: SPEC_URLS.OAUTH2_RFC6749,
					primaryLabel: 'OAuth 2.0 Authorization Framework (RFC 6749)',
					related: [
						{
							label: 'RFC 8252 - OAuth 2.0 Security Best Current Practice',
							url: SPEC_URLS.OAUTH2_BCP_RFC8252,
						},
					],
				};

			case 'oauth2.1':
				return {
					primary: SPEC_URLS.OAUTH2_1_DRAFT,
					primaryLabel: 'OAuth 2.1 Authorization Framework (draft)',
					related: [
						{ label: 'RFC 6749 - OAuth 2.0 Authorization Framework', url: SPEC_URLS.OAUTH2_RFC6749 },
						{
							label: 'RFC 8252 - OAuth 2.0 Security Best Current Practice',
							url: SPEC_URLS.OAUTH2_BCP_RFC8252,
						},
						{ label: 'RFC 7636 - Proof Key for Code Exchange (PKCE)', url: SPEC_URLS.PKCE_RFC7636 },
					],
				};

			case 'oidc':
				return {
					primary: SPEC_URLS.OIDC_CORE,
					primaryLabel: 'OpenID Connect Core 1.0',
					related: [
						{ label: 'OpenID Connect Discovery 1.0', url: SPEC_URLS.OIDC_DISCOVERY },
						{ label: 'RFC 6749 - OAuth 2.0 Core', url: SPEC_URLS.OAUTH2_RFC6749 },
					],
				};

			default:
				return {
					primary: SPEC_URLS.OAUTH2_RFC6749,
					primaryLabel: 'RFC 6749 - OAuth 2.0',
					related: [],
				};
		}
	}

	/**
	 * Get specification info for a specific flow type
	 * @param flowType - Flow type
	 * @returns Flow specification info with primary and related specs
	 */
	static getFlowSpecInfo(flowType: FlowType): FlowSpecInfo {
		console.log(`${MODULE_TAG} Getting flow spec info for`, { flowType });
		
		// #region agent log
		import('@/v8/utils/analyticsV8').then(({ analytics }) => {
			analytics.log({
				location: 'specUrlServiceV8.ts:124',
				message: 'Getting flow-specific specification info',
				data: { flowType },
				sessionId: 'debug-session',
				runId: 'run2',
				hypothesisId: 'C',
			});
		}).catch(() => {});
		// #endregion

		switch (flowType) {
		case 'oauth-authz':
			return {
				primarySpec: SPEC_URLS.OAUTH2_RFC6749,
				specLabel: 'OAuth 2.0 Authorization Code Flow',
				relatedSpecs: [
					{
						label: 'Section 4.1 - Authorization Code Grant',
						url: `${SPEC_URLS.OAUTH2_RFC6749}#section-4.1`,
					},
					{ label: 'RFC 7636 - PKCE (Recommended)', url: SPEC_URLS.PKCE_RFC7636 },
				],
			};

		case 'implicit':
			return {
				primarySpec: SPEC_URLS.OAUTH2_RFC6749,
				specLabel: 'OAuth 2.0 Implicit Flow',
				relatedSpecs: [
					{
						label: 'Section 4.2 - Implicit Grant',
						url: `${SPEC_URLS.OAUTH2_RFC6749}#section-4.2`,
					},
					{ label: '⚠️ Deprecated in OAuth 2.1', url: SPEC_URLS.OAUTH2_1_DRAFT },
				],
			};

		case 'client-credentials':
			return {
				primarySpec: SPEC_URLS.OAUTH2_RFC6749,
				specLabel: 'OAuth 2.0 Client Credentials Flow',
				relatedSpecs: [
					{
						label: 'Section 4.4 - Client Credentials Grant',
						url: `${SPEC_URLS.OAUTH2_RFC6749}#section-4.4`,
					},
				],
			};

		case 'ropc':
			return {
				primarySpec: SPEC_URLS.OAUTH2_RFC6749,
				specLabel: 'OAuth 2.0 Resource Owner Password Credentials',
				relatedSpecs: [
					{
						label: 'Section 4.3 - Resource Owner Password Credentials Grant',
						url: `${SPEC_URLS.OAUTH2_RFC6749}#section-4.3`,
					},
					{ label: '⚠️ Deprecated in OAuth 2.1', url: SPEC_URLS.OAUTH2_1_DRAFT },
				],
			};

		case 'device-code':
			return {
				primarySpec: SPEC_URLS.DEVICE_AUTH_RFC8628,
				specLabel: 'OAuth 2.0 Device Authorization Grant',
				relatedSpecs: [
					{ label: 'Section 3.1 - Device Authorization Request', url: `${SPEC_URLS.DEVICE_AUTH_RFC8628}#section-3.1` },
					{ label: 'Section 3.2 - Device Authorization Response', url: `${SPEC_URLS.DEVICE_AUTH_RFC8628}#section-3.2` },
					{ label: 'Section 3.4 - Token Request', url: `${SPEC_URLS.DEVICE_AUTH_RFC8628}#section-3.4` },
					{ label: 'RFC 8628 - Device Authorization Grant', url: SPEC_URLS.DEVICE_AUTH_RFC8628 },
				],
			};

		case 'hybrid':
			return {
				primarySpec: SPEC_URLS.OIDC_CORE,
				specLabel: 'OpenID Connect Hybrid Flow',
				relatedSpecs: [
					{ label: 'Section 3.3 - Hybrid Flow Authentication', url: `${SPEC_URLS.OIDC_CORE}#HybridFlowAuth` },
					{ label: 'Section 3.3.1 - Hybrid Flow Steps', url: `${SPEC_URLS.OIDC_CORE}#HybridFlowSteps` },
					{ label: 'OpenID Connect Core 1.0', url: SPEC_URLS.OIDC_CORE },
				],
			};

		default:
			return {
				primarySpec: SPEC_URLS.OAUTH2_RFC6749,
				specLabel: 'OAuth 2.0',
				relatedSpecs: [],
			};
		}
	}
	
	/**
	 * Log specification URL results for debugging
	 */
	static logSpecUrls(
		specVersion: SpecVersion,
		flowType: FlowType,
		flowSpecs: FlowSpecInfo,
		versionSpecs: ReturnType<typeof SpecUrlServiceV8.getSpecUrls>
	): void {
		// #region agent log
		import('@/v8/utils/analyticsV8').then(({ analytics }) => {
			analytics.log({
				location: 'specUrlServiceV8.ts:205',
				message: 'Specification URL results',
				data: {
					specVersion,
					flowType,
					flowPrimarySpec: flowSpecs.primarySpec,
					flowSpecLabel: flowSpecs.specLabel,
					flowRelatedSpecs: flowSpecs.relatedSpecs?.map((s) => ({ label: s.label, url: s.url })),
					versionPrimarySpec: versionSpecs.primary,
					versionPrimaryLabel: versionSpecs.primaryLabel,
					versionRelatedSpecs: versionSpecs.related.map((s) => ({ label: s.label, url: s.url })),
				},
				sessionId: 'debug-session',
				runId: 'run2',
				hypothesisId: 'D',
			});
		}).catch(() => {});
		// #endregion
	}

	/**
	 * Get combined spec URLs for a spec version and flow type
	 * @param specVersion - Spec version
	 * @param flowType - Flow type
	 * @returns Combined spec URLs prioritizing flow-specific specs
	 */
	static getCombinedSpecUrls(
		specVersion: SpecVersion,
		flowType: FlowType
	): {
		primary: string;
		primaryLabel: string;
		allSpecs: Array<{ label: string; url: string; isPrimary?: boolean }>;
	} {
		const versionSpecs = SpecUrlServiceV8.getSpecUrls(specVersion);
		const flowSpecs = SpecUrlServiceV8.getFlowSpecInfo(flowType);

		// Combine specs, prioritizing flow-specific spec as primary if different
		const allSpecs: Array<{ label: string; url: string; isPrimary?: boolean }> = [];

		// Add flow-specific primary spec first if it's different from version spec
		if (flowSpecs.primarySpec !== versionSpecs.primary) {
			allSpecs.push({
				label: flowSpecs.specLabel,
				url: flowSpecs.primarySpec,
				isPrimary: true,
			});
		}

		// Add version-specific primary spec
		allSpecs.push({
			label: versionSpecs.primaryLabel,
			url: versionSpecs.primary,
			isPrimary: flowSpecs.primarySpec === versionSpecs.primary,
		});

		// Add flow-related specs
		if (flowSpecs.relatedSpecs) {
			flowSpecs.relatedSpecs.forEach((spec) => {
				if (!allSpecs.find((s) => s.url === spec.url)) {
					allSpecs.push({ label: spec.label, url: spec.url });
				}
			});
		}

		// Add version-related specs
		versionSpecs.related.forEach((spec) => {
			if (!allSpecs.find((s) => s.url === spec.url)) {
				allSpecs.push({ label: spec.label, url: spec.url });
			}
		});

		// Determine primary URL (flow-specific takes precedence)
		const primaryUrl =
			flowSpecs.primarySpec !== versionSpecs.primary ? flowSpecs.primarySpec : versionSpecs.primary;

		const primaryLabel =
			flowSpecs.primarySpec !== versionSpecs.primary
				? flowSpecs.specLabel
				: versionSpecs.primaryLabel;

		return {
			primary: primaryUrl,
			primaryLabel,
			allSpecs,
		};
	}
}

export default SpecUrlServiceV8;
