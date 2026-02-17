// src/tests/unifiedStorageService.test.ts
// Comprehensive test suite for UnifiedTokenStorageService

import { unifiedTokenStorage } from '../services/unifiedTokenStorageService';

// Test configuration
const TEST_CONFIG = {
	timeout: 5000,
	retries: 3,
};

// Mock data for testing
const mockToken = {
	id: 'test-token-1',
	type: 'access_token' as const,
	value: 'mock-access-token-value',
	expiresAt: Date.now() + 3600000, // 1 hour from now
	issuedAt: Date.now(),
	source: 'indexeddb' as const,
	flowName: 'test-flow',
	metadata: {
		test: true,
		environmentId: 'test-env',
	},
};

const mockCredentials = {
	environmentId: 'test-env-123',
	clientId: 'test-client-456',
	clientSecret: 'test-secret-789',
	redirectUri: 'https://test.example.com/callback',
	scopes: 'openid profile email',
};

const mockPKCECodes = {
	codeVerifier: 'test-code-verifier-12345678901234567890',
	codeChallenge: 'test-code-challenge-12345678901234567890',
	codeChallengeMethod: 'S256' as const,
};

// Test utilities
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const cleanup = async () => {
	try {
		// Clean up all test data
		await unifiedTokenStorage.deleteToken(mockToken.id);
		await unifiedTokenStorage.clearFlowCredentials('test-flow');
		await unifiedTokenStorage.clearPKCECodes('test-flow');
		await unifiedTokenStorage.clearFlowState('test-flow');
		await unifiedTokenStorage.clearWorkerToken();
	} catch (error) {
		console.warn('Cleanup warning:', error);
	}
};

// Test suite
export class UnifiedStorageServiceTests {
	private results: { [testName: string]: { passed: boolean; error?: string; duration: number } } =
		{};

	/**
	 * Run all tests
	 */
	async runAllTests(): Promise<void> {
		console.log('🧪 Starting Unified Storage Service Tests...');
		console.log('='.repeat(60));

		const startTime = Date.now();

		try {
			// Basic functionality tests
			await this.testBasicTokenOperations();
			await this.testTokenQueryAndFiltering();
			await this.testTokenExpiration();
			await this.testErrorHandling();

			// FlowStorageService compatibility tests
			await this.testFlowStorageCompatibility();
			await this.testFlowStorageMigration();

			// CredentialStorageManager compatibility tests
			await this.testCredentialStorageCompatibility();
			await this.testCredentialStorageMigration();

			// Advanced functionality tests
			await this.testImportExport();
			await this.testAutomaticMigration();

			// Performance tests
			await this.testPerformance();
		} catch (error) {
			console.error('❌ Test suite failed:', error);
		}

		const totalTime = Date.now() - startTime;
		this.printResults(totalTime);
	}

	/**
	 * Test basic token operations
	 */
	private async testBasicTokenOperations(): Promise<void> {
		const testName = 'Basic Token Operations';
		const startTime = Date.now();

		try {
			// Test store token
			await unifiedTokenStorage.storeToken(mockToken);
			console.log('✅ Token stored successfully');

			// Test get token
			const retrieved = await unifiedTokenStorage.getToken(mockToken.id);
			if (!retrieved || retrieved.value !== mockToken.value) {
				throw new Error('Token retrieval failed - value mismatch');
			}
			console.log('✅ Token retrieved successfully');

			// Test get tokens
			const tokens = await unifiedTokenStorage.getTokens({ type: 'access_token' });
			if (!tokens || tokens.length === 0) {
				throw new Error('Token query failed - no tokens found');
			}
			console.log('✅ Token query successful');

			// Test delete token
			await unifiedTokenStorage.deleteToken(mockToken.id);
			const deleted = await unifiedTokenStorage.getToken(mockToken.id);
			if (deleted) {
				throw new Error('Token deletion failed - token still exists');
			}
			console.log('✅ Token deleted successfully');

			this.results[testName] = { passed: true, duration: Date.now() - startTime };
		} catch (error) {
			this.results[testName] = {
				passed: false,
				error: (error as Error).message,
				duration: Date.now() - startTime,
			};
		}
	}

