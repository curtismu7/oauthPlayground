import {
	FiAlertCircle,
	FiCheckCircle,
	FiCopy,
	FiDownload,
	FiExternalLink,
	FiGithub,
	FiInfo,
	FiKey,
	FiPackage,
	FiPlay,
	FiSave,
	FiSettings,
	FiTerminal,
} from '@icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import packageJson from '../../package.json';
import ConfigurationURIChecker from '../components/ConfigurationURIChecker';
import PingOneApplicationConfig, {
	type PingOneApplicationState,
} from '../components/PingOneApplicationConfig';
import type { StepCredentials } from '../components/steps/CommonSteps';
import { usePageScroll } from '../hooks/usePageScroll';
import { callbackUriService } from '../services/callbackUriService';
import { CollapsibleHeader } from '../services/collapsibleHeaderService';
import { CopyButtonService } from '../services/copyButtonService';
import { credentialStorageManager } from '../services/credentialStorageManager';
import { FlowHeader } from '../services/flowHeaderService';
import { unifiedWorkerTokenService } from '../services/unifiedWorkerTokenService';
import { credentialManager } from '../utils/credentialManager';
import { v4ToastManager } from '../utils/v4ToastMessages';
import { WorkerTokenSectionV8 } from '../v8/components/WorkerTokenSectionV8';

const styles = {
	container: {
		maxWidth: '1200px',
		margin: '0 auto',
		padding: '1.5rem',
	} as React.CSSProperties,
	card: {
		background: 'white',
		borderRadius: '1rem',
		padding: '2rem',
		boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
		marginBottom: '2rem',
		border: '1px solid #e5e7eb',
	} as React.CSSProperties,
	stepCard: {
		background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
		border: '2px solid #e5e7eb',
		borderRadius: '0.75rem',
		padding: '1.5rem',
		marginBottom: '1.5rem',
	} as React.CSSProperties,
	stepHeader: {
		display: 'flex',
		alignItems: 'center',
		gap: '1rem',
		marginBottom: '1rem',
	} as React.CSSProperties,
	stepNumber: {
		width: '32px',
		height: '32px',
		background: '#2563eb',
		color: 'white',
		borderRadius: '50%',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		fontWeight: '600',
		fontSize: '0.875rem',
		flexShrink: 0,
	} as React.CSSProperties,
	stepTitle: {
		fontSize: '1.125rem',
		fontWeight: '600',
		color: '#0f172a',
		margin: 0,
	} as React.CSSProperties,
	codeBlock: {
		backgroundColor: '#1f2937',
		color: '#f9fafb',
		borderRadius: '0.5rem',
		padding: '1.5rem',
		fontFamily: '"Monaco", "Menlo", "Ubuntu Mono", monospace',
		fontSize: '0.875rem',
		lineHeight: 1.6,
		overflowX: 'auto',
		margin: '1rem 0',
		border: '1px solid #374151',
		position: 'relative',
	} as React.CSSProperties,
	copyButton: {
		position: 'absolute',
		top: '0.75rem',
		right: '0.75rem',
		background: 'rgba(255, 255, 255, 0.1)',
		border: '1px solid rgba(255, 255, 255, 0.2)',
		color: 'white',
		borderRadius: '0.375rem',
		padding: '0.5rem',
		cursor: 'pointer',
		fontSize: '0.75rem',
		display: 'flex',
		alignItems: 'center',
		gap: '0.25rem',
	} as React.CSSProperties,
	featureGrid: {
		display: 'grid',
		gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
		gap: '1rem',
		margin: '1.5rem 0',
	} as React.CSSProperties,
	featureItem: {
		display: 'flex',
		alignItems: 'center',
		gap: '0.75rem',
		padding: '0.75rem',
		background: '#f8fafc',
		border: '1px solid #e2e8f0',
		borderRadius: '0.5rem',
	} as React.CSSProperties,
	uriTable: {
		width: '100%',
		borderCollapse: 'collapse',
		marginTop: '1.5rem',
	} as React.CSSProperties,
	uriHeaderCell: {
		textAlign: 'left',
		padding: '0.75rem 1rem',
		background: '#f1f5f9',
		color: '#0f172a',
		fontSize: '0.9rem',
		textTransform: 'uppercase',
		letterSpacing: '0.05em',
		borderBottom: '2px solid #e2e8f0',
	} as React.CSSProperties,
	uriCell: {
		padding: '0.85rem 1rem',
		verticalAlign: 'top',
		borderBottom: '1px solid #e2e8f0',
	} as React.CSSProperties,
	uriValue: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: '0.75rem',
		flexWrap: 'wrap',
	} as React.CSSProperties,
	uriCode: {
		fontFamily:
			'"Fira Code", "SFMono-Regular", ui-monospace, Menlo, Monaco, Consolas, "Courier New", monospace',
		background: '#f8fafc',
		padding: '0.35rem 0.5rem',
		borderRadius: '0.5rem',
		border: '1px solid #e2e8f0',
		color: '#0f172a',
		wordBreak: 'break-all',
	} as React.CSSProperties,
	uriDescription: {
		margin: '0.35rem 0 0',
		fontSize: '0.85rem',
		color: '#475569',
	} as React.CSSProperties,
	uriActionRow: {
		display: 'flex',
		justifyContent: 'flex-end',
		gap: '0.75rem',
		marginTop: '1.25rem',
		flexWrap: 'wrap',
	} as React.CSSProperties,
	uriInput: {
		width: '100%',
		padding: '0.65rem 0.75rem',
		borderRadius: '0.6rem',
		border: '1px solid #cbd5f5',
		background: '#ffffff',
		color: '#0f172a',
		fontSize: '0.9rem',
	} as React.CSSProperties,
	uriHelper: {
		margin: '0.35rem 0 0',
		fontSize: '0.8rem',
		color: '#64748b',
	} as React.CSSProperties,
};

