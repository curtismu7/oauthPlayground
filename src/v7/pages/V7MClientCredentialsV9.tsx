// src/v7/pages/V7MClientCredentialsV9.tsx

import React, { useCallback, useEffect, useState } from 'react';
import { PingOneApiCallDisplay, PingOneApiExamples } from '../../components/PingOneApiCallDisplay';
import { UnifiedCredentialManagerV9 } from '../../components/UnifiedCredentialManagerV9';
import { showGlobalError } from '../../contexts/NotificationSystem';
import { FiBook } from '../../icons';
import { FlowHeader } from '../../services/flowHeaderService';
import {
	introspectToken,
	type V7MIntrospectionResponse,
} from '../../services/v7m/V7MIntrospectionService';
import {
	tokenExchangeClientCredentials,
	type V7MTokenSuccess,
} from '../../services/v7m/V7MTokenService';
import {
	getUserInfoFromAccessToken,
	type V7MUserInfo,
} from '../../services/v7m/V7MUserInfoService';
import { V9CredentialStorageService } from '../../services/v9/V9CredentialStorageService';
import { V7MHelpModal } from '../components/V7MHelpModal';
import { V7MInfoIcon } from '../components/V7MInfoIcon';
import { V7MJwtInspectorModal } from '../components/V7MJwtInspectorModal';

