// src/pages/flows/CIBAFlowV9.PingUI.tsx
// V9 CIBA Flow - PingOne UI with New Storage & Messaging
// Migrated from V7 with PingOne UI, unified storage, and feedback service

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import BootstrapIcon from '../../components/BootstrapIcon';
import { ExpandCollapseAllControls } from '../../components/ExpandCollapseAllControls';
import { getBootstrapIconName } from '../../components/iconMapping';
import { LearningTooltip } from '../../components/LearningTooltip';
import { PingUIWrapper } from '../../components/PingUIWrapper';
import { useCibaFlowV7 } from '../../hooks/useCibaFlowV7';
import { useCredentialBackup } from '../../hooks/useCredentialBackup';
import { usePageScroll } from '../../hooks/usePageScroll';
import { feedbackService } from '../../services/feedback/feedbackService';
import { useSectionsViewMode } from '../../services/sectionsViewModeService';
import { unifiedStorageManager } from '../../services/unifiedStorageManager';

// V9 CIBA Flow Controller Interface
interface CIBAFlowV9Controller {
	flowVariant: string;
	setFlowVariant: (variant: string) => void;
	credentials: any;
	setCredentials: (creds: any) => void;
	authRequest: any;
	startFlow: () => Promise<void>;
	resetFlow: () => void;
	isInProgress: boolean;
	canStart: boolean;
	tokens: any;
	setTokens: (tokens: any) => void;
	showSuccessFeedback: (message: string) => void;
	showInfoFeedback: (message: string) => void;
	showWarningFeedback: (message: string) => void;
	showErrorFeedback: (message: string) => void;
}

// V9 CIBA Flow Component Props
interface CIBAFlowV9Props {
	/** Whether to show advanced configuration */
	showAdvancedConfig?: boolean;
	/** Section IDs for expand/collapse functionality */
	sectionIds?: string[];
}

