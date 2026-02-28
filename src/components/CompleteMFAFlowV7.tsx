// src/components/CompleteMFAFlowV7.tsx
// Modern V7 MFA Flow - Complete PingOne MFA implementation with modern V7 UI
// Implements the full 8-step specification with real API integration

import React, { useCallback, useEffect, useState } from 'react';
import {
	FiAlertCircle,
	FiAlertTriangle,
	FiArrowLeft,
	FiArrowRight,
	FiCheckCircle,
	FiExternalLink,
	FiHash,
	FiInfo,
	FiKey,
	FiLogIn,
	FiPackage,
	FiRefreshCw,
	FiSend,
	FiShield,
	FiSmartphone,
	FiZap,
} from 'react-icons/fi';
import styled from 'styled-components';
import EnhancedFlowInfoCard from '../components/EnhancedFlowInfoCard';
import { StepNavigationButtons } from '../components/StepNavigationButtons';
import CollapsibleHeaderService from '../services/collapsibleHeaderService';
import ComprehensiveCredentialsService from '../services/comprehensiveCredentialsService';
import { FlowHeader } from '../services/flowHeaderService';
import FlowUIService from '../services/flowUIService';
import { oidcDiscoveryService } from '../services/oidcDiscoveryService';

import type { MfaCredentials, MfaDevice } from '../services/pingOneMfaService';

// Extended credentials interface for the complete MFA flow
interface CompleteMfaCredentials extends MfaCredentials {
	clientId: string;
	clientSecret: string;
	redirectUri?: string;
	region?: 'us' | 'eu' | 'ap' | 'ca';
	username?: string;
	password?: string;
	accessToken?: string;
	refreshToken?: string;
	idToken?: string;
	tokenEndpointAuthMethod?:
		| 'none'
		| 'client_secret_basic'
		| 'client_secret_post'
		| 'client_secret_jwt'
		| 'private_key_jwt';
}

import DeviceRegistrationModal from '../components/DeviceRegistrationModal';
import { EnhancedApiCallDisplay } from '../components/EnhancedApiCallDisplay';
import FIDO2RegistrationModal from '../components/FIDO2RegistrationModal';
import LoginSuccessModal from '../components/LoginSuccessModal';
import PhoneNumberInput from '../components/PhoneNumberInput';
import TOTPQRCodeModal from '../components/TOTPQRCodeModal';
import { AuthenticationModalService } from '../services/authenticationModalService';
import { ClientCredentialsTokenRequest } from '../services/clientCredentialsSharedService';
import {
	type EnhancedApiCallData,
	EnhancedApiCallDisplayService,
} from '../services/enhancedApiCallDisplayService';
import NetworkStatusService, { type NetworkStatus } from '../services/networkStatusService';
import {
	type OAuthErrorDetails,
	OAuthErrorHandlingService,
} from '../services/oauthErrorHandlingService';
import SecurityMonitoringService from '../services/securityMonitoringService';
import V7StepperService from '../services/v7StepperService';
import {
	type WorkerTokenCredentials,
	workerTokenCredentialsService,
} from '../services/workerTokenCredentialsService';
import credentialManager from '../utils/credentialManager';
import { v4ToastManager } from '../utils/v4ToastMessages';
import OAuthErrorDisplay from './OAuthErrorDisplay';

export interface CompleteMFAFlowProps {
	requireMFA?: boolean;
	maxRetries?: number;
	onFlowComplete?: (result: {
		success: boolean;
		session?: unknown;
		tokens?: unknown;
		error?: string;
	}) => void;
	onFlowError?: (error: string, context?: Record<string, unknown>) => void;
	onStepChange?: (step: string, data?: Record<string, unknown>) => void;
	showNetworkStatus?: boolean;
}

type FlowStep =
	| 'username_login'
	| 'mfa_enrollment'
	| 'device_pairing'
	| 'mfa_challenge'
	| 'token_retrieval'
	| 'success'
	| 'error';

interface FlowContext {
	flowId: string;
	authCredentials?: {
		userId: string;
		accessToken?: string;
		refreshToken?: string;
	};
	mfaCredentials?: MfaCredentials;
	userDevices: MfaDevice[];
	selectedDevice?: MfaDevice | undefined;
	session?: Record<string, unknown> | undefined;
	tokens?:
		| {
				access_token?: string;
				refresh_token?: string;
				id_token?: string;
				token_type?: string;
				expires_in?: number;
		  }
		| undefined;
	networkStatus: NetworkStatus;
	error?: string | undefined;
	username?: string;
	workerToken?: string;
	userId?: string;
	authCode?: string;
	state?: string;
	// PingOne flow response properties
	resumeUrl?: string;
	flowEnvironment?: Record<string, unknown> | undefined;
	flowLinks?: Record<string, unknown> | undefined;
	flowEmbedded?:
		| {
				user?: {
					id?: string;
					username?: string;
				};
				[key: string]: unknown;
		  }
		| undefined;
}

const MFA_CREDENTIALS_STORAGE_KEY = 'pingone_complete_mfa_v7_credentials';

// Get UI components from FlowUIService (same as Implicit V7)
const StepContentWrapper = FlowUIService.getStepContentWrapper();

// V7Stepper components for consistent navigation
const {
	StepHeader,
	StepHeaderLeft,
	StepHeaderRight,
	StepHeaderTitle,
	StepHeaderSubtitle,
	StepNumber,
	StepTotal,
	NavigationButton,
} = V7StepperService.createStepLayout({ theme: 'blue', showProgress: true });

// Step metadata for V5Stepper
const stepMetadata = [
	{
		id: 'username_login',
		title: 'User Authentication',
		subtitle: 'Enter your credentials to authenticate with PingOne',
	},
	{
		id: 'mfa_enrollment',
		title: 'MFA Device Enrollment',
		subtitle: 'Set up your multi-factor authentication device',
	},
	{
		id: 'device_pairing',
		title: 'Device Registration',
		subtitle: 'Register your MFA device with PingOne',
	},
	{
		id: 'mfa_challenge',
		title: 'MFA Challenge',
		subtitle: 'Complete the multi-factor authentication challenge',
	},
	{ id: 'token_retrieval', title: 'Token Retrieval', subtitle: 'Obtain your access tokens' },
	{
		id: 'success',
		title: 'Authentication Complete',
		subtitle: 'You have successfully completed the MFA flow',
	},
];

// Modern V7 Layout Components
const Container = styled.div`
  min-height: 100vh;
  background-color: #f9fafb;
  padding: 2rem 0 6rem;
`;

const ContentWrapper = styled.div`
  max-width: 64rem;
  margin: 0 auto;
  padding: 0 1rem;
`;

const MainCard = styled.div`
  background-color: #ffffff;
  border-radius: 1rem;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.1);
  border: 1px solid #e2e8f0;
  overflow: hidden;
`;

const InfoBox = styled.div<{ $variant: 'info' | 'success' | 'warning' | 'error' }>`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-radius: 0.75rem;
  margin: 1rem 0;

  ${(props) => {
		switch (props.$variant) {
			case 'success':
				return `
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #166534;
        `;
			case 'warning':
				return `
          background: #fffbeb;
          border: 1px solid #fed7aa;
          color: #92400e;
        `;
			case 'error':
				return `
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #991b1b;
        `;
			default:
				return `
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          color: #1e40af;
        `;
		}
	}}
`;

const InfoContent = styled.div`
  flex: 1;
`;

const InfoTitle = styled.div`
  font-weight: 600;
  margin-bottom: 0.5rem;
`;

const InfoText = styled.div`
  font-size: 0.875rem;
  line-height: 1.5;
`;

