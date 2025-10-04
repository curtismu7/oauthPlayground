// src/pages/flows/OAuthResourceOwnerPasswordFlowV5.tsx
// V5.0.0 OAuth Resource Owner Password Flow - Full V5 Implementation with Enhanced FlowInfoService

import React, { useCallback, useEffect, useState } from 'react';
import { FiCheckCircle, FiInfo, FiRefreshCw, FiUser, FiAlertTriangle } from 'react-icons/fi';
import styled from 'styled-components';
import EnhancedFlowInfoCard from '../../components/EnhancedFlowInfoCard';
import ConfigurationSummaryCard from '../../components/ConfigurationSummaryCard';
import FlowConfigurationRequirements from '../../components/FlowConfigurationRequirements';
import { StepNavigationButtons } from '../../components/StepNavigationButtons';
import EnhancedFlowWalkthrough from '../../components/EnhancedFlowWalkthrough';
import FlowSequenceDisplay from '../../components/FlowSequenceDisplay';
import { ExplanationHeading, ExplanationSection } from '../../components/InfoBlocks';
import { ResultsHeading, ResultsSection } from '../../components/ResultsPanel';
import { useResourceOwnerPasswordFlowController } from '../../hooks/useResourceOwnerPasswordFlowController';
import { usePageScroll } from '../../hooks/usePageScroll';
import { FlowHeader } from '../../services/flowHeaderService';
import { v4ToastManager } from '../../utils/v4ToastMessages';
import { storeFlowNavigationState } from '../../utils/flowNavigation';

const STEP_METADATA = [
	{
		title: 'Step 0: Introduction & Setup',
		subtitle: 'Understand OAuth Resource Owner Password Flow and configure credentials',
	},
	{
		title: 'Step 1: Password Grant Request',
		subtitle: 'Request access token using username and password',
	},
	{ title: 'Step 2: Token Response', subtitle: 'Review the received access token' },
	{ title: 'Step 3: Flow Complete', subtitle: 'Review results and next steps' },
] as const;

type StepIndex = 0 | 1 | 2 | 3;

const Container = styled.div`
	max-width: 1200px;
	margin: 0 auto;
	padding: 2rem;
`;

const ContentWrapper = styled.div`
	display: flex;
	flex-direction: column;
	gap: 2rem;
`;

const MainCard = styled.div`
	background: white;
	border-radius: 12px;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	overflow: hidden;
`;

const StepHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 1.5rem;
	background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
	color: white;
`;

const StepHeaderLeft = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`;

const VersionBadge = styled.span`
	background: rgba(255, 255, 255, 0.2);
	padding: 0.25rem 0.75rem;
	border-radius: 12px;
	font-size: 0.75rem;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.05em;
`;

const StepHeaderTitle = styled.h2`
	font-size: 1.5rem;
	font-weight: 700;
	margin: 0;
`;

const StepHeaderSubtitle = styled.p`
	font-size: 1rem;
	opacity: 0.9;
	margin: 0;
`;

const StepHeaderRight = styled.div`
	display: flex;
	align-items: center;
	gap: 1rem;
`;

const StepNumber = styled.span`
	background: rgba(255, 255, 255, 0.2);
	padding: 0.5rem;
	border-radius: 50%;
	width: 40px;
	height: 40px;
	display: flex;
	align-items: center;
	justify-content: center;
	font-weight: 700;
`;

const StepTotal = styled.span`
	opacity: 0.8;
	font-size: 0.875rem;
`;

const StepContent = styled.div`
	padding: 2rem;
`;

const FormSection = styled.div`
	background: #f9fafb;
	border-radius: 8px;
	padding: 1.5rem;
	margin-bottom: 2rem;
`;

const FormTitle = styled.h3`
	font-size: 1.25rem;
	font-weight: 600;
	color: #1f2937;
	margin-bottom: 1rem;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const FormGrid = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 1rem;
	margin-bottom: 1rem;

	@media (max-width: 768px) {
		grid-template-columns: 1fr;
	}
`;

