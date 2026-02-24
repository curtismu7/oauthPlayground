// src/templates/V9FlowTemplate.PingUI.tsx
// V9 Flow Template - PingOne UI with New Storage & Messaging
// Reusable template for creating V9 flows with consistent architecture

import React, { useCallback, useEffect, useState } from 'react';
import { EducationModeToggle } from '../components/education/EducationModeToggle';
import { MasterEducationSection } from '../components/education/MasterEducationSection';
import { StepNavigationButtons } from '../components/StepNavigationButtons';
import BootstrapIcon from '../components/BootstrapIcon';
import { getBootstrapIconName } from '../components/iconMapping';
import { PingUIWrapper } from '../components/PingUIWrapper';
import { ExpandCollapseAllControls } from '../components/ExpandCollapseAllControls';
import { useSectionsViewMode } from '../services/sectionsViewModeService';
import { feedbackService } from '../services/feedback/feedbackService';
import { unifiedStorageManager } from '../services/unifiedStorageManager';
import { usePageScroll } from '../hooks/usePageScroll';

export interface V9FlowTemplateProps {
	/** Unique identifier for this flow */
	flowKey: string;
	/** Display title for the flow */
	title: string;
	/** Subtitle/description */
	subtitle: string;
	/** Icon name for the flow header */
	iconName: string;
	headerBgClass?: string;
	/** Total number of steps in the flow */
	totalSteps: number;
	/** Section IDs for expand/collapse functionality */
	sectionIds: string[];
	/** Required credential fields for validation */
	requiredFields?: string[];
	/** Flow variant (if applicable) */
	flowVariant?: 'oauth' | 'oidc' | null;
	/** Custom content sections */
	children?: React.ReactNode;
	/** Flow-specific configuration component */
	configurationComponent?: React.ComponentType<{ requiredFields?: string[] }>;
	/** Flow-specific request component */
	requestComponent?: React.ComponentType<Record<string, unknown>>;
	/** Flow-specific response component */
	responseComponent?: React.ComponentType<Record<string, unknown>>;
	/** Flow-specific token exchange component */
	tokenExchangeComponent?: React.ComponentType<Record<string, unknown>>;
	/** Flow-specific token display component */
	tokenDisplayComponent?: React.ComponentType<Record<string, unknown>>;
	/** Additional custom sections */
	additionalSections?: Array<{
		id: string;
		title: string;
		iconName: string;
		component: React.ComponentType<Record<string, unknown>>;
	}>;
}

