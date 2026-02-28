// src/services/fieldRulesService.ts
/**
 * Field Rules Service
 *
 * Central service that determines field visibility, editability, and validation
 * for OAuth 2.0 and OIDC flows based on RFC specifications.
 *
 * @version 1.0.0
 */

/**
 * Rule for a single credential field
 */
export interface FieldRule {
	// Visibility and editability
	visible: boolean; // Should the field be shown?
	editable: boolean; // Can the user edit it?
	required: boolean; // Is it required for the flow?

	// Validation
	validValues?: string[]; // Allowed values (for dropdowns)
	enforcedValue?: string; // Fixed value (for read-only fields)

	// Educational content
	explanation?: string; // Why is this field restricted?
	specReference?: string; // RFC section reference
}

/**
 * Complete set of field rules for a flow
 */
export interface FlowFieldRules {
	environmentId: FieldRule;
	clientId: FieldRule;
	clientSecret: FieldRule;
	redirectUri: FieldRule;
	scope: FieldRule;
	responseType: FieldRule;
	loginHint: FieldRule;
	postLogoutRedirectUri: FieldRule;
	clientAuthMethod: FieldRule;
}

/**
 * Normalize flow type string for consistent matching
 * @param flowType - The flow identifier
 * @returns Normalized flow type (lowercase, hyphens)
 */
function normalizeFlowType(flowType: string): string {
	return flowType.toLowerCase().replace(/[_]/g, '-');
}

/**
 * Detect if a flow type is a mock/demo flow
 * @param flowType - The flow identifier
 * @returns true if this is a mock flow
 */
function detectMockFlow(flowType: string): boolean {
	const normalized = normalizeFlowType(flowType);
	return normalized.includes('-mock') || normalized.includes('mock-') || flowType.includes('Mock');
}

export { detectMockFlow as isMockFlow };

/**
 * Get default field rule (all fields visible and editable)
 */
function _getDefaultFieldRule(): FieldRule {
	return {
		visible: true,
		editable: true,
		required: true,
	};
}

/**
 * Get field rules for Authorization Code Flow (OAuth 2.0)
 * @see RFC 6749 Section 4.1 - Authorization Code Grant
 */
function getAuthorizationCodeRules(): FlowFieldRules {
	return {
		environmentId: {
			visible: true,
			editable: true,
			required: true,
			explanation: 'PingOne Environment ID where your application is configured',
		},
		clientId: {
			visible: true,
			editable: true,
			required: true,
			explanation: 'OAuth 2.0 Client Identifier',
			specReference: 'https://datatracker.ietf.org/doc/html/rfc6749#section-2.2',
		},
		clientSecret: {
			visible: true,
			editable: true,
			required: true,
			explanation: 'Client Secret for confidential clients',
			specReference: 'https://datatracker.ietf.org/doc/html/rfc6749#section-2.3.1',
		},
		redirectUri: {
			visible: true,
			editable: true,
			required: true,
			explanation: 'URI where authorization server redirects after authentication',
			specReference: 'https://datatracker.ietf.org/doc/html/rfc6749#section-3.1.2',
		},
		scope: {
			visible: true,
			editable: true,
			required: false,
			explanation: 'Space-separated list of access scopes',
			specReference: 'https://datatracker.ietf.org/doc/html/rfc6749#section-3.3',
		},
		responseType: {
			visible: true,
			editable: false,
			required: true,
			enforcedValue: 'code',
			validValues: ['code'],
			explanation: "Fixed to 'code' for Authorization Code Flow",
			specReference: 'https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.1',
		},
		loginHint: {
			visible: true,
			editable: true,
			required: false,
			explanation: 'Optional hint about user identifier to pre-fill login form',
		},
		postLogoutRedirectUri: {
			visible: false,
			editable: false,
			required: false,
			explanation: 'Not applicable to OAuth 2.0 flows (OIDC only)',
		},
		clientAuthMethod: {
			visible: true,
			editable: true,
			required: true,
			validValues: [
				'client_secret_basic',
				'client_secret_post',
				'client_secret_jwt',
				'private_key_jwt',
			],
			explanation: 'Method for authenticating the client at token endpoint',
			specReference: 'https://datatracker.ietf.org/doc/html/rfc6749#section-2.3',
		},
	};
}

/**
 * Get field rules for Authorization Code Flow (OIDC)
 * @see OpenID Connect Core 1.0 Section 3.1 - Authentication using the Authorization Code Flow
 */
