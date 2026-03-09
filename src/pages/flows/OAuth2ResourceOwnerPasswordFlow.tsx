// lint-file-disable: token-value-in-jsx
import type React from 'react';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { modernMessaging } from '@/services/v9/V9ModernMessagingService';
import type { DiscoveredApp } from '@/v8/components/AppPickerV8';
import { CompactAppPickerV8U } from '@/v8u/components/CompactAppPickerV8U';
import CollapsibleSection from '../../components/CollapsibleSection';
import { StepNavigationButtons } from '../../components/StepNavigationButtons';
import { useResourceOwnerPasswordFlowV7 } from '../../hooks/useResourceOwnerPasswordFlowV7';
import { FlowHeader } from '../../services/flowHeaderService';
import { UnifiedTokenDisplayService } from '../../services/unifiedTokenDisplayService';
import { UserSearchDropdownV8 } from '../../v8/components/UserSearchDropdownV8';

const PageContainer = styled.div`
	max-width: 1200px;
	margin: 0 auto;
	padding: 2rem;
`;

const WarningCard = styled.div`
	background: V9_COLORS.BG.ERROR;
	border: 2px solid V9_COLORS.BG.ERROR_BORDER;
	border-radius: 0.75rem;
	padding: 2rem;
	margin-bottom: 2rem;
	display: flex;
	align-items: flex-start;
	gap: 1rem;
`;

const InfoCard = styled.div`
	background: V9_COLORS.BG.GRAY_LIGHT;
	border: 2px solid V9_COLORS.TEXT.GRAY_LIGHTER;
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
	background: V9_COLORS.TEXT.WHITE;
	border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
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
	color: V9_COLORS.TEXT.GRAY_DARK;
`;

const FormInput = styled.input`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
	border-radius: 0.5rem;
	font-size: 1rem;
	
	&:focus {
		outline: none;
		border-color: V9_COLORS.PRIMARY.BLUE;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`;

