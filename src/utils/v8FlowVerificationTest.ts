/**
 * @file v8FlowVerificationTest.ts
 * @description Test utility to verify V8 flows are not broken by unified credentials
 * @version 9.0.0
 * @since 2025-01-25
 */

import { CredentialsServiceV8 } from '@/v8/services/credentialsServiceV8';
import { FlowResetServiceV8 } from '@/v8/services/flowResetServiceV8';
import { MFAConfigurationServiceV8 } from '@/v8/services/mfaConfigurationServiceV8';

const MODULE_TAG = '[🧪 V8-FLOW-VERIFICATION-TEST]';

export interface V8FlowTestResult {
	oauthAuthCodeFlowV8: boolean;
	implicitFlowV8: boolean;
	mfaFlowV8: boolean;
	credentialsServiceV8: boolean;
	flowResetServiceV8: boolean;
	mfaConfigurationServiceV8: boolean;
	details: {
		oauthAuthCodeFlowV8Creds: any;
		implicitFlowV8Creds: any;
		mfaFlowV8Creds: any;
		mfaConfig: any;
	};
}

/**
 * Test OAuth Authorization Code Flow V8
 */
export function testOAuthAuthCodeFlowV8(): boolean {
	try {
		console.log(`${MODULE_TAG} Testing OAuth Authorization Code Flow V8...`);
		
		// Test flow-specific credential storage
		const testCredentials = {
			environmentId: 'v8-test-env',
			clientId: 'v8-test-client',
			clientSecret: 'v8-test-secret',
			redirectUri: 'https://localhost:3000/callback',
			scopes: 'openid profile email'
		};
		
		// Save credentials
		CredentialsServiceV8.saveCredentials('oauth-authz-v8', testCredentials);
		
		// Load credentials
		const loaded = CredentialsServiceV8.loadCredentials('oauth-authz-v8', {
			flowKey: 'oauth-authz-v8',
			flowType: 'oauth',
			includeClientSecret: true,
			includeRedirectUri: true,
			includeLogoutUri: false,
			includeScopes: true,
			defaultScopes: 'openid profile email',
			defaultRedirectUri: 'https://localhost:3000/callback'
		});
		
		// Verify credentials match
		const credentialsMatch = 
			loaded.environmentId === 'v8-test-env' &&
			loaded.clientId === 'v8-test-client' &&
			loaded.clientSecret === 'v8-test-secret' &&
			loaded.redirectUri === 'https://localhost:3000/callback' &&
			loaded.scopes === 'openid profile email';
		
		// Test flow reset
		FlowResetServiceV8.resetFlow('oauth-authz-v8');
		const resetCreds = CredentialsServiceV8.loadCredentials('oauth-authz-v8', {
			flowKey: 'oauth-authz-v8',
			flowType: 'oauth',
			includeClientSecret: true,
			includeRedirectUri: true,
			includeLogoutUri: false,
			includeScopes: true,
			defaultScopes: 'openid profile email',
			defaultRedirectUri: 'https://localhost:3000/callback'
		});
		
		const resetWorked = 
			!resetCreds.environmentId &&
			!resetCreds.clientId &&
			!resetCreds.clientSecret;
		
		// Restore credentials
		CredentialsServiceV8.saveCredentials('oauth-authz-v8', testCredentials);
		
		const success = credentialsMatch && resetWorked;
		
		console.log(`${MODULE_TAG} OAuth Authorization Code Flow V8 test: ${success ? '✅ PASS' : '❌ FAIL'}`, {
			credentialsMatch,
			resetWorked,
			loadedEnv: loaded.environmentId,
			expectedEnv: 'v8-test-env'
		});
		
		return success;
		
	} catch (error) {
		console.error(`${MODULE_TAG} ❌ OAuth Authorization Code Flow V8 test failed:`, error);
		return false;
	}
}

/**
 * Test Implicit Flow V8
 */