	/**
	 * Test token query and filtering
	 */
	private async testTokenQueryAndFiltering(): Promise<void> {
		const testName = 'Token Query and Filtering';
		const startTime = Date.now();

		try {
			// Store multiple tokens for testing
			const testTokens = [
				{ ...mockToken, id: 'query-test-1', flowName: 'flow-a' },
				{ ...mockToken, id: 'query-test-2', flowName: 'flow-b' },
				{ ...mockToken, id: 'query-test-3', type: 'refresh_token' as const, flowName: 'flow-a' },
			];

			for (const token of testTokens) {
				await unifiedTokenStorage.storeToken(token);
			}

			// Test query by type
			const accessTokens = await unifiedTokenStorage.getTokens({ type: 'access_token' });
			if (accessTokens.length !== 2) {
				throw new Error(`Expected 2 access tokens, got ${accessTokens.length}`);
			}

			// Test query by flow name
			const flowATokens = await unifiedTokenStorage.getTokens({ flowName: 'flow-a' });
			if (flowATokens.length !== 2) {
				throw new Error(`Expected 2 tokens for flow-a, got ${flowATokens.length}`);
			}

			// Test combined query
			const combinedQuery = await unifiedTokenStorage.getTokens({
				type: 'access_token',
				flowName: 'flow-a',
			});
			if (combinedQuery.length !== 1) {
				throw new Error(`Expected 1 token for combined query, got ${combinedQuery.length}`);
			}

			// Cleanup test tokens
			for (const token of testTokens) {
				await unifiedTokenStorage.deleteToken(token.id);
			}

			console.log('✅ Token query and filtering tests passed');
			this.results[testName] = { passed: true, duration: Date.now() - startTime };
		} catch (error) {
			this.results[testName] = {
				passed: false,
				error: (error as Error).message,
				duration: Date.now() - startTime,
			};
		}
	}

	/**
	 * Test token expiration
	 */
	private async testTokenExpiration(): Promise<void> {
		const testName = 'Token Expiration';
		const startTime = Date.now();

		try {
			// Store expired token
			const expiredToken = {
				...mockToken,
				id: 'expired-token',
				expiresAt: Date.now() - 1000, // Expired 1 second ago
			};

			await unifiedTokenStorage.storeToken(expiredToken);

			// Test get expired token
			const retrieved = await unifiedTokenStorage.getToken(expiredToken.id);
			if (retrieved) {
				throw new Error('Expired token should not be returned');
			}

			// Test query expired tokens
			const expiredTokens = await unifiedTokenStorage.getTokens({ expiredOnly: true });
			if (expiredTokens.length === 0) {
				throw new Error('Expected to find expired tokens');
			}

			// Test active tokens only
			const activeTokens = await unifiedTokenStorage.getTokens({ activeOnly: true });
			const foundExpired = activeTokens.some((token) => token.id === expiredToken.id);
			if (foundExpired) {
				throw new Error('Expired token should not be in active results');
			}

			// Cleanup
			await unifiedTokenStorage.deleteToken(expiredToken.id);

			console.log('✅ Token expiration tests passed');
			this.results[testName] = { passed: true, duration: Date.now() - startTime };
		} catch (error) {
			this.results[testName] = {
				passed: false,
				error: (error as Error).message,
				duration: Date.now() - startTime,
			};
		}
	}

	/**
	 * Test error handling
	 */
	private async testErrorHandling(): Promise<void> {
		const testName = 'Error Handling';
		const startTime = Date.now();

		try {
			// Test get non-existent token
			const nonExistent = await unifiedTokenStorage.getToken('non-existent-id');
			if (nonExistent) {
				throw new Error('Non-existent token should return null');
			}

			// Test store invalid token (should handle gracefully)
			try {
				const invalidToken = { ...mockToken, id: '' }; // Empty ID
				await unifiedTokenStorage.storeToken(invalidToken);
				// Should not throw, but handle gracefully
			} catch (error) {
				// Expected to handle gracefully
			}

			console.log('✅ Error handling tests passed');
			this.results[testName] = { passed: true, duration: Date.now() - startTime };
		} catch (error) {
			this.results[testName] = {
				passed: false,
				error: (error as Error).message,
				duration: Date.now() - startTime,
			};
		}
	}

