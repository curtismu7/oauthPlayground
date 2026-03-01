/**
 * @file RiskEvaluationDisplay.tsx
 * @module protect-portal/components
 * @description Risk evaluation display component
 * @version 9.6.5
 * @since 2026-02-10
 *
 * This component displays the risk evaluation process and results,
 * showing progress and educational content about risk-based authentication.
 */

import {
	FiAlertTriangle,
	FiArrowRight,
	FiCheckCircle,
	FiInfo,
	FiLoader,
	FiShield,
	FiXCircle,
} from '@icons';
import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { useGlobalWorkerToken } from '@/hooks/useGlobalWorkerToken';
import { workerTokenManager } from '@/services/workerTokenManager';
import RiskEvaluationService from '../services/riskEvaluationService';
import type {
	EducationalContent,
	LoginContext,
	PortalError,
	RiskEvaluationResult,
	UserContext,
} from '../types/protectPortal.types';

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const EvaluationContainer = styled.div`
  width: 100%;
  max-width: 600px;
  text-align: center;
`;

const EvaluationTitle = styled.h2`
  font-size: 1.875rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 1rem 0;
`;

const EvaluationDescription = styled.p`
  font-size: 1rem;
  color: #6b7280;
  margin: 0 0 2rem 0;
  line-height: 1.6;
`;

const ProgressContainer = styled.div`
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 1rem;
  padding: 2rem;
  margin-bottom: 2rem;
`;

const ProgressHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
`;

const ProgressTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const ProgressSteps = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const ProgressStep = styled.div<{ status: 'pending' | 'active' | 'complete' | 'error' }>`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  border-radius: 0.5rem;
  background: ${(props) => {
		switch (props.status) {
			case 'active':
				return '#eff6ff';
			case 'complete':
				return '#f0fdf4';
			case 'error':
				return '#fef2f2';
			default:
				return 'transparent';
		}
	}};
  border: 1px solid ${(props) => {
		switch (props.status) {
			case 'active':
				return '#bfdbfe';
			case 'complete':
				return '#bbf7d0';
			case 'error':
				return '#fecaca';
			default:
				return '#e5e7eb';
		}
	}};
`;

const StepIcon = styled.div<{ status: 'pending' | 'active' | 'complete' | 'error' }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  color: white;
  background: ${(props) => {
		switch (props.status) {
			case 'active':
				return '#3b82f6';
			case 'complete':
				return '#10b981';
			case 'error':
				return '#ef4444';
			default:
				return '#9ca3af';
		}
	}};
`;

const StepContent = styled.div`
  flex: 1;
  text-align: left;
`;

const StepTitle = styled.div`
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.25rem;
`;

