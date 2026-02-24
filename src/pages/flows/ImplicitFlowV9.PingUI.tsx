// src/pages/flows/ImplicitFlowV9.PingUI.tsx
// V9 Implicit Flow - PingOne UI with New Storage & Messaging
// Migrated from V7 with PingOne UI, unified storage, and feedback service

import React, { useCallback, useEffect, useState } from 'react';
import BootstrapIcon from '../../components/BootstrapIcon';
import { getBootstrapIconName } from '../../components/iconMapping';
import { PingUIWrapper } from '../../components/PingUIWrapper';
import { ExpandCollapseAllControls } from '../../components/ExpandCollapseAllControls';
import { useSectionsViewMode } from '../../services/sectionsViewModeService';
import { unifiedStorageManager } from '../../services/unifiedStorageManager';

// V9 Implicit Flow Controller Interface
interface ImplicitFlowV9Controller {
	flowVariant: 'oauth' | 'oidc';
	setFlowVariant: (variant: 'oauth' | 'oidc') => void;
	credentials: Record<string, unknown>;
	setCredentials: (creds: Record<string, unknown>) => void;
	authUrl: string;
	generateAuthorizationUrl: () => Promise<void>;
	tokens: Record<string, unknown> | null;
	setTokensFromFragment: (fragment: string) => void;
	resetFlow: () => void;
	saveCredentials: () => Promise<void>;
	showSuccessFeedback: (message: string) => void;
	showInfoFeedback: (message: string) => void;
	showWarningFeedback: (message: string) => void;
	showErrorFeedback: (message: string) => void;
}

// V9 Implicit Flow Component Props
interface ImplicitFlowV9Props {
	/** Flow variant - oauth or oidc */
	variant?: 'oauth' | 'oidc';
}

