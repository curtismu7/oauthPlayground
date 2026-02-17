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
import { unifiedWorkerTokenService } from '@/services/unifiedWorkerTokenService';
import { ButtonSpinner } from '../../components/ui/ButtonSpinner';
import { MFADeviceManagerV8 } from '@/v8/components/MFADeviceManagerV8';
import { MFAHeaderV8 } from '@/v8/components/MFAHeaderV8';
import { SuperSimpleApiDisplayV8 } from '@/v8/components/SuperSimpleApiDisplayV8';
import { WorkerTokenModalV8 } from '@/v8/components/WorkerTokenModalV8';
import { useApiDisplayPadding } from '@/v8/hooks/useApiDisplayPadding';
import { CredentialsServiceV8 } from '@/v8/services/credentialsServiceV8';
import { EnvironmentIdServiceV8 } from '@/v8/services/environmentIdServiceV8';
import { MFAConfigurationServiceV8 } from '@/v8/services/mfaConfigurationServiceV8';
import { workerTokenServiceV8 } from '@/v8/services/workerTokenServiceV8';
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
		// Try to load from unified MFA flow first (most likely source)
		const unifiedMfaCredentials = CredentialsServiceV8.loadCredentials('mfa-flow-v8', {
			flowKey: 'mfa-flow-v8',
			flowType: 'oidc',
			includeClientSecret: false,
			includeRedirectUri: false,
			includeLogoutUri: false,
			includeScopes: false,
		});

		// Fallback to device management flow specific storage
		const deviceMgmtCredentials = CredentialsServiceV8.loadCredentials(FLOW_KEY, {
			flowKey: FLOW_KEY,
			flowType: 'oidc',
			includeClientSecret: false,
			includeRedirectUri: false,
			includeLogoutUri: false,
			includeScopes: false,
		});

		// Use unified MFA credentials if available, otherwise fallback to device management credentials
		const stored = unifiedMfaCredentials.environmentId
			? unifiedMfaCredentials
			: deviceMgmtCredentials;

		// Get global environment ID if not in flow-specific storage
		const globalEnvId = EnvironmentIdServiceV8.getEnvironmentId();
		const environmentId = stored.environmentId || globalEnvId || '';

		console.log(`${MODULE_TAG} Loading credentials`, {
			unifiedMfaEnvId: unifiedMfaCredentials.environmentId,
			deviceMgmtEnvId: deviceMgmtCredentials.environmentId,
			globalEnvId,
			usingEnvId: environmentId,
			source: unifiedMfaCredentials.environmentId ? 'unified-mfa-flow' : 'device-mgmt-flow',
		});

		return {
			environmentId,
			username: stored.username || '',
		};
	});

	const [showWorkerTokenModal, setShowWorkerTokenModal] = useState(false);
	// Use unified worker token service for token status
	const [tokenStatus, setTokenStatus] = useState<any>(null);
	const [showTokenOnly, setShowTokenOnly] = useState(false);
	const [isReady, setIsReady] = useState(false);
	const [isLoadingDevices, setIsLoadingDevices] = useState(false);

	// Load token status on mount
	useEffect(() => {
		const loadTokenStatus = async () => {
			try {
				const status = await unifiedWorkerTokenService.getStatus();
				setTokenStatus(status);
			} catch (error) {
				console.error('[DEVICE-MGMT-FLOW-V8] Failed to load token status:', error);
				setTokenStatus(null);
			}
		};
		loadTokenStatus();
	}, []);

	// Worker Token Settings - Load from config service
	const [silentApiRetrieval, setSilentApiRetrieval] = useState(() => {
		try {
			return MFAConfigurationServiceV8.loadConfiguration().workerToken.silentApiRetrieval || false;
		} catch {
			return false;
		}
	});
	const [showTokenAtEnd, setShowTokenAtEnd] = useState(() => {
		try {
			return MFAConfigurationServiceV8.loadConfiguration().workerToken.showTokenAtEnd !== false;
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

	// Listen for credential updates from unified MFA flow
	useEffect(() => {
		const handleCredentialUpdate = () => {
			console.log(`${MODULE_TAG} Credential update detected, refreshing credentials`);

			// Reload credentials from unified MFA flow first
			const unifiedMfaCredentials = CredentialsServiceV8.loadCredentials('mfa-flow-v8', {
				flowKey: 'mfa-flow-v8',
				flowType: 'oidc',
				includeClientSecret: false,
				includeRedirectUri: false,
				includeLogoutUri: false,
				includeScopes: false,
			});

			// Fallback to device management flow specific storage
			const deviceMgmtCredentials = CredentialsServiceV8.loadCredentials(FLOW_KEY, {
				flowKey: FLOW_KEY,
				flowType: 'oidc',
				includeClientSecret: false,
				includeRedirectUri: false,
				includeLogoutUri: false,
				includeScopes: false,
			});

			// Use unified MFA credentials if available, otherwise fallback to device management credentials
			const stored = unifiedMfaCredentials.environmentId
				? unifiedMfaCredentials
				: deviceMgmtCredentials;

			// Get global environment ID if not in flow-specific storage
			const globalEnvId = EnvironmentIdServiceV8.getEnvironmentId();
			const environmentId = stored.environmentId || globalEnvId || '';

			const newCredentials = {
				environmentId,
				username: stored.username || '',
			};

			console.log(`${MODULE_TAG} Updated credentials`, {
				newEnvironmentId: newCredentials.environmentId,
				newUsername: newCredentials.username,
				source: unifiedMfaCredentials.environmentId ? 'unified-mfa-flow' : 'device-mgmt-flow',
			});

			setCredentials(newCredentials);
		};

		// Listen for credential updates from unified MFA flow
		window.addEventListener('mfaCredentialsUpdated', handleCredentialUpdate as EventListener);

		return () => {
			window.removeEventListener('mfaCredentialsUpdated', handleCredentialUpdate as EventListener);
		};
	}, []);

	// Get API display padding
	const { paddingBottom } = useApiDisplayPadding();

	// Check worker token on mount and when token updates (with silent retrieval support)
	useEffect(() => {
		// #region agent log
		// #endregion
		const checkToken = () => {
			// Force re-render to get updated token status from unified service
			setIsReady(true);
		};

		// Listen for token updates
		const handleTokenUpdate = () => {
			// Force re-render to get updated token status from unified service
			setShowWorkerTokenModal((prev) => !prev);
		};

		checkToken();

		// Listen for token updates
		window.addEventListener('workerTokenUpdated', handleTokenUpdate);
		return () => {
			window.removeEventListener('workerTokenUpdated', handleTokenUpdate);
		};
	}, []); // Re-run when checkboxes change to trigger silent retrieval

	// Update showTokenOnly when modal opens or token status changes
	useEffect(() => {
		if (showWorkerTokenModal) {
			const updateShowTokenOnly = async () => {
				try {
					const config = MFAConfigurationServiceV8.loadConfiguration();
					const currentStatus = await unifiedWorkerTokenService.getStatus();
					setShowTokenOnly(config.workerToken.showTokenAtEnd && currentStatus.tokenValid);
				} catch {
					setShowTokenOnly(false);
				}
			};
			updateShowTokenOnly();
		}
	}, [showWorkerTokenModal]);
	useEffect(() => {
		// Listen for unified worker token updates
		const handleStorageChange = (e: StorageEvent) => {
			if (e.key === 'unified_worker_token') {
				// Force re-render to get updated token status
				setShowWorkerTokenModal((prev) => !prev);
			}
		};

		window.addEventListener('storage', handleStorageChange);
		return () => window.removeEventListener('storage', handleStorageChange);
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
		if (tokenStatus?.isValid) {
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
				// Force re-render to get updated token status from unified service
				setShowWorkerTokenModal((prev) => !prev);
				toastV8.success('Worker token removed');
			}
		} else {
			// User explicitly clicked the button - always show modal
			// Use helper to check silentApiRetrieval before showing modal
			const { handleShowWorkerTokenModal } = await import('@/v8/utils/workerTokenModalHelperV8');
			await handleShowWorkerTokenModal(
				setShowWorkerTokenModal,
				async (status) => setTokenStatus(await status),
				silentApiRetrieval,
				showTokenAtEnd,
				true // Force show modal - user clicked button
			);
		}
	};

	const handleWorkerTokenGenerated = () => {
		window.dispatchEvent(new Event('workerTokenUpdated'));
		// Force re-render to get updated token status from unified service
		setShowWorkerTokenModal((prev) => !prev);
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
		if (!tokenStatus?.isValid) {
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
								<ButtonSpinner
									loading={false}
									onClick={handleManageWorkerToken}
									spinnerSize={14}
									spinnerPosition="left"
									style={{
										padding: '10px 16px',
										background: tokenStatus?.isValid ? '#10b981' : '#ef4444',
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
									Get worker token
								</ButtonSpinner>

								<div
									style={{
										flex: 1,
										padding: '10px 12px',
										background: tokenStatus?.isValid
											? tokenStatus.status === 'expiring-soon'
												? '#fef3c7'
												: '#d1fae5'
											: '#fee2e2',
										border: `1px solid ${tokenStatus?.isValid ? '#10b981' : '#ef4444'}`,
										borderRadius: '4px',
										fontSize: '12px',
										fontWeight: '500',
										color: tokenStatus?.isValid
											? tokenStatus.status === 'expiring-soon'
												? '#92400e'
												: '#065f46'
											: '#991b1b',
									}}
								>
									<span>{tokenStatus?.isValid ? '✅' : '❌'}</span>
									<span style={{ marginLeft: '6px' }}>{tokenStatus?.message || 'Loading...'}</span>
								</div>
							</div>

							{!tokenStatus?.isValid && (
								<div className="info-box" style={{ marginBottom: '0' }}>
									<p>
										<strong>⚠️ Worker Token Required:</strong> This flow uses a worker token to
										manage MFA devices. Please click "Add Token" to configure your worker token
										credentials.
									</p>
								</div>
							)}

							{/* Worker Token Settings Checkboxes */}
							<div
								style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}
							>
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
											const { MFAConfigurationServiceV8 } = await import(
												'@/v8/services/mfaConfigurationServiceV8'
											);
											const config = MFAConfigurationServiceV8.loadConfiguration();
											config.workerToken.silentApiRetrieval = newValue;
											MFAConfigurationServiceV8.saveConfiguration(config);
											// Dispatch event to notify other components
											window.dispatchEvent(
												new CustomEvent('mfaConfigurationUpdated', {
													detail: { workerToken: config.workerToken },
												})
											);
											toastV8.info(`Silent API Token Retrieval set to: ${newValue}`);

											// If enabling silent retrieval and token is missing/expired, attempt silent retrieval now
											if (newValue) {
												const currentStatus = await unifiedWorkerTokenService.getStatus();
												if (!currentStatus.tokenValid) {
													console.log(
														'[DEVICE-MGMT-FLOW-V8] Silent API retrieval enabled, attempting to fetch token now...'
													);
													const { handleShowWorkerTokenModal } = await import(
														'@/v8/utils/workerTokenModalHelperV8'
													);
													await handleShowWorkerTokenModal(
														setShowWorkerTokenModal,
														async (status) => setTokenStatus(await status),
														newValue, // Use new value
														showTokenAtEnd,
														false // Not forced - respect silent setting
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
											const { MFAConfigurationServiceV8 } = await import(
												'@/v8/services/mfaConfigurationServiceV8'
											);
											const config = MFAConfigurationServiceV8.loadConfiguration();
											config.workerToken.showTokenAtEnd = newValue;
											MFAConfigurationServiceV8.saveConfiguration(config);
											// Dispatch event to notify other components
											window.dispatchEvent(
												new CustomEvent('mfaConfigurationUpdated', {
													detail: { workerToken: config.workerToken },
												})
											);
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

						<ButtonSpinner
							loading={isLoadingDevices}
							onClick={async () => {
								setIsLoadingDevices(true);
								await handleLoadDevices();
								setIsLoadingDevices(false);
							}}
							disabled={
								!credentials.environmentId ||
								!credentials.username ||
								!tokenStatus?.isValid ||
								isLoadingDevices
							}
							spinnerSize={16}
							spinnerPosition="left"
							loadingText="Loading..."
							style={{
								marginTop: '20px',
								background: '#3b82f6',
								color: 'white',
								border: 'none',
								padding: '0.75rem 1.5rem',
								borderRadius: '0.5rem',
								fontWeight: '600',
								cursor: 'pointer',
								transition: 'all 0.2s ease',
							}}
						>
							{isLoadingDevices ? '' : 'Load Devices'}
						</ButtonSpinner>
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
							<ButtonSpinner
								loading={false}
								onClick={() => setIsReady(false)}
								spinnerSize={12}
								spinnerPosition="left"
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
							</ButtonSpinner>
						</div>
						<MFADeviceManagerV8
							environmentId={credentials.environmentId}
							username={credentials.username}
							onUsernameChange={() => setIsReady(false)}
						/>
					</>
				)}
			</div>

			{/* Worker Token Modal */}
			{showWorkerTokenModal && (
				<WorkerTokenModalV8
					isOpen={showWorkerTokenModal}
					onClose={() => {
						setShowWorkerTokenModal(false);
						// Force re-render to get updated token status from unified service
						setShowWorkerTokenModal((prev) => !prev);
					}}
					onTokenGenerated={handleWorkerTokenGenerated}
					environmentId={credentials.environmentId}
					showTokenOnly={showTokenOnly}
				/>
			)}

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
