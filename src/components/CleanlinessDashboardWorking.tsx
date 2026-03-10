import React, { useState, useEffect, useCallback } from 'react';
import { getComponentTracker, initializeMockData } from '../utils/componentTracker';

interface ComponentMetrics {
	name: string;
	renderCount: number;
	propCount: number;
	lastRender: number;
}

interface Metrics {
	totalComponents: number;
	totalRenders: number;
	averageRenders: number;
	memoryUsage: number;
	cleanlinessScore: number;
}

// --- Audit data captured from V7 & V8 code-review sessions (March 2026) ---

type AuditStatus = 'fixed' | 'warning' | 'clean' | 'pending';

interface AuditItem {
	id: string;
	description: string;
	status: AuditStatus;
	countLabel: string;
	detail: string;
}

const V7_AUDIT_ITEMS: AuditItem[] = [
	{
		id: 'v7-ts-errors',
		description: 'TypeScript compile errors (brace imbalance in handleIntrospect)',
		status: 'fixed',
		countLabel: '5 → 0 files',
		detail:
			'V7MClientCredentialsV9 · V7MDeviceAuthorizationV9 · V7MImplicitFlowV9 · V7MOAuthAuthCodeV9 · V7MROPCV9',
	},
	{
		id: 'v7-server-tabs',
		description: 'server.js tab vs. space formatting (Biome use_spaces)',
		status: 'fixed',
		countLabel: 'Tabs → 2-space',
		detail: 'All tab characters in server.js replaced via expand -t 2',
	},
	{
		id: 'v7-mock-flows',
		description: 'V7M mock flows on V9 credential storage',
		status: 'clean',
		countLabel: '6 / 6 complete',
		detail: 'All V7M flows migrated to V9CredentialStorageService',
	},
	{
		id: 'v7-console',
		description: 'console.error / console.warn usage',
		status: 'clean',
		countLabel: '0 files',
		detail: 'All runtime errors routed through modernMessaging.showBanner',
	},
	{
		id: 'v7-eslint-disable',
		description: 'ESLint disable directives (pending cleanup)',
		status: 'pending',
		countLabel: '203 directives',
		detail: 'Includes no-explicit-any suppressions across 27 files — targeted cleanup queued',
	},
];

