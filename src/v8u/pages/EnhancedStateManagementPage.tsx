import React, { useEffect, useMemo, useState } from 'react';
import {
	FiActivity,
	FiAlertTriangle,
	FiBell,
	FiBellOff,
	FiCheckCircle,
	FiClock,
	FiDatabase,
	FiDownload,
	FiKey,
	FiRefreshCw,
	FiRotateCcw,
	FiSettings,
	FiTrash2,
	FiUpload,
	FiWifi,
	FiZap,
} from 'react-icons/fi';
import styled from 'styled-components';
import { logger } from '@/v8u/services/unifiedFlowLoggerServiceV8U';
import { stateUtils, useUnifiedFlowState } from '../services/enhancedStateManagement';
import { TokenMonitoringService } from '../services/tokenMonitoringService';
import { UnifiedOAuthCredentialsServiceV8U } from '../services/unifiedOAuthCredentialsServiceV8U';
import { useStandardSpinner, StandardModalSpinner } from '../../components/ui/StandardSpinner';

const PageContainer = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const PageHeader = styled.div`
  margin-bottom: 2rem;
  text-align: center;
`;

const PageTitle = styled.h1`
  color: #1e293b;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
`;

const PageSubtitle = styled.p`
  color: #64748b;
  font-size: 1rem;
  margin: 0;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
`;

const StatIcon = styled.div<{ $color?: string }>`
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: ${(props) => props.$color || '#64748b'};
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.25rem;
`;

const StatLabel = styled.div`
  font-size: 0.875rem;
  color: #64748b;
`;

const SectionContainer = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
`;

const SectionTitle = styled.h2`
  color: #1e293b;
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
`;

const SectionIcon = styled.div`
  font-size: 1.25rem;
  color: #3b82f6;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-top: 1rem;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  ${(props) => {
		switch (props.$variant) {
			case 'primary':
				return `
          background: #3b82f6;
          border-color: #3b82f6;
          color: white;
          
          &:hover {
            background: #2563eb;
            border-color: #2563eb;
          }
        `;
			case 'danger':
				return `
          background: #ef4444;
          border-color: #ef4444;
          color: white;
          
          &:hover {
            background: #dc2626;
            border-color: #dc2626;
          }
        `;
			default:
				return `
          background: white;
          border-color: #e2e8f0;
          color: #64748b;
          
          &:hover {
            background: #f8fafc;
            border-color: #cbd5e1;
            color: #475569;
          }
        `;
		}
	}}
`;

const StatusIndicator = styled.div<{
	$status: 'online' | 'offline' | 'pending' | 'synced' | 'error';
}>`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  
  ${(props) => {
		switch (props.$status) {
			case 'online':
				return `
          background: #dcfce7;
          color: #166534;
          border-color: #86efac;
        `;
			case 'offline':
				return `
          background: #fee2e2;
          color: #991b1b;
          border-color: #fecaca;
        `;
			case 'pending':
				return `
          background: #fef3c7;
          color: #92400e;
          border-color: #fbbf24;
        `;
			case 'synced':
				return `
          background: #dcfce7;
          color: #166534;
          border-color: #86efac;
        `;
			case 'error':
				return `
          background: #fee2e2;
          color: #991b1b;
          border-color: #fecaca;
        `;
			default:
				return `
          background: #f3f4f6;
          color: #4b5563;
          border-color: #d1d5db;
        `;
		}
	}}
`;

const FeatureList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const FeatureItem = styled.li`
  padding: 0.75rem 0;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  
  &:last-child {
    border-bottom: none;
  }
`;

const FeatureIcon = styled.div<{ $color?: string }>`
  font-size: 1rem;
  color: ${(props) => props.$color || '#3b82f6'};
`;

const FeatureText = styled.div`
  flex: 1;
  font-size: 0.875rem;
  color: #374151;
  line-height: 1.4;
`;

const FeatureStatus = styled.span<{ $enabled: boolean }>`
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  
  ${(props) => {
		return props.$enabled
			? `
        background: #dcfce7;
        color: #166534;
        border-color: #86efac;
      `
			: `
        background: #f3f4f6;
        color: #6b7280;
        border-color: #d1d5db;
      `;
	}}
