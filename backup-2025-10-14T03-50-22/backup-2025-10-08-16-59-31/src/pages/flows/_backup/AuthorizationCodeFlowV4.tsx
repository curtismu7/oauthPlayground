import { useCallback, useEffect, useState } from 'react';
import {
	FiAlertCircle,
	FiArrowLeft,
	FiArrowRight,
	FiCheckCircle,
	FiChevronDown,
	FiCopy,
	FiExternalLink,
	FiEye,
	FiGlobe,
	FiInfo,
	FiKey,
	FiRefreshCw,
	FiSettings,
	FiShield,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import {
	CalloutCard,
	ExplanationHeading,
	ExplanationSection,
	FlowDiagram,
	FlowStep,
	FlowStepContent,
	FlowStepNumber,
} from '../../components/InfoBlocks';
import PingOneApplicationConfig, {
	type PingOneApplicationState,
} from '../../components/PingOneApplicationConfig';
import {
	HelperText,
	ResultsHeading,
	ResultsSection,
	SectionDivider,
} from '../../components/ResultsPanel';
import { generateCodeChallenge, generateCodeVerifier } from '../../utils/oauth';
import { v4ToastManager } from '../../utils/v4ToastMessages';

const STEP_METADATA = [
	{
		title: 'Step 1: Introduction & Setup',
		subtitle: 'Understanding OAuth 2.0 Authorization Code Flow',
	},
	{
		title: 'Step 2: PKCE Parameters',
		subtitle: 'Generate secure code verifier and challenge',
	},
	{
		title: 'Step 3: Authorization Request',
		subtitle: 'Build and launch the PingOne authorization URL',
	},
	{
		title: 'Step 4: Authorization Response',
		subtitle: 'Process the returned authorization code',
	},
	{
		title: 'Step 5: Token Exchange',
		subtitle: 'Swap the code for tokens using PingOne APIs',
	},
	{
		title: 'Step 6: User Information',
		subtitle: 'Inspect ID token claims and userinfo',
	},
	{
		title: 'Step 7: Flow Complete',
		subtitle: 'Review what you accomplished and next steps',
	},
] as const;

type StepCompletionState = Record<number, boolean>;

type IntroSectionKey = 'overview' | 'flowDiagram' | 'pingOneApp' | 'credentials' | 'results';

const DEFAULT_PINGONE_APP_CONFIG: PingOneApplicationState = {
	clientAuthMethod: 'client_secret_post',
	allowRedirectUriPatterns: false,
	pkceEnforcement: 'REQUIRED',
	grantTypeImplicit: true,
	grantTypeClientCredentials: false,
	grantTypeDeviceAuthorization: false,
	grantTypeRefreshToken: true,
	refreshTokenDurationDays: 30,
	refreshTokenRollingDurationDays: 180,
	refreshTokenGraceSeconds: 0,
};

const createInitialStepState = (): StepCompletionState =>
	STEP_METADATA.reduce((acc, _, index) => {
		acc[index] = false;
		return acc;
	}, {} as StepCompletionState);

const Container = styled.div`
	min-height: 100vh;
	background-color: #f9fafb;
	padding: 2rem 0;
`;

const ContentWrapper = styled.div`
	max-width: 64rem;
	margin: 0 auto;
	padding: 0 1rem;
`;

const HeaderSection = styled.div`
	text-align: center;
	margin-bottom: 2rem;
`;

const MainTitle = styled.h1`
	font-size: 1.875rem;
	font-weight: bold;
	color: var(--color-text-primary, #111827);
	margin-bottom: 1rem;
`;

const Subtitle = styled.p`
	font-size: 1.125rem;
	color: #4b5563;
	max-width: 42rem;
	margin: 0 auto;
`;

const MainCard = styled.div`
    background-color: #ffffff;
    border-radius: 1rem;
    box-shadow: 0 20px 40px rgba(15, 23, 42, 0.1);
    border: 1px solid #e2e8f0;
    overflow: hidden;
`;

const StepHeader = styled.div`
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    color: #ffffff;
    padding: 2rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
`;

const StepHeaderLeft = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
`;

const VersionBadge = styled.span`
	align-self: flex-start;
	background: rgba(16, 185, 129, 0.15);
	border: 1px solid #10b981;
	color: #047857;
	font-size: 0.75rem;
	font-weight: 600;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	padding: 0.25rem 0.75rem;
	border-radius: 9999px;
`;

const StepHeaderTitle = styled.h2`
    font-size: 2rem;
    font-weight: 700;
    margin: 0;
`;

const StepHeaderSubtitle = styled.p`
    font-size: 1rem;
    color: rgba(255, 255, 255, 0.85);
    margin: 0;
`;

const StepHeaderRight = styled.div`
    text-align: right;
`;

const StepNumber = styled.div`
    font-size: 2.5rem;
    font-weight: 700;
    line-height: 1;
`;

const StepTotal = styled.div`
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.75);
    letter-spacing: 0.05em;
`;

const StepContentWrapper = styled.div`
	padding: 2rem;
	background: #ffffff;
`;

const CollapsibleSection = styled.section`
	border: 1px solid #e2e8f0;
	border-radius: 0.75rem;
	margin-bottom: 1.5rem;
	background-color: #ffffff;
	box-shadow: 0 10px 20px rgba(15, 23, 42, 0.05);
