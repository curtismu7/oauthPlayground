import React, { useCallback, useMemo, useState } from 'react';
import { FiAlertCircle, FiCopy, FiInfo, FiRefreshCw, FiSmartphone, FiZap } from 'react-icons/fi';
import styled from 'styled-components';
import ConfigurationSummaryCard from '../../components/ConfigurationSummaryCard';
import { CredentialsInput } from '../../components/CredentialsInput';
import EnhancedFlowInfoCard from '../../components/EnhancedFlowInfoCard';
import EnhancedFlowWalkthrough from '../../components/EnhancedFlowWalkthrough';
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
import useCibaFlow, { CibaConfig } from '../../hooks/useCibaFlow';
import { FlowHeader } from '../../services/flowHeaderService';
import { credentialManager } from '../../utils/credentialManager';
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

const buildInitialConfig = (): CibaConfig => {
	const stored = credentialManager.loadConfigCredentials();
	return {
		environmentId: stored.environmentId || '',
		clientId: stored.clientId || '',
		clientSecret: stored.clientSecret || '',
		scope: 'openid profile',
		loginHint: stored.loginHint || '',
		bindingMessage: 'Approve OAuth Playground',
		authMethod: 'client_secret_post',
		requestContext: '',
	};
};

const REQUIRED_FIELDS: Array<keyof CibaConfig> = [
	'environmentId',
	'clientId',
	'scope',
	'loginHint',
];

const CIBAFlowV5: React.FC = () => {
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
	} = useCibaFlow();

	const [currentStep, setCurrentStep] = useState<StepIndex>(0);
	const [copiedField, setCopiedField] = useState<string | null>(null);

	const effectiveConfig = useMemo(() => config ?? buildInitialConfig(), [config]);

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

	const updateConfig = useCallback(
		(patch: Partial<CibaConfig>) => {
			const nextConfig: CibaConfig = { ...effectiveConfig, ...patch };
			setConfig(nextConfig);
		},
		[effectiveConfig, setConfig]
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
				<FlowHeader flowId="oidc-ciba-v5" />

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

								<EnhancedFlowWalkthrough flowId="oidc-ciba" />
								<FlowSequenceDisplay flowType="ciba" />

								<EnhancedFlowInfoCard
									flowType="oidc-ciba-v5"
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
										Client Initiated Backchannel Authentication (CIBA) lets a client trigger user
										authentication on a secondary device. PingOne notifies the end user through a
										registered authenticator. Once approved, the client polls the token endpoint
										with the returned <code>auth_req_id</code> to obtain tokens.
									</p>
								</ExplanationSection>
							</>
						)}

						{currentStep === 1 && (
							<>
								<ConfigurationSummaryCard
									hasConfiguration={Boolean(
										effectiveConfig.environmentId && effectiveConfig.clientId
									)}
									configurationDetails={{
										environmentId: effectiveConfig.environmentId,
										clientId: effectiveConfig.clientId,
										scopes: effectiveConfig.scope.split(' ').filter(Boolean),
										loginHint: effectiveConfig.loginHint,
									}}
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
									<FiAlertCircle size={18} />
									<div>
										<strong>Polling etiquette</strong>
										<p style={{ margin: '0.35rem 0 0' }}>
											Respect the interval returned by PingOne. The playground automatically backs
											off when <code>slow_down</code> responses are received.
										</p>
									</div>
								</InlineNotice>
								<PollingStatus $variant={pollStatusVariant}>
									<StepStatus>
										{stage === 'initiating' && 'Sending CIBA request to PingOne…'}
										{stage === 'awaiting-approval' &&
											'Waiting for the end user to approve the request.'}
										{stage === 'polling' && 'Polling token endpoint for approval…'}
										{stage === 'success' && 'Tokens received! Continue to analysis below.'}
										{stage === 'error' && (error || 'An error occurred during the CIBA flow.')}
										{stage === 'idle' && 'Ready to initiate a new CIBA request.'}
									</StepStatus>
									{authRequest && (
										<div style={{ fontSize: '0.85rem', color: '#475569' }}>
											<p style={{ margin: 0 }}>
												<strong>Auth request ID:</strong> {authRequest.auth_req_id}
											</p>
											<p style={{ margin: '0.35rem 0 0' }}>
												<strong>Polling interval:</strong> {authRequest.interval ?? 5}s •{' '}
												<strong>Expires in:</strong> {authRequest.expires_in}s
											</p>
										</div>
									)}
								</PollingStatus>
								<PollingActions>
									<ControlButton
										$variant="primary"
										onClick={handleInitiate}
										disabled={isPolling || stage === 'awaiting-approval' || stage === 'initiating'}
									>
										<FiZap /> Initiate CIBA request
									</ControlButton>
									<ControlButton
										$variant="secondary"
										onClick={cancelPolling}
										disabled={
											!authRequest ||
											pollStatusVariant === 'success' ||
											pollStatusVariant === 'idle'
										}
									>
										<FiRefreshCw /> Cancel polling
									</ControlButton>
									<ControlButton
										$variant="secondary"
										onClick={() => handleCopy(curlExample, 'CIBA curl snippet')}
									>
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
									<TokenIntrospect
										flowName="OIDC CIBA V5"
										flowVersion="V5"
										tokens={tokens as unknown as Record<string, unknown>}
										credentials={effectiveConfig as unknown as Record<string, unknown>}
										onResetFlow={handleReset}
										onNavigateToTokenManagement={() =>
											v4ToastManager.showSuccess(
												'Open Token Management to inspect and decode these tokens.'
											)
										}
										onIntrospectToken={async (token: string) => {
											if (!effectiveConfig?.environmentId || !effectiveConfig?.clientId) {
												throw new Error('Missing credentials for introspection');
											}

											const introspectEndpoint = `https://auth.pingone.com/${effectiveConfig.environmentId}/as/introspect`;

											const params = new URLSearchParams({
												token: token,
												client_id: effectiveConfig.clientId,
											});

											// Add client_secret if available (confidential client)
											if (effectiveConfig.clientSecret) {
												params.append('client_secret', effectiveConfig.clientSecret);
											}

											const response = await fetch(introspectEndpoint, {
												method: 'POST',
												headers: {
													'Content-Type': 'application/x-www-form-urlencoded',
												},
												body: params.toString(),
											});

											if (!response.ok) {
												const errorText = await response.text();
												throw new Error(`Introspection failed: ${response.status} - ${errorText}`);
											}

											return await response.json();
										}}
										completionMessage="Great work! Continue exploring these tokens in Token Management or rerun the flow with new scopes."
									/>
								) : (
									<HelperText>
										Awaiting tokens. Complete the CIBA approval to view results.
									</HelperText>
								)}
								<SectionDivider />
								<SecurityFeaturesDemo />
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

export default CIBAFlowV5;
