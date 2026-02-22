// src/v7m/pages/V7MImplicitFlow.tsx
import React, { useMemo, useState } from 'react';
import { FiAlertTriangle, FiBook, FiKey, FiSend, FiShield } from 'react-icons/fi';
import { authorizeIssueCode, V7MAuthorizeRequest } from '../../services/v7m/V7MAuthorizeService';
import { introspectToken } from '../../services/v7m/V7MIntrospectionService';
import { getUserInfoFromAccessToken } from '../../services/v7m/V7MUserInfoService';
import { V7MHelpModal } from '../components/V7MHelpModal';
import { V7MInfoIcon } from '../components/V7MInfoIcon';
import { V7MJwtInspectorModal } from '../components/V7MJwtInspectorModal';

type Props = {
	oidc?: boolean;
	title?: string;
};

export const V7MImplicitFlow: React.FC<Props> = ({
	oidc = false,
	title = 'V7M OAuth Implicit Flow',
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
	const [userinfoResponse, setUserinfoResponse] = useState<any>(null);
	const [introspectionResponse, setIntrospectionResponse] = useState<any>(null);

	const responseType = useMemo(() => {
		if (variant === 'oidc') return 'id_token token';
		return 'token';
	}, [variant]);

	function handleBuildAuthorize() {
		const req: V7MAuthorizeRequest = {
			response_type: responseType as any,
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
			alert(`${res.error}: ${res.error_description ?? ''}`);
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
			alert('No access token available');
			return;
		}
		const res = getUserInfoFromAccessToken(accessToken);
		setUserinfoResponse(res);
	}

	function handleIntrospect() {
		if (!accessToken) {
			alert('No access token available');
			return;
		}
		const res = introspectToken(accessToken);
		setIntrospectionResponse(res);
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

	return (
		<div style={{ padding: 24 }}>
			<div
				style={{
					background: '#fee2e2',
					border: '1px solid #f87171',
					borderRadius: 8,
					padding: 12,
					marginBottom: 16,
				}}
			>
				<div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
					<FiAlertTriangle color="#dc2626" />
					<strong>⚠️ Deprecated Flow</strong>
				</div>
				<p style={{ margin: '8px 0 0 0', fontSize: 14 }}>
					The Implicit Flow is deprecated in OAuth 2.1. Use Authorization Code Flow with PKCE
					instead. This flow is included for educational purposes to understand why it was
					deprecated.
					<button
						type="button"
						onClick={() => setShowDeprecationHelp(true)}
						style={{
							marginLeft: 8,
							textDecoration: 'underline',
							background: 'none',
							border: 'none',
							color: '#dc2626',
							cursor: 'pointer',
						}}
					>
						Learn more
					</button>
				</p>
			</div>
			<div
				style={{
					background: '#fef3c7',
					border: '1px solid #fbbf24',
					borderRadius: 8,
					padding: 12,
					marginBottom: 16,
				}}
			>
				<strong>📚 Educational Mock Mode (V7M)</strong>
				<p style={{ margin: '8px 0 0 0', fontSize: 14 }}>
					This flow simulates OAuth/OIDC endpoints for learning. No external APIs are called. Tokens
					are generated deterministically based on your settings.
				</p>
			</div>
			<h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
				<FiKey /> {title}
			</h1>

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

			<section style={{ marginTop: 16, border: '1px solid #e5e7eb', borderRadius: 8 }}>
				<header
					style={{
						padding: '10px 12px',
						background: variant === 'oidc' ? '#dbeafe' : '#dcfce7',
						display: 'flex',
						alignItems: 'center',
						gap: 8,
					}}
				>
					<FiSend /> Step 1: Build Authorization Request
					<V7MInfoIcon
						label=""
						title="About Implicit Flow"
						onClick={() => setShowImplicitHelp(true)}
					/>
				</header>
				<div style={{ padding: 12 }}>
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
								style={inputStyle}
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
								style={inputStyle}
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
							<input value={scope} onChange={(e) => setScope(e.target.value)} style={inputStyle} />
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
							<input value={state} onChange={(e) => setState(e.target.value)} style={inputStyle} />
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
									style={inputStyle}
								/>
							</label>
						)}
						<label>
							User Email (for mock user info)
							<input
								value={userEmail}
								onChange={(e) => setUserEmail(e.target.value)}
								style={inputStyle}
							/>
						</label>
					</div>
					<div style={{ marginTop: 12 }}>
						<label>
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
						</label>
					</div>
					<button type="button" onClick={handleBuildAuthorize} style={buttonStyle}>
						<FiSend /> Build Authorization URL
					</button>
					{authorizationUrl && (
						<div style={{ marginTop: 12 }}>
							<label>
								<strong>Authorization URL:</strong>
								<input
									value={authorizationUrl}
									readOnly
									style={{ ...inputStyle, fontFamily: 'monospace', fontSize: 12 }}
								/>
								<button
									type="button"
									onClick={() => navigator.clipboard.writeText(authorizationUrl)}
									style={smallButtonStyle}
								>
									Copy
								</button>
							</label>
						</div>
					)}
				</div>
			</section>

			{tokens && (
				<section style={{ marginTop: 16, border: '1px solid #e5e7eb', borderRadius: 8 }}>
					<header
						style={{
							padding: '10px 12px',
							background: '#dbeafe',
							display: 'flex',
							alignItems: 'center',
							gap: 8,
						}}
					>
						<FiShield /> Step 2: Tokens Received (in URL Fragment)
					</header>
					<div style={{ padding: 12 }}>
						<p style={{ fontSize: 14, color: '#6b7280', marginBottom: 12 }}>
							In Implicit Flow, tokens are returned directly in the URL fragment (not query
							parameters). The fragment is only accessible to client-side JavaScript, not sent to
							the server.
						</p>
						{callbackUrl && (
							<div style={{ marginBottom: 12 }}>
								<label>
									<strong>Callback URL (with fragment):</strong>
									<input
										value={callbackUrl}
										readOnly
										style={{
											...inputStyle,
											fontFamily: 'monospace',
											fontSize: 11,
											wordBreak: 'break-all',
										}}
									/>
								</label>
							</div>
						)}
						{accessToken && (
							<div style={{ marginBottom: 12 }}>
								<label>
									<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
										<strong>Access Token:</strong>
										<button
											type="button"
											onClick={() => setShowAccessModal(true)}
											style={smallButtonStyle}
										>
											Inspect JWT
										</button>
									</div>
									<textarea
										value={accessToken}
										readOnly
										style={{ ...inputStyle, fontFamily: 'monospace', fontSize: 11, minHeight: 60 }}
									/>
									<button
										type="button"
										onClick={() => navigator.clipboard.writeText(accessToken)}
										style={smallButtonStyle}
									>
										Copy
									</button>
								</label>
							</div>
						)}
						{idToken && (
							<div style={{ marginBottom: 12 }}>
								<label>
									<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
										<strong>ID Token (OIDC):</strong>
										<button
											type="button"
											onClick={() => setShowIdModal(true)}
											style={smallButtonStyle}
										>
											Inspect JWT
										</button>
									</div>
									<textarea
										value={idToken}
										readOnly
										style={{ ...inputStyle, fontFamily: 'monospace', fontSize: 11, minHeight: 60 }}
									/>
									<button
										type="button"
										onClick={() => navigator.clipboard.writeText(idToken)}
										style={smallButtonStyle}
									>
										Copy
									</button>
								</label>
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
				<section style={{ marginTop: 16, border: '1px solid #e5e7eb', borderRadius: 8 }}>
					<header
						style={{
							padding: '10px 12px',
							background: '#dbeafe',
							display: 'flex',
							alignItems: 'center',
							gap: 8,
						}}
					>
						<FiBook /> Step 3: Use Access Token
					</header>
					<div style={{ padding: 12 }}>
						<div style={{ display: 'flex', gap: 8 }}>
							<button type="button" onClick={handleUserInfo} style={buttonStyle}>
								Call UserInfo Endpoint
								<V7MInfoIcon
									label=""
									title="About UserInfo Endpoint"
									onClick={() => setShowUserInfoHelp(true)}
								/>
							</button>
							<button type="button" onClick={handleIntrospect} style={buttonStyle}>
								Introspect Token
								<V7MInfoIcon
									label=""
									title="About Token Introspection"
									onClick={() => setShowIntrospectionHelp(true)}
								/>
							</button>
						</div>
						{userinfoResponse && (
							<div style={{ marginTop: 12 }}>
								<label>
									<strong>UserInfo Response:</strong>
									<textarea
										value={JSON.stringify(userinfoResponse, null, 2)}
										readOnly
										style={{ ...inputStyle, fontFamily: 'monospace', fontSize: 11, minHeight: 120 }}
									/>
								</label>
							</div>
						)}
						{introspectionResponse && (
							<div style={{ marginTop: 12 }}>
								<label>
									<strong>Introspection Response:</strong>
									<textarea
										value={JSON.stringify(introspectionResponse, null, 2)}
										readOnly
										style={{ ...inputStyle, fontFamily: 'monospace', fontSize: 11, minHeight: 120 }}
									/>
								</label>
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

const inputStyle: React.CSSProperties = {
	width: '100%',
	padding: '8px 12px',
	border: '1px solid #d1d5db',
	borderRadius: 6,
	fontSize: 14,
	marginTop: 4,
};

const buttonStyle: React.CSSProperties = {
	padding: '10px 16px',
	background: '#3b82f6',
	color: 'white',
	border: 'none',
	borderRadius: 6,
	cursor: 'pointer',
	fontSize: 14,
	fontWeight: 500,
	display: 'inline-flex',
	alignItems: 'center',
	gap: 8,
	marginTop: 12,
};

const smallButtonStyle: React.CSSProperties = {
	padding: '6px 12px',
	background: '#6b7280',
	color: 'white',
	border: 'none',
	borderRadius: 4,
	cursor: 'pointer',
	fontSize: 12,
	marginLeft: 8,
};

export default V7MImplicitFlow;