function getOIDCAuthorizationCodeRules(): FlowFieldRules {
	const baseRules = getAuthorizationCodeRules();

	return {
		...baseRules,
		scope: {
			visible: true,
			editable: true,
			required: true,
			enforcedValue: 'openid',
			explanation: "Must include 'openid' scope for OIDC flows",
			specReference: 'https://openid.net/specs/openid-connect-core-1_0.html#AuthRequest',
		},
		responseType: {
			visible: true,
			editable: true,
			required: true,
			validValues: ['code', 'code id_token'],
			explanation: "OIDC allows 'code' or 'code id_token' for Authorization Code Flow",
			specReference: 'https://openid.net/specs/openid-connect-core-1_0.html#AuthRequest',
		},
		postLogoutRedirectUri: {
			visible: true,
			editable: true,
			required: false,
			explanation: 'URI where user is redirected after logout',
			specReference: 'https://openid.net/specs/openid-connect-session-1_0.html#RPLogout',
		},
	};
}

/**
 * Get field rules for Implicit Flow (OAuth 2.0)
 * @see RFC 6749 Section 4.2 - Implicit Grant
 */
function getImplicitRules(): FlowFieldRules {
	return {
		environmentId: {
			visible: true,
			editable: true,
			required: true,
			explanation: 'PingOne Environment ID where your application is configured',
		},
		clientId: {
			visible: true,
			editable: true,
			required: true,
			explanation: 'OAuth 2.0 Client Identifier',
			specReference: 'https://datatracker.ietf.org/doc/html/rfc6749#section-2.2',
		},
		clientSecret: {
			visible: false,
			editable: false,
			required: false,
			explanation: 'Implicit flow is for public clients - no client secret',
			specReference: 'https://datatracker.ietf.org/doc/html/rfc6749#section-4.2',
		},
		redirectUri: {
			visible: true,
			editable: true,
			required: true,
			explanation: 'URI where authorization server redirects with access token',
			specReference: 'https://datatracker.ietf.org/doc/html/rfc6749#section-4.2.1',
		},
		scope: {
			visible: true,
			editable: true,
			required: false,
			explanation: 'Space-separated list of access scopes',
			specReference: 'https://datatracker.ietf.org/doc/html/rfc6749#section-3.3',
		},
		responseType: {
			visible: true,
			editable: false,
			required: true,
			enforcedValue: 'token',
			validValues: ['token'],
			explanation: "Fixed to 'token' for Implicit Flow",
			specReference: 'https://datatracker.ietf.org/doc/html/rfc6749#section-4.2.1',
		},
		loginHint: {
			visible: true,
			editable: true,
			required: false,
			explanation: 'Optional hint about user identifier to pre-fill login form',
		},
		postLogoutRedirectUri: {
			visible: false,
			editable: false,
			required: false,
			explanation: 'Not applicable to OAuth 2.0 flows (OIDC only)',
		},
		clientAuthMethod: {
			visible: false,
			editable: false,
			required: false,
			explanation: "Implicit flow doesn't use token endpoint - no client authentication",
			specReference: 'https://datatracker.ietf.org/doc/html/rfc6749#section-4.2',
		},
	};
}

/**
 * Get field rules for Implicit Flow (OIDC)
 * @see OpenID Connect Core 1.0 Section 3.2 - Authentication using the Implicit Flow
 */
function getOIDCImplicitRules(): FlowFieldRules {
	const baseRules = getImplicitRules();

	return {
		...baseRules,
		scope: {
			visible: true,
			editable: true,
			required: true,
			enforcedValue: 'openid',
			explanation: "Must include 'openid' scope for OIDC flows",
			specReference: 'https://openid.net/specs/openid-connect-core-1_0.html#ImplicitAuthRequest',
		},
		responseType: {
			visible: true,
			editable: true,
			required: true,
			validValues: ['id_token', 'token id_token'],
			explanation: "OIDC Implicit Flow requires 'id_token' or 'token id_token'",
			specReference: 'https://openid.net/specs/openid-connect-core-1_0.html#ImplicitAuthRequest',
		},
		postLogoutRedirectUri: {
			visible: true,
			editable: true,
			required: false,
			explanation: 'URI where user is redirected after logout',
			specReference: 'https://openid.net/specs/openid-connect-session-1_0.html#RPLogout',
		},
	};
}

