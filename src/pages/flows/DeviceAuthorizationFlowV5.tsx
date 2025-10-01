// src/pages/flows/DeviceAuthorizationFlowV5.tsx
// OAuth Device Authorization Grant (RFC 8628) - V5 Implementation

import { QRCodeSVG } from 'qrcode.react';
import React, { useCallback, useState } from 'react';
import {
	FiAlertCircle,
	FiCheckCircle,
	FiChevronDown,
	FiClock,
	FiCopy,
	FiExternalLink,
	FiInfo,
	FiKey,
	FiMonitor,
	FiRefreshCw,
	FiShield,
	FiSmartphone,
	FiZap,
} from 'react-icons/fi';
import { themeService } from '../../services/themeService';
import styled from 'styled-components';
import FlowInfoCard from '../../components/FlowInfoCard';
import { ExplanationHeading, ExplanationSection } from '../../components/InfoBlocks';
import { ResultsHeading, ResultsSection } from '../../components/ResultsPanel';
import { StepNavigationButtons } from '../../components/StepNavigationButtons';
import TokenIntrospect from '../../components/TokenIntrospect';
import { useUISettings } from '../../contexts/UISettingsContext';
import { useDeviceAuthorizationFlow } from '../../hooks/useDeviceAuthorizationFlow';
import { credentialManager } from '../../utils/credentialManager';
import { getFlowInfo } from '../../utils/flowInfoConfig';
import { v4ToastManager } from '../../utils/v4ToastMessages';

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
	${() => themeService.getCollapseIconStyles()}
	display: inline-flex;
	width: 32px;
	height: 32px;
	border-radius: 50%;
	transform: ${({ $collapsed }) => ($collapsed ? 'rotate(-90deg)' : 'rotate(0deg)')};

	svg {
		width: 16px;
		height: 16px;
	}

	&:hover {
		transform: ${({ $collapsed }) =>
			$collapsed ? 'rotate(-90deg) scale(1.1)' : 'rotate(0deg) scale(1.1)'};
	}
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

const _GeneratedUrlDisplay = styled.div`
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
	{
		title: 'Step 0: Introduction & Setup',
		subtitle: 'Understand the Device Authorization Code Flow',
	},
	{ title: 'Step 1: Request Device Code', subtitle: 'Initiate device authorization' },
	{ title: 'Step 2: User Authorization & Polling', subtitle: 'Scan QR code and watch TV update' },
	{ title: 'Step 3: Tokens Received', subtitle: 'View and analyze tokens' },
	{ title: 'Step 4: Token Introspection', subtitle: 'Validate and inspect tokens' },
	{ title: 'Step 5: Flow Complete', subtitle: 'Summary and next steps' },
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
const _UserCodeDisplay = styled.div`
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

const _PollingIndicator = styled.div<{ $isActive: boolean }>`
	display: flex;
	align-items: center;
	gap: 1rem;
	padding: 1.5rem;
	background-color: ${(props) => (props.$isActive ? '#dbeafe' : '#f1f5f9')};
	border: 2px solid ${(props) => (props.$isActive ? '#3b82f6' : '#cbd5e1')};
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

	${(props) =>
		props.$isActive &&
		`
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

const _QRCodeContainer = styled.div`
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

const SmartTVContainer = styled.div`
	display: flex;
	flex-direction: column;
	gap: 2rem;
	margin: 2rem 0;
`;

const SmartTV = styled.div<{ $isWaiting: boolean }>`
	width: 100%;
	max-width: 900px;
	margin: 0 auto;
	background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
	border-radius: 1rem;
	padding: 2rem;
	color: #ffffff;
	box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
	position: relative;
	overflow: visible;
	border: 12px solid #0f172a;

	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 4px;
		background: ${({ $isWaiting }) =>
			$isWaiting ? 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #3b82f6 100%)' : '#22c55e'};
		animation: ${({ $isWaiting }) => ($isWaiting ? 'shimmer 2s infinite' : 'none')};
		background-size: 200% 100%;
	}

	&::after {
		content: '';
		position: absolute;
		bottom: -30px;
		left: 50%;
		transform: translateX(-50%);
		width: 120px;
		height: 30px;
		background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
		border-radius: 0 0 12px 12px;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
	}

	@keyframes shimmer {
		0% { background-position: -200% 0; }
		100% { background-position: 200% 0; }
	}
`;

const TVScreen = styled.div<{ $showContent?: boolean }>`
	background: ${({ $showContent }) =>
		$showContent ? 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%)' : '#000000'};
	border: 2px solid #1e293b;
	border-radius: 0.5rem;
	padding: ${({ $showContent }) => ($showContent ? '2rem' : '3rem')};
	margin-bottom: 1rem;
	min-height: 350px;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	text-align: center;
	box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.5);
	position: relative;
	overflow: hidden;
`;

const TVDisplay = styled.div`
	font-family: 'Courier New', monospace;
	font-size: 1.25rem;
	color: #22c55e;
	line-height: 1.8;
