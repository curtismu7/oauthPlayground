 
// src/components/EnhancedStepFlow.tsx
import React, { useState} from 'react';
import styled from 'styled-components';
import { logger } from '../utils/logger';
import '../styles/enhanced-flow.css';

// Enhanced step interface with more options
export interface EnhancedFlowStep {
  id: string;
  title: string;
  description: string;
  code?: string;
  execute?: () => Promise<unknown>;
  result?: unknown;
  error?: string;
  timestamp?: number;
  duration?: number;
  canSkip?: boolean;
  isOptional?: boolean;
  dependencies?: string[]; // Step IDs this step depends on
  category?: 'preparation' | 'authorization' | 'token-exchange' | 'validation' | 'cleanup';
  debugInfo?: Record<string, unknown>;
  tips?: string[];
  securityNotes?: string[];
}

interface StepHistory {
  stepId: string;
  timestamp: number;
  result?: unknown;
  error?: string;
  duration: number;
}

interface EnhancedStepFlowProps {
  steps: EnhancedFlowStep[];
  title: string;
  onStepComplete?: (stepId: string, result: unknown) => void;
  onStepError?: (stepId: string, error: string) => void;
  onFlowComplete?: (results: Record<string, unknown>) => void;
  persistKey?: string; // Key for localStorage persistence
  autoAdvance?: boolean;
  showDebugInfo?: boolean;
  allowStepJumping?: boolean;
}

// Styled Components
const FlowContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const FlowHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: ${({ theme }) => theme.colors.gray50};
  border-radius: 0.5rem;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
`;

const FlowTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.gray900};
  font-size: 1.25rem;
  font-weight: 600;
`;

const FlowControls = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const ControlButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  ${({ $variant, theme }) => {
    switch ($variant) {
      case 'primary':
        return `
          background-color: ${theme.colors.primary};
          color: white;
          &:hover { background-color: ${theme.colors.primaryDark}; }
        `;
      case 'danger':
        return `
          background-color: ${theme.colors.error};
          color: white;
          &:hover { background-color: ${theme.colors.errorDark}; }
        `;
      default:
        return `
          background-color: ${theme.colors.gray100};
          color: ${theme.colors.gray700};
          border: 1px solid ${theme.colors.gray300};
          &:hover { background-color: ${theme.colors.gray200}; }
        `;
    }
  }}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const StepNavigator = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: white;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const StepProgress = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StepDot = styled.div<{ $active?: boolean; $completed?: boolean; $hasError?: boolean }>`
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  ${({ $active, $completed, $hasError, theme }) => {
    if ($hasError) {
      return `
        background-color: ${theme.colors.error};
        color: white;
        border: 2px solid ${theme.colors.errorDark};
      `;
    } else if ($completed) {
      return `
        background-color: ${theme.colors.success};
        color: white;
        border: 2px solid ${theme.colors.successDark};
      `;
    } else if ($active) {
      return `
        background-color: ${theme.colors.primary};
        color: white;
        border: 2px solid ${theme.colors.primaryDark};
        transform: scale(1.1);
      `;
    } else {
      return `
        background-color: ${theme.colors.gray200};
        color: ${theme.colors.gray600};
        border: 2px solid ${theme.colors.gray300};
      `;
    }
  }}
  
  &:hover {
    transform: scale(1.05);
  }
`;

const StepContainer = styled.div<{ $active?: boolean; $completed?: boolean; $hasError?: boolean }>`
  background: white;
  border: 2px solid ${({ $active, $completed, $hasError, theme }) => {
    if ($hasError) return theme.colors.error;
    if ($completed) return theme.colors.success;
    if ($active) return theme.colors.primary;
    return theme.colors.gray200;
  }};
  border-radius: 0.5rem;
  overflow: hidden;
  transition: all 0.3s;
  
  ${({ $active }) => $active && `
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  `}
`;

