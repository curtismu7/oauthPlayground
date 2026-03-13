// src/pages/flows/v9/WorkerTokenFlowV9.tsx
// V9 PingOne Worker Token Flow — Client Credentials grant for machine-to-machine API access

import type React from 'react';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { modernMessaging } from '@/services/v9/V9ModernMessagingService';
import FlowSequenceDisplay from '../../../components/FlowSequenceDisplay';
import {
	ResultsSection as ImportedResultsSection,
	ResultsHeading,
} from '../../../components/ResultsPanel';
import type { StepCredentials } from '../../../components/steps/CommonSteps';
import WorkerTokenModalV9 from '../../../components/WorkerTokenModalV9';
import { usePageScroll } from '../../../hooks/usePageScroll';
import { useWorkerTokenFlowController } from '../../../hooks/useWorkerTokenFlowController';
import ComprehensiveCredentialsService from '../../../services/comprehensiveCredentialsService';
import { environmentIdPersistenceService } from '../../../services/environmentIdPersistenceService';
import { FlowHeader } from '../../../services/flowHeaderService';
import { OAuthErrorHandlingService } from '../../../services/oauthErrorHandlingService';
import { oidcDiscoveryService } from '../../../services/oidcDiscoveryService';
import UnifiedTokenDisplayService from '../../../services/unifiedTokenDisplayService';
import { unifiedWorkerTokenService } from '../../../services/unifiedWorkerTokenService';
import { V9_COLORS } from '../../../services/v9/V9ColorStandards';
import { V9CredentialStorageService } from '../../../services/v9/V9CredentialStorageService';
import { workerTokenDiscoveryService } from '../../../services/workerTokenDiscoveryService';
import WorkerTokenStatusDisplayV8 from '../../../v8/components/WorkerTokenStatusDisplayV8';

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
	color: ${V9_COLORS.PRIMARY.BLUE};
	display: flex;
	align-items: center;
	gap: 12px;
`;

const StyledHelperText = styled.p`
	color: ${V9_COLORS.TEXT.GRAY_MEDIUM};
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
	background: ${V9_COLORS.TEXT.GRAY_LIGHTER};
	margin: 24px 0;
`;

/** Flow-type label so users know which PingOne app to use (e.g. Worker Token, Authorization Code, CIBA). */
const FlowTypeLabel = styled.div`
	padding: 0.75rem 1rem;
	background: #eff6ff;
	border: 1px solid #93c5fd;
	border-radius: 0.5rem;
	margin-bottom: 1rem;
	font-size: 0.875rem;
	line-height: 1.5;
`;
const FlowTypeLabelTitle = styled.div`
	font-weight: 700;
	color: ${V9_COLORS.PRIMARY.BLUE};
	margin-bottom: 0.25rem;
`;
const FlowTypeLabelSub = styled.div`
	color: #1e40af;
