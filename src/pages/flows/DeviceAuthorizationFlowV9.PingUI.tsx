// src/pages/flows/DeviceAuthorizationFlowV9.PingUI.tsx
// V9 Device Authorization Flow - PingOne UI with New Storage & Messaging

import React, { useCallback, useEffect, useState } from 'react';
import { EducationModeToggle } from '../../components/education/EducationModeToggle';
import { MasterEducationSection } from '../../components/education/MasterEducationSection';
import { StepNavigationButtons } from '../../components/StepNavigationButtons';
import BootstrapIcon from '../../components/BootstrapIcon';
import { getBootstrapIconName } from '../../components/iconMapping';
import { PingUIWrapper } from '../../components/PingUIWrapper';
import { ExpandCollapseAllControls } from '../../components/ExpandCollapseAllControls';
import { useSectionsViewMode } from '../../services/sectionsViewModeService';
import { feedbackService } from '../../services/feedback/feedbackService';
import { unifiedStorageManager } from '../../services/unifiedStorageManager';
import {
	useDeviceAuthorizationFlow,
} from '../../hooks/useDeviceAuthorizationFlow';
import { usePageScroll } from '../../hooks/usePageScroll';
import { checkCredentialsAndWarn } from '../../utils/credentialsWarningService';

// Page key for expand/collapse state management
const PAGE_KEY = 'device-authorization-flow-v9';

// Section IDs for expand/collapse functionality
const SECTION_IDS = [
	'flow-configuration',
	'device-selection',
	'authorization-request',
	'user-interaction',
	'token-exchange',
	'token-display',
	'error-handling',
	'educational-content',
	'security-features',
	'performance-monitoring',
	'code-examples',
	'flow-tracking',
];

