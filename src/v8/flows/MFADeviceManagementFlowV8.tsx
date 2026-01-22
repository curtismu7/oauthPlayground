/**
 * @file MFADeviceManagementFlowV8.tsx
 * @module v8/flows
 * @description MFA Device Management Flow - Manage user's MFA devices
 * @version 8.0.0
 * @since 2024-11-19
 *
 * Features:
 * - View all MFA devices for a user
 * - Rename devices
 * - Block/Unblock devices
 * - Delete devices
 *
 * @example
 * <MFADeviceManagementFlowV8 />
 */

import React, { useEffect, useState } from 'react';
import { usePageScroll } from '@/hooks/usePageScroll';
import { apiCallTrackerService } from '@/services/apiCallTrackerService';
import { MFADeviceManagerV8 } from '@/v8/components/MFADeviceManagerV8';
import { MFAHeaderV8 } from '@/v8/components/MFAHeaderV8';
import { SuperSimpleApiDisplayV8 } from '@/v8/components/SuperSimpleApiDisplayV8';
import { WorkerTokenModalV8 } from '@/v8/components/WorkerTokenModalV8';
import { useApiDisplayPadding } from '@/v8/hooks/useApiDisplayPadding';
import { CredentialsServiceV8 } from '@/v8/services/credentialsServiceV8';
import { EnvironmentIdServiceV8 } from '@/v8/services/environmentIdServiceV8';
import { workerTokenServiceV8 } from '@/v8/services/workerTokenServiceV8';
import { WorkerTokenStatusServiceV8 } from '@/v8/services/workerTokenStatusServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

const MODULE_TAG = '[🔧 DEVICE-MGMT-FLOW-V8]';
const FLOW_KEY = 'mfa-device-mgmt-v8';

interface Credentials {
	environmentId: string;
	username: string;
	[key: string]: unknown;
}

