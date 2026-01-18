/**
 * @file tooltipContentServiceV8.ts
 * @module v8/services
 * @description Centralized tooltip content for UI guidance
 * @version 8.0.0
 * @since 2024-11-16
 */

export interface TooltipContent {
	title: string;
	content: string;
}

export class TooltipContentServiceV8 {
	static readonly CLIENT_TYPE: TooltipContent = {
		title: 'Client Type',
		content: `Determines how your application authenticates with the OAuth server.

Public Client: Cannot securely store a client secret. Examples: Single Page Apps, Mobile Apps, Desktop Apps, CLI tools. Requires PKCE for security.

Confidential Client: Can securely store a client secret. Examples: Backend servers, microservices, APIs. Can use all authentication methods.

Why it matters: This is the most fundamental decision. It determines whether your app can use a client secret and which authentication methods are available.`,
	};

	static readonly APPLICATION_TYPE: TooltipContent = {
		title: 'Application Type',
		content: `Describes what kind of application you're building. This helps us recommend the right OAuth flow and security settings.

Web Application: Server-side web app. Recommended: Authorization Code Flow. Client Type: Confidential.

Single Page Application (SPA): Browser-based JavaScript app. Recommended: Authorization Code Flow + PKCE. Client Type: Public.

Mobile Application: iOS or Android app. Recommended: Authorization Code Flow + PKCE. Client Type: Public.

Desktop Application: Windows, macOS, or Linux app. Recommended: Authorization Code Flow + PKCE. Client Type: Public.

Command Line Interface (CLI): Command-line tool or script. Recommended: Device Code Flow or Authorization Code Flow + PKCE. Client Type: Public.

Machine-to-Machine (M2M): Service-to-service communication. Recommended: Client Credentials Flow. Client Type: Confidential.

Backend Service: Microservice or backend API. Recommended: Client Credentials Flow. Client Type: Confidential.

Why it matters: Different application types have different security requirements and use different OAuth flows.`,
	};

	static readonly ENVIRONMENT: TooltipContent = {
		title: 'Environment',
		content: `Specifies where your application will run. This determines security requirements and validation rules.

Development (localhost): Running on your local machine. HTTPS: Not required. PKCE: Optional. Allows: http://localhost:*

Staging (https required): Pre-production environment. HTTPS: Required. PKCE: Recommended. Allows: https:// only.

Production (maximum security): Live production environment. HTTPS: Required. PKCE: Required. Allows: https:// only.

Why it matters: Production environments need maximum security. Development environments need flexibility for testing.`,
	};

	static readonly SPECIFICATION: TooltipContent = {
		title: 'Specification',
		content: `Selects which OAuth/OIDC specification version to use.

OAuth 2.0: Standard OAuth 2.0 (RFC 6749). Supports: Authorization Code, Implicit, Client Credentials, ROPC, Device Code. PKCE: Optional. HTTPS: Not required.

OAuth 2.1: Modern OAuth 2.0 with security best practices. Supports: Authorization Code (PKCE required), Client Credentials, Device Code. PKCE: Required. HTTPS: Required. Deprecated: Implicit, ROPC.

OpenID Connect: Authentication layer on top of OAuth 2.0. Supports: Authorization Code, Implicit, Hybrid, Device Code. Adds: ID Token, UserInfo endpoint.

Why it matters: Different specifications have different security levels and features. OAuth 2.1 is more secure but less flexible. OIDC adds authentication on top of OAuth 2.0.`,
	};

	static readonly TOKEN_ENDPOINT_AUTH: TooltipContent = {
		title: 'Token Endpoint Authentication',
		content: `Determines how your application authenticates when exchanging an authorization code for tokens.

None (Public Client): No authentication. For public clients only (SPA, Mobile, Desktop, CLI).

Client Secret (Basic or Post): Simple secret-based authentication. Most common. Choose between HTTP Basic Auth or form body parameter.

Mutual TLS (mTLS): Certificate-based authentication. High security. Production recommended.

JWT Assertion: Advanced JWT-based authentication. For advanced use cases. Can use Client Secret JWT or Private Key JWT.

Why it matters: This is critical for security. Public clients cannot use client secrets. Confidential clients should use the strongest method available.`,
	};

	static readonly SCOPES: TooltipContent = {
		title: 'Scopes - Requested Permissions',
		content: `Space-separated list of permissions your app is requesting.

OpenID Connect Scopes:
Standard OpenID Connect scopes control which user claims are included in an id_token or in a /userinfo response.

• openid - REQUIRED for OIDC. You must include 'openid' in your requested scopes if you want to use the access token to call the /userinfo endpoint and get a 'sub' attribute in the response. Also required to receive an ID token.

• profile - User's profile info (name, picture, etc.). Adds more user claims to id_token and userinfo response.

• email - User's email address. Adds email claim to id_token and userinfo response.

• address - User's postal address. Adds address claim to id_token and userinfo response.

• phone - User's phone number. Adds phone claim to id_token and userinfo response.

• offline_access - Request a refresh token for long-lived sessions.

You can include additional OpenID Connect scopes in the scope parameter to add more user claims in the id_token and return more information about the user in the /userinfo response.

Custom API scopes:
• api:read - Read access to your API
• api:write - Write access to your API
• admin - Administrative access

Important:
• Scopes must be enabled in your PingOne application
• Users will see these in the consent screen
• Request only what you need (principle of least privilege)`,
	};

