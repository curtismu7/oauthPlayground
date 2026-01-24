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

import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { FiKey, FiShield, FiClock, FiCheckCircle, FiAlertCircle, FiRefreshCw, FiZap, FiActivity } from 'react-icons/fi';
import { WorkerTokenStatusServiceV8, type TokenStatusInfo } from '@/v8/services/workerTokenStatusServiceV8';
import { MFAConfigurationServiceV8 } from '@/v8/services/mfaConfigurationServiceV8';

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
		${props => 
			props.$variant === 'valid' ? 'rgba(16, 185, 129, 0.1)' :
			props.$variant === 'warning' ? 'rgba(245, 158, 11, 0.1)' :
			'rgba(239, 68, 68, 0.1)'
		},
		${props => 
			props.$variant === 'valid' ? 'rgba(34, 197, 94, 0.05)' :
			props.$variant === 'warning' ? 'rgba(251, 191, 36, 0.05)' :
			'rgba(248, 113, 113, 0.05)'
		});
	border: 2px solid ${props => 
		props.$variant === 'valid' ? '#10b981' :
		props.$variant === 'warning' ? '#f59e0b' :
		'#ef4444'
	};
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
	animation: ${slideIn} 0.5s ease-out;

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

	${props => props.$variant === 'valid' && `
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
		${props => 
			props.$variant === 'valid' ? '#10b981' :
			props.$variant === 'warning' ? '#f59e0b' :
			'#ef4444'
		},
		${props => 
			props.$variant === 'valid' ? '#059669' :
			props.$variant === 'warning' ? '#d97706' :
			'#dc2626'
		});
	box-shadow: 
		0 4px 12px rgba(0, 0, 0, 0.15),
		inset 0 1px 0 rgba(255, 255, 255, 0.2);
	color: white;
	font-size: 18px;
	animation: ${pulse} 2s ease-in-out infinite;
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
	font-weight: 700;
	background: linear-gradient(135deg, 
		${props => 
			props.$variant === 'valid' ? '#10b981' :
			props.$variant === 'warning' ? '#f59e0b' :
			'#ef4444'
		},
		${props => 
			props.$variant === 'valid' ? '#059669' :
			props.$variant === 'warning' ? '#d97706' :
			'#dc2626'
		});
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
	background-clip: text;
	text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
`;

const StatusDetails = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
	gap: 12px;
	margin-top: 12px;
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
	font-weight: 600;
	color: ${props => props.$highlight ? '#10b981' : '#e5e7eb'};
	text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
	${props => props.$highlight && `
		background: linear-gradient(135deg, #10b981, #059669);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	`}
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

const RefreshButton = styled.button`
	background: rgba(255, 255, 255, 0.1);
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
		background: rgba(255, 255, 255, 0.2);
		transform: scale(1.05);
	}

	&:active {
		transform: scale(0.95);
	}
`;

export interface WorkerTokenStatusDisplayV8Props {
	/** Display mode */
	mode?: 'compact' | 'detailed' | 'minimal';
	/** Show refresh button */
	showRefresh?: boolean;
	/** Custom className */
	className?: string;
	/** Auto-refresh interval in seconds */
	refreshInterval?: number;
}

export const WorkerTokenStatusDisplayV8: React.FC<WorkerTokenStatusDisplayV8Props> = ({
	mode = 'detailed',
	showRefresh = true,
	className = '',
	refreshInterval = 5,
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

	const updateTokenStatus = async () => {
		try {
			const status = await WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
			setTokenStatus(status);
		} catch (error) {
			console.error('[WorkerTokenStatusDisplayV8] Failed to check token status:', error);
		}
	};

	const handleRefresh = async () => {
		setIsRefreshing(true);
		await updateTokenStatus();
		setConfig(MFAConfigurationServiceV8.loadConfiguration());
		setTimeout(() => setIsRefreshing(false), 500);
	};

	useEffect(() => {
		updateTokenStatus();

		// Listen for token updates
		const handleTokenUpdate = () => {
			updateTokenStatus();
		};

		const handleConfigUpdate = () => {
			setConfig(MFAConfigurationServiceV8.loadConfiguration());
		};

		window.addEventListener('workerTokenUpdated', handleTokenUpdate);
		window.addEventListener('mfaConfigurationUpdated', handleConfigUpdate);

		const interval = setInterval(updateTokenStatus, refreshInterval * 1000);

		return () => {
			window.removeEventListener('workerTokenUpdated', handleTokenUpdate);
			window.removeEventListener('mfaConfigurationUpdated', handleConfigUpdate);
			clearInterval(interval);
		};
	}, [refreshInterval]);

	const getVariant = (): 'valid' | 'invalid' | 'warning' => {
		if (tokenStatus.isValid) return 'valid';
		if (tokenStatus.status === 'expired') return 'warning';
		return 'invalid';
	};

	const formatTimeRemaining = () => {
		if (!tokenStatus.expiresAt) return 'N/A';
		
		const now = Date.now();
		const expiresAt = tokenStatus.expiresAt;
		const remaining = expiresAt - now;
		
		if (remaining <= 0) return 'Expired';
		
		const hours = Math.floor(remaining / (1000 * 60 * 60));
		const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
		
		if (hours > 0) {
			return `${hours}h ${minutes}m`;
		}
		return `${minutes}m`;
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
		if (tokenStatus.isValid) return 'ACTIVE';
		if (tokenStatus.status === 'expired') return 'EXPIRED';
		if (tokenStatus.status === 'missing') return 'MISSING';
		return tokenStatus.status.toUpperCase();
	};

	if (mode === 'minimal') {
		return (
			<StatusContainer $variant={getVariant()} className={className}>
				<StatusHeader>
					<StatusTitle>
						<StatusIcon $variant={getVariant()}>
							{getStatusIcon()}
						</StatusIcon>
						<StatusText>
							<StatusLabel>Worker Token</StatusLabel>
							<StatusValue $variant={getVariant()}>
								{getStatusText()}
							</StatusValue>
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

	if (mode === 'compact') {
		return (
			<StatusContainer $variant={getVariant()} className={className}>
				<StatusHeader>
					<StatusTitle>
						<StatusIcon $variant={getVariant()}>
							{getStatusIcon()}
						</StatusIcon>
						<StatusText>
							<StatusLabel>Worker Token Status</StatusLabel>
							<StatusValue $variant={getVariant()}>
								{getStatusText()}
							</StatusValue>
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
						<DetailValue $highlight={tokenStatus.isValid}>
							{formatTimeRemaining()}
						</DetailValue>
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
		<StatusContainer $variant={getVariant()} className={className}>
			<StatusHeader>
				<StatusTitle>
					<StatusIcon $variant={getVariant()}>
						{getStatusIcon()}
					</StatusIcon>
					<StatusText>
						<StatusLabel>Worker Token Status</StatusLabel>
						<StatusValue $variant={getVariant()}>
							{getStatusText()}
						</StatusValue>
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
				<StatusDetail>
					<DetailLabel>
						<FiClock style={{ fontSize: '10px', marginRight: '2px' }} />
						Time Remaining
					</DetailLabel>
					<DetailValue $highlight={tokenStatus.isValid}>
						{formatTimeRemaining()}
					</DetailValue>
				</StatusDetail>
				<StatusDetail>
					<DetailLabel>
						<FiActivity style={{ fontSize: '10px', marginRight: '2px' }} />
						Status
					</DetailLabel>
					<DetailValue>{tokenStatus.message}</DetailValue>
				</StatusDetail>
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
			</StatusDetails>

			<ConfigInfo>
				<FiKey style={{ fontSize: '12px' }} />
				<span>
					Silent Retrieval: {config.workerToken.silentApiRetrieval ? 'Enabled' : 'Disabled'} | 
					Show Token: {config.workerToken.showTokenAtEnd ? 'Enabled' : 'Disabled'}
				</span>
			</ConfigInfo>
		</StatusContainer>
	);
};

export default WorkerTokenStatusDisplayV8;