/**
 * Get field rules for Client Credentials Flow
 * @see RFC 6749 Section 4.4 - Client Credentials Grant
 */
function getClientCredentialsRules(): FlowFieldRules {
	return {
		environmentId: {
			visible: true,
			editable: true,
			required: true,
			explanation: 'PingOne Environment ID where your application is configured',
		},
		clientId: {
			visible: true,
			editable: true,
			required: true,
			explanation: 'OAuth 2.0 Client Identifier',
			specReference: 'https://datatracker.ietf.org/doc/html/rfc6749#section-2.2',
		},
		clientSecret: {
			visible: true,
			editable: true,
			required: true,
			explanation: 'Client Secret for machine-to-machine authentication',
			specReference: 'https://datatracker.ietf.org/doc/html/rfc6749#section-2.3.1',
		},
		redirectUri: {
			visible: false,
			editable: false,
			required: false,
			explanation:
				"Client Credentials is a machine-to-machine flow that doesn't use browser redirects",
			specReference: 'https://datatracker.ietf.org/doc/html/rfc6749#section-4.4',
		},
		scope: {
			visible: true,
			editable: true,
			required: false,
			explanation: 'Space-separated list of access scopes',
			specReference: 'https://datatracker.ietf.org/doc/html/rfc6749#section-4.4.2',
		},
		responseType: {
			visible: false,
			editable: false,
			required: false,
			explanation:
				'Client Credentials flow uses direct token endpoint access, no authorization endpoint',
			specReference: 'https://datatracker.ietf.org/doc/html/rfc6749#section-4.4',
		},
		loginHint: {
			visible: false,
			editable: false,
			required: false,
			explanation: 'No user authentication in machine-to-machine flows',
		},
		postLogoutRedirectUri: {
			visible: false,
			editable: false,
			required: false,
			explanation: 'No user session in machine-to-machine flows',
		},
		clientAuthMethod: {
			visible: true,
			editable: true,
			required: true,
			validValues: [
				'client_secret_basic',
				'client_secret_post',
				'client_secret_jwt',
				'private_key_jwt',
			],
			explanation: 'Method for authenticating the client at token endpoint',
			specReference: 'https://datatracker.ietf.org/doc/html/rfc6749#section-2.3',
		},
	};
}

/**
 * Get field rules for Hybrid Flow (OIDC)
 * @see OpenID Connect Core 1.0 Section 3.3 - Authentication using the Hybrid Flow
 */
function getHybridRules(): FlowFieldRules {
	return {
		environmentId: {
			visible: true,
			editable: true,
			required: true,
			explanation: 'PingOne Environment ID where your application is configured',
		},
		clientId: {
			visible: true,
			editable: true,
			required: true,
			explanation: 'OAuth 2.0 Client Identifier',
			specReference: 'https://openid.net/specs/openid-connect-core-1_0.html#HybridAuthRequest',
		},
		clientSecret: {
			visible: true,
			editable: true,
			required: true,
			explanation: 'Client Secret for confidential clients',
			specReference: 'https://openid.net/specs/openid-connect-core-1_0.html#HybridAuthRequest',
		},
		redirectUri: {
			visible: true,
			editable: true,
			required: true,
			explanation: 'URI where authorization server redirects with code and/or tokens',
			specReference: 'https://openid.net/specs/openid-connect-core-1_0.html#HybridAuthRequest',
		},
		scope: {
			visible: true,
			editable: true,
			required: true,
			enforcedValue: 'openid',
			explanation: "Must include 'openid' scope for OIDC flows",
			specReference: 'https://openid.net/specs/openid-connect-core-1_0.html#HybridAuthRequest',
		},
		responseType: {
			visible: true,
			editable: true,
			required: true,
			validValues: ['code id_token', 'code token', 'code token id_token'],
			explanation: 'Hybrid Flow supports multiple response type combinations',
			specReference: 'https://openid.net/specs/openid-connect-core-1_0.html#HybridAuthRequest',
		},
		loginHint: {
			visible: true,
			editable: true,
			required: false,
			explanation: 'Optional hint about user identifier to pre-fill login form',
		},
		postLogoutRedirectUri: {
			visible: true,
			editable: true,
			required: false,
			explanation: 'URI where user is redirected after logout',
			specReference: 'https://openid.net/specs/openid-connect-session-1_0.html#RPLogout',
		},
		clientAuthMethod: {
			visible: true,
			editable: true,
			required: true,
			validValues: [
				'client_secret_basic',
				'client_secret_post',
				'client_secret_jwt',
				'private_key_jwt',
			],
			explanation: 'Method for authenticating the client at token endpoint',
			specReference: 'https://openid.net/specs/openid-connect-core-1_0.html#ClientAuthentication',
		},
	};
}

