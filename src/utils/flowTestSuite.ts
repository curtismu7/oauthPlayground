// src/utils/flowTestSuite.ts
// Comprehensive test suite for all OAuth/OIDC flows

import { regressionSafeguards, FlowTestResult, RegressionTestSuite } from './regressionSafeguards';
import { StepCredentials } from '../types/flowTypes';

export interface FlowTestConfig {
	flowName: string;
	credentials: StepCredentials;
	expectedTokens?: any;
	expectedBehavior?: string[];
	criticalSteps?: string[];
}

export interface TestSuiteResult {
	overallPassed: boolean;
	flows: Array<{
		flowName: string;
		passed: boolean;
		tests: FlowTestResult[];
		criticalFailures: string[];
	}>;
	summary: {
		totalFlows: number;
		passedFlows: number;
		failedFlows: number;
		criticalFailures: number;
	};
	timestamp: number;
}

/**
 * Comprehensive Flow Test Suite
 * Tests all OAuth/OIDC flows for regressions
 */
export class FlowTestSuite {
	private testConfigs: FlowTestConfig[] = [];
	private results: TestSuiteResult | null = null;

	constructor() {
		this.initializeDefaultTests();
	}

	/**
	 * Initialize default test configurations
	 */
	private initializeDefaultTests(): void {
		// ===== V7 OAuth 2.0 Flows =====
		
		// Authorization Code Flow V7
		this.testConfigs.push({
			flowName: 'oauth-authorization-code-v7',
			credentials: {
				environmentId: 'test-env',
				clientId: 'test-client',
				clientSecret: 'test-secret',
				redirectUri: 'https://localhost:3000/callback',
				scope: 'openid profile email',
				scopes: 'openid profile email',
				responseType: 'code',
				grantType: 'authorization_code',
				authorizationEndpoint: 'https://auth.pingone.com/as/authorize',
				tokenEndpoint: 'https://auth.pingone.com/as/token',
				clientAuthMethod: 'client_secret_post'
			},
			expectedBehavior: [
				'Should generate authorization URL',
				'Should handle authorization code exchange',
				'Should validate tokens'
			],
			criticalSteps: ['authorization-url', 'token-exchange', 'token-validation']
		});

		// Implicit Flow V7
		this.testConfigs.push({
			flowName: 'implicit-v7',
			credentials: {
				environmentId: 'test-env',
				clientId: 'test-client',
				clientSecret: '',
				redirectUri: 'https://localhost:3000/implicit-callback',
				scope: 'openid profile email',
				scopes: 'openid profile email',
				responseType: 'id_token token',
				grantType: 'implicit',
				authorizationEndpoint: 'https://auth.pingone.com/as/authorize',
				tokenEndpoint: '',
				clientAuthMethod: 'none'
			},
			expectedBehavior: [
				'Should generate implicit authorization URL',
				'Should process fragment tokens',
				'Should validate ID token'
			],
			criticalSteps: ['authorization-url', 'fragment-processing', 'id-token-validation']
		});

		// Device Authorization Flow V7
		this.testConfigs.push({
			flowName: 'device-authorization-v7',
			credentials: {
				environmentId: 'test-env',
				clientId: 'test-client',
				clientSecret: 'test-secret',
				redirectUri: '',
				scope: 'openid profile email',
				scopes: 'openid profile email',
				responseType: '',
				grantType: 'urn:ietf:params:oauth:grant-type:device_code',
				authorizationEndpoint: '',
				tokenEndpoint: 'https://auth.pingone.com/as/token',
				clientAuthMethod: 'client_secret_post'
			},
			expectedBehavior: [
				'Should initiate device authorization',
				'Should handle device code polling',
				'Should exchange device code for tokens'
			],
			criticalSteps: ['device-authorization', 'device-code-polling', 'token-exchange']
		});

		// Client Credentials Flow V7
		this.testConfigs.push({
			flowName: 'client-credentials-v7',
			credentials: {
				environmentId: 'test-env',
				clientId: 'test-client',
				clientSecret: 'test-secret',
				redirectUri: '',
				scope: 'openid',
				scopes: 'openid',
				responseType: '',
				grantType: 'client_credentials',
				authorizationEndpoint: '',
				tokenEndpoint: 'https://auth.pingone.com/as/token',
				clientAuthMethod: 'client_secret_post'
			},
			expectedBehavior: [
				'Should authenticate with client credentials',
				'Should request access token',
				'Should validate token response'
			],
			criticalSteps: ['client-authentication', 'token-request', 'token-validation']
		});

		// Resource Owner Password Credentials Flow V7
		this.testConfigs.push({
			flowName: 'oauth-ropc-v7',
			credentials: {
				environmentId: 'test-env',
				clientId: 'test-client',
				clientSecret: 'test-secret',
				redirectUri: '',
				scope: 'openid profile email',
				scopes: 'openid profile email',
				responseType: '',
				grantType: 'password',
				authorizationEndpoint: '',
				tokenEndpoint: 'https://auth.pingone.com/as/token',
				clientAuthMethod: 'client_secret_post'
			},
			expectedBehavior: [
				'Should authenticate with username/password',
				'Should request access token',
				'Should validate token response'
			],
			criticalSteps: ['user-authentication', 'token-request', 'token-validation']
		});

		// Token Exchange Flow V7
		this.testConfigs.push({
			flowName: 'token-exchange-v7',
			credentials: {
				environmentId: 'test-env',
				clientId: 'test-client',
				clientSecret: 'test-secret',
				redirectUri: '',
				scope: 'openid profile email',
				scopes: 'openid profile email',
				responseType: '',
				grantType: 'urn:ietf:params:oauth:grant-type:token-exchange',
				authorizationEndpoint: '',
				tokenEndpoint: 'https://auth.pingone.com/as/token',
				clientAuthMethod: 'client_secret_post'
			},
			expectedBehavior: [
				'Should exchange existing token for new token',
				'Should validate token exchange request',
				'Should return new token'
			],
			criticalSteps: ['token-exchange-request', 'token-validation', 'new-token-response']
		});

		// JWT Bearer Token Flow V7
		this.testConfigs.push({
			flowName: 'jwt-bearer-token-v7',
			credentials: {
				environmentId: 'test-env',
				clientId: 'test-client',
				clientSecret: 'test-secret',
				redirectUri: '',
				scope: 'openid profile email',
				scopes: 'openid profile email',
				responseType: '',
				grantType: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
				authorizationEndpoint: '',
				tokenEndpoint: 'https://auth.pingone.com/as/token',
				clientAuthMethod: 'client_secret_post'
			},
			expectedBehavior: [
				'Should authenticate with JWT assertion',
				'Should validate JWT signature',
				'Should exchange JWT for access token'
			],
			criticalSteps: ['jwt-assertion', 'jwt-validation', 'token-exchange']
		});

		// ===== V7 OIDC Flows =====

		// OIDC Authorization Code Flow V7
		this.testConfigs.push({
			flowName: 'oidc-authorization-code-v7',
			credentials: {
				environmentId: 'test-env',
				clientId: 'test-client',
				clientSecret: 'test-secret',
				redirectUri: 'https://localhost:3000/oidc-callback',
				scope: 'openid profile email',
				scopes: 'openid profile email',
				responseType: 'code',
				grantType: 'authorization_code',
				authorizationEndpoint: 'https://auth.pingone.com/as/authorize',
				tokenEndpoint: 'https://auth.pingone.com/as/token',
				clientAuthMethod: 'client_secret_post'
			},
			expectedBehavior: [
				'Should generate OIDC authorization URL',
				'Should handle authorization code exchange',
				'Should validate ID token and access token'
			],
			criticalSteps: ['authorization-url', 'token-exchange', 'id-token-validation']
		});

		// OIDC Implicit Flow V7
		this.testConfigs.push({
			flowName: 'oidc-implicit-v7',
			credentials: {
				environmentId: 'test-env',
				clientId: 'test-client',
				clientSecret: '',
				redirectUri: 'https://localhost:3000/oidc-implicit-callback',
				scope: 'openid profile email',
				scopes: 'openid profile email',
				responseType: 'id_token token',
				grantType: 'implicit',
				authorizationEndpoint: 'https://auth.pingone.com/as/authorize',
				tokenEndpoint: '',
				clientAuthMethod: 'none'
			},
			expectedBehavior: [
				'Should generate OIDC implicit authorization URL',
				'Should process fragment tokens',
				'Should validate ID token'
			],
			criticalSteps: ['authorization-url', 'fragment-processing', 'id-token-validation']
		});

		// OIDC Hybrid Flow V7
		this.testConfigs.push({
			flowName: 'oidc-hybrid-v7',
			credentials: {
				environmentId: 'test-env',
				clientId: 'test-client',
				clientSecret: 'test-secret',
				redirectUri: 'https://localhost:3000/oidc-hybrid-callback',
				scope: 'openid profile email',
				scopes: 'openid profile email',
				responseType: 'code id_token',
				grantType: 'authorization_code',
				authorizationEndpoint: 'https://auth.pingone.com/as/authorize',
				tokenEndpoint: 'https://auth.pingone.com/as/token',
				clientAuthMethod: 'client_secret_post'
			},
			expectedBehavior: [
				'Should generate OIDC hybrid authorization URL',
				'Should process fragment tokens',
				'Should exchange authorization code',
				'Should merge tokens'
			],
			criticalSteps: ['authorization-url', 'fragment-processing', 'token-exchange', 'token-merging']
		});

		// OIDC Device Authorization Flow V7
		this.testConfigs.push({
			flowName: 'oidc-device-authorization-v7',
			credentials: {
				environmentId: 'test-env',
				clientId: 'test-client',
				clientSecret: 'test-secret',
				redirectUri: '',
				scope: 'openid profile email',
				scopes: 'openid profile email',
				responseType: '',
				grantType: 'urn:ietf:params:oauth:grant-type:device_code',
				authorizationEndpoint: '',
				tokenEndpoint: 'https://auth.pingone.com/as/token',
				clientAuthMethod: 'client_secret_post'
			},
			expectedBehavior: [
				'Should initiate OIDC device authorization',
				'Should handle device code polling',
				'Should exchange device code for ID token and access token'
			],
			criticalSteps: ['device-authorization', 'device-code-polling', 'token-exchange']
		});

		// OIDC CIBA Flow V7
		this.testConfigs.push({
			flowName: 'ciba-v7',
			credentials: {
				environmentId: 'test-env',
				clientId: 'test-client',
				clientSecret: 'test-secret',
				redirectUri: '',
				scope: 'openid profile email',
				scopes: 'openid profile email',
				responseType: '',
				grantType: 'urn:openid:params:grant-type:ciba',
				authorizationEndpoint: '',
				tokenEndpoint: 'https://auth.pingone.com/as/token',
				clientAuthMethod: 'client_secret_post'
			},
			expectedBehavior: [
				'Should initiate CIBA authentication',
				'Should handle backchannel authentication',
				'Should exchange CIBA grant for tokens'
			],
			criticalSteps: ['ciba-initiation', 'backchannel-auth', 'token-exchange']
		});

		// ===== V7 PingOne Specific Flows =====

		// PingOne PAR Flow V7
		this.testConfigs.push({
			flowName: 'pingone-par-v7',
			credentials: {
				environmentId: 'test-env',
				clientId: 'test-client',
				clientSecret: 'test-secret',
				redirectUri: 'https://localhost:3000/par-callback',
				scope: 'openid profile email',
				scopes: 'openid profile email',
				responseType: 'code',
				grantType: 'authorization_code',
				authorizationEndpoint: 'https://auth.pingone.com/as/authorize',
				tokenEndpoint: 'https://auth.pingone.com/as/token',
				clientAuthMethod: 'client_secret_post'
			},
			expectedBehavior: [
				'Should create PAR request',
				'Should handle PAR authorization',
				'Should exchange authorization code for tokens'
			],
			criticalSteps: ['par-request', 'par-authorization', 'token-exchange']
		});

		// PingOne MFA Flow V7
		this.testConfigs.push({
			flowName: 'pingone-mfa-v7',
			credentials: {
				environmentId: 'test-env',
				clientId: 'test-client',
				clientSecret: 'test-secret',
				redirectUri: 'https://localhost:3000/mfa-callback',
				scope: 'openid profile email',
				scopes: 'openid profile email',
				responseType: 'code',
				grantType: 'authorization_code',
				authorizationEndpoint: 'https://auth.pingone.com/as/authorize',
				tokenEndpoint: 'https://auth.pingone.com/as/token',
				clientAuthMethod: 'client_secret_post'
			},
			expectedBehavior: [
				'Should initiate MFA authentication',
				'Should handle MFA challenges',
				'Should complete MFA flow'
			],
			criticalSteps: ['mfa-initiation', 'mfa-challenges', 'mfa-completion']
		});

		// ===== V7 Mock Flows =====

		// RAR Flow V7 (Mock)
		this.testConfigs.push({
			flowName: 'rar-v7',
			credentials: {
				environmentId: 'test-env',
				clientId: 'test-client',
				clientSecret: 'test-secret',
				redirectUri: 'https://localhost:3000/rar-callback',
				scope: 'openid profile email',
				scopes: 'openid profile email',
				responseType: 'code',
				grantType: 'authorization_code',
				authorizationEndpoint: 'https://auth.pingone.com/as/authorize',
				tokenEndpoint: 'https://auth.pingone.com/as/token',
				clientAuthMethod: 'client_secret_post'
			},
			expectedBehavior: [
				'Should handle Rich Authorization Requests',
				'Should process RAR parameters',
				'Should validate RAR authorization'
			],
			criticalSteps: ['rar-request', 'rar-validation', 'authorization']
		});
	}

