import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { CredentialsInput } from '../../components/CredentialsInput';
import { EnhancedApiCallDisplay } from '../../components/EnhancedApiCallDisplay';
import EnhancedFlowInfoCard from '../../components/EnhancedFlowInfoCard';
import EnhancedFlowWalkthrough from '../../components/EnhancedFlowWalkthrough';
import EnvironmentIdInput from '../../components/EnvironmentIdInput';
import FlowConfigurationRequirements from '../../components/FlowConfigurationRequirements';
import FlowSequenceDisplay from '../../components/FlowSequenceDisplay';
import { ExplanationHeading, ExplanationSection } from '../../components/InfoBlocks';
import {
	HelperText,
	ResultsHeading,
	ResultsSection,
	SectionDivider,
} from '../../components/ResultsPanel';
import SecurityFeaturesDemo from '../../components/SecurityFeaturesDemo';
import { StepNavigationButtons } from '../../components/StepNavigationButtons';
import TokenIntrospect from '../../components/TokenIntrospect';
import useCibaFlow, { CibaAuthRequest, CibaConfig } from '../../hooks/useCibaFlow';
import { usePageScroll } from '../../hooks/usePageScroll';
import {
	FiAlertCircle,
	FiCopy,
	FiInfo,
	FiRefreshCw,
	FiSmartphone,
	FiZap,
} from '../../services/commonImportsService';
import { EnhancedApiCallDisplayService } from '../../services/enhancedApiCallDisplayService';
import { FlowHeader } from '../../services/flowHeaderService';
import { oidcDiscoveryService } from '../../services/oidcDiscoveryService';
import {
	IntrospectionApiCallData,
	TokenIntrospectionService,
} from '../../services/tokenIntrospectionService';
import { credentialManager } from '../../utils/credentialManager';
import { storeFlowNavigationState } from '../../utils/flowNavigation';
import { v4ToastManager } from '../../utils/v4ToastMessages';

const Container = styled.div`
	min-height: 100vh;
	background: var(--app-background, #f8fafb);
	padding: clamp(1.5rem, 4vw, 3rem) 0 6rem;
`;

const Content = styled.div`
	max-width: 64rem;
	margin: 0 auto;
	padding: 0 clamp(1rem, 3vw, 1.5rem);
	display: grid;
	gap: clamp(1.5rem, 3vw, 2.5rem);
`;

const StepCard = styled.section`
	background: var(--surface-color, #ffffff);
	border-radius: 1rem;
	border: 1px solid var(--border-subtle, #e5e7eb);
	box-shadow: 0 20px 45px rgba(15, 23, 42, 0.08);
	overflow: hidden;
`;

const StepHeader = styled.header`
	padding: clamp(1.5rem, 3vw, 2rem);
	background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
	color: #ffffff;
	display: grid;
	gap: 0.75rem;
`;

const StepBadge = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	border-radius: 999px;
	padding: 0.375rem 0.9rem;
	background: rgba(255, 255, 255, 0.16);
	border: 1px solid rgba(255, 255, 255, 0.3);
	font-size: 0.75rem;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.06em;
`;

const StepTitle = styled.h2`
	margin: 0;
	font-size: clamp(1.3rem, 2.6vw, 1.6rem);
	font-weight: 700;
	letter-spacing: -0.01em;
`;

const StepSubtitle = styled.p`
	margin: 0;
	font-size: clamp(0.95rem, 2.2vw, 1.05rem);
	opacity: 0.9;
	line-height: 1.6;
`;

const StepBody = styled.div`
	padding: clamp(1.5rem, 3vw, 2rem);
	display: grid;
	gap: clamp(1.25rem, 3vw, 2rem);
`;

const InlineNotice = styled.div`
	display: flex;
	align-items: flex-start;
	gap: 0.75rem;
	padding: 1rem 1.25rem;
	border-radius: 0.75rem;
	border: 1px solid rgba(13, 148, 136, 0.2);
	background: rgba(13, 148, 136, 0.08);
	color: #0f766e;
	font-size: 0.95rem;
