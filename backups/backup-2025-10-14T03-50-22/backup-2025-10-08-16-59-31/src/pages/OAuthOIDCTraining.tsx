// src/pages/OAuthOIDCTraining.tsx
// ⭐ V6 UPGRADE - OAuth 2.0 & OIDC Training Component with V6 Services

import {
	AlertCircle,
	BookOpen,
	CheckCircle,
	Key,
	Lock,
	RefreshCw,
	Search,
	Shield,
	Users,
	XCircle,
} from 'lucide-react';
import React, { useState } from 'react';
import { CollapsibleHeader } from '../services/collapsibleHeaderService';
import PageLayoutService from '../services/pageLayoutService';

// Reusable service/data that can be imported elsewhere
export const OAuthOIDCData = {
	comparisonTable: [
		{
			feature: 'Primary Purpose',
			oauth: 'Authorization (granting access to resources)',
			oidc: 'Authentication (verifying user identity) + Authorization',
		},
		{
			feature: 'Built On',
			oauth: 'Standalone protocol',
			oidc: 'Extension built on top of OAuth 2.0',
		},
		{
			feature: 'User Information',
			oauth: 'No standardized way to get user info',
			oidc: 'Provides standardized user profile via ID Token',
		},
		{
			feature: 'Token Types',
			oauth: 'Access Token, Refresh Token',
			oidc: 'Access Token, Refresh Token, ID Token (JWT)',
		},
		{
			feature: 'Identity Verification',
			oauth: 'Not directly supported',
			oidc: "Core feature - verifies 'who you are'",
		},
		{
			feature: 'Use Cases',
			oauth: 'API access, delegated authorization',
			oidc: 'Single Sign-On (SSO), social login, user authentication',
		},
		{
			feature: 'User Profile Data',
			oauth: 'Must use proprietary APIs',
			oidc: 'Standardized UserInfo endpoint',
		},
		{
			feature: 'ID Token',
			oauth: { supported: false, text: 'Not included' },
			oidc: { supported: true, text: 'JWT with user claims (sub, email, name, etc.)' },
		},
		{
			feature: 'Discovery',
			oauth: 'No standard',
			oidc: 'Has discovery endpoint (/.well-known/openid-configuration)',
		},
		{
			feature: 'Scopes',
			oauth: 'Custom scopes (read, write, etc.)',
			oidc: 'Standard scopes: openid, profile, email, address, phone',
		},
		{
			feature: 'Session Management',
			oauth: 'Not defined',
			oidc: 'Includes session management specs',
		},
		{
			feature: 'Redirect URI Required',
			oauth: { supported: true, text: 'Yes - must be registered with provider' },
			oidc: { supported: true, text: 'Yes - must be registered with provider' },
		},
		{
			feature: 'Client Secret Required',
			oauth: 'Confidential clients (server): Yes | Public clients (mobile/SPA): No',
			oidc: 'Confidential clients (server): Yes | Public clients (mobile/SPA): No',
		},
		{
			feature: 'PKCE Support',
			oauth: 'Extension (RFC 7636) - Recommended for public clients',
			oidc: 'Strongly recommended - Required for public clients',
		},
		{
			feature: 'Standardization',
			oauth: 'IETF RFC 6749',
			oidc: 'OpenID Foundation (extends OAuth 2.0)',
		},
		{
			feature: 'Example Providers',
			oauth: 'Ping Identity, GitHub, Twitter API access',
			oidc: 'Ping Identity, Google, Microsoft, Auth0, Okta',
		},
		{
			feature: 'PAR (Pushed Authorization Requests)',
			oauth:
				'✅ Supported (RFC 9126) - Pushes authorization request parameters to server before redirect',
			oidc: '✅ Supported - Enhanced security for OIDC flows',
		},
		{
			feature: 'RAR (Rich Authorization Requests)',
			oauth:
				'✅ Supported (RFC 9396) - Allows fine-grained authorization with complex permission structures',
			oidc: '✅ Supported - Can be combined with OIDC authentication',
		},
	],

	trainingContent: {
		oauth: {
			title: 'OAuth 2.0 Deep Dive',
			description:
				'OAuth 2.0 is an authorization framework that enables applications to obtain limited access to user accounts on an HTTP service.',
			keyPoints: [
				'Focuses on authorization, not authentication',
				'Allows third-party applications to access user resources without sharing credentials',
				'Uses access tokens to grant permissions',
				'Does not provide user identity information by default',
			],
			oauthOnlyNote:
				'Note: Client Credentials Flow is OAuth 2.0 only - it does not apply to OIDC since there is no user authentication involved (machine-to-machine only).',
			flows: [
				{
					name: 'Authorization Code Flow',
					description: 'Most secure flow for server-side applications',
					steps: [
						"User clicks 'Login with Provider'",
						"Redirect to provider's authorization page",
						'User approves access',
						'Provider redirects back with authorization code',
						'Exchange code for access token (server-side)',
						'Use access token to call APIs',
					],
					bestFor: 'Traditional web applications with backend servers',
					security: [
						'Always exchange authorization code on the backend server, never client-side',
						'Use state parameter to prevent CSRF attacks',
						"Validate redirect_uri strictly - must match exactly what's registered",
						'Store client secret securely on server (never expose to client)',
						'Use short-lived authorization codes (typically 10 minutes or less)',
						'Implement token rotation for refresh tokens',
						'Use HTTPS for all communication',
						'Validate the state parameter on callback to ensure request integrity',
					],
				},
				{
					name: 'PKCE Flow',
					description: 'Secure flow for public clients (mobile/SPA)',
					steps: [
						'Generate code_verifier (random string)',
						'Create code_challenge (SHA256 hash of verifier)',
						'Request authorization with code_challenge',
						'Receive authorization code',
						'Exchange code + code_verifier for tokens',
						'Prevents code interception attacks',
					],
					bestFor: 'Single Page Apps, Mobile Apps, Public Clients',
					security: [
						"Always use PKCE - it's mandatory for public clients (RFC 8252)",
						'Generate cryptographically random code_verifier (43-128 characters)',
						'Use S256 method for code_challenge (SHA256), not plain',
						'Never reuse code_verifier across multiple authorization requests',
						"Don't store tokens in localStorage - use memory or sessionStorage only",
						'Implement token refresh logic with automatic rotation',
						'Use state parameter even with PKCE for additional CSRF protection',
						'For mobile apps, use secure platform storage (Keychain/Keystore)',
						'Implement proper token expiration handling and automatic refresh',
					],
				},
				{
					name: 'Client Credentials Flow (OAuth 2.0 Only)',
					description: 'Machine-to-machine authentication - NOT applicable to OIDC',
					steps: [
						'Application authenticates with client ID and secret',
						'Receives access token directly',
						'No user interaction required',
						'No ID Token issued (OAuth only, not OIDC)',
					],
					bestFor: 'Backend services, APIs, scheduled jobs, microservices communication',
					oauthOnly: true,
					security: [
						'Store client credentials in environment variables or secure vaults (never in code)',
						'Use certificate-based authentication when possible instead of secrets',
						'Rotate client secrets regularly (every 90 days recommended)',
						'Restrict token scopes to minimum required permissions',
						'Implement IP whitelisting for additional security layer',
						'Monitor and log all token requests for anomaly detection',
						'Use separate credentials for different environments (dev/staging/prod)',
						'Implement rate limiting to prevent brute force attacks',
						'Revoke credentials immediately if compromise is suspected',
					],
				},
				{
					name: 'Device Authorization Flow (Device Code)',
					description: 'For devices with limited input capabilities or no browser',
					steps: [
						'Device requests device code and user code from authorization server',
						'Display user code and verification URL to user',
						'User goes to verification URL on another device (phone/computer)',
						'User enters the user code and authenticates',
						'Device polls authorization server for token',
						'Once user completes auth, device receives access token (and ID token for OIDC)',
					],
					bestFor: 'Smart TVs, IoT devices, CLI tools, gaming consoles, devices without keyboards',
					security: [
						'Use short expiration times for device codes (typically 5-15 minutes)',
						'Implement rate limiting on the polling endpoint to prevent abuse',
						'Use user codes that are easy to read and type (short, alphanumeric)',
						'Display the verification URL clearly with the user code',
						'Implement exponential backoff for polling requests',
						"Validate that device code hasn't expired before issuing tokens",
						'Consider adding device fingerprinting for additional security',
						'Log all device authorization attempts for security monitoring',
						'Provide clear user instructions on the device screen',
						"For OIDC: Request 'openid' scope to get ID token with user identity",
					],
				},
			],
		},
		oidc: {
			title: 'OpenID Connect (OIDC) Deep Dive',
			description:
				'OIDC is an identity layer built on top of OAuth 2.0 that adds authentication capabilities.',
			keyPoints: [
				'Extends OAuth 2.0 with authentication',
				'Provides standardized user identity information',
				'Uses ID Tokens (JWT) to convey user identity',
				'Includes standardized scopes and endpoints',
				'Perfect for Single Sign-On (SSO) scenarios',
			],
			idToken: {
				description: 'A JWT (JSON Web Token) that contains user identity information',
				claims: [
					'sub: Subject (unique user identifier)',
					'iss: Issuer (who created the token)',
					'aud: Audience (who the token is for)',
					'exp: Expiration time',
					'iat: Issued at time',
					"email: User's email address",
					"name: User's full name",
					"picture: URL to user's profile picture",
				],
			},
			scopes: [
				{ scope: 'openid', description: 'Required for OIDC, returns sub claim' },
				{ scope: 'profile', description: 'Returns name, picture, etc.' },
				{ scope: 'email', description: 'Returns email and email_verified' },
				{ scope: 'address', description: 'Returns physical address' },
				{ scope: 'phone', description: 'Returns phone number' },
			],
			optionalParameters: {
				title: 'Optional OIDC Parameters',
				description:
					'These parameters enhance the user experience in user-facing flows but do NOT apply to Client Credentials Flow (no user involved).',
				parameters: [
					{
						name: 'login_hint',
						description: "Pre-populates the login screen with user's email or identifier",
						applicableFlows: ['Authorization Code', 'PKCE', 'Device Authorization'],
						notApplicableTo: ['Client Credentials'],
						example: 'login_hint=user@example.com',
					},
					{
						name: 'acr_values',
						description:
							'Requested Authentication Context Class Reference (e.g., multi-factor authentication)',
						applicableFlows: ['Authorization Code', 'PKCE', 'Device Authorization'],
						notApplicableTo: ['Client Credentials'],
						example: 'acr_values=urn:mace:incommon:iap:silver',
					},
					{
						name: 'prompt',
						description: 'Controls user interaction (none, login, consent, select_account)',
						applicableFlows: ['Authorization Code', 'PKCE'],
						notApplicableTo: ['Client Credentials', 'Device Authorization'],
						example: 'prompt=login (forces re-authentication)',
					},
					{
						name: 'max_age',
						description: 'Maximum authentication age in seconds - forces re-auth if session older',
						applicableFlows: ['Authorization Code', 'PKCE'],
						notApplicableTo: ['Client Credentials', 'Device Authorization'],
						example: 'max_age=3600 (must have authenticated within last hour)',
					},
					{
						name: 'ui_locales',
						description: 'Preferred languages for user interface',
						applicableFlows: ['Authorization Code', 'PKCE', 'Device Authorization'],
						notApplicableTo: ['Client Credentials'],
						example: 'ui_locales=fr-CA fr en',
					},
				],
			},
		},
		security: {
			title: 'Security Best Practices',
			practices: [
				{
					name: 'Always use HTTPS',
					description: 'All OAuth/OIDC communication must be over secure connections',
				},
				{
					name: 'Implement PKCE',
					description: 'Use PKCE for all public clients to prevent authorization code interception',
				},
				{
					name: 'Use PAR (Pushed Authorization Requests)',
					description:
						'Push authorization parameters to the server before redirect to prevent parameter tampering and leakage in browser history/logs',
				},
				{
					name: 'Implement RAR (Rich Authorization Requests)',
					description:
						'Use RAR for fine-grained, complex authorization scenarios requiring detailed permission structures beyond simple scopes',
				},
				{
					name: 'Validate Redirect URIs',
					description: 'Strictly validate and register all redirect URIs with your provider',
				},
				{
					name: 'Use State Parameter',
					description: 'Prevents CSRF attacks by including a random state value',
				},
				{
					name: 'Validate ID Tokens',
					description: 'Always verify JWT signature, issuer, audience, and expiration',
				},
				{
					name: 'Rotate Secrets',
					description: 'Regularly rotate client secrets and credentials',
				},
				{
					name: 'Store Tokens Securely',
					description: 'Never store tokens in localStorage; use httpOnly cookies for web apps',
				},
				{
					name: 'Implement Token Expiration',
					description: 'Use short-lived access tokens and refresh tokens appropriately',
				},
			],
			advancedFeatures: {
				par: {
					title: 'PAR - Pushed Authorization Requests (RFC 9126)',
					description:
						'PAR allows clients to push authorization request parameters directly to the authorization server via a back-channel request before initiating the user authorization flow.',
					benefits: [
						'Prevents authorization request parameter tampering',
						'Keeps sensitive data out of browser history and server logs',
						'Reduces URL length issues with complex requests',
						'Provides better protection against phishing and injection attacks',
						'Required for FAPI (Financial-grade API) compliance',
					],
					howItWorks: [
						'Client sends authorization parameters via POST to PAR endpoint',
						'Authorization server validates and stores the parameters',
						'Server returns a request_uri (short-lived reference)',
						'Client redirects user with only client_id and request_uri',
						'Authorization server retrieves stored parameters using request_uri',
						'Standard authorization flow continues from there',
					],
					security: [
						'request_uri expires quickly (typically 60-90 seconds)',
						'Can only be used once (single-use token)',
						'Reduces attack surface by keeping parameters server-side',
						'Particularly important for requests with sensitive data',
					],
				},
				rar: {
					title: 'RAR - Rich Authorization Requests (RFC 9396)',
					description:
						'RAR extends OAuth 2.0 to support complex, fine-grained authorization requirements that go beyond simple scope strings.',
					benefits: [
						'Express detailed authorization requirements in structured format',
						'Support complex permission scenarios (e.g., access specific resources with specific actions)',
						'Better than overloading scope strings with custom syntax',
						'Enables fine-grained consent screens for users',
						'Standardized way to request complex authorizations',
					],
					useCases: [
						'Banking: Read account A, write to account B, transfer up to $1000',
						'Healthcare: Read patient records for specific date range with specific purposes',
						'File systems: Read/write specific files or folders with time constraints',
						'Multi-tenant: Access specific tenant resources with role-based permissions',
						'Payment processing: Payment initiation with amount and merchant limits',
					],
					example: {
						description: 'Example RAR authorization_details for payment authorization',
						json: `{
  "authorization_details": [
    {
      "type": "payment_initiation",
      "actions": ["initiate", "status"],
      "locations": ["https://api.bank.com/payments"],
      "instructedAmount": {
        "currency": "USD",
        "amount": "500.00"
      },
      "creditorAccount": {
        "iban": "DE12345678901234567890"
      }
    }
  ]
}`,
					},
					security: [
						'Authorization server must validate all authorization_details',
						'Returned access tokens should be scoped to approved authorizations only',
						'Consider user consent for each authorization detail',
						'Log all RAR requests for audit purposes',
						'Implement proper error handling for unsupported types or invalid requests',
					],
				},
			},
		},
	},
};