	/**
	 * Run comprehensive test suite
	 */
	async runTestSuite(): Promise<TestSuiteResult> {
		console.log('[Flow Test Suite] Starting comprehensive test suite...');
		
		const flows: Array<{
			flowName: string;
			passed: boolean;
			tests: FlowTestResult[];
			criticalFailures: string[];
		}> = [];

		let totalFlows = 0;
		let passedFlows = 0;
		let failedFlows = 0;
		let criticalFailures = 0;

		// Test each flow configuration
		for (const config of this.testConfigs) {
			console.log(`[Flow Test Suite] Testing ${config.flowName}...`);
			
			try {
				// Run validation suite
				const testSuite = await regressionSafeguards.runValidationSuite(
					config.flowName,
					config.credentials,
					config.expectedTokens
				);

				// Check for critical failures
				const criticalFailuresList = testSuite.tests
					.filter(test => !test.passed && config.criticalSteps?.includes(test.step))
					.map(test => test.step);

				const flowResult = {
					flowName: config.flowName,
					passed: testSuite.overallPassed,
					tests: testSuite.tests,
					criticalFailures: criticalFailuresList
				};

				flows.push(flowResult);
				totalFlows++;

				if (testSuite.overallPassed) {
					passedFlows++;
				} else {
					failedFlows++;
				}

				if (criticalFailuresList.length > 0) {
					criticalFailures++;
				}

				console.log(`[Flow Test Suite] ${config.flowName}: ${testSuite.overallPassed ? 'PASSED' : 'FAILED'}`);
				if (criticalFailuresList.length > 0) {
					console.error(`[Flow Test Suite] Critical failures in ${config.flowName}:`, criticalFailuresList);
				}

			} catch (error) {
				console.error(`[Flow Test Suite] Error testing ${config.flowName}:`, error);
				
				flows.push({
					flowName: config.flowName,
					passed: false,
					tests: [],
					criticalFailures: ['test-execution-error']
				});
				
				totalFlows++;
				failedFlows++;
				criticalFailures++;
			}
		}

		// Compile results
		this.results = {
			overallPassed: criticalFailures === 0 && failedFlows === 0,
			flows,
			summary: {
				totalFlows,
				passedFlows,
				failedFlows,
				criticalFailures
			},
			timestamp: Date.now()
		};

		console.log('[Flow Test Suite] Test suite completed:', this.results.summary);
		return this.results;
	}

