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

import React, { useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { FiAlertTriangle, FiCheckCircle, FiInfo, FiLoader, FiShield, FiXCircle } from 'react-icons/fi';

import type {
  UserContext,
  LoginContext,
  RiskEvaluationResult,
  PortalError,
  EducationalContent
} from '../types/protectPortal.types';
import RiskEvaluationService from '../services/riskEvaluationService';

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
  background: ${props => {
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
  border: 1px solid ${props => {
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
  background: ${props => {
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
  background: ${props => {
    switch (props.riskLevel) {
      case 'LOW':
        return '#f0fdf4';
      case 'MEDIUM':
        return '#fffbeb';
      case 'HIGH':
        return '#fef2f2';
    }
  }};
  border: 2px solid ${props => {
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
  color: ${props => {
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

// ============================================================================
// PROPS INTERFACE
// ============================================================================

interface RiskEvaluationDisplayProps {
  userContext: UserContext;
  loginContext: LoginContext;
  onComplete: (result: RiskEvaluationResult) => void;
  onError: (error: PortalError) => void;
  mockRiskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  enableMockMode?: boolean;
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
  mockRiskLevel,
  enableMockMode = false,
  educationalContent
}) => {
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
      status: 'pending'
    },
    {
      id: 'analyze-patterns',
      title: 'Analyzing Patterns',
      description: 'Evaluating login patterns and device information',
      status: 'pending'
    },
    {
      id: 'calculate-risk',
      title: 'Calculating Risk Score',
      description: 'Computing risk score using machine learning models',
      status: 'pending'
    },
    {
      id: 'determine-action',
      title: 'Determining Action',
      description: 'Deciding on appropriate security measures',
      status: 'pending'
    }
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
        setSteps(prev => prev.map((step, index) => 
          index === stepIndex ? { ...step, status } : step
        ));
      };

      // Step 1: Collect data
      setCurrentStep(0);
      updateStep(0, 'active');
      await new Promise(resolve => setTimeout(resolve, 1000));
      updateStep(0, 'complete');

      // Step 2: Analyze patterns
      setCurrentStep(1);
      updateStep(1, 'active');
      await new Promise(resolve => setTimeout(resolve, 1500));
      updateStep(1, 'complete');

      // Step 3: Calculate risk
      setCurrentStep(2);
      updateStep(2, 'active');
      await new Promise(resolve => setTimeout(resolve, 2000));
      updateStep(2, 'complete');

      // Step 4: Determine action
      setCurrentStep(3);
      updateStep(3, 'active');
      
      let evaluationResult: RiskEvaluationResult;

      if (enableMockMode) {
        // Use mock evaluation
        const mockResponse = await RiskEvaluationService.mockRiskEvaluation(
          userContext,
          loginContext,
          mockRiskLevel
        );

        if (!mockResponse.success || !mockResponse.data) {
          throw new Error('Mock evaluation failed');
        }

        evaluationResult = mockResponse.data;
      } else {
        // TODO: Implement actual Protect API call
        throw new Error('Protect API integration not yet implemented');
      }

      updateStep(3, 'complete');
      setResult(evaluationResult);

      // Complete evaluation after a short delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      onComplete(evaluationResult);

    } catch (err) {
      console.error('[🛡️ RISK-EVALUATION] Evaluation failed:', err);
      
      const errorMessage = err instanceof Error ? err.message : 'Risk evaluation failed';
      setError(errorMessage);

      // Mark current step as error
      setSteps(prev => prev.map((step, index) => 
        index === currentStep ? { ...step, status: 'error' } : step
      ));

      const portalError: PortalError = {
        code: 'RISK_EVALUATION_FAILED',
        message: errorMessage,
        recoverable: true,
        suggestedAction: 'Please try again or contact support'
      };

      onError(portalError);
    } finally {
      setIsEvaluating(false);
    }
  }, [userContext, loginContext, onComplete, onError, mockRiskLevel, enableMockMode, currentStep]);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    console.log('[🛡️ RISK-EVALUATION] Risk evaluation display initialized', {
      userId: userContext.id,
      enableMockMode,
      mockRiskLevel
    });

    // Auto-start evaluation
    runEvaluation();
  }, []); // Only run once on mount

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
      <EvaluationTitle>Risk Evaluation</EvaluationTitle>
      <EvaluationDescription>
        We're evaluating your login attempt to determine the appropriate security level
      </EvaluationDescription>

      {error && (
        <ErrorMessage>
          <FiAlertTriangle />
          {error}
        </ErrorMessage>
      )}

      {/* Progress Section */}
      <ProgressContainer>
        <ProgressHeader>
          {isEvaluating ? (
            <>
              <LoadingSpinner />
              <ProgressTitle>Evaluating Security Risk</ProgressTitle>
            </>
          ) : result ? (
            <>
              <FiCheckCircle style={{ color: '#10b981' }} />
              <ProgressTitle>Evaluation Complete</ProgressTitle>
            </>
          ) : (
            <>
              <FiShield />
              <ProgressTitle>Security Analysis</ProgressTitle>
            </>
          )}
        </ProgressHeader>

        <ProgressSteps>
          {steps.map((step, index) => (
            <ProgressStep key={step.id} status={step.status}>
              <StepIcon status={step.status}>
                {getStepIcon(step.status)}
              </StepIcon>
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
          
          <ResultDescription>
            {getRiskLevelInfo(result.result.level).description}
          </ResultDescription>

          <ResultDetails>
            <DetailRow>
              <DetailLabel>Risk Level:</DetailLabel>
              <DetailValue>{result.result.level}</DetailValue>
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
        </ResultContainer>
      )}

      {/* Educational Section */}
      <EducationalSection>
        <EducationalHeader>
          <FiInfo style={{ color: '#3b82f6' }} />
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
      </EducationalSection>
    </EvaluationContainer>
  );
};

export default RiskEvaluationDisplay;
