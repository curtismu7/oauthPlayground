import { useCallback, useEffect, useState } from 'react';
import { FiActivity, FiCheckCircle, FiGlobe, FiKey, FiRefreshCw, FiServer } from 'react-icons/fi';
import styled from 'styled-components';
import { useAuth } from '../contexts/NewAuthContext';
import { getRecentActivity } from '../utils/activityTracker';
import type { ActivityItem } from '../utils/activityTracker';
import { checkSavedCredentials } from '../utils/configurationStatus';
import { getAllFlowCredentialStatuses } from '../utils/flowCredentialChecker';
import { v4ToastManager } from '../utils/v4ToastMessages';
import { FLOW_CONFIGS, FlowHeader } from '../services/flowHeaderService';

const DashboardContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem;
  background: #f8f9fa;
  min-height: 100vh;
`;

const Header = styled.div`
  background: #ffffff;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  
  h1 {
    font-size: 2rem;
    font-weight: 700;
    background: linear-gradient(135deg, #667eea, #764ba2);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 0.25rem;
  }
  
  p {
    color: #666;
    font-size: 1rem;
  }
`;

const ContentCard = styled.div`
  background: #ffffff;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  margin-bottom: 1rem;
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const CardTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  margin: 0;
`;

const StatusBadge = styled.span<{ $status: 'active' | 'pending' | 'error' }>`
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  
  ${({ $status }) => {
		switch ($status) {
			case 'active':
				return 'background: rgba(67, 233, 123, 0.1); color: #43e97b;';
			case 'pending':
				return 'background: rgba(255, 193, 7, 0.1); color: #ffc107;';
			case 'error':
				return 'background: rgba(245, 87, 108, 0.1); color: #f5576c;';
			default:
				return 'background: rgba(67, 233, 123, 0.1); color: #43e97b;';
		}
	}}
`;

const RefreshButton = styled.button`
  background: #f8f9fa;
  color: #667eea;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    background: #e9ecef;
    border-color: #667eea;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Dashboard = () => {
	const { tokens: authTokens } = useAuth();
	const [flowCredentialStatuses, setFlowCredentialStatuses] = useState(
		getAllFlowCredentialStatuses()
	);
	const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [serverStatus, setServerStatus] = useState({
		frontend: 'checking' as 'online' | 'offline' | 'checking',
		backend: 'checking' as 'online' | 'offline' | 'checking',
	});

	// Check server status
	const checkServerStatus = useCallback(async () => {
		try {
			const backendResponse = await fetch('/api/health', {
				method: 'GET',
				mode: 'cors',
				signal: AbortSignal.timeout(3000),
			});

			setServerStatus((prev) => ({
				...prev,
				backend: backendResponse.ok ? 'online' : 'offline',
				frontend: 'online',
			}));
		} catch (_error) {
			setServerStatus((prev) => ({
				...prev,
				backend: 'offline',
				frontend: 'online',
			}));
		}
	}, []);

	// Check server status on mount
	useEffect(() => {
		checkServerStatus();
	}, [checkServerStatus]);

	const hasSavedCredentials = checkSavedCredentials();

	// Load initial dashboard data
	useEffect(() => {
		const loadDashboardData = async () => {
			try {
				let activity = getRecentActivity();

				if (activity.length === 0) {
					const sampleActivities = [
						{
							id: 'sample_1',
							action: 'Completed Authorization Code Flow',
							flowType: 'authorization-code',
							timestamp: Date.now() - 300000,
							success: true,
							details: 'Successfully obtained access token',
						},
						{
							id: 'sample_2',
							action: 'Updated PingOne Credentials',
							flowType: 'configuration',
							timestamp: Date.now() - 600000,
							success: true,
							details: 'Environment ID configured',
						},
					];

					localStorage.setItem(
						'pingone_playground_recent_activity',
						JSON.stringify(sampleActivities)
					);
					activity = sampleActivities;
				}

				setRecentActivity(activity);
			} catch (_error) {
				// Handle error silently
			}
		};

		loadDashboardData();
	}, [authTokens]);

	// Refresh dashboard data
	const refreshDashboard = async () => {
		setIsRefreshing(true);
		try {
			const activity = getRecentActivity();
			setRecentActivity(activity);
			setFlowCredentialStatuses(getAllFlowCredentialStatuses());
			await checkServerStatus();
		} catch (_error) {
			// Handle error silently
		} finally {
			setIsRefreshing(false);
		}
	};

	const handleRefresh = async () => {
		try {
			await refreshDashboard();
			v4ToastManager.showSuccess('saveConfigurationSuccess');
		} catch (_error) {
			v4ToastManager.showError('networkError');
		}
	};

	// Helper function to get status for a specific flow
	const getFlowStatus = (flowType: string) => {
		const status = flowCredentialStatuses.find((flowStatus) => flowStatus.flowType === flowType);
		return status || { status: 'pending', message: 'Status not available' };
	};

	const apiEndpoints = [
		{ method: 'GET', path: '/api/health', desc: 'Health check for backend status' },
		{ method: 'GET', path: '/api/env-config', desc: 'Retrieve environment defaults' },
		{
			method: 'POST',
			path: '/api/token-exchange',
			desc: 'Exchange authorization codes for tokens',
		},
		{ method: 'POST', path: '/api/client-credentials', desc: 'Client credentials grant flow' },
		{ method: 'POST', path: '/api/introspect-token', desc: 'Introspect tokens via PingOne' },
		{ method: 'GET', path: '/api/userinfo', desc: 'Retrieve user information' },
		{ method: 'POST', path: '/api/validate-token', desc: 'Validate access tokens' },
		{ method: 'POST', path: '/api/device-authorization', desc: 'Device authorization flow' },
		{ method: 'POST', path: '/api/par', desc: 'Pushed Authorization Request' },
		{ method: 'GET', path: '/api/jwks', desc: 'Fetch PingOne JWKS' },
		{ method: 'POST', path: '/api/user-jwks', desc: 'Generate JWKS from user key' },
	];

	const formatActivityAction = (action?: string) => {
		if (!action) {
			return 'Activity';
		}
		return action.replace(/Successfully\s+Implcit\s+Flow\s+Token/gi, 'Successfully Obtained Implicit Flow Token');
	};

	return (
		<DashboardContainer>
			{/* Header */}
			<FlowHeader flowType="dashboard" />

			{/* System Status */}
			<ContentCard>
				<CardHeader>
					<CardTitle>System Status</CardTitle>
					<div style={{ display: 'flex', gap: '0.5rem' }}>
						<RefreshButton onClick={handleRefresh} disabled={isRefreshing}>
							<FiRefreshCw
								size={16}
								style={{
									animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
								}}
							/>
							Refresh
						</RefreshButton>
					</div>
				</CardHeader>

				<div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
					<StatusBadge
						$status={hasSavedCredentials ? 'active' : 'error'}
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '0.5rem',
							padding: '0.75rem 1rem',
							fontSize: '0.9rem',
						}}
					>
						<FiCheckCircle />
						{hasSavedCredentials ? 'Global Configuration Ready' : 'Configuration Missing'}
					</StatusBadge>
				</div>

				{/* Server Status Details */}
				<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
					<div
						style={{
							padding: '1rem',
							background: '#f8fafc',
							borderRadius: '0.5rem',
							border: '1px solid #e2e8f0',
						}}
					>
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '0.5rem',
								marginBottom: '0.75rem',
							}}
						>
							<StatusBadge
								$status={
									serverStatus.frontend === 'online'
										? 'active'
										: serverStatus.frontend === 'checking'
											? 'pending'
											: 'error'
								}
							>
								{serverStatus.frontend === 'online'
									? 'Online'
									: serverStatus.frontend === 'checking'
										? 'Checking...'
										: 'Offline'}
							</StatusBadge>
							<div style={{ fontWeight: '600', color: '#333' }}>Frontend Server</div>
						</div>
						<div style={{ fontSize: '0.875rem', color: '#666' }}>
							<FiGlobe style={{ marginRight: '0.25rem' }} />
							<strong>URL:</strong> https://localhost:3000
						</div>
					</div>

					<div
						style={{
							padding: '1rem',
							background: '#f8fafc',
							borderRadius: '0.5rem',
							border: '1px solid #e2e8f0',
						}}
					>
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '0.5rem',
								marginBottom: '0.75rem',
							}}
						>
							<StatusBadge
								$status={
									serverStatus.backend === 'online'
										? 'active'
										: serverStatus.backend === 'checking'
											? 'pending'
											: 'error'
								}
							>
								{serverStatus.backend === 'online'
									? 'Online'
									: serverStatus.backend === 'checking'
										? 'Checking...'
										: 'Offline'}
							</StatusBadge>
							<div style={{ fontWeight: '600', color: '#333' }}>Backend API</div>
						</div>
						<div style={{ fontSize: '0.875rem', color: '#666' }}>
							<FiKey style={{ marginRight: '0.25rem' }} />
							<strong>URL:</strong> https://localhost:3001
						</div>
					</div>
				</div>
			</ContentCard>

			{/* Flow Credential Status */}
			<ContentCard>
				<CardHeader>
					<CardTitle>V5 Flow Credential Status</CardTitle>
				</CardHeader>

				<div
					style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
						gap: '1rem',
					}}
				>
					{/* OAuth 2.0 V5 Flows */}
					<div>
						<h3
							style={{
								fontSize: '1rem',
								fontWeight: '600',
								marginBottom: '1rem',
								color: '#dc2626',
							}}
						>
							OAuth 2.0 V5 Flows
						</h3>
						<div style={{ space: '0.5rem' }}>
							{Object.entries(FLOW_CONFIGS)
								.filter(([, config]) => config.flowType === 'oauth')
								.map(([flowId, config]) => ({ id: flowId, name: config.title }))
								.map((flow) => {
									const status = getFlowStatus(flow.id);
									return (
										<div
											key={flow.id}
											style={{
												display: 'flex',
												justifyContent: 'space-between',
												alignItems: 'center',
												padding: '0.5rem',
												marginBottom: '0.5rem',
												backgroundColor: '#fef2f2',
												borderRadius: '0.375rem',
												border: '1px solid #fecaca',
											}}
										>
											<span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{flow.name}</span>
											<StatusBadge $status={status?.hasCredentials ? 'active' : 'error'}>
												{status?.hasCredentials ? 'Configured' : 'Missing'}
											</StatusBadge>
										</div>
									);
								})}
						</div>
					</div>

					{/* OIDC V5 Flows */}
					<div>
						<h3
							style={{
								fontSize: '1rem',
								fontWeight: '600',
								marginBottom: '1rem',
								color: '#059669',
							}}
						>
							OIDC V5 Flows
						</h3>
						<div style={{ space: '0.5rem' }}>
							{Object.entries(FLOW_CONFIGS)
								.filter(([, config]) => config.flowType === 'oidc')
								.map(([flowId, config]) => ({ id: flowId, name: config.title }))
								.map((flow) => {
									const status = getFlowStatus(flow.id);
									return (
										<div
											key={flow.id}
											style={{
												display: 'flex',
												justifyContent: 'space-between',
												alignItems: 'center',
												padding: '0.5rem',
												marginBottom: '0.5rem',
												backgroundColor: '#f0fdf4',
												borderRadius: '0.375rem',
												border: '1px solid #bbf7d0',
											}}
										>
											<span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{flow.name}</span>
											<StatusBadge $status={status?.hasCredentials ? 'active' : 'error'}>
												{status?.hasCredentials ? 'Configured' : 'Missing'}
											</StatusBadge>
										</div>
									);
								})}
						</div>
					</div>
				</div>
			</ContentCard>

			{/* API Endpoints */}
			<ContentCard>
				<CardHeader>
					<CardTitle>Available API Endpoints</CardTitle>
				</CardHeader>

				<div
					style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
						gap: '1rem',
					}}
				>
					{apiEndpoints.map((endpoint, index) => (
						<div
							key={index}
							style={{
								padding: '1rem',
								backgroundColor: '#f8fafc',
								borderRadius: '0.5rem',
								border: '1px solid #e2e8f0',
							}}
						>
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '0.5rem',
									marginBottom: '0.5rem',
								}}
							>
								<span
									style={{
										padding: '0.25rem 0.5rem',
										backgroundColor: endpoint.method === 'GET' ? '#dbeafe' : '#dcfce7',
										color: endpoint.method === 'GET' ? '#1e40af' : '#166534',
										borderRadius: '0.25rem',
										fontSize: '0.75rem',
										fontWeight: '600',
									}}
								>
									{endpoint.method}
								</span>
								<code style={{ fontSize: '0.875rem', fontWeight: '500' }}>{endpoint.path}</code>
							</div>
							<p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>{endpoint.desc}</p>
						</div>
					))}
				</div>
			</ContentCard>

			{/* Quick Access Flows */}
			<ContentCard>
				<CardHeader>
					<CardTitle>Quick Access Flows</CardTitle>
				</CardHeader>

				<div style={{ marginBottom: '1rem' }}>
					<p style={{ color: '#666', fontSize: '0.95rem' }}>
						Explore OAuth 2.0 and OpenID Connect flows. Defaults are secure-by-default (Auth Code
						with PKCE).
					</p>
				</div>

				<div
					style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
						gap: '1rem',
					}}
				>
					<div
						style={{
							background: 'white',
							borderRadius: '8px',
							boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
							padding: '1.25rem',
							display: 'flex',
							flexDirection: 'column',
							gap: '0.75rem',
							border: '1px solid #e5e7eb',
						}}
					>
						<h3 style={{ fontSize: '1.2rem', margin: 0, color: '#333' }}>OAuth 2.0</h3>
						<p style={{ color: '#666', fontSize: '0.9rem', margin: 0 }}>
							Standards-based authorization flows. Recommended: Authorization Code (with PKCE for
							public clients).
						</p>
						<div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
							<a
								href="/flows/oauth-authorization-code-v5"
								style={{
									display: 'inline-block',
									padding: '0.5rem 0.75rem',
									borderRadius: '6px',
									background: '#3b82f6',
									color: 'white',
									fontWeight: '600',
									border: '1px solid #2563eb',
									textDecoration: 'none',
									fontSize: '0.875rem',
								}}
							>
								Authorization Code V5
							</a>

							<a
								href="/flows/client-credentials-v5"
								style={{
									display: 'inline-block',
									padding: '0.5rem 0.75rem',
									borderRadius: '6px',
									background: '#f3f4f6',
									color: '#374151',
									fontWeight: '600',
									border: '1px solid #d1d5db',
									textDecoration: 'none',
									fontSize: '0.875rem',
								}}
							>
								Client Credentials V5
							</a>

							<a
								href="/flows/device-authorization-v5"
								style={{
									display: 'inline-block',
									padding: '0.5rem 0.75rem',
									borderRadius: '6px',
									background: '#f3f4f6',
									color: '#374151',
									fontWeight: '600',
									border: '1px solid #d1d5db',
									textDecoration: 'none',
									fontSize: '0.875rem',
								}}
							>
								Device Code V5
							</a>

							<a
								href="/flows/oauth-implicit-v5"
								style={{
									display: 'inline-block',
									padding: '0.5rem 0.75rem',
									borderRadius: '6px',
									background: '#f3f4f6',
									color: '#374151',
									fontWeight: '600',
									border: '1px solid #d1d5db',
									textDecoration: 'none',
									fontSize: '0.875rem',
								}}
							>
								Implicit V5 (legacy)
							</a>
						</div>
					</div>

					<div
						style={{
							background: 'white',
							borderRadius: '8px',
							boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
							padding: '1.25rem',
							display: 'flex',
							flexDirection: 'column',
							gap: '0.75rem',
							border: '1px solid #e5e7eb',
						}}
					>
						<h3 style={{ fontSize: '1.2rem', margin: 0, color: '#333' }}>OpenID Connect</h3>
						<p style={{ color: '#666', fontSize: '0.9rem', margin: 0 }}>
							Identity layer on top of OAuth 2.0.
						</p>
						<div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
							<a
								href="/flows/oidc-authorization-code-v5"
								style={{
									display: 'inline-block',
									padding: '0.5rem 0.75rem',
									borderRadius: '6px',
									background: '#10b981',
									color: 'white',
									fontWeight: '600',
									border: '1px solid #059669',
									textDecoration: 'none',
									fontSize: '0.875rem',
								}}
							>
								OIDC Authorization Code V5
							</a>

							<a
								href="/flows/oidc-implicit-v5"
								style={{
									display: 'inline-block',
									padding: '0.5rem 0.75rem',
									borderRadius: '6px',
									background: '#f3f4f6',
									color: '#374151',
									fontWeight: '600',
									border: '1px solid #d1d5db',
									textDecoration: 'none',
									fontSize: '0.875rem',
								}}
							>
								OIDC Implicit V5
							</a>

							<a
								href="/flows/ciba-v5"
								style={{
									display: 'inline-block',
									padding: '0.5rem 0.75rem',
									borderRadius: '6px',
									background: '#f3f4f6',
									color: '#374151',
									fontWeight: '600',
									border: '1px solid #d1d5db',
									textDecoration: 'none',
									fontSize: '0.875rem',
								}}
							>
								CIBA Flow V5
							</a>
						</div>
					</div>

					<div
						style={{
							background: 'white',
							borderRadius: '8px',
							boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
							padding: '1.25rem',
							display: 'flex',
							flexDirection: 'column',
							gap: '0.75rem',
							border: '1px solid #e5e7eb',
						}}
					>
						<h3 style={{ fontSize: '1.2rem', margin: 0, color: '#333' }}>PingOne Flows</h3>
						<p style={{ color: '#666', fontSize: '0.9rem', margin: 0 }}>
							PingOne-specific authentication and authorization flows.
						</p>
						<div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
							<a
								href="/flows/worker-token-v5"
								style={{
									display: 'inline-block',
									padding: '0.5rem 0.75rem',
									borderRadius: '6px',
									background: '#f97316',
									color: 'white',
									fontWeight: '600',
									border: '1px solid #ea580c',
									textDecoration: 'none',
									fontSize: '0.875rem',
								}}
							>
								Worker Token V5
							</a>

							<a
								href="/flows/pingone-par-v5"
								style={{
									display: 'inline-block',
									padding: '0.5rem 0.75rem',
									borderRadius: '6px',
									background: '#f3f4f6',
									color: '#374151',
									fontWeight: '600',
									border: '1px solid #d1d5db',
									textDecoration: 'none',
									fontSize: '0.875rem',
								}}
							>
								PingOne PAR V5
							</a>

							<a
								href="/flows/redirectless-flow-v5"
								style={{
									display: 'inline-block',
									padding: '0.5rem 0.75rem',
									borderRadius: '6px',
									background: '#f3f4f6',
									color: '#374151',
									fontWeight: '600',
									border: '1px solid #d1d5db',
									textDecoration: 'none',
									fontSize: '0.875rem',
								}}
							>
								Redirectless Flow V5
							</a>
						</div>
					</div>
				</div>
			</ContentCard>

			{/* Recent Activity */}
			<ContentCard>
				<CardHeader>
					<div>
						<CardTitle>Recent Activity</CardTitle>
						<p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>
							Latest OAuth flow runs, credential updates, and API interactions performed in this playground.
						</p>
					</div>
				</CardHeader>

				<div style={{ maxHeight: '400px', overflowY: 'auto' }}>
					<ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
						{recentActivity.length === 0 ? (
							<li style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
								<FiActivity size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
								<p>No recent activity</p>
								<p style={{ fontSize: '0.875rem' }}>Complete an OAuth flow to see activity here</p>
							</li>
						) : (
							recentActivity.slice(0, 10).map((activity, index) => (
								<li
									key={activity.id || index}
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: '1rem',
										padding: '1rem',
										borderBottom: index < recentActivity.length - 1 ? '1px solid #e5e7eb' : 'none',
									}}
								>
									<div
										style={{
											width: '40px',
											height: '40px',
											borderRadius: '50%',
											backgroundColor: activity.success ? '#dcfce7' : '#fee2e2',
											color: activity.success ? '#166534' : '#dc2626',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											fontSize: '1.2rem',
										}}
									>
										{activity.success ? '✓' : '✗'}
									</div>
									<div style={{ flex: 1 }}>
										<div style={{ fontWeight: '500', color: '#333', marginBottom: '0.25rem' }}>
											{formatActivityAction(activity.action)}
										</div>
										<div style={{ fontSize: '0.875rem', color: '#666' }}>
											{new Date(activity.timestamp).toLocaleString()}
										</div>
									</div>
								</li>
							))
						)}
					</ul>
				</div>
			</ContentCard>
	</DashboardContainer>
);
};

export default Dashboard;
