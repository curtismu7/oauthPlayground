// src/pages/flows/OAuthAuthorizationCodeFlowV9.PingUI.tsx
// V9 Complete OAuth Authorization Code Flow - PingOne UI with New Storage & Messaging

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import CodeExamplesDisplay from '../../components/CodeExamplesDisplay';
import EnhancedSecurityFeaturesDemo from '../../components/EnhancedSecurityFeaturesDemo';
// Education components
import { EducationModeToggle } from '../../components/education/EducationModeToggle';
import { MasterEducationSection } from '../../components/education/MasterEducationSection';
import FlowTrackingDisplay from '../../components/FlowTrackingDisplay';
import type { PingOneApplicationState } from '../../components/PingOneApplicationConfig';
import BootstrapIcon from '../../components/BootstrapIcon';
import { getBootstrapIconName } from '../../components/iconMapping';
import { PingUIWrapper } from '../../components/PingUIWrapper';
import { ExpandCollapseAllControls } from '../../components/ExpandCollapseAllControls';
import { useSectionsViewMode } from '../../services/sectionsViewModeService';
import { feedbackService } from '../../services/feedback/feedbackService';
import { unifiedStorageManager } from '../../services/unifiedStorageManager';
import { useAuthorizationCodeFlowController } from '../../hooks/useAuthorizationCodeFlowV7Controller';
import { usePageScroll } from '../../hooks/usePageScroll';
import AuthorizationCodeSharedService from '../../services/authorizationCodeSharedService';
import type { V7FlowName } from '../../services/sharedService';
import { V7SharedService } from '../../services/sharedService';
import type { ClientAuthMethod } from '../../utils/clientAuthentication';
import { checkCredentialsAndWarn } from '../../utils/credentialsWarningService';
import {
	DEFAULT_APP_CONFIG,
} from './config/OAuthAuthzCodeFlowV7.config';

// Page key for expand/collapse state management
const PAGE_KEY = 'oauth-authorization-code-v9';

// Section IDs for expand/collapse functionality
const SECTION_IDS = [
	'flow-configuration',
	'authorization-request',
	'authorization-response',
	'token-exchange',
	'token-display',
	'error-handling',
	'educational-content',
	'security-features',
	'code-examples',
	'flow-tracking',
];

