import React, { useEffect, useState } from 'react';
import { FiAlertCircle, FiCheckCircle, FiLoader } from '@icons';
import styled, { css, keyframes } from 'styled-components';
import { useAccessibility } from '../hooks/useAccessibility';

// Animations
const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const slideIn = keyframes`
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

const progressFill = keyframes`
  from { width: 0%; }
  to { width: 100%; }
`;

// Styled components
const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  min-height: 200px;
`;

const LoadingSpinner = styled.div<{ $size?: 'small' | 'medium' | 'large' }>`
  width: ${({ $size }) => {
		switch ($size) {
			case 'small':
				return '24px';
			case 'large':
				return '64px';
			default:
				return '40px';
		}
	}};
  height: ${({ $size }) => {
		switch ($size) {
			case 'small':
				return '24px';
			case 'large':
				return '64px';
			default:
				return '40px';
		}
	}};
  border: 3px solid ${({ theme }) => theme.colors.gray200};
  border-top: 3px solid ${({ theme }) => theme.colors.primary};
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

const LoadingText = styled.p`
  margin-top: 1rem;
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.gray600};
  text-align: center;
`;

const ProgressContainer = styled.div`
  width: 100%;
  max-width: 400px;
  margin: 1rem 0;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background-color: ${({ theme }) => theme.colors.gray200};
  border-radius: 4px;
  overflow: hidden;
  position: relative;
`;

const ProgressFill = styled.div<{ $progress: number; $animated?: boolean }>`
  height: 100%;
  width: ${({ $progress }) => $progress}%;
  background: linear-gradient(90deg, ${({ theme }) => theme.colors.primary} 0%, ${({ theme }) => theme.colors.primaryDark} 100%);
  border-radius: 4px;
  transition: width 0.3s ease;
  ${({ $animated }) => $animated && css`animation: ${progressFill} 2s ease-in-out;`}
`;

const ProgressText = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.gray600};
`;

const StatusContainer = styled.div<{ $status: 'loading' | 'success' | 'error' | 'warning' }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 8px;
  background: ${({ $status, theme }) => {
		switch ($status) {
			case 'success':
				return theme.colors.successLight;
			case 'error':
				return theme.colors.dangerLight;
			case 'warning':
				return theme.colors.warningLight;
			default:
				return theme.colors.gray50;
		}
	}};
  border: 1px solid ${({ $status, theme }) => {
		switch ($status) {
			case 'success':
				return theme.colors.success;
			case 'error':
				return theme.colors.danger;
			case 'warning':
				return theme.colors.warning;
			default:
				return theme.colors.gray200;
		}
	}};
  animation: ${slideIn} 0.3s ease-out;
`;

const StatusIcon = styled.div<{ $status: 'loading' | 'success' | 'error' | 'warning' }>`
  color: ${({ $status, theme }) => {
		switch ($status) {
			case 'success':
				return theme.colors.success;
			case 'error':
				return theme.colors.danger;
			case 'warning':
				return theme.colors.warning;
			default:
				return theme.colors.primary;
		}
	}};
  font-size: 1.25rem;
  
  ${({ $status }) =>
		$status === 'loading' &&
		css`
    animation: ${spin} 1s linear infinite;
  `}
`;

const StatusText = styled.div`
  flex: 1;
  
  h4 {
    margin: 0 0 0.25rem 0;
    font-size: 1rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.gray900};
  }
  
  p {
    margin: 0;
    font-size: 0.875rem;
    color: ${({ theme }) => theme.colors.gray600};
  }
`;

const StepContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin: 1rem 0;
`;

const Step = styled.div<{ $status: 'pending' | 'active' | 'completed' | 'error' }>`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 8px;
  background: ${({ $status, theme }) => {
		switch ($status) {
			case 'completed':
				return theme.colors.successLight;
			case 'active':
				return theme.colors.primaryLight;
			case 'error':
				return theme.colors.dangerLight;
			default:
				return theme.colors.gray50;
		}
	}};
  border: 1px solid ${({ $status, theme }) => {
		switch ($status) {
			case 'completed':
				return theme.colors.success;
			case 'active':
				return theme.colors.primary;
			case 'error':
				return theme.colors.danger;
			default:
				return theme.colors.gray200;
		}
	}};
  transition: all 0.3s ease;
  
  ${({ $status }) =>
		$status === 'active' &&
		css`
    animation: ${pulse} 2s infinite;
  `}
`;

