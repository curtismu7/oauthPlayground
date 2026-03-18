// src/pages/flows/v9/V7MOAuthAuthCodeV9.tsx

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ColoredJsonDisplay } from '../../../components/ColoredJsonDisplay';
import { MockApiCallDisplay } from '../../../components/MockApiCallDisplay';
import {
	DEMO_API_BASE,
	DEMO_ENVIRONMENT_ID,
	PingOneApiCallDisplay,
	PingOneApiExamples,
} from '../../../components/PingOneApiCallDisplay';
import { UnifiedCredentialManagerV9 } from '../../../components/UnifiedCredentialManagerV9';
import { showGlobalError, showGlobalSuccess } from '../../../contexts/NotificationSystem';
import { V9MockPKCEGenerationService } from '../../../services/v9/mock/core/V9MockPKCEGenerationService';
import { V9MockApiCalls } from '../../../services/v9/mock/V9MockApiLogger';
import {
	authorizeIssueCode,
	V9MockAuthorizeRequest,
} from '../../../services/v9/mock/V9MockAuthorizeService';
import {
	introspectToken,
	type V9MockIntrospectionResponse,
} from '../../../services/v9/mock/V9MockIntrospectionService';
import {
	tokenExchangeAuthorizationCode,
	type V9MockTokenError,
	type V9MockTokenSuccess,
} from '../../../services/v9/mock/V9MockTokenService';
import {
	getUserInfoFromAccessToken,
	type V9MockUserInfo,
} from '../../../services/v9/mock/V9MockUserInfoService';
import { V9CredentialStorageService } from '../../../services/v9/V9CredentialStorageService';
import { V9FlowRestartButton } from '../../../services/v9/V9FlowRestartButton';
import V9FlowHeader from '../../../services/v9/v9FlowHeaderService';
import { V7MJwtInspectorModal } from '../../../v7/components/V7MJwtInspectorModal';
import { V7MMockBanner } from '../../../v7/components/V7MMockBanner';
import {
	MOCK_INPUT_STYLE,
	MOCK_PRIMARY_BTN,
	MOCK_SECONDARY_BTN,
} from '../../../v7/styles/mockFlowStyles';
import { PKCEStorageServiceV8U } from '../../../v8u/services/pkceStorageServiceV8U';

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
	oidc?: boolean;
	title?: string;
};

// ─── Layout helpers ───────────────────────────────────────────────────────────

const STEP_COLORS = {
	1: { accent: '#3b82f6', light: '#eff6ff', border: '#bfdbfe', badge: '#1d4ed8' },
	2: { accent: '#8b5cf6', light: '#f5f3ff', border: '#ddd6fe', badge: '#6d28d9' },
	3: { accent: '#10b981', light: '#f0fdf4', border: '#a7f3d0', badge: '#047857' },
};

const stepContainer = (step: 1 | 2 | 3, active: boolean): React.CSSProperties => ({
	border: `2px solid ${active ? STEP_COLORS[step].accent : '#e5e7eb'}`,
	borderRadius: 12,
	marginTop: 20,
	overflow: 'hidden',
	opacity: active ? 1 : 0.7,
	transition: 'border-color 0.2s, opacity 0.2s',
});

const stepHeader = (step: 1 | 2 | 3): React.CSSProperties => ({
	display: 'flex',
	alignItems: 'center',
	gap: 12,
	padding: '14px 20px',
	background: STEP_COLORS[step].light,
	borderBottom: `1px solid ${STEP_COLORS[step].border}`,
});

const stepBadge = (step: 1 | 2 | 3): React.CSSProperties => ({
	width: 32,
	height: 32,
	borderRadius: '50%',
	background: STEP_COLORS[step].badge,
	color: '#fff',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	fontWeight: 700,
	fontSize: 15,
	flexShrink: 0,
});

const stepBody: React.CSSProperties = { padding: '20px 24px' };

const fieldRow: React.CSSProperties = {
	marginBottom: 18,
};

