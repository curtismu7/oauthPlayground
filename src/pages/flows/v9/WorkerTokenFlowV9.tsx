// src/pages/flows/v9/WorkerTokenFlowV9.tsx
// V9 PingOne Worker Token Flow — Client Credentials grant for machine-to-machine API access

import { FiAlertCircle, FiCheckCircle, FiKey, FiShield } from '@icons';
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import FlowSequenceDisplay from '../../../components/FlowSequenceDisplay';
import {
	ResultsSection as ImportedResultsSection,
	ResultsHeading,
} from '../../../components/ResultsPanel';
import { StepNavigationButtons } from '../../../components/StepNavigationButtons';
import type { StepCredentials } from '../../../components/steps/CommonSteps';
import { usePageScroll } from '../../../hooks/usePageScroll';
import { useWorkerTokenFlowController } from '../../../hooks/useWorkerTokenFlowController';
import ComprehensiveCredentialsService from '../../../services/comprehensiveCredentialsService';
import { FlowHeader } from '../../../services/flowHeaderService';
import { OAuthErrorHandlingService } from '../../../services/oauthErrorHandlingService';
import { oidcDiscoveryService } from '../../../services/oidcDiscoveryService';
import UnifiedTokenDisplayService from '../../../services/unifiedTokenDisplayService';
import { V9CredentialStorageService } from '../../../services/v9/V9CredentialStorageService';
import { workerTokenDiscoveryService } from '../../../services/workerTokenDiscoveryService';
import { checkCredentialsAndWarn } from '../../../utils/credentialsWarningService';
import { getAnyWorkerToken } from '../../../utils/workerTokenDetection';
import type { DiscoveredApp } from '../../../v8/components/AppPickerV8';
import { toastV8 } from '../../../v8/utils/toastNotificationsV8';
import { CompactAppPickerV8U } from '../../../v8u/components/CompactAppPickerV8U';

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

