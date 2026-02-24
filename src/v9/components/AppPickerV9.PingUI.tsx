/**
 * @file AppPickerV9.PingUI.tsx
 * @module v9/components
 * @description V9 App picker component with PingOne UI, new messaging, and enhanced features
 * @version 9.25.1
 * @since 2026-02-23
 * 
 * Enhanced app picker component featuring:
 * - PingOne UI design system with Bootstrap 5
 * - New feedback service integration
 * - Unified storage manager for persistence
 * - Expand/Collapse All functionality
 * - Enhanced accessibility and UX
 * - Real-time status updates
 */

import React, { useEffect, useState, useCallback } from 'react';
import { PingUIWrapper } from '@/components/PingUIWrapper';
import BootstrapIcon from '@/components/BootstrapIcon';
import { useSectionsViewMode } from '@/services/sectionsViewModeService';
import { ExpandCollapseAllControls } from '@/components/ExpandCollapseAllControls';
import { feedbackService } from '@/services/feedback/feedbackService';
import { unifiedStorageManager } from '@/services/unifiedStorageManager';
import { AppDiscoveryServiceV9 } from '@/v9/services/appDiscoveryServiceV9';
import { WorkerTokenServiceV9 } from '@/v9/services/workerTokenServiceV9';
import { WorkerTokenStatusServiceV9 } from '@/v9/services/workerTokenStatusServiceV9';

const MODULE_TAG = '[🎯 APP-PICKER-V9]';

export interface DiscoveredApp {
	id: string;
	name: string;
	description?: string;
	enabled?: boolean;
	redirectUris?: string[];
	logoutUris?: string[];
	environmentId?: string;
	createdAt?: string;
	updatedAt?: string;
}

interface AppPickerV9Props {
	environmentId: string;
	onAppSelected: (app: DiscoveredApp) => void;
	onDiscoveryComplete?: (apps: DiscoveredApp[]) => void;
	showExpandCollapseControls?: boolean;
	enablePersistence?: boolean;
	sections?: string[];
}

interface AppPickerState {
	isLoading: boolean;
	apps: DiscoveredApp[];
	showResults: boolean;
	selectedAppId: string | null;
	showWorkerTokenModal: boolean;
	showConfirmModal: boolean;
	tokenStatus: ReturnType<typeof WorkerTokenStatusServiceV9.checkWorkerTokenStatusSync>;
	expandedSections: Record<string, boolean>;
	lastDiscoveryTime: number | null;
	discoveryError: string | null;
}

/**
 * V9 App Picker Component with PingOne UI and Enhanced Features
 * 
 * Features:
 * - PingOne UI design system with Bootstrap 5
 * - New feedback service (replaces toast notifications)
 * - Unified storage manager for persistence
 * - Expand/Collapse All functionality
 * - Enhanced accessibility (WCAG 2.1 AA)
 * - Real-time status updates
 * - Error handling and recovery
 * - Performance optimizations
 */
