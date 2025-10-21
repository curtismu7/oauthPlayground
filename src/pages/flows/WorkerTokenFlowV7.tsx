// src/pages/flows/WorkerTokenFlowV7.tsx
// V7 PingOne Worker Token Flow with ComprehensiveCredentialsService

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FiCheckCircle, FiCopy, FiKey, FiSettings, FiShield } from 'react-icons/fi';
import { usePageScroll } from '../../hooks/usePageScroll';
import { useWorkerTokenFlowController } from '../../hooks/useWorkerTokenFlowController';
import { FlowHeader } from '../../services/flowHeaderService';
import ComprehensiveCredentialsService from '../../services/comprehensiveCredentialsService';
import { v4ToastManager } from '../../utils/v4ToastMessages';
import { oidcDiscoveryService } from '../../services/oidcDiscoveryService';
import { workerTokenDiscoveryService } from '../../services/workerTokenDiscoveryService';
import { OAuthErrorHandlingService } from '../../services/oauthErrorHandlingService';
import { StepNavigationButtons } from '../../components/StepNavigationButtons';
import FlowSequenceDisplay from '../../components/FlowSequenceDisplay';
import UnifiedTokenDisplayService from '../../services/unifiedTokenDisplayService';

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

const HelperText = styled.p`
	color: #64748b;
	font-size: 14px;
	line-height: 1.6;
	margin-bottom: 20px;
`;

const TokenSection = styled.div`
	margin-top: 24px;
`;

const SectionDivider = styled.div`
	height: 1px;
	background: #e2e8f0;
	margin: 24px 0;
`;

const WorkerTokenFlowV7: React.FC = () => {
	usePageScroll({ pageName: 'WorkerTokenFlowV7', force: true });
	const navigate = useNavigate();

	// Initialize controller with default scopes for worker tokens
	const controller = useWorkerTokenFlowController({
		flowKey: 'worker-token-v7',
		defaultFlowVariant: 'worker',
	});

	// Local state for credentials
	const [credentials, setCredentials] = useState(controller.credentials);
	const [currentStep, setCurrentStep] = useState(0);
	const [errorDetails, setErrorDetails] = useState<any>(null);
	const [workerToken, setWorkerToken] = useState(localStorage.getItem('worker_token') || '');

	// Sync credentials with controller
	useEffect(() => {
		console.log('[WorkerToken V7] Controller credentials updated:', controller.credentials);
		setCredentials(controller.credentials);
	}, [controller.credentials]);

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

	// Step content renderers
	const renderStep0 = () => (
		<StepContainer>
			<StepTitle>
				<FiKey /> Configure Worker Token Credentials
			</StepTitle>
			<HelperText>
				Configure your PingOne environment and worker application credentials. Worker tokens are used for machine-to-machine authentication with PingOne Management APIs.
			</HelperText>

			<ComprehensiveCredentialsService
				flowType="worker-token-v7"
				
				// Credentials
				environmentId={credentials.environmentId || ''}
				clientId={credentials.clientId || ''}
				clientSecret={credentials.clientSecret || ''}
				scopes={credentials.scopes || ''}
				
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
					console.log('[WorkerToken V7] OIDC Discovery completed:', result);
					
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
									console.log('[WorkerToken V7] Comprehensive discovery successful:', comprehensiveResult);
									
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
										v4ToastManager.showSuccess('Credentials auto-saved after comprehensive OIDC discovery');
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
				
				// Worker token
				workerToken={workerToken}
				showConfigChecker={false}
			/>

			<SectionDivider />

			<StepNavigationButtons
				currentStep={0}
				totalSteps={2}
				onNext={handleRequestToken}
				onPrevious={() => {}}
				canGoNext={!!(credentials.environmentId && credentials.clientId && credentials.clientSecret)}
				canGoPrevious={false}
				isFirstStep={true}
				isLastStep={false}
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
				<HelperText>
					Your PingOne worker token has been successfully generated. Use this token to authenticate with PingOne Management APIs.
				</HelperText>

				{tokens && (
					<TokenSection>
						{UnifiedTokenDisplayService.showTokens(
							tokens,
							'oauth',
							'worker-token-v7',
							{
								showCopyButtons: true,
								showDecodeButtons: true,
								showIntrospection: false,
								title: '🔑 Worker Access Token'
							}
						)}
					</TokenSection>
				)}

				<SectionDivider />

				<FlowSequenceDisplay
					steps={[
						{ id: 'credentials', title: 'Configure Credentials', status: 'completed' },
						{ id: 'token-request', title: 'Request Token', status: 'completed' },
						{ id: 'token-issued', title: 'Token Issued', status: 'completed' },
					]}
				/>

				<SectionDivider />

				<StepNavigationButtons
					currentStep={1}
					totalSteps={2}
					onNext={handleViewTokenManagement}
					onPrevious={() => setCurrentStep(0)}
					canGoNext={true}
					canGoPrevious={true}
					isFirstStep={false}
					isLastStep={true}
					nextLabel="View Token Management"
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
		</Container>
	);
};

export default WorkerTokenFlowV7;
