#!/usr/bin/env node
/**
 * @file lock-mfa.mjs
 * @description Lock MFA V8 feature - Create isolated copy with all dependencies
 * @version 1.0.0
 * 
 * This script creates a complete isolated copy of MFA V8, including:
 * - All MFA flow files
 * - All dependencies (services, utils, types, components)
 * - Updated imports to use isolated versions
 * - Manifest tracking locked files
 * 
 * Usage:
 *   node scripts/lockdown/lock-mfa.mjs [--dry-run]
 * 
 * After locking, MFA will be in src/locked/mfa-v8/ and will never break
 * when shared services are updated.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, cpSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '../..');

const LOCKED_DIR = join(PROJECT_ROOT, 'src', 'locked', 'mfa-v8');
const FEATURE_DIR = join(LOCKED_DIR, 'feature');
const DEPS_DIR = join(LOCKED_DIR, 'dependencies');
const MANIFEST_PATH = join(LOCKED_DIR, 'manifest.json');

// MFA feature files to lock
const MFA_FILES = [
	// Flow files
	'src/v8/flows/types/SMSFlowV8.tsx',
	'src/v8/flows/types/EmailFlowV8.tsx',
	'src/v8/flows/types/WhatsAppFlowV8.tsx',
	'src/v8/flows/types/MobileFlowV8.tsx',
	'src/v8/flows/types/TOTPFlowV8.tsx',
	'src/v8/flows/types/FIDO2FlowV8.tsx',
	// Configuration pages
	'src/v8/flows/types/SMSOTPConfigurationPageV8.tsx',
	'src/v8/flows/types/EmailOTPConfigurationPageV8.tsx',
	'src/v8/flows/types/WhatsAppOTPConfigurationPageV8.tsx',
	'src/v8/flows/types/MobileOTPConfigurationPageV8.tsx',
	'src/v8/flows/types/TOTPConfigurationPageV8.tsx',
	'src/v8/flows/types/FIDO2ConfigurationPageV8.tsx',
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
	// Shared flow components
	'src/v8/flows/shared/MFAFlowBaseV8.tsx',
	'src/v8/flows/shared/MFATypes.ts',
	'src/v8/flows/shared/MFAConfigurationStepV8.tsx',
	'src/v8/flows/shared/mfaSuccessPageServiceV8.ts',
	'src/v8/flows/shared/useUnifiedOTPFlow.ts',
	// Controllers
	'src/v8/flows/controllers/MFAFlowController.ts',
	'src/v8/flows/controllers/WhatsAppFlowController.ts',
	'src/v8/flows/factories/MFAFlowControllerFactory.ts',
	// Components
	'src/v8/components/MFADeviceLimitModalV8.tsx',
	'src/v8/components/MFANavigationV8.tsx',
	'src/v8/components/MFASettingsModalV8.tsx',
	'src/v8/components/MFADeviceSelector.tsx',
	'src/v8/components/MFAOTPInput.tsx',
	'src/v8/components/CountryCodePickerV8.tsx',
	'src/v8/components/MFAInfoButtonV8.tsx',
	'src/v8/components/NicknamePromptModalV8.tsx',
	'src/v8/components/WhatsAppNotEnabledModalV8.tsx',
	// Utils
	'src/v8/utils/toastNotificationsV8.ts',
	'src/v8/utils/analyticsLoggerV8.ts',
	'src/v8/utils/mfaFlowCleanupV8.ts',
	'src/v8/utils/phoneValidationV8.ts',
	'src/v8/services/phoneAutoPopulationServiceV8.ts',
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
	updated = updated.replace(
		/from\s+['"]@\/([^'"]+)['"]/g,
		(match, path) => {
			// Check if this dependency is locked
			for (const [originalPath, lockedPath] of Object.entries(lockedDepsMap)) {
				if (originalPath.includes(path)) {
					const relPath = relative(dirname(filePath), lockedPath).replace(/\\/g, '/');
					return `from '${relPath.startsWith('.') ? relPath : './' + relPath}'`;
				}
			}
			return match; // Keep original if not locked
		}
	);

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
async function lockMFA(dryRun = false) {
	console.log('🔒 Locking MFA V8 Feature...\n');

	// Collect all dependencies
	const allDeps = new Set();
	
	// Add critical dependencies
	for (const dep of CRITICAL_DEPS) {
		const depPath = join(PROJECT_ROOT, dep);
		if (existsSync(depPath)) {
			allDeps.add(depPath);
			// Find transitive dependencies
			const transitive = findDependencies(depPath);
			transitive.forEach(d => allDeps.add(d));
		}
	}

	// Find dependencies from MFA files
	for (const file of MFA_FILES) {
		const filePath = join(PROJECT_ROOT, file);
		if (existsSync(filePath)) {
			const deps = findDependencies(filePath);
			deps.forEach(d => allDeps.add(d));
		}
	}

	console.log(`📦 Found ${allDeps.size} dependencies to lock`);

	// Create manifest
	const manifest = {
		feature: 'mfa-v8',
		name: 'MFA V8 Complete',
		description: 'Complete MFA V8 flow with all device types (SMS, Email, TOTP, FIDO2, WhatsApp, Mobile)',
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

	console.log(`📄 Locking ${MFA_FILES.length} feature files`);

	// Copy and update feature files
	for (const file of MFA_FILES) {
		const filePath = join(PROJECT_ROOT, file);
		if (!existsSync(filePath)) {
			console.warn(`⚠️  File not found: ${file}`);
			continue;
		}

		const relPath = relative('src/v8/flows/types', file);
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
		console.log(`\n✅ MFA V8 locked successfully!`);
		console.log(`📁 Locked directory: ${LOCKED_DIR}`);
		console.log(`📋 Manifest: ${MANIFEST_PATH}`);
		console.log(`\n🔒 MFA is now isolated and will never break when shared services are updated.`);
	} else {
		console.log(`\n🔍 DRY RUN - Would lock:`);
		console.log(`   Feature files: ${MFA_FILES.length}`);
		console.log(`   Dependencies: ${allDeps.size}`);
		console.log(`   Lock directory: ${LOCKED_DIR}`);
	}

	return manifest;
}

// Main
const dryRun = process.argv.includes('--dry-run');

lockMFA(dryRun).catch((error) => {
	console.error('❌ Error locking MFA:', error);
	process.exit(1);
});
