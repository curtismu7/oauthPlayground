import puppeteer from 'puppeteer';

const APP_URL = process.env.APP_URL ?? 'http://localhost:5173';
const HEADLESS = process.env.HEADLESS !== 'false';

const SUBMENUS = [
	'Core Overview',
	'OAuth 2.0 Flows',
	'OpenID Connect',
	'PingOne',
	'Mock & Demo Flows',
	'Artificial Intelligence',
	'Security & Management',
	'Tools & Utilities',
	'Documentation',
];

const MENU_ITEMS = [
	{ submenu: 'Core Overview', label: 'Dashboard', path: '/dashboard' },
	{ submenu: 'Core Overview', label: 'Setup & Configuration', path: '/configuration' },
	{
		submenu: 'OAuth 2.0 Flows',
		label: 'Authorization Code (V6)',
		path: '/flows/oauth-authorization-code-v6',
	},
	{
		submenu: 'OAuth 2.0 Flows',
		label: 'Client Credentials (V6)',
		path: '/flows/client-credentials-v6',
	},
	{
		submenu: 'OAuth 2.0 Flows',
		label: 'Device Authorization (V6)',
		path: '/flows/device-authorization-v6',
	},
	{
		submenu: 'OpenID Connect',
		label: 'Authorization Code (V6)',
		path: '/flows/oidc-authorization-code-v6',
	},
	{
		submenu: 'OpenID Connect',
		label: 'Device Authorization (V6)',
		path: '/flows/oidc-device-authorization-v6',
	},
	{ submenu: 'PingOne', label: 'Worker Token (V6)', path: '/flows/worker-token-v6' },
	{ submenu: 'PingOne', label: 'PAR (V6)', path: '/flows/pingone-par-v6' },
	{ submenu: 'Mock & Demo Flows', label: 'RAR (V6)', path: '/flows/rar-v6' },
	{ submenu: 'Artificial Intelligence', label: 'AI Glossary', path: '/ai-glossary' },
	{ submenu: 'Security & Management', label: 'Token Management', path: '/token-management' },
	{ submenu: 'Tools & Utilities', label: 'Flow Comparison', path: '/flows/compare' },
	{ submenu: 'Documentation', label: 'Local Documentation', path: '/documentation' },
];

const consoleErrors = [];

async function waitForRouterNavigation(page, expectedPath) {
	await page.waitForFunction(
		(path) => window.location.pathname === path,
		{ timeout: 15000 },
		expectedPath
	);
}

async function ensureSidebarReady(page) {
	await page.waitForSelector('.ps-sidebar-root', { timeout: 15000 });
	// Ensure initial navigation landed on dashboard (default redirect)
	await page.waitForFunction(() => window.location.pathname === '/dashboard', { timeout: 15000 });
}

async function ensureSubmenuOpen(page, submenuLabel) {
	const wasOpened = await page.evaluate((label) => {
		const buttons = Array.from(document.querySelectorAll('.ps-submenu-root > .ps-menu-button'));
		const target = buttons.find((btn) =>
			btn.textContent?.trim().toLowerCase().includes(label.toLowerCase())
		);
		if (!target) return { found: false, expanded: false };
		const expanded = target.getAttribute('aria-expanded') === 'true';
		if (!expanded) {
			target.click();
		}
		return { found: true, expanded };
	}, submenuLabel);

	if (!wasOpened.found) {
		throw new Error(`Submenu "${submenuLabel}" not found in sidebar.`);
	}

	if (!wasOpened.expanded) {
		await page.waitForFunction(
			(label) => {
				const buttons = Array.from(document.querySelectorAll('.ps-submenu-root > .ps-menu-button'));
				const target = buttons.find((btn) =>
					btn.textContent?.trim().toLowerCase().includes(label.toLowerCase())
				);
				return target?.getAttribute('aria-expanded') === 'true';
			},
			{ timeout: 5000 },
			submenuLabel
		);
	}
}

async function clickMenuItem(page, itemLabel) {
	const clicked = await page.evaluate((label) => {
		const buttons = Array.from(document.querySelectorAll('.ps-menuitem-root .ps-menu-button'));
		const target = buttons.find((btn) =>
			btn.textContent?.replace(/\s+/g, ' ').trim().toLowerCase().includes(label.toLowerCase())
		);
		if (!target) return false;
		target.click();
		return true;
	}, itemLabel);

	if (!clicked) {
		throw new Error(`Menu item "${itemLabel}" not found or not clickable.`);
	}
}

async function runNavigationChecks(page) {
	for (const submenu of SUBMENUS) {
		await ensureSubmenuOpen(page, submenu);
		await page.waitForTimeout(150);
	}

	for (const [index, item] of MENU_ITEMS.entries()) {
		await ensureSubmenuOpen(page, item.submenu);
		await clickMenuItem(page, item.label);
		await waitForRouterNavigation(page, item.path);
		await page.waitForTimeout(400);
		console.log(`✅ [${index + 1}/${MENU_ITEMS.length}] ${item.label} -> ${item.path}`);
	}
}

async function main() {
	console.log(`🔍 Starting Puppeteer sidebar smoke test against ${APP_URL} (headless=${HEADLESS})`);
	const browser = await puppeteer.launch({
		headless: HEADLESS,
		defaultViewport: { width: 1440, height: 960 },
	});
	const page = await browser.newPage();

	page.on('pageerror', (err) => {
		consoleErrors.push(`Page error: ${err.message}`);
	});

	page.on('console', (msg) => {
		if (msg.type() === 'error') {
			consoleErrors.push(`Console error: ${msg.text()}`);
		}
	});

	try {
		await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: 60000 });
		await ensureSidebarReady(page);
		await runNavigationChecks(page);
	} finally {
		await browser.close();
	}

	if (consoleErrors.length > 0) {
		console.error('\u274c Detected console errors during navigation:');
		for (const err of consoleErrors) {
			console.error(`  - ${err}`);
		}
		process.exitCode = 1;
	} else {
		console.log('🎉 Sidebar navigation completed with no console errors detected.');
	}
}

main().catch((err) => {
	console.error('Test run failed:', err);
	process.exit(1);
});
