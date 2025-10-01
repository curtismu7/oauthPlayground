// src/pages/flows/DeviceAuthorizationFlowV5.tsx
// OAuth Device Authorization Grant (RFC 8628) - V5 Implementation
import React, { useState, useCallback } from 'react';
import { 
	FiCheckCircle, 
	FiClock, 
	FiCopy, 
	FiInfo, 
	FiKey, 
	FiMonitor, 
	FiRefreshCw, 
	FiShield, 
	FiSmartphone, 
	FiAlertCircle, 
	FiChevronDown,
	FiExternalLink,
	FiZap,
} from 'react-icons/fi';
import styled from 'styled-components';
import {
	ExplanationHeading,
	ExplanationSection,
} from '../../components/InfoBlocks';
import {
	ResultsHeading,
	ResultsSection,
} from '../../components/ResultsPanel';
import { StepNavigationButtons } from '../../components/StepNavigationButtons';
import { v4ToastManager } from '../../utils/v4ToastMessages';
import { useDeviceAuthorizationFlow } from '../../hooks/useDeviceAuthorizationFlow';
import { credentialManager } from '../../utils/credentialManager';

// Styled Components (V5 Parity)
const FlowContainer = styled.div`
	min-height: 100vh;
	background-color: var(--color-background, #f9fafb);
	padding: 2rem 0 6rem;
`;

const FlowContent = styled.div`
	max-width: 64rem;
	margin: 0 auto;
	padding: 0 1rem;
`;

const FlowHeader = styled.div`
	background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
	color: #ffffff;
	padding: 2rem;
	display: flex;
	align-items: center;
	justify-content: space-between;
	border-radius: 1rem 1rem 0 0;
	box-shadow: 0 10px 25px rgba(22, 163, 74, 0.2);
`;

const FlowTitle = styled.h2`
	font-size: 2rem;
	font-weight: 700;
	margin: 0;
	color: #ffffff;
`;

const FlowSubtitle = styled.p`
	font-size: 1rem;
	color: rgba(255, 255, 255, 0.9);
	margin: 0.5rem 0 0 0;
`;

const StepBadge = styled.span`
	background: rgba(22, 163, 74, 0.2);
	border: 1px solid #4ade80;
	color: #bbf7d0;
	font-size: 0.75rem;
	font-weight: 600;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	padding: 0.25rem 0.75rem;
	border-radius: 9999px;
	display: inline-block;
	margin-bottom: 0.5rem;
`;

const CollapsibleSection = styled.section`
	border: 1px solid var(--color-border, #e2e8f0);
	border-radius: 0.75rem;
	margin-bottom: 1.5rem;
	background-color: var(--color-surface, #ffffff);
	box-shadow: 0 10px 20px rgba(15, 23, 42, 0.05);
`;

const CollapsibleHeaderButton = styled.button`
	display: flex;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	padding: 1.25rem 1.5rem;
	background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
	border: none;
	border-radius: 0.75rem;
	cursor: pointer;
	font-size: 1.1rem;
	font-weight: 600;
	color: #0c4a6e;
	transition: background 0.2s ease;

	&:hover {
		background: linear-gradient(135deg, #dbeafe 0%, #e0f2fe 100%);
	}
`;

const CollapsibleTitle = styled.span`
	display: flex;
	align-items: center;
	gap: 0.75rem;
`;

const CollapsibleToggleIcon = styled.span<{ $collapsed?: boolean }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	transition: transform 0.2s ease;
	transform: ${({ $collapsed }) => ($collapsed ? 'rotate(-90deg)' : 'rotate(0deg)')};
	color: #0369a1;
`;

const CollapsibleContent = styled.div`
	padding: 1.5rem;
	padding-top: 0;
	animation: fadeIn 0.2s ease;

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
`;

const InfoBox = styled.div<{ $variant?: 'info' | 'warning' | 'success' | 'error' }>`
	border-radius: 0.75rem;
	padding: 1.5rem;
	margin-bottom: 1.5rem;
	display: flex;
	gap: 1rem;
	align-items: flex-start;
	border: 1px solid
		${({ $variant }) => {
			if ($variant === 'warning') return '#f59e0b';
			if ($variant === 'success') return '#22c55e';
			if ($variant === 'error') return '#ef4444';
			return '#3b82f6';
		}};
	background-color:
		${({ $variant }) => {
			if ($variant === 'warning') return '#fef3c7';
			if ($variant === 'success') return '#dcfce7';
			if ($variant === 'error') return '#fee2e2';
			return '#dbeafe';
		}};
