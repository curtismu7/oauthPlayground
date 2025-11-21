// src/pages/flows/KrogerGroceryStoreMFA.tsx
// Kroger Grocery Store Mockup - Real-world MFA authentication experience
// This page demonstrates PingOne MFA in a realistic grocery store website context

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
	FiAlertCircle,
	FiArrowLeft,
	FiHeart,
	FiLock,
	FiLogOut,
	FiRefreshCw,
	FiSearch,
	FiShoppingCart,
	FiUser,
} from 'react-icons/fi';
import styled from 'styled-components';
import { ApiCallTable } from '../../components/ApiCallTable';
import { AuthorizationCodeConfigModal } from '../../components/AuthorizationCodeConfigModal';
import type { StepCredentials } from '../../components/steps/CommonSteps';
import { WorkerTokenModal } from '../../components/WorkerTokenModal';
import type { ApiCall } from '../../services/apiCallTrackerService';
import { apiCallTrackerService } from '../../services/apiCallTrackerService';
import ComprehensiveCredentialsService from '../../services/comprehensiveCredentialsService';
import { comprehensiveFlowDataService } from '../../services/comprehensiveFlowDataService';
import { getValidWorkerToken } from '../../services/tokenExpirationService';
import { workerTokenCredentialsService } from '../../services/workerTokenCredentialsService';
import type { UserInfo } from '../../types/oauth';
import { trackedFetch } from '../../utils/trackedFetch';
import { v4ToastManager } from '../../utils/v4ToastMessages';

// Kroger Brand Colors
const KROGER_BLUE = '#0058A8';
const KROGER_LIGHT_BLUE = '#4DA3FF';
const KROGER_DARK = '#0B2142';
const KROGER_LIGHT = '#F5F7FA';
const KROGER_RED = '#E31837'; // For accent colors
const KROGER_GREEN = '#00A651'; // For success states

// Styled Components
const PageContainer = styled.div`
	min-height: 100vh;
	background: ${KROGER_LIGHT};
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
`;

const ProfileContainer = styled.div`
	background: white;
	border-radius: 12px;
	padding: 2.5rem;
	box-shadow: 0 4px 16px rgba(0,0,0,0.08);
	max-width: 960px;
	margin: 0 auto;
	border: 1px solid ${KROGER_LIGHT_BLUE}33;
`;

const ProfileHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: 1.5rem;
	margin-bottom: 2rem;

	h2 {
		margin: 0;
		font-size: 2rem;
		color: ${KROGER_DARK};
	}

	p {
		margin: 0.5rem 0 0;
		color: #4b5563;
		max-width: 540px;
		line-height: 1.6;
	}
`;

const ProfileActions = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 0.75rem;
	justify-content: flex-end;
`;

const RoundedButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
	background: ${({ $variant }) => ($variant === 'secondary' ? 'white' : KROGER_BLUE)};
	color: ${({ $variant }) => ($variant === 'secondary' ? KROGER_BLUE : 'white')};
	border: ${({ $variant }) => ($variant === 'secondary' ? `2px solid ${KROGER_LIGHT_BLUE}` : 'none')};
	border-radius: 999px;
	padding: 0.6rem 1.4rem;
	font-weight: 600;
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	cursor: pointer;
	transition: background 0.2s ease-in-out, color 0.2s ease-in-out, opacity 0.2s ease-in-out;

	&:hover {
		opacity: 0.9;
	}

	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
`;

const ProfileGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
	gap: 1.5rem;
`;

const ProfileField = styled.div`
	background: ${KROGER_LIGHT};
	border-radius: 10px;
	padding: 1.25rem 1.5rem;
	border: 1px solid rgba(0,0,0,0.05);
	min-height: 110px;
`;

const FieldLabel = styled.div`
	font-size: 0.85rem;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	color: ${KROGER_BLUE};
	margin-bottom: 0.5rem;
	font-weight: 700;
`;

const FieldValue = styled.div`
	font-size: 1.05rem;
	color: ${KROGER_DARK};
	word-break: break-word;
	white-space: pre-wrap;
`;

const JsonValue = styled.pre`
	margin: 0;
	font-size: 0.95rem;
	line-height: 1.5;
	background: rgba(0, 88, 168, 0.08);
	padding: 0.75rem;
	border-radius: 8px;
	color: ${KROGER_DARK};
	overflow: auto;
`;

const ErrorBanner = styled.div`
	background: ${KROGER_RED}1A;
	border: 1px solid ${KROGER_RED}4D;
	color: #9b1c31;
	padding: 1rem 1.25rem;
	border-radius: 10px;
	margin-bottom: 1.5rem;
	font-weight: 600;
`;

const LoadingMessage = styled.div`
	padding: 1rem 1.25rem;
	border-radius: 10px;
	background: ${KROGER_LIGHT_BLUE}1F;
	color: ${KROGER_BLUE};
	font-weight: 600;
	margin-bottom: 1.5rem;
`;

const Header = styled.header`
	background: ${KROGER_BLUE};
	color: white;
	padding: 1rem 2rem;
	box-shadow: 0 2px 8px rgba(0,0,0,0.1);
	position: sticky;
	top: 0;
	z-index: 1000;
`;

const HeaderContent = styled.div`
	max-width: 1400px;
	margin: 0 auto;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 2rem;
`;

const Logo = styled.div`
	font-size: 2rem;
	font-weight: bold;
	letter-spacing: -0.5px;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const SearchBar = styled.div`
	flex: 1;
	max-width: 600px;
	position: relative;
	
	input {
		width: 100%;
		padding: 0.75rem 1rem 0.75rem 3rem;
		border: none;
		border-radius: 4px;
		font-size: 1rem;
		background: white;
		color: ${KROGER_DARK};
		
		&::placeholder {
			color: #999;
		}
	}
	
	svg {
		position: absolute;
		left: 1rem;
		top: 50%;
		transform: translateY(-50%);
		color: #999;
	}
`;

const SignOutButton = styled.button`
	background: rgba(255, 255, 255, 0.12);
	color: white;
	border: none;
	font-size: 0.95rem;
	font-weight: 600;
	padding: 0.6rem 1.4rem;
	border-radius: 999px;
	cursor: pointer;
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	transition: background 0.2s ease-in-out, opacity 0.2s ease-in-out;

	&:hover {
		opacity: 0.85;
	}
`;

const HeaderActions = styled.div`
	display: flex;
	align-items: center;
	gap: 1.5rem;
