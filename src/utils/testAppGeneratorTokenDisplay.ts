// src/utils/testAppGeneratorTokenDisplay.ts
// Test utility to verify TokenDisplayService integration in App Generator

import TokenDisplayService from '../services/tokenDisplayService';

export function testAppGeneratorTokenDisplay() {
	console.log('🧪 Testing App Generator Token Display...');

	try {
		// Test with a mock JWT token (similar to what PingOne might return)
		const mockJWTToken =
			'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImNsaWVudF9pZCI6InRlc3QtY2xpZW50IiwiaXNzIjoiaHR0cHM6Ly9hdXRoLnBpbmdvbmUuY29tIiwiYXVkIjoiYXBpLnBpbmdvbmUuY29tIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyNDI2MjIsInNjb3BlIjoicDE6cmVhZDp1c2VyIHAxOnVwZGF0ZTp1c2VyIn0.invalid-signature';

		// Test with a mock opaque token
		const mockOpaqueToken = 'at_abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567';

		// Test 1: JWT Token Detection
		const isJWT = TokenDisplayService.isJWT(mockJWTToken);
		console.log(
			`✅ JWT Detection: ${isJWT ? 'Correctly identified as JWT' : 'Failed to identify JWT'}`
		);

		// Test 2: Opaque Token Detection
		const isOpaque = !TokenDisplayService.isJWT(mockOpaqueToken);
		console.log(
			`✅ Opaque Token Detection: ${isOpaque ? 'Correctly identified as opaque' : 'Failed to identify opaque'}`
		);

		// Test 3: Token Masking
		const maskedJWT = TokenDisplayService.maskToken(mockJWTToken, 8);
		const maskedOpaque = TokenDisplayService.maskToken(mockOpaqueToken, 4);
		console.log(`✅ JWT Token Masking: ${maskedJWT.includes('...') ? 'Working' : 'Failed'}`);
		console.log(`✅ Opaque Token Masking: ${maskedOpaque.includes('...') ? 'Working' : 'Failed'}`);

		// Test 4: JWT Decoding
		if (isJWT) {
			const decoded = TokenDisplayService.decodeJWT(mockJWTToken);
			console.log(`✅ JWT Decoding: ${decoded ? 'Successfully decoded' : 'Failed to decode'}`);
			if (decoded) {
				console.log(`   - Header Algorithm: ${decoded.header.alg}`);
				console.log(`   - Payload Subject: ${decoded.payload.sub}`);
				console.log(`   - Client ID: ${decoded.payload.client_id || 'Not present'}`);
			}
		}

		// Test 5: Token Labels
		const accessLabel = TokenDisplayService.getTokenLabel('access', false);
		console.log(`✅ Token Label: ${accessLabel}`);

		// Test 6: Opaque Token Message
		const opaqueMessage = TokenDisplayService.getOpaqueTokenMessage('access');
		console.log(`✅ Opaque Message: ${opaqueMessage ? 'Message generated' : 'No message'}`);

		console.log('🎉 App Generator Token Display tests completed!');
		return true;
	} catch (error) {
		console.error('❌ App Generator Token Display test failed:', error);
		return false;
	}
}

// Auto-run test in development
if (process.env.NODE_ENV === 'development') {
	// Delay to ensure DOM is ready
	setTimeout(() => {
		testAppGeneratorTokenDisplay();
	}, 3000);
}
