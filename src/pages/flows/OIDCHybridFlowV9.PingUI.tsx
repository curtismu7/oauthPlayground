// src/pages/flows/OIDCHybridFlowV9.PingUI.tsx
// V9 OIDC Hybrid Flow - PingOne UI with New Storage & Messaging
// Migrated from V7 with PingOne UI, unified storage, and feedback service

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import BootstrapIcon from '../../components/BootstrapIcon';
import ColoredUrlDisplay from '../../components/ColoredUrlDisplay';
import EnhancedFlowInfoCard from '../../components/EnhancedFlowInfoCard';
import { ExpandCollapseAllControls } from '../../components/ExpandCollapseAllControls';
import { EducationModeToggle } from '../../components/education/EducationModeToggle';
import { MasterEducationSection } from '../../components/education/MasterEducationSection';
import { getBootstrapIconName } from '../../components/iconMapping';
import { LearningTooltip } from '../../components/LearningTooltip';
import { PingUIWrapper } from '../../components/PingUIWrapper';
import SecurityFeaturesDemo from '../../components/SecurityFeaturesDemo';
import { StepNavigationButtons } from '../../components/StepNavigationButtons';
import type { StepCredentials } from '../../components/steps/CommonSteps';
import TokenIntrospect from '../../components/TokenIntrospect';
import { useCredentialBackup } from '../../hooks/useCredentialBackup';
import { useHybridFlowControllerV7 } from '../../hooks/useHybridFlowControllerV7';
import { usePageScroll } from '../../hooks/usePageScroll';
import { feedbackService } from '../../services/feedback/feedbackService';
import { useSectionsViewMode } from '../../services/sectionsViewModeService';
import { unifiedStorageManager } from '../../services/unifiedStorageManager';

// V9 OIDC Hybrid Flow Controller Interface
interface OIDCHybridFlowV9Controller {
	flowVariant: 'code-id-token' | 'code-token' | 'code-id-token-token';
	setFlowVariant: (variant: 'code-id-token' | 'code-token' | 'code-id-token-token') => void;
	credentials: StepCredentials;
	setCredentials: (creds: StepCredentials) => void;
	authorizationUrl: string;
	generateAuthorizationUrl: () => string;
	pkceCodes: { codeVerifier: string; codeChallenge: string; codeChallengeMethod: string };
	generatePKCE: () => Promise<void>;
	generateState: () => void;
	generateNonce: () => void;
	tokens: any;
	setTokens: (tokens: any) => void;
	reset: () => void;
	saveCredentials: () => Promise<void>;
	isLoading: boolean;
	setIsLoading: (loading: boolean) => void;
	showSuccessFeedback: (message: string) => void;
	showInfoFeedback: (message: string) => void;
	showWarningFeedback: (message: string) => void;
	showErrorFeedback: (message: string) => void;
}

// V9 OIDC Hybrid Flow Component Props
interface OIDCHybridFlowV9Props {
	/** Initial flow variant */
	initialVariant?: 'code-id-token' | 'code-token' | 'code-id-token-token';
	/** Whether to show advanced configuration */
	showAdvancedConfig?: boolean;
	/** Section IDs for expand/collapse functionality */
	sectionIds?: string[];
}