export const V7MClientCredentialsV9: React.FC = () => {
	const [clientId, setClientId] = useState('v7m-client-credentials');
	const [clientSecret, setClientSecret] = useState('topsecret');
	const [scope, setScope] = useState('read write');
	const [audience, setAudience] = useState('');
	const [tokenResponse, setTokenResponse] = useState<V7MTokenSuccess | null>(null);
	const [userinfoResponse, setUserinfoResponse] = useState<V7MUserInfo | null>(null);
	const [introspectionResponse, setIntrospectionResponse] =
		useState<V7MIntrospectionResponse | null>(null);
	const [showAccessModal, setShowAccessModal] = useState(false);
	const [showClientCredentialsHelp, setShowClientCredentialsHelp] = useState(false);
	const [showScopesHelp, setShowScopesHelp] = useState(false);
	const [showClientAuthHelp, setShowClientAuthHelp] = useState(false);
	const [showIntrospectionHelp, setShowIntrospectionHelp] = useState(false);

	useEffect(() => {
		const saved = V9CredentialStorageService.loadSync('v7m-client-credentials');
		if (saved.clientId) setClientId(saved.clientId);
	}, []);

	const handleAppSelected = useCallback((app: { clientId: string; name: string }) => {
		setClientId(app.clientId);
		V9CredentialStorageService.save('v7m-client-credentials', { clientId: app.clientId });
	}, []);

	function handleRequestToken() {
		const res = tokenExchangeClientCredentials({
			grant_type: 'client_credentials',
			client_id: clientId,
			client_secret: clientSecret,
			expectedClientSecret: clientSecret,
			scope,
			...(audience ? { audience } : {}),
			ttls: { accessTokenSeconds: 3600, idTokenSeconds: 3600, refreshTokenSeconds: 86400 },
		});
		if ('error' in res) {
			showGlobalError(`${res.error}: ${res.error_description ?? ''}`);
			return;
		}
		setTokenResponse(res);
	}

	const accessToken = tokenResponse?.access_token;

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
					background: '#fef3c7',
					border: '1px solid #fbbf24',
					borderRadius: 8,
					padding: 12,
					marginBottom: 16,
				}}
			>
				<strong>📚 Educational Mock Mode</strong>
				<p style={{ margin: '8px 0 0 0', fontSize: 14 }}>
					This flow simulates OAuth Client Credentials (RFC 6749) for machine-to-machine
					authentication. No external APIs are called. Tokens are generated deterministically based
					on your settings.
				</p>
			</div>
			<FlowHeader flowId="client-credentials-v7" />
			<UnifiedCredentialManagerV9
				environmentId="v7m-mock"
				flowKey="v7m-client-credentials"
				credentials={{ clientId, clientSecret }}
				importExportOptions={{
					flowType: 'v7m-client-credentials',
					appName: 'Client Credentials',
					description: 'Mock Client Credentials Flow',
				}}
				onAppSelected={handleAppSelected}
				grantType="client_credentials"
				showAppPicker={true}
				showImportExport={true}
			/>

			<section style={{ marginTop: 16, border: '1px solid #e5e7eb', borderRadius: 8 }}>
				<header
					style={{
						padding: '10px 12px',
						background: '#fef3c7',
						display: 'flex',
						alignItems: 'center',
						gap: 8,
					}}
				>
					<span>🔑</span> Request Access Token
					<V7MInfoIcon
						label="What is Client Credentials?"
						title="Client Credentials Grant (RFC 6749)"
						onClick={() => setShowClientCredentialsHelp(true)}
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
							Client Secret
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
							Scope
							<input value={scope} onChange={(e) => setScope(e.target.value)} style={inputStyle} />
							<V7MInfoIcon
								label="About scopes"
								title="How scopes map to tokens and claims"
								onClick={() => setShowScopesHelp(true)}
							/>
						</label>
						<label>
							Audience (optional)
							<input
								value={audience}
								onChange={(e) => setAudience(e.target.value)}
								style={inputStyle}
								placeholder="https://api.example.com"
							/>
						</label>
					</div>
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
								<div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
									<button
										type="button"
										onClick={() => setShowAccessModal(true)}
										style={secondaryBtn}
									>
										Inspect Access Token
									</button>
									<button type="button" onClick={handleIntrospect} style={secondaryBtn}>
										Introspect Token
									</button>
									<button type="button" onClick={handleUserInfo} style={secondaryBtn}>
										Call UserInfo (Note: May not work for client_credentials tokens)
									</button>
								</div>
							)}
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
				open={showAccessModal}
				token={accessToken || ''}
				onClose={() => setShowAccessModal(false)}
			/>

			<V7MHelpModal
				open={showClientCredentialsHelp}
				onClose={() => setShowClientCredentialsHelp(false)}
				title="Client Credentials Grant (RFC 6749)"
				icon={<FiBook color="#fff" />}
				themeColor="#10b981"
			>
				<p>
					The Client Credentials grant is used for machine-to-machine authentication where no user
					context exists.
				</p>
				<ul>
					<li>
						<strong>Use Case:</strong> Service-to-service communication, backend APIs, automated
						processes
					</li>
					<li>
						<strong>No User:</strong> No user authentication or consent step
					</li>
					<li>
						<strong>No Refresh Token:</strong> Client credentials grants typically do not issue
						refresh tokens
					</li>
					<li>
						<strong>Subject:</strong> The <code>sub</code> claim in the access token is usually the{' '}
						<code>client_id</code>
					</li>
					<li>
						<strong>Scopes:</strong> Limit the permissions granted to the client
					</li>
					<li>
						<strong>Audience:</strong> Optional parameter to specify the intended audience of the
						token
					</li>
				</ul>
			</V7MHelpModal>
			<V7MHelpModal
				open={showScopesHelp}
				onClose={() => setShowScopesHelp(false)}
				title="Scopes and Claims"
				icon={<FiBook color="#fff" />}
				themeColor="#fde68a"
			>
				<p>Scopes request permissions and drive which claims appear in tokens.</p>
				<ul>
					<li>
						<code>read</code>: Read access to resources
					</li>
					<li>
						<code>write</code>: Write access to resources
					</li>
					<li>
						<code>admin</code>: Administrative access
					</li>
					<li>Custom scopes can be defined per API</li>
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
					<li>
						Client credentials grant <strong>requires</strong> client authentication
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
				</ul>
			</V7MHelpModal>

			{/* Educational API Call Examples */}
			<div style={{ marginTop: 24 }}>
				<h3 style={{ marginBottom: 16, color: '#1f2937', fontSize: 18, fontWeight: 600 }}>
					📚 Real PingOne API Call Examples
				</h3>
				<p style={{ marginBottom: 20, color: '#6b7280', fontSize: 14 }}>
					These examples show exactly what real PingOne API calls look like for the Client
					Credentials flow. Use these as references when implementing machine-to-machine
					authentication.
				</p>

				<PingOneApiCallDisplay {...PingOneApiExamples.tokenEndpoint} />
			</div>
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
	fontSize: 13,
};

export default V7MClientCredentialsV9;
