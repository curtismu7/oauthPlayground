# Banking API Admin Collection Implementation

## Overview

The Banking API Admin Collection provides comprehensive testing capabilities for administrative operations with enhanced OAuth authentication using the `banking:admin` scope. This collection implements super-scope authorization, comprehensive security validation, and complete administrative functionality testing.

## Collection Structure

### 1. Admin Authentication
Enhanced OAuth 2.0 flow with administrative privileges:
- **OAuth Admin Login Flow**: Generates authorization URL with `banking:admin` scope
- **Exchange Admin Authorization Code**: Converts authorization code to admin access token
- **Validate Admin Token**: Introspects token to verify admin scope and validity
- **Admin Token Status Check**: Validates admin user information and permissions
- **Admin Logout**: Terminates admin session and clears tokens

### 2. Admin User Management
Complete user lifecycle management:
- **Get All Users**: Retrieve all users in the system
- **Create User**: Create new user accounts with role assignment
- **Get User by ID**: Retrieve specific user details
- **Update User**: Modify user information and status
- **Search Users by Email**: Find users for AI agent operations
- **Delete User**: Remove user accounts from the system

### 3. Admin Account Management
Full account administration capabilities:
- **Get All Accounts**: View all accounts across all users
- **Create Account**: Create accounts for any user
- **Update Account**: Modify account settings and parameters
- **Delete Account**: Remove accounts from the system

### 4. Admin Transaction Management
Complete transaction oversight:
- **Get All Transactions**: View all system transactions
- **Create Administrative Transaction**: Create transactions with admin notes
- **Update Transaction**: Modify transaction details with audit trail
- **Delete Transaction**: Remove transactions with administrative authority

### 5. System Monitoring & Administration
Comprehensive system oversight:
- **Get System Statistics**: Retrieve system-wide metrics
- **Get Activity Logs**: Access audit trail and activity logs
- **Get User Activity Summary**: Aggregated user activity metrics
- **Export Activity Logs**: Export logs for compliance and audit

### 6. Health Checks & System Status
Operational monitoring:
- **API Health Check**: Validate API system health
- **OAuth Provider Health Check**: Verify OAuth provider connectivity

### 7. Security & Error Validation Tests
Comprehensive security testing:
- **Validate Admin Scope Requirements**: Confirm admin scope enforcement
- **Test Invalid Token Handling**: Validate error responses for invalid tokens
- **Test Missing Authorization Header**: Ensure authentication requirements
- **Test Expired Token Handling**: Verify token expiration handling

## Enhanced Authentication Features

### Admin Scope Validation
```javascript
// Enhanced admin scope validation in pre-request scripts
function validateAdminScope() {
    const accessToken = pm.environment.get('admin_access_token');
    if (!accessToken) return false;
    
    try {
        const parts = accessToken.split('.');
        if (parts.length !== 3) return false;
        
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        const scopes = payload.scope ? payload.scope.split(' ') : [];
        
        const hasAdminScope = scopes.includes('banking:admin');
        if (!hasAdminScope) {
            console.log('❌ Token missing banking:admin scope');
        }
        
        return hasAdminScope;
    } catch (error) {
        console.log('❌ Error validating admin scope:', error.message);
        return false;
    }
}
```

### Super-Scope Authorization
The `banking:admin` scope provides super-scope access that includes:
- All `banking:read` capabilities
- All `banking:write` capabilities  
- Administrative user management
- System-wide account and transaction access
- Activity log and audit trail access
- System statistics and monitoring

### Token Management
```javascript
// Enhanced token processing with admin metadata
if (pm.response.code === 200) {
    const jsonData = pm.response.json();
    
    // Store admin tokens with admin prefix
    pm.environment.set('admin_access_token', jsonData.access_token);
    
    // Extract and store admin user information
    const payload = JSON.parse(atob(jsonData.access_token.split('.')[1]));
    pm.environment.set('admin_username', payload.preferred_username);
    pm.environment.set('admin_email', payload.email);
    pm.environment.set('admin_user_id', payload.sub);
    
    // Validate and store admin scope
    const tokenScopes = payload.scope ? payload.scope.split(' ') : [];
    pm.environment.set('admin_scope_validated', tokenScopes.includes('banking:admin'));
}
```

## Security Features

### Enhanced Security Headers Validation
```javascript
pm.test('Admin security headers present', function () {
    const headers = pm.response.headers;
    
    if (headers.get('X-Content-Type-Options')) {
        pm.expect(headers.get('X-Content-Type-Options')).to.equal('nosniff');
    }
    
    if (headers.get('X-Frame-Options')) {
        pm.expect(headers.get('X-Frame-Options')).to.be.oneOf(['DENY', 'SAMEORIGIN']);
    }
    
    if (headers.get('Strict-Transport-Security')) {
        pm.expect(headers.get('Strict-Transport-Security')).to.include('max-age');
    }
});
```

### Audit Trail Implementation
```javascript
// Store admin operation metadata for audit
const operationLog = {
    timestamp: new Date().toISOString(),
    operation: pm.info.requestName,
    status: pm.response.code,
    responseTime: pm.response.responseTime,
    adminUser: pm.environment.get('admin_username') || 'unknown'
};

// Maintain audit log in environment
const existingLog = pm.environment.get('admin_operations_log');
const logArray = existingLog ? JSON.parse(existingLog) : [];
logArray.push(operationLog);

// Keep only last 50 operations
if (logArray.length > 50) {
    logArray.splice(0, logArray.length - 50);
}

pm.environment.set('admin_operations_log', JSON.stringify(logArray));
```

