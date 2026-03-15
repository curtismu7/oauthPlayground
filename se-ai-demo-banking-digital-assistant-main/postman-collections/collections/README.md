# Banking API Postman Collections

This directory contains comprehensive Postman collections for testing the Banking API from both end user and administrator perspectives. The collections include OAuth authentication flows, complete CRUD operations, and extensive security validation tests.

## 📦 Available Collections

### 1. Banking API - End User Collection
Comprehensive testing capabilities for end users including OAuth authentication, account management, transaction operations, and security validation tests.

### 2. Banking API - Admin Collection  
Complete administrative testing suite with enhanced OAuth authentication, full CRUD operations for accounts and transactions, user management, system monitoring, and comprehensive security validation.

## 🆕 Latest Updates - Admin Account & Transaction Management

The admin collection now includes comprehensive account and transaction management with full CRUD operations:

### New Admin Account Management Features
- **Get All Accounts**: Retrieve all accounts in the system with statistics
- **Get Account by ID**: Access specific account details
- **Get Account Balance**: Real-time balance information for any account
- **Create Account**: Create accounts for any user with validation
- **Update Account**: Modify account information and settings
- **Delete Account**: Remove accounts with proper audit trails

### New Admin Transaction Management Features
- **Get All Transactions**: System-wide transaction oversight with analytics
- **Get Transaction by ID**: Detailed transaction information
- **Create Administrative Transaction**: Create transactions on behalf of users
- **Update Transaction**: Modify transaction details with audit trails
- **Delete Transaction**: Remove transactions with proper validation

### Enhanced Validation & Security
- Comprehensive data type and business rule validation
- Admin scope verification for all operations
- Enhanced audit logging and trail creation
- Performance monitoring and statistics calculation
- Multi-user access validation and security checks

## 🚀 Quick Start

### Prerequisites

1. **Banking API Server**: Ensure the Banking API server is running
2. **OAuth Provider**: PingOne AIC or compatible OAuth 2.0 provider configured
3. **Postman Environment**: Set up with required variables (see Environment Setup below)
4. **End User Credentials**: Valid OAuth client credentials for end users

### Environment Setup

Create a Postman environment with the following variables:

```json
{
  "base_url": "http://localhost:3000",
  "oauth_auth_url": "https://auth.pingone.com/your-tenant/as/authorize",
  "oauth_token_url": "https://auth.pingone.com/your-tenant/as/token",
  "oauth_introspect_url": "https://auth.pingone.com/your-tenant/as/introspect",
  "oauth_revoke_url": "https://auth.pingone.com/your-tenant/as/revoke",
  "user_client_id": "your-end-user-client-id",
  "user_client_secret": "your-end-user-client-secret",
  "redirect_uri": "http://localhost:3000/callback"
}
```

## 📋 Collection Structure

### 1. Authentication
- **OAuth Login Flow**: Generates authorization URL with PKCE parameters
- **Exchange Authorization Code**: Converts auth code to access token
- **Token Status Check**: Validates current token (optional)
- **Logout**: Revokes token and clears session (optional)

### 2. Account Management
- **Get My Accounts**: Retrieve user's bank accounts
- **Get Account Balance**: Check specific account balance (optional)
- **Get Account Details**: Detailed account information (optional)

### 3. Transaction Management
- **Get My Transactions**: Retrieve transaction history
- **Create Deposit**: Add money to account
- **Create Withdrawal**: Remove money from account (optional)
- **Create Transfer**: Move money between accounts (optional)

### 4. User Profile Management
- **Get My Profile**: Retrieve current user's profile information
- **Update My Profile**: Modify profile data (firstName, lastName, email)

### 5. Negative Tests - Unauthorized Access
- **Try Access Admin Stats**: Verify end users cannot access admin statistics
- **Try Access Admin Activity Logs**: Verify end users cannot access system logs
- **Try Access All Users List**: Verify end users cannot list all users
- **Try Access Other User Profile**: Verify users cannot access other users' profiles
- **Try Create User**: Verify end users cannot create new users
- **Try Delete Activity Logs**: Verify end users cannot perform admin operations

## 🔐 Authentication Flow

### Step 1: Generate Authorization URL
1. Run the "OAuth Login Flow" request
2. Copy the authorization URL from the console output
3. Open the URL in a browser
4. Complete the login process
5. Copy the authorization code from the callback URL

### Step 2: Exchange for Access Token
1. Set the `authorization_code` environment variable with the code from step 1
2. Run the "Exchange Authorization Code" request
3. The access token will be automatically stored in environment variables

### Step 3: Use API Endpoints
- All subsequent requests will automatically use the stored access token
- The collection handles token validation and authorization headers

