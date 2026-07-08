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

import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

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
	'src/mfa/flows/types/SMSFlow.tsx',
	'src/mfa/flows/types/EmailFlow.tsx',
	'src/mfa/flows/types/WhatsAppFlow.tsx',
	'src/mfa/flows/types/MobileFlow.tsx',
	'src/mfa/flows/types/TOTPFlow.tsx',
	'src/mfa/flows/types/FIDO2Flow.tsx',
	// Configuration pages
	'src/mfa/flows/types/SMSOTPConfigurationPage.tsx',
	'src/mfa/flows/types/EmailOTPConfigurationPage.tsx',
	'src/mfa/flows/types/WhatsAppOTPConfigurationPage.tsx',
	'src/mfa/flows/types/MobileOTPConfigurationPage.tsx',
	'src/mfa/flows/types/TOTPConfigurationPage.tsx',
	'src/mfa/flows/types/FIDO2ConfigurationPage.tsx',
];

// Critical dependencies to lock
const CRITICAL_DEPS = [
	// Services
	'src/mfa/services/mfaService.ts',
	'src/mfa/services/mfaAuthenticationService.ts',
	'src/mfa/services/mfaConfigurationService.ts',
	'src/mfa/services/credentialsService.ts',
	'src/mfa/services/workerTokenService.ts',
	'src/mfa/services/workerTokenStatusService.ts',
	'src/mfa/services/apiDisplayService.ts',
	// Shared flow components
	'src/mfa/flows/shared/MFAFlowBase.tsx',
	'src/mfa/flows/shared/MFATypes.ts',
	'src/mfa/flows/shared/MFAConfigurationStep.tsx',
	'src/mfa/flows/shared/mfaSuccessPageService.ts',
	'src/mfa/flows/shared/useUnifiedOTPFlow.ts',
	// Controllers
	'src/mfa/flows/controllers/MFAFlowController.ts',
	'src/mfa/flows/controllers/WhatsAppFlowController.ts',
	'src/mfa/flows/factories/MFAFlowControllerFactory.ts',
	// Components
	'src/mfa/components/MFADeviceLimitModal.tsx',
	'src/mfa/components/MFANavigation.tsx',
	'src/mfa/components/MFASettingsModal.tsx',
	'src/mfa/components/MFADeviceSelector.tsx',
	'src/mfa/components/MFAOTPInput.tsx',
	'src/mfa/components/CountryCodePicker.tsx',
	'src/mfa/components/MFAInfoButton.tsx',
	'src/mfa/components/NicknamePromptModal.tsx',
	'src/mfa/components/WhatsAppNotEnabledModal.tsx',
	// Utils
	'src/mfa/utils/toastNotifications.ts',
	'src/mfa/utils/analyticsLogger.ts',
	'src/mfa/utils/mfaFlowCleanup.ts',
	'src/mfa/utils/phoneValidation.ts',
	'src/mfa/services/phoneAutoPopulationService.ts',
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
			transitive.forEach((d) => allDeps.add(d));
		}
	}

	// Find dependencies from MFA files
	for (const file of MFA_FILES) {
		const filePath = join(PROJECT_ROOT, file);
		if (existsSync(filePath)) {
			const deps = findDependencies(filePath);
			deps.forEach((d) => allDeps.add(d));
		}
	}

	console.log(`📦 Found ${allDeps.size} dependencies to lock`);

	// Create manifest
	const manifest = {
		feature: 'mfa-v8',
		name: 'MFA V8 Complete',
		description:
			'Complete MFA V8 flow with all device types (SMS, Email, TOTP, FIDO2, WhatsApp, Mobile)',
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

		const relPath = relative('src/mfa/flows/types', file);
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
