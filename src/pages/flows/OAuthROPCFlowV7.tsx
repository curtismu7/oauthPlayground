// src/pages/flows/OAuthROPCFlowV7.tsx
// V7 implementation: Enhanced ROPC flow with improved UI and functionality

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
import EducationalContentService from '../../services/educationalContentService';
import EnhancedFlowInfoCard from '../../components/EnhancedFlowInfoCard';
import FlowConfigurationRequirements from '../../components/FlowConfigurationRequirements';
import EnhancedFlowWalkthrough from '../../components/EnhancedFlowWalkthrough';
import FlowSequenceDisplay from '../../components/FlowSequenceDisplay';
import TokenDisplayService from '../../services/tokenDisplayService';
import ComprehensiveCredentialsService from '../../services/comprehensiveCredentialsService';
import { usePageScroll } from '../../hooks/usePageScroll';

// V7 Styled Components with enhanced styling
const Container = styled.div`
	min-height: 100vh;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	padding: 2rem 0 6rem;
`;

const ContentWrapper = styled.div`
	max-width: 64rem;
	margin: 0 auto;
	padding: 0 1rem;
`;

const MainCard = styled.div`
	background-color: #ffffff;
	border-radius: 1.5rem;
	box-shadow: 0 25px 50px rgba(15, 23, 42, 0.15);
	border: 1px solid #e2e8f0;
	overflow: hidden;
	margin-bottom: 2rem;
	backdrop-filter: blur(10px);
`;

const StepHeader = styled.div`
	background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
	color: #ffffff;
	padding: 2.5rem;
	display: flex;
	align-items: center;
	justify-content: space-between;
	position: relative;
	overflow: hidden;
	
	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%);
		animation: shimmer 3s infinite;
	}
	
	@keyframes shimmer {
		0% { transform: translateX(-100%); }
		100% { transform: translateX(100%); }
	}
`;

const StepHeaderLeft = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	position: relative;
	z-index: 1;
`;

const StepBadge = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	background: rgba(255, 255, 255, 0.25);
	border: 1px solid rgba(255, 255, 255, 0.4);
	border-radius: 999px;
	padding: 0.5rem 1rem;
	font-size: 0.75rem;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	backdrop-filter: blur(10px);
`;

const StepTitle = styled.h2`
	margin: 0;
	font-size: 1.75rem;
	font-weight: 700;
	letter-spacing: -0.025em;
	text-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const StepSubtitle = styled.p`
	margin: 0;
	font-size: 1.125rem;
	opacity: 0.95;
	line-height: 1.5;
	font-weight: 400;
`;

const StepContent = styled.div`
	padding: 2.5rem;
`;

const V7Notice = styled.div`
	background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
	border: 1px solid #3b82f6;
	border-radius: 1rem;
	padding: 1.5rem;
	margin-bottom: 2rem;
	display: flex;
	align-items: center;
	gap: 1rem;
	box-shadow: 0 4px 6px rgba(59, 130, 246, 0.1);
`;

const V7NoticeContent = styled.div`
	flex: 1;
`;

const V7NoticeTitle = styled.div`
	font-weight: 700;
	color: #1e40af;
	margin-bottom: 0.5rem;
	font-size: 1.125rem;
`;

const V7NoticeText = styled.div`
	font-size: 0.875rem;
	color: #1e3a8a;
	line-height: 1.5;
`;

const FormSection = styled.div`
	margin-bottom: 2.5rem;
`;

const SectionTitle = styled.h3`
	margin: 0 0 1.5rem 0;
	display: flex;
	align-items: center;
	gap: 0.75rem;
	font-size: 1.25rem;
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
	gap: 0.75rem;
`;

const FormLabel = styled.label`
	font-weight: 600;
	color: #374151;
	font-size: 0.875rem;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const V7Badge = styled.span`
	font-size: 0.75rem;
	background: linear-gradient(135deg, #3b82f6, #1d4ed8);
	color: white;
	padding: 0.25rem 0.5rem;
	border-radius: 0.375rem;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.025em;
`;

const FormInput = styled.input<{ $isMock?: boolean }>`
	width: 100%;
	padding: 1rem;
	border: 2px solid #e5e7eb;
	border-radius: 0.75rem;
	font-size: 1rem;
	background: ${props => props.$isMock ? '#fef3c7' : '#ffffff'};
	transition: all 0.2s ease;
	
	&:focus {
		outline: none;
		border-color: #7c3aed;
		box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.1);
		transform: translateY(-1px);
	}
	
	&:hover {
		border-color: #d1d5db;
	}
`;

const PasswordInputContainer = styled.div`
	position: relative;
`;

const PasswordToggle = styled.button`
	position: absolute;
	right: 1rem;
	top: 50%;
	transform: translateY(-50%);
	background: none;
	border: none;
	cursor: pointer;
	color: #6b7280;
	padding: 0.5rem;
	border-radius: 0.375rem;
	transition: all 0.2s ease;
	
	&:hover {
		color: #374151;
		background: #f3f4f6;
	}
`;

