#!/usr/bin/env node

/**
 * Comprehensive UI Test Suite with JSON Output
 * Runs Playwright E2E tests and outputs results as JSON
 *
 * Usage:
 *   node scripts/test-ui-full.js
 *   node scripts/test-ui-full.js --output=results.json
 *   node scripts/test-ui-full.js --browsers=chromium,firefox
 *   node scripts/test-ui-full.js --grep="dashboard"
 */

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
	if (arg.startsWith('--')) {
		const [key, value] = arg.replace('--', '').split('=');
		acc[key] = value || true;
	}
	return acc;
}, {});

// Configuration
const OUTPUT_FILE =
	args.output ||
	`test-results/ui-test-results-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
const BROWSERS = args.browsers ? args.browsers.split(',') : ['chromium'];
const GREP = args.grep || '';
const VERBOSE = args.verbose === true;
const TIMEOUT = parseInt(args.timeout) || 120000;

// Test Results Structure
const TEST_RESULTS = {
	metadata: {
		timestamp: new Date().toISOString(),
		version: process.env.npm_package_version || 'unknown',
		browsers: BROWSERS,
		totalTests: 0,
		passed: 0,
		failed: 0,
		skipped: 0,
		duration: 0,
		configuration: {
			baseUrl: 'https://localhost:3000',
			timeout: TIMEOUT,
			grep: GREP || null,
		},
	},
	suites: [],
};

// Utility Functions
function log(message, level = 'INFO') {
	const timestamp = new Date().toISOString();
	const output = `[${timestamp}] [${level}] ${message}`;
	console.log(output);

	if (VERBOSE) {
		TEST_RESULTS.suites.push({
			type: 'log',
			level,
			message,
			timestamp,
		});
	}
}

function parsePlaywrightOutput(output) {
	const lines = output.split('\n');
	const tests = [];
	let currentSuite = null;

	for (const line of lines) {
		// Parse test results
		const passMatch = line.match(/\s+(✓|✅|PASS)\s+(.+?)\s+\[(\d+\.?\d*)(ms|s)\]/i);
		const failMatch = line.match(/\s+(✗|❌|FAIL)\s+(.+?)\s+\[(\d+\.?\d*)(ms|s)\]/i);
		const skipMatch = line.match(/\s+(⊘|⚠|SKIP)\s+(.+)/i);
		const suiteMatch = line.match(/(\d+) passed?.*?(\d+) failed?.*?(\d+) skipped?/i);

		if (passMatch) {
			tests.push({
				name: passMatch[2].trim(),
				status: 'PASSED',
				duration: parseFloat(passMatch[3]),
				unit: passMatch[4],
			});
		} else if (failMatch) {
			tests.push({
				name: failMatch[2].trim(),
				status: 'FAILED',
				duration: parseFloat(failMatch[3]),
				unit: failMatch[4],
			});
		} else if (skipMatch) {
			tests.push({
				name: skipMatch[2].trim(),
				status: 'SKIPPED',
			});
		}

		if (suiteMatch) {
			TEST_RESULTS.metadata.passed = parseInt(suiteMatch[1]) || 0;
			TEST_RESULTS.metadata.failed = parseInt(suiteMatch[2]) || 0;
			TEST_RESULTS.metadata.skipped = parseInt(suiteMatch[3]) || 0;
		}
	}

	return tests;
}

async function runPlaywrightTests(browser) {
	log(`\n========================================`, 'INFO');
	log(`Running UI Tests - ${browser.toUpperCase()}`, 'INFO');
	log(`========================================`, 'INFO');

	const suiteResult = {
		browser,
		timestamp: new Date().toISOString(),
		tests: [],
		summary: {
			total: 0,
			passed: 0,
			failed: 0,
			skipped: 0,
		},
	};

	return new Promise((resolve) => {
		const playwrightArgs = [
			'playwright',
			'test',
			'--project=' + browser,
			'--reporter=json',
			'--timeout=' + TIMEOUT,
		];

		if (GREP) {
			playwrightArgs.push('--grep=' + GREP);
		}

		log(`Command: npx ${playwrightArgs.join(' ')}`, 'DEBUG');

		const child = spawn('npx', playwrightArgs, {
			cwd: process.cwd(),
			stdio: ['pipe', 'pipe', 'pipe'],
		});

		let stdout = '';
		let stderr = '';

		child.stdout.on('data', (data) => {
			const output = data.toString();
			stdout += output;

			// Real-time output
			const lines = output.split('\n').filter((line) => line.trim());
			for (const line of lines) {
				if (line.includes('✓') || line.includes('✅') || line.includes('PASS')) {
					log(line, 'SUCCESS');
				} else if (line.includes('✗') || line.includes('❌') || line.includes('FAIL')) {
					log(line, 'ERROR');
				} else if (line.includes('Running') || line.includes('tests')) {
					log(line, 'INFO');
				}
			}
		});

		child.stderr.on('data', (data) => {
			stderr += data.toString();
		});

		child.on('close', (code) => {
			// Try to parse JSON reporter output
			try {
				const jsonOutput = JSON.parse(stdout);

				if (jsonOutput.suites) {
					for (const suite of jsonOutput.suites) {
						for (const spec of suite.specs || []);
						for (const test of spec.tests || []) {
							const testResult = {
								name: spec.title,
								status:
									test.results[0]?.status === 'passed'
										? 'PASSED'
										: test.results[0]?.status === 'skipped'
											? 'SKIPPED'
											: 'FAILED',
								duration: test.results[0]?.duration || 0,
								retries: test.results.length - 1,
								error: test.results[0]?.error?.message || null,
							};

							suiteResult.tests.push(testResult);
							suiteResult.summary.total++;

							if (testResult.status === 'PASSED') suiteResult.summary.passed++;
							else if (testResult.status === 'FAILED') suiteResult.summary.failed++;
							else suiteResult.summary.skipped++;
						}
					}
				}
			} catch (e) {
				// Fallback: parse text output
				const parsedTests = parsePlaywrightOutput(stdout);
				suiteResult.tests = parsedTests;
				suiteResult.summary.total = parsedTests.length;
				suiteResult.summary.passed = parsedTests.filter((t) => t.status === 'PASSED').length;
				suiteResult.summary.failed = parsedTests.filter((t) => t.status === 'FAILED').length;
				suiteResult.summary.skipped = parsedTests.filter((t) => t.status === 'SKIPPED').length;
			}

			// Log summary
			log(`\n${browser.toUpperCase()} Summary:`, 'INFO');
			log(`  Total: ${suiteResult.summary.total}`, 'INFO');
			log(`  Passed: ${suiteResult.summary.passed} ✓`, 'SUCCESS');
			log(
				`  Failed: ${suiteResult.summary.failed} ✗`,
				suiteResult.summary.failed > 0 ? 'ERROR' : 'INFO'
			);
			log(`  Skipped: ${suiteResult.summary.skipped}`, 'INFO');

			if (stderr && VERBOSE) {
				log(`\nStderr output:\n${stderr}`, 'DEBUG');
			}

			resolve(suiteResult);
		});
	});
}

async function runQuickTests() {
	log('========================================', 'INFO');
	log('Running Quick UI Smoke Tests', 'INFO');
	log('========================================', 'INFO');

	const quickTests = [
		{
			name: 'Application Loads',
			file: 'tests/e2e/simple-server-test.spec.ts',
			grep: 'application',
		},
		{
			name: 'Dashboard Renders',
			file: 'tests/e2e/dashboard-groups-simple.spec.ts',
			grep: 'dashboard',
		},
		{
			name: 'Mock Flows Work',
			file: 'tests/e2e/mock-flows-simple.spec.ts',
			grep: 'mock',
		},
	];

	const suiteResult = {
		browser: 'quick-smoke',
		timestamp: new Date().toISOString(),
		tests: [],
		summary: {
			total: 0,
			passed: 0,
			failed: 0,
			skipped: 0,
		},
	};

	for (const test of quickTests) {
		log(`\nTesting: ${test.name}`, 'INFO');

		try {
			const result = execSync(
				`npx playwright test ${test.file} --project=chromium --grep="${test.grep}" --reporter=line`,
				{ encoding: 'utf-8', timeout: 60000, stdio: 'pipe' }
			);

			suiteResult.tests.push({
				name: test.name,
				status: 'PASSED',
				file: test.file,
			});
			suiteResult.summary.passed++;
			log(`  ✓ ${test.name}`, 'SUCCESS');
		} catch (error) {
			suiteResult.tests.push({
				name: test.name,
				status: 'FAILED',
				file: test.file,
				error: error.message,
			});
			suiteResult.summary.failed++;
			log(`  ✗ ${test.name}`, 'ERROR');
		}

		suiteResult.summary.total++;
	}

	return suiteResult;
}

async function runAllTests() {
	const startTime = Date.now();

	log('========================================', 'INFO');
	log('Starting Comprehensive UI Test Suite', 'INFO');
	log(`Browsers: ${BROWSERS.join(', ')}`, 'INFO');
	log(`Output File: ${OUTPUT_FILE}`, 'INFO');
	log(`Timeout: ${TIMEOUT}ms`, 'INFO');
	if (GREP) {
		log(`Filter: ${GREP}`, 'INFO');
	}
	log('========================================', 'INFO');

	// Check if Playwright is installed
	try {
		execSync('npx playwright --version', { stdio: 'pipe' });
	} catch (error) {
		log('Playwright not found. Installing...', 'WARN');
		execSync('npm install -D @playwright/test', { stdio: 'inherit' });
		execSync('npx playwright install chromium', { stdio: 'inherit' });
	}

	// Run tests for each browser
	if (args.quick) {
		// Run quick smoke tests only
		const quickResult = await runQuickTests();
		TEST_RESULTS.suites.push(quickResult);
	} else {
		// Run full test suite
		for (const browser of BROWSERS) {
			try {
				const suiteResult = await runPlaywrightTests(browser);
				TEST_RESULTS.suites.push(suiteResult);
			} catch (error) {
				log(`Error running ${browser} tests: ${error.message}`, 'ERROR');
				TEST_RESULTS.suites.push({
					browser,
					error: error.message,
					tests: [],
					summary: { total: 0, passed: 0, failed: 0, skipped: 0 },
				});
			}
		}
	}

	TEST_RESULTS.metadata.duration = Date.now() - startTime;

	// Calculate totals
	for (const suite of TEST_RESULTS.suites) {
		if (suite.summary) {
			TEST_RESULTS.metadata.totalTests += suite.summary.total;
			TEST_RESULTS.metadata.passed += suite.summary.passed;
			TEST_RESULTS.metadata.failed += suite.summary.failed;
			TEST_RESULTS.metadata.skipped += suite.summary.skipped;
		}
	}

	// Save results
	const outputPath = path.resolve(OUTPUT_FILE);
	const outputDir = path.dirname(outputPath);

	if (!fs.existsSync(outputDir)) {
		fs.mkdirSync(outputDir, { recursive: true });
	}

	fs.writeFileSync(outputPath, JSON.stringify(TEST_RESULTS, null, 2));

	// Print summary
	log('\n========================================', 'INFO');
	log('UI TEST SUMMARY', 'INFO');
	log('========================================', 'INFO');
	log(`Total Tests: ${TEST_RESULTS.metadata.totalTests}`, 'INFO');
	log(`Passed: ${TEST_RESULTS.metadata.passed} ✓`, 'SUCCESS');
	log(
		`Failed: ${TEST_RESULTS.metadata.failed} ✗`,
		TEST_RESULTS.metadata.failed > 0 ? 'ERROR' : 'INFO'
	);
	log(`Skipped: ${TEST_RESULTS.metadata.skipped}`, 'INFO');
	log(`Duration: ${TEST_RESULTS.metadata.duration}ms`, 'INFO');
	log(`\nResults saved to: ${OUTPUT_FILE}`, 'INFO');
	log('========================================', 'INFO');

	// Exit with error code if tests failed
	process.exit(TEST_RESULTS.metadata.failed > 0 ? 1 : 0);
}

// Handle errors
process.on('unhandledRejection', (error) => {
	log(`Unhandled error: ${error.message}`, 'ERROR');
	process.exit(1);
});

// Run tests
runAllTests().catch((error) => {
	log(`Fatal error: ${error.message}`, 'ERROR');
	process.exit(1);
});
