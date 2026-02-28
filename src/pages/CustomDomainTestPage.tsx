/**
 * Custom Domain & API Test — change custom domain and test backend APIs (health, custom-domain, logs).
 * Uses same domain load/save as Dashboard; provides one place to validate custom domain setup.
 */

import { useCallback, useEffect, useState } from 'react';
import { Icon } from '../components/Icon/Icon';
import { useServerStatusOptional } from '../components/ServerStatusProvider';
import { useNotifications } from '../contexts/NotificationSystem';
import { CollapsibleHeader } from '../services/collapsibleHeaderService';
import {
	getAppUrlForDomain,
	getCustomDomain,
	getDomainFromIndexedDB,
	saveCustomDomain,
} from '../services/customDomainService';
import '../styles/dashboard.css';

interface ApiTestSpec {
	method: string;
	path: string;
	description: string;
	requiresParams?: string[]; // e.g., ['username'], ['orgId'], ['envId']
}

const API_TESTS: ApiTestSpec[] = [
	{ method: 'GET', path: '/api/health', description: 'Backend health check' },
	{ method: 'GET', path: '/api/settings/custom-domain', description: 'Get saved custom domain' },
	{ method: 'GET', path: '/api/logs/list', description: 'List available log files' },
	{ method: 'GET', path: '/api/version', description: 'Backend version' },
	{
		method: 'GET',
		path: '/api/user/{username}',
		description: 'Get user by username',
		requiresParams: ['username'],
	},
	{
		method: 'GET',
		path: '/api/org/{orgId}/licensing',
		description: 'Organization licensing info',
		requiresParams: ['orgId'],
	},
	{ method: 'GET', path: '/api/identity/metrics', description: 'Identity metrics and statistics' },
	{
		method: 'GET',
		path: '/api/environment/{envId}',
		description: 'Get environment details',
		requiresParams: ['envId'],
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
	const [savingDomain, setSavingDomain] = useState(false);
	const [domainError, setDomainError] = useState<string | null>(null);
	const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
	const [testingKey, setTestingKey] = useState<string | null>(null);
	const [collapsed, setCollapsed] = useState({ domain: false, apis: false });

	// State for API parameters — keyed by param name, shared across cards
	const [apiParams, setApiParams] = useState<Record<string, string>>({
		username: '',
		orgId: '',
		envId: '',
	});

	const { showWarning } = useNotifications();
	const { isOnline } = useServerStatusOptional();

	useEffect(() => {
		if (!isOnline) {
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
	}, [isOnline]);

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

			const key = `${spec.method} ${spec.path}`;
			setTestingKey(key);
			setTestResults((prev) => ({
				...prev,
				[key]: { status: 0, statusText: '…', bodyPreview: '' },
			}));
			try {
				const res = await fetch(finalPath, { method: spec.method });
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
			{/* Full Page URL Display */}
			<div className="section-wrap mb-3">
				<div
					className="card"
					style={{ borderLeft: '4px solid #2563eb', backgroundColor: '#eff6ff' }}
				>
					<div className="card-body">
						<div className="d-flex align-items-center gap-2 flex-wrap">
							<Icon name="link" size="sm" />
							<span className="fw-600" style={{ color: '#1e40af' }}>
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
								<code className="text-small fw-600" style={{ color: '#111827' }}>
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
						{!isOnline && (
							<p className="text-warning mb-3">
								Backend may be offline. Start with <code>./run.sh</code> then retry.
							</p>
						)}
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
											borderLeft: `4px solid ${spec.requiresParams ? '#2563eb' : '#e5e7eb'}`,
										}}
									>
										<div className="card-body d-flex flex-wrap align-items-center gap-2 justify-content-between">
											<div className="d-flex flex-column gap-1" style={{ flex: 1, minWidth: 0 }}>
												<div className="d-flex align-items-center gap-2 flex-wrap">
													<span className="badge bg-secondary" style={{ width: 'fit-content' }}>
														{spec.method}
													</span>
													<code className="text-small" style={{ color: '#111827' }}>
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
		</div>
	);
}
