/**
 * @file workerTokenUIServiceV8.tsx
 * @module v8/services
 * @description Worker Token UI Service V8 - Extracted from MFA for reuse
 * @version 8.0.0
 * @since 2025-01-26
 *
 * This service provides the complete worker token UI functionality extracted from MFA:
 * - Dynamic Get Worker Token button with status-based colors
 * - WorkerTokenStatusDisplayV8 integration
 * - Settings checkboxes with MFAConfigurationServiceV8 integration
 * - Auto-silent retrieval functionality
 * - Event system for configuration updates
 */

import React, { useCallback, useEffect, useState } from 'react';
import { FiLoader, FiSettings } from 'react-icons/fi';
import styled from 'styled-components';
import { AppDiscoveryModalV8U } from '../../v8u/components/AppDiscoveryModalV8U';
import type { DiscoveredApp } from '../components/AppPickerV8';
import { WorkerTokenModalV8 } from '../components/WorkerTokenModalV8';
import { WorkerTokenStatusDisplayV8 } from '../components/WorkerTokenStatusDisplayV8';
import { toastV8 } from '../utils/toastNotificationsV8';
import { MFAConfigurationServiceV8 } from './mfaConfigurationServiceV8';
import type { TokenStatusInfo } from './workerTokenStatusServiceV8';
import { WorkerTokenStatusServiceV8 } from './workerTokenStatusServiceV8';

export interface WorkerTokenUIServiceV8Props {
	/** Display mode for the status display */
	mode?: 'compact' | 'detailed' | 'minimal' | 'wide';
	/** Show refresh button on status display */
	showRefresh?: boolean;
	/** Show status display component */
	showStatusDisplay?: boolean;
	/** Status display size variant */
	statusSize?: 'small' | 'large' | 'hub' | 'minimal';
	/** Custom className for container */
	className?: string;
	/** Custom styling for container */
	style?: React.CSSProperties;
	/** Context type - 'mfa' or 'unified' for different credential handling */
	context?: 'mfa' | 'unified';
	/** Environment ID for app discovery */
	environmentId?: string;
	/** Callback for when app is selected (for unified flows) */
	onAppSelected?: (app: DiscoveredApp) => void;
	/** Callback for when environment ID should be updated (for mfa) */
	onEnvironmentIdUpdate?: (environmentId: string) => void;
}

// Styled components (matching MFA styling)
const WorkerTokenContainer = styled.div`
	display: flex;
	flex-direction: column;
	gap: 16px;
`;

const ButtonContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 12px;
`;

const GetWorkerTokenButton = styled.button<{
	$tokenStatus: TokenStatusInfo | null;
	$isLoading: boolean;
	$variant?: 'primary' | 'secondary' | 'success';
}>`
	padding: 8px 16px;
	border: none;
	border-radius: 6px;
	background: ${(props) => {
		if (props.$variant === 'secondary') return '#f3f4f6';
		if (props.$isLoading) return '#9ca3af';
		if (props.$tokenStatus?.status === 'expiring-soon') return '#f59e0b';
		if (props.$tokenStatus?.isValid) return '#10b981';
		return '#dc2626';
	}};
	color: ${(props) => (props.$variant === 'secondary' ? '#374151' : 'white')};
	fontSize: 14px;
	fontWeight: 500;
	cursor: ${(props) => (props.$isLoading ? 'not-allowed' : 'pointer')};
	whiteSpace: nowrap;
	display: flex;
	alignItems: center;
	gap: 8px;
	opacity: ${(props) => (props.$isLoading ? 0.7 : 1)};
	transition: all 0.2s ease;

	&:hover:not(:disabled) {
		opacity: 0.9;
		transform: translateY(-1px);
	}

	&:disabled {
		cursor: not-allowed;
	}
`;

const SettingsContainer = styled.div`
	margin-top: 16px;
	display: flex;
	flex-direction: column;
	gap: 12px;
`;

const SettingLabel = styled.label`
	display: flex;
	align-items: center;
	gap: 12px;
	cursor: pointer;
	userSelect: none;
	padding: 8px;
	borderRadius: 6px;
	transition: background-color 0.2s ease;

	&:hover {
		background-color: #f3f4f6;
	}
`;

const SettingCheckbox = styled.input`
	width: 20px;
	height: 20px;
	cursor: pointer;
	accentColor: #6366f1;
	flexShrink: 0;
`;

const SettingContent = styled.div`
	display: flex;
	flex-direction: column;
	gap: 2px;
