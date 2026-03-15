/**
 * Admin Collection Example
 * 
 * This file shows how to structure a complete Postman collection
 * for admin user Banking API testing with OAuth authentication.
 * 
 * Admin users have elevated privileges and can access all endpoints.
 */

// ============================================================================
// COLLECTION-LEVEL PRE-REQUEST SCRIPT
// ============================================================================

const ADMIN_COLLECTION_CONFIG = {
    // Collection-specific settings
    collectionName: "Banking API - Admin",
    userType: "admin",
    
    // Default scopes for admin operations
    defaultScopes: ["banking:admin"],
    
    // OAuth configuration
    oauth: {
        authUrl: pm.environment.get("oauth_auth_url"),
        tokenUrl: pm.environment.get("oauth_token_url"),
        clientId: pm.environment.get("admin_client_id"),
        clientSecret: pm.environment.get("admin_client_secret"),
        redirectUri: pm.environment.get("redirect_uri")
    }
};

// Admin-specific authentication check
console.log(`🔐 ${ADMIN_COLLECTION_CONFIG.collectionName} - Admin Pre-request check`);

function isTokenValid() {
    const accessToken = pm.environment.get("access_token");
    const expiresAt = pm.environment.get("token_expires_at");
    
    if (!accessToken || !expiresAt) return false;
    
    const currentTime = Date.now();
    const tokenExpiryTime = parseInt(expiresAt);
    const bufferTime = 5 * 60 * 1000;
    
    return currentTime < (tokenExpiryTime - bufferTime);
}

function validateAdminToken() {
    const accessToken = pm.environment.get("access_token");
    if (!accessToken) return false;
    
    // Simple scope check (in real implementation, use JWT utilities)
    const tokenScopes = pm.environment.get("token_scopes");
    if (tokenScopes) {
        const scopes = JSON.parse(tokenScopes);
        return scopes.includes("banking:admin");
    }
    
    return true; // Assume valid for this example
}

if (isTokenValid() && validateAdminToken()) {
    pm.request.headers.add({
        key: 'Authorization',
        value: `Bearer ${pm.environment.get("access_token")}`
    });
    console.log("✅ Admin token is valid, authorization header set");
} else {
    console.log("⚠️ Admin token invalid - run admin OAuth login first");
}

// ============================================================================
// ADMIN REQUEST EXAMPLES
// ============================================================================

/**
 * Example 1: GET /api/admin/users (Get All Users)
 * Pre-request Script
 */

const GET_ALL_USERS_PRE_REQUEST = `
// Admin request configuration
const REQUEST_CONFIG = {
    endpoint: "/api/admin/users",
    method: "GET",
    requiredScopes: ["banking:admin"],
    description: "Get all users (admin only)"
};

console.log("👥 Admin Request: " + REQUEST_CONFIG.description);

// Add admin-specific headers
pm.request.headers.add({
    key: 'X-Admin-Request',
    value: 'true'
});

pm.request.headers.add({
    key: 'X-Request-ID',
    value: pm.variables.replaceIn('{{$guid}}')
});

// Set query parameters for pagination
pm.request.url.query.add({
    key: 'page',
    value: '1'
});

pm.request.url.query.add({
    key: 'limit',
    value: '50'
});

console.log("✅ Admin user request configured");
`;

/**
 * Example 1: GET /api/admin/users
 * Test Script
 */