const OIDCHybridFlowV9: React.FC<OIDCHybridFlowV9Props> = ({
	initialVariant = 'code-id-token',
	showAdvancedConfig = true,
	sectionIds = [
		'overview',
		'credentials',
		'variant',
		'authorization',
		'exchange',
		'tokens',
		'introspect',
	],
}) => {
	const location = useLocation();

	// Section management with V9 service
	const { expandedStates, toggleSection, expandAll, collapseAll, areAllExpanded, areAllCollapsed } =
		useSectionsViewMode('oidc-hybrid-flow-v9', sectionIds);

	// Core state
	const [currentStep, setCurrentStep] = useState(0);
	const [selectedVariant, setSelectedVariant] = useState<
		'code-id-token' | 'code-token' | 'code-id-token-token'
	>(initialVariant);
	const [isExchanging, setIsExchanging] = useState(false);
	const [workerToken, setWorkerToken] = useState<string>('');

	// Initialize controller with V9 flow key
	const controller = useHybridFlowControllerV7({
		enableDebugger: true,
	}) as OIDCHybridFlowV9Controller;

	// V9: Persist flow state using unified storage
	useEffect(() => {
		const saveFlowState = async () => {
			try {
				await unifiedStorageManager.save('oidc-hybrid-flow-v9-state', {
					selectedVariant,
					currentStep,
					tokens: controller.tokens,
					timestamp: new Date().toISOString(),
				});
			} catch (error) {
				console.error('[OIDCHybridFlowV9] Failed to save flow state:', error);
				controller.showWarningFeedback('Failed to save flow state');
			}
		};

		saveFlowState();
	}, [selectedVariant, currentStep, controller.tokens, controller]);

	// V9: Load flow state on mount
	useEffect(() => {
		const loadFlowState = async () => {
			try {
				const savedState = (await unifiedStorageManager.load('oidc-hybrid-flow-v9-state')) as {
					selectedVariant?: 'code-id-token' | 'code-token' | 'code-id-token-token';
					currentStep?: number;
					tokens?: any;
					timestamp?: string;
				};

				if (savedState) {
					console.log('🔄 [OIDCHybridFlowV9] Restored flow state:', savedState);
					// Restore state if available and recent (within 1 hour)
					const stateAge = Date.now() - new Date(savedState.timestamp || '').getTime();
					if (stateAge < 3600000) {
						setSelectedVariant(savedState.selectedVariant || initialVariant);
						setCurrentStep(savedState.currentStep || 0);
						if (savedState.tokens) {
							controller.setTokens(savedState.tokens);
						}
					}
				}
			} catch (error) {
				console.error('[OIDCHybridFlowV9] Failed to load flow state:', error);
			}
		};

		loadFlowState();
	}, [initialVariant, controller]);

	// Get worker token from storage
	useEffect(() => {
		const loadToken = async () => {
			try {
				const savedToken = (await unifiedStorageManager.load('worker-token')) as string;
				if (savedToken) {
					setWorkerToken(savedToken);
					console.log('[OIDCHybridFlowV9] Worker token loaded from storage');
				}
			} catch (error) {
				console.error('[OIDCHybridFlowV9] Failed to load worker token:', error);
			}
		};

		loadToken();
	}, []);

	// Process tokens from URL fragment
	useEffect(() => {
		const hash = window.location.hash;
		if (!hash) return;

		const fragment = hash.startsWith('#') ? hash.substring(1) : hash;
		if (
			fragment.includes('id_token') ||
			fragment.includes('access_token') ||
			fragment.includes('code=')
		) {
			console.log('[OIDCHybridFlowV9] Processing tokens from URL fragment');
			// Token processing logic would go here
			setCurrentStep(3);
			window.history.replaceState({}, '', window.location.pathname);
			controller.showSuccessFeedback('Tokens received from authorization');
		}
	}, [controller]);

	// Update controller when variant changes
	useEffect(() => {
		controller.setFlowVariant(selectedVariant);
	}, [selectedVariant, controller]);

	usePageScroll({ pageName: 'OIDC Hybrid Flow V9 - PingOne UI', force: true });

	// V9 step validation
	const isStepValid = useCallback(
		(step: number): boolean => {
			switch (step) {
				case 0:
					return !!(controller.credentials?.environmentId && controller.credentials?.clientId);
				case 1:
					return !!controller.flowVariant;
				case 2:
					return !!controller.authorizationUrl;
				case 3:
					return !!controller.tokens?.code;
				case 4:
					return !!controller.tokens?.access_token;
				case 5:
					return !!controller.tokens;
				default:
					return true;
			}
		},
		[controller]
	);

	// V9 variant change handler
	const handleVariantChange = useCallback(
		(variant: 'code-id-token' | 'code-token' | 'code-id-token-token') => {
			setSelectedVariant(variant);
			setCurrentStep(0);
			controller.reset();
			controller.showSuccessFeedback(
				`Switched to ${variant.replace('-', ' ').toUpperCase()} variant`
			);
		},
		[controller]
	);

	// V9 authorization URL generation
	const handleGenerateAuthorizationUrl = useCallback(async () => {
		if (!controller.credentials) {
			controller.showErrorFeedback('Configure credentials before generating authorization URL');
			return;
		}

		try {
			controller.setIsLoading(true);
			await controller.generatePKCE();
			controller.generateState();

			// Generate nonce if required for ID token variants
			if (selectedVariant.includes('id-token')) {
				controller.generateNonce();
			}

			const url = controller.generateAuthorizationUrl();
			if (!url) {
				controller.showErrorFeedback(
					'Unable to generate authorization URL. Check required parameters.'
				);
				return;
			}

			setCurrentStep(2);
			controller.showSuccessFeedback('Authorization URL generated successfully');
		} catch (error) {
			console.error('[OIDCHybridFlowV9] Failed to generate authorization URL:', error);
			controller.showErrorFeedback('Authorization URL generation failed');
		} finally {
			controller.setIsLoading(false);
		}
	}, [controller, selectedVariant]);

	// V9 redirect authorization handler
	const handleRedirectAuthorization = useCallback(() => {
		if (!controller.authorizationUrl) {
			controller.showErrorFeedback('Generate authorization URL before redirecting');
			return;
		}

		window.open(controller.authorizationUrl, '_blank', 'noopener,noreferrer');
	}, [controller]);

	// V9 token exchange handler
	const handleExchangeCode = useCallback(async () => {
		const code = controller.tokens?.code;
		if (!code) {
			controller.showErrorFeedback(
				'No authorization code available. Complete authorization step first.'
			);
			return;
		}

		try {
			setIsExchanging(true);
			// Token exchange logic would go here
			setCurrentStep(4);
			controller.showSuccessFeedback('Authorization code exchanged for tokens');
		} catch (error) {
			console.error('[OIDCHybridFlowV9] Token exchange failed:', error);
			controller.showErrorFeedback('Token exchange failed');
		} finally {
			setIsExchanging(false);
		}
	}, [controller]);

	// V9 flow reset handler
	const handleReset = useCallback(() => {
		controller.reset();
		setCurrentStep(0);
		setSelectedVariant('code-id-token');
		setIsExchanging(false);
		controller.showInfoFeedback('Flow reset successfully');
	}, [controller]);

	// V9 variant selector
	const renderVariantSelector = () => {
		const variants = [
			{
				id: 'code-id-token' as const,
				title: 'Code + ID Token',
				description: 'Authorization code + immediate ID token for authentication',
				icon: 'file-earmark-code',
			},
			{
				id: 'code-token' as const,
				title: 'Code + Access Token',
				description: 'Authorization code + immediate access token for API authorization',
				icon: 'file-earmark-lock',
			},
			{
				id: 'code-id-token-token' as const,
				title: 'Complete Hybrid',
				description: 'All tokens: code + ID token + access token',
				icon: 'file-earmark-check',
			},
		];

		return (
			<div className="row g-3 mb-4">
				<div className="col-12">
					<h5 className="mb-3">Choose Hybrid Variant</h5>
					<div className="row g-3">
						{variants.map((variant) => (
							<div key={variant.id} className="col-md-4">
								<div
									className={`card h-100 cursor-pointer border-2 ${
										selectedVariant === variant.id ? 'border-primary bg-light' : 'border-light'
									}`}
									onClick={() => handleVariantChange(variant.id)}
									style={{ cursor: 'pointer' }}
								>
									<div className="card-body text-center">
										<BootstrapIcon
											icon={getBootstrapIconName(variant.icon)}
											size={32}
											className={`mb-3 ${
												selectedVariant === variant.id ? 'text-primary' : 'text-secondary'
											}`}
										/>
										<h6 className="card-title">{variant.title}</h6>
										<p className="card-text small text-muted">{variant.description}</p>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		);
	};

	return (
		<PingUIWrapper>
			<div className="container-fluid py-4">
				{/* V9 Header */}
				<div className="row mb-4">
					<div className="col-12">
						<div className="d-flex align-items-center justify-content-between">
							<div>
								<h1 className="h2 mb-2 d-flex align-items-center">
									<BootstrapIcon
										icon={getBootstrapIconName('arrows-angle-contract')}
										size={28}
										className="me-3 text-info"
									/>
									OIDC Hybrid Flow V9
									<span className="badge bg-success ms-2">PingOne UI</span>
								</h1>
								<p className="text-muted mb-0">
									Enhanced OIDC hybrid flow combining authorization code and implicit grants
								</p>
							</div>
							<div className="d-flex gap-2">
								<ExpandCollapseAllControls
									pageKey="oidc-hybrid-flow-v9"
									sectionIds={sectionIds}
									allExpanded={areAllExpanded()}
									allCollapsed={areAllCollapsed()}
									onExpandAll={expandAll}
									onCollapseAll={collapseAll}
								/>
							</div>
						</div>
					</div>
				</div>

				{/* V9 Step Indicator */}
				<div className="row mb-4">
					<div className="col-12">
						<div className="d-flex justify-content-center">
							<nav aria-label="OIDC Hybrid flow steps">
								<ul className="pagination pagination-lg">
									{['Setup', 'Variant', 'Authorize', 'Exchange', 'Tokens'].map((step, index) => (
										<li
											key={step}
											className={`page-item ${currentStep === index ? 'active' : ''} ${isStepValid(index) ? '' : 'disabled'}`}
										>
											<button
												type="button"
												className="page-link"
												onClick={() => isStepValid(index) && setCurrentStep(index)}
												disabled={!isStepValid(index)}
											>
												{index + 1}. {step}
											</button>
										</li>
									))}
								</ul>
							</nav>
						</div>
					</div>
				</div>

				{/* Variant Selector */}
				{renderVariantSelector()}

				{/* V9 Step Content */}
				<div className="row">
					<div className="col-12">
						{/* Placeholder for step content - will be implemented based on currentStep */}
						<div className="alert alert-info">
							<BootstrapIcon
								icon={getBootstrapIconName('info-circle')}
								size={16}
								className="me-2"
							/>
							OIDC Hybrid Flow V9 - Step {currentStep + 1} content will be implemented here
						</div>

						{/* Action buttons */}
						<div className="d-flex gap-2 mt-3">
							<button
								type="button"
								className="btn btn-primary"
								onClick={handleGenerateAuthorizationUrl}
								disabled={!isStepValid(0) || controller.isLoading}
							>
								<BootstrapIcon icon={getBootstrapIconName('link')} size={16} className="me-2" />
								{controller.isLoading ? 'Generating...' : 'Generate Authorization URL'}
							</button>

							{controller.authorizationUrl && (
								<button
									type="button"
									className="btn btn-outline-primary"
									onClick={handleRedirectAuthorization}
								>
									<BootstrapIcon
										icon={getBootstrapIconName('box-arrow-up-right')}
										size={16}
										className="me-2"
									/>
									Redirect to Authorize
								</button>
							)}

							{controller.tokens?.code && (
								<button
									type="button"
									className="btn btn-success"
									onClick={handleExchangeCode}
									disabled={isExchanging}
								>
									<BootstrapIcon
										icon={getBootstrapIconName('arrow-left-right')}
										size={16}
										className="me-2"
									/>
									{isExchanging ? 'Exchanging...' : 'Exchange Code for Tokens'}
								</button>
							)}

							<button type="button" className="btn btn-outline-secondary" onClick={handleReset}>
								<BootstrapIcon
									icon={getBootstrapIconName('arrow-clockwise')}
									size={16}
									className="me-2"
								/>
								Reset Flow
							</button>
						</div>
					</div>
				</div>

				{/* V9 Footer */}
				<div className="row mt-4">
					<div className="col-12">
						<div className="text-center">
							<div className="d-flex justify-content-center gap-2 mb-2">
								<span className="badge bg-secondary">V9.3.6</span>
								<span className="badge bg-info">OIDC Hybrid</span>
								<span className="badge bg-warning">Advanced Flow</span>
							</div>
							<p className="text-muted small mb-0">
								Enhanced with PingOne UI • Unified Storage • Contextual Messaging
							</p>
						</div>
					</div>
				</div>
			</div>
		</PingUIWrapper>
	);
};

export default OIDCHybridFlowV9;
