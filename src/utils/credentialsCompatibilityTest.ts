/**
 * @file credentialsCompatibilityTest.ts
 * @description Test utility to verify unified shared credentials doesn't break MFA/Unified functionality
 * @version 9.0.0
 * @since 2025-01-25
 */

import { MFAConfigurationServiceV8 } from '@/v8/services/mfaConfigurationServiceV8';
import { unifiedSharedCredentialsService } from '@/services/unifiedSharedCredentialsService';
import { SharedCredentialsServiceV8 } from '@/v8/services/sharedCredentialsServiceV8';
import { EnvironmentIdServiceV8 } from '@/v8/services/environmentIdServiceV8';
import { unifiedWorkerTokenService } from '@/services/unifiedWorkerTokenService';

const MODULE_TAG = '[🧪 CREDENTIALS-COMPATIBILITY-TEST]';

export interface CompatibilityTestResult {
	mfaIntact: boolean;
	unifiedIntact: boolean;
	workerTokenIntact: boolean;
	environmentIdIntact: boolean;
	sharedCredentialsIntact: boolean;
	details: {
		mfaSettings: any;
		unifiedCredentials: any;
		workerTokenCredentials: any;
		environmentId: string;
		sharedCredentials: any;
	};
}

/**
 * Test that MFA functionality is preserved
 */
export function testMFACompatibility(): boolean {
	try {
		console.log(`${MODULE_TAG} Testing MFA compatibility...`);
		
		// Test MFA configuration loading
		const mfaConfig = MFAConfigurationServiceV8.loadConfiguration();
		
		// Verify MFA settings exist
		const hasWorkerTokenSettings = mfaConfig.workerToken && 
			typeof mfaConfig.workerToken.silentApiRetrieval === 'boolean' &&
			typeof mfaConfig.workerToken.showTokenAtEnd === 'boolean';
		
		// Test MFA configuration saving
		const originalSilentRetrieval = mfaConfig.workerToken.silentApiRetrieval;
		mfaConfig.workerToken.silentApiRetrieval = !originalSilentRetrieval;
		MFAConfigurationServiceV8.saveConfiguration(mfaConfig);
		
		const updatedConfig = MFAConfigurationServiceV8.loadConfiguration();
		const wasUpdated = updatedConfig.workerToken.silentApiRetrieval !== originalSilentRetrieval;
		
		// Restore original value
		updatedConfig.workerToken.silentApiRetrieval = originalSilentRetrieval;
		MFAConfigurationServiceV8.saveConfiguration(updatedConfig);
		
		const restored = MFAConfigurationServiceV8.loadConfiguration();
		const wasRestored = restored.workerToken.silentApiRetrieval === originalSilentRetrieval;
		
		const success = hasWorkerTokenSettings && wasUpdated && wasRestored;
		
		console.log(`${MODULE_TAG} MFA compatibility test: ${success ? '✅ PASS' : '❌ FAIL'}`, {
			hasWorkerTokenSettings,
			wasUpdated,
			wasRestored,
			originalSilentRetrieval,
			finalValue: restored.workerToken.silentApiRetrieval
		});
		
		return success;
		
	} catch (error) {
		console.error(`${MODULE_TAG} ❌ MFA compatibility test failed:`, error);
		return false;
	}
}

/**
 * Test that Unified flow functionality is preserved
 */
export async function testUnifiedFlowCompatibility(): Promise<boolean> {
	try {
		console.log(`${MODULE_TAG} Testing Unified Flow compatibility...`);
		
		// Test flow-specific vs shared credentials priority
		const flowKey = 'test-compatibility-flow';
		
		// Set flow-specific credentials
		const flowSpecific = {
			environmentId: 'flow-specific-env',
			clientId: 'flow-specific-client',
			clientSecret: 'flow-specific-secret'
		};
		
		// Set shared credentials
		const shared = {
			environmentId: 'shared-env',
			clientId: 'shared-client',
			clientSecret: 'shared-secret'
		};
		
		// Save both
		const { CredentialsServiceV8 } = await import('@/v8/services/credentialsServiceV8');
		CredentialsServiceV8.saveCredentials(flowKey, flowSpecific);
		SharedCredentialsServiceV8.saveSharedCredentialsSync(shared);
		
		// Load and verify priority (flow-specific should win)
		const loadedFlowSpecific = CredentialsServiceV8.loadCredentials(flowKey, {});
		const loadedShared = SharedCredentialsServiceV8.loadSharedCredentialsSync();
		
		const flowSpecificWins = 
			loadedFlowSpecific.environmentId === 'flow-specific-env' &&
			loadedFlowSpecific.clientId === 'flow-specific-client' &&
			loadedFlowSpecific.clientId !== 'shared-client';
		
		// Clean up
		CredentialsServiceV8.saveCredentials(flowKey, {});
		SharedCredentialsServiceV8.saveSharedCredentialsSync({});
		
		const success = flowSpecificWins;
		
		console.log(`${MODULE_TAG} Unified Flow compatibility test: ${success ? '✅ PASS' : '❌ FAIL'}`, {
			flowSpecificWins,
			flowSpecificEnv: loadedFlowSpecific.environmentId,
			sharedEnv: loadedShared.environmentId
		});
		
		return success;
		
	} catch (error) {
		console.error(`${MODULE_TAG} ❌ Unified Flow compatibility test failed:`, error);
		return false;
	}
}

