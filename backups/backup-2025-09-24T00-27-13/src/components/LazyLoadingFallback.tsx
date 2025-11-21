import React from 'react';
import { FiLoader, FiShield, FiUsers, FiZap } from 'react-icons/fi';
import styled, { keyframes } from 'styled-components';

// Loading animation
const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const slideIn = keyframes`
  0% { transform: translateY(20px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
`;

// Styled components
const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 2rem;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  animation: ${slideIn} 0.3s ease-out;
`;

const LoadingSpinner = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  margin-bottom: 1.5rem;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  animation: ${spin} 1s linear infinite;
`;

const SpinnerIcon = styled(FiLoader)`
  color: white;
  font-size: 24px;
  animation: ${pulse} 2s ease-in-out infinite;
`;

const LoadingTitle = styled.h3`
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  text-align: center;
`;

const LoadingSubtitle = styled.p`
  margin: 0 0 1.5rem 0;
  font-size: 0.875rem;
  color: #64748b;
  text-align: center;
  max-width: 300px;
  line-height: 1.5;
`;

const LoadingSteps = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
  max-width: 300px;
`;

const LoadingStep = styled.div<{ completed?: boolean; active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: ${(props) => (props.active ? '#dbeafe' : props.completed ? '#dcfce7' : '#f8fafc')};
  border: 1px solid ${(props) => (props.active ? '#93c5fd' : props.completed ? '#86efac' : '#e2e8f0')};
  border-radius: 8px;
  transition: all 0.3s ease;
  animation: ${(props) => (props.active ? pulse : 'none')} 1.5s ease-in-out infinite;
`;

const StepIcon = styled.div<{ completed?: boolean; active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: ${(props) => (props.completed ? '#10b981' : props.active ? '#3b82f6' : '#e2e8f0')};
  color: ${(props) => (props.completed || props.active ? 'white' : '#94a3b8')};
  font-size: 12px;
  font-weight: 600;
  transition: all 0.3s ease;
`;

const StepText = styled.span<{ completed?: boolean; active?: boolean }>`
  font-size: 0.875rem;
  font-weight: ${(props) => (props.active ? '600' : '500')};
  color: ${(props) => (props.completed ? '#059669' : props.active ? '#1d4ed8' : '#64748b')};
  transition: all 0.3s ease;
`;

const LoadingProgress = styled.div`
  width: 100%;
  height: 4px;
  background: #e2e8f0;
  border-radius: 2px;
  overflow: hidden;
  margin-top: 1rem;
`;

const ProgressBar = styled.div<{ progress: number }>`
  height: 100%;
  background: linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%);
  border-radius: 2px;
  width: ${(props) => props.progress}%;
  transition: width 0.3s ease;
  animation: ${pulse} 2s ease-in-out infinite;
`;

// Loading step interface
interface LoadingStep {
	id: string;
	text: string;
	icon: React.ReactNode;
	completed: boolean;
	active: boolean;
}

// LazyLoadingFallback component props
interface LazyLoadingFallbackProps {
	flowType?: string;
	message?: string;
	showSteps?: boolean;
	progress?: number;
}

// LazyLoadingFallback component
export const LazyLoadingFallback: React.FC<LazyLoadingFallbackProps> = ({
	flowType = 'OAuth Flow',
	message = 'Loading OAuth flow components...',
	showSteps = true,
	progress = 0,
}) => {
	// Define loading steps based on flow type
	const getLoadingSteps = (): LoadingStep[] => {
		const baseSteps: LoadingStep[] = [
			{
				id: 'init',
				text: 'Initializing OAuth flow',
				icon: <FiZap />,
				completed: progress > 20,
				active: progress <= 20 && progress > 0,
			},
			{
				id: 'load',
				text: 'Loading flow components',
				icon: <FiShield />,
				completed: progress > 60,
				active: progress > 20 && progress <= 60,
			},
			{
				id: 'ready',
				text: 'Preparing user interface',
				icon: <FiUsers />,
				completed: progress > 90,
				active: progress > 60 && progress <= 90,
			},
		];

		return baseSteps;
	};

	const steps = getLoadingSteps();
	const completedSteps = steps.filter((step) => step.completed).length;
	const totalSteps = steps.length;

	return (
		<LoadingContainer>
			<LoadingSpinner>
				<SpinnerIcon />
			</LoadingSpinner>

			<LoadingTitle>Loading {flowType}</LoadingTitle>

			<LoadingSubtitle>{message}</LoadingSubtitle>

			{showSteps && (
				<LoadingSteps>
					{steps.map((step) => (
						<LoadingStep key={step.id} completed={step.completed} active={step.active}>
							<StepIcon completed={step.completed} active={step.active}>
								{step.completed ? '✓' : step.icon}
							</StepIcon>
							<StepText completed={step.completed} active={step.active}>
								{step.text}
							</StepText>
						</LoadingStep>
					))}
				</LoadingSteps>
			)}

			<LoadingProgress>
				<ProgressBar progress={progress} />
			</LoadingProgress>
		</LoadingContainer>
	);
};

// Compact loading fallback for smaller spaces
export const CompactLoadingFallback: React.FC<{ message?: string }> = ({
	message = 'Loading...',
}) => {
	return (
		<div
			style={{
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				padding: '2rem',
				minHeight: '200px',
			}}
		>
			<div
				style={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					gap: '1rem',
				}}
			>
				<LoadingSpinner>
					<SpinnerIcon />
				</LoadingSpinner>
				<p
					style={{
						margin: 0,
						fontSize: '0.875rem',
						color: '#64748b',
						textAlign: 'center',
					}}
				>
					{message}
				</p>
			</div>
		</div>
	);
};

// Error fallback for failed lazy loading
export const LazyLoadingErrorFallback: React.FC<{
	error: Error;
	onRetry: () => void;
	flowType?: string;
}> = ({ error, onRetry, flowType = 'OAuth Flow' }) => {
	return (
		<LoadingContainer>
			<div
				style={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					gap: '1rem',
					textAlign: 'center',
				}}
			>
				<div
					style={{
						width: '60px',
						height: '60px',
						borderRadius: '50%',
						background: '#fee2e2',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						color: '#dc2626',
						fontSize: '24px',
					}}
				>
					⚠️
				</div>

				<LoadingTitle style={{ color: '#dc2626' }}>Failed to Load {flowType}</LoadingTitle>

				<LoadingSubtitle>
					{error.message || 'An error occurred while loading the OAuth flow component.'}
				</LoadingSubtitle>

				<button
					onClick={onRetry}
					style={{
						padding: '0.75rem 1.5rem',
						background: '#3b82f6',
						color: 'white',
						border: 'none',
						borderRadius: '8px',
						fontSize: '0.875rem',
						fontWeight: '600',
						cursor: 'pointer',
						transition: 'background 0.2s ease',
					}}
					onMouseOver={(e) => (e.currentTarget.style.background = '#1d4ed8')}
					onMouseOut={(e) => (e.currentTarget.style.background = '#3b82f6')}
				>
					Try Again
				</button>
			</div>
		</LoadingContainer>
	);
};

export default LazyLoadingFallback;