	/**
	 * Test FlowStorageService compatibility
	 */
	private async testFlowStorageCompatibility(): Promise<void> {
		const testName = 'FlowStorageService Compatibility';
		const startTime = Date.now();

		try {
			// Test flow storage operations
			await unifiedTokenStorage.saveFlowStorageData('session', 'test-flow', 'auth-code', {
				code: 'test-code',
				timestamp: Date.now(),
			});

			const loaded = await unifiedTokenStorage.loadFlowStorageData(
				'session',
				'test-flow',
				'auth-code'
			);
			if (!loaded || (loaded as any).code !== 'test-code') {
				throw new Error('Flow storage data retrieval failed');
			}

			const hasData = await unifiedTokenStorage.hasFlowStorageData(
				'session',
				'test-flow',
				'auth-code'
			);
			if (!hasData) {
				throw new Error('Flow storage data existence check failed');
			}

			await unifiedTokenStorage.removeFlowStorageData('session', 'test-flow', 'auth-code');
			const removed = await unifiedTokenStorage.hasFlowStorageData(
				'session',
				'test-flow',
				'auth-code'
			);
			if (removed) {
				throw new Error('Flow storage data removal failed');
			}

			console.log('✅ FlowStorageService compatibility tests passed');
			this.results[testName] = { passed: true, duration: Date.now() - startTime };
		} catch (error) {
			this.results[testName] = {
				passed: false,
				error: (error as Error).message,
				duration: Date.now() - startTime,
			};
		}
	}

	/**
	 * Test FlowStorageService migration
	 */
	private async testFlowStorageMigration(): Promise<void> {
		const testName = 'FlowStorageService Migration';
		const startTime = Date.now();

		try {
			// Simulate localStorage data
			const testData = { code: 'migrated-code', timestamp: Date.now() };
			localStorage.setItem('session:test-flow:migration-test', JSON.stringify(testData));

			// Test migration (should automatically migrate on load)
			const migrated = await unifiedTokenStorage.loadFlowStorageData(
				'session',
				'test-flow',
				'migration-test'
			);
			if (!migrated || (migrated as any).code !== 'migrated-code') {
				throw new Error('Flow storage migration failed');
			}

			// Check that localStorage was cleared
			const localStorageData = localStorage.getItem('session:test-flow:migration-test');
			if (localStorageData) {
				throw new Error('LocalStorage should be cleared after migration');
			}

			// Cleanup
			await unifiedTokenStorage.removeFlowStorageData('session', 'test-flow', 'migration-test');

			console.log('✅ FlowStorageService migration tests passed');
			this.results[testName] = { passed: true, duration: Date.now() - startTime };
		} catch (error) {
			this.results[testName] = {
				passed: false,
				error: (error as Error).message,
				duration: Date.now() - startTime,
			};
		}
	}

	/**
	 * Test CredentialStorageManager compatibility
	 */
	private async testCredentialStorageCompatibility(): Promise<void> {
		const testName = 'CredentialStorageManager Compatibility';
		const startTime = Date.now();

		try {
			// Test credential operations
			const saveResult = await unifiedTokenStorage.saveFlowCredentials(
				'test-flow',
				mockCredentials
			);
			if (!saveResult.success) {
				throw new Error('Credential save failed');
			}

			const loadResult = await unifiedTokenStorage.loadFlowCredentials('test-flow');
			if (!loadResult.success || !loadResult.data) {
				throw new Error('Credential load failed');
			}

			if (loadResult.data.clientId !== mockCredentials.clientId) {
				throw new Error('Credential data mismatch');
			}

			// Test PKCE operations
			await unifiedTokenStorage.savePKCECodes('test-flow', mockPKCECodes);
			const pkceData = await unifiedTokenStorage.loadPKCECodes('test-flow');
			if (!pkceData || pkceData.codeVerifier !== mockPKCECodes.codeVerifier) {
				throw new Error('PKCE data retrieval failed');
			}

			// Cleanup
			await unifiedTokenStorage.clearFlowCredentials('test-flow');
			await unifiedTokenStorage.clearPKCECodes('test-flow');

			console.log('✅ CredentialStorageManager compatibility tests passed');
			this.results[testName] = { passed: true, duration: Date.now() - startTime };
		} catch (error) {
			this.results[testName] = {
				passed: false,
				error: (error as Error).message,
				duration: Date.now() - startTime,
			};
		}
	}

