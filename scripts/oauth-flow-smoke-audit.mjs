#!/usr/bin/env node
/**
 * OAuth flow smoke audit — loads every canonical (+ key specialty) route,
 * captures HTTP status, title, console errors, and redirect loops.
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE = process.env.BASE_URL || 'https://localhost:8000';
const ROOT = process.env.PROJECT_ROOT || '/Users/curtismuir/Development/oauthPlayground';

const CANONICAL_FLOWS = [
	{ path: '/flows/client-credentials', name: 'Client Credentials', options: ['Mock/Real', 'authMethod basic|post'] },
	{ path: '/flows/authorization-code', name: 'Authorization Code + PKCE', options: ['Mock/Real', 'OAuth 2.0/2.1', 'OIDC'] },
	{ path: '/flows/authorization-code-educational', name: 'Auth Code Educational', options: ['Mock/Real'] },
	{ path: '/flows/device-authorization', name: 'Device Authorization', options: ['Mock/Real', 'authMethod'] },
	{ path: '/flows/token-exchange', name: 'Token Exchange', options: ['Mock/Real', 'authMethod'] },
	{ path: '/flows/token-introspection', name: 'Token Introspection', options: ['Mock/Real', 'authMethod'] },
	{ path: '/flows/userinfo', name: 'UserInfo', options: ['Mock/Real'] },
	{ path: '/flows/token-revocation', name: 'Token Revocation', options: ['Mock/Real'] },
	{ path: '/flows/par', name: 'PAR', options: ['Mock/Real'] },
	{ path: '/flows/refresh-token', name: 'Refresh Token', options: ['Mock/Real', 'authMethod'] },
	{ path: '/flows/oidc-discovery', name: 'OIDC Discovery', options: ['Mock/Real'] },
	{ path: '/flows/dpop', name: 'DPoP', options: ['Mock/Real', 'authMethod'] },
	{ path: '/flows/redirectless', name: 'Redirectless', options: ['Mock/Real'] },
	{ path: '/flows/implicit-hybrid', name: 'Implicit / Hybrid (legacy)', options: ['Mock/Real'] },
	{ path: '/flows/hybrid', name: 'Hybrid', options: ['Mock/Real'] },
	{ path: '/flows/ropc', name: 'ROPC', options: ['Mock/Real', 'authMethod'] },
	{ path: '/flows/saml-bearer', name: 'SAML Bearer', options: ['Mock/Real'] },
];

const LAB_MFA = [
	{ path: '/mfa', name: 'Unified MFA', options: ['device types'] },
	{ path: '/lab/oauth-authz', name: 'Lab OAuth Authz', options: ['flow types', 'spec versions'] },
	{ path: '/lab/token-monitoring', name: 'Lab Token Monitoring', options: [] },
	{ path: '/lab/flow-comparison', name: 'Lab Flow Comparison', options: [] },
	{ path: '/v8u/unified', name: 'Legacy Unified OAuth (v8u)', options: ['flow types', 'spec versions'] },
	{ path: '/use-cases', name: 'Use Cases', options: [] },
];

const SPECIALTY = [
	{ path: '/flows/rar-v9', name: 'RAR (specialty)', options: [] },
	{ path: '/flows/ciba-v9', name: 'CIBA (specialty)', options: [] },
	{ path: '/flows/jwt-bearer-token-v9', name: 'JWT Bearer (specialty)', options: [] },
	{ path: '/flows/pingone-par-v9', name: 'PingOne PAR (specialty)', options: [] },
	{ path: '/flows/saml-bearer-assertion-v9', name: 'SAML Bearer V9 (specialty)', options: [] },
	{ path: '/flows/mock-mcp-agent-flow', name: 'Mock MCP Agent', options: [] },
	{ path: '/flows/wimse-v1', name: 'WIMSE', options: [] },
	{ path: '/flows/gnap-v1', name: 'GNAP', options: [] },
	{ path: '/flows/jar-jarm-v1', name: 'JAR/JARM', options: [] },
	{ path: '/flows/mtls-client-auth-v1', name: 'mTLS Client Auth', options: [] },
	{ path: '/flows/attestation-client-auth-v1', name: 'Attestation Client Auth', options: [] },
	{ path: '/flows/step-up-auth-v1', name: 'Step-Up Auth', options: [] },
];

const LEGACY_REDIRECTS = [
	{ path: '/v2/flows/client-credentials', expectContains: '/flows/client-credentials' },
	{ path: '/v2/flows/authorization-code', expectContains: '/flows/authorization-code' },
	{ path: '/v2/flows/dpop', expectContains: '/flows/dpop' },
	{ path: '/v8/unified-mfa', expectContains: '/mfa' },
	{ path: '/flows/worker-token-v9', expectContains: '/flows/' },
	{ path: '/flows/par-v9', expectContains: '/flows/par' },
	{ path: '/flows/token-exchange-v9', expectContains: '/flows/token-exchange' },
];

async function probe(page, route) {
	const consoleErrors = [];
	const pageErrors = [];
	/** Env/credential / optional-backup noise — not a route crash. */
	const isEnvNoise = (text) =>
		/Failed to load resource:.*\b401\b/i.test(text) ||
		/Failed to load resource:.*\b400\b/i.test(text) ||
		/WorkerTokenManager.*Token fetch attempt/i.test(text) ||
		/invalid_client|Unsupported authentication method/i.test(text) ||
		/UNIFIED-OAUTH-BACKUP|Failed to load OAuth backup|Backup load failed/i.test(text);

	const onConsole = (msg) => {
		if (msg.type() !== 'error') return;
		const text = msg.text().slice(0, 300);
		if (isEnvNoise(text)) return;
		consoleErrors.push(text);
	};
	const onPageError = (err) => pageErrors.push(String(err).slice(0, 300));
	page.on('console', onConsole);
	page.on('pageerror', onPageError);

	const started = Date.now();
	let finalUrl = '';
	let title = '';
	let status = 'ok';
	let detail = '';
	let hasMockToggle = false;
	let hasAuthMethod = false;
	let hasSpecToggle = false;
	let bodySnippet = '';

	try {
		const resp = await page.goto(`${BASE}${route.path}`, {
			waitUntil: 'domcontentloaded',
			timeout: 25000,
		});
		await page.waitForTimeout(1500);
		finalUrl = page.url();
		title = await page.title();
		const http = resp?.status() ?? 0;

		const bodyText = await page.locator('body').innerText().catch(() => '');
		bodySnippet = bodyText.replace(/\s+/g, ' ').slice(0, 160);

		hasMockToggle =
			(await page.getByRole('button', { name: 'Mock', exact: true }).count()) > 0;
		hasAuthMethod =
			(await page.getByText('client_secret_basic').count()) > 0 ||
			(await page.getByText('client_secret_post').count()) > 0;
		hasSpecToggle =
			(await page.getByRole('button', { name: 'OAuth 2.1' }).count()) > 0 ||
			(await page.getByRole('button', { name: 'OAuth 2.0' }).count()) > 0;

		const blank = !bodyText || bodyText.trim().length < 20;
		const errorBoundary =
			/something went wrong|uncaught|cannot read|is not defined|maximum update depth/i.test(
				bodyText
			);

		if (http >= 400) {
			status = 'fail';
			detail = `HTTP ${http}`;
		} else if (errorBoundary) {
			status = 'fail';
			detail = 'Error boundary / crash text in page';
		} else if (blank) {
			status = 'warn';
			detail = 'Near-empty body';
		} else if (pageErrors.length) {
			status = 'fail';
			detail = pageErrors[0];
		} else if (consoleErrors.some((e) => /Maximum update depth|ChunkLoadError|is not defined/i.test(e))) {
			status = 'fail';
			detail = consoleErrors.find((e) => /Maximum update depth|ChunkLoadError|is not defined/i.test(e));
		} else if (consoleErrors.length > 3) {
			status = 'warn';
			detail = `${consoleErrors.length} console errors`;
		}

		if (route.path === '/flows/dpop') {
			const hasFlowTitle = /DPoP|Demonstrating Proof/i.test(bodyText);
			if (!hasFlowTitle) {
				status = 'fail';
				detail = 'DPoP route likely self-redirecting; flow UI not rendered';
			}
		}
	} catch (err) {
		status = 'fail';
		detail = String(err).slice(0, 250);
		finalUrl = page.url();
	}

	page.off('console', onConsole);
	page.off('pageerror', onPageError);

	return {
		...route,
		status,
		detail,
		finalUrl,
		title,
		durationMs: Date.now() - started,
		hasMockToggle,
		hasAuthMethod,
		hasSpecToggle,
		consoleErrorCount: consoleErrors.length,
		pageErrorCount: pageErrors.length,
		consoleErrors: consoleErrors.slice(0, 5),
		pageErrors: pageErrors.slice(0, 3),
		bodySnippet,
	};
}