	/**
	 * Run tests for a specific flow
	 */
	async runFlowTest(flowName: string): Promise<RegressionTestSuite | null> {
		const config = this.testConfigs.find(c => c.flowName === flowName);
		if (!config) {
			console.error(`[Flow Test Suite] No configuration found for flow: ${flowName}`);
			return null;
		}

		console.log(`[Flow Test Suite] Testing specific flow: ${flowName}`);
		return await regressionSafeguards.runValidationSuite(
			flowName,
			config.credentials,
			config.expectedTokens
		);
	}

	/**
	 * Add custom test configuration
	 */
	addTestConfig(config: FlowTestConfig): void {
		this.testConfigs.push(config);
		console.log(`[Flow Test Suite] Added test configuration for ${config.flowName}`);
	}

	/**
	 * Get test results
	 */
	getResults(): TestSuiteResult | null {
		return this.results;
	}

	/**
	 * Get health status
	 */
	getHealthStatus(): {
		overall: 'healthy' | 'warning' | 'critical';
		flows: Array<{ name: string; status: 'healthy' | 'warning' | 'critical' }>;
		criticalIssues: string[];
	} {
		if (!this.results) {
			return {
				overall: 'warning',
				flows: [],
				criticalIssues: ['No test results available']
			};
		}

		const criticalIssues: string[] = [];
		const flows = this.results.flows.map(flow => {
			let status: 'healthy' | 'warning' | 'critical' = 'healthy';
			
			if (flow.criticalFailures.length > 0) {
				status = 'critical';
				criticalIssues.push(`${flow.flowName}: ${flow.criticalFailures.join(', ')}`);
			} else if (!flow.passed) {
				status = 'warning';
			}

			return {
				name: flow.flowName,
				status
			};
		});

		const overall: 'healthy' | 'warning' | 'critical' = 
			criticalIssues.length > 0 ? 'critical' :
			this.results.summary.failedFlows > 0 ? 'warning' : 'healthy';

		return {
			overall,
			flows,
			criticalIssues
		};
	}