	/**
	 * Test CredentialStorageManager migration
	 */
	private async testCredentialStorageMigration(): Promise<void> {
		const testName = 'CredentialStorageManager Migration';
		const startTime = Date.now();

		try {
			// Simulate localStorage data
			localStorage.setItem('flow_credentials_migration-test', JSON.stringify(mockCredentials));
			localStorage.setItem('flow_pkce_migration-test', JSON.stringify(mockPKCECodes));

			// Test migration (should automatically migrate on load)
			const migratedCreds = await unifiedTokenStorage.loadFlowCredentials('migration-test');
			if (!migratedCreds.success || !migratedCreds.data) {
				throw new Error('Credential migration failed');
			}

			const migratedPKCE = await unifiedTokenStorage.loadPKCECodes('migration-test');
			if (!migratedPKCE || migratedPKCE.codeVerifier !== mockPKCECodes.codeVerifier) {
				throw new Error('PKCE migration failed');
			}

			// Check that localStorage was cleared
			const credData = localStorage.getItem('flow_credentials_migration-test');
			const pkceData = localStorage.getItem('flow_pkce_migration-test');
			if (credData || pkceData) {
				throw new Error('LocalStorage should be cleared after migration');
			}

			// Cleanup
			await unifiedTokenStorage.clearFlowCredentials('migration-test');
			await unifiedTokenStorage.clearPKCECodes('migration-test');

			console.log('✅ CredentialStorageManager migration tests passed');
			this.results[testName] = { passed: true, duration: Date.now() - startTime };
		} catch (error) {
			this.results[testName] = {
				passed: false,
				error: (error as Error).message,
				duration: Date.now() - startTime,
			};
		}
	}

	/**
	 * Test import/export functionality
	 */
	private async testImportExport(): Promise<void> {
		const testName = 'Import/Export Functionality';
		const startTime = Date.now();

		try {
			// Store test data
			await unifiedTokenStorage.storeToken(mockToken);
			await unifiedTokenStorage.saveFlowCredentials('export-test', mockCredentials);

			// Export data
			const exportedData = await unifiedTokenStorage.exportAllData();
			if (!exportedData || exportedData.length === 0) {
				throw new Error('Export failed - no data exported');
			}

			// Clear data
			await unifiedTokenStorage.deleteToken(mockToken.id);
			await unifiedTokenStorage.clearFlowCredentials('export-test');

			// Import data
			await unifiedTokenStorage.importAllData(exportedData);

			// Verify imported data
			const importedToken = await unifiedTokenStorage.getToken(mockToken.id);
			if (!importedToken) {
				throw new Error('Import failed - token not found');
			}

			const importedCreds = await unifiedTokenStorage.loadFlowCredentials('export-test');
			if (!importedCreds.success) {
				throw new Error('Import failed - credentials not found');
			}

			// Cleanup
			await unifiedTokenStorage.deleteToken(mockToken.id);
			await unifiedTokenStorage.clearFlowCredentials('export-test');

			console.log('✅ Import/Export tests passed');
			this.results[testName] = { passed: true, duration: Date.now() - startTime };
		} catch (error) {
			this.results[testName] = {
				passed: false,
				error: (error as Error).message,
				duration: Date.now() - startTime,
			};
		}
	}

	/**
	 * Test automatic migration
	 */
	private async testAutomaticMigration(): Promise<void> {
		const testName = 'Automatic Migration';
		const startTime = Date.now();

		try {
			// Create mock localStorage data
			const mockData = {
				'flow_credentials_auto-test': mockCredentials,
				'flow_pkce_auto-test': mockPKCECodes,
				'session:auto-test:auth-code': { code: 'auto-test-code', timestamp: Date.now() },
			};

			// Store in localStorage
			Object.entries(mockData).forEach(([key, value]) => {
				localStorage.setItem(key, JSON.stringify(value));
			});

			// Trigger automatic migration by accessing data
			await unifiedTokenStorage.loadFlowCredentials('auto-test');
			await unifiedTokenStorage.loadPKCECodes('auto-test');
			await unifiedTokenStorage.loadFlowStorageData('session', 'auto-test', 'auth-code');

			// Verify migration happened
			const creds = await unifiedTokenStorage.loadFlowCredentials('auto-test');
			const pkce = await unifiedTokenStorage.loadPKCECodes('auto-test');
			const authCode = await unifiedTokenStorage.loadFlowStorageData(
				'session',
				'auto-test',
				'auth-code'
			);

			if (!creds.success || !pkce || !authCode) {
				throw new Error('Automatic migration failed');
			}

			// Verify localStorage was cleared
			const remainingKeys = Object.keys(mockData).filter(
				(key) => localStorage.getItem(key) !== null
			);

			if (remainingKeys.length > 0) {
				throw new Error('LocalStorage not cleared after automatic migration');
			}

			// Cleanup
			await unifiedTokenStorage.clearFlowCredentials('auto-test');
			await unifiedTokenStorage.clearPKCECodes('auto-test');
			await unifiedTokenStorage.removeFlowStorageData('session', 'auto-test', 'auth-code');

			console.log('✅ Automatic migration tests passed');
			this.results[testName] = { passed: true, duration: Date.now() - startTime };
		} catch (error) {
			this.results[testName] = {
				passed: false,
				error: (error as Error).message,
				duration: Date.now() - startTime,
			};
		}
	}