/**
 * Get field rules for Device Authorization Flow
 * @see RFC 8628 - OAuth 2.0 Device Authorization Grant
 */
function getDeviceAuthorizationRules(): FlowFieldRules {
	return {
		environmentId: {
			visible: true,
			editable: true,
			required: true,
			explanation: 'PingOne Environment ID where your application is configured',
		},
		clientId: {
			visible: true,
			editable: true,
			required: true,
			explanation: 'OAuth 2.0 Client Identifier',
			specReference: 'https://datatracker.ietf.org/doc/html/rfc8628#section-3.1',
		},
		clientSecret: {
			visible: true,
			editable: true,
			required: false,
			explanation: 'Optional for public clients, required for confidential clients',
			specReference: 'https://datatracker.ietf.org/doc/html/rfc8628#section-3.4',
		},
		redirectUri: {
			visible: false,
			editable: false,
			required: false,
			explanation:
				"Device flow doesn't use browser redirects - user authenticates on a separate device",
			specReference: 'https://datatracker.ietf.org/doc/html/rfc8628#section-1',
		},
		scope: {
			visible: true,
			editable: true,
			required: false,
			explanation: 'Space-separated list of access scopes',
			specReference: 'https://datatracker.ietf.org/doc/html/rfc8628#section-3.1',
		},
		responseType: {
			visible: false,
			editable: false,
			required: false,
			explanation:
				"Device flow doesn't use authorization endpoint - uses device authorization endpoint",
			specReference: 'https://datatracker.ietf.org/doc/html/rfc8628#section-3.1',
		},
		loginHint: {
			visible: true,
			editable: true,
			required: false,
			explanation: 'Optional hint about user identifier for device authentication',
		},
		postLogoutRedirectUri: {
			visible: false,
			editable: false,
			required: false,
			explanation: 'Not applicable to device flows',
		},
		clientAuthMethod: {
			visible: true,
			editable: true,
			required: false,
			validValues: ['none', 'client_secret_basic', 'client_secret_post'],
			explanation: 'Optional client authentication at token endpoint',
			specReference: 'https://datatracker.ietf.org/doc/html/rfc8628#section-3.4',
		},
	};
}

/**
 * Get field rules for CIBA Flow (Client Initiated Backchannel Authentication)
 * @see RFC 9436 - OpenID Connect Client-Initiated Backchannel Authentication Flow
 */
function getCIBARules(): FlowFieldRules {
	return {
		environmentId: {
			visible: true,
			editable: true,
			required: true,
			explanation: 'PingOne Environment ID where your application is configured',
		},
		clientId: {
			visible: true,
			editable: true,
			required: true,
			explanation: 'OAuth 2.0 Client Identifier',
			specReference:
				'https://openid.net/specs/openid-client-initiated-backchannel-authentication-core-1_0.html',
		},
		clientSecret: {
			visible: true,
			editable: true,
			required: true,
			explanation: 'Client Secret for confidential clients',
			specReference:
				'https://openid.net/specs/openid-client-initiated-backchannel-authentication-core-1_0.html',
		},
		redirectUri: {
			visible: false,
			editable: false,
			required: false,
			explanation: 'CIBA uses backchannel authentication - no browser redirects',
			specReference:
				'https://openid.net/specs/openid-client-initiated-backchannel-authentication-core-1_0.html#rfc.section.1',
		},
		scope: {
			visible: true,
			editable: true,
			required: true,
			enforcedValue: 'openid',
			explanation: "Must include 'openid' scope for OIDC flows",
			specReference:
				'https://openid.net/specs/openid-client-initiated-backchannel-authentication-core-1_0.html',
		},
		responseType: {
			visible: false,
			editable: false,
			required: false,
			explanation:
				"CIBA doesn't use authorization endpoint - uses backchannel authentication endpoint",
			specReference:
				'https://openid.net/specs/openid-client-initiated-backchannel-authentication-core-1_0.html',
		},
		loginHint: {
			visible: true,
			editable: true,
			required: true,
			explanation: 'Required hint to identify the user for backchannel authentication',
			specReference:
				'https://openid.net/specs/openid-client-initiated-backchannel-authentication-core-1_0.html#rfc.section.7.1',
		},
		postLogoutRedirectUri: {
			visible: false,
			editable: false,
			required: false,
			explanation: 'Not applicable to CIBA flows',
		},
		clientAuthMethod: {
			visible: true,
			editable: true,
			required: true,
			validValues: [
				'client_secret_basic',
				'client_secret_post',
				'client_secret_jwt',
				'private_key_jwt',
			],
			explanation: 'Method for authenticating the client at backchannel and token endpoints',
			specReference:
				'https://openid.net/specs/openid-client-initiated-backchannel-authentication-core-1_0.html',
		},
	};
}

