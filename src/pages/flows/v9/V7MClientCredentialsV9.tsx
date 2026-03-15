// src/pages/flows/v9/V7MClientCredentialsV9.tsx

import React, { useCallback, useEffect, useState } from 'react';
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
import {
	introspectToken,
	type V9MockIntrospectionResponse,
} from '../../../services/v9/mock/V9MockIntrospectionService';
import {
	tokenExchangeClientCredentials,
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

export const V7MClientCredentialsV9: React.FC = () => {
	const [clientId, setClientId] = useState('v7m-client-credentials');
	const [clientSecret, setClientSecret] = useState('topsecret');
	const [scope, setScope] = useState('read write');
	const [audience, setAudience] = useState('');
	const [tokenResponse, setTokenResponse] = useState<V9MockTokenSuccess | null>(null);
	const [userinfoResponse, setUserinfoResponse] = useState<V9MockUserInfo | null>(null);
	const [introspectionResponse, setIntrospectionResponse] =
		useState<V9MockIntrospectionResponse | null>(null);
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
		showGlobalSuccess('Access token issued', {
			description: 'Client credentials grant complete. Use the token to call protected APIs.',
		});
	}

	const accessToken = tokenResponse?.access_token;

	function handleUserInfo() {
		if (!accessToken) {
			showGlobalError('No access token available');
			return;
		}
		const res = getUserInfoFromAccessToken(accessToken);
		setUserinfoResponse(res);
		showGlobalSuccess('UserInfo retrieved', {
			description: 'Identity claims returned from the UserInfo endpoint.',
		});
	}

	function handleIntrospect() {
		if (!accessToken) {
			showGlobalError('No access token available');
			return;
		}
		const res = introspectToken(accessToken);
		setIntrospectionResponse(res);
		showGlobalSuccess('Token introspected', {
			description: 'Server-side token validation complete.',
		});
	}

	// Track if flow has been executed (for reset button behavior)
	const hasResults = tokenResponse || userinfoResponse || introspectionResponse;
	const currentStep = hasResults ? 1 : 0;

	function handleReset() {
		setTokenResponse(null);
		setUserinfoResponse(null);
		setIntrospectionResponse(null);
		window.scrollTo({ top: 0, behavior: 'smooth' });
		showGlobalSuccess('Flow reset. Start again from step 1.');
	}

	return (
		<div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
			<V7MMockBanner description="This flow simulates OAuth Client Credentials (RFC 6749) for machine-to-machine authentication. No external APIs are called. Tokens are generated deterministically based on your settings." />
			<V9FlowHeader flowId="client-credentials-v9" customConfig={{ flowType: 'pingone' }} />
			<div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
				<V9FlowRestartButton
					onRestart={handleReset}
					currentStep={currentStep}
					totalSteps={1}
					position="header"
				/>
			</div>
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

			<V7MFlowOverview
				title="About this flow"
				description="The client credentials grant is used when the client acts on its own behalf (machine-to-machine). The client authenticates with client_id and client_secret and receives an access token without any user involvement."
				keyPoint="No user is present; the client is the resource owner. Commonly used for service accounts, daemons, and backend-to-backend API access."
				standard="OAuth 2.0 Client Credentials Grant (RFC 6749 §4.4)."
				benefits={[
					'Simple two-legged flow: one POST to the token endpoint.',
					'Suitable for confidential clients that can securely store a secret.',
					'No redirect or browser; ideal for server-to-server and headless apps.',
				]}
				educationalNote="This is a mock implementation. The token endpoint request and response are simulated so you can see the exact parameters and response shape."
			/>

			<section style={MOCK_SECTION_STYLE}>
				<header style={getSectionHeaderStyle('warning')}>
					<span>🔑</span> Request Access Token
					<V7MInfoIcon
						label="What is Client Credentials?"
						title="Client Credentials Grant (RFC 6749)"
						onClick={() => setShowClientCredentialsHelp(true)}
					/>
				</header>
				<div style={getSectionBodyStyle()}>
					{/* Mock API request — educational: what gets sent (RFC 6749 §4.4) */}
					<MockApiCallDisplay
						title="Client Credentials Token Request (RFC 6749)"
						method="POST"
						url={`${DEMO_API_BASE}/${DEMO_ENVIRONMENT_ID}/as/token`}
						headers={{
							'Content-Type': 'application/x-www-form-urlencoded',
							Accept: 'application/json',
						}}
						body={{
							grant_type: 'client_credentials',
							client_id: clientId,
							client_secret: '***REDACTED***',
							...(scope ? { scope } : {}),
							...(audience ? { audience } : {}),
						}}
						response={{
							status: 200,
							statusText: 'OK',
							headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
							data: tokenResponse ?? {
								access_token: 'eyJ...',
								token_type: 'Bearer',
								expires_in: 3600,
							},
						}}
						description="The client POSTs grant_type=client_credentials with client_id and client_secret (or uses Basic auth). No user context is involved."
						note="This is a mock request for learning. No real API call is made; the response is simulated in-browser."
						defaultExpanded={true}
					/>
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
							Audience (optional)
							<input
								value={audience}
								onChange={(e) => setAudience(e.target.value)}
								style={MOCK_INPUT_STYLE}
								placeholder="https://api.example.com"
							/>
						</label>
					</div>
					<button type="button" onClick={handleRequestToken} style={MOCK_PRIMARY_BTN}>
						Request Access Token
					</button>
					{tokenResponse && (
						<div style={{ marginTop: 12 }}>
							<ColoredJsonDisplay
								data={tokenResponse}
								label="Token Response"
								collapsible={true}
								defaultCollapsed={false}
								showCopyButton={true}
							/>
							{accessToken && (
								<div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
									<button
										type="button"
										onClick={() => setShowAccessModal(true)}
										style={MOCK_SECONDARY_BTN}
									>
										Inspect Access Token
									</button>
									<button type="button" onClick={handleIntrospect} style={MOCK_SECONDARY_BTN}>
										Introspect Token
									</button>
									<button type="button" onClick={handleUserInfo} style={MOCK_SECONDARY_BTN}>
										Call UserInfo (Note: May not work for client_credentials tokens)
									</button>
								</div>
							)}
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
										response={{ status: 200, statusText: 'OK', data: userinfoResponse }}
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
										body={`token=${accessToken ? `${encodeURIComponent(accessToken.substring(0, 20))}...` : '***'}`}
										response={{ status: 200, statusText: 'OK', data: introspectionResponse }}
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

export default V7MClientCredentialsV9;