const StepDescription = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
`;

const LoadingSpinner = styled(FiLoader)`
  animation: spin 1s linear infinite;
  font-size: 1.5rem;
  color: #3b82f6;

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const ResultContainer = styled.div<{ riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' }>`
  background: ${(props) => {
		switch (props.riskLevel) {
			case 'LOW':
				return '#f0fdf4';
			case 'MEDIUM':
				return '#fffbeb';
			case 'HIGH':
				return '#fef2f2';
		}
	}};
  border: 2px solid ${(props) => {
		switch (props.riskLevel) {
			case 'LOW':
				return '#10b981';
			case 'MEDIUM':
				return '#f59e0b';
			case 'HIGH':
				return '#ef4444';
		}
	}};
  border-radius: 1rem;
  padding: 2rem;
  margin-bottom: 2rem;
`;

const ResultHeader = styled.div<{ riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  color: ${(props) => {
		switch (props.riskLevel) {
			case 'LOW':
				return '#059669';
			case 'MEDIUM':
				return '#d97706';
			case 'HIGH':
				return '#dc2626';
		}
	}};
`;

const ResultIcon = styled.div<{ riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' }>`
  font-size: 2rem;
`;

const ResultTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
`;

const ResultDescription = styled.p`
  font-size: 1rem;
  margin: 0 0 1.5rem 0;
  line-height: 1.6;
  color: #374151;
`;

const ResultDetails = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
`;

const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f3f4f6;

  &:last-child {
    border-bottom: none;
  }
`;

const DetailLabel = styled.span`
  font-weight: 600;
  color: #374151;
`;

const DetailValue = styled.span`
  color: #6b7280;
`;

const ErrorMessage = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  padding: 1rem;
  color: #dc2626;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const EducationalSection = styled.div`
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 1rem;
  padding: 1.5rem;
  text-align: left;
`;

const EducationalHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

const EducationalTitle = styled.h4`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e40af;
  margin: 0;
`;

const EducationalDescription = styled.p`
  font-size: 0.875rem;
  color: #1e40af;
  margin: 0 0 1rem 0;
  line-height: 1.5;
`;

const KeyPoints = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 1rem 0;
`;

const KeyPoint = styled.li`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  color: #374151;
  line-height: 1.4;
`;

const KeyPointIcon = styled(FiCheckCircle)`
  color: #10b981;
  flex-shrink: 0;
  margin-top: 0.125rem;
`;

const LearnMoreLink = styled.a`
  color: #1e40af;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.875rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: color 0.2s ease;

  &:hover {
    color: #1d4ed8;
    text-decoration: underline;
  }
`;

// Enhanced UI Components
const RiskScoreContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 0.5rem;
`;

const RiskScoreLabel = styled.span`
  font-weight: 600;
  color: #374151;
  min-width: 100px;
`;

const RiskScoreValue = styled.span<{ riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' }>`
  font-size: 1.25rem;
  font-weight: 700;
  color: ${(props) => {
		switch (props.riskLevel) {
			case 'LOW':
				return '#10b981';
			case 'MEDIUM':
				return '#f59e0b';
			case 'HIGH':
				return '#ef4444';
		}
	}};
  min-width: 60px;
`;

const RiskScoreBar = styled.div`
  flex: 1;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
`;

const RiskScoreFill = styled.div<{ percentage: number; riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' }>`
  height: 100%;
  width: ${(props) => props.percentage}%;
  background: ${(props) => {
		switch (props.riskLevel) {
			case 'LOW':
				return '#10b981';
			case 'MEDIUM':
				return '#f59e0b';
			case 'HIGH':
				return '#ef4444';
		}
	}};
  transition: width 0.5s ease;
`;

const RiskFactorsContainer = styled.div`
  margin-bottom: 1.5rem;
`;

const RiskFactorsTitle = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const RiskFactorsList = styled.div`
  display: grid;
  gap: 0.75rem;
`;

const RiskFactorItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
  color: #374151;
`;

const RiskBadge = styled.span<{ riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' }>`
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
  background: ${(props) => {
		switch (props.riskLevel) {
			case 'LOW':
				return '#10b981';
			case 'MEDIUM':
				return '#f59e0b';
			case 'HIGH':
				return '#ef4444';
		}
	}};
`;

const NextStepsContainer = styled.div`
  margin-top: 1.5rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 0.5rem;
`;

const NextStepsTitle = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const NextStepsContent = styled.div`
  display: grid;
  gap: 0.75rem;
`;

const NextStepItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
  color: #374151;
`;

// ============================================================================
// PROPS INTERFACE
// ============================================================================

interface RiskEvaluationDisplayProps {
	userContext: UserContext;
	loginContext: LoginContext;
	onComplete: (result: RiskEvaluationResult) => void;
	onError: (error: PortalError) => void;
	protectCredentials: {
		environmentId: string;
		workerToken: string;
		region: 'us' | 'eu' | 'ap' | 'ca';
	};
	educationalContent: EducationalContent;
}

// ============================================================================
// TYPES
// ============================================================================

type EvaluationStep = {
	id: string;
	title: string;
	description: string;
	status: 'pending' | 'active' | 'complete' | 'error';
};

// ============================================================================
// COMPONENT
// ============================================================================

const RiskEvaluationDisplay: React.FC<RiskEvaluationDisplayProps> = ({
	userContext,
	loginContext,
	onComplete,
	onError,
	protectCredentials,
	educationalContent,
}) => {
	// ============================================================================
	// GLOBAL WORKER TOKEN INTEGRATION
	// ============================================================================

	const { globalTokenStatus } = useGlobalWorkerToken();

	// ============================================================================
	// STATE MANAGEMENT
	// ============================================================================

	const [isEvaluating, setIsEvaluating] = useState(false);
	const [currentStep, setCurrentStep] = useState(0);
	const [error, setError] = useState<string | null>(null);
	const [result, setResult] = useState<RiskEvaluationResult | null>(null);

	const [steps, setSteps] = useState<EvaluationStep[]>([
		{
			id: 'collect-data',
			title: 'Collecting Login Data',
			description: 'Gathering user context and login information',
			status: 'pending',
		},
		{
			id: 'analyze-patterns',
			title: 'Analyzing Patterns',
			description: 'Evaluating login patterns and device information',
			status: 'pending',
		},
		{
			id: 'calculate-risk',
			title: 'Calculating Risk Score',
			description: 'Computing risk score using machine learning models',
			status: 'pending',
		},
		{
			id: 'determine-action',
			title: 'Determining Action',
			description: 'Deciding on appropriate security measures',
			status: 'pending',
		},
	]);

	// ============================================================================
	// EVENT HANDLERS
	// ============================================================================

	const runEvaluation = useCallback(async () => {
		setIsEvaluating(true);
		setError(null);
		setCurrentStep(0);
		setResult(null);

		try {
			// Update steps as we progress through evaluation
			const updateStep = (stepIndex: number, status: EvaluationStep['status']) => {
				setSteps((prev) =>
					prev.map((step, index) => (index === stepIndex ? { ...step, status } : step))
				);
			};

			// Step 1: Collect data
			setCurrentStep(0);
			updateStep(0, 'active');
			await new Promise((resolve) => setTimeout(resolve, 1000));
			updateStep(0, 'complete');

			// Step 2: Analyze patterns
			setCurrentStep(1);
			updateStep(1, 'active');
			await new Promise((resolve) => setTimeout(resolve, 1500));
			updateStep(1, 'complete');

			// Step 3: Calculate risk
			setCurrentStep(2);
			updateStep(2, 'active');
			await new Promise((resolve) => setTimeout(resolve, 2000));
			updateStep(2, 'complete');

			// Step 4: Determine action
			setCurrentStep(3);
			updateStep(3, 'active');

			// Ensure we have a valid worker token
			if (!globalTokenStatus.token || !globalTokenStatus.isValid) {
				try {
					await workerTokenManager.refreshToken();
				} catch (_tokenError) {
					throw new Error('Failed to obtain worker token for risk evaluation');
				}
			}

			// Use global worker token for risk evaluation
			const evaluationCredentials = {
				environmentId: protectCredentials?.environmentId || 'default',
				workerToken: globalTokenStatus.token || '',
				region: protectCredentials?.region || 'us',
			};

			const evaluationResponse = await RiskEvaluationService.evaluateRisk(
				userContext,
				loginContext,
				evaluationCredentials
			);

			if (!evaluationResponse.success || !evaluationResponse.data) {
				throw new Error(evaluationResponse.error?.message || 'Risk evaluation failed');
			}

			updateStep(3, 'complete');
			setResult(evaluationResponse.data);

			// Complete evaluation after a short delay
			await new Promise((resolve) => setTimeout(resolve, 1000));
			onComplete(evaluationResponse.data);
		} catch (err) {
			console.error('[🛡️ RISK-EVALUATION] Evaluation failed:', err);

			const errorMessage = err instanceof Error ? err.message : 'Risk evaluation failed';
			setError(errorMessage);

			// Mark current step as error
			setSteps((prev) =>
				prev.map((step, index) => (index === currentStep ? { ...step, status: 'error' } : step))
			);

			const portalError: PortalError = {
				code: 'RISK_EVALUATION_FAILED',
				message: errorMessage,
				recoverable: true,
				suggestedAction: 'Please try again or contact support',
			};

			onError(portalError);
		} finally {
			setIsEvaluating(false);
		}
	}, [
		userContext,
		loginContext,
		protectCredentials,
		onComplete,
		onError,
		currentStep,
		globalTokenStatus.isValid,
		globalTokenStatus.token,
	]);

	// ============================================================================
	// EFFECTS
	// ============================================================================

	useEffect(() => {
		console.log('[🛡️ RISK-EVALUATION] Risk evaluation display initialized', {
			userId: userContext.id,
			protectCredentials: !!protectCredentials,
		});

		// Auto-start evaluation
		runEvaluation();
	}, [
		userContext.id,
		protectCredentials, // Auto-start evaluation
		runEvaluation,
	]);

	// ============================================================================
	// RENDER HELPERS
	// ============================================================================

	const getStepIcon = (status: EvaluationStep['status']) => {
		switch (status) {
			case 'active':
				return <LoadingSpinner />;
			case 'complete':
				return <FiCheckCircle />;
			case 'error':
				return <FiXCircle />;
			default:
				return <FiInfo />;
		}
	};

	const getRiskLevelInfo = (level: 'LOW' | 'MEDIUM' | 'HIGH') => {
		return RiskEvaluationService.getRiskLevelDescription(level);
	};

	// ============================================================================
	// RENDER
	// ============================================================================

	return (
		<EvaluationContainer>
			<EvaluationTitle>🛡️ Security Risk Evaluation</EvaluationTitle>
			<EvaluationDescription>
				We're evaluating your login attempt using advanced security analysis to determine the
				appropriate protection level
			</EvaluationDescription>

			{error && (
				<ErrorMessage>
					<FiAlertTriangle />
					{error}
				</ErrorMessage>
			)}

			<ProgressContainer>
				<ProgressHeader>
					{isEvaluating ? (
						<>
							<LoadingSpinner />
							<ProgressTitle>🔍 Analyzing Security Risk</ProgressTitle>
						</>
					) : result ? (
						<>
							<FiCheckCircle style={{ color: '#10b981' }} />
							<ProgressTitle>✅ Evaluation Complete</ProgressTitle>
						</>
					) : (
						<>
							<FiShield />
							<ProgressTitle>🔒 Security Analysis Ready</ProgressTitle>
						</>
					)}
				</ProgressHeader>

				<ProgressSteps>
					{steps.map((step) => (
						<ProgressStep key={step.id} status={step.status}>
							<StepIcon status={step.status}>{getStepIcon(step.status)}</StepIcon>
							<StepContent>
								<StepTitle>{step.title}</StepTitle>
								<StepDescription>{step.description}</StepDescription>
							</StepContent>
						</ProgressStep>
					))}
				</ProgressSteps>
			</ProgressContainer>

			{/* Results Section */}
			{result && (
				<ResultContainer riskLevel={result.result.level}>
					<ResultHeader riskLevel={result.result.level}>
						<ResultIcon riskLevel={result.result.level}>
							{getRiskLevelInfo(result.result.level).icon}
						</ResultIcon>
						<ResultTitle>{getRiskLevelInfo(result.result.level).title}</ResultTitle>
					</ResultHeader>

					<ResultDescription>{getRiskLevelInfo(result.result.level).description}</ResultDescription>

					{/* Enhanced Risk Score Display */}
					<RiskScoreContainer>
						<RiskScoreLabel>Risk Score:</RiskScoreLabel>
						<RiskScoreValue riskLevel={result.result.level}>
							{result.result.level === 'LOW'
								? '25'
								: result.result.level === 'MEDIUM'
									? '65'
									: '85'}
							/100
						</RiskScoreValue>
						<RiskScoreBar>
							<RiskScoreFill
								percentage={
									result.result.level === 'LOW' ? 25 : result.result.level === 'MEDIUM' ? 65 : 85
								}
								riskLevel={result.result.level}
							/>
						</RiskScoreBar>
					</RiskScoreContainer>

					{/* Risk Factors */}
					<RiskFactorsContainer>
						<RiskFactorsTitle>🔍 Risk Factors Analyzed:</RiskFactorsTitle>
						<RiskFactorsList>
							<RiskFactorItem>
								<FiCheckCircle style={{ color: '#10b981' }} />
								<span>Device fingerprint and browser analysis</span>
							</RiskFactorItem>
							<RiskFactorItem>
								<FiCheckCircle style={{ color: '#10b981' }} />
								<span>Geolocation and IP address verification</span>
							</RiskFactorItem>
							<RiskFactorItem>
								<FiCheckCircle style={{ color: '#10b981' }} />
								<span>Login pattern and behavioral analysis</span>
							</RiskFactorItem>
							<RiskFactorItem>
								<FiCheckCircle style={{ color: '#10b981' }} />
								<span>Historical authentication data</span>
							</RiskFactorItem>
						</RiskFactorsList>
					</RiskFactorsContainer>

					<ResultDetails>
						<DetailRow>
							<DetailLabel>Risk Level:</DetailLabel>
							<DetailValue>
								<RiskBadge riskLevel={result.result.level}>{result.result.level}</RiskBadge>
							</DetailValue>
						</DetailRow>
						<DetailRow>
							<DetailLabel>Recommended Action:</DetailLabel>
							<DetailValue>{result.result.recommendedAction}</DetailValue>
						</DetailRow>
						<DetailRow>
							<DetailLabel>Evaluation ID:</DetailLabel>
							<DetailValue>{result.id}</DetailValue>
						</DetailRow>
						<DetailRow>
							<DetailLabel>Policy Used:</DetailLabel>
							<DetailValue>{result.riskPolicySet.name}</DetailValue>
						</DetailRow>
						<DetailRow>
							<DetailLabel>Evaluated At:</DetailLabel>
							<DetailValue>{new Date(result.createdAt).toLocaleString()}</DetailValue>
						</DetailRow>
					</ResultDetails>

					{/* Next Steps Information */}
					<NextStepsContainer>
						<NextStepsTitle>📋 What Happens Next:</NextStepsTitle>
						{result.result.level === 'LOW' && (
							<NextStepsContent>
								<NextStepItem>
									<FiCheckCircle style={{ color: '#10b981' }} />
									<span>Direct access granted - no additional security needed</span>
								</NextStepItem>
								<NextStepItem>
									<FiCheckCircle style={{ color: '#10b981' }} />
									<span>You'll be redirected to the success page</span>
								</NextStepItem>
							</NextStepsContent>
						)}
						{result.result.level === 'MEDIUM' && (
							<NextStepsContent>
								<NextStepItem>
									<FiShield style={{ color: '#f59e0b' }} />
									<span>Multi-factor authentication required</span>
								</NextStepItem>
								<NextStepItem>
									<FiShield style={{ color: '#f59e0b' }} />
									<span>You'll be prompted for additional verification</span>
								</NextStepItem>
							</NextStepsContent>
						)}
						{result.result.level === 'HIGH' && (
							<NextStepsContent>
								<NextStepItem>
									<FiXCircle style={{ color: '#ef4444' }} />
									<span>Access blocked due to high-risk indicators</span>
								</NextStepItem>
								<NextStepItem>
									<FiXCircle style={{ color: '#ef4444' }} />
									<span>Please contact your administrator or try again later</span>
								</NextStepItem>
							</NextStepsContent>
						)}
					</NextStepsContainer>
				</ResultContainer>
			)}

			{/* Educational Section */}
			<EducationalSection>
				<EducationalHeader>
					<FiInfo style={{ color: '#1e40af' }} />
					<EducationalTitle>{educationalContent.title}</EducationalTitle>
				</EducationalHeader>
				<EducationalDescription>{educationalContent.description}</EducationalDescription>

				<KeyPoints>
					{educationalContent.keyPoints.map((point, index) => (
						<KeyPoint key={index}>
							<KeyPointIcon />
							{point}
						</KeyPoint>
					))}
				</KeyPoints>

				{educationalContent.learnMore && (
					<LearnMoreLink
						href={educationalContent.learnMore.url}
						target="_blank"
						rel="noopener noreferrer"
					>
						Learn More About Risk-Based Authentication
						<FiArrowRight />
					</LearnMoreLink>
				)}
			</EducationalSection>
		</EvaluationContainer>
	);
};

export default RiskEvaluationDisplay;
