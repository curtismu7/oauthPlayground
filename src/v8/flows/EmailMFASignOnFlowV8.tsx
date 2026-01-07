/**
 * @file EmailMFASignOnFlowV8.tsx
 * @module v8/flows
 * @description Email MFA Sign-On Flow - Complete workflow implementation
 * @version 8.0.0
 *
 * This flow demonstrates how to:
 * 1. Create an application
 * 2. Create a sign-on policy with Email MFA action
 * 3. Create a user and enable MFA
 * 4. Register an Email device
 * 5. Initiate authorization and complete MFA flow
 * 6. Exchange authorization code for tokens
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
	FiAlertCircle,
	FiBook,
	FiCheckCircle,
	FiKey,
	FiLoader,
	FiMail,
	FiPackage,
	FiSend,
	FiSettings,
	FiShield,
	FiUser,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { usePageScroll } from '@/hooks/usePageScroll';
import { MFAHeaderV8 } from '@/v8/components/MFAHeaderV8';
import { MFANavigationV8 } from '@/v8/components/MFANavigationV8';
import { CredentialsServiceV8 } from '@/v8/services/credentialsServiceV8';
import { EmailMFASignOnFlowServiceV8 } from '@/v8/services/emailMfaSignOnFlowServiceV8';
import { workerTokenServiceV8 } from '@/v8/services/workerTokenServiceV8';
import { WorkerTokenStatusServiceV8 } from '@/v8/services/workerTokenStatusServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

const MODULE_TAG = '[📧 EMAIL-MFA-SIGNON-FLOW-V8]';

// Styled Components
const Container = styled.div`
	max-width: 1200px;
	margin: 0 auto;
	padding: 2rem;
`;

const StepSection = styled.div`
	background: white;
	border-radius: 0.75rem;
	padding: 1.5rem;
	margin-bottom: 1.5rem;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const StepHeader = styled.div<{ $theme?: string }>`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 1rem;
	background: ${(props) => {
		switch (props.$theme) {
			case 'orange':
				return 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)';
			case 'blue':
				return 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
			case 'yellow':
				return 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)';
			case 'green':
				return 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
			default:
				return 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)';
		}
	}};
	border-radius: 0.5rem;
	margin-bottom: 1rem;
	color: white;
`;

const StepTitle = styled.h3`
	margin: 0;
	font-size: 1.125rem;
	font-weight: 600;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const StepStatus = styled.div<{ $status: 'pending' | 'success' | 'error' | 'loading' }>`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 0.875rem;
	font-weight: 500;
	
	${(props) => {
		switch (props.$status) {
			case 'success':
				return 'color: #10b981;';
			case 'error':
				return 'color: #ef4444;';
			case 'loading':
				return 'color: #fbbf24;';
			default:
				return 'color: rgba(255, 255, 255, 0.8);';
		}
	}}
`;

const StepContent = styled.div`
	padding: 1rem 0;
`;

const FormGroup = styled.div`
	margin-bottom: 1rem;
`;

const Label = styled.label`
	display: block;
	margin-bottom: 0.5rem;
	font-weight: 500;
	color: #374151;
	font-size: 0.875rem;
`;

const Input = styled.input`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 0.375rem;
	font-size: 0.875rem;
	
	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'success' | 'danger' }>`
	padding: 0.75rem 1.5rem;
	border: none;
	border-radius: 0.375rem;
	font-size: 0.875rem;
	font-weight: 500;
	cursor: pointer;
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	transition: all 0.2s;
	
	${(props) => {
		switch (props.$variant) {
			case 'primary':
				return `
					background: #3b82f6;
					color: white;
					&:hover:not(:disabled) { background: #2563eb; }
				`;
			case 'success':
				return `
					background: #10b981;
					color: white;
					&:hover:not(:disabled) { background: #059669; }
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
					&:hover:not(:disabled) { background: #e5e7eb; }
				`;
		}
	}}
	
	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

const ResultBox = styled.div<{ $success?: boolean }>`
	padding: 1rem;
	background: ${(props) => (props.$success ? '#f0fdf4' : '#fef2f2')};
	border: 1px solid ${(props) => (props.$success ? '#bbf7d0' : '#fecaca')};
	border-radius: 0.375rem;
	margin-top: 1rem;
	font-size: 0.875rem;
	color: ${(props) => (props.$success ? '#166534' : '#991b1b')};
`;

const CodeBlock = styled.pre`
	background: #1f2937;
	color: #f9fafb;
	padding: 1rem;
	border-radius: 0.375rem;
	font-size: 0.75rem;
	overflow-x: auto;
	margin: 1rem 0;
`;

const BreadcrumbContainer = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	flex-wrap: wrap;
	padding: 16px;
	background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
	border-radius: 12px;
	border: 1px solid rgba(102, 126, 234, 0.2);
	margin-bottom: 24px;
`;

const BreadcrumbItem = styled.div<{ $isActive?: boolean; $isCompleted?: boolean }>`
	display: flex;
	align-items: center;
	gap: 8px;
	
	.breadcrumb-text {
		padding: 8px 16px;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 500;
		transition: all 0.2s;
		
		${(props) => {
			if (props.$isActive) {
				return `
					background: linear-gradient(135deg, #10b981 0%, #059669 100%);
					color: white;
					font-weight: 600;
					box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
				`;
			} else if (props.$isCompleted) {
				return `
					background: #d1fae5;
					color: #065f46;
					font-weight: 500;
				`;
			} else {
				return `
					background: white;
					color: #6b7280;
				`;
			}
		}}
	}
	
	.breadcrumb-arrow {
		color: #9ca3af;
		font-weight: 600;
		margin: 0 4px;
	}
`;

const SuccessScreen = styled.div`
	text-align: center;
	padding: 3rem 2rem;
	background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
	border-radius: 0.75rem;
	border: 2px solid #10b981;
	margin: 2rem 0;
`;

const SuccessIcon = styled.div`
	width: 80px;
	height: 80px;
	background: #10b981;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	margin: 0 auto 1.5rem;
	box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
	
	svg {
		color: white;
		font-size: 2.5rem;
	}
`;

const SuccessTitle = styled.h2`
	margin: 0 0 0.5rem 0;
	color: #065f46;
	font-size: 1.5rem;
	font-weight: 700;
`;

const SuccessMessage = styled.p`
	margin: 0 0 1.5rem 0;
	color: #047857;
	font-size: 1rem;
	line-height: 1.6;
`;

const DeviceInfoBox = styled.div`
	background: white;
	border: 1px solid #bbf7d0;
	border-radius: 0.5rem;
	padding: 1rem;
	margin: 1.5rem auto;
	max-width: 500px;
	text-align: left;
`;

const DeviceInfoRow = styled.div`
	display: flex;
	justify-content: space-between;
	padding: 0.5rem 0;
	border-bottom: 1px solid #d1fae5;
	
	&:last-child {
		border-bottom: none;
	}
	
	strong {
		color: #065f46;
		font-weight: 600;
	}
	
	span {
		color: #047857;
		font-family: monospace;
		font-size: 0.875rem;
	}
`;

interface StepState {
	status: 'pending' | 'success' | 'error' | 'loading';
	result?: Record<string, unknown>;
	error?: string;
}

export const EmailMFASignOnFlowV8: React.FC = () => {
	const navigate = useNavigate();
	usePageScroll({ pageName: 'Email MFA Sign-On Flow V8', force: true });

	// Credentials state
	const [environmentId, setEnvironmentId] = useState('');
	const [workerToken, setWorkerToken] = useState('');

	// Current step tracking
	const [currentStep, setCurrentStep] = useState(0);
	const [completedSteps, setCompletedSteps] = useState<number[]>([]);

	// Step states
	const [stepStates, setStepStates] = useState<Record<number, StepState>>({
		0: { status: 'pending' },
		1: { status: 'pending' },
		2: { status: 'pending' },
		3: { status: 'pending' },
		4: { status: 'pending' },
		5: { status: 'pending' },
		6: { status: 'pending' },
	});

	// Step labels for breadcrumbs
	const stepLabels = [
		'Create Application',
		'Create Sign-On Policy',
		'Create User & Enable MFA',
		'Register Email Device',
		'Initiate Authorization',
		'Complete MFA',
		'Exchange Code for Token',
	];

	// Application data
	const [applicationData, setApplicationData] = useState<Record<string, unknown>>({});
	const [resourceData, setResourceData] = useState<Record<string, unknown>>({});
	const [signOnPolicyData, setSignOnPolicyData] = useState<Record<string, unknown>>({});
	const [populationData, setPopulationData] = useState<Record<string, unknown>>({});
	const [userData, setUserData] = useState<Record<string, unknown>>({});
	const [deviceAuthPolicyData, setDeviceAuthPolicyData] = useState<Record<string, unknown>>({});
	const [deviceData, setDeviceData] = useState<Record<string, unknown>>({});
	const [flowData, setFlowData] = useState<Record<string, unknown>>({});
	const [tokenData, setTokenData] = useState<Record<string, unknown>>({});

	// Form inputs
	const [appName, setAppName] = useState('Email MFA Test App');
	const [redirectUri, setRedirectUri] = useState('https://localhost:3000/callback');
	const [username, setUsername] = useState('testuser');
	const [userEmail, setUserEmail] = useState('testuser@example.com');
	const [password, setPassword] = useState('TempPassword123!');
	const [deviceEmail, setDeviceEmail] = useState('testuser@example.com');
	const [otpCode, setOtpCode] = useState('');

	// Load credentials on mount
	useEffect(() => {
		const loadCredentials = async () => {
			try {
				// Try to load environment ID from shared credentials or other flows
				try {
					const config = CredentialsServiceV8.getFlowConfig('oauth-authz-v8') || {
						flowKey: 'oauth-authz-v8',
						flowType: 'oauth' as const,
						includeClientSecret: true,
						includeRedirectUri: true,
						includeLogoutUri: false,
						includeScopes: true,
					};
					const creds = CredentialsServiceV8.loadCredentials('oauth-authz-v8', config);
					if (creds?.environmentId) {
						setEnvironmentId(creds.environmentId);
					}
				} catch {
					// If that fails, try to get from localStorage directly
					try {
						const stored = localStorage.getItem('v8:credentials');
						if (stored) {
							const data = JSON.parse(stored);
							if (data.environmentId) {
								setEnvironmentId(data.environmentId);
							}
						}
					} catch {
						// Ignore errors
					}
				}

				const token = await workerTokenServiceV8.getToken();
				if (token) {
					setWorkerToken(token);
				}
			} catch (error) {
				console.error(`${MODULE_TAG} Error loading credentials:`, error);
			}
		};
		loadCredentials();
	}, []);

	// Check worker token status
	useEffect(() => {
		if (workerToken) {
			const status = WorkerTokenStatusServiceV8.checkWorkerTokenStatus(workerToken);
			if (!status.isValid) {
				toastV8.warning('Worker token is expired or invalid. Please generate a new token.');
			}
		}
	}, [workerToken]);

	// Update step state helper
	const updateStepState = useCallback((step: number, updates: Partial<StepState>) => {
		setStepStates((prev) => ({
			...prev,
			[step]: { ...prev[step], ...updates },
		}));

		// Mark step as completed if successful
		if (updates.status === 'success') {
			setCompletedSteps((prev) => {
				if (!prev.includes(step)) {
					return [...prev, step];
				}
				return prev;
			});
		}
	}, []);

	// Step 0: Create Application with Resource Grants
	const handleStep0 = useCallback(async () => {
		if (!environmentId) {
			toastV8.error('Please configure Environment ID first');
			return;
		}

		updateStepState(0, { status: 'loading' });

		try {
			// Create application
			const appResult = await EmailMFASignOnFlowServiceV8.createApplication({
				environmentId,
				name: appName,
				description: 'Email MFA Sign-On Test Application',
				type: 'OIDC_WEB_APP',
				redirectUris: [redirectUri],
				grantTypes: ['authorization_code'],
				responseTypes: ['code'],
				tokenEndpointAuthMethod: 'client_secret_basic',
			});

			setApplicationData(appResult);

			// Get resources
			const resourcesResult = await EmailMFASignOnFlowServiceV8.getResources(environmentId);
			setResourceData(resourcesResult);

			// Get first resource and its scopes
			const resources = (resourcesResult as { _embedded?: { resources?: Array<{ id: string }> } })
				?._embedded?.resources;
			if (resources && resources.length > 0) {
				const resourceId = resources[0].id;
				const scopesResult = await EmailMFASignOnFlowServiceV8.getResourceScopes(
					environmentId,
					resourceId
				);

				// Get scope names
				const scopes = (scopesResult as { _embedded?: { scopes?: Array<{ name: string }> } })
					?._embedded?.scopes;
				const scopeNames = scopes?.map((s) => s.name) || [];

				// Create resource grant
				await EmailMFASignOnFlowServiceV8.createResourceGrant(
					environmentId,
					appResult.id as string,
					resourceId,
					scopeNames
				);
			}

			updateStepState(0, { status: 'success', result: appResult });
			toastV8.success('Application created successfully');
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to create application';
			updateStepState(0, { status: 'error', error: errorMessage });
			toastV8.error(errorMessage);
		}
	}, [environmentId, appName, redirectUri, updateStepState]);

	// Step 1: Create Sign-On Policy with Email MFA Action
	const handleStep1 = useCallback(async () => {
		if (!environmentId || !applicationData.id) {
			toastV8.error('Please complete Step 0 first');
			return;
		}

		updateStepState(1, { status: 'loading' });

		try {
			// Create sign-on policy
			const policyResult = await EmailMFASignOnFlowServiceV8.createSignOnPolicy({
				environmentId,
				name: 'Email MFA Sign-On Policy',
				description: 'Policy for Email MFA authentication',
				default: false,
			});

			setSignOnPolicyData(policyResult);

			// Create Email MFA action
			await EmailMFASignOnFlowServiceV8.createEmailMFAAction({
				environmentId,
				signOnPolicyId: policyResult.id as string,
				priority: 1,
				configuration: {
					attempts: 3,
					resendInterval: 60,
				},
			});

			// Assign policy to application
			await EmailMFASignOnFlowServiceV8.assignSignOnPolicy(
				environmentId,
				applicationData.id as string,
				policyResult.id as string
			);

			updateStepState(1, { status: 'success', result: policyResult });
			setCurrentStep(2);
			toastV8.success('Sign-on policy created and assigned successfully');
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Failed to create sign-on policy';
			updateStepState(1, { status: 'error', error: errorMessage });
			toastV8.error(errorMessage);
		}
	}, [environmentId, applicationData, updateStepState]);

	// Step 2: Create User and Enable MFA
	const handleStep2 = useCallback(async () => {
		if (!environmentId) {
			toastV8.error('Please configure Environment ID first');
			return;
		}

		updateStepState(2, { status: 'loading' });

		try {
			// Create population
			const populationResult = await EmailMFASignOnFlowServiceV8.createPopulation(
				environmentId,
				'Email MFA Test Population',
				'Population for Email MFA testing'
			);

			setPopulationData(populationResult);

			// Create user
			const userResult = await EmailMFASignOnFlowServiceV8.createUser({
				environmentId,
				populationId: populationResult.id as string,
				username,
				email: userEmail,
				givenName: 'Test',
				familyName: 'User',
			});

			setUserData(userResult);

			// Set password
			await EmailMFASignOnFlowServiceV8.setUserPassword(
				environmentId,
				userResult.id as string,
				password,
				false
			);

			// Enable MFA
			await EmailMFASignOnFlowServiceV8.enableMFAForUser(environmentId, userResult.id as string);

			updateStepState(2, { status: 'success', result: userResult });
			setCurrentStep(3);
			toastV8.success('User created and MFA enabled successfully');
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to create user';
			updateStepState(2, { status: 'error', error: errorMessage });
			toastV8.error(errorMessage);
		}
	}, [environmentId, username, userEmail, password, updateStepState]);

	// Step 3: Create Device Authentication Policy and Register Email Device
	const handleStep3 = useCallback(async () => {
		if (!environmentId || !userData.id) {
			toastV8.error('Please complete Step 2 first');
			return;
		}

		updateStepState(3, { status: 'loading' });

		try {
			// Create device authentication policy
			const policyResult = await EmailMFASignOnFlowServiceV8.createDeviceAuthPolicy({
				environmentId,
				name: 'Email MFA Device Auth Policy',
				description: 'Device authentication policy for Email MFA',
				rememberDevice: true,
				rememberDeviceForSeconds: 86400,
			});

			setDeviceAuthPolicyData(policyResult);

			// Register email device
			const deviceResult = await EmailMFASignOnFlowServiceV8.registerEmailDevice({
				environmentId,
				userId: userData.id as string,
				email: deviceEmail,
				name: 'Email MFA Device',
				nickname: 'Email Device',
				status: 'ACTIVE',
			});

			setDeviceData(deviceResult);

			updateStepState(3, { status: 'success', result: deviceResult });
			setCurrentStep(4);
			toastV8.success(
				'Email device registered successfully! Device is ready to use (ACTIVE status).'
			);
		} catch (error) {
			const errorMessage =
				error instanceof Error
					? error.message
					: 'Failed to create device policy or register device';
			updateStepState(3, { status: 'error', error: errorMessage });
			toastV8.error(errorMessage);
		}
	}, [environmentId, userData, deviceEmail, updateStepState]);

	// Step 4: Initiate Authorization Request and Flow APIs
	const handleStep4 = useCallback(async () => {
		if (!environmentId || !applicationData.clientId) {
			toastV8.error('Please complete Step 0 first');
			return;
		}

		updateStepState(4, { status: 'loading' });

		try {
			// Initiate authorization
			const authResult = await EmailMFASignOnFlowServiceV8.initiateAuthorization(
				environmentId,
				applicationData.clientId as string,
				redirectUri,
				'code',
				'openid profile email',
				undefined,
				undefined,
				undefined
			);

			setFlowData(authResult);

			// Get flow status
			const flowId =
				(authResult as { flowId?: string })?.flowId || (authResult as { id?: string })?.id;
			if (flowId) {
				const cookies = (authResult as { cookies?: string[] })?.cookies || [];
				const flowStatus = await EmailMFASignOnFlowServiceV8.getFlowStatus(
					environmentId,
					flowId,
					cookies
				);
				setFlowData((prev) => ({ ...prev, ...flowStatus }));
			}

			updateStepState(4, { status: 'success', result: authResult });
			setCurrentStep(5);
			toastV8.success('Authorization initiated successfully');
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Failed to initiate authorization';
			updateStepState(4, { status: 'error', error: errorMessage });
			toastV8.error(errorMessage);
		}
	}, [environmentId, applicationData, redirectUri, updateStepState]);

	// Step 5: Complete MFA Action (User Lookup + OTP Validation)
	const handleStep5 = useCallback(async () => {
		if (!environmentId || (!flowData.id && !flowData.flowId)) {
			toastV8.error('Please complete Step 4 first');
			return;
		}

		updateStepState(5, { status: 'loading' });

		try {
			const flowId = (flowData.flowId as string) || (flowData.id as string);
			const cookies = (flowData.cookies as string[]) || [];

			// Complete user lookup
			const lookupResult = await EmailMFASignOnFlowServiceV8.completeFlowAction({
				environmentId,
				flowId,
				action: 'usernamePassword.check',
				data: {
					username,
					password,
				},
				cookies,
			});

			setFlowData((prev) => ({ ...prev, ...lookupResult }));

			// If OTP is required, complete OTP check
			if (otpCode) {
				const otpResult = await EmailMFASignOnFlowServiceV8.completeFlowAction({
					environmentId,
					flowId,
					action: 'otp.check',
					data: {
						otp: otpCode,
					},
					cookies,
				});

				setFlowData((prev) => ({ ...prev, ...otpResult }));
			}

			updateStepState(5, { status: 'success', result: lookupResult });
			setCurrentStep(6);
			toastV8.success('MFA action completed successfully');
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to complete MFA action';
			updateStepState(5, { status: 'error', error: errorMessage });
			toastV8.error(errorMessage);
		}
	}, [environmentId, flowData, username, password, otpCode, updateStepState]);

	// Step 6: Resume Flow and Exchange Auth Code for Token
	const handleStep6 = useCallback(async () => {
		if (!environmentId || (!flowData.id && !flowData.flowId)) {
			toastV8.error('Please complete Step 5 first');
			return;
		}

		updateStepState(6, { status: 'loading' });

		try {
			const flowId = (flowData.flowId as string) || (flowData.id as string);

			// Resume flow
			const resumeResult = await EmailMFASignOnFlowServiceV8.resumeFlow({
				environmentId,
				flowId,
			});

			const authCode =
				(resumeResult as { code?: string })?.code ||
				(resumeResult as { authorizationCode?: string })?.authorizationCode;

			if (!authCode) {
				throw new Error('No authorization code received from resume flow');
			}

			// Get application secret
			const secretResult = await EmailMFASignOnFlowServiceV8.getApplicationSecret(
				environmentId,
				applicationData.id as string
			);

			const clientSecret = (secretResult as { secret?: string })?.secret;

			if (!clientSecret) {
				throw new Error('Failed to get application secret');
			}

			// Exchange code for token
			const tokenResult = await EmailMFASignOnFlowServiceV8.exchangeCodeForToken(
				environmentId,
				authCode,
				applicationData.clientId as string,
				clientSecret,
				redirectUri
			);

			setTokenData(tokenResult);

			updateStepState(6, { status: 'success', result: tokenResult });
			toastV8.success('Authorization code exchanged for token successfully');
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Failed to resume flow or exchange code';
			updateStepState(6, { status: 'error', error: errorMessage });
			toastV8.error(errorMessage);
		}
	}, [environmentId, flowData, applicationData, redirectUri, updateStepState]);

	const renderStepStatus = (step: number) => {
		const state = stepStates[step] || { status: 'pending' };
		switch (state.status) {
			case 'success':
				return (
					<StepStatus $status="success">
						<FiCheckCircle /> Completed
					</StepStatus>
				);
			case 'error':
				return (
					<StepStatus $status="error">
						<FiAlertCircle /> Error
					</StepStatus>
				);
			case 'loading':
				return (
					<StepStatus $status="loading">
						<FiLoader /> Processing...
					</StepStatus>
				);
			default:
				return <StepStatus $status="pending">Pending</StepStatus>;
		}
	};

	return (
		<div className="email-mfa-signon-flow-v8">
			<MFAHeaderV8
				title="Email MFA Sign-On Flow"
				description="Complete workflow for Email MFA authentication with sign-on policies"
				versionTag="V8"
				currentPage="hub"
				showBackToMain={true}
			/>

			<Container>
				{/* Breadcrumb Navigation */}
				<BreadcrumbContainer>
					{stepLabels.map((label, idx) => (
						<BreadcrumbItem
							key={idx}
							$isActive={idx === currentStep}
							$isCompleted={completedSteps.includes(idx)}
						>
							<span className="breadcrumb-text">{label}</span>
							{idx < stepLabels.length - 1 && <span className="breadcrumb-arrow">→</span>}
						</BreadcrumbItem>
					))}
				</BreadcrumbContainer>

				{/* Success Screen for Step 3 (Device Registration) */}
				{stepStates[3]?.status === 'success' && stepStates[3]?.result && (
					<SuccessScreen>
						<SuccessIcon>
							<FiCheckCircle />
						</SuccessIcon>
						<SuccessTitle>Email Device Registered Successfully!</SuccessTitle>
						<SuccessMessage>
							Your email device has been registered and is ready to use (ACTIVE status).
						</SuccessMessage>
						<DeviceInfoBox>
							<DeviceInfoRow>
								<strong>Device ID:</strong>
								<span>
									{(stepStates[3].result as { id?: string; deviceId?: string })?.id ||
										(stepStates[3].result as { id?: string; deviceId?: string })?.deviceId ||
										'N/A'}
								</span>
							</DeviceInfoRow>
							<DeviceInfoRow>
								<strong>Device Type:</strong>
								<span>EMAIL</span>
							</DeviceInfoRow>
							<DeviceInfoRow>
								<strong>Email:</strong>
								<span>{deviceEmail}</span>
							</DeviceInfoRow>
							<DeviceInfoRow>
								<strong>Status:</strong>
								<span style={{ color: '#10b981', fontWeight: 600 }}>
									{(stepStates[3].result as { status?: string })?.status || 'ACTIVE'}
								</span>
							</DeviceInfoRow>
						</DeviceInfoBox>
					</SuccessScreen>
				)}

				{/* Step 0: Create Application */}
				<StepSection>
					<StepHeader $theme="orange">
						<StepTitle>
							<FiSettings /> Step 0: Create Application with Resource Grants
						</StepTitle>
						{renderStepStatus(0)}
					</StepHeader>
					<StepContent>
						<FormGroup>
							<Label>Environment ID</Label>
							<Input
								type="text"
								value={environmentId}
								onChange={(e) => setEnvironmentId(e.target.value)}
								placeholder="Enter Environment ID"
							/>
						</FormGroup>
						<FormGroup>
							<Label>Application Name</Label>
							<Input type="text" value={appName} onChange={(e) => setAppName(e.target.value)} />
						</FormGroup>
						<FormGroup>
							<Label>Redirect URI</Label>
							<Input
								type="text"
								value={redirectUri}
								onChange={(e) => setRedirectUri(e.target.value)}
							/>
						</FormGroup>
						<Button
							$variant="primary"
							onClick={handleStep0}
							disabled={stepStates[0]?.status === 'loading'}
						>
							Create Application
						</Button>
						{stepStates[0]?.result && (
							<ResultBox $success={true}>
								<strong>Application Created:</strong>
								<CodeBlock>{JSON.stringify(stepStates[0].result, null, 2)}</CodeBlock>
							</ResultBox>
						)}
					</StepContent>
				</StepSection>

				{/* Step 1: Create Sign-On Policy */}
				<StepSection>
					<StepHeader $theme="blue">
						<StepTitle>
							<FiSend /> Step 1: Create Sign-On Policy with Email MFA Action
						</StepTitle>
						{renderStepStatus(1)}
					</StepHeader>
					<StepContent>
						<Button
							$variant="primary"
							onClick={handleStep1}
							disabled={stepStates[1]?.status === 'loading'}
						>
							Create Sign-On Policy
						</Button>
						{stepStates[1]?.result && (
							<ResultBox $success={true}>
								<strong>Sign-On Policy Created:</strong>
								<CodeBlock>{JSON.stringify(stepStates[1].result, null, 2)}</CodeBlock>
							</ResultBox>
						)}
					</StepContent>
				</StepSection>

				{/* Step 2: Create User and Enable MFA */}
				<StepSection>
					<StepHeader $theme="yellow">
						<StepTitle>
							<FiUser /> Step 2: Create User and Enable MFA
						</StepTitle>
						{renderStepStatus(2)}
					</StepHeader>
					<StepContent>
						<FormGroup>
							<Label>Username</Label>
							<Input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
						</FormGroup>
						<FormGroup>
							<Label>Email</Label>
							<Input
								type="email"
								value={userEmail}
								onChange={(e) => setUserEmail(e.target.value)}
							/>
						</FormGroup>
						<FormGroup>
							<Label>Password</Label>
							<Input
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
							/>
						</FormGroup>
						<Button
							$variant="primary"
							onClick={handleStep2}
							disabled={stepStates[2]?.status === 'loading'}
						>
							Create User and Enable MFA
						</Button>
						{stepStates[2]?.result && (
							<ResultBox $success={true}>
								<strong>User Created:</strong>
								<CodeBlock>{JSON.stringify(stepStates[2].result, null, 2)}</CodeBlock>
							</ResultBox>
						)}
					</StepContent>
				</StepSection>

				{/* Step 3: Create Device Auth Policy and Register Email Device */}
				<StepSection>
					<StepHeader $theme="green">
						<StepTitle>
							<FiShield /> Step 3: Create Device Auth Policy and Register Email Device
						</StepTitle>
						{renderStepStatus(3)}
					</StepHeader>
					<StepContent>
						<FormGroup>
							<Label>Device Email</Label>
							<Input
								type="email"
								value={deviceEmail}
								onChange={(e) => setDeviceEmail(e.target.value)}
							/>
						</FormGroup>
						<Button
							$variant="primary"
							onClick={handleStep3}
							disabled={stepStates[3]?.status === 'loading'}
						>
							Create Policy and Register Device
						</Button>
						{stepStates[3]?.result && (
							<ResultBox $success={true}>
								<strong>Device Registered:</strong>
								<CodeBlock>{JSON.stringify(stepStates[3].result, null, 2)}</CodeBlock>
							</ResultBox>
						)}
					</StepContent>
				</StepSection>

				{/* Step 4: Initiate Authorization */}
				<StepSection>
					<StepHeader $theme="blue">
						<StepTitle>
							<FiKey /> Step 4: Initiate Authorization Request
						</StepTitle>
						{renderStepStatus(4)}
					</StepHeader>
					<StepContent>
						<Button
							$variant="primary"
							onClick={handleStep4}
							disabled={stepStates[4]?.status === 'loading'}
						>
							Initiate Authorization
						</Button>
						{stepStates[4]?.result && (
							<ResultBox $success={true}>
								<strong>Authorization Initiated:</strong>
								<CodeBlock>{JSON.stringify(stepStates[4].result, null, 2)}</CodeBlock>
							</ResultBox>
						)}
					</StepContent>
				</StepSection>

				{/* Step 5: Complete MFA Action */}
				<StepSection>
					<StepHeader $theme="yellow">
						<StepTitle>
							<FiMail /> Step 5: Complete MFA Action (User Lookup + OTP)
						</StepTitle>
						{renderStepStatus(5)}
					</StepHeader>
					<StepContent>
						<FormGroup>
							<Label>OTP Code (if required)</Label>
							<Input
								type="text"
								value={otpCode}
								onChange={(e) => setOtpCode(e.target.value)}
								placeholder="Enter OTP code from email"
							/>
						</FormGroup>
						<Button
							$variant="primary"
							onClick={handleStep5}
							disabled={stepStates[5]?.status === 'loading'}
						>
							Complete MFA Action
						</Button>
						{stepStates[5]?.result && (
							<ResultBox $success={true}>
								<strong>MFA Action Completed:</strong>
								<CodeBlock>{JSON.stringify(stepStates[5].result, null, 2)}</CodeBlock>
							</ResultBox>
						)}
					</StepContent>
				</StepSection>

				{/* Step 6: Resume Flow and Exchange Code */}
				<StepSection>
					<StepHeader $theme="green">
						<StepTitle>
							<FiPackage /> Step 6: Resume Flow and Exchange Code for Token
						</StepTitle>
						{renderStepStatus(6)}
					</StepHeader>
					<StepContent>
						<Button
							$variant="primary"
							onClick={handleStep6}
							disabled={stepStates[6]?.status === 'loading'}
						>
							Resume Flow and Exchange Code
						</Button>
						{stepStates[6]?.result && (
							<ResultBox $success={true}>
								<strong>Token Received:</strong>
								<CodeBlock>{JSON.stringify(stepStates[6].result, null, 2)}</CodeBlock>
							</ResultBox>
						)}
					</StepContent>
				</StepSection>
			</Container>
		</div>
	);
};
