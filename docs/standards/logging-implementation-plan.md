# Logging Implementation Plan

## Overview
This document provides a comprehensive plan to update all applications to use the centralized logging service instead of console.* statements. The goal is to achieve consistent, secure, and structured logging across the entire codebase.

## Current State Analysis

### Logging Infrastructure Available
- **Centralized Service**: `src/services/loggingService.ts`
- **Secure Logging**: `src/utils/secureLogging.ts`
- **Logger Instance**: `export const logger` from loggingService
- **Convenience Functions**: `logError`, `logWarn`, `logInfo`, `logDebug`
- **Secure Functions**: `secureLog`, `secureErrorLog`, `secureWarnLog`

### Current Issues Identified
- **1,367 console statements** across 65 flow files
- **224 console statements** across 9 V9 flow files
- **Inconsistent logging patterns** across applications
- **Potential sensitive data exposure** in logs
- **No structured logging** for debugging and monitoring

## Priority Classification

### 🔴 HIGH PRIORITY (Production Apps)
These apps are actively used and need immediate logging updates:

#### V9 Flows (9 files - 224 console statements)
1. **OAuthAuthorizationCodeFlowV9.tsx** - 110 console statements
2. **ImplicitFlowV9.tsx** - 36 console statements
3. **DeviceAuthorizationFlowV9.tsx** - 27 console statements
4. **SAMLBearerAssertionFlowV9.tsx** - 19 console statements
5. **ClientCredentialsFlowV9.tsx** - 10 console statements
6. **OIDCHybridFlowV9.tsx** - 9 console statements
7. **PingOnePARFlowV9.tsx** - 8 console statements
8. **JWTBearerTokenFlowV9.tsx** - 3 console statements
9. **WorkerTokenFlowV9.tsx** - 2 console statements

#### Standardized Apps (6 files - 22+ console statements)
1. **KrogerGroceryStoreMFA.tsx** - 22 console statements
2. **UserInfoFlow.tsx** - 35 console statements
3. **TokenManagementFlow.tsx** - 14 console statements
4. **JWKS Troubleshooting** - TBD console statements
5. **Configuration Management** - TBD console statements
6. **Credential Management** - TBD console statements

### 🟡 MEDIUM PRIORITY (Active Development)
These apps are in development and should be updated:

#### V7/V8 Flows (15+ files - 500+ console statements)
1. **OAuth2AuthorizationCodeFlow.tsx** - 170 console statements
2. **OAuthAuthorizationCodeFlowV7_1/useAuthorizationCodeFlowController.ts** - 93 console statements
3. **JWTBearerTokenFlowV7.tsx** - 30 console statements
4. **OAuthAuthorizationCodeFlowV7_1/authorizationCodeSharedService.ts** - 30 console statements
5. **RedirectlessFlowV9_Real.tsx** - 29 console statements
6. **PingOneMFAWorkflowLibraryV7.tsx** - 22 console statements
7. **UserInfoPostFlow.tsx** - 20 console statements
8. **WorkerTokenFlowV7.tsx** - 20 console statements
9. **SAMLBearerAssertionFlowV7.tsx** - 19 console statements
10. **And 6+ more files with 10-19 console statements each**

### 🟢 LOW PRIORITY (Legacy/Backup)
These are legacy or backup files that can be updated later:

#### Backup Files (10+ files - 300+ console statements)
1. **_backup/EnhancedAuthorizationCodeFlowV2.tsx** - 192 console statements
2. **_backup/AuthorizationCodeFlow.tsx** - 48 console statements
3. **_backup/ClientCredentialsFlow.tsx** - 15 console statements
4. **_backup/DeviceCodeFlow.tsx** - 13 console statements
5. **_backup/HybridFlow.tsx** - 12 console statements
6. **_backup/ImplicitGrantFlow.tsx** - 11 console statements
7. **And 4+ more backup files**

## Implementation Strategy

### Phase 1: V9 Flows (Week 1)
**Goal**: Update all 9 V9 flows to use proper logging