export const MFADeviceManagementFlowV8: React.FC = () => {
	console.log(`${MODULE_TAG} Initializing device management flow`);

	// Scroll to top on page load
	usePageScroll({ pageName: 'MFA Device Management V8', force: true });

	const [credentials, setCredentials] = useState<Credentials>(() => {
		const stored = CredentialsServiceV8.loadCredentials(FLOW_KEY, {
			flowKey: FLOW_KEY,
			flowType: 'oidc',
			includeClientSecret: false,
			includeRedirectUri: false,
			includeLogoutUri: false,
			includeScopes: false,
		});

		// Get global environment ID if not in flow-specific storage
		const globalEnvId = EnvironmentIdServiceV8.getEnvironmentId();
		const environmentId = stored.environmentId || globalEnvId || '';

		console.log(`${MODULE_TAG} Loading credentials`, {
			flowSpecificEnvId: stored.environmentId,
			globalEnvId,
			usingEnvId: environmentId,
		});

		return {
			environmentId,
			username: stored.username || '',
		};
	});

	const [showWorkerTokenModal, setShowWorkerTokenModal] = useState(false);
	const [tokenStatus, setTokenStatus] = useState(() =>
		WorkerTokenStatusServiceV8.checkWorkerTokenStatus()
	);
	const [isReady, setIsReady] = useState(false);

	// Worker Token Settings - Load from config service
	const [silentApiRetrieval, setSilentApiRetrieval] = useState(() => {
		try {
			const { MFAConfigurationServiceV8 } = require('@/v8/services/mfaConfigurationServiceV8');
			return MFAConfigurationServiceV8.loadConfiguration().workerToken.silentApiRetrieval || false;
		} catch {
			return false;
		}
	});
	const [showTokenAtEnd, setShowTokenAtEnd] = useState(() => {
		try {
			const { MFAConfigurationServiceV8 } = require('@/v8/services/mfaConfigurationServiceV8');
			return MFAConfigurationServiceV8.loadConfiguration().workerToken.showTokenAtEnd || true;
		} catch {
			return true;
		}
	});

	// Listen for config updates
	useEffect(() => {
		const handleConfigUpdate = (event: CustomEvent) => {
			if (event.detail?.workerToken) {
				setSilentApiRetrieval(event.detail.workerToken.silentApiRetrieval || false);
				setShowTokenAtEnd(event.detail.workerToken.showTokenAtEnd !== false);
			}
		};
		window.addEventListener('mfaConfigurationUpdated', handleConfigUpdate as EventListener);
		return () => {
			window.removeEventListener('mfaConfigurationUpdated', handleConfigUpdate as EventListener);
		};
	}, []);

	// Get API display padding
	const { paddingBottom } = useApiDisplayPadding();

	// Check worker token on mount and when token updates (with silent retrieval support)
	useEffect(() => {
		// #region agent log
		// #endregion
		const checkToken = async () => {
			const currentStatus = WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
			setTokenStatus(currentStatus);
			// #region agent log
			// #endregion

			// If token is missing or expired, use helper to handle silent retrieval
			if (!currentStatus.isValid) {
				// #region agent log
				// #endregion
				const { handleShowWorkerTokenModal } = await import('@/v8/utils/workerTokenModalHelperV8');
				await handleShowWorkerTokenModal(
					setShowWorkerTokenModal,
					setTokenStatus,
					silentApiRetrieval,  // Page checkbox value takes precedence
					showTokenAtEnd       // Page checkbox value takes precedence
				);
			}
		};

		checkToken();

		// Listen for token updates
		const handleTokenUpdate = () => {
			const newStatus = WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
			setTokenStatus(newStatus);
		};

		window.addEventListener('workerTokenUpdated', handleTokenUpdate);
		return () => {
			window.removeEventListener('workerTokenUpdated', handleTokenUpdate);
		};
	}, [silentApiRetrieval, showTokenAtEnd]); // Re-run when checkboxes change to trigger silent retrieval

	// Check token status periodically (for status updates only, not for silent retrieval)
	useEffect(() => {
		const checkStatus = () => {
			const status = WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
			setTokenStatus(status);
		};

		const interval = setInterval(checkStatus, 30000);

		const handleStorageChange = () => {
			checkStatus();
		};
		window.addEventListener('storage', handleStorageChange);

		return () => {
			clearInterval(interval);
			window.removeEventListener('storage', handleStorageChange);
		};
	}, []);

	// Clear API calls on mount
	useEffect(() => {
		apiCallTrackerService.clearApiCalls();
	}, []);

	// Save credentials when they change
	useEffect(() => {
		console.log(`${MODULE_TAG} Credentials changed, saving`, credentials);
		CredentialsServiceV8.saveCredentials(FLOW_KEY, credentials);

		// Save environment ID globally so it's shared across all flows
		if (credentials.environmentId) {
			EnvironmentIdServiceV8.saveEnvironmentId(credentials.environmentId);
			console.log(`${MODULE_TAG} Environment ID saved globally`, {
				environmentId: credentials.environmentId,
			});
		}
	}, [credentials]);

	const handleManageWorkerToken = async () => {
		if (tokenStatus.isValid) {
			const { uiNotificationServiceV8 } = await import('@/v8/services/uiNotificationServiceV8');
			const confirmed = await uiNotificationServiceV8.confirm({
				title: 'Remove Worker Token',
				message: 'Worker token is currently stored.\n\nDo you want to remove it?',
				confirmText: 'Remove',
				cancelText: 'Cancel',
				severity: 'warning',
			});
			if (confirmed) {
				// #region agent log
				// #endregion
				await workerTokenServiceV8.clearToken();
				// #region agent log
				// #endregion
				window.dispatchEvent(new Event('workerTokenUpdated'));
				const newStatus = WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
				// #region agent log
				// #endregion
				setTokenStatus(newStatus);
				toastV8.success('Worker token removed');
			}
		} else {
			// Use helper to check silentApiRetrieval before showing modal
			const { handleShowWorkerTokenModal } = await import('@/v8/utils/workerTokenModalHelperV8');
			// #region agent log
			// #endregion
			await handleShowWorkerTokenModal(setShowWorkerTokenModal, setTokenStatus, silentApiRetrieval, showTokenAtEnd);
		}
	};

	const handleWorkerTokenGenerated = () => {
		window.dispatchEvent(new Event('workerTokenUpdated'));
		const newStatus = WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
		setTokenStatus(newStatus);
		toastV8.success('Worker token generated and saved!');
	};

	const handleLoadDevices = () => {
		if (!credentials.environmentId?.trim()) {
			toastV8.error('Environment ID is required');
			return;
		}
		if (!credentials.username?.trim()) {
			toastV8.error('Username is required');
			return;
		}
		if (!tokenStatus.isValid) {
			toastV8.error('Worker token is required');
			return;
		}

		setIsReady(true);
	};

	return (
		<div
			className="mfa-device-mgmt-flow-v8"
			style={{
				paddingBottom: paddingBottom !== '0' ? paddingBottom : '0',
				transition: 'padding-bottom 0.3s ease',
				minHeight: '100vh',
			}}
		>
			<MFAHeaderV8
				title="MFA Device Management"
				description="View and manage user MFA devices"
				versionTag="V8"
				currentPage="management"
				showRestartFlow={false}
				showBackToMain={true}
				headerColor="blue"
			/>

			<div className="flow-container">
				{!isReady ? (
					<div className="setup-section">
						<h2>Setup</h2>
						<p>Enter user details to manage their MFA devices</p>

						{/* Worker Token Status */}
						<div style={{ marginBottom: '20px' }}>
							<div
								style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}
							>
								<button
									type="button"
									onClick={handleManageWorkerToken}
									className="token-button"
									style={{
										padding: '10px 16px',
										background: tokenStatus.isValid ? '#10b981' : '#ef4444',
										color: 'white',
										border: 'none',
										borderRadius: '6px',
										fontSize: '14px',
										fontWeight: '600',
										cursor: 'pointer',
										display: 'flex',
										alignItems: 'center',
										gap: '8px',
									}}
								>
									<span>🔑</span>
									<span>{tokenStatus.isValid ? 'Manage Token' : 'Add Token'}</span>
								</button>

								<div
									style={{
										flex: 1,
										padding: '10px 12px',
										background: tokenStatus.isValid
											? tokenStatus.status === 'expiring-soon'
												? '#fef3c7'
												: '#d1fae5'
											: '#fee2e2',
										border: `1px solid ${WorkerTokenStatusServiceV8.getStatusColor(tokenStatus.status)}`,
										borderRadius: '4px',
										fontSize: '12px',
										fontWeight: '500',
										color: tokenStatus.isValid
											? tokenStatus.status === 'expiring-soon'
												? '#92400e'
												: '#065f46'
											: '#991b1b',
									}}
								>
									<span>{WorkerTokenStatusServiceV8.getStatusIcon(tokenStatus.status)}</span>
									<span style={{ marginLeft: '6px' }}>{tokenStatus.message}</span>
								</div>
							</div>

							{!tokenStatus.isValid && (
								<div className="info-box" style={{ marginBottom: '0' }}>
									<p>
										<strong>⚠️ Worker Token Required:</strong> This flow uses a worker token to
										manage MFA devices. Please click "Add Token" to configure your worker token
										credentials.
									</p>
								</div>
							)}
							
							{/* Worker Token Settings Checkboxes */}
							<div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
								<label
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: '12px',
										cursor: 'pointer',
										userSelect: 'none',
										padding: '8px',
										borderRadius: '6px',
										transition: 'background-color 0.2s ease',
									}}
									onMouseEnter={(e) => {
										e.currentTarget.style.backgroundColor = '#f3f4f6';
									}}
									onMouseLeave={(e) => {
										e.currentTarget.style.backgroundColor = 'transparent';
									}}
								>
									<input
										type="checkbox"
										checked={silentApiRetrieval}
										onChange={async (e) => {
											const newValue = e.target.checked;
											setSilentApiRetrieval(newValue);
											// Update config service immediately (no cache)
											const { MFAConfigurationServiceV8 } = await import('@/v8/services/mfaConfigurationServiceV8');
											const config = MFAConfigurationServiceV8.loadConfiguration();
											config.workerToken.silentApiRetrieval = newValue;
											MFAConfigurationServiceV8.saveConfiguration(config);
											// Dispatch event to notify other components
											window.dispatchEvent(new CustomEvent('mfaConfigurationUpdated', { detail: { workerToken: config.workerToken } }));
											toastV8.info(`Silent API Token Retrieval set to: ${newValue}`);
											
											// If enabling silent retrieval and token is missing/expired, attempt silent retrieval now
											if (newValue) {
												const currentStatus = WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
												if (!currentStatus.isValid) {
													console.log('[DEVICE-MGMT-FLOW-V8] Silent API retrieval enabled, attempting to fetch token now...');
													const { handleShowWorkerTokenModal } = await import('@/v8/utils/workerTokenModalHelperV8');
													await handleShowWorkerTokenModal(
														setShowWorkerTokenModal,
														setTokenStatus,
														newValue,  // Use new value
														showTokenAtEnd,
														false      // Not forced - respect silent setting
													);
												}
											}
										}}
										style={{
											width: '20px',
											height: '20px',
											cursor: 'pointer',
											accentColor: '#6366f1',
											flexShrink: 0,
										}}
									/>
									<div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
										<span style={{ fontSize: '14px', color: '#374151', fontWeight: '500' }}>
											Silent API Token Retrieval
										</span>
										<span style={{ fontSize: '12px', color: '#6b7280' }}>
											Automatically fetch worker token in the background without showing modals
										</span>
									</div>
								</label>

								<label
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: '12px',
										cursor: 'pointer',
										userSelect: 'none',
										padding: '8px',
										borderRadius: '6px',
										transition: 'background-color 0.2s ease',
									}}
									onMouseEnter={(e) => {
										e.currentTarget.style.backgroundColor = '#f3f4f6';
									}}
									onMouseLeave={(e) => {
										e.currentTarget.style.backgroundColor = 'transparent';
									}}
								>
									<input
										type="checkbox"
										checked={showTokenAtEnd}
										onChange={async (e) => {
											const newValue = e.target.checked;
											setShowTokenAtEnd(newValue);
											// Update config service immediately (no cache)
											const { MFAConfigurationServiceV8 } = await import('@/v8/services/mfaConfigurationServiceV8');
											const config = MFAConfigurationServiceV8.loadConfiguration();
											config.workerToken.showTokenAtEnd = newValue;
											MFAConfigurationServiceV8.saveConfiguration(config);
											// Dispatch event to notify other components
											window.dispatchEvent(new CustomEvent('mfaConfigurationUpdated', { detail: { workerToken: config.workerToken } }));
											toastV8.info(`Show Token After Generation set to: ${newValue}`);
										}}
										style={{
											width: '20px',
											height: '20px',
											cursor: 'pointer',
											accentColor: '#6366f1',
											flexShrink: 0,
										}}
									/>
									<div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
										<span style={{ fontSize: '14px', color: '#374151', fontWeight: '500' }}>
											Show Token After Generation
										</span>
										<span style={{ fontSize: '12px', color: '#6b7280' }}>
											Display the generated worker token in a modal after successful retrieval
										</span>
									</div>
								</label>
							</div>
						</div>

						<div className="credentials-grid">
							<div className="form-group">
								<label htmlFor="mgmt-env-id">
									Environment ID <span className="required">*</span>
								</label>
								<input
									id="mgmt-env-id"
									type="text"
									value={credentials.environmentId}
									onChange={(e) =>
										setCredentials({ ...credentials, environmentId: e.target.value })
									}
									placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
								/>
								<small>PingOne environment ID</small>
							</div>

							<div className="form-group">
								<label htmlFor="mgmt-username">
									Username <span className="required">*</span>
								</label>
								<input
									id="mgmt-username"
									type="text"
									value={credentials.username}
									onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
									placeholder="john.doe"
								/>
								<small>PingOne username to manage devices for</small>
							</div>
						</div>

						<button
							type="button"
							className="btn btn-primary"
							onClick={handleLoadDevices}
							disabled={!credentials.environmentId || !credentials.username || !tokenStatus.isValid}
							style={{ marginTop: '20px' }}
						>
							Load Devices
						</button>
					</div>
				) : (
					<>
						<div
							style={{
								marginBottom: '20px',
								padding: '12px',
								background: '#f9fafb',
								borderRadius: '6px',
								border: '1px solid #e5e7eb',
							}}
						>
							<button
								type="button"
								onClick={() => setIsReady(false)}
								style={{
									padding: '6px 12px',
									background: '#6b7280',
									color: 'white',
									border: 'none',
									borderRadius: '4px',
									fontSize: '13px',
									cursor: 'pointer',
								}}
							>
								← Back to Setup
							</button>
						</div>
						<MFADeviceManagerV8
							environmentId={credentials.environmentId}
							username={credentials.username}
						/>
					</>
				)}
			</div>

			{/* Worker Token Modal */}
			{showWorkerTokenModal && (() => {
				// Check if we should show token only (matches MFA pattern)
				try {
					const { MFAConfigurationServiceV8 } = require('@/v8/services/mfaConfigurationServiceV8');
					const config = MFAConfigurationServiceV8.loadConfiguration();
					const tokenStatus = WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
					
					// Show token-only if showTokenAtEnd is ON and token is valid
					const showTokenOnly = config.workerToken.showTokenAtEnd && tokenStatus.isValid;
					
					return (
						<WorkerTokenModalV8
							isOpen={showWorkerTokenModal}
							onClose={() => {
								setShowWorkerTokenModal(false);
								// Refresh token status when modal closes (matches MFA pattern)
								setTokenStatus(WorkerTokenStatusServiceV8.checkWorkerTokenStatus());
							}}
							onTokenGenerated={handleWorkerTokenGenerated}
							environmentId={credentials.environmentId}
							showTokenOnly={showTokenOnly}
						/>
					);
				} catch {
					return (
			<WorkerTokenModalV8
				isOpen={showWorkerTokenModal}
							onClose={() => {
								setShowWorkerTokenModal(false);
								setTokenStatus(WorkerTokenStatusServiceV8.checkWorkerTokenStatus());
							}}
				onTokenGenerated={handleWorkerTokenGenerated}
				environmentId={credentials.environmentId}
			/>
					);
				}
			})()}

			<style>{`
				.mfa-device-mgmt-flow-v8 {
					max-width: 1200px;
					margin: 0 auto;
					background: #f8f9fa;
					min-height: 100vh;
					overflow-y: auto;
					padding-bottom: 40px;
				}

				.flow-container {
					padding: 20px;
				}

				.setup-section {
					background: white;
					border: 1px solid #ddd;
					border-radius: 8px;
					padding: 20px;
				}

				.setup-section h2 {
					font-size: 20px;
					font-weight: 600;
					margin: 0 0 8px 0;
					color: #1f2937;
				}

				.setup-section > p {
					font-size: 14px;
					color: #6b7280;
					margin: 0 0 20px 0;
				}

				.credentials-grid {
					display: grid;
					grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
					gap: 16px;
				}

				.form-group {
					display: flex;
					flex-direction: column;
					gap: 6px;
				}

				.form-group label {
					font-size: 13px;
					font-weight: 500;
					color: #374151;
				}

				.required {
					color: #ef4444;
					margin-left: 2px;
				}

				.form-group input {
					padding: 10px 12px;
					border: 1px solid #d1d5db;
					borderRadius: 6px;
					fontSize: 14px;
					fontFamily: monospace;
					color: #1f2937;
					background: white;
				}

				.form-group input:focus {
					outline: none;
					border-color: #3b82f6;
					box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
				}

				.form-group small {
					font-size: 12px;
					color: #6b7280;
				}

				.info-box {
					background: #dbeafe;
					border: 1px solid #93c5fd;
					border-radius: 8px;
					padding: 16px;
					margin: 16px 0;
				}

				.info-box p {
					margin: 8px 0;
					font-size: 14px;
					color: #1e40af;
				}

				.btn {
					padding: 12px 24px;
					border: none;
					border-radius: 6px;
					font-size: 14px;
					font-weight: 500;
					cursor: pointer;
					transition: all 0.2s ease;
				}

				.btn-primary {
					background: #3b82f6;
					color: white;
				}

				.btn-primary:hover {
					background: #2563eb;
				}

				.btn-primary:disabled {
					background: #d1d5db;
					cursor: not-allowed;
				}
			`}</style>

			<SuperSimpleApiDisplayV8 flowFilter="mfa" />
		</div>
	);
};

export default MFADeviceManagementFlowV8;
