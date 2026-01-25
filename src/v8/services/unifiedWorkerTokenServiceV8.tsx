/**
 * @file unifiedWorkerTokenServiceV8.tsx
 * @module v8/services
 * @description Unified Worker Token Service - combines button, status display, and settings
 * @version 8.0.0
 * @since 2025-01-25
 * 
 * This service provides:
 * - Get Worker Token button functionality
 * - Real-time token status display
 * - Settings management (Silent API retrieval, Show token at end)
 * - Automatic updates and synchronization
 * - Single source of truth for all worker token UI components
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
	FiShield, 
	FiRefreshCw, 
	FiSettings,
	FiCheckCircle,
	FiXCircle,
	FiClock,
	FiKey,
	FiActivity,
	FiZap,
	FiLoader
} from 'react-icons/fi';
import styled, { css, keyframes } from 'styled-components';
import { WorkerTokenStatusServiceV8, type TokenStatusInfo, type WorkerTokenSettings } from './workerTokenStatusServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

// Animation keyframes
const pulse = keyframes`
	0%, 100% { transform: scale(1); opacity: 1; }
	50% { transform: scale(1.05); opacity: 0.8; }
`;

const spin = keyframes`
	from { transform: rotate(0deg); }
	to { transform: rotate(360deg); }
`;

// Styled components
const UnifiedWorkerTokenContainer = styled.div`
	background: #ffffff;
	border: 1px solid #e2e8f0;
	border-radius: 12px;
	padding: 1.5rem;
	box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
	transition: all 0.3s ease;

	&:hover {
		box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
	}
`;

const StatusHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 1rem;
`;

const StatusTitle = styled.h3`
	margin: 0;
	color: #1e293b;
	font-size: 1.125rem;
	font-weight: 600;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const StatusBadge = styled.span<{ $status: TokenStatusInfo['status'] }>`
	padding: 0.25rem 0.75rem;
	border-radius: 9999px;
	font-size: 0.75rem;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	
	${({ $status }) => $status === 'valid' && css`
		background: #10b981;
		color: white;
	`}
	
	${({ $status }) => $status === 'expiring-soon' && css`
		background: #f59e0b;
		color: white;
	`}
	
	${({ $status }) => $status === 'expired' && css`
		background: #ef4444;
		color: white;
	`}
	
	${({ $status }) => $status === 'missing' && css`
		background: #6b7280;
		color: white;
	`}
`;

const StatusMessage = styled.p`
	margin: 0.5rem 0;
	color: #475569;
	font-size: 0.875rem;
	line-height: 1.4;
`;

const TokenInfo = styled.div`
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 8px;
	padding: 1rem;
	margin: 1rem 0;
`;

const TokenInfoRow = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 0.5rem 0;
	border-bottom: 1px solid #e2e8f0;

	&:last-child {
		border-bottom: none;
	}
`;

const TokenInfoLabel = styled.span`
	font-size: 0.875rem;
	color: #64748b;
	font-weight: 500;
`;

const TokenInfoValue = styled.span`
	font-size: 0.875rem;
	color: #1e293b;
	font-weight: 600;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'success' }>`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1.5rem;
	border: none;
	border-radius: 6px;
	font-size: 0.875rem;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s ease;
	
	${({ $variant = 'primary' }) => {
		switch ($variant) {
			case 'primary':
				return css`
					background: #3b82f6;
					color: white;
					
					&:hover:not(:disabled) {
						background: #2563eb;
						transform: translateY(-1px);
						box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
					}
					
					&:active:not(:disabled) {
						background: #1d4ed8;
						transform: translateY(0);
					}
					
					&:disabled {
						background: #9ca3af;
						color: #ffffff;
						cursor: not-allowed;
						opacity: 0.6;
					}
				`;
			case 'success':
				return css`
					background: #10b981;
					color: white;
					
					&:hover:not(:disabled) {
						background: #059669;
						transform: translateY(-1px);
						box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
					}
					
					&:active:not(:disabled) {
						background: #047857;
						transform: translateY(0);
					}
					
					&:disabled {
						background: #9ca3af;
						color: #ffffff;
						cursor: not-allowed;
						opacity: 0.6;
					}
				`;
			case 'secondary':
			default:
				return css`
					background: #ffffff;
					color: #000000;
					border: 1px solid #d1d5db;
					
					&:hover:not(:disabled) {
						background: #f9fafb;
						border-color: #9ca3af;
					}
					
					&:active:not(:disabled) {
						transform: translateY(1px);
					}
					
					&:disabled {
						background: #f3f4f6;
						color: #9ca3af;
						cursor: not-allowed;
					}
				`;
		}
	}}
`;

const RefreshButton = styled.button`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 2rem;
	height: 2rem;
	border: 1px solid #d1d5db;
	border-radius: 6px;
	background: #ffffff;
	color: #374151;
	cursor: pointer;
	transition: all 0.2s ease;
	font-size: 0.875rem;
	
	&:hover:not(:disabled) {
		background: #f9fafb;
		border-color: #9ca3af;
		color: #3b82f6;
	}
	
	&:active:not(:disabled) {
		transform: translateY(1px);
	}
	
	&:disabled {
		background: #f3f4f6;
		color: #9ca3af;
		cursor: not-allowed;
		opacity: 0.6;
	}
	
	&.spinning {
		animation: ${spin} 1s linear infinite;
	}
`;

const SettingsSection = styled.div`
	margin-top: 1rem;
	padding-top: 1rem;
	border-top: 1px solid #e2e8f0;
`;

const SettingsTitle = styled.h4`
	margin: 0 0 0.75rem 0;
	color: #1e293b;
	font-size: 0.875rem;
	font-weight: 600;
`;

const SettingsGrid = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
`;

const SettingRow = styled.label`
	display: flex;
	align-items: flex-start;
	gap: 0.5rem;
	cursor: pointer;
	padding: 0.5rem;
	border-radius: 6px;
	transition: background-color 0.2s ease;
	
	&:hover {
		background: #f8fafc;
	}
`;

const SettingCheckbox = styled.input`
	margin-top: 0.125rem;
	flex-shrink: 0;
`;

const SettingContent = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
`;

const SettingLabel = styled.span`
	font-size: 0.875rem;
	color: #374151;
	font-weight: 500;
`;

const SettingDescription = styled.span`
	font-size: 0.75rem;
	color: #64748b;
	line-height: 1.3;
`;

// Props interface
export interface UnifiedWorkerTokenServiceV8Props {
	mode?: 'compact' | 'detailed' | 'minimal';
	showRefresh?: boolean;
	className?: string;
	onTokenUpdate?: (status: TokenStatusInfo) => void;
	onSettingsChange?: (settings: WorkerTokenSettings) => void;
}

// Main component
export const UnifiedWorkerTokenServiceV8: React.FC<UnifiedWorkerTokenServiceV8Props> = ({
	mode = 'detailed',
	showRefresh = true,
	className,
	onTokenUpdate,
	onSettingsChange,
}) => {
	// State
	const [tokenStatus, setTokenStatus] = useState<TokenStatusInfo | null>(null);
	const [settings, setSettings] = useState<WorkerTokenSettings | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const intervalRef = useRef<NodeJS.Timeout | null>(null);

	// Load initial data
	const loadData = useCallback(async () => {
		try {
			const [status, settingsData] = await Promise.all([
				WorkerTokenStatusServiceV8.checkWorkerTokenStatus(),
				WorkerTokenStatusServiceV8.loadWorkerTokenSettings(),
			]);
			
			setTokenStatus(status);
			setSettings(settingsData);
			onTokenUpdate?.(status);
		} catch (error) {
			console.error('[UNIFIED-WORKER-TOKEN-SERVICE] Error loading data:', error);
		}
	}, [onTokenUpdate]);

	// Refresh token status
	const refreshStatus = useCallback(async () => {
		setIsRefreshing(true);
		try {
			const status = await WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
			setTokenStatus(status);
			onTokenUpdate?.(status);
		} catch (error) {
			console.error('[UNIFIED-WORKER-TOKEN-SERVICE] Error refreshing status:', error);
		} finally {
			setIsRefreshing(false);
		}
	}, [onTokenUpdate]);

	// Handle get worker token
	const handleGetWorkerToken = useCallback(async () => {
		setIsLoading(true);
		try {
			const { handleShowWorkerTokenModal } = await import('@/v8/utils/workerTokenModalHelperV8');
			
			await handleShowWorkerTokenModal(
				() => {}, // setShowWorkerTokenModal (not needed in unified service)
				setTokenStatus,
				settings?.silentApiRetrieval || false,
				settings?.showTokenAtEnd || false,
				true // Always show modal when user explicitly clicks
			);
			
			// Refresh status after modal closes
			await refreshStatus();
		} catch (error) {
			console.error('[UNIFIED-WORKER-TOKEN-SERVICE] Error getting worker token:', error);
			toastV8.error('Failed to get worker token');
		} finally {
			setIsLoading(false);
		}
	}, [settings, refreshStatus]);

	// Handle settings change
	const handleSettingsChange = useCallback(async (newSettings: Partial<WorkerTokenSettings>) => {
		if (!settings) return;
		
		const updatedSettings = { ...settings, ...newSettings };
		setSettings(updatedSettings);
		
		try {
			WorkerTokenStatusServiceV8.saveWorkerTokenSettings(updatedSettings);
			onSettingsChange?.(updatedSettings);
			
			// If enabling silent retrieval and token is missing/expired, attempt silent retrieval
			if (newSettings.silentApiRetrieval && !settings.silentApiRetrieval) {
				if (!tokenStatus?.isValid) {
					console.log('[UNIFIED-WORKER-TOKEN-SERVICE] Silent API retrieval enabled, attempting to fetch token...');
					const { handleShowWorkerTokenModal } = await import('@/v8/utils/workerTokenModalHelperV8');
					await handleShowWorkerTokenModal(
						() => {},
						setTokenStatus,
						true, // Use new value
						updatedSettings.showTokenAtEnd,
						false // Not forced - respect silent setting
					);
					await refreshStatus();
				}
			}
		} catch (error) {
			console.error('[UNIFIED-WORKER-TOKEN-SERVICE] Error updating settings:', error);
		}
	}, [settings, tokenStatus, onSettingsChange, refreshStatus]);

	// Setup effects
	useEffect(() => {
		loadData();

		// Set up periodic updates
		intervalRef.current = setInterval(() => {
			refreshStatus();
		}, 30000); // Update every 30 seconds

		// Listen for worker token updates
		const handleTokenUpdate = () => {
			refreshStatus();
		};

		window.addEventListener('workerTokenUpdated', handleTokenUpdate);

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
			window.removeEventListener('workerTokenUpdated', handleTokenUpdate);
		};
	}, [loadData, refreshStatus]);

	// Get status icon
	const getStatusIcon = (status: TokenStatusInfo['status']) => {
		switch (status) {
			case 'valid':
				return <FiCheckCircle />;
			case 'expiring-soon':
				return <FiClock />;
			case 'expired':
				return <FiXCircle />;
			case 'missing':
				return <FiShield />;
		}
	};

	// Format time remaining
	const formatTimeRemaining = (expiresAt?: number, minutesRemaining?: number): string => {
		if (!expiresAt && !minutesRemaining) return 'Unknown';
		
		if (minutesRemaining !== undefined) {
			if (minutesRemaining <= 0) return 'EXPIRED';
			if (minutesRemaining < 5) return `${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''}`;
			if (minutesRemaining < 60) return `${minutesRemaining} minutes`;
			const hours = Math.floor(minutesRemaining / 60);
			const mins = minutesRemaining % 60;
			return `${hours} hour${hours !== 1 ? 's' : ''} ${mins} min`;
		}
		
		if (expiresAt) {
			const now = Date.now();
			const remaining = expiresAt - now;
			if (remaining <= 0) return 'EXPIRED';
			const minutes = Math.floor(remaining / 60000);
			return formatTimeRemaining(undefined, minutes);
		}
		
		return 'Unknown';
	};

	// Render based on mode
	if (mode === 'minimal') {
		return (
			<UnifiedWorkerTokenContainer className={className}>
				{tokenStatus && (
					<div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
						<StatusTitle>
							{getStatusIcon(tokenStatus.status)}
							Worker Token
						</StatusTitle>
						<StatusBadge $status={tokenStatus.status}>
							{tokenStatus.status}
						</StatusBadge>
						{showRefresh && (
							<RefreshButton 
								onClick={refreshStatus} 
								disabled={isRefreshing}
								className={isRefreshing ? 'spinning' : ''}
							>
								<FiRefreshCw />
							</RefreshButton>
						)}
					</div>
				)}
			</UnifiedWorkerTokenContainer>
		);
	}

	if (mode === 'compact') {
		return (
			<UnifiedWorkerTokenContainer className={className}>
				{tokenStatus && (
					<>
						<StatusHeader>
							<StatusTitle>
								{getStatusIcon(tokenStatus.status)}
								Worker Token
							</StatusTitle>
							<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
								<StatusBadge $status={tokenStatus.status}>
									{tokenStatus.status}
								</StatusBadge>
								{showRefresh && (
									<RefreshButton 
										onClick={refreshStatus} 
										disabled={isRefreshing}
										className={isRefreshing ? 'spinning' : ''}
									>
										<FiRefreshCw />
									</RefreshButton>
								)}
							</div>
						</StatusHeader>
						<StatusMessage>{tokenStatus.message}</StatusMessage>
						<ActionButton 
							onClick={handleGetWorkerToken} 
							disabled={isLoading}
							$variant={tokenStatus.isValid ? 'success' : 'primary'}
						>
							{isLoading ? <FiLoader className="spinning" /> : <FiShield />}
							{tokenStatus.isValid ? 'Manage Worker Token' : 'Get Worker Token'}
						</ActionButton>
					</>
				)}
			</UnifiedWorkerTokenContainer>
		);
	}

	// Detailed mode (default)
	return (
		<UnifiedWorkerTokenContainer className={className}>
			{tokenStatus && settings && (
				<>
					<StatusHeader>
						<StatusTitle>
							{getStatusIcon(tokenStatus.status)}
							Worker Token Status
						</StatusTitle>
						{showRefresh && (
							<RefreshButton 
								onClick={refreshStatus} 
								disabled={isRefreshing}
								className={isRefreshing ? 'spinning' : ''}
							>
								<FiRefreshCw />
							</RefreshButton>
						)}
					</StatusHeader>

					<StatusBadge $status={tokenStatus.status}>
						{tokenStatus.status}
					</StatusBadge>

					<StatusMessage>{tokenStatus.message}</StatusMessage>

					{tokenStatus.isValid && (
						<TokenInfo>
							<TokenInfoRow>
								<TokenInfoLabel>Status</TokenInfoLabel>
								<TokenInfoValue>{tokenStatus.status}</TokenInfoValue>
							</TokenInfoRow>
							{tokenStatus.expiresAt && (
								<TokenInfoRow>
									<TokenInfoLabel>Expires At</TokenInfoLabel>
									<TokenInfoValue>
										{new Date(tokenStatus.expiresAt).toLocaleString()}
									</TokenInfoValue>
								</TokenInfoRow>
							)}
							{tokenStatus.minutesRemaining !== undefined && (
								<TokenInfoRow>
									<TokenInfoLabel>Time Remaining</TokenInfoLabel>
									<TokenInfoValue>
										{formatTimeRemaining(tokenStatus.expiresAt, tokenStatus.minutesRemaining)}
									</TokenInfoValue>
								</TokenInfoRow>
							)}
							{tokenStatus.token && (
								<TokenInfoRow>
									<TokenInfoLabel>Token</TokenInfoLabel>
									<TokenInfoValue>
										{tokenStatus.token.substring(0, 20)}...
									</TokenInfoValue>
								</TokenInfoRow>
							)}
						</TokenInfo>
					)}

					<ActionButton 
						onClick={handleGetWorkerToken} 
						disabled={isLoading}
						$variant={tokenStatus.isValid ? 'success' : 'primary'}
					>
						{isLoading ? <FiLoader className="spinning" /> : <FiShield />}
						{tokenStatus.isValid ? 'Manage Worker Token' : 'Get Worker Token'}
					</ActionButton>

					<SettingsSection>
						<SettingsTitle>Worker Token Settings</SettingsTitle>
						<SettingsGrid>
							<SettingRow>
								<SettingCheckbox
									type="checkbox"
									checked={settings.silentApiRetrieval}
									onChange={(e) => handleSettingsChange({ silentApiRetrieval: e.target.checked })}
								/>
								<SettingContent>
									<SettingLabel>Silent API Retrieval</SettingLabel>
									<SettingDescription>
										Automatically fetch worker token in the background without showing modals
									</SettingDescription>
								</SettingContent>
							</SettingRow>

							<SettingRow>
								<SettingCheckbox
									type="checkbox"
									checked={settings.showTokenAtEnd}
									onChange={(e) => handleSettingsChange({ showTokenAtEnd: e.target.checked })}
								/>
								<SettingContent>
									<SettingLabel>Show Token at End</SettingLabel>
									<SettingDescription>
										Display the worker token after successful generation for easy copying
									</SettingDescription>
								</SettingContent>
							</SettingRow>
						</SettingsGrid>
					</SettingsSection>
				</>
			)}
		</UnifiedWorkerTokenContainer>
	);
};

export default UnifiedWorkerTokenServiceV8;