const ActionButton = styled.button<{ variant?: 'primary' | 'secondary' | 'success' }>`
	display: inline-flex;
	align-items: center;
	gap: 0.75rem;
	padding: 1rem 2rem;
	border-radius: 0.75rem;
	font-weight: 600;
	border: none;
	cursor: pointer;
	transition: all 0.3s ease;
	font-size: 1rem;
	position: relative;
	overflow: hidden;
	
	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
		transition: left 0.5s;
	}
	
	&:hover::before {
		left: 100%;
	}
	
	${props => props.variant === 'primary' && `
		background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
		color: white;
		box-shadow: 0 4px 15px rgba(124, 58, 237, 0.3);
		&:hover { 
			transform: translateY(-2px);
			box-shadow: 0 8px 25px rgba(124, 58, 237, 0.4);
		}
		&:disabled { 
			background: #9ca3af; 
			cursor: not-allowed; 
			transform: none;
			box-shadow: none;
		}
	`}
	
	${props => props.variant === 'success' && `
		background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
		color: white;
		box-shadow: 0 4px 15px rgba(22, 163, 74, 0.3);
		&:hover { 
			transform: translateY(-2px);
			box-shadow: 0 8px 25px rgba(22, 163, 74, 0.4);
		}
		&:disabled { 
			background: #9ca3af; 
			cursor: not-allowed; 
			transform: none;
			box-shadow: none;
		}
	`}
	
	${props => props.variant === 'secondary' && `
		background: #f8fafc;
		color: #374151;
		border: 2px solid #e2e8f0;
		&:hover { 
			background: #f1f5f9; 
			border-color: #cbd5e1;
			transform: translateY(-1px);
		}
		&:disabled { 
			background: #f9fafb; 
			cursor: not-allowed; 
			transform: none;
		}
	`}
`;

const ResultCard = styled.div`
	background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
	border: 2px solid #22c55e;
	border-radius: 1rem;
	padding: 2rem;
	margin-top: 2rem;
	box-shadow: 0 4px 6px rgba(34, 197, 94, 0.1);
`;

const ResultHeader = styled.h4`
	margin: 0 0 1.5rem 0;
	display: flex;
	align-items: center;
	gap: 0.75rem;
	color: #15803d;
	font-weight: 700;
	font-size: 1.125rem;
`;

const TokenDisplay = styled.div`
	background: #ffffff;
	border: 2px solid #e5e7eb;
	border-radius: 0.75rem;
	padding: 1.5rem;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.875rem;
	word-break: break-all;
	margin-bottom: 1.5rem;
	box-shadow: 0 2px 4px rgba(0,0,0,0.05);
`;

const TokenMeta = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 1.5rem;
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

const OAuthROPCFlowV7: React.FC = () => {
	// Use existing V5 controller with V7 flow key
	const controller = useResourceOwnerPasswordFlowV5({
		flowKey: 'oauth-ropc-v7',
		enableDebugger: true,
	});

	const [showPassword, setShowPassword] = useState(false);
	const [showClientSecret, setShowClientSecret] = useState(false);

	// Page scroll management
	usePageScroll({ pageName: 'OAuthROPCFlowV7', force: true });

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
							{/* V7 Implementation Notice */}
							<V7Notice>
								<FiInfo size={24} style={{ color: '#1e40af', flexShrink: 0 }} />
								<V7NoticeContent>
									<V7NoticeTitle>🚀 V7 Enhanced Implementation</V7NoticeTitle>
									<V7NoticeText>
										This is the latest V7 implementation of the OAuth Resource Owner Password Credentials (ROPC) flow. 
										It features enhanced UI, improved error handling, and better user experience while maintaining 
										compatibility with your real PingOne credentials.
									</V7NoticeText>
								</V7NoticeContent>
							</V7Notice>

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
											<V7Badge>V7</V7Badge>
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
											<V7Badge>V7</V7Badge>
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

								<div style={{ marginTop: '2.5rem' }}>
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
								<p style={{ marginBottom: '2rem', color: '#6b7280', fontSize: '1rem', lineHeight: '1.6' }}>
									This step will exchange the username and password for an access token using the
									Resource Owner Password Credentials grant. This is a direct authentication method
									that bypasses the browser redirect flow.
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
										<div style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
											<strong>Access Token:</strong>
											<ActionButton
												variant="secondary"
												style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}
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
								<p style={{ marginBottom: '2rem', color: '#6b7280', fontSize: '1rem', lineHeight: '1.6' }}>
									Fetch user information using the access token from the previous step. This demonstrates
									how to use the access token to access protected resources.
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
								<p style={{ marginBottom: '2rem', color: '#6b7280', fontSize: '1rem', lineHeight: '1.6' }}>
									Use the refresh token to obtain a new access token without re-authenticating the user.
									This is essential for maintaining long-lived sessions.
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
									<p style={{ color: '#dc2626', marginTop: '1.5rem', fontSize: '0.875rem' }}>
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
										<div style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
											<strong>New Access Token:</strong>
											<ActionButton
												variant="secondary"
												style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}
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
				{/* V7 Flow Header */}
				<FlowHeader flowId="oauth-ropc-v7" />

				{/* Educational Content */}
				<EducationalContentService 
					flowType="resource-owner-password"
					title="Understanding OAuth Resource Owner Password Credentials (ROPC) Flow"
					theme="purple"
					defaultCollapsed={false}
				/>

				{/* Enhanced Flow Info */}
				<EnhancedFlowInfoCard
					flowType="oauth-ropc-v7"
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
				<EnhancedFlowWalkthrough flowId="oauth-ropc-v7" />

				{/* Flow Sequence Display */}
				<FlowSequenceDisplay flowType="resource-owner-password" />
			</ContentWrapper>
		</Container>
	);
};

export default OAuthROPCFlowV7;

