// src/pages/security/HelioMartPasswordReset.tsx
// HelioMart Password Reset Demo - Real-world password management interface

import Prism from 'prismjs';
import React, { useCallback, useEffect, useState } from 'react';
import {
	FiAlertCircle,
	FiBook,
	FiCheckCircle,
	FiChevronDown,
	FiChevronUp,
	FiCode,
	FiCopy,
	FiExternalLink,
	FiEye,
	FiEyeOff,
	FiKey,
	FiLock,
	FiLogIn,
	FiMail,
	FiRefreshCw,
	FiSearch,
} from 'react-icons/fi';
import styled from 'styled-components';
import 'prismjs/themes/prism.css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-json';
import { ApiCallTable } from '../../components/ApiCallTable';
import { AuthorizationCodeConfigModal } from '../../components/AuthorizationCodeConfigModal';
import { PasswordSetValueTab } from '../../components/password-reset/PasswordSetValueTab';
import { WorkerTokenDetectedBanner } from '../../components/WorkerTokenDetectedBanner';
import { WorkerTokenModal } from '../../components/WorkerTokenModal';
import { CompactAppPickerV8U } from '../../v8u/components/CompactAppPickerV8U';
import { renderWorkerTokenButton } from '../../services/workerTokenUIService';
import type { DiscoveredApp } from '../../v8/components/AppPickerV8';
import type { ApiCall } from '../../services/apiCallTrackerService';
import { apiCallTrackerService } from '../../services/apiCallTrackerService';
import { comprehensiveFlowDataService } from '../../services/comprehensiveFlowDataService';
import { PageLayoutService } from '../../services/pageLayoutService';
import {
	changePassword,
	checkPassword,
	forcePasswordChange,
	readPasswordState,
	recoverPassword,
	sendRecoveryCode,
	setPassword,
	setPasswordAdmin,
	setPasswordLdapGateway,
	unlockPassword,
} from '../../services/passwordResetService';
import { lookupPingOneUser } from '../../services/pingOneUserProfileService';
import { workerTokenCredentialsService } from '../../services/workerTokenCredentialsService';
import { trackedFetch } from '../../utils/trackedFetch';
import { v4ToastManager } from '../../utils/v4ToastMessages';
import { getAnyWorkerToken } from '../../utils/workerTokenDetection';

// Type for PingOne user objects
interface PingOneUserName {
	given?: string;
	family?: string;
}

interface PingOneUser {
	id?: string;
	username?: string;
	email?: string;
	name?: string | PingOneUserName;
	[key: string]: unknown;
}

// Type for password state
interface PasswordState {
	status?: string;
	locked?: boolean;
	expired?: boolean;
	[key: string]: unknown;
}

// HelioMart Brand Colors
const HELIOMART_ACCENT_START = '#F59E0B'; // Amber
const HELIOMART_ACCENT_END = '#F97316'; // Orange


// Login Page Styled Components
const LoginTitle = styled.h1`
	font-size: 2rem;
	font-weight: 700;
	color: #1F2937;
	margin-bottom: 0.5rem;
	text-align: center;
`;

const LoginSubtitle = styled.p`
	color: #6B7280;
	text-align: center;
	margin-bottom: 2rem;
	font-size: 0.875rem;
`;

const SuccessMessage = styled.div`
	background: linear-gradient(135deg, #10b981 0%, #059669 100%);
	color: white;
	padding: 2rem;
	border-radius: 1rem;
	text-align: center;
	margin: 2rem 0;
	box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3);
`;

const SuccessTitle = styled.h2`
	font-size: 1.5rem;
	font-weight: 700;
	margin-bottom: 0.5rem;
`;

const SuccessText = styled.p`
	font-size: 1rem;
	opacity: 0.95;
	margin: 0;
`;

const Card = styled.div`
	background: #ffffff;
	border: 1px solid #E5E7EB;
	border-radius: 1rem;
	padding: 2rem;
	margin-bottom: 2rem;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const TabContainer = styled.div`
	display: flex;
	gap: 0.5rem;
	margin-bottom: 2rem;
	border-bottom: 2px solid #E5E7EB;
`;

const Tab = styled.button<{ $active: boolean }>`
	background: none;
	border: none;
	color: ${(props) => (props.$active ? HELIOMART_ACCENT_START : '#6B7280')};
	padding: 1rem 1.5rem;
	font-size: 1rem;
	font-weight: ${(props) => (props.$active ? 600 : 400)};
	cursor: pointer;
	border-bottom: 2px solid ${(props) => (props.$active ? HELIOMART_ACCENT_START : 'transparent')};
	transition: all 0.2s;
	margin-bottom: -2px;

	&:hover {
		color: ${HELIOMART_ACCENT_START};
	}
`;

const FormGroup = styled.div`
	margin-bottom: 1.5rem;
`;

const Label = styled.label`
	display: block;
	margin-bottom: 0.5rem;
	font-weight: 600;
	color: #374151;
	font-size: 0.875rem;
`;

const Input = styled.input`
	width: 100%;
	padding: 0.75rem;
	background: #ffffff;
	border: 1px solid #D1D5DB;
	border-radius: 0.5rem;
	color: #1F2937;
	font-size: 1rem;
	transition: border-color 0.2s;

	&:focus {
		outline: none;
		border-color: ${HELIOMART_ACCENT_START};
		box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
	}

	&::placeholder {
		color: #9CA3AF;
	}
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' | 'success' }>`
	padding: 0.75rem 1.5rem;
	border-radius: 0.5rem;
	border: none;
	font-size: 1rem;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s;
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;

	${(props) => {
		if (props.$variant === 'secondary') {
			return `
				background: #F3F4F6;
				color: #374151;
				border: 1px solid #D1D5DB;
				&:hover {
					background: #E5E7EB;
				}
			`;
		}
		if (props.$variant === 'danger') {
			return `
				background: #DC2626;
				color: #ffffff;
				&:hover {
					background: #B91C1C;
				}
			`;
		}
		if (props.$variant === 'success') {
			return `
				background: #22C55E;
				color: #ffffff;
				&:hover {
					background: #16A34A;
				}
			`;
		}
		return `
			background: linear-gradient(135deg, ${HELIOMART_ACCENT_START} 0%, ${HELIOMART_ACCENT_END} 100%);
			color: #ffffff;
			&:hover {
				opacity: 0.9;
				transform: translateY(-1px);
				box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
			}
		`;
	}}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
	}
`;

const Alert = styled.div<{ $type: 'success' | 'error' | 'info' }>`
	padding: 1rem;
	border-radius: 0.5rem;
	margin-bottom: 1.5rem;
	display: flex;
	align-items: center;
	gap: 0.75rem;
	background: ${(props) => {
		if (props.$type === 'success') return 'rgba(34, 197, 94, 0.1)';
		if (props.$type === 'error') return 'rgba(220, 38, 38, 0.1)';
		return 'rgba(59, 130, 246, 0.1)';
	}};
	border: 1px solid ${(props) => {
		if (props.$type === 'success') return '#22C55E';
		if (props.$type === 'error') return '#DC2626';
		return '#3B82F6';
	}};
	color: ${(props) => {
		if (props.$type === 'success') return '#15803D';
		if (props.$type === 'error') return '#991B1B';
		return '#1E40AF';
	}};
`;

const StatusBar = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 1rem;
	background: #F9FAFB;
	border: 1px solid #E5E7EB;
	border-radius: 0.5rem;
	margin-bottom: 2rem;
	font-size: 0.875rem;
`;

const StatusItem = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	color: #374151;
`;

const UserCard = styled.div`
	background: #F9FAFB;
	border: 1px solid #E5E7EB;
	border-radius: 0.5rem;
	padding: 1rem;
	margin-bottom: 1rem;
	display: flex;
	align-items: center;
	justify-content: space-between;
`;

const UserInfo = styled.div`
	display: flex;
	align-items: center;
	gap: 1rem;
`;

const UserAvatar = styled.div`
	width: 48px;
	height: 48px;
	border-radius: 50%;
	background: linear-gradient(135deg, ${HELIOMART_ACCENT_START} 0%, ${HELIOMART_ACCENT_END} 100%);
	display: flex;
	align-items: center;
	justify-content: center;
	font-weight: 600;
	font-size: 1.25rem;
	color: #ffffff;
`;

const ApiCallTableContainer = styled.div`
	max-width: 1400px;
	margin: 2rem auto 0;
	padding: 0 2rem;
`;

const SpinningIcon = styled(FiRefreshCw)`
	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
	
	animation: spin 1s linear infinite;
`;

const DocumentationLink = styled.a`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	color: ${HELIOMART_ACCENT_START};
	text-decoration: none;
	font-size: 0.875rem;
	margin-top: 1rem;
	padding: 0.5rem 1rem;
	border: 1px solid #D1D5DB;
	border-radius: 0.5rem;
	background: #F9FAFB;
	transition: all 0.2s;

	&:hover {
		color: ${HELIOMART_ACCENT_END};
		border-color: ${HELIOMART_ACCENT_START};
		background: #F3F4F6;
	}
`;

const DocumentationSection = styled.div`
	margin-top: 1.5rem;
	padding-top: 1.5rem;
	border-top: 1px solid #E5E7EB;
`;

const CodeGeneratorSection = styled.div`
	margin-top: 2rem;
	padding: 1.5rem;
	background: #F9FAFB;
	border: 1px solid #E5E7EB;
	border-radius: 0.5rem;
`;

const CodeContainer = styled.div<{ $isExpanded: boolean }>`
	background: #ffffff;
	border: 1px solid #E5E7EB;
	border-radius: 0.5rem;
	margin: 1rem 0;
	overflow: ${(props) => (props.$isExpanded ? 'visible' : 'hidden')};
	max-height: ${(props) => (props.$isExpanded ? '10000px' : '200px')};
	transition: max-height 0.3s ease, overflow 0.3s ease;
	position: relative;
`;

const CodeBlock = styled.pre`
	background: #ffffff;
	padding: 1rem;
	color: #1F2937;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.875rem;
	line-height: 1.6;
	overflow-x: auto;
	margin: 0;
	white-space: pre;
	word-wrap: normal;
	
	code {
		font-family: inherit;
	}
`;

const CodeCollapseButton = styled.button`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.5rem 1rem;
	background: #F3F4F6;
	border: 1px solid #D1D5DB;
	border-top: none;
	border-radius: 0 0 0.5rem 0.5rem;
	color: #374151;
	cursor: pointer;
	font-size: 0.875rem;
	width: 100%;
	justify-content: center;
	transition: all 0.2s;

	&:hover {
		background: #E5E7EB;
	}
`;

// Login Modal Styled Components
const ModalOverlay = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
	padding: 2rem;
`;

const ModalContent = styled.div`
	background: #ffffff;
	border-radius: 1rem;
	padding: 2rem;
	box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
	max-width: 450px;
	width: 100%;
	max-height: 90vh;
	overflow-y: auto;
`;

const CodeHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 1rem;
`;

const CodeTitle = styled.h3`
	margin: 0;
	font-size: 1.125rem;
	color: ${HELIOMART_ACCENT_START};
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const CodeActions = styled.div`
	display: flex;
	gap: 0.5rem;
`;

const CodeButton = styled.button`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.5rem 1rem;
	background: #F3F4F6;
	border: 1px solid #D1D5DB;
	border-radius: 0.5rem;
	color: #374151;
	cursor: pointer;
	font-size: 0.875rem;
	transition: all 0.2s;

	&:hover {
		background: ${HELIOMART_ACCENT_START};
		border-color: ${HELIOMART_ACCENT_START};
		color: #ffffff;
	}

	&:active {
		transform: scale(0.98);
	}
`;

type TabType =
	| 'overview'
	| 'recover'
	| 'force-reset'
	| 'change'
	| 'check'
	| 'unlock'
	| 'state'
	| 'admin-set'
	| 'set'
	| 'set-value'
	| 'ldap-gateway';

// Helper function to safely get user name display
const getUserNameDisplay = (user: PingOneUser | null): string => {
	if (!user) return 'User';
	if (typeof user.name === 'object' && user.name) {
		const nameObj = user.name;
		const parts = [nameObj.given, nameObj.family].filter(Boolean);
		return parts.length > 0 ? parts.join(' ') : user.username || 'User';
	}
	return typeof user.name === 'string' ? user.name : user.username || 'User';
};

// Helper function to safely get user name initial
const getUserNameInitial = (user: PingOneUser | null): string => {
	if (!user) return 'U';
	if (typeof user.name === 'object' && user.name?.given) {
		return user.name.given[0]?.toUpperCase() || 'U';
	}
	return user.username?.[0]?.toUpperCase() || 'U';
};

