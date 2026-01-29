import puppeteer from 'puppeteer';

const baseUrl = process.env.PUPPETEER_BASE_URL ?? 'http://localhost:5173';
const log = (...messages) => console.log('[Puppeteer]', ...messages);

const waitForMenuToRender = async (page) => {
	await page.waitForSelector('.ps-menu-button', { timeout: 15000 });
};

const _computeKey = (button) => {
	const text = (button.textContent ?? '').replace(/\s+/g, ' ').trim();
	const indices = [];
	let current = button;
	while (current && current !== document.body) {
		const parent = current.parentElement;
		if (!parent) break;
		const siblings = Array.from(parent.children);
		indices.push(siblings.indexOf(current));
		if (parent.classList.contains('ps-sidebar-root')) break;
		current = parent;
	}
	return `${indices.reverse().join('.')}:${text}`;
};

const selectNextMenuButton = (page, visitedKeys) => {
	return page.evaluate(
		({ visited }) => {
			const makeKey = (el) => {
				const text = (el.textContent ?? '').replace(/\s+/g, ' ').trim();
				const indices = [];
				let current = el;
				while (current && current !== document.body) {
					const parent = current.parentElement;
					if (!parent) break;
					const siblings = Array.from(parent.children);
					indices.push(siblings.indexOf(current));
					if (parent.classList.contains('ps-sidebar-root')) break;
					current = parent;
				}
				return `${indices.reverse().join('.')}:${text}`;
			};
			const visitedSet = new Set(visited);
			const buttons = Array.from(document.querySelectorAll('.ps-menu-button'));
			for (const button of buttons) {
				const key = makeKey(button);
				if (visitedSet.has(key)) continue;
				const id = `visit-${crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
				button.setAttribute('data-auto-visit-id', id);
				return { id, key, label: (button.textContent ?? '').replace(/\s+/g, ' ').trim() };
			}
			return null;
		},
		{ visited: Array.from(visitedKeys) }
	);
};

const clearVisitMarker = (page, id) => {
	return page.evaluate((value) => {
		const element = document.querySelector(`.ps-menu-button[data-auto-visit-id="${value}"]`);
		if (element) element.removeAttribute('data-auto-visit-id');
	}, id);
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const clickAllMenuButtons = async (page) => {
	const visited = new Set();
	let index = 0;
	for (;;) {
		const next = await selectNextMenuButton(page, visited);
		if (!next) break;
		log(`Visiting menu item #${index + 1}: ${next.label || next.key}`);
		const elementHandle = await page.$(`.ps-menu-button[data-auto-visit-id="${next.id}"]`);
		if (!elementHandle) {
			log(`Skipping ${next.key} - element not found`);
			visited.add(next.key);
			continue;
		}
		const navigation = page
			.waitForNavigation({ waitUntil: 'networkidle0', timeout: 8000 })
			.catch(() => null);
		await elementHandle.click({ delay: 20 });
		log(`Clicked ${next.label || next.key}, waiting for navigation...`);
		await navigation;
		await delay(300);
		await clearVisitMarker(page, next.id);
		visited.add(next.key);
		log(`Finished menu item #${index + 1}`);
		index += 1;
	}
	log(`Completed ${visited.size} menu items`);
};

const main = async () => {
	const browser = await puppeteer.launch({
		headless: 'new',
		ignoreHTTPSErrors: true,
		args: ['--ignore-certificate-errors'],
	});
	log('Browser launched');
	const page = await browser.newPage();
	log('New page opened');
	const consoleErrors = [];
	const pageErrors = [];
	page.on('console', (message) => {
		if (message.type() === 'error') consoleErrors.push(message.text());
	});
	page.on('pageerror', (error) => {
		pageErrors.push(error?.message ?? String(error));
	});
	try {
		log(`Navigating to ${baseUrl}`);
		await page.goto(baseUrl, { waitUntil: 'networkidle0', timeout: 30000 });
		log('Navigation complete, waiting for menu to render');
		await waitForMenuToRender(page);
		log('Menu detected, beginning traversal');
		await clickAllMenuButtons(page);
		if (consoleErrors.length || pageErrors.length) {
			const formatted = [
				...consoleErrors.map((value) => `Console error: ${value}`),
				...pageErrors.map((value) => `Page error: ${value}`),
			];
			formatted.forEach((message) => log(message));
			throw new Error(`Encountered browser errors\n${formatted.join('\n')}`);
		}
		log('Completed traversal without runtime errors');
	} finally {
		log('Closing browser');
		await browser.close();
	}
};

main().catch((error) => {
	log('Test failed');
	console.error(error);
	process.exit(1);
});
