// src/components/LiveRFCExplorer.tsx
/**
 * Live RFC Explorer
 * Interactive OAuth/OIDC specification browser with real examples
 */

import React, { useCallback, useState } from 'react';
import {
	FiBook,
	FiCheckCircle,
	FiCode,
	FiCompass,
	FiCopy,
	FiExternalLink,
	FiGitBranch,
	FiLayers,
	FiSearch,
	FiTool,
} from '@icons';
import styled from 'styled-components';
import { v4ToastManager } from '../utils/v4ToastMessages';

const ExplorerContainer = styled.div`
	background: linear-gradient(135deg, #e0f2fe 0%, #bfdbfe 100%);
	border-radius: 1rem;
	padding: 2rem;
	margin: 2rem 0;
	border: 3px solid #2563eb;
	box-shadow: 0 8px 24px rgba(37, 99, 235, 0.2);
`;

const Title = styled.h2`
	color: #1e3a8a;
	margin: 0 0 0.5rem 0;
	display: flex;
	align-items: center;
	gap: 0.75rem;
	font-size: 1.75rem;
`;

const Subtitle = styled.p`
	color: #1d4ed8;
	margin: 0 0 2rem 0;
	font-size: 1.05rem;
	line-height: 1.6;
`;

const ToggleRow = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;
	margin-bottom: 1.5rem;
	flex-wrap: wrap;
`;

const DeepDiveToggle = styled.button<{ $active: boolean }>`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1.25rem;
	border-radius: 999px;
	border: 2px solid ${({ $active }) => ($active ? '#1d4ed8' : '#bfdbfe')};
	background: ${({ $active }) =>
		$active
			? 'linear-gradient(135deg, rgba(29, 78, 216, 0.15), rgba(37, 99, 235, 0.15))'
			: '#ffffff'};
	color: #1e3a8a;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s;
	box-shadow: ${({ $active }) =>
		$active ? '0 8px 20px rgba(29, 78, 216, 0.25)' : '0 2px 6px rgba(15, 23, 42, 0.08)'};

	&:hover {
		transform: translateY(-2px);
	}
`;

const SearchBox = styled.div`
	position: relative;
	flex: 1;
`;

const SearchInput = styled.input`
	width: 100%;
	padding: 1rem 3rem 1rem 3rem;
	border-radius: 0.75rem;
	border: 2px solid #c4b5fd;
	background: white;
	font-size: 1rem;
	transition: all 0.2s;

	&:focus {
		outline: none;
		border-color: #2563eb;
		box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
	}

	&::placeholder {
		color: #3b82f6;
	}
`;

const SearchIcon = styled.div`
	position: absolute;
	left: 1rem;
	top: 50%;
	transform: translateY(-50%);
	color: #2563eb;
`;

const RFCGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
	gap: 1rem;
	margin-bottom: 2rem;
`;

const RFCCard = styled.button<{ $selected: boolean }>`
	background: white;
	border: 2px solid ${({ $selected }) => ($selected ? '#2563eb' : '#e5e7eb')};
	border-radius: 0.75rem;
	padding: 1.25rem;
	cursor: pointer;
	transition: all 0.2s;
	text-align: left;
	box-shadow: ${({ $selected }) =>
		$selected ? '0 6px 20px rgba(37, 99, 235, 0.3)' : '0 2px 6px rgba(0, 0, 0, 0.08)'};

	&:hover {
		transform: translateY(-3px);
		border-color: #2563eb;
		box-shadow: 0 6px 20px rgba(37, 99, 235, 0.3);
	}
`;

const RFCNumber = styled.div`
	font-weight: 700;
	color: #2563eb;
	font-size: 0.875rem;
	margin-bottom: 0.5rem;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const RFCTitle = styled.div`
	color: #1e293b;
	font-weight: 600;
	font-size: 1rem;
	margin-bottom: 0.5rem;
	line-height: 1.4;
`;

const RFCDescription = styled.div`
	color: #64748b;
	font-size: 0.875rem;
	line-height: 1.5;
`;

const ContentPanel = styled.div`
	background: white;
	border-radius: 0.75rem;
	padding: 2rem;
	border: 2px solid #d1d5db;
