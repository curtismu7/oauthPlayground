// src/pages/flows/TokenRevocationFlowV5.tsx
// V5.0.0 Token Revocation Flow - Full V5 Implementation with Enhanced FlowInfoService

import React, { useCallback, useState } from 'react';
import { FiCheckCircle, FiInfo, FiRefreshCw, FiShield, FiTrash2 } from 'react-icons/fi';
import styled from 'styled-components';
import EnhancedFlowInfoCard from '../../components/EnhancedFlowInfoCard';
import FlowConfigurationRequirements from '../../components/FlowConfigurationRequirements';
import { StepNavigationButtons } from '../../components/StepNavigationButtons';
import EnhancedFlowWalkthrough from '../../components/EnhancedFlowWalkthrough';
import FlowSequenceDisplay from '../../components/FlowSequenceDisplay';
import {
	ExplanationHeading,
	ExplanationSection,
} from '../../components/InfoBlocks';
import { ResultsHeading, ResultsSection } from '../../components/ResultsPanel';
import { useTokenRevocationFlowController } from '../../hooks/useTokenRevocationFlowController';
import { FlowHeader } from '../../services/flowHeaderService';
import { v4ToastManager } from '../../utils/v4ToastMessages';

const STEP_METADATA = [
	{
		title: 'Step 0: Introduction & Setup',
		subtitle: 'Understand Token Revocation and configure credentials',
	},
	{
		title: 'Step 1: Token Revocation Request',
		subtitle: 'Revoke access and refresh tokens',
	},
	{ title: 'Step 2: Revocation Response', subtitle: 'Review the revocation result' },
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
	background: linear-gradient(135deg, #ef4444 0%, #f87171 100%);
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

const TokenRevocationFlowV5: React.FC = () => {
	const [currentStep, setCurrentStep] = useState<StepIndex>(0);
	const [isRevoking, setIsRevoking] = useState(false);
	const [revocationResult, setRevocationResult] = useState<unknown>(null);
	const [error, setError] = useState<string | null>(null);

	const {
		credentials,
		revokeToken,
		clearResults,
		updateCredentials,
	} = useTokenRevocationFlowController();

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
		setRevocationResult(null);
		setError(null);
		clearResults();
	}, [clearResults]);

	const handleRevokeToken = useCallback(async () => {
		if (!credentials.accessToken && !credentials.refreshToken) {
			setError('Please provide at least one token to revoke');
			return;
		}

		setIsRevoking(true);
		setError(null);

		try {
			const result = await revokeToken();
			setRevocationResult(result);
			v4ToastManager.showSuccess('Token(s) revoked successfully!');
			handleNext();
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to revoke token(s)';
			setError(errorMessage);
			v4ToastManager.showError(errorMessage);
		} finally {
			setIsRevoking(false);
		}
	}, [credentials, revokeToken, handleNext]);

	const canNavigateNext = currentStep === 0 || (currentStep === 1 && !!revocationResult);

	const renderStepContent = () => {
		switch (currentStep) {
			case 0:
				return (
					<>
						<ExplanationSection>
							<ExplanationHeading>
								<FiShield /> Token Revocation
							</ExplanationHeading>
							<p>
								Token revocation allows you to invalidate access and refresh tokens before they expire.
								This is essential for security when users log out or when tokens are compromised.
							</p>
						</ExplanationSection>


						<EnhancedFlowWalkthrough flowId="token-revocation" />
						<FlowSequenceDisplay flowType="token-revocation" />
					</>
				);

			case 1:
				return (
					<>
						<FormSection>
							<FormTitle>
								<FiTrash2 /> Revoke Tokens
							</FormTitle>
							<FormGrid>
								<FormGroup>
									<Label>Access Token (optional)</Label>
									<TextArea
										placeholder="Enter access token to revoke..."
										value={credentials.accessToken || ''}
										onChange={(e) => updateCredentials({ accessToken: e.target.value })}
									/>
								</FormGroup>
								<FormGroup>
									<Label>Refresh Token (optional)</Label>
									<TextArea
										placeholder="Enter refresh token to revoke..."
										value={credentials.refreshToken || ''}
										onChange={(e) => updateCredentials({ refreshToken: e.target.value })}
									/>
								</FormGroup>
							</FormGrid>
							<Button
								variant="danger"
								onClick={handleRevokeToken}
								disabled={isRevoking || (!credentials.accessToken && !credentials.refreshToken)}
							>
								{isRevoking ? <FiRefreshCw className="animate-spin" /> : <FiTrash2 />}
								{isRevoking ? 'Revoking...' : 'Revoke Tokens'}
							</Button>
						</FormSection>

						{error && (
							<ErrorMessage>
								<FiInfo />
								{error}
							</ErrorMessage>
						)}

						{revocationResult && (
							<ResultsContainer>
								<SuccessMessage>
									<FiCheckCircle />
									Token(s) revoked successfully!
								</SuccessMessage>
								<ResultsSection>
									<ResultsHeading>Revocation Response</ResultsHeading>
									<pre style={{ background: '#f3f4f6', padding: '1rem', borderRadius: '6px', overflow: 'auto' }}>
										{JSON.stringify(revocationResult, null, 2)}
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
							<ResultsHeading>Revocation Complete</ResultsHeading>
							<p>
								The token(s) have been successfully revoked. They are no longer valid and cannot be used
								for authentication or authorization.
							</p>
						</ResultsSection>

						<ResultsSection>
							<ResultsHeading>Next Steps</ResultsHeading>
							<ul style={{ paddingLeft: '1.5rem' }}>
								<li>Verify that the revoked tokens are no longer accepted by your API</li>
								<li>If using refresh tokens, ensure new access tokens are obtained</li>
								<li>Consider implementing token introspection to verify revocation status</li>
								<li>Update your application to handle revoked token scenarios</li>
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
								You have successfully completed the Token Revocation Flow V5. This flow demonstrates
								how to securely revoke access and refresh tokens.
							</p>
						</ResultsSection>

						<ResultsSection>
							<ResultsHeading>What You Learned</ResultsHeading>
							<ul style={{ paddingLeft: '1.5rem' }}>
								<li>How to revoke access and refresh tokens</li>
								<li>Token revocation endpoint usage</li>
								<li>Security implications of token revocation</li>
								<li>Best practices for token lifecycle management</li>
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
				<FlowHeader flowId="token-revocation-v5" />

				<EnhancedFlowInfoCard 
					flowType="token-revocation"
					showAdditionalInfo={true}
					showDocumentation={true}
					showCommonIssues={false}
					showImplementationNotes={false}
				/>

				<FlowConfigurationRequirements flowType="token-revocation" variant="pingone" />

				<MainCard>
					<StepHeader>
						<StepHeaderLeft>
							<VersionBadge>Token Revocation Flow · V5</VersionBadge>
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

export default TokenRevocationFlowV5;
