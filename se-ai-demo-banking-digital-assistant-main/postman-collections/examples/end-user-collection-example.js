/**
 * End User Collection Example
 * 
 * This file shows how to structure a complete Postman collection
 * for end user Banking API testing with OAuth authentication.
 * 
 * This is an example of how the pre-request and test scripts
 * would be organized in an actual Postman collection.
 */

// ============================================================================
// COLLECTION-LEVEL PRE-REQUEST SCRIPT
// ============================================================================

/**
 * This script should be added to the Collection's Pre-request Script tab
 * It will run before every request in the collection
 */

const COLLECTION_CONFIG = {
    // Collection-specific settings
    collectionName: "Banking API - End User",
    userType: "end_user",
    
    // Default scopes for end user operations
    defaultScopes: ["banking:read"],
    
    // OAuth configuration
    oauth: {
        authUrl: pm.environment.get("oauth_auth_url"),
        tokenUrl: pm.environment.get("oauth_token_url"),
        clientId: pm.environment.get("user_client_id"),
        clientSecret: pm.environment.get("user_client_secret"),
        redirectUri: pm.environment.get("redirect_uri")
    }
};

// Load OAuth utilities (in real Postman, these would be in global variables)
// For this example, we'll include the key functions inline

function isTokenValid() {
    const accessToken = pm.environment.get("access_token");
    const expiresAt = pm.environment.get("token_expires_at");
    
    if (!accessToken || !expiresAt) return false;
    
    const currentTime = Date.now();
    const tokenExpiryTime = parseInt(expiresAt);
    const bufferTime = 5 * 60 * 1000; // 5 minutes
    
    return currentTime < (tokenExpiryTime - bufferTime);
}

function setAuthorizationHeader() {
    const accessToken = pm.environment.get("access_token");
    if (accessToken) {
        pm.request.headers.add({
            key: 'Authorization',
            value: `Bearer ${accessToken}`
        });
    }
}

// Collection-level authentication check
console.log(`🚀 ${COLLECTION_CONFIG.collectionName} - Pre-request check`);

if (isTokenValid()) {
    setAuthorizationHeader();
    console.log("✅ Token is valid, authorization header set");
} else {
    console.log("⚠️ Token invalid - manual authentication may be required");
}

// ============================================================================
// REQUEST-SPECIFIC EXAMPLES
// ============================================================================

/**
 * Example 1: GET /api/accounts (Get User's Accounts)
 * Pre-request Script for this specific request
 */

const GET_ACCOUNTS_PRE_REQUEST = `
// Request-specific configuration
const REQUEST_CONFIG = {
    endpoint: "/api/accounts",
    method: "GET",
    requiredScopes: ["banking:read"],
    description: "Get user's own accounts"
};

console.log("📋 Request: " + REQUEST_CONFIG.description);

// Validate token has required scopes
const accessToken = pm.environment.get("access_token");
if (accessToken) {
    // In real implementation, this would use the JWT utilities
    console.log("✅ Token available for accounts request");
} else {
    console.log("❌ No token available - run OAuth login first");
}

// Set request-specific headers
pm.request.headers.add({
    key: 'Accept',
    value: 'application/json'
});

pm.request.headers.add({
    key: 'X-Request-ID',
    value: pm.variables.replaceIn('{{$guid}}')
});
`;

/**
 * Example 1: GET /api/accounts
 * Test Script for validating the response
 */

