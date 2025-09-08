// src/components/EnhancedStepFlowV2.tsx - Enhanced with new design system
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { 
  FiPlay, 
  FiPause, 
  FiSkipForward, 
  FiSkipBack, 
  FiRefreshCw, 
  FiSave,
  FiEye,
  FiEyeOff,
  FiCopy,
  FiCheck,
  FiX,
  FiAlertCircle,
  FiChevronLeft,
  FiChevronRight,
  FiSettings,
  FiBookmark,
  FiClock,
  FiZap,
  FiChevronDown,
  FiChevronUp,
  FiInfo,
  FiShield,
  FiUser,
  FiKey,
  FiGlobe,
  FiCode,
  FiCheckCircle,
  FiXCircle,
  FiAlertTriangle
} from 'react-icons/fi';
import { logger } from '../utils/logger';
import '../styles/enhanced-flow.css';

// Enhanced step interface with more options
export interface EnhancedFlowStep {
  id: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
  code?: string;
  execute?: () => Promise<any>;
  result?: any;
  error?: string;
  timestamp?: number;
  duration?: number;
  canSkip?: boolean;
  isOptional?: boolean;
  dependencies?: string[]; // Step IDs this step depends on
  category?: 'preparation' | 'authorization' | 'token-exchange' | 'validation' | 'cleanup';
  debugInfo?: Record<string, any>;
  tips?: string[];
  securityNotes?: string[];
  content?: React.ReactNode; // Custom content for the step
}

interface StepHistory {
  stepId: string;
  timestamp: number;
  result?: any;
  error?: string;
  duration: number;
}

interface EnhancedStepFlowProps {
  steps: EnhancedFlowStep[];
  title: string;
  onStepComplete?: (stepId: string, result: any) => void;
  onStepError?: (stepId: string, error: string) => void;
  onFlowComplete?: (results: Record<string, any>) => void;
  persistKey?: string; // Key for localStorage persistence
  autoAdvance?: boolean;
  showDebugInfo?: boolean;
  allowStepJumping?: boolean;
}

// Enhanced Styled Components with new design system
const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  background: #f8fafc;
  min-height: 100vh;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Subtitle = styled.p`
  font-size: 1.125rem;
  color: #64748b;
  margin-bottom: 2rem;
`;

// Enhanced Step Progress with new design system
const StepProgressContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2rem;
  padding: 1rem;
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const StepProgressWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  position: relative;
`;

const StepIndicator = styled.div<{ status: 'completed' | 'active' | 'pending' | 'error' }>`
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid #e5e7eb;
  background: white;
  color: #6b7280;
  position: relative;
  z-index: 2;
  
  ${props => {
    switch (props.status) {
      case 'completed':
        return `
          background: #10b981;
          color: white;
          border-color: #10b981;
        `;
      case 'active':
        return `
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
        `;
      case 'error':
        return `
          background: #ef4444;
          color: white;
          border-color: #ef4444;
        `;
      default:
        return `
          background: white;
          color: #9ca3af;
          border-color: #e5e7eb;
        `;
    }
  }}
  
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

const StepConnector = styled.div<{ $completed: boolean; $active: boolean }>`
  width: 3rem;
  height: 2px;
  background: ${props => {
    if (props.$completed) return '#10b981';
    if (props.$active) return 'linear-gradient(to right, #10b981 50%, #e5e7eb 50%)';
    return '#e5e7eb';
  }};
  position: relative;
  z-index: 1;
  transition: background 0.3s ease;
`;

const StepLabel = styled.div`
  position: absolute;
  top: -2.5rem;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.75rem;
  font-weight: 500;
  color: #6b7280;
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
  
  ${StepIndicator}:hover & {
    opacity: 1;
  }
`;

const StepCount = styled.div`
  margin-left: 1rem;
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
`;

// Step Content Area
const StepContent = styled.div`
  background: white;
  border-radius: 0.75rem;
  padding: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
`;

const StepHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
`;

const StepIcon = styled.div`
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  color: #3b82f6;
`;

const StepTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const StepDescription = styled.div`
  background: #f9fafb;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
  border-left: 4px solid #3b82f6;
`;

const StepDescriptionText = styled.p`
  margin: 0;
  color: #6b7280;
  font-size: 1rem;
`;

// Action Buttons
const ActionButtons = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
`;

