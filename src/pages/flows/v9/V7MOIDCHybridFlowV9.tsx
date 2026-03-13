// src/pages/flows/v9/V7MOIDCHybridFlowV9.tsx
// OIDC Hybrid Flow Mock — V7M educational implementation
// response_type: 'code id_token' (most common) | 'code token' | 'code id_token token'
// Note: Hybrid flow is deprecated per RFC 9700 / OAuth 2.0 Security BCP; presented for learning only.

import React, { useEffect, useState } from 'react';
import { ColoredJsonDisplay } from '../../../components/ColoredJsonDisplay';
import { MockApiCallDisplay } from '../../../components/MockApiCallDisplay';
import { DEMO_API_BASE, DEMO_ENVIRONMENT_ID } from '../../../components/PingOneApiCallDisplay';
import { UnifiedCredentialManagerV9 } from '../../../components/UnifiedCredentialManagerV9';
import { showGlobalError, showGlobalSuccess } from '../../../contexts/NotificationSystem';
import { FiAlertTriangle, FiBook } from '../../../icons';
import {
	authorizeIssueHybrid,
	type V9MockHybridAuthorizeResult,
} from '../../../services/v9/mock/V9MockAuthorizeService';
import {
	introspectToken,
	type V9MockIntrospectionResponse,
} from '../../../services/v9/mock/V9MockIntrospectionService';
import {
	tokenExchangeAuthorizationCode,
	type V9MockTokenSuccess,
} from '../../../services/v9/mock/V9MockTokenService';
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
	MOCK_PRIMARY_BTN_DISABLED,
	MOCK_SECONDARY_BTN,
	MOCK_SECTION_STYLE,
} from '../../../v7/styles/mockFlowStyles';

type ResponseType = 'code id_token' | 'code token' | 'code id_token token';

const RESPONSE_TYPE_OPTIONS: {
	value: ResponseType;
	label: string;
	description: string;
	fragmentParams: string;
	appBehavior: string;
}[] = [
	{
		value: 'code id_token',
		label: 'code id_token (most common)',
		description: 'Code + ID token returned immediately; access token exchanged separately via code',
		fragmentParams: 'code, id_token, state',
		appBehavior:
			'Parse fragment → validate id_token (nonce, c_hash) → exchange code server-side for access_token/refresh_token.',
	},
	{
		value: 'code token',
		label: 'code token',
		description: 'Code + access token returned immediately — no ID token in front channel',
		fragmentParams: 'code, access_token, token_type, expires_in, state',
		appBehavior:
			'Parse fragment → use access_token for API calls; optionally exchange code for refresh_token server-side.',
	},
	{
		value: 'code id_token token',
		label: 'code id_token token',
		description: 'Code + ID token + access token all in front-channel response',
		fragmentParams: 'code, id_token, access_token, token_type, expires_in, state',
		appBehavior:
			'Parse fragment → validate id_token; use access_token for APIs; optionally exchange code for refresh_token.',
	},
];