const fieldLabel: React.CSSProperties = {
	display: 'block',
	fontSize: 13,
	fontWeight: 600,
	color: '#374151',
	marginBottom: 4,
};

const fieldHint: React.CSSProperties = {
	fontSize: 12,
	color: '#6b7280',
	marginTop: 3,
	lineHeight: 1.45,
};

const twoCol: React.CSSProperties = {
	display: 'grid',
	gridTemplateColumns: '1fr 1fr',
	gap: '0 20px',
};

const threeCol: React.CSSProperties = {
	display: 'grid',
	gridTemplateColumns: '1fr 1fr 1fr',
	gap: '0 20px',
};

const explainBox = (step: 1 | 2 | 3): React.CSSProperties => ({
	background: STEP_COLORS[step].light,
	border: `1px solid ${STEP_COLORS[step].border}`,
	borderRadius: 8,
	padding: '14px 16px',
	marginTop: 16,
	fontSize: 13,
	color: '#374151',
	lineHeight: 1.6,
});

const DIVIDER: React.CSSProperties = {
	borderTop: '1px dashed #e5e7eb',
	margin: '18px 0',
};

const pillTag = (color: string): React.CSSProperties => ({
	display: 'inline-block',
	background: color,
	color: '#fff',
	borderRadius: 999,
	fontSize: 11,
	fontWeight: 700,
	padding: '2px 8px',
	marginLeft: 6,
	verticalAlign: 'middle',
});

// ─── Component ────────────────────────────────────────────────────────────────

