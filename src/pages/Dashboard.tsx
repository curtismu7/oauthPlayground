/**
 * Dashboard — home page: API status, endpoints, quick access flows, recent activity.
 * Follows migrate_cursor.md consistency (Ping headers, #111827/#1f2937 text, collapsible sections).
 * See docs/updates-to-apps/dashboard-updates.md.
 */
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppVersionBadge from '../components/AppVersionBadge';
import { Icon } from '../components/Icon/Icon';
import { CollapsibleHeader } from '../services/collapsibleHeaderService';
import {
	getAppUrlForDomain,
	getCustomDomain,
	saveCustomDomain,
} from '../services/customDomainService';
import {
	type DetailedServerStatus,
	fetchDetailedHealth,
	formatBytes,
	formatUptime,
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
	const [detailedServers, setDetailedServers] = useState<DetailedServerStatus[]>([]);

	// Collapsible sections state (all sections use Ping red/white, narrow header, common expand/collapse icon)
	const [collapsedSections, setCollapsedSections] = useState({
		dashboardHeader: false,
		apiStatus: false,
		config: false,
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

	// Fetch detailed server health (same data as API Status page)
	const fetchServerHealth = useCallback(async () => {
		const servers = await fetchDetailedHealth();
		setDetailedServers(servers);
	}, []);

	useEffect(() => {
		fetchServerHealth();
	}, [fetchServerHealth]);

	const hasSavedCredentials = checkSavedCredentials();

	// Custom domain: editable in Config section; stored in SQLite + IndexedDB via customDomainService
	const [customDomain, setCustomDomain] = useState('');
	const [savingDomain, setSavingDomain] = useState(false);
	const [domainError, setDomainError] = useState<string | null>(null);

	useEffect(() => {
		getCustomDomain().then(setCustomDomain);
	}, []);

	const appDisplayUrl = customDomain
		? getAppUrlForDomain(customDomain)
		: 'https://api.pingdemo.com:3000';

	const handleSaveCustomDomain = useCallback(async () => {
		if (!customDomain.trim()) return;
		setDomainError(null);
		setSavingDomain(true);
		try {
			const newAppUrl = await saveCustomDomain(customDomain.trim());
			v4ToastManager.showSuccess('saveConfigurationSuccess');
			window.location.href = `${newAppUrl}/dashboard`;
		} catch (err) {
			setDomainError(err instanceof Error ? err.message : 'Failed to save domain');
			v4ToastManager.showError('networkError');
		} finally {
			setSavingDomain(false);
		}
	}, [customDomain]);

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
			await fetchServerHealth();
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

	// Current backend API endpoints (see docs/updates-to-apps/dashboard-updates.md and server.js)
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
		{ method: 'GET', path: '/api/settings/custom-domain', desc: 'Get custom domain (SQLite)' },
		{ method: 'POST', path: '/api/settings/custom-domain', desc: 'Save custom domain (SQLite)' },
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

						<div className="row g-3">
							{detailedServers.map((server) => (
								<div key={server.name} className="col-md-6">
									<div className="card h-100">
										<div className="card-body">
											<div className="d-flex align-items-center gap-2 mb-2">
												<span
													className={statusBadgeClass(
														server.status === 'online'
															? 'active'
															: server.status === 'checking'
																? 'pending'
																: 'error'
													)}
												>
													{server.status === 'online'
														? 'Online'
														: server.status === 'checking'
															? 'Checking...'
															: 'Offline'}
												</span>
												<span className="fw-600 text-dark">{server.name}</span>
											</div>
											{server.error && <p className="text-danger small mb-2">{server.error}</p>}
											{server.healthData && (
												<ul className="list-unstyled small mb-0 text-dark">
													<li className="d-flex justify-content-between py-1 border-bottom border-light">
														<span className="text-muted">Port</span>
														<span>
															{server.port} ({server.protocol})
														</span>
													</li>
													<li className="d-flex justify-content-between py-1 border-bottom border-light">
														<span className="text-muted">Version</span>
														<span>{server.healthData.version}</span>
													</li>
													<li className="d-flex justify-content-between py-1 border-bottom border-light">
														<span className="text-muted">Environment</span>
														<span>{server.healthData.environment}</span>
													</li>
													{server.healthData.uptimeSeconds > 0 && (
														<li className="d-flex justify-content-between py-1 border-bottom border-light">
															<span className="text-muted">Uptime</span>
															<span>{formatUptime(server.healthData.uptimeSeconds)}</span>
														</li>
													)}
													{server.lastChecked && (
														<li className="d-flex justify-content-between py-1 border-bottom border-light">
															<span className="text-muted">Last checked</span>
															<span>{server.lastChecked.toLocaleTimeString()}</span>
														</li>
													)}
													{server.port !== 3000 && (
														<>
															<li className="d-flex justify-content-between py-1 border-bottom border-light">
																<span className="text-muted">Node</span>
																<span>{server.healthData.node.version}</span>
															</li>
															<li className="d-flex justify-content-between py-1 border-bottom border-light">
																<span className="text-muted">Memory</span>
																<span>
																	{formatBytes(server.healthData.memory.heapUsed)} /{' '}
																	{formatBytes(server.healthData.memory.heapTotal)}
																</span>
															</li>
															<li className="d-flex justify-content-between py-1 border-bottom border-light">
																<span className="text-muted">CPU</span>
																<span>{server.healthData.cpuUsage.avg1mPercent.toFixed(1)}%</span>
															</li>
															<li className="d-flex justify-content-between py-1">
																<span className="text-muted">Requests</span>
																<span>
																	{server.healthData.requestStats.totalRequests}
																	{server.healthData.requestStats.errorRate > 0
																		? ` (${server.healthData.requestStats.errorRate.toFixed(1)}% errors)`
																		: ' (no errors)'}
																</span>
															</li>
														</>
													)}
												</ul>
											)}
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				</CollapsibleHeader>
			</div>

			{/* Config — custom domain: edit, save to SQLite + IndexedDB, redirect to new URL */}
			<div className="section-wrap">
				<CollapsibleHeader
					title="Config"
					subtitle="App URL and custom domain (always HTTPS)"
					icon={<Icon name="cog" />}
					theme="ping"
					variant="compact"
					defaultCollapsed={collapsedSections.config}
					collapsed={collapsedSections.config}
					onToggle={() => toggleSection('config')}
				>
					<div className="card-body card-body--lg">
						<div className="d-flex flex-column gap-2">
							<div className="d-flex align-items-center gap-2 flex-wrap">
								<span className="fw-600 text-muted">App URL (HTTPS):</span>
								<code className="text-small fw-600" style={{ color: '#111827' }}>
									{appDisplayUrl}
								</code>
							</div>
							<div className="d-flex flex-column gap-2" style={{ maxWidth: '400px' }}>
								<label htmlFor="dashboard-custom-domain" className="fw-600 text-muted text-small">
									Custom domain (hostname only)
								</label>
								<input
									id="dashboard-custom-domain"
									type="text"
									className="form-control"
									placeholder="api.pingdemo.com"
									value={customDomain}
									onChange={(e) => {
										setCustomDomain(e.target.value);
										setDomainError(null);
									}}
									aria-describedby="dashboard-domain-hint dashboard-domain-error"
								/>
								{domainError && (
									<p
										id="dashboard-domain-error"
										className="text-small mb-0"
										style={{ color: '#dc2626' }}
									>
										{domainError}
									</p>
								)}
								<p id="dashboard-domain-hint" className="text-small text-muted mb-0">
									Saved to SQLite (backend) and IndexedDB. After saving, the app will open at the
									new URL.
								</p>
								<button
									type="button"
									className="btn btn-oauth align-self-start"
									onClick={handleSaveCustomDomain}
									disabled={savingDomain || !customDomain.trim()}
									aria-label="Save custom domain and open app at new URL"
								>
									{savingDomain ? (
										<>
											<Icon
												name="refresh"
												size="sm"
												style={{ animation: 'spin 1s linear infinite' }}
											/>
											Saving…
										</>
									) : (
										<>
											<Icon name="content-save" size="sm" />
											Save and use this domain
										</>
									)}
								</button>
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
