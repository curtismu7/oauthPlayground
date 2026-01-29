#!/usr/bin/env node

/**
 * @file lock-unified-flow.mjs
 * @description Lock Unified OAuth Flow V8U feature - Create isolated copy with all dependencies
 * @version 1.0.0
 *
 * This script creates a complete isolated copy of Unified OAuth Flow V8U, including:
 * - Main unified flow component
 * - All V8U components and services
 * - All dependencies (V8 services, utils, components)
 * - Updated imports to use isolated versions
 * - Manifest tracking locked files
 *
 * Usage:
 *   node scripts/lockdown/lock-unified-flow.mjs [--dry-run]
 *
 * After locking, Unified Flow will be in src/locked/unified-flow-v8u/ and will never break
 * when shared services are updated.
 */

import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '../..');

const LOCKED_DIR = join(PROJECT_ROOT, 'src', 'locked', 'unified-flow-v8u');
const FEATURE_DIR = join(LOCKED_DIR, 'feature');
const DEPS_DIR = join(LOCKED_DIR, 'dependencies');
const MANIFEST_PATH = join(LOCKED_DIR, 'manifest.json');

// Unified Flow feature files to lock
const FEATURE_FILES = [
	'src/v8u/flows/UnifiedOAuthFlowV8U.tsx',
	'src/v8u/components/UnifiedFlowSteps.tsx',
	'src/v8u/components/CredentialsFormV8U.tsx',
	'src/v8u/components/FlowTypeSelector.tsx',
	'src/v8u/components/SpecVersionSelector.tsx',
	'src/v8u/components/UnifiedNavigationV8U.tsx',
	'src/v8u/components/CallbackHandlerV8U.tsx',
	'src/v8u/services/unifiedFlowIntegrationV8U.ts',
	'src/v8u/services/authorizationUrlBuilderServiceV8U.ts',
	'src/v8u/services/credentialReloadServiceV8U.ts',
	'src/v8u/services/flowSettingsServiceV8U.ts',
	'src/v8u/services/pkceStorageServiceV8U.ts',
	'src/v8u/services/unifiedFlowErrorHandlerV8U.ts',
	'src/v8u/services/unifiedFlowLoggerServiceV8U.ts',
	'src/v8u/services/unifiedFlowDocumentationServiceV8U.ts',
	'src/v8u/services/parRarIntegrationServiceV8U.ts',
	'src/v8u/components/AppDiscoveryModalV8U.tsx',
	'src/v8u/components/CompactAppPickerV8U.tsx',
	'src/v8u/hooks/useStepNavigationV8U.ts',
];

// Critical dependencies to lock (V8 services that unified flow depends on)
const CRITICAL_DEPS = [
	// V8 Services
	'src/v8/services/credentialsServiceV8.ts',
	'src/v8/services/sharedCredentialsServiceV8.ts',
	'src/v8/services/environmentIdServiceV8.ts',
	'src/v8/services/workerTokenServiceV8.ts',
	'src/v8/services/workerTokenStatusServiceV8.ts',
	'src/v8/services/configCheckerServiceV8.ts',
	'src/v8/services/appDiscoveryServiceV8.ts',
	'src/v8/services/redirectUriServiceV8.ts',
	'src/v8/services/specVersionServiceV8.ts',
	'src/v8/services/specUrlServiceV8.ts',
	'src/v8/services/oidcDiscoveryServiceV8.ts',
	'src/v8/services/oauthIntegrationServiceV8.ts',
	'src/v8/services/implicitFlowIntegrationServiceV8.ts',
	'src/v8/services/clientCredentialsIntegrationServiceV8.ts',
	'src/v8/services/deviceCodeIntegrationServiceV8.ts',
	'src/v8/services/hybridFlowIntegrationServiceV8.ts',
	'src/v8/services/unifiedFlowOptionsServiceV8.ts',
	// V8 Components
	'src/v8/components/SuperSimpleApiDisplayV8.tsx',
	// V8 Utils
	'src/v8/utils/toastNotificationsV8.ts',
	'src/v8/utils/analyticsServerCheckV8.ts',
	// Shared services
	'src/services/postmanCollectionGeneratorV8.ts',
	'src/services/pkceService.tsx',
	'src/utils/storage.ts',
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
				return `from '${relPath.startsWith('.') ? relPath : `./${relPath}`}'`;
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
				return `from '${relPath.startsWith('.') ? relPath : `./${relPath}`}'`;
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
function lockUnifiedFlow(dryRun = false) {
	console.log('🔒 Locking Unified OAuth Flow V8U...\n');

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
	for (const file of FEATURE_FILES) {
		const srcPath = join(PROJECT_ROOT, file);
		if (!existsSync(srcPath)) {
			console.warn(`⚠️  File not found: ${file}`);
			continue;
		}

		// Preserve directory structure
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

	// Step 3: Find and copy transitive dependencies from feature files
	console.log('\n🔍 Finding transitive dependencies...');
	const allTransitiveDeps = new Set();

	for (const file of FEATURE_FILES) {
		const srcPath = join(PROJECT_ROOT, file);
		if (!existsSync(srcPath)) continue;

		const deps = findDependencies(srcPath);
		for (const dep of deps) {
			// Check if already copied as critical dependency
			const alreadyCopied = CRITICAL_DEPS.some((cd) => dep.includes(cd.replace(/^src\//, '')));
			if (alreadyCopied) continue;

			// Only lock v8/v8u dependencies to avoid locking everything
			if (
				dep.includes('/v8/') ||
				dep.includes('/v8u/') ||
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
		console.log(`  ✅ ${relative(PROJECT_ROOT, dep)} → ${relative(LOCKED_DIR, destPath)}`);
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
		feature: 'unified-flow-v8u',
		version: '1.0.0',
		lockedAt: new Date().toISOString(),
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

	console.log('\n✨ Unified OAuth Flow V8U locked successfully!');
	console.log(`\n📊 Summary:`);
	console.log(`   Feature files: ${manifest.summary.featureFiles}`);
	console.log(`   Dependency files: ${manifest.summary.dependencyFiles}`);
	console.log(`   Transitive files: ${manifest.summary.transitiveFiles}`);
	console.log(`   Total: ${manifest.summary.totalFiles} files`);
	console.log(`\n📁 Locked files are in: ${relative(PROJECT_ROOT, LOCKED_DIR)}`);
	console.log('\n⚠️  IMPORTANT: Update routing to use locked version if needed.');
}

// Run
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
lockUnifiedFlow(dryRun);
