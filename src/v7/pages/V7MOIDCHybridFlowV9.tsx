// src/v7/pages/V7MOIDCHybridFlowV9.tsx
// OIDC Hybrid Flow Mock — V7M educational implementation
// response_type: 'code id_token' (most common) | 'code token' | 'code id_token token'
// Note: Hybrid flow is deprecated per RFC 9700 / OAuth 2.0 Security BCP; presented for learning only.

import React, { useEffect, useState } from 'react';
import { showGlobalError } from '../../contexts/NotificationSystem';
import { FiAlertTriangle, FiBook } from '../../icons';
import { FlowHeader } from '../../services/flowHeaderService';
import {
	authorizeIssueHybrid,
	type V7MHybridAuthorizeResult,
} from '../../services/v7m/V7MAuthorizeService';
import {
	introspectToken,
	type V7MIntrospectionResponse,
} from '../../services/v7m/V7MIntrospectionService';
import {
	tokenExchangeAuthorizationCode,
	type V7MTokenSuccess,
} from '../../services/v7m/V7MTokenService';
import { V9CredentialStorageService } from '../../services/v9/V9CredentialStorageService';
import { V7MHelpModal } from '../components/V7MHelpModal';
import { V7MInfoIcon } from '../components/V7MInfoIcon';
import { V7MJwtInspectorModal } from '../components/V7MJwtInspectorModal';

type ResponseType = 'code id_token' | 'code token' | 'code id_token token';

