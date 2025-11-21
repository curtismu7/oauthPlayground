import { useCallback, useEffect, useState } from 'react';
import {
	FiActivity,
	FiCheckCircle,
	FiGlobe,
	FiKey,
	FiLink,
	FiRefreshCw,
	FiServer,
	FiZap,
} from 'react-icons/fi';
import styled from 'styled-components';
import { CollapsibleHeader } from '../services/collapsibleHeaderService';
import { type ActivityItem, getRecentActivity } from '../utils/activityTracker';
import { checkSavedCredentials } from '../utils/configurationStatus';
import { v4ToastManager } from '../utils/v4ToastMessages';

// Content card for sections (matches Unified flow standard)
const ContentCard = styled.div`
  padding: 24px;
`;

const ServerStatusGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ServerCard = styled.div`
  padding: 1rem;
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const ApiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
`;

const ApiEndpointCard = styled.div`
  padding: 1rem;
  background-color: #ffffff;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;

  &:hover {
    border-color: #3b82f6;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
  }
`;

const MethodBadge = styled.span<{ $method: string }>`
  padding: 0.25rem 0.5rem;
  background-color: ${(props) => (props.$method === 'GET' ? '#dbeafe' : '#dcfce7')};
  color: ${(props) => (props.$method === 'GET' ? '#1e40af' : '#166534')};
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
`;

const QuickAccessGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
`;

const FlowCard = styled.div`
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }

  h3 {
    font-size: 1.2rem;
    margin: 0;
    color: #1f2937;
    font-weight: 600;
  }

  p {
    color: #6b7280;
    font-size: 0.9rem;
    margin: 0;
    line-height: 1.5;
  }
`;

const FlowButtonsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: stretch;
  width: 100%;
  
  /* Ensure buttons have enough space */
  & > a {
    flex: 1;
    min-width: 140px;
    max-width: 200px;
  }
`;

type FlowPalette = 'oauth' | 'oidc' | 'pingone';

const FLOW_BUTTON_THEMES: Record<
	FlowPalette,
	{
		primary: {
			bg: string;
			border: string;
			color: string;
			hoverBg: string;
			hoverBorder: string;
			hoverColor: string;
			shadow: string;
			hoverShadow: string;
		};
		secondary: {
			bg: string;
			border: string;
			color: string;
			hoverBg: string;
			hoverBorder: string;
			hoverColor: string;
			shadow: string;
			hoverShadow: string;
		};
	}
> = {
	oauth: {
		primary: {
			bg: '#047857',
			border: '#065f46',
			color: '#ffffff',
			hoverBg: '#065f46',
			hoverBorder: '#047857',
			hoverColor: '#ffffff',
			shadow: '0 2px 4px rgba(4, 120, 87, 0.25)',
			hoverShadow: '0 4px 10px rgba(4, 120, 87, 0.35)',
		},
		secondary: {
			bg: '#10b981',
			border: '#059669',
			color: '#ffffff',
			hoverBg: '#059669',
			hoverBorder: '#047857',
			hoverColor: '#ffffff',
			shadow: '0 2px 4px rgba(16, 185, 129, 0.2)',
			hoverShadow: '0 4px 8px rgba(16, 185, 129, 0.3)',
		},
	},
	oidc: {
		primary: {
			bg: '#5b21b6',
			border: '#4c1d95',
			color: '#ffffff',
			hoverBg: '#4c1d95',
			hoverBorder: '#3b1680',
			hoverColor: '#ffffff',
			shadow: '0 2px 4px rgba(91, 33, 182, 0.25)',
			hoverShadow: '0 4px 10px rgba(91, 33, 182, 0.35)',
		},
		secondary: {
			bg: '#7c3aed',
			border: '#6d28d9',
			color: '#ffffff',
			hoverBg: '#6d28d9',
			hoverBorder: '#5b21b6',
			hoverColor: '#ffffff',
			shadow: '0 2px 4px rgba(124, 58, 237, 0.2)',
			hoverShadow: '0 4px 8px rgba(124, 58, 237, 0.3)',
		},
	},
	pingone: {
		primary: {
			bg: '#c2410c',
			border: '#9a3412',
			color: '#ffffff',
			hoverBg: '#9a3412',
			hoverBorder: '#7c2d12',
			hoverColor: '#ffffff',
			shadow: '0 2px 4px rgba(194, 65, 12, 0.25)',
			hoverShadow: '0 4px 10px rgba(194, 65, 12, 0.35)',
		},
		secondary: {
			bg: '#f97316',
			border: '#ea580c',
			color: '#ffffff',
			hoverBg: '#ea580c',
			hoverBorder: '#c2410c',
			hoverColor: '#ffffff',
			shadow: '0 2px 4px rgba(249, 115, 22, 0.2)',
			hoverShadow: '0 4px 8px rgba(249, 115, 22, 0.3)',
		},
	},
};