### Comprehensive Error Scenarios
The collection includes extensive error scenario testing:

1. **Invalid Token Handling**
   - Tests with malformed tokens
   - Validates proper error responses
   - Ensures no sensitive data leakage

2. **Missing Authorization**
   - Tests requests without auth headers
   - Validates 401 responses
   - Confirms authentication requirements

3. **Expired Token Handling**
   - Tests token expiration scenarios
   - Validates server-side expiration checking
   - Tests token refresh requirements

4. **Scope Validation**
   - Confirms admin scope requirements
   - Tests insufficient scope scenarios
   - Validates scope inheritance

## Environment Variables

### Required Admin Variables
```json
{
  "admin_client_id": "{{admin_client_id}}",
  "admin_client_secret": "{{admin_client_secret}}",
  "admin_redirect_uri": "{{admin_redirect_uri}}",
  "admin_access_token": "",
  "admin_refresh_token": "",
  "admin_token_expires_at": "",
  "admin_username": "",
  "admin_email": "",
  "admin_user_id": "",
  "admin_scope_validated": "",
  "admin_token_scopes": "",
  "admin_operations_log": ""
}
```

### Dynamic Test Variables
```json
{
  "test_user_id": "",
  "created_user_id": "",
  "new_user_username": "",
  "new_user_email": "",
  "admin_test_account_id": "",
  "admin_created_account_id": "",
  "new_account_number": "",
  "admin_test_transaction_id": "",
  "admin_created_transaction_id": "",
  "admin_transaction_reference": ""
}
```

## Usage Instructions

### 1. Environment Setup
1. Configure admin OAuth client credentials
2. Set base API URL and OAuth endpoints
3. Ensure admin user account exists in OAuth provider

### 2. Authentication Flow
1. Run "OAuth Admin Login Flow" to generate authorization URL
2. Open URL in browser and authenticate with admin credentials
3. Grant consent for `banking:admin` scope
4. Copy authorization code from callback URL
5. Set `admin_authorization_code` environment variable
6. Run "Exchange Admin Authorization Code"

### 3. Administrative Operations
1. Verify admin token with "Validate Admin Token"
2. Execute user management operations
3. Perform account administration tasks
4. Monitor system statistics and activity logs
5. Run security validation tests

### 4. Collection Runner
For automated testing:
```bash
newman run Banking-API-Admin.postman_collection.json \
  -e Admin-Environment.postman_environment.json \
  --reporters cli,json \
  --reporter-json-export admin-test-results.json
```

## Security Considerations

### Admin Scope Protection
- Admin scope provides super-user access
- Requires explicit consent during OAuth flow
- Should be restricted to authorized administrators only
- Includes comprehensive audit logging

### Token Security
- Admin tokens stored with `admin_` prefix
- Separate from end-user tokens
- Enhanced validation and monitoring
- Automatic cleanup on logout

### Audit Trail
- All admin operations logged
- Includes timestamp, user, and operation details
- Stored in environment for session tracking
- Can be exported for compliance

### Error Handling
- No sensitive data in error responses
- Proper HTTP status codes
- Comprehensive error scenario testing
- Security header validation

## Testing Strategy

### Functional Testing
- Complete CRUD operations for all admin endpoints
- Data validation and structure verification
- Business logic validation
- Integration testing across endpoints

### Security Testing
- Authentication and authorization validation
- Scope requirement enforcement
- Error scenario handling
- Token security and management

### Performance Testing
- Response time validation (< 2 seconds for most operations)
- System statistics and monitoring
- Health check response times
- OAuth provider connectivity

### Compliance Testing
- Audit trail verification
- Activity log completeness
- Data export functionality
- Security header compliance

## Troubleshooting

### Common Issues

1. **Admin Scope Not Granted**
   - Verify admin user has proper permissions
   - Check OAuth client configuration
   - Ensure consent was granted for banking:admin scope

2. **Token Validation Failures**
   - Verify token format and structure
   - Check token expiration
   - Validate OAuth provider connectivity

3. **Permission Denied Errors**
   - Confirm admin scope in token
   - Verify user has administrative privileges
   - Check API endpoint permissions

### Debug Information
The collection provides extensive logging:
- Token validation results
- Scope verification details
- Operation success/failure status
- Performance metrics
- Error details and troubleshooting hints

## Integration with CI/CD

### Automated Testing
```yaml
# Example GitHub Actions workflow
- name: Run Admin API Tests
  run: |
    newman run postman-collections/collections/Banking-API-Admin.postman_collection.json \
      -e environments/admin-test.postman_environment.json \
      --reporters junit,cli \
      --reporter-junit-export admin-test-results.xml
```

### Test Reporting
- JUnit XML output for CI integration
- JSON results for detailed analysis
- Console output for immediate feedback
- Audit log export for compliance

This admin collection provides comprehensive testing capabilities for all administrative functions while maintaining strict security standards and providing detailed audit trails for compliance and monitoring purposes.