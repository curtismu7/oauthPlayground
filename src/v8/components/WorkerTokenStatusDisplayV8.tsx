/**
 * @file WorkerTokenStatusDisplayV8.tsx
 * @module v8/components
 * @description Cool 3D-looking worker token status display with comprehensive data
 * @version 8.0.0
 * @since 2026-01-24
 *
 * Features:
 * - 3D-looking text with gradients and shadows
 * - Comprehensive token data display
 * - Real-time status updates
 * - Cool animations and transitions
 * - Responsive design
 * - Multiple display modes (compact, detailed, minimal)
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
	FiActivity,
	FiAlertCircle,
	FiCalendar,
	FiCheckCircle,
	FiClock,
	FiCpu,
	FiDatabase,
	FiGlobe,
	FiInfo,
	FiKey,
	FiLoader,
	FiLock,
	FiRefreshCw,
	FiSettings,
	FiShield,
	FiTrendingUp,
	FiZap,
} from 'react-icons/fi';
import styled, { css, keyframes } from 'styled-components';
import type {
	UnifiedWorkerTokenCredentials,
	UnifiedWorkerTokenData,
	UnifiedWorkerTokenStatus,
} from '@/services/unifiedWorkerTokenService';
import { unifiedWorkerTokenService } from '@/services/unifiedWorkerTokenService';
import { MFAConfigurationServiceV8 } from '@/v8/services/mfaConfigurationServiceV8';
import { WorkerTokenStatusServiceV8 } from '@/v8/services/workerTokenStatusServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
import {
	type TokenStatusInfo,
	WORKER_TOKEN_STATUS_STYLES,
	WorkerTokenStatusServiceV8U,
} from '@/v8u/services/workerTokenStatusServiceV8U';

// Animation keyframes
const pulse = keyframes`
	0%, 100% { transform: scale(1); opacity: 1; }
	50% { transform: scale(1.05); opacity: 0.9; }
`;

const glow = keyframes`
	0%, 100% { box-shadow: 0 0 20px rgba(16, 185, 129, 0.3); }
	50% { box-shadow: 0 0 30px rgba(16, 185, 129, 0.6); }
`;

const slideIn = keyframes`
	from { transform: translateY(-10px); opacity: 0; }
	to { transform: translateY(0); opacity: 1; }
`;

// Styled components with 3D effects
const StatusContainer = styled.div<{ $variant: 'valid' | 'invalid' | 'warning' }>`
	background: linear-gradient(135deg, 
		${(props) =>
			props.$variant === 'valid'
				? 'rgba(16, 185, 129, 0.1)'
				: props.$variant === 'warning'
					? 'rgba(245, 158, 11, 0.1)'
					: 'rgba(239, 68, 68, 0.1)'},
		${(props) =>
			props.$variant === 'valid'
				? 'rgba(34, 197, 94, 0.05)'
				: props.$variant === 'warning'
					? 'rgba(251, 191, 36, 0.05)'
					: 'rgba(248, 113, 113, 0.05)'});
	border: 2px solid ${(props) =>
		props.$variant === 'valid' ? '#10b981' : props.$variant === 'warning' ? '#f59e0b' : '#ef4444'};
	border-radius: 16px;
	padding: 16px 20px;
	position: relative;
	overflow: hidden;
	backdrop-filter: blur(10px);
	box-shadow: 
		0 8px 32px rgba(0, 0, 0, 0.1),
		0 4px 16px rgba(0, 0, 0, 0.05),
		inset 0 1px 0 rgba(255, 255, 255, 0.2);
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	animation: ${css`${slideIn} 0.5s ease-out`};

	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 1px;
		background: linear-gradient(90deg, 
			transparent, 
			rgba(255, 255, 255, 0.3), 
			transparent
		);
	}

	&::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 1px;
		background: linear-gradient(90deg, 
			transparent, 
			rgba(255, 255, 255, 0.1), 
			transparent
		);
	}

	&:hover {
		transform: translateY(-2px);
		box-shadow: 
			0 12px 40px rgba(0, 0, 0, 0.15),
			0 6px 20px rgba(0, 0, 0, 0.08),
			inset 0 1px 0 rgba(255, 255, 255, 0.3);
	}

	${(props) =>
		props.$variant === 'valid' &&
		css`
		animation: ${slideIn} 0.5s ease-out, ${glow} 3s ease-in-out infinite;
	`}
`;

const StatusHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 12px;
`;

const StatusTitle = styled.div`
	display: flex;
	align-items: center;
	gap: 12px;
`;

const StatusIcon = styled.div<{ $variant: 'valid' | 'invalid' | 'warning' }>`
	width: 40px;
	height: 40px;
	border-radius: 12px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: linear-gradient(135deg, 
		${(props) =>
			props.$variant === 'valid'
				? '#10b981'
				: props.$variant === 'warning'
					? '#f59e0b'
					: '#ef4444'},
		${(props) =>
			props.$variant === 'valid'
				? '#059669'
				: props.$variant === 'warning'
					? '#d97706'
					: '#dc2626'});
	box-shadow: 
		0 4px 12px rgba(0, 0, 0, 0.15),
		inset 0 1px 0 rgba(255, 255, 255, 0.2);
	color: white;
	font-size: 18px;
	animation: ${css`${pulse} 2s ease-in-out infinite`};
`;

const StatusText = styled.div`
	display: flex;
	flex-direction: column;
	gap: 2px;
`;

const StatusLabel = styled.div`
	font-size: 12px;
	text-transform: uppercase;
	letter-spacing: 0.5px;
	font-weight: 600;
	color: #6b7280;
	text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
`;

const StatusValue = styled.div<{ $variant: 'valid' | 'invalid' | 'warning' }>`
	font-size: 16px;
	font-weight: 900; /* Much bolder */
	color: ${(props) => WORKER_TOKEN_STATUS_STYLES.statusValue[props.$variant]};
	text-shadow: ${WORKER_TOKEN_STATUS_STYLES.shadows.text};
	filter: ${WORKER_TOKEN_STATUS_STYLES.shadows.drop};
	letter-spacing: 0.5px; /* Add letter spacing for better readability */