`;

const _HistoryControls = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 1rem;
`;

const _HistoryButton = styled.button<{ $disabled?: boolean }>`
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: ${(props) => (props.$disabled ? 'not-allowed' : 'pointer')};
  transition: all 0.2s ease;
  border: 1px solid;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  ${(props) => {
		return props.$disabled
			? `
        background: #f3f4f6;
        color: #9ca3af;
        border-color: #d1d5db;
      `
			: `
        background: white;
        color: #374151;
        border-color: #d1d5db;
        
        &:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
          color: #1e293b;
        }
      `;
	}}
`;

const ExportImportControls = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
  padding: 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin: 1rem 0;
`;

const ExportImportButton = styled.button`
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid #3b82f6;
  background: #3b82f6;
  color: white;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    background: #2563eb;
    border-color: #2563eb;
  }
`;

const _ErrorMessage = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 1rem;
  color: #991b1b;
  text-align: center;
  font-size: 0.875rem;
`;

const _SuccessMessage = styled.div`
  background: #f0fdf4;
  border: 1px solid #86efac;
  border-radius: 8px;
  padding: 1rem;
  color: #166534;
  text-align: center;
  font-size: 0.875rem;
`;

export const EnhancedStateManagementPage: React.FC = () => {
	const { state, actions } = useUnifiedFlowState();
	const [message, setMessage] = useState('');
	const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
	const [isExporting, setIsExporting] = useState(false);
	const [isImporting, setIsImporting] = useState(false);

	// Standardized spinner hooks for state management operations
	const exportSpinner = useStandardSpinner(4000); // Export state - 4 seconds
	const importSpinner = useStandardSpinner(3000); // Import state - 3 seconds
	const resetSpinner = useStandardSpinner(2000);  // Reset state - 2 seconds

	// Auto-update real metrics on mount
	useEffect(() => {
		actions.updateRealMetrics();
	}, [actions]);

	// Export state
	const handleExport = async () => {
		logger.debug('handleExport called');
		await exportSpinner.executeWithSpinner(
			async () => {
				const stateData = stateUtils.exportAllState();

				if (!stateData) {
					throw new Error('Failed to export state data');
				}

				const blob = new Blob([JSON.stringify(stateData, null, 2)], {
					type: 'application/json',
				});

				const url = URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = `enhanced-state-management-${new Date().toISOString().split('T')[0]}.json`;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				URL.revokeObjectURL(url);
			},
			{
				onSuccess: () => {
					setMessage('State exported successfully!');
					setMessageType('success');
				},
				onError: (error) => {
					logger.error('Failed to export state:', error);
					setMessage(
						`Failed to export state: ${error instanceof Error ? error.message : 'Unknown error'}`
					);
					setMessageType('error');
				}
			}
		);
	};

	// Import state
	const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		await importSpinner.executeWithSpinner(
			async () => {
				const text = await file.text();
				const importedState = JSON.parse(text);

				if (importedState) {
					stateUtils.importAllState(importedState);
				}
			},
			{
				onSuccess: () => {
					setMessage('State imported successfully');
					setMessageType('success');
				},
				onError: (_error) => {
					setMessage('Failed to import state');
					setMessageType('error');
				},
				onComplete: () => {
					// Clear the file input
					if (event.target) {
						event.target.value = '';
					}
				}
			}
		);
	};

	// Reset all state
	const handleResetAll = () => {
		logger.debug('handleResetAll called');
		stateUtils.resetAllState();
		setMessage('All state has been reset to defaults');
		setMessageType('info');
	};

	// Get real statistics
	const stats = useMemo(
		() => ({
			unifiedFlow: state.unifiedFlow,
			performance: state.performance,
			history: {
				pastCount: 0, // Not tracking history in this version
				futureCount: 0,
			},
			offline: state.offline,
		}),
		[state.unifiedFlow, state.performance, state.offline]
	);

	return (
		<PageContainer>
			{/* Modal Spinners for State Management Operations */}
			<StandardModalSpinner
				show={exportSpinner.isLoading}
				message="Exporting state..."
				theme="blue"
			/>
			<StandardModalSpinner
				show={importSpinner.isLoading}
				message="Importing state..."
				theme="green"
			/>
			<StandardModalSpinner
				show={resetSpinner.isLoading}
				message="Resetting state..."
				theme="orange"
			/>
			
			<PageHeader>
				<PageTitle>🔧 Enhanced State Management</PageTitle>
				<PageSubtitle>
					Advanced state management with undo/redo, offline capabilities, and persistence
				</PageSubtitle>
			</PageHeader>

			{message && (
				<div
					style={{
						marginBottom: '1rem',
					}}
				>
					<div
						style={{
							padding: '1rem',
							borderRadius: '8px',
							background:
								messageType === 'success'
									? '#f0fdf4'
									: messageType === 'error'
										? '#fef2f2'
										: '#eff6ff',
							border: `1px solid ${messageType === 'success' ? '#86efac' : messageType === 'error' ? '#fecaca' : '#bfdbfe'}`,
							color:
								messageType === 'success'
									? '#166534'
									: messageType === 'error'
										? '#991b1b'
										: '#1e40af',
							textAlign: 'center',
						}}
					>
						{message}
					</div>
				</div>
			)}

			{/* State Statistics */}
			<StatsGrid>
				<StatCard>
					<StatIcon $color="#3b82f6">
						<FiDatabase />
					</StatIcon>
					<StatValue>{stats?.unifiedFlow?.tokenCount || 0}</StatValue>
					<StatLabel>Total Tokens</StatLabel>
				</StatCard>

				<StatCard>
					<StatIcon $color="#8b5cf6">
						<FiSettings />
					</StatIcon>
					<StatValue>
						{(() => {
							try {
								const service = TokenMonitoringService.getInstance();
								const tokens = service.getAllTokens();
								return tokens.filter((t: any) => t.type === 'worker_token').length;
							} catch {
								return 0;
							}
						})()}
					</StatValue>
					<StatLabel>Worker Tokens</StatLabel>
				</StatCard>

				<StatCard>
					<StatIcon $color="#3b82f6">
						<FiKey />
					</StatIcon>
					<StatValue>
						{(() => {
							try {
								const service = TokenMonitoringService.getInstance();
								const tokens = service.getAllTokens();
								return tokens.filter((t: any) => t.type === 'access_token').length;
							} catch {
								return 0;
							}
						})()}
					</StatValue>
					<StatLabel>Access Tokens</StatLabel>
				</StatCard>

				<StatCard>
					<StatIcon $color="#f59e0b">
						<FiRotateCcw />
					</StatIcon>
					<StatValue>
						{(() => {
							try {
								const service = TokenMonitoringService.getInstance();
								const tokens = service.getAllTokens();
								return tokens.filter((t: any) => t.type === 'refresh_token').length;
							} catch {
								return 0;
							}
						})()}
					</StatValue>
					<StatLabel>Refresh Tokens</StatLabel>
				</StatCard>

				<StatCard>
					<StatIcon $color="#10b981">
						<FiCheckCircle />
					</StatIcon>
					<StatValue>
						{(() => {
							try {
								const service = TokenMonitoringService.getInstance();
								const tokens = service.getAllTokens();
								return tokens.filter((t: any) => t.type === 'id_token').length;
							} catch {
								return 0;
							}
						})()}
					</StatValue>
					<StatLabel>ID Tokens</StatLabel>
				</StatCard>

				<StatCard>
					<StatIcon $color="#10b981">
						<FiCheckCircle />
					</StatIcon>
					<StatValue>{stats?.unifiedFlow?.featureCount || 0}</StatValue>
					<StatLabel>Active Features</StatLabel>
				</StatCard>

				<StatCard>
					<StatIcon $color="#f59e0b">
						<FiAlertTriangle />
					</StatIcon>
					<StatValue>{stats?.unifiedFlow?.errorCount || 0}</StatValue>
					<StatLabel>Active Errors</StatLabel>
				</StatCard>

				<StatCard>
					<StatIcon $color="#8b5cf6">
						<FiClock />
					</StatIcon>
					<StatValue>
						{stats?.performance?.lastActivity
							? new Date(stats.performance.lastActivity).toLocaleTimeString()
							: 'Never'}
					</StatValue>
					<StatLabel>Last Activity</StatLabel>
				</StatCard>

				<StatCard>
					<StatIcon $color="#8b5cf6">
						<FiActivity />
					</StatIcon>
					<StatValue>{stats?.unifiedFlow?.apiCallCount || 0}</StatValue>
					<StatLabel>API Calls</StatLabel>
				</StatCard>

				<StatCard>
					<StatIcon $color="#8b5cf6">
						<FiWifi />
					</StatIcon>
					<StatValue>
						<StatusIndicator $status={stats?.offline?.isOnline ? 'online' : 'offline'}>
							{stats?.offline?.isOnline ? 'Online' : 'Offline'}
						</StatusIndicator>
					</StatValue>
					<StatLabel>Connection Status</StatLabel>
				</StatCard>
			</StatsGrid>

			{/* Offline Status */}
			<SectionContainer>
				<SectionHeader>
					<SectionIcon>
						<FiWifi />
					</SectionIcon>
					<SectionTitle>Offline Status</SectionTitle>
				</SectionHeader>

				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: '1rem',
						padding: '1rem',
						background: stats?.offline?.isOnline ? '#f0fdf4' : '#fef2f2',
						border: `1px solid ${stats?.offline?.isOnline ? '#86efac' : '#fecaca'}`,
						borderRadius: '8px',
						marginBottom: '1rem',
					}}
				>
					<div>
						<strong>Status:</strong> {stats?.offline?.isOnline ? 'Online' : 'Offline'}
					</div>
					<div>
						<strong>Pending Actions:</strong> {stats?.offline?.pendingActions?.length || 0}
					</div>
					<div>
						<strong>Sync Status:</strong> {stats?.offline?.syncStatus}
					</div>
					<div>
						<strong>Last Sync:</strong>{' '}
						{stats?.offline?.lastSyncTime
							? new Date(stats.offline.lastSyncTime).toLocaleString()
							: 'Never'}
					</div>
				</div>

				{stats?.offline?.pendingActions && stats.offline.pendingActions.length > 0 && (
					<div style={{ marginTop: '1rem' }}>
						<strong>Pending Actions:</strong>
						<ul style={{ margin: '0', paddingLeft: '1.5rem' }}>
							{stats.offline.pendingActions.slice(0, 5).map((action) => (
								<li key={action.id}>
									{action.type} - {new Date(action.timestamp).toLocaleTimeString()}
								</li>
							))}
							{stats.offline.pendingActions.length > 5 && (
								<li>...and {stats.offline.pendingActions.length - 5} more</li>
							)}
						</ul>
					</div>
				)}
			</SectionContainer>

			{/* Worker Token Status */}
			<SectionContainer>
				<SectionHeader>
					<SectionIcon>
						<FiDatabase />
					</SectionIcon>
					<SectionTitle>Worker Token Status</SectionTitle>
				</SectionHeader>

				<div
					style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
						gap: '1rem',
					}}
				>
					<div
						style={{
							padding: '1rem',
							background: stats?.unifiedFlow?.workerTokenMetrics?.hasWorkerToken
								? '#f0fdf4'
								: '#fef2f2',
							border: `1px solid ${stats?.unifiedFlow?.workerTokenMetrics?.hasWorkerToken ? '#86efac' : '#fecaca'}`,
							borderRadius: '8px',
							textAlign: 'center',
						}}
					>
						<div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b' }}>
							{stats?.unifiedFlow?.workerTokenMetrics?.hasWorkerToken ? 'Available' : 'None'}
						</div>
						<div style={{ fontSize: '0.875rem', color: '#64748b' }}>Worker Token</div>
					</div>

					<div
						style={{
							padding: '1rem',
							background: stats?.unifiedFlow?.workerTokenMetrics?.workerTokenValid
								? '#f0fdf4'
								: '#fef3c7',
							border: `1px solid ${stats?.unifiedFlow?.workerTokenMetrics?.workerTokenValid ? '#86efac' : '#fbbf24'}`,
							borderRadius: '8px',
							textAlign: 'center',
						}}
					>
						<div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b' }}>
							{stats?.unifiedFlow?.workerTokenMetrics?.workerTokenValid ? 'Valid' : 'Invalid'}
						</div>
						<div style={{ fontSize: '0.875rem', color: '#64748b' }}>Token Status</div>
					</div>

					<div
						style={{
							padding: '1rem',
							background: '#f8fafc',
							border: '1px solid #e2e8f0',
							borderRadius: '8px',
							textAlign: 'center',
						}}
					>
						<div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b' }}>
							{stats?.unifiedFlow?.workerTokenMetrics?.workerTokenExpiry
								? new Date(
										stats.unifiedFlow.workerTokenMetrics.workerTokenExpiry
									).toLocaleTimeString()
								: 'Never'}
						</div>
						<div style={{ fontSize: '0.875rem', color: '#64748b' }}>Expires At</div>
					</div>

					<div
						style={{
							padding: '1rem',
							background: '#f8fafc',
							border: '1px solid #e2e8f0',
							borderRadius: '8px',
							textAlign: 'center',
						}}
					>
						<div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b' }}>
							{stats?.unifiedFlow?.workerTokenMetrics?.lastWorkerTokenRefresh
								? new Date(
										stats.unifiedFlow.workerTokenMetrics.lastWorkerTokenRefresh
									).toLocaleTimeString()
								: 'Never'}
						</div>
						<div style={{ fontSize: '0.875rem', color: '#64748b' }}>Last Refresh</div>
					</div>
				</div>
			</SectionContainer>

			{/* All Token Status */}
			<SectionContainer>
				<SectionHeader>
					<SectionIcon>
						<FiDatabase />
					</SectionIcon>
					<SectionTitle>All Token Status</SectionTitle>
				</SectionHeader>

				<div
					style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
						gap: '1rem',
					}}
				>
					{(() => {
						try {
							const service = TokenMonitoringService.getInstance();
							const _allTokens = service.getAllTokens();
							const tokenTypes = [
								'access_token',
								'refresh_token',
								'id_token',
								'worker_token',
							] as const;

							return tokenTypes.map((tokenType) => {
								const tokens = service.getTokensByType(tokenType);
								const activeTokens = tokens.filter((t) => t.status === 'active');
								const expiringTokens = tokens.filter((t) => t.status === 'expiring');
								const expiredTokens = tokens.filter((t) => t.status === 'expired');

								const getTokenIcon = (type: string) => {
									switch (type) {
										case 'access_token':
											return '🔑';
										case 'refresh_token':
											return '🔄';
										case 'id_token':
											return '🆔';
										case 'worker_token':
											return '👷';
										default:
											return '📄';
									}
								};

								const getTokenColor = (type: string, hasActive: boolean) => {
									if (!hasActive) return '#fef2f2';
									switch (type) {
										case 'access_token':
											return '#dbeafe';
										case 'refresh_token':
											return '#fef3c7';
										case 'id_token':
											return '#f0fdf4';
										case 'worker_token':
											return '#ede9fe';
										default:
											return '#f8fafc';
									}
								};

								const getBorderColor = (type: string, hasActive: boolean) => {
									if (!hasActive) return '#fecaca';
									switch (type) {
										case 'access_token':
											return '#93c5fd';
										case 'refresh_token':
											return '#fbbf24';
										case 'id_token':
											return '#86efac';
										case 'worker_token':
											return '#a78bfa';
										default:
											return '#e2e8f0';
									}
								};

								return (
									<div
										key={tokenType}
										style={{
											padding: '1.5rem',
											background: getTokenColor(tokenType, activeTokens.length > 0),
											border: `1px solid ${getBorderColor(tokenType, activeTokens.length > 0)}`,
											borderRadius: '8px',
											textAlign: 'center',
											minHeight: '140px',
											display: 'flex',
											flexDirection: 'column',
											justifyContent: 'center',
										}}
									>
										<div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
											{getTokenIcon(tokenType)}
										</div>
										<div
											style={{
												fontSize: '1.25rem',
												fontWeight: '700',
												color: '#1e293b',
												marginBottom: '0.5rem',
											}}
										>
											{activeTokens.length > 0 ? `${activeTokens.length} Active` : 'None'}
										</div>
										<div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>
											{tokenType.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
										</div>
										{(expiringTokens.length > 0 || expiredTokens.length > 0) && (
											<div style={{ fontSize: '0.75rem', color: '#64748b' }}>
												{expiringTokens.length > 0 && (
													<span style={{ color: '#d97706' }}>
														⚠️ {expiringTokens.length} expiring
													</span>
												)}
												{expiredTokens.length > 0 && (
													<span style={{ color: '#dc2626' }}>
														❌ {expiredTokens.length} expired
													</span>
												)}
											</div>
										)}
										{activeTokens.length > 0 && activeTokens[0].expiresAt && (
											<div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
												Expires: {new Date(activeTokens[0].expiresAt).toLocaleTimeString()}
											</div>
										)}
									</div>
								);
							});
						} catch (_error) {
							return (
								<div
									style={{
										padding: '1rem',
										background: '#fef2f2',
										border: '1px solid #fecaca',
										borderRadius: '8px',
										textAlign: 'center',
										gridColumn: '1 / -1',
									}}
								>
									<div style={{ fontSize: '1rem', color: '#dc2626' }}>
										Unable to load token information
									</div>
								</div>
							);
						}
					})()}
				</div>
			</SectionContainer>

			{/* Performance Metrics */}
			<SectionContainer>
				<SectionHeader>
					<SectionIcon>
						<FiActivity />
					</SectionIcon>
					<SectionTitle>Performance Metrics</SectionTitle>
				</SectionHeader>

				<div
					style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
						gap: '1rem',
					}}
				>
					<div
						style={{
							padding: '1rem',
							background: '#f8fafc',
							border: '1px solid #e2e8f0',
							borderRadius: '8px',
							textAlign: 'center',
						}}
					>
						<div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b' }}>
							{stats?.unifiedFlow?.performanceMetrics?.avgResponseTime || 0}ms
						</div>
						<div style={{ fontSize: '0.875rem', color: '#64748b' }}>Avg Response Time</div>
					</div>

					<div
						style={{
							padding: '1rem',
							background: '#f8fafc',
							border: '1px solid #e2e8f0',
							borderRadius: '8px',
							textAlign: 'center',
						}}
					>
						<div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b' }}>
							{stats?.unifiedFlow?.performanceMetrics?.successRate || 100}%
						</div>
						<div style={{ fontSize: '0.875rem', color: '#64748b' }}>Success Rate</div>
					</div>

					<div
						style={{
							padding: '1rem',
							background: '#f8fafc',
							border: '1px solid #e2e8f0',
							borderRadius: '8px',
							textAlign: 'center',
						}}
					>
						<div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b' }}>
							{stats?.unifiedFlow?.lastApiCall
								? new Date(stats.unifiedFlow.lastApiCall).toLocaleTimeString()
								: 'Never'}
						</div>
						<div style={{ fontSize: '0.875rem', color: '#64748b' }}>Last API Call</div>
					</div>
				</div>
			</SectionContainer>

			{/* Features Overview */}
			<SectionContainer>
				<SectionHeader>
					<SectionIcon>
						<FiZap />
					</SectionIcon>
					<SectionTitle>Available Features</SectionTitle>
				</SectionHeader>

				<FeatureList>
					<FeatureItem>
						<FeatureIcon $color="#10b981">
							<FiDatabase />
						</FeatureIcon>
						<FeatureText>Comprehensive state management for all OAuth flows</FeatureText>
						<FeatureStatus $enabled={true}>Active</FeatureStatus>
					</FeatureItem>

					<FeatureItem>
						<FeatureIcon $color="#8b5cf6">
							<FiRotateCcw />
						</FeatureIcon>
						<FeatureText>Undo/Redo functionality with history tracking</FeatureText>
						<FeatureStatus $enabled={true}>Active</FeatureStatus>
					</FeatureItem>

					<FeatureItem>
						<FeatureIcon $color="#3b82f6">
							<FiWifi />
						</FeatureIcon>
						<FeatureText>Offline capability with pending action queue</FeatureText>
						<FeatureStatus $enabled={stats?.offline?.isOnline || false}>Active</FeatureStatus>
					</FeatureItem>

					<FeatureItem>
						<FeatureIcon $color="#10b981">
							<FiRefreshCw />
						</FeatureIcon>
						<FeatureText>Automatic state persistence to localStorage</FeatureText>
						<FeatureStatus $enabled={true}>Active</FeatureStatus>
					</FeatureItem>

					<FeatureItem>
						<FeatureIcon $color="#8b5cf6">
							<FiActivity />
						</FeatureIcon>
						<FeatureText>Performance metrics and activity tracking</FeatureText>
						<FeatureStatus $enabled={true}>Active</FeatureStatus>
					</FeatureItem>

					<FeatureItem>
						<FeatureIcon $color="#ef4444">
							<FiAlertTriangle />
						</FeatureIcon>
						<FeatureText>Error handling and recovery mechanisms</FeatureText>
						<FeatureStatus $enabled={true}>Active</FeatureStatus>
					</FeatureItem>
				</FeatureList>
			</SectionContainer>

			{/* Export/Import Controls */}
			<SectionContainer>
				<SectionHeader>
					<SectionIcon>
						<FiDatabase />
					</SectionIcon>
					<SectionTitle>Data Management</SectionTitle>
				</SectionHeader>

				<ExportImportControls>
					<ExportImportButton onClick={handleExport} disabled={isExporting}>
						<FiDownload /> {isExporting ? 'Exporting...' : 'Export State'}
					</ExportImportButton>

					<input
						type="file"
						accept=".json"
						onChange={handleImport}
						disabled={isImporting}
						style={{ display: 'none' }}
						id="state-import-input"
					/>
					<ExportImportButton
						as="label"
						htmlFor="state-import-input"
						disabled={isImporting}
						style={{ cursor: isImporting ? 'not-allowed' : 'pointer' }}
					>
						<FiUpload /> {isImporting ? 'Importing...' : 'Import State'}
					</ExportImportButton>
				</ExportImportControls>

				<div
					style={{
						fontSize: '0.875rem',
						color: '#64748b',
						marginTop: '0.5rem',
					}}
				>
					<p>
						<strong>Export:</strong> Save your current state to a JSON file for backup or sharing
					</p>
					<p>
						<strong>Import:</strong> Load a previously saved state from a JSON file
					</p>
				</div>
			</SectionContainer>

			{/* Action Buttons */}
			<ActionButtons>
				<ActionButton onClick={handleResetAll} $variant="danger">
					<FiTrash2 /> Reset All State
				</ActionButton>
				<ActionButton
					onClick={() => {
						logger.debug('Theme reset button clicked');
						try {
							actions.setTheme('auto');
							setMessage('Theme set to auto');
							setMessageType('info');
						} catch (error) {
							logger.error('Failed to reset theme:', error);
							setMessage('Failed to reset theme');
							setMessageType('error');
						}
					}}
				>
					<FiSettings /> Reset Theme
				</ActionButton>
				<ActionButton
					onClick={() => {
						actions.toggleNotifications();
						setMessage(`Notifications ${state.notifications ? 'enabled' : 'disabled'}`);
						setMessageType('info');
					}}
				>
					{state.notifications ? <FiBell /> : <FiBellOff />} Toggle Notifications
				</ActionButton>
				<ActionButton
					onClick={() => {
						actions.updateRealMetrics();
						setMessage('Real metrics updated');
						setMessageType('success');
					}}
				>
					<FiRefreshCw /> Update Real Metrics
				</ActionButton>
			</ActionButtons>
		</PageContainer>
	);
};

export default EnhancedStateManagementPage;
