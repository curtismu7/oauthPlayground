// src/utils/regressionSafeguards.ts
// Comprehensive regression safeguards for OAuth/OIDC flows

import { StepCredentials } from '../types/flowTypes';

export interface FlowTestResult {
	flowName: string;
	step: string;
	passed: boolean;
	error?: string;
	timestamp: number;
	duration: number;
}

export interface RegressionTestSuite {
	flowName: string;
	tests: FlowTestResult[];
	overallPassed: boolean;
	lastRun: number;
}

export interface SafeguardConfig {
	enableAutomatedTesting: boolean;
	enableSpecificationValidation: boolean;
	enableErrorMonitoring: boolean;
	enablePerformanceMonitoring: boolean;
	criticalFlows: string[];
	alertThresholds: {
		errorRate: number;
		responseTime: number;
		successRate: number;
	};
}

// Default safeguard configuration
export const DEFAULT_SAFEGUARD_CONFIG: SafeguardConfig = {
	enableAutomatedTesting: true,
	enableSpecificationValidation: true,
	enableErrorMonitoring: true,
	enablePerformanceMonitoring: true,
	criticalFlows: [
		'authorization-code-v7',
		'hybrid-v7',
		'client-credentials-v7',
		'implicit-v7',
		'device-authorization-v7',
	],
	alertThresholds: {
		errorRate: 0.05, // 5% error rate threshold
		responseTime: 5000, // 5 second response time threshold
		successRate: 0.95, // 95% success rate threshold
	},
};

/**
 * Regression Safeguards Manager
 * Provides comprehensive testing and validation to prevent regressions
 */
export class RegressionSafeguards {
	private config: SafeguardConfig;
	private testResults: Map<string, RegressionTestSuite> = new Map();
	private errorLog: Array<{ timestamp: number; error: string; context: any }> = [];

	constructor(config: SafeguardConfig = DEFAULT_SAFEGUARD_CONFIG) {
		this.config = config;
		this.initializeMonitoring();
	}

	/**
	 * Initialize monitoring systems
	 */
	private initializeMonitoring(): void {
		if (this.config.enableErrorMonitoring) {
			this.setupErrorMonitoring();
		}
		if (this.config.enablePerformanceMonitoring) {
			this.setupPerformanceMonitoring();
		}
	}

	/**
	 * Setup error monitoring
	 */
	private setupErrorMonitoring(): void {
		// Monitor unhandled errors
		window.addEventListener('error', (event) => {
			this.logError('Unhandled Error', {
				message: event.message,
				filename: event.filename,
				lineno: event.lineno,
				colno: event.colno,
				error: event.error,
			});
		});

		// Monitor unhandled promise rejections
		window.addEventListener('unhandledrejection', (event) => {
			this.logError('Unhandled Promise Rejection', {
				reason: event.reason,
				promise: event.promise,
			});
		});
	}

	/**
	 * Setup performance monitoring
	 */
	private setupPerformanceMonitoring(): void {
		// Monitor page load performance
		window.addEventListener('load', () => {
			const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
			if (perfData) {
				this.logPerformance('Page Load', {
					loadTime: perfData.loadEventEnd - perfData.loadEventStart,
					domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
					totalTime: perfData.loadEventEnd - perfData.fetchStart,
				});
			}
		});
	}

	/**
	 * Log error with context
	 */
	private logError(message: string, context: any): void {
		const errorEntry = {
			timestamp: Date.now(),
			error: message,
			context,
		};
		this.errorLog.push(errorEntry);

		// Keep only last 100 errors
		if (this.errorLog.length > 100) {
			this.errorLog = this.errorLog.slice(-100);
		}

		console.error(`[Regression Safeguard] ${message}`, context);
	}

	/**
	 * Log performance metrics
	 */
	private logPerformance(metric: string, data: any): void {
		console.log(`[Performance Monitor] ${metric}:`, data);
	}

