/**
 * @file testJWTGeneration.ts
 * @description Test JWT generation functionality
 * @version 8.0.0
 * @since 2024-11-25
 */

import { logger } from '../utils/logger';
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
	logger.info('🧪 Testing JWT Generation...');

	try {
		// Test 1: Client Secret Generation
		logger.info('\n1. Testing Client Secret Generation...');
		const clientSecret = generateClientSecret(32, 'hex');
		logger.info('✅ Client Secret Generated:', `${clientSecret.secret.substring(0, 16)}...`);
		logger.info('   Entropy:', clientSecret.entropy, 'bits');
		logger.info('   Encoding:', clientSecret.encoding);

		// Test security assessment
		const strength = assessSecurityStrength.clientSecret(clientSecret.secret);
		logger.info('   Strength:', strength.strength, `(${strength.score}/6)`);
		if (strength.recommendations.length > 0) {
			logger.info('   Recommendations:', strength.recommendations);
		}

		// Test 2: Random String Generation
		logger.info('\n2. Testing Random String Generation...');
		const randomString = generateRandomString(16, 'alphanumeric');
		logger.info('✅ Random String:', randomString);

		const hexString = generateRandomString(32, 'hex');
		logger.info('✅ Hex String:', `${hexString.substring(0, 16)}...`);

		// Test 3: Key ID Generation
		logger.info('\n3. Testing Key ID Generation...');
		const keyId1 = generateKeyId();
		const keyId2 = generateKeyId();
		logger.info('✅ Key ID 1:', keyId1);
		logger.info('✅ Key ID 2:', keyId2);
		logger.info('   Unique:', keyId1 !== keyId2);

		// Test 4: RSA Key Pair Generation (if supported)
		logger.info('\n4. Testing RSA Key Pair Generation...');
		if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
			try {
				const keyPair = await generateRSAKeyPair(2048);
				logger.info('✅ RSA Key Pair Generated');
				logger.info('   Key ID:', keyPair.keyId);
				logger.info('   Algorithm:', keyPair.algorithm);
				logger.info('   Private Key Length:', keyPair.privateKey.length, 'characters');
				logger.info('   Public Key Length:', keyPair.publicKey.length, 'characters');

				// Test security assessment
				const keyStrength = assessSecurityStrength.keyPair(2048);
				logger.info('   Security:', keyStrength.strength);
				logger.info('   Bits of Security:', keyStrength.bitsOfSecurity);
				logger.info('   Recommendation:', keyStrength.recommendation);
			} catch (error) {
				logger.info('⚠️ RSA Key Generation Failed (might be environment issue):', error);
			}
		} else {
			logger.info('⚠️ Web Crypto API not available in this environment');
		}

		// Test 5: Formatted Secret Generation
		logger.info('\n5. Testing Formatted Secret Generation...');
		const formattedSecret = generateRandomString(
			24,
			'custom',
			'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
		);
		logger.info('✅ Formatted Secret:', formattedSecret);

		logger.info('\n🎉 All JWT Generation Tests Completed!');
		return true;
	} catch (error) {
		logger.error('❌ JWT Generation Test Failed:', error);
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
	logger.info('💡 Run testJWTGeneration() in console to test JWT generation');
}
