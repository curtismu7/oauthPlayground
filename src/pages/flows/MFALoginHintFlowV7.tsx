// src/pages/flows/MFALoginHintFlowV7.tsx
// MFA-Only Flow Using Login Hint Token - Based on PingOne Workflow Library

import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import {
	FiAlertCircle,
	FiArrowRight,
	FiBook,
	FiCheckCircle,
	FiChevronDown,
	FiCode,
	FiExternalLink,
	FiGlobe,
	FiInfo,
	FiKey,
	FiLock,
	FiLogOut,
	FiPackage,
	FiRefreshCw,
	FiSend,
	FiSettings,
	FiShield,
	FiSmartphone,
	FiUser,
} from 'react-icons/fi';
import styled from 'styled-components';
import { HelperText } from '../../components/ResultsPanel';
import { StepNavigationButtons } from '../../components/StepNavigationButtons';
import { usePageScroll } from '../../hooks/usePageScroll';
import { CollapsibleHeader } from '../../services/collapsibleHeaderService';
import FlowUIService from '../../services/flowUIService';
import { v4ToastManager } from '../../utils/v4ToastMessages';

// Types
interface MFALoginHintConfig {
	environmentId: string;
	applicationId: string;
	clientId: string;
	clientSecret: string;
	userId?: string;
	phoneNumber?: string;
	email?: string;
}

interface LoginHintTokenResponse {
	login_hint_token: string;
	expires_in: number;
	token_type: string;
	scope?: string;
	user_id?: string;
}

interface MFAResponse {
	flowId: string;
	status: string;
	userId: string;
	challenges: Array<{
		type: string;
		detail: string;
	}>;
	user?: {
		id: string;
		name: string;
	};
	authorizeUrl?: string;
	redirectUri?: string;
	state?: string;
}

interface MFACompletionResponse {
	flowId: string;
	status: string;
	userId: string;
	mfaVerified: boolean;
}

interface FlowResumeResponse {
	code: string;
	state: string;
	flowId: string;
	status: string;
}

interface TokenResponse {
	access_token: string;
	token_type: string;
	expires_in: number;
	scope?: string;
	refresh_token?: string;
	id_token?: string;
}

// Styled Components
const Container = FlowUIService.getContainer();
const ContentWrapper = FlowUIService.getContentWrapper();

const MainCard = styled.div`
	background-color: #ffffff;
	border-radius: 1rem;
	box-shadow: 0 20px 40px rgba(15, 23, 42, 0.1);
	border: 1px solid #e2e8f0;
	overflow: hidden;
`;

const FlowHeader = styled.div`
	padding: 2rem;
	background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
	color: white;
`;

const FlowContent = styled.div`
	padding: 2rem;
`;

const StepCard = styled.div`
	background: #ffffff;
	border: 1px solid #e2e8f0;
	border-radius: 0.75rem;
	padding: 1.5rem;
	margin-bottom: 1.5rem;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const StepTitle = styled.h3`
	color: #1f2937;
	font-size: 1.25rem;
	font-weight: 600;
	margin-bottom: 1rem;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const StepContent = styled.div`
	color: #6b7280;
	line-height: 1.6;
`;

const FormGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	gap: 1rem;
	margin-bottom: 1rem;
`;

const FormGroup = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`;

const FormLabel = styled.label`
	font-weight: 500;
	color: #374151;
	font-size: 0.875rem;
`;

const FormInput = styled.input`
	padding: 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	transition: all 0.2s ease;

	&:focus {
		outline: none;
		border-color: #f97316;
		box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1);
	}
`;

const FormSelect = styled.select`
	padding: 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	background-color: white;
	transition: all 0.2s ease;

	&:focus {
		outline: none;
		border-color: #f97316;
		box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1);
	}
`;

const ResultDisplay = styled.div`
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 0.5rem;
	padding: 1rem;
	margin-top: 1rem;
	font-family: 'Courier New', monospace;
	font-size: 0.875rem;
	white-space: pre-wrap;
	word-break: break-all;
`;

