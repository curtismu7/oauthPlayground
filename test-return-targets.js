/**
 * Test script to verify ReturnTargetServiceV8U functionality
 * Run this in browser console to test the implementation
 */

// Test 1: Check if ReturnTargetServiceV8U is available
console.log('🧪 Test 1: Check ReturnTargetServiceV8U availability');
if (typeof window.ReturnTargetServiceV8U !== 'undefined') {
	console.log('✅ ReturnTargetServiceV8U is available');
} else {
	console.log('❌ ReturnTargetServiceV8U not found - check if import worked');
}

// Test 2: Set and consume return targets
console.log('\n🧪 Test 2: Set and consume return targets');

// Set device registration target
if (window.ReturnTargetServiceV8U) {
	window.ReturnTargetServiceV8U.setReturnTarget('mfa_device_registration', '/v8/unified-mfa', 2);
	console.log('✅ Set device registration return target');

	// Peek at the target
	const peeked = window.ReturnTargetServiceV8U.peekReturnTarget('mfa_device_registration');
	console.log('🔍 Peeked target:', peeked);

	// Consume the target
	const consumed = window.ReturnTargetServiceV8U.consumeReturnTarget('mfa_device_registration');
	console.log('🎯 Consumed target:', consumed);

	// Verify it's gone
	const afterConsume = window.ReturnTargetServiceV8U.peekReturnTarget('mfa_device_registration');
	console.log('🔍 After consume:', afterConsume);
}

// Test 3: Check all return targets
console.log('\n🧪 Test 3: Check all return targets');
if (window.ReturnTargetServiceV8U) {
	const allTargets = window.ReturnTargetServiceV8U.getAllReturnTargets();
	console.log('📋 All return targets:', allTargets);

	const hasAny = window.ReturnTargetServiceV8U.hasAnyReturnTarget();
	console.log('🔍 Has any targets:', hasAny);
}

// Test 4: Simulate callback handler behavior
console.log('\n🧪 Test 4: Simulate callback handler behavior');
if (window.ReturnTargetServiceV8U) {
	// Set a target like the callback handler would find
	window.ReturnTargetServiceV8U.setReturnTarget('mfa_device_authentication', '/v8/mfa-hub', 2);

	console.log('✅ Set device authentication target');

	// Simulate callback handler checking for targets
	const deviceAuthTarget = window.ReturnTargetServiceV8U.peekReturnTarget(
		'mfa_device_authentication'
	);
	if (deviceAuthTarget) {
		console.log('🎯 Callback handler would redirect to:', deviceAuthTarget.path);
		console.log('📍 Step:', deviceAuthTarget.step);

		// Simulate consumption
		const consumed = window.ReturnTargetServiceV8U.consumeReturnTarget('mfa_device_authentication');
		console.log('✅ Callback handler consumed target:', consumed);
	} else {
		console.log('❌ No device authentication target found');
	}
}

console.log('\n🎉 Return target service tests completed!');
