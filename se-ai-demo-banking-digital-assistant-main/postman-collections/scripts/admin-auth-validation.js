/**
 * Admin Authentication Validation Script for Postman Collections
 * 
 * This script provides comprehensive validation functions for admin authentication
 * flows, scope verification, and security testing specifically for the Banking API
 * admin collection with banking:admin scope requirements.
 */

/**
 * Validate admin token structure and claims
 * @param {string} token - Admin JWT token to validate
 * @returns {object} Validation result with detailed information
 */
function validateAdminToken(token) {
    const result = {
        isValid: false,
        hasAdminScope: false,
        errors: [],
        warnings: [],
        adminClaims: null,
        securityLevel: 'none'
    };
    
    if (!token || typeof token !== 'string') {
        result.errors.push('Invalid or missing admin token');
        return result;
    }
    
    try {
        // Decode JWT token
        const parts = token.split('.');
        if (parts.length !== 3) {
            result.errors.push('Invalid JWT format - must have 3 parts');
            return result;
        }
        
        const [headerB64, payloadB64, signature] = parts;
        
        // Decode header and payload
        const header = JSON.parse(atob(addBase64Padding(headerB64.replace(/-/g, '+').replace(/_/g, '/'))));
        const payload = JSON.parse(atob(addBase64Padding(payloadB64.replace(/-/g, '+').replace(/_/g, '/'))));
        
        result.adminClaims = {
            // User identification
            userId: payload.sub || payload.user_id,
            username: payload.preferred_username || payload.username,
            email: payload.email,
            
            // Admin-specific claims
            scopes: payload.scope ? payload.scope.split(' ') : [],
            roles: payload.roles || [],
            clientId: payload.client_id || payload.azp,
            
            // Token metadata
            issuer: payload.iss,
            audience: payload.aud,
            issuedAt: payload.iat ? new Date(payload.iat * 1000) : null,
            expiresAt: payload.exp ? new Date(payload.exp * 1000) : null,
            
            // Security context
            authTime: payload.auth_time ? new Date(payload.auth_time * 1000) : null,
            sessionId: payload.sid,
            
            // Algorithm and token type
            algorithm: header.alg,
            tokenType: header.typ
        };
        
        // Validate admin scope
        result.hasAdminScope = result.adminClaims.scopes.includes('banking:admin');
        
        // Validate token structure
        if (!payload.sub) {
            result.errors.push('Missing subject (sub) claim');
        }
        
        if (!payload.exp) {
            result.errors.push('Missing expiration (exp) claim');
        } else {
            const now = Math.floor(Date.now() / 1000);
            if (payload.exp < now) {
                result.errors.push('Token has expired');
            } else if (payload.exp < now + 300) { // 5 minutes
                result.warnings.push('Token expires soon (within 5 minutes)');
            }
        }
        
        if (!payload.iss) {
            result.warnings.push('Missing issuer (iss) claim');
        }
        
        if (!payload.aud) {
            result.warnings.push('Missing audience (aud) claim');
        }
        
        // Validate admin-specific requirements
        if (!result.hasAdminScope) {
            result.errors.push('Missing required banking:admin scope');
        }
        
        if (!payload.client_id && !payload.azp) {
            result.warnings.push('Missing client identification');
        }
        
        // Determine security level
        if (result.hasAdminScope && result.errors.length === 0) {
            result.securityLevel = 'admin';
        } else if (result.adminClaims.scopes.length > 0 && result.errors.length === 0) {
            result.securityLevel = 'user';
        } else if (result.errors.length === 0) {
            result.securityLevel = 'basic';
        }
        
        result.isValid = result.errors.length === 0 && result.hasAdminScope;
        
    } catch (error) {
        result.errors.push(`Token decode error: ${error.message}`);
    }
    
    return result;
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
 * Validate admin authentication flow state
 * @returns {object} Authentication flow validation result
 */
function validateAdminAuthFlow() {
    const result = {
        isComplete: false,
        currentStep: 'not_started',
        errors: [],
        warnings: [],
        nextSteps: []
    };
    
    // Check for authorization URL generation
    const authUrl = pm.environment.get('admin_authorization_url');
    const codeVerifier = pm.environment.get('admin_code_verifier');
    const state = pm.environment.get('admin_oauth_state');
    
    if (!authUrl || !codeVerifier || !state) {
        result.currentStep = 'not_started';
        result.nextSteps.push('Run "OAuth Admin Login Flow" to generate authorization URL');
        return result;
    }
    
    // Check for authorization code
    const authCode = pm.environment.get('admin_authorization_code');
    if (!authCode) {
        result.currentStep = 'authorization_pending';
        result.nextSteps.push('Open authorization URL in browser');
        result.nextSteps.push('Complete admin login and consent');
        result.nextSteps.push('Copy authorization code from callback');
        result.nextSteps.push('Set admin_authorization_code environment variable');
        return result;
    }
    
    // Check for access token
    const accessToken = pm.environment.get('admin_access_token');
    if (!accessToken) {
        result.currentStep = 'token_exchange_pending';
        result.nextSteps.push('Run "Exchange Admin Authorization Code"');
        return result;
    }
    
    // Validate access token
    const tokenValidation = validateAdminToken(accessToken);
    if (!tokenValidation.isValid) {
        result.currentStep = 'token_invalid';
        result.errors = tokenValidation.errors;
        result.warnings = tokenValidation.warnings;
        result.nextSteps.push('Re-run authentication flow with proper admin credentials');
        return result;
    }
    
    if (!tokenValidation.hasAdminScope) {
        result.currentStep = 'insufficient_scope';
        result.errors.push('Token missing banking:admin scope');
        result.nextSteps.push('Ensure admin user has proper permissions');
        result.nextSteps.push('Re-authenticate with admin credentials');
        return result;
    }
    
    // Check token expiration
    const expiresAt = pm.environment.get('admin_token_expires_at');
    if (expiresAt) {
        const now = Date.now();
        const expiry = parseInt(expiresAt);
        if (now >= expiry) {
            result.currentStep = 'token_expired';
            result.errors.push('Admin token has expired');
            result.nextSteps.push('Re-run authentication flow');
            return result;
        } else if (now >= expiry - (5 * 60 * 1000)) { // 5 minutes
            result.warnings.push('Admin token expires soon');
        }
    }
    
    result.isComplete = true;
    result.currentStep = 'authenticated';
    
    return result;
}

/**
 * Generate comprehensive admin authentication report
 * @returns {string} Formatted authentication status report
 */
function generateAdminAuthReport() {
    const authFlow = validateAdminAuthFlow();
    const accessToken = pm.environment.get('admin_access_token');
    
    let report = `
🔐 Admin Authentication Status Report
=====================================

📊 Flow Status: ${authFlow.currentStep.toUpperCase()}
✅ Complete: ${authFlow.isComplete ? 'Yes' : 'No'}
`;
    
    if (authFlow.errors.length > 0) {
        report += `
❌ Errors:
${authFlow.errors.map(error => `   • ${error}`).join('\n')}
`;
    }
    
    if (authFlow.warnings.length > 0) {
        report += `
⚠️ Warnings:
${authFlow.warnings.map(warning => `   • ${warning}`).join('\n')}
`;
    }
    
    if (authFlow.nextSteps.length > 0) {
        report += `
📋 Next Steps:
${authFlow.nextSteps.map((step, index) => `   ${index + 1}. ${step}`).join('\n')}
`;
    }
    
    if (accessToken) {
        const tokenValidation = validateAdminToken(accessToken);
        if (tokenValidation.adminClaims) {
            const claims = tokenValidation.adminClaims;
            report += `
👤 Admin User Information:
   • User ID: ${claims.userId || 'N/A'}
   • Username: ${claims.username || 'N/A'}
   • Email: ${claims.email || 'N/A'}
   • Client ID: ${claims.clientId || 'N/A'}
   • Security Level: ${tokenValidation.securityLevel.toUpperCase()}

🔑 Token Details:
   • Scopes: ${claims.scopes.join(', ') || 'None'}
   • Roles: ${claims.roles.join(', ') || 'None'}
   • Issued At: ${claims.issuedAt ? claims.issuedAt.toISOString() : 'N/A'}
   • Expires At: ${claims.expiresAt ? claims.expiresAt.toISOString() : 'N/A'}
   • Algorithm: ${claims.algorithm || 'N/A'}
   • Admin Scope: ${tokenValidation.hasAdminScope ? '✅ Present' : '❌ Missing'}
`;
        }
    }
    
    return report;
}

/**
 * Validate admin endpoint access authorization
 * @param {string} endpoint - API endpoint path
 * @param {string} method - HTTP method
 * @returns {object} Authorization validation result
 */
function validateAdminEndpointAccess(endpoint, method = 'GET') {
    const result = {
        isAuthorized: false,
        reason: '',
        requiredScopes: [],
        userScopes: [],
        securityLevel: 'none'
    };
    
    const accessToken = pm.environment.get('admin_access_token');
    if (!accessToken) {
        result.reason = 'No admin access token available';
        return result;
    }
    
    const tokenValidation = validateAdminToken(accessToken);
    if (!tokenValidation.isValid) {
        result.reason = 'Invalid admin token';
        return result;
    }
    
    result.userScopes = tokenValidation.adminClaims.scopes;
    result.securityLevel = tokenValidation.securityLevel;
    
    // Define admin endpoint requirements
    const adminEndpoints = {
        '/api/admin/users': { scopes: ['banking:admin'], methods: ['GET', 'POST', 'PUT', 'DELETE'] },
        '/api/admin/accounts': { scopes: ['banking:admin'], methods: ['GET', 'POST', 'PUT', 'DELETE'] },
        '/api/admin/transactions': { scopes: ['banking:admin'], methods: ['GET', 'POST', 'PUT', 'DELETE'] },
        '/api/admin/statistics': { scopes: ['banking:admin'], methods: ['GET'] },
        '/api/admin/activity-logs': { scopes: ['banking:admin'], methods: ['GET'] },
        '/api/admin/user-activity-summary': { scopes: ['banking:admin'], methods: ['GET'] },
        '/api/admin/oauth-health': { scopes: ['banking:admin'], methods: ['GET'] }
    };
    
    // Find matching endpoint
    let requirements = null;
    for (const [pattern, req] of Object.entries(adminEndpoints)) {
        if (endpoint.startsWith(pattern)) {
            requirements = req;
            break;
        }
    }
    
    if (!requirements) {
        result.reason = 'Unknown admin endpoint';
        return result;
    }
    
    result.requiredScopes = requirements.scopes;
    
    // Check HTTP method
    if (!requirements.methods.includes(method.toUpperCase())) {
        result.reason = `Method ${method} not allowed for endpoint ${endpoint}`;
        return result;
    }
    
    // Check admin scope
    if (!tokenValidation.hasAdminScope) {
        result.reason = 'Missing required banking:admin scope';
        return result;
    }
    
    result.isAuthorized = true;
    result.reason = 'Authorized for admin access';
    
    return result;
}

/**
 * Test admin error scenarios
 * @returns {object} Error scenario test results
 */
function testAdminErrorScenarios() {
    const scenarios = {
        invalidToken: {
            description: 'Test invalid token handling',
            token: 'invalid-token-12345',
            expectedStatus: 401,
            expectedError: 'Unauthorized'
        },
        malformedToken: {
            description: 'Test malformed JWT token',
            token: 'not.a.valid.jwt.token',
            expectedStatus: 401,
            expectedError: 'Invalid token format'
        },
        expiredToken: {
            description: 'Test expired token handling',
            // This would need to be a properly formatted but expired JWT
            token: null, // Would be set to expired token
            expectedStatus: 401,
            expectedError: 'Token expired'
        },
        insufficientScope: {
            description: 'Test insufficient scope handling',
            // This would need to be a valid token without admin scope
            token: null, // Would be set to non-admin token
            expectedStatus: 403,
            expectedError: 'Insufficient privileges'
        }
    };
    
    return scenarios;
}

/**
 * Setup admin authentication test environment
 */
function setupAdminTestEnvironment() {
    console.log('🔧 Setting up admin authentication test environment');
    
    // Clear any existing admin tokens
    pm.environment.unset('admin_access_token');
    pm.environment.unset('admin_refresh_token');
    pm.environment.unset('admin_token_expires_at');
    pm.environment.unset('admin_username');
    pm.environment.unset('admin_email');
    pm.environment.unset('admin_user_id');
    pm.environment.unset('admin_scope_validated');
    
    // Set test markers
    pm.environment.set('admin_test_mode', 'true');
    pm.environment.set('admin_test_started_at', new Date().toISOString());
    
    console.log('✅ Admin test environment prepared');
}

/**
 * Cleanup admin authentication test environment
 */
function cleanupAdminTestEnvironment() {
    console.log('🧹 Cleaning up admin authentication test environment');
    
    // Remove test markers
    pm.environment.unset('admin_test_mode');
    pm.environment.unset('admin_test_started_at');
    
    // Clear temporary test data
    pm.environment.unset('test_user_id');
    pm.environment.unset('created_user_id');
    pm.environment.unset('admin_created_account_id');
    pm.environment.unset('admin_created_transaction_id');
    
    console.log('✅ Admin test environment cleaned up');
}

// Export functions for use in Postman scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        validateAdminToken,
        validateAdminAuthFlow,
        generateAdminAuthReport,
        validateAdminEndpointAccess,
        testAdminErrorScenarios,
        setupAdminTestEnvironment,
        cleanupAdminTestEnvironment
    };
}

// Make functions available globally in Postman
if (typeof pm !== 'undefined') {
    pm.globals.set('validateAdminToken', validateAdminToken.toString());
    pm.globals.set('validateAdminAuthFlow', validateAdminAuthFlow.toString());
    pm.globals.set('generateAdminAuthReport', generateAdminAuthReport.toString());
    pm.globals.set('validateAdminEndpointAccess', validateAdminEndpointAccess.toString());
}