async function probeRedirect(page, item) {
	try {
		await page.goto(`${BASE}${item.path}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
		await page.waitForTimeout(800);
		const finalUrl = page.url();
		const ok = finalUrl.includes(item.expectContains);
		return {
			path: item.path,
			expectContains: item.expectContains,
			finalUrl,
			status: ok ? 'ok' : 'fail',
			detail: ok ? 'redirected as expected' : `expected URL containing ${item.expectContains}`,
		};
	} catch (err) {
		return {
			path: item.path,
			expectContains: item.expectContains,
			finalUrl: page.url(),
			status: 'fail',
			detail: String(err).slice(0, 200),
		};
	}
}

async function exerciseOptions(page, route) {
	const results = [];
	if (!route.hasMockToggle && !route.hasAuthMethod && !route.hasSpecToggle) {
		return results;
	}

	try {
		await page.goto(`${BASE}${route.path}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
		await page.waitForTimeout(1000);

		if (route.hasMockToggle) {
			const mockBtn = page.getByRole('button', { name: 'Mock', exact: true });
			if ((await mockBtn.count()) > 0) {
				await mockBtn.first().click();
				await page.waitForTimeout(400);
				results.push({ option: 'Mock mode', status: 'ok' });
			}
			const realBtn = page.getByRole('button', { name: 'Real PingOne', exact: true });
			if ((await realBtn.count()) > 0) {
				await realBtn.first().click();
				await page.waitForTimeout(400);
				results.push({ option: 'Real PingOne mode', status: 'ok' });
				if ((await mockBtn.count()) > 0) await mockBtn.first().click();
			}
		}

		if (route.hasSpecToggle) {
			for (const label of ['OAuth 2.0', 'OAuth 2.1']) {
				const btn = page.getByRole('button', { name: label, exact: true });
				if ((await btn.count()) > 0) {
					await btn.first().click();
					await page.waitForTimeout(300);
					results.push({ option: `Spec ${label}`, status: 'ok' });
				}
			}
		}

		if (route.hasAuthMethod) {
			for (const label of ['client_secret_basic', 'client_secret_post']) {
				const btn = page.getByText(label, { exact: true });
				if ((await btn.count()) > 0) {
					await btn.first().click();
					await page.waitForTimeout(300);
					results.push({ option: `Auth ${label}`, status: 'ok' });
				}
			}
		}
	} catch (err) {
		results.push({ option: 'option-exercise', status: 'fail', detail: String(err).slice(0, 200) });
	}
	return results;
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ ignoreHTTPSErrors: true });
const page = await context.newPage();

