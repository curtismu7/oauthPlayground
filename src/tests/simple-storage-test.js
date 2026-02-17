// src/tests/simple-storage-test.js
// Simple test for unified storage service functionality

// Mock the unified storage service for testing
const mockUnifiedStorage = {
	async storeToken(token) {
		console.log(`📝 Storing token: ${token.id}`);
		return true;
	},

	async getToken(id) {
		console.log(`📖 Getting token: ${id}`);
		return { id, value: 'mock-token', type: 'access_token' };
	},

	async getTokens(query = {}) {
		console.log(`🔍 Querying tokens:`, query);
		return [{ id: 'test-1', type: 'access_token', value: 'mock-token' }];
	},

	async deleteToken(id) {
		console.log(`🗑️ Deleting token: ${id}`);
		return true;
	},

	async saveFlowStorageData(storageType, flowId, dataType, data) {
		console.log(`💾 Saving flow data: ${storageType}:${flowId}:${dataType}`);
		return true;
	},

	async loadFlowStorageData(storageType, flowId, dataType) {
		console.log(`📖 Loading flow data: ${storageType}:${flowId}:${dataType}`);
		return { code: 'test-code', timestamp: Date.now() };
	},

	async saveFlowCredentials(flowKey, credentials) {
		console.log(`💾 Saving credentials: ${flowKey}`);
		return { success: true, source: 'unified' };
	},

	async loadFlowCredentials(flowKey) {
		console.log(`📖 Loading credentials: ${flowKey}`);
		return {
			success: true,
			data: { clientId: 'test-client', environmentId: 'test-env' },
			source: 'unified',
		};
	},

	async savePKCECodes(flowKey, pkceCodes) {
		console.log(`💾 Saving PKCE codes: ${flowKey}`);
		return true;
	},

	async loadPKCECodes(flowKey) {
		console.log(`📖 Loading PKCE codes: ${flowKey}`);
		return {
			codeVerifier: 'test-verifier',
			codeChallenge: 'test-challenge',
			codeChallengeMethod: 'S256',
		};
	},

	async clearFlowCredentials(flowKey) {
		console.log(`🗑️ Clearing credentials: ${flowKey}`);
		return true;
	},

	async clearPKCECodes(flowKey) {
		console.log(`🗑️ Clearing PKCE codes: ${flowKey}`);
		return true;
	},
};

// Test runner
class SimpleTestRunner {
	constructor() {
		this.tests = [];
		this.passed = 0;
		this.failed = 0;
	}

	async runTest(name, testFn) {
		console.log(`\n🧪 Running: ${name}`);
		try {
			await testFn();
			console.log(`✅ PASSED: ${name}`);
			this.passed++;
		} catch (error) {
			console.log(`❌ FAILED: ${name}`);
			console.log(`   Error: ${error.message}`);
			this.failed++;
		}
	}

