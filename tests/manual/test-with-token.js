#!/usr/bin/env node

/**
 * Test Password Check API with provided worker token
 * Usage: node test-with-token.js <workerToken> [userId]
 */

import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const BASE_URL = 'https://localhost:3000';

const workerToken = process.argv[2];
const userId = process.argv[3];

const config = {
	environmentId: process.env.PINGONE_ENVIRONMENT_ID || process.env.VITE_PINGONE_ENVIRONMENT_ID,
	testUsername: 'curtis7',
	testPassword: 'Claire7&',
};

if (!workerToken) {
	console.log('❌ Usage: node test-with-token.js <workerToken> [userId]');
	console.log('\nExample:');
	console.log('  node test-with-token.js eyJhbGc... 5adc497b-dde7-44c6-a...');
	console.log('\nOr get a token from the UI:');
	console.log('  1. Go to https://localhost:3000');
	console.log('  2. Use Client Credentials flow to get a worker token');
	console.log('  3. Copy the access_token');
	console.log('  4. Run this script with the token');
	process.exit(1);
}

async function lookupUser(workerToken, username) {
	console.log(`🔍 Looking up user: ${username}...`);

	const response = await fetch(`${BASE_URL}/api/pingone/users/lookup`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			environmentId: config.environmentId,
			accessToken: workerToken,
			identifier: username,
		}),
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(`User lookup failed: ${error.error_description || error.message}`);
	}

	const data = await response.json();
	console.log(`✅ User found: ${data.user.username} (${data.user.id})\n`);
	return data.user;
}

async function checkPassword(workerToken, userId, password, testName) {
	console.log(`🔐 Testing: ${testName}...`);

	const response = await fetch(`${BASE_URL}/api/pingone/password/check`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			environmentId: config.environmentId,
			userId: userId,
			workerToken: workerToken,
			password: password,
		}),
	});

	const data = await response.json();

	console.log(`   Status: ${response.status} ${response.statusText}`);
	console.log(`   Response:`, JSON.stringify(data, null, 2));

	if (data.success && data.valid !== undefined) {
		if (data.valid) {
			console.log(`   ✅ Password is CORRECT\n`);
		} else {
			console.log(`   ❌ Password is INCORRECT`);
			if (data.failuresRemaining !== undefined) {
				console.log(`   ⚠️  Failures remaining: ${data.failuresRemaining}\n`);
			}
		}
	} else if (data.error) {
		console.log(`   ❌ Error: ${data.error_description || data.message}\n`);
	}

	return data;
}

async function runTests() {
	console.log('🚀 Password Check API Test\n');
	console.log('='.repeat(60));
	console.log(`Environment: ${config.environmentId.substring(0, 20)}...`);
	console.log(`Test User: ${config.testUsername}`);
	console.log(`Worker Token: ${workerToken.substring(0, 20)}...`);
	console.log(`Base URL: ${BASE_URL}`);
	console.log(`${'='.repeat(60)}\n`);

	try {
		let testUserId = userId;

		// Lookup user if userId not provided
		if (!testUserId) {
			const user = await lookupUser(workerToken, config.testUsername);
			testUserId = user.id;
		} else {
			console.log(`Using provided user ID: ${testUserId}\n`);
		}

		// Test 1: Check with correct password
		await checkPassword(
			workerToken,
			testUserId,
			config.testPassword,
			'Correct Password (Claire7&)'
		);

		// Test 2: Check with incorrect password
		await checkPassword(workerToken, testUserId, 'WrongPassword123!', 'Incorrect Password');

		// Test 3: Check with empty password
		await checkPassword(workerToken, testUserId, '', 'Empty Password');

		console.log('='.repeat(60));
		console.log('✅ All tests completed!');
		console.log('='.repeat(60));
	} catch (error) {
		console.error('\n❌ Test failed:', error.message);
		console.error(error);
		process.exit(1);
	}
}

runTests();
