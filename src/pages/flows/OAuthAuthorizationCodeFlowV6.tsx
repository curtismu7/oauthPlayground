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
import { FlowValidationService } from '../../services/flowValidationService';
import { oidcDiscoveryService, type OIDCDiscoveryDocument } from '../../services/oidcDiscoveryService';

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

type CollapsibleSectionKey =
	| 'status'
	| 'validation'
	| 'overview'
	| 'requirements'
	| 'discovery'
	| 'credentials'
	| 'walkthrough';

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
	const [collapsedSections, setCollapsedSections] = useState<CollapsedSections>({
		status: false,
		validation: false,
		overview: false,
		requirements: false,
		discovery: false,
		credentials: false,
		walkthrough: true,
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

	const handleDiscoveryComplete = useCallback((document: any) => {
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
					{STEP_METADATA.map((step, index) => (
						<StepSection
							key={step.id}
							index={index}
							step={step}
							stepCount={STEP_METADATA.length}
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
					))}
				</MainCard>
			</ContentWrapper>
		</PageContainer>
	);
}

interface StepSectionProps {
	index: number;
	stepCount: number;
	step: StepMetadata;
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
				<SecondaryButton type="button" disabled>
					Back
				</SecondaryButton>
				<PrimaryButton type="button" disabled>
					Next
				</PrimaryButton>
			</StepNavigation>
		</StepContainer>
	);
};

export default OAuthAuthorizationCodeFlowV6;