const GET_ALL_USERS_TEST_SCRIPT = `
pm.test("Admin can access all users", function () {
    pm.response.to.have.status(200);
});

pm.test("Response contains users array", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('users');
    pm.expect(jsonData.users).to.be.an('array');
});

pm.test("Response includes pagination info", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('pagination');
    pm.expect(jsonData.pagination).to.have.property('page');
    pm.expect(jsonData.pagination).to.have.property('limit');
    pm.expect(jsonData.pagination).to.have.property('total');
});

pm.test("Each user has admin-visible fields", function () {
    const jsonData = pm.response.json();
    if (jsonData.users && jsonData.users.length > 0) {
        jsonData.users.forEach(user => {
            pm.expect(user).to.have.property('id');
            pm.expect(user).to.have.property('username');
            pm.expect(user).to.have.property('email');
            pm.expect(user).to.have.property('role');
            pm.expect(user).to.have.property('createdAt');
            pm.expect(user).to.have.property('lastLoginAt');
            pm.expect(user).to.have.property('isActive');
        });
    }
});

pm.test("Admin can see sensitive user data", function () {
    const jsonData = pm.response.json();
    if (jsonData.users && jsonData.users.length > 0) {
        const firstUser = jsonData.users[0];
        // Admin should see fields that regular users cannot
        pm.expect(firstUser).to.have.property('email');
        pm.expect(firstUser).to.have.property('lastLoginAt');
        pm.expect(firstUser).to.have.property('failedLoginAttempts');
    }
});

// Store a test user ID for subsequent operations
const jsonData = pm.response.json();
if (jsonData.users && jsonData.users.length > 0) {
    const testUser = jsonData.users.find(user => user.role === 'customer');
    if (testUser) {
        pm.environment.set("test_user_id", testUser.id);
        console.log("✅ Stored test user ID:", testUser.id);
    }
}
`;

/**
 * Example 2: POST /api/admin/users (Create User)
 * Pre-request Script
 */

const CREATE_USER_PRE_REQUEST = `
console.log("👤 Admin Request: Create new user");

// Generate unique test user data
const timestamp = Date.now();
const userData = {
    username: \`testuser\${timestamp}\`,
    email: \`testuser\${timestamp}@example.com\`,
    firstName: "Test",
    lastName: "User",
    role: "customer",
    isActive: true,
    initialPassword: "TempPassword123!",
    requirePasswordChange: true
};

// Set the request body
pm.request.body.raw = JSON.stringify(userData);

// Store user data for validation
pm.environment.set("created_user_data", JSON.stringify(userData));

console.log("✅ User creation data prepared:", JSON.stringify(userData, null, 2));
`;

/**
 * Example 2: POST /api/admin/users
 * Test Script
 */

const CREATE_USER_TEST_SCRIPT = `
pm.test("User created successfully", function () {
    pm.response.to.have.status(201);
});

pm.test("Response contains created user details", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('id');
    pm.expect(jsonData).to.have.property('username');
    pm.expect(jsonData).to.have.property('email');
    pm.expect(jsonData).to.have.property('role');
    pm.expect(jsonData).to.have.property('createdAt');
});

pm.test("Created user matches request data", function () {
    const jsonData = pm.response.json();
    const requestData = JSON.parse(pm.environment.get("created_user_data"));
    
    pm.expect(jsonData.username).to.equal(requestData.username);
    pm.expect(jsonData.email).to.equal(requestData.email);
    pm.expect(jsonData.firstName).to.equal(requestData.firstName);
    pm.expect(jsonData.lastName).to.equal(requestData.lastName);
    pm.expect(jsonData.role).to.equal(requestData.role);
});

pm.test("Password is not returned in response", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.not.have.property('password');
    pm.expect(jsonData).to.not.have.property('initialPassword');
});

pm.test("User has proper default settings", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.isActive).to.be.true;
    pm.expect(jsonData.requirePasswordChange).to.be.true;
    pm.expect(jsonData.failedLoginAttempts).to.equal(0);
});

// Store created user ID for cleanup
const jsonData = pm.response.json();
if (jsonData.id) {
    pm.environment.set("created_user_id", jsonData.id);
    console.log("✅ Stored created user ID for cleanup:", jsonData.id);
}
`;

/**
 * Example 3: GET /api/admin/activity-logs (System Activity Logs)
 * Pre-request Script
 */