`;

const StatusDetails = styled.div`
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 12px;
	margin-top: 12px;

	@media (max-width: 1024px) {
		grid-template-columns: repeat(3, 1fr);
	}

	@media (max-width: 768px) {
		grid-template-columns: repeat(2, 1fr);
	}

	@media (max-width: 480px) {
		grid-template-columns: 1fr;
	}
`;

const StatusDetail = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;
	padding: 8px 12px;
	background: rgba(255, 255, 255, 0.05);
	border-radius: 8px;
	border: 1px solid rgba(255, 255, 255, 0.1);
`;

const DetailLabel = styled.div`
	font-size: 10px;
	text-transform: uppercase;
	letter-spacing: 0.5px;
	color: #9ca3af;
	font-weight: 600;
`;

const DetailValue = styled.div<{ $highlight?: boolean }>`
	font-size: 14px;
	font-weight: 700; /* Bolder */
	color: ${(props) => (props.$highlight ? WORKER_TOKEN_STATUS_STYLES.detailValue.highlight : WORKER_TOKEN_STATUS_STYLES.detailValue.normal)};
	text-shadow: ${WORKER_TOKEN_STATUS_STYLES.shadows.detail};
`;

const ConfigInfo = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	margin-top: 12px;
	padding: 8px 12px;
	background: rgba(59, 130, 246, 0.1);
	border: 1px solid rgba(59, 130, 246, 0.2);
	border-radius: 8px;
	font-size: 11px;
	color: #93c5fd;
