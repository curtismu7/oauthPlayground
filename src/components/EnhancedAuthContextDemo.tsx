// src/components/EnhancedAuthContextDemo.tsx
// Demo showing how flows can use the enhanced NewAuthContext

import React, { useEffect, useState } from 'react';
import {
	FiAlertCircle,
	FiArrowRight,
	FiCheckCircle,
	FiRefreshCw,
	FiSettings,
} from '@icons';
import styled from 'styled-components';
import { useAuth } from '../contexts/NewAuthContext';

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  background: #f9fafb;
  min-height: 100vh;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
`;

const Subtitle = styled.p`
  font-size: 1.125rem;
  color: #6b7280;
  margin: 0;
`;

const Section = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'success' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;

  ${(props) => {
		switch (props.variant) {
			case 'primary':
				return `
          background: #3b82f6;
          color: white;
          &:hover { background: #2563eb; }
        `;
			case 'success':
				return `
          background: #10b981;
          color: white;
          &:hover { background: #059669; }
        `;
			default:
				return `
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
          &:hover { background: #e5e7eb; }
        `;
		}
	}}
`;

const StatusDisplay = styled.div<{ status: 'success' | 'error' | 'info' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border-radius: 6px;
  font-size: 0.875rem;
  margin-bottom: 1rem;

  ${(props) => {
		switch (props.status) {
			case 'success':
				return `
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #166534;
        `;
			case 'error':
				return `
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #991b1b;
        `;
			default:
				return `
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          color: #1e40af;
        `;
		}
	}}
`;

const CodeBlock = styled.pre`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  padding: 1rem;
  font-size: 0.75rem;
  line-height: 1.4;
  overflow-x: auto;
  margin: 1rem 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
`;

const FlowStep = styled.div<{ active: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border: 1px solid ${(props) => (props.active ? '#3b82f6' : '#e5e7eb')};
  border-radius: 6px;
  margin-bottom: 0.5rem;
  background: ${(props) => (props.active ? '#eff6ff' : 'white')};
`;

const StepNumber = styled.div<{ active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${(props) => (props.active ? '#3b82f6' : '#e5e7eb')};
  color: ${(props) => (props.active ? 'white' : '#6b7280')};
  font-weight: 600;
  font-size: 0.875rem;
`;

const StepContent = styled.div`
  flex: 1;
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

export const EnhancedAuthContextDemo: React.FC = () => {
	const auth = useAuth();
	const [currentStep, setCurrentStep] = useState(0);
	const [flowId, setFlowId] = useState<string | null>(null);
	const [status, setStatus] = useState<{
		type: 'success' | 'error' | 'info';
		message: string;
	} | null>(null);

	interface CurrentFlow {
		flowType: string;
		currentStep: number;
		returnPath?: string;
		age?: number;
		[key: string]: unknown;
	}

	const [currentFlow, setCurrentFlow] = useState<CurrentFlow | null>(null);

	// Check current flow status
	useEffect(() => {
		const flow = auth.getCurrentFlow();
		setCurrentFlow(flow as CurrentFlow | null);
	}, [auth]);

	const steps = [
		{
			title: 'Initialize Flow Context',
			description: 'Set up flow context for OAuth redirect handling',
		},
		{
			title: 'Simulate OAuth Redirect',
			description: 'Demonstrate how flow context preserves state during redirects',
		},
		{
			title: 'Update Flow Step',
			description: 'Show how to update flow progress and state',
		},
		{
			title: 'Complete Flow',
			description: 'Clean up flow context and complete the process',
		},
	];

	const handleInitializeFlow = () => {
		try {
			const flowState = {
				currentStep: 1,
				credentials: {
					environmentId: 'demo-env',
					clientId: 'demo-client',
					clientSecret: 'demo-secret',
				},
				formData: {
					selectedScopes: ['openid', 'profile', 'email'],
					customParam: 'demo-value',
				},
			};

			const newFlowId = auth.initializeFlowContext('demo-flow', 1, flowState);
			setFlowId(newFlowId);
			setCurrentStep(1);
			setStatus({
				type: 'success',
				message: `Flow initialized successfully! Flow ID: ${newFlowId}`,
			});
		} catch (error) {
			setStatus({
				type: 'error',
				message: `Failed to initialize flow: ${error instanceof Error ? error.message : 'Unknown error'}`,
			});
		}
	};

	const handleSimulateRedirect = () => {
		if (!flowId) {
			setStatus({ type: 'error', message: 'No active flow to simulate redirect' });
			return;
		}

		try {
			// Simulate what happens during OAuth redirect
			setStatus({
				type: 'info',
				message: 'Simulating OAuth redirect... Flow context is preserved in session storage',
			});

			setTimeout(() => {
				setCurrentStep(2);
				setStatus({
					type: 'success',
					message: 'OAuth redirect simulated! Flow context would be restored on callback',
				});
			}, 1000);
		} catch (error) {
			setStatus({
				type: 'error',
				message: `Redirect simulation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
			});
		}
	};

	const handleUpdateStep = () => {
		if (!flowId) {
			setStatus({ type: 'error', message: 'No active flow to update' });
			return;
		}

		try {
			const newStepData = {
				tokens: {
					access_token: 'demo-access-token',
					id_token: 'demo-id-token',
					refresh_token: 'demo-refresh-token',
				},
				completedAt: new Date().toISOString(),
			};

			const success = auth.updateFlowStep(flowId, 3, newStepData);

			if (success) {
				setCurrentStep(3);
				setStatus({
					type: 'success',
					message: 'Flow step updated successfully with token data!',
				});
			} else {
				setStatus({ type: 'error', message: 'Failed to update flow step' });
			}
		} catch (error) {
			setStatus({
				type: 'error',
				message: `Failed to update step: ${error instanceof Error ? error.message : 'Unknown error'}`,
			});
		}
	};

	const handleCompleteFlow = () => {
		if (!flowId) {
			setStatus({ type: 'error', message: 'No active flow to complete' });
			return;
		}

		try {
			auth.completeFlow(flowId);
			setFlowId(null);
			setCurrentStep(0);
			setCurrentFlow(null);
			setStatus({
				type: 'success',
				message: 'Flow completed and cleaned up successfully!',
			});
		} catch (error) {
			setStatus({
				type: 'error',
				message: `Failed to complete flow: ${error instanceof Error ? error.message : 'Unknown error'}`,
			});
		}
	};

	const handleReset = () => {
		if (flowId) {
			auth.completeFlow(flowId);
		}
		setFlowId(null);
		setCurrentStep(0);
		setCurrentFlow(null);
		setStatus(null);
	};

	return (
		<Container>
			<Header>
				<Title>Enhanced Auth Context Demo</Title>
				<Subtitle>
					Demonstration of enhanced NewAuthContext with FlowContextService integration
				</Subtitle>
			</Header>

			{status && (
				<StatusDisplay status={status.type}>
					{status.type === 'success' && <FiCheckCircle size={16} />}
					{status.type === 'error' && <FiAlertCircle size={16} />}
					{status.type === 'info' && <FiSettings size={16} />}
					{status.message}
				</StatusDisplay>
			)}

			<Section>
				<SectionTitle>
					<FiSettings size={20} />
					Flow Simulation Steps
				</SectionTitle>

				{steps.map((step, index) => (
					<FlowStep key={index} active={currentStep === index + 1}>
						<StepNumber active={currentStep >= index + 1}>
							{currentStep > index + 1 ? <FiCheckCircle size={16} /> : index + 1}
						</StepNumber>
						<StepContent>
							<StepTitle>{step.title}</StepTitle>
							<StepDescription>{step.description}</StepDescription>
						</StepContent>
					</FlowStep>
				))}

				<div style={{ marginTop: '1.5rem' }}>
					<Button variant="primary" onClick={handleInitializeFlow} disabled={currentStep > 0}>
						<FiSettings size={14} />
						Initialize Flow
					</Button>

					<Button onClick={handleSimulateRedirect} disabled={currentStep !== 1}>
						<FiArrowRight size={14} />
						Simulate Redirect
					</Button>

					<Button onClick={handleUpdateStep} disabled={currentStep !== 2}>
						<FiRefreshCw size={14} />
						Update Step
					</Button>

					<Button variant="success" onClick={handleCompleteFlow} disabled={currentStep !== 3}>
						<FiCheckCircle size={14} />
						Complete Flow
					</Button>

					<Button onClick={handleReset}>Reset Demo</Button>
				</div>
			</Section>

			<Section>
				<SectionTitle>Current Flow Status</SectionTitle>
				{currentFlow ? (
					<div>
						<p>
							<strong>Flow Type:</strong> {currentFlow.flowType}
						</p>
						<p>
							<strong>Current Step:</strong> {currentFlow.currentStep}
						</p>
						<p>
							<strong>Return Path:</strong> {currentFlow.returnPath}
						</p>
						<p>
							<strong>Age:</strong> {Math.round((currentFlow.age || 0) / 1000)}s
						</p>
					</div>
				) : (
					<p style={{ color: '#6b7280', fontStyle: 'italic' }}>No active flow</p>
				)}
			</Section>

			<Section>
				<SectionTitle>Integration Example</SectionTitle>
				<p style={{ marginBottom: '1rem', color: '#6b7280' }}>
					Here's how flows can use the enhanced AuthContext:
				</p>
				<CodeBlock>{`// In your OAuth flow component
import { useAuth } from '../contexts/NewAuthContext';

const MyOAuthFlow = () => {
  const auth = useAuth();
  
  const handleStartOAuth = async () => {
    // Initialize flow context before redirect
    const flowId = auth.initializeFlowContext(
      'my-oauth-flow',
      currentStep,
      {
        credentials: myCredentials,
        formData: myFormData
      }
    );
    
    // Build OAuth URL and redirect
    const authUrl = buildOAuthUrl(params);
    window.location.href = authUrl;
  };
  
  const handleStepUpdate = () => {
    // Update flow progress
    auth.updateFlowStep(flowId, newStep, {
      tokens: receivedTokens
    });
  };
  
  const handleComplete = () => {
    // Clean up when done
    auth.completeFlow(flowId);
  };
};`}</CodeBlock>
			</Section>
		</Container>
	);
};

export default EnhancedAuthContextDemo;
