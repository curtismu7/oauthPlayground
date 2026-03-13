/**
 * Custom Domain & API Test — change custom domain and test backend APIs (health, custom-domain, logs).
 * Uses same domain load/save as Dashboard; provides one place to validate custom domain setup.
 */

import { useCallback, useEffect, useState } from 'react';
import { Icon } from '../components/Icon/Icon';
import { useServerStatus } from '../components/ServerStatusProvider';
import { WorkerTokenModalV9 } from '../components/WorkerTokenModalV9';
import { useNotifications } from '../contexts/NotificationSystem';
import { CollapsibleHeader } from '../services/collapsibleHeaderService';
import {
	getAppUrlForDomain,
	getCustomDomain,
	getDomainFromIndexedDB,
	saveCustomDomain,
} from '../services/customDomainService';
import { type PingOneRegion } from '../services/regionService';
import { workerTokenServiceV8 } from '../v8/services/workerTokenServiceV8';
import {
	checkWorkerTokenStatusSync,
	type TokenStatusInfo,
} from '../v8/services/workerTokenStatusServiceV8';
import { handleShowWorkerTokenModal } from '../v8/utils/workerTokenModalHelperV8';
import '../styles/dashboard.css';

interface ApiTestSpec {
	method: string;
	path: string;
	description: string;
	requiresParams?: string[]; // path params e.g., ['userId']
	queryParams?: string[]; // query string params e.g., ['environmentId', 'accessToken']
	bodyParams?: string[]; // POST body params e.g., ['environmentId', 'accessToken', 'identifier']
}

const API_TESTS: ApiTestSpec[] = [
	{ method: 'GET', path: '/api/health', description: 'Backend health check' },
	{ method: 'GET', path: '/api/settings/custom-domain', description: 'Get saved custom domain' },
	{ method: 'GET', path: '/api/logs/list', description: 'List available log files' },
	{ method: 'GET', path: '/api/version', description: 'Backend version' },
	{
		method: 'GET',
		path: '/api/pingone/user/{userId}',
		description: 'Get user by user ID (PingOne API)',
		requiresParams: ['userId'],
		queryParams: ['accessToken'],
	},
	{
		method: 'POST',
		path: '/api/pingone/users/lookup',
		description:
			'Look up user by username, email, or ID — uses POST /api/pingone/users/lookup (the real MFA flow endpoint)',
		bodyParams: ['environmentId', 'accessToken', 'identifier'],
	},
	{ method: 'GET', path: '/api/pingone/api-calls', description: 'Recent PingOne API call log' },
	{
		method: 'GET',
		path: '/api/env-config',
		description: 'Get environment configuration',
	},
];

interface TestResult {
	status: number;
	statusText: string;
	bodyPreview: string;
	error?: string;
}