/**
 * Get field rules for ROPC Flow (Resource Owner Password Credentials)
 * @see RFC 6749 Section 4.3 - Resource Owner Password Credentials Grant
 * @deprecated This flow is deprecated and should not be used in new applications
 */
function getROPCRules(): FlowFieldRules {
	return {
		environmentId: {
			visible: true,
			editable: true,
			required: true,
			explanation: 'PingOne Environment ID where your application is configured',
		},
		clientId: {
			visible: true,
			editable: true,
			required: true,
			explanation: 'OAuth 2.0 Client Identifier',
			specReference: 'https://datatracker.ietf.org/doc/html/rfc6749#section-4.3',
		},
		clientSecret: {
			visible: true,
			editable: true,
			required: false,
			explanation: 'Optional for public clients, required for confidential clients',
			specReference: 'https://datatracker.ietf.org/doc/html/rfc6749#section-4.3.2',
		},
		redirectUri: {
			visible: false,
			editable: false,
			required: false,
			explanation: 'ROPC flow uses direct token endpoint access - no browser redirects',
			specReference: 'https://datatracker.ietf.org/doc/html/rfc6749#section-4.3',
		},
		scope: {
			visible: true,
			editable: true,
			required: false,
			explanation: 'Space-separated list of access scopes',
			specReference: 'https://datatracker.ietf.org/doc/html/rfc6749#section-4.3.2',
		},
		responseType: {
			visible: false,
			editable: false,
			required: false,
			explanation: "ROPC flow doesn't use authorization endpoint - direct token request",
			specReference: 'https://datatracker.ietf.org/doc/html/rfc6749#section-4.3',
		},
		loginHint: {
			visible: false,
			editable: false,
			required: false,
			explanation: 'Not applicable - username/password provided directly in token request',
		},
		postLogoutRedirectUri: {
			visible: false,
			editable: false,
			required: false,
			explanation: 'Not applicable to ROPC flows',
		},
		clientAuthMethod: {
			visible: true,
			editable: true,
			required: false,
			validValues: ['none', 'client_secret_basic', 'client_secret_post'],
			explanation: 'Optional client authentication at token endpoint',
			specReference: 'https://datatracker.ietf.org/doc/html/rfc6749#section-4.3.2',
		},
	};
}

/**
 * Get field rules for JWT Bearer Token Flow
 * @see RFC 7523 - JSON Web Token (JWT) Profile for OAuth 2.0 Client Authentication and Authorization Grants
 */
function getJWTBearerRules(): FlowFieldRules {
	return {
		environmentId: {
			visible: true,
			editable: true,
			required: true,
			explanation: 'PingOne Environment ID where your application is configured',
		},
		clientId: {
			visible: true,
			editable: true,
			required: true,
			explanation: 'OAuth 2.0 Client Identifier',
			specReference: 'https://datatracker.ietf.org/doc/html/rfc7523#section-2.1',
		},
		clientSecret: {
			visible: false,
			editable: false,
			required: false,
			explanation: 'JWT Bearer uses JWT assertion for authentication - no client secret',
			specReference: 'https://datatracker.ietf.org/doc/html/rfc7523#section-2.1',
		},
		redirectUri: {
			visible: false,
			editable: false,
			required: false,
			explanation: 'JWT Bearer flow uses direct token endpoint access - no browser redirects',
			specReference: 'https://datatracker.ietf.org/doc/html/rfc7523#section-2.1',
		},
		scope: {
			visible: true,
			editable: true,
			required: false,
			explanation: 'Space-separated list of access scopes',
			specReference: 'https://datatracker.ietf.org/doc/html/rfc7523#section-2.1',
		},
		responseType: {
			visible: false,
			editable: false,
			required: false,
			explanation:
				"JWT Bearer flow doesn't use authorization endpoint - direct token request with JWT",
			specReference: 'https://datatracker.ietf.org/doc/html/rfc7523#section-2.1',
		},
		loginHint: {
			visible: false,
			editable: false,
			required: false,
			explanation: 'Not applicable - user identity provided in JWT assertion',
		},
		postLogoutRedirectUri: {
			visible: false,
			editable: false,
			required: false,
			explanation: 'Not applicable to JWT Bearer flows',
		},
		clientAuthMethod: {
			visible: true,
			editable: false,
			required: true,
			enforcedValue: 'private_key_jwt',
			explanation: 'JWT Bearer flow uses JWT assertion for client authentication',
			specReference: 'https://datatracker.ietf.org/doc/html/rfc7523#section-2.2',
		},
	};
}

