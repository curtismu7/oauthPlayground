// src/utils/testAppGeneratorTokenDisplay.ts
// Test utility to verify TokenDisplayService integration in App Generator

import TokenDisplayService from '../services/tokenDisplayService';

export function testAppGeneratorTokenDisplay() {
	try {
		// Test with a mock JWT token (similar to what PingOne might return)
		const mockJWTToken =
			'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImNsaWVudF9pZCI6InRlc3QtY2xpZW50IiwiaXNzIjoiaHR0cHM6Ly9hdXRoLnBpbmdvbmUuY29tIiwiYXVkIjoiYXBpLnBpbmdvbmUuY29tIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyNDI2MjIsInNjb3BlIjoicDE6cmVhZDp1c2VyIHAxOnVwZGF0ZTp1c2VyIn0.invalid-signature';

		// Test with a mock opaque token
		const mockOpaqueToken = 'at_abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567';

		// Test 1: JWT Token Detection
		const isJWT = TokenDisplayService.isJWT(mockJWTToken);

		// Test 2: Opaque Token Detection
		!TokenDisplayService.isJWT(mockOpaqueToken);

		// Test 3: Token Masking
		TokenDisplayService.maskToken(mockJWTToken, 8);
		TokenDisplayService.maskToken(mockOpaqueToken, 4);

		// Test 4: JWT Decoding
		if (isJWT) {
			TokenDisplayService.decodeJWT(mockJWTToken);
		}

		// Test 5: Token Labels
		TokenDisplayService.getTokenLabel('access', false);

		// Test 6: Opaque Token Message
		TokenDisplayService.getOpaqueTokenMessage('access');

		return true;
	} catch (error) {
		console.error('❌ App Generator Token Display test failed:', error);
		return false;
	}
}

// Auto-run test in development (silently)
if (process.env.NODE_ENV === 'development') {
	// Delay to ensure DOM is ready
	setTimeout(() => {
		testAppGeneratorTokenDisplay();
	}, 3000);
}