	static readonly POST_LOGOUT_REDIRECT_URI: TooltipContent = {
		title: 'Post-Logout Redirect URI - MUST Match PingOne!',
		content: `⚠️ CRITICAL: This must EXACTLY match a logout URI in your PingOne application.

What it is: The URL where users are sent after logging out (OIDC only).

Common mistakes:
• Forgetting to add this to PingOne's logout URIs list
• Using a redirect URI instead of a logout URI
• Trailing slash or protocol mismatches

Solutions:
✓ Add this URI to your PingOne app's "Sign Off URLs" section
✓ Use wildcards for flexibility: https://localhost:3000/.*
✓ This is optional but recommended for good UX

Note: This is different from the redirect URI - it's specifically for logout.`,
	};

	static readonly REDIRECT_URI: TooltipContent = {
		title: 'Redirect URI - MUST Match PingOne Exactly!',
		content: `⚠️ CRITICAL: This must EXACTLY match a URI registered in your PingOne application.

What it is: The URL where users are sent after authentication completes.

Common mistakes:
• Trailing slash mismatch: https://app.com/callback vs https://app.com/callback/
• Protocol mismatch: http vs https
• Port mismatch: :3000 vs :8080
• Path mismatch: /callback vs /auth/callback

Solutions:
✓ Copy the exact URI from this field into PingOne
✓ Use wildcards in PingOne for flexibility: https://localhost:3000/.*
✓ Each flow type uses a different callback path to prevent conflicts

Security:
• HTTPS required in production
• HTTP allowed for localhost only
• Must be registered before use`,
	};

	static readonly PKCE: TooltipContent = {
		title: 'PKCE (Proof Key for Code Exchange)',
		content: `PKCE adds an extra layer of security for public clients by using a dynamically generated code verifier.

S256 (SHA-256): Recommended. Uses SHA-256 hashing. More secure.

plain: Not recommended. Sends code verifier in plain text. Less secure.

Why it matters: PKCE prevents authorization code interception attacks. Required for OAuth 2.1. Recommended for all public clients.`,
	};

	static readonly REFRESH_TOKEN: TooltipContent = {
		title: 'Refresh Token',
		content: `Allows your application to get new access tokens without requiring the user to log in again.

When enabled: Users can stay logged in longer. Your app can refresh tokens in the background.

When disabled: Users must log in again when their access token expires.

Why it matters: Improves user experience by reducing login frequency. But increases security risk if tokens are compromised. Balance convenience with security.`,
	};

	static readonly GRANT_TYPES: TooltipContent = {
		title: 'Grant Types',
		content: `Grant types define how your application obtains access tokens.

Authorization Code: User logs in and grants permission. Most common and secure.

Implicit: Deprecated. Access token returned directly. Not recommended.

Client Credentials: No user involved. Service-to-service authentication.

Refresh Token: Exchange refresh token for new access token.

Device Code: For devices without browsers (CLI, IoT).

JWT Bearer: Direct token request using JWT assertion.

Why it matters: Different grant types are appropriate for different scenarios. Choose the right one for your use case.`,
	};

	static readonly CORS: TooltipContent = {
		title: 'CORS Configuration',
		content: `CORS (Cross-Origin Resource Sharing) controls which origins can access your API.

Allowed Origins: List of domains that can make requests to your API.

Allow Credentials: Whether to allow cookies and credentials in cross-origin requests.

Allowed Methods: Which HTTP methods (GET, POST, PUT, DELETE, PATCH) are allowed.

Why it matters: Incorrect CORS configuration can expose your API to unauthorized access or break legitimate requests.`,
	};

	static readonly CONSENT_FLOW: TooltipContent = {
		title: 'Consent Flow',
		content: `Determines when users are asked to approve access to their data.

Explicit Consent (Every time): User approves every request. Most secure. Worst UX.

Implicit Consent (First time only): User approves once. Better UX. Less secure.

No Consent (Pre-approved): No user approval needed. Best UX. Least secure.

Why it matters: Balance between security and user experience. Different applications have different requirements.`,
	};

	static getTooltip(key: string): TooltipContent | null {
		const tooltips: Record<string, TooltipContent> = {
			'client-type': TooltipContentServiceV8.CLIENT_TYPE,
			'application-type': TooltipContentServiceV8.APPLICATION_TYPE,
			environment: TooltipContentServiceV8.ENVIRONMENT,
			specification: TooltipContentServiceV8.SPECIFICATION,
			'token-endpoint-auth': TooltipContentServiceV8.TOKEN_ENDPOINT_AUTH,
			scopes: TooltipContentServiceV8.SCOPES,
			'redirect-uri': TooltipContentServiceV8.REDIRECT_URI,
			'post-logout-redirect-uri': TooltipContentServiceV8.POST_LOGOUT_REDIRECT_URI,
			pkce: TooltipContentServiceV8.PKCE,
			'refresh-token': TooltipContentServiceV8.REFRESH_TOKEN,
			'grant-types': TooltipContentServiceV8.GRANT_TYPES,
			cors: TooltipContentServiceV8.CORS,
			'consent-flow': TooltipContentServiceV8.CONSENT_FLOW,
		};

		return tooltips[key] || null;
	}
}

export default TooltipContentServiceV8;