`;

const CollapsibleHeader = styled.button<{ $collapsed?: boolean }>`
	display: flex;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	padding: 1.25rem 1.5rem;
	background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%);
	border: none;
	border-radius: 0.75rem;
	cursor: pointer;
	font-size: 1.1rem;
	font-weight: 600;
	color: #0f172a;
	transition: background 0.2s ease;

	&:hover {
		background: linear-gradient(135deg, #f1f5f9 0%, #e0e7ff 100%);
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
	color: #1d4ed8;
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

const PkceEducationSection = styled.section`
	margin-top: 2rem;
	border: 1px solid #dbeafe;
	border-radius: 1rem;
	background: #f8fbff;
	box-shadow: 0 20px 40px rgba(15, 23, 42, 0.08);
	padding: 2rem;
`;

const PkceEducationHeader = styled.h3`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	font-size: 1.4rem;
	font-weight: 700;
	color: #0f172a;
	margin-bottom: 1rem;
`;

const PkceCallout = styled.div`
	border-left: 4px solid #3b82f6;
	background: #eff6ff;
	border-radius: 0.75rem;
	padding: 1rem 1.25rem;
	margin-bottom: 1.5rem;
	color: #0f172a;
`;

const PkceColumns = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
	gap: 1.5rem;
`;

const PkceCard = styled.div<{ $variant: 'default' | 'warning' }>`
	background: ${({ $variant }) => ($variant === 'warning' ? '#fff7ed' : '#ffffff')};
	border: 1px solid
		${({ $variant }) => ($variant === 'warning' ? '#f97316' : '#e2e8f0')};
	border-radius: 1rem;
	padding: 1.25rem 1.5rem;
	box-shadow: ${({ $variant }) =>
		$variant === 'warning'
			? '0 12px 24px rgba(249, 115, 22, 0.1)'
			: '0 12px 24px rgba(15, 23, 42, 0.05)'};

	ul {
		margin: 0.75rem 0 0;
		padding-left: 1.25rem;
		line-height: 1.6;
		color: #1f2937;
	}
`;

const FlowSuitability = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
	gap: 1rem;
	margin: 1.5rem 0 0;
`;

const SuitabilityCard = styled.div<{ $variant: 'success' | 'warning' | 'danger' }>`
	border-radius: 1rem;
	padding: 1.25rem;
	border: 2px solid
		${({ $variant }) => {
			if ($variant === 'success') return '#34d399';
			if ($variant === 'warning') return '#fbbf24';
			return '#f87171';
		}};
	background: ${({ $variant }) => {
		if ($variant === 'success') return '#dcfce7';
		if ($variant === 'warning') return '#fef3c7';
		return '#fee2e2';
	}};
	color: #1f2937;
	box-shadow: 0 10px 25px rgba(15, 23, 42, 0.08);

	ul {
		margin: 0.75rem 0 0;
		padding-left: 1.25rem;
		line-height: 1.6;
	}
`;

const CardHeader = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 1.1rem;
	font-weight: 600;
`;

const formatValue = (value: string) => value || 'Not provided';

const maskClientSecret = (secret: string) => {
	if (!secret) return 'Not provided';
	if (secret.length <= 8) return '••••';
	return `${secret.slice(0, 4)}••••${secret.slice(-4)}`;
};

const ActionRow = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 1rem;
	align-items: center;
	margin-top: 1.5rem;
`;

const Button = styled.button<{ $variant?: string; $disabled?: boolean }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
	padding: 0.75rem 1.5rem;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	font-weight: 600;
	cursor: ${(props) => (props.$disabled ? 'not-allowed' : 'pointer')};
	transition: all 0.2s;
	border: 1px solid transparent;
	opacity: ${(props) => (props.$disabled ? 0.6 : 1)};

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
		background-color: #10b981;
		color: #ffffff;
		&:hover:not(:disabled) {
			background-color: #059669;
		}
	`}

	${({ $variant }) =>
		$variant === 'secondary' &&
		`
		background-color: #6b7280;
		color: #ffffff;
		&:hover:not(:disabled) {
			background-color: #4b5563;
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
		color: #374151;
		border-color: #d1d5db;
		&:hover:not(:disabled) {
			background-color: #f9fafb;
			border-color: #9ca3af;
		}
	`}
`;

const HighlightBadge = styled.span`
	position: absolute;
	top: -10px;
	right: -10px;
	background: #ef4444;
	color: #ffffff;
	border-radius: 9999px;
	width: 24px;
	height: 24px;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 0.75rem;
	font-weight: 700;
`;

const CardTitle = styled.h2`
	font-size: 1.5rem;
	font-weight: bold;
	color: var(--color-text-primary, #111827);
	margin-bottom: 1.5rem;
`;

const FormGrid = styled.div`
	display: grid;
	grid-template-columns: 1fr;
	gap: 1.5rem;
	margin-bottom: 2rem;

	@media (min-width: 768px) {
		grid-template-columns: 1fr 1fr;
	}
`;

const FormField = styled.div`
	display: flex;
	flex-direction: column;
`;

const FormLabel = styled.label`
	font-size: 0.875rem;
	font-weight: 600;
	color: #374151;
	margin-bottom: 0.5rem;
`;

const FormInput = styled.input<{ $hasError?: boolean }>`
	padding: 0.75rem;
	border: 1px solid ${(props) => (props.$hasError ? '#ef4444' : '#d1d5db')};
	border-radius: 0.5rem;
	font-size: 0.875rem;
	background-color: ${(props) => (props.$hasError ? '#fef2f2' : '#ffffff')};
	color: ${(props) => (props.$hasError ? 'var(--color-error, #dc2626)' : 'var(--color-text-primary, #111827)')};
	transition: all 0.2s;

	&:focus {
		outline: none;
		border-color: ${(props) => (props.$hasError ? '#ef4444' : '#3b82f6')};
		box-shadow: 0 0 0 3px ${(props) => (props.$hasError ? '#fef2f2' : 'rgba(59, 130, 246, 0.1)')};
	}

	&::placeholder {
		color: ${(props) => (props.$hasError ? '#dc2626' : '#9ca3af')};
	}
`;

const HighlightedActionButton = styled(Button)<{ $priority: 'primary' | 'success' }>`
	position: relative;
	background: ${({ $priority }) =>
		$priority === 'primary'
			? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
			: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'};
	box-shadow: ${({ $priority }) =>
		$priority === 'primary'
			? '0 6px 18px rgba(59, 130, 246, 0.35)'
			: '0 6px 18px rgba(16, 185, 129, 0.35)'};
	transform: translateZ(0);
	color: #ffffff;
	padding-right: 2.5rem;

	&:hover {
		transform: scale(1.02);
	}

	&:disabled {
		background: ${({ $priority }) =>
			$priority === 'primary'
				? 'linear-gradient(135deg, rgba(59,130,246,0.6) 0%, rgba(29,78,216,0.6) 100%)'
				: 'linear-gradient(135deg, rgba(16,185,129,0.6) 0%, rgba(5,150,105,0.6) 100%)'};
		box-shadow: none;
	}
`;

const InfoBox = styled.div`
    background-color: #dbeafe;
    border: 1px solid #3b82f6;
    border-radius: 0.75rem;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
`;

const InfoTitle = styled.h3`
	font-size: 1rem;
	font-weight: 600;
	color: #0369a1;
	margin-bottom: 0.5rem;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const InfoText = styled.p`
    font-size: 0.95rem;
    color: #0c4a6e;
    line-height: 1.7;
    margin-bottom: 0.75rem;

	&:last-child {
		margin-bottom: 0;
	}
`;

const InfoList = styled.ul`
	font-size: 0.875rem;
	color: #0c4a6e;
	line-height: 1.5;
	margin: 0.5rem 0;
	padding-left: 1.5rem;
`;

const CodeBlock = styled.pre`
	background-color: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 0.375rem;
	padding: 1rem;
	font-size: 0.875rem;
	color: #374151;
	overflow-x: auto;
	margin: 1rem 0;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
`;

const GeneratedContentBox = styled.div`
    background-color: #d1fae5;
    border: 1px solid #10b981;
    border-radius: 0.75rem;
    padding: 1.5rem;
    margin: 1.5rem 0;
    position: relative;
`;

const GeneratedUrlDisplay = styled.div`
    background-color: #f1f5f9;
    border: 1px solid #cbd5e1;
    border-radius: 0.75rem;
    padding: 1.5rem;
    margin: 1.5rem 0;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 0.9rem;
    word-break: break-all;
    position: relative;
`;

const GeneratedLabel = styled.div`
	position: absolute;
	top: -10px;
	left: 16px;
	background-color: #22c55e;
	color: white;
	padding: 0.25rem 0.75rem;
	border-radius: 9999px;
	font-size: 0.75rem;
	font-weight: 600;
`;

const StepNavigation = styled.div`
	position: fixed;
	bottom: 2rem;
	left: 50%;
	transform: translateX(-50%);
	background-color: #ffffff;
	border-radius: 9999px;
	padding: 0.75rem 1.5rem;
	box-shadow: 0 18px 30px rgba(15, 23, 42, 0.18);
	display: flex;
	align-items: center;
	gap: 1.5rem;
	z-index: 1000;
`;

const StepIndicator = styled.div`
	display: flex;
	gap: 0.5rem;
	align-items: center;
`;

const StepDot = styled.div<{ $active?: boolean; $completed?: boolean }>`
	width: 12px;
	height: 12px;
	border-radius: 50%;
	background-color: ${({ $active, $completed }) => {
		if ($completed) return '#22c55e';
		if ($active) return '#3b82f6';
		return '#d1d5db';
	}};
	transform: ${({ $active }) => ($active ? 'scale(1.2)' : 'scale(1)')};
	transition: all 0.2s ease;
`;

const NavigationButtons = styled.div`
	display: flex;
	gap: 1rem;
`;

const NavButton = styled.button<{ $variant?: string }>`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.65rem 1.4rem;
	border-radius: 0.6rem;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s ease;
	border: none;

	${({ $variant }) =>
		$variant === 'primary' &&
		`
		background-color: #3b82f6;
		color: #ffffff;
		box-shadow: 0 12px 20px rgba(59, 130, 246, 0.3);
		&:hover {
			background-color: #2563eb;
		}
	`}

	${({ $variant }) =>
		$variant === 'success' &&
		`
		background-color: #10b981;
		color: #ffffff;
		box-shadow: 0 12px 20px rgba(16, 185, 129, 0.3);
		&:hover {
			background-color: #059669;
		}
	`}

	${({ $variant }) =>
		$variant === 'outline' &&
		`
		background-color: #e5e7eb;
		color: #1f2937;
		box-shadow: none;
		&:hover {
			background-color: #d1d5db;
		}
	`}

	${({ $variant }) =>
		$variant === 'danger' &&
		`
		background-color: #ef4444;
		color: #ffffff;
		box-shadow: 0 12px 20px rgba(239, 68, 68, 0.28);
		&:hover {
			background-color: #dc2626;
		}
	`}
`;

const Modal = styled.div<{ $show?: boolean }>`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
	display: ${(props) => (props.$show ? 'flex' : 'none')};
	align-items: center;
	justify-content: center;
	z-index: 2000;
`;

const ModalContent = styled.div`
	background-color: #ffffff;
	border-radius: 0.75rem;
	padding: 2rem;
	max-width: 400px;
	text-align: center;
	box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
`;

const ModalIcon = styled.div`
	width: 4rem;
	height: 4rem;
	border-radius: 50%;
	background-color: #10b981;
	display: flex;
	align-items: center;
	justify-content: center;
	margin: 0 auto 1rem;
	font-size: 1.5rem;
	color: #ffffff;
`;

const ModalTitle = styled.h3`
	font-size: 1.25rem;
	font-weight: 600;
	color: var(--color-text-primary, #111827);
	margin-bottom: 0.5rem;
`;

const ModalText = styled.p`
	font-size: 0.875rem;
	color: #6b7280;
	line-height: 1.5;
`;

const EmptyState = styled.div`
	text-align: center;
	padding: 3rem 2rem;
	color: #6b7280;
`;

const EmptyIcon = styled.div`
	width: 4rem;
	height: 4rem;
	border-radius: 50%;
	background-color: #f3f4f6;
	display: flex;
	align-items: center;
	justify-content: center;
	margin: 0 auto 1rem;
	font-size: 1.5rem;
	color: #9ca3af;
`;

const EmptyTitle = styled.h3`
	font-size: 1.125rem;
	font-weight: 600;
	color: #374151;
	margin-bottom: 0.5rem;
`;

const EmptyText = styled.p`
	font-size: 0.875rem;
	color: #6b7280;
	margin-bottom: 1rem;
`;

const ParameterGrid = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 1rem;
	margin: 1rem 0;
`;

const ParameterLabel = styled.div`
	font-size: 0.75rem;
	font-weight: 600;
	color: #6b7280;
	text-transform: uppercase;
	letter-spacing: 0.05em;
`;

const ParameterValue = styled.div`
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.875rem;
	color: var(--color-text-primary, #111827);
	word-break: break-all;
	background-color: #f9fafb;
	padding: 0.5rem;
	border-radius: 0.25rem;
	border: 1px solid #e5e7eb;
`;

const AuthorizationCodeFlowV4 = () => {
	// State management
	const _navigate = useNavigate();
	const [currentStep, setCurrentStep] = useState(0);
	const [credentials, setCredentials] = useState({
		clientId: '',
		clientSecret: '',
		environmentId: '',
		redirectUri: 'https://localhost:3000/flows/authorization-code-v4',
	});
	const createInitialPkceState = () => ({ codeVerifier: '', codeChallenge: '' });

	const [pkceCodes, setPkceCodes] = useState(createInitialPkceState);
	const [authCode, setAuthCode] = useState('');
	const [tokens, setTokens] = useState<Record<string, unknown> | null>(null);
	const [userInfo, setUserInfo] = useState<Record<string, unknown> | null>(null);
	const [authorizationUrl, setAuthorizationUrl] = useState('');
	const [stepCompletions, setStepCompletions] =
		useState<StepCompletionState>(createInitialStepState);
	const [emptyRequiredFields, setEmptyRequiredFields] = useState<Set<string>>(new Set());
	const [showRedirectModal, setShowRedirectModal] = useState(false);
	const [showSuccessModal, setShowSuccessModal] = useState(false);
	const [introSectionsCollapsed, setIntroSectionsCollapsed] = useState<
		Record<IntroSectionKey, boolean>
	>({
		overview: false,
		flowDiagram: false,
		credentials: false,
		results: false,
	});
	const [pingOneAppSettings, setPingOneAppSettings] = useState<PingOneApplicationState>(
		DEFAULT_PINGONE_APP_CONFIG
	);

	// Load saved configuration on mount
	useEffect(() => {
		const savedConfig = localStorage.getItem('oauth-v4-test-config');
		if (savedConfig) {
			try {
				const config = JSON.parse(savedConfig);
				setCredentials(config);
				setTimeout(() => {
					v4ToastManager.showSuccess('saveConfigurationSuccess');
				}, 100);
			} catch (error) {
				console.error('Failed to load saved configuration:', error);
			}
		}
	}, []);

	// Handle URL parameters for authorization code capture
	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const code = urlParams.get('code');
		const error = urlParams.get('error');

		if (code) {
			setAuthCode(code);
			setStepCompletions((prev) => ({ ...prev, 3: true }));
			setShowSuccessModal(true);
			setTimeout(() => setShowSuccessModal(false), 2000);

			// Clear URL parameters
			const newUrl = window.location.pathname;
			window.history.replaceState({}, document.title, newUrl);

			// Navigate to authorization response step
			setCurrentStep(3);
		} else if (error) {
			v4ToastManager.showError('networkError');
		}
	}, []);

	// Handler functions
	const handleFieldChange = (field: string, value: string) => {
		setCredentials((prev) => ({ ...prev, [field]: value }));
		if (value.trim() !== '') {
			setEmptyRequiredFields((prev) => {
				const newSet = new Set(prev);
				newSet.delete(field);
				return newSet;
			});
		}
	};

	const handleClearConfiguration = () => {
		setCredentials({
			clientId: '',
			clientSecret: '',
			environmentId: '',
			redirectUri: 'https://localhost:3000/flows/authorization-code-v4',
		});
		setEmptyRequiredFields(new Set(['clientId', 'clientSecret', 'environmentId', 'redirectUri']));
		localStorage.removeItem('oauth-v4-test-config');
		v4ToastManager.showSuccess('saveConfigurationSuccess');
	};

	const handleSaveConfiguration = () => {
		localStorage.setItem('oauth-v4-test-config', JSON.stringify(credentials));
		setStepCompletions((prev) => ({ ...prev, 0: true }));
		v4ToastManager.showSuccess('saveConfigurationSuccess');
	};

	const handleGeneratePKCE = useCallback(async () => {
		try {
			const verifier = generateCodeVerifier();
			const challenge = await generateCodeChallenge(verifier);

			setPkceCodes({ codeVerifier: verifier, codeChallenge: challenge });
			setStepCompletions((prev) => ({ ...prev, 1: true }));
			v4ToastManager.showSuccess('saveConfigurationSuccess');
		} catch (_error) {
			v4ToastManager.showError('stepError');
		}
	}, []);

	const handleGenerateAuthUrl = () => {
		if (!credentials.clientId || !credentials.environmentId) {
			v4ToastManager.showError('saveConfigurationValidationError', {
				fields: 'Client ID and Environment ID',
			});
			return;
		}

		if (!pkceCodes.codeVerifier || !pkceCodes.codeChallenge) {
			v4ToastManager.showError('stepError');
			return;
		}

		const baseUrl = `https://auth.pingone.com/${credentials.environmentId}/as/authorize`;
		const params = new URLSearchParams({
			response_type: 'code',
			client_id: credentials.clientId,
			redirect_uri: credentials.redirectUri,
			scope: 'openid profile email',
			state: 'v4-educational-flow',
			code_challenge: pkceCodes.codeChallenge,
			code_challenge_method: 'S256',
		});

		const url = `${baseUrl}?${params.toString()}`;
		setAuthorizationUrl(url);
		setStepCompletions((prev) => ({ ...prev, 2: true }));
		v4ToastManager.showSuccess('saveConfigurationSuccess');
	};

	const handleOpenAuthUrl = () => {
		if (!authorizationUrl) {
			v4ToastManager.showError('stepError');
			return;
		}

		setShowRedirectModal(true);
		setTimeout(() => {
			setShowRedirectModal(false);
			window.open(authorizationUrl, '_blank');
			setTimeout(() => setCurrentStep(3), 1000);
		}, 2000);
	};

	const handleExchangeTokens = async () => {
		if (!authCode) {
			v4ToastManager.showError('stepError');
			return;
		}

		try {
			const response = await fetch('/api/token-exchange', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					grant_type: 'authorization_code',
					code: authCode,
					redirect_uri: credentials.redirectUri,
					client_id: credentials.clientId,
					client_secret: credentials.clientSecret,
					code_verifier: pkceCodes.codeVerifier,
				}),
			});

			if (!response.ok) {
				throw new Error(`Token exchange failed: ${response.statusText}`);
			}

			const tokenData = await response.json();
			setTokens(tokenData);
			setStepCompletions((prev) => ({ ...prev, 4: true }));
			v4ToastManager.showSuccess('saveConfigurationSuccess');

			// Fetch user info if access token is available
			if (tokenData.access_token) {
				try {
					const userInfoResponse = await fetch('/api/userinfo', {
						headers: { Authorization: `Bearer ${tokenData.access_token}` },
					});
					if (userInfoResponse.ok) {
						const userData = await userInfoResponse.json();
						setUserInfo(userData);
						setStepCompletions((prev) => ({ ...prev, 5: true, 6: true }));
					}
				} catch (error) {
					console.error('Failed to fetch user info:', error);
				}
			}
		} catch (_error) {
			v4ToastManager.showError('networkError');
		}
	};

	const handleCopy = (text: string, label: string) => {
		navigator.clipboard
			.writeText(text)
			.then(() => {
				v4ToastManager.showCopySuccess(label);
			})
			.catch(() => {
				v4ToastManager.showCopyError(label);
			});
	};

	const handleResetFlow = () => {
		setCurrentStep(0);
		setPkceCodes({ codeVerifier: '', codeChallenge: '' });
		setAuthCode('');
		setTokens(null);
		setUserInfo(null);
		setAuthorizationUrl('');
		setStepCompletions(createInitialStepState());
		setEmptyRequiredFields(new Set());
		setShowRedirectModal(false);
		setShowSuccessModal(false);
		v4ToastManager.showSuccess('saveConfigurationSuccess');
	};

	const handleNext = () => {
		if (currentStep < STEP_METADATA.length - 1) {
			setCurrentStep((prev) => prev + 1);
		}
	};

	const handlePrev = () => {
		if (currentStep > 0) {
			setCurrentStep((prev) => prev - 1);
		}
	};

	const navigateToTokenManagement = () => {
		window.open('/token-management', '_blank');
	};

	const toggleIntroSection = (key: IntroSectionKey) =>
		setIntroSectionsCollapsed((prev) => ({
			...prev,
			[key]: !prev[key],
		}));

	// Render step content
	const renderStepContent = () => {
		switch (currentStep) {
			case 0:
				return (
					<>
						<CardTitle>Step 0: PingOne Application Configuration</CardTitle>
						<CollapsibleSection>
							<CollapsibleHeader
								onClick={() => toggleIntroSection('overview')}
								aria-expanded={!introSectionsCollapsed.overview}
							>
								<CollapsibleTitle>
									<FiInfo /> Authorization Code Overview
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={introSectionsCollapsed.overview}>
									<FiChevronDown />
								</CollapsibleToggleIcon>
							</CollapsibleHeader>
							{!introSectionsCollapsed.overview && (
								<CollapsibleContent>
									<ExplanationSection>
										<ExplanationHeading>
											<FiInfo /> When to Use Authorization Code Flow
										</ExplanationHeading>
										<InfoText>
											Authorization Code is PingOne’s most versatile flow. It’s ideal when you can
											keep the client secret on a server and want deep insight into the user
											session.
										</InfoText>
									</ExplanationSection>

									<FlowSuitability>
										<SuitabilityCard $variant="success">
											<CardHeader>
												<FiShield /> Perfect For
											</CardHeader>
											<ul>
												<li>
													<strong>Web Applications:</strong> Server-rendered sites with backend
													storage
												</li>
												<li>
													<strong>Single Page Apps:</strong> When PKCE is enforced
												</li>
												<li>
													<strong>Mobile Apps:</strong> Native iOS/Android using app-auth redirects
												</li>
												<li>
													<strong>Desktop Apps:</strong> Electron or native desktop with secure
													storage
												</li>
												<li>
													<strong>Server-to-Server (bootstrapped):</strong> Initial user login
													before issuing service tokens
												</li>
											</ul>
										</SuitabilityCard>

										<SuitabilityCard $variant="warning">
											<CardHeader>
												<FiAlertCircle /> Consider Alternatives
											</CardHeader>
											<ul>
												<li>
													<strong>Pure M2M APIs:</strong> Use Client Credentials flow
												</li>
												<li>
													<strong>IoT/limited input:</strong> Use Device Authorization flow
												</li>
												<li>
													<strong>Legacy without redirects:</strong> Resource Owner Password (last
													resort)
												</li>
											</ul>
										</SuitabilityCard>

										<SuitabilityCard $variant="danger">
											<CardHeader>
												<FiInfo /> Never Use When
											</CardHeader>
											<ul>
												<li>
													<strong>No PKCE on public clients:</strong> Always enforce PKCE
												</li>
												<li>
													<strong>Untrusted environments:</strong> Where secrets can’t be protected
												</li>
												<li>
													<strong>Simple backend API calls:</strong> Skip user context and use
													Client Credentials
												</li>
											</ul>
										</SuitabilityCard>
									</FlowSuitability>
								</CollapsibleContent>
							)}
						</CollapsibleSection>
						<CollapsibleSection>
							<CollapsibleHeader
								onClick={() => toggleIntroSection('credentials')}
								aria-expanded={!introSectionsCollapsed.credentials}
							>
								<CollapsibleTitle>
									<FiSettings /> PingOne Application Settings
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={introSectionsCollapsed.credentials}>
									<FiChevronDown />
								</CollapsibleToggleIcon>
							</CollapsibleHeader>
							{!introSectionsCollapsed.credentials && (
								<CollapsibleContent>
									<PingOneApplicationConfig
										value={pingOneAppSettings}
										onChange={setPingOneAppSettings}
									/>
									<FormGrid>
										<FormField>
											<FormLabel>
												Client ID <span style={{ color: '#ef4444' }}>*</span>
											</FormLabel>
											<FormInput
												type="text"
												placeholder={
													emptyRequiredFields.has('clientId')
														? 'Required: Enter your PingOne Client ID'
														: 'Enter your PingOne Client ID'
												}
												value={credentials.clientId}
												onChange={(e) => handleFieldChange('clientId', e.target.value)}
												$hasError={emptyRequiredFields.has('clientId')}
											/>
										</FormField>

										<FormField>
											<FormLabel>
												Client Secret <span style={{ color: '#ef4444' }}>*</span>
											</FormLabel>
											<FormInput
												type="password"
												placeholder={
													emptyRequiredFields.has('clientSecret')
														? 'Required: Enter your PingOne Client Secret'
														: 'Enter your PingOne Client Secret'
												}
												value={credentials.clientSecret}
												onChange={(e) => handleFieldChange('clientSecret', e.target.value)}
												$hasError={emptyRequiredFields.has('clientSecret')}
											/>
										</FormField>

										<FormField>
											<FormLabel>
												Environment ID <span style={{ color: '#ef4444' }}>*</span>
											</FormLabel>
											<FormInput
												type="text"
												placeholder={
													emptyRequiredFields.has('environmentId')
														? 'Required: Enter your PingOne Environment ID'
														: 'Enter your PingOne Environment ID'
												}
												value={credentials.environmentId}
												onChange={(e) => handleFieldChange('environmentId', e.target.value)}
												$hasError={emptyRequiredFields.has('environmentId')}
											/>
										</FormField>

										<FormField>
											<FormLabel>
												Redirect URI <span style={{ color: '#ef4444' }}>*</span>
											</FormLabel>
											<FormInput
												type="text"
												placeholder={
													emptyRequiredFields.has('redirectUri')
														? 'Required: Enter your Redirect URI'
														: 'Enter your Redirect URI'
												}
												value={credentials.redirectUri}
												onChange={(e) => handleFieldChange('redirectUri', e.target.value)}
												$hasError={emptyRequiredFields.has('redirectUri')}
											/>
										</FormField>
									</FormGrid>

									<ActionRow>
										<Button onClick={handleSaveConfiguration} $variant="success">
											<FiSettings /> Save Configuration
										</Button>
										<Button onClick={handleClearConfiguration} $variant="danger">
											<FiRefreshCw /> Clear Configuration
										</Button>
									</ActionRow>

									<InfoBox
										style={{
											marginTop: '2rem',
											backgroundColor: '#fef3c7',
											borderColor: '#f59e0b',
										}}
									>
										<InfoTitle style={{ color: '#92400e' }}>
											<FiAlertCircle /> Testing vs Production
										</InfoTitle>
										<InfoText style={{ color: '#92400e' }}>
											This configuration is saved for testing purposes only. The client secret will
											be removed before production cleanup.
										</InfoText>
									</InfoBox>
								</CollapsibleContent>
							)}
						</CollapsibleSection>
						<CollapsibleSection>
							<CollapsibleHeader
								onClick={() => toggleIntroSection('flowDiagram')}
								aria-expanded={!introSectionsCollapsed.flowDiagram}
							>
								<CollapsibleTitle>
									<FiGlobe /> Authorization Flow Walkthrough
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={introSectionsCollapsed.flowDiagram}>
									<FiChevronDown />
								</CollapsibleToggleIcon>
							</CollapsibleHeader>
							{!introSectionsCollapsed.flowDiagram && (
								<CollapsibleContent>
									<FlowDiagram>
										{[
											'User clicks login to start the flow',
											'App redirects to PingOne with an authorization request',
											'User authenticates and approves scopes',
											'PingOne returns an authorization code to the redirect URI',
											'Backend exchanges the code for tokens securely',
										].map((stepDescription, index) => (
											<FlowStep key={stepDescription}>
												<FlowStepNumber>{index + 1}</FlowStepNumber>
												<FlowStepContent>
													<strong>{stepDescription}</strong>
												</FlowStepContent>
											</FlowStep>
										))}
									</FlowDiagram>
								</CollapsibleContent>
							)}
						</CollapsibleSection>
						***
						<CollapsibleSection>
							<CollapsibleHeader
								onClick={() => toggleIntroSection('results')}
								aria-expanded={!introSectionsCollapsed.results}
							>
								<CollapsibleTitle>
									<FiCheckCircle /> Saved Configuration Summary
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={introSectionsCollapsed.results}>
									<FiChevronDown />
								</CollapsibleToggleIcon>
							</CollapsibleHeader>
							{!introSectionsCollapsed.results && (
								<CollapsibleContent>
									<SectionDivider />

									<ResultsSection>
										<ResultsHeading>
											<FiCheckCircle size={18} /> Configuration Status
										</ResultsHeading>
										<HelperText>
											Save your PingOne application credentials so they auto-populate across the
											rest of the flow.
										</HelperText>
										{stepCompletions[0] ? (
											<GeneratedContentBox>
												<GeneratedLabel>✓ Saved</GeneratedLabel>
												<ParameterGrid>
													<div>
														<ParameterLabel>Client ID</ParameterLabel>
														<ParameterValue>{formatValue(credentials.clientId)}</ParameterValue>
													</div>
													<div>
														<ParameterLabel>Environment ID</ParameterLabel>
														<ParameterValue>
															{formatValue(credentials.environmentId)}
														</ParameterValue>
													</div>
													<div>
														<ParameterLabel>Client Secret</ParameterLabel>
														<ParameterValue>
															{maskClientSecret(credentials.clientSecret)}
														</ParameterValue>
													</div>
													<div>
														<ParameterLabel>Redirect URI</ParameterLabel>
														<ParameterValue>{formatValue(credentials.redirectUri)}</ParameterValue>
													</div>
												</ParameterGrid>
											</GeneratedContentBox>
										) : (
											<HelperText>
												Save your configuration above to persist it for future sessions.
											</HelperText>
										)}
									</ResultsSection>
								</CollapsibleContent>
							)}
						</CollapsibleSection>
					</>
				);

			case 1:
				return (
					<>
						<CardTitle>Step 1: PKCE Parameters</CardTitle>

						<SectionDivider />

						<ResultsSection>
							<ResultsHeading>
								<FiCheckCircle size={18} /> PKCE Parameters
							</ResultsHeading>
							<HelperText>
								PKCE keeps the authorization code exchange secure—copy these values if you want to
								inspect the token request later.
							</HelperText>
							{pkceCodes.codeVerifier ? (
								<GeneratedContentBox>
									<GeneratedLabel>✓ Generated</GeneratedLabel>
									<ParameterGrid>
										<div>
											<ParameterLabel>Code Verifier</ParameterLabel>
											<ParameterValue>{pkceCodes.codeVerifier}</ParameterValue>
										</div>
										<div>
											<ParameterLabel>Code Challenge</ParameterLabel>
											<ParameterValue>{pkceCodes.codeChallenge}</ParameterValue>
										</div>
									</ParameterGrid>
									<ActionRow>
										<Button
											onClick={() => handleCopy(pkceCodes.codeVerifier, 'Code Verifier')}
											$variant="outline"
										>
											<FiCopy /> Copy Verifier
										</Button>
										<Button
											onClick={() => handleCopy(pkceCodes.codeChallenge, 'Code Challenge')}
											$variant="outline"
										>
											<FiCopy /> Copy Challenge
										</Button>
										<HighlightedActionButton
											onClick={handleGeneratePKCE}
											$variant="secondary"
											$priority="primary"
										>
											<FiRefreshCw /> Regenerate
										</HighlightedActionButton>
									</ActionRow>
								</GeneratedContentBox>
							) : (
								<HelperText>
									Generate PKCE parameters above to create a one-time code verifier and hashed code
									challenge.
								</HelperText>
							)}
						</ResultsSection>

						<PkceEducationSection>
							<PkceEducationHeader>
								<FiKey /> What is PKCE and Why Use It?
							</PkceEducationHeader>
							<PkceCallout>
								PKCE (Proof Key for Code Exchange) adds security by preventing authorization code
								interception attacks. This step is required for public clients and recommended for
								enhanced security in all flows.
							</PkceCallout>

							<FlowSuitability>
								<SuitabilityCard $variant="success">
									<CardHeader>
										<FiShield /> Perfect For
									</CardHeader>
									<ul>
										<li>Public clients (SPAs, mobile apps) that can’t securely store secrets</li>
										<li>Native apps where redirect URIs may be compromised</li>
										<li>Any OAuth flow that wants defense-in-depth or must align to RFC 7636</li>
									</ul>
								</SuitabilityCard>
								<SuitabilityCard $variant="warning">
									<CardHeader>
										<FiAlertCircle /> How PKCE Works
									</CardHeader>
									<ul>
										<li>
											<strong>Code Verifier</strong>: Random 43–128 char string generated by your
											client
										</li>
										<li>
											<strong>Code Challenge</strong>: SHA256 hash of the verifier sent in the auth
											request
										</li>
										<li>
											<strong>Verification</strong>: During token exchange the original verifier
											proves you initiated the flow
										</li>
									</ul>
								</SuitabilityCard>
							</FlowSuitability>

							<PkceColumns>
								<PkceCard $variant="default">
									<CardHeader>
										<FiInfo /> Security Benefits
									</CardHeader>
									<ul>
										<li>Prevents code interception from being used without the verifier</li>
										<li>No client secret required for public apps</li>
										<li>Strong defense when redirect URIs are exposed</li>
										<li>Standards based (RFC 7636)</li>
									</ul>
								</PkceCard>
								<PkceCard $variant="default">
									<CardHeader>
										<FiKey /> Usage Tips
									</CardHeader>
									<ul>
										<li>Generate new values each authorization attempt</li>
										<li>Store the verifier only long enough to exchange the code</li>
										<li>Use S256 (SHA256) hashing method for the challenge</li>
										<li>Keep the verifier secure—treat it like a temporary secret</li>
									</ul>
								</PkceCard>
							</PkceColumns>
						</PkceEducationSection>
					</>
				);

			case 2:
				return (
					<>
						<CardTitle>Step 2: Authorization Request</CardTitle>

						<ExplanationSection>
							<ExplanationHeading>
								<FiInfo /> Build the PingOne Authorization Request
							</ExplanationHeading>
							<InfoText>
								We now redirect the user to PingOne with all required parameters. This teaches
								PingOne which app is asking, where to return, and which scopes to grant.
							</InfoText>
						</ExplanationSection>

						<InfoBox>
							<InfoTitle>
								<FiInfo /> What is an Authorization Request?
							</InfoTitle>
							<InfoText>
								The authorization request is the first step in the OAuth flow where your application
								redirects the user to the authorization server (PingOne) to grant permissions.
							</InfoText>
						</InfoBox>

						<InfoBox>
							<InfoTitle>
								<FiGlobe /> Authorization Request Process
							</InfoTitle>
							<InfoText>
								Your application constructs a URL with specific parameters and redirects the user's
								browser to PingOne's authorization endpoint.
							</InfoText>
						</InfoBox>

						<InfoBox>
							<InfoTitle>
								<FiKey /> Required Authorization Parameters
							</InfoTitle>
							<InfoList>
								<li>
									<strong>response_type=code</strong> - Indicates authorization code flow
								</li>
								<li>
									<strong>client_id</strong> - Your PingOne application ID
								</li>
								<li>
									<strong>redirect_uri</strong> - Where to send the user after authorization
								</li>
								<li>
									<strong>scope</strong> - Permissions requested (openid, profile, email)
								</li>
								<li>
									<strong>state</strong> - Security parameter to prevent CSRF
								</li>
								<li>
									<strong>code_challenge</strong> - PKCE challenge for security
								</li>
								<li>
									<strong>code_challenge_method</strong> - PKCE method (S256)
								</li>
							</InfoList>
						</InfoBox>

						<InfoBox>
							<InfoTitle>
								<FiGlobe /> PingOne Authorization URL Format
							</InfoTitle>
							<CodeBlock>
								{`https://auth.pingone.com/{environment-id}/as/authorize?
  response_type=code&
  client_id={client-id}&
  redirect_uri={redirect-uri}&
  scope=openid profile email&
  state={state}&
  code_challenge={code-challenge}&
  code_challenge_method=S256`}
							</CodeBlock>
						</InfoBox>

						<InfoBox style={{ backgroundColor: '#f0f9ff', borderColor: '#0ea5e9' }}>
							<InfoTitle style={{ color: '#0c4a6e' }}>
								<FiInfo /> Quick Start Guide
							</InfoTitle>
							<InfoText style={{ color: '#0c4a6e' }}>
								<strong>1.</strong> Generate the authorization URL
								<br />
								<strong>2.</strong> Open the URL to redirect to PingOne
								<br />
								<strong>3.</strong> Login and authorize the application
								<br />
								<strong>4.</strong> Return with authorization code
							</InfoText>
						</InfoBox>

						<ActionRow>
							<HighlightedActionButton
								onClick={handleGenerateAuthUrl}
								$variant="primary"
								$priority="primary"
							>
								<FiExternalLink /> Generate Authorization URL
								<HighlightBadge>1</HighlightBadge>
							</HighlightedActionButton>

							{authorizationUrl && (
								<HighlightedActionButton
									onClick={handleOpenAuthUrl}
									$variant="success"
									$priority="success"
								>
									<FiExternalLink /> Open Authorization URL
									<span style={{ fontSize: '0.75rem', color: '#d1d5db', marginLeft: '0.5rem' }}>
										(Login to PingOne)
									</span>
									<HighlightBadge>2</HighlightBadge>
								</HighlightedActionButton>
							)}
						</ActionRow>

						<SectionDivider />

						<ResultsSection>
							<ResultsHeading>
								<FiCheckCircle size={18} /> Authorization URL
							</ResultsHeading>
							<HelperText>
								Validate the generated URL and make sure all parameters look correct before you
								redirect users.
							</HelperText>
							{authorizationUrl ? (
								<GeneratedUrlDisplay>
									<GeneratedLabel>✓ Generated URL</GeneratedLabel>
									<div style={{ marginBottom: '1rem' }}>{authorizationUrl}</div>
									<HighlightedActionButton
										onClick={() => handleCopy(authorizationUrl, 'Authorization URL')}
										$variant="primary"
										$priority="primary"
									>
										<FiCopy /> Copy Authorization URL
									</HighlightedActionButton>
								</GeneratedUrlDisplay>
							) : (
								<HelperText>
									Generate an authorization URL above to continue to PingOne and test the flow.
								</HelperText>
							)}
						</ResultsSection>
					</>
				);

			case 3:
				return (
					<>
						<CardTitle>Step 3: Authorization Response</CardTitle>

						<InfoBox>
							<InfoTitle>
								<FiCheckCircle /> Authorization Response
							</InfoTitle>
							<InfoText>
								After the user authorizes your application, PingOne redirects them back to your
								redirect URI with an authorization code or error message.
							</InfoText>
						</InfoBox>

						<SectionDivider />

						<ResultsSection>
							<ResultsHeading>
								<FiCheckCircle size={18} /> Authorization Code
							</ResultsHeading>
							<HelperText>
								Use the authorization code immediately to exchange for tokens; it expires quickly.
								Copy it if you want to inspect the token exchange request.
							</HelperText>
							{authCode ? (
								<GeneratedContentBox>
									<GeneratedLabel>✓ Authorization Code Received</GeneratedLabel>
									<ParameterGrid>
										<div>
											<ParameterLabel>Authorization Code</ParameterLabel>
											<ParameterValue>{authCode}</ParameterValue>
										</div>
									</ParameterGrid>
									<ActionRow>
										<Button
											onClick={() => handleCopy(authCode, 'Authorization Code')}
											$variant="outline"
										>
											<FiCopy /> Copy Code
										</Button>
										<HighlightedActionButton
											onClick={handleNext}
											$variant="success"
											$priority="success"
										>
											Continue to Token Exchange <FiArrowRight />
										</HighlightedActionButton>
									</ActionRow>
								</GeneratedContentBox>
							) : (
								<EmptyState>
									<EmptyIcon>
										<FiAlertCircle />
									</EmptyIcon>
									<EmptyTitle>Authorization Code Not Received</EmptyTitle>
									<EmptyText>
										No authorization code found. You can manually enter a code below for testing
										purposes.
									</EmptyText>
									<FormField style={{ maxWidth: '400px', margin: '0 auto' }}>
										<FormLabel>Manual Authorization Code Entry</FormLabel>
										<FormInput
											type="text"
											placeholder="Enter authorization code manually"
											value={authCode}
											onChange={(e) => {
												setAuthCode(e.target.value);
												if (e.target.value.trim()) {
													setStepCompletions((prev) => ({ ...prev, 3: true }));
												}
											}}
										/>
									</FormField>
									{authCode && (
										<HighlightedActionButton
											onClick={handleNext}
											$variant="success"
											$priority="success"
											style={{ marginTop: '1rem' }}
										>
											Continue to Token Exchange <FiArrowRight />
										</HighlightedActionButton>
									)}
								</EmptyState>
							)}
						</ResultsSection>
					</>
				);

			case 4:
				return (
					<>
						<CardTitle>Step 4: Token Exchange</CardTitle>

						<ExplanationSection>
							<ExplanationHeading>
								<FiKey /> Exchange Authorization Code for Tokens
							</ExplanationHeading>
							<InfoText>
								We now call your backend, which securely exchanges the authorization code for tokens
								using the client credentials + PKCE verifier.
							</InfoText>
						</ExplanationSection>

						<InfoBox>
							<InfoTitle>
								<FiKey /> Token Exchange Process
							</InfoTitle>
							<InfoText>
								Exchange the authorization code for access and ID tokens using your client
								credentials and PKCE code verifier.
							</InfoText>
						</InfoBox>

						<ActionRow style={{ justifyContent: 'center' }}>
							<HighlightedActionButton
								onClick={handleExchangeTokens}
								$variant="primary"
								$priority="primary"
								disabled={!authCode}
							>
								<FiRefreshCw /> Exchange Authorization Code for Tokens
								{authCode && <HighlightBadge>3</HighlightBadge>}
							</HighlightedActionButton>
						</ActionRow>

						<SectionDivider />

						<ResultsSection>
							<ResultsHeading>
								<FiCheckCircle size={18} /> Token Response
							</ResultsHeading>
							<HelperText>
								Review the raw token response below. Copy the JSON or open the token management
								tools to decode and inspect each token.
							</HelperText>
							{tokens ? (
								<GeneratedContentBox>
									<GeneratedLabel>✓ Tokens Received</GeneratedLabel>
									<InfoText>
										Tokens are ready—inspect them or continue to decode ID/Access tokens in the
										token management tools.
									</InfoText>
									<CodeBlock>{JSON.stringify(tokens, null, 2)}</CodeBlock>
									<ActionRow>
										<Button
											onClick={() => handleCopy(JSON.stringify(tokens, null, 2), 'Tokens')}
											$variant="outline"
										>
											<FiCopy /> Copy Tokens
										</Button>
										<Button onClick={navigateToTokenManagement} $variant="primary">
											<FiExternalLink /> Open Token Management
										</Button>
									</ActionRow>
								</GeneratedContentBox>
							) : (
								<HelperText>
									Exchange the authorization code above to retrieve access, refresh, and ID tokens
									from PingOne.
								</HelperText>
							)}
						</ResultsSection>
					</>
				);

			case 5:
				return (
					<>
						<CardTitle>Step 5: User Information</CardTitle>

						<ExplanationSection>
							<ExplanationHeading>
								<FiEye /> Inspect the UserInfo Response
							</ExplanationHeading>
							<InfoText>
								Use the access token to call the PingOne UserInfo endpoint and review the claims
								granted during authorization.
							</InfoText>
						</ExplanationSection>

						<InfoBox>
							<InfoTitle>
								<FiEye /> User Info Endpoint
							</InfoTitle>
							<InfoText>
								Use the access token to retrieve user information from PingOne's UserInfo endpoint.
							</InfoText>
						</InfoBox>

						<SectionDivider />

						<ResultsSection>
							<ResultsHeading>
								<FiCheckCircle size={18} /> UserInfo Response
							</ResultsHeading>
							<HelperText>
								These claims reflect the scopes approved. Copy them or open the token management
								tools for a deeper inspection.
							</HelperText>
							{userInfo ? (
								<GeneratedContentBox>
									<GeneratedLabel>✓ User Info Retrieved</GeneratedLabel>
									<CodeBlock>{JSON.stringify(userInfo, null, 2)}</CodeBlock>
									<ActionRow>
										<Button
											onClick={() => handleCopy(JSON.stringify(userInfo, null, 2), 'User Info')}
											$variant="outline"
										>
											<FiCopy /> Copy User Info
										</Button>
										<Button onClick={navigateToTokenManagement} $variant="primary">
											<FiExternalLink /> Inspect Tokens
										</Button>
									</ActionRow>
								</GeneratedContentBox>
							) : (
								<HelperText>
									Exchange the authorization code first. Once tokens are received, the flow will
									automatically call the UserInfo endpoint.
								</HelperText>
							)}
						</ResultsSection>
					</>
				);

			case 6:
				return (
					<>
						<CardTitle>Step 6: Flow Complete</CardTitle>

						<GeneratedContentBox>
							<GeneratedLabel>✓ OAuth Flow Complete</GeneratedLabel>
							<InfoText>
								Congratulations! You have successfully completed the OAuth 2.0 Authorization Code
								Flow with PKCE.
							</InfoText>
							<InfoText>
								You now have access tokens, ID tokens, and user information. Use the actions below
								to continue exploring or restart the flow with different settings.
							</InfoText>
						</GeneratedContentBox>

						<CalloutCard style={{ marginTop: '1.5rem' }}>
							<InfoTitle>
								<FiShield /> Next Steps
							</InfoTitle>
							<InfoList>
								<li>Inspect tokens and decode claims using the Token Management tools.</li>
								<li>Repeat the flow with additional scopes or different redirect URIs.</li>
								<li>Explore refresh tokens and introspection in the dedicated modules.</li>
							</InfoList>
						</CalloutCard>

						<div
							style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'center' }}
						>
							<Button onClick={handleResetFlow} $variant="danger">
								<FiRefreshCw /> Start New Flow
							</Button>
							<Button onClick={navigateToTokenManagement} $variant="primary">
								<FiKey /> Manage Tokens
							</Button>
						</div>
					</>
				);

			default:
				return (
					<MainCard>
						<CardTitle>Unknown Step</CardTitle>
						<p>This step is not implemented yet.</p>
					</MainCard>
				);
		}
	};

	return (
		<Container>
			<ContentWrapper>
				<HeaderSection>
					<MainTitle>OAuth 2.0 Authorization Code Flow (V4) - Educational</MainTitle>
					<Subtitle>
						A comprehensive, step-by-step guide to understanding the Authorization Code Flow with
						PKCE.
					</Subtitle>
				</HeaderSection>

				<MainCard>
					<StepHeader>
						<StepHeaderLeft>
							<VersionBadge>Authorization Code Flow · V4</VersionBadge>
							<StepHeaderTitle>{STEP_METADATA[currentStep].title}</StepHeaderTitle>
							<StepHeaderSubtitle>{STEP_METADATA[currentStep].subtitle}</StepHeaderSubtitle>
						</StepHeaderLeft>
						<StepHeaderRight>
							<StepNumber>{String(currentStep + 1).padStart(2, '0')}</StepNumber>
							<StepTotal>of 07</StepTotal>
						</StepHeaderRight>
					</StepHeader>
					<StepContentWrapper>{renderStepContent()}</StepContentWrapper>
				</MainCard>
			</ContentWrapper>

			{/* Step Navigation */}
			<StepNavigation>
				<StepIndicator>
					{STEP_METADATA.map((step, index) => (
						<StepDot
							key={step.title}
							$active={currentStep === index}
							$completed={stepCompletions[index]}
						/>
					))}
				</StepIndicator>

				<NavigationButtons>
					<NavButton onClick={handlePrev} $variant="outline" disabled={currentStep === 0}>
						<FiArrowLeft /> Previous
					</NavButton>
					<NavButton onClick={handleResetFlow} $variant="danger">
						<FiRefreshCw /> Reset Flow
					</NavButton>
					<NavButton
						onClick={handleNext}
						$variant={stepCompletions[currentStep] ? 'success' : 'primary'}
						disabled={currentStep === STEP_METADATA.length - 1}
					>
						Next <FiArrowRight />
					</NavButton>
				</NavigationButtons>
			</StepNavigation>

			{/* Modals */}
			<Modal $show={showRedirectModal}>
				<ModalContent>
					<ModalIcon>
						<FiExternalLink />
					</ModalIcon>
					<ModalTitle>Redirecting to PingOne</ModalTitle>
					<ModalText>
						You will be redirected to PingOne for authorization. Please login and authorize the
						application.
					</ModalText>
				</ModalContent>
			</Modal>

			<Modal $show={showSuccessModal}>
				<ModalContent>
					<ModalIcon>
						<FiCheckCircle />
					</ModalIcon>
					<ModalTitle>Authorization Successful</ModalTitle>
					<ModalText>
						Great! You have been authorized and returned with an authorization code.
					</ModalText>
				</ModalContent>
			</Modal>
		</Container>
	);
};

export default AuthorizationCodeFlowV4;
