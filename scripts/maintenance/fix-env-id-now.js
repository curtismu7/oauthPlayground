// Run this in browser console to fix environment ID immediately
(() => {
	const CORRECT_ENV_ID = 'b9817c16-9910-4415-b67e-4ac687da74d9';
	const _FLOW_KEY = 'heb-grocery-store-mfa';

	console.log('🔧 Fixing Environment ID in localStorage...');
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
				if (parsed.issuerUrl) {
					parsed.issuerUrl = parsed.issuerUrl.replace(
						/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//i,
						`/${CORRECT_ENV_ID}/`
					);
				}
				localStorage.setItem(sharedEnvKey, JSON.stringify(parsed));
				console.log(`✅ Fixed ${sharedEnvKey}`);
				fixedCount++;
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
				if (parsed.discoveryDocument?.issuer) {
					parsed.discoveryDocument.issuer = parsed.discoveryDocument.issuer.replace(
						/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//i,
						`/${CORRECT_ENV_ID}/`
					);
				}
				localStorage.setItem(sharedDiscoveryKey, JSON.stringify(parsed));
				console.log(`✅ Fixed ${sharedDiscoveryKey}`);
				fixedCount++;
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
			}
		}
	} catch (e) {
		console.error(`Error fixing ${envPersistenceKey}:`, e);
	}

	// Scan all localStorage for any other occurrences
	console.log('\n🔍 Scanning all localStorage keys...\n');
	const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
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
					const parsed = JSON.parse(value);
					const jsonString = JSON.stringify(parsed);
					const matches = jsonString.match(uuidPattern);

					if (matches) {
						const wrongIds = matches.filter(
							(id) => id.toLowerCase() !== CORRECT_ENV_ID.toLowerCase()
						);
						if (wrongIds.length > 0) {
							console.log(`⚠️ Found UUID in ${key}:`, wrongIds);
							// Try to fix if it's an environmentId field
							if (parsed.environmentId && parsed.environmentId !== CORRECT_ENV_ID) {
								console.log(
									`  → Fixing environmentId: ${parsed.environmentId} → ${CORRECT_ENV_ID}`
								);
								parsed.environmentId = CORRECT_ENV_ID;
								if (parsed.lastUpdated !== undefined) parsed.lastUpdated = Date.now();
								localStorage.setItem(key, JSON.stringify(parsed));
								fixedCount++;
							}
						}
					}
				}
			} catch (_e) {
				// Not JSON, skip
			}
		}
	}

	console.log(`\n✅ Fixed ${fixedCount} storage location(s)`);
	console.log(`✅ Environment ID fix complete!`);
})();
