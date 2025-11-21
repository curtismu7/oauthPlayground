#!/usr/bin/env node
// Demonstrate force password change with before/after user lookup

const ENV_ID = 'b9817c16-9910-4415-b67e-4ac687da74d9';
const CLIENT_ID = '66a4686b-9222-4ad2-91b6-03113711c9aa';
const CLIENT_SECRET = '3D_ksu7589TfcVJm2fqEHjXuhc-DCRfoxEv0urEw8GIK7qiJe72n92WRQ0uaT2tC';
const TEST_USERNAME = 'curtis7';

async function getWorkerToken() {
	const tokenUrl = `https://auth.pingone.com/${ENV_ID}/as/token`;

	const response = await fetch(tokenUrl, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: new URLSearchParams({
			grant_type: 'client_credentials',
			client_id: CLIENT_ID,
			client_secret: CLIENT_SECRET,
		}),
	});

	const data = await response.json();
	return data.access_token;
}

async function lookupUser(workerToken, identifier) {
	const response = await fetch('http://localhost:3001/api/pingone/users/lookup', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			environmentId: ENV_ID,
			accessToken: workerToken,
			identifier: identifier,
		}),
	});

	return await response.json();
}

async function getPasswordState(workerToken, userId) {
	const response = await fetch(
		`http://localhost:3001/api/pingone/password/state?environmentId=${ENV_ID}&userId=${userId}&workerToken=${workerToken}`,
		{
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
		}
	);

	const data = await response.json();
	return data.passwordState;
}

async function forcePasswordChange(workerToken, userId) {
	const response = await fetch('http://localhost:3001/api/pingone/password/force-change', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			environmentId: ENV_ID,
			userId: userId,
			workerToken: workerToken,
		}),
	});

	return await response.json();
}

function highlightChanges(before, after, changedFields) {
	console.log('\n📊 COMPARISON:');
	console.log('='.repeat(70));

	changedFields.forEach((field) => {
		const beforeValue = field.split('.').reduce((obj, key) => obj?.[key], before);
		const afterValue = field.split('.').reduce((obj, key) => obj?.[key], after);

		if (beforeValue !== afterValue) {
			console.log(`\n${field}:`);
			console.log(`  BEFORE: ${JSON.stringify(beforeValue)}`);
			console.log(`  AFTER:  ${JSON.stringify(afterValue)} ⬅️  CHANGED!`);
		}
	});

	console.log('\n' + '='.repeat(70));
}

async function main() {
	console.log('🚀 Force Password Change Demo with Before/After Comparison');
	console.log('='.repeat(70));
	console.log(`Environment: ${ENV_ID}`);
	console.log(`Test User: ${TEST_USERNAME}`);
	console.log('='.repeat(70));
	console.log('');

	// Step 1: Get worker token
	console.log('🔑 Step 1: Getting worker token...');
	const workerToken = await getWorkerToken();
	console.log('✅ Worker token obtained\n');

	// Step 2: Look up user
	console.log(`🔍 Step 2: Looking up user "${TEST_USERNAME}"...`);
	const userLookup = await lookupUser(workerToken, TEST_USERNAME);

	if (!userLookup.user) {
		console.error('❌ User not found!');
		process.exit(1);
	}

	const userId = userLookup.user.id;
	console.log(`✅ User found: ${userId}`);
	console.log(`   Username: ${userLookup.user.username}`);
	console.log(`   Email: ${userLookup.user.email}\n`);

	// Step 3: Get password state BEFORE
	console.log('📋 Step 3: Getting password state BEFORE force change...');
	const passwordStateBefore = await getPasswordState(workerToken, userId);
	console.log('✅ Password state retrieved');
	console.log(`   Status: ${passwordStateBefore.status}`);
	console.log(`   Last Changed: ${passwordStateBefore.lastChangedAt || 'N/A'}\n`);

	// Step 4: Force password change
	console.log('🔐 Step 4: Forcing password change...');
	const forceResult = await forcePasswordChange(workerToken, userId);

	if (!forceResult.success) {
		console.error('❌ Force password change failed:', forceResult);
		process.exit(1);
	}

	console.log('✅ Password change forced successfully!');
	console.log(`   Message: ${forceResult.message}\n`);

	// Step 5: Get password state AFTER
	console.log('📋 Step 5: Getting password state AFTER force change...');
	const passwordStateAfter = await getPasswordState(workerToken, userId);
	console.log('✅ Password state retrieved');
	console.log(`   Status: ${passwordStateAfter.status}`);
	console.log(`   Last Changed: ${passwordStateAfter.lastChangedAt || 'N/A'}\n`);

	// Step 6: Highlight changes
	console.log('🎯 Step 6: Analyzing changes...');
	highlightChanges(passwordStateBefore, passwordStateAfter, ['status', 'lastChangedAt']);

	// Summary
	console.log('\n✨ SUMMARY:');
	console.log('='.repeat(70));
	console.log(`User: ${TEST_USERNAME} (${userId})`);
	console.log(
		`Password Status Changed: ${passwordStateBefore.status} → ${passwordStateAfter.status}`
	);
	console.log('');
	console.log('What this means:');
	console.log('  • User will be prompted to change password on next login');
	console.log('  • Current password still works until changed');
	console.log('  • User cannot skip the password change prompt');
	console.log('='.repeat(70));
}

main().catch((error) => {
	console.error('Fatal error:', error);
	process.exit(1);
});