`;

const InfoTitle = styled.h3`
	font-size: var(--font-size-base, 1rem);
	font-weight: 600;
	color: var(--color-text-primary, #0f172a);
	margin: 0 0 0.5rem 0;
`;

const InfoText = styled.p`
	font-size: var(--font-size-sm, 0.95rem);
	color: var(--color-text-secondary, #3f3f46);
	line-height: 1.7;
	margin: 0;
`;

const GeneratedContentBox = styled.div`
	background-color: #dbeafe;
	border: 1px solid #3b82f6;
	border-radius: 0.75rem;
	padding: 1.5rem;
	margin: 1.5rem 0;
	position: relative;
`;

const GeneratedLabel = styled.div`
	position: absolute;
	top: -10px;
	left: 16px;
	background-color: #3b82f6;
	color: white;
	padding: 0.25rem 0.75rem;
	border-radius: 9999px;
	font-size: 0.75rem;
	font-weight: 600;
`;

const GeneratedUrlDisplay = styled.div`
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.875rem;
	color: #1e40af;
	word-break: break-all;
	background-color: #eff6ff;
	padding: 1rem;
	border-radius: 0.5rem;
	border: 1px solid #93c5fd;
	margin: 1rem 0;
`;

const ParameterGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
	gap: 1rem;
	margin: 1rem 0;
`;

const ParameterLabel = styled.div`
	font-size: 0.75rem;
	font-weight: 600;
	color: #3b82f6;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	margin-bottom: 0.5rem;
`;

const ParameterValue = styled.div`
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.875rem;
	color: #1e3a8a;
	word-break: break-all;
	background-color: #eff6ff;
	padding: 0.5rem;
	border-radius: 0.25rem;
	border: 1px solid #bfdbfe;
`;

const ActionRow = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 1rem;
	align-items: center;
	margin-top: 1.5rem;
`;

const Button = styled.button<{
	$variant?: 'primary' | 'success' | 'secondary' | 'danger' | 'outline';
}>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
	padding: 0.75rem 1.5rem;
	border-radius: 0.5rem;
	font-size: var(--font-size-sm, 0.875rem);
	font-weight: 600;
	cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};
	transition: all 0.2s;
	border: 1px solid transparent;
	opacity: ${(props) => (props.disabled ? 0.6 : 1)};

	${({ $variant }) =>
		$variant === 'primary' &&
		`
		background-color: #3b82f6;
		color: #ffffff;
		&:hover:not(:disabled) {
			background-color: #2563eb;
		}
	`}

	${({ $variant }) =>
		$variant === 'success' &&
		`
		background-color: #22c55e;
		color: #ffffff;
		&:hover:not(:disabled) {
			background-color: #16a34a;
		}
	`}

	${({ $variant }) =>
		$variant === 'secondary' &&
		`
		background-color: #0ea5e9;
		color: #ffffff;
		&:hover:not(:disabled) {
			background-color: #0284c7;
		}
	`}

	${({ $variant }) =>
		$variant === 'danger' &&
		`
		background-color: #ef4444;
		color: #ffffff;
		&:hover:not(:disabled) {
			background-color: #dc2626;
		}
	`}

	${({ $variant }) =>
		$variant === 'outline' &&
		`
		background-color: transparent;
		color: #1e40af;
		border-color: #bfdbfe;
		&:hover:not(:disabled) {
			background-color: #eff6ff;
			border-color: #3b82f6;
		}
	`}

	${({ $variant }) =>
		!$variant &&
		`
		background-color: #3b82f6;
		color: #ffffff;
		&:hover:not(:disabled) {
			background-color: #2563eb;
		}
	`}
`;

const STEP_METADATA = [
	{ title: 'Step 0: Introduction & Setup', subtitle: 'Understand the Device Authorization Flow' },
	{ title: 'Step 1: Request Device Code', subtitle: 'Initiate device authorization' },
	{ title: 'Step 2: User Authorization', subtitle: 'Display user code and verification URL' },
	{ title: 'Step 3: Poll for Tokens', subtitle: 'Wait for user authorization' },
	{ title: 'Step 4: Tokens Received', subtitle: 'View and analyze tokens' },
	{ title: 'Step 5: User Information', subtitle: 'Fetch user profile data' },
	{ title: 'Step 6: Token Introspection', subtitle: 'Validate and inspect tokens' },
	{ title: 'Step 7: Flow Complete', subtitle: 'Summary and next steps' },
] as const;

type SectionKey =
	| 'overview'
	| 'flowDiagram'
	| 'credentials'
	| 'deviceCodeOverview'
	| 'deviceCodeDetails'
	| 'userAuthOverview'
	| 'userAuthDetails'
	| 'pollingOverview'
	| 'pollingDetails'
	| 'tokensOverview'
	| 'tokensDetails'
	| 'userInfoOverview'
	| 'userInfoDetails'
	| 'introspectionOverview'
	| 'introspectionDetails'
	| 'completionOverview'
	| 'completionDetails';

// Styled Components
const UserCodeDisplay = styled.div`
	font-size: 2.5rem;
	font-weight: 700;
	font-family: 'Courier New', monospace;
	letter-spacing: 0.75rem;
	color: #ffffff;
	text-align: center;
	padding: 2rem;
	background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
	border-radius: 0.75rem;
	margin: 1.5rem 0;
	box-shadow: 0 10px 25px rgba(22, 163, 74, 0.3);
	user-select: all;
	cursor: pointer;
	transition: transform 0.2s ease;

	&:hover {
		transform: scale(1.02);
	}

	&:active {
		transform: scale(0.98);
	}
`;

const PollingIndicator = styled.div<{ $isActive: boolean }>`
	display: flex;
	align-items: center;
	gap: 1rem;
	padding: 1.5rem;
	background-color: ${props => props.$isActive ? '#dbeafe' : '#f1f5f9'};
	border: 2px solid ${props => props.$isActive ? '#3b82f6' : '#cbd5e1'};
	border-radius: 0.5rem;
	margin: 1rem 0;

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.6; }
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}

	${props => props.$isActive && `
		animation: pulse 2s ease-in-out infinite;
		
		svg {
			animation: spin 2s linear infinite;
		}
	`}
`;

const CountdownTimer = styled.div`
	font-size: 2rem;
	font-weight: 700;
	color: #3b82f6;
	text-align: center;
	padding: 1.5rem;
	font-family: 'Courier New', monospace;
	background: linear-gradient(135deg, #e0f2fe 0%, #dbeafe 100%);
	border-radius: 0.5rem;
	border: 2px solid #3b82f6;
	margin: 1rem 0;
`;

const QRCodeContainer = styled.div`
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	padding: 2rem;
	background-color: #ffffff;
	border: 2px solid #e2e8f0;
	border-radius: 0.75rem;
	margin: 1.5rem 0;
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
`;

const VerificationBox = styled.div`
	background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
	border: 2px solid #3b82f6;
	border-radius: 0.75rem;
	padding: 2rem;
	margin: 1.5rem 0;
	text-align: center;
`;

const DeviceAuthorizationFlowV5: React.FC = () => {
	const deviceFlow = useDeviceAuthorizationFlow();
	const [currentStep, setCurrentStep] = useState(0);
	const [collapsedSections, setCollapsedSections] = useState<Record<SectionKey, boolean>>({
		overview: false,
		flowDiagram: true,
		credentials: false,
		deviceCodeOverview: false,
		deviceCodeDetails: false,
		userAuthOverview: false,
		userAuthDetails: false,
		pollingOverview: false,
		pollingDetails: false,
		tokensOverview: false,
		tokensDetails: false,
		userInfoOverview: false,
		userInfoDetails: false,
		introspectionOverview: false,
		introspectionDetails: false,
		completionOverview: false,
		completionDetails: false,
	});
	const [copiedField, setCopiedField] = useState<string | null>(null);
	const [userInfo, setUserInfo] = useState<any>(null);
	const [introspectionResult, setIntrospectionResult] = useState<any>(null);

	const toggleSection = useCallback((section: SectionKey) => {
		setCollapsedSections(prev => ({
			...prev,
			[section]: !prev[section],
		}));
	}, []);

	const handleCopy = useCallback((text: string, label: string) => {
		navigator.clipboard.writeText(text);
		setCopiedField(label);
		v4ToastManager.showSuccess(`${label} copied to clipboard!`);
		setTimeout(() => setCopiedField(null), 2000);
	}, []);

	const handleCredentialsChange = useCallback((field: string, value: string) => {
		// Update credentials as user types
		if (field === 'environmentId' || field === 'clientId' || field === 'clientSecret' || field === 'scopes') {
			const currentCreds = deviceFlow.credentials || {
				environmentId: '',
				clientId: '',
				clientSecret: '',
				scopes: 'openid',
			};
			deviceFlow.setCredentials({
				...currentCreds,
				[field]: value,
			});
		}
	}, [deviceFlow]);

	const handleSaveCredentials = useCallback(() => {
		if (!deviceFlow.credentials?.environmentId || !deviceFlow.credentials?.clientId) {
			v4ToastManager.showError('Please enter Environment ID and Client ID');
			return;
		}

		// Save to credential manager for dashboard status
		const scopesArray = (deviceFlow.credentials.scopes || 'openid').split(' ').filter(Boolean);
		credentialManager.saveAllCredentials({
			environmentId: deviceFlow.credentials.environmentId,
			clientId: deviceFlow.credentials.clientId,
			clientSecret: deviceFlow.credentials.clientSecret || '',
			scopes: scopesArray,
		});

		v4ToastManager.showSuccess('Credentials saved successfully!');
		console.log('[📺 OAUTH-DEVICE] [INFO] Credentials saved to credential manager');
	}, [deviceFlow.credentials]);

	const handleRequestDeviceCode = useCallback(async () => {
		try {
			await deviceFlow.requestDeviceCode();
			setCurrentStep(2); // Auto-advance to User Authorization step
		} catch (error) {
			// Error already handled in hook
		}
	}, [deviceFlow]);

	const handleStartPolling = useCallback(() => {
		deviceFlow.startPolling();
		setCurrentStep(3); // Move to polling step
	}, [deviceFlow]);

	const handleReset = useCallback(() => {
		deviceFlow.reset();
		setCurrentStep(0);
		setUserInfo(null);
		setIntrospectionResult(null);
	}, [deviceFlow]);

	// Step validation
	const isStepValid = useCallback((stepIndex: number): boolean => {
		switch (stepIndex) {
			case 0: return true; // Introduction
			case 1: return !!deviceFlow.credentials;
			case 2: return !!deviceFlow.deviceCodeData;
			case 3: return !!deviceFlow.deviceCodeData;
			case 4: return !!deviceFlow.tokens;
			case 5: return !!deviceFlow.tokens;
			case 6: return !!deviceFlow.tokens;
			case 7: return true; // Completion
			default: return false;
		}
	}, [deviceFlow.credentials, deviceFlow.deviceCodeData, deviceFlow.tokens]);

	// Auto-advance when tokens received
	React.useEffect(() => {
		if (deviceFlow.pollingStatus.status === 'success' && deviceFlow.tokens) {
			setCurrentStep(4);
		}
	}, [deviceFlow.pollingStatus.status, deviceFlow.tokens]);

	const renderStepContent = () => {
		switch (currentStep) {
			case 0:
				return renderIntroduction();
			case 1:
				return renderRequestDeviceCode();
			case 2:
				return renderUserAuthorization();
			case 3:
				return renderPolling();
			case 4:
				return renderTokens();
			case 5:
				return renderUserInfo();
			case 6:
				return renderIntrospection();
			case 7:
				return renderCompletion();
			default:
				return null;
		}
	};

	const renderIntroduction = () => (
		<>
			<CollapsibleSection>
				<CollapsibleHeaderButton
					onClick={() => toggleSection('overview')}
					aria-expanded={!collapsedSections.overview}
				>
					<CollapsibleTitle>
						<FiMonitor /> Device Authorization Flow Overview
					</CollapsibleTitle>
					<CollapsibleToggleIcon $collapsed={collapsedSections.overview}>
						<FiChevronDown />
					</CollapsibleToggleIcon>
				</CollapsibleHeaderButton>
				{!collapsedSections.overview && (
					<CollapsibleContent>
						<ExplanationSection>
							<ExplanationHeading>
								<FiInfo /> What is Device Authorization Flow?
							</ExplanationHeading>
							<InfoText>
								The Device Authorization Grant (RFC 8628) enables OAuth clients on input-constrained
								devices to obtain user authorization without a browser. Perfect for smart TVs, IoT devices,
								CLI tools, and gaming consoles.
							</InfoText>
							<InfoBox $variant="info" style={{ marginTop: '1rem' }}>
								<FiSmartphone size={20} />
								<div>
									<InfoTitle>Perfect for:</InfoTitle>
									<ul style={{ marginTop: '0.5rem', marginBottom: 0, paddingLeft: '1.5rem' }}>
										<li>Smart TVs and streaming devices</li>
										<li>Command-line tools and scripts</li>
										<li>IoT devices without keyboards</li>
										<li>Gaming consoles</li>
										<li>Devices with limited input capabilities</li>
									</ul>
								</div>
							</InfoBox>
						</ExplanationSection>
					</CollapsibleContent>
				)}
			</CollapsibleSection>

			<CollapsibleSection>
				<CollapsibleHeaderButton
					onClick={() => toggleSection('flowDiagram')}
					aria-expanded={!collapsedSections.flowDiagram}
				>
					<CollapsibleTitle>
						<FiZap /> How It Works
					</CollapsibleTitle>
					<CollapsibleToggleIcon $collapsed={collapsedSections.flowDiagram}>
						<FiChevronDown />
					</CollapsibleToggleIcon>
				</CollapsibleHeaderButton>
				{!collapsedSections.flowDiagram && (
					<CollapsibleContent>
						<ExplanationSection>
							<div style={{ 
								backgroundColor: '#f8fafc', 
								padding: '2rem', 
								borderRadius: '0.75rem',
								border: '2px solid #e2e8f0'
							}}>
								<ol style={{ margin: 0, paddingLeft: '1.5rem', lineHeight: '2' }}>
									<li style={{ marginBottom: '1rem' }}>
										<strong>Device requests device code</strong> - Device calls the device authorization endpoint
										with client_id and scopes
									</li>
									<li style={{ marginBottom: '1rem' }}>
										<strong>Display user code</strong> - Device shows user_code and verification_uri to user
										on screen (e.g., "Visit example.com and enter code: ABCD-1234")
									</li>
									<li style={{ marginBottom: '1rem' }}>
										<strong>User authorizes on secondary device</strong> - User visits URL on phone/computer,
										enters code, and authorizes the application
									</li>
									<li style={{ marginBottom: '1rem' }}>
										<strong>Device polls for tokens</strong> - Device continuously polls token endpoint
										until user completes authorization
									</li>
									<li>
										<strong>Tokens received</strong> - Device receives access token, ID token, and optionally
										refresh token
									</li>
								</ol>
							</div>
							<InfoBox $variant="success" style={{ marginTop: '1.5rem' }}>
								<FiCheckCircle size={20} />
								<div>
									<InfoTitle>Key Benefits</InfoTitle>
									<ul style={{ marginTop: '0.5rem', marginBottom: 0, paddingLeft: '1.5rem' }}>
										<li>No browser required on the device</li>
										<li>Secure - uses standard OAuth 2.0</li>
										<li>User-friendly - simple code entry</li>
										<li>Works on any device with a display</li>
									</ul>
								</div>
							</InfoBox>
						</ExplanationSection>
					</CollapsibleContent>
				)}
			</CollapsibleSection>

			<CollapsibleSection>
				<CollapsibleHeaderButton
					onClick={() => toggleSection('credentials')}
					aria-expanded={!collapsedSections.credentials}
				>
					<CollapsibleTitle>
						<FiKey /> Configure Credentials
					</CollapsibleTitle>
					<CollapsibleToggleIcon $collapsed={collapsedSections.credentials}>
						<FiChevronDown />
					</CollapsibleToggleIcon>
				</CollapsibleHeaderButton>
				{!collapsedSections.credentials && (
					<CollapsibleContent>
						<ExplanationSection>
							<ExplanationHeading>
								<FiKey /> PingOne Configuration
							</ExplanationHeading>
							<InfoText>
								Enter your PingOne credentials to enable the Device Authorization Flow.
							</InfoText>
							<div style={{ marginTop: '1.5rem' }}>
								<div style={{ marginBottom: '1rem' }}>
									<label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
										Environment ID
									</label>
									<input
										type="text"
										value={deviceFlow.credentials?.environmentId || ''}
										onChange={(e) => handleCredentialsChange('environmentId', e.target.value)}
										placeholder="Enter PingOne Environment ID"
										style={{
											width: '100%',
											padding: '0.75rem',
											border: '1px solid #d1d5db',
											borderRadius: '0.5rem',
											fontSize: '0.875rem'
										}}
									/>
								</div>
								<div style={{ marginBottom: '1rem' }}>
									<label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
										Client ID
									</label>
									<input
										type="text"
										value={deviceFlow.credentials?.clientId || ''}
										onChange={(e) => handleCredentialsChange('clientId', e.target.value)}
										placeholder="Enter Client ID"
										style={{
											width: '100%',
											padding: '0.75rem',
											border: '1px solid #d1d5db',
											borderRadius: '0.5rem',
											fontSize: '0.875rem'
										}}
									/>
								</div>
								<div style={{ marginBottom: '1rem' }}>
									<label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
										Scopes
									</label>
									<input
										type="text"
										value={deviceFlow.credentials?.scopes || 'openid'}
										onChange={(e) => handleCredentialsChange('scopes', e.target.value)}
										placeholder="openid"
										style={{
											width: '100%',
											padding: '0.75rem',
											border: '1px solid #d1d5db',
											borderRadius: '0.5rem',
											fontSize: '0.875rem'
										}}
									/>
								</div>
							</div>
							<ActionRow>
								<Button
									onClick={handleSaveCredentials}
									$variant="primary"
									disabled={!deviceFlow.credentials?.environmentId || !deviceFlow.credentials?.clientId}
								>
									<FiKey /> Save Credentials
								</Button>
							</ActionRow>
						</ExplanationSection>
					</CollapsibleContent>
				)}
			</CollapsibleSection>
		</>
	);

	const renderRequestDeviceCode = () => (
		<>
			<CollapsibleSection>
				<CollapsibleHeaderButton
					onClick={() => toggleSection('deviceCodeOverview')}
					aria-expanded={!collapsedSections.deviceCodeOverview}
				>
					<CollapsibleTitle>
						<FiKey /> Request Device Code
					</CollapsibleTitle>
					<CollapsibleToggleIcon $collapsed={collapsedSections.deviceCodeOverview}>
						<FiChevronDown />
					</CollapsibleToggleIcon>
				</CollapsibleHeaderButton>
				{!collapsedSections.deviceCodeOverview && (
					<CollapsibleContent>
						<ExplanationSection>
							<ExplanationHeading>
								<FiKey /> Initiate Device Authorization
							</ExplanationHeading>
							<InfoText>
								Request a device code and user code from PingOne's device authorization endpoint.
								This is the first step in the device authorization flow.
							</InfoText>
							<InfoBox $variant="info" style={{ marginTop: '1rem' }}>
								<FiInfo size={20} />
								<div>
									<InfoTitle>What happens:</InfoTitle>
									<InfoText>
										The device sends a POST request to the device authorization endpoint with the client_id
										and requested scopes. PingOne responds with a device_code, user_code, verification_uri,
										and polling interval.
									</InfoText>
								</div>
							</InfoBox>
							<ActionRow style={{ marginTop: '1.5rem' }}>
								<Button
									onClick={handleRequestDeviceCode}
									disabled={!deviceFlow.credentials?.environmentId || !!deviceFlow.deviceCodeData}
								>
									<FiKey /> Request Device Code
								</Button>
								{deviceFlow.deviceCodeData && (
									<Button
										onClick={handleReset}
										$variant="outline"
									>
										<FiRefreshCw /> Start Over
									</Button>
								)}
							</ActionRow>
						</ExplanationSection>
					</CollapsibleContent>
				)}
			</CollapsibleSection>

			{deviceFlow.deviceCodeData && (
				<CollapsibleSection>
					<CollapsibleHeaderButton
						onClick={() => toggleSection('deviceCodeDetails')}
						aria-expanded={!collapsedSections.deviceCodeDetails}
					>
						<CollapsibleTitle>
							<FiCheckCircle /> Device Code Received
						</CollapsibleTitle>
						<CollapsibleToggleIcon $collapsed={collapsedSections.deviceCodeDetails}>
							<FiChevronDown />
						</CollapsibleToggleIcon>
					</CollapsibleHeaderButton>
					{!collapsedSections.deviceCodeDetails && (
						<CollapsibleContent>
							<InfoBox $variant="success">
								<FiCheckCircle size={20} />
								<div>
									<InfoTitle>Success!</InfoTitle>
									<InfoText>
										Device code received from PingOne. You can now display the user code to the user.
									</InfoText>
								</div>
							</InfoBox>
							<ResultsSection style={{ marginTop: '1rem' }}>
								<GeneratedContentBox>
									<GeneratedLabel>Device Code Response</GeneratedLabel>
									<ParameterGrid>
										<div style={{ gridColumn: '1 / -1' }}>
											<ParameterLabel>Device Code (Internal - Do Not Display)</ParameterLabel>
											<ParameterValue style={{ 
												wordBreak: 'break-all', 
												fontFamily: 'monospace',
												fontSize: '0.75rem',
												color: '#64748b'
											}}>
												{deviceFlow.deviceCodeData.device_code.substring(0, 20)}...
											</ParameterValue>
										</div>
										<div>
											<ParameterLabel>Expires In</ParameterLabel>
											<ParameterValue>{deviceFlow.deviceCodeData.expires_in} seconds</ParameterValue>
										</div>
										<div>
											<ParameterLabel>Poll Interval</ParameterLabel>
											<ParameterValue>{deviceFlow.deviceCodeData.interval} seconds</ParameterValue>
										</div>
									</ParameterGrid>
								</GeneratedContentBox>
							</ResultsSection>
						</CollapsibleContent>
					)}
				</CollapsibleSection>
			)}
		</>
	);

	const renderUserAuthorization = () => (
		<>
			{deviceFlow.deviceCodeData && (
				<>
					<CollapsibleSection>
						<CollapsibleHeaderButton
							onClick={() => toggleSection('userAuthOverview')}
							aria-expanded={!collapsedSections.userAuthOverview}
						>
							<CollapsibleTitle>
								<FiSmartphone /> User Authorization Required
							</CollapsibleTitle>
							<CollapsibleToggleIcon $collapsed={collapsedSections.userAuthOverview}>
								<FiChevronDown />
							</CollapsibleToggleIcon>
						</CollapsibleHeaderButton>
						{!collapsedSections.userAuthOverview && (
							<CollapsibleContent>
								<InfoBox $variant="info">
									<FiInfo size={20} />
									<div>
										<InfoTitle>Display This Information to the User</InfoTitle>
										<InfoText>
											The user needs to visit the verification URL and enter the user code on a secondary
											device (phone, computer, tablet, etc.). Show this information prominently on your device's screen.
										</InfoText>
									</div>
								</InfoBox>

								<VerificationBox>
									<h3 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', color: '#1e293b' }}>
										To authorize this device:
									</h3>
									<p style={{ margin: '0 0 1.5rem 0', fontSize: '1rem', color: '#64748b' }}>
										Visit this URL on your phone or computer:
									</p>
									<GeneratedUrlDisplay style={{ 
										fontSize: '1.5rem',
										fontWeight: '700',
										color: '#3b82f6',
										marginBottom: '1.5rem',
										padding: '1rem',
										backgroundColor: '#ffffff',
										borderRadius: '0.5rem',
										border: '2px solid #3b82f6'
									}}>
										{deviceFlow.deviceCodeData.verification_uri}
									</GeneratedUrlDisplay>
									<p style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#64748b' }}>
										Then enter this code:
									</p>
									<UserCodeDisplay
										onClick={() => handleCopy(deviceFlow.deviceCodeData!.user_code, 'User Code')}
										title="Click to copy"
									>
										{deviceFlow.deviceCodeData.user_code}
									</UserCodeDisplay>
								</VerificationBox>

								<ActionRow>
									<Button
										onClick={() => handleCopy(deviceFlow.deviceCodeData!.verification_uri, 'Verification URL')}
										$variant="outline"
									>
										<FiCopy /> Copy URL
									</Button>
									<Button
										onClick={() => handleCopy(deviceFlow.deviceCodeData!.user_code, 'User Code')}
										$variant="outline"
									>
										<FiCopy /> Copy Code
									</Button>
									<Button
										onClick={() => window.open(deviceFlow.deviceCodeData!.verification_uri, '_blank')}
										$variant="primary"
									>
										<FiExternalLink /> Open Verification Page
									</Button>
								</ActionRow>

								{deviceFlow.deviceCodeData.verification_uri_complete && (
									<ResultsSection style={{ marginTop: '1.5rem' }}>
										<GeneratedContentBox>
											<GeneratedLabel>Direct Link (Pre-filled Code)</GeneratedLabel>
											<QRCodeContainer>
												<div style={{ textAlign: 'center', width: '100%' }}>
													<p style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', color: '#64748b' }}>
														This URL includes the user code pre-filled. Generate a QR code from this URL
														for easy scanning:
													</p>
													<code style={{ 
														fontSize: '0.875rem',
														wordBreak: 'break-all',
														display: 'block',
														padding: '1rem',
														backgroundColor: '#f1f5f9',
														borderRadius: '0.5rem',
														border: '1px solid #cbd5e1',
														fontFamily: 'monospace'
													}}>
														{deviceFlow.deviceCodeData.verification_uri_complete}
													</code>
												</div>
											</QRCodeContainer>
											<ActionRow>
												<Button
													onClick={() => handleCopy(deviceFlow.deviceCodeData!.verification_uri_complete!, 'Complete URL')}
													$variant="outline"
												>
													<FiCopy /> Copy Complete URL
												</Button>
											</ActionRow>
										</GeneratedContentBox>
									</ResultsSection>
								)}

								{deviceFlow.timeRemaining > 0 && (
									<CountdownTimer>
										⏱️ Code expires in: {deviceFlow.formatTimeRemaining(deviceFlow.timeRemaining)}
									</CountdownTimer>
								)}

								<ActionRow style={{ marginTop: '1.5rem' }}>
									<Button
										onClick={handleStartPolling}
										disabled={deviceFlow.pollingStatus.isPolling}
									>
										<FiRefreshCw /> Start Polling for Authorization
									</Button>
								</ActionRow>
							</CollapsibleContent>
						)}
					</CollapsibleSection>
				</>
			)}
		</>
	);

	const renderPolling = () => (
		<>
			<CollapsibleSection>
				<CollapsibleHeaderButton
					onClick={() => toggleSection('pollingOverview')}
					aria-expanded={!collapsedSections.pollingOverview}
				>
					<CollapsibleTitle>
						<FiClock /> Polling for Authorization
					</CollapsibleTitle>
					<CollapsibleToggleIcon $collapsed={collapsedSections.pollingOverview}>
						<FiChevronDown />
					</CollapsibleToggleIcon>
				</CollapsibleHeaderButton>
				{!collapsedSections.pollingOverview && (
					<CollapsibleContent>
						<ExplanationSection>
							<ExplanationHeading>
								<FiClock /> Waiting for User Authorization
							</ExplanationHeading>
							<InfoText>
								The device is polling PingOne's token endpoint, waiting for the user to complete
								authorization on their secondary device.
							</InfoText>

							<PollingIndicator $isActive={deviceFlow.pollingStatus.isPolling}>
								{deviceFlow.pollingStatus.isPolling ? (
									<>
										<FiRefreshCw size={24} />
										<div style={{ flex: 1 }}>
											<strong style={{ fontSize: '1.125rem' }}>Polling for tokens...</strong>
											<div style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>
												Attempt {deviceFlow.pollingStatus.attempts} of {deviceFlow.pollingStatus.maxAttempts}
												{deviceFlow.pollingStatus.lastAttempt && (
													<> • Last attempt: {new Date(deviceFlow.pollingStatus.lastAttempt).toLocaleTimeString()}</>
												)}
											</div>
										</div>
									</>
								) : (
									<>
										<FiClock size={24} />
										<div style={{ flex: 1 }}>
											<strong style={{ fontSize: '1.125rem' }}>
												{deviceFlow.pollingStatus.status === 'success' ? 'Authorization Complete!' : 'Ready to poll'}
											</strong>
											<div style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>
												{deviceFlow.pollingStatus.status === 'success' 
													? 'Tokens have been received successfully'
													: 'Click "Start Polling" to begin waiting for user authorization'}
											</div>
										</div>
									</>
								)}
							</PollingIndicator>

							{deviceFlow.pollingStatus.error && (
								<InfoBox $variant="error" style={{ marginTop: '1rem' }}>
									<FiAlertCircle size={20} />
									<div>
										<InfoTitle>Polling Error</InfoTitle>
										<InfoText>{deviceFlow.pollingStatus.error}</InfoText>
									</div>
								</InfoBox>
							)}

							{deviceFlow.timeRemaining > 0 && (
								<CountdownTimer>
									⏱️ Time remaining: {deviceFlow.formatTimeRemaining(deviceFlow.timeRemaining)}
								</CountdownTimer>
							)}

							<ActionRow style={{ marginTop: '1.5rem' }}>
								{!deviceFlow.pollingStatus.isPolling ? (
									<Button
										onClick={deviceFlow.startPolling}
										disabled={!deviceFlow.deviceCodeData || deviceFlow.timeRemaining === 0 || deviceFlow.pollingStatus.status === 'success'}
									>
										<FiRefreshCw /> Start Polling
									</Button>
								) : (
									<Button
										onClick={deviceFlow.stopPolling}
										$variant="outline"
									>
										<FiAlertCircle /> Stop Polling
									</Button>
								)}
								<Button
									onClick={handleReset}
									$variant="outline"
								>
									<FiRefreshCw /> Start Over
								</Button>
							</ActionRow>
						</ExplanationSection>
					</CollapsibleContent>
				)}
			</CollapsibleSection>
		</>
	);

	const renderTokens = () => (
		<>
			<CollapsibleSection>
				<CollapsibleHeaderButton
					onClick={() => toggleSection('tokensOverview')}
					aria-expanded={!collapsedSections.tokensOverview}
				>
					<CollapsibleTitle>
						<FiCheckCircle /> Tokens Received
					</CollapsibleTitle>
					<CollapsibleToggleIcon $collapsed={collapsedSections.tokensOverview}>
						<FiChevronDown />
					</CollapsibleToggleIcon>
				</CollapsibleHeaderButton>
				{!collapsedSections.tokensOverview && (
					<CollapsibleContent>
						<InfoBox $variant="success">
							<FiCheckCircle size={20} />
							<div>
								<InfoTitle>Authorization Complete!</InfoTitle>
								<InfoText>
									The user has successfully authorized the device. Tokens have been received and stored.
								</InfoText>
							</div>
						</InfoBox>

						{deviceFlow.tokens && (
							<>
								<ResultsSection style={{ marginTop: '1.5rem' }}>
									<ResultsHeading>
										<FiKey size={18} /> Access Token
									</ResultsHeading>
									<GeneratedContentBox>
										<ParameterGrid>
											<div style={{ gridColumn: '1 / -1' }}>
												<ParameterLabel>Access Token</ParameterLabel>
												<ParameterValue style={{ 
													wordBreak: 'break-all',
													fontFamily: 'monospace',
													fontSize: '0.75rem'
												}}>
													{deviceFlow.tokens.access_token}
												</ParameterValue>
											</div>
											{deviceFlow.tokens.token_type && (
												<div>
													<ParameterLabel>Token Type</ParameterLabel>
													<ParameterValue>{deviceFlow.tokens.token_type}</ParameterValue>
												</div>
											)}
											{deviceFlow.tokens.expires_in && (
												<div>
													<ParameterLabel>Expires In</ParameterLabel>
													<ParameterValue>{deviceFlow.tokens.expires_in} seconds</ParameterValue>
												</div>
											)}
											{deviceFlow.tokens.scope && (
												<div style={{ gridColumn: '1 / -1' }}>
													<ParameterLabel>Scope</ParameterLabel>
													<ParameterValue>{deviceFlow.tokens.scope}</ParameterValue>
												</div>
											)}
										</ParameterGrid>
										<ActionRow>
											<Button
												onClick={() => handleCopy(deviceFlow.tokens!.access_token, 'Access Token')}
												$variant="outline"
											>
												<FiCopy /> Copy Access Token
											</Button>
										</ActionRow>
									</GeneratedContentBox>
								</ResultsSection>

								{deviceFlow.tokens.id_token && (
									<ResultsSection>
										<ResultsHeading>
											<FiShield size={18} /> ID Token
										</ResultsHeading>
										<GeneratedContentBox>
											<ParameterGrid>
												<div style={{ gridColumn: '1 / -1' }}>
													<ParameterLabel>ID Token (JWT)</ParameterLabel>
													<ParameterValue style={{ 
														wordBreak: 'break-all',
														fontFamily: 'monospace',
														fontSize: '0.75rem'
													}}>
														{deviceFlow.tokens.id_token}
													</ParameterValue>
												</div>
											</ParameterGrid>
											<ActionRow>
												<Button
													onClick={() => handleCopy(deviceFlow.tokens!.id_token!, 'ID Token')}
													$variant="outline"
												>
													<FiCopy /> Copy ID Token
												</Button>
											</ActionRow>
										</GeneratedContentBox>
									</ResultsSection>
								)}

								{deviceFlow.tokens.refresh_token && (
									<ResultsSection>
										<ResultsHeading>
											<FiRefreshCw size={18} /> Refresh Token
										</ResultsHeading>
										<GeneratedContentBox>
											<ParameterGrid>
												<div style={{ gridColumn: '1 / -1' }}>
													<ParameterLabel>Refresh Token</ParameterLabel>
													<ParameterValue style={{ 
														wordBreak: 'break-all',
														fontFamily: 'monospace',
														fontSize: '0.75rem'
													}}>
														{deviceFlow.tokens.refresh_token}
													</ParameterValue>
												</div>
											</ParameterGrid>
											<ActionRow>
												<Button
													onClick={() => handleCopy(deviceFlow.tokens!.refresh_token!, 'Refresh Token')}
													$variant="outline"
												>
													<FiCopy /> Copy Refresh Token
												</Button>
											</ActionRow>
										</GeneratedContentBox>
									</ResultsSection>
								)}
							</>
						)}
					</CollapsibleContent>
				)}
			</CollapsibleSection>
		</>
	);

	const renderUserInfo = () => (
		<>
			<CollapsibleSection>
				<CollapsibleHeaderButton
					onClick={() => toggleSection('userInfoOverview')}
					aria-expanded={!collapsedSections.userInfoOverview}
				>
					<CollapsibleTitle>
						<FiInfo /> User Information (Coming Soon)
						</CollapsibleTitle>
					<CollapsibleToggleIcon $collapsed={collapsedSections.userInfoOverview}>
						<FiChevronDown />
					</CollapsibleToggleIcon>
				</CollapsibleHeaderButton>
				{!collapsedSections.userInfoOverview && (
					<CollapsibleContent>
						<InfoBox $variant="info">
							<FiInfo size={20} />
							<div>
								<InfoTitle>User Information Endpoint</InfoTitle>
								<InfoText>
									Use the access token to fetch user information from the /userinfo endpoint.
									This feature will be added in a future update.
								</InfoText>
							</div>
						</InfoBox>
					</CollapsibleContent>
				)}
			</CollapsibleSection>
		</>
	);

	const renderIntrospection = () => (
		<>
			<CollapsibleSection>
				<CollapsibleHeaderButton
					onClick={() => toggleSection('introspectionOverview')}
					aria-expanded={!collapsedSections.introspectionOverview}
				>
					<CollapsibleTitle>
						<FiShield /> Token Introspection (Coming Soon)
					</CollapsibleTitle>
					<CollapsibleToggleIcon $collapsed={collapsedSections.introspectionOverview}>
						<FiChevronDown />
					</CollapsibleToggleIcon>
				</CollapsibleHeaderButton>
				{!collapsedSections.introspectionOverview && (
					<CollapsibleContent>
						<InfoBox $variant="info">
							<FiShield size={20} />
							<div>
								<InfoTitle>Token Introspection</InfoTitle>
								<InfoText>
									Introspect the access token to validate it and view its claims.
									This feature will be added in a future update.
								</InfoText>
							</div>
						</InfoBox>
					</CollapsibleContent>
				)}
			</CollapsibleSection>
		</>
	);

	const renderCompletion = () => (
		<>
			<CollapsibleSection>
				<CollapsibleHeaderButton
					onClick={() => toggleSection('completionOverview')}
					aria-expanded={!collapsedSections.completionOverview}
				>
					<CollapsibleTitle>
						<FiCheckCircle /> Flow Complete
					</CollapsibleTitle>
					<CollapsibleToggleIcon $collapsed={collapsedSections.completionOverview}>
						<FiChevronDown />
					</CollapsibleToggleIcon>
				</CollapsibleHeaderButton>
				{!collapsedSections.completionOverview && (
					<CollapsibleContent>
						<InfoBox $variant="success">
							<FiCheckCircle size={24} />
							<div>
								<InfoTitle>Device Authorization Flow Complete!</InfoTitle>
								<InfoText>
									You've successfully completed the OAuth Device Authorization Grant flow. The device
									has been authorized and tokens have been received.
								</InfoText>
							</div>
						</InfoBox>

						<ExplanationSection style={{ marginTop: '1.5rem' }}>
							<ExplanationHeading>
								<FiInfo /> Summary
							</ExplanationHeading>
							<div style={{ 
								backgroundColor: '#f8fafc', 
								padding: '1.5rem', 
								borderRadius: '0.5rem',
								border: '1px solid #e2e8f0'
							}}>
								<ul style={{ margin: 0, paddingLeft: '1.5rem', lineHeight: '2' }}>
									<li>✅ Device code requested and received</li>
									<li>✅ User code displayed to user</li>
									<li>✅ User authorized on secondary device</li>
									<li>✅ Tokens received via polling</li>
									{userInfo && <li>✅ User information retrieved</li>}
									{introspectionResult && <li>✅ Token introspected and validated</li>}
								</ul>
							</div>
						</ExplanationSection>

						<ExplanationSection style={{ marginTop: '1.5rem' }}>
							<ExplanationHeading>
								<FiZap /> Next Steps
							</ExplanationHeading>
							<InfoText>
								In a production application, you would:
							</InfoText>
							<ul style={{ marginTop: '0.75rem', paddingLeft: '1.5rem', lineHeight: '1.8' }}>
								<li>Store the access token securely</li>
								<li>Use the access token to call protected APIs</li>
								<li>Refresh the token when it expires (if refresh token provided)</li>
								<li>Handle token expiration and re-authorization</li>
								<li>Implement proper error handling and retry logic</li>
							</ul>
						</ExplanationSection>

						<ActionRow style={{ marginTop: '1.5rem' }}>
							<Button onClick={handleReset}>
								<FiRefreshCw /> Start New Flow
							</Button>
						</ActionRow>
					</CollapsibleContent>
				)}
			</CollapsibleSection>
		</>
	);

	return (
		<FlowContainer>
			<FlowHeader>
				<div>
					<StepBadge>DEVICE CODE AUTHORIZATION • V5 API</StepBadge>
					<FlowTitle>{STEP_METADATA[currentStep].title}</FlowTitle>
					<FlowSubtitle>{STEP_METADATA[currentStep].subtitle}</FlowSubtitle>
				</div>
				<div style={{ fontSize: '2rem', fontWeight: '700', color: '#ffffff' }}>
					{String(currentStep + 1).padStart(2, '0')}
					<span style={{ fontSize: '1.25rem', color: 'rgba(255, 255, 255, 0.75)' }}> of {STEP_METADATA.length}</span>
				</div>
			</FlowHeader>

			<FlowContent>
				{renderStepContent()}

				<StepNavigationButtons
					currentStep={currentStep}
					totalSteps={STEP_METADATA.length}
					onPrevious={() => setCurrentStep(prev => Math.max(prev - 1, 0))}
					onReset={handleReset}
					onNext={() => setCurrentStep(prev => Math.min(prev + 1, STEP_METADATA.length - 1))}
					canNavigateNext={isStepValid(currentStep + 1)}
					isFirstStep={currentStep === 0}
					nextButtonText={isStepValid(currentStep + 1) ? 'Next' : 'Complete above action'}
					disabledMessage="Complete the action above to continue"
				/>
			</FlowContent>
		</FlowContainer>
	);
};

export default DeviceAuthorizationFlowV5;