const RESPONSE_TYPE_OPTIONS: { value: ResponseType; label: string; description: string }[] = [
	{
		value: 'code id_token',
		label: 'code id_token (most common)',
		description: 'Code + ID token returned immediately; access token exchanged separately via code',
	},
	{
		value: 'code token',
		label: 'code token',
		description: 'Code + access token returned immediately — no ID token in front channel',
	},
	{
		value: 'code id_token token',
		label: 'code id_token token',
		description: 'Code + ID token + access token all in front-channel response',
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
	const [hybridResult, setHybridResult] = useState<V7MHybridAuthorizeResult | null>(null);
	const [tokenCodeResponse, setTokenCodeResponse] = useState<V7MTokenSuccess | null>(null);
	const [introspectionResponse, setIntrospectionResponse] =
		useState<V7MIntrospectionResponse | null>(null);
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
		setIntrospectionResponse(null);
	}

	function handleExchangeCode() {
		if (!hybridResult || hybridResult.type !== 'hybrid') {
			showGlobalError('No hybrid result available. Click "Authorize" first.');
			return;
		}
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
			showGlobalError(
				`${res.error}: ${(res as { error_description?: string }).error_description ?? ''}`
			);
			return;
		}
		setTokenCodeResponse(res as V7MTokenSuccess);
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

	return (
		<div style={{ padding: 24 }}>
			{/* Deprecation Banner */}
			<div
				style={{
					background: '#fef3c7',
					border: '1px solid #f59e0b',
					borderRadius: 8,
					padding: 12,
					marginBottom: 12,
					display: 'flex',
					gap: 10,
					alignItems: 'flex-start',
				}}
			>
				<FiAlertTriangle color="#d97706" style={{ marginTop: 2, flexShrink: 0 }} />
				<div>
					<strong>⚠️ Hybrid Flow is Deprecated</strong>
					<p style={{ margin: '4px 0 0 0', fontSize: 13 }}>
						OIDC Hybrid Flow is deprecated per <strong>RFC 9700 / OAuth 2.0 Security BCP</strong>.
						Tokens returned in the authorization response bypass the session binding of the code
						exchange, weakening security. Use Authorization Code + PKCE instead.{' '}
						<button
							type="button"
							onClick={() => setShowDeprecationHelp(true)}
							style={{
								color: '#2563eb',
								background: 'none',
								border: 'none',
								cursor: 'pointer',
								padding: 0,
							}}
						>
							Learn more
						</button>
					</p>
				</div>
			</div>

			{/* Mock Mode Banner */}
			<div
				style={{
					background: '#eff6ff',
					border: '1px solid #93c5fd',
					borderRadius: 8,
					padding: 12,
					marginBottom: 16,
				}}
			>
				<strong>📚 Educational Mock Mode</strong>
				<p style={{ margin: '8px 0 0 0', fontSize: 14 }}>
					Simulates OIDC Hybrid Flow in-browser. No external APIs are called. The id_token in the
					front-channel response includes a <code>c_hash</code> claim binding it to the
					authorization code, and a <code>nonce</code> for replay protection.
				</p>
			</div>

			<FlowHeader flowId="oidc-hybrid-v7" customConfig={{ flowType: 'pingone' }} />
			<div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
				<V7MInfoIcon
					label=""
					title="OIDC Hybrid Flow overview"
					onClick={() => setShowHybridHelp(true)}
				/>
			</div>

			{/* Response Type Selector */}
			<section style={{ marginBottom: 16, border: '1px solid #e5e7eb', borderRadius: 8 }}>
				<header style={{ padding: '10px 12px', background: '#dbeafe', fontWeight: 600 }}>
					Response Type
				</header>
				<div style={{ padding: 12 }}>
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
								</div>
							</label>
						))}
					</div>
				</div>
			</section>

			{/* Step 1: Authorization Request */}
			<section style={{ marginBottom: 16, border: '1px solid #e5e7eb', borderRadius: 8 }}>
				<header
					style={{
						padding: '10px 12px',
						background: '#dbeafe',
						display: 'flex',
						alignItems: 'center',
						gap: 8,
					}}
				>
					<span>1️⃣</span> Step 1: Authorization Request
				</header>
				<div style={{ padding: 12 }}>
					<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
						<label>
							Client ID
							<input
								value={clientId}
								onChange={(e) => setClientId(e.target.value)}
								style={inputStyle}
							/>
						</label>
						<label>
							Redirect URI
							<input
								value={redirectUri}
								onChange={(e) => setRedirectUri(e.target.value)}
								style={inputStyle}
							/>
						</label>
						<label>
							Scope
							<input value={scope} onChange={(e) => setScope(e.target.value)} style={inputStyle} />
						</label>
						<label>
							State
							<input value={state} onChange={(e) => setState(e.target.value)} style={inputStyle} />
						</label>
						<label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
							Nonce
							<V7MInfoIcon
								label=""
								title="Replay protection — must match nonce in id_token"
								onClick={() => setShowNonceHelp(true)}
							/>
							<input value={nonce} onChange={(e) => setNonce(e.target.value)} style={inputStyle} />
						</label>
						<label>
							User Email (mock identity)
							<input
								value={userEmail}
								onChange={(e) => setUserEmail(e.target.value)}
								style={inputStyle}
							/>
						</label>
					</div>
					<button type="button" onClick={handleAuthorize} style={primaryBtn}>
						Authorize (Issue Code + Tokens)
					</button>
				</div>
			</section>

			{/* Step 2: Front-Channel Response */}
			{hybridResult && hybridResult.type === 'hybrid' && (
				<section style={{ marginBottom: 16, border: '1px solid #86efac', borderRadius: 8 }}>
					<header
						style={{
							padding: '10px 12px',
							background: '#d1fae5',
							display: 'flex',
							alignItems: 'center',
							gap: 8,
						}}
					>
						<span>2️⃣</span> Step 2: Front-Channel Response (fragment / redirect)
					</header>
					<div style={{ padding: 12 }}>
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
											style={secondaryBtn}
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
											style={secondaryBtn}
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
				<section style={{ marginBottom: 16, border: '1px solid #e5e7eb', borderRadius: 8 }}>
					<header
						style={{
							padding: '10px 12px',
							background: '#f0f9ff',
							display: 'flex',
							alignItems: 'center',
							gap: 8,
						}}
					>
						<span>3️⃣</span> Step 3: Back-Channel Code Exchange (optional — server-side)
					</header>
					<div style={{ padding: 12 }}>
						<p style={{ fontSize: 13, color: '#6b7280', marginBottom: 10 }}>
							Exchange the authorization code at the token endpoint (server-to-server). This
							produces a fresh access token bound to the code — stronger than the front-channel
							token.
						</p>
						<button type="button" onClick={handleExchangeCode} style={primaryBtn}>
							Exchange Code → Tokens
						</button>
						{tokenCodeResponse && (
							<div style={{ marginTop: 12 }}>
								<strong>Token Endpoint Response:</strong>
								<pre style={preJson}>{JSON.stringify(tokenCodeResponse, null, 2)}</pre>
							</div>
						)}
					</div>
				</section>
			)}

			{/* Step 4: Introspect */}
			{(frontChannelAccessToken || backChannelAccessToken) && (
				<section style={{ marginBottom: 16, border: '1px solid #e5e7eb', borderRadius: 8 }}>
					<header style={{ padding: '10px 12px', background: '#f9fafb' }}>
						<span>4️⃣</span> Step 4: Token Introspection
					</header>
					<div style={{ padding: 12 }}>
						<button type="button" onClick={handleIntrospect} style={primaryBtn}>
							Introspect Token
						</button>
						{introspectionResponse && (
							<pre style={preJson}>{JSON.stringify(introspectionResponse, null, 2)}</pre>
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
	fontSize: 13,
};
const preJson: React.CSSProperties = {
	background: '#fff',
	border: '1px solid #e5e7eb',
	borderRadius: 6,
	padding: 12,
	whiteSpace: 'pre-wrap',
	wordBreak: 'break-word',
	fontSize: 13,
	marginTop: 8,
};

export default V7MOIDCHybridFlowV9;
