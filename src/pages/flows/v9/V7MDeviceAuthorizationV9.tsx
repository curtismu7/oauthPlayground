// src/pages/flows/v9/V7MDeviceAuthorizationV9.tsx
// lint-file-disable: token-value-in-jsx

import React, { useCallback, useEffect, useState } from 'react';
import { CodeExamplesSection } from '../../../components/CodeExamplesSection';
import { ColoredJsonDisplay } from '../../../components/ColoredJsonDisplay';
import { MockApiCallDisplay } from '../../../components/MockApiCallDisplay';
import { DEMO_API_BASE, DEMO_ENVIRONMENT_ID } from '../../../components/PingOneApiCallDisplay';
import { UnifiedCredentialManagerV9 } from '../../../components/UnifiedCredentialManagerV9';
import {
	showGlobalError,
	showGlobalSuccess,
	showGlobalWarning,
} from '../../../contexts/NotificationSystem';
import { FiBook } from '../../../icons';
import {
	requestDeviceAuthorization,
	type V9MockDeviceAuthorizationResponse,
} from '../../../services/v9/mock/V9MockDeviceAuthorizationService';
import {
	introspectToken,
	type V9MockIntrospectionResponse,
} from '../../../services/v9/mock/V9MockIntrospectionService';
import { V9MockStateStore } from '../../../services/v9/mock/V9MockStateStore';
import {
	tokenExchangeDeviceCode,
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
	MOCK_COPY_BTN,
	MOCK_INPUT_STYLE,
	MOCK_PRIMARY_BTN,
	MOCK_SECONDARY_BTN,
	MOCK_SECTION_STYLE,
} from '../../../v7/styles/mockFlowStyles';

