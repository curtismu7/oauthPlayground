import { FiCheckCircle, FiGlobe, FiRefreshCw, FiServer, FiXCircle } from '@icons';
import type React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { showGlobalError, showGlobalSuccess } from '../hooks/useNotifications';

interface ServerStatus {
	name: string;
	url: string;
	status: 'checking' | 'online' | 'offline';
	responseTime?: number;
	error?: string;
}

const ServerStatusContainer = styled.div`
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
    background: linear-gradient(90deg, V9_COLORS.PRIMARY.BLUE, V9_COLORS.PRIMARY.BLUE_LIGHT, #93c5fd);
  }
`;

const ServerStatusHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  
  h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: V9_COLORS.TEXT.GRAY_DARK;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
`;

const RefreshButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: linear-gradient(135deg, V9_COLORS.PRIMARY.BLUE 0%, V9_COLORS.PRIMARY.BLUE_DARK 100%);
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  
  &:hover:not(:disabled) {
    background: linear-gradient(135deg, V9_COLORS.PRIMARY.BLUE_DARK 0%, V9_COLORS.PRIMARY.BLUE_DARK 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
`;

const ServerGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
`;

const ServerCard = styled.div<{ $status: 'checking' | 'online' | 'offline' }>`
  background: ${({ $status }) => {
		switch ($status) {
			case 'online':
				return 'linear-gradient(135deg, #f0fdf4 0%, V9_COLORS.BG.SUCCESS 100%)';
			case 'offline':
				return 'linear-gradient(135deg, V9_COLORS.BG.ERROR 0%, V9_COLORS.BG.ERROR 100%)';
			case 'checking':
				return 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)';
			default:
				return 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)';
		}
	}};
  border: 2px solid ${({ $status }) => {
		switch ($status) {
			case 'online':
				return 'V9_COLORS.BG.SUCCESS_BORDER';
			case 'offline':
				return 'V9_COLORS.BG.ERROR_BORDER';
			case 'checking':
				return 'V9_COLORS.TEXT.GRAY_LIGHTER';
			default:
				return 'V9_COLORS.TEXT.GRAY_LIGHTER';
		}
	}};
  border-radius: 0.75rem;
  padding: 1.5rem;
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
    background: ${({ $status }) => {
			switch ($status) {
				case 'online':
					return 'linear-gradient(90deg, V9_COLORS.PRIMARY.GREEN, V9_COLORS.PRIMARY.GREEN_LIGHT)';
				case 'offline':
					return 'linear-gradient(90deg, V9_COLORS.PRIMARY.RED, V9_COLORS.PRIMARY.RED_LIGHT)';
				case 'checking':
					return 'linear-gradient(90deg, V9_COLORS.TEXT.GRAY_MEDIUM, V9_COLORS.TEXT.GRAY_LIGHT)';
				default:
					return 'linear-gradient(90deg, V9_COLORS.TEXT.GRAY_MEDIUM, V9_COLORS.TEXT.GRAY_LIGHT)';
			}
		}};
  }
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    border-color: ${({ $status }) => {
			switch ($status) {
				case 'online':
					return '#86efac';
				case 'offline':
					return '#fca5a5';
				case 'checking':
					return 'V9_COLORS.TEXT.GRAY_LIGHTER';
				default:
					return 'V9_COLORS.TEXT.GRAY_LIGHTER';
			}
		}};
  }
`;

const ServerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const ServerName = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: V9_COLORS.TEXT.GRAY_DARK;
`;

const StatusIndicator = styled.div<{
	$status: 'checking' | 'online' | 'offline';
}>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${({ $status }) => {
		switch ($status) {
			case 'online':
				return 'V9_COLORS.PRIMARY.GREEN_DARK';
			case 'offline':
				return 'V9_COLORS.PRIMARY.RED_DARK';
			case 'checking':
				return 'V9_COLORS.TEXT.GRAY_MEDIUM';
			default:
				return 'V9_COLORS.TEXT.GRAY_MEDIUM';
		}
	}};
`;

const ServerDetails = styled.div`
  color: V9_COLORS.TEXT.GRAY_MEDIUM;
  font-size: 0.875rem;
  line-height: 1.5;
  
  .detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  .field-name {
    font-weight: 500;
    color: V9_COLORS.TEXT.GRAY_DARK;
  }
  
  .field-value {
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 0.8rem;
    background: rgba(0, 0, 0, 0.05);
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
  }
  
  .error-message {
    color: V9_COLORS.PRIMARY.RED_DARK;
    margin-top: 0.75rem;
    padding: 0.5rem;
    background: rgba(239, 68, 68, 0.1);
    border-radius: 0.375rem;
    border-left: 3px solid V9_COLORS.PRIMARY.RED_DARK;
  }
  
  .success-message {
    color: V9_COLORS.PRIMARY.GREEN_DARK;
    margin-top: 0.75rem;
    padding: 0.5rem;
    background: rgba(16, 185, 129, 0.1);
    border-radius: 0.375rem;
    border-left: 3px solid V9_COLORS.PRIMARY.GREEN_DARK;
  }
