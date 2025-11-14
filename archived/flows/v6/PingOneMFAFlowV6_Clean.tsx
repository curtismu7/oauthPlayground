// src/pages/flows/PingOneMFAFlowV6_Clean.tsx
// Real PingOne MFA Flow V6 with worker token and actual API integration

import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { EnhancedApiCallDisplay } from '../../components/EnhancedApiCallDisplay';
import EnhancedFlowInfoCard from '../../components/EnhancedFlowInfoCard';
import { StepNavigationButtons } from '../../components/StepNavigationButtons';
import { usePageScroll } from '../../hooks/usePageScroll';
import {
	FiAlertTriangle,
	FiArrowRight,
	FiBook,
	FiCheckCircle,
	FiCopy,
	FiExternalLink,
	FiEye,
	FiEyeOff,
	FiInfo,
	FiKey,
	FiLock,
	FiMail,
	FiPhone,
	FiRefreshCw,
	FiSettings,
	FiShield,
	FiSmartphone,
	FiUser,
} from '../../services/commonImportsService';
import EducationalContentService from '../../services/educationalContentService.tsx';
import { FlowHeader } from '../../services/flowHeaderService';
import { credentialManager } from '../../utils/credentialManager';
import { v4ToastManager } from '../../utils/v4ToastMessages';

// V6 Styled Components
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
	margin-bottom: 2rem;
`;

const StepHeader = styled.div`
	background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
	color: #ffffff;
	padding: 2rem;
`;

const StepBadge = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	background: rgba(255, 255, 255, 0.2);
	border: 1px solid rgba(255, 255, 255, 0.3);
	border-radius: 999px;
	padding: 0.375rem 0.875rem;
	font-size: 0.75rem;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	margin-bottom: 0.5rem;
`;

const StepTitle = styled.h2`
	margin: 0;
	font-size: 1.5rem;
	font-weight: 700;
	letter-spacing: -0.025em;
`;

const StepSubtitle = styled.p`
	margin: 0.5rem 0 0 0;
	font-size: 1rem;
	opacity: 0.9;
	line-height: 1.5;
`;

const StepContent = styled.div`
	padding: 2rem;
`;

const InfoBox = styled.div<{ variant?: 'info' | 'success' | 'warning' | 'error' }>`
	display: flex;
	align-items: flex-start;
	gap: 1rem;
	padding: 1.5rem;
	border-radius: 0.75rem;
	margin-bottom: 2rem;
	
	${(props) =>
		props.variant === 'info' &&
		`
		background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
		border: 1px solid #3b82f6;
	`}
	
	${(props) =>
		props.variant === 'success' &&
		`
		background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
		border: 1px solid #16a34a;
	`}
	
	${(props) =>
		props.variant === 'warning' &&
		`
		background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%);
		border: 1px solid #eab308;
	`}
	
	${(props) =>
		props.variant === 'error' &&
		`
		background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%);
		border: 1px solid #dc2626;
	`}
`;

const InfoContent = styled.div`
	flex: 1;
`;

const InfoTitle = styled.h4`
	margin: 0 0 0.5rem 0;
	font-size: 1.125rem;
	font-weight: 600;
	color: #111827;
`;

const InfoText = styled.p`
	margin: 0;
	font-size: 0.875rem;
	color: #6b7280;
	line-height: 1.6;
`;

const FormSection = styled.div`
	margin-bottom: 2rem;
`;

const SectionTitle = styled.h3`
	margin: 0 0 1.5rem 0;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 1.125rem;
	font-weight: 600;
	color: #1f2937;
`;

const FormGrid = styled.div`
	display: grid;
	gap: 1.5rem;
`;

const FormGroup = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`;

const FormLabel = styled.label`
	font-weight: 600;
	color: #374151;
	font-size: 0.875rem;
`;

const FormInput = styled.input`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 0.5rem;
	font-size: 1rem;
	
	&:focus {
		outline: none;
		border-color: #16a34a;
		box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
	}
