/**
 * Script to generate the complete Postman collection (Unified + MFA)
 * Usage: node scripts/generate-complete-postman-collection.js
 */

import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Import the generator function
// Note: This is a Node.js script, so we need to use dynamic import or compile TypeScript
// For now, let's create a simple version that uses the existing comprehensive collections

async function generateCompleteCollection() {
	try {
		// Import the generator functions
		const {
			generateComprehensiveUnifiedPostmanCollection,
			generateComprehensiveMFAPostmanCollection,
			generateCompletePostmanCollection,
			generatePostmanEnvironment,
		} = await import('../src/services/postmanCollectionGeneratorV8.ts');

		// Generate the complete collection
		const collection = generateCompletePostmanCollection({
			environmentId: '', // Empty - user will fill in
			clientId: '', // Empty - user will fill in
			clientSecret: '', // Empty - user will fill in
			username: '', // Empty - user will fill in
		});

		// Generate the environment file
		const environment = generatePostmanEnvironment(
			collection,
			'PingOne Complete Collection Environment'
		);

		// Generate filename with date
		const date = new Date().toISOString().split('T')[0];
		const collectionFilename = `pingone-complete-unified-mfa-${date}-collection.json`;
		const environmentFilename = `pingone-complete-unified-mfa-${date}-environment.json`;

		// Save files
		const collectionPath = join(projectRoot, 'resources', 'postman', collectionFilename);
		const environmentPath = join(projectRoot, 'resources', 'postman', environmentFilename);

		writeFileSync(collectionPath, JSON.stringify(collection, null, 2), 'utf-8');
		writeFileSync(environmentPath, JSON.stringify(environment, null, 2), 'utf-8');

		console.log('✅ Complete Postman collection generated!');
		console.log(`📦 Collection: ${collectionPath}`);
		console.log(`🌍 Environment: ${environmentPath}`);
		console.log('');
		console.log('The collection includes:');
		console.log(
			'  • All Unified OAuth/OIDC flows (Authorization Code, Implicit, Client Credentials, Device Code, Hybrid)'
		);
		console.log('  • All MFA device types (SMS, Email, WhatsApp, TOTP, FIDO2, Mobile)');
		console.log('  • Registration and Authentication flows for each');
		console.log('  • Educational comments on every request');
		console.log('  • Variable extraction scripts');
		console.log('  • Complete OAuth login steps for user flows');
	} catch (error) {
		console.error('❌ Error generating collection:', error);
		process.exit(1);
	}
}

generateCompleteCollection();
