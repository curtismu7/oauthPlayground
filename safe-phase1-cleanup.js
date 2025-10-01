#!/usr/bin/env node

/**
 * Safe Phase 1 Cleanup: Only remove files that are definitely not imported
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧹 Safe Phase 1 Cleanup: Removing only definitely unused files\n');

// Check if a file is imported anywhere
function isFileImported(filePath) {
	const srcDir = path.join(__dirname, 'src');
	const files = getAllSourceFiles(srcDir);

	// Convert file path to possible import patterns
	const relativePath = path.relative(path.join(__dirname, 'src'), filePath);
	const importPatterns = [
		relativePath.replace(/\.(ts|tsx)$/, ''),
		`./${relativePath.replace(/\.(ts|tsx)$/, '')}`,
		`../${relativePath.replace(/\.(ts|tsx)$/, '')}`,
		`../../${relativePath.replace(/\.(ts|tsx)$/, '')}`,
		`../../../${relativePath.replace(/\.(ts|tsx)$/, '')}`,
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
					content.includes(`import("${pattern}")`)
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
				if (!item.includes('test')) {
					// Skip test directories
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

// Only the safest files - type definitions that are definitely not used
const candidateFiles = [
	'src/types/flowTypes.ts',
	'src/types/oauthErrors.ts',
	'src/types/oauthFlows.ts',
	'src/types/storage.ts',
	'src/types/token-inspector.ts',
	'src/types/url.ts',
	'src/vite-env.d.ts',
];

let removedCount = 0;
let totalSizeRemoved = 0;
let skippedCount = 0;

console.log('🔍 Checking files for imports...\n');

for (const file of candidateFiles) {
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
		}
	}
}

// Clean up empty directories
const dirsToCheck = ['src/types'];

for (const dir of dirsToCheck) {
	const fullDirPath = path.join(__dirname, dir);

	try {
		if (fs.existsSync(fullDirPath)) {
			const items = fs.readdirSync(fullDirPath);
			if (items.length === 0) {
				fs.rmdirSync(fullDirPath);
				console.log(`🗂️  Removed empty directory: ${dir}`);
			}
		}
	} catch (error) {
		console.log(`⚠️  Could not remove directory ${dir}: ${error.message}`);
	}
}

console.log(`\n${'='.repeat(50)}`);
console.log('📊 SAFE PHASE 1 CLEANUP SUMMARY');
console.log('='.repeat(50));
console.log(`✅ Files successfully removed: ${removedCount}`);
console.log(`⚠️  Files skipped (imported): ${skippedCount}`);
console.log(`💾 Total size freed: ${(totalSizeRemoved / 1024).toFixed(2)} KB`);

console.log('\n🔍 Next steps:');
console.log('1. ✅ Test that the app still builds: npm run build');
console.log('2. ✅ Test that the app still runs: npm run dev');
console.log('3. ✅ If all good, we can proceed with more cleanup');

console.log('\n✅ Safe Phase 1 cleanup completed!');
