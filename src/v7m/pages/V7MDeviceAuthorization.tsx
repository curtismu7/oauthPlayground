// src/v7m/pages/V7MDeviceAuthorization.tsx
import React, { useState } from 'react';
import { FiBook, FiCheck, FiCopy, FiSmartphone } from 'react-icons/fi';
import {
	requestDeviceAuthorization,
	type V7MDeviceAuthorizationResponse,
} from '../../services/v7m/V7MDeviceAuthorizationService';
import {
	introspectToken,
	type V7MIntrospectionResponse,
} from '../../services/v7m/V7MIntrospectionService';
import { V7MStateStore } from '../../services/v7m/V7MStateStore';
import { tokenExchangeDeviceCode, type V7MTokenSuccess } from '../../services/v7m/V7MTokenService';
import {
	getUserInfoFromAccessToken,
	type V7MUserInfo,
} from '../../services/v7m/V7MUserInfoService';
import { V7MHelpModal } from '../ui/V7MHelpModal';
import { V7MInfoIcon } from '../ui/V7MInfoIcon';
import { V7MJwtInspectorModal } from '../ui/V7MJwtInspectorModal';

export const V7MDeviceAuthorization: React.FC = () => {
	const [clientId, setClientId] = useState('v7m-device-client');
	const [scope, setScope] = useState('read write');
	const [userEmail, setUserEmail] = useState('jane.doe@example.com');
	const [expectedSecret, setExpectedSecret] = useState('topsecret');
	const [deviceCode, setDeviceCode] = useState('');
	const [userCode, setUserCode] = useState('');
	const [verificationUri, setVerificationUri] = useState('');
	const [deviceResponse, setDeviceResponse] = useState<V7MDeviceAuthorizationResponse | null>(null);
	const [tokenResponse, setTokenResponse] = useState<V7MTokenSuccess | null>(null);
	const [userinfoResponse, setUserinfoResponse] = useState<V7MUserInfo | null>(null);
	const [introspectionResponse, setIntrospectionResponse] =
		useState<V7MIntrospectionResponse | null>(null);
	const [showAccessModal, setShowAccessModal] = useState(false);
	const [showDeviceHelp, setShowDeviceHelp] = useState(false);
	const [showScopesHelp, setShowScopesHelp] = useState(false);
	const [showClientAuthHelp, setShowClientAuthHelp] = useState(false);
	const [showUserInfoHelp, setShowUserInfoHelp] = useState(false);
	const [showIntrospectionHelp, setShowIntrospectionHelp] = useState(false);
	const [isApproved, setIsApproved] = useState(false);

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
			alert(`${res.error}: ${res.error_description ?? ''}`);
			return;
		}
		setDeviceCode(res.device_code);
		setUserCode(res.user_code);
		setVerificationUri(res.verification_uri);
		setDeviceResponse(res);
		setIsApproved(false);
	}

	function handleApproveDevice() {
		if (!deviceCode) {
			alert('No device code available. Request device authorization first.');
			return;
		}
		const approved = V7MStateStore.approveDeviceCode(deviceCode);
		if (approved) {
			setIsApproved(true);
			alert('Device approved! You can now poll for tokens.');
		} else {
			alert('Failed to approve device. Device code may be expired.');
		}
	}

	async function handlePollToken() {
		if (!deviceCode) {
			alert('No device code available');
			return;
		}
		if (!isApproved) {
			alert('Device not yet approved. Click "Simulate User Approval" first.');
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
				alert('User has not yet approved the device. Click "Simulate User Approval" first.');
			} else {
				alert(`${res.error}: ${res.error_description ?? ''}`);
			}
			return;
		}
		setTokenResponse(res);
	}

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

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text);
		alert('Copied to clipboard!');
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
					This flow simulates OAuth Device Authorization (RFC 8628) for learning. No external APIs
					are called. Tokens are generated deterministically based on your settings.
				</p>
			</div>
			<h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
				<FiSmartphone /> V7M Device Authorization
			</h1>

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
					<FiSmartphone /> Step 1: Request Device Authorization
					<V7MInfoIcon
						label="What is Device Authorization?"
						title="Device Authorization Flow (RFC 8628)"
						onClick={() => setShowDeviceHelp(true)}
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
							User Email
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
					<button onClick={handleRequestDeviceAuth} style={primaryBtn}>
						Request Device Authorization
					</button>
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
									<button onClick={() => copyToClipboard(userCode)} style={copyBtn}>
										<FiCopy /> Copy
									</button>
								</div>
								<div style={{ marginBottom: 8 }}>
									<strong>Device Code:</strong>{' '}
									<code style={{ background: '#fff', padding: '4px 8px', borderRadius: 4 }}>
										{deviceCode}
									</code>
									<button onClick={() => copyToClipboard(deviceCode)} style={copyBtn}>
										<FiCopy /> Copy
									</button>
								</div>
								<div style={{ marginBottom: 8 }}>
									<strong>Verification URI:</strong>{' '}
									<code style={{ background: '#fff', padding: '4px 8px', borderRadius: 4 }}>
										{verificationUri}
									</code>
									<button onClick={() => copyToClipboard(verificationUri)} style={copyBtn}>
										<FiCopy /> Copy
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
						<FiCheck /> Step 2: Simulate User Approval
					</header>
					<div style={{ padding: 12 }}>
						<p style={{ marginBottom: 12 }}>
							In a real flow, the user would visit the verification URI and enter the user code to
							approve the device. For this educational mock, click the button below to simulate
							approval.
						</p>
						<button
							onClick={handleApproveDevice}
							disabled={isApproved}
							style={isApproved ? { ...primaryBtn, opacity: 0.6 } : primaryBtn}
						>
							{isApproved ? '✓ Device Approved' : 'Simulate User Approval'}
						</button>
						{isApproved && (
							<div
								style={{
									marginTop: 8,
									padding: 8,
									background: '#f0fdf4',
									border: '1px solid #86efac',
									borderRadius: 6,
								}}
							>
								Device has been approved! You can now poll for tokens.
							</div>
						)}
					</div>
				</section>
			)}

			{deviceCode && isApproved && (
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
						<FiSmartphone /> Step 3: Poll for Tokens
					</header>
					<div style={{ padding: 12 }}>
						<p style={{ marginBottom: 12 }}>
							Once the device is approved, the client polls the token endpoint using the device code
							to obtain tokens.
						</p>
						<button onClick={handlePollToken} style={primaryBtn}>
							Poll for Tokens
						</button>
						{tokenResponse && (
							<div style={{ marginTop: 12 }}>
								<div style={{ marginBottom: 12 }}>
									<strong>Token Response:</strong>
									<pre style={preJson}>{JSON.stringify(tokenResponse, null, 2)}</pre>
								</div>
								{accessToken && (
									<div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
										<button onClick={() => setShowAccessModal(true)} style={secondaryBtn}>
											Inspect Access Token
										</button>
										<button onClick={handleUserInfo} style={secondaryBtn}>
											Call UserInfo
										</button>
										<button onClick={handleIntrospect} style={secondaryBtn}>
											Introspect Token
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
const copyBtn: React.CSSProperties = {
	marginLeft: 8,
	padding: '4px 8px',
	borderRadius: 4,
	border: '1px solid #94a3b8',
	background: '#fff',
	color: '#0f172a',
	cursor: 'pointer',
	fontSize: 12,
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

export default V7MDeviceAuthorization;
