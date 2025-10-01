#!/usr/bin/env node

/**
 * Fix styled-components syntax errors across the codebase
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Fixing styled-components syntax errors...\n');

function getAllSourceFiles(dir) {
	const files = [];

	function traverse(currentDir) {
		const items = fs.readdirSync(currentDir);

		for (const item of items) {
			const fullPath = path.join(currentDir, item);
			const stat = fs.statSync(fullPath);

			if (stat.isDirectory()) {
				if (!item.includes('test')) {
					traverse(fullPath);
				}
			} else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
				if (!item.includes('.test.') && !item.includes('.spec.')) {
					files.push(fullPath);
				}
			}
		}
	}

	traverse(dir);
	return files;
}

function fixStyledComponentSyntax(filePath) {
	try {
		let content = fs.readFileSync(filePath, 'utf8');
		const originalContent = content;
		let fixed = false;

		// Pattern 1: CSS rules after a styled component closing backtick
		// Look for: `;\n\n  css-property: value;
		const pattern1 = /(`;\s*\n\s*\n\s*)([a-z-]+\s*:\s*[^;]+;)/g;
		if (pattern1.test(content)) {
			content = content.replace(pattern1, (match, closing, cssRule) => {
				// Create a generic styled component for orphaned CSS
				return closing + `\nconst StyledElement = styled.div\`\n  ${cssRule}`;
			});
			fixed = true;
		}

		// Pattern 2: Multiple CSS rules after closing backtick
		const pattern2 = /(`;\s*\n\s*\n\s*)([a-z-][^`]*?)(\n\s*const\s+)/g;
		content = content.replace(pattern2, (match, closing, cssRules, nextConst) => {
			if (cssRules.includes(':') && !cssRules.includes('const') && !cssRules.includes('function')) {
				fixed = true;
				return closing + `\nconst StyledElement = styled.div\`\n${cssRules}\n\`;\n${nextConst}`;
			}
			return match;
		});

		// Pattern 3: CSS rules at end of file after closing backtick
		const pattern3 = /(`;\s*\n\s*\n\s*)([a-z-][^`]*?)(\s*$)/g;
		content = content.replace(pattern3, (match, closing, cssRules, end) => {
			if (cssRules.includes(':') && !cssRules.includes('const') && !cssRules.includes('function')) {
				fixed = true;
				return closing + `\nconst StyledElement = styled.div\`\n${cssRules}\n\`;\n${end}`;
			}
			return match;
		});

		if (fixed && content !== originalContent) {
			fs.writeFileSync(filePath, content, 'utf8');
			return true;
		}

		return false;
	} catch (error) {
		console.log(`❌ Error processing ${filePath}: ${error.message}`);
		return false;
	}
}

// Get all source files
const srcDir = path.join(__dirname, 'src');
const files = getAllSourceFiles(srcDir);

let fixedCount = 0;

// Process each file
for (const file of files) {
	const relativePath = path.relative(__dirname, file);

	if (fixStyledComponentSyntax(file)) {
		console.log(`✅ Fixed: ${relativePath}`);
		fixedCount++;
	}
}

console.log(`\n📊 Summary: Fixed ${fixedCount} files`);

// Now let's manually fix the specific files we know have issues
const specificFixes = [
	{
		file: 'src/components/GlobalErrorDisplay.tsx',
		fix: () => {
			const filePath = path.join(__dirname, 'src/components/GlobalErrorDisplay.tsx');
			let content = fs.readFileSync(filePath, 'utf8');

			// Fix the orphaned CSS rules
			content = content.replace(
				/(`;\s*\n\s*\n\s*)(font-size:\s*1\.5rem;\s*\n\s*margin-right:\s*0\.5rem;\s*\n\s*`;\s*)/g,
				'$1\nconst ErrorIcon = styled.span`\n  $2'
			);

			fs.writeFileSync(filePath, content, 'utf8');
			return true;
		},
	},
];

// Apply specific fixes
for (const { file, fix } of specificFixes) {
	try {
		if (fix()) {
			console.log(`✅ Applied specific fix: ${file}`);
			fixedCount++;
		}
	} catch (error) {
		console.log(`❌ Failed to apply specific fix to ${file}: ${error.message}`);
	}
}

console.log(`\n🎉 Total fixes applied: ${fixedCount}`);
console.log('🔍 Testing build...');

// Test build
import { spawn } from 'child_process';

const buildProcess = spawn('npm', ['run', 'build'], { stdio: 'inherit' });

buildProcess.on('close', (code) => {
	if (code === 0) {
		console.log('\n✅ Build successful! All syntax errors fixed.');
	} else {
		console.log('\n❌ Build still failing. Manual intervention may be needed.');
	}
});