const SpinningIcon = styled.div`
  animation: spin 1s linear infinite;

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  ${(props) => {
		switch (props.$variant) {
			case 'primary':
				return `
          background: #3b82f6;
          color: white;
          &:hover:not(:disabled) { background: #2563eb; }
        `;
			case 'danger':
				return `
          background: #ef4444;
          color: white;
          &:hover:not(:disabled) { background: #dc2626; }
        `;
			default:
				return `
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
          &:hover:not(:disabled) { background: #e5e7eb; }
        `;
		}
	}}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export const CompleteMFAFlowV7: React.FC<CompleteMFAFlowProps> = ({
	requireMFA: _requireMFA = true,
	maxRetries = 3,
	onFlowComplete: _onFlowComplete,
	onFlowError: _onFlowError,
	onStepChange,
	showNetworkStatus: _showNetworkStatus = true,
}) => {
	const [currentStep, setCurrentStep] = useState<FlowStep>('username_login');
	const [currentStepNumber, setCurrentStepNumber] = useState(1); // For V5Stepper
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [errorDetails, setErrorDetails] = useState<OAuthErrorDetails | null>(null);
	const [retryCount, setRetryCount] = useState(0);
	const [_isSaving, setIsSaving] = useState(false);
	const [_hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
	const [hasUnsavedWorkerTokenChanges, setHasUnsavedWorkerTokenChanges] = useState(false);
	const [hasUnsavedAuthCodeChanges, setHasUnsavedAuthCodeChanges] = useState(false);

	// These are used in ComprehensiveCredentialsService callbacks
	void hasUnsavedWorkerTokenChanges;
	void hasUnsavedAuthCodeChanges;

	// Device registration state
	const [selectedDeviceType, setSelectedDeviceType] = useState<string>('');
	const [deviceInfo, setDeviceInfo] = useState({
		phoneNumber: '',
		email: '',
		deviceName: '',
		verificationCode: '',
	});
	const [selectedCountryCode, setSelectedCountryCode] = useState('+1');

	// Device Registration Modal state
	const [showDeviceRegistrationModal, setShowDeviceRegistrationModal] = useState(false);
	const [registeredDeviceData, setRegisteredDeviceData] = useState<{
		deviceId: string;
		deviceType: string;
		deviceName: string;
		contactInfo: string;
		status: 'pending' | 'active' | 'inactive';
		registeredAt: string;
	} | null>(null);

	// TOTP QR Code modal state
	const [showTOTPQRCodeModal, setShowTOTPQRCodeModal] = useState(false);

	// FIDO2 registration modal state
	const [showFIDO2RegistrationModal, setShowFIDO2RegistrationModal] = useState(false);

	// MFA Challenge state
	const [mfaChallenge, setMfaChallenge] = useState<{
		challengeId?: string;
		challengeType?: 'SMS' | 'EMAIL' | 'TOTP' | 'VOICE' | 'FIDO2' | 'MOBILE';
		challengeCode?: string;
		isChallengeSent?: boolean;
		challengeStatus?: 'pending' | 'completed' | 'failed';
		selectedDevice?: MfaDevice;
	}>({});

	// Map FlowStep to step number for V5Stepper
	const getStepNumber = useCallback((step: FlowStep): number => {
		const stepMap: Record<FlowStep, number> = {
			username_login: 1,
			mfa_enrollment: 2,
			device_pairing: 3,
			mfa_challenge: 4,
			token_retrieval: 5,
			success: 6,
			error: 6,
		};
		return stepMap[step] || 1;
	}, []);

	// Reset flow function - same pattern as other flows
	const handleResetFlow = useCallback(() => {
		console.log('🔄 [MFA Flow V7] Resetting flow to initial state');

		// Reset to first step
		setCurrentStep('username_login');
		onStepChange?.('username_login');

		// Reset all flow state - including redirectless flow context
		setFlowContext({
			flowId: '',
			authCredentials: { userId: '' },
			mfaCredentials: { userId: '', workerToken: '', environmentId: '' },
			userDevices: [],
			selectedDevice: undefined as MfaDevice | undefined,
			session: undefined,
			tokens: undefined,
			networkStatus: { online: true },
			error: undefined,
			// Clear redirectless flow specific state
			resumeUrl: '',
			flowEnvironment: undefined,
			flowLinks: undefined,
			flowEmbedded: undefined,
			userId: '',
		});

		// Reset UI state
		setIsLoading(false);
		setError(null);
		setRetryCount(0);
		setShowRedirectModal(false);
		setShowSuccessModal(false);
		setAuthUrl('');
		setSelectedDeviceType('');
		setDeviceInfo({
			phoneNumber: '',
			email: '',
			deviceName: '',
			verificationCode: '',
		});

		// Clear API calls
		setApiCalls({});

		// Clear any stored session data
		if (typeof window !== 'undefined') {
			sessionStorage.removeItem('pingone_mfa_v7_session');
			sessionStorage.removeItem('pingone_mfa_v7_tokens');
			sessionStorage.removeItem('pingone_mfa_v7_pkce');
			// Clear any redirectless flow specific storage
			sessionStorage.removeItem('pingone_mfa_v7_flow_context');
		}

		console.log('✅ [MFA Flow V7] Flow reset complete');
	}, [onStepChange]);

	// Update step number when current step changes
	useEffect(() => {
		setCurrentStepNumber(getStepNumber(currentStep));
	}, [currentStep, getStepNumber]);

	// API Call tracking for educational display
	const [apiCalls, setApiCalls] = useState<{
		workerToken?: EnhancedApiCallData;
		authentication?: EnhancedApiCallData;
		deviceRegistration?: EnhancedApiCallData;
		mfaChallengeInitiate?: EnhancedApiCallData;
		mfaChallengeVerify?: EnhancedApiCallData;
		tokenExchange?: EnhancedApiCallData;
	}>({});
	const [flowContext, setFlowContext] = useState<FlowContext>({
		flowId: '',
		userDevices: [],
		networkStatus: { online: true },
	});

	// Separate credentials for different authentication flows
	const [workerTokenCredentials, setWorkerTokenCredentials] = useState<WorkerTokenCredentials>(
		workerTokenCredentialsService.getDefaultCredentials()
	);

	const [authCodeCredentials, setAuthCodeCredentials] = useState<CompleteMfaCredentials>({
		environmentId: '',
		clientId: '',
		clientSecret: '',
		workerToken: '',
		userId: '',
		redirectUri: 'https://localhost:3000/oauth-callback',
		username: '',
		password: '',
		tokenEndpointAuthMethod: 'client_secret_post',
	});

	// Legacy credentials state for backward compatibility (will be removed)
	const [credentials, setCredentials] = useState<CompleteMfaCredentials>({
		environmentId: '',
		clientId: '',
		clientSecret: '',
		workerToken: '',
		userId: '',
		redirectUri: 'https://localhost:3000/oauth-callback',
		username: '',
		password: '',
		tokenEndpointAuthMethod: 'client_secret_post',
	});
	const [_showPassword, _setShowPassword] = useState(false);
	const [showRedirectModal, setShowRedirectModal] = useState(false);
	const [showSuccessModal, setShowSuccessModal] = useState(false);
	const [authUrl, setAuthUrl] = useState<string>('');

	// Initialize flow
	useEffect(() => {
		console.log('🔑 [MFA Flow V7] Initializing modern PingOne MFA flow');
		const flowId = `mfa_flow_v7_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
		setFlowContext((prev) => ({ ...prev, flowId }));

		// Initialize services
		NetworkStatusService.initialize();
		SecurityMonitoringService.initialize();

		// Set default credentials for testing
		setCredentials((prev) => ({
			...prev,
			username: prev.username || 'curtis7',
			password: prev.password || 'Wolverine7&',
		}));

		setCurrentStep('username_login');
		onStepChange?.('username_login');

		// Load worker token credentials from service
		const savedWorkerTokenCreds = workerTokenCredentialsService.loadCredentials();
		console.log('🔍 [MFA Flow V7] Worker token credentials check:', {
			found: !!savedWorkerTokenCreds,
			credentials: savedWorkerTokenCreds,
		});
		if (savedWorkerTokenCreds) {
			console.log(
				'🔍 [MFA Flow V7] Loading saved worker token credentials:',
				savedWorkerTokenCreds
			);
			setWorkerTokenCredentials(savedWorkerTokenCreds);
		} else {
			console.log('🔍 [MFA Flow V7] No worker token credentials found in storage');

			// TEMPORARY: Save worker token credentials for testing
			const workerCreds = {
				environmentId: 'b9817c16-9910-4415-b67e-4ac687da74d9',
				clientId: '66a4686b-9222-4ad2-91b6-03113711c9aa',
				clientSecret: '0mClRqd3fif2vh4WJCO6B-8OZuOokzsh5gLw1V3GHbeGJYCMLk_zPfrptWzfYJ.a',
				scopes: ['p1:read:user', 'p1:update:user', 'p1:read:device', 'p1:update:device'],
				region: 'us' as const,
				tokenEndpointAuthMethod: 'client_secret_basic' as const,
			};

			console.log('🔍 [MFA Flow V7] Saving worker token credentials for testing:', workerCreds);
			workerTokenCredentialsService.saveCredentials(workerCreds);
			setWorkerTokenCredentials(workerCreds);
		}

		// Load authorization code credentials from storage
		if (typeof window !== 'undefined') {
			const savedAuthzCreds = credentialManager.loadAuthzFlowCredentials();
			console.log(
				'🔍 [MFA Flow V7] Loading saved authorization code credentials:',
				savedAuthzCreds
			);
			if (savedAuthzCreds) {
				console.log(
					'🔍 [MFA Flow V7] Setting authorization code credentials from saved data:',
					savedAuthzCreds
				);
				setAuthCodeCredentials((prev) => ({
					...prev,
					environmentId: savedAuthzCreds.environmentId || '',
					clientId: savedAuthzCreds.clientId || '',
					clientSecret: savedAuthzCreds.clientSecret || '',
					redirectUri: savedAuthzCreds.redirectUri || '',
					region: 'us',
				}));
			}

			const savedCreds = credentialManager.loadCustomData<typeof credentials>(
				MFA_CREDENTIALS_STORAGE_KEY,
				null
			);
			console.log('🔍 [MFA Flow V7] Loading saved credentials:', savedCreds);
			if (savedCreds) {
				console.log('🔍 [MFA Flow V7] Setting credentials from saved data:', savedCreds);
				setCredentials((prev) => ({ ...prev, ...savedCreds }));
			}
		}
	}, [onStepChange]);

	// Check for authorization code from callback
	useEffect(() => {
		const checkForAuthCode = () => {
			const authCode = sessionStorage.getItem('mfa_v7_auth_code');
			const state = sessionStorage.getItem('mfa_v7_state');

			if (authCode && state) {
				console.log('🔐 [CompleteMFAFlowV7] Found authorization code from callback:', {
					code: `${authCode.substring(0, 20)}...`,
					state: `${state.substring(0, 20)}...`,
				});

				// Clear the stored code and state
				sessionStorage.removeItem('mfa_v7_auth_code');
				sessionStorage.removeItem('mfa_v7_state');

				// Set the current step to token exchange
				setCurrentStep('token_retrieval');
				onStepChange?.('token_retrieval');

				// Store the authorization code for token exchange
				setFlowContext((prev) => ({
					...prev,
					authCode: authCode,
					state: state,
				}));

				console.log('🔐 [CompleteMFAFlowV7] Moved to token retrieval step with authorization code');
			}
		};

		checkForAuthCode();
	}, [onStepChange]);

	// Monitor network status
	useEffect(() => {
		const handleNetworkChange = (status: NetworkStatus) => {
			setFlowContext((prev) => ({ ...prev, networkStatus: status }));
		};

		NetworkStatusService.addStatusListener(handleNetworkChange);
		return () => NetworkStatusService.removeStatusListener(handleNetworkChange);
	}, []);

	// OIDC discovery removed - not needed for PingOne MFA flow

	// Handle saving credentials
	// Create API call data for educational display
	const createApiCallData = useCallback(
		(
			type: keyof typeof apiCalls,
			method: string,
			url: string,
			headers: Record<string, string>,
			body: string | Record<string, unknown> | null,
			response?:
				| {
						status: number;
						statusText: string;
						headers?: Record<string, string>;
						data?: unknown;
						error?: string;
				  }
				| undefined,
			educationalNotes?: string[]
		): EnhancedApiCallData => {
			// Use the actual URL as sent (don't modify it)
			const fullUrl = url.startsWith('http') ? url : url;

			return {
				method: method as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS',
				url: fullUrl,
				headers,
				body,
				...(response ? { response } : {}),
				flowType: 'worker-token' as
					| 'rar'
					| 'authorization-code'
					| 'implicit'
					| 'client-credentials'
					| 'device-code'
					| 'hybrid'
					| 'ciba'
					| 'worker-token',
				stepName: type,
				educationalNotes: educationalNotes || [],
				timestamp: new Date(),
				duration: Math.floor(Math.random() * 500) + 200, // Mock duration
			};
		},
		[]
	);

	// Get worker token with real API call
	const getWorkerToken = useCallback(async () => {
		if (
			!workerTokenCredentials.environmentId ||
			!workerTokenCredentials.clientId ||
			!workerTokenCredentials.clientSecret
		) {
			v4ToastManager.showError(
				'Please enter Environment ID, Client ID, and Client Secret in the Worker Token Configuration section'
			);
			return;
		}

		// Check if clientId is accidentally the same as environmentId (common mistake)
		if (workerTokenCredentials.clientId === workerTokenCredentials.environmentId) {
			v4ToastManager.showError(
				'Client ID cannot be the same as Environment ID. Please check your Worker Token credentials.'
			);
			return;
		}

		// Store current scroll position to prevent jumping to top
		const currentScrollY = window.scrollY;

		// Prevent scrolling during API call
		const preventScroll = (e: Event) => {
			e.preventDefault();
			window.scrollTo(0, currentScrollY);
		};

		// Add scroll prevention listeners
		window.addEventListener('scroll', preventScroll, { passive: false });
		window.addEventListener('wheel', preventScroll, { passive: false });
		window.addEventListener('touchmove', preventScroll, { passive: false });

		setIsLoading(true);
		try {
			console.log('🔑 [MFA Flow V7] Requesting worker token...');
			console.log('🔍 [MFA Flow V7] Worker Token Credentials being used:', {
				environmentId: workerTokenCredentials.environmentId,
				clientId: workerTokenCredentials.clientId,
				hasClientSecret: !!workerTokenCredentials.clientSecret,
				clientSecretLength: workerTokenCredentials.clientSecret?.length || 0,
				allCredentials: workerTokenCredentials,
			});

			// Prepare credentials for worker token request
			const workerCredentials = {
				environmentId: workerTokenCredentials.environmentId,
				clientId: workerTokenCredentials.clientId,
				clientSecret: workerTokenCredentials.clientSecret,
				scope: 'p1:read:user p1:update:user p1:read:device p1:update:device',
				tokenEndpoint: `https://auth.pingone.com/${workerTokenCredentials.environmentId}/as/token`,
			};

			console.log('🔍 [MFA Flow V7] Worker credentials prepared:', {
				...workerCredentials,
				clientSecret: workerCredentials.clientSecret ? '[REDACTED]' : 'MISSING',
			});

			// Make real API call to get worker token
			const tokenData = await ClientCredentialsTokenRequest.executeTokenRequest(
				workerCredentials,
				'client_secret_post'
			);

			console.log('✅ [MFA Flow V7] Worker token received:', tokenData);

			// Create API call data for display
			const workerTokenCall = createApiCallData(
				'workerToken',
				'POST',
				workerCredentials.tokenEndpoint,
				{
					'Content-Type': 'application/x-www-form-urlencoded',
					Authorization: `Basic ${btoa(`${workerCredentials.clientId}:${workerCredentials.clientSecret}`)}`,
				},
				{
					grant_type: 'client_credentials',
					scope: 'p1:read:user p1:update:user p1:read:device p1:update:device',
				},
				{
					status: 200,
					statusText: 'OK',
					data: tokenData as unknown as Record<string, unknown>,
				},
				[
					'Worker tokens are used for server-to-server authentication',
					'This token has permissions to manage MFA devices and challenges',
					'The scope includes device management permissions: p1:read:device, p1:update:device',
					`Token expires in ${tokenData.expires_in || 3600} seconds`,
				]
			);

			setApiCalls((prev) => ({
				...prev,
				workerToken: workerTokenCall,
			}));

			// Store the worker token for later use
			setFlowContext((prev) => ({
				...prev,
				workerToken: tokenData.access_token,
			}));

			v4ToastManager.showSuccess('✅ Worker token obtained successfully!');

			// Clear any previous error details on success
			setErrorDetails(null);
		} catch (error: unknown) {
			console.error('❌ [MFA Flow V7] Failed to get worker token:', error);

			// Use the new OAuth Error Handling Service
			const errorDetails = OAuthErrorHandlingService.parseOAuthError(error, {
				flowType: 'mfa',
				stepId: 'worker-token-request',
				operation: 'getWorkerToken',
				credentials: {
					hasClientId: !!workerTokenCredentials.clientId,
					hasClientSecret: !!workerTokenCredentials.clientSecret,
					hasEnvironmentId: !!workerTokenCredentials.environmentId,
				},
				metadata: {
					scopes: workerTokenCredentials.scopes,
					authMethod: workerTokenCredentials.tokenEndpointAuthMethod,
				},
			});

			// Show the user-friendly error message
			v4ToastManager.showError(errorDetails.message);

			// Store detailed error information for UI display
			setErrorDetails(errorDetails);

			// Log detailed troubleshooting info to console for developers
			console.group('🔧 Worker Token Error - Troubleshooting Guide');
			console.error('Original Error:', error);
			console.log('Error Details:', errorDetails);
			console.groupEnd();
		} finally {
			setIsLoading(false);

			// Remove scroll prevention listeners
			window.removeEventListener('scroll', preventScroll);
			window.removeEventListener('wheel', preventScroll);
			window.removeEventListener('touchmove', preventScroll);

			// Restore scroll position to prevent jumping to top
			// Use requestAnimationFrame to ensure DOM updates are complete
			requestAnimationFrame(() => {
				setTimeout(() => {
					window.scrollTo({
						top: currentScrollY,
						left: 0,
						behavior: 'instant',
					});
				}, 50);
			});
		}
	}, [createApiCallData, workerTokenCredentials]);

	// Handle PingOne MFA response options
	const handlePingOneMfaResponse = useCallback(
		async (responseType: string) => {
			if (!credentials.environmentId || !credentials.clientId) {
				v4ToastManager.showError('Please enter Environment ID and Client ID');
				return;
			}

			// Store current scroll position to prevent jumping to top
			const currentScrollY = window.scrollY;

			setIsLoading(true);
			try {
				console.log(`🔧 [MFA Flow V7] Making PingOne MFA API call with response=${responseType}`);

				// Generate PKCE codes if not already present
				let codeChallenge = '';
				let codeVerifier = '';

				try {
					// Check if we have existing PKCE codes in sessionStorage
					const existingPkce = sessionStorage.getItem('mfa-pkce-codes');
					if (existingPkce) {
						const pkceData = JSON.parse(existingPkce);
						codeChallenge = pkceData.codeChallenge;
						codeVerifier = pkceData.codeVerifier;
						console.log('🔐 [MFA Flow V7] Using existing PKCE codes');
					} else {
						// Generate new PKCE codes
						const { generateCodeVerifier, generateCodeChallenge } = await import('../utils/oauth');
						codeVerifier = generateCodeVerifier();
						codeChallenge = await generateCodeChallenge(codeVerifier);

						// Store PKCE codes for token exchange
						sessionStorage.setItem(
							'mfa-pkce-codes',
							JSON.stringify({
								codeVerifier,
								codeChallenge,
								codeChallengeMethod: 'S256',
							})
						);
						console.log('🔐 [MFA Flow V7] Generated new PKCE codes');
					}
				} catch (error) {
					console.error('🔐 [MFA Flow V7] Failed to generate PKCE codes:', error);
					v4ToastManager.showError('Failed to generate PKCE codes');
					return;
				}

				// Build the PingOne MFA API URL based on response type
				let mfaUrl = `https://auth.pingone.com/${credentials.environmentId}/as/authorize?`;
				const params = new URLSearchParams({
					client_id: credentials.clientId,
					response_type: 'code',
					scope: 'openid profile email p1:read:user p1:update:user',
					redirect_uri: credentials.redirectUri || 'https://localhost:3000/authz-callback',
					state: `mfa-${responseType}-${Date.now()}`,
					response_mode: responseType === 'pi.flow' ? 'pi.flow' : responseType,
					prompt: 'login',
					acr_values: 'mfa',
					code_challenge: codeChallenge,
					code_challenge_method: 'S256',
				});

				mfaUrl += params.toString();

				// Validate the authorization URL format and parameters
				let isSuccess = true;
				let errorMessage = '';
				const validationErrors: string[] = [];

				try {
					console.log(`🔧 [MFA Flow V7] Validating authorization URL: ${mfaUrl}`);

					// Validate URL format
					const url = new URL(mfaUrl);
					if (!url.protocol.startsWith('https:')) {
						validationErrors.push('URL must use HTTPS protocol');
					}

					// Validate required parameters
					const requiredParams = ['client_id', 'response_type', 'redirect_uri', 'code_challenge'];
					for (const param of requiredParams) {
						if (!url.searchParams.has(param)) {
							validationErrors.push(`Missing required parameter: ${param}`);
						}
					}

					// Validate parameter values
					if (url.searchParams.get('response_type') !== 'code') {
						validationErrors.push('response_type must be "code"');
					}

					if (url.searchParams.get('code_challenge_method') !== 'S256') {
						validationErrors.push('code_challenge_method must be "S256"');
					}

					// Validate environment ID format (UUID)
					const envIdMatch = url.pathname.match(/\/as\/authorize$/);
					if (!envIdMatch) {
						validationErrors.push('Invalid authorization endpoint path');
					}

					// Check for common configuration issues
					if (credentials.clientId === credentials.environmentId) {
						validationErrors.push('Client ID cannot be the same as Environment ID');
					}

					if (validationErrors.length > 0) {
						isSuccess = false;
						errorMessage = validationErrors.join('; ');
						console.error(`❌ [MFA Flow V7] URL validation failed:`, validationErrors);
					} else {
						console.log(`✅ [MFA Flow V7] Authorization URL validation passed`);
					}
				} catch (error) {
					console.error(`❌ [MFA Flow V7] URL validation error:`, error);
					isSuccess = false;
					errorMessage = `URL validation error: ${error instanceof Error ? error.message : 'Unknown error'}`;
				}

				// Create mock response for display (since we're not making actual requests)
				const pingOneResponse = {
					status: isSuccess ? 200 : 400,
					statusText: isSuccess ? 'OK' : 'Bad Request',
					data: isSuccess
						? {
								message: `Authorization URL validated successfully`,
								redirect_url: mfaUrl,
								flow_type: 'pingone_mfa',
								response_type: responseType,
								has_pkce: true,
								code_challenge: `${codeChallenge.substring(0, 20)}...`,
							}
						: {
								error: errorMessage,
								validation_errors: validationErrors,
							},
				};

				// Create API call data for display with validation response
				const mfaApiCall = createApiCallData(
					'deviceRegistration',
					'GET' as const,
					mfaUrl, // Use the actual URL we built
					{
						Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
						'User-Agent': 'Mozilla/5.0 (compatible; OAuth-Playground/1.0)',
					},
					null, // No body for GET request
					pingOneResponse || {
						status: 0,
						statusText: 'No Response',
						error: 'Failed to validate authorization URL',
					},
					[
						`PingOne MFA with response=${responseType}`,
						responseType === 'pi.flow'
							? 'Uses PingOne proprietary flow format'
							: `Uses standard ${responseType} response mode`,
						'Includes MFA authentication context (acr_values=mfa)',
						'Requires user interaction for MFA challenge',
						'Returns authorization code for token exchange',
						`PKCE: code_challenge=${codeChallenge.substring(0, 20)}...`,
					]
				);

				setApiCalls((prev) => ({
					...prev,
					deviceRegistration: mfaApiCall,
				}));

				// Show appropriate message based on URL validation
				if (isSuccess) {
					v4ToastManager.showSuccess(
						`✅ Authorization URL validated successfully for response=${responseType}`
					);
				} else {
					v4ToastManager.showError(`❌ Authorization URL validation failed: ${errorMessage}`);
				}
			} catch (error: unknown) {
				const errorMessage = error instanceof Error ? error.message : 'Unknown error';
				console.error(`❌ [MFA Flow V7] Failed to validate authorization URL:`, error);
				v4ToastManager.showError(`Failed to validate authorization URL: ${errorMessage}`);
			} finally {
				setIsLoading(false);

				// Restore scroll position to prevent jumping to top
				// Use requestAnimationFrame to ensure DOM updates are complete
				requestAnimationFrame(() => {
					setTimeout(() => {
						window.scrollTo({
							top: currentScrollY,
							left: 0,
							behavior: 'instant',
						});
					}, 50);
				});
			}
		},
		[createApiCallData, credentials]
	);

	// Save Worker Token credentials using the specialized service
	const handleSaveWorkerTokenCredentials = useCallback(async () => {
		setIsSaving(true);
		try {
			console.log('[CompleteMFAFlowV7] Saving worker token credentials:', workerTokenCredentials);

			const saveSuccess = workerTokenCredentialsService.saveCredentials(workerTokenCredentials);

			if (!saveSuccess) {
				throw new Error('Failed to save worker token credentials');
			}

			setHasUnsavedChanges(false);
			v4ToastManager.showSuccess('Worker Token credentials saved successfully');
			console.log('[CompleteMFAFlowV7] Worker Token credentials saved successfully');
		} catch (error) {
			console.error('[CompleteMFAFlowV7] Failed to save worker token credentials:', error);
			v4ToastManager.showError('Failed to save worker token credentials');
		} finally {
			setIsSaving(false);
		}
	}, [workerTokenCredentials]);

	// Save Authorization Code credentials using credential manager
	const _handleSaveAuthCodeCredentials = useCallback(async () => {
		setIsSaving(true);
		try {
			console.log(
				'[CompleteMFAFlowV7] Saving authorization code credentials:',
				authCodeCredentials
			);

			// Save to authz flow credentials (same pattern as other authorization code flows)
			credentialManager.saveAuthzFlowCredentials({
				environmentId: authCodeCredentials.environmentId,
				clientId: authCodeCredentials.clientId,
				clientSecret: authCodeCredentials.clientSecret,
				redirectUri: authCodeCredentials.redirectUri || 'https://localhost:3000/authz-callback',
				scopes: ['openid', 'profile', 'email'],
				authEndpoint: `https://auth.pingone.com/${authCodeCredentials.environmentId}/as/authorize`,
				tokenEndpoint: `https://auth.pingone.com/${authCodeCredentials.environmentId}/as/token`,
				userInfoEndpoint: `https://auth.pingone.com/${authCodeCredentials.environmentId}/as/userinfo`,
			});

			console.log(
				'✅ [CompleteMFAFlowV7] Authorization Code credentials saved to authz flow storage'
			);

			// Also save to permanent credentials for dashboard
			credentialManager.savePermanentCredentials({
				environmentId: authCodeCredentials.environmentId,
				clientId: authCodeCredentials.clientId,
				clientSecret: authCodeCredentials.clientSecret,
				redirectUri: authCodeCredentials.redirectUri || 'https://localhost:3000/authz-callback',
				scopes: ['openid', 'profile', 'email'],
			});

			console.log(
				'✅ [CompleteMFAFlowV7] Authorization Code credentials saved to permanent storage'
			);

			// Clear cache to ensure fresh data is loaded
			credentialManager.clearCache();

			// Dispatch events to notify dashboard and other components
			window.dispatchEvent(new CustomEvent('pingone-config-changed'));
			window.dispatchEvent(new CustomEvent('permanent-credentials-changed'));
			console.log('📢 [CompleteMFAFlowV7] Configuration change events dispatched');

			setHasUnsavedChanges(false);
			v4ToastManager.showSuccess('Authorization Code credentials saved successfully');
			console.log('[CompleteMFAFlowV7] Authorization Code credentials saved successfully');
		} catch (error) {
			console.error('[CompleteMFAFlowV7] Failed to save authorization code credentials:', error);
			v4ToastManager.showError('Failed to save authorization code credentials');
		} finally {
			setIsSaving(false);
		}
	}, [authCodeCredentials]);

	// Legacy save function for backward compatibility (username/password)
	const _handleSaveCredentials = useCallback(async () => {
		setIsSaving(true);
		try {
			console.log('[CompleteMFAFlowV7] Saving legacy credentials:', credentials);

			// Save to credential manager
			const saveSuccess = credentialManager.saveCustomData(MFA_CREDENTIALS_STORAGE_KEY, {
				environmentId: credentials.environmentId,
				clientId: credentials.clientId,
				clientSecret: credentials.clientSecret,
				redirectUri: credentials.redirectUri,
				scopes: ['openid', 'profile', 'email'],
			});

			if (!saveSuccess) {
				throw new Error('Failed to save credentials to credential manager');
			}

			setHasUnsavedChanges(false);
			v4ToastManager.showSuccess('Credentials saved successfully');
			console.log('[CompleteMFAFlowV7] Credentials saved successfully');
		} catch (error) {
			console.error('[CompleteMFAFlowV7] Failed to save credentials:', error);
			v4ToastManager.showError('Failed to save credentials');
		} finally {
			setIsSaving(false);
		}
	}, [credentials]);

	// Handle credential changes and track unsaved changes
	// Worker Token Credentials Handlers
	const _handleWorkerTokenCredentialsChange = useCallback(
		(newCredentials: WorkerTokenCredentials) => {
			setWorkerTokenCredentials(newCredentials);
			setHasUnsavedWorkerTokenChanges(true);
		},
		[]
	);

	// Authorization Code Credentials Handlers
	const _handleAuthCodeEnvironmentIdChange = useCallback((value: string) => {
		setAuthCodeCredentials((prev) => ({ ...prev, environmentId: value }));
		setHasUnsavedAuthCodeChanges(true);
	}, []);

	const _handleAuthCodeClientIdChange = useCallback((value: string) => {
		setAuthCodeCredentials((prev) => ({ ...prev, clientId: value }));
		setHasUnsavedAuthCodeChanges(true);
	}, []);

	const _handleAuthCodeClientSecretChange = useCallback((value: string) => {
		setAuthCodeCredentials((prev) => ({ ...prev, clientSecret: value }));
		setHasUnsavedAuthCodeChanges(true);
	}, []);

	const _handleAuthCodeRegionChange = useCallback((value: 'us' | 'eu' | 'ap' | 'ca') => {
		setAuthCodeCredentials((prev) => ({ ...prev, region: value }));
		setHasUnsavedAuthCodeChanges(true);
	}, []);

	const _handleAuthCodeRedirectUriChange = useCallback((value: string) => {
		setAuthCodeCredentials((prev) => ({ ...prev, redirectUri: value }));
		setHasUnsavedAuthCodeChanges(true);
	}, []);

	const _handleAuthCodeTokenEndpointAuthMethodChange = useCallback(
		(
			value:
				| 'none'
				| 'client_secret_basic'
				| 'client_secret_post'
				| 'client_secret_jwt'
				| 'private_key_jwt'
		) => {
			setAuthCodeCredentials((prev) => ({ ...prev, tokenEndpointAuthMethod: value }));
			setHasUnsavedAuthCodeChanges(true);
		},
		[]
	);

	// Legacy handlers for backward compatibility (will be removed)
	const _handleEnvironmentIdChange = useCallback((value: string) => {
		setCredentials((prev) => ({ ...prev, environmentId: value }));
		setHasUnsavedChanges(true);
	}, []);

	const _handleClientIdChange = useCallback((value: string) => {
		setCredentials((prev) => ({ ...prev, clientId: value }));
		setHasUnsavedChanges(true);
	}, []);

	const _handleClientSecretChange = useCallback((value: string) => {
		setCredentials((prev) => ({ ...prev, clientSecret: value }));
		setHasUnsavedChanges(true);
	}, []);

	const _handleRedirectUriChange = useCallback((value: string) => {
		setCredentials((prev) => ({ ...prev, redirectUri: value }));
		setHasUnsavedChanges(true);
	}, []);

	const handleUsernameLogin = useCallback(
		async (mode: 'redirect' | 'redirectless' = 'redirectless') => {
			console.log(`🔐 [MFA Flow V7] handleUsernameLogin called with mode: ${mode}`);

			// Clear any existing flow context when starting a new authentication
			setFlowContext((prev) => ({
				...prev,
				flowId: '',
				resumeUrl: '',
				flowEnvironment: undefined,
				flowLinks: undefined,
				flowEmbedded: undefined,
			}));

			if (mode === 'redirectless') {
				// For redirectless, we need username/password and use response_mode=pi.flow
				if (!credentials.username || !credentials.password) {
					v4ToastManager.showError(
						'Please enter username and password for redirectless authentication'
					);
					return;
				}

				console.log(
					`🔐 [MFA Flow V7] Starting redirectless authentication with response_mode=pi.flow`
				);
				console.log(`🔐 [MFA Flow V7] Username: ${credentials.username}`);
				console.log(`🔐 [MFA Flow V7] Password: ${credentials.password ? '***' : 'NOT SET'}`);

				// Store current scroll position to prevent jumping to top
				const currentScrollY = window.scrollY;

				setIsLoading(true);
				try {
					// Generate PKCE codes for redirectless authentication
					let codeChallenge = '';
					let codeVerifier = '';

					try {
						// Check if we have existing PKCE codes in sessionStorage
						const existingPkce = sessionStorage.getItem('pingone_mfa_v7_pkce');
						if (existingPkce) {
							const pkceData = JSON.parse(existingPkce);
							codeVerifier = pkceData.codeVerifier;
							codeChallenge = pkceData.codeChallenge;
							console.log('🔐 [MFA Flow V7] Using existing PKCE codes for redirectless auth');
						} else {
							// Generate new PKCE codes
							const { generateCodeVerifier, generateCodeChallenge } = await import(
								'../utils/oauth'
							);
							codeVerifier = generateCodeVerifier();
							codeChallenge = await generateCodeChallenge(codeVerifier);

							// Store PKCE codes for token exchange
							sessionStorage.setItem(
								'pingone_mfa_v7_pkce',
								JSON.stringify({
									codeVerifier,
									codeChallenge,
									codeChallengeMethod: 'S256',
								})
							);
							console.log('🔐 [MFA Flow V7] Generated new PKCE codes for redirectless auth');
						}
					} catch (error) {
						console.error(
							'🔐 [MFA Flow V7] Failed to generate PKCE codes for redirectless auth:',
							error
						);
						v4ToastManager.showError('Failed to generate PKCE codes');
						setIsLoading(false);
						return;
					}

					// For pi.flow, we need to make a POST request to the authorize endpoint
					// This is a PingOne proprietary extension for redirectless authentication

					// Use authCodeCredentials if available, otherwise fall back to main credentials
					const effectiveEnvironmentId =
						authCodeCredentials.environmentId || credentials.environmentId;
					const effectiveClientId = authCodeCredentials.clientId || credentials.clientId;
					const effectiveClientSecret =
						authCodeCredentials.clientSecret || credentials.clientSecret;
					const effectiveRedirectUri =
						authCodeCredentials.redirectUri ||
						credentials.redirectUri ||
						'https://localhost:3000/oauth-callback';

					console.log('🔐 [MFA Flow V7] Credential Debug:', {
						authCodeCredentials: {
							environmentId: authCodeCredentials.environmentId,
							clientId: authCodeCredentials.clientId,
							redirectUri: authCodeCredentials.redirectUri,
						},
						mainCredentials: {
							environmentId: credentials.environmentId,
							clientId: credentials.clientId,
							redirectUri: credentials.redirectUri,
						},
						effective: {
							environmentId: effectiveEnvironmentId,
							clientId: effectiveClientId,
							redirectUri: effectiveRedirectUri,
						},
					});

					if (!effectiveEnvironmentId || !effectiveClientId) {
						v4ToastManager.showError(
							'Please enter Environment ID and Client ID in the Authorization Code Configuration section'
						);
						setIsLoading(false);
						return;
					}

					const authEndpoint = `https://auth.pingone.com/${effectiveEnvironmentId}/as/authorize`;

					// Use direct authorization request with response_mode=pi.flow (like V5/V6 flows)
					console.log(
						`🔐 [MFA Flow V7] Using direct authorization request with response_mode=pi.flow`
					);

					// Build authorization request body for POST request (redirectless authentication)
					// Note: No redirect_uri needed for redirectless authentication
					const authRequestBody = new URLSearchParams({
						response_type: 'code',
						client_id: effectiveClientId,
						scope: 'openid profile email',
						state: `mfa-flow-${Date.now()}`,
						nonce: `nonce-${Date.now()}`,
						code_challenge: codeChallenge,
						code_challenge_method: 'S256',
						response_mode: 'pi.flow', // Key parameter for redirectless authentication
						username: credentials.username,
						password: credentials.password,
					});

					console.log(
						`🔐 [MFA Flow V7] Making POST request to authorize endpoint with response_mode=pi.flow`
					);
					console.log(`🔐 [MFA Flow V7] Authorization endpoint:`, authEndpoint);
					console.log(`🔐 [MFA Flow V7] Request body:`, {
						response_type: 'code',
						client_id: effectiveClientId,
						scope: 'openid profile email',
						state: `mfa-flow-${Date.now()}`,
						nonce: `nonce-${Date.now()}`,
						code_challenge: codeChallenge,
						code_challenge_method: 'S256',
						response_mode: 'pi.flow',
						hasUsername: !!credentials.username,
						hasPassword: !!credentials.password,
					});

					// Make the POST request to PingOne authorize endpoint with response_mode=pi.flow
					console.log(`🔐 [MFA Flow V7] Making POST request to: ${authEndpoint}`);
					console.log(`🔐 [MFA Flow V7] Request body: ${authRequestBody.toString()}`);

					const response = await fetch(authEndpoint, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/x-www-form-urlencoded',
							Accept: 'application/json',
						},
						body: authRequestBody.toString(),
					});

					console.log(
						`🔐 [MFA Flow V7] Response status: ${response.status} ${response.statusText}`
					);
					console.log(
						`🔐 [MFA Flow V7] Response headers:`,
						Object.fromEntries(response.headers.entries())
					);

					// Check if response is JSON or HTML
					const contentType = response.headers.get('content-type');
					console.log(`🔐 [MFA Flow V7] Response content-type:`, contentType);

					let responseData: unknown;
					if (contentType?.includes('application/json')) {
						responseData = await response.json();
						console.log(`🔐 [MFA Flow V7] Response data:`, responseData);
					} else {
						// Response is HTML, not JSON - this usually means an error page
						const responseText = await response.text();
						console.log(
							`🔐 [MFA Flow V7] HTML Response (first 500 chars):`,
							responseText.substring(0, 500)
						);
						console.log(`🔐 [MFA Flow V7] Full HTML Response:`, responseText);

						// Try to extract error information from HTML
						const errorMatch = responseText.match(/<title[^>]*>([^<]+)<\/title>/i);
						const title = errorMatch ? errorMatch[1] : 'Unknown Error';
						console.log(`🔐 [MFA Flow V7] HTML Page Title:`, title);

						throw new Error(
							`PingOne returned HTML instead of JSON. Page title: "${title}". This usually means invalid credentials or unsupported flow.`
						);
					}

					console.log(`🔐 [MFA Flow V7] PingOne pi.flow response:`, {
						status: response.status,
						statusText: response.statusText,
						hasFlow: !!(responseData.id && responseData.resumeUrl),
						flowId: responseData.id,
						flowState: responseData.state,
						hasTokens: !!(responseData.access_token || responseData.id_token),
					});

					if (!response.ok) {
						console.error(`❌ [MFA Flow V7] PingOne pi.flow request failed:`, responseData);
						v4ToastManager.showError(
							`Redirectless authentication failed: ${responseData.error || responseData.message || 'Unknown error'}`
						);
						return;
					}

					// Create API call data for educational display
					const redirectlessApiCall = createApiCallData(
						'authentication',
						'POST' as const,
						`https://auth.pingone.com/${effectiveEnvironmentId}/as/authorize`,
						{
							'Content-Type': 'application/x-www-form-urlencoded',
							Accept: 'application/json',
						},
						authRequestBody.toString(),
						{
							status: response.status,
							statusText: response.statusText,
							data: responseData,
						},
						[
							'PingOne pi.flow (redirectless) authentication',
							'POST request to /as/authorize with username/password in body',
							'Returns flow object instead of redirect',
							'Enables embedded authentication without browser redirects',
							'PingOne proprietary extension to OAuth 2.0/OIDC',
						]
					);

					setApiCalls((prev) => ({
						...prev,
						authentication: redirectlessApiCall,
					}));

					// Handle the pi.flow response - the responseData IS the flow object
					if (responseData.id && responseData.resumeUrl) {
						console.log(`🔐 [MFA Flow V7] Received flow object:`, responseData);
						console.log(`🔐 [MFA Flow V7] Flow object details:`, {
							id: responseData.id,
							state: responseData.state,
							resumeUrl: responseData.resumeUrl,
							environment: responseData.environment,
							links: responseData._links,
							embedded: responseData._embedded,
							userId: responseData.userId,
							user: responseData.user,
						});
						v4ToastManager.showSuccess('Redirectless authentication initiated successfully');

						// Try to extract userId from multiple sources in the flow response
						let extractedUserId: string | undefined;

						// 1. Try direct userId property
						if (responseData.userId) {
							extractedUserId = responseData.userId;
							console.log(`🔐 [MFA Flow V7] Found userId in responseData.userId:`, extractedUserId);
						}
						// 2. Try user.id property
						else if (responseData.user?.id) {
							extractedUserId = responseData.user.id;
							console.log(
								`🔐 [MFA Flow V7] Found userId in responseData.user.id:`,
								extractedUserId
							);
						}
						// 3. Try _embedded.user.id
						else if (responseData._embedded?.user?.id) {
							extractedUserId = responseData._embedded.user.id;
							console.log(`🔐 [MFA Flow V7] Found userId in _embedded.user.id:`, extractedUserId);
						}
						// 4. Try extracting from id_token if available
						else if (responseData.id_token) {
							try {
								const payload = JSON.parse(atob(responseData.id_token.split('.')[1]));
								extractedUserId = payload.sub || payload.user_id || payload.id;
								if (extractedUserId) {
									console.log(`🔐 [MFA Flow V7] Extracted userId from id_token:`, extractedUserId);
								}
							} catch (error) {
								console.warn(`🔐 [MFA Flow V7] Failed to extract userId from id_token:`, error);
							}
						}

						// Only set userId if we found one - don't use fallback as it's not a real userId
						if (extractedUserId) {
							console.log(`🔐 [MFA Flow V7] Setting userId in flow context:`, extractedUserId);
							setFlowContext((prev) => {
								const newContext = {
									...prev,
									flowId: responseData.id,
									resumeUrl: responseData.resumeUrl,
									flowEnvironment: responseData.environment,
									flowLinks: responseData._links,
									flowEmbedded: responseData._embedded,
									userId: extractedUserId,
								};
								console.log(`🔐 [MFA Flow V7] Updated flow context:`, newContext);
								return newContext;
							});
						} else {
							console.warn(
								`⚠️ [MFA Flow V7] No userId found in flow response. User must complete authentication first.`
							);
							// Don't set userId - it will be extracted after flow completes
							setFlowContext((prev) => {
								const newContext = {
									...prev,
									flowId: responseData.id,
									resumeUrl: responseData.resumeUrl,
									flowEnvironment: responseData.environment,
									flowLinks: responseData._links,
									flowEmbedded: responseData._embedded,
									// userId will be set after flow completes
								};
								console.log(`🔐 [MFA Flow V7] Updated flow context (no userId yet):`, newContext);
								return newContext;
							});
						}

						// For redirectless flow, we need to get a worker token for device registration
						console.log(
							'🔐 [MFA Flow V7] Redirectless flow established - getting worker token for device registration'
						);

						// Get worker token using client credentials
						try {
							console.log('🔐 [MFA Flow V7] Getting worker token for device registration');

							// Use worker token credentials instead of authorization code credentials
							const workerCredentials = workerTokenCredentials || authCodeCredentials;
							const workerClientId = workerCredentials.clientId || effectiveClientId;
							const workerClientSecret =
								workerCredentials.clientSecret ||
								authCodeCredentials.clientSecret ||
								credentials.clientSecret ||
								'';
							const workerEnvironmentId = workerCredentials.environmentId || effectiveEnvironmentId;

							console.log('🔐 [MFA Flow V7] Worker token request details:', {
								environmentId: workerEnvironmentId,
								clientId: workerClientId,
								hasClientSecret: !!workerClientSecret,
								clientSecretLength: workerClientSecret.length,
								usingWorkerCredentials: !!workerTokenCredentials,
							});

							// Try Basic Authentication instead of client_secret_post
							const basicAuth = btoa(`${workerClientId}:${workerClientSecret}`);

							const tokenRequestBody = new URLSearchParams({
								grant_type: 'client_credentials',
								scope: 'p1:read:user p1:update:user p1:read:device p1:update:device',
							});

							console.log(
								'🔐 [MFA Flow V7] Making worker token request to:',
								`https://auth.pingone.com/${workerEnvironmentId}/as/token`
							);
							console.log('🔐 [MFA Flow V7] Using Basic Authentication');
							console.log('🔐 [MFA Flow V7] Client ID:', workerClientId);
							console.log('🔐 [MFA Flow V7] Client Secret length:', workerClientSecret.length);
							console.log(
								'🔐 [MFA Flow V7] Basic Auth header:',
								`Basic ${basicAuth.substring(0, 20)}...`
							);
							console.log('🔐 [MFA Flow V7] Request body:', tokenRequestBody.toString());

							const tokenResponse = await fetch(
								`https://auth.pingone.com/${workerEnvironmentId}/as/token`,
								{
									method: 'POST',
									headers: {
										'Content-Type': 'application/x-www-form-urlencoded',
										Accept: 'application/json',
										Authorization: `Basic ${basicAuth}`,
									},
									body: tokenRequestBody.toString(),
								}
							);

							if (tokenResponse.ok) {
								const tokenData = await tokenResponse.json();
								console.log('🔐 [MFA Flow V7] Worker token obtained:', {
									access_token: tokenData.access_token ? '***' : 'none',
									token_type: tokenData.token_type,
									expires_in: tokenData.expires_in,
								});

								// Update flow context with worker token
								setFlowContext((prev) => ({
									...prev,
									workerToken: tokenData.access_token,
								}));

								v4ToastManager.showSuccess(
									'✅ Worker token obtained! Ready for device registration.'
								);
							} else {
								const errorData = await tokenResponse.json();
								console.log('🔐 [MFA Flow V7] Worker token request failed:', {
									status: tokenResponse.status,
									statusText: tokenResponse.statusText,
									error: errorData,
									requestUrl: `https://auth.pingone.com/${workerEnvironmentId}/as/token`,
									clientId: workerClientId,
									hasClientSecret: !!workerClientSecret,
									clientSecretLength: workerClientSecret.length,
									basicAuthHeader: `Basic ${basicAuth.substring(0, 20)}...`,
									requestBody: tokenRequestBody.toString(),
								});
								v4ToastManager.showError(
									`Failed to get worker token: ${errorData.error_description || errorData.error || 'Unknown error'}`
								);
							}
						} catch (error) {
							console.log('🔐 [MFA Flow V7] Worker token request failed:', error);
							console.log(
								'🔐 [MFA Flow V7] Continuing without worker token - device registration will use alternative method'
							);
							// Don't show error to user - worker token is optional for basic MFA flow
						}

						// For redirectless flow, we need to complete the authentication by calling the resumeUrl
						console.log(
							'🔐 [MFA Flow V7] Completing redirectless authentication by calling resumeUrl'
						);

						try {
							const resumeResponse = await fetch('/api/pingone/resume', {
								method: 'POST',
								headers: {
									'Content-Type': 'application/json',
								},
								body: JSON.stringify({
									resumeUrl: responseData.resumeUrl,
									flowId: responseData.id,
									flowState: responseData.state,
									clientId: effectiveClientId,
									clientSecret: effectiveClientSecret,
								}),
							});

							if (resumeResponse.ok) {
								const resumeData = await resumeResponse.json();
								console.log('🔐 [MFA Flow V7] Resume response:', resumeData);

								// Check if we got tokens or need to continue the flow
								if (resumeData.access_token) {
									console.log('🔐 [MFA Flow V7] Authentication completed with tokens');
									// Store tokens and get real user ID
									const realUserId = resumeData.id_token
										? JSON.parse(atob(resumeData.id_token.split('.')[1])).sub
										: `real-user-${Date.now()}`;
									setFlowContext((prev) => ({
										...prev,
										userId: realUserId,
									}));
								} else if (resumeData.userId) {
									console.log('🔐 [MFA Flow V7] Authentication completed with user ID');
									setFlowContext((prev) => ({
										...prev,
										userId: resumeData.userId,
									}));
								}
							} else {
								const errorData = await resumeResponse.json().catch(() => ({}));
								console.log(
									'🔐 [MFA Flow V7] Resume URL returned error:',
									resumeResponse.status,
									resumeResponse.statusText,
									errorData
								);
								// Continue with flow even if resume fails - user can still proceed to device pairing
							}
						} catch (error) {
							console.log('🔐 [MFA Flow V7] Error calling resume URL:', error);
						}

						// Advance to device pairing step
						setCurrentStep('device_pairing');
						onStepChange?.('device_pairing');
						v4ToastManager.showSuccess(
							'✅ Redirectless authentication completed! Proceeding to device pairing.'
						);
					} else if (responseData.id && responseData.resumeUrl) {
						// Handle PingOne flow response format with id and resumeUrl
						console.log(`🔐 [MFA Flow V7] Received PingOne flow response:`, {
							flowId: responseData.id,
							resumeUrl: responseData.resumeUrl,
							environment: responseData.environment,
							hasLinks: !!responseData._links,
							hasEmbedded: !!responseData._embedded,
						});

						v4ToastManager.showSuccess('Redirectless authentication initiated successfully');

						// Store the flow information in flow context
						setFlowContext((prev) => ({
							...prev,
							flowId: responseData.id,
							resumeUrl: responseData.resumeUrl,
							flowEnvironment: responseData.environment,
							flowLinks: responseData._links,
							flowEmbedded: responseData._embedded,
						}));

						// For redirectless flow, we don't need to call resumeUrl
						// The flow is already established and we can proceed directly to device pairing
						console.log(
							`🔐 [MFA Flow V7] Redirectless flow established - proceeding directly to device pairing`
						);

						// Advance directly to device pairing step for redirectless authentication
						setCurrentStep('device_pairing');
						onStepChange?.('device_pairing');
						v4ToastManager.showSuccess(
							'✅ Redirectless authentication successful! Ready for device registration.'
						);
					} else {
						console.warn(`⚠️ [MFA Flow V7] Unexpected pi.flow response format:`, responseData);
						v4ToastManager.showWarning('Unexpected response format from PingOne');
					}
				} catch (authError: unknown) {
					const errorMessage = authError instanceof Error ? authError.message : 'Unknown error';
					console.error(`❌ [MFA Flow V7] Authorization request failed:`, authError);
					v4ToastManager.showError(`Authorization request failed: ${errorMessage}`);
					return;
				} finally {
					setIsLoading(false);

					// Restore scroll position to prevent jumping to top
					requestAnimationFrame(() => {
						window.scrollTo(0, currentScrollY);
					});
				}

				// Return early to prevent falling back to redirect logic
				return;
			} else {
				// For redirect, generate PKCE codes and build authorization URL
				let codeChallenge = '';
				let codeVerifier = '';

				try {
					// Check if we have existing PKCE codes in sessionStorage
					const existingPkce = sessionStorage.getItem('pingone_mfa_v7_pkce');
					if (existingPkce) {
						const pkceData = JSON.parse(existingPkce);
						codeVerifier = pkceData.codeVerifier;
						codeChallenge = pkceData.codeChallenge;
						console.log('🔐 [MFA Flow V7] Using existing PKCE codes for redirect auth');
					} else {
						// Generate new PKCE codes
						console.log('🔐 [MFA Flow V7] Starting PKCE generation for redirect auth...');
						const { generateCodeVerifier, generateCodeChallenge } = await import('../utils/oauth');
						codeVerifier = generateCodeVerifier();
						console.log(
							'🔐 [MFA Flow V7] Generated codeVerifier:',
							`${codeVerifier.substring(0, 20)}...`
						);

						codeChallenge = await generateCodeChallenge(codeVerifier);
						console.log(
							'🔐 [MFA Flow V7] Generated codeChallenge:',
							`${codeChallenge.substring(0, 20)}...`
						);

						// Store PKCE codes for token exchange
						sessionStorage.setItem(
							'pingone_mfa_v7_pkce',
							JSON.stringify({
								codeVerifier,
								codeChallenge,
								codeChallengeMethod: 'S256',
							})
						);
						console.log('🔐 [MFA Flow V7] Generated new PKCE codes for redirect auth');
					}
				} catch (error) {
					console.error('🔐 [MFA Flow V7] Failed to generate PKCE codes for redirect auth:', error);
					v4ToastManager.showError('Failed to generate PKCE codes');
					return;
				}

				// Debug PKCE codes before building URL
				console.log(`🔐 [MFA Flow V7] PKCE Debug - codeChallenge length:`, codeChallenge.length);
				console.log(
					`🔐 [MFA Flow V7] PKCE Debug - codeChallenge value:`,
					`${codeChallenge.substring(0, 20)}...`
				);
				console.log(`🔐 [MFA Flow V7] PKCE Debug - codeVerifier length:`, codeVerifier.length);

				// Validate PKCE codes before building URL
				if (!codeChallenge || codeChallenge.length === 0) {
					console.error('🔐 [MFA Flow V7] PKCE Error - codeChallenge is empty or undefined');
					v4ToastManager.showError('Failed to generate PKCE code challenge');
					return;
				}

				if (!codeVerifier || codeVerifier.length === 0) {
					console.error('🔐 [MFA Flow V7] PKCE Error - codeVerifier is empty or undefined');
					v4ToastManager.showError('Failed to generate PKCE code verifier');
					return;
				}

				// Use authCodeCredentials if available, otherwise fall back to main credentials
				const effectiveEnvironmentId =
					authCodeCredentials.environmentId || credentials.environmentId;
				const effectiveClientId = authCodeCredentials.clientId || credentials.clientId;
				const effectiveRedirectUri =
					authCodeCredentials.redirectUri ||
					credentials.redirectUri ||
					'https://localhost:3000/oauth-callback';

				console.log('🔐 [MFA Flow V7] Redirect Credential Debug:', {
					authCodeCredentials: {
						environmentId: authCodeCredentials.environmentId,
						clientId: authCodeCredentials.clientId,
						redirectUri: authCodeCredentials.redirectUri,
					},
					mainCredentials: {
						environmentId: credentials.environmentId,
						clientId: credentials.clientId,
						redirectUri: credentials.redirectUri,
					},
					effective: {
						environmentId: effectiveEnvironmentId,
						clientId: effectiveClientId,
						redirectUri: effectiveRedirectUri,
					},
				});

				if (!effectiveEnvironmentId || !effectiveClientId) {
					v4ToastManager.showError(
						'Please enter Environment ID and Client ID in the Authorization Code Configuration section'
					);
					return;
				}

				// Build authorization URL with PKCE parameters
				const urlParams = new URLSearchParams({
					client_id: effectiveClientId,
					response_type: 'code',
					response_mode: 'query',
					scope: 'openid profile email',
					redirect_uri: effectiveRedirectUri,
					state: `mfa-flow-${Date.now()}`,
					code_challenge: codeChallenge,
					code_challenge_method: 'S256',
				});

				const mockAuthUrl = `https://auth.pingone.com/${effectiveEnvironmentId}/as/authorize?${urlParams.toString()}`;

				console.log(`🔐 [MFA Flow V7] Starting redirect authentication with URL:`, mockAuthUrl);
				console.log(`🔐 [MFA Flow V7] URL Parameters:`, Object.fromEntries(urlParams));
				console.log(`🔐 [MFA Flow V7] PKCE parameters:`, {
					code_challenge: `${codeChallenge.substring(0, 20)}...`,
					code_challenge_method: 'S256',
				});
				console.log(`🔐 [MFA Flow V7] Authorization URL breakdown:`, {
					baseUrl: `https://auth.pingone.com/${effectiveEnvironmentId}/as/authorize`,
					clientId: effectiveClientId,
					redirectUri: effectiveRedirectUri,
					state: `mfa-flow-${Date.now()}`,
					hasCodeChallenge: !!codeChallenge,
					hasCodeVerifier: !!codeVerifier,
				});

				// Set flow context for callback handling
				const mfaFlowContext = {
					flow: 'pingone-complete-mfa-v7',
					returnPath: '/pingone-authentication',
					timestamp: Date.now(),
				};
				sessionStorage.setItem('flowContext', JSON.stringify(mfaFlowContext));
				sessionStorage.setItem('active_oauth_flow', 'pingone-complete-mfa-v7');

				console.log(`🔐 [MFA Flow V7] Set flow context for callback:`, mfaFlowContext);

				setAuthUrl(mockAuthUrl);
				// Modal showing removed - redirect flows are now triggered manually via button click
				// Redirectless flows never show a modal
			}
		},
		[credentials, authCodeCredentials, createApiCallData, onStepChange, workerTokenCredentials]
	);

	const handleConfirmRedirect = useCallback(async () => {
		setShowRedirectModal(false);
		setIsLoading(true);
		setError(null);

		try {
			console.log('🔐 [MFA Flow V7] User confirmed redirect/flow');

			// Check if we have flow context (from redirectless authentication)
			if (flowContext.flowId && flowContext.resumeUrl) {
				console.log(
					'🔐 [MFA Flow V7] Redirectless flow confirmed - opening resumeUrl for user to complete authentication'
				);
				console.log('🔐 [MFA Flow V7] Flow ID:', flowContext.flowId);
				console.log('🔐 [MFA Flow V7] Resume URL:', flowContext.resumeUrl);

				// For redirectless flow, we need to open the resumeUrl in a popup
				// so the user can complete the authentication steps (MFA, consent, etc.)
				const popup = window.open(
					flowContext.resumeUrl,
					'PingOneAuth',
					'width=600,height=700,scrollbars=yes,resizable=yes'
				);

				if (!popup) {
					throw new Error(
						'Failed to open authentication popup. Please allow popups for this site.'
					);
				}

				console.log(
					'🔐 [MFA Flow V7] Opened resumeUrl in popup - waiting for user to complete authentication'
				);

				// Monitor the popup for completion
				const checkClosed = setInterval(() => {
					if (popup.closed) {
						clearInterval(checkClosed);
						console.log(
							'🔐 [MFA Flow V7] Authentication popup closed - assuming user completed authentication'
						);

						// Move to device pairing step after user completes authentication
						setCurrentStep('device_pairing');
						onStepChange?.('device_pairing');

						v4ToastManager.showSuccess(
							'✅ Authentication completed! Proceeding to device registration.'
						);
					}
				}, 1000);
			} else {
				console.log('🔐 [MFA Flow V7] Simulating redirect authentication');
				// Simulate authentication process for regular redirect
				await new Promise((resolve) => setTimeout(resolve, 2000));

				// Show success modal
				setShowSuccessModal(true);
				v4ToastManager.showSuccess('✅ User authenticated successfully!');
			}
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
			console.error('Authentication Error:', error);
			setError(errorMessage);
			v4ToastManager.showError(`Authentication failed: ${errorMessage}`);
		} finally {
			setIsLoading(false);
		}
	}, [flowContext.flowId, flowContext.resumeUrl, onStepChange]);

	const handleSuccessModalClose = useCallback(() => {
		setShowSuccessModal(false);
		setCurrentStep('mfa_enrollment');
		onStepChange?.('mfa_enrollment');
	}, [onStepChange]);

	const handleRetry = useCallback(() => {
		setRetryCount((prev) => prev + 1);
		setError(null);
		setCurrentStep('username_login');
		console.log('🔄 [MFA Flow V7] Flow retried');
	}, []);

	const _handleRestart = useCallback(() => {
		handleResetFlow();
	}, [handleResetFlow]);

	// Device registration validation
	const isDeviceInfoValid = useCallback(() => {
		if (!selectedDeviceType) return false;

		// Device name is required for all device types
		if (!deviceInfo.deviceName.trim()) return false;

		switch (selectedDeviceType) {
			case 'sms':
				return deviceInfo.phoneNumber.trim().length > 0;
			case 'email':
				return deviceInfo.email.trim().length > 0 && deviceInfo.email.includes('@');
			case 'totp':
				return deviceInfo.verificationCode.trim().length === 6;
			case 'fido2':
			case 'push':
				return true; // Only device name is required
			default:
				return false;
		}
	}, [selectedDeviceType, deviceInfo]);

	// Device registration handler
	const handleDeviceRegistration = useCallback(async () => {
		if (!isDeviceInfoValid()) {
			v4ToastManager.showError('Please fill in all required device information');
			return;
		}

		// Check if we have userId from authentication
		console.log(`📱 [MFA Flow V7] Device registration - checking userId:`, {
			userId: flowContext.userId,
			flowId: flowContext.flowId,
			resumeUrl: flowContext.resumeUrl,
			hasFlowContext: !!flowContext,
			hasFlowEmbedded: !!flowContext.flowEmbedded,
			hasTokens: !!flowContext.tokens,
		});

		// Try to extract userId from multiple sources if not directly available
		let effectiveUserId: string | undefined = flowContext.userId;

		if (!effectiveUserId && flowContext.flowEmbedded?.user?.id) {
			effectiveUserId = flowContext.flowEmbedded.user.id;
			console.log(`📱 [MFA Flow V7] Extracted userId from flowEmbedded.user.id:`, effectiveUserId);
			// Update flowContext with the extracted userId (only if it's a valid string)
			if (effectiveUserId) {
				setFlowContext((prev) => ({ ...prev, userId: effectiveUserId! }));
			}
		}

		if (!effectiveUserId && flowContext.tokens?.id_token) {
			try {
				const payload = JSON.parse(atob(flowContext.tokens.id_token.split('.')[1]));
				const extractedId = payload.sub || payload.user_id || payload.id;
				if (extractedId && typeof extractedId === 'string') {
					effectiveUserId = extractedId;
					console.log(`📱 [MFA Flow V7] Extracted userId from id_token:`, effectiveUserId);
					// Update flowContext with the extracted userId
					setFlowContext((prev) => ({ ...prev, userId: effectiveUserId! }));
				}
			} catch (error) {
				console.warn(`📱 [MFA Flow V7] Failed to extract userId from id_token:`, error);
			}
		}

		if (!effectiveUserId) {
			console.error(`❌ [MFA Flow V7] No userId found in flowContext:`, flowContext);
			v4ToastManager.showError(
				'Please complete authentication first to get your user ID. Complete the authentication step and wait for the flow to finish before registering devices.'
			);
			return;
		}

		setIsLoading(true);
		try {
			// For SMS devices, concatenate country code with phone number
			let finalPhoneNumber = deviceInfo.phoneNumber;
			if (
				selectedDeviceType === 'sms' &&
				deviceInfo.phoneNumber &&
				!deviceInfo.phoneNumber.startsWith('+')
			) {
				// Use the selected country code from the PhoneNumberInput component
				finalPhoneNumber = selectedCountryCode + deviceInfo.phoneNumber;
				console.log(
					`📱 [MFA Flow V7] Concatenating country code: ${deviceInfo.phoneNumber} -> ${finalPhoneNumber} (using ${selectedCountryCode})`
				);
			}

			console.log(`📱 [MFA Flow V7] Registering ${selectedDeviceType} device:`, {
				deviceType: selectedDeviceType,
				deviceInfo: {
					...deviceInfo,
					phoneNumber: selectedDeviceType === 'sms' ? finalPhoneNumber : '[hidden]',
					email: selectedDeviceType === 'email' ? deviceInfo.email : '[hidden]',
					verificationCode:
						selectedDeviceType === 'totp' ? '[hidden]' : deviceInfo.verificationCode,
				},
			});

			// Make API call through backend proxy to avoid CORS issues
			// Temporarily use direct backend URL to test
			const deviceRegistrationUrl = `/api/device/register`;
			const requestBody = {
				environmentId: authCodeCredentials.environmentId,
				userId: effectiveUserId,
				deviceType: selectedDeviceType,
				deviceName: deviceInfo.deviceName,
				contactInfo:
					selectedDeviceType === 'sms'
						? finalPhoneNumber
						: selectedDeviceType === 'email'
							? deviceInfo.email
							: undefined,
				verificationCode: selectedDeviceType === 'totp' ? deviceInfo.verificationCode : undefined,
				workerToken: flowContext.workerToken,
			};

			console.log(`📱 [MFA Flow V7] Making API call through backend proxy:`, {
				url: deviceRegistrationUrl,
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: requestBody,
				fullUrl: window.location.origin + deviceRegistrationUrl,
			});

			const deviceRegistrationResponse = await fetch(deviceRegistrationUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(requestBody),
			});

			if (!deviceRegistrationResponse.ok) {
				const errorData = await deviceRegistrationResponse.json();
				console.error(`❌ [MFA Flow V7] PingOne device registration failed:`, errorData);
				throw new Error(
					`Device registration failed: ${errorData.message || errorData.error || 'Unknown error'}`
				);
			}

			const deviceRegistrationData = await deviceRegistrationResponse.json();
			console.log(
				`✅ [MFA Flow V7] PingOne device registration successful:`,
				deviceRegistrationData
			);

			// Create API call data for display
			const deviceRegistrationApiCall = createApiCallData(
				'deviceRegistration',
				'POST' as const,
				deviceRegistrationUrl,
				{
					'Content-Type': 'application/json',
					Authorization: `Bearer ${flowContext.workerToken}`,
				},
				JSON.stringify(requestBody),
				{
					status: deviceRegistrationResponse.status,
					statusText: deviceRegistrationResponse.statusText,
					data: deviceRegistrationData,
				},
				[
					`Register ${selectedDeviceType.toUpperCase()} device with PingOne`,
					'Device registration enables MFA for this user',
					'Device must be verified before it can be used for authentication',
					'Multiple devices can be registered for backup options',
				]
			);

			setApiCalls((prev) => ({
				...prev,
				deviceRegistration: deviceRegistrationApiCall,
			}));

			// Create device object from PingOne response
			const newDevice: MfaDevice = {
				id: deviceRegistrationData.deviceId || deviceRegistrationData.id,
				type: selectedDeviceType as 'SMS' | 'EMAIL' | 'TOTP' | 'VOICE' | 'FIDO2' | 'MOBILE',
				deviceName: deviceInfo.deviceName,
				status: (deviceRegistrationData.status || 'ACTIVE') as
					| 'ACTIVE'
					| 'ACTIVATION_REQUIRED'
					| 'PENDING_ACTIVATION'
					| 'BLOCKED',
				activationRequired: deviceRegistrationData.activationRequired || false,
			};

			setFlowContext((prev) => ({
				...prev,
				userDevices: [...prev.userDevices, newDevice],
				selectedDevice: newDevice,
			}));

			// Show device registration modal
			setRegisteredDeviceData({
				deviceId: newDevice.id,
				deviceType: selectedDeviceType,
				deviceName: deviceInfo.deviceName,
				contactInfo:
					selectedDeviceType === 'sms'
						? finalPhoneNumber
						: selectedDeviceType === 'email'
							? deviceInfo.email
							: selectedDeviceType === 'totp'
								? 'TOTP App'
								: 'Device',
				status: 'active' as const,
				registeredAt: new Date().toISOString(),
			});
			setShowDeviceRegistrationModal(true);

			v4ToastManager.showSuccess(
				`${selectedDeviceType.toUpperCase()} device registered successfully!`
			);
			console.log(`✅ [MFA Flow V7] Device registered:`, newDevice);
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			console.error(`❌ [MFA Flow V7] Device registration failed:`, error);
			v4ToastManager.showError(`Device registration failed: ${errorMessage}`);
		} finally {
			setIsLoading(false);
		}
	}, [
		selectedDeviceType,
		deviceInfo,
		isDeviceInfoValid,
		authCodeCredentials.environmentId,
		flowContext.workerToken,
		createApiCallData,
		selectedCountryCode,
		flowContext,
	]);

	// Device Registration Modal handlers
	const handleCloseDeviceRegistrationModal = useCallback(() => {
		setShowDeviceRegistrationModal(false);
		setRegisteredDeviceData(null);
	}, []);

	const handleContinueFromDeviceRegistration = useCallback(() => {
		setShowDeviceRegistrationModal(false);
		setRegisteredDeviceData(null);
		// Move to MFA challenge step
		setCurrentStep('mfa_challenge');
		onStepChange?.('mfa_challenge');
	}, [onStepChange]);

	// TOTP QR Code modal handlers
	const handleShowTOTPQRCode = useCallback(() => {
		setShowTOTPQRCodeModal(true);
	}, []);

	const handleCloseTOTPQRCode = useCallback(() => {
		setShowTOTPQRCodeModal(false);
	}, []);

	const handleContinueFromTOTPQRCode = useCallback(() => {
		setShowTOTPQRCodeModal(false);
		// The user has set up their authenticator app, now they can enter the verification code
		v4ToastManager.showSuccess(
			'Authenticator app setup complete! Now enter the 6-digit code from your app.'
		);
	}, []);

	// FIDO2 registration modal handlers
	const handleShowFIDO2Registration = useCallback(() => {
		setShowFIDO2RegistrationModal(true);
	}, []);

	const handleCloseFIDO2Registration = useCallback(() => {
		setShowFIDO2RegistrationModal(false);
	}, []);

	/**
	 * Handle successful FIDO2 device registration
	 * Registers the device with PingOne and progresses to MFA challenge step
	 */
	const handleFIDO2RegistrationSuccess = useCallback(
		async (credentialId: string, publicKey: string) => {
			setShowFIDO2RegistrationModal(false);

			// Store the FIDO2 credential information
			sessionStorage.setItem('fido2Credential', JSON.stringify({ credentialId, publicKey }));
			v4ToastManager.showSuccess('FIDO2 passkey registered successfully!');

			// Ensure selectedDeviceType is set to fido2 for device registration
			if (selectedDeviceType !== 'fido2') {
				setSelectedDeviceType('fido2');
			}

			// Register the FIDO2 device with PingOne
			try {
				console.log('🔑 [MFA Flow V7] Registering FIDO2 device with PingOne...', {
					credentialId: `${credentialId.substring(0, 20)}...`,
					deviceName: deviceInfo.deviceName,
					selectedDeviceType,
				});

				// Call the device registration handler to register with PingOne
				// This will add the device to flowContext.userDevices and show the registration modal
				await handleDeviceRegistration();

				// For FIDO2, automatically close the registration modal and progress to next step
				// Wait a moment for state to update (device added to flowContext.userDevices)
				setTimeout(() => {
					// Close the device registration modal if it's open
					setShowDeviceRegistrationModal(false);
					setRegisteredDeviceData(null);

					// Progress to MFA challenge step
					setCurrentStep('mfa_challenge');
					onStepChange?.('mfa_challenge');
					v4ToastManager.showSuccess('✅ FIDO2 device registered! Proceeding to MFA challenge.');
				}, 1000);
			} catch (error) {
				console.error('❌ [MFA Flow V7] Failed to register FIDO2 device:', error);
				v4ToastManager.showError('Failed to register FIDO2 device with PingOne');
				// Don't progress if registration failed
			}
		},
		[handleDeviceRegistration, onStepChange, selectedDeviceType, deviceInfo.deviceName]
	);

	// Initiate MFA Challenge
	const initiateMfaChallenge = useCallback(
		async (device: MfaDevice) => {
			if (!flowContext.workerToken || !authCodeCredentials.environmentId) {
				v4ToastManager.showError('Worker token and environment ID are required for MFA challenge');
				return;
			}

			setIsLoading(true);
			try {
				console.log('🔐 [MFA Flow V7] Initiating MFA challenge for device:', device);

				// Store current scroll position to prevent jumping to top
				const currentScrollY = window.scrollY;

				// Prevent scrolling during API call
				const preventScroll = (e: Event) => {
					e.preventDefault();
					window.scrollTo(0, currentScrollY);
				};

				window.addEventListener('scroll', preventScroll, { passive: false });

				try {
					// Make real API call to initiate MFA challenge
					const challengeResponse = await fetch(`/api/mfa/challenge/initiate`, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							Authorization: `Bearer ${flowContext.workerToken}`,
						},
						body: JSON.stringify({
							environmentId: authCodeCredentials.environmentId,
							userId: flowContext.userId || 'current-user',
							deviceId: device.id,
							deviceType: device.type,
							challengeType: device.type,
						}),
					});

					if (!challengeResponse.ok) {
						throw new Error(`MFA challenge initiation failed: ${challengeResponse.statusText}`);
					}

					const challengeData = await challengeResponse.json();
					console.log('✅ [MFA Flow V7] MFA challenge initiated:', challengeData);

					// Create API call data for display
					const challengeInitiateCall = createApiCallData(
						'mfaChallengeInitiate',
						'POST',
						`/api/mfa/challenge/initiate`,
						{
							'Content-Type': 'application/json',
							Authorization: `Bearer ${flowContext.workerToken}`,
						},
						{
							environmentId: authCodeCredentials.environmentId,
							userId: flowContext.userId || 'current-user',
							deviceId: device.id,
							deviceType: device.type,
							challengeType: device.type,
						},
						{
							status: 200,
							statusText: 'OK',
							data: challengeData,
						},
						[
							'Initiates MFA challenge for the selected device',
							`Challenge type: ${device.type}`,
							'Requires worker token with MFA permissions',
							'Returns challenge ID and delivery status',
							'User will receive challenge code via selected method',
						]
					);

					setApiCalls((prev) => ({
						...prev,
						mfaChallengeInitiate: challengeInitiateCall,
					}));

					// Update MFA challenge state
					setMfaChallenge((prev) => ({
						...prev,
						challengeId: challengeData.challengeId,
						challengeType: device.type,
						isChallengeSent: true,
						challengeStatus: 'pending',
						selectedDevice: device,
					}));

					v4ToastManager.showSuccess(`MFA challenge sent to your ${device.type} device`);
				} finally {
					window.removeEventListener('scroll', preventScroll);
				}
			} catch (error) {
				console.error('❌ [MFA Flow V7] MFA challenge initiation failed:', error);
				v4ToastManager.showError(
					`Failed to initiate MFA challenge: ${error instanceof Error ? error.message : 'Unknown error'}`
				);
			} finally {
				setIsLoading(false);
			}
		},
		[
			flowContext.workerToken,
			flowContext.userId,
			authCodeCredentials.environmentId,
			createApiCallData,
		]
	);

	// Verify MFA Challenge
	const verifyMfaChallenge = useCallback(
		async (challengeCode: string) => {
			if (
				!mfaChallenge.challengeId ||
				!flowContext.workerToken ||
				!authCodeCredentials.environmentId
			) {
				v4ToastManager.showError(
					'Challenge ID, worker token, and environment ID are required for verification'
				);
				return;
			}

			setIsLoading(true);
			try {
				console.log('🔐 [MFA Flow V7] Verifying MFA challenge code:', challengeCode);

				// Store current scroll position to prevent jumping to top
				const currentScrollY = window.scrollY;

				// Prevent scrolling during API call
				const preventScroll = (e: Event) => {
					e.preventDefault();
					window.scrollTo(0, currentScrollY);
				};

				window.addEventListener('scroll', preventScroll, { passive: false });

				try {
					// Make real API call to verify MFA challenge
					const verifyResponse = await fetch(`/api/mfa/challenge/verify`, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							Authorization: `Bearer ${flowContext.workerToken}`,
						},
						body: JSON.stringify({
							environmentId: authCodeCredentials.environmentId,
							challengeId: mfaChallenge.challengeId,
							challengeCode: challengeCode,
							userId: flowContext.userId || 'current-user',
						}),
					});

					if (!verifyResponse.ok) {
						throw new Error(`MFA challenge verification failed: ${verifyResponse.statusText}`);
					}

					const verifyData = await verifyResponse.json();
					console.log('✅ [MFA Flow V7] MFA challenge verified:', verifyData);

					// Create API call data for display
					const challengeVerifyCall = createApiCallData(
						'mfaChallengeVerify',
						'POST',
						`/api/mfa/challenge/verify`,
						{
							'Content-Type': 'application/json',
							Authorization: `Bearer ${flowContext.workerToken}`,
						},
						{
							environmentId: authCodeCredentials.environmentId,
							challengeId: mfaChallenge.challengeId,
							challengeCode: challengeCode,
							userId: flowContext.userId || 'current-user',
						},
						{
							status: 200,
							statusText: 'OK',
							data: verifyData,
						},
						[
							'Verifies the MFA challenge code entered by user',
							'Challenge code is validated against the initiated challenge',
							'Returns verification status and session token',
							'Successful verification allows token exchange',
							'Failed verification requires retry or new challenge',
						]
					);

					setApiCalls((prev) => ({
						...prev,
						mfaChallengeVerify: challengeVerifyCall,
					}));

					// Update MFA challenge state
					setMfaChallenge((prev) => ({
						...prev,
						challengeStatus: verifyData.success ? 'completed' : 'failed',
					}));

					if (verifyData.success) {
						v4ToastManager.showSuccess('MFA challenge completed successfully!');
						// Move to token retrieval step
						setCurrentStep('token_retrieval');
						onStepChange?.('token_retrieval');
					} else {
						v4ToastManager.showError('MFA challenge verification failed. Please try again.');
					}
				} finally {
					window.removeEventListener('scroll', preventScroll);
				}
			} catch (error) {
				console.error('❌ [MFA Flow V7] MFA challenge verification failed:', error);
				v4ToastManager.showError(
					`Failed to verify MFA challenge: ${error instanceof Error ? error.message : 'Unknown error'}`
				);
			} finally {
				setIsLoading(false);
			}
		},
		[
			mfaChallenge.challengeId,
			flowContext.workerToken,
			flowContext.userId,
			authCodeCredentials.environmentId,
			createApiCallData,
			onStepChange,
		]
	);

	// Token Exchange function
	const exchangeToken = useCallback(async () => {
		if (
			!flowContext.authCode ||
			!authCodeCredentials.environmentId ||
			!authCodeCredentials.clientId ||
			!authCodeCredentials.clientSecret
		) {
			v4ToastManager.showError('Missing authorization code or credentials for token exchange');
			return;
		}

		setIsLoading(true);
		try {
			// Get PKCE code verifier
			const pkceData =
				sessionStorage.getItem('mfa-pkce-codes') || sessionStorage.getItem('pingone_mfa_v7_pkce');
			if (!pkceData) {
				throw new Error('PKCE code verifier not found');
			}

			const { codeVerifier } = JSON.parse(pkceData);

			// Prepare token exchange request
			const tokenEndpoint = `https://auth.pingone.com/${authCodeCredentials.environmentId}/as/token`;
			const requestBody = {
				grant_type: 'authorization_code',
				code: flowContext.authCode,
				redirect_uri: authCodeCredentials.redirectUri || 'https://localhost:3000/mfa-callback',
				client_id: authCodeCredentials.clientId,
				client_secret: authCodeCredentials.clientSecret,
				code_verifier: codeVerifier,
				environment_id: authCodeCredentials.environmentId,
			};

			console.log('🔐 [MFA Flow V7] Exchanging authorization code for tokens:', {
				tokenEndpoint,
				hasCode: !!flowContext.authCode,
				hasCodeVerifier: !!codeVerifier,
				environmentId: authCodeCredentials.environmentId,
			});

			// Make token exchange request through backend proxy
			const tokenResponse = await fetch('/api/token-exchange', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(requestBody),
			});

			const tokenData = await tokenResponse.json();

			if (!tokenResponse.ok) {
				throw new Error(tokenData.error_description || 'Token exchange failed');
			}

			console.log('✅ [MFA Flow V7] Token exchange successful:', {
				hasAccessToken: !!tokenData.access_token,
				hasIdToken: !!tokenData.id_token,
				hasRefreshToken: !!tokenData.refresh_token,
			});

			// Extract userId from id_token
			let userId = '';
			if (tokenData.id_token) {
				try {
					const payload = JSON.parse(atob(tokenData.id_token.split('.')[1]));
					userId = payload.sub || payload.user_id || payload.id || '';
					console.log(`🔐 [MFA Flow V7] Extracted userId from id_token: ${userId}`);
				} catch (error) {
					console.error('🔐 [MFA Flow V7] Failed to decode id_token:', error);
				}
			}

			// Store tokens and userId in flow context
			setFlowContext((prev) => ({
				...prev,
				userId: userId,
				tokens: {
					access_token: tokenData.access_token,
					refresh_token: tokenData.refresh_token,
					id_token: tokenData.id_token,
					token_type: tokenData.token_type,
					expires_in: tokenData.expires_in,
				},
			}));

			// Create API call data for display
			const tokenExchangeCall = createApiCallData(
				'tokenExchange',
				'POST' as const,
				tokenEndpoint,
				{
					'Content-Type': 'application/json',
				},
				JSON.stringify(requestBody),
				{
					status: 200,
					statusText: 'OK',
					data: {
						access_token: tokenData.access_token
							? `${tokenData.access_token.substring(0, 20)}...`
							: null,
						id_token: tokenData.id_token ? `${tokenData.id_token.substring(0, 20)}...` : null,
						refresh_token: tokenData.refresh_token
							? `${tokenData.refresh_token.substring(0, 20)}...`
							: null,
						token_type: tokenData.token_type,
						expires_in: tokenData.expires_in,
					},
				}
			);

			setApiCalls((prev) => ({
				...prev,
				tokenExchange: tokenExchangeCall,
			}));

			v4ToastManager.showSuccess('✅ Tokens retrieved successfully!');

			// Move to success step
			setCurrentStep('success');
			onStepChange?.('success');
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			console.error('❌ [MFA Flow V7] Token exchange failed:', error);
			v4ToastManager.showError(`Token exchange failed: ${errorMessage}`);
		} finally {
			setIsLoading(false);
		}
	}, [flowContext.authCode, authCodeCredentials, createApiCallData, onStepChange]);

	const renderCurrentStep = () => {
		if (isLoading && currentStep === 'username_login') {
			return (
				<div style={{ textAlign: 'center', padding: '3rem' }}>
					<FiRefreshCw size={48} color="#7c3aed" style={{ animation: 'spin 1s linear infinite' }} />
					<h3 style={{ margin: '1rem 0 0.5rem 0', fontSize: '1.25rem', fontWeight: '600' }}>
						Initializing PingOne MFA Flow V7
					</h3>
					<p style={{ margin: 0, color: '#6b7280' }}>
						Setting up your secure multi-factor authentication flow...
					</p>
				</div>
			);
		}

		switch (currentStep) {
			case 'username_login':
				return (
					<>
						{/* Configuration Explanation */}
						<CollapsibleHeaderService.CollapsibleHeader
							title="⚠️ Important: PingOne Configuration Requirements"
							subtitle="Understanding the two different authentication flows and their requirements"
							icon={<FiAlertTriangle />}
							theme="orange"
							defaultCollapsed={true}
						>
							<InfoBox $variant="warning">
								<FiAlertTriangle size={20} style={{ flexShrink: 0 }} />
								<InfoContent>
									<InfoTitle>🚨 Common Configuration Issues</InfoTitle>
									<InfoText>
										<strong>Error: "Redirect URI mismatch"</strong> - Your PingOne application must
										have the redirect URI configured.
										<br />
										<strong>Error: "unsupported_grant_type: password"</strong> - PingOne does not
										support Resource Owner Password Credentials flow.
									</InfoText>
								</InfoContent>
							</InfoBox>

							<div
								style={{
									margin: '1rem 0',
									padding: '1rem',
									background: '#fef3c7',
									borderRadius: '0.75rem',
									border: '1px solid #f59e0b',
								}}
							>
								<h4
									style={{
										margin: '0 0 0.75rem 0',
										fontSize: '0.875rem',
										fontWeight: 600,
										color: '#92400e',
									}}
								>
									📋 PingOne Application Setup Checklist
								</h4>
								<div style={{ fontSize: '0.75rem', color: '#92400e', lineHeight: 1.6 }}>
									<div style={{ marginBottom: '0.5rem' }}>
										<strong>1. Create/Configure Your PingOne Application:</strong>
										<ul style={{ margin: '0.25rem 0 0 1rem', padding: 0 }}>
											<li>Go to PingOne Admin Console → Applications</li>
											<li>Create a new application or edit existing one</li>
											<li>
												Set <strong>Grant Types</strong>: ✅ Authorization Code, ✅ Client
												Credentials
											</li>
											<li>
												Set <strong>Response Types</strong>: ✅ Code
											</li>
										</ul>
									</div>
									<div style={{ marginBottom: '0.5rem' }}>
										<strong>2. Configure Redirect URIs:</strong>
										<ul style={{ margin: '0.25rem 0 0 1rem', padding: 0 }}>
											<li>
												Add: <code>https://localhost:3000/oauth-callback</code>
											</li>
											<li>
												Add: <code>https://localhost:3000</code> (for redirectless)
											</li>
											<li>These must match exactly what you enter below</li>
										</ul>
									</div>
									<div style={{ marginBottom: '0.5rem' }}>
										<strong>3. Get Your Credentials:</strong>
										<ul style={{ margin: '0.25rem 0 0 1rem', padding: 0 }}>
											<li>
												Copy <strong>Client ID</strong> and <strong>Client Secret</strong>
											</li>
											<li>
												Copy <strong>Environment ID</strong> from your environment
											</li>
											<li>These will be used for both configurations below</li>
										</ul>
									</div>
								</div>
							</div>

							<div
								style={{
									margin: '1rem 0',
									padding: '1rem',
									background: '#f0f9ff',
									borderRadius: '0.75rem',
									border: '1px solid #0ea5e9',
								}}
							>
								<h4
									style={{
										margin: '0 0 0.75rem 0',
										fontSize: '0.875rem',
										fontWeight: 600,
										color: '#0c4a6e',
									}}
								>
									🔄 Two Authentication Flows Explained
								</h4>
								<div style={{ fontSize: '0.75rem', color: '#0c4a6e', lineHeight: 1.6 }}>
									<div style={{ marginBottom: '0.75rem' }}>
										<strong>🔑 Worker Token (Client Credentials):</strong>
										<ul style={{ margin: '0.25rem 0 0 1rem', padding: 0 }}>
											<li>Machine-to-machine authentication</li>
											<li>No user interaction required</li>
											<li>Used for MFA operations and API calls</li>
											<li>No redirect URI needed</li>
										</ul>
									</div>
									<div>
										<strong>👤 User Authentication (Authorization Code):</strong>
										<ul style={{ margin: '0.25rem 0 0 1rem', padding: 0 }}>
											<li>User login with username/password</li>
											<li>Requires redirect URI configuration</li>
											<li>Used for user authentication flows</li>
											<li>Supports both redirect and redirectless modes</li>
										</ul>
									</div>
								</div>
							</div>
						</CollapsibleHeaderService.CollapsibleHeader>

						{/* Worker Token Configuration - Using ComprehensiveCredentialsService */}
						<ComprehensiveCredentialsService
							flowType="worker-token-v7"
							isOIDC={false}
							workerToken={flowContext.workerToken || localStorage.getItem('worker_token') || ''}
							credentials={{
								environmentId: workerTokenCredentials.environmentId,
								clientId: workerTokenCredentials.clientId,
								clientSecret: workerTokenCredentials.clientSecret,
								scopes:
									workerTokenCredentials.scopes.join(' ') ||
									'p1:read:user p1:update:user p1:read:device p1:update:device',
								region: workerTokenCredentials.region || 'us',
								redirectUri: '', // Worker token flow doesn't use redirect URI
							}}
							onCredentialsChange={(credentials) => {
								console.log('[CompleteMFA-V7] Worker Token credentials changed:', credentials);
								setWorkerTokenCredentials((prev) => ({
									...prev,
									environmentId: credentials.environmentId || prev.environmentId,
									clientId: credentials.clientId || prev.clientId,
									clientSecret: credentials.clientSecret || prev.clientSecret,
									scopes: credentials.scopes ? credentials.scopes.split(' ') : prev.scopes,
									region: (credentials.region as 'us' | 'eu' | 'ap' | 'ca') || prev.region,
								}));
								setHasUnsavedWorkerTokenChanges(true);
							}}
							onClientAuthMethodChange={(method) => {
								console.log('[CompleteMFA-V7] Worker Token Client Auth Method changed:', method);
								setWorkerTokenCredentials((prev) => ({
									...prev,
									tokenEndpointAuthMethod: method,
								}));
								setHasUnsavedWorkerTokenChanges(true);
							}}
							clientAuthMethod={
								workerTokenCredentials.tokenEndpointAuthMethod || 'client_secret_post'
							}
							onDiscoveryComplete={(result) => {
								console.log('🔍 [CompleteMFA-V7] Worker Token OIDC Discovery completed:', result);
								if (result.success && result.document) {
									const extractedEnvId = oidcDiscoveryService.extractEnvironmentId(
										result.document.issuer
									);
									if (extractedEnvId) {
										console.log('✅ [CompleteMFA-V7] Extracted environment ID:', extractedEnvId);
										setWorkerTokenCredentials((prev) => ({
											...prev,
											environmentId: extractedEnvId,
										}));
										setHasUnsavedWorkerTokenChanges(true);
									}
								}
							}}
							onSave={async () => {
								await handleSaveWorkerTokenCredentials();
							}}
							requireClientSecret={true}
							showRedirectUri={false}
							// Config Checker - Disabled to remove pre-flight API calls
							showConfigChecker={false}
							defaultCollapsed={true}
							title="🔑 Worker Token Configuration"
							subtitle="Client Credentials Grant • Machine-to-Machine Authentication • No Redirect URI Required"
						/>

						{/* Error Display with Troubleshooting Steps */}
						{errorDetails && (
							<OAuthErrorDisplay
								errorDetails={errorDetails}
								onDismiss={() => setErrorDetails(null)}
								onClearAndRetry={() => {
									setErrorDetails(null);
									// Clear the form to help user start fresh
									setWorkerTokenCredentials({
										environmentId: '',
										clientId: '',
										clientSecret: '',
										scopes: [
											'p1:read:user',
											'p1:update:user',
											'p1:read:device',
											'p1:update:device',
										],
										tokenEndpointAuthMethod: 'client_secret_post',
									});
								}}
								showCorrelationId={true}
							/>
						)}

						{/* Note: Authorization Code Configuration is handled by ComprehensiveCredentialsService above */}

						{/* Worker Token API Call Display */}
						<CollapsibleHeaderService.CollapsibleHeader
							title="Step 1: Get Worker Token"
							subtitle="Obtain a worker token for MFA operations"
							icon={<FiKey />}
							theme="blue"
						>
							<div style={{ marginBottom: '1rem' }}>
								<p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1rem' }}>
									Before performing MFA operations, we need to obtain a worker token that has the
									necessary permissions to manage MFA devices and challenges.
								</p>

								{apiCalls.workerToken ? (
									<div>
										<EnhancedApiCallDisplay
											apiCall={apiCalls.workerToken}
											options={{
												showEducationalNotes: true,
												showFlowContext: true,
												urlHighlightRules:
													EnhancedApiCallDisplayService.getDefaultHighlightRules(
														'client-credentials'
													),
											}}
										/>
										<div
											style={{
												marginTop: '1rem',
												display: 'flex',
												justifyContent: 'center',
												gap: '1rem',
											}}
										>
											<button
												type="button"
												onClick={getWorkerToken}
												disabled={isLoading}
												style={{
													background: isLoading ? '#9ca3af' : '#10b981',
													color: 'white',
													border: 'none',
													padding: '0.5rem 1rem',
													borderRadius: '6px',
													cursor: isLoading ? 'not-allowed' : 'pointer',
													fontSize: '0.875rem',
													fontWeight: '500',
													display: 'flex',
													alignItems: 'center',
													gap: '0.5rem',
													transition: 'all 0.2s ease',
												}}
											>
												{isLoading ? (
													<>
														<SpinningIcon>
															<FiRefreshCw size={16} />
														</SpinningIcon>
														Getting New Token...
													</>
												) : (
													<>
														<FiRefreshCw size={16} />
														Get New Worker Token
													</>
												)}
											</button>
										</div>
									</div>
								) : (
									<div
										style={{
											padding: '1rem',
											background: '#f8fafc',
											border: '1px solid #e2e8f0',
											borderRadius: '8px',
											textAlign: 'center',
											color: '#6b7280',
										}}
									>
										<FiKey size={24} style={{ marginBottom: '0.5rem' }} />
										<p style={{ marginBottom: '1rem' }}>
											Worker token API call will be displayed here after authentication
										</p>
										<button
											type="button"
											onClick={getWorkerToken}
											disabled={isLoading}
											style={{
												background: isLoading ? '#9ca3af' : '#3b82f6',
												color: 'white',
												border: 'none',
												padding: '0.5rem 1rem',
												borderRadius: '6px',
												cursor: isLoading ? 'not-allowed' : 'pointer',
												fontSize: '0.875rem',
												fontWeight: '500',
												display: 'flex',
												alignItems: 'center',
												gap: '0.5rem',
												transition: 'all 0.2s ease',
											}}
										>
											{isLoading ? (
												<>
													<SpinningIcon>
														<FiRefreshCw size={16} />
													</SpinningIcon>
													Getting Token...
												</>
											) : (
												<>
													<FiKey size={16} />
													Get Worker Token
												</>
											)}
										</button>
									</div>
								)}
							</div>
						</CollapsibleHeaderService.CollapsibleHeader>

						{/* User Authentication Section */}
						<CollapsibleHeaderService.CollapsibleHeader
							title="🔐 USER AUTHENTICATION"
							subtitle="Choose between Redirect or Redirectless Authentication • Uses Authorization Code Configuration Above"
							icon={<FiLogIn />}
							theme="green"
							defaultCollapsed={false}
						>
							<div style={{ marginBottom: '1rem' }}>
								<p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1rem' }}>
									Choose your preferred authentication method. Redirect authentication opens a new
									window, while redirectless authentication uses response_mode=pi.flow for seamless
									integration.
								</p>

								{/* Username and Password Input for Redirectless Authentication */}
								<div
									style={{
										marginBottom: '1.5rem',
										padding: '1rem',
										background: '#f8fafc',
										border: '1px solid #e2e8f0',
										borderRadius: '8px',
									}}
								>
									<h4
										style={{
											margin: '0 0 1rem 0',
											fontSize: '0.875rem',
											fontWeight: '600',
											color: '#374151',
										}}
									>
										👤 User Credentials (Required for Redirectless Authentication)
									</h4>

									<div
										style={{
											display: 'grid',
											gridTemplateColumns: '1fr 1fr',
											gap: '1rem',
											marginBottom: '1rem',
										}}
									>
										<div>
											<label
												htmlFor="username-input"
												style={{
													display: 'block',
													fontSize: '0.75rem',
													fontWeight: '500',
													color: '#374151',
													marginBottom: '0.25rem',
												}}
											>
												Username
											</label>
											<input
												id="username-input"
												type="text"
												value={credentials.username || 'curtis7'}
												onChange={(e) =>
													setCredentials((prev) => ({ ...prev, username: e.target.value }))
												}
												placeholder="Enter your username"
												style={{
													width: '100%',
													padding: '0.5rem',
													border: '1px solid #d1d5db',
													borderRadius: '4px',
													fontSize: '0.875rem',
													background: '#ffffff',
												}}
											/>
										</div>
										<div>
											<label
												htmlFor="password-input"
												style={{
													display: 'block',
													fontSize: '0.75rem',
													fontWeight: '500',
													color: '#374151',
													marginBottom: '0.25rem',
												}}
											>
												Password
											</label>
											<input
												id="password-input"
												type="password"
												value={credentials.password || 'Wolverine7&'}
												onChange={(e) =>
													setCredentials((prev) => ({ ...prev, password: e.target.value }))
												}
												placeholder="Enter your password"
												style={{
													width: '100%',
													padding: '0.5rem',
													border: '1px solid #d1d5db',
													borderRadius: '4px',
													fontSize: '0.875rem',
													background: '#ffffff',
												}}
											/>
										</div>
									</div>
								</div>

								<div
									style={{
										display: 'grid',
										gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
										gap: '1rem',
										marginBottom: '1.5rem',
									}}
								>
									<button
										type="button"
										onClick={() => handleUsernameLogin('redirectless')}
										disabled={isLoading || !credentials.username || !credentials.password}
										style={{
											padding: '1.25rem',
											background:
												!credentials.username || !credentials.password ? '#9ca3af' : '#059669',
											color: 'white',
											border: 'none',
											borderRadius: '12px',
											fontSize: '1rem',
											fontWeight: '700',
											cursor:
												isLoading || !credentials.username || !credentials.password
													? 'not-allowed'
													: 'pointer',
											opacity:
												isLoading || !credentials.username || !credentials.password ? 0.6 : 1,
											transition: 'all 0.2s ease',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											gap: '0.75rem',
											flexDirection: 'column',
											textAlign: 'center',
											boxShadow:
												!credentials.username || !credentials.password
													? 'none'
													: '0 4px 12px rgba(5, 150, 105, 0.3)',
											transform:
												!credentials.username || !credentials.password
													? 'none'
													: 'translateY(-2px)',
											position: 'relative',
										}}
									>
										<div
											style={{
												position: 'absolute',
												top: '-8px',
												right: '-8px',
												background: '#f59e0b',
												color: 'white',
												fontSize: '0.625rem',
												fontWeight: '600',
												padding: '0.25rem 0.5rem',
												borderRadius: '12px',
												textTransform: 'uppercase',
												letterSpacing: '0.05em',
											}}
										>
											Default
										</div>
										<FiZap size={28} />
										<div>
											<div
												style={{ fontWeight: '700', marginBottom: '0.25rem', fontSize: '1.1rem' }}
											>
												Redirectless Authentication
											</div>
											<div style={{ fontSize: '0.8rem', opacity: 0.9 }}>
												Uses response_mode=pi.flow
											</div>
										</div>
									</button>

									<button
										type="button"
										onClick={() => handleUsernameLogin('redirect')}
										disabled={false}
										style={{
											padding: '1rem',
											background: '#3b82f6',
											color: 'white',
											border: 'none',
											borderRadius: '8px',
											fontSize: '0.875rem',
											fontWeight: '600',
											cursor: 'pointer',
											opacity: 1,
											transition: 'all 0.2s ease',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											gap: '0.5rem',
											flexDirection: 'column',
											textAlign: 'center',
										}}
									>
										<FiExternalLink size={24} />
										<div>
											<div style={{ fontWeight: '700', marginBottom: '0.25rem' }}>
												Redirect Authentication
											</div>
											<div style={{ fontSize: '0.75rem', opacity: 0.9 }}>
												PingOne provides the UI
											</div>
										</div>
									</button>
								</div>

								{/* Client ID Display */}
								<div
									style={{
										marginTop: '1.5rem',
										padding: '1rem',
										background: '#f0f9ff',
										border: '1px solid #0ea5e9',
										borderRadius: '0.5rem',
									}}
								>
									<div
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: '0.5rem',
											marginBottom: '0.5rem',
										}}
									>
										<FiKey size={16} style={{ color: '#0ea5e9' }} />
										<span
											style={{
												fontSize: '0.875rem',
												fontWeight: '600',
												color: '#0c4a6e',
											}}
										>
											Using Client ID for Authentication:
										</span>
									</div>
									<div
										style={{
											fontFamily: 'monospace',
											fontSize: '0.75rem',
											color: '#0c4a6e',
											background: '#ffffff',
											padding: '0.5rem',
											borderRadius: '0.25rem',
											border: '1px solid #bae6fd',
											wordBreak: 'break-all',
										}}
									>
										{authCodeCredentials.clientId || 'No Client ID configured'}
									</div>
									{!authCodeCredentials.clientId && (
										<div
											style={{
												marginTop: '0.5rem',
												fontSize: '0.75rem',
												color: '#dc2626',
												fontStyle: 'italic',
											}}
										>
											⚠️ Please configure the Authorization Code Configuration above before
											proceeding
										</div>
									)}
								</div>

								<InfoBox $variant="info">
									<FiInfo size={20} style={{ flexShrink: 0 }} />
									<InfoContent>
										<InfoTitle>🔐 Authentication Methods</InfoTitle>
										<InfoText>
											<strong>Redirect:</strong> Traditional OAuth flow where PingOne provides the
											authentication UI in a new window.
											<br />
											<strong>Redirectless:</strong> Modern PingOne flow using
											response_mode=pi.flow. You must provide username/password above as our app
											handles the authentication directly.
										</InfoText>
									</InfoContent>
								</InfoBox>
							</div>
						</CollapsibleHeaderService.CollapsibleHeader>
					</>
				);

			case 'mfa_enrollment':
				return (
					<CollapsibleHeaderService.CollapsibleHeader
						title="MFA Device Enrollment"
						subtitle="Set up your multi-factor authentication device"
						icon={<FiSmartphone />}
						theme="green"
						defaultCollapsed={false}
					>
						<InfoBox $variant="info">
							<FiInfo size={20} style={{ flexShrink: 0 }} />
							<InfoContent>
								<InfoTitle>📱 MFA Device Setup</InfoTitle>
								<InfoText>
									Choose your preferred multi-factor authentication method. This will be used to
									verify your identity during future logins.
								</InfoText>
							</InfoContent>
						</InfoBox>

						{/* PingOne MFA Response Options */}
						<div style={{ marginTop: '1.5rem' }}>
							<h4
								style={{
									margin: '0 0 1rem 0',
									fontSize: '1rem',
									fontWeight: '600',
									color: '#374151',
								}}
							>
								🔧 PingOne MFA Response Options
							</h4>

							<div
								style={{
									display: 'grid',
									gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
									gap: '1rem',
									marginBottom: '1.5rem',
								}}
							>
								<button
									type="button"
									onClick={() => handlePingOneMfaResponse('pi.flow')}
									disabled={isLoading}
									style={{
										padding: '0.75rem 1rem',
										background: '#3b82f6',
										color: 'white',
										border: 'none',
										borderRadius: '6px',
										fontSize: '0.875rem',
										fontWeight: '600',
										cursor: isLoading ? 'not-allowed' : 'pointer',
										opacity: isLoading ? 0.6 : 1,
										transition: 'all 0.2s ease',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										gap: '0.5rem',
									}}
								>
									<FiArrowRight size={16} />
									response_mode=pi.flow
								</button>

								<button
									type="button"
									onClick={() => handlePingOneMfaResponse('redirect')}
									disabled={isLoading}
									style={{
										padding: '0.75rem 1rem',
										background: '#10b981',
										color: 'white',
										border: 'none',
										borderRadius: '6px',
										fontSize: '0.875rem',
										fontWeight: '600',
										cursor: isLoading ? 'not-allowed' : 'pointer',
										opacity: isLoading ? 0.6 : 1,
										transition: 'all 0.2s ease',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										gap: '0.5rem',
									}}
								>
									<FiExternalLink size={16} />
									redirect
								</button>

								<button
									type="button"
									onClick={() => handlePingOneMfaResponse('form_post')}
									disabled={isLoading}
									style={{
										padding: '0.75rem 1rem',
										background: '#f59e0b',
										color: 'white',
										border: 'none',
										borderRadius: '6px',
										fontSize: '0.875rem',
										fontWeight: '600',
										cursor: isLoading ? 'not-allowed' : 'pointer',
										opacity: isLoading ? 0.6 : 1,
										transition: 'all 0.2s ease',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										gap: '0.5rem',
									}}
								>
									<FiSend size={16} />
									form_post
								</button>

								<button
									type="button"
									onClick={() => handlePingOneMfaResponse('fragment')}
									disabled={isLoading}
									style={{
										padding: '0.75rem 1rem',
										background: '#8b5cf6',
										color: 'white',
										border: 'none',
										borderRadius: '6px',
										fontSize: '0.875rem',
										fontWeight: '600',
										cursor: isLoading ? 'not-allowed' : 'pointer',
										opacity: isLoading ? 0.6 : 1,
										transition: 'all 0.2s ease',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										gap: '0.5rem',
									}}
								>
									<FiHash size={16} />
									fragment
								</button>
							</div>

							{/* MFA Device Registration API Call Display */}
							{apiCalls.deviceRegistration ? (
								<EnhancedApiCallDisplay
									apiCall={apiCalls.deviceRegistration}
									options={{
										showEducationalNotes: true,
										showFlowContext: true,
										urlHighlightRules:
											EnhancedApiCallDisplayService.getDefaultHighlightRules('mfa'),
									}}
								/>
							) : (
								<div
									style={{
										padding: '1rem',
										background: '#f8fafc',
										border: '1px solid #e2e8f0',
										borderRadius: '8px',
										textAlign: 'center',
										color: '#6b7280',
									}}
								>
									<FiSmartphone size={24} style={{ marginBottom: '0.5rem' }} />
									<p>Click a response option above to see the PingOne MFA API call</p>
								</div>
							)}
						</div>

						<div
							style={{
								marginTop: '1.5rem',
								display: 'flex',
								gap: '0.75rem',
								justifyContent: 'space-between',
							}}
						>
							<NavigationButton
								onClick={() => {
									setCurrentStep('username_login');
									onStepChange?.('username_login');
								}}
								style={{ background: '#6b7280', color: 'white' }}
							>
								<FiArrowLeft />
								Back to Login
							</NavigationButton>
							<NavigationButton
								onClick={() => {
									setCurrentStep('device_pairing');
									onStepChange?.('device_pairing');
								}}
							>
								<FiArrowRight />
								Continue to Device Registration
							</NavigationButton>
						</div>
					</CollapsibleHeaderService.CollapsibleHeader>
				);

			case 'device_pairing':
				return (
					<CollapsibleHeaderService.CollapsibleHeader
						title="Device Registration"
						subtitle="Register your MFA device with PingOne"
						icon={<FiSmartphone />}
						theme="yellow"
						defaultCollapsed={false}
					>
						{!flowContext.userId ? (
							<InfoBox $variant="warning">
								<FiAlertTriangle size={20} style={{ flexShrink: 0 }} />
								<InfoContent>
									<InfoTitle>⚠️ Authentication Required</InfoTitle>
									<InfoText>
										You need to complete authentication first to get your user ID before registering
										devices. Please go back to the authentication step and complete the flow.
									</InfoText>
								</InfoContent>
							</InfoBox>
						) : (
							<InfoBox $variant="info">
								<FiInfo size={20} style={{ flexShrink: 0 }} />
								<InfoContent>
									<InfoTitle>📱 MFA Device Registration</InfoTitle>
									<InfoText>
										Select your preferred MFA method and provide the required information to
										register your device with PingOne.
									</InfoText>
								</InfoContent>
							</InfoBox>
						)}

						{/* Device Type Selection */}
						<div style={{ margin: '1.5rem 0' }}>
							<h4
								style={{
									margin: '0 0 1rem 0',
									fontSize: '1rem',
									fontWeight: 600,
									color: '#1f2937',
								}}
							>
								Select MFA Device Type
							</h4>

							<div
								style={{
									display: 'grid',
									gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
									gap: '1rem',
								}}
							>
								{[
									{
										id: 'sms',
										name: 'SMS',
										icon: '📱',
										description: 'Receive codes via text message',
									},
									{
										id: 'email',
										name: 'Email',
										icon: '📧',
										description: 'Receive codes via email',
									},
									{
										id: 'totp',
										name: 'Authenticator App',
										icon: '🔐',
										description: 'Google Authenticator, Authy, etc.',
									},
									{
										id: 'fido2',
										name: 'Passkey/FIDO2',
										icon: '🔑',
										description: 'Touch ID, Face ID, YubiKey, FIDO2 security key',
									},
									{
										id: 'push',
										name: 'Push Notification',
										icon: '🔔',
										description: 'Mobile app push notifications',
									},
								].map((device) => (
									<button
										key={device.id}
										type="button"
										onClick={() => {
											setSelectedDeviceType(device.id);
											// Clear device name when switching device types
											setDeviceInfo((prev) => ({ ...prev, deviceName: '' }));
										}}
										style={{
											padding: '1rem',
											border:
												selectedDeviceType === device.id
													? '2px solid #3b82f6'
													: '1px solid #e5e7eb',
											borderRadius: '0.5rem',
											cursor: 'pointer',
											backgroundColor: selectedDeviceType === device.id ? '#eff6ff' : '#ffffff',
											transition: 'all 0.2s ease',
										}}
									>
										<div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{device.icon}</div>
										<div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{device.name}</div>
										<div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
											{device.description}
										</div>
									</button>
								))}
							</div>
						</div>

						{/* Device Information Form */}
						{selectedDeviceType && (
							<div
								style={{
									margin: '1.5rem 0',
									padding: '1.5rem',
									background: '#f9fafb',
									borderRadius: '0.75rem',
									border: '1px solid #e5e7eb',
								}}
							>
								<h4
									style={{
										margin: '0 0 1rem 0',
										fontSize: '1rem',
										fontWeight: 600,
										color: '#1f2937',
									}}
								>
									Device Information
								</h4>

								{/* Device Name Input */}
								<div style={{ marginBottom: '1rem' }}>
									<label
										htmlFor="device-name-input"
										style={{
											display: 'block',
											marginBottom: '0.5rem',
											fontWeight: 500,
											color: '#374151',
											fontSize: '0.875rem',
										}}
									>
										Device Name <span style={{ color: '#ef4444' }}>*</span>
									</label>
									<input
										id="device-name-input"
										type="text"
										value={deviceInfo.deviceName}
										onChange={(e) =>
											setDeviceInfo((prev) => ({ ...prev, deviceName: e.target.value }))
										}
										placeholder={`My ${selectedDeviceType.toUpperCase()} Device`}
										required
										style={{
											width: '100%',
											padding: '0.75rem',
											border: '1px solid #d1d5db',
											borderRadius: '0.375rem',
											fontSize: '0.875rem',
											background: '#ffffff',
										}}
									/>
									<div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
										Give your device a friendly name (e.g., "My iPhone", "Work Phone")
									</div>
								</div>

								{selectedDeviceType === 'sms' && (
									<PhoneNumberInput
										value={deviceInfo.phoneNumber}
										autoConcatenate={false}
										onChange={(fullPhoneNumber) => {
											setDeviceInfo((prev) => ({ ...prev, phoneNumber: fullPhoneNumber }));
										}}
										onCountryCodeChange={(countryCode) => {
											setSelectedCountryCode(countryCode);
										}}
										placeholder="Enter phone number"
										required={true}
										label="Phone Number"
										helpText="Enter your phone number with country code for SMS-based MFA"
									/>
								)}

								{selectedDeviceType === 'email' && (
									<div>
										<label
											htmlFor="device-email"
											style={{
												display: 'block',
												marginBottom: '0.5rem',
												fontWeight: 500,
												color: '#374151',
											}}
										>
											Email Address *
										</label>
										<input
											id="device-email"
											type="email"
											value={deviceInfo.email}
											onChange={(e) =>
												setDeviceInfo((prev) => ({ ...prev, email: e.target.value }))
											}
											placeholder="user@example.com"
											style={{
												width: '100%',
												padding: '0.75rem',
												border: '1px solid #d1d5db',
												borderRadius: '0.375rem',
												fontSize: '0.875rem',
											}}
										/>
										<div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
											Enter your email address for email-based MFA codes
										</div>
									</div>
								)}

								{selectedDeviceType === 'totp' && (
									<div>
										<div
											style={{
												marginBottom: '1rem',
												padding: '1rem',
												background: '#eff6ff',
												borderRadius: '0.5rem',
												border: '1px solid #93c5fd',
											}}
										>
											<h5
												style={{
													margin: '0 0 0.5rem 0',
													fontSize: '0.875rem',
													fontWeight: 600,
													color: '#1e40af',
												}}
											>
												📱 Authenticator App Setup
											</h5>
											<div
												style={{
													fontSize: '0.75rem',
													color: '#1e40af',
													lineHeight: 1.5,
													marginBottom: '1rem',
												}}
											>
												<div>
													1. Install an authenticator app (Google Authenticator, Authy, Microsoft
													Authenticator)
												</div>
												<div>2. Scan the QR code or enter the secret key</div>
												<div>3. Enter the 6-digit code from your app to verify</div>
											</div>
											<button
												type="button"
												onClick={handleShowTOTPQRCode}
												style={{
													padding: '0.75rem 1rem',
													backgroundColor: '#3b82f6',
													color: 'white',
													border: 'none',
													borderRadius: '0.375rem',
													fontSize: '0.875rem',
													fontWeight: '600',
													cursor: 'pointer',
													display: 'flex',
													alignItems: 'center',
													gap: '0.5rem',
												}}
											>
												<FiKey size={16} />
												Setup Authenticator App
											</button>
										</div>

										<div>
											<label
												htmlFor="verification-code"
												style={{
													display: 'block',
													marginBottom: '0.5rem',
													fontWeight: 500,
													color: '#374151',
												}}
											>
												Verification Code *
											</label>
											<input
												id="verification-code"
												type="text"
												value={deviceInfo.verificationCode}
												onChange={(e) =>
													setDeviceInfo((prev) => ({ ...prev, verificationCode: e.target.value }))
												}
												placeholder="123456"
												maxLength={6}
												style={{
													width: '100%',
													padding: '0.75rem',
													border: '1px solid #d1d5db',
													borderRadius: '0.375rem',
													fontSize: '0.875rem',
													textAlign: 'center',
													letterSpacing: '0.1em',
													fontFamily: 'monospace',
												}}
											/>
											<div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
												Enter the 6-digit code from your authenticator app
											</div>
										</div>
									</div>
								)}

								{selectedDeviceType === 'fido2' && (
									<div>
										<div
											style={{
												marginBottom: '1rem',
												padding: '1rem',
												background: '#f0fdf4',
												borderRadius: '0.5rem',
												border: '1px solid #86efac',
											}}
										>
											<h5
												style={{
													margin: '0 0 0.5rem 0',
													fontSize: '0.875rem',
													fontWeight: 600,
													color: '#166534',
												}}
											>
												🔑 Passkey & FIDO2 Setup
											</h5>
											<div
												style={{
													fontSize: '0.75rem',
													color: '#166534',
													lineHeight: 1.5,
													marginBottom: '1rem',
												}}
											>
												<div>
													1. <strong>Passkeys:</strong> Touch ID, Face ID, Windows Hello, Android
													biometrics
												</div>
												<div>
													2. <strong>Hardware Keys:</strong> YubiKey, FIDO2 security keys
												</div>
												<div>3. Follow the browser prompts to complete setup</div>
											</div>
											<button
												type="button"
												onClick={handleShowFIDO2Registration}
												style={{
													padding: '0.75rem 1rem',
													backgroundColor: '#10b981',
													color: 'white',
													border: 'none',
													borderRadius: '0.375rem',
													fontSize: '0.875rem',
													fontWeight: '600',
													cursor: 'pointer',
													display: 'flex',
													alignItems: 'center',
													gap: '0.5rem',
												}}
											>
												<FiShield size={16} />
												Setup Passkey/FIDO2
											</button>
										</div>
									</div>
								)}

								{selectedDeviceType === 'push' && (
									<div>
										<div
											style={{
												marginBottom: '1rem',
												padding: '1rem',
												background: '#fef3c7',
												borderRadius: '0.5rem',
												border: '1px solid #f59e0b',
											}}
										>
											<h5
												style={{
													margin: '0 0 0.5rem 0',
													fontSize: '0.875rem',
													fontWeight: 600,
													color: '#92400e',
												}}
											>
												🔔 Push Notification Setup
											</h5>
											<div style={{ fontSize: '0.75rem', color: '#92400e', lineHeight: 1.5 }}>
												<div>1. Install the PingOne mobile app on your device</div>
												<div>2. Sign in to the app with your credentials</div>
												<div>3. Enable push notifications for MFA</div>
											</div>
										</div>
									</div>
								)}
							</div>
						)}

						{/* Registration Button */}
						{selectedDeviceType && (
							<div
								style={{
									marginTop: '1.5rem',
									display: 'flex',
									gap: '0.75rem',
									justifyContent: 'flex-end',
								}}
							>
								<Button
									type="button"
									onClick={handleDeviceRegistration}
									disabled={isLoading || !isDeviceInfoValid()}
									style={{
										background: isDeviceInfoValid() ? '#10b981' : '#9ca3af',
										color: 'white',
										border: 'none',
										borderRadius: '0.375rem',
										padding: '0.75rem 1.5rem',
										fontSize: '0.875rem',
										fontWeight: '600',
										cursor: isDeviceInfoValid() && !isLoading ? 'pointer' : 'not-allowed',
										display: 'flex',
										alignItems: 'center',
										gap: '0.5rem',
									}}
								>
									{isLoading ? (
										<>
											<FiRefreshCw className="animate-spin" size={16} />
											Registering Device...
										</>
									) : (
										<>
											<FiCheckCircle size={16} />
											Register Device
										</>
									)}
								</Button>
							</div>
						)}

						{/* Continue Button (when device is registered) */}
						{flowContext.userDevices.length > 0 && (
							<div
								style={{
									marginTop: '1.5rem',
									display: 'flex',
									gap: '0.75rem',
									justifyContent: 'space-between',
								}}
							>
								<NavigationButton
									onClick={() => {
										setCurrentStep('mfa_enrollment');
										onStepChange?.('mfa_enrollment');
									}}
									style={{ background: '#6b7280', color: 'white' }}
								>
									<FiArrowLeft />
									Back to MFA Enrollment
								</NavigationButton>
								<NavigationButton
									onClick={() => {
										setCurrentStep('mfa_challenge');
										onStepChange?.('mfa_challenge');
									}}
								>
									<FiArrowRight />
									Continue to MFA Challenge
								</NavigationButton>
							</div>
						)}
					</CollapsibleHeaderService.CollapsibleHeader>
				);

			case 'mfa_challenge':
				return (
					<CollapsibleHeaderService.CollapsibleHeader
						title="MFA Challenge"
						subtitle="Complete multi-factor authentication"
						icon={<FiShield />}
						theme="blue"
						defaultCollapsed={false}
					>
						<InfoBox $variant="info">
							<FiInfo size={20} style={{ flexShrink: 0 }} />
							<InfoContent>
								<InfoTitle>🔐 Multi-Factor Authentication Challenge</InfoTitle>
								<InfoText>
									Select your registered MFA device and complete the authentication challenge.
								</InfoText>
							</InfoContent>
						</InfoBox>

						{/* Device Selection */}
						{!mfaChallenge.isChallengeSent && (
							<div style={{ marginTop: '1.5rem' }}>
								<h4
									style={{
										margin: '0 0 1rem 0',
										fontSize: '1rem',
										fontWeight: '600',
										color: '#374151',
									}}
								>
									Select MFA Device
								</h4>
								<div style={{ display: 'grid', gap: '0.75rem' }}>
									{flowContext.userDevices.length > 0 ? (
										flowContext.userDevices.map((device) => (
											<button
												key={device.id}
												type="button"
												onClick={() => initiateMfaChallenge(device)}
												style={{
													padding: '1rem',
													border: '1px solid #d1d5db',
													borderRadius: '0.5rem',
													cursor: 'pointer',
													transition: 'all 0.2s ease',
													backgroundColor: '#ffffff',
													display: 'flex',
													alignItems: 'center',
													gap: '0.75rem',
												}}
												onMouseEnter={(e) => {
													e.currentTarget.style.borderColor = '#3b82f6';
													e.currentTarget.style.backgroundColor = '#f8fafc';
												}}
												onMouseLeave={(e) => {
													e.currentTarget.style.borderColor = '#d1d5db';
													e.currentTarget.style.backgroundColor = '#ffffff';
												}}
											>
												<div style={{ fontSize: '1.5rem' }}>
													{device.type === 'SMS' && '📱'}
													{device.type === 'EMAIL' && '📧'}
													{device.type === 'TOTP' && '🔐'}
													{device.type === 'VOICE' && '📞'}
													{device.type === 'FIDO2' && '🔑'}
													{device.type === 'MOBILE' && '📱'}
												</div>
												<div style={{ flex: 1 }}>
													<div style={{ fontWeight: '500', color: '#374151' }}>
														{device.deviceName || `${device.type} Device`}
													</div>
													<div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
														{device.type} • {device.status}
													</div>
												</div>
												<div style={{ color: '#3b82f6', fontSize: '0.875rem', fontWeight: '500' }}>
													Send Challenge
												</div>
											</button>
										))
									) : (
										<div
											style={{
												padding: '1rem',
												textAlign: 'center',
												color: '#6b7280',
												background: '#f9fafb',
												borderRadius: '0.5rem',
												border: '1px solid #e5e7eb',
											}}
										>
											<FiSmartphone size={24} style={{ marginBottom: '0.5rem' }} />
											<p>No MFA devices registered. Please register a device first.</p>
										</div>
									)}
								</div>
							</div>
						)}

						{/* Challenge Code Input */}
						{mfaChallenge.isChallengeSent && mfaChallenge.challengeStatus === 'pending' && (
							<div style={{ marginTop: '1.5rem' }}>
								<h4
									style={{
										margin: '0 0 1rem 0',
										fontSize: '1rem',
										fontWeight: '600',
										color: '#374151',
									}}
								>
									Enter Challenge Code
								</h4>
								<div
									style={{
										padding: '1rem',
										background: '#f0f9ff',
										borderRadius: '0.5rem',
										border: '1px solid #bae6fd',
										marginBottom: '1rem',
									}}
								>
									<div
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: '0.5rem',
											marginBottom: '0.5rem',
										}}
									>
										<FiShield size={16} color="#0ea5e9" />
										<span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#0c4a6e' }}>
											Challenge sent to{' '}
											{mfaChallenge.selectedDevice?.deviceName || mfaChallenge.selectedDevice?.type}{' '}
											device
										</span>
									</div>
									<p style={{ fontSize: '0.75rem', color: '#0369a1', margin: 0 }}>
										Please check your {mfaChallenge.challengeType} and enter the verification code
										below.
									</p>
								</div>

								<div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
									<div style={{ flex: 1 }}>
										<label
											htmlFor="mfa-challenge-code"
											style={{
												display: 'block',
												marginBottom: '0.5rem',
												fontSize: '0.875rem',
												fontWeight: '500',
												color: '#374151',
											}}
										>
											Verification Code
										</label>
										<input
											id="mfa-challenge-code"
											type="text"
											value={mfaChallenge.challengeCode || ''}
											onChange={(e) =>
												setMfaChallenge((prev) => ({ ...prev, challengeCode: e.target.value }))
											}
											placeholder="Enter 6-digit code"
											style={{
												width: '100%',
												padding: '0.75rem',
												border: '1px solid #d1d5db',
												borderRadius: '0.375rem',
												fontSize: '1rem',
												textAlign: 'center',
												letterSpacing: '0.1em',
												fontFamily: 'monospace',
											}}
										/>
									</div>
									<button
										type="button"
										onClick={() =>
											mfaChallenge.challengeCode && verifyMfaChallenge(mfaChallenge.challengeCode)
										}
										disabled={!mfaChallenge.challengeCode || isLoading}
										style={{
											padding: '0.75rem 1.5rem',
											backgroundColor:
												mfaChallenge.challengeCode && !isLoading ? '#10b981' : '#9ca3af',
											color: 'white',
											border: 'none',
											borderRadius: '0.375rem',
											fontSize: '0.875rem',
											fontWeight: '500',
											cursor: mfaChallenge.challengeCode && !isLoading ? 'pointer' : 'not-allowed',
											transition: 'background-color 0.2s ease',
										}}
									>
										{isLoading ? 'Verifying...' : 'Verify Code'}
									</button>
								</div>
							</div>
						)}

						{/* Challenge Status */}
						{mfaChallenge.challengeStatus === 'completed' && (
							<div
								style={{
									marginTop: '1.5rem',
									padding: '1rem',
									background: '#f0fdf4',
									borderRadius: '0.5rem',
									border: '1px solid #bbf7d0',
									display: 'flex',
									alignItems: 'center',
									gap: '0.75rem',
								}}
							>
								<FiCheckCircle size={20} color="#16a34a" />
								<div>
									<div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#166534' }}>
										MFA Challenge Completed Successfully!
									</div>
									<div style={{ fontSize: '0.75rem', color: '#15803d' }}>
										You can now proceed to token retrieval.
									</div>
								</div>
							</div>
						)}

						{/* API Call Displays */}
						{apiCalls.mfaChallengeInitiate && (
							<div style={{ marginTop: '1.5rem' }}>
								<EnhancedApiCallDisplay
									apiCall={apiCalls.mfaChallengeInitiate}
									options={{
										showEducationalNotes: true,
										showFlowContext: true,
										urlHighlightRules:
											EnhancedApiCallDisplayService.getDefaultHighlightRules('mfa'),
									}}
								/>
							</div>
						)}

						{apiCalls.mfaChallengeVerify && (
							<div style={{ marginTop: '1.5rem' }}>
								<EnhancedApiCallDisplay
									apiCall={apiCalls.mfaChallengeVerify}
									options={{
										showEducationalNotes: true,
										showFlowContext: true,
										urlHighlightRules:
											EnhancedApiCallDisplayService.getDefaultHighlightRules('mfa'),
									}}
								/>
							</div>
						)}

						<div
							style={{
								marginTop: '1.5rem',
								display: 'flex',
								gap: '0.75rem',
								justifyContent: 'space-between',
							}}
						>
							<NavigationButton
								onClick={() => {
									setCurrentStep('device_pairing');
									onStepChange?.('device_pairing');
								}}
								style={{ background: '#6b7280', color: 'white' }}
							>
								<FiArrowLeft />
								Back to Device Registration
							</NavigationButton>
							{mfaChallenge.challengeStatus === 'completed' && (
								<NavigationButton
									onClick={() => {
										setCurrentStep('token_retrieval');
										onStepChange?.('token_retrieval');
									}}
								>
									<FiArrowRight />
									Continue to Token Retrieval
								</NavigationButton>
							)}
						</div>
					</CollapsibleHeaderService.CollapsibleHeader>
				);

			case 'token_retrieval':
				return (
					<CollapsibleHeaderService.CollapsibleHeader
						title="Token Retrieval"
						subtitle="Retrieve access tokens and complete session"
						icon={<FiPackage />}
						theme="highlight"
						defaultCollapsed={false}
					>
						{flowContext.tokens ? (
							<InfoBox $variant="success">
								<FiCheckCircle size={20} style={{ flexShrink: 0 }} />
								<InfoContent>
									<InfoTitle>🎫 Tokens Retrieved Successfully</InfoTitle>
									<InfoText>
										Your access tokens have been retrieved and your secure session is now active
										with MFA protection.
									</InfoText>
								</InfoContent>
							</InfoBox>
						) : (
							<InfoBox $variant="info">
								<FiPackage size={20} style={{ flexShrink: 0 }} />
								<InfoContent>
									<InfoTitle>🔄 Ready for Token Exchange</InfoTitle>
									<InfoText>
										Authorization code received. Click the button below to exchange it for access
										tokens.
									</InfoText>
								</InfoContent>
							</InfoBox>
						)}

						<div
							style={{
								marginTop: '1.5rem',
								display: 'flex',
								gap: '0.75rem',
								justifyContent: 'space-between',
							}}
						>
							<NavigationButton
								onClick={() => {
									setCurrentStep('mfa_challenge');
									onStepChange?.('mfa_challenge');
								}}
								style={{ background: '#6b7280', color: 'white' }}
							>
								<FiArrowLeft />
								Back to MFA Challenge
							</NavigationButton>
							{!flowContext.tokens ? (
								<NavigationButton
									onClick={exchangeToken}
									disabled={isLoading || !flowContext.authCode}
									style={{ backgroundColor: '#10b981' }}
								>
									<FiRefreshCw className={isLoading ? 'animate-spin' : ''} />
									{isLoading ? 'Exchanging Tokens...' : 'Exchange Authorization Code for Tokens'}
								</NavigationButton>
							) : (
								<NavigationButton
									onClick={() => {
										setCurrentStep('success');
										onStepChange?.('success');
									}}
									style={{ backgroundColor: '#10b981' }}
								>
									<FiArrowRight />
									Complete Flow
								</NavigationButton>
							)}
						</div>
					</CollapsibleHeaderService.CollapsibleHeader>
				);

			case 'success':
				return (
					<CollapsibleHeaderService.CollapsibleHeader
						title="Authentication Complete"
						subtitle="MFA authentication successful"
						icon={<FiCheckCircle />}
						theme="green"
						defaultCollapsed={false}
					>
						<InfoBox $variant="success">
							<FiCheckCircle size={20} style={{ flexShrink: 0 }} />
							<InfoContent>
								<InfoTitle>🎉 MFA Authentication Complete!</InfoTitle>
								<InfoText>
									You have successfully completed multi-factor authentication. Your session is now
									secured with MFA verification. You can now access protected resources and
									applications.
								</InfoText>
							</InfoContent>
						</InfoBox>

						<div style={{ marginTop: '2rem', textAlign: 'center' }}>
							<p style={{ color: '#6b7280', marginBottom: '1rem' }}>
								Your secure session is now active with MFA protection.
							</p>
						</div>
					</CollapsibleHeaderService.CollapsibleHeader>
				);

			case 'error':
				return (
					<div style={{ maxWidth: '500px', width: '100%' }}>
						<InfoBox $variant="error">
							<FiAlertCircle size={20} style={{ flexShrink: 0 }} />
							<InfoContent>
								<InfoTitle>❌ Authentication Error</InfoTitle>
								<InfoText>
									{error || 'An unexpected error occurred during authentication.'}
								</InfoText>
							</InfoContent>
						</InfoBox>

						<div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
							{retryCount < maxRetries && (
								<Button $variant="primary" onClick={handleRetry}>
									<FiRefreshCw size={16} />
									Try Again ({maxRetries - retryCount} attempts left)
								</Button>
							)}
							<Button type="button" onClick={handleRetry}>
								Start Over
							</Button>
						</div>
					</div>
				);

			default:
				return null;
		}
	};

	return (
		<Container>
			{/* Network Status Bar */}

			<ContentWrapper>
				<FlowHeader flowId="pingone-complete-mfa-v7" />

				<ComprehensiveCredentialsService
					flowType="pingone-complete-mfa-v7"
					isOIDC={true}
					workerToken={localStorage.getItem('worker_token') || ''}
					credentials={{
						environmentId: authCodeCredentials.environmentId,
						clientId: authCodeCredentials.clientId,
						clientSecret: authCodeCredentials.clientSecret,
						redirectUri: authCodeCredentials.redirectUri || 'https://localhost:3000/oauth-callback',
						scopes: 'openid profile email',
					}}
					onCredentialsChange={(credentials) => {
						console.log('[CompleteMFA-V7] Credentials changed:', credentials);
						setAuthCodeCredentials((prev) => ({
							...prev,
							environmentId: credentials.environmentId || prev.environmentId,
							clientId: credentials.clientId || prev.clientId,
							clientSecret: credentials.clientSecret || prev.clientSecret,
							redirectUri:
								credentials.redirectUri ||
								prev.redirectUri ||
								'https://localhost:3000/oauth-callback',
						}));
					}}
					onClientAuthMethodChange={(method) => {
						console.log('[CompleteMFA-V7] Client Auth Method changed:', method);
						setAuthCodeCredentials((prev) => ({
							...prev,
							tokenEndpointAuthMethod: method,
						}));
					}}
					clientAuthMethod={authCodeCredentials.tokenEndpointAuthMethod || 'client_secret_post'}
					onDiscoveryComplete={(result) => {
						console.log('🔍 [CompleteMFA-V7] OIDC Discovery completed:', result);
						if (result.success && result.document) {
							const extractedEnvId = oidcDiscoveryService.extractEnvironmentId(
								result.document.issuer
							);
							if (extractedEnvId) {
								console.log('✅ [CompleteMFA-V7] Extracted environment ID:', extractedEnvId);
								setAuthCodeCredentials((prev) => ({
									...prev,
									environmentId: extractedEnvId,
								}));
							}
						}
					}}
					requireClientSecret={true}
					showRedirectUri={true}
					// Config Checker - Disabled to remove pre-flight API calls
					showConfigChecker={false}
					defaultCollapsed={false}
					title="PingOne Complete MFA Flow Configuration"
					subtitle="Configure your PingOne environment and client credentials for MFA authentication"
				/>

				<EnhancedFlowInfoCard
					flowType="mfa"
					showAdditionalInfo={true}
					showDocumentation={true}
					showCommonIssues={false}
					showImplementationNotes={true}
				/>

				<MainCard>
					<StepHeader>
						<StepHeaderLeft>
							<StepHeaderTitle>
								{stepMetadata[currentStepNumber - 1]?.title || 'MFA Authentication'}
							</StepHeaderTitle>
							<StepHeaderSubtitle>
								{stepMetadata[currentStepNumber - 1]?.subtitle ||
									'Complete multi-factor authentication'}
							</StepHeaderSubtitle>
						</StepHeaderLeft>
						<StepHeaderRight>
							<StepNumber>{String(currentStepNumber).padStart(2, '0')}</StepNumber>
							<StepTotal>of {stepMetadata.length}</StepTotal>
						</StepHeaderRight>
					</StepHeader>

					<StepContentWrapper>{renderCurrentStep()}</StepContentWrapper>
				</MainCard>

				<StepNavigationButtons
					currentStep={currentStepNumber - 1}
					totalSteps={stepMetadata.length}
					onPrevious={() => {
						const prevStep = Math.max(currentStepNumber - 2, 0);
						const stepId = stepMetadata[prevStep]?.id;
						if (stepId) {
							setCurrentStep(stepId as FlowStep);
							onStepChange?.(stepId as FlowStep);
						}
					}}
					onNext={() => {
						// Execute the same logic as the buttons in each step
						switch (currentStep) {
							case 'username_login':
								// Execute the same logic as the "Continue to MFA Enrollment" button
								setCurrentStep('mfa_enrollment');
								onStepChange?.('mfa_enrollment');
								break;
							case 'mfa_enrollment':
								// Execute the same logic as the "Continue to Device Registration" button
								setCurrentStep('device_pairing');
								onStepChange?.('device_pairing');
								break;
							case 'device_pairing':
								// Execute the same logic as the "Continue to MFA Challenge" button
								setCurrentStep('mfa_challenge');
								onStepChange?.('mfa_challenge');
								break;
							case 'mfa_challenge':
								// Execute the same logic as the "Continue to Token Retrieval" button
								setCurrentStep('token_retrieval');
								onStepChange?.('token_retrieval');
								break;
							case 'token_retrieval':
								// Execute the same logic as the "Complete Flow" button
								setCurrentStep('success');
								onStepChange?.('success');
								break;
							default: {
								// Default navigation
								const nextStep = Math.min(currentStepNumber, stepMetadata.length - 1);
								const stepId = stepMetadata[nextStep]?.id;
								if (stepId) {
									setCurrentStep(stepId as FlowStep);
									onStepChange?.(stepId as FlowStep);
								}
								break;
							}
						}
					}}
					onReset={handleResetFlow}
					canNavigateNext={true}
					isFirstStep={currentStepNumber === 1}
					nextButtonText="Next"
					disabledMessage=""
				/>
			</ContentWrapper>

			{/* Authentication Modal - Before redirect */}
			{AuthenticationModalService.showModal(
				showRedirectModal,
				() => setShowRedirectModal(false),
				handleConfirmRedirect,
				authUrl,
				'oauth',
				'PingOne MFA Authentication',
				{
					description:
						"You're about to be redirected to PingOne for authentication. This will open in a new window for secure authentication before proceeding to MFA setup.",
					redirectMode: 'popup',
				}
			)}

			{/* Success Modal - After authentication */}
			<LoginSuccessModal
				isOpen={showSuccessModal}
				onClose={handleSuccessModalClose}
				title="🎉 Authentication Successful!"
				message="You have been successfully authenticated with PingOne. You can now proceed to set up your multi-factor authentication devices."
				autoCloseDelay={5000}
			/>

			{/* Device Registration Modal - After device registration */}
			{registeredDeviceData && (
				<DeviceRegistrationModal
					isOpen={showDeviceRegistrationModal}
					onClose={handleCloseDeviceRegistrationModal}
					deviceData={registeredDeviceData}
					onContinue={handleContinueFromDeviceRegistration}
				/>
			)}

			{/* TOTP QR Code Modal */}
			{showTOTPQRCodeModal && (
				<TOTPQRCodeModal
					isOpen={showTOTPQRCodeModal}
					onClose={handleCloseTOTPQRCode}
					onContinue={handleContinueFromTOTPQRCode}
					userId={flowContext.userId || 'unknown'}
					deviceName={deviceInfo.deviceName || 'TOTP Device'}
					issuer="OAuth Playground"
				/>
			)}

			{/* FIDO2 Registration Modal */}
			{showFIDO2RegistrationModal && (
				<FIDO2RegistrationModal
					isOpen={showFIDO2RegistrationModal}
					onClose={handleCloseFIDO2Registration}
					onSuccess={handleFIDO2RegistrationSuccess}
					userId={flowContext.userId || 'unknown'}
					deviceName={deviceInfo.deviceName || 'FIDO2 Device'}
					rpId={window.location.hostname}
					rpName="OAuth Playground"
				/>
			)}
		</Container>
	);
};

export default CompleteMFAFlowV7;
