#!/usr/bin/env node
/**
 * @file lockdown.mjs
 * @description Lockdown verification and approval system for critical MFA flow files
 * @version 1.0.0
 * 
 * This script verifies that critical files have not been modified by comparing
 * their current content with snapshots stored in the lockdown directory.
 * 
 * Usage:
 *   node scripts/lockdown/lockdown.mjs verify <flow>  - Verify files match snapshots
 *   node scripts/lockdown/lockdown.mjs approve <flow> - Update snapshots with current files
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '../..');

const FLOW_CONFIGS = {
	sms: {
		manifest: 'src/v8/lockdown/sms/manifest.json',
		snapshotDir: 'src/v8/lockdown/sms/snapshot',
	},
	fido2: {
		manifest: 'src/v8/lockdown/fido2/manifest.json',
		snapshotDir: 'src/v8/lockdown/fido2/snapshot',
	},
	email: {
		manifest: 'src/v8/lockdown/email/manifest.json',
		snapshotDir: 'src/v8/lockdown/email/snapshot',
	},
	whatsapp: {
		manifest: 'src/v8/lockdown/whatsapp/manifest.json',
		snapshotDir: 'src/v8/lockdown/whatsapp/snapshot',
	},
	'success-page': {
		manifest: 'src/v8/lockdown/success-page/manifest.json',
		snapshotDir: 'src/v8/lockdown/success-page/snapshot',
	},
};

/**
 * Compute SHA-256 hash of file content
 */
function computeHash(content) {
	return createHash('sha256').update(content, 'utf8').digest('hex');
}

/**
 * Read file content, return null if file doesn't exist
 */
function readFileSafe(filePath) {
	try {
		return readFileSync(filePath, 'utf8');
	} catch (error) {
		if (error.code === 'ENOENT') {
			return null;
		}
		throw error;
	}
}

/**
 * Verify that all files in manifest match their snapshots
 */
function verify(flow) {
	const config = FLOW_CONFIGS[flow];
	if (!config) {
		console.error(`❌ Unknown flow: ${flow}`);
		console.error(`Available flows: ${Object.keys(FLOW_CONFIGS).join(', ')}`);
		process.exit(1);
	}

	const manifestPath = join(PROJECT_ROOT, config.manifest);
	if (!existsSync(manifestPath)) {
		console.error(`❌ Manifest not found: ${manifestPath}`);
		console.error(`Run 'npm run ${flow}:lockdown:approve' to create the manifest and snapshots.`);
		process.exit(1);
	}

	const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
	const snapshotDir = join(PROJECT_ROOT, config.snapshotDir);

	let allMatch = true;
	const errors = [];

	console.log(`🔒 Verifying ${flow.toUpperCase()} lockdown integrity...`);
	console.log(`   Manifest: ${config.manifest}`);
	console.log(`   Snapshot dir: ${config.snapshotDir}`);
	console.log(`   Files to verify: ${manifest.files?.length || 0}`);
	console.log('');

	for (const fileEntry of manifest.files || []) {
		const filePath = fileEntry.path;
		const expectedHash = fileEntry.hash;
		const fullPath = join(PROJECT_ROOT, filePath);
		const snapshotPath = join(snapshotDir, filePath.split('/').pop());

		// Read current file
		const currentContent = readFileSafe(fullPath);
		if (currentContent === null) {
			errors.push(`❌ File missing: ${filePath}`);
			allMatch = false;
			continue;
		}

		// Read snapshot
		const snapshotContent = readFileSafe(snapshotPath);
		if (snapshotContent === null) {
			errors.push(`❌ Snapshot missing: ${snapshotPath}`);
			allMatch = false;
			continue;
		}

		// Compare hashes
		const currentHash = computeHash(currentContent);
		const snapshotHash = computeHash(snapshotContent);

		if (currentHash !== expectedHash || currentHash !== snapshotHash) {
			errors.push(`❌ File modified: ${filePath}`);
			errors.push(`   Expected hash: ${expectedHash.substring(0, 16)}...`);
			errors.push(`   Current hash:  ${currentHash.substring(0, 16)}...`);
			errors.push(`   Snapshot hash:  ${snapshotHash.substring(0, 16)}...`);
			allMatch = false;
		} else {
			console.log(`✅ ${filePath}`);
		}
	}

	if (allMatch) {
		console.log('');
		console.log(`✅ ${flow.toUpperCase()} lockdown verification passed - all files match snapshots`);
		process.exit(0);
	} else {
		console.log('');
		console.error(`❌ ${flow.toUpperCase()} lockdown verification FAILED`);
		console.error('');
		console.error('Files have been modified:');
		errors.forEach((error) => console.error(error));
		console.error('');
		console.error('To restore files from snapshots, use the restart script.');
		console.error(`To approve current changes, run: npm run ${flow}:lockdown:approve`);
		process.exit(1);
	}
}

