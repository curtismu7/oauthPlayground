import { V9_COLORS } from '../../services/v9/V9ColorStandards';
// src/pages/flows/KrogerGroceryStoreMFA.tsx
// Kroger Grocery Store Mockup - Real-world MFA authentication experience
// This page demonstrates PingOne MFA in a realistic grocery store website context

// No React Icons import - using MDI icons instead
import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { modernMessaging } from '@/services/v9/V9ModernMessagingService';
import { logger } from '@/utils/logger';
import type { DiscoveredApp } from '@/v8/components/AppPickerV8';
import { CompactAppPickerV8U } from '@/v8u/components/CompactAppPickerV8U';
import { ApiCallTable } from '../../components/ApiCallTable';
import { AuthorizationCodeConfigModal } from '../../components/AuthorizationCodeConfigModal';
import type { StepCredentials } from '../../components/steps/CommonSteps';
import { usePageScroll } from '../../hooks/usePageScroll';
import type { ApiCall } from '../../services/apiCallTrackerService';
import { apiCallTrackerService } from '../../services/apiCallTrackerService';
import ComprehensiveCredentialsService from '../../services/comprehensiveCredentialsService';
import { comprehensiveFlowDataService } from '../../services/comprehensiveFlowDataService';
import { getValidWorkerToken } from '../../services/tokenExpirationService';
import { workerTokenCredentialsService } from '../../services/workerTokenCredentialsService';
import type { UserInfo } from '../../types/oauth';
import { trackedFetch } from '../../utils/trackedFetch';

// Kroger Brand Colors
const KROGER_BLUE = '#0058A8';
const KROGER_DARK = '#0B2142';
const KROGER_LIGHT = '#F5F7FA';
const KROGER_GREEN = '#00A651'; // For success states

// Styled Components
const PageContainer = styled.div`
	min-height: 100vh;
	background: ${KROGER_LIGHT};
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
`;

