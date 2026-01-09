/**
 * Script to generate the complete Postman collection (Unified + MFA)
 * Usage: node scripts/generate-complete-postman.mjs
 */

import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
const require = createRequire(import.meta.url);

// Since we can't directly import TypeScript, let's read the generated comprehensive collections
// and combine them manually, or use a simpler approach

async function generateCompleteCollection() {
	try {
		// Read the existing comprehensive collections if they exist
		const unifiedPath = join(projectRoot, 'resources', 'postman', 'pingone-unified-flows-complete-collection.json');
		const mfaPath = join(projectRoot, 'resources', 'postman', 'pingone-mfa-complete-collection.json');
		
		// For now, let's create a simple script that will be run from the browser context
		// or we can create a Node.js version that manually constructs the collection
		
		console.log('📝 Generating complete Postman collection...');
		console.log('');
		console.log('This script needs to run in a browser context or use a TypeScript compiler.');
		console.log('Please use the Postman Collection Generator page at:');
		console.log('  /postman-collection-generator');
		console.log('');
		console.log('Or generate it programmatically from the browser console:');
		console.log('');
		console.log('```javascript');
		console.log('import { generateCompletePostmanCollection, generatePostmanEnvironment, downloadPostmanCollectionWithEnvironment } from "./src/services/postmanCollectionGeneratorV8";');
		console.log('');
		console.log('const collection = generateCompletePostmanCollection({');
		console.log('  environmentId: "",');
		console.log('  clientId: "",');
		console.log('  clientSecret: "",');
		console.log('  username: ""');
		console.log('});');
		console.log('');
		console.log('const date = new Date().toISOString().split("T")[0];');
		console.log('const filename = `pingone-complete-unified-mfa-${date}-collection.json`;');
		console.log('downloadPostmanCollectionWithEnvironment(collection, filename, "PingOne Complete Collection Environment");');
		console.log('```');
		
		// Actually, let's create a simple HTML file that can be opened in a browser
		const htmlContent = `<!DOCTYPE html>
<html>
<head>
	<title>Generate Complete Postman Collection</title>
	<script type="module">
		// This would need to be run in the actual app context
		// For now, use the Postman Collection Generator page
		window.location.href = '/postman-collection-generator';
	</script>
</head>
<body>
	<p>Redirecting to Postman Collection Generator...</p>
	<p>If not redirected, go to: <a href="/postman-collection-generator">/postman-collection-generator</a></p>
</body>
</html>`;
		
		const htmlPath = join(projectRoot, 'resources', 'postman', 'generate-complete-collection.html');
		writeFileSync(htmlPath, htmlContent, 'utf-8');
		
		console.log('✅ Created helper HTML file at:', htmlPath);
		console.log('');
		console.log('To generate the complete collection:');
		console.log('1. Open the app in your browser');
		console.log('2. Navigate to: /postman-collection-generator');
		console.log('3. Select both "Unified OAuth/OIDC Flows" and "MFA Flows"');
		console.log('4. Select all spec versions and device types');
		console.log('5. Click "Generate & Download Postman Collection"');
	} catch (error) {
		console.error('❌ Error:', error);
		process.exit(1);
	}
}

generateCompleteCollection();
