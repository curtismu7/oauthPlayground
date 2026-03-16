// src/pages/docs/migration/MigrationGuide.tsx
// V7/V8 → V9 Migration Guide — standardized hub for A-Migration docs
// Red header (PingOne Management API page convention per 01-MIGRATION-GUIDE.md §5)

import React, { useState } from 'react';
import styled from 'styled-components';
import { V9_COLORS } from '../../../services/v9/V9ColorStandards';

// ─── Layout ───────────────────────────────────────────────────────────────────

const PageOuter = styled.div`
	min-height: 100vh;
	background: #f9fafb;
`;

const RedHeader = styled.header`
	background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
	color: #ffffff;
	padding: 2rem 1.75rem;
	position: relative;
	overflow: hidden;

	&::before {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(45deg, rgba(255, 255, 255, 0.08) 0%, transparent 100%);
		pointer-events: none;
	}

	h1 {
		margin: 0;
		font-size: 1.75rem;
		font-weight: 700;
		color: #ffffff;
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	p {
		margin: 0.5rem 0 0;
		color: rgba(255, 255, 255, 0.9);
		max-width: 700px;
		line-height: 1.6;
		font-size: 0.95rem;
	}
`;

const Body = styled.div`
	max-width: 1100px;
	margin: 0 auto;
	padding: 2rem 1.75rem 4rem;
`;

// ─── Tab types ────────────────────────────────────────────────────────────────

type DocTab = 'overview' | 'guide' | 'services' | 'testing' | 'reference';

const TABS: { id: DocTab; label: string; badge?: string }[] = [
	{ id: 'overview', label: 'Overview' },
	{ id: 'guide', label: '01 · Migration Guide' },
	{ id: 'services', label: '02 · Services & Contracts' },
	{ id: 'testing', label: '03 · Testing & Rules' },
	{ id: 'reference', label: '04 · Reference' },
];

// ─── Shared styled components ─────────────────────────────────────────────────

const TabBar = styled.nav`
	display: flex;
	gap: 0;
	border-bottom: 2px solid ${V9_COLORS.TEXT.GRAY_LIGHTER};
	margin-bottom: 2rem;
	overflow-x: auto;
`;

const TabButton = styled.button<{ $active: boolean }>`
	flex-shrink: 0;
	padding: 0.75rem 1.25rem;
	font-size: 0.875rem;
	font-weight: 600;
	border: none;
	cursor: pointer;
	background: transparent;
	color: ${({ $active }) => ($active ? V9_COLORS.PRIMARY.RED : V9_COLORS.TEXT.GRAY_MEDIUM)};
	border-bottom: 2px solid ${({ $active }) => ($active ? V9_COLORS.PRIMARY.RED : 'transparent')};
	margin-bottom: -2px;
	transition: color 0.15s;

	&:hover {
		color: ${V9_COLORS.TEXT.GRAY_DARK};
	}
`;

const DocContent = styled.div`
	max-width: 860px;
`;

const H2 = styled.h2`
	font-size: 1.35rem;
	font-weight: 700;
	color: ${V9_COLORS.TEXT.GRAY_DARK};
	margin: 2rem 0 0.75rem;
	padding-bottom: 0.5rem;
	border-bottom: 2px solid ${V9_COLORS.TEXT.GRAY_LIGHTER};

	&:first-child {
		margin-top: 0;
	}
`;

const H3 = styled.h3`
	font-size: 1.05rem;
	font-weight: 600;
	color: ${V9_COLORS.TEXT.GRAY_DARK};
	margin: 1.5rem 0 0.5rem;
`;

const P = styled.p`
	color: ${V9_COLORS.TEXT.GRAY_DARK};
	line-height: 1.7;
	margin-bottom: 1rem;
	font-size: 0.9rem;
`;

const UL = styled.ul`
	padding-left: 1.5rem;
	margin-bottom: 1rem;

	li {
		color: ${V9_COLORS.TEXT.GRAY_DARK};
		font-size: 0.9rem;
		line-height: 1.7;
		margin-bottom: 0.3rem;
	}
`;