const HelioMartPasswordReset: React.FC = () => {
	const [activeTab, setActiveTab] = useState<TabType>('overview');
	const [showLoginModal, setShowLoginModal] = useState(false);
	const [apiCalls, setApiCalls] = useState<ApiCall[]>([]);
	const [workerToken, setWorkerToken] = useState('');
	const [workerTokenExpiresAt, setWorkerTokenExpiresAt] = useState<number | undefined>(undefined);
	const [environmentId, setEnvironmentId] = useState('');
	const [showWorkerTokenModal, setShowWorkerTokenModal] = useState(false);
	const [showAuthzConfigModal, setShowAuthzConfigModal] = useState(false);
	const [showSetupModal, setShowSetupModal] = useState(false);

	// Login state
	const [loginUsername, setLoginUsername] = useState('');
	const [loginPassword, setLoginPassword] = useState('');
	const [showLoginPassword, setShowLoginPassword] = useState(false);
	const [isLoggingIn, setIsLoggingIn] = useState(false);
	const [userAccessToken, setUserAccessToken] = useState('');
	const [userId, setUserId] = useState('');
	const [userInfo, setUserInfo] = useState<PingOneUser | null>(null);
	const [authzCredentials, setAuthzCredentials] = useState({
		environmentId: '',
		clientId: '',
		clientSecret: '',
		redirectUri: 'https://localhost:3000/callback',
		scopes: 'openid profile email',
	});

	// Recover tab state
	const [recoverEmail, setRecoverEmail] = useState('');
	const [recoveryCodeSent, setRecoveryCodeSent] = useState(false);
	const [recoveryCode, setRecoveryCode] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [showNewPassword, setShowNewPassword] = useState(false);
	const [recoverLoading, setRecoverLoading] = useState(false);
	const [recoverSuccess, setRecoverSuccess] = useState(false);
	const [recoverUserId, setRecoverUserId] = useState('');

	// Force reset tab state
	const [forceResetIdentifier, setForceResetIdentifier] = useState('');
	const [forceResetUser, setForceResetUser] = useState<PingOneUser | null>(null);
	const [forceResetLoading, setForceResetLoading] = useState(false);
	const [forceResetSuccess, setForceResetSuccess] = useState(false);

	// Change password tab state
	const [oldPassword, setOldPassword] = useState('');
	const [changeNewPassword, setChangeNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [showOldPassword, setShowOldPassword] = useState(false);
	const [showChangeNewPassword, setShowChangeNewPassword] = useState(false);
	const [changePasswordLoading, setChangePasswordLoading] = useState(false);
	const [changePasswordSuccess, setChangePasswordSuccess] = useState(false);

	// Check password tab state
	const [checkPasswordIdentifier, setCheckPasswordIdentifier] = useState('');
	const [checkPasswordUser, setCheckPasswordUser] = useState<PingOneUser | null>(null);
	const [checkPasswordValue, setCheckPasswordValue] = useState('');
	const [showCheckPassword, setShowCheckPassword] = useState(false);
	const [checkPasswordLoading, setCheckPasswordLoading] = useState(false);
	const [checkPasswordResult, setCheckPasswordResult] = useState<{
		valid?: boolean;
		message?: string;
	} | null>(null);

	// Unlock password tab state
	const [unlockIdentifier, setUnlockIdentifier] = useState('');
	const [unlockUser, setUnlockUser] = useState<PingOneUser | null>(null);
	const [unlockLoading, setUnlockLoading] = useState(false);
	const [unlockSuccess, setUnlockSuccess] = useState(false);

	// Read password state tab state
	const [stateIdentifier, setStateIdentifier] = useState('');
	const [stateUser, setStateUser] = useState<PingOneUser | null>(null);
	const [passwordState, setPasswordState] = useState<PasswordState | null>(null);
	const [stateLoading, setStateLoading] = useState(false);

	// Admin set password tab state
	const [adminSetIdentifier, setAdminSetIdentifier] = useState('');
	const [adminSetUser, setAdminSetUser] = useState<PingOneUser | null>(null);
	const [adminSetPassword, setAdminSetPassword] = useState('');
	const [showAdminSetPassword, setShowAdminSetPassword] = useState(false);
	const [adminSetForceChange, setAdminSetForceChange] = useState(false);
	const [adminSetBypassPolicy, setAdminSetBypassPolicy] = useState(false);
	const [adminSetLoading, setAdminSetLoading] = useState(false);
	const [adminSetSuccess, setAdminSetSuccess] = useState(false);

	// Set password tab state
	const [setPasswordIdentifier, setSetPasswordIdentifier] = useState('');
	const [setPasswordUser, setSetPasswordUser] = useState<PingOneUser | null>(null);
	const [setPasswordValue, setSetPasswordValue] = useState('');
	const [showSetPassword, setShowSetPassword] = useState(false);
	const [setPasswordForceChange, setSetPasswordForceChange] = useState(false);
	const [setPasswordBypassPolicy, setSetPasswordBypassPolicy] = useState(false);
	const [setPasswordLoading, setSetPasswordLoading] = useState(false);
	const [setPasswordSuccess, setSetPasswordSuccess] = useState(false);

	// LDAP Gateway tab state
	const [ldapIdentifier, setLdapIdentifier] = useState('');
	const [ldapUser, setLdapUser] = useState<PingOneUser | null>(null);
	const [ldapPassword, setLdapPassword] = useState('');
	const [ldapGatewayId, setLdapGatewayId] = useState('');
	const [showLdapPassword, setShowLdapPassword] = useState(false);
	const [ldapForceChange, setLdapForceChange] = useState(false);
	const [ldapBypassPolicy, setLdapBypassPolicy] = useState(false);
	const [ldapLoading, setLdapLoading] = useState(false);
	const [ldapSuccess, setLdapSuccess] = useState(false);

	// Code generator state
	const [generatedCode, setGeneratedCode] = useState('');
	const [showCodeGenerator, setShowCodeGenerator] = useState(false);
	const [isCodeExpanded, setIsCodeExpanded] = useState(true);
	const [copied, setCopied] = useState(false);

	// App picker state
	const [selectedApp, setSelectedApp] = useState<DiscoveredApp | null>(null);

	// Subscribe to API calls
	useEffect(() => {
		const unsubscribe = apiCallTrackerService.subscribe((calls) => {
			setApiCalls(calls);
		});
		return unsubscribe;
	}, []);

	// Update environment ID when worker token is updated
	useEffect(() => {
		const handleTokenUpdate = () => {
			try {
				const stored = localStorage.getItem('unified_worker_token');
				if (stored) {
					const data = JSON.parse(stored);
					if (data.credentials?.environmentId && !environmentId) {
						setEnvironmentId(data.credentials.environmentId);
					}
				}
			} catch (error) {
				console.log('Failed to update environment ID from worker token:', error);
			}
		};

		window.addEventListener('workerTokenUpdated', handleTokenUpdate);
		return () => window.removeEventListener('workerTokenUpdated', handleTokenUpdate);
	}, [environmentId]);

	// Load environment ID, worker token, and authz credentials
	useEffect(() => {
		const loadConfig = () => {
			const FLOW_TYPE = 'heliomart-password-reset';

			// Load environment ID from shared environment, then worker token credentials, then use default
			const sharedEnv = comprehensiveFlowDataService.loadSharedEnvironment();
			let envId = sharedEnv?.environmentId || '';

			// Try worker token credentials as fallback
			if (!envId) {
				try {
					const stored = localStorage.getItem('unified_worker_token');
					if (stored) {
						const data = JSON.parse(stored);
						envId = data.credentials?.environmentId || '';
					}
				} catch (error) {
					console.log('Failed to load environment ID from worker token:', error);
				}
			}

			// Use default if still empty
			if (!envId) {
				envId = 'b9817c16-9910-4415-b67e-4ac687da74d9';
			}

			setEnvironmentId(envId);

			// Use global worker token
			const globalToken = getAnyWorkerToken();
			if (globalToken) {
				setWorkerToken(globalToken);
				// Try to get expiresAt from stored token data
				try {
					const stored = localStorage.getItem('unified_worker_token');
					if (stored) {
						const data = JSON.parse(stored);
						setWorkerTokenExpiresAt(data.expiresAt);
					}
				} catch (error) {
					console.log('Failed to load worker token expiresAt:', error);
				}
			} else {
				// Check for saved credentials
				const savedCreds = workerTokenCredentialsService.loadCredentials(FLOW_TYPE);
				if (
					!savedCreds ||
					!savedCreds.environmentId ||
					!savedCreds.clientId ||
					!savedCreds.clientSecret
				) {
					// Pre-fill with provided credentials if available
					if (!savedCreds) {
						setShowWorkerTokenModal(true);
					}
				}
			}

			// Load authorization code credentials
			const savedAuthz = comprehensiveFlowDataService.loadFlowCredentialsIsolated(FLOW_TYPE);
			if (savedAuthz?.environmentId && savedAuthz.clientId && savedAuthz.clientSecret) {
				setAuthzCredentials({
					environmentId: savedAuthz.environmentId || '',
					clientId: savedAuthz.clientId || '',
					clientSecret: savedAuthz.clientSecret || '',
					redirectUri: savedAuthz.redirectUri || 'https://localhost:3000/callback',
					scopes: Array.isArray(savedAuthz.scopes)
						? savedAuthz.scopes.join(' ')
						: savedAuthz.scopes || 'openid profile email',
				});
			} else {
				// No authorization code credentials found - show setup modal
				console.log(
					'⚠️ [HelioMartPasswordReset] No authorization code credentials found, showing setup modal...'
				);
				setTimeout(() => setShowSetupModal(true), 200);
			}
		};

		loadConfig();

		// Listen for global worker token changes
		const handleStorageChange = (e: StorageEvent) => {
			if (e.key?.startsWith('worker_token') || e.key?.startsWith('pingone_worker_token')) {
				const newToken = getAnyWorkerToken();
				if (newToken) {
					setWorkerToken(newToken);
				}
			}
		};

		window.addEventListener('storage', handleStorageChange);

		// Also poll for same-tab updates (since storage event only fires cross-tab)
		const interval = setInterval(() => {
			const currentToken = getAnyWorkerToken();
			if (currentToken && currentToken !== workerToken) {
				setWorkerToken(currentToken);
			}
		}, 1000);

		return () => {
			window.removeEventListener('storage', handleStorageChange);
			clearInterval(interval);
		};
	}, [workerToken]);

	// Handle login with PingOne
	const handleLogin = useCallback(async () => {
		if (!loginUsername || !loginPassword) {
			v4ToastManager.showError('Please enter username and password');
			return;
		}

		if (
			!authzCredentials.environmentId ||
			!authzCredentials.clientId ||
			!authzCredentials.clientSecret
		) {
			v4ToastManager.showError('Please configure application credentials first');
			setShowAuthzConfigModal(true);
			return;
		}

		setIsLoggingIn(true);
		try {
			// Generate PKCE codes for redirectless authorization code flow
			const { generateCodeVerifier, generateCodeChallenge } = await import('../../utils/oauth');
			const verifier = generateCodeVerifier();
			const challenge = await generateCodeChallenge(verifier);

			if (!challenge || typeof challenge !== 'string' || challenge.length === 0) {
				throw new Error('Failed to generate PKCE code challenge');
			}
			if (!verifier || typeof verifier !== 'string' || verifier.length === 0) {
				throw new Error('Failed to generate PKCE code verifier');
			}

			console.log('[PasswordReset] PKCE codes generated:', {
				hasVerifier: !!verifier,
				hasChallenge: !!challenge,
				verifierLength: verifier?.length,
				challengeLength: challenge?.length,
			});

			// Step 1: Initiate authorization flow
			const actualPingOneAuthUrl = `https://auth.pingone.com/${encodeURIComponent(authzCredentials.environmentId)}/as/authorize`;

			const authResponse = await trackedFetch(`/api/pingone/redirectless/authorize`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					environmentId: authzCredentials.environmentId,
					clientId: authzCredentials.clientId,
					clientSecret: authzCredentials.clientSecret,
					redirectUri: authzCredentials.redirectUri,
					scopes: authzCredentials.scopes,
					codeChallenge: challenge,
					codeChallengeMethod: 'S256',
					state: `password-reset-${Date.now()}`,
				}),
				actualPingOneUrl: actualPingOneAuthUrl,
			});

			const authData = await authResponse.json();
			if (!authResponse.ok || !authData.flowId) {
				throw new Error(authData.error_description || authData.error || 'Failed to initiate login');
			}

			const currentFlowId = authData.flowId;

			// Step 2: Submit login credentials
			const actualPingOneFlowUrl = `https://auth.pingone.com/${encodeURIComponent(authzCredentials.environmentId)}/flows/${encodeURIComponent(currentFlowId)}`;

			const loginResponse = await trackedFetch(`/api/pingone/flows/check-username-password`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					flowUrl: actualPingOneFlowUrl,
					username: loginUsername,
					password: loginPassword,
				}),
				actualPingOneUrl: actualPingOneFlowUrl,
			});

			const loginData = await loginResponse.json();
			if (!loginResponse.ok) {
				throw new Error(loginData.error_description || loginData.error || 'Invalid credentials');
			}

			// Step 3: Poll for completion and get tokens
			const resumeUrl = loginData.resumeUrl;
			if (!resumeUrl) {
				throw new Error('No resume URL received');
			}

			// Poll for completion
			let completed = false;
			let attempts = 0;
			const maxAttempts = 30;

			while (!completed && attempts < maxAttempts) {
				await new Promise((resolve) => setTimeout(resolve, 1000));

				// Extract environment ID from resumeUrl for actualPingOneUrl
				const resumeUrlMatch = resumeUrl.match(/\/environments\/([^/]+)\//);
				const envIdFromResume = resumeUrlMatch ? resumeUrlMatch[1] : authzCredentials.environmentId;
				const actualPingOneResumeUrl = resumeUrl.startsWith('https://')
					? resumeUrl
					: `https://auth.pingone.com/${envIdFromResume}/as/resume`;

				const pollResponse = await trackedFetch(`/api/pingone/redirectless/poll`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ resumeUrl }),
					actualPingOneUrl: actualPingOneResumeUrl,
				});

				const pollData = await pollResponse.json();
				if (pollData.code) {
					// Exchange code for tokens (with PKCE code verifier)
					// Use the verifier from the closure (generated at the start of this function)
					const actualPingOneTokenUrl = `https://auth.pingone.com/${encodeURIComponent(authzCredentials.environmentId)}/as/token`;

					const tokenResponse = await trackedFetch('/api/token-exchange', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							grant_type: 'authorization_code',
							environment_id: authzCredentials.environmentId,
							client_id: authzCredentials.clientId,
							client_secret: authzCredentials.clientSecret,
							code: pollData.code,
							redirect_uri: authzCredentials.redirectUri,
							code_verifier: verifier, // Required for PKCE - use local variable from closure
						}),
						actualPingOneUrl: actualPingOneTokenUrl,
					});

					const tokenData = await tokenResponse.json();
					if (tokenResponse.ok && tokenData.access_token) {
						setUserAccessToken(tokenData.access_token);

						// Get user info
						if (tokenData.id_token) {
							try {
								const payload = JSON.parse(atob(tokenData.id_token.split('.')[1]));
								setUserId(payload.sub);
								setUserInfo({
									email: payload.email,
									name: payload.name,
									username: payload.preferred_username || loginUsername,
								});
							} catch (e) {
								console.error('Failed to parse ID token:', e);
							}
						}

						v4ToastManager.showSuccess('Login successful!');
						setShowLoginModal(false);
						setActiveTab('change'); // Show change password tab by default after login
						completed = true;
					} else {
						throw new Error(tokenData.error_description || 'Failed to exchange code for tokens');
					}
				} else if (pollData.error) {
					throw new Error(pollData.error_description || pollData.error);
				}

				attempts++;
			}

			if (!completed) {
				throw new Error('Login timeout - please try again');
			}
		} catch (error) {
			console.error('[PasswordReset] Login failed:', error);
			v4ToastManager.showError(error instanceof Error ? error.message : 'Login failed');
		} finally {
			setIsLoggingIn(false);
		}
	}, [loginUsername, loginPassword, authzCredentials]);

	// Helper to get effective environment ID from shared environment or state
	const getEffectiveEnvironmentId = useCallback(() => {
		const sharedEnv = comprehensiveFlowDataService.loadSharedEnvironment();
		const effectiveEnvId = sharedEnv?.environmentId || environmentId;

		// Log for debugging if environment ID is missing
		if (!effectiveEnvId || effectiveEnvId.trim() === '') {
			console.warn('[HelioMartPasswordReset] ⚠️ No environment ID found:', {
				sharedEnvId: sharedEnv?.environmentId || '(empty)',
				stateEnvId: environmentId || '(empty)',
				effectiveEnvId: effectiveEnvId || '(empty)',
			});
		}

		return effectiveEnvId;
	}, [environmentId]);

	// Lookup user by email and send recovery code
	const handleSendRecoveryCode = useCallback(async () => {
		const effectiveWorkerToken = getAnyWorkerToken() || workerToken;
		const effectiveEnvironmentId = getEffectiveEnvironmentId();

		if (!recoverEmail) {
			v4ToastManager.showError('Please enter your email address');
			return;
		}
		if (!effectiveWorkerToken || effectiveWorkerToken.trim() === '') {
			console.error('[HelioMartPasswordReset] ❌ Missing worker token:', {
				globalToken: getAnyWorkerToken() ? 'present' : 'missing',
				localToken: workerToken ? 'present' : 'missing',
			});
			v4ToastManager.showError('Worker token is required. Please generate a worker token first.');
			return;
		}
		if (!effectiveEnvironmentId || effectiveEnvironmentId.trim() === '') {
			console.error('[HelioMartPasswordReset] ❌ Missing environment ID:', {
				sharedEnvId:
					comprehensiveFlowDataService.loadSharedEnvironment()?.environmentId || '(empty)',
				stateEnvId: environmentId || '(empty)',
				effectiveEnvId: effectiveEnvironmentId || '(empty)',
			});
			v4ToastManager.showError('Environment ID is required. Please configure it first.');
			return;
		}

		setRecoverLoading(true);
		try {
			// First, lookup user by email
			const trimmedEmail = recoverEmail.trim();
			if (!trimmedEmail) {
				v4ToastManager.showError('Please enter an email address');
				setRecoverLoading(false);
				return;
			}
			const result = await lookupPingOneUser({
				environmentId: effectiveEnvironmentId,
				accessToken: effectiveWorkerToken,
				identifier: trimmedEmail,
			});

			if (!result.user) {
				v4ToastManager.showError('User not found with that email address');
				setRecoverLoading(false);
				return;
			}

			const userId = result.user.id as string;
			setRecoverUserId(userId);

			// Send recovery code to the user
			const sendResult = await sendRecoveryCode({
				environmentId,
				userId: userId as string,
				workerToken,
			});

			if (sendResult.success) {
				setRecoveryCodeSent(true);
				v4ToastManager.showSuccess(`Recovery code sent to ${recoverEmail}`);
			} else {
				v4ToastManager.showError(sendResult.errorDescription || 'Failed to send recovery code');
			}
		} catch (error) {
			v4ToastManager.showError(
				error instanceof Error ? error.message : 'Failed to send recovery code'
			);
		} finally {
			setRecoverLoading(false);
		}
	}, [recoverEmail, workerToken, environmentId, getEffectiveEnvironmentId]);

	// Recover password
	const handleRecoverPassword = useCallback(async () => {
		if (!recoverUserId || !recoveryCode || !newPassword || !workerToken || !environmentId) {
			v4ToastManager.showError('Please fill in all required fields');
			return;
		}

		setRecoverLoading(true);
		try {
			const result = await recoverPassword(
				environmentId,
				recoverUserId,
				workerToken,
				recoveryCode,
				newPassword
			);

			if (result.success) {
				setRecoverSuccess(true);
				v4ToastManager.showSuccess(
					'Password recovered successfully! You can now sign in with your new password.'
				);
				// Reset form
				setRecoveryCode('');
				setNewPassword('');
				setRecoverEmail('');
				setRecoveryCodeSent(false);
				setRecoverUserId('');
			} else {
				v4ToastManager.showError(result.errorDescription || 'Password recovery failed');
			}
		} catch (error) {
			v4ToastManager.showError(error instanceof Error ? error.message : 'Password recovery failed');
		} finally {
			setRecoverLoading(false);
		}
	}, [recoverUserId, recoveryCode, newPassword, workerToken, environmentId]);

	// Lookup user for force reset
	const handleForceResetLookup = useCallback(async () => {
		const effectiveWorkerToken = getAnyWorkerToken() || workerToken;
		const effectiveEnvironmentId = getEffectiveEnvironmentId();

		if (!forceResetIdentifier) {
			v4ToastManager.showError('Please enter a username or email address');
			return;
		}
		if (!effectiveWorkerToken || effectiveWorkerToken.trim() === '') {
			console.error('[HelioMartPasswordReset] ❌ Missing worker token:', {
				globalToken: getAnyWorkerToken() ? 'present' : 'missing',
				localToken: workerToken ? 'present' : 'missing',
			});
			v4ToastManager.showError('Worker token is required. Please generate a worker token first.');
			return;
		}
		if (!effectiveEnvironmentId || effectiveEnvironmentId.trim() === '') {
			console.error('[HelioMartPasswordReset] ❌ Missing environment ID:', {
				sharedEnvId:
					comprehensiveFlowDataService.loadSharedEnvironment()?.environmentId || '(empty)',
				stateEnvId: environmentId || '(empty)',
				effectiveEnvId: effectiveEnvironmentId || '(empty)',
			});
			v4ToastManager.showError('Environment ID is required. Please configure it first.');
			return;
		}

		try {
			const trimmedIdentifier = forceResetIdentifier.trim();
			if (!trimmedIdentifier) {
				v4ToastManager.showError('Please enter a username or email address');
				return;
			}
			const result = await lookupPingOneUser({
				environmentId: effectiveEnvironmentId,
				accessToken: effectiveWorkerToken,
				identifier: trimmedIdentifier,
			});

			if (result.user) {
				setForceResetUser(result.user);
				v4ToastManager.showSuccess('User found successfully');
			}
		} catch (error) {
			v4ToastManager.showError(error instanceof Error ? error.message : 'Failed to lookup user');
		}
	}, [forceResetIdentifier, workerToken, environmentId, getEffectiveEnvironmentId]);

	// Force password reset
	const handleForcePasswordReset = useCallback(async () => {
		if (!forceResetUser || !forceResetUser.id || !workerToken || !environmentId) {
			v4ToastManager.showError('User not found or credentials missing');
			return;
		}

		setForceResetLoading(true);
		try {
			const result = await forcePasswordChange(environmentId, forceResetUser.id, workerToken);

			if (result.success) {
				setForceResetSuccess(true);
				v4ToastManager.showSuccess('Password change forced successfully');
			} else {
				v4ToastManager.showError(result.errorDescription || 'Force password reset failed');
			}
		} catch (error) {
			v4ToastManager.showError(
				error instanceof Error ? error.message : 'Force password reset failed'
			);
		} finally {
			setForceResetLoading(false);
		}
	}, [forceResetUser, workerToken, environmentId]);

	// Change password (using authenticated user)
	const handleChangePassword = useCallback(async () => {
		if (
			!userId ||
			!oldPassword ||
			!changeNewPassword ||
			!confirmPassword ||
			!userAccessToken ||
			!environmentId
		) {
			v4ToastManager.showError('Please fill in all required fields');
			return;
		}

		if (changeNewPassword !== confirmPassword) {
			v4ToastManager.showError('New passwords do not match');
			return;
		}

		setChangePasswordLoading(true);
		try {
			const result = await changePassword(
				environmentId,
				userId,
				userAccessToken,
				oldPassword,
				changeNewPassword
			);

			if (result.success) {
				setChangePasswordSuccess(true);
				v4ToastManager.showSuccess('Password changed successfully!');
				// Reset form
				setOldPassword('');
				setChangeNewPassword('');
				setConfirmPassword('');
			} else {
				v4ToastManager.showError(result.errorDescription || 'Password change failed');
			}
		} catch (error) {
			v4ToastManager.showError(error instanceof Error ? error.message : 'Password change failed');
		} finally {
			setChangePasswordLoading(false);
		}
	}, [userId, oldPassword, changeNewPassword, confirmPassword, userAccessToken, environmentId]);

	// Lookup user for check password
	const handleCheckPasswordLookup = useCallback(async () => {
		const effectiveWorkerToken = getAnyWorkerToken() || workerToken;
		const effectiveEnvironmentId = getEffectiveEnvironmentId();

		if (!checkPasswordIdentifier) {
			v4ToastManager.showError('Please enter a username or email address');
			return;
		}
		if (!effectiveWorkerToken || effectiveWorkerToken.trim() === '') {
			console.error('[HelioMartPasswordReset] ❌ Missing worker token:', {
				globalToken: getAnyWorkerToken() ? 'present' : 'missing',
				localToken: workerToken ? 'present' : 'missing',
			});
			v4ToastManager.showError('Worker token is required. Please generate a worker token first.');
			return;
		}
		if (!effectiveEnvironmentId || effectiveEnvironmentId.trim() === '') {
			console.error('[HelioMartPasswordReset] ❌ Missing environment ID:', {
				sharedEnvId:
					comprehensiveFlowDataService.loadSharedEnvironment()?.environmentId || '(empty)',
				stateEnvId: environmentId || '(empty)',
				effectiveEnvId: effectiveEnvironmentId || '(empty)',
			});
			v4ToastManager.showError('Environment ID is required. Please configure it first.');
			return;
		}

		try {
			const trimmedIdentifier = checkPasswordIdentifier.trim();
			if (!trimmedIdentifier) {
				v4ToastManager.showError('Please enter a username or email address');
				return;
			}
			const result = await lookupPingOneUser({
				environmentId: effectiveEnvironmentId,
				accessToken: effectiveWorkerToken,
				identifier: trimmedIdentifier,
			});
			if (result.user) {
				setCheckPasswordUser(result.user);
				v4ToastManager.showSuccess('User found successfully');
			}
		} catch (error) {
			v4ToastManager.showError(error instanceof Error ? error.message : 'Failed to lookup user');
		}
	}, [checkPasswordIdentifier, workerToken, environmentId, getEffectiveEnvironmentId]);

	// Check password
	const handleCheckPassword = useCallback(async () => {
		if (!checkPasswordUser || !checkPasswordValue || !workerToken || !environmentId) {
			v4ToastManager.showError('Please fill in all required fields');
			return;
		}
		if (!checkPasswordUser?.id) {
			v4ToastManager.showError('User ID is required');
			return;
		}

		setCheckPasswordLoading(true);
		try {
			const result = await checkPassword(
				environmentId,
				checkPasswordUser.id,
				workerToken,
				checkPasswordValue
			);
			if (result.success) {
				setCheckPasswordResult({ valid: true, message: result.message || 'Password is valid' });
				v4ToastManager.showSuccess('Password check successful');
			} else {
				setCheckPasswordResult({
					valid: false,
					message: result.errorDescription || 'Password check failed',
				});
				v4ToastManager.showError(result.errorDescription || 'Password check failed');
			}
		} catch (error) {
			v4ToastManager.showError(error instanceof Error ? error.message : 'Password check failed');
		} finally {
			setCheckPasswordLoading(false);
		}
	}, [checkPasswordUser, checkPasswordValue, workerToken, environmentId]);

	// Lookup user for unlock
	const handleUnlockLookup = useCallback(async () => {
		const effectiveWorkerToken = getAnyWorkerToken() || workerToken;
		const effectiveEnvironmentId = getEffectiveEnvironmentId();

		if (!unlockIdentifier) {
			v4ToastManager.showError('Please enter a username or email address');
			return;
		}
		if (!effectiveWorkerToken || effectiveWorkerToken.trim() === '') {
			console.error('[HelioMartPasswordReset] ❌ Missing worker token:', {
				globalToken: getAnyWorkerToken() ? 'present' : 'missing',
				localToken: workerToken ? 'present' : 'missing',
			});
			v4ToastManager.showError('Worker token is required. Please generate a worker token first.');
			return;
		}
		if (!effectiveEnvironmentId || effectiveEnvironmentId.trim() === '') {
			console.error('[HelioMartPasswordReset] ❌ Missing environment ID:', {
				sharedEnvId:
					comprehensiveFlowDataService.loadSharedEnvironment()?.environmentId || '(empty)',
				stateEnvId: environmentId || '(empty)',
				effectiveEnvId: effectiveEnvironmentId || '(empty)',
			});
			v4ToastManager.showError('Environment ID is required. Please configure it first.');
			return;
		}

		try {
			const trimmedIdentifier = unlockIdentifier.trim();
			if (!trimmedIdentifier) {
				v4ToastManager.showError('Please enter a username or email address');
				return;
			}
			const result = await lookupPingOneUser({
				environmentId: effectiveEnvironmentId,
				accessToken: effectiveWorkerToken,
				identifier: trimmedIdentifier,
			});
			if (result.user) {
				setUnlockUser(result.user);
				v4ToastManager.showSuccess('User found successfully');
			}
		} catch (error) {
			v4ToastManager.showError(error instanceof Error ? error.message : 'Failed to lookup user');
		}
	}, [unlockIdentifier, workerToken, environmentId, getEffectiveEnvironmentId]);

	// Unlock password
	const handleUnlockPassword = useCallback(async () => {
		if (!unlockUser || !unlockUser.id || !workerToken || !environmentId) {
			v4ToastManager.showError('User not found or credentials missing');
			return;
		}
		setUnlockLoading(true);
		try {
			const result = await unlockPassword(environmentId, unlockUser.id, workerToken);
			if (result.success) {
				setUnlockSuccess(true);
				v4ToastManager.showSuccess('Password unlocked successfully');
			} else {
				v4ToastManager.showError(result.errorDescription || 'Password unlock failed');
			}
		} catch (error) {
			v4ToastManager.showError(error instanceof Error ? error.message : 'Password unlock failed');
		} finally {
			setUnlockLoading(false);
		}
	}, [unlockUser, workerToken, environmentId]);

	// Lookup user for read state
	const handleStateLookup = useCallback(async () => {
		const effectiveWorkerToken = getAnyWorkerToken() || workerToken;
		const effectiveEnvironmentId = getEffectiveEnvironmentId();

		if (!stateIdentifier) {
			v4ToastManager.showError('Please enter a username or email address');
			return;
		}
		if (!effectiveWorkerToken || effectiveWorkerToken.trim() === '') {
			console.error('[HelioMartPasswordReset] ❌ Missing worker token:', {
				globalToken: getAnyWorkerToken() ? 'present' : 'missing',
				localToken: workerToken ? 'present' : 'missing',
			});
			v4ToastManager.showError('Worker token is required. Please generate a worker token first.');
			return;
		}
		if (!effectiveEnvironmentId || effectiveEnvironmentId.trim() === '') {
			console.error('[HelioMartPasswordReset] ❌ Missing environment ID:', {
				sharedEnvId:
					comprehensiveFlowDataService.loadSharedEnvironment()?.environmentId || '(empty)',
				stateEnvId: environmentId || '(empty)',
				effectiveEnvId: effectiveEnvironmentId || '(empty)',
			});
			v4ToastManager.showError('Environment ID is required. Please configure it first.');
			return;
		}

		try {
			const trimmedIdentifier = stateIdentifier.trim();
			if (!trimmedIdentifier) {
				v4ToastManager.showError('Please enter a username or email address');
				return;
			}
			const result = await lookupPingOneUser({
				environmentId: effectiveEnvironmentId,
				accessToken: effectiveWorkerToken,
				identifier: trimmedIdentifier,
			});
			if (result.user) {
				setStateUser(result.user);
				v4ToastManager.showSuccess('User found successfully');
			}
		} catch (error) {
			v4ToastManager.showError(error instanceof Error ? error.message : 'Failed to lookup user');
		}
	}, [stateIdentifier, workerToken, environmentId, getEffectiveEnvironmentId]);

	// Read password state
	const handleReadPasswordState = useCallback(async () => {
		if (!stateUser || !stateUser.id || !workerToken || !environmentId) {
			v4ToastManager.showError('User not found or credentials missing');
			return;
		}
		setStateLoading(true);
		try {
			const result = await readPasswordState(environmentId, stateUser.id, workerToken);
			if (result.success && result.passwordState) {
				setPasswordState(result.passwordState as PasswordState);
				v4ToastManager.showSuccess('Password state read successfully');
			} else {
				v4ToastManager.showError(result.errorDescription || 'Failed to read password state');
			}
		} catch (error) {
			v4ToastManager.showError(
				error instanceof Error ? error.message : 'Failed to read password state'
			);
		} finally {
			setStateLoading(false);
		}
	}, [stateUser, workerToken, environmentId]);

	// Lookup user for admin set
	const handleAdminSetLookup = useCallback(async () => {
		const effectiveWorkerToken = getAnyWorkerToken() || workerToken;
		const effectiveEnvironmentId = getEffectiveEnvironmentId();

		if (!adminSetIdentifier) {
			v4ToastManager.showError('Please enter a username or email address');
			return;
		}
		if (!effectiveWorkerToken || effectiveWorkerToken.trim() === '') {
			console.error('[HelioMartPasswordReset] ❌ Missing worker token:', {
				globalToken: getAnyWorkerToken() ? 'present' : 'missing',
				localToken: workerToken ? 'present' : 'missing',
			});
			v4ToastManager.showError('Worker token is required. Please generate a worker token first.');
			return;
		}
		if (!effectiveEnvironmentId || effectiveEnvironmentId.trim() === '') {
			console.error('[HelioMartPasswordReset] ❌ Missing environment ID:', {
				sharedEnvId:
					comprehensiveFlowDataService.loadSharedEnvironment()?.environmentId || '(empty)',
				stateEnvId: environmentId || '(empty)',
				effectiveEnvId: effectiveEnvironmentId || '(empty)',
			});
			v4ToastManager.showError('Environment ID is required. Please configure it first.');
			return;
		}

		try {
			const trimmedIdentifier = adminSetIdentifier.trim();
			if (!trimmedIdentifier) {
				v4ToastManager.showError('Please enter a username or email address');
				return;
			}
			const result = await lookupPingOneUser({
				environmentId: effectiveEnvironmentId,
				accessToken: effectiveWorkerToken,
				identifier: trimmedIdentifier,
			});
			if (result.user) {
				setAdminSetUser(result.user);
				v4ToastManager.showSuccess('User found successfully');
			}
		} catch (error) {
			v4ToastManager.showError(error instanceof Error ? error.message : 'Failed to lookup user');
		}
	}, [adminSetIdentifier, workerToken, environmentId, getEffectiveEnvironmentId]);

	// Admin set password
	const handleAdminSetPassword = useCallback(async () => {
		if (!adminSetUser || !adminSetUser.id || !adminSetPassword || !workerToken || !environmentId) {
			v4ToastManager.showError('Please fill in all required fields');
			return;
		}
		setAdminSetLoading(true);
		try {
			const result = await setPasswordAdmin(
				environmentId,
				adminSetUser.id,
				workerToken,
				adminSetPassword,
				{ forceChange: adminSetForceChange, bypassPasswordPolicy: adminSetBypassPolicy }
			);
			if (result.success) {
				setAdminSetSuccess(true);
				const message = adminSetForceChange
					? 'Password set successfully! User will be required to change password on next sign-on.'
					: 'Password set successfully!';
				v4ToastManager.showSuccess(message);
				setAdminSetPassword('');
			} else {
				v4ToastManager.showError(result.errorDescription || 'Password set failed');
			}
		} catch (error) {
			v4ToastManager.showError(error instanceof Error ? error.message : 'Password set failed');
		} finally {
			setAdminSetLoading(false);
		}
	}, [
		adminSetUser,
		adminSetPassword,
		adminSetForceChange,
		adminSetBypassPolicy,
		workerToken,
		environmentId,
	]);

	// Lookup user for set password
	const handleSetPasswordLookup = useCallback(async () => {
		const effectiveWorkerToken = getAnyWorkerToken() || workerToken;
		const effectiveEnvironmentId = getEffectiveEnvironmentId();

		if (!setPasswordIdentifier) {
			v4ToastManager.showError('Please enter a username or email address');
			return;
		}
		if (!effectiveWorkerToken || effectiveWorkerToken.trim() === '') {
			console.error('[HelioMartPasswordReset] ❌ Missing worker token:', {
				globalToken: getAnyWorkerToken() ? 'present' : 'missing',
				localToken: workerToken ? 'present' : 'missing',
			});
			v4ToastManager.showError('Worker token is required. Please generate a worker token first.');
			return;
		}
		if (!effectiveEnvironmentId || effectiveEnvironmentId.trim() === '') {
			console.error('[HelioMartPasswordReset] ❌ Missing environment ID:', {
				sharedEnvId:
					comprehensiveFlowDataService.loadSharedEnvironment()?.environmentId || '(empty)',
				stateEnvId: environmentId || '(empty)',
				effectiveEnvId: effectiveEnvironmentId || '(empty)',
			});
			v4ToastManager.showError('Environment ID is required. Please configure it first.');
			return;
		}

		try {
			const trimmedIdentifier = setPasswordIdentifier.trim();
			if (!trimmedIdentifier) {
				v4ToastManager.showError('Please enter a username or email address');
				return;
			}
			const result = await lookupPingOneUser({
				environmentId: effectiveEnvironmentId,
				accessToken: effectiveWorkerToken,
				identifier: trimmedIdentifier,
			});
			if (result.user) {
				setSetPasswordUser(result.user);
				v4ToastManager.showSuccess('User found successfully');
			}
		} catch (error) {
			v4ToastManager.showError(error instanceof Error ? error.message : 'Failed to lookup user');
		}
	}, [setPasswordIdentifier, workerToken, environmentId, getEffectiveEnvironmentId]);

	// Set password
	const handleSetPassword = useCallback(async () => {
		if (
			!setPasswordUser ||
			!setPasswordUser.id ||
			!setPasswordValue ||
			!workerToken ||
			!environmentId
		) {
			v4ToastManager.showError('Please fill in all required fields');
			return;
		}
		setSetPasswordLoading(true);
		try {
			const result = await setPassword(
				environmentId,
				setPasswordUser.id,
				workerToken,
				setPasswordValue,
				{ forceChange: setPasswordForceChange, bypassPasswordPolicy: setPasswordBypassPolicy }
			);
			if (result.success) {
				setSetPasswordSuccess(true);
				const message = setPasswordForceChange
					? 'Password set successfully! User will be required to change password on next sign-on.'
					: 'Password set successfully!';
				v4ToastManager.showSuccess(message);
				setSetPasswordValue('');
			} else {
				v4ToastManager.showError(result.errorDescription || 'Password set failed');
			}
		} catch (error) {
			v4ToastManager.showError(error instanceof Error ? error.message : 'Password set failed');
		} finally {
			setSetPasswordLoading(false);
		}
	}, [
		setPasswordUser,
		setPasswordValue,
		setPasswordForceChange,
		setPasswordBypassPolicy,
		workerToken,
		environmentId,
	]);

	// Lookup user for LDAP Gateway
	const handleLdapLookup = useCallback(async () => {
		const effectiveWorkerToken = getAnyWorkerToken() || workerToken;
		const effectiveEnvironmentId = getEffectiveEnvironmentId();

		if (!ldapIdentifier) {
			v4ToastManager.showError('Please enter a username or email address');
			return;
		}
		if (!effectiveWorkerToken || effectiveWorkerToken.trim() === '') {
			console.error('[HelioMartPasswordReset] ❌ Missing worker token:', {
				globalToken: getAnyWorkerToken() ? 'present' : 'missing',
				localToken: workerToken ? 'present' : 'missing',
			});
			v4ToastManager.showError('Worker token is required. Please generate a worker token first.');
			return;
		}
		if (!effectiveEnvironmentId || effectiveEnvironmentId.trim() === '') {
			console.error('[HelioMartPasswordReset] ❌ Missing environment ID:', {
				sharedEnvId:
					comprehensiveFlowDataService.loadSharedEnvironment()?.environmentId || '(empty)',
				stateEnvId: environmentId || '(empty)',
				effectiveEnvId: effectiveEnvironmentId || '(empty)',
			});
			v4ToastManager.showError('Environment ID is required. Please configure it first.');
			return;
		}

		try {
			const trimmedIdentifier = ldapIdentifier.trim();
			if (!trimmedIdentifier) {
				v4ToastManager.showError('Please enter a username or email address');
				return;
			}
			const result = await lookupPingOneUser({
				environmentId: effectiveEnvironmentId,
				accessToken: effectiveWorkerToken,
				identifier: trimmedIdentifier,
			});
			if (result.user) {
				setLdapUser(result.user);
				v4ToastManager.showSuccess('User found successfully');
			}
		} catch (error) {
			v4ToastManager.showError(error instanceof Error ? error.message : 'Failed to lookup user');
		}
	}, [ldapIdentifier, workerToken, environmentId, getEffectiveEnvironmentId]);

	// Set password via LDAP Gateway
	const handleSetPasswordLdap = useCallback(async () => {
		if (!ldapUser || !ldapUser.id || !ldapPassword || !workerToken || !environmentId) {
			v4ToastManager.showError('Please fill in all required fields');
			return;
		}
		setLdapLoading(true);
		try {
			const result = await setPasswordLdapGateway(
				environmentId,
				ldapUser.id,
				workerToken,
				ldapPassword,
				ldapGatewayId || undefined,
				{ forceChange: ldapForceChange, bypassPasswordPolicy: ldapBypassPolicy }
			);
			if (result.success) {
				setLdapSuccess(true);
				const message = ldapForceChange
					? 'Password set successfully via LDAP Gateway! User will be required to change password on next sign-on.'
					: 'Password set successfully via LDAP Gateway!';
				v4ToastManager.showSuccess(message);
				setLdapPassword('');
			} else {
				v4ToastManager.showError(result.errorDescription || 'LDAP Gateway password set failed');
			}
		} catch (error) {
			v4ToastManager.showError(
				error instanceof Error ? error.message : 'LDAP Gateway password set failed'
			);
		} finally {
			setLdapLoading(false);
		}
	}, [
		ldapUser,
		ldapPassword,
		ldapGatewayId,
		ldapForceChange,
		ldapBypassPolicy,
		workerToken,
		environmentId,
	]);

	// Generate JavaScript code for password recovery
	const generateRecoverPasswordCode = useCallback(() => {
		const code = `/**
 * PingOne Password Recovery - Self-Service Password Reset
 * 
 * This example demonstrates how to implement password recovery using PingOne Platform API.
 * Users can request a recovery code via email/SMS and reset their password.
 */

// Configuration - Replace these with your actual values
const config = {
  environmentId: process.env.PINGONE_ENVIRONMENT_ID || 'YOUR_ENVIRONMENT_ID',
  apiBaseUrl: 'https://api.pingone.com/v1',
  workerToken: process.env.PINGONE_WORKER_TOKEN || 'YOUR_WORKER_TOKEN' // Get from PingOne Worker application
};

/**
 * Step 1: Send Recovery Code
 * Triggers PingOne to send a recovery code to the user via email/SMS
 */
async function sendRecoveryCode(userId) {
  const url = \`\${config.apiBaseUrl}/environments/\${config.environmentId}/users/\${userId}/password/recovery\`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${config.workerToken}\`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(\`Failed to send recovery code: \${error.error_description || error.message}\`);
  }

  // Success - recovery code sent to user
  console.log('Recovery code sent successfully');
  return { success: true };
}

/**
 * Step 2: Recover Password with Recovery Code
 * User enters the recovery code they received and sets a new password
 */
async function recoverPassword(userId, recoveryCode, newPassword) {
  const url = \`\${config.apiBaseUrl}/environments/\${config.environmentId}/users/\${userId}/password\`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${config.workerToken}\`,
      'Content-Type': 'application/vnd.pingidentity.password.recover+json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      recoveryCode: recoveryCode,
      newPassword: newPassword
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(\`Password recovery failed: \${error.error_description || error.message}\`);
  }

  const data = await response.json();
  console.log('Password recovered successfully:', data);
  return { success: true, transactionId: data.id };
}

// Example usage
async function handlePasswordRecovery(userId, recoveryCode, newPassword) {
  try {
    // Step 1: Send recovery code (usually done when user clicks "Forgot Password")
    await sendRecoveryCode(userId);
    console.log('Recovery code sent to user');
    
    // Step 2: User enters recovery code and new password
    // This would typically be in a separate form/step
    const result = await recoverPassword(userId, recoveryCode, newPassword);
    console.log('Password recovered:', result);
    
    return result;
  } catch (error) {
    console.error('Password recovery error:', error);
    throw error;
  }
}

// Export for use in your application
export { sendRecoveryCode, recoverPassword, handlePasswordRecovery };`;
		return code;
	}, []);

	// Generate JavaScript code for force password change
	const generateForcePasswordChangeCode = useCallback(() => {
		const code = `/**
 * PingOne Force Password Change - Admin Operation
 * 
 * This example demonstrates how to force a user to change their password
 * on their next sign-on. This is typically used by help desk or admin operations.
 */

// Configuration - Replace these with your actual values
const config = {
  environmentId: process.env.PINGONE_ENVIRONMENT_ID || 'YOUR_ENVIRONMENT_ID',
  apiBaseUrl: 'https://api.pingone.com/v1',
  workerToken: process.env.PINGONE_WORKER_TOKEN || 'YOUR_WORKER_TOKEN' // Get from PingOne Worker application
};

/**
 * Force Password Change on Next Sign-On
 * Requires the user to change their password the next time they sign in
 */
async function forcePasswordChange(userId) {
  const url = \`\${config.apiBaseUrl}/environments/\${config.environmentId}/users/\${userId}/password\`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${config.workerToken}\`,
      'Content-Type': 'application/vnd.pingidentity.password.forceChange+json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      forceChange: true
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(\`Force password change failed: \${error.error_description || error.message}\`);
  }

  const data = await response.json();
  console.log('Password change forced successfully:', data);
  return { 
    success: true, 
    transactionId: data.id,
    message: 'User will be required to change password on next sign-on'
  };
}

// Example usage
async function handleForcePasswordChange(userId) {
  try {
    const result = await forcePasswordChange(userId);
    console.log('Password change forced:', result);
    return result;
  } catch (error) {
    console.error('Force password change error:', error);
    throw error;
  }
}

// Export for use in your application
export { forcePasswordChange, handleForcePasswordChange };`;
		return code;
	}, []);

	// Generate JavaScript code for change password
	const generateChangePasswordCode = useCallback(() => {
		const code = `/**
 * PingOne Change Password - Authenticated User Operation
 * 
 * This example demonstrates how an authenticated user can change their password
 * when they know their current password.
 */

// Configuration - Replace these with your actual values
const config = {
  environmentId: process.env.PINGONE_ENVIRONMENT_ID || 'YOUR_ENVIRONMENT_ID',
  apiBaseUrl: 'https://api.pingone.com/v1'
};

/**
 * Change Password
 * Allows an authenticated user to change their password
 * 
 * @param {string} userId - The user's ID
 * @param {string} accessToken - User's access token (obtained from OAuth flow)
 * @param {string} oldPassword - Current password
 * @param {string} newPassword - New password
 */
async function changePassword(userId, accessToken, oldPassword, newPassword) {
  const url = \`\${config.apiBaseUrl}/environments/\${config.environmentId}/users/\${userId}/password\`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${accessToken}\`,
      'Content-Type': 'application/vnd.pingidentity.password.change+json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      oldPassword: oldPassword,
      newPassword: newPassword
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(\`Password change failed: \${error.error_description || error.message}\`);
  }

  const data = await response.json();
  console.log('Password changed successfully:', data);
  return { 
    success: true, 
    transactionId: data.id,
    message: 'Password changed successfully'
  };
}

// Example usage
async function handleChangePassword(userId, accessToken, oldPassword, newPassword) {
  try {
    // Validate passwords match (should be done in UI)
    if (newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    const result = await changePassword(userId, accessToken, oldPassword, newPassword);
    console.log('Password changed:', result);
    return result;
  } catch (error) {
    console.error('Change password error:', error);
    throw error;
  }
}

// Export for use in your application
export { changePassword, handleChangePassword };`;
		return code;
	}, []);

	// Copy code to clipboard
	const handleCopyCode = useCallback(async (code: string) => {
		try {
			await navigator.clipboard.writeText(code);
			setCopied(true);
			v4ToastManager.showSuccess('Code copied to clipboard!');
			setTimeout(() => setCopied(false), 2000);
		} catch (error) {
			console.error('Failed to copy code:', error);
			v4ToastManager.showError('Failed to copy code to clipboard');
		}
	}, []);

	// Generate code based on active tab
	const handleGenerateCode = useCallback(() => {
		let code = '';
		switch (activeTab) {
			case 'recover':
				code = generateRecoverPasswordCode();
				break;
			case 'force-reset':
				code = generateForcePasswordChangeCode();
				break;
			case 'change':
				code = generateChangePasswordCode();
				break;
			default:
				code = generateRecoverPasswordCode();
		}
		setGeneratedCode(code);
		setShowCodeGenerator(true);
		setIsCodeExpanded(true);
	}, [
		activeTab,
		generateRecoverPasswordCode,
		generateForcePasswordChangeCode,
		generateChangePasswordCode,
	]);

	// Highlight code with Prism.js when code changes
	useEffect(() => {
		if (generatedCode && showCodeGenerator) {
			// Use setTimeout to ensure DOM is updated before highlighting
			setTimeout(() => {
				Prism.highlightAll();
			}, 0);
		}
	}, [generatedCode, showCodeGenerator]);

	// Highlight JSON when password state changes
	useEffect(() => {
		if (passwordState) {
			setTimeout(() => {
				Prism.highlightAll();
			}, 0);
		}
	}, [passwordState]);

	const { PageHeader, PageContainer, ContentWrapper } = PageLayoutService.createPageLayout({
		flowType: 'pingone',
		theme: 'red',
		showHeader: true,
		showFooter: false,
		responsive: true,
	});

	return (
		<PageContainer>
			<ContentWrapper>
				{PageHeader && (
					<PageHeader>
						<h1>Password Reset (PingOne)</h1>
						<p>Manage user passwords with PingOne Platform API</p>
					</PageHeader>
				)}

				{(() => {
					const currentToken = getAnyWorkerToken() || workerToken;
					return currentToken ? (
						<WorkerTokenDetectedBanner
							token={currentToken}
							tokenExpiryKey="worker_token_expires_at"
						/>
					) : null;
				})()}

				{userInfo && (
					<Card style={{ marginBottom: '2rem', background: '#6B7280', color: 'white' }}>
						<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
							<div>
								<h2 style={{ margin: 0, color: 'white' }}>
									Welcome, {getUserNameDisplay(userInfo)}!
								</h2>
								<p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>{userInfo.email}</p>
							</div>
							<Button
								$variant="secondary"
								onClick={() => {
									setUserAccessToken('');
									setUserId('');
									setUserInfo(null);
									setLoginUsername('');
									setLoginPassword('');
								}}
							>
								<FiLogIn />
								Sign Out
							</Button>
						</div>
					</Card>
				)}

				<StatusBar>
					<StatusItem>
						<FiKey />
						<span>
							Environment:{' '}
							{environmentId ? `${environmentId.substring(0, 8)}...` : 'Not configured'}
						</span>
					</StatusItem>
					<StatusItem>
						{(() => {
							const currentToken = getAnyWorkerToken() || workerToken;
							return currentToken ? (
								<>
									<FiCheckCircle style={{ color: '#22C55E' }} />
									<span>Worker Token: Valid</span>
								</>
							) : (
								<>
									<FiAlertCircle style={{ color: '#F59E0B' }} />
									<span>Worker Token: Not configured</span>
								</>
							);
						})()}
					</StatusItem>
					<StatusItem>
						{authzCredentials.environmentId &&
						authzCredentials.clientId &&
						authzCredentials.clientSecret ? (
							<>
								<FiCheckCircle style={{ color: '#22C55E' }} />
								<span>Auth Code Client: Configured</span>
							</>
						) : (
							<>
								<FiAlertCircle style={{ color: '#F59E0B' }} />
								<span>Auth Code Client: Not configured</span>
							</>
						)}
					</StatusItem>
					<div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
						{/* App Lookup Button */}
						{environmentId && (
							<CompactAppPickerV8U
								environmentId={environmentId}
								onAppSelected={(app) => {
									setSelectedApp(app);
									// App selected - user can manually configure clientId
									console.log('Selected app:', app.name);
								}}
							/>
						)}
						
						{/* Worker Token Button */}
						{renderWorkerTokenButton(
							workerToken,
							workerTokenExpiresAt,
							() => setShowWorkerTokenModal(true),
							'Get Worker Token',
							'Worker Token Ready',
							'Refresh Worker Token'
						)}
						
						{/* Auth Code Client Button */}
						<Button
							$variant={
								authzCredentials.environmentId &&
								authzCredentials.clientId &&
								authzCredentials.clientSecret
									? 'success'
									: 'danger'
							}
							onClick={() => setShowAuthzConfigModal(true)}
						>
							<FiKey />
							Configure Auth Code Client
						</Button>
					</div>
				</StatusBar>

				<TabContainer>
					<Tab $active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>
						Overview
					</Tab>
					<Tab $active={activeTab === 'recover'} onClick={() => setActiveTab('recover')}>
						Recover
					</Tab>
					<Tab $active={activeTab === 'force-reset'} onClick={() => setActiveTab('force-reset')}>
						Force Reset
					</Tab>
					<Tab $active={activeTab === 'change'} onClick={() => setActiveTab('change')}>
						Change
					</Tab>
					<Tab $active={activeTab === 'check'} onClick={() => setActiveTab('check')}>
						Check
					</Tab>
					<Tab $active={activeTab === 'unlock'} onClick={() => setActiveTab('unlock')}>
						Unlock
					</Tab>
					<Tab $active={activeTab === 'state'} onClick={() => setActiveTab('state')}>
						Read State
					</Tab>
					<Tab $active={activeTab === 'admin-set'} onClick={() => setActiveTab('admin-set')}>
						Admin Set
					</Tab>
					<Tab $active={activeTab === 'set'} onClick={() => setActiveTab('set')}>
						Set
					</Tab>
					<Tab $active={activeTab === 'set-value'} onClick={() => setActiveTab('set-value')}>
						Set Value
					</Tab>
					<Tab $active={activeTab === 'ldap-gateway'} onClick={() => setActiveTab('ldap-gateway')}>
						LDAP Gateway
					</Tab>
				</TabContainer>

				{activeTab === 'overview' && (
					<Card>
						<h2 style={{ marginBottom: '1rem', fontSize: '1.5rem', color: '#1F2937' }}>
							Password Operations Overview
						</h2>
						<p style={{ color: '#6B7280', marginBottom: '2rem', lineHeight: '1.6' }}>
							This page demonstrates all PingOne password operations. Each operation uses different{' '}
							<strong>Content-Type headers</strong> to specify the action. Choose an operation from
							the tabs above to see details and try it out.
						</p>

						<Alert $type="info" style={{ marginBottom: '2rem' }}>
							<FiAlertCircle />
							<div>
								<strong>Important: Content-Type Headers</strong>
								<p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
									Each password operation requires a specific <code>Content-Type</code> header
									(e.g., <code>application/vnd.pingidentity.password.recover+json</code>). The
									Content-Type determines which operation PingOne performs. Always check the API
									documentation for the correct header.
								</p>
							</div>
						</Alert>

						<div style={{ display: 'grid', gap: '1.5rem' }}>
							<div>
								<h3 style={{ marginBottom: '0.5rem', color: HELIOMART_ACCENT_START }}>
									🔐 Recover Password
								</h3>
								<p style={{ color: '#6B7280', lineHeight: '1.6', marginBottom: '0.5rem' }}>
									<strong>Requires:</strong> Recovery code (sent via email/SMS) + New password
								</p>
								<p style={{ color: '#6B7280', lineHeight: '1.6', marginBottom: '0.5rem' }}>
									<strong>Content-Type:</strong>{' '}
									<code
										style={{
											background: '#F3F4F6',
											padding: '0.25rem 0.5rem',
											borderRadius: '0.25rem',
											fontSize: '0.875rem',
										}}
									>
										application/vnd.pingidentity.password.recover+json
									</code>
								</p>
								<p style={{ color: '#6B7280', lineHeight: '1.6' }}>
									For users who have forgotten their password. They request a recovery code via
									email/SMS, then use the code to reset their password.
								</p>
								<DocumentationLink
									href="https://apidocs.pingidentity.com/pingone/platform/v1/api/#user-passwords"
									target="_blank"
									rel="noopener noreferrer"
								>
									<FiBook />
									View API Documentation
									<FiExternalLink size={14} />
								</DocumentationLink>
							</div>

							<div>
								<h3 style={{ marginBottom: '0.5rem', color: HELIOMART_ACCENT_START }}>
									🔒 Force Password Change
								</h3>
								<p style={{ color: '#6B7280', lineHeight: '1.6', marginBottom: '0.5rem' }}>
									<strong>Requires:</strong> Worker token (admin operation)
								</p>
								<p style={{ color: '#6B7280', lineHeight: '1.6', marginBottom: '0.5rem' }}>
									<strong>Content-Type:</strong>{' '}
									<code
										style={{
											background: '#F3F4F6',
											padding: '0.25rem 0.5rem',
											borderRadius: '0.25rem',
											fontSize: '0.875rem',
										}}
									>
										application/vnd.pingidentity.password.forceChange+json
									</code>
								</p>
								<p
									style={{
										color: '#DC2626',
										lineHeight: '1.6',
										fontWeight: 600,
										marginBottom: '0.5rem',
									}}
								>
									⚠️ <strong>Puts user in password change state</strong> - User must change password
									on next sign-on
								</p>
								<p style={{ color: '#6B7280', lineHeight: '1.6' }}>
									For help desk or admin operations. Forces a user to change their password on their
									next sign-on.
								</p>
								<DocumentationLink
									href="https://apidocs.pingidentity.com/pingone/platform/v1/api/#user-passwords"
									target="_blank"
									rel="noopener noreferrer"
								>
									<FiBook />
									View API Documentation
									<FiExternalLink size={14} />
								</DocumentationLink>
							</div>

							<div>
								<h3 style={{ marginBottom: '0.5rem', color: HELIOMART_ACCENT_START }}>
									✏️ Change Password
								</h3>
								<p style={{ color: '#6B7280', lineHeight: '1.6', marginBottom: '0.5rem' }}>
									<strong>Requires:</strong> User access token + Old password + New password
								</p>
								<p style={{ color: '#6B7280', lineHeight: '1.6', marginBottom: '0.5rem' }}>
									<strong>Content-Type:</strong>{' '}
									<code
										style={{
											background: '#F3F4F6',
											padding: '0.25rem 0.5rem',
											borderRadius: '0.25rem',
											fontSize: '0.875rem',
										}}
									>
										application/vnd.pingidentity.password.change+json
									</code>
								</p>
								<p style={{ color: '#6B7280', lineHeight: '1.6' }}>
									For authenticated users who know their current password and want to change it.
									Requires user's access token (not worker token).
								</p>
								<DocumentationLink
									href="https://apidocs.pingidentity.com/pingone/platform/v1/api/#user-passwords"
									target="_blank"
									rel="noopener noreferrer"
								>
									<FiBook />
									View API Documentation
									<FiExternalLink size={14} />
								</DocumentationLink>
							</div>

							<div>
								<h3 style={{ marginBottom: '0.5rem', color: HELIOMART_ACCENT_START }}>
									✅ Update Password (Set Value)
								</h3>
								<p style={{ color: '#6B7280', lineHeight: '1.6', marginBottom: '0.5rem' }}>
									<strong>Requires:</strong> Worker token + New password
								</p>
								<p style={{ color: '#6B7280', lineHeight: '1.6', marginBottom: '0.5rem' }}>
									<strong>Content-Type:</strong>{' '}
									<code
										style={{
											background: '#F3F4F6',
											padding: '0.25rem 0.5rem',
											borderRadius: '0.25rem',
											fontSize: '0.875rem',
										}}
									>
										application/vnd.pingidentity.password.setValue+json
									</code>
								</p>
								<p
									style={{
										color: '#22C55E',
										lineHeight: '1.6',
										fontWeight: 600,
										marginBottom: '0.5rem',
									}}
								>
									✅ <strong>Recommended for admin password resets</strong> - Sets password without
									recovery code and does NOT force password change state
								</p>
								<p style={{ color: '#6B7280', lineHeight: '1.6' }}>
									Admin operation to set a user's password directly. Does not require recovery code
									and does not put the user in a forced password change state.
								</p>
								<DocumentationLink
									href="https://apidocs.pingidentity.com/pingone/platform/v1/api/#user-passwords"
									target="_blank"
									rel="noopener noreferrer"
								>
									<FiBook />
									View API Documentation
									<FiExternalLink size={14} />
								</DocumentationLink>
							</div>

							<div>
								<h3 style={{ marginBottom: '0.5rem', color: HELIOMART_ACCENT_START }}>
									🔍 Check Password
								</h3>
								<p style={{ color: '#6B7280', lineHeight: '1.6', marginBottom: '0.5rem' }}>
									<strong>Requires:</strong> Worker token + Password to verify
								</p>
								<p style={{ color: '#6B7280', lineHeight: '1.6', marginBottom: '0.5rem' }}>
									<strong>Content-Type:</strong>{' '}
									<code
										style={{
											background: '#F3F4F6',
											padding: '0.25rem 0.5rem',
											borderRadius: '0.25rem',
											fontSize: '0.875rem',
										}}
									>
										application/vnd.pingidentity.password.check+json
									</code>
								</p>
								<p style={{ color: '#6B7280', lineHeight: '1.6' }}>
									Verify if a provided password matches the user's current password. Useful for
									validation before allowing password changes.
								</p>
								<DocumentationLink
									href="https://apidocs.pingidentity.com/pingone/platform/v1/api/#user-passwords"
									target="_blank"
									rel="noopener noreferrer"
								>
									<FiBook />
									View API Documentation
									<FiExternalLink size={14} />
								</DocumentationLink>
							</div>

							<div>
								<h3 style={{ marginBottom: '0.5rem', color: HELIOMART_ACCENT_START }}>
									🔓 Unlock Password
								</h3>
								<p style={{ color: '#6B7280', lineHeight: '1.6', marginBottom: '0.5rem' }}>
									<strong>Requires:</strong> Worker token
								</p>
								<p style={{ color: '#6B7280', lineHeight: '1.6', marginBottom: '0.5rem' }}>
									<strong>Content-Type:</strong>{' '}
									<code
										style={{
											background: '#F3F4F6',
											padding: '0.25rem 0.5rem',
											borderRadius: '0.25rem',
											fontSize: '0.875rem',
										}}
									>
										application/json
									</code>
								</p>
								<p style={{ color: '#6B7280', lineHeight: '1.6' }}>
									Unlock a user's account that has been locked due to failed login attempts. Admin
									operation.
								</p>
								<DocumentationLink
									href="https://apidocs.pingidentity.com/pingone/platform/v1/api/#user-passwords"
									target="_blank"
									rel="noopener noreferrer"
								>
									<FiBook />
									View API Documentation
									<FiExternalLink size={14} />
								</DocumentationLink>
							</div>

							<div>
								<h3 style={{ marginBottom: '0.5rem', color: HELIOMART_ACCENT_START }}>
									📊 Read Password State
								</h3>
								<p style={{ color: '#6B7280', lineHeight: '1.6', marginBottom: '0.5rem' }}>
									<strong>Requires:</strong> Worker token
								</p>
								<p style={{ color: '#6B7280', lineHeight: '1.6', marginBottom: '0.5rem' }}>
									<strong>Method:</strong> GET (no special Content-Type)
								</p>
								<p style={{ color: '#6B7280', lineHeight: '1.6' }}>
									Retrieve the current password state information for a user, including lock status,
									expiration, and change requirements.
								</p>
								<DocumentationLink
									href="https://apidocs.pingidentity.com/pingone/platform/v1/api/#user-passwords"
									target="_blank"
									rel="noopener noreferrer"
								>
									<FiBook />
									View API Documentation
									<FiExternalLink size={14} />
								</DocumentationLink>
							</div>
						</div>
					</Card>
				)}

				{activeTab === 'recover' && (
					<Card>
						<h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', color: '#1F2937' }}>
							Self-Service Password Recovery
						</h2>

						<Alert $type="info" style={{ marginBottom: '1.5rem' }}>
							<FiAlertCircle />
							<div>
								<strong>How This Works:</strong>
								<p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
									<strong>Requires:</strong> Recovery code (sent via email/SMS) + New password
									<br />
									<strong>Content-Type Header:</strong>{' '}
									<code
										style={{
											background: '#F3F4F6',
											padding: '0.25rem 0.5rem',
											borderRadius: '0.25rem',
											fontSize: '0.875rem',
										}}
									>
										application/vnd.pingidentity.password.recover+json
									</code>
									<br />
									The Content-Type header tells PingOne this is a password recovery operation. User
									must first request a recovery code, then use it to reset their password.
								</p>
							</div>
						</Alert>

						<DocumentationSection>
							<DocumentationLink
								href="https://apidocs.pingidentity.com/pingone/platform/v1/api/#user-passwords"
								target="_blank"
								rel="noopener noreferrer"
							>
								<FiBook />
								PingOne API: Password Recovery (Content-Type:
								application/vnd.pingidentity.password.recover+json)
								<FiExternalLink size={14} />
							</DocumentationLink>
						</DocumentationSection>

						{recoverSuccess && (
							<SuccessMessage>
								<SuccessTitle>
									<FiCheckCircle style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
									Password Recovered Successfully!
								</SuccessTitle>
								<SuccessText>
									Your password has been updated. You can now sign in with your new password.
								</SuccessText>
							</SuccessMessage>
						)}

						{!recoveryCodeSent && (
							<>
								<Alert $type="info">
									<FiAlertCircle />
									<div>
										<strong>Forgot your password?</strong>
										<p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
											Enter your email address and we'll send you a recovery code to reset your
											password.
										</p>
									</div>
								</Alert>

								<FormGroup>
									<Label>Email Address</Label>
									<div style={{ display: 'flex', gap: '0.5rem' }}>
										<Input
											type="email"
											placeholder="Enter your email address"
											value={recoverEmail}
											onChange={(e) => setRecoverEmail(e.target.value)}
											onKeyPress={(e) => e.key === 'Enter' && handleSendRecoveryCode()}
										/>
										<Button
											onClick={handleSendRecoveryCode}
											disabled={recoverLoading || !recoverEmail}
										>
											{recoverLoading ? <SpinningIcon /> : <FiMail />}
											{recoverLoading ? 'Sending...' : 'Send Recovery Code'}
										</Button>
									</div>
								</FormGroup>
							</>
						)}

						{recoveryCodeSent && (
							<>
								<Alert $type="success">
									<FiCheckCircle />
									<div>
										<strong>Recovery code sent!</strong>
										<p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
											We've sent a recovery code to <strong>{recoverEmail}</strong>. Please check
											your email and enter the code below.
										</p>
									</div>
								</Alert>

								<FormGroup>
									<Label>Recovery Code</Label>
									<Input
										type="text"
										placeholder="Enter recovery code from email"
										value={recoveryCode}
										onChange={(e) => setRecoveryCode(e.target.value)}
										onKeyPress={(e) => e.key === 'Enter' && handleRecoverPassword()}
									/>
								</FormGroup>

								<FormGroup>
									<Label>New Password</Label>
									<div style={{ position: 'relative' }}>
										<Input
											type={showNewPassword ? 'text' : 'password'}
											placeholder="Enter new password"
											value={newPassword}
											onChange={(e) => setNewPassword(e.target.value)}
											style={{ paddingRight: '3rem' }}
										/>
										<button
											type="button"
											onClick={() => setShowNewPassword(!showNewPassword)}
											style={{
												position: 'absolute',
												right: '0.75rem',
												top: '50%',
												transform: 'translateY(-50%)',
												background: 'none',
												border: 'none',
												color: '#6B7280',
												cursor: 'pointer',
												padding: '0.25rem',
											}}
										>
											{showNewPassword ? <FiEyeOff /> : <FiEye />}
										</button>
									</div>
								</FormGroup>

								<Button
									onClick={handleRecoverPassword}
									disabled={recoverLoading || !recoveryCode || !newPassword}
								>
									{recoverLoading ? <SpinningIcon /> : <FiCheckCircle />}
									{recoverLoading ? 'Recovering...' : 'Recover Password'}
								</Button>

								<div style={{ marginTop: '1rem', textAlign: 'center' }}>
									<Button
										$variant="secondary"
										onClick={() => {
											setRecoveryCodeSent(false);
											setRecoveryCode('');
											setNewPassword('');
										}}
										style={{ fontSize: '0.875rem' }}
									>
										Use Different Email
									</Button>
								</div>
							</>
						)}

						<CodeGeneratorSection>
							<CodeHeader>
								<CodeTitle>
									<FiCode />
									JavaScript Code Generator
								</CodeTitle>
								<CodeActions>
									<CodeButton onClick={handleGenerateCode}>
										<FiCode />
										Generate Code
									</CodeButton>
								</CodeActions>
							</CodeHeader>
							{showCodeGenerator && generatedCode && (
								<>
									<CodeContainer $isExpanded={isCodeExpanded}>
										<CodeBlock>
											<code className="language-javascript">{generatedCode}</code>
										</CodeBlock>
									</CodeContainer>
									{!isCodeExpanded && (
										<CodeCollapseButton onClick={() => setIsCodeExpanded(true)}>
											<FiChevronDown />
											Show More
										</CodeCollapseButton>
									)}
									{isCodeExpanded && (
										<CodeCollapseButton onClick={() => setIsCodeExpanded(false)}>
											<FiChevronUp />
											Show Less
										</CodeCollapseButton>
									)}
									<CodeActions>
										<CodeButton onClick={() => handleCopyCode(generatedCode)}>
											<FiCopy />
											{copied ? 'Copied!' : 'Copy Code'}
										</CodeButton>
										<CodeButton onClick={() => setShowCodeGenerator(false)}>Hide Code</CodeButton>
									</CodeActions>
								</>
							)}
						</CodeGeneratorSection>
					</Card>
				)}

				{activeTab === 'force-reset' && (
					<Card>
						<h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', color: '#1F2937' }}>
							Admin Force Password Reset
						</h2>

						<Alert $type="error" style={{ marginBottom: '1.5rem', borderColor: '#DC2626' }}>
							<FiAlertCircle style={{ color: '#DC2626' }} />
							<div>
								<strong style={{ color: '#DC2626' }}>
									⚠️ Important: This Puts User in Password Change State
								</strong>
								<p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
									<strong>Requires:</strong> Worker token (admin operation)
									<br />
									<strong>Content-Type Header:</strong>{' '}
									<code
										style={{
											background: '#F3F4F6',
											padding: '0.25rem 0.5rem',
											borderRadius: '0.25rem',
											fontSize: '0.875rem',
										}}
									>
										application/vnd.pingidentity.password.forceChange+json
									</code>
									<br />
									<strong style={{ color: '#DC2626' }}>⚠️ WARNING:</strong> This operation will force
									the user to change their password on their next sign-on. If you just want to set a
									password without forcing a change, use{' '}
									<strong>"Update Password (Set Value)"</strong> instead.
								</p>
							</div>
						</Alert>

						<DocumentationSection>
							<DocumentationLink
								href="https://apidocs.pingidentity.com/pingone/platform/v1/api/#user-passwords"
								target="_blank"
								rel="noopener noreferrer"
							>
								<FiBook />
								PingOne API: Force Password Change (Content-Type:
								application/vnd.pingidentity.password.forceChange+json)
								<FiExternalLink size={14} />
							</DocumentationLink>
						</DocumentationSection>

						{forceResetSuccess && (
							<Alert $type="success">
								<FiCheckCircle />
								<div>
									<strong>Password change forced successfully!</strong>
									<p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
										User will be required to change password on next sign-on.
									</p>
								</div>
							</Alert>
						)}

						<FormGroup>
							<Label>Username or Email</Label>
							<div style={{ display: 'flex', gap: '0.5rem' }}>
								<Input
									type="text"
									placeholder="Enter username or email"
									value={forceResetIdentifier}
									onChange={(e) => setForceResetIdentifier(e.target.value)}
								/>
								<Button onClick={handleForceResetLookup}>
									<FiSearch />
									Lookup
								</Button>
							</div>
						</FormGroup>

						{forceResetUser && (
							<>
								<UserCard>
									<UserInfo>
										<UserAvatar>{getUserNameInitial(forceResetUser)}</UserAvatar>
										<div>
											<div style={{ fontWeight: 600 }}>{getUserNameDisplay(forceResetUser)}</div>
											<div style={{ fontSize: '0.875rem', color: '#6B7280' }}>
												{forceResetUser.email || forceResetUser.username}
											</div>
										</div>
									</UserInfo>
								</UserCard>

								<Alert $type="info">
									<FiAlertCircle />
									<div>
										<strong>Force Password Change</strong>
										<p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
											This will require the user to change their password the next time they sign
											in.
										</p>
									</div>
								</Alert>

								<Button
									$variant="danger"
									onClick={handleForcePasswordReset}
									disabled={forceResetLoading}
								>
									{forceResetLoading ? <SpinningIcon /> : <FiLock />}
									{forceResetLoading ? 'Processing...' : 'Force Password Change'}
								</Button>
							</>
						)}

						<CodeGeneratorSection>
							<CodeHeader>
								<CodeTitle>
									<FiCode />
									JavaScript Code Generator
								</CodeTitle>
								<CodeActions>
									<CodeButton onClick={handleGenerateCode}>
										<FiCode />
										Generate Code
									</CodeButton>
								</CodeActions>
							</CodeHeader>
							{showCodeGenerator && generatedCode && (
								<>
									<CodeContainer $isExpanded={isCodeExpanded}>
										<CodeBlock>
											<code className="language-javascript">{generatedCode}</code>
										</CodeBlock>
									</CodeContainer>
									{!isCodeExpanded && (
										<CodeCollapseButton onClick={() => setIsCodeExpanded(true)}>
											<FiChevronDown />
											Show More
										</CodeCollapseButton>
									)}
									{isCodeExpanded && (
										<CodeCollapseButton onClick={() => setIsCodeExpanded(false)}>
											<FiChevronUp />
											Show Less
										</CodeCollapseButton>
									)}
									<CodeActions>
										<CodeButton onClick={() => handleCopyCode(generatedCode)}>
											<FiCopy />
											{copied ? 'Copied!' : 'Copy Code'}
										</CodeButton>
										<CodeButton onClick={() => setShowCodeGenerator(false)}>Hide Code</CodeButton>
									</CodeActions>
								</>
							)}
						</CodeGeneratorSection>
					</Card>
				)}

				{activeTab === 'change' && (
					<Card>
						<h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', color: '#1F2937' }}>
							Change Password
						</h2>

						<Alert $type="info" style={{ marginBottom: '1.5rem' }}>
							<FiAlertCircle />
							<div>
								<strong>How This Works:</strong>
								<p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
									<strong>Requires:</strong> User access token (from OAuth login) + Old password +
									New password
									<br />
									<strong>Content-Type Header:</strong>{' '}
									<code
										style={{
											background: '#F3F4F6',
											padding: '0.25rem 0.5rem',
											borderRadius: '0.25rem',
											fontSize: '0.875rem',
										}}
									>
										application/vnd.pingidentity.password.change+json
									</code>
									<br />
									For authenticated users who know their current password. Requires the user's
									access token (obtained from OAuth login), not a worker token. The user must
									provide their current password to verify identity before changing to a new
									password.
								</p>
							</div>
						</Alert>

						{!userAccessToken && (
							<>
								<Alert $type="info">
									<FiAlertCircle />
									<div>
										<strong>Authentication Required</strong>
										<p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
											Please sign in first to change your password. This operation requires your
											user access token.
										</p>
									</div>
								</Alert>
								<div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
									<Button onClick={() => setShowLoginModal(true)}>
										<FiLogIn />
										Sign In to Change Password
									</Button>
								</div>
							</>
						)}

						{userInfo && (
							<UserCard style={{ marginBottom: '1.5rem' }}>
								<UserInfo>
									<UserAvatar>{getUserNameInitial(userInfo)}</UserAvatar>
									<div>
										<div style={{ fontWeight: 600, color: '#1F2937' }}>
											{getUserNameDisplay(userInfo)}
										</div>
										<div style={{ fontSize: '0.875rem', color: '#6B7280' }}>{userInfo.email}</div>
									</div>
								</UserInfo>
							</UserCard>
						)}

						<DocumentationSection>
							<DocumentationLink
								href="https://apidocs.pingidentity.com/pingone/platform/v1/api/#post-environments-environmentid-users-userid-password"
								target="_blank"
								rel="noopener noreferrer"
							>
								<FiBook />
								PingOne API: Change Password (Content-Type:
								application/vnd.pingidentity.password.change+json)
								<FiExternalLink size={14} />
							</DocumentationLink>
						</DocumentationSection>

						{changePasswordSuccess && (
							<SuccessMessage>
								<SuccessTitle>
									<FiCheckCircle style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
									Password Changed Successfully!
								</SuccessTitle>
								<SuccessText>
									Your password has been updated. You can now sign in with your new password.
								</SuccessText>
							</SuccessMessage>
						)}

						{userAccessToken && (
							<>
								<FormGroup>
									<Label>Current Password</Label>
									<div style={{ position: 'relative' }}>
										<Input
											type={showOldPassword ? 'text' : 'password'}
											placeholder="Enter your current password"
											value={oldPassword}
											onChange={(e) => setOldPassword(e.target.value)}
											style={{ paddingRight: '3rem' }}
										/>
										<button
											type="button"
											onClick={() => setShowOldPassword(!showOldPassword)}
											style={{
												position: 'absolute',
												right: '0.75rem',
												top: '50%',
												transform: 'translateY(-50%)',
												background: 'none',
												border: 'none',
												color: '#6B7280',
												cursor: 'pointer',
												padding: '0.25rem',
											}}
										>
											{showOldPassword ? <FiEyeOff /> : <FiEye />}
										</button>
									</div>
								</FormGroup>

								<FormGroup>
									<Label>New Password</Label>
									<div style={{ position: 'relative' }}>
										<Input
											type={showChangeNewPassword ? 'text' : 'password'}
											placeholder="Enter new password"
											value={changeNewPassword}
											onChange={(e) => setChangeNewPassword(e.target.value)}
											style={{ paddingRight: '3rem' }}
										/>
										<button
											type="button"
											onClick={() => setShowChangeNewPassword(!showChangeNewPassword)}
											style={{
												position: 'absolute',
												right: '0.75rem',
												top: '50%',
												transform: 'translateY(-50%)',
												background: 'none',
												border: 'none',
												color: '#6B7280',
												cursor: 'pointer',
												padding: '0.25rem',
											}}
										>
											{showChangeNewPassword ? <FiEyeOff /> : <FiEye />}
										</button>
									</div>
								</FormGroup>

								<FormGroup>
									<Label>Confirm New Password</Label>
									<Input
										type="password"
										placeholder="Confirm new password"
										value={confirmPassword}
										onChange={(e) => setConfirmPassword(e.target.value)}
									/>
								</FormGroup>

								<Button
									onClick={handleChangePassword}
									disabled={
										changePasswordLoading || !oldPassword || !changeNewPassword || !confirmPassword
									}
								>
									{changePasswordLoading ? <SpinningIcon /> : <FiCheckCircle />}
									{changePasswordLoading ? 'Changing...' : 'Change Password'}
								</Button>
							</>
						)}

						<CodeGeneratorSection>
							<CodeHeader>
								<CodeTitle>
									<FiCode />
									JavaScript Code Generator
								</CodeTitle>
								<CodeActions>
									<CodeButton onClick={handleGenerateCode}>
										<FiCode />
										Generate Code
									</CodeButton>
								</CodeActions>
							</CodeHeader>
							{showCodeGenerator && generatedCode && (
								<>
									<CodeContainer $isExpanded={isCodeExpanded}>
										<CodeBlock>
											<code className="language-javascript">{generatedCode}</code>
										</CodeBlock>
									</CodeContainer>
									{!isCodeExpanded && (
										<CodeCollapseButton onClick={() => setIsCodeExpanded(true)}>
											<FiChevronDown />
											Show More
										</CodeCollapseButton>
									)}
									{isCodeExpanded && (
										<CodeCollapseButton onClick={() => setIsCodeExpanded(false)}>
											<FiChevronUp />
											Show Less
										</CodeCollapseButton>
									)}
									<CodeActions>
										<CodeButton onClick={() => handleCopyCode(generatedCode)}>
											<FiCopy />
											{copied ? 'Copied!' : 'Copy Code'}
										</CodeButton>
										<CodeButton onClick={() => setShowCodeGenerator(false)}>Hide Code</CodeButton>
									</CodeActions>
								</>
							)}
						</CodeGeneratorSection>
					</Card>
				)}

				{activeTab === 'check' && (
					<Card>
						<h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', color: '#1F2937' }}>
							Check Password
						</h2>

						<Alert $type="info" style={{ marginBottom: '1.5rem' }}>
							<FiAlertCircle />
							<div>
								<strong>How This Works:</strong>
								<p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
									<strong>Requires:</strong> Worker token + Password to verify
									<br />
									<strong>Content-Type Header:</strong>{' '}
									<code
										style={{
											background: '#F3F4F6',
											padding: '0.25rem 0.5rem',
											borderRadius: '0.25rem',
											fontSize: '0.875rem',
										}}
									>
										application/vnd.pingidentity.password.check+json
									</code>
									<br />
									Verify if a provided password matches the user's current password. Useful for
									validation before allowing password changes.
								</p>
							</div>
						</Alert>

						<DocumentationSection>
							<DocumentationLink
								href="https://apidocs.pingidentity.com/pingone/platform/v1/api/#user-passwords"
								target="_blank"
								rel="noopener noreferrer"
							>
								<FiBook />
								PingOne API: Check Password (Content-Type:
								application/vnd.pingidentity.password.check+json)
								<FiExternalLink size={14} />
							</DocumentationLink>
						</DocumentationSection>

						<FormGroup>
							<Label>Username or Email</Label>
							<div style={{ display: 'flex', gap: '0.5rem' }}>
								<Input
									type="text"
									placeholder="Enter username or email"
									value={checkPasswordIdentifier}
									onChange={(e) => setCheckPasswordIdentifier(e.target.value)}
								/>
								<Button
									onClick={handleCheckPasswordLookup}
									disabled={checkPasswordLoading || !checkPasswordIdentifier}
								>
									{checkPasswordLoading ? <SpinningIcon /> : <FiSearch />}
									Lookup
								</Button>
							</div>
						</FormGroup>

						{checkPasswordUser && (
							<>
								<UserCard>
									<UserInfo>
										<UserAvatar>{getUserNameInitial(checkPasswordUser)}</UserAvatar>
										<div>
											<div style={{ fontWeight: 600 }}>{getUserNameDisplay(checkPasswordUser)}</div>
											<div style={{ fontSize: '0.875rem', color: '#6B7280' }}>
												{checkPasswordUser.email || checkPasswordUser.username}
											</div>
										</div>
									</UserInfo>
								</UserCard>

								<FormGroup>
									<Label>Password to Verify</Label>
									<div style={{ position: 'relative' }}>
										<Input
											type={showCheckPassword ? 'text' : 'password'}
											placeholder="Enter password to check"
											value={checkPasswordValue}
											onChange={(e) => setCheckPasswordValue(e.target.value)}
											style={{ paddingRight: '3rem' }}
										/>
										<button
											type="button"
											onClick={() => setShowCheckPassword(!showCheckPassword)}
											style={{
												position: 'absolute',
												right: '0.75rem',
												top: '50%',
												transform: 'translateY(-50%)',
												background: 'none',
												border: 'none',
												color: '#6B7280',
												cursor: 'pointer',
												padding: '0.25rem',
											}}
										>
											{showCheckPassword ? <FiEyeOff /> : <FiEye />}
										</button>
									</div>
								</FormGroup>

								{checkPasswordResult && (
									<Alert $type={checkPasswordResult.valid ? 'success' : 'error'}>
										{checkPasswordResult.valid ? <FiCheckCircle /> : <FiAlertCircle />}
										<div>
											<strong>
												{checkPasswordResult.valid ? 'Password is valid' : 'Password check failed'}
											</strong>
											{checkPasswordResult.message && (
												<p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
													{checkPasswordResult.message}
												</p>
											)}
										</div>
									</Alert>
								)}

								<Button
									onClick={handleCheckPassword}
									disabled={checkPasswordLoading || !checkPasswordValue}
								>
									{checkPasswordLoading ? <SpinningIcon /> : <FiKey />}
									{checkPasswordLoading ? 'Checking...' : 'Check Password'}
								</Button>
							</>
						)}
					</Card>
				)}

				{activeTab === 'unlock' && (
					<Card>
						<h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', color: '#1F2937' }}>
							Unlock Password
						</h2>

						<Alert $type="info" style={{ marginBottom: '1.5rem' }}>
							<FiAlertCircle />
							<div>
								<strong>How This Works:</strong>
								<p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
									<strong>Requires:</strong> Worker token (admin operation)
									<br />
									<strong>Content-Type Header:</strong>{' '}
									<code
										style={{
											background: '#F3F4F6',
											padding: '0.25rem 0.5rem',
											borderRadius: '0.25rem',
											fontSize: '0.875rem',
										}}
									>
										application/json
									</code>
									<br />
									Unlock a user's account that has been locked due to failed login attempts. This is
									an admin operation.
								</p>
							</div>
						</Alert>

						<DocumentationSection>
							<DocumentationLink
								href="https://apidocs.pingidentity.com/pingone/platform/v1/api/#user-passwords"
								target="_blank"
								rel="noopener noreferrer"
							>
								<FiBook />
								PingOne API: Unlock Password (Content-Type: application/json)
								<FiExternalLink size={14} />
							</DocumentationLink>
						</DocumentationSection>

						{unlockSuccess && (
							<SuccessMessage>
								<SuccessTitle>
									<FiCheckCircle style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
									Password Unlocked Successfully!
								</SuccessTitle>
								<SuccessText>
									The user's account has been unlocked and they can now sign in.
								</SuccessText>
							</SuccessMessage>
						)}

						<FormGroup>
							<Label>Username or Email</Label>
							<div style={{ display: 'flex', gap: '0.5rem' }}>
								<Input
									type="text"
									placeholder="Enter username or email"
									value={unlockIdentifier}
									onChange={(e) => setUnlockIdentifier(e.target.value)}
								/>
								<Button onClick={handleUnlockLookup} disabled={unlockLoading || !unlockIdentifier}>
									{unlockLoading ? <SpinningIcon /> : <FiSearch />}
									Lookup
								</Button>
							</div>
						</FormGroup>

						{unlockUser && (
							<UserCard>
								<UserInfo>
									<UserAvatar>{getUserNameInitial(unlockUser)}</UserAvatar>
									<div>
										<div style={{ fontWeight: 600 }}>{getUserNameDisplay(unlockUser)}</div>
										<div style={{ fontSize: '0.875rem', color: '#6B7280' }}>
											{unlockUser.email || unlockUser.username}
										</div>
									</div>
								</UserInfo>
								<Button $variant="danger" onClick={handleUnlockPassword} disabled={unlockLoading}>
									{unlockLoading ? <SpinningIcon /> : <FiKey />}
									{unlockLoading ? 'Unlocking...' : 'Unlock Password'}
								</Button>
							</UserCard>
						)}
					</Card>
				)}

				{activeTab === 'state' && (
					<Card>
						<h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', color: '#1F2937' }}>
							Read Password State
						</h2>

						<Alert $type="info" style={{ marginBottom: '1.5rem' }}>
							<FiAlertCircle />
							<div>
								<strong>How This Works:</strong>
								<p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
									<strong>Requires:</strong> Worker token
									<br />
									<strong>Method:</strong> GET (no special Content-Type header)
									<br />
									Retrieve the current password state information for a user, including lock status,
									expiration, and change requirements.
								</p>
							</div>
						</Alert>

						<DocumentationSection>
							<DocumentationLink
								href="https://apidocs.pingidentity.com/pingone/platform/v1/api/#user-passwords"
								target="_blank"
								rel="noopener noreferrer"
							>
								<FiBook />
								PingOne API: Read Password State (GET method)
								<FiExternalLink size={14} />
							</DocumentationLink>
						</DocumentationSection>

						<FormGroup>
							<Label>Username or Email</Label>
							<div style={{ display: 'flex', gap: '0.5rem' }}>
								<Input
									type="text"
									placeholder="Enter username or email"
									value={stateIdentifier}
									onChange={(e) => setStateIdentifier(e.target.value)}
								/>
								<Button onClick={handleStateLookup} disabled={stateLoading || !stateIdentifier}>
									{stateLoading ? <SpinningIcon /> : <FiSearch />}
									Lookup
								</Button>
							</div>
						</FormGroup>

						{stateUser && (
							<>
								<UserCard>
									<UserInfo>
										<UserAvatar>{getUserNameInitial(stateUser)}</UserAvatar>
										<div>
											<div style={{ fontWeight: 600 }}>{getUserNameDisplay(stateUser)}</div>
											<div style={{ fontSize: '0.875rem', color: '#6B7280' }}>
												{stateUser.email || stateUser.username}
											</div>
										</div>
									</UserInfo>
									<Button onClick={handleReadPasswordState} disabled={stateLoading}>
										{stateLoading ? <SpinningIcon /> : <FiRefreshCw />}
										{stateLoading ? 'Reading...' : 'Read Password State'}
									</Button>
								</UserCard>

								{passwordState && (
									<Card style={{ marginTop: '1.5rem', background: '#F9FAFB' }}>
										<h3 style={{ marginBottom: '1rem', fontSize: '1.125rem', color: '#1F2937' }}>
											Password State
										</h3>
										<CodeBlock>
											<code className="language-json">
												{JSON.stringify(passwordState, null, 2)}
											</code>
										</CodeBlock>
									</Card>
								)}
							</>
						)}
					</Card>
				)}

				{activeTab === 'admin-set' && (
					<Card>
						<h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', color: '#1F2937' }}>
							Admin Set Password
						</h2>

						<Alert $type="info" style={{ marginBottom: '1.5rem' }}>
							<FiAlertCircle />
							<div>
								<strong>How This Works:</strong>
								<p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
									<strong>Requires:</strong> Worker token + New password
									<br />
									<strong>Content-Type Header:</strong>{' '}
									<code
										style={{
											background: '#F3F4F6',
											padding: '0.25rem 0.5rem',
											borderRadius: '0.25rem',
											fontSize: '0.875rem',
										}}
									>
										application/vnd.pingidentity.password.set+json
									</code>
									<br />
									Admin operation to set a user's password directly. Uses the "set" Content-Type.
								</p>
							</div>
						</Alert>

						<DocumentationSection>
							<DocumentationLink
								href="https://apidocs.pingidentity.com/pingone/platform/v1/api/#user-passwords"
								target="_blank"
								rel="noopener noreferrer"
							>
								<FiBook />
								PingOne API: Admin Set Password (Content-Type:
								application/vnd.pingidentity.password.set+json)
								<FiExternalLink size={14} />
							</DocumentationLink>
						</DocumentationSection>

						{adminSetSuccess && (
							<SuccessMessage>
								<SuccessTitle>
									<FiCheckCircle style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
									Password Set Successfully!
								</SuccessTitle>
								<SuccessText>The user's password has been set successfully.</SuccessText>
							</SuccessMessage>
						)}

						<FormGroup>
							<Label>Username or Email</Label>
							<div style={{ display: 'flex', gap: '0.5rem' }}>
								<Input
									type="text"
									placeholder="Enter username or email"
									value={adminSetIdentifier}
									onChange={(e) => setAdminSetIdentifier(e.target.value)}
								/>
								<Button
									onClick={handleAdminSetLookup}
									disabled={adminSetLoading || !adminSetIdentifier}
								>
									{adminSetLoading ? <SpinningIcon /> : <FiSearch />}
									Lookup
								</Button>
							</div>
						</FormGroup>

						{adminSetUser && (
							<>
								<UserCard>
									<UserInfo>
										<UserAvatar>{getUserNameInitial(adminSetUser)}</UserAvatar>
										<div>
											<div style={{ fontWeight: 600 }}>{getUserNameDisplay(adminSetUser)}</div>
											<div style={{ fontSize: '0.875rem', color: '#6B7280' }}>
												{adminSetUser.email || adminSetUser.username}
											</div>
										</div>
									</UserInfo>
								</UserCard>

								<FormGroup>
									<Label>New Password</Label>
									<div style={{ position: 'relative' }}>
										<Input
											type={showAdminSetPassword ? 'text' : 'password'}
											placeholder="Enter new password"
											value={adminSetPassword}
											onChange={(e) => setAdminSetPassword(e.target.value)}
											style={{ paddingRight: '3rem' }}
										/>
										<button
											type="button"
											onClick={() => setShowAdminSetPassword(!showAdminSetPassword)}
											style={{
												position: 'absolute',
												right: '0.75rem',
												top: '50%',
												transform: 'translateY(-50%)',
												background: 'none',
												border: 'none',
												color: '#6B7280',
												cursor: 'pointer',
												padding: '0.25rem',
											}}
										>
											{showAdminSetPassword ? <FiEyeOff /> : <FiEye />}
										</button>
									</div>
								</FormGroup>

								<FormGroup>
									<Label
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: '0.5rem',
											cursor: 'pointer',
										}}
									>
										<input
											type="checkbox"
											checked={adminSetForceChange}
											onChange={(e) => setAdminSetForceChange(e.target.checked)}
											style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
										/>
										<span>Force password change on next sign-on</span>
									</Label>
									<p
										style={{
											marginTop: '0.5rem',
											fontSize: '0.875rem',
											color: '#6B7280',
											marginLeft: '1.75rem',
										}}
									>
										If checked, the user will be required to change their password when they next
										sign in.
									</p>
								</FormGroup>

								<FormGroup>
									<Label
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: '0.5rem',
											cursor: 'pointer',
										}}
									>
										<input
											type="checkbox"
											checked={adminSetBypassPolicy}
											onChange={(e) => setAdminSetBypassPolicy(e.target.checked)}
											style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
										/>
										<span>Bypass password policy</span>
									</Label>
									<p
										style={{
											marginTop: '0.5rem',
											fontSize: '0.875rem',
											color: '#6B7280',
											marginLeft: '1.75rem',
										}}
									>
										If checked, the password will be set even if it doesn't meet the password policy
										requirements. Use with caution - this allows setting weak passwords that may
										violate security policies.
									</p>
								</FormGroup>

								<Button
									onClick={handleAdminSetPassword}
									disabled={adminSetLoading || !adminSetPassword}
								>
									{adminSetLoading ? <SpinningIcon /> : <FiKey />}
									{adminSetLoading ? 'Setting...' : 'Set Password'}
								</Button>
							</>
						)}
					</Card>
				)}

				{activeTab === 'set' && (
					<Card>
						<h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', color: '#1F2937' }}>
							Set Password
						</h2>

						<Alert $type="info" style={{ marginBottom: '1.5rem' }}>
							<FiAlertCircle />
							<div>
								<strong>How This Works:</strong>
								<p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
									<strong>Requires:</strong> Worker token + New password
									<br />
									<strong>Content-Type Header:</strong>{' '}
									<code
										style={{
											background: '#F3F4F6',
											padding: '0.25rem 0.5rem',
											borderRadius: '0.25rem',
											fontSize: '0.875rem',
										}}
									>
										application/vnd.pingidentity.password.set+json
									</code>
									<br />
									General password set operation. Admin operation to set a user's password.
								</p>
							</div>
						</Alert>

						<DocumentationSection>
							<DocumentationLink
								href="https://apidocs.pingidentity.com/pingone/platform/v1/api/#user-passwords"
								target="_blank"
								rel="noopener noreferrer"
							>
								<FiBook />
								PingOne API: Set Password (Content-Type:
								application/vnd.pingidentity.password.set+json)
								<FiExternalLink size={14} />
							</DocumentationLink>
						</DocumentationSection>

						{setPasswordSuccess && (
							<SuccessMessage>
								<SuccessTitle>
									<FiCheckCircle style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
									Password Set Successfully!
								</SuccessTitle>
								<SuccessText>The user's password has been set successfully.</SuccessText>
							</SuccessMessage>
						)}

						<FormGroup>
							<Label>Username or Email</Label>
							<div style={{ display: 'flex', gap: '0.5rem' }}>
								<Input
									type="text"
									placeholder="Enter username or email"
									value={setPasswordIdentifier}
									onChange={(e) => setSetPasswordIdentifier(e.target.value)}
								/>
								<Button
									onClick={handleSetPasswordLookup}
									disabled={setPasswordLoading || !setPasswordIdentifier}
								>
									{setPasswordLoading ? <SpinningIcon /> : <FiSearch />}
									Lookup
								</Button>
							</div>
						</FormGroup>

						{setPasswordUser && (
							<>
								<UserCard>
									<UserInfo>
										<UserAvatar>{getUserNameInitial(setPasswordUser)}</UserAvatar>
										<div>
											<div style={{ fontWeight: 600 }}>{getUserNameDisplay(setPasswordUser)}</div>
											<div style={{ fontSize: '0.875rem', color: '#6B7280' }}>
												{setPasswordUser.email || setPasswordUser.username}
											</div>
										</div>
									</UserInfo>
								</UserCard>

								<FormGroup>
									<Label>New Password</Label>
									<div style={{ position: 'relative' }}>
										<Input
											type={showSetPassword ? 'text' : 'password'}
											placeholder="Enter new password"
											value={setPasswordValue}
											onChange={(e) => setSetPasswordValue(e.target.value)}
											style={{ paddingRight: '3rem' }}
										/>
										<button
											type="button"
											onClick={() => setShowSetPassword(!showSetPassword)}
											style={{
												position: 'absolute',
												right: '0.75rem',
												top: '50%',
												transform: 'translateY(-50%)',
												background: 'none',
												border: 'none',
												color: '#6B7280',
												cursor: 'pointer',
												padding: '0.25rem',
											}}
										>
											{showSetPassword ? <FiEyeOff /> : <FiEye />}
										</button>
									</div>
								</FormGroup>

								<FormGroup>
									<Label
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: '0.5rem',
											cursor: 'pointer',
										}}
									>
										<input
											type="checkbox"
											checked={setPasswordForceChange}
											onChange={(e) => setSetPasswordForceChange(e.target.checked)}
											style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
										/>
										<span>Force password change on next sign-on</span>
									</Label>
									<p
										style={{
											marginTop: '0.5rem',
											fontSize: '0.875rem',
											color: '#6B7280',
											marginLeft: '1.75rem',
										}}
									>
										If checked, the user will be required to change their password when they next
										sign in.
									</p>
								</FormGroup>

								<FormGroup>
									<Label
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: '0.5rem',
											cursor: 'pointer',
										}}
									>
										<input
											type="checkbox"
											checked={setPasswordBypassPolicy}
											onChange={(e) => setSetPasswordBypassPolicy(e.target.checked)}
											style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
										/>
										<span>Bypass password policy</span>
									</Label>
									<p
										style={{
											marginTop: '0.5rem',
											fontSize: '0.875rem',
											color: '#6B7280',
											marginLeft: '1.75rem',
										}}
									>
										If checked, the password will be set even if it doesn't meet the password policy
										requirements. Use with caution - this allows setting weak passwords that may
										violate security policies.
									</p>
								</FormGroup>

								<Button
									onClick={handleSetPassword}
									disabled={setPasswordLoading || !setPasswordValue}
								>
									{setPasswordLoading ? <SpinningIcon /> : <FiKey />}
									{setPasswordLoading ? 'Setting...' : 'Set Password'}
								</Button>
							</>
						)}
					</Card>
				)}

				{activeTab === 'set-value' && (
					<PasswordSetValueTab environmentId={environmentId} workerToken={workerToken} />
				)}

				{activeTab === 'ldap-gateway' && (
					<Card>
						<h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', color: '#1F2937' }}>
							Set Password via LDAP Gateway
						</h2>

						<Alert $type="info" style={{ marginBottom: '1.5rem' }}>
							<FiAlertCircle />
							<div>
								<strong>How This Works:</strong>
								<p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
									<strong>Requires:</strong> Worker token + New password + (Optional) LDAP Gateway
									ID
									<br />
									<strong>Content-Type Header:</strong>{' '}
									<code
										style={{
											background: '#F3F4F6',
											padding: '0.25rem 0.5rem',
											borderRadius: '0.25rem',
											fontSize: '0.875rem',
										}}
									>
										application/vnd.pingidentity.password.ldapGateway+json
									</code>
									<br />
									Set a user's password via an LDAP Gateway. This is useful when integrating with
									LDAP directories.
								</p>
							</div>
						</Alert>

						<DocumentationSection>
							<DocumentationLink
								href="https://apidocs.pingidentity.com/pingone/platform/v1/api/#user-passwords"
								target="_blank"
								rel="noopener noreferrer"
							>
								<FiBook />
								PingOne API: Set Password via LDAP Gateway (Content-Type:
								application/vnd.pingidentity.password.ldapGateway+json)
								<FiExternalLink size={14} />
							</DocumentationLink>
						</DocumentationSection>

						{ldapSuccess && (
							<SuccessMessage>
								<SuccessTitle>
									<FiCheckCircle style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
									Password Set Successfully via LDAP Gateway!
								</SuccessTitle>
								<SuccessText>
									The user's password has been set successfully via the LDAP Gateway.
								</SuccessText>
							</SuccessMessage>
						)}

						<FormGroup>
							<Label>Username or Email</Label>
							<div style={{ display: 'flex', gap: '0.5rem' }}>
								<Input
									type="text"
									placeholder="Enter username or email"
									value={ldapIdentifier}
									onChange={(e) => setLdapIdentifier(e.target.value)}
								/>
								<Button onClick={handleLdapLookup} disabled={ldapLoading || !ldapIdentifier}>
									{ldapLoading ? <SpinningIcon /> : <FiSearch />}
									Lookup
								</Button>
							</div>
						</FormGroup>

						{ldapUser && (
							<>
								<UserCard>
									<UserInfo>
										<UserAvatar>{getUserNameInitial(ldapUser)}</UserAvatar>
										<div>
											<div style={{ fontWeight: 600 }}>{getUserNameDisplay(ldapUser)}</div>
											<div style={{ fontSize: '0.875rem', color: '#6B7280' }}>
												{ldapUser.email || ldapUser.username}
											</div>
										</div>
									</UserInfo>
								</UserCard>

								<FormGroup>
									<Label>LDAP Gateway ID (Optional)</Label>
									<Input
										type="text"
										placeholder="Enter LDAP Gateway ID (optional)"
										value={ldapGatewayId}
										onChange={(e) => setLdapGatewayId(e.target.value)}
									/>
								</FormGroup>

								<FormGroup>
									<Label>New Password</Label>
									<div style={{ position: 'relative' }}>
										<Input
											type={showLdapPassword ? 'text' : 'password'}
											placeholder="Enter new password"
											value={ldapPassword}
											onChange={(e) => setLdapPassword(e.target.value)}
											style={{ paddingRight: '3rem' }}
										/>
										<button
											type="button"
											onClick={() => setShowLdapPassword(!showLdapPassword)}
											style={{
												position: 'absolute',
												right: '0.75rem',
												top: '50%',
												transform: 'translateY(-50%)',
												background: 'none',
												border: 'none',
												color: '#6B7280',
												cursor: 'pointer',
												padding: '0.25rem',
											}}
										>
											{showLdapPassword ? <FiEyeOff /> : <FiEye />}
										</button>
									</div>
								</FormGroup>

								<FormGroup>
									<Label
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: '0.5rem',
											cursor: 'pointer',
										}}
									>
										<input
											type="checkbox"
											checked={ldapForceChange}
											onChange={(e) => setLdapForceChange(e.target.checked)}
											style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
										/>
										<span>Force password change on next sign-on</span>
									</Label>
									<p
										style={{
											marginTop: '0.5rem',
											fontSize: '0.875rem',
											color: '#6B7280',
											marginLeft: '1.75rem',
										}}
									>
										If checked, the user will be required to change their password when they next
										sign in.
									</p>
								</FormGroup>

								<FormGroup>
									<Label
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: '0.5rem',
											cursor: 'pointer',
										}}
									>
										<input
											type="checkbox"
											checked={ldapBypassPolicy}
											onChange={(e) => setLdapBypassPolicy(e.target.checked)}
											style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
										/>
										<span>Bypass password policy</span>
									</Label>
									<p
										style={{
											marginTop: '0.5rem',
											fontSize: '0.875rem',
											color: '#6B7280',
											marginLeft: '1.75rem',
										}}
									>
										If checked, the password will be set even if it doesn't meet the password policy
										requirements. Use with caution - this allows setting weak passwords that may
										violate security policies.
									</p>
								</FormGroup>

								<Button onClick={handleSetPasswordLdap} disabled={ldapLoading || !ldapPassword}>
									{ldapLoading ? <SpinningIcon /> : <FiKey />}
									{ldapLoading ? 'Setting...' : 'Set Password via LDAP Gateway'}
								</Button>
							</>
						)}
					</Card>
				)}

				<ApiCallTableContainer>
					<ApiCallTable apiCalls={apiCalls} onClear={() => apiCallTrackerService.clearApiCalls()} />
				</ApiCallTableContainer>

				<WorkerTokenModal
					isOpen={showWorkerTokenModal}
					onClose={() => setShowWorkerTokenModal(false)}
					onContinue={() => {
						setShowWorkerTokenModal(false);

						// Use global worker token after modal closes
						const globalToken = getAnyWorkerToken();
						if (globalToken) {
							setWorkerToken(globalToken);
							console.log('✅ [HelioMartPasswordReset] Global worker token detected');
						} else {
							console.log('⚠️ [HelioMartPasswordReset] No global worker token found after save');
						}
					}}
					flowType="heliomart-password-reset"
					environmentId={environmentId}
					tokenStorageKey="worker_token"
					tokenExpiryKey="worker_token_expires_at"
					prefillCredentials={(() => {
						const savedCreds = workerTokenCredentialsService.loadCredentials(
							'heliomart-password-reset'
						);
						if (savedCreds) {
							return {
								environmentId: savedCreds.environmentId || '',
								clientId: savedCreds.clientId || '',
								clientSecret: savedCreds.clientSecret || '',
								region: savedCreds.region || 'us',
								scopes: Array.isArray(savedCreds.scopes)
									? savedCreds.scopes[0]
									: savedCreds.scopes?.[0] || '',
								authMethod: savedCreds.tokenEndpointAuthMethod || ('client_secret_post' as const),
							};
						}
						return {
							environmentId: '',
							clientId: '',
							clientSecret: '',
							region: 'us',
							scopes: '',
							authMethod: 'client_secret_post' as const,
						};
					})()}
				/>

				{/* Setup Modal - Shows when authorization code credentials are not configured */}
				{showSetupModal && (
					<ModalOverlay onClick={() => {}}>
						<ModalContent onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
							<div
								style={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
									marginBottom: '2rem',
								}}
							>
								<h2 style={{ fontSize: '1.75rem', color: '#1F2937', margin: 0 }}>
									Configuration Required
								</h2>
								<button
									onClick={() => setShowSetupModal(false)}
									style={{
										background: 'none',
										border: 'none',
										fontSize: '1.5rem',
										cursor: 'pointer',
										color: '#666',
										padding: '0.25rem',
										display: 'flex',
										alignItems: 'center',
									}}
								>
									×
								</button>
							</div>

							<div style={{ marginBottom: '1.5rem' }}>
								<p style={{ color: '#4b5563', lineHeight: '1.6', marginBottom: '1rem' }}>
									The Password Reset flow requires authorization code credentials to be configured
									for user authentication. Please configure your PingOne authorization code client
									credentials to continue.
								</p>
								<p style={{ color: '#6b7280', fontSize: '0.875rem', lineHeight: '1.5' }}>
									You'll need:
								</p>
								<ul
									style={{
										color: '#6b7280',
										fontSize: '0.875rem',
										lineHeight: '1.8',
										marginLeft: '1.5rem',
										marginTop: '0.5rem',
									}}
								>
									<li>Environment ID</li>
									<li>Client ID</li>
									<li>Client Secret</li>
									<li>Redirect URI (optional)</li>
									<li>Scopes (optional)</li>
								</ul>
							</div>

							<div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
								<Button $variant="secondary" onClick={() => setShowSetupModal(false)}>
									Cancel
								</Button>
								<Button
									onClick={() => {
										setShowSetupModal(false);
										setShowAuthzConfigModal(true);
									}}
								>
									Configure Authorization Code Client
								</Button>
							</div>
						</ModalContent>
					</ModalOverlay>
				)}

				<AuthorizationCodeConfigModal
					isOpen={showAuthzConfigModal}
					onClose={() => {
						setShowAuthzConfigModal(false);
						const FLOW_TYPE = 'heliomart-password-reset';
						const saved = comprehensiveFlowDataService.loadFlowCredentialsIsolated(FLOW_TYPE);
						if (saved?.environmentId && saved.clientId && saved.clientSecret) {
							setAuthzCredentials({
								environmentId: saved.environmentId || '',
								clientId: saved.clientId || '',
								clientSecret: saved.clientSecret || '',
								redirectUri: saved.redirectUri || 'https://localhost:3000/callback',
								scopes: Array.isArray(saved.scopes)
									? saved.scopes.join(' ')
									: saved.scopes || 'openid profile email',
							});
							// Close setup modal if credentials are now complete
							setShowSetupModal(false);
						}
					}}
					flowType="heliomart-password-reset"
					initialCredentials={authzCredentials}
					onCredentialsSaved={(savedCredentials) => {
						// Update credentials state immediately
						setAuthzCredentials({
							environmentId: savedCredentials.environmentId || '',
							clientId: savedCredentials.clientId || '',
							clientSecret: savedCredentials.clientSecret || '',
							redirectUri: savedCredentials.redirectUri || 'https://localhost:3000/callback',
							scopes: Array.isArray(savedCredentials.scopes)
								? savedCredentials.scopes.join(' ')
								: savedCredentials.scopes || 'openid profile email',
						});
						// Close setup modal if credentials are now complete
						if (
							savedCredentials.environmentId &&
							savedCredentials.clientId &&
							savedCredentials.clientSecret
						) {
							setShowSetupModal(false);
						}
					}}
				/>

				{/* Login Modal */}
				{showLoginModal && (
					<ModalOverlay onClick={() => setShowLoginModal(false)}>
						<ModalContent onClick={(e) => e.stopPropagation()}>
							<LoginTitle>
								<FiLock style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
								Sign In
							</LoginTitle>
							<LoginSubtitle>Sign in to manage your password</LoginSubtitle>

							<FormGroup>
								<Label>Username or Email</Label>
								<Input
									type="text"
									placeholder="Enter your username or email"
									value={loginUsername}
									onChange={(e) => setLoginUsername(e.target.value)}
									onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
								/>
							</FormGroup>

							<FormGroup>
								<Label>Password</Label>
								<div style={{ position: 'relative' }}>
									<Input
										type={showLoginPassword ? 'text' : 'password'}
										placeholder="Enter your password"
										value={loginPassword}
										onChange={(e) => setLoginPassword(e.target.value)}
										onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
										style={{ paddingRight: '3rem' }}
									/>
									<button
										type="button"
										onClick={() => setShowLoginPassword(!showLoginPassword)}
										style={{
											position: 'absolute',
											right: '0.75rem',
											top: '50%',
											transform: 'translateY(-50%)',
											background: 'none',
											border: 'none',
											color: '#6B7280',
											cursor: 'pointer',
											padding: '0.25rem',
										}}
									>
										{showLoginPassword ? <FiEyeOff /> : <FiEye />}
									</button>
								</div>
							</FormGroup>

							<Button
								onClick={handleLogin}
								disabled={isLoggingIn}
								style={{ width: '100%', marginTop: '1rem' }}
							>
								{isLoggingIn ? (
									<>
										<SpinningIcon />
										Signing in...
									</>
								) : (
									<>
										<FiLogIn />
										Sign In
									</>
								)}
							</Button>

							<div style={{ marginTop: '1rem', textAlign: 'center' }}>
								<Button
									$variant="secondary"
									onClick={() => setShowLoginModal(false)}
									style={{ fontSize: '0.875rem' }}
								>
									Cancel
								</Button>
							</div>
						</ModalContent>
					</ModalOverlay>
				)}
			</ContentWrapper>
		</PageContainer>
	);
};

export default HelioMartPasswordReset;