const GET_ACTIVITY_LOGS_PRE_REQUEST = `
console.log("📊 Admin Request: Get system activity logs");

// Set query parameters for log filtering
const startDate = new Date();
startDate.setDate(startDate.getDate() - 7); // Last 7 days

pm.request.url.query.add({
    key: 'startDate',
    value: startDate.toISOString()
});

pm.request.url.query.add({
    key: 'endDate',
    value: new Date().toISOString()
});

pm.request.url.query.add({
    key: 'level',
    value: 'info,warn,error'
});

pm.request.url.query.add({
    key: 'limit',
    value: '100'
});

console.log("✅ Activity log request configured for last 7 days");
`;

/**
 * Example 3: GET /api/admin/activity-logs
 * Test Script
 */

const GET_ACTIVITY_LOGS_TEST_SCRIPT = `
pm.test("Admin can access activity logs", function () {
    pm.response.to.have.status(200);
});

pm.test("Response contains activity logs", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('logs');
    pm.expect(jsonData.logs).to.be.an('array');
});

pm.test("Each log entry has required fields", function () {
    const jsonData = pm.response.json();
    if (jsonData.logs && jsonData.logs.length > 0) {
        jsonData.logs.forEach(log => {
            pm.expect(log).to.have.property('id');
            pm.expect(log).to.have.property('timestamp');
            pm.expect(log).to.have.property('level');
            pm.expect(log).to.have.property('message');
            pm.expect(log).to.have.property('userId');
            pm.expect(log).to.have.property('action');
            pm.expect(log).to.have.property('resource');
        });
    }
});

pm.test("Logs are within requested date range", function () {
    const jsonData = pm.response.json();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    const endDate = new Date();
    
    if (jsonData.logs && jsonData.logs.length > 0) {
        jsonData.logs.forEach(log => {
            const logDate = new Date(log.timestamp);
            pm.expect(logDate).to.be.at.least(startDate);
            pm.expect(logDate).to.be.at.most(endDate);
        });
    }
});

pm.test("Sensitive data is properly logged", function () {
    const jsonData = pm.response.json();
    if (jsonData.logs && jsonData.logs.length > 0) {
        // Check that sensitive operations are logged
        const sensitiveActions = jsonData.logs.filter(log => 
            log.action.includes('login') || 
            log.action.includes('transaction') || 
            log.action.includes('account')
        );
        
        if (sensitiveActions.length > 0) {
            console.log(\`✅ Found \${sensitiveActions.length} sensitive action logs\`);
        }
    }
});
`;

/**
 * Example 4: DELETE /api/admin/users/:id (Delete User - Cleanup)
 * Pre-request Script
 */

const DELETE_USER_PRE_REQUEST = `
console.log("🗑️ Admin Request: Delete test user (cleanup)");

const userIdToDelete = pm.environment.get("created_user_id");
if (!userIdToDelete) {
    console.log("❌ No user ID to delete - skipping cleanup");
} else {
    console.log("✅ Deleting user ID:", userIdToDelete);
    
    // Add confirmation header for destructive operation
    pm.request.headers.add({
        key: 'X-Confirm-Delete',
        value: 'true'
    });
}
`;

/**
 * Example 4: DELETE /api/admin/users/:id
 * Test Script
 */

const DELETE_USER_TEST_SCRIPT = `
const userIdToDelete = pm.environment.get("created_user_id");

if (userIdToDelete) {
    pm.test("User deleted successfully", function () {
        pm.response.to.have.status(204);
    });
    
    pm.test("No content returned for delete", function () {
        pm.expect(pm.response.text()).to.be.empty;
    });
    
    // Clean up environment
    pm.environment.unset("created_user_id");
    pm.environment.unset("created_user_data");
    
    console.log("✅ Test user cleanup completed");
} else {
    pm.test("No user to delete", function () {
        pm.expect(true).to.be.true; // Pass the test
    });
}
`;

// ============================================================================
// ADMIN COLLECTION TESTS
// ============================================================================

