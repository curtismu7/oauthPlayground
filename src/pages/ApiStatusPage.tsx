import React, { useEffect, useState } from 'react';
import { FiActivity, FiCpu, FiDatabase, FiGlobe, FiHardDrive, FiRefreshCw, FiServer, FiZap } from 'react-icons/fi';
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
	color: ${props => props.color};
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

const StatusBadge = styled.span<{ status: 'online' | 'offline' | 'warning' }>`
	background: ${props => {
		switch (props.status) {
			case 'online': return '#10b981';
			case 'offline': return '#ef4444';
			case 'warning': return '#f59e0b';
			default: return '#6b7280';
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

const ErrorMessage = styled.div`
	background: #fef2f2;
	border: 1px solid #fecaca;
	border-radius: 0.5rem;
	padding: 1rem;
	color: #991b1b;
	margin-bottom: 1.5rem;
`;

const formatBytes = (bytes: number): string => {
	if (bytes === 0) return '0 Bytes';
	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
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
	const [healthData, setHealthData] = useState<HealthData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

	const fetchHealthData = async () => {
		try {
			setLoading(true);
			setError(null);
			
			const response = await fetch('/api/health');
			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}
			
			const data = await response.json();
			setHealthData(data);
			setLastRefresh(new Date());
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to fetch health data');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchHealthData();
		// biome-ignore lint/correctness/useExhaustiveDependencies: Only run once on mount
	}, []);

	if (loading && !healthData) {
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

	if (error) {
		return (
			<PageContainer>
				<PageHeader>
					<PageTitle>
						<FiServer />
						API Status
					</PageTitle>
					<PageDescription>Server health monitoring and status information</PageDescription>
				</PageHeader>
				
				<ErrorMessage>
					<strong>Error:</strong> {error}
				</ErrorMessage>
				
				<RefreshButton onClick={fetchHealthData}>
					<FiRefreshCw />
					Retry
				</RefreshButton>
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
				<RefreshButton onClick={fetchHealthData} disabled={loading}>
					<FiRefreshCw style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
					{loading ? 'Refreshing...' : 'Refresh'}
				</RefreshButton>
			</PageHeader>

			{healthData && (
				<StatusGrid>
					{/* Server Status */}
					<StatusCard>
						<CardHeader>
							<CardIcon color={healthData.status === 'ok' ? '#10b981' : '#ef4444'}>
								<FiServer />
							</CardIcon>
							<CardTitle>Server Status</CardTitle>
							<StatusBadge status={healthData.status === 'ok' ? 'online' : 'offline'}>
								{healthData.status === 'ok' ? 'Online' : 'Offline'}
							</StatusBadge>
						</CardHeader>
						<StatRow>
							<StatLabel>Version</StatLabel>
							<StatValue>{healthData.version}</StatValue>
						</StatRow>
						<StatRow>
							<StatLabel>Environment</StatLabel>
							<StatValue>{healthData.environment}</StatValue>
						</StatRow>
						<StatRow>
							<StatLabel>Process ID</StatLabel>
							<StatValue>{healthData.pid}</StatValue>
						</StatRow>
						<StatRow>
							<StatLabel>Uptime</StatLabel>
							<StatValue>{formatUptime(healthData.uptimeSeconds)}</StatValue>
						</StatRow>
						<StatRow>
							<StatLabel>Started</StatLabel>
							<StatValue>{new Date(healthData.startTime).toLocaleString()}</StatValue>
						</StatRow>
					</StatusCard>

					{/* Version Info */}
					<StatusCard>
						<CardHeader>
							<CardIcon color="#3b82f6">
								<FiZap />
							</CardIcon>
							<CardTitle>Version Information</CardTitle>
						</CardHeader>
						<StatRow>
							<StatLabel>App Version</StatLabel>
							<StatValue>{healthData.versions.app}</StatValue>
						</StatRow>
						<StatRow>
							<StatLabel>MFA V8</StatLabel>
							<StatValue>{healthData.versions.mfaV8}</StatValue>
						</StatRow>
						<StatRow>
							<StatLabel>Unified V8U</StatLabel>
							<StatValue>{healthData.versions.unifiedV8u}</StatValue>
						</StatRow>
					</StatusCard>

					{/* Node.js Info */}
					<StatusCard>
						<CardHeader>
							<CardIcon color="#68d391">
								<FiCpu />
							</CardIcon>
							<CardTitle>Node.js Runtime</CardTitle>
						</CardHeader>
						<StatRow>
							<StatLabel>Version</StatLabel>
							<StatValue>{healthData.node.version}</StatValue>
						</StatRow>
						<StatRow>
							<StatLabel>Platform</StatLabel>
							<StatValue>{healthData.node.platform}</StatValue>
						</StatRow>
						<StatRow>
							<StatLabel>Architecture</StatLabel>
							<StatValue>{healthData.node.arch}</StatValue>
						</StatRow>
					</StatusCard>

					{/* Memory Usage */}
					<StatusCard>
						<CardHeader>
							<CardIcon color="#f59e0b">
								<FiHardDrive />
							</CardIcon>
							<CardTitle>Memory Usage</CardTitle>
						</CardHeader>
						<StatRow>
							<StatLabel>RSS</StatLabel>
							<StatValue>{formatBytes(healthData.memory.rss)}</StatValue>
						</StatRow>
						<StatRow>
							<StatLabel>Heap Total</StatLabel>
							<StatValue>{formatBytes(healthData.memory.heapTotal)}</StatValue>
						</StatRow>
						<StatRow>
							<StatLabel>Heap Used</StatLabel>
							<StatValue>{formatBytes(healthData.memory.heapUsed)}</StatValue>
						</StatRow>
						<StatRow>
							<StatLabel>External</StatLabel>
							<StatValue>{formatBytes(healthData.memory.external)}</StatValue>
						</StatRow>
					</StatusCard>

					{/* System Memory */}
					<StatusCard>
						<CardHeader>
							<CardIcon color="#8b5cf6">
								<FiDatabase />
							</CardIcon>
							<CardTitle>System Memory</CardTitle>
						</CardHeader>
						<StatRow>
							<StatLabel>Total</StatLabel>
							<StatValue>{formatBytes(healthData.systemMemory.total)}</StatValue>
						</StatRow>
						<StatRow>
							<StatLabel>Used</StatLabel>
							<StatValue>{formatBytes(healthData.systemMemory.used)}</StatValue>
						</StatRow>
						<StatRow>
							<StatLabel>Free</StatLabel>
							<StatValue>{formatBytes(healthData.systemMemory.free)}</StatValue>
						</StatRow>
						<StatRow>
							<StatLabel>Usage</StatLabel>
							<StatValue>
								{((healthData.systemMemory.used / healthData.systemMemory.total) * 100).toFixed(1)}%
							</StatValue>
						</StatRow>
					</StatusCard>

					{/* CPU Usage */}
					<StatusCard>
						<CardHeader>
							<CardIcon color="#ef4444">
								<FiActivity />
							</CardIcon>
							<CardTitle>CPU Usage</CardTitle>
						</CardHeader>
						<StatRow>
							<StatLabel>1 Minute</StatLabel>
							<StatValue>{healthData.cpuUsage.avg1mPercent.toFixed(2)}%</StatValue>
						</StatRow>
						<StatRow>
							<StatLabel>5 Minutes</StatLabel>
							<StatValue>{healthData.cpuUsage.avg5mPercent.toFixed(2)}%</StatValue>
						</StatRow>
						<StatRow>
							<StatLabel>15 Minutes</StatLabel>
							<StatValue>{healthData.cpuUsage.avg15mPercent.toFixed(2)}%</StatValue>
						</StatRow>
						<StatRow>
							<StatLabel>Load Average</StatLabel>
							<StatValue>{healthData.loadAverage.map(l => l.toFixed(2)).join(', ')}</StatValue>
						</StatRow>
					</StatusCard>

					{/* Request Statistics */}
					<StatusCard>
						<CardHeader>
							<CardIcon color="#06b6d4">
								<FiGlobe />
							</CardIcon>
							<CardTitle>Request Statistics</CardTitle>
						</CardHeader>
						<StatRow>
							<StatLabel>Total Requests</StatLabel>
							<StatValue>{healthData.requestStats.totalRequests}</StatValue>
						</StatRow>
						<StatRow>
							<StatLabel>Active Connections</StatLabel>
							<StatValue>{healthData.requestStats.activeConnections}</StatValue>
						</StatRow>
						<StatRow>
							<StatLabel>Avg Response Time</StatLabel>
							<StatValue>{healthData.requestStats.avgResponseTime}ms</StatValue>
						</StatRow>
						<StatRow>
							<StatLabel>Error Rate</StatLabel>
							<StatValue>{(healthData.requestStats.errorRate * 100).toFixed(2)}%</StatValue>
						</StatRow>
					</StatusCard>
				</StatusGrid>
			)}
		</PageContainer>
	);
};

export default ApiStatusPage;
