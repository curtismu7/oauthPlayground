/* eslint-disable */
import React, { useState} from 'react';
import styled from 'styled-components';
const FlowContainer = styled.div`
  margin-bottom: 1.5rem;
`;

const StepContainer = styled.div<{ $isActive: boolean; $isCompleted: boolean }>`
  margin-bottom: 2rem;
  padding: 1.5rem;
  border-radius: 0.5rem;
  border: 2px solid ${({ $isActive, $isCompleted }) => 
    $isActive ? '#007bff' : $isCompleted ? '#28a745' : '#dee2e6'};
  background-color: ${({ $isActive, $isCompleted }) => 
    $isActive ? 'rgba(0, 123, 255, 0.05)' : $isCompleted ? 'rgba(40, 167, 69, 0.05)' : '#ffffff'};
  transition: all 0.3s ease;
`;

const StepHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const StepTitle = styled.h4<{ $isActive: boolean; $isCompleted: boolean }>`
  margin: 0;
  color: ${({ $isActive, $isCompleted }) => 
    $isActive ? '#007bff' : $isCompleted ? '#28a745' : '#495057'};
  font-size: 1.1rem;
  font-weight: 600;
`;

const StepNumber = styled.div<{ $isActive: boolean; $isCompleted: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background-color: ${({ $isActive, $isCompleted }) => 
    $isActive ? '#007bff' : $isCompleted ? '#28a745' : '#dee2e6'};
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
`;

const StepDescription = styled.p`
  margin: 0 0 1rem 0;
  color: #6c757d;
  font-size: 0.9rem;
  line-height: 1.5;
`;

const CodeBlock = styled.pre`
  background-color: #1f2937;
  color: #f9fafb;
  padding: 1rem;
  border-radius: 0.375rem;
  overflow-x: auto;
  font-size: 0.875rem;
  margin: 1rem 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  border: 1px solid #374151;
  white-space: pre-wrap;
  position: relative;
`;

const StepActions = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-top: 1rem;
  justify-content: flex-end;
`;

const StepResult = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  background-color: #1f2937;
  border: 1px solid #374151;
  border-radius: 0.5rem;
  color: #ffffff;
  font-family: monospace;
  font-size: 0.875rem;
  
  h4 {
    margin: 0 0 0.5rem 0;
    color: #ffffff;
    font-size: 1rem;
    font-weight: 600;
  }
  
  pre {
    margin: 0;
    background: none;
    padding: 0;
    font-family: inherit;
    font-size: inherit;
    line-height: inherit;
    white-space: pre-wrap;
    word-break: break-all;
    overflow: visible;
    color: #ffffff !important;
  }
`;

const StepButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'success' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${({ $variant }) => {
    if ($variant === 'primary') {
      return `
        background-color: #007bff;
        color: white;
        
        &:hover:not(:disabled) {
          background-color: #0056b3;
        }
        
        &:disabled {
          background-color: #6c757d;
          cursor: not-allowed;
        }
      `;
    } else if ($variant === 'success') {
      return `
        background-color: #28a745;
        color: white;
        
        &:hover:not(:disabled) {
          background-color: #1e7e34;
        }
        
        &:disabled {
          background-color: #6c757d;
          cursor: not-allowed;
        }
      `;
    } else {
      return `
        background-color: #6c757d;
        color: white;
        
        &:hover:not(:disabled) {
          background-color: #545b62;
        }
        
        &:disabled {
          background-color: #adb5bd;
          cursor: not-allowed;
        }
      `;
    }
  }}
`;

const StepProgressIndicator = styled.div`
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 0.5rem;
  border: 1px solid #dee2e6;
`;

const ProgressStepTitle = styled.h4`
  margin: 0 0 0.5rem 0;
  color: #495057;
`;

const ProgressStepDescription = styled.p`
  margin: 0;
  color: #6c757d;
  font-size: 0.9rem;
`;

const StepDots = styled.div`
  margin-top: 0.75rem;
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const StepDot = styled.div<{ $current: boolean; $completed: boolean }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: ${({ $current, $completed }) => 
    $current ? '#007bff' : $completed ? '#28a745' : '#dee2e6'};
  border: ${({ $current }) => $current ? '2px solid #0056b3' : 'none'};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: scale(1.2);
  }
`;

const FlowControls = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
`;

const FlowButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${({ $variant }) => {
    if ($variant === 'primary') {
      return `
        background-color: #007bff;
        color: white;
        
        &:hover:not(:disabled) {
          background-color: #0056b3;
        }
        
        &:disabled {
          background-color: #6c757d;
          cursor: not-allowed;
        }
      `;
    } else {
      return `
        background-color: #6c757d;
        color: white;
        
        &:hover:not(:disabled) {
          background-color: #545b62;
        }
        
        &:disabled {
          background-color: #adb5bd;
          cursor: not-allowed;
        }
      `;
    }
  }}
`;

  border-radius: 0.375rem;
  font-weight: 500;
  font-size: 0.875rem;
  
  ${({ $status }) => {
    switch ($status) {
      case 'idle':
        return 'background-color: #e9ecef; color: #495057;';
      case 'loading':
        return 'background-color: #fff3cd; color: #856404;';
      case 'success':
        return 'background-color: #d4edda; color: #155724;';
      case 'error':
        return 'background-color: #f8d7da; color: #721c24;';
      default:
        return 'background-color: #e9ecef; color: #495057;';
    }
  }}
`;

export interface FlowStep {
  title: string;
  description: string;
  code?: string | React.ReactNode;
  execute?: () => Promise<void> | void;
  result?: unknown; // Store the result of step execution
}

interface StepByStepFlowProps {
  steps: FlowStep[];
  onStart: () => void;
  onReset: () => void;
  status: 'idle' | 'loading' | 'success' | 'error';
  currentStep: number;
  onStepChange: (step: number) => void;
  onStepResult?: (stepIndex: number, result: unknown) => void;
  disabled?: boolean;
  title: string;
  configurationButton?: React.ReactNode;
}

// Memoized Step component to prevent unnecessary re-renders
const MemoizedStep = React.memo<{
  step: FlowStep;
  index: number;
  isActive: boolean;
  isCompleted: boolean;
  onExecute: () => Promise<void>;
  onNext: () => void;
  isLast: boolean;
  disabled: boolean;
}>(({ step, index, isActive, isCompleted, onExecute, onNext, isLast, disabled }) => {
  const handleExecute = useCallback(() => {
    onExecute();
  }, [onExecute]);

  const handleNext = useCallback(() => {
    onNext();
  }, [onNext]);

  return (
    <StepContainer
      id={`step-${index}`}
      $isActive={isActive}
      $isCompleted={isCompleted}
    >
      <StepHeader>
        <StepTitle $isActive={isActive} $isCompleted={isCompleted}>
          {step.title}
        </StepTitle>
        <StepNumber $isActive={isActive} $isCompleted={isCompleted}>
          {index + 1}
        </StepNumber>
      </StepHeader>

      <StepDescription>{step.description}</StepDescription>

      {step.code && (
        <CodeBlock>{step.code}</CodeBlock>
      )}

      {/* Show step result if available */}
      {step.result && (
        <StepResult>
          <h4>Response:</h4>
          {typeof step.result === 'string' ? (
            <pre>{step.result}</pre>
          ) : (
            <pre>{JSON.stringify(step.result, null, 2)}</pre>
          )}
        </StepResult>
      )}

      <StepActions>
        {isActive && step.execute && (
          <StepButton
            $variant="primary"
            onClick={handleExecute}
            disabled={disabled}
          >
            Execute Step {index + 1}
          </StepButton>
        )}

        {!isLast && (
          <StepButton
            $variant="secondary"
            onClick={handleNext}
            disabled={!isCompleted}
          >
            <FiArrowRight />
            Next Step
          </StepButton>
        )}

        {isLast && isCompleted && (
          <StepButton
            $variant="success"
            disabled
          >
            ✓ Complete
          </StepButton>
        )}
      </StepActions>
    </StepContainer>
  );
});

MemoizedStep.displayName = 'MemoizedStep';

const StepByStepFlowComponent: React.FC<StepByStepFlowProps> = ({
  steps,
  onStart,
  onReset,
  status,
  currentStep,
  onStepChange,
  onStepResult,
  disabled = false,
  title,
  configurationButton
}) => {
  const executeCurrentStep = useCallback(async () => {
    if (currentStep < steps.length && steps[currentStep].execute) {
      try {

        // Call the onStepResult callback if provided
        if (onStepResult) {
          onStepResult(currentStep, result);
        }
        
        // Auto-scroll to the executed step after a short delay
        setTimeout(() => {
          const stepElement = document.getElementById(`step-${currentStep}`);
          if (stepElement) {
            stepElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center' 
            });
          }
        }, 100);
        
        // Auto-advance to next step after successful execution
        if (currentStep < steps.length - 1) {
          setTimeout(() => {
            onStepChange(currentStep + 1);
          }, 500); // Small delay to show the result before advancing
        }
      } catch (_error) {
        console.error(`Failed to execute step ${currentStep + 1}:`, _error);
        // Call onStepResult with error if provided
        if (onStepResult) {
          onStepResult(currentStep, { error: error.message || 'Unknown error' });
        }
      }
    }
  }, [currentStep, steps, onStepChange, onStepResult]);

  const goToNextStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      onStepChange(currentStep + 1);
    }
  }, [currentStep, steps.length, onStepChange]);

  const goToPreviousStep = useCallback(() => {
    if (currentStep > 0) {
      onStepChange(currentStep - 1);
    }
  }, [currentStep, onStepChange]);

  const goToStep = useCallback((stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      onStepChange(stepIndex);
    }
  }, [steps.length, onStepChange]);

  return (
    <FlowContainer>
      <FlowControls>
        <StatusIndicator $status={status}>
          {status === 'idle' && 'Ready to start'}
          {status === 'loading' && `Step ${currentStep + 1} of ${steps.length}`}
          {status === 'success' && 'Flow completed successfully'}
          {status === 'error' && 'Flow failed'}
        </StatusIndicator>
        
        {status === 'idle' && (
          <FlowButton
            $variant="primary"
            onClick={onStart}
            disabled={disabled}
          >
            <FiPlay />
            Start {title}
          </FlowButton>
        )}
        
        {status === 'loading' && (
          <>
            <FlowButton
              $variant="primary"
              onClick={executeCurrentStep}
              disabled={disabled}
            >
              Execute Step {currentStep + 1}
            </FlowButton>
            
            <FlowButton
              $variant="secondary"
              onClick={() => {
                console.log('🔄 [StepByStepFlow] Next Step button clicked');
                goToNextStep();
              }}
              disabled={currentStep >= steps.length - 1}
            >
              <FiArrowRight />
              {currentStep >= steps.length - 1 ? 'Done!' : 'Next Step'}
            </FlowButton>
            
            <FlowButton
              $variant="secondary"
              onClick={goToPreviousStep}
              disabled={currentStep === 0}
            >
              <FiArrowLeft />
              Previous Step
            </FlowButton>
          </>
        )}
        
        <FlowButton
          $variant="secondary"
          onClick={onReset}
          disabled={status === 'idle'}
        >
          <FiRotateCcw />
          Reset
        </FlowButton>
        
        {configurationButton}
      </FlowControls>

      {/* Step Progress Indicator */}
      {status === 'loading' && (
        <StepProgressIndicator>
          <ProgressStepTitle>
            Step {currentStep + 1} of {steps.length}: {steps[currentStep]?.title}
          </ProgressStepTitle>
          <ProgressStepDescription>
            {steps[currentStep]?.description}
          </ProgressStepDescription>
          <StepDots>
            {steps.map((_, index) => (
              <StepDot
                key={index}
                $current={index === currentStep}
                $completed={index < currentStep}
                onClick={() => goToStep(index)}
                title={`Step ${index + 1}: ${steps[index]?.title}`}
              />
            ))}
          </StepDots>
        </StepProgressIndicator>
      )}

      {/* Render Individual Steps */}
      {status === 'loading' && (
        <div>
          {steps.map((step, index) => (
            <MemoizedStep
              key={index}
              step={step}
              index={index}
              isActive={index === currentStep}
              isCompleted={index < currentStep}
              onExecute={executeCurrentStep}
              onNext={() => onStepChange(index + 1)}
              isLast={index === steps.length - 1}
              disabled={disabled}
            />
          ))}
        </div>
      )}
    </FlowContainer>
  );
};

StepByStepFlowComponent.displayName = 'StepByStepFlowComponent';

export const StepByStepFlow = React.memo(StepByStepFlowComponent);
