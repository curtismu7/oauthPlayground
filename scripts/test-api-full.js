#!/usr/bin/env node

/**
 * Comprehensive API Test Suite with JSON Output
 * Tests all backend API endpoints and outputs results as JSON
 *
 * Usage:
 *   node scripts/test-api-full.js
 *   node scripts/test-api-full.js --output=results.json
 *   node scripts/test-api-full.js --verbose
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { Agent } from 'https';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Parse command line arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
	if (arg.startsWith('--')) {
		const [key, value] = arg.replace('--', '').split('=');
		acc[key] = value || true;
	}
	return acc;
}, {});

// Configuration
const BASE_URL = process.env.BACKEND_URL || 'https://localhost:3001';
const OUTPUT_FILE =
	args.output ||
	`test-results/api-test-results-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
const VERBOSE = args.verbose === true;

const httpsAgent = new Agent({
	rejectUnauthorized: false,
});

// Test Results Structure
const TEST_RESULTS = {
	metadata: {
		timestamp: new Date().toISOString(),
		baseUrl: BASE_URL,
		version: process.env.npm_package_version || 'unknown',
		totalTests: 0,
		passed: 0,
		failed: 0,
		skipped: 0,
		duration: 0,
	},
	tests: [],
};

let WORKER_TOKEN = null;

// Utility Functions
function log(message, level = 'INFO') {
	const timestamp = new Date().toISOString();
	const output = `[${timestamp}] [${level}] ${message}`;
	console.log(output);
	if (VERBOSE) {
		TEST_RESULTS.tests.push({
			type: 'log',
			level,
			message,
			timestamp,
		});
	}
}

function addTestResult(test) {
	TEST_RESULTS.tests.push({
		...test,
		timestamp: new Date().toISOString(),
	});
	TEST_RESULTS.metadata.totalTests++;

	if (test.status === 'PASSED') TEST_RESULTS.metadata.passed++;
	else if (test.status === 'FAILED') TEST_RESULTS.metadata.failed++;
	else if (test.status === 'SKIPPED') TEST_RESULTS.metadata.skipped++;
}

async function makeRequest(endpoint, options = {}) {
	const startTime = Date.now();
	const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;

	const defaultOptions = {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			Accept: 'application/json',
		},
		agent: BASE_URL.startsWith('https://localhost') ? httpsAgent : undefined,
	};

	const fetchOptions = { ...defaultOptions, ...options };
	if (options.headers) {
		fetchOptions.headers = { ...defaultOptions.headers, ...options.headers };
	}

	try {
		const response = await fetch(url, fetchOptions);
		const responseTime = Date.now() - startTime;

		let data;
		const contentType = response.headers.get('content-type');
		if (contentType && contentType.includes('application/json')) {
			data = await response.json();
		} else {
			data = await response.text();
		}

		return {
			success: response.ok,
			status: response.status,
			statusText: response.statusText,
			data,
			responseTime,
			headers: Object.fromEntries(response.headers.entries()),
		};
	} catch (error) {
		return {
			success: false,
			status: 0,
			statusText: 'Network Error',
			error: error.message,
			responseTime: Date.now() - startTime,
		};
	}
}

// Test Categories
const API_TESTS = {
	// Health & Status Tests
	health: [
		{
			name: 'Health Check Endpoint',
			endpoint: '/api/health',
			method: 'GET',
			expectedStatus: 200,
		},
		{
			name: 'API Version',
			endpoint: '/api/version',
			method: 'GET',
			expectedStatus: 200,
		},
		{
			name: 'Network Check',
			endpoint: '/api/network/check',
			method: 'GET',
			expectedStatus: 200,
		},
		{
			name: 'Debug Info',
			endpoint: '/api/debug',
			method: 'GET',
			expectedStatus: 200,
		},
	],

	// Configuration & Environment Tests
	config: [
		{
			name: 'Get Env Config',
			endpoint: '/api/env-config',
			method: 'GET',
			expectedStatus: 200,
		},
		{
			name: 'Get Environments List',
			endpoint: '/api/environments',
			method: 'GET',
			expectedStatus: [200, 401], // requires valid worker token
		},
		{
			name: 'Get Settings: Region',
			endpoint: '/api/settings/region',
			method: 'GET',
			expectedStatus: 200,
		},
		{
			name: 'Get Settings: Custom Domain',
			endpoint: '/api/settings/custom-domain',
			method: 'GET',
			expectedStatus: 200,
		},
		{
			name: 'Get Settings: Environment ID',
			endpoint: '/api/settings/environment-id',
			method: 'GET',
			expectedStatus: 200,
		},
		{
			name: 'Get Settings: Debug Log Viewer',
			endpoint: '/api/settings/debug-log-viewer',
			method: 'GET',
			expectedStatus: 200,
		},
	],

	// Credentials Tests
	credentials: [
		{
			name: 'Load Credentials',
			endpoint: '/api/credentials/load',
			method: 'GET',
			expectedStatus: [200, 400], // 400 when no flowName param provided
		},
		{
			name: 'Load SQLite Credentials',
			endpoint: '/api/credentials/sqlite/load',
			method: 'GET',
			expectedStatus: [200, 400], // 400 when no flowName param provided
		},
	],

	// Token & Auth Tests
	token: [
		{
			name: 'Token Exchange (OPTIONS preflight)',
			endpoint: '/api/token-exchange',
			method: 'OPTIONS',
			expectedStatus: 204,
		},
		{
			name: 'Token Exchange (POST — missing body)',
			endpoint: '/api/token-exchange',
			method: 'POST',
			body: {},
			expectedStatus: [200, 400, 401],
		},
		{
			name: 'Get Worker Token',
			endpoint: '/api/tokens/worker',
			method: 'GET',
			expectedStatus: [200, 400], // 400 when no environmentId param provided
		},
		{
			name: 'Validate Token (missing body)',
			endpoint: '/api/validate-token',
			method: 'POST',
			body: {},
			expectedStatus: [200, 400, 401],
		},
		{
			name: 'Introspect Token (missing body)',
			endpoint: '/api/introspect-token',
			method: 'POST',
			body: {},
			expectedStatus: [200, 400, 401],
		},
		{
			name: 'Playground JWKS',
			endpoint: '/api/playground-jwks',
			method: 'GET',
			expectedStatus: 200,
		},
		{
			name: 'JWKS Endpoint',
			endpoint: '/api/jwks',
			method: 'GET',
			expectedStatus: [200, 400],
		},
	],

	// PingOne API Tests
	pingone: [
		{
			name: 'PingOne Token Endpoint',
			endpoint: '/api/pingone/token',
			method: 'POST',
			body: {
				grant_type: 'client_credentials',
				environment_id: process.env.VITE_PINGONE_ENVIRONMENT_ID || 'test-env',
			},
			expectedStatus: [200, 400, 401],
		},
		{
			name: 'PingOne Worker Token',
			endpoint: '/api/pingone/worker-token',
			method: 'POST',
			body: {
				environment_id: process.env.VITE_PINGONE_ENVIRONMENT_ID || 'test-env',
			},
			expectedStatus: [200, 400, 401],
		},
		{
			name: 'PingOne Users Lookup (missing body)',
			endpoint: '/api/pingone/users/lookup',
			method: 'POST',
			body: {},
			expectedStatus: [200, 400, 401],
		},
		{
			name: 'PingOne API Calls Log',
			endpoint: '/api/pingone/api-calls',
			method: 'GET',
			expectedStatus: 200,
		},
		{
			name: 'PingOne OIDC Discovery (missing params)',
			endpoint: '/api/pingone/oidc-discovery',
			method: 'POST',
			body: {},
			expectedStatus: [200, 400, 401],
		},
		{
			name: 'PingOne Token Exchange (missing body)',
			endpoint: '/api/pingone/token-exchange',
			method: 'POST',
			body: {},
			expectedStatus: [200, 400, 401],
		},
		{
			name: 'PingOne Risk Evaluation (missing body)',
			endpoint: '/api/pingone/risk-evaluations',
			method: 'POST',
			body: {},
			expectedStatus: [200, 400, 401],
		},
	],

	// OAuth Flow Tests
	oauth: [
		{
			name: 'UserInfo Endpoint (no token)',
			endpoint: '/api/userinfo',
			method: 'GET',
			expectedStatus: [200, 400, 401],
		},
		{
			name: 'OAuth Metadata',
			endpoint: '/api/oauth-metadata',
			method: 'GET',
			expectedStatus: [200, 400],
		},
		{
			name: 'Client Credentials (missing body)',
			endpoint: '/api/client-credentials',
			method: 'POST',
			body: {},
			expectedStatus: [200, 400, 401],
		},
		{
			name: 'Discovery Endpoint (missing env_id)',
			endpoint: '/api/discovery',
			method: 'GET',
			expectedStatus: [200, 400],
		},
	],

	// CIBA Tests
	ciba: [
		{
			name: 'CIBA Backchannel Auth (missing body)',
			endpoint: '/api/ciba-backchannel',
			method: 'POST',
			body: { scope: 'openid' },
			expectedStatus: [200, 400, 401],
		},
		{
			name: 'CIBA Token Poll (missing body)',
			endpoint: '/api/ciba-token',
			method: 'POST',
			body: {},
			expectedStatus: [200, 400, 401],
		},
	],

	// Device Authorization Tests
	device: [
		{
			name: 'Device Authorization (missing body)',
			endpoint: '/api/device-authorization',
			method: 'POST',
			body: {},
			expectedStatus: [200, 400, 401],
		},
		{
			name: 'Device UserInfo (no token)',
			endpoint: '/api/device-userinfo',
			method: 'GET',
			expectedStatus: [200, 400, 401],
		},
	],

	// PAR Tests
	par: [
		{
			name: 'Pushed Authorization Request (missing body)',
			endpoint: '/api/par',
			method: 'POST',
			body: {},
			expectedStatus: [200, 400, 401],
		},
	],

	// Logs Tests
	logs: [
		{
			name: 'List Log Files',
			endpoint: '/api/logs/list',
			method: 'GET',
			expectedStatus: [200, 400],
		},
	],

	// MCP Tests
	mcp: [
		{
			name: 'MCP Web Search (missing body)',
			endpoint: '/api/mcp/web-search',
			method: 'POST',
			body: {},
			expectedStatus: [200, 400, 401],
		},
	],

	// Password Tests
	password: [
		{
			name: 'Password State Check (missing params)',
			endpoint: '/api/pingone/password/state',
			method: 'GET',
			expectedStatus: [200, 400, 401],
		},
	],
};

async function obtainWorkerToken() {
	log('Attempting to obtain worker token...', 'INFO');

	const envId = process.env.VITE_PINGONE_ENVIRONMENT_ID;
	const clientId = process.env.VITE_PINGONE_CLIENT_ID;
	const clientSecret = process.env.VITE_PINGONE_CLIENT_SECRET;

	if (!envId || !clientId || !clientSecret) {
		log('Worker token credentials not configured, skipping auth-required tests', 'WARN');
		return false;
	}

	try {
		const result = await makeRequest('/api/pingone/token', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: new URLSearchParams({
				grant_type: 'client_credentials',
				environment_id: envId,
				client_id: clientId,
				client_secret: clientSecret,
				scope: 'p1:read:user p1:read:environment',
			}).toString(),
		});

		if (result.success && result.data?.access_token) {
			WORKER_TOKEN = result.data.access_token;
			log('Worker token obtained successfully', 'SUCCESS');
			return true;
		}
	} catch (error) {
		log(`Failed to obtain worker token: ${error.message}`, 'WARN');
	}

	return false;
}

async function runTest(test) {
	log(`Running: ${test.name}`, 'INFO');

	const options = {
		method: test.method,
		body: test.body ? JSON.stringify(test.body) : undefined,
	};

	if (test.requiresAuth && WORKER_TOKEN) {
		options.headers = {
			Authorization: `Bearer ${WORKER_TOKEN}`,
		};
	}

	const result = await makeRequest(test.endpoint, options);

	const expectedStatuses = Array.isArray(test.expectedStatus)
		? test.expectedStatus
		: [test.expectedStatus];

	const passed = expectedStatuses.includes(result.status);

	const testResult = {
		name: test.name,
		category: test.category || 'API',
		endpoint: test.endpoint,
		method: test.method,
		status: passed ? 'PASSED' : 'FAILED',
		expectedStatus: test.expectedStatus,
		actualStatus: result.status,
		responseTime: result.responseTime,
		error: result.error || null,
		response: VERBOSE ? result.data : undefined,
	};

	addTestResult(testResult);

	log(
		`  ${passed ? '✓' : '✗'} ${test.name} (${result.responseTime}ms)`,
		passed ? 'SUCCESS' : 'ERROR'
	);

	return passed;
}

async function runAllTests() {
	const startTime = Date.now();

	log('========================================', 'INFO');
	log('Starting Comprehensive API Test Suite', 'INFO');
	log(`Base URL: ${BASE_URL}`, 'INFO');
	log(`Output File: ${OUTPUT_FILE}`, 'INFO');
	log('========================================', 'INFO');

	// Try to obtain worker token first
	await obtainWorkerToken();

	// Run all test categories
	for (const [category, tests] of Object.entries(API_TESTS)) {
		log(`\n--- ${category.toUpperCase()} TESTS ---`, 'INFO');

		for (const test of tests) {
			test.category = category;
			await runTest(test);
		}
	}

	TEST_RESULTS.metadata.duration = Date.now() - startTime;

	// Save results
	const outputPath = path.resolve(OUTPUT_FILE);
	const outputDir = path.dirname(outputPath);

	if (!fs.existsSync(outputDir)) {
		fs.mkdirSync(outputDir, { recursive: true });
	}

	fs.writeFileSync(outputPath, JSON.stringify(TEST_RESULTS, null, 2));

	// Print summary
	log('\n========================================', 'INFO');
	log('TEST SUMMARY', 'INFO');
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