const OL = styled.ol`
	padding-left: 1.5rem;
	margin-bottom: 1rem;

	li {
		color: ${V9_COLORS.TEXT.GRAY_DARK};
		font-size: 0.9rem;
		line-height: 1.7;
		margin-bottom: 0.3rem;
	}
`;

const Code = styled.code`
	background: ${V9_COLORS.BG.GRAY_LIGHT};
	color: #b91c1c;
	padding: 0.15rem 0.4rem;
	border-radius: 4px;
	font-family: 'Courier New', monospace;
	font-size: 0.85em;
`;

const Pre = styled.pre`
	background: #0f172a;
	color: #e2e8f0;
	border-radius: 0.5rem;
	padding: 1.25rem;
	overflow-x: auto;
	font-size: 0.8rem;
	font-family: 'Courier New', monospace;
	line-height: 1.6;
	margin: 0.75rem 0 1.25rem;
`;

const Table = styled.table`
	width: 100%;
	border-collapse: collapse;
	font-size: 0.85rem;
	margin-bottom: 1.5rem;

	th,
	td {
		padding: 0.6rem 0.9rem;
		border: 1px solid ${V9_COLORS.TEXT.GRAY_LIGHTER};
		text-align: left;
		vertical-align: top;
	}

	th {
		background: ${V9_COLORS.BG.GRAY_LIGHT};
		font-weight: 600;
		color: ${V9_COLORS.TEXT.GRAY_DARK};
	}

	tr:nth-child(even) td {
		background: #f9fafb;
	}
`;

const Callout = styled.div<{ $color?: 'blue' | 'amber' | 'red' | 'green' }>`
	background: ${({ $color }) =>
		$color === 'amber'
			? '#fffbeb'
			: $color === 'red'
				? '#fef2f2'
				: $color === 'green'
					? '#f0fdf4'
					: '#eff6ff'};
	border-left: 4px solid
		${({ $color }) =>
			$color === 'amber'
				? '#f59e0b'
				: $color === 'red'
					? '#dc2626'
					: $color === 'green'
						? '#16a34a'
						: '#2563eb'};
	border-radius: 0 0.4rem 0.4rem 0;
	padding: 0.9rem 1.1rem;
	font-size: 0.875rem;
	color: ${({ $color }) =>
		$color === 'amber'
			? '#92400e'
			: $color === 'red'
				? '#991b1b'
				: $color === 'green'
					? '#14532d'
					: '#1e40af'};
	margin-bottom: 1.25rem;
	line-height: 1.6;
`;

const CheckList = styled.ul`
	list-style: none;
	padding-left: 0;
	margin-bottom: 1.25rem;

	li {
		font-size: 0.9rem;
		color: ${V9_COLORS.TEXT.GRAY_DARK};
		line-height: 1.7;
		margin-bottom: 0.3rem;
		padding-left: 1.6rem;
		position: relative;

		&::before {
			content: '☐';
			position: absolute;
			left: 0;
			color: ${V9_COLORS.TEXT.GRAY_MEDIUM};
		}
	}
`;

// ─── Tab content components ───────────────────────────────────────────────────

