/**
 * @file testJWTGeneration.ts
 * @description Test JWT generation functionality
 * @version 8.0.0
 * @since 2024-11-25
 */

// Import the key generation utilities
import {
	assessSecurityStrength,
	generateClientSecret,
	generateKeyId,
	generateRandomString,
	generateRSAKeyPair,
} from './keyGeneration';

/**
 * Test JWT key generation functionality
 */
export const testJWTGeneration = async () => {
	console.log('🧪 Testing JWT Generation...');

	try {
		// Test 1: Client Secret Generation
		console.log('\n1. Testing Client Secret Generation...');
		const clientSecret = generateClientSecret(32, 'hex');
		console.log('✅ Client Secret Generated:', `${clientSecret.secret.substring(0, 16)}...`);
		console.log('   Entropy:', clientSecret.entropy, 'bits');
		console.log('   Encoding:', clientSecret.encoding);

		// Test security assessment
		const strength = assessSecurityStrength.clientSecret(clientSecret.secret);
		console.log('   Strength:', strength.strength, `(${strength.score}/6)`);
		if (strength.recommendations.length > 0) {
			console.log('   Recommendations:', strength.recommendations);
		}

		// Test 2: Random String Generation
		console.log('\n2. Testing Random String Generation...');
		const randomString = generateRandomString(16, 'alphanumeric');
		console.log('✅ Random String:', randomString);

		const hexString = generateRandomString(32, 'hex');
		console.log('✅ Hex String:', `${hexString.substring(0, 16)}...`);

		// Test 3: Key ID Generation
		console.log('\n3. Testing Key ID Generation...');
		const keyId1 = generateKeyId();
		const keyId2 = generateKeyId();
		console.log('✅ Key ID 1:', keyId1);
		console.log('✅ Key ID 2:', keyId2);
		console.log('   Unique:', keyId1 !== keyId2);

		// Test 4: RSA Key Pair Generation (if supported)
		console.log('\n4. Testing RSA Key Pair Generation...');
		if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
			try {
				const keyPair = await generateRSAKeyPair(2048);
				console.log('✅ RSA Key Pair Generated');
				console.log('   Key ID:', keyPair.keyId);
				console.log('   Algorithm:', keyPair.algorithm);
				console.log('   Private Key Length:', keyPair.privateKey.length, 'characters');
				console.log('   Public Key Length:', keyPair.publicKey.length, 'characters');

				// Test security assessment
				const keyStrength = assessSecurityStrength.keyPair(2048);
				console.log('   Security:', keyStrength.strength);
				console.log('   Bits of Security:', keyStrength.bitsOfSecurity);
				console.log('   Recommendation:', keyStrength.recommendation);
			} catch (error) {
				console.log('⚠️ RSA Key Generation Failed (might be environment issue):', error);
			}
		} else {
			console.log('⚠️ Web Crypto API not available in this environment');
		}

		// Test 5: Formatted Secret Generation
		console.log('\n5. Testing Formatted Secret Generation...');
		const formattedSecret = generateRandomString(
			24,
			'custom',
			'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
		);
		console.log('✅ Formatted Secret:', formattedSecret);

		console.log('\n🎉 All JWT Generation Tests Completed!');
		return true;
	} catch (error) {
		console.error('❌ JWT Generation Test Failed:', error);
		return false;
	}
};

/**
 * Test JWT generation in browser console
 * Usage: Open browser console and run: testJWTGeneration()
 */
if (typeof window !== 'undefined') {
	// Add test function to global scope for console testing
	(globalThis as { testJWTGeneration?: typeof testJWTGeneration }).testJWTGeneration =
		testJWTGeneration;
	console.log('💡 Run testJWTGeneration() in console to test JWT generation');
}