/**
 * Get field rules for SAML Bearer Assertion Flow
 * @see RFC 7522 - Security Assertion Markup Language (SAML) 2.0 Profile for OAuth 2.0 Client Authentication and Authorization Grants
 */
function getSAMLBearerRules(): FlowFieldRules {
	return {
		environmentId: {
			visible: true,
			editable: true,
			required: true,
			explanation: 'PingOne Environment ID where your application is configured',
		},
		clientId: {
			visible: true,
			editable: true,
			required: true,
			explanation: 'OAuth 2.0 Client Identifier',
			specReference: 'https://datatracker.ietf.org/doc/html/rfc7522#section-2.1',
		},
		clientSecret: {
			visible: false,
			editable: false,
			required: false,
			explanation: 'SAML Bearer uses SAML assertion for authentication - no client secret',
			specReference: 'https://datatracker.ietf.org/doc/html/rfc7522#section-2.1',
		},
		redirectUri: {
			visible: false,
			editable: false,
			required: false,
			explanation: 'SAML Bearer flow uses direct token endpoint access - no browser redirects',
			specReference: 'https://datatracker.ietf.org/doc/html/rfc7522#section-2.1',
		},
		scope: {
			visible: true,
			editable: true,
			required: false,
			explanation: 'Space-separated list of access scopes',
			specReference: 'https://datatracker.ietf.org/doc/html/rfc7522#section-2.1',
		},
		responseType: {
			visible: false,
			editable: false,
			required: false,
			explanation:
				"SAML Bearer flow doesn't use authorization endpoint - direct token request with SAML assertion",
			specReference: 'https://datatracker.ietf.org/doc/html/rfc7522#section-2.1',
		},
		loginHint: {
			visible: false,
			editable: false,
			required: false,
			explanation: 'Not applicable - user identity provided in SAML assertion',
		},
		postLogoutRedirectUri: {
			visible: false,
			editable: false,
			required: false,
			explanation: 'Not applicable to SAML Bearer flows',
		},
		clientAuthMethod: {
			visible: true,
			editable: true,
			required: false,
			validValues: ['none', 'client_secret_basic', 'client_secret_post'],
			explanation: 'Optional client authentication at token endpoint',
			specReference: 'https://datatracker.ietf.org/doc/html/rfc7522#section-2.2',
		},
	};
}

/**
 * Get field rules for mock flows
 * Mock flows allow experimentation without valid credentials
 */
function getMockFlowRules(): FlowFieldRules {
	return {
		environmentId: {
			visible: true,
			editable: true,
			required: false,
			explanation: 'Optional for mock flows - uses simulated environment',
		},
		clientId: {
			visible: true,
			editable: true,
			required: false,
			explanation: 'Optional for mock flows - uses demo credentials',
		},
		clientSecret: {
			visible: true,
			editable: true,
			required: false,
			explanation: 'Optional for mock flows - uses demo credentials',
		},
		redirectUri: {
			visible: true,
			editable: true,
			required: false,
			explanation: 'Optional for mock flows - uses simulated redirects',
		},
		scope: {
			visible: true,
			editable: true,
			required: false,
			explanation: 'Optional for mock flows - defaults provided',
		},
		responseType: {
			visible: true,
			editable: true,
			required: false,
			explanation: 'Optional for mock flows',
		},
		loginHint: {
			visible: true,
			editable: true,
			required: false,
			explanation: 'Optional for mock flows',
		},
		postLogoutRedirectUri: {
			visible: true,
			editable: true,
			required: false,
			explanation: 'Optional for mock flows',
		},
		clientAuthMethod: {
			visible: true,
			editable: true,
			required: false,
			explanation: 'Optional for mock flows',
		},
	};
}