const OverviewTab: React.FC = () => (
	<DocContent>
		<Callout $color="blue">
			<strong>Start here.</strong> Four core docs cover everything for V7/V8 → V9 migration: guide,
			services, testing rules, and quick reference. Read 01 §1–2, 02 (worker token), and 03
			(checklist) before starting any migration.
		</Callout>

		<H2>Doc Map</H2>
		<Table>
			<thead>
				<tr>
					<th>Doc</th>
					<th>Purpose</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>
						<strong>01 · Migration Guide</strong>
					</td>
					<td>
						Primary guide — Modern Messaging, quality gates, V8 layout, colors, common errors,
						services summary
					</td>
				</tr>
				<tr>
					<td>
						<strong>02 · Services &amp; Contracts</strong>
					</td>
					<td>Service upgrade candidates, worker token consistency, Priority 1 services status</td>
				</tr>
				<tr>
					<td>
						<strong>03 · Testing &amp; Rules</strong>
					</td>
					<td>Zero-tolerance rules, testing prevention, infinite-loop and runtime safeguards</td>
				</tr>
				<tr>
					<td>
						<strong>04 · Reference</strong>
					</td>
					<td>V9 flow template snippet, colors, JWKS/MFA pointers</td>
				</tr>
			</tbody>
		</Table>

		<H2>Migration Process</H2>
		<OL>
			<li>
				<strong>Before migrating:</strong> Read 01 (§1–2), 02 (worker token), 03 (checklist).
			</li>
			<li>
				<strong>Implement:</strong> Follow 01 (V8 imports, colors, messaging, patterns); use 04 for
				template.
			</li>
			<li>
				<strong>Before merge:</strong> Run 03 checklist (parity, tsc, no infinite loops, async
				cleanup).
			</li>
		</OL>

		<H2>Migration Inventory Summary</H2>
		<H3>Migrated to V9</H3>
		<P>
			Authorization Code+PKCE, Implicit, Device Auth, Client Credentials, OIDC Hybrid, JWT Bearer,
			SAML Bearer, RAR, CIBA, Redirectless.
		</P>

		<H3>Still V7 in Sidebar (not yet V9)</H3>
		<UL>
			<li>
				Token Exchange <strong>(CRITICAL)</strong>
			</li>
			<li>PingOne PAR, PingOne MFA, MFA Workflow Library</li>
			<li>Worker Token (V7), ROPC</li>
		</UL>

		<H3>V8 in Sidebar (no V9 yet)</H3>
		<UL>
			<li>Auth Code V8, Implicit V8, DPoP Auth Code V8</li>
		</UL>

		<H2>Archive</H2>
		<P>
			Older variant docs (e.g. <Code>migrate_vscode_*</Code>, <Code>V9_MIGRATION_TODOS_*</Code>,
			status reports, comparison docs) are in <Code>A-Migration/archive/</Code>. The 01–04 set above
			is the single source of truth. Historical migrations in <Code>v5-to-v6/</Code> and{' '}
			<Code>v6-to-v7/</Code>.
		</P>
	</DocContent>
);

