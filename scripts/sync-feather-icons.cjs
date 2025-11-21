#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', 'src');
const BARREL_PATH = path.join(SRC_DIR, 'services', 'commonImportsService.ts');

const featherIcons = require('react-icons/fi');

const ICON_IMPORT_REGEX = /import\s+{([^}]*?)}\s+from\s+['"]react-icons\/fi['"]/g;
const ICON_NAME_REGEX = /\bFi[A-Z][A-Za-z0-9]*\b/g;

function walkFiles(dir, extensions, fileList = []) {
	const entries = fs.readdirSync(dir, { withFileTypes: true });
	for (const entry of entries) {
		if (entry.name === 'node_modules' || entry.name === '.git') continue;
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			walkFiles(fullPath, extensions, fileList);
		} else if (extensions.has(path.extname(entry.name))) {
			fileList.push(fullPath);
		}
	}
	return fileList;
}

function collectIcons() {
	const files = walkFiles(SRC_DIR, new Set(['.ts', '.tsx']));
	const icons = new Set();

	for (const file of files) {
		const content = fs.readFileSync(file, 'utf8');
		let match;
		while ((match = ICON_IMPORT_REGEX.exec(content)) !== null) {
			const names = match[1].match(ICON_NAME_REGEX) || [];
			names.forEach((name) => icons.add(name));
		}
	}

	return Array.from(icons).sort((a, b) => a.localeCompare(b));
}

function filterExistingIcons(icons) {
	const available = new Set(Object.keys(featherIcons));
	const valid = [];
	const missing = [];

	for (const icon of icons) {
		if (available.has(icon)) {
			valid.push(icon);
		} else {
			missing.push(icon);
		}
	}

	if (missing.length > 0) {
		console.warn(
			`[sync-feather-icons] Skipping ${missing.length} unknown icon(s): ${missing.join(', ')}`
		);
	}

	return valid.sort((a, b) => a.localeCompare(b));
}

function updateBarrel(icons) {
	const barrel = fs.readFileSync(BARREL_PATH, 'utf8');
	const iconList = icons.join(',\n\t');

	const importRegex = /import\s*{[\s\S]*?}\s*from\s*'react-icons\/fi';/;
	const importMatch = barrel.match(importRegex);
	if (!importMatch) {
		throw new Error('Unable to locate Feather icon import block in commonImportsService.ts');
	}

	let updated = barrel.replace(importRegex, `import {\n\t${iconList},\n} from 'react-icons/fi';`);

	const exportRegex = /export\s*{[\s\S]*?Fi[A-Za-z0-9][\s\S]*?};/;
	const exportMatch = updated.match(exportRegex);
	if (!exportMatch) {
		throw new Error('Unable to locate Feather icon export block in commonImportsService.ts');
	}

	updated = updated.replace(exportRegex, `export {\n\t${iconList},\n};`);

	fs.writeFileSync(BARREL_PATH, updated);
}

function main() {
	try {
		const collected = collectIcons();
		if (collected.length === 0) {
			console.warn('No Feather icons found in the codebase.');
			return;
		}
		const icons = filterExistingIcons(collected);
		if (icons.length === 0) {
			console.warn('No valid Feather icons found after filtering.');
			return;
		}
		updateBarrel(icons);
		console.log(`Synced ${icons.length} Feather icons into commonImportsService.ts`);
	} catch (error) {
		console.error('[sync-feather-icons] Error:', error.message);
		process.exit(1);
	}
}

main();