## 🧪 Testing Scenarios

### Basic Flow
1. **Authentication**: Complete OAuth flow
2. **Account Access**: Get user accounts
3. **Transaction History**: View past transactions
4. **Create Transaction**: Make a deposit
5. **Profile Management**: View/update profile
6. **Security Tests**: Verify access controls

### Automated Testing
Use Postman's Collection Runner for automated testing:

1. Select the entire collection or specific folders
2. Choose your environment
3. Set iterations and delays as needed
4. Run and review test results

## 🔍 Test Validation

### Authentication Tests
- ✅ OAuth parameters generated correctly
- ✅ Authorization URL properly formatted
- ✅ Token exchange successful
- ✅ Access token contains required scopes
- ✅ User information extracted from JWT

### Account Management Tests
- ✅ Accounts retrieved successfully
- ✅ User can only see own accounts
- ✅ Account data structure validation
- ✅ Balance information accuracy
- ✅ Account ownership verification

### Transaction Tests
- ✅ Transaction history retrieved
- ✅ User can only see own transactions
- ✅ Transaction creation successful
- ✅ Transaction data validation
- ✅ Proper error handling for insufficient funds

### Profile Management Tests
- ✅ Profile retrieved successfully
- ✅ Profile updates working correctly
- ✅ User cannot escalate privileges
- ✅ Profile scope validation
- ✅ Ownership verification

### Security Tests
- ✅ Admin endpoints properly denied (403 Forbidden)
- ✅ Other users' data inaccessible
- ✅ Error responses don't leak sensitive data
- ✅ Scope-based authorization working
- ✅ Proper security headers present

## 🛠️ Troubleshooting

### Common Issues

#### "No access token" Error
- **Cause**: OAuth flow not completed
- **Solution**: Run the complete OAuth authentication flow first

#### "Account ID required" Error
- **Cause**: No account data available
- **Solution**: Run "Get My Accounts" request first to populate account IDs

#### 403 Forbidden Errors
- **Cause**: Insufficient scopes or expired token
- **Solution**: Re-authenticate with proper scopes

#### Token Expired
- **Cause**: Access token has expired
- **Solution**: Re-run the OAuth flow or implement token refresh

### Environment Variables

The collection automatically manages these variables:
- `access_token`: Current access token
- `refresh_token`: Refresh token (if provided)
- `token_expires_at`: Token expiration timestamp
- `user_id`: Authenticated user ID
- `test_account_id`: Primary account for testing
- `test_transaction_id`: Last created transaction ID

## 🔧 Customization

### Adding New Requests
1. Create new request in appropriate folder
2. Use collection-level authentication (Bearer token)
3. Add appropriate pre-request and test scripts
4. Follow existing naming and description conventions

### Modifying Test Data
- Edit pre-request scripts to change transaction amounts
- Modify test assertions based on your API responses
- Update environment variables for different test scenarios

### Environment-Specific Configuration
- Create separate environments for dev/staging/production
- Adjust base URLs and OAuth endpoints accordingly
- Use different client credentials per environment

## 📊 Test Reporting

### Console Output
The collection provides detailed console logging:
- Request summaries with timing
- Authentication status updates
- Data extraction confirmations
- Error details and troubleshooting hints

### Test Results
- All requests include comprehensive test assertions
- Pass/fail status for each validation
- Detailed error messages for failures
- Security validation results

## 🔒 Security Considerations

### Token Management
- Tokens are stored in environment variables (not collection variables)
- Automatic token expiration checking
- Secure token cleanup on logout
- PKCE implementation for enhanced security

### Data Privacy
- No hardcoded sensitive data in collection
- Test data uses synthetic/mock information
- Proper error handling without data leakage
- Scope-based access control validation

### Best Practices
- Use separate environments for different stages
- Regularly rotate OAuth client credentials
- Monitor and audit API access logs
- Implement proper token refresh mechanisms

## 📚 Additional Resources

- [Banking API Documentation](../documentation/)
- [OAuth 2.0 Setup Guide](../environments/CONFIGURATION_TEMPLATE.md)
- [Postman Collection Best Practices](https://learning.postman.com/docs/collections/using-collections/)
- [JWT Token Utilities](../scripts/jwt-utilities.js)

## 🤝 Contributing

When contributing to this collection:
1. Follow existing code style and conventions
2. Add comprehensive test assertions
3. Include detailed descriptions for new requests
4. Update this README with any new features
5. Test thoroughly across different environments

## 📝 Changelog

### v1.0.0 (Current)
- Initial release with complete OAuth flow
- Account management endpoints
- Transaction operations
- User profile management
- Comprehensive negative testing
- Automated test validation
- Security and authorization checks