const _FormTextarea = styled.textarea`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
	border-radius: 0.5rem;
	font-size: 1rem;
	min-height: 100px;
	resize: vertical;
	
	&:focus {
		outline: none;
		border-color: V9_COLORS.PRIMARY.BLUE;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
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
		props.$variant === 'primary' &&
		`
		background: V9_COLORS.PRIMARY.BLUE;
		color: white;
		&:hover { background: V9_COLORS.PRIMARY.BLUE_DARK; }
		&:disabled { background: V9_COLORS.TEXT.GRAY_LIGHT; cursor: not-allowed; }
	`}
	
	${(props) =>
		props.$variant === 'secondary' &&
		`
		background: #f3f4f6;
		color: V9_COLORS.TEXT.GRAY_DARK;
		&:hover { background: V9_COLORS.TEXT.GRAY_LIGHTER; }
		&:disabled { background: #f9fafb; cursor: not-allowed; }
	`}
	
	${(props) =>
		props.$variant === 'danger' &&
		`
		background: V9_COLORS.PRIMARY.RED_DARK;
		color: white;
		&:hover { background: V9_COLORS.PRIMARY.RED_DARK; }
		&:disabled { background: V9_COLORS.TEXT.GRAY_LIGHT; cursor: not-allowed; }
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
	color: V9_COLORS.TEXT.GRAY_MEDIUM;
	
	&:hover {
		color: V9_COLORS.TEXT.GRAY_DARK;
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

	// Handle app selection from CompactAppPickerV8U
	const handleAppSelected = (app: DiscoveredApp) => {
		controller.setCredentials({
			...controller.credentials,
			environmentId: app.environmentId,
			clientId: app.clientId,
			clientSecret: app.clientSecret || '',
		});
	};

	const _copyToClipboard = (text: string, label: string) => {
		navigator.clipboard.writeText(text);
		modernMessaging.showFooterMessage({
			type: 'info',
			message: `${label} copied to clipboard`,
			duration: 3000,
		});
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
							<span>🔑</span>PingOne Configuration
						</h3>

						{/* App Picker for Quick Configuration */}
						<CompactAppPickerV8U
							environmentId={controller.credentials.environmentId || ''}
							onAppSelected={handleAppSelected}
						/>

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
										{showClientSecret ? (
											<i className="bi bi-eye-slash" />
										) : (
											<i className="bi bi-eye" />
										)}
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
								<span>👤</span>User Credentials
							</h3>

							<FormGroup>
								<FormLabel>Username</FormLabel>
								<UserSearchDropdownV8
									environmentId={controller.credentials.environmentId}
									value={controller.credentials.username}
									onChange={(value) => handleCredentialChange('username', value)}
									placeholder="Search for a user by ID, username, or email..."
									disabled={!controller.credentials.environmentId.trim()}
									autoLoad={true}
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
										{showPassword ? <i className="bi bi-eye-slash" /> : <i className="bi bi-eye" />}
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
									$
									variant="primary"
									onClick={controller.saveCredentials}
									disabled={controller.isSavingCredentials}
								>
									{controller.isSavingCredentials ? (
										<SpinningIcon>
											<span>🔄</span>
										</SpinningIcon>
									) : (
										<span>✅</span>
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
							<span>🔒</span>Resource Owner Password Authentication
						</h3>

						<p style={{ marginBottom: '1.5rem', color: '#6b7280' }}>
							This step will exchange the username and password for an access token using the
							Resource Owner Password Credentials grant.
						</p>

						<Button
							$
							variant="primary"
							onClick={controller.authenticateUser}
							disabled={controller.isAuthenticating || !controller.hasCredentialsSaved}
						>
							{controller.isAuthenticating ? (
								<SpinningIcon>
									<span>🔄</span>
								</SpinningIcon>
							) : (
								<span>🔒</span>
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
									<span>✅</span>Access Token Received
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
							<span>👤</span>User Information
						</h3>

						<p style={{ marginBottom: '1.5rem', color: '#6b7280' }}>
							Fetch user information using the access token from the previous step.
						</p>

						<Button
							$
							variant="primary"
							onClick={controller.fetchUserInfo}
							disabled={controller.isFetchingUserInfo || !controller.tokens}
						>
							{controller.isFetchingUserInfo ? (
								<SpinningIcon>
									<span>🔄</span>
								</SpinningIcon>
							) : (
								<span>👤</span>
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
									<span>✅</span>User Information
								</h4>

								<div
									style={{
										background: '#f8fafc',
										border: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
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
							<span>🔄</span>Token Refresh
						</h3>

						<p style={{ marginBottom: '1.5rem', color: '#6b7280' }}>
							Use the refresh token to obtain a new access token without re-authenticating.
						</p>

						<Button
							$
							variant="primary"
							onClick={controller.refreshTokens}
							disabled={controller.isRefreshingTokens || !controller.tokens?.refresh_token}
						>
							{controller.isRefreshingTokens ? (
								<SpinningIcon>
									<span>🔄</span>
								</SpinningIcon>
							) : (
								<span>🔄</span>
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
											<span>ℹ️</span>Before Refresh
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
										<span>✅</span>After Refresh
									</h4>
									<InfoCard style={{ marginBottom: '1rem', padding: '1rem' }}>
										<span>ℹ️</span>
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
					<span>⚠️</span>
					<CardContent>
						<CardText style={{ color: '#dc2626' }}>
							The Resource Owner Password Credentials flow is <strong>deprecated</strong> and should
							be avoided in most cases due to significant security risks. This flow requires the
							application to collect and handle user credentials directly.
						</CardText>
						<CardList style={{ color: '#dc2626' }}>
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
					<span>ℹ️</span>
					<CardContent>
						<CardText style={{ color: '#1f2937' }}>
							This flow should only be used in very specific, high-trust scenarios:
						</CardText>
						<CardList style={{ color: '#1f2937' }}>
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
					<span>👤</span>
					<CardContent>
						<CardText style={{ color: '#1f2937' }}>
							Instead of the Resource Owner Password flow, consider these more secure alternatives:
						</CardText>
						<CardList style={{ color: '#1f2937' }}>
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