const ImplicitFlowV9: React.FC<ImplicitFlowV9Props> = ({
	variant: initialVariant = 'oauth',
}) => {
	// Section management with V9 service
	const {
		areAllExpanded,
		areAllCollapsed
	} = useSectionsViewMode('implicit-flow-v9', ['overview', 'credentials', 'auth-request', 'auth-response', 'token-display', 'introspection']);

	// Core state
	const [selectedVariant, setSelectedVariant] = useState<'oauth' | 'oidc'>(initialVariant);
	const [currentStep, setCurrentStep] = useState(0);

	// Initialize controller with V9 flow key
	const controller = {
		flowVariant: selectedVariant,
		setFlowVariant: (variant: 'oauth' | 'oidc') => setSelectedVariant(variant),
		credentials: {},
		setCredentials: () => {},
		authUrl: '',
		generateAuthorizationUrl: async () => {},
		tokens: null,
		setTokensFromFragment: () => {},
		resetFlow: () => {},
		saveCredentials: async () => {},
		showSuccessFeedback: () => {},
		showInfoFeedback: () => {},
		showWarningFeedback: () => {},
		showErrorFeedback: () => {},
	} as ImplicitFlowV9Controller;

	// V9: Persist flow state using unified storage
	useEffect(() => {
		const saveFlowState = async () => {
			try {
				await unifiedStorageManager.save('implicit-flow-v9-state', {
					selectedVariant,
					currentStep,
					timestamp: new Date().toISOString(),
				});
			} catch (error) {
				console.error('[ImplicitFlowV9] Failed to save flow state:', error);
			}
		};

		saveFlowState();
	}, [selectedVariant, currentStep]);

	// Process tokens from URL fragment
	useEffect(() => {
		const hash = window.location.hash;
		console.log('[ImplicitFlowV9] Checking for tokens in URL fragment on mount:', hash);

		if (hash?.includes('access_token')) {
			console.log('[ImplicitFlowV9] Found tokens in URL fragment, processing...');
			controller.setTokensFromFragment(hash);
			// Clean up URL
			window.history.replaceState({}, '', window.location.pathname);
			setCurrentStep(2); // Advance to token display step
			controller.showSuccessFeedback('Tokens received from authorization');
		}
	}, [controller]);

	// Handle token reception and step advancement
	useEffect(() => {
		if (controller.tokens && currentStep < 2) {
			console.log('[ImplicitFlowV9] Tokens received, advancing to step 2');
			setCurrentStep(2);
		}
	}, [controller.tokens, currentStep]);

	// V9 step validation
	const isStepValid = (step: number): boolean => {
		switch (step) {
			case 0:
				return !!(controller.credentials && Object.keys(controller.credentials).length > 0);
			case 1:
				return !!controller.authUrl;
			case 2:
				return !!(controller.tokens);
			case 3:
				return !!(controller.tokens);
			default:
				return true;
		}
	};

	// V9 variant change handler
	const handleVariantChange = useCallback((variant: 'oauth' | 'oidc') => {
		setSelectedVariant(variant);
		setCurrentStep(0);
		controller.resetFlow();

		controller.showSuccessFeedback(`Switched to ${variant.toUpperCase()} Implicit Flow variant`);
	}, [controller]);

	// Render V9 variant selector
	const renderVariantSelector = () => (
		<div className="row g-3 mb-4">
			<div className="col-12">
				<div className="d-flex gap-3 p-3 bg-light rounded-3 border">
					<button
						type="button"
						className={`btn flex-fill ${selectedVariant === 'oauth'
							? 'btn-success'
							: 'btn-outline-success'
						}`}
						onClick={() => handleVariantChange('oauth')}
					>
						<BootstrapIcon icon={getBootstrapIconName("shield-check")} size={16} className="me-2" />
						<div className="text-start">
							<div className="fw-semibold">OAuth 2.0 Implicit</div>
							<small className="opacity-75">Access token only - API authorization</small>
						</div>
					</button>
					<button
						type="button"
						className={`btn flex-fill ${selectedVariant === 'oidc'
							? 'btn-primary'
							: 'btn-outline-primary'
						}`}
						onClick={() => handleVariantChange('oidc')}
					>
						<BootstrapIcon icon={getBootstrapIconName("person-badge")} size={16} className="me-2" />
						<div className="text-start">
							<div className="fw-semibold">OpenID Connect Implicit</div>
							<small className="opacity-75">ID token + Access token - Authentication + Authorization</small>
						</div>
					</button>
				</div>
			</div>
		</div>
	);

	return (
		<PingUIWrapper>
			<div className="container-fluid py-4">
				{/* V9 Header */}
				<div className="row mb-4">
					<div className="col-12">
						<div className="d-flex align-items-center justify-content-between">
							<div>
								<h1 className="h2 mb-2 d-flex align-items-center">
									<BootstrapIcon icon={getBootstrapIconName("lightning")} size={28} className="me-3 text-warning" />
									Implicit Flow V9
									<span className="badge bg-success ms-2">PingOne UI</span>
								</h1>
								<p className="text-muted mb-0">
									Enhanced implicit grant flow with PingOne UI and unified messaging
								</p>
							</div>
							<div className="d-flex gap-2">
								<ExpandCollapseAllControls
									pageKey="implicit-flow-v9"
									sectionIds={['overview', 'credentials', 'auth-request', 'auth-response', 'token-display', 'introspection']}
									allExpanded={areAllExpanded()}
									allCollapsed={areAllCollapsed()}
									onExpandAll={() => {}}
									onCollapseAll={() => {}}
								/>
							</div>
						</div>
					</div>
				</div>

				{/* V9 Step Indicator */}
				<div className="row mb-4">
					<div className="col-12">
						<div className="d-flex justify-content-center">
							<nav aria-label="Implicit flow steps">
								<ul className="pagination pagination-lg">
									{['Setup', 'Authorize', 'Tokens', 'Introspect'].map((step, index) => (
										<li key={step} className={`page-item ${currentStep === index ? 'active' : ''} ${isStepValid(index) ? '' : 'disabled'}`}>
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
							<BootstrapIcon icon={getBootstrapIconName("info-circle")} size={16} className="me-2" />
							Implicit Flow V9 - Step {currentStep + 1} content will be implemented here
						</div>
					</div>
				</div>

				{/* V9 Footer */}
				<div className="row mt-4">
					<div className="col-12">
						<div className="text-center">
							<div className="d-flex justify-content-center gap-2 mb-2">
								<span className="badge bg-secondary">V9.3.6</span>
								<span className="badge bg-info">Implicit Flow</span>
								<span className="badge bg-warning">Legacy Grant</span>
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

export default ImplicitFlowV9;
