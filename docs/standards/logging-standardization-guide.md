# 📋 Logging Standardization Guide

## Overview

This guide establishes the standard process for implementing proper logging across all applications and services. It ensures consistent logging practices, security compliance, and effective debugging capabilities.

## 🎯 Objectives

### Primary Goals
- **Consistent Logging**: Uniform logging patterns across all components
- **Security Compliance**: Proper handling of sensitive data in logs
- **Debugging Efficiency**: Effective logging for troubleshooting and monitoring
- **Production Readiness**: Logs that work in both development and production

### Secondary Goals
- **Performance**: Minimal impact on application performance
- **Maintainability**: Clear and maintainable logging code
- **Integration**: Seamless integration with existing monitoring systems

## 🏗️ Logging Architecture

### Logging Systems

#### 1. V9 Modern Messaging Service
```typescript
import { modernMessaging } from '@/services/v9/V9ModernMessagingService';

// User-facing messages (non-logging)
modernMessaging.showFooterMessage({ type: 'info', message: 'Operation completed', duration: 3000 });
modernMessaging.showBanner({ type: 'error', title: 'Error', message: 'Operation failed', dismissible: true });
modernMessaging.showCriticalError({ title: 'Critical Error', message: 'System failure' });
```

#### 2. Centralized Logging Service
```typescript
import { logger, logError, logWarn, logInfo, logDebug } from '@/services/loggingService';

// Structured logging with module context
logInfo('TokenService', 'Token exchange initiated', { flowType: 'authz-code' });
logError('TokenService', 'Token exchange failed', { error: error.message, flowType: 'authz-code' });
```

#### 3. Secure Logging Utility
```typescript
import { secureLog, secureErrorLog, sanitizeSensitiveData } from '@/utils/secureLogging';

// Development-only logging with sensitive data masking
secureLog('Processing credentials', { clientId, clientSecret: '***' });
```

## 📋 Logging Categories

### 1. **API Call Logging** (REQUIRED)
All external API calls must be logged with:
- **Request Details**: URL, method, headers (sanitized)
- **Response Details**: Status code, response time, errors
- **Context**: Flow type, user action, correlation ID

```typescript
// ✅ Correct API Logging
logInfo('PingOneAPI', 'Making token request', {
  url: sanitizeUrl(tokenUrl),
  method: 'POST',
  flowType: 'authz-code',
  requestId: generateRequestId()
});

try {
  const response = await fetch(tokenUrl, options);
  logInfo('PingOneAPI', 'Token request successful', {
    status: response.status,
    responseTime: Date.now() - startTime,
    requestId
  });
} catch (error) {
  logError('PingOneAPI', 'Token request failed', {
    error: error.message,
    status: error.status || 'network',
    requestId
  });
}
```

### 2. **User Action Logging** (REQUIRED)
All significant user actions must be logged:
- **Action Type**: Button clicks, form submissions, navigation
- **Context**: Current flow, step, user state
- **Outcome**: Success, failure, validation errors

```typescript
// ✅ Correct User Action Logging
const handleTokenExchange = async () => {
  logInfo('UserAction', 'Token exchange button clicked', {
    flowType: 'authz-code',
    step: 5,
    hasAuthCode: !!authCode
  });

  try {
    const tokens = await exchangeTokens();
    logInfo('UserAction', 'Token exchange completed successfully', {
      flowType: 'authz-code',
      tokenType: 'access+refresh',
      step: 6
    });
  } catch (error) {
    logError('UserAction', 'Token exchange failed', {
      flowType: 'authz-code',
      error: error.message,
      step: 5
    });
  }
};
```

### 3. **System Event Logging** (REQUIRED)
All significant system events must be logged:
- **Lifecycle**: Component mount/unmount, service initialization
- **State Changes**: Authentication state, configuration changes
- **Performance**: Slow operations, memory usage

```typescript
// ✅ Correct System Event Logging
useEffect(() => {
  logInfo('ComponentLifecycle', 'OAuthFlow component mounted', {
    flowType: 'authz-code',
    version: '9.13.1'
  });

  return () => {
    logInfo('ComponentLifecycle', 'OAuthFlow component unmounted', {
      flowType: 'authz-code',
      sessionDuration: Date.now() - mountTime
    });
  };
}, []);
```

### 4. **Debug Logging** (DEVELOPMENT ONLY)
Detailed debugging information for development:
- **State Snapshots**: Component state, form data
- **Flow Tracing**: Step-by-step execution details
- **Performance Metrics**: Timing, render cycles