const LoadingSpinner = styled.div`
	display: inline-block;
	width: 16px;
	height: 16px;
	border: 2px solid #f3f4f6;
	border-top: 2px solid #f97316;
	border-radius: 50%;
	animation: spin 1s linear infinite;

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}
`;

// Step definitions
const FLOW_STEPS = [
	{
		id: 1,
		title: 'Application Setup',
		description: 'Create and configure the MFA application',
		icon: <FiSettings />,
	},
	{
		id: 2,
		title: 'User & Device Setup',
		description: 'Create user and configure MFA device',
		icon: <FiUser />,
	},
	{
		id: 3,
		title: 'Sign-On Policy',
		description: 'Configure MFA sign-on policy',
		icon: <FiShield />,
	},
	{
		id: 4,
		title: 'Login Hint Token',
		description: 'Generate login hint token for MFA flow',
		icon: <FiKey />,
	},
	{
		id: 5,
		title: 'MFA Authentication',
		description: 'Initiate MFA-only authentication flow',
		icon: <FiSmartphone />,
	},
	{
		id: 6,
		title: 'Complete Flow',
		description: 'Complete MFA authentication and get tokens',
		icon: <FiCheckCircle />,
	},
];

const MFALoginHintFlowV7: React.FC = () => {
	const { scrollToTopAfterAction } = usePageScroll();

	// State management
	const [currentStep, setCurrentStep] = useState(1);
	const [isProcessing, setIsProcessing] = useState(false);
	const [config, setConfig] = useState<MFALoginHintConfig>({
		environmentId: '',
		applicationId: '',
		clientId: '',
		clientSecret: '',
		userId: '',
		phoneNumber: '',
		email: '',
	});
	const [loginHintToken, setLoginHintToken] = useState<string>('');
	const [flowId, setFlowId] = useState<string>('');
	const [otpCode, setOtpCode] = useState<string>('');
	const [tokens, setTokens] = useState<TokenResponse | null>(null);
	const [apiResults, setApiResults] = useState<
		Record<
			string,
			| LoginHintTokenResponse
			| MFAResponse
			| MFACompletionResponse
			| FlowResumeResponse
			| TokenResponse
		>
	>({});
	const [errors, setErrors] = useState<Record<string, string>>({});

	// Load saved configuration on mount
	useEffect(() => {
		const savedConfig = localStorage.getItem('mfa-login-hint-config');
		if (savedConfig) {
			try {
				const parsed = JSON.parse(savedConfig);
				setConfig(parsed);
			} catch (error) {
				console.warn('Failed to parse saved config:', error);
			}
		}

		// Load global credentials if available
		const globalCredsStr = localStorage.getItem('globalCredentials');
		if (globalCredsStr) {
			try {
				const globalCreds = JSON.parse(globalCredsStr);
				if (globalCreds.environmentId && !config.environmentId) {
					setConfig((prev) => ({
						...prev,
						environmentId: globalCreds.environmentId,
						clientId: globalCreds.clientId || '',
						clientSecret: globalCreds.clientSecret || '',
					}));
				}
			} catch (error) {
				console.warn('Failed to parse global credentials:', error);
			}
		}
	}, [config.environmentId]);

	// Save configuration when it changes
	useEffect(() => {
		if (config.environmentId || config.clientId) {
			localStorage.setItem('mfa-login-hint-config', JSON.stringify(config));
		}
	}, [config]);

	// API call functions
	const makeApiCall = useCallback(
		async (
			method: string,
			endpoint: string,
			body?: Record<string, unknown>,
			headers?: Record<string, string>
		) => {
			const url = `/api/${endpoint}`;
			const requestOptions: RequestInit = {
				method,
				headers: {
					'Content-Type': 'application/json',
					...headers,
				},
			};

			if (body) {
				requestOptions.body = JSON.stringify(body);
			}

			try {
				const response = await fetch(url, requestOptions);
				const data = await response.json();

				if (!response.ok) {
					throw new Error(data.error || data.message || `HTTP ${response.status}`);
				}

				return data;
			} catch (error) {
				console.error(`API call failed: ${method} ${url}`, error);
				throw error;
			}
		},
		[]
	);

	// Step 1: Create Application
	const createApplication = useCallback(async () => {
		setIsProcessing(true);
		setErrors({});

		try {
			const result = await makeApiCall('POST', 'applications', {
				name: 'MFA Login Hint Flow App',
				description: 'Application for MFA-only flow using login hint token',
				protocol: 'OIDC',
				type: 'WEB',
				tokenEndpointAuthMethod: 'CLIENT_SECRET_BASIC',
				redirectUris: [`${window.location.origin}/mfa-login-hint-callback`],
				postLogoutRedirectUris: [`${window.location.origin}/logout-callback`],
			});

			setApiResults((prev) => ({ ...prev, createApplication: result }));
			setConfig((prev) => ({ ...prev, applicationId: result.id }));

			v4ToastManager.showSuccess('Application created successfully');
			return result;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to create application';
			setErrors((prev) => ({ ...prev, createApplication: errorMessage }));
			v4ToastManager.showError('createApplicationError');
			throw error;
		} finally {
			setIsProcessing(false);
		}
	}, [makeApiCall]);

	// Step 2: Create User and Enable MFA
	const createUserAndEnableMFA = useCallback(async () => {
		setIsProcessing(true);
		setErrors({});

		try {
			// Create user
			const userResult = await makeApiCall('POST', 'users', {
				name: {
					first: 'MFA',
					last: 'TestUser',
				},
				email: config.email || 'mfa.test@example.com',
				username: config.userId || 'mfa.testuser',
				populationId: config.environmentId, // Use environment ID as population for demo
			});

			// Set user password
			await makeApiCall('POST', `users/${userResult.id}/password`, {
				value: 'TempPassword123!',
				changePassword: false,
			});

			// Enable MFA for user
			await makeApiCall('POST', `users/${userResult.id}/mfaEnabled`);

			// Associate SMS device if phone number provided
			if (config.phoneNumber) {
				await makeApiCall('POST', `users/${userResult.id}/devices`, {
					type: 'SMS',
					phoneNumber: config.phoneNumber,
				});
			}

			setApiResults((prev) => ({ ...prev, createUser: userResult }));
			setConfig((prev) => ({ ...prev, userId: userResult.id }));

			v4ToastManager.showSuccess('User created and MFA enabled');
			return userResult;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to create user';
			setErrors((prev) => ({ ...prev, createUser: errorMessage }));
			v4ToastManager.showError('createUserError');
			throw error;
		} finally {
			setIsProcessing(false);
		}
	}, [makeApiCall, config]);

	// Step 3: Create Sign-On Policy
	const createSignOnPolicy = useCallback(async () => {
		setIsProcessing(true);
		setErrors({});

		try {
			// Create sign-on policy
			const policyResult = await makeApiCall('POST', 'signOnPolicies', {
				name: 'MFA Only Policy',
				description: 'Policy for MFA-only authentication using login hint token',
				default: false,
			});

			// Add SMS MFA action to policy
			const actionResult = await makeApiCall('POST', `signOnPolicies/${policyResult.id}/actions`, {
				type: 'SMS',
				priority: 1,
				configuration: {
					attempts: 3,
					resendInterval: 60,
				},
			});

			// Assign policy to application
			await makeApiCall('POST', `applications/${config.applicationId}/signOnPolicyAssignments`, {
				signOnPolicyId: policyResult.id,
			});

			// Create device authentication policy
			const devicePolicyResult = await makeApiCall('POST', 'deviceAuthenticationPolicies', {
				name: 'MFA Device Policy',
				description: 'Device policy for MFA flow',
				rememberDevice: true,
				rememberDeviceForSeconds: 86400, // 24 hours
			});

			setApiResults((prev) => ({
				...prev,
				createSignOnPolicy: policyResult,
				createMFAAction: actionResult,
				createDevicePolicy: devicePolicyResult,
			}));

			v4ToastManager.showSuccess('Sign-on policy created successfully');
			return policyResult;
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Failed to create sign-on policy';
			setErrors((prev) => ({ ...prev, createSignOnPolicy: errorMessage }));
			v4ToastManager.showError('createSignOnPolicyError');
			throw error;
		} finally {
			setIsProcessing(false);
		}
	}, [makeApiCall, config.applicationId]);

	// Step 4: Generate Login Hint Token
	const generateLoginHintToken = useCallback(async () => {
		setIsProcessing(true);
		setErrors({});

		// Validate required fields
		if (!config.environmentId) {
			const error = 'Environment ID is required';
			setErrors((prev) => ({ ...prev, loginHintToken: error }));
			v4ToastManager.showError('generateLoginHintTokenError');
			return;
		}

		if (!config.userId) {
			const error = 'User ID is required';
			setErrors((prev) => ({ ...prev, loginHintToken: error }));
			v4ToastManager.showError('generateLoginHintTokenError');
			return;
		}

		try {
			// Call the real login hint token API
			const result: LoginHintTokenResponse = await makeApiCall('POST', 'pingone/login-hint-token', {
				environmentId: config.environmentId,
				userId: config.userId,
				workerToken: 'demo-worker-token', // In production, get from worker app
			});

			setLoginHintToken(result.login_hint_token);
			setApiResults((prev) => ({ ...prev, loginHintToken: result }));

			v4ToastManager.showSuccess('Login hint token generated');
			return result;
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Failed to generate login hint token';
			setErrors((prev) => ({ ...prev, loginHintToken: errorMessage }));
			v4ToastManager.showError('generateLoginHintTokenError');
			throw error;
		} finally {
			setIsProcessing(false);
		}
	}, [makeApiCall, config]);

	// Step 5: Initiate MFA Authentication
	const initiateMFAAuth = useCallback(async () => {
		setIsProcessing(true);
		setErrors({});

		// Validate required fields
		if (!config.environmentId) {
			const error = 'Environment ID is required';
			setErrors((prev) => ({ ...prev, initiateAuth: error }));
			v4ToastManager.showError('initiateMFAAuthError');
			return;
		}

		if (!config.clientId) {
			const error = 'Client ID is required';
			setErrors((prev) => ({ ...prev, initiateAuth: error }));
			v4ToastManager.showError('initiateMFAAuthError');
			return;
		}

		if (!loginHintToken) {
			const error = 'Login hint token is required. Please generate it first.';
			setErrors((prev) => ({ ...prev, initiateAuth: error }));
			v4ToastManager.showError('initiateMFAAuthError');
			return;
		}

		try {
			// Call the real MFA authorize API
			const authResult: MFAResponse = await makeApiCall('POST', 'pingone/mfa/authorize', {
				environmentId: config.environmentId,
				clientId: config.clientId,
				loginHintToken: loginHintToken,
				redirectUri: `${window.location.origin}/mfa-login-hint-callback`,
				scope: 'openid profile',
				state: Math.random().toString(36).substring(2),
			});

			// Extract flow ID from the response
			if (authResult.flowId) {
				setFlowId(authResult.flowId);
				setApiResults((prev) => ({ ...prev, initiateAuth: authResult }));

				v4ToastManager.showSuccess('MFA authentication initiated');
				return authResult;
			} else {
				throw new Error('No flow ID received from authorization endpoint');
			}
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Failed to initiate MFA authentication';
			setErrors((prev) => ({ ...prev, initiateAuth: errorMessage }));
			v4ToastManager.showError('initiateMFAAuthError');
			throw error;
		} finally {
			setIsProcessing(false);
		}
	}, [makeApiCall, config, loginHintToken]);

	// Step 6: Complete MFA with OTP
	const completeMFAWithOTP = useCallback(async () => {
		setIsProcessing(true);
		setErrors({});

		// Validate required fields
		if (!config.environmentId) {
			const error = 'Environment ID is required';
			setErrors((prev) => ({ ...prev, completeMFA: error }));
			v4ToastManager.showError('completeMFAError');
			return;
		}

		if (!flowId) {
			const error = 'Flow ID is required. Please initiate MFA authentication first.';
			setErrors((prev) => ({ ...prev, completeMFA: error }));
			v4ToastManager.showError('completeMFAError');
			return;
		}

		if (!otpCode) {
			const error = 'OTP code is required';
			setErrors((prev) => ({ ...prev, completeMFA: error }));
			v4ToastManager.showError('completeMFAError');
			return;
		}

		if (!/^\d{6}$/.test(otpCode)) {
			const error = 'OTP code must be 6 digits';
			setErrors((prev) => ({ ...prev, completeMFA: error }));
			v4ToastManager.showError('completeMFAError');
			return;
		}

		try {
			// Submit OTP code to complete MFA
			const mfaResult: MFACompletionResponse = await makeApiCall('POST', 'pingone/mfa/complete', {
				environmentId: config.environmentId,
				flowId: flowId,
				otp: otpCode,
				workerToken: 'demo-worker-token', // In production, get from worker app
			});

			// Resume the flow to get authorization code
			const resumeResult: FlowResumeResponse = await makeApiCall(
				'GET',
				`pingone/mfa/resume?environmentId=${config.environmentId}&flowId=${flowId}`
			);

			// Exchange authorization code for tokens
			if (resumeResult.code) {
				const tokenResult: TokenResponse = await makeApiCall('POST', 'token', {
					grant_type: 'authorization_code',
					code: resumeResult.code,
					redirect_uri: `${window.location.origin}/mfa-login-hint-callback`,
					client_id: config.clientId,
					client_secret: config.clientSecret,
				});

				setTokens(tokenResult);
				setApiResults((prev) => ({
					...prev,
					completeMFA: mfaResult,
					resumeFlow: resumeResult,
					exchangeToken: tokenResult,
				}));

				v4ToastManager.showSuccess('MFA flow completed successfully');
				return tokenResult;
			} else {
				throw new Error('No authorization code received from resume endpoint');
			}
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Failed to complete MFA authentication';
			setErrors((prev) => ({ ...prev, completeMFA: errorMessage }));
			v4ToastManager.showError('completeMFAError');
			throw error;
		} finally {
			setIsProcessing(false);
		}
	}, [makeApiCall, config, flowId, otpCode]);

	// Navigation functions
	const nextStep = useCallback(async () => {
		try {
			switch (currentStep) {
				case 1:
					await createApplication();
					break;
				case 2:
					await createUserAndEnableMFA();
					break;
				case 3:
					await createSignOnPolicy();
					break;
				case 4:
					await generateLoginHintToken();
					break;
				case 5:
					await initiateMFAAuth();
					break;
				case 6:
					await completeMFAWithOTP();
					break;
			}

			if (currentStep < FLOW_STEPS.length) {
				setCurrentStep((prev) => prev + 1);
				scrollToTopAfterAction();
			}
		} catch (error) {
			console.error(`Failed to complete step ${currentStep}:`, error);
		}
	}, [
		currentStep,
		createApplication,
		createUserAndEnableMFA,
		createSignOnPolicy,
		generateLoginHintToken,
		initiateMFAAuth,
		completeMFAWithOTP,
		scrollToTopAfterAction,
	]);

	const prevStep = useCallback(() => {
		if (currentStep > 1) {
			setCurrentStep((prev) => prev - 1);
			scrollToTopAfterAction();
		}
	}, [currentStep, scrollToTopAfterAction]);

	const resetFlow = useCallback(() => {
		setCurrentStep(1);
		setLoginHintToken('');
		setFlowId('');
		setOtpCode('');
		setTokens(null);
		setApiResults({});
		setErrors({});
		scrollToTopAfterAction();
	}, [scrollToTopAfterAction]);

	// Render current step content
	const renderStepContent = () => {
		const step = FLOW_STEPS[currentStep - 1];

		switch (currentStep) {
			case 1:
				return (
					<StepCard>
						<StepTitle>
							<FiSettings />
							{step.title}
						</StepTitle>
						<StepContent>
							<p>Create a new PingOne application configured for MFA-only authentication.</p>

							<FormGrid>
								<FormGroup>
									<FormLabel>Application Name</FormLabel>
									<FormInput type="text" value="MFA Login Hint Flow App" disabled />
								</FormGroup>
								<FormGroup>
									<FormLabel>Protocol</FormLabel>
									<FormSelect value="OIDC" disabled>
										<option value="OIDC">OpenID Connect</option>
									</FormSelect>
								</FormGroup>
							</FormGrid>

							{apiResults.createApplication && (
								<ResultDisplay>
									{JSON.stringify(apiResults.createApplication, null, 2)}
								</ResultDisplay>
							)}

							{errors.createApplication && (
								<div style={{ color: '#dc2626', marginTop: '0.5rem' }}>
									{errors.createApplication}
								</div>
							)}
						</StepContent>
					</StepCard>
				);

			case 2:
				return (
					<StepCard>
						<StepTitle>
							<FiUser />
							{step.title}
						</StepTitle>
						<StepContent>
							<p>
								Create a test user and enable MFA authentication. Configure an SMS device for MFA.
							</p>

							<FormGrid>
								<FormGroup>
									<FormLabel>User ID</FormLabel>
									<FormInput
										type="text"
										placeholder="mfa.testuser"
										value={config.userId}
										onChange={(e) => setConfig((prev) => ({ ...prev, userId: e.target.value }))}
									/>
								</FormGroup>
								<FormGroup>
									<FormLabel>Email</FormLabel>
									<FormInput
										type="email"
										placeholder="mfa.test@example.com"
										value={config.email}
										onChange={(e) => setConfig((prev) => ({ ...prev, email: e.target.value }))}
									/>
								</FormGroup>
								<FormGroup>
									<FormLabel>Phone Number (for SMS)</FormLabel>
									<FormInput
										type="tel"
										placeholder="+1234567890"
										value={config.phoneNumber}
										onChange={(e) =>
											setConfig((prev) => ({ ...prev, phoneNumber: e.target.value }))
										}
									/>
								</FormGroup>
							</FormGrid>

							{apiResults.createUser && (
								<ResultDisplay>{JSON.stringify(apiResults.createUser, null, 2)}</ResultDisplay>
							)}

							{errors.createUser && (
								<div style={{ color: '#dc2626', marginTop: '0.5rem' }}>{errors.createUser}</div>
							)}
						</StepContent>
					</StepCard>
				);

			case 3:
				return (
					<StepCard>
						<StepTitle>
							<FiShield />
							{step.title}
						</StepTitle>
						<StepContent>
							<p>Create a sign-on policy with SMS MFA action and assign it to the application.</p>

							<FormGrid>
								<FormGroup>
									<FormLabel>Policy Name</FormLabel>
									<FormInput type="text" value="MFA Only Policy" disabled />
								</FormGroup>
								<FormGroup>
									<FormLabel>MFA Action Type</FormLabel>
									<FormSelect value="SMS" disabled>
										<option value="SMS">SMS Authentication</option>
									</FormSelect>
								</FormGroup>
							</FormGrid>

							{apiResults.createSignOnPolicy && (
								<ResultDisplay>
									{JSON.stringify(
										{
											policy: apiResults.createSignOnPolicy,
											action: apiResults.createMFAAction,
											devicePolicy: apiResults.createDevicePolicy,
										},
										null,
										2
									)}
								</ResultDisplay>
							)}

							{errors.createSignOnPolicy && (
								<div style={{ color: '#dc2626', marginTop: '0.5rem' }}>
									{errors.createSignOnPolicy}
								</div>
							)}
						</StepContent>
					</StepCard>
				);

			case 4:
				return (
					<StepCard>
						<StepTitle>
							<FiKey />
							{step.title}
						</StepTitle>
						<StepContent>
							<p>Generate a login hint token to identify the user for MFA-only authentication.</p>

							<FormGrid>
								<FormGroup>
									<FormLabel>User Identifier</FormLabel>
									<FormInput
										type="text"
										placeholder={config.userId || config.email || 'Enter user ID or email'}
										value={config.userId || config.email || ''}
										disabled
									/>
								</FormGroup>
							</FormGrid>

							{loginHintToken && (
								<div style={{ marginTop: '1rem' }}>
									<HelperText>Login Hint Token Generated:</HelperText>
									<ResultDisplay>{loginHintToken}</ResultDisplay>
								</div>
							)}

							{apiResults.loginHintToken && (
								<ResultDisplay>{JSON.stringify(apiResults.loginHintToken, null, 2)}</ResultDisplay>
							)}

							{errors.loginHintToken && (
								<div style={{ color: '#dc2626', marginTop: '0.5rem' }}>{errors.loginHintToken}</div>
							)}
						</StepContent>
					</StepCard>
				);

			case 5:
				return (
					<StepCard>
						<StepTitle>
							<FiSmartphone />
							{step.title}
						</StepTitle>
						<StepContent>
							<p>Initiate the MFA-only authentication flow using the login hint token.</p>

							{loginHintToken && (
								<div style={{ marginBottom: '1rem' }}>
									<HelperText>Using Login Hint Token:</HelperText>
									<ResultDisplay>{loginHintToken}</ResultDisplay>
								</div>
							)}

							{flowId && (
								<div style={{ marginBottom: '1rem' }}>
									<HelperText>Flow ID:</HelperText>
									<ResultDisplay>{flowId}</ResultDisplay>
								</div>
							)}

							{apiResults.initiateAuth && (
								<ResultDisplay>{JSON.stringify(apiResults.initiateAuth, null, 2)}</ResultDisplay>
							)}

							{errors.initiateAuth && (
								<div style={{ color: '#dc2626', marginTop: '0.5rem' }}>{errors.initiateAuth}</div>
							)}

							<div
								style={{
									marginTop: '1rem',
									padding: '1rem',
									background: '#fef3c7',
									borderRadius: '0.5rem',
									border: '1px solid #f59e0b',
								}}
							>
								<strong>Next:</strong> Check your SMS messages for the OTP code, then proceed to
								complete the authentication.
							</div>
						</StepContent>
					</StepCard>
				);

			case 6:
				return (
					<StepCard>
						<StepTitle>
							<FiCheckCircle />
							{step.title}
						</StepTitle>
						<StepContent>
							<p>Complete the MFA authentication by entering the OTP code received via SMS.</p>

							<FormGrid>
								<FormGroup>
									<FormLabel>OTP Code</FormLabel>
									<FormInput
										type="text"
										placeholder="Enter 6-digit code"
										value={otpCode}
										onChange={(e) => setOtpCode(e.target.value)}
										maxLength={6}
									/>
								</FormGroup>
							</FormGrid>

							{tokens && (
								<div style={{ marginTop: '1rem' }}>
									<HelperText>Authentication Successful!</HelperText>
									<ResultDisplay>{JSON.stringify(tokens, null, 2)}</ResultDisplay>
								</div>
							)}

							{apiResults.completeMFA && (
								<ResultDisplay>
									{JSON.stringify(
										{
											mfaCompletion: apiResults.completeMFA,
											flowResume: apiResults.resumeFlow,
											tokenExchange: apiResults.exchangeToken,
										},
										null,
										2
									)}
								</ResultDisplay>
							)}

							{errors.completeMFA && (
								<div style={{ color: '#dc2626', marginTop: '0.5rem' }}>{errors.completeMFA}</div>
							)}
						</StepContent>
					</StepCard>
				);

			default:
				return null;
		}
	};

	return (
		<Container>
			<ContentWrapper>
				<MainCard>
					<FlowHeader>
						<div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
							<FiSmartphone size={32} />
							<div>
								<h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>
									MFA-Only Flow Using Login Hint Token
								</h1>
								<p style={{ margin: '0.25rem 0 0 0', opacity: 0.9, fontSize: '0.95rem' }}>
									PingOne Workflow Library Implementation
								</p>
							</div>
						</div>
					</FlowHeader>

					<FlowContent>
						{/* Step Progress */}
						<div style={{ marginBottom: '2rem' }}>
							<div
								style={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
									marginBottom: '1rem',
								}}
							>
								{FLOW_STEPS.map((step, index) => (
									<div
										key={step.id}
										style={{
											display: 'flex',
											flexDirection: 'column',
											alignItems: 'center',
											flex: 1,
											position: 'relative',
										}}
									>
										<div
											style={{
												width: '40px',
												height: '40px',
												borderRadius: '50%',
												background:
													currentStep > step.id
														? '#10b981'
														: currentStep === step.id
															? '#f97316'
															: '#e5e7eb',
												color: currentStep >= step.id ? 'white' : '#6b7280',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												fontWeight: '600',
												marginBottom: '0.5rem',
											}}
										>
											{currentStep > step.id ? '✓' : step.id}
										</div>
										<div
											style={{
												fontSize: '0.75rem',
												textAlign: 'center',
												color: currentStep >= step.id ? '#374151' : '#9ca3af',
												maxWidth: '80px',
											}}
										>
											{step.title}
										</div>
										{index < FLOW_STEPS.length - 1 && (
											<div
												style={{
													position: 'absolute',
													top: '20px',
													left: '50%',
													width: '100%',
													height: '2px',
													background: currentStep > step.id ? '#10b981' : '#e5e7eb',
													zIndex: -1,
												}}
											/>
										)}
									</div>
								))}
							</div>
						</div>

						{/* Configuration Section */}
						<CollapsibleHeader
							title="Configuration"
							subtitle="MFA Login Hint Flow Configuration"
							defaultCollapsed={false}
						>
							<StepCard>
								<FormGrid>
									<FormGroup>
										<FormLabel>Environment ID</FormLabel>
										<FormInput
											type="text"
											placeholder="Enter PingOne Environment ID"
											value={config.environmentId}
											onChange={(e) =>
												setConfig((prev) => ({ ...prev, environmentId: e.target.value }))
											}
										/>
									</FormGroup>
									<FormGroup>
										<FormLabel>Client ID</FormLabel>
										<FormInput
											type="text"
											placeholder="Enter Application Client ID"
											value={config.clientId}
											onChange={(e) => setConfig((prev) => ({ ...prev, clientId: e.target.value }))}
										/>
									</FormGroup>
									<FormGroup>
										<FormLabel>Client Secret</FormLabel>
										<FormInput
											type="password"
											placeholder="Enter Application Client Secret"
											value={config.clientSecret}
											onChange={(e) =>
												setConfig((prev) => ({ ...prev, clientSecret: e.target.value }))
											}
										/>
									</FormGroup>
								</FormGrid>
							</StepCard>
						</CollapsibleHeader>

						{/* Current Step Content */}
						{renderStepContent()}

						{/* Navigation Buttons */}
						<StepNavigationButtons
							currentStep={currentStep}
							totalSteps={FLOW_STEPS.length}
							onNext={nextStep}
							onPrevious={prevStep}
							onReset={resetFlow}
							isNextDisabled={isProcessing}
							nextLabel={currentStep === FLOW_STEPS.length ? 'Complete Flow' : 'Next Step'}
							showReset={true}
						/>

						{isProcessing && (
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '0.5rem',
									marginTop: '1rem',
									color: '#f97316',
								}}
							>
								<LoadingSpinner />
								Processing...
							</div>
						)}
					</FlowContent>
				</MainCard>
			</ContentWrapper>
		</Container>
	);
};

export default MFALoginHintFlowV7;