const Button = styled.button<{ 
  $variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'outline';
  $size?: 'sm' | 'md' | 'lg';
  $loading?: boolean;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: ${props => {
    switch (props.$size) {
      case 'sm': return '0.5rem 1rem';
      case 'lg': return '1rem 2rem';
      default: return '0.75rem 1.5rem';
    }
  }};
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  
  ${props => {
    switch (props.$variant) {
      case 'primary':
        return `
          background: #3b82f6;
          color: white;
          &:hover:not(:disabled) {
            background: #2563eb;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
          }
        `;
      case 'secondary':
        return `
          background: white;
          color: #1f2937;
          border: 1px solid #e5e7eb;
          &:hover:not(:disabled) {
            background: #f9fafb;
            border-color: #6b7280;
          }
        `;
      case 'success':
        return `
          background: #10b981;
          color: white;
          &:hover:not(:disabled) {
            background: #059669;
            transform: translateY(-1px);
          }
        `;
      case 'danger':
        return `
          background: #ef4444;
          color: white;
          &:hover:not(:disabled) {
            background: #dc2626;
            transform: translateY(-1px);
          }
        `;
      case 'outline':
        return `
          background: transparent;
          color: #3b82f6;
          border: 1px solid #3b82f6;
          &:hover:not(:disabled) {
            background: #3b82f6;
            color: white;
          }
        `;
      default:
        return `
          background: #6b7280;
          color: white;
          &:hover:not(:disabled) {
            background: #4b5563;
          }
        `;
    }
  }}
  
  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
  
  ${props => props.$loading && `
    color: transparent;
    cursor: wait;
    
    &::after {
      content: '';
      position: absolute;
      width: 1rem;
      height: 1rem;
      border: 2px solid transparent;
      border-top: 2px solid currentColor;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
  `}
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

// Collapsible Panels
const CollapsiblePanel = styled.div`
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
  overflow: hidden;
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: #f9fafb;
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  &:hover {
    background: #e5e7eb;
  }
`;

const PanelTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const PanelToggle = styled.button`
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #6b7280;
  cursor: pointer;
  transition: transform 0.2s ease;
  
  &.expanded {
    transform: rotate(180deg);
  }
`;

const PanelContent = styled.div<{ $expanded: boolean }>`
  max-height: ${props => props.$expanded ? '1000px' : '0'};
  overflow: hidden;
  transition: max-height 0.3s ease, padding 0.3s ease;
  padding: ${props => props.$expanded ? '1.5rem' : '0 1.5rem'};
`;

// Status Indicators
const StatusIndicator = styled.div<{ type: 'success' | 'error' | 'warning' | 'info' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  
  ${props => {
    switch (props.type) {
      case 'success':
        return `
          background: #ecfdf5;
          color: #10b981;
        `;
      case 'error':
        return `
          background: #fef2f2;
          color: #ef4444;
        `;
      case 'warning':
        return `
          background: #fffbeb;
          color: #f59e0b;
        `;
      case 'info':
        return `
          background: #eff6ff;
          color: #3b82f6;
        `;
    }
  }}
`;

// Code Blocks
const CodeBlock = styled.div`
  background: #1f2937;
  color: #e5e7eb;
  padding: 1rem;
  border-radius: 0.5rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  overflow-x: auto;
  margin: 1rem 0;
  position: relative;
`;

const CopyButton = styled.button`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #e5e7eb;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

// JSON Display
const JsonDisplay = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  overflow-x: auto;
  white-space: pre-wrap;
`;

// Loading States
const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 2px solid #e5e7eb;
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
`;

// Progress Bar
const ProgressBar = styled.div`
  width: 100%;
  height: 0.5rem;
  background: #e5e7eb;
  border-radius: 0.25rem;
  overflow: hidden;
  margin: 1rem 0;
`;

const ProgressFill = styled.div<{ $progress: number }>`
  height: 100%;
  background: #3b82f6;
  transition: width 0.3s ease;
  border-radius: 0.25rem;
  width: ${props => props.$progress}%;
`;

// Responsive Design
const ResponsiveContainer = styled.div`
  @media (max-width: 768px) {
    padding: 1rem;
    
    ${StepProgressWrapper} {
      flex-direction: column;
      gap: 0.75rem;
    }
    
    ${StepConnector} {
      width: 2px;
      height: 2rem;
    }
    
    ${StepContent} {
      padding: 1.5rem;
    }
    
    ${ActionButtons} {
      flex-direction: column;
      align-items: stretch;
    }
    
    ${Button} {
      width: 100%;
      justify-content: center;
    }
  }
  
  @media (max-width: 480px) {
    padding: 0.75rem;
    
    ${StepContent} {
      padding: 1rem;
    }
    
    ${StepHeader} {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }
    
    ${StepTitle} {
      font-size: 1.25rem;
    }
  }
`;

// Main Component
export const EnhancedStepFlowV2: React.FC<EnhancedStepFlowProps> = ({
  steps,
  title,
  onStepComplete,
  onStepError,
  onFlowComplete,
  persistKey,
  autoAdvance = false,
  showDebugInfo = true,
  allowStepJumping = true
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepHistory, setStepHistory] = useState<StepHistory[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Load persisted state
  useEffect(() => {
    if (persistKey) {
      try {
        const saved = localStorage.getItem(`enhanced-flow-${persistKey}`);
        if (saved) {
          const data = JSON.parse(saved);
          setCurrentStepIndex(data.currentStepIndex || 0);
          setStepHistory(data.stepHistory || []);
        }
      } catch (error) {
        logger.warn('Failed to load persisted flow state', { error });
      }
    }
  }, [persistKey]);

  // Save state to localStorage
  const saveState = useCallback(() => {
    if (persistKey) {
      try {
        const data = {
          currentStepIndex,
          stepHistory,
          timestamp: Date.now()
        };
        localStorage.setItem(`enhanced-flow-${persistKey}`, JSON.stringify(data));
      } catch (error) {
        logger.warn('Failed to save flow state', { error });
      }
    }
  }, [persistKey, currentStepIndex, stepHistory]);

  useEffect(() => {
    saveState();
  }, [saveState]);

  // Get step status
  const getStepStatus = useCallback((stepIndex: number): 'completed' | 'active' | 'pending' | 'error' => {
    if (stepIndex < currentStepIndex) {
      const history = stepHistory.find(h => h.stepId === steps[stepIndex]?.id);
      return history?.error ? 'error' : 'completed';
    }
    if (stepIndex === currentStepIndex) {
      return 'active';
    }
    return 'pending';
  }, [currentStepIndex, stepHistory, steps]);

  // Execute step
  const executeStep = useCallback(async (stepIndex: number) => {
    const step = steps[stepIndex];
    if (!step || !step.execute) return;

    setIsExecuting(true);
    const startTime = Date.now();

    try {
      logger.info(`Executing step: ${step.title}`, { stepId: step.id });
      const result = await step.execute();
      const duration = Date.now() - startTime;

      const historyEntry: StepHistory = {
        stepId: step.id,
        timestamp: Date.now(),
        result,
        duration
      };

      setStepHistory(prev => [...prev.filter(h => h.stepId !== step.id), historyEntry]);
      onStepComplete?.(step.id, result);

      // Auto-advance if enabled and not the last step
      if (autoAdvance && stepIndex < steps.length - 1) {
        setTimeout(() => {
          setCurrentStepIndex(stepIndex + 1);
        }, 1000);
      }

      logger.info(`Step completed: ${step.title}`, { duration, result });
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      const historyEntry: StepHistory = {
        stepId: step.id,
        timestamp: Date.now(),
        error: errorMessage,
        duration
      };

      setStepHistory(prev => [...prev.filter(h => h.stepId !== step.id), historyEntry]);
      onStepError?.(step.id, errorMessage);

      logger.error(`Step failed: ${step.title}`, { error: errorMessage, duration });
    } finally {
      setIsExecuting(false);
    }
  }, [steps, autoAdvance, onStepComplete, onStepError]);

  // Navigation functions
  const goToStep = useCallback((stepIndex: number) => {
    if (allowStepJumping || stepIndex <= currentStepIndex) {
      setCurrentStepIndex(stepIndex);
    }
  }, [allowStepJumping, currentStepIndex]);

  const goToNextStep = useCallback(() => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      // Flow complete
      const results = stepHistory.reduce((acc, entry) => {
        if (entry.result) {
          acc[entry.stepId] = entry.result;
        }
        return acc;
      }, {} as Record<string, any>);
      onFlowComplete?.(results);
    }
  }, [currentStepIndex, steps.length, stepHistory, onFlowComplete]);

  const goToPreviousStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  }, [currentStepIndex]);

  // Copy to clipboard
  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      setTimeout(() => setCopiedText(null), 2000);
    } catch (error) {
      logger.error('Failed to copy to clipboard', { error });
    }
  }, []);

  // Get current step
  const currentStep = steps[currentStepIndex];
  const completedSteps = stepHistory.filter(h => !h.error).length;
  const progress = (completedSteps / steps.length) * 100;

  if (!currentStep) {
    return (
      <Container>
        <Header>
          <Title>Flow Complete!</Title>
          <Subtitle>All steps have been completed successfully.</Subtitle>
        </Header>
      </Container>
    );
  }

  return (
    <ResponsiveContainer>
      <Container>
        <Header>
          <Title>{title}</Title>
          <Subtitle>Interactive step-by-step OAuth flow with enhanced debugging</Subtitle>
        </Header>

        {/* Step Progress Indicator */}
        <StepProgressContainer>
          <StepProgressWrapper>
            {steps.map((step, index) => {
              const status = getStepStatus(index);
              const isLast = index === steps.length - 1;
              
              return (
                <React.Fragment key={step.id}>
                  <StepIndicator
                    status={status}
                    onClick={() => goToStep(index)}
                    title={`Step ${index + 1}: ${step.title}`}
                  >
                    {status === 'completed' ? <FiCheckCircle /> : 
                     status === 'error' ? <FiXCircle /> : 
                     index + 1}
                    <StepLabel>{step.title}</StepLabel>
                  </StepIndicator>
                  {!isLast && (
                    <StepConnector
                      $completed={status === 'completed'}
                      $active={status === 'active'}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </StepProgressWrapper>
          <StepCount>
            {completedSteps} of {steps.length} completed
          </StepCount>
        </StepProgressContainer>

        {/* Progress Bar */}
        <ProgressBar>
          <ProgressFill $progress={progress} />
        </ProgressBar>

        {/* Step Content */}
        <StepContent>
          <StepHeader>
            <StepIcon>
              {currentStep.icon || <FiZap />}
            </StepIcon>
            <StepTitle>{currentStep.title}</StepTitle>
          </StepHeader>

          <StepDescription>
            <StepDescriptionText>{currentStep.description}</StepDescriptionText>
          </StepDescription>

          {/* Custom Step Content */}
          {currentStep.content && (
            <div style={{ marginBottom: '1.5rem' }}>
              {currentStep.content}
            </div>
          )}

          {/* Code Block */}
          {currentStep.code && (
            <CodeBlock>
              <CopyButton onClick={() => copyToClipboard(currentStep.code!)}>
                {copiedText === currentStep.code ? <FiCheck /> : <FiCopy />}
              </CopyButton>
              <pre>{currentStep.code}</pre>
            </CodeBlock>
          )}

          {/* Step Result */}
          {currentStep.result && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h4>Result:</h4>
              <JsonDisplay>
                {JSON.stringify(currentStep.result, null, 2)}
              </JsonDisplay>
            </div>
          )}

          {/* Step Error */}
          {currentStep.error && (
            <div style={{ marginBottom: '1.5rem' }}>
              <StatusIndicator type="error">
                <FiAlertCircle />
                Error: {currentStep.error}
              </StatusIndicator>
            </div>
          )}

          {/* Action Buttons */}
          <ActionButtons>
            <Button
              $variant="secondary"
              onClick={goToPreviousStep}
              disabled={currentStepIndex === 0}
            >
              <FiChevronLeft />
              Back
            </Button>

            {currentStep.execute && (
              <Button
                $variant="primary"
                onClick={() => executeStep(currentStepIndex)}
                disabled={isExecuting}
                $loading={isExecuting}
              >
                {isExecuting ? (
                  <>
                    <LoadingSpinner />
                    Executing...
                  </>
                ) : (
                  <>
                    <FiPlay />
                    Execute
                  </>
                )}
              </Button>
            )}

            <Button
              $variant="success"
              onClick={goToNextStep}
              disabled={currentStepIndex === steps.length - 1}
            >
              Next
              <FiChevronRight />
            </Button>
          </ActionButtons>
        </StepContent>

        {/* Collapsible Panels */}
        {showDebugInfo && (
          <>
            {/* Debug Information Panel */}
            <CollapsiblePanel>
              <PanelHeader onClick={() => setShowDebug(!showDebug)}>
                <PanelTitle>
                  <FiSettings />
                  Debug Information
                </PanelTitle>
                <PanelToggle className={showDebug ? 'expanded' : ''}>
                  <FiChevronDown />
                </PanelToggle>
              </PanelHeader>
              <PanelContent $expanded={showDebug}>
                <div>
                  <h4>Step History:</h4>
                  {stepHistory.map((entry, index) => (
                    <div key={index} style={{ marginBottom: '0.5rem' }}>
                      <StatusIndicator type={entry.error ? 'error' : 'success'}>
                        {entry.error ? <FiXCircle /> : <FiCheckCircle />}
                        Step {steps.findIndex(s => s.id === entry.stepId) + 1}: {entry.duration}ms
                      </StatusIndicator>
                    </div>
                  ))}
                  
                  <h4>Current State:</h4>
                  <JsonDisplay>
                    {JSON.stringify({
                      currentStep: currentStepIndex + 1,
                      totalSteps: steps.length,
                      completedSteps,
                      progress: Math.round(progress)
                    }, null, 2)}
                  </JsonDisplay>
                </div>
              </PanelContent>
            </CollapsiblePanel>
          </>
        )}
      </Container>
    </ResponsiveContainer>
  );
};

export default EnhancedStepFlowV2;