const StepNumber = styled.div<{ $status: 'pending' | 'active' | 'completed' | 'error' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${({ $status, theme }) => {
		switch ($status) {
			case 'completed':
				return theme.colors.success;
			case 'active':
				return theme.colors.primary;
			case 'error':
				return theme.colors.danger;
			default:
				return theme.colors.gray300;
		}
	}};
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
`;

const StepContent = styled.div`
  flex: 1;
  
  h4 {
    margin: 0 0 0.25rem 0;
    font-size: 1rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.gray900};
  }
  
  p {
    margin: 0;
    font-size: 0.875rem;
    color: ${({ theme }) => theme.colors.gray600};
  }
`;

// Interfaces
export interface LoadingState {
	isLoading: boolean;
	message?: string;
	progress?: number;
	status?: 'loading' | 'success' | 'error' | 'warning';
}

export interface Step {
	id: string;
	title: string;
	description: string;
	status: 'pending' | 'active' | 'completed' | 'error';
}

export interface ProgressIndicatorProps {
	steps: Step[];
	currentStep?: string;
	onStepClick?: (stepId: string) => void;
}

export interface LoadingSpinnerProps {
	size?: 'small' | 'medium' | 'large';
	message?: string;
	progress?: number;
	showProgress?: boolean;
}

export interface StatusMessageProps {
	status: 'loading' | 'success' | 'error' | 'warning';
	title: string;
	message?: string;
	onDismiss?: () => void;
}

// Components
export const LoadingSpinnerComponent: React.FC<LoadingSpinnerProps> = ({
	size = 'medium',
	message = 'Loading...',
	progress,
	showProgress = false,
}) => {
	const { announceToScreenReader } = useAccessibility();

	useEffect(() => {
		announceToScreenReader(message);
	}, [message, announceToScreenReader]);

	return (
		<LoadingContainer role="status" aria-live="polite">
			<LoadingSpinner $size={size} aria-hidden="true" />
			<LoadingText>{message}</LoadingText>
			{showProgress && progress !== undefined && (
				<ProgressContainer>
					<ProgressBar
						role="progressbar"
						aria-valuenow={progress}
						aria-valuemin={0}
						aria-valuemax={100}
					>
						<ProgressFill $progress={progress} />
					</ProgressBar>
					<ProgressText>
						<span>{progress}% complete</span>
					</ProgressText>
				</ProgressContainer>
			)}
		</LoadingContainer>
	);
};

export const StatusMessage: React.FC<StatusMessageProps> = ({
	status,
	title,
	message,
	onDismiss,
}) => {
	const { announceToScreenReader } = useAccessibility();

	useEffect(() => {
		announceToScreenReader(`${title}${message ? `: ${message}` : ''}`);
	}, [title, message, announceToScreenReader]);

	const getIcon = () => {
		switch (status) {
			case 'success':
				return <FiCheckCircle />;
			case 'error':
				return <FiAlertCircle />;
			case 'warning':
				return <FiAlertCircle />;
			default:
				return <FiLoader />;
		}
	};

	return (
		<StatusContainer $status={status} role="alert" aria-live="assertive">
			<StatusIcon $status={status}>{getIcon()}</StatusIcon>
			<StatusText>
				<h4>{title}</h4>
				{message && <p>{message}</p>}
			</StatusText>
			{onDismiss && (
				<button
					onClick={onDismiss}
					aria-label="Dismiss message"
					style={{
						background: 'none',
						border: 'none',
						cursor: 'pointer',
						padding: '0.25rem',
						borderRadius: '4px',
					}}
				></button>
			)}
		</StatusContainer>
	);
};

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
	steps,
	currentStep,
	onStepClick,
}) => {
	const { announceToScreenReader } = useAccessibility();

	const handleStepClick = (step: Step) => {
		if (onStepClick && step.status !== 'pending') {
			onStepClick(step.id);
			announceToScreenReader(`Navigated to step: ${step.title}`);
		}
	};

	return (
		<StepContainer role="list" aria-label="Progress steps">
			{steps.map((step, index) => (
				<Step
					key={step.id}
					$status={step.status}
					role="listitem"
					tabIndex={step.status !== 'pending' ? 0 : -1}
					onClick={() => handleStepClick(step)}
					onKeyDown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							handleStepClick(step);
						}
					}}
					style={{
						cursor: step.status !== 'pending' ? 'pointer' : 'default',
					}}
				>
					<StepNumber $status={step.status}>
						{step.status === 'completed' ? <FiCheckCircle size={16} /> : index + 1}
					</StepNumber>
					<StepContent>
						<h4>{step.title}</h4>
						<p>{step.description}</p>
					</StepContent>
				</Step>
			))}
		</StepContainer>
	);
};

// Hook for managing loading states
export const useLoadingState = (initialState: LoadingState = { isLoading: false }) => {
	const [loadingState, setLoadingState] = useState<LoadingState>(initialState);
	const { announceToScreenReader } = useAccessibility();

	const setLoading = (isLoading: boolean, message?: string, progress?: number) => {
		setLoadingState({ isLoading, message, progress });
		if (message) {
			announceToScreenReader(message);
		}
	};

	const setSuccess = (message: string) => {
		setLoadingState({ isLoading: false, message, status: 'success' });
		announceToScreenReader(`Success: ${message}`);
	};

	const setError = (message: string) => {
		setLoadingState({ isLoading: false, message, status: 'error' });
		announceToScreenReader(`Error: ${message}`);
	};

	const setWarning = (message: string) => {
		setLoadingState({ isLoading: false, message, status: 'warning' });
		announceToScreenReader(`Warning: ${message}`);
	};

	const clearStatus = () => {
		setLoadingState({ isLoading: false });
	};

	return {
		loadingState,
		setLoading,
		setSuccess,
		setError,
		setWarning,
		clearStatus,
	};
};

// Hook for managing step progress
export const useStepProgress = (steps: Step[]) => {
	const [currentStepId, setCurrentStepId] = useState<string | null>(null);
	const [stepStates, setStepStates] = useState<Record<string, Step['status']>>(
		steps.reduce((acc, step) => ({ ...acc, [step.id]: step.status }), {})
	);
	const { announceToScreenReader } = useAccessibility();

	const updateStepStatus = (stepId: string, status: Step['status']) => {
		setStepStates((prev) => ({ ...prev, [stepId]: status }));

		const step = steps.find((s) => s.id === stepId);
		if (step) {
			announceToScreenReader(`Step ${step.title} ${status}`);
		}
	};

	const setCurrentStep = (stepId: string) => {
		setCurrentStepId(stepId);
		updateStepStatus(stepId, 'active');
	};

	const completeStep = (stepId: string) => {
		updateStepStatus(stepId, 'completed');
	};

	const errorStep = (stepId: string) => {
		updateStepStatus(stepId, 'error');
	};

	const resetSteps = () => {
		setCurrentStepId(null);
		setStepStates(steps.reduce((acc, step) => ({ ...acc, [step.id]: 'pending' }), {}));
	};

	const getUpdatedSteps = (): Step[] => {
		return steps.map((step) => ({
			...step,
			status: stepStates[step.id] || step.status,
		}));
	};

	return {
		currentStepId,
		stepStates,
		updateStepStatus,
		setCurrentStep,
		completeStep,
		errorStep,
		resetSteps,
		getUpdatedSteps,
	};
};

export default {
	LoadingSpinnerComponent,
	StatusMessage,
	ProgressIndicator,
	useLoadingState,
	useStepProgress,
};
