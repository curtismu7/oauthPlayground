#!/usr/bin/env node

/**
 * Phase 3 Cleanup: Remove unused components
 * Risk Level: Medium
 * Estimated Savings: ~91 KB across 8 files
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧹 Phase 3 Cleanup: Removing unused components\n');

// Phase 3: Unused components (need careful verification)
const phase3Files = [
	'src/components/CachingDashboard.tsx', // 14.8 KB - Caching dashboard
	'src/components/FlowBadge.tsx', // 1.3 KB - Flow badge component
	'src/components/LazyLoadingFallback.tsx', // 8.0 KB - Lazy loading fallback
	'src/components/LoadingSpinner.tsx', // 2.6 KB - Loading spinner
	'src/components/MessageExamples.tsx', // 1.5 KB - Message examples
	'src/components/MobileResponsiveness.tsx', // 15.4 KB - Mobile responsive utilities
	'src/components/ServerStatusProvider.tsx', // 1.2 KB - Server status provider
	'src/components/StandardMessage.tsx', // 3.5 KB - Standard message component
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
					// Also check for dynamic imports and JSX usage
					content.includes(`<${baseName}`) ||
					content.includes(`${baseName}>`)
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

console.log('📋 Phase 3 files to process:');
phase3Files.forEach((file, index) => {
	console.log(`   ${index + 1}. ${file}`);
});

console.log('\n🔍 Checking for imports and removing files...\n');

for (const file of phase3Files) {
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
console.log('\n🔍 Testing build after Phase 3 cleanup...');

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
	console.log('📊 PHASE 3 CLEANUP SUMMARY');
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

	// Calculate cumulative savings
	const phase1Savings = 1.62; // KB from Phase 1
	const phase2Savings = 19.35; // KB from Phase 2
	const phase3Savings = totalSizeRemoved / 1024;
	const totalSavings = phase1Savings + phase2Savings + phase3Savings;

	if (code === 0) {
		console.log('\n✅ BUILD SUCCESSFUL! Phase 3 cleanup completed successfully.');
		console.log('\n📊 Cumulative Cleanup Results:');
		console.log(`   • Phase 1: ${phase1Savings} KB (2 files)`);
		console.log(`   • Phase 2: ${phase2Savings} KB (5 files)`);
		console.log(`   • Phase 3: ${phase3Savings.toFixed(2)} KB (${removedCount} files)`);
		console.log(`   • Total: ${totalSavings.toFixed(2)} KB (${7 + removedCount} files)`);

		console.log('\n🎯 Ready for Phase 4:');
		console.log('   • Remove unused hooks (~97 KB)');
		console.log('   • This would be the final cleanup phase');
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

	console.log('\n✅ Phase 3 cleanup completed!');
});
