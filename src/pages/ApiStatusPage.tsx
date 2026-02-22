import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';

interface HealthData {
	status: string;
	timestamp: string;
	version: string;
	versions: {
		app: string;
		mfaV8: string;
		unifiedV8u: string;
	};
	pid: number;
	startTime: string;
	uptimeSeconds: number;
	environment: string;
	node: {
		version: string;
		platform: string;
		arch: string;
	};
	memory: {
		rss: number;
		heapTotal: number;
		heapUsed: number;
		external: number;
		arrayBuffers: number;
	};
	systemMemory: {
		total: number;
		free: number;
		used: number;
	};
	loadAverage: number[];
	cpuUsage: {
		avg1mPercent: number;
		avg5mPercent: number;
		avg15mPercent: number;
	};
	requestStats: {
		totalRequests: number;
		activeConnections: number;
		avgResponseTime: number;
		errorRate: number;
	};
}

interface ServerStatus {
	name: string;
	port: number;
	protocol: 'HTTP' | 'HTTPS';
	status: 'online' | 'offline' | 'checking';
	healthData: HealthData | null;
	error: string | null;
	lastChecked: Date | null;
}

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

const formatBytes = (bytes: number): string => {
	if (bytes === 0) return '0 Bytes';
	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
};

const formatUptime = (seconds: number): string => {
	const days = Math.floor(seconds / 86400);
	const hours = Math.floor((seconds % 86400) / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);

	if (days > 0) {
		return `${days}d ${hours}h ${minutes}m`;
	} else if (hours > 0) {
		return `${hours}h ${minutes}m`;
	} else {
		return `${minutes}m`;
	}
};

const ApiStatusPage: React.FC = () => {
	const [servers, setServers] = useState<ServerStatus[]>([
		{
			name: 'Frontend Server',
			port: 3000,
			protocol: 'HTTPS',
			status: 'checking',
			healthData: null,
			error: null,
			lastChecked: null,
		},
		{
			name: 'Backend HTTP Server',
			port: 3001,
			protocol: 'HTTP',
			status: 'checking',
			healthData: null,
			error: null,
			lastChecked: null,
		},
		{
			name: 'Backend HTTPS Server',
			port: 3002,
			protocol: 'HTTPS',
			status: 'checking',
			healthData: null,
			error: null,
			lastChecked: null,
		},
	]);
	const [loading, setLoading] = useState(true);
	const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

	const checkServerHealth = async (server: ServerStatus): Promise<ServerStatus> => {
		const updatedServer = { ...server, status: 'checking' as const };

		try {
			// Track the health check API call for display in API monitoring
			const { apiCallTrackerService } = await import('@/services/apiCallTrackerService');
			const callId = apiCallTrackerService.trackApiCall({
				method: 'GET',
				url: '/api/health',
				actualPingOneUrl: `${server.protocol.toLowerCase()}://localhost:${server.port}/api/health`,
				isProxy: server.port !== 3000, // Frontend server doesn't use proxy
				headers: {
					Accept: 'application/json',
				},
				body: null,
				step: 'api-status-monitoring',
				flowType: 'system',
			});

			// For frontend server, we can't directly check its health endpoint
			// Instead, we'll check if it's responding by making a request to the root
			const url = server.port === 3000 ? '/' : '/api/health';
			const response = await fetch(url);

			if (!response.ok) {
				// Update with error response
				apiCallTrackerService.updateApiCallResponse(callId, {
					status: response.status,
					statusText: response.statusText,
					data: null,
				});
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			// Only backend servers have health endpoint data
			let data: HealthData | null = null;
			if (server.port !== 3000) {
				data = await response.json();
			} else {
				// For frontend, create minimal health data
				data = {
					status: 'ok',
					timestamp: new Date().toISOString(),
					version: '9.4.8',
					versions: { app: '9.4.8', mfaV8: '9.4.8', unifiedV8u: '9.4.8' },
					pid: 0,
					startTime: new Date().toISOString(),
					uptimeSeconds: 0,
					environment: 'development',
					node: { version: 'v22.16.0', platform: 'darwin', arch: 'arm64' },
					memory: { rss: 0, heapTotal: 0, heapUsed: 0, external: 0, arrayBuffers: 0 },
					systemMemory: { total: 0, free: 0, used: 0 },
					loadAverage: [0, 0, 0],
					cpuUsage: { avg1mPercent: 0, avg5mPercent: 0, avg15mPercent: 0 },
					requestStats: {
						totalRequests: 0,
						activeConnections: 0,
						avgResponseTime: 0,
						errorRate: 0,
					},
				};
			}

			// Update with successful response
			apiCallTrackerService.updateApiCallResponse(callId, {
				status: response.status,
				statusText: response.statusText,
				data: data,
			});

			return {
				...updatedServer,
				status: 'online',
				healthData: data,
				error: null,
				lastChecked: new Date(),
			};
		} catch (err) {
			return {
				...updatedServer,
				status: 'offline',
				healthData: null,
				error: err instanceof Error ? err.message : 'Failed to fetch health data',
				lastChecked: new Date(),
			};
		}
	};

	const fetchHealthData = useCallback(async () => {
		try {
			setLoading(true);

			// Check all servers in parallel
			const serverPromises = servers.map((server) => checkServerHealth(server));
			const updatedServers = await Promise.all(serverPromises);

			setServers(updatedServers);
			setLastRefresh(new Date());
		} catch (err) {
			console.error('Failed to fetch server health data:', err);
		} finally {
			setLoading(false);
		}
	}, [servers, checkServerHealth]);

	useEffect(() => {
		fetchHealthData();
		// Only run once on mount
		// biome-ignore lint/correctness/useExhaustiveDependencies: Only run once on mount
	}, [fetchHealthData]);

	if (loading && servers.every((s) => s.status === 'checking')) {
		return (
			<PageContainer>
				<PageHeader>
					<PageTitle>
						<span className="mdi mdi-server" style={{ fontSize: '28px' }}></span>
						API Status
					</PageTitle>
					<PageDescription>Loading server health information...</PageDescription>
				</PageHeader>
			</PageContainer>
		);
	}

	return (
		<div className="end-user-nano">
			<PageContainer>
				<PageHeader>
					<PageTitle>
						<span className="mdi mdi-server" style={{ fontSize: '28px' }}></span>
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
						<span
							className="mdi mdi-refresh"
							style={{ animation: loading ? 'spin 1s linear infinite' : 'none', fontSize: '16px' }}
						></span>
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
									<span className="mdi mdi-server" style={{ fontSize: '20px' }}></span>
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
														? `${(server.healthData.requestStats.errorRate * 100).toFixed(1)}% errors`
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
		</div>
	);
};

export default ApiStatusPage;
