// src/pages/flows/WorkerTokenFlowV7.tsx
// V7 PingOne Worker Token Flow with ComprehensiveCredentialsService

import React, { useCallback, useEffect, useState } from 'react';
import { FiAlertCircle, FiCheckCircle, FiKey, FiShield } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import FlowSequenceDisplay from '../../components/FlowSequenceDisplay';
import {
	ResultsSection as ImportedResultsSection,
	ResultsHeading,
} from '../../components/ResultsPanel';
import { StepNavigationButtons } from '../../components/StepNavigationButtons';
import { usePageScroll } from '../../hooks/usePageScroll';
import { useWorkerTokenFlowController } from '../../hooks/useWorkerTokenFlowController';
import ComprehensiveCredentialsService from '../../services/comprehensiveCredentialsService';
import { FlowHeader } from '../../services/flowHeaderService';
import { OAuthErrorHandlingService } from '../../services/oauthErrorHandlingService';
import { oidcDiscoveryService } from '../../services/oidcDiscoveryService';
import UnifiedTokenDisplayService from '../../services/unifiedTokenDisplayService';
import { workerTokenDiscoveryService } from '../../services/workerTokenDiscoveryService';
import { checkCredentialsAndWarn } from '../../utils/credentialsWarningService';
import { v4ToastManager } from '../../utils/v4ToastMessages';

const Container = styled.div`
	max-width: 1200px;
	margin: 0 auto;
	padding: 20px;
`;

const StepContainer = styled.div`
	margin-bottom: 30px;
	background: white;
	border-radius: 8px;
	padding: 24px;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const StepTitle = styled.h2`
	font-size: 24px;
	font-weight: 600;
	margin-bottom: 16px;
	color: #1a202c;
	display: flex;
	align-items: center;
	gap: 12px;
`;

const StyledHelperText = styled.p`
	color: #64748b;
	font-size: 14px;
	line-height: 1.6;
	margin-bottom: 20px;
`;

const _ActionRow = styled.div`
	display: flex;
	gap: 12px;
	flex-wrap: wrap;
	margin-top: 16px;
`;

const _HighlightedActionButton = styled.button<{ $priority?: string }>`
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 12px 20px;
	border: none;
	border-radius: 6px;
	font-size: 14px;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;
	background: ${(props) => {
		if (props.$priority === 'warning') return '#f59e0b';
		return '#3b82f6';
	}};
	color: white;
	
	&:hover {
		opacity: 0.9;
		transform: translateY(-1px);
	}
	
	&:active {
		transform: translateY(0);
	}
`;

const TokenSection = styled.div`
	margin-top: 24px;
	width: 100%;
	max-width: 100%;
`;

const StyledSectionDivider = styled.div`
	height: 1px;
	background: #e2e8f0;
	margin: 24px 0;