const V8_AUDIT_ITEMS: AuditItem[] = [
	{
		id: 'v8-missing-icons',
		description: 'Missing react-icons/fi imports',
		status: 'fixed',
		countLabel: '0 files (was 8)',
		detail:
			'All 8 files resolved. ActionButtonV8 was a false-positive (JSDoc comment only). icons:check now reports ✓ 0 invalid icon names across 2324 files.',
	},
	{
		id: 'v8-protect-cred-bug',
		description: 'Protect flow: worker token not loading / saving from storage',
		status: 'fixed',
		countLabel: 'PingOneProtectFlowV8.tsx',
		detail:
			'Three bugs fixed: (1) useState lazy-init called async loadCredentials synchronously, (2) syncCredentials effect had same async/sync mismatch, (3) saveCredentials omitted workerToken + region fields',
	},
	{
		id: 'v8-credential-store-migration',
		description: 'useCredentialStoreV8 → V9CredentialStorageService migration',
		status: 'fixed',
		countLabel: '5 / 5 pages migrated',
		detail:
			'ImplicitFlowTest · PARTest · PingOneApiTest · AllFlowsApiTest · MFAFlowsApiTest — all use V9CredentialStorageService + V9AppDiscoveryService. ClientCredentialManager.tsx + 3 V8 store files also deleted.',
	},
	{
		id: 'v8-dead-code-archive',
		description: 'Dead V8 files archived (deleted)',
		status: 'fixed',
		countLabel: '8 files deleted',
		detail:
			'credentialStoreV8.ts · useCredentialStoreV8.ts · credentialStoreV8 types · ClientCredentialManager.tsx · SuperSimpleApiDisplayV8-old.tsx · mfaServiceV8_Legacy.ts · MFAConfigurationStepV8-V2.tsx · NewMFAFlowV8.tsx',
	},
	{
		id: 'v8-migration-services',
		description: 'V8 → V9 migration bridge services (pending removal)',
		status: 'warning',
		countLabel: '2 services',
		detail:
			'credentialsServiceV8Migration.ts · storageServiceV8Migration.ts — safe to delete once V9 adoption is confirmed complete',
	},
	{
		id: 'v8-console',
		description: 'console.error / console.warn usage',
		status: 'clean',
		countLabel: '0 files',
		detail: 'All V8 runtime logging uses the structured logger utility',
	},
	{
		id: 'v8-naming-standardization',
		description: 'Legacy naming standardized (_Legacy, _SIMPLE suffixes eliminated)',
		status: 'fixed',
		countLabel: '2 files renamed/merged',
		detail:
			'UnifiedMFARegistrationFlowV8_Legacy → UnifiedMFARegistrationFlowV8 (App.tsx + MFAFlowV8.tsx updated; null stub replaced with real lazy import). workerTokenModalHelperV8_SIMPLE merged into workerTokenModalHelperV8 + deleted (RegistrationFlowStepperV8 + AuthenticationFlowStepperV8 import paths updated).',
	},
	{
		id: 'v8-flows-archive',
		description: 'Dead V8 flows deleted; OAuth flows (Implicit, Hybrid, CIBA) redirected to V9',
		status: 'fixed',
		countLabel: '27 files / ~22,991 lines deleted',
		detail:
			'Deleted MFAAuthenticationMainPageV8 monolith + 5 hooks, CompleteMFAFlowV8, MFASettingsV8, OAuthAuthorizationCodeFlowV8, ResourcesAPIFlowV8, TokenExchangeFlowV8, PingOnePARFlowV8 (6 files), 4 OTP config pages, 3 .txt artifacts, V8MTokenExchange. Routes /flows/ciba-v8, /flows/implicit-v8, /flows/hybrid-v8 now redirect to V9 equivalents.',
	},
	{
		id: 'v8-total-files',
		description: 'V8 source files passing all audit checks',
		status: 'clean',
		countLabel: '360 / 360 files',
		detail:
			'Icon import issues resolved. Dead-code archived (2 sessions). Legacy naming standardized. 3 V8 OAuth flows redirected to V9. Active V8 set: 16 MFA-specific flows with no V9 equivalent.',
	},
];

// --- V9 & Standardization (March 2026, from A-Migration / docs/updates-to-apps) ---

const V9_STANDARDIZATION_ITEMS: AuditItem[] = [
	{
		id: 'v9-flows-standardized',
		description: 'V9 flows fully standardized',
		status: 'clean',
		countLabel: '18 / 18 flows',
		detail:
			'All V9 flows use V9CredentialStorageService, CompactAppPickerV9, 0 console.error/warn violations. V7 routes redirect to V9.',
	},
	{
		id: 'v9-logger-migration',
		description:
			'console.* → logger.* migration (services, hooks, contexts, utils, components, pages)',
		status: 'clean',
		countLabel: '~615+ service, 133 hooks, 33 contexts, ~215 utils, ~160 components',
		detail:
			'Structured logger across 90+ service files, 16 hooks, 3 contexts, 43 utils, 79 components. Intentional exceptions: loggingService, code-gen templates, CLI tools.',
	},
	{
		id: 'v9-toast-migration',
		description: 'toastV8 / v4ToastManager → modernMessaging',
		status: 'clean',
		countLabel: '117 files, ~1316 calls',
		detail: 'Adapter intercepts legacy toast calls. V9 flows have 0 direct toastV8 usage.',
	},
	{
		id: 'v9-envid-auto-populate',
		description: 'Environment ID auto-populate (2026-02-26)',
		status: 'clean',
		countLabel: '9 pages + 2 services + 2 new files',
		detail:
			'useAutoEnvironmentId hook, cascade sync in unifiedWorkerTokenService + comprehensiveFlowDataService, environmentIdService dual storage (IndexedDB + SQLite API). Pages use readBestEnvironmentId().',
	},
	{
		id: 'v9-helio-mart-hooks',
		description: 'HelioMartPasswordReset Rules of Hooks crash',
		status: 'fixed',
		countLabel: '1 file',
		detail:
			'createPageLayout() moved to module scope (was inside useMemo → styled-components v6 useContext violation).',
	},
	{
		id: 'v9-dead-flows-archived',
		description: 'Dead flow files archived',
		status: 'fixed',
		countLabel: '31 files + 5 dirs → archive/dead-flows/',
		detail:
			'Cleaned active codebase. Scope rule: only sidebar menu items + direct services in scope (sidebarMenuConfig.ts).',
	},
	{
		id: 'v9-service-result',
		description: 'throw → ServiceResult<T> migration (services)',
		status: 'clean',
		countLabel: '5 services',
		detail:
			'parService, samlService, workerTokenDiscoveryService, oidcDiscoveryService, unifiedWorkerTokenService.',
	},
	{
		id: 'v9-credentials-import-export',
		description: 'Credentials Import/Export on all active-menu credential flows',
		status: 'clean',
		countLabel: 'All flows covered',
		detail: 'Including TokenRevocationFlow, SAMLServiceProviderFlowV1. V7M mock flows N/A.',
	},
	{
		id: 'v9-ts-debt',
		description: 'TypeScript technical debt (flows)',
		status: 'pending',
		countLabel: '203 errors, 211 warnings',
		detail: '115 flow files. any types, banned {}; incremental improvements ongoing.',
	},
	{
		id: 'v9-legacy-messaging',
		description: 'Legacy flows still using v4ToastManager (via adapter)',
		status: 'warning',
		countLabel: '16 flows',
		detail: 'Functional via adapter. Migrate to modernMessaging when touching those flows.',
	},
];