`;

const ConfigButton = styled.button`
	background: rgba(255, 255, 255, 0.1);
	border: 1px solid rgba(255, 255, 255, 0.2);
	border-radius: 6px;
	padding: 4px 8px;
	color: #e5e7eb;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 4px;
	font-size: 11px;
	transition: all 0.2s;
	position: relative;

	&:hover {
		background: rgba(255, 255, 255, 0.2);
		transform: scale(1.05);
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.tooltip {
		position: absolute;
		bottom: 100%;
		left: 50%;
		transform: translateX(-50%);
		background: #1f2937;
		color: white;
		padding: 6px 8px;
		border-radius: 4px;
		font-size: 10px;
		white-space: nowrap;
		opacity: 0;
		pointer-events: none;
		transition: opacity 0.2s;
		margin-bottom: 4px;
		z-index: 1000;
	}

	&:hover .tooltip {
		opacity: 1;
	}
`;

const ConfigModal = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
`;

const ConfigModalContent = styled.div`
	background: white;
	border-radius: 12px;
	padding: 24px;
	max-width: 500px;
	width: 90%;
	max-height: 80vh;
	overflow-y: auto;
	box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
`;

const ConfigModalHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 20px;
`;

const ConfigModalTitle = styled.h3`
	margin: 0;
	font-size: 18px;
	font-weight: 700;
	color: #1f2937;
`;

const ConfigModalClose = styled.button`
	background: transparent;
	border: none;
	font-size: 20px;
	cursor: pointer;
	color: #6b7280;
	padding: 4px;

	&:hover {
		color: #374151;
	}
`;

const ConfigSection = styled.div`
	margin-bottom: 20px;
`;

const ConfigSectionTitle = styled.h4`
	margin: 0 0 12px 0;
	font-size: 14px;
	font-weight: 600;
	color: #374151;
`;

const ConfigOption = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 8px 0;
	border-bottom: 1px solid #f3f4f6;

	&:last-child {
		border-bottom: none;
	}
`;

const ConfigLabel = styled.div`
	display: flex;
	flex-direction: column;
	gap: 2px;
`;

const ConfigName = styled.span`
	font-size: 13px;
	font-weight: 500;
	color: #374151;
`;

const ConfigDescription = styled.span`
	font-size: 11px;
	color: #6b7280;
`;

const ConfigToggle = styled.label`
	position: relative;
	display: inline-block;
	width: 44px;
	height: 24px;
`;

const ConfigToggleInput = styled.input`
	opacity: 0;
	width: 0;
	height: 0;

	&:checked + .slider {
		background-color: #3b82f6;
	}

	&:checked + .slider:before {
		transform: translateX(20px);
	}
`;

const ConfigButtonGroup = styled.div`
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: flex-start;
	gap: 8px;
	margin-top: 16px;
	flex-wrap: nowrap;
`;

const ConfigActionButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
	background: ${(props) => (props.$variant === 'primary' ? '#3b82f6' : '#6b7280')};
	color: white;
	border: none;
	border-radius: 6px;
	padding: 8px 16px;
	font-size: 13px;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		background: ${(props) => (props.$variant === 'primary' ? '#2563eb' : '#4b5563')};
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

const RefreshButton = styled.button`
	background: transparent;
	border: 1px solid rgba(255, 255, 255, 0.2);
	border-radius: 8px;
	padding: 6px 8px;
	color: #e5e7eb;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 4px;
	font-size: 12px;
	transition: all 0.2s;

	&:hover {
		background: rgba(255, 255, 255, 0.1);
		transform: scale(1.05);
	}

	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.spin {
		animation: spin 1s linear infinite;
	}
`;

const LoadingOverlay = styled.div`
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(255, 255, 255, 0.3);
	backdrop-filter: blur(1px);
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 16px;
	z-index: 10;

	.loading-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		color: #374151;
		background: rgba(255, 255, 255, 0.9);
		padding: 12px 16px;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.loading-spinner {
		animation: spin 1s linear infinite;
		font-size: 20px;
		color: #3b82f6;
	}

	.loading-text {
		font-size: 12px;
		font-weight: 500;
	}
`;

export interface WorkerTokenStatusDisplayV8Props {
	/** Display mode */
	mode?: 'compact' | 'detailed' | 'minimal' | 'wide';
	/** Show refresh button */
	showRefresh?: boolean;
	/** Custom className */
	className?: string;
	/** Auto-refresh interval in seconds */
	refreshInterval?: number;
	/** Show configuration buttons */
	showConfig?: boolean;
}

export const WorkerTokenStatusDisplayV8: React.FC<WorkerTokenStatusDisplayV8Props> = ({
	mode = 'detailed',
	showRefresh = true,
	className = '',
	refreshInterval = 5,
	showConfig = false,
}) => {
	const [tokenStatus, setTokenStatus] = useState<TokenStatusInfo>({
		isValid: false,
		status: 'missing',
		message: 'Checking...',
		expiresAt: null,
		minutesRemaining: 0,
	});
	const [config, setConfig] = useState(() => MFAConfigurationServiceV8.loadConfiguration());
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [isLoading, setIsLoading] = useState(true); // Initial loading state
	const [fullTokenData, setFullTokenData] = useState<UnifiedWorkerTokenData | null>(null);
	const [tokenStatusInfo, setTokenStatusInfo] = useState<UnifiedWorkerTokenStatus | null>(null);

	// Configuration modal state
	const [showConfigModal, setShowConfigModal] = useState(false);
	const [oauthConfig, setOauthConfig] = useState({
		pkceEnabled: false,
		refreshTokenEnabled: false,
		tokenStorage: 'localStorage' as 'localStorage' | 'sessionStorage' | 'memory',
	});
	const [isConfigLoading, setIsConfigLoading] = useState(false);

	const updateTokenStatus = useCallback(async () => {
		try {
			const v8Status = await WorkerTokenStatusServiceV8.checkWorkerTokenStatus();

			// Convert V8 TokenStatusInfo to V8U TokenStatusInfo
			const convertedStatus: TokenStatusInfo = {
				isValid: v8Status.isValid,
				status: v8Status.status,
				message: v8Status.message,
				expiresAt: v8Status.expiresAt || null,
				issuedAt: null, // V8 service doesn't provide this
				minutesRemaining: v8Status.minutesRemaining || 0,
				lastUsed: null, // V8 service doesn't provide this
			};

			setTokenStatus(convertedStatus);

			// Fetch additional comprehensive data
			try {
				const status = await unifiedWorkerTokenService.getStatus();

				// Try to load credentials from MFA flow first, then fallback to unified service
				let credentials: UnifiedWorkerTokenCredentials | null = null;
				try {
					const { CredentialsServiceV8 } = await import('@/v8/services/credentialsServiceV8');
					const creds = CredentialsServiceV8.loadCredentials('mfa-flow-v8', {
						flowKey: 'mfa-flow-v8',
						flowType: 'oidc',
						includeClientSecret: true,
						includeLogoutUri: false,
						includeRedirectUri: false,
						includeScopes: false,
					});

					if (creds?.environmentId && creds?.clientId) {
						credentials = {
							environmentId: creds.environmentId,
							clientId: creds.clientId,
							clientSecret: creds.clientSecret || '',
						};
					}
				} catch (credError) {
					console.warn('[WorkerTokenStatusDisplayV8] Failed to load MFA credentials:', credError);
					// Fallback to unified service
					credentials = await unifiedWorkerTokenService.loadCredentials();
				}

				// Create tokenData structure from the unified service response
				const tokenData = status.hasToken && credentials
					? {
							token: '***', // Masked token for security
							credentials: credentials,
							expiresAt: status.tokenExpiresIn ? Date.now() + (status.tokenExpiresIn * 1000) : Date.now() + 3600000, // Default to 1 hour from now
							savedAt: status.lastFetchedAt || Date.now(),
							lastUsedAt: status.lastUsedAt || Date.now(),
							tokenType: 'Bearer',
							expiresIn: status.tokenExpiresIn || 3600, // Default to 1 hour
							scope: '', // Empty string instead of undefined
						}
					: null;
				setFullTokenData(tokenData);
				setTokenStatusInfo(status);
			} catch (dataError) {
				console.warn('[WorkerTokenStatusDisplayV8] Failed to fetch additional data:', dataError);
				// Don't let additional data failure break the main status
			}
		} catch (error) {
			console.error('[WorkerTokenStatusDisplayV8] Failed to check token status:', error);
		} finally {
			setIsLoading(false);
		}
	}, []);

	const handleRefresh = async () => {
		setIsRefreshing(true);
		try {
			await updateTokenStatus();
			setConfig(MFAConfigurationServiceV8.loadConfiguration());
			toastV8.success('Worker token status refreshed');
		} catch (error) {
			console.error('[WorkerTokenStatusDisplayV8] Failed to refresh token status:', error);
			toastV8.error('Failed to refresh token status');
		} finally {
			setTimeout(() => setIsRefreshing(false), 500);
		}
	};

	useEffect(() => {
		updateTokenStatus();

		// Fallback timeout to ensure loading state doesn't get stuck
		const fallbackTimeout = setTimeout(() => {
			setIsLoading(false);
		}, 3000); // 3 seconds fallback

		// Listen for token updates
		const handleTokenUpdate = async () => {
			// Use sync version for immediate updates
			const v8Status = WorkerTokenStatusServiceV8.checkWorkerTokenStatusSync();

			// Convert V8 TokenStatusInfo to V8U TokenStatusInfo
			const convertedStatus: TokenStatusInfo = {
				isValid: v8Status.isValid,
				status: v8Status.status,
				message: v8Status.message,
				expiresAt: v8Status.expiresAt || null,
				issuedAt: null, // V8 service doesn't provide this
				minutesRemaining: v8Status.minutesRemaining || 0,
				lastUsed: null, // V8 service doesn't provide this
			};

			setTokenStatus(convertedStatus);

			// Then do the full async update for additional data
			await updateTokenStatus();
		};

		const handleConfigUpdate = () => {
			setConfig(MFAConfigurationServiceV8.loadConfiguration());
		};

		window.addEventListener('workerTokenUpdated', handleTokenUpdate);
		window.addEventListener('mfaConfigurationUpdated', handleConfigUpdate);

		const interval = setInterval(updateTokenStatus, refreshInterval * 1000);

		return () => {
			clearTimeout(fallbackTimeout);
			window.removeEventListener('workerTokenUpdated', handleTokenUpdate);
			window.removeEventListener('mfaConfigurationUpdated', handleConfigUpdate);
			clearInterval(interval);
		};
	}, [refreshInterval, updateTokenStatus]);

	const getVariant = (): 'valid' | 'invalid' | 'warning' => {
		return WorkerTokenStatusServiceV8U.getVariant(tokenStatus);
	};

	const formatTimeRemaining = () => {
		return WorkerTokenStatusServiceV8U.formatTimeRemaining(tokenStatus);
	};

	const getStatusIcon = () => {
		switch (getVariant()) {
			case 'valid':
				return <FiCheckCircle />;
			case 'warning':
				return <FiClock />;
			default:
				return <FiAlertCircle />;
		}
	};

	const getStatusText = () => {
		return WorkerTokenStatusServiceV8U.getText(tokenStatus);
	};

	// Helper functions for additional data
	const formatTokenInfo = () => {
		if (!fullTokenData) return null;

		const token = fullTokenData.token;
		const tokenLength = token.length;
		const tokenPrefix = token.substring(0, 8);
		const tokenSuffix = token.substring(token.length - 8);

		return {
			length: tokenLength,
			prefix: tokenPrefix,
			suffix: tokenSuffix,
			masked: `${tokenPrefix}...${tokenSuffix}`,
			type: fullTokenData.tokenType || 'Bearer',
			scope: fullTokenData.scope || 'N/A',
		};
	};

	const formatTimestamp = (timestamp?: number) => {
		if (!timestamp) return 'N/A';
		return new Date(timestamp).toLocaleString();
	};

	const formatDuration = (start: number, end?: number) => {
		const now = end || Date.now();
		const duration = now - start;
		const minutes = Math.floor(duration / 60000);
		const hours = Math.floor(minutes / 60);
		const days = Math.floor(hours / 24);

		if (days > 0) return `${days}d ${hours % 24}h`;
		if (hours > 0) return `${hours}h ${minutes % 60}m`;
		return `${minutes}m`;
	};

	const getTokenAge = () => {
		if (!fullTokenData?.savedAt) return 'N/A';
		return formatDuration(fullTokenData.savedAt);
	};

	const getTimeSinceLastUsed = () => {
		if (!fullTokenData?.lastUsedAt) return 'Never';
		return `${formatDuration(fullTokenData.lastUsedAt)} ago`;
	};

	// Configuration functions
	const handleOpenConfigModal = async () => {
		setIsConfigLoading(true);
		try {
			// Fetch current OAuth configuration from PingOne if we have a worker token
			if (tokenStatus.isValid) {
				try {
					// Make silent call to PingOne to get current OAuth settings
					const response = await fetch('/api/oauth/config', {
						method: 'GET',
						headers: {
							Authorization: `Bearer ${fullTokenData?.token || ''}`,
							'Content-Type': 'application/json',
						},
					});

					if (response.ok) {
						const pingOneConfig = await response.json();
						setOauthConfig({
							pkceEnabled: pingOneConfig.pkceEnabled || false,
							refreshTokenEnabled: pingOneConfig.refreshTokenEnabled || false,
							tokenStorage: pingOneConfig.tokenStorage || 'localStorage',
						});
					}
				} catch (error) {
					console.warn('[WorkerTokenStatusDisplayV8] Failed to fetch PingOne config:', error);
					// Use default config as fallback
					setOauthConfig({
						pkceEnabled: false, // Default value since oauth property doesn't exist
						refreshTokenEnabled: false, // Default value since oauth property doesn't exist
						tokenStorage: 'localStorage', // Default value since oauth property doesn't exist
					});
				}
			} else {
				// Use default config if no worker token
				setOauthConfig({
					pkceEnabled: false, // Default value since oauth property doesn't exist
					refreshTokenEnabled: false, // Default value since oauth property doesn't exist
					tokenStorage: 'localStorage', // Default value since oauth property doesn't exist
				});
			}
		} finally {
			setIsConfigLoading(false);
			setShowConfigModal(true);
		}
	};

	const handleSaveConfig = async () => {
		setIsConfigLoading(true);
		try {
			// Save to local configuration
			const newConfig = MFAConfigurationServiceV8.loadConfiguration();
			if (!newConfig.oauth) {
				newConfig.oauth = {};
			}
			newConfig.oauth.pkceEnabled = oauthConfig.pkceEnabled;
			newConfig.oauth.refreshTokenEnabled = oauthConfig.refreshTokenEnabled;
			newConfig.oauth.tokenStorage = oauthConfig.tokenStorage;
			MFAConfigurationServiceV8.saveConfiguration(newConfig);

			// If we have a worker token, try to sync with PingOne
			if (tokenStatus.isValid && fullTokenData?.token) {
				try {
					const response = await fetch('/api/oauth/config', {
						method: 'POST',
						headers: {
							Authorization: `Bearer ${fullTokenData.token}`,
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({
							pkceEnabled: oauthConfig.pkceEnabled,
							refreshTokenEnabled: oauthConfig.refreshTokenEnabled,
							tokenStorage: oauthConfig.tokenStorage,
						}),
					});

					if (response.ok) {
						toastV8.success('OAuth configuration saved to PingOne');
					} else {
						toastV8.warning('OAuth configuration saved locally, but failed to sync with PingOne');
					}
				} catch (error) {
					console.warn('[WorkerTokenStatusDisplayV8] Failed to sync config with PingOne:', error);
					toastV8.warning('OAuth configuration saved locally, but failed to sync with PingOne');
				}
			} else {
				// No worker token, ask user to get one
				toastV8.info('OAuth configuration saved locally. Get a worker token to sync with PingOne.');
			}

			// Dispatch event to notify other components
			window.dispatchEvent(new CustomEvent('oauthConfigurationUpdated', { detail: oauthConfig }));
		} catch (error) {
			console.error('[WorkerTokenStatusDisplayV8] Failed to save config:', error);
			toastV8.error('Failed to save OAuth configuration');
		} finally {
			setIsConfigLoading(false);
			setShowConfigModal(false);
		}
	};

	const handleGetWorkerTokenForConfig = async () => {
		// Import and show worker token modal
		const { handleShowWorkerTokenModal } = await import('@/v8/utils/workerTokenModalHelperV8');
		await handleShowWorkerTokenModal(
			() => {}, // setShowModal - not needed for config
			() => {}, // setTokenStatus - not needed for config
			false, // silentApiRetrieval - false for explicit user action
			false, // showTokenAtEnd - false for config
			true // forceShowModal - always show for config
		);
	};

	if (mode === 'minimal') {
		return (
			<StatusContainer $variant={getVariant()} className={className}>
				{/* Loading Overlay */}
				{(isLoading || isRefreshing) && (
					<LoadingOverlay>
						<div className="loading-content">
							<FiLoader className="loading-spinner" />
							<div className="loading-text">
								{isLoading ? 'Checking status...' : 'Refreshing...'}
							</div>
						</div>
					</LoadingOverlay>
				)}

				<StatusHeader>
					<StatusTitle>
						<StatusIcon $variant={getVariant()}>{getStatusIcon()}</StatusIcon>
						<StatusText>
							<StatusLabel>Worker Token</StatusLabel>
							<StatusValue $variant={getVariant()}>{getStatusText()}</StatusValue>
						</StatusText>
					</StatusTitle>
					{showRefresh && (
						<RefreshButton onClick={handleRefresh} disabled={isRefreshing}>
							<FiRefreshCw className={isRefreshing ? 'spin' : ''} />
						</RefreshButton>
					)}
				</StatusHeader>
			</StatusContainer>
		);
	}

	if (mode === 'wide') {
		return (
			<>
				<StatusContainer
					$variant={getVariant()}
					className={className}
					style={{
						minHeight: '48px',
						maxHeight: '48px',
						padding: '8px 16px',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						width: '100%',
						flex: '1',
					}}
				>
					{/* Loading Overlay */}
					{(isLoading || isRefreshing) && (
						<LoadingOverlay>
							<div className="loading-content">
								<FiLoader className="loading-spinner" />
								<div className="loading-text">
									{isLoading ? 'Checking status...' : 'Refreshing...'}
								</div>
							</div>
						</LoadingOverlay>
					)}

					<div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
						<StatusIcon $variant={getVariant()}>{getStatusIcon()}</StatusIcon>
						<div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
							<StatusLabel style={{ margin: 0, fontSize: '13px' }}>Worker Token</StatusLabel>
							<StatusValue $variant={getVariant()} style={{ margin: 0, fontSize: '13px' }}>
								{getStatusText()}
							</StatusValue>
							{tokenStatus.expiresAt && (
								<span
									style={{
										fontSize: '11px',
										color: tokenStatus.isValid ? '#10b981' : '#ef4444',
										marginLeft: '6px',
									}}
								>
									({formatTimeRemaining()})
								</span>
							)}
						</div>
					</div>

					<div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
						{showConfig && (
							<>
								<ConfigButton onClick={handleOpenConfigModal}>
									<FiSettings />
									<span className="tooltip">Configure OAuth Settings</span>
								</ConfigButton>
								<ConfigButton onClick={handleOpenConfigModal}>
									<FiLock />
									<span className="tooltip">PKCE Settings</span>
								</ConfigButton>
								<ConfigButton onClick={handleOpenConfigModal}>
									<FiDatabase />
									<span className="tooltip">Token Storage</span>
								</ConfigButton>
							</>
						)}
						{showRefresh && (
							<RefreshButton onClick={handleRefresh} disabled={isRefreshing}>
								<FiRefreshCw className={isRefreshing ? 'spin' : ''} />
							</RefreshButton>
						)}
					</div>
				</StatusContainer>

				{/* Configuration Modal */}
				{showConfigModal && (
					<ConfigModal>
						<ConfigModalContent>
							<ConfigModalHeader>
								<ConfigModalTitle>
									<FiSettings style={{ marginRight: '8px' }} />
									OAuth Configuration
								</ConfigModalTitle>
								<ConfigModalClose onClick={() => setShowConfigModal(false)}>×</ConfigModalClose>
							</ConfigModalHeader>

							<ConfigSection>
								<ConfigSectionTitle>Security Settings</ConfigSectionTitle>
								<ConfigOption>
									<ConfigLabel>
										<ConfigName>PKCE (Proof Key for Code Exchange)</ConfigName>
										<ConfigDescription>Enable PKCE for enhanced OAuth security</ConfigDescription>
									</ConfigLabel>
									<ConfigToggle>
										<ConfigToggleInput
											type="checkbox"
											checked={oauthConfig.pkceEnabled}
											onChange={(e) =>
												setOauthConfig((prev) => ({ ...prev, pkceEnabled: e.target.checked }))
											}
										/>
										<span className="slider"></span>
									</ConfigToggle>
								</ConfigOption>
								<ConfigOption>
									<ConfigLabel>
										<ConfigName>Refresh Tokens</ConfigName>
										<ConfigDescription>
											Enable refresh token support for long-lived sessions
										</ConfigDescription>
									</ConfigLabel>
									<ConfigToggle>
										<ConfigToggleInput
											type="checkbox"
											checked={oauthConfig.refreshTokenEnabled}
											onChange={(e) =>
												setOauthConfig((prev) => ({
													...prev,
													refreshTokenEnabled: e.target.checked,
												}))
											}
										/>
										<span className="slider"></span>
									</ConfigToggle>
								</ConfigOption>
							</ConfigSection>

							<ConfigSection>
								<ConfigSectionTitle>Token Storage</ConfigSectionTitle>
								<ConfigOption>
									<ConfigLabel>
										<ConfigName>Storage Location</ConfigName>
										<ConfigDescription>Choose where tokens are stored</ConfigDescription>
									</ConfigLabel>
									<select
										value={oauthConfig.tokenStorage}
										onChange={(e) =>
											setOauthConfig((prev) => ({
												...prev,
												tokenStorage: e.target.value as
													| 'localStorage'
													| 'sessionStorage'
													| 'memory',
											}))
										}
										style={{
											padding: '6px 8px',
											border: '1px solid #d1d5db',
											borderRadius: '4px',
											fontSize: '13px',
										}}
									>
										<option value="localStorage">localStorage (persistent)</option>
										<option value="sessionStorage">sessionStorage (session)</option>
										<option value="memory">memory (temporary)</option>
									</select>
								</ConfigOption>
							</ConfigSection>

							{!tokenStatus.isValid && (
								<ConfigSection>
									<ConfigSectionTitle>Worker Token Required</ConfigSectionTitle>
									<div
										style={{
											padding: '12px',
											background: '#fef3c7',
											border: '1px solid #f59e0b',
											borderRadius: '6px',
											marginBottom: '12px',
										}}
									>
										<p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#92400e' }}>
											<strong>Worker token required</strong> to sync OAuth settings with PingOne.
										</p>
										<p style={{ margin: 0, fontSize: '12px', color: '#78350f' }}>
											Get a worker token to enable secure OAuth configuration synchronization.
										</p>
									</div>
									<ConfigActionButton onClick={handleGetWorkerTokenForConfig}>
										Get Worker Token
									</ConfigActionButton>
								</ConfigSection>
							)}

							<ConfigButtonGroup>
								<ConfigActionButton
									onClick={handleSaveConfig}
									disabled={isConfigLoading}
									$variant="primary"
								>
									{isConfigLoading ? 'Saving...' : 'Save Configuration'}
								</ConfigActionButton>
								<ConfigActionButton onClick={() => setShowConfigModal(false)} $variant="secondary">
									Cancel
								</ConfigActionButton>
							</ConfigButtonGroup>
						</ConfigModalContent>
					</ConfigModal>
				)}
			</>
		);
	}

	if (mode === 'compact') {
		return (
			<StatusContainer $variant={getVariant()} className={className}>
				{/* Loading Overlay */}
				{(isLoading || isRefreshing) && (
					<LoadingOverlay>
						<div className="loading-content">
							<FiLoader className="loading-spinner" />
							<div className="loading-text">
								{isLoading ? 'Checking status...' : 'Refreshing...'}
							</div>
						</div>
					</LoadingOverlay>
				)}

				<StatusHeader>
					<StatusTitle>
						<StatusIcon $variant={getVariant()}>{getStatusIcon()}</StatusIcon>
						<StatusText>
							<StatusLabel>Worker Token Status</StatusLabel>
							<StatusValue $variant={getVariant()}>{getStatusText()}</StatusValue>
						</StatusText>
					</StatusTitle>
					{showRefresh && (
						<RefreshButton onClick={handleRefresh} disabled={isRefreshing}>
							<FiRefreshCw className={isRefreshing ? 'spin' : ''} />
						</RefreshButton>
					)}
				</StatusHeader>
				<StatusDetails>
					<StatusDetail>
						<DetailLabel>Time Remaining</DetailLabel>
						<DetailValue $highlight={tokenStatus.isValid}>{formatTimeRemaining()}</DetailValue>
					</StatusDetail>
					<StatusDetail>
						<DetailLabel>Status</DetailLabel>
						<DetailValue>{tokenStatus.message}</DetailValue>
					</StatusDetail>
				</StatusDetails>
			</StatusContainer>
		);
	}

	// Detailed mode (default)
	return (
		<StatusContainer
			$variant={getVariant()}
			className={className}
			style={{
				minHeight: '200px',
				border: '3px solid #10b981',
				background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(34, 197, 94, 0.05))',
				position: 'relative',
			}}
		>
			{/* Loading Overlay */}
			{(isLoading || isRefreshing) && (
				<LoadingOverlay>
					<div className="loading-content">
						<FiLoader className="loading-spinner" />
						<div className="loading-text">{isLoading ? 'Checking status...' : 'Refreshing...'}</div>
					</div>
				</LoadingOverlay>
			)}

			<StatusHeader>
				<StatusTitle>
					<StatusIcon $variant={getVariant()}>{getStatusIcon()}</StatusIcon>
					<StatusText>
						<StatusLabel>Worker Token Status</StatusLabel>
						<StatusValue $variant={getVariant()}>{getStatusText()}</StatusValue>
					</StatusText>
				</StatusTitle>
				{showRefresh && (
					<RefreshButton onClick={handleRefresh} disabled={isRefreshing}>
						<FiRefreshCw className={isRefreshing ? 'spin' : ''} />
						Refresh
					</RefreshButton>
				)}
			</StatusHeader>

			<StatusDetails>
				{/* Token Status */}
				<StatusDetail>
					<DetailLabel>
						<FiActivity style={{ fontSize: '10px', marginRight: '2px' }} />
						Status
					</DetailLabel>
					<DetailValue>{tokenStatus.message}</DetailValue>
				</StatusDetail>

				<StatusDetail>
					<DetailLabel>
						<FiClock style={{ fontSize: '10px', marginRight: '2px' }} />
						Time Remaining
					</DetailLabel>
					<DetailValue $highlight={tokenStatus.isValid}>{formatTimeRemaining()}</DetailValue>
				</StatusDetail>

				{/* Token Information */}
				{fullTokenData && (
					<>
						<StatusDetail>
							<DetailLabel>
								<FiKey style={{ fontSize: '10px', marginRight: '2px' }} />
								Token
							</DetailLabel>
							<DetailValue>{formatTokenInfo()?.masked}</DetailValue>
						</StatusDetail>

						<StatusDetail>
							<DetailLabel>
								<FiInfo style={{ fontSize: '10px', marginRight: '2px' }} />
								Token Length
							</DetailLabel>
							<DetailValue>{formatTokenInfo()?.length} chars</DetailValue>
						</StatusDetail>

						<StatusDetail>
							<DetailLabel>
								<FiShield style={{ fontSize: '10px', marginRight: '2px' }} />
								Token Type
							</DetailLabel>
							<DetailValue>{formatTokenInfo()?.type}</DetailValue>
						</StatusDetail>

						{formatTokenInfo()?.scope !== 'N/A' && (
							<StatusDetail>
								<DetailLabel>
									<FiGlobe style={{ fontSize: '10px', marginRight: '2px' }} />
									Scope
								</DetailLabel>
								<DetailValue>{formatTokenInfo()?.scope}</DetailValue>
							</StatusDetail>
						)}
					</>
				)}

				{/* Timing Information */}
				{fullTokenData && (
					<>
						<StatusDetail>
							<DetailLabel>
								<FiCalendar style={{ fontSize: '10px', marginRight: '2px' }} />
								Token Age
							</DetailLabel>
							<DetailValue>{getTokenAge()}</DetailValue>
						</StatusDetail>

						<StatusDetail>
							<DetailLabel>
								<FiTrendingUp style={{ fontSize: '10px', marginRight: '2px' }} />
								Last Used
							</DetailLabel>
							<DetailValue>{getTimeSinceLastUsed()}</DetailValue>
						</StatusDetail>

						<StatusDetail>
							<DetailLabel>
								<FiClock style={{ fontSize: '10px', marginRight: '2px' }} />
								Saved At
							</DetailLabel>
							<DetailValue>{formatTimestamp(fullTokenData.savedAt)}</DetailValue>
						</StatusDetail>

						{fullTokenData.expiresAt && (
							<StatusDetail>
								<DetailLabel>
									<FiClock style={{ fontSize: '10px', marginRight: '2px' }} />
									Expires At
								</DetailLabel>
								<DetailValue>{formatTimestamp(fullTokenData.expiresAt)}</DetailValue>
							</StatusDetail>
						)}
					</>
				)}

				{/* Configuration */}
				<StatusDetail>
					<DetailLabel>
						<FiZap style={{ fontSize: '10px', marginRight: '2px' }} />
						Silent Mode
					</DetailLabel>
					<DetailValue $highlight={config.workerToken.silentApiRetrieval}>
						{config.workerToken.silentApiRetrieval ? 'ON' : 'OFF'}
					</DetailValue>
				</StatusDetail>

				<StatusDetail>
					<DetailLabel>
						<FiShield style={{ fontSize: '10px', marginRight: '2px' }} />
						Show Token
					</DetailLabel>
					<DetailValue $highlight={config.workerToken.showTokenAtEnd}>
						{config.workerToken.showTokenAtEnd ? 'ON' : 'OFF'}
					</DetailValue>
				</StatusDetail>

				{/* Application Information */}
				{tokenStatusInfo?.appInfo && (
					<>
						{tokenStatusInfo.appInfo.appName && (
							<StatusDetail>
								<DetailLabel>
									<FiCpu style={{ fontSize: '10px', marginRight: '2px' }} />
									App Name
								</DetailLabel>
								<DetailValue>{tokenStatusInfo.appInfo.appName}</DetailValue>
							</StatusDetail>
						)}

						{tokenStatusInfo.appInfo.appVersion && (
							<StatusDetail>
								<DetailLabel>
									<FiInfo style={{ fontSize: '10px', marginRight: '2px' }} />
									App Version
								</DetailLabel>
								<DetailValue>{tokenStatusInfo.appInfo.appVersion}</DetailValue>
							</StatusDetail>
						)}
					</>
				)}

				{/* Environment Information */}
				{fullTokenData?.credentials && (
					<>
						<StatusDetail>
							<DetailLabel>
								<FiGlobe style={{ fontSize: '10px', marginRight: '2px' }} />
								Environment ID
							</DetailLabel>
							<DetailValue>{fullTokenData.credentials.environmentId}</DetailValue>
						</StatusDetail>

						<StatusDetail>
							<DetailLabel>
								<FiKey style={{ fontSize: '10px', marginRight: '2px' }} />
								Client ID
							</DetailLabel>
							<DetailValue>{fullTokenData.credentials.clientId}</DetailValue>
						</StatusDetail>

						{fullTokenData.credentials.region && (
							<StatusDetail>
								<DetailLabel>
									<FiGlobe style={{ fontSize: '10px', marginRight: '2px' }} />
									Region
								</DetailLabel>
								<DetailValue>{fullTokenData.credentials.region.toUpperCase()}</DetailValue>
							</StatusDetail>
						)}
					</>
				)}
			</StatusDetails>

			<ConfigInfo>
				<FiKey style={{ fontSize: '12px' }} />
				<span>
					Silent Retrieval: {config.workerToken.silentApiRetrieval ? 'Enabled' : 'Disabled'} | Show
					Token: {config.workerToken.showTokenAtEnd ? 'Enabled' : 'Disabled'}
				</span>
			</ConfigInfo>
		</StatusContainer>
	);
};

export default WorkerTokenStatusDisplayV8;
