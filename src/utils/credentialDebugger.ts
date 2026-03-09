// src/utils/credentialDebugger.ts
import { logger } from '../utils/logger';
/**
 * Credential Debugging Utilities
 *
 * Provides tools to inspect and debug credential storage across flows
 */

export interface CredentialAuditResult {
	flowKey: string;
	hasFlowSpecificCredentials: boolean;
	hasSharedCredentials: boolean;
	credentialSource: 'flow-specific' | 'shared-fallback' | 'none';
	flowSpecificData?: unknown;
	sharedData?: unknown;
	allStorageKeys: string[];
}

export class CredentialDebugger {
	/**
	 * Audit all credential storage for a specific flow
	 */
	static auditFlowCredentials(flowKey: string): CredentialAuditResult {
		logger.info(`[CREDENTIAL AUDIT] Auditing flow: ${flowKey}`);

		// Get all PingOne-related storage keys
		const allKeys = Object.keys(localStorage).filter(
			(key) =>
				key.includes('pingone') ||
				key.includes(flowKey) ||
				key.includes('flow') ||
				key.includes('credential')
		);

		logger.info(`📋 All relevant storage keys:`, allKeys);

		// Check flow-specific storage
		const flowSpecificKey = flowKey;
		const flowSpecificData = localStorage.getItem(flowSpecificKey);
		const hasFlowSpecificCredentials = !!flowSpecificData;

		logger.info(`📋 Flow-specific key (${flowSpecificKey}):`, flowSpecificData);

		// Check shared credential storage
		const sharedKeys = [
			'pingone_permanent_credentials',
			'pingone_config_credentials',
			'pingone_authz_flow_credentials',
			'pingone_worker_flow_credentials',
			'pingone_implicit_flow_credentials',
			'pingone_hybrid_flow_credentials',
			'pingone_device_flow_credentials',
		];

		const sharedData: Record<string, unknown> = {};
		let hasSharedCredentials = false;

		sharedKeys.forEach((key) => {
			const data = localStorage.getItem(key);
			if (data) {
				sharedData[key] = JSON.parse(data);
				hasSharedCredentials = true;
			}
		});

		logger.info(`📋 Shared credential data:`, sharedData);

		// Determine credential source
		let credentialSource: 'flow-specific' | 'shared-fallback' | 'none' = 'none';
		if (hasFlowSpecificCredentials) {
			credentialSource = 'flow-specific';
		} else if (hasSharedCredentials) {
			credentialSource = 'shared-fallback';
		}

		logger.info(`📋 Credential source: ${credentialSource}`, "Logger info");

		return {
			flowKey,
			hasFlowSpecificCredentials,
			hasSharedCredentials,
			credentialSource,
			flowSpecificData: flowSpecificData ? JSON.parse(flowSpecificData) : undefined,
			sharedData,
			allStorageKeys: allKeys,
		};
	}

	/**
	 * Audit all flows and detect potential credential bleeding
	 */
	static auditAllFlows(): Record<string, CredentialAuditResult> {
		const v7Flows = [
			'oauth-authorization-code-v7',
			'oidc-hybrid-v7',
			'worker-token-v7',
			'client-credentials-v7',
			'device-authorization-v7',
			'implicit-flow-v7',
			'ciba-flow-v7',
			'redirectless-v7-real',
			'pingone-par-flow-v7',
		];

		logger.info('credentialDebugger', '[CREDENTIAL AUDIT] Auditing all V7 flows');

		const results: Record<string, CredentialAuditResult> = {};

		v7Flows.forEach((flowKey) => {
			results[flowKey] = CredentialDebugger.auditFlowCredentials(flowKey);
		});

		// Detect potential bleeding
		const flowsUsingSharedCredentials = Object.entries(results)
			.filter(([_, result]) => result.credentialSource === 'shared-fallback')
			.map(([flowKey, _]) => flowKey);

		if (flowsUsingSharedCredentials.length > 0) {
			logger.warn(`🚨 POTENTIAL CREDENTIAL BLEEDING DETECTED!`, "Logger warning");
			logger.warn(`📋 Flows using shared credentials:`, flowsUsingSharedCredentials);
		}


		return results;
	}