`;

const SectionTitle = styled.h3`
	color: #1e3a8a;
	font-size: 1.3rem;
	font-weight: 700;
	margin: 0 0 1rem 0;
	display: flex;
	align-items: center;
	gap: 0.75rem;
`;

const RFCMeta = styled.div`
	display: flex;
	gap: 1.5rem;
	padding: 1rem;
	background: #f8fafc;
	border-radius: 0.5rem;
	margin-bottom: 2rem;
	flex-wrap: wrap;
`;

const MetaItem = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	color: #475569;
	font-size: 0.9rem;
`;

const MetaLabel = styled.span`
	font-weight: 600;
	color: #1e293b;
`;

const ContentSection = styled.div`
	margin-bottom: 2rem;

	&:last-child {
		margin-bottom: 0;
	}
`;

const SubsectionTitle = styled.h4`
	color: #1e293b;
	font-size: 1.1rem;
	font-weight: 700;
	margin: 0 0 0.75rem 0;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const ContentText = styled.div`
	color: #475569;
	line-height: 1.7;
	font-size: 0.95rem;
	margin-bottom: 1rem;
`;

const ExampleBox = styled.div`
	background: #1e293b;
	color: #f1f5f9;
	padding: 1.5rem;
	border-radius: 0.75rem;
	font-family: 'Monaco', 'Menlo', monospace;
	font-size: 0.875rem;
	line-height: 1.6;
	position: relative;
	margin-bottom: 1rem;
	overflow-x: auto;
`;

const CopyButton = styled.button`
	position: absolute;
	top: 0.75rem;
	right: 0.75rem;
	padding: 0.5rem 0.75rem;
	background: #2563eb;
	color: white;
	border: none;
	border-radius: 0.5rem;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-weight: 600;
	font-size: 0.75rem;
	transition: all 0.2s;

	&:hover {
		background: #1d4ed8;
	}
`;

const TipBox = styled.div<{ variant: 'info' | 'warning' | 'success' }>`
	padding: 1rem;
	border-radius: 0.5rem;
	border-left: 4px solid ${({ variant }) => {
		switch (variant) {
			case 'info':
				return '#3b82f6';
			case 'warning':
				return '#f59e0b';
			case 'success':
				return '#10b981';
		}
	}};
	background: ${({ variant }) => {
		switch (variant) {
			case 'info':
				return '#dbeafe';
			case 'warning':
				return '#fef3c7';
			case 'success':
				return '#d1fae5';
		}
	}};
	color: ${({ variant }) => {
		switch (variant) {
			case 'info':
				return '#1e40af';
			case 'warning':
				return '#92400e';
			case 'success':
				return '#065f46';
		}
	}};
	line-height: 1.6;
	margin-bottom: 1rem;
`;

const LinkButton = styled.a`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1.5rem;
	background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
	color: white;
	text-decoration: none;
	border-radius: 0.5rem;
	font-weight: 600;
	transition: all 0.2s;
	margin-top: 1rem;

	&:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 16px rgba(37, 99, 235, 0.3);
	}
`;

const InsightList = styled.ul`
	margin: 0;
	padding-left: 1.25rem;
	display: flex;
	flex-direction: column;
	gap: 0.35rem;
	color: #1f2937;
`;

const CalloutCard = styled.div`
	background: rgba(37, 99, 235, 0.12);
	border-radius: 0.5rem;
	padding: 1rem;
	border: 1px solid #93c5fd;
	color: #1e3a8a;
	margin-bottom: 1rem;
	line-height: 1.6;
`;

const ToolLinkList = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
	gap: 1rem;
`;

const ToolLinkCard = styled.a`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	background: #ffffff;
	border: 1px solid #bfdbfe;
	border-radius: 0.75rem;
	padding: 1rem 1.25rem;
	text-decoration: none;
	color: #1f2937;
	box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
	transition: transform 0.2s, box-shadow 0.2s;

	&:hover {
		transform: translateY(-3px);
		box-shadow: 0 10px 24px rgba(37, 99, 235, 0.2);
	}
`;

const ToolLinkTitle = styled.div`
	font-weight: 700;
	color: #1d4ed8;
`;

