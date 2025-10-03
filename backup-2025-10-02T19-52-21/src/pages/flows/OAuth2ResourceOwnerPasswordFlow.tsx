import type React from 'react';
import { useEffect, useState } from 'react';
import {
	FiAlertTriangle,
	FiInfo,
	FiLock,
	FiShield,
	FiUser,
	FiKey,
	FiCheckCircle,
	FiRefreshCw,
	FiCopy,
	FiEye,
	FiEyeOff,
} from 'react-icons/fi';
import styled from 'styled-components';
import CollapsibleSection from '../../components/CollapsibleSection';
import { useResourceOwnerPasswordFlowV5 } from '../../hooks/useResourceOwnerPasswordFlowV5';
import { FlowHeader } from '../../services/flowHeaderService';
import { StepNavigationButtons } from '../../components/StepNavigationButtons';
import { v4ToastManager } from '../../utils/v4ToastMessages';

const PageContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const PageHeader = styled.div`
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  color: white;
  padding: 2rem;
  border-radius: 0.75rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
`;

const PageTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const PageSubtitle = styled.p`
  font-size: 1.25rem;
  margin: 0;
  opacity: 0.9;
`;

const WarningCard = styled.div`
  background: #fef2f2;
  border: 2px solid #fecaca;
  border-radius: 0.75rem;
  padding: 2rem;
  margin-bottom: 2rem;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
`;

const InfoCard = styled.div`
  background: #f0f9ff;
  border: 2px solid #bae6fd;
  border-radius: 0.75rem;
  padding: 2rem;
  margin-bottom: 2rem;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
`;

const CardContent = styled.div`
  flex: 1;
`;

const CardTitle = styled.h3`
  margin: 0 0 1rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CardText = styled.p`
  margin: 0 0 1rem 0;
  line-height: 1.6;
`;

const CardList = styled.ul`
  margin: 0;
  padding-left: 1.5rem;
  line-height: 1.6;
`;

const CardListItem = styled.li`
  margin-bottom: 0.5rem;
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

const SecurityNotice = styled.div`
  background: #fef3c7;
  border: 2px solid #f59e0b;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin: 2rem 0;
`;

const SecurityTitle = styled.h4`
  margin: 0 0 1rem 0;
  color: #92400e;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SecurityList = styled.ul`
  margin: 0;
  padding-left: 1.5rem;
  color: #92400e;
`;

const SecurityListItem = styled.li`
  margin-bottom: 0.5rem;
`;

const FormContainer = styled.div`
	background: #ffffff;
	border: 1px solid #e5e7eb;
	border-radius: 0.75rem;
	padding: 2rem;
	margin: 2rem 0;
`;

const FormGroup = styled.div`
	margin-bottom: 1.5rem;
`;

const FormLabel = styled.label`
	display: block;
	font-weight: 600;
	margin-bottom: 0.5rem;
	color: #374151;
