#!/usr/bin/env node

/**
 * @file lock-feature.mjs
 * @description Feature Lockdown System - Isolates stable features with their own dependencies
 * @version 1.0.0
 *
 * This script creates a complete isolated copy of a feature, including:
 * - All feature files
 * - All dependencies (services, utils, types, components)
 * - Updated imports to use isolated versions
 * - Manifest tracking locked features
 *
 * Usage:
 *   node scripts/lockdown/lock-feature.mjs <feature-name> [--dry-run]
 *
 * Example:
 *   node scripts/lockdown/lock-feature.mjs mfa-v8
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
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '../..');

// Feature configurations
const FEATURE_CONFIGS = {
	'mfa-v8': {
		name: 'MFA V8',
		description: 'Complete MFA V8 flow with all device types',
		sourceDir: 'src/v8/flows/types',
		includePatterns: ['**/*FlowV8.tsx', '**/*ConfigurationPageV8.tsx'],
		dependencies: [
			'src/v8/services/mfaServiceV8.ts',
			'src/v8/services/mfaAuthenticationServiceV8.ts',
			'src/v8/services/mfaConfigurationServiceV8.ts',
			'src/v8/services/credentialsServiceV8.ts',
			'src/v8/services/workerTokenServiceV8.ts',
			'src/v8/services/workerTokenStatusServiceV8.ts',
			'src/v8/utils/toastNotificationsV8.ts',
			'src/v8/utils/analyticsLoggerV8.ts',
			'src/v8/flows/shared/MFAFlowBaseV8.tsx',
			'src/v8/flows/shared/MFATypes.ts',
			'src/v8/flows/shared/MFAConfigurationStepV8.tsx',
			'src/v8/components/MFADeviceLimitModalV8.tsx',
			'src/v8/components/MFANavigationV8.tsx',
			'src/v8/components/MFASettingsModalV8.tsx',
		],
	},
	// Add more features as needed
};

/**
 * Recursively find all files matching patterns
 */
function findFiles(dir, patterns, baseDir = dir) {
	const files = [];
	if (!existsSync(dir)) return files;

	const entries = readdirSync(dir);
	for (const entry of entries) {
		const fullPath = join(dir, entry);
		const stat = statSync(fullPath);

		if (stat.isDirectory()) {
			files.push(...findFiles(fullPath, patterns, baseDir));
		} else if (stat.isFile()) {
			const relPath = relative(baseDir, fullPath);
			if (
				patterns.some((pattern) => {
					const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
					return regex.test(relPath);
				})
			) {
				files.push(fullPath);
			}
		}
	}
	return files;
}

/**
 * Extract import statements from a file
 */
function extractImports(content) {
	const imports = [];
	const importRegex = /import\s+(?:.*?\s+from\s+)?['"]([^'"]+)['"]/g;
	let match;
	while ((match = importRegex.exec(content)) !== null) {
		imports.push(match[1]);
	}
	return imports;
}

/**
 * Resolve import path to actual file path
 */
function resolveImportPath(importPath, fromFile) {
	// Skip node_modules and external packages
	if (importPath.startsWith('.') || importPath.startsWith('@/')) {
		const fromDir = dirname(fromFile);
		if (importPath.startsWith('@/')) {
			return join(PROJECT_ROOT, 'src', importPath.substring(2));
		} else {
			return resolve(fromDir, importPath);
		}
	}
	return null;
}

/**
 * Recursively find all dependencies
 */
function findDependencies(file, visited = new Set(), allDeps = new Set()) {
	if (visited.has(file) || !existsSync(file)) return allDeps;
	visited.add(file);

	const content = readFileSync(file, 'utf8');
	const imports = extractImports(content);

	for (const imp of imports) {
		const resolved = resolveImportPath(imp, file);
		if (resolved && existsSync(resolved)) {
			allDeps.add(resolved);
			findDependencies(resolved, visited, allDeps);
		}
	}

	return allDeps;
}

/**
 * Update imports in file content to use locked versions
 */
