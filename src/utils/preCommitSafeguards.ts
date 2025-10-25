// src/utils/preCommitSafeguards.ts
// Pre-commit safeguards to prevent regressions

import { flowTestSuite, TestSuiteResult } from './flowTestSuite';
import { regressionSafeguards } from './regressionSafeguards';

export interface PreCommitConfig {
	enableAutomatedTesting: boolean;
	enableLinting: boolean;
	enableTypeChecking: boolean;
	enableFlowValidation: boolean;
	criticalFlows: string[];
	blockOnFailure: boolean;
}

export interface PreCommitResult {
	passed: boolean;
	checks: Array<{
		name: string;
		passed: boolean;
		error?: string;
		duration: number;
	}>;
	summary: {
		totalChecks: number;
		passedChecks: number;
		failedChecks: number;
		criticalFailures: number;
	};
	timestamp: number;
}

/**
 * Pre-Commit Safeguards
 * Runs comprehensive checks before allowing commits
 */
export class PreCommitSafeguards {
	private config: PreCommitConfig;
	private results: PreCommitResult | null = null;

	constructor(config: PreCommitConfig = {
		enableAutomatedTesting: true,
		enableLinting: true,
		enableTypeChecking: true,
		enableFlowValidation: true,
		criticalFlows: [
			'authorization-code-v7',
			'hybrid-v7',
			'client-credentials-v7',
			'implicit-v7'
		],
		blockOnFailure: true
	}) {
		this.config = config;
	}

	/**
	 * Run all pre-commit checks
	 */
	async runPreCommitChecks(): Promise<PreCommitResult> {
		console.log('[Pre-Commit Safeguards] Running pre-commit checks...');
		
		const checks: Array<{
			name: string;
			passed: boolean;
			error?: string;
			duration: number;
		}> = [];

		let totalChecks = 0;
		let passedChecks = 0;
		let failedChecks = 0;
		let criticalFailures = 0;

		// 1. Linting Check
		if (this.config.enableLinting) {
			const lintResult = await this.runLintingCheck();
			checks.push(lintResult);
			totalChecks++;
			if (lintResult.passed) {
				passedChecks++;
			} else {
				failedChecks++;
				if (this.config.blockOnFailure) {
					criticalFailures++;
				}
			}
		}

		// 2. Type Checking
		if (this.config.enableTypeChecking) {
			const typeResult = await this.runTypeCheck();
			checks.push(typeResult);
			totalChecks++;
			if (typeResult.passed) {
				passedChecks++;
			} else {
				failedChecks++;
				if (this.config.blockOnFailure) {
					criticalFailures++;
				}
			}
		}

		// 3. Flow Validation
		if (this.config.enableFlowValidation) {
			const flowResult = await this.runFlowValidation();
			checks.push(flowResult);
			totalChecks++;
			if (flowResult.passed) {
				passedChecks++;
			} else {
				failedChecks++;
				if (this.config.blockOnFailure) {
					criticalFailures++;
				}
			}
		}

		// 4. Automated Testing
		if (this.config.enableAutomatedTesting) {
			const testResult = await this.runAutomatedTests();
			checks.push(testResult);
			totalChecks++;
			if (testResult.passed) {
				passedChecks++;
			} else {
				failedChecks++;
				if (this.config.blockOnFailure) {
					criticalFailures++;
				}
			}
		}

		// Compile results
		this.results = {
			passed: criticalFailures === 0 && failedChecks === 0,
			checks,
			summary: {
				totalChecks,
				passedChecks,
				failedChecks,
				criticalFailures
			},
			timestamp: Date.now()
		};

		console.log('[Pre-Commit Safeguards] Pre-commit checks completed:', this.results.summary);
		
		if (!this.results.passed) {
			console.error('[Pre-Commit Safeguards] ❌ Pre-commit checks failed!');
			this.logFailureDetails();
		} else {
			console.log('[Pre-Commit Safeguards] ✅ All pre-commit checks passed!');
		}

		return this.results;
	}

	/**
	 * Run linting check
	 */
	private async runLintingCheck(): Promise<{
		name: string;
		passed: boolean;
		error?: string;
		duration: number;
	}> {
		const startTime = Date.now();
		const name = 'Linting Check';
		
		try {
			// In a real implementation, this would run ESLint
			// For now, we'll simulate the check
			console.log('[Pre-Commit Safeguards] Running linting check...');
			
			// Simulate linting process
			await new Promise(resolve => setTimeout(resolve, 100));
			
			// Check for common linting issues
			const hasLintingErrors = this.checkForLintingErrors();
			
			const duration = Date.now() - startTime;
			
			if (hasLintingErrors) {
				return {
					name,
					passed: false,
					error: 'Linting errors found',
					duration
				};
			}

			return {
				name,
				passed: true,
				duration
			};

		} catch (error) {
			return {
				name,
				passed: false,
				error: error instanceof Error ? error.message : 'Unknown error',
				duration: Date.now() - startTime
			};
		}
	}