const GET_ACCOUNTS_TEST_SCRIPT = `
// Standard response validation
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response time is acceptable", function () {
    pm.expect(pm.response.responseTime).to.be.below(2000);
});

pm.test("Response has correct content type", function () {
    pm.expect(pm.response.headers.get("Content-Type")).to.include("application/json");
});

// Banking API specific tests
pm.test("Response contains accounts array", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('accounts');
    pm.expect(jsonData.accounts).to.be.an('array');
});

pm.test("Each account has required fields", function () {
    const jsonData = pm.response.json();
    if (jsonData.accounts && jsonData.accounts.length > 0) {
        jsonData.accounts.forEach(account => {
            pm.expect(account).to.have.property('id');
            pm.expect(account).to.have.property('accountNumber');
            pm.expect(account).to.have.property('accountType');
            pm.expect(account).to.have.property('balance');
            pm.expect(account).to.have.property('currency');
        });
    }
});

pm.test("User can only see own accounts", function () {
    const jsonData = pm.response.json();
    const currentUserId = pm.environment.get("user_id");
    
    if (jsonData.accounts && currentUserId) {
        jsonData.accounts.forEach(account => {
            pm.expect(account.userId).to.equal(currentUserId);
        });
    }
});

// Store first account ID for subsequent requests
const jsonData = pm.response.json();
if (jsonData.accounts && jsonData.accounts.length > 0) {
    pm.environment.set("test_account_id", jsonData.accounts[0].id);
    console.log("✅ Stored account ID for future requests:", jsonData.accounts[0].id);
}
`;

/**
 * Example 2: POST /api/transactions (Create Transaction)
 * Pre-request Script
 */

const POST_TRANSACTION_PRE_REQUEST = `
// Request-specific configuration
const REQUEST_CONFIG = {
    endpoint: "/api/transactions",
    method: "POST",
    requiredScopes: ["banking:write"],
    description: "Create a new transaction"
};

console.log("📋 Request: " + REQUEST_CONFIG.description);

// Validate we have an account to use
const accountId = pm.environment.get("test_account_id");
if (!accountId) {
    console.log("❌ No account ID available - run GET accounts first");
}

// Generate test transaction data
const transactionData = {
    accountId: accountId,
    type: "deposit",
    amount: 100.00,
    description: "Test deposit - " + new Date().toISOString(),
    reference: "TEST-" + Date.now()
};

// Set the request body
pm.request.body.raw = JSON.stringify(transactionData);

console.log("✅ Transaction data prepared:", JSON.stringify(transactionData, null, 2));
`;

/**
 * Example 2: POST /api/transactions
 * Test Script
 */

const POST_TRANSACTION_TEST_SCRIPT = `
pm.test("Transaction created successfully", function () {
    pm.response.to.have.status(201);
});

pm.test("Response contains transaction details", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('id');
    pm.expect(jsonData).to.have.property('accountId');
    pm.expect(jsonData).to.have.property('type');
    pm.expect(jsonData).to.have.property('amount');
    pm.expect(jsonData).to.have.property('status');
    pm.expect(jsonData).to.have.property('createdAt');
});

pm.test("Transaction has correct data", function () {
    const jsonData = pm.response.json();
    const requestData = JSON.parse(pm.request.body.raw);
    
    pm.expect(jsonData.accountId).to.equal(requestData.accountId);
    pm.expect(jsonData.type).to.equal(requestData.type);
    pm.expect(jsonData.amount).to.equal(requestData.amount);
    pm.expect(jsonData.description).to.equal(requestData.description);
});

pm.test("Transaction belongs to current user", function () {
    const jsonData = pm.response.json();
    const currentUserId = pm.environment.get("user_id");
    
    if (currentUserId) {
        pm.expect(jsonData.userId).to.equal(currentUserId);
    }
});

// Store transaction ID for future tests
const jsonData = pm.response.json();
if (jsonData.id) {
    pm.environment.set("test_transaction_id", jsonData.id);
    console.log("✅ Stored transaction ID:", jsonData.id);
}
`;

/**
 * Example 3: Negative Test - Try to Access Admin Endpoint
 * This should fail for end users
 */

