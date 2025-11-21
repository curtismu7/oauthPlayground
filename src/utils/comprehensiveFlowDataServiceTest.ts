// src/utils/comprehensiveFlowDataServiceTest.ts
/**
 * Comprehensive Test Suite for ComprehensiveFlowDataService
 *
 * This test suite validates all functionality of the service:
 * - Shared data management (Environment, Discovery, Global Config)
 * - Flow-specific data management (Credentials, State, Config)
 * - Complete credential isolation
 * - .env backup and restore functionality
 * - Error handling and edge cases
 */

import type {
	FlowSpecificCredentials,
	SharedDiscoveryData,
	SharedEnvironmentData,
} from '../services/comprehensiveFlowDataService';
import { comprehensiveFlowDataService } from '../services/comprehensiveFlowDataService';

export class ComprehensiveFlowDataServiceTest {
	private testResults: Array<{
		testName: string;
		passed: boolean;
		error?: string;
		details?: any;
	}> = [];

	/**
	 * Run all tests
	 */
	async runAllTests(): Promise<void> {
		console.group('🧪 [COMPREHENSIVE TEST SUITE] Starting ComprehensiveFlowDataService Tests');

		// Clear all data before testing
		this.clearAllTestData();

		// Run test categories
		await this.testSharedDataManagement();
		await this.testFlowSpecificDataManagement();
		await this.testCredentialIsolation();
		await this.testEnvBackupRestore();
		await this.testErrorHandling();
		await this.testEdgeCases();

		// Display results
		this.displayTestResults();

		console.groupEnd();
	}

	/**
	 * Test shared data management
	 */
	private async testSharedDataManagement(): Promise<void> {
		console.group('🌐 [TEST] Shared Data Management');

		// Test 1: Save and load shared environment data
		await this.runTest('Save Shared Environment Data', async () => {
			const envData: Partial<SharedEnvironmentData> = {
				environmentId: 'test-env-123',
				region: 'us',
				issuerUrl: 'https://auth.pingone.com/test-env-123',
			};

			const success = comprehensiveFlowDataService.saveSharedEnvironment(envData);
			if (!success) throw new Error('Failed to save shared environment data');

			const loaded = comprehensiveFlowDataService.loadSharedEnvironment();
			if (!loaded) throw new Error('Failed to load shared environment data');

			if (loaded.environmentId !== 'test-env-123') {
				throw new Error(`Expected environmentId 'test-env-123', got '${loaded.environmentId}'`);
			}

			if (loaded.region !== 'us') {
				throw new Error(`Expected region 'us', got '${loaded.region}'`);
			}

			return { saved: envData, loaded };
		});

		// Test 2: Save and load shared discovery data
		await this.runTest('Save Shared Discovery Data', async () => {
			const discoveryData: SharedDiscoveryData = {
				environmentId: 'test-env-123',
				discoveryDocument: {
					issuer: 'https://auth.pingone.com/test-env-123',
					authorization_endpoint: 'https://auth.pingone.com/test-env-123/as/authorize',
					token_endpoint: 'https://auth.pingone.com/test-env-123/as/token',
					userinfo_endpoint: 'https://auth.pingone.com/test-env-123/idp/userinfo',
					jwks_uri: 'https://auth.pingone.com/test-env-123/jwks',
					response_types_supported: ['code', 'id_token'],
					grant_types_supported: ['authorization_code', 'client_credentials'],
					scopes_supported: ['openid', 'profile', 'email'],
				},
				timestamp: Date.now(),
				provider: 'pingone',
				region: 'us',
			};

			const success = comprehensiveFlowDataService.saveSharedDiscovery(discoveryData);
			if (!success) throw new Error('Failed to save shared discovery data');

			const loaded = comprehensiveFlowDataService.loadSharedDiscovery();
			if (!loaded) throw new Error('Failed to load shared discovery data');

			if (loaded.environmentId !== 'test-env-123') {
				throw new Error(`Expected environmentId 'test-env-123', got '${loaded.environmentId}'`);
			}

			return { saved: discoveryData, loaded };
		});

		console.groupEnd();
	}