`;

const TVStatusIndicator = styled.div<{ $active?: boolean }>`
	background-color: ${({ $active }) => ($active ? '#22c55e' : '#ef4444')};
	border-radius: 50%;
	width: 12px;
	height: 12px;
	display: inline-block;
	margin-right: 0.5rem;
	box-shadow: 0 0 10px ${({ $active }) => ($active ? '#22c55e' : '#ef4444')};
	transition: all 0.3s ease;

	${({ $active }) =>
		$active &&
		`
		animation: pulse 2s infinite;
	`}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.5; }
	}
`;

const AppGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 0.75rem;
	width: 100%;
	padding: 0.5rem;
`;

const AppIcon = styled.div<{ $color: string }>`
	aspect-ratio: 1;
	background: ${({ $color }) => $color};
	border-radius: 0.5rem;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 0.75rem;
	font-weight: bold;
	color: white;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
	cursor: pointer;
	transition: transform 0.2s ease;

	&:hover {
		transform: scale(1.05);
	}
`;

const WelcomeMessage = styled.div`
	font-size: 1.5rem;
	font-weight: 600;
	color: #ffffff;
	margin-bottom: 1rem;
	text-align: center;
`;

const ScrollIndicator = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	margin: 1.5rem 0;
	padding: 1rem;
	background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
	border: 2px solid #3b82f6;
	border-radius: 0.75rem;
	animation: pulse 2s ease-in-out infinite;

	@keyframes pulse {
		0%, 100% {
			transform: translateY(0);
			opacity: 1;
		}
		50% {
			transform: translateY(5px);
			opacity: 0.8;
		}
	}
`;

const ScrollText = styled.div`
	font-size: 1rem;
	font-weight: 600;
	color: #1e40af;
	margin-bottom: 0.5rem;
`;

const ScrollArrow = styled.div`
	font-size: 2rem;
	color: #3b82f6;
	animation: bounce 1.5s ease-in-out infinite;

	@keyframes bounce {
		0%, 100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(8px);
		}
	}
