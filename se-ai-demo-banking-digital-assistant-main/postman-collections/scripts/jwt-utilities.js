/**
 * JWT Utilities for Postman Collections
 * 
 * This script provides comprehensive JWT token handling utilities
 * including decoding, validation, and scope checking specifically
 * for the Banking API OAuth implementation.
 */

/**
 * Comprehensive JWT token decoder with error handling
 * @param {string} token - JWT token to decode
 * @returns {object} Object containing header, payload, and signature
 */
function decodeJWTComplete(token) {
    try {
        if (!token || typeof token !== 'string') {
            throw new Error("Invalid token provided");
        }
        
        const parts = token.split('.');
        if (parts.length !== 3) {
            throw new Error("Invalid JWT format - must have 3 parts");
        }
        
        const [headerB64, payloadB64, signature] = parts;
        
        // Decode header
        const header = JSON.parse(atob(addBase64Padding(headerB64.replace(/-/g, '+').replace(/_/g, '/'))));
        
        // Decode payload
        const payload = JSON.parse(atob(addBase64Padding(payloadB64.replace(/-/g, '+').replace(/_/g, '/'))));
        
        return {
            header,
            payload,
            signature,
            raw: {
                header: headerB64,
                payload: payloadB64,
                signature: signature
            }
        };
        
    } catch (error) {
        console.log("❌ JWT decode error:", error.message);
        return null;
    }
}

/**
 * Add padding to base64 string if needed
 * @param {string} str - Base64 string
 * @returns {string} Padded base64 string
 */
function addBase64Padding(str) {
    return str + '='.repeat((4 - str.length % 4) % 4);
}

/**
 * Validate JWT token structure and basic claims
 * @param {string} token - JWT token to validate
 * @returns {object} Validation result with details
 */
function validateJWTStructure(token) {
    const result = {
        isValid: false,
        errors: [],
        warnings: [],
        claims: null
    };
    
    const decoded = decodeJWTComplete(token);
    if (!decoded) {
        result.errors.push("Failed to decode JWT token");
        return result;
    }
    
    const { header, payload } = decoded;
    result.claims = payload;
    
    // Validate header
    if (!header.alg) {
        result.errors.push("Missing algorithm in header");
    }
    
    if (!header.typ || header.typ !== 'JWT') {
        result.warnings.push("Token type is not 'JWT'");
    }
    
    // Validate payload - standard claims
    if (!payload.iss) {
        result.warnings.push("Missing issuer (iss) claim");
    }
    
    if (!payload.sub) {
        result.errors.push("Missing subject (sub) claim");
    }
    
    if (!payload.aud) {
        result.warnings.push("Missing audience (aud) claim");
    }
    
    if (!payload.exp) {
        result.errors.push("Missing expiration (exp) claim");
    }
    
    if (!payload.iat) {
        result.warnings.push("Missing issued at (iat) claim");
    }
    
    // Validate expiration
    if (payload.exp) {
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp < now) {
            result.errors.push("Token has expired");
        } else if (payload.exp < now + 300) { // 5 minutes
            result.warnings.push("Token expires soon (within 5 minutes)");
        }
    }
    
    // Validate issued at time
    if (payload.iat) {
        const now = Math.floor(Date.now() / 1000);
        if (payload.iat > now + 60) { // 1 minute tolerance
            result.errors.push("Token issued in the future");
        }
    }
    
    // Banking API specific validations
    if (!payload.scope) {
        result.warnings.push("Missing scope claim");
    }
    
    result.isValid = result.errors.length === 0;
    
    return result;
}

/**
 * Extract and validate Banking API specific claims
 * @param {string} token - JWT token
 * @returns {object} Banking-specific token information
 */
function extractBankingClaims(token) {
    const decoded = decodeJWTComplete(token);
    if (!decoded) {
        return null;
    }
    
    const { payload } = decoded;
    
    return {
        // User identification
        userId: payload.sub || payload.user_id,
        username: payload.preferred_username || payload.username,
        email: payload.email,
        
        // User profile
        firstName: payload.given_name,
        lastName: payload.family_name,
        fullName: payload.name,
        
        // Authorization
        scopes: payload.scope ? payload.scope.split(' ') : [],
        roles: payload.roles || [],
        
        // Banking specific
        customerId: payload.customer_id,
        accountIds: payload.account_ids || [],
        
        // Token metadata
        issuer: payload.iss,
        audience: payload.aud,
        issuedAt: payload.iat ? new Date(payload.iat * 1000) : null,
        expiresAt: payload.exp ? new Date(payload.exp * 1000) : null,
        
        // Additional claims
        clientId: payload.client_id || payload.azp,
        sessionId: payload.sid,
        authTime: payload.auth_time ? new Date(payload.auth_time * 1000) : null
    };
}

/**
 * Check if token has specific scopes
 * @param {string} token - JWT token
 * @param {string|string[]} requiredScopes - Required scope(s)
 * @returns {object} Scope validation result
 */
function validateScopes(token, requiredScopes) {
    const result = {
        hasAllScopes: false,
        hasAnyScope: false,
        tokenScopes: [],
        missingScopes: [],
        extraScopes: []
    };
    
    const claims = extractBankingClaims(token);
    if (!claims) {
        return result;
    }
    
    result.tokenScopes = claims.scopes;
    
    // Normalize required scopes to array
    const required = Array.isArray(requiredScopes) ? requiredScopes : [requiredScopes];
    
    // Check which scopes are missing
    result.missingScopes = required.filter(scope => !claims.scopes.includes(scope));
    
    // Check for extra scopes
    result.extraScopes = claims.scopes.filter(scope => !required.includes(scope));
    
    // Determine if requirements are met
    result.hasAllScopes = result.missingScopes.length === 0;
    result.hasAnyScope = required.some(scope => claims.scopes.includes(scope));
    
    return result;
}

