import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PageLayoutService from '../../services/pageLayoutService';
import FlowStepLayoutService from '../../services/flowStepLayoutService';
import { CollapsibleHeader } from '../../services/collapsibleHeaderService';
import { FlowHeader } from '../../services/flowHeaderService';
import FlowStatusManagementService, {
	FlowProgress,
	type FlowState,
} from '../../services/flowStatusManagementService';
import FlowConfigurationRequirements from '../../components/FlowConfigurationRequirements';
import OIDCDiscoveryInput from '../../components/OIDCDiscoveryInput';
import { CredentialsInput } from '../../components/CredentialsInput';
import EnhancedFlowWalkthrough from '../../components/EnhancedFlowWalkthrough';
import ResponseModeSelector from '../../components/response-modes/ResponseModeSelector';
import { FlowValidationService } from '../../services/flowValidationService';
import { oidcDiscoveryService, type OIDCDiscoveryDocument } from '../../services/oidcDiscoveryService';
import {
	buildAuthUrl,
	generateCodeChallenge,
	generateCodeVerifier,
	generateCsrfToken,
	generateRandomString,
} from '../../utils/oauth';

const STEP_METADATA = [
	{
		id: 'introduction',
		title: 'Step 0: Introduction & Setup',
		subtitle: 'Understand the Authorization Code Flow rebuild goals',
		description:
			'Welcome to the V6 rebuild. This step will surface flow context, prerequisites, and configuration guidance before you start.',
	},
	{
		id: 'pkce',
		title: 'Step 1: PKCE Parameters',
		subtitle: 'Generate secure verifier and challenge values',
		description:
			'PKCE protects Authorization Code flows against interception attacks. The dedicated services will render educational content, generation UI, and validation.',
	},
	{
		id: 'authorization-request',
		title: 'Step 2: Authorization Request',
		subtitle: 'Build and launch the PingOne authorization URL',
		description:
			'This step will orchestrate the enhanced response mode selector, authorization URL builder, and parameter deep dives.',
	},
	{
		id: 'authorization-response',
		title: 'Step 3: Authorization Response',
		subtitle: 'Process the returned authorization code and state',
		description:
			'Service placeholders ensure we can integrate secure state validation, error handling, and UI messaging.',
	},
	{
		id: 'token-exchange',
		title: 'Step 4: Token Exchange',
		subtitle: 'Exchange the authorization code for tokens',
		description:
			'Token exchange services, enhanced API displays, and ID token validation will plug into this container.',
	},
	{
		id: 'introspection',
		title: 'Step 5: Token Introspection & UserInfo',
		subtitle: 'Inspect issued tokens and retrieve user information',
		description:
			'Integrate token introspection, OIDC UserInfo, and session-aware UI inside this step layout.',
	},
	{
		id: 'security',
		title: 'Step 6: Security & Session Management',
		subtitle: 'Showcase logout, session monitoring, and advanced features',
		description:
			'Security services (session management, certificate generation, enhanced controls) will mount here.',
	},
	{
		id: 'summary',
		title: 'Step 7: Flow Summary & Next Actions',
		subtitle: 'Review flow completion, logs, and recommended follow-ups',
		description:
			'Provides flow completion summary, analytics hooks, and links to adjacent flows or documentation.',
	},
];

type StepMetadata = (typeof STEP_METADATA)[number];

interface CredentialsState {
	environmentId: string;
	clientId: string;
	clientSecret: string;
	redirectUri: string;
	scopes: string;
	loginHint: string;
	issuerUrl: string;
	authorizationEndpoint: string;
	tokenEndpoint: string;
	userInfoEndpoint: string;
}

type ResponseMode = 'query' | 'fragment' | 'form_post' | 'pi.flow';

interface AuthRequestState {
	responseMode: ResponseMode;
	state: string;
	nonce: string;
	authUrl: string;
	isGenerating: boolean;
	error: string | null;
}

const createInitialAuthRequestState = (): AuthRequestState => ({
	responseMode: 'query',
	state: generateCsrfToken(),
	nonce: generateRandomString(32),
	authUrl: '',
	isGenerating: false,
	error: null,
});

