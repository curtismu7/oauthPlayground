#!/usr/bin/env node

/**
 * @file lock-fido2.mjs
 * @description Lock FIDO2 V8 feature - Create isolated copy with all dependencies
 * @version 1.0.0
 *
 * This script creates a complete isolated copy of FIDO2 V8, including:
 * - All FIDO2 flow files
 * - All dependencies (services, utils, types, components)
 * - Updated imports to use isolated versions
 * - Manifest tracking locked files
 *
 * Usage:
 *   node scripts/lockdown/lock-fido2.mjs [--dry-run]
 *
 * After locking, FIDO2 will be in src/locked/fido2-v8/ and will never break
 * when shared services are updated.
 */

import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '../..');

const LOCKED_DIR = join(PROJECT_ROOT, 'src', 'locked', 'fido2-v8');
const FEATURE_DIR = join(LOCKED_DIR, 'feature');
const DEPS_DIR = join(LOCKED_DIR, 'dependencies');
const MANIFEST_PATH = join(LOCKED_DIR, 'manifest.json');

// FIDO2 feature files to lock
const FIDO2_FILES = [
	// Flow files
	'src/v8/flows/types/FIDO2FlowV8.tsx',
	'src/v8/flows/types/FIDO2ConfigurationPageV8.tsx',
	// Controller
	'src/v8/flows/controllers/FIDO2FlowController.ts',
];

// Critical dependencies to lock
const CRITICAL_DEPS = [
	// Core FIDO2 service
	'src/services/fido2Service.ts',
	// MFA Services
	'src/v8/services/mfaServiceV8.ts',
	'src/v8/services/mfaAuthenticationServiceV8.ts',
	'src/v8/services/mfaConfigurationServiceV8.ts',
	'src/v8/services/webAuthnAuthenticationServiceV8.ts',
	'src/v8/services/mfaEducationServiceV8.ts',
	// Credentials and Worker Token
	'src/v8/services/credentialsServiceV8.ts',
	'src/v8/services/workerTokenServiceV8.ts',
	'src/v8/services/workerTokenStatusServiceV8.ts',
	'src/v8/services/environmentIdServiceV8.ts',
	// API Display
	'src/v8/services/apiDisplayServiceV8.ts',
	// Shared flow components
	'src/v8/flows/shared/MFAFlowBaseV8.tsx',
	'src/v8/flows/shared/MFATypes.ts',
	'src/v8/flows/shared/mfaSuccessPageServiceV8.tsx',
	// Components
	'src/v8/components/FIDODeviceExistsModalV8.tsx',
	'src/v8/components/MFAInfoButtonV8.tsx',
	'src/v8/components/MFANavigationV8.tsx',
	'src/v8/components/SuperSimpleApiDisplayV8.tsx',
	'src/v8/components/WorkerTokenGaugeV8.tsx',
	'src/v8/components/WorkerTokenModalV8.tsx',
	'src/v8/components/MFADeviceSelector.tsx',
	// Utils
	'src/v8/utils/toastNotificationsV8.ts',
	'src/v8/utils/mfaFlowCleanupV8.ts',
	'src/v8/utils/workerTokenModalHelperV8.ts',
	// Hooks
	'src/v8/hooks/useStepNavigationV8.ts',
	// Factories
	'src/v8/flows/factories/MFAFlowControllerFactory.ts',
];

/**
 * Find all dependencies recursively
 */
function findDependencies(filePath, visited = new Set()) {
	if (visited.has(filePath) || !existsSync(filePath)) return [];
	visited.add(filePath);

	const deps = [];
	const content = readFileSync(filePath, 'utf8');

	// Extract imports
	const importRegex = /from\s+['"]([^'"]+)['"]|import\s+['"]([^'"]+)['"]/g;
	let match;
	while ((match = importRegex.exec(content)) !== null) {
		const importPath = match[1] || match[2];

		// Skip node_modules and external packages
		if (importPath.startsWith('.') || importPath.startsWith('@/')) {
			let resolved;
			if (importPath.startsWith('@/')) {
				resolved = join(PROJECT_ROOT, 'src', importPath.substring(2));
			} else {
				resolved = resolve(dirname(filePath), importPath);
			}

			// Try with .ts, .tsx extensions
			if (!existsSync(resolved)) {
				for (const ext of ['.ts', '.tsx', '.js', '.jsx']) {
					if (existsSync(resolved + ext)) {
						resolved = resolved + ext;
						break;
					}
				}
			}

			if (existsSync(resolved) && statSync(resolved).isFile()) {
				deps.push(resolved);
				deps.push(...findDependencies(resolved, visited));
			}
		}
	}

	return deps;
}