`;

const ModalOverlay = styled.div<{ $isOpen: boolean }>`
	display: ${({ $isOpen }) => ($isOpen ? 'flex' : 'none')};
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.7);
	z-index: 1000;
	align-items: center;
	justify-content: center;
	padding: 1rem;
	animation: fadeIn 0.2s ease;

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}
`;

const ModalContent = styled.div`
	background: white;
	border-radius: 1rem;
	padding: 2rem;
	max-width: 500px;
	width: 100%;
	box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
	animation: slideUp 0.3s ease;

	@keyframes slideUp {
		from {
			transform: translateY(20px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}
`;

const ModalHeader = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	margin-bottom: 1rem;
	color: #1e293b;
`;

const ModalTitle = styled.h3`
	margin: 0;
	font-size: 1.5rem;
	font-weight: 600;
`;

const ModalBody = styled.div`
	color: #475569;
	font-size: 1rem;
	line-height: 1.6;
	margin-bottom: 1.5rem;
`;

const ModalActions = styled.div`
	display: flex;
	gap: 0.75rem;
	justify-content: flex-end;
`;

const QRSection = styled.div`
	width: 100%;
	max-width: 500px;
	margin: 0 auto;
	background-color: #ffffff;
	border: 2px solid #e2e8f0;
	border-radius: 1rem;
	padding: 2rem;
	text-align: center;
`;

const _VerificationBox = styled.div`
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
	const [_copiedField, setCopiedField] = useState<string | null>(null);
	const [userInfo, setUserInfo] = useState<any>(null);
	const [introspectionResult, setIntrospectionResult] = useState<any>(null);
	const [showPollingModal, setShowPollingModal] = useState(false);
	const { settings } = useUISettings();

	// Load saved credentials on mount
	React.useEffect(() => {
		const savedCreds = credentialManager.getAllCredentials();
		if (savedCreds.environmentId && savedCreds.clientId) {
			deviceFlow.setCredentials({
				environmentId: savedCreds.environmentId,
				clientId: savedCreds.clientId,
				clientSecret: savedCreds.clientSecret || '',
				scopes: savedCreds.scopes?.join(' ') || 'openid',
			});
			console.log('[📺 OAUTH-DEVICE] [INFO] Loaded saved credentials from credential manager');
		}
	}, [deviceFlow.setCredentials]); // Only run on mount

	// Show polling prompt modal when device code is received
	React.useEffect(() => {
		if (
			deviceFlow.deviceCodeData &&
			!deviceFlow.pollingStatus.isPolling &&
			!deviceFlow.tokens &&
			settings.showPollingPrompt
		) {
			setShowPollingModal(true);
		}
	}, [
		deviceFlow.deviceCodeData,
		deviceFlow.pollingStatus.isPolling,
		deviceFlow.tokens,
		settings.showPollingPrompt,
	]);

	const toggleSection = useCallback((section: SectionKey) => {
		setCollapsedSections((prev) => ({
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

	const handleCredentialsChange = useCallback(
		(field: string, value: string) => {
			// Update credentials as user types
			if (
				field === 'environmentId' ||
				field === 'clientId' ||
				field === 'clientSecret' ||
				field === 'scopes'
			) {
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
		},
		[deviceFlow]
	);

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

	const navigateToTokenManagement = useCallback(() => {
		// Set flow source for Token Management page
		sessionStorage.setItem('flow_source', 'device-authorization-v5');

		// Store comprehensive flow context for Token Management page
		const flowContext = {
			flow: 'device-authorization-v5',
			tokens: deviceFlow.tokens,
			credentials: deviceFlow.credentials,
		};
		sessionStorage.setItem('tokenManagementFlowContext', JSON.stringify(flowContext));

		// If we have tokens, pass them to Token Management
		if (deviceFlow.tokens?.access_token) {
			// Use localStorage for cross-tab communication
			localStorage.setItem('token_to_analyze', deviceFlow.tokens.access_token);
			localStorage.setItem('token_type', 'access');
			localStorage.setItem('flow_source', 'device-authorization-v5');
			console.log(
				'🔍 [DeviceAuthorizationFlowV5] Passing access token to Token Management via localStorage'
			);
		}

		window.location.href = '/token-management';
	}, [deviceFlow.tokens, deviceFlow.credentials]);

	const navigateToTokenManagementWithRefreshToken = useCallback(() => {
		// Set flow source for Token Management page
		sessionStorage.setItem('flow_source', 'device-authorization-v5');

		// Store comprehensive flow context for Token Management page
		const flowContext = {
			flow: 'device-authorization-v5',
			tokens: deviceFlow.tokens,
			credentials: deviceFlow.credentials,
		};
		sessionStorage.setItem('tokenManagementFlowContext', JSON.stringify(flowContext));

		// If we have refresh token, pass it to Token Management
		if (deviceFlow.tokens?.refresh_token) {
			// Use localStorage for cross-tab communication
			localStorage.setItem('token_to_analyze', deviceFlow.tokens.refresh_token);
			localStorage.setItem('token_type', 'refresh');
			localStorage.setItem('flow_source', 'device-authorization-v5');
			console.log(
				'🔍 [DeviceAuthorizationFlowV5] Passing refresh token to Token Management via localStorage'
			);
		}

		window.location.href = '/token-management';
	}, [deviceFlow.tokens, deviceFlow.credentials]);

	const handleRequestDeviceCode = useCallback(async () => {
		try {
			await deviceFlow.requestDeviceCode();
			setCurrentStep(2); // Auto-advance to User Authorization step
		} catch (_error) {
			// Error already handled in hook
		}
	}, [deviceFlow]);

	const handleStartPolling = useCallback(() => {
		setShowPollingModal(false);
		deviceFlow.startPolling();
		// Stay on current step (User Authorization - step 2) so user can see Smart TV update
		// Don't advance to step 3 - let user see the real-time polling results on the TV display
	}, [deviceFlow]);

	const handleDismissModal = useCallback(() => {
		setShowPollingModal(false);
	}, []);

	const handleReset = useCallback(() => {
		deviceFlow.reset();
		setCurrentStep(0);
		setShowPollingModal(false);
		setUserInfo(null);
		setIntrospectionResult(null);
	}, [deviceFlow]);

	// Step validation
	const isStepValid = useCallback(
		(stepIndex: number): boolean => {
			switch (stepIndex) {
				case 0:
					return true; // Introduction
				case 1:
					return !!deviceFlow.credentials;
				case 2:
					return !!deviceFlow.deviceCodeData;
				case 3:
					return !!deviceFlow.tokens; // Tokens (old step 4)
				case 4:
					return !!deviceFlow.tokens; // Introspection (old step 5)
				case 5:
					return true; // Completion (old step 6)
				default:
					return false;
			}
		},
		[deviceFlow.credentials, deviceFlow.deviceCodeData, deviceFlow.tokens]
	);

	// Don't auto-advance - let user see the TV update and click Next manually
	// This provides better educational experience to see the full authorization flow

	// Show toast when tokens received to draw attention to TV update
	React.useEffect(() => {
		if (deviceFlow.tokens && currentStep === 2) {
			v4ToastManager.showSuccess(
				'🎉 Authorization successful! Check out your StreamFlix TV screen above!'
			);
		}
	}, [deviceFlow.tokens, currentStep]);

	const renderStepContent = () => {
		switch (currentStep) {
			case 0:
				return renderIntroduction();
			case 1:
				return renderRequestDeviceCode();
			case 2:
				return renderUserAuthorization(); // Includes polling
			case 3:
				return renderTokens(); // Old step 4
			case 4:
				return renderIntrospection(); // Old step 5
			case 5:
				return renderCompletion(); // Old step 6
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
								devices to obtain user authorization without a browser. Perfect for smart TVs, IoT
								devices, CLI tools, and gaming consoles.
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

							<InfoBox $variant="info" style={{ marginTop: '1rem' }}>
								<FiShield size={20} />
								<div>
									<InfoTitle>RFC 8628 Specification:</InfoTitle>
									<ul style={{ marginTop: '0.5rem', marginBottom: 0, paddingLeft: '1.5rem' }}>
										<li>
											<strong>Device Code</strong>: Short-lived code displayed to user
										</li>
										<li>
											<strong>User Code</strong>: Human-readable code for user verification
										</li>
										<li>
											<strong>Verification URI</strong>: URL where user completes authorization
										</li>
										<li>
											<strong>Polling</strong>: Client polls token endpoint until authorized
										</li>
										<li>
											<strong>Timeout</strong>: Codes expire after 10-15 minutes
										</li>
									</ul>
								</div>
							</InfoBox>

							<InfoBox $variant="warning" style={{ marginTop: '1rem' }}>
								<FiAlertCircle size={20} />
								<div>
									<InfoTitle>Security Considerations:</InfoTitle>
									<ul style={{ marginTop: '0.5rem', marginBottom: 0, paddingLeft: '1.5rem' }}>
										<li>
											<strong>Short-lived codes</strong>: Device/user codes expire quickly
										</li>
										<li>
											<strong>Polling frequency</strong>: Follow server rate limits (typically 5-10
											seconds)
										</li>
										<li>
											<strong>User verification</strong>: Ensure codes are displayed securely
										</li>
										<li>
											<strong>Transport security</strong>: Always use HTTPS for all requests
										</li>
									</ul>
								</div>
							</InfoBox>

							<InfoBox $variant="info" style={{ marginTop: '1rem' }}>
								<FiShield size={20} />
								<div>
									<InfoTitle>OAuth vs OIDC Device Flow:</InfoTitle>
									<InfoText style={{ marginTop: '0.5rem' }}>
										<strong>Important:</strong> OIDC doesn't define a separate "Device Flow"
										specification. It reuses the OAuth 2.0 Device Authorization Grant (RFC 8628) and
										adds the usual OIDC semantics:
									</InfoText>
									<ul style={{ marginTop: '0.5rem', marginBottom: 0, paddingLeft: '1.5rem' }}>
										<li>
											<strong>OAuth Device Flow</strong>: Returns access_token and refresh_token
											only
										</li>
										<li>
											<strong>OIDC Device Flow</strong>: Adds ID Token, UserInfo endpoint, and
											requires <code>openid</code> scope
										</li>
										<li>Both flows use the same RFC 8628 device authorization mechanism</li>
										<li>OIDC adds identity layer on top of OAuth's authorization framework</li>
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
							<div
								style={{
									backgroundColor: '#f8fafc',
									padding: '2rem',
									borderRadius: '0.75rem',
									border: '2px solid #e2e8f0',
								}}
							>
								<ExplanationHeading style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>
									<FiZap /> Complete Flow Sequence
								</ExplanationHeading>

								<ol style={{ margin: 0, paddingLeft: '1.5rem', lineHeight: '2' }}>
									<li style={{ marginBottom: '1.5rem' }}>
										<strong>1. Device requests device code</strong> - Device calls the device
										authorization endpoint with client_id and scopes
										<br />
										<code
											style={{
												background: '#e2e8f0',
												padding: '0.25rem 0.5rem',
												borderRadius: '0.25rem',
												fontSize: '0.85em',
											}}
										>
											POST /device_authorization
										</code>
										<br />
										<small style={{ color: '#64748b' }}>
											Server responds with: device_code, user_code, verification_uri, expires_in,
											interval
										</small>
									</li>
									<li style={{ marginBottom: '1.5rem' }}>
										<strong>2. Display user code</strong> - Device shows user_code and
										verification_uri to user on screen (e.g., "Visit example.com and enter code:
										ABCD-1234")
										<br />
										<small style={{ color: '#64748b' }}>
											Example display: "Go to https://auth.pingone.com/activate and enter:
											WDJB-MJHT"
										</small>
									</li>
									<li style={{ marginBottom: '1.5rem' }}>
										<strong>3. User authorizes on secondary device</strong> - User visits URL on
										phone/computer, enters code, and authorizes the application
										<br />
										<small style={{ color: '#64748b' }}>
											User sees: "Authorize 'Smart TV App' to access your account?"
										</small>
									</li>
									<li style={{ marginBottom: '1rem' }}>
										<strong>Device polls for tokens</strong> - Device continuously polls token
										endpoint until user completes authorization
									</li>
									<li>
										<strong>Tokens received</strong> - Device receives access token, ID token, and
										optionally refresh token
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
									<label
										style={{
											display: 'block',
											marginBottom: '0.5rem',
											fontWeight: '600',
											color: '#374151',
										}}
									>
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
											fontSize: '0.875rem',
										}}
									/>
								</div>
								<div style={{ marginBottom: '1rem' }}>
									<label
										style={{
											display: 'block',
											marginBottom: '0.5rem',
											fontWeight: '600',
											color: '#374151',
										}}
									>
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
											fontSize: '0.875rem',
										}}
									/>
								</div>
								<div style={{ marginBottom: '1rem' }}>
									<label
										style={{
											display: 'block',
											marginBottom: '0.5rem',
											fontWeight: '600',
											color: '#374151',
										}}
									>
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
											fontSize: '0.875rem',
										}}
									/>
								</div>
							</div>
							<ActionRow>
								<Button
									onClick={handleSaveCredentials}
									$variant="primary"
									disabled={
										!deviceFlow.credentials?.environmentId || !deviceFlow.credentials?.clientId
									}
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
										The device sends a POST request to the device authorization endpoint with the
										client_id and requested scopes. PingOne responds with a device_code, user_code,
										verification_uri, and polling interval.
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
									<Button onClick={handleReset} $variant="outline">
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
										Device code received from PingOne. You can now display the user code to the
										user.
									</InfoText>
								</div>
							</InfoBox>
							<ResultsSection style={{ marginTop: '1rem' }}>
								<GeneratedContentBox>
									<GeneratedLabel>Device Code Response</GeneratedLabel>
									<ParameterGrid>
										<div style={{ gridColumn: '1 / -1' }}>
											<ParameterLabel>Device Code (Internal - Do Not Display)</ParameterLabel>
											<ParameterValue
												style={{
													wordBreak: 'break-all',
													fontFamily: 'monospace',
													fontSize: '0.75rem',
													color: '#64748b',
												}}
											>
												{deviceFlow.deviceCodeData.device_code.substring(0, 20)}...
											</ParameterValue>
										</div>
										<div>
											<ParameterLabel>Expires In</ParameterLabel>
											<ParameterValue>
												{deviceFlow.deviceCodeData.expires_in} seconds
											</ParameterValue>
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
									<InfoTitle>Real-World Scenario: Smart TV App</InfoTitle>
									<InfoText>
										Imagine you're setting up a streaming app on your Smart TV. The TV displays a QR
										code and user code. Scan the QR code with your phone to authorize the app, just
										like Netflix, YouTube, or Disney+!
									</InfoText>
								</div>
							</InfoBox>

							<SmartTVContainer>
								{/* QR Code Section - User scans this first */}
								<QRSection>
									<h3 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', color: '#1e293b' }}>
										📱 Step 1: Scan with Your Phone
									</h3>
									<p style={{ margin: '0 0 1.5rem 0', fontSize: '0.875rem', color: '#64748b' }}>
										Scan this QR code to activate your StreamFlix account on this TV
									</p>

									{deviceFlow.deviceCodeData.verification_uri_complete ? (
										<div
											style={{
												padding: '1rem',
												backgroundColor: '#f8fafc',
												borderRadius: '0.5rem',
												marginBottom: '1rem',
											}}
										>
											<QRCodeSVG
												value={deviceFlow.deviceCodeData.verification_uri_complete}
												size={200}
												level="H"
												includeMargin={true}
												style={{ display: 'block', margin: '0 auto' }}
											/>
										</div>
									) : (
										<div
											style={{
												padding: '2rem',
												backgroundColor: '#f8fafc',
												borderRadius: '0.5rem',
												marginBottom: '1rem',
											}}
										>
											<p style={{ color: '#64748b', fontSize: '0.875rem' }}>
												QR code will appear here when available
											</p>
										</div>
									)}

									<div
										style={{
											padding: '1rem',
											backgroundColor: '#eff6ff',
											borderRadius: '0.5rem',
											border: '1px solid #bfdbfe',
											marginBottom: '1rem',
										}}
									>
										<p
											style={{
												margin: '0 0 0.5rem 0',
												fontSize: '0.75rem',
												color: '#64748b',
												textTransform: 'uppercase',
												fontWeight: '600',
											}}
										>
											Or visit manually:
										</p>
										<code
											style={{ fontSize: '0.875rem', color: '#1e40af', wordBreak: 'break-all' }}
										>
											{deviceFlow.deviceCodeData.verification_uri}
										</code>
										<p style={{ margin: '0.75rem 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>
											Enter code:{' '}
											<strong
												style={{ color: '#1e40af', fontSize: '1rem', letterSpacing: '0.1rem' }}
											>
												{deviceFlow.deviceCodeData.user_code}
											</strong>
										</p>
									</div>

									<ActionRow style={{ justifyContent: 'center' }}>
										<Button
											onClick={() =>
												window.open(
													deviceFlow.deviceCodeData!.verification_uri_complete ||
														deviceFlow.deviceCodeData!.verification_uri,
													'_blank'
												)
											}
											$variant="primary"
										>
											<FiExternalLink /> Open on This Device
										</Button>
									</ActionRow>
								</QRSection>

								{/* Scroll Indicator */}
								<ScrollIndicator>
									<ScrollText>👇 Scroll down to see your TV display 👇</ScrollText>
									<ScrollArrow>⬇️</ScrollArrow>
								</ScrollIndicator>

								{/* Smart TV Device - Shows result after authorization */}
								<SmartTV $isWaiting={deviceFlow.pollingStatus.isPolling || !deviceFlow.tokens}>
									<div
										style={{
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											marginBottom: '1rem',
										}}
									>
										<TVStatusIndicator $active={!!deviceFlow.tokens} />
										<h3 style={{ margin: 0, fontSize: '1.25rem', color: '#94a3b8' }}>
											📺 Smart TV - Living Room
										</h3>
									</div>
									<TVScreen $showContent={!!deviceFlow.tokens}>
										{deviceFlow.tokens ? (
											<>
												<div
													style={{
														background: 'linear-gradient(135deg, #e50914 0%, #b20710 100%)',
														padding: '0.75rem 1.5rem',
														borderRadius: '0.5rem',
														marginBottom: '1.5rem',
														fontSize: '1.5rem',
														fontWeight: 'bold',
														color: 'white',
														textAlign: 'center',
														fontFamily: 'Arial, sans-serif',
														letterSpacing: '0.1rem',
													}}
												>
													STREAMFLIX
												</div>
												<div
													style={{
														fontSize: '2rem',
														marginBottom: '1rem',
														animation: 'fadeIn 0.5s ease',
													}}
												>
													✅
												</div>
												<WelcomeMessage
													style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#22c55e' }}
												>
													You are now logged in to StreamFlix!
												</WelcomeMessage>
												<div style={{ fontSize: '1rem', color: '#94a3b8', marginBottom: '1.5rem' }}>
													Welcome Back, Demo User 👋
												</div>
												<AppGrid>
													<AppIcon $color="linear-gradient(135deg, #e50914 0%, #b20710 100%)">
														<div style={{ fontSize: '1.5rem' }}>🎬</div>
														<div style={{ fontSize: '0.65rem', marginTop: '0.25rem' }}>Movies</div>
													</AppIcon>
													<AppIcon $color="linear-gradient(135deg, #00a8e1 0%, #0088cc 100%)">
														<div style={{ fontSize: '1.5rem' }}>📺</div>
														<div style={{ fontSize: '0.65rem', marginTop: '0.25rem' }}>Series</div>
													</AppIcon>
													<AppIcon $color="linear-gradient(135deg, #1ce783 0%, #17b86b 100%)">
														<div style={{ fontSize: '1.5rem' }}>🎵</div>
														<div style={{ fontSize: '0.65rem', marginTop: '0.25rem' }}>Music</div>
													</AppIcon>
													<AppIcon $color="linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%)">
														<div style={{ fontSize: '1.5rem' }}>🎮</div>
														<div style={{ fontSize: '0.65rem', marginTop: '0.25rem' }}>Games</div>
													</AppIcon>
													<AppIcon $color="linear-gradient(135deg, #0063e5 0%, #004db3 100%)">
														<div style={{ fontSize: '1.5rem' }}>👶</div>
														<div style={{ fontSize: '0.65rem', marginTop: '0.25rem' }}>Kids</div>
													</AppIcon>
													<AppIcon $color="linear-gradient(135deg, #9146ff 0%, #772ce8 100%)">
														<div style={{ fontSize: '1.5rem' }}>🎤</div>
														<div style={{ fontSize: '0.65rem', marginTop: '0.25rem' }}>Live</div>
													</AppIcon>
													<AppIcon $color="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)">
														<div style={{ fontSize: '1.5rem' }}>⭐</div>
														<div style={{ fontSize: '0.65rem', marginTop: '0.25rem' }}>
															Featured
														</div>
													</AppIcon>
													<AppIcon $color="linear-gradient(135deg, #64748b 0%, #475569 100%)">
														<div style={{ fontSize: '1.5rem' }}>⚙️</div>
														<div style={{ fontSize: '0.65rem', marginTop: '0.25rem' }}>
															Settings
														</div>
													</AppIcon>
												</AppGrid>
												<div
													style={{
														fontSize: '0.75rem',
														color: '#22c55e',
														marginTop: '1rem',
														padding: '0.5rem',
														backgroundColor: 'rgba(34, 197, 94, 0.1)',
														borderRadius: '0.5rem',
														border: '1px solid rgba(34, 197, 94, 0.3)',
													}}
												>
													✅ Login Successful • Ready to stream
												</div>
											</>
										) : (
											<TVDisplay>
												{deviceFlow.pollingStatus.isPolling ? (
													<>
														<div
															style={{
																background: 'linear-gradient(135deg, #e50914 0%, #b20710 100%)',
																padding: '0.5rem 1rem',
																borderRadius: '0.5rem',
																marginBottom: '1.5rem',
																fontSize: '1.25rem',
																fontWeight: 'bold',
																color: 'white',
																fontFamily: 'Arial, sans-serif',
																letterSpacing: '0.1rem',
															}}
														>
															STREAMFLIX
														</div>
														<div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
														<div style={{ fontSize: '1.25rem', fontWeight: '600' }}>
															WAITING FOR
														</div>
														<div
															style={{
																fontSize: '1.25rem',
																fontWeight: '600',
																marginBottom: '0.5rem',
															}}
														>
															AUTHORIZATION...
														</div>
														<div
															style={{
																fontSize: '0.875rem',
																marginTop: '1rem',
																color: '#94a3b8',
															}}
														>
															Complete sign-in on your phone
														</div>
													</>
												) : (
													<>
														<div
															style={{
																background: 'linear-gradient(135deg, #e50914 0%, #b20710 100%)',
																padding: '0.5rem 1rem',
																borderRadius: '0.5rem',
																marginBottom: '1rem',
																fontSize: '1.25rem',
																fontWeight: 'bold',
																color: 'white',
																fontFamily: 'Arial, sans-serif',
																letterSpacing: '0.1rem',
															}}
														>
															STREAMFLIX
														</div>
														<div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📱</div>
														<div
															style={{
																fontSize: '1.25rem',
																marginBottom: '0.5rem',
																fontWeight: '600',
															}}
														>
															Activate Your Device
														</div>
														<div
															style={{
																fontSize: '0.875rem',
																color: '#94a3b8',
																marginBottom: '1.5rem',
															}}
														>
															Sign in to start streaming
														</div>
														<div
															style={{
																fontSize: '0.75rem',
																color: '#64748b',
																marginBottom: '0.5rem',
															}}
														>
															Enter this code on your phone:
														</div>
														<div
															style={{
																fontSize: '2.5rem',
																fontWeight: 'bold',
																letterSpacing: '0.5rem',
																color: '#e50914',
																padding: '0.5rem 1rem',
																backgroundColor: 'rgba(229, 9, 20, 0.1)',
																borderRadius: '0.5rem',
																border: '2px solid rgba(229, 9, 20, 0.3)',
															}}
														>
															{deviceFlow.deviceCodeData.user_code}
														</div>
													</>
												)}
											</TVDisplay>
										)}
									</TVScreen>
									{deviceFlow.timeRemaining > 0 && (
										<div
											style={{
												textAlign: 'center',
												marginTop: '1rem',
												fontSize: '0.875rem',
												color: '#94a3b8',
											}}
										>
											Code expires in: {deviceFlow.formatTimeRemaining(deviceFlow.timeRemaining)}
										</div>
									)}
								</SmartTV>
							</SmartTVContainer>

							{deviceFlow.timeRemaining > 0 && (
								<CountdownTimer>
									⏱️ Code expires in: {deviceFlow.formatTimeRemaining(deviceFlow.timeRemaining)}
								</CountdownTimer>
							)}

							<ActionRow style={{ marginTop: '1.5rem' }}>
								<Button onClick={handleStartPolling} disabled={deviceFlow.pollingStatus.isPolling}>
									<FiRefreshCw /> Start Polling for Authorization
								</Button>
							</ActionRow>
						</CollapsibleContent>
					)}
				</CollapsibleSection>
			)}
		</>
	);

	// Step 3 (Polling) removed - polling now happens automatically on Step 2
	// Users see the TV update in real-time on the User Authorization page

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
									The user has successfully authorized the device. Tokens have been received and
									stored.
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
												<ParameterValue
													style={{
														wordBreak: 'break-all',
														fontFamily: 'monospace',
														fontSize: '0.75rem',
													}}
												>
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
										{/* Token Management Buttons */}
										<ActionRow style={{ justifyContent: 'center', gap: '0.75rem' }}>
											<Button onClick={navigateToTokenManagement} $variant="primary">
												<FiExternalLink /> View in Token Management
											</Button>
											<Button
												onClick={() => handleCopy(deviceFlow.tokens!.access_token, 'Access Token')}
												$variant="outline"
											>
												<FiCopy /> Copy Access Token
											</Button>
										</ActionRow>
									</GeneratedContentBox>
								</ResultsSection>

								{/* OAuth 2.0 Device Authorization Flow does not include ID tokens */}
								{/* ID tokens are only available in the OIDC Device Authorization Flow */}
								<InfoBox $variant="info" style={{ marginTop: '1rem' }}>
									<FiInfo size={20} />
									<div>
										<InfoTitle>OAuth vs OIDC Tokens</InfoTitle>
										<InfoText>
											<strong>OAuth 2.0 Device Flow</strong> returns only <code>access_token</code>{' '}
											and <code>refresh_token</code>.
											<br />
											<br />
											For <strong>ID Token</strong> and <strong>UserInfo</strong> endpoint access,
											use the <strong>OIDC Device Authorization Flow</strong> instead, which adds
											the <code>openid</code> scope and OIDC semantics on top of RFC 8628.
										</InfoText>
									</div>
								</InfoBox>

								{deviceFlow.tokens.refresh_token && (
									<ResultsSection>
										<ResultsHeading>
											<FiRefreshCw size={18} /> Refresh Token
										</ResultsHeading>
										<GeneratedContentBox>
											<ParameterGrid>
												<div style={{ gridColumn: '1 / -1' }}>
													<ParameterLabel>Refresh Token</ParameterLabel>
													<ParameterValue
														style={{
															wordBreak: 'break-all',
															fontFamily: 'monospace',
															fontSize: '0.75rem',
														}}
													>
														{deviceFlow.tokens.refresh_token}
													</ParameterValue>
												</div>
											</ParameterGrid>
											<ActionRow style={{ justifyContent: 'center', gap: '0.75rem' }}>
												{deviceFlow.tokens.refresh_token && (
													<Button
														onClick={navigateToTokenManagementWithRefreshToken}
														$variant="primary"
														style={{
															fontSize: '0.9rem',
															fontWeight: '600',
															padding: '0.75rem 1rem',
															backgroundColor: '#f59e0b',
															borderColor: '#f59e0b',
															color: '#ffffff',
														}}
													>
														<FiRefreshCw /> Decode Refresh Token
													</Button>
												)}
												<Button
													onClick={() =>
														handleCopy(deviceFlow.tokens!.refresh_token!, 'Refresh Token')
													}
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

	// OAuth 2.0 Device Authorization Code Flow does not include UserInfo endpoint
	// UserInfo is only available in OIDC flows

	const renderIntrospection = () => (
		<TokenIntrospect
			flowName="OAuth Device Authorization Code Flow"
			flowVersion="V5"
			tokens={deviceFlow.tokens as any}
			credentials={deviceFlow.credentials as any}
			onResetFlow={handleReset}
			onNavigateToTokenManagement={navigateToTokenManagement}
			collapsedSections={{
				introspectionDetails: collapsedSections.introspectionDetails || false,
				rawJson: false,
			}}
			onToggleSection={(section) => {
				if (section === 'introspectionDetails') {
					toggleSection('introspectionDetails');
				}
			}}
			completionMessage="Token introspection allows you to validate and inspect your access tokens."
			nextSteps={[
				'Use the introspection results to verify token validity and permissions',
				'Check token expiration and active status',
				'View granted scopes and client information',
			]}
		/>
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
									You've successfully completed the OAuth Device Authorization Grant flow. The
									device has been authorized and tokens have been received.
								</InfoText>
							</div>
						</InfoBox>

						<ExplanationSection style={{ marginTop: '1.5rem' }}>
							<ExplanationHeading>
								<FiInfo /> Summary
							</ExplanationHeading>
							<div
								style={{
									backgroundColor: '#f8fafc',
									padding: '1.5rem',
									borderRadius: '0.5rem',
									border: '1px solid #e2e8f0',
								}}
							>
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
							<InfoText>In a production application, you would:</InfoText>
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
			<FlowInfoCard flowInfo={getFlowInfo('device-code')!} />

			<FlowHeader>
				<div>
					<StepBadge>DEVICE AUTHORIZATION CODE • V5 API</StepBadge>
					<FlowTitle>{STEP_METADATA[currentStep].title}</FlowTitle>
					<FlowSubtitle>{STEP_METADATA[currentStep].subtitle}</FlowSubtitle>
				</div>
				<div style={{ fontSize: '2rem', fontWeight: '700', color: '#ffffff' }}>
					{String(currentStep + 1).padStart(2, '0')}
					<span style={{ fontSize: '1.25rem', color: 'rgba(255, 255, 255, 0.75)' }}>
						{' '}
						of {STEP_METADATA.length}
					</span>
				</div>
			</FlowHeader>

			<FlowContent>
				{renderStepContent()}

				<StepNavigationButtons
					currentStep={currentStep}
					totalSteps={STEP_METADATA.length}
					onPrevious={() => setCurrentStep((prev) => Math.max(prev - 1, 0))}
					onReset={handleReset}
					onNext={() => setCurrentStep((prev) => Math.min(prev + 1, STEP_METADATA.length - 1))}
					canNavigateNext={isStepValid(currentStep + 1)}
					isFirstStep={currentStep === 0}
					nextButtonText={isStepValid(currentStep + 1) ? 'Next' : 'Complete above action'}
					disabledMessage="Complete the action above to continue"
				/>
			</FlowContent>

			{/* Polling Prompt Modal */}
			<ModalOverlay $isOpen={showPollingModal}>
				<ModalContent>
					<ModalHeader>
						<FiClock size={32} color="#3b82f6" />
						<ModalTitle>Ready to Start Polling?</ModalTitle>
					</ModalHeader>
					<ModalBody>
						<p>
							The device code has been generated and displayed on the Smart TV. The user can now
							scan the QR code or enter the code on their phone.
						</p>
						<p style={{ marginTop: '1rem' }}>
							<strong>Next step:</strong> Start polling the authorization server to check if the
							user has completed authorization. The app will automatically check every{' '}
							{deviceFlow.deviceCodeData?.interval || 5} seconds.
						</p>
						<p
							style={{
								marginTop: '1rem',
								padding: '0.75rem',
								backgroundColor: '#eff6ff',
								borderRadius: '0.5rem',
								border: '1px solid #bfdbfe',
							}}
						>
							📺 <strong>Watch the Smart TV display update in real-time</strong> as the user
							authorizes on their phone!
						</p>
						<InfoBox $variant="info" style={{ marginTop: '1rem' }}>
							<FiInfo size={18} />
							<div>
								<InfoText style={{ fontSize: '0.875rem', margin: 0 }}>
									💡 <strong>Tip:</strong> You can disable this prompt in UI Settings if you prefer
									to start polling manually.
								</InfoText>
							</div>
						</InfoBox>
					</ModalBody>
					<ModalActions>
						<Button onClick={handleDismissModal} $variant="outline">
							I'll Start Later
						</Button>
						<Button onClick={handleStartPolling} $variant="primary">
							<FiRefreshCw /> Start Polling Now
						</Button>
					</ModalActions>
				</ModalContent>
			</ModalOverlay>
		</FlowContainer>
	);
};

export default DeviceAuthorizationFlowV5;
