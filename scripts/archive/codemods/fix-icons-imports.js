#!/usr/bin/env node

/**
 * Fix all @icons and ../icons imports to use correct relative paths
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function fixIconsImport(filePath) {
	try {
		const content = fs.readFileSync(filePath, 'utf8');
		if (content.includes("from '@icons'") || content.includes("from '../icons'")) {
			// Calculate the correct relative path to icons
			const filePathParts = filePath.split('/');
			const srcIndex = filePathParts.indexOf('src');
			const relativePathParts = filePathParts.slice(srcIndex + 1);
			const depth = relativePathParts.length - 1;
			const correctPath = '../'.repeat(depth) + 'icons';

			let fixedContent = content.replace(/from '@icons'/g, `from '${correctPath}'`);
			fixedContent = fixedContent.replace(/from '\.\.\/icons'/g, `from '${correctPath}'`);

			if (content !== fixedContent) {
				fs.writeFileSync(filePath, fixedContent);
				console.log(`✅ Fixed icons import in: ${filePath} -> ${correctPath}`);
				return true;
			}
		}
	} catch (error) {
		console.log(`❌ Error fixing ${filePath}: ${error.message}`);
	}
	return false;
}

// Find and fix all files with icons imports
const srcDir = path.join(__dirname, 'src');
let fixedCount = 0;

function findAndFixIconsImports(dir) {
	const files = fs.readdirSync(dir);

	for (const file of files) {
		const filePath = path.join(dir, file);
		const stat = fs.statSync(filePath);

		if (stat.isDirectory()) {
			findAndFixIconsImports(filePath);
		} else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
			if (fixIconsImport(filePath)) {
				fixedCount++;
			}
		}
	}
}

findAndFixIconsImports(srcDir);

console.log(`\n🎉 Fixed icons imports in ${fixedCount} files!`);
