// src/v7m/pages/V7MOAuthAuthCode.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { FiBook, FiKey, FiSend } from 'react-icons/fi';
import { V7MPKCEGenerationService } from '../../services/v7m/core/V7MPKCEGenerationService';
import { authorizeIssueCode, V7MAuthorizeRequest } from '../../services/v7m/V7MAuthorizeService';
import { introspectToken } from '../../services/v7m/V7MIntrospectionService';
import { tokenExchangeAuthorizationCode } from '../../services/v7m/V7MTokenService';
import { getUserInfoFromAccessToken } from '../../services/v7m/V7MUserInfoService';
import { PKCEStorageServiceV8U } from '../../v8u/services/pkceStorageServiceV8U';
import { V7MHelpModal } from '../components/V7MHelpModal';
import { V7MInfoIcon } from '../components/V7MInfoIcon';
import { V7MJwtInspectorModal } from '../components/V7MJwtInspectorModal';

type Props = {
	oidc?: boolean;
	title?: string;
};

export const V7MOAuthAuthCode: React.FC<Props> = ({
	oidc = false,
	title = 'V7M OAuth Authorization Code',
}) => {
	// Generate flowKey for bulletproof PKCE storage
	const flowKey = useMemo(() => `v7m-${oidc ? 'oidc' : 'oauth'}-auth-code`, [oidc]);

	// Restore PKCE codes from bulletproof storage on mount
	const storedPKCE = PKCEStorageServiceV8U.loadPKCECodes(flowKey);
	const [codeVerifier, setCodeVerifier] = useState(
		storedPKCE?.codeVerifier || 'sample-code-verifier-1234567890'
	);
	const [codeChallengeMethod, setCodeChallengeMethod] = useState<'S256' | 'plain'>(
		(storedPKCE?.codeChallengeMethod as 'S256' | 'plain') || 'S256'
	);

	const [clientId, setClientId] = useState('v7m-client');
	const [redirectUri, setRedirectUri] = useState('/callback');
	const [scope, setScope] = useState(oidc ? 'openid profile email offline_access' : 'read write');
	const [state, setState] = useState('abc123state');
	const [nonce, setNonce] = useState('n-0S6_WzA2Mj');
	const [userEmail, setUserEmail] = useState('jane.doe@example.com');
	const [expectedSecret, setExpectedSecret] = useState('topsecret');
	const [authorizationUrl, setAuthorizationUrl] = useState('');
	const [code, setCode] = useState('');
	const [tokenResponse, setTokenResponse] = useState<any>(null);
	const [showIdModal, setShowIdModal] = useState(false);
	const [showAccessModal, setShowAccessModal] = useState(false);
	const [showPkceHelp, setShowPkceHelp] = useState(false);
	const [showScopesHelp, setShowScopesHelp] = useState(false);
	const [showClientAuthHelp, setShowClientAuthHelp] = useState(false);
	const [showConsentHelp, setShowConsentHelp] = useState(false);
	const [showUserInfoHelp, setShowUserInfoHelp] = useState(false);
	const [showIntrospectionHelp, setShowIntrospectionHelp] = useState(false);
	const [showStateHelp, setShowStateHelp] = useState(false);
	const [showNonceHelp, setShowNonceHelp] = useState(false);
	const [userinfoResponse, setUserinfoResponse] = useState<any>(null);
	const [introspectionResponse, setIntrospectionResponse] = useState<any>(null);

	const responseType = useMemo(() => 'code', []);

	// Persist PKCE codes to bulletproof storage whenever they change
	useEffect(() => {
		if (codeVerifier) {
			// For V7M, we need to compute codeChallenge if using S256
			// For now, save what we have (the verifier)
			// The challenge will be computed when building the authorization URL
			PKCEStorageServiceV8U.savePKCECodes(flowKey, {
				codeVerifier,
				codeChallenge: codeVerifier, // Placeholder - will be computed in handleBuildAuthorize
				codeChallengeMethod,
			});
		}
	}, [codeVerifier, codeChallengeMethod, flowKey]);

	async function handleBuildAuthorize() {
		// Compute codeChallenge if using S256
		let codeChallenge: string | undefined;
		if (codeChallengeMethod === 'S256') {
			codeChallenge = await V7MPKCEGenerationService.generateCodeChallenge(codeVerifier, 'S256');
		} else if (codeChallengeMethod === 'plain') {
			codeChallenge = codeVerifier;
		}

		// Save computed challenge to bulletproof storage
		if (codeChallenge) {
			PKCEStorageServiceV8U.savePKCECodes(flowKey, {
				codeVerifier,
				codeChallenge,
				codeChallengeMethod,
			});
		}

		const req: V7MAuthorizeRequest = {
			response_type: responseType as any,
			client_id: clientId,
			redirect_uri: redirectUri,
			scope,
			state,
			nonce: oidc ? nonce : undefined,
			code_challenge: codeChallenge,
			code_challenge_method: codeChallengeMethod,
			userEmail,
		};
		const res = authorizeIssueCode(req, Math.floor(Date.now() / 1000), 300);
		if (res.type === 'error') {
			alert(`${res.error}: ${res.error_description ?? ''}`);
			return;
		}
		setAuthorizationUrl(res.url);
		const params = new URL(res.url, window.location.origin).searchParams;
		setCode(params.get('code') || '');
	}

	async function handleExchangeToken() {
		if (!code) {
			alert('No authorization code available');
			return;
		}
		const res = tokenExchangeAuthorizationCode({
			grant_type: 'authorization_code',
			code,
			redirect_uri: redirectUri,
			client_id: clientId,
			code_verifier: codeVerifier,
			client_secret: expectedSecret,
			expectedClientSecret: expectedSecret,
			issuer: 'https://mock.issuer/v7m',
			environmentId: 'mock-env',
			scope,
			userEmail,
			includeIdToken: oidc,
			ttls: { accessTokenSeconds: 900, idTokenSeconds: 900, refreshTokenSeconds: 86400 },
		});
		setTokenResponse(res);
	}

	const idToken = tokenResponse?.id_token;
	const accessToken = tokenResponse?.access_token;

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

	return (
		<div style={{ padding: 24 }}>
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
					<FiSend /> Build Authorization Request
				</header>
				<div style={{ padding: 12 }}>
					<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
						<label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
							Client ID
							<V7MInfoIcon
								label=""
								title="Your application's unique identifier registered with the authorization server"
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
								title="The callback URI where the authorization server redirects after consent"
								onClick={() => {}}
							/>
							<input
								value={redirectUri}
								onChange={(e) => setRedirectUri(e.target.value)}
								style={inputStyle}
							/>
						</label>
						<label>
							Scope
							<input value={scope} onChange={(e) => setScope(e.target.value)} style={inputStyle} />
							<V7MInfoIcon
								label="About scopes"
								title="How scopes map to tokens and claims"
								onClick={() => setShowScopesHelp(true)}
							/>
						</label>
						<label>
							<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
								State
								<V7MInfoIcon
									label=""
									title="CSRF protection - echoed back in the redirect to prevent cross-site request forgery"
									onClick={() => setShowStateHelp(true)}
								/>
							</div>
							<input value={state} onChange={(e) => setState(e.target.value)} style={inputStyle} />
						</label>
						{oidc && (
							<label>
								<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
									Nonce
									<V7MInfoIcon
										label=""
										title="Replay protection for ID token - must match nonce in ID token claim"
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
							Code Challenge Method
							<select
								value={codeChallengeMethod}
								onChange={(e) => setCodeChallengeMethod(e.target.value as any)}
								style={inputStyle}
							>
								<option value="S256">S256</option>
								<option value="plain">plain</option>
							</select>
							<V7MInfoIcon
								label="What is PKCE?"
								title="Proof Key for Code Exchange (PKCE)"
								onClick={() => setShowPkceHelp(true)}
							/>
						</label>
						<label>
							Code Verifier
							<input
								value={codeVerifier}
								onChange={(e) => setCodeVerifier(e.target.value)}
								style={inputStyle}
							/>
						</label>
						<label>
							<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
								User Email
								<V7MInfoIcon
									label=""
									title="Email used for user info and ID token claims (educational mock only)"
									onClick={() => {}}
								/>
							</div>
							<input
								value={userEmail}
								onChange={(e) => setUserEmail(e.target.value)}
								style={inputStyle}
							/>
						</label>
						<label>
							Client Secret (for token step)
							<input
								value={expectedSecret}
								onChange={(e) => setExpectedSecret(e.target.value)}
								style={inputStyle}
							/>
							<V7MInfoIcon
								label="Client authentication"
								title="Basic vs POST client auth"
								onClick={() => setShowClientAuthHelp(true)}
							/>
						</label>
					</div>
					<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
						<button type="button" onClick={handleBuildAuthorize} style={primaryBtn}>
							Build & Issue Code
						</button>
						<V7MInfoIcon
							label="About Consent"
							title="Learn about the authorization consent step"
							onClick={() => setShowConsentHelp(true)}
						/>
					</div>
					{authorizationUrl && (
						<div style={{ marginTop: 10 }}>
							<div>
								<strong>Authorization URL:</strong>
							</div>
							<code>{authorizationUrl}</code>
						</div>
					)}
					{code && (
						<div style={{ marginTop: 10 }}>
							<div>
								<strong>Authorization Code:</strong> <code>{code}</code>
							</div>
						</div>
					)}
				</div>
			</section>

			<section style={{ marginTop: 16, border: '1px solid #e5e7eb', borderRadius: 8 }}>
				<header
					style={{
						padding: '10px 12px',
						background: '#d1fae5',
						display: 'flex',
						alignItems: 'center',
						gap: 8,
					}}
				>
					<FiSend /> Exchange Token
				</header>
				<div style={{ padding: 12 }}>
					<button type="button" onClick={handleExchangeToken} style={primaryBtn}>
						Exchange Code for Tokens
					</button>
					{tokenResponse && (
						<div style={{ marginTop: 12 }}>
							<div style={{ marginBottom: 8 }}>
								<strong>Token Response</strong>
							</div>
							<pre style={preJson}>{JSON.stringify(tokenResponse, null, 2)}</pre>
							<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
								{idToken && (
									<button type="button" onClick={() => setShowIdModal(true)} style={secondaryBtn}>
										Inspect ID Token
									</button>
								)}
								{accessToken && (
									<button
										type="button"
										onClick={() => setShowAccessModal(true)}
										style={secondaryBtn}
									>
										Inspect Access Token
									</button>
								)}
								{accessToken && (
									<button type="button" onClick={handleUserInfo} style={secondaryBtn}>
										Call UserInfo
									</button>
								)}
								{accessToken && (
									<button type="button" onClick={handleIntrospect} style={secondaryBtn}>
										Introspect Token
									</button>
								)}
								<V7MInfoIcon
									label="UserInfo vs ID Token"
									title="Learn when to use UserInfo vs ID Token"
									onClick={() => setShowUserInfoHelp(true)}
								/>
								<V7MInfoIcon
									label="Introspection"
									title="Learn about token introspection"
									onClick={() => setShowIntrospectionHelp(true)}
								/>
							</div>
							{userinfoResponse && (
								<div style={{ marginTop: 12 }}>
									<div>
										<strong>UserInfo</strong>
									</div>
									<pre style={preJson}>{JSON.stringify(userinfoResponse, null, 2)}</pre>
								</div>
							)}
							{introspectionResponse && (
								<div style={{ marginTop: 12 }}>
									<div>
										<strong>Introspection</strong>
									</div>
									<pre style={preJson}>{JSON.stringify(introspectionResponse, null, 2)}</pre>
								</div>
							)}
						</div>
					)}
				</div>
			</section>

			<V7MJwtInspectorModal
				open={showIdModal}
				token={idToken || ''}
				onClose={() => setShowIdModal(false)}
			/>
			<V7MJwtInspectorModal
				open={showAccessModal}
				token={accessToken || ''}
				onClose={() => setShowAccessModal(false)}
			/>

			<V7MHelpModal
				open={showPkceHelp}
				onClose={() => setShowPkceHelp(false)}
				title="What is PKCE?"
				icon={<FiBook color="#fff" />}
				themeColor="#fde047"
			>
				<p>
					PKCE (Proof Key for Code Exchange) protects authorization code flow by binding the code to
					a one-time verifier.
				</p>
				<ul>
					<li>Method S256: code_challenge = BASE64URL(SHA256(code_verifier))</li>
					<li>Method plain: code_challenge = code_verifier (not recommended)</li>
				</ul>
			</V7MHelpModal>
			<V7MHelpModal
				open={showScopesHelp}
				onClose={() => setShowScopesHelp(false)}
				title="Scopes and Claims"
				icon={<FiBook color="#fff" />}
				themeColor="#fde68a"
			>
				<p>Scopes request permissions and drive which claims appear in tokens and UserInfo.</p>
				<ul>
					<li>
						<code>openid</code>: enables OIDC and ID token
					</li>
					<li>
						<code>profile</code>: name-related claims
					</li>
					<li>
						<code>email</code>: email and email_verified
					</li>
					<li>
						<code>offline_access</code>: refresh token
					</li>
				</ul>
			</V7MHelpModal>
			<V7MHelpModal
				open={showClientAuthHelp}
				onClose={() => setShowClientAuthHelp(false)}
				title="Client Authentication"
				icon={<FiBook color="#fff" />}
				themeColor="#93c5fd"
			>
				<p>Clients authenticate at the token endpoint using Basic auth or client_secret_post.</p>
				<ul>
					<li>
						<strong>Basic</strong>: Authorization: Basic base64(client_id:client_secret)
					</li>
					<li>
						<strong>Post</strong>: send <code>client_id</code> and <code>client_secret</code> in
						body
					</li>
				</ul>
			</V7MHelpModal>
			<V7MHelpModal
				open={showConsentHelp}
				onClose={() => setShowConsentHelp(false)}
				title="Authorization Consent"
				icon={<FiBook color="#fff" />}
				themeColor="#86efac"
			>
				<p>
					The authorization consent step allows users to review and approve the requested
					permissions (scopes).
				</p>
				<ul>
					<li>Users see which scopes are requested and can approve or deny</li>
					<li>Approval generates an authorization code</li>
					<li>
						Denial returns an <code>access_denied</code> error
					</li>
					<li>Consent can be remembered (implicit approval) for trusted clients</li>
				</ul>
			</V7MHelpModal>
			<V7MHelpModal
				open={showUserInfoHelp}
				onClose={() => setShowUserInfoHelp(false)}
				title="UserInfo vs ID Token"
				icon={<FiBook color="#fff" />}
				themeColor="#c4b5fd"
			>
				<p>Both provide user information, but serve different purposes:</p>
				<ul>
					<li>
						<strong>ID Token</strong>: Signed JWT containing authentication information (sub, iss,
						aud, exp, etc.) plus user claims based on requested scopes. Received during token
						exchange.
					</li>
					<li>
						<strong>UserInfo</strong>: Additional endpoint called with access token to fetch user
						profile data. Can be used to get updated information or additional claims not in the ID
						token.
					</li>
					<li>
						<strong>When to use</strong>: Use ID Token for authentication claims. Call UserInfo if
						you need fresh data or additional profile information.
					</li>
				</ul>
			</V7MHelpModal>
			<V7MHelpModal
				open={showIntrospectionHelp}
				onClose={() => setShowIntrospectionHelp(false)}
				title="Token Introspection"
				icon={<FiBook color="#fff" />}
				themeColor="#a78bfa"
			>
				<p>
					Token introspection (RFC 7662) allows resource servers to check token validity and
					metadata.
				</p>
				<ul>
					<li>
						Returns whether token is <code>active</code> and additional metadata (scope, client_id,
						exp, etc.)
					</li>
					<li>Used by resource servers to validate tokens before granting access</li>
					<li>Requires client authentication</li>
					<li>More secure than JWT validation alone for sensitive resources</li>
				</ul>
			</V7MHelpModal>
			<V7MHelpModal
				open={showStateHelp}
				onClose={() => setShowStateHelp(false)}
				title="State Parameter"
				icon={<FiBook color="#fff" />}
				themeColor="#fb923c"
			>
				<p>
					The <code>state</code> parameter provides CSRF protection for authorization requests.
				</p>
				<ul>
					<li>Include a unique, unpredictable value in the authorization request</li>
					<li>The authorization server echoes it back in the redirect</li>
					<li>Your application verifies the returned value matches what you sent</li>
					<li>Prevents cross-site request forgery attacks</li>
				</ul>
			</V7MHelpModal>
			<V7MHelpModal
				open={showNonceHelp}
				onClose={() => setShowNonceHelp(false)}
				title="Nonce Parameter"
				icon={<FiBook color="#fff" />}
				themeColor="#f472b6"
			>
				<p>
					The <code>nonce</code> parameter provides replay protection for ID tokens (OIDC only).
				</p>
				<ul>
					<li>Include a unique, unpredictable value in the authorization request</li>
					<li>
						The ID token includes this nonce in the <code>nonce</code> claim
					</li>
					<li>Your application must verify the nonce in the ID token matches what you sent</li>
					<li>Prevents ID token replay attacks</li>
				</ul>
			</V7MHelpModal>
		</div>
	);
};

const inputStyle: React.CSSProperties = {
	display: 'block',
	width: '100%',
	padding: '6px 8px',
	border: '1px solid #cbd5e1',
	borderRadius: 6,
	marginTop: 4,
};
const primaryBtn: React.CSSProperties = {
	marginTop: 10,
	padding: '8px 12px',
	borderRadius: 6,
	border: '1px solid #0891b2',
	background: '#06b6d4',
	color: '#fff',
	cursor: 'pointer',
};
const secondaryBtn: React.CSSProperties = {
	padding: '6px 10px',
	borderRadius: 6,
	border: '1px solid #94a3b8',
	background: '#fff',
	color: '#0f172a',
	cursor: 'pointer',
};
const preJson: React.CSSProperties = {
	background: '#fff',
	border: '1px solid #e5e7eb',
	borderRadius: 6,
	padding: 12,
	whiteSpace: 'pre-wrap',
	wordBreak: 'break-word',
};

export default V7MOAuthAuthCode;