`;

const HeaderButton = styled.button`
	background: transparent;
	border: none;
	color: white;
	font-size: 1.5rem;
	cursor: pointer;
	padding: 0.5rem;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	transition: opacity 0.2s;
	
	&:hover {
		opacity: 0.8;
	}
	
	span {
		font-size: 0.875rem;
		font-weight: 500;
	}
`;

const MainContent = styled.main`
	max-width: 1400px;
	margin: 0 auto;
	padding: 2rem;
`;

const HeroBanner = styled.div`
	background: linear-gradient(135deg, ${KROGER_GREEN} 0%, ${KROGER_BLUE} 100%);
	color: white;
	padding: 3rem 2rem;
	border-radius: 12px;
	margin-bottom: 2rem;
	text-align: center;
	
	h1 {
		font-size: 2.5rem;
		margin-bottom: 1rem;
		font-weight: 700;
	}
	
	p {
		font-size: 1.25rem;
		opacity: 0.95;
	}
`;

const ProductsGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
	gap: 1.5rem;
	margin-bottom: 2rem;
`;

const ProductCard = styled.div`
	background: white;
	border-radius: 8px;
	padding: 1.5rem;
	box-shadow: 0 2px 4px rgba(0,0,0,0.1);
	cursor: pointer;
	transition: transform 0.2s, box-shadow 0.2s;
	
	&:hover {
		transform: translateY(-4px);
		box-shadow: 0 4px 12px rgba(0,0,0,0.15);
	}
	
	img {
		width: 100%;
		height: 200px;
		object-fit: cover;
		border-radius: 4px;
		margin-bottom: 1rem;
		background: ${KROGER_LIGHT};
	}
	
	h3 {
		font-size: 1.125rem;
		margin-bottom: 0.5rem;
		color: ${KROGER_DARK};
	}
	
	.price {
		font-size: 1.5rem;
		font-weight: bold;
		color: ${KROGER_BLUE};
		margin: 0.5rem 0;
	}
	
	button {
		width: 100%;
		padding: 0.75rem;
		background: ${KROGER_BLUE};
		color: white;
		border: none;
		border-radius: 4px;
		font-weight: 600;
		cursor: pointer;
		margin-top: 1rem;
		transition: background 0.2s;
		
		&:hover {
			background: #c40024;
		}
	}
`;

// Login Modal
const ModalOverlay = styled.div<{ $isOpen: boolean }>`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0,0,0,0.7);
	display: ${(props) => (props.$isOpen ? 'flex' : 'none')};
	align-items: center;
	justify-content: center;
	z-index: 2000;
	padding: 2rem;
`;

const LoginModal = styled.div`
	background: white;
	border-radius: 12px;
	padding: 2rem;
	max-width: 500px;
	width: 100%;
	max-height: 90vh;
	overflow-y: auto;
	box-shadow: 0 20px 60px rgba(0,0,0,0.3);
`;

const LoginPageContainer = styled.div`
	max-width: 500px;
	margin: 3rem auto 2rem;
	background: white;
	border-radius: 12px;
	padding: 2rem;
	box-shadow: 0 4px 12px rgba(0,0,0,0.1);
`;

const ApiCallTableContainer = styled.div`
	max-width: 1400px;
	width: 100%;
	margin: 0 auto 2rem;
	padding: 0 2rem;
`;

const ModalHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 2rem;
	
	h2 {
		font-size: 1.75rem;
		color: ${KROGER_DARK};
		margin: 0;
	}
	
	button {
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		color: #999;
		
		&:hover {
			color: ${KROGER_DARK};
		}
	}
`;

const FormGroup = styled.div`
	margin-bottom: 1.5rem;
	
	label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 600;
		color: ${KROGER_DARK};
	}
	
	input {
		width: 100%;
		padding: 0.75rem;
		border: 2px solid #e0e0e0;
		border-radius: 4px;
		font-size: 1rem;
		transition: border-color 0.2s;
		
		&:focus {
			outline: none;
			border-color: ${KROGER_BLUE};
		}
	}
`;

const LoginButton = styled.button`
	width: 100%;
	padding: 1rem;
	background: ${KROGER_BLUE};
	color: white;
	border: none;
	border-radius: 4px;
	font-size: 1.125rem;
	font-weight: 600;
	cursor: pointer;
	margin-top: 1rem;
	transition: background 0.2s;
	
	&:hover {
		background: #c40024;
	}
	
	&:disabled {
		background: #ccc;
		cursor: not-allowed;
	}
`;

const MFAChallengeModal = styled(LoginModal)`
	max-width: 400px;
`;

const MFAChallengeContent = styled.div`
	text-align: center;
	
	.icon {
		font-size: 4rem;
		color: ${KROGER_GREEN};
		margin-bottom: 1rem;
	}
	
	h3 {
		font-size: 1.5rem;
		margin-bottom: 1rem;
		color: ${KROGER_DARK};
	}
	
	p {
		color: #666;
		margin-bottom: 2rem;
		line-height: 1.6;
	}
	
	input {
		width: 100%;
		padding: 1rem;
		border: 2px solid #e0e0e0;
		border-radius: 4px;
		font-size: 1.5rem;
		text-align: center;
		letter-spacing: 0.5rem;
		margin-bottom: 1rem;
		
		&:focus {
			outline: none;
			border-color: ${KROGER_BLUE};
		}
	}
`;

const PortalDashboard = styled.div`
	background: white;
	border-radius: 12px;
	padding: 2rem;
	box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const DashboardHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 2rem;
	padding-bottom: 1rem;
	border-bottom: 2px solid ${KROGER_LIGHT};
	
	h2 {
		font-size: 2rem;
		color: ${KROGER_DARK};
		margin: 0;
	}
`;

const ConfigSection = styled.div`
	margin-top: 2rem;
	padding-top: 2rem;
	border-top: 2px solid ${KROGER_LIGHT};
	
	summary {
		cursor: pointer;
		font-weight: 600;
		color: ${KROGER_DARK};
		padding: 1rem;
		background: ${KROGER_LIGHT};
		border-radius: 4px;
		margin-bottom: 1rem;
		
		&:hover {
			background: #e8e8e8;
		}
	}
