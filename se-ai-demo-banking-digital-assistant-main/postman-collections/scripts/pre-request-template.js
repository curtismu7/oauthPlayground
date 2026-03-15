/**
 * Pre-Request Script Template for Banking API Postman Collections
 * 
 * This template can be copied into the pre-request script section of
 * individual requests or collections to handle OAuth authentication.
 * 
 * Usage:
 * 1. Copy this entire script into your pre-request script section
 * 2. Modify the configuration variables as needed
 * 3. Uncomment the appropriate sections based on your needs
 */

// ============================================================================
// CONFIGURATION - Modify these values based on your environment
// ============================================================================

const OAUTH_CONFIG = {
    // OAuth endpoints
    authUrl: pm.environment.get("oauth_auth_url") || "https://auth.pingone.com/{{oauth_tenant}}/as/authorize",
    tokenUrl: pm.environment.get("oauth_token_url") || "https://auth.pingone.com/{{oauth_tenant}}/as/token",
    
    // Client credentials
    clientId: pm.environment.get("client_id"),
    clientSecret: pm.environment.get("client_secret"),
    
    // Redirect URI (for manual OAuth flow)
    redirectUri: pm.environment.get("redirect_uri") || "https://oauth.pstmn.io/v1/callback",
    
    // Required scopes for this request (modify as needed)
    requiredScopes: ["banking:read"] // Change based on endpoint requirements
};

// ============================================================================
// OAUTH TOKEN MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Check if the current access token is valid and not expired
 */
function isTokenValid() {
    const accessToken = pm.environment.get("access_token");
    const expiresAt = pm.environment.get("token_expires_at");
    
    if (!accessToken) {
        console.log("❌ No access token found");
        return false;
    }
    
    if (!expiresAt) {
        console.log("❌ No token expiration time found");
        return false;
    }
    
    const currentTime = Date.now();
    const tokenExpiryTime = parseInt(expiresAt);
    const bufferTime = 5 * 60 * 1000; // 5 minutes buffer
    
    if (currentTime >= (tokenExpiryTime - bufferTime)) {
        console.log("❌ Token is expired or will expire soon");
        return false;
    }
    
    console.log("✅ Token is valid");
    return true;
}

/**
 * Decode JWT token payload
 */
function decodeJWT(token) {
    try {
        if (!token) return null;
        
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        
        const payload = parts[1];
        const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
        const decodedPayload = atob(paddedPayload.replace(/-/g, '+').replace(/_/g, '/'));
        
        return JSON.parse(decodedPayload);
    } catch (error) {
        console.log("❌ Error decoding JWT:", error.message);
        return null;
    }
}

/**
 * Validate token scopes
 */
function validateTokenScopes(token, requiredScopes) {
    const payload = decodeJWT(token);
    if (!payload) return false;
    
    const tokenScopes = payload.scope ? payload.scope.split(' ') : [];
    const hasAllScopes = requiredScopes.every(scope => tokenScopes.includes(scope));
    
    if (!hasAllScopes) {
        const missingScopes = requiredScopes.filter(scope => !tokenScopes.includes(scope));
        console.log("❌ Missing required scopes:", missingScopes);
        return false;
    }
    
    console.log("✅ Token has all required scopes");
    return true;
}

/**
 * Set up environment variables from token
 */
function setupEnvironmentFromToken(token) {
    const payload = decodeJWT(token);
    if (!payload) return;
    
    pm.environment.set("user_id", payload.sub || payload.user_id || "");
    pm.environment.set("username", payload.preferred_username || payload.username || "");
    pm.environment.set("user_email", payload.email || "");
    
    console.log("✅ Environment variables updated from token");
}

/**
 * Attempt to refresh the access token
 */
