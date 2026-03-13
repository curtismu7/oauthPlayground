// src/pages/flows/v9/V7MCIBAFlowV9.tsx
// CIBA (Client Initiated Backchannel Authentication) Mock — V7M educational implementation
// OpenID Connect CIBA Core 1.0 — no external API calls, fully in-browser simulation

import React, { useEffect, useRef, useState } from 'react';
import { CIBAUserApprovalModal } from '../../../components/CIBAUserApprovalModal';
import { ColoredJsonDisplay } from '../../../components/ColoredJsonDisplay';
import { MockApiCallDisplay } from '../../../components/MockApiCallDisplay';
import { DEMO_API_BASE, DEMO_ENVIRONMENT_ID } from '../../../components/PingOneApiCallDisplay';
import { UnifiedCredentialManagerV9 } from '../../../components/UnifiedCredentialManagerV9';
import {
	showGlobalError,
	showGlobalSuccess,
	showGlobalWarning,
} from '../../../contexts/NotificationSystem';
import { FiBook, FiRefreshCw } from '../../../icons';
import {
	type V9MockCIBADeliveryMode,
	V9MockCIBAService,
} from '../../../services/v9/mock/V9MockCIBAService';
import {
	introspectToken,
	type V9MockIntrospectionResponse,
} from '../../../services/v9/mock/V9MockIntrospectionService';
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

type DeliveryModeOption = { value: V9MockCIBADeliveryMode; label: string; description: string };

const DELIVERY_MODES: DeliveryModeOption[] = [
	{
		value: 'poll',
		label: 'Poll',
		description: 'Client repeatedly polls the token endpoint until authentication completes',
	},
	{
		value: 'ping',
		label: 'Ping',
		description: 'Server notifies client via a ping callback when ready; client then fetches token',
	},
	{
		value: 'push',
		label: 'Push',
		description: 'Server pushes the token directly to a client-registered endpoint',
	},
];

type TokenResult = {
	access_token: string;
	id_token: string;
	token_type: 'Bearer';
	expires_in: number;
	scope?: string;
};