```typescript
// ✅ Correct Debug Logging (Development Only)
if (process.env.NODE_ENV === 'development') {
  logDebug('FlowDebug', 'Processing authorization code', {
    code: authCode?.substring(0, 10) + '...',
    state,
    verifierPresent: !!codeVerifier,
    timestamp: Date.now()
  });
}
```

## 🔒 Security Requirements

### Sensitive Data Handling

#### **Never Log These Fields:**
- `clientSecret` or `client_secret`
- `access_token` or `accessToken`
- `refresh_token` or `refreshToken`
- `id_token` or `idToken`
- `authorization_code` or `code`
- Passwords, API keys, certificates

#### **Always Sanitize URLs:**
```typescript
// ✅ Correct URL Sanitization
const sanitizeUrl = (url: string): string => {
  return url.replace(/([?&](client_secret|code|access_token|refresh_token|id_token)=)[^&]*/g, '$1=***');
};

logInfo('APIRequest', 'Making request', {
  url: sanitizeUrl(fullUrl),
  method: 'POST'
});
```

#### **Use Secure Logging for Sensitive Operations:**
```typescript
// ✅ Correct Secure Logging
import { secureLog } from '@/utils/secureLogging';

secureLog('Processing credentials', {
  clientId: credentials.clientId,
  clientSecret: '***', // Automatically masked
  environmentId: credentials.environmentId
});
```

## 📝 Logging Standards by Component Type

### V9 Flow Components

#### **Required Logging Points:**
1. **Component Mount/Unmount**
2. **Step Transitions**
3. **API Calls**
4. **User Actions**
5. **Error Handling**
6. **Success Completions**

```typescript
// ✅ V9 Flow Component Logging Template
const V9AuthCodeFlow: React.FC = () => {
  const mountTime = React.useRef(Date.now());

  React.useEffect(() => {
    logInfo('V9AuthCodeFlow', 'Component mounted', {
      version: '9.13.1',
      flowType: 'authz-code'
    });

    return () => {
      logInfo('V9AuthCodeFlow', 'Component unmounted', {
        sessionDuration: Date.now() - mountTime.current
      });
    };
  }, []);

  const handleStepChange = (newStep: number) => {
    logInfo('V9AuthCodeFlow', 'Step transition', {
      fromStep: currentStep,
      toStep: newStep,
      flowType: 'authz-code'
    });
  };

  // ... rest of component
};
```

### Service Classes

#### **Required Logging Points:**
1. **Service Initialization**
2. **Method Entry/Exit**
3. **API Communications**
4. **Data Transformations**
5. **Error Conditions**

```typescript
// ✅ Service Class Logging Template
class TokenService {
  constructor() {
    logInfo('TokenService', 'Service initialized', { version: '9.13.1' });
  }

  async exchangeTokens(code: string): Promise<TokenResponse> {
    const startTime = Date.now();
    logInfo('TokenService', 'Token exchange started', { codeLength: code.length });

    try {
      const response = await this.makeTokenRequest(code);
      logInfo('TokenService', 'Token exchange successful', {
        responseTime: Date.now() - startTime,
        tokenType: response.token_type
      });
      return response;
    } catch (error) {
      logError('TokenService', 'Token exchange failed', {
        error: error.message,
        responseTime: Date.now() - startTime
      });
      throw error;
    }
  }
}
```

### API Request Services

#### **Required Logging Points:**
1. **Request Preparation**
2. **Network Requests**
3. **Response Processing**
4. **Error Handling**
5. **Retry Logic**

```typescript
// ✅ API Service Logging Template
class PingOneAPIService {
  async makeRequest(url: string, options: RequestInit): Promise<Response> {
    const requestId = generateRequestId();
    const startTime = Date.now();

    logInfo('PingOneAPI', 'Request initiated', {
      url: sanitizeUrl(url),
      method: options.method,
      requestId
    });

    try {
      const response = await fetch(url, options);
      logInfo('PingOneAPI', 'Request completed', {
        status: response.status,
        responseTime: Date.now() - startTime,
        requestId
      });
      return response;
    } catch (error) {
      logError('PingOneAPI', 'Request failed', {
        error: error.message,
        responseTime: Date.now() - startTime,
        requestId
      });
      throw error;
    }
  }
}
```

## 🔄 Migration Checklist

### For New V9 Components

#### **Phase 1: Setup Logging Infrastructure**
- [ ] Import required logging services
- [ ] Set up module constants for logging
- [ ] Configure secure logging for sensitive operations

#### **Phase 2: Implement Required Logging**
- [ ] Add component lifecycle logging
- [ ] Add user action logging
- [ ] Add API call logging
- [ ] Add error handling logging

