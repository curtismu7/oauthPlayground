#!/usr/bin/env node

/**
 * Phase 4 Cleanup: Remove unused hooks (FINAL PHASE)
 * Risk Level: Medium-High
 * Estimated Savings: ~97 KB across 10 files
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧹 Phase 4 Cleanup: Removing unused hooks (FINAL PHASE)\n');

// Phase 4: Unused hooks (highest risk but potentially highest reward)
const phase4Files = [
	'src/hooks/useAccessibility.ts', // 11.7 KB - Accessibility utilities
	'src/hooks/useAnalytics.ts', // 10.8 KB - Analytics tracking
	'src/hooks/useCSRFProtection.tsx', // 1.4 KB - CSRF protection
	'src/hooks/useErrorDiagnosis.ts', // 11.5 KB - Error diagnosis
	'src/hooks/useFlowAnalysis.ts', // 9.2 KB - Flow analysis
	'src/hooks/useLazyLoading.ts', // 7.7 KB - Lazy loading utilities
	'src/hooks/usePageScroll.ts', // 3.2 KB - Page scroll management
	'src/hooks/useScrollToTop.ts', // 2.5 KB - Scroll to top
	'src/hooks/useServiceWorker.ts', // 8.4 KB - Service worker management
	'src/hooks/useUserBehaviorTracking.ts', // 16.2 KB - User behavior tracking
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
					// Also check for hook usage patterns
					content.includes(baseName) ||
					content.includes(`const ${baseName.replace('use', '').toLowerCase()}`)
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

console.log('📋 Phase 4 files to process:');
phase4Files.forEach((file, index) => {
	console.log(`   ${index + 1}. ${file}`);
});

console.log('\n🔍 Checking for imports and removing files...\n');

for (const file of phase4Files) {
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
console.log('\n🔍 Testing build after Phase 4 cleanup...');

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
	console.log('📊 PHASE 4 CLEANUP SUMMARY (FINAL)');
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

	// Calculate final cumulative savings
	const phase1Savings = 1.62; // KB from Phase 1
	const phase2Savings = 19.35; // KB from Phase 2
	const phase3Savings = 31.56; // KB from Phase 3
	const phase4Savings = totalSizeRemoved / 1024;
	const totalSavings = phase1Savings + phase2Savings + phase3Savings + phase4Savings;
	const totalFilesRemoved = 2 + 5 + 3 + removedCount; // Files from all phases

	if (code === 0) {
		console.log('\n🎉 BUILD SUCCESSFUL! ALL CLEANUP PHASES COMPLETED!');
		console.log('\n📊 FINAL CUMULATIVE CLEANUP RESULTS:');
		console.log('='.repeat(50));
		console.log(`   • Phase 1: ${phase1Savings} KB (2 files) - Type definitions`);
		console.log(`   • Phase 2: ${phase2Savings} KB (5 files) - Utility modules`);
		console.log(`   • Phase 3: ${phase3Savings} KB (3 files) - Components`);
		console.log(`   • Phase 4: ${phase4Savings.toFixed(2)} KB (${removedCount} files) - Hooks`);
		console.log('='.repeat(50));
		console.log(`   🎯 TOTAL: ${totalSavings.toFixed(2)} KB (${totalFilesRemoved} files removed)`);

		// Calculate percentage reduction (assuming original codebase was ~400KB of unused code)
		const percentageReduction = ((totalSavings / 415) * 100).toFixed(1);
		console.log(
			`   📈 Cleanup efficiency: ${percentageReduction}% of identified unused code removed`
		);

		console.log('\n✅ CLEANUP PROJECT COMPLETED SUCCESSFULLY!');
		console.log('🎯 Benefits achieved:');
		console.log('   • Reduced bundle size');
		console.log('   • Cleaner codebase');
		console.log('   • Easier maintenance');
		console.log('   • Better build performance');
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

	console.log('\n🏁 Phase 4 (FINAL) cleanup completed!');
});