const WorkerTokenFlowV9: React.FC = () => {
	usePageScroll({ pageName: 'WorkerTokenFlowV9', force: true });
	const navigate = useNavigate();

	const controller = useWorkerTokenFlowController({
		flowKey: 'worker-token-v9',
	});

	// Load V9 4-layer credentials on mount (supplements controller's own load)
	// biome-ignore lint/correctness/useExhaustiveDependencies: mount-once
	useEffect(() => {
		checkCredentialsAndWarn(controller.credentials, {
			flowName: 'Worker Token Flow',
			requiredFields: ['environmentId', 'clientId', 'clientSecret'],
			showToast: true,
		});

		const saved = V9CredentialStorageService.loadSync('v9:worker-token');
		if (saved && (saved.clientId || saved.environmentId)) {
			controller.setCredentials({ ...controller.credentials, ...saved });
		}
		V9CredentialStorageService.load('v9:worker-token').then((c) => {
			if (c && (c.clientId || c.environmentId)) {
				controller.setCredentials({ ...controller.credentials, ...c });
			}
		});
	}, []);

	const [currentStep, setCurrentStep] = useState(0);
	const [workerToken, setWorkerToken] = useState(() => getAnyWorkerToken() ?? '');

	// Keep workerToken display in sync with storage
	useEffect(() => {
		const onStorage = () => setWorkerToken(getAnyWorkerToken() ?? '');
		window.addEventListener('storage', onStorage);
		return () => window.removeEventListener('storage', onStorage);
	}, []);

	// App picker callback — update controller + persist to V9 4-layer storage
	const handleWorkerTokenAppSelected = useCallback(
		(app: DiscoveredApp) => {
			const updated = { ...controller.credentials, clientId: app.id };
			controller.setCredentials(updated);
			V9CredentialStorageService.save(
				'v9:worker-token',
				{
					clientId: app.id,
					clientSecret: updated.clientSecret,
					...(updated.environmentId ? { environmentId: updated.environmentId } : {}),
				},
				updated.environmentId ? { environmentId: updated.environmentId } : {}
			);
		},
		[controller]
	);

	// Request worker token
	const handleRequestToken = useCallback(async () => {
		try {
			await controller.requestToken();
			setWorkerToken(getAnyWorkerToken() ?? '');
			toastV8.success('Worker token generated successfully!');
			setCurrentStep(1);
		} catch (_error) {
			const errorDetails = OAuthErrorHandlingService.parseOAuthError(_error, {
				flowType: 'client_credentials',
				stepId: 'request-token',
				operation: 'requestToken',
				credentials: {
					hasClientId: !!controller.credentials.clientId,
					hasClientSecret: !!controller.credentials.clientSecret,
					hasEnvironmentId: !!controller.credentials.environmentId,
				},
			});
			toastV8.error(errorDetails.message);
		}
	}, [controller]);

	// Navigate to token management
	const handleViewTokenManagement = useCallback(() => {
		navigate('/token-management');
	}, [navigate]);

	// Full reset
	const handleReset = useCallback(() => {
		try {
			controller.resetFlow();
			setCurrentStep(0);
			setWorkerToken('');
			try {
				localStorage.removeItem('worker_token');
			} catch {
				// non-fatal
			}
			toastV8.success('Worker Token Flow reset successfully');
		} catch {
			toastV8.error('Failed to reset flow. Please refresh the page.');
		}
	}, [controller]);

	// Step 0 — Credentials
	const renderStep0 = () => (
		<StepContainer>
			<StepTitle>
				<FiKey /> Configure Worker Token Credentials
			</StepTitle>
			<StyledHelperText>
				Configure your PingOne environment and worker application credentials. Worker tokens are
				used for machine-to-machine authentication with PingOne Management APIs.
			</StyledHelperText>

			<CompactAppPickerV8U
				environmentId={controller.credentials.environmentId ?? ''}
				onAppSelected={handleWorkerTokenAppSelected}
			/>

			<ComprehensiveCredentialsService
				flowType="worker-token-v9"
				environmentId={controller.credentials.environmentId || ''}
				clientId={controller.credentials.clientId || ''}
				clientSecret={controller.credentials.clientSecret || ''}
				scopes={controller.credentials.scopes || ''}
				onEnvironmentIdChange={(value) => {
					const updated = { ...controller.credentials, environmentId: value };
					controller.setCredentials(updated);
					V9CredentialStorageService.save('v9:worker-token', { ...updated } as StepCredentials, {
						environmentId: value,
					});
				}}
				onClientIdChange={(value) => {
					const updated = { ...controller.credentials, clientId: value };
					controller.setCredentials(updated as StepCredentials);
					V9CredentialStorageService.save(
						'v9:worker-token',
						{ ...updated } as StepCredentials,
						updated.environmentId ? { environmentId: updated.environmentId } : {}
					);
				}}
				onClientSecretChange={(value) => {
					const updated = { ...controller.credentials, clientSecret: value };
					controller.setCredentials(updated as StepCredentials);
					V9CredentialStorageService.save(
						'v9:worker-token',
						{ ...updated } as StepCredentials,
						updated.environmentId ? { environmentId: updated.environmentId } : {}
					);
				}}
				onScopesChange={(value) => {
					const updated = { ...controller.credentials, scopes: value, scope: value };
					controller.setCredentials(updated);
				}}
				onSave={async () => {
					try {
						await controller.saveCredentials();
						V9CredentialStorageService.save(
							'v9:worker-token',
							{ ...controller.credentials } as StepCredentials,
							controller.credentials.environmentId
								? { environmentId: controller.credentials.environmentId }
								: {}
						);
						toastV8.success('Credentials saved successfully!');
					} catch (_error) {
						const errorDetails = OAuthErrorHandlingService.parseOAuthError(_error, {
							flowType: 'client_credentials',
							stepId: 'save-credentials',
							operation: 'saveCredentials',
							credentials: {
								hasClientId: !!controller.credentials.clientId,
								hasClientSecret: !!controller.credentials.clientSecret,
								hasEnvironmentId: !!controller.credentials.environmentId,
							},
						});
						toastV8.error(errorDetails.message);
					}
				}}
				onDiscoveryComplete={async (result) => {
					if (result.issuerUrl) {
						const extractedEnvId = oidcDiscoveryService.extractEnvironmentId(result.issuerUrl);
						if (extractedEnvId) {
							const updated = { ...controller.credentials, environmentId: extractedEnvId };
							controller.setCredentials(updated);
						}
					}

					if (result.document?.issuer) {
						try {
							const envId = oidcDiscoveryService.extractEnvironmentId(result.document.issuer);
							if (envId) {
								const comprehensiveResult = await workerTokenDiscoveryService.discover({
									environmentId: envId,
									region: 'us',
									clientId: controller.credentials.clientId,
									clientSecret: controller.credentials.clientSecret,
									timeout: 15000,
									enableCaching: true,
								});

								if (comprehensiveResult.success) {
									const updatedCredentials = {
										...controller.credentials,
										environmentId: comprehensiveResult.environmentId || envId,
										tokenEndpoint: comprehensiveResult.tokenEndpoint,
										introspectionEndpoint: comprehensiveResult.introspectionEndpoint,
										userInfoEndpoint: comprehensiveResult.userInfoEndpoint,
										scopes: comprehensiveResult.scopes?.join(' ') || controller.credentials.scopes,
									};
									controller.setCredentials(updatedCredentials as StepCredentials);
									if (updatedCredentials.environmentId && updatedCredentials.clientId) {
										await controller.saveCredentials();
										V9CredentialStorageService.save(
											'v9:worker-token',
											{ ...updatedCredentials } as StepCredentials,
											{ environmentId: updatedCredentials.environmentId }
										);
										toastV8.success('Credentials auto-saved after OIDC discovery');
									}
								}
							}
						} catch {
							// discovery errors are non-fatal
						}
					}
				}}
				requireClientSecret={true}
				showRedirectUri={false}
				showPostLogoutRedirectUri={false}
				showLoginHint={false}
				showAdvancedConfig={false}
				defaultCollapsed={false}
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

	// Step 1 — Token display
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
						{UnifiedTokenDisplayService.showTokens(tokens as never, 'oauth', 'worker-token-v9', {
							showCopyButtons: true,
							showDecodeButtons: true,
						})}
					</TokenSection>
				)}

				<StyledSectionDivider />
				<ImportedResultsSection>
					<ResultsHeading>
						<FiAlertCircle size={18} /> Configuration Management
					</ResultsHeading>
					<StyledHelperText>
						To use Config Checker features (Check Config, Create App, Get New Worker Token), return
						to Step 0 where these tools are integrated into the credentials section.
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
					onReset={handleReset}
					canNavigateNext={true}
					isFirstStep={false}
					nextButtonText="Learn API Usage"
				/>
			</StepContainer>
		);
	};

	// Step 2 — API usage guide
	const renderStep2 = () => {
		const tokens = controller.tokens;
		const accessToken = tokens?.access_token || '';
		const envId = controller.credentials.environmentId || 'your-environment-id';

		return (
			<StepContainer>
				<StepTitle>
					<FiShield /> Using Worker Tokens with PingOne Administration APIs
				</StepTitle>
				<StyledHelperText>
					Learn how to use your worker token to make authenticated calls to PingOne Management APIs
					for administrative operations.
				</StyledHelperText>

				{/* Administration API Overview */}
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

				{/* Common API Calls */}
				<div
					style={{
						background: '#eff6ff',
						border: '1px solid #93c5fd',
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
							color: '#1e40af',
						}}
					>
						🔧 Common Administration API Calls
					</h4>

					{[
						{
							icon: '📱',
							label: 'Get Applications',
							path: `/v1/environments/{environmentId}/applications`,
						},
						{ icon: '👥', label: 'Get Users', path: `/v1/environments/{environmentId}/users` },
						{
							icon: '🔐',
							label: 'Get Resources & Scopes',
							path: `/v1/environments/{environmentId}/resources`,
						},
					].map(({ icon, label, path }) => (
						<div key={label} style={{ marginBottom: '1rem' }}>
							<h5
								style={{
									margin: '0 0 0.5rem 0',
									fontSize: '1rem',
									fontWeight: 600,
									color: '#1e40af',
								}}
							>
								{icon} {label}
							</h5>
							<div
								style={{
									background: '#ffffff',
									border: '1px solid #dbeafe',
									borderRadius: '0.5rem',
									padding: '1rem',
									fontFamily: 'monospace',
									fontSize: '0.875rem',
								}}
							>
								<div style={{ color: '#2563eb', marginBottom: '0.5rem' }}>GET {path}</div>
								<div style={{ color: '#6b7280' }}>
									Authorization: Bearer{' '}
									{accessToken ? `${accessToken.substring(0, 20)}...` : '<your-worker-token>'}
								</div>
							</div>
						</div>
					))}
				</div>

				{/* JavaScript examples */}
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
						>{`async function getApplications(environmentId, accessToken) {
  const response = await fetch(
    \`https://auth.pingone.com/v1/environments/\${environmentId}/applications\`,
    { headers: { Authorization: \`Bearer \${accessToken}\` } }
  );
  if (!response.ok) throw new Error(\`HTTP \${response.status}\`);
  return response.json();
}

// Usage
getApplications('${envId}', '${accessToken || '<worker-token>'}')
  .then(apps => console.log('Applications:', apps))
  .catch(err => console.error('Error:', err));`}</pre>
					</div>
				</div>

				{/* cURL examples */}
				<div
					style={{
						background: '#f3e8ff',
						border: '1px solid #93c5fd',
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
							color: '#1e40af',
						}}
					>
						🖥️ cURL Examples
					</h4>
					<div
						style={{
							background: '#ffffff',
							border: '1px solid #bfdbfe',
							borderRadius: '0.5rem',
							padding: '1rem',
							fontFamily: 'monospace',
							fontSize: '0.875rem',
							overflow: 'auto',
						}}
					>
						<pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{`# Get all applications
curl -X GET \\
  "https://auth.pingone.com/v1/environments/${envId}/applications" \\
  -H "Authorization: Bearer ${accessToken || '<worker-token>'}"

# Get users
curl -X GET \\
  "https://auth.pingone.com/v1/environments/${envId}/users" \\
  -H "Authorization: Bearer ${accessToken || '<worker-token>'}"

# Get OIDC configuration
curl -X GET \\
  "https://auth.pingone.com/${envId}/as/.well-known/openid_configuration"`}</pre>
					</div>
				</div>

				{/* Best Practices */}
				<div
					style={{
						background: '#eff6ff',
						border: '1px solid #93c5fd',
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
							color: '#1e40af',
						}}
					>
						✅ Best Practices for Worker Tokens
					</h4>
					<ul
						style={{
							fontSize: '0.875rem',
							color: '#1e3a8a',
							lineHeight: 1.6,
							margin: 0,
							paddingLeft: '1.5rem',
						}}
					>
						<li>
							<strong>Token Security:</strong> Store worker tokens securely — never expose in
							client-side code
						</li>
						<li>
							<strong>Scope Management:</strong> Request only the scopes needed for your use case
						</li>
						<li>
							<strong>Token Refresh:</strong> Implement refresh logic before expiration
						</li>
						<li>
							<strong>Error Handling:</strong> Handle 401/403 errors and refresh tokens as needed
						</li>
						<li>
							<strong>Rate Limiting:</strong> Implement retry logic with exponential backoff
						</li>
						<li>
							<strong>Environment Separation:</strong> Use distinct worker applications per
							environment
						</li>
					</ul>
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
				/>
			</StepContainer>
		);
	};

	return (
		<Container>
			<FlowHeader flowId="worker-token-v9" />

			{currentStep === 0 && renderStep0()}
			{currentStep === 1 && renderStep1()}
			{currentStep === 2 && renderStep2()}
		</Container>
	);
};

export default WorkerTokenFlowV9;