`;

const Select = styled.select`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 0.5rem;
	font-size: 1rem;
	background: white;
	
	&:focus {
		outline: none;
		border-color: #16a34a;
		box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
	}
`;

const PasswordInputContainer = styled.div`
	position: relative;
`;

const PasswordToggle = styled.button`
	position: absolute;
	right: 0.75rem;
	top: 50%;
	transform: translateY(-50%);
	background: none;
	border: none;
	cursor: pointer;
	color: #6b7280;
	
	&:hover {
		color: #374151;
	}
`;

const ActionButton = styled.button<{ variant?: 'primary' | 'secondary' | 'success' | 'danger' }>`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1.5rem;
	border-radius: 0.5rem;
	font-weight: 600;
	border: none;
	cursor: pointer;
	transition: all 0.2s;
	font-size: 0.875rem;
	
	${(props) =>
		props.variant === 'primary' &&
		`
		background: #16a34a;
		color: white;
		&:hover { background: #15803d; }
		&:disabled { background: #9ca3af; cursor: not-allowed; }
	`}
	
	${(props) =>
		props.variant === 'success' &&
		`
		background: #16a34a;
		color: white;
		&:hover { background: #15803d; }
		&:disabled { background: #9ca3af; cursor: not-allowed; }
	`}
	
	${(props) =>
		props.variant === 'secondary' &&
		`
		background: #f3f4f6;
		color: #374151;
		border: 1px solid #d1d5db;
		&:hover { background: #e5e7eb; }
		&:disabled { background: #f9fafb; cursor: not-allowed; }
	`}
	
	${(props) =>
		props.variant === 'danger' &&
		`
		background: #dc2626;
		color: white;
		&:hover { background: #b91c1c; }
		&:disabled { background: #9ca3af; cursor: not-allowed; }
	`}
`;

const CodeBlock = styled.pre`
	background: #1f2937;
	color: #f9fafb;
	padding: 1rem;
	border-radius: 0.5rem;
	overflow-x: auto;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.875rem;
	line-height: 1.5;
	margin: 1rem 0;
`;

const SpinningIcon = styled.div`
	animation: spin 1s linear infinite;
	
	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}
