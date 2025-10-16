// src/pages/flows/TokenIntrospectionFlowV5.tsx
// V5.0.0 Token Introspection Flow - Full V5 Implementation with Enhanced FlowInfoService

import React, { useCallback, useState } from 'react';
import { FiCheckCircle, FiInfo, FiRefreshCw, FiSearch } from 'react-icons/fi';
import styled from 'styled-components';
import EnhancedFlowInfoCard from '../../components/EnhancedFlowInfoCard';
import ConfigurationSummaryCard from '../../components/ConfigurationSummaryCard';
import FlowConfigurationRequirements from '../../components/FlowConfigurationRequirements';
import { StepNavigationButtons } from '../../components/StepNavigationButtons';
import EnhancedFlowWalkthrough from '../../components/EnhancedFlowWalkthrough';
import FlowSequenceDisplay from '../../components/FlowSequenceDisplay';
import { ExplanationHeading, ExplanationSection } from '../../components/InfoBlocks';
import { ResultsHeading, ResultsSection } from '../../components/ResultsPanel';
import { useTokenIntrospectionFlowController } from '../../hooks/useTokenIntrospectionFlowController';
import { FlowHeader } from '../../services/flowHeaderService';
import { v4ToastManager } from '../../utils/v4ToastMessages';

const STEP_METADATA = [
	{
		title: 'Step 0: Introduction & Setup',
		subtitle: 'Understand Token Introspection and configure credentials',
	},
	{
		title: 'Step 1: Token Introspection Request',
		subtitle: 'Introspect access token to get detailed information',
	},
	{ title: 'Step 2: Introspection Response', subtitle: 'Review the token metadata and claims' },
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
	background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);
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

const TokenInfoValue = styled.span<{ $valid?: boolean }>`
	color: ${({ $valid }) => ($valid ? '#059669' : '#dc2626')};
	font-weight: 500;
`;