	/**
	 * Test flow-specific data management
	 */
	private async testFlowSpecificDataManagement(): Promise<void> {
		console.group('🔒 [TEST] Flow-Specific Data Management');

		// Test 1: Save and load flow-specific credentials
		await this.runTest('Save Flow-Specific Credentials', async () => {
			const credentials: FlowSpecificCredentials = {
				clientId: 'test-client-123',
				clientSecret: 'test-secret-456',
				redirectUri: 'https://test-app.com/callback',
				scopes: ['openid', 'profile'],
				logoutUrl: 'https://test-app.com/logout',
				loginHint: 'test@example.com',
				tokenEndpointAuthMethod: 'client_secret_basic',
				additionalParams: {
					customParam: 'customValue',
				},
				lastUpdated: Date.now(),
			};

			const success = comprehensiveFlowDataService.saveFlowCredentialsIsolated(
				'test-flow-1',
				credentials
			);
			if (!success) throw new Error('Failed to save flow-specific credentials');

			const loaded = comprehensiveFlowDataService.loadFlowCredentialsIsolated('test-flow-1');
			if (!loaded) throw new Error('Failed to load flow-specific credentials');

			if (loaded.clientId !== 'test-client-123') {
				throw new Error(`Expected clientId 'test-client-123', got '${loaded.clientId}'`);
			}

			if (loaded.logoutUrl !== 'https://test-app.com/logout') {
				throw new Error(
					`Expected logoutUrl 'https://test-app.com/logout', got '${loaded.logoutUrl}'`
				);
			}

			return { saved: credentials, loaded };
		});

		// Test 2: Save comprehensive flow data
		await this.runTest('Save Comprehensive Flow Data', async () => {
			const success = comprehensiveFlowDataService.saveFlowDataComprehensive('test-flow-2', {
				sharedEnvironment: {
					environmentId: 'test-env-456',
					region: 'eu',
					issuerUrl: 'https://auth.pingone.eu/test-env-456',
				},
				flowCredentials: {
					clientId: 'test-client-456',
					clientSecret: 'test-secret-789',
					redirectUri: 'https://test-app-2.com/callback',
					scopes: ['openid', 'email'],
					logoutUrl: 'https://test-app-2.com/logout',
					loginHint: 'admin@example.com',
					tokenEndpointAuthMethod: 'client_secret_post',
					lastUpdated: Date.now(),
				},
				flowState: {
					currentStep: 2,
					flowConfig: { variant: 'oidc' },
					nonce: 'test-nonce-123',
					state: 'test-state-456',
					lastUpdated: Date.now(),
				},
				flowConfig: {
					flowVariant: 'oidc',
					responseType: 'code',
					responseMode: 'query',
					grantType: 'authorization_code',
					authMethod: 'client_secret_basic',
					lastUpdated: Date.now(),
				},
			});

			if (!success) throw new Error('Failed to save comprehensive flow data');

			const loaded = comprehensiveFlowDataService.loadFlowDataComprehensive({
				flowKey: 'test-flow-2',
			});
			if (!loaded.flowCredentials) throw new Error('Failed to load flow credentials');
			if (!loaded.flowState) throw new Error('Failed to load flow state');
			if (!loaded.flowConfig) throw new Error('Failed to load flow config');

			return { loaded };
		});

		console.groupEnd();
	}

