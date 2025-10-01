#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// Files to fix based on highest error counts
const filesToFix = [
	'src/utils/securityAnalytics.ts',
	'src/utils/analytics.ts',
	'src/utils/userBehaviorTracking.ts',
	'src/utils/credentialManager.ts',
	'src/utils/errorDiagnosis.ts',
	'src/utils/errorRecovery.ts',
	'src/utils/securityAudit.ts',
	'src/utils/accessibility.ts',
	'src/utils/tokenAnalysis.ts',
	'src/utils/persistentCredentials.ts',
];

function fixSyntaxErrors(content) {
	let fixed = content;

	// Fix extra commas in object type definitions
	fixed = fixed.replace(/:\s*{\s*,/g, ': {');
	fixed = fixed.replace(/{\s*,\s*([a-zA-Z])/g, '{\n    $1');

	// Fix missing closing braces in object literals
	fixed = fixed.replace(/{\s*([a-zA-Z][^}]*)\s*$/gm, (match, content) => {
		if (!match.includes('}')) {
			return match + '\n  }';
		}
		return match;
	});

	// Fix missing semicolons after function parameters
	fixed = fixed.replace(/\)\s*=\s*{}\s*$/gm, ') = {}');

	// Fix malformed try-catch blocks
	fixed = fixed.replace(/}\s*catch\s*\(\s*_error\s*\)\s*{/g, '    } catch (_error) {');

	// Fix missing closing parentheses in function calls
	fixed = fixed.replace(/\(\s*([^)]*)\s*$/gm, (match, params) => {
		if (!match.includes(')')) {
			return match + ')';
		}
		return match;
	});

	// Fix object literal syntax errors
	fixed = fixed.replace(/,\s*}/g, '\n  }');
	fixed = fixed.replace(/{\s*,\s*}/g, '{}');

	return fixed;
}

function processFile(filePath) {
	try {
		if (!fs.existsSync(filePath)) {
			console.log(`⚠️  File not found: ${filePath}`);
			return false;
		}

		const content = fs.readFileSync(filePath, 'utf8');
		const fixedContent = fixSyntaxErrors(content);

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

console.log('🔧 Starting utility files syntax error fixes...\n');

let fixedCount = 0;
for (const file of filesToFix) {
	if (processFile(file)) {
		fixedCount++;
	}
}

console.log(`\n✨ Completed! Fixed ${fixedCount} files.`);
