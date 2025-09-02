import React, { useState, useCallback, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { FiPlay, FiArrowRight, FiArrowLeft, FiRotateCcw } from 'react-icons/fi';

const FlowContainer = styled.div`
  margin-bottom: 1.5rem;
`;

const StepProgressIndicator = styled.div`
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 0.5rem;
  border: 1px solid #dee2e6;
`;

const StepTitle = styled.h4`
  margin: 0 0 0.5rem 0;
  color: #495057;
`;

const StepDescription = styled.p`
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

const StatusIndicator = styled.div<{ $status: 'idle' | 'loading' | 'success' | 'error' }>`
  padding: 0.5rem 1rem;
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
  code?: string;
  execute?: () => Promise<void> | void;
}

interface StepByStepFlowProps {
  steps: FlowStep[];
  onStart: () => void;
  onReset: () => void;
  status: 'idle' | 'loading' | 'success' | 'error';
  currentStep: number;
  onStepChange: (step: number) => void;
  disabled?: boolean;
  title: string;
}

export const StepByStepFlow: React.FC<StepByStepFlowProps> = ({
  steps,
  onStart,
  onReset,
  status,
  currentStep,
  onStepChange,
  disabled = false,
  title
}) => {
  const executeCurrentStep = useCallback(async () => {
    console.log('🔄 [StepByStepFlow] executeCurrentStep called', { currentStep, stepsLength: steps.length });
    if (currentStep < steps.length && steps[currentStep].execute) {
      try {
        console.log('🔄 [StepByStepFlow] Executing step:', steps[currentStep].title);
        await steps[currentStep].execute!();
        console.log('✅ [StepByStepFlow] Step executed successfully');
        
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
      } catch (error) {
        console.error(`Failed to execute step ${currentStep + 1}:`, error);
      }
    }
  }, [currentStep, steps, onStepChange]);

  const goToNextStep = useCallback(() => {
    console.log('🔄 [StepByStepFlow] goToNextStep called', { currentStep, stepsLength: steps.length });
    if (currentStep < steps.length - 1) {
      console.log('🔄 [StepByStepFlow] Moving to next step:', currentStep + 1);
      onStepChange(currentStep + 1);
    } else {
      console.log('🔄 [StepByStepFlow] Already at last step, cannot go next');
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
      </FlowControls>

      {/* Step Progress Indicator */}
      {status === 'loading' && (
        <StepProgressIndicator>
          <StepTitle>
            Step {currentStep + 1} of {steps.length}: {steps[currentStep]?.title}
          </StepTitle>
          <StepDescription>
            {steps[currentStep]?.description}
          </StepDescription>
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
    </FlowContainer>
  );
};