	/**
	 * Validate OAuth 2.0 specification compliance
	 */
	validateOAuth2Compliance(
		flowName: string,
		credentials: StepCredentials,
		tokens: any
	): FlowTestResult {
		const startTime = Date.now();
		const step = 'oauth2-compliance';

		try {
			const errors: string[] = [];

			// Validate required fields
			if (!credentials.clientId) {
				errors.push('Client ID is required');
			}

			// Validate token structure
			if (tokens && !tokens.access_token) {
				errors.push('Access token is required in response');
			}

			// Validate token type
			if (tokens?.token_type && tokens.token_type !== 'Bearer') {
				errors.push('Token type should be Bearer');
			}

			// Validate scope
			if (credentials.scope && typeof credentials.scope !== 'string') {
				errors.push('Scope should be a string');
			}

			const passed = errors.length === 0;
			const duration = Date.now() - startTime;

			const result: FlowTestResult = {
				flowName,
				step,
				passed,
				error: errors.length > 0 ? errors.join('; ') : undefined,
				timestamp: Date.now(),
				duration,
			};

			this.recordTestResult(flowName, result);
			return result;
		} catch (error) {
			const result: FlowTestResult = {
				flowName,
				step,
				passed: false,
				error: error instanceof Error ? error.message : 'Unknown error',
				timestamp: Date.now(),
				duration: Date.now() - startTime,
			};

			this.recordTestResult(flowName, result);
			return result;
		}
	}

	/**
	 * Validate OIDC specification compliance
	 */
	validateOIDCCompliance(
		flowName: string,
		credentials: StepCredentials,
		tokens: any
	): FlowTestResult {
		const startTime = Date.now();
		const step = 'oidc-compliance';

		try {
			const errors: string[] = [];

			// Validate OIDC specific requirements
			if (flowName.includes('oidc') && !credentials.scope?.includes('openid')) {
				errors.push('OIDC flows require openid scope');
			}

			// Validate ID token structure
			if (tokens?.id_token) {
				try {
					const decoded = this.decodeJWT(tokens.id_token);
					if (!decoded.payload.iss) {
						errors.push('ID token missing issuer claim');
					}
					if (!decoded.payload.sub) {
						errors.push('ID token missing subject claim');
					}
					if (!decoded.payload.aud) {
						errors.push('ID token missing audience claim');
					}
				} catch (_e) {
					errors.push('Invalid ID token format');
				}
			}

			const passed = errors.length === 0;
			const duration = Date.now() - startTime;

			const result: FlowTestResult = {
				flowName,
				step,
				passed,
				error: errors.length > 0 ? errors.join('; ') : undefined,
				timestamp: Date.now(),
				duration,
			};

			this.recordTestResult(flowName, result);
			return result;
		} catch (error) {
			const result: FlowTestResult = {
				flowName,
				step,
				passed: false,
				error: error instanceof Error ? error.message : 'Unknown error',
				timestamp: Date.now(),
				duration: Date.now() - startTime,
			};

			this.recordTestResult(flowName, result);
			return result;
		}
	}

	/**
	 * Validate flow-specific requirements
	 */
	validateFlowSpecific(
		flowName: string,
		credentials: StepCredentials,
		_tokens: any
	): FlowTestResult {
		const startTime = Date.now();
		const step = 'flow-specific';

		try {
			const errors: string[] = [];

			// Flow-specific validations
			switch (flowName) {
				case 'authorization-code-v7':
					if (!credentials.redirectUri) {
						errors.push('Authorization Code flow requires redirect URI');
					}
					break;

				case 'hybrid-v7':
					if (!credentials.redirectUri) {
						errors.push('Hybrid flow requires redirect URI');
					}
					if (!credentials.responseType?.includes('code')) {
						errors.push('Hybrid flow requires code in response type');
					}
					break;

				case 'implicit-v7':
					if (!credentials.redirectUri) {
						errors.push('Implicit flow requires redirect URI');
					}
					if (!credentials.responseType?.includes('token')) {
						errors.push('Implicit flow requires token in response type');
					}
					break;

				case 'client-credentials-v7':
					if (!credentials.clientSecret && credentials.clientAuthMethod !== 'none') {
						errors.push('Client Credentials flow requires client secret or none auth method');
					}
					break;
			}

			const passed = errors.length === 0;
			const duration = Date.now() - startTime;

			const result: FlowTestResult = {
				flowName,
				step,
				passed,
				error: errors.length > 0 ? errors.join('; ') : undefined,
				timestamp: Date.now(),
				duration,
			};

			this.recordTestResult(flowName, result);
			return result;
		} catch (error) {
			const result: FlowTestResult = {
				flowName,
				step,
				passed: false,
				error: error instanceof Error ? error.message : 'Unknown error',
				timestamp: Date.now(),
				duration: Date.now() - startTime,
			};

			this.recordTestResult(flowName, result);
			return result;
		}
	}