const FlowLink = styled.a<{ $variant?: 'primary' | 'secondary'; $palette?: FlowPalette }>`
  display: inline-block;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-weight: 600;
  text-decoration: none;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  text-align: center;
  min-height: 2.5rem;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;

  ${({ $variant = 'secondary', $palette = 'oauth' }) => {
		const palette = FLOW_BUTTON_THEMES[$palette];
		const theme = palette[$variant];
		return `
      background: ${theme.bg};
      color: white !important;
      border: 2px solid ${theme.border};
      box-shadow: ${theme.shadow};

      &:hover {
        background: ${theme.hoverBg};
        border-color: ${theme.hoverBorder};
        color: white !important;
        box-shadow: ${theme.hoverShadow};
        transform: translateY(-1px);
      }
    `;
	}}
`;

const ActivityList = styled.div`
  max-height: 400px;
  overflow-y: auto;

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
`;

const ActivityListItem = styled.li<{ $isLast?: boolean }>`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-bottom: ${(props) => (props.$isLast ? 'none' : '1px solid #e5e7eb')};
`;

const ActivityIcon = styled.div<{ $success: boolean }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: ${(props) => (props.$success ? '#dcfce7' : '#fee2e2')};
  color: ${(props) => (props.$success ? '#166534' : '#dc2626')};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
`;

const ActivityContent = styled.div`
  flex: 1;
`;

const ActivityAction = styled.div`
  font-weight: 500;
  color: #333;
  margin-bottom: 0.25rem;
`;

const ActivityTime = styled.div`
  font-size: 0.875rem;
  color: #666;
`;

const EmptyState = styled.li`
  text-align: center;
  padding: 2rem;
  color: #6b7280;

  svg {
    margin-bottom: 1rem;
    opacity: 0.5;
  }

  p {
    margin: 0.5rem 0;
  }
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #3b82f6;
  background: #ffffff;
  border: 1px solid #3b82f6;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: #eff6ff;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    transition: transform 0.3s ease;
  }