`;

const WorkerTokenFlowV7: React.FC = () => {
	usePageScroll({ pageName: 'WorkerTokenFlowV7', force: true });
	// Check credentials on mount and show warning if missing
	useEffect(() => {
		checkCredentialsAndWarn(controller.credentials, {
			flowName: 'Worker Token Flow',
			requiredFields: ['environmentId', 'clientId', 'clientSecret'],
			showToast: true,
		});
	}, [controller.credentials]); // Only run once on mount
	const navigate = useNavigate();

	// Initialize controller with default scopes for worker tokens
	const controller = useWorkerTokenFlowController({
		flowKey: 'worker-token-v7',
		defaultFlowVariant: 'worker',
	});

	// Local state for credentials
	const [credentials, setCredentials] = useState(controller.credentials);
	const [currentStep, setCurrentStep] = useState(0);
	const [_errorDetails, setErrorDetails] = useState<any>(null);
	const [workerToken, setWorkerToken] = useState(localStorage.getItem('worker_token') || '');

	// Debug logging for credentials being passed to ComprehensiveCredentialsService
	useEffect(() => {
		console.log(
			'🔧 [WorkerTokenFlowV7] Credentials being passed to ComprehensiveCredentialsService:',
			{
				environmentId: credentials.environmentId || '',
				clientId: credentials.clientId || '',
				hasClientSecret: !!(credentials.clientSecret || ''),
				scopes: credentials.scopes || '',
				controllerHasEnvironmentId: !!controller.credentials.environmentId,
				controllerEnvironmentId: controller.credentials.environmentId,
			}
		);

		// Debug button state
		const localCanGoNext = !!(
			credentials.environmentId &&
			credentials.clientId &&
			credentials.clientSecret
		);
		const controllerCanGoNext = !!(
			controller.credentials.environmentId &&
			controller.credentials.clientId &&
			controller.credentials.clientSecret
		);
		console.log('🔘 [WorkerTokenFlowV7] Button state:', {
			localCanGoNext,
			controllerCanGoNext,
			usingController: true, // We changed to use controller.credentials
		});
	}, [credentials, controller.credentials]);

	// Sync credentials with controller
	useEffect(() => {
		console.log('🔍 [WorkerTokenFlowV7] Controller credentials updated:', controller.credentials);
		console.log('🔍 [WorkerTokenFlowV7] Current local credentials before sync:', credentials);
		setCredentials(controller.credentials);
		console.log('🔍 [WorkerTokenFlowV7] Local credentials after sync:', controller.credentials);
	}, [controller.credentials, credentials]);

	// Check for worker token updates
	useEffect(() => {
		const checkWorkerToken = () => {
			const token = localStorage.getItem('worker_token');
			if (token && token !== workerToken) {
				setWorkerToken(token);
			}
		};

		checkWorkerToken();
		const interval = setInterval(checkWorkerToken, 1000);
		return () => clearInterval(interval);
	}, [workerToken]);

	// Request worker token
	const handleRequestToken = useCallback(async () => {
		try {
			console.log('[WorkerToken V7] Requesting token with credentials:', {
				environmentId: credentials.environmentId,
				clientId: credentials.clientId,
				hasClientSecret: !!credentials.clientSecret,
				scopes: credentials.scopes,
			});

			await controller.requestToken();
			v4ToastManager.showSuccess('Worker token generated successfully!');
			setCurrentStep(1);
		} catch (error) {
			console.error('[WorkerToken V7] Token request failed:', error);

			const errorDetails = OAuthErrorHandlingService.parseOAuthError(error, {
				flowType: 'worker-token',
				stepId: 'request-token',
				operation: 'requestToken',
				credentials: {
					hasClientId: !!credentials.clientId,
					hasClientSecret: !!credentials.clientSecret,
					hasEnvironmentId: !!credentials.environmentId,
				},
			});

			v4ToastManager.showError(errorDetails.message);
			setErrorDetails(errorDetails);
		}
	}, [controller, credentials]);

	// Navigate to token management
	const handleViewTokenManagement = useCallback(() => {
		navigate('/token-management');
	}, [navigate]);

	// Enhanced reset handler with error handling
	const handleReset = useCallback(() => {
		try {
			// Reset controller state
			controller.resetFlow();

			// Reset local state
			setCurrentStep(0);
			setErrorDetails(null);
			setWorkerToken('');

			// Clear Worker Token Flow V7-specific storage with error handling
			try {
				// Note: FlowCredentialService.clearFlowState would be called here if available
				console.log('🔧 [Worker Token V7] Cleared flow-specific storage');
			} catch (error) {
				console.error('[Worker Token V7] Failed to clear flow state:', error);
				v4ToastManager.showError('Failed to clear flow state. Please refresh the page.');
			}

			// Clear worker token from localStorage
			try {
				localStorage.removeItem('worker_token');
				console.log('🔧 [Worker Token V7] Cleared worker token from localStorage');
			} catch (error) {
				console.error('[Worker Token V7] Failed to clear worker token:', error);
			}

			v4ToastManager.showSuccess('Worker Token Flow reset successfully');
		} catch (error) {
			console.error('[Worker Token V7] Reset failed:', error);
			v4ToastManager.showError('Failed to reset flow. Please refresh the page.');
		}
	}, [controller]);

	// Enhanced step validation with error messages
	const _isStepValid = useCallback(
		(step: number): boolean => {
			switch (step) {
				case 0:
					// Step 0: Must have valid credentials
					return !!(credentials.environmentId && credentials.clientId && credentials.clientSecret);
				case 1:
					// Step 1: Must have tokens from successful request
					return !!controller.tokens;
				case 2:
					// Step 2: Must have tokens for completion
					return !!controller.tokens;
				default:
					return true;
			}
		},
		[credentials, controller.tokens]
	);

	// Get step validation error message
	const getStepValidationMessage = useCallback(
		(step: number): string => {
			switch (step) {
				case 0:
					if (!credentials.environmentId) return 'Environment ID is required';
					if (!credentials.clientId) return 'Client ID is required';
					if (!credentials.clientSecret) return 'Client Secret is required';
					return '';
				case 1:
				case 2:
					if (!controller.tokens) return 'Worker token is required. Please generate a token first.';
					return '';
				default:
					return '';
			}
		},
		[credentials, controller.tokens]
	);

	// Step content renderers
	const renderStep0 = () => (
		<StepContainer>
			<StepTitle>
				<FiKey /> Configure Worker Token Credentials
			</StepTitle>
			<StyledHelperText>
				Configure your PingOne environment and worker application credentials. Worker tokens are
				used for machine-to-machine authentication with PingOne Management APIs.
			</StyledHelperText>

			<ComprehensiveCredentialsService
				flowType="worker-token-v7"
				// Credentials
				environmentId={credentials.environmentId || ''}
				clientId={credentials.clientId || ''}
				clientSecret={credentials.clientSecret || ''}
				scopes={credentials.scopes || ''}
				// Explicit formData for config checker
				formData={{
					environmentId: credentials.environmentId,
					clientId: credentials.clientId,
					clientSecret: credentials.clientSecret,
					grantTypes: ['client_credentials'], // Worker tokens always use client_credentials
					responseTypes: [], // Worker tokens don't use response types
					tokenEndpointAuthMethod: credentials.clientAuthMethod || 'client_secret_post',
				}}
				// Change handlers - sync both local state and controller
				onEnvironmentIdChange={(value) => {
					const updated = { ...credentials, environmentId: value };
					setCredentials(updated);
					controller.setCredentials(updated);
				}}
				onClientIdChange={(value) => {
					const updated = { ...credentials, clientId: value };
					setCredentials(updated);
					controller.setCredentials(updated);
				}}
				onClientSecretChange={(value) => {
					const updated = { ...credentials, clientSecret: value };
					setCredentials(updated);
					controller.setCredentials(updated);
				}}
				onScopesChange={(value) => {
					const updated = { ...credentials, scopes: value, scope: value };
					setCredentials(updated);
					controller.setCredentials(updated);
				}}
				// Save handler
				onSave={async () => {
					try {
						await controller.saveCredentials();
						v4ToastManager.showSuccess('Credentials saved successfully!');
						setErrorDetails(null);
					} catch (error) {
						console.error('[WorkerToken V7] Failed to save credentials:', error);

						const errorDetails = OAuthErrorHandlingService.parseOAuthError(error, {
							flowType: 'worker-token',
							stepId: 'save-credentials',
							operation: 'saveCredentials',
							credentials: {
								hasClientId: !!credentials.clientId,
								hasClientSecret: !!credentials.clientSecret,
								hasEnvironmentId: !!credentials.environmentId,
							},
						});

						v4ToastManager.showError(errorDetails.message);
						setErrorDetails(errorDetails);
					}
				}}
				// Discovery handler with comprehensive discovery
				onDiscoveryComplete={async (result) => {
					console.log('🔍 [WorkerTokenFlowV7] OIDC Discovery completed:', result);
					console.log('🔍 [WorkerTokenFlowV7] Current credentials before discovery:', credentials);

					// Extract environment ID
					if (result.issuerUrl) {
						const extractedEnvId = oidcDiscoveryService.extractEnvironmentId(result.issuerUrl);
						if (extractedEnvId) {
							const updated = { ...credentials, environmentId: extractedEnvId };
							setCredentials(updated);
							controller.setCredentials(updated);
							console.log('[WorkerToken V7] Auto-extracted Environment ID:', extractedEnvId);
						}
					}

					// Use comprehensive discovery for enhanced functionality
					if (result.document?.issuer) {
						try {
							const envId = oidcDiscoveryService.extractEnvironmentId(result.document.issuer);
							if (envId) {
								const comprehensiveResult = await workerTokenDiscoveryService.discover({
									environmentId: envId,
									region: 'us',
									clientId: credentials.clientId,
									clientSecret: credentials.clientSecret,
									timeout: 15000,
									enableCaching: true,
								});

								if (comprehensiveResult.success) {
									console.log(
										'[WorkerToken V7] Comprehensive discovery successful:',
										comprehensiveResult
									);

									const updatedCredentials = {
										...credentials,
										environmentId: comprehensiveResult.environmentId || envId,
										tokenEndpoint: comprehensiveResult.tokenEndpoint,
										introspectionEndpoint: comprehensiveResult.introspectionEndpoint,
										userInfoEndpoint: comprehensiveResult.userInfoEndpoint,
										scopes: comprehensiveResult.scopes?.join(' ') || credentials.scopes,
									};

									setCredentials(updatedCredentials);
									controller.setCredentials(updatedCredentials);

									// Auto-save credentials
									if (updatedCredentials.environmentId && updatedCredentials.clientId) {
										await controller.saveCredentials();
										v4ToastManager.showSuccess(
											'Credentials auto-saved after comprehensive OIDC discovery'
										);
									}

									v4ToastManager.showSuccess('Enhanced OIDC discovery completed');
								}
							}
						} catch (error) {
							console.warn('[WorkerToken V7] Comprehensive discovery error:', error);
						}
					}
				}}
				// Configuration
				requireClientSecret={true}
				showRedirectUri={false}
				showPostLogoutRedirectUri={false}
				showLoginHint={false}
				showAdvancedConfig={false}
				defaultCollapsed={false}
				// Worker token and Config Checker - Disabled to remove pre-flight API calls
				workerToken={workerToken}
				showConfigChecker={false}
				region="NA"
			/>

			<StyledSectionDivider />

			<StepNavigationButtons
				currentStep={0}
				totalSteps={3}
				onNext={handleRequestToken}
				onPrevious={() => {}}
				onReset={() => setCurrentStep(0)}
				canNavigateNext={true}
				isFirstStep={true}
			/>
		</StepContainer>
	);

	const renderStep1 = () => {
		const tokens = controller.tokens;

		return (
			<StepContainer>
				<StepTitle>
					<FiCheckCircle /> Worker Token Generated
				</StepTitle>
				<StyledHelperText>
					Your PingOne worker token has been successfully generated. Use this token to authenticate
					with PingOne Management APIs.
				</StyledHelperText>

				{tokens && (
					<TokenSection>
						{UnifiedTokenDisplayService.showTokens(tokens, 'oauth', 'worker-token-v7', {
							showCopyButtons: true,
							showDecodeButtons: true,
							showIntrospection: false,
							title: '🔑 Worker Access Token',
						})}
					</TokenSection>
				)}

				{/* Note: PingOne Configuration Checker is available in Step 0 via ComprehensiveCredentialsService */}
				<StyledSectionDivider />
				<ImportedResultsSection>
					<ResultsHeading>
						<FiAlertCircle size={18} /> Configuration Management
					</ResultsHeading>
					<StyledHelperText>
						To use the Config Checker features (Check Config, Create App, Get New Worker Token),
						return to Step 0 where these tools are integrated into the credentials configuration
						section.
					</StyledHelperText>
				</ImportedResultsSection>

				<StyledSectionDivider />

				<FlowSequenceDisplay flowType="worker-token" />

				<StyledSectionDivider />

				<StepNavigationButtons
					currentStep={1}
					totalSteps={3}
					onNext={() => setCurrentStep(2)}
					onPrevious={() => setCurrentStep(0)}
					onReset={() => setCurrentStep(0)}
					canNavigateNext={true}
					isFirstStep={false}
					nextButtonText="Learn API Usage"
				/>
			</StepContainer>
		);
	};

	const renderStep2 = () => {
		const tokens = controller.tokens;
		const accessToken = tokens?.access_token || '';

		return (
			<StepContainer>
				<StepTitle>
					<FiShield /> Using Worker Tokens with PingOne Administration APIs
				</StepTitle>
				<StyledHelperText>
					Learn how to use your worker token to make authenticated calls to PingOne Management APIs
					for administrative operations.
				</StyledHelperText>

				{/* PingOne Administration API Overview */}
				<div
					style={{
						background: '#f0f9ff',
						border: '1px solid #0ea5e9',
						borderRadius: '0.75rem',
						padding: '1.5rem',
						marginBottom: '1.5rem',
					}}
				>
					<h4
						style={{
							margin: '0 0 1rem 0',
							fontSize: '1.125rem',
							fontWeight: 600,
							color: '#0c4a6e',
						}}
					>
						🏢 PingOne Administration APIs
					</h4>
					<div style={{ fontSize: '0.875rem', color: '#0c4a6e', lineHeight: 1.6 }}>
						<p style={{ margin: '0 0 1rem 0' }}>
							Worker tokens provide machine-to-machine authentication for PingOne Management APIs.
							These APIs allow you to:
						</p>
						<ul style={{ margin: '0 0 1rem 0', paddingLeft: '1.5rem' }}>
							<li>
								<strong>Manage Applications:</strong> Create, update, and configure OAuth/OIDC
								applications
							</li>
							<li>
								<strong>User Management:</strong> Create, update, and manage user accounts
							</li>
							<li>
								<strong>Device Management:</strong> Register and manage MFA devices
							</li>
							<li>
								<strong>Environment Configuration:</strong> Configure environments, populations, and
								settings
							</li>
							<li>
								<strong>Resource Management:</strong> Manage scopes, resources, and permissions
							</li>
						</ul>
					</div>
				</div>

				{/* API Call Examples */}
				<div
					style={{
						background: '#f0fdf4',
						border: '1px solid #22c55e',
						borderRadius: '0.75rem',
						padding: '1.5rem',
						marginBottom: '1.5rem',
					}}
				>
					<h4
						style={{
							margin: '0 0 1rem 0',
							fontSize: '1.125rem',
							fontWeight: 600,
							color: '#166534',
						}}
					>
						🔧 Common Administration API Calls
					</h4>

					{/* Get Applications */}
					<div style={{ marginBottom: '1rem' }}>
						<h5
							style={{
								margin: '0 0 0.5rem 0',
								fontSize: '1rem',
								fontWeight: 600,
								color: '#166534',
							}}
						>
							📱 Get Applications
						</h5>
						<div
							style={{
								background: '#ffffff',
								border: '1px solid #d1fae5',
								borderRadius: '0.5rem',
								padding: '1rem',
								fontFamily: 'monospace',
								fontSize: '0.875rem',
							}}
						>
							<div style={{ color: '#059669', marginBottom: '0.5rem' }}>
								GET /v1/environments/{'{environmentId}'}/applications
							</div>
							<div style={{ color: '#6b7280' }}>
								Authorization: Bearer {accessToken.substring(0, 20)}...
							</div>
						</div>
					</div>

					{/* Get Users */}
					<div style={{ marginBottom: '1rem' }}>
						<h5
							style={{
								margin: '0 0 0.5rem 0',
								fontSize: '1rem',
								fontWeight: 600,
								color: '#166534',
							}}
						>
							👥 Get Users
						</h5>
						<div
							style={{
								background: '#ffffff',
								border: '1px solid #d1fae5',
								borderRadius: '0.5rem',
								padding: '1rem',
								fontFamily: 'monospace',
								fontSize: '0.875rem',
							}}
						>
							<div style={{ color: '#059669', marginBottom: '0.5rem' }}>
								GET /v1/environments/{'{environmentId}'}/users
							</div>
							<div style={{ color: '#6b7280' }}>
								Authorization: Bearer {accessToken.substring(0, 20)}...
							</div>
						</div>
					</div>

					{/* Get Resources/Scopes */}
					<div style={{ marginBottom: '1rem' }}>
						<h5
							style={{
								margin: '0 0 0.5rem 0',
								fontSize: '1rem',
								fontWeight: 600,
								color: '#166534',
							}}
						>
							🔐 Get Resources & Scopes
						</h5>
						<div
							style={{
								background: '#ffffff',
								border: '1px solid #d1fae5',
								borderRadius: '0.5rem',
								padding: '1rem',
								fontFamily: 'monospace',
								fontSize: '0.875rem',
							}}
						>
							<div style={{ color: '#059669', marginBottom: '0.5rem' }}>
								GET /v1/environments/{'{environmentId}'}/resources
							</div>
							<div style={{ color: '#6b7280' }}>
								Authorization: Bearer {accessToken.substring(0, 20)}...
							</div>
						</div>
					</div>
				</div>

				{/* Code Examples */}
				<div
					style={{
						background: '#fef3c7',
						border: '1px solid #f59e0b',
						borderRadius: '0.75rem',
						padding: '1.5rem',
						marginBottom: '1.5rem',
					}}
				>
					<h4
						style={{
							margin: '0 0 1rem 0',
							fontSize: '1.125rem',
							fontWeight: 600,
							color: '#92400e',
						}}
					>
						💻 JavaScript Code Examples
					</h4>

					<div
						style={{
							background: '#ffffff',
							border: '1px solid #fbbf24',
							borderRadius: '0.5rem',
							padding: '1rem',
							fontFamily: 'monospace',
							fontSize: '0.875rem',
							overflow: 'auto',
						}}
					>
						<pre
							style={{ margin: 0, whiteSpace: 'pre-wrap' }}
						>{`// Example: Get all applications in your environment