`;

// Types
interface WorkerCredentials {
	environmentId: string;
	clientId: string;
	clientSecret: string;
	scopes: string;
	tokenEndpointAuthMethod: 'client_secret_basic' | 'client_secret_post';
}

interface UserInfo {
	username: string;
	phoneNumber: string;
	emailAddress: string;
}

interface ApiCall {
	id: string;
	method: string;
	url: string;
	headers: Record<string, string>;
	requestBody?: any;
	responseBody?: any;
	timestamp: string;
	duration: number;
	status: number;
}

const STEP_METADATA = [
	{
		title: 'Step 0: Worker Token Setup',
		subtitle: 'Obtain management API token for PingOne MFA operations',
	},
	{
		title: 'Step 1: User Configuration',
		subtitle: 'Configure user information for MFA testing',
	},
	{
		title: 'Step 2: Device Registration',
		subtitle: 'Register MFA device using PingOne Management API',
	},
	{
		title: 'Step 3: MFA Challenge',
		subtitle: 'Initiate MFA challenge and send verification code',
	},
	{
		title: 'Step 4: Code Verification',
		subtitle: 'Verify the MFA code received via SMS/Email',
	},
	{
		title: 'Step 5: Results & Analysis',
		subtitle: 'Review complete MFA flow and API interactions',
	},
] as const;

const PingOneMFAFlowV6: React.FC = () => {
	// Page scroll management
	usePageScroll({ pageName: 'PingOneMFAFlowV6', force: true });

	// State management
	const [currentStep, setCurrentStep] = useState(0);

	// Worker token state (for management API)
	const [workerCredentials, setWorkerCredentials] = useState<WorkerCredentials>({
		environmentId: '',
		clientId: '',
		clientSecret: '',
		scopes: 'p1:read:user p1:update:user p1:create:device p1:read:device p1:update:device',
		tokenEndpointAuthMethod: 'client_secret_post',
	});
	const [workerToken, setWorkerToken] = useState<string | null>(null);
	const [isGettingWorkerToken, setIsGettingWorkerToken] = useState(false);
	const [workerTokenError, setWorkerTokenError] = useState<string | null>(null);

	// User info state
	const [userInfo, setUserInfo] = useState<UserInfo>({
		username: 'test.user@example.com',
		phoneNumber: '9725231586', // Your test number
		emailAddress: 'cmuir@pingone.com', // Your test email
	});

	// Flow state
	const [showClientSecret, setShowClientSecret] = useState(false);
	const [selectedMfaMethod, setSelectedMfaMethod] = useState<string>('sms');
	const [apiCalls, setApiCalls] = useState<ApiCall[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [mfaDevice, setMfaDevice] = useState<any>(null);
	const [mfaChallenge, setMfaChallenge] = useState<any>(null);
	const [verificationCode, setVerificationCode] = useState('');
	const [verificationResult, setVerificationResult] = useState<any>(null);

	// Load saved credentials on mount
	useEffect(() => {
		const savedCredentials = credentialManager.getAllCredentials();
		if (savedCredentials) {
			setWorkerCredentials((prev) => ({
				...prev,
				environmentId: savedCredentials.environmentId || '',
				clientId: savedCredentials.clientId || '',
				clientSecret: savedCredentials.clientSecret || '',
			}));
		}
	}, []);

	const mfaMethods = [
		{
			id: 'sms',
			label: 'SMS Verification',
			icon: <FiSmartphone />,
			description: 'Send verification code to phone number',
			testValue: '9725231586',
		},
		{
			id: 'email',
			label: 'Email Verification',
			icon: <FiMail />,
			description: 'Send verification code to email address',
			testValue: 'cmuir@pingone.com',
		},
	];

	const addApiCall = useCallback(
		(call: Omit<ApiCall, 'id' | 'timestamp' | 'duration' | 'status'>) => {
			const apiCall: ApiCall = {
				...call,
				id: `api-call-${Date.now()}`,
				timestamp: new Date().toISOString(),
				duration: 0,
				status: 0,
			};
			setApiCalls((prev) => [...prev, apiCall]);
			return apiCall;
		},
		[]
	);

	const updateApiCall = useCallback((id: string, updates: Partial<ApiCall>) => {
		setApiCalls((prev) => prev.map((call) => (call.id === id ? { ...call, ...updates } : call)));
	}, []);

	const handleWorkerCredentialChange = (field: keyof WorkerCredentials, value: string) => {
		setWorkerCredentials((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	const handleUserInfoChange = (field: keyof UserInfo, value: string) => {
		setUserInfo((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	const getWorkerToken = useCallback(async () => {
		setIsGettingWorkerToken(true);
		setWorkerTokenError(null);

		try {
			const tokenEndpoint = `https://auth.pingone.com/${workerCredentials.environmentId}/as/token`;

			const headers: Record<string, string> = {
				'Content-Type': 'application/x-www-form-urlencoded',
			};

			const bodyParams: Record<string, string> = {
				grant_type: 'client_credentials',
				scope: workerCredentials.scopes,
			};

			if (workerCredentials.tokenEndpointAuthMethod === 'client_secret_basic') {
				const basicAuth = btoa(`${workerCredentials.clientId}:${workerCredentials.clientSecret}`);
				headers['Authorization'] = `Basic ${basicAuth}`;
			} else {
				bodyParams.client_id = workerCredentials.clientId;
				bodyParams.client_secret = workerCredentials.clientSecret;
			}

			const apiCall = addApiCall({
				method: 'POST',
				url: tokenEndpoint,
				headers,
				requestBody: bodyParams,
			});

			console.log('[PingOne MFA] Getting worker token...');

			const startTime = Date.now();
			const response = await fetch(tokenEndpoint, {
				method: 'POST',
				headers,
				body: new URLSearchParams(bodyParams),
			});

			const tokenData = await response.json();
			const duration = Date.now() - startTime;

			updateApiCall(apiCall.id, {
				responseBody: tokenData,
				duration,
				status: response.status,
			});

			if (!response.ok) {
				throw new Error(
					tokenData.error_description || tokenData.error || `HTTP ${response.status}`
				);
			}

			setWorkerToken(tokenData.access_token);
			v4ToastManager.showSuccess('Worker token obtained successfully!');
			console.log('[PingOne MFA] Worker token obtained');

			// Auto-advance to next step
			setCurrentStep(1);
		} catch (error) {
			console.error('[PingOne MFA] Worker token failed:', error);
			const errorMessage = error instanceof Error ? error.message : 'Failed to get worker token';
			setWorkerTokenError(errorMessage);
			v4ToastManager.showError(`Worker token failed: ${errorMessage}`);
		} finally {
			setIsGettingWorkerToken(false);
		}
	}, [workerCredentials, addApiCall, updateApiCall]);

	const copyToClipboard = (text: string, label: string) => {
		navigator.clipboard.writeText(text);
		v4ToastManager.showSuccess(`${label} copied to clipboard`);
	};

	const renderStepContent = () => {
		const stepInfo = STEP_METADATA[currentStep];

		return (
			<MainCard>
				<StepHeader>
					<StepBadge>
						<FiShield />
						{stepInfo.title}
					</StepBadge>
					<StepTitle>{stepInfo.title}</StepTitle>
					<StepSubtitle>{stepInfo.subtitle}</StepSubtitle>
				</StepHeader>

				<StepContent>
					{currentStep === 0 && (
						<>
							<InfoBox variant="warning">
								<FiAlertTriangle size={20} style={{ flexShrink: 0 }} />
								<InfoContent>
									<InfoTitle>Worker Token Required</InfoTitle>
									<InfoText>
										PingOne MFA APIs are management APIs that require a worker token
										(server-to-server authentication). You need a PingOne Worker Application with
										MFA management scopes.
									</InfoText>
								</InfoContent>
							</InfoBox>

							<FormSection>
								<SectionTitle>
									<FiKey />
									Worker Application Credentials
								</SectionTitle>

								<FormGrid>
									<FormGroup>
										<FormLabel>Environment ID</FormLabel>
										<FormInput
											type="text"
											value={workerCredentials.environmentId}
											onChange={(e) =>
												handleWorkerCredentialChange('environmentId', e.target.value)
											}
											placeholder="Enter your PingOne Environment ID"
										/>
									</FormGroup>

									<FormGroup>
										<FormLabel>Worker Client ID</FormLabel>
										<FormInput
											type="text"
											value={workerCredentials.clientId}
											onChange={(e) => handleWorkerCredentialChange('clientId', e.target.value)}
											placeholder="Enter your Worker Application Client ID"
										/>
									</FormGroup>

									<FormGroup>
										<FormLabel>Worker Client Secret</FormLabel>
										<PasswordInputContainer>
											<FormInput
												type={showClientSecret ? 'text' : 'password'}
												value={workerCredentials.clientSecret}
												onChange={(e) =>
													handleWorkerCredentialChange('clientSecret', e.target.value)
												}
												placeholder="Enter your Worker Application Client Secret"
											/>
											<PasswordToggle
												type="button"
												onClick={() => setShowClientSecret(!showClientSecret)}
											>
												{showClientSecret ? <FiEyeOff /> : <FiEye />}
											</PasswordToggle>
										</PasswordInputContainer>
									</FormGroup>

									<FormGroup>
										<FormLabel>Required Scopes</FormLabel>
										<FormInput
											type="text"
											value={workerCredentials.scopes}
											onChange={(e) => handleWorkerCredentialChange('scopes', e.target.value)}
											placeholder="p1:read:user p1:update:user p1:create:device p1:read:device p1:update:device"
										/>
									</FormGroup>

									<FormGroup>
										<FormLabel>Token Endpoint Auth Method</FormLabel>
										<Select
											value={workerCredentials.tokenEndpointAuthMethod}
											onChange={(e) =>
												handleWorkerCredentialChange(
													'tokenEndpointAuthMethod',
													e.target.value as any
												)
											}
										>
											<option value="client_secret_post">
												Client Secret Post (credentials in request body)
											</option>
											<option value="client_secret_basic">
												Client Secret Basic (credentials in Authorization header)
											</option>
										</Select>
									</FormGroup>
								</FormGrid>

								<div style={{ marginTop: '2rem' }}>
									<ActionButton
										variant="success"
										onClick={getWorkerToken}
										disabled={
											isGettingWorkerToken ||
											!workerCredentials.environmentId ||
											!workerCredentials.clientId ||
											!workerCredentials.clientSecret
										}
									>
										{isGettingWorkerToken ? (
											<SpinningIcon>
												<FiRefreshCw />
											</SpinningIcon>
										) : (
											<FiKey />
										)}
										Get Worker Token
									</ActionButton>
								</div>

								{workerTokenError && (
									<InfoBox variant="error">
										<FiAlertTriangle size={20} style={{ flexShrink: 0 }} />
										<InfoContent>
											<InfoTitle>Worker Token Error</InfoTitle>
											<InfoText>{workerTokenError}</InfoText>
										</InfoContent>
									</InfoBox>
								)}

								{workerToken && (
									<InfoBox variant="success">
										<FiCheckCircle size={20} style={{ flexShrink: 0 }} />
										<InfoContent>
											<InfoTitle>Worker Token Obtained!</InfoTitle>
											<InfoText>Management API token ready for MFA operations.</InfoText>
											<CodeBlock>Authorization: Bearer {workerToken.substring(0, 50)}...</CodeBlock>
										</InfoContent>
									</InfoBox>
								)}
							</FormSection>

							{/* Show API call details */}
							{apiCalls.length > 0 && (
								<FormSection>
									<SectionTitle>
										<FiExternalLink />
										Worker Token API Call
									</SectionTitle>
									{apiCalls.map((call) => (
										<EnhancedApiCallDisplay
											key={call.id}
											apiCall={call}
											options={{
												showEducationalNotes: true,
												showFlowContext: true,
												showUrlBreakdown: true,
											}}
										/>
									))}
								</FormSection>
							)}
						</>
					)}

					{currentStep === 1 && (
						<>
							<InfoBox variant="info">
								<FiUser size={20} style={{ flexShrink: 0 }} />
								<InfoContent>
									<InfoTitle>Test User Configuration</InfoTitle>
									<InfoText>
										Configure the test user information. We're using your provided test phone number
										(9725231586) and email (cmuir@pingone.com) for real MFA testing.
									</InfoText>
								</InfoContent>
							</InfoBox>

							<FormSection>
								<SectionTitle>
									<FiUser />
									Test User Information
								</SectionTitle>

								<FormGrid>
									<FormGroup>
										<FormLabel>Username/Email</FormLabel>
										<FormInput
											type="email"
											value={userInfo.username}
											onChange={(e) => handleUserInfoChange('username', e.target.value)}
											placeholder="Enter test username or email"
										/>
									</FormGroup>

									<FormGroup>
										<FormLabel>Phone Number (for SMS testing)</FormLabel>
										<FormInput
											type="tel"
											value={userInfo.phoneNumber}
											onChange={(e) => handleUserInfoChange('phoneNumber', e.target.value)}
											placeholder="9725231586"
										/>
									</FormGroup>

									<FormGroup>
										<FormLabel>Email Address (for Email testing)</FormLabel>
										<FormInput
											type="email"
											value={userInfo.emailAddress}
											onChange={(e) => handleUserInfoChange('emailAddress', e.target.value)}
											placeholder="cmuir@pingone.com"
										/>
									</FormGroup>
								</FormGrid>

								<div style={{ marginTop: '2rem' }}>
									<ActionButton
										variant="primary"
										onClick={() => setCurrentStep(2)}
										disabled={!userInfo.username || !userInfo.phoneNumber || !userInfo.emailAddress}
									>
										<FiArrowRight />
										Continue to Device Registration
									</ActionButton>
								</div>
							</FormSection>
						</>
					)}

					{currentStep >= 2 && (
						<>
							<InfoBox variant="info">
								<FiInfo size={20} style={{ flexShrink: 0 }} />
								<InfoContent>
									<InfoTitle>Coming Soon: Real MFA API Integration</InfoTitle>
									<InfoText>
										The remaining steps (Device Registration, MFA Challenge, Code Verification) will
										be implemented with real PingOne MFA API calls using your worker token and test
										credentials.
									</InfoText>
								</InfoContent>
							</InfoBox>

							<FormSection>
								<SectionTitle>
									<FiExternalLink />
									Planned API Calls
								</SectionTitle>

								<CodeBlock>
									{`// Step 2: Register MFA Device
POST https://api.pingone.com/v1/environments/${workerCredentials.environmentId}/users/{userId}/devices
Authorization: Bearer ${workerToken ? workerToken.substring(0, 20) + '...' : '{worker_token}'}
Content-Type: application/json

{
  "type": "${selectedMfaMethod.toUpperCase()}",
  ${selectedMfaMethod === 'sms' ? `"phone": "${userInfo.phoneNumber}"` : `"email": "${userInfo.emailAddress}"`}
}

// Step 3: Initiate MFA Challenge  
POST https://api.pingone.com/v1/environments/${workerCredentials.environmentId}/users/{userId}/mfa/challenges
Authorization: Bearer ${workerToken ? workerToken.substring(0, 20) + '...' : '{worker_token}'}
Content-Type: application/json

{
  "deviceId": "{device_id}",
  "type": "${selectedMfaMethod.toUpperCase()}"
}

// Step 4: Verify MFA Code
POST https://api.pingone.com/v1/environments/${workerCredentials.environmentId}/users/{userId}/mfa/challenges/{challengeId}/verify
Authorization: Bearer ${workerToken ? workerToken.substring(0, 20) + '...' : '{worker_token}'}
Content-Type: application/json

{
  "code": "{verification_code}"
}`}
								</CodeBlock>
							</FormSection>
						</>
					)}
				</StepContent>
			</MainCard>
		);
	};

	return (
		<Container>
			<ContentWrapper>
				{/* V6 Flow Header */}
				<FlowHeader flowId="pingone-mfa-v6" />

				{/* Educational Content */}
				<EducationalContentService
					flowType="mfa"
					title="Understanding PingOne Multi-Factor Authentication"
					theme="green"
					defaultCollapsed={false}
				/>

				{/* Enhanced Flow Info */}
				<EnhancedFlowInfoCard
					flowType="pingone-mfa-v6"
					showAdditionalInfo={true}
					showDocumentation={true}
					showCommonIssues={true}
					showImplementationNotes={true}
				/>

				{/* Step Content */}
				{renderStepContent()}

				{/* Step Navigation */}
				<StepNavigationButtons
					currentStep={currentStep}
					totalSteps={STEP_METADATA.length}
					onPrevious={() => setCurrentStep(Math.max(0, currentStep - 1))}
					onNext={() => setCurrentStep(Math.min(STEP_METADATA.length - 1, currentStep + 1))}
					onReset={() => {
						setCurrentStep(0);
						setWorkerToken(null);
						setWorkerTokenError(null);
						setApiCalls([]);
						setMfaDevice(null);
						setMfaChallenge(null);
						setVerificationResult(null);
						setVerificationCode('');
					}}
					canNavigateNext={
						(currentStep === 0 && workerToken) ||
						(currentStep === 1 &&
							userInfo.username &&
							userInfo.phoneNumber &&
							userInfo.emailAddress) ||
						currentStep > 1
					}
					isFirstStep={currentStep === 0}
					nextButtonText="Next"
					disabledMessage="Complete the current step to continue"
					stepRequirements={[
						'Obtain worker token with MFA management scopes',
						'Configure test user information',
						'Register MFA device using management API',
						'Initiate MFA challenge and send verification code',
						'Verify MFA code to complete authentication',
						'Review complete MFA flow and API interactions',
					]}
					showCompleteActionButton={false}
				/>
			</ContentWrapper>
		</Container>
	);
};

export default PingOneMFAFlowV6;
