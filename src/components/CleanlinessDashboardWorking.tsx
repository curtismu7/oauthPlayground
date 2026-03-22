import React, { useCallback, useEffect, useState } from 'react';
import { FlowHeader } from '../services/flowHeaderService';
import {
	getComponentTracker,
	initializeMockData,
	useComponentTracker,
} from '../utils/componentTracker';
import { logger } from '../utils/logger';

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

// ─── AUTO-GENERATED: live scan items — do not edit manually ───
// Last updated: 2026-03-22T10:46:37.553Z

const V9_STANDARDIZATION_ITEMS: AuditItem[] = [
  {
    "id": "bootstrap-icons-migration",
    "description": "Bootstrap Icons replacing question-mark emoji placeholders",
    "status": "warning",
    "countLabel": "1 placeholders remaining → 327 bi-* in use",
    "detail": "1 question-mark spans remain outside src/locked/. 327 Bootstrap icon references already in place."
  },
  {
    "id": "active-sidebar-identified",
    "description": "Active sidebar: SidebarMenuPing (USE_PING_MENU=true)",
    "status": "fixed",
    "countLabel": "3 route items",
    "detail": "Sidebar.tsx → SidebarMenuPing.tsx is the live path. DragDropSidebar.tsx is the locked legacy fallback. DragDropSidebar.V2.tsx and DragDropSidebar.tsx.V2.tsx are dead files (not imported anywhere)."
  },
  {
    "id": "oauth-oidc-duplication",
    "description": "OAuth/OIDC flow duplication reduced",
    "status": "fixed",
    "countLabel": "~15,477 lines deleted",
    "detail": "Dead V8 flows deleted, FlowCategories.tsx reorganized into 7 categories with correct V9 routes, App.tsx redirects added, 6 orphaned hooks/services removed."
  },
  {
    "id": "v9-flows-standardized",
    "description": "V9 flows fully standardized",
    "status": "clean",
    "countLabel": "18 / 18 flows",
    "detail": "All V9 flows use V9CredentialStorageService, CompactAppPickerV9, 0 console.error/warn violations. V7 routes redirect to V9."
  },
  {
    "id": "v9-logger-migration",
    "description": "console.* → logger.* migration",
    "status": "warning",
    "countLabel": "47 console.error/warn remaining",
    "detail": "Structured logger across 90+ service files, 16 hooks, 3 contexts, 43 utils, 79 components. Intentional exceptions: loggingService, code-gen templates, CLI tools."
  },
  {
    "id": "eslint-disable-count",
    "description": "ESLint/Biome disable directives",
    "status": "clean",
    "countLabel": "49 eslint-disable + 157 biome-ignore",
    "detail": "Targeted suppression comments. Goal: eliminate no-explicit-any and exhaustive-deps groups."
  },
  {
    "id": "ts-any-usage",
    "description": "TypeScript `any` usage",
    "status": "pending",
    "countLabel": "~417 occurrences",
    "detail": "Tracked across non-locked src/. Reduction goal: replace with proper generics."
  },
  {
    "id": "v9-dead-flows-archived",
    "description": "Dead flow files archived / deleted",
    "status": "fixed",
    "countLabel": "31+ files + 5 dirs removed",
    "detail": "Cleaned active codebase. Scope rule: only sidebar menu items + direct services in scope (sidebarMenuConfig.ts)."
  }
];

