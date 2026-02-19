// src/pages/flows/ExampleV7Flow.tsx
/**
 * Example V7 Flow - Demonstrates V7 Flow Template Usage
 *
 * This example shows how to create a new V7 flow using the standardized
 * V7 Flow Template with built-in compliance features.
 */

import React, { useCallback, useState } from 'react';
import { FlowUIService } from '../../services/flowUIService';
import { V7FlowTemplateService } from '../../services/v7FlowTemplateService';
import { V7SharedService } from '../../services/v7SharedService';
import { V7FlowTemplate } from '../../templates/V7FlowTemplate';

// Get shared UI components
const {
	InfoBox,
	InfoTitle,
	InfoText,
	InfoList,
	FormGroup,
	Label,
	Input,
	Button,
	CodeBlock,
	GeneratedContentBox,
	ParameterGrid,
	ParameterLabel,
	ParameterValue,
	HelperText,
} = FlowUIService.getFlowUIComponents();

const ExampleV7Flow: React.FC = () => {
	// Get template configuration
	const templateConfig = V7FlowTemplateService.getTemplateConfig('oauth-authorization-code-v7');

	// State for the flow
	const [credentials, setCredentials] = useState({
		clientId: '',
		clientSecret: '',
		redirectUri: 'https://localhost:3000/callback',
		scope: 'read write',
	});
	const [authUrl, setAuthUrl] = useState('');
	const [authCode, setAuthCode] = useState('');
	const [tokens, setTokens] = useState<any>(null);

	// Step content renderer
	const renderStepContent = useCallback(
		(step: number) => {
			switch (step) {
				case 0:
					return renderCredentialsStep();
				case 1:
					return renderAuthorizationStep();
				case 2:
					return renderCallbackStep();
				case 3:
					return renderTokenExchangeStep();
				case 4:
					return renderTokenManagementStep();
				case 5:
					return renderCompletionStep();
				default:
					return <div>Step not implemented</div>;
			}
		},
		[
			renderAuthorizationStep,
			renderCallbackStep,
			renderCredentialsStep,
			renderTokenExchangeStep,
			renderTokenManagementStep,
			renderCompletionStep,
		]
	);

	// Step 0: Application Configuration
	const renderCredentialsStep = () => (
		<>
			<InfoBox $variant="info">
				<InfoTitle>Configure OAuth Application</InfoTitle>
				<InfoText>
					Enter your OAuth application credentials. These will be used to authenticate with the
					authorization server.
				</InfoText>
			</InfoBox>

			<FormGroup>
				<Label>Client ID</Label>
				<Input
					type="text"
					value={credentials.clientId}
					onChange={(e) => setCredentials((prev) => ({ ...prev, clientId: e.target.value }))}
					placeholder="Enter your client ID"
				/>
				<HelperText>Your OAuth application's client identifier</HelperText>
			</FormGroup>

			<FormGroup>
				<Label>Client Secret</Label>
				<Input
					type="password"
					value={credentials.clientSecret}
					onChange={(e) => setCredentials((prev) => ({ ...prev, clientSecret: e.target.value }))}
					placeholder="Enter your client secret"
				/>
				<HelperText>Your OAuth application's client secret</HelperText>
			</FormGroup>

			<FormGroup>
				<Label>Redirect URI</Label>
				<Input
					type="text"
					value={credentials.redirectUri}
					onChange={(e) => setCredentials((prev) => ({ ...prev, redirectUri: e.target.value }))}
					placeholder="https://localhost:3000/callback"
				/>
				<HelperText>Where to redirect after authorization</HelperText>
			</FormGroup>

			<FormGroup>
				<Label>Scope</Label>
				<Input
					type="text"
					value={credentials.scope}
					onChange={(e) => setCredentials((prev) => ({ ...prev, scope: e.target.value }))}
					placeholder="read write"
				/>
				<HelperText>Space-separated list of permissions</HelperText>
			</FormGroup>
		</>
	);

	// Step 1: Authorization Request
	const renderAuthorizationStep = () => {
		const generateAuthUrl = () => {
			// Validate parameters using V7 service
			const validation = V7SharedService.ParameterValidation.validateFlowParameters(
				'oauth-authorization-code-v7',
				credentials
			);

			if (!validation.isValid) {
				alert(`Parameter validation failed: ${validation.errors.join(', ')}`);
				return;
			}

			// Generate authorization URL
			const params = new URLSearchParams({
				response_type: 'code',
				client_id: credentials.clientId,
				redirect_uri: credentials.redirectUri,
				scope: credentials.scope,
				state: 'random-state-value',
			});

			const url = `https://auth.pingone.com/oauth/authorize?${params.toString()}`;
			setAuthUrl(url);
		};

		return (
			<>
				<InfoBox $variant="info">
					<InfoTitle>Generate Authorization URL</InfoTitle>
					<InfoText>
						Create the authorization URL that will redirect the user to the authorization server for
						authentication.
					</InfoText>
				</InfoBox>

				<div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
					<Button onClick={generateAuthUrl}>Generate Authorization URL</Button>
				</div>

				{authUrl && (
					<GeneratedContentBox>
						<InfoTitle>Authorization URL</InfoTitle>
						<CodeBlock>{authUrl}</CodeBlock>
						<Button onClick={() => window.open(authUrl, '_blank')}>Open Authorization URL</Button>
					</GeneratedContentBox>
				)}
			</>
		);
	};

	// Step 2: Authorization Response
	const renderCallbackStep = () => (
		<>
			<InfoBox $variant="info">
				<InfoTitle>Authorization Code Received</InfoTitle>
				<InfoText>
					The user has been redirected back to your application with an authorization code. Enter
					the code below.
				</InfoText>
			</InfoBox>

			<FormGroup>
				<Label>Authorization Code</Label>
				<Input
					type="text"
					value={authCode}
					onChange={(e) => setAuthCode(e.target.value)}
					placeholder="Enter the authorization code"
				/>
				<HelperText>The authorization code returned from the authorization server</HelperText>
			</FormGroup>
		</>
	);

	// Step 3: Token Exchange
	const renderTokenExchangeStep = () => {
		const exchangeTokens = async () => {
			if (!authCode) {
				alert('Please enter an authorization code first');
				return;
			}

			try {
				// Simulate token exchange
				const mockTokens = {
					access_token: 'mock-access-token-12345',
					token_type: 'Bearer',
					expires_in: 3600,
					refresh_token: 'mock-refresh-token-67890',
					scope: credentials.scope,
				};

				setTokens(mockTokens);
			} catch (_error) {
				alert('Token exchange failed');
			}
		};

		return (
			<>
				<InfoBox $variant="info">
					<InfoTitle>Exchange Authorization Code for Tokens</InfoTitle>
					<InfoText>
						Use the authorization code to obtain access and refresh tokens from the token endpoint.
					</InfoText>
				</InfoBox>

				<div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
					<Button onClick={exchangeTokens}>Exchange Code for Tokens</Button>
				</div>

				{tokens && (
					<GeneratedContentBox>
						<InfoTitle>Token Response</InfoTitle>
						<CodeBlock>{JSON.stringify(tokens, null, 2)}</CodeBlock>
					</GeneratedContentBox>
				)}
			</>
		);
	};

	// Step 4: Token Management
	const renderTokenManagementStep = () => {
		if (!tokens) {
			return (
				<InfoBox $variant="warning">
					<InfoTitle>No Tokens Available</InfoTitle>
					<InfoText>Please complete the token exchange step first.</InfoText>
				</InfoBox>
			);
		}

		return (
			<>
				<InfoBox $variant="success">
					<InfoTitle>Tokens Obtained Successfully</InfoTitle>
					<InfoText>Your application now has access to the protected resources.</InfoText>
				</InfoBox>

				<GeneratedContentBox>
					<InfoTitle>Access Token</InfoTitle>
					<CodeBlock>{tokens.access_token}</CodeBlock>
				</GeneratedContentBox>

				<GeneratedContentBox>
					<InfoTitle>Refresh Token</InfoTitle>
					<CodeBlock>{tokens.refresh_token}</CodeBlock>
				</GeneratedContentBox>

				<ParameterGrid>
					<ParameterLabel>Token Type</ParameterLabel>
					<ParameterValue>{tokens.token_type}</ParameterValue>
					<ParameterLabel>Expires In</ParameterLabel>
					<ParameterValue>{tokens.expires_in} seconds</ParameterValue>
					<ParameterLabel>Scope</ParameterLabel>
					<ParameterValue>{tokens.scope}</ParameterValue>
				</ParameterGrid>
			</>
		);
	};

	// Step 5: Flow Completion
	const renderCompletionStep = () => (
		<>
			<InfoBox $variant="success">
				<InfoTitle>OAuth Flow Completed Successfully</InfoTitle>
				<InfoText>
					You have successfully completed the OAuth 2.0 Authorization Code flow. Your application
					now has the necessary tokens to access protected resources.
				</InfoText>
			</InfoBox>

			<InfoBox $variant="info">
				<InfoTitle>Next Steps</InfoTitle>
				<InfoList>
					<li>Use the access token to make API calls</li>
					<li>Implement token refresh when the access token expires</li>
					<li>Store tokens securely in your application</li>
					<li>Implement proper error handling for token-related issues</li>
				</InfoList>
			</InfoBox>
		</>
	);

	// Navigation validation
	const canNavigateNext = useCallback(
		(step: number) => {
			switch (step) {
				case 0:
					return credentials.clientId && credentials.clientSecret && credentials.redirectUri;
				case 1:
					return authUrl !== '';
				case 2:
					return authCode !== '';
				case 3:
					return tokens !== null;
				case 4:
					return true;
				case 5:
					return true;
				default:
					return false;
			}
		},
		[credentials, authUrl, authCode, tokens]
	);

	// Reset handler
	const handleReset = useCallback(() => {
		setCredentials({
			clientId: '',
			clientSecret: '',
			redirectUri: 'https://localhost:3000/callback',
			scope: 'read write',
		});
		setAuthUrl('');
		setAuthCode('');
		setTokens(null);
	}, []);

	return (
		<V7FlowTemplate
			flowName={templateConfig.flowName}
			flowTitle={templateConfig.flowTitle}
			flowSubtitle={templateConfig.flowSubtitle}
			stepMetadata={templateConfig.stepMetadata}
			renderStepContent={renderStepContent}
			canNavigateNext={canNavigateNext}
			onReset={handleReset}
			complianceFeatures={templateConfig.complianceFeatures}
		/>
	);
};

export default ExampleV7Flow;