function attemptTokenRefresh() {
    const refreshToken = pm.environment.get("refresh_token");
    
    if (!refreshToken) {
        console.log("❌ No refresh token available");
        return false;
    }
    
    console.log("🔄 Attempting to refresh access token...");
    
    const refreshRequest = {
        url: OAUTH_CONFIG.tokenUrl,
        method: 'POST',
        header: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
        },
        body: {
            mode: 'urlencoded',
            urlencoded: [
                { key: 'grant_type', value: 'refresh_token' },
                { key: 'refresh_token', value: refreshToken },
                { key: 'client_id', value: OAUTH_CONFIG.clientId },
                { key: 'client_secret', value: OAUTH_CONFIG.clientSecret }
            ]
        }
    };
    
    pm.sendRequest(refreshRequest, (err, response) => {
        if (err) {
            console.log("❌ Error refreshing token:", err);
            return;
        }
        
        if (response.code === 200) {
            const responseBody = response.json();
            
            // Store new tokens
            pm.environment.set("access_token", responseBody.access_token);
            if (responseBody.refresh_token) {
                pm.environment.set("refresh_token", responseBody.refresh_token);
            }
            
            // Calculate expiration
            const expiresIn = responseBody.expires_in || 3600;
            const expiresAt = Date.now() + (expiresIn * 1000);
            pm.environment.set("token_expires_at", expiresAt.toString());
            
            console.log("✅ Token refreshed successfully");
            setupEnvironmentFromToken(responseBody.access_token);
            
        } else {
            console.log("❌ Token refresh failed:", response.code, response.text());
            // Clear invalid tokens
            pm.environment.unset("access_token");
            pm.environment.unset("refresh_token");
            pm.environment.unset("token_expires_at");
        }
    });
}

// ============================================================================
// MAIN EXECUTION LOGIC
// ============================================================================

console.log("🚀 Starting pre-request authentication check...");

// Check if we have a valid token
if (!isTokenValid()) {
    console.log("⚠️ Token is invalid or expired");
    
    // Try to refresh the token
    attemptTokenRefresh();
    
    // If no refresh token, provide instructions
    const refreshToken = pm.environment.get("refresh_token");
    if (!refreshToken) {
        console.log("📋 Manual authentication required:");
        console.log("1. Run the OAuth Login Flow request first");
        console.log("2. Complete the authorization in your browser");
        console.log("3. The callback will store the tokens automatically");
        console.log("4. Then retry this request");
    }
} else {
    // Token is valid, check scopes if required
    const accessToken = pm.environment.get("access_token");
    
    if (OAUTH_CONFIG.requiredScopes.length > 0) {
        if (!validateTokenScopes(accessToken, OAUTH_CONFIG.requiredScopes)) {
            console.log("❌ Insufficient scopes for this request");
            console.log("Required scopes:", OAUTH_CONFIG.requiredScopes);
            
            // Get current scopes for comparison
            const payload = decodeJWT(accessToken);
            const currentScopes = payload && payload.scope ? payload.scope.split(' ') : [];
            console.log("Current scopes:", currentScopes);
        }
    }
    
    // Set the Authorization header
    pm.request.headers.add({
        key: 'Authorization',
        value: `Bearer ${accessToken}`
    });
    
    console.log("✅ Authorization header set");
}

// ============================================================================
// OPTIONAL: REQUEST-SPECIFIC CUSTOMIZATIONS
// ============================================================================

// Uncomment and modify as needed for specific requests:

// Set dynamic test data
// pm.environment.set("unique_id", Date.now().toString());
// pm.environment.set("test_email", `test${Date.now()}@example.com`);

// Log request details for debugging
// console.log("Request URL:", pm.request.url.toString());
// console.log("Request Method:", pm.request.method);

// Add custom headers if needed
// pm.request.headers.add({
//     key: 'X-Request-ID',
//     value: pm.variables.replaceIn('{{$guid}}')
// });

console.log("✅ Pre-request script completed");

// ============================================================================
// USAGE NOTES
// ============================================================================

/*
SCOPE REQUIREMENTS BY ENDPOINT:

End User Endpoints:
- GET /api/accounts (own accounts): ["banking:read"]
- GET /api/transactions (own): ["banking:read"] 
- POST /api/transactions: ["banking:write"]
- GET /api/users/me: ["banking:read"]
- PUT /api/users/me: ["banking:write"]

Admin Endpoints:
- GET /api/admin/users: ["banking:admin"]
- POST /api/admin/users: ["banking:admin"]
- GET /api/admin/accounts: ["banking:admin"]
- GET /api/admin/transactions: ["banking:admin"]
- GET /api/admin/activity-logs: ["banking:admin"]

To use this script:
1. Copy into Collection or Request pre-request script
2. Update OAUTH_CONFIG.requiredScopes for each endpoint
3. Ensure environment variables are set:
   - oauth_auth_url
   - oauth_token_url  
   - client_id
   - client_secret
   - redirect_uri
*/