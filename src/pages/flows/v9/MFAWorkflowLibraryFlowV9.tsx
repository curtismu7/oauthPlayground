// src/pages/flows/v9/MFAWorkflowLibraryFlowV9.tsx
// V9 PingOne MFA Workflow Library Flow — Steps 11-20 (Authorization Code + MFA)
// V9 improvements: V9CredentialStorageService, CompactAppPickerV8U, toastV8, no WorkerTokenModal

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
import type React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { modernMessaging } from '@/services/v9/V9ModernMessagingService';
import JSONHighlighter, { type JSONData } from '../../../components/JSONHighlighter';
import PhoneNumberInput from '../../../components/PhoneNumberInput';
import type { StepCredentials } from '../../../components/steps/CommonSteps';
import { usePageScroll } from '../../../hooks/usePageScroll';
import { CollapsibleHeader } from '../../../services/collapsibleHeaderService';
import ComprehensiveCredentialsService from '../../../services/comprehensiveCredentialsService';
import { FlowHeader } from '../../../services/flowHeaderService';
import { FlowUIService } from '../../../services/flowUIService';
import { V9CredentialStorageService } from '../../../services/v9/V9CredentialStorageService';
import { getAnyWorkerToken } from '../../../utils/workerTokenDetection';
import type { DiscoveredApp } from '../../../v8/components/AppPickerV8';
import { CompactAppPickerV8U } from '../../../v8u/components/CompactAppPickerV8U';

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
	{ title: 'Step 11b: Enable User MFA', subtitle: 'Enable MFA device for user' },
	{ title: 'Step 12: Send Authorize Request', subtitle: 'Initiate authorization code flow' },
	{ title: 'Step 13: Get the Flow', subtitle: 'Retrieve flow details from PingOne' },
	{ title: 'Step 14: Submit Login Credentials', subtitle: 'Authenticate with username/password' },
	{ title: 'Step 15: Submit MFA Credentials', subtitle: 'Complete MFA challenge' },
	{ title: 'Step 16: Call Resume Endpoint', subtitle: 'Resume flow to get authorization code' },
	{ title: 'Step 17: Generate Access Token', subtitle: 'Exchange authorization code for tokens' },
	{ title: 'Steps 18-20: Flow Complete', subtitle: 'Flow completion summary' },
];

const FLOW_KEY = 'pingone-mfa-workflow-library-v9';
const V9_STORAGE_KEY = 'v9:mfa-workflow-library';