export function testImplicitFlowV8(): boolean {
	try {
		console.log(`${MODULE_TAG} Testing Implicit Flow V8...`);
		
		// Test flow-specific credential storage
		const testCredentials = {
			environmentId: 'v8-implicit-env',
			clientId: 'v8-implicit-client',
			redirectUri: 'https://localhost:3000/callback',
			scopes: 'openid profile email'
		};
		
		// Save credentials (no client secret for implicit flow)
		CredentialsServiceV8.saveCredentials('implicit-flow-v8', testCredentials);
		
		// Load credentials
		const loaded = CredentialsServiceV8.loadCredentials('implicit-flow-v8', {
			flowKey: 'implicit-flow-v8',
			flowType: 'oidc',
			includeClientSecret: false,
			includeRedirectUri: true,
			includeLogoutUri: false,
			includeScopes: true,
			defaultScopes: 'openid profile email',
			defaultRedirectUri: 'https://localhost:3000/callback'
		});
		
		// Verify credentials match
		const credentialsMatch = 
			loaded.environmentId === 'v8-implicit-env' &&
			loaded.clientId === 'v8-implicit-client' &&
			loaded.redirectUri === 'https://localhost:3000/callback' &&
			loaded.scopes === 'openid profile email';
		
		// Test flow reset
		FlowResetServiceV8.resetFlow('implicit-flow-v8');
		const resetCreds = CredentialsServiceV8.loadCredentials('implicit-flow-v8', {
			flowKey: 'implicit-flow-v8',
			flowType: 'oidc',
			includeClientSecret: false,
			includeRedirectUri: true,
			includeLogoutUri: false,
			includeScopes: true,
			defaultScopes: 'openid profile email',
			defaultRedirectUri: 'https://localhost:3000/callback'
		});
		
		const resetWorked = 
			!resetCreds.environmentId &&
			!resetCreds.clientId;
		
		// Restore credentials
		CredentialsServiceV8.saveCredentials('implicit-flow-v8', testCredentials);
		
		const success = credentialsMatch && resetWorked;
		
		console.log(`${MODULE_TAG} Implicit Flow V8 test: ${success ? '✅ PASS' : '❌ FAIL'}`, {
			credentialsMatch,
			resetWorked,
			loadedEnv: loaded.environmentId,
			expectedEnv: 'v8-implicit-env'
		});
		
		return success;
		
	} catch (error) {
		console.error(`${MODULE_TAG} ❌ Implicit Flow V8 test failed:`, error);
		return false;
	}
}

/**
 * Test MFA Flow V8
 */
export function testMFAFlowV8(): boolean {
	try {
		console.log(`${MODULE_TAG} Testing MFA Flow V8...`);
		
		// Test flow-specific credential storage
		const testCredentials = {
			environmentId: 'v8-mfa-env',
			clientId: 'v8-mfa-client',
			redirectUri: 'https://localhost:3000/callback',
			deviceType: 'sms' as const
		};
		
		// Save credentials
		CredentialsServiceV8.saveCredentials('mfa-flow-v8', testCredentials);
		
		// Load credentials
		const loaded = CredentialsServiceV8.loadCredentials('mfa-flow-v8', {
			flowKey: 'mfa-v8',
			flowType: 'oidc',
			includeClientSecret: false,
			includeRedirectUri: true,
			includeLogoutUri: false,
			includeScopes: true,
			defaultScopes: 'openid profile email',
			defaultRedirectUri: 'https://localhost:3000/callback'
		});
		
		// Verify credentials match
		const credentialsMatch = 
			loaded.environmentId === 'v8-mfa-env' &&
			loaded.clientId === 'v8-mfa-client' &&
			loaded.redirectUri === 'https://localhost:3000/callback';
		
		// Test flow reset
		FlowResetServiceV8.resetFlow('mfa-v8');
		const resetCreds = CredentialsServiceV8.loadCredentials('mfa-flow-v8', {
			flowKey: 'mfa-v8',
			flowType: 'oidc',
			includeClientSecret: false,
			includeRedirectUri: true,
			includeLogoutUri: false,
			includeScopes: true,
			defaultScopes: 'openid profile email',
			defaultRedirectUri: 'https://localhost:3000/callback'
		});
		
		const resetWorked = 
			!resetCreds.environmentId &&
			!resetCreds.clientId;
		
		// Restore credentials
		CredentialsServiceV8.saveCredentials('mfa-flow-v8', testCredentials);
		
		const success = credentialsMatch && resetWorked;
		
		console.log(`${MODULE_TAG} MFA Flow V8 test: ${success ? '✅ PASS' : '❌ FAIL'}`, {
			credentialsMatch,
			resetWorked,
			loadedEnv: loaded.environmentId,
			expectedEnv: 'v8-mfa-env'
		});
		
		return success;
		
	} catch (error) {
		console.error(`${MODULE_TAG} ❌ MFA Flow V8 test failed:`, error);
		return false;
	}
}

