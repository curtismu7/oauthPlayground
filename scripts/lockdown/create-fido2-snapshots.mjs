#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '../..');

const manifestPath = join(PROJECT_ROOT, 'src/v8/lockdown/fido2/manifest.json');
const snapshotDir = join(PROJECT_ROOT, 'src/v8/lockdown/fido2/snapshot');

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
mkdirSync(snapshotDir, { recursive: true });

console.log('📸 Creating FIDO2 snapshots...\n');

const updatedFiles = manifest.files.map((fileEntry) => {
	const filePath = fileEntry.path;
	const fullPath = join(PROJECT_ROOT, filePath);
	const fileName = filePath.split('/').pop();
	const snapshotPath = join(snapshotDir, fileName);

	try {
		const content = readFileSync(fullPath, 'utf8');
		const hash = createHash('sha256').update(content, 'utf8').digest('hex');

		writeFileSync(snapshotPath, content, 'utf8');

		console.log(`✅ ${filePath} (${hash.substring(0, 16)}...)`);

		return {
			path: filePath,
			hash,
			description: fileEntry.description,
		};
	} catch (error) {
		console.error(`❌ Failed to process ${filePath}:`, error.message);
		return fileEntry;
	}
});

manifest.files = updatedFiles;
manifest.updated = new Date().toISOString();

writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

console.log(`\n✅ Created ${updatedFiles.length} snapshots`);
console.log(`   Manifest updated: ${manifestPath}`);