`;

const FLOW_KEY = 'kroger-grocery-store-mfa';

// Mock products for the store
const MOCK_PRODUCTS = [
	{ id: 1, name: 'Fresh Organic Bananas', price: '$2.99', image: '🍌' },
	{ id: 2, name: 'Kroger Premium Chicken Breast', price: '$8.99', image: '🍗' },
	{ id: 3, name: 'Kroger Organic Milk', price: '$4.49', image: '🥛' },
	{ id: 4, name: 'Fresh Strawberries', price: '$3.99', image: '🍓' },
	{ id: 5, name: 'Kroger Artisan Bread', price: '$3.49', image: '🍞' },
	{ id: 6, name: 'Organic Eggs (12 count)', price: '$5.99', image: '🥚' },
];

interface MfaDevice {
	id: string;
	type: string;
	status?: string;
	enabled?: boolean;
	phone?: string;
	phoneNumber?: string;
	name?: string;
}

const KrogerGroceryStoreMFA: React.FC = () => {
	const [showLoginModal, setShowLoginModal] = useState(false);
	const [showMFAChallenge, setShowMFAChallenge] = useState(false);
	const [showDeviceSetup, setShowDeviceSetup] = useState(false);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [username, setUsername] = useState('curtis7');
	const [password, setPassword] = useState('');
	const [mfaCode, setMfaCode] = useState('');
	const [showWorkerTokenModal, setShowWorkerTokenModal] = useState(false);
	const [showAuthzConfigModal, setShowAuthzConfigModal] = useState(false);
	const [showSetupModal, setShowSetupModal] = useState(false);
	const [credentials, setCredentials] = useState<StepCredentials>({
		environmentId: '',
		clientId: '',
		clientSecret: '',
		redirectUri: 'https://localhost:3000/callback',
		scopes: 'openid profile email consents',
	});
	const [phoneNumber, setPhoneNumber] = useState('');
	const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
	const [mfaDevices, setMfaDevices] = useState<MfaDevice[]>([]);
	const [showConfig, setShowConfig] = useState(false);
	const [activeView, setActiveView] = useState<'profile' | 'dashboard'>('profile');
	const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
	const [userInfoLoading, setUserInfoLoading] = useState(false);
	const [userInfoError, setUserInfoError] = useState<string | null>(null);

	// MFA Workflow State (Steps 11-20)
	const [userId, setUserId] = useState('');
	const [deviceId, setDeviceId] = useState('');
	const [flowId, setFlowId] = useState('');
	const [authorizationCode, setAuthorizationCode] = useState('');
	const [tokens, setTokens] = useState<any>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [loginStep, setLoginStep] = useState<'login' | 'device-setup' | 'mfa' | 'success'>('login');
	const [workerToken, setWorkerToken] = useState('');

	// API Call Tracking
	const [apiCalls, setApiCalls] = useState<ApiCall[]>([]);

	// Use refs to avoid circular dependency issues in useCallback
	const completeMFALoginRef = useRef<(() => Promise<void>) | null>(null);
	const loginFormRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (!showLoginModal) {
			return;
		}

		const timer = window.setTimeout(() => {
			setShowLoginModal(false);
		}, 1200);

		return () => window.clearTimeout(timer);
	}, [showLoginModal]);

	// Subscribe to API call updates
	useEffect(() => {
		const unsubscribe = apiCallTrackerService.subscribe((calls) => {
			setApiCalls(calls);
		});
		return unsubscribe;
	}, []);

	// Check for worker token on mount - don't show modal if valid token exists
	useEffect(() => {
		const checkWorkerToken = () => {
			const FLOW_TYPE = 'kroger-grocery-store-mfa';
			const tokenStorageKey = `pingone_worker_token_${FLOW_TYPE}`;
			const tokenExpiryKey = `pingone_worker_token_expires_at_${FLOW_TYPE}`;

			// Check if we have a valid worker token
			const tokenResult = getValidWorkerToken(tokenStorageKey, tokenExpiryKey, {
				clearExpired: true,
				showToast: false,
			});

			if (tokenResult.isValid && tokenResult.token) {
				console.log('✅ [KrogerGroceryStoreMFA] Valid worker token found, not showing modal');
				setWorkerToken(tokenResult.token);
				return;
			}

			// No valid token - check if we have credentials to generate one
			const savedCreds = workerTokenCredentialsService.loadCredentials(FLOW_TYPE);
			if (
				!savedCreds ||
				!savedCreds.environmentId ||
				!savedCreds.clientId ||
				!savedCreds.clientSecret
			) {
				// No credentials found - show modal to request them
				console.log(
					'⚠️ [KrogerGroceryStoreMFA] No worker token credentials found, showing modal...'
				);
				setShowWorkerTokenModal(true);
			}
		};

		checkWorkerToken();
	}, []);

	// Load credentials on mount
	useEffect(() => {
		const loadCredentials = () => {
			console.log('🔄 [KrogerGroceryStoreMFA] Loading credentials...');

			// First, check isolated credentials directly
			const isolatedCreds = comprehensiveFlowDataService.loadFlowCredentialsIsolated(FLOW_KEY);
			console.log('🔍 [KrogerGroceryStoreMFA] Isolated credentials:', isolatedCreds);

			const flowData = comprehensiveFlowDataService.loadFlowDataComprehensive({
				flowKey: FLOW_KEY,
				useSharedEnvironment: true,
				useSharedDiscovery: true,
			});

			// Determine if we have complete credentials
			const hasCompleteCredentials =
				isolatedCreds &&
				isolatedCreds.environmentId &&
				isolatedCreds.clientId &&
				isolatedCreds.clientSecret;

			if (hasCompleteCredentials) {
				console.log('✅ [KrogerGroceryStoreMFA] Found complete authorization code credentials');
				const envId =
					flowData.sharedEnvironment?.environmentId || isolatedCreds.environmentId || '';
				const loadedCreds = {
					environmentId: envId,
					clientId: isolatedCreds.clientId || '',
					clientSecret: isolatedCreds.clientSecret || '',
					redirectUri: isolatedCreds.redirectUri || 'https://localhost:3000/callback',
					scopes: Array.isArray(isolatedCreds.scopes)
						? isolatedCreds.scopes.join(' ')
						: isolatedCreds.scopes || 'openid profile email consents',
				};
				setCredentials(loadedCreds);
			} else if (flowData.flowCredentials && Object.keys(flowData.flowCredentials).length > 0) {
				console.log(
					'✅ [KrogerGroceryStoreMFA] Found flow-specific credentials (may be incomplete)'
				);
				const envId =
					flowData.sharedEnvironment?.environmentId || flowData.flowCredentials.environmentId || '';
				const loadedCreds = {
					environmentId: envId,
					clientId: flowData.flowCredentials.clientId || '',
					clientSecret: flowData.flowCredentials.clientSecret || '',
					redirectUri: flowData.flowCredentials.redirectUri || 'https://localhost:3000/callback',
					scopes: Array.isArray(flowData.flowCredentials.scopes)
						? flowData.flowCredentials.scopes.join(' ')
						: flowData.flowCredentials.scopes || 'openid profile email consents',
				};
				setCredentials(loadedCreds);

				// Check if credentials are complete
				if (!loadedCreds.environmentId || !loadedCreds.clientId || !loadedCreds.clientSecret) {
					console.log(
						'⚠️ [KrogerGroceryStoreMFA] Incomplete authorization code credentials, showing setup modal...'
					);
					// Delay showing modal slightly to ensure component is fully mounted
					setTimeout(() => setShowSetupModal(true), 100);
				}
			} else if (flowData.sharedEnvironment?.environmentId) {
				console.log('ℹ️ [KrogerGroceryStoreMFA] Using shared environment data only');
				const envId = flowData.sharedEnvironment.environmentId;
				setCredentials((prev) => ({
					...prev,
					environmentId: envId,
				}));

				// Check if we still need client credentials
				if (!isolatedCreds || !isolatedCreds.clientId || !isolatedCreds.clientSecret) {
					console.log(
						'⚠️ [KrogerGroceryStoreMFA] Missing client credentials, showing setup modal...'
					);
					// Delay showing modal slightly to ensure component is fully mounted
					setTimeout(() => setShowSetupModal(true), 100);
				}
			} else {
				// No credentials at all
				console.log('⚠️ [KrogerGroceryStoreMFA] No credentials found, showing setup modal...');
				// Delay showing modal slightly to ensure component is fully mounted
				setTimeout(() => setShowSetupModal(true), 100);
			}
		};

		loadCredentials();
	}, []);

	// Handle credentials change
	const handleCredentialsChange = useCallback((newCredentials: StepCredentials) => {
		setCredentials(newCredentials);

		const scopesArray = Array.isArray(newCredentials.scopes)
			? newCredentials.scopes
			: typeof newCredentials.scopes === 'string'
				? newCredentials.scopes.split(/\s+/).filter(Boolean)
				: [];

		// Save credentials using isolated storage (add lastUpdated property)
		const credentialsToSave = {
			...newCredentials,
			scopes: scopesArray,
			lastUpdated: Date.now(),
		};
		comprehensiveFlowDataService.saveFlowCredentialsIsolated(
			FLOW_KEY,
			credentialsToSave as typeof credentialsToSave & { scopes: string[] },
			{ showToast: false }
		);
	}, []);

	// Handle OIDC discovery completion - ensure environment ID is saved
	const handleDiscoveryComplete = useCallback((result: any) => {
		console.log('[KrogerGroceryStoreMFA] OIDC Discovery completed:', result);

		// Extract environment ID from issuer URL
		if (result.issuerUrl) {
			const envIdMatch = result.issuerUrl.match(
				/\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i
			);
			if (envIdMatch && envIdMatch[1]) {
				const extractedEnvId = envIdMatch[1];
				console.log(
					'[KrogerGroceryStoreMFA] Extracted Environment ID from discovery:',
					extractedEnvId
				);

				// Update credentials with environment ID
				setCredentials((prev) => {
					const updated = { ...prev, environmentId: extractedEnvId };

					const scopesArray = Array.isArray(updated.scopes)
						? updated.scopes
						: typeof updated.scopes === 'string'
							? updated.scopes.split(/\s+/).filter(Boolean)
							: [];
					// Save immediately (add lastUpdated property)
					const credentialsToSave = {
						...updated,
						scopes: scopesArray,
						lastUpdated: Date.now(),
					};
					comprehensiveFlowDataService.saveFlowCredentialsIsolated(
						FLOW_KEY,
						credentialsToSave as typeof credentialsToSave & { scopes: string[] },
						{ showToast: false }
					);

					return updated;
				});
			}
		}
	}, []);

	const handleSignOut = useCallback(() => {
		setIsAuthenticated(false);
		setTokens(null);
		setAuthorizationCode('');
		setFlowId('');
		setDeviceId('');
		setMfaCode('');
		setPassword('');
		setActiveView('profile');
		setUserInfo(null);
		setUserInfoError(null);
		setUserInfoLoading(false);
	}, []);

	const handleShowLoginForm = useCallback(() => {
		loginFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}, []);

	const fetchKrogerUserInfo = useCallback(async () => {
		if (!credentials.environmentId || !tokens?.access_token) {
			setUserInfoError('Missing environment ID or access token to fetch profile details.');
			return;
		}

		setUserInfoLoading(true);
		setUserInfoError(null);

		try {
			const params = new URLSearchParams({
				access_token: tokens.access_token,
				environment_id: credentials.environmentId,
			});

			const response = await trackedFetch(`/api/userinfo?${params.toString()}`, {
				method: 'GET',
				headers: {
					Accept: 'application/json',
				},
			});

			const data = await response.json();
			if (!response.ok) {
				const errorDescription =
					(data?.error_description as string | undefined) ||
					(data?.error as string | undefined) ||
					'Failed to load profile details';
				throw new Error(errorDescription);
			}

			setUserInfo(data as UserInfo);
		} catch (error) {
			console.error('[Kroger] Failed to fetch user profile:', error);
			setUserInfoError(error instanceof Error ? error.message : 'Failed to fetch user profile');
			setUserInfo(null);
		} finally {
			setUserInfoLoading(false);
		}
	}, [credentials.environmentId, tokens?.access_token]);

	// Load worker token and listen for updates
	useEffect(() => {
		const loadWorkerToken = () => {
			// Use flow-specific storage key
			const tokenStorageKey = 'pingone_worker_token_kroger-grocery-store-mfa';
			const tokenExpiryKey = 'pingone_worker_token_expires_at_kroger-grocery-store-mfa';

			const tokenResult = getValidWorkerToken(tokenStorageKey, tokenExpiryKey, {
				clearExpired: true,
				showToast: false,
			});

			if (tokenResult.isValid && tokenResult.token) {
				setWorkerToken(tokenResult.token);
				console.log('✅ [KrogerGroceryStoreMFA] Worker token loaded from storage');
			}
		};

		loadWorkerToken();

		const handleTokenUpdate = () => {
			loadWorkerToken();
		};

		window.addEventListener('workerTokenUpdated', handleTokenUpdate);

		return () => {
			window.removeEventListener('workerTokenUpdated', handleTokenUpdate);
		};
	}, []);

	// Fetch existing MFA devices for user (Step 11)
	const fetchExistingDevices = useCallback(async () => {
		if (!credentials.environmentId || !userId || !workerToken) {
			return;
		}

		try {
			const response = await trackedFetch(
				`/api/pingone/user/${userId}/mfa?environmentId=${credentials.environmentId}&accessToken=${encodeURIComponent(workerToken)}`,
				{
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
					},
				}
			);

			const data = (await response.json()) as { devices?: MfaDevice[] };
			if (response.ok && data.devices) {
				const smsDevices = data.devices.filter(
					(d: MfaDevice) => d.type === 'SMS' || d.type === 'MOBILE'
				);
				setMfaDevices(smsDevices);
				if (smsDevices.length > 0) {
					setSelectedDevice(smsDevices[0].id);
					setDeviceId(smsDevices[0].id);
				}
			}
		} catch (error) {
			console.error('[Kroger] Failed to fetch devices:', error);
		}
	}, [credentials.environmentId, userId, workerToken]);

	// Step 12-17: Complete MFA Login Flow (Authorization Code Flow - no worker token needed)
	const completeMFALogin = useCallback(async () => {
		if (!username || !password) {
			v4ToastManager.showError('Please enter username and password');
			return;
		}

		// Validate credentials before making API call
		if (!credentials.environmentId || !credentials.clientId || !credentials.clientSecret) {
			console.error('[Kroger] Missing credentials:', {
				hasEnvironmentId: !!credentials.environmentId,
				hasClientId: !!credentials.clientId,
				hasClientSecret: !!credentials.clientSecret,
				credentials,
			});
			v4ToastManager.showError(
				'Please configure application credentials first. Click "Configure Application Credentials" below the login form.'
			);
			return;
		}

		console.log('[Kroger] Starting login with credentials:', {
			environmentId: credentials.environmentId?.substring(0, 20) + '...',
			clientId: credentials.clientId?.substring(0, 20) + '...',
			hasClientSecret: !!credentials.clientSecret,
			redirectUri: credentials.redirectUri,
			scopes: credentials.scopes,
		});

		// Worker token is NOT needed for user login (Authorization Code flow)
		// Worker token is only needed for device registration (Step 11)

		setIsLoading(true);
		try {
			// Step 12: Send Authorize Request
			// Server expects camelCase: environmentId, clientId, clientSecret, redirectUri, scopes
			const authResponse = await trackedFetch(`/api/pingone/redirectless/authorize`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					environmentId: credentials.environmentId,
					clientId: credentials.clientId,
					clientSecret: credentials.clientSecret,
					redirectUri: credentials.redirectUri || 'https://localhost:3000/callback',
					scopes: credentials.scopes || 'openid profile email consents',
					responseType: 'code',
					responseMode: 'pi.flow',
				}),
			});

			const authData = await authResponse.json();
			if (!authResponse.ok || !authData.flowId) {
				throw new Error(authData.error_description || authData.error || 'Failed to initiate login');
			}

			const currentFlowId = authData.flowId;
			setFlowId(currentFlowId);

			// Step 13: Get the Flow (automatic)
			const flowResponse = await trackedFetch(`/api/pingone/flows/${currentFlowId}`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				},
			});

			if (!flowResponse.ok) {
				throw new Error('Failed to get flow');
			}

			// Step 14: Submit Login Credentials
			const loginResponse = await trackedFetch(`/api/pingone/flows/check-username-password`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					flowUrl: `https://auth.pingone.com/${credentials.environmentId}/flows/${currentFlowId}`,
					username: username,
					password: password,
				}),
			});

			const loginData = await loginResponse.json();
			if (!loginResponse.ok) {
				throw new Error(loginData.error_description || loginData.error || 'Invalid credentials');
			}

			// Show MFA challenge
			setShowMFAChallenge(true);
			setLoginStep('mfa');
			v4ToastManager.showInfo('Please check your phone for the verification code');
			setIsLoading(false);
		} catch (error) {
			console.error('[Kroger] Login failed:', error);
			v4ToastManager.showError(error instanceof Error ? error.message : 'Login failed');
			setIsLoading(false);
		}
	}, [credentials, username, password, workerToken]);

	// Update ref when function changes
	useEffect(() => {
		completeMFALoginRef.current = completeMFALogin;
	}, [completeMFALogin]);

	useEffect(() => {
		if (!isAuthenticated || !credentials.environmentId || !tokens?.access_token) {
			return;
		}

		void fetchKrogerUserInfo();
	}, [isAuthenticated, credentials.environmentId, tokens, fetchKrogerUserInfo]);

	// Enable MFA Device
	const enableMFADevice = useCallback(
		async (deviceId: string): Promise<boolean> => {
			if (!credentials.environmentId || !userId || !workerToken) {
				v4ToastManager.showError('Missing required parameters for device enablement');
				return false;
			}

			try {
				const response = await trackedFetch(
					`/api/pingone/environments/${credentials.environmentId}/users/${userId}/devices/${deviceId}`,
					{
						method: 'PUT',
						headers: {
							'Content-Type': 'application/json',
							Authorization: `Bearer ${workerToken}`,
						},
						body: JSON.stringify({
							enabled: true,
						}),
					}
				);

				const data = await response.json();
				if (response.ok) {
					v4ToastManager.showSuccess('MFA device enabled successfully');
					return true;
				} else {
					throw new Error(data.error_description || data.error || 'Failed to enable MFA device');
				}
			} catch (error) {
				console.error('[Kroger] Device enablement failed:', error);
				v4ToastManager.showError(
					error instanceof Error ? error.message : 'Failed to enable MFA device'
				);
				return false;
			}
		},
		[credentials.environmentId, userId, workerToken]
	);

	// Step 11: Register Mobile Phone Device
	const registerMobilePhone = useCallback(async () => {
		if (!credentials.environmentId || !userId || !phoneNumber || !workerToken) {
			v4ToastManager.showError('Please provide all required information');
			return;
		}

		setIsLoading(true);
		try {
			const response = await trackedFetch(
				`/api/pingone/environments/${credentials.environmentId}/users/${userId}/devices`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${workerToken}`,
					},
					body: JSON.stringify({
						type: 'SMS',
						phone: phoneNumber,
						nickname: 'Mobile Phone',
					}),
				}
			);

			const data = await response.json();
			if (response.ok && data.id) {
				setDeviceId(data.id);
				// Step 11b: Enable the device
				const enabled = await enableMFADevice(data.id);
				if (enabled) {
					// Automatically start login flow after device is enabled
					setTimeout(() => {
						if (completeMFALoginRef.current) {
							completeMFALoginRef.current();
						}
					}, 500);
				}
			} else {
				throw new Error(data.error_description || data.error || 'Failed to register device');
			}
		} catch (error) {
			console.error('[Kroger] Device registration failed:', error);
			v4ToastManager.showError(
				error instanceof Error ? error.message : 'Failed to register device'
			);
			setIsLoading(false);
		}
	}, [credentials.environmentId, userId, phoneNumber, workerToken, enableMFADevice]);

	// Step 15-17: Complete MFA and Get Tokens
	const verifyMFACode = useCallback(async () => {
		if (!flowId || !mfaCode || !credentials.environmentId) {
			v4ToastManager.showError('Please enter the verification code');
			return;
		}

		setIsLoading(true);
		try {
			// Step 15: Submit MFA Credentials
			const mfaResponse = await trackedFetch(`/api/pingone/flows/${flowId}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					action: 'mfa.check',
					code: mfaCode,
				}),
			});

			const mfaData = await mfaResponse.json();
			if (!mfaResponse.ok) {
				throw new Error(mfaData.error_description || mfaData.error || 'Invalid verification code');
			}

			// Step 16: Call Resume Endpoint
			const resumeResponse = await trackedFetch(
				`/api/pingone/resume?flowId=${flowId}&environment_id=${credentials.environmentId}`,
				{
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
					},
				}
			);

			const resumeData = await resumeResponse.json();
			if (!resumeResponse.ok || !resumeData.code) {
				throw new Error(
					resumeData.error_description || resumeData.error || 'Failed to get authorization code'
				);
			}

			setAuthorizationCode(resumeData.code);

			// Step 17: Generate Access Token
			// Token exchange endpoint expects snake_case: environment_id, client_id, client_secret, redirect_uri
			const tokenResponse = await trackedFetch('/api/token-exchange', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					grant_type: 'authorization_code',
					environment_id: credentials.environmentId,
					client_id: credentials.clientId,
					client_secret: credentials.clientSecret,
					code: resumeData.code,
					redirect_uri: credentials.redirectUri || 'https://localhost:3000/callback',
				}),
			});

			const tokenData = await tokenResponse.json();
			if (!tokenResponse.ok) {
				throw new Error(tokenData.error_description || tokenData.error || 'Failed to get tokens');
			}

			setTokens(tokenData);
			setIsAuthenticated(true);
			setShowMFAChallenge(false);
			setLoginStep('success');
			v4ToastManager.showSuccess('Login successful! Welcome to Kroger.');
			setIsLoading(false);
		} catch (error) {
			console.error('[Kroger] MFA verification failed:', error);
			v4ToastManager.showError(error instanceof Error ? error.message : 'Verification failed');
			setIsLoading(false);
		}
	}, [flowId, mfaCode, credentials]);

	// Handle login - check if device setup is needed first
	const handleLogin = async () => {
		if (!username || !password) {
			v4ToastManager.showError('Please enter username and password');
			return;
		}

		// Set userId from username for now (in real app, would look up user ID)
		setUserId(username);

		// Check if device setup is needed (only requires worker token for device registration)
		// For user login (AuthZ Code flow), worker token is NOT needed
		// Only check for devices if we have a worker token (optional - for device management)
		if (workerToken) {
			// Fetch existing devices (optional - only if worker token available)
			await fetchExistingDevices();

			// If no devices found and worker token available, offer device setup
			if (mfaDevices.length === 0 && !deviceId) {
				// Device setup requires worker token, but login doesn't
				// Show option to setup device or continue with login
				setShowDeviceSetup(true);
				setShowLoginModal(false);
				return;
			}

			// If device exists but not selected, select first one
			if (mfaDevices.length > 0 && !deviceId) {
				setDeviceId(mfaDevices[0].id);
				setSelectedDevice(mfaDevices[0].id);
			}
		}

		// Start login flow (Authorization Code flow - no worker token needed)
		setShowLoginModal(false);
		await completeMFALogin();
	};

	// Handle device setup completion
	const handleDeviceSetupComplete = async () => {
		if (!phoneNumber) {
			v4ToastManager.showError('Please enter a phone number');
			return;
		}

		await registerMobilePhone();
	};

	// Handle MFA code submission
	const handleMFASubmit = async () => {
		if (!mfaCode || mfaCode.length !== 6) {
			v4ToastManager.showError('Please enter a valid 6-digit code');
			return;
		}

		await verifyMFACode();
	};

	// Show login page first if not authenticated
	if (!isAuthenticated) {
		return (
			<PageContainer>
				<Header>
					<HeaderContent>
						<Logo>
							<FiShoppingCart />
							Kroger Marketplace
						</Logo>
						<SearchBar>
							<FiSearch />
							<input
								type="text"
								placeholder="Search fresh groceries, bakery, and more"
								aria-label="Search products"
							/>
						</SearchBar>
						<HeaderActions>
							<HeaderButton type="button">
								<FiHeart />
								<span>Favorites</span>
							</HeaderButton>
							<HeaderButton type="button">
								<FiUser />
								<span>Account</span>
							</HeaderButton>
						</HeaderActions>
					</HeaderContent>
				</Header>

				<MainContent style={{ paddingTop: '2rem' }}>
					<HeroBanner>
						<h1>Shop Kroger with Secure MFA</h1>
						<p>
							Experience the enhanced PingOne MFA journey while browsing exclusive Kroger deals.
						</p>
					</HeroBanner>

					<LoginPageContainer onClick={(e) => e.stopPropagation()}>
						<ModalHeader>
							<h2>Sign In to Kroger</h2>
						</ModalHeader>

						<FormGroup>
							<label>Username</label>
							<input
								type="text"
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								placeholder="Enter your username"
							/>
						</FormGroup>

						<FormGroup>
							<label>Password</label>
							<input
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="Enter your password"
								onKeyDown={(e) => {
									if (e.key === 'Enter' && !isLoading && username && password) {
										handleLogin();
									}
								}}
							/>
						</FormGroup>

						<LoginButton onClick={handleLogin} disabled={isLoading || !username || !password}>
							{isLoading ? 'Signing In...' : 'Sign In'}
						</LoginButton>

						<div
							style={{
								marginTop: '1rem',
								fontSize: '0.875rem',
								color: '#666',
								textAlign: 'center',
							}}
						>
							<p style={{ margin: '0.5rem 0', color: '#999' }}>
								Don't have an account?{' '}
								<a href="#" style={{ color: KROGER_BLUE, textDecoration: 'none' }}>
									Sign up
								</a>
							</p>
							<div
								style={{
									display: 'flex',
									flexDirection: 'column',
									gap: '0.5rem',
									alignItems: 'center',
								}}
							>
								<button
									onClick={() => {
										setShowAuthzConfigModal(true);
									}}
									style={{
										background: 'none',
										border: 'none',
										color: KROGER_BLUE,
										cursor: 'pointer',
										textDecoration: 'underline',
										fontSize: '0.875rem',
										marginTop: '0.5rem',
									}}
								>
									Configure Authorization Code Credentials
								</button>
								<button
									onClick={() => {
										const FLOW_TYPE = 'kroger-grocery-store-mfa';
										const tokenStorageKey = `pingone_worker_token_${FLOW_TYPE}`;
										const tokenExpiryKey = `pingone_worker_token_expires_at_${FLOW_TYPE}`;

										// Check if we already have a valid worker token
										const tokenResult = getValidWorkerToken(tokenStorageKey, tokenExpiryKey, {
											clearExpired: true,
											showToast: false,
										});

										if (tokenResult.isValid && tokenResult.token) {
											v4ToastManager.showSuccess(
												`Worker token is valid and expires in ${tokenResult.expirationInfo?.minutesRemaining || 0} minutes`
											);
											setWorkerToken(tokenResult.token);
											return;
										}

										// No valid token - show modal to configure/generate
										setShowWorkerTokenModal(true);
									}}
									style={{
										background: 'none',
										border: 'none',
										color: KROGER_BLUE,
										cursor: 'pointer',
										textDecoration: 'underline',
										fontSize: '0.875rem',
									}}
								>
									Configure Worker Token Credentials
								</button>
							</div>
						</div>
					</LoginPageContainer>

					{/* API Call Table - Independent, wider container */}
					<ApiCallTableContainer>
						<ApiCallTable
							apiCalls={apiCalls}
							onClear={() => apiCallTrackerService.clearApiCalls()}
						/>
					</ApiCallTableContainer>
				</MainContent>

				{/* MFA Challenge Modal */}
				<ModalOverlay $isOpen={showMFAChallenge} onClick={() => {}}>
					<MFAChallengeModal onClick={(e) => e.stopPropagation()}>
						<MFAChallengeContent>
							<div className="icon">
								<FiLock />
							</div>
							<h3>Verify Your Identity</h3>
							<p>
								We've sent a verification code to your registered device. Please enter the 6-digit
								code to continue.
							</p>
							<input
								type="text"
								maxLength={6}
								value={mfaCode}
								onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
								placeholder="000000"
								disabled={isLoading}
								onKeyDown={(e) => {
									if (e.key === 'Enter' && !isLoading && mfaCode.length === 6) {
										handleMFASubmit();
									}
								}}
								autoFocus
							/>
							<LoginButton onClick={handleMFASubmit} disabled={isLoading || mfaCode.length !== 6}>
								{isLoading ? 'Verifying...' : 'Verify & Continue'}
							</LoginButton>
							{isLoading && (
								<p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#666' }}>
									Please wait while we verify your code...
								</p>
							)}
						</MFAChallengeContent>
					</MFAChallengeModal>
				</ModalOverlay>

				{/* Setup Modal - Shows when authorization code credentials are not configured */}
				<ModalOverlay $isOpen={showSetupModal} onClick={() => {}}>
					<LoginModal onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
						<ModalHeader>
							<h2>Configuration Required</h2>
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
						</ModalHeader>

						<div style={{ marginBottom: '1.5rem' }}>
							<p style={{ color: '#4b5563', lineHeight: '1.6', marginBottom: '1rem' }}>
								The Kroger Grocery Store MFA flow requires authorization code credentials to be
								configured. Please configure your PingOne authorization code client credentials to
								continue.
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
							<button
								onClick={() => setShowSetupModal(false)}
								style={{
									padding: '0.75rem 1.5rem',
									background: 'transparent',
									color: KROGER_BLUE,
									border: `2px solid ${KROGER_BLUE}`,
									borderRadius: '8px',
									fontSize: '1rem',
									fontWeight: 600,
									cursor: 'pointer',
									transition: 'background 0.2s, color 0.2s',
								}}
								onMouseEnter={(e) => {
									e.currentTarget.style.background = KROGER_BLUE;
									e.currentTarget.style.color = 'white';
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.background = 'transparent';
									e.currentTarget.style.color = KROGER_BLUE;
								}}
							>
								Cancel
							</button>
							<button
								onClick={() => {
									setShowSetupModal(false);
									setShowAuthzConfigModal(true);
								}}
								style={{
									padding: '0.75rem 1.5rem',
									background: KROGER_BLUE,
									color: 'white',
									border: 'none',
									borderRadius: '8px',
									fontSize: '1rem',
									fontWeight: 600,
									cursor: 'pointer',
									transition: 'opacity 0.2s',
								}}
								onMouseEnter={(e) => {
									e.currentTarget.style.opacity = '0.9';
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.opacity = '1';
								}}
							>
								Configure Authorization Code Client
							</button>
						</div>
					</LoginModal>
				</ModalOverlay>

				{/* Authorization Code Config Modal */}
				<AuthorizationCodeConfigModal
					isOpen={showAuthzConfigModal}
					onClose={() => {
						setShowAuthzConfigModal(false);

						// Reload saved credentials after modal closes
						const FLOW_KEY = 'kroger-grocery-store-mfa';
						const saved = comprehensiveFlowDataService.loadFlowCredentialsIsolated(FLOW_KEY);

						if (saved && saved.environmentId && saved.clientId && saved.clientSecret) {
							console.log(
								'✅ [KrogerGroceryStoreMFA] Credentials found after save, updating state...'
							);
							setCredentials({
								environmentId: saved.environmentId || '',
								clientId: saved.clientId || '',
								clientSecret: saved.clientSecret || '',
								redirectUri: saved.redirectUri || 'https://localhost:3000/callback',
								scopes: Array.isArray(saved.scopes)
									? saved.scopes.join(' ')
									: saved.scopes || 'openid profile email consents',
							});
							// Close setup modal if it was open
							setShowSetupModal(false);
						}
					}}
					flowType="kroger-grocery-store-mfa"
					initialCredentials={credentials}
					onCredentialsSaved={(savedCredentials) => {
						// Update credentials state immediately
						// onClose callback will reload from storage to ensure consistency
						setCredentials(savedCredentials);
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

				{/* Worker Token Modal */}
				<WorkerTokenModal
					isOpen={showWorkerTokenModal}
					onClose={() => {
						setShowWorkerTokenModal(false);
						// After worker token modal closes, check if we need to show setup modal for authz code credentials
						setTimeout(() => {
							const isolatedCreds =
								comprehensiveFlowDataService.loadFlowCredentialsIsolated(FLOW_KEY);
							if (
								!isolatedCreds ||
								!isolatedCreds.environmentId ||
								!isolatedCreds.clientId ||
								!isolatedCreds.clientSecret
							) {
								console.log(
									'⚠️ [KrogerGroceryStoreMFA] Still missing authorization code credentials after worker token modal closed, showing setup modal...'
								);
								setShowSetupModal(true);
							}
						}, 200);
					}}
					onContinue={() => {
						setShowWorkerTokenModal(false);

						// Re-check for saved credentials and worker token after modal closes
						const FLOW_TYPE = 'kroger-grocery-store-mfa';
						const savedCreds = workerTokenCredentialsService.loadCredentials(FLOW_TYPE);

						if (
							savedCreds &&
							savedCreds.environmentId &&
							savedCreds.clientId &&
							savedCreds.clientSecret
						) {
							console.log(
								'✅ [KrogerGroceryStoreMFA] Credentials found after save, checking for token...'
							);

							// Re-check worker token after modal closes
							const tokenStorageKey = `pingone_worker_token_${FLOW_TYPE}`;
							const tokenExpiryKey = `pingone_worker_token_expires_at_${FLOW_TYPE}`;
							const tokenResult = getValidWorkerToken(tokenStorageKey, tokenExpiryKey, {
								clearExpired: true,
								showToast: false,
							});
							if (tokenResult.isValid && tokenResult.token) {
								setWorkerToken(tokenResult.token);
							}
						} else {
							console.log('⚠️ [KrogerGroceryStoreMFA] No credentials found after save');
						}
					}}
					flowType="kroger-grocery-store-mfa"
					environmentId={credentials.environmentId || ''}
					prefillCredentials={(() => {
						// Load saved worker token credentials (these are separate from Authorization Code credentials)
						const savedWorkerTokenCreds = workerTokenCredentialsService.loadCredentials(
							'kroger-grocery-store-mfa'
						);

						if (savedWorkerTokenCreds) {
							// Use saved worker token credentials
							let workerScopes = '';
							if (savedWorkerTokenCreds.scopes) {
								const savedScopes = Array.isArray(savedWorkerTokenCreds.scopes)
									? savedWorkerTokenCreds.scopes.join(' ')
									: savedWorkerTokenCreds.scopes;
								const scopeArray = savedScopes.split(/\s+/).filter(Boolean);
								workerScopes = scopeArray.length > 0 ? scopeArray[0] : '';
							}

							return {
								environmentId: savedWorkerTokenCreds.environmentId || '',
								clientId: savedWorkerTokenCreds.clientId || '',
								clientSecret: savedWorkerTokenCreds.clientSecret || '',
								region: savedWorkerTokenCreds.region || 'us',
								scopes: workerScopes,
								authMethod: savedWorkerTokenCreds.tokenEndpointAuthMethod || 'client_secret_post',
							};
						}

						// No saved worker token credentials - return empty
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
			</PageContainer>
		);
	}

	// Show dashboard after authentication
	return (
		<PageContainer>
			<MainContent style={{ paddingTop: '2rem' }}>
				<PortalDashboard>
					<DashboardHeader
						style={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							marginBottom: '2rem',
							paddingBottom: '1rem',
							borderBottom: `2px solid ${KROGER_LIGHT}`,
						}}
					>
						<div>
							<h2 style={{ fontSize: '2rem', color: KROGER_DARK, margin: 0 }}>
								Welcome back, {username}!
							</h2>
							<p
								style={{
									fontSize: '1.125rem',
									color: '#666',
									marginTop: '0.5rem',
									marginBottom: 0,
								}}
							>
								You've successfully logged in with MFA! This is your Kroger portal dashboard.
							</p>
						</div>
						<button
							onClick={() => {
								setIsAuthenticated(false);
								setTokens(null);
								setAuthorizationCode('');
								setFlowId('');
								setDeviceId('');
								setMfaCode('');
								setPassword('');
							}}
							style={{
								padding: '0.75rem 1.5rem',
								background: KROGER_BLUE,
								color: 'white',
								border: 'none',
								borderRadius: '4px',
								fontSize: '1rem',
								fontWeight: 600,
								cursor: 'pointer',
								transition: 'background 0.2s',
							}}
						>
							Sign Out
						</button>
					</DashboardHeader>

					<ProductsGrid>
						{MOCK_PRODUCTS.map((product) => (
							<ProductCard key={product.id}>
								<div style={{ fontSize: '4rem', textAlign: 'center', marginBottom: '1rem' }}>
									{product.image}
								</div>
								<h3>{product.name}</h3>
								<div className="price">{product.price}</div>
								<button>Add to Cart</button>
							</ProductCard>
						))}
					</ProductsGrid>

					<ConfigSection>
						<details>
							<summary onClick={() => setShowConfig(!showConfig)}>
								Configuration (Click to expand)
							</summary>
							<div style={{ marginTop: '1rem' }}>
								<ComprehensiveCredentialsService
									flowType="kroger-grocery-store-mfa"
									credentials={credentials}
									onCredentialsChange={handleCredentialsChange}
									onDiscoveryComplete={handleDiscoveryComplete}
									onEnvironmentIdChange={(envId) => {
										setCredentials((prev) => ({ ...prev, environmentId: envId }));
									}}
								/>
							</div>
						</details>
					</ConfigSection>

					{/* API Call Table - Dashboard */}
					<ApiCallTable apiCalls={apiCalls} onClear={() => apiCallTrackerService.clearApiCalls()} />
				</PortalDashboard>
			</MainContent>
		</PageContainer>
	);
};

export default KrogerGroceryStoreMFA;
