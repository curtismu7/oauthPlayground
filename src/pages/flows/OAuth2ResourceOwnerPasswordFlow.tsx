import type React from 'react';
import { useEffect, useState } from 'react';
import {
	FiAlertTriangle,
	FiCheckCircle,
	FiEye,
	FiEyeOff,
	FiInfo,
	FiKey,
	FiLock,
	FiRefreshCw,
	FiUser,
} from 'react-icons/fi';
import styled from 'styled-components';
import CollapsibleSection from '../../components/CollapsibleSection';
import { StepNavigationButtons } from '../../components/StepNavigationButtons';
import { useResourceOwnerPasswordFlowV7 } from '../../hooks/useResourceOwnerPasswordFlowV7';
import { FlowHeader } from '../../services/flowHeaderService';
import { UnifiedTokenDisplayService } from '../../services/unifiedTokenDisplayService';
import { v4ToastManager } from '../../utils/v4ToastMessages';

const PageContainer = styled.div`
	max-width: 1200px;
	margin: 0 auto;
	padding: 2rem;
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

const _FormTextarea = styled.textarea`
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
	const controller = useResourceOwnerPasswordFlowV7({
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

	const _copyToClipboard = (text: string, label: string) => {
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
						<form>
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
										autoComplete="current-password"
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
						</form>
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

								<UltimateTokenDisplay
									tokens={controller.tokens}
									flowType="oauth"
									flowKey="oauth-resource-owner-password"
									displayMode="detailed"
									title="Resource Owner Password Tokens"
									subtitle="Access token obtained using username/password credentials"
									showCopyButtons={true}
									showDecodeButtons={true}
									showMaskToggle={true}
									showTokenManagement={true}
									showMetadata={true}
								/>

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

								<div
									style={{
										background: '#f8fafc',
										border: '1px solid #e2e8f0',
										borderRadius: '0.5rem',
										padding: '1rem',
										fontFamily: 'Monaco, Menlo, monospace',
										fontSize: '0.875rem',
										margin: '1rem 0',
									}}
								>
									<pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
										{JSON.stringify(controller.userInfo, null, 2)}
									</pre>
								</div>
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
							<>
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
											<FiInfo color="#3b82f6" />
											Before Refresh
										</h4>
										{UnifiedTokenDisplayService.showTokens(
											controller.tokens,
											'oauth',
											'oauth-resource-owner-password-before',
											{
												showCopyButtons: true,
												showDecodeButtons: true,
											}
										)}
									</div>
								)}
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
										After Refresh
									</h4>
									<InfoCard style={{ marginBottom: '1rem', padding: '1rem' }}>
										<FiInfo style={{ flexShrink: 0 }} />
										<CardText style={{ margin: 0, fontSize: '0.875rem' }}>
											Whether a refresh token is opaque or JWT depends on the authorization server's
											design:
											<br />• <strong>PingOne</strong> → typically opaque (refresh token references
											state stored server-side)
											<br />• <strong>PingFederate/PingAM/AIC</strong> → can issue JWT refresh
											tokens (optional setting)
											<br />• <strong>Custom OIDC servers</strong> → often use JWT refresh tokens to
											avoid DB lookups
										</CardText>
									</InfoCard>
									{UnifiedTokenDisplayService.showTokens(
										controller.refreshedTokens,
										'oauth',
										'oauth-resource-owner-password-refresh',
										{
											showCopyButtons: true,
											showDecodeButtons: true,
										}
									)}
								</div>
							</>
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
				onPrevious={() =>
					controller.stepManager.setStep(
						Math.max(0, controller.stepManager.currentStepIndex - 1),
						'previous'
					)
				}
				onNext={() =>
					controller.stepManager.setStep(
						Math.min(STEP_METADATA.length - 1, controller.stepManager.currentStepIndex + 1),
						'next'
					)
				}
				onReset={controller.resetFlow}
				canNavigateNext={controller.stepManager.currentStepIndex < STEP_METADATA.length - 1}
				isFirstStep={controller.stepManager.currentStepIndex === 0}
				nextButtonText="Next"
				disabledMessage="Complete the action above to continue"
				stepRequirements={[
					'Review the flow overview and setup credentials',
					'Enter username and password, then request access token',
					'Fetch user details using access token',
					'Refresh access token using refresh token',
				]}
				onCompleteAction={() =>
					controller.stepManager.setStep(
						Math.min(STEP_METADATA.length - 1, controller.stepManager.currentStepIndex + 1),
						'complete action'
					)
				}
				showCompleteActionButton={false}
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