/**
 * Get field rules for a specific flow type
 * @param flowType - The flow identifier (e.g., 'authorization-code-v7')
 * @param isOIDC - Whether this is an OIDC flow variant
 * @param isMock - Whether this is a mock/demo flow (optional, auto-detected if not provided)
 * @returns Complete field rules for the flow
 */
export function getFieldRules(flowType: string, isOIDC: boolean, isMock?: boolean): FlowFieldRules {
	// Auto-detect mock flows if not explicitly specified
	const isMockFlowDetected = isMock ?? detectMockFlow(flowType);

	// Return mock rules if this is a mock flow
	if (isMockFlowDetected) {
		return getMockFlowRules();
	}

	const normalized = normalizeFlowType(flowType);

	// Authorization Code Flow
	if (normalized.includes('authorization-code') || normalized.includes('authz')) {
		return isOIDC ? getOIDCAuthorizationCodeRules() : getAuthorizationCodeRules();
	}

	// Implicit Flow
	if (normalized.includes('implicit')) {
		return isOIDC ? getOIDCImplicitRules() : getImplicitRules();
	}

	// Client Credentials Flow
	if (normalized.includes('client-credentials') || normalized.includes('worker-token')) {
		return getClientCredentialsRules();
	}

	// Device Authorization Flow
	if (normalized.includes('device')) {
		return getDeviceAuthorizationRules();
	}

	// Hybrid Flow (OIDC only)
	if (normalized.includes('hybrid')) {
		return getHybridRules();
	}

	// CIBA Flow
	if (normalized.includes('ciba')) {
		return getCIBARules();
	}

	// ROPC Flow
	if (normalized.includes('ropc') || normalized.includes('resource-owner-password')) {
		return getROPCRules();
	}

	// JWT Bearer Flow
	if (normalized.includes('jwt-bearer')) {
		return getJWTBearerRules();
	}

	// SAML Bearer Flow
	if (normalized.includes('saml-bearer')) {
		return getSAMLBearerRules();
	}

	// Default to Authorization Code rules
	console.warn(
		`[fieldRulesService] Unknown flow type: ${flowType}, using Authorization Code rules`
	);
	return isOIDC ? getOIDCAuthorizationCodeRules() : getAuthorizationCodeRules();
}

/**
 * Get valid response types for a flow
 * @param flowType - The flow identifier
 * @param isOIDC - Whether this is an OIDC flow variant
 * @returns Array of valid response types
 */
export function getValidResponseTypes(flowType: string, isOIDC: boolean): string[] {
	const normalized = normalizeFlowType(flowType);

	// Flows that don't use response_type
	if (
		normalized.includes('client-credentials') ||
		normalized.includes('worker-token') ||
		normalized.includes('device') ||
		normalized.includes('jwt-bearer') ||
		normalized.includes('saml-bearer') ||
		normalized.includes('ropc') ||
		normalized.includes('ciba')
	) {
		return [];
	}

	// Authorization Code Flow
	if (normalized.includes('authorization-code') || normalized.includes('authz')) {
		return isOIDC ? ['code', 'code id_token'] : ['code'];
	}

	// Implicit Flow
	if (normalized.includes('implicit')) {
		return isOIDC ? ['id_token', 'token id_token'] : ['token'];
	}

	// Hybrid Flow (OIDC only)
	if (normalized.includes('hybrid')) {
		return [
			'code',
			'id_token',
			'token id_token',
			'code id_token',
			'code token',
			'code token id_token',
		];
	}

	// Default
	return ['code'];
}

/**
 * Check if a field should be visible
 * @param flowType - The flow identifier
 * @param fieldName - Name of the field
 * @param isOIDC - Whether this is an OIDC flow variant
 * @returns true if field should be visible
 */
export function isFieldVisible(
	flowType: string,
	fieldName: keyof FlowFieldRules,
	isOIDC: boolean
): boolean {
	const rules = getFieldRules(flowType, isOIDC);
	return rules[fieldName].visible;
}

// Export as default service object
export const fieldRulesService = {
	getFieldRules,
	getValidResponseTypes,
	isFieldVisible,
	isMockFlow: detectMockFlow,
};

export default fieldRulesService;
