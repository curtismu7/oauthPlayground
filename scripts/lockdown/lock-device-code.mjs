#!/usr/bin/env node

/**
 * @file lock-device-code.mjs
 * @description Lock Device Code Authorization feature - Create isolated copy with all dependencies
 * @version 1.0.0
 *
 * This script creates a complete isolated copy of Device Code Authorization, including:
 * - Device code integration service
 * - Device flow service
 * - Device flow components (DynamicDeviceFlow, DeviceTypeSelector, etc.)
 * - All dependencies (services, utils, components)
 * - Updated imports to use isolated versions
 * - Manifest tracking locked files
 *
 * Usage:
 *   node scripts/lockdown/lock-device-code.mjs [--dry-run]
 *
 * After locking, Device Code Authorization will be in src/locked/device-code-v8/ and will never break
 * when shared services are updated.
 */

import { createHash } from 'node:crypto';
import {
	cpSync,
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	statSync,
	writeFileSync,
} from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '../..');

const LOCKED_DIR = join(PROJECT_ROOT, 'src', 'locked', 'device-code-v8');
const FEATURE_DIR = join(LOCKED_DIR, 'feature');
const DEPS_DIR = join(LOCKED_DIR, 'dependencies');
const MANIFEST_PATH = join(LOCKED_DIR, 'manifest.json');

// Device code feature files to lock
const DEVICE_CODE_FILES = [
	'src/v8/services/deviceCodeIntegrationServiceV8.ts',
	'src/services/deviceFlowService.ts',
];

// Critical dependencies to lock
const CRITICAL_DEPS = [
	// Device flow components
	'src/components/DynamicDeviceFlow.tsx',
	'src/components/DeviceTypeSelector.tsx',
	'src/components/AIAgentDeviceFlow.tsx',
	'src/components/AirportKioskDeviceFlow.tsx',
	'src/components/AmazonEchoShowDeviceFlow.tsx',
	'src/components/AppleTVDeviceFlow.tsx',
	'src/components/BoseSmartSpeakerDeviceFlow.tsx',
	'src/components/FitnessTrackerDeviceFlow.tsx',
	'src/components/GamingConsoleDeviceFlow.tsx',
	'src/components/GasPumpDeviceFlow.tsx',
	'src/components/IndustrialIoTControllerDeviceFlow.tsx',
	'src/components/MCPServerDeviceFlow.tsx',
	'src/components/MobilePhoneDeviceFlow.tsx',
	'src/components/POSTerminalDeviceFlow.tsx',
	'src/components/RingDoorbellDeviceFlow.tsx',
	'src/components/SmartPrinterDeviceFlow.tsx',
	'src/components/SmartSpeakerDeviceFlow.tsx',
	'src/components/SmartTVDeviceFlow.tsx',
	'src/components/SmartVehicleDeviceFlow.tsx',
	'src/components/SonyGameControllerDeviceFlow.tsx',
	'src/components/SquarePOSDeviceFlow.tsx',
	'src/components/TeslaCarDisplayDeviceFlow.tsx',
	'src/components/VizioTVDeviceFlow.tsx',
	// Services
	'src/v8/services/credentialsServiceV8.ts',
	'src/v8/services/sharedCredentialsServiceV8.ts',
	'src/v8/services/environmentIdServiceV8.ts',
	'src/utils/pingOneFetch.ts',
	'src/utils/logger.ts',
	// Components used by device flows
	'src/components/ColoredUrlDisplay.tsx',
	'src/components/StandardizedTokenDisplay.tsx',
	'src/components/InlineTokenDisplay.tsx',
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
				// Recursively find dependencies (limited depth to avoid circular deps)
				if (deps.length < 200) {
					deps.push(...findDependencies(resolved, visited));
				}
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
				return `from '${relPath.startsWith('.') ? relPath : './' + relPath}'`;
			}
		}
		return match; // Keep original if not locked
	});

	// Update relative imports
	updated = updated.replace(/from\s+['"](\.\/[^'"]+)['"]/g, (match, path) => {
		const originalPath = resolve(dirname(filePath), path).replace(/\\/g, '/');
		for (const [origPath, lockedPath] of Object.entries(lockedDepsMap)) {
			if (originalPath === origPath) {
				const relPath = relative(dirname(filePath), lockedPath).replace(/\\/g, '/');
				return `from '${relPath.startsWith('.') ? relPath : './' + relPath}'`;
			}
		}
		return match;
	});

	return updated;
}

/**
 * Get file hash for change tracking
 */
function getFileHash(filePath) {
	if (!existsSync(filePath)) return null;
	const content = readFileSync(filePath, 'utf8');
	return createHash('sha256').update(content).digest('hex');
}

/**
 * Main lockdown function
 */