`;

const Dashboard = () => {
	const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [serverStatus, setServerStatus] = useState({
		frontend: 'checking' as 'online' | 'offline' | 'checking',
		backend: 'checking' as 'online' | 'offline' | 'checking',
	});

	// Collapsible sections state
	const [collapsedSections, setCollapsedSections] = useState({
		systemStatus: false, // Start expanded
		apiEndpoints: true, // Start collapsed
		quickAccess: false, // Start expanded
		recentActivity: false, // Start expanded
	});

	const toggleSection = useCallback((section: keyof typeof collapsedSections) => {
		setCollapsedSections((prev) => ({
			...prev,
			[section]: !prev[section],
		}));
	}, []);

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
	}, []);

	// Refresh dashboard data
	const refreshDashboard = async () => {
		setIsRefreshing(true);
		try {
			const activity = getRecentActivity();
			setRecentActivity(activity);
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
		return action.replace(
			/Successfully\s+Implcit\s+Flow\s+Token/gi,
			'Successfully Obtained Implicit Flow Token'
		);
	};

	return (
		<div
			style={{
				maxWidth: '1200px',
				margin: '0 auto',
				padding: '2rem',
				background: '#f8fafc',
				minHeight: '100vh',
			}}
		>
			{/* Header with Unified Flow Design */}
			<div
				style={{
					marginBottom: '32px',
					padding: '24px',
					background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
					borderRadius: '12px',
					color: '#0c4a6e',
					position: 'relative',
					overflow: 'hidden',
				}}
			>
				{/* Decorative background pattern */}
				<div
					style={{
						position: 'absolute',
						top: 0,
						right: 0,
						width: '300px',
						height: '100%',
						background:
							'radial-gradient(circle at top right, rgba(255,255,255,0.3) 0%, transparent 70%)',
						pointerEvents: 'none',
					}}
				/>

				<h1
					style={{
						fontSize: '32px',
						fontWeight: '700',
						margin: '0 0 8px 0',
						position: 'relative',
						zIndex: 1,
					}}
				>
					📊 Dashboard
				</h1>
				<p
					style={{
						fontSize: '16px',
						margin: 0,
						opacity: 0.9,
						position: 'relative',
						zIndex: 1,
					}}
				>
					Monitor system status, explore OAuth flows, and track recent activity
				</p>
			</div>

			{/* System Status */}
				<div style={{ marginBottom: '24px' }}>
					<CollapsibleHeader
						title="System Status"
						subtitle="Frontend and backend server health monitoring"
						icon={<FiServer />}
						defaultCollapsed={collapsedSections.systemStatus}
						collapsed={collapsedSections.systemStatus}
						onToggle={() => toggleSection('systemStatus')}
					>
						<ContentCard>
						<div
							style={{
								display: 'flex',
								gap: '0.5rem',
								marginBottom: '1rem',
								justifyContent: 'flex-end',
							}}
						>
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
						<ServerStatusGrid>
							<ServerCard>
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
							</ServerCard>

							<ServerCard>
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
							</ServerCard>
						</ServerStatusGrid>
					</ContentCard>
					</CollapsibleHeader>
				</div>

				{/* API Endpoints */}
				<div style={{ marginBottom: '24px' }}>
					<CollapsibleHeader
						title="Available API Endpoints"
						subtitle="Backend API endpoints for OAuth/OIDC operations"
						icon={<FiLink />}
						defaultCollapsed={collapsedSections.apiEndpoints}
						collapsed={collapsedSections.apiEndpoints}
						onToggle={() => toggleSection('apiEndpoints')}
					>
					<ContentCard>
						<ApiGrid>
							{apiEndpoints.map((endpoint, index) => (
								<ApiEndpointCard key={index}>
									<div
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: '0.5rem',
											marginBottom: '0.5rem',
										}}
									>
										<MethodBadge $method={endpoint.method}>{endpoint.method}</MethodBadge>
										<code style={{ fontSize: '0.875rem', fontWeight: '500' }}>{endpoint.path}</code>
									</div>
									<p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
										{endpoint.desc}
									</p>
								</ApiEndpointCard>
							))}
						</ApiGrid>
					</ContentCard>
					</CollapsibleHeader>
				</div>

				{/* Quick Access Flows */}
				<div style={{ marginBottom: '24px' }}>
					<CollapsibleHeader
						title="Quick Access Flows"
						subtitle="Explore OAuth 2.0 and OpenID Connect flows"
						icon={<FiZap />}
						defaultCollapsed={collapsedSections.quickAccess}
						collapsed={collapsedSections.quickAccess}
						onToggle={() => toggleSection('quickAccess')}
					>
					<ContentCard>
						<div style={{ marginBottom: '1rem' }}>
							<p style={{ color: '#666', fontSize: '0.95rem' }}>
								Explore OAuth 2.0 and OpenID Connect flows. Defaults are secure-by-default (Auth
								Code with PKCE).
							</p>
						</div>

						<QuickAccessGrid>
							<FlowCard>
								<h3>OAuth 2.0</h3>
								<p>
									Standards-based authorization flows. Recommended: Authorization Code (with PKCE
									for public clients).
								</p>
								<FlowButtonsContainer>
									<FlowLink
										href="/flows/oauth-authorization-code-v7"
										$variant="primary"
										$palette="oauth"
									>
										Authorization Code (V7)
									</FlowLink>
									<FlowLink href="/flows/implicit-v7" $variant="secondary" $palette="oauth">
										Implicit Flow (V7)
									</FlowLink>
									<FlowLink
										href="/flows/device-authorization-v7"
										$variant="secondary"
										$palette="oauth"
									>
										Device Authorization (V7)
									</FlowLink>
									<FlowLink
										href="/flows/client-credentials-v7"
										$variant="secondary"
										$palette="oauth"
									>
										Client Credentials (V7)
									</FlowLink>
								</FlowButtonsContainer>
							</FlowCard>

							<FlowCard>
								<h3>OpenID Connect</h3>
								<p>Identity layer on top of OAuth 2.0.</p>
								<FlowButtonsContainer>
									<FlowLink
										href="/flows/oauth-authorization-code-v7"
										$variant="primary"
										$palette="oidc"
									>
										Authorization Code (V7)
									</FlowLink>
									<FlowLink href="/flows/oidc-hybrid-v7" $variant="secondary" $palette="oidc">
										Hybrid Flow (V7)
									</FlowLink>
									<FlowLink href="/flows/implicit-v7" $variant="secondary" $palette="oidc">
										Implicit Flow (V7)
									</FlowLink>
									<FlowLink href="/oidc-overview" $variant="secondary" $palette="oidc">
										OIDC Overview
									</FlowLink>
								</FlowButtonsContainer>
							</FlowCard>

							<FlowCard>
								<h3>PingOne Flows</h3>
								<p>PingOne-specific authentication and authorization flows.</p>
								<FlowButtonsContainer>
									<FlowLink href="/flows/worker-token-v6" $variant="primary" $palette="pingone">
										Worker Token (V6)
									</FlowLink>
									<FlowLink href="/flows/pingone-par-v6" $variant="secondary" $palette="pingone">
										PAR (V6)
									</FlowLink>
									<FlowLink
										href="/flows/redirectless-v6-real"
										$variant="secondary"
										$palette="pingone"
									>
										Redirectless Flow (V6)
									</FlowLink>
								</FlowButtonsContainer>
							</FlowCard>
						</QuickAccessGrid>
					</ContentCard>
					</CollapsibleHeader>
				</div>

				{/* Recent Activity */}
				<div style={{ marginBottom: '24px' }}>
					<CollapsibleHeader
						title="Recent Activity"
						subtitle="Latest OAuth flow runs, credential updates, and API interactions"
						icon={<FiActivity />}
						defaultCollapsed={collapsedSections.recentActivity}
						collapsed={collapsedSections.recentActivity}
						onToggle={() => toggleSection('recentActivity')}
					>
					<ContentCard>
						<ActivityList>
							<ul>
								{recentActivity.length === 0 ? (
									<EmptyState>
										<FiActivity size={48} />
										<p>No recent activity</p>
										<p style={{ fontSize: '0.875rem' }}>
											Complete an OAuth flow to see activity here
										</p>
									</EmptyState>
								) : (
									recentActivity.slice(0, 10).map((activity, index) => (
										<ActivityListItem
											key={activity.id || index}
											$isLast={index >= recentActivity.length - 1}
										>
											<ActivityIcon $success={activity.success}>
												{activity.success ? '✓' : '✗'}
											</ActivityIcon>
											<ActivityContent>
												<ActivityAction>{formatActivityAction(activity.action)}</ActivityAction>
												<ActivityTime>{new Date(activity.timestamp).toLocaleString()}</ActivityTime>
											</ActivityContent>
										</ActivityListItem>
									))
								)}
							</ul>
						</ActivityList>
					</ContentCard>
					</CollapsibleHeader>
				</div>
		</div>
	);
};

export default Dashboard;