/**
 * Check if user has admin privileges
 * @param {string} token - JWT token
 * @returns {boolean} True if user has admin access
 */
function isAdminUser(token) {
    const claims = extractBankingClaims(token);
    if (!claims) return false;
    
    // Check for admin scope
    const hasAdminScope = claims.scopes.includes('banking:admin');
    
    // Check for admin role
    const hasAdminRole = claims.roles.includes('admin') || claims.roles.includes('administrator');
    
    return hasAdminScope || hasAdminRole;
}

/**
 * Get user permissions based on token
 * @param {string} token - JWT token
 * @returns {object} User permissions object
 */
function getUserPermissions(token) {
    const claims = extractBankingClaims(token);
    if (!claims) {
        return {
            canRead: false,
            canWrite: false,
            canAdmin: false,
            canAccessOwnData: false,
            canAccessAllData: false,
            scopes: [],
            roles: []
        };
    }
    
    const scopes = claims.scopes;
    const roles = claims.roles;
    
    return {
        canRead: scopes.includes('banking:read') || scopes.includes('banking:admin'),
        canWrite: scopes.includes('banking:write') || scopes.includes('banking:admin'),
        canAdmin: scopes.includes('banking:admin'),
        canAccessOwnData: scopes.includes('banking:read') || scopes.includes('banking:write'),
        canAccessAllData: scopes.includes('banking:admin'),
        scopes: scopes,
        roles: roles,
        isAdmin: isAdminUser(token)
    };
}

/**
 * Format token information for logging
 * @param {string} token - JWT token
 * @returns {string} Formatted token information
 */
function formatTokenInfo(token) {
    const claims = extractBankingClaims(token);
    if (!claims) {
        return "❌ Invalid token";
    }
    
    const permissions = getUserPermissions(token);
    
    return `
🎫 Token Information:
   👤 User: ${claims.username || claims.userId}
   📧 Email: ${claims.email || 'N/A'}
   🔑 Scopes: ${claims.scopes.join(', ') || 'None'}
   👥 Roles: ${claims.roles.join(', ') || 'None'}
   ⏰ Expires: ${claims.expiresAt ? claims.expiresAt.toISOString() : 'N/A'}
   🔐 Admin: ${permissions.isAdmin ? 'Yes' : 'No'}
   📖 Can Read: ${permissions.canRead ? 'Yes' : 'No'}
   ✏️ Can Write: ${permissions.canWrite ? 'Yes' : 'No'}
`;
}

/**
 * Validate token for specific Banking API endpoint
 * @param {string} token - JWT token
 * @param {string} endpoint - API endpoint path
 * @param {string} method - HTTP method
 * @returns {object} Validation result for endpoint access
 */
function validateTokenForEndpoint(token, endpoint, method = 'GET') {
    const result = {
        isAuthorized: false,
        reason: '',
        requiredScopes: [],
        userScopes: []
    };
    
    const permissions = getUserPermissions(token);
    result.userScopes = permissions.scopes;
    
    // Define endpoint requirements
    const endpointRequirements = {
        // User endpoints
        '/api/users/me': { scopes: ['banking:read'], methods: ['GET'] },
        '/api/accounts': { scopes: ['banking:read'], methods: ['GET'] },
        '/api/transactions': { 
            scopes: method === 'GET' ? ['banking:read'] : ['banking:write'], 
            methods: ['GET', 'POST'] 
        },
        
        // Admin endpoints
        '/api/admin/users': { scopes: ['banking:admin'], methods: ['GET', 'POST', 'PUT', 'DELETE'] },
        '/api/admin/accounts': { scopes: ['banking:admin'], methods: ['GET', 'POST', 'PUT', 'DELETE'] },
        '/api/admin/transactions': { scopes: ['banking:admin'], methods: ['GET', 'POST', 'PUT', 'DELETE'] },
        '/api/admin/activity-logs': { scopes: ['banking:admin'], methods: ['GET'] }
    };
    
    // Find matching endpoint pattern
    let requirements = null;
    for (const [pattern, req] of Object.entries(endpointRequirements)) {
        if (endpoint.startsWith(pattern)) {
            requirements = req;
            break;
        }
    }
    
    if (!requirements) {
        result.reason = 'Unknown endpoint';
        return result;
    }
    
    result.requiredScopes = requirements.scopes;
    
    // Check method
    if (!requirements.methods.includes(method.toUpperCase())) {
        result.reason = `Method ${method} not allowed for this endpoint`;
        return result;
    }
    
    // Check scopes
    const hasRequiredScopes = requirements.scopes.every(scope => 
        permissions.scopes.includes(scope)
    );
    
    if (!hasRequiredScopes) {
        const missing = requirements.scopes.filter(scope => 
            !permissions.scopes.includes(scope)
        );
        result.reason = `Missing required scopes: ${missing.join(', ')}`;
        return result;
    }
    
    result.isAuthorized = true;
    result.reason = 'Authorized';
    
    return result;
}

// Export functions for use in Postman scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        decodeJWTComplete,
        validateJWTStructure,
        extractBankingClaims,
        validateScopes,
        isAdminUser,
        getUserPermissions,
        formatTokenInfo,
        validateTokenForEndpoint
    };
}