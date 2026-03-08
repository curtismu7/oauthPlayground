// src/pages/CredentialManagement.tsx


import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
// import { FlowHeader } from '../services/flowHeaderService';
import { modernMessaging } from '@/services/v9/V9ModernMessagingService';
import ConfirmationModal from '../components/ConfirmationModal';
import { credentialStorageManager } from '../services/credentialStorageManager';
import { createModuleLogger } from '../utils/consoleMigrationHelper';
import { WorkerTokenSectionV8 } from '../v8/components/WorkerTokenSectionV8';

const styles = {
	container: {
		maxWidth: '1200px',
		margin: '0 auto',
		padding: '2rem',
	} as React.CSSProperties,
	pageHeader: {
		background: 'linear-gradient(135deg, V9_COLORS.PRIMARY.BLUE_DARK 0%, V9_COLORS.PRIMARY.BLUE_DARK 100%)',
		borderRadius: '12px',
		padding: '2rem',
		marginBottom: '1.5rem',
		color: 'white',
	} as React.CSSProperties,
	pageTitle: {
		fontSize: '1.75rem',
		fontWeight: 700,
		display: 'flex',
		alignItems: 'center',
		gap: '0.75rem',
		margin: '0 0 0.5rem 0',
		color: 'white',
	} as React.CSSProperties,
	pageSubtitle: {
		color: 'rgba(255,255,255,0.85)',
		margin: '0 0 1.5rem 0',
		fontSize: '0.95rem',
	} as React.CSSProperties,
	card: {
		background: 'white',
		borderRadius: '12px',
		boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
		padding: '2rem',
		marginBottom: '2rem',
	} as React.CSSProperties,
	title: {
		fontSize: '1.5rem',
		fontWeight: 600,
		color: 'V9_COLORS.TEXT.GRAY_DARK',
		marginBottom: '1rem',
		display: 'flex',
		alignItems: 'center',
		gap: '0.75rem',
	} as React.CSSProperties,
	description: {
		color: 'V9_COLORS.TEXT.GRAY_MEDIUM',
		marginBottom: '2rem',
		lineHeight: 1.6,
	} as React.CSSProperties,
	flowGrid: {
		display: 'grid',
		gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
		gap: '1.5rem',
	} as React.CSSProperties,
	flowName: {
		fontSize: '1.125rem',
		fontWeight: 600,
		color: 'V9_COLORS.TEXT.GRAY_DARK',
		marginBottom: '0.5rem',
		display: 'flex',
		alignItems: 'center',
		gap: '0.5rem',
	} as React.CSSProperties,
	flowMeta: {
		display: 'flex',
		flexDirection: 'column' as const,
		gap: '0.5rem',
		fontSize: '0.875rem',
		color: 'V9_COLORS.TEXT.GRAY_MEDIUM',
	} as React.CSSProperties,
	metaRow: {
		display: 'flex',
		alignItems: 'center',
		gap: '0.5rem',
	} as React.CSSProperties,
	actionButton: {
		display: 'inline-flex',
		alignItems: 'center',
		gap: '0.5rem',
		padding: '0.5rem 1rem',
		background: 'V9_COLORS.PRIMARY.BLUE',
		color: 'white',
		border: 'none',
		borderRadius: '6px',
		fontSize: '0.875rem',
		fontWeight: 500,
		cursor: 'pointer',
		marginTop: '0.75rem',
	} as React.CSSProperties,
	emptyState: {
		textAlign: 'center' as const,
		padding: '3rem',
		color: 'V9_COLORS.TEXT.GRAY_LIGHT',
	} as React.CSSProperties,
	buttonRow: {
		display: 'flex',
		gap: '1rem',
		marginBottom: '2rem',
		flexWrap: 'wrap' as const,
	} as React.CSSProperties,
	refreshButton: {
		display: 'inline-flex',
		alignItems: 'center',
		gap: '0.5rem',
		padding: '0.75rem 1.5rem',
		background: 'V9_COLORS.PRIMARY.GREEN',
		color: 'white',
		border: 'none',
		borderRadius: '8px',
		fontSize: '0.875rem',
		fontWeight: 600,
		cursor: 'pointer',
	} as React.CSSProperties,
	exportButton: {
		display: 'inline-flex',
		alignItems: 'center',
		gap: '0.5rem',
		padding: '0.75rem 1.5rem',
		background: 'V9_COLORS.PRIMARY.BLUE',
		color: 'white',
		border: 'none',
		borderRadius: '8px',
		fontSize: '0.875rem',
		fontWeight: 600,
		cursor: 'pointer',
	} as React.CSSProperties,
	importLabel: {
		display: 'inline-flex',
		alignItems: 'center',
		gap: '0.5rem',
		padding: '0.75rem 1.5rem',
		background: 'V9_COLORS.PRIMARY.BLUE_DARK',
		color: 'white',
		border: 'none',
		borderRadius: '8px',
		fontSize: '0.875rem',
		fontWeight: 600,
		cursor: 'pointer',
	} as React.CSSProperties,
	clearButton: {
		display: 'inline-flex',
		alignItems: 'center',
		gap: '0.5rem',
		padding: '0.75rem 1.5rem',
		background: 'V9_COLORS.PRIMARY.RED',
		color: 'white',
		border: 'none',
		borderRadius: '8px',
		fontSize: '0.875rem',
		fontWeight: 600,
		cursor: 'pointer',
	} as React.CSSProperties,
	hiddenFileInput: {
		display: 'none',
	} as React.CSSProperties,
	tabBar: {
		display: 'flex',
		gap: 0,
		borderBottom: '2px solid V9_COLORS.TEXT.GRAY_LIGHTER',
		marginBottom: '1.5rem',
	} as React.CSSProperties,
};