const CIBAFlowV9: React.FC<CIBAFlowV9Props> = ({
	showAdvancedConfig = true,
	sectionIds = ['overview', 'credentials', 'initiate', 'polling', 'tokens'],
}) => {
	const location = useLocation();

	// Section management with V9 service
	const { expandedStates, toggleSection, expandAll, collapseAll, areAllExpanded, areAllCollapsed } =
		useSectionsViewMode('ciba-flow-v9', sectionIds);

	// Core state
	const [currentStep, setCurrentStep] = useState(0);
	const [workerToken, setWorkerToken] = useState<string>('');
	const [loginHint, setLoginHint] = useState('');
	const [bindingMessage, setBindingMessage] = useState('');
	const [requestContext, setRequestContext] = useState(
		JSON.stringify({ device: 'Smart TV', location: 'living room', ip: '192.168.1.1' }, null, 2)
	);

	// Initialize controller with V9 flow key
	const controller = useCibaFlowV7({
		flowKey: 'ciba-v9',
		flowVersion: 'V9',
		enableAdvancedFeatures: true,
		enableSecurityFeatures: true,
		enableEducationalContent: true,
	}) as CIBAFlowV9Controller;

	// V9: Persist flow state using unified storage
	useEffect(() => {
		const saveFlowState = async () => {
			try {
				await unifiedStorageManager.save('ciba-flow-v9-state', {
					currentStep,
					loginHint,
					bindingMessage,
					requestContext,
					tokens: controller.tokens,
					timestamp: new Date().toISOString(),
				});
			} catch (error) {
				console.error('[CIBAFlowV9] Failed to save flow state:', error);
				controller.showWarningFeedback('Failed to save flow state');
			}
		};

		saveFlowState();
	}, [currentStep, loginHint, bindingMessage, requestContext, controller.tokens, controller]);

	// V9: Load flow state on mount
	useEffect(() => {
		const loadFlowState = async () => {
			try {
				const savedState = (await unifiedStorageManager.load('ciba-flow-v9-state')) as {
					currentStep?: number;
					loginHint?: string;
					bindingMessage?: string;
					requestContext?: string;
					tokens?: any;
					timestamp?: string;
				};

				if (savedState) {
					console.log('🔄 [CIBAFlowV9] Restored flow state:', savedState);
					// Restore state if available and recent (within 1 hour)
					const stateAge = Date.now() - new Date(savedState.timestamp || '').getTime();
					if (stateAge < 3600000) {
						setCurrentStep(savedState.currentStep || 0);
						setLoginHint(savedState.loginHint || '');
						setBindingMessage(savedState.bindingMessage || '');
						setRequestContext(savedState.requestContext || requestContext);
						if (savedState.tokens) {
							controller.setTokens(savedState.tokens);
						}
					}
				}
			} catch (error) {
				console.error('[CIBAFlowV9] Failed to load flow state:', error);
			}
		};

		loadFlowState();
	}, [requestContext, controller]);

	// Get worker token from storage
	useEffect(() => {
		const loadToken = async () => {
			try {
				const savedToken = (await unifiedStorageManager.load('worker-token')) as string;
				if (savedToken) {
					setWorkerToken(savedToken);
					console.log('[CIBAFlowV9] Worker token loaded from storage');
				}
			} catch (error) {
				console.error('[CIBAFlowV9] Failed to load worker token:', error);
			}
		};

		loadToken();
	}, []);

	// Auto-advance when auth request is created
	useEffect(() => {
		if (controller.authRequest && currentStep === 1) {
			setCurrentStep(2);
			controller.showSuccessFeedback('Authentication request initiated');
		}
	}, [controller.authRequest, currentStep, controller]);

	// Auto-advance when tokens are received
	useEffect(() => {
		if (controller.tokens && currentStep < 4) {
			setCurrentStep(4);
			controller.showSuccessFeedback('Tokens received successfully');
		}
	}, [controller.tokens, currentStep, controller]);

	usePageScroll({ pageName: 'CIBA Flow V9 - PingOne UI', force: true });

	// V9 step validation
	const isStepValid = useCallback(
		(step: number): boolean => {
			switch (step) {
				case 0:
					return !!(
						controller.credentials?.environmentId &&
						controller.credentials?.clientId &&
						loginHint
					);
				case 1:
					return !!controller.authRequest;
				case 2:
					return !!controller.authRequest;
				case 3:
					return !!controller.tokens;
				default:
					return true;
			}
		},
		[controller, loginHint]
	);

	// V9 form update handlers
	const handleLoginHintChange = useCallback((value: string) => {
		setLoginHint(value);
	}, []);

	const handleBindingMessageChange = useCallback((value: string) => {
		setBindingMessage(value);
	}, []);

	const handleRequestContextChange = useCallback((value: string) => {
		setRequestContext(value);
	}, []);

	// V9 initiate flow handler
	const handleInitiateFlow = useCallback(async () => {
		if (!controller.canStart) {
			controller.showWarningFeedback('Cannot start flow - check configuration');
			return;
		}

		try {
			// Update controller config with CIBA-specific fields
			controller.setCredentials({
				...controller.credentials,
				loginHint,
				bindingMessage,
				requestContext: JSON.parse(requestContext),
			});

			await controller.startFlow();
			setCurrentStep(1);
		} catch (error) {
			console.error('[CIBAFlowV9] Failed to initiate flow:', error);
			controller.showErrorFeedback('Failed to initiate CIBA flow');
		}
	}, [controller, loginHint, bindingMessage, requestContext]);

	// V9 reset handler
	const handleReset = useCallback(() => {
		controller.resetFlow();
		setCurrentStep(0);
		setLoginHint('');
		setBindingMessage('');
		setRequestContext(
			JSON.stringify({ device: 'Smart TV', location: 'living room', ip: '192.168.1.1' }, null, 2)
		);
		controller.showInfoFeedback('Flow reset successfully');
	}, [controller]);

	// V9 copy to clipboard handler
	const handleCopy = useCallback(
		async (text: string, label: string) => {
			try {
				await navigator.clipboard.writeText(text);
				controller.showSuccessFeedback(`${label} copied to clipboard`);
			} catch (error) {
				controller.showWarningFeedback('Failed to copy to clipboard');
			}
		},
		[controller]
	);

	// V9 status display helper
	const getStatusDisplay = (status: 'pending' | 'approved' | 'completed' | 'failed') => {
		const statusConfig = {
			pending: { bg: 'warning', text: 'Pending Approval', icon: 'clock' },
			approved: { bg: 'success', text: 'Approved', icon: 'check-circle' },
			completed: { bg: 'primary', text: 'Completed', icon: 'check-circle-fill' },
			failed: { bg: 'danger', text: 'Failed', icon: 'x-circle' },
		};

		const config = statusConfig[status];
		return (
			<div
				className={`d-flex align-items-center p-3 rounded border bg-${config.bg} bg-opacity-10 border-${config.bg}`}
			>
				<BootstrapIcon
					icon={getBootstrapIconName(config.icon)}
					size={20}
					className={`text-${config.bg} me-2`}
				/>
				<div>
					<strong>{config.text}</strong>
				</div>
			</div>
		);
	};

	// V9 progress indicator
	const getProgressPercentage = () => {
		switch (currentStep) {
			case 0:
				return 0;
			case 1:
				return 25;
			case 2:
				return controller.isInProgress ? 50 : 75;
			case 3:
				return 75;
			case 4:
				return 100;
			default:
				return 0;
		}
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
										icon={getBootstrapIconName('phone')}
										size={28}
										className="me-3 text-primary"
									/>
									CIBA Flow V9
									<span className="badge bg-success ms-2">PingOne UI</span>
								</h1>
								<p className="text-muted mb-0">
									Client-Initiated Backchannel Authentication with PingOne UI
								</p>
							</div>
							<div className="d-flex gap-2">
								<ExpandCollapseAllControls
									pageKey="ciba-flow-v9"
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

				{/* V9 Progress Bar */}
				<div className="row mb-4">
					<div className="col-12">
						<div className="card">
							<div className="card-body">
								<div className="d-flex justify-content-between align-items-center mb-2">
									<span className="fw-semibold">Flow Progress</span>
									<span className="text-muted">{getProgressPercentage()}% Complete</span>
								</div>
								<div className="progress" style={{ height: '8px' }}>
									<div
										className="progress-bar bg-primary"
										style={{ width: `${getProgressPercentage()}%` }}
									></div>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* V9 Step Indicator */}
				<div className="row mb-4">
					<div className="col-12">
						<div className="d-flex justify-content-center">
							<nav aria-label="CIBA flow steps">
								<ul className="pagination pagination-lg">
									{['Setup', 'Initiate', 'Polling', 'Tokens'].map((step, index) => (
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

				{/* Status Display */}
				{controller.authRequest && (
					<div className="row mb-4">
						<div className="col-12">
							{controller.isInProgress
								? getStatusDisplay('pending')
								: controller.tokens
									? getStatusDisplay('completed')
									: getStatusDisplay('approved')}
						</div>
					</div>
				)}

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
							CIBA Flow V9 - Step {currentStep + 1} content will be implemented here
						</div>

						{/* Action buttons */}
						<div className="d-flex gap-2 mt-3">
							{currentStep === 0 && (
								<button
									type="button"
									className="btn btn-primary"
									onClick={handleInitiateFlow}
									disabled={!controller.canStart}
								>
									<BootstrapIcon
										icon={getBootstrapIconName('play-fill')}
										size={16}
										className="me-2"
									/>
									Initiate CIBA Flow
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
								<span className="badge bg-info">CIBA Flow</span>
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

export default CIBAFlowV9;
