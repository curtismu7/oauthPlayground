#!/usr/bin/env node

/**
 * Phase 2: Async Pattern Audit Script
 *
 * This script audits the codebase for high-risk async patterns that could
 * lead to syntax errors like the Configuration.tsx issue.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// High-risk files identified in the plan
const HIGH_RISK_FILES = [
	'src/pages/Dashboard.backup.tsx',
	'src/pages/AuthorizationCallback.tsx',
	'src/pages/OrganizationLicensing_V2.tsx',
	'src/pages/PingOneAuditActivities.tsx',
	'src/pages/TokenManagement.tsx',
	'src/pages/TokenInspector.tsx',
	'src/pages/Callback.tsx',
	'src/pages/PingOneIdentityMetrics.tsx',
	'src/pages/PingOneAuthentication.tsx',
	'src/pages/HybridCallback.tsx',
	'src/pages/Configuration_original.tsx',
	'src/pages/PingOneAuthenticationResult.tsx',
];

// Patterns to detect
const PATTERNS = {
	asyncOnClick: /onClick\s*=\s*\{?\s*async\s*\(/g,
	asyncOnChange: /onChange\s*=\s*\{?\s*async\s*\(/g,
	asyncOnSubmit: /onSubmit\s*=\s*\{?\s*async\s*\(/g,
	asyncOnContinue: /onContinue\s*=\s*\{?\s*async\s*\(/g,
	asyncInUseEffect: /useEffect\s*\(\s*\(\s*\)\s*=>\s*\{[^}]*async/g,
	voidAsyncCall: /void\s+\w+\s*\(/g,
};

function auditFile(filePath) {
	try {
		const content = fs.readFileSync(filePath, 'utf8');
		const lines = content.split('\n');
		const issues = [];

		// Check for async onClick handlers
		let match;
		Object.entries(PATTERNS).forEach(([patternName, pattern]) => {
			pattern.lastIndex = 0; // Reset regex
			while ((match = pattern.exec(content)) !== null) {
				const lineNumber = content.substring(0, match.index).split('\n').length;
				const line = lines[lineNumber - 1];

				issues.push({
					pattern: patternName,
					line: lineNumber,
					code: line.trim(),
					position: match.index,
				});
			}
		});

		return {
			file: filePath,
			issues,
			hasIssues: issues.length > 0,
		};
	} catch (error) {
		return {
			file: filePath,
			error: error.message,
			hasIssues: false,
		};
	}
}

function generateReport(results) {
	console.log('\n='.repeat(80));
	console.log('PHASE 2: ASYNC PATTERN AUDIT REPORT');
	console.log('='.repeat(80));
	console.log(`\nAudited ${results.length} high-risk files\n`);

	let totalIssues = 0;
	const issuesByPattern = {};

	results.forEach((result) => {
		if (result.error) {
			console.log(`\n❌ ${result.file}`);
			console.log(`   Error: ${result.error}`);
			return;
		}

		if (result.hasIssues) {
			console.log(`\n⚠️  ${result.file}`);
			console.log(`   Found ${result.issues.length} async pattern(s):\n`);

			result.issues.forEach((issue) => {
				console.log(`   Line ${issue.line}: ${issue.pattern}`);
				console.log(`   ${issue.code.substring(0, 80)}${issue.code.length > 80 ? '...' : ''}`);
				console.log('');

				issuesByPattern[issue.pattern] = (issuesByPattern[issue.pattern] || 0) + 1;
				totalIssues++;
			});
		} else {
			console.log(`\n✅ ${result.file}`);
			console.log('   No async patterns detected');
		}
	});

	console.log(`\n${'='.repeat(80)}`);
	console.log('SUMMARY');
	console.log('='.repeat(80));
	console.log(`\nTotal async patterns found: ${totalIssues}`);
	console.log('\nBreakdown by pattern:');
	Object.entries(issuesByPattern).forEach(([pattern, count]) => {
		console.log(`  ${pattern}: ${count}`);
	});

	console.log(`\n${'='.repeat(80)}`);
	console.log('RECOMMENDATIONS');
	console.log('='.repeat(80));
	console.log(`
1. Review each async handler for proper error handling
2. Ensure all async functions have try-catch blocks
3. Verify all opening braces have matching closing braces
4. Consider extracting complex async logic into separate functions
5. Add unit tests for async operations

Next: Run 'npm run lint:eslint' to check for floating promises
`);
}

// Main execution
console.log('Starting Phase 2 async pattern audit...\n');

const results = HIGH_RISK_FILES.map((file) => {
	const fullPath = path.join(process.cwd(), file);
	return auditFile(fullPath);
});

generateReport(results);

// Exit with error code if issues found
const hasAnyIssues = results.some((r) => r.hasIssues);
process.exit(hasAnyIssues ? 1 : 0);
