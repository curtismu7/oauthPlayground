// fix-environment-id.js
// Script to fix environment ID in localStorage for HEB Grocery Store flow

const CORRECT_ENV_ID = 'b9817c16-9910-4415-b67e-4ac687da74d9';
const FLOW_KEY = 'heb-grocery-store-mfa';

// Storage keys to check and update
const storageKeys = [
	'pingone_worker_token_credentials_heb-grocery-store-mfa',
	'pingone_flow_data:heb-grocery-store-mfa',
	'pingone_shared_environment',
	'pingone_shared_discovery',
	'pingone_environment_id_persistence',
];

function fixEnvironmentId() {
	console.log('🔧 Fixing Environment ID in localStorage...\n');
	console.log(`Correct Environment ID: ${CORRECT_ENV_ID}\n`);

	let fixedCount = 0;

	// Fix worker token credentials
	const workerTokenKey = 'pingone_worker_token_credentials_heb-grocery-store-mfa';
	try {
		const workerTokenData = localStorage.getItem(workerTokenKey);
		if (workerTokenData) {
			const parsed = JSON.parse(workerTokenData);
			if (parsed.environmentId && parsed.environmentId !== CORRECT_ENV_ID) {
				console.log(`❌ Found wrong Environment ID in ${workerTokenKey}: ${parsed.environmentId}`);
				parsed.environmentId = CORRECT_ENV_ID;
				parsed.lastUpdated = Date.now();
				localStorage.setItem(workerTokenKey, JSON.stringify(parsed));
				console.log(`✅ Fixed ${workerTokenKey}`);
				fixedCount++;
			} else if (parsed.environmentId === CORRECT_ENV_ID) {
				console.log(`✅ ${workerTokenKey} already has correct Environment ID`);
			}
		}
	} catch (e) {
		console.error(`Error fixing ${workerTokenKey}:`, e);
	}

	// Fix flow-specific data
	const flowDataKey = 'pingone_flow_data:heb-grocery-store-mfa';
	try {
		const flowData = localStorage.getItem(flowDataKey);
		if (flowData) {
			const parsed = JSON.parse(flowData);
			let updated = false;

			// Check credentials
			if (
				parsed.credentials?.environmentId &&
				parsed.credentials.environmentId !== CORRECT_ENV_ID
			) {
				console.log(
					`❌ Found wrong Environment ID in ${flowDataKey}.credentials: ${parsed.credentials.environmentId}`
				);
				parsed.credentials.environmentId = CORRECT_ENV_ID;
				parsed.credentials.lastUpdated = Date.now();
				updated = true;
			}

			// Check shared environment reference
			if (
				parsed.sharedEnvironment?.environmentId &&
				parsed.sharedEnvironment.environmentId !== CORRECT_ENV_ID
			) {
				console.log(
					`❌ Found wrong Environment ID in ${flowDataKey}.sharedEnvironment: ${parsed.sharedEnvironment.environmentId}`
				);
				parsed.sharedEnvironment.environmentId = CORRECT_ENV_ID;
				parsed.sharedEnvironment.lastUpdated = Date.now();
				updated = true;
			}

			if (updated) {
				localStorage.setItem(flowDataKey, JSON.stringify(parsed));
				console.log(`✅ Fixed ${flowDataKey}`);
				fixedCount++;
			} else if (
				parsed.credentials?.environmentId === CORRECT_ENV_ID ||
				parsed.sharedEnvironment?.environmentId === CORRECT_ENV_ID
			) {
				console.log(`✅ ${flowDataKey} already has correct Environment ID`);
			}
		}
	} catch (e) {
		console.error(`Error fixing ${flowDataKey}:`, e);
	}

	// Fix shared environment
	const sharedEnvKey = 'pingone_shared_environment';
	try {
		const sharedEnv = localStorage.getItem(sharedEnvKey);
		if (sharedEnv) {
			const parsed = JSON.parse(sharedEnv);
			if (parsed.environmentId && parsed.environmentId !== CORRECT_ENV_ID) {
				console.log(`❌ Found wrong Environment ID in ${sharedEnvKey}: ${parsed.environmentId}`);
				parsed.environmentId = CORRECT_ENV_ID;
				parsed.lastUpdated = Date.now();
				// Update issuer URL if it contains the old environment ID
				if (parsed.issuerUrl) {
					parsed.issuerUrl = parsed.issuerUrl.replace(
						/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//i,
						`/${CORRECT_ENV_ID}/`
					);
				}
				localStorage.setItem(sharedEnvKey, JSON.stringify(parsed));
				console.log(`✅ Fixed ${sharedEnvKey}`);
				fixedCount++;
			} else if (parsed.environmentId === CORRECT_ENV_ID) {
				console.log(`✅ ${sharedEnvKey} already has correct Environment ID`);
			}
		}
	} catch (e) {
		console.error(`Error fixing ${sharedEnvKey}:`, e);
	}

	// Fix shared discovery
	const sharedDiscoveryKey = 'pingone_shared_discovery';
	try {
		const sharedDiscovery = localStorage.getItem(sharedDiscoveryKey);
		if (sharedDiscovery) {
			const parsed = JSON.parse(sharedDiscovery);
			if (parsed.environmentId && parsed.environmentId !== CORRECT_ENV_ID) {
				console.log(
					`❌ Found wrong Environment ID in ${sharedDiscoveryKey}: ${parsed.environmentId}`
				);
				parsed.environmentId = CORRECT_ENV_ID;
				parsed.timestamp = Date.now();
				// Update discovery document issuer if it contains the old environment ID
				if (parsed.discoveryDocument?.issuer) {
					parsed.discoveryDocument.issuer = parsed.discoveryDocument.issuer.replace(
						/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//i,
						`/${CORRECT_ENV_ID}/`
					);
				}
				localStorage.setItem(sharedDiscoveryKey, JSON.stringify(parsed));
				console.log(`✅ Fixed ${sharedDiscoveryKey}`);
				fixedCount++;
			} else if (parsed.environmentId === CORRECT_ENV_ID) {
				console.log(`✅ ${sharedDiscoveryKey} already has correct Environment ID`);
			}
		}
	} catch (e) {
		console.error(`Error fixing ${sharedDiscoveryKey}:`, e);
	}

	// Fix environment ID persistence
	const envPersistenceKey = 'pingone_environment_id_persistence';
	try {
		const envPersistence = localStorage.getItem(envPersistenceKey);
		if (envPersistence) {
			const parsed = JSON.parse(envPersistence);
			if (parsed.environmentId && parsed.environmentId !== CORRECT_ENV_ID) {
				console.log(
					`❌ Found wrong Environment ID in ${envPersistenceKey}: ${parsed.environmentId}`
				);
				parsed.environmentId = CORRECT_ENV_ID;
				parsed.lastUpdated = Date.now();
				localStorage.setItem(envPersistenceKey, JSON.stringify(parsed));
				console.log(`✅ Fixed ${envPersistenceKey}`);
				fixedCount++;
			} else if (parsed.environmentId === CORRECT_ENV_ID) {
				console.log(`✅ ${envPersistenceKey} already has correct Environment ID`);
			}
		}
	} catch (e) {
		console.error(`Error fixing ${envPersistenceKey}:`, e);
	}

	// Check for any other keys that might contain the wrong environment ID
	console.log('\n🔍 Scanning all localStorage keys for wrong environment IDs...\n');
	let foundOtherKeys = false;
	for (let i = 0; i < localStorage.length; i++) {
		const key = localStorage.key(i);
		if (
			key &&
			(key.includes('pingone') ||
				key.includes('heb') ||
				key.includes('worker') ||
				key.includes('flow'))
		) {
			try {
				const value = localStorage.getItem(key);
				if (value) {
					// Check if it's JSON and contains an environment ID
					const parsed = JSON.parse(value);
					const jsonString = JSON.stringify(parsed);

					// Look for UUID patterns that are NOT the correct one
					const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
					const matches = jsonString.match(uuidPattern);

					if (matches) {
						const wrongIds = matches.filter(
							(id) => id.toLowerCase() !== CORRECT_ENV_ID.toLowerCase()
						);
						if (wrongIds.length > 0 && !storageKeys.includes(key)) {
							console.log(`⚠️ Found potential wrong Environment ID in ${key}:`, wrongIds);
							foundOtherKeys = true;
						}
					}
				}
			} catch (e) {
				// Not JSON, skip
			}
		}
	}

	if (!foundOtherKeys) {
		console.log('✅ No other keys found with wrong environment IDs');
	}

	console.log(`\n✅ Fixed ${fixedCount} storage location(s)`);
	console.log(`\n✅ Environment ID fix complete!`);
}

// Run the fix
if (typeof window !== 'undefined' && window.localStorage) {
	fixEnvironmentId();
} else {
	console.log('This script must be run in a browser console');
	console.log('Copy and paste the fixEnvironmentId function into your browser console');
}
