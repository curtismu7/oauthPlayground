// src/components/AuthErrorRecoveryV6.tsx
// Authentication Error Recovery Component using V6 Architecture

import React, { useState, useCallback, useEffect } from 'react';
import { 
  FiAlertTriangle, 
  FiRefreshCw, 
  FiHelpCircle, 
  FiClock, 
  FiCheckCircle, 
  FiXCircle,
  FiWifi,
  FiLock,
  FiSettings,
  FiPhone
} from 'react-icons/fi';
import { V6FlowService } from '../services/v6FlowService';
import { useV6CollapsibleSections } from '../services/v6StepManagementService';
import AuthErrorRecoveryService, { 
  type RecoveryAction, 
  type AuthErrorAnalysis,
  type AuthErrorContext 
} from '../services/authErrorRecoveryService';
import type { AuthenticationError } from '../services/pingOneAuthService';
import { ErrorType, ErrorSeverity } from '../services/errorHandlingService';
import styled from 'styled-components';

export interface AuthErrorRecoveryProps {
  error: AuthenticationError;
  context: AuthErrorContext;
  onRetry?: () => Promise<void>;
  onDismiss?: () => void;
  onContactSupport?: () => void;
  theme?: 'blue' | 'green' | 'purple';
  showTechnicalDetails?: boolean;
  autoRetry?: boolean;
}

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  ${props => {
    switch (props.$variant) {
      case 'primary':
        return `
          background: #3b82f6;
          color: white;
          &:hover:not(:disabled) { background: #2563eb; }
        `;
      case 'danger':
        return `
          background: #ef4444;
          color: white;
          &:hover:not(:disabled) { background: #dc2626; }
        `;
      default:
        return `
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
          &:hover:not(:disabled) { background: #e5e7eb; }
        `;
    }
  }}
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const CountdownText = styled.span`
  font-family: monospace;
  font-weight: 600;
  color: #3b82f6;
`;

const TechnicalDetails = styled.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 1rem;
  font-family: monospace;
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 1rem;
`;

const ActionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
`;

const ActionCard = styled.div<{ $priority: number }>`
  padding: 1rem;
  border: 1px solid ${props => props.$priority === 1 ? '#3b82f6' : '#e5e7eb'};
  border-radius: 0.5rem;
  background: ${props => props.$priority === 1 ? '#eff6ff' : '#ffffff'};
  
  h4 {
    margin: 0 0 0.5rem 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: ${props => props.$priority === 1 ? '#1e40af' : '#374151'};
  }
  
  p {
    margin: 0 0 1rem 0;
    font-size: 0.75rem;
    color: #6b7280;
    line-height: 1.4;
  }
`;

const PreventionTips = styled.div`
  margin-top: 1.5rem;
  
  h4 {
    margin: 0 0 0.75rem 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
  }
  
  ul {
    margin: 0;
    padding-left: 1.25rem;
    
    li {
      font-size: 0.75rem;
      color: #6b7280;
      margin-bottom: 0.25rem;
      line-height: 1.4;
    }
  }
`;

