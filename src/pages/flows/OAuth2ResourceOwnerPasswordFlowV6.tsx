// src/pages/flows/OAuth2ResourceOwnerPasswordFlowV6.tsx
// Hybrid V6 implementation: V5 controller with V6 layout and styling

import React, { useCallback, useEffect, useState } from 'react';
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
	FiBook,
	FiSave,
} from 'react-icons/fi';
import styled from 'styled-components';
import { useResourceOwnerPasswordFlowV5 } from '../../hooks/useResourceOwnerPasswordFlowV5';
import { FlowHeader } from '../../services/flowHeaderService';
import { StepNavigationButtons } from '../../components/StepNavigationButtons';
import { v4ToastManager } from '../../utils/v4ToastMessages';
import EducationalContentService from '../../services/educationalContentService.tsx';
import EnhancedFlowInfoCard from '../../components/EnhancedFlowInfoCard';
import FlowConfigurationRequirements from '../../components/FlowConfigurationRequirements';
import EnhancedFlowWalkthrough from '../../components/EnhancedFlowWalkthrough';
import FlowSequenceDisplay from '../../components/FlowSequenceDisplay';
import TokenDisplayService from '../../services/tokenDisplayService';
import ComprehensiveCredentialsService from '../../services/comprehensiveCredentialsService';
import { usePageScroll } from '../../hooks/usePageScroll';

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
	background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
	color: #ffffff;
	padding: 2rem;
	display: flex;
	align-items: center;
	justify-content: space-between;
`;

const StepHeaderLeft = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
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
`;

const StepTitle = styled.h2`
	margin: 0;
	font-size: 1.5rem;
	font-weight: 700;
	letter-spacing: -0.025em;
`;

const StepSubtitle = styled.p`
	margin: 0;
	font-size: 1rem;
	opacity: 0.9;
	line-height: 1.5;
`;

const StepContent = styled.div`
	padding: 2rem;
`;

const MockNotice = styled.div`
	background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
	border: 1px solid #f59e0b;
	border-radius: 0.75rem;
	padding: 1rem;
	margin-bottom: 1.5rem;
	display: flex;
	align-items: center;
	gap: 0.75rem;
`;

const MockNoticeContent = styled.div`
	flex: 1;
`;

const MockNoticeTitle = styled.div`
	font-weight: 600;
	color: #92400e;
	margin-bottom: 0.25rem;
`;

const MockNoticeText = styled.div`
	font-size: 0.875rem;
	color: #78350f;
	line-height: 1.4;
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
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const MockBadge = styled.span`
	font-size: 0.75rem;
	background: #fbbf24;
	color: #92400e;
	padding: 0.125rem 0.375rem;
	border-radius: 0.25rem;
	font-weight: 500;
`;

const FormInput = styled.input<{ $isMock?: boolean }>`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 0.5rem;
	font-size: 1rem;
	background: ${props => props.$isMock ? '#fef3c7' : '#ffffff'};
	
	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
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