export const V7MOAuthAuthCodeV9: React.FC<Props> = ({ oidc = false }) => {
	const flowKey = useMemo(() => `v7m-${oidc ? 'oidc' : 'oauth'}-auth-code`, [oidc]);

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
	const [tokenResponse, setTokenResponse] = useState<V9MockTokenSuccess | V9MockTokenError | null>(
		null
	);
	const [showIdModal, setShowIdModal] = useState(false);
	const [showAccessModal, setShowAccessModal] = useState(false);
	const [userinfoResponse, setUserinfoResponse] = useState<V9MockUserInfo | null>(null);
	const [introspectionResponse, setIntrospectionResponse] =
		useState<V9MockIntrospectionResponse | null>(null);

	const responseType = useMemo(() => 'code', []);

	useEffect(() => {
		const saved = V9CredentialStorageService.loadSync('v7m-auth-code');
		if (saved.clientId) setClientId(saved.clientId);
	}, []);

	const handleAppSelected = useCallback((app: { clientId: string; name: string }) => {
		setClientId(app.clientId);
		V9CredentialStorageService.save('v7m-auth-code', { clientId: app.clientId });
	}, []);

	useEffect(() => {
		if (codeVerifier) {
			PKCEStorageServiceV8U.savePKCECodes(flowKey, {
				codeVerifier,
				codeChallenge: codeVerifier,
				codeChallengeMethod,
			});
		}
	}, [codeVerifier, codeChallengeMethod, flowKey]);

	// ── Handlers (logic unchanged) ────────────────────────────────────────────

	async function handleBuildAuthorize() {
		let codeChallenge: string | undefined;
		if (codeChallengeMethod === 'S256') {
			codeChallenge = await V9MockPKCEGenerationService.generateCodeChallenge(codeVerifier, 'S256');
		} else if (codeChallengeMethod === 'plain') {
			codeChallenge = codeVerifier;
		}
		if (codeChallenge) {
			PKCEStorageServiceV8U.savePKCECodes(flowKey, {
				codeVerifier,
				codeChallenge,
				codeChallengeMethod,
			});
		}

		const authOptions: Record<string, string | undefined> = {
			environmentId: 'v7m-mock-env',
			clientId,
			redirectUri,
			scope,
			state,
			codeChallengeMethod,
			responseType: 'code',
		};
		if (codeChallenge) authOptions.codeChallenge = codeChallenge;
		V9MockApiCalls.logAuthorizationEndpoint(authOptions);

		const req: V9MockAuthorizeRequest = {
			response_type: responseType as 'code',
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
			showGlobalError(`${res.error}: ${res.error_description ?? ''}`);
			return;
		}
		setAuthorizationUrl(res.url);
		const params = new URL(res.url, window.location.origin).searchParams;
		setCode(params.get('code') || '');
		showGlobalSuccess('Authorization code issued', {
			description: 'Step 2 is now active — exchange the code for tokens.',
		});
	}

	async function handleExchangeToken() {
		if (!code) {
			showGlobalError('No authorization code available');
			return;
		}

		V9MockApiCalls.logTokenEndpoint({
			environmentId: 'v7m-mock-env',
			clientId,
			code,
			codeVerifier,
			grantType: 'authorization_code',
			redirectUri,
			scope,
		});

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
		if ('error' in res) {
			showGlobalError(`${res.error}: ${res.error_description ?? ''}`);
		} else {
			showGlobalSuccess('Tokens received', {
				description: 'Step 3 is now active — use the access token.',
			});
		}
		setTokenResponse(res);
	}

	const idToken = tokenResponse && 'id_token' in tokenResponse ? tokenResponse.id_token : undefined;
	const accessToken =
		tokenResponse && 'access_token' in tokenResponse ? tokenResponse.access_token : undefined;

	function handleUserInfo() {
		if (!accessToken) {
			showGlobalError('No access token available');
			return;
		}
		V9MockApiCalls.logUserInfoEndpoint({ environmentId: 'v7m-mock-env', accessToken });
		setUserinfoResponse(getUserInfoFromAccessToken(accessToken));
		showGlobalSuccess('UserInfo retrieved', {
			description: 'Identity claims returned from the UserInfo endpoint.',
		});
	}

	function handleIntrospect() {
		if (!accessToken) {
			showGlobalError('No access token available');
			return;
		}
		V9MockApiCalls.logIntrospectionEndpoint({
			environmentId: 'v7m-mock-env',
			token: accessToken,
			clientId,
			clientSecret: expectedSecret,
		});
		setIntrospectionResponse(introspectToken(accessToken));
		showGlobalSuccess('Token introspected', {
			description: 'Server-side token validation complete.',
		});
	}

	const hasResults = tokenResponse || userinfoResponse || introspectionResponse;
	const currentStep = hasResults ? 1 : 0;

	function handleReset() {
		setAuthorizationUrl('');
		setCode('');
		setTokenResponse(null);
		setUserinfoResponse(null);
		setIntrospectionResponse(null);
		window.scrollTo({ top: 0, behavior: 'smooth' });
		showGlobalSuccess('Flow reset. Start again from Step 1.');
	}

	const step2Active = !!code;
	const step3Active = !!accessToken;

	// ── Render ────────────────────────────────────────────────────────────────

	return (
		<div style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>
			{/* Banner */}
			<V7MMockBanner description="This flow is a simulated sandbox — no real network calls, no PingOne account needed. All tokens are generated locally so you can learn the full OAuth Authorization Code flow safely." />

			{/* Page header */}
			<V9FlowHeader flowId="oauth-authorization-code-v9" customConfig={{ flowType: 'pingone' }} />
			<div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
				<V9FlowRestartButton
					onRestart={handleReset}
					currentStep={currentStep}
					totalSteps={1}
					position="header"
				/>
			</div>

			{/* Credentials */}
			<UnifiedCredentialManagerV9
				environmentId="v7m-mock"
				flowKey="v7m-auth-code"
				credentials={{ clientId }}
				importExportOptions={{
					flowType: 'v7m-auth-code',
					appName: 'Authorization Code',
					description: 'Mock OAuth Authorization Code Flow',
				}}
				onAppSelected={handleAppSelected}
				grantType="authorization_code"
				showAppPicker
				showImportExport
			/>

			{/* ── Flow Overview ──────────────────────────────────────────────────── */}
			<div
				style={{
					background: '#f8fafc',
					border: '1px solid #e2e8f0',
					borderRadius: 12,
					padding: '20px 24px',
					marginTop: 16,
				}}
			>
				<h2 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: '#1e293b' }}>
					How Authorization Code Flow Works
				</h2>
				<p style={{ margin: '0 0 14px', fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
					The Authorization Code flow is the recommended OAuth 2.0 grant for most apps. The key
					idea: your app never handles the user's password. Instead the user logs in at the{' '}
					<strong>authorization server</strong>, which redirects back with a short-lived{' '}
					<strong>code</strong>. Your app exchanges the code for tokens in a server-side call.
				</p>
				<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
					{[
						{
							n: '1',
							color: '#3b82f6',
							title: 'Build the Authorization URL',
							body: 'Your app redirects the user to PingOne with parameters describing what access it needs (client_id, scope, PKCE challenge…).',
						},
						{
							n: '2',
							color: '#8b5cf6',
							title: 'Exchange the Code',
							body: 'PingOne redirects back with a one-time code. Your app POSTs that code to the token endpoint and receives an access token (and optionally an ID token).',
						},
						{
							n: '3',
							color: '#10b981',
							title: 'Use the Token',
							body: 'Present the access token as a Bearer header to call protected APIs. Optionally call UserInfo for identity claims, or Introspect to validate the token server-side.',
						},
					].map(({ n, color, title, body }) => (
						<div
							key={n}
							style={{
								background: '#fff',
								border: `1px solid ${color}40`,
								borderRadius: 8,
								padding: '12px 14px',
							}}
						>
							<div style={{ fontWeight: 700, color, fontSize: 13, marginBottom: 4 }}>
								Step {n} — {title}
							</div>
							<div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{body}</div>
						</div>
					))}
				</div>
				<p style={{ margin: '12px 0 0', fontSize: 12, color: '#64748b' }}>
					<strong>PKCE</strong> (RFC 7636) is required for public clients (SPAs, mobile). A random{' '}
					<em>code_verifier</em> is hashed to a <em>code_challenge</em> sent in Step 1; you send the
					verifier in Step 2 so PingOne can verify they match — preventing stolen code attacks.
					{oidc && (
						<>
							{' '}
							| <strong>OpenID Connect</strong> adds the <em>openid</em> scope so you also receive a
							signed <strong>ID token</strong> with identity claims (sub, name, email).
						</>
					)}
				</p>
			</div>

			{/* ══════════════════════════════════════════════════════════════════
			    STEP 1 — Authorization request
			════════════════════════════════════════════════════════════════════ */}
			<div style={stepContainer(1, true)}>
				<div style={stepHeader(1)}>
					<div style={stepBadge(1)}>1</div>
					<div>
						<div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b' }}>
							Build & Send the Authorization Request
							<span style={pillTag('#3b82f6')}>GET /as/authorize</span>
						</div>
						<div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
							Your app builds a URL, redirects the user to PingOne, and PingOne redirects back with
							a one-time authorization code.
						</div>
					</div>
				</div>

				<div style={stepBody}>
					<div style={threeCol}>
						<div style={fieldRow}>
							<label style={fieldLabel} htmlFor="ac-client-id">
								Client ID
							</label>
							<input
								id="ac-client-id"
								value={clientId}
								onChange={(e) => setClientId(e.target.value)}
								style={MOCK_INPUT_STYLE}
							/>
							<div style={fieldHint}>
								Identifies your application. Registered in PingOne under Applications.
							</div>
						</div>
						<div style={fieldRow}>
							<label style={fieldLabel} htmlFor="ac-redirect-uri">
								Redirect URI
							</label>
							<input
								id="ac-redirect-uri"
								value={redirectUri}
								onChange={(e) => setRedirectUri(e.target.value)}
								style={MOCK_INPUT_STYLE}
							/>
							<div style={fieldHint}>
								Where PingOne sends the user after login. Must match what's registered on the app.
							</div>
						</div>
						<div style={fieldRow}>
							<label style={fieldLabel} htmlFor="ac-scope">
								Scope
							</label>
							<input
								id="ac-scope"
								value={scope}
								onChange={(e) => setScope(e.target.value)}
								style={MOCK_INPUT_STYLE}
							/>
							<div style={fieldHint}>
								What access you're requesting.{' '}
								{oidc ? (
									<>
										<code>openid</code> enables OIDC + ID token. <code>profile</code> /{' '}
										<code>email</code> add identity claims.
									</>
								) : (
									<>
										Space-separated permissions, e.g. <code>read write</code>.
									</>
								)}
							</div>
						</div>
						<div style={fieldRow}>
							<label style={fieldLabel} htmlFor="ac-state">
								State <span style={{ fontWeight: 400, color: '#9ca3af' }}>(CSRF token)</span>
							</label>
							<input
								id="ac-state"
								value={state}
								onChange={(e) => setState(e.target.value)}
								style={MOCK_INPUT_STYLE}
							/>
							<div style={fieldHint}>
								A random value your app generates. PingOne echoes it back in the redirect so you can
								detect tampering (CSRF protection).
							</div>
						</div>
						{oidc && (
							<div style={fieldRow}>
								<label style={fieldLabel} htmlFor="ac-nonce">
									Nonce{' '}
									<span style={{ fontWeight: 400, color: '#9ca3af' }}>(replay protection)</span>
								</label>
								<input
									id="ac-nonce"
									value={nonce}
									onChange={(e) => setNonce(e.target.value)}
									style={MOCK_INPUT_STYLE}
								/>
								<div style={fieldHint}>
									Embedded in the ID token. Your app verifies it matches to prevent token replay
									attacks.
								</div>
							</div>
						)}
						<div style={fieldRow}>
							<label style={fieldLabel} htmlFor="ac-user">
								Simulated User Email
							</label>
							<input
								id="ac-user"
								value={userEmail}
								onChange={(e) => setUserEmail(e.target.value)}
								style={MOCK_INPUT_STYLE}
							/>
							<div style={fieldHint}>
								Sandbox only — sets the identity claims in the generated tokens.
							</div>
						</div>
					</div>

					<div style={DIVIDER} />

					<div style={{ ...twoCol, alignItems: 'start' }}>
						<div style={fieldRow}>
							<label style={fieldLabel} htmlFor="ac-method">
								PKCE Challenge Method
							</label>
							<select
								id="ac-method"
								value={codeChallengeMethod}
								onChange={(e) => setCodeChallengeMethod(e.target.value as 'S256' | 'plain')}
								style={MOCK_INPUT_STYLE}
							>
								<option value="S256">S256 (recommended)</option>
								<option value="plain">plain (not recommended)</option>
							</select>
							<div style={fieldHint}>
								<strong>S256</strong>: code_challenge = BASE64URL(SHA-256(code_verifier)).{' '}
								<strong>plain</strong>: challenge = verifier (weaker).
							</div>
						</div>
						<div style={fieldRow}>
							<label style={fieldLabel} htmlFor="ac-verifier">
								Code Verifier <span style={{ fontWeight: 400, color: '#9ca3af' }}>(PKCE)</span>
							</label>
							<input
								id="ac-verifier"
								value={codeVerifier}
								onChange={(e) => setCodeVerifier(e.target.value)}
								style={MOCK_INPUT_STYLE}
							/>
							<div style={fieldHint}>
								A 43–128 character random string generated by your app. Keep it secret — you'll send
								it in Step 2 to prove it was you in Step 1.
							</div>
						</div>
					</div>

					<button
						type="button"
						onClick={handleBuildAuthorize}
						style={{ ...MOCK_PRIMARY_BTN, marginTop: 4 }}
					>
						▶ Build URL &amp; Issue Code
					</button>

					{authorizationUrl && code && (
						<>
							<div style={{ marginTop: 14 }}>
								<div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, color: '#374151' }}>
									Authorization URL sent:
								</div>
								<code
									style={{
										display: 'block',
										background: '#f1f5f9',
										border: '1px solid #cbd5e1',
										borderRadius: 6,
										padding: '10px 12px',
										fontSize: 12,
										wordBreak: 'break-all',
										lineHeight: 1.6,
									}}
								>
									{authorizationUrl}
								</code>
							</div>

							<div
								style={{
									marginTop: 10,
									background: '#f0fdf4',
									border: '1px solid #a7f3d0',
									borderRadius: 6,
									padding: '10px 14px',
								}}
							>
								<span style={{ fontSize: 13, fontWeight: 600, color: '#047857' }}>
									Authorization Code:{' '}
								</span>
								<code style={{ fontSize: 13, color: '#065f46', wordBreak: 'break-all' }}>
									{code}
								</code>
								<div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
									⏱ Short-lived (typically 60–300 seconds). Use it immediately in Step 2 — it's
									one-time-use.
								</div>
							</div>

							{/* Inline API Call Display */}
							<div style={{ marginTop: 12 }}>
								<MockApiCallDisplay
									title="Authorization request → redirect response"
									method="GET"
									url={authorizationUrl}
									response={{
										status: 302,
										statusText: 'Found',
										headers: {
											Location: `${redirectUri}?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`,
										},
										data: {
											redirect: `${redirectUri}?code=...&state=${state}`,
											note: 'Browser follows redirect; app reads code from query string.',
										},
									}}
									defaultExpanded={false}
								/>
							</div>

							<div style={explainBox(1)}>
								<strong>✅ What just happened:</strong> The authorization server validated the
								request and issued a one-time <strong>authorization code</strong> bound to your PKCE
								challenge, client, redirect URI, and user. In a real flow, the user would see a
								login page first. The browser is redirected back to your <code>redirect_uri</code>{' '}
								with <code>?code=…&state=…</code> in the URL.
							</div>
						</>
					)}
				</div>
			</div>

			{/* ══════════════════════════════════════════════════════════════════
			    STEP 2 — Token exchange
			════════════════════════════════════════════════════════════════════ */}
			<div style={stepContainer(2, step2Active)}>
				<div style={stepHeader(2)}>
					<div style={stepBadge(2)}>2</div>
					<div>
						<div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b' }}>
							Exchange the Code for Tokens
							<span style={pillTag('#8b5cf6')}>POST /as/token</span>
						</div>
						<div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
							Your app's <em>backend</em> POSTs the code + PKCE verifier + client credentials to the
							token endpoint. The code is consumed and tokens are returned.
						</div>
					</div>
				</div>

				<div style={stepBody}>
					<div style={fieldRow}>
						<label style={fieldLabel} htmlFor="ac-secret">
							Client Secret{' '}
							<span style={{ fontWeight: 400, color: '#9ca3af' }}>(confidential clients)</span>
						</label>
						<input
							id="ac-secret"
							value={expectedSecret}
							onChange={(e) => setExpectedSecret(e.target.value)}
							style={{ ...MOCK_INPUT_STYLE, maxWidth: 300 }}
						/>
						<div style={fieldHint}>
							Proves your app's identity at the token endpoint. Sent as{' '}
							<code>Authorization: Basic base64(client_id:client_secret)</code> or in the POST body.
							Public clients (SPAs) use PKCE alone — no secret.
						</div>
					</div>

					{!step2Active && (
						<div style={{ color: '#9ca3af', fontSize: 13, fontStyle: 'italic', marginBottom: 12 }}>
							Complete Step 1 first to get an authorization code.
						</div>
					)}

					<button
						type="button"
						onClick={handleExchangeToken}
						disabled={!step2Active}
						style={{
							...MOCK_PRIMARY_BTN,
							...(step2Active ? {} : { background: '#d1d5db', cursor: 'not-allowed' }),
						}}
					>
						▶ Exchange Code for Tokens
					</button>

					{tokenResponse && (
						<>
							{/* Inline API Call Display */}
							<div style={{ marginTop: 12 }}>
								<MockApiCallDisplay
									title="Token request (POST)"
									method="POST"
									url={`${DEMO_API_BASE}/${DEMO_ENVIRONMENT_ID}/as/token`}
									headers={{
										'Content-Type': 'application/x-www-form-urlencoded',
										Authorization: `Basic ${btoa(`${clientId}:***`)}`,
									}}
									body={`grant_type=authorization_code&code=${encodeURIComponent(code)}&redirect_uri=${encodeURIComponent(redirectUri)}&code_verifier=${encodeURIComponent(codeVerifier)}`}
									response={
										'error' in tokenResponse
											? { status: 400, statusText: 'Bad Request', data: tokenResponse }
											: { status: 200, statusText: 'OK', data: tokenResponse }
									}
									defaultExpanded
								/>
							</div>

							<div style={{ marginTop: 12 }}>
								<ColoredJsonDisplay
									data={tokenResponse}
									label="Token Response"
									collapsible
									defaultCollapsed={false}
									showCopyButton
								/>
							</div>

							{'error' in tokenResponse ? (
								<div style={{ ...explainBox(2), borderColor: '#fca5a5', background: '#fef2f2' }}>
									<strong>❌ Token exchange failed:</strong> {tokenResponse.error} —{' '}
									{'error_description' in tokenResponse
										? String(tokenResponse.error_description)
										: 'Check the code verifier and client secret.'}
								</div>
							) : (
								<div style={explainBox(2)}>
									<strong>✅ What just happened:</strong> PingOne verified your authorization code,
									the PKCE verifier (hashes to the challenge you sent in Step 1), and your client
									credentials. The code is now consumed — using it again will fail. You received:
									<ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.7 }}>
										<li>
											<strong>access_token</strong> — present the Bearer token to call protected
											APIs.
										</li>
										{oidc && (
											<li>
												<strong>id_token</strong> — a signed JWT asserting who the user is (sub,
												name, email…).
											</li>
										)}
										{'refresh_token' in tokenResponse && tokenResponse.refresh_token && (
											<li>
												<strong>refresh_token</strong> — exchange for a new access token when it
												expires (no re-login required).
											</li>
										)}
									</ul>
								</div>
							)}

							{'access_token' in tokenResponse && (
								<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
									{idToken && (
										<button
											type="button"
											onClick={() => setShowIdModal(true)}
											style={MOCK_SECONDARY_BTN}
										>
											🔍 Inspect ID Token
										</button>
									)}
									{accessToken && (
										<button
											type="button"
											onClick={() => setShowAccessModal(true)}
											style={MOCK_SECONDARY_BTN}
										>
											🔍 Inspect Access Token
										</button>
									)}
								</div>
							)}
						</>
					)}
				</div>
			</div>

			{/* ══════════════════════════════════════════════════════════════════
			    STEP 3 — Use the token
			════════════════════════════════════════════════════════════════════ */}
			<div style={stepContainer(3, step3Active)}>
				<div style={stepHeader(3)}>
					<div style={stepBadge(3)}>3</div>
					<div>
						<div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b' }}>
							Use the Tokens
							<span style={pillTag('#10b981')}>Optional API calls</span>
						</div>
						<div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
							With your access token you can call protected APIs. Call UserInfo to get identity
							claims or Introspect to validate the token from a resource server.
						</div>
					</div>
				</div>

				<div style={stepBody}>
					{!step3Active && (
						<div style={{ color: '#9ca3af', fontSize: 13, fontStyle: 'italic', marginBottom: 12 }}>
							Complete Step 2 first to receive an access token.
						</div>
					)}

					<div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
						<button
							type="button"
							onClick={handleUserInfo}
							disabled={!step3Active}
							style={{
								...MOCK_PRIMARY_BTN,
								...(step3Active ? {} : { background: '#d1d5db', cursor: 'not-allowed' }),
							}}
						>
							👤 Call UserInfo endpoint
						</button>
						<button
							type="button"
							onClick={handleIntrospect}
							disabled={!step3Active}
							style={{
								...MOCK_SECONDARY_BTN,
								...(step3Active
									? {}
									: {
											background: '#d1d5db',
											cursor: 'not-allowed',
											color: '#fff',
											border: 'none',
										}),
							}}
						>
							🔎 Introspect Token
						</button>
					</div>

					{userinfoResponse && (
						<>
							{/* Inline API Call Display */}
							<div style={{ marginTop: 12 }}>
								<MockApiCallDisplay
									title="UserInfo request (GET)"
									method="GET"
									url={`${DEMO_API_BASE}/${DEMO_ENVIRONMENT_ID}/as/userinfo`}
									headers={{
										Authorization: `Bearer ${accessToken ? `${accessToken.substring(0, 24)}...` : '***'}`,
										Accept: 'application/json',
									}}
									response={{ status: 200, statusText: 'OK', data: userinfoResponse }}
									defaultExpanded
								/>
								<ColoredJsonDisplay
									data={userinfoResponse}
									label="UserInfo Response"
									collapsible
									defaultCollapsed={false}
									showCopyButton
								/>
							</div>
							<div style={explainBox(3)}>
								<strong>👤 UserInfo</strong> (<code>GET /as/userinfo</code>): Send your Bearer
								access token to retrieve the authenticated user's profile. Returns claims based on
								the scopes you requested.{' '}
								{oidc
									? 'For OIDC flows, prefer the ID token for authentication — call UserInfo for fresh or additional claims.'
									: 'In an OAuth-only flow this is how you learn who the user is.'}
							</div>
						</>
					)}

					{introspectionResponse && (
						<>
							{/* Inline API Call Display */}
							<div style={{ marginTop: 12 }}>
								<MockApiCallDisplay
									title="Introspect request (POST)"
									method="POST"
									url={`${DEMO_API_BASE}/${DEMO_ENVIRONMENT_ID}/as/introspect`}
									headers={{
										'Content-Type': 'application/x-www-form-urlencoded',
										Authorization: `Basic ${btoa(`${clientId}:***`)}`,
									}}
									body={`token=${accessToken ? `${encodeURIComponent(accessToken.substring(0, 20))}...` : '***'}`}
									response={{ status: 200, statusText: 'OK', data: introspectionResponse }}
									defaultExpanded
								/>
								<ColoredJsonDisplay
									data={introspectionResponse}
									label="Introspection Response"
									collapsible
									defaultCollapsed={false}
									showCopyButton
								/>
							</div>
							<div style={{ ...explainBox(3), marginTop: userinfoResponse ? 16 : 0 }}>
								<strong>🔎 Token Introspection</strong> (<code>POST /as/introspect</code>, RFC
								7662): Resource servers call this to check whether a token is still{' '}
								<code>active</code> and to read its metadata (scope, exp, sub, client_id). It's more
								reliable than JWT validation alone for sensitive operations because the AS controls
								the answer.
							</div>
						</>
					)}
				</div>
			</div>

			{/* ── JWT Inspect Modals ─────────────────────────────────────────────── */}
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

			{/* ── Real PingOne API Reference ────────────────────────────────────── */}
			<div
				style={{
					marginTop: 28,
					padding: '20px 24px',
					background: '#f8fafc',
					border: '1px solid #e2e8f0',
					borderRadius: 12,
				}}
			>
				<h3 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, color: '#1e293b' }}>
					📚 Real PingOne API Reference
				</h3>
				<p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>
					The examples above are simulated. Below are the exact PingOne endpoint shapes used in
					production.
				</p>
				<PingOneApiCallDisplay {...PingOneApiExamples.authorizationEndpoint} />
				<PingOneApiCallDisplay {...PingOneApiExamples.tokenEndpoint} />
				{oidc && <PingOneApiCallDisplay {...PingOneApiExamples.userInfoEndpoint} />}
			</div>
		</div>
	);
};

export default V7MOAuthAuthCodeV9;