`;

const ServerStatusPanel: React.FC = () => {
	const [servers, setServers] = useState<ServerStatus[]>([
		{
			name: 'Frontend Server',
			url: window.location.origin,
			status: 'checking',
		},
		{
			name: 'Backend Server',
			url: '/api/health',
			status: 'checking',
		},
	]);
	const serverUidMap = useMemo(() => new Map<string, string>(), []);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

	const checkServerStatus = useCallback(async (server: ServerStatus): Promise<ServerStatus> => {
		try {
			const startTime = Date.now();

			// Different headers for frontend vs backend
			const headers: HeadersInit =
				server.name === 'Frontend Server'
					? {
							Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
						}
					: {
							Accept: 'application/json',
						};

			const response = await fetch(server.url, {
				method: 'GET',
				mode: 'cors',
				headers,
				signal: AbortSignal.timeout(5000), // 5 second timeout
			});
			const endTime = Date.now();
			const responseTime = endTime - startTime;

			if (response.ok) {
				return {
					...server,
					status: 'online',
					responseTime,
				};
			}

			return {
				...server,
				status: 'offline',
				error: `HTTP ${response.status}: ${response.statusText}`,
			};
		} catch (error) {
			return {
				...server,
				status: 'offline',
				error: error instanceof Error ? error.message : 'Connection failed',
			};
		}
	}, []);

	const getServerKey = useCallback(
		(server: ServerStatus): string => {
			const compositeKey = `${server.name}|${server.url}`;
			if (!serverUidMap.has(compositeKey)) {
				const generatedId =
					typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
						? crypto.randomUUID()
						: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
				serverUidMap.set(compositeKey, generatedId);
			}
			return serverUidMap.get(compositeKey) as string;
		},
		[serverUidMap]
	);

	const refreshAllServers = useCallback(async () => {
		setIsRefreshing(true);
		try {
			const updatedServers = await Promise.all(servers.map((server) => checkServerStatus(server)));
			setServers(updatedServers);
			setLastRefresh(new Date());

			const onlineCount = updatedServers.filter((s) => s.status === 'online').length;
			const totalCount = updatedServers.length;

			if (onlineCount === totalCount) {
				showGlobalSuccess(' All Servers Online', {
					description: `All ${totalCount} servers are responding normally`,
					duration: 5000,
				});
			} else if (onlineCount > 0) {
				showGlobalSuccess(' Partial Server Status', {
					description: `${onlineCount} of ${totalCount} servers are online`,
					duration: 5000,
				});
			} else {
				showGlobalError(' All Servers Offline', {
					description: 'No servers are currently responding',
				});
			}
		} catch (_error) {
			showGlobalError(' Server Status Check Failed', {
				description: 'Failed to check server status. Please try again.',
			});
		} finally {
			setIsRefreshing(false);
		}
	}, [checkServerStatus, servers]);

	// Check server status on component mount
	useEffect(() => {
		refreshAllServers();
	}, [refreshAllServers]);

	const getStatusIcon = (status: 'checking' | 'online' | 'offline') => {
		switch (status) {
			case 'online':
				return <FiCheckCircle size={20} color="V9_COLORS.PRIMARY.GREEN_DARK" />;
			case 'offline':
				return <FiXCircle size={20} color="V9_COLORS.PRIMARY.RED_DARK" />;
			case 'checking':
				return (
					<FiRefreshCw size={20} color="V9_COLORS.TEXT.GRAY_MEDIUM" className="animate-spin" />
				);
			default:
				return <FiXCircle size={20} color="V9_COLORS.PRIMARY.RED_DARK" />;
		}
	};

	const getStatusText = (status: 'checking' | 'online' | 'offline') => {
		switch (status) {
			case 'online':
				return 'Online';
			case 'offline':
				return 'Offline';
			case 'checking':
				return 'Checking...';
			default:
				return 'Unknown';
		}
	};

	const formatLastRefresh = () => {
		const now = new Date();
		const diffMs = now.getTime() - lastRefresh.getTime();
		const diffMins = Math.floor(diffMs / 60000);

		if (diffMins < 1) return 'Just now';
		if (diffMins < 60) return `${diffMins}m ago`;
		if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
		return lastRefresh.toLocaleDateString();
	};

	return (
		<ServerStatusContainer>
			<ServerStatusHeader>
				<h3>
					<FiServer size={24} />
					Server Status
				</h3>
				<RefreshButton onClick={refreshAllServers} disabled={isRefreshing}>
					<FiRefreshCw className={isRefreshing ? 'animate-spin' : ''} />
					{isRefreshing ? 'Refreshing...' : 'Refresh'}
				</RefreshButton>
			</ServerStatusHeader>

			<div
				style={{ marginBottom: '1rem', color: 'V9_COLORS.TEXT.GRAY_MEDIUM', fontSize: '0.875rem' }}
			>
				Last updated: {formatLastRefresh()}
			</div>

			<ServerGrid>
				{servers.map((server) => (
					<ServerCard key={getServerKey(server)} $status={server.status}>
						<ServerHeader>
							<ServerName>
								{server.name === 'Frontend Server' ? <FiGlobe size={20} /> : <FiServer size={20} />}
								{server.name}
							</ServerName>
							<StatusIndicator $status={server.status}>
								{getStatusIcon(server.status)}
								{getStatusText(server.status)}
							</StatusIndicator>
						</ServerHeader>

						<ServerDetails>
							<div className="detail-row">
								<span className="field-name">URL:</span>
								<span className="field-value">{server.url}</span>
							</div>

							{server.responseTime && (
								<div className="detail-row">
									<span className="field-name">Response Time:</span>
									<span className="field-value">{server.responseTime}ms</span>
								</div>
							)}

							{server.error && (
								<div className="error-message">
									<strong>Error:</strong> {server.error}
								</div>
							)}

							{server.status === 'online' && (
								<div className="success-message">
									<strong>Status:</strong> Server is responding normally
								</div>
							)}
						</ServerDetails>
					</ServerCard>
				))}
			</ServerGrid>
		</ServerStatusContainer>
	);
};

export default ServerStatusPanel;
