import { useCallback, useEffect, useState } from 'react';
import { FiActivity, FiCheckCircle, FiGlobe, FiKey, FiRefreshCw, FiServer } from 'react-icons/fi';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import CollapsibleIcon from '../components/CollapsibleIcon';
import ServerStatusModal from '../components/ServerStatusModal';
import { useAuth } from '../contexts/NewAuthContext';
import { getRecentActivity } from '../utils/activityTracker';
import { checkSavedCredentials } from '../utils/configurationStatus';
// import { useTokenRefresh } from '../hooks/useTokenRefresh';
// import { getSharedConfigurationStatus } from '../utils/configurationStatus';
import { getAllFlowCredentialStatuses } from '../utils/flowCredentialChecker';
import { v4ToastManager } from '../utils/v4ToastMessages';

const DashboardContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem;
  background: #f8f9fa;
  min-height: 100vh;
  
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
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

// Removed unused MainContent styled component

const ContentCard = styled.div<{ $shaded?: boolean }>`
  background: ${({ $shaded }) => ($shaded ? 'linear-gradient(135deg, #f8f9ff 0%, #e8f2ff 100%)' : '#ffffff')};
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid ${({ $shaded }) => ($shaded ? '#d1e7ff' : '#e5e7eb')};
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

const _QuickActions = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const _ActionButton = styled(Link)`
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 1rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    color: white;
    text-decoration: none;
  }
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

const _RecentActivity = styled.div`
  margin-top: 1.5rem;
`;

const _ActivityItem = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 0.5rem;
  transition: background 0.3s ease;
  
  &:hover {
    background: #f8f9fa;
  }
`;

const _ActivityIcon = styled.div<{ $type: 'success' | 'warning' | 'info' }>`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  
  ${({ $type }) => {
		switch ($type) {
			case 'success':
				return 'background: rgba(67, 233, 123, 0.1); color: #43e97b;';
			case 'warning':
				return 'background: rgba(255, 193, 7, 0.1); color: #ffc107;';
			case 'info':
				return 'background: rgba(102, 126, 234, 0.1); color: #667eea;';
			default:
				return 'background: rgba(102, 126, 234, 0.1); color: #667eea;';
		}
	}}
`;

const _ActivityContent = styled.div`
  flex: 1;
`;

const _ActivityTitle = styled.div`
  font-weight: 500;
  color: #333;
  margin-bottom: 0.25rem;
`;

const _ActivityTime = styled.div`
  font-size: 0.85rem;
  color: #666;
`;

const _FlowStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
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

const _TokenInfo = styled.div`
  background: #f8f9fa;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
`;

const _TokenRow = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const _TokenLabel = styled.span`
  font-weight: 500;
  color: #333;
`;

const _TokenValue = styled.span`
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 0.8rem;
  color: #2d3748;
  background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
  border: 1px solid #cbd5e0;
  padding: 0.75rem;
  border-radius: 6px;
  word-break: break-all;
  white-space: pre-wrap;
  line-height: 1.4;
  margin-top: 0.25rem;
  display: block;
  position: relative;
