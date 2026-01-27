#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

// Regular expression to match react-icons usage
const iconRegex = /<Fi([A-Z][a-zA-Z]+)/g;

// Function to extract all unique icons used in a file
function extractUsedIcons(filePath) {
	const content = fs.readFileSync(filePath, 'utf8');
	const icons = new Set();

	let match = iconRegex.exec(content);
	while (match !== null) {
		icons.add(match[1]);
		match = iconRegex.exec(content);
	}

	return Array.from(icons);
}

// Function to extract currently imported icons
function extractImportedIcons(filePath) {
	const content = fs.readFileSync(filePath, 'utf8');
	const imports = [];

	// Match import statement from react-icons/fi
	const importMatch = content.match(/import\s*\{([^}]+)\}\s*from\s*['"]react-icons\/fi['"]/);

	if (importMatch) {
		const importedItems = importMatch[1]
			.split(',')
			.map((item) => item.trim())
			.filter((item) => item.startsWith('Fi'))
			.map((item) => item.substring(2)); // Remove 'Fi' prefix

		imports.push(...importedItems);
	}

	return imports;
}

// Function to update imports in a file
function updateImports(filePath, usedIcons, importedIcons) {
	const content = fs.readFileSync(filePath, 'utf8');

	// Find missing icons
	const missingIcons = usedIcons.filter((icon) => !importedIcons.includes(icon));

	if (missingIcons.length === 0) {
		console.log(`✅ All icons are already imported in ${path.basename(filePath)}`);
		return false;
	}

	console.log(`🔍 Found missing icons in ${path.basename(filePath)}: ${missingIcons.join(', ')}`);

	// Find the import statement
	const importRegex = /import\s*\{([^}]+)\}\s*from\s*['"]react-icons\/fi['"]/;
	const match = content.match(importRegex);

	if (!match) {
		console.log(`❌ Could not find react-icons/fi import in ${path.basename(filePath)}`);
		return false;
	}

	// Parse existing imports
	const existingImports = match[1]
		.split(',')
		.map((item) => item.trim())
		.filter((item) => item.length > 0);

	// Add missing icons (sorted alphabetically)
	const newImports = missingIcons.map((icon) => `Fi${icon}`);
	const allImports = [...existingImports, ...newImports].sort();

	// Replace the import statement
	const newImport = `import {\n\t${allImports.join(',\n\t')}\n} from 'react-icons/fi'`;
	const updatedContent = content.replace(importRegex, newImport);

	// Write back to file
	fs.writeFileSync(filePath, updatedContent, 'utf8');
	console.log(`✅ Updated imports in ${path.basename(filePath)}`);
	return true;
}

// Function to scan all TSX/TS files in a directory
function scanDirectory(dirPath, recursive = true) {
	let files = [];

	const items = fs.readdirSync(dirPath);

	for (const item of items) {
		const fullPath = path.join(dirPath, item);
		const stat = fs.statSync(fullPath);

		if (stat.isDirectory() && recursive && !item.startsWith('.') && item !== 'node_modules') {
			files = files.concat(scanDirectory(fullPath, recursive));
		} else if (stat.isFile() && (item.endsWith('.tsx') || item.endsWith('.ts'))) {
			files.push(fullPath);
		}
	}

	return files;
}

// Main function
function main() {
	const args = process.argv.slice(2);
	const targetPath = args[0] || './src';

	console.log(`🔍 Scanning for missing icon imports in: ${targetPath}`);
	console.log('');

	let totalFiles = 0;
	let updatedFiles = 0;

	const files = scanDirectory(path.resolve(targetPath));

	for (const file of files) {
		try {
			const usedIcons = extractUsedIcons(file);

			if (usedIcons.length > 0) {
				const importedIcons = extractImportedIcons(file);
				const wasUpdated = updateImports(file, usedIcons, importedIcons);

				totalFiles++;
				if (wasUpdated) {
					updatedFiles++;
				}
			}
		} catch (error) {
			console.log(`⚠️  Error processing ${path.basename(file)}: ${error.message}`);
		}
	}

	console.log('');
	console.log(`📊 Summary:`);
	console.log(`   Files with icons: ${totalFiles}`);
	console.log(`   Files updated: ${updatedFiles}`);

	if (updatedFiles > 0) {
		console.log('');
		console.log('✨ All missing icon imports have been added!');
		console.log('💡 Run this script before committing to ensure all icons are imported.');
	}
}

// Run the script
main();

export { extractUsedIcons, extractImportedIcons, updateImports, scanDirectory };
