// src/v7/pages/V7MROPCV9.tsx
/* eslint-disable no-alert */

import { FiAlertTriangle } from '../../icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ColoredUrlDisplay from '../../components/ColoredUrlDisplay';
import { UnifiedCredentialManagerV9 } from '../../components/UnifiedCredentialManagerV9';
import { FlowHeader } from '../../services/flowHeaderService';
import { showGlobalError } from '../../contexts/NotificationSystem';
import {
	introspectToken,
	type V7MIntrospectionResponse,
} from '../../services/v7m/V7MIntrospectionService';
import { tokenExchangePassword, type V7MTokenSuccess } from '../../services/v7m/V7MTokenService';
import {
	getUserInfoFromAccessToken,
	type V7MUserInfo,
} from '../../services/v7m/V7MUserInfoService';
import { V9CredentialStorageService } from '../../services/v9/V9CredentialStorageService';
import { modernMessaging } from '../../services/v9/V9ModernMessagingService';
import { V7MHelpModal } from '../components/V7MHelpModal';
import { V7MInfoIcon } from '../components/V7MInfoIcon';
import { V7MJwtInspectorModal } from '../components/V7MJwtInspectorModal';

type Props = {
	oidc?: boolean;
	title?: string;
};

export const V7MROPCV9: React.FC<Props> = ({
	oidc = false,
	title = 'V7M Resource Owner Password Credentials',
}) => {
	const [variant, setVariant] = useState<'oauth' | 'oidc'>(oidc ? 'oidc' : 'oauth');
	const [clientId, setClientId] = useState('v7m-client');
	const [clientSecret, setClientSecret] = useState('topsecret');
	const [username, setUsername] = useState('jane.doe@example.com');
	const [password, setPassword] = useState('password123');
	const [showPassword, setShowPassword] = useState(false);
	const [scope, setScope] = useState(
		variant === 'oidc' ? 'openid profile email offline_access' : 'read write'
	);
	const [tokenResponse, setTokenResponse] = useState<V7MTokenSuccess | null>(null);
	const [userinfoResponse, setUserinfoResponse] = useState<V7MUserInfo | null>(null);
	const [introspectionResponse, setIntrospectionResponse] =
		useState<V7MIntrospectionResponse | null>(null);
	const [showIdModal, setShowIdModal] = useState(false);
	const [showAccessModal, setShowAccessModal] = useState(false);
	const [showROPCHelp, setShowROPCHelp] = useState(false);
	const [showDeprecationHelp, setShowDeprecationHelp] = useState(false);
	const [showScopesHelp, setShowScopesHelp] = useState(false);
	const [showClientAuthHelp, setShowClientAuthHelp] = useState(false);
	const [showUserInfoHelp, setShowUserInfoHelp] = useState(false);
	const [showIntrospectionHelp, setShowIntrospectionHelp] = useState(false);
	const [copiedRequestUrl, setCopiedRequestUrl] = useState(false);

	useEffect(() => {
		const saved = V9CredentialStorageService.loadSync('v7m-ropc');
		if (saved.clientId) setClientId(saved.clientId);
	}, []);

	const handleAppSelected = useCallback((app: { clientId: string; name: string }) => {
		setClientId(app.clientId);
		V9CredentialStorageService.save('v7m-ropc', { clientId: app.clientId });
	}, []);

	/**
	 * Generate token endpoint URL for ROPC flow
	 * For mock flow, uses a mock token endpoint URL
	 */
	const tokenEndpointUrl = useMemo(() => {
		// For mock flow, use a mock token endpoint
		// In a real implementation, this would be discovered from OIDC well-known config
		return 'https://mock.issuer/v7m/as/token';
	}, []);

	/**
	 * Generate the full POST request URL with form data (for display purposes)
	 * This shows what would be sent to the token endpoint
	 */
	const tokenRequestUrl = useMemo(() => {
		if (!clientId || !username || !password || !scope) {
			return null;
		}

		const params = new URLSearchParams();
		params.append('grant_type', 'password');
		params.append('username', username);
		params.append('password', password);
		params.append('client_id', clientId);
		params.append('client_secret', clientSecret);
		params.append('scope', scope);

		// Return the endpoint URL (form data is in POST body, not URL)
		// But we'll show the full URL with query params for educational purposes
		return `${tokenEndpointUrl}?${params.toString()}`;
	}, [clientId, clientSecret, username, password, scope, tokenEndpointUrl]);

	/**
	 * Generate POST request body (form data) for display
	 */
	const tokenRequestBody = useMemo(() => {
		if (!clientId || !username || !password || !scope) {
			return null;
		}

		const params = new URLSearchParams();
		params.append('grant_type', 'password');
		params.append('username', username);
		params.append('password', password); // Note: In production, password should never be displayed
		params.append('client_id', clientId);
		params.append('client_secret', clientSecret); // Note: In production, secret should never be displayed
		params.append('scope', scope);

		return params.toString();
	}, [clientId, clientSecret, username, password, scope]);

	/**
	 * Copy request URL to clipboard
	 */
	const handleCopyRequestUrl = async () => {
		if (!tokenRequestUrl) return;

		try {
			await navigator.clipboard.writeText(tokenRequestUrl);
			setCopiedRequestUrl(true);
			setTimeout(() => setCopiedRequestUrl(false), 2000);
		} catch {
			modernMessaging.showFooterMessage({
				type: 'error',
				message: 'Failed to copy URL to clipboard',
			});
		}
	};

	function handleRequestToken() {
		const request: Parameters<typeof tokenExchangePassword>[0] = {
			grant_type: 'password',
			username,
			password,
			client_id: clientId,
			client_secret: clientSecret,
			expectedClientSecret: clientSecret,
			scope,
			includeIdToken: variant === 'oidc',
			issuer: 'https://mock.issuer/v7m',
			environmentId: 'mock-env',
			ttls: { accessTokenSeconds: 3600, idTokenSeconds: 3600, refreshTokenSeconds: 86400 },
		};

		// Conditionally include userEmail only if defined
		if (username.includes('@')) {
			request.userEmail = username;
		}

		const res = tokenExchangePassword(request);
		if ('error' in res) {
			showGlobalError(`${res.error}: ${res.error_description ?? ''}`);
			return;
		}
		setTokenResponse(res);
	}

	const accessToken = tokenResponse?.access_token;
	const idToken = tokenResponse?.id_token;

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
					The Resource Owner Password Credentials (ROPC) flow is deprecated in OAuth 2.1. Use
					Authorization Code Flow with PKCE instead. This flow is included for educational purposes
					to understand why it was deprecated.
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
			<FlowHeader flowId="oauth-ropc-v7" />
			<UnifiedCredentialManagerV9
				environmentId="v7m-mock"
				flowKey="v7m-ropc"
				credentials={{ clientId }}
				importExportOptions={{
					flowType: 'v7m-ropc',
					appName: 'V7M ROPC',
					description: 'V7M Mock Resource Owner Password Credentials Flow',
				}}
				onAppSelected={handleAppSelected}
				grantType="password"
				showAppPicker={true}
				showImportExport={true}
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
						border: `2px solid ${variant === 'oauth' ? '#7c3aed' : '#cbd5e1'}`,
						background: variant === 'oauth' ? '#ede9fe' : 'white',
						color: variant === 'oauth' ? '#6b21a8' : '#475569',
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
						setScope('openid profile email offline_access');
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
						background: variant === 'oidc' ? '#dbeafe' : '#ede9fe',
						display: 'flex',
						alignItems: 'center',
						gap: 8,
					}}
				>
					<span>👤</span> Step 1: Request Access Token with User Credentials
					<V7MInfoIcon
						label=""
						title="About Resource Owner Password Credentials"
						onClick={() => setShowROPCHelp(true)}
					/>
				</header>
				<div style={{ padding: 12 }}>
					<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
						<label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
							<span>👤</span> Username
							<V7MInfoIcon
								label=""
								title="The resource owner's username or email"
								onClick={() => {}}
							/>
							<input
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								style={inputStyle}
								placeholder="user@example.com"
							/>
						</label>
						<label style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
							<span>🔒</span> Password
							<V7MInfoIcon label="" title="The resource owner's password" onClick={() => {}} />
							<input
								type={showPassword ? 'text' : 'password'}
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								style={inputStyle}
								placeholder="password"
							/>
							<button
								onClick={() => setShowPassword(!showPassword)}
								style={{
									position: 'absolute',
									right: 8,
									top: 28,
									background: 'none',
									border: 'none',
									cursor: 'pointer',
									padding: 4,
								}}
								type="button"
							>
								{showPassword ? (
									<span style={{ fontSize: '18px' }}>🙈</span>
								) : (
									<span style={{ fontSize: '18px' }}>👁️</span>
								)}
							</button>
						</label>
						<label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
							<span>🔑</span> Client ID
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
							<span>🔑</span> Client Secret
							<V7MInfoIcon
								label="Client authentication"
								title="Basic vs POST client auth"
								onClick={() => setShowClientAuthHelp(true)}
							/>
							<input
								type="password"
								value={clientSecret}
								onChange={(e) => setClientSecret(e.target.value)}
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
					</div>

					{/* Token Request URL Display - Similar to implicit flow */}
					{clientId && username && password && scope && (
						<div style={{ marginTop: '24px', marginBottom: '16px' }}>
							<h3
								style={{
									margin: '0 0 12px 0',
									fontSize: '16px',
									fontWeight: '600',
									color: '#1f2937',
								}}
							>
								📡 Token Request URL
							</h3>
							<p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#6b7280' }}>
								This is the POST request that will be sent to the token endpoint (form data shown in
								query string for educational purposes):
							</p>

							{/* Token Endpoint URL */}
							<div style={{ marginBottom: '16px' }}>
								<ColoredUrlDisplay
									url={tokenEndpointUrl}
									label="Token Endpoint URL"
									showCopyButton={true}
									showInfoButton={false}
									showOpenButton={false}
								/>
							</div>

							{/* POST Request Body (Form Data) */}
							<div
								style={{
									background: '#f9fafb',
									border: '1px solid #e5e7eb',
									borderRadius: '8px',
									padding: '16px',
									marginTop: '16px',
								}}
							>
								<div
									style={{
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'space-between',
										marginBottom: '12px',
									}}
								>
									<h4
										style={{
											margin: 0,
											fontSize: '14px',
											fontWeight: '600',
											color: '#374151',
										}}
									>
										POST Request Body (application/x-www-form-urlencoded)
									</h4>
									<button
										type="button"
										onClick={handleCopyRequestUrl}
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: '6px',
											padding: '6px 12px',
											background: copiedRequestUrl ? '#10b981' : '#fff',
											color: copiedRequestUrl ? '#fff' : '#374151',
											border: '1px solid #d1d5db',
											borderRadius: '6px',
											cursor: 'pointer',
											fontSize: '13px',
											transition: 'all 0.2s',
										}}
									>
										{copiedRequestUrl ? (
											<span style={{ fontSize: '14px' }}>✅</span>
										) : (
											<span style={{ fontSize: '14px' }}>📋</span>
										)}
										{copiedRequestUrl ? 'Copied!' : 'Copy'}
									</button>
								</div>
								{tokenRequestBody && (
									<ColoredUrlDisplay
										url={`https://mock.issuer/v7m/as/token?${tokenRequestBody}`}
										label=""
										showCopyButton={false}
										showInfoButton={false}
										showOpenButton={false}
									/>
								)}
								<div style={{ marginTop: '12px', fontSize: '13px', color: '#6b7280' }}>
									<p style={{ margin: '4px 0' }}>
										<strong>Method:</strong> POST
									</p>
									<p style={{ margin: '4px 0' }}>
										<strong>Content-Type:</strong> application/x-www-form-urlencoded
									</p>
									<p style={{ margin: '4px 0' }}>
										<strong>Body:</strong> {tokenRequestBody}
									</p>
								</div>
							</div>

							<div
								style={{
									background: '#fef3c7',
									border: '1px solid #fbbf24',
									borderRadius: '6px',
									padding: '12px',
									marginTop: '16px',
									fontSize: '13px',
									color: '#92400e',
								}}
							>
								<strong>⚠️ Security Note:</strong> In production, passwords and client secrets
								should never be displayed or logged. This is shown for educational purposes only.
							</div>
						</div>
					)}

					<button type="button" onClick={handleRequestToken} style={primaryBtn}>
						Request Access Token
					</button>
					{tokenResponse && (
						<div style={{ marginTop: 12 }}>
							<div style={{ marginBottom: 12 }}>
								<strong>Token Response:</strong>
								<pre style={preJson}>{JSON.stringify(tokenResponse, null, 2)}</pre>
							</div>
							{accessToken && (
								<div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
									<button
										type="button"
										onClick={() => setShowAccessModal(true)}
										style={secondaryBtn}
									>
										Inspect Access Token
									</button>
									{idToken && (
										<button type="button" onClick={() => setShowIdModal(true)} style={secondaryBtn}>
											Inspect ID Token
										</button>
									)}
									<button type="button" onClick={handleIntrospect} style={secondaryBtn}>
										Introspect Token
									</button>
									<button type="button" onClick={handleUserInfo} style={secondaryBtn}>
										Call UserInfo
										<V7MInfoIcon
											label=""
											title="About UserInfo Endpoint"
											onClick={() => setShowUserInfoHelp(true)}
										/>
									</button>
								</div>
							)}
							{userinfoResponse && (
								<div style={{ marginTop: 12 }}>
									<div>
										<strong>UserInfo Response:</strong>
									</div>
									<pre style={preJson}>{JSON.stringify(userinfoResponse, null, 2)}</pre>
								</div>
							)}
							{introspectionResponse && (
								<div style={{ marginTop: 12 }}>
									<div>
										<strong>Introspection Response:</strong>
									</div>
									<pre style={preJson}>{JSON.stringify(introspectionResponse, null, 2)}</pre>
								</div>
							)}
						</div>
					)}
				</div>
			</section>

			<V7MJwtInspectorModal
				token={accessToken ?? ''}
				open={showAccessModal}
				onClose={() => setShowAccessModal(false)}
			/>
			<V7MJwtInspectorModal
				token={idToken ?? ''}
				open={showIdModal}
				onClose={() => setShowIdModal(false)}
			/>

			<V7MHelpModal
				open={showROPCHelp}
				onClose={() => setShowROPCHelp(false)}
				title="Resource Owner Password Credentials Flow"
			>
				<div>
					<p>
						The Resource Owner Password Credentials (ROPC) flow allows the client to exchange user
						credentials directly for tokens.
					</p>
					<p>
						<strong>How it works:</strong>
					</p>
					<ul>
						<li>User provides username and password to the client application</li>
						<li>Client sends credentials directly to the token endpoint</li>
						<li>Authorization server validates credentials</li>
						<li>Server returns access token (and optionally refresh token and ID token)</li>
					</ul>
					<p>
						<strong>Key characteristics:</strong>
					</p>
					<ul>
						<li>No authorization step - credentials exchanged directly</li>
						<li>Single request to token endpoint</li>
						<li>Requires client authentication</li>
						<li>Supports refresh tokens</li>
						<li>Can include ID token for OIDC variant</li>
					</ul>
				</div>
			</V7MHelpModal>

			<V7MHelpModal
				open={showDeprecationHelp}
				onClose={() => setShowDeprecationHelp(false)}
				title="Why ROPC Flow is Deprecated"
			>
				<div>
					<p>
						<strong>OAuth 2.1 removes the Resource Owner Password Credentials flow</strong> because
						it has significant security issues:
					</p>
					<ul>
						<li>
							<strong>Credential Exposure:</strong> Client applications handle user passwords,
							increasing attack surface
						</li>
						<li>
							<strong>Phishing Risk:</strong> Users must trust the client application with their
							credentials
						</li>
						<li>
							<strong>No Delegation:</strong> Users cannot see or control what permissions are being
							granted
						</li>
						<li>
							<strong>Password Storage:</strong> Clients may be tempted to store passwords
						</li>
						<li>
							<strong>MFA Bypass:</strong> Difficult to integrate multi-factor authentication
						</li>
					</ul>
					<p>
						<strong>Modern Alternative:</strong>
					</p>
					<p>
						Use <strong>Authorization Code Flow with PKCE</strong> instead:
					</p>
					<ul>
						<li>Users authenticate directly with the authorization server</li>
						<li>Clients never see user passwords</li>
						<li>Better security through delegated authentication</li>
						<li>Supports modern authentication methods (MFA, biometrics, etc.)</li>
						<li>Users can see and approve requested permissions</li>
					</ul>
				</div>
			</V7MHelpModal>

			<V7MHelpModal
				open={showScopesHelp}
				onClose={() => setShowScopesHelp(false)}
				title="OAuth Scopes"
			>
				<div>
					<p>Scopes define what permissions the client is requesting.</p>
					<p>
						<strong>OAuth Scopes:</strong> <code>read</code>, <code>write</code>, <code>admin</code>
					</p>
					<p>
						<strong>OIDC Scopes:</strong> <code>openid</code> (required), <code>profile</code>,{' '}
						<code>email</code>, <code>address</code>, <code>phone</code>,{' '}
						<code>offline_access</code> (for refresh token)
					</p>
				</div>
			</V7MHelpModal>

			<V7MHelpModal
				open={showClientAuthHelp}
				onClose={() => setShowClientAuthHelp(false)}
				title="Client Authentication"
			>
				<div>
					<p>Clients authenticate at the token endpoint using Basic auth or client_secret_post.</p>
					<ul>
						<li>
							<strong>Basic</strong>: Authorization: Basic base64(client_id:client_secret)
						</li>
						<li>
							<strong>Post</strong>: send <code>client_id</code> and <code>client_secret</code> in
							body
						</li>
						<li>ROPC flow requires client authentication</li>
					</ul>
				</div>
			</V7MHelpModal>

			<V7MHelpModal
				open={showUserInfoHelp}
				onClose={() => setShowUserInfoHelp(false)}
				title="UserInfo Endpoint"
			>
				<div>
					<p>The UserInfo endpoint returns user profile information.</p>
					<p>Send a GET request with the access token in the Authorization header:</p>
					<pre style={{ background: '#f3f4f6', padding: 12, borderRadius: 4, overflow: 'auto' }}>
						{`GET /userinfo
Authorization: Bearer <access_token>`}
					</pre>
				</div>
			</V7MHelpModal>

			<V7MHelpModal
				open={showIntrospectionHelp}
				onClose={() => setShowIntrospectionHelp(false)}
				title="Token Introspection"
			>
				<div>
					<p>The introspection endpoint validates and returns token metadata.</p>
					<p>Send a POST request with the token:</p>
					<pre style={{ background: '#f3f4f6', padding: 12, borderRadius: 4, overflow: 'auto' }}>
						{`POST /introspect
Content-Type: application/x-www-form-urlencoded

token=<access_token>`}
					</pre>
				</div>
			</V7MHelpModal>
		</div>
	);
};

const inputStyle: React.CSSProperties = {
	display: 'block',
	width: '100%',
	padding: '8px 12px',
	border: '1px solid #d1d5db',
	borderRadius: 6,
	fontSize: 14,
	marginTop: 4,
};

const primaryBtn: React.CSSProperties = {
	marginTop: 10,
	padding: '10px 16px',
	borderRadius: 6,
	border: '1px solid #7c3aed',
	background: '#7c3aed',
	color: '#fff',
	cursor: 'pointer',
	fontSize: 14,
	fontWeight: 500,
};

const secondaryBtn: React.CSSProperties = {
	padding: '6px 10px',
	borderRadius: 6,
	border: '1px solid #94a3b8',
	background: '#fff',
	color: '#0f172a',
	cursor: 'pointer',
	fontSize: 13,
	display: 'inline-flex',
	alignItems: 'center',
	gap: 6,
};

const preJson: React.CSSProperties = {
	background: '#fff',
	border: '1px solid #e5e7eb',
	borderRadius: 6,
	padding: 12,
	whiteSpace: 'pre-wrap',
	wordBreak: 'break-word',
	fontSize: 13,
};

export default V7MROPCV9;