export const AuthErrorRecoveryV6: React.FC<AuthErrorRecoveryProps> = ({
  error,
  context,
  onRetry,
  onDismiss,
  onContactSupport,
  theme = 'blue',
  showTechnicalDetails = false,
  autoRetry = true
}) => {
  const { Layout, Collapsible, Info, Cards } = V6FlowService.createFlowComponents(theme);
  const { collapsedSections, toggleSection } = useV6CollapsibleSections();

  const [analysis, setAnalysis] = useState<AuthErrorAnalysis | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCountdown, setRetryCountdown] = useState<number | null>(null);
  const [showDetails, setShowDetails] = useState(showTechnicalDetails);

  // Analyze error on mount and when error changes
  useEffect(() => {
    const errorAnalysis = AuthErrorRecoveryService.analyzeAuthError(error, context);
    setAnalysis(errorAnalysis);
  }, [error, context]);

  // Handle automatic retry countdown
  useEffect(() => {
    if (autoRetry && analysis?.isRetryable && onRetry && !isRetrying) {
      const retryInfo = AuthErrorRecoveryService.getRetryInfo(error, context);
      
      if (retryInfo.retryable && retryInfo.delay) {
        setRetryCountdown(Math.ceil(retryInfo.delay / 1000));
        
        const interval = setInterval(() => {
          setRetryCountdown(prev => {
            if (prev === null || prev <= 1) {
              clearInterval(interval);
              handleAutoRetry();
              return null;
            }
            return prev - 1;
          });
        }, 1000);
        
        return () => clearInterval(interval);
      }
    }
  }, [analysis, autoRetry, error, context, onRetry, isRetrying]);

  const handleAutoRetry = useCallback(async () => {
    if (!onRetry || isRetrying) return;
    
    setIsRetrying(true);
    try {
      await onRetry();
      AuthErrorRecoveryService.resetRetryCounter(context);
    } catch (retryError) {
      console.error('Auto retry failed:', retryError);
    } finally {
      setIsRetrying(false);
    }
  }, [onRetry, isRetrying, context]);

  const handleManualRetry = useCallback(async () => {
    if (!onRetry || isRetrying) return;
    
    setIsRetrying(true);
    setRetryCountdown(null);
    
    try {
      await onRetry();
      AuthErrorRecoveryService.resetRetryCounter(context);
    } catch (retryError) {
      console.error('Manual retry failed:', retryError);
    } finally {
      setIsRetrying(false);
    }
  }, [onRetry, isRetrying, context]);

  const executeRecoveryAction = useCallback(async (action: RecoveryAction) => {
    if (action.action) {
      try {
        await action.action();
      } catch (actionError) {
        console.error('Recovery action failed:', actionError);
      }
    } else if (action.type === 'CONTACT_SUPPORT' && onContactSupport) {
      onContactSupport();
    } else if (action.type === 'RETRY' && onRetry) {
      await handleManualRetry();
    }
  }, [onContactSupport, onRetry, handleManualRetry]);

  const getErrorIcon = (errorType: ErrorType) => {
    switch (errorType) {
      case ErrorType.NETWORK:
        return <FiWifi size={20} />;
      case ErrorType.AUTHENTICATION:
        return <FiLock size={20} />;
      case ErrorType.CONFIGURATION:
        return <FiSettings size={20} />;
      case ErrorType.RATE_LIMIT:
        return <FiClock size={20} />;
      default:
        return <FiAlertTriangle size={20} />;
    }
  };

  const getInfoVariant = (severity: ErrorSeverity): 'success' | 'info' | 'warning' | 'danger' => {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        return 'danger';
      case ErrorSeverity.MEDIUM:
        return 'warning';
      default:
        return 'info';
    }
  };

  if (!analysis) {
    return (
      <Layout.Container>
        <Layout.ContentWrapper>
          <Layout.MainCard>
            <Info.InfoBox $variant="info">
              <FiRefreshCw size={20} />
              <div>
                <Info.InfoTitle>Analyzing Error</Info.InfoTitle>
                <Info.InfoText>Please wait while we analyze the authentication error...</Info.InfoText>
              </div>
            </Info.InfoBox>
          </Layout.MainCard>
        </Layout.ContentWrapper>
      </Layout.Container>
    );
  }

  return (
    <Layout.Container>
      <Layout.ContentWrapper>
        <Layout.MainCard>
          <Layout.StepHeader>
            <Layout.StepHeaderLeft>
              <Layout.VersionBadge>V6.0 - Service Architecture</Layout.VersionBadge>
              <Layout.StepHeaderTitle>Authentication Error</Layout.StepHeaderTitle>
              <Layout.StepHeaderSubtitle>Error recovery and troubleshooting</Layout.StepHeaderSubtitle>
            </Layout.StepHeaderLeft>
          </Layout.StepHeader>

          <Layout.StepContentWrapper>
            <Info.InfoBox $variant={getInfoVariant(analysis.severity)}>
              {getErrorIcon(analysis.errorType)}
              <div>
                <Info.InfoTitle>
                  {analysis.severity === ErrorSeverity.CRITICAL ? 'Critical Error' :
                   analysis.severity === ErrorSeverity.HIGH ? 'Authentication Failed' :
                   analysis.severity === ErrorSeverity.MEDIUM ? 'Authentication Issue' :
                   'Authentication Notice'}
                </Info.InfoTitle>
                <Info.InfoText>{analysis.userMessage}</Info.InfoText>
                
                {retryCountdown !== null && (
                  <Info.InfoText>
                    Automatic retry in <CountdownText>{retryCountdown}</CountdownText> seconds...
                  </Info.InfoText>
                )}
                
                {isRetrying && (
                  <Info.InfoText>
                    <FiRefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
                    Retrying authentication...
                  </Info.InfoText>
                )}
              </div>
            </Info.InfoBox>

            <Collapsible.CollapsibleSection>
              <Collapsible.CollapsibleHeaderButton
                onClick={() => toggleSection('recovery')}
                aria-expanded={!collapsedSections.recovery}
              >
                <Collapsible.CollapsibleTitle>
                  <FiHelpCircle /> Recovery Actions
                </Collapsible.CollapsibleTitle>
                <Collapsible.CollapsibleToggleIcon $collapsed={collapsedSections.recovery}>
                  <FiRefreshCw />
                </Collapsible.CollapsibleToggleIcon>
              </Collapsible.CollapsibleHeaderButton>
              {!collapsedSections.recovery && (
                <Collapsible.CollapsibleContent>
                  <ActionGrid>
                    {analysis.recoveryActions.map((action, index) => (
                      <ActionCard key={index} $priority={action.priority}>
                        <h4>{action.title}</h4>
                        <p>{action.description}</p>
                        {action.estimatedTime && (
                          <p style={{ fontStyle: 'italic', color: '#9ca3af' }}>
                            Estimated time: {action.estimatedTime}
                          </p>
                        )}
                        <ActionButton
                          $variant={action.priority === 1 ? 'primary' : 'secondary'}
                          onClick={() => executeRecoveryAction(action)}
                          disabled={isRetrying || (action.type === 'RETRY' && retryCountdown !== null)}
                        >
                          {action.type === 'RETRY' && <FiRefreshCw size={14} />}
                          {action.type === 'CONTACT_SUPPORT' && <FiPhone size={14} />}
                          {action.type === 'ALTERNATIVE' && <FiHelpCircle size={14} />}
                          {action.type === 'MANUAL_CONFIG' && <FiSettings size={14} />}
                          {action.title}
                        </ActionButton>
                      </ActionCard>
                    ))}
                  </ActionGrid>
                </Collapsible.CollapsibleContent>
              )}
            </Collapsible.CollapsibleSection>

            {analysis.preventionTips.length > 0 && (
              <Collapsible.CollapsibleSection>
                <Collapsible.CollapsibleHeaderButton
                  onClick={() => toggleSection('prevention')}
                  aria-expanded={!collapsedSections.prevention}
                >
                  <Collapsible.CollapsibleTitle>
                    <FiCheckCircle /> Prevention Tips
                  </Collapsible.CollapsibleTitle>
                  <Collapsible.CollapsibleToggleIcon $collapsed={collapsedSections.prevention}>
                    <FiRefreshCw />
                  </Collapsible.CollapsibleToggleIcon>
                </Collapsible.CollapsibleHeaderButton>
                {!collapsedSections.prevention && (
                  <Collapsible.CollapsibleContent>
                    <PreventionTips>
                      <h4>Tips to prevent this error in the future:</h4>
                      <ul>
                        {analysis.preventionTips.map((tip, index) => (
                          <li key={index}>{tip}</li>
                        ))}
                      </ul>
                    </PreventionTips>
                  </Collapsible.CollapsibleContent>
                )}
              </Collapsible.CollapsibleSection>
            )}

            <Collapsible.CollapsibleSection>
              <Collapsible.CollapsibleHeaderButton
                onClick={() => toggleSection('details')}
                aria-expanded={!collapsedSections.details}
              >
                <Collapsible.CollapsibleTitle>
                  <FiSettings /> Technical Details
                </Collapsible.CollapsibleTitle>
                <Collapsible.CollapsibleToggleIcon $collapsed={collapsedSections.details}>
                  <FiRefreshCw />
                </Collapsible.CollapsibleToggleIcon>
              </Collapsible.CollapsibleButton>
              {!collapsedSections.details && (
                <Collapsible.CollapsibleContent>
                  <Cards.ParameterGrid>
                    <Cards.ParameterLabel>Error Code</Cards.ParameterLabel>
                    <Cards.ParameterValue>{error.code}</Cards.ParameterValue>
                    
                    <Cards.ParameterLabel>Error Type</Cards.ParameterLabel>
                    <Cards.ParameterValue>{analysis.errorType}</Cards.ParameterValue>
                    
                    <Cards.ParameterLabel>Severity</Cards.ParameterLabel>
                    <Cards.ParameterValue>{analysis.severity}</Cards.ParameterValue>
                    
                    <Cards.ParameterLabel>Retryable</Cards.ParameterLabel>
                    <Cards.ParameterValue>{analysis.isRetryable ? 'Yes' : 'No'}</Cards.ParameterValue>
                    
                    {analysis.maxRetries && (
                      <>
                        <Cards.ParameterLabel>Max Retries</Cards.ParameterLabel>
                        <Cards.ParameterValue>{analysis.maxRetries}</Cards.ParameterValue>
                      </>
                    )}
                    
                    {context.username && (
                      <>
                        <Cards.ParameterLabel>Username</Cards.ParameterLabel>
                        <Cards.ParameterValue>{context.username}</Cards.ParameterValue>
                      </>
                    )}
                    
                    {context.environmentId && (
                      <>
                        <Cards.ParameterLabel>Environment ID</Cards.ParameterLabel>
                        <Cards.ParameterValue>{context.environmentId}</Cards.ParameterValue>
                      </>
                    )}
                  </Cards.ParameterGrid>
                  
                  <TechnicalDetails>
                    <strong>Technical Details:</strong><br />
                    {analysis.technicalDetails}
                    {error.details && (
                      <>
                        <br /><br />
                        <strong>Additional Details:</strong><br />
                        {error.details}
                      </>
                    )}
                  </TechnicalDetails>
                </Collapsible.CollapsibleContent>
              )}
            </Collapsible.CollapsibleSection>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
              {onDismiss && (
                <ActionButton onClick={onDismiss}>
                  <FiXCircle size={14} />
                  Dismiss
                </ActionButton>
              )}
              
              {onRetry && analysis.isRetryable && (
                <ActionButton
                  $variant="primary"
                  onClick={handleManualRetry}
                  disabled={isRetrying || retryCountdown !== null}
                >
                  {isRetrying ? (
                    <>
                      <FiRefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
                      Retrying...
                    </>
                  ) : retryCountdown !== null ? (
                    <>
                      <FiClock size={14} />
                      Retry in {retryCountdown}s
                    </>
                  ) : (
                    <>
                      <FiRefreshCw size={14} />
                      Try Again
                    </>
                  )}
                </ActionButton>
              )}
            </div>
          </Layout.StepContentWrapper>
        </Layout.MainCard>
      </Layout.ContentWrapper>
    </Layout.Container>
  );
};

export default AuthErrorRecoveryV6;