`;

const WorkerTokenFlowV9: React.FC = () => {
	usePageScroll({ pageName: 'WorkerTokenFlowV9', force: true });

	const controller = useWorkerTokenFlowController({
		flowKey: 'worker-token-v9',
	});

	// Load credentials on mount: V9 storage, then default environment ID from unified worker token or persistence (user should not have to enter env ID)
	// biome-ignore lint/correctness/useExhaustiveDependencies: mount-once
	useEffect(() => {
		const applyDefaults = (envId: string | null) => {
			if (!envId?.trim()) return;
			const current = controller.credentials.environmentId?.trim();
			if (current) return;
			controller.setCredentials({ ...controller.credentials, environmentId: envId });
			V9CredentialStorageService.save(
				'v9:worker-token',
				{ environmentId: envId } as StepCredentials,
				{
					environmentId: envId,
				}
			);
		};

		// Do not show credentials warning on mount: saved credentials load async and env ID is defaulted.
		// Validation happens when the user opens Get Worker Token or tries to generate a token.
		const saved = V9CredentialStorageService.loadSync('v9:worker-token');
		if (saved && (saved.clientId || saved.environmentId)) {
			controller.setCredentials({ ...controller.credentials, ...saved });
		}
		V9CredentialStorageService.load('v9:worker-token').then((c) => {
			if (c && (c.clientId || c.environmentId)) {
				controller.setCredentials({ ...controller.credentials, ...c });
			}
			// If loaded credentials had no environment ID, use default from persistence
			if (!c?.environmentId?.trim()) {
				const persisted = environmentIdPersistenceService.loadEnvironmentId();
				applyDefaults(persisted ?? null);
			}
		});

		unifiedWorkerTokenService.loadCredentials().then((result) => {
			if (!result.success || !result.data?.environmentId) return;
			// Apply unified worker token env ID as default only when current credentials still have none
			const current = controller.credentials.environmentId?.trim();
			if (!current) applyDefaults(result.data.environmentId);
		});
	}, []);

	const [currentStep] = useState(0);
	// Use unified worker token service (modal/service) as single source of truth — not getAnyWorkerToken (legacy/multi-key detection)
	const [workerToken, setWorkerToken] = useState(
		() => unifiedWorkerTokenService.getTokenDataSync()?.token ?? ''
	);
	const [showWorkerTokenModal, setShowWorkerTokenModal] = useState(false);

	// Keep workerToken display in sync with unified worker token service (real flow, not mock)
	useEffect(() => {
		const syncFromService = () =>
			setWorkerToken(unifiedWorkerTokenService.getTokenDataSync()?.token ?? '');
		window.addEventListener('storage', syncFromService);
		window.addEventListener('workerTokenUpdated', syncFromService);
		return () => {
			window.removeEventListener('storage', syncFromService);
			window.removeEventListener('workerTokenUpdated', syncFromService);
		};
	}, []);

	// Worker Token section — Get Worker Token button + status display (same pattern as Unified OAuth page)
	const renderWorkerTokenSection = () => (
		<StepContainer>
			<StepTitle>🔑 Get Worker Token</StepTitle>
			<StyledHelperText>
				Generate or manage your worker token for PingOne Management API access. Use the button below
				to open the worker token modal, then use the credentials section to configure environment
				and app.
			</StyledHelperText>
			<div style={{ marginBottom: '20px' }}>
				<button
					type="button"
					onClick={() => setShowWorkerTokenModal(true)}
					style={{
						padding: '10px 20px',
						border: 'none',
						borderRadius: '8px',
						background: `linear-gradient(135deg, ${V9_COLORS.PRIMARY.BLUE} 0%, ${V9_COLORS.PRIMARY.BLUE_DARK} 100%)`,
						color: 'white',
						cursor: 'pointer',
						fontWeight: 600,
						fontSize: '14px',
						display: 'inline-flex',
						alignItems: 'center',
						gap: '8px',
					}}
				>
					<span>🔑</span>
					<span>Get Worker Token</span>
				</button>
			</div>
			<WorkerTokenStatusDisplayV8 mode="detailed" showRefresh={true} />
		</StepContainer>
	);

	// Step 0 — Credentials (app picker + credentials form). Environment ID is defaulted; user can enter Issuer URL or provider.
	const defaultEnvId = controller.credentials.environmentId?.trim() ?? '';
	const discoveryInitialValue =
		controller.credentials.issuerUrl?.trim() ||
		(defaultEnvId ? `https://auth.pingone.com/${defaultEnvId}/as` : '');

	const renderStep0 = () => (
		<StepContainer>
			<StepTitle>🔑 Configure Worker Token Credentials</StepTitle>

			<FlowTypeLabel>
				<FlowTypeLabelTitle>Worker Token (Client Credentials)</FlowTypeLabelTitle>
				<FlowTypeLabelSub>
					Use credentials from your <strong>PingOne Management API / Worker app</strong>. In
					PingOne: go to Applications → your M2M or API application used for Management API access.
					Use <strong>App lookup</strong> below to discover apps and apply Client ID and Secret
					without leaving this page.
				</FlowTypeLabelSub>
			</FlowTypeLabel>

			<StyledHelperText>
				Environment ID is used by default from your saved worker token or last-used environment. You
				do not need to enter it unless you want a different one. Optionally enter an{' '}
				<strong>Issuer URL</strong> or <strong>provider</strong> in the discovery field below to use
				a different environment.
			</StyledHelperText>

			<ComprehensiveCredentialsService
				flowType="worker-token-v9"
				title="Worker Token credentials"
				subtitle="Client ID and Secret from your PingOne Worker / Management API app. Use App lookup above to discover and apply."
				environmentId={defaultEnvId}
				initialDiscoveryInput={discoveryInitialValue}
				discoveryPlaceholder="Optional: enter Issuer URL or provider to use instead of default environment"
				clientId={controller.credentials.clientId || ''}
				clientSecret={controller.credentials.clientSecret || ''}
				scopes={controller.credentials.scopes || ''}
				showConfigChecker={true}
				workerToken={workerToken}
				appLookupSectionTitle="App lookup – Worker Token"
				appLookupSectionSubtitle="Discover apps from PingOne and apply Client ID + Secret to this section (no need to open PingOne)."
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
				<StepTitle>✅ Worker Token Generated</StepTitle>
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
					<ResultsHeading>⚠️ Configuration Management</ResultsHeading>
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
				<StepTitle>🛡️ Using Worker Tokens with PingOne Administration APIs</StepTitle>
				<StyledHelperText>
					Learn how to use your worker token to make authenticated calls to PingOne Management APIs
					for administrative operations.
				</StyledHelperText>

				{/* Administration API Overview */}
				<div
					style={{
						background: '#f8fafc',
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
							color: '#1f2937',
						}}
					>
						🏢 PingOne Administration APIs
					</h4>
					<div style={{ fontSize: '0.875rem', color: '#1f2937', lineHeight: 1.6 }}>
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
						background: '#f8fafc',
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
							color: '#2563eb',
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
									color: '#2563eb',
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
						border: `1px solid ${V9_COLORS.PRIMARY.YELLOW}`,
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
							color: '#d97706',
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
	  .then(apps => logger.info('WorkerTokenFlowV9', 'Applications:', apps))
	  .catch(err => logger.error('WorkerTokenFlowV9', 'Error:', err));`}</pre>
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
							color: '#2563eb',
						}}
					>
						🖥️ cURL Examples
					</h4>
					<div
						style={{
							background: '#ffffff',
							border: `1px solid ${V9_COLORS.TEXT.GRAY_LIGHTER}`,
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
						background: '#f8fafc',
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
							color: '#2563eb',
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

			{/* Get Worker Token display — button + status */}
			{renderWorkerTokenSection()}

			{currentStep === 0 && renderStep0()}
			{currentStep === 1 && renderStep1()}
			{currentStep === 2 && renderStep2()}

			<WorkerTokenModalV9
				isOpen={showWorkerTokenModal}
				onClose={() => setShowWorkerTokenModal(false)}
				onTokenGenerated={() => {
					setWorkerToken(unifiedWorkerTokenService.getTokenDataSync()?.token ?? '');
					window.dispatchEvent(new Event('workerTokenUpdated'));
				}}
			/>
		</Container>
	);
};

export default WorkerTokenFlowV9;