const StepHeader = styled.div<{ $active?: boolean; $completed?: boolean; $hasError?: boolean }>`
  padding: 1rem 1.5rem;
  background: ${({ $active, $completed, $hasError, theme }) => {
    if ($hasError) return `${theme.colors.error}10`;
    if ($completed) return `${theme.colors.success}10`;
    if ($active) return `${theme.colors.primary}10`;
    return theme.colors.gray50;
  }};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray200};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const StepTitleSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const StepTitle = styled.h3`
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray900};
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StepDescription = styled.p`
  margin: 0;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.gray600};
`;

const StepMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.gray500};
`;

const StepContent = styled.div`
  padding: 1.5rem;
`;

const CodeBlock = styled.pre`
  background: ${({ theme }) => theme.colors.gray900};
  color: ${({ theme }) => theme.colors.gray100};
  padding: 1rem;
  border-radius: 0.375rem;
  overflow-x: auto;
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 1rem 0;
  position: relative;
`;

const CopyButton = styled.button`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: ${({ theme }) => theme.colors.gray700};
  color: white;
  border: none;
  border-radius: 0.25rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s;
  
  &:hover {
    opacity: 1;
  }
`;

const StepResult = styled.div<{ $hasError?: boolean }>`
  margin-top: 1rem;
  padding: 1rem;
  background: ${({ $hasError, theme }) => 
    $hasError ? `${theme.colors.error}10` : `${theme.colors.success}10`
  };
  border: 1px solid ${({ $hasError, theme }) => 
    $hasError ? theme.colors.error : theme.colors.success
  };
  border-radius: 0.375rem;
`;

const StepActions = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
  flex-wrap: wrap;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'success' | 'danger' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  ${({ $variant, theme }) => {
    switch ($variant) {
      case 'primary':
        return `
          background-color: ${theme.colors.primary};
          color: white;
          &:hover { background-color: ${theme.colors.primaryDark}; }
        `;
      case 'success':
        return `
          background-color: ${theme.colors.success};
          color: white;
          &:hover { background-color: ${theme.colors.successDark}; }
        `;
      case 'danger':
        return `
          background-color: ${theme.colors.error};
          color: white;
          &:hover { background-color: ${theme.colors.errorDark}; }
        `;
      default:
        return `
          background-color: ${theme.colors.gray100};
          color: ${theme.colors.gray700};
          border: 1px solid ${theme.colors.gray300};
          &:hover { background-color: ${theme.colors.gray200}; }
        `;
    }
  }}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const DebugPanel = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  background: ${({ theme }) => theme.colors.gray50};
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 0.375rem;
`;

const DebugTitle = styled.h4`
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray700};
`;

const DebugContent = styled.pre`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.gray600};
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
`;