type CollapsibleSectionKey =
	| 'status'
	| 'validation'
	| 'overview'
	| 'requirements'
	| 'discovery'
	| 'credentials'
	| 'walkthrough'
	| 'pkceOverview'
	| 'pkceDetails'
	| 'pkceGeneration'
	| 'authRequestOverview'
	| 'authRequestDetails'
	| 'authResponseMode'
	| 'authUrlBuilder';

type CollapsedSections = Record<CollapsibleSectionKey, boolean>;

const OAuthAuthorizationCodeFlowV6: React.FC = () => {
	const [credentials, setCredentials] = useState<CredentialsState>({
		environmentId: '',
		clientId: '',
		clientSecret: '',
		redirectUri: 'http://localhost:3000/callback',
		scopes: 'openid profile email',
		loginHint: '',
		issuerUrl: '',
		authorizationEndpoint: '',
		tokenEndpoint: '',
		userInfoEndpoint: '',
	});
	const [copiedField, setCopiedField] = useState<string | null>(null);
	const [flowState, setFlowState] = useState<FlowState | null>(null);
	const [introCompleted, setIntroCompleted] = useState(false);
	const [pkceReady, setPkceReady] = useState(false);
	const [pkceState, setPkceState] = useState({
		codeVerifier: '',
		codeChallenge: '',
		method: 'S256',
		isGenerating: false,
		error: '' as string | null,
	});
	const [authRequest, setAuthRequest] = useState<AuthRequestState>(createInitialAuthRequestState);
	const [collapsedSections, setCollapsedSections] = useState<CollapsedSections>({
		status: false,
		validation: false,
		overview: false,
		requirements: false,
		discovery: false,
		credentials: false,
		walkthrough: true,
		pkceOverview: false,
		pkceDetails: true,
		pkceGeneration: false,
		authRequestOverview: false,
		authRequestDetails: true,
		authResponseMode: false,
		authUrlBuilder: false,
	});

	const statusManager = useMemo(
		() =>
			FlowStatusManagementService.createStatusManager({
				flowType: 'oauth',
				enableProgressTracking: true,
				enableStepTiming: true,
				showStepDetails: true,
			}),
		[],
	);

	useEffect(() => {
		const steps = STEP_METADATA.map((metadata, order) => ({
			id: metadata.id,
			name: metadata.title,
			description: metadata.subtitle,
			order,
			required: true,
		}));
		const initialState = statusManager.initializeFlow(
			'oauth-authorization-code-v6',
			steps,
		);
		statusManager.startStep(STEP_METADATA[0].id);
		const currentState = statusManager.getState() ?? initialState;
		setFlowState({ ...currentState });
	}, [statusManager]);

	const validationRequirements = useMemo(
		() => FlowValidationService.getStepRequirements(0, 'authorization-code'),
		[],
	);

	const requiredFields = useMemo(() => ['environmentId', 'clientId'], []);

	const emptyRequiredFields = useMemo(
		() =>
			new Set(
				requiredFields.filter((field) => !credentials[field as keyof CredentialsState].trim()),
			),
		[credentials, requiredFields],
	);

	const validationReady = useMemo(
		() =>
			requiredFields.every((field) =>
				credentials[field as keyof CredentialsState].trim().length > 0,
			),
		[credentials, requiredFields],
	);

	const handleCredentialChange = useCallback(
		(field: keyof CredentialsState, value: string) => {
			setCredentials((prev) => ({
				...prev,
				[field]: value,
			}));
		},
		[],
	);

	const handleCopy = useCallback(async (value: string, label: string) => {
		if (!value) {
			return;
		}
		try {
			await navigator.clipboard.writeText(value);
			setCopiedField(label);
		} catch (error) {
			console.warn('[OAuthAuthorizationCodeFlowV6] Clipboard copy failed', error);
		}
	}, []);

	useEffect(() => {
		if (!copiedField) {
			return;
		}
		const timeout = window.setTimeout(() => setCopiedField(null), 2000);
		return () => window.clearTimeout(timeout);
	}, [copiedField]);

	const handleDiscoveryComplete = useCallback((document: OIDCDiscoveryDocument) => {
		if (!document) {
			return;
		}
		const derivedEnvironmentId = oidcDiscoveryService.extractEnvironmentId(document.issuer);
		setCredentials((prev) => ({
			...prev,
			environmentId: derivedEnvironmentId ?? prev.environmentId,
			issuerUrl: document.issuer,
			authorizationEndpoint: document.authorization_endpoint,
			tokenEndpoint: document.token_endpoint,
			userInfoEndpoint: document.userinfo_endpoint ?? prev.userInfoEndpoint,
		}));
	}, []);

	const toggleSection = useCallback((key: CollapsibleSectionKey) => {
		setCollapsedSections((prev) => ({
			...prev,
			[key]: !prev[key],
		}));
	}, []);

	const handleGeneratePkce = useCallback(async () => {
		setPkceState((prev) => ({ ...prev, isGenerating: true, error: null }));
		setPkceReady(false);
		try {
			const codeVerifier = generateCodeVerifier();
			const codeChallenge = await generateCodeChallenge(codeVerifier);
			setPkceState({
				codeVerifier,
				codeChallenge,
				method: 'S256',
				isGenerating: false,
				error: null,
			});
			setPkceReady(true);
			statusManager.completeStep('pkce', {
				pkceGenerated: true,
			});
			const updated = statusManager.getState();
			if (updated) {
				setFlowState({ ...updated });
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to generate PKCE parameters';
			setPkceState((prev) => ({ ...prev, isGenerating: false, error: message }));
			setPkceReady(false);
		}
	}, [statusManager]);

	useEffect(() => {
		if (validationReady && !introCompleted) {
			statusManager.completeStep('introduction', {
				credentialsReady: true,
			});
			const updated = statusManager.getState();
			if (updated) {
				setFlowState({ ...updated });
			}
			setIntroCompleted(true);
		}
	}, [introCompleted, statusManager, validationReady]);

	useEffect(() => {
		if (!validationReady && introCompleted) {
			statusManager.startStep('introduction');
			const updated = statusManager.getState();
			if (updated) {
				setFlowState({ ...updated });
			}
			setIntroCompleted(false);
		}
	}, [introCompleted, statusManager, validationReady]);
	const pageLayout = useMemo(
		() =>
			PageLayoutService.createPageLayout({
				flowType: 'oauth',
				theme: 'blue',
				maxWidth: '72rem',
				showHeader: false,
				showFooter: false,
			}),
		[],
	);

	const stepLayout = useMemo(
		() =>
			FlowStepLayoutService.createStepLayout({
				flowType: 'oauth',
				theme: 'blue',
			}),
		[],
	);

	const {
		PageContainer,
		ContentWrapper,
		MainCard,
		Spacing,
	} = pageLayout;

	const {
		StepContainer,
		StepHeader,
		StepHeaderLeft,
		VersionBadge,
		StepHeaderTitle,
		StepHeaderSubtitle,
		StepContent,
		StepNavigation,
		PrimaryButton,
		SecondaryButton,
		StepProgress,
	} = stepLayout;

	const renderStepContent = useCallback(
		(step: StepMetadata) => {
			if (step.id === 'introduction') {
				return (
					<div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
						<CollapsibleHeader
							title="Flow Status"
							subtitle="Real-time overview of the V6 rebuild progress"
							onToggle={() => toggleSection('status')}
							collapsed={collapsedSections.status}
						>
							{flowState ? <FlowProgress flowState={flowState} /> : <p>Initializing flow status…</p>}
						</CollapsibleHeader>
						<CollapsibleHeader
							title="Validation Checklist"
							subtitle="Step requirements before progressing to PKCE"
							onToggle={() => toggleSection('validation')}
							collapsed={collapsedSections.validation}
						>
							<p>Complete the following prerequisites:</p>
							<ul style={{ marginLeft: '1.5rem', lineHeight: 1.6 }}>
								{validationRequirements.map((requirement) => (
									<li key={requirement}>{requirement}</li>
								))}
							</ul>
							<p>
								<strong>Status:</strong>{' '}
								{validationReady
									? 'Ready to proceed once walkthrough is complete.'
									: 'Provide the required credentials below to unlock the next step.'}
							</p>
						</CollapsibleHeader>
						<CollapsibleHeader
							title="Authorization Code Flow Overview"
							subtitle="Purpose, security posture, and key benefits"
							onToggle={() => toggleSection('overview')}
							collapsed={collapsedSections.overview}
						>
							<p>
								Authorization Code Flow is ideal for confidential clients and PKCE-enabled public
								applications. It provides refresh token support and aligns with OAuth 2.0 best
								practices.
							</p>
							<ul style={{ marginLeft: '1.5rem', lineHeight: 1.6 }}>
								<li>Supports secure backend token handling.</li>
								<li>Recommended for SPAs, native apps, and web apps.</li>
								<li>Pairs with PKCE to prevent interception attacks.</li>
							</ul>
						</CollapsibleHeader>
						<CollapsibleHeader
							title="PingOne Requirements"
							subtitle="Understand the application configuration essentials"
							onToggle={() => toggleSection('requirements')}
							collapsed={collapsedSections.requirements}
						>
							<FlowConfigurationRequirements flowType="authorization-code" variant="oauth" />
						</CollapsibleHeader>
						<CollapsibleHeader
							title="OIDC Discovery"
							subtitle="Auto-populate PingOne endpoints via discovery"
							onToggle={() => toggleSection('discovery')}
							collapsed={collapsedSections.discovery}
						>
							<OIDCDiscoveryInput
								onDiscoveryComplete={(result) => {
									if (result?.success && result.document) {
										handleDiscoveryComplete(result.document);
									}
								}}
								initialIssuerUrl={credentials.issuerUrl}
							/>
						</CollapsibleHeader>
						<CollapsibleHeader
							title="Application Credentials"
							subtitle="Provide your PingOne configuration details"
							onToggle={() => toggleSection('credentials')}
							collapsed={collapsedSections.credentials}
						>
							<CredentialsInput
								environmentId={credentials.environmentId}
								clientId={credentials.clientId}
								clientSecret={credentials.clientSecret}
								redirectUri={credentials.redirectUri}
								scopes={credentials.scopes}
								loginHint={credentials.loginHint}
								onEnvironmentIdChange={(value) => handleCredentialChange('environmentId', value)}
								onClientIdChange={(value) => handleCredentialChange('clientId', value)}
								onClientSecretChange={(value) => handleCredentialChange('clientSecret', value)}
								onRedirectUriChange={(value) => handleCredentialChange('redirectUri', value)}
								onScopesChange={(value) => handleCredentialChange('scopes', value)}
								onLoginHintChange={(value) => handleCredentialChange('loginHint', value)}
								onCopy={handleCopy}
								emptyRequiredFields={emptyRequiredFields}
								copiedField={copiedField}
							/>
						</CollapsibleHeader>
						<CollapsibleHeader
							title="Interactive Walkthrough"
							subtitle="Step-by-step guidance for the Authorization Code Flow"
							onToggle={() => toggleSection('walkthrough')}
							collapsed={collapsedSections.walkthrough}
						>
							<EnhancedFlowWalkthrough flowId="oauth-authorization-code" defaultCollapsed={false} />
						</CollapsibleHeader>
					</div>
				);
			}

			if (step.id === 'pkce') {
				return (
					<div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
						<CollapsibleHeader
							title="PKCE Overview"
							subtitle="Why Proof Key for Code Exchange protects authorization flows"
							onToggle={() => toggleSection('pkceOverview')}
							collapsed={collapsedSections.pkceOverview}
						>
							<p>
								PKCE binds the authorization request and token exchange steps together using a one-time secret.
								It prevents intercepted authorization codes from being replayed by requiring proof that the
								same client that initiated the flow is completing it.
							</p>
							<ul style={{ marginLeft: '1.5rem', lineHeight: 1.6 }}>
								<li>Required for public clients such as SPAs and native apps.</li>
								<li>Strongly recommended for confidential clients to mitigate interception attacks.</li>
								<li>Fully supported by PingOne authorization servers.</li>
							</ul>
						</CollapsibleHeader>
						<CollapsibleHeader
							title="Code Verifier & Code Challenge"
							subtitle="Understand the two PKCE parameters and how they interact"
							onToggle={() => toggleSection('pkceDetails')}
							collapsed={collapsedSections.pkceDetails}
						>
							<div style={{ display: 'grid', gap: '1rem' }}>
								<section>
									<h4 style={{ margin: '0 0 0.5rem 0' }}>Code Verifier</h4>
									<p style={{ margin: 0 }}>
										A high-entropy random string (43-128 characters) generated per authorization
										request. It must remain secret until the token exchange.
									</p>
								</section>
								<section>
									<h4 style={{ margin: '0 0 0.5rem 0' }}>Code Challenge</h4>
									<p style={{ margin: 0 }}>
										A base64url-encoded SHA-256 hash of the verifier that is safe to transmit in the
										authorization request. PingOne verifies it against the presented verifier during token exchange.
									</p>
								</section>
								<section>
									<h4 style={{ margin: '0 0 0.5rem 0' }}>Security Notes</h4>
									<ul style={{ marginLeft: '1.5rem', lineHeight: 1.6 }}>
										<li>Always regenerate PKCE parameters for each authorization attempt.</li>
										<li>Use the `S256` method for modern security requirements.</li>
										<li>Store the verifier securely until the token request is sent.</li>
									</ul>
								</section>
							</div>
						</CollapsibleHeader>
						<CollapsibleHeader
							title="Generate PKCE Parameters"
							subtitle="Produce fresh code verifier and challenge values for this flow"
							onToggle={() => toggleSection('pkceGeneration')}
							collapsed={collapsedSections.pkceGeneration}
						>
							<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
								<button
									type="button"
									onClick={handleGeneratePkce}
									disabled={pkceState.isGenerating}
									style={{
										alignSelf: 'flex-start',
										padding: '0.75rem 1.25rem',
										background: '#2563eb',
										color: '#ffffff',
										border: 'none',
										borderRadius: '0.5rem',
										cursor: pkceState.isGenerating ? 'not-allowed' : 'pointer',
									}}
								>
									{pkceState.isGenerating ? 'Generating…' : 'Generate PKCE Parameters'}
								</button>
								{pkceState.error ? (
									<p style={{ color: '#dc2626', margin: 0 }}>{pkceState.error}</p>
								) : null}
								{pkceState.codeVerifier ? (
									<div
										style={{
											display: 'grid',
											gap: '1rem',
											background: '#f1f5f9',
											border: '1px solid #d1d5db',
											borderRadius: '0.75rem',
											padding: '1.25rem',
										}}
									>
										<section>
											<h4 style={{ margin: '0 0 0.5rem 0' }}>Code Verifier</h4>
											<pre
												style={{
													margin: 0,
													padding: '0.75rem',
													background: '#ffffff',
													borderRadius: '0.5rem',
													wordBreak: 'break-all',
												}}
											>
												{pkceState.codeVerifier}
											</pre>
											<button
												type="button"
												onClick={() => handleCopy(pkceState.codeVerifier, 'Code Verifier')}
												style={{
													marginTop: '0.5rem',
													padding: '0.5rem 0.75rem',
													background: '#0ea5e9',
													color: '#ffffff',
													border: 'none',
													borderRadius: '0.5rem',
													cursor: 'pointer',
												}}
											>
												Copy Verifier
											</button>
										</section>
										<section>
											<h4 style={{ margin: '0 0 0.5rem 0' }}>Code Challenge</h4>
											<pre
												style={{
													margin: 0,
													padding: '0.75rem',
													background: '#ffffff',
													borderRadius: '0.5rem',
													wordBreak: 'break-all',
												}}
											>
												{pkceState.codeChallenge}
											</pre>
											<button
												type="button"
												onClick={() => handleCopy(pkceState.codeChallenge, 'Code Challenge')}
												style={{
													marginTop: '0.5rem',
													padding: '0.5rem 0.75rem',
													background: '#0f766e',
													color: '#ffffff',
													border: 'none',
													borderRadius: '0.5rem',
													cursor: 'pointer',
												}}
											>
												Copy Challenge
											</button>
										</section>
									</div>
								) : null}
								{pkceReady ? (
									<p style={{ color: '#166534', margin: 0 }}>
										PKCE parameters are ready. Proceed to build your authorization request.
									</p>
								) : null}
							</div>
						</CollapsibleHeader>
					</div>
				);
			}

			return (
				<CollapsibleHeader
					title="Service integration in progress"
					subtitle="Upcoming step services will mount here"
					defaultCollapsed={false}
				>
					<p>{step.description}</p>
				</CollapsibleHeader>
			);
		},
		[
			collapsedSections,
			copiedField,
			credentials,
			emptyRequiredFields,
			flowState,
			handleCopy,
			handleCredentialChange,
			handleDiscoveryComplete,
			toggleSection,
			validationReady,
			validationRequirements,
		],
	);

	return (
		<PageContainer>
			<ContentWrapper>
				<FlowHeader
					flowType="oauth"
					customConfig={{
						title: 'Authorization Code Flow (V6)',
						subtitle:
							'Rebuilt from the ground up with services architecture, resilient UX, and comprehensive OAuth/OIDC coverage.',
						icon: '🚀',
						version: 'V6',
					}}
				/>
				<Spacing $size="sm" />
				<MainCard>
					{STEP_METADATA.map((step, index) => {
						const isFirstStep = index === 0;
						const isNextEnabled = step.id === 'introduction' ? validationReady : false;
						const nextLabel = step.id === 'introduction' ? 'Proceed to PKCE' : 'Next';
						return (
							<StepSection
								key={step.id}
								index={index}
								step={step}
								stepCount={STEP_METADATA.length}
								isFirstStep={isFirstStep}
								isNextEnabled={isNextEnabled}
								nextLabel={nextLabel}
								components={{
									StepContainer,
									StepHeader,
									StepHeaderLeft,
									VersionBadge,
									StepHeaderTitle,
									StepHeaderSubtitle,
									StepContent,
									StepNavigation,
									PrimaryButton,
									SecondaryButton,
									StepProgress,
								}}
								renderStepContent={renderStepContent}
							/>
						);
					})}
				</MainCard>
			</ContentWrapper>
		</PageContainer>
	);
}

interface StepSectionProps {
	index: number;
	stepCount: number;
	step: StepMetadata;
	isFirstStep: boolean;
	isNextEnabled: boolean;
	nextLabel: string;
	components: {
		StepContainer: ReturnType<typeof FlowStepLayoutService.createStepLayout>['StepContainer'];
		StepHeader: ReturnType<typeof FlowStepLayoutService.createStepLayout>['StepHeader'];
		StepHeaderLeft: ReturnType<typeof FlowStepLayoutService.createStepLayout>['StepHeaderLeft'];
		VersionBadge: ReturnType<typeof FlowStepLayoutService.createStepLayout>['VersionBadge'];
		StepHeaderTitle: ReturnType<typeof FlowStepLayoutService.createStepLayout>['StepHeaderTitle'];
		StepHeaderSubtitle: ReturnType<typeof FlowStepLayoutService.createStepLayout>['StepHeaderSubtitle'];
		StepContent: ReturnType<typeof FlowStepLayoutService.createStepLayout>['StepContent'];
		StepNavigation: ReturnType<typeof FlowStepLayoutService.createStepLayout>['StepNavigation'];
		PrimaryButton: ReturnType<typeof FlowStepLayoutService.createStepLayout>['PrimaryButton'];
		SecondaryButton: ReturnType<typeof FlowStepLayoutService.createStepLayout>['SecondaryButton'];
		StepProgress: ReturnType<typeof FlowStepLayoutService.createStepLayout>['StepProgress'];
	};
	renderStepContent: (step: StepMetadata) => React.ReactNode;
}

const StepSection: React.FC<StepSectionProps> = ({
	index,
	stepCount,
	step,
	isFirstStep,
	isNextEnabled,
	nextLabel,
	components,
	renderStepContent,
}) => {
	const {
		StepContainer,
		StepHeader,
		StepHeaderLeft,
		VersionBadge,
		StepHeaderTitle,
		StepHeaderSubtitle,
		StepContent,
		StepNavigation,
		PrimaryButton,
		SecondaryButton,
		StepProgress,
	} = components;

	return (
		<StepContainer>
			<StepHeader>
				<StepHeaderLeft>
					<VersionBadge>V6</VersionBadge>
					<StepHeaderTitle>{step.title}</StepHeaderTitle>
					<StepHeaderSubtitle>{step.subtitle}</StepHeaderSubtitle>
				</StepHeaderLeft>
				<StepProgress>
					Step {index + 1} of {stepCount}
				</StepProgress>
			</StepHeader>
			<StepContent>
				{renderStepContent(step)}
			</StepContent>
			<StepNavigation>
				<SecondaryButton type="button" disabled={isFirstStep}>
					Back
				</SecondaryButton>
				<PrimaryButton type="button" disabled={!isNextEnabled}>
					{nextLabel}
				</PrimaryButton>
			</StepNavigation>
		</StepContainer>
	);
};

export default OAuthAuthorizationCodeFlowV6;