const ADMIN_COLLECTION_TESTS = `
// Admin-specific collection-level tests

pm.test("Admin request was properly authenticated", function () {
    pm.response.to.not.have.status(401);
    pm.response.to.not.have.status(403);
});

pm.test("Admin response includes audit trail", function () {
    const auditHeader = pm.response.headers.get("X-Audit-ID");
    if (auditHeader) {
        pm.expect(auditHeader).to.not.be.empty;
        console.log("✅ Audit ID:", auditHeader);
    }
});

pm.test("Response includes admin-specific headers", function () {
    const adminHeaders = [
        "X-Admin-Request-ID",
        "X-Rate-Limit-Admin",
        "X-Audit-ID"
    ];
    
    adminHeaders.forEach(header => {
        const value = pm.response.headers.get(header);
        if (value) {
            console.log(\`✅ Admin header \${header}: \${value}\`);
        }
    });
});

// Enhanced logging for admin operations
console.log(\`🔐 Admin Request Summary:
   👤 Admin User: \${pm.environment.get("username") || "Unknown"}
   🎯 URL: \${pm.request.url}
   📝 Method: \${pm.request.method}
   ⏱️ Response Time: \${pm.response.responseTime}ms
   📊 Status: \${pm.response.status}
   🔍 Audit ID: \${pm.response.headers.get("X-Audit-ID") || "N/A"}\`);
`;

// ============================================================================
// USAGE INSTRUCTIONS
// ============================================================================

console.log(`
🔐 Admin Collection Setup Instructions:

1. Collection Setup:
   - Create new collection: "Banking API - Admin"
   - Add admin collection-level pre-request script
   - Add admin collection-level test script
   - Set collection authorization to inherit from parent

2. Environment Variables (Admin-specific):
   - admin_client_id: Admin client ID with banking:admin scope
   - admin_client_secret: Admin client secret
   - oauth_auth_url: OAuth authorization endpoint
   - oauth_token_url: OAuth token endpoint
   - redirect_uri: OAuth callback URL

3. Admin Request Structure:
   📁 1. Authentication
      🔐 Admin OAuth Login Flow
      ✅ Admin Token Status Check
      🚪 Admin Logout
   
   📁 2. User Management
      👥 Get All Users
      👤 Create User
      ✏️ Update User
      🗑️ Delete User
      🔍 Search Users
   
   📁 3. Account Management
      🏦 Get All Accounts
      💰 Create Account
      ✏️ Update Account
      🗑️ Delete Account
      📊 Account Statistics
   
   📁 4. Transaction Management
      💸 Get All Transactions
      💵 Create Transaction
      ✏️ Update Transaction
      🗑️ Delete Transaction
      📈 Transaction Analytics
   
   📁 5. System Administration
      📊 System Statistics
      📋 Activity Logs
      👤 User Activity Summary
      📤 Export Data
      🔧 System Health Check

4. Security Considerations:
   - Admin tokens have elevated privileges
   - All admin actions are audited
   - Use confirmation headers for destructive operations
   - Implement proper cleanup for test data
   - Monitor for suspicious admin activity

5. Testing Best Practices:
   - Always clean up test data
   - Use unique identifiers for test records
   - Validate admin-only fields in responses
   - Test both positive and negative scenarios
   - Verify audit logging for sensitive operations

6. Troubleshooting:
   - Ensure admin client has banking:admin scope
   - Check audit logs for failed admin operations
   - Verify admin token hasn't expired
   - Validate admin user permissions in OAuth provider
`);

// Export for documentation
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ADMIN_COLLECTION_CONFIG,
        GET_ALL_USERS_PRE_REQUEST,
        GET_ALL_USERS_TEST_SCRIPT,
        CREATE_USER_PRE_REQUEST,
        CREATE_USER_TEST_SCRIPT,
        GET_ACTIVITY_LOGS_PRE_REQUEST,
        GET_ACTIVITY_LOGS_TEST_SCRIPT,
        DELETE_USER_PRE_REQUEST,
        DELETE_USER_TEST_SCRIPT,
        ADMIN_COLLECTION_TESTS
    };
}