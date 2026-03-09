// src/components/RedirectStateManagerDemo.tsx
// Demo showing RedirectStateManager usage in OAuth flows

import React, { useState } from 'react';
import styled from 'styled-components';
import RedirectStateManager, { type FlowState } from '../services/redirectStateManager';

const Container = styled.div`
  max-width: 1000px;
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
  color: V9_COLORS.TEXT.GRAY_DARK;
  margin: 0 0 0.5rem 0;
`;

const Section = styled.div`
  background: white;
  border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: V9_COLORS.TEXT.GRAY_DARK;
  margin: 0 0 1rem 0;
`;

const Button = styled.button<{ variant?: 'primary' | 'success' | 'danger' }>`
  display: inline-flex;
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
          background: V9_COLORS.PRIMARY.BLUE;
          color: white;
          &:hover { background: V9_COLORS.PRIMARY.BLUE_DARK; }
        `;
			case 'success':
				return `
          background: V9_COLORS.PRIMARY.GREEN;
          color: white;
          &:hover { background: V9_COLORS.PRIMARY.GREEN_DARK; }
        `;
			case 'danger':
				return `
          background: V9_COLORS.PRIMARY.RED;
          color: white;
          &:hover { background: V9_COLORS.PRIMARY.RED_DARK; }
        `;
			default:
				return `
          background: #f3f4f6;
          color: V9_COLORS.TEXT.GRAY_DARK;
          border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
          &:hover { background: V9_COLORS.TEXT.GRAY_LIGHTER; }
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
          border: 1px solid V9_COLORS.BG.SUCCESS_BORDER;
          color: V9_COLORS.PRIMARY.GREEN;
        `;
			case 'error':
				return `
          background: V9_COLORS.BG.ERROR;
          border: 1px solid V9_COLORS.BG.ERROR_BORDER;
          color: V9_COLORS.PRIMARY.RED_DARK;
        `;
			default:
				return `
          background: V9_COLORS.BG.GRAY_LIGHT;
          border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
          color: V9_COLORS.PRIMARY.BLUE_DARK;
        `;
		}
	}}
`;

const CodeBlock = styled.pre`
  background: V9_COLORS.BG.GRAY_LIGHT;
  border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
  border-radius: 4px;
  padding: 1rem;
  font-size: 0.75rem;
  line-height: 1.4;
  overflow-x: auto;
  margin: 1rem 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
