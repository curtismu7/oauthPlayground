#!/usr/bin/env node

/**
 * Test script to check all sidebar menu routes for errors and fix @icons imports
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the sidebar menu config
const menuConfigPath = path.join(__dirname, 'src/config/sidebarMenuConfig.ts');
const menuConfigContent = fs.readFileSync(menuConfigPath, 'utf8');

// Extract all routes from the menu config
const routeRegex = /\['(\/[^']+)'/g;
const routes = [];
let match;

while ((match = routeRegex.exec(menuConfigContent)) !== null) {
	routes.push(match[1]);
}

console.log(`Found ${routes.length} routes in sidebar menu:`);
routes.forEach((route, index) => {
	console.log(`${index + 1}. ${route}`);
});

// Check for common issues
const issues = [];

routes.forEach((route) => {
	// Check for routes that might have problems
	if (route.includes('v7') && !route.includes('mock')) {
		issues.push(`⚠️  V7 route (might be deprecated): ${route}`);
	}

	if (route.includes('coming-soon') || route.includes('Coming Soon')) {
		issues.push(`⚠️  Coming soon route: ${route}`);
	}

	if (route.includes('temporarily') || route.includes('Temporarily')) {
		issues.push(`⚠️  Temporarily disabled route: ${route}`);
	}
});

if (issues.length > 0) {
	console.log('\n🚨 Potential Issues Found:');
	issues.forEach((issue) => console.log(issue));
} else {
	console.log('\n✅ No obvious issues found in route definitions');
}

// Check for missing imports in App.tsx
const appTsPath = path.join(__dirname, 'src/App.tsx');
const appTsContent = fs.readFileSync(appTsPath, 'utf8');

console.log('\n🔍 Checking for common missing components...');

const commonMissingRoutes = [
	'/flows/oauth-authorization-code-v9',
	'/flows/implicit-v9',
	'/flows/device-authorization-v9',
	'/flows/client-credentials-v9',
	'/flows/oidc-hybrid-v9',
	'/flows/ciba-v9',
	'/flows/pingone-par-v9',
	'/flows/redirectless-v9-real',
	'/flows/pingone-mfa-workflow-library-v9',
	'/flows/kroger-grocery-store-mfa',
	'/flows/worker-token-v9',
	'/flows/token-introspection',
	'/flows/token-revocation',
	'/flows/userinfo',
	'/flows/pingone-logout',
	'/v9/debug-logs-popout',
	'/postman-collection-generator',
	'/oauth-code-generator-hub',
	'/application-generator',
	'/client-generator',
	'/service-test-runner',
	'/code-examples',
	'/jwks-troubleshooting',
	'/url-decoder',
	'/ai-agent-overview',
	'/ai-glossary',
	'/documentation',
	'/about',
];

commonMissingRoutes.forEach((route) => {
	if (routes.includes(route) && !appTsContent.includes(route)) {
		console.log(`❌ Missing route implementation: ${route}`);
	}
});

console.log('\n🔧 Fixing @icons imports...');

function fixIconsImport(filePath) {
	try {
		const content = fs.readFileSync(filePath, 'utf8');
		if (content.includes("from '@icons'")) {
			// Calculate the correct relative path to icons
			const filePathParts = filePath.split('/');
			const srcIndex = filePathParts.indexOf('src');
			const relativePathParts = filePathParts.slice(srcIndex + 1);
			const depth = relativePathParts.length - 1;
			const correctPath = '../'.repeat(depth) + 'icons';

			const fixedContent = content.replace(/from '@icons'/g, `from '${correctPath}'`);
			fs.writeFileSync(filePath, fixedContent);
			console.log(`✅ Fixed @icons import in: ${filePath} -> ${correctPath}`);
			return true;
		}
	} catch (error) {
		console.log(`❌ Error fixing ${filePath}: ${error.message}`);
	}
	return false;
}

// Find and fix all files with @icons imports
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

console.log(`\n🎉 Fixed @icons imports in ${fixedCount} files!`);
console.log('\n✅ Route analysis complete!');