const TokenIntrospectionFlowV5: React.FC = () => {
	const [currentStep, setCurrentStep] = useState<StepIndex>(0);
	const [isIntrospecting, setIsIntrospecting] = useState(false);
	const [introspectionResult, setIntrospectionResult] = useState<Record<string, unknown> | null>(
		null
	);
	const [error, setError] = useState<string | null>(null);

	const { credentials, introspectToken, clearResults, updateCredentials } =
		useTokenIntrospectionFlowController();

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
		setIntrospectionResult(null);
		setError(null);
		clearResults();
	}, [clearResults]);

	const handleIntrospectToken = useCallback(async () => {
		if (!credentials.token) {
			setError('Please provide a token to introspect');
			return;
		}

		setIsIntrospecting(true);
		setError(null);

		try {
			const result = await introspectToken();
			setIntrospectionResult(result);
			v4ToastManager.showSuccess('Token introspected successfully!');
			handleNext();
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to introspect token';
			setError(errorMessage);
			v4ToastManager.showError(errorMessage);
		} finally {
			setIsIntrospecting(false);
		}
	}, [credentials, introspectToken, handleNext]);

	const canNavigateNext = currentStep === 0 || (currentStep === 1 && !!introspectionResult);

	// Type-safe introspection result
	const safeIntrospectionResult = introspectionResult as Record<string, unknown> | null;

	const renderStepContent = () => {
		switch (currentStep) {
			case 0:
				return (
					<>
						<ExplanationSection>
							<ExplanationHeading>
								<FiSearch /> Token Introspection
							</ExplanationHeading>
							<p>
								Token introspection allows you to get detailed information about an access token,
								including its validity, expiration, scopes, and other claims. This is essential for
								authorization decisions and token validation.
							</p>
						</ExplanationSection>

						<EnhancedFlowWalkthrough flowId="token-introspection" />
						<FlowSequenceDisplay flowType="token-introspection" />

						{/* Configuration Summary */}
						<ConfigurationSummaryCard
							configuration={credentials}
							hasConfiguration={Boolean(credentials?.clientId)}
						/>
					</>
				);

			case 1:
				return (
					<>
						<FormSection>
							<FormTitle>
								<FiSearch /> Introspect Token
							</FormTitle>
							<FormGroup>
								<Label>Access Token</Label>
								<TextArea
									placeholder="Enter token to introspect..."
									value={credentials.token || ''}
									onChange={(e) => updateCredentials({ token: e.target.value })}
								/>
							</FormGroup>
							<Button
								variant="success"
								onClick={handleIntrospectToken}
								disabled={isIntrospecting || !credentials.token}
							>
								{isIntrospecting ? <FiRefreshCw className="animate-spin" /> : <FiSearch />}
								{isIntrospecting ? 'Introspecting...' : 'Introspect Token'}
							</Button>
						</FormSection>

						{error && (
							<ErrorMessage>
								<FiInfo />
								{error}
							</ErrorMessage>
						)}

						{introspectionResult ? (
							<ResultsContainer>
								<SuccessMessage>
									<FiCheckCircle />
									Token introspected successfully!
								</SuccessMessage>

								{/* @ts-expect-error - TypeScript inference issue with conditional rendering */}
								<TokenInfo>
									<TokenInfoRow>
										<TokenInfoLabel>Token Active:</TokenInfoLabel>
										<TokenInfoValue $valid={Boolean(safeIntrospectionResult?.active)}>
											{safeIntrospectionResult?.active ? 'Yes' : 'No'}
										</TokenInfoValue>
									</TokenInfoRow>
									{safeIntrospectionResult?.exp &&
										typeof safeIntrospectionResult.exp === 'number' && (
											<TokenInfoRow>
												<TokenInfoLabel>Expires At:</TokenInfoLabel>
												<TokenInfoValue>
													{new Date(safeIntrospectionResult.exp * 1000).toLocaleString()}
												</TokenInfoValue>
											</TokenInfoRow>
										)}
									{safeIntrospectionResult?.scope &&
										typeof safeIntrospectionResult.scope === 'string' && (
											<TokenInfoRow>
												<TokenInfoLabel>Scopes:</TokenInfoLabel>
												<TokenInfoValue>{String(safeIntrospectionResult.scope)}</TokenInfoValue>
											</TokenInfoRow>
										)}
									{safeIntrospectionResult?.client_id &&
										typeof safeIntrospectionResult.client_id === 'string' && (
											<TokenInfoRow>
												<TokenInfoLabel>Client ID:</TokenInfoLabel>
												<TokenInfoValue>{String(safeIntrospectionResult.client_id)}</TokenInfoValue>
											</TokenInfoRow>
										)}
								</TokenInfo>

								<ResultsSection>
									<ResultsHeading>Full Introspection Response</ResultsHeading>
									<pre
										style={{
											background: '#f3f4f6',
											padding: '1rem',
											borderRadius: '6px',
											overflow: 'auto',
										}}
									>
										{JSON.stringify(introspectionResult, null, 2)}
									</pre>
								</ResultsSection>
							</ResultsContainer>
						) : null}
					</>
				);

			case 2:
				return (
					<>
						<ResultsSection>
							<ResultsHeading>Introspection Complete</ResultsHeading>
							<p>
								The token has been successfully introspected. You now have detailed information
								about the token's validity, expiration, scopes, and other claims.
							</p>
						</ResultsSection>

						<ResultsSection>
							<ResultsHeading>Key Information</ResultsHeading>
							<ul style={{ paddingLeft: '1.5rem' }}>
								<li>
									<strong>Token Validity:</strong>{' '}
									{safeIntrospectionResult?.active ? 'Active' : 'Inactive'}
								</li>
								<li>
									<strong>Expiration:</strong>{' '}
									{safeIntrospectionResult?.exp && typeof safeIntrospectionResult.exp === 'number'
										? new Date(safeIntrospectionResult.exp * 1000).toLocaleString()
										: 'Not specified'}
								</li>
								<li>
									<strong>Scopes:</strong>{' '}
									{safeIntrospectionResult?.scope
										? String(safeIntrospectionResult.scope)
										: 'Not specified'}
								</li>
								<li>
									<strong>Client ID:</strong>{' '}
									{safeIntrospectionResult?.client_id
										? String(safeIntrospectionResult.client_id)
										: 'Not specified'}
								</li>
							</ul>
						</ResultsSection>

						<ResultsSection>
							<ResultsHeading>Next Steps</ResultsHeading>
							<ul style={{ paddingLeft: '1.5rem' }}>
								<li>Use the token information for authorization decisions</li>
								<li>Implement token validation in your API endpoints</li>
								<li>Consider caching introspection results for performance</li>
								<li>Monitor token usage and expiration</li>
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
								You have successfully completed the Token Introspection Flow V5. This flow
								demonstrates how to introspect access tokens to get detailed information about their
								validity and claims.
							</p>
						</ResultsSection>

						<ResultsSection>
							<ResultsHeading>What You Learned</ResultsHeading>
							<ul style={{ paddingLeft: '1.5rem' }}>
								<li>How to introspect access tokens</li>
								<li>Token introspection endpoint usage</li>
								<li>Token metadata and claims interpretation</li>
								<li>Authorization decision making based on token information</li>
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
				<FlowHeader flowId="token-introspection-v5" />

				<EnhancedFlowInfoCard
					flowType="token-introspection"
					showAdditionalInfo={true}
					showDocumentation={true}
					showCommonIssues={false}
					showImplementationNotes={false}
				/>

				<FlowConfigurationRequirements flowType="token-introspection" variant="pingone" />

				<MainCard>
					<StepHeader>
						<StepHeaderLeft>
							<VersionBadge>Token Introspection Flow · V5</VersionBadge>
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

export default TokenIntrospectionFlowV5;