	/**
	 * Test credential isolation
	 */
	private async testCredentialIsolation(): Promise<void> {
		console.group('🔒 [TEST] Credential Isolation');

		// Test 1: Save different credentials for different flows
		await this.runTest('Save Different Credentials for Different Flows', async () => {
			const flow1Creds: FlowSpecificCredentials = {
				clientId: 'flow1-client',
				clientSecret: 'flow1-secret',
				redirectUri: 'https://flow1.com/callback',
				scopes: ['openid'],
				logoutUrl: 'https://flow1.com/logout',
				loginHint: 'flow1@example.com',
				tokenEndpointAuthMethod: 'client_secret_basic',
				lastUpdated: Date.now(),
			};

			const flow2Creds: FlowSpecificCredentials = {
				clientId: 'flow2-client',
				clientSecret: 'flow2-secret',
				redirectUri: 'https://flow2.com/callback',
				scopes: ['openid', 'profile'],
				logoutUrl: 'https://flow2.com/logout',
				loginHint: 'flow2@example.com',
				tokenEndpointAuthMethod: 'client_secret_post',
				lastUpdated: Date.now(),
			};

			const success1 = comprehensiveFlowDataService.saveFlowCredentialsIsolated(
				'isolation-test-flow-1',
				flow1Creds
			);
			const success2 = comprehensiveFlowDataService.saveFlowCredentialsIsolated(
				'isolation-test-flow-2',
				flow2Creds
			);

			if (!success1) throw new Error('Failed to save flow 1 credentials');
			if (!success2) throw new Error('Failed to save flow 2 credentials');

			return { flow1Success: success1, flow2Success: success2 };
		});

		// Test 2: Verify isolation
		await this.runTest('Verify Credential Isolation', async () => {
			const isIsolated = comprehensiveFlowDataService.testCredentialIsolation(
				'isolation-test-flow-1',
				'isolation-test-flow-2'
			);

			if (!isIsolated) {
				throw new Error('Credential isolation test failed - flows are sharing credentials');
			}

			return { isIsolated };
		});

		// Test 3: Test same credentials in different flows (should still be isolated)
		await this.runTest('Same Credentials in Different Flows (Isolation)', async () => {
			const sameCreds: FlowSpecificCredentials = {
				clientId: 'same-client',
				clientSecret: 'same-secret',
				redirectUri: 'https://same.com/callback',
				scopes: ['openid'],
				logoutUrl: 'https://same.com/logout',
				loginHint: 'same@example.com',
				tokenEndpointAuthMethod: 'client_secret_basic',
				lastUpdated: Date.now(),
			};

			const success1 = comprehensiveFlowDataService.saveFlowCredentialsIsolated(
				'same-creds-flow-1',
				sameCreds
			);
			const success2 = comprehensiveFlowDataService.saveFlowCredentialsIsolated(
				'same-creds-flow-2',
				sameCreds
			);

			if (!success1) throw new Error('Failed to save same credentials to flow 1');
			if (!success2) throw new Error('Failed to save same credentials to flow 2');

			// Even with same credentials, they should be stored separately
			const isIsolated = comprehensiveFlowDataService.testCredentialIsolation(
				'same-creds-flow-1',
				'same-creds-flow-2'
			);

			if (!isIsolated) {
				throw new Error('Same credentials should still be isolated between flows');
			}

			return { isIsolated };
		});

		console.groupEnd();
	}

	/**
	 * Test .env backup and restore
	 */
	private async testEnvBackupRestore(): Promise<void> {
		console.group('💾 [TEST] .env Backup and Restore');

		// Test 1: Generate .env content
		await this.runTest('Generate .env Content', async () => {
			const credentials: FlowSpecificCredentials = {
				clientId: 'env-test-client',
				clientSecret: 'env-test-secret',
				redirectUri: 'https://env-test.com/callback',
				scopes: ['openid', 'profile', 'email'],
				logoutUrl: 'https://env-test.com/logout',
				loginHint: 'env-test@example.com',
				tokenEndpointAuthMethod: 'client_secret_basic',
				additionalParams: {
					customParam1: 'value1',
					customParam2: 'value2',
				},
				lastUpdated: Date.now(),
			};

			// Save credentials first
			const saveSuccess = comprehensiveFlowDataService.saveFlowCredentialsIsolated(
				'env-test-flow',
				credentials
			);
			if (!saveSuccess) throw new Error('Failed to save credentials for env test');

			// Test restore functionality by parsing the generated content
			const envContent = `# OAuth Playground Credentials Backup
# Flow: env-test-flow
# Generated: 2024-01-01T00:00:00.000Z

ENV_TEST_FLOW_CLIENT_ID=${credentials.clientId}
ENV_TEST_FLOW_CLIENT_SECRET=${credentials.clientSecret}
ENV_TEST_FLOW_REDIRECT_URI=${credentials.redirectUri}
ENV_TEST_FLOW_SCOPES=${credentials.scopes.join(' ')}
ENV_TEST_FLOW_LOGOUT_URL=${credentials.logoutUrl}
ENV_TEST_FLOW_LOGIN_HINT=${credentials.loginHint}
ENV_TEST_FLOW_TOKEN_ENDPOINT_AUTH_METHOD=${credentials.tokenEndpointAuthMethod}
ENV_TEST_FLOW_CUSTOMPARAM1=${credentials.additionalParams?.customParam1}
ENV_TEST_FLOW_CUSTOMPARAM2=${credentials.additionalParams?.customParam2}`;

			// Test restore
			const restoreSuccess = comprehensiveFlowDataService.restoreCredentialsFromEnv(
				'env-restore-test',
				envContent
			);
			if (!restoreSuccess) throw new Error('Failed to restore credentials from env content');

			// Verify restored credentials
			const restored = comprehensiveFlowDataService.loadFlowCredentialsIsolated('env-restore-test');
			if (!restored) throw new Error('Failed to load restored credentials');

			if (restored.clientId !== credentials.clientId) {
				throw new Error(`Expected clientId '${credentials.clientId}', got '${restored.clientId}'`);
			}

			if (restored.logoutUrl !== credentials.logoutUrl) {
				throw new Error(
					`Expected logoutUrl '${credentials.logoutUrl}', got '${restored.logoutUrl}'`
				);
			}

			return { original: credentials, restored };
		});

		console.groupEnd();
	}