#### **Phase 3: Review and Optimize**
- [ ] Verify no sensitive data is logged
- [ ] Check log levels are appropriate
- [ ] Test logging in development mode
- [ ] Verify production logging behavior

### For Existing Components (Updates)

#### **Phase 1: Audit Current Logging**
- [ ] Identify all console.* statements
- [ ] Check for sensitive data exposure
- [ ] Review error handling patterns

#### **Phase 2: Migrate to Standard Logging**
- [ ] Replace console.* with appropriate logging service
- [ ] Add missing required logging points
- [ ] Implement secure logging for sensitive operations

#### **Phase 3: Validation**
- [ ] Test logging functionality
- [ ] Verify security compliance
- [ ] Check performance impact

## 🧪 Testing and Validation

### Logging Tests

#### **Unit Tests**
```typescript
// ✅ Logging Test Example
describe('TokenService Logging', () => {
  it('should log token exchange start and success', () => {
    const mockLogger = jest.spyOn(logger, 'info');
    
    await tokenService.exchangeTokens('test-code');
    
    expect(mockLogger).toHaveBeenCalledWith(
      'TokenService',
      'Token exchange started',
      expect.objectContaining({ codeLength: 10 })
    );
    expect(mockLogger).toHaveBeenCalledWith(
      'TokenService',
      'Token exchange successful',
      expect.objectContaining({ responseTime: expect.any(Number) })
    );
  });
});
```

#### **Integration Tests**
```typescript
// ✅ Integration Test Example
describe('API Logging Integration', () => {
  it('should log API calls with sanitized URLs', async () => {
    const response = await makeAPICall('https://api.example.com/token?client_secret=secret');
    
    const logs = logger.getLogsByModule('PingOneAPI');
    const sanitizedLog = logs.find(log => log.message.includes('Request initiated'));
    
    expect(sanitizedLog.data.url).toContain('client_secret=***');
    expect(sanitizedLog.data.url).not.toContain('secret');
  });
});
```

### Security Validation

#### **Sensitive Data Check**
```bash
# ✅ Security Test Script
#!/bin/bash
# Check for potential sensitive data logging

echo "Checking for sensitive data in logs..."
grep -r "clientSecret\|access_token\|refresh_token" src/ --include="*.ts" --include="*.tsx" | grep -v "sanitizeSensitiveData\|***" && echo "⚠️  Potential sensitive data exposure found" || echo "✅ No sensitive data exposure detected"
```

## 📊 Log Analysis and Monitoring

### Log Categories for Monitoring

#### **Error Logs**
- API failures
- Authentication errors
- System exceptions
- User action failures

#### **Warning Logs**
- Deprecated usage
- Performance issues
- Configuration problems
- Retry attempts

#### **Info Logs**
- Successful operations
- User actions
- System events
- API responses

#### **Debug Logs**
- Detailed execution traces
- State changes
- Performance metrics
- Development diagnostics

### Production Log Configuration

```typescript
// ✅ Production Logging Configuration
logger.configure({
  maxMemoryLogs: 5000,
  enableConsoleOutput: false, // Disabled in production
  minLogLevel: LogLevel.INFO  // Only INFO and above in production
});
```

## 🔧 Troubleshooting

### Common Issues

#### **Missing Logs**
**Problem**: Expected logs not appearing
**Solution**: 
1. Check log level configuration
2. Verify module name consistency
3. Ensure logging service is initialized

#### **Sensitive Data Exposure**
**Problem**: Sensitive data appearing in logs
**Solution**:
1. Use `sanitizeSensitiveData()` for all log data
2. Use `secureLog()` for sensitive operations
3. Review URL sanitization patterns

#### **Performance Impact**
**Problem**: Logging causing performance issues
**Solution**:
1. Reduce debug logging in production
2. Use async logging for high-frequency operations
3. Implement log buffering for batch operations

### Debug Tools

#### **Log Export**
```typescript
// ✅ Export logs for debugging
const exportLogs = () => {
  logger.exportLogs(); // Downloads log file
};
```

#### **Real-time Monitoring**
```typescript
// ✅ Real-time log monitoring
const logs = logger.getLogsByLevel(LogLevel.ERROR);
console.error(`Found ${logs.length} error logs`);
```

## 📚 Related Documentation

- [V9 Modern Messaging Migration Guide](./v9-modern-messaging-migration-guide.md)
- [Security Standards Guide](./security-standards-guide.md)
- [API Integration Guide](./api-integration-guide.md)
- [Troubleshooting Guide](./troubleshooting-guide.md)

---

**Guide Created**: March 6, 2026  
**Version**: 1.0  
**Maintainer**: Development Team  

For questions about logging standards or to report issues, please contact the development team or create an issue in the project repository.