function lockDeviceCode(dryRun = false) {
	console.log('🔒 Locking Device Code Authorization...\n');

	if (dryRun) {
		console.log('🔍 DRY RUN MODE - No files will be modified\n');
	}

	// Create directories
	if (!dryRun) {
		mkdirSync(FEATURE_DIR, { recursive: true });
		mkdirSync(DEPS_DIR, { recursive: true });
	}

	const lockedFiles = new Map();
	const lockedDepsMap = {};

	// Step 1: Copy feature files
	console.log('📦 Copying feature files...');
	for (const file of DEVICE_CODE_FILES) {
		const srcPath = join(PROJECT_ROOT, file);
		if (!existsSync(srcPath)) {
			console.warn(`⚠️  File not found: ${file}`);
			continue;
		}

		const relativePath = relative(join(PROJECT_ROOT, 'src'), srcPath);
		const destPath = join(FEATURE_DIR, relativePath);

		if (!dryRun) {
			mkdirSync(dirname(destPath), { recursive: true });
			cpSync(srcPath, destPath);
		}

		const hash = getFileHash(srcPath);
		lockedFiles.set(file, {
			lockedPath: relative(LOCKED_DIR, destPath),
			hash,
			type: 'feature',
		});

		console.log(`  ✅ ${file} → ${relative(LOCKED_DIR, destPath)}`);
	}

	// Step 2: Copy critical dependencies
	console.log('\n📚 Copying critical dependencies...');
	for (const dep of CRITICAL_DEPS) {
		const srcPath = join(PROJECT_ROOT, dep);
		if (!existsSync(srcPath)) {
			console.warn(`⚠️  Dependency not found: ${dep}`);
			continue;
		}

		const relativePath = relative(join(PROJECT_ROOT, 'src'), srcPath);
		const destPath = join(DEPS_DIR, relativePath);

		if (!dryRun) {
			mkdirSync(dirname(destPath), { recursive: true });
			cpSync(srcPath, destPath);
		}

		const hash = getFileHash(srcPath);
		lockedFiles.set(dep, {
			lockedPath: relative(LOCKED_DIR, destPath),
			hash,
			type: 'dependency',
		});

		lockedDepsMap[srcPath] = destPath;
		console.log(`  ✅ ${dep} → ${relative(LOCKED_DIR, destPath)}`);
	}

	// Step 3: Find and copy transitive dependencies
	console.log('\n🔍 Finding transitive dependencies...');
	const allTransitiveDeps = new Set();

	for (const file of DEVICE_CODE_FILES) {
		const featureFilePath = join(PROJECT_ROOT, file);
		if (!existsSync(featureFilePath)) continue;

		const deps = findDependencies(featureFilePath);
		for (const dep of deps) {
			// Check if already copied as critical dependency
			const alreadyCopied = CRITICAL_DEPS.some((cd) => dep.includes(cd.replace(/^src\//, '')));
			if (alreadyCopied) continue;

			// Only lock relevant dependencies
			if (
				dep.includes('/v8/') ||
				dep.includes('/services/') ||
				dep.includes('/utils/') ||
				dep.includes('/components/')
			) {
				allTransitiveDeps.add(dep);
			}
		}
	}

	for (const dep of allTransitiveDeps) {
		const relPath = relative(join(PROJECT_ROOT, 'src'), dep);
		const destPath = join(DEPS_DIR, relPath);

		if (!dryRun) {
			mkdirSync(dirname(destPath), { recursive: true });
			cpSync(dep, destPath);
		}

		const hash = getFileHash(dep);
		const originalRelPath = relative(PROJECT_ROOT, dep);
		lockedFiles.set(originalRelPath, {
			lockedPath: relative(LOCKED_DIR, destPath),
			hash,
			type: 'transitive',
		});

		lockedDepsMap[dep] = destPath;
		console.log(`  ✅ ${originalRelPath} → ${relative(LOCKED_DIR, destPath)}`);
	}

	// Step 4: Update imports in locked files
	if (!dryRun) {
		console.log('\n🔧 Updating imports in locked files...');
		const allLockedFiles = [...lockedFiles.keys()].map((k) => {
			const info = lockedFiles.get(k);
			return { original: k, locked: join(LOCKED_DIR, info.lockedPath) };
		});

		for (const { original, locked } of allLockedFiles) {
			if (!existsSync(locked)) continue;

			const content = readFileSync(locked, 'utf8');
			const updated = updateImports(content, locked, lockedDepsMap);

			if (content !== updated) {
				writeFileSync(locked, updated);
				console.log(`  ✅ Updated imports in ${relative(LOCKED_DIR, locked)}`);
			}
		}
	}

	// Step 5: Create manifest
	const manifest = {
		feature: 'device-code-v8',
		version: '1.0.0',
		lockedAt: new Date().toISOString(),
		description:
			'Locked-down Device Code Authorization flow (RFC 8628) for OAuth 2.0/OIDC. This includes the device code integration service, device flow service, and all device-specific flow components. Protected from breaking changes in shared services.',
		files: Object.fromEntries(lockedFiles),
		summary: {
			totalFiles: lockedFiles.size,
			featureFiles: Array.from(lockedFiles.values()).filter((f) => f.type === 'feature').length,
			dependencyFiles: Array.from(lockedFiles.values()).filter((f) => f.type === 'dependency')
				.length,
			transitiveFiles: Array.from(lockedFiles.values()).filter((f) => f.type === 'transitive')
				.length,
		},
	};

	if (!dryRun) {
		writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
		console.log(`\n📄 Manifest created: ${relative(PROJECT_ROOT, MANIFEST_PATH)}`);
	}

	console.log('\n✨ Device Code Authorization locked successfully!');
	console.log(`\n📊 Summary:`);
	console.log(`   Feature files: ${manifest.summary.featureFiles}`);
	console.log(`   Dependency files: ${manifest.summary.dependencyFiles}`);
	console.log(`   Transitive files: ${manifest.summary.transitiveFiles}`);
	console.log(`   Total: ${manifest.summary.totalFiles} files`);
	console.log(`\n📁 Locked files are in: ${relative(PROJECT_ROOT, LOCKED_DIR)}`);
	console.log('\n⚠️  IMPORTANT: Device Code Authorization is now protected from breaking changes.');
}

// Run
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
lockDeviceCode(dryRun);