export const V7MDeviceAuthorizationV9: React.FC = () => {
	const [clientId, setClientId] = useState('v7m-device-client');
	const [scope, setScope] = useState('read write');
	const [userEmail, setUserEmail] = useState('jane.doe@example.com');
	const [expectedSecret, setExpectedSecret] = useState('topsecret');
	const [deviceCode, setDeviceCode] = useState('');
	const [userCode, setUserCode] = useState('');
	const [verificationUri, setVerificationUri] = useState('');
	const [deviceResponse, setDeviceResponse] = useState<V9MockDeviceAuthorizationResponse | null>(
		null
	);
	const [tokenResponse, setTokenResponse] = useState<V9MockTokenSuccess | null>(null);
	const [userinfoResponse, setUserinfoResponse] = useState<V9MockUserInfo | null>(null);
	const [introspectionResponse, setIntrospectionResponse] =
		useState<V9MockIntrospectionResponse | null>(null);
	const [showAccessModal, setShowAccessModal] = useState(false);
	const [showDeviceHelp, setShowDeviceHelp] = useState(false);
	const [showScopesHelp, setShowScopesHelp] = useState(false);
	const [showClientAuthHelp, setShowClientAuthHelp] = useState(false);
	const [showUserInfoHelp, setShowUserInfoHelp] = useState(false);
	const [showIntrospectionHelp, setShowIntrospectionHelp] = useState(false);
	const [isApproved, setIsApproved] = useState(false);

	useEffect(() => {
		const saved = V9CredentialStorageService.loadSync('v7m-device-authorization');
		if (saved.clientId) setClientId(saved.clientId);
	}, []);

	const handleAppSelected = useCallback((app: { clientId: string; name: string }) => {
		setClientId(app.clientId);
		V9CredentialStorageService.save('v7m-device-authorization', { clientId: app.clientId });
	}, []);

	function handleRequestDeviceAuth() {
		const res = requestDeviceAuthorization(
			{
				client_id: clientId,
				scope,
				userEmail,
			},
			Math.floor(Date.now() / 1000)
		);
		if ('error' in res) {
			showGlobalError(`${res.error}: ${res.error_description ?? ''}`);
			return;
		}
		setDeviceCode(res.device_code);
		setUserCode(res.user_code);
		setVerificationUri(res.verification_uri);
		setDeviceResponse(res);
		setIsApproved(false);
		showGlobalSuccess('Device code issued', {
			description: `User should visit the verification URL and enter the code: ${res.user_code}`,
		});
	}

	function handleApproveDevice() {
		if (!deviceCode) {
			showGlobalError('No device code available. Request device authorization first.');
			return;
		}
		const approved = V9MockStateStore.approveDeviceCode(deviceCode);
		if (approved) {
			setIsApproved(true);
			showGlobalSuccess('Device approved! You can now poll for tokens.');
		} else {
			showGlobalError('Failed to approve device. Device code may be expired.');
		}
	}

	async function handlePollToken() {
		if (!deviceCode) {
			showGlobalError('No device code available');
			return;
		}
		if (!isApproved) {
			showGlobalWarning('Device not yet approved. Click "Simulate User Approval" first.');
			return;
		}
		const res = tokenExchangeDeviceCode({
			grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
			device_code: deviceCode,
			client_id: clientId,
			client_secret: expectedSecret,
			expectedClientSecret: expectedSecret,
			scope,
			userEmail,
			includeIdToken: false,
			ttls: { accessTokenSeconds: 3600, idTokenSeconds: 3600, refreshTokenSeconds: 86400 },
		});
		if ('error' in res) {
			if (res.error === 'authorization_pending') {
				showGlobalWarning(
					'User has not yet approved the device. Click "Simulate User Approval" first.'
				);
			} else {
				showGlobalError(`${res.error}: ${res.error_description ?? ''}`);
			}
			return;
		}
		setTokenResponse(res);
		showGlobalSuccess('Tokens received', {
			description: 'Device authorization grant complete. Access token ready to use.',
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

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text);
		showGlobalSuccess('Copied to clipboard!');
	}

	// Track if flow has been executed (for reset button behavior)
	const hasResults =
		deviceResponse || tokenResponse || userinfoResponse || introspectionResponse || isApproved;
	const currentStep = hasResults ? 1 : 0;

	function handleReset() {
		setDeviceCode('');
		setUserCode('');
		setVerificationUri('');
		setDeviceResponse(null);
		setTokenResponse(null);
		setUserinfoResponse(null);
		setIntrospectionResponse(null);
		setIsApproved(false);
		window.scrollTo({ top: 0, behavior: 'smooth' });
		showGlobalSuccess('Flow reset. Start again from step 1.');
	}

	return (
		<div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
			<V7MMockBanner description="This flow simulates OAuth Device Authorization (RFC 8628) for learning. No external APIs are called. Click 'Simulate User Approval' (or open the Verification URI in another tab) to mimic the user approving on the verification device (e.g. phone or second browser)." />
			<V9FlowHeader flowId="device-authorization-v9" customConfig={{ flowType: 'pingone' }} />
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
				flowKey="v7m-device-authorization"
				credentials={{ clientId }}
				importExportOptions={{
					flowType: 'v7m-device-authorization',
					appName: 'Device Authorization',
					description: 'Mock Device Authorization Flow (RFC 8628)',
				}}
				onAppSelected={handleAppSelected}
				grantType="urn:ietf:params:oauth:grant-type:device_code"
				showAppPicker={true}
				showImportExport={true}
			/>

			<V7MFlowOverview
				title="About this flow"
				description="Device authorization is designed for input-constrained devices (TVs, CLI tools, IoT). The device gets a user_code and verification_uri; the user enters the code in a browser on another device and authorizes; the device polls the token endpoint until the user completes authorization."
				keyPoint="Two steps: (1) device requests a user_code and verification_uri, (2) device polls for tokens after the user authorizes on a separate browser."
				standard="OAuth 2.0 Device Authorization Grant (RFC 8628)."
				benefits={[
					'No browser or redirect on the device itself.',
					'User authorizes on a phone or computer; device receives the token.',
					'Supports long polling or polling intervals from the AS.',
				]}
				educationalNote="This is a mock implementation. Device auth request, user approval, and token polling are simulated so you can see the request/response sequence."
			/>

			<section style={MOCK_SECTION_STYLE}>
				<header style={getSectionHeaderStyle('warning')}>
					<span>1️⃣</span> Step 1: Request Device Authorization
					<V7MInfoIcon
						label="What is Device Authorization?"
						title="Device Authorization Flow (RFC 8628)"
						onClick={() => setShowDeviceHelp(true)}
					/>
				</header>
				<div style={getSectionBodyStyle()}>
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
							User Email
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
					<button type="button" onClick={handleRequestDeviceAuth} style={MOCK_PRIMARY_BTN}>
						Request Device Authorization
					</button>
					<div style={{ marginTop: 12 }}>
						<MockApiCallDisplay
							title="Device authorization request (POST) — RFC 8628"
							method="POST"
							url={`${DEMO_API_BASE}/${DEMO_ENVIRONMENT_ID}/as/device_authorization`}
							headers={{
								'Content-Type': 'application/x-www-form-urlencoded',
								Accept: 'application/json',
							}}
							body={`client_id=${encodeURIComponent(clientId)}&scope=${encodeURIComponent(scope)}`}
							response={
								deviceResponse && !('error' in deviceResponse)
									? {
											status: 200,
											statusText: 'OK',
											data: {
												device_code: deviceCode,
												user_code: userCode,
												verification_uri: verificationUri,
												expires_in: deviceResponse.expires_in,
												interval: deviceResponse.interval,
											},
										}
									: {
											status: 200,
											statusText: 'OK',
											data: {
												note: 'Click "Request Device Authorization" to see the response.',
											},
										}
							}
							defaultExpanded={true}
						/>
					</div>
					{deviceResponse && !('error' in deviceResponse) && (
						<div
							style={{
								marginTop: 12,
								padding: 12,
								background: '#f0fdf4',
								border: '1px solid #86efac',
								borderRadius: 6,
							}}
						>
							<strong>Device Authorization Response:</strong>
							<div style={{ marginTop: 8 }}>
								<div style={{ marginBottom: 8 }}>
									<strong>User Code:</strong>{' '}
									<code style={{ background: '#fff', padding: '4px 8px', borderRadius: 4 }}>
										{userCode}
									</code>
									<button
										type="button"
										onClick={() => copyToClipboard(userCode)}
										style={MOCK_COPY_BTN}
									>
										<span>📋</span> Copy
									</button>
								</div>
								<div style={{ marginBottom: 8 }}>
									<strong>Device Code:</strong>{' '}
									<code style={{ background: '#fff', padding: '4px 8px', borderRadius: 4 }}>
										{deviceCode}
									</code>
									<button
										type="button"
										onClick={() => copyToClipboard(deviceCode)}
										style={MOCK_COPY_BTN}
									>
										<span>📋</span> Copy
									</button>
								</div>
								<div style={{ marginBottom: 8 }}>
									<strong>Verification URI:</strong>{' '}
									<code style={{ background: '#fff', padding: '4px 8px', borderRadius: 4 }}>
										{verificationUri}
									</code>
									<button
										type="button"
										onClick={() => copyToClipboard(verificationUri)}
										style={MOCK_COPY_BTN}
									>
										<span>📋</span> Copy
									</button>
								</div>
								<div style={{ marginTop: 12 }}>
									<strong>Expires in:</strong> {deviceResponse.expires_in} seconds
								</div>
								<div>
									<strong>Polling interval:</strong> {deviceResponse.interval} seconds
								</div>
							</div>
						</div>
					)}
				</div>
			</section>

			{deviceCode && (
				<section style={MOCK_SECTION_STYLE}>
					<header style={getSectionHeaderStyle('info')}>
						<span>2️⃣</span> Step 2: Simulate User Approval (Verification Device)
					</header>
					<div style={getSectionBodyStyle()}>
						<div
							style={{
								padding: 12,
								borderRadius: 6,
								background: isApproved ? '#f0fdf4' : '#fef3c7',
								border: `1px solid ${isApproved ? '#86efac' : '#fbbf24'}`,
								marginBottom: 12,
								fontSize: 14,
							}}
						>
							{!isApproved && (
								<span>
									⏳ Waiting for user to approve on the verification device… Open the Verification
									URI (e.g. in another tab) or click below to simulate approval.
								</span>
							)}
							{isApproved && <span>✅ Device approved! You can now poll for tokens.</span>}
						</div>
						<div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
							<button
								type="button"
								onClick={handleApproveDevice}
								disabled={isApproved}
								style={isApproved ? { ...MOCK_PRIMARY_BTN, opacity: 0.6 } : MOCK_PRIMARY_BTN}
							>
								📱 Simulate User Approval
							</button>
							{verificationUri && (
								<a
									href={
										deviceResponse &&
										!('error' in deviceResponse) &&
										'verification_uri_complete' in deviceResponse
											? deviceResponse.verification_uri_complete
											: `${verificationUri}?user_code=${encodeURIComponent(userCode)}`
									}
									target="_blank"
									rel="noopener noreferrer"
									style={{ ...MOCK_SECONDARY_BTN, textDecoration: 'none', display: 'inline-block' }}
								>
									Open Verification URI (new tab)
								</a>
							)}
						</div>
					</div>
				</section>
			)}

			{deviceCode && isApproved && (
				<section style={MOCK_SECTION_STYLE}>
					<header style={getSectionHeaderStyle('info')}>
						<span>📱</span> Step 3: Poll for Tokens
					</header>
					<div style={getSectionBodyStyle()}>
						<p style={{ marginBottom: 12 }}>
							Once the device is approved, the client polls the token endpoint using the device code
							to obtain tokens.
						</p>
						<button type="button" onClick={handlePollToken} style={MOCK_PRIMARY_BTN}>
							Poll for Tokens
						</button>
						<div style={{ marginTop: 12 }}>
							<MockApiCallDisplay
								title="Token request (POST) — device_code grant"
								method="POST"
								url={`${DEMO_API_BASE}/${DEMO_ENVIRONMENT_ID}/as/token`}
								headers={{
									'Content-Type': 'application/x-www-form-urlencoded',
									Authorization: `Basic ${btoa(`${clientId}:***`)}`,
								}}
								body={`grant_type=urn:ietf:params:oauth:grant-type:device_code&device_code=${encodeURIComponent(deviceCode ?? '')}`}
								response={
									tokenResponse
										? { status: 200, statusText: 'OK', data: tokenResponse }
										: {
												status: 200,
												statusText: 'OK',
												data: {
													note: 'Click "Poll for Tokens" after approving the device to see the response.',
												},
											}
								}
								defaultExpanded={true}
							/>
						</div>
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
										<button type="button" onClick={handleUserInfo} style={MOCK_SECONDARY_BTN}>
											Call UserInfo
										</button>
										<button type="button" onClick={handleIntrospect} style={MOCK_SECONDARY_BTN}>
											Introspect Token
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
			)}

			<V7MJwtInspectorModal
				open={showAccessModal}
				token={accessToken || ''}
				onClose={() => setShowAccessModal(false)}
			/>

			<V7MHelpModal
				open={showDeviceHelp}
				onClose={() => setShowDeviceHelp(false)}
				title="Device Authorization Flow (RFC 8628)"
				icon={<FiBook color="#fff" />}
				themeColor="#f59e0b"
			>
				<p>
					Device Authorization Flow (RFC 8628) enables OAuth on devices that lack a browser or
					cannot securely input credentials.
				</p>
				<ul>
					<li>
						<strong>Step 1:</strong> Client requests device authorization → receives{' '}
						<code>device_code</code> and <code>user_code</code>
					</li>
					<li>
						<strong>Step 2:</strong> User visits verification URI and enters user code → approves
						device
					</li>
					<li>
						<strong>Step 3:</strong> Client polls token endpoint with device code → receives tokens
						after approval
					</li>
					<li>
						<strong>User Code:</strong> Short, human-readable code (e.g., "ABCD-1234") that the user
						enters
					</li>
					<li>
						<strong>Device Code:</strong> Long, opaque code used by the client to poll for tokens
					</li>
					<li>
						<strong>Polling:</strong> Client checks token endpoint periodically until user approves
						(or code expires)
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
				<p>Scopes request permissions and drive which claims appear in tokens and UserInfo.</p>
				<ul>
					<li>
						<code>read</code>: Read access to resources
					</li>
					<li>
						<code>write</code>: Write access to resources
					</li>
					<li>
						<code>profile</code>: Access to profile information
					</li>
					<li>
						<code>email</code>: Access to email address
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
				open={showUserInfoHelp}
				onClose={() => setShowUserInfoHelp(false)}
				title="UserInfo Endpoint"
				icon={<FiBook color="#fff" />}
				themeColor="#c4b5fd"
			>
				<p>The UserInfo endpoint provides user profile information using the access token.</p>
				<ul>
					<li>
						Called with <code>{'Authorization: Bearer {access_token}'}</code>
					</li>
					<li>
						Returns user claims such as <code>sub</code>, <code>email</code>, <code>name</code>
					</li>
					<li>Scopes determine which claims are included</li>
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

			<CodeExamplesSection
				examples={[
					{
						title: 'Device Authorization Request',
						description: 'Request device code and user code for device flow.',
						code: {
							javascript: `// Device Authorization Flow - JavaScript
// Step 1: Request device code
const response = await fetch('https://auth.pingone.com/{environmentId}/as/device_authorization', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  body: new URLSearchParams({
    client_id: 'your-client-id',
    scope: 'openid profile email'
  })
});

const deviceAuth = await response.json();
console.log('User Code:', deviceAuth.user_code);
console.log('Verification URI:', deviceAuth.verification_uri);
console.log('Device Code:', deviceAuth.device_code);

// Display to user:
// "Go to ${deviceAuth.verification_uri} and enter code: ${deviceAuth.user_code}"`,
							dotnet: `// Device Authorization Flow - C# (.NET)
using System.Net.Http;
using System.Text.Json;

// Step 1: Request device code
var client = new HttpClient();
var content = new FormUrlEncodedContent(new Dictionary<string, string>
{
    { "client_id", "your-client-id" },
    { "scope", "openid profile email" }
});

var response = await client.PostAsync(
    "https://auth.pingone.com/{environmentId}/as/device_authorization",
    content
);

var json = await response.Content.ReadAsStringAsync();
var deviceAuth = JsonSerializer.Deserialize<DeviceAuthResponse>(json);

Console.WriteLine($"User Code: {deviceAuth.UserCode}");
Console.WriteLine($"Verification URI: {deviceAuth.VerificationUri}");
Console.WriteLine($"Device Code: {deviceAuth.DeviceCode}");`,
							go: `// Device Authorization Flow - Go
package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
)

func main() {
	// Step 1: Request device code
	data := url.Values{}
	data.Set("client_id", "your-client-id")
	data.Set("scope", "openid profile email")

	resp, err := http.Post(
		"https://auth.pingone.com/{environmentId}/as/device_authorization",
		"application/x-www-form-urlencoded",
		strings.NewReader(data.Encode()),
	)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	var deviceAuth map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&deviceAuth)

	fmt.Println("User Code:", deviceAuth["user_code"])
	fmt.Println("Verification URI:", deviceAuth["verification_uri"])
	fmt.Println("Device Code:", deviceAuth["device_code"])
}`,
						},
					},
					{
						title: 'Poll for Tokens',
						description: 'Poll the token endpoint until user completes authorization.',
						code: {
							javascript: `// Step 2: Poll for tokens - JavaScript
const deviceCode = deviceAuth.device_code;
const interval = deviceAuth.interval || 5; // seconds

async function pollForTokens() {
  while (true) {
    await new Promise(resolve => setTimeout(resolve, interval * 1000));

    const response = await fetch('https://auth.pingone.com/{environmentId}/as/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
        device_code: deviceCode,
        client_id: 'your-client-id'
      })
    });

    const result = await response.json();

    if (result.access_token) {
      console.log('Access Token:', result.access_token);
      return result;
    } else if (result.error === 'authorization_pending') {
      console.log('Waiting for user authorization...');
      continue;
    } else if (result.error === 'slow_down') {
      interval += 5; // Increase polling interval
      continue;
    } else {
      throw new Error(result.error_description || result.error);
    }
  }
}

pollForTokens();`,
							dotnet: `// Step 2: Poll for tokens - C# (.NET)
using System.Threading.Tasks;

var deviceCode = deviceAuth.DeviceCode;
var interval = deviceAuth.Interval ?? 5; // seconds

async Task<TokenResponse> PollForTokens()
{
    while (true)
    {
        await Task.Delay(interval * 1000);

        var content = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            { "grant_type", "urn:ietf:params:oauth:grant-type:device_code" },
            { "device_code", deviceCode },
            { "client_id", "your-client-id" }
        });

        var response = await client.PostAsync(
            "https://auth.pingone.com/{environmentId}/as/token",
            content
        );

        var json = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<TokenResponse>(json);

        if (result.AccessToken != null)
        {
            Console.WriteLine($"Access Token: {result.AccessToken}");
            return result;
        }
        else if (result.Error == "authorization_pending")
        {
            Console.WriteLine("Waiting for user authorization...");
            continue;
        }
        else if (result.Error == "slow_down")
        {
            interval += 5;
            continue;
        }
        else
        {
            throw new Exception(result.ErrorDescription ?? result.Error);
        }
    }
}`,
							go: `// Step 2: Poll for tokens - Go
func pollForTokens(deviceCode string, interval int) (map[string]interface{}, error) {
	for {
		time.Sleep(time.Duration(interval) * time.Second)

		data := url.Values{}
		data.Set("grant_type", "urn:ietf:params:oauth:grant-type:device_code")
		data.Set("device_code", deviceCode)
		data.Set("client_id", "your-client-id")

		resp, err := http.Post(
			"https://auth.pingone.com/{environmentId}/as/token",
			"application/x-www-form-urlencoded",
			strings.NewReader(data.Encode()),
		)
		if err != nil {
			return nil, err
		}
		defer resp.Body.Close()

		var result map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&result)

		if accessToken, ok := result["access_token"]; ok {
			fmt.Println("Access Token:", accessToken)
			return result, nil
		} else if result["error"] == "authorization_pending" {
			fmt.Println("Waiting for user authorization...")
			continue
		} else if result["error"] == "slow_down" {
			interval += 5
			continue
		} else {
			return nil, fmt.Errorf("%v", result["error"])
		}
	}
}`,
						},
					},
				]}
			/>
		</div>
	);
};

export default V7MDeviceAuthorizationV9;
