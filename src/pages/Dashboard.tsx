import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppVersionBadge from '../components/AppVersionBadge';
import { Icon } from '../components/Icon/Icon';
import { CollapsibleHeader } from '../services/collapsibleHeaderService';
import {
	checkServerStatusForDashboard,
	type SimpleServerStatus,
} from '../services/serverHealthService';
import { type ActivityItem, getRecentActivity } from '../utils/activityTracker';
import { checkSavedCredentials } from '../utils/configurationStatus';
import { v4ToastManager } from '../utils/v4ToastMessages';
import '../styles/dashboard.css';

type FlowPalette = 'oauth' | 'oidc' | 'pingone';

/** Build flow link class: btn btn-{palette} and optionally btn-outline for secondary */
function flowLinkClass(variant: 'primary' | 'secondary', palette: FlowPalette): string {
	const base = `btn btn-${palette}`;
	return variant === 'secondary' ? `${base} btn-outline` : base;
}

/** Status badge class from status key */
function statusBadgeClass(status: 'active' | 'pending' | 'error'): string {
	const map = { active: 'badge-success', pending: 'badge-warning', error: 'badge-danger' };
	return `badge ${map[status] ?? map.active}`;
}

const Dashboard = () => {
	const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [serverStatus, setServerStatus] = useState<SimpleServerStatus>({
		frontend: 'online',
		backend: 'checking',
	});

	// Collapsible sections state (all sections use Ping red/white, narrow header, common expand/collapse icon)
	const [collapsedSections, setCollapsedSections] = useState({
		dashboardHeader: false,
		apiStatus: false,
		apiEndpoints: true,
		quickAccess: false,
		recentActivity: false,
	});

	const toggleSection = useCallback((section: keyof typeof collapsedSections) => {
		setCollapsedSections((prev) => ({
			...prev,
			[section]: !prev[section],
		}));
	}, []);

	// Check server status using shared service (same as API Status page)
	const checkServerStatus = useCallback(async () => {
		const status = await checkServerStatusForDashboard();
		setServerStatus(status);
	}, []);

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
			} catch {
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
		} catch {
			// Handle error silently
		} finally {
			setIsRefreshing(false);
		}
	};

	const handleRefresh = async () => {
		try {
			await refreshDashboard();
			v4ToastManager.showSuccess('saveConfigurationSuccess');
		} catch {
			v4ToastManager.showError('networkError');
		}
	};

	// Current backend API endpoints (see docs/DASHBOARD_UPDATES.md and server.js)
	const apiEndpoints = [
		{ method: 'GET', path: '/api/health', desc: 'Backend health check' },
		{ method: 'GET', path: '/api/env-config', desc: 'Environment defaults' },
		{ method: 'GET', path: '/api/version', desc: 'Backend version' },
		{ method: 'POST', path: '/api/token-exchange', desc: 'Exchange authorization code for tokens' },
		{ method: 'POST', path: '/api/client-credentials', desc: 'Client credentials grant' },
		{ method: 'POST', path: '/api/introspect-token', desc: 'Token introspection' },
		{ method: 'GET', path: '/api/userinfo', desc: 'UserInfo (OAuth)' },
		{ method: 'POST', path: '/api/validate-token', desc: 'Validate access tokens' },
		{ method: 'POST', path: '/api/device-authorization', desc: 'Device authorization flow' },
		{ method: 'POST', path: '/api/par', desc: 'Pushed Authorization Request' },
		{ method: 'GET', path: '/api/jwks', desc: 'PingOne JWKS' },
		{ method: 'POST', path: '/api/user-jwks', desc: 'Generate JWKS from user key' },
		{ method: 'POST', path: '/api/credentials/save', desc: 'Save credentials' },
		{ method: 'GET', path: '/api/credentials/load', desc: 'Load credentials' },
		{ method: 'GET', path: '/api/environments', desc: 'List environments' },
		{ method: 'POST', path: '/api/pingone/worker-token', desc: 'Worker token' },
		{ method: 'POST', path: '/api/pingone/token', desc: 'Token endpoint proxy' },
		{ method: 'POST', path: '/api/pingone/oidc-discovery', desc: 'OIDC discovery' },
		{ method: 'POST', path: '/api/mfa/challenge/initiate', desc: 'MFA challenge' },
		{ method: 'POST', path: '/api/device/register', desc: 'FIDO2 device registration' },
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
		<div className="dashboard-page">
			{/* Dashboard header — collapsible, Ping red/white, narrow */}
			<div className="section-wrap">
				<CollapsibleHeader
					title="Dashboard"
					subtitle="Monitor system status, explore OAuth flows, and track recent activity"
					icon={<Icon name="chart-box" />}
					theme="ping"
					variant="compact"
					defaultCollapsed={collapsedSections.dashboardHeader}
					collapsed={collapsedSections.dashboardHeader}
					onToggle={() => toggleSection('dashboardHeader')}
				>
					<div className="card-body card-body--lg d-flex flex-column align-items-center gap-2">
						<AppVersionBadge type="app" />
						<AppVersionBadge type="mfa" />
						<AppVersionBadge type="unified" />
						<AppVersionBadge type="protect" />
					</div>
				</CollapsibleHeader>
			</div>

			{/* API Status — shared with /api-status page; single place for server health */}
			<div className="section-wrap">
				<CollapsibleHeader
					title="API Status"
					subtitle="Server health (shared with API Status page)"
					icon={<Icon name="server" />}
					theme="ping"
					variant="compact"
					defaultCollapsed={collapsedSections.apiStatus}
					collapsed={collapsedSections.apiStatus}
					onToggle={() => toggleSection('apiStatus')}
				>
					<div className="card-body card-body--lg">
						<div className="d-flex gap-2 mb-3 justify-content-between flex-wrap align-items-center">
							<span
								className={`${statusBadgeClass(hasSavedCredentials ? 'active' : 'error')} d-flex align-items-center gap-2 p-2 text-small`}
							>
								<Icon name="check-circle" />
								{hasSavedCredentials ? 'Global Configuration Ready' : 'Configuration Missing'}
							</span>
							<div className="d-flex gap-2 align-items-center">
								<button
									type="button"
									className="btn btn-outline-primary"
									onClick={handleRefresh}
									disabled={isRefreshing}
									aria-label="Refresh server status"
								>
									<Icon
										name="refresh"
										size="sm"
										style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }}
									/>
									Refresh
								</button>
								<Link
									to="/api-status"
									className="btn btn-oauth"
									aria-label="Open full API Status page"
								>
									<Icon name="open-in-new" size="sm" />
									API Status
								</Link>
							</div>
						</div>

						<div className="row">
							<div className="col-md-6 mb-3">
								<div className="card">
									<div className="card-body">
										<div className="d-flex align-items-center gap-2 mb-2">
											<span
												className={statusBadgeClass(
													serverStatus.frontend === 'online'
														? 'active'
														: serverStatus.frontend === 'checking'
															? 'pending'
															: 'error'
												)}
											>
												{serverStatus.frontend === 'online'
													? 'Online'
													: serverStatus.frontend === 'checking'
														? 'Checking...'
														: 'Offline'}
											</span>
											<span className="fw-600 text-muted">Frontend</span>
										</div>
									</div>
								</div>
							</div>
							<div className="col-md-6 mb-3">
								<div className="card">
									<div className="card-body">
										<div className="d-flex align-items-center gap-2 mb-2">
											<span
												className={statusBadgeClass(
													serverStatus.backend === 'online'
														? 'active'
														: serverStatus.backend === 'checking'
															? 'pending'
															: 'error'
												)}
											>
												{serverStatus.backend === 'online'
													? 'Online'
													: serverStatus.backend === 'checking'
														? 'Checking...'
														: 'Offline'}
											</span>
											<span className="fw-600 text-muted">Backend API</span>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</CollapsibleHeader>
			</div>

			{/* API Endpoints */}
			<div className="section-wrap">
				<CollapsibleHeader
					title="Available API Endpoints"
					subtitle="Backend API endpoints for OAuth/OIDC operations"
					icon={<Icon name="link" />}
					theme="ping"
					variant="compact"
					defaultCollapsed={collapsedSections.apiEndpoints}
					collapsed={collapsedSections.apiEndpoints}
					onToggle={() => toggleSection('apiEndpoints')}
				>
					<div className="card-body card-body--lg">
						<div className="api-grid">
							{apiEndpoints.map((endpoint, index) => (
								<div key={index} className="api-endpoint-card">
									<div className="d-flex align-items-center gap-2 mb-2">
										<span className={`method-badge method-badge--${endpoint.method.toLowerCase()}`}>
											{endpoint.method}
										</span>
										<code className="text-small fw-600">{endpoint.path}</code>
									</div>
									<p className="text-small text-muted mb-1">{endpoint.desc}</p>
								</div>
							))}
						</div>
					</div>
				</CollapsibleHeader>
			</div>

			{/* Quick Access Flows */}
			<div className="section-wrap">
				<CollapsibleHeader
					title="Quick Access Flows"
					subtitle="Explore OAuth 2.0 and OpenID Connect flows"
					icon={<Icon name="lightning-bolt" />}
					theme="ping"
					variant="compact"
					defaultCollapsed={collapsedSections.quickAccess}
					collapsed={collapsedSections.quickAccess}
					onToggle={() => toggleSection('quickAccess')}
				>
					<div className="card-body card-body--lg">
						<p className="text-muted mb-3" style={{ fontSize: '0.95rem' }}>
							Explore OAuth 2.0 and OpenID Connect flows. Defaults are secure-by-default (Auth Code
							with PKCE).
						</p>

						<div className="quick-access-grid">
							<div className="flow-card">
								<h3>OAuth 2.0</h3>
								<p>
									Standards-based authorization flows. Recommended: Authorization Code (with PKCE
									for public clients).
								</p>
								<div className="flow-buttons">
									<a href="/v8u/unified/oauth-authz" className={flowLinkClass('primary', 'oauth')}>
										Authorization Code
									</a>
									<a href="/v8u/unified/implicit" className={flowLinkClass('secondary', 'oauth')}>
										Implicit Flow
									</a>
									<a
										href="/v8u/unified/device-code"
										className={flowLinkClass('secondary', 'oauth')}
									>
										Device Authorization
									</a>
									<a
										href="/v8u/unified/client-credentials"
										className={flowLinkClass('secondary', 'oauth')}
									>
										Client Credentials
									</a>
								</div>
							</div>

							<div className="flow-card">
								<h3>OpenID Connect</h3>
								<p>Identity layer on top of OAuth 2.0.</p>
								<div className="flow-buttons">
									<a href="/v8u/unified/oauth-authz" className={flowLinkClass('primary', 'oidc')}>
										Authorization Code
									</a>
									<a href="/v8u/unified/hybrid" className={flowLinkClass('secondary', 'oidc')}>
										Hybrid Flow
									</a>
									<a href="/v8u/unified/implicit" className={flowLinkClass('secondary', 'oidc')}>
										Implicit Flow
									</a>
									<a href="/oidc-overview" className={flowLinkClass('secondary', 'oidc')}>
										OIDC Overview
									</a>
								</div>
							</div>

							<div className="flow-card">
								<h3>PingOne Flows</h3>
								<p>PingOne-specific authentication and authorization flows.</p>
								<div className="flow-buttons">
									<a href="/flows/worker-token-v7" className={flowLinkClass('primary', 'pingone')}>
										Worker Token (V7)
									</a>
									<a href="/flows/pingone-par-v7" className={flowLinkClass('secondary', 'pingone')}>
										PAR (V7)
									</a>
									<a
										href="/flows/redirectless-v7-real"
										className={flowLinkClass('secondary', 'pingone')}
									>
										Redirectless Flow (V7)
									</a>
								</div>
							</div>
						</div>
					</div>
				</CollapsibleHeader>
			</div>

			{/* Recent Activity */}
			<div className="section-wrap">
				<CollapsibleHeader
					title="Recent Activity"
					subtitle="Latest OAuth flow runs, credential updates, and API interactions"
					icon={<Icon name="chart-line" />}
					theme="ping"
					variant="compact"
					defaultCollapsed={collapsedSections.recentActivity}
					collapsed={collapsedSections.recentActivity}
					onToggle={() => toggleSection('recentActivity')}
				>
					<div className="card-body card-body--lg">
						<div className="activity-list">
							<ul>
								{recentActivity.length === 0 ? (
									<li className="empty-state">
										<Icon name="chart-line" size="xl" style={{ fontSize: 48 }} />
										<p>No recent activity</p>
										<p className="text-small">Complete an OAuth flow to see activity here</p>
									</li>
								) : (
									recentActivity.slice(0, 10).map((activity, index) => (
										<li key={activity.id || index} className="activity-item">
											<div
												className={`activity-icon activity-icon--${activity.success ? 'success' : 'error'}`}
											>
												{activity.success ? '✓' : '✗'}
											</div>
											<div className="activity-content">
												<div className="activity-action">
													{formatActivityAction(activity.action)}
												</div>
												<div className="activity-time">
													{new Date(activity.timestamp).toLocaleString()}
												</div>
											</div>
										</li>
									))
								)}
							</ul>
						</div>
					</div>
				</CollapsibleHeader>
			</div>
		</div>
	);
};

export default Dashboard;
