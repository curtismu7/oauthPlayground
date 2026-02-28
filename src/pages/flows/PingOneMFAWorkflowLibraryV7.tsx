// src/pages/flows/PingOneMFAWorkflowLibraryV7.tsx
// PingOne MFA Flow following Workflow Library Steps 11-20
// Based on: https://apidocs.pingidentity.com/pingone/workflow-library/v1/api/#put-step-11-enable-user-mfa

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
	FiCheckCircle,
	FiInfo,
	FiKey,
	FiPackage,
	FiRefreshCw,
	FiSend,
	FiSettings,
	FiShield,
	FiSmartphone,
	FiUser,
} from '@icons';
import JSONHighlighter, { type JSONData } from '../../components/JSONHighlighter';
import PhoneNumberInput from '../../components/PhoneNumberInput';
import { StepNavigationButtons } from '../../components/StepNavigationButtons';
import type { StepCredentials } from '../../components/steps/CommonSteps';
import { WorkerTokenModal } from '../../components/WorkerTokenModal';
import { usePageScroll } from '../../hooks/usePageScroll';
import { CollapsibleHeader } from '../../services/collapsibleHeaderService';
import ComprehensiveCredentialsService from '../../services/comprehensiveCredentialsService';
import { comprehensiveFlowDataService } from '../../services/comprehensiveFlowDataService';
import { FlowHeader } from '../../services/flowHeaderService';
import { FlowUIService } from '../../services/flowUIService';
import { getValidWorkerToken } from '../../services/tokenExpirationService';
import { workerTokenCredentialsService } from '../../services/workerTokenCredentialsService';
import { v4ToastManager } from '../../utils/v4ToastMessages';

interface MfaDevice {
	id: string;
	type: string;
	status?: string;
	enabled?: boolean;
	phone?: string;
	phoneNumber?: string;
	name?: string;
}

type ApiResponse = JSONData;

// Get UI components from FlowUIService
const {
	Container,
	ContentWrapper,
	MainCard,
	StepHeader,
	StepHeaderLeft,
	StepHeaderTitle,
	StepHeaderSubtitle,
	StepHeaderRight,
	StepNumber,
	StepTotal,
	StepContentWrapper,
	InfoBox,
	InfoTitle,
	InfoText,
	Button,
	ParameterGrid,
	ParameterLabel,
	ParameterValue,
	ResultsSection,
	ResultsHeading,
} = FlowUIService.getFlowUIComponents();

// Step metadata for Workflow Library steps 11-20
const STEP_METADATA = [
	{ title: 'Step 11: Register Mobile Phone', subtitle: 'Register mobile phone for SMS-based MFA' },
	{ title: 'Step 11: Enable User MFA', subtitle: 'Enable MFA device for user' },
	{ title: 'Step 12: Send Authorize Request', subtitle: 'Initiate authorization code flow' },
	{ title: 'Step 13: Get the Flow', subtitle: 'Retrieve flow details from PingOne' },
	{ title: 'Step 14: Submit Login Credentials', subtitle: 'Authenticate with username/password' },
	{ title: 'Step 15: Submit MFA Credentials', subtitle: 'Complete MFA challenge' },
	{ title: 'Step 16: Call Resume Endpoint', subtitle: 'Resume flow to get authorization code' },
	{ title: 'Step 17: Generate Access Token', subtitle: 'Exchange authorization code for tokens' },
	{ title: 'Step 18-20: Complete Flow', subtitle: 'Flow completion summary' },
];

const FLOW_KEY = 'pingone-mfa-workflow-library-v7';