	/**
	 * Generate test report
	 */
	generateReport(): string {
		if (!this.results) {
			return 'No test results available';
		}

		const { summary, flows } = this.results;
		
		let report = `# Flow Test Suite Report\n\n`;
		report += `**Generated:** ${new Date(this.results.timestamp).toISOString()}\n\n`;
		report += `## Summary\n\n`;
		report += `- **Total Flows:** ${summary.totalFlows}\n`;
		report += `- **Passed:** ${summary.passedFlows}\n`;
		report += `- **Failed:** ${summary.failedFlows}\n`;
		report += `- **Critical Failures:** ${summary.criticalFailures}\n\n`;
		
		report += `## Flow Results\n\n`;
		flows.forEach(flow => {
			report += `### ${flow.flowName}\n`;
			report += `- **Status:** ${flow.passed ? '✅ PASSED' : '❌ FAILED'}\n`;
			if (flow.criticalFailures.length > 0) {
				report += `- **Critical Failures:** ${flow.criticalFailures.join(', ')}\n`;
			}
			report += `- **Tests:** ${flow.tests.length}\n`;
			report += `- **Passed Tests:** ${flow.tests.filter(t => t.passed).length}\n\n`;
		});

		return report;
	}

	/**
	 * Clear test results
	 */
	clearResults(): void {
		this.results = null;
		regressionSafeguards.clearTestResults();
	}
}

// Export singleton instance
export const flowTestSuite = new FlowTestSuite();
