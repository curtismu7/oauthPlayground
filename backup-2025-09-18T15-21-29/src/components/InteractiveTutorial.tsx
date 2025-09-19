/* eslint-disable */
import React, { useState} from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/NewAuthContext';
import TutorialStep from './TutorialStep';
import { Card, CardHeader, CardBody } from './Card';

interface TutorialData {
  id: string;
  title: string;
  description: string;
  estimatedTime: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  steps: Array<{
    id: string;
    title: string;
    description: string;
    codeExample?: string;
    action?: {
      type: 'navigate' | 'configure' | 'execute' | 'observe';
      label: string;
      path?: string;
      onClick?: () => void;
    };
    content?: React.ReactNode;
  }>;
}

interface InteractiveTutorialProps {
  tutorial: TutorialData;
  onStepComplete?: (stepId: string) => void;
  onTutorialComplete?: () => void;
}

const TutorialContainer = styled.div`
  max-width: 900px;
  margin: 0 auto;
`;

const TutorialHeader = styled(Card)`
  margin-bottom: 2rem;
`;

const TutorialMeta = styled.div`
  display: flex;
  gap: 2rem;
  margin-top: 1rem;
  flex-wrap: wrap;
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.gray600};
`;

const DifficultyBadge = styled.span<{ $difficulty: string }>`
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  background-color: ${({ $difficulty, theme }) => {
    switch ($difficulty) {
      case 'Beginner': return theme.colors.success + '20';
      case 'Intermediate': return theme.colors.warning + '20';
      case 'Advanced': return theme.colors.danger + '20';
      default: return theme.colors.gray200;
    }
  }};
  color: ${({ $difficulty, theme }) => {
    switch ($difficulty) {
      case 'Beginner': return theme.colors.success;
      case 'Intermediate': return theme.colors.warning;
      case 'Advanced': return theme.colors.danger;
      default: return theme.colors.gray600;
    }
  }};
`;

const ProgressBar = styled.div`
  margin: 1.5rem 0;
`;

const ProgressTrack = styled.div`
  width: 100%;
  height: 8px;
  background-color: ${({ theme }) => theme.colors.gray200};
  border-radius: 4px;
  overflow: hidden;
`;

const ProgressFill = styled.div<{ $progress: number }>`
  height: 100%;
  background-color: ${({ theme }) => theme.colors.success};
  width: ${({ $progress }) => $progress}%;
  transition: width 0.3s ease;
`;

const ProgressText = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.gray600};
`;

const TutorialActions = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: 2px solid ${({ $variant, theme }) => 
    $variant === 'secondary' ? theme.colors.gray300 : theme.colors.primary};
  background-color: ${({ $variant, theme }) => 
    $variant === 'secondary' ? 'white' : theme.colors.primary};
  color: ${({ $variant, theme }) => 
    $variant === 'secondary' ? theme.colors.gray700 : 'white'};
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${({ $variant, theme }) => 
      $variant === 'secondary' ? theme.colors.gray50 : theme.colors.primaryDark};
    border-color: ${({ $variant, theme }) => 
      $variant === 'secondary' ? theme.colors.gray400 : theme.colors.primaryDark};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const InteractiveTutorial: React.FC<InteractiveTutorialProps> = ({
  tutorial,
  onStepComplete,
  onTutorialComplete
}) => {
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [isStarted, setIsStarted] = useState(false);

  const progress = (completedSteps.size / tutorial.steps.length) * 100;
  const isCompleted = completedSteps.size === tutorial.steps.length;

  useEffect(() => {
    if (isCompleted && onTutorialComplete) {
      onTutorialComplete();
    }
  }, [isCompleted, onTutorialComplete]);

  const handleStepComplete = (stepId: string) => {
    const newCompletedSteps = new Set(completedSteps);
    newCompletedSteps.add(stepId);
    setCompletedSteps(newCompletedSteps);
    
    if (onStepComplete) {
      onStepComplete(stepId);
    }
  };

  const handleStartTutorial = () => {
    setIsStarted(true);
    setCompletedSteps(new Set());
  };

  const handleResetTutorial = () => {
    setIsStarted(false);
    setCompletedSteps(new Set());
  };

  const getStepActionButton = (step: unknown) => {
    if (!step.action) return undefined;

    const icons = {
      navigate: <FiEye size={16} />,
      configure: <FiSettings size={16} />,
      execute: <FiPlay size={16} />,
      observe: <FiEye size={16} />
    };

    return {
      label: step.action.label,
      icon: icons[step.action.type],
      onClick: () => {
        if (step.action.onClick) {
          step.action.onClick();
        }
        // Auto-complete step after action
        setTimeout(() => handleStepComplete(step.id), 500);
      }
    };
  };

  return (
    <TutorialContainer>
      <TutorialHeader>
        <CardHeader>
          <h1>{tutorial.title}</h1>
        </CardHeader>
        <CardBody>
          <p>{tutorial.description}</p>
          
          <TutorialMeta>
            <MetaItem>
              <FiPlay size={16} />
              {tutorial.estimatedTime}
            </MetaItem>
            <MetaItem>
              <DifficultyBadge $difficulty={tutorial.difficulty}>
                {tutorial.difficulty}
              </DifficultyBadge>
            </MetaItem>
            <MetaItem>
              <FiCheckCircle size={16} />
              {tutorial.steps.length} steps
            </MetaItem>
          </TutorialMeta>

          {isStarted && (
            <ProgressBar>
              <ProgressTrack>
                <ProgressFill $progress={progress} />
              </ProgressTrack>
              <ProgressText>
                <span>{completedSteps.size} of {tutorial.steps.length} steps completed</span>
                <span>{Math.round(progress)}%</span>
              </ProgressText>
            </ProgressBar>
          )}

          <TutorialActions>
            {!isStarted || isCompleted ? (
              <ActionButton onClick={handleStartTutorial}>
                <FiPlay size={16} />
                {isCompleted ? 'Start Again' : 'Start Tutorial'}
              </ActionButton>
            ) : (
              <ActionButton $variant="secondary" onClick={handleResetTutorial}>
                <FiRefreshCw size={16} />
                Reset Tutorial
              </ActionButton>
            )}
          </TutorialActions>
        </CardBody>
      </TutorialHeader>

      {isStarted && (
        <div>
          {tutorial.steps.map((step, index) => (
            <TutorialStep
              key={step.id}
              stepNumber={index + 1}
              title={step.title}
              description={step.description}
              codeExample={step.codeExample}
              completed={completedSteps.has(step.id)}
              actionButton={getStepActionButton(step)}
              onToggle={() => {
                // Auto-expand next step
                if (!completedSteps.has(step.id) && index === completedSteps.size) {
                  // This is the current step
                }
              }}
            >
              {step.content}
            </TutorialStep>
          ))}
        </div>
      )}

      {isCompleted && (
        <Card>
          <CardBody style={{ textAlign: 'center', padding: '2rem' }}>
            <FiCheckCircle size={48} style={{ color: '#28a745', marginBottom: '1rem' }} />
            <h2>Tutorial Completed! 🎉</h2>
            <p style={{ color: '#6c757d', marginBottom: '1.5rem' }}>
              Great job! You've successfully completed the {tutorial.title} tutorial.
              You now have hands-on experience with this OAuth flow.
            </p>
            <ActionButton onClick={handleStartTutorial}>
              <FiRefreshCw size={16} />
              Try Again
            </ActionButton>
          </CardBody>
        </Card>
      )}
    </TutorialContainer>
  );
};

export default InteractiveTutorial;