export const V7MCIBAFlowV9: React.FC = () => {
	const [clientId, setClientId] = useState('v7m-ciba-client');
	const [scope, setScope] = useState('openid profile email');
	const [loginHint, setLoginHint] = useState('jane.doe@example.com');
	const [bindingMessage, setBindingMessage] = useState('Sign in to ACME Portal');
	const [deliveryMode, setDeliveryMode] = useState<V9MockCIBADeliveryMode>('poll');
	const [authReqId, setAuthReqId] = useState('');
	const [expiresIn, setExpiresIn] = useState<number | null>(null);
	const [status, setStatus] = useState<'idle' | 'pending' | 'approved' | 'expired' | 'done'>(
		'idle'
	);
	const [tokenResult, setTokenResult] = useState<TokenResult | null>(null);
	const [introspectionResponse, setIntrospectionResponse] =
		useState<V9MockIntrospectionResponse | null>(null);
	const [showAccessModal, setShowAccessModal] = useState(false);
	const [showIdModal, setShowIdModal] = useState(false);
	const [showCibaHelp, setShowCibaHelp] = useState(false);
	const [showDeliveryModeHelp, setShowDeliveryModeHelp] = useState(false);
	const [showLoginHintHelp, setShowLoginHintHelp] = useState(false);
	const [showBindingMsgHelp, setShowBindingMsgHelp] = useState(false);
	const [showApprovalModal, setShowApprovalModal] = useState(false);
	const [pollCount, setPollCount] = useState(0);
	const pollInterval = useRef<ReturnType<typeof setInterval> | null>(null);

	useEffect(() => {
		const saved = V9CredentialStorageService.loadSync('v7m-ciba');
		if (saved.clientId) setClientId(saved.clientId);
		return () => {
			if (pollInterval.current) clearInterval(pollInterval.current);
		};
	}, []);

	function handleRequestBackchannelAuth() {
		if (pollInterval.current) clearInterval(pollInterval.current);
		const res = V9MockCIBAService.requestBackchannelAuth(
			{
				client_id: clientId,
				scope,
				login_hint: loginHint,
				user_email: loginHint,
				binding_message: bindingMessage,
				delivery_mode: deliveryMode,
			},
			120,
			5
		);
		if ('error' in res) {
			showGlobalError(`${res.error}: ${res.error_description ?? ''}`);
			return;
		}
		setAuthReqId(res.auth_req_id);
		setExpiresIn(res.expires_in);
		setStatus('pending');
		setTokenResult(null);
		setIntrospectionResponse(null);
		setPollCount(0);

		if (deliveryMode === 'poll') {
			// Automatically poll every 5s so user can see the flow
			pollInterval.current = setInterval(() => {
				setPollCount((c) => c + 1);
			}, 5000);
		}
	}

	function handleSimulateUserApproval() {
		if (!authReqId) {
			showGlobalError(
				'No backchannel auth request active. Click "Request Backchannel Auth" first.'
			);
			return;
		}

		// Show the approval modal instead of directly approving
		setShowApprovalModal(true);
	}

	function handleModalApprove() {
		if (!authReqId) return;

		const ok = V9MockCIBAService.approveRequest(authReqId);
		if (ok) {
			setStatus('approved');
			showGlobalSuccess('✅ User approved on their device! Now poll for the token.');
		} else {
			showGlobalError('Approval failed — the auth_req_id may have expired.');
			setStatus('expired');
		}
	}

	function handleModalDeny() {
		if (!authReqId) return;

		// Since V7MCIBAService doesn't have denyRequest, we'll just set status to expired
		// In a real implementation, this would deny the request
		setStatus('expired');
		showGlobalWarning('❌ User denied the authentication request.');
	}

	function handlePollToken() {
		if (!authReqId) {
			showGlobalError('No auth_req_id available. Start a backchannel auth request first.');
			return;
		}
		const res = V9MockCIBAService.pollForToken(authReqId);
		if ('error' in res) {
			if (res.error === 'authorization_pending') {
				showGlobalWarning('Still waiting for user approval on their device.');
			} else if (res.error === 'expired_token') {
				showGlobalError('The auth_req_id has expired. Start a new request.');
				setStatus('expired');
				if (pollInterval.current) clearInterval(pollInterval.current);
			} else {
				showGlobalError(`${res.error}: ${res.error_description ?? ''}`);
			}
			return;
		}
		if (pollInterval.current) clearInterval(pollInterval.current);
		setTokenResult(res as TokenResult);
		setStatus('done');
	}

	// Auto-poll effect — intentionally only triggers on pollCount change.
	// handlePollToken, status, and deliveryMode are read at call time (not stale due to pollCount being a counter).
	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional counter-driven effect
	useEffect(() => {
		if (status !== 'pending' && status !== 'approved') return;
		if (deliveryMode !== 'poll') return;
		if (pollCount === 0) return;
		handlePollToken();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pollCount]);

	function handleIntrospect() {
		if (!tokenResult?.access_token) {
			showGlobalError('No access token available');
			return;
		}
		setIntrospectionResponse(introspectToken(tokenResult.access_token));
	}

	const statusColor: Record<typeof status, string> = {
		idle: '#f3f4f6',
		pending: '#fef3c7',
		approved: '#d1fae5',
		expired: '#fee2e2',
		done: '#d1fae5',
	};

	function handleReset() {
		if (pollInterval.current) {
			clearInterval(pollInterval.current);
			pollInterval.current = null;
		}
		setAuthReqId('');
		setExpiresIn(null);
		setStatus('idle');
		setTokenResult(null);
		setIntrospectionResponse(null);
		setPollCount(0);
		window.scrollTo({ top: 0, behavior: 'smooth' });
		showGlobalSuccess('Flow reset. Start again from step 1.');
	}

	return (
		<div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
			<V7MMockBanner description="Simulates OIDC CIBA Core 1.0 in-browser. No external APIs are called. Click 'Simulate User Approval' to mimic the out-of-band authentication device (phone push notification, biometric, etc.)." />
			<V9FlowHeader flowId="ciba-v9" customConfig={{ flowType: 'pingone' }} />
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
				flowKey="v7m-ciba"
				credentials={{ clientId }}
				importExportOptions={{
					flowType: 'v7m-ciba',
					appName: 'CIBA (Backchannel)',
					description: 'Mock OIDC CIBA Flow',
				}}
				onAppSelected={(app) => {
					setClientId(app.clientId);
					V9CredentialStorageService.save('v7m-ciba', { clientId: app.clientId });
				}}
				grantType="urn:openid:params:oauth:grant-type:ciba"
				showAppPicker={true}
				showImportExport={true}
			/>

			<V7MFlowOverview
				title="About this flow"
				description="CIBA (Client-Initiated Backchannel Authentication) lets a client start an authentication that the user completes on another device (e.g. phone push, biometric). The client sends an authentication request to the backchannel endpoint; the user approves on the authentication device; the client polls (or is pinged) for tokens."
				keyPoint="No redirect to the auth server in the consuming app. The user authenticates out-of-band (second device or same device in a decoupled flow); the client receives tokens via polling or push."
				standard="OpenID Connect CIBA (Core 1.0 — Client-Initiated Backchannel Authentication Flow)."
				benefits={[
					'No browser redirect in the requesting app (e.g. kiosk, IoT).',
					'User can authenticate on a phone or trusted device.',
					'Supports poll, ping, and push delivery modes.',
				]}
				educationalNote="This is a mock implementation. Backchannel auth request, user approval, and token polling are simulated so you can see the request/response sequence."
			/>

			<div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
				<V7MInfoIcon label="" title="CIBA Overview" onClick={() => setShowCibaHelp(true)} />
			</div>

			{/* Delivery Mode */}
			<section style={MOCK_SECTION_STYLE}>
				<header style={getSectionHeaderStyle('info')}>
					Delivery Mode
					<V7MInfoIcon
						label=""
						title="Poll vs Ping vs Push"
						onClick={() => setShowDeliveryModeHelp(true)}
					/>
				</header>
				<div style={getSectionBodyStyle()}>
					<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
						{DELIVERY_MODES.map((m) => (
							<label
								key={m.value}
								style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}
							>
								<input
									type="radio"
									name="deliveryMode"
									value={m.value}
									checked={deliveryMode === m.value}
									onChange={() => setDeliveryMode(m.value)}
									style={{ marginTop: 3 }}
								/>
								<div>
									<strong>{m.label}</strong>
									<div style={{ fontSize: 13, color: '#6b7280' }}>{m.description}</div>
								</div>
							</label>
						))}
					</div>
				</div>
			</section>

			{/* Step 1: Backchannel Auth Request */}
			<section style={MOCK_SECTION_STYLE}>
				<header style={getSectionHeaderStyle('info')}>
					<span>1️⃣</span> Step 1: BC-Authorize Request
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
							Scope
							<input
								value={scope}
								onChange={(e) => setScope(e.target.value)}
								style={MOCK_INPUT_STYLE}
							/>
						</label>
						<label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
							Login Hint (user identifier)
							<V7MInfoIcon
								label=""
								title="login_hint identifies the user on the consumption device"
								onClick={() => setShowLoginHintHelp(true)}
							/>
							<input
								value={loginHint}
								onChange={(e) => setLoginHint(e.target.value)}
								style={MOCK_INPUT_STYLE}
							/>
						</label>
						<label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
							Binding Message
							<V7MInfoIcon
								label=""
								title="Short message shown on both devices to confirm binding"
								onClick={() => setShowBindingMsgHelp(true)}
							/>
							<input
								value={bindingMessage}
								onChange={(e) => setBindingMessage(e.target.value)}
								style={MOCK_INPUT_STYLE}
							/>
						</label>
					</div>
					<button type="button" onClick={handleRequestBackchannelAuth} style={MOCK_PRIMARY_BTN}>
						Request Backchannel Authentication
					</button>
					<div style={{ marginTop: 12 }}>
						<MockApiCallDisplay
							title="Backchannel auth request (POST) — CIBA"
							method="POST"
							url={`${DEMO_API_BASE}/${DEMO_ENVIRONMENT_ID}/as/backchannel/authentication`}
							headers={{
								'Content-Type': 'application/x-www-form-urlencoded',
								Accept: 'application/json',
							}}
							body={`client_id=${encodeURIComponent(clientId)}&scope=${encodeURIComponent(scope)}&login_hint=${encodeURIComponent(loginHint)}&binding_message=${encodeURIComponent(bindingMessage)}`}
							response={
								authReqId
									? {
											status: 200,
											statusText: 'OK',
											data: {
												auth_req_id: authReqId,
												expires_in: expiresIn ?? 120,
												interval: 5,
											},
										}
									: {
											status: 200,
											statusText: 'OK',
											data: {
												note: 'Click "Request Backchannel Authentication" to see the response.',
											},
										}
							}
							defaultExpanded={true}
						/>
					</div>
				</div>
			</section>

			{/* Step 2: Auth in Progress / Status */}
			{authReqId && (
				<section style={MOCK_SECTION_STYLE}>
					<header style={{ ...getSectionHeaderStyle('info'), background: statusColor[status] }}>
						<span>2️⃣</span> Step 2: Backchannel Authentication In Progress
					</header>
					<div style={getSectionBodyStyle()}>
						<div style={{ marginBottom: 8, fontFamily: 'monospace', fontSize: 13 }}>
							<strong>auth_req_id:</strong> <code>{authReqId}</code>
						</div>
						{expiresIn && (
							<div style={{ marginBottom: 8, fontSize: 13, color: '#6b7280' }}>
								Expires in <strong>{expiresIn}s</strong> · Polling interval: <strong>5s</strong>
							</div>
						)}
						<div
							style={{
								padding: 12,
								borderRadius: 6,
								background: statusColor[status],
								border: `1px solid ${status === 'done' ? '#86efac' : '#fbbf24'}`,
								marginBottom: 12,
								fontSize: 14,
							}}
						>
							{status === 'pending' && (
								<span>⏳ Waiting for user to approve on their authentication device…</span>
							)}
							{status === 'approved' && (
								<span>✅ User approved! Poll the token endpoint to retrieve tokens.</span>
							)}
							{status === 'expired' && (
								<span>❌ Request expired. Start a new backchannel auth request.</span>
							)}
							{status === 'done' && <span>🎉 Tokens issued successfully.</span>}
						</div>

						{status !== 'expired' && status !== 'done' && (
							<div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
								<button
									type="button"
									onClick={handleSimulateUserApproval}
									disabled={status === 'approved'}
									style={
										status === 'approved' ? { ...MOCK_PRIMARY_BTN, opacity: 0.5 } : MOCK_PRIMARY_BTN
									}
								>
									📱 Simulate User Approval (Out-of-Band)
								</button>
								{deliveryMode === 'poll' && (
									<button type="button" onClick={handlePollToken} style={MOCK_SECONDARY_BTN}>
										<FiRefreshCw style={{ marginRight: 6 }} />
										Poll Token Endpoint
										{pollCount > 0 && (
											<span style={{ marginLeft: 6, fontSize: 12, color: '#6b7280' }}>
												({pollCount} auto-polls)
											</span>
										)}
									</button>
								)}
								{deliveryMode === 'ping' && status === 'approved' && (
									<button type="button" onClick={handlePollToken} style={MOCK_PRIMARY_BTN}>
										📥 Fetch Token (Ping Callback Received)
									</button>
								)}
								{deliveryMode === 'push' && status === 'approved' && (
									<button type="button" onClick={handlePollToken} style={MOCK_PRIMARY_BTN}>
										🚀 Receive Pushed Token
									</button>
								)}
							</div>
						)}
					</div>
				</section>
			)}

			{/* Step 3: Tokens */}
			{tokenResult && (
				<section style={MOCK_SECTION_STYLE}>
					<header style={getSectionHeaderStyle('success')}>
						<span>3️⃣</span> Step 3: Token Response
					</header>
					<div style={getSectionBodyStyle()}>
						{authReqId && (
							<div style={{ marginBottom: 12 }}>
								<MockApiCallDisplay
									title="Token request (POST) — CIBA grant"
									method="POST"
									url={`${DEMO_API_BASE}/${DEMO_ENVIRONMENT_ID}/as/token`}
									headers={{
										'Content-Type': 'application/x-www-form-urlencoded',
										Authorization: 'Basic ' + btoa(`${clientId}:***`),
									}}
									body={`grant_type=urn:openid:params:oauth:grant-type:ciba&auth_req_id=${encodeURIComponent(authReqId)}`}
									response={{
										status: 200,
										statusText: 'OK',
										data: tokenResult,
									}}
									defaultExpanded={true}
								/>
							</div>
						)}
						<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
							<button
								type="button"
								onClick={() => setShowAccessModal(true)}
								style={MOCK_SECONDARY_BTN}
							>
								Inspect Access Token
							</button>
							<button type="button" onClick={() => setShowIdModal(true)} style={MOCK_SECONDARY_BTN}>
								Inspect ID Token
							</button>
							<button type="button" onClick={handleIntrospect} style={MOCK_SECONDARY_BTN}>
								Introspect
							</button>
						</div>
						<ColoredJsonDisplay
							data={tokenResult}
							label="Token Response"
							collapsible={true}
							defaultCollapsed={false}
							showCopyButton={true}
						/>
						{introspectionResponse && (
							<div style={{ marginTop: 12 }}>
								<MockApiCallDisplay
									title="Introspect request (POST)"
									method="POST"
									url={`${DEMO_API_BASE}/${DEMO_ENVIRONMENT_ID}/as/introspect`}
									headers={{
										'Content-Type': 'application/x-www-form-urlencoded',
										Authorization: 'Basic ' + btoa(`${clientId}:***`),
									}}
									body={`token=${tokenResult?.access_token ? encodeURIComponent(String(tokenResult.access_token).substring(0, 20)) + '...' : '***'}`}
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
					</div>
				</section>
			)}

			{/* JWT Inspector Modals */}
			<V7MJwtInspectorModal
				open={showAccessModal}
				token={tokenResult?.access_token ?? ''}
				onClose={() => setShowAccessModal(false)}
			/>
			<V7MJwtInspectorModal
				open={showIdModal}
				token={tokenResult?.id_token ?? ''}
				onClose={() => setShowIdModal(false)}
			/>

			{/* Help Modals */}
			<V7MHelpModal
				open={showCibaHelp}
				onClose={() => setShowCibaHelp(false)}
				title="CIBA — Client Initiated Backchannel Authentication"
				icon={<FiBook color="#fff" />}
				themeColor="#6366f1"
			>
				<p>
					CIBA (OIDC Core 1.0) allows a <strong>consumption device</strong> (e.g., a bank's website)
					to initiate authentication on a <strong>separate authentication device</strong> (e.g., a
					mobile banking app), without any browser redirect.
				</p>
				<ul>
					<li>
						<strong>Step 1:</strong> Client sends BC-Authorize request with a login_hint identifying
						the user.
					</li>
					<li>
						<strong>Step 2:</strong> Server pushes an auth request to the user's authentication
						device.
					</li>
					<li>
						<strong>Step 3:</strong> User approves on their device (out-of-band).
					</li>
					<li>
						<strong>Step 4:</strong> Client retrieves tokens via poll, ping, or push.
					</li>
				</ul>
				<p>Common use cases: bank login on TV or kiosk, strong authentication with mobile app.</p>
			</V7MHelpModal>

			<V7MHelpModal
				open={showDeliveryModeHelp}
				onClose={() => setShowDeliveryModeHelp(false)}
				title="CIBA Token Delivery Modes"
				icon={<FiBook color="#fff" />}
				themeColor="#0ea5e9"
			>
				<ul>
					<li>
						<strong>Poll:</strong> Client repeatedly calls the token endpoint until the user
						approves. Simple but wastes requests. Server returns <code>authorization_pending</code>{' '}
						until ready.
					</li>
					<li>
						<strong>Ping:</strong> Server notifies the client at a registered callback URI when
						ready. Client then makes a single token request. More efficient than poll.
					</li>
					<li>
						<strong>Push:</strong> Server delivers the tokens directly to the client's registered
						endpoint. Most efficient — no client polling required.
					</li>
				</ul>
			</V7MHelpModal>

			<V7MHelpModal
				open={showLoginHintHelp}
				onClose={() => setShowLoginHintHelp(false)}
				title="login_hint"
				icon={<FiBook color="#fff" />}
				themeColor="#8b5cf6"
			>
				<p>
					Identifies the user on the consumption device so the authorization server knows who to
					send the authentication request to. Can be an email address, phone number, or subject
					identifier. The server uses this to locate the user's authentication device (e.g., their
					registered mobile app).
				</p>
			</V7MHelpModal>

			<V7MHelpModal
				open={showBindingMsgHelp}
				onClose={() => setShowBindingMsgHelp(false)}
				title="Binding Message"
				icon={<FiBook color="#fff" />}
				themeColor="#10b981"
			>
				<p>
					A short human-readable message displayed on <em>both</em> the consumption device and the
					authentication device. The user verifies the messages match before approving — this
					prevents man-in-the-middle attacks where an attacker's request is silently approved.
				</p>
				<p>Example: "Sign in to ACME Portal – ref: 7823"</p>
			</V7MHelpModal>

			{/* CIBA User Approval Modal */}
			<CIBAUserApprovalModal
				isOpen={showApprovalModal}
				onClose={() => setShowApprovalModal(false)}
				onApprove={handleModalApprove}
				onDeny={handleModalDeny}
				authReqId={authReqId}
				bindingMessage={bindingMessage}
				requestContext={`CIBA-${authReqId?.substring(0, 8) || 'Unknown'}`}
				clientName={clientId}
				scope={scope}
			/>
		</div>
	);
};

export default V7MCIBAFlowV9;
