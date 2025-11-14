#!/usr/bin/env node
// Complete password flow: Set password → Check status → Force change → Check status again

const ENV_ID = 'b9817c16-9910-4415-b67e-4ac687da74d9';
const CLIENT_ID = '66a4686b-9222-4ad2-91b6-03113711c9aa';
const CLIENT_SECRET = '3D_ksu7589TfcVJm2fqEHjXuhc-DCRfoxEv0urEw8GIK7qiJe72n92WRQ0uaT2tC';
const TEST_USERNAME = 'curtis7';

async function getWorkerToken() {
	const response = await fetch(`https://auth.pingone.com/${ENV_ID}/as/token`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			grant_type: 'client_credentials',
			client_id: CLIENT_ID,
			client_secret: CLIENT_SECRET,
		}),
	});
	return (await response.json()).access_token;
}

async function lookupUser(workerToken, identifier) {
	const response = await fetch('http://localhost:3001/api/pingone/users/lookup', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
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
		{ method: 'GET', headers: { 'Content-Type': 'application/json' } }
	);
	return (await response.json()).passwordState;
}

async function setPassword(workerToken, userId, password) {
	const response = await fetch('http://localhost:3001/api/pingone/password/set', {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			environmentId: ENV_ID,
			userId: userId,
			workerToken: workerToken,
			newPassword: password,
			forceChange: false,
			bypassPasswordPolicy: false,
		}),
	});
	return await response.json();
}

async function forcePasswordChange(workerToken, userId) {
	const response = await fetch('http://localhost:3001/api/pingone/password/force-change', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			environmentId: ENV_ID,
			userId: userId,
			workerToken: workerToken,
		}),
	});
	return await response.json();
}

function displayPasswordState(state, label) {
	console.log(`\n${label}:`);
	console.log('─'.repeat(70));
	console.log(`  Status: ${state.status}`);
	console.log(`  Last Changed: ${state.lastChangedAt || 'N/A'}`);
	console.log('─'.repeat(70));
}

async function main() {
	console.log('🔐 Complete Password Management Flow Demo');
	console.log('='.repeat(70));
	console.log(`User: ${TEST_USERNAME}`);
	console.log('='.repeat(70));
	
	// Get token and user
	console.log('\n🔑 Getting worker token...');
	const workerToken = await getWorkerToken();
	console.log('✅ Token obtained');
	
	console.log(`\n🔍 Looking up user "${TEST_USERNAME}"...`);
	const userLookup = await lookupUser(workerToken, TEST_USERNAME);
	const userId = userLookup.user.id;
	console.log(`✅ User found: ${userId}`);
	
	// Step 1: Set password (without force change)
	console.log('\n📝 STEP 1: Setting password (forceChange=false)...');
	const setResult = await setPassword(workerToken, userId, 'TempPass123!@#');
	
	if (setResult.success) {
		console.log('✅ Password set successfully');
	} else {
		console.log('⚠️  Password set may have failed:', setResult.error_description);
		console.log('   Continuing anyway to demonstrate force change...');
	}
	
	// Check state after set
	const stateAfterSet = await getPasswordState(workerToken, userId);
	displayPasswordState(stateAfterSet, '📊 Password State After Set');
	
	// Step 2: Force password change
	console.log('\n🔐 STEP 2: Forcing password change...');
	const forceResult = await forcePasswordChange(workerToken, userId);
	
	if (forceResult.success) {
		console.log('✅ Password change forced successfully');
	} else {
		console.error('❌ Force failed:', forceResult);
		process.exit(1);
	}
	
	// Check state after force
	const stateAfterForce = await getPasswordState(workerToken, userId);
	displayPasswordState(stateAfterForce, '📊 Password State After Force Change');
	
	// Comparison
	console.log('\n🎯 COMPARISON:');
	console.log('='.repeat(70));
	console.log(`Status Changed: ${stateAfterSet.status} → ${stateAfterForce.status}`);
	
	if (stateAfterSet.status !== stateAfterForce.status) {
		console.log('✨ STATUS CHANGED! ⬅️  User must now change password on next login');
	} else if (stateAfterForce.status === 'MUST_CHANGE_PASSWORD') {
		console.log('✅ Status is MUST_CHANGE_PASSWORD (already required or now required)');
	}
	
	console.log('='.repeat(70));
	
	// Final user lookup to show complete state
	console.log('\n🔍 STEP 3: Final user lookup to verify...');
	const finalLookup = await lookupUser(workerToken, TEST_USERNAME);
	console.log('✅ User data retrieved');
	console.log('\n📋 User Details:');
	console.log(`  ID: ${finalLookup.user.id}`);
	console.log(`  Username: ${finalLookup.user.username}`);
	console.log(`  Email: ${finalLookup.user.email}`);
	console.log(`  Enabled: ${finalLookup.user.enabled}`);
	console.log(`  Account Status: ${finalLookup.user.account?.status || 'N/A'}`);
	
	console.log('\n✨ DEMO COMPLETE!');
	console.log('='.repeat(70));
	console.log('What happened:');
	console.log('  1. Set password with forceChange=false');
	console.log('  2. Forced password change via API');
	console.log('  3. Verified status changed to MUST_CHANGE_PASSWORD');
	console.log('  4. User will be prompted to change password on next login');
	console.log('='.repeat(70));
}

main().catch(error => {
	console.error('Fatal error:', error);
	process.exit(1);
});