`;

const _TokenRowContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
  position: relative;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const _TokenRowWithCopy = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 1rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const _CopyButton = styled.button`
  background: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  transition: all 0.2s ease;
  flex-shrink: 0;
  margin-top: 0.25rem;
  
  &:hover {
    background: #5a67d8;
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &.copied {
    background: #48bb78;
  }
`;

// Collapsible Section Components
const CollapsibleSection = styled.div`
  margin-bottom: 1rem;
`;

const CollapsibleHeader = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 0.5rem;
  
  &:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  h2 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  svg {
    color: #6b7280;
    transition: transform 0.2s ease;
  }
`;

const CollapsibleContent = styled.div<{ $isOpen: boolean }>`
  max-height: ${({ $isOpen }) => ($isOpen ? '2000px' : '0')};
  overflow: hidden;
  transition: max-height 0.3s ease-in-out;
  opacity: ${({ $isOpen }) => ($isOpen ? '1' : '0')};
  transition: opacity 0.2s ease-in-out;
`;

const Dashboard = () => {
	// React hooks must be at the top
	const { tokens: authTokens } = useAuth();
	const location = useLocation();
	const [flowCredentialStatuses, _setFlowCredentialStatuses] = useState(
		getAllFlowCredentialStatuses()
	);
	const [tokens, setTokens] = useState<Record<string, unknown> | null>(null);
	const [recentActivity, setRecentActivity] = useState<Record<string, unknown>[]>([]);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [showActivityModal, setShowActivityModal] = useState(false);
	const [showServerStatusModal, setShowServerStatusModal] = useState(false);
	const [serverStatus, setServerStatus] = useState({
		frontend: 'checking' as 'online' | 'offline' | 'checking',
		backend: 'checking' as 'online' | 'offline' | 'checking',
	});
	const [_copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
	// Use shared configuration status for consistency
	const [_configStatus, _setConfigStatus] = useState({
		status: 'unknown',
		lastChecked: Date.now(),
	});

	// State for collapsible sections
	const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
		systemOverview: true,
		flowCredentials: true,
		apiEndpoints: true,
		recentActivity: true,
	});

	const toggleSection = (sectionId: string) => {
		setExpandedSections((prev) => ({
			...prev,
			[sectionId]: !prev[sectionId],
		}));
	};

	// Token refresh automation for Dashboard login
	// const {
	//   isRefreshing: isTokenRefreshing,
	//   lastRefreshAt,
	//   nextRefreshAt,
	//   refreshError,
	//   refreshTokens,
	//   stopAutoRefresh,
	//   startAutoRefresh,
	//   status: refreshStatus
	// } = useTokenRefresh({
	//   autoRefresh: true,
	//   refreshThreshold: 300, // 5 minutes before expiry
	//   onRefreshSuccess: (newTokens) => {
	//     console.log(' [Dashboard] Token refresh successful', newTokens);
	//     setTokens(newTokens);
	//   },
	//   onRefreshError: (error) => {
	//     console.error(' [Dashboard] Token refresh failed', error);
	//   }
	// });

	// Check server status
	const checkServerStatus = useCallback(async () => {
		try {
			// Check backend server
			const backendResponse = await fetch('/api/health', {
				method: 'GET',
				mode: 'cors',
				signal: AbortSignal.timeout(3000), // 3 second timeout
			});

			setServerStatus((prev) => ({
				...prev,
				backend: backendResponse.ok ? 'online' : 'offline',
				frontend: 'online', // If we're seeing this page, frontend is online
			}));
		} catch (_error) {
			setServerStatus((prev) => ({
				...prev,
				backend: 'offline',
				frontend: 'online', // If we're seeing this page, frontend is online
			}));
		}
	}, []);

	// Check server status on mount
	useEffect(() => {
		checkServerStatus();
	}, [checkServerStatus]);

	const _infoMessage = (location.state as { message?: string })?.message;
	const _infoType =
		(location.state as { type?: 'success' | 'error' | 'warning' | 'info' })?.type || 'info';

	// Use the configStatus state for consistent status checking
	const hasSavedCredentials = checkSavedCredentials();

	// Debug logging for configuration status
	// useEffect(() => {
	//   console.log(' [Dashboard] Config status check:', {
	//     hasConfig: !!config,
	//     environmentId: config?.environmentId,
	//     clientId: config?.clientId,
	//     hasSavedCredentials,
	//     configObject: config
	//   });
	// }, [config, hasSavedCredentials]);

	// Listen for configuration changes and update status
	useEffect(() => {
		const handleConfigChange = () => {
			// const newStatus = getSharedConfigurationStatus('Dashboard');
			// setConfigStatus(newStatus);
			// console.log(' [Dashboard] Updated config status:', newStatus.isConfigured);
		};

		// Listen for all possible config change events
		window.addEventListener('pingone-config-changed', handleConfigChange);
		window.addEventListener('permanent-credentials-changed', handleConfigChange);
		window.addEventListener('config-credentials-changed', handleConfigChange);

		// Also refresh on component mount
		handleConfigChange();

		return () => {
			window.removeEventListener('pingone-config-changed', handleConfigChange);
			window.removeEventListener('permanent-credentials-changed', handleConfigChange);
			window.removeEventListener('config-credentials-changed', handleConfigChange);
		};
	}, []);

	// Handle refresh button click
	const handleRefresh = async () => {
		try {
			await refreshDashboard();
			v4ToastManager.showSuccess('saveConfigurationSuccess');
		} catch (_error) {
			v4ToastManager.showError('networkError');
		}
	};

	// Handle activity button click
	const _handleActivity = () => {
		setShowActivityModal(true);
	};

	// Load initial dashboard data
	useEffect(() => {
		const loadDashboardData = async () => {
			try {
				// Use tokens from auth context instead of storage
				setTokens(authTokens);

				// Load recent activity
				let activity = getRecentActivity();

				// If no activity exists, create some sample data for demonstration
				if (activity.length === 0) {
					const sampleActivities = [
						{
							id: 'sample_1',
							action: 'Completed Authorization Code Flow',
							flowType: 'authorization-code',
							timestamp: Date.now() - 300000, // 5 minutes ago
							success: true,
							details: 'Successfully obtained access token',
						},
						{
							id: 'sample_2',
							action: 'Updated PingOne Credentials: Environment ID',
							flowType: 'configuration',
							timestamp: Date.now() - 600000, // 10 minutes ago
							success: true,
							details: 'Environment ID configured',
						},
						{
							id: 'sample_3',
							action: 'Completed OAuth 2.0 Authorization Code Flow',
							flowType: 'oauth-authorization-code',
							timestamp: Date.now() - 900000, // 15 minutes ago
							success: true,
							details: 'OAuth 2.0 Authorization Code flow completed successfully',
						},
					];

					// Store sample activities
					localStorage.setItem(
						'pingone_playground_recent_activity',
						JSON.stringify(sampleActivities)
					);
					activity = sampleActivities;
				}

				setRecentActivity(activity);
			} catch (_error) {}
		};

		loadDashboardData();
	}, [authTokens]);

	// Listen for activity changes (polling every 2 seconds)
	useEffect(() => {
		const intervalId = setInterval(() => {
			const activity = getRecentActivity();
			setRecentActivity(activity);
		}, 2000);

		return () => clearInterval(intervalId);
	}, []);

	// Refresh dashboard data
	const refreshDashboard = async () => {
		setIsRefreshing(true);
		try {
			// Use tokens from auth context instead of storage
			// setTokens(authTokens);

			// Reload recent activity
			const activity = getRecentActivity();
			setRecentActivity(activity);
		} catch (_error) {
		} finally {
			setIsRefreshing(false);
		}
	};

	const calculateSuccessRate = useCallback((): number => {
		if (recentActivity.length === 0) {
			return 0;
		}

		const successfulActivities = recentActivity.filter(
			(activity) => activity.type === 'success' || activity.title?.toLowerCase().includes('success')
		).length;

		return Math.round((successfulActivities / recentActivity.length) * 100);
	}, [recentActivity]);

	const calculateSecurityScore = useCallback((): number => {
		let score = 0;

		if (sessionStorage.getItem('code_verifier')) {
			score += 25;
		}

		if (sessionStorage.getItem('oauth_state')) {
			score += 25;
		}

		return score;
	}, []);

	// Get flow-specific status - simple configured vs not configured
	// function getFlowStatus(flowType: string): { status: 'active' | 'pending' | 'error', message: string } {
	//   const baseConfigured = hasSavedCredentials;

	//   switch (flowType) {
	//     case 'authorization-code':
	//       // This is the main OIDC Enhanced Authorization Code flow - the only one actually configured
	//       return {
	//         status: baseConfigured ? 'active' : 'pending',
	//         message: baseConfigured ? 'Configured' : 'Not configured'
	//       };

	//     case 'oauth2-authorization-code':
	//     case 'client-credentials':
	//     case 'device-code':
	//     case 'hybrid':
	//     case 'implicit':
	//       // All other flows are not configured yet
	//       return {
	//         status: 'error',
	//         message: 'Not configured'
	//       };

	//     default:
	//       return {
	//         status: 'error',
	//         message: 'Not configured'
	//       };
	//   }
	// }

	// Get recent activity items
	const _activityItems = recentActivity.slice(0, 4).map((activity, index) => ({
		id: activity.id || index,
		type: activity.success ? 'success' : ('warning' as 'success' | 'warning' | 'info'),
		title: activity.action,
		time: new Date(activity.timestamp).toLocaleString(),
		icon: activity.success ? '' : '',
	}));

	// Get token expiration time
	const _getTokenExpiration = () => {
		if (!tokens || !tokens.expires_in) return 'N/A';
		const expiresIn = tokens.expires_in as number;
		const hours = Math.floor(expiresIn / 3600);
		const minutes = Math.floor((expiresIn % 3600) / 60);
		return `${hours}h ${minutes}m`;
	};

	const _handleCopyToken = async (tokenType: string, tokenValue: string) => {
		try {
			await navigator.clipboard.writeText(tokenValue);
			setCopiedStates((prev) => ({ ...prev, [tokenType]: true }));
			setTimeout(() => {
				setCopiedStates((prev) => ({ ...prev, [tokenType]: false }));
			}, 2000);
		} catch (_error) {}
	};

	// Helper function to get status for a specific flow
	const getFlowStatus = (flowType: string) => {
		const status = flowCredentialStatuses.find(
			(flowTypeStatus) => flowTypeStatus.flowType === flowType
		);
		return status || { status: 'pending', message: 'Status not available' };
	};

	return (
		<>
			{/* Centralized Success Messages */}
			{/* <CentralizedSuccessMessage position="top" /> */}

			<DashboardContainer>
				{/* Header */}
				<Header>
					<h1>OAuth/OIDC Playground</h1>
					<p>Your comprehensive OAuth 2.0 and OpenID Connect testing environment</p>
				</Header>

				{/* Combined System Status & Overview */}
				<CollapsibleSection>
					<CollapsibleHeader onClick={() => toggleSection('systemOverview')}>
						<h2>
							<FiServer />
							System Status & Overview
						</h2>
						<CollapsibleIcon isExpanded={expandedSections.systemOverview} />
					</CollapsibleHeader>
					<CollapsibleContent $isOpen={expandedSections.systemOverview}>
						<ContentCard style={{ marginBottom: '1rem' }}>
							<CardHeader>
								<CardTitle>System Status</CardTitle>
								<div style={{ display: 'flex', gap: '0.5rem' }}>
									<button
										type="button"
										onClick={() => {
											v4ToastManager.showWarning('saveConfigurationStart');
											handleRefresh();
										}}
										disabled={isRefreshing}
										style={{
											display: 'inline-flex',
											alignItems: 'center',
											gap: '0.5rem',
											padding: '0.5rem 1rem',
											background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
											color: 'white',
											border: 'none',
											borderRadius: '0.5rem',
											fontSize: '0.875rem',
											fontWeight: '600',
											cursor: isRefreshing ? 'not-allowed' : 'pointer',
											transition: 'all 0.2s ease',
											boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
											opacity: isRefreshing ? 0.7 : 1,
										}}
										onMouseEnter={(e) => {
											if (!isRefreshing) {
												e.currentTarget.style.background =
													'linear-gradient(135deg, #059669 0%, #047857 100%)';
												e.currentTarget.style.transform = 'translateY(-1px)';
												e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
											}
										}}
										onMouseLeave={(e) => {
											if (!isRefreshing) {
												e.currentTarget.style.background =
													'linear-gradient(135deg, #10b981 0%, #059669 100%)';
												e.currentTarget.style.transform = 'translateY(0)';
												e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
											}
										}}
									>
										<FiRefreshCw
											size={16}
											style={{
												animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
											}}
										/>
										Refresh
									</button>
									<RefreshButton
										onClick={() => {
											setShowActivityModal(true);
											v4ToastManager.showInfo('activityModal', 'Opening activity history...');
										}}
										style={{
											background: '#e3f2fd',
											color: '#1976d2',
											borderColor: '#bbdefb',
										}}
									>
										<FiActivity />
										Activity
									</RefreshButton>
									<RefreshButton
										onClick={() => {
											setShowServerStatusModal(true);
											v4ToastManager.showInfo('serverModal', 'Opening server status details...');
										}}
										style={{
											background: '#f0fdf4',
											color: '#059669',
											borderColor: '#bbf7d0',
										}}
									>
										<FiServer />
										Servers
									</RefreshButton>
								</div>
							</CardHeader>

							{/* Overall System Status */}
							<div
								style={{
									display: 'flex',
									gap: '1rem',
									flexWrap: 'wrap',
									marginBottom: '1.5rem',
								}}
							>
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
									{hasSavedCredentials
										? 'Global Configuration Credentials'
										: 'Global Configuration Missing'}
								</StatusBadge>
							</div>

							{/* Detailed Server Status */}
							<div style={{ marginTop: '1rem' }}>
								<h4
									style={{
										fontSize: '1rem',
										fontWeight: '600',
										marginBottom: '1rem',
										color: '#333',
									}}
								>
									Server Status Details
								</h4>

								<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
									{/* Frontend Server Details */}
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
															? 'warning'
															: 'error'
												}
											>
												{serverStatus.frontend === 'online'
													? ' Online'
													: serverStatus.frontend === 'checking'
														? ' Checking...'
														: ' Offline'}
											</StatusBadge>
											<div style={{ fontWeight: '600', color: '#333' }}>Frontend Server</div>
										</div>

										<div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
											<FiGlobe style={{ marginRight: '0.25rem' }} />
											<strong>URL:</strong> http://localhost:3000
										</div>

										<div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
											<strong>Type:</strong> Vite Development Server
										</div>

										<div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
											<strong>Protocol:</strong> HTTP/1.1
										</div>

										<div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
											<strong>Status:</strong>{' '}
											{serverStatus.frontend === 'online'
												? 'Serving static assets and SPA routing'
												: 'Not responding'}
										</div>

										<div style={{ fontSize: '0.875rem', color: '#666' }}>
											<strong>Last Check:</strong> {new Date().toLocaleTimeString()}
										</div>
									</div>

									{/* Backend Server Details */}
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
															? 'warning'
															: 'error'
												}
											>
												{serverStatus.backend === 'online'
													? ' Online'
													: serverStatus.backend === 'checking'
														? ' Checking...'
														: ' Offline'}
											</StatusBadge>
											<div style={{ fontWeight: '600', color: '#333' }}>Backend API</div>
										</div>

										<div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
											<FiKey style={{ marginRight: '0.25rem' }} />
											<strong>URL:</strong> https://localhost:3001
										</div>

										<div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
											<strong>Type:</strong> Node.js Express Server
										</div>

										<div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
											<strong>Protocol:</strong> HTTPS with self-signed certificates
										</div>

										<div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
											<strong>Status:</strong>{' '}
											{serverStatus.backend === 'online'
												? 'Handling API requests and token exchange'
												: 'Not responding'}
										</div>

										<div style={{ fontSize: '0.875rem', color: '#666' }}>
											<strong>Last Check:</strong> {new Date().toLocaleTimeString()}
										</div>
									</div>
								</div>
							</div>
						</ContentCard>
					</CollapsibleContent>
				</CollapsibleSection>

				{/* Flow Credential Status - Collapsible */}
				<CollapsibleSection>
					<CollapsibleHeader onClick={() => toggleSection('flowCredentials')}>
						<h2>
							<FiCheckCircle />
							Flow Credential Status Overview
						</h2>
						<CollapsibleIcon isExpanded={expandedSections.flowCredentials} />
					</CollapsibleHeader>
					<CollapsibleContent $isOpen={expandedSections.flowCredentials}>
						<ContentCard style={{ marginBottom: '1rem' }}>
							<CardHeader>
								<CardTitle>
									Comprehensive view of all OAuth and OIDC flow credential status
								</CardTitle>
							</CardHeader>

							<div
								style={{
									display: 'grid',
									gridTemplateColumns: '1fr 1fr',
									gap: '2rem',
								}}
							>
								{/* OAuth 2.0 Flows */}
								<div>
									{/* OAuth 2.0 Flows Table */}
									<div style={{ marginBottom: '1.5rem' }}>
										<h5
											style={{
												fontSize: '0.875rem',
												fontWeight: '600',
												marginBottom: '0.75rem',
												color: '#dc2626',
											}}
										>
											OAuth 2.0 Flows
										</h5>
										<div
											style={{
												backgroundColor: '#fef2f2',
												border: '1px solid #fecaca',
												borderRadius: '0.5rem',
												overflow: 'hidden',
											}}
										>
											<table
												style={{
													width: '100%',
													borderCollapse: 'collapse',
													fontSize: '0.875rem',
												}}
											>
												<thead>
													<tr style={{ backgroundColor: '#fee2e2' }}>
														<th
															style={{
																padding: '0.75rem',
																textAlign: 'left',
																borderBottom: '1px solid #fecaca',
																fontWeight: '600',
															}}
														>
															Flow Type
														</th>
														<th
															style={{
																padding: '0.75rem',
																textAlign: 'center',
																borderBottom: '1px solid #fecaca',
																fontWeight: '600',
															}}
														>
															Last Execution Time
														</th>
														<th
															style={{
																padding: '0.75rem',
																textAlign: 'center',
																borderBottom: '1px solid #fecaca',
																fontWeight: '600',
															}}
														>
															Credentials
														</th>
													</tr>
												</thead>
												<tbody>
													<tr>
														<td
															style={{
																padding: '0.75rem',
																borderBottom: '1px solid #fecaca',
															}}
														>
															OAuth 2.0 Authorization Code (V3)
														</td>
														<td
															style={{
																padding: '0.75rem',
																textAlign: 'center',
																borderBottom: '1px solid #fecaca',
															}}
														>
															<span
																style={{
																	padding: '0.25rem 0.5rem',
																	borderRadius: '0.375rem',
																	fontSize: '0.75rem',
																	fontWeight: '500',
																	backgroundColor: tokens ? '#dcfce7' : '#f3f4f6',
																	color: tokens ? '#166534' : '#6b7280',
																}}
															>
																{tokens
																	? '2 minutes ago'
																	: getFlowStatus('oauth-authorization-code-v3')
																			?.lastExecutionTime || 'Never'}
															</span>
														</td>
														<td
															style={{
																padding: '0.75rem',
																textAlign: 'center',
																borderBottom: '1px solid #fecaca',
															}}
														>
															<span
																style={{
																	padding: '0.25rem 0.5rem',
																	borderRadius: '0.375rem',
																	fontSize: '0.75rem',
																	fontWeight: '500',
																	backgroundColor: getFlowStatus('oauth-authorization-code-v3')
																		?.hasCredentials
																		? '#dcfce7'
																		: '#fee2e2',
																	color: getFlowStatus('oauth-authorization-code-v3')
																		?.hasCredentials
																		? '#166534'
																		: '#dc2626',
																}}
															>
																{getFlowStatus('oauth-authorization-code-v3')?.hasCredentials
																	? 'Configured'
																	: 'Missing'}
															</span>
														</td>
													</tr>
													<tr>
														<td
															style={{
																padding: '0.75rem',
																borderBottom: '1px solid #fecaca',
															}}
														>
															OAuth 2.0 Implicit V3
														</td>
														<td
															style={{
																padding: '0.75rem',
																textAlign: 'center',
																borderBottom: '1px solid #fecaca',
															}}
														>
															<span
																style={{
																	padding: '0.25rem 0.5rem',
																	borderRadius: '0.375rem',
																	fontSize: '0.75rem',
																	fontWeight: '500',
																	backgroundColor: '#f3f4f6',
																	color: '#6b7280',
																}}
															>
																{getFlowStatus('oauth2-implicit-v3')?.lastExecutionTime || 'Never'}
															</span>
														</td>
														<td
															style={{
																padding: '0.75rem',
																textAlign: 'center',
																borderBottom: '1px solid #fecaca',
															}}
														>
															<span
																style={{
																	padding: '0.25rem 0.5rem',
																	borderRadius: '0.375rem',
																	fontSize: '0.75rem',
																	fontWeight: '500',
																	backgroundColor: getFlowStatus('oauth2-implicit-v3')
																		?.hasCredentials
																		? '#dcfce7'
																		: '#fee2e2',
																	color: getFlowStatus('oauth2-implicit-v3')?.hasCredentials
																		? '#166534'
																		: '#dc2626',
																}}
															>
																{getFlowStatus('oauth2-implicit-v3')?.hasCredentials
																	? 'Configured'
																	: 'Missing'}
															</span>
														</td>
													</tr>
													<tr>
														<td
															style={{
																padding: '0.75rem',
																borderBottom: '1px solid #fecaca',
															}}
														>
															OAuth2 Client Credentials V3
														</td>
														<td
															style={{
																padding: '0.75rem',
																textAlign: 'center',
																borderBottom: '1px solid #fecaca',
															}}
														>
															<span
																style={{
																	padding: '0.25rem 0.5rem',
																	borderRadius: '0.375rem',
																	fontSize: '0.75rem',
																	fontWeight: '500',
																	backgroundColor: '#f3f4f6',
																	color: '#6b7280',
																}}
															>
																{getFlowStatus('oauth2-client-credentials-v3')?.lastExecutionTime ||
																	'Never'}
															</span>
														</td>
														<td
															style={{
																padding: '0.75rem',
																textAlign: 'center',
																borderBottom: '1px solid #fecaca',
															}}
														>
															<span
																style={{
																	padding: '0.25rem 0.5rem',
																	borderRadius: '0.375rem',
																	fontSize: '0.75rem',
																	fontWeight: '500',
																	backgroundColor: getFlowStatus('oauth2-client-credentials-v3')
																		?.hasCredentials
																		? '#dcfce7'
																		: '#fee2e2',
																	color: getFlowStatus('oauth2-client-credentials-v3')
																		?.hasCredentials
																		? '#166534'
																		: '#dc2626',
																}}
															>
																{getFlowStatus('oauth2-client-credentials-v3')?.hasCredentials
																	? 'Configured'
																	: 'Missing'}
															</span>
														</td>
													</tr>
													<tr>
														<td style={{ padding: '0.75rem' }}>
															OAuth 2.0 Resource Owner Password
														</td>
														<td style={{ padding: '0.75rem', textAlign: 'center' }}>
															<span
																style={{
																	padding: '0.25rem 0.5rem',
																	borderRadius: '0.375rem',
																	fontSize: '0.75rem',
																	fontWeight: '500',
																	backgroundColor: '#f3f4f6',
																	color: '#6b7280',
																}}
															>
																{getFlowStatus('oauth-resource-owner-password')
																	?.lastExecutionTime || 'Never'}
															</span>
														</td>
														<td style={{ padding: '0.75rem', textAlign: 'center' }}>
															<span
																style={{
																	padding: '0.25rem 0.5rem',
																	borderRadius: '0.375rem',
																	fontSize: '0.75rem',
																	fontWeight: '500',
																	backgroundColor: getFlowStatus('oauth-resource-owner-password')
																		?.hasCredentials
																		? '#dcfce7'
																		: '#fee2e2',
																	color: getFlowStatus('oauth-resource-owner-password')
																		?.hasCredentials
																		? '#166534'
																		: '#dc2626',
																}}
															>
																{getFlowStatus('oauth-resource-owner-password')?.hasCredentials
																	? 'Configured'
																	: 'Missing'}
															</span>
														</td>
													</tr>
												</tbody>
											</table>
										</div>
									</div>

									{/* OpenID Connect Flows Table */}
									<div style={{ marginBottom: '1.5rem' }}>
										<h5
											style={{
												fontSize: '0.875rem',
												fontWeight: '600',
												marginBottom: '0.75rem',
												color: '#16a34a',
											}}
										>
											OpenID Connect Flows
										</h5>
										<div
											style={{
												backgroundColor: '#faf5ff',
												border: '1px solid #bbf7d0',
												borderRadius: '0.5rem',
												overflow: 'hidden',
											}}
										>
											<table
												style={{
													width: '100%',
													borderCollapse: 'collapse',
													fontSize: '0.875rem',
												}}
											>
												<thead>
													<tr style={{ backgroundColor: '#f0fdf4' }}>
														<th
															style={{
																padding: '0.75rem',
																textAlign: 'left',
																borderBottom: '1px solid #bbf7d0',
																fontWeight: '600',
															}}
														>
															Flow Type
														</th>
														<th
															style={{
																padding: '0.75rem',
																textAlign: 'center',
																borderBottom: '1px solid #bbf7d0',
																fontWeight: '600',
															}}
														>
															Last Execution Time
														</th>
														<th
															style={{
																padding: '0.75rem',
																textAlign: 'center',
																borderBottom: '1px solid #bbf7d0',
																fontWeight: '600',
															}}
														>
															Credentials
														</th>
													</tr>
												</thead>
												<tbody>
													<tr>
														<td
															style={{
																padding: '0.75rem',
																borderBottom: '1px solid #bbf7d0',
															}}
														>
															OIDC Authorization Code (V3)
														</td>
														<td
															style={{
																padding: '0.75rem',
																textAlign: 'center',
																borderBottom: '1px solid #bbf7d0',
															}}
														>
															<span
																style={{
																	padding: '0.25rem 0.5rem',
																	borderRadius: '0.375rem',
																	fontSize: '0.75rem',
																	fontWeight: '500',
																	backgroundColor:
																		getFlowStatus('enhanced-authorization-code-v3')
																			?.lastExecutionTime &&
																		getFlowStatus('enhanced-authorization-code-v3')
																			?.lastExecutionTime !== 'Never'
																			? '#dcfce7'
																			: '#f3f4f6',
																	color:
																		getFlowStatus('enhanced-authorization-code-v3')
																			?.lastExecutionTime &&
																		getFlowStatus('enhanced-authorization-code-v3')
																			?.lastExecutionTime !== 'Never'
																			? '#166534'
																			: '#6b7280',
																}}
															>
																{getFlowStatus('enhanced-authorization-code-v3')
																	?.lastExecutionTime || 'Never'}
															</span>
														</td>
														<td
															style={{
																padding: '0.75rem',
																textAlign: 'center',
																borderBottom: '1px solid #bbf7d0',
															}}
														>
															<span
																style={{
																	padding: '0.25rem 0.5rem',
																	borderRadius: '0.375rem',
																	fontSize: '0.75rem',
																	fontWeight: '500',
																	backgroundColor: getFlowStatus('enhanced-authorization-code-v3')
																		?.hasCredentials
																		? '#dcfce7'
																		: '#fee2e2',
																	color: getFlowStatus('enhanced-authorization-code-v3')
																		?.hasCredentials
																		? '#166534'
																		: '#dc2626',
																}}
															>
																{getFlowStatus('enhanced-authorization-code-v3')?.hasCredentials
																	? 'Configured'
																	: 'Missing'}
															</span>
														</td>
													</tr>
													<tr>
														<td
															style={{
																padding: '0.75rem',
																borderBottom: '1px solid #bbf7d0',
															}}
														>
															OIDC Implicit V3
														</td>
														<td
															style={{
																padding: '0.75rem',
																textAlign: 'center',
																borderBottom: '1px solid #bbf7d0',
															}}
														>
															<span
																style={{
																	padding: '0.25rem 0.5rem',
																	borderRadius: '0.375rem',
																	fontSize: '0.75rem',
																	fontWeight: '500',
																	backgroundColor:
																		getFlowStatus('oidc-implicit-v3')?.lastExecutionTime &&
																		getFlowStatus('oidc-implicit-v3')?.lastExecutionTime !== 'Never'
																			? '#dcfce7'
																			: '#f3f4f6',
																	color:
																		getFlowStatus('oidc-implicit-v3')?.lastExecutionTime &&
																		getFlowStatus('oidc-implicit-v3')?.lastExecutionTime !== 'Never'
																			? '#166534'
																			: '#6b7280',
																}}
															>
																{getFlowStatus('oidc-implicit-v3')?.lastExecutionTime || 'Never'}
															</span>
														</td>
														<td
															style={{
																padding: '0.75rem',
																textAlign: 'center',
																borderBottom: '1px solid #bbf7d0',
															}}
														>
															<span
																style={{
																	padding: '0.25rem 0.5rem',
																	borderRadius: '0.375rem',
																	fontSize: '0.75rem',
																	fontWeight: '500',
																	backgroundColor: getFlowStatus('oidc-implicit-v3')?.hasCredentials
																		? '#dcfce7'
																		: '#fee2e2',
																	color: getFlowStatus('oidc-implicit-v3')?.hasCredentials
																		? '#166534'
																		: '#dc2626',
																}}
															>
																{getFlowStatus('oidc-implicit-v3')?.hasCredentials
																	? 'Configured'
																	: 'Missing'}
															</span>
														</td>
													</tr>
													<tr>
														<td
															style={{
																padding: '0.75rem',
																borderBottom: '1px solid #bbf7d0',
															}}
														>
															OIDC Hybrid V3
														</td>
														<td
															style={{
																padding: '0.75rem',
																textAlign: 'center',
																borderBottom: '1px solid #bbf7d0',
															}}
														>
															<span
																style={{
																	padding: '0.25rem 0.5rem',
																	borderRadius: '0.375rem',
																	fontSize: '0.75rem',
																	fontWeight: '500',
																	backgroundColor:
																		getFlowStatus('oidc-hybrid-v3')?.lastExecutionTime &&
																		getFlowStatus('oidc-hybrid-v3')?.lastExecutionTime !== 'Never'
																			? '#dcfce7'
																			: '#f3f4f6',
																	color:
																		getFlowStatus('oidc-hybrid-v3')?.lastExecutionTime &&
																		getFlowStatus('oidc-hybrid-v3')?.lastExecutionTime !== 'Never'
																			? '#166534'
																			: '#6b7280',
																}}
															>
																{getFlowStatus('oidc-hybrid-v3')?.lastExecutionTime || 'Never'}
															</span>
														</td>
														<td
															style={{
																padding: '0.75rem',
																textAlign: 'center',
																borderBottom: '1px solid #bbf7d0',
															}}
														>
															<span
																style={{
																	padding: '0.25rem 0.5rem',
																	borderRadius: '0.375rem',
																	fontSize: '0.75rem',
																	fontWeight: '500',
																	backgroundColor: getFlowStatus('oidc-hybrid-v3')?.hasCredentials
																		? '#dcfce7'
																		: '#fee2e2',
																	color: getFlowStatus('oidc-hybrid-v3')?.hasCredentials
																		? '#166534'
																		: '#dc2626',
																}}
															>
																{getFlowStatus('oidc-hybrid-v3')?.hasCredentials
																	? 'Configured'
																	: 'Missing'}
															</span>
														</td>
													</tr>
													<tr>
														<td
															style={{
																padding: '0.75rem',
																borderBottom: '1px solid #bbf7d0',
															}}
														>
															OIDC Client Credentials V3
														</td>
														<td
															style={{
																padding: '0.75rem',
																textAlign: 'center',
																borderBottom: '1px solid #bbf7d0',
															}}
														>
															<span
																style={{
																	padding: '0.25rem 0.5rem',
																	borderRadius: '0.375rem',
																	fontSize: '0.75rem',
																	fontWeight: '500',
																	backgroundColor:
																		getFlowStatus('oidc-client-credentials-v3')
																			?.lastExecutionTime &&
																		getFlowStatus('oidc-client-credentials-v3')
																			?.lastExecutionTime !== 'Never'
																			? '#dcfce7'
																			: '#f3f4f6',
																	color:
																		getFlowStatus('oidc-client-credentials-v3')
																			?.lastExecutionTime &&
																		getFlowStatus('oidc-client-credentials-v3')
																			?.lastExecutionTime !== 'Never'
																			? '#166534'
																			: '#6b7280',
																}}
															>
																{getFlowStatus('oidc-client-credentials-v3')?.lastExecutionTime ||
																	'Never'}
															</span>
														</td>
														<td
															style={{
																padding: '0.75rem',
																textAlign: 'center',
																borderBottom: '1px solid #bbf7d0',
															}}
														>
															<span
																style={{
																	padding: '0.25rem 0.5rem',
																	borderRadius: '0.375rem',
																	fontSize: '0.75rem',
																	fontWeight: '500',
																	backgroundColor: getFlowStatus('oidc-client-credentials-v3')
																		?.hasCredentials
																		? '#dcfce7'
																		: '#fee2e2',
																	color: getFlowStatus('oidc-client-credentials-v3')?.hasCredentials
																		? '#166534'
																		: '#dc2626',
																}}
															>
																{getFlowStatus('oidc-client-credentials-v3')?.hasCredentials
																	? 'Configured'
																	: 'Missing'}
															</span>
														</td>
													</tr>
													<tr>
														<td
															style={{
																padding: '0.75rem',
																borderBottom: '1px solid #bbf7d0',
															}}
														>
															OIDC Device Code V3
														</td>
														<td
															style={{
																padding: '0.75rem',
																textAlign: 'center',
																borderBottom: '1px solid #bbf7d0',
															}}
														>
															<span
																style={{
																	padding: '0.25rem 0.5rem',
																	borderRadius: '0.375rem',
																	fontSize: '0.75rem',
																	fontWeight: '500',
																	backgroundColor:
																		getFlowStatus('device-code-oidc')?.lastExecutionTime &&
																		getFlowStatus('device-code-oidc')?.lastExecutionTime !== 'Never'
																			? '#dcfce7'
																			: '#f3f4f6',
																	color:
																		getFlowStatus('device-code-oidc')?.lastExecutionTime &&
																		getFlowStatus('device-code-oidc')?.lastExecutionTime !== 'Never'
																			? '#166534'
																			: '#6b7280',
																}}
															>
																{getFlowStatus('device-code-oidc')?.lastExecutionTime || 'Never'}
															</span>
														</td>
														<td
															style={{
																padding: '0.75rem',
																textAlign: 'center',
																borderBottom: '1px solid #bbf7d0',
															}}
														>
															<span
																style={{
																	padding: '0.25rem 0.5rem',
																	borderRadius: '0.375rem',
																	fontSize: '0.75rem',
																	fontWeight: '500',
																	backgroundColor: getFlowStatus('device-code-oidc')?.hasCredentials
																		? '#dcfce7'
																		: '#fee2e2',
																	color: getFlowStatus('device-code-oidc')?.hasCredentials
																		? '#166534'
																		: '#dc2626',
																}}
															>
																{getFlowStatus('device-code-oidc')?.hasCredentials
																	? 'Configured'
																	: 'Missing'}
															</span>
														</td>
													</tr>
													<tr>
														<td style={{ padding: '0.75rem' }}>OIDC Resource Owner Password</td>
														<td style={{ padding: '0.75rem', textAlign: 'center' }}>
															<span
																style={{
																	padding: '0.25rem 0.5rem',
																	borderRadius: '0.375rem',
																	fontSize: '0.75rem',
																	fontWeight: '500',
																	backgroundColor:
																		getFlowStatus('oidc-resource-owner-password')
																			?.lastExecutionTime &&
																		getFlowStatus('oidc-resource-owner-password')
																			?.lastExecutionTime !== 'Never'
																			? '#dcfce7'
																			: '#f3f4f6',
																	color:
																		getFlowStatus('oidc-resource-owner-password')
																			?.lastExecutionTime &&
																		getFlowStatus('oidc-resource-owner-password')
																			?.lastExecutionTime !== 'Never'
																			? '#166534'
																			: '#6b7280',
																}}
															>
																{getFlowStatus('oidc-resource-owner-password')?.lastExecutionTime ||
																	'Never'}
															</span>
														</td>
														<td style={{ padding: '0.75rem', textAlign: 'center' }}>
															<span
																style={{
																	padding: '0.25rem 0.5rem',
																	borderRadius: '0.375rem',
																	fontSize: '0.75rem',
																	fontWeight: '500',
																	backgroundColor: getFlowStatus('oidc-resource-owner-password')
																		?.hasCredentials
																		? '#dcfce7'
																		: '#fee2e2',
																	color: getFlowStatus('oidc-resource-owner-password')
																		?.hasCredentials
																		? '#166534'
																		: '#dc2626',
																}}
															>
																{getFlowStatus('oidc-resource-owner-password')?.hasCredentials
																	? 'Configured'
																	: 'Missing'}
															</span>
														</td>
													</tr>
												</tbody>
											</table>
										</div>
									</div>
								</div>

								{/* OpenID Connect Flows */}
								<div>
									{/* OpenID Connect Flows Table */}
									<div style={{ marginBottom: '1.5rem' }}>
										<h5
											style={{
												fontSize: '0.875rem',
												fontWeight: '600',
												marginBottom: '0.75rem',
												color: '#16a34a',
											}}
										>
											OpenID Connect Flows
										</h5>
										<div
											style={{
												backgroundColor: '#faf5ff',
												border: '1px solid #bbf7d0',
												borderRadius: '0.5rem',
												overflow: 'hidden',
											}}
										>
											<table
												style={{
													width: '100%',
													borderCollapse: 'collapse',
													fontSize: '0.875rem',
												}}
											>
												<thead>
													<tr style={{ backgroundColor: '#f0fdf4' }}>
														<th
															style={{
																padding: '0.75rem',
																textAlign: 'left',
																borderBottom: '1px solid #bbf7d0',
																fontWeight: '600',
															}}
														>
															Flow Type
														</th>
														<th
															style={{
																padding: '0.75rem',
																textAlign: 'center',
																borderBottom: '1px solid #bbf7d0',
																fontWeight: '600',
															}}
														>
															Last Execution Time
														</th>
														<th
															style={{
																padding: '0.75rem',
																textAlign: 'center',
																borderBottom: '1px solid #bbf7d0',
																fontWeight: '600',
															}}
														>
															Credentials
														</th>
													</tr>
												</thead>
												<tbody>
													<tr>
														<td
															style={{
																padding: '0.75rem',
																borderBottom: '1px solid #bbf7d0',
															}}
														>
															OIDC Authorization Code (V3)
														</td>
														<td
															style={{
																padding: '0.75rem',
																textAlign: 'center',
																borderBottom: '1px solid #bbf7d0',
															}}
														>
															<span
																style={{
																	padding: '0.25rem 0.5rem',
																	borderRadius: '0.375rem',
																	fontSize: '0.75rem',
																	fontWeight: '500',
																	backgroundColor: '#f3f4f6',
																	color: '#6b7280',
																}}
															>
																{getFlowStatus('enhanced-authorization-code-v3')
																	?.lastExecutionTime || 'Never'}
															</span>
														</td>
														<td
															style={{
																padding: '0.75rem',
																textAlign: 'center',
																borderBottom: '1px solid #bbf7d0',
															}}
														>
															<span
																style={{
																	padding: '0.25rem 0.5rem',
																	borderRadius: '0.375rem',
																	fontSize: '0.75rem',
																	fontWeight: '500',
																	backgroundColor: getFlowStatus('enhanced-authorization-code-v3')
																		?.hasCredentials
																		? '#dcfce7'
																		: '#fee2e2',
																	color: getFlowStatus('enhanced-authorization-code-v3')
																		?.hasCredentials
																		? '#166534'
																		: '#dc2626',
																}}
															>
																{getFlowStatus('enhanced-authorization-code-v3')?.hasCredentials
																	? 'Configured'
																	: 'Missing'}
															</span>
														</td>
													</tr>
													<tr>
														<td
															style={{
																padding: '0.75rem',
																borderBottom: '1px solid #bbf7d0',
															}}
														>
															OIDC Implicit V3
														</td>
														<td
															style={{
																padding: '0.75rem',
																textAlign: 'center',
																borderBottom: '1px solid #bbf7d0',
															}}
														>
															<span
																style={{
																	padding: '0.25rem 0.5rem',
																	borderRadius: '0.375rem',
																	fontSize: '0.75rem',
																	fontWeight: '500',
																	backgroundColor: '#f3f4f6',
																	color: '#6b7280',
																}}
															>
																{getFlowStatus('oidc-implicit-v3')?.lastExecutionTime || 'Never'}
															</span>
														</td>
														<td
															style={{
																padding: '0.75rem',
																textAlign: 'center',
																borderBottom: '1px solid #bbf7d0',
															}}
														>
															<span
																style={{
																	padding: '0.25rem 0.5rem',
																	borderRadius: '0.375rem',
																	fontSize: '0.75rem',
																	fontWeight: '500',
																	backgroundColor: getFlowStatus('oidc-implicit-v3')?.hasCredentials
																		? '#dcfce7'
																		: '#fee2e2',
																	color: getFlowStatus('oidc-implicit-v3')?.hasCredentials
																		? '#166534'
																		: '#dc2626',
																}}
															>
																{getFlowStatus('oidc-implicit-v3')?.hasCredentials
																	? 'Configured'
																	: 'Missing'}
															</span>
														</td>
													</tr>
													<tr>
														<td style={{ padding: '0.75rem' }}>PingOne Worker Token V3</td>
														<td style={{ padding: '0.75rem', textAlign: 'center' }}>
															<span
																style={{
																	padding: '0.25rem 0.5rem',
																	borderRadius: '0.375rem',
																	fontSize: '0.75rem',
																	fontWeight: '500',
																	backgroundColor: '#f3f4f6',
																	color: '#6b7280',
																}}
															>
																{getFlowStatus('worker-token-v3')?.lastExecutionTime || 'Never'}
															</span>
														</td>
														<td style={{ padding: '0.75rem', textAlign: 'center' }}>
															<span
																style={{
																	padding: '0.25rem 0.5rem',
																	borderRadius: '0.375rem',
																	fontSize: '0.75rem',
																	fontWeight: '500',
																	backgroundColor: getFlowStatus('worker-token-v3')?.hasCredentials
																		? '#dcfce7'
																		: '#fee2e2',
																	color: getFlowStatus('worker-token-v3')?.hasCredentials
																		? '#166534'
																		: '#dc2626',
																}}
															>
																{getFlowStatus('worker-token-v3')?.hasCredentials
																	? 'Configured'
																	: 'Missing'}
															</span>
														</td>
													</tr>
												</tbody>
											</table>
										</div>
									</div>

									{/* PingOne Tokens Table */}
									<div style={{ marginBottom: '1.5rem' }}>
										<h5
											style={{
												fontSize: '0.875rem',
												fontWeight: '600',
												marginBottom: '0.75rem',
												color: '#059669',
											}}
										>
											PingOne Tokens
										</h5>
										<div
											style={{
												backgroundColor: '#f0fdf4',
												border: '1px solid #bbf7d0',
												borderRadius: '0.5rem',
												overflow: 'hidden',
											}}
										>
											<table
												style={{
													width: '100%',
													borderCollapse: 'collapse',
													fontSize: '0.875rem',
												}}
											>
												<thead>
													<tr style={{ backgroundColor: '#dcfce7' }}>
														<th
															style={{
																padding: '0.75rem',
																textAlign: 'left',
																borderBottom: '1px solid #bbf7d0',
																fontWeight: '600',
															}}
														>
															Flow Type
														</th>
														<th
															style={{
																padding: '0.75rem',
																textAlign: 'center',
																borderBottom: '1px solid #bbf7d0',
																fontWeight: '600',
															}}
														>
															Last Execution Time
														</th>
														<th
															style={{
																padding: '0.75rem',
																textAlign: 'center',
																borderBottom: '1px solid #bbf7d0',
																fontWeight: '600',
															}}
														>
															Credentials
														</th>
													</tr>
												</thead>
												<tbody>
													<tr>
														<td style={{ padding: '0.75rem' }}>PingOne Worker Token V3</td>
														<td style={{ padding: '0.75rem', textAlign: 'center' }}>
															<span
																style={{
																	padding: '0.25rem 0.5rem',
																	borderRadius: '0.375rem',
																	fontSize: '0.75rem',
																	fontWeight: '500',
																	backgroundColor: '#f3f4f6',
																	color: '#6b7280',
																}}
															>
																{getFlowStatus('worker-token-v3')?.lastExecutionTime || 'Never'}
															</span>
														</td>
														<td style={{ padding: '0.75rem', textAlign: 'center' }}>
															<span
																style={{
																	padding: '0.25rem 0.5rem',
																	borderRadius: '0.375rem',
																	fontSize: '0.75rem',
																	fontWeight: '500',
																	backgroundColor: getFlowStatus('worker-token-v3')?.hasCredentials
																		? '#dcfce7'
																		: '#fee2e2',
																	color: getFlowStatus('worker-token-v3')?.hasCredentials
																		? '#166534'
																		: '#dc2626',
																}}
															>
																{getFlowStatus('worker-token-v3')?.hasCredentials
																	? 'Configured'
																	: 'Missing'}
															</span>
														</td>
													</tr>
												</tbody>
											</table>
										</div>
									</div>
								</div>
							</div>
						</ContentCard>
					</CollapsibleContent>
				</CollapsibleSection>
				{/* API Endpoints Available - Collapsible */}
				<CollapsibleSection>
					<CollapsibleHeader onClick={() => toggleSection('apiEndpoints')}>
						<h2>
							<FiGlobe />
							Available API Endpoints
						</h2>
						<CollapsibleIcon isExpanded={expandedSections.apiEndpoints} />
					</CollapsibleHeader>
					<CollapsibleContent $isOpen={expandedSections.apiEndpoints}>
						<ContentCard style={{ marginBottom: '1rem' }}>
							<CardHeader>
								<CardTitle>Backend API endpoints for OAuth flows</CardTitle>
								<div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
									These endpoints are used by the OAuth flows to interact with the backend.
								</div>
								<div style={{ marginBottom: '1rem' }}>
									<a
										href="https://github.com/pingidentity/pingone-oauth-flows/tree/main/docs/api-endpoints.md"
										target="_blank"
										rel="noopener noreferrer"
										style={{
											display: 'inline-flex',
											alignItems: 'center',
											gap: '0.5rem',
											padding: '0.5rem 1rem',
											background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
											color: 'white',
											textDecoration: 'none',
											borderRadius: '0.5rem',
											fontSize: '0.875rem',
											fontWeight: '500',
											transition: 'transform 0.2s ease',
										}}
										onMouseEnter={(e) => {
											e.currentTarget.style.transform = 'translateY(-1px)';
										}}
										onMouseLeave={(e) => {
											e.currentTarget.style.transform = 'translateY(0)';
										}}
									>
										<FiGlobe />
										View API Endpoints Documentation
									</a>
								</div>
							</CardHeader>

							<div
								style={{
									display: 'grid',
									gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
									gap: '1rem',
								}}
							>
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
											fontSize: '0.875rem',
											fontWeight: '500',
											color: '#374151',
											marginBottom: '0.25rem',
										}}
									>
										Token Exchange
									</div>
									<div
										style={{
											fontFamily: 'Monaco, Menlo, monospace',
											fontSize: '0.8rem',
											color: '#059669',
											background: '#f0fdf4',
											padding: '0.25rem 0.5rem',
											borderRadius: '0.25rem',
											border: '1px solid #bbf7d0',
										}}
									>
										/api/token-exchange
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
											fontSize: '0.875rem',
											fontWeight: '500',
											color: '#374151',
											marginBottom: '0.25rem',
										}}
									>
										Client Credentials
									</div>
									<div
										style={{
											fontFamily: 'Monaco, Menlo, monospace',
											fontSize: '0.8rem',
											color: '#059669',
											background: '#f0fdf4',
											padding: '0.25rem 0.5rem',
											borderRadius: '0.25rem',
											border: '1px solid #bbf7d0',
										}}
									>
										/api/client-credentials
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
											fontSize: '0.875rem',
											fontWeight: '500',
											color: '#374151',
											marginBottom: '0.25rem',
										}}
									>
										Device Authorization
									</div>
									<div
										style={{
											fontFamily: 'Monaco, Menlo, monospace',
											fontSize: '0.8rem',
											color: '#059669',
											background: '#f0fdf4',
											padding: '0.25rem 0.5rem',
											borderRadius: '0.25rem',
											border: '1px solid #bbf7d0',
										}}
									>
										/api/device-authorization
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
											fontSize: '0.875rem',
											fontWeight: '500',
											color: '#374151',
											marginBottom: '0.25rem',
										}}
									>
										PAR (Pushed Authorization)
									</div>
									<div
										style={{
											fontFamily: 'Monaco, Menlo, monospace',
											fontSize: '0.8rem',
											color: '#059669',
											background: '#f0fdf4',
											padding: '0.25rem 0.5rem',
											borderRadius: '0.25rem',
											border: '1px solid #bbf7d0',
										}}
									>
										/api/par
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
											fontSize: '0.875rem',
											fontWeight: '500',
											color: '#374151',
											marginBottom: '0.25rem',
										}}
									>
										Token Introspection
									</div>
									<div
										style={{
											fontFamily: 'Monaco, Menlo, monospace',
											fontSize: '0.8rem',
											color: '#059669',
											background: '#f0fdf4',
											padding: '0.25rem 0.5rem',
											borderRadius: '0.25rem',
											border: '1px solid #bbf7d0',
										}}
									>
										/api/introspect-token
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
											fontSize: '0.875rem',
											fontWeight: '500',
											color: '#374151',
											marginBottom: '0.25rem',
										}}
									>
										User Info
									</div>
									<div
										style={{
											fontFamily: 'Monaco, Menlo, monospace',
											fontSize: '0.8rem',
											color: '#059669',
											background: '#f0fdf4',
											padding: '0.25rem 0.5rem',
											borderRadius: '0.25rem',
											border: '1px solid #bbf7d0',
										}}
									>
										/api/userinfo
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
											fontSize: '0.875rem',
											fontWeight: '500',
											color: '#374151',
											marginBottom: '0.25rem',
										}}
									>
										Token Validation
									</div>
									<div
										style={{
											fontFamily: 'Monaco, Menlo, monospace',
											fontSize: '0.8rem',
											color: '#059669',
											background: '#f0fdf4',
											padding: '0.25rem 0.5rem',
											borderRadius: '0.25rem',
											border: '1px solid #bbf7d0',
										}}
									>
										/api/validate-token
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
											fontSize: '0.875rem',
											fontWeight: '500',
											color: '#374151',
											marginBottom: '0.25rem',
										}}
									>
										JWKS Endpoint
									</div>
									<div
										style={{
											fontFamily: 'Monaco, Menlo, monospace',
											fontSize: '0.8rem',
											color: '#059669',
											background: '#f0fdf4',
											padding: '0.25rem 0.5rem',
											borderRadius: '0.25rem',
											border: '1px solid #bbf7d0',
										}}
									>
										/api/jwks
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
											fontSize: '0.875rem',
											fontWeight: '500',
											color: '#374151',
											marginBottom: '0.25rem',
										}}
									>
										Playground JWKS
									</div>
									<div
										style={{
											fontFamily: 'Monaco, Menlo, monospace',
											fontSize: '0.8rem',
											color: '#059669',
											background: '#f0fdf4',
											padding: '0.25rem 0.5rem',
											borderRadius: '0.25rem',
											border: '1px solid #bbf7d0',
										}}
									>
										/api/playground-jwks
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
											fontSize: '0.875rem',
											fontWeight: '500',
											color: '#374151',
											marginBottom: '0.25rem',
										}}
									>
										OIDC Discovery
									</div>
									<div
										style={{
											fontFamily: 'Monaco, Menlo, monospace',
											fontSize: '0.8rem',
											color: '#059669',
											background: '#f0fdf4',
											padding: '0.25rem 0.5rem',
											borderRadius: '0.25rem',
											border: '1px solid #bbf7d0',
										}}
									>
										/api/discovery
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
											fontSize: '0.875rem',
											fontWeight: '500',
											color: '#374151',
											marginBottom: '0.25rem',
										}}
									>
										Health Check
									</div>
									<div
										style={{
											fontFamily: 'Monaco, Menlo, monospace',
											fontSize: '0.8rem',
											color: '#059669',
											background: '#f0fdf4',
											padding: '0.25rem 0.5rem',
											borderRadius: '0.25rem',
											border: '1px solid #bbf7d0',
										}}
									>
										/api/health
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
											fontSize: '0.875rem',
											fontWeight: '500',
											color: '#374151',
											marginBottom: '0.25rem',
										}}
									>
										Environment Config
									</div>
									<div
										style={{
											fontFamily: 'Monaco, Menlo, monospace',
											fontSize: '0.8rem',
											color: '#059669',
											background: '#f0fdf4',
											padding: '0.25rem 0.5rem',
											borderRadius: '0.25rem',
											border: '1px solid #bbf7d0',
										}}
									>
										/api/env-config
									</div>
								</div>
							</div>
						</ContentCard>
					</CollapsibleContent>
				</CollapsibleSection>
				{/* Recent Activity - Collapsible */}
				<CollapsibleSection>
					<CollapsibleHeader onClick={() => toggleSection('recentActivity')}>
						<h2>
							<FiActivity />
							Recent Activity
						</h2>
						<CollapsibleIcon isExpanded={expandedSections.recentActivity} />
					</CollapsibleHeader>
					<CollapsibleContent $isOpen={expandedSections.recentActivity}>
						<ContentCard style={{ marginBottom: '1rem' }}>
							<CardHeader>
								<CardTitle>Latest OAuth flow executions and events</CardTitle>
							</CardHeader>

							<div
								style={{
									padding: '1rem',
									background: '#f8fafc',
									borderRadius: '0.5rem',
									border: '1px solid #e2e8f0',
								}}
							>
								{recentActivity && recentActivity.length > 0 ? (
									<div
										style={{
											display: 'flex',
											flexDirection: 'column',
											gap: '0.75rem',
										}}
									>
										{recentActivity.slice(0, 5).map((item) => (
											<div
												key={String(item.id ?? item.timestamp ?? JSON.stringify(item))}
												style={{
													display: 'flex',
													alignItems: 'center',
													gap: '0.75rem',
													padding: '0.75rem',
													background: '#ffffff',
													borderRadius: '0.375rem',
													border: '1px solid #e5e7eb',
												}}
											>
												<div
													style={{
														width: '8px',
														height: '8px',
														borderRadius: '50%',
														background: '#10b981',
													}}
												/>
												<div style={{ flex: 1 }}>
													<div
														style={{
															fontSize: '0.875rem',
															fontWeight: '500',
															color: '#374151',
														}}
													>
														{item.action}
													</div>
													<div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
														{new Date(item.timestamp).toLocaleString()}
													</div>
												</div>
											</div>
										))}
									</div>
								) : (
									<div
										style={{
											textAlign: 'center',
											padding: '2rem',
											color: '#6b7280',
											fontSize: '0.9rem',
										}}
									>
										No recent activity found
									</div>
								)}
							</div>
						</ContentCard>
					</CollapsibleContent>
				</CollapsibleSection>

				{/* Centralized Success/Error Messages */}
			</DashboardContainer>

			{/* Server Status Modal */}
			<ServerStatusModal
				isOpen={showServerStatusModal}
				onClose={() => setShowServerStatusModal(false)}
			/>

			{/* Activity Modal */}
			{showActivityModal && (
				<div
					style={{
						position: 'fixed',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						backgroundColor: 'rgba(0, 0, 0, 0.5)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						zIndex: 1000,
					}}
				>
					<div
						style={{
							backgroundColor: 'white',
							borderRadius: '0.75rem',
							padding: '2rem',
							maxWidth: '600px',
							width: '90%',
							maxHeight: '80vh',
							overflow: 'auto',
							boxShadow:
								'0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
						}}
					>
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
								marginBottom: '1.5rem',
							}}
						>
							<h2
								style={{
									fontSize: '1.5rem',
									fontWeight: '600',
									color: '#1f2937',
									margin: 0,
									display: 'flex',
									alignItems: 'center',
									gap: '0.5rem',
								}}
							>
								<FiActivity />
								Recent Activity
							</h2>
							<button
								type="button"
								onClick={() => setShowActivityModal(false)}
								style={{
									background: 'none',
									border: 'none',
									fontSize: '1.5rem',
									color: '#6b7280',
									cursor: 'pointer',
									padding: '0.25rem',
									borderRadius: '0.25rem',
								}}
							>
								×
							</button>
						</div>

						<div
							style={{
								backgroundColor: '#f8fafc',
								borderRadius: '0.5rem',
								padding: '1rem',
								border: '1px solid #e2e8f0',
							}}
						>
							{recentActivity && recentActivity.length > 0 ? (
								<div
									style={{
										display: 'flex',
										flexDirection: 'column',
										gap: '0.75rem',
									}}
								>
									{recentActivity.slice(0, 10).map((item, index) => (
										<div
											key={String(item.id ?? item.timestamp ?? index)}
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: '0.75rem',
												padding: '0.75rem',
												background: '#ffffff',
												borderRadius: '0.375rem',
												border: '1px solid #e5e7eb',
											}}
										>
											<div
												style={{
													width: '8px',
													height: '8px',
													borderRadius: '50%',
													background: item.success ? '#10b981' : '#ef4444',
												}}
											/>
											<div style={{ flex: 1 }}>
												<div
													style={{
														fontSize: '0.875rem',
														fontWeight: '500',
														color: '#374151',
													}}
												>
													{item.action}
												</div>
												<div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
													{new Date(item.timestamp).toLocaleString()}
												</div>
												{item.details && (
													<div
														style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}
													>
														{item.details}
													</div>
												)}
											</div>
										</div>
									))}
								</div>
							) : (
								<div
									style={{
										textAlign: 'center',
										padding: '2rem',
										color: '#6b7280',
										fontSize: '0.9rem',
									}}
								>
									<FiActivity style={{ fontSize: '2rem', marginBottom: '1rem', opacity: 0.5 }} />
									<div>No recent activity found</div>
									<div style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>
										Complete OAuth flows to see activity history
									</div>
								</div>
							)}
						</div>

						<div
							style={{
								marginTop: '1.5rem',
								display: 'flex',
								justifyContent: 'flex-end',
								gap: '0.75rem',
							}}
						>
							<button
								type="button"
								onClick={() => setShowActivityModal(false)}
								style={{
									padding: '0.5rem 1rem',
									backgroundColor: '#f3f4f6',
									color: '#374151',
									border: '1px solid #d1d5db',
									borderRadius: '0.375rem',
									fontSize: '0.875rem',
									fontWeight: '500',
									cursor: 'pointer',
								}}
							>
								Close
							</button>
						</div>
					</div>
				</div>
			)}
			{/* Force refresh to clear cache */}
		</>
	);
};

export default Dashboard;
