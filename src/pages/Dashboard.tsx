/**
 * Dashboard — home page: API status, endpoints, quick access flows, recent activity.
 * Follows migrate_cursor.md consistency (Ping headers, #111827/#1f2937 text, collapsible sections).
 * See docs/updates-to-apps/dashboard-updates.md.
 */
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppVersionBadge from '../components/AppVersionBadge';
import { Icon } from '../components/Icon/Icon';
import { useServerStatusOptional } from '../components/ServerStatusProvider';
import { CollapsibleHeader } from '../services/collapsibleHeaderService';
import {
	getAppUrlForDomain,
	getCustomDomain,
	getDomainFromIndexedDB,
	saveCustomDomain,
} from '../services/customDomainService';
import {
	type DetailedServerStatus,
	fetchDetailedHealth,
	formatBytes,
	formatUptime,
} from '../services/serverHealthService';
import { type ActivityItem, getRecentActivity } from '../utils/activityTracker';
import { checkSavedCredentialsAsync } from '../utils/configurationStatus';
import { credentialManager } from '../utils/credentialManager';
import { UnifiedTokenStorageService } from '../services/unifiedTokenStorageService';
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
	const [refreshMessage, setRefreshMessage] = useState<string | null>(null);
	const [refreshError, setRefreshError] = useState<string | null>(null);
	const [customDomain, setCustomDomain] = useState('');
	const [savingDomain, setSavingDomain] = useState(false);
	const [domainError, setDomainError] = useState<string | null>(null);
	const [hasSavedCredentials, setHasSavedCredentials] = useState(false);

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

	const { isOnline } = useServerStatusOptional();

	// Check credentials from unified storage (IndexedDB/SQLite) and localStorage
	useEffect(() => {
		const checkCredentials = async () => {
			const hasCredentials = await checkSavedCredentialsAsync();
			setHasSavedCredentials(hasCredentials);
			
			// Debug: Log credential status
			const configCreds = credentialManager.loadConfigCredentials();
			const authzCreds = credentialManager.loadAuthzFlowCredentials();
			const localStorageCreds = localStorage.getItem('oauth_config');
			const pingoneCreds = localStorage.getItem('pingone_config_credentials');
			
			// Check unified storage
			const unifiedStorage = UnifiedTokenStorageService.getInstance();
			const unifiedCreds = await unifiedStorage.getOAuthCredentials();
			
			console.group('[Dashboard] 🔐 Credential Check');
			console.log('✅ hasSavedCredentials:', hasCredentials);
			console.log('🗄️  Unified Storage (IndexedDB/SQLite):', unifiedCreds || '❌ none');
			console.log('📋 Config Credentials:', {
				environmentId: configCreds?.environmentId || '(empty)',
				clientId: configCreds?.clientId || '(empty)',
				hasClientSecret: !!configCreds?.clientSecret,
			});
			console.log('🔑 Authz Credentials:', {
				environmentId: authzCreds?.environmentId || '(empty)',
				clientId: authzCreds?.clientId || '(empty)',
				hasClientSecret: !!authzCreds?.clientSecret,
			});
			console.log('💾 LocalStorage Keys:', {
				oauth_config: localStorageCreds ? '✅ present' : '❌ missing',
				pingone_config_credentials: pingoneCreds ? '✅ present' : '❌ missing',
			});
			console.groupEnd();
		};
		
		checkCredentials();
	}, []);


	// Resolve domain: when backend down use IndexedDB + env/default only (avoids 404); when up use getCustomDomain (API).
	useEffect(() => {
		if (!isOnline) {
			getDomainFromIndexedDB().then((idb) => {
				if (idb) {
					setCustomDomain(idb);
					return;
				}
				const env = (import.meta.env.VITE_PUBLIC_APP_URL as string) || '';
				const fromEnv = env.replace(/^https?:\/\//i, '').split('/')[0].split(':')[0].trim();
				setCustomDomain(fromEnv || 'api.pingdemo.com');
			});
			return;
		}
		getCustomDomain().then(setCustomDomain);
	}, [isOnline]);

	const appDisplayUrl =
		typeof customDomain === 'string' && customDomain.trim()
			? getAppUrlForDomain(customDomain.trim())
			: 'https://api.pingdemo.com:3000';

	const handleSaveCustomDomain = useCallback(async () => {
		if (!customDomain.trim()) return;
		setDomainError(null);
		setSavingDomain(true);
		try {
			const newAppUrl = await saveCustomDomain(customDomain.trim());
			window.location.href = `${newAppUrl}/dashboard`;
		} catch (err) {
			setDomainError(err instanceof Error ? err.message : 'Failed to save domain');
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

	const handleRefresh = useCallback(async () => {
		setRefreshMessage(null);
		setRefreshError(null);
		try {
			await refreshDashboard();
			setRefreshMessage('Refreshed');
		} catch {
			setRefreshError('Refresh failed. Try again.');
		}
	}, []);

	// Clear refresh success message after a short delay (contextual feedback per toast-replace)
	useEffect(() => {
		if (!refreshMessage) return;
		const t = setTimeout(() => setRefreshMessage(null), 4000);
		return () => clearTimeout(t);
	}, [refreshMessage]);

	const PINGONE_DOC_BASE = 'https://developer.pingidentity.com/pingone-api';
	const PINGONE_AUTH_DOC = `${PINGONE_DOC_BASE}/auth/introduction.html`;
	const PINGONE_PLATFORM_DOC = `${PINGONE_DOC_BASE}/platform/introduction.html`;
	const PINGONE_MFA_DOC = `${PINGONE_DOC_BASE}/mfa/introduction.html`;

	// Current backend API endpoints; docUrl links to PingOne Platform API docs (intro page per section)
	const apiEndpoints: Array<{ method: string; path: string; desc: string; docUrl?: string }> = [
		{ method: 'GET', path: '/api/health', desc: 'Backend health check' },
		{ method: 'GET', path: '/api/env-config', desc: 'Environment defaults' },
		{ method: 'GET', path: '/api/version', desc: 'Backend version' },
		{ method: 'POST', path: '/api/token-exchange', desc: 'Exchange authorization code for tokens', docUrl: PINGONE_AUTH_DOC },
		{ method: 'POST', path: '/api/client-credentials', desc: 'Client credentials grant', docUrl: PINGONE_AUTH_DOC },
		{ method: 'POST', path: '/api/introspect-token', desc: 'Token introspection', docUrl: PINGONE_AUTH_DOC },
		{ method: 'GET', path: '/api/userinfo', desc: 'UserInfo (OAuth)', docUrl: PINGONE_AUTH_DOC },
		{ method: 'POST', path: '/api/validate-token', desc: 'Validate access tokens', docUrl: PINGONE_AUTH_DOC },
		{ method: 'POST', path: '/api/device-authorization', desc: 'Device authorization flow', docUrl: PINGONE_AUTH_DOC },
		{ method: 'POST', path: '/api/par', desc: 'Pushed Authorization Request', docUrl: PINGONE_AUTH_DOC },
		{ method: 'GET', path: '/api/jwks', desc: 'PingOne JWKS', docUrl: PINGONE_AUTH_DOC },
		{ method: 'POST', path: '/api/user-jwks', desc: 'Generate JWKS from user key' },
		{ method: 'POST', path: '/api/credentials/save', desc: 'Save credentials' },
		{ method: 'GET', path: '/api/credentials/load', desc: 'Load credentials' },
		{ method: 'GET', path: '/api/settings/custom-domain', desc: 'Get custom domain (SQLite)' },
		{ method: 'POST', path: '/api/settings/custom-domain', desc: 'Save custom domain (SQLite)' },
		{ method: 'GET', path: '/api/environments', desc: 'List environments', docUrl: PINGONE_PLATFORM_DOC },
		{ method: 'POST', path: '/api/pingone/worker-token', desc: 'Worker token', docUrl: PINGONE_AUTH_DOC },
		{ method: 'POST', path: '/api/pingone/token', desc: 'Token endpoint proxy', docUrl: PINGONE_AUTH_DOC },
		{ method: 'POST', path: '/api/pingone/oidc-discovery', desc: 'OIDC discovery', docUrl: PINGONE_AUTH_DOC },
		{ method: 'POST', path: '/api/mfa/challenge/initiate', desc: 'MFA challenge', docUrl: PINGONE_MFA_DOC },
		{ method: 'POST', path: '/api/device/register', desc: 'FIDO2 device registration', docUrl: PINGONE_MFA_DOC },
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
							{hasSavedCredentials ? (
								<span
									className={`${statusBadgeClass('active')} d-flex align-items-center gap-2 p-2 text-small`}
								>
									<Icon name="check-circle" />
									Global Configuration Ready
								</span>
							) : (
								<Link
									to="/configuration"
									className={`${statusBadgeClass('error')} d-flex align-items-center gap-2 p-2 text-small text-decoration-none`}
								>
									<Icon name="alert-circle" />
									Configuration Missing - Click to Configure
								</Link>
							)}
							<div className="d-flex gap-2 align-items-center flex-wrap">
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
								{refreshMessage && (
									<span className="text-success small d-flex align-items-center gap-1" role="status">
										<Icon name="check-circle" size="sm" />
										{refreshMessage}
									</span>
								)}
								{refreshError && (
									<span className="text-danger small d-flex align-items-center gap-1" role="alert">
										<Icon name="alert-circle" size="sm" />
										{refreshError}
									</span>
								)}
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
						<p className="text-small text-muted mb-3">
							App backend routes; where applicable, links go to{' '}
							<a
								href={`${PINGONE_DOC_BASE}/introduction.html`}
								target="_blank"
								rel="noopener noreferrer"
								className="text-primary"
							>
								PingOne Platform API docs
							</a>
							.
						</p>
						<div className="api-grid">
							{apiEndpoints.map((endpoint, index) => (
								<div key={index} className="api-endpoint-card">
									<div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
										<span className={`method-badge method-badge--${endpoint.method.toLowerCase()}`}>
											{endpoint.method}
										</span>
										<code className="text-small fw-600">{endpoint.path}</code>
										{endpoint.docUrl && (
											<a
												href={endpoint.docUrl}
												target="_blank"
												rel="noopener noreferrer"
												className="ms-auto text-nowrap text-primary small"
												title="Open in PingOne docs"
											>
												PingOne docs
											</a>
										)}
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