const OAuthAuthorizationCodeFlowV9: React.FC = () => {
	const location = useLocation();

	console.log('🚀 [OAuthAuthorizationCodeFlowV9] V9 PingOne Flow loaded!', {
		url: window.location.href,
		search: window.location.search,
		timestamp: new Date().toISOString(),
		navigationState: location.state,
	});

	// Scroll to top on page load
	usePageScroll({ pageName: 'OAuth Authorization Code Flow V9 - PingOne UI', force: true });

	const controller = useAuthorizationCodeFlowController({
		flowKey: 'oauth-authorization-code-v9',
		defaultFlowVariant: 'oauth', // V9 defaults to OAuth 2.0
		enableDebugger: true,
	});

	// Check credentials on mount and show warning if missing using new feedback service
	useEffect(() => {
		checkCredentialsAndWarn(controller.credentials, {
			flowName: 'OAuth Authorization Code Flow',
			requiredFields: ['environmentId', 'clientId', 'clientSecret'],
			showToast: true,
		});
	}, [controller.credentials]);

	const resolvedClientAuthMethod: ClientAuthMethod = useMemo(() => {
		const method = controller.credentials.clientAuthMethod;
		switch (method) {
			case 'none':
			case 'client_secret_basic':
			case 'client_secret_post':
			case 'client_secret_jwt':
			case 'private_key_jwt':
				return method;
			default:
				return 'client_secret_post';
		}
	}, [controller.credentials.clientAuthMethod]);

	// Initialize V9 compliance features
	const flowName: V7FlowName = 'oauth-authorization-code-v7'; // Use existing V7 flow name for compatibility
	const v7FlowConfig = V7SharedService.initializeFlow(flowName, {
		enableIDTokenValidation: false, // OAuth flow
		enableParameterValidation: true,
		enableErrorHandling: true,
		enableSecurityHeaders: true,
	});

	const [currentStep, setCurrentStep] = useState(
		AuthorizationCodeSharedService.StepRestoration.getInitialStep()
	);
	const [pingOneConfig, setPingOneConfig] = useState<PingOneApplicationState>(DEFAULT_APP_CONFIG);
	const [localAuthCode, setLocalAuthCode] = useState<string | null>(null);
	const [errorDetails, setErrorDetails] = useState<any>(null);

	// V9 compliance state
	const [_complianceStatus, _setComplianceStatus] = useState(v7FlowConfig.compliance);
	const [_validationResults, _setValidationResults] = useState<any>(null);
	const [_errorStats, _setErrorStats] = useState(
		V7SharedService.ErrorHandling.getErrorStatistics()
	);

	// PAR (Pushed Authorization Request) state
	const [parRequestUri, setParRequestUri] = useState<string>('');

	// Detect default variant based on navigation context
	const getDefaultVariant = (): 'oauth' | 'oidc' => {
		// Check if there's a variant specified in the URL params
		const urlParams = new URLSearchParams(location.search);
		const urlVariant = urlParams.get('variant');
		if (urlVariant === 'oidc' || urlVariant === 'oauth') {
			return urlVariant as 'oauth' | 'oidc';
		}

		// Check navigation state for context
		const state = location.state as any;
		if (state?.fromSection === 'oidc') {
			return 'oidc';
		}

		// Default to controller's default or OAuth (base protocol)
		return controller.flowVariant || 'oauth';
	};

	const [flowVariant, setFlowVariant] = useState<'oauth' | 'oidc'>(getDefaultVariant());

	// V9: Use sections view mode for expand/collapse functionality
	const {
		expandedStates,
		toggleSection,
		expandAll,
		collapseAll,
		areAllExpanded,
		areAllCollapsed
	} = useSectionsViewMode(PAGE_KEY, SECTION_IDS);

	// V9: Persist flow state using unified storage manager
	useEffect(() => {
		const saveFlowState = async () => {
			try {
				await unifiedStorageManager.save(`${PAGE_KEY}-flow-state`, {
					currentStep,
					flowVariant,
					pingOneConfig,
					localAuthCode,
					parRequestUri,
					errorDetails,
					timestamp: new Date().toISOString(),
				});
			} catch (error) {
				console.error('Failed to save flow state:', error);
				feedbackService.showSnackbar({
					type: 'error',
					message: 'Failed to save flow state',
					duration: 3000,
				});
			}
		};

		saveFlowState();
	}, [currentStep, flowVariant, pingOneConfig, localAuthCode, parRequestUri, errorDetails]);

	// V9: Load flow state on mount
	useEffect(() => {
		const loadFlowState = async () => {
			try {
				const savedState = await unifiedStorageManager.load(`${PAGE_KEY}-flow-state`);
				if (savedState) {
					console.log('🔄 [V9] Restored flow state:', savedState);
					// Restore state if available and recent (within 1 hour)
					const stateAge = Date.now() - new Date(savedState.timestamp).getTime();
					if (stateAge < 3600000) { // 1 hour
						setCurrentStep(savedState.currentStep || 0);
						setFlowVariant(savedState.flowVariant || 'oauth');
						setPingOneConfig(savedState.pingOneConfig || DEFAULT_APP_CONFIG);
						setLocalAuthCode(savedState.localAuthCode || null);
						setParRequestUri(savedState.parRequestUri || '');
						setErrorDetails(savedState.errorDetails || null);
					}
				}
			} catch (error) {
				console.error('Failed to load flow state:', error);
			}
		};

		loadFlowState();
	}, []);

	// V9: Show success feedback for completed operations
	const showSuccessFeedback = useCallback((message: string) => {
		feedbackService.showSnackbar({
			type: 'success',
			message,
			duration: 4000,
		});
	}, []);

	// V9: Show info feedback
	const showInfoFeedback = useCallback((message: string) => {
		feedbackService.showSnackbar({
			type: 'info',
			message,
			duration: 3000,
		});
	}, []);

	// V9: Handle section toggle with feedback
	const handleSectionToggle = useCallback((sectionId: string) => {
		toggleSection(sectionId);
		const isExpanded = expandedStates[sectionId];
		showInfoFeedback(`${isExpanded ? 'Collapsed' : 'Expanded'} section`);
	}, [toggleSection, expandedStates]);

	// V9: Handle expand all with feedback
	const handleExpandAll = useCallback(() => {
		expandAll();
		showSuccessFeedback('Expanded all sections');
	}, [expandAll]);

	// V9: Handle collapse all with feedback
	const handleCollapseAll = useCallback(() => {
		collapseAll();
		showSuccessFeedback('Collapsed all sections');
	}, [collapseAll]);

	return (
		<PingUIWrapper>
			<div className="container-fluid">
				{/* V9: Flow Header with PingOne UI */}
				<div className="card mb-4">
					<div className={`card-header bg-gradient ${
						flowVariant === 'oidc' 
							? 'bg-primary' 
							: 'bg-success'
					} text-white`}>
						<div className="d-flex justify-content-between align-items-center">
							<div>
								<h2 className="mb-1">
									<BootstrapIcon 
										icon={getBootstrapIconName(flowVariant === 'oidc' ? 'shield-check' : 'lock')} 
										size={24} 
										className="me-2" 
									/>
									OAuth Authorization Code Flow V9
								</h2>
								<p className="mb-0 opacity-75">
									{flowVariant === 'oidc' ? 'OpenID Connect' : 'OAuth 2.0'} - PingOne UI
								</p>
							</div>
							<div className="text-end">
								<span className="badge bg-light text-dark me-2">
									Version 9.3.6
								</span>
								<span className={`badge ${
									flowVariant === 'oidc' 
										? 'bg-info' 
										: 'bg-success'
								}`}>
									{flowVariant === 'oidc' ? 'OIDC' : 'OAuth'}
								</span>
							</div>
						</div>
					</div>
				</div>

				{/* V9: Expand/Collapse All Controls */}
				<div className="card mb-3">
					<div className="card-body">
						<ExpandCollapseAllControls
							pageKey={PAGE_KEY}
							sectionIds={SECTION_IDS}
							allExpanded={areAllExpanded()}
							allCollapsed={areAllCollapsed()}
							onExpandAll={handleExpandAll}
							onCollapseAll={handleCollapseAll}
						/>
					</div>
				</div>

				{/* V9: Variant Selector */}
				<div className="card mb-4">
					<div className="card-body">
						<h5 className="card-title">
							<BootstrapIcon icon={getBootstrapIconName('gear')} size={20} className="me-2" />
							Flow Variant
						</h5>
						<fieldset>
							<div className="btn-group" role="group">
								<button
									type="button"
									className={`btn ${
										flowVariant === 'oauth' 
											? 'btn-success active' 
											: 'btn-outline-success'
									}`}
									onClick={() => setFlowVariant('oauth')}
								>
									<BootstrapIcon icon={getBootstrapIconName('shield')} size={16} className="me-1" />
									OAuth 2.0
								</button>
								<button
									type="button"
									className={`btn ${
										flowVariant === 'oidc' 
											? 'btn-primary active' 
											: 'btn-outline-primary'
									}`}
									onClick={() => setFlowVariant('oidc')}
								>
									<BootstrapIcon icon={getBootstrapIconName('shield-check')} size={16} className="me-1" />
									OpenID Connect
								</button>
							</div>
						</fieldset>
					</div>
				</div>

				{/* V9: Flow Configuration Section */}
				<div className="card mb-4">
					<div className="card-header d-flex justify-content-between align-items-center">
						<h5 className="mb-0">
							<BootstrapIcon icon={getBootstrapIconName('gear')} size={20} className="me-2" />
							Flow Configuration
						</h5>
						<button
							type="button"
							className="btn btn-outline-secondary btn-sm"
							onClick={() => handleSectionToggle('flow-configuration')}
						>
							<BootstrapIcon 
								icon={getBootstrapIconName(
									expandedStates['flow-configuration'] ? 'chevron-up' : 'chevron-down'
								)} 
								size={16} 
							/>
						</button>
					</div>
					{expandedStates['flow-configuration'] && (
						<div className="card-body">
							<div className="alert alert-info">
								<BootstrapIcon icon={getBootstrapIconName('info-circle')} size={20} className="me-2" />
								Configure your OAuth 2.0 Authorization Code Flow parameters below.
							</div>
							{/* Flow configuration content will go here */}
						</div>
					)}
				</div>

				{/* V9: Educational Content Section */}
				<div className="card mb-4">
					<div className="card-header d-flex justify-content-between align-items-center">
						<h5 className="mb-0">
							<BootstrapIcon icon={getBootstrapIconName('book')} size={20} className="me-2" />
							Educational Content
						</h5>
						<button
							type="button"
							className="btn btn-outline-secondary btn-sm"
							onClick={() => handleSectionToggle('educational-content')}
						>
							<BootstrapIcon 
								icon={getBootstrapIconName(
									expandedStates['educational-content'] ? 'chevron-up' : 'chevron-down'
								)} 
								size={16} 
							/>
						</button>
					</div>
					{expandedStates['educational-content'] && (
						<div className="card-body">
							<EducationModeToggle />
							<MasterEducationSection />
						</div>
					)}
				</div>

				{/* V9: Security Features Section */}
				<div className="card mb-4">
					<div className="card-header d-flex justify-content-between align-items-center">
						<h5 className="mb-0">
							<BootstrapIcon icon={getBootstrapIconName('shield')} size={20} className="me-2" />
							Security Features
						</h5>
						<button
							type="button"
							className="btn btn-outline-secondary btn-sm"
							onClick={() => handleSectionToggle('security-features')}
						>
							<BootstrapIcon 
								icon={getBootstrapIconName(
									expandedStates['security-features'] ? 'chevron-up' : 'chevron-down'
								)} 
								size={16} 
							/>
						</button>
					</div>
					{expandedStates['security-features'] && (
						<div className="card-body">
							<EnhancedSecurityFeaturesDemo />
						</div>
					)}
				</div>

				{/* V9: Code Examples Section */}
				<div className="card mb-4">
					<div className="card-header d-flex justify-content-between align-items-center">
						<h5 className="mb-0">
							<BootstrapIcon icon={getBootstrapIconName('code')} size={20} className="me-2" />
							Code Examples
						</h5>
						<button
							type="button"
							className="btn btn-outline-secondary btn-sm"
							onClick={() => handleSectionToggle('code-examples')}
						>
							<BootstrapIcon 
								icon={getBootstrapIconName(
									expandedStates['code-examples'] ? 'chevron-up' : 'chevron-down'
								)} 
								size={16} 
							/>
						</button>
					</div>
					{expandedStates['code-examples'] && (
						<div className="card-body">
							<CodeExamplesDisplay stepId="authorization-code" />
						</div>
					)}
				</div>

				{/* V9: Flow Tracking Section */}
				<div className="card mb-4">
					<div className="card-header d-flex justify-content-between align-items-center">
						<h5 className="mb-0">
							<BootstrapIcon icon={getBootstrapIconName('activity')} size={20} className="me-2" />
							Flow Tracking
						</h5>
						<button
							type="button"
							className="btn btn-outline-secondary btn-sm"
							onClick={() => handleSectionToggle('flow-tracking')}
						>
							<BootstrapIcon 
								icon={getBootstrapIconName(
									expandedStates['flow-tracking'] ? 'chevron-up' : 'chevron-down'
								)} 
								size={16} 
							/>
						</button>
					</div>
					{expandedStates['flow-tracking'] && (
						<div className="card-body">
							<FlowTrackingDisplay />
						</div>
					)}
				</div>

				{/* V9: Footer */}
				<div className="card">
					<div className="card-body text-center">
						<p className="text-muted mb-0">
							<BootstrapIcon icon={getBootstrapIconName('info-circle')} size={16} className="me-1" />
							OAuth Authorization Code Flow V9 - PingOne UI with Enhanced Storage & Messaging
						</p>
					</div>
				</div>
			</div>
		</PingUIWrapper>
	);
};

export default OAuthAuthorizationCodeFlowV9;