const FormGroup = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`;

const Label = styled.label`
	font-weight: 500;
	color: #374151;
	font-size: 0.875rem;
`;

const Input = styled.input`
	padding: 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 6px;
	font-size: 0.875rem;
	transition: border-color 0.2s ease;

	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
	padding: 0.75rem 1.5rem;
	border-radius: 6px;
	font-weight: 500;
	font-size: 0.875rem;
	cursor: pointer;
	transition: all 0.2s ease;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	border: none;

	${({ variant = 'primary' }) => {
		switch (variant) {
			case 'primary':
				return `
					background: #3b82f6;
					color: white;
					&:hover:not(:disabled) {
						background: #2563eb;
					}
				`;
			case 'secondary':
				return `
					background: #f3f4f6;
					color: #374151;
					&:hover:not(:disabled) {
						background: #e5e7eb;
					}
				`;
			case 'danger':
				return `
					background: #ef4444;
					color: white;
					&:hover:not(:disabled) {
						background: #dc2626;
					}
				`;
		}
	}}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

const ResultsContainer = styled.div`
	background: #f9fafb;
	border-radius: 8px;
	padding: 1.5rem;
	margin-top: 1rem;
`;

const SuccessMessage = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	color: #059669;
	font-weight: 500;
	margin-bottom: 1rem;
`;

const ErrorMessage = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	color: #dc2626;
	font-weight: 500;
	margin-bottom: 1rem;
`;

const WarningMessage = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	color: #d97706;
	font-weight: 500;
	margin-bottom: 1rem;
	background: #fef3c7;
	padding: 1rem;
	border-radius: 6px;
	border-left: 4px solid #f59e0b;
`;

const TokenInfo = styled.div`
	background: white;
	border-radius: 6px;
	padding: 1rem;
	margin-bottom: 1rem;
	border-left: 4px solid #10b981;
`;

const TokenInfoRow = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 0.5rem 0;
	border-bottom: 1px solid #e5e7eb;

	&:last-child {
		border-bottom: none;
	}
`;

const TokenInfoLabel = styled.span`
	font-weight: 500;
	color: #374151;
`;

const TokenInfoValue = styled.span`
	color: #1f2937;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.875rem;
`;

