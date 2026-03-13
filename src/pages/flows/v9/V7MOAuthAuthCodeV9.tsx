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
import { FiBook } from '../../../icons';
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
import { PKCEStorageServiceV8U } from '../../../v8u/services/pkceStorageServiceV8U';

type Props = {
	oidc?: boolean;
	title?: string;
};

export const V7MOAuthAuthCodeV9: React.FC<Props> = ({
	oidc = false,
	title = 'OAuth Authorization Code',
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
	const [tokenResponse, setTokenResponse] = useState<V9MockTokenSuccess | V9MockTokenError | null>(
		null
	);
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
			codeChallenge = await V9MockPKCEGenerationService.generateCodeChallenge(codeVerifier, 'S256');
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

		// Log mock authorization endpoint call
		const authOptions: any = {
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
	}

	async function handleExchangeToken() {
		if (!code) {
			showGlobalError('No authorization code available');
			return;
		}

		// Log mock token endpoint call
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

		// Log mock userinfo endpoint call
		V9MockApiCalls.logUserInfoEndpoint({
			environmentId: 'v7m-mock-env',
			accessToken,
		});

		const res = getUserInfoFromAccessToken(accessToken);
		setUserinfoResponse(res);
	}

	function handleIntrospect() {
		if (!accessToken) {
			showGlobalError('No access token available');
			return;
		}

		// Log mock token introspection endpoint call
		V9MockApiCalls.logIntrospectionEndpoint({
			environmentId: 'v7m-mock-env',
			token: accessToken,
			clientId,
			clientSecret: expectedSecret,
		});

		const res = introspectToken(accessToken);
		setIntrospectionResponse(res);
	}

	function handleReset() {
		setAuthorizationUrl('');
		setCode('');
		setTokenResponse(null);
		setUserinfoResponse(null);
		setIntrospectionResponse(null);
		window.scrollTo({ top: 0, behavior: 'smooth' });
		showGlobalSuccess('Flow reset. Start again from step 1.');
	}

	return (
		<div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
			<V7MMockBanner description="This flow simulates OAuth/OIDC endpoints for learning. No external APIs are called. Tokens are generated deterministically based on your settings." />
			<V9FlowHeader flowId="oauth-authorization-code-v9" customConfig={{ flowType: 'pingone' }} />
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
				flowKey="v7m-auth-code"
				credentials={{ clientId }}
				importExportOptions={{
					flowType: 'v7m-auth-code',
					appName: 'Authorization Code',
					description: 'Mock OAuth Authorization Code Flow',
				}}
				onAppSelected={handleAppSelected}
				grantType="authorization_code"
				showAppPicker={true}
				showImportExport={true}
			/>

			<V7MFlowOverview
				title="About this flow"
				description="Authorization code flow is the recommended way for web and native apps to get tokens. The client redirects the user to the authorization server; the user signs in and authorizes; the AS redirects back with a short-lived code. The client then exchanges the code for tokens at the token endpoint (with client authentication)."
				keyPoint="The authorization code is a one-time credential exchanged for tokens server-side. With PKCE, public clients can use this flow without a client secret."
				standard="OAuth 2.0 Authorization Code Grant (RFC 6749 §4.1). PKCE: RFC 7636. OpenID Connect: OIDC Core §3.1."
				benefits={[
					'Tokens never appear in the browser URL (unlike implicit).',
					'Client can be authenticated at the token endpoint (confidential clients).',
					'PKCE protects against code interception for public clients.',
				]}
				educationalNote="This is a mock implementation. Build authorization URL, simulate redirect with code, then exchange code for tokens to see the full sequence and request/response shapes."
			/>

			<section style={MOCK_SECTION_STYLE}>
				<header style={getSectionHeaderStyle('info')}>
					<span>📤</span> Build Authorization Request
				</header>
				<div style={getSectionBodyStyle(720)}>
					<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
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
								style={MOCK_INPUT_STYLE}
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
								style={MOCK_INPUT_STYLE}
							/>
						</label>
						<label>
							Scope
							<input
								value={scope}
								onChange={(e) => setScope(e.target.value)}
								style={MOCK_INPUT_STYLE}
							/>
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
							<input
								value={state}
								onChange={(e) => setState(e.target.value)}
								style={MOCK_INPUT_STYLE}
							/>
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
									style={MOCK_INPUT_STYLE}
								/>
							</label>
						)}
						<label>
							Code Challenge Method
							<select
								value={codeChallengeMethod}
								onChange={(e) => setCodeChallengeMethod(e.target.value as 'S256' | 'plain')}
								style={MOCK_INPUT_STYLE}
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
								style={MOCK_INPUT_STYLE}
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
								style={MOCK_INPUT_STYLE}
							/>
						</label>
						<label>
							Client Secret (for token step)
							<input
								value={expectedSecret}
								onChange={(e) => setExpectedSecret(e.target.value)}
								style={MOCK_INPUT_STYLE}
							/>
							<V7MInfoIcon
								label="Client authentication"
								title="Basic vs POST client auth"
								onClick={() => setShowClientAuthHelp(true)}
							/>
						</label>
					</div>
					<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
						<button type="button" onClick={handleBuildAuthorize} style={MOCK_PRIMARY_BTN}>
							Build & Issue Code
						</button>
						<V7MInfoIcon
							label="About Consent"
							title="Learn about the authorization consent step"
							onClick={() => setShowConsentHelp(true)}
						/>
					</div>
					{authorizationUrl && (
						<>
							<div style={{ marginTop: 10 }}>
								<div>
									<strong>Authorization URL:</strong>
								</div>
								<code>{authorizationUrl}</code>
							</div>
							{code && (
								<div style={{ marginTop: 10 }}>
									<div>
										<strong>Authorization Code:</strong> <code>{code}</code>
									</div>
								</div>
							)}
							<div style={{ marginTop: 12 }}>
								<MockApiCallDisplay
									title="Authorization request (GET)"
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
											note: 'Browser follows redirect; app reads code from query.',
										},
									}}
									defaultExpanded={true}
								/>
							</div>
						</>
					)}
				</div>
			</section>

			<section style={MOCK_SECTION_STYLE}>
				<header style={getSectionHeaderStyle('success')}>
					<span>📤</span> Exchange Token
				</header>
				<div style={getSectionBodyStyle()}>
					<button type="button" onClick={handleExchangeToken} style={MOCK_PRIMARY_BTN}>
						Exchange Code for Tokens
					</button>
					{tokenResponse && (
						<>
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
											? {
													status: 400,
													statusText: 'Bad Request',
													data: tokenResponse,
												}
											: {
													status: 200,
													statusText: 'OK',
													data: tokenResponse,
												}
									}
									defaultExpanded={true}
								/>
							</div>
							<div style={{ marginTop: 12 }}>
								<ColoredJsonDisplay
									data={tokenResponse}
									label="Token Response"
									collapsible={true}
									defaultCollapsed={false}
									showCopyButton={true}
								/>
								<div
									style={{
										display: 'flex',
										gap: 8,
										flexWrap: 'wrap',
										alignItems: 'center',
										marginTop: 12,
									}}
								>
									{idToken && (
										<button
											type="button"
											onClick={() => setShowIdModal(true)}
											style={MOCK_SECONDARY_BTN}
										>
											Inspect ID Token
										</button>
									)}
									{accessToken && (
										<button
											type="button"
											onClick={() => setShowAccessModal(true)}
											style={MOCK_SECONDARY_BTN}
										>
											Inspect Access Token
										</button>
									)}
									{accessToken && (
										<button type="button" onClick={handleUserInfo} style={MOCK_SECONDARY_BTN}>
											Call UserInfo
										</button>
									)}
									{accessToken && (
										<button type="button" onClick={handleIntrospect} style={MOCK_SECONDARY_BTN}>
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
										<MockApiCallDisplay
											title="UserInfo request (GET)"
											method="GET"
											url={`${DEMO_API_BASE}/${DEMO_ENVIRONMENT_ID}/as/userinfo`}
											headers={{
												Authorization: `Bearer ${accessToken ? `${accessToken.substring(0, 24)}...` : '***'}`,
												Accept: 'application/json',
											}}
											response={{
												status: 200,
												statusText: 'OK',
												data: userinfoResponse,
											}}
											defaultExpanded={true}
										/>
										<ColoredJsonDisplay
											data={userinfoResponse}
											label="UserInfo"
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
											url={`${DEMO_API_BASE}/${DEMO_ENVIRONMENT_ID}/as/introspect`}
											headers={{
												'Content-Type': 'application/x-www-form-urlencoded',
												Authorization: `Basic ${btoa(`${clientId}:***`)}`,
											}}
											body={`token=${accessToken ? encodeURIComponent(accessToken.substring(0, 20)) + '...' : '***'}`}
											response={{
												status: 200,
												statusText: 'OK',
												data: introspectionResponse,
											}}
											defaultExpanded={true}
										/>
										<ColoredJsonDisplay
											data={introspectionResponse}
											label="Introspection"
											collapsible={true}
											defaultCollapsed={false}
											showCopyButton={true}
										/>
									</div>
								)}
							</div>
						</>
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

			{/* Educational API Call Examples */}
			<div style={{ marginTop: 24 }}>
				<h3 style={{ marginBottom: 16, color: '#1f2937', fontSize: 18, fontWeight: 600 }}>
					📚 Real PingOne API Call Examples
				</h3>
				<p style={{ marginBottom: 20, color: '#6b7280', fontSize: 14 }}>
					These examples show exactly what real PingOne API calls look like. Use these as references
					when implementing OAuth/OIDC with PingOne.
				</p>

				<PingOneApiCallDisplay {...PingOneApiExamples.authorizationEndpoint} />
				<PingOneApiCallDisplay {...PingOneApiExamples.tokenEndpoint} />

				{oidc && <PingOneApiCallDisplay {...PingOneApiExamples.userInfoEndpoint} />}
			</div>
		</div>
	);
};

export default V7MOAuthAuthCodeV9;
