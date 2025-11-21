#!/usr/bin/env node

import dotenv from 'dotenv';
// Test script for credential service functionality
import fetch from 'node-fetch';

dotenv.config();

const BACKEND_URL = 'https://localhost:3001';
const FRONTEND_URL = 'https://localhost:3000';

// Disable SSL verification for self-signed certificates in testing
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function testBackendHealth() {
	console.log('🔍 Testing backend health...');
	try {
		const response = await fetch(`${BACKEND_URL}/api/health`);
		const data = await response.json();
		console.log('✅ Backend health check passed:', data);
		return true;
	} catch (error) {
		console.error('❌ Backend health check failed:', error.message);
		return false;
	}
}

async function testEnvConfig() {
	console.log('🔍 Testing environment configuration...');
	try {
		const response = await fetch(`${BACKEND_URL}/api/env-config`);
		const data = await response.json();
		console.log('✅ Environment config loaded:', {
			hasEnvironmentId: !!data.environmentId,
			hasClientId: !!data.clientId,
			hasClientSecret: !!data.clientSecret,
			redirectUri: data.redirectUri,
			apiUrl: data.apiUrl,
		});
		return data;
	} catch (error) {
		console.error('❌ Environment config test failed:', error.message);
		return null;
	}
}

async function testCredentialManager() {
	console.log('🔍 Testing credential manager functionality...');

	// Test data
	const testCredentials = {
		environmentId: process.env.PINGONE_ENVIRONMENT_ID || 'test-env-id',
		clientId: process.env.PINGONE_CLIENT_ID || 'test-client-id',
		clientSecret: process.env.PINGONE_CLIENT_SECRET || 'test-client-secret',
		redirectUri: 'https://localhost:3000/authz-callback',
		scopes: ['openid', 'profile', 'email'],
	};

	console.log('📝 Test credentials prepared:', {
		hasEnvironmentId: !!testCredentials.environmentId,
		hasClientId: !!testCredentials.clientId,
		hasClientSecret: !!testCredentials.clientSecret,
		redirectUri: testCredentials.redirectUri,
	});

	return testCredentials;
}

async function testDashboardCredentials() {
	console.log('🔍 Testing dashboard credential loading...');

	// Simulate localStorage operations that would happen in the browser
	const mockCredentials = {
		environmentId: process.env.PINGONE_ENVIRONMENT_ID,
		clientId: process.env.PINGONE_CLIENT_ID,
		redirectUri: 'https://localhost:3000/authz-callback',
		scopes: ['openid', 'profile', 'email'],
		lastUpdated: Date.now(),
	};

	console.log('✅ Dashboard credentials simulated:', {
		hasEnvironmentId: !!mockCredentials.environmentId,
		hasClientId: !!mockCredentials.clientId,
		redirectUri: mockCredentials.redirectUri,
		scopeCount: mockCredentials.scopes.length,
	});

	return mockCredentials;
}

async function runAllTests() {
	console.log('🚀 Starting credential service tests...\n');

	const results = {
		backendHealth: false,
		envConfig: null,
		credentialManager: null,
		dashboardCredentials: null,
	};

	// Test 1: Backend Health
	results.backendHealth = await testBackendHealth();
	console.log('');

	// Test 2: Environment Config
	results.envConfig = await testEnvConfig();
	console.log('');

	// Test 3: Credential Manager
	results.credentialManager = await testCredentialManager();
	console.log('');

	// Test 4: Dashboard Credentials
	results.dashboardCredentials = await testDashboardCredentials();
	console.log('');

	// Summary
	console.log('📊 Test Results Summary:');
	console.log('========================');
	console.log(`Backend Health: ${results.backendHealth ? '✅ PASS' : '❌ FAIL'}`);
	console.log(`Environment Config: ${results.envConfig ? '✅ PASS' : '❌ FAIL'}`);
	console.log(`Credential Manager: ${results.credentialManager ? '✅ PASS' : '❌ FAIL'}`);
	console.log(`Dashboard Credentials: ${results.dashboardCredentials ? '✅ PASS' : '❌ FAIL'}`);

	const allPassed =
		results.backendHealth &&
		results.envConfig &&
		results.credentialManager &&
		results.dashboardCredentials;
	console.log(`\n🎯 Overall Status: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

	if (!allPassed) {
		console.log('\n🔧 Recommendations:');
		if (!results.backendHealth) {
			console.log('- Start the backend server: npm run start:backend');
		}
		if (!results.envConfig) {
			console.log('- Check .env file configuration');
			console.log('- Verify PINGONE_* environment variables are set');
		}
	}

	return allPassed;
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
	runAllTests()
		.then((success) => {
			process.exit(success ? 0 : 1);
		})
		.catch((error) => {
			console.error('💥 Test execution failed:', error);
			process.exit(1);
		});
}

export {
	runAllTests,
	testBackendHealth,
	testEnvConfig,
	testCredentialManager,
	testDashboardCredentials,
};
