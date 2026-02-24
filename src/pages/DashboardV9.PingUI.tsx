/**
 * @file DashboardV9.PingUI.tsx
 * @description V9 Dashboard with PingOne UI and New Messaging System
 * @version 9.25.1
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Import existing components
import AppVersionBadge from '@/components/AppVersionBadge';
import BootstrapIcon from '@/components/BootstrapIcon';
import { ExpandCollapseAllControls } from '@/components/ExpandCollapseAllControls';
import { getBootstrapIconName } from '@/components/iconMapping';
import { PingUIWrapper } from '@/components/PingUIWrapper';
import { CollapsibleHeader } from '@/services/collapsibleHeaderService';
import { useSectionsViewMode } from '@/services/sectionsViewModeService';
import { type ActivityItem, getRecentActivity } from '@/utils/activityTracker';
import { checkSavedCredentials } from '@/utils/configurationStatus';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

// V9 Flow Categories
interface V9FlowCategory {
	id: string;
	title: string;
	description: string;
	palette: 'oauth' | 'oidc' | 'pingone' | 'mfa' | 'enterprise';
	flows: V9Flow[];
}

interface V9Flow {
	id: string;
	title: string;
	description: string;
	route: string;
	variant: 'primary' | 'secondary';
	category: string;
	v9Route: string;
	v8uRoute?: string;
	v7Route?: string;
	status: 'v9' | 'v8u' | 'v7' | 'migrated' | 'planned';
}

// V9 Flow Categories with upgraded routes
const V9_FLOW_CATEGORIES: V9FlowCategory[] = [
	{
		id: 'oauth',
		title: 'OAuth 2.0 Flows',
		description: 'Standard OAuth 2.0 authorization flows',
		palette: 'oauth',
		flows: [
			{
				id: 'authorization-code',
				title: 'Authorization Code',
				description: 'OAuth 2.0 Authorization Code with PKCE',
				route: '/v9/flows/oauth-authorization-code',
				variant: 'primary',
				category: 'oauth',
				v9Route: '/v9/flows/oauth-authorization-code',
				v8uRoute: '/v8u/unified/oauth-authz',
				status: 'v9',
			},
			{
				id: 'client-credentials',
				title: 'Client Credentials',
				description: 'Service-to-service authentication',
				route: '/v9/flows/client-credentials',
				variant: 'secondary',
				category: 'oauth',
				v9Route: '/v9/flows/client-credentials',
				v8uRoute: '/v8u/unified/client-credentials',
				status: 'v9',
			},
			{
				id: 'device-authorization',
				title: 'Device Authorization',
				description: 'Device-based authentication flow',
				route: '/v9/flows/device-authorization',
				variant: 'secondary',
				category: 'oauth',
				v9Route: '/v9/flows/device-authorization',
				v8uRoute: '/v8u/unified/device-code',
				status: 'v9',
			},
			{
				id: 'implicit',
				title: 'Implicit Flow',
				description: 'Deprecated implicit grant flow',
				route: '/v9/flows/implicit',
				variant: 'secondary',
				category: 'oauth',
				v9Route: '/v9/flows/implicit',
				v8uRoute: '/v8u/unified/implicit',
				status: 'v9',
			},
		],
	},
	{
		id: 'oidc',
		title: 'OpenID Connect',
		description: 'Identity layer on top of OAuth 2.0',
		palette: 'oidc',
		flows: [
			{
				id: 'authorization-code-oidc',
				title: 'Authorization Code',
				description: 'OIDC Authorization Code with ID Token',
				route: '/v9/flows/oauth-authorization-code-oidc',
				variant: 'primary',
				category: 'oidc',
				v9Route: '/v9/flows/oauth-authorization-code-oidc',
				v8uRoute: '/v8u/unified/oauth-authz',
				status: 'v9',
			},
			{
				id: 'hybrid',
				title: 'Hybrid Flow',
				description: 'OIDC Hybrid Flow',
				route: '/v9/flows/hybrid',
				variant: 'secondary',
				category: 'oidc',
				v9Route: '/v9/flows/hybrid',
				v8uRoute: '/v8u/unified/hybrid',
				status: 'v9',
			},
			{
				id: 'implicit-oidc',
				title: 'Implicit Flow',
				description: 'OIDC Implicit Flow',
				route: '/v9/flows/implicit-oidc',
				variant: 'secondary',
				category: 'oidc',
				v9Route: '/v9/flows/implicit-oidc',
				v8uRoute: '/v8u/unified/implicit',
				status: 'v9',
			},
		],
	},
	{
		id: 'pingone',
		title: 'PingOne Flows',
		description: 'PingOne-specific authentication flows',
		palette: 'pingone',
		flows: [
			{
				id: 'worker-token',
				title: 'Worker Token',
				description: 'PingOne Worker Token authentication',
				route: '/v9/flows/worker-token',
				variant: 'primary',
				category: 'pingone',
				v9Route: '/v9/flows/worker-token',
				v8uRoute: '/flows/worker-token-v6',
				status: 'migrated',
			},
			{
				id: 'par',
				title: 'PAR',
				description: 'Pushed Authorization Request',
				route: '/v9/flows/par',
				variant: 'secondary',
				category: 'pingone',
				v9Route: '/v9/flows/par',
				v8uRoute: '/flows/pingone-par-v6',
				status: 'migrated',
			},
			{
				id: 'redirectless',
				title: 'Redirectless',
				description: 'PingOne Redirectless Flow',
				route: '/v9/flows/redirectless',
				variant: 'secondary',
				category: 'pingone',
				v9Route: '/v9/flows/redirectless',
				v8uRoute: '/flows/redirectless-v6-real',
				status: 'migrated',
			},
		],
	},
	{
		id: 'mfa',
		title: 'Multi-Factor Authentication',
		description: 'PingOne MFA authentication flows',
		palette: 'mfa',
		flows: [
			{
				id: 'webauthn',
				title: 'WebAuthn (FIDO2)',
				description: 'Passwordless authentication with security keys',
				route: '/v9/mfa/webauthn',
				variant: 'primary',
				category: 'mfa',
				v9Route: '/v9/mfa/webauthn',
				v8uRoute: '/v8/mfa/register/fido2',
				status: 'migrated',
			},
			{
				id: 'email-mfa',
				title: 'Email MFA',
				description: 'Email-based multi-factor authentication',
				route: '/v9/mfa/email-mfa',
				variant: 'secondary',
				category: 'mfa',
				v9Route: '/v9/mfa/email-mfa',
				v8uRoute: '/v8/mfa/register/email',
				status: 'migrated',
			},
			{
				id: 'sms-mfa',
				title: 'SMS MFA',
				description: 'SMS-based multi-factor authentication',
				route: '/v9/mfa/sms-mfa',
				variant: 'secondary',
				category: 'mfa',
				v9Route: '/v9/mfa/sms-mfa',
				v8uRoute: '/v8/mfa/register/mobile',
				status: 'migrated',
			},
		],
	},
	{
		id: 'enterprise',
		title: 'Enterprise Features',
		description: 'Advanced enterprise authentication features',
		palette: 'enterprise',
		flows: [
			{
				id: 'token-management',
				title: 'Token Management',
				description: 'Token introspection and management',
				route: '/v9/enterprise/token-management',
				variant: 'primary',
				category: 'enterprise',
				v9Route: '/v9/enterprise/token-management',
				v8uRoute: '/v8u/token-monitoring',
				status: 'v9',
			},
			{
				id: 'advanced-security',
				title: 'Advanced Security',
				description: 'Advanced security settings and monitoring',
				route: '/v9/enterprise/advanced-security',
				variant: 'secondary',
				category: 'enterprise',
				v9Route: '/v9/enterprise/advanced-security',
				v8uRoute: '/v8/enterprise/security',
				status: 'v9',
			},
		],
	},
];

// V9 Flow Button Themes
const V9_FLOW_THEMES = {
	oauth: {
		primary: {
			bg: '#2563eb',
			border: '#1d4ed8',
			color: '#ffffff',
			hoverBg: '#1d4ed8',
			hoverBorder: '#1e40af',
			hoverColor: '#ffffff',
			shadow: '0 2px 4px rgba(37, 99, 235, 0.25)',
			hoverShadow: '0 4px 10px rgba(37, 99, 235, 0.35)',
		},
		secondary: {
			bg: '#64748b',
			border: '#4b5563',
			color: '#ffffff',
			hoverBg: '#4b5563',
			hoverBorder: '#374151',
			hoverColor: '#ffffff',
			shadow: '0 2px 4px rgba(100, 116, 139, 0.2)',
			hoverShadow: '0 4px 8px rgba(100, 116, 139, 0.3)',
		},
	},
	oidc: {
		primary: {
			bg: '#dc2626',
			border: '#b91c1c',
			color: '#ffffff',
			hoverBg: '#b91c1c',
			hoverBorder: '#991b1b',
			hoverColor: '#ffffff',
			shadow: '0 2px 4px rgba(220, 38, 38, 0.25)',
			hoverShadow: '0 4px 10px rgba(220, 38, 38, 0.35)',
		},
		secondary: {
			bg: '#a855f7',
			border: '#9333ea',
			color: '#ffffff',
			hoverBg: '#9333ea',
			hoverBorder: '#7c3aed',
			hoverColor: '#ffffff',
			shadow: '0 2px 4px rgba(168, 85, 247, 0.2)',
			hoverShadow: '0 4px 8px rgba(168, 85, 247, 0.3)',
		},
	},
	pingone: {
		primary: {
			bg: '#059669',
			border: '#047857',
			color: '#ffffff',
			hoverBg: '#047857',
			hoverBorder: '#059669',
			hoverColor: '#ffffff',
			shadow: '0 2px 4px rgba(5, 150, 105, 0.25)',
			hoverShadow: '0 4px 10px rgba(5, 150, 105, 0.35)',
		},
		secondary: {
			bg: '#0891b2',
			border: '#0e7490',
			color: '#ffffff',
			hoverBg: '#0e7490',
			hoverBorder: '#059669',
			hoverColor: '#ffffff',
			shadow: '0 2px 4px rgba(8, 145, 178, 0.2)',
			hoverShadow: '0 4px 8px rgba(8, 145, 178, 0.3)',
		},
	},
	mfa: {
		primary: {
			bg: '#7c3aed',
			border: '#6d28d9',
			color: '#ffffff',
			hoverBg: '#6d28d9',
			hoverBorder: '#5b21b6',
			hoverColor: '#ffffff',
			shadow: '0 2px 4px rgba(124, 58, 237, 0.25)',
			hoverShadow: '0 4px 10px rgba(124, 58, 237, 0.35)',
		},
		secondary: {
			bg: '#a78bfa',
			border: '#9333ea',
			color: '#ffffff',
			hoverBg: '#9333ea',
			hoverBorder: '#7c3aed',
			hoverColor: '#ffffff',
			shadow: '0 2px 4px rgba(167, 139, 250, 0.2)',
			hoverShadow: '0 4px 8px rgba(167, 139, 250, 0.3)',
		},
	},
	enterprise: {
		primary: {
			bg: '#6366f1',
			border: '#4f46e5',
			color: '#ffffff',
			hoverBg: '#4f46e5',
			hoverBorder: '#4c1d95',
			hoverColor: '#ffffff',
			shadow: '0 2px 4px rgba(99, 102, 241, 0.25)',
			hoverShadow: '0 4px 10px rgba(99, 102, 241, 0.35)',
		},
		secondary: {
			bg: '#8b5cf6',
			border: '#7c3aed',
			color: '#ffffff',
			hoverBg: '#7c3aed',
			hoverBorder: '#6d28d9',
			hoverColor: '#ffffff',
			shadow: '0 2px 4px rgba(139, 92, 246, 0.2)',
			hoverShadow: '0 4px 8px rgba(139, 92, 246, 0.3)',
		},
	},
	},
}

// V9 Flow Link Component
const V9FlowLink: React.FC<{
	flow: V9Flow;
	onClick?: () => void;
	disabled?: boolean;
}> = ({ flow, onClick, disabled = false }) => {
	const navigate = useNavigate();
	const handleClick = useCallback(() => {
		if (disabled) return;

		// Show migration message if not V9
		if (flow.status !== 'v9') {
			toastV8.warning(
				'Migration Required',
				`${flow.title} is not yet available in V9. Redirecting to ${flow.status.toUpperCase()} version.`
			);
		}

		// Navigate to appropriate route
		const targetRoute = flow.v9Route || flow.v8uRoute || flow.v7Route;
		if (targetRoute) {
			navigate(targetRoute);
		}

		onClick?.();
	}, [navigate, onClick, disabled, flow]);

	const theme = V9_FLOW_THEMES[flow.palette as keyof typeof V9_FLOW_THEMES];
	const buttonTheme = theme[flow.variant];

	return (
		<button
			type="button"
			onClick={handleClick}
			disabled={disabled}
			className="btn position-relative d-inline-flex align-items-center justify-content-center p-3 rounded-3 fw-semibold text-decoration-none text-center min-h-[2.5rem] line-height-1.2 text-nowrap overflow-hidden text-ellipsis max-w-[100%]"
			style={{
				background: buttonTheme.bg,
				color: buttonTheme.color,
				border: `2px solid ${buttonTheme.border}`,
				boxShadow: buttonTheme.shadow,
				transition: 'all 0.15s ease-in-out',
				minWidth: '200px',
			}}
			onMouseEnter={(e) => {
				e.currentTarget.style.background = buttonTheme.hoverBg;
				e.currentTarget.style.borderColor = buttonTheme.hoverBorder;
				e.currentTarget.style.boxShadow = buttonTheme.hoverShadow;
			}}
			onMouseLeave={(e) => {
				e.currentTarget.style.background = buttonTheme.bg;
				e.currentTarget.style.borderColor = buttonTheme.border;
				e.currentTarget.style.boxShadow = buttonTheme.shadow;
			}}
		>
			<BootstrapIcon
				icon={getBootstrapIconName('arrow-right')}
				size={16}
				className="me-2"
				aria-hidden="true"
			/>
			<span className="d-flex align-items-center">
				{flow.title}
				{flow.status !== 'v9' && (
					<span className="badge bg-warning text-dark ms-2" style={{ fontSize: '0.75rem' }}>
						{flow.status.toUpperCase()}
					</span>
				)}
			</span>
		</button>
	);
};

// V9 Dashboard Component
export const DashboardV9: React.FC = () => {
	const navigate = useNavigate();
	const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
	const [serverStatus, setServerStatus] = useState({
		api: 'online',
		auth: 'online',
		worker: 'online',
	});
	const [credentialStatus, setCredentialStatus] = useState({
		hasClientId: false,
		hasClientSecret: false,
		hasEnvironmentId: false,
	});
	const [isLoading, setIsLoading] = useState(false);

	// Use sections view mode for collapsible sections
	const sectionIds = ['server-status', 'quick-access', 'recent-activity', 'api-endpoints'];
	const {
		expandedStates,
		isLoading: sectionsLoading,
		toggleSection,
		expandAll,
		collapseAll,
		areAllExpanded,
		areAllCollapsed,
	} = useSectionsViewMode('dashboard-v9', sectionIds);

	// Load initial data
	useEffect(() => {
		const loadInitialData = async () => {
			setIsLoading(true);
			try {
				// Load recent activity
				const activity = await getRecentActivity();
				setRecentActivity(activity);

				// Check credential status
				const credentials = await checkSavedCredentials();
				setCredentialStatus(credentials);

				// Check server status (mock for now)
				setServerStatus({
					api: 'online',
					auth: 'online',
					worker: 'online',
				});

				toastV8.success('Dashboard Loaded', 'V9 Dashboard initialized successfully');
			} catch (error) {
				console.error('Failed to load dashboard data:', error);
				toastV8.error('Load Failed', 'Could not initialize dashboard');
			} finally {
				setIsLoading(false);
			}
		};

		loadInitialData();
	}, []);

	const handleRefresh = useCallback(() => {
		setIsLoading(true);
		// Simulate refresh
		setTimeout(() => {
			setIsLoading(false);
			toastV8.info('Dashboard Refreshed', 'Dashboard data has been refreshed');
		}, 1000);
	}, []);

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'online':
				return 'success';
			case 'offline':
				return 'danger';
			case 'warning':
				return 'warning';
			default:
				return 'secondary';
		}
	};

	const getStatusIcon = (status: string) => {
		switch (status) {
			case 'online':
				return 'check-circle';
			case 'offline':
				return 'x-circle';
			case 'warning':
				return 'exclamation-triangle';
			default:
				return 'question-circle';
		}
	};

	return (
		<PingUIWrapper>
			<div className="container-fluid py-4">
				{/* Header */}
				<div className="row mb-4">
					<div className="col-12">
						<div className="d-flex align-items-center justify-content-between">
							<div>
								<h1 className="h2 mb-2">
									<BootstrapIcon icon={getBootstrapIconName('grid')} size={24} className="me-2" />
									V9 Dashboard
								</h1>
								<p className="text-muted mb-0">
									Enhanced dashboard with PingOne UI and new messaging system
								</p>
							</div>
							<div className="d-flex gap-2">
								<button
									type="button"
									className="btn btn-outline-primary"
									onClick={handleRefresh}
									disabled={isLoading}
								>
									<BootstrapIcon
										icon={getBootstrapIconName('arrow-clockwise')}
										size={16}
										className="me-1"
										aria-hidden="true"
									/>
									{isLoading ? 'Refreshing...' : 'Refresh'}
								</button>
								<ExpandCollapseAllControls
									pageKey="dashboard-v9"
									sectionIds={sectionIds}
									allExpanded={areAllExpanded()}
									allCollapsed={areAllCollapsed()}
									onExpandAll={expandAll}
									onCollapseAll={collapseAll}
								/>
							</div>
						</div>
					</div>
				</div>

				{/* Server Status */}
				<div className="row mb-4">
					<div className="col-12">
						<CollapsibleHeader
							title="Server Status"
							subtitle="Backend service status and health monitoring"
							defaultCollapsed={false}
							onToggle={() => toggleSection('server-status')}
						>
							<BootstrapIcon
								icon={getBootstrapIconName('server')}
								size={16}
								className="me-2"
								aria-hidden="true"
							/>
						</CollapsibleHeader>
						<div className="row g-3">
							<div className="col-md-4">
								<div className="card">
									<div className="card-body">
										<div className="d-flex align-items-center mb-2">
											<span className={`badge bg-${getStatusColor(serverStatus.api)} me-2`}>
												API
											</span>
											<BootstrapIcon
												icon={getBootstrapIconName(getStatusIcon(serverStatus.api))}
												size={16}
												className="me-1"
												aria-hidden="true"
											/>
											<span className="fw-semibold">API Server</span>
										</div>
										<p className="text-muted small mb-0">
											{serverStatus.api === 'online'
												? 'All systems operational'
												: 'Service unavailable'}
										</p>
									</div>
								</div>
							</div>
							<div className="col-md-4">
								<div className="card">
									<div className="card-body">
										<div className="d-flex align-items-center mb-2">
											<span className={`badge bg-${getStatusColor(serverStatus.auth)} me-2`}>
												Auth
											</span>
											<BootstrapIcon
												icon={getBootstrapIconName(getStatusIcon(serverStatus.auth))}
												size={16}
												className="me-1"
												aria-hidden="true"
											/>
											<span className="fw-semibold">Auth Service</span>
										</div>
										<p className="text-muted small mb-0">
											{serverStatus.auth === 'online'
												? 'Authentication working'
												: 'Auth service issues'}
										</p>
									</div>
								</div>
							</div>
							<div className="col-md-4">
								<div className="card">
									<div className="card-body">
										<div className="d-flex align-items-center mb-2">
											<span className={`badge bg-${getStatusColor(serverStatus.worker)} me-2`}>
												Worker
											</span>
											<BootstrapIcon
												icon={getBootstrapIconName(getStatusIcon(serverStatus.worker))}
												size={16}
												className="me-1"
												aria-hidden="true"
											/>
											<span className="fw-semibold">Worker Token</span>
										</div>
										<p className="text-muted small mb-0">
											{serverStatus.worker === 'online'
												? 'Worker token service active'
												: 'Worker token issues'}
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Quick Access */}
				<div className="row mb-4">
					<div className="col-12">
						<CollapsibleHeader
							title="Quick Access - V9 Flows"
							subtitle="Enhanced OAuth/OIDC flows with PingOne UI and new messaging"
							defaultCollapsed={false}
							onToggle={() => toggleSection('quick-access')}
						>
							<BootstrapIcon
								icon={getBootstrapIconName('zap')}
								size={16}
								className="me-2"
								aria-hidden="true"
							/>
						</CollapsibleHeader>
						<div className="row g-3">
							{V9_FLOW_CATEGORIES.map((category) => (
								<div key={category.id} className="col-lg-6">
									<div className="card h-100">
										<div className="card-header">
											<h5 className="card-title mb-1">{category.title}</h5>
											<p className="text-muted small mb-0">{category.description}</p>
										</div>
										<div className="card-body">
											<div className="d-grid gap-2">
												{category.flows.map((flow) => (
													<V9FlowLink key={flow.id} flow={flow} />
												))}
											</div>
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>

				{/* Recent Activity */}
				<div className="row mb-4">
					<div className="col-12">
						<CollapsibleHeader
							title="Recent Activity"
							subtitle="Latest authentication and authorization events"
							defaultCollapsed={false}
							onToggle={() => toggleSection('recent-activity')}
						>
							<BootstrapIcon
								icon={getBootstrapIconName('activity')}
								size={16}
								className="me-2"
								aria-hidden="true"
							/>
						</CollapsibleHeader>
						<div className="card">
							<div className="card-body">
								{recentActivity.length > 0 ? (
									<div className="list-group list-group-flush">
										{recentActivity.slice(0, 5).map((activity, index) => (
											<div key={index} className="list-group-item list-group-item-action">
												<div className="d-flex justify-content-between align-items-start">
													<div className="flex-grow-1">
														<h6 className="mb-1">{activity.title}</h6>
														<p className="text-muted small mb-0">{activity.description}</p>
														<small className="text-muted">
															{new Date(activity.timestamp).toLocaleString()}
														</small>
													</div>
													<div className="ms-2">
														<span className={`badge bg-${getStatusColor(activity.status)}`}>
															{activity.status}
														</span>
													</div>
												</div>
											</div>
										))}
									</div>
								) : (
									<div className="text-center py-4">
										<BootstrapIcon
											icon={getBootstrapIconName('info-circle')}
											size={24}
											className="text-muted mb-2"
											aria-hidden="true"
										/>
										<p className="text-muted">No recent activity</p>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>

				{/* API Endpoints */}
				<div className="row">
					<div className="col-12">
						<CollapsibleHeader
							title="Available API Endpoints"
							subtitle="Backend API endpoints for OAuth/OIDC operations"
							defaultCollapsed={false}
							onToggle={() => toggleSection('api-endpoints')}
						>
							<BootstrapIcon
								icon={getBootstrapIconName('link')}
								size={16}
								className="me-2"
								aria-hidden="true"
							/>
						</CollapsibleHeader>
						<div className="card">
							<div className="card-body">
								<div className="row g-3">
									<div className="col-md-6">
										<h6>Authentication Endpoints</h6>
										<div className="list-group list-group-flush">
											<div className="list-group-item">
												<code className="text-bg-dark p-2 rounded">POST /oauth2/authorize</code>
												<span className="badge bg-success ms-2">OAuth 2.0</span>
											</div>
											<div className="list-group-item">
												<code className="text-bg-dark p-2 rounded">POST /oauth2/token</code>
												<span className="badge bg-success ms-2">Token</span>
											</div>
											<div className="list-group-item">
												<code className="text-bg-dark p-2 rounded">
													POST /oauth2/device_authorization
												</code>
												<span className="badge bg-success ms-2">Device</span>
											</div>
											<div className="list-group-item">
												<code className="text-bg-dark p-2 rounded">POST /oauth2/introspect</code>
												<span className="badge bg-success ms-2">Introspection</span>
											</div>
										</div>
									</div>
									<div className="col-md-6">
										<h6>Management Endpoints</h6>
										<div className="list-group list-group-flush">
											<div className="list-group-item">
												<code className="text-bg-dark p-2 rounded">GET /api/credentials</code>
												<span className="badge bg-info ms-2">Management</span>
											</div>
											<div className="list-group-item">
												<code className="text-bg-dark p-2 rounded">GET /api/tokens</code>
												<span className="badge bg-info ms-2">Management</span>
											</div>
											<div className="list-group-item">
												<code className="text-bg-dark p-2 rounded">DELETE /api/tokens</code>
												<span className="bg-warning ms-2">Revocation</span>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Credential Status */}
				<div className="row">
					<div className="col-12">
						<div className="card">
							<div className="card-header">
								<h5 className="card-title mb-0">
									<BootstrapIcon
										icon={getBootstrapIconName('shield-check')}
										size={16}
										className="me-2"
										aria-hidden="true"
									/>
									Credential Configuration Status
								</h5>
							</div>
							<div className="card-body">
								<div className="row g-3">
									<div className="col-md-4">
										<div className="d-flex align-items-center mb-2">
											<span
												className={`badge bg-${credentialStatus.hasClientId ? 'success' : 'warning'} me-2`}
											>
												Client ID
											</span>
											<BootstrapIcon
												icon={getBootstrapIconIcon(
													credentialStatus.hasClientId ? 'check-circle' : 'x-circle'
												)}
												size={16}
												className="me-1"
												aria-hidden="true"
											/>
											<span className="fw-semibold">Client ID</span>
										</div>
										<p className="text-muted small mb-0">
											{credentialStatus.hasClientId ? 'Configured' : 'Not configured'}
										</p>
									</div>
									<div className="col-md-4">
										<div className="d-flex align-items-center mb-2">
											<span
												className={`badge bg-${credentialStatus.hasClientSecret ? 'success' : 'warning'} me-2`}
											>
												Client Secret
											</span>
											<BootstrapIcon
												icon={getBootstrapIconIcon(
													credentialStatus.hasClientSecret ? 'check-circle' : 'x-circle'
												)}
												size={16}
												className="me-1"
												aria-hidden="true"
											/>
											<span className="fw-semibold">Client Secret</span>
										</div>
										<p className="text-muted small mb-0">
											{credentialStatus.hasClientSecret ? 'Configured' : 'Not configured'}
										</p>
									</div>
									<div className="col-md-4">
										<div className="d-flex align-items-center mb-2">
											<span
												className={`badge bg-${credentialStatus.hasEnvironmentId ? 'success' : 'warning'} me-2`}
											>
												Environment ID
											</span>
											<BootstrapIcon
												icon={getBootstrapIconIcon(
													credentialStatus.hasEnvironmentId ? 'check-circle' : 'x-circle'
												)}
												size={16}
												className="me-1"
												aria-hidden="true"
											/>
											<span className="fw-semibold">Environment ID</span>
										</div>
										<p className="text-muted small mb-0">
											{credentialStatus.hasEnvironmentId ? 'Configured' : 'Not configured'}
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Footer */}
				<div className="row mt-4">
					<div className="col-12">
						<div className="text-center">
							<AppVersionBadge />
							<p className="text-muted small mt-2 mb-0">
								Enhanced with PingOne UI and new messaging system
							</p>
						</div>
					</div>
				</div>
			</div>
		</PingUIWrapper>
	);
};

export default DashboardV9;
