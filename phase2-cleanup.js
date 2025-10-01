#!/usr/bin/env node

/**
 * Phase 2 Cleanup: Remove unused utility modules
 * Risk Level: Low-Medium
 * Estimated Savings: ~108 KB across 15 files
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧹 Phase 2 Cleanup: Removing unused utility modules\n');

// Phase 2: Unused utility modules (verified safe to remove)
const phase2Files = [
	// Simple utility modules with no complex dependencies
	'src/utils/activityTracker.ts', // 2.1 KB - Activity logging
	'src/utils/callbackUrls.ts', // 3.8 KB - URL generation utilities
	'src/utils/clientAuthentication.ts', // 6.3 KB - Auth method utilities
	'src/utils/clientLogger.ts', // 0.9 KB - Simple logging
	'src/utils/clipboard.ts', // 1.4 KB - Copy to clipboard utilities
	'src/utils/crypto.ts', // 4.2 KB - Cryptographic utilities
	'src/utils/flowConfiguration.ts', // 3.8 KB - Flow config utilities
	'src/utils/jwt.ts', // 9.2 KB - JWT parsing/validation
	'src/utils/jwtGenerator.ts', // 8.7 KB - JWT generation
	'src/utils/logger.ts', // 7.6 KB - Logging utilities
	'src/utils/scrollManager.ts', // 2.8 KB - Scroll management
	'src/utils/secureJson.ts', // 3.7 KB - Safe JSON parsing
	'src/utils/tokenHistory.ts', // 5.6 KB - Token history tracking
	'src/utils/tokenSourceTracker.ts', // 2.8 KB - Token source tracking
	'src/services/config.ts', // 5.1 KB - Configuration service
];

// Check if a file is imported anywhere before removing
function isFileImported(filePath) {
	const srcDir = path.join(__dirname, 'src');
	const files = getAllSourceFiles(srcDir);

	// Convert file path to possible import patterns
	const relativePath = path.relative(path.join(__dirname, 'src'), filePath);
	const baseName = path.basename(relativePath, path.extname(relativePath));

	const importPatterns = [
		relativePath.replace(/\.(ts|tsx)$/, ''),
		`./${relativePath.replace(/\.(ts|tsx)$/, '')}`,
		`../${relativePath.replace(/\.(ts|tsx)$/, '')}`,
		`../../${relativePath.replace(/\.(ts|tsx)$/, '')}`,
		`../../../${relativePath.replace(/\.(ts|tsx)$/, '')}`,
		baseName,
	];

	for (const file of files) {
		if (file === filePath) continue; // Skip self

		try {
			const content = fs.readFileSync(file, 'utf8');

			// Check for any import of this file
			for (const pattern of importPatterns) {
				if (
					content.includes(`from '${pattern}'`) ||
					content.includes(`from "${pattern}"`) ||
					content.includes(`import('${pattern}')`) ||
					content.includes(`import("${pattern}")`) ||
					content.includes(`'${pattern}'`) ||
					content.includes(`"${pattern}"`)
				) {
					return true;
				}
			}
		} catch {
			// Skip files that can't be read
		}
	}

	return false;
}

function getAllSourceFiles(dir) {
	const files = [];

	function traverse(currentDir) {
		const items = fs.readdirSync(currentDir);

		for (const item of items) {
			const fullPath = path.join(currentDir, item);
			const stat = fs.statSync(fullPath);

			if (stat.isDirectory()) {
				if (!item.includes('test') && !item.includes('node_modules')) {
					traverse(fullPath);
				}
			} else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
				if (!item.includes('.test.') && !item.includes('.spec.')) {
					files.push(fullPath);
				}
			}
		}
	}

	traverse(dir);
	return files;
}

let removedCount = 0;
let totalSizeRemoved = 0;
let skippedCount = 0;
const errors = [];

console.log('📋 Phase 2 files to process:');
phase2Files.forEach((file, index) => {
	console.log(`   ${index + 1}. ${file}`);
});

console.log('\n🔍 Checking for imports and removing files...\n');

for (const file of phase2Files) {
	const fullPath = path.join(__dirname, file);

	if (!fs.existsSync(fullPath)) {
		console.log(`⚠️  File not found: ${file}`);
		continue;
	}

	console.log(`🔍 Checking: ${file}`);

	if (isFileImported(fullPath)) {
		console.log(`   ⚠️  SKIPPED - File is imported somewhere`);
		skippedCount++;
	} else {
		try {
			const stats = fs.statSync(fullPath);
			const sizeKB = (stats.size / 1024).toFixed(1);

			fs.unlinkSync(fullPath);

			console.log(`   ✅ REMOVED - No imports found (${sizeKB} KB)`);
			removedCount++;
			totalSizeRemoved += stats.size;
		} catch (error) {
			console.log(`   ❌ ERROR - ${error.message}`);
			errors.push({ file, error: error.message });
		}
	}
}

// Test build after removal
console.log('\n🔍 Testing build after Phase 2 cleanup...');

import { spawn } from 'node:child_process';

const buildProcess = spawn('npm', ['run', 'build'], { stdio: 'pipe' });

let buildOutput = '';

buildProcess.stdout.on('data', (data) => {
	buildOutput += data.toString();
});

buildProcess.stderr.on('data', (data) => {
	buildOutput += data.toString();
});

buildProcess.on('close', (code) => {
	console.log(`\n${'='.repeat(60)}`);
	console.log('📊 PHASE 2 CLEANUP SUMMARY');
	console.log('='.repeat(60));
	console.log(`✅ Files successfully removed: ${removedCount}`);
	console.log(`⚠️  Files skipped (imported): ${skippedCount}`);
	console.log(`💾 Total size freed: ${(totalSizeRemoved / 1024).toFixed(2)} KB`);
	console.log(`❌ Errors encountered: ${errors.length}`);

	if (errors.length > 0) {
		console.log('\n❌ Errors:');
		errors.forEach(({ file, error }) => {
			console.log(`   • ${file}: ${error}`);
		});
	}

	if (code === 0) {
		console.log('\n✅ BUILD SUCCESSFUL! Phase 2 cleanup completed successfully.');
		console.log('\n🎯 Ready for Phase 3:');
		console.log('   • Remove unused components (~91 KB)');
		console.log(
			'   • Estimated total savings so far: ~' +
				((totalSizeRemoved + 1620) / 1024).toFixed(2) +
				' KB'
		);
	} else {
		console.log('\n❌ BUILD FAILED! Some removed files may have been needed.');
		console.log('🔄 To restore if needed:');
		console.log(`   node backup-2025-09-18T15-21-29/restore.js`);

		// Show build error
		const errorMatch = buildOutput.match(/ERROR: (.+)/);
		if (errorMatch) {
			console.log(`\n🎯 Build error: ${errorMatch[1]}`);
		}
	}

	console.log('\n✅ Phase 2 cleanup completed!');
});