`;

export const RedirectStateManagerDemo: React.FC = () => {
	const [flowState, setFlowState] = useState<FlowState>({
		currentStep: 1,
		credentials: {
			environmentId: 'demo-env-123',
			clientId: 'demo-client-456',
			clientSecret: 'demo-secret-789',
		},
		formData: {
			selectedScopes: ['openid', 'profile', 'email'],
			customParameter: 'demo-value',
		},
	});

	const [status, setStatus] = useState<{
		type: 'success' | 'error' | 'info';
		message: string;
	} | null>(null);
	const [preservedState, setPreservedState] = useState<FlowState | null>(null);
	const [flowId] = useState('demo-oauth-flow');

	const handlePreserveState = () => {
		try {
			const success = RedirectStateManager.preserveFlowState(flowId, flowState);

			if (success) {
				setStatus({
					type: 'success',
					message: 'Flow state preserved successfully! Ready for OAuth redirect.',
				});
			} else {
				setStatus({
					type: 'error',
					message: 'Failed to preserve flow state. State may be too large.',
				});
			}
		} catch (error) {
			setStatus({
				type: 'error',
				message: `Error preserving state: ${error instanceof Error ? error.message : 'Unknown error'}`,
			});
		}
	};

	const handleRestoreState = () => {
		try {
			const restored = RedirectStateManager.restoreFlowState(flowId);

			if (restored) {
				setPreservedState(restored);
				setStatus({
					type: 'success',
					message: 'Flow state restored successfully! All data preserved across redirect.',
				});
			} else {
				setStatus({
					type: 'error',
					message: 'No preserved state found or state has expired.',
				});
			}
		} catch (error) {
			setStatus({
				type: 'error',
				message: `Error restoring state: ${error instanceof Error ? error.message : 'Unknown error'}`,
			});
		}
	};

	const handleSimulateCallback = () => {
		try {
			const callbackData = {
				code: 'demo_auth_code_12345',
				state: 'demo_state_67890',
				session_state: 'demo_session_abcdef',
			};

			const result = RedirectStateManager.handleRedirectReturn(callbackData);

			if (result.success) {
				setStatus({
					type: 'success',
					message: `Callback handled successfully! Redirect to: ${result.redirectUrl}`,
				});

				if (result.flowState) {
					setPreservedState(result.flowState);
				}
			} else {
				setStatus({
					type: 'error',
					message: `Callback failed: ${result.error}`,
				});
			}
		} catch (error) {
			setStatus({
				type: 'error',
				message: `Callback error: ${error instanceof Error ? error.message : 'Unknown error'}`,
			});
		}
	};

	const handleClearState = () => {
		try {
			RedirectStateManager.clearFlowState(flowId);
			setPreservedState(null);
			setStatus({
				type: 'success',
				message: 'Flow state cleared successfully.',
			});
		} catch (error) {
			setStatus({
				type: 'error',
				message: `Error clearing state: ${error instanceof Error ? error.message : 'Unknown error'}`,
			});
		}
	};

	const updateFlowState = (field: string, value: any) => {
		setFlowState((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	return (
		<Container>
			<Header>
				<Title>RedirectStateManager Demo</Title>
				<p style={{ color: '#6b7280', margin: 0 }}>
					Demonstration of flow state preservation across OAuth redirects
				</p>
			</Header>

			{status && (
				<StatusDisplay status={status.type}>
					{status.type === 'success' && <span style={{ fontSize: '16px' }}>✅</span>}
					{status.type === 'error' && <span style={{ fontSize: '16px' }}>⚠️</span>}
					{status.type === 'info' && <span style={{ fontSize: '16px' }}>🔄</span>}
					{status.message}
				</StatusDisplay>
			)}

			<Section>
				<SectionTitle>Current Flow State</SectionTitle>
				<CodeBlock>{JSON.stringify(flowState, null, 2)}</CodeBlock>

				<div>
					<Button onClick={() => updateFlowState('currentStep', flowState.currentStep + 1)}>
						Increment Step
					</Button>
					<Button
						onClick={() => updateFlowState('tokens', { access_token: `new_token_${Date.now()}` })}
					>
						Add Tokens
					</Button>
				</div>
			</Section>

			<Section>
				<SectionTitle>State Management Actions</SectionTitle>
				<p style={{ color: '#6b7280', marginBottom: '1rem' }}>
					Simulate the OAuth redirect flow with state preservation:
				</p>

				<div>
					<Button variant="primary" onClick={handlePreserveState}>
						<span style={{ fontSize: '14px' }}>💾</span>
						1. Preserve State
					</Button>
					<Button onClick={handleRestoreState}>
						<span style={{ fontSize: '14px' }}>🔄</span>
						2. Restore State
					</Button>
					<Button variant="success" onClick={handleSimulateCallback}>
						<span style={{ fontSize: '14px' }}>➡️</span>
						3. Simulate Callback
					</Button>
					<Button variant="danger" onClick={handleClearState}>
						Clear State
					</Button>
				</div>
			</Section>

			{preservedState && (
				<Section>
					<SectionTitle>Restored Flow State</SectionTitle>
					<p style={{ color: '#059669', marginBottom: '1rem' }}>
						✅ State successfully preserved and restored across redirect!
					</p>
					<CodeBlock>{JSON.stringify(preservedState, null, 2)}</CodeBlock>
				</Section>
			)}

			<Section>
				<SectionTitle>Integration Example</SectionTitle>
				<CodeBlock>{`// Example: Using RedirectStateManager in an OAuth flow

import RedirectStateManager from '../services/redirectStateManager';

const MyOAuthFlow = () => {
  const handleStartOAuth = () => {
    // 1. Preserve current flow state before redirect
    const flowState = {
      currentStep: 2,
      credentials: myCredentials,
      formData: myFormData,
      tokens: existingTokens
    };
    
    const success = RedirectStateManager.preserveFlowState(
      'my-flow-id', 
      flowState
    );
    
    if (success) {
      // 2. Redirect to OAuth provider
      window.location.href = oauthUrl;
    }
  };
  
  const handleOAuthCallback = (callbackData) => {
    // 3. Handle callback and restore state
    const result = RedirectStateManager.handleRedirectReturn(callbackData);
    
    if (result.success && result.flowState) {
      // State is restored! Continue with flow
      setCurrentStep(result.flowState.currentStep);
      setCredentials(result.flowState.credentials);
      setTokens(result.flowState.tokens);
    }
  };
};`}</CodeBlock>
			</Section>
		</Container>
	);
};

export default RedirectStateManagerDemo;
