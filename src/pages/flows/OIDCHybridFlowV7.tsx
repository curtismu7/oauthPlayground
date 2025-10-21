// src/pages/flows/OIDCHybridFlowV7.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
	FiAlertCircle,
	FiAlertTriangle,
	FiCheckCircle,
	FiChevronDown,
	FiExternalLink,
	FiGlobe,
	FiInfo,
	FiKey,
	FiRefreshCw,
	FiShield,
} from 'react-icons/fi';

import { usePageScroll } from '../../hooks/usePageScroll';
import { useHybridFlowControllerV7 } from '../../hooks/useHybridFlowControllerV7';
import { FlowHeader } from '../../services/flowHeaderService';
import { FlowUIService } from '../../services/flowUIService';
import { FlowCompletionService, FlowCompletionConfigs } from '../../services/flowCompletionService';
import { StepNavigationButtons } from '../../components/StepNavigationButtons';
import ComprehensiveCredentialsService from '../../services/comprehensiveCredentialsService';
import { CopyButtonService } from '../../services/copyButtonService';
import ColoredUrlDisplay from '../../components/ColoredUrlDisplay';
import SecurityFeaturesDemo from '../../components/SecurityFeaturesDemo';
import TokenIntrospect from '../../components/TokenIntrospect';
import { UnifiedTokenDisplayService } from '../../services/unifiedTokenDisplayService';
import { v4ToastManager } from '../../utils/v4ToastMessages';

import {
	HybridFlowDefaults,
	HybridFlowEducationalContent,
	HybridFlowResponseTypeManager,
	HybridFlowCollapsibleSectionsManager,
	HybridFlowTokenProcessor,
	log,
} from '../../services/hybridFlowSharedService';

import { STEP_METADATA } from './config/OIDCHybridFlowV7.config';

const {
	Container,
	ContentWrapper,
	MainCard,
	StepHeader,
	StepHeaderLeft,
	StepHeaderTitle,
	StepHeaderSubtitle,
	StepHeaderRight,
	StepNumber,
	StepTotal,
	VersionBadge,
	CollapsibleSection,
	CollapsibleHeaderButton,
	CollapsibleTitle,
	CollapsibleContent,
	InfoBox,
	InfoTitle,
	InfoText,
	InfoList,
	ActionRow,
	Button,
	HighlightedActionButton,
	CodeBlock,
	GeneratedContentBox,
	GeneratedLabel,
	ParameterGrid,
	ParameterLabel,
	ParameterValue,
	HelperText,
} = FlowUIService.getFlowUIComponents();

const VariantSelector = FlowUIService.getVariantSelector?.();
const VariantButton = FlowUIService.getVariantButton?.();
const VariantTitle = FlowUIService.getVariantTitle?.();
const VariantDescription = FlowUIService.getVariantDescription?.();

type CredentialsUpdater = Parameters<ReturnType<typeof useHybridFlowControllerV7>['setCredentials']>[0];

const HYBRID_VARIANTS: Array<{
	id: 'code-id-token' | 'code-token' | 'code-id-token-token';
	title: string;
	description: string;
}> = [
	{
		id: 'code-id-token',
		title: 'Code + ID Token',
		description: 'Immediate ID token for authentication and a code for full token exchange.',
	},
	{
		id: 'code-token',
		title: 'Code + Access Token',
		description: 'Immediate access token plus authorization code for refresh token delivery.',
	},
	{
		id: 'code-id-token-token',
		title: 'Complete Hybrid',
		description: 'Returns ID token and access token alongside the authorization code.',
	},
];