export const V7MOIDCHybridFlowV9: React.FC = () => {
	const [clientId, setClientId] = useState('v7m-hybrid-client');
	const [redirectUri, setRedirectUri] = useState('/hybrid-callback');
	const [scope, setScope] = useState('openid profile email');
	const [state, setState] = useState('hybrid-state-xyz');
	const [nonce, setNonce] = useState('hybrid-nonce-abc');
	const [userEmail, setUserEmail] = useState('jane.doe@example.com');
	const [responseType, setResponseType] = useState<ResponseType>('code id_token');
	const [hybridResult, setHybridResult] = useState<V9MockHybridAuthorizeResult | null>(null);
	const [tokenCodeResponse, setTokenCodeResponse] = useState<V9MockTokenSuccess | null>(null);
	const [tokenExchangeError, setTokenExchangeError] = useState(false);
	const [introspectionResponse, setIntrospectionResponse] =
		useState<V9MockIntrospectionResponse | null>(null);
	const [showIdTokenModal, setShowIdTokenModal] = useState(false);
	const [showFrontChannelModal, setShowFrontChannelModal] = useState(false);
	const [showBackChannelModal, setShowBackChannelModal] = useState(false);
	const [showHybridHelp, setShowHybridHelp] = useState(false);
	const [showDeprecationHelp, setShowDeprecationHelp] = useState(false);
	const [showNonceHelp, setShowNonceHelp] = useState(false);
	const [showCHashHelp, setShowCHashHelp] = useState(false);

	useEffect(() => {
		const saved = V9CredentialStorageService.loadSync('v7m-oidc-hybrid');
		if (saved.clientId) setClientId(saved.clientId);
	}, []);

	function handleAuthorize() {
		const res = authorizeIssueHybrid(
			{
				response_type: responseType,
				client_id: clientId,
				redirect_uri: redirectUri,
				scope,
				state,
				nonce,
				userEmail,
			},
			Math.floor(Date.now() / 1000),
			300
		);
		setHybridResult(res);
		setTokenCodeResponse(null);
		setTokenExchangeError(false);
		setIntrospectionResponse(null);
	}

	function handleExchangeCode() {
		if (!hybridResult || hybridResult.type !== 'hybrid') {
			showGlobalError('No hybrid result available. Click "Authorize" first.');
			return;
		}
		setTokenExchangeError(false);
		const res = tokenExchangeAuthorizationCode({
			grant_type: 'authorization_code',
			code: hybridResult.code,
			redirect_uri: redirectUri,
			client_id: clientId,
			expectedClientSecret: 'topsecret',
			issuer: 'https://mock.issuer/v7m',
			environmentId: 'mock-env',
			scope,
			userEmail,
			includeIdToken: true,
			ttls: { accessTokenSeconds: 900, idTokenSeconds: 900, refreshTokenSuccess: 86400 } as never,
		});
		if ('error' in res) {
			setTokenExchangeError(true);
			showGlobalError(
				`${res.error}: ${(res as { error_description?: string }).error_description ?? ''}`
			);
			return;
		}
		setTokenCodeResponse(res as V9MockTokenSuccess);
	}

	function handleIntrospect() {
		const token =
			tokenCodeResponse?.access_token ??
			(hybridResult?.type === 'hybrid' ? hybridResult.tokens.access_token : undefined);
		if (!token) {
			showGlobalError('No access token available');
			return;
		}
		setIntrospectionResponse(introspectToken(token));
	}

	const frontChannelIdToken =
		hybridResult?.type === 'hybrid' ? hybridResult.tokens.id_token : undefined;
	const frontChannelAccessToken =
		hybridResult?.type === 'hybrid' ? hybridResult.tokens.access_token : undefined;
	const backChannelAccessToken = tokenCodeResponse?.access_token;

	function handleReset() {
		setHybridResult(null);
		setTokenCodeResponse(null);
		setTokenExchangeError(false);
		setIntrospectionResponse(null);
		window.scrollTo({ top: 0, behavior: 'smooth' });
		showGlobalSuccess('Flow reset. Start again from step 1.');
	}

	return (
		<div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
			<V7MMockBanner
				description="Simulates OIDC Hybrid Flow in-browser. No external APIs are called. The id_token in the front-channel response includes a c_hash claim binding it to the authorization code, and a nonce for replay protection."
				deprecation={{
					short:
						'OIDC Hybrid Flow is deprecated per RFC 9700 / OAuth 2.0 Security BCP. Use Authorization Code + PKCE instead.',
					onLearnMoreClick: () => setShowDeprecationHelp(true),
				}}
			/>
			<V9FlowHeader flowId="oidc-hybrid-v7" customConfig={{ flowType: 'pingone' }} />
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
				flowKey="v7m-oidc-hybrid"
				credentials={{ clientId }}
				importExportOptions={{
					flowType: 'v7m-oidc-hybrid',
					appName: 'OIDC Hybrid Flow',
					description: 'Mock OIDC Hybrid Flow',
				}}
				onAppSelected={(app) => {
					setClientId(app.clientId);
					V9CredentialStorageService.save('v7m-oidc-hybrid', { clientId: app.clientId });
				}}
				grantType="authorization_code"
				showAppPicker={true}
				showImportExport={true}
			/>

			<V7MFlowOverview
				title="About this flow"
				description="OIDC Hybrid flow returns both an authorization code and one or more tokens (id_token, access_token) in the front-channel authorization response. The response_type determines what is returned: code only, code id_token, code token, or code id_token token."
				keyPoint="The id_token in the front-channel response includes a c_hash binding it to the authorization code, and a nonce for replay protection. The client still exchanges the code at the token endpoint for a full token response."
				standard="OpenID Connect Hybrid Flow (OIDC Core §3.3). Deprecated per OAuth 2.0 Security BCP / RFC 9700 in favor of Authorization Code + PKCE."
				benefits={[
					'ID token and optionally access token available before the token endpoint call.',
					'Useful for scenarios that need immediate identity in the redirect.',
					'c_hash and nonce provide binding and replay protection.',
				]}
				educationalNote="This is a mock implementation. Response type, authorization request, and front-channel response are simulated so you can see how response_type affects the redirect payload."
			/>

			<div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
				<V7MInfoIcon
					label=""
					title="OIDC Hybrid Flow overview"
					onClick={() => setShowHybridHelp(true)}
				/>
			</div>

			{/* Response Type Selector */}
			<section style={MOCK_SECTION_STYLE}>
				<header style={getSectionHeaderStyle('info')}>Response Type</header>
				<div style={getSectionBodyStyle()}>
					<p style={{ margin: '0 0 10px 0', fontSize: 13, color: '#374151' }}>
						The &quot;Authorize&quot; button label does not change when you pick a different option
						below, but <strong>the app behavior does</strong>: the authorization server returns
						different data in the redirect (code only, code + id_token, code + access_token, or all
						three) depending on the selected <code>response_type</code>. Choose the option that
						matches what you want in the front-channel response, then click Authorize to see the
						result.
					</p>
					<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
						{RESPONSE_TYPE_OPTIONS.map((opt) => (
							<label
								key={opt.value}
								style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}
							>
								<input
									type="radio"
									name="responseType"
									value={opt.value}
									checked={responseType === opt.value}
									onChange={() => setResponseType(opt.value)}
									style={{ marginTop: 3 }}
								/>
								<div>
									<code style={{ fontWeight: 600 }}>{opt.value}</code>
									<div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
										{opt.description}
									</div>
									<div style={{ fontSize: 12, color: '#059669', marginTop: 4 }}>
										<strong>Redirect fragment contains:</strong> {opt.fragmentParams}
									</div>
									<div
										style={{ fontSize: 12, color: '#4b5563', marginTop: 2, fontStyle: 'italic' }}
									>
										{opt.appBehavior}
									</div>
								</div>
							</label>
						))}
					</div>
					{(() => {
						const selected = RESPONSE_TYPE_OPTIONS.find((o) => o.value === responseType);
						if (!selected) return null;
						return (
							<div
								style={{
									marginTop: 12,
									padding: 10,
									background: '#f0fdf4',
									border: '1px solid #86efac',
									borderRadius: 6,
									fontSize: 13,
									color: '#166534',
								}}
							>
								<strong>With response_type=&quot;{responseType}&quot;</strong>, the redirect URL
								fragment will contain: <code>{selected.fragmentParams}</code>. Your app parses the
								fragment (e.g. <code>window.location.hash</code>) to get the code and tokens.
							</div>
						);
					})()}
				</div>
			</section>

			{/* Step 1: Authorization Request */}
			<section style={MOCK_SECTION_STYLE}>
				<header style={getSectionHeaderStyle('info')}>
					<span>1️⃣</span> Step 1: Authorization Request
				</header>
				<div style={getSectionBodyStyle()}>
					<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
						<label>
							Client ID
							<input
								value={clientId}
								onChange={(e) => setClientId(e.target.value)}
								style={MOCK_INPUT_STYLE}
							/>
						</label>
						<label>
							Redirect URI
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
						</label>
						<label>
							State
							<input
								value={state}
								onChange={(e) => setState(e.target.value)}
								style={MOCK_INPUT_STYLE}
							/>
						</label>
						<label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
							Nonce
							<V7MInfoIcon
								label=""
								title="Replay protection — must match nonce in id_token"
								onClick={() => setShowNonceHelp(true)}
							/>
							<input
								value={nonce}
								onChange={(e) => setNonce(e.target.value)}
								style={MOCK_INPUT_STYLE}
							/>
						</label>
						<label>
							User Email (mock identity)
							<input
								value={userEmail}
								onChange={(e) => setUserEmail(e.target.value)}
								style={MOCK_INPUT_STYLE}
							/>
						</label>
					</div>
					<button type="button" onClick={handleAuthorize} style={MOCK_PRIMARY_BTN}>
						Authorize (Issue Code + Tokens)
					</button>
					{hybridResult && hybridResult.type === 'hybrid' && (
						<div style={{ marginTop: 14 }}>
							<MockApiCallDisplay
								title="Authorization request (GET)"
								method="GET"
								url={`${DEMO_API_BASE}/${DEMO_ENVIRONMENT_ID}/as/authorize?response_type=${encodeURIComponent(responseType)}&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${encodeURIComponent(state)}&nonce=${encodeURIComponent(nonce)}`}
								response={{
									status: 302,
									statusText: 'Found',
									headers: {
										Location: (() => {
											const frag = new URLSearchParams();
											frag.set('code', hybridResult.code);
											frag.set('state', state);
											if (hybridResult.tokens.id_token)
												frag.set('id_token', hybridResult.tokens.id_token);
											if (hybridResult.tokens.access_token)
												frag.set('access_token', hybridResult.tokens.access_token);
											frag.set('token_type', hybridResult.tokens.token_type);
											frag.set('expires_in', String(hybridResult.tokens.expires_in));
											return `${redirectUri}#${frag.toString()}`;
										})(),
									},
									data: {
										note: 'Browser is redirected to redirect_uri with fragment. App parses window.location.hash to get code and tokens.',
									},
								}}
								defaultExpanded={true}
							/>
						</div>
					)}
				</div>
			</section>

			{/* Step 2: Front-Channel Response */}
			{hybridResult && hybridResult.type === 'hybrid' && (
				<section style={MOCK_SECTION_STYLE}>
					<header style={getSectionHeaderStyle('success')}>
						<span>2️⃣</span> Step 2: Front-Channel Response (fragment / redirect)
					</header>
					<div style={getSectionBodyStyle()}>
						<p style={{ margin: '0 0 12px 0', fontSize: 13, color: '#374151', lineHeight: 1.5 }}>
							<strong>What is front channel?</strong> The &quot;front channel&quot; is the path that
							goes through the user&apos;s browser. Here, the authorization server redirects the
							browser to your app with the code and/or tokens in the URL (query or fragment). The
							browser is in the middle — it sees and carries the response.
						</p>
						<p style={{ margin: '0 0 12px 0', fontSize: 13, color: '#374151', lineHeight: 1.5 }}>
							<strong>Good:</strong> You get an{' '}
							<strong>id_token (and optionally access_token) immediately</strong> in the redirect,
							so you can show who the user is or call APIs without waiting for a back-channel code
							exchange. Fewer round trips for simple use cases.
						</p>
						<p style={{ margin: '0 0 12px 0', fontSize: 13, color: '#374151', lineHeight: 1.5 }}>
							<strong>Bad:</strong> Anything in the redirect (URL/fragment) can be{' '}
							<strong>leaked</strong> (browser history, referrer, logs, analytics). Tokens are not
							bound to a confidential client or to the TLS session like in a server-to-server code
							exchange, so they are weaker from a security standpoint. For that reason, hybrid (and
							implicit) flows are deprecated in favor of Authorization Code + PKCE with tokens only
							from the back channel.
						</p>
						<div style={{ marginBottom: 12 }}>
							<MockApiCallDisplay
								title="Redirect (what the app receives in the browser)"
								method="GET"
								url={(() => {
									const frag = new URLSearchParams();
									frag.set('code', hybridResult.code);
									frag.set('state', state);
									if (hybridResult.tokens.id_token)
										frag.set('id_token', hybridResult.tokens.id_token);
									if (hybridResult.tokens.access_token)
										frag.set('access_token', hybridResult.tokens.access_token);
									frag.set('token_type', hybridResult.tokens.token_type);
									frag.set('expires_in', String(hybridResult.tokens.expires_in));
									return `${redirectUri}#${frag.toString()}`;
								})()}
								response={{
									status: 200,
									statusText: 'OK',
									data: {
										note: 'App reads window.location.hash, parses fragment params (code, id_token, access_token, state), validates id_token and c_hash, then may exchange code at token endpoint.',
									},
								}}
								defaultExpanded={true}
							/>
						</div>
						<div
							style={{
								background: '#f0fdf4',
								border: '1px solid #86efac',
								borderRadius: 6,
								padding: 12,
								marginBottom: 12,
							}}
						>
							<div style={{ marginBottom: 8 }}>
								<strong>Authorization Code:</strong>{' '}
								<code style={{ wordBreak: 'break-all' }}>{hybridResult.code}</code>
							</div>
							{hybridResult.tokens.id_token && (
								<div style={{ marginBottom: 8 }}>
									<strong>ID Token (front-channel):</strong>{' '}
									<span style={{ fontSize: 12, color: '#6b7280' }}>
										Contains <code>c_hash</code>{' '}
										<button
											type="button"
											onClick={() => setShowCHashHelp(true)}
											style={{
												color: '#2563eb',
												background: 'none',
												border: 'none',
												cursor: 'pointer',
												padding: 0,
												fontSize: 12,
											}}
										>
											(what is c_hash?)
										</button>
									</span>
									<div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
										<code
											style={{
												fontSize: 11,
												wordBreak: 'break-all',
												flex: 1,
												background: '#fff',
												padding: '4px 6px',
												borderRadius: 4,
												border: '1px solid #e5e7eb',
											}}
										>
											{hybridResult.tokens.id_token.slice(0, 80)}…
										</code>
										<button
											type="button"
											onClick={() => setShowIdTokenModal(true)}
											style={MOCK_SECONDARY_BTN}
										>
											Inspect
										</button>
									</div>
								</div>
							)}
							{hybridResult.tokens.access_token && (
								<div>
									<strong>Access Token (front-channel):</strong>
									<div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
										<code
											style={{
												fontSize: 11,
												wordBreak: 'break-all',
												flex: 1,
												background: '#fff',
												padding: '4px 6px',
												borderRadius: 4,
												border: '1px solid #e5e7eb',
											}}
										>
											{hybridResult.tokens.access_token.slice(0, 80)}…
										</code>
										<button
											type="button"
											onClick={() => setShowFrontChannelModal(true)}
											style={MOCK_SECONDARY_BTN}
										>
											Inspect
										</button>
									</div>
								</div>
							)}
						</div>
					</div>
				</section>
			)}

			{/* Step 3: Back-Channel Code Exchange (optional) */}
			{hybridResult && hybridResult.type === 'hybrid' && (
				<section style={MOCK_SECTION_STYLE}>
					<header style={getSectionHeaderStyle('default')}>
						<span>3️⃣</span> Step 3: Back-Channel Code Exchange (optional — server-side)
					</header>
					<div style={getSectionBodyStyle()}>
						<p style={{ fontSize: 13, color: '#6b7280', marginBottom: 10 }}>
							Exchange the authorization code at the token endpoint (server-to-server). This
							produces a fresh access token bound to the code — stronger than the front-channel
							token.
						</p>
						<button type="button" onClick={handleExchangeCode} style={MOCK_PRIMARY_BTN}>
							Exchange Code → Tokens
						</button>
						{hybridResult && (
							<div style={{ marginTop: 12 }}>
								<MockApiCallDisplay
									title="Token request (POST) — back channel"
									method="POST"
									url={`${DEMO_API_BASE}/${DEMO_ENVIRONMENT_ID}/as/token`}
									headers={{
										'Content-Type': 'application/x-www-form-urlencoded',
										Authorization: 'Basic ' + btoa(`${clientId}:***`),
									}}
									body={`grant_type=authorization_code&code=${encodeURIComponent(hybridResult.type === 'hybrid' ? hybridResult.code : '')}&redirect_uri=${encodeURIComponent(redirectUri)}`}
									response={
										tokenExchangeError
											? {
													status: 400,
													statusText: 'Bad Request',
													data: {
														error: 'invalid_grant',
														error_description:
															'Fix step 3 (e.g. wrong secret, code already used) and try again.',
													},
												}
											: tokenCodeResponse
												? {
														status: 200,
														statusText: 'OK',
														data: tokenCodeResponse,
													}
												: {
														status: 200,
														statusText: 'OK',
														data: {
															note: 'Click "Exchange Code → Tokens" to see the actual response.',
														},
													}
									}
									defaultExpanded={true}
								/>
							</div>
						)}
						{tokenCodeResponse && (
							<div style={{ marginTop: 12 }}>
								<ColoredJsonDisplay
									data={tokenCodeResponse}
									label="Token Endpoint Response"
									collapsible={true}
									defaultCollapsed={false}
									showCopyButton={true}
								/>
							</div>
						)}
					</div>
				</section>
			)}

			{/* Step 4: Introspect — disabled when step 3 (code exchange) failed */}
			{(frontChannelAccessToken || backChannelAccessToken) && (
				<section style={MOCK_SECTION_STYLE}>
					<header style={getSectionHeaderStyle('default')}>
						<span>4️⃣</span> Step 4: Token Introspection
					</header>
					<div style={getSectionBodyStyle()}>
						<button
							type="button"
							onClick={handleIntrospect}
							disabled={tokenExchangeError}
							style={tokenExchangeError ? MOCK_PRIMARY_BTN_DISABLED : MOCK_PRIMARY_BTN}
						>
							Introspect Token
						</button>
						{tokenExchangeError && (
							<p style={{ margin: '8px 0 0 0', fontSize: 13, color: '#6b7280' }}>
								Step 3 (code exchange) failed. Fix the error above and try again, or start over with
								Authorize.
							</p>
						)}
						<div style={{ marginTop: 12 }}>
							<MockApiCallDisplay
								title="Introspect request (POST)"
								method="POST"
								url={`${DEMO_API_BASE}/${DEMO_ENVIRONMENT_ID}/as/introspect`}
								headers={{
									'Content-Type': 'application/x-www-form-urlencoded',
									Authorization: 'Basic ' + btoa(`${clientId}:***`),
								}}
								body={`token=${encodeURIComponent((backChannelAccessToken ?? frontChannelAccessToken ?? '').slice(0, 30))}...`}
								response={
									introspectionResponse
										? {
												status: 200,
												statusText: 'OK',
												data: introspectionResponse,
											}
										: tokenExchangeError
											? {
													status: 400,
													statusText: 'N/A',
													data: {
														note: 'Step 3 (code exchange) failed. Fix it and retry, or start over.',
													},
												}
											: {
													status: 200,
													statusText: 'OK',
													data: {
														note: 'Click "Introspect Token" to see the actual response.',
													},
												}
								}
								defaultExpanded={true}
							/>
						</div>
						{introspectionResponse && (
							<div style={{ marginTop: 12 }}>
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

			{/* JWT Inspector Modals */}
			<V7MJwtInspectorModal
				open={showIdTokenModal}
				token={frontChannelIdToken ?? ''}
				onClose={() => setShowIdTokenModal(false)}
			/>
			<V7MJwtInspectorModal
				open={showFrontChannelModal}
				token={frontChannelAccessToken ?? ''}
				onClose={() => setShowFrontChannelModal(false)}
			/>
			<V7MJwtInspectorModal
				open={showBackChannelModal}
				token={backChannelAccessToken ?? ''}
				onClose={() => setShowBackChannelModal(false)}
			/>

			{/* Help Modals */}
			<V7MHelpModal
				open={showHybridHelp}
				onClose={() => setShowHybridHelp(false)}
				title="OIDC Hybrid Flow"
				icon={<FiBook color="#fff" />}
				themeColor="#6366f1"
			>
				<p>
					OIDC Hybrid Flow combines aspects of the Authorization Code and Implicit flows. The
					authorization endpoint returns both a code <em>and</em> tokens in the same response.
				</p>
				<ul>
					<li>
						The <strong>code</strong> can be exchanged at the token endpoint server-side.
					</li>
					<li>
						The <strong>id_token</strong> contains a <code>c_hash</code> claim that
						cryptographically binds it to the code.
					</li>
					<li>
						The <strong>nonce</strong> in the id_token prevents replay attacks.
					</li>
					<li>Defined in OIDC Core 1.0 §3.3 — now discouraged per OAuth 2.0 Security BCP.</li>
				</ul>
			</V7MHelpModal>

			<V7MHelpModal
				open={showDeprecationHelp}
				onClose={() => setShowDeprecationHelp(false)}
				title="Why is Hybrid Flow Deprecated?"
				icon={<FiAlertTriangle color="#fff" />}
				themeColor="#f59e0b"
			>
				<p>
					<strong>RFC 9700 / OAuth 2.0 Security BCP</strong> states:
				</p>
				<ul>
					<li>
						Tokens in the authorization response are exposed to the browser history, redirects, and
						referrer headers.
					</li>
					<li>
						The front-channel id_token cannot be bound to the TLS session (unlike the back-channel
						code exchange).
					</li>
					<li>Authorization Code + PKCE achieves the same goals with better security posture.</li>
				</ul>
				<p>
					Use this flow for <strong>learning only</strong>. Do not implement in new applications.
				</p>
			</V7MHelpModal>

			<V7MHelpModal
				open={showNonceHelp}
				onClose={() => setShowNonceHelp(false)}
				title="Nonce (Replay Protection)"
				icon={<FiBook color="#fff" />}
				themeColor="#0ea5e9"
			>
				<p>
					The <code>nonce</code> parameter is included in the authorization request and mirrored
					into the id_token's <code>nonce</code> claim. The client MUST verify the nonce in the
					id_token matches the one it sent — this prevents replay attacks where an attacker reuses
					an old id_token.
				</p>
			</V7MHelpModal>

			<V7MHelpModal
				open={showCHashHelp}
				onClose={() => setShowCHashHelp(false)}
				title="c_hash — Code Hash Binding"
				icon={<FiBook color="#fff" />}
				themeColor="#8b5cf6"
			>
				<p>
					<code>c_hash</code> is a claim in the ID token that contains the left-most half of the
					SHA-256 hash of the authorization code, base64url-encoded. It cryptographically binds the
					id_token to the authorization code — an attacker who intercepts the id_token cannot use it
					with a different code.
				</p>
				<p>See OIDC Core 1.0 §3.3.2.11 for the full specification.</p>
			</V7MHelpModal>
		</div>
	);
};

export default V7MOIDCHybridFlowV9;