// Enhanced Step Flow Component
const EnhancedStepFlow: React.FC<EnhancedStepFlowProps> = ({
  steps,
  title,
  onStepComplete,
  onStepError,
  onFlowComplete,
  persistKey = 'enhanced_flow_state',
  autoAdvance = true,
  showDebugInfo = false,
  allowStepJumping = true
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepResults, setStepResults] = useState<Record<string, unknown>>({});
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const [executingStep, setExecutingStep] = useState<string | null>(null);
  const [stepHistory, setStepHistory] = useState<StepHistory[]>([]);
  const [showDebugPanel, setShowDebugPanel] = useState(showDebugInfo);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const currentStep = steps[currentStepIndex];
  
  // Load persisted state on mount
  useEffect(() => {
    if (persistKey) {
      try {
        const saved = localStorage.getItem(persistKey);
        if (saved) {
          const state = JSON.parse(saved);
          setCurrentStepIndex(state.currentStepIndex || 0);
          setStepResults(state.stepResults || {});
          setStepHistory(state.stepHistory || []);
          logger.info('EnhancedStepFlow', 'Loaded persisted state', state);
        }
      } catch (_error) {
        logger.error('EnhancedStepFlow', 'Failed to load persisted state', error instanceof Error ? error.message : String(_error), error instanceof Error ? error : undefined);
      }
    }
  }, [persistKey]);

  // Save state to localStorage
  const saveState = useCallback(() => {
    if (persistKey) {
      try {
        const state = {
          currentStepIndex,
          stepResults,
          stepHistory,
          timestamp: Date.now()
        };
        localStorage.setItem(persistKey, JSON.stringify(state));
        logger.debug('EnhancedStepFlow', 'Saved state to localStorage', state);
      } catch (_error) {
        logger.error('EnhancedStepFlow', 'Failed to save state', error instanceof Error ? error.message : String(_error), error instanceof Error ? error : undefined);
      }
    }
  }, [persistKey, currentStepIndex, stepResults, stepHistory]);

  // Auto-save state when it changes
  useEffect(() => {
    saveState();
  }, [saveState]);

  // Execute a step
  const executeStep = useCallback(async (stepId: string) => {
    const step = steps.find(s => s.id === stepId);
    if (!step || !step.execute) return;

    setExecutingStep(stepId);
    const startTime = Date.now();

    try {
      logger.info('EnhancedStepFlow', `Executing step: ${stepId}`, `step: ${step.title}`);

      const duration = Date.now() - startTime;
      
      // Update step results
      setStepResults(prev => ({ ...prev, [stepId]: result }));
      
      // Clear any previous errors
      setStepErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[stepId];
        return newErrors;
      });
      
      // Add to history
      const historyEntry: StepHistory = {
        stepId,
        timestamp: Date.now(),
        result,
        duration
      };
      setStepHistory(prev => [...prev, historyEntry]);
      
      // Notify parent
      onStepComplete?.(stepId, result);
      
      logger.success('EnhancedStepFlow', `Step completed: ${stepId}`, `result: ${JSON.stringify(result)}, duration: ${duration}ms`);
      
      // Auto-advance if enabled
      if (autoAdvance && currentStepIndex < steps.length - 1) {
        setTimeout(() => {
          setCurrentStepIndex(prev => prev + 1);
        }, 1000);
      }
      
    } catch (_error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Update step errors
      setStepErrors(prev => ({ ...prev, [stepId]: errorMessage }));
      
      // Add to history
      const historyEntry: StepHistory = {
        stepId,
        timestamp: Date.now(),
        error: errorMessage,
        duration
      };
      setStepHistory(prev => [...prev, historyEntry]);
      
      // Notify parent
      onStepError?.(stepId, errorMessage);
      
      logger.error('EnhancedStepFlow', `Step failed: ${stepId}`, error instanceof Error ? error.message : String(_error), error instanceof Error ? error : undefined);
    } finally {
      setExecutingStep(null);
    }
  }, [steps, currentStepIndex, autoAdvance, onStepComplete, onStepError]);

  // Navigation functions
  const goToStep = useCallback((index: number) => {
    if (index >= 0 && index < steps.length && (allowStepJumping || Math.abs(index - currentStepIndex) <= 1)) {
      setCurrentStepIndex(index);
      logger.debug('EnhancedStepFlow', `Navigated to step ${index}`, `stepId: ${steps[index]?.id}`);
    }
  }, [steps, currentStepIndex, allowStepJumping]);

  const nextStep = useCallback(() => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    }
  }, [currentStepIndex, steps.length]);

  const previousStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  }, [currentStepIndex]);

  // Reset flow
  const resetFlow = useCallback(() => {
    setCurrentStepIndex(0);
    setStepResults({});
    setStepErrors({});
    setStepHistory([]);
    if (persistKey) {
      localStorage.removeItem(persistKey);
    }
    logger.info('EnhancedStepFlow', 'Flow reset');
  }, [persistKey]);

  // Copy code to clipboard
  const copyCode = useCallback(async (code: string, stepId: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(stepId);
      setTimeout(() => setCopiedCode(null), 2000);
      logger.debug('EnhancedStepFlow', 'Code copied to clipboard', `stepId: ${stepId}`);
    } catch (_error) {
      logger.error('EnhancedStepFlow', 'Failed to copy code', error instanceof Error ? error.message : String(_error), error instanceof Error ? error : undefined);
    }
  }, []);

  // Check if step is completed
  const isStepCompleted = useCallback((stepId: string) => {
    return stepResults[stepId] !== undefined && !stepErrors[stepId];
  }, [stepResults, stepErrors]);

  // Check if step has error
  const hasStepError = useCallback((stepId: string) => {
    return stepErrors[stepId] !== undefined;
  }, [stepErrors]);

  // Get step status
  const getStepStatus = useCallback((step: EnhancedFlowStep, index: number) => {
    const isActive = index === currentStepIndex;
    const isCompleted = isStepCompleted(step.id);
    const hasError = hasStepError(step.id);
    const isExecuting = executingStep === step.id;
    
    return { isActive, isCompleted, hasError, isExecuting };
  }, [currentStepIndex, isStepCompleted, hasStepError, executingStep]);

  // Check if flow is complete
  const isFlowComplete = useMemo(() => {
    return steps.every(step => isStepCompleted(step.id));
  }, [steps, isStepCompleted]);

  // Notify when flow is complete
  useEffect(() => {
    if (isFlowComplete) {
      onFlowComplete?.(stepResults);
      logger.success('EnhancedStepFlow', 'Flow completed', `results: ${JSON.stringify(stepResults)}`);
    }
  }, [isFlowComplete, stepResults, onFlowComplete]);

  return (
    <FlowContainer>
      {/* Flow Header */}
      <FlowHeader>
        <FlowTitle>{title}</FlowTitle>
        <FlowControls>
          <ControlButton onClick={() => setShowDebugPanel(!showDebugPanel)}>
            <FiSettings />
            Debug
          </ControlButton>
          <ControlButton onClick={resetFlow} $variant="danger">
            <FiRefreshCw />
            Reset
          </ControlButton>
          <ControlButton onClick={saveState}>
            <FiSave />
            Save
          </ControlButton>
        </FlowControls>
      </FlowHeader>

      {/* Step Navigator */}
      <StepNavigator>
        <StepProgress>
          {steps.map((step, index) => {
            const { isActive, isCompleted, hasError } = getStepStatus(step, index);
            return (
              <StepDot
                key={step.id}
                $active={isActive}
                $completed={isCompleted}
                $hasError={hasError}
                onClick={() => goToStep(index)}
                title={`${step.title} - ${isCompleted ? 'Completed' : hasError ? 'Error' : 'Pending'}`}
              >
                {hasError ? <FiX /> : isCompleted ? <FiCheck /> : index + 1}
              </StepDot>
            );
          })}
        </StepProgress>
        
        <FlowControls>
          <ControlButton onClick={previousStep} disabled={currentStepIndex === 0}>
            <FiChevronLeft />
            Previous
          </ControlButton>
          <ControlButton onClick={nextStep} disabled={currentStepIndex === steps.length - 1}>
            Next
            <FiChevronRight />
          </ControlButton>
        </FlowControls>
      </StepNavigator>

      {/* Current Step */}
      {currentStep && (
        <StepContainer
          $active={getStepStatus(currentStep, currentStepIndex).isActive}
          $completed={getStepStatus(currentStep, currentStepIndex).isCompleted}
          $hasError={getStepStatus(currentStep, currentStepIndex).hasError}
        >
          <StepHeader
            $active={getStepStatus(currentStep, currentStepIndex).isActive}
            $completed={getStepStatus(currentStep, currentStepIndex).isCompleted}
            $hasError={getStepStatus(currentStep, currentStepIndex).hasError}
          >
            <StepTitleSection>
              <StepTitle>
                {currentStep.category && (
                  <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                    [{currentStep.category.toUpperCase()}]
                  </span>
                )}
                {currentStep.title}
                {currentStep.isOptional && (
                  <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>(Optional)</span>
                )}
              </StepTitle>
              <StepDescription>{currentStep.description}</StepDescription>
            </StepTitleSection>
            
            <StepMeta>
              {stepHistory.find(h => h.stepId === currentStep.id) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <FiClock />
                  {stepHistory.find(h => h.stepId === currentStep.id)?.duration}ms
                </div>
              )}
              <div>Step {currentStepIndex + 1} of {steps.length}</div>
            </StepMeta>
          </StepHeader>

          <StepContent>
            {/* Code Block */}
            {currentStep.code && (
              <div style={{ position: 'relative' }}>
                <CodeBlock>
                  {currentStep.code}
                  <CopyButton
                    onClick={() => copyCode(currentStep.code!, currentStep.id)}
                  >
                    {copiedCode === currentStep.id ? <FiCheck /> : <FiCopy />}
                    {copiedCode === currentStep.id ? 'Copied!' : 'Copy'}
                  </CopyButton>
                </CodeBlock>
              </div>
            )}

            {/* Step Result */}
            {stepResults[currentStep.id] && (
              <StepResult>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#059669' }}>✅ Result:</h4>
                <pre style={{ margin: 0, fontSize: '0.875rem' }}>
                  {typeof stepResults[currentStep.id] === 'string' 
                    ? stepResults[currentStep.id] 
                    : JSON.stringify(stepResults[currentStep.id], null, 2)
                  }
                </pre>
              </StepResult>
            )}

            {/* Step Error */}
            {stepErrors[currentStep.id] && (
              <StepResult $hasError>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#DC2626' }}>❌ Error:</h4>
                <pre style={{ margin: 0, fontSize: '0.875rem' }}>
                  {stepErrors[currentStep.id]}
                </pre>
              </StepResult>
            )}

            {/* Step Actions */}
            <StepActions>
              {currentStep.execute && (
                <ActionButton
                  $variant="primary"
                  onClick={() => executeStep(currentStep.id)}
                  disabled={executingStep === currentStep.id}
                >
                  {executingStep === currentStep.id ? (
                    <>
                      <FiRefreshCw style={{ animation: 'spin 1s linear infinite' }} />
                      Executing...
                    </>
                  ) : (
                    <>
                      <FiPlay />
                      Execute Step
                    </>
                  )}
                </ActionButton>
              )}
              
              {currentStep.canSkip && (
                <ActionButton onClick={nextStep}>
                  <FiSkipForward />
                  Skip Step
                </ActionButton>
              )}
              
              {stepResults[currentStep.id] && (
                <ActionButton
                  $variant="success"
                  onClick={() => executeStep(currentStep.id)}
                >
                  <FiRefreshCw />
                  Re-execute
                </ActionButton>
              )}
            </StepActions>

            {/* Debug Panel */}
            {showDebugPanel && (
              <DebugPanel>
                <DebugTitle>🔍 Debug Information</DebugTitle>
                <DebugContent>
                  {JSON.stringify({
                    stepId: currentStep.id,
                    stepIndex: currentStepIndex,
                    isCompleted: isStepCompleted(currentStep.id),
                    hasError: hasStepError(currentStep.id),
                    result: stepResults[currentStep.id],
                    error: stepErrors[currentStep.id],
                    debugInfo: currentStep.debugInfo,
                    history: stepHistory.filter(h => h.stepId === currentStep.id)
                  }, null, 2)}
                </DebugContent>
              </DebugPanel>
            )}
          </StepContent>
        </StepContainer>
      )}

      {/* Flow Complete Message */}
      {isFlowComplete && (
        <StepResult>
          <h3 style={{ margin: '0 0 1rem 0', color: '#059669' }}>
            🎉 Flow Complete!
          </h3>
          <p>All steps have been successfully executed. You can review the results above or start over.</p>
          <ActionButton $variant="primary" onClick={resetFlow}>
            <FiRefreshCw />
            Start Over
          </ActionButton>
        </StepResult>
      )}
    </FlowContainer>
  );
};

export default EnhancedStepFlow;