const OIDCHybridFlowV7: React.FC = () => {
	usePageScroll({ pageName: 'OIDC Hybrid Flow V7', force: true });

	const controller = useHybridFlowControllerV7({
		enableDebugger: true,
	});

	const [currentStep, setCurrentStep] = useState(0);
	const [selectedVariant, setSelectedVariant] = useState(controller.flowVariant);
	const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(
		HybridFlowCollapsibleSectionsManager.getDefaultState()
	);
	const [isExchanging, setIsExchanging] = useState(false);
	const [workerToken, setWorkerToken] = useState<string>('');

	const toggleSection = useCallback(
		HybridFlowCollapsibleSectionsManager.createToggleHandler(setCollapsedSections),
		[]
	);

	useEffect(() => {
		setSelectedVariant(controller.flowVariant);
	}, [controller.flowVariant]);

	// Load worker token from localStorage on mount
	useEffect(() => {
		const savedToken = localStorage.getItem('worker-token');
		const savedEnv = localStorage.getItem('worker-token-env');
		
		if (savedToken && savedEnv === controller.credentials?.environmentId) {
			setWorkerToken(savedToken);
			console.log('[OIDCHybridFlowV7] Worker token loaded from localStorage');
		}
	}, [controller.credentials?.environmentId]);

	useEffect(() => {
		if (!controller.credentials) {
			return;
		}

		controller.setCredentials(((prev) => ({
			...prev,
			...HybridFlowDefaults.getDefaultCredentials(controller.flowVariant),
			responseType:
				HybridFlowDefaults.getFlowConfig(controller.flowVariant).responseType,
			scope:
				prev?.scope || HybridFlowDefaults.getDefaultCredentials(controller.flowVariant).scope || 'openid profile email',
			scopes:
				prev?.scopes || HybridFlowDefaults.getDefaultCredentials(controller.flowVariant).scope || 'openid profile email',
		})) as CredentialsUpdater);
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const handleVariantChange = useCallback(
		(variant: 'code-id-token' | 'code-token' | 'code-id-token-token') => {
			setSelectedVariant(variant);
			controller.setFlowVariant(variant);
			const defaults = HybridFlowDefaults.getDefaultCredentials(variant);
			controller.setCredentials(((prev) => ({
				...prev,
				responseType: defaults.responseType,
				scope: defaults.scope || prev?.scope || 'openid profile email',
				scopes: defaults.scope || prev?.scopes || 'openid profile email',
			})) as CredentialsUpdater);
			setCollapsedSections(HybridFlowCollapsibleSectionsManager.getDefaultState());
		},
		[controller]
	);

	const ensurePkce = useCallback(async () => {
		if (!controller.pkceCodes?.codeVerifier || !controller.pkceCodes.codeChallenge) {
			await controller.generatePKCE();
		}
	}, [controller]);

	const handleGenerateAuthorizationUrl = useCallback(async () => {
		if (!controller.credentials) {
			v4ToastManager.showError('Configure credentials before generating the authorization URL.');
			return;
		}

		try {
			controller.setIsLoading(true);
			await ensurePkce();
			controller.generateState();
			if (
				HybridFlowResponseTypeManager.getFlowConfig(
					controller.credentials.responseType || 'code id_token'
				)?.requiresNonce
			) {
				controller.generateNonce();
			}

			const url = controller.generateAuthorizationUrl();
			if (!url) {
				v4ToastManager.showError('Unable to generate authorization URL. Check required parameters.');
				return;
			}

			log.info('Authorization URL generated', { url });
			setCurrentStep(2);
			v4ToastManager.showSuccess('Authorization URL generated');
		} catch (error) {
			console.error('[OIDCHybridFlowV7] Failed to generate authorization URL', error);
			v4ToastManager.showError('Authorization URL generation failed');
		} finally {
			controller.setIsLoading(false);
		}
	}, [controller, ensurePkce]);

	const handleRedirectAuthorization = useCallback(() => {
		if (!controller.authorizationUrl) {
			v4ToastManager.showError('Generate the authorization URL before redirecting.');
			return;
		}

		window.open(controller.authorizationUrl, '_blank', 'noopener');
	}, [controller]);

	useEffect(() => {
		const hash = window.location.hash;
		if (!hash) {
			return;
		}

		const fragment = hash.startsWith('#') ? hash.substring(1) : hash;
		if (fragment.includes('id_token') || fragment.includes('access_token') || fragment.includes('code=')) {
			const fragmentTokens = HybridFlowTokenProcessor.processFragmentTokens(fragment);
			controller.setTokens(fragmentTokens);
			setCurrentStep(3);
			window.history.replaceState({}, document.title, window.location.pathname);
		}
	}, [controller]);

	const handleExchangeCode = useCallback(async () => {
		const code = controller.tokens?.code;
		if (!code) {
			v4ToastManager.showError('No authorization code available. Complete the authorization step first.');
			return;
		}

		try {
			setIsExchanging(true);
			const exchanged = await controller.exchangeCodeForTokens(code);
			controller.setTokens(exchanged);
			setCurrentStep(4);
			v4ToastManager.showSuccess('Authorization code exchanged for tokens');
		} catch (error) {
			console.error('[OIDCHybridFlowV7] Token exchange failed', error);
		} finally {
			setIsExchanging(false);
		}
	}, [controller]);

	const handleReset = useCallback(() => {
		controller.reset();
		setCurrentStep(0);
		setCollapsedSections(HybridFlowCollapsibleSectionsManager.getDefaultState());
		setSelectedVariant('code-id-token');
	}, [controller]);

	const isStepValid = useCallback(
		(stepIndex: number) => {
			switch (stepIndex) {
				case 0:
					return Boolean(
						controller.credentials?.environmentId &&
						controller.credentials?.clientId &&
						controller.credentials?.redirectUri
					);
				case 1:
					return Boolean(controller.flowVariant);
				case 2:
					return Boolean(controller.authorizationUrl);
				case 3:
					return Boolean(controller.tokens?.code);
				case 4:
					return Boolean(controller.tokens?.access_token);
				case 5:
					return Boolean(controller.tokens);
				default:
					return true;
			}
		},
		[controller]
	);

	const canNavigateNext = useCallback(() => {
		return currentStep < STEP_METADATA.length - 1 && isStepValid(currentStep);
	}, [currentStep, isStepValid]);

	const handleNextStep = useCallback(() => {
		if (!canNavigateNext()) {
			v4ToastManager.showError('Complete the required actions before continuing to the next step.');
			return;
		}
		setCurrentStep(prev => Math.min(prev + 1, STEP_METADATA.length - 1));
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}, [canNavigateNext]);

	const handlePreviousStep = useCallback(() => {
		setCurrentStep(prev => Math.max(prev - 1, 0));
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}, []);

	const renderedTokens = useMemo(() => {
		if (!controller.tokens) {
			return null;
		}

		return UnifiedTokenDisplayService.showTokens(
			controller.tokens,
			'oidc',
			'oidc-hybrid-v7',
			{
				showCopyButtons: true,
				showDecodeButtons: true,
			}
		);
	}, [controller.tokens]);

	const renderVariantSelector = () => (
		<VariantSelector>
			{HYBRID_VARIANTS.map(variant => (
				<VariantButton
					key={variant.id}
					$selected={selectedVariant === variant.id}
					onClick={() => handleVariantChange(variant.id)}
				>
					<VariantTitle>{variant.title}</VariantTitle>
					<VariantDescription>{variant.description}</VariantDescription>
				</VariantButton>
			))}
		</VariantSelector>
	);

	const renderCredentialsStep = () => {
		const educationalContent = HybridFlowEducationalContent.overview;

		return (
			<>
				<CollapsibleSection>
					<CollapsibleHeaderButton
						onClick={() => toggleSection('overview')}
						aria-expanded={!collapsedSections.overview}
					>
						<CollapsibleTitle>
							<FiInfo /> {educationalContent.title}
						</CollapsibleTitle>
						<FiChevronDown />
					</CollapsibleHeaderButton>
					{!collapsedSections.overview && (
						<CollapsibleContent>
							<InfoBox $variant="info">
								<FiInfo size={20} />
								<div>
									<InfoTitle>Hybrid Flow Overview</InfoTitle>
									<InfoText>{educationalContent.description}</InfoText>
								</div>
							</InfoBox>

							<InfoBox $variant="warning">
								<FiAlertTriangle size={20} />
								<div>
									<InfoTitle>Security Checklist</InfoTitle>
									<InfoList>
										<li>Enable PKCE for code exchange security.</li>
										<li>Validate ID token signature and claims.</li>
										<li>Verify state and nonce parameters.</li>
									</InfoList>
								</div>
							</InfoBox>
						</CollapsibleContent>
					)}
				</CollapsibleSection>

				<ComprehensiveCredentialsService
					flowType="oidc-hybrid-v7"
					environmentId={controller.credentials?.environmentId ?? ''}
					clientId={controller.credentials?.clientId ?? ''}
					clientSecret={controller.credentials?.clientSecret ?? ''}
					redirectUri={controller.credentials?.redirectUri ?? ''}
					scopes={controller.credentials?.scopes ?? 'openid profile email'}
					postLogoutRedirectUri={controller.credentials?.postLogoutRedirectUri ?? ''}
					onEnvironmentIdChange={value => controller.setCredentials({ ...controller.credentials, environmentId: value })}
					onClientIdChange={value => controller.setCredentials({ ...controller.credentials, clientId: value })}
					onClientSecretChange={value => controller.setCredentials({ ...controller.credentials, clientSecret: value })}
					onRedirectUriChange={value => controller.setCredentials({ ...controller.credentials, redirectUri: value })}
					onScopesChange={value => controller.setCredentials({ ...controller.credentials, scope: value, scopes: value })}
					onSave={controller.saveCredentials}
					requireClientSecret
					showAdvancedConfig
					defaultCollapsed={false}

					// Config Checker
					showConfigChecker={true}
					workerToken={workerToken}
					region={'NA'}
				/>
			</>
		);
	};

	const renderVariantStep = () => (
		<CollapsibleSection>
			<CollapsibleHeaderButton
				onClick={() => toggleSection('responseType')}
				aria-expanded={!collapsedSections.responseType}
			>
				<CollapsibleTitle>
					<FiKey /> Choose Hybrid Variant
				</CollapsibleTitle>
				<FiChevronDown />
			</CollapsibleHeaderButton>
			{!collapsedSections.responseType && (
				<CollapsibleContent>
					{renderVariantSelector()}

					<ParameterGrid>
						<div>
							<ParameterLabel>Response Type</ParameterLabel>
							<ParameterValue>
								{HybridFlowDefaults.getFlowConfig(selectedVariant).responseType}
							</ParameterValue>
						</div>
						<div>
							<ParameterLabel>Requires Nonce</ParameterLabel>
							<ParameterValue>
								{HybridFlowDefaults.getFlowConfig(selectedVariant).requiresNonce ? 'Yes' : 'No'}
							</ParameterValue>
						</div>
					</ParameterGrid>

					<InfoBox $variant="info">
						<FiShield size={20} />
						<div>
							<InfoTitle>Security Notes</InfoTitle>
							<InfoList>
								{HybridFlowEducationalContent.responseTypes[HybridFlowDefaults.getFlowConfig(selectedVariant).responseType].security.map((item: string) => (
									<li key={item}>{item}</li>
								))}
							</InfoList>
						</div>
					</InfoBox>
				</CollapsibleContent>
			)}
		</CollapsibleSection>
	);

	const renderAuthorizationStep = () => (
		<CollapsibleSection>
			<CollapsibleHeaderButton
				onClick={() => toggleSection('authorizationUrl')}
				aria-expanded={!collapsedSections.authorizationUrl}
			>
				<CollapsibleTitle>
					<FiGlobe /> Authorization Request
				</CollapsibleTitle>
				<FiChevronDown />
			</CollapsibleHeaderButton>
			{!collapsedSections.authorizationUrl && (
				<CollapsibleContent>
					<HelperText>Generate PKCE parameters, then build and launch the authorization request.</HelperText>

					<ActionRow>
						<Button variant="secondary" onClick={controller.generatePKCE} loading={controller.isLoading}>
							<FiKey /> Generate PKCE
						</Button>
						<HighlightedActionButton
							onClick={handleGenerateAuthorizationUrl}
							priority="primary"
							loading={controller.isLoading}
						>
							<FiRefreshCw /> Generate URL
						</HighlightedActionButton>
						{controller.authorizationUrl && (
							<HighlightedActionButton onClick={handleRedirectAuthorization} priority="success">
								<FiExternalLink /> Redirect to PingOne
							</HighlightedActionButton>
						)}
					</ActionRow>

					{controller.pkceCodes?.codeVerifier && (
						<GeneratedContentBox>
							<GeneratedLabel>PKCE Parameters</GeneratedLabel>
							<CodeBlock>{JSON.stringify(controller.pkceCodes, null, 2)}</CodeBlock>
						</GeneratedContentBox>
					)}

					{controller.authorizationUrl && (
						<GeneratedContentBox>
							<GeneratedLabel>Authorization URL</GeneratedLabel>
							<ColoredUrlDisplay
								url={controller.authorizationUrl}
								label="OIDC Hybrid Authorization URL"
								showCopyButton
								showInfoButton
								showOpenButton
								onOpen={handleRedirectAuthorization}
							/>
						</GeneratedContentBox>
					)}
				</CollapsibleContent>
			)}
		</CollapsibleSection>
	);

	const renderFragmentStep = () => (
		<CollapsibleSection>
			<CollapsibleHeaderButton
				onClick={() => toggleSection('response')}
				aria-expanded={!collapsedSections.response}
			>
				<CollapsibleTitle>
					<FiCheckCircle /> Authorization Response
				</CollapsibleTitle>
				<FiChevronDown />
			</CollapsibleHeaderButton>
			{!collapsedSections.response && (
				<CollapsibleContent>
					{controller.tokens ? (
						<>
							<InfoBox $variant="success">
								<FiCheckCircle size={20} />
								<div>
									<InfoTitle>Tokens received from PingOne</InfoTitle>
									<InfoText>
										The hybrid response delivered immediate tokens alongside the authorization code.
									</InfoText>
								</div>
							</InfoBox>

							<GeneratedContentBox>
								<GeneratedLabel>Raw Response</GeneratedLabel>
								<CodeBlock>{JSON.stringify(controller.tokens, null, 2)}</CodeBlock>
								<ActionRow>
									<CopyButtonService
										text={JSON.stringify(controller.tokens, null, 2)}
										label="Copy token JSON"
										variant="primary"
									/>
								</ActionRow>
							</GeneratedContentBox>

							{renderedTokens}

							<ActionRow>
								<HighlightedActionButton
									onClick={handleExchangeCode}
									priority="primary"
									loading={isExchanging || controller.isExchangingCode}
									disabled={!controller.tokens.code}
								>
									<FiRefreshCw /> Exchange Authorization Code
								</HighlightedActionButton>
							</ActionRow>
						</>
					) : (
						<HelperText>
							Complete the authorization step and return to the callback to populate tokens.
						</HelperText>
					)}
				</CollapsibleContent>
			)}
		</CollapsibleSection>
	);

	const renderTokenAnalysisStep = () => (
		<>
			<CollapsibleSection>
				<CollapsibleHeaderButton
					onClick={() => toggleSection('tokens')}
					aria-expanded={!collapsedSections.tokens}
				>
					<CollapsibleTitle>
						<FiShield /> Token Validation & Introspection
					</CollapsibleTitle>
					<FiChevronDown />
				</CollapsibleHeaderButton>
				{!collapsedSections.tokens && (
					<CollapsibleContent>
						{controller.tokens ? (
							<>
								{renderedTokens}
								<TokenIntrospect tokens={controller.tokens ?? undefined} flowKey="oidc-hybrid-v7" />
							</>
						) : (
							<HelperText>No tokens available yet. Generate and exchange tokens first.</HelperText>
						)}
					</CollapsibleContent>
				)}
			</CollapsibleSection>

			<CollapsibleSection>
				<CollapsibleHeaderButton
					onClick={() => toggleSection('securityOverview')}
					aria-expanded={!collapsedSections.securityOverview}
				>
					<CollapsibleTitle>
						<FiAlertCircle /> Security Playbooks
					</CollapsibleTitle>
					<FiChevronDown />
				</CollapsibleHeaderButton>
				{!collapsedSections.securityOverview && (
					<CollapsibleContent>
						<SecurityFeaturesDemo
							flowType="oidc-hybrid"
							flowKey="oidc-hybrid-v7"
							tokens={controller.tokens ?? undefined}
							credentials={controller.credentials ?? undefined}
							variant={selectedVariant === 'code-id-token' ? 'oidc' : 'oauth'}
						/>
					</CollapsibleContent>
				)}
			</CollapsibleSection>
		</>
	);

	const renderCompletionStep = () => (
		<FlowCompletionService
			config={{
				...FlowCompletionConfigs.hybrid,
				onStartNewFlow: handleReset,
				showIntrospection: true,
			}}
		/>
	);

	const renderStepContent = useMemo(() => {
		switch (currentStep) {
			case 0:
				return renderCredentialsStep();
			case 1:
				return renderVariantStep();
			case 2:
				return renderAuthorizationStep();
			case 3:
				return renderFragmentStep();
			case 4:
				return renderTokenAnalysisStep();
			case 5:
				return renderCompletionStep();
			default:
				return <div>Step not implemented</div>;
		}
	}, [currentStep, renderCompletionStep, selectedVariant, collapsedSections, controller.tokens]);

	return (
		<Container>
			<ContentWrapper>
				<FlowHeader flowId="oidc-hybrid-v7" />

				<MainCard>
					<StepHeader>
						<StepHeaderLeft>
							<VersionBadge>V7</VersionBadge>
							<StepHeaderTitle>{STEP_METADATA[currentStep].title}</StepHeaderTitle>
							<StepHeaderSubtitle>{STEP_METADATA[currentStep].subtitle}</StepHeaderSubtitle>
						</StepHeaderLeft>
						<StepHeaderRight>
							<StepNumber>{String(currentStep + 1).padStart(2, '0')}</StepNumber>
							<StepTotal>of {STEP_METADATA.length}</StepTotal>
						</StepHeaderRight>
					</StepHeader>

					{renderStepContent}
				</MainCard>

				<StepNavigationButtons
					currentStep={currentStep}
					totalSteps={STEP_METADATA.length}
					onPrevious={handlePreviousStep}
					onNext={handleNextStep}
					onReset={handleReset}
					canNavigateNext={canNavigateNext()}
					isFirstStep={currentStep === 0}
					nextButtonText="Next"
					stepRequirements={STEP_METADATA.map(s => s.description ?? '')}
				/>
			</ContentWrapper>
		</Container>
	);
};

export default OIDCHybridFlowV7;