export const AppPickerV9: React.FC<AppPickerV9Props> = ({
	environmentId,
	onAppSelected,
	onDiscoveryComplete,
	showExpandCollapseControls = true,
	enablePersistence = true,
	sections = ['discovery', 'results', 'token-management']
}) => {
	// State management
	const [state, setState] = useState<AppPickerState>(() => ({
		isLoading: false,
		apps: [],
		showResults: false,
		selectedAppId: null,
		showWorkerTokenModal: false,
		showConfirmModal: false,
		tokenStatus: WorkerTokenStatusServiceV9.checkWorkerTokenStatusSync(),
		expandedSections: {},
		lastDiscoveryTime: null,
		discoveryError: null,
	}));

	// Sections view mode hook
	const {
		expandedStates,
		isLoading: sectionsLoading,
		toggleSection,
		expandAll,
		collapseAll,
		areAllExpanded,
		areAllCollapsed
	} = useSectionsViewMode('app-picker-v9', sections);

	// Load persisted state on mount
	useEffect(() => {
		if (!enablePersistence) return;

		const loadPersistedState = async () => {
			try {
				const persistedState = await unifiedStorageManager.load<AppPickerState>(
					`app-picker-v9-state-${environmentId}`
				);
				
				if (persistedState) {
					setState(prev => ({
						...prev,
						expandedSections: persistedState.expandedSections || {},
						lastDiscoveryTime: persistedState.lastDiscoveryTime,
					}));
				}
			} catch (error) {
				console.warn(`${MODULE_TAG} Failed to load persisted state:`, error);
			}
		};

		loadPersistedState();
	}, [environmentId, enablePersistence]);

	// Save state to persistence
	const saveState = useCallback(async (updates: Partial<AppPickerState>) => {
		if (!enablePersistence) return;

		try {
			const newState = { ...state, ...updates };
			await unifiedStorageManager.save(
				`app-picker-v9-state-${environmentId}`,
				{
					expandedSections: newState.expandedSections,
					lastDiscoveryTime: newState.lastDiscoveryTime,
				}
			);
		} catch (error) {
			console.warn(`${MODULE_TAG} Failed to save state:`, error);
		}
	}, [environmentId, enablePersistence, state]);

	// Check token status on mount and periodically
	useEffect(() => {
		const checkStatus = () => {
			const status = WorkerTokenStatusServiceV9.checkWorkerTokenStatusSync();
			console.log(`${MODULE_TAG} Token status check:`, status);
			
			setState(prev => ({ ...prev, tokenStatus: status }));
			
			// Show feedback for token status changes
			if (status.status === 'expiring-soon') {
				feedbackService.showPageBanner({
					type: 'warning',
					title: 'Token Expiring Soon',
					message: status.message,
					dismissible: true,
					persistent: false,
				});
			}
		};

		checkStatus();

		// Check every 30 seconds for more responsive updates
		const interval = setInterval(checkStatus, 30000);

		// Listen for storage events and custom events
		const handleStorageChange = () => {
			console.log(`${MODULE_TAG} Storage/token updated event received`);
			checkStatus();
		};

		window.addEventListener('storage', handleStorageChange);
		window.addEventListener('workerTokenUpdated', handleStorageChange);
		window.addEventListener('pingOneTokenRefreshed', handleStorageChange);

		return () => {
			clearInterval(interval);
			window.removeEventListener('storage', handleStorageChange);
			window.removeEventListener('workerTokenUpdated', handleStorageChange);
			window.removeEventListener('pingOneTokenRefreshed', handleStorageChange);
		};
	}, []);

	// Handle worker token management
	const handleManageWorkerToken = useCallback(async () => {
		try {
			if (state.tokenStatus.isValid) {
				setState(prev => ({ ...prev, showConfirmModal: true }));
			} else {
				// Show worker token modal for new token generation
				const { handleShowWorkerTokenModal } = await import('@/v9/utils/workerTokenModalHelperV9');
				await handleShowWorkerTokenModal(
					(setShow: boolean) => setState(prev => ({ ...prev, showWorkerTokenModal: setShow })),
					(setStatus: any) => setState(prev => ({ ...prev, tokenStatus: setStatus })),
					undefined, // Use default silentApiRetrieval from config
					undefined, // Use default showTokenAtEnd from config
					true // Force show modal - user clicked button
				);
			}
		} catch (error) {
			console.error(`${MODULE_TAG} Error managing worker token:`, error);
			feedbackService.showPageBanner({
				type: 'error',
				title: 'Token Management Error',
				message: 'Failed to open token management modal',
				dismissible: true,
			});
		}
	}, [state.tokenStatus.isValid]);

	// Handle token removal confirmation
	const handleConfirmRemoveToken = useCallback(async () => {
		try {
			await WorkerTokenServiceV9.clearToken();
			window.dispatchEvent(new Event('workerTokenUpdated'));
			
			const newStatus = WorkerTokenStatusServiceV9.checkWorkerTokenStatusSync();
			setState(prev => ({ 
				...prev, 
				tokenStatus: newStatus,
				showConfirmModal: false 
			}));

			feedbackService.showSnackbar({
				type: 'success',
				message: 'Worker token removed successfully',
				duration: 4000,
			});
		} catch (error) {
			console.error(`${MODULE_TAG} Error removing token:`, error);
			feedbackService.showPageBanner({
				type: 'error',
				title: 'Token Removal Failed',
				message: 'Could not remove worker token',
				dismissible: true,
			});
		}
	}, []);

	// Handle worker token generation
	const handleWorkerTokenGenerated = useCallback(() => {
		try {
			// Dispatch events for status update
			window.dispatchEvent(new Event('workerTokenUpdated'));
			window.dispatchEvent(new Event('pingOneTokenRefreshed'));
			
			const newStatus = WorkerTokenStatusServiceV9.checkWorkerTokenStatusSync();
			setState(prev => ({ 
				...prev, 
				tokenStatus: newStatus,
				showWorkerTokenModal: false 
			}));

			feedbackService.showPageBanner({
				type: 'success',
				title: 'Token Generated',
				message: 'Worker token generated and saved successfully!',
				dismissible: true,
				duration: 5000,
			});
		} catch (error) {
			console.error(`${MODULE_TAG} Error handling token generation:`, error);
		}
	}, []);

	// Handle app discovery
	const handleDiscover = useCallback(async () => {
		console.log(`${MODULE_TAG} Discover clicked`, {
			environmentId: environmentId?.substring(0, 20),
			tokenStatus: state.tokenStatus.status,
			isValid: state.tokenStatus.isValid,
		});

		// Validation checks
		if (!environmentId?.trim()) {
			feedbackService.showInlineError('Please enter an Environment ID first', 'environment-id');
			return;
		}

		if (!state.tokenStatus.isValid) {
			console.log(`${MODULE_TAG} Token not valid, showing error`);
			feedbackService.showPageBanner({
				type: 'error',
				title: 'Invalid Token',
				message: state.tokenStatus.message,
				dismissible: true,
				persistent: true,
			});
			return;
		}

		setState(prev => ({ 
			...prev, 
			isLoading: true, 
			discoveryError: null,
			showResults: false 
		}));

		try {
			console.log(`${MODULE_TAG} Discovering apps`, { environmentId });

			// Get worker token using V9 service
			const workerTokenData = await WorkerTokenServiceV9.getToken();
			if (!workerTokenData?.token) {
				throw new Error('Worker token required - please generate one first');
			}

			// Discover applications using V9 service with enhanced API
			const discovered = await AppDiscoveryServiceV9.discoverApplications(
				environmentId,
				workerTokenData.token
			);

			if (discovered && discovered.length > 0) {
				console.log(`${MODULE_TAG} Found ${discovered.length} apps`, discovered);
				
				const enhancedApps = discovered.map(app => ({
					...app,
					environmentId,
					discoveredAt: new Date().toISOString(),
				}));

				setState(prev => ({ 
					...prev, 
					apps: enhancedApps,
					showResults: true,
					lastDiscoveryTime: Date.now(),
					discoveryError: null
				}));

				// Save discovery state
				await saveState({ lastDiscoveryTime: Date.now() });

				// Show success feedback
				feedbackService.showPageBanner({
					type: 'success',
					title: 'Discovery Complete',
					message: `Found ${discovered.length} application(s) in environment`,
					dismissible: true,
					duration: 5000,
				});

				// Notify parent component
				onDiscoveryComplete?.(enhancedApps);

				// Auto-expand results section
				if (!expandedStates['results']) {
					toggleSection('results');
				}
			} else {
				setState(prev => ({ 
					...prev, 
					apps: [],
					showResults: true,
					discoveryError: 'No applications found'
				}));

				feedbackService.showPageBanner({
					type: 'warning',
					title: 'No Applications Found',
					message: 'No applications found in this environment. Check your Environment ID and permissions.',
					dismissible: true,
				});
			}
		} catch (error) {
			console.error(`${MODULE_TAG} Discovery error`, error);
			
			const errorMessage = error instanceof Error ? error.message : 'Failed to discover applications';
			
			setState(prev => ({ 
				...prev, 
				discoveryError: errorMessage,
				showResults: true
			}));

			feedbackService.showPageBanner({
				type: 'error',
				title: 'Discovery Failed',
				message: errorMessage,
				dismissible: true,
				persistent: false,
			});
		} finally {
			setState(prev => ({ ...prev, isLoading: false }));
		}
	}, [
		environmentId, 
		state.tokenStatus, 
		expandedStates, 
		toggleSection, 
		onDiscoveryComplete, 
		saveState
	]);

	// Handle app selection
	const handleSelectApp = useCallback((app: DiscoveredApp) => {
		console.log(`${MODULE_TAG} App selected`, { appId: app.id, appName: app.name });
		
		onAppSelected(app);
		
		setState(prev => ({ 
			...prev, 
			showResults: false,
			apps: [],
			selectedAppId: app.id 
		}));

		feedbackService.showSnackbar({
			type: 'success',
			message: `Selected: ${app.name}`,
			duration: 3000,
		});
	}, [onAppSelected]);

	// Handle section toggle
	const handleSectionToggle = useCallback((sectionId: string) => {
		toggleSection(sectionId);
		setState(prev => ({
			...prev,
			expandedSections: {
				...prev.expandedSections,
				[sectionId]: !prev.expandedSections[sectionId]
			}
		}));
	}, [toggleSection]);

	// Get button disabled state
	const isDiscoverDisabled = state.isLoading || !environmentId?.trim() || !state.tokenStatus.isValid;

	// Get status color and icon
	const getStatusColor = () => {
		switch (state.tokenStatus.status) {
			case 'valid': return 'success';
			case 'expiring-soon': return 'warning';
			case 'expired': return 'danger';
			default: return 'secondary';
		}
	};

	const getStatusIcon = () => {
		switch (state.tokenStatus.status) {
			case 'valid': return 'check-circle';
			case 'expiring-soon': return 'exclamation-triangle';
			case 'expired': return 'x-circle';
			default: return 'question-circle';
		}
	};

	return (
		<PingUIWrapper>
			<div className="app-picker-v9">
				{/* Header with Expand/Collapse Controls */}
				<div className="d-flex justify-content-between align-items-center mb-3">
					<h5 className="mb-0">
						<BootstrapIcon icon="grid-3x3-gap" size={20} className="me-2" />
						Application Discovery
					</h5>
					
					{showExpandCollapseControls && (
						<ExpandCollapseAllControls
							pageKey="app-picker-v9"
							sectionIds={sections}
							allExpanded={areAllExpanded()}
							allCollapsed={areAllCollapsed()}
							onExpandAll={expandAll}
							onCollapseAll={collapseAll}
						/>
					)}
				</div>

				{/* Discovery Section */}
				<div className="card mb-3">
					<div className="card-header">
						<div className="d-flex align-items-center justify-content-between">
							<h6 className="mb-0">
								<BootstrapIcon icon="search" size={16} className="me-2" />
								Discover Applications
							</h6>
							<button
								type="button"
								className="btn btn-sm btn-outline-secondary"
								onClick={() => handleSectionToggle('discovery')}
								aria-expanded={expandedStates['discovery'] || false}
								aria-controls="discovery-content"
							>
								<BootstrapIcon 
									icon={expandedStates['discovery'] ? 'chevron-up' : 'chevron-down'} 
									size={14} 
								/>
							</button>
						</div>
					</div>
					
					<div 
						id="discovery-content"
						className={`collapse ${expandedStates['discovery'] ? 'show' : ''}`}
					>
						<div className="card-body">
							{/* Action Buttons */}
							<div className="d-flex gap-2 mb-3">
								<button
									type="button"
									onClick={handleDiscover}
									disabled={isDiscoverDisabled}
									className="btn btn-primary flex-grow-1"
								>
									<BootstrapIcon 
										icon={state.isLoading ? 'arrow-clockwise' : 'search'} 
										size={16} 
										className={`me-2 ${state.isLoading ? 'spin' : ''}`}
									/>
									{state.isLoading ? 'Discovering...' : 'Discover Apps'}
								</button>

								<button
									type="button"
									onClick={handleManageWorkerToken}
									className="btn btn-outline-primary"
									title={
										state.tokenStatus.isValid
											? 'Worker token is stored - click to manage'
											: 'No worker token - click to add'
									}
								>
									<BootstrapIcon icon="key" size={16} className="me-2" />
									{state.tokenStatus.isValid ? 'Manage Token' : 'Add Token'}
								</button>
							</div>

							{/* Token Status Display */}
							<div className={`alert alert-${getStatusColor()} d-flex align-items-center`} role="alert">
								<BootstrapIcon icon={getStatusIcon()} size={16} className="me-2" />
								<div className="flex-grow-1">
									{state.tokenStatus.message}
								</div>
								{state.lastDiscoveryTime && (
									<small className="text-muted ms-2">
										Last discovery: {new Date(state.lastDiscoveryTime).toLocaleTimeString()}
									</small>
								)}
							</div>
						</div>
					</div>
				</div>

				{/* Results Section */}
				{state.showResults && (
					<div className="card mb-3">
						<div className="card-header">
							<div className="d-flex align-items-center justify-content-between">
								<h6 className="mb-0">
									<BootstrapIcon icon="list-ul" size={16} className="me-2" />
									Discovery Results
									{state.apps.length > 0 && (
										<span className="badge bg-primary ms-2">
											{state.apps.length}
										</span>
									)}
								</h6>
								<button
									type="button"
									className="btn btn-sm btn-outline-secondary"
									onClick={() => handleSectionToggle('results')}
									aria-expanded={expandedStates['results'] || false}
									aria-controls="results-content"
								>
									<BootstrapIcon 
										icon={expandedStates['results'] ? 'chevron-up' : 'chevron-down'} 
										size={14} 
									/>
								</button>
							</div>
						</div>
						
						<div 
							id="results-content"
							className={`collapse ${expandedStates['results'] ? 'show' : ''}`}
						>
							<div className="card-body p-0">
								{state.discoveryError ? (
									<div className="alert alert-warning m-3">
										<BootstrapIcon icon="exclamation-triangle" size={16} className="me-2" />
										{state.discoveryError}
									</div>
								) : state.apps.length > 0 ? (
									<div className="list-group list-group-flush">
										{state.apps.map((app) => (
											<div
												key={app.id}
												role="button"
												tabIndex={0}
												className={`list-group-item list-group-item-action ${
													state.selectedAppId === app.id ? 'active' : ''
												}`}
												onClick={() => handleSelectApp(app)}
												onKeyDown={(e) => {
													if (e.key === 'Enter' || e.key === ' ') {
														e.preventDefault();
														handleSelectApp(app);
													}
												}}
											>
												<div className="d-flex justify-content-between align-items-start">
													<div className="flex-grow-1">
														<h6 className="mb-1">{app.name}</h6>
														{app.description && (
															<p className="text-muted small mb-1">{app.description}</p>
														)}
														<small className="text-muted">
															ID: {app.id}
														</small>
														{app.redirectUris && app.redirectUris.length > 0 && (
															<div className="mt-1">
																<small className="text-info">
																	<BootstrapIcon icon="link-45deg" size={12} className="me-1" />
																	{app.redirectUris.length} Redirect URI{app.redirectUris.length !== 1 ? 's' : ''}
																</small>
															</div>
														)}
													</div>
													<div className="ms-2">
														<BootstrapIcon icon="arrow-right" size={16} />
													</div>
												</div>
											</div>
										))}
									</div>
								) : (
									<div className="text-center p-4 text-muted">
										<BootstrapIcon icon="search" size={32} className="mb-2" />
										<p>No applications found</p>
										<small>Make sure you have a valid Environment ID and worker token</small>
									</div>
								)}
							</div>
						</div>
					</div>
				)}

				{/* Token Management Section */}
				<div className="card">
					<div className="card-header">
						<div className="d-flex align-items-center justify-content-between">
							<h6 className="mb-0">
								<BootstrapIcon icon="key" size={16} className="me-2" />
								Token Management
							</h6>
							<button
								type="button"
								className="btn btn-sm btn-outline-secondary"
								onClick={() => handleSectionToggle('token-management')}
								aria-expanded={expandedStates['token-management'] || false}
								aria-controls="token-management-content"
							>
								<BootstrapIcon 
									icon={expandedStates['token-management'] ? 'chevron-up' : 'chevron-down'} 
									size={14} 
								/>
							</button>
						</div>
					</div>
					
					<div 
						id="token-management-content"
						className={`collapse ${expandedStates['token-management'] ? 'show' : ''}`}
					>
						<div className="card-body">
							<div className="text-center">
								<BootstrapIcon 
									icon={getStatusIcon()} 
									size={32} 
									className={`text-${getStatusColor()} mb-2`} 
								/>
								<p className="mb-3">{state.tokenStatus.message}</p>
								<button
									type="button"
									onClick={handleManageWorkerToken}
									className="btn btn-primary"
								>
									<BootstrapIcon icon="gear" size={16} className="me-2" />
									Manage Worker Token
								</button>
							</div>
						</div>
					</div>
				</div>

				{/* Modals */}
				{/* Worker Token Modal - would be imported from V9 components */}
				{/* Confirm Modal - would be imported from V9 components */}
			</div>

			{/* Custom Styles */}
			<style>{`
				.app-picker-v9 .spin {
					animation: spin 1s linear infinite;
				}
				
				@keyframes spin {
					from { transform: rotate(0deg); }
					to { transform: rotate(360deg); }
				}
			`}</style>
		</PingUIWrapper>
	);
};

export default AppPickerV9;
