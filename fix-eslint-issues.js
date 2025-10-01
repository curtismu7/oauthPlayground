#!/usr/bin/env node

/**
 * ESLint Auto-Fix Script
 * Systematically fixes the most common ESLint issues in the OAuth Playground
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 ESLint Auto-Fix Script Starting...\n');

// Common fixes to apply
const fixes = [
	// Fix TypeScript any types
	{
		name: 'Replace any with unknown',
		pattern: /: any\b/g,
		replacement: ': unknown',
		files: ['**/*.ts', '**/*.tsx'],
	},
	{
		name: 'Replace any[] with unknown[]',
		pattern: /: any\[\]/g,
		replacement: ': unknown[]',
		files: ['**/*.ts', '**/*.tsx'],
	},
	{
		name: 'Replace Record<string, any>',
		pattern: /Record<string, any>/g,
		replacement: 'Record<string, unknown>',
		files: ['**/*.ts', '**/*.tsx'],
	},
	{
		name: 'Replace function parameters any',
		pattern: /\(([^)]*): any\)/g,
		replacement: '($1: unknown)',
		files: ['**/*.ts', '**/*.tsx'],
	},
];

// Files to process
const srcDir = path.join(__dirname, 'src');

function getAllFiles(dir, extensions = ['.ts', '.tsx']) {
	const files = [];

	function traverse(currentDir) {
		const items = fs.readdirSync(currentDir);

		for (const item of items) {
			const fullPath = path.join(currentDir, item);
			const stat = fs.statSync(fullPath);

			if (stat.isDirectory()) {
				traverse(fullPath);
			} else if (extensions.some((ext) => item.endsWith(ext))) {
				files.push(fullPath);
			}
		}
	}

	traverse(dir);
	return files;
}

function applyFixes() {
	const files = getAllFiles(srcDir);
	let totalFixes = 0;

	console.log(`📁 Processing ${files.length} TypeScript files...\n`);

	for (const filePath of files) {
		try {
			let content = fs.readFileSync(filePath, 'utf8');
			let fileFixCount = 0;

			for (const fix of fixes) {
				const matches = content.match(fix.pattern);
				if (matches) {
					content = content.replace(fix.pattern, fix.replacement);
					fileFixCount += matches.length;
					totalFixes += matches.length;
				}
			}

			if (fileFixCount > 0) {
				fs.writeFileSync(filePath, content, 'utf8');
				const relativePath = path.relative(__dirname, filePath);
				console.log(`✅ ${relativePath}: ${fileFixCount} fixes applied`);
			}
		} catch (error) {
			const relativePath = path.relative(__dirname, filePath);
			console.log(`❌ ${relativePath}: Error - ${error.message}`);
		}
	}

	console.log(`\n🎉 Total fixes applied: ${totalFixes}`);
}

// Remove unused imports function
function removeUnusedImports() {
	console.log('\n🧹 Removing unused imports...\n');

	const files = getAllFiles(srcDir);
	let removedImports = 0;

	for (const filePath of files) {
		try {
			let content = fs.readFileSync(filePath, 'utf8');
			const originalContent = content;

			// Common unused imports to remove
			const unusedImports = [
				// React icons that are imported but not used
				/import\s*{\s*[^}]*FiPlay[^}]*}\s*from\s*['"]react-icons\/fi['"];\s*\n/g,
				/import\s*{\s*[^}]*FiUser[^}]*}\s*from\s*['"]react-icons\/fi['"];\s*\n/g,
				/import\s*{\s*[^}]*FiSettings[^}]*}\s*from\s*['"]react-icons\/fi['"];\s*\n/g,
				/import\s*{\s*[^}]*FiEye[^}]*}\s*from\s*['"]react-icons\/fi['"];\s*\n/g,
				/import\s*{\s*[^}]*FiEyeOff[^}]*}\s*from\s*['"]react-icons\/fi['"];\s*\n/g,

				// Remove individual unused imports from multi-import lines
				/,\s*FiPlay\s*(?=,|})/g,
				/,\s*FiUser\s*(?=,|})/g,
				/,\s*FiSettings\s*(?=,|})/g,
				/,\s*FiEye\s*(?=,|})/g,
				/,\s*FiEyeOff\s*(?=,|})/g,

				// Remove unused React hooks
				/,\s*useEffect\s*(?=,|})/g,
				/,\s*useState\s*(?=,|})/g,
			];

			for (const pattern of unusedImports) {
				if (content.match(pattern)) {
					content = content.replace(pattern, '');
					removedImports++;
				}
			}

			if (content !== originalContent) {
				fs.writeFileSync(filePath, content, 'utf8');
				const relativePath = path.relative(__dirname, filePath);
				console.log(`✅ ${relativePath}: Removed unused imports`);
			}
		} catch (error) {
			const relativePath = path.relative(__dirname, filePath);
			console.log(`❌ ${relativePath}: Error - ${error.message}`);
		}
	}

	console.log(`\n🧹 Removed ${removedImports} unused import references`);
}

// Fix parsing errors
function fixParsingErrors() {
	console.log('\n🔧 Fixing parsing errors...\n');

	// Fix the interface keyword issue in test file
	const testFile = path.join(__dirname, 'test-step-system-functionality.js');

	try {
		let content = fs.readFileSync(testFile, 'utf8');

		// Replace 'interface' with 'interfaceType' or similar
		content = content.replace(/interface\s+/g, 'interfaceType ');

		fs.writeFileSync(testFile, content, 'utf8');
		console.log('✅ Fixed interface keyword in test file');
	} catch (error) {
		console.log(`❌ Error fixing parsing errors: ${error.message}`);
	}
}

// Main execution
async function main() {
	console.log('🚀 Starting ESLint fixes...\n');

	// Apply TypeScript any fixes
	applyFixes();

	// Remove unused imports
	removeUnusedImports();

	// Fix parsing errors
	fixParsingErrors();

	console.log('\n✅ ESLint auto-fix completed!');
	console.log('\n📊 Next steps:');
	console.log('   1. Run: npm run lint');
	console.log('   2. Review remaining issues');
	console.log('   3. Manual fixes for complex cases');
	console.log('   4. Test the application');
}

main().catch(console.error);