`;

const SettingTitle = styled.span`
	fontSize: 14px;
	color: #374151;
	fontWeight: 500;
`;

const SettingDescription = styled.span`
	fontSize: 12px;
	color: #6b7280;
`;

export const WorkerTokenUIServiceV8: React.FC<WorkerTokenUIServiceV8Props> = ({
	mode = 'detailed',
	showRefresh = true,
	showStatusDisplay = true,
	statusSize = 'large',
	className = '',
	style = {},
	context = 'unified',
	environmentId = '',
	onAppSelected,
	onEnvironmentIdUpdate,
}) => {
	// Status display configurations for different contexts
	const getStatusConfig = () => {
		const configs = {
			small: {
				mode: 'compact' as const,
				showRefresh: false,
				className: 'worker-token-status-small',
			},
			large: {
				mode: 'detailed' as const,
				showRefresh: true,
				className: 'worker-token-status-large',
			},
			hub: {
				mode: 'wide' as const,
				showRefresh: true,
				className: 'worker-token-status-hub',
			},
			minimal: {
				mode: 'minimal' as const,
				showRefresh: false,
				className: 'worker-token-status-minimal',
			},
		};
		return configs[statusSize] || configs.large;
	};

	const statusConfig = getStatusConfig();
	// State
	const [tokenStatus, setTokenStatus] = useState<TokenStatusInfo | null>(null);
	const [isGettingWorkerToken, setIsGettingWorkerToken] = useState(false);
	const [showAppDiscoveryModal, setShowAppDiscoveryModal] = useState(false);
	const [showWorkerTokenModal, setShowWorkerTokenModal] = useState(false);

	// Load settings from MFA Configuration Service
	const [silentApiRetrieval, setSilentApiRetrieval] = useState(() => {
		const config = MFAConfigurationServiceV8.loadConfiguration();
		return config.workerToken.silentApiRetrieval;
	});

	const [showTokenAtEnd, setShowTokenAtEnd] = useState(() => {
		const config = MFAConfigurationServiceV8.loadConfiguration();
		return config.workerToken.showTokenAtEnd;
	});

	// Initialize token status
	useEffect(() => {
		const initializeTokenStatus = async () => {
			try {
				const status = await WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
				setTokenStatus(status);
			} catch (error) {
				console.error('[WorkerTokenUIServiceV8] Failed to check token status:', error);
			}
		};

		initializeTokenStatus();
	}, []);

	// Update token status when storage changes or worker token events occur
	useEffect(() => {
		const updateTokenStatus = async () => {
			const status = await WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
			setTokenStatus(status);
		};

		// Listen for storage changes and worker token events
		const handleStorageChange = () => updateTokenStatus();

		window.addEventListener('storage', handleStorageChange);
		window.addEventListener('workerTokenUpdated', handleStorageChange);
		window.addEventListener('workerTokenCleared', handleStorageChange);

		return () => {
			window.removeEventListener('storage', handleStorageChange);
			window.removeEventListener('workerTokenUpdated', handleStorageChange);
			window.removeEventListener('workerTokenCleared', handleStorageChange);
		};
	}, []);

	// Listen for config updates
	useEffect(() => {
		const handleConfigUpdate = () => {
			// Reload fresh from config service when event fires
			const config = MFAConfigurationServiceV8.loadConfiguration();
			setSilentApiRetrieval(config.workerToken.silentApiRetrieval);
			setShowTokenAtEnd(config.workerToken.showTokenAtEnd);
		};

		window.addEventListener('mfaConfigurationUpdated', handleConfigUpdate as EventListener);

		return () => {
			window.removeEventListener('mfaConfigurationUpdated', handleConfigUpdate as EventListener);
		};
	}, []);

	// Handle Get Worker Token button click
	const handleGetWorkerToken = useCallback(async () => {
		setIsGettingWorkerToken(true);
		try {
			const { handleShowWorkerTokenModal } = await import('../utils/workerTokenModalHelperV8');

			// User explicitly clicked the button - always show modal
			// Pass current checkbox values to override config (page checkboxes take precedence)
			// forceShowModal=true because user explicitly clicked the button
			await handleShowWorkerTokenModal(
				setShowWorkerTokenModal, // Use actual state setter to show modal
				setTokenStatus,
				silentApiRetrieval, // Page checkbox value takes precedence
				showTokenAtEnd, // Page checkbox value takes precedence
				true // Always show modal when user clicks button
			);
		} catch (error) {
			console.error('[WorkerTokenUIServiceV8] Error opening worker token modal:', error);
			toastV8.error('Failed to open worker token modal');
		} finally {
			setIsGettingWorkerToken(false);
		}
	}, [silentApiRetrieval, showTokenAtEnd]);

	// Handle Silent API Retrieval checkbox change
	const handleSilentRetrievalChange = useCallback(
		async (e: React.ChangeEvent<HTMLInputElement>) => {
			const newValue = e.target.checked;
			setSilentApiRetrieval(newValue);

			// Update config service immediately (no cache)
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
				const currentStatus = await WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
				if (!currentStatus.isValid) {
					console.log(
						'[WorkerTokenUIServiceV8] Silent API retrieval enabled, attempting to fetch token now...'
					);
					try {
						const { handleShowWorkerTokenModal } = await import(
							'../utils/workerTokenModalHelperV8'
						);
						await handleShowWorkerTokenModal(
							() => {}, // No-op - modal is handled globally via events
							setTokenStatus,
							newValue, // Use new value
							showTokenAtEnd,
							false // Not forced - respect silent setting
						);
					} catch (error) {
						console.error('[WorkerTokenUIServiceV8] Error in silent retrieval:', error);
					}
				}
			}
		},
		[showTokenAtEnd]
	);

	// Handle Show Token After Generation checkbox change
	const handleShowTokenAtEndChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const newValue = e.target.checked;
		setShowTokenAtEnd(newValue);

		// Update config service immediately (no cache)
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
	}, []);

	// Handle Get Apps Config button click
	const handleGetAppsConfig = useCallback(async () => {
		let effectiveEnvironmentId = environmentId;

		// If environment ID not provided, try to extract it from worker token
		if (!effectiveEnvironmentId.trim()) {
			try {
				// Import worker token service to get credentials
				const { workerTokenServiceV8 } = await import('./workerTokenServiceV8');
				const credentials = await workerTokenServiceV8.loadCredentials();

				if (credentials?.environmentId) {
					effectiveEnvironmentId = credentials.environmentId;
					console.log('[WorkerTokenUIServiceV8] Extracted environment ID from worker token', {
						environmentId: effectiveEnvironmentId,
					});
				} else {
					// Fallback to sync method if async fails
					const syncCredentials = workerTokenServiceV8.loadCredentialsSync();
					if (syncCredentials?.environmentId) {
						effectiveEnvironmentId = syncCredentials.environmentId;
						console.log(
							'[WorkerTokenUIServiceV8] Extracted environment ID from worker token (sync)',
							{ environmentId: effectiveEnvironmentId }
						);
					} else {
						// Final fallback: try global environment ID service
						const { EnvironmentIdServiceV8 } = await import('./environmentIdServiceV8');
						const globalEnvId = EnvironmentIdServiceV8.getEnvironmentId();
						if (globalEnvId) {
							effectiveEnvironmentId = globalEnvId;
							console.log('[WorkerTokenUIServiceV8] Using globally stored environment ID', {
								environmentId: effectiveEnvironmentId,
							});
						}
					}
				}
			} catch (error) {
				console.error(
					'[WorkerTokenUIServiceV8] Failed to extract environment ID from worker token',
					{
						error: error instanceof Error ? error.message : String(error),
					}
				);
			}
		}

		if (!effectiveEnvironmentId.trim()) {
			toastV8.error(
				'Environment ID is required for app discovery. ' +
					'Either provide it in the form or ensure your worker token contains environment ID.'
			);
			return;
		}

		setShowAppDiscoveryModal(true);
	}, [environmentId]);

	// Handle app selection from discovery modal
	const handleAppSelected = useCallback(
		(app: DiscoveredApp) => {
			console.log('[WorkerTokenUIServiceV8] App selected', {
				appId: app.id,
				appName: app.name,
				context,
			});

			if (context === 'mfa') {
				// For MFA context, only update environment ID if available
				// MFA doesn't have many credential fields to fill
				if (app.id && onEnvironmentIdUpdate) {
					onEnvironmentIdUpdate(app.id);
					toastV8.success(`Environment ID updated to: ${app.id}`);
				}
			} else if (context === 'unified' && onAppSelected) {
				// For Unified context, let the parent handle full credential application
				onAppSelected(app);
			}

			setShowAppDiscoveryModal(false);
		},
		[context, onEnvironmentIdUpdate, onAppSelected]
	);

	// Render minimal mode (just status display - removed)
	if (mode === 'minimal') {
		return (
			<div className={className} style={style}>
				{/* WorkerTokenStatusDisplayV8 - Removed */}
			</div>
		);
	}

	// Render compact mode (status + button)
	if (mode === 'compact') {
		return (
			<WorkerTokenContainer className={className} style={style}>
				<ButtonContainer>
					<GetWorkerTokenButton
						onClick={handleGetWorkerToken}
						disabled={isGettingWorkerToken}
						$tokenStatus={tokenStatus}
						$isLoading={isGettingWorkerToken}
					>
						{isGettingWorkerToken && (
							<FiLoader style={{ animation: 'spin 1s linear infinite', fontSize: '14px' }} />
						)}
						{isGettingWorkerToken ? 'Getting Token...' : 'Get Worker Token'}
					</GetWorkerTokenButton>
				</ButtonContainer>

				{/* Worker Token Modal */}
				<WorkerTokenModalV8
					isOpen={showWorkerTokenModal}
					onClose={() => {
						setShowWorkerTokenModal(false);
						WorkerTokenStatusServiceV8.checkWorkerTokenStatus().then(setTokenStatus);
					}}
					onTokenGenerated={async () => {
						const newStatus = await WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
						setTokenStatus(newStatus);
						if (!showTokenAtEnd) {
							setShowWorkerTokenModal(false);
						}
					}}
				/>
			</WorkerTokenContainer>
		);
	}

	// Render detailed mode (full component)
	return (
		<WorkerTokenContainer className={className} style={style}>
			{/* Worker Token Button and Status */}
			<div style={{ marginBottom: '20px' }}>
				<div style={{ marginBottom: '8px' }}>
					<div
						style={{
							display: 'block',
							marginBottom: '8px',
							fontSize: '14px',
							fontWeight: '500',
							color: '#374151',
						}}
					>
						Worker Token
					</div>
				</div>

				<ButtonContainer>
					<GetWorkerTokenButton
						onClick={handleGetWorkerToken}
						disabled={isGettingWorkerToken}
						$tokenStatus={tokenStatus}
						$isLoading={isGettingWorkerToken}
					>
						{isGettingWorkerToken && (
							<FiLoader style={{ animation: 'spin 1s linear infinite', fontSize: '14px' }} />
						)}
						{isGettingWorkerToken ? 'Getting Token...' : 'Get Worker Token'}
					</GetWorkerTokenButton>
				</ButtonContainer>

				{/* Status Display */}
				{showStatusDisplay && (
					<WorkerTokenStatusDisplayV8
						mode={statusConfig.mode}
						showRefresh={statusConfig.showRefresh}
						className={statusConfig.className}
						refreshInterval={5}
					/>
				)}
			</div>

			{/* Worker Token Settings Checkboxes */}
			<SettingsContainer>
				<SettingLabel>
					<SettingCheckbox
						type="checkbox"
						checked={silentApiRetrieval}
						onChange={handleSilentRetrievalChange}
					/>
					<SettingContent>
						<SettingTitle>Silent API Token Retrieval</SettingTitle>
						<SettingDescription>
							Automatically fetch worker token in the background without showing modals
						</SettingDescription>
					</SettingContent>
				</SettingLabel>

				<SettingLabel>
					<SettingCheckbox
						type="checkbox"
						checked={showTokenAtEnd}
						onChange={handleShowTokenAtEndChange}
					/>
					<SettingContent>
						<SettingTitle>Show Token After Generation</SettingTitle>
						<SettingDescription>
							Display the generated worker token in a modal after successful retrieval
						</SettingDescription>
					</SettingContent>
				</SettingLabel>
			</SettingsContainer>

			{/* App Discovery Modal */}
			<AppDiscoveryModalV8U
				isOpen={showAppDiscoveryModal}
				onClose={() => setShowAppDiscoveryModal(false)}
				environmentId={environmentId}
				onEnvironmentIdChange={onEnvironmentIdUpdate}
				onAppSelected={handleAppSelected}
			/>

			{/* Worker Token Modal */}
			<WorkerTokenModalV8
				isOpen={showWorkerTokenModal}
				onClose={() => {
					setShowWorkerTokenModal(false);
					// Refresh token status after modal closes
					WorkerTokenStatusServiceV8.checkWorkerTokenStatus().then(setTokenStatus);
				}}
				onTokenGenerated={async () => {
					// Refresh token status after generation
					const newStatus = await WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
					setTokenStatus(newStatus);
					// Keep modal open if showTokenAtEnd is enabled
					if (!showTokenAtEnd) {
						setShowWorkerTokenModal(false);
					}
				}}
			/>
		</WorkerTokenContainer>
	);
};
