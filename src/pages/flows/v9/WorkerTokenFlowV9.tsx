import { V9_COLORS } from '../../../services/v9/V9ColorStandards';
import { createModuleLogger } from '../../../utils/consoleMigrationHelper';

const log = createModuleLogger('pages/flows/v9/WorkerTokenFlowV9.tsx');
// src/pages/flows/v9/WorkerTokenFlowV9.tsx
// V9 PingOne Worker Token Flow — Client Credentials grant for machine-to-machine API access

import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { modernMessaging } from '@/services/v9/V9ModernMessagingService';
import FlowSequenceDisplay from '../../../components/FlowSequenceDisplay';
import {
	ResultsSection as ImportedResultsSection,
	ResultsHeading,
} from '../../../components/ResultsPanel';
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
	color: V9_COLORS.TEXT.BLACK;
	display: flex;
	align-items: center;
	gap: 12px;
`;

const StyledHelperText = styled.p`
	color: V9_COLORS.TEXT.GRAY_MEDIUM;
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
	background: V9_COLORS.TEXT.GRAY_LIGHTER;
	margin: 24px 0;
`;

const WorkerTokenFlowV9: React.FC = () => {
	usePageScroll({ pageName: 'WorkerTokenFlowV9', force: true });
	const _navigate = useNavigate();

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

	const [currentStep, _setCurrentStep] = useState(0);
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

	// Step 0 — Credentials
	const renderStep0 = () => (
		<StepContainer>
			<StepTitle>
				🔑 Configure Worker Token Credentials
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
						modernMessaging.showFooterMessage({
							type: 'info',
							message: 'Credentials saved successfully!',
							duration: 3000,
						});
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
						modernMessaging.showBanner({
							type: 'error',
							title: 'Error',
							message: errorDetails.message,
							dismissible: true,
						});
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
										environmentId: comprehensiveResult.data.environmentId || envId,
										tokenEndpoint: comprehensiveResult.data.tokenEndpoint,
										introspectionEndpoint: comprehensiveResult.data.introspectionEndpoint,
										userInfoEndpoint: comprehensiveResult.data.userInfoEndpoint,
										scopes:
											comprehensiveResult.data.scopes?.join(' ') || controller.credentials.scopes,
									};
									controller.setCredentials(updatedCredentials as StepCredentials);
									if (updatedCredentials.environmentId && updatedCredentials.clientId) {
										await controller.saveCredentials();
										V9CredentialStorageService.save(
											'v9:worker-token',
											{ ...updatedCredentials } as StepCredentials,
											{ environmentId: updatedCredentials.environmentId }
										);
										modernMessaging.showFooterMessage({
											type: 'info',
											message: 'Credentials auto-saved after OIDC discovery',
											duration: 3000,
										});
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
		</StepContainer>
	);

	// Step 1 — Token display
	const renderStep1 = () => {
		const tokens = controller.tokens;

		return (
			<StepContainer>
				<StepTitle>
					✅ Worker Token Generated
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
						⚠️ Configuration Management
					</ResultsHeading>
					<StyledHelperText>
						To use Config Checker features (Check Config, Create App, Get New Worker Token), return
						to Step 0 where these tools are integrated into the credentials section.
					</StyledHelperText>
				</ImportedResultsSection>

				<StyledSectionDivider />

				<FlowSequenceDisplay flowType="worker-token" />

				<StyledSectionDivider />
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
					🛡️ Using Worker Tokens with PingOne Administration APIs
				</StepTitle>
				<StyledHelperText>
					Learn how to use your worker token to make authenticated calls to PingOne Management APIs
					for administrative operations.
				</StyledHelperText>

				{/* Administration API Overview */}
				<div
					style={{
						background: 'V9_COLORS.BG.GRAY_LIGHT',
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
							color: 'V9_COLORS.TEXT.GRAY_DARK',
						}}
					>
						🏢 PingOne Administration APIs
					</h4>
					<div style={{ fontSize: '0.875rem', color: 'V9_COLORS.TEXT.GRAY_DARK', lineHeight: 1.6 }}>
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
						background: 'V9_COLORS.BG.GRAY_LIGHT',
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
							color: 'V9_COLORS.PRIMARY.BLUE_DARK',
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
									color: 'V9_COLORS.PRIMARY.BLUE_DARK',
								}}
							>
								{icon} {label}
							</h5>
							<div
								style={{
									background: 'V9_COLORS.TEXT.WHITE',
									border: '1px solid #dbeafe',
									borderRadius: '0.5rem',
									padding: '1rem',
									fontFamily: 'monospace',
									fontSize: '0.875rem',
								}}
							>
								<div style={{ color: 'V9_COLORS.PRIMARY.BLUE_DARK', marginBottom: '0.5rem' }}>GET {path}</div>
								<div style={{ color: 'V9_COLORS.TEXT.GRAY_MEDIUM' }}>
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
						background: 'V9_COLORS.BG.WARNING',
						border: '1px solid V9_COLORS.PRIMARY.YELLOW',
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
							color: 'V9_COLORS.PRIMARY.YELLOW_DARK',
						}}
					>
						💻 JavaScript Code Examples
					</h4>
					<div
						style={{
							background: 'V9_COLORS.TEXT.WHITE',
							border: '1px solid V9_COLORS.PRIMARY.YELLOW_LIGHT',
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
	  .then(apps => log.info('WorkerTokenFlowV9', 'Applications:', apps))
	  .catch(err => log.error('WorkerTokenFlowV9', 'Error:', err));`}</pre>
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
							color: 'V9_COLORS.PRIMARY.BLUE_DARK',
						}}
					>
						🖥️ cURL Examples
					</h4>
					<div
						style={{
							background: 'V9_COLORS.TEXT.WHITE',
							border: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
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
						background: 'V9_COLORS.BG.GRAY_LIGHT',
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
							color: 'V9_COLORS.PRIMARY.BLUE_DARK',
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
