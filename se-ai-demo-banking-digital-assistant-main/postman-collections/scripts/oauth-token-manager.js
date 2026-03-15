/**
 * OAuth Token Management Utilities for Postman Collections
 * 
 * This script provides reusable functions for OAuth token management,
 * validation, and JWT decoding in Postman pre-request scripts.
 */

/**
 * Check if the current access token is valid and not expired
 * @returns {boolean} True if token is valid, false otherwise
 */
function isTokenValid() {
    const accessToken = pm.environment.get("access_token");
    const expiresAt = pm.environment.get("token_expires_at");
    
    if (!accessToken) {
        console.log("No access token found");
        return false;
    }
    
    if (!expiresAt) {
        console.log("No token expiration time found");
        return false;
    }
    
    const currentTime = Date.now();
    const tokenExpiryTime = parseInt(expiresAt);
    
    // Add 5 minute buffer before expiration
    const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
    
    if (currentTime >= (tokenExpiryTime - bufferTime)) {
        console.log("Token is expired or will expire soon");
        return false;
    }
    
    console.log("Token is valid");
    return true;
}

/**
 * Decode JWT token payload without verification
 * @param {string} token - JWT token to decode
 * @returns {object|null} Decoded payload or null if invalid
 */
function decodeJWT(token) {
    try {
        if (!token) {
            console.log("No token provided for decoding");
            return null;
        }
        
        const parts = token.split('.');
        if (parts.length !== 3) {
            console.log("Invalid JWT format");
            return null;
        }
        
        // Decode the payload (second part)
        const payload = parts[1];
        
        // Add padding if needed for base64 decoding
        const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
        
        // Decode base64
        const decodedPayload = atob(paddedPayload.replace(/-/g, '+').replace(/_/g, '/'));
        
        return JSON.parse(decodedPayload);
    } catch (error) {
        console.log("Error decoding JWT:", error.message);
        return null;
    }
}

/**
 * Validate that the token contains required scopes
 * @param {string} token - JWT token to validate
 * @param {string[]} requiredScopes - Array of required scopes
 * @returns {boolean} True if token has all required scopes
 */
function validateTokenScopes(token, requiredScopes) {
    const payload = decodeJWT(token);
    
    if (!payload) {
        console.log("Cannot validate scopes - invalid token");
        return false;
    }
    
    const tokenScopes = payload.scope ? payload.scope.split(' ') : [];
    console.log("Token scopes:", tokenScopes);
    console.log("Required scopes:", requiredScopes);
    
    // Check if all required scopes are present
    const hasAllScopes = requiredScopes.every(scope => tokenScopes.includes(scope));
    
    if (!hasAllScopes) {
        const missingScopes = requiredScopes.filter(scope => !tokenScopes.includes(scope));
        console.log("Missing required scopes:", missingScopes);
        return false;
    }
    
    console.log("Token has all required scopes");
    return true;
}

/**
 * Extract user information from JWT token
 * @param {string} token - JWT token to extract user info from
 * @returns {object|null} User information or null if not available
 */
function extractUserInfo(token) {
    const payload = decodeJWT(token);
    
    if (!payload) {
        return null;
    }
    
    return {
        userId: payload.sub || payload.user_id,
        username: payload.preferred_username || payload.username,
        email: payload.email,
        firstName: payload.given_name,
        lastName: payload.family_name,
        roles: payload.roles || [],
        scopes: payload.scope ? payload.scope.split(' ') : [],
        issuer: payload.iss,
        audience: payload.aud,
        issuedAt: payload.iat,
        expiresAt: payload.exp
    };
}

/**
 * Set up environment variables from token payload
 * @param {string} token - JWT token to extract information from
 */
function setupEnvironmentFromToken(token) {
    const userInfo = extractUserInfo(token);
    
    if (userInfo) {
        pm.environment.set("user_id", userInfo.userId || "");
        pm.environment.set("username", userInfo.username || "");
        pm.environment.set("user_email", userInfo.email || "");
        pm.environment.set("user_roles", JSON.stringify(userInfo.roles));
        pm.environment.set("token_scopes", JSON.stringify(userInfo.scopes));
        
        console.log("Environment variables set from token:");
        console.log("- User ID:", userInfo.userId);
        console.log("- Username:", userInfo.username);
        console.log("- Email:", userInfo.email);
        console.log("- Roles:", userInfo.roles);
        console.log("- Scopes:", userInfo.scopes);
    }
}

/**
 * Generate PKCE code verifier and challenge
 * @returns {object} Object containing code_verifier and code_challenge
 */
function generatePKCE() {
    // Generate random code verifier (43-128 characters)
    const codeVerifier = btoa(String.fromCharCode.apply(null, 
        crypto.getRandomValues(new Uint8Array(32))
    )).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    
    // For simplicity in Postman, we'll use the plain method
    // In production, you should use SHA256
    const codeChallenge = codeVerifier;
    
    return {
        code_verifier: codeVerifier,
        code_challenge: codeChallenge,
        code_challenge_method: 'plain'
    };
}

/**
 * Build OAuth authorization URL
 * @param {object} config - OAuth configuration object
 * @returns {string} Complete authorization URL
 */
function buildAuthorizationURL(config) {
    const {
        authUrl,
        clientId,
        redirectUri,
        scopes,
        state,
        codeChallenge,
        codeChallengeMethod = 'plain'
    } = config;
    
    const params = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: Array.isArray(scopes) ? scopes.join(' ') : scopes,
        state: state || 'postman-test-' + Date.now(),
        code_challenge: codeChallenge,
        code_challenge_method: codeChallengeMethod
    });
    
    return `${authUrl}?${params.toString()}`;
}

// Export functions for use in Postman scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        isTokenValid,
        decodeJWT,
        validateTokenScopes,
        extractUserInfo,
        setupEnvironmentFromToken,
        generatePKCE,
        buildAuthorizationURL
    };
}