`;

const FormInput = styled.input`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 0.5rem;
	font-size: 1rem;
	
	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`;

const FormTextarea = styled.textarea`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 0.5rem;
	font-size: 1rem;
	min-height: 100px;
	resize: vertical;
	
	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
	padding: 0.75rem 1.5rem;
	border-radius: 0.5rem;
	font-weight: 600;
	border: none;
	cursor: pointer;
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	transition: all 0.2s;
	
	${(props) =>
		props.variant === 'primary' &&
		`
		background: #3b82f6;
		color: white;
		&:hover { background: #2563eb; }
		&:disabled { background: #9ca3af; cursor: not-allowed; }
	`}
	
	${(props) =>
		props.variant === 'secondary' &&
		`
		background: #f3f4f6;
		color: #374151;
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

const TokenDisplay = styled.div`
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 0.5rem;
	padding: 1rem;
	margin: 1rem 0;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.875rem;
	word-break: break-all;
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

const SpinningIcon = styled.div`
	animation: spin 1s linear infinite;
	
	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
`;

const STEP_METADATA = [
	{ title: 'Step 0: Configuration', subtitle: 'Set up PingOne credentials and user details' },
	{ title: 'Step 1: Authentication', subtitle: 'Exchange username/password for access token' },
	{ title: 'Step 2: User Information', subtitle: 'Fetch user details using access token' },
	{ title: 'Step 3: Token Refresh', subtitle: 'Refresh access token using refresh token' },
] as const;

const OAuth2ResourceOwnerPasswordFlow: React.FC = () => {
	const controller = useResourceOwnerPasswordFlowV5({
		flowKey: 'oauth2-rop',
		enableDebugger: true,
	});

	const [showPassword, setShowPassword] = useState(false);
	const [showClientSecret, setShowClientSecret] = useState(false);

	// Scroll to top when component mounts
	useEffect(() => {
		window.scrollTo(0, 0);
	}, []);

	const handleCredentialChange = (field: string, value: string) => {
		controller.setCredentials({
			...controller.credentials,
			[field]: value,
		});
	};

	const copyToClipboard = (text: string, label: string) => {
		navigator.clipboard.writeText(text);
		v4ToastManager.showSuccess(`${label} copied to clipboard`);
	};

	const renderStepContent = () => {
		switch (controller.stepManager.currentStepIndex) {
			case 0:
				return (
					<FormContainer>
						<h3
							style={{
								marginBottom: '1.5rem',
								display: 'flex',
								alignItems: 'center',
								gap: '0.5rem',
							}}
						>
							<FiKey />
							PingOne Configuration
						</h3>

						<FormGroup>
							<FormLabel>Environment ID</FormLabel>
							<FormInput
								type="text"
								value={controller.credentials.environmentId}
								onChange={(e) => handleCredentialChange('environmentId', e.target.value)}
								placeholder="Enter your PingOne Environment ID"
							/>
						</FormGroup>

						<FormGroup>
							<FormLabel>Client ID</FormLabel>
							<FormInput
								type="text"
								value={controller.credentials.clientId}
								onChange={(e) => handleCredentialChange('clientId', e.target.value)}
								placeholder="Enter your PingOne Client ID"
							/>
						</FormGroup>

						<FormGroup>
							<FormLabel>Client Secret</FormLabel>
							<PasswordInputContainer>
								<FormInput
									type={showClientSecret ? 'text' : 'password'}
									value={controller.credentials.clientSecret}
									onChange={(e) => handleCredentialChange('clientSecret', e.target.value)}
									placeholder="Enter your PingOne Client Secret"
								/>
								<PasswordToggle
									type="button"
									onClick={() => setShowClientSecret(!showClientSecret)}
								>
									{showClientSecret ? <FiEyeOff /> : <FiEye />}
								</PasswordToggle>
							</PasswordInputContainer>
						</FormGroup>

						<h3
							style={{
								marginBottom: '1.5rem',
								marginTop: '2rem',
								display: 'flex',
								alignItems: 'center',
								gap: '0.5rem',
							}}
						>
							<FiUser />
							User Credentials
						</h3>

						<FormGroup>
							<FormLabel>Username</FormLabel>
							<FormInput
								type="text"
								value={controller.credentials.username}
								onChange={(e) => handleCredentialChange('username', e.target.value)}
								placeholder="Enter username (email)"
							/>
						</FormGroup>

						<FormGroup>
							<FormLabel>Password</FormLabel>
							<PasswordInputContainer>
								<FormInput
									type={showPassword ? 'text' : 'password'}
									value={controller.credentials.password}
									onChange={(e) => handleCredentialChange('password', e.target.value)}
									placeholder="Enter password"
								/>
								<PasswordToggle type="button" onClick={() => setShowPassword(!showPassword)}>
									{showPassword ? <FiEyeOff /> : <FiEye />}
								</PasswordToggle>
							</PasswordInputContainer>
						</FormGroup>

						<FormGroup>
							<FormLabel>Scope</FormLabel>
							<FormInput
								type="text"
								value={controller.credentials.scope}
								onChange={(e) => handleCredentialChange('scope', e.target.value)}
								placeholder="read write"
							/>
						</FormGroup>

						<div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
							<Button
								variant="primary"
								onClick={controller.saveCredentials}
								disabled={controller.isSavingCredentials}
							>
								{controller.isSavingCredentials ? (
									<SpinningIcon>
										<FiRefreshCw />
									</SpinningIcon>
								) : (
									<FiCheckCircle />
								)}
								Save Configuration
							</Button>
						</div>
					</FormContainer>
				);

			case 1:
				return (
					<FormContainer>
						<h3
							style={{
								marginBottom: '1.5rem',
								display: 'flex',
								alignItems: 'center',
								gap: '0.5rem',
							}}
						>
							<FiLock />
							Resource Owner Password Authentication
						</h3>

						<p style={{ marginBottom: '1.5rem', color: '#6b7280' }}>
							This step will exchange the username and password for an access token using the
							Resource Owner Password Credentials grant.
						</p>

						<Button
							variant="primary"
							onClick={controller.authenticateUser}
							disabled={controller.isAuthenticating || !controller.hasCredentialsSaved}
						>
							{controller.isAuthenticating ? (
								<SpinningIcon>
									<FiRefreshCw />
								</SpinningIcon>
							) : (
								<FiLock />
							)}
							Authenticate User
						</Button>

						{controller.tokens && (
							<div style={{ marginTop: '2rem' }}>
								<h4
									style={{
										marginBottom: '1rem',
										display: 'flex',
										alignItems: 'center',
										gap: '0.5rem',
									}}
								>
									<FiCheckCircle color="#059669" />
									Access Token Received
								</h4>

								<TokenDisplay>
									<div style={{ marginBottom: '0.5rem' }}>
										<strong>Access Token:</strong>
										<Button
											variant="secondary"
											style={{
												marginLeft: '0.5rem',
												padding: '0.25rem 0.5rem',
												fontSize: '0.75rem',
											}}
											onClick={() =>
												copyToClipboard(controller.tokens!.access_token, 'Access token')
											}
										>
											<FiCopy />
										</Button>
									</div>
									<div style={{ wordBreak: 'break-all', fontSize: '0.75rem' }}>
										{controller.tokens.access_token}
									</div>
								</TokenDisplay>

								<div
									style={{
										display: 'grid',
										gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
										gap: '1rem',
										marginTop: '1rem',
									}}
								>
									<div>
										<strong>Token Type:</strong> {controller.tokens.token_type}
									</div>
									<div>
										<strong>Expires In:</strong> {controller.tokens.expires_in} seconds
									</div>
									<div>
										<strong>Scope:</strong> {controller.tokens.scope}
									</div>
									{controller.tokens.refresh_token && (
										<div>
											<strong>Has Refresh Token:</strong> Yes
										</div>
									)}
								</div>
							</div>
						)}
					</FormContainer>
				);

			case 2:
				return (
					<FormContainer>
						<h3
							style={{
								marginBottom: '1.5rem',
								display: 'flex',
								alignItems: 'center',
								gap: '0.5rem',
							}}
						>
							<FiUser />
							User Information
						</h3>

						<p style={{ marginBottom: '1.5rem', color: '#6b7280' }}>
							Fetch user information using the access token from the previous step.
						</p>

						<Button
							variant="primary"
							onClick={controller.fetchUserInfo}
							disabled={controller.isFetchingUserInfo || !controller.tokens}
						>
							{controller.isFetchingUserInfo ? (
								<SpinningIcon>
									<FiRefreshCw />
								</SpinningIcon>
							) : (
								<FiUser />
							)}
							Fetch User Info
						</Button>

						{controller.userInfo && (
							<div style={{ marginTop: '2rem' }}>
								<h4
									style={{
										marginBottom: '1rem',
										display: 'flex',
										alignItems: 'center',
										gap: '0.5rem',
									}}
								>
									<FiCheckCircle color="#059669" />
									User Information
								</h4>

								<TokenDisplay>
									<pre>{JSON.stringify(controller.userInfo, null, 2)}</pre>
								</TokenDisplay>
							</div>
						)}
					</FormContainer>
				);

			case 3:
				return (
					<FormContainer>
						<h3
							style={{
								marginBottom: '1.5rem',
								display: 'flex',
								alignItems: 'center',
								gap: '0.5rem',
							}}
						>
							<FiRefreshCw />
							Token Refresh
						</h3>

						<p style={{ marginBottom: '1.5rem', color: '#6b7280' }}>
							Use the refresh token to obtain a new access token without re-authenticating.
						</p>

						<Button
							variant="primary"
							onClick={controller.refreshTokens}
							disabled={controller.isRefreshingTokens || !controller.tokens?.refresh_token}
						>
							{controller.isRefreshingTokens ? (
								<SpinningIcon>
									<FiRefreshCw />
								</SpinningIcon>
							) : (
								<FiRefreshCw />
							)}
							Refresh Tokens
						</Button>

						{!controller.tokens?.refresh_token && (
							<p style={{ color: '#dc2626', marginTop: '1rem' }}>
								No refresh token available. Complete the authentication step first.
							</p>
						)}

						{controller.refreshedTokens && (
							<div style={{ marginTop: '2rem' }}>
								<h4
									style={{
										marginBottom: '1rem',
										display: 'flex',
										alignItems: 'center',
										gap: '0.5rem',
									}}
								>
									<FiCheckCircle color="#059669" />
									New Access Token
								</h4>

								<TokenDisplay>
									<div style={{ marginBottom: '0.5rem' }}>
										<strong>New Access Token:</strong>
										<Button
											variant="secondary"
											style={{
												marginLeft: '0.5rem',
												padding: '0.25rem 0.5rem',
												fontSize: '0.75rem',
											}}
											onClick={() =>
												copyToClipboard(
													controller.refreshedTokens!.access_token,
													'New access token'
												)
											}
										>
											<FiCopy />
										</Button>
									</div>
									<div style={{ wordBreak: 'break-all', fontSize: '0.75rem' }}>
										{controller.refreshedTokens.access_token}
									</div>
								</TokenDisplay>

								<div
									style={{
										display: 'grid',
										gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
										gap: '1rem',
										marginTop: '1rem',
									}}
								>
									<div>
										<strong>Token Type:</strong> {controller.refreshedTokens.token_type}
									</div>
									<div>
										<strong>Expires In:</strong> {controller.refreshedTokens.expires_in} seconds
									</div>
								</div>
							</div>
						)}
					</FormContainer>
				);

			default:
				return null;
		}
	};

	return (
		<PageContainer>
			{/* V5 Flow Header */}
			<FlowHeader flowId="oauth-resource-owner-password-v5" />

			<CollapsibleSection title="⚠️ Security Warning" defaultCollapsed={false}>
				<WarningCard>
					<FiAlertTriangle size={24} color="#dc2626" />
					<CardContent>
						<CardText style={{ color: '#991b1b' }}>
							The Resource Owner Password Credentials flow is <strong>deprecated</strong> and should
							be avoided in most cases due to significant security risks. This flow requires the
							application to collect and handle user credentials directly.
						</CardText>
						<CardList style={{ color: '#991b1b' }}>
							<CardListItem>Applications must handle passwords securely</CardListItem>
							<CardListItem>No delegation of authentication to authorization server</CardListItem>
							<CardListItem>Phishing attacks become easier</CardListItem>
							<CardListItem>Violates principle of least privilege</CardListItem>
						</CardList>
					</CardContent>
				</WarningCard>
			</CollapsibleSection>

			<CollapsibleSection title="📋 When to Use (Rare Cases)">
				<InfoCard>
					<FiInfo size={24} color="#0ea5e9" />
					<CardContent>
						<CardText style={{ color: '#0c4a6e' }}>
							This flow should only be used in very specific, high-trust scenarios:
						</CardText>
						<CardList style={{ color: '#0c4a6e' }}>
							<CardListItem>Legacy system migration where other flows are impossible</CardListItem>
							<CardListItem>Highly trusted first-party applications</CardListItem>
							<CardListItem>Server-to-server communication with shared credentials</CardListItem>
							<CardListItem>
								Internal enterprise applications with strong security controls
							</CardListItem>
						</CardList>
					</CardContent>
				</InfoCard>
			</CollapsibleSection>

			{/* Step Content */}
			{renderStepContent()}

			{/* Step Navigation */}
			<StepNavigationButtons
				currentStep={controller.stepManager.currentStepIndex}
				totalSteps={STEP_METADATA.length}
				onStepChange={(step) => controller.stepManager.setStep(step, 'manual navigation')}
				stepMetadata={STEP_METADATA}
				onReset={controller.resetFlow}
			/>

			<CollapsibleSection title="✅ Recommended Alternatives">
				<InfoCard>
					<FiUser size={24} color="#0ea5e9" />
					<CardContent>
						<CardText style={{ color: '#0c4a6e' }}>
							Instead of the Resource Owner Password flow, consider these more secure alternatives:
						</CardText>
						<CardList style={{ color: '#0c4a6e' }}>
							<CardListItem>
								<strong>Authorization Code Flow:</strong> Most secure for web applications
							</CardListItem>
							<CardListItem>
								<strong>Authorization Code with PKCE:</strong> Best for mobile and SPA applications
							</CardListItem>
							<CardListItem>
								<strong>Device Code Flow:</strong> For devices with limited input capabilities
							</CardListItem>
							<CardListItem>
								<strong>Client Credentials Flow:</strong> For server-to-server communication
							</CardListItem>
						</CardList>
					</CardContent>
				</InfoCard>
			</CollapsibleSection>
		</PageContainer>
	);
};

export default OAuth2ResourceOwnerPasswordFlow;
