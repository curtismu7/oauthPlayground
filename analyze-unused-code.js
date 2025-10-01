#!/usr/bin/env node

/**
 * Comprehensive analysis of unused code, variables, and files
 * Excludes test files as requested
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Analyzing codebase for unused code, variables, and files...\n');

// Track all imports and exports across the codebase
const importMap = new Map(); // file -> Set of imported items
const exportMap = new Map(); // file -> Set of exported items
const _usageMap = new Map(); // item -> Set of files that use it
const fileMap = new Map(); // file -> file content

function getAllSourceFiles(dir, excludeTests = true) {
	const files = [];

	function traverse(currentDir) {
		const items = fs.readdirSync(currentDir);

		for (const item of items) {
			const fullPath = path.join(currentDir, item);
			const stat = fs.statSync(fullPath);

			if (stat.isDirectory()) {
				// Skip test directories if excludeTests is true
				if (excludeTests && (item === 'tests' || item === '__tests__' || item.includes('test'))) {
					continue;
				}
				traverse(fullPath);
			} else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
				// Skip test files
				if (excludeTests && (item.includes('.test.') || item.includes('.spec.'))) {
					continue;
				}
				files.push(fullPath);
			}
		}
	}

	traverse(dir);
	return files;
}

function analyzeFile(filePath) {
	try {
		const content = fs.readFileSync(filePath, 'utf8');
		const relativePath = path.relative(__dirname, filePath);

		fileMap.set(relativePath, content);

		// Find imports
		const imports = new Set();
		const importRegex = /import\s+(?:\{([^}]+)\}|(\w+)|\*\s+as\s+(\w+))\s+from\s+['"]([^'"]+)['"]/g;
		let match;

		while ((match = importRegex.exec(content)) !== null) {
			if (match[1]) {
				// Named imports: import { a, b, c } from 'module'
				const namedImports = match[1].split(',').map((s) => s.trim().split(' as ')[0]);
				namedImports.forEach((imp) => imports.add(imp));
			} else if (match[2]) {
				// Default import: import Something from 'module'
				imports.add(match[2]);
			} else if (match[3]) {
				// Namespace import: import * as Something from 'module'
				imports.add(match[3]);
			}
		}

		importMap.set(relativePath, imports);

		// Find exports
		const exports = new Set();

		// Export declarations
		const exportRegex =
			/export\s+(?:(?:const|let|var|function|class|interface|type|enum)\s+(\w+)|default\s+(?:(?:const|let|var|function|class)\s+)?(\w+)|\{([^}]+)\})/g;

		while ((match = exportRegex.exec(content)) !== null) {
			if (match[1]) {
				exports.add(match[1]);
			} else if (match[2]) {
				exports.add('default');
			} else if (match[3]) {
				const namedExports = match[3].split(',').map((s) => s.trim().split(' as ')[0]);
				namedExports.forEach((exp) => exports.add(exp));
			}
		}

		exportMap.set(relativePath, exports);

		return { imports, exports, content };
	} catch (error) {
		console.log(`❌ Error analyzing ${filePath}: ${error.message}`);
		return { imports: new Set(), exports: new Set(), content: '' };
	}
}

function findUnusedVariables(filePath, content) {
	const unusedVars = [];

	// Find variable declarations
	const varRegex = /(?:const|let|var)\s+(\w+)\s*=/g;
	let match;

	while ((match = varRegex.exec(content)) !== null) {
		const varName = match[1];

		// Check if variable is used elsewhere in the file
		const usageRegex = new RegExp(`\\b${varName}\\b`, 'g');
		const matches = content.match(usageRegex) || [];

		// If only found once (the declaration), it's unused
		if (matches.length === 1) {
			unusedVars.push(varName);
		}
	}

	// Find function declarations
	const funcRegex =
		/(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:\([^)]*\)\s*=>|\([^)]*\)\s*=>\s*\{|function))/g;

	while ((match = funcRegex.exec(content)) !== null) {
		const funcName = match[1] || match[2];
		if (funcName) {
			const usageRegex = new RegExp(`\\b${funcName}\\b`, 'g');
			const matches = content.match(usageRegex) || [];

			if (matches.length === 1) {
				unusedVars.push(funcName);
			}
		}
	}

	return unusedVars;
}

function analyzeUnusedFiles() {
	console.log('📁 Analyzing potentially unused files...\n');

	const srcDir = path.join(__dirname, 'src');
	const files = getAllSourceFiles(srcDir);
	const unusedFiles = [];

	// Build import graph
	const importGraph = new Map();

	for (const file of files) {
		const relativePath = path.relative(__dirname, file);
		const content = fs.readFileSync(file, 'utf8');

		// Find all import statements
		const importRegex = /import\s+[^'"]*['"]([^'"]+)['"]/g;
		let match;

		while ((match = importRegex.exec(content)) !== null) {
			const importPath = match[1];

			// Resolve relative imports
			if (importPath.startsWith('.')) {
				const resolvedPath = path.resolve(path.dirname(file), importPath);
				const normalizedPath = path.relative(__dirname, resolvedPath);

				if (!importGraph.has(normalizedPath)) {
					importGraph.set(normalizedPath, new Set());
				}
				importGraph.get(normalizedPath).add(relativePath);
			}
		}
	}

	// Find files that are never imported
	for (const file of files) {
		const relativePath = path.relative(__dirname, file);

		// Skip entry points
		if (relativePath.includes('main.tsx') || relativePath.includes('App.tsx')) {
			continue;
		}

		// Check if file is imported anywhere
		let isImported = false;
		for (const [, importers] of importGraph) {
			if (importers.has(relativePath)) {
				isImported = true;
				break;
			}
		}

		if (!isImported) {
			unusedFiles.push(relativePath);
		}
	}

	return unusedFiles;
}

function analyzeUnusedExports() {
	console.log('📤 Analyzing unused exports...\n');

	const srcDir = path.join(__dirname, 'src');
	const files = getAllSourceFiles(srcDir);
	const unusedExports = new Map();

	// First pass: collect all exports
	const allExports = new Map(); // file -> Set of exports

	for (const file of files) {
		const { exports } = analyzeFile(file);
		const relativePath = path.relative(__dirname, file);
		allExports.set(relativePath, exports);
	}

	// Second pass: check usage
	for (const [filePath, exports] of allExports) {
		const unused = new Set();

		for (const exportName of exports) {
			let isUsed = false;

			// Check if this export is imported anywhere
			for (const otherFile of files) {
				if (otherFile === path.join(__dirname, filePath)) continue;

				const content = fs.readFileSync(otherFile, 'utf8');

				// Check for named imports
				const namedImportRegex = new RegExp(`import\\s*\\{[^}]*\\b${exportName}\\b[^}]*\\}`, 'g');
				if (namedImportRegex.test(content)) {
					isUsed = true;
					break;
				}

				// Check for default imports (if exportName is 'default')
				if (exportName === 'default') {
					const defaultImportRegex = /import\s+\w+\s+from/g;
					if (defaultImportRegex.test(content)) {
						isUsed = true;
						break;
					}
				}
			}

			if (!isUsed) {
				unused.add(exportName);
			}
		}

		if (unused.size > 0) {
			unusedExports.set(filePath, unused);
		}
	}

	return unusedExports;
}

function analyzeUnusedVariables() {
	console.log('🔍 Analyzing unused variables...\n');

	const srcDir = path.join(__dirname, 'src');
	const files = getAllSourceFiles(srcDir);
	const unusedVariables = new Map();

	for (const file of files) {
		const relativePath = path.relative(__dirname, file);
		const content = fs.readFileSync(file, 'utf8');

		const unused = findUnusedVariables(relativePath, content);

		if (unused.length > 0) {
			unusedVariables.set(relativePath, unused);
		}
	}

	return unusedVariables;
}

function findDuplicateFiles() {
	console.log('🔄 Analyzing duplicate files...\n');

	const srcDir = path.join(__dirname, 'src');
	const files = getAllSourceFiles(srcDir, false); // Include all files for duplicate check
	const duplicates = new Map();
	const contentHashes = new Map();

	for (const file of files) {
		try {
			const content = fs.readFileSync(file, 'utf8');
			const relativePath = path.relative(__dirname, file);

			// Simple content-based duplicate detection
			const normalizedContent = content.replace(/\s+/g, ' ').trim();

			if (contentHashes.has(normalizedContent)) {
				const existing = contentHashes.get(normalizedContent);
				if (!duplicates.has(existing)) {
					duplicates.set(existing, []);
				}
				duplicates.get(existing).push(relativePath);
			} else {
				contentHashes.set(normalizedContent, relativePath);
			}
		} catch (error) {
			// Skip files that can't be read
		}
	}

	return duplicates;
}

// Main analysis
async function main() {
	console.log('🚀 Starting comprehensive unused code analysis...\n');

	// 1. Analyze unused files
	const unusedFiles = analyzeUnusedFiles();

	// 2. Analyze unused exports
	const unusedExports = analyzeUnusedExports();

	// 3. Analyze unused variables
	const unusedVariables = analyzeUnusedVariables();

	// 4. Find duplicate files
	const duplicateFiles = findDuplicateFiles();

	// Generate report
	console.log('📊 UNUSED CODE ANALYSIS REPORT\n');
	console.log('='.repeat(50));

	// Unused Files Report
	console.log('\n🗂️  POTENTIALLY UNUSED FILES:');
	console.log('-'.repeat(30));
	if (unusedFiles.length === 0) {
		console.log('✅ No obviously unused files found');
	} else {
		unusedFiles.forEach((file) => {
			console.log(`❌ ${file}`);
		});
	}

	// Unused Exports Report
	console.log('\n📤 UNUSED EXPORTS:');
	console.log('-'.repeat(30));
	if (unusedExports.size === 0) {
		console.log('✅ No unused exports found');
	} else {
		for (const [file, exports] of unusedExports) {
			console.log(`📁 ${file}:`);
			exports.forEach((exp) => {
				console.log(`   ❌ ${exp}`);
			});
		}
	}

	// Unused Variables Report
	console.log('\n🔍 FILES WITH UNUSED VARIABLES:');
	console.log('-'.repeat(30));
	if (unusedVariables.size === 0) {
		console.log('✅ No unused variables found');
	} else {
		let totalUnused = 0;
		for (const [file, variables] of unusedVariables) {
			if (variables.length > 0) {
				console.log(`📁 ${file} (${variables.length} unused):`);
				variables.slice(0, 5).forEach((variable) => {
					console.log(`   ❌ ${variable}`);
				});
				if (variables.length > 5) {
					console.log(`   ... and ${variables.length - 5} more`);
				}
				totalUnused += variables.length;
			}
		}
		console.log(`\n📊 Total unused variables: ${totalUnused}`);
	}

	// Duplicate Files Report
	console.log('\n🔄 DUPLICATE FILES:');
	console.log('-'.repeat(30));
	if (duplicateFiles.size === 0) {
		console.log('✅ No duplicate files found');
	} else {
		for (const [original, duplicates] of duplicateFiles) {
			console.log(`📁 ${original}:`);
			duplicates.forEach((dup) => {
				console.log(`   🔄 ${dup}`);
			});
		}
	}

	// Summary
	console.log('\n📈 SUMMARY:');
	console.log('-'.repeat(30));
	console.log(`🗂️  Potentially unused files: ${unusedFiles.length}`);
	console.log(`📤 Files with unused exports: ${unusedExports.size}`);
	console.log(`🔍 Files with unused variables: ${unusedVariables.size}`);
	console.log(`🔄 Sets of duplicate files: ${duplicateFiles.size}`);

	console.log('\n✅ Analysis complete!');
}

main().catch(console.error);
