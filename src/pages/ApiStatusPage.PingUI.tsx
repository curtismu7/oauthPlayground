import React, { useCallback, useEffect, useState, useRef } from 'react';

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

// MDI Icon component
const MDIIcon: React.FC<{
	icon: string;
	size?: number;
	className?: string;
	'aria-label'?: string;
	'aria-hidden'?: boolean;
	style?: React.CSSProperties;
}> = ({
	icon,
	size = 24,
	className = '',
	'aria-label': ariaLabel,
	'aria-hidden': ariaHidden,
	style,
}) => {
	return (
		<span
			className={`mdi mdi-${icon} ${className}`}
			style={{ fontSize: `${size}px`, ...style }}
			role="img"
			aria-label={ariaLabel}
			aria-hidden={ariaHidden}
		/>
	);
};

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
	// Ref to prevent infinite loops - circuit breaker pattern
	const isFetchingRef = useRef(false);
	const lastFetchTimeRef = useRef<number>(0);
	const consecutiveErrorsRef = useRef<number>(0);
	const circuitBreakerRef = useRef<boolean>(false);
	
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
			name: 'PingOne API Backend',
			port: 3001,
			protocol: 'HTTPS',
			status: 'checking',
			healthData: null,
			error: null,
			lastChecked: null,
		},
	]);
	const [loading, setLoading] = useState(true);
	const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
	const [errorCount, setErrorCount] = useState<number>(0);

	const checkServerHealth = useCallback(async (server: ServerStatus): Promise<ServerStatus> => {
		const updatedServer = { ...server, status: 'checking' as const };

		try {
			// Track the health check API call for display in API monitoring
			const { apiCallTrackerService } = await import('@/services/apiCallTrackerService');
			const callId = apiCallTrackerService.trackApiCall({
				method: 'GET',
				url: '/api/health',
				actualPingOneUrl: `https://api.pingdemo.com:${server.port}/api/health`,
				isProxy: server.port !== 3000, // Frontend server doesn't use proxy
				headers: {
					Accept: 'application/json',
				},
				body: null,
				step: 'api-status-monitoring',
				flowType: 'pingone-api-status',
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
					version: '9.12.0',
					versions: { app: '9.12.0', mfaV8: '9.12.0', unifiedV8u: '9.12.0' },
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
	}, []);

	const fetchHealthData = useCallback(async () => {
		// Circuit breaker: prevent infinite loops and rate limiting
		const now = Date.now();
		
		// Skip if circuit breaker is open (too many consecutive errors)
		if (circuitBreakerRef.current) {
			console.log('[ApiStatusPage] Circuit breaker OPEN - skipping fetch');
			return;
		}
		
		// Skip if already fetching or called too recently (rate limiting)
		if (isFetchingRef.current || (now - lastFetchTimeRef.current) < 2000) {
			console.log('[ApiStatusPage] Skipping fetch - already fetching or too soon');
			return;
		}

		isFetchingRef.current = true;
		lastFetchTimeRef.current = now;

		try {
			setLoading(true);
			console.log('[ApiStatusPage] Starting health data fetch...');

			// Check all servers in parallel
			const serverPromises = servers.map((server) => checkServerHealth(server));
			const updatedServers = await Promise.all(serverPromises);

			setServers(updatedServers);
			setLastRefresh(new Date());
			
			// Reset error counters on success
			consecutiveErrorsRef.current = 0;
			circuitBreakerRef.current = false;
			setErrorCount(0);
			
			console.log('[ApiStatusPage] Health data fetch completed successfully');
		} catch (err) {
			console.error('[ApiStatusPage] Failed to fetch server health data:', err);
			
			// Increment error counters
			consecutiveErrorsRef.current += 1;
			setErrorCount(prev => prev + 1);
			
			// Open circuit breaker after 3 consecutive errors
			if (consecutiveErrorsRef.current >= 3) {
				circuitBreakerRef.current = true;
				console.warn('[ApiStatusPage] Circuit breaker OPEN due to consecutive errors');
				
				// Auto-reset circuit breaker after 30 seconds
				setTimeout(() => {
					circuitBreakerRef.current = false;
					consecutiveErrorsRef.current = 0;
					console.log('[ApiStatusPage] Circuit breaker RESET - retrying allowed');
				}, 30000);
			}
		} finally {
			setLoading(false);
			isFetchingRef.current = false;
		}
	}, []); // Remove servers dependency to prevent infinite loop

	useEffect(() => {
		fetchHealthData();
		// biome-ignore lint/correctness/useExhaustiveDependencies: Only run once on mount
	}, []);

	// Auto-refresh every 30 seconds with loop prevention
	useEffect(() => {
		const interval = setInterval(() => {
			// Only refresh if not currently loading and not recently fetched
			if (!loading && !isFetchingRef.current) {
				fetchHealthData();
			}
		}, 30000); // 30 seconds

		return () => clearInterval(interval);
	}, [loading, fetchHealthData]);

	// Manual refresh function
	const handleManualRefresh = () => {
		console.log('[ApiStatusPage] Manual refresh triggered - resetting circuit breaker');
		// Reset the circuit breaker and error counters for manual refresh
		circuitBreakerRef.current = false;
		consecutiveErrorsRef.current = 0;
		lastFetchTimeRef.current = 0;
		setErrorCount(0);
		fetchHealthData();
	};

	// Style functions
	const getPageContainerStyle = () => ({
		maxWidth: '1200px',
		margin: '0 auto',
		padding: '2rem',
	});

	const getPageHeaderStyle = () => ({
		marginBottom: '2rem',
	});

	const getPageTitleStyle = () => ({
		fontSize: '2.5rem',
		fontWeight: '700' as const,
		color: 'var(--brand-text, #1f2937)',
		marginBottom: '0.5rem',
		display: 'flex' as const,
		alignItems: 'center' as const,
		gap: '0.75rem',
	});

	const getPageDescriptionStyle = () => ({
		color: 'var(--brand-text-secondary, #6b7280)',
		fontSize: '1.125rem',
		marginBottom: '1rem',
	});

	const getStatusGridStyle = () => ({
		display: 'grid' as const,
		gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
		gap: '1.5rem',
		marginBottom: '2rem',
	});

	const getStatusCardStyle = () => ({
		background: 'var(--brand-surface, white)',
		borderRadius: 'var(--brand-radius-lg, 0.75rem)',
		padding: '1.5rem',
		boxShadow: 'var(--brand-shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.1))',
		border: '1px solid var(--brand-border, #e5e7eb)',
		transition: 'all 0.15s ease-in-out',
	});

	const getCardHeaderStyle = () => ({
		display: 'flex' as const,
		alignItems: 'center' as const,
		gap: '0.75rem',
		marginBottom: '1rem',
	});

	const getCardTitleStyle = () => ({
		fontSize: '1.125rem',
		fontWeight: '600' as const,
		color: 'var(--brand-text, #1f2937)',
		margin: 0,
	});

	const getCardIconStyle = (color: string) => ({
		color: color,
		fontSize: '1.25rem',
	});

	const getStatRowStyle = () => ({
		display: 'flex' as const,
		justifyContent: 'space-between' as const,
		alignItems: 'center' as const,
		padding: '0.5rem 0',
		borderBottom: '1px solid var(--brand-border-light, #f3f4f6)',
	});

	const getStatLabelStyle = () => ({
		color: 'var(--brand-text-secondary, #6b7280)',
		fontSize: '0.875rem',
	});

	const getStatValueStyle = () => ({
		fontWeight: '500' as const,
		color: 'var(--brand-text, #1f2937)',
		fontSize: '0.875rem',
	});

	const getStatusBadgeStyle = (status: 'online' | 'offline' | 'warning' | 'checking') => {
		let backgroundColor: string;
		switch (status) {
			case 'online':
				backgroundColor = 'var(--brand-success, #10b981)';
				break;
			case 'offline':
				backgroundColor = 'var(--brand-error, #ef4444)';
				break;
			case 'warning':
				backgroundColor = 'var(--brand-warning, #f59e0b)';
				break;
			case 'checking':
				backgroundColor = 'var(--brand-warning, #f59e0b)';
				break;
			default:
				backgroundColor = 'var(--brand-text-secondary, #6b7280)';
		}

		return {
			background: backgroundColor,
			color: 'white',
			padding: '0.25rem 0.75rem',
			borderRadius: '9999px',
			fontSize: '0.75rem',
			fontWeight: '500' as const,
		};
	};

	const getRefreshButtonStyle = () => ({
		display: 'flex' as const,
		alignItems: 'center' as const,
		gap: '0.5rem',
		padding: '0.75rem 1.5rem',
		background: 'var(--brand-primary, #3b82f6)',
		color: 'white',
		border: 'none',
		borderRadius: 'var(--brand-radius-md, 0.5rem)',
		fontWeight: '500' as const,
		cursor: 'pointer' as const,
		transition: 'all 0.15s ease-in-out',
	});

	const getErrorStyle = () => ({
		marginBottom: '1rem',
		padding: '0.5rem',
		backgroundColor: 'var(--brand-error-light, #fef2f2)',
		border: '1px solid var(--brand-error-border, #fecaca)',
		borderRadius: 'var(--brand-radius-sm, 0.25rem)',
		color: 'var(--brand-error-dark, #991b1b)',
		fontSize: '0.875rem',
	});

	if (loading && servers.every((s) => s.status === 'checking')) {
		return (
			<div className="end-user-nano">
				<div style={getPageContainerStyle()}>
					<div style={getPageHeaderStyle()}>
						<h1 style={getPageTitleStyle()}>
							<MDIIcon icon="server" size={28} aria-hidden={true} />
							PingOne API Status
						</h1>
						<p style={getPageDescriptionStyle()}>
							Loading PingOne API server health information...
						</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="end-user-nano">
			<div style={getPageContainerStyle()}>
				<div style={getPageHeaderStyle()}>
					<h1 style={getPageTitleStyle()}>
						<MDIIcon icon="server" size={28} aria-hidden={true} />
						PingOne API Status
					</h1>
					<p style={getPageDescriptionStyle()}>
						PingOne API server health monitoring and status information
						{lastRefresh && (
							<span
								style={{
									marginLeft: '1rem',
									color: 'var(--brand-text-muted, #9ca3af)',
									fontSize: '0.875rem',
								}}
							>
								Last updated: {lastRefresh.toLocaleTimeString()}
							</span>
						)}
					</p>
					<button
						type="button"
						style={getRefreshButtonStyle()}
						onClick={handleManualRefresh}
						disabled={loading}
						onMouseEnter={(e) => {
							if (!loading) {
								e.currentTarget.style.background = 'var(--brand-primary-dark, #2563eb)';
							}
						}}
						onMouseLeave={(e) => {
							if (!loading) {
								e.currentTarget.style.background = 'var(--brand-primary, #3b82f6)';
							}
						}}
					>
						<MDIIcon
							icon="refresh"
							size={16}
							aria-hidden={true}
							style={{
								animation: loading ? 'spin 1s linear infinite' : 'none',
							}}
						/>
						{loading ? 'Refreshing...' : 'Refresh'}
					</button>
				</div>

				<div style={getStatusGridStyle()}>
					{servers.map((server) => (
						<div key={server.name} style={getStatusCardStyle()}>
							<div style={getCardHeaderStyle()}>
								<div
									style={getCardIconStyle(
										server.status === 'online'
											? 'var(--brand-success, #10b981)'
											: server.status === 'offline'
												? 'var(--brand-error, #ef4444)'
												: 'var(--brand-warning, #f59e0b)'
									)}
								>
									<MDIIcon icon="server" size={20} aria-hidden={true} />
								</div>
								<h3 style={getCardTitleStyle()}>{server.name}</h3>
								<span style={getStatusBadgeStyle(server.status)}>
									{server.status === 'online'
										? 'Online'
										: server.status === 'offline'
											? 'Offline'
											: 'Checking'}
								</span>
							</div>

							{server.error && <div style={getErrorStyle()}>{server.error}</div>}

							{server.healthData && (
								<>
									<div style={getStatRowStyle()}>
										<span style={getStatLabelStyle()}>Port</span>
										<span style={getStatValueStyle()}>
											{server.port} ({server.protocol})
										</span>
									</div>
									<div style={getStatRowStyle()}>
										<span style={getStatLabelStyle()}>Status</span>
										<span style={getStatValueStyle()}>{server.healthData.status}</span>
									</div>
									<div style={getStatRowStyle()}>
										<span style={getStatLabelStyle()}>Version</span>
										<span style={getStatValueStyle()}>{server.healthData.version}</span>
									</div>
									<div style={getStatRowStyle()}>
										<span style={getStatLabelStyle()}>Environment</span>
										<span style={getStatValueStyle()}>{server.healthData.environment}</span>
									</div>
									{server.healthData.pid > 0 && (
										<div style={getStatRowStyle()}>
											<span style={getStatLabelStyle()}>Process ID</span>
											<span style={getStatValueStyle()}>{server.healthData.pid}</span>
										</div>
									)}
									{server.healthData.uptimeSeconds > 0 && (
										<div style={getStatRowStyle()}>
											<span style={getStatLabelStyle()}>Uptime</span>
											<span style={getStatValueStyle()}>
												{formatUptime(server.healthData.uptimeSeconds)}
											</span>
										</div>
									)}
									{server.lastChecked && (
										<div style={getStatRowStyle()}>
											<span style={getStatLabelStyle()}>Last Checked</span>
											<span style={getStatValueStyle()}>
												{server.lastChecked.toLocaleTimeString()}
											</span>
										</div>
									)}

									{/* Show additional details for backend servers */}
									{server.port !== 3000 && (
										<>
											<div style={getStatRowStyle()}>
												<span style={getStatLabelStyle()}>Node Version</span>
												<span style={getStatValueStyle()}>{server.healthData.node.version}</span>
											</div>
											<div style={getStatRowStyle()}>
												<span style={getStatLabelStyle()}>Memory Usage</span>
												<span style={getStatValueStyle()}>
													{formatBytes(server.healthData.memory.heapUsed)} /{' '}
													{formatBytes(server.healthData.memory.heapTotal)}
												</span>
											</div>
											<div style={getStatRowStyle()}>
												<span style={getStatLabelStyle()}>CPU Usage</span>
												<span style={getStatValueStyle()}>
													{server.healthData.cpuUsage.avg1mPercent.toFixed(1)}%
												</span>
											</div>
											<div style={getStatRowStyle()}>
												<span style={getStatLabelStyle()}>Requests</span>
												<span style={getStatValueStyle()}>
													{server.healthData.requestStats.totalRequests} (
													{server.healthData.requestStats.errorRate > 0
														? `${(server.healthData.requestStats.errorRate * 100).toFixed(1)}% errors`
														: 'no errors'}
													)
												</span>
											</div>
										</>
									)}
								</>
							)}
						</div>
					))}
				</div>

				{/* PingOne API Information Section */}
				<div style={getStatusCardStyle()}>
					<div style={getCardHeaderStyle()}>
						<div style={getCardIconStyle('var(--brand-primary, #3b82f6)')}>
							<MDIIcon icon="api" size={20} aria-hidden={true} />
						</div>
						<h3 style={getCardTitleStyle()}>PingOne API Configuration</h3>
					</div>
					<div style={getStatRowStyle()}>
						<span style={getStatLabelStyle()}>API Domain</span>
						<span style={getStatValueStyle()}>api.pingdemo.com</span>
					</div>
					<div style={getStatRowStyle()}>
						<span style={getStatLabelStyle()}>Environment ID</span>
						<span style={getStatValueStyle()}>b9817c16-9910-4415-b67e-4ac687da74d9</span>
					</div>
					<div style={getStatRowStyle()}>
						<span style={getStatLabelStyle()}>API Version</span>
						<span style={getStatValueStyle()}>v1</span>
					</div>
					<div style={getStatRowStyle()}>
						<span style={getStatLabelStyle()}>Region</span>
						<span style={getStatValueStyle()}>North America</span>
					</div>
					<div style={getStatRowStyle()}>
						<span style={getStatLabelStyle()}>Authentication</span>
						<span style={getStatValueStyle()}>OAuth 2.0 & OIDC</span>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ApiStatusPage;