const allRoutes = [...CANONICAL_FLOWS, ...LAB_MFA, ...SPECIALTY];
const routeResults = [];
for (const route of allRoutes) {
	process.stderr.write(`probe ${route.path}\n`);
	const r = await probe(page, route);
	routeResults.push(r);
}

const optionResults = [];
for (const r of routeResults.filter((x) => x.status !== 'fail' && (x.hasMockToggle || x.hasAuthMethod || x.hasSpecToggle))) {
	process.stderr.write(`options ${r.path}\n`);
	const opts = await exerciseOptions(page, r);
	optionResults.push({ path: r.path, name: r.name, options: opts });
}

const redirectResults = [];
for (const item of LEGACY_REDIRECTS) {
	process.stderr.write(`redirect ${item.path}\n`);
	redirectResults.push(await probeRedirect(page, item));
}

await browser.close();

const summary = {
	generatedAt: new Date().toISOString(),
	baseUrl: BASE,
	totals: {
		routes: routeResults.length,
		ok: routeResults.filter((r) => r.status === 'ok').length,
		warn: routeResults.filter((r) => r.status === 'warn').length,
		fail: routeResults.filter((r) => r.status === 'fail').length,
		redirectsOk: redirectResults.filter((r) => r.status === 'ok').length,
		redirectsFail: redirectResults.filter((r) => r.status === 'fail').length,
		optionsExercised: optionResults.reduce((n, r) => n + r.options.length, 0),
		optionsFailed: optionResults.reduce(
			(n, r) => n + r.options.filter((o) => o.status === 'fail').length,
			0
		),
	},
	routeResults,
	optionResults,
	redirectResults,
	knownCodeIssues: [
		{
			id: 'DPOP-SELF-REDIRECT',
			severity: 'critical',
			path: '/flows/dpop',
			evidence:
				'App.tsx: Route path="/flows/dpop" Navigate to="/flows/dpop" appears BEFORE the real FlowsDpop route. First match wins → infinite self-redirect.',
		},
		{
			id: 'WORKER-TOKEN-REDIRECT-CHAIN',
			severity: 'high',
			path: '/flows/worker-token',
			evidence:
				'worker-token → client-credentials; worker-token-v9 → worker-token. Canonical map says /flows/worker-token is canonical but App redirects it away.',
		},
		{
			id: 'UNIT-TEST-SETUP-BROKEN',
			severity: 'high',
			path: 'tests/setup.ts',
			evidence:
				'All 14 flow service Vitest suites fail to load: missing fake-indexeddb/auto (npm peer conflict blocks install).',
		},
		{
			id: 'STALE-E2E-MOCK-PATHS',
			severity: 'medium',
			path: 'tests/e2e/mock-flows-comprehensive-validation.spec.ts',
			evidence:
				'E2E still targets retired /flows/*-v9 mock paths that redirect to lab/unified or are gone.',
		},
		{
			id: 'PLAYWRIGHT-BASEURL-MISMATCH',
			severity: 'medium',
			path: 'playwright.config.ts',
			evidence: 'Default baseURL is https://localhost:3000 but stack serves https://localhost:8000.',
		},
	],
};

const outPath = path.join(ROOT, 'docs/reports/oauth-flow-audit-2026-07-08.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary.totals, null, 2));
console.log(`Wrote ${outPath}`);
