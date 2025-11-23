/**
 * @file tokenOperationsServiceV8.ts
 * @module v8/services
 * @description Service to determine which token operations are allowed for each flow
 * @version 8.0.0
 * @since 2024-11-21
 *
 * This service implements OAuth 2.0 and OIDC standards for:
 * - Token introspection (RFC 7662)
 * - UserInfo endpoint access (OIDC)
 *
 * @example
 * const rules = TokenOperationsServiceV8.getOperationRules('oauth-authz', 'openid profile');
 * // Returns: { canIntrospectAccessToken: true, canCallUserInfo: true, ... }
 */

const MODULE_TAG = '[🔍 TOKEN-OPERATIONS-V8]';

export interface TokenOperationRules {
	// Introspection
	canIntrospectAccessToken: boolean;
	canIntrospectRefreshToken: boolean;
	canIntrospectIdToken: boolean;

	// UserInfo
	canCallUserInfo: boolean;

	// Reasons (for educational purposes)
	introspectionReason: string;
	userInfoReason: string;

	// Educational content
	introspectionExplanation: string;
	userInfoExplanation: string;
}

export class TokenOperationsServiceV8 {
	/**
	 * Get token operation rules for a flow
	 * @param flowType - Flow type (oauth-authz, implicit, client-credentials, etc.)
	 * @param scopes - Scopes requested (to check for 'openid')
	 * @returns Rules for what operations are allowed
	 */
	static getOperationRules(flowType: string, scopes?: string): TokenOperationRules {
		const normalizedFlow = flowType.toLowerCase().replace(/[-_]/g, '-');
		const hasOpenIdScope = scopes?.toLowerCase().includes('openid') || false;

		console.log(`${MODULE_TAG} Getting operation rules`, {
			flowType,
			normalizedFlow,
			scopes,
			hasOpenIdScope,
		});

		// Authorization Code Flow
		if (normalizedFlow.includes('oauth-authz') || normalizedFlow.includes('authorization-code')) {
			if (hasOpenIdScope) {
				return {
					canIntrospectAccessToken: true,
					canIntrospectRefreshToken: true,
					canIntrospectIdToken: false,
					canCallUserInfo: true,
					introspectionReason: 'Access and refresh tokens can be introspected',
					userInfoReason: 'UserInfo available because openid scope is present',
					introspectionExplanation:
						'Resource servers can introspect access tokens to verify validity and permissions. Refresh tokens can also be introspected (typically by the authorization server).',
					userInfoExplanation:
						'With the openid scope, you can call /userinfo with your access token to get additional user profile claims beyond what\'s in the ID token.',
				};
			}
			return {
				canIntrospectAccessToken: true,
				canIntrospectRefreshToken: true,
				canIntrospectIdToken: false,
				canCallUserInfo: false,
				introspectionReason: 'Access and refresh tokens can be introspected',
				userInfoReason: 'UserInfo not available - openid scope not requested',
				introspectionExplanation:
					'This is a pure OAuth flow (no OIDC). Resource servers can introspect access tokens to verify validity and permissions.',
				userInfoExplanation:
					'UserInfo is only available in OIDC flows. To use UserInfo, add the "openid" scope to your request.',
			};
		}

		// Implicit Flow
		if (normalizedFlow.includes('implicit')) {
			if (hasOpenIdScope) {
				return {
					canIntrospectAccessToken: true,
					canIntrospectRefreshToken: false,
					canIntrospectIdToken: false,
					canCallUserInfo: true,
					introspectionReason: 'Access tokens can be introspected',
					userInfoReason: 'UserInfo available because openid scope is present',
					introspectionExplanation:
						'Access tokens from implicit flow can be introspected. Refresh tokens are not issued in implicit flow. ID tokens should be validated locally, not introspected.',
					userInfoExplanation:
						'With the openid scope, you can call /userinfo with your access token to get user profile claims.',
				};
			}
			return {
				canIntrospectAccessToken: true,
				canIntrospectRefreshToken: false,
				canIntrospectIdToken: false,
				canCallUserInfo: false,
				introspectionReason: 'Access tokens can be introspected',
				userInfoReason: 'UserInfo not available - openid scope not requested',
				introspectionExplanation:
					'Access tokens can be introspected. Implicit flow typically does not issue refresh tokens.',
				userInfoExplanation:
					'UserInfo is only available in OIDC flows. To use UserInfo, add the "openid" scope to your request.',
			};
		}

		// Hybrid Flow (always OIDC)
		if (normalizedFlow.includes('hybrid')) {
			return {
				canIntrospectAccessToken: true,
				canIntrospectRefreshToken: true,
				canIntrospectIdToken: false,
				canCallUserInfo: true,
				introspectionReason: 'Access and refresh tokens can be introspected',
				userInfoReason: 'UserInfo available (Hybrid is an OIDC flow)',
				introspectionExplanation:
					'Hybrid flow is OIDC. Access and refresh tokens can be introspected. ID tokens should be validated locally.',
				userInfoExplanation:
					'Hybrid flow is an OIDC flow, so you can call /userinfo with your access token to get user profile claims.',
			};
		}

		// Client Credentials Flow
		if (normalizedFlow.includes('client-credentials') || normalizedFlow.includes('client_credentials')) {
			return {
				canIntrospectAccessToken: true,
				canIntrospectRefreshToken: false,
				canIntrospectIdToken: false,
				canCallUserInfo: false,
				introspectionReason: 'Access tokens can be introspected',
				userInfoReason: 'UserInfo not available - no user in this flow',
				introspectionExplanation:
					'Client Credentials is machine-to-machine. Resource servers can introspect access tokens to verify client identity, scopes, and permissions.',
				userInfoExplanation:
					'UserInfo is not available because Client Credentials flow has no end-user. This is a machine-to-machine flow representing only the client application.',
			};
		}

		// Device Authorization Flow
		if (normalizedFlow.includes('device')) {
			if (hasOpenIdScope) {
				return {
					canIntrospectAccessToken: true,
					canIntrospectRefreshToken: true,
					canIntrospectIdToken: false,
					canCallUserInfo: true,
					introspectionReason: 'Access and refresh tokens can be introspected',
					userInfoReason: 'UserInfo available because openid scope is present',
					introspectionExplanation:
						'Device flow tokens can be introspected. This is useful for devices that need to verify token validity.',
					userInfoExplanation:
						'With the openid scope, you can call /userinfo with your access token to get user profile claims.',
				};
			}
			return {
				canIntrospectAccessToken: true,
				canIntrospectRefreshToken: true,
				canIntrospectIdToken: false,
				canCallUserInfo: false,
				introspectionReason: 'Access and refresh tokens can be introspected',
				userInfoReason: 'UserInfo not available - openid scope not requested',
				introspectionExplanation:
					'Device flow tokens can be introspected. This is useful for devices that need to verify token validity.',
				userInfoExplanation:
					'UserInfo is only available in OIDC flows. To use UserInfo, add the "openid" scope to your request.',
			};
		}

		// ROPC (Resource Owner Password Credentials)
		if (normalizedFlow.includes('ropc') || normalizedFlow.includes('resource-owner-password')) {
			if (hasOpenIdScope) {
				return {
					canIntrospectAccessToken: true,
					canIntrospectRefreshToken: true,
					canIntrospectIdToken: false,
					canCallUserInfo: true,
					introspectionReason: 'Access and refresh tokens can be introspected',
					userInfoReason: 'UserInfo available because openid scope is present',
					introspectionExplanation:
						'ROPC tokens can be introspected. Note: ROPC is a legacy flow and should be avoided in new applications.',
					userInfoExplanation:
						'With the openid scope, you can call /userinfo with your access token to get user profile claims.',
				};
			}
			return {
				canIntrospectAccessToken: true,
				canIntrospectRefreshToken: true,
				canIntrospectIdToken: false,
				canCallUserInfo: false,
				introspectionReason: 'Access and refresh tokens can be introspected',
				userInfoReason: 'UserInfo not available - openid scope not requested',
				introspectionExplanation:
					'ROPC tokens can be introspected. Note: ROPC is a legacy flow and should be avoided in new applications.',
				userInfoExplanation:
					'UserInfo is only available in OIDC flows. To use UserInfo, add the "openid" scope to your request.',
			};
		}

		// Default fallback
		console.warn(`${MODULE_TAG} Unknown flow type, using conservative defaults`, { flowType });
		return {
			canIntrospectAccessToken: true,
			canIntrospectRefreshToken: false,
			canIntrospectIdToken: false,
			canCallUserInfo: hasOpenIdScope,
			introspectionReason: 'Access tokens can typically be introspected',
			userInfoReason: hasOpenIdScope
				? 'UserInfo available because openid scope is present'
				: 'UserInfo not available - openid scope not requested',
			introspectionExplanation:
				'Access tokens can typically be introspected by resource servers to verify validity and permissions.',
			userInfoExplanation: hasOpenIdScope
				? 'With the openid scope, you can call /userinfo with your access token.'
				: 'UserInfo requires the openid scope to be present in your authorization request.',
		};
	}