#### Standard Pattern for V9 Flows
```typescript
// Import statements
import { logger } from '../../../services/loggingService';
import { secureLog, secureErrorLog } from '../../../utils/secureLogging';

// Replace console.log
// Before: console.log('Message', data);
// After: logger.info('FlowName', 'Message', data);

// Replace console.error
// Before: console.error('Error message', error);
// After: logger.error('FlowName', 'Error message', error);

// Replace console.warn
// Before: console.warn('Warning message', data);
// After: logger.warn('FlowName', 'Warning message', data);

// For sensitive data
// Before: console.log('Credentials', credentials);
// After: secureLog('Credentials logged', credentials);
```

#### Specific V9 Flow Updates

**1. OAuthAuthorizationCodeFlowV9.tsx (110 statements)**
- **Priority**: 🔴 Highest - Most used V9 flow
- **Module Name**: `OAuthAuthorizationCodeV9`
- **Sensitive Data**: Authorization codes, tokens, credentials
- **Key Areas**: Token exchange, authorization flow, error handling

**2. ImplicitFlowV9.tsx (36 statements)**
- **Priority**: 🔴 High - Core OAuth flow
- **Module Name**: `ImplicitFlowV9`
- **Sensitive Data**: Tokens, URLs, client credentials
- **Key Areas**: Token generation, URL handling, validation

**3. DeviceAuthorizationFlowV9.tsx (27 statements)**
- **Priority**: 🔴 High - Device auth flow
- **Module Name**: `DeviceAuthorizationFlowV9`
- **Note**: Already has some logger imports - need to complete migration
- **Key Areas**: Device code generation, user verification, token exchange

**4. SAMLBearerAssertionFlowV9.tsx (19 statements)**
- **Priority**: 🟡 Medium - SAML-specific flow
- **Module Name**: `SAMLBearerAssertionV9`
- **Sensitive Data**: SAML assertions, certificates
- **Key Areas**: Assertion generation, validation, token exchange

**5. ClientCredentialsFlowV9.tsx (10 statements)**
- **Priority**: 🟡 Medium - Service-to-service auth
- **Module Name**: `ClientCredentialsV9`
- **Sensitive Data**: Client credentials, tokens
- **Key Areas**: Token request, credential validation

**6-9. Remaining V9 Flows (27 statements total)**
- **Priority**: 🟡 Medium
- **Module Names**: `OIDCHybridFlowV9`, `PingOnePARFlowV9`, `JWTBearerTokenFlowV9`, `WorkerTokenFlowV9`
- **Approach**: Quick updates following standard pattern

### Phase 2: Standardized Apps (Week 2)
**Goal**: Update key standardized applications

#### 1. KrogerGroceryStoreMFA.tsx (22 statements)
- **Priority**: 🔴 Highest - Recently standardized app
- **Module Name**: `KrogerGroceryStoreMFA`
- **Current State**: Uses console.log extensively with emojis
- **Sensitive Data**: Credentials, tokens, user data
- **Key Areas**: Authentication flow, device management, user profile

#### 2. UserInfoFlow.tsx (35 statements)
- **Priority**: 🔴 High - User information flow
- **Module Name**: `UserInfoFlow`
- **Sensitive Data**: User profile data, tokens
- **Key Areas**: User data fetching, token validation, profile display

#### 3. TokenManagementFlow.tsx (14 statements)
- **Priority**: 🟡 Medium - Token management interface
- **Module Name**: `TokenManagement`
- **Sensitive Data**: Tokens, refresh tokens, credentials
- **Key Areas**: Token display, refresh operations, storage management

#### 4-6. Additional Standardized Apps
- **JWKS Troubleshooting**: Key management operations
- **Configuration Management**: App configuration
- **Credential Management**: Credential storage/retrieval

### Phase 3: V7/V8 Flows (Week 3-4)
**Goal**: Update active development flows

#### High-Volume Files
1. **OAuth2AuthorizationCodeFlow.tsx (170 statements)**
   - **Module Name**: `OAuthAuthorizationCode`
   - **Approach**: Incremental updates, focus on critical paths
   