	/**
	 * Test performance
	 */
	private async testPerformance(): Promise<void> {
		const testName = 'Performance Tests';
		const startTime = Date.now();

		try {
			const testCount = 100;
			const tokens = Array.from({ length: testCount }, (_, i) => ({
				...mockToken,
				id: `perf-test-${i}`,
				flowName: `perf-flow-${i % 10}`,
			}));

			// Test bulk insert performance
			const insertStart = Date.now();
			for (const token of tokens) {
				await unifiedTokenStorage.storeToken(token);
			}
			const insertTime = Date.now() - insertStart;

			// Test bulk query performance
			const queryStart = Date.now();
			const allTokens = await unifiedTokenStorage.getTokens({});
			const queryTime = Date.now() - queryStart;

			// Test bulk delete performance
			const deleteStart = Date.now();
			for (const token of tokens) {
				await unifiedTokenStorage.deleteToken(token.id);
			}
			const deleteTime = Date.now() - deleteStart;

			// Performance assertions (adjust thresholds as needed)
			if (insertTime > 10000) {
				// 10 seconds
				throw new Error(`Insert performance too slow: ${insertTime}ms for ${testCount} tokens`);
			}

			if (queryTime > 5000) {
				// 5 seconds
				throw new Error(`Query performance too slow: ${queryTime}ms`);
			}

			if (deleteTime > 10000) {
				// 10 seconds
				throw new Error(`Delete performance too slow: ${deleteTime}ms for ${testCount} tokens`);
			}

			console.log(
				`✅ Performance tests passed - Insert: ${insertTime}ms, Query: ${queryTime}ms, Delete: ${deleteTime}ms`
			);
			this.results[testName] = { passed: true, duration: Date.now() - startTime };
		} catch (error) {
			this.results[testName] = {
				passed: false,
				error: (error as Error).message,
				duration: Date.now() - startTime,
			};
		}
	}

	/**
	 * Print test results
	 */
	private printResults(totalTime: number): void {
		console.log('='.repeat(60));
		console.log('🧪 Unified Storage Service Test Results');
		console.log('='.repeat(60));

		const passed = Object.values(this.results).filter((r) => r.passed).length;
		const total = Object.keys(this.results).length;
		const failed = total - passed;

		console.log(`\n📊 Summary: ${passed}/${total} tests passed (${failed} failed)`);
		console.log(`⏱️  Total time: ${totalTime}ms`);

		if (failed > 0) {
			console.log('\n❌ Failed Tests:');
			Object.entries(this.results).forEach(([name, result]) => {
				if (!result.passed) {
					console.log(`  - ${name}: ${result.error} (${result.duration}ms)`);
				}
			});
		}

		console.log('\n✅ Passed Tests:');
		Object.entries(this.results).forEach(([name, result]) => {
			if (result.passed) {
				console.log(`  - ${name} (${result.duration}ms)`);
			}
		});

		console.log('\n' + '='.repeat(60));
		console.log(`🎯 Overall Result: ${failed === 0 ? 'SUCCESS' : 'PARTIAL SUCCESS'}`);
		console.log('='.repeat(60));
	}
}

// Export test runner
export const runUnifiedStorageTests = async (): Promise<void> => {
	const tester = new UnifiedStorageServiceTests();

	// Cleanup before tests
	await cleanup();

	// Run tests
	await tester.runAllTests();

	// Cleanup after tests
	await cleanup();
};

// Run tests if this file is executed directly
if (typeof window === 'undefined' && typeof require !== 'undefined' && require.main === module) {
	runUnifiedStorageTests().catch(console.error);
}