	/**
	 * Get a simple summary for display
	 * @param flowType - Flow type
	 * @param scopes - Scopes requested
	 * @returns Simple summary string
	 */
	static getSummary(flowType: string, scopes?: string): string {
		const rules = this.getOperationRules(flowType, scopes);
		const parts: string[] = [];

		if (rules.canIntrospectAccessToken) {
			parts.push('✅ Introspect Access Token');
		}
		if (rules.canIntrospectRefreshToken) {
			parts.push('✅ Introspect Refresh Token');
		}
		if (rules.canCallUserInfo) {
			parts.push('✅ Call UserInfo');
		} else {
			parts.push('❌ UserInfo Not Available');
		}

		return parts.join(' | ');
	}

	/**
	 * Check if a specific operation is allowed
	 * @param flowType - Flow type
	 * @param scopes - Scopes requested
	 * @param operation - Operation to check
	 * @returns True if allowed
	 */
	static isOperationAllowed(
		flowType: string,
		scopes: string | undefined,
		operation: 'introspect-access' | 'introspect-refresh' | 'introspect-id' | 'userinfo'
	): boolean {
		const rules = this.getOperationRules(flowType, scopes);

		switch (operation) {
			case 'introspect-access':
				return rules.canIntrospectAccessToken;
			case 'introspect-refresh':
				return rules.canIntrospectRefreshToken;
			case 'introspect-id':
				return rules.canIntrospectIdToken;
			case 'userinfo':
				return rules.canCallUserInfo;
			default:
				return false;
		}
	}

