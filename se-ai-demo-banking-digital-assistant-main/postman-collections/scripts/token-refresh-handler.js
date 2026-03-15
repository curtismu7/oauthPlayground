/**
 * Token Refresh Handler for Postman Collections
 * 
 * This script handles automatic token refresh logic and can be included
 * in pre-request scripts to ensure valid tokens for API calls.
 */

/**
 * Attempt to refresh the access token using the refresh token
 * @param {object} config - Refresh configuration
 * @returns {Promise<boolean>} True if refresh was successful
 */
async function refreshAccessToken(config) {
    const {
        tokenUrl,
        clientId,
        clientSecret,
        refreshToken
    } = config;
    
    if (!refreshToken) {
        console.log("No refresh token available");
        return false;
    }
    
    console.log("Attempting to refresh access token...");
    
    try {
        const refreshRequest = {
            url: tokenUrl,
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
                    { key: 'client_id', value: clientId },
                    { key: 'client_secret', value: clientSecret }
                ]
            }
        };
        
        // Send the refresh request
        pm.sendRequest(refreshRequest, (err, response) => {
            if (err) {
                console.log("Error refreshing token:", err);
                return false;
            }
            
            if (response.code === 200) {
                const responseBody = response.json();
                
                // Store new tokens
                pm.environment.set("access_token", responseBody.access_token);
                
                if (responseBody.refresh_token) {
                    pm.environment.set("refresh_token", responseBody.refresh_token);
                }
                
                // Calculate and store expiration time
                const expiresIn = responseBody.expires_in || 3600; // Default 1 hour
                const expiresAt = Date.now() + (expiresIn * 1000);
                pm.environment.set("token_expires_at", expiresAt.toString());
                
                console.log("Token refreshed successfully");
                console.log("New token expires at:", new Date(expiresAt).toISOString());
                
                // Update environment variables from new token
                setupEnvironmentFromToken(responseBody.access_token);
                
                return true;
            } else {
                console.log("Token refresh failed with status:", response.code);
                console.log("Response:", response.text());
                
                // Clear invalid tokens
                clearTokens();
                return false;
            }
        });
        
    } catch (error) {
        console.log("Exception during token refresh:", error.message);
        return false;
    }
}

/**
 * Clear all stored tokens from environment
 */
function clearTokens() {
    console.log("Clearing stored tokens");
    pm.environment.unset("access_token");
    pm.environment.unset("refresh_token");
    pm.environment.unset("token_expires_at");
    pm.environment.unset("user_id");
    pm.environment.unset("username");
    pm.environment.unset("user_email");
    pm.environment.unset("user_roles");
    pm.environment.unset("token_scopes");
}

/**
 * Check token validity and refresh if needed
 * This is the main function to call in pre-request scripts
 * @param {object} config - OAuth configuration
 * @returns {boolean} True if valid token is available
 */
function ensureValidToken(config) {
    // First check if current token is valid
    if (isTokenValid()) {
        console.log("Current token is valid, proceeding with request");
        return true;
    }
    
    // Try to refresh the token
    const refreshConfig = {
        tokenUrl: config.tokenUrl || pm.environment.get("oauth_token_url"),
        clientId: config.clientId || pm.environment.get("client_id"),
        clientSecret: config.clientSecret || pm.environment.get("client_secret"),
        refreshToken: pm.environment.get("refresh_token")
    };
    
    // Note: In Postman, we can't use async/await in pre-request scripts
    // So we'll use the synchronous approach with pm.sendRequest callback
    const refreshToken = pm.environment.get("refresh_token");
    
    if (!refreshToken) {
        console.log("No refresh token available. Manual authentication required.");
        console.log("Please run the OAuth login flow first.");
        return false;
    }
    
    console.log("Token expired or invalid. Attempting refresh...");
    
    // Prepare refresh request
    const refreshRequest = {
        url: refreshConfig.tokenUrl,
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
                { key: 'client_id', value: refreshConfig.clientId },
                { key: 'client_secret', value: refreshConfig.clientSecret }
            ]
        }
    };
    
    // Send refresh request synchronously
    pm.sendRequest(refreshRequest, (err, response) => {
        if (err) {
            console.log("Error refreshing token:", err);
            clearTokens();
            return;
        }
        
        if (response.code === 200) {
            const responseBody = response.json();
            
            // Store new tokens
            pm.environment.set("access_token", responseBody.access_token);
            
            if (responseBody.refresh_token) {
                pm.environment.set("refresh_token", responseBody.refresh_token);
            }
            
            // Calculate and store expiration time
            const expiresIn = responseBody.expires_in || 3600;
            const expiresAt = Date.now() + (expiresIn * 1000);
            pm.environment.set("token_expires_at", expiresAt.toString());
            
            console.log("Token refreshed successfully");
            
            // Update environment variables from new token
            if (typeof setupEnvironmentFromToken === 'function') {
                setupEnvironmentFromToken(responseBody.access_token);
            }
            
        } else {
            console.log("Token refresh failed with status:", response.code);
            console.log("Response:", response.text());
            clearTokens();
        }
    });
    
    // Return true to continue with the request
    // The refresh happens asynchronously
    return true;
}

/**
 * Validate that the current request has proper authorization
 * @param {string[]} requiredScopes - Scopes required for this request
 * @returns {boolean} True if authorized
 */
function validateRequestAuthorization(requiredScopes = []) {
    const accessToken = pm.environment.get("access_token");
    
    if (!accessToken) {
        console.log("No access token available for request");
        return false;
    }
    
    if (!isTokenValid()) {
        console.log("Token is invalid or expired");
        return false;
    }
    
    if (requiredScopes.length > 0) {
        if (!validateTokenScopes(accessToken, requiredScopes)) {
            console.log("Token does not have required scopes for this request");
            return false;
        }
    }
    
    console.log("Request is properly authorized");
    return true;
}

/**
 * Set the Authorization header for the current request
 */
function setAuthorizationHeader() {
    const accessToken = pm.environment.get("access_token");
    
    if (accessToken) {
        pm.request.headers.add({
            key: 'Authorization',
            value: `Bearer ${accessToken}`
        });
        console.log("Authorization header set");
    } else {
        console.log("No access token available to set in Authorization header");
    }
}

// Export functions for use in Postman scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        refreshAccessToken,
        clearTokens,
        ensureValidToken,
        validateRequestAuthorization,
        setAuthorizationHeader
    };
}