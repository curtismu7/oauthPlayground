/**
 * @file ProtectPortalApp.tsx
 * @module protect-portal
 * @description Main Protect Portal application component
 * @version 9.6.5
 * @since 2026-02-10
 *
 * This is the main component for the Protect Portal application that demonstrates
 * risk-based authentication with custom login, MFA integration, and OIDC token display.
 */

import React, { useCallback, useEffect, useState, useMemo } from 'react';
import styled from 'styled-components';
import { FiAlertTriangle, FiCheckCircle, FiInfo, FiLoader, FiShield, FiX } from 'react-icons/fi';

// Import components (will be created next)
import PortalHome from './components/PortalHome';
import CustomLoginForm from './components/CustomLoginForm';
import RiskEvaluationDisplay from './components/RiskEvaluationDisplay';
import MFAAuthenticationFlow from './components/MFAAuthenticationFlow';
import PortalSuccess from './components/PortalSuccess';

// Import services
import RiskEvaluationService from './services/riskEvaluationService';

// Import types and config
import type {
  PortalStep,
  PortalState,
  UserContext,
  LoginContext,
  RiskEvaluationResult,
  MFADevice,
  TokenSet,
  PortalError
} from './types/protectPortal.types';
import { getEnvironmentConfig } from './config/protectPortal.config';

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const PortalContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

const PortalCard = styled.div`
  background: white;
  border-radius: 1rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  overflow: hidden;
  width: 100%;
  max-width: 1200px;
  min-height: 600px;
  display: flex;
  flex-direction: column;
`;

const PortalHeader = styled.div`
  background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
  color: white;
  padding: 2rem;
  text-align: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const PortalTitle = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
`;

const PortalSubtitle = styled.p`
  font-size: 1.125rem;
  opacity: 0.9;
  margin: 0;
  font-weight: 400;
`;

const PortalContent = styled.div`
  flex: 1;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const ErrorContainer = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  padding: 1.5rem;
  max-width: 500px;
  width: 100%;
  text-align: center;
`;

const ErrorTitle = styled.h3`
  color: #dc2626;
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 0.75rem 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
`;

const ErrorMessage = styled.p`
  color: #7f1d1d;
  font-size: 1rem;
  margin: 0 0 1rem 0;
  line-height: 1.5;
`;

const ErrorActions = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 1rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  ${props => {
    switch (props.variant) {
      case 'primary':
        return `
          background: #3b82f6;
          color: white;
          &:hover {
            background: #2563eb;
          }
        `;
      case 'secondary':
        return `
          background: #f3f4f6;
          color: #374151;
          &:hover {
            background: #e5e7eb;
          }
        `;
      case 'danger':
        return `
          background: #ef4444;
          color: white;
          &:hover {
            background: #dc2626;
          }
        `;
      default:
        return `
          background: #3b82f6;
          color: white;
          &:hover {
            background: #2563eb;
          }
        `;
    }
  }}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;
`;

const LoadingSpinner = styled(FiLoader)`
  animation: spin 1s linear infinite;
  font-size: 2rem;
  color: #3b82f6;

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.p`
  color: #6b7280;
  font-size: 1rem;
  margin: 0;
`;

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface ProtectPortalAppProps {
  /** Initial step for testing purposes */
  initialStep?: PortalStep;
  /** Mock risk level for testing */
  mockRiskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  /** Enable mock mode for testing */
  enableMockMode?: boolean;
}

