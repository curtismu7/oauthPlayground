import { logger } from '../utils/logger';
import { logger } from './logger';

// src/utils/fixEnvironmentId.ts
// Utility function to fix environment ID in localStorage

const CORRECT_ENV_ID = 'b9817c16-9910-4415-b67e-4ac687da74d9';
const _FLOW_KEY = 'heb-grocery-store-mfa';

/**
 * Fix environment ID in all storage locations for HEB Grocery Store flow
 * Removes any old/wrong environment IDs and sets the correct one
 */
export function fixEnvironmentIdInStorage(): void {
	if (typeof window === 'undefined' || !window.localStorage) {
		logger.warn('fixEnvironmentId', 'localStorage not available');
		return;
	}

	logger.info('🔧 Fixing Environment ID in localStorage...', "Logger info");
	logger.info(`Correct Environment ID: ${CORRECT_ENV_ID}\n`, "Logger info");

	let fixedCount = 0;

	// Fix worker token credentials
	const workerTokenKey = 'pingone_worker_token_credentials_heb-grocery-store-mfa';
	try {
		const workerTokenData = localStorage.getItem(workerTokenKey);
		if (workerTokenData) {
			const parsed = JSON.parse(workerTokenData);
			if (parsed.environmentId && parsed.environmentId !== CORRECT_ENV_ID) {
				logger.info(`❌ Found wrong Environment ID in ${workerTokenKey}: ${parsed.environmentId}`, "Logger info");
				parsed.environmentId = CORRECT_ENV_ID;
				parsed.lastUpdated = Date.now();
				localStorage.setItem(workerTokenKey, JSON.stringify(parsed));
				logger.info(`✅ Fixed ${workerTokenKey}`, "Logger info");
				fixedCount++;
			}
		}
	} catch (e) {
		logger.error('fixEnvironmentId', `Error fixing ${workerTokenKey}:`, undefined, e as Error);
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
				logger.info(
					`❌ Found wrong Environment ID in ${flowDataKey}.credentials: ${parsed.credentials.environmentId}`
				, "Logger info");
				parsed.credentials.environmentId = CORRECT_ENV_ID;
				parsed.credentials.lastUpdated = Date.now();
				updated = true;
			}

			// Check shared environment reference
			if (
				parsed.sharedEnvironment?.environmentId &&
				parsed.sharedEnvironment.environmentId !== CORRECT_ENV_ID
			) {
				logger.info(
					`❌ Found wrong Environment ID in ${flowDataKey}.sharedEnvironment: ${parsed.sharedEnvironment.environmentId}`
				, "Logger info");
				parsed.sharedEnvironment.environmentId = CORRECT_ENV_ID;
				parsed.sharedEnvironment.lastUpdated = Date.now();
				updated = true;
			}

			if (updated) {
				localStorage.setItem(flowDataKey, JSON.stringify(parsed));
				logger.info(`✅ Fixed ${flowDataKey}`, "Logger info");
				fixedCount++;
			}
		}
	} catch (e) {
		logger.error('fixEnvironmentId', `Error fixing ${flowDataKey}:`, undefined, e as Error);
	}

	// Fix shared environment
	const sharedEnvKey = 'pingone_shared_environment';
	try {
		const sharedEnv = localStorage.getItem(sharedEnvKey);
		if (sharedEnv) {
			const parsed = JSON.parse(sharedEnv);
			if (parsed.environmentId && parsed.environmentId !== CORRECT_ENV_ID) {
				logger.info(`❌ Found wrong Environment ID in ${sharedEnvKey}: ${parsed.environmentId}`, "Logger info");
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
				logger.info(`✅ Fixed ${sharedEnvKey}`, "Logger info");
				fixedCount++;
			}
		}
	} catch (e) {
		logger.error('fixEnvironmentId', `Error fixing ${sharedEnvKey}:`, undefined, e as Error);
	}

	// Fix shared discovery
	const sharedDiscoveryKey = 'pingone_shared_discovery';
	try {
		const sharedDiscovery = localStorage.getItem(sharedDiscoveryKey);
		if (sharedDiscovery) {
			const parsed = JSON.parse(sharedDiscovery);
			if (parsed.environmentId && parsed.environmentId !== CORRECT_ENV_ID) {
				logger.info(
					`❌ Found wrong Environment ID in ${sharedDiscoveryKey}: ${parsed.environmentId}`
				, "Logger info");
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
				logger.info(`✅ Fixed ${sharedDiscoveryKey}`, "Logger info");
				fixedCount++;
			}
		}
	} catch (e) {
		logger.error('fixEnvironmentId', `Error fixing ${sharedDiscoveryKey}:`, undefined, e as Error);
	}

	// Fix environment ID persistence
	const envPersistenceKey = 'pingone_environment_id_persistence';
	try {
		const envPersistence = localStorage.getItem(envPersistenceKey);
		if (envPersistence) {
			const parsed = JSON.parse(envPersistence);
			if (parsed.environmentId && parsed.environmentId !== CORRECT_ENV_ID) {
				logger.info(
					`❌ Found wrong Environment ID in ${envPersistenceKey}: ${parsed.environmentId}`
				, "Logger info");
				parsed.environmentId = CORRECT_ENV_ID;
				parsed.lastUpdated = Date.now();
				localStorage.setItem(envPersistenceKey, JSON.stringify(parsed));
				logger.info(`✅ Fixed ${envPersistenceKey}`, "Logger info");
				fixedCount++;
			}
		}
	} catch (e) {
		logger.error('fixEnvironmentId', `Error fixing ${envPersistenceKey}:`, undefined, e as Error);
	}

	// Scan for any other keys that might contain wrong environment IDs
	logger.info('\n🔍 Scanning all localStorage keys for wrong environment IDs...\n', "Logger info");
	const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
	const keysToCheck = [
		'pingone_worker_token_credentials_heb-grocery-store-mfa',
		'pingone_flow_data:heb-grocery-store-mfa',
		'pingone_shared_environment',
		'pingone_shared_discovery',
		'pingone_environment_id_persistence',
	];

	for (let i = 0; i < localStorage.length; i++) {
		const key = localStorage.key(i);
		if (
			key &&
			(key.includes('pingone') ||
				key.includes('heb') ||
				key.includes('worker') ||
				key.includes('flow'))
		) {
			if (keysToCheck.includes(key)) continue; // Already checked

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
							logger.info(`⚠️ Found potential wrong Environment ID in ${key}:`, wrongIds);
							// Try to fix if it's a simple structure
							if (parsed.environmentId && parsed.environmentId !== CORRECT_ENV_ID) {
								parsed.environmentId = CORRECT_ENV_ID;
								if (parsed.lastUpdated !== undefined) {
									parsed.lastUpdated = Date.now();
								}
								localStorage.setItem(key, JSON.stringify(parsed));
								logger.info(`✅ Fixed ${key}`, "Logger info");
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

	logger.info(`\n✅ Fixed ${fixedCount} storage location(s)`);
	logger.info(`✅ Environment ID fix complete!`, "Logger info");

	// Also make it available globally for manual execution
	if (typeof window !== 'undefined') {
		(window as any).fixEnvironmentId = fixEnvironmentIdInStorage;
	}
}