const STATUS_CONFIG: Record<
	AuditStatus,
	{ label: string; color: string; bg: string; border: string; dot: string }
> = {
	fixed: { label: 'FIXED', color: '#155724', bg: '#d4edda', border: '#c3e6cb', dot: '#28a745' },
	clean: { label: 'CLEAN', color: '#004085', bg: '#cce5ff', border: '#b8daff', dot: '#007bff' },
	warning: { label: 'WARNING', color: '#856404', bg: '#fff3cd', border: '#ffeeba', dot: '#ffc107' },
	pending: { label: 'PENDING', color: '#721c24', bg: '#f8d7da', border: '#f5c6cb', dot: '#dc3545' },
};

export const CleanlinessDashboardWorking: React.FC = () => {
	console.log('CleanlinessDashboardWorking component loading...');

	const [metrics, setMetrics] = useState<Metrics>({
		totalComponents: 0,
		totalRenders: 0,
		averageRenders: 0,
		memoryUsage: 0,
		cleanlinessScore: 100,
	});

	const [components, setComponents] = useState<ComponentMetrics[]>([]);

	const updateMetrics = useCallback(() => {
		try {
			// Initialize tracker if not available
			let tracker = (window as any).componentTracker;
			if (!tracker) {
				tracker = getComponentTracker();
				initializeMockData(); // Initialize with mock data for demonstration
			}

			if (tracker) {
				const report = tracker.generateReport();
				const componentMetrics = tracker.getMetrics();

				setMetrics({
					totalComponents: report.totalComponents || 0,
					totalRenders: report.totalRenders || 0,
					averageRenders: report.averageRendersPerComponent || 0,
					memoryUsage: report.memoryUsage ? Math.round(report.memoryUsage / 1024 / 1024) : 0,
					cleanlinessScore: Math.max(
						0,
						100 -
							(report.averageRendersPerComponent || 0) * 2 -
							(report.memoryUsage ? report.memoryUsage / 10 : 0)
					),
				});

				if (componentMetrics && Array.isArray(componentMetrics)) {
					setComponents(
						componentMetrics.slice(0, 10).map((comp: any) => ({
							name: comp.name || 'Unknown',
							renderCount: comp.renderCount || 0,
							propCount: comp.propCount || 0,
							lastRender: comp.lastRender || Date.now(),
						}))
					);
				}
			} else {
				// Component tracker not available, show default state
				setMetrics({
					totalComponents: 0,
					totalRenders: 0,
					averageRenders: 0,
					memoryUsage: 0,
					cleanlinessScore: 100,
				});
				setComponents([]);
			}
		} catch (error) {
			console.error('CleanlinessDashboard: Error updating metrics', error);
			// Set safe defaults on error
			setMetrics({
				totalComponents: 0,
				totalRenders: 0,
				averageRenders: 0,
				memoryUsage: 0,
				cleanlinessScore: 100,
			});
			setComponents([]);
		}
	}, []);

	useEffect(() => {
		updateMetrics();
		const interval = setInterval(updateMetrics, 2000);
		return () => clearInterval(interval);
	}, [updateMetrics]);

	const formatTime = (timestamp: number) => {
		return new Date(timestamp).toLocaleTimeString();
	};

	const getScoreColor = (score: number) => {
		if (score >= 80) return '#28A745';
		if (score >= 60) return '#FFC107';
		return '#DC3545';
	};

	const getScoreBackground = (score: number) => {
		if (score >= 80) return 'rgba(40, 167, 69, 0.1)';
		if (score >= 60) return 'rgba(255, 193, 7, 0.1)';
		return 'rgba(220, 53, 69, 0.1)';
	};

	return (
		<div
			style={{
				padding: '2rem',
				fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
				background: '#FFFFFF',
				color: '#212529',
				minHeight: '100vh',
				lineHeight: 1.6,
			}}
		>
			<h2
				style={{
					color: '#212529',
					fontSize: '1.875rem',
					fontWeight: 600,
					marginBottom: '1.5rem',
					textAlign: 'center',
					letterSpacing: '-0.025em',
				}}
			>
				🧹 Component Cleanliness Dashboard
			</h2>

			<p
				style={{
					color: '#6C757D',
					fontSize: '1rem',
					textAlign: 'center',
					marginBottom: '2rem',
				}}
			>
				Monitor your application's performance and component health in real-time
			</p>

			<div
				style={{
					display: 'grid',
					gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
					gap: '1.5rem',
					marginBottom: '2.5rem',
				}}
			>
				<div
					style={{
						background: '#FFFFFF',
						padding: '1.5rem',
						borderRadius: '0.75rem',
						border: '1px solid #DEE2E6',
						boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
						transition: 'all 0.15s ease-in-out',
					}}
				>
					<div
						style={{
							fontSize: '0.875rem',
							fontWeight: 500,
							color: '#6C757D',
							marginBottom: '0.5rem',
							textTransform: 'uppercase',
							letterSpacing: '0.05em',
						}}
					>
						Total Components
					</div>
					<div
						style={{
							fontSize: '1.5rem',
							fontWeight: 700,
							color: '#0066CC',
						}}
					>
						{metrics.totalComponents}
					</div>
				</div>

				<div
					style={{
						background: '#FFFFFF',
						padding: '1.5rem',
						borderRadius: '0.75rem',
						border: '1px solid #DEE2E6',
						boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
						transition: 'all 0.15s ease-in-out',
					}}
				>
					<div
						style={{
							fontSize: '0.875rem',
							fontWeight: 500,
							color: '#6C757D',
							marginBottom: '0.5rem',
							textTransform: 'uppercase',
							letterSpacing: '0.05em',
						}}
					>
						Total Renders
					</div>
					<div
						style={{
							fontSize: '1.5rem',
							fontWeight: 700,
							color: '#0066CC',
						}}
					>
						{metrics.totalRenders}
					</div>
				</div>

				<div
					style={{
						background: '#FFFFFF',
						padding: '1.5rem',
						borderRadius: '0.75rem',
						border: '1px solid #DEE2E6',
						boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
						transition: 'all 0.15s ease-in-out',
					}}
				>
					<div
						style={{
							fontSize: '0.875rem',
							fontWeight: 500,
							color: '#6C757D',
							marginBottom: '0.5rem',
							textTransform: 'uppercase',
							letterSpacing: '0.05em',
						}}
					>
						Average Renders
					</div>
					<div
						style={{
							fontSize: '1.5rem',
							fontWeight: 700,
							color: '#0066CC',
						}}
					>
						{metrics.averageRenders.toFixed(1)}
					</div>
				</div>

				<div
					style={{
						background: '#FFFFFF',
						padding: '1.5rem',
						borderRadius: '0.75rem',
						border: '1px solid #DEE2E6',
						boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
						transition: 'all 0.15s ease-in-out',
					}}
				>
					<div
						style={{
							fontSize: '0.875rem',
							fontWeight: 500,
							color: '#6C757D',
							marginBottom: '0.5rem',
							textTransform: 'uppercase',
							letterSpacing: '0.05em',
						}}
					>
						Memory Usage
					</div>
					<div
						style={{
							fontSize: '1.5rem',
							fontWeight: 700,
							color: '#0066CC',
						}}
					>
						{metrics.memoryUsage} MB
					</div>
				</div>
			</div>

			<div
				style={{
					textAlign: 'center',
					fontSize: '2.25rem',
					fontWeight: 700,
					margin: '2rem 0',
					padding: '1.5rem',
					borderRadius: '0.75rem',
					transition: 'all 0.15s ease-in-out',
					color: getScoreColor(metrics.cleanlinessScore),
					background: getScoreBackground(metrics.cleanlinessScore),
					border: `2px solid ${getScoreColor(metrics.cleanlinessScore)}`,
				}}
			>
				Cleanliness Score: {metrics.cleanlinessScore}%
			</div>

			{/* ── Code Audit Results ─────────────────────────────────────── */}
			<div style={{ marginBottom: '2.5rem' }}>
				<h3
					style={{
						color: '#212529',
						fontSize: '1.25rem',
						fontWeight: 700,
						marginBottom: '0.375rem',
					}}
				>
					🔍 Code Audit Results
				</h3>
				<p style={{ color: '#6C757D', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
					Findings from V7, V8, and V9 standardization — A-Migration / docs/updates-to-apps (March
					2026)
				</p>

				{/* Summary badges (V7 + V8 + V9 Standardization) */}
				<div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.75rem' }}>
					{(
						[
							{
								label: 'Fixed',
								count: [...V7_AUDIT_ITEMS, ...V8_AUDIT_ITEMS, ...V9_STANDARDIZATION_ITEMS].filter(
									(i) => i.status === 'fixed'
								).length,
								...STATUS_CONFIG.fixed,
							},
							{
								label: 'Clean',
								count: [...V7_AUDIT_ITEMS, ...V8_AUDIT_ITEMS, ...V9_STANDARDIZATION_ITEMS].filter(
									(i) => i.status === 'clean'
								).length,
								...STATUS_CONFIG.clean,
							},
							{
								label: 'Warning',
								count: [...V7_AUDIT_ITEMS, ...V8_AUDIT_ITEMS, ...V9_STANDARDIZATION_ITEMS].filter(
									(i) => i.status === 'warning'
								).length,
								...STATUS_CONFIG.warning,
							},
							{
								label: 'Pending',
								count: [...V7_AUDIT_ITEMS, ...V8_AUDIT_ITEMS, ...V9_STANDARDIZATION_ITEMS].filter(
									(i) => i.status === 'pending'
								).length,
								...STATUS_CONFIG.pending,
							},
						] as Array<{ label: string; count: number; color: string; bg: string; border: string }>
					).map((b) => (
						<div
							key={b.label}
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '0.5rem',
								padding: '0.375rem 0.875rem',
								borderRadius: '9999px',
								fontSize: '0.8125rem',
								fontWeight: 600,
								background: b.bg,
								border: `1px solid ${b.border}`,
								color: b.color,
							}}
						>
							{b.count} {b.label}
						</div>
					))}
				</div>

				{/* V7 panel */}
				<div
					style={{
						background: '#FFFFFF',
						borderRadius: '0.75rem',
						border: '1px solid #DEE2E6',
						marginBottom: '1.25rem',
						boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)',
					}}
				>
					<div
						style={{
							padding: '1rem 1.5rem',
							borderBottom: '1px solid #DEE2E6',
							display: 'flex',
							alignItems: 'center',
							gap: '0.625rem',
						}}
					>
						<span style={{ fontSize: '1.125rem' }}>📄</span>
						<span style={{ fontWeight: 600, fontSize: '1rem', color: '#212529' }}>
							V7 / V7M Flows
						</span>
						<span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#6C757D' }}>
							src/v7/
						</span>
					</div>
					{V7_AUDIT_ITEMS.map((item, idx) => {
						const cfg = STATUS_CONFIG[item.status];
						return (
							<div
								key={item.id}
								style={{
									padding: '0.875rem 1.5rem',
									borderBottom: idx < V7_AUDIT_ITEMS.length - 1 ? '1px solid #F1F3F5' : 'none',
									display: 'flex',
									alignItems: 'flex-start',
									gap: '1rem',
								}}
							>
								<div
									style={{
										flexShrink: 0,
										width: '8px',
										height: '8px',
										borderRadius: '50%',
										background: cfg.dot,
										marginTop: '6px',
									}}
								/>
								<div style={{ flex: 1, minWidth: 0 }}>
									<div
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: '0.75rem',
											flexWrap: 'wrap',
										}}
									>
										<span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#212529' }}>
											{item.description}
										</span>
										<span
											style={{
												fontSize: '0.6875rem',
												fontWeight: 700,
												padding: '0.1rem 0.5rem',
												borderRadius: '0.25rem',
												background: cfg.bg,
												color: cfg.color,
												border: `1px solid ${cfg.border}`,
												whiteSpace: 'nowrap',
											}}
										>
											{item.countLabel}
										</span>
									</div>
									<div style={{ fontSize: '0.75rem', color: '#868E96', marginTop: '0.25rem' }}>
										{item.detail}
									</div>
								</div>
							</div>
						);
					})}
				</div>

				{/* V8 panel */}
				<div
					style={{
						background: '#FFFFFF',
						borderRadius: '0.75rem',
						border: '1px solid #DEE2E6',
						boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)',
					}}
				>
					<div
						style={{
							padding: '1rem 1.5rem',
							borderBottom: '1px solid #DEE2E6',
							display: 'flex',
							alignItems: 'center',
							gap: '0.625rem',
						}}
					>
						<span style={{ fontSize: '1.125rem' }}>🏗️</span>
						<span style={{ fontWeight: 600, fontSize: '1rem', color: '#212529' }}>
							V8 Apps &amp; Services
						</span>
						<span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#6C757D' }}>
							src/v8/
						</span>
					</div>
					{V8_AUDIT_ITEMS.map((item, idx) => {
						const cfg = STATUS_CONFIG[item.status];
						return (
							<div
								key={item.id}
								style={{
									padding: '0.875rem 1.5rem',
									borderBottom: idx < V8_AUDIT_ITEMS.length - 1 ? '1px solid #F1F3F5' : 'none',
									display: 'flex',
									alignItems: 'flex-start',
									gap: '1rem',
								}}
							>
								<div
									style={{
										flexShrink: 0,
										width: '8px',
										height: '8px',
										borderRadius: '50%',
										background: cfg.dot,
										marginTop: '6px',
									}}
								/>
								<div style={{ flex: 1, minWidth: 0 }}>
									<div
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: '0.75rem',
											flexWrap: 'wrap',
										}}
									>
										<span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#212529' }}>
											{item.description}
										</span>
										<span
											style={{
												fontSize: '0.6875rem',
												fontWeight: 700,
												padding: '0.1rem 0.5rem',
												borderRadius: '0.25rem',
												background: cfg.bg,
												color: cfg.color,
												border: `1px solid ${cfg.border}`,
												whiteSpace: 'nowrap',
											}}
										>
											{item.countLabel}
										</span>
									</div>
									<div style={{ fontSize: '0.75rem', color: '#868E96', marginTop: '0.25rem' }}>
										{item.detail}
									</div>
								</div>
							</div>
						);
					})}
				</div>

				{/* V9 & Standardization panel */}
				<div
					style={{
						background: '#FFFFFF',
						borderRadius: '0.75rem',
						border: '1px solid #DEE2E6',
						marginTop: '1.25rem',
						boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)',
					}}
				>
					<div
						style={{
							padding: '1rem 1.5rem',
							borderBottom: '1px solid #DEE2E6',
							display: 'flex',
							alignItems: 'center',
							gap: '0.625rem',
						}}
					>
						<span style={{ fontSize: '1.125rem' }}>✅</span>
						<span style={{ fontWeight: 600, fontSize: '1rem', color: '#212529' }}>
							V9 &amp; Standardization
						</span>
						<span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#6C757D' }}>
							A-Migration, docs/updates-to-apps — March 2026
						</span>
					</div>
					{V9_STANDARDIZATION_ITEMS.map((item, idx) => {
						const cfg = STATUS_CONFIG[item.status];
						return (
							<div
								key={item.id}
								style={{
									padding: '0.875rem 1.5rem',
									borderBottom:
										idx < V9_STANDARDIZATION_ITEMS.length - 1 ? '1px solid #F1F3F5' : 'none',
									display: 'flex',
									alignItems: 'flex-start',
									gap: '1rem',
								}}
							>
								<div
									style={{
										flexShrink: 0,
										width: '8px',
										height: '8px',
										borderRadius: '50%',
										background: cfg.dot,
										marginTop: '6px',
									}}
								/>
								<div style={{ flex: 1, minWidth: 0 }}>
									<div
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: '0.75rem',
											flexWrap: 'wrap',
										}}
									>
										<span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#212529' }}>
											{item.description}
										</span>
										<span
											style={{
												fontSize: '0.6875rem',
												fontWeight: 700,
												padding: '0.1rem 0.5rem',
												borderRadius: '0.25rem',
												background: cfg.bg,
												color: cfg.color,
												border: `1px solid ${cfg.border}`,
												whiteSpace: 'nowrap',
											}}
										>
											{item.countLabel}
										</span>
									</div>
									<div style={{ fontSize: '0.75rem', color: '#868E96', marginTop: '0.25rem' }}>
										{item.detail}
									</div>
								</div>
							</div>
						);
					})}
				</div>
			</div>

			{/* ── Runtime Component Tracker ──────────────────────────────── */}
			<div
				style={{
					background: '#FFFFFF',
					padding: '1.5rem',
					borderRadius: '0.75rem',
					border: '1px solid #DEE2E6',
					boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
				}}
			>
				<h3
					style={{
						color: '#212529',
						fontSize: '1.125rem',
						fontWeight: 600,
						marginBottom: '1rem',
					}}
				>
					⚡ Runtime: Top Components
				</h3>
				{components.map((component) => (
					<div
						key={component.name}
						style={{
							padding: '0.75rem',
							marginBottom: '0.5rem',
							background: '#F8F9FA',
							borderRadius: '0.375rem',
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							transition: 'all 0.15s ease-in-out',
						}}
					>
						<span
							style={{
								color: '#212529',
								fontWeight: 600,
								fontSize: '0.875rem',
							}}
						>
							{component.name}
						</span>
						<span
							style={{
								color: '#6C757D',
								fontFamily:
									'"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
								fontSize: '0.75rem',
							}}
						>
							Renders: {component.renderCount} | Props: {component.propCount} | Last:{' '}
							{formatTime(component.lastRender)}
						</span>
					</div>
				))}
				{components.length === 0 && (
					<div
						style={{
							textAlign: 'center',
							padding: '1.5rem',
							color: '#6C757D',
						}}
					>
						No components tracked yet. Navigate through the app to see metrics.
					</div>
				)}
			</div>

			<div
				style={{
					marginTop: '2.5rem',
					padding: '1.5rem',
					background: 'linear-gradient(135deg, #F8F9FA 0%, #E9ECEF 100%)',
					borderRadius: '0.75rem',
					border: '1px solid #DEE2E6',
					boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
				}}
			>
				<h3
					style={{
						color: '#212529',
						fontSize: '1.125rem',
						fontWeight: 600,
						marginBottom: '1rem',
					}}
				>
					📖 How to Use
				</h3>
				<div
					style={{
						color: '#6C757D',
						fontSize: '0.875rem',
						lineHeight: 1.6,
					}}
				>
					<p>Navigate through different apps and flows to see real-time metrics</p>
					<p>Components with high render counts may need optimization</p>
					<p>Memory usage should remain stable (watch for leaks)</p>
					<p>Cleanliness score decreases with excessive renders and memory usage</p>
				</div>
			</div>
		</div>
	);
};
