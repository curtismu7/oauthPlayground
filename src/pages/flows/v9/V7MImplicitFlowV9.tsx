// src/pages/flows/v9/V7MImplicitFlowV9.tsx

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ColoredJsonDisplay } from '../../../components/ColoredJsonDisplay';
import ColoredUrlDisplay from '../../../components/ColoredUrlDisplay';
import { MockApiCallDisplay } from '../../../components/MockApiCallDisplay';
import { DEMO_API_BASE, DEMO_ENVIRONMENT_ID } from '../../../components/PingOneApiCallDisplay';
import { UnifiedCredentialManagerV9 } from '../../../components/UnifiedCredentialManagerV9';
import { showGlobalError, showGlobalSuccess } from '../../../contexts/NotificationSystem';
import UnifiedTokenDisplayService from '../../../services/unifiedTokenDisplayService';
import { EnvironmentIdServiceV8 } from '../../../services/v9/environmentIdServiceV9';
import {
	authorizeIssueCode,
	V9MockAuthorizeRequest,
} from '../../../services/v9/mock/V9MockAuthorizeService';
import {
	introspectToken,
	type V9MockIntrospectionResponse,
} from '../../../services/v9/mock/V9MockIntrospectionService';
import {
	getUserInfoFromAccessToken,
	type V9MockUserInfo,
} from '../../../services/v9/mock/V9MockUserInfoService';
import { V9CredentialStorageService } from '../../../services/v9/V9CredentialStorageService';
import { V9FlowRestartButton } from '../../../services/v9/V9FlowRestartButton';
import V9FlowHeader from '../../../services/v9/v9FlowHeaderService';
import { V7MFlowOverview } from '../../../v7/components/V7MFlowOverview';
import { V7MHelpModal } from '../../../v7/components/V7MHelpModal';
import { V7MInfoIcon } from '../../../v7/components/V7MInfoIcon';
import { V7MJwtInspectorModal } from '../../../v7/components/V7MJwtInspectorModal';
import { V7MMockBanner } from '../../../v7/components/V7MMockBanner';
import {
	getSectionBodyStyle,
	getSectionHeaderStyle,
	MOCK_INPUT_STYLE,
	MOCK_PRIMARY_BTN,
	MOCK_SECONDARY_BTN,
	MOCK_SECTION_STYLE,
} from '../../../v7/styles/mockFlowStyles';

type Props = {
	oidc?: boolean;
	title?: string;
};

