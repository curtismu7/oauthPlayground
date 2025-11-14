// src/utils/jwtDecoder.ts
// JWT Decoder Utility for displaying decoded JWT tokens

export interface DecodedJWT {
	header: Record<string, unknown>;
	payload: Record<string, unknown>;
	signature: string;
	raw: string;
}

/**
 * Decodes a JWT token and returns its header, payload, and signature
 * @param token - The JWT token to decode
 * @returns DecodedJWT object with header, payload, signature, and raw token
 */
export function decodeJWT(token: string): DecodedJWT | null {
	try {
		// Split the JWT into its three parts
		const parts = token.split('.');
		
		if (parts.length !== 3) {
			throw new Error('Invalid JWT format');
		}

		const [headerPart, payloadPart, signaturePart] = parts;

		// Decode header and payload (base64url decode)
		const header = JSON.parse(atob(headerPart.replace(/-/g, '+').replace(/_/g, '/')));
		const payload = JSON.parse(atob(payloadPart.replace(/-/g, '+').replace(/_/g, '/')));

		return {
			header,
			payload,
			signature: signaturePart,
			raw: token,
		};
	} catch (error) {
		console.error('Failed to decode JWT:', error);
		return null;
	}
}

/**
 * Checks if a string is a valid JWT token
 * @param token - The token to check
 * @returns true if the token appears to be a JWT
 */
export function isJWT(token: string): boolean {
	if (!token || typeof token !== 'string') {
		return false;
	}
	
	// JWT should have exactly 2 dots and be base64url encoded
	const parts = token.split('.');
	return parts.length === 3 && parts.every(part => part.length > 0);
}

/**
 * Formats a decoded JWT for display
 * @param decoded - The decoded JWT object
 * @returns Formatted string representation
 */
export function formatDecodedJWT(decoded: DecodedJWT): string {
	return `Header:
${JSON.stringify(decoded.header, null, 2)}

Payload:
${JSON.stringify(decoded.payload, null, 2)}

Signature: ${decoded.signature}`;
}