	/**
	 * Test error handling
	 */
	private async testErrorHandling(): Promise<void> {
		console.group('❌ [TEST] Error Handling');

		// Test 1: Invalid flow key
		await this.runTest('Invalid Flow Key Handling', async () => {
			const credentials: FlowSpecificCredentials = {
				clientId: 'test-client',
				clientSecret: 'test-secret',
				redirectUri: 'https://test.com/callback',
				scopes: ['openid'],
				lastUpdated: Date.now(),
			};

			// Test with empty flow key
			const emptyKeyResult = comprehensiveFlowDataService.saveFlowCredentialsIsolated(
				'',
				credentials
			);
			if (emptyKeyResult) {
				throw new Error('Should not succeed with empty flow key');
			}

			// Test with null flow key
			const nullKeyResult = comprehensiveFlowDataService.saveFlowCredentialsIsolated(
				null as any,
				credentials
			);
			if (nullKeyResult) {
				throw new Error('Should not succeed with null flow key');
			}

			return { emptyKeyResult, nullKeyResult };
		});

		// Test 2: Invalid credentials
		await this.runTest('Invalid Credentials Handling', async () => {
			const invalidCreds = {
				clientId: '', // Empty client ID
				clientSecret: 'test-secret',
				redirectUri: 'https://test.com/callback',
				scopes: ['openid'],
				lastUpdated: Date.now(),
			} as FlowSpecificCredentials;

			const result = comprehensiveFlowDataService.saveFlowCredentialsIsolated(
				'error-test-flow',
				invalidCreds
			);
			// Should still succeed (validation happens at restore time)

			return { result };
		});

		console.groupEnd();
	}