const MainContent = styled.main`
	max-width: 1400px;
	margin: 0 auto;
	padding: 2rem;
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
	// Scroll to top on page load
	usePageScroll({ pageName: 'Kroger Grocery Store MFA', force: true });

	const [showLoginModal, setShowLoginModal] = useState(false);
	const [showMFAChallenge, setShowMFAChallenge] = useState(false);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [username, setUsername] = useState('curtis7');
	const [password, setPassword] = useState('');
	const [mfaCode, setMfaCode] = useState('');
	const [, setShowWorkerTokenModal] = useState(false);
	const [showAuthzConfigModal, setShowAuthzConfigModal] = useState(false);
	const [showSetupModal, setShowSetupModal] = useState(false);
	const [credentials, setCredentials] = useState<StepCredentials>({
		environmentId: '',
		clientId: '',
		clientSecret: '',
		redirectUri: 'https://localhost:3000/callback',
		scopes: 'openid profile email consents',
	});
	const [mfaDevices, setMfaDevices] = useState<MfaDevice[]>([]);
	const [, setSelectedDevice] = useState<string | null>(null);
	const [showConfig, setShowConfig] = useState(false);
	const [, setUserInfo] = useState<UserInfo | null>(null);
	const [, setUserInfoLoading] = useState(false);
	const [, setUserInfoError] = useState<string | null>(null);

	// MFA Workflow State (Steps 11-20)
	const [userId, setUserId] = useState('');
	const [deviceId, setDeviceId] = useState('');
	const [flowId, setFlowId] = useState('');
	const [, setAuthorizationCode] = useState('');
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const [tokens, setTokens] = useState<any>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [, setLoginStep] = useState<'login' | 'device-setup' | 'mfa' | 'success'>('login');
	const [workerToken, setWorkerToken] = useState('');

	// API Call Tracking
	const [apiCalls, setApiCalls] = useState<ApiCall[]>([]);

	// Use refs to avoid circular dependency issues in useCallback
	const completeMFALoginRef = useRef<(() => Promise<void>) | null>(null);

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
				logger.info('KrogerGroceryStoreMFA', 'Valid worker token found, not showing modal');
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
				logger.info('KrogerGroceryStoreMFA', 'No worker token credentials found, showing modal...');
				setShowWorkerTokenModal(true);
			}
		};

		checkWorkerToken();
	}, []);

	// Load credentials on mount
	useEffect(() => {
		const loadCredentials = () => {
			logger.info('KrogerGroceryStoreMFA', 'Loading credentials...');

			// First, check isolated credentials directly
			const isolatedCreds = comprehensiveFlowDataService.loadFlowCredentialsIsolated(FLOW_KEY);
			logger.info('KrogerGroceryStoreMFA', 'Isolated credentials:', isolatedCreds);

			const flowData = comprehensiveFlowDataService.loadFlowDataComprehensive({
				flowKey: FLOW_KEY,
				useSharedEnvironment: true,
				useSharedDiscovery: true,
			});

			// Determine if we have complete credentials
			const hasCompleteCredentials =
				isolatedCreds?.environmentId && isolatedCreds.clientId && isolatedCreds.clientSecret;

			if (hasCompleteCredentials) {
				logger.info('KrogerGroceryStoreMFA', 'Found complete authorization code credentials');
				const envId =
					flowData.sharedEnvironment?.environmentId || isolatedCreds.environmentId || '';
				const loadedCreds = {
					environmentId: envId,
					clientId: isolatedCreds.clientId || '',
					clientSecret: isolatedCreds.clientSecret || '',
					redirectUri: isolatedCreds.redirectUri || 'https://localhost:3000/callback',
					scopes: Array.isArray(isolatedCreds.scopes)
						? isolatedCreds.scopes
						: typeof isolatedCreds.scopes === 'string'
							? isolatedCreds.scopes.split(/\s+/).filter(Boolean)
							: [],
				};
				setCredentials(loadedCreds);
			} else if (flowData.flowCredentials && Object.keys(flowData.flowCredentials).length > 0) {
				logger.info('KrogerGroceryStoreMFA', 'Found flow-specific credentials (may be incomplete)');
				const envId =
					flowData.sharedEnvironment?.environmentId || flowData.flowCredentials.environmentId || '';
				const loadedCreds = {
					environmentId: envId,
					clientId: flowData.flowCredentials.clientId || '',
					clientSecret: flowData.flowCredentials.clientSecret || '',
					redirectUri: flowData.flowCredentials.redirectUri || 'https://localhost:3000/callback',
					scopes: Array.isArray(flowData.flowCredentials.scopes)
						? flowData.flowCredentials.scopes
						: typeof flowData.flowCredentials.scopes === 'string'
							? flowData.flowCredentials.scopes.split(/\s+/).filter(Boolean)
							: [],
				};
				setCredentials(loadedCreds);

				// Check if credentials are complete
				if (!loadedCreds.environmentId || !loadedCreds.clientId || !loadedCreds.clientSecret) {
					logger.info(
						'KrogerGroceryStoreMFA',
						'Incomplete authorization code credentials, showing setup modal...'
					);
					// Delay showing modal slightly to ensure component is fully mounted
					setTimeout(() => setShowSetupModal(true), 100);
				}
			} else if (flowData.sharedEnvironment?.environmentId) {
				logger.info('KrogerGroceryStoreMFA', 'Using shared environment data only');
				const envId = flowData.sharedEnvironment.environmentId;
				setCredentials((prev) => ({
					...prev,
					environmentId: envId,
				}));

				// Check if we still need client credentials
				if (!isolatedCreds || !isolatedCreds.clientId || !isolatedCreds.clientSecret) {
					logger.info(
						'KrogerGroceryStoreMFA',
						'Missing client credentials, showing setup modal...'
					);
					// Delay showing modal slightly to ensure component is fully mounted
					setTimeout(() => setShowSetupModal(true), 100);
				}
			} else {
				// No credentials at all
				logger.info('KrogerGroceryStoreMFA', 'No credentials found, showing setup modal...');
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

	// Handle app selection from CompactAppPickerV8U
	const handleAppSelected = (app: DiscoveredApp) => {
		const updatedCredentials = {
			...credentials,
			clientId: app.id, // Use app.id as clientId (standard pattern)
		};
		setCredentials(updatedCredentials);
		handleCredentialsChange(updatedCredentials);
	};

	// Handle OIDC discovery completion - ensure environment ID is saved
	const handleDiscoveryComplete = useCallback((result: { issuerUrl?: string }) => {
		logger.info('KrogerGroceryStoreMFA', 'OIDC Discovery completed:', result);

		// Extract environment ID from issuer URL
		if (result.issuerUrl) {
			const envIdMatch = result.issuerUrl.match(
				/\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i
			);
			if (envIdMatch?.[1]) {
				const extractedEnvId = envIdMatch[1];
				logger.info(
					'KrogerGroceryStoreMFA',
					'Extracted Environment ID from discovery:',
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
				logger.info('KrogerGroceryStoreMFA', 'Worker token loaded from storage');
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
		} catch {
			// Background device fetch — UI shows empty device list
		}
	}, [credentials.environmentId, userId, workerToken]);

	// Step 12-17: Complete MFA Login Flow (Authorization Code Flow - no worker token needed)
	const completeMFALogin = useCallback(async () => {
		if (!username || !password) {
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: 'Please enter username and password',
				dismissible: true,
			});
			return;
		}

		// Validate credentials before making API call
		if (!credentials.environmentId || !credentials.clientId || !credentials.clientSecret) {
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message:
					'Please configure application credentials first. Click "Configure Application Credentials" below the login form.',
				dismissible: true,
			});
			return;
		}

		logger.info('KrogerGroceryStoreMFA', 'Starting login with credentials:', {
			environmentId: `${credentials.environmentId?.substring(0, 20)}...`,
			clientId: `${credentials.clientId?.substring(0, 20)}...`,
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
			modernMessaging.showFooterMessage({
				type: 'info',
				message: 'Please check your phone for the verification code',
				duration: 3000,
			});
			setIsLoading(false);
		} catch (error) {
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: error instanceof Error ? error.message : 'Login failed',
				dismissible: true,
			});
			setIsLoading(false);
		}
	}, [credentials, username, password]);

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

	// Step 15-17: Complete MFA and Get Tokens
	const verifyMFACode = useCallback(async () => {
		if (!flowId || !mfaCode || !credentials.environmentId) {
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: 'Please enter the verification code',
				dismissible: true,
			});
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
			modernMessaging.showFooterMessage({
				type: 'info',
				message: 'Login successful! Welcome to Kroger.',
				duration: 3000,
			});
			setIsLoading(false);
		} catch (error) {
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: error instanceof Error ? error.message : 'Verification failed',
				dismissible: true,
			});
			setIsLoading(false);
		}
	}, [flowId, mfaCode, credentials]);

	// Handle login - check if device setup is needed first
	const handleLogin = async () => {
		if (!username || !password) {
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: 'Please enter username and password',
				dismissible: true,
			});
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

	// Handle MFA code submission
	const handleMFASubmit = async () => {
		if (!mfaCode || mfaCode.length !== 6) {
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: 'Please enter a valid 6-digit code',
				dismissible: true,
			});
			return;
		}

		await verifyMFACode();
	};

	// Show login page first if not authenticated
	if (!isAuthenticated) {
		return (
			<ModalOverlay $isOpen={!isAuthenticated} onClick={() => {}}>
				<LoginModal onClick={(e) => e.stopPropagation()}>
					<ModalHeader>
						<h2>Sign In to Kroger</h2>
						<button
							type="button"
							onClick={() => window.history.back()}
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
							Enter your Kroger credentials and MFA code to access the grocery store portal.
						</p>
					</div>

					<div style={{ marginBottom: '1rem' }}>
						<label
							style={{
								display: 'block',
								marginBottom: '0.5rem',
								fontWeight: '600',
								color: '#1f2937',
							}}
						>
							Username
						</label>
						<input
							type="text"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							placeholder="Enter your username"
							disabled={isLoading}
							style={{
								width: '100%',
								padding: '0.75rem',
								border: '2px solid V9_COLORS.TEXT.GRAY_LIGHTER',
								borderRadius: '8px',
								fontSize: '1rem',
								disabled: isLoading ? { opacity: 0.6, cursor: 'not-allowed' } : {},
							}}
						/>
					</div>

					<div style={{ marginBottom: '1rem' }}>
						<label
							style={{
								display: 'block',
								marginBottom: '0.5rem',
								fontWeight: '600',
								color: '#1f2937',
							}}
						>
							Password
						</label>
						<input
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="Enter your password"
							disabled={isLoading}
							style={{
								width: '100%',
								padding: '0.75rem',
								border: '2px solid V9_COLORS.TEXT.GRAY_LIGHTER',
								borderRadius: '8px',
								fontSize: '1rem',
								disabled: isLoading ? { opacity: 0.6, cursor: 'not-allowed' } : {},
							}}
						/>
					</div>

					<LoginButton onClick={handleLogin} disabled={isLoading || !username || !password}>
						{isLoading ? 'Logging in...' : 'Login with MFA'}
					</LoginButton>

					{isLoading && (
						<p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#666' }}>
							Please wait while we authenticate your credentials...
						</p>
					)}
				</LoginModal>
			</ModalOverlay>
		);
	}

	// Show MFA challenge modal if flow is initiated but not completed
	if (showMFAChallenge && flowId && !isAuthenticated) {
		return (
			<ModalOverlay $isOpen={showMFAChallenge} onClick={() => {}}>
				<MFAChallengeModal onClick={(e) => e.stopPropagation()}>
					<ModalHeader>
						<h2>Enter MFA Code</h2>
						<button
							onClick={() => setShowMFAChallenge(false)}
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

					<MFAChallengeContent>
						<p style={{ color: '#4b5563', lineHeight: '1.6', marginBottom: '1.5rem' }}>
							We've sent a 6-digit verification code to your registered device. Please enter it
							below to continue.
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
		);
	}

	// Show setup modal if credentials are not configured
	if (showSetupModal) {
		return (
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
		);
	}

	// Show authorization code config modal if needed
	if (showAuthzConfigModal) {
		return (
			<AuthorizationCodeConfigModal
				isOpen={showAuthzConfigModal}
				onClose={() => {
					setShowAuthzConfigModal(false);

					// Reload saved credentials after modal closes
					const FLOW_KEY = 'kroger-grocery-store-mfa';
					const saved = comprehensiveFlowDataService.loadFlowCredentialsIsolated(FLOW_KEY);

					if (saved?.environmentId && saved.clientId && saved.clientSecret) {
						logger.info('KrogerGroceryStoreMFA', 'Credentials found after save, updating state...');
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
								{/* App Picker for Quick Configuration */}
								<CompactAppPickerV8U
									environmentId={credentials.environmentId || ''}
									onAppSelected={handleAppSelected}
								/>

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