const MFAWorkflowLibraryFlowV9: React.FC = () => {
	usePageScroll({ pageName: 'MFAWorkflowLibraryFlowV9', force: true });
	const navigate = useNavigate();

	const [currentStep, setCurrentStep] = useState(0);
	const [credentials, setCredentials] = useState<StepCredentials>({
		environmentId: '',
		clientId: '',
		clientSecret: '',
		redirectUri: 'https://localhost:3000/callback',
		scopes: 'openid profile email',
	});

	// V9 4-layer storage: load on mount
	useEffect(() => {
		const saved = V9CredentialStorageService.loadSync(V9_STORAGE_KEY);
		if (saved && (saved.clientId || saved.environmentId)) {
			setCredentials((prev) => ({ ...prev, ...saved }));
		}
		V9CredentialStorageService.load(V9_STORAGE_KEY).then((c) => {
			if (c && (c.clientId || c.environmentId)) {
				setCredentials((prev) => ({ ...prev, ...c }));
			}
		});
	}, []);

	// Worker token — kept in sync via storage event
	const [workerToken, setWorkerToken] = useState(() => getAnyWorkerToken() ?? '');
	useEffect(() => {
		const onStorage = () => setWorkerToken(getAnyWorkerToken() ?? '');
		window.addEventListener('storage', onStorage);
		window.addEventListener('workerTokenUpdated', onStorage);
		return () => {
			window.removeEventListener('storage', onStorage);
			window.removeEventListener('workerTokenUpdated', onStorage);
		};
	}, []);

	// App picker: auto-fill clientId from discovered app
	const handleAppSelected = useCallback((app: DiscoveredApp) => {
		setCredentials((prev) => {
			const updated = { ...prev, clientId: app.id };
			V9CredentialStorageService.save(
				V9_STORAGE_KEY,
				{
					clientId: app.id,
					...(updated.environmentId ? { environmentId: updated.environmentId } : {}),
				},
				updated.environmentId ? { environmentId: updated.environmentId } : {}
			);
			return updated;
		});
	}, []);

	// Handle any credential field change — persist to V9 storage
	const handleCredentialsChange = useCallback((newCredentials: StepCredentials) => {
		setCredentials(newCredentials);
		V9CredentialStorageService.save(
			V9_STORAGE_KEY,
			{ ...newCredentials } as Record<string, string>,
			newCredentials.environmentId ? { environmentId: newCredentials.environmentId } : {}
		);
	}, []);

	// Save handler
	const handleSaveCredentials = useCallback(() => {
		V9CredentialStorageService.save(
			V9_STORAGE_KEY,
			{ ...credentials } as Record<string, string>,
			credentials.environmentId ? { environmentId: credentials.environmentId } : {}
		);
		modernMessaging.showFooterMessage({
			type: 'info',
			message: 'Credentials saved successfully!',
			duration: 3000,
		});
	}, [credentials]);

	// Flow-specific state
	const [userId, setUserId] = useState('');
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [phoneNumber, setPhoneNumber] = useState('');
	const [deviceId, setDeviceId] = useState('');
	const [mfaCode, setMfaCode] = useState('');
	const [flowId, setFlowId] = useState('');
	const [authorizationCode, setAuthorizationCode] = useState('');
	const [tokens, setTokens] = useState<ApiResponse | null>(null);
	const [apiResponses, setApiResponses] = useState<Record<number, ApiResponse>>({});
	const [isLoading, setIsLoading] = useState(false);
	const [existingDevices, setExistingDevices] = useState<MfaDevice[]>([]);
	const [isLoadingDevices, setIsLoadingDevices] = useState(false);
	const [deviceSelectionMode, setDeviceSelectionMode] = useState<'select' | 'register'>('select');
	const [selectedExistingDeviceId, setSelectedExistingDeviceId] = useState('');

	// Fetch existing MFA devices for user
	const handleFetchExistingDevices = useCallback(async () => {
		if (!credentials.environmentId || !userId || !workerToken) {
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: 'Please provide Environment ID, User ID, and Worker Token',
				dismissible: true,
			});
			return;
		}
		setIsLoadingDevices(true);
		try {
			const response = await fetch(
				`/api/pingone/user/${userId}/mfa?environmentId=${credentials.environmentId}&accessToken=${encodeURIComponent(workerToken)}`,
				{ method: 'GET', headers: { 'Content-Type': 'application/json' } }
			);
			const data = (await response.json()) as { devices?: MfaDevice[] };
			if (response.ok && data.devices) {
				const smsDevices = data.devices.filter(
					(d: MfaDevice) => d.type === 'SMS' || d.type === 'MOBILE'
				);
				setExistingDevices(smsDevices);
				if (smsDevices.length > 0) {
					modernMessaging.showFooterMessage({
						type: 'info',
						message: `Found ${smsDevices.length} SMS device(s)`,
						duration: 3000,
					});
				} else {
					modernMessaging.showFooterMessage({
						type: 'info',
						message: 'No SMS devices found. You can register a new one.',
						duration: 3000,
					});
				}
			} else {
				setExistingDevices([]);
			}
		} catch {
			setExistingDevices([]);
		} finally {
			setIsLoadingDevices(false);
		}
	}, [credentials.environmentId, userId, workerToken]);

	// Auto-fetch devices when user ID, token, and env are available on step 0
	useEffect(() => {
		if (userId && workerToken && credentials.environmentId && currentStep === 0) {
			handleFetchExistingDevices();
		}
	}, [userId, workerToken, credentials.environmentId, currentStep, handleFetchExistingDevices]);

	// Select an existing device
	const handleSelectExistingDevice = useCallback(
		(selectedDeviceId: string) => {
			setSelectedExistingDeviceId(selectedDeviceId);
			const device = existingDevices.find((d) => d.id === selectedDeviceId);
			if (device) {
				setDeviceId(device.id);
				setApiResponses((prev) => ({ ...prev, 11: device as unknown as ApiResponse }));
				modernMessaging.showFooterMessage({
					type: 'info',
					message: 'Device selected successfully',
					duration: 3000,
				});
				setCurrentStep(1);
			}
		},
		[existingDevices]
	);

	// Step 11a: Register Mobile Phone
	const handleRegisterMobilePhone = useCallback(async () => {
		if (!credentials.environmentId || !userId || !phoneNumber) {
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: 'Please provide Environment ID, User ID, and Phone Number',
				dismissible: true,
			});
			return;
		}
		if (!workerToken) {
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: 'Worker token is required for device registration',
				dismissible: true,
			});
			return;
		}
		setIsLoading(true);
		try {
			const response = await fetch(
				`/api/pingone/environments/${credentials.environmentId}/users/${userId}/devices`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${workerToken}` },
					body: JSON.stringify({ type: 'SMS', phone: phoneNumber, nickname: 'Mobile Phone' }),
				}
			);
			const data = await response.json();
			if (response.ok && data.id) {
				setDeviceId(data.id);
				setApiResponses((prev) => ({ ...prev, 11: data }));
				modernMessaging.showFooterMessage({
					type: 'info',
					message: 'Mobile phone registered successfully',
					duration: 3000,
				});
				setCurrentStep(1);
			} else {
				throw new Error(data.error_description || data.error || 'Failed to register mobile phone');
			}
		} catch (err) {
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: err instanceof Error ? err.message : 'Failed to register mobile phone',
				dismissible: true,
			});
		} finally {
			setIsLoading(false);
		}
	}, [credentials.environmentId, userId, phoneNumber, workerToken]);

	// Step 11b: Enable User MFA
	const handleEnableUserMFA = useCallback(async () => {
		if (!credentials.environmentId || !userId || !deviceId) {
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: 'Please provide Environment ID, User ID, and Device ID',
				dismissible: true,
			});
			return;
		}
		if (!workerToken) {
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: 'Worker token is required to enable MFA device',
				dismissible: true,
			});
			return;
		}
		setIsLoading(true);
		try {
			const response = await fetch(
				`/api/pingone/environments/${credentials.environmentId}/users/${userId}/devices/${deviceId}`,
				{
					method: 'PUT',
					headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${workerToken}` },
					body: JSON.stringify({ enabled: true }),
				}
			);
			const data = (await response.json()) as ApiResponse;
			if (response.ok) {
				setApiResponses((prev) => {
					const prev11 = (prev[11] as Record<string, unknown>) || {};
					const dataObj = (data as Record<string, unknown>) || {};
					return { ...prev, 11: { ...prev11, enabled: true, ...dataObj } as ApiResponse };
				});
				modernMessaging.showFooterMessage({
					type: 'info',
					message: 'MFA device enabled successfully',
					duration: 3000,
				});
				setCurrentStep(2);
			} else {
				const errData = (data as Record<string, unknown>) || {};
				throw new Error(
					(errData.error_description as string) ||
						(errData.error as string) ||
						'Failed to enable MFA device'
				);
			}
		} catch (err) {
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: err instanceof Error ? err.message : 'Failed to enable MFA device',
				dismissible: true,
			});
		} finally {
			setIsLoading(false);
		}
	}, [credentials.environmentId, userId, deviceId, workerToken]);

	// Step 12: Send Authorize Request
	const handleSendAuthorizeRequest = useCallback(async () => {
		if (!credentials.environmentId || !credentials.clientId) {
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: 'Please configure credentials first',
				dismissible: true,
			});
			return;
		}
		setIsLoading(true);
		try {
			const response = await fetch('/api/pingone/redirectless/authorize', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
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
				modernMessaging.showFooterMessage({
					type: 'info',
					message: 'Authorization request sent successfully',
					duration: 3000,
				});
				setCurrentStep(3);
			} else {
				throw new Error(data.error_description || data.error || 'Failed to send authorize request');
			}
		} catch (err) {
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: err instanceof Error ? err.message : 'Failed to send authorize request',
				dismissible: true,
			});
		} finally {
			setIsLoading(false);
		}
	}, [credentials]);

	// Step 13: Get the Flow
	const handleGetFlow = useCallback(async () => {
		if (!flowId || !credentials.environmentId) {
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: 'Flow ID is required',
				dismissible: true,
			});
			return;
		}
		setIsLoading(true);
		try {
			const response = await fetch(`/api/pingone/flows/${flowId}`, {
				method: 'GET',
				headers: { 'Content-Type': 'application/json' },
			});
			const data = await response.json();
			if (response.ok) {
				setApiResponses((prev) => ({ ...prev, 13: data }));
				modernMessaging.showFooterMessage({
					type: 'info',
					message: 'Flow retrieved successfully',
					duration: 3000,
				});
				setCurrentStep(4);
			} else {
				throw new Error(data.error_description || data.error || 'Failed to get flow');
			}
		} catch (err) {
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: err instanceof Error ? err.message : 'Failed to get flow',
				dismissible: true,
			});
		} finally {
			setIsLoading(false);
		}
	}, [flowId, credentials.environmentId]);

	// Step 14: Submit Login Credentials
	const handleSubmitLoginCredentials = useCallback(async () => {
		if (!flowId || !credentials.environmentId) {
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: 'Flow ID is required',
				dismissible: true,
			});
			return;
		}
		setIsLoading(true);
		try {
			const response = await fetch('/api/pingone/flows/check-username-password', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					flowUrl: `https://auth.pingone.com/${credentials.environmentId}/flows/${flowId}`,
					username: username || userId,
					password: password,
				}),
			});
			const data = await response.json();
			if (response.ok) {
				setApiResponses((prev) => ({ ...prev, 14: data }));
				modernMessaging.showFooterMessage({
					type: 'info',
					message: 'Login credentials submitted successfully',
					duration: 3000,
				});
				setCurrentStep(5);
			} else {
				throw new Error(
					data.error_description || data.error || 'Failed to submit login credentials'
				);
			}
		} catch (err) {
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: err instanceof Error ? err.message : 'Failed to submit login credentials',
				dismissible: true,
			});
		} finally {
			setIsLoading(false);
		}
	}, [flowId, credentials.environmentId, username, userId, password]);

	// Step 15: Submit MFA Credentials
	const handleSubmitMFACredentials = useCallback(async () => {
		if (!flowId || !credentials.environmentId) {
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: 'Flow ID is required',
				dismissible: true,
			});
			return;
		}
		setIsLoading(true);
		try {
			const response = await fetch(`/api/pingone/flows/${flowId}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'mfa.check', code: mfaCode }),
			});
			const data = await response.json();
			if (response.ok) {
				setApiResponses((prev) => ({ ...prev, 15: data }));
				modernMessaging.showFooterMessage({
					type: 'info',
					message: 'MFA credentials submitted successfully',
					duration: 3000,
				});
				setCurrentStep(6);
			} else {
				throw new Error(data.error_description || data.error || 'Failed to submit MFA credentials');
			}
		} catch (err) {
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: err instanceof Error ? err.message : 'Failed to submit MFA credentials',
				dismissible: true,
			});
		} finally {
			setIsLoading(false);
		}
	}, [flowId, credentials.environmentId, mfaCode]);

	// Step 16: Call Resume Endpoint
	const handleCallResumeEndpoint = useCallback(async () => {
		if (!flowId || !credentials.environmentId) {
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: 'Flow ID is required',
				dismissible: true,
			});
			return;
		}
		setIsLoading(true);
		try {
			const response = await fetch(
				`/api/pingone/resume?flowId=${flowId}&environment_id=${credentials.environmentId}`,
				{ method: 'GET', headers: { 'Content-Type': 'application/json' } }
			);
			const data = await response.json();
			if (response.ok && data.code) {
				setAuthorizationCode(data.code);
				setApiResponses((prev) => ({ ...prev, 16: data }));
				modernMessaging.showFooterMessage({
					type: 'info',
					message: 'Authorization code received successfully',
					duration: 3000,
				});
				setCurrentStep(7);
			} else {
				throw new Error(data.error_description || data.error || 'Failed to get authorization code');
			}
		} catch (err) {
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: err instanceof Error ? err.message : 'Failed to call resume endpoint',
				dismissible: true,
			});
		} finally {
			setIsLoading(false);
		}
	}, [flowId, credentials.environmentId]);

	// Step 17: Generate Access Token
	const handleGenerateAccessToken = useCallback(async () => {
		if (!authorizationCode || !credentials.environmentId || !credentials.clientId) {
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: 'Authorization code and credentials are required',
				dismissible: true,
			});
			return;
		}
		setIsLoading(true);
		try {
			const response = await fetch('/api/token-exchange', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
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
				modernMessaging.showFooterMessage({
					type: 'info',
					message: 'Access token generated successfully',
					duration: 3000,
				});
				setCurrentStep(8);
			} else {
				throw new Error(data.error_description || data.error || 'Failed to generate access token');
			}
		} catch (err) {
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: err instanceof Error ? err.message : 'Failed to generate access token',
				dismissible: true,
			});
		} finally {
			setIsLoading(false);
		}
	}, [authorizationCode, credentials]);

	// Step validation
	const isStepValid = useCallback(
		(step: number): boolean => {
			switch (step) {
				case 0:
					return !!(credentials.environmentId && credentials.clientId && userId && workerToken);
				case 1:
					return !!deviceId && !!apiResponses[11];
				case 2:
					return !!(apiResponses[11] as Record<string, unknown>)?.enabled;
				case 3:
					return !!flowId;
				case 4:
					return !!apiResponses[13];
				case 5:
					return !!apiResponses[14];
				case 6:
					return !!apiResponses[15];
				case 7:
					return !!authorizationCode;
				case 8:
					return !!tokens;
				default:
					return true;
			}
		},
		[credentials, userId, workerToken, deviceId, apiResponses, flowId, authorizationCode, tokens]
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
							<CompactAppPickerV8U
								environmentId={credentials.environmentId ?? ''}
								onAppSelected={handleAppSelected}
							/>

							<ComprehensiveCredentialsService
								flowType={FLOW_KEY}
								credentials={credentials}
								onCredentialsChange={handleCredentialsChange}
								onEnvironmentIdChange={(envId) => {
									setCredentials((prev) => {
										const updated = { ...prev, environmentId: envId };
										V9CredentialStorageService.save(
											V9_STORAGE_KEY,
											{ ...updated } as Record<string, string>,
											{ environmentId: envId }
										);
										return updated;
									});
								}}
								onSave={handleSaveCredentials}
								showConfigChecker={false}
								showRedirectUri={true}
								showPostLogoutRedirectUri={false}
								showLoginHint={false}
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
										SMS-based MFA. Requires a valid Worker Token.
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
										placeholder="PingOne User ID"
										style={{ width: '100%', padding: '0.5rem' }}
									/>
								</ParameterValue>

								<ParameterLabel>Worker Token:</ParameterLabel>
								<ParameterValue>
									<Button
										onClick={() => navigate('/flows/worker-token-v9')}
										style={{
											width: '100%',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											gap: '0.5rem',
											backgroundColor: workerToken ? '#16a34a' : '#dc2626',
											color: '#ffffff',
										}}
									>
										{workerToken ? <FiCheckCircle /> : <FiKey />}
										{workerToken ? 'Worker Token Active ✓' : 'Get Worker Token →'}
									</Button>
								</ParameterValue>
							</ParameterGrid>

							{userId && workerToken && credentials.environmentId && (
								<>
									<Button
										onClick={handleFetchExistingDevices}
										disabled={isLoadingDevices}
										style={{ marginTop: '1rem', marginBottom: '1rem' }}
									>
										<FiRefreshCw />
										{isLoadingDevices ? 'Loading...' : 'Refresh Devices'}
									</Button>

									{existingDevices.length > 0 && (
										<div style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
											<InfoTitle style={{ marginBottom: '1rem' }}>Existing SMS Devices:</InfoTitle>
											{existingDevices.map((device) => (
												<button
													key={device.id}
													type="button"
													onClick={() => handleSelectExistingDevice(device.id)}
													style={{
														padding: '1rem',
														border:
															selectedExistingDeviceId === device.id
																? '2px solid #3b82f6'
																: '1px solid #d1d5db',
														borderRadius: '0.5rem',
														cursor: 'pointer',
														marginBottom: '0.5rem',
														background:
															selectedExistingDeviceId === device.id ? '#eff6ff' : '#ffffff',
														width: '100%',
														textAlign: 'left',
													}}
												>
													<div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
														<FiSmartphone style={{ color: '#3b82f6' }} />
														<div style={{ flex: 1 }}>
															<div style={{ fontWeight: 600 }}>
																{device.phone || device.phoneNumber || device.name || 'SMS Device'}
															</div>
															<div style={{ fontSize: '0.875rem', color: '#64748b' }}>
																{device.type} • {device.status ?? 'Unknown'} •{' '}
																{device.enabled ? 'Enabled' : 'Disabled'}
															</div>
														</div>
														{selectedExistingDeviceId === device.id && (
															<FiCheckCircle style={{ color: '#10b981' }} />
														)}
													</div>
												</button>
											))}
										</div>
									)}

									<div style={{ display: 'flex', gap: '1rem', margin: '1rem 0' }}>
										<Button
											onClick={() => setDeviceSelectionMode('select')}
											style={{
												background: deviceSelectionMode === 'select' ? '#3b82f6' : '#f3f4f6',
												color: deviceSelectionMode === 'select' ? 'white' : '#374151',
											}}
										>
											Select Existing
										</Button>
										<Button
											onClick={() => setDeviceSelectionMode('register')}
											style={{
												background: deviceSelectionMode === 'register' ? '#3b82f6' : '#f3f4f6',
												color: deviceSelectionMode === 'register' ? 'white' : '#374151',
											}}
										>
											Register New
										</Button>
									</div>

									{deviceSelectionMode === 'register' && (
										<>
											<ParameterGrid>
												<ParameterLabel>Mobile Phone:</ParameterLabel>
												<ParameterValue>
													<PhoneNumberInput
														value={phoneNumber}
														onChange={(fullNumber) => setPhoneNumber(fullNumber)}
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

									{deviceSelectionMode === 'select' &&
										existingDevices.length === 0 &&
										!isLoadingDevices && (
											<InfoBox $variant="warning">
												<FiInfo />
												<div>
													<InfoTitle>No Existing Devices Found</InfoTitle>
													<InfoText>No SMS devices found. Use "Register New" to add one.</InfoText>
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
												<InfoTitle>Device Selected/Registered</InfoTitle>
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
						title="Step 11b: Enable User MFA"
						icon={<FiShield />}
						theme="blue"
						defaultCollapsed={false}
					>
						<InfoBox $variant="info">
							<FiInfo />
							<div>
								<InfoTitle>Enable User MFA Device</InfoTitle>
								<InfoText>
									Enable the registered MFA device for the user. API: PUT /environments/
									{'{environmentId}'}/users/{'{userId}'}/devices/{'{deviceId}'}
								</InfoText>
							</div>
						</InfoBox>
						<ParameterGrid>
							<ParameterLabel>User ID:</ParameterLabel>
							<ParameterValue>
								<input
									type="text"
									value={userId}
									readOnly
									style={{ width: '100%', padding: '0.5rem', background: '#f8fafc' }}
								/>
							</ParameterValue>
							<ParameterLabel>Device ID:</ParameterLabel>
							<ParameterValue>
								<input
									type="text"
									value={deviceId}
									readOnly
									style={{ width: '100%', padding: '0.5rem', background: '#f8fafc' }}
								/>
							</ParameterValue>
						</ParameterGrid>
						<Button onClick={handleEnableUserMFA} disabled={isLoading || !isStepValid(1)}>
							{isLoading ? <FiRefreshCw /> : <FiShield />}
							Enable MFA Device
						</Button>
						{(apiResponses[11] as Record<string, unknown>)?.enabled && (
							<ResultsSection>
								<ResultsHeading>Step 11b Response:</ResultsHeading>
								<JSONHighlighter data={apiResponses[11]} />
								<InfoBox $variant="success">
									<FiCheckCircle />
									<div>
										<InfoTitle>MFA Device Enabled Successfully</InfoTitle>
									</div>
								</InfoBox>
							</ResultsSection>
						)}
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
									Returns a flowId used in subsequent steps.
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
									Get the current state of the flow from PingOne to see what actions are available.
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
									Submit user login credentials to advance the flow to the MFA challenge.
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
								<InfoText>Submit the MFA code received via SMS to complete the challenge.</InfoText>
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
									Exchange the code for access token, refresh token, and ID token.
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
						title="Steps 18-20: Flow Complete"
						icon={<FiCheckCircle />}
						theme="green"
						defaultCollapsed={false}
					>
						<InfoBox $variant="success">
							<FiCheckCircle />
							<div>
								<InfoTitle>Flow Completed Successfully</InfoTitle>
								<InfoText>
									The authorization code flow with MFA has been completed. All tokens received.
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
		existingDevices,
		handleCredentialsChange,
		handleSaveCredentials,
		handleFetchExistingDevices,
		handleRegisterMobilePhone,
		handleSelectExistingDevice,
		handleAppSelected,
		isLoadingDevices,
		mfaCode,
		password,
		phoneNumber,
		selectedExistingDeviceId,
		username,
		workerToken,
		navigate,
	]);

	return (
		<Container>
			<ContentWrapper>
				<FlowHeader flowId="pingone-mfa-workflow-library-v9" />

				<MainCard>
					<StepHeader>
						<StepHeaderLeft>
							<StepNumber>{currentStep + 1}</StepNumber>
							<div>
								<StepHeaderTitle>{STEP_METADATA[currentStep]?.title ?? 'Step'}</StepHeaderTitle>
								<StepHeaderSubtitle>
									{STEP_METADATA[currentStep]?.subtitle ?? ''}
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
			</ContentWrapper>
		</Container>
	);
};

export default MFAWorkflowLibraryFlowV9;
