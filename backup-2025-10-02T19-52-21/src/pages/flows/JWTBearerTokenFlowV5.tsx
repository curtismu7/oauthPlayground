// src/pages/flows/JWTBearerTokenFlowV5.tsx
// V5.0.0 JWT Bearer Token Flow - Full V5 Implementation with Enhanced FlowInfoService

import React, { useCallback, useState } from 'react';
import { FiCheckCircle, FiInfo, FiRefreshCw, FiLock } from 'react-icons/fi';
import styled from 'styled-components';
import EnhancedFlowInfoCard from '../../components/EnhancedFlowInfoCard';
import ConfigurationSummaryCard from '../../components/ConfigurationSummaryCard';
import FlowConfigurationRequirements from '../../components/FlowConfigurationRequirements';
import { StepNavigationButtons } from '../../components/StepNavigationButtons';
import EnhancedFlowWalkthrough from '../../components/EnhancedFlowWalkthrough';
import FlowSequenceDisplay from '../../components/FlowSequenceDisplay';
import { ExplanationHeading, ExplanationSection } from '../../components/InfoBlocks';
import { ResultsHeading, ResultsSection } from '../../components/ResultsPanel';
import { useJWTBearerFlowController } from '../../hooks/useJWTBearerFlowController';
import { FlowHeader } from '../../services/flowHeaderService';
import { v4ToastManager } from '../../utils/v4ToastMessages';