const ProtectPortalApp: React.FC<ProtectPortalAppProps> = ({
  initialStep = 'portal-home',
  mockRiskLevel,
  enableMockMode = false
}) => {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const config = useMemo(() => getEnvironmentConfig(), []);

  const [portalState, setPortalState] = useState<PortalState>({
    currentStep: initialStep,
    userContext: null,
    loginContext: null,
    riskEvaluation: null,
    selectedDevice: null,
    availableDevices: [],
    tokens: null,
    tokenDisplay: null,
    isLoading: false,
    error: null,
    educationalContent: {
      riskEvaluation: {
        title: 'Risk-Based Authentication',
        description: 'We evaluate your login attempt in real-time to determine the appropriate level of security.',
        keyPoints: [
          'Analyzes login patterns, device information, and location',
          'Uses machine learning to detect suspicious activity',
          'Adapts security requirements based on risk level',
          'Protects your account while minimizing friction'
        ],
        learnMore: {
          title: 'Learn About Risk Evaluation',
          url: 'https://docs.pingidentity.com/pingone/p1_cloud__risk_evaluations.html'
        }
      },
      mfaAuthentication: {
        title: 'Multi-Factor Authentication',
        description: 'Add an extra layer of security to verify your identity beyond just a password.',
        keyPoints: [
          'Choose from SMS, Email, Authenticator App, or Security Key',
          'Each method provides different levels of security',
          'Register multiple devices for backup options',
          'MFA significantly reduces the risk of unauthorized access'
        ],
        learnMore: {
          title: 'Learn About MFA',
          url: 'https://docs.pingidentity.com/pingone/p1_cloud__mfa_overview.html'
        }
      },
      tokenDisplay: {
        title: 'OAuth & OIDC Tokens',
        description: 'Your login generates secure tokens that grant access to applications and services.',
        keyPoints: [
          'Access tokens grant permission to access resources',
          'ID tokens contain your user information',
          'Tokens are cryptographically signed for security',
          'Tokens automatically expire for enhanced security'
        ],
        learnMore: {
          title: 'Learn About OAuth Tokens',
          url: 'https://docs.pingidentity.com/pingone/p1_cloud__tokens.html'
        }
      }
    }
  });

  // ============================================================================
  // STEP HANDLERS
  // ============================================================================

  const handleLoginStart = useCallback(() => {
    console.log('[🚀 PROTECT-PORTAL] Starting login flow');
    setPortalState(prev => ({
      ...prev,
      currentStep: 'custom-login',
      error: null
    }));
  }, []);

  const handleLoginSuccess = useCallback((userContext: UserContext, loginContext: LoginContext) => {
    console.log('[🚀 PROTECT-PORTAL] Login successful, starting risk evaluation');
    setPortalState(prev => ({
      ...prev,
      userContext,
      loginContext,
      currentStep: 'risk-evaluation',
      error: null
    }));
  }, []);

  const handleRiskEvaluationComplete = useCallback(async (result: RiskEvaluationResult) => {
    console.log('[🚀 PROTECT-PORTAL] Risk evaluation completed:', result.result.level);
    
    setPortalState(prev => ({
      ...prev,
      riskEvaluation: result,
      error: null
    }));

    // Route based on risk level
    switch (result.result.level) {
      case 'LOW':
        setPortalState(prev => ({ ...prev, currentStep: 'risk-low-success' }));
        break;
      case 'MEDIUM':
        setPortalState(prev => ({ ...prev, currentStep: 'risk-medium-mfa' }));
        break;
      case 'HIGH':
        setPortalState(prev => ({ ...prev, currentStep: 'risk-high-block' }));
        break;
      default:
        setPortalState(prev => ({
          ...prev,
          currentStep: 'error',
          error: {
            code: 'UNKNOWN_RISK_LEVEL',
            message: 'Risk level could not be determined',
            recoverable: true,
            suggestedAction: 'Please try again'
          }
        }));
    }
  }, []);

  const handleMFAComplete = useCallback((tokens: TokenSet) => {
    console.log('[🚀 PROTECT-PORTAL] MFA completed, proceeding to success');
    setPortalState(prev => ({
      ...prev,
      tokens,
      currentStep: 'portal-success',
      error: null
    }));
  }, []);

  const handleError = useCallback((error: PortalError) => {
    console.error('[🚀 PROTECT-PORTAL] Error occurred:', error);
    setPortalState(prev => ({
      ...prev,
      currentStep: 'error',
      error,
      isLoading: false
    }));
  }, []);

  const handleRetry = useCallback(() => {
    console.log('[🚀 PROTECT-PORTAL] Retrying from error state');
    setPortalState(prev => ({
      ...prev,
      currentStep: 'portal-home',
      error: null,
      isLoading: false
    }));
  }, []);

  const handleReset = useCallback(() => {
    console.log('[🚀 PROTECT-PORTAL] Resetting to initial state');
    setPortalState(prev => ({
      ...prev,
      currentStep: initialStep,
      userContext: null,
      loginContext: null,
      riskEvaluation: null,
      selectedDevice: null,
      availableDevices: [],
      tokens: null,
      tokenDisplay: null,
      error: null,
      isLoading: false
    }));
  }, [initialStep]);

  // ============================================================================
  // RENDER STEP COMPONENTS
  // ============================================================================

  const renderStep = () => {
    const { currentStep, isLoading, error } = portalState;

    if (isLoading) {
      return (
        <LoadingContainer>
          <LoadingSpinner />
          <LoadingText>Processing your request...</LoadingText>
        </LoadingContainer>
      );
    }

    if (error && currentStep === 'error') {
      return (
        <ErrorContainer>
          <ErrorTitle>
            <FiAlertTriangle />
            Something went wrong
          </ErrorTitle>
          <ErrorMessage>{error.message}</ErrorMessage>
          {error.suggestedAction && (
            <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '1rem' }}>
              {error.suggestedAction}
            </p>
          )}
          <ErrorActions>
            {error.recoverable && (
              <Button variant="primary" onClick={handleRetry}>
                <FiCheckCircle />
                Try Again
              </Button>
            )}
            <Button variant="secondary" onClick={handleReset}>
              <FiX />
              Start Over
            </Button>
          </ErrorActions>
        </ErrorContainer>
      );
    }

    switch (currentStep) {
      case 'portal-home':
        return (
          <PortalHome
            onLoginStart={handleLoginStart}
            educationalContent={portalState.educationalContent.riskEvaluation}
          />
        );

      case 'custom-login':
        return (
          <CustomLoginForm
            onLoginSuccess={handleLoginSuccess}
            onError={handleError}
            enableMockMode={enableMockMode}
          />
        );

      case 'risk-evaluation':
        return (
          <RiskEvaluationDisplay
            userContext={portalState.userContext!}
            loginContext={portalState.loginContext!}
            onComplete={handleRiskEvaluationComplete}
            onError={handleError}
            mockRiskLevel={mockRiskLevel}
            enableMockMode={enableMockMode}
            educationalContent={portalState.educationalContent.riskEvaluation}
          />
        );

      case 'risk-medium-mfa':
        return (
          <MFAAuthenticationFlow
            userContext={portalState.userContext!}
            riskEvaluation={portalState.riskEvaluation!}
            onComplete={handleMFAComplete}
            onError={handleError}
            enableMockMode={enableMockMode}
            educationalContent={portalState.educationalContent.mfaAuthentication}
          />
        );

      case 'risk-low-success':
      case 'portal-success':
        return (
          <PortalSuccess
            userContext={portalState.userContext!}
            riskEvaluation={portalState.riskEvaluation!}
            tokens={portalState.tokens!}
            onLogout={handleReset}
            educationalContent={portalState.educationalContent.tokenDisplay}
          />
        );

      case 'risk-high-block':
        return (
          <ErrorContainer>
            <ErrorTitle>
              <FiShield />
              Access Blocked
            </ErrorTitle>
            <ErrorMessage>
              This login attempt has been blocked due to high-risk indicators. 
              For your security, please contact your administrator or try again from a trusted location and device.
            </ErrorMessage>
            <ErrorActions>
              <Button variant="secondary" onClick={handleReset}>
                <FiX />
                Try Again Later
              </Button>
            </ErrorActions>
          </ErrorContainer>
        );

      default:
        return (
          <ErrorContainer>
            <ErrorTitle>
              <FiAlertTriangle />
              Unknown Step
            </ErrorTitle>
            <ErrorMessage>
              The application is in an unknown state. Please start over.
            </ErrorMessage>
            <ErrorActions>
              <Button variant="primary" onClick={handleReset}>
                <FiCheckCircle />
                Start Over
              </Button>
            </ErrorActions>
          </ErrorContainer>
        );
    }
  };

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    console.log('[🚀 PROTECT-PORTAL] Protect Portal initialized', {
      version: '9.6.5',
      config: config.uiConfig.theme,
      mockMode: enableMockMode,
      initialStep
    });
  }, [config, enableMockMode, initialStep]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <PortalContainer>
      <PortalCard>
        <PortalHeader>
          <PortalTitle>
            <FiShield />
            Protect Portal
          </PortalTitle>
          <PortalSubtitle>
            Risk-Based Authentication Demo
          </PortalSubtitle>
        </PortalHeader>
        <PortalContent>
          {renderStep()}
        </PortalContent>
      </PortalCard>
    </PortalContainer>
  );
};

export default ProtectPortalApp;