/**
 * Test CredentialsServiceV8
 */
export function testCredentialsServiceV8(): boolean {
	try {
		console.log(`${MODULE_TAG} Testing CredentialsServiceV8...`);
		
		// Test multiple flow credential storage
		const testCreds1 = { environmentId: 'test1', clientId: 'client1' };
		const testCreds2 = { environmentId: 'test2', clientId: 'client2' };
		
		// Save credentials for different flows
		CredentialsServiceV8.saveCredentials('flow1', testCreds1);
		CredentialsServiceV8.saveCredentials('flow2', testCreds2);
		
		// Load credentials
		const loaded1 = CredentialsServiceV8.loadCredentials('flow1', {});
		const loaded2 = CredentialsServiceV8.loadCredentials('flow2', {});
		
		// Verify isolation
		const isolationWorks = 
			loaded1.environmentId === 'test1' && loaded1.clientId === 'client1' &&
			loaded2.environmentId === 'test2' && loaded2.clientId === 'client2';
		
		// Clean up
		CredentialsServiceV8.saveCredentials('flow1', {});
		CredentialsServiceV8.saveCredentials('flow2', {});
		
		const success = isolationWorks;
		
		console.log(`${MODULE_TAG} CredentialsServiceV8 test: ${success ? '✅ PASS' : '❌ FAIL'}`, {
			isolationWorks,
			flow1Env: loaded1.environmentId,
			flow2Env: loaded2.environmentId
		});
		
		return success;
		
	} catch (error) {
		console.error(`${MODULE_TAG} ❌ CredentialsServiceV8 test failed:`, error);
		return false;
	}
}

/**
 * Test FlowResetServiceV8
 */
export function testFlowResetServiceV8(): boolean {
	try {
		console.log(`${MODULE_TAG} Testing FlowResetServiceV8...`);
		
		// Set up test credentials
		const testCreds = { environmentId: 'reset-test', clientId: 'reset-client' };
		CredentialsServiceV8.saveCredentials('reset-test-flow', testCreds);
		
		// Verify credentials exist
		const beforeReset = CredentialsServiceV8.loadCredentials('reset-test-flow', {});
		const hasCredentialsBefore = beforeReset.environmentId === 'reset-test';
		
		// Reset flow
		FlowResetServiceV8.resetFlow('reset-test-flow');
		
		// Verify credentials are cleared
		const afterReset = CredentialsServiceV8.loadCredentials('reset-test-flow', {});
		const credentialsCleared = !afterReset.environmentId && !afterReset.clientId;
		
		const success = hasCredentialsBefore && credentialsCleared;
		
		console.log(`${MODULE_TAG} FlowResetServiceV8 test: ${success ? '✅ PASS' : '❌ FAIL'}`, {
			hasCredentialsBefore,
			credentialsCleared,
			beforeEnv: beforeReset.environmentId,
			afterEnv: afterReset.environmentId
		});
		
		return success;
		
	} catch (error) {
		console.error(`${MODULE_TAG} ❌ FlowResetServiceV8 test failed:`, error);
		return false;
	}
}