const OAuthResourceOwnerPasswordFlowV5: React.FC = () => {
	const [currentStep, setCurrentStep] = useState<StepIndex>(() => {
		// Check for restore_step from token management navigation
		const restoreStep = sessionStorage.getItem('restore_step');
		if (restoreStep) {
			const step = parseInt(restoreStep, 10);
			sessionStorage.removeItem('restore_step'); // Clear after use
			console.log('🔗 [OAuthResourceOwnerPasswordFlowV5] Restoring to step:', step);
			return step as StepIndex;
		}
		return 0;
	});
	const [isRequesting, setIsRequesting] = useState(false);
	const [tokenResult, setTokenResult] = useState<unknown>(null);
	const [error, setError] = useState<string | null>(null);

	usePageScroll();

	// Navigate to token management with flow state
	const navigateToTokenManagement = useCallback(() => {
		// Store flow navigation state for back navigation
		storeFlowNavigationState('oauth-resource-owner-password-v5', currentStep, 'oauth');

		// If we have tokens, pass them to Token Management
		if (tokens?.access_token) {
			// Use localStorage for cross-tab communication
			localStorage.setItem('token_to_analyze', tokens.access_token);
			localStorage.setItem('token_type', 'access');
			localStorage.setItem('flow_source', 'oauth-resource-owner-password-v5');
			console.log(
				'🔍 [OAuthResourceOwnerPasswordFlowV5] Passing access token to Token Management via localStorage'
			);
		}

		window.open('/token-management', '_blank');
	}, [tokens, currentStep]);

	// Scroll to top when step changes
	useEffect(() => {
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}, [currentStep]);

	const { credentials, tokens, requestToken, clearResults, updateCredentials, saveCredentials } =
		useResourceOwnerPasswordFlowController();

	const handleNext = useCallback(() => {
		if (currentStep < 3) {
			setCurrentStep((prev) => (prev + 1) as StepIndex);
		}
	}, [currentStep]);

	const handlePrevious = useCallback(() => {
		if (currentStep > 0) {
			setCurrentStep((prev) => (prev - 1) as StepIndex);
		}
	}, [currentStep]);

	const handleReset = useCallback(() => {
		setCurrentStep(0);
		setTokenResult(null);
		setError(null);
		clearResults();
	}, [clearResults]);

	const handleRequestToken = useCallback(async () => {
		if (!credentials.username || !credentials.password || !credentials.clientId) {
			setError('Please provide username, password, and client ID');
			return;
		}

		setIsRequesting(true);
		setError(null);

		try {
			const result = await requestToken();
			setTokenResult(result);
			v4ToastManager.showSuccess('OAuth Resource Owner Password token requested successfully!');
			handleNext();
		} catch (err) {
			const errorMessage =
				err instanceof Error
					? err.message
					: 'Failed to request OAuth Resource Owner Password token';
			setError(errorMessage);
			v4ToastManager.showError(errorMessage);
		} finally {
			setIsRequesting(false);
		}
	}, [credentials, requestToken, handleNext]);

	const canNavigateNext = currentStep === 0 || (currentStep === 1 && !!tokenResult);

	// Get step completion requirements for user guidance
	const getStepRequirements = useCallback((stepIndex: number): string[] => {
		switch (stepIndex) {
			case 0: // Step 0: Introduction & Setup
				return ['Review the flow overview and setup credentials'];
			case 1: // Step 1: Token Request
				return ['Enter username and password, then request access token'];
			default:
				return [];
		}
	}, []);

	const renderStepContent = () => {
		switch (currentStep) {
			case 0:
				return (
					<>
						<FlowConfigurationRequirements flowType="resource-owner-password" variant="oauth" />

						<ExplanationSection>
							<ExplanationHeading>
								<FiUser /> OAuth Resource Owner Password Flow
							</ExplanationHeading>
							<p>
								The OAuth Resource Owner Password Flow allows clients to authenticate users by
								exchanging username and password credentials for access tokens. This flow is
								deprecated and should only be used for legacy migration scenarios.
							</p>
						</ExplanationSection>

						<WarningMessage>
							<FiAlertTriangle />
							<strong>Deprecated Flow:</strong> This flow is not recommended for new applications.
							Consider using Authorization Code Flow with PKCE for better security.
						</WarningMessage>

						<EnhancedFlowWalkthrough flowId="oauth-resource-owner-password" />
						<FlowSequenceDisplay flowType="resource-owner-password" />

						{/* Configuration Summary */}
						<ConfigurationSummaryCard
							configuration={credentials}
							hasConfiguration={Boolean(credentials?.clientId)}
							onSaveConfiguration={saveCredentials}
							onLoadConfiguration={(config) => {
								if (config) {
									updateCredentials(config);
									v4ToastManager.showSuccess('Configuration loaded successfully!');
								}
							}}
						/>
					</>
				);

			case 1:
				return (
					<>
						<FormSection>
							<FormTitle>
								<FiUser /> Request OAuth Resource Owner Password Token
							</FormTitle>
							<ConfigurationSummaryCard
								configuration={credentials}
								hasConfiguration={Boolean(credentials?.clientId)}
							/>
							<form>
								<FormGrid>
								<FormGroup>
									<Label>Client ID</Label>
									<Input
										placeholder="Enter client ID..."
										value={credentials.clientId || ''}
										onChange={(e) => updateCredentials({ clientId: e.target.value })}
									/>
								</FormGroup>
								<FormGroup>
									<Label>Client Secret (optional)</Label>
									<Input
										type="password"
										placeholder="Enter client secret..."
										value={credentials.clientSecret || ''}
										onChange={(e) => updateCredentials({ clientSecret: e.target.value })}
										autoComplete="current-password"
									/>
								</FormGroup>
								<FormGroup>
									<Label>Username</Label>
									<Input
										placeholder="Enter username..."
										value={credentials.username || ''}
										onChange={(e) => updateCredentials({ username: e.target.value })}
									/>
								</FormGroup>
								<FormGroup>
									<Label>Password</Label>
									<Input
										type="password"
										placeholder="Enter password..."
										value={credentials.password || ''}
										onChange={(e) => updateCredentials({ password: e.target.value })}
										autoComplete="current-password"
									/>
								</FormGroup>
								<FormGroup>
									<Label>Token Endpoint</Label>
									<Input
										placeholder="Enter token endpoint URL..."
										value={credentials.tokenEndpoint || ''}
										onChange={(e) => updateCredentials({ tokenEndpoint: e.target.value })}
									/>
								</FormGroup>
							</FormGrid>
							<Button
								variant="danger"
								onClick={handleRequestToken}
								disabled={
									isRequesting ||
									!credentials.username ||
									!credentials.password ||
									!credentials.clientId
								}
							>
								{isRequesting ? <FiRefreshCw className="animate-spin" /> : <FiUser />}
								{isRequesting ? 'Requesting...' : 'Request OAuth Resource Owner Password Token'}
							</Button>
							</form>
						</FormSection>

						{error && (
							<ErrorMessage>
								<FiInfo />
								{error}
							</ErrorMessage>
						)}

						{tokenResult && (
							<ResultsContainer>
								<SuccessMessage>
									<FiCheckCircle />
									OAuth Resource Owner Password token requested successfully!
								</SuccessMessage>

								<TokenInfo>
									<TokenInfoRow>
										<TokenInfoLabel>Access Token:</TokenInfoLabel>
										<TokenInfoValue>
											{tokens?.access_token
												? tokens.access_token.substring(0, 50) + '...'
												: 'Not available'}
										</TokenInfoValue>
									</TokenInfoRow>
									{tokens?.token_type && (
										<TokenInfoRow>
											<TokenInfoLabel>Token Type:</TokenInfoLabel>
											<TokenInfoValue>{tokens.token_type}</TokenInfoValue>
										</TokenInfoRow>
									)}
									{tokens?.expires_in && (
										<TokenInfoRow>
											<TokenInfoLabel>Expires In:</TokenInfoLabel>
											<TokenInfoValue>{tokens.expires_in} seconds</TokenInfoValue>
										</TokenInfoRow>
									)}
									{tokens?.scope && (
										<TokenInfoRow>
											<TokenInfoLabel>Scope:</TokenInfoLabel>
											<TokenInfoValue>{tokens.scope}</TokenInfoValue>
										</TokenInfoRow>
									)}
								</TokenInfo>

								{/* Token Management Button */}
								{tokens?.access_token && (
									<ResultsSection>
										<Button onClick={navigateToTokenManagement} $variant="primary">
											Open Token Management
										</Button>
									</ResultsSection>
								)}

								<ResultsSection>
									<ResultsHeading>Full Token Response</ResultsHeading>
									<pre
										style={{
											background: '#f3f4f6',
											padding: '1rem',
											borderRadius: '6px',
											overflow: 'auto',
										}}
									>
										{JSON.stringify(tokenResult, null, 2)}
									</pre>
								</ResultsSection>
							</ResultsContainer>
						)}
					</>
				);

			case 2:
				return (
					<>
						<ResultsSection>
							<ResultsHeading>Token Request Complete</ResultsHeading>
							<p>
								The OAuth Resource Owner Password token has been successfully requested. You now
								have an access token that can be used for API authentication.
							</p>
						</ResultsSection>

						<ResultsSection>
							<ResultsHeading>Key Information</ResultsHeading>
							<ul style={{ paddingLeft: '1.5rem' }}>
								<li>
									<strong>Access Token:</strong>{' '}
									{tokens?.access_token ? 'Received' : 'Not available'}
								</li>
								<li>
									<strong>Token Type:</strong> {tokens?.token_type || 'Not specified'}
								</li>
								<li>
									<strong>Expires In:</strong>{' '}
									{tokens?.expires_in ? `${tokens.expires_in} seconds` : 'Not specified'}
								</li>
								<li>
									<strong>Scope:</strong> {tokens?.scope || 'Not specified'}
								</li>
							</ul>
						</ResultsSection>

						<WarningMessage>
							<FiAlertTriangle />
							<strong>Migration Recommendation:</strong> Consider migrating to Authorization Code
							Flow with PKCE for better security and user experience.
						</WarningMessage>

						<ResultsSection>
							<ResultsHeading>Next Steps</ResultsHeading>
							<ul style={{ paddingLeft: '1.5rem' }}>
								<li>Use the access token for API authentication</li>
								<li>Implement proper token storage and management</li>
								<li>Handle token expiration and refresh scenarios</li>
								<li>Plan migration to Authorization Code Flow with PKCE</li>
							</ul>
						</ResultsSection>
					</>
				);

			case 3:
				return (
					<>
						<ResultsSection>
							<ResultsHeading>Flow Complete</ResultsHeading>
							<p>
								You have successfully completed the OAuth Resource Owner Password Flow V5. This flow
								demonstrates how to authenticate users using username and password credentials for
								legacy migration scenarios.
							</p>
						</ResultsSection>

						<ResultsSection>
							<ResultsHeading>What You Learned</ResultsHeading>
							<ul style={{ paddingLeft: '1.5rem' }}>
								<li>How to use OAuth Resource Owner Password Flow for authentication</li>
								<li>Username and password credential handling</li>
								<li>Access token management</li>
								<li>Legacy migration considerations</li>
							</ul>
						</ResultsSection>

						<WarningMessage>
							<FiAlertTriangle />
							<strong>Important:</strong> This flow is deprecated. For new applications, use
							Authorization Code Flow with PKCE.
						</WarningMessage>
					</>
				);

			default:
				return null;
		}
	};

	return (
		<Container>
			<ContentWrapper>
				<FlowHeader flowId="oauth-resource-owner-password-v5" />

				<EnhancedFlowInfoCard
					flowType="oauth-resource-owner-password"
					showAdditionalInfo={true}
					showDocumentation={true}
					showCommonIssues={false}
					showImplementationNotes={false}
				/>

				<MainCard>
					<StepHeader>
						<StepHeaderLeft>
							<VersionBadge>OAuth Resource Owner Password Flow · V5 · Legacy</VersionBadge>
							<StepHeaderTitle>{STEP_METADATA[currentStep].title}</StepHeaderTitle>
							<StepHeaderSubtitle>{STEP_METADATA[currentStep].subtitle}</StepHeaderSubtitle>
						</StepHeaderLeft>
						<StepHeaderRight>
							<StepNumber>{currentStep + 1}</StepNumber>
							<StepTotal>of {STEP_METADATA.length}</StepTotal>
						</StepHeaderRight>
					</StepHeader>

					<StepContent>{renderStepContent()}</StepContent>
				</MainCard>
			</ContentWrapper>

			<StepNavigationButtons
				currentStep={currentStep}
				totalSteps={STEP_METADATA.length}
				onPrevious={handlePrevious}
				onReset={handleReset}
				onNext={handleNext}
				canNavigateNext={canNavigateNext}
				isFirstStep={currentStep === 0}
				nextButtonText={canNavigateNext ? 'Next' : 'Complete above action'}
				disabledMessage="Complete the action above to continue"
				stepRequirements={getStepRequirements(currentStep)}
				onCompleteAction={handleNext}
				showCompleteActionButton={!canNavigateNext && currentStep !== 0}
			/>
		</Container>
	);
};

export default OAuthResourceOwnerPasswordFlowV5;