const _getInfoBoxStyle = (type?: 'info' | 'warning' | 'success' | 'error'): React.CSSProperties => {
	const base: React.CSSProperties = {
		padding: '1rem',
		borderRadius: '0.5rem',
		margin: '1rem 0',
		borderLeft: '4px solid',
	};
	switch (type) {
		case 'warning':
			return { ...base, backgroundColor: '#fef3c7', borderLeftColor: '#f59e0b', color: '#92400e' };
		case 'success':
			return { ...base, backgroundColor: '#d1fae5', borderLeftColor: '#10b981', color: '#065f46' };
		case 'error':
			return { ...base, backgroundColor: '#fee2e2', borderLeftColor: '#ef4444', color: '#991b1b' };
		default:
			return { ...base, backgroundColor: '#dbeafe', borderLeftColor: '#3b82f6', color: '#1e40af' };
	}
};

const _getUriActionButtonStyle = (variant?: 'primary' | 'secondary'): React.CSSProperties => ({
	borderRadius: '0.75rem',
	padding: '0.65rem 1rem',
	fontWeight: '600',
	cursor: 'pointer',
	border: `1px solid ${variant === 'primary' ? '#2563eb' : '#cbd5f5'}`,
	background: variant === 'primary' ? '#2563eb' : '#ffffff',
	color: variant === 'primary' ? '#ffffff' : '#0f172a',
});

const _getUriStatusBadgeStyle = (variant: 'default' | 'override'): React.CSSProperties => ({
	display: 'inline-block',
	padding: '0.35rem 0.6rem',
	borderRadius: '0.5rem',
	fontSize: '0.75rem',
	fontWeight: '600',
	background: variant === 'override' ? '#0f172a' : '#e2e8f0',
	color: variant === 'override' ? '#ffffff' : '#0f172a',
});

