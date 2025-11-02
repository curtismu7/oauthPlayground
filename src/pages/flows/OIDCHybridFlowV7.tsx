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
import { checkCredentialsAndWarn } from '../../utils/credentialsWarningService';
import { FlowCredentialService } from '../../services/flowCredentialService';
import { useCredentialBackup } from '../../hooks/useCredentialBackup';
import { CopyButtonService } from '../../services/copyButtonService';
import ColoredUrlDisplay from '../../components/ColoredUrlDisplay';
import SecurityFeaturesDemo from '../../components/SecurityFeaturesDemo';
import TokenIntrospect from '../../components/TokenIntrospect';
import { UnifiedTokenDisplayService } from '../../services/unifiedTokenDisplayService';
import { v4ToastManager } from '../../utils/v4ToastMessages';
import { LearningTooltip } from '../../components/LearningTooltip';

import {
	HybridFlowDefaults,
	HybridFlowEducationalContent,
	HybridFlowResponseTypeManager,
	HybridFlowCollapsibleSectionsManager,
	HybridFlowTokenProcessor,
	log,
} from '../../services/hybridFlowSharedService';

// Import V7 Shared Service for compliance features
import { V7SharedService } from '../../services/v7SharedService';
import type { V7FlowName } from '../../services/v7SharedService';

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
	title: string | React.ReactNode;
	description: string | React.ReactNode;
}> = [
	{
		id: 'code-id-token',
		title: (
			<>
				<LearningTooltip variant="learning" title="Authorization Code" content="Short-lived credential returned in URL fragment for OIDC Hybrid flows" placement="top">Code</LearningTooltip>
				{' + '}
				<LearningTooltip variant="learning" title="ID Token" content="OIDC JWT with user identity, returned immediately in URL fragment" placement="top">ID Token</LearningTooltip>
			</>
		),
		description: (
			<>Immediate{' '}
			<LearningTooltip variant="learning" title="ID Token" content="JWT containing user identity - returned in URL fragment" placement="top">ID token</LearningTooltip>
			{' '}for authentication and a{' '}
			<LearningTooltip variant="learning" title="Authorization Code" content="Code exchanged for full token set including refresh token" placement="top">code</LearningTooltip>
			{' '}for full token exchange.
			</>
		),
	},
	{
		id: 'code-token',
		title: (
			<>
				<LearningTooltip variant="learning" title="Authorization Code" content="Short-lived credential for token exchange" placement="top">Code</LearningTooltip>
				{' + '}
				<LearningTooltip variant="learning" title="Access Token" content="Bearer token for API access, returned immediately in fragment" placement="top">Access Token</LearningTooltip>
			</>
		),
		description: (
			<>Immediate{' '}
			<LearningTooltip variant="learning" title="Access Token" content="Bearer token for API authentication" placement="top">access token</LearningTooltip>
			{' '}plus{' '}
			<LearningTooltip variant="learning" title="Authorization Code" content="Code used to get refresh token" placement="top">authorization code</LearningTooltip>
			{' '}for{' '}
			<LearningTooltip variant="learning" title="Refresh Token" content="Long-lived token to get new access tokens" placement="top">refresh token</LearningTooltip>
			{' '}delivery.
			</>
		),
	},
	{
		id: 'code-id-token-token',
		title: 'Complete Hybrid',
		description: (
			<>Returns{' '}
			<LearningTooltip variant="learning" title="ID Token" content="JWT with user identity" placement="top">ID token</LearningTooltip>
			{' '}and{' '}
			<LearningTooltip variant="learning" title="Access Token" content="Bearer token for API access" placement="top">access token</LearningTooltip>
			{' '}alongside the{' '}
			<LearningTooltip variant="learning" title="Authorization Code" content="Code for full token exchange" placement="top">authorization code</LearningTooltip>.
			</>
		),
	},
];

