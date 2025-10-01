#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// Services files to fix based on highest error counts
const filesToFix = [
	'src/services/tokenManagementService.ts',
	'src/services/jwtAuthService.ts',
	'src/services/jwksService.ts',
	'src/services/parService.ts',
	'src/services/deviceFlowService.ts',
	'src/services/tokenRefreshService.ts',
];

function fixServicesSyntaxErrors(content) {
	let fixed = content;

	// Fix missing closing braces in logger calls
	fixed = fixed.replace(
		/logger\.(info|success|error|warn)\([^}]*{\s*([^}]*)\s*$/gm,
		(match, level, params) => {
			if (!match.includes('});')) {
				return match + '\n    });';
			}
			return match;
		}
	);

	// Fix incomplete object literals in logger calls
	fixed = fixed.replace(
		/logger\.(info|success|error|warn)\([^}]*{\s*([^}]*)\s*\n\s*try\s*{/gm,
		(match, level, params) => {
			const beforeTry = match.replace(/\n\s*try\s*{/, '');
			return beforeTry + '\n    });\n\n    try {';
		}
	);

	// Fix missing closing parentheses in function calls
	fixed = fixed.replace(/\(\s*([^)]*)\s*\n\s*try\s*{/gm, (match, params) => {
		return match.replace(/\n\s*try\s*{/, ');\n\n    try {');
	});

	// Fix malformed object properties
	fixed = fixed.replace(
		/{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*([^,}]*)\s*\n\s*try/gm,
		(match, key, value) => {
			return `{\n      ${key}: ${value.trim()}\n    });\n\n    try`;
		}
	);

	// Fix incomplete method calls
	fixed = fixed.replace(/\.\w+\([^)]*\s*\n\s*try\s*{/gm, (match) => {
		const beforeTry = match.replace(/\n\s*try\s*{/, '');
		if (!beforeTry.includes(');')) {
			return beforeTry + ');\n\n    try {';
		}
		return match;
	});

	return fixed;
}

function processFile(filePath) {
	try {
		if (!fs.existsSync(filePath)) {
			console.log(`⚠️  File not found: ${filePath}`);
			return false;
		}

		const content = fs.readFileSync(filePath, 'utf8');
		const fixedContent = fixServicesSyntaxErrors(content);

		if (content !== fixedContent) {
			fs.writeFileSync(filePath, fixedContent);
			console.log(`✅ Fixed syntax errors in: ${filePath}`);
			return true;
		} else {
			console.log(`ℹ️  No changes needed in: ${filePath}`);
			return false;
		}
	} catch (error) {
		console.error(`❌ Error processing ${filePath}:`, error.message);
		return false;
	}
}

console.log('🔧 Starting services files syntax error fixes...\n');

let fixedCount = 0;
for (const file of filesToFix) {
	if (processFile(file)) {
		fixedCount++;
	}
}

console.log(`\n✨ Completed! Fixed ${fixedCount} files.`);