const ToolLinkDescription = styled.div`
	color: #475569;
	line-height: 1.5;
	font-size: 0.9rem;
`;

interface RFCSpec {
	id: string;
	number: string;
	title: string;
	description: string;
	status: string;
	year: string;
	summary: string;
	keyPoints: string[];
	examples: Array<{
		title: string;
		code: string;
	}>;
	pingoneSupport: string;
	url: string;
	deepDiveInsights: string[];
	pingoneCallouts: string[];
	relatedTools: Array<{
		name: string;
		description: string;
		route: string;
	}>;
}

const RFC_SPECS: RFCSpec[] = [
	{
		id: 'rfc6749',
		number: 'RFC 6749',
		title: 'OAuth 2.0 Authorization Framework',
		description: 'The foundational OAuth 2.0 spec defining authorization flows',
		status: 'Standard',
		year: '2012',
		summary:
			'RFC 6749 is THE OAuth 2.0 specification. It defines how applications can obtain limited access to user accounts on an HTTP service. Instead of sharing passwords, OAuth uses access tokens to grant access.',
		keyPoints: [
			'🔑 Defines 4 grant types: Authorization Code, Implicit, Client Credentials, Resource Owner Password',
			'🎯 Separates resource owner, client, authorization server, and resource server roles',
			'🔒 Access tokens provide limited, time-bound access without exposing passwords',
			'♻️ Refresh tokens enable long-lived access without re-authentication',
			'⚠️ Deprecated: Implicit flow is now considered insecure for SPAs (use Authorization Code + PKCE)',
		],
		examples: [
			{
				title: 'Authorization Code Flow (Most Common)',
				code: `// Step 1: Redirect user to authorization endpoint
const authUrl = \`https://auth.pingone.com/\${envId}/as/authorize?\` +
  new URLSearchParams({
    client_id: 'YOUR_CLIENT_ID',
    response_type: 'code',           // Request authorization code
    redirect_uri: 'https://app.com/callback',
    scope: 'openid profile email',
    state: 'RANDOM_STATE_TOKEN',     // CSRF protection
  });

window.location.href = authUrl;

// Step 2: Exchange code for tokens
const tokenResponse = await fetch(
  \`https://auth.pingone.com/\${envId}/as/token\`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: authorizationCode,       // From callback
      redirect_uri: 'https://app.com/callback',
      client_id: 'YOUR_CLIENT_ID',
      client_secret: 'YOUR_SECRET',  // Server-side only!
    }),
  }
);

const tokens = await tokenResponse.json();
// { access_token, refresh_token, expires_in, token_type }`,
			},
			{
				title: 'Client Credentials Flow (Machine-to-Machine)',
				code: `// Server-to-server authentication (no user involved)
const tokenResponse = await fetch(
  \`https://auth.pingone.com/\${envId}/as/token\`,
  {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + btoa(clientId + ':' + clientSecret),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'api:read api:write',
    }),
  }
);

const tokens = await tokenResponse.json();
// { access_token, expires_in, token_type, scope }

// Use access token for API calls
const apiResponse = await fetch('https://api.example.com/data', {
  headers: {
    'Authorization': \`Bearer \${tokens.access_token}\`,
  },
});`,
			},
		],
		pingoneSupport:
			'✅ PingOne fully supports RFC 6749. Authorization Code and Client Credentials are recommended. Implicit and Password flows are deprecated.',
		url: 'https://datatracker.ietf.org/doc/html/rfc6749',
		deepDiveInsights: [
			'Section 10.12 highlights native app loopback URIs — pair with PKCE to mitigate code interception.',
			'Token endpoint MUST validate redirect_uri for confidential clients; PingOne enforces exact string match.',
			'Refresh tokens are optional; ensure rotation or reuse detection when issued to public clients.',
		],
		pingoneCallouts: [
			'PingOne disables Resource Owner Password grant out of the box — keep it that way.',
			'Redirect URI whitelist lives under Applications → Connections. Use dedicated URIs per environment.',
			'Enable Proof Key for Code Exchange for every public client to comply with RFC 8252.',
		],
		relatedTools: [
			{
				name: 'OAuth Detective',
				description: 'Break down authorization URLs and validate required RFC 6749 parameters.',
				route: '/flows/advanced-oauth-params-demo',
			},
			{
				name: 'Response_Mode Sandbox',
				description: 'Visualize how the authorization response is returned for each response_mode.',
				route: '/flows/advanced-oauth-params-demo',
			},
		],
	},
	{
		id: 'rfc7636',
		number: 'RFC 7636',
		title: 'PKCE (Proof Key for Code Exchange)',
		description: 'Security extension preventing authorization code interception',
		status: 'Best Current Practice',
		year: '2015',
		summary:
			'PKCE prevents authorization code interception attacks in mobile and single-page apps that cannot securely store client secrets. It uses cryptographic proof that the same client that requested the code is exchanging it.',
		keyPoints: [
			'🔒 MANDATORY for public clients (mobile apps, SPAs) - RFC 8252 requires it',
			'🎯 Prevents authorization code interception even if attacker has code',
			'💻 Works by generating code_verifier (random) and code_challenge (hashed)',
			'✅ Should also be used for confidential clients as defense-in-depth',
			'⚡ Uses SHA-256 hashing (S256 method recommended over plain)',
		],
		examples: [
			{
				title: 'PKCE Implementation',
				code: `import crypto from 'crypto';

// Step 1: Generate PKCE pair
const codeVerifier = crypto.randomBytes(32).toString('hex');

// Hash the verifier
const codeChallenge = crypto
  .createHash('sha256')
  .update(codeVerifier)
  .digest('base64url');  // Base64-URL encoding

// Store verifier securely (session, secure storage)
sessionStorage.setItem('pkce_verifier', codeVerifier);

// Step 2: Authorization request with code_challenge
const authUrl = \`https://auth.pingone.com/\${envId}/as/authorize?\` +
  new URLSearchParams({
    client_id: 'YOUR_CLIENT_ID',
    response_type: 'code',
    redirect_uri: 'https://app.com/callback',
    scope: 'openid profile',
    code_challenge: codeChallenge,        // Hashed version
    code_challenge_method: 'S256',        // SHA-256
    state: 'RANDOM_STATE',
  });

// Step 3: Token exchange with code_verifier
const tokenResponse = await fetch(tokenEndpoint, {
  method: 'POST',
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    code: authorizationCode,
    redirect_uri: 'https://app.com/callback',
    client_id: 'YOUR_CLIENT_ID',
    code_verifier: codeVerifier,          // Original unhashed value
  }),
});

// Server validates: SHA256(code_verifier) === stored code_challenge
// If attacker steals code but doesn't have verifier → REJECTED`,
			},
		],
		pingoneSupport:
			'✅ PingOne REQUIRES PKCE for public clients and strongly recommends it for all clients. Both S256 and plain methods supported.',
		url: 'https://datatracker.ietf.org/doc/html/rfc7636',
		deepDiveInsights: [
			'S256 is the only method permitted by current security BCP guidance — treat plain as legacy.',
			'Code verifier MUST be between 43 and 128 characters; random bytes + base64url ensures compliance.',
			'Store verifier server-side when using redirectless flows to prevent XSS leakage.',
		],
		pingoneCallouts: [
			'PingOne auto-validates code_challenge vs. code_verifier; failures appear in the Access logs.',
			'Redirectless auth requires you to persist the code_verifier via RedirectlessAuthService.',
			'Enable policy rule “Require PKCE” on the PingOne application to block non-compliant clients.',
		],
		relatedTools: [
			{
				name: 'Security Threat Theater',
				description: 'See code interception attacks play out when PKCE is missing.',
				route: '/flows/advanced-oauth-params-demo',
			},
			{
				name: 'Scope Impact Playground',
				description: 'Pair PKCE with least-privilege scopes tailored to your client type.',
				route: '/flows/advanced-oauth-params-demo',
			},
		],
	},
	{
		id: 'rfc8707',
		number: 'RFC 8707',
		title: 'Resource Indicators for OAuth 2.0',
		description: 'Limit access token scope to specific APIs/resources',
		status: 'Standard',
		year: '2020',
		summary:
			'Resource indicators let you request tokens scoped to specific APIs. Instead of one token for "everything," you get audience-limited tokens. If stolen, the blast radius is contained.',
		keyPoints: [
			'🎯 Limits access token to specific resource servers (APIs)',
			'🔒 Reduces blast radius if token is compromised',
			'☁️ Essential for multi-tenant SaaS platforms',
			'✅ Access token includes "aud" (audience) claim with resource URL',
			'📋 Can request multiple resources in single authorization request',
		],
		examples: [
			{
				title: 'Multi-API Token Request',
				code: `// Request access to multiple customer APIs
const params = new URLSearchParams({
  client_id: 'YOUR_CLIENT_ID',
  response_type: 'code',
  redirect_uri: 'https://app.com/callback',
  scope: 'api:read api:write',
  state: 'RANDOM_STATE',
});

// Add each resource separately (don't use array)
params.append('resource', 'https://customerA.api.com');
params.append('resource', 'https://customerB.api.com');
params.append('resource', 'https://analytics.api.com');

const authUrl = \`https://auth.pingone.com/\${envId}/as/authorize?\${params}\`;

// Resulting access token will have:
const accessToken = {
  aud: [
    'https://customerA.api.com',
    'https://customerB.api.com',
    'https://analytics.api.com',
  ],
  scope: 'api:read api:write',
  // ...
};

// Each API validates its URL is in audience
function validateTokenForAPI(token, apiUrl) {
  const payload = jwt.decode(token);
  
  if (!payload.aud.includes(apiUrl)) {
    throw new Error(\`Token not valid for \${apiUrl}\`);
  }
  
  // Token is valid for this specific API
}

// If token is stolen, it ONLY works for these 3 APIs
// Cannot be used for other customer APIs`,
			},
		],
		pingoneSupport:
			'✅ PingOne supports resource indicators. Use for multi-tenant apps or microservices architectures.',
		url: 'https://datatracker.ietf.org/doc/html/rfc8707',
		deepDiveInsights: [
			'Multiple resource parameters are appended individually — arrays are NOT allowed.',
			'Access tokens may include multiple audience claims; APIs must enforce the relevant audience.',
			'Combine with Pushed Authorization Requests to prevent tampering with resource list.',
		],
		pingoneCallouts: [
			'PingOne currently supports single resource per request; use multiple authorization requests for fan-out.',
			'Map each resource to an API service in PingOne so introspection reflects correct audience.',
			'Leverage RAR (RFC 9396) for fine-grained payloads layered on top of resource indicators.',
		],
		relatedTools: [
			{
				name: 'Scope Impact Playground',
				description: 'Design scope bundles that align with specific resource APIs.',
				route: '/flows/advanced-oauth-params-demo',
			},
			{
				name: 'Parameter Impact Visualizer',
				description: 'Model how resource indicators reshape downstream token claims.',
				route: '/flows/advanced-oauth-params-demo',
			},
		],
	},
	{
		id: 'openid-connect',
		number: 'OpenID Connect 1.0',
		title: 'OpenID Connect Core',
		description: 'Identity layer on top of OAuth 2.0',
		status: 'Standard',
		year: '2014',
		summary:
			'OpenID Connect (OIDC) extends OAuth 2.0 with identity. While OAuth answers "Can I access this API?", OIDC answers "Who is this user?". It adds ID tokens (JWT) with user identity claims.',
		keyPoints: [
			'👤 Adds authentication (user identity) to OAuth 2.0 authorization',
			'🎫 Introduces ID Token (JWT) containing user profile claims',
			'🔍 Provides UserInfo endpoint for additional user data',
			'✅ Requires "openid" scope to activate OIDC features',
			'🔒 ID tokens are signed JWTs - validate signature before trusting',
		],
		examples: [
			{
				title: 'OIDC Authentication Flow',
				code: `// Request authentication with OIDC
const authUrl = \`https://auth.pingone.com/\${envId}/as/authorize?\` +
  new URLSearchParams({
    client_id: 'YOUR_CLIENT_ID',
    response_type: 'code',
    redirect_uri: 'https://app.com/callback',
    scope: 'openid profile email',  // 'openid' activates OIDC
    state: 'RANDOM_STATE',
    nonce: 'RANDOM_NONCE',          // Required for ID token replay protection
  });

// Token response includes ID token
const tokens = await exchangeCodeForTokens(code);
// {
//   access_token: '...',
//   id_token: 'eyJhbGc...',    // JWT with user identity
//   refresh_token: '...',
// }

// Decode and validate ID token
const idToken = jwt.verify(tokens.id_token, publicKey);
console.log('User ID:', idToken.sub);
console.log('Name:', idToken.name);
console.log('Email:', idToken.email);
console.log('Email Verified:', idToken.email_verified);

// ID Token structure:
{
  iss: 'https://auth.pingone.com/YOUR_ENV_ID',  // Issuer
  sub: 'user-uuid-here',                         // Subject (user ID)
  aud: 'YOUR_CLIENT_ID',                         // Audience
  exp: 1640995200,                               // Expiration
  iat: 1640991600,                               // Issued at
  auth_time: 1640991600,                         // When user authenticated
  nonce: 'RANDOM_NONCE',                         // From request
  name: 'John Doe',
  email: 'john@example.com',
  email_verified: true,
}`,
			},
			{
				title: 'UserInfo Endpoint',
				code: `// Get additional user claims with access token
const userInfoResponse = await fetch(
  \`https://auth.pingone.com/\${envId}/as/userinfo\`,
  {
    headers: {
      'Authorization': \`Bearer \${accessToken}\`,
    },
  }
);

const userInfo = await userInfoResponse.json();
// {
//   sub: 'user-uuid',
//   name: 'John Doe',
//   given_name: 'John',
//   family_name: 'Doe',
//   email: 'john@example.com',
//   email_verified: true,
//   picture: 'https://...',
//   updated_at: 1640991600,
// }

// Use for profile pages, personalization, etc.`,
			},
		],
		pingoneSupport:
			'✅ PingOne is OpenID Certified. Fully supports OIDC Core, Discovery, and Dynamic Registration.',
		url: 'https://openid.net/specs/openid-connect-core-1_0.html',
		deepDiveInsights: [
			'nonce claim is mandatory for implicit/hybrid — treat it as replay defense alongside PKCE.',
			'Use acr_values and max_age to demand step-up per business process.',
			'UserInfo may be cached briefly, but profile changes rely on updated ID tokens or SCIM.',
		],
		pingoneCallouts: [
			'PingOne discovery document advertises JWKS; rotate signing keys via console → Certificates.',
			'Device Authorization and Redirectless flows still issue full OIDC-compatible ID tokens.',
			'Enable advanced claims mapping to add PingOne custom attributes into ID token.',
		],
		relatedTools: [
			{
				name: 'Advanced OAuth Parameters Demo',
				description:
					'Experiment with acr_values, max_age, and claims requests before hitting production.',
				route: '/flows/advanced-oauth-params-demo',
			},
			{
				name: 'Policy Wizard',
				description: 'Generate PingOne policies tying MFA and claim release to OIDC requirements.',
				route: '/flows/advanced-oauth-params-demo',
			},
		],
	},
	{
		id: 'rfc8628',
		number: 'RFC 8628',
		title: 'OAuth 2.0 Device Authorization Grant',
		description: 'OAuth for devices without browsers (Smart TVs, IoT)',
		status: 'Standard',
		year: '2019',
		summary:
			'Device Flow enables OAuth on input-constrained devices like Smart TVs, game consoles, and IoT sensors. User authenticates on their phone/computer while the device polls for completion.',
		keyPoints: [
			'📺 Designed for devices without browsers or limited input (Smart TVs, CLI tools)',
			'📱 User authenticates on secondary device (phone/computer)',
			'🔄 Device polls token endpoint until user completes authorization',
			'⏱️ Includes rate limiting to prevent excessive polling',
			'🎯 Perfect for IoT, Smart TVs, streaming devices, developer CLIs',
		],
		examples: [
			{
				title: 'Device Flow Implementation',
				code: `// Step 1: Request device code
const deviceResponse = await fetch(
  \`https://auth.pingone.com/\${envId}/as/device_authorization\`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: 'YOUR_CLIENT_ID',
      scope: 'openid profile device:control',
    }),
  }
);

const deviceData = await deviceResponse.json();
// {
//   device_code: 'GmRhmhcxhwAzkoEqiMEg_DnyEysNkuNhszIySk9eS',
//   user_code: 'WDJB-MJHT',              // Show this to user
//   verification_uri: 'https://auth.pingone.com/activate',
//   verification_uri_complete: 'https://auth.pingone.com/activate?user_code=WDJB-MJHT',
//   expires_in: 1800,                    // 30 minutes
//   interval: 5,                         // Poll every 5 seconds
// }

// Step 2: Display to user
console.log(\`\\n📺 To activate this device:\`);
console.log(\`   1. Visit: \${deviceData.verification_uri}\`);
console.log(\`   2. Enter code: \${deviceData.user_code}\\n\`);

// OR show QR code with verification_uri_complete

// Step 3: Poll for tokens
const interval = deviceData.interval * 1000;
const maxTime = deviceData.expires_in * 1000;
const startTime = Date.now();

while (Date.now() - startTime < maxTime) {
  await new Promise(resolve => setTimeout(resolve, interval));
  
  const tokenResponse = await fetch(
    \`https://auth.pingone.com/\${envId}/as/token\`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
        device_code: deviceData.device_code,
        client_id: 'YOUR_CLIENT_ID',
      }),
    }
  );
  
  const result = await tokenResponse.json();
  
  if (result.error === 'authorization_pending') {
    // Still waiting for user
    console.log('Waiting...');
    continue;
  } else if (result.error === 'slow_down') {
    // Polling too fast, increase interval
    interval += 5000;
    continue;
  } else if (result.error) {
    throw new Error(result.error);
  } else {
    // Success!
    console.log('✅ Device authorized!');
    return result;
  }
}

throw new Error('Device code expired');`,
			},
		],
		pingoneSupport:
			'✅ PingOne fully supports Device Flow. Perfect for Smart TVs, game consoles, and developer CLIs.',
		url: 'https://datatracker.ietf.org/doc/html/rfc8628',
		deepDiveInsights: [
			'Polling interval should back off when receiving slow_down errors — exponential backoff recommended.',
			'Device codes expire quickly; design UI to refresh instructions without confusing the user.',
			'Pair with PKCE if devices eventually exchange via browser-based callback.',
		],
		pingoneCallouts: [
			'PingOne exposes /device_authorization endpoint; enable in application connection settings.',
			'Customize verification URI copy in PingOne branding to match your device instructions.',
			'Throttle polling with the interval supplied by PingOne (default 5 seconds).',
		],
		relatedTools: [
			{
				name: 'Security Threat Theater',
				description: 'Season 2 covers device code abuse and how polling controls mitigate it.',
				route: '/flows/advanced-oauth-params-demo',
			},
			{
				name: 'Policy Wizard',
				description: 'Plan device MFA and risk policies tailored to shared devices.',
				route: '/flows/advanced-oauth-params-demo',
			},
		],
	},
];

