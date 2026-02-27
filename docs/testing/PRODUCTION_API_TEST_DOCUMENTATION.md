# Production API Test Suite Documentation

**Date:** 2026-01-24  
**Version:** 7.7.3  
**Environment:** Production (Vercel)  
**Test Page URL:** https://oauth-playground-pi.vercel.app/production/api-tests  

---

## 🚀 **Overview**

The Production API Test Suite provides comprehensive testing capabilities for MFA and Unified OAuth flows with real PingOne APIs. This suite enables developers to validate API functionality, inspect request/response data, and ensure system stability after wholesale changes.

---

## 📋 **Test Suites**

### 🔐 **MFA Device Management Suite**
**Description:** Test MFA device registration, activation, and management APIs

| Test ID | Test Name | Method | Endpoint | Category |
|---------|-----------|--------|----------|----------|
| `mfa-lookup-user` | Lookup User by Username | POST | `/api/pingone/mfa/lookup-user` | MFA |
| `mfa-register-sms` | Register SMS Device | POST | `/api/pingone/mfa/register-device` | MFA |
| `mfa-register-email` | Register Email Device | POST | `/api/pingone/mfa/register-device` | MFA |
| `mfa-register-totp` | Register TOTP Device | POST | `/api/pingone/mfa/register-device` | MFA |
| `mfa-list-users` | List Users | POST | `/api/pingone/mfa/list-users` | MFA |
| `mfa-allow-bypass` | Allow MFA Bypass | POST | `/api/pingone/mfa/allow-bypass` | MFA |
| `mfa-check-bypass` | Check MFA Bypass Status | POST | `/api/pingone/mfa/check-bypass` | MFA |

#### **MFA Test Features**
- **User Discovery**: Find user IDs by username for device operations
- **Device Registration**: Register SMS, Email, and TOTP devices with proper policies
- **Bypass Management**: Allow and check MFA bypass status for users
- **User Listing**: Paginated user search and listing
- **Real API Calls**: All tests use actual PingOne MFA APIs via backend proxy

---

### 🔗 **Unified OAuth Flows Suite**
**Description:** Test OAuth/OIDC authorization flows and token operations

| Test ID | Test Name | Method | Endpoint | Category |
|---------|-----------|--------|----------|----------|
| `oauth-discovery` | OIDC Discovery | GET | `https://auth.pingone.com/{{environmentId}}/.well-known/openid_configuration` | Unified |
| `oauth-jwks` | JWKS Endpoint | GET | `https://auth.pingone.com/{{environmentId}}/.well-known/jwks.json` | Unified |
| `oauth-userinfo` | User Info Endpoint | GET | `https://auth.pingone.com/{{environmentId}}/as/userinfo` | Unified |
| `oauth-introspect` | Token Introspection | POST | `https://auth.pingone.com/{{environmentId}}/as/introspect` | Unified |
| `oauth-revoke` | Revoke Token | POST | `https://auth.pingone.com/{{environmentId}}/as/revoke` | Unified |

#### **OAuth Flow Features**
- **Discovery Document**: Fetch OIDC configuration and endpoints
- **Key Management**: Retrieve JSON Web Key Set for token validation
- **User Information**: Get user profile data with access tokens
- **Token Validation**: Introspect tokens for metadata and validity
- **Token Revocation**: Revoke access tokens for logout scenarios

---

### 🏢 **PingOne Platform APIs Suite**
**Description:** Test core PingOne platform management APIs

| Test ID | Test Name | Method | Endpoint | Category |
|---------|-----------|--------|----------|----------|
| `platform-environments` | List Environments | GET | `https://api.pingone.com/v1/environments` | Common |
| `platform-applications` | List Applications | GET | `https://api.pingone.com/v1/environments/{{environmentId}}/applications` | Common |
| `platform-users` | List Users | GET | `https://api.pingone.com/v1/environments/{{environmentId}}/users` | Common |
| `platform-activities` | List Activities | GET | `https://api.pingone.com/v1/environments/{{environmentId}}/activities` | Common |

