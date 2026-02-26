import React, { useCallback, useEffect, useState } from 'react';
import { FiRefreshCw, FiServer } from 'react-icons/fi';
import styled from 'styled-components';
import {
	type DetailedServerStatus,
	fetchDetailedHealth,
	formatBytes,
	formatUptime,
} from '../services/serverHealthService';

const PageContainer = styled.div`
	max-width: 1200px;
	margin: 0 auto;
	padding: 2rem;
`;

const PageHeader = styled.div`
	margin-bottom: 2rem;
`;

const PageTitle = styled.h1`
	font-size: 2.5rem;
	font-weight: 700;
	color: #1f2937;
	margin-bottom: 0.5rem;
	display: flex;
	align-items: center;
	gap: 0.75rem;
`;

const PageDescription = styled.p`
	color: #6b7280;
	font-size: 1.125rem;
	margin-bottom: 1rem;
`;

const StatusGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	gap: 1.5rem;
	margin-bottom: 2rem;
`;

const StatusCard = styled.div`
	background: white;
	border-radius: 0.75rem;
	padding: 1.5rem;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	border: 1px solid #e5e7eb;
`;

const CardHeader = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	margin-bottom: 1rem;
`;

const CardTitle = styled.h3`
	font-size: 1.125rem;
	font-weight: 600;
	color: #1f2937;
	margin: 0;
`;

const CardIcon = styled.div<{ color: string }>`
	color: ${(props) => props.color};
	font-size: 1.25rem;
`;

const StatRow = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 0.5rem 0;
	border-bottom: 1px solid #f3f4f6;

	&:last-child {
		border-bottom: none;
	}
`;

const StatLabel = styled.span`
	color: #6b7280;
	font-size: 0.875rem;
`;

const StatValue = styled.span`
	font-weight: 500;
	color: #1f2937;
	font-size: 0.875rem;
`;

const StatusBadge = styled.span<{ status: 'online' | 'offline' | 'warning' | 'checking' }>`
	background: ${(props) => {
		switch (props.status) {
			case 'online':
				return '#10b981';
			case 'offline':
				return '#ef4444';
			case 'warning':
				return '#f59e0b';
			case 'checking':
				return '#f59e0b';
			default:
				return '#6b7280';
		}
	}};
	color: white;
	padding: 0.25rem 0.75rem;
	border-radius: 9999px;
	font-size: 0.75rem;
	font-weight: 500;
`;

const RefreshButton = styled.button`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1.5rem;
	background: #3b82f6;
	color: white;
	border: none;
	border-radius: 0.5rem;
	font-weight: 500;
	cursor: pointer;
	transition: background-color 0.2s;

	&:hover {
		background: #2563eb;
	}

	&:disabled {
		background: #9ca3af;
		cursor: not-allowed;
	}
`;

const _ErrorMessage = styled.div`
	background: #fef2f2;
	border: 1px solid #fecaca;
	border-radius: 0.5rem;
	padding: 1rem;
	color: #991b1b;
	margin-bottom: 1.5rem;
