#!/usr/bin/env node

/**
 * @file lock-whatsapp.mjs
 * @description Lock WhatsApp MFA V8 feature - Create isolated copy with all dependencies
 * @version 1.0.0
 *
 * This script creates a complete isolated copy of WhatsApp MFA V8, including:
 * - WhatsApp flow files (registration and authentication)
 * - WhatsApp configuration page
 * - All dependencies (services, utils, components, hooks, controllers)
 * - Updated imports to use isolated versions
 * - Manifest tracking locked files
 *
 * Usage:
 *   node scripts/lockdown/lock-whatsapp.mjs [--dry-run]
 *
 * After locking, WhatsApp MFA will be in src/locked/whatsapp-v8/ and will never break
 * when shared services are updated.
 */

import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '../..');

const LOCKED_DIR = join(PROJECT_ROOT, 'src', 'locked', 'whatsapp-v8');
const FEATURE_DIR = join(LOCKED_DIR, 'feature');
const DEPS_DIR = join(LOCKED_DIR, 'dependencies');
const MANIFEST_PATH = join(LOCKED_DIR, 'manifest.json');

// WhatsApp feature files to lock
const WHATSAPP_FILES = [
	'src/v8/flows/types/WhatsAppFlowV8.tsx',
	'src/v8/flows/types/WhatsAppOTPConfigurationPageV8.tsx',
];

// Critical dependencies to lock
const CRITICAL_DEPS = [
	// Services
	'src/v8/services/mfaServiceV8.ts',
	'src/v8/services/mfaAuthenticationServiceV8.ts',
	'src/v8/services/mfaConfigurationServiceV8.ts',
	'src/v8/services/credentialsServiceV8.ts',
	'src/v8/services/workerTokenServiceV8.ts',
	'src/v8/services/workerTokenStatusServiceV8.ts',
	'src/v8/services/apiDisplayServiceV8.ts',
	'src/v8/services/phoneAutoPopulationServiceV8.ts',
	// Shared flow components
	'src/v8/flows/shared/MFAFlowBaseV8.tsx',
	'src/v8/flows/shared/MFATypes.ts',
	'src/v8/flows/shared/MFAConfigurationStepV8.tsx',
	'src/v8/flows/shared/mfaSuccessPageServiceV8.tsx',
	'src/v8/flows/shared/useUnifiedOTPFlow.ts',
	// Controllers
	'src/v8/flows/controllers/MFAFlowController.ts',
	'src/v8/flows/controllers/WhatsAppFlowController.ts',
	'src/v8/flows/factories/MFAFlowControllerFactory.ts',
	// Components
	'src/v8/components/MFADeviceSelector.tsx',
	'src/v8/components/MFAOTPInput.tsx',
	'src/v8/components/MFAInfoButtonV8.tsx',
	'src/v8/components/SuperSimpleApiDisplayV8.tsx',
	'src/v8/components/CountryCodePickerV8.tsx',
	'src/v8/components/NicknamePromptModalV8.tsx',
	'src/v8/components/WhatsAppNotEnabledModalV8.tsx',
	// Hooks
	'src/v8/hooks/useStepNavigationV8.ts',
	'src/v8/hooks/useDraggableModal.ts',
	// Utils
	'src/v8/utils/toastNotificationsV8.ts',
	'src/v8/utils/mfaFlowCleanupV8.ts',
	'src/v8/utils/phoneValidationV8.ts',
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
function lockWhatsApp(dryRun = false) {
	console.log('🔒 Locking WhatsApp MFA V8...\n');

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
	for (const file of WHATSAPP_FILES) {
		const srcPath = join(PROJECT_ROOT, file);
		if (!existsSync(srcPath)) {
			console.warn(`⚠️  File not found: ${file}`);
			continue;
		}

		const relativePath = relative(join(PROJECT_ROOT, 'src/v8/flows/types'), srcPath);
		const destPath = join(FEATURE_DIR, 'flows/types', relativePath);

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

	for (const file of WHATSAPP_FILES) {
		const featureFilePath = join(PROJECT_ROOT, file);
		if (!existsSync(featureFilePath)) continue;

		const deps = findDependencies(featureFilePath);
		for (const dep of deps) {
			// Check if already copied as critical dependency
			const alreadyCopied = CRITICAL_DEPS.some((cd) => dep.includes(cd.replace(/^src\//, '')));
			if (alreadyCopied) continue;

			// Only lock v8 dependencies to avoid locking everything
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
		feature: 'whatsapp-v8',
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

	console.log('\n✨ WhatsApp MFA V8 locked successfully!');
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
lockWhatsApp(dryRun);
