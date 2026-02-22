// src/examples/OAuthFlowWithRedirectStateManager.tsx
// Example OAuth flow using RedirectStateManager for state preservation

import React, { useCallback, useEffect, useState } from 'react';
import { FiArrowRight, FiCheckCircle, FiSettings } from 'react-icons/fi';
import styled from 'styled-components';
import FlowContextService from '../services/flowContextService';
import RedirectStateManager, { type FlowState } from '../services/redirectStateManager';

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
`;

const StepCard = styled.div<{ active: boolean }>`
  border: 1px solid ${(props) => (props.active ? '#3b82f6' : '#e5e7eb')};
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  background: ${(props) => (props.active ? '#eff6ff' : 'white')};
`;

const Button = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background: #2563eb;
  }

  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
`;

interface Credentials {
	environmentId: string;
	clientId: string;
	clientSecret: string;
	redirectUri: string;
	scopes: string;
}

export const OAuthFlowWithRedirectStateManager: React.FC = () => {
	const [currentStep, setCurrentStep] = useState(1);
	const [credentials, setCredentials] = useState<Credentials>({
		environmentId: 'demo-env-123',
		clientId: 'demo-client-456',
		clientSecret: 'demo-secret-789',
		redirectUri: 'https://localhost:3000/authz-callback',
		scopes: 'openid profile email',
	});
	const [authUrl, setAuthUrl] = useState('');
	const [authCode, setAuthCode] = useState('');
	const [tokens, setTokens] = useState<any>(null);
	const [flowId] = useState('example-oauth-flow');

	// Simulate OAuth callback handling
	useEffect(() => {
		const handleCallback = () => {
			const urlParams = new URLSearchParams(window.location.search);
			const code = urlParams.get('code');
			const state = urlParams.get('state');

			if (code && state) {
				console.log('OAuth callback detected, handling with RedirectStateManager...');

				const callbackData = {
					code,
					state,
					session_state: urlParams.get('session_state'),
					iss: urlParams.get('iss'),
				};

				const result = RedirectStateManager.handleRedirectReturn(callbackData);

				if (result.success && result.flowState) {
					// Restore flow state
					setCurrentStep(result.flowState.currentStep || 3);
					setCredentials(result.flowState.credentials || credentials);
					setAuthCode(code);

					// Clear URL parameters
					window.history.replaceState({}, document.title, window.location.pathname);
				}
			}
		};

		handleCallback();
	}, [credentials]);

	const handleStep1Complete = useCallback(() => {
		// Step 1: Save credentials and move to authorization
		const flowState: FlowState = {
			currentStep: 2,
			credentials,
			formData: {
				selectedScopes: credentials.scopes.split(' '),
				timestamp: Date.now(),
			},
		};

		// Create flow context for redirect handling
		const flowContext = FlowContextService.createFlowContext(
			'example-oauth-flow',
			'/examples/oauth-flow-redirect-demo',
			2,
			{ step: 2 },
			credentials
		);

		// Save flow context
		FlowContextService.saveFlowContext(flowId, flowContext);

		// Preserve flow state
		const success = RedirectStateManager.preserveFlowState(flowId, flowState);

		if (success) {
			setCurrentStep(2);

			// Generate OAuth URL
			const authorizationUrl = new URL(
				`https://auth.pingone.com/${credentials.environmentId}/as/authorize`
			);
			authorizationUrl.searchParams.set('response_type', 'code');
			authorizationUrl.searchParams.set('client_id', credentials.clientId);
			authorizationUrl.searchParams.set('redirect_uri', credentials.redirectUri);
			authorizationUrl.searchParams.set('scope', credentials.scopes);
			authorizationUrl.searchParams.set('state', `${flowId}_${Date.now()}`);

			setAuthUrl(authorizationUrl.toString());
		}
	}, [credentials, flowId]);

	const handleStep2Complete = useCallback(() => {
		// Step 2: Simulate OAuth redirect (in real app, this would redirect to PingOne)
		console.log('In a real app, this would redirect to:', authUrl);

		// For demo purposes, simulate the callback
		setTimeout(() => {
			const simulatedCallback = `${window.location.origin}${window.location.pathname}?code=demo_auth_code_12345&state=${flowId}_${Date.now()}`;
			window.history.pushState({}, '', simulatedCallback);

			// Trigger callback handling
			window.dispatchEvent(new PopStateEvent('popstate'));
			window.location.reload();
		}, 1000);
	}, [authUrl, flowId]);

	const handleStep3Complete = useCallback(async () => {
		// Step 3: Exchange code for tokens
		try {
			// Simulate token exchange
			const mockTokens = {
				access_token: `demo_access_token_${Date.now()}`,
				id_token: `demo_id_token_${Date.now()}`,
				refresh_token: `demo_refresh_token_${Date.now()}`,
				token_type: 'Bearer',
				expires_in: 3600,
			};

			setTokens(mockTokens);
			setCurrentStep(4);

			// Update flow state with tokens
			const updatedFlowState: FlowState = {
				currentStep: 4,
				credentials,
				tokens: mockTokens,
				authCode,
				completedAt: new Date().toISOString(),
			};

			RedirectStateManager.preserveFlowState(flowId, updatedFlowState);
		} catch (error) {
			console.error('Token exchange failed:', error);
		}
	}, [credentials, authCode, flowId]);

	const handleComplete = useCallback(() => {
		// Clean up flow state
		RedirectStateManager.clearFlowState(flowId);
		FlowContextService.clearFlowContext(flowId);

		alert('OAuth flow completed successfully! Flow state has been cleaned up.');
	}, [flowId]);

	return (
		<Container>
			<h1>OAuth Flow with RedirectStateManager</h1>
			<p style={{ color: '#6b7280', marginBottom: '2rem' }}>
				This example demonstrates how to use RedirectStateManager to preserve flow state across
				OAuth redirects.
			</p>

			<StepCard active={currentStep === 1}>
				<h3>Step 1: Configure Credentials</h3>
				<p>Set up OAuth credentials and prepare for authorization.</p>

				<div style={{ marginBottom: '1rem' }}>
					<label style={{ display: 'block', marginBottom: '0.5rem' }} htmlFor="environmentid">
						Environment ID:
					</label>
					<input
						value={credentials.environmentId}
						onChange={(e) => setCredentials((prev) => ({ ...prev, environmentId: e.target.value }))}
						style={{
							width: '100%',
							padding: '0.5rem',
							border: '1px solid #d1d5db',
							borderRadius: '4px',
						}}
					/>
				</div>

				<div style={{ marginBottom: '1rem' }}>
					<label style={{ display: 'block', marginBottom: '0.5rem' }} htmlFor="clientid">
						Client ID:
					</label>
					<input
						value={credentials.clientId}
						onChange={(e) => setCredentials((prev) => ({ ...prev, clientId: e.target.value }))}
						style={{
							width: '100%',
							padding: '0.5rem',
							border: '1px solid #d1d5db',
							borderRadius: '4px',
						}}
					/>
				</div>

				{currentStep === 1 && (
					<Button onClick={handleStep1Complete}>
						<FiSettings size={16} />
						Save & Continue
					</Button>
				)}

				{currentStep > 1 && (
					<div style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
						<FiCheckCircle size={16} />
						Credentials saved and flow state preserved
					</div>
				)}
			</StepCard>

			<StepCard active={currentStep === 2}>
				<h3>Step 2: OAuth Authorization</h3>
				<p>Redirect to PingOne for authorization (flow state is preserved).</p>

				{authUrl && (
					<div style={{ marginBottom: '1rem' }}>
						<p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Authorization URL:</p>
						<code
							style={{
								display: 'block',
								padding: '0.5rem',
								background: '#f3f4f6',
								borderRadius: '4px',
								fontSize: '0.75rem',
								wordBreak: 'break-all',
							}}
						>
							{authUrl}
						</code>
					</div>
				)}

				{currentStep === 2 && (
					<Button onClick={handleStep2Complete}>
						<FiArrowRight size={16} />
						Simulate OAuth Redirect
					</Button>
				)}

				{currentStep > 2 && (
					<div style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
						<FiCheckCircle size={16} />
						OAuth redirect completed, state restored
					</div>
				)}
			</StepCard>

			<StepCard active={currentStep === 3}>
				<h3>Step 3: Token Exchange</h3>
				<p>Exchange authorization code for tokens (credentials restored from preserved state).</p>

				{authCode && (
					<div style={{ marginBottom: '1rem' }}>
						<p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Authorization Code:</p>
						<code
							style={{
								display: 'block',
								padding: '0.5rem',
								background: '#f3f4f6',
								borderRadius: '4px',
								fontSize: '0.875rem',
							}}
						>
							{authCode}
						</code>
					</div>
				)}

				{currentStep === 3 && (
					<Button onClick={handleStep3Complete}>
						<FiArrowRight size={16} />
						Exchange for Tokens
					</Button>
				)}

				{currentStep > 3 && (
					<div style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
						<FiCheckCircle size={16} />
						Tokens received successfully
					</div>
				)}
			</StepCard>

			<StepCard active={currentStep === 4}>
				<h3>Step 4: Flow Complete</h3>
				<p>OAuth flow completed successfully with state preservation throughout.</p>

				{tokens && (
					<div style={{ marginBottom: '1rem' }}>
						<p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Received Tokens:</p>
						<pre
							style={{
								padding: '1rem',
								background: '#f3f4f6',
								borderRadius: '4px',
								fontSize: '0.75rem',
								overflow: 'auto',
							}}
						>
							{JSON.stringify(tokens, null, 2)}
						</pre>
					</div>
				)}

				{currentStep === 4 && (
					<Button onClick={handleComplete}>
						<FiCheckCircle size={16} />
						Complete & Cleanup
					</Button>
				)}
			</StepCard>
		</Container>
	);
};

export default OAuthFlowWithRedirectStateManager;