/**
 * Test that Worker Token functionality is preserved
 */
export function testWorkerTokenCompatibility(): boolean {
	try {
		console.log(`${MODULE_TAG} Testing Worker Token compatibility...`);
		
		// Test worker token credentials
		const testCredentials = {
			environmentId: 'test-env',
			clientId: 'test-client',
			clientSecret: 'test-secret',
			appId: 'compatibility-test'
		};
		
		// Save credentials
		unifiedWorkerTokenService.saveCredentials(testCredentials);
		
		// Load credentials
		const loaded = unifiedWorkerTokenService.loadCredentials();
		
		const credentialsMatch = 
			loaded?.environmentId === 'test-env' &&
			loaded?.clientId === 'test-client' &&
			loaded?.clientSecret === 'test-secret' &&
			loaded?.appId === 'compatibility-test';
		
		// Clean up
		unifiedWorkerTokenService.clearCredentials();
		
		const success = credentialsMatch;
		
		console.log(`${MODULE_TAG} Worker Token compatibility test: ${success ? '✅ PASS' : '❌ FAIL'}`, {
			credentialsMatch,
			loadedEnv: loaded?.environmentId,
			testEnv: 'test-env'
		});
		
		return success;
		
	} catch (error) {
		console.error(`${MODULE_TAG} ❌ Worker Token compatibility test failed:`, error);
		return false;
	}
}

/**
 * Test that Environment ID functionality is preserved
 */
export function testEnvironmentIdCompatibility(): boolean {
	try {
		console.log(`${MODULE_TAG} Testing Environment ID compatibility...`);
		
		// Test Environment ID service
		const testEnvId = 'test-environment-id';
		
		// Save Environment ID
		EnvironmentIdServiceV8.saveEnvironmentId(testEnvId);
		
		// Load Environment ID
		const loaded = EnvironmentIdServiceV8.getEnvironmentId();
		
		const matches = loaded === testEnvId;
		
		// Clean up
		localStorage.removeItem('v8:global_environment_id');
		
		const success = matches;
		
		console.log(`${MODULE_TAG} Environment ID compatibility test: ${success ? '✅ PASS' : '❌ FAIL'}`, {
			matches,
			loaded,
			expected: testEnvId
		});
		
		return success;
		
	} catch (error) {
		console.error(`${MODULE_TAG} ❌ Environment ID compatibility test failed:`, error);
		return false;
	}
}

/**
 * Test that Shared Credentials functionality is preserved
 */
export function testSharedCredentialsCompatibility(): boolean {
	try {
		console.log(`${MODULE_TAG} Testing Shared Credentials compatibility...`);
		
		// Test shared credentials
		const testShared = {
			environmentId: 'shared-test-env',
			clientId: 'shared-test-client',
			clientSecret: 'shared-test-secret',
			issuerUrl: 'https://test.issuer.com',
			clientAuthMethod: 'client_secret_basic' as const
		};
		
		// Save shared credentials
		SharedCredentialsServiceV8.saveSharedCredentialsSync(testShared);
		
		// Load shared credentials
		const loaded = SharedCredentialsServiceV8.loadSharedCredentialsSync();
		
		const matches = 
			loaded.environmentId === testShared.environmentId &&
			loaded.clientId === testShared.clientId &&
			loaded.clientSecret === testShared.clientSecret &&
			loaded.issuerUrl === testShared.issuerUrl &&
			loaded.clientAuthMethod === testShared.clientAuthMethod;
		
		// Clean up
		SharedCredentialsServiceV8.saveSharedCredentialsSync({});
		
		const success = matches;
		
		console.log(`${MODULE_TAG} Shared Credentials compatibility test: ${success ? '✅ PASS' : '❌ FAIL'}`, {
			matches,
			loadedEnv: loaded.environmentId,
			expectedEnv: testShared.environmentId
		});
		
		return success;
		
	} catch (error) {
		console.error(`${MODULE_TAG} ❌ Shared Credentials compatibility test failed:`, error);
		return false;
	}
}

/**
 * Run all compatibility tests
 */
export async function runAllCompatibilityTests(): Promise<CompatibilityTestResult> {
	console.log(`${MODULE_TAG} 🧪 Running all compatibility tests...`);
	
	const results = {
		mfaIntact: await testMFACompatibility(),
		unifiedIntact: await testUnifiedFlowCompatibility(),
		workerTokenIntact: await testWorkerTokenCompatibility(),
		environmentIdIntact: testEnvironmentIdCompatibility(),
		sharedCredentialsIntact: testSharedCredentialsCompatibility(),
		details: {
			mfaSettings: MFAConfigurationServiceV8.loadConfiguration(),
			unifiedCredentials: await unifiedSharedCredentialsService.loadAllCredentials(),
			workerTokenCredentials: unifiedWorkerTokenService.loadCredentials(),
			environmentId: EnvironmentIdServiceV8.getEnvironmentId(),
			sharedCredentials: SharedCredentialsServiceV8.loadSharedCredentialsSync(),
		}
	};
	
	const allPassed = Object.values(results).every(result => result === true);
	
	console.log(`${MODULE_TAG} 🎯 Compatibility tests completed: ${allPassed ? '✅ ALL PASS' : '❌ SOME FAILED'}`, {
		...results,
		allPassed
	});
	
	return results;
}