const ActionButton = styled.button<{ variant?: 'primary' | 'secondary' | 'success' }>`
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
	
	${props => props.variant === 'primary' && `
		background: #3b82f6;
		color: white;
		&:hover { background: #2563eb; }
		&:disabled { background: #9ca3af; cursor: not-allowed; }
	`}
	
	${props => props.variant === 'success' && `
		background: #16a34a;
		color: white;
		&:hover { background: #15803d; }
		&:disabled { background: #9ca3af; cursor: not-allowed; }
	`}
	
	${props => props.variant === 'secondary' && `
		background: #f3f4f6;
		color: #374151;
		border: 1px solid #d1d5db;
		&:hover { background: #e5e7eb; }
		&:disabled { background: #f9fafb; cursor: not-allowed; }
	`}
`;

const ResultCard = styled.div`
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 0.75rem;
	padding: 1.5rem;
	margin-top: 1.5rem;
`;

const ResultHeader = styled.h4`
	margin: 0 0 1rem 0;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	color: #059669;
	font-weight: 600;
`;

const TokenDisplay = styled.div`
	background: #ffffff;
	border: 1px solid #e5e7eb;
	border-radius: 0.5rem;
	padding: 1rem;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.875rem;
	word-break: break-all;
	margin-bottom: 1rem;
`;

const TokenMeta = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 1rem;
	font-size: 0.875rem;
	color: #6b7280;
`;

const SpinningIcon = styled.div`
	animation: spin 1s linear infinite;
	
	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}
`;

const STEP_METADATA = [
	{ title: 'Step 0: Configuration', subtitle: 'Set up PingOne credentials and user details' },
	{ title: 'Step 1: Authentication', subtitle: 'Exchange username/password for access token' },
	{ title: 'Step 2: User Information', subtitle: 'Fetch user details using access token' },
	{ title: 'Step 3: Token Refresh', subtitle: 'Refresh access token using refresh token' },
] as const;

const OAuth2ResourceOwnerPasswordFlowV6: React.FC = () => {
	// Use existing V5 controller
	const controller = useResourceOwnerPasswordFlowV5({
		flowKey: 'oauth2-rop-v6',
		enableDebugger: true,
	});

	const [showPassword, setShowPassword] = useState(false);
	const [showClientSecret, setShowClientSecret] = useState(false);

	// Page scroll management
	usePageScroll({ pageName: 'OAuth2ResourceOwnerPasswordFlowV6', force: true });

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
		const currentStep = controller.stepManager.currentStepIndex;
		const stepInfo = STEP_METADATA[currentStep];

		return (
			<MainCard>
				<StepHeader>
					<StepHeaderLeft>
						<StepBadge>
							<FiBook />
							{stepInfo.title}
						</StepBadge>
						<StepTitle>{stepInfo.title}</StepTitle>
						<StepSubtitle>{stepInfo.subtitle}</StepSubtitle>
					</StepHeaderLeft>
				</StepHeader>

				<StepContent>
					{currentStep === 0 && (
						<>
							{/* Mock Implementation Notice */}
							<MockNotice>
								<FiInfo size={20} style={{ color: '#d97706', flexShrink: 0 }} />
								<MockNoticeContent>
									<MockNoticeTitle>🎭 Mock Implementation</MockNoticeTitle>
									<MockNoticeText>
										This flow uses your real PingOne credentials but generates mock tokens for educational purposes. 
										The username and password are pre-filled with demo values.
									</MockNoticeText>
								</MockNoticeContent>
							</MockNotice>

							<FormSection>
								<SectionTitle>
									<FiKey />
									PingOne Configuration
								</SectionTitle>
								<FormGrid>
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
								</FormGrid>
							</FormSection>

							<FormSection>
								<SectionTitle>
									<FiUser />
									User Credentials
								</SectionTitle>
								<FormGrid>
									<FormGroup>
										<FormLabel>
											Username 
											<MockBadge>MOCK</MockBadge>
										</FormLabel>
										<FormInput
											type="text"
											value={controller.credentials.username}
											onChange={(e) => handleCredentialChange('username', e.target.value)}
											placeholder="Enter username (email)"
											$isMock={true}
										/>
									</FormGroup>

									<FormGroup>
										<FormLabel>
											Password 
											<MockBadge>MOCK</MockBadge>
										</FormLabel>
										<PasswordInputContainer>
											<FormInput
												type={showPassword ? 'text' : 'password'}
												$isMock={true}
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
											placeholder="openid profile email"
										/>
									</FormGroup>
								</FormGrid>

								<div style={{ marginTop: '2rem' }}>
									<ActionButton
										variant="success"
										onClick={controller.saveCredentials}
										disabled={controller.isSavingCredentials}
									>
										{controller.isSavingCredentials ? (
											<SpinningIcon><FiRefreshCw /></SpinningIcon>
										) : (
											<FiSave />
										)}
										Save Configuration
									</ActionButton>
								</div>
							</FormSection>
						</>
					)}

					{currentStep === 1 && (
						<>
							<FormSection>
								<SectionTitle>
									<FiLock />
									Resource Owner Password Authentication
								</SectionTitle>
								<p style={{ marginBottom: '1.5rem', color: '#6b7280' }}>
									This step will exchange the username and password for an access token using the
									Resource Owner Password Credentials grant.
								</p>

								<ActionButton
									variant="primary"
									onClick={controller.authenticateUser}
									disabled={controller.isAuthenticating || !controller.hasCredentialsSaved}
								>
									{controller.isAuthenticating ? (
										<SpinningIcon><FiRefreshCw /></SpinningIcon>
									) : (
										<FiLock />
									)}
									Authenticate User
								</ActionButton>
							</FormSection>

							{controller.tokens && (
								<ResultCard>
									<ResultHeader>
										<FiCheckCircle />
										Access Token Received
									</ResultHeader>

									<TokenDisplay>
										<div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
											<strong>Access Token:</strong>
											<ActionButton
												variant="secondary"
												style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
												onClick={() => copyToClipboard(controller.tokens!.access_token, 'Access token')}
											>
												<FiCopy />
											</ActionButton>
										</div>
										<div style={{ fontSize: '0.75rem' }}>
											{controller.tokens.access_token}
										</div>
									</TokenDisplay>

									<TokenMeta>
										<div><strong>Token Type:</strong> {controller.tokens.token_type}</div>
										<div><strong>Expires In:</strong> {controller.tokens.expires_in} seconds</div>
										<div><strong>Scope:</strong> {controller.tokens.scope}</div>
										{controller.tokens.refresh_token && (
											<div><strong>Has Refresh Token:</strong> Yes</div>
										)}
									</TokenMeta>
								</ResultCard>
							)}
						</>
					)}

					{currentStep === 2 && (
						<>
							<FormSection>
								<SectionTitle>
									<FiUser />
									User Information
								</SectionTitle>
								<p style={{ marginBottom: '1.5rem', color: '#6b7280' }}>
									Fetch user information using the access token from the previous step.
								</p>

								<ActionButton
									variant="primary"
									onClick={controller.fetchUserInfo}
									disabled={controller.isFetchingUserInfo || !controller.tokens}
								>
									{controller.isFetchingUserInfo ? (
										<SpinningIcon><FiRefreshCw /></SpinningIcon>
									) : (
										<FiUser />
									)}
									Fetch User Info
								</ActionButton>
							</FormSection>

							{controller.userInfo && (
								<ResultCard>
									<ResultHeader>
										<FiCheckCircle />
										User Information
									</ResultHeader>

									<TokenDisplay>
										<pre>{JSON.stringify(controller.userInfo, null, 2)}</pre>
									</TokenDisplay>
								</ResultCard>
							)}
						</>
					)}

					{currentStep === 3 && (
						<>
							<FormSection>
								<SectionTitle>
									<FiRefreshCw />
									Token Refresh
								</SectionTitle>
								<p style={{ marginBottom: '1.5rem', color: '#6b7280' }}>
									Use the refresh token to obtain a new access token without re-authenticating.
								</p>

								<ActionButton
									variant="primary"
									onClick={controller.refreshTokens}
									disabled={controller.isRefreshingTokens || !controller.tokens?.refresh_token}
								>
									{controller.isRefreshingTokens ? (
										<SpinningIcon><FiRefreshCw /></SpinningIcon>
									) : (
										<FiRefreshCw />
									)}
									Refresh Tokens
								</ActionButton>

								{!controller.tokens?.refresh_token && (
									<p style={{ color: '#dc2626', marginTop: '1rem' }}>
										No refresh token available. Complete the authentication step first.
									</p>
								)}
							</FormSection>

							{controller.refreshedTokens && (
								<ResultCard>
									<ResultHeader>
										<FiCheckCircle />
										New Access Token
									</ResultHeader>

									<TokenDisplay>
										<div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
											<strong>New Access Token:</strong>
											<ActionButton
												variant="secondary"
												style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
												onClick={() => copyToClipboard(controller.refreshedTokens!.access_token, 'New access token')}
											>
												<FiCopy />
											</ActionButton>
										</div>
										<div style={{ fontSize: '0.75rem' }}>
											{controller.refreshedTokens.access_token}
										</div>
									</TokenDisplay>

									<TokenMeta>
										<div><strong>Token Type:</strong> {controller.refreshedTokens.token_type}</div>
										<div><strong>Expires In:</strong> {controller.refreshedTokens.expires_in} seconds</div>
									</TokenMeta>
								</ResultCard>
							)}
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
				<FlowHeader flowId="oauth2-resource-owner-password-v6" />

				{/* Educational Content */}
				<EducationalContentService 
					flowType="resource-owner-password"
					title="Understanding Resource Owner Password Credentials Flow"
					theme="orange"
					defaultCollapsed={false}
				/>

				{/* Enhanced Flow Info */}
				<EnhancedFlowInfoCard
					flowType="oauth2-resource-owner-password-v6"
					showAdditionalInfo={true}
					showDocumentation={true}
					showCommonIssues={false}
					showImplementationNotes={false}
				/>

				{/* Flow Configuration Requirements */}
				<FlowConfigurationRequirements flowType="resource-owner-password" variant="oauth" />

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

				{/* Enhanced Flow Walkthrough */}
				<EnhancedFlowWalkthrough flowId="oauth2-resource-owner-password-v6" />

				{/* Flow Sequence Display */}
				<FlowSequenceDisplay flowType="resource-owner-password" />
			</ContentWrapper>
		</Container>
	);
};

export default OAuth2ResourceOwnerPasswordFlowV6;