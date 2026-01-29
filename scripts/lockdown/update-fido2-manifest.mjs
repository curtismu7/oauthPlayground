#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const PROJECT_ROOT = process.cwd();
const manifestPath = join(PROJECT_ROOT, 'src/v8/lockdown/fido2/manifest.json');
const snapshotDir = join(PROJECT_ROOT, 'src/v8/lockdown/fido2/snapshot');

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

mkdirSync(snapshotDir, { recursive: true });

console.log('📸 Updating FIDO2 lockdown snapshots...\n');

const files = [];
for (const fileEntry of manifest.files || []) {
	const filePath = fileEntry.path;
	const fullPath = join(PROJECT_ROOT, filePath);
	const fileName = filePath.split('/').pop();
	const snapshotPath = join(snapshotDir, fileName);

	if (!existsSync(fullPath)) {
		console.warn(`⚠️  File not found: ${filePath}`);
		continue;
	}

	const content = readFileSync(fullPath, 'utf8');
	const hash = createHash('sha256').update(content, 'utf8').digest('hex');

	writeFileSync(snapshotPath, content, 'utf8');

	const entry = {
		path: filePath,
		hash,
	};
	if (fileEntry.description) {
		entry.description = fileEntry.description;
	}
	files.push(entry);

	console.log(`✅ ${filePath}`);
	console.log(`   Hash: ${hash.substring(0, 16)}...`);
}

manifest.files = files;
manifest.updated = new Date().toISOString().split('T')[0];

writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

console.log(`\n✅ FIDO2 lockdown updated - ${files.length} files`);
console.log(`   Manifest: ${manifestPath}`);
console.log(`   Snapshots: ${snapshotDir}`);