function updateImports(content, lockedDir, originalDir) {
	// Update @/ imports to use locked versions
	content = content.replace(/from\s+['"]@\/([^'"]+)['"]/g, (match, path) => {
		const lockedPath = join(lockedDir, 'dependencies', path);
		if (existsSync(lockedPath)) {
			const relPath = relative(originalDir, lockedPath).replace(/\\/g, '/');
			return `from '${relPath.startsWith('.') ? relPath : './' + relPath}'`;
		}
		return match; // Keep original if not locked
	});

	// Update relative imports that point to locked dependencies
	content = content.replace(/from\s+['"](\.\.?\/[^'"]+)['"]/g, (match, path) => {
		// Check if this path resolves to a locked dependency
		// This is simplified - you may need more sophisticated path resolution
		return match;
	});

	return content;
}

/**
 * Compute file hash
 */
function computeHash(content) {
	return createHash('sha256').update(content, 'utf8').digest('hex');
}

/**
 * Lock a feature
 */
async function lockFeature(featureName, dryRun = false) {
	const config = FEATURE_CONFIGS[featureName];
	if (!config) {
		console.error(`❌ Unknown feature: ${featureName}`);
		console.error(`Available features: ${Object.keys(FEATURE_CONFIGS).join(', ')}`);
		process.exit(1);
	}

	console.log(`🔒 Locking feature: ${config.name}`);
	console.log(`📁 Source: ${config.sourceDir}`);

	const lockedDir = join(PROJECT_ROOT, 'src', 'locked', featureName);
	const featureDir = join(lockedDir, 'feature');
	const depsDir = join(lockedDir, 'dependencies');
	const manifestPath = join(lockedDir, 'manifest.json');

	if (!dryRun) {
		// Create directories
		mkdirSync(featureDir, { recursive: true });
		mkdirSync(depsDir, { recursive: true });
	}

	// Find all feature files
	const featureFiles = findFiles(join(PROJECT_ROOT, config.sourceDir), config.includePatterns);
	console.log(`📄 Found ${featureFiles.length} feature files`);

	// Collect all dependencies
	const allDeps = new Set();

	// Add explicit dependencies
	for (const dep of config.dependencies) {
		const depPath = join(PROJECT_ROOT, dep);
		if (existsSync(depPath)) {
			allDeps.add(depPath);
			findDependencies(depPath, new Set(), allDeps);
		}
	}

	// Add dependencies from feature files
	for (const file of featureFiles) {
		findDependencies(file, new Set(), allDeps);
	}

	console.log(`📦 Found ${allDeps.size} dependencies`);

	// Create manifest
	const manifest = {
		feature: featureName,
		name: config.name,
		description: config.description,
		lockedAt: new Date().toISOString(),
		files: [],
		dependencies: [],
	};

	// Copy feature files
	for (const file of featureFiles) {
		const relPath = relative(join(PROJECT_ROOT, config.sourceDir), file);
		const destPath = join(featureDir, relPath);
		const content = readFileSync(file, 'utf8');

		// Update imports
		const updatedContent = updateImports(content, lockedDir, dirname(destPath));

		if (!dryRun) {
			mkdirSync(dirname(destPath), { recursive: true });
			writeFileSync(destPath, updatedContent, 'utf8');
		}

		manifest.files.push({
			path: relPath,
			originalPath: relative(PROJECT_ROOT, file),
			hash: computeHash(content),
		});
	}

	// Copy dependencies
	for (const dep of allDeps) {
		const relPath = relative(join(PROJECT_ROOT, 'src'), dep);
		const destPath = join(depsDir, relPath);

		if (!dryRun) {
			mkdirSync(dirname(destPath), { recursive: true });
			cpSync(dep, destPath);
		}

		manifest.dependencies.push({
			path: relPath,
			originalPath: relative(PROJECT_ROOT, dep),
			hash: computeHash(readFileSync(dep, 'utf8')),
		});
	}

	// Write manifest
	if (!dryRun) {
		writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
		console.log(`✅ Feature locked: ${featureName}`);
		console.log(`📋 Manifest: ${manifestPath}`);
	} else {
		console.log(`\n🔍 DRY RUN - Would lock:`);
		console.log(`   Feature files: ${featureFiles.length}`);
		console.log(`   Dependencies: ${allDeps.size}`);
		console.log(`   Lock directory: ${lockedDir}`);
	}

	return manifest;
}

// Main
const featureName = process.argv[2];
const dryRun = process.argv.includes('--dry-run');

if (!featureName) {
	console.error('Usage: node scripts/lockdown/lock-feature.mjs <feature-name> [--dry-run]');
	process.exit(1);
}

lockFeature(featureName, dryRun).catch(console.error);