const DeviceAuthorizationFlowV9: React.FC = () => {
	console.log('🚀 [DeviceAuthorizationFlowV9] V9 PingOne Flow loaded!', {
		url: window.location.href,
		search: window.location.search,
		timestamp: new Date().toISOString(),
	});

	// Scroll to top on page load
	usePageScroll({ pageName: 'Device Authorization Flow V9 - PingOne UI', force: true });

	const controller = useDeviceAuthorizationFlow({
		flowKey: 'device-authorization-v9',
		enableDebugger: true,
	});

	// Check credentials on mount and show warning if missing using new feedback service
	useEffect(() => {
		checkCredentialsAndWarn(controller.credentials, {
			flowName: 'Device Authorization Flow',
			requiredFields: ['environmentId', 'clientId', 'clientSecret'],
			showToast: true,
		});
	}, [controller.credentials]);

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
	} = useSectionsViewMode(PAGE_KEY, SECTION_IDS);

	// V9: Persist flow state using unified storage manager
	useEffect(() => {
		const saveFlowState = async () => {
			try {
				await unifiedStorageManager.save(`${PAGE_KEY}-flow-state`, {
					currentStep,
					credentials: controller.credentials,
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
	}, [currentStep, controller.credentials, errorDetails]);

	// V9: Load flow state on mount
	useEffect(() => {
		const loadFlowState = async () => {
			try {
				const savedState = await unifiedStorageManager.load(`${PAGE_KEY}-flow-state`) as {
					currentStep?: number;
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
		if (currentStep < 5) {
			setCurrentStep(currentStep + 1);
			showInfoFeedback(`Step ${currentStep + 2} of 6`);
		}
	}, [currentStep, showInfoFeedback]);

	const handlePrevStep = useCallback(() => {
		if (currentStep > 0) {
			setCurrentStep(currentStep - 1);
			showInfoFeedback(`Step ${currentStep} of 6`);
		}
	}, [currentStep, showInfoFeedback]);

	// V9: Handle credential updates
	const handleCredentialChange = useCallback((field: string, value: string) => {
		const updatedCredentials = { ...controller.credentials, [field]: value };
		controller.setCredentials(updatedCredentials);
	}, [controller.credentials, controller.setCredentials]);

	return (
		<PingUIWrapper>
			<div className="container-fluid">
				{/* V9: Flow Header with PingOne UI */}
				<div className="card mb-4">
					<div className="card-header bg-primary text-white">
						<div className="d-flex justify-content-between align-items-center">
							<div>
								<h2 className="mb-1">
									<BootstrapIcon
										icon={getBootstrapIconName('monitor')}
										size={24}
										className="me-2"
									/>
									Device Authorization Flow V9
								</h2>
								<p className="mb-0 opacity-75">
									RFC 8628 Device Authorization Grant - PingOne UI
								</p>
							</div>
							<div className="text-end">
								<span className="badge bg-light text-dark me-2">
									Version 9.3.6
								</span>
								<span className="badge bg-info">
									Step {currentStep + 1} of 6
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

				{/* V9: Step Navigation */}
				<div className="card mb-4">
					<div className="card-body">
						<StepNavigationButtons
							currentStep={currentStep}
							totalSteps={6}
							onNext={handleNextStep}
							onPrevious={handlePrevStep}
						/>
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
								Configure your OAuth 2.0 Device Authorization Flow parameters below.
							</div>
							<div className="row">
								<div className="col-md-6">
									<div className="mb-3">
										<label htmlFor="environmentId" className="form-label">Environment ID</label>
										<input
											type="text"
											id="environmentId"
											className="form-control"
											value={controller.credentials.environmentId || ''}
											onChange={(e) => handleCredentialChange('environmentId', e.target.value)}
											placeholder="Enter Environment ID"
										/>
									</div>
								</div>
								<div className="col-md-6">
									<div className="mb-3">
										<label htmlFor="clientId" className="form-label">Client ID</label>
										<input
											type="text"
											id="clientId"
											className="form-control"
											value={controller.credentials.clientId || ''}
											onChange={(e) => handleCredentialChange('clientId', e.target.value)}
											placeholder="Enter Client ID"
										/>
									</div>
								</div>
								<div className="col-md-6">
									<div className="mb-3">
										<label htmlFor="clientSecret" className="form-label">Client Secret</label>
										<input
											type="password"
											id="clientSecret"
											className="form-control"
											value={controller.credentials.clientSecret || ''}
											onChange={(e) => handleCredentialChange('clientSecret', e.target.value)}
											placeholder="Enter Client Secret"
										/>
									</div>
								</div>
								<div className="col-md-6">
									<div className="mb-3">
										<label htmlFor="deviceCodeEndpoint" className="form-label">Device Code Endpoint</label>
										<input
											type="url"
											id="deviceCodeEndpoint"
											className="form-control"
											value={controller.credentials.deviceCodeEndpoint || ''}
											onChange={(e) => handleCredentialChange('deviceCodeEndpoint', e.target.value)}
											placeholder="https://auth.pingone.com/device"
										/>
									</div>
								</div>
							</div>
						</div>
					)}
				</div>

				{/* V9: Device Selection Section */}
				<div className="card mb-4">
					<div className="card-header d-flex justify-content-between align-items-center">
						<h5 className="mb-0">
							<BootstrapIcon icon={getBootstrapIconName('monitor')} size={20} className="me-2" />
							Device Selection
						</h5>
						<button
							type="button"
							className="btn btn-outline-secondary btn-sm"
							onClick={() => handleSectionToggle('device-selection')}
						>
							<BootstrapIcon
								icon={getBootstrapIconName(
									expandedStates['device-selection'] ? 'chevron-up' : 'chevron-down'
								)}
								size={16}
							/>
						</button>
					</div>
					{expandedStates['device-selection'] && (
						<div className="card-body">
							<div className="alert alert-info">
								<BootstrapIcon icon={getBootstrapIconName('smartphone')} size={20} className="me-2" />
								Select the device type for this authorization flow.
							</div>
							<div className="row">
								<div className="col-md-4">
									<div className="card border-primary">
										<div className="card-body text-center">
											<BootstrapIcon icon={getBootstrapIconName('monitor')} size={48} className="text-primary mb-3" />
											<h6>Smart TV</h6>
											<small className="text-muted">Entertainment device</small>
										</div>
									</div>
								</div>
								<div className="col-md-4">
									<div className="card border-info">
										<div className="card-body text-center">
											<BootstrapIcon icon={getBootstrapIconName('smartphone')} size={48} className="text-info mb-3" />
											<h6>Mobile Device</h6>
											<small className="text-muted">Phone or tablet</small>
										</div>
									</div>
								</div>
								<div className="col-md-4">
									<div className="card border-warning">
										<div className="card-body text-center">
											<BootstrapIcon icon={getBootstrapIconName('cpu')} size={48} className="text-warning mb-3" />
											<h6>IoT Device</h6>
											<small className="text-muted">Connected device</small>
										</div>
									</div>
								</div>
							</div>
						</div>
					)}
				</div>

				{/* V9: Authorization Request Section */}
				<div className="card mb-4">
					<div className="card-header d-flex justify-content-between align-items-center">
						<h5 className="mb-0">
							<BootstrapIcon icon={getBootstrapIconName('key')} size={20} className="me-2" />
							Authorization Request
						</h5>
						<button
							type="button"
							className="btn btn-outline-secondary btn-sm"
							onClick={() => handleSectionToggle('authorization-request')}
						>
							<BootstrapIcon
								icon={getBootstrapIconName(
									expandedStates['authorization-request'] ? 'chevron-up' : 'chevron-down'
								)}
								size={16}
							/>
						</button>
					</div>
					{expandedStates['authorization-request'] && (
						<div className="card-body">
							<div className="alert alert-success">
								<BootstrapIcon icon={getBootstrapIconName('check-circle')} size={20} className="me-2" />
								Device authorization request will be sent here.
							</div>
							<div className="text-center">
								<button
									type="button"
									className="btn btn-primary btn-lg"
									onClick={() => showInfoFeedback('Device authorization request initiated')}
								>
									<BootstrapIcon icon={getBootstrapIconName('play')} size={20} className="me-2" />
									Request Device Code
								</button>
							</div>
						</div>
					)}
				</div>

				{/* V9: User Interaction Section */}
				<div className="card mb-4">
					<div className="card-header d-flex justify-content-between align-items-center">
						<h5 className="mb-0">
							<BootstrapIcon icon={getBootstrapIconName('user')} size={20} className="me-2" />
							User Interaction
						</h5>
						<button
							type="button"
							className="btn btn-outline-secondary btn-sm"
							onClick={() => handleSectionToggle('user-interaction')}
						>
							<BootstrapIcon
								icon={getBootstrapIconName(
									expandedStates['user-interaction'] ? 'chevron-up' : 'chevron-down'
								)}
								size={16}
							/>
						</button>
					</div>
					{expandedStates['user-interaction'] && (
						<div className="card-body">
							<div className="alert alert-info">
								<BootstrapIcon icon={getBootstrapIconName('external-link')} size={20} className="me-2" />
								User will visit the verification URI to complete authorization.
							</div>
							<div className="text-center">
								<div className="mb-3">
									<BootstrapIcon icon={getBootstrapIconName('qr-code')} size={64} className="text-muted" />
									<p className="mt-2">QR Code will be displayed here</p>
								</div>
								<div className="row">
									<div className="col-md-6">
										<div className="card">
											<div className="card-body">
												<h6>Verification URI</h6>
												<p className="text-break small">
													https://auth.pingone.com/device/verify
												</p>
												<button
													type="button"
													className="btn btn-outline-primary btn-sm"
													onClick={() => handleCopy('https://auth.pingone.com/device/verify', 'verification URI')}
												>
													<BootstrapIcon icon={getBootstrapIconName('clipboard')} size={16} className="me-1" />
													Copy
												</button>
											</div>
										</div>
									</div>
									<div className="col-md-6">
										<div className="card">
											<div className="card-body">
												<h6>User Code</h6>
												<p className="h4 text-primary">ABCD-1234</p>
												<button
													type="button"
													className="btn btn-outline-primary btn-sm"
													onClick={() => handleCopy('ABCD-1234', 'user code')}
												>
													<BootstrapIcon icon={getBootstrapIconName('clipboard')} size={16} className="me-1" />
													Copy
												</button>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					)}
				</div>

				{/* V9: Token Exchange Section */}
				<div className="card mb-4">
					<div className="card-header d-flex justify-content-between align-items-center">
						<h5 className="mb-0">
							<BootstrapIcon icon={getBootstrapIconName('arrow-right')} size={20} className="me-2" />
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
							<div className="alert alert-warning">
								<BootstrapIcon icon={getBootstrapIconName('clock')} size={20} className="me-2" />
								Polling for token exchange. Device code will be exchanged for access token.
							</div>
							<div className="text-center">
								<div className="spinner-border text-primary" role="status">
									<span className="visually-hidden">Polling...</span>
								</div>
								<p className="mt-2">Polling for authorization...</p>
							</div>
						</div>
					)}
				</div>

				{/* V9: Token Display Section */}
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
							<div className="alert alert-success">
								<BootstrapIcon icon={getBootstrapIconName('check-circle')} size={20} className="me-2" />
								Access token will be displayed here after successful authorization.
							</div>
							{controller.tokens && (
								<div className="mt-3">
									<h6>Access Token</h6>
									<div className="position-relative">
										<pre className="bg-light p-3 rounded">
											<code>{controller.tokens.access_token}</code>
										</pre>
										<button
											type="button"
											className="btn btn-outline-primary btn-sm position-absolute top-0 end-0 m-2"
											onClick={() => handleCopy(controller.tokens?.access_token || '', 'access token')}
										>
											<BootstrapIcon
												icon={getBootstrapIconName('clipboard')}
												size={16}
												className="me-1"
											/>
											Copy
										</button>
									</div>
								</div>
							)}
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

				{/* V9: Footer */}
				<div className="card">
					<div className="card-body text-center">
						<p className="text-muted mb-0">
							<BootstrapIcon icon={getBootstrapIconName('info-circle')} size={16} className="me-1" />
							Device Authorization Flow V9 - PingOne UI with Enhanced Storage & Messaging
						</p>
					</div>
				</div>
			</div>
		</PingUIWrapper>
	);
};

export default DeviceAuthorizationFlowV9;