2. **AuthorizationCodeFlowV7_1/useAuthorizationCodeFlowController.ts (93 statements)**
   - **Module Name**: `AuthCodeFlowController`
   - **Approach**: Service layer logging, focus on state management

#### Service Layer Updates
- **authorizationCodeSharedService.ts** - Shared service logging
- **JWTBearerTokenFlowV7.tsx** - Token generation logging
- **WorkerTokenFlowV7.tsx** - Worker token operations

### Phase 4: Legacy Files (Week 5)
**Goal**: Update backup and legacy files for completeness

#### Backup Directory Files
- Focus on files that might be referenced or restored
- Apply logging patterns consistently
- Document which files are archived vs active

## Implementation Guidelines

### Logging Standards

#### 1. Module Naming Convention
```typescript
// Use consistent module names
logger.info('OAuthAuthorizationCodeV9', 'Authorization code received', { code: '***' });
logger.error('KrogerGroceryStoreMFA', 'Login failed', error);
logger.warn('UserInfoFlow', 'Token expired', { userId: '***' });
```

#### 2. Sensitive Data Handling
```typescript
// Use secure logging for sensitive data
secureLog('Credentials validated', credentials);
secureErrorLog('Token request failed', { error: error.message, request: '***' });

// Or manually sanitize
logger.info('FlowName', 'Request completed', {
  clientId: credentials.clientId,
  clientSecret: '***', // Never log actual secrets
  environmentId: credentials.environmentId
});
```

#### 3. Error Logging Pattern
```typescript
// Before
console.error('Failed to fetch token:', error);

// After
logger.error('FlowName', 'Failed to fetch token', {
  error: error.message,
  stack: error.stack,
  timestamp: new Date().toISOString()
});
```

#### 4. Structured Logging
```typescript
// Include context and metadata
logger.info('FlowName', 'Operation completed', {
  operation: 'token-exchange',
  duration: performance.now() - startTime,
  success: true,
  tokenType: 'access_token'
});
```

### Security Requirements

#### Fields to NEVER Log
- `clientSecret` or `client_secret`
- `access_token`, `refresh_token`, `id_token`
- `authorization_code` or `code`
- Passwords, API keys, private keys
- Personal user data (PII)

#### URL Sanitization
```typescript
// Sanitize URLs with sensitive parameters
const sanitizedUrl = url.replace(/([?&])(client_secret|code|access_token)=[^&]*/g, '$1=***');
logger.info('FlowName', 'Making request', { url: sanitizedUrl });
```

#### Development vs Production
```typescript
// Use secure logging for development-only logs
if (process.env.NODE_ENV === 'development') {
  secureLog('Debug info', debugData);
}
```

### Testing Requirements

#### 1. Verification Tests
```typescript
// Test that no sensitive data is logged
describe('Logging Security', () => {
  it('should not log sensitive credentials', () => {
    const logSpy = jest.spyOn(logger, 'info');
    // Call function with credentials
    expect(logSpy).not.toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.objectContaining({ clientSecret: expect.any(String) })
    );
  });
});
```

#### 2. Log Format Validation
```typescript
// Test log structure
describe('Logging Format', () => {
  it('should use consistent log format', () => {
    const logSpy = jest.spyOn(logger, 'info');
    // Trigger logging
    expect(logSpy).toHaveBeenCalledWith(
      'ModuleName', // module
      'Message',   // message
      expect.objectContaining({ // structured data
        timestamp: expect.any(String),
        // other expected fields
      })
    );
  });
});
```

## Success Criteria

### Phase Completion Metrics

#### Phase 1: V9 Flows
- ✅ **0 console statements** in all V9 flows
- ✅ **100% structured logging** with proper module names
- ✅ **No sensitive data exposure** in logs
- ✅ **All error paths logged** with context

#### Phase 2: Standardized Apps
- ✅ **0 console statements** in standardized apps
- ✅ **Consistent logging patterns** across apps
- ✅ **Secure logging** for credential operations
- ✅ **Performance logging** for key operations