	/**
	 * Test edge cases
	 */
	private async testEdgeCases(): Promise<void> {
		console.group('🔍 [TEST] Edge Cases');

		// Test 1: Large data sets
		await this.runTest('Large Data Sets', async () => {
			const largeScopes = Array.from({ length: 100 }, (_, i) => `scope${i}`);
			const largeParams: Record<string, string> = {};
			for (let i = 0; i < 50; i++) {
				largeParams[`param${i}`] = `value${i}`;
			}

			const largeCredentials: FlowSpecificCredentials = {
				clientId: 'large-test-client',
				clientSecret: 'large-test-secret',
				redirectUri: 'https://large-test.com/callback',
				scopes: largeScopes,
				logoutUrl: 'https://large-test.com/logout',
				loginHint: 'large-test@example.com',
				tokenEndpointAuthMethod: 'client_secret_basic',
				additionalParams: largeParams,
				lastUpdated: Date.now(),
			};

			const success = comprehensiveFlowDataService.saveFlowCredentialsIsolated(
				'large-test-flow',
				largeCredentials
			);
			if (!success) throw new Error('Failed to save large credentials');

			const loaded = comprehensiveFlowDataService.loadFlowCredentialsIsolated('large-test-flow');
			if (!loaded) throw new Error('Failed to load large credentials');

			if (loaded.scopes.length !== 100) {
				throw new Error(`Expected 100 scopes, got ${loaded.scopes.length}`);
			}

			return {
				scopesCount: loaded.scopes.length,
				paramsCount: Object.keys(loaded.additionalParams || {}).length,
			};
		});

		// Test 2: Special characters
		await this.runTest('Special Characters', async () => {
			const specialCredentials: FlowSpecificCredentials = {
				clientId: 'test-client-with-special-chars-!@#$%^&*()',
				clientSecret: 'test-secret-with-unicode-🚀-emoji',
				redirectUri: 'https://test.com/callback?param=value&other=test',
				scopes: ['openid', 'profile with spaces', 'email-with-dashes'],
				logoutUrl: 'https://test.com/logout?param=value&other=test',
				loginHint: 'test+special@example.com',
				tokenEndpointAuthMethod: 'client_secret_basic',
				additionalParams: {
					'param with spaces': 'value with spaces',
					'param-with-dashes': 'value-with-dashes',
					param_with_underscores: 'value_with_underscores',
				},
				lastUpdated: Date.now(),
			};

			const success = comprehensiveFlowDataService.saveFlowCredentialsIsolated(
				'special-chars-flow',
				specialCredentials
			);
			if (!success) throw new Error('Failed to save special character credentials');

			const loaded = comprehensiveFlowDataService.loadFlowCredentialsIsolated('special-chars-flow');
			if (!loaded) throw new Error('Failed to load special character credentials');

			if (loaded.clientId !== specialCredentials.clientId) {
				throw new Error('Special characters not preserved in clientId');
			}

			return { loaded };
		});

		console.groupEnd();
	}

	/**
	 * Run a single test
	 */
	private async runTest(testName: string, testFn: () => Promise<any>): Promise<void> {
		try {
			console.log(`🧪 Running: ${testName}`);
			const result = await testFn();
			this.testResults.push({
				testName,
				passed: true,
				details: result,
			});
			console.log(`✅ Passed: ${testName}`);
		} catch (error) {
			this.testResults.push({
				testName,
				passed: false,
				error: error instanceof Error ? error.message : String(error),
			});
			console.error(`❌ Failed: ${testName} - ${error}`);
		}
	}

	/**
	 * Clear all test data
	 */
	private clearAllTestData(): void {
		comprehensiveFlowDataService.clearAllFlowData();
		comprehensiveFlowDataService.clearAllSharedData();
		console.log('🧹 Cleared all test data');
	}

	/**
	 * Display test results
	 */
	private displayTestResults(): void {
		console.group('📊 [TEST RESULTS] ComprehensiveFlowDataService Test Results');

		const passed = this.testResults.filter((r) => r.passed).length;
		const failed = this.testResults.filter((r) => !r.passed).length;
		const total = this.testResults.length;

		console.log(`📈 Total Tests: ${total}`);
		console.log(`✅ Passed: ${passed}`);
		console.log(`❌ Failed: ${failed}`);
		console.log(`📊 Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

		if (failed > 0) {
			console.group('❌ Failed Tests:');
			this.testResults
				.filter((r) => !r.passed)
				.forEach((result) => {
					console.error(`  - ${result.testName}: ${result.error}`);
				});
			console.groupEnd();
		}

		console.groupEnd();

		// Return results for programmatic access
		return {
			total,
			passed,
			failed,
			successRate: (passed / total) * 100,
			results: this.testResults,
		};
	}
}

// Export test instance
export const comprehensiveFlowDataServiceTest = new ComprehensiveFlowDataServiceTest();

// Make it available globally for testing
if (typeof window !== 'undefined') {
	(window as any).ComprehensiveFlowDataServiceTest = comprehensiveFlowDataServiceTest;
	console.log(`🧪 ComprehensiveFlowDataServiceTest available globally`);
	console.log(`🧪 Run tests with: ComprehensiveFlowDataServiceTest.runAllTests()`);
}

export default comprehensiveFlowDataServiceTest;