// Main component with proper TypeScript typing
const OAuthOIDCTraining: React.FC = () => {
	const [activeTab, setActiveTab] = useState<string>('comparison');
	const [expandedFlow, setExpandedFlow] = useState<string | null>(null);
	const [searchTerm, setSearchTerm] = useState<string>('');
	const [collapsedSections, setCollapsedSections] = useState({
		comparison: false,
		oauth: false,
		oidc: false,
		security: false,
	});

	// Use V6 pageLayoutService for consistent dimensions and FlowHeader integration
	const pageConfig = {
		flowType: 'documentation' as const,
		theme: 'blue' as const,
		maxWidth: '72rem', // Wider for training content (1152px)
		showHeader: true,
		showFooter: false,
		responsive: true,
		flowId: 'oauth-oidc-training', // Enables FlowHeader integration
	};

	const {
		PageContainer,
		ContentWrapper,
		FlowHeader: LayoutFlowHeader,
	} = PageLayoutService.createPageLayout(pageConfig);

	const filterContent = (text: string): boolean => {
		if (!searchTerm) return true;
		return text.toLowerCase().includes(searchTerm.toLowerCase());
	};

	const highlightText = (text: string): React.ReactNode => {
		if (!searchTerm || typeof text !== 'string') return text;
		const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
		return parts.map((part, i) =>
			part.toLowerCase() === searchTerm.toLowerCase() ? (
				<mark key={i} className="bg-yellow-300 px-1">
					{part}
				</mark>
			) : (
				part
			)
		);
	};

	const toggleSection = (section: keyof typeof collapsedSections) => {
		setCollapsedSections((prev) => ({
			...prev,
			[section]: !prev[section],
		}));
	};

	const renderSupportIcon = (value: any): React.ReactNode => {
		if (typeof value === 'object' && value.supported !== undefined) {
			return value.supported ? (
				<span className="flex items-center gap-2 text-green-600">
					<CheckCircle size={16} /> {value.text}
				</span>
			) : (
				<span className="flex items-center gap-2 text-red-600">
					<XCircle size={16} /> {value.text}
				</span>
			);
		}
		return value;
	};

	return (
		<PageContainer>
			<ContentWrapper>
				{LayoutFlowHeader && <LayoutFlowHeader />}
				{/* Header */}
				<div className="bg-white rounded-lg shadow-lg p-8 mb-6">
					<div className="flex items-center gap-4 mb-4">
						<Shield className="text-indigo-600" size={48} />
						<div className="flex-1">
							<h1 className="text-4xl font-bold text-gray-800">OAuth 2.0 & OIDC Training</h1>
							<p className="text-gray-600 mt-2">
								Complete guide to modern authentication and authorization
							</p>
						</div>
					</div>

					{/* Search Bar */}
					<div className="relative mt-6">
						<Search
							className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
							size={20}
						/>
						<input
							type="text"
							placeholder="Search features, flows, security practices..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-600 focus:outline-none transition"
						/>
						{searchTerm && (
							<button
								onClick={() => setSearchTerm('')}
								className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
							>
								<XCircle size={20} />
							</button>
						)}
					</div>
				</div>

				{/* Comparison Table Section */}
				<CollapsibleHeader
					title="OAuth 2.0 vs OIDC Comparison"
					subtitle="Side-by-side comparison of OAuth 2.0 and OpenID Connect features"
					icon={<BookOpen />}
					defaultCollapsed={collapsedSections.comparison}
					collapsed={collapsedSections.comparison}
					onToggle={() => toggleSection('comparison')}
				>
					<div style={{ padding: '1.5rem' }}>
						<div className="overflow-x-auto">
							<table className="w-full border-collapse">
								<thead>
									<tr className="bg-indigo-600 text-white">
										<th className="p-4 text-left font-semibold">Feature</th>
										<th className="p-4 text-left font-semibold">OAuth 2.0</th>
										<th className="p-4 text-left font-semibold">OIDC</th>
									</tr>
								</thead>
								<tbody>
									{OAuthOIDCData.comparisonTable
										.filter(
											(row) =>
												!searchTerm ||
												filterContent(row.feature) ||
												filterContent(
													typeof row.oauth === 'string' ? row.oauth : row.oauth.text || ''
												) ||
												filterContent(typeof row.oidc === 'string' ? row.oidc : row.oidc.text || '')
										)
										.map((row, idx) => (
											<tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
												<td className="p-4 font-medium text-gray-700 border-b">
													{highlightText(row.feature)}
												</td>
												<td className="p-4 text-gray-600 border-b">
													{typeof row.oauth === 'object' && row.oauth.supported !== undefined
														? renderSupportIcon(row.oauth)
														: highlightText(typeof row.oauth === 'string' ? row.oauth : '')}
												</td>
												<td className="p-4 text-gray-600 border-b">
													{typeof row.oidc === 'object' && row.oidc.supported !== undefined
														? renderSupportIcon(row.oidc)
														: highlightText(typeof row.oidc === 'string' ? row.oidc : '')}
												</td>
											</tr>
										))}
								</tbody>
							</table>

							<div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
								<div className="flex items-start gap-3">
									<AlertCircle className="text-blue-600 mt-1" size={24} />
									<div>
										<h3 className="font-semibold text-blue-900 mb-2">Key Takeaway</h3>
										<p className="text-blue-800">
											<strong>OAuth 2.0</strong> answers "what can they access?" while{' '}
											<strong>OIDC</strong> answers "who are they?" OIDC is essentially OAuth 2.0 +
											identity layer.
										</p>
									</div>
								</div>
							</div>

							{/* OAuth Only Note */}
							<div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
								<div className="flex items-start gap-3">
									<AlertCircle className="text-amber-600 mt-1" size={24} />
									<div>
										<h3 className="font-semibold text-amber-900 mb-2">OAuth 2.0 Only Flow</h3>
										<p className="text-amber-800">
											{OAuthOIDCData.trainingContent.oauth.oauthOnlyNote}
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</CollapsibleHeader>

				{/* OAuth 2.0 Deep Dive Section */}
				<CollapsibleHeader
					title="OAuth 2.0 Deep Dive"
					subtitle="Complete guide to OAuth 2.0 authorization flows and security practices"
					icon={<Key />}
					defaultCollapsed={collapsedSections.oauth}
					collapsed={collapsedSections.oauth}
					onToggle={() => toggleSection('oauth')}
				>
					<div style={{ padding: '1.5rem' }}>
						<div>
							<h2 className="text-2xl font-bold text-gray-800 mb-4">
								{OAuthOIDCData.trainingContent.oauth.title}
							</h2>
							<p className="text-gray-600 mb-6">
								{OAuthOIDCData.trainingContent.oauth.description}
							</p>

							<div className="bg-indigo-50 rounded-lg p-6 mb-6">
								<h3 className="font-semibold text-indigo-900 mb-3">Key Points</h3>
								<ul className="space-y-2">
									{OAuthOIDCData.trainingContent.oauth.keyPoints.map((point, idx) => (
										<li key={idx} className="flex items-start gap-2 text-indigo-800">
											<CheckCircle size={20} className="mt-0.5 flex-shrink-0" />
											<span>{point}</span>
										</li>
									))}
								</ul>
							</div>

							<h3 className="text-xl font-bold text-gray-800 mb-4">
								OAuth 2.0 Authorization Flows
							</h3>
							<div className="space-y-4">
								{OAuthOIDCData.trainingContent.oauth.flows
									.filter(
										(flow) =>
											!searchTerm ||
											filterContent(flow.name) ||
											filterContent(flow.description) ||
											flow.steps.some((step) => filterContent(step)) ||
											(flow.security && flow.security.some((sec: string) => filterContent(sec)))
									)
									.map((flow) => {
										const actualIdx = OAuthOIDCData.trainingContent.oauth.flows.indexOf(flow);
										return (
											<div key={actualIdx} className="border rounded-lg overflow-hidden">
												<button
													onClick={() =>
														setExpandedFlow(
															expandedFlow === actualIdx.toString() ? null : actualIdx.toString()
														)
													}
													className="w-full bg-gray-100 hover:bg-gray-200 p-4 flex items-center justify-between transition"
												>
													<div className="text-left">
														<h4 className="font-semibold text-gray-800">
															{highlightText(flow.name)}
														</h4>
														<p className="text-sm text-gray-600">
															{highlightText(flow.description)}
														</p>
													</div>
													<RefreshCw
														size={20}
														className={`transition-transform ${expandedFlow === actualIdx.toString() ? 'rotate-180' : ''}`}
													/>
												</button>
												{expandedFlow === actualIdx.toString() && (
													<div className="p-4 bg-white">
														<h5 className="font-medium text-gray-700 mb-2">Flow Steps:</h5>
														<ol className="space-y-2 mb-4">
															{flow.steps.map((step, stepIdx) => (
																<li key={stepIdx} className="flex gap-3">
																	<span className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm">
																		{stepIdx + 1}
																	</span>
																	<span className="text-gray-700">{highlightText(step)}</span>
																</li>
															))}
														</ol>
														<div className="bg-green-50 p-3 rounded border border-green-200 mb-4">
															<p className="text-sm text-green-800">
																<strong>Best For:</strong> {flow.bestFor}
															</p>
														</div>

														{flow.oauthOnly && (
															<div className="bg-amber-50 p-3 rounded border border-amber-200 mb-4">
																<div className="flex items-start gap-2">
																	<AlertCircle
																		className="text-amber-600 mt-0.5 flex-shrink-0"
																		size={18}
																	/>
																	<p className="text-sm text-amber-800">
																		<strong>OAuth 2.0 Only:</strong> This flow does not apply to
																		OIDC since there is no user involved. OIDC requires user
																		authentication to provide identity information via ID Tokens.
																	</p>
																</div>
															</div>
														)}

														{flow.security && (
															<div className="bg-red-50 p-4 rounded border border-red-200">
																<div className="flex items-center gap-2 mb-3">
																	<Lock className="text-red-600" size={20} />
																	<h5 className="font-semibold text-red-900">
																		Security Best Practices for {flow.name}
																	</h5>
																</div>
																<ul className="space-y-2">
																	{flow.security.map((practice: string, practiceIdx: number) => (
																		<li
																			key={practiceIdx}
																			className="flex items-start gap-2 text-sm text-red-800"
																		>
																			<CheckCircle
																				size={16}
																				className="mt-0.5 flex-shrink-0 text-red-600"
																			/>
																			<span>{highlightText(practice)}</span>
																		</li>
																	))}
																</ul>
															</div>
														)}
													</div>
												)}
											</div>
										);
									})}
							</div>
						</div>
					</div>
				</CollapsibleHeader>

				{/* OIDC Deep Dive Section */}
				<CollapsibleHeader
					title="OpenID Connect Deep Dive"
					subtitle="Complete guide to OIDC authentication flows, ID tokens, and user management"
					icon={<Users />}
					defaultCollapsed={collapsedSections.oidc}
					collapsed={collapsedSections.oidc}
					onToggle={() => toggleSection('oidc')}
				>
					<div style={{ padding: '1.5rem' }}>
						<div>
							<h2 className="text-2xl font-bold text-gray-800 mb-4">
								{OAuthOIDCData.trainingContent.oidc.title}
							</h2>
							<p className="text-gray-600 mb-6">{OAuthOIDCData.trainingContent.oidc.description}</p>

							<div className="bg-purple-50 rounded-lg p-6 mb-6">
								<h3 className="font-semibold text-purple-900 mb-3">Key Points</h3>
								<ul className="space-y-2">
									{OAuthOIDCData.trainingContent.oidc.keyPoints.map((point, idx) => (
										<li key={idx} className="flex items-start gap-2 text-purple-800">
											<CheckCircle size={20} className="mt-0.5 flex-shrink-0" />
											<span>{point}</span>
										</li>
									))}
								</ul>
							</div>

							<div className="grid md:grid-cols-2 gap-6 mb-6">
								<div className="border rounded-lg p-6 bg-white">
									<h3 className="text-lg font-bold text-gray-800 mb-3">ID Token (JWT)</h3>
									<p className="text-gray-600 mb-4">
										{OAuthOIDCData.trainingContent.oidc.idToken.description}
									</p>
									<h4 className="font-semibold text-gray-700 mb-2">Standard Claims:</h4>
									<ul className="space-y-1">
										{OAuthOIDCData.trainingContent.oidc.idToken.claims.map((claim, idx) => (
											<li
												key={idx}
												className="text-sm text-gray-600 font-mono bg-gray-50 p-2 rounded"
											>
												{claim}
											</li>
										))}
									</ul>
								</div>

								<div className="border rounded-lg p-6 bg-white">
									<h3 className="text-lg font-bold text-gray-800 mb-3">Standard Scopes</h3>
									<div className="space-y-3">
										{OAuthOIDCData.trainingContent.oidc.scopes.map((scopeItem, idx) => (
											<div key={idx} className="border-l-4 border-indigo-600 pl-3">
												<h4 className="font-semibold text-gray-800">{scopeItem.scope}</h4>
												<p className="text-sm text-gray-600">{scopeItem.description}</p>
											</div>
										))}
									</div>
								</div>
							</div>

							{/* Optional Parameters Section */}
							<div className="border rounded-lg p-6 bg-gradient-to-br from-indigo-50 to-purple-50 mb-6">
								<h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
									<AlertCircle className="text-indigo-600" size={24} />
									{OAuthOIDCData.trainingContent.oidc.optionalParameters.title}
								</h3>
								<p className="text-gray-700 mb-4 text-sm">
									{OAuthOIDCData.trainingContent.oidc.optionalParameters.description}
								</p>
								<div className="space-y-3">
									{OAuthOIDCData.trainingContent.oidc.optionalParameters.parameters.map(
										(param, idx) => (
											<div key={idx} className="bg-white rounded-lg p-4 border border-indigo-200">
												<div className="flex items-start justify-between mb-2">
													<h4 className="font-semibold text-gray-800">{param.name}</h4>
													<div className="text-xs text-gray-500">
														<div>Applies to: {param.applicableFlows.join(', ')}</div>
														<div className="text-red-600">
															Not for: {param.notApplicableTo.join(', ')}
														</div>
													</div>
												</div>
												<p className="text-sm text-gray-600 mb-2">{param.description}</p>
												<div className="bg-gray-50 p-2 rounded text-xs font-mono text-gray-700">
													Example: {param.example}
												</div>
											</div>
										)
									)}
								</div>
							</div>
						</div>
					</div>
				</CollapsibleHeader>

				{/* Security Best Practices Section */}
				<CollapsibleHeader
					title="Security Best Practices"
					subtitle="Essential security guidelines for OAuth 2.0 and OpenID Connect implementations"
					icon={<Lock />}
					defaultCollapsed={collapsedSections.security}
					collapsed={collapsedSections.security}
					onToggle={() => toggleSection('security')}
				>
					<div style={{ padding: '1.5rem' }}>
						<div>
							<h2 className="text-2xl font-bold text-gray-800 mb-4">
								{OAuthOIDCData.trainingContent.security.title}
							</h2>

							{/* Security Practices */}
							<div className="grid md:grid-cols-2 gap-6 mb-6">
								{OAuthOIDCData.trainingContent.security.practices.map((practice, idx) => (
									<div key={idx} className="bg-white border rounded-lg p-6 shadow-sm">
										<div className="flex items-start gap-3">
											<Shield className="text-green-600 mt-1 flex-shrink-0" size={24} />
											<div>
												<h3 className="font-semibold text-gray-800 mb-2">{practice.name}</h3>
												<p className="text-sm text-gray-600">{practice.description}</p>
											</div>
										</div>
									</div>
								))}
							</div>

							{/* Advanced Features */}
							<div className="space-y-6">
								<h3 className="text-xl font-bold text-gray-800">Advanced Security Features</h3>

								{/* PAR Section */}
								<div className="bg-white border rounded-lg p-6">
									<h4 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
										<Lock className="text-blue-600" size={24} />
										{OAuthOIDCData.trainingContent.security.advancedFeatures.par.title}
									</h4>
									<p className="text-gray-600 mb-4">
										{OAuthOIDCData.trainingContent.security.advancedFeatures.par.description}
									</p>

									<div className="grid md:grid-cols-2 gap-6">
										<div>
											<h5 className="font-semibold text-gray-700 mb-2">Benefits</h5>
											<ul className="space-y-1">
												{OAuthOIDCData.trainingContent.security.advancedFeatures.par.benefits.map(
													(benefit: string, idx: number) => (
														<li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
															<CheckCircle
																size={14}
																className="mt-0.5 text-green-600 flex-shrink-0"
															/>
															{benefit}
														</li>
													)
												)}
											</ul>
										</div>
										<div>
											<h5 className="font-semibold text-gray-700 mb-2">How It Works</h5>
											<ol className="space-y-1">
												{OAuthOIDCData.trainingContent.security.advancedFeatures.par.howItWorks.map(
													(step: string, idx: number) => (
														<li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
															<span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">
																{idx + 1}
															</span>
															{step}
														</li>
													)
												)}
											</ol>
										</div>
									</div>
								</div>

								{/* RAR Section */}
								<div className="bg-white border rounded-lg p-6">
									<h4 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
										<Key className="text-purple-600" size={24} />
										{OAuthOIDCData.trainingContent.security.advancedFeatures.rar.title}
									</h4>
									<p className="text-gray-600 mb-4">
										{OAuthOIDCData.trainingContent.security.advancedFeatures.rar.description}
									</p>

									<div className="grid md:grid-cols-2 gap-6 mb-4">
										<div>
											<h5 className="font-semibold text-gray-700 mb-2">Benefits</h5>
											<ul className="space-y-1">
												{OAuthOIDCData.trainingContent.security.advancedFeatures.rar.benefits.map(
													(benefit: string, idx: number) => (
														<li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
															<CheckCircle
																size={14}
																className="mt-0.5 text-green-600 flex-shrink-0"
															/>
															{benefit}
														</li>
													)
												)}
											</ul>
										</div>
										<div>
											<h5 className="font-semibold text-gray-700 mb-2">Use Cases</h5>
											<ul className="space-y-1">
												{OAuthOIDCData.trainingContent.security.advancedFeatures.rar.useCases.map(
													(useCase: string, idx: number) => (
														<li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
															<CheckCircle
																size={14}
																className="mt-0.5 text-blue-600 flex-shrink-0"
															/>
															{useCase}
														</li>
													)
												)}
											</ul>
										</div>
									</div>

									{/* RAR Example */}
									<div className="bg-gray-50 rounded-lg p-4 border">
										<h5 className="font-semibold text-gray-700 mb-2">
											{
												OAuthOIDCData.trainingContent.security.advancedFeatures.rar.example
													.description
											}
										</h5>
										<pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
											<code>
												{OAuthOIDCData.trainingContent.security.advancedFeatures.rar.example.json}
											</code>
										</pre>
									</div>
								</div>
							</div>
						</div>
					</div>
				</CollapsibleHeader>

				{/* Quick Reference Card */}
				<div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
					<h3 className="text-xl font-bold mb-4">Quick Decision Guide</h3>
					<div className="grid md:grid-cols-2 gap-6">
						<div>
							<h4 className="font-semibold mb-2 flex items-center gap-2">
								<Key size={20} /> Use OAuth 2.0 when:
							</h4>
							<ul className="space-y-1 text-sm">
								<li>• You need API access authorization</li>
								<li>• User identity is not required</li>
								<li>• Delegated access to resources</li>
								<li>• Machine-to-machine communication</li>
							</ul>
						</div>
						<div>
							<h4 className="font-semibold mb-2 flex items-center gap-2">
								<Users size={20} /> Use OIDC when:
							</h4>
							<ul className="space-y-1 text-sm">
								<li>• You need user authentication (login)</li>
								<li>• Single Sign-On (SSO) scenarios</li>
								<li>• User profile information needed</li>
								<li>• Social login (Google, Microsoft, etc.)</li>
							</ul>
						</div>
					</div>
				</div>
			</ContentWrapper>
		</PageContainer>
	);
};

export default OAuthOIDCTraining;