#### **Platform Features**
- **Environment Management**: List all accessible PingOne environments
- **Application Management**: View applications in specific environments
- **User Management**: List users with pagination and filtering
- **Audit Activities**: Access audit logs and activity tracking
- **Direct API Access**: Tests use direct PingOne API endpoints

---

## 🛠️ **Test Configuration**

### **Template Variables**
Tests use template variables that must be replaced with actual values:

| Variable | Description | Example |
|----------|-------------|---------|
| `{{environmentId}}` | PingOne Environment ID | `12345678-1234-1234-1234-123456789012` |
| `{{workerToken}}` | Worker Access Token | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `{{accessToken}}` | User Access Token | `eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `{{basicAuth}}` | Basic Auth Header | `Y2xpZW50LWlkOnNlY3JldDpY2xpZW50U2VjcmV0` |
| `{{username}}` | Username for lookup | `test.user@example.com` |
| `{{policyId}}` | Device Policy ID | `policy-123456` |
| `{{userId}}` | User ID (auto-filled) | `user-123456` |

### **Authentication Methods**
- **MFA Tests**: Use Worker Token authentication via backend proxy
- **OAuth Tests**: Use Access Token or Basic Auth depending on endpoint
- **Platform Tests**: Use Worker Token for admin-level access

---

## 📊 **Test Execution**

### **Test Controls**
- **Individual Tests**: Run single tests with custom parameters
- **Suite Tests**: Execute all tests in a specific suite
- **All Tests**: Run comprehensive test suite across all categories
- **Real-time Status**: Visual feedback for running, success, and error states

### **Result Analysis**
- **Response Headers**: Complete HTTP header inspection
- **Response Body**: Formatted JSON response data
- **Status Codes**: HTTP status code validation
- **Duration Tracking**: Test execution time measurement
- **Error Details**: Comprehensive error message display

### **Test Dependencies**
- **Chain Testing**: Tests can depend on other tests (e.g., device registration depends on user lookup)
- **Auto-resolution**: Dependent tests automatically use results from prerequisite tests
- **Failure Handling**: Dependency failures prevent dependent test execution

---

## 🎯 **Usage Guide**

### **Accessing the Test Suite**
1. Navigate to **Production** → **🧪 Production API Tests** in the sidebar
2. The test page will load with all available test suites

### **Running Tests**
1. **Individual Test**: Click "Run Test" on any specific test
2. **Suite Test**: Click "Run Suite" to execute all tests in a category
3. **All Tests**: Click "Run All Tests" for comprehensive testing

### **Configuring Tests**
1. Replace template variables with actual values:
   - Environment ID from PingOne console
   - Worker Token from Manage Token dialog
   - Access Token from OAuth flow completion
2. Tests will automatically use the configured values

### **Analyzing Results**
1. **Status Icons**: 
   - ✅ Green = Success
   - ❌ Red = Error
   - 🔄 Yellow = Running
2. **Expand Details**: Click "Show Details" to view full request/response data
3. **Inspect Headers**: View complete HTTP headers in formatted display
4. **Examine Body**: Analyze JSON response data with syntax highlighting

---

## 🔧 **Technical Implementation**

### **Architecture**
- **Frontend**: React component with TypeScript for type safety
- **API Calls**: Native fetch API with proper error handling
- **State Management**: React hooks for test execution tracking
- **UI Framework**: Styled-components for consistent design

### **Key Components**
- **ProductionApiTestPageV8U**: Main test interface component
- **TestSuite**: Organized test categories with metadata
- **ApiTest**: Individual test definitions with request/response specs
- **TestResult**: Result tracking with detailed response data

### **Security Considerations**
- **Token Protection**: Worker tokens and access tokens are never exposed in URLs
- **Backend Proxy**: MFA tests use backend proxy to avoid CORS issues
- **Template Variables**: Sensitive data is only used during test execution
- **Request Logging**: All API calls are tracked for debugging

### **Error Handling**
- **Network Errors**: Proper fetch error handling with user-friendly messages
- **HTTP Errors**: Detailed error response parsing and display
- **Template Errors**: Clear indication when template variables are missing
- **Dependency Errors**: Graceful handling of test dependency failures

---

## 📈 **Test Coverage**

### **MFA Coverage**
- ✅ User discovery and lookup
- ✅ Device registration (SMS, Email, TOTP)
- ✅ Device activation and validation
- ✅ MFA bypass management
- ✅ User listing and search
- ✅ Device policy enforcement

### **OAuth Coverage**
- ✅ OIDC discovery document
- ✅ JSON Web Key Set (JWKS)
- ✅ User information endpoint
- ✅ Token introspection
- ✅ Token revocation
- ✅ Authorization URL building

### **Platform Coverage**
- ✅ Environment management
- ✅ Application management
- ✅ User management
- ✅ Audit activities
- ✅ Admin-level operations

---

## 🚨 **Best Practices**

### **Before Running Tests**
1. **Validate Credentials**: Ensure worker tokens and access tokens are valid
2. **Check Environment**: Verify PingOne environment is accessible
3. **Review Policies**: Confirm device policies exist for TOTP tests
4. **Test Dependencies**: Ensure prerequisite tests can pass

### **During Testing**
1. **Monitor Results**: Watch for success/error indicators
2. **Check Responses**: Validate response data structure and content
3. **Track Duration**: Monitor test execution times for performance
4. **Review Logs**: Check browser console for additional debugging info

### **After Testing**
1. **Clear Results**: Use "Clear Results" to reset test state
2. **Analyze Failures**: Review error details for troubleshooting
3. **Update Templates**: Refresh template variables if credentials change
4. **Document Issues**: Record any unexpected behavior for investigation

---

## 🔄 **Change Validation Workflow**

### **For Wholesale Changes**
1. **Baseline Testing**: Run full test suite before changes
2. **Apply Changes**: Implement your code changes
3. **Regression Testing**: Run test suite to validate changes
4. **Compare Results**: Analyze differences between before/after
5. **Document Impact**: Record any breaking changes or new requirements

### **Continuous Integration**
1. **Automated Testing**: Integrate test suite into CI/CD pipeline
2. **Scheduled Runs**: Execute tests regularly to monitor API health
3. **Alerting**: Set up notifications for test failures
4. **Reporting**: Generate test reports for stakeholder review

---

## 📞 **Support and Troubleshooting**

### **Common Issues**
- **Authentication Errors**: Check token validity and permissions
- **Network Failures**: Verify PingOne API accessibility
- **Template Errors**: Ensure all required variables are replaced
- **Dependency Failures**: Check prerequisite test execution

### **Debugging Tips**
- **Browser Console**: Check for additional error details
- **Network Tab**: Inspect actual HTTP requests
- **Response Preview**: Verify response data structure
- **Test Logs**: Review execution logs for timing issues

### **Getting Help**
- **Documentation**: Review this guide and inline test descriptions
- **Code Comments**: Check inline documentation in test components
- **API References**: Consult PingOne API documentation for endpoint details
- **Community**: Reach out to development team for assistance

---

## 🎉 **Conclusion**

The Production API Test Suite provides a comprehensive, reliable, and user-friendly interface for validating PingOne API functionality. With real API calls, detailed response inspection, and organized test categories, this suite enables developers to:

- **Validate Changes**: Ensure API compatibility after code modifications
- **Debug Issues**: Identify and resolve API-related problems
- **Monitor Health**: Track API performance and availability
- **Ensure Quality**: Maintain high standards for API integration

**Live URL**: https://oauth-playground-pi.vercel.app/production/api-tests 🚀

---

*Last Updated: 2026-01-24*  
*Version: 7.7.3*  
*Environment: Production*