export default function CustomDomainTestPage() {
	const [customDomain, setCustomDomain] = useState('');
	const [_selectedRegion, _setSelectedRegion] = useState<PingOneRegion>('na');
	const [savingDomain, setSavingDomain] = useState(false);
	const [domainError, setDomainError] = useState<string | null>(null);
	const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
	const [testingKey, setTestingKey] = useState<string | null>(null);
	const [collapsed, setCollapsed] = useState({ domain: false, apis: false });
	const [showWorkerTokenModal, setShowWorkerTokenModal] = useState(false);

	// Worker token status — refreshed on mount and on workerTokenUpdated events
	const [tokenStatus, setTokenStatus] = useState<TokenStatusInfo>(() =>
		checkWorkerTokenStatusSync()
	);

	// State for API parameters — keyed by param name, shared across cards
	const [apiParams, setApiParams] = useState<Record<string, string>>({
		userId: '',
		identifier: '', // username, email, or user ID for POST /api/pingone/users/lookup
		accessToken: '', // worker token
		environmentId: '', // pre-populated from stored credentials
	});

	const { showWarning } = useNotifications();
	const serverStatus = useServerStatus();

	// Load stored worker token + environmentId on mount; keep in sync with events
	useEffect(() => {
		const syncToken = async () => {
			const status = checkWorkerTokenStatusSync();
			setTokenStatus(status);
			// Auto-fill access token + environmentId from stored credentials
			const creds = await workerTokenServiceV8.loadCredentials();
			const token = await workerTokenServiceV8.getToken();
			setApiParams((prev) => ({
				...prev,
				accessToken: token ?? prev.accessToken,
				environmentId: creds?.environmentId ?? prev.environmentId,
			}));
		};
		syncToken();
		window.addEventListener('workerTokenUpdated', syncToken);
		return () => window.removeEventListener('workerTokenUpdated', syncToken);
	}, []);

	// Handler for worker token modal
	const handleWorkerTokenClick = useCallback(async () => {
		await handleShowWorkerTokenModal(setShowWorkerTokenModal);
	}, []);

	useEffect(() => {
		if (!serverStatus.isOnline) {
			getDomainFromIndexedDB().then((idb) => {
				if (idb) {
					setCustomDomain(idb);
					return;
				}
				const env = (import.meta.env.VITE_PUBLIC_APP_URL as string) || '';
				const fromEnv = env
					.replace(/^https?:\/\//i, '')
					.split('/')[0]
					.split(':')[0]
					.trim();
				setCustomDomain(fromEnv || 'api.pingdemo.com');
			});
			return;
		}
		getCustomDomain().then(setCustomDomain);
	}, [serverStatus.isOnline]);

	const appDisplayUrl =
		typeof customDomain === 'string' && customDomain.trim()
			? getAppUrlForDomain(customDomain.trim())
			: 'https://api.pingdemo.com:3000';

	const fullPageUrl = `${appDisplayUrl}/custom-domain-test`;

	const handleSaveCustomDomain = useCallback(async () => {
		if (!customDomain.trim()) return;
		setDomainError(null);
		setSavingDomain(true);
		try {
			const newAppUrl = await saveCustomDomain(customDomain.trim());
			window.location.href = `${newAppUrl}/custom-domain-test`;
		} catch (err) {
			setDomainError(err instanceof Error ? err.message : 'Failed to save domain');
		} finally {
			setSavingDomain(false);
		}
	}, [customDomain]);

	const runTest = useCallback(
		async (spec: ApiTestSpec, params: Record<string, string>) => {
			// Replace path parameters with actual values
			let finalPath = spec.path;
			if (spec.requiresParams) {
				for (const param of spec.requiresParams) {
					const value = params[param];
					if (!value || !value.trim()) {
						showWarning(`Please enter ${param} before testing this endpoint`, { duration: 4000 });
						return;
					}
					finalPath = finalPath.replace(`{${param}}`, encodeURIComponent(value.trim()));
				}
			}

			// Append query parameters
			if (spec.queryParams && spec.queryParams.length > 0) {
				const qs = spec.queryParams
					.filter((p) => params[p]?.trim())
					.map((p) => `${encodeURIComponent(p)}=${encodeURIComponent(params[p].trim())}`)
					.join('&');
				if (qs) finalPath = `${finalPath}?${qs}`;
			}

			// Build POST body if needed
			const fetchInit: RequestInit = { method: spec.method };
			if (spec.bodyParams && spec.bodyParams.length > 0 && spec.method === 'POST') {
				const missing = spec.bodyParams.filter((p) => !params[p]?.trim());
				if (missing.length > 0) {
					showWarning(`Please fill in: ${missing.join(', ')}`, { duration: 4000 });
					return;
				}
				const body: Record<string, string> = {};
				for (const p of spec.bodyParams) body[p] = params[p].trim();
				fetchInit.headers = { 'Content-Type': 'application/json' };
				fetchInit.body = JSON.stringify(body);
			}

			const key = `${spec.method} ${spec.path}`;
			setTestingKey(key);
			setTestResults((prev) => ({
				...prev,
				[key]: { status: 0, statusText: '…', bodyPreview: '' },
			}));
			try {
				const res = await fetch(finalPath, fetchInit);
				let bodyPreview = '';
				try {
					const text = await res.text();
					bodyPreview = text.length > 200 ? `${text.slice(0, 200)}…` : text;
				} catch {
					bodyPreview = '(non-text response)';
				}
				setTestResults((prev) => ({
					...prev,
					[key]: {
						status: res.status,
						statusText: res.statusText,
						bodyPreview,
					},
				}));
			} catch (err) {
				setTestResults((prev) => ({
					...prev,
					[key]: {
						status: 0,
						statusText: 'Error',
						bodyPreview: '',
						error: err instanceof Error ? err.message : 'Request failed',
					},
				}));
			} finally {
				setTestingKey(null);
			}
		},
		[showWarning]
	);

	return (
		<div className="dashboard-page">
			{/* ── Top Status Bar: Backend + Worker Token + Environment ID ── */}
			<div className="section-wrap mb-3">
				<div className="card" style={{ borderLeft: '4px solid V9_COLORS.PRIMARY.BLUE_DARK' }}>
					<div className="card-body py-3">
						<p
							className="fw-600 mb-2 text-small"
							style={{ color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em' }}
						>
							Backend &amp; Worker Token Status
						</p>
						<div className="d-flex flex-wrap gap-4 align-items-start">
							{/* Server status */}
							<div className="d-flex flex-column gap-1">
								<span className="text-small fw-600 text-muted">Backend</span>
								<div className="d-flex align-items-center gap-2">
									{serverStatus.isChecking ? (
										<span className="badge" style={{ backgroundColor: '#f59e0b' }}>
											Checking…
										</span>
									) : serverStatus.isOnline ? (
										<>
											<span className="badge bg-success">Online</span>
											{serverStatus.lastChecked && (
												<span className="text-muted" style={{ fontSize: '0.75rem' }}>
													{serverStatus.lastChecked.toLocaleTimeString()}
												</span>
											)}
										</>
									) : (
										<>
											<span className="badge bg-danger">Offline</span>
											<button
												type="button"
												className="btn btn-sm btn-outline-secondary"
												style={{ padding: '0 0.4rem', fontSize: '0.75rem' }}
												onClick={serverStatus.checkHealth}
												disabled={serverStatus.isChecking}
											>
												Retry
											</button>
										</>
									)}
								</div>
							</div>

							{/* Token status */}
							<div className="d-flex flex-column gap-1">
								<span className="text-small fw-600 text-muted">Worker Token</span>
								<div className="d-flex align-items-center gap-2 flex-wrap">
									<span
										className="badge"
										style={{
											backgroundColor:
												tokenStatus.status === 'valid'
													? '#059669'
													: tokenStatus.status === 'expiring-soon'
														? '#d97706'
														: '#dc2626',
										}}
									>
										{tokenStatus.status === 'valid'
											? `Valid · ${tokenStatus.minutesRemaining ?? 0}m left`
											: tokenStatus.status === 'expiring-soon'
												? `Expiring · ${tokenStatus.minutesRemaining ?? 0}m left`
												: tokenStatus.status === 'expired'
													? 'Expired'
													: 'No token'}
									</span>
									<button
										type="button"
										className="btn btn-sm btn-outline-primary"
										onClick={handleWorkerTokenClick}
										title="Get or refresh worker token"
									>
										<Icon name="key" size="sm" />
										{tokenStatus.isValid ? ' Refresh' : ' Get Token'}
									</button>
								</div>
							</div>

							{/* Environment ID */}
							<div
								className="d-flex flex-column gap-1"
								style={{ flex: 1, minWidth: '220px', maxWidth: '380px' }}
							>
								<label htmlFor="top-env-id" className="text-small fw-600 text-muted mb-0">
									Environment ID
								</label>
								<input
									id="top-env-id"
									type="text"
									className="form-control form-control-sm"
									placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
									value={apiParams.environmentId ?? ''}
									onChange={(e) =>
										setApiParams((prev) => ({ ...prev, environmentId: e.target.value }))
									}
								/>
							</div>

							{/* Worker token (masked) */}
							<div className="d-flex flex-column gap-1" style={{ flex: 2, minWidth: '260px' }}>
								<label htmlFor="top-access-token" className="text-small fw-600 text-muted mb-0">
									Worker Token (Bearer)
								</label>
								<input
									id="top-access-token"
									type="password"
									className="form-control form-control-sm"
									placeholder="Auto-filled when you Get Token above"
									value={apiParams.accessToken ?? ''}
									onChange={(e) =>
										setApiParams((prev) => ({ ...prev, accessToken: e.target.value }))
									}
								/>
							</div>
						</div>

						{!serverStatus.isOnline && !serverStatus.isChecking && serverStatus.error && (
							<div className="mt-2 text-small" style={{ color: '#dc2626' }}>
								<strong>Error:</strong> {serverStatus.error}
							</div>
						)}
					</div>
				</div>
			</div>
			<div className="section-wrap mb-3">
				<div
					className="card"
					style={{
						borderLeft: '4px solid V9_COLORS.PRIMARY.BLUE_DARK',
						backgroundColor: '#f8fafc',
					}}
				>
					<div className="card-body">
						<div className="d-flex align-items-center gap-2 flex-wrap">
							<Icon name="link" size="sm" />
							<span className="fw-600" style={{ color: '#2563eb' }}>
								Current Page URL:
							</span>
							<code
								className="fw-600"
								style={{
									color: '#1e3a8a',
									fontSize: '1rem',
									padding: '0.25rem 0.5rem',
									backgroundColor: '#dbeafe',
									borderRadius: '4px',
								}}
							>
								{fullPageUrl}
							</code>
						</div>
					</div>
				</div>
			</div>

			<div className="section-wrap">
				<CollapsibleHeader
					title="Custom Domain & API Test"
					subtitle="Set your custom domain and verify backend APIs respond correctly"
					icon={<Icon name="cog" />}
					theme="ping"
					variant="compact"
					defaultCollapsed={collapsed.domain}
					collapsed={collapsed.domain}
					onToggle={() => setCollapsed((c) => ({ ...c, domain: !c.domain }))}
				>
					<div className="card-body card-body--lg">
						<div className="d-flex flex-column gap-2 mb-3">
							<div className="d-flex align-items-center gap-2 flex-wrap">
								<span className="fw-600 text-muted">App URL (HTTPS):</span>
								<code className="text-small fw-600" style={{ color: '#1f2937' }}>
									{appDisplayUrl}
								</code>
							</div>
							<div className="d-flex flex-column gap-2" style={{ maxWidth: '400px' }}>
								<label htmlFor="custom-domain-test-input" className="fw-600 text-muted text-small">
									Custom domain (hostname only)
								</label>
								<input
									id="custom-domain-test-input"
									type="text"
									className="form-control"
									placeholder="api.pingdemo.com"
									value={customDomain}
									onChange={(e) => {
										setCustomDomain(e.target.value);
										setDomainError(null);
									}}
									aria-describedby="custom-domain-hint custom-domain-error"
								/>
								{domainError && (
									<p
										id="custom-domain-error"
										className="text-small mb-0"
										style={{ color: '#dc2626' }}
									>
										{domainError}
									</p>
								)}
								<p id="custom-domain-hint" className="text-small text-muted mb-0">
									Saved to SQLite and IndexedDB. After saving, the app opens at the new URL.
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
										'Save & open at new URL'
									)}
								</button>
							</div>
						</div>
					</div>
				</CollapsibleHeader>
			</div>

			<div className="section-wrap">
				<CollapsibleHeader
					title="APIs to test"
					subtitle="Hit backend endpoints from the current origin (proxy works with custom domain)"
					icon={<Icon name="server" />}
					theme="ping"
					variant="compact"
					defaultCollapsed={collapsed.apis}
					collapsed={collapsed.apis}
					onToggle={() => setCollapsed((c) => ({ ...c, apis: !c.apis }))}
				>
					<div className="card-body card-body--lg">
						<div className="d-flex flex-column gap-3">
							{API_TESTS.map((spec) => {
								const key = `${spec.method} ${spec.path}`;
								const result = testResults[key];
								const isTesting = testingKey === key;
								return (
									<div
										key={key}
										className="card"
										style={{
											borderLeft: `4px solid ${spec.bodyParams ? '#7c3aed' : spec.requiresParams ? '#2563eb' : '#e5e7eb'}`,
										}}
									>
										<div className="card-body d-flex flex-wrap align-items-center gap-2 justify-content-between">
											<div className="d-flex flex-column gap-1" style={{ flex: 1, minWidth: 0 }}>
												<div className="d-flex align-items-center gap-2 flex-wrap">
													<span className="badge bg-secondary" style={{ width: 'fit-content' }}>
														{spec.method}
													</span>
													<code className="text-small" style={{ color: '#1f2937' }}>
														{spec.path}
													</code>
												</div>
												<span className="text-muted text-small">{spec.description}</span>
												{spec.requiresParams && (
													<div className="d-flex flex-wrap gap-2 mt-2">
														{spec.requiresParams.map((param) => (
															<div key={param} className="d-flex flex-column gap-1">
																<label
																	htmlFor={`inline-param-${key}-${param}`}
																	className="text-small fw-600 text-muted mb-0"
																>
																	{param}
																</label>
																<input
																	id={`inline-param-${key}-${param}`}
																	type="text"
																	className="form-control form-control-sm"
																	placeholder={param}
																	value={apiParams[param] ?? ''}
																	onChange={(e) =>
																		setApiParams((prev) => ({ ...prev, [param]: e.target.value }))
																	}
																	style={{ minWidth: '160px', maxWidth: '240px' }}
																/>
															</div>
														))}
													</div>
												)}
												{spec.bodyParams && (
													<div className="d-flex flex-wrap gap-2 mt-2">
														{spec.bodyParams
															.filter((p) => !['environmentId', 'accessToken'].includes(p))
															.map((param) => (
																<div key={param} className="d-flex flex-column gap-1">
																	<label
																		htmlFor={`body-param-${key}-${param}`}
																		className="text-small fw-600 text-muted mb-0"
																	>
																		{param === 'identifier'
																			? 'identifier (username / email / userId)'
																			: param}
																	</label>
																	<input
																		id={`body-param-${key}-${param}`}
																		type="text"
																		className="form-control form-control-sm"
																		placeholder="username, email, or user ID"
																		value={apiParams[param] ?? ''}
																		onChange={(e) =>
																			setApiParams((prev) => ({ ...prev, [param]: e.target.value }))
																		}
																		style={{ minWidth: '220px', maxWidth: '360px' }}
																	/>
																</div>
															))}
													</div>
												)}
											</div>
											<div className="d-flex align-items-center gap-2">
												{result && (
													<span
														className={`badge ${result.status >= 200 && result.status < 300 ? 'bg-success' : result.status === 0 ? 'bg-danger' : 'bg-warning text-dark'}`}
													>
														{result.status > 0
															? `${result.status} ${result.statusText}`
															: result.error || 'Error'}
													</span>
												)}
												<button
													type="button"
													className="btn btn-sm btn-outline-primary"
													onClick={() => runTest(spec, apiParams)}
													disabled={isTesting}
													aria-label={`Test ${spec.method} ${spec.path}`}
												>
													{isTesting ? (
														<Icon
															name="refresh"
															size="sm"
															style={{ animation: 'spin 1s linear infinite' }}
														/>
													) : (
														'Test'
													)}
												</button>
											</div>
										</div>
										{result && (result.bodyPreview || result.error) && (
											<div
												className="card-body pt-0 border-top"
												style={{ backgroundColor: '#f8fafc', fontSize: '0.8rem' }}
											>
												<pre
													className="mb-0 text-start overflow-auto"
													style={{
														maxHeight: '120px',
														color: '#1f2937',
														whiteSpace: 'pre-wrap',
														wordBreak: 'break-all',
													}}
												>
													{result.error || result.bodyPreview}
												</pre>
											</div>
										)}
									</div>
								);
							})}
						</div>
					</div>
				</CollapsibleHeader>
			</div>

			{/* Worker Token Modal */}
			<WorkerTokenModalV9
				isOpen={showWorkerTokenModal}
				onClose={() => setShowWorkerTokenModal(false)}
				onTokenGenerated={async (token) => {
					const creds = await workerTokenServiceV8.loadCredentials();
					setApiParams((prev) => ({
						...prev,
						accessToken: token,
						environmentId: creds?.environmentId ?? prev.environmentId,
					}));
					setTokenStatus(checkWorkerTokenStatusSync());
				}}
			/>
		</div>
	);
}