const V9FlowTemplate: React.FC<V9FlowTemplateProps> = ({
	flowKey,
	title,
	subtitle,
	iconName,
	headerBgClass = 'bg-primary',
	totalSteps,
	sectionIds,
	requiredFields = ['environmentId', 'clientId', 'clientSecret'],
	flowVariant = null,
	children,
	configurationComponent: ConfigurationComponent,
	requestComponent: RequestComponent,
	responseComponent: ResponseComponent,
	tokenExchangeComponent: TokenExchangeComponent,
	tokenDisplayComponent: TokenDisplayComponent,
	additionalSections = [],
}) => {

	console.log(`🚀 [V9FlowTemplate] ${title} loaded!`, {
		url: window.location.href,
		search: window.location.search,
		timestamp: new Date().toISOString(),
	});

	// Scroll to top on page load
	usePageScroll({ pageName: `${title} - PingOne UI`, force: true });

	const [currentStep, setCurrentStep] = useState(0);
	const [errorDetails, setErrorDetails] = useState<{ message?: string; details?: unknown } | null>(null);

	// V9: Use sections view mode for expand/collapse functionality
	const {
		expandedStates,
		toggleSection,
		expandAll,
		collapseAll,
		areAllExpanded,
		areAllCollapsed
	} = useSectionsViewMode(flowKey, sectionIds);

	// V9: Persist flow state using unified storage manager
	useEffect(() => {
		const saveFlowState = async () => {
			try {
				await unifiedStorageManager.save(`${flowKey}-flow-state`, {
					currentStep,
					flowVariant,
					errorDetails,
					timestamp: new Date().toISOString(),
				});
			} catch (error) {
				console.error('Failed to save flow state:', error);
				feedbackService.showSnackbar({
					type: 'warning',
					message: 'Failed to save flow state',
					duration: 3000,
				});
			}
		};

		saveFlowState();
	}, [flowKey, currentStep, flowVariant, errorDetails]);

	// V9: Load flow state on mount
	useEffect(() => {
		const loadFlowState = async () => {
			try {
				const savedState = await unifiedStorageManager.load(`${flowKey}-flow-state`) as {
					currentStep?: number;
					flowVariant?: string;
					errorDetails?: { message?: string; details?: unknown };
					timestamp?: string;
				};
				if (savedState) {
					console.log('🔄 [V9] Restored flow state:', savedState);
					// Restore state if available and recent (within 1 hour)
					const stateAge = Date.now() - new Date(savedState.timestamp || '').getTime();
					if (stateAge < 3600000) { // 1 hour
						setCurrentStep(savedState.currentStep || 0);
						setErrorDetails(savedState.errorDetails || null);
					}
				}
			} catch (error) {
				console.error('Failed to load flow state:', error);
			}
		};

		loadFlowState();
	}, [flowKey]);

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

	// V9: Show warning feedback
	const showWarningFeedback = useCallback((message: string) => {
		feedbackService.showSnackbar({
			type: 'warning',
			message,
			duration: 3000,
		});
	}, []);

	// V9: Handle section toggle with feedback
	const handleSectionToggle = useCallback((sectionId: string) => {
		toggleSection(sectionId);
		const isExpanded = expandedStates[sectionId];
		showInfoFeedback(`${isExpanded ? 'Collapsed' : 'Expanded'} section`);
	}, [toggleSection, expandedStates, showInfoFeedback]);

	// V9: Handle expand all with feedback
	const handleExpandAll = useCallback(() => {
		expandAll();
		showSuccessFeedback('Expanded all sections');
	}, [expandAll, showSuccessFeedback]);

	// V9: Handle collapse all with feedback
	const handleCollapseAll = useCallback(() => {
		collapseAll();
		showSuccessFeedback('Collapsed all sections');
	}, [collapseAll, showSuccessFeedback]);

	// V9: Handle copy with feedback
	const handleCopy = useCallback(async (text: string, fieldName: string) => {
		try {
			await navigator.clipboard.writeText(text);
			showSuccessFeedback(`Copied ${fieldName} to clipboard`);
		} catch {
			showWarningFeedback('Failed to copy to clipboard');
		}
	}, [showSuccessFeedback, showWarningFeedback]);

	// V9: Handle step navigation
	const handleNextStep = useCallback(() => {
		if (currentStep < totalSteps - 1) {
			setCurrentStep(currentStep + 1);
			showInfoFeedback(`Step ${currentStep + 2} of ${totalSteps}`);
		}
	}, [currentStep, totalSteps, showInfoFeedback]);

	const handlePrevStep = useCallback(() => {
		if (currentStep > 0) {
			setCurrentStep(currentStep - 1);
			showInfoFeedback(`Step ${currentStep} of ${totalSteps}`);
		}
	}, [currentStep, totalSteps, showInfoFeedback]);

	return (
		<PingUIWrapper>
			<div className="container-fluid">
				{/* V9: Flow Header with PingOne UI */}
				<div className="card mb-4">
					<div className={`card-header ${headerBgClass} text-white`}>
						<div className="d-flex justify-content-between align-items-center">
							<div>
								<h2 className="mb-1">
									<BootstrapIcon
										icon={getBootstrapIconName(iconName)}
										size={24}
										className="me-2"
									/>
									{title}
								</h2>
								<p className="mb-0 opacity-75">
									{subtitle}
								</p>
							</div>
							<div className="text-end">
								<span className="badge bg-light text-dark me-2">
									Version 9.3.6
								</span>
								<span className="badge bg-info">
									Step {currentStep + 1} of {totalSteps}
								</span>
							</div>
						</div>
					</div>
				</div>

				{/* V9: Expand/Collapse All Controls */}
				<div className="card mb-3">
					<div className="card-body">
						<ExpandCollapseAllControls
							pageKey={flowKey}
							sectionIds={sectionIds}
							allExpanded={areAllExpanded()}
							allCollapsed={areAllCollapsed()}
							onExpandAll={handleExpandAll}
							onCollapseAll={handleCollapseAll}
						/>
					</div>
				</div>

				{/* V9: Flow Variant Selector (if applicable) */}
				{flowVariant && (
					<div className="card mb-4">
						<div className="card-header">
							<h5 className="mb-0">Flow Variant</h5>
						</div>
						<div className="card-body">
							<div className="row">
								<div className="col-md-6">
									<div className="form-check">
										<input
											className="form-check-input"
											type="radio"
											name="flowVariant"
											id={`${flowKey}-oauthVariant`}
											value="oauth"
											checked={flowVariant === 'oauth'}
											onChange={() => {}} // TODO: Implement variant switching
										/>
										<label className="form-check-label" htmlFor={`${flowKey}-oauthVariant`}>
											<BootstrapIcon icon={getBootstrapIconName('lock')} size={20} className="me-2" />
											OAuth 2.0
										</label>
									</div>
								</div>
								<div className="col-md-6">
									<div className="form-check">
										<input
											className="form-check-input"
											type="radio"
											name="flowVariant"
											id={`${flowKey}-oidcVariant`}
											value="oidc"
											checked={flowVariant === 'oidc'}
											onChange={() => {}} // TODO: Implement variant switching
										/>
										<label className="form-check-label" htmlFor={`${flowKey}-oidcVariant`}>
											<BootstrapIcon icon={getBootstrapIconName('shield-check')} size={20} className="me-2" />
											OpenID Connect
										</label>
									</div>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* V9: Step Navigation */}
				<div className="card mb-4">
					<div className="card-body">
						<StepNavigationButtons
							currentStep={currentStep}
							totalSteps={totalSteps}
							onNext={handleNextStep}
							onPrevious={handlePrevStep}
						/>
					</div>
				</div>

				{/* V9: Flow Configuration Section */}
				{ConfigurationComponent && (
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
								<ConfigurationComponent />
							</div>
						)}
					</div>
				)}

				{/* V9: Request Section */}
				{RequestComponent && (
					<div className="card mb-4">
						<div className="card-header d-flex justify-content-between align-items-center">
							<h5 className="mb-0">
								<BootstrapIcon icon={getBootstrapIconName('send')} size={20} className="me-2" />
								Request
							</h5>
							<button
								type="button"
								className="btn btn-outline-secondary btn-sm"
								onClick={() => handleSectionToggle('request')}
							>
								<BootstrapIcon
									icon={getBootstrapIconName(
										expandedStates['request'] ? 'chevron-up' : 'chevron-down'
									)}
									size={16}
								/>
							</button>
						</div>
						{expandedStates['request'] && (
							<div className="card-body">
								<RequestComponent />
							</div>
						)}
					</div>
				)}

				{/* V9: Response Section */}
				{ResponseComponent && (
					<div className="card mb-4">
						<div className="card-header d-flex justify-content-between align-items-center">
							<h5 className="mb-0">
								<BootstrapIcon icon={getBootstrapIconName('arrow-right')} size={20} className="me-2" />
								Response
							</h5>
							<button
								type="button"
								className="btn btn-outline-secondary btn-sm"
								onClick={() => handleSectionToggle('response')}
							>
								<BootstrapIcon
									icon={getBootstrapIconName(
										expandedStates['response'] ? 'chevron-up' : 'chevron-down'
									)}
									size={16}
								/>
							</button>
						</div>
						{expandedStates['response'] && (
							<div className="card-body">
								<ResponseComponent />
							</div>
						)}
					</div>
				)}

				{/* V9: Token Exchange Section */}
				{TokenExchangeComponent && (
					<div className="card mb-4">
						<div className="card-header d-flex justify-content-between align-items-center">
							<h5 className="mb-0">
								<BootstrapIcon icon={getBootstrapIconName('exchange-alt')} size={20} className="me-2" />
								Token Exchange
							</h5>
							<button
								type="button"
								className="btn btn-outline-secondary btn-sm"
								onClick={() => handleSectionToggle('token-exchange')}
							>
								<BootstrapIcon
									icon={getBootstrapIconName(
										expandedStates['token-exchange'] ? 'chevron-up' : 'chevron-down'
									)}
									size={16}
								/>
							</button>
						</div>
						{expandedStates['token-exchange'] && (
							<div className="card-body">
								<TokenExchangeComponent />
							</div>
						)}
					</div>
				)}

				{/* V9: Token Display Section */}
				{TokenDisplayComponent && (
					<div className="card mb-4">
						<div className="card-header d-flex justify-content-between align-items-center">
							<h5 className="mb-0">
								<BootstrapIcon icon={getBootstrapIconName('shield-check')} size={20} className="me-2" />
								Token Display
							</h5>
							<button
								type="button"
								className="btn btn-outline-secondary btn-sm"
								onClick={() => handleSectionToggle('token-display')}
							>
								<BootstrapIcon
									icon={getBootstrapIconName(
										expandedStates['token-display'] ? 'chevron-up' : 'chevron-down'
									)}
									size={16}
								/>
							</button>
						</div>
						{expandedStates['token-display'] && (
							<div className="card-body">
								<TokenDisplayComponent />
							</div>
						)}
					</div>
				)}

				{/* V9: Additional Custom Sections */}
				{additionalSections.map((section) => (
					<div key={section.id} className="card mb-4">
						<div className="card-header d-flex justify-content-between align-items-center">
							<h5 className="mb-0">
								<BootstrapIcon icon={getBootstrapIconName(section.iconName)} size={20} className="me-2" />
								{section.title}
							</h5>
							<button
								type="button"
								className="btn btn-outline-secondary btn-sm"
								onClick={() => handleSectionToggle(section.id)}
							>
								<BootstrapIcon
									icon={getBootstrapIconName(
										expandedStates[section.id] ? 'chevron-up' : 'chevron-down'
									)}
									size={16}
								/>
							</button>
						</div>
						{expandedStates[section.id] && (
							<div className="card-body">
								<section.component />
							</div>
						)}
					</div>
				))}

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

				{/* V9: Error Handling Section */}
				{errorDetails && (
					<div className="card mb-4 border-danger">
						<div className="card-header bg-danger text-white d-flex justify-content-between align-items-center">
							<h5 className="mb-0">
								<BootstrapIcon icon={getBootstrapIconName('exclamation-triangle')} size={20} className="me-2" />
								Error Details
							</h5>
							<button
								type="button"
								className="btn btn-outline-light btn-sm"
								onClick={() => handleSectionToggle('error-handling')}
							>
								<BootstrapIcon
									icon={getBootstrapIconName(
										expandedStates['error-handling'] ? 'chevron-up' : 'chevron-down'
									)}
									size={16}
								/>
							</button>
						</div>
						{expandedStates['error-handling'] && (
							<div className="card-body">
								<div className="alert alert-danger">
									<BootstrapIcon icon={getBootstrapIconName('alert-circle')} size={20} className="me-2" />
									{errorDetails.message || 'An error occurred during the flow.'}
								</div>
								{errorDetails.details && (
									<pre className="bg-danger bg-opacity-10 p-3 rounded text-danger">
										<code>{JSON.stringify(errorDetails.details, null, 2)}</code>
									</pre>
								)}
							</div>
						)}
					</div>
				)}

				{/* V9: Custom Children Content */}
				{children}

				{/* V9: Footer */}
				<div className="card">
					<div className="card-body text-center">
						<p className="text-muted mb-0">
							<BootstrapIcon icon={getBootstrapIconName('info-circle')} size={16} className="me-1" />
							{title} V9 - PingOne UI with Enhanced Storage & Messaging
						</p>
					</div>
				</div>
			</div>
		</PingUIWrapper>
	);
};

export default V9FlowTemplate;