const PingOneMFAWorkflowLibraryV7: React.FC = () => {
	usePageScroll();

	const [currentStep, setCurrentStep] = useState(0);
	const [credentials, setCredentials] = useState<StepCredentials>({
		environmentId: '',
		clientId: '',
		clientSecret: '',
		redirectUri: 'https://localhost:3000/callback',
		scopes: 'openid profile email',
	});

	// Handle credentials change with auto-save
	const handleCredentialsChange = useCallback((newCredentials: StepCredentials) => {
		console.log('🔄 [PingOneMFAWorkflowLibraryV7] Credentials changed, saving...');
		setCredentials(newCredentials);

		// Save credentials using isolated storage (add lastUpdated and convert scopes to array)
		const credentialsToSave = {
			...newCredentials,
			scopes:
				typeof newCredentials.scopes === 'string'
					? newCredentials.scopes.split(/\s+/).filter(Boolean)
					: Array.isArray(newCredentials.scopes)
						? newCredentials.scopes
						: ['openid', 'profile', 'email'],
			lastUpdated: Date.now(),
		};
		comprehensiveFlowDataService.saveFlowCredentialsIsolated(FLOW_KEY, credentialsToSave, {
			showToast: false,
		});
	}, []);

	// Handle OIDC discovery completion - ensure environment ID is saved
	const handleDiscoveryComplete = useCallback(
		(result: { issuerUrl?: string; document?: unknown }) => {
			console.log('[PingOneMFAWorkflowLibraryV7] OIDC Discovery completed:', result);

			// The comprehensiveCredentialsService should handle saving, but we'll also update our state
			if (result.issuerUrl) {
				const envIdMatch = result.issuerUrl.match(
					/\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i
				);
				if (envIdMatch?.[1]) {
					const extractedEnvId = envIdMatch[1];
					console.log(
						'[PingOneMFAWorkflowLibraryV7] Extracted Environment ID from discovery:',
						extractedEnvId
					);

					// Update credentials with environment ID
					setCredentials((prev) => {
						const updated = { ...prev, environmentId: extractedEnvId };

						// Save immediately (add lastUpdated and convert scopes to array)
						const credentialsToSave = {
							...updated,
							scopes:
								typeof updated.scopes === 'string'
									? updated.scopes.split(/\s+/).filter(Boolean)
									: Array.isArray(updated.scopes)
										? updated.scopes
										: ['openid', 'profile', 'email'],
							lastUpdated: Date.now(),
						};
						comprehensiveFlowDataService.saveFlowCredentialsIsolated(FLOW_KEY, credentialsToSave, {
							showToast: false,
						});

						return updated;
					});
				}
			}
		},
		[]
	);

	// Load saved credentials on mount
	useEffect(() => {
		const loadCredentials = () => {
			console.log(
				'🔄 [PingOneMFAWorkflowLibraryV7] Loading credentials with comprehensive service...'
			);

			const flowData = comprehensiveFlowDataService.loadFlowDataComprehensive({
				flowKey: FLOW_KEY,
				useSharedEnvironment: true,
				useSharedDiscovery: true,
			});

			if (flowData.flowCredentials && Object.keys(flowData.flowCredentials).length > 0) {
				console.log('✅ [PingOneMFAWorkflowLibraryV7] Found flow-specific credentials');
				const loadedCreds = {
					environmentId:
						flowData.sharedEnvironment?.environmentId ||
						flowData.flowCredentials.environmentId ||
						'',
					clientId: flowData.flowCredentials.clientId || '',
					clientSecret: flowData.flowCredentials.clientSecret || '',
					redirectUri: flowData.flowCredentials.redirectUri || 'https://localhost:3000/callback',
					scopes: Array.isArray(flowData.flowCredentials.scopes)
						? flowData.flowCredentials.scopes.join(' ')
						: flowData.flowCredentials.scopes || 'openid profile email',
				};
				setCredentials(loadedCreds);
			} else if (flowData.sharedEnvironment?.environmentId) {
				console.log('ℹ️ [PingOneMFAWorkflowLibraryV7] Using shared environment data only');
				setCredentials((prev) => ({
					...prev,
					environmentId: flowData.sharedEnvironment?.environmentId || '',
				}));
			} else {
				console.log('ℹ️ [PingOneMFAWorkflowLibraryV7] No saved credentials found, using defaults');
			}
		};

		loadCredentials();
	}, []);

	// Flow state
	const [userId, setUserId] = useState('');
	const [username, setUsername] = useState('curtis7');
	const [password, setPassword] = useState('');
	const [phoneNumber, setPhoneNumber] = useState('');
	const [deviceId, setDeviceId] = useState('');
	const [mfaCode, setMfaCode] = useState('');
	const [flowId, setFlowId] = useState('');
	const [authorizationCode, setAuthorizationCode] = useState('');
	const [tokens, setTokens] = useState<ApiResponse | null>(null);
	const [apiResponses, setApiResponses] = useState<Record<number, ApiResponse>>({});
	const [isLoading, setIsLoading] = useState(false);
	const [workerToken, setWorkerToken] = useState('');
	const [existingDevices, setExistingDevices] = useState<MfaDevice[]>([]);
	const [isLoadingDevices, setIsLoadingDevices] = useState(false);
	const [deviceSelectionMode, setDeviceSelectionMode] = useState<'select' | 'register'>('select');
	const [selectedExistingDeviceId, setSelectedExistingDeviceId] = useState('');
	const [showWorkerTokenModal, setShowWorkerTokenModal] = useState(false);

	// Load worker token from localStorage on mount and listen for updates
	useEffect(() => {
		const loadWorkerToken = () => {
			const tokenResult = getValidWorkerToken('worker_token', 'worker_token_expires_at', {
				clearExpired: true,
				showToast: false,
			});

			if (tokenResult.isValid && tokenResult.token) {
				setWorkerToken(tokenResult.token);
				console.log('[PingOneMFAWorkflowLibraryV7] ✅ Worker token loaded from storage');
			} else {
				setWorkerToken('');
				console.log('[PingOneMFAWorkflowLibraryV7] ℹ️ No valid worker token found');
			}
		};

		loadWorkerToken();

		// Listen for worker token updates
		const handleTokenUpdate = () => {
			loadWorkerToken();
		};

		window.addEventListener('workerTokenUpdated', handleTokenUpdate);

		return () => {
			window.removeEventListener('workerTokenUpdated', handleTokenUpdate);
		};
	}, []);

	// Fetch existing devices for user
	const handleFetchExistingDevices = useCallback(async () => {
		if (!credentials.environmentId || !userId || !workerToken) {
			v4ToastManager.showError('Please provide Environment ID, User ID, and Worker Token');
			return;
		}

		setIsLoadingDevices(true);
		try {
			const response = await fetch(
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
				// Filter for SMS devices only
				const smsDevices = data.devices.filter(
					(d: MfaDevice) => d.type === 'SMS' || d.type === 'MOBILE'
				);
				setExistingDevices(smsDevices);
				if (smsDevices.length > 0) {
					v4ToastManager.showSuccess(`Found ${smsDevices.length} SMS device(s)`);
				} else {
					v4ToastManager.showInfo('No SMS devices found. You can register a new one.');
				}
			} else {
				console.warn('[Workflow Library] Failed to fetch devices, continuing with empty list');
				setExistingDevices([]);
			}
		} catch (error) {
			console.error('[Workflow Library] Failed to fetch devices:', error);
			setExistingDevices([]);
			// Don't show error - user can still register new device
		} finally {
			setIsLoadingDevices(false);
		}
	}, [credentials.environmentId, userId, workerToken]);

	// Auto-fetch devices when user ID and worker token are available
	useEffect(() => {
		if (userId && workerToken && credentials.environmentId && currentStep === 0) {
			handleFetchExistingDevices();
		}
	}, [userId, workerToken, credentials.environmentId, currentStep, handleFetchExistingDevices]);

	// Handle selecting an existing device
	const handleSelectExistingDevice = useCallback(
		(selectedDeviceId: string) => {
			setSelectedExistingDeviceId(selectedDeviceId);
			const device = existingDevices.find((d) => d.id === selectedDeviceId);
			if (device) {
				setDeviceId(device.id);
				setApiResponses((prev) => ({ ...prev, 11: device as unknown as ApiResponse }));
				v4ToastManager.showSuccess('Device selected successfully');
				setCurrentStep(1); // Move to enable step
			}
		},
		[existingDevices]
	);

	// Step 11a: Register Mobile Phone Device
	const handleRegisterMobilePhone = useCallback(async () => {
		if (!credentials.environmentId || !userId || !phoneNumber) {
			v4ToastManager.showError('Please provide Environment ID, User ID, and Phone Number');
			return;
		}

		if (!workerToken) {
			v4ToastManager.showError('Worker token is required for device registration');
			return;
		}

		setIsLoading(true);
		try {
			// POST /api/v1/environments/{environmentId}/users/{userId}/devices
			const response = await fetch(
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
				setApiResponses((prev) => ({ ...prev, 11: data }));
				v4ToastManager.showSuccess('Mobile phone registered successfully');
				setCurrentStep(1); // Move to enable step
			} else {
				throw new Error(data.error_description || data.error || 'Failed to register mobile phone');
			}
		} catch (error) {
			console.error('[Workflow Library] Step 11a failed:', error);
			v4ToastManager.showError(
				error instanceof Error ? error.message : 'Failed to register mobile phone'
			);
		} finally {
			setIsLoading(false);
		}
	}, [credentials.environmentId, userId, phoneNumber, workerToken]);

	// Step 11b: Enable User MFA
	const handleEnableUserMFA = useCallback(async () => {
		if (!credentials.environmentId || !userId || !deviceId) {
			v4ToastManager.showError('Please provide Environment ID, User ID, and Device ID');
			return;
		}

		if (!workerToken) {
			v4ToastManager.showError('Worker token is required to enable MFA device');
			return;
		}

		setIsLoading(true);
		try {
			// PUT /api/v1/environments/{environmentId}/users/{userId}/devices/{deviceId}
			const response = await fetch(
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

			const data = (await response.json()) as ApiResponse;
			if (response.ok) {
				setApiResponses((prev) => {
					const prevResponse = (prev[11] as Record<string, unknown>) || {};
					const dataObj = (data as Record<string, unknown>) || {};
					return { ...prev, 11: { ...prevResponse, enabled: true, ...dataObj } as ApiResponse };
				});
				v4ToastManager.showSuccess('MFA device enabled successfully');
				setCurrentStep(2); // Move to authorize request
			} else {
				const errorData = (data as Record<string, unknown>) || {};
				const errorMsg =
					(errorData.error_description as string) ||
					(errorData.error as string) ||
					'Failed to enable MFA device';
				throw new Error(errorMsg);
			}
		} catch (error) {
			console.error('[Workflow Library] Step 11b failed:', error);
			v4ToastManager.showError(
				error instanceof Error ? error.message : 'Failed to enable MFA device'
			);
		} finally {
			setIsLoading(false);
		}
	}, [credentials.environmentId, userId, deviceId, workerToken]);

	// Step 12: Send Authorize Request
	const handleSendAuthorizeRequest = useCallback(async () => {
		if (!credentials.environmentId || !credentials.clientId) {
			v4ToastManager.showError('Please configure credentials first');
			return;
		}

		setIsLoading(true);
		try {
			// POST /as/authorize with response_mode=pi.flow
			const response = await fetch(`/api/pingone/redirectless/authorize`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					environment_id: credentials.environmentId,
					client_id: credentials.clientId,
					client_secret: credentials.clientSecret,
					response_type: 'code',
					response_mode: 'pi.flow',
					redirect_uri: credentials.redirectUri || 'https://localhost:3000/callback',
					scope: credentials.scopes || 'openid profile email',
				}),
			});

			const data = await response.json();
			if (response.ok && data.flowId) {
				setFlowId(data.flowId);
				setApiResponses((prev) => ({ ...prev, 12: data }));
				v4ToastManager.showSuccess('Authorization request sent successfully');
				setCurrentStep(3);
			} else {
				throw new Error(data.error_description || data.error || 'Failed to send authorize request');
			}
		} catch (error) {
			console.error('[Workflow Library] Step 12 failed:', error);
			v4ToastManager.showError(
				error instanceof Error ? error.message : 'Failed to send authorize request'
			);
		} finally {
			setIsLoading(false);
		}
	}, [credentials]);

	// Step 13: Get the Flow
	const handleGetFlow = useCallback(async () => {
		if (!flowId || !credentials.environmentId) {
			v4ToastManager.showError('Flow ID is required');
			return;
		}

		setIsLoading(true);
		try {
			// GET /flows/{flowId}
			const response = await fetch(`/api/pingone/flows/${flowId}`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				},
			});

			const data = await response.json();
			if (response.ok) {
				setApiResponses((prev) => ({ ...prev, 13: data }));
				v4ToastManager.showSuccess('Flow retrieved successfully');
				setCurrentStep(4);
			} else {
				throw new Error(data.error_description || data.error || 'Failed to get flow');
			}
		} catch (error) {
			console.error('[Workflow Library] Step 13 failed:', error);
			v4ToastManager.showError(error instanceof Error ? error.message : 'Failed to get flow');
		} finally {
			setIsLoading(false);
		}
	}, [flowId, credentials.environmentId]);

	// Step 14: Submit Login Credentials
	const handleSubmitLoginCredentials = useCallback(async () => {
		if (!flowId || !credentials.environmentId) {
			v4ToastManager.showError('Flow ID is required');
			return;
		}

		setIsLoading(true);
		try {
			// POST /flows/{flowId} with username/password
			const response = await fetch(`/api/pingone/flows/check-username-password`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					flowUrl: `https://auth.pingone.com/${credentials.environmentId}/flows/${flowId}`,
					username: username || userId,
					password: password,
				}),
			});

			const data = await response.json();
			if (response.ok) {
				setApiResponses((prev) => ({ ...prev, 14: data }));
				v4ToastManager.showSuccess('Login credentials submitted successfully');
				setCurrentStep(5);
			} else {
				throw new Error(
					data.error_description || data.error || 'Failed to submit login credentials'
				);
			}
		} catch (error) {
			console.error('[Workflow Library] Step 14 failed:', error);
			v4ToastManager.showError(
				error instanceof Error ? error.message : 'Failed to submit login credentials'
			);
		} finally {
			setIsLoading(false);
		}
	}, [flowId, credentials.environmentId, username, userId, password]);

	// Step 15: Submit MFA Credentials
	const handleSubmitMFACredentials = useCallback(async () => {
		if (!flowId || !credentials.environmentId) {
			v4ToastManager.showError('Flow ID is required');
			return;
		}

		setIsLoading(true);
		try {
			// POST /flows/{flowId} with MFA code
			const response = await fetch(`/api/pingone/flows/${flowId}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					action: 'mfa.check',
					code: mfaCode,
				}),
			});

			const data = await response.json();
			if (response.ok) {
				setApiResponses((prev) => ({ ...prev, 15: data }));
				v4ToastManager.showSuccess('MFA credentials submitted successfully');
				setCurrentStep(6);
			} else {
				throw new Error(data.error_description || data.error || 'Failed to submit MFA credentials');
			}
		} catch (error) {
			console.error('[Workflow Library] Step 15 failed:', error);
			v4ToastManager.showError(
				error instanceof Error ? error.message : 'Failed to submit MFA credentials'
			);
		} finally {
			setIsLoading(false);
		}
	}, [flowId, credentials.environmentId, mfaCode]);

	// Step 16: Call Resume Endpoint
	const handleCallResumeEndpoint = useCallback(async () => {
		if (!flowId || !credentials.environmentId) {
			v4ToastManager.showError('Flow ID is required');
			return;
		}

		setIsLoading(true);
		try {
			// GET /as/resume?flowId={flowId}
			const response = await fetch(
				`/api/pingone/resume?flowId=${flowId}&environment_id=${credentials.environmentId}`,
				{
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
					},
				}
			);

			const data = await response.json();
			if (response.ok && data.code) {
				setAuthorizationCode(data.code);
				setApiResponses((prev) => ({ ...prev, 16: data }));
				v4ToastManager.showSuccess('Authorization code received successfully');
				setCurrentStep(7);
			} else {
				throw new Error(data.error_description || data.error || 'Failed to get authorization code');
			}
		} catch (error) {
			console.error('[Workflow Library] Step 16 failed:', error);
			v4ToastManager.showError(
				error instanceof Error ? error.message : 'Failed to call resume endpoint'
			);
		} finally {
			setIsLoading(false);
		}
	}, [flowId, credentials.environmentId]);

	// Step 17: Generate Access Token
	const handleGenerateAccessToken = useCallback(async () => {
		if (!authorizationCode || !credentials.environmentId || !credentials.clientId) {
			v4ToastManager.showError('Authorization code and credentials are required');
			return;
		}

		setIsLoading(true);
		try {
			// POST /as/token
			const response = await fetch('/api/token-exchange', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					grant_type: 'authorization_code',
					code: authorizationCode,
					client_id: credentials.clientId,
					client_secret: credentials.clientSecret,
					redirect_uri: credentials.redirectUri || 'https://localhost:3000/callback',
					environment_id: credentials.environmentId,
				}),
			});

			const data = await response.json();
			if (response.ok && data.access_token) {
				setTokens(data);
				setApiResponses((prev) => ({ ...prev, 17: data }));
				v4ToastManager.showSuccess('Access token generated successfully');
				setCurrentStep(8);
			} else {
				throw new Error(data.error_description || data.error || 'Failed to generate access token');
			}
		} catch (error) {
			console.error('[Workflow Library] Step 17 failed:', error);
			v4ToastManager.showError(
				error instanceof Error ? error.message : 'Failed to generate access token'
			);
		} finally {
			setIsLoading(false);
		}
	}, [authorizationCode, credentials]);

	// Step validation
	const isStepValid = useCallback(
		(step: number): boolean => {
			switch (step) {
				case 0:
					return !!(
						credentials.environmentId &&
						credentials.clientId &&
						userId &&
						phoneNumber &&
						workerToken
					);
				case 1:
					return !!deviceId && !!apiResponses[11]; // Device registered
				case 2:
					return !!(apiResponses[11] as Record<string, unknown>)?.enabled; // MFA enabled
				case 3:
					return !!flowId; // Flow ID from authorize request
				case 4:
					return !!apiResponses[13]; // Flow retrieved
				case 5:
					return !!apiResponses[14]; // Login credentials submitted
				case 6:
					return !!apiResponses[15]; // MFA credentials submitted
				case 7:
					return !!authorizationCode; // Authorization code received
				case 8:
					return !!tokens; // Tokens received
				default:
					return true;
			}
		},
		[
			credentials,
			userId,
			phoneNumber,
			workerToken,
			deviceId,
			apiResponses,
			flowId,
			authorizationCode,
			tokens,
		]
	);

	// Render step content
	const renderStepContent = useMemo(() => {
		switch (currentStep) {
			case 0:
				return (
					<>
						<CollapsibleHeader
							title="Application Configuration & Credentials"
							icon={<FiSettings />}
							theme="orange"
							defaultCollapsed={false}
						>
							<ComprehensiveCredentialsService
								flowType={FLOW_KEY}
								credentials={credentials}
								onCredentialsChange={handleCredentialsChange}
								onDiscoveryComplete={handleDiscoveryComplete}
								onEnvironmentIdChange={(envId) => {
									setCredentials((prev) => {
										const updated = { ...prev, environmentId: envId };
										// Save immediately (add lastUpdated and convert scopes to array)
										const credentialsToSave = {
											...updated,
											scopes:
												typeof updated.scopes === 'string'
													? updated.scopes.split(/\s+/).filter(Boolean)
													: Array.isArray(updated.scopes)
														? updated.scopes
														: ['openid', 'profile', 'email'],
											lastUpdated: Date.now(),
										};
										comprehensiveFlowDataService.saveFlowCredentialsIsolated(
											FLOW_KEY,
											credentialsToSave,
											{ showToast: false }
										);
										return updated;
									});
								}}
								onSaveCredentials={() => {
									// Save credentials when save button is clicked
									try {
										const credentialsToSave = {
											...(credentials.environmentId && {
												environmentId: credentials.environmentId,
											}),
											clientId: credentials.clientId || '',
											clientSecret: credentials.clientSecret || '',
											redirectUri: credentials.redirectUri || 'https://localhost:3000/callback',
											scopes:
												typeof credentials.scopes === 'string'
													? credentials.scopes.split(/\s+/).filter(Boolean)
													: Array.isArray(credentials.scopes)
														? credentials.scopes
														: ['openid', 'profile', 'email'],
											lastUpdated: Date.now(),
										};
										const success = comprehensiveFlowDataService.saveFlowCredentialsIsolated(
											FLOW_KEY,
											credentialsToSave,
											{ showToast: true, backupToEnv: true }
										);
										if (success) {
											console.log(
												'[PingOneMFAWorkflowLibraryV7] ✅ Credentials saved successfully'
											);
										}
									} catch (error) {
										console.error(
											'[PingOneMFAWorkflowLibraryV7] ❌ Failed to save credentials:',
											error
										);
										v4ToastManager.showError('Failed to save credentials');
									}
								}}
								// Config Checker - Disabled to remove pre-flight API calls
								showConfigChecker={false}
							/>
						</CollapsibleHeader>

						<CollapsibleHeader
							title="Step 11: Register/Select Mobile Phone"
							icon={<FiSmartphone />}
							theme="blue"
							defaultCollapsed={false}
						>
							<InfoBox $variant="info">
								<FiInfo />
								<div>
									<InfoTitle>Register or Select Mobile Phone for MFA</InfoTitle>
									<InfoText>
										Select an existing SMS device or register a new mobile phone number for
										SMS-based MFA. API: GET/POST /api/v1/environments/{'{'}environmentId{'}'}/users/
										{'{'}userId{'}'}/devices
									</InfoText>
								</div>
							</InfoBox>

							<ParameterGrid>
								<ParameterLabel>User ID:</ParameterLabel>
								<ParameterValue>
									<input
										type="text"
										value={userId}
										onChange={(e) => setUserId(e.target.value)}
										placeholder="User ID"
										style={{ width: '100%', padding: '0.5rem' }}
									/>
								</ParameterValue>

								<ParameterLabel>Worker Token:</ParameterLabel>
								<ParameterValue>
									<Button
										onClick={() => setShowWorkerTokenModal(true)}
										style={{
											width: '100%',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											gap: '0.5rem',
											backgroundColor: workerToken ? '#16a34a' : '#dc2626',
											color: '#ffffff',
											border: `1px solid ${workerToken ? '#16a34a' : '#dc2626'}`,
										}}
									>
										{workerToken ? <FiCheckCircle /> : <FiKey />}
										{workerToken ? 'Refresh Worker Token' : 'Get Worker Token'}
									</Button>
								</ParameterValue>
							</ParameterGrid>

							{userId && workerToken && credentials.environmentId && (
								<>
									<div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
										<Button
											onClick={handleFetchExistingDevices}
											disabled={isLoadingDevices}
											style={{ marginRight: '0.5rem' }}
										>
											{isLoadingDevices ? <FiRefreshCw /> : <FiRefreshCw />}
											Refresh Devices
										</Button>
									</div>

									{existingDevices.length > 0 && (
										<div style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
											<InfoTitle style={{ marginBottom: '1rem' }}>Existing SMS Devices:</InfoTitle>
											<div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
												{existingDevices.map((device) => (
													<div
														key={device.id}
														onClick={() => handleSelectExistingDevice(device.id)}
														style={{
															padding: '1rem',
															border:
																selectedExistingDeviceId === device.id
																	? '2px solid #3b82f6'
																	: '1px solid #d1d5db',
															borderRadius: '0.5rem',
															cursor: 'pointer',
															background:
																selectedExistingDeviceId === device.id ? '#eff6ff' : '#ffffff',
															transition: 'all 0.2s ease',
														}}
														onMouseEnter={(e) => {
															if (selectedExistingDeviceId !== device.id) {
																e.currentTarget.style.borderColor = '#3b82f6';
																e.currentTarget.style.background = '#f8fafc';
															}
														}}
														onMouseLeave={(e) => {
															if (selectedExistingDeviceId !== device.id) {
																e.currentTarget.style.borderColor = '#d1d5db';
																e.currentTarget.style.background = '#ffffff';
															}
														}}
													>
														<div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
															<FiSmartphone style={{ fontSize: '1.25rem', color: '#3b82f6' }} />
															<div style={{ flex: 1 }}>
																<div style={{ fontWeight: '600', color: '#1e293b' }}>
																	{device.phone ||
																		device.phoneNumber ||
																		device.name ||
																		'SMS Device'}
																</div>
																<div
																	style={{
																		fontSize: '0.875rem',
																		color: '#64748b',
																		marginTop: '0.25rem',
																	}}
																>
																	{device.type} • {device.status || 'Unknown'} •{' '}
																	{device.enabled ? 'Enabled' : 'Disabled'}
																</div>
															</div>
															{selectedExistingDeviceId === device.id && (
																<FiCheckCircle style={{ color: '#10b981', fontSize: '1.25rem' }} />
															)}
														</div>
													</div>
												))}
											</div>
										</div>
									)}

									<div style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>
										<div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
											<Button
												onClick={() => setDeviceSelectionMode('select')}
												style={{
													background: deviceSelectionMode === 'select' ? '#3b82f6' : '#f3f4f6',
													color: deviceSelectionMode === 'select' ? 'white' : '#374151',
													border: '1px solid',
													borderColor: deviceSelectionMode === 'select' ? '#3b82f6' : '#d1d5db',
												}}
											>
												Select Existing
											</Button>
											<Button
												onClick={() => setDeviceSelectionMode('register')}
												style={{
													background: deviceSelectionMode === 'register' ? '#3b82f6' : '#f3f4f6',
													color: deviceSelectionMode === 'register' ? 'white' : '#374151',
													border: '1px solid',
													borderColor: deviceSelectionMode === 'register' ? '#3b82f6' : '#d1d5db',
												}}
											>
												Register New
											</Button>
										</div>
									</div>

									{deviceSelectionMode === 'select' && existingDevices.length > 0 && (
										<InfoBox $variant="info" style={{ marginTop: '1rem' }}>
											<FiInfo />
											<div>
												<InfoText>
													Click on a device above to select it, or switch to "Register New" to add a
													new phone number.
												</InfoText>
											</div>
										</InfoBox>
									)}

									{deviceSelectionMode === 'register' && (
										<>
											<ParameterGrid>
												<ParameterLabel>Mobile Phone:</ParameterLabel>
												<ParameterValue>
													<PhoneNumberInput
														value={phoneNumber}
														onChange={(fullNumber) => {
															setPhoneNumber(fullNumber);
														}}
														placeholder="Enter phone number"
														label="Phone Number"
														required
													/>
												</ParameterValue>
											</ParameterGrid>

											<Button
												onClick={handleRegisterMobilePhone}
												disabled={isLoading || !phoneNumber}
											>
												{isLoading ? <FiRefreshCw /> : <FiSmartphone />}
												Register Mobile Phone
											</Button>
										</>
									)}

									{deviceSelectionMode === 'select' && existingDevices.length === 0 && (
										<InfoBox $variant="warning" style={{ marginTop: '1rem' }}>
											<FiInfo />
											<div>
												<InfoTitle>No Existing Devices Found</InfoTitle>
												<InfoText>
													No SMS devices found for this user. Please register a new device.
												</InfoText>
											</div>
										</InfoBox>
									)}
								</>
							)}

							{apiResponses[11] && (
								<ResultsSection style={{ marginTop: '1.5rem' }}>
									<ResultsHeading>Step 11 Response:</ResultsHeading>
									<JSONHighlighter data={apiResponses[11]} />
									{deviceId && (
										<InfoBox $variant="success" style={{ marginTop: '1rem' }}>
											<FiCheckCircle />
											<div>
												<InfoTitle>Device Selected/Registered:</InfoTitle>
												<InfoText>Device ID: {deviceId}</InfoText>
											</div>
										</InfoBox>
									)}
								</ResultsSection>
							)}
						</CollapsibleHeader>
					</>
				);

			case 1:
				return (
					<CollapsibleHeader
						title="Step 11: Enable User MFA"
						icon={<FiShield />}
						theme="blue"
						defaultCollapsed={false}
					>
						<InfoBox $variant="info">
							<FiInfo />
							<div>
								<InfoTitle>Enable User MFA Device</InfoTitle>
								<InfoText>
									Enable the registered MFA device for the user. API: PUT /api/v1/environments/
									{'{'}environmentId{'}'}/users/{'{'}userId{'}'}/devices/{'{'}deviceId{'}'}
								</InfoText>
							</div>
						</InfoBox>

						<ParameterGrid>
							<ParameterLabel>User ID:</ParameterLabel>
							<ParameterValue>
								<input
									type="text"
									value={userId}
									onChange={(e) => setUserId(e.target.value)}
									placeholder="User ID"
									style={{ width: '100%', padding: '0.5rem' }}
									disabled
								/>
							</ParameterValue>

							<ParameterLabel>Device ID:</ParameterLabel>
							<ParameterValue>
								<input
									type="text"
									value={deviceId}
									onChange={(e) => setDeviceId(e.target.value)}
									placeholder="Device ID"
									style={{ width: '100%', padding: '0.5rem' }}
									disabled
								/>
							</ParameterValue>
						</ParameterGrid>

						<Button onClick={handleEnableUserMFA} disabled={isLoading || !isStepValid(1)}>
							{isLoading ? <FiRefreshCw /> : <FiShield />}
							Enable MFA Device
						</Button>

						{(apiResponses[11] as Record<string, unknown>)?.enabled ? (
							<ResultsSection>
								<ResultsHeading>Step 11 Response:</ResultsHeading>
								<JSONHighlighter data={apiResponses[11]} />
								<InfoBox $variant="success">
									<FiCheckCircle />
									<div>
										<InfoTitle>MFA Device Enabled Successfully</InfoTitle>
									</div>
								</InfoBox>
							</ResultsSection>
						) : null}
					</CollapsibleHeader>
				);

			case 2:
				return (
					<CollapsibleHeader
						title="Step 12: Send Authorize Request"
						icon={<FiSend />}
						theme="blue"
						defaultCollapsed={false}
					>
						<InfoBox $variant="info">
							<FiInfo />
							<div>
								<InfoTitle>Initiate Authorization Code Flow</InfoTitle>
								<InfoText>
									Send an authorization request with response_mode=pi.flow to initiate the flow.
									This returns a flowId that will be used in subsequent steps.
								</InfoText>
							</div>
						</InfoBox>

						<Button onClick={handleSendAuthorizeRequest} disabled={isLoading}>
							{isLoading ? <FiRefreshCw /> : <FiSend />}
							Send Authorize Request
						</Button>

						{apiResponses[12] && (
							<ResultsSection>
								<ResultsHeading>Step 12 Response:</ResultsHeading>
								<JSONHighlighter data={apiResponses[12]} />
								{flowId && (
									<InfoBox $variant="success">
										<FiCheckCircle />
										<div>
											<InfoTitle>Flow ID:</InfoTitle>
											<InfoText>{flowId}</InfoText>
										</div>
									</InfoBox>
								)}
							</ResultsSection>
						)}
					</CollapsibleHeader>
				);

			case 3:
				return (
					<CollapsibleHeader
						title="Step 13: Get the Flow"
						icon={<FiPackage />}
						theme="highlight"
						defaultCollapsed={false}
					>
						<InfoBox $variant="info">
							<FiInfo />
							<div>
								<InfoTitle>Retrieve Flow Details</InfoTitle>
								<InfoText>
									Get the current state of the flow from PingOne. This shows what actions are
									available in the flow.
								</InfoText>
							</div>
						</InfoBox>

						<Button onClick={handleGetFlow} disabled={isLoading}>
							{isLoading ? <FiRefreshCw /> : <FiPackage />}
							Get Flow
						</Button>

						{apiResponses[13] && (
							<ResultsSection>
								<ResultsHeading>Step 13 Response:</ResultsHeading>
								<JSONHighlighter data={apiResponses[13]} />
							</ResultsSection>
						)}
					</CollapsibleHeader>
				);

			case 4:
				return (
					<CollapsibleHeader
						title="Step 14: Submit Login Credentials"
						icon={<FiUser />}
						theme="blue"
						defaultCollapsed={false}
					>
						<InfoBox $variant="info">
							<FiInfo />
							<div>
								<InfoTitle>Authenticate with Username/Password</InfoTitle>
								<InfoText>
									Submit the user's login credentials to authenticate. This step advances the flow
									to the MFA challenge.
								</InfoText>
							</div>
						</InfoBox>

						<ParameterGrid>
							<ParameterLabel>Username:</ParameterLabel>
							<ParameterValue>
								<input
									type="text"
									value={username}
									onChange={(e) => setUsername(e.target.value)}
									placeholder="Username"
									style={{ width: '100%', padding: '0.5rem' }}
								/>
							</ParameterValue>

							<ParameterLabel>Password:</ParameterLabel>
							<ParameterValue>
								<input
									type="password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									placeholder="Password"
									style={{ width: '100%', padding: '0.5rem' }}
								/>
							</ParameterValue>
						</ParameterGrid>

						<Button
							onClick={handleSubmitLoginCredentials}
							disabled={isLoading || !username || !password}
						>
							{isLoading ? <FiRefreshCw /> : <FiUser />}
							Submit Login Credentials
						</Button>

						{apiResponses[14] && (
							<ResultsSection>
								<ResultsHeading>Step 14 Response:</ResultsHeading>
								<JSONHighlighter data={apiResponses[14]} />
							</ResultsSection>
						)}
					</CollapsibleHeader>
				);

			case 5:
				return (
					<CollapsibleHeader
						title="Step 15: Submit MFA Credentials"
						icon={<FiSmartphone />}
						theme="blue"
						defaultCollapsed={false}
					>
						<InfoBox $variant="info">
							<FiInfo />
							<div>
								<InfoTitle>Complete MFA Challenge</InfoTitle>
								<InfoText>
									Submit the MFA code received via SMS to complete the MFA challenge.
								</InfoText>
							</div>
						</InfoBox>

						<ParameterGrid>
							<ParameterLabel>MFA Code:</ParameterLabel>
							<ParameterValue>
								<input
									type="text"
									value={mfaCode}
									onChange={(e) => setMfaCode(e.target.value)}
									placeholder="Enter MFA code from SMS"
									style={{ width: '100%', padding: '0.5rem' }}
								/>
							</ParameterValue>
						</ParameterGrid>

						<Button onClick={handleSubmitMFACredentials} disabled={isLoading || !mfaCode}>
							{isLoading ? <FiRefreshCw /> : <FiSmartphone />}
							Submit MFA Credentials
						</Button>

						{apiResponses[15] && (
							<ResultsSection>
								<ResultsHeading>Step 15 Response:</ResultsHeading>
								<JSONHighlighter data={apiResponses[15]} />
							</ResultsSection>
						)}
					</CollapsibleHeader>
				);

			case 6:
				return (
					<CollapsibleHeader
						title="Step 16: Call Resume Endpoint"
						icon={<FiCheckCircle />}
						theme="green"
						defaultCollapsed={false}
					>
						<InfoBox $variant="info">
							<FiInfo />
							<div>
								<InfoTitle>Get Authorization Code</InfoTitle>
								<InfoText>
									After successful authentication and MFA, call the resume endpoint to get the
									authorization code.
								</InfoText>
							</div>
						</InfoBox>

						<Button onClick={handleCallResumeEndpoint} disabled={isLoading}>
							{isLoading ? <FiRefreshCw /> : <FiCheckCircle />}
							Call Resume Endpoint
						</Button>

						{apiResponses[16] && (
							<ResultsSection>
								<ResultsHeading>Step 16 Response:</ResultsHeading>
								<JSONHighlighter data={apiResponses[16]} />
								{authorizationCode && (
									<InfoBox $variant="success">
										<FiCheckCircle />
										<div>
											<InfoTitle>Authorization Code:</InfoTitle>
											<InfoText>{String(authorizationCode)}</InfoText>
										</div>
									</InfoBox>
								)}
							</ResultsSection>
						)}
					</CollapsibleHeader>
				);

			case 7:
				return (
					<CollapsibleHeader
						title="Step 17: Generate Access Token"
						icon={<FiKey />}
						theme="blue"
						defaultCollapsed={false}
					>
						<InfoBox $variant="info">
							<FiInfo />
							<div>
								<InfoTitle>Exchange Authorization Code for Tokens</InfoTitle>
								<InfoText>
									Exchange the authorization code for access token, refresh token, and ID token.
								</InfoText>
							</div>
						</InfoBox>

						<Button onClick={handleGenerateAccessToken} disabled={isLoading}>
							{isLoading ? <FiRefreshCw /> : <FiKey />}
							Generate Access Token
						</Button>

						{apiResponses[17] && (
							<ResultsSection>
								<ResultsHeading>Step 17 Response:</ResultsHeading>
								<JSONHighlighter data={apiResponses[17]} />
							</ResultsSection>
						)}
					</CollapsibleHeader>
				);

			case 8:
				return (
					<CollapsibleHeader
						title="Step 18-20: Flow Complete"
						icon={<FiCheckCircle />}
						theme="green"
						defaultCollapsed={false}
					>
						<InfoBox $variant="success">
							<FiCheckCircle />
							<div>
								<InfoTitle>Flow Completed Successfully</InfoTitle>
								<InfoText>
									The authorization code flow with MFA has been completed successfully. All tokens
									have been received.
								</InfoText>
							</div>
						</InfoBox>

						{tokens && (
							<ResultsSection>
								<ResultsHeading>Received Tokens:</ResultsHeading>
								<JSONHighlighter data={tokens} />
							</ResultsSection>
						)}
					</CollapsibleHeader>
				);

			default:
				return null;
		}
	}, [
		currentStep,
		credentials,
		userId,
		deviceId,
		flowId,
		authorizationCode,
		tokens,
		apiResponses,
		isLoading,
		isStepValid,
		handleEnableUserMFA,
		handleSendAuthorizeRequest,
		handleGetFlow,
		handleSubmitLoginCredentials,
		handleSubmitMFACredentials,
		handleCallResumeEndpoint,
		handleGenerateAccessToken,
		deviceSelectionMode,
		existingDevices.length,
		existingDevices.map,
		handleCredentialsChange,
		handleDiscoveryComplete,
		handleFetchExistingDevices,
		handleRegisterMobilePhone,
		handleSelectExistingDevice,
		isLoadingDevices,
		mfaCode,
		password,
		phoneNumber,
		selectedExistingDeviceId,
		username,
		workerToken,
	]);

	return (
		<Container>
			<ContentWrapper>
				<FlowHeader
					flowId="pingone-mfa-workflow-library"
					customConfig={{
						flowType: 'oauth',
						title: 'PingOne MFA Flow - Workflow Library',
						subtitle:
							'Authorization Code Flow with MFA following PingOne Workflow Library Steps 11-20',
						icon: '🔐',
					}}
				/>

				<MainCard>
					<StepHeader>
						<StepHeaderLeft>
							<StepNumber>{currentStep + 1}</StepNumber>
							<div>
								<StepHeaderTitle>{STEP_METADATA[currentStep]?.title || 'Step'}</StepHeaderTitle>
								<StepHeaderSubtitle>
									{STEP_METADATA[currentStep]?.subtitle || ''}
								</StepHeaderSubtitle>
							</div>
						</StepHeaderLeft>
						<StepHeaderRight>
							<StepTotal>
								Step {currentStep + 1} of {STEP_METADATA.length}
							</StepTotal>
						</StepHeaderRight>
					</StepHeader>

					<StepContentWrapper>{renderStepContent}</StepContentWrapper>
				</MainCard>

				<StepNavigationButtons
					currentStep={currentStep}
					totalSteps={STEP_METADATA.length}
					onPrevious={() => setCurrentStep(Math.max(0, currentStep - 1))}
					onNext={() => setCurrentStep(Math.min(STEP_METADATA.length - 1, currentStep + 1))}
					onReset={() => {
						setCurrentStep(0);
						setFlowId('');
						setAuthorizationCode('');
						setTokens(null);
						setApiResponses({});
						setUserId('');
						setUsername('');
						setPassword('');
						setPhoneNumber('');
						setDeviceId('');
						setMfaCode('');
						setWorkerToken('');
						setExistingDevices([]);
						setSelectedExistingDeviceId('');
						setDeviceSelectionMode('select');
					}}
					canNavigateNext={isStepValid(currentStep)}
					isFirstStep={currentStep === 0}
					nextButtonText={isStepValid(currentStep) ? 'Next' : 'Complete current step first'}
				/>

				<WorkerTokenModal
					isOpen={showWorkerTokenModal}
					onClose={() => setShowWorkerTokenModal(false)}
					onContinue={() => {
						setShowWorkerTokenModal(false);
						// Token will be loaded via the workerTokenUpdated event
					}}
					flowType="pingone-mfa-workflow-library"
					environmentId={credentials.environmentId || ''}
					prefillCredentials={(() => {
						// IMPORTANT: Do NOT use authorization code flow scopes (openid profile email) for worker tokens
						// Worker tokens use roles for authorization, not scopes. Scopes are optional - only send if user provides one.
						// Load saved worker token credentials first to get the correct scopes
						const savedWorkerTokenCreds = workerTokenCredentialsService.loadCredentials(
							'pingone-mfa-workflow-library'
						);

						// Use saved worker token scopes if available, otherwise empty (no scope sent)
						// Worker tokens use roles, not scopes - scopes are optional
						let workerScopes = ''; // Empty by default - worker tokens use roles, not scopes
						if (savedWorkerTokenCreds?.scopes) {
							const savedScopes = Array.isArray(savedWorkerTokenCreds.scopes)
								? savedWorkerTokenCreds.scopes.join(' ')
								: savedWorkerTokenCreds.scopes;
							// Use first scope only if user provided one (scopes aren't used for authorization)
							const scopeArray = savedScopes.split(/\s+/).filter(Boolean);
							workerScopes = scopeArray.length > 0 ? scopeArray[0] : '';
						}

						// Log what we're passing to help debug
						console.log(
							'[PingOneMFAWorkflowLibraryV7] 🎯 Passing credentials to WorkerTokenModal:',
							{
								environmentId: credentials.environmentId || 'MISSING',
								environmentIdLength: credentials.environmentId?.length || 0,
								clientIdLength: credentials.clientId?.length || 0,
								clientSecretLength: credentials.clientSecret?.length || 0,
								userId: userId || 'not set',
								warning:
									credentials.environmentId === userId
										? '⚠️ WARNING: environmentId matches userId!'
										: 'OK',
								authCodeFlowScopes: credentials.scopes, // Authorization code flow scopes (NOT used for worker tokens)
								workerTokenScopes: workerScopes || '(empty - no scope will be sent)', // Worker token scopes (optional, roles-based)
								note: 'Worker tokens use ROLES for authorization, not scopes. Scopes are optional and may not be sent.',
							}
						);

						return {
							environmentId: credentials.environmentId || '',
							clientId: credentials.clientId || '',
							clientSecret: credentials.clientSecret || '',
							region: savedWorkerTokenCreds?.region || 'us',
							// Use worker token scopes (empty if none saved - scopes are optional for worker tokens)
							scopes: workerScopes,
						};
					})()}
				/>
			</ContentWrapper>
		</Container>
	);
};

export default PingOneMFAWorkflowLibraryV7;