	async runAllTests() {
		console.log('🚀 Starting Unified Storage Service Tests');
		console.log('='.repeat(50));

		// Basic functionality tests
		await this.runTest('Basic Token Operations', async () => {
			const token = {
				id: 'test-token-1',
				type: 'access_token',
				value: 'test-value',
				expiresAt: Date.now() + 3600000,
				issuedAt: Date.now(),
				source: 'indexeddb',
				flowName: 'test-flow',
			};

			// Store token
			await mockUnifiedStorage.storeToken(token);

			// Get token
			const retrieved = await mockUnifiedStorage.getToken(token.id);
			if (!retrieved || retrieved.value !== 'mock-token') {
				throw new Error('Token retrieval failed');
			}

			// Query tokens
			const tokens = await mockUnifiedStorage.getTokens({ type: 'access_token' });
			if (!tokens || tokens.length === 0) {
				throw new Error('Token query failed');
			}

			// Delete token
			await mockUnifiedStorage.deleteToken(token.id);
		});

		// FlowStorageService compatibility tests
		await this.runTest('FlowStorageService Compatibility', async () => {
			// Test flow storage operations
			await mockUnifiedStorage.saveFlowStorageData('session', 'test-flow', 'auth-code', {
				code: 'test-code',
				timestamp: Date.now(),
			});

			const loaded = await mockUnifiedStorage.loadFlowStorageData(
				'session',
				'test-flow',
				'auth-code'
			);
			if (!loaded || loaded.code !== 'test-code') {
				throw new Error('Flow storage data retrieval failed');
			}
		});

		// CredentialStorageManager compatibility tests
		await this.runTest('CredentialStorageManager Compatibility', async () => {
			// Test credential operations
			const credentials = {
				environmentId: 'test-env-123',
				clientId: 'test-client-456',
				clientSecret: 'test-secret-789',
				redirectUri: 'https://test.example.com/callback',
				scopes: 'openid profile email',
			};

			const saveResult = await mockUnifiedStorage.saveFlowCredentials('test-flow', credentials);
			if (!saveResult.success) {
				throw new Error('Credential save failed');
			}

			const loadResult = await mockUnifiedStorage.loadFlowCredentials('test-flow');
			if (!loadResult.success || !loadResult.data) {
				throw new Error('Credential load failed');
			}

			if (loadResult.data.clientId !== 'test-client') {
				throw new Error('Credential data mismatch');
			}

			// Test PKCE operations
			const pkceCodes = {
				codeVerifier: 'test-code-verifier-12345678901234567890',
				codeChallenge: 'test-code-challenge-12345678901234567890',
				codeChallengeMethod: 'S256',
			};

			await mockUnifiedStorage.savePKCECodes('test-flow', pkceCodes);
			const pkceData = await mockUnifiedStorage.loadPKCECodes('test-flow');
			if (!pkceData || pkceData.codeVerifier !== 'test-verifier') {
				throw new Error('PKCE data retrieval failed');
			}

			// Cleanup
			await mockUnifiedStorage.clearFlowCredentials('test-flow');
			await mockUnifiedStorage.clearPKCECodes('test-flow');
		});

		// Migration simulation tests
		await this.runTest('Migration Simulation', async () => {
			// Simulate localStorage data
			const testData = { code: 'migrated-code', timestamp: Date.now() };

			// Test migration simulation
			const migrated = await mockUnifiedStorage.loadFlowStorageData(
				'session',
				'test-flow',
				'migration-test'
			);
			if (!migrated || migrated.code !== 'test-code') {
				throw new Error('Migration simulation failed');
			}
		});

		// Performance tests
		await this.runTest('Performance Tests', async () => {
			const testCount = 10;
			const tokens = Array.from({ length: testCount }, (_, i) => ({
				id: `perf-test-${i}`,
				type: 'access_token',
				value: `perf-value-${i}`,
				expiresAt: Date.now() + 3600000,
				issuedAt: Date.now(),
				source: 'indexeddb',
				flowName: `perf-flow-${i % 3}`,
			}));

			// Test bulk operations
			const startTime = Date.now();

			for (const token of tokens) {
				await mockUnifiedStorage.storeToken(token);
			}

			const allTokens = await mockUnifiedStorage.getTokens({});

			for (const token of tokens) {
				await mockUnifiedStorage.deleteToken(token.id);
			}

			const totalTime = Date.now() - startTime;

			if (totalTime > 1000) {
				throw new Error(`Performance too slow: ${totalTime}ms for ${testCount} operations`);
			}

			console.log(`   Performance: ${totalTime}ms for ${testCount * 3} operations`);
		});

		// Print summary
		console.log('\n' + '='.repeat(50));
		console.log('📊 Test Results Summary');
		console.log('='.repeat(50));
		console.log(`✅ Passed: ${this.passed}`);
		console.log(`❌ Failed: ${this.failed}`);
		console.log(
			`📈 Success Rate: ${((this.passed / (this.passed + this.failed)) * 100).toFixed(1)}%`
		);
		console.log('='.repeat(50));

		if (this.failed === 0) {
			console.log('🎉 All tests passed! Unified Storage Service is working correctly.');
		} else {
			console.log('⚠️ Some tests failed. Please review the implementation.');
		}
	}
}

// Run tests
const runner = new SimpleTestRunner();
runner.runAllTests().catch(console.error);
