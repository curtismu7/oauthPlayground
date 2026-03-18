// src/pages/flows/v9/ClientCredentialsV9.tsx
// Standardized Client Credentials Flow V9 - Using New Infrastructure

import React, { useCallback, useState } from 'react';
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
import { useAutoPopulatedCredentials } from '../../../hooks/useAutoPopulatedCredentials';
import { logMockApiCall, logMockError } from '../../../services/v9/MockFlowLoggingService';
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
import { V9FlowRestartButton } from '../../../services/v9/V9FlowRestartButton';
import V9FlowHeader from '../../../services/v9/v9FlowHeaderService';
import { V7MMockBanner } from '../../../v7/components/V7MMockBanner';
import {
	getSectionBodyStyle,
	getSectionHeaderStyle,
	MOCK_INPUT_STYLE,
	MOCK_PRIMARY_BTN,
	MOCK_SECONDARY_BTN,
	MOCK_SECTION_STYLE,
} from '../../../v7/styles/mockFlowStyles';

const STEP_METADATA = [
	{
		title: 'Configuration',
		subtitle: 'Configure client credentials',
	},
	{
		title: 'Token Request',
		subtitle: 'Request access token',
	},
	{
		title: 'Token Usage',
		subtitle: 'Use access token',
	},
];

export const ClientCredentialsV9: React.FC = () => {
	// Auto-populated credentials (zero-field entry)
	const { credentials, updateCredential } = useAutoPopulatedCredentials({
		flowKey: 'v9:client-credentials',
		flowType: 'client-credentials',
	});

	// Flow state
	const [currentStep, setCurrentStep] = useState(0);
	const [tokenResponse, setTokenResponse] = useState<V9MockTokenSuccess | null>(null);
	const [userinfoResponse, setUserinfoResponse] = useState<V9MockUserInfo | null>(null);
	const [introspectionResponse, setIntrospectionResponse] = useState<V9MockIntrospectionResponse | null>(null);

	// Request access token
	const handleRequestToken = useCallback(async () => {
		try {
			const request = {
				grant_type: 'client_credentials' as const,
				client_id: credentials.clientId || '',
				client_secret: credentials.clientSecret || '',
				scope: credentials.scope || '',
				...(credentials.audience ? { audience: credentials.audience } : {}),
			};

			const res = tokenExchangeClientCredentials({
				...request,
				expectedClientSecret: credentials.clientSecret || '',
				ttls: { accessTokenSeconds: 3600, idTokenSeconds: 3600, refreshTokenSeconds: 86400 },
			});

			if ('error' in res) {
				await logMockError({
					flowName: 'Client Credentials V9',
					error: `${res.error}: ${res.error_description ?? ''}`,
					context: { request },
					logFile: 'oauth.log',
				});
				showGlobalError(`${res.error}: ${res.error_description ?? ''}`);
				return;
			}

			// Log successful API call
			await logMockApiCall({
				flowName: 'Client Credentials V9',
				endpoint: '/token',
				method: 'POST',
				request: {
					...request,
					client_secret: '***REDACTED***',
				},
				response: res,
				logFile: 'oauth.log',
			});

			setTokenResponse(res);
			setCurrentStep(1);
			showGlobalSuccess('Access token issued', {
				description: 'Client credentials grant complete. Use the token to call protected APIs.',
			});
		} catch (error) {
			await logMockError({
				flowName: 'Client Credentials V9',
				error: String(error),
				context: { credentials },
				logFile: 'oauth.log',
			});
			showGlobalError('Token request failed');
		}
	}, [credentials]);

	// Get user info
	const handleUserInfo = useCallback(async () => {
		if (!tokenResponse?.access_token) {
			showGlobalError('No access token available');
			return;
		}

		try {
			const res = getUserInfoFromAccessToken(tokenResponse.access_token);

			await logMockApiCall({
				flowName: 'Client Credentials V9',
				endpoint: '/userinfo',
				method: 'GET',
				request: {
					headers: {
						Authorization: `Bearer ${tokenResponse.access_token.substring(0, 20)}...`,
					},
				},
				response: res,
				logFile: 'oauth.log',
			});

			setUserinfoResponse(res);
			showGlobalSuccess('UserInfo retrieved', {
				description: 'Identity claims returned from the UserInfo endpoint.',
			});
		} catch (error) {
			await logMockError({
				flowName: 'Client Credentials V9',
				error: String(error),
				context: { hasToken: !!tokenResponse },
				logFile: 'oauth.log',
			});
			showGlobalError('UserInfo request failed');
		}
	}, [tokenResponse]);

	// Introspect token
	const handleIntrospect = useCallback(async () => {
		if (!tokenResponse?.access_token) {
			showGlobalError('No access token available');
			return;
		}

		try {
			const res = introspectToken(tokenResponse.access_token);

			await logMockApiCall({
				flowName: 'Client Credentials V9',
				endpoint: '/introspect',
				method: 'POST',
				request: {
					token: `${tokenResponse.access_token.substring(0, 20)}...`,
				},
				response: res,
				logFile: 'oauth.log',
			});

			setIntrospectionResponse(res);
			showGlobalSuccess('Token introspected', {
				description: 'Server-side token validation complete.',
			});
		} catch (error) {
			await logMockError({
				flowName: 'Client Credentials V9',
				error: String(error),
				context: { hasToken: !!tokenResponse },
				logFile: 'oauth.log',
			});
			showGlobalError('Introspection failed');
		}
	}, [tokenResponse]);

	// Restart flow
	const handleRestart = useCallback(() => {
		setTokenResponse(null);
		setUserinfoResponse(null);
		setIntrospectionResponse(null);
		setCurrentStep(0);
		window.scrollTo({ top: 0, behavior: 'smooth' });
		showGlobalSuccess('Flow reset. Start again from step 1.');
	}, []);

	const handleAppSelected = useCallback(
		(app: { clientId: string; name: string }) => {
			updateCredential('clientId', app.clientId);
		},
		[updateCredential]
	);

	return (
		<div style={{ padding: '2rem', maxWidth: '90rem', margin: '0 auto' }}>
			{/* Mock Banner */}
			<V7MMockBanner description="This flow simulates OAuth Client Credentials (RFC 6749) with auto-populated credentials and API call logging. All API calls are logged to oauth.log for debugging." />

			{/* Header */}
			<V9FlowHeader flowId="client-credentials-v9" customConfig={{ flowType: 'pingone' }} />

			{/* Restart Button */}
			<div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
				<V9FlowRestartButton
					onRestart={handleRestart}
					currentStep={currentStep}
					totalSteps={STEP_METADATA.length}
					position="header"
				/>
			</div>

			{/* Credential Manager */}
			<UnifiedCredentialManagerV9
				environmentId="v7m-mock"
				flowKey="v9:client-credentials"
				credentials={{
					clientId: credentials.clientId || '',
					clientSecret: credentials.clientSecret || '',
				}}
				importExportOptions={{
					flowType: 'client-credentials',
					appName: 'Client Credentials',
					description: 'Mock Client Credentials Flow',
				}}
				onAppSelected={handleAppSelected}
				grantType="client_credentials"
				showAppPicker={true}
				showImportExport={true}
			/>

			{/* Info Box */}
			<div
				style={{
					padding: '1rem',
					marginBottom: '1.5rem',
					background: '#eff6ff',
					border: '1px solid #3b82f6',
					borderRadius: '6px',
					color: '#1e40af',
				}}
			>
				<strong>✨ New Features:</strong> Auto-populated credentials (zero-field entry) and API call
				logging to oauth.log for debugging and educational purposes.
			</div>

			{/* Step 1: Configuration */}
			<section style={MOCK_SECTION_STYLE}>
				<header style={getSectionHeaderStyle('info')}>
					<span>1️⃣</span> Configuration (Auto-Populated)
				</header>
				<div style={getSectionBodyStyle()}>
					<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
						<label>
							Client ID
							<input
								value={credentials.clientId || ''}
								onChange={(e) => updateCredential('clientId', e.target.value)}
								style={MOCK_INPUT_STYLE}
							/>
						</label>
						<label>
							Client Secret
							<input
								type="password"
								value={credentials.clientSecret || ''}
								onChange={(e) => updateCredential('clientSecret', e.target.value)}
								style={MOCK_INPUT_STYLE}
							/>
						</label>
						<label>
							Scope
							<input
								value={credentials.scope || ''}
								onChange={(e) => updateCredential('scope', e.target.value)}
								style={MOCK_INPUT_STYLE}
								placeholder="read write"
							/>
						</label>
						<label>
							Audience (optional)
							<input
								value={credentials.audience || ''}
								onChange={(e) => updateCredential('audience', e.target.value)}
								style={MOCK_INPUT_STYLE}
								placeholder="https://api.example.com"
							/>
						</label>
					</div>
				</div>
			</section>

			{/* Step 2: Token Request */}
			<section style={MOCK_SECTION_STYLE}>
				<header style={getSectionHeaderStyle('success')}>
					<span>2️⃣</span> Request Access Token
				</header>
				<div style={getSectionBodyStyle()}>
					{/* Educational API Call Display */}
					<MockApiCallDisplay
						title="Client Credentials Token Request (RFC 6749 §4.4)"
						method="POST"
						url={`${DEMO_API_BASE}/${DEMO_ENVIRONMENT_ID}/as/token`}
						headers={{
							'Content-Type': 'application/x-www-form-urlencoded',
							Accept: 'application/json',
						}}
						body={{
							grant_type: 'client_credentials',
							client_id: credentials.clientId || '',
							client_secret: '***REDACTED***',
							...(credentials.scope ? { scope: credentials.scope } : {}),
							...(credentials.audience ? { audience: credentials.audience } : {}),
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
						description="The client POSTs grant_type=client_credentials with client_id and client_secret. No user context is involved - this is machine-to-machine authentication."
						note="This is a mock request for learning. No real API call is made; the response is simulated in-browser and logged to oauth.log."
						defaultExpanded={true}
					/>

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
						</div>
					)}
				</div>
			</section>

			{/* Step 3: Token Usage */}
			{tokenResponse && (
				<section style={MOCK_SECTION_STYLE}>
					<header style={getSectionHeaderStyle('warning')}>
						<span>3️⃣</span> Use Access Token
					</header>
					<div style={getSectionBodyStyle()}>
						<div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
							<button type="button" onClick={handleIntrospect} style={MOCK_SECONDARY_BTN}>
								Introspect Token
							</button>
							<button type="button" onClick={handleUserInfo} style={MOCK_SECONDARY_BTN}>
								Call UserInfo
							</button>
						</div>

						{introspectionResponse && (
							<div style={{ marginTop: 12 }}>
								<MockApiCallDisplay
									title="Token Introspection Request (RFC 7662)"
									method="POST"
									url={`${DEMO_API_BASE}/${DEMO_ENVIRONMENT_ID}/as/introspect`}
									headers={{
										'Content-Type': 'application/x-www-form-urlencoded',
										Authorization: `Basic ${btoa(`${credentials.clientId}:***`)}`,
									}}
									body={`token=${tokenResponse?.access_token ? `${encodeURIComponent(tokenResponse.access_token.substring(0, 20))}...` : '***'}`}
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

						{userinfoResponse && (
							<div style={{ marginTop: 12 }}>
								<MockApiCallDisplay
									title="UserInfo Request (GET)"
									method="GET"
									url={`${DEMO_API_BASE}/${DEMO_ENVIRONMENT_ID}/as/userinfo`}
									headers={{
										Authorization: `Bearer ${tokenResponse?.access_token ? `${tokenResponse.access_token.substring(0, 24)}...` : '***'}`,
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
					</div>
				</section>
			)}

			{/* Educational API Call Examples */}
			<div style={{ marginTop: 24 }}>
				<h3 style={{ marginBottom: 16, color: '#1f2937', fontSize: 18, fontWeight: 600 }}>
					📚 Real PingOne API Call Examples
				</h3>
				<p style={{ marginBottom: 20, color: '#6b7280', fontSize: 14 }}>
					These examples show exactly what real PingOne API calls look like for the Client
					Credentials flow. Use these as references when implementing machine-to-machine
					authentication in your applications.
				</p>

				<PingOneApiCallDisplay {...PingOneApiExamples.tokenEndpoint} />
			</div>
		</div>
	);
};

export default ClientCredentialsV9;