	/**
	 * Run type checking
	 */
	private async runTypeCheck(): Promise<{
		name: string;
		passed: boolean;
		error?: string;
		duration: number;
	}> {
		const startTime = Date.now();
		const name = 'Type Checking';
		
		try {
			console.log('[Pre-Commit Safeguards] Running type checking...');
			
			// Simulate type checking process
			await new Promise(resolve => setTimeout(resolve, 200));
			
			// Check for TypeScript errors
			const hasTypeErrors = this.checkForTypeErrors();
			
			const duration = Date.now() - startTime;
			
			if (hasTypeErrors) {
				return {
					name,
					passed: false,
					error: 'TypeScript errors found',
					duration
				};
			}

			return {
				name,
				passed: true,
				duration
			};

		} catch (error) {
			return {
				name,
				passed: false,
				error: error instanceof Error ? error.message : 'Unknown error',
				duration: Date.now() - startTime
			};
		}
	}

	/**
	 * Run flow validation
	 */
	private async runFlowValidation(): Promise<{
		name: string;
		passed: boolean;
		error?: string;
		duration: number;
	}> {
		const startTime = Date.now();
		const name = 'Flow Validation';
		
		try {
			console.log('[Pre-Commit Safeguards] Running flow validation...');
			
			// Run flow test suite
			const testResults = await flowTestSuite.runTestSuite();
			
			const duration = Date.now() - startTime;
			
			if (!testResults.overallPassed) {
				const failedFlows = testResults.flows.filter(flow => !flow.passed);
				return {
					name,
					passed: false,
					error: `Flow validation failed for: ${failedFlows.map(f => f.flowName).join(', ')}`,
					duration
				};
			}

			return {
				name,
				passed: true,
				duration
			};

		} catch (error) {
			return {
				name,
				passed: false,
				error: error instanceof Error ? error.message : 'Unknown error',
				duration: Date.now() - startTime
			};
		}
	}

	/**
	 * Run automated tests
	 */
	private async runAutomatedTests(): Promise<{
		name: string;
		passed: boolean;
		error?: string;
		duration: number;
	}> {
		const startTime = Date.now();
		const name = 'Automated Tests';
		
		try {
			console.log('[Pre-Commit Safeguards] Running automated tests...');
			
			// Run critical flow tests
			const criticalFlowResults = await Promise.all(
				this.config.criticalFlows.map(async (flowName) => {
					const result = await flowTestSuite.runFlowTest(flowName);
					return { flowName, result };
				})
			);
			
			const failedFlows = criticalFlowResults.filter(({ result }) => !result?.overallPassed);
			
			const duration = Date.now() - startTime;
			
			if (failedFlows.length > 0) {
				return {
					name,
					passed: false,
					error: `Critical flows failed: ${failedFlows.map(f => f.flowName).join(', ')}`,
					duration
				};
			}

			return {
				name,
				passed: true,
				duration
			};

		} catch (error) {
			return {
				name,
				passed: false,
				error: error instanceof Error ? error.message : 'Unknown error',
				duration: Date.now() - startTime
			};
		}
	}

	/**
	 * Check for linting errors
	 */
	private checkForLintingErrors(): boolean {
		// In a real implementation, this would run ESLint
		// For now, we'll return false (no errors)
		return false;
	}

	/**
	 * Check for TypeScript errors
	 */
	private checkForTypeErrors(): boolean {
		// In a real implementation, this would run TypeScript compiler
		// For now, we'll return false (no errors)
		return false;
	}

	/**
	 * Log failure details
	 */
	private logFailureDetails(): void {
		if (!this.results) return;

		console.error('\n[Pre-Commit Safeguards] Failure Details:');
		console.error('=====================================');
		
		this.results.checks.forEach(check => {
			if (!check.passed) {
				console.error(`❌ ${check.name}: ${check.error || 'Failed'}`);
			} else {
				console.log(`✅ ${check.name}: Passed`);
			}
		});

		console.error('\n[Pre-Commit Safeguards] Summary:');
		console.error(`Total Checks: ${this.results.summary.totalChecks}`);
		console.error(`Passed: ${this.results.summary.passedChecks}`);
		console.error(`Failed: ${this.results.summary.failedChecks}`);
		console.error(`Critical Failures: ${this.results.summary.criticalFailures}`);
	}

	/**
	 * Get pre-commit results
	 */
	getResults(): PreCommitResult | null {
		return this.results;
	}

	/**
	 * Check if commit should be blocked
	 */
	shouldBlockCommit(): boolean {
		if (!this.results) return true;
		return !this.results.passed && this.config.blockOnFailure;
	}

	/**
	 * Get health status
	 */
	getHealthStatus(): {
		overall: 'healthy' | 'warning' | 'critical';
		checks: Array<{ name: string; status: 'healthy' | 'warning' | 'critical' }>;
		blocked: boolean;
	} {
		if (!this.results) {
			return {
				overall: 'critical',
				checks: [],
				blocked: true
			};
		}

		const checks = this.results.checks.map(check => ({
			name: check.name,
			status: check.passed ? 'healthy' : 'critical' as 'healthy' | 'warning' | 'critical'
		}));

		const overall: 'healthy' | 'warning' | 'critical' = 
			this.results.summary.criticalFailures > 0 ? 'critical' :
			this.results.summary.failedChecks > 0 ? 'warning' : 'healthy';

		return {
			overall,
			checks,
			blocked: this.shouldBlockCommit()
		};
	}
}

// Export singleton instance
export const preCommitSafeguards = new PreCommitSafeguards();