const STEP_METADATA = [
	{
		title: 'Step 0: Introduction & Setup',
		subtitle: 'Understand JWT Bearer Token Flow and configure credentials',
	},
	{
		title: 'Step 1: JWT Bearer Token Request',
		subtitle: 'Request access token using JWT Bearer assertion',
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
	background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
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

const TextArea = styled.textarea`
	padding: 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 6px;
	font-size: 0.875rem;
	min-height: 100px;
	resize: vertical;
	transition: border-color 0.2s ease;

	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'success' }>`
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
			case 'success':
				return `
					background: #10b981;
					color: white;
					&:hover:not(:disabled) {
						background: #059669;
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

const JWTInfo = styled.div`
	background: white;
	border-radius: 6px;
	padding: 1rem;
	margin-bottom: 1rem;
	border-left: 4px solid #10b981;
`;

const JWTInfoRow = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 0.5rem 0;
	border-bottom: 1px solid #e5e7eb;

	&:last-child {
		border-bottom: none;
	}
`;

const JWTInfoLabel = styled.span`
	font-weight: 500;
	color: #374151;
`;

const JWTInfoValue = styled.span`
	color: #1f2937;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.875rem;
`;

const JWTBearerTokenFlowV5: React.FC = () => {
	const [currentStep, setCurrentStep] = useState<StepIndex>(0);
	const [isRequesting, setIsRequesting] = useState(false);
	const [tokenResult, setTokenResult] = useState<unknown>(null);
	const [error, setError] = useState<string | null>(null);

	const { credentials, tokens, requestToken, clearResults, updateCredentials } =
		useJWTBearerFlowController();

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
		if (!credentials.clientId || !credentials.privateKey) {
			setError('Please provide client ID and private key');
			return;
		}

		setIsRequesting(true);
		setError(null);

		try {
			const result = await requestToken();
			setTokenResult(result);
			v4ToastManager.showSuccess('JWT Bearer token requested successfully!');
			handleNext();
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : 'Failed to request JWT Bearer token';
			setError(errorMessage);
			v4ToastManager.showError(errorMessage);
		} finally {
			setIsRequesting(false);
		}
	}, [credentials, requestToken, handleNext]);

	const canNavigateNext = currentStep === 0 || (currentStep === 1 && !!tokenResult);

	const renderStepContent = () => {
		switch (currentStep) {
			case 0:
				return (
					<>
						<ExplanationSection>
							<ExplanationHeading>JWT Bearer Token Flow</ExplanationHeading>
							<p>
								The JWT Bearer Token Flow allows clients to authenticate using a JWT assertion
								instead of traditional client credentials. This provides enhanced security and
								enables more sophisticated authentication scenarios.
							</p>
						</ExplanationSection>

						<EnhancedFlowWalkthrough flowId="oauth-jwt-bearer" />
						<FlowSequenceDisplay flowType="jwt-bearer" />

						{/* Configuration Summary */}
						<ConfigurationSummaryCard configuration={credentials} />
					</>
				);

			case 1:
				return (
					<>
						<FormSection>
							<FormTitle>
								<FiLock /> Request JWT Bearer Token
							</FormTitle>
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
									<Label>Token Endpoint</Label>
									<Input
										placeholder="Enter token endpoint URL..."
										value={credentials.tokenEndpoint || ''}
										onChange={(e) => updateCredentials({ tokenEndpoint: e.target.value })}
									/>
								</FormGroup>
								<FormGroup>
									<Label>Private Key (PEM format)</Label>
									<TextArea
										placeholder="Enter private key in PEM format..."
										value={credentials.privateKey || ''}
										onChange={(e) => updateCredentials({ privateKey: e.target.value })}
									/>
								</FormGroup>
								<FormGroup>
									<Label>Key ID (optional)</Label>
									<Input
										placeholder="Enter key ID..."
										value={credentials.keyId || ''}
										onChange={(e) => updateCredentials({ keyId: e.target.value })}
									/>
								</FormGroup>
								<FormGroup>
									<Label>Audience (optional)</Label>
									<Input
										placeholder="Enter audience..."
										value={credentials.audience || ''}
										onChange={(e) => updateCredentials({ audience: e.target.value })}
									/>
								</FormGroup>
							</FormGrid>
							<Button
								variant="success"
								onClick={handleRequestToken}
								disabled={isRequesting || !credentials.clientId || !credentials.privateKey}
							>
								{isRequesting ? <FiRefreshCw className="animate-spin" /> : <FiLock />}
								{isRequesting ? 'Requesting...' : 'Request JWT Bearer Token'}
							</Button>
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
									JWT Bearer token requested successfully!
								</SuccessMessage>

								<JWTInfo>
									<JWTInfoRow>
										<JWTInfoLabel>Access Token:</JWTInfoLabel>
										<JWTInfoValue>
											{tokens?.access_token
												? tokens.access_token.substring(0, 50) + '...'
												: 'Not available'}
										</JWTInfoValue>
									</JWTInfoRow>
									{tokens?.token_type && (
										<JWTInfoRow>
											<JWTInfoLabel>Token Type:</JWTInfoLabel>
											<JWTInfoValue>{tokens.token_type}</JWTInfoValue>
										</JWTInfoRow>
									)}
									{tokens?.expires_in && (
										<JWTInfoRow>
											<JWTInfoLabel>Expires In:</JWTInfoLabel>
											<JWTInfoValue>{tokens.expires_in} seconds</JWTInfoValue>
										</JWTInfoRow>
									)}
									{tokens?.scope && (
										<JWTInfoRow>
											<JWTInfoLabel>Scope:</JWTInfoLabel>
											<JWTInfoValue>{tokens.scope}</JWTInfoValue>
										</JWTInfoRow>
									)}
								</JWTInfo>

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
								The JWT Bearer token has been successfully requested. You now have an access token
								that can be used for API authentication.
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

						<ResultsSection>
							<ResultsHeading>Next Steps</ResultsHeading>
							<ul style={{ paddingLeft: '1.5rem' }}>
								<li>Use the access token for API authentication</li>
								<li>Implement proper token storage and management</li>
								<li>Handle token expiration and refresh scenarios</li>
								<li>Consider implementing token introspection for validation</li>
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
								You have successfully completed the JWT Bearer Token Flow V5. This flow demonstrates
								how to authenticate using JWT assertions for enhanced security.
							</p>
						</ResultsSection>

						<ResultsSection>
							<ResultsHeading>What You Learned</ResultsHeading>
							<ul style={{ paddingLeft: '1.5rem' }}>
								<li>How to use JWT Bearer Token Flow for authentication</li>
								<li>JWT assertion creation and signing</li>
								<li>Advanced client authentication methods</li>
								<li>Enhanced security patterns for API access</li>
							</ul>
						</ResultsSection>
					</>
				);

			default:
				return null;
		}
	};

	return (
		<Container>
			<ContentWrapper>
				<FlowHeader flowId="jwt-bearer-token-v5" />

				<EnhancedFlowInfoCard
					flowType="jwt-bearer-token"
					showAdditionalInfo={true}
					showDocumentation={true}
					showCommonIssues={false}
					showImplementationNotes={false}
				/>

				<FlowConfigurationRequirements flowType="jwt-bearer" variant="pingone" />

				<MainCard>
					<StepHeader>
						<StepHeaderLeft>
							<VersionBadge>JWT Bearer Token Flow · V5</VersionBadge>
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
			/>
		</Container>
	);
};

export default JWTBearerTokenFlowV5;