`;

const PollingStatus = styled.div<{ $variant: 'idle' | 'polling' | 'success' | 'error' }>`
	display: grid;
	gap: 0.5rem;
	padding: 1rem 1.25rem;
	border-radius: 0.75rem;
	border: 1px solid
		${({ $variant }) =>
			$variant === 'success'
				? 'rgba(34, 197, 94, 0.25)'
				: $variant === 'error'
					? 'rgba(239, 68, 68, 0.25)'
					: $variant === 'polling'
						? 'rgba(59, 130, 246, 0.25)'
						: 'rgba(148, 163, 184, 0.25)'};
	background: ${({ $variant }) =>
		$variant === 'success'
			? 'rgba(34, 197, 94, 0.1)'
			: $variant === 'error'
				? 'rgba(239, 68, 68, 0.12)'
				: $variant === 'polling'
					? 'rgba(59, 130, 246, 0.1)'
					: 'rgba(148, 163, 184, 0.1)'};
`;

const PollingActions = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 0.75rem;
`;

const ControlButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
	border-radius: 0.65rem;
	padding: 0.65rem 1.2rem;
	font-size: 0.95rem;
	font-weight: 600;
	border: 1px solid
		${({ $variant }) =>
			$variant === 'primary'
				? 'var(--primary-color, #0d9488)'
				: $variant === 'danger'
					? '#dc2626'
					: 'rgba(148, 163, 184, 0.5)'};
	background:
		${({ $variant }) =>
			$variant === 'primary'
				? 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)'
				: $variant === 'danger'
					? 'rgba(220, 38, 38, 0.1)'
					: 'rgba(148, 163, 184, 0.12)'};
	color: ${({ $variant }) => ($variant === 'primary' ? '#ffffff' : 'var(--color-text-primary, #0f172a)')};
	cursor: pointer;
	transition: transform 0.2s ease, box-shadow 0.2s ease;
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;

	&:hover {
		transform: translateY(-1px);
		box-shadow: 0 12px 20px rgba(15, 118, 110, 0.12);
	}

	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		box-shadow: none;
	}
`;

const CodeBlock = styled.pre`
	background: rgba(15, 23, 42, 0.92);
	color: #e2e8f0;
	padding: 1rem 1.25rem;
	border-radius: 0.75rem;
	overflow-x: auto;
	font-size: 0.85rem;
	font-family: 'JetBrains Mono', 'Fira Code', 'Menlo', monospace;
	border: 1px solid rgba(148, 163, 184, 0.2);
`;

const ConfigGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
	gap: 1.25rem;
`;

const FormField = styled.div`
	display: grid;
	gap: 0.5rem;

	label {
		font-size: 0.95rem;
		font-weight: 600;
		color: #0f172a;
	}

	select,
	input,
	textarea {
		border-radius: 0.65rem;
		border: 1px solid rgba(148, 163, 184, 0.45);
		padding: 0.75rem 0.85rem;
		font-size: 0.95rem;
		color: #0f172a;
		background: rgba(255, 255, 255, 0.9);
		box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.04);
		transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
	}

	select:focus,
	input:focus,
	textarea:focus {
		outline: none;
		border-color: #0d9488;
		box-shadow: 0 0 0 4px rgba(13, 148, 136, 0.12);
	}

	textarea {
		min-height: 120px;
		resize: vertical;
		font-family: 'JetBrains Mono', 'Fira Code', 'Menlo', monospace;
	}
`;

const StepStatus = styled.div`
	font-size: 0.85rem;
	color: #475569;
`;

type StepIndex = 0 | 1 | 2 | 3;

const STEP_METADATA: Array<{ title: string; subtitle: string }> = [
	{
		title: 'Step 0: Understand CIBA',
		subtitle: 'Review the decoupled authentication model and PingOne prerequisites.',
	},
	{
		title: 'Step 1: Configure Client & Request',
		subtitle: 'Provide PingOne credentials, login hint, and optional binding message.',
	},
	{
		title: 'Step 2: Initiate Backchannel Request',
		subtitle: 'Send the CIBA authentication request and monitor approval status.',
	},
	{
		title: 'Step 3: Tokens & Analysis',
		subtitle: 'Inspect resulting tokens and explore downstream integrations.',
	},
];

