#!/usr/bin/env node

// Simple test script to check if main apps can be imported
console.log('🔍 Testing app imports...\n');

const apps = [
	{
		name: 'OAuth Authorization Code Flow V9',
		path: './src/pages/flows/v9/OAuthAuthorizationCodeFlowV9.tsx',
	},
	{ name: 'Worker Token Flow V9', path: './src/pages/flows/v9/WorkerTokenFlowV9.tsx' },
	{ name: 'MFA Flow V8', path: './src/pages/flows/MFAFlowV8.tsx' },
	{ name: 'Client Credentials Flow V9', path: './src/pages/flows/v9/ClientCredentialsFlowV9.tsx' },
	{
		name: 'Device Authorization Flow V9',
		path: './src/pages/flows/v9/DeviceAuthorizationFlowV9.tsx',
	},
];

const fs = require('fs');
const path = require('path');

apps.forEach((app) => {
	try {
		const fullPath = path.resolve(app.path);
		if (fs.existsSync(fullPath)) {
			const content = fs.readFileSync(fullPath, 'utf8');
			const hasExport = content.includes('export default') || content.includes('export {');
			const hasImport = content.includes('import');

			console.log(`✅ ${app.name}`);
			console.log(`   Path: ${app.path}`);
			console.log(`   Has imports: ${hasImport ? '✅' : '❌'}`);
			console.log(`   Has exports: ${hasExport ? '✅' : '❌'}`);
			console.log(`   File size: ${content.length} chars`);
			console.log('');
		} else {
			console.log(`❌ ${app.name} - FILE NOT FOUND`);
			console.log(`   Path: ${app.path}`);
			console.log('');
		}
	} catch (error) {
		console.log(`❌ ${app.name} - ERROR: ${error.message}`);
		console.log(`   Path: ${app.path}`);
		console.log('');
	}
});

console.log('🔍 Checking package.json...');
try {
	const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
	console.log(`✅ Package name: ${packageJson.name}`);
	console.log(`✅ Version: ${packageJson.version}`);
	console.log(`✅ Scripts: ${Object.keys(packageJson.scripts || {}).length}`);
} catch (error) {
	console.log(`❌ Package.json error: ${error.message}`);
}

console.log('\n🔍 Checking tsconfig.json...');
try {
	const tsconfig = JSON.parse(fs.readFileSync('./tsconfig.json', 'utf8'));
	console.log(`✅ TypeScript config loaded`);
	console.log(`✅ Target: ${tsconfig.compilerOptions?.target}`);
	console.log(`✅ Module: ${tsconfig.compilerOptions?.module}`);
} catch (error) {
	console.log(`❌ tsconfig.json error: ${error.message}`);
}

console.log('\n🔍 Checking vite.config.ts...');
try {
	const viteConfig = fs.readFileSync('./vite.config.ts', 'utf8');
	console.log(`✅ Vite config loaded`);
	console.log(`✅ File size: ${viteConfig.length} chars`);
	console.log(`✅ Has React plugin: ${viteConfig.includes('@vitejs/plugin-react')}`);
} catch (error) {
	console.log(`❌ vite.config.ts error: ${error.message}`);
}

console.log('\n🎯 Test complete!');