// ─── END AUTO-GENERATED v9 items ───

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
	useComponentTracker('CleanlinessDashboardWorking', 0);

	const [metrics, setMetrics] = useState<Metrics>({
		totalComponents: 0,
		totalRenders: 0,
		averageRenders: 0,
		memoryUsage: 0,
		cleanlinessScore: 100,
	});

	const [components, setComponents] = useState<ComponentMetrics[]>([]);
	const [updateMessage, setUpdateMessage] = useState<string | null>(null);

	const updateMetrics = useCallback(() => {
		try {
			interface WindowWithComponentTracker extends Window {
				componentTracker?: {
					generateReport: () => { totalComponents: number; totalRenders: number; history?: never };
					getMetrics: () => ComponentMetrics[];
					getHistory: () => {
						timestamp: number;
						componentCount: number;
						totalRenders: number;
						memoryUsage?: number;
					}[];
					reset: () => void;
				};
				__CLEANLINESS_DEMO__?: boolean;
			}
			const windowWithTracker = window as WindowWithComponentTracker;
			let tracker = windowWithTracker.componentTracker;
			if (!tracker) {
				tracker = getComponentTracker();
				// Only seed mock data in demo mode (?demo=1 or __CLEANLINESS_DEMO__) so real sessions show actual tracked components
				const isDemo =
					typeof window !== 'undefined' &&
					(windowWithTracker.__CLEANLINESS_DEMO__ === true ||
						(typeof window.location !== 'undefined' &&
							new URLSearchParams(window.location.search).get('demo') === '1'));
				if (isDemo) {
					initializeMockData();
				}
			}

			if (tracker) {
				const report = tracker.generateReport();
				const componentMetrics = tracker.getMetrics();
				const memoryMB = report.memoryUsage ? report.memoryUsage / (1024 * 1024) : 0;
				const avgRenders = report.averageRendersPerComponent || 0;
				// Calibrated score: render penalty cap 50, memory penalty cap 50 (e.g. 50 MB = 50 points), 0–100
				const renderPenalty = Math.min(50, avgRenders * 5);
				const memoryPenalty = Math.min(50, (memoryMB / 50) * 50);
				const cleanlinessScore = Math.max(0, Math.round(100 - renderPenalty - memoryPenalty));

				setMetrics({
					totalComponents: report.totalComponents || 0,
					totalRenders: report.totalRenders || 0,
					averageRenders: avgRenders,
					memoryUsage: Math.round(memoryMB * 10) / 10,
					cleanlinessScore,
				});

				if (componentMetrics && Array.isArray(componentMetrics)) {
					setComponents(
						componentMetrics
							.slice(0, 10)
							.map(
								(comp: {
									name?: string;
									renderCount?: number;
									propCount?: number;
									lastRender?: number;
								}) => ({
									name: comp.name || 'Unknown',
									renderCount: comp.renderCount || 0,
									propCount: comp.propCount || 0,
									lastRender: comp.lastRender || Date.now(),
								})
							)
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
			logger.error('CleanlinessDashboard', 'Error updating metrics', { error: String(error) });
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
		setUpdateMessage('Dashboard updated');
		const clearMsg = setTimeout(() => setUpdateMessage(null), 4000);
		const interval = setInterval(updateMetrics, 2000);
		return () => {
			clearTimeout(clearMsg);
			clearInterval(interval);
		};
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
			<FlowHeader flowId="cleanliness-dashboard" />
			{updateMessage && (
				<output
					style={{
						margin: '0 auto 1rem',
						padding: '0.5rem 1rem',
						background: '#d4edda',
						border: '1px solid #c3e6cb',
						borderRadius: '0.5rem',
						fontSize: '0.875rem',
						color: '#155724',
						display: 'flex',
						alignItems: 'center',
						gap: '0.5rem',
					}}
				>
					<span aria-hidden>✓</span>
					{updateMessage}
				</output>
			)}
			<div
				style={{
					maxWidth: '720px',
					margin: '1.5rem auto 1.5rem',
					padding: '0.75rem 1rem',
					background: '#F8F9FA',
					borderRadius: '0.5rem',
					fontSize: '0.8125rem',
					color: '#495057',
					lineHeight: 1.5,
				}}
			>
				<strong>What the numbers mean:</strong> Components, renders, and memory are from the runtime
				tracker (components that call{' '}
				<code style={{ background: '#E9ECEF', padding: '0.1rem 0.25rem', borderRadius: '0.25rem' }}>
					useComponentTracker
				</code>
				). Memory uses{' '}
				<code style={{ background: '#E9ECEF', padding: '0.1rem 0.25rem', borderRadius: '0.25rem' }}>
					performance.memory
				</code>{' '}
				when available (Chrome). Cleanliness score is 100 minus penalties for high average renders
				and high JS heap usage. Add{' '}
				<code style={{ background: '#E9ECEF', padding: '0.1rem 0.25rem', borderRadius: '0.25rem' }}>
					?demo=1
				</code>{' '}
				to seed sample data.
			</div>

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
								status: 'Fixed',
								count: [...V7_AUDIT_ITEMS, ...V8_AUDIT_ITEMS, ...V9_STANDARDIZATION_ITEMS].filter(
									(i) => i.status === 'fixed'
								).length,
								...STATUS_CONFIG.fixed,
							},
							{
								status: 'Clean',
								count: [...V7_AUDIT_ITEMS, ...V8_AUDIT_ITEMS, ...V9_STANDARDIZATION_ITEMS].filter(
									(i) => i.status === 'clean'
								).length,
								...STATUS_CONFIG.clean,
							},
							{
								status: 'Warning',
								count: [...V7_AUDIT_ITEMS, ...V8_AUDIT_ITEMS, ...V9_STANDARDIZATION_ITEMS].filter(
									(i) => i.status === 'warning'
								).length,
								...STATUS_CONFIG.warning,
							},
							{
								status: 'Pending',
								count: [...V7_AUDIT_ITEMS, ...V8_AUDIT_ITEMS, ...V9_STANDARDIZATION_ITEMS].filter(
									(i) => i.status === 'pending'
								).length,
								...STATUS_CONFIG.pending,
							},
						] as Array<{ status: string; count: number; color: string; bg: string; border: string }>
					).map((b) => (
						<div
							key={b.status}
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
							{b.count} {b.status}
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