`;

const ApiStatusPage: React.FC = () => {
	const [servers, setServers] = useState<DetailedServerStatus[]>([]);
	const [loading, setLoading] = useState(true);
	const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

	const fetchHealthData = useCallback(async () => {
		setLoading(true);
		try {
			const updatedServers = await fetchDetailedHealth();
			setServers(updatedServers);
			setLastRefresh(new Date());
		} catch (err) {
			console.error('Failed to fetch server health data:', err);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchHealthData();
	}, [fetchHealthData]);

	if (loading && servers.every((s) => s.status === 'checking')) {
		return (
			<PageContainer>
				<PageHeader>
					<PageTitle>
						<FiServer />
						API Status
					</PageTitle>
					<PageDescription>Loading server health information...</PageDescription>
				</PageHeader>
			</PageContainer>
		);
	}

	return (
		<PageContainer>
			<PageHeader>
				<PageTitle>
					<FiServer />
					API Status
				</PageTitle>
				<PageDescription>
					Server health monitoring and status information
					{lastRefresh && (
						<span style={{ marginLeft: '1rem', color: '#9ca3af', fontSize: '0.875rem' }}>
							Last updated: {lastRefresh.toLocaleTimeString()}
						</span>
					)}
				</PageDescription>
				<RefreshButton onClick={fetchHealthData}>
					<FiRefreshCw style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
					{loading ? 'Refreshing...' : 'Refresh'}
				</RefreshButton>
			</PageHeader>

			<StatusGrid>
				{servers.map((server) => (
					<StatusCard key={server.name}>
						<CardHeader>
							<CardIcon
								color={
									server.status === 'online'
										? '#10b981'
										: server.status === 'offline'
											? '#ef4444'
											: '#f59e0b'
								}
							>
								<FiServer />
							</CardIcon>
							<CardTitle>{server.name}</CardTitle>
							<StatusBadge status={server.status}>
								{server.status === 'online'
									? 'Online'
									: server.status === 'offline'
										? 'Offline'
										: 'Checking'}
							</StatusBadge>
						</CardHeader>

						{server.error && (
							<div
								style={{
									marginBottom: '1rem',
									padding: '0.5rem',
									backgroundColor: '#fef2f2',
									border: '1px solid #fecaca',
									borderRadius: '0.25rem',
									color: '#991b1b',
									fontSize: '0.875rem',
								}}
							>
								{server.error}
							</div>
						)}

						{server.healthData && (
							<>
								<StatRow>
									<StatLabel>Port</StatLabel>
									<StatValue>
										{server.port} ({server.protocol})
									</StatValue>
								</StatRow>
								<StatRow>
									<StatLabel>Status</StatLabel>
									<StatValue>{server.healthData.status}</StatValue>
								</StatRow>
								<StatRow>
									<StatLabel>Version</StatLabel>
									<StatValue>{server.healthData.version}</StatValue>
								</StatRow>
								<StatRow>
									<StatLabel>Environment</StatLabel>
									<StatValue>{server.healthData.environment}</StatValue>
								</StatRow>
								{server.healthData.pid > 0 && (
									<StatRow>
										<StatLabel>Process ID</StatLabel>
										<StatValue>{server.healthData.pid}</StatValue>
									</StatRow>
								)}
								{server.healthData.uptimeSeconds > 0 && (
									<StatRow>
										<StatLabel>Uptime</StatLabel>
										<StatValue>{formatUptime(server.healthData.uptimeSeconds)}</StatValue>
									</StatRow>
								)}
								{server.lastChecked && (
									<StatRow>
										<StatLabel>Last Checked</StatLabel>
										<StatValue>{server.lastChecked.toLocaleTimeString()}</StatValue>
									</StatRow>
								)}

								{/* Show additional details for backend servers */}
								{server.port !== 3000 && (
									<>
										<StatRow>
											<StatLabel>Node Version</StatLabel>
											<StatValue>{server.healthData.node.version}</StatValue>
										</StatRow>
										<StatRow>
											<StatLabel>Memory Usage</StatLabel>
											<StatValue>
												{formatBytes(server.healthData.memory.heapUsed)} /{' '}
												{formatBytes(server.healthData.memory.heapTotal)}
											</StatValue>
										</StatRow>
										<StatRow>
											<StatLabel>CPU Usage</StatLabel>
											<StatValue>{server.healthData.cpuUsage.avg1mPercent.toFixed(1)}%</StatValue>
										</StatRow>
										<StatRow>
											<StatLabel>Requests</StatLabel>
											<StatValue>
												{server.healthData.requestStats.totalRequests} (
												{server.healthData.requestStats.errorRate > 0
													? `${server.healthData.requestStats.errorRate.toFixed(1)}% errors`
													: 'no errors'}
												)
											</StatValue>
										</StatRow>
									</>
								)}
							</>
						)}
					</StatusCard>
				))}
			</StatusGrid>
		</PageContainer>
	);
};

export default ApiStatusPage;