const NEGATIVE_TEST_ADMIN_ACCESS = `
// Pre-request script for negative test
console.log("🚫 Negative Test: End user attempting admin access");

// This request should fail with 403 Forbidden
const REQUEST_CONFIG = {
    endpoint: "/api/admin/users",
    method: "GET",
    expectedStatus: 403,
    description: "End user should NOT be able to access admin endpoints"
};

// Test script for negative test
pm.test("Admin access is properly denied", function () {
    pm.response.to.have.status(403);
});

pm.test("Error response has proper structure", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('error');
    pm.expect(jsonData.error).to.include('Forbidden');
});

pm.test("Error indicates insufficient privileges", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.error_description || jsonData.message).to.match(/insufficient|privilege|scope|admin/i);
});

console.log("✅ Negative test completed - admin access properly denied");
`;

// ============================================================================
// COLLECTION-LEVEL TEST SCRIPT
// ============================================================================

/**
 * This script should be added to the Collection's Tests tab
 * It will run after every request in the collection
 */

const COLLECTION_LEVEL_TESTS = `
// Collection-level tests that run after every request

pm.test("Response has security headers", function () {
    pm.expect(pm.response.headers.get("X-Content-Type-Options")).to.exist;
    pm.expect(pm.response.headers.get("X-Frame-Options")).to.exist;
});

pm.test("No sensitive data in response headers", function () {
    const headers = pm.response.headers.toObject();
    const headerString = JSON.stringify(headers).toLowerCase();
    
    pm.expect(headerString).to.not.include('password');
    pm.expect(headerString).to.not.include('secret');
    pm.expect(headerString).to.not.include('private');
});

pm.test("Request was properly authenticated", function () {
    // Should not get 401 Unauthorized
    pm.response.to.not.have.status(401);
});

// Log request summary
console.log(\`📊 Request Summary:
   🎯 URL: \${pm.request.url}
   📝 Method: \${pm.request.method}
   ⏱️ Response Time: \${pm.response.responseTime}ms
   📊 Status: \${pm.response.status} \${pm.response.reason()}
   📏 Size: \${pm.response.responseSize} bytes\`);
`;

// ============================================================================
// USAGE INSTRUCTIONS
// ============================================================================

console.log(`
📚 End User Collection Setup Instructions:

1. Collection Setup:
   - Create new collection: "Banking API - End User"
   - Add collection-level pre-request script (COLLECTION_CONFIG section above)
   - Add collection-level test script (COLLECTION_LEVEL_TESTS section above)

2. Environment Variables:
   - oauth_auth_url: OAuth authorization endpoint
   - oauth_token_url: OAuth token endpoint  
   - user_client_id: End user client ID
   - user_client_secret: End user client secret
   - redirect_uri: OAuth callback URL

3. Request Structure:
   📁 1. Authentication
      🔐 OAuth Login Flow
      ✅ Token Status Check
      🚪 Logout
   
   📁 2. Account Management  
      👤 Get My Accounts
      💰 Get Account Balance
      📋 Account Details
   
   📁 3. Transaction Management
      📊 Get My Transactions
      💵 Create Deposit
      💸 Create Withdrawal
      🔄 Create Transfer
      📄 Transaction Details
   
   📁 4. User Profile
      👤 Get Profile
      ✏️ Update Profile
   
   📁 5. Negative Tests
      🚫 Try Admin Access (Should Fail)
      🚫 Try Other User Data (Should Fail)

4. Request Configuration:
   - Copy appropriate pre-request script for each request type
   - Copy appropriate test script for validation
   - Modify scopes and validation as needed

5. Test Execution:
   - Run OAuth Login Flow first
   - Execute requests in logical order
   - Use Collection Runner for automated testing
   - Check test results for validation

6. Troubleshooting:
   - Check console logs for detailed error messages
   - Verify environment variables are set
   - Ensure OAuth client has correct scopes
   - Validate token expiration times
`);

// Export for documentation
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        COLLECTION_CONFIG,
        GET_ACCOUNTS_PRE_REQUEST,
        GET_ACCOUNTS_TEST_SCRIPT,
        POST_TRANSACTION_PRE_REQUEST,
        POST_TRANSACTION_TEST_SCRIPT,
        NEGATIVE_TEST_ADMIN_ACCESS,
        COLLECTION_LEVEL_TESTS
    };
}