	/**
	 * Run comprehensive validation suite
	 */
	async runValidationSuite(
		flowName: string,
		credentials: StepCredentials,
		tokens: any
	): Promise<RegressionTestSuite> {
		console.log(`[Regression Safeguards] Running validation suite for ${flowName}`);

		const tests: FlowTestResult[] = [];

		// Run all validation tests
		tests.push(this.validateOAuth2Compliance(flowName, credentials, tokens));
		tests.push(this.validateOIDCCompliance(flowName, credentials, tokens));
		tests.push(this.validateFlowSpecific(flowName, credentials, tokens));

		// Calculate overall result
		const overallPassed = tests.every((test) => test.passed);

		const testSuite: RegressionTestSuite = {
			flowName,
			tests,
			overallPassed,
			lastRun: Date.now(),
		};

		this.testResults.set(flowName, testSuite);

		// Alert if critical flow failed
		if (!overallPassed && this.config.criticalFlows.includes(flowName)) {
			this.alertCriticalFailure(flowName, testSuite);
		}

		return testSuite;
	}

	/**
	 * Record test result
	 */
	private recordTestResult(flowName: string, result: FlowTestResult): void {
		const existing = this.testResults.get(flowName);
		if (existing) {
			existing.tests.push(result);
			existing.lastRun = Date.now();
		} else {
			this.testResults.set(flowName, {
				flowName,
				tests: [result],
				overallPassed: result.passed,
				lastRun: Date.now(),
			});
		}
	}

	/**
	 * Alert on critical failure
	 */
	private alertCriticalFailure(flowName: string, testSuite: RegressionTestSuite): void {
		const failedTests = testSuite.tests.filter((test) => !test.passed);
		console.error(`[CRITICAL] Flow ${flowName} failed validation:`, failedTests);

		// In a real implementation, this would send alerts to monitoring systems
		// For now, we'll log to console and potentially show user notification
		if (window?.alert) {
			window.alert(`Critical flow ${flowName} failed validation. Check console for details.`);
		}
	}

	/**
	 * Decode JWT token
	 */
	private decodeJWT(token: string): { header: any; payload: any; signature: string } {
		const parts = token.split('.');
		if (parts.length !== 3) {
			throw new Error('Invalid JWT format');
		}

		const header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')));
		const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
		const signature = parts[2];

		return { header, payload, signature };
	}

	/**
	 * Get test results for a flow
	 */
	getTestResults(flowName: string): RegressionTestSuite | undefined {
		return this.testResults.get(flowName);
	}

	/**
	 * Get all test results
	 */
	getAllTestResults(): Map<string, RegressionTestSuite> {
		return this.testResults;
	}

	/**
	 * Get error log
	 */
	getErrorLog(): Array<{ timestamp: number; error: string; context: any }> {
		return this.errorLog;
	}

	/**
	 * Clear test results
	 */
	clearTestResults(): void {
		this.testResults.clear();
	}

	/**
	 * Clear error log
	 */
	clearErrorLog(): void {
		this.errorLog = [];
	}

	/**
	 * Get health status
	 */
	getHealthStatus(): {
		overall: 'healthy' | 'warning' | 'critical';
		flows: Array<{ name: string; status: 'healthy' | 'warning' | 'critical' }>;
		errorRate: number;
		lastErrors: number;
	} {
		const flows = Array.from(this.testResults.values());
		const criticalFlows = flows.filter((flow) => this.config.criticalFlows.includes(flow.flowName));

		const failedCriticalFlows = criticalFlows.filter((flow) => !flow.overallPassed);
		const errorRate =
			this.errorLog.length / Math.max(1, Date.now() - (this.errorLog[0]?.timestamp || Date.now()));

		let overall: 'healthy' | 'warning' | 'critical' = 'healthy';
		if (failedCriticalFlows.length > 0) {
			overall = 'critical';
		} else if (errorRate > this.config.alertThresholds.errorRate) {
			overall = 'warning';
		}

		return {
			overall,
			flows: flows.map((flow) => ({
				name: flow.flowName,
				status: flow.overallPassed ? 'healthy' : 'critical',
			})),
			errorRate,
			lastErrors: this.errorLog.length,
		};
	}
}

// Export singleton instance
export const regressionSafeguards = new RegressionSafeguards();
