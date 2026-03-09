// src/components/CredentialStatusPanel.tsx

import { FiRefreshCw } from '@icons';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { modernMessaging } from '@/services/v9/V9ModernMessagingService';
import { useAuth } from '../contexts/NewAuthContext';
import { showGlobalError, showGlobalSuccess } from '../hooks/useNotifications';
import { credentialManager, type PermanentCredentials } from '../utils/credentialManager';
import { logger } from '../utils/logger';
import ServerStatusModal from './ServerStatusModal';

const StatusPanel = styled.div`
  background: linear-gradient(135deg, V9_COLORS.TEXT.WHITE 0%, V9_COLORS.BG.GRAY_LIGHT 100%);
  border: 2px solid V9_COLORS.TEXT.GRAY_LIGHTER;
  border-radius: 1rem;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 6px;
    background: linear-gradient(90deg, V9_COLORS.PRIMARY.GREEN, V9_COLORS.PRIMARY.GREEN_LIGHT, #6ee7b7);
  }
`;

const StatusHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  
  h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: V9_COLORS.TEXT.GRAY_DARK;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const RefreshButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: linear-gradient(135deg, #f3f4f6 0%, V9_COLORS.TEXT.GRAY_LIGHTER 100%);
  color: V9_COLORS.TEXT.GRAY_DARK;
  border: 2px solid V9_COLORS.TEXT.GRAY_LIGHTER;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  
  &:hover {
    background: linear-gradient(135deg, V9_COLORS.TEXT.GRAY_LIGHTER 0%, V9_COLORS.TEXT.GRAY_LIGHTER 100%);
    border-color: V9_COLORS.TEXT.GRAY_LIGHT;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  
  &:disabled {
    background: #f9fafb;
    color: V9_COLORS.TEXT.GRAY_LIGHT;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const StatusButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: linear-gradient(135deg, #dbeafe 0%, V9_COLORS.TEXT.GRAY_LIGHTER 100%);
  color: V9_COLORS.PRIMARY.BLUE_DARK;
  border: 2px solid #93c5fd;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  
  &:hover {
    background: linear-gradient(135deg, V9_COLORS.TEXT.GRAY_LIGHTER 0%, #93c5fd 100%);
    border-color: V9_COLORS.PRIMARY.BLUE_LIGHT;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
`;

const StatusIndicators = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
`;

const StatusIndicator = styled.div<{ $type: 'tokens' | 'environment' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  background: ${(props) => {
		switch (props.$type) {
			case 'tokens':
				return 'linear-gradient(135deg, V9_COLORS.BG.ERROR 0%, V9_COLORS.BG.ERROR 100%)';
			case 'environment':
				return 'linear-gradient(135deg, #f0fdf4 0%, V9_COLORS.BG.SUCCESS 100%)';
		}
	}};
  color: ${(props) => {
		switch (props.$type) {
			case 'tokens':
				return '#dc2626';
			case 'environment':
				return '#10b981';
		}
	}};
  border: 2px solid ${(props) => {
		switch (props.$type) {
			case 'tokens':
				return '#ef4444';
			case 'environment':
				return '#10b981';
		}
	}};
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
`;

const FlowStatusGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
`;

const FlowStatusCard = styled.div<{
	$status: 'configured' | 'partial' | 'missing';
}>`
  background: ${(props) => {
		switch (props.$status) {
			case 'configured':
				return 'linear-gradient(135deg, #f0fdf4 0%, V9_COLORS.BG.SUCCESS 100%)';
			case 'partial':
				return 'linear-gradient(135deg, V9_COLORS.BG.WARNING 0%, #fed7aa 100%)';
			case 'missing':
				return 'linear-gradient(135deg, V9_COLORS.BG.ERROR 0%, V9_COLORS.BG.ERROR_BORDER 100%)';
		}
	}};
  border: 2px solid ${(props) => {
		switch (props.$status) {
			case 'configured':
				return '#10b981';
			case 'partial':
				return '#fed7aa';
			case 'missing':
				return '#ef4444';
		}
	}};
  border-radius: 0.75rem;
  padding: 1.25rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${(props) => {
			switch (props.$status) {
				case 'configured':
					return 'linear-gradient(90deg, V9_COLORS.PRIMARY.GREEN, V9_COLORS.PRIMARY.GREEN_LIGHT)';
				case 'partial':
					return 'linear-gradient(90deg, V9_COLORS.PRIMARY.YELLOW, V9_COLORS.PRIMARY.YELLOW_LIGHT)';
				case 'missing':
					return 'linear-gradient(90deg, V9_COLORS.PRIMARY.RED, V9_COLORS.PRIMARY.RED_LIGHT)';
			}
		}};
  }
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    border-color: ${(props) => {
			switch (props.$status) {
				case 'configured':
					return '#86efac';
				case 'partial':
					return '#fcd34d';
				case 'missing':
					return '#fca5a5';
			}
		}};
  }
`;

const FlowName = styled.h4`
  margin: 0 0 0.75rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: V9_COLORS.TEXT.GRAY_DARK;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StatusBadge = styled.div<{
	$status: 'configured' | 'partial' | 'missing';
}>`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.875rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  background: ${(props) => {
		switch (props.$status) {
			case 'configured':
				return 'linear-gradient(135deg, V9_COLORS.BG.SUCCESS 0%, V9_COLORS.BG.SUCCESS_BORDER 100%)';
			case 'partial':
				return 'linear-gradient(135deg, V9_COLORS.BG.WARNING 0%, #fed7aa 100%)';
			case 'missing':
				return 'linear-gradient(135deg, V9_COLORS.BG.ERROR 0%, V9_COLORS.BG.ERROR_BORDER 100%)';
		}
	}};
  color: ${(props) => {
		switch (props.$status) {
			case 'configured':
				return '#10b981';
			case 'partial':
				return '#d97706';
			case 'missing':
				return '#dc2626';
		}
	}};
  border: 1px solid ${(props) => {
		switch (props.$status) {
			case 'configured':
				return '#86efac';
			case 'partial':
				return '#fcd34d';
			case 'missing':
				return '#fca5a5';
		}
	}};
  transition: all 0.2s ease;
  
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  }
`;

const FlowDetails = styled.div`
  font-size: 0.875rem;
  color: V9_COLORS.TEXT.GRAY_MEDIUM;
  margin-top: 0.75rem;
  
  .detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.25rem;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  .field-name {
    font-weight: 500;
  }
  
  .field-status {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 2rem;
  color: V9_COLORS.TEXT.GRAY_MEDIUM;
  
  .icon {
    font-size: 2rem;
    margin-bottom: 0.5rem;
  }
`;

interface FlowCredentialStatus {
	flowName: string;
	flowType: 'config' | 'authz' | 'implicit';
	credentials: PermanentCredentials;
	status: 'configured' | 'partial' | 'missing';
	lastUpdated?: number;
}

const CredentialStatusPanel: React.FC = () => {
	const { tokens, isAuthenticated } = useAuth();
	const [flowStatuses, setFlowStatuses] = useState<FlowCredentialStatus[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [_lastRefresh, setLastRefresh] = useState<Date>(new Date());
	const [showServerStatusModal, setShowServerStatusModal] = useState(false);

	const checkCredentials = useCallback(
		(credentials: PermanentCredentials): 'configured' | 'partial' | 'missing' => {
			const hasRequired =
				credentials.environmentId && credentials.clientId && credentials.redirectUri;
			const hasOptional =
				credentials.clientSecret || credentials.authEndpoint || credentials.tokenEndpoint;

			if (hasRequired && hasOptional) return 'configured';
			if (hasRequired) return 'partial';
			return 'missing';
		},
		[]
	);

	const refreshStatuses = useCallback(async () => {
		logger.info(' [CredentialStatusPanel] Refreshing statuses - button clicked', "Logger info");
		setIsLoading(true);
		try {
			logger.info(' [CredentialStatusPanel] Loading credentials...', "Logger info");
			const configCredentials = credentialManager.loadConfigCredentials();
			const authzFlowCredentials = credentialManager.loadAuthzFlowCredentials();
			const implicitFlowCredentials = credentialManager.loadImplicitFlowCredentials();

			logger.info(' [CredentialStatusPanel] Loaded credentials:', {
				config: configCredentials,
				authz: authzFlowCredentials,
				implicit: implicitFlowCredentials,
			});

			logger.debug('CredentialStatusPanel', 'Loaded credentials', {
				config: configCredentials,
				authz: authzFlowCredentials,
				implicit: implicitFlowCredentials,
			});

			const statuses: FlowCredentialStatus[] = [
				{
					flowName: 'Dashboard Configuration',
					flowType: 'config',
					credentials: configCredentials || {},
					status: checkCredentials(configCredentials || {}),
					lastUpdated: configCredentials?.lastUpdated,
				},
				{
					flowName: 'Authorization Code Flow',
					flowType: 'authz',
					credentials: authzFlowCredentials || {},
					status: checkCredentials(authzFlowCredentials || {}),
					lastUpdated: authzFlowCredentials?.lastUpdated,
				},
				{
					flowName: 'Implicit Flow',
					flowType: 'implicit',
					credentials: implicitFlowCredentials || {},
					status: checkCredentials(implicitFlowCredentials || {}),
					lastUpdated: implicitFlowCredentials?.lastUpdated,
				},
			];

			logger.info(' [CredentialStatusPanel] Setting new statuses:', statuses);
			setFlowStatuses(statuses);
			setLastRefresh(new Date());

			logger.info(' [CredentialStatusPanel] Statuses updated successfully', "Logger info");
			logger.debug('CredentialStatusPanel', 'Statuses updated', statuses);
			showGlobalSuccess(
				' System Status Refreshed',
				'All credential statuses have been updated successfully'
			);
		} catch (error) {
			logger.error('CredentialStatusPanel', 'Error refreshing statuses', error);
			showGlobalError(' Refresh Failed', 'Failed to refresh system status. Please try again.');
		} finally {
			setIsLoading(false);
		}
	}, [checkCredentials]);

	// Load initial statuses
	useEffect(() => {
		refreshStatuses();
	}, [refreshStatuses]);

	const getStatusIcon = (status: 'configured' | 'partial' | 'missing') => {
		switch (status) {
			case 'configured':
				return <span style={{ fontSize: 16, color: '#10b981' }}>✅</span>;
			case 'partial':
				return <span style={{ fontSize: 16, color: '#f59e0b' }}>⚠️</span>;
			case 'missing':
				return <span style={{ fontSize: 16, color: '#ef4444' }}>❌</span>;
		}
	};

	const getStatusText = (status: 'configured' | 'partial' | 'missing') => {
		switch (status) {
			case 'configured':
				return 'Fully Configured';
			case 'partial':
				return 'Partially Configured';
			case 'missing':
				return 'Not Configured';
		}
	};

	const formatLastUpdated = (timestamp?: number) => {
		if (!timestamp) return 'Never';
		const date = new Date(timestamp);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);

		if (diffMins < 1) return 'Just now';
		if (diffMins < 60) return `${diffMins}m ago`;
		if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
		return date.toLocaleDateString();
	};

	return (
		<StatusPanel>
			<StatusHeader>
				<h3>System Status</h3>
				<ButtonGroup>
					<RefreshButton
						onClick={(e) => {
							logger.info(' [CredentialStatusPanel] Refresh button clicked!', e);
							modernMessaging.showFooterMessage({
								type: 'status',
								message: 'Refreshing system status - loading all credential statuses...',
								duration: 4000,
							});
							refreshStatuses();
						}}
						disabled={isLoading}
					>
						<FiRefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
					</RefreshButton>
					<StatusButton
						onClick={() => {
							setShowServerStatusModal(true);
							modernMessaging.showFooterMessage({
								type: 'status',
								message: 'Server status modal opened - checking frontend and backend servers',
								duration: 4000,
							});
						}}
					>
						<span style={{ fontSize: '16px' }}>🖥️</span>
						Server Status
					</StatusButton>
				</ButtonGroup>
			</StatusHeader>

			<StatusIndicators>
				<StatusIndicator $type="tokens">
					<span style={{ fontSize: '16px' }}>🕐</span>
					{tokens && isAuthenticated ? 'Active Tokens' : 'No Active Tokens'}
				</StatusIndicator>
				<StatusIndicator $type="environment">
					<span style={{ fontSize: '16px' }}>🛡️</span>
					Environment Configured
				</StatusIndicator>
			</StatusIndicators>

			{flowStatuses.length === 0 ? (
				<EmptyState>
					<div className="icon"></div>
					<p>No credential information available</p>
				</EmptyState>
			) : (
				<FlowStatusGrid>
					{flowStatuses.map((flow) => (
						<FlowStatusCard key={flow.flowType} $status={flow.status}>
							<FlowName>
								{getStatusIcon(flow.status)}
								{flow.flowName}
							</FlowName>

							<StatusBadge $status={flow.status}>
								{getStatusIcon(flow.status)}
								{getStatusText(flow.status)}
							</StatusBadge>

							<FlowDetails>
								<div className="detail-row">
									<span className="field-name">Environment ID:</span>
									<span className="field-status">
										{flow.credentials.environmentId ? (
											<>
												<span style={{ fontSize: '12px' }}>✅</span>
												{flow.credentials.environmentId.substring(0, 8)}...
											</>
										) : (
											<>
												<span style={{ fontSize: '12px' }}>❌</span>
												Missing
											</>
										)}
									</span>
								</div>

								<div className="detail-row">
									<span className="field-name">Client ID:</span>
									<span className="field-status">
										{flow.credentials.clientId ? (
											<>
												<span style={{ fontSize: '12px' }}>✅</span>
												{flow.credentials.clientId.substring(0, 8)}...
											</>
										) : (
											<>
												<span style={{ fontSize: '12px' }}>❌</span>
												Missing
											</>
										)}
									</span>
								</div>

								<div className="detail-row">
									<span className="field-name">Redirect URI:</span>
									<span className="field-status">
										{flow.credentials.redirectUri ? (
											<>
												<span style={{ fontSize: '12px' }}>✅</span>
												Configured
											</>
										) : (
											<>
												<span style={{ fontSize: '12px' }}>❌</span>
												Missing
											</>
										)}
									</span>
								</div>

								<div className="detail-row">
									<span className="field-name">Last Updated:</span>
									<span className="field-status">{formatLastUpdated(flow.lastUpdated)}</span>
								</div>
							</FlowDetails>
						</FlowStatusCard>
					))}
				</FlowStatusGrid>
			)}

			{/* Server Status Modal */}
			<ServerStatusModal
				isOpen={showServerStatusModal}
				onClose={() => setShowServerStatusModal(false)}
			/>
		</StatusPanel>
	);
};

export default CredentialStatusPanel;