interface TokenPayload {
	client_id?: string;
	iss?: string;
	jti?: string;
	iat?: number;
	exp?: number;
	aud?: string[];
	env?: string;
	org?: string;
	scope?: string;
	sub?: string;
	[key: string]: unknown;
}

interface TesterResult {
	test: string;
	status: 'success' | 'error' | 'warning';
	statusCode?: number;
	message: string;
	details?: string;
}

interface EnvironmentData {
	name?: string;
	type?: string;
	region?: string;
	description?: string;
	license?: { name?: string };
}

interface FlowCredentialInfo {
	flowKey: string;
	flowName: string;
	hasCredentials: boolean;
	lastSaved?: number;
	source?: 'browser' | 'file' | 'memory';
	environmentId?: string;
	clientId?: string;
}

const KNOWN_FLOWS = [
	{ key: 'oauth-authorization-code-v7', name: 'OAuth Authorization Code V7' },
	{ key: 'oidc-authorization-code-v7', name: 'OIDC Authorization Code V7' },
	{ key: 'oauth-implicit-v7', name: 'OAuth Implicit V7' },
	{ key: 'oidc-implicit-v7', name: 'OIDC Implicit V7' },
	{ key: 'device-authorization-v7', name: 'Device Authorization V7' },
	{ key: 'oidc-hybrid-v7', name: 'OIDC Hybrid V7' },
	{ key: 'client-credentials-v7', name: 'Client Credentials V7' },
	{ key: 'kroger-mfa', name: 'Kroger MFA Flow' },
	{ key: 'device-authorization-v6', name: 'Device Authorization V6' },
	{ key: 'configuration', name: 'Configuration' },
	{ key: 'app-generator', name: 'Application Generator' },
];