/**
 * Test MFAConfigurationServiceV8
 */
export function testMFAConfigurationServiceV8(): boolean {
	try {
		console.log(`${MODULE_TAG} Testing MFAConfigurationServiceV8...`);
		
		// Load current config
		const originalConfig = MFAConfigurationServiceV8.loadConfiguration();
		
		// Test worker token settings
		const originalSilentRetrieval = originalConfig.workerToken.silentApiRetrieval;
		const originalShowTokenAtEnd = originalConfig.workerToken.showTokenAtEnd;
		
		// Modify settings
		originalConfig.workerToken.silentApiRetrieval = !originalSilentRetrieval;
		originalConfig.workerToken.showTokenAtEnd = !originalShowTokenAtEnd;
		MFAConfigurationServiceV8.saveConfiguration(originalConfig);
		
		// Verify changes
		const updatedConfig = MFAConfigurationServiceV8.loadConfiguration();
		const changesApplied = 
			updatedConfig.workerToken.silentApiRetrieval !== originalSilentRetrieval &&
			updatedConfig.workerToken.showTokenAtEnd !== originalShowTokenAtEnd;
		
		// Restore original settings
		updatedConfig.workerToken.silentApiRetrieval = originalSilentRetrieval;
		updatedConfig.workerToken.showTokenAtEnd = originalShowTokenAtEnd;
		MFAConfigurationServiceV8.saveConfiguration(updatedConfig);
		
		// Verify restoration
		const restoredConfig = MFAConfigurationServiceV8.loadConfiguration();
		const settingsRestored = 
			restoredConfig.workerToken.slientApiRetrieval === originalSilentRetrieval &&
			restoredConfig.workerToken.showTokenAtEnd === originalShowTokenAtEnd;
		
		const success = changesApplied && settingsRestored;
		
		console.log(`${MODULE_TAG} MFAConfigurationServiceV8 test: ${success ? '✅ PASS' : '❌ FAIL'}`, {
			changesApplied,
			settingsRestored,
			originalSilentRetrieval,
			finalSilentRetrieval: restoredConfig.workerToken.silentApiRetrieval
		});
		
		return success;
		
	} catch (error) {
		console.error(`${MODULE_TAG} ❌ MFAConfigurationServiceV8 test failed:`, error);
		return false;
	}
}

/**
 * Run all V8 flow verification tests
 */
export function runAllV8FlowTests(): V8FlowTestResult {
	console.log(`${MODULE_TAG} 🧪 Running all V8 flow verification tests...`);
	
	const results = {
		oauthAuthCodeFlowV8: testOAuthAuthCodeFlowV8(),
		implicitFlowV8: testImplicitFlowV8(),
		mfaFlowV8: testMFAFlowV8(),
		credentialsServiceV8: testCredentialsServiceV8(),
		flowResetServiceV8: testFlowResetServiceV8(),
		mfaConfigurationServiceV8: testMFAConfigurationServiceV8(),
		details: {
			oauthAuthCodeFlowV8Creds: CredentialsServiceV8.loadCredentials('oauth-authz-v8', {}),
			implicitFlowV8Creds: CredentialsServiceV8.loadCredentials('implicit-flow-v8', {}),
			mfaFlowV8Creds: CredentialsServiceV8.loadCredentials('mfa-flow-v8', {}),
			mfaConfig: MFAConfigurationServiceV8.loadConfiguration(),
		}
	};
	
	const allPassed = Object.values(results).every(result => result === true);
	
	console.log(`${MODULE_TAG} 🎯 V8 flow verification tests completed: ${allPassed ? '✅ ALL PASS' : '❌ SOME FAILED'}`, {
		...results,
		allPassed
	});
	
	return results;
}