/**
 * Update imports in file to use locked dependencies
 */
function updateImports(content, filePath, lockedDepsMap) {
	let updated = content;

	// Update @/ imports to use locked versions
	updated = updated.replace(/from\s+['"]@\/([^'"]+)['"]/g, (match, path) => {
		// Check if this dependency is locked
		for (const [originalPath, lockedPath] of Object.entries(lockedDepsMap)) {
			if (originalPath.includes(path)) {
				const relPath = relative(dirname(filePath), lockedPath).replace(/\\/g, '/');
				return `from '${relPath.startsWith('.') ? relPath : `./${relPath}`}'`;
			}
		}
		return match; // Keep original if not locked
	});

	return updated;
}

/**
 * Compute file hash
 */
function computeHash(content) {
	return createHash('sha256').update(content, 'utf8').digest('hex');
}

/**
 * Main lock function
 */
async function lockFIDO2(dryRun = false) {
	console.log('🔒 Locking FIDO2 V8 Feature...\n');

	// Collect all dependencies
	const allDeps = new Set();

	// Add critical dependencies
	for (const dep of CRITICAL_DEPS) {
		const depPath = join(PROJECT_ROOT, dep);
		if (existsSync(depPath)) {
			allDeps.add(depPath);
			// Find transitive dependencies
			const transitive = findDependencies(depPath);
			transitive.forEach((d) => allDeps.add(d));
		}
	}

	// Find dependencies from FIDO2 files
	for (const file of FIDO2_FILES) {
		const filePath = join(PROJECT_ROOT, file);
		if (existsSync(filePath)) {
			const deps = findDependencies(filePath);
			deps.forEach((d) => allDeps.add(d));
		}
	}

	console.log(`📦 Found ${allDeps.size} dependencies to lock`);

	// Create manifest
	const manifest = {
		feature: 'fido2-v8',
		name: 'FIDO2 V8 Complete',
		description: 'Complete FIDO2/WebAuthn MFA flow with registration and authentication',
		lockedAt: new Date().toISOString(),
		files: [],
		dependencies: [],
	};

	// Map original paths to locked paths
	const lockedDepsMap = {};

	if (!dryRun) {
		mkdirSync(FEATURE_DIR, { recursive: true });
		mkdirSync(DEPS_DIR, { recursive: true });
	}

	// Copy and lock dependencies
	for (const dep of allDeps) {
		const relPath = relative(join(PROJECT_ROOT, 'src'), dep);
		const destPath = join(DEPS_DIR, relPath);

		if (!dryRun) {
			mkdirSync(dirname(destPath), { recursive: true });
			cpSync(dep, destPath);
		}

		lockedDepsMap[dep] = destPath;

		const content = readFileSync(dep, 'utf8');
		manifest.dependencies.push({
			path: relPath,
			originalPath: relative(PROJECT_ROOT, dep),
			hash: computeHash(content),
		});
	}

	console.log(`📄 Locking ${FIDO2_FILES.length} feature files`);

	// Copy and update feature files
	for (const file of FIDO2_FILES) {
		const filePath = join(PROJECT_ROOT, file);
		if (!existsSync(filePath)) {
			console.warn(`⚠️  File not found: ${file}`);
			continue;
		}

		const relPath = relative('src/v8/flows', file);
		const destPath = join(FEATURE_DIR, relPath);

		const content = readFileSync(filePath, 'utf8');
		const updatedContent = updateImports(content, destPath, lockedDepsMap);

		if (!dryRun) {
			mkdirSync(dirname(destPath), { recursive: true });
			writeFileSync(destPath, updatedContent, 'utf8');
		}

		manifest.files.push({
			path: relPath,
			originalPath: relative(PROJECT_ROOT, filePath),
			hash: computeHash(content),
		});
	}

	// Write manifest
	if (!dryRun) {
		writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8');
		console.log(`\n✅ FIDO2 V8 locked successfully!`);
		console.log(`📁 Locked directory: ${LOCKED_DIR}`);
		console.log(`📋 Manifest: ${MANIFEST_PATH}`);
		console.log(
			`\n🔒 FIDO2 is now isolated and will never break when shared services are updated.`
		);
	} else {
		console.log(`\n🔍 DRY RUN - Would lock:`);
		console.log(`   Feature files: ${FIDO2_FILES.length}`);
		console.log(`   Dependencies: ${allDeps.size}`);
		console.log(`   Lock directory: ${LOCKED_DIR}`);
	}

	return manifest;
}

// Main
const dryRun = process.argv.includes('--dry-run');

lockFIDO2(dryRun).catch((error) => {
	console.error('❌ Error locking FIDO2:', error);
	process.exit(1);
});