	/**
	 * Clear all credentials for testing
	 */
	static clearAllCredentials(): void {
		logger.info('credentialDebugger', '[CREDENTIAL DEBUGGER] Clearing all credentials');

		const keysToRemove = Object.keys(localStorage).filter(
			(key) => key.includes('pingone') || key.includes('flow') || key.includes('credential')
		);

		keysToRemove.forEach((key) => {
			localStorage.removeItem(key);
			logger.info(`🗑️ Removed: ${key}`, "Logger info");
		});

		// Also clear session storage
		const sessionKeysToRemove = Object.keys(sessionStorage).filter(
			(key) => key.includes('pingone') || key.includes('credential')
		);

		sessionKeysToRemove.forEach((key) => {
			sessionStorage.removeItem(key);
			logger.info(`🗑️ Removed from session: ${key}`, "Logger info");
		});

		logger.info(
			`✅ Cleared ${keysToRemove.length} localStorage keys and ${sessionKeysToRemove.length} sessionStorage keys`
		, "Logger info");
	}

	/**
	 * Dump all credential storage for debugging
	 */
	static dumpAllStorage(): void {
		logger.info('credentialDebugger', '[CREDENTIAL DEBUGGER] Dumping all credential storage');

		logger.info(`📋 localStorage keys:`, Object.keys(localStorage));
		logger.info(`📋 sessionStorage keys:`, Object.keys(sessionStorage));

		// Dump all PingOne-related data
		const pingoneKeys = Object.keys(localStorage).filter((key) => key.includes('pingone'));
		logger.info(`📋 PingOne localStorage data:`, "Logger info");
		pingoneKeys.forEach((key) => {
			const data = localStorage.getItem(key);
			logger.info(`  ${key}:`, data);
		});

		const pingoneSessionKeys = Object.keys(sessionStorage).filter((key) => key.includes('pingone'));
		logger.info(`📋 PingOne sessionStorage data:`, "Logger info");
		pingoneSessionKeys.forEach((key) => {
			const data = sessionStorage.getItem(key);
			logger.info(`  ${key}:`, data);
		});

	}

	/**
	 * Test credential isolation between two flows
	 */
	static testCredentialIsolation(flow1Key: string, flow2Key: string): void {
		logger.info(`[CREDENTIAL ISOLATION TEST] Testing ${flow1Key} vs ${flow2Key}`);

		// Clear all credentials first
		CredentialDebugger.clearAllCredentials();

		// Set credentials for flow 1
		const flow1Credentials = {
			environmentId: 'test-env-1',
			clientId: 'test-client-1',
			clientSecret: 'test-secret-1',
			redirectUri: 'http://localhost:3000/callback-1',
		};

		localStorage.setItem(
			flow1Key,
			JSON.stringify({
				credentials: flow1Credentials,
				timestamp: Date.now(),
			})
		);

		logger.info(`📋 Set credentials for ${flow1Key}:`, flow1Credentials);

		// Set credentials for flow 2
		const flow2Credentials = {
			environmentId: 'test-env-2',
			clientId: 'test-client-2',
			clientSecret: 'test-secret-2',
			redirectUri: 'http://localhost:3000/callback-2',
		};

		localStorage.setItem(
			flow2Key,
			JSON.stringify({
				credentials: flow2Credentials,
				timestamp: Date.now(),
			})
		);

		logger.info(`📋 Set credentials for ${flow2Key}:`, flow2Credentials);

		// Test loading
		const flow1Result = CredentialDebugger.auditFlowCredentials(flow1Key);
		const flow2Result = CredentialDebugger.auditFlowCredentials(flow2Key);

		logger.info(`📋 Flow 1 result:`, flow1Result);
		logger.info(`📋 Flow 2 result:`, flow2Result);

		// Check for isolation
		const flow1Isolated =
			flow1Result.credentialSource === 'flow-specific' &&
			flow1Result.flowSpecificData?.credentials?.clientId === 'test-client-1';
		const flow2Isolated =
			flow2Result.credentialSource === 'flow-specific' &&
			flow2Result.flowSpecificData?.credentials?.clientId === 'test-client-2';

		if (flow1Isolated && flow2Isolated) {
			logger.info(`✅ ISOLATION TEST PASSED: Both flows have their own credentials`, "Logger info");
		} else {
			logger.error(`❌ ISOLATION TEST FAILED: Credential bleeding detected`, "Logger error");
		}

	}
}

// Make it available globally for debugging
if (typeof window !== 'undefined') {
	(window as unknown as Record<string, unknown>).CredentialDebugger = CredentialDebugger;

	// Also make it available as a simple global function
	(window as unknown as Record<string, unknown>).auditCredentials = () =>
		CredentialDebugger.auditAllFlows();
	(window as unknown as Record<string, unknown>).dumpStorage = () =>
		CredentialDebugger.dumpAllStorage();
	(window as unknown as Record<string, unknown>).clearCredentials = () =>
		CredentialDebugger.clearAllCredentials();
}

export default CredentialDebugger;