export const V7MImplicitFlowV9: React.FC<Props> = ({
	oidc = false,
	title = 'OAuth Implicit Flow',
}) => {
	const [variant, setVariant] = useState<'oauth' | 'oidc'>(oidc ? 'oidc' : 'oauth');
	const [clientId, setClientId] = useState('v7m-client');
	const [redirectUri, setRedirectUri] = useState('/implicit-callback');
	const [scope, setScope] = useState(variant === 'oidc' ? 'openid profile email' : 'read write');
	const [state, setState] = useState('abc123state');
	const [nonce, setNonce] = useState('n-0S6_WzA2Mj');
	const [userEmail, setUserEmail] = useState('jane.doe@example.com');
	const [authorizationUrl, setAuthorizationUrl] = useState('');
	const [callbackUrl, setCallbackUrl] = useState('');
	const [tokens, setTokens] = useState<{
		access_token?: string;
		id_token?: string;
		token_type: string;
		expires_in: number;
		scope?: string;
	} | null>(null);
	const [showIdModal, setShowIdModal] = useState(false);
	const [showAccessModal, setShowAccessModal] = useState(false);
	const [showImplicitHelp, setShowImplicitHelp] = useState(false);
	const [showScopesHelp, setShowScopesHelp] = useState(false);
	const [showUserInfoHelp, setShowUserInfoHelp] = useState(false);
	const [showIntrospectionHelp, setShowIntrospectionHelp] = useState(false);
	const [showStateHelp, setShowStateHelp] = useState(false);
	const [showNonceHelp, setShowNonceHelp] = useState(false);
	const [showDeprecationHelp, setShowDeprecationHelp] = useState(false);
	const [userinfoResponse, setUserinfoResponse] = useState<V9MockUserInfo | null>(null);
	const [introspectionResponse, setIntrospectionResponse] =
		useState<V9MockIntrospectionResponse | null>(null);

	useEffect(() => {
		const saved = V9CredentialStorageService.loadSync('v7m-implicit');
		if (saved.clientId) setClientId(saved.clientId);
	}, []);

	const handleAppSelected = useCallback((app: { clientId: string; name: string }) => {
		setClientId(app.clientId);
		V9CredentialStorageService.save('v7m-implicit', { clientId: app.clientId });
	}, []);

	const responseType = useMemo(() => {
		if (variant === 'oidc') return 'id_token token';
		return 'token';
	}, [variant]);

	// Use app domain and stored environment ID for displayed API call URLs (real endpoints, not mock)
	const apiBase = typeof window !== 'undefined' ? window.location.origin : DEMO_API_BASE;
	const environmentId = EnvironmentIdServiceV8.getEnvironmentId() || DEMO_ENVIRONMENT_ID;

	function handleBuildAuthorize() {
		const req: V9MockAuthorizeRequest = {
			response_type: responseType as 'id_token token' | 'token',
			client_id: clientId,
			redirect_uri: redirectUri,
			scope,
			state,
			nonce: variant === 'oidc' ? nonce : undefined,
			userEmail,
			issuer: 'https://mock.issuer/v7m',
			environmentId: 'mock-env',
			includeIdToken: variant === 'oidc',
			ttls: { accessTokenSeconds: 900, idTokenSeconds: 900, refreshTokenSeconds: 86400 },
		};
		const res = authorizeIssueCode(req, Math.floor(Date.now() / 1000), 300);
		if (res.type === 'error') {
			showGlobalError(`${res.error}: ${res.error_description ?? ''}`);
			return;
		}
		setAuthorizationUrl(res.url);
		setCallbackUrl(res.url);
		if (res.tokens) {
			setTokens(res.tokens);
		} else {
			// Parse from fragment if not directly provided
			const url = new URL(res.url, window.location.origin);
			const fragment = url.hash.substring(1);
			const params = new URLSearchParams(fragment);
			setTokens({
				access_token: params.get('access_token') ?? undefined,
				id_token: params.get('id_token') ?? undefined,
				token_type: params.get('token_type') ?? 'Bearer',
				expires_in: parseInt(params.get('expires_in') ?? '900', 10),
				scope: params.get('scope') ?? undefined,
			});
		}
	}

	const idToken = tokens?.id_token;
	const accessToken = tokens?.access_token;

	function handleUserInfo() {
		if (!accessToken) {
			showGlobalError('No access token available');
			return;
		}
		const res = getUserInfoFromAccessToken(accessToken);
		setUserinfoResponse(res);
	}

	function handleIntrospect() {
		if (!accessToken) {
			showGlobalError('No access token available');
			return;
		}
		const res = introspectToken(accessToken);
		setIntrospectionResponse(res);
	}

	async function _copyToClipboard(text: string) {
		try {
			await navigator.clipboard.writeText(text);
			showGlobalSuccess('Copied to clipboard!');
		} catch {
			showGlobalError('Copy failed');
		}
	}

	function _parseFragmentFromUrl(url: string) {
		try {
			const urlObj = new URL(url, window.location.origin);
			const fragment = urlObj.hash.substring(1);
			const params = new URLSearchParams(fragment);
			return {
				access_token: params.get('access_token') ?? undefined,
				id_token: params.get('id_token') ?? undefined,
				token_type: params.get('token_type') ?? 'Bearer',
				expires_in: parseInt(params.get('expires_in') ?? '900', 10),
				scope: params.get('scope') ?? undefined,
				state: params.get('state') ?? undefined,
			};
		} catch {
			return null;
		}
	}

	function handleReset() {
		setAuthorizationUrl('');
		setCallbackUrl('');
		setTokens(null);
		setUserinfoResponse(null);
		setIntrospectionResponse(null);
		window.scrollTo({ top: 0, behavior: 'smooth' });
		showGlobalSuccess('Flow reset. Start again from step 1.');
	}

	return (
		<div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
			<V7MMockBanner
				description="This flow simulates OAuth/OIDC endpoints for learning. No external APIs are called. Tokens are generated deterministically based on your settings."
				deprecation={{
					short:
						'The Implicit Flow is deprecated in OAuth 2.1. Use Authorization Code Flow with PKCE instead. This flow is included for educational purposes.',
					onLearnMoreClick: () => setShowDeprecationHelp(true),
				}}
			/>
			<V9FlowHeader flowId="implicit-v9" customConfig={{ flowType: 'pingone' }} />
			<div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
				<V9FlowRestartButton
					onRestart={handleReset}
					currentStep={0}
					totalSteps={1}
					position="header"
				/>
			</div>
			<UnifiedCredentialManagerV9
				environmentId="v7m-mock"
				flowKey="v7m-implicit"
				credentials={{ clientId }}
				importExportOptions={{
					flowType: 'v7m-implicit',
					appName: 'Implicit Flow',
					description: 'Mock OAuth Implicit Flow (deprecated)',
				}}
				onAppSelected={handleAppSelected}
				grantType="implicit"
				showAppPicker={true}
				showImportExport={true}
			/>

			<V7MFlowOverview
				title="About this flow"
				description="Implicit flow returns access tokens (and optionally ID tokens) directly to the client in the authorization response, typically in the URL fragment. The client never receives an authorization code; tokens are issued at the authorize redirect."
				keyPoint="Tokens appear in the redirect URL fragment (#...) so they are not sent to the server. Client-side JavaScript reads them from the fragment after the redirect."
				standard="OAuth 2.0 Implicit Grant (RFC 6749 §4.2). Deprecated in OAuth 2.1 in favor of Authorization Code with PKCE."
				benefits={[
					'No client secret needed (suitable for public clients like SPAs).',
					'Fewer round trips than authorization code (no token endpoint call for the initial response).',
					'Fragment keeps tokens out of server logs and referrers.',
				]}
				educationalNote="This is a mock implementation. No external IdP is called; the authorization URL and callback with tokens are simulated so you can see the request/response shape."
			/>

			<div
				style={{
					display: 'flex',
					gap: 12,
					marginBottom: 16,
					padding: 12,
					background: '#f8fafc',
					borderRadius: 8,
				}}
			>
				<button
					type="button"
					onClick={() => {
						setVariant('oauth');
						setScope('read write');
					}}
					style={{
						flex: 1,
						padding: 12,
						borderRadius: 6,
						border: `2px solid ${variant === 'oauth' ? '#16a34a' : '#cbd5e1'}`,
						background: variant === 'oauth' ? '#dcfce7' : 'white',
						color: variant === 'oauth' ? '#166534' : '#475569',
						fontWeight: variant === 'oauth' ? '600' : '400',
						cursor: 'pointer',
					}}
				>
					OAuth 2.0
				</button>
				<button
					type="button"
					onClick={() => {
						setVariant('oidc');
						setScope('openid profile email');
					}}
					style={{
						flex: 1,
						padding: 12,
						borderRadius: 6,
						border: `2px solid ${variant === 'oidc' ? '#3b82f6' : '#cbd5e1'}`,
						background: variant === 'oidc' ? '#dbeafe' : 'white',
						color: variant === 'oidc' ? '#1e40af' : '#475569',
						fontWeight: variant === 'oidc' ? '600' : '400',
						cursor: 'pointer',
					}}
				>
					OpenID Connect
				</button>
			</div>

			<section style={MOCK_SECTION_STYLE}>
				<header style={getSectionHeaderStyle(variant === 'oidc' ? 'info' : 'success')}>
					<span>📤</span> Step 1: Build Authorization Request
					<V7MInfoIcon
						label=""
						title="About Implicit Flow"
						onClick={() => setShowImplicitHelp(true)}
					/>
				</header>
				<div style={getSectionBodyStyle()}>
					<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
						<label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
							Client ID
							<V7MInfoIcon
								label=""
								title="Your application's unique identifier"
								onClick={() => {}}
							/>
							<input
								value={clientId}
								onChange={(e) => setClientId(e.target.value)}
								style={MOCK_INPUT_STYLE}
							/>
						</label>
						<label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
							Redirect URI
							<V7MInfoIcon
								label=""
								title="The callback URI where tokens are returned in the fragment"
								onClick={() => {}}
							/>
							<input
								value={redirectUri}
								onChange={(e) => setRedirectUri(e.target.value)}
								style={MOCK_INPUT_STYLE}
							/>
						</label>
						<label>
							<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
								Scope
								<V7MInfoIcon
									label=""
									title="How scopes map to tokens and claims"
									onClick={() => setShowScopesHelp(true)}
								/>
							</div>
							<input
								value={scope}
								onChange={(e) => setScope(e.target.value)}
								style={MOCK_INPUT_STYLE}
							/>
						</label>
						<label>
							<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
								State
								<V7MInfoIcon
									label=""
									title="CSRF protection - echoed back in the redirect"
									onClick={() => setShowStateHelp(true)}
								/>
							</div>
							<input
								value={state}
								onChange={(e) => setState(e.target.value)}
								style={MOCK_INPUT_STYLE}
							/>
						</label>
						{variant === 'oidc' && (
							<label>
								<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
									Nonce
									<V7MInfoIcon
										label=""
										title="Replay attack protection for ID token"
										onClick={() => setShowNonceHelp(true)}
									/>
								</div>
								<input
									value={nonce}
									onChange={(e) => setNonce(e.target.value)}
									style={MOCK_INPUT_STYLE}
								/>
							</label>
						)}
						<label>
							User Email (for mock user info)
							<input
								value={userEmail}
								onChange={(e) => setUserEmail(e.target.value)}
								style={MOCK_INPUT_STYLE}
							/>
						</label>
					</div>
					<div style={{ marginTop: 12 }}>
						<div>
							<div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
								<strong>Response Type:</strong>
								<code style={{ padding: '4px 8px', background: '#f3f4f6', borderRadius: 4 }}>
									{responseType}
								</code>
							</div>
							<small style={{ color: '#6b7280' }}>
								{variant === 'oidc'
									? "OIDC returns 'id_token token' (both ID token and access token in fragment)"
									: "OAuth returns 'token' (access token in fragment)"}
							</small>
						</div>
					</div>
					<button type="button" onClick={handleBuildAuthorize} style={MOCK_PRIMARY_BTN}>
						<span>📤</span> Build Authorization URL
					</button>
					{authorizationUrl && (
						<div style={{ marginTop: 12 }}>
							<MockApiCallDisplay
								title="Authorization request (GET) — Implicit"
								method="GET"
								url={authorizationUrl}
								response={
									tokens && callbackUrl
										? {
												status: 302,
												statusText: 'Found',
												headers: { Location: callbackUrl },
												data: {
													note: 'Browser is redirected to redirect_uri with tokens in fragment. App parses window.location.hash.',
												},
											}
										: {
												status: 302,
												statusText: 'Found',
												data: {
													note: 'After user authorizes, redirect to redirect_uri#access_token=...&token_type=...&state=...',
												},
											}
								}
								defaultExpanded={true}
							/>
							<ColoredUrlDisplay
								url={authorizationUrl}
								label="Authorization URL"
								showCopyButton={true}
								showInfoButton={true}
								showOpenButton={false}
							/>
						</div>
					)}
				</div>
			</section>

			{tokens && (
				<section style={MOCK_SECTION_STYLE}>
					<header style={getSectionHeaderStyle('info')}>
						<span>🛡️</span> Step 2: Tokens Received (in URL Fragment)
					</header>
					<div style={getSectionBodyStyle()}>
						<p style={{ fontSize: 14, color: '#6b7280', marginBottom: 12 }}>
							In Implicit Flow, tokens are returned directly in the URL fragment (not query
							parameters). The fragment is only accessible to client-side JavaScript, not sent to
							the server.
						</p>
						{callbackUrl && (
							<div style={{ marginBottom: 12 }}>
								<ColoredUrlDisplay
									url={callbackUrl}
									label="Callback URL (with fragment)"
									showCopyButton={true}
									showInfoButton={false}
									showOpenButton={false}
								/>
							</div>
						)}
						{tokens && (
							<div style={{ marginBottom: 12 }}>
								<div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
									<strong>Tokens</strong>
									{accessToken && (
										<button
											type="button"
											onClick={() => setShowAccessModal(true)}
											style={MOCK_SECONDARY_BTN}
										>
											Inspect Access Token
										</button>
									)}
									{idToken && (
										<button
											type="button"
											onClick={() => setShowIdModal(true)}
											style={MOCK_SECONDARY_BTN}
										>
											Inspect ID Token
										</button>
									)}
								</div>
								{UnifiedTokenDisplayService.showTokens(
									{
										access_token: tokens.access_token,
										id_token: tokens.id_token,
										token_type: tokens.token_type,
										expires_in: tokens.expires_in,
										scope: tokens.scope,
									},
									variant === 'oidc' ? 'oidc' : 'oauth',
									'v7m-implicit',
									{ showCopyButtons: true, showDecodeButtons: true, showFullToken: true }
								)}
							</div>
						)}
						<div
							style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}
						>
							<div>
								<strong>Token Type:</strong> {tokens.token_type}
							</div>
							<div>
								<strong>Expires In:</strong> {tokens.expires_in} seconds
							</div>
							{tokens.scope && (
								<div>
									<strong>Scope:</strong> {tokens.scope}
								</div>
							)}
						</div>
					</div>
				</section>
			)}

			{accessToken && (
				<section style={MOCK_SECTION_STYLE}>
					<header style={getSectionHeaderStyle('info')}>
						<span>📖</span> Step 3: Use Access Token
					</header>
					<div style={getSectionBodyStyle()}>
						<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
							<button type="button" onClick={handleUserInfo} style={MOCK_PRIMARY_BTN}>
								Call UserInfo Endpoint
							</button>
							<V7MInfoIcon
								label=""
								title="About UserInfo Endpoint"
								onClick={() => setShowUserInfoHelp(true)}
							/>
							<button type="button" onClick={handleIntrospect} style={MOCK_PRIMARY_BTN}>
								Introspect Token
							</button>
							<V7MInfoIcon
								label=""
								title="About Token Introspection"
								onClick={() => setShowIntrospectionHelp(true)}
							/>
						</div>
						{userinfoResponse && (
							<div style={{ marginTop: 12 }}>
								<MockApiCallDisplay
									title="UserInfo request (GET)"
									method="GET"
									url={`${apiBase}/${environmentId}/as/userinfo`}
									headers={{
										Authorization: `Bearer ${accessToken ? `${accessToken.substring(0, 24)}...` : '***'}`,
										Accept: 'application/json',
									}}
									response={{ status: 200, statusText: 'OK', data: userinfoResponse }}
									defaultExpanded={true}
								/>
								<ColoredJsonDisplay
									data={userinfoResponse}
									label="UserInfo Response"
									collapsible={true}
									defaultCollapsed={false}
									showCopyButton={true}
								/>
							</div>
						)}
						{introspectionResponse && (
							<div style={{ marginTop: 12 }}>
								<MockApiCallDisplay
									title="Introspect request (POST)"
									method="POST"
									url={`${apiBase}/${environmentId}/as/introspect`}
									headers={{
										'Content-Type': 'application/x-www-form-urlencoded',
										Authorization: `Basic ${btoa(`${clientId}:***`)}`,
									}}
									body={`token=${accessToken ? `${encodeURIComponent(String(accessToken).substring(0, 20))}...` : '***'}`}
									response={{ status: 200, statusText: 'OK', data: introspectionResponse }}
									defaultExpanded={true}
								/>
								<ColoredJsonDisplay
									data={introspectionResponse}
									label="Introspection Response"
									collapsible={true}
									defaultCollapsed={false}
									showCopyButton={true}
								/>
							</div>
						)}
					</div>
				</section>
			)}

			<V7MJwtInspectorModal
				token={accessToken ?? ''}
				isOpen={showAccessModal}
				onClose={() => setShowAccessModal(false)}
			/>
			<V7MJwtInspectorModal
				token={idToken ?? ''}
				isOpen={showIdModal}
				onClose={() => setShowIdModal(false)}
			/>

			<V7MHelpModal
				isOpen={showImplicitHelp}
				onClose={() => setShowImplicitHelp(false)}
				title="Implicit Flow"
				content={
					<div>
						<p>
							The Implicit Flow was designed for browser-based applications that cannot securely
							store client secrets.
						</p>
						<p>
							<strong>How it works:</strong>
						</p>
						<ul>
							<li>Client redirects user to authorization endpoint</li>
							<li>User authenticates and grants consent</li>
							<li>
								Authorization server redirects back with tokens in the URL fragment (not query
								parameters)
							</li>
							<li>Client extracts tokens from fragment using JavaScript</li>
						</ul>
						<p>
							<strong>Key characteristics:</strong>
						</p>
						<ul>
							<li>No authorization code exchange step</li>
							<li>Tokens returned directly in fragment</li>
							<li>Fragment is only accessible to client-side JavaScript</li>
							<li>No refresh tokens (security risk)</li>
						</ul>
						<p>
							<strong>Why it's deprecated:</strong>
						</p>
						<ul>
							<li>Tokens exposed in browser history and logs</li>
							<li>No refresh token support makes token rotation difficult</li>
							<li>Tokens can leak via referrer headers</li>
							<li>Authorization Code Flow with PKCE is more secure</li>
						</ul>
					</div>
				}
			/>

			<V7MHelpModal
				isOpen={showDeprecationHelp}
				onClose={() => setShowDeprecationHelp(false)}
				title="Why Implicit Flow is Deprecated"
				content={
					<div>
						<p>
							<strong>OAuth 2.1 removes the Implicit Flow</strong> because it has significant
							security issues:
						</p>
						<ul>
							<li>
								<strong>Token Exposure:</strong> Tokens appear in browser history, server logs, and
								referrer headers
							</li>
							<li>
								<strong>No Refresh Tokens:</strong> Access tokens must be long-lived, increasing
								exposure window
							</li>
							<li>
								<strong>CSRF Vulnerabilities:</strong> Harder to implement proper state validation
							</li>
							<li>
								<strong>Token Leakage:</strong> Browser extensions and compromised JavaScript can
								access tokens
							</li>
						</ul>
						<p>
							<strong>Modern Alternative:</strong>
						</p>
						<p>
							Use <strong>Authorization Code Flow with PKCE</strong> instead:
						</p>
						<ul>
							<li>Tokens never appear in URLs</li>
							<li>Supports refresh tokens securely</li>
							<li>Better CSRF protection</li>
							<li>Works for both web and mobile apps</li>
						</ul>
					</div>
				}
			/>

			<V7MHelpModal
				isOpen={showScopesHelp}
				onClose={() => setShowScopesHelp(false)}
				title="OAuth Scopes"
				content={
					<div>
						<p>Scopes define what permissions the client is requesting.</p>
						<p>
							<strong>OAuth Scopes:</strong> <code>read</code>, <code>write</code>,{' '}
							<code>admin</code>
						</p>
						<p>
							<strong>OIDC Scopes:</strong> <code>openid</code> (required), <code>profile</code>,{' '}
							<code>email</code>, <code>address</code>, <code>phone</code>
						</p>
					</div>
				}
			/>

			<V7MHelpModal
				isOpen={showStateHelp}
				onClose={() => setShowStateHelp(false)}
				title="State Parameter"
				content={
					<div>
						<p>
							The <code>state</code> parameter prevents CSRF attacks.
						</p>
						<p>
							Generate a random value, store it (e.g., in session), and verify it matches in the
							callback.
						</p>
					</div>
				}
			/>

			<V7MHelpModal
				isOpen={showNonceHelp}
				onClose={() => setShowNonceHelp(false)}
				title="Nonce Parameter (OIDC)"
				content={
					<div>
						<p>
							The <code>nonce</code> prevents replay attacks on ID tokens.
						</p>
						<p>
							Generate a random value, include it in the authorization request, and verify it
							matches in the ID token's <code>nonce</code> claim.
						</p>
					</div>
				}
			/>

			<V7MHelpModal
				isOpen={showUserInfoHelp}
				onClose={() => setShowUserInfoHelp(false)}
				title="UserInfo Endpoint"
				content={
					<div>
						<p>The UserInfo endpoint returns user profile information.</p>
						<p>Send a GET request with the access token in the Authorization header:</p>
						<pre style={{ background: '#f3f4f6', padding: 12, borderRadius: 4, overflow: 'auto' }}>
							{`GET /userinfo
Authorization: Bearer <access_token>`}
						</pre>
					</div>
				}
			/>

			<V7MHelpModal
				isOpen={showIntrospectionHelp}
				onClose={() => setShowIntrospectionHelp(false)}
				title="Token Introspection"
				content={
					<div>
						<p>The introspection endpoint validates and returns token metadata.</p>
						<p>Send a POST request with the token:</p>
						<pre style={{ background: '#f3f4f6', padding: 12, borderRadius: 4, overflow: 'auto' }}>
							{`POST /introspect
Content-Type: application/x-www-form-urlencoded

token=<access_token>`}
						</pre>
					</div>
				}
			/>
		</div>
	);
};

export default V7MImplicitFlowV9;