/**
 * Approve current files by updating snapshots and manifest
 */
function approve(flow) {
	const config = FLOW_CONFIGS[flow];
	if (!config) {
		console.error(`❌ Unknown flow: ${flow}`);
		console.error(`Available flows: ${Object.keys(FLOW_CONFIGS).join(', ')}`);
		process.exit(1);
	}

	const manifestPath = join(PROJECT_ROOT, config.manifest);
	const snapshotDir = join(PROJECT_ROOT, config.snapshotDir);

	// Read existing manifest or create new one
	let manifest = { files: [] };
	if (existsSync(manifestPath)) {
		manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
	}

	// Ensure snapshot directory exists
	mkdirSync(snapshotDir, { recursive: true });

	console.log(`📸 Creating snapshots for ${flow.toUpperCase()} lockdown...`);
	console.log(`   Manifest: ${config.manifest}`);
	console.log(`   Snapshot dir: ${config.snapshotDir}`);
	console.log('');

	const files = [];
	// Process all files from manifest (even if they don't have hashes yet)
	for (const fileEntry of manifest.files || []) {
		const filePath = fileEntry.path || fileEntry;
		const fullPath = join(PROJECT_ROOT, filePath);
		const fileName = filePath.split('/').pop();
		const snapshotPath = join(snapshotDir, fileName);

		// Read current file
		const currentContent = readFileSafe(fullPath);
		if (currentContent === null) {
			console.warn(`⚠️  File not found, skipping: ${filePath}`);
			continue;
		}

		// Compute hash
		const hash = computeHash(currentContent);

		// Create snapshot
		writeFileSync(snapshotPath, currentContent, 'utf8');

		// Update manifest entry (preserve description if it exists)
		const entry = {
			path: filePath,
			hash,
		};
		if (fileEntry.description) {
			entry.description = fileEntry.description;
		}
		files.push(entry);

		console.log(`✅ Snapshot created: ${filePath} (${hash.substring(0, 16)}...)`);
	}

	// Update manifest
	manifest.files = files;
	manifest.updated = new Date().toISOString();
	manifest.flow = flow;

	// Write manifest
	writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

	console.log('');
	console.log(`✅ ${flow.toUpperCase()} lockdown approved - snapshots and manifest updated`);
	console.log(`   Total files: ${files.length}`);
}

// Main entry point
const command = process.argv[2];
const flow = process.argv[3];

if (!command || !flow) {
	console.error('Usage: node scripts/lockdown/lockdown.mjs <verify|approve> <flow>');
	console.error('');
	console.error('Commands:');
	console.error('  verify  - Verify files match snapshots');
	console.error('  approve - Update snapshots with current files');
	console.error('');
	console.error('Flows:');
	console.error('  sms, fido2, email, whatsapp, success-page');
	process.exit(1);
}

if (command === 'verify') {
	verify(flow);
} else if (command === 'approve') {
	approve(flow);
} else {
	console.error(`❌ Unknown command: ${command}`);
	console.error('Use "verify" or "approve"');
	process.exit(1);
}