	/**
	 * Get educational content for a specific operation
	 * @param operation - Operation type
	 * @returns Educational content
	 */
	static getEducationalContent(operation: 'introspection' | 'userinfo'): {
		title: string;
		description: string;
		whenToUse: string[];
		commonMistakes: string[];
	} {
		if (operation === 'introspection') {
			return {
				title: 'Token Introspection (RFC 7662)',
				description:
					'Token introspection is a back-channel call to the authorization server asking: "Is this token still valid, and what are its properties?"',
				whenToUse: [
					'Resource servers need to verify opaque access tokens',
					'You want centralized revocation checking (even for JWTs)',
					'You need to check token scopes and permissions',
					'You want to verify token is still active (not revoked)',
				],
				commonMistakes: [
					'❌ Introspecting ID tokens (validate them locally instead)',
					'❌ Introspecting tokens on every API call (use caching)',
					'❌ Using introspection for public clients without authentication',
					'❌ Exposing introspection endpoint to untrusted clients',
				],
			};
		}

		return {
			title: 'UserInfo Endpoint (OIDC)',
			description:
				'The UserInfo endpoint returns claims about the authenticated end-user. It requires an access token issued with the "openid" scope.',
			whenToUse: [
				'You need additional user profile claims beyond the ID token',
				'You want centralized profile management',
				'Your ID token is too large and you want to fetch claims on-demand',
				'You need real-time user data (not cached in ID token)',
			],
			commonMistakes: [
				'❌ Calling UserInfo without "openid" scope',
				'❌ Using ID token instead of access token',
				'❌ Calling UserInfo for client_credentials flow (no user)',
				'❌ Calling UserInfo with refresh token',
			],
		};
	}
}

export default TokenOperationsServiceV8;