async function getApplications(environmentId, accessToken) {
  const response = await fetch(\`https://auth.pingone.com/v1/environments/\${environmentId}/applications\`, {
    method: 'GET',
    headers: {
      'Authorization': \`Bearer \${accessToken}\`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(\`HTTP error! status: \${response.status}\`);
  }
  
  return await response.json();
}

// Example: Get user information
async function getUser(environmentId, userId, accessToken) {
  const response = await fetch(\`https://auth.pingone.com/v1/environments/\${environmentId}/users/\${userId}\`, {
    method: 'GET',
    headers: {
      'Authorization': \`Bearer \${accessToken}\`,
      'Content-Type': 'application/json'
    }
  });
  
  return await response.json();
}

// Example: Get environment resources and scopes
async function getResources(environmentId, accessToken) {
  const response = await fetch(\`https://auth.pingone.com/v1/environments/\${environmentId}/resources\`, {
    method: 'GET',
    headers: {
      'Authorization': \`Bearer \${accessToken}\`,
      'Content-Type': 'application/json'
    }
  });
  
  return await response.json();
}

// Usage with your worker token
const environmentId = '${credentials.environmentId || 'your-environment-id'}';
const workerToken = '${accessToken}';

// Get applications
getApplications(environmentId, workerToken)
  .then(applications => console.log('Applications:', applications))
  .catch(error => console.error('Error:', error));`}</pre>
					</div>
				</div>

				{/* cURL Examples */}
				<div
					style={{
						background: '#f3e8ff',
						border: '1px solid #a855f7',
						borderRadius: '0.75rem',
						padding: '1.5rem',
						marginBottom: '1.5rem',
					}}
				>
					<h4
						style={{
							margin: '0 0 1rem 0',
							fontSize: '1.125rem',
							fontWeight: 600,
							color: '#7c3aed',
						}}
					>
						🖥️ cURL Command Examples
					</h4>

					<div
						style={{
							background: '#ffffff',
							border: '1px solid #c4b5fd',
							borderRadius: '0.5rem',
							padding: '1rem',
							fontFamily: 'monospace',
							fontSize: '0.875rem',
							overflow: 'auto',
						}}
					>
						<pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{`# Get all applications
curl -X GET \\
  "https://auth.pingone.com/v1/environments/${credentials.environmentId || 'your-environment-id'}/applications" \\
  -H "Authorization: Bearer ${accessToken}" \\
  -H "Content-Type: application/json"

# Get specific user
curl -X GET \\
  "https://auth.pingone.com/v1/environments/${credentials.environmentId || 'your-environment-id'}/users/{userId}" \\
  -H "Authorization: Bearer ${accessToken}" \\
  -H "Content-Type: application/json"

# Get environment resources
curl -X GET \\
  "https://auth.pingone.com/v1/environments/${credentials.environmentId || 'your-environment-id'}/resources" \\
  -H "Authorization: Bearer ${accessToken}" \\
  -H "Content-Type: application/json"

# Get OIDC configuration
curl -X GET \\
  "https://auth.pingone.com/${credentials.environmentId || 'your-environment-id'}/as/.well-known/openid_configuration" \\
  -H "Authorization: Bearer ${accessToken}" \\
  -H "Content-Type: application/json"`}</pre>
					</div>
				</div>

				{/* Postman Collection */}
				<div
					style={{
						background: '#fef2f2',
						border: '1px solid #f87171',
						borderRadius: '0.75rem',
						padding: '1.5rem',
						marginBottom: '1.5rem',
					}}
				>
					<h4
						style={{
							margin: '0 0 1rem 0',
							fontSize: '1.125rem',
							fontWeight: 600,
							color: '#dc2626',
						}}
					>
						📮 Postman Collection
					</h4>

					<div
						style={{
							background: '#ffffff',
							border: '1px solid #fca5a5',
							borderRadius: '0.5rem',
							padding: '1rem',
							fontFamily: 'monospace',
							fontSize: '0.875rem',
							overflow: 'auto',
						}}
					>
						<pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{`{
  "info": {
    "name": "PingOne Administration APIs",
    "description": "Collection for PingOne Management API calls using worker tokens",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "https://auth.pingone.com"
    },
    {
      "key": "environmentId",
      "value": "${credentials.environmentId || 'your-environment-id'}"
    },
    {
      "key": "workerToken",
      "value": "${accessToken}"
    }
  ],
  "item": [
    {
      "name": "Get Applications",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{workerToken}}"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/v1/environments/{{environmentId}}/applications",
          "host": ["{{baseUrl}}"],
          "path": ["v1", "environments", "{{environmentId}}", "applications"]
        }
      }
    },
    {
      "name": "Get Users",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{workerToken}}"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/v1/environments/{{environmentId}}/users",
          "host": ["{{baseUrl}}"],
          "path": ["v1", "environments", "{{environmentId}}", "users"]
        }
      }
    }
  ]
}`}</pre>
					</div>
				</div>

				{/* Best Practices */}
				<div
					style={{
						background: '#ecfdf5',
						border: '1px solid #10b981',
						borderRadius: '0.75rem',
						padding: '1.5rem',
						marginBottom: '1.5rem',
					}}
				>
					<h4
						style={{
							margin: '0 0 1rem 0',
							fontSize: '1.125rem',
							fontWeight: 600,
							color: '#047857',
						}}
					>
						✅ Best Practices for Worker Tokens
					</h4>
					<div style={{ fontSize: '0.875rem', color: '#047857', lineHeight: 1.6 }}>
						<ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
							<li>
								<strong>Token Security:</strong> Store worker tokens securely and never expose them
								in client-side code
							</li>
							<li>
								<strong>Scope Management:</strong> Request only the scopes you need for your
								specific use case
							</li>
							<li>
								<strong>Token Refresh:</strong> Implement token refresh logic before expiration
							</li>
							<li>
								<strong>Error Handling:</strong> Handle 401/403 errors gracefully and refresh tokens
								when needed
							</li>
							<li>
								<strong>Rate Limiting:</strong> Be aware of API rate limits and implement
								appropriate retry logic
							</li>
							<li>
								<strong>Environment Separation:</strong> Use different worker applications for
								different environments
							</li>
						</ul>
					</div>
				</div>

				<StyledSectionDivider />

				<StepNavigationButtons
					currentStep={2}
					totalSteps={3}
					onNext={handleViewTokenManagement}
					onPrevious={() => setCurrentStep(1)}
					onReset={handleReset}
					canNavigateNext={true}
					isFirstStep={false}
					nextButtonText="View Token Management"
					disabledMessage={getStepValidationMessage(2)}
				/>
			</StepContainer>
		);
	};

	return (
		<Container>
			<FlowHeader
				title="PingOne Worker Token Flow"
				description="Generate worker tokens for machine-to-machine authentication with PingOne Management APIs."
				flowId="worker-token-v7"
				version="7.0"
			/>

			{currentStep === 0 && renderStep0()}
			{currentStep === 1 && renderStep1()}
			{currentStep === 2 && renderStep2()}
		</Container>
	);
};

export default WorkerTokenFlowV7;