export const CredentialManagement: React.FC = () => {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const [flows, setFlows] = useState<FlowCredentialInfo[]>([]);
	const [loading, setLoading] = useState(true);
	const [showClearAllModal, setShowClearAllModal] = useState(false);
	const [isClearingAll, setIsClearingAll] = useState(false);
	const [activeTab, setActiveTab] = useState<'credentials' | 'tester'>(
		searchParams.get('tab') === 'tester' ? 'tester' : 'credentials'
	);

	// Token Tester state
	const [testerToken, setTesterToken] = useState('');
	const [testerPayload, setTesterPayload] = useState<TokenPayload | null>(null);
	const [testerIsExpired, setTesterIsExpired] = useState(false);
	const [testerTimeRemaining, setTesterTimeRemaining] = useState<number | null>(null);
	const [testerIsTesting, setTesterIsTesting] = useState(false);
	const [testerResults, setTesterResults] = useState<TesterResult[]>([]);
	const [testerError, setTesterError] = useState<string | null>(null);
	const [testerEnvData, setTesterEnvData] = useState<EnvironmentData | null>(null);

	const loadFlowCredentials = useCallback(async () => {
		setLoading(true);
		try {
			const flowInfos: FlowCredentialInfo[] = [];

			for (const flow of KNOWN_FLOWS) {
				const credentials = await credentialStorageManager.loadFlowCredentials(flow.key);

				flowInfos.push({
					flowKey: flow.key,
					flowName: flow.name,
					hasCredentials: !!credentials,
					environmentId: credentials?.environmentId,
					clientId: credentials?.clientId,
					source: credentials ? 'browser' : undefined,
				});
			}

			setFlows(flowInfos);
		} catch (error) {
			log.error(
				'CredentialManagement',
				'[CredentialManagement] Failed to load credentials:',
				undefined,
				error as Error
			);
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: 'Failed to load credential information',
				dismissible: true,
			});
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadFlowCredentials();
	}, [loadFlowCredentials]);

	const handleExportCredentials = async () => {
		try {
			const exportData: Record<string, unknown> = {
				exportDate: new Date().toISOString(),
				version: '1.0',
				credentials: {},
			};

			// Export all flow credentials
			for (const flow of KNOWN_FLOWS) {
				const credentials = await credentialStorageManager.loadFlowCredentials(flow.key);
				if (credentials) {
					(exportData.credentials as Record<string, unknown>)[flow.key] = credentials;
				}
			}

			// Export worker token credentials
			const workerToken = await credentialStorageManager.loadWorkerToken();
			if (workerToken) {
				(exportData as Record<string, unknown>).workerToken = workerToken;
			}

			// Create and download JSON file
			const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `pingone-credentials-${new Date().toISOString().split('T')[0]}.json`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);

			modernMessaging.showFooterMessage({
				type: 'status',
				message: 'Credentials exported successfully',
				duration: 4000,
			});
		} catch (error) {
			log.error(
				'CredentialManagement',
				'[CredentialManagement] Export failed:',
				undefined,
				error as Error
			);
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: 'Failed to export credentials',
				dismissible: true,
			});
		}
	};

	const handleImportCredentials = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		const inputEl = event.target;
		if (!file) return;

		try {
			const text = await file.text();
			const importData = JSON.parse(text);

			// Validate import data structure
			if (!importData.credentials || typeof importData.credentials !== 'object') {
				throw new Error('Invalid credential file format');
			}

			let importedCount = 0;

			// Import flow credentials
			for (const [flowKey, credentials] of Object.entries(importData.credentials)) {
				if (credentials && typeof credentials === 'object') {
					await credentialStorageManager.saveFlowCredentials(
						flowKey,
						credentials as Record<string, unknown>
					);
					importedCount++;
				}
			}

			// Import worker token if present
			if (importData.workerToken) {
				await credentialStorageManager.saveWorkerToken(importData.workerToken);
			}

			modernMessaging.showFooterMessage({
				type: 'status',
				message: `Imported ${importedCount} credential sets successfully`,
				duration: 4000,
			});

			// Reload credentials to show updated state
			await loadFlowCredentials();
		} catch (error) {
			log.error(
				'CredentialManagement',
				'[CredentialManagement] Import failed:',
				undefined,
				error as Error
			);
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: 'Failed to import credentials. Please check the file format.',
				dismissible: true,
			});
		}

		// Reset file input
		inputEl.value = '';
	};

	const handleClearAllCredentials = async () => {
		setIsClearingAll(true);
		try {
			let clearedCount = 0;
			for (const flow of KNOWN_FLOWS) {
				await credentialStorageManager.clearFlowCredentials(flow.key);
				clearedCount++;
			}
			await credentialStorageManager.clearWorkerToken();
			modernMessaging.showFooterMessage({
				type: 'status',
				message: `Cleared ${clearedCount} credential sets successfully`,
				duration: 4000,
			});
			await loadFlowCredentials();
			console.log(
				`[${new Date().toISOString()}] [🧩 UI-NOTIFICATIONS] All credentials cleared successfully. Count: ${clearedCount}`
			);
		} catch (error) {
			log.error(
				'CredentialManagement',
				`[${new Date().toISOString()}] [⚠️ ERROR-HANDLER] Failed to clear all credentials:`,
				undefined,
				error as Error
			);
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: 'Failed to clear all credentials',
				dismissible: true,
			});
		} finally {
			setIsClearingAll(false);
			setShowClearAllModal(false);
		}
	};

	const decodeJwt = (tokenString: string): TokenPayload | null => {
		try {
			const parts = tokenString.trim().split('.');
			if (parts.length !== 3) throw new Error('Invalid JWT format');
			// educational-ok: manual JWT decode for credential display in UI
			const decoded = JSON.parse(atob(parts[1])) as TokenPayload;
			if (decoded.exp) {
				const now = Math.floor(Date.now() / 1000);
				setTesterIsExpired(now > decoded.exp);
				setTesterTimeRemaining(decoded.exp - now);
			}
			return decoded;
		} catch {
			return null;
		}
	};

	const handleTesterTokenChange = (value: string) => {
		setTesterToken(value);
		setTesterError(null);
		setTesterResults([]);
		setTesterEnvData(null);
		if (value.trim()) {
			const decoded = decodeJwt(value);
			if (decoded) {
				setTesterPayload(decoded);
			} else {
				setTesterPayload(null);
				setTesterError('Invalid JWT token format');
			}
		} else {
			setTesterPayload(null);
		}
	};

	const runTesterTests = async () => {
		if (!testerPayload?.env) {
			setTesterError('Token must contain an environment ID (env claim)');
			return;
		}
		setTesterIsTesting(true);
		setTesterResults([]);
		setTesterError(null);
		const results: TesterResult[] = [];
		const environmentId = testerPayload.env;
		try {
			const envRes = await fetch('/api/pingone/worker-test/environment', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ environmentId, token: testerToken }),
			});
			const envData = (await envRes.json()) as EnvironmentData & {
				message?: string;
				error_description?: string;
			};
			if (envRes.ok) {
				setTesterEnvData(envData);
				results.push({
					test: 'Get Environment',
					status: 'success',
					statusCode: envRes.status,
					message: 'Token is valid and can read environment',
					details: `${envData.name} (${envData.type})`,
				});
			} else {
				results.push({
					test: 'Get Environment',
					status: 'error',
					statusCode: envRes.status,
					message: envData.message ?? 'Failed to get environment',
					details: envData.error_description,
				});
			}
			if (envRes.ok) {
				const usersRes = await fetch('/api/pingone/worker-test/users', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ environmentId, token: testerToken }),
				});
				const usersData = (await usersRes.json()) as {
					_embedded?: { users?: unknown[] };
					message?: string;
					error_description?: string;
				};
				if (usersRes.ok) {
					results.push({
						test: 'List Users',
						status: 'success',
						statusCode: usersRes.status,
						message: 'Token has user read permissions',
						details: `Found ${usersData._embedded?.users?.length ?? 0} users`,
					});
				} else if (usersRes.status === 403) {
					results.push({
						test: 'List Users',
						status: 'warning',
						statusCode: 403,
						message: 'Token lacks user read permissions',
						details: 'Normal for some worker apps',
					});
				} else {
					results.push({
						test: 'List Users',
						status: 'error',
						statusCode: usersRes.status,
						message: usersData.message ?? 'Failed to list users',
					});
				}
			}
		} catch (err) {
			results.push({
				test: 'API Test',
				status: 'error',
				message: 'Network error',
				details: err instanceof Error ? err.message : 'Unknown error',
			});
		}
		setTesterResults(results);
		setTesterIsTesting(false);
	};

	const formatTesterDate = (ts: number) => new Date(ts * 1000).toLocaleString();
	const formatTesterTime = (secs: number) => {
		const abs = Math.abs(secs);
		const suffix = secs < 0 ? ' ago' : '';
		if (abs < 60) return `${abs}s${suffix}`;
		if (abs < 3600) return `${Math.floor(abs / 60)}m${suffix}`;
		return `${Math.floor(abs / 3600)}h ${Math.floor((abs % 3600) / 60)}m${suffix}`;
	};

	const handleNavigateToFlow = (flowKey: string) => {
		const routeMap: Record<string, string> = {
			'oauth-authorization-code-v7': '/oauth-authorization-code-v7',
			'oidc-authorization-code-v7': '/oauth-authorization-code-v7?variant=oidc',
			'oauth-implicit-v7': '/oauth-implicit-v7',
			'oidc-implicit-v7': '/oauth-implicit-v7?variant=oidc',
			'device-authorization-v7': '/device-authorization-v7',
			'oidc-hybrid-v7': '/oidc-hybrid-v7',
			'client-credentials-v7': '/client-credentials-v7',
			'kroger-mfa': '/kroger-mfa',
			'device-authorization-v6': '/device-authorization-v6',
			configuration: '/configuration',
			'app-generator': '/app-generator',
		};
		const route = routeMap[flowKey];
		if (route) {
			navigate(route);
		}
	};

	return (
		<div style={styles.container}>
			<div style={styles.pageHeader}>
				<h1 style={styles.pageTitle}>
					<span>🔑</span> Credential Management
				</h1>
				<p style={styles.pageSubtitle}>Manage PingOne credentials and validate worker tokens</p>
				<WorkerTokenSectionV8 compact />
			</div>

			<div style={styles.tabBar}>
				<button
					type="button"
					style={{
						background: 'none',
						border: 'none',
						borderBottom: `2px solid ${activeTab === 'credentials' ? 'V9_COLORS.PRIMARY.BLUE_DARK' : 'transparent'}`,
						color: activeTab === 'credentials' ? 'V9_COLORS.PRIMARY.BLUE_DARK' : 'V9_COLORS.TEXT.GRAY_MEDIUM',
						fontSize: '0.95rem',
						fontWeight: activeTab === 'credentials' ? 700 : 500,
						padding: '0.75rem 1.5rem',
						cursor: 'pointer',
						marginBottom: '-2px',
						display: 'flex',
						alignItems: 'center',
						gap: '0.5rem',
					}}
					onClick={() => setActiveTab('credentials')}
				>
					<span style={{ fontSize: '15px' }}>🗄️</span> Flow Credentials
				</button>
				<button
					type="button"
					style={{
						background: 'none',
						border: 'none',
						borderBottom: `2px solid ${activeTab === 'tester' ? 'V9_COLORS.PRIMARY.BLUE_DARK' : 'transparent'}`,
						color: activeTab === 'tester' ? 'V9_COLORS.PRIMARY.BLUE_DARK' : 'V9_COLORS.TEXT.GRAY_MEDIUM',
						fontSize: '0.95rem',
						fontWeight: activeTab === 'tester' ? 700 : 500,
						padding: '0.75rem 1.5rem',
						cursor: 'pointer',
						marginBottom: '-2px',
						display: 'flex',
						alignItems: 'center',
						gap: '0.5rem',
					}}
					onClick={() => setActiveTab('tester')}
				>
					<span style={{ fontSize: '15px' }}>🛡️</span> Token Tester
				</button>
			</div>

			{activeTab === 'tester' ? (
				<div style={styles.card}>
					<h2 style={styles.title}>
						<span>🛡️</span> Worker Token Tester
					</h2>
					<p style={styles.description}>
						Paste a PingOne worker token to decode and validate it against the PingOne API.
					</p>
					<div style={{ marginBottom: '1.5rem' }}>
						<label
							htmlFor="tester-token-input"
							style={{
								display: 'block',
								fontWeight: 600,
								fontSize: '0.875rem',
								color: 'V9_COLORS.TEXT.GRAY_DARK',
								marginBottom: '0.5rem',
							}}
						>
							Worker Token (JWT)
						</label>
						<textarea
							id="tester-token-input"
							rows={6}
							placeholder="Paste your PingOne worker token here (eyJhbGc...)"
							value={testerToken}
							onChange={(e) => handleTesterTokenChange(e.target.value)}
							style={{
								width: '100%',
								padding: '0.75rem',
								border: '1.5px solid V9_COLORS.TEXT.GRAY_LIGHTER',
								borderRadius: '6px',
								fontFamily: 'monospace',
								fontSize: '0.85rem',
								resize: 'vertical',
								boxSizing: 'border-box',
							}}
						/>
						{testerError && (
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '0.5rem',
									color: 'V9_COLORS.PRIMARY.RED_DARK',
									background: 'V9_COLORS.BG.ERROR',
									padding: '0.6rem 1rem',
									borderRadius: '6px',
									marginTop: '0.75rem',
									fontSize: '0.875rem',
								}}
							>
								<span>❌</span> {testerError}
							</div>
						)}
					</div>

					{testerPayload && (
						<>
							<div
								style={{
									display: 'grid',
									gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
									gap: '1rem',
									marginBottom: '1.5rem',
								}}
							>
								{[
									{
										icon: <span>🕐</span>,
										label: 'Status',
										value: testerIsExpired ? 'EXPIRED' : 'VALID',
										color: testerIsExpired ? 'V9_COLORS.PRIMARY.RED_DARK' : 'V9_COLORS.PRIMARY.GREEN_DARK',
										detail:
											testerTimeRemaining !== null
												? (testerIsExpired ? 'Expired ' : 'Expires in ') +
													formatTesterTime(testerTimeRemaining)
												: undefined,
									},
									{
										icon: <span>🔑</span>,
										label: 'Client ID',
										value: testerPayload.client_id ?? 'N/A',
										color: 'V9_COLORS.PRIMARY.BLUE_DARK',
										detail: 'OAuth Client',
									},
									{
										icon: <span>🌐</span>,
										label: 'Environment ID',
										value: testerPayload.env ?? 'N/A',
										color: 'V9_COLORS.PRIMARY.BLUE_DARK',
										detail: 'PingOne Environment',
									},
									{
										icon: <span>👤</span>,
										label: 'Organization',
										value: testerPayload.org ?? 'N/A',
										color: 'V9_COLORS.PRIMARY.BLUE_DARK',
										detail: 'PingOne Org',
									},
								].map(({ icon, label, value, color, detail }) => (
									<div
										key={label}
										style={{
											display: 'flex',
											gap: '0.75rem',
											padding: '1rem',
											background: '#f9fafb',
											borderRadius: '8px',
											border: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
										}}
									>
										<div style={{ color, fontSize: '1.25rem', flexShrink: 0, marginTop: 2 }}>
											{icon}
										</div>
										<div>
											<div
												style={{
													fontSize: '0.7rem',
													textTransform: 'uppercase',
													color: 'V9_COLORS.TEXT.GRAY_MEDIUM',
													letterSpacing: '0.05em',
													marginBottom: 2,
												}}
											>
												{label}
											</div>
											<div
												style={{
													fontWeight: 700,
													color,
													wordBreak: 'break-all',
													fontSize: '0.9rem',
												}}
											>
												{value}
											</div>
											{detail && (
												<div style={{ fontSize: '0.75rem', color: 'V9_COLORS.TEXT.GRAY_LIGHT', marginTop: 2 }}>
													{detail}
												</div>
											)}
										</div>
									</div>
								))}
							</div>

							<div
								style={{
									background: '#f9fafb',
									borderRadius: '8px',
									border: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
									overflow: 'hidden',
									marginBottom: '1.5rem',
								}}
							>
								{[
									['Issued At', testerPayload.iat ? formatTesterDate(testerPayload.iat) : 'N/A'],
									['Expires At', testerPayload.exp ? formatTesterDate(testerPayload.exp) : 'N/A'],
									['Issuer', testerPayload.iss ?? 'N/A'],
									[
										'Audience',
										Array.isArray(testerPayload.aud)
											? testerPayload.aud.join(', ')
											: (testerPayload.aud ?? 'N/A'),
									],
									...(testerPayload.scope ? [['Scope', testerPayload.scope]] : []),
									['JWT ID', testerPayload.jti ?? 'N/A'],
								].map(([k, v], i) => (
									<div
										key={k}
										style={{
											display: 'flex',
											gap: '1rem',
											padding: '0.6rem 1rem',
											borderBottom: i < 5 ? '1px solid V9_COLORS.TEXT.GRAY_LIGHTER' : undefined,
										}}
									>
										<span
											style={{
												fontWeight: 600,
												color: 'V9_COLORS.TEXT.GRAY_MEDIUM',
												minWidth: 110,
												flexShrink: 0,
												fontSize: '0.875rem',
											}}
										>
											{k}
										</span>
										<span
											style={{
												color: 'V9_COLORS.TEXT.GRAY_DARK',
												wordBreak: 'break-all',
												fontFamily: 'monospace',
												fontSize: '0.8rem',
											}}
										>
											{v}
										</span>
									</div>
								))}
							</div>

							{testerEnvData && (
								<div
									style={{
										background: 'V9_COLORS.BG.GRAY_LIGHT',
										borderRadius: '8px',
										border: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
										padding: '1rem',
										marginBottom: '1.5rem',
									}}
								>
									<div
										style={{
											fontWeight: 700,
											color: 'V9_COLORS.PRIMARY.BLUE_DARK',
											marginBottom: '0.75rem',
											fontSize: '0.95rem',
										}}
									>
										Environment Details
									</div>
									<div
										style={{
											display: 'grid',
											gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
											gap: '0.5rem',
										}}
									>
										{[
											['Name', testerEnvData.name],
											['Type', testerEnvData.type],
											['Region', testerEnvData.region],
											['License', testerEnvData.license?.name],
										]
											.filter(([, v]) => v)
											.map(([k, v]) => (
												<div key={k}>
													<span
														style={{
															fontSize: '0.75rem',
															color: 'V9_COLORS.TEXT.GRAY_MEDIUM',
															textTransform: 'uppercase',
														}}
													>
														{k}
													</span>
													<div style={{ fontWeight: 600, color: '#1e3a8a' }}>{v}</div>
												</div>
											))}
									</div>
								</div>
							)}

							{testerIsExpired && (
								<div
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: '0.5rem',
										color: 'V9_COLORS.PRIMARY.YELLOW_DARK',
										background: 'V9_COLORS.BG.WARNING',
										padding: '0.6rem 1rem',
										borderRadius: '6px',
										marginBottom: '0.75rem',
										fontSize: '0.875rem',
									}}
								>
									<span>⚠️</span> This token is expired — API validation will fail
								</div>
							)}

							<button
								type="button"
								style={{
									...styles.actionButton,
									width: '100%',
									justifyContent: 'center',
									padding: '0.75rem',
									background: testerIsTesting || testerIsExpired ? 'V9_COLORS.TEXT.GRAY_LIGHT' : 'V9_COLORS.PRIMARY.BLUE_DARK',
									fontSize: '0.95rem',
									cursor: testerIsTesting || testerIsExpired ? 'not-allowed' : 'pointer',
									marginTop: 0,
								}}
								onClick={runTesterTests}
								disabled={testerIsTesting || testerIsExpired}
							>
								<span>🛡️</span> {testerIsTesting ? 'Testing...' : 'Test Token Against PingOne API'}
							</button>
							{testerResults.length > 0 && (
								<div
									style={{
										marginTop: '1.25rem',
										display: 'flex',
										flexDirection: 'column',
										gap: '0.75rem',
									}}
								>
									{testerResults.map((r, i) => (
										<div
											key={i}
											style={{
												padding: '0.75rem 1rem',
												borderLeft: `4px solid ${r.status === 'success' ? 'V9_COLORS.PRIMARY.GREEN_DARK' : r.status === 'error' ? 'V9_COLORS.PRIMARY.RED_DARK' : 'V9_COLORS.PRIMARY.YELLOW'}`,
												background:
													r.status === 'success'
														? '#f0fdf4'
														: r.status === 'error'
															? 'V9_COLORS.BG.ERROR'
															: 'V9_COLORS.BG.WARNING',
												borderRadius: '6px',
											}}
										>
											<div
												style={{
													display: 'flex',
													alignItems: 'center',
													gap: '0.5rem',
													marginBottom: '0.25rem',
												}}
											>
												{r.status === 'success' ? (
													<FiCheckCircle color="V9_COLORS.PRIMARY.GREEN_DARK" />
												) : r.status === 'error' ? (
													<FiXCircle color="V9_COLORS.PRIMARY.RED_DARK" />
												) : (
													<FiAlertCircle color="V9_COLORS.PRIMARY.YELLOW" />
												)}
												<strong style={{ flex: 1 }}>{r.test}</strong>
												{r.statusCode && (
													<span
														style={{
															padding: '0.2rem 0.6rem',
															borderRadius: '4px',
															fontSize: '0.8rem',
															fontWeight: 700,
															background:
																r.status === 'success'
																	? 'V9_COLORS.PRIMARY.GREEN_DARK'
																	: r.status === 'error'
																		? 'V9_COLORS.PRIMARY.RED_DARK'
																		: 'V9_COLORS.PRIMARY.YELLOW',
															color: 'white',
														}}
													>
														{r.statusCode}
													</span>
												)}
											</div>
											<div style={{ fontSize: '0.875rem', color: 'V9_COLORS.TEXT.GRAY_DARK' }}>{r.message}</div>
											{r.details && (
												<div style={{ fontSize: '0.8rem', color: 'V9_COLORS.TEXT.GRAY_MEDIUM', marginTop: '0.2rem' }}>
													{r.details}
												</div>
											)}
										</div>
									))}
								</div>
							)}
						</>
					)}
				</div>
			) : (
				<div style={styles.card}>
					<h2 style={styles.title}>
						<span>🗄️</span>
						Flow Credentials
					</h2>
					<p style={styles.description}>
						View and manage credentials for all OAuth and OIDC flows. Credentials are stored
						securely in browser storage and backed up to file storage for persistence.
					</p>

					<div style={styles.buttonRow}>
						<button type="button" style={styles.refreshButton} onClick={loadFlowCredentials}>
							<span>🔄</span>
							Refresh Status
						</button>

						<button type="button" style={styles.exportButton} onClick={handleExportCredentials}>
							<span>📥</span>
							Export All Credentials
						</button>

						<label style={styles.importLabel}>
							<span>📤</span>
							Import Credentials
							<input
								type="file"
								accept=".json"
								style={styles.hiddenFileInput}
								onChange={handleImportCredentials}
							/>
						</label>

						<button
							type="button"
							style={styles.clearButton}
							onClick={() => setShowClearAllModal(true)}
						>
							<span>🗑️</span>
							Clear All Credentials
						</button>
					</div>

					{loading ? (
						<div style={styles.emptyState}>Loading credential information...</div>
					) : flows.length === 0 ? (
						<div style={styles.emptyState}>No flows found</div>
					) : (
						<div style={styles.flowGrid}>
							{flows.map((flow) => (
								<button
									type="button"
									key={flow.flowKey}
									style={{
										borderRadius: '8px',
										padding: '1.5rem',
										cursor: 'pointer',
										border: 'none',
										textAlign: 'left',
										width: '100%',
										...(flow.hasCredentials
											? { background: '#f0fdf4', outline: '2px solid #86efac' }
											: { background: '#f9fafb', outline: '2px solid V9_COLORS.TEXT.GRAY_LIGHTER' }),
									}}
									onClick={() => handleNavigateToFlow(flow.flowKey)}
								>
									<h3 style={styles.flowName}>
										{flow.hasCredentials ? (
											<FiCheckCircle color="V9_COLORS.PRIMARY.GREEN_DARK" />
										) : (
											<FiAlertCircle color="V9_COLORS.TEXT.GRAY_LIGHT" />
										)}
										{flow.flowName}
									</h3>

									<div
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: '0.5rem',
											fontSize: '0.875rem',
											color: flow.hasCredentials ? 'V9_COLORS.PRIMARY.GREEN_DARK' : 'V9_COLORS.TEXT.GRAY_LIGHT',
											marginBottom: '0.75rem',
										}}
									>
										{flow.hasCredentials ? 'Credentials Saved' : 'No Credentials'}
									</div>

									{flow.hasCredentials && (
										<div style={styles.flowMeta}>
											{flow.environmentId && (
												<div style={styles.metaRow}>
													<strong>Environment:</strong> {flow.environmentId.substring(0, 8)}...
												</div>
											)}
											{flow.clientId && (
												<div style={styles.metaRow}>
													<strong>Client ID:</strong> {flow.clientId.substring(0, 12)}...
												</div>
											)}
											{flow.source && (
												<div style={styles.metaRow}>
													<span
														style={{
															display: 'inline-flex',
															alignItems: 'center',
															gap: '0.25rem',
															padding: '0.25rem 0.5rem',
															borderRadius: '4px',
															fontSize: '0.75rem',
															fontWeight: 500,
															...(flow.source === 'file'
																? { background: '#dbeafe', color: 'V9_COLORS.PRIMARY.BLUE_DARK' }
																: flow.source === 'browser'
																	? { background: 'V9_COLORS.BG.WARNING', color: 'V9_COLORS.PRIMARY.YELLOW_DARK' }
																	: { background: '#e0e7ff', color: '#4338ca' }),
														}}
													>
														{flow.source === 'browser' && <span style={{ fontSize: '12px' }}>💾</span>}
														{flow.source === 'file' && <span style={{ fontSize: '12px' }}>🗄️</span>}
														{flow.source.toUpperCase()}
													</span>
												</div>
											)}
										</div>
									)}

									<button
										type="button"
										style={styles.actionButton}
										onClick={(e) => {
											e.stopPropagation();
											handleNavigateToFlow(flow.flowKey);
										}}
									>
										<span>🔗</span>
										Open Flow
									</button>
								</button>
							))}
						</div>
					)}
				</div>
			)}
			{/* Clear All Credentials Confirmation Modal */}
			<ConfirmationModal
				isOpen={showClearAllModal}
				onClose={() => setShowClearAllModal(false)}
				onConfirm={handleClearAllCredentials}
				title="Clear All Credentials"
				message="Are you sure you want to clear ALL credentials? This action cannot be undone."
				confirmText="Clear All"
				cancelText="Cancel"
				variant="danger"
				isLoading={isClearingAll}
			/>
		</div>
	);
};