const Configuration: React.FC = () => {
	usePageScroll({ pageName: 'Configuration & Setup', force: true });
	const [copiedText, setCopiedText] = useState<string>('');

	const buildUriEditState = useCallback(
		(catalog: ReturnType<typeof callbackUriService.getRedirectUriCatalog>) =>
			catalog.reduce<Record<string, { redirectUri: string; logoutUri: string }>>((acc, entry) => {
				acc[entry.flowType] = {
					redirectUri:
						entry.requiresRedirectUri && entry.redirectUri !== 'Not required'
							? entry.redirectUri
							: '',
					logoutUri: entry.logoutUri,
				};
				return acc;
			}, {}),
		[]
	);

	const initialUriCatalog = useMemo(() => callbackUriService.getRedirectUriCatalog(), []);
	const [uriCatalog, setUriCatalog] = useState(initialUriCatalog);
	const [uriEdits, setUriEdits] = useState(() => buildUriEditState(initialUriCatalog));
	const [uriSaving, setUriSaving] = useState(false);

	// Only update uriEdits when uriCatalog actually changes (not on every render)
	useEffect(() => {
		const newEdits = buildUriEditState(uriCatalog);
		// Only update if the content actually changed
		setUriEdits((prevEdits) => {
			const hasChanged = JSON.stringify(prevEdits) !== JSON.stringify(newEdits);
			return hasChanged ? newEdits : prevEdits;
		});
	}, [uriCatalog, buildUriEditState]);

	// Handle hash navigation to specific flow rows
	useEffect(() => {
		const handleHashChange = () => {
			const hash = window.location.hash.slice(1); // Remove the '#'
			if (hash.startsWith('redirect-uri-catalog-')) {
				// Wait for the DOM to render
				setTimeout(() => {
					const element = document.getElementById(hash);
					if (element) {
						// Scroll to the element
						element.scrollIntoView({ behavior: 'smooth', block: 'center' });

						// Highlight the row temporarily
						element.style.backgroundColor = '#fef3c7'; // Light yellow
						setTimeout(() => {
							element.style.backgroundColor = '';
						}, 2000);
					}
				}, 300);
			}
		};

		// Handle initial hash on mount
		handleHashChange();

		// Listen for hash changes
		window.addEventListener('hashchange', handleHashChange);
		return () => window.removeEventListener('hashchange', handleHashChange);
	}, []);

	const handleUriChange = (flowType: string, field: 'redirectUri' | 'logoutUri', value: string) => {
		setUriEdits((prev) => ({
			...prev,
			[flowType]: {
				redirectUri: prev[flowType]?.redirectUri ?? '',
				logoutUri: prev[flowType]?.logoutUri ?? '',
				[field]: value,
			},
		}));
	};

	const handleResetUriRow = (flowType: string) => {
		const row = uriCatalog.find((entry) => entry.flowType === flowType);
		if (!row) {
			return;
		}

		setUriEdits((prev) => ({
			...prev,
			[flowType]: {
				redirectUri:
					row.requiresRedirectUri && row.defaultRedirectUri !== 'Not required'
						? row.defaultRedirectUri
						: '',
				logoutUri: row.defaultLogoutUri,
			},
		}));
	};

	const handleResetAllUris = () => {
		setUriSaving(true);
		try {
			callbackUriService.applyFlowOverrides({});
			const updatedCatalog = callbackUriService.getRedirectUriCatalog();
			setUriCatalog(updatedCatalog);
			v4ToastManager.showSuccess('Callback URIs reset to default values.');
		} catch (error) {
			console.error('[Configuration] Failed to reset callback URIs:', error);
			v4ToastManager.showError('Unable to reset callback URIs. Check the console for details.');
		} finally {
			setUriSaving(false);
		}
	};

	const handleApplyUriOverrides = () => {
		setUriSaving(true);
		try {
			const overrides = uriCatalog.reduce<
				Record<string, { redirectUri?: string; logoutUri?: string }>
			>((acc, entry) => {
				const edit = uriEdits[entry.flowType];
				if (!edit) {
					return acc;
				}

				const redirectValue = edit.redirectUri.trim();
				const logoutValue = edit.logoutUri.trim();

				const needsRedirectOverride =
					entry.requiresRedirectUri && redirectValue && redirectValue !== entry.defaultRedirectUri;

				const needsLogoutOverride = logoutValue && logoutValue !== entry.defaultLogoutUri;

				if (needsRedirectOverride || needsLogoutOverride) {
					acc[entry.flowType] = {};
					if (needsRedirectOverride) {
						acc[entry.flowType].redirectUri = redirectValue;
					}
					if (needsLogoutOverride) {
						acc[entry.flowType].logoutUri = logoutValue;
					}
				}

				return acc;
			}, {});

			callbackUriService.applyFlowOverrides(overrides);
			const updatedCatalog = callbackUriService.getRedirectUriCatalog();
			setUriCatalog(updatedCatalog);

			const hasOverrides = Object.keys(overrides).length > 0;
			v4ToastManager.showSuccess(
				hasOverrides
					? 'Callback URIs updated successfully.'
					: 'Callback URIs now using default values.'
			);
		} catch (error) {
			console.error('[Configuration] Failed to apply callback URI overrides:', error);
			v4ToastManager.showError('Unable to update callback URIs. Check the console for details.');
		} finally {
			setUriSaving(false);
		}
	};

	// Credential state
	// Comprehensive credentials state
	const [credentials, setCredentials] = useState<StepCredentials>({
		environmentId: '',
		clientId: '',
		clientSecret: '',
		redirectUri: 'https://localhost:3000/callback',
		scope: 'openid profile email',
		scopes: 'openid profile email',
		region: 'us',
		responseType: 'code',
		grantType: 'authorization_code',
		clientAuthMethod: 'client_secret_post',
		tokenEndpointAuthMethod: 'client_secret_post',
		issuerUrl: '',
		authorizationEndpoint: '',
		tokenEndpoint: '',
		userInfoEndpoint: '',
		loginHint: '',
		postLogoutRedirectUri: '',
	});

	const [pingOneConfig, setPingOneConfig] = useState<PingOneApplicationState>({
		clientAuthMethod: 'client_secret_basic',
		allowRedirectUriPatterns: false,
		pkceEnforcement: 'REQUIRED',
		responseTypeCode: true,
		responseTypeToken: false,
		responseTypeIdToken: true,
		grantTypeAuthorizationCode: true,
		initiateLoginUri: '',
		targetLinkUri: '',
		signoffUrls: [],
		requestParameterSignatureRequirement: 'DEFAULT',
		enableJWKS: false,
		jwksMethod: 'JWKS_URL',
		jwksUrl: '',
		jwks: '',
		requirePushedAuthorizationRequest: false,
		enableDPoP: false,
		dpopAlgorithm: 'ES256',
		additionalRefreshTokenReplayProtection: false,
		includeX5tParameter: false,
		oidcSessionManagement: false,
		requestScopesForMultipleResources: false,
		terminateUserSessionByIdToken: false,
		corsOrigins: [],
		corsAllowAnyOrigin: false,
	});
	const [pingOneConfigSaved, setPingOneConfigSaved] = useState(false);

	// Worker token state - using unifiedWorkerTokenService for consistency
	const [workerToken, setWorkerToken] = useState<string>(() => {
		// Try to get token from unifiedWorkerTokenService first
		try {
			const tokenData = unifiedWorkerTokenService.getTokenDataSync();
			return tokenData?.token || '';
		} catch {
			return '';
		}
	});
	// Load existing credentials on mount
	useEffect(() => {
		const loadCredentials = () => {
			try {
				const configCredentials = credentialManager.loadConfigCredentials();
				if (configCredentials.environmentId && configCredentials.clientId) {
					setCredentials({
						environmentId: configCredentials.environmentId,
						clientId: configCredentials.clientId,
						clientSecret: configCredentials.clientSecret || '',
						redirectUri: configCredentials.redirectUri || 'https://localhost:3000/callback',
						scopes: Array.isArray(configCredentials.scopes)
							? configCredentials.scopes.join(' ')
							: configCredentials.scopes || 'openid profile email',
					});
				}
			} catch (error) {
				console.error('Failed to load credentials:', error);
			}
		};

		loadCredentials();
	}, []);

	// Load existing PingOne configuration on mount
	useEffect(() => {
		const loadPingOneConfig = async () => {
			try {
				const savedConfig = await credentialStorageManager.loadFlowData<PingOneApplicationState>(
					'configuration',
					'pingone-application-config'
				);
				if (savedConfig) {
					setPingOneConfig((prev) => ({ ...prev, ...savedConfig }));
				}
			} catch (error) {
				console.error('Failed to load PingOne configuration:', error);
			}
		};

		void loadPingOneConfig();
	}, []);

	// Save PingOne Application Configuration
	const savePingOneConfig = async () => {
		try {
			// Save to credentialStorageManager
			await credentialStorageManager.saveFlowData(
				'configuration',
				'pingone-application-config',
				pingOneConfig
			);
			setPingOneConfigSaved(true);

			// Show success message
			setTimeout(() => setPingOneConfigSaved(false), 3000);
		} catch (error) {
			console.error('Failed to save PingOne configuration:', error);
		}
	};

	const copyToClipboard = async (text: string, label: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedText(label);
			setTimeout(() => setCopiedText(''), 2000);
		} catch (err) {
			console.error('Failed to copy text: ', err);
		}
	};

	const CodeBlockWithCopy = ({ children, label }: { children: string; label: string }) => (
		<pre style={styles.codeBlock}>
			<button
				type="button"
				style={styles.copyButton}
				onClick={() => copyToClipboard(children, label)}
			>
				<FiCopy />
				{copiedText === label ? 'Copied!' : 'Copy'}
			</button>
			{children}
		</pre>
	);

	return (
		<div style={styles.container}>
			<FlowHeader flowId="configuration" />

			<div
				style={{
					background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
					borderRadius: '1rem',
					padding: '2rem',
					marginBottom: '2rem',
					textAlign: 'center',
					color: 'white',
				}}
			>
				<h1
					style={{
						fontSize: '2rem',
						fontWeight: '700',
						color: 'white',
						marginBottom: '0.5rem',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						gap: '0.75rem',
					}}
				>
					<FiSettings />
					Setup & Config
				</h1>
				<p
					style={{
						color: 'rgba(255,255,255,0.85)',
						fontSize: '1.1rem',
						maxWidth: '700px',
						margin: '0 auto',
					}}
				>
					Complete setup guide for the PingOne OAuth/OIDC Playground. Get your environment
					configured and start exploring OAuth flows in minutes.
				</p>
			</div>

			{/* Worker Token Section - First Step */}
			<CollapsibleHeader
				title="Worker Token Credentials"
				subtitle="Obtain a PingOne Management API worker token to enable Config Checker functionality across all flows"
				icon={<FiKey />}
				defaultCollapsed={false}
			>
				<WorkerTokenSectionV8 compact onTokenUpdated={(token) => setWorkerToken(token || '')} />
			</CollapsibleHeader>

			{/* Configuration URI Reference Table */}
			<CollapsibleHeader
				title="PingOne Redirect & Logout URIs"
				subtitle="Authoritative URIs to register in PingOne for each Playground flow"
				icon={<FiInfo />}
				defaultCollapsed={false}
				theme="orange"
				id="redirect-uri-catalog"
			>
				<Card>
					<p
						style={{
							marginBottom: '1rem',
							color: '#475569',
							lineHeight: 1.6,
						}}
					>
						Use this catalogue to copy the exact redirect and logout callback URIs that the OAuth
						Playground expects. Register these values in your PingOne application to avoid redirect
						mismatches and RP-initiated logout failures. Redirect URIs marked
						<strong> Not required</strong> may be omitted in PingOne. You can customise the URIs
						below and the Playground will update instantly.
					</p>

					<UriActionRow>
						<UriActionButton
							$variant="primary"
							onClick={handleApplyUriOverrides}
							disabled={uriSaving}
						>
							{uriSaving ? 'Saving URIs...' : 'Apply Changes'}
						</UriActionButton>
						<UriActionButton $variant="secondary" onClick={handleResetAllUris} disabled={uriSaving}>
							Reset All to Defaults
						</UriActionButton>
					</UriActionRow>

					<UriTable>
						<thead>
							<tr>
								<UriHeaderCell style={{ width: '25%' }}>Flow</UriHeaderCell>
								<UriHeaderCell style={{ width: '30%' }}>Redirect URI</UriHeaderCell>
								<UriHeaderCell style={{ width: '30%' }}>Logout URI</UriHeaderCell>
								<UriHeaderCell style={{ width: '15%' }}>Specification</UriHeaderCell>
							</tr>
						</thead>
						<tbody>
							{uriCatalog.map((entry) => {
								const edit = uriEdits[entry.flowType] ?? {
									redirectUri:
										entry.requiresRedirectUri && entry.redirectUri !== 'Not required'
											? entry.redirectUri
											: '',
									logoutUri: entry.logoutUri,
								};
								const flowOverride = entry.isOverrideRedirect || entry.isOverrideLogout;

								return (
									<UriRow
										key={entry.flowType}
										id={`redirect-uri-catalog-${entry.flowType}`}
										style={{
											scrollMarginTop: '100px',
											transition: 'background-color 0.3s ease',
										}}
									>
										<UriCell>
											<div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
												<div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
													<strong style={{ color: '#0f172a' }}>{entry.flowType}</strong>
													<UriStatusBadge $variant={flowOverride ? 'override' : 'default'}>
														{flowOverride ? 'Override' : 'Default'}
													</UriStatusBadge>
												</div>
												<UriDescription>{entry.description}</UriDescription>
											</div>
										</UriCell>
										<UriCell>
											{entry.requiresRedirectUri ? (
												<div style={{ display: 'grid', gap: '0.5rem' }}>
													<UriValue>
														<UriCode>{entry.redirectUri}</UriCode>
														{entry.redirectUri !== 'Not required' && (
															<CopyButtonService
																text={entry.redirectUri}
																label="Redirect URI"
																size="sm"
																variant="outline"
																showLabel={false}
															/>
														)}
													</UriValue>
													<UriInput
														value={edit.redirectUri}
														onChange={(event) =>
															handleUriChange(entry.flowType, 'redirectUri', event.target.value)
														}
														placeholder={entry.defaultRedirectUri}
													/>
													<div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
														<UriHelper>Default: {entry.defaultRedirectUri}</UriHelper>
														<UriActionButton
															$variant="secondary"
															style={{ padding: '0.4rem 0.65rem', fontSize: '0.75rem' }}
															onClick={() => handleResetUriRow(entry.flowType)}
															disabled={uriSaving}
														>
															Reset Row
														</UriActionButton>
													</div>
												</div>
											) : (
												<div>
													<em style={{ color: '#94a3b8' }}>Not required for this flow</em>
													<UriHelper>
														PingOne does not expect a redirect URI for this flow. Leave the field
														blank.
													</UriHelper>
												</div>
											)}
										</UriCell>
										<UriCell>
											<div style={{ display: 'grid', gap: '0.5rem' }}>
												<UriValue>
													<UriCode>{entry.logoutUri}</UriCode>
													<CopyButtonService
														text={entry.logoutUri}
														label="Logout URI"
														size="sm"
														variant="outline"
														showLabel={false}
													/>
												</UriValue>
												<UriInput
													value={edit.logoutUri}
													onChange={(event) =>
														handleUriChange(entry.flowType, 'logoutUri', event.target.value)
													}
													placeholder={entry.defaultLogoutUri}
												/>
												<UriHelper>Default: {entry.defaultLogoutUri}</UriHelper>
											</div>
										</UriCell>
										<UriCell>
											<UriCode>{entry.specification}</UriCode>
										</UriCell>
									</UriRow>
								);
							})}
						</tbody>
					</UriTable>
				</Card>
			</CollapsibleHeader>

			{/* Configuration URI Status - Check redirect and logout URIs against PingOne */}
			{!!workerToken && credentials.environmentId && credentials.clientId && (
				<ConfigurationURIChecker
					flowType="configuration"
					environmentId={credentials.environmentId}
					clientId={credentials.clientId}
					workerToken={workerToken || undefined}
					redirectUri={credentials.redirectUri || ''}
					postLogoutRedirectUri={credentials.postLogoutRedirectUri || ''}
					region={credentials.region || 'us'}
				/>
			)}

			<CollapsibleHeader
				title="Application Information"
				subtitle="Current version and system requirements for the OAuth Playground"
				icon={<FiPackage />}
				defaultCollapsed={false}
			>
				<Card style={{ border: 'none', boxShadow: 'none', marginBottom: 0 }}>
					<div
						style={{
							display: 'grid',
							gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
							gap: '1rem',
							marginBottom: '2rem',
						}}
					>
						<div style={{ textAlign: 'center', padding: '1rem' }}>
							<div
								style={{
									fontSize: '2rem',
									fontWeight: '700',
									color: '#3b82f6',
									marginBottom: '0.5rem',
								}}
							>
								{packageJson.version}
							</div>
							<div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Version</div>
						</div>
						<div style={{ textAlign: 'center', padding: '1rem' }}>
							<div
								style={{
									fontSize: '2rem',
									fontWeight: '700',
									color: '#10b981',
									marginBottom: '0.5rem',
								}}
							>
								Node.js 16+
							</div>
							<div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Requirement</div>
						</div>
						<div style={{ textAlign: 'center', padding: '1rem' }}>
							<div
								style={{
									fontSize: '2rem',
									fontWeight: '700',
									color: '#f59e0b',
									marginBottom: '0.5rem',
								}}
							>
								React + Vite
							</div>
							<div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Framework</div>
						</div>
					</div>

					<FeatureGrid>
						<FeatureItem>
							<FiCheckCircle className="feature-icon" />
							<span className="feature-text">Interactive OAuth Flows</span>
						</FeatureItem>
						<FeatureItem>
							<FiCheckCircle className="feature-icon" />
							<span className="feature-text">Real PingOne Integration</span>
						</FeatureItem>
						<FeatureItem>
							<FiCheckCircle className="feature-icon" />
							<span className="feature-text">Token Management</span>
						</FeatureItem>
						<FeatureItem>
							<FiCheckCircle className="feature-icon" />
							<span className="feature-text">Educational Content</span>
						</FeatureItem>
						<FeatureItem>
							<FiCheckCircle className="feature-icon" />
							<span className="feature-text">Flow Comparison Tools</span>
						</FeatureItem>
						<FeatureItem>
							<FiCheckCircle className="feature-icon" />
							<span className="feature-text">Interactive Diagrams</span>
						</FeatureItem>
					</FeatureGrid>
				</Card>
			</CollapsibleHeader>

			<CollapsibleHeader
				title="Quick Start Setup"
				subtitle="Get the OAuth Playground running in minutes with these simple steps"
				icon={<FiTerminal />}
				defaultCollapsed={false}
			>
				<Card style={{ border: 'none', boxShadow: 'none', marginBottom: 0 }}>
					<StepCard>
						<StepHeader>
							<div className="step-number">1</div>
							<h3>Clone the Repository</h3>
						</StepHeader>
						<p style={{ color: '#6b7280', marginBottom: '1rem' }}>
							Clone the OAuth Playground repository to your local machine.
						</p>
						<CodeBlockWithCopy label="clone">
							{`git clone https://github.com/curtismu7/oauthPlayground.git
cd oauthPlayground`}
						</CodeBlockWithCopy>
					</StepCard>

					<StepCard>
						<StepHeader>
							<div className="step-number">2</div>
							<h3>Install Dependencies</h3>
						</StepHeader>
						<p style={{ color: '#6b7280', marginBottom: '1rem' }}>
							Install all required Node.js dependencies.
						</p>
						<CodeBlockWithCopy label="install">{`npm install`}</CodeBlockWithCopy>
						<InfoBox $type="info">
							<strong>Note:</strong> This project requires Node.js version 16.0 or higher. Check
							your version with <code>node --version</code>.
						</InfoBox>
					</StepCard>

					<StepCard>
						<StepHeader>
							<div className="step-number">3</div>
							<h3>Configure PingOne Credentials</h3>
						</StepHeader>
						<InfoBox $type="info">
							<FiCheckCircle size={16} />
							<div>
								<strong>Credentials are configured in individual OAuth flows!</strong>
								<p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
									Configure your PingOne application credentials directly in each OAuth flow.
									They'll be saved automatically and available across all OAuth flows.
								</p>
							</div>
						</InfoBox>
					</StepCard>

					<StepCard>
						<StepHeader>
							<div className="step-number">4</div>
							<h3>Configure PAR (Pushed Authorization Request)</h3>
						</StepHeader>
						<p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
							Configure PAR settings for enhanced security. PAR allows you to push authorization
							requests to PingOne via back-channel, safeguarding sensitive data from end-user
							devices.
						</p>

						{pingOneConfigSaved && (
							<InfoBox $type="success">
								<FiCheckCircle size={16} />
								<strong>PAR Configuration saved!</strong> Your PingOne PAR settings are now
								configured.
							</InfoBox>
						)}

						<PingOneApplicationConfig
							value={pingOneConfig}
							onChange={setPingOneConfig}
							onSave={savePingOneConfig}
							hasUnsavedChanges={false}
							flowType="authorization-code"
						/>

						<div
							style={{
								marginTop: '1rem',
								display: 'flex',
								justifyContent: 'flex-end',
							}}
						>
							<button
								type="button"
								onClick={savePingOneConfig}
								style={{
									background: '#10b981',
									color: 'white',
									border: '1px solid #ffffff',
									borderRadius: '0.5rem',
									padding: '0.75rem 1.5rem',
									fontSize: '0.875rem',
									fontWeight: '600',
									cursor: 'pointer',
									display: 'flex',
									alignItems: 'center',
									gap: '0.5rem',
									transition: 'all 0.2s ease',
								}}
								onMouseEnter={(e) => {
									e.currentTarget.style.backgroundColor = '#059669';
									e.currentTarget.style.borderColor = '#ffffff';
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.backgroundColor = '#10b981';
									e.currentTarget.style.borderColor = '#ffffff';
								}}
							>
								<FiSave size={16} />
								Save PAR Configuration
							</button>
						</div>
					</StepCard>

					<StepCard>
						<StepHeader>
							<div className="step-number">5</div>
							<h3>Start the Application</h3>
						</StepHeader>
						<p style={{ color: '#6b7280', marginBottom: '1rem' }}>
							Start the full-stack application with frontend and backend services.
						</p>
						<CodeBlockWithCopy label="start">{`npm start`}</CodeBlockWithCopy>
						<InfoBox $type="info">
							<strong>What happens:</strong> This command starts both the frontend (React/Vite) and
							backend (Express) servers, performs health checks, and automatically opens your
							browser to <code>https://localhost:3000</code>.
						</InfoBox>
					</StepCard>
				</Card>
			</CollapsibleHeader>

			<CollapsibleHeader
				title="Alternative Startup Options"
				subtitle="Different ways to start the application depending on your needs"
				icon={<FiPlay />}
				defaultCollapsed={true}
			>
				<Card style={{ border: 'none', boxShadow: 'none', marginBottom: 0 }}>
					<div style={{ display: 'grid', gap: '1rem' }}>
						<div
							style={{
								padding: '1.5rem',
								background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
								border: '2px solid #0ea5e9',
								borderRadius: '0.75rem',
							}}
						>
							<h3
								style={{
									fontSize: '1.125rem',
									fontWeight: '600',
									marginBottom: '0.5rem',
								}}
							>
								Development Mode
							</h3>
							<p style={{ color: '#0369a1', marginBottom: '1rem' }}>
								For active development with hot reloading and detailed error messages.
							</p>
							<CodeBlockWithCopy label="dev">{`npm run dev`}</CodeBlockWithCopy>
						</div>

						<div
							style={{
								padding: '1.5rem',
								background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
								border: '2px solid #22c55e',
								borderRadius: '0.75rem',
							}}
						>
							<h3
								style={{
									fontSize: '1.125rem',
									fontWeight: '600',
									marginBottom: '0.5rem',
								}}
							>
								Simple Start
							</h3>
							<p style={{ color: '#15803d', marginBottom: '1rem' }}>
								Quick start without advanced monitoring or health checks.
							</p>
							<CodeBlockWithCopy label="simple">{`npm run start:simple`}</CodeBlockWithCopy>
						</div>

						<div
							style={{
								padding: '1.5rem',
								background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
								border: '2px solid #f59e0b',
								borderRadius: '0.75rem',
							}}
						>
							<h3
								style={{
									fontSize: '1.125rem',
									fontWeight: '600',
									marginBottom: '0.5rem',
								}}
							>
								Individual Servers
							</h3>
							<p style={{ color: '#92400e', marginBottom: '1rem' }}>
								Start frontend and backend servers separately.
							</p>
							<div
								style={{
									display: 'grid',
									gridTemplateColumns: '1fr 1fr',
									gap: '1rem',
								}}
							>
								<CodeBlockWithCopy label="frontend">{`npm run start:frontend`}</CodeBlockWithCopy>
								<CodeBlockWithCopy label="backend">{`npm run start:backend`}</CodeBlockWithCopy>
							</div>
						</div>
					</div>
					<div
						style={{
							padding: '1.5rem',
							background: 'linear-gradient(135deg, #e0f2fe 0%, #ddd6fe 100%)',
							border: '2px solid #2563eb',
							borderRadius: '0.75rem',
						}}
					>
						<h3
							style={{
								fontSize: '1.125rem',
								fontWeight: '600',
								marginBottom: '0.5rem',
							}}
						>
							Redirect Server Launcher
						</h3>
						<p style={{ color: '#1e3a8a', marginBottom: '1rem' }}>
							Runs both redirect-friendly servers with the project defaults.
						</p>
						<CodeBlockWithCopy label="redirect-script">{`./redirect-servers.sh`}</CodeBlockWithCopy>
						<p
							style={{
								color: '#1d4ed8',
								fontSize: '0.85rem',
								marginTop: '0.75rem',
							}}
						>
							If the script is not executable, run:
						</p>
						<CodeBlockWithCopy label="redirect-chmod">{`chmod +x redirect-servers.sh`}</CodeBlockWithCopy>
					</div>
				</Card>
			</CollapsibleHeader>

			<CollapsibleHeader
				title="Troubleshooting"
				subtitle="Common issues and their solutions"
				icon={<FiAlertCircle />}
				defaultCollapsed={true}
			>
				<Card style={{ border: 'none', boxShadow: 'none', marginBottom: 0 }}>
					<div style={{ display: 'grid', gap: '1rem' }}>
						<InfoBox $type="warning">
							<strong>Port Already in Use:</strong> The restart script automatically handles this,
							but if issues persist, check what's using ports 3000 and 3001 with{' '}
							<code>lsof -i :3000</code>
							and <code>lsof -i :3001</code>.
						</InfoBox>

						<InfoBox $type="warning">
							<strong>Dependencies Issues:</strong> Try a clean reinstall with
							<code>rm -rf node_modules package-lock.json && npm install</code>.
						</InfoBox>

						<InfoBox $type="warning">
							<strong>SSL Certificate Warnings:</strong> Click "Advanced" → "Proceed to localhost
							(unsafe)" in Chrome, or set <code>VITE_DEV_SERVER_HTTPS=false</code> in{' '}
							<code>.env</code> for HTTP-only mode.
						</InfoBox>

						<InfoBox $type="info">
							<strong>Environment Variables:</strong> The application uses environment variables for
							PingOne configuration. Check the <code>.env</code> file exists and contains the
							required variables.
						</InfoBox>
					</div>
				</Card>
			</CollapsibleHeader>

			<CollapsibleHeader
				title="Additional Resources"
				subtitle="Explore more resources to get the most out of the OAuth Playground"
				icon={<FiExternalLink />}
				defaultCollapsed={true}
			>
				<Card style={{ border: 'none', boxShadow: 'none', marginBottom: 0 }}>
					<div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
						<a
							href="https://github.com/curtismu7/oauthPlayground"
							target="_blank"
							rel="noopener noreferrer"
							style={{
								display: 'inline-flex',
								alignItems: 'center',
								gap: '0.5rem',
								padding: '0.75rem 1.5rem',
								backgroundColor: '#3b82f6',
								color: 'white',
								textDecoration: 'none',
								borderRadius: '0.5rem',
								fontWeight: '600',
								fontSize: '0.875rem',
								border: '1px solid #ffffff',
								transition: 'all 0.2s',
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.backgroundColor = '#2563eb';
								e.currentTarget.style.borderColor = '#ffffff';
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.backgroundColor = '#3b82f6';
								e.currentTarget.style.borderColor = '#ffffff';
							}}
						>
							<FiGithub />
							View on GitHub
						</a>

						<a
							href="https://docs.pingidentity.com/pingone/auth/v1/api/#openid-connectoauth-2"
							target="_blank"
							rel="noopener noreferrer"
							style={{
								display: 'inline-flex',
								alignItems: 'center',
								gap: '0.5rem',
								padding: '0.75rem 1.5rem',
								backgroundColor: 'white',
								color: '#3b82f6',
								textDecoration: 'none',
								borderRadius: '0.5rem',
								fontWeight: '600',
								fontSize: '0.875rem',
								border: '1px solid #3b82f6',
								transition: 'all 0.2s',
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.backgroundColor = '#f8fafc';
								e.currentTarget.style.borderColor = '#2563eb';
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.backgroundColor = 'white';
								e.currentTarget.style.borderColor = '#3b82f6';
							}}
						>
							<FiExternalLink />
							PingOne API Docs
						</a>

						<a
							href="https://docs.pingidentity.com/sdks/latest/sdks/index.html"
							target="_blank"
							rel="noopener noreferrer"
							style={{
								display: 'inline-flex',
								alignItems: 'center',
								gap: '0.5rem',
								padding: '0.75rem 1.5rem',
								backgroundColor: 'white',
								color: '#3b82f6',
								textDecoration: 'none',
								borderRadius: '0.5rem',
								fontWeight: '600',
								fontSize: '0.875rem',
								border: '1px solid #3b82f6',
								transition: 'all 0.2s',
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.backgroundColor = '#f8fafc';
								e.currentTarget.style.borderColor = '#2563eb';
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.backgroundColor = 'white';
								e.currentTarget.style.borderColor = '#3b82f6';
							}}
						>
							<FiDownload />
							PingOne SDKs
						</a>
					</div>
				</Card>
			</CollapsibleHeader>
		</div>
	);
};

export default Configuration;