const LiveRFCExplorer: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedRFC, setSelectedRFC] = useState<string | null>(null);
	const [deepDive, setDeepDive] = useState(false);

	const filteredRFCs = RFC_SPECS.filter(
		(rfc) =>
			rfc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
			rfc.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
			rfc.description.toLowerCase().includes(searchTerm.toLowerCase())
	);

	const rfc = RFC_SPECS.find((r) => r.id === selectedRFC);

	const copyCode = useCallback((code: string) => {
		navigator.clipboard.writeText(code);
		v4ToastManager.showSuccess('Code copied!');
	}, []);

	return (
		<ExplorerContainer>
			<Title>
				<FiBook size={32} />
				Live RFC Explorer
			</Title>
			<Subtitle>
				📚 OAuth/OIDC specifications decoded. Real examples, plain English, PingOne compatibility
				notes.
			</Subtitle>

			<ToggleRow>
				<SearchBox>
					<SearchIcon>
						<FiSearch size={20} />
					</SearchIcon>
					<SearchInput
						type="text"
						placeholder="Search OAuth specs... (e.g., PKCE, Device Flow, OIDC)"
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>
				</SearchBox>
				<DeepDiveToggle
					type="button"
					$active={deepDive}
					onClick={() => setDeepDive((prev) => !prev)}
					aria-pressed={deepDive}
				>
					<FiLayers />
					{deepDive ? 'Deep Dive Mode: ON' : 'Enable Deep Dive Mode'}
				</DeepDiveToggle>
			</ToggleRow>

			<RFCGrid>
				{filteredRFCs.map((spec) => (
					<RFCCard
						key={spec.id}
						$selected={selectedRFC === spec.id}
						onClick={() => setSelectedRFC(spec.id)}
					>
						<RFCNumber>
							<FiGitBranch />
							{spec.number}
						</RFCNumber>
						<RFCTitle>{spec.title}</RFCTitle>
						<RFCDescription>{spec.description}</RFCDescription>
					</RFCCard>
				))}
			</RFCGrid>

			{rfc && (
				<ContentPanel>
					<SectionTitle>
						<FiBook />
						{rfc.number}: {rfc.title}
					</SectionTitle>

					<RFCMeta>
						<MetaItem>
							<MetaLabel>Status:</MetaLabel>
							{rfc.status}
						</MetaItem>
						<MetaItem>
							<MetaLabel>Year:</MetaLabel>
							{rfc.year}
						</MetaItem>
						<MetaItem>
							<FiExternalLink size={14} />
							<LinkButton href={rfc.url} target="_blank" rel="noopener noreferrer">
								View Official Spec
								<FiExternalLink />
							</LinkButton>
						</MetaItem>
					</RFCMeta>

					<ContentSection>
						<SubsectionTitle>📖 What Is It?</SubsectionTitle>
						<ContentText>{rfc.summary}</ContentText>
					</ContentSection>

					<ContentSection>
						<SubsectionTitle>🎯 Key Points</SubsectionTitle>
						{rfc.keyPoints.map((point, index) => (
							<ContentText key={index}>• {point}</ContentText>
						))}
					</ContentSection>

					<ContentSection>
						<SubsectionTitle>
							<FiCode />
							Real Code Examples
						</SubsectionTitle>
						{rfc.examples.map((example, index) => (
							<div key={index}>
								<ContentText style={{ fontWeight: 600, color: '#1e293b' }}>
									{example.title}
								</ContentText>
								<ExampleBox>
									<CopyButton onClick={() => copyCode(example.code)}>
										<FiCopy size={12} />
										Copy
									</CopyButton>
									<pre style={{ margin: 0 }}>{example.code}</pre>
								</ExampleBox>
							</div>
						))}
					</ContentSection>

					<ContentSection>
						<SubsectionTitle>
							<FiCheckCircle />
							PingOne Support
						</SubsectionTitle>
						<TipBox variant="success">{rfc.pingoneSupport}</TipBox>
					</ContentSection>

					{deepDive && (
						<>
							<ContentSection>
								<SubsectionTitle>
									<FiLayers />
									Deep Dive Insights
								</SubsectionTitle>
								<InsightList>
									{rfc.deepDiveInsights.map((insight) => (
										<li key={insight}>{insight}</li>
									))}
								</InsightList>
							</ContentSection>

							<ContentSection>
								<SubsectionTitle>
									<FiCompass />
									PingOne Implementation Notes
								</SubsectionTitle>
								{rfc.pingoneCallouts.map((callout) => (
									<CalloutCard key={callout}>{callout}</CalloutCard>
								))}
							</ContentSection>

							<ContentSection>
								<SubsectionTitle>
									<FiTool />
									Practice With These Playground Tools
								</SubsectionTitle>
								<ToolLinkList>
									{rfc.relatedTools.map((tool) => (
										<ToolLinkCard key={tool.name} href={tool.route}>
											<ToolLinkTitle>{tool.name}</ToolLinkTitle>
											<ToolLinkDescription>{tool.description}</ToolLinkDescription>
										</ToolLinkCard>
									))}
								</ToolLinkList>
							</ContentSection>
						</>
					)}
				</ContentPanel>
			)}

			{!rfc && (
				<div
					style={{
						textAlign: 'center',
						padding: '3rem',
						color: '#1d4ed8',
						fontSize: '1.1rem',
					}}
				>
					👆 Select a specification above to explore OAuth/OIDC standards with real examples
				</div>
			)}
		</ExplorerContainer>
	);
};

export default LiveRFCExplorer;