const MigrationGuideTab: React.FC = () => (
	<DocContent>
		<Callout $color="red">
			<strong>Applies to every V9 migration.</strong> All quality gates, import patterns, color
			rules, and programming patterns below are mandatory.
		</Callout>

		<H2>1. Mandatory: Modern Messaging</H2>
		<P>
			All V9 flows and pages must use <strong>Modern Messaging</strong> (no legacy toast):
		</P>
		<UL>
			<li>
				<strong>Wait screens</strong> — blocking work (user cannot proceed).
			</li>
			<li>
				<strong>Banner messaging</strong> — persistent context/warnings.
			</li>
			<li>
				<strong>Critical errors</strong> — red, with next-step guidance.
			</li>
			<li>
				<strong>Footer messaging</strong> — low-noise status (polling, copy, etc.).
			</li>
			<li>
				<strong>
					No <Code>console.error</Code>/<Code>console.warn</Code> for runtime failures
				</strong>{' '}
				— use app logging + user-facing message.
			</li>
		</UL>
		<P>
			<strong>Legacy:</strong> <Code>v4ToastManager</Code> is deprecated; remove it when touching a
			file.
		</P>

		<H2>2. Engineering Quality Gates (every migration)</H2>
		<CheckList>
			<li>Modern Messaging used (wait / banner / red error / footer).</li>
			<li>
				No runtime <Code>console.error</Code>/<Code>console.warn</Code> for failures (use messaging
				+ structured logging).
			</li>
			<li>
				Async cleanup: <Code>AbortController</Code> for fetches; clear intervals/timeouts; no state
				updates after unmount.
			</li>
			<li>
				Flow state: <Code>idle → loading → success → error</Code>; safe retries; disable submit
				while in-flight.
			</li>
			<li>Input validation with guidance; critical error block for "can't proceed."</li>
			<li>Sanitized technical details (mask tokens; no stack traces by default).</li>
			<li>
				Accessibility: keyboard, focus after transitions, <Code>aria-live</Code> for dynamic
				content.
			</li>
			<li>Minimal tests: at least one failure-path assertion + happy path for critical flows.</li>
		</CheckList>

		<H3>Services-First (mandatory)</H3>
		<UL>
			<li>No direct fetch/protocol code in UI — use services (or hooks that call services).</li>
			<li>No duplicated protocol logic — centralize in services.</li>
			<li>
				<strong>Before adding non-trivial logic:</strong> search services first; prefer small
				composable service functions; capture gaps in <strong>02-SERVICES-AND-CONTRACTS.md</strong>.
			</li>
		</UL>

		<H2>4. V8 Architecture (where things live)</H2>
		<P>
			V8 lives under <Code>src/v8/</Code>: <Code>components/</Code>, <Code>services/</Code>,
			<Code>flows/</Code>, <Code>pages/</Code>, <Code>hooks/</Code>, <Code>utils/</Code>,
			<Code>styles/</Code>, <Code>constants/</Code>, <Code>types/</Code>.
		</P>
		<P>
			<strong>Import depth:</strong> From <Code>src/pages/flows/v9/</Code> use{' '}
			<Code>../../../</Code> to
			<Code>src/</Code> or{' '}
			<strong>
				<Code>@/v8/...</Code>
			</strong>{' '}
			to avoid depth errors. When moving a V8 flow into V9, fix V8-internal imports:
		</P>
		<Pre>{`FLOW="src/pages/flows/v9/MyFlowV9.tsx"
sed -i '' "s|from '../services/|from '@/v8/services/|g" "$FLOW"
sed -i '' "s|from '../components/|from '@/v8/components/|g" "$FLOW"
sed -i '' "s|from '../hooks/|from '@/v8/hooks/|g" "$FLOW"
sed -i '' "s|from '../utils/|from '@/v8/utils/|g" "$FLOW"`}</Pre>

		<H2>5. UI Color Standards (mandatory)</H2>
		<UL>
			<li>
				<strong>Primary blue (headers, primary actions):</strong> <Code>#2563eb</Code>,{' '}
				<Code>#1e40af</Code>, <Code>#1e3a8a</Code>
			</li>
			<li>
				<strong>Red (errors, destructive, PingOne Management headers):</strong> <Code>#dc2626</Code>
				, <Code>#fef2f2</Code>
			</li>
			<li>
				<strong>Neutral:</strong> <Code>#111827</Code>, <Code>#1f2937</Code>, <Code>#6b7280</Code>,{' '}
				<Code>#f9fafb</Code>, <Code>#e5e7eb</Code>
			</li>
		</UL>
		<Callout $color="amber">
			<strong>Headers:</strong> Blue gradient default:{' '}
			<Code>linear-gradient(135deg, #2563eb 0%, #1e40af 100%)</Code>. Red for PingOne Management API
			pages: <Code>linear-gradient(135deg, #ef4444 0%, #dc2626 100%)</Code>.
			<strong> No purple.</strong>
		</Callout>

		<H2>6. Common Errors and Fixes</H2>
		<Table>
			<thead>
				<tr>
					<th>#</th>
					<th>Symptom</th>
					<th>Fix</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>1</td>
					<td>Wrong import depth</td>
					<td>
						Use <Code>../../../</Code> from <Code>v9/</Code> or <Code>@/</Code> alias
					</td>
				</tr>
				<tr>
					<td>2</td>
					<td>Config path wrong</td>
					<td>
						Config is sibling of <Code>v9/</Code>, use <Code>../config/</Code>
					</td>
				</tr>
				<tr>
					<td>3</td>
					<td>Missing V9 helper class</td>
					<td>Create V9 version or use existing V9 service</td>
				</tr>
				<tr>
					<td>4</td>
					<td>Wrong utility filename</td>
					<td>
						Use actual file (e.g. <Code>v4ToastMessages.ts</Code>)
					</td>
				</tr>
				<tr>
					<td>5</td>
					<td>Archived file missing</td>
					<td>Restore from archive or use current path</td>
				</tr>
				<tr>
					<td>6</td>
					<td>
						<Code>localStorage</Code> for worker token
					</td>
					<td>
						Use <Code>unifiedWorkerTokenService</Code> (IndexedDB/SQLite + events)
					</td>
				</tr>
				<tr>
					<td>7</td>
					<td>V8 internal import fails from V9</td>
					<td>
						Replace <Code>'../services/</Code> with <Code>'@/v8/services/</Code>
					</td>
				</tr>
				<tr>
					<td>8</td>
					<td>WorkerTokenSectionV8 import error</td>
					<td>
						Use named import:{' '}
						<Code>
							import {'{ WorkerTokenSectionV8 }'} from '@/v8/components/WorkerTokenSectionV8'
						</Code>
					</td>
				</tr>
			</tbody>
		</Table>

		<H2>7. Programming Patterns (avoid these)</H2>
		<UL>
			<li>
				<strong>Dead state variables</strong> — e.g. <Code>isLoading</Code> never set; remove or
				wire to spinner/hook.
			</li>
			<li>
				<strong>useEffect async without cleanup</strong> — Use <Code>AbortController</Code> and{' '}
				<Code>return () =&gt; controller.abort()</Code>; guard setState with{' '}
				<Code>!controller.signal.aborted</Code>.
			</li>
			<li>
				<strong>Legacy toast in V9</strong> — Replace with Modern Messaging.
			</li>
			<li>
				<strong>Unsafe error casting</strong> — Use type guards (<Code>err instanceof Error</Code>)
				before casting.
			</li>
			<li>
				<strong>
					<Code>useState&lt;any&gt;</Code>
				</strong>{' '}
				— Use concrete types or minimal interfaces for API results.
			</li>
		</UL>
	</DocContent>
);

const ServicesTab: React.FC = () => (
	<DocContent>
		<H2>1. Service Upgrade Candidates</H2>
		<P>
			When adding <strong>non-trivial logic</strong> to a flow/page:
		</P>
		<OL>
			<li>
				Search <Code>src/services/</Code> for an existing capability.
			</li>
			<li>If there's a gap, add an entry to the candidates list below.</li>
			<li>
				Classify as <strong>Must replace now</strong> (blocking correctness / copy-paste /
				messaging) or <strong>Upgrade later</strong>.
			</li>
		</OL>
		<Callout $color="blue">
			<strong>Themes:</strong> Error normalization (API errors → user guidance + retry),
			timeout/retry policies, polling with cancellation/backoff, request correlation (IDs,
			duration), shared validators (issuer URL, scopes, redirect URIs).
		</Callout>

		<H2>2. Worker Token Consistency</H2>
		<UL>
			<li>
				<strong>Single pattern:</strong> Use the standard Worker Token UI (e.g.{' '}
				<Code>WorkerTokenSectionV8</Code> / modal) — no custom "Get Token" buttons or inline token
				state that duplicates it.
			</li>
			<li>
				<strong>Storage:</strong> Use <Code>unifiedWorkerTokenService</Code> and unified storage
				(IndexedDB/SQLite). No direct <Code>localStorage.getItem('unified_worker_token')</Code> or{' '}
				<Code>worker_credentials</Code> for primary load/save.
			</li>
			<li>
				<strong>Credentials:</strong> Any app that reads/displays worker token credentials must load
				from <Code>unifiedWorkerTokenService.loadCredentials()</Code> first, then fall back to
				localStorage. Saves must call <Code>unifiedTokenStorage.storeWorkerTokenCredentials()</Code>{' '}
				so they persist.
			</li>
		</UL>

		<H2>3. Priority 1 V8 Services (status)</H2>
		<Table>
			<thead>
				<tr>
					<th>Service</th>
					<th>Target</th>
					<th>Status</th>
					<th>Notes</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>workerTokenStatusServiceV8</td>
					<td>V9WorkerTokenStatusService</td>
					<td>✅ Done</td>
					<td>Adapter for backward compat</td>
				</tr>
				<tr>
					<td>specVersionServiceV8</td>
					<td>V9SpecVersionService</td>
					<td>✅ Done</td>
					<td></td>
				</tr>
				<tr>
					<td>unifiedFlowLoggerServiceV8</td>
					<td>V9LoggingService</td>
					<td>✅ Done</td>
					<td>See docs/UPDATE_LOG</td>
				</tr>
				<tr>
					<td>mfaServiceV8</td>
					<td>V9MFAService</td>
					<td>⏳ Planning</td>
					<td>High complexity</td>
				</tr>
				<tr>
					<td>workerTokenServiceV8</td>
					<td>V9TokenService</td>
					<td>⏳ Planning</td>
					<td>Token lifecycle</td>
				</tr>
				<tr>
					<td>credentialsServiceV8</td>
					<td>V9CredentialService</td>
					<td>⏳ Planning</td>
					<td>Unified storage</td>
				</tr>
			</tbody>
		</Table>
		<P>
			<strong>Strategy:</strong> Foundation (logging) → Token (worker token status, token service) →
			MFA → Credentials. Prefer adapters so existing V8 callers keep working during rollout.
		</P>

		<H2>4. V7/V8/V9 Contracts (summary)</H2>
		<UL>
			<li>
				<strong>V9 services</strong> live under <Code>src/services/v9/</Code> and expose typed,
				testable APIs; avoid V7/V8-specific types in public APIs where possible.
			</li>
			<li>
				<strong>V8 services</strong> remain in <Code>src/v8/services/</Code>; when migrating, either
				replace with V9 service + adapter or add a thin V9 wrapper that delegates to V8 until full
				migration.
			</li>
			<li>
				<strong>Flows:</strong> Use services for API calls, request/response shaping, retries, error
				normalization, and logging. UI owns state, rendering, and calling services.
			</li>
		</UL>
	</DocContent>
);

const TestingTab: React.FC = () => (
	<DocContent>
		<H2>1. Zero-Tolerance Migration Rules</H2>
		<Callout $color="red">
			<strong>Rule: Every V9 migration MUST maintain feature parity with V7/V8.</strong> No "we'll
			add it later."
		</Callout>

		<H3>Pre-migration</H3>
		<P>
			Feature inventory, function mapping, component list, service dependencies, state, user
			workflows, error handling, data persistence, worker token usage, URLs/ports.
		</P>

		<H3>Implementation</H3>
		<P>
			Migrate feature-by-feature; preserve every function/UI/service/state/workflow/error path; use
			standard worker token UI and unified storage.
		</P>

		<H3>Post-migration</H3>
		<P>
			Feature parity test, UI comparison, service integration test, workflow test, error-handling
			test, data persistence test, no regressions.
		</P>

		<H2>2. Critical Testing Failures Prevention</H2>
		<Callout $color="amber">
			<strong>Known incident:</strong> V9 page infinite looping (e.g. JWT Bearer flow) due to
			TypeScript/structural errors (missing imports, variables used outside scope). Fix: ensure{' '}
			<Code>tsc --noEmit</Code> and linter pass before merge; fix missing imports (e.g.{' '}
			<Code>FlowHeader</Code>) and scope issues.
		</Callout>
		<P>
			<strong>Before any migration:</strong> Run pre-migration test suite (at least one failure-path
			test + one happy-path test for critical flows). Document features and verify parity.
		</P>

		<H2>3. Infinite Loop Prevention</H2>
		<P>
			<strong>Dangerous pattern:</strong> <Code>useEffect</Code> depends on state it updates,
			causing setState → re-run effect → setState.
		</P>
		<P>
			<strong>Safe approach:</strong> Depend only on inputs that don't change as a side effect of
			the effect (e.g. selected variant, route params). If you must react to "credentials," use a
			stable ref or a dependency that changes only when the user intent changes, not when the effect
			writes.
		</P>
		<Pre>{`// ❌ Dangerous: causes infinite loop
useEffect(() => {
  setCredentials(loadCredentials());
}, [credentials]); // "credentials" changes every time the effect runs

// ✅ Safe: depends only on stable input
useEffect(() => {
  setCredentials(loadCredentials());
}, [selectedVariant]); // only runs when user changes variant`}</Pre>

		<H2>4. Runtime Issues Prevention</H2>
		<UL>
			<li>
				<strong>Async cleanup:</strong> Every <Code>useEffect</Code> that does async work must
				cancel (e.g. <Code>AbortController</Code>) and avoid setState after unmount.
			</li>
			<li>
				<strong>No state updates after unmount:</strong> Guard setState with{' '}
				<Code>if (!controller.signal.aborted)</Code> or similar.
			</li>
			<li>
				<strong>Worker token / storage:</strong> Use <Code>unifiedWorkerTokenService</Code> and
				unified storage; don't rely only on localStorage for worker credentials.
			</li>
		</UL>

		<H2>5. Quick Checklist Before Merge</H2>
		<CheckList>
			<li>Feature parity with source (V7/V8) verified.</li>
			<li>
				<Code>tsc --noEmit</Code> and linter pass.
			</li>
			<li>
				No <Code>useEffect</Code> dependency that causes infinite loop (effect updates what it
				depends on).
			</li>
			<li>Async effects have cleanup (abort/unsubscribe); no setState after unmount.</li>
			<li>Worker token uses standard UI and unified storage where applicable.</li>
			<li>At least one test covers a failure path (and happy path for critical flows).</li>
		</CheckList>
	</DocContent>
);

const ReferenceTab: React.FC = () => (
	<DocContent>
		<H2>1. V9 Flow Template (minimal)</H2>
		<OL>
			<li>
				Create <Code>src/pages/flows/v9/MyFlowV9.tsx</Code>.
			</li>
			<li>
				Use <strong>blue</strong> header gradient:{' '}
				<Code>linear-gradient(135deg, #2563eb 0%, #1e40af 100%)</Code> (red only for PingOne
				Management API pages).
			</li>
			<li>
				Imports: use <Code>@/v8/...</Code> for V8 components/services. Use <Code>../../../</Code>{' '}
				for <Code>src/</Code> when not using alias.
			</li>
			<li>
				Register route in <Code>src/App.tsx</Code> and sidebar in{' '}
				<Code>src/config/sidebarMenuConfig.ts</Code>.
			</li>
			<li>
				Use Modern Messaging (wait screen, banner, footer, red critical errors) — no legacy toast.
			</li>
		</OL>

		<H3>Starter snippet — header</H3>
		<Pre>{`const FlowHeader = styled.div\`
  background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
  color: #ffffff;
  padding: 2rem;
\`;

// For PingOne Management API pages — red header:
const FlowHeader = styled.div\`
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: #ffffff;
  padding: 2rem;
\`;`}</Pre>

		<H3>Starter snippet — route registration</H3>
		<Pre>{`// App.tsx lazy import
const MyFlowV9 = lazy(() => import('./pages/flows/v9/MyFlowV9'));

// Route
<Route path="/flows/my-flow-v9" element={
  <Suspense fallback={<ComponentLoader message="Loading..." subtext="..." />}>
    <MyFlowV9 />
  </Suspense>
} />

// sidebarMenuConfig.ts
['/flows/my-flow-v9', 'My Flow (V9)', true, true],`}</Pre>

		<H2>2. Colors and Accessibility</H2>
		<Table>
			<thead>
				<tr>
					<th>Color</th>
					<th>Use</th>
					<th>Hex</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>Blue (default headers)</td>
					<td>Primary actions, flow headers</td>
					<td>
						<Code>#2563eb</Code> / <Code>#1e40af</Code>
					</td>
				</tr>
				<tr>
					<td>Red (PingOne Mgmt)</td>
					<td>Management API headers, errors</td>
					<td>
						<Code>#ef4444</Code> / <Code>#dc2626</Code>
					</td>
				</tr>
				<tr>
					<td>Text Dark</td>
					<td>Body text, headings</td>
					<td>
						<Code>#111827</Code> / <Code>#1f2937</Code>
					</td>
				</tr>
				<tr>
					<td>Text Medium</td>
					<td>Secondary text</td>
					<td>
						<Code>#6b7280</Code>
					</td>
				</tr>
				<tr>
					<td>BG Light</td>
					<td>Page background, code blocks</td>
					<td>
						<Code>#f9fafb</Code>
					</td>
				</tr>
				<tr>
					<td>Border</td>
					<td>Cards, tables, dividers</td>
					<td>
						<Code>#e5e7eb</Code>
					</td>
				</tr>
				<tr>
					<td>Status Valid</td>
					<td>Connection / token status only</td>
					<td>
						<Code>#10b981</Code>
					</td>
				</tr>
				<tr>
					<td>Status Warning</td>
					<td>Token/connection warning only</td>
					<td>
						<Code>#f59e0b</Code>
					</td>
				</tr>
				<tr>
					<td>Status Invalid</td>
					<td>Connection error only</td>
					<td>
						<Code>#ef4444</Code>
					</td>
				</tr>
			</tbody>
		</Table>
		<Callout $color="amber">
			<strong>Forbidden:</strong> Purple; green/amber/orange for non-status UI elements.
		</Callout>

		<H3>Accessibility requirements</H3>
		<UL>
			<li>Keyboard support for all interactive elements.</li>
			<li>Focus management after transitions and error states.</li>
			<li>
				<Code>aria-live</Code> for dynamic banners and errors.
			</li>
		</UL>

		<H2>3. Other Guides (pointers)</H2>
		<UL>
			<li>
				<strong>JWKS:</strong> See <Code>A-Migration/archive/JWKS_MIGRATION_GUIDE.md</Code>.
			</li>
			<li>
				<strong>MFA:</strong> See <Code>A-Migration/archive/MFA_MIGRATION_GUIDE.md</Code> for flow
				dependency map and migration order.
			</li>
			<li>
				<strong>V8 flow patterns:</strong> Import depth and sed commands in 01 §4.
			</li>
			<li>
				<strong>Historical (V5→V6, V6→V7):</strong> See <Code>A-Migration/v5-to-v6/</Code> and{' '}
				<Code>A-Migration/v6-to-v7/</Code>.
			</li>
		</UL>
	</DocContent>
);

// ─── Tab rendering map ────────────────────────────────────────────────────────

const TAB_CONTENT: Record<DocTab, React.FC> = {
	overview: OverviewTab,
	guide: MigrationGuideTab,
	services: ServicesTab,
	testing: TestingTab,
	reference: ReferenceTab,
};

// ─── Main page ────────────────────────────────────────────────────────────────

const MigrationGuide: React.FC = () => {
	const [activeTab, setActiveTab] = useState<DocTab>('overview');
	const ActiveContent = TAB_CONTENT[activeTab];

	return (
		<PageOuter>
			<RedHeader>
				<h1>V7/V8 → V9 Migration Guide</h1>
				<p>
					Standardized reference for migrating OAuth/OIDC flows to V9. Red header marks all PingOne
					Management API pages per UI Color Standards (§5 of Migration Guide).
				</p>
			</RedHeader>
			<Body>
				<TabBar>
					{TABS.map((tab) => (
						<TabButton
							key={tab.id}
							$active={activeTab === tab.id}
							onClick={() => setActiveTab(tab.id)}
						>
							{tab.label}
						</TabButton>
					))}
				</TabBar>
				<ActiveContent />
			</Body>
		</PageOuter>
	);
};

export default MigrationGuide;