const OIDCHybridFlowV7: React.FC = () => {
	usePageScroll({ pageName: 'OIDC Hybrid Flow V7', force: true });
	// Check credentials on mount and show warning if missing
	useEffect(() => {
		checkCredentialsAndWarn(controller.credentials, {
			flowName: 'OIDC Hybrid Flow',
			requiredFields: ["environmentId","clientId","clientSecret"],
			showToast: true
		});
	}, []); // Only run once on mount

	// Initialize V7 compliance features
	const flowName: V7FlowName = 'oidc-hybrid-v7';
	const v7FlowConfig = V7SharedService.initializeFlow(flowName, {
		enableIDTokenValidation: true,
		enableParameterValidation: true,
		enableErrorHandling: true,
		enableSecurityHeaders: true
	});

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

	// V7 compliance state
	const [complianceStatus, setComplianceStatus] = useState(v7FlowConfig.compliance);
	const [validationResults, setValidationResults] = useState<any>(null);
	const [errorStats, setErrorStats] = useState(V7SharedService.ErrorHandling.getErrorStatistics());

	const toggleSection = useCallback(
		HybridFlowCollapsibleSectionsManager.createToggleHandler(setCollapsedSections),
		[]
	);

	// V7 compliance functions
	const validateHybridParameters = useCallback((parameters: Record<string, any>) => {
		const validation = V7SharedService.ParameterValidation.validateFlowParameters(flowName, parameters);
		setValidationResults(validation);
		
		if (!validation.isValid) {
			const errorResponse = V7SharedService.ErrorHandling.createScenarioError('invalid_request', {
				flowName,
				step: 'hybrid_authorization_request',
				operation: 'parameter_validation',
				timestamp: Date.now()
			});
			v4ToastManager.showError(`Parameter validation failed: ${validation.errors.join(', ')}`);
			return { success: false, error: errorResponse };
		}
		
		v4ToastManager.showSuccess('Parameter validation successful');
		return { success: true, validation };
	}, [flowName]);

	const validateIDToken = useCallback(async (idToken: string, expectedIssuer: string, expectedAudience: string, expectedNonce?: string) => {
		try {
			const validation = await V7SharedService.IDTokenValidation.validateIDToken(
				idToken,
				expectedIssuer,
				expectedAudience,
				expectedNonce,
				undefined, // jwksUri - would be provided in real implementation
				flowName
			);

			if (!validation.isValid) {
				const errorResponse = V7SharedService.ErrorHandling.createScenarioError('invalid_token', {
					flowName,
					step: 'id_token_validation',
					operation: 'token_validation',
					timestamp: Date.now()
				});
				v4ToastManager.showError(`ID token validation failed: ${validation.errors.join(', ')}`);
				return { success: false, error: errorResponse, validation };
			}

			v4ToastManager.showSuccess('ID token validation successful');
			return { success: true, validation };
		} catch (error) {
			const errorResponse = V7SharedService.ErrorHandling.handleOIDCError(error, {
				flowName,
				step: 'id_token_validation',
				operation: 'token_validation',
				timestamp: Date.now()
			});
			v4ToastManager.showError(`ID token validation error: ${errorResponse.error_description}`);
			return { success: false, error: errorResponse };
		}
	}, [flowName]);

	const getSecurityHeaders = useCallback(() => {
		return V7SharedService.SecurityHeaders.getSecurityHeaders(flowName);
	}, [flowName]);

	const getComplianceScore = useCallback(() => {
		return V7SharedService.SpecificationCompliance.checkFlowCompliance(flowName);
	}, [flowName]);

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

	// Ensure OIDC Hybrid Flow V7 uses its own credential storage
	useEffect(() => {
		// Save current credentials to flow-specific storage
		if (controller.credentials && (controller.credentials.environmentId || controller.credentials.clientId)) {
			console.log('🔧 [OIDC Hybrid V7] Saving credentials to flow-specific storage:', {
				flowKey: 'hybrid-flow-v7',
				environmentId: controller.credentials.environmentId,
				clientId: controller.credentials.clientId?.substring(0, 8) + '...',
				redirectUri: controller.credentials.redirectUri
			});
			
			// Save to flow-specific storage with enhanced error handling
			FlowCredentialService.saveFlowCredentials('hybrid-flow-v7', controller.credentials, {
				showToast: false
			}).catch((error) => {
				console.error('[OIDC Hybrid V7] Failed to save credentials to V7 storage:', error);
				// Show user-friendly error message
				v4ToastManager.showError('Failed to save credentials. Please try again.');
			});
		}
	}, [controller.credentials]);

	// Use credential backup hook for automatic backup and restoration
	const { clearBackup, getBackupStats, downloadEnvFile } = useCredentialBackup({
		flowKey: 'hybrid-flow-v7',
		credentials: controller.credentials,
		setCredentials: controller.setCredentials,
		enabled: true
	});

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
		
		// Clear OIDC Hybrid Flow V7-specific storage with error handling
		try {
			FlowCredentialService.clearFlowState('hybrid-flow-v7');
			console.log('🔧 [OIDC Hybrid V7] Cleared flow-specific storage');
		} catch (error) {
			console.error('[OIDC Hybrid V7] Failed to clear flow state:', error);
			v4ToastManager.showError('Failed to clear flow state. Please refresh the page.');
		}
		
		// Clear credential backup when flow is reset
		try {
			clearBackup();
			console.log('🔧 [OIDC Hybrid V7] Cleared credential backup');
		} catch (error) {
			console.error('[OIDC Hybrid V7] Failed to clear credential backup:', error);
		}
	}, [controller, clearBackup]);

	const isStepValid = useCallback(
		(stepIndex: number) => {
			switch (stepIndex) {
				case 0:
					// Step 0: Must have valid credentials
					return Boolean(
						controller.credentials?.environmentId &&
						controller.credentials?.clientId &&
						controller.credentials?.redirectUri
					);
				case 1:
					// Step 1: Must have selected flow variant
					return Boolean(controller.flowVariant);
				case 2:
					// Step 2: Must have generated authorization URL
					return Boolean(controller.authorizationUrl);
				case 3:
					// Step 3: Must have authorization code from callback
					return Boolean(controller.tokens?.code);
				case 4:
					// Step 4: Must have access token from exchange
					return Boolean(controller.tokens?.access_token);
				case 5:
					// Step 5: Must have tokens for completion
					return Boolean(controller.tokens);
				default:
					return true;
			}
		},
		[controller]
	);

	// Get step validation error message
	const getStepValidationMessage = useCallback((stepIndex: number): string => {
		switch (stepIndex) {
			case 0:
				if (!controller.credentials?.environmentId) return 'Environment ID is required';
				if (!controller.credentials?.clientId) return 'Client ID is required';
				if (!controller.credentials?.redirectUri) return 'Redirect URI is required';
				return '';
			case 1:
				if (!controller.flowVariant) return 'Flow variant must be selected';
				return '';
			case 2:
				if (!controller.authorizationUrl) return 'Authorization URL must be generated';
				return '';
			case 3:
				if (!controller.tokens?.code) return 'Authorization code is required. Complete the authorization step first.';
				return '';
			case 4:
				if (!controller.tokens?.access_token) return 'Access token is required. Complete the token exchange step first.';
				return '';
			case 5:
				if (!controller.tokens) return 'Tokens are required for completion';
				return '';
			default:
				return '';
		}
	}, [controller]);

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
									<InfoTitle>
										<LearningTooltip variant="learning" title="OIDC Hybrid Flow" content="OIDC flow (OIDC Core 1.0) that combines Authorization Code and Implicit flows. Returns tokens in URL fragment AND allows code exchange for refresh tokens." placement="top">
											Hybrid Flow
										</LearningTooltip> Overview
									</InfoTitle>
									<InfoText>
										<LearningTooltip variant="info" title="OIDC Hybrid Flow" content="OIDC flow returning tokens in URL fragment AND authorization code for exchange" placement="top">OIDC Hybrid Flow</LearningTooltip> combines elements of{' '}
										<LearningTooltip variant="info" title="Authorization Code Flow" content="OAuth 2.0 flow using authorization code" placement="top">Authorization Code</LearningTooltip> and{' '}
										<LearningTooltip variant="warning" title="Implicit Flow" content="Deprecated OAuth flow - tokens returned in URL fragment" placement="top">Implicit</LearningTooltip> flows.{' '}
										{educationalContent.description}
									</InfoText>
								</div>
							</InfoBox>

							<InfoBox $variant="success">
								<FiCheckCircle size={20} />
								<div>
									<InfoTitle>Key Benefits</InfoTitle>
									<InfoList>
										{educationalContent.benefits.map((benefit, index) => (
											<li key={index}>{benefit}</li>
										))}
									</InfoList>
								</div>
							</InfoBox>

							<InfoBox $variant="info">
								<FiInfo size={20} />
								<div>
									<InfoTitle>Use Cases</InfoTitle>
									<InfoList>
										{educationalContent.useCases.map((useCase, index) => (
											<li key={index}>{useCase}</li>
										))}
									</InfoList>
								</div>
							</InfoBox>

							<InfoBox $variant="warning">
								<FiAlertTriangle size={20} />
								<div>
									<InfoTitle>Security Requirements</InfoTitle>
									<InfoList>
										{educationalContent.security.map((requirement, index) => (
											<li key={index}>{requirement}</li>
										))}
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

	const renderVariantStep = () => {
		const currentResponseType = HybridFlowDefaults.getFlowConfig(selectedVariant).responseType;
		const responseTypeInfo = HybridFlowEducationalContent.responseTypes[currentResponseType];

		return (
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
						<InfoBox $variant="info">
							<FiInfo size={20} />
							<div>
								<InfoTitle>
									<LearningTooltip variant="learning" title="Hybrid Variant" content="OIDC Hybrid flow variant (response_type) that determines which tokens are returned immediately in URL fragment" placement="top">
										Hybrid Variant
									</LearningTooltip> Selection
								</InfoTitle>
								<InfoText>
									Choose the{' '}
									<LearningTooltip variant="learning" title="response_type" content="OAuth parameter specifying which tokens to return. Hybrid uses combinations like 'code id_token', 'code token', 'code id_token token'." placement="top">hybrid response type</LearningTooltip>
									{' '}that best fits your application's{' '}
									<LearningTooltip variant="info" title="Authentication" content="Verifying user identity" placement="top">authentication</LearningTooltip> and{' '}
									<LearningTooltip variant="info" title="Authorization" content="Granting access to resources" placement="top">authorization</LearningTooltip> needs.
								</InfoText>
							</div>
						</InfoBox>

						{renderVariantSelector()}

						<ParameterGrid>
							<div>
								<ParameterLabel>
									<LearningTooltip variant="learning" title="response_type" content="OAuth parameter specifying requested tokens. Hybrid uses: 'code id_token', 'code token', or 'code id_token token'." placement="top">
										Response Type
									</LearningTooltip>
								</ParameterLabel>
								<ParameterValue>
									{HybridFlowDefaults.getFlowConfig(selectedVariant).responseType}
								</ParameterValue>
							</div>
							<div>
								<ParameterLabel>
									<LearningTooltip variant="security" title="Nonce" content="Number used once - random value for replay protection. Required when ID token is returned in fragment." placement="top">
										Requires Nonce
									</LearningTooltip>
								</ParameterLabel>
								<ParameterValue>
									{HybridFlowDefaults.getFlowConfig(selectedVariant).requiresNonce ? 'Yes' : 'No'}
								</ParameterValue>
							</div>
						</ParameterGrid>

						<InfoBox $variant="success">
							<FiCheckCircle size={20} />
							<div>
								<InfoTitle>Selected Variant: {responseTypeInfo.description}</InfoTitle>
								<InfoText>Benefits of this response type:</InfoText>
								<InfoList>
									{responseTypeInfo.benefits.map((benefit, index) => (
										<li key={index}>{benefit}</li>
									))}
								</InfoList>
							</div>
						</InfoBox>

						<InfoBox $variant="info">
							<FiInfo size={20} />
							<div>
								<InfoTitle>Use Cases</InfoTitle>
								<InfoList>
									{responseTypeInfo.useCases.map((useCase, index) => (
										<li key={index}>{useCase}</li>
									))}
								</InfoList>
							</div>
						</InfoBox>

						<InfoBox $variant="warning">
							<FiShield size={20} />
							<div>
								<InfoTitle>Security Requirements</InfoTitle>
								<InfoList>
									{responseTypeInfo.security.map((item, index) => (
										<li key={index}>{item}</li>
									))}
								</InfoList>
							</div>
						</InfoBox>
					</CollapsibleContent>
				)}
			</CollapsibleSection>
		);
	};

	const renderAuthorizationStep = () => {
		const stepInfo = HybridFlowEducationalContent.flowSteps.step3;

		return (
			<>
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
							<InfoBox $variant="info">
								<FiInfo size={20} />
								<div>
									<InfoTitle>{stepInfo.title}</InfoTitle>
									<InfoText>{stepInfo.description}</InfoText>
								</div>
							</InfoBox>

							<InfoBox $variant="success">
								<FiCheckCircle size={20} />
								<div>
									<InfoTitle>Required Actions</InfoTitle>
									<InfoList>
										{stepInfo.actions.map((action, index) => (
											<li key={index}>{action}</li>
										))}
									</InfoList>
								</div>
							</InfoBox>

							<HelperText>
								Generate{' '}
								<LearningTooltip variant="learning" title="PKCE" content="RFC 7636 - Proof Key for Code Exchange, security extension for OAuth flows" placement="top">PKCE</LearningTooltip>
								{' '}parameters, then build and launch the{' '}
								<LearningTooltip variant="learning" title="Authorization Request" content="OAuth request redirecting user to authorize app" placement="top">authorization request</LearningTooltip>.
							</HelperText>

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

				<CollapsibleSection>
					<CollapsibleHeaderButton
						onClick={() => toggleSection('hybridSecurity')}
						aria-expanded={!collapsedSections.hybridSecurity}
					>
						<CollapsibleTitle>
							<FiShield /> Hybrid Flow Security
						</CollapsibleTitle>
						<FiChevronDown />
					</CollapsibleHeaderButton>
					{!collapsedSections.hybridSecurity && (
						<CollapsibleContent>
							<InfoBox $variant="warning">
								<FiAlertTriangle size={20} />
								<div>
									<InfoTitle>Security Best Practices</InfoTitle>
									<InfoList>
										{HybridFlowEducationalContent.bestPractices.security.map((practice, index) => (
											<li key={index}>{practice}</li>
										))}
									</InfoList>
								</div>
							</InfoBox>

							<InfoBox $variant="info">
								<FiInfo size={20} />
								<div>
									<InfoTitle>Implementation Guidelines</InfoTitle>
									<InfoList>
										{HybridFlowEducationalContent.bestPractices.implementation.map((guideline, index) => (
											<li key={index}>{guideline}</li>
										))}
									</InfoList>
								</div>
							</InfoBox>
						</CollapsibleContent>
					)}
				</CollapsibleSection>
			</>
		);
	};

	const renderFragmentStep = () => (
		<>
			<CollapsibleSection>
				<CollapsibleHeaderButton
					onClick={() => toggleSection('responseOverview')}
					aria-expanded={!collapsedSections.responseOverview}
				>
					<CollapsibleTitle>
						<FiCheckCircle /> Hybrid Authorization Response Overview
					</CollapsibleTitle>
					<FiChevronDown />
				</CollapsibleHeaderButton>
				{!collapsedSections.responseOverview && (
					<CollapsibleContent>
						<InfoBox $variant="success">
							<FiCheckCircle size={20} />
							<div>
								<InfoTitle>
									<LearningTooltip variant="learning" title="Hybrid Authorization Response" content="OIDC Hybrid response with tokens in URL fragment (#) and authorization code for exchange" placement="top">
										Hybrid Authorization Response
									</LearningTooltip>
								</InfoTitle>
								<InfoText>
									The{' '}
									<LearningTooltip variant="learning" title="Hybrid Flow" content="OIDC flow combining Authorization Code and Implicit patterns" placement="top">hybrid flow</LearningTooltip> delivers immediate{' '}
									<LearningTooltip variant="learning" title="Tokens" content="ID token and/or access token returned in URL fragment" placement="top">tokens</LearningTooltip> ({' '}
									<LearningTooltip variant="learning" title="ID Token" content="JWT with user identity" placement="top">ID token</LearningTooltip>,{' '}
									<LearningTooltip variant="learning" title="Access Token" content="Bearer token for API access" placement="top">access token</LearningTooltip>
									{' '}) in the{' '}
									<LearningTooltip variant="info" title="URL Fragment" content="Part of URL after # symbol - not sent to server, processed client-side. Used in OIDC Hybrid and Implicit flows." placement="top">URL fragment</LearningTooltip>
									{' '}alongside the{' '}
									<LearningTooltip variant="learning" title="Authorization Code" content="Code exchanged for full token set including refresh token" placement="top">authorization code</LearningTooltip>, providing both immediate{' '}
									<LearningTooltip variant="info" title="Authentication" content="User identity verification" placement="top">authentication</LearningTooltip> and
									{' '}secure{' '}
									<LearningTooltip variant="learning" title="Token Exchange" content="Exchanging authorization code for tokens server-side" placement="top">token exchange</LearningTooltip> capabilities.
								</InfoText>
							</div>
						</InfoBox>

						<InfoBox $variant="info">
							<FiInfo size={20} />
							<div>
								<InfoTitle>Response Processing</InfoTitle>
								<InfoText>
									After authorization, PingOne returns tokens in the URL fragment. The hybrid flow 
									processes both immediate tokens and the authorization code for secure token exchange.
								</InfoText>
							</div>
						</InfoBox>
					</CollapsibleContent>
				)}
			</CollapsibleSection>

			<CollapsibleSection>
				<CollapsibleHeaderButton
					onClick={() => toggleSection('responseDetails')}
					aria-expanded={!collapsedSections.responseDetails}
				>
					<CollapsibleTitle>
						<FiPackage /> Process Hybrid Response
					</CollapsibleTitle>
					<FiChevronDown />
				</CollapsibleHeaderButton>
				{!collapsedSections.responseDetails && (
					<CollapsibleContent>
						<HelperText>
							Process the hybrid response tokens and authorization code returned from PingOne authorization.
						</HelperText>

						{controller.tokens ? (
							<>
								<InfoBox $variant="success">
									<FiCheckCircle size={20} />
									<div>
										<InfoTitle>Hybrid Response Received</InfoTitle>
										<InfoText>
											Successfully captured immediate tokens and authorization code from the hybrid response.
										</InfoText>
									</div>
								</InfoBox>

								<GeneratedContentBox>
									<GeneratedLabel>Raw Hybrid Response</GeneratedLabel>
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
							<>
								<InfoBox $variant="warning">
									<FiAlertTriangle size={20} />
									<div>
										<InfoTitle>No Response Data</InfoTitle>
										<InfoText>
											Complete the authorization step and return to this page to process the hybrid response.
										</InfoText>
									</div>
								</InfoBox>

								<HelperText>
									If you've completed authorization but don't see tokens here, check that:
								</HelperText>
								<InfoList>
									<li>The authorization was successful (no error in URL)</li>
									<li>You're using the correct redirect URI</li>
									<li>The response type matches your hybrid variant selection</li>
									<li>Your PingOne application supports the selected response type</li>
								</InfoList>
							</>
						)}
					</CollapsibleContent>
				)}
			</CollapsibleSection>

			<CollapsibleSection>
				<CollapsibleHeaderButton
					onClick={() => toggleSection('hybridBenefits')}
					aria-expanded={!collapsedSections.hybridBenefits}
				>
					<CollapsibleTitle>
						<FiShield /> Hybrid Flow Benefits & Security
					</CollapsibleTitle>
					<FiChevronDown />
				</CollapsibleHeaderButton>
				{!collapsedSections.hybridBenefits && (
					<CollapsibleContent>
						<InfoBox $variant="info">
							<FiInfo size={20} />
							<div>
								<InfoTitle>Why Use Hybrid Flow?</InfoTitle>
								<InfoText>
									The hybrid flow combines the security of authorization code flow with the 
									immediate token delivery of implicit flow, providing:
								</InfoText>
								<InfoList>
									<li>Immediate ID token for user authentication</li>
									<li>Secure authorization code for token exchange</li>
									<li>Reduced server round-trips</li>
									<li>Enhanced security with PKCE support</li>
									<li>OIDC compliance with proper token validation</li>
								</InfoList>
							</div>
						</InfoBox>

						<InfoBox $variant="warning">
							<FiAlertTriangle size={20} />
							<div>
								<InfoTitle>Security Considerations</InfoTitle>
								<InfoText>
									Hybrid flow requires careful handling of both immediate tokens and authorization codes:
								</InfoText>
								<InfoList>
									<li>Validate ID token signature and claims</li>
									<li>Verify state and nonce parameters</li>
									<li>Exchange authorization code securely</li>
									<li>Use HTTPS for all redirect URIs</li>
								</InfoList>
							</div>
						</InfoBox>
					</CollapsibleContent>
				)}
			</CollapsibleSection>
		</>
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
					disabledMessage={getStepValidationMessage(currentStep)}
					stepRequirements={STEP_METADATA.map(s => s.description ?? '')}
				/>
			</ContentWrapper>
		</Container>
	);
};

export default OIDCHybridFlowV7;