#### Phase 3: V7/V8 Flows
- ✅ **90% reduction** in console statements
- ✅ **Service layer logging** implemented
- ✅ **State change logging** for debugging
- ✅ **API call logging** with sanitized data

#### Phase 4: Legacy Files
- ✅ **Documentation updated** for archived files
- ✅ **Critical backup files** updated if needed
- ✅ **Legacy patterns documented**

### Quality Gates

#### Automated Checks
1. **Lint Rule**: No console.* statements in production code
2. **Security Scan**: No sensitive data patterns in logs
3. **Test Coverage**: Logging functions covered by tests
4. **Performance**: No performance regression from logging

#### Manual Review
1. **Log Review**: Sample logs for sensitive data
2. **Error Scenarios**: Verify error logging completeness
3. **Debug Value**: Ensure logs provide debugging value
4. **Consistency**: Review logging patterns across apps

## Implementation Timeline

### Week 1: V9 Flows
- **Day 1-2**: OAuthAuthorizationCodeFlowV9.tsx (110 statements)
- **Day 3**: ImplicitFlowV9.tsx (36 statements)
- **Day 4**: DeviceAuthorizationFlowV9.tsx (27 statements)
- **Day 5**: Remaining 6 V9 flows (53 statements)

### Week 2: Standardized Apps
- **Day 1-2**: KrogerGroceryStoreMFA.tsx (22 statements)
- **Day 3**: UserInfoFlow.tsx (35 statements)
- **Day 4**: TokenManagementFlow.tsx (14 statements)
- **Day 5**: Additional standardized apps

### Week 3-4: V7/V8 Flows
- **Week 3**: High-volume files (300+ statements)
- **Week 4**: Service layer and remaining flows

### Week 5: Legacy Files & Cleanup
- **Day 1-2**: Critical backup files
- **Day 3-4**: Documentation and testing
- **Day 5**: Final verification and cleanup

## Risk Mitigation

### Breaking Changes
- **Risk**: Logging changes might affect debugging
- **Mitigation**: Maintain console output in development mode
- **Rollback**: Keep original code commented during transition

### Performance Impact
- **Risk**: Excessive logging might affect performance
- **Mitigation**: Use appropriate log levels, conditional logging
- **Monitoring**: Track performance metrics during rollout

### Data Exposure
- **Risk**: Sensitive data might be exposed in logs
- **Mitigation**: Comprehensive security review, automated scanning
- **Testing**: Security testing for each updated component

## Tools and Automation

### Automated Migration Script
```bash
# Script to identify console statements
find src/pages/flows -name "*.tsx" -exec grep -l "console\." {} \;

# Script to count console statements per file
grep -r "console\." src/pages/flows/v9/ | cut -d: -f1 | sort | uniq -c | sort -nr
```

### Lint Rule Configuration
```json
{
  "rules": {
    "no-console": "error",
    "logging/no-sensitive-data": "error",
    "logging/use-structured-logging": "warn"
  }
}
```

### Pre-commit Hooks
```bash
#!/bin/sh
# Pre-commit hook to prevent console statements
if git diff --cached --name-only | xargs grep -l "console\."; then
  echo "Error: console statements found in staged files"
  exit 1
fi
```

## Conclusion

This comprehensive logging implementation plan will:

1. **Eliminate 1,367 console statements** across the codebase
2. **Implement structured, secure logging** following best practices
3. **Protect sensitive data** with proper sanitization
4. **Improve debugging capabilities** with consistent logging patterns
5. **Enable better monitoring** and error tracking

The phased approach ensures minimal disruption while maximizing the benefits of centralized logging. Each phase builds upon the previous one, with clear success criteria and quality gates to ensure high-quality implementation.

**Total Estimated Effort**: 5 weeks
**Files to Update**: 65+ files
**Console Statements to Replace**: 1,367+
**Priority**: 🔴 HIGH - Critical for production readiness