const LAST_STEP: StepIndex = 3;

const buildInitialConfig = (): CibaConfig => ({
	environmentId: 'mock-ciba-env-id',
	clientId: 'mock_ciba_client_id_demo_12345',
	clientSecret: 'mock_ciba_client_secret_demo_67890',
	scope: 'openid profile',
	loginHint: 'demo.ciba.user@example.com',
	bindingMessage: 'Approve OAuth Playground CIBA Demo',
	authMethod: 'client_secret_post',
	requestContext: `mock-ciba-session-${Math.random().toString(36).slice(2, 10)}`,
});

const REQUIRED_FIELDS: Array<keyof CibaConfig> = [
	'environmentId',
	'clientId',
	'scope',
	'loginHint',
];

const CIBAFlowV6: React.FC = () => {
	// Ensure page starts at top
	usePageScroll({ pageName: 'CIBAFlowV6', force: true });

	const {
		config,
		authRequest,
		tokens,
		stage,
		isPolling,
		error,
		setConfig,
		initiateAuthentication,
		cancelPolling,
		reset,
		simulateDecision,
	} = useCibaFlow();

	const [currentStep, setCurrentStep] = useState<StepIndex>(() => {
		const restoreStep = sessionStorage.getItem('restore_step');
		if (restoreStep) {
			const step = parseInt(restoreStep, 10);
			sessionStorage.removeItem('restore_step');
			return step as StepIndex;
		}
		return 0;
	});
	const [copiedField, setCopiedField] = useState<string | null>(null);

	// API call tracking for display
	const [introspectionApiCall, setIntrospectionApiCall] = useState<IntrospectionApiCallData | null>(
		null
	);

	const [localConfig, setLocalConfig] = useState<CibaConfig>(() => config ?? buildInitialConfig());
	const effectiveConfig = useMemo(() => localConfig, [localConfig]);

	const missingRequiredFields = useMemo(() => {
		const missing = new Set<string>();
		REQUIRED_FIELDS.forEach((field) => {
			const value = effectiveConfig[field];
			if (!value || (typeof value === 'string' && value.trim() === '')) {
				missing.add(field);
			}
		});
		if (!effectiveConfig.scope.includes('openid')) {
			missing.add('scope');
		}
		if (
			(effectiveConfig.authMethod === 'client_secret_post' ||
				effectiveConfig.authMethod === 'client_secret_basic') &&
			(!effectiveConfig.clientSecret || effectiveConfig.clientSecret.trim() === '')
		) {
			missing.add('clientSecret');
		}
		return missing;
	}, [effectiveConfig]);

	const pollStatusVariant: 'idle' | 'polling' | 'success' | 'error' = useMemo(() => {
		if (stage === 'success') return 'success';
		if (stage === 'error') return 'error';
		if (stage === 'polling' || stage === 'awaiting-approval' || stage === 'initiating') {
			return 'polling';
		}
		return 'idle';
	}, [stage]);

	const handleCopy = useCallback(async (value: string, label: string) => {
		if (!value) {
			v4ToastManager.showSuccess(`Nothing to copy for ${label}.`);
			return;
		}

		try {
			await navigator.clipboard.writeText(value);
			setCopiedField(label);
			setTimeout(() => setCopiedField(null), 1500);
			v4ToastManager.showSuccess(`${label} copied to clipboard.`);
		} catch (copyError) {
			console.warn('[CIBA] Clipboard copy failed:', copyError);
			v4ToastManager.showError(`Unable to copy ${label}. Check browser permissions.`);
		}
	}, []);

	const navigateToTokenManagement = useCallback(() => {
		// Store flow navigation state for back navigation
		storeFlowNavigationState('ciba-v6', currentStep, 'oidc');

		// Set flow source for Token Management page (legacy support)
		sessionStorage.setItem('flow_source', 'ciba-v6');

		// Store comprehensive flow context for Token Management page
		const flowContext = {
			flow: 'ciba-v6',
			tokens: tokens,
			credentials: effectiveConfig,
			timestamp: Date.now(),
		};
		sessionStorage.setItem('tokenManagementFlowContext', JSON.stringify(flowContext));

		// If we have tokens, pass them to Token Management
		if (tokens?.access_token) {
			// Use localStorage for cross-tab communication
			localStorage.setItem('token_to_analyze', tokens.access_token);
			localStorage.setItem('token_type', 'access');
			localStorage.setItem('flow_source', 'ciba-v6');
			console.log('🔍 [CIBAFlowV6] Passing access token to Token Management via localStorage');
		}

		window.open('/token-management', '_blank');
	}, [tokens, effectiveConfig, currentStep]);

	useEffect(() => {
		if (config) {
			setLocalConfig(config);
		}
	}, [config]);

	const updateConfig = useCallback(
		(patch: Partial<CibaConfig>) => {
			setLocalConfig((prev) => {
				const next = { ...prev, ...patch };
				setConfig(next);
				return next;
			});
		},
		[setConfig]
	);

	const handleMockDecision = useCallback(
		(decision: 'approved' | 'denied') => {
			simulateDecision(decision);
		},
		[simulateDecision]
	);

	const handleInitiate = useCallback(async () => {
		if (missingRequiredFields.size > 0) {
			v4ToastManager.showError(
				'Please complete the required PingOne configuration before initiating CIBA.'
			);
			return;
		}
		await initiateAuthentication();
	}, [initiateAuthentication, missingRequiredFields.size]);

	const handleReset = useCallback(() => {
		reset();
		setCurrentStep(0);
		v4ToastManager.showSuccess('CIBA flow reset. Update parameters and initiate again when ready.');
	}, [reset]);

	const curlExample = useMemo(() => {
		const env = effectiveConfig.environmentId || '<environmentId>';
		const clientId = effectiveConfig.clientId || '<clientId>';
		const clientSecret = effectiveConfig.clientSecret || '<clientSecret>';
		const scope = effectiveConfig.scope || 'openid profile';
		const loginHint = effectiveConfig.loginHint || 'user@example.com';
		const binding = effectiveConfig.bindingMessage || 'Approve OAuth Playground';
		const requestContext = effectiveConfig.requestContext?.trim();
		const requestContextLine = requestContext
			? `,\\n    "request_context": ${JSON.stringify(requestContext)}`
			: '';

		return `curl -X POST \\
  https://auth.pingone.com/${env}/as/authorize/ciba \\
  -H "Content-Type: application/json" \\
  -u "${clientId}:${clientSecret}" \\
  -d '{\\
    "scope": "${scope}",\\
    "login_hint": "${loginHint}",\\
    "binding_message": "${binding}"${requestContextLine}\\
  }'`;
	}, [effectiveConfig]);

	const canNavigateNext = useMemo(() => {
		if (currentStep === LAST_STEP) {
			return false;
		}
		if (currentStep === 1) {
			return missingRequiredFields.size === 0;
		}
		if (currentStep === 2) {
			return Boolean(tokens);
		}
		return true;
	}, [currentStep, missingRequiredFields.size, tokens]);

	const disabledMessage = useMemo(() => {
		if (currentStep === 1 && missingRequiredFields.size > 0) {
			return 'Provide required PingOne credentials to continue.';
		}
		if (currentStep === 2 && !tokens) {
			return 'Complete the CIBA request and receive tokens to proceed.';
		}
		if (currentStep === LAST_STEP) {
			return 'You are already viewing the final step.';
		}
		return undefined;
	}, [currentStep, missingRequiredFields.size, tokens]);

	const handleNext = useCallback(() => {
		setCurrentStep((prev) => (prev >= LAST_STEP ? LAST_STEP : ((prev + 1) as StepIndex)));
	}, []);

	const handlePrevious = useCallback(() => {
		setCurrentStep((prev) => (prev <= 0 ? 0 : ((prev - 1) as StepIndex)));
	}, []);

	return (
		<Container>
			<Content>
				<FlowHeader flowId="oidc-ciba-v6" />

				<EnhancedFlowInfoCard
					flowType="oidc-ciba-v6"
					showAdditionalInfo={true}
					showDocumentation={true}
					showCommonIssues={false}
					showImplementationNotes={false}
				/>

				<FlowConfigurationRequirements flowType="ciba" variant="oidc" />

				{/* Warning Notice */}
				<div
					style={{
						background: '#fef3c7',
						border: '1px solid #f59e0b',
						borderRadius: '0.75rem',
						padding: '1.5rem',
						marginBottom: '1.5rem',
						display: 'flex',
						alignItems: 'flex-start',
						gap: '1rem',
					}}
				>
					<FiAlertCircle
						style={{ color: '#d97706', fontSize: '1.5rem', marginTop: '0.125rem', flexShrink: 0 }}
					/>
					<div>
						<h3
							style={{
								margin: '0 0 0.75rem 0',
								color: '#92400e',
								fontSize: '1.1rem',
								fontWeight: '600',
							}}
						>
							Educational Flow - PingOne Not Supported
						</h3>
						<p
							style={{
								margin: '0 0 0.75rem 0',
								color: '#92400e',
								fontSize: '0.95rem',
								lineHeight: '1.5',
							}}
						>
							<strong>Important:</strong> PingOne does not support the CIBA (Client Initiated
							Backchannel Authentication) flow. This implementation is for educational purposes only
							and generates mock responses to demonstrate how CIBA would work with OAuth 2.0
							providers that support it.
						</p>
						<p style={{ margin: 0, color: '#92400e', fontSize: '0.9rem', fontStyle: 'italic' }}>
							The flow will simulate the CIBA process including backchannel requests, polling, and
							token issuance to help you understand this decoupled authentication pattern.
						</p>
					</div>
				</div>

				<StepCard>
					<StepHeader>
						<StepBadge>{STEP_METADATA[currentStep].title}</StepBadge>
						<StepTitle>{STEP_METADATA[currentStep].subtitle}</StepTitle>
						<StepSubtitle>
							{stage === 'error'
								? (error ?? 'An error occurred during the CIBA flow.')
								: STEP_METADATA[currentStep].subtitle}
						</StepSubtitle>
					</StepHeader>
					<StepBody>
						{currentStep === 0 && (
							<>
								<FlowConfigurationRequirements flowType="ciba" variant="oidc" />

								<EnhancedFlowWalkthrough flowId="oidc-ciba-v6" />
								<FlowSequenceDisplay flowType="ciba" />

								<EnhancedFlowInfoCard
									flowType="oidc-ciba-v6"
									showAdditionalInfo={true}
									showDocumentation={true}
									showCommonIssues={false}
									showImplementationNotes={false}
								/>
								<ExplanationSection>
									<ExplanationHeading>
										<FiSmartphone /> Decoupled authentication
									</ExplanationHeading>
									<p>
										<strong>Client Initiated Backchannel Authentication (CIBA)</strong> lets a
										client trigger user authentication on a secondary device. PingOne notifies the
										end user through a registered authenticator. Once approved, the client polls the
										token endpoint with the returned <code>auth_req_id</code> to obtain tokens.
									</p>
								</ExplanationSection>
							</>
						)}

						{currentStep === 1 && (
							<>
								{/* Environment ID Input */}
								<EnvironmentIdInput
									initialEnvironmentId={effectiveConfig.environmentId || ''}
									onEnvironmentIdChange={(newEnvId) => {
										setLocalConfig((prev) => ({
											...prev,
											environmentId: newEnvId,
										}));
										// Auto-save if we have both environmentId and clientId
										if (
											newEnvId &&
											effectiveConfig.clientId &&
											newEnvId.trim() &&
											effectiveConfig.clientId.trim()
										) {
											// Auto-save logic can be added here if needed
										}
									}}
									onIssuerUrlChange={() => {}}
									showSuggestions={true}
									autoDiscover={false}
								/>

								<InlineNotice>
									<FiInfo size={18} />
									<div>
										<strong>PingOne prerequisites</strong>
										<p style={{ margin: '0.35rem 0 0' }}>
											Enable CIBA for the environment, register this client, and configure allowed
											binding messages.
										</p>
									</div>
								</InlineNotice>

								{/* Credentials Input */}
								<CredentialsInput
									environmentId={effectiveConfig.environmentId}
									clientId={effectiveConfig.clientId}
									clientSecret={effectiveConfig.clientSecret ?? ''}
									scopes={effectiveConfig.scope}
									loginHint={effectiveConfig.loginHint}
									onEnvironmentIdChange={(value) => updateConfig({ environmentId: value })}
									onClientIdChange={(value) => updateConfig({ clientId: value })}
									onClientSecretChange={(value) => updateConfig({ clientSecret: value })}
									onScopesChange={(value) => updateConfig({ scope: value })}
									onLoginHintChange={(value) => updateConfig({ loginHint: value })}
									onCopy={handleCopy}
									emptyRequiredFields={missingRequiredFields}
									copiedField={copiedField}
									showRedirectUri={false}
								/>
								<ConfigGrid>
									<FormField>
										<label htmlFor="ciba-auth-method">Client authentication method</label>
										<select
											id="ciba-auth-method"
											value={effectiveConfig.authMethod}
											onChange={(event) =>
												updateConfig({ authMethod: event.target.value as CibaConfig['authMethod'] })
											}
										>
											<option value="client_secret_post">client_secret_post</option>
											<option value="client_secret_basic">client_secret_basic</option>
										</select>
									</FormField>
									<FormField>
										<label htmlFor="ciba-binding-message">Binding message (optional)</label>
										<input
											id="ciba-binding-message"
											type="text"
											maxLength={20}
											value={effectiveConfig.bindingMessage || ''}
											onChange={(event) => updateConfig({ bindingMessage: event.target.value })}
											placeholder="Approve OAuth Playground"
										/>
									</FormField>
									<FormField>
										<label htmlFor="ciba-request-context">Request context (optional)</label>
										<textarea
											id="ciba-request-context"
											rows={3}
											value={effectiveConfig.requestContext || ''}
											onChange={(event) => updateConfig({ requestContext: event.target.value })}
											placeholder='{"sender":"OAuth Playground"}'
											style={{ fontFamily: 'JetBrains Mono, monospace' }}
										/>
									</FormField>
								</ConfigGrid>
								{/* PingOneApplicationConfig removed - not needed for CIBA flow */}
							</>
						)}

						{currentStep === 2 && (
							<>
								<InlineNotice>
									<FiInfo size={18} />
									<div>
										<strong>Simulation controls</strong>
										<p style={{ margin: '0.35rem 0 0' }}>
											PingOne does not support CIBA; use the controls below to simulate an end-user
											approving or denying the request.
										</p>
									</div>
								</InlineNotice>
								<PollingStatus $variant={pollStatusVariant}>
									<StepStatus>
										{stage === 'initiating' && 'Queues a mock backchannel request…'}
										{stage === 'awaiting-approval' && 'Waiting for simulated end-user response.'}
										{stage === 'success' &&
											'Tokens received from the simulated authorization server.'}
										{stage === 'error' && (error || 'The simulated request was denied or expired.')}
										{stage === 'idle' && 'Ready to initiate a mock CIBA request.'}
									</StepStatus>
									{authRequest && (
										<div style={{ fontSize: '0.85rem', color: '#475569' }}>
											<p style={{ margin: 0 }}>
												<strong>Mock Auth State:</strong> {authRequest.stateId}
											</p>
											<p style={{ margin: '0.35rem 0 0' }}>
												<strong>Expires in:</strong>{' '}
												{Math.max(0, Math.round((authRequest.expiresAt - Date.now()) / 1000))}s •{' '}
												<strong>Binding message:</strong> {authRequest.bindingMessage}
											</p>
										</div>
									)}
								</PollingStatus>
								<PollingActions>
									<ControlButton
										$variant="primary"
										onClick={handleInitiate}
										disabled={stage === 'initiating' || stage === 'awaiting-approval'}
									>
										<FiZap /> Initiate mock CIBA request
									</ControlButton>
									<ControlButton
										onClick={() => handleMockDecision('approved')}
										disabled={!authRequest || stage === 'success'}
									>
										<FiSmartphone /> Simulate approval
									</ControlButton>
									<ControlButton
										$variant="danger"
										onClick={() => handleMockDecision('denied')}
										disabled={!authRequest || stage === 'success'}
									>
										<FiAlertCircle /> Simulate denial
									</ControlButton>
									<ControlButton onClick={handleReset}>
										<FiRefreshCw /> Reset simulation
									</ControlButton>
									<ControlButton onClick={() => handleCopy(curlExample, 'CIBA curl snippet')}>
										<FiCopy /> Copy curl example
									</ControlButton>
								</PollingActions>
								<CodeBlock>{curlExample}</CodeBlock>
							</>
						)}
						{currentStep === 3 && (
							<ResultsSection>
								<ResultsHeading>Tokens & downstream actions</ResultsHeading>
								{tokens ? (
									<>
										<TokenIntrospect
											flowName="OIDC CIBA V6 (Mock)"
											flowVersion="V6"
											tokens={tokens as unknown as Record<string, unknown>}
											credentials={effectiveConfig as unknown as Record<string, unknown>}
											onResetFlow={handleReset}
											onNavigateToTokenManagement={navigateToTokenManagement}
											onIntrospectToken={async (token: string) => {
												if (!effectiveConfig?.environmentId || !effectiveConfig?.clientId) {
													throw new Error('Missing credentials for introspection');
												}

												const request = {
													token: token,
													clientId: effectiveConfig.clientId,
													...(effectiveConfig.clientSecret && {
														clientSecret: effectiveConfig.clientSecret,
													}),
													tokenTypeHint: 'access_token' as const,
												};

												try {
													// Use the reusable service to create API call data and execute introspection
													const result = await TokenIntrospectionService.introspectToken(
														request,
														'ciba',
														'/api/introspect-token',
														`https://auth.pingone.com/${effectiveConfig.environmentId}/as/introspect`,
														'client_secret_post'
													);

													// Set the API call data for display
													setIntrospectionApiCall(result.apiCall);

													return result.response;
												} catch (error) {
													// Create error API call using reusable service
													const errorApiCall = TokenIntrospectionService.createErrorApiCall(
														request,
														'ciba',
														error instanceof Error ? error.message : 'Unknown error',
														500,
														`https://auth.pingone.com/${effectiveConfig.environmentId}/as/introspect`
													);

													setIntrospectionApiCall(errorApiCall);
													throw error;
												}
											}}
											completionMessage="Great work! Continue exploring these tokens in Token Management or rerun the flow with new scopes."
										/>

										{/* API Call Display for Token Introspection */}
										{introspectionApiCall && (
											<EnhancedApiCallDisplay
												apiCall={introspectionApiCall}
												options={{
													showEducationalNotes: true,
													showFlowContext: true,
													urlHighlightRules:
														EnhancedApiCallDisplayService.getDefaultHighlightRules('ciba'),
												}}
											/>
										)}
									</>
								) : (
									<HelperText>
										Awaiting tokens. Complete the CIBA approval to view results.
									</HelperText>
								)}
								<SectionDivider />
								<SecurityFeaturesDemo
									tokens={tokens as unknown as Record<string, unknown> | null}
									credentials={effectiveConfig as unknown as Record<string, unknown>}
									onTerminateSession={() => {
										console.log('🚪 Session terminated via SecurityFeaturesDemo');
										v4ToastManager.showSuccess('Session termination completed.');
									}}
									onRevokeTokens={() => {
										console.log('❌ Tokens revoked via SecurityFeaturesDemo');
										v4ToastManager.showSuccess('Token revocation completed.');
									}}
								/>
							</ResultsSection>
						)}
					</StepBody>
				</StepCard>
				<StepNavigationButtons
					currentStep={currentStep}
					totalSteps={STEP_METADATA.length}
					onNext={handleNext}
					onPrevious={handlePrevious}
					onReset={handleReset}
					canNavigateNext={canNavigateNext}
					isFirstStep={currentStep === 0}
					nextButtonText={currentStep === 2 ? 'View results' : 'Next'}
					disabledMessage={disabledMessage || ''}
				/>
			</Content>
		</Container>
	);
};

export default CIBAFlowV6;
