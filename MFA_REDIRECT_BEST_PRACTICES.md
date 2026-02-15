# MFA Redirect Best Practices & Troubleshooting Guide

## 📋 Overview

This document provides comprehensive guidelines for implementing and troubleshooting MFA redirects in the OAuth Playground. Following these practices will ensure MFA flows never fail due to redirect issues.

## 🎯 Core Principles

### 1. **Never Break Redirects**
- **Rule**: Any change that affects user flow must maintain backward compatibility
- **Exception**: Only breaking changes are acceptable when explicitly requested and documented
- **Verification**: Always test the complete user journey before deploying

### 2. **Redirect State Management**
- **Persistence**: Save redirect state before any MFA flow starts
- **Recovery**: Always have a fallback mechanism if redirect state is lost
- **Validation**: Verify redirect URLs are valid and accessible

### 3. **Error Handling**
- **Graceful Degradation**: Never leave users stuck in MFA flows
- **Clear Messaging**: Always show users what's happening and why
- **Recovery Options**: Provide ways to retry or restart flows

## 🔧 Implementation Guidelines

### **MFA Flow Redirect Pattern**

```typescript
// ✅ CORRECT: Save redirect state before MFA
const handleMFARedirect = async (redirectUrl: string) => {
  // 1. Save redirect state
  const redirectState = {
    url: redirectUrl,
    timestamp: Date.now(),
    flowId: generateFlowId(),
    userAgent: navigator.userAgent,
  };
  
  // 2. Persist to multiple storage mechanisms
  localStorage.setItem('mfa_redirect_state', JSON.stringify(redirectState));
  sessionStorage.setItem('mfa_redirect_state', JSON.stringify(redirectState));
  
  // 3. Start MFA flow with redirect context
  try {
    await startMFAFlow({ redirectContext: redirectState });
  } catch (error) {
    // 4. Handle errors without losing redirect
    handleMFAError(error, redirectState);
  }
};

// ✅ CORRECT: Handle MFA completion with redirect
const handleMFACompletion = async (mfaResult: MFAResult) => {
  try {
    // 1. Retrieve saved redirect state
    const savedState = getRedirectState();
    
    // 2. Validate redirect URL
    if (isValidRedirectUrl(savedState?.url)) {
      // 3. Perform redirect
      window.location.href = savedState.url;
    } else {
      // 4. Fallback to default redirect
      window.location.href = '/dashboard';
    }
  } catch (error) {
    console.error('Redirect failed:', error);
    // 5. Ultimate fallback
    window.location.href = '/dashboard';
  }
};
```

### **Storage Strategy**

```typescript
// ✅ Multi-layer storage for reliability
const saveRedirectState = (state: RedirectState) => {
  try {
    // Primary storage (localStorage)
    localStorage.setItem('mfa_redirect_state', JSON.stringify(state));
    
    // Secondary storage (sessionStorage)
    sessionStorage.setItem('mfa_redirect_state', JSON.stringify(state));
    
    // Tertiary storage (memory)
    redirectStateMemory.set(state.flowId, state);
    
    // Expiration handling
    setTimeout(() => {
      cleanupExpiredState(state.flowId);
    }, 30 * 60 * 1000); // 30 minutes
  } catch (error) {
    console.error('Failed to save redirect state:', error);
  }
};

// ✅ Robust retrieval with fallbacks
const getRedirectState = (): RedirectState | null => {
  try {
    // Try localStorage first
    const localState = localStorage.getItem('mfa_redirect_state');
    if (localState) {
      const parsed = JSON.parse(localState);
      if (isValidRedirectState(parsed)) return parsed;
    }
    
    // Try sessionStorage
    const sessionState = sessionStorage.getItem('mfa_redirect_state');
    if (sessionState) {
      const parsed = JSON.parse(sessionState);
      if (isValidRedirectState(parsed)) return parsed;
    }
    
    // Try memory
    const memoryStates = Array.from(redirectStateMemory.values());
    const validMemoryState = memoryStates.find(isValidRedirectState);
    if (validMemoryState) return validMemoryState;
    
    return null;
  } catch (error) {
    console.error('Failed to retrieve redirect state:', error);
    return null;
  }
};
```

## 🚨 Common Redirect Failures & Solutions

### **1. Lost Redirect State**

**Problem**: User completes MFA but redirect state is lost

**Solution**:
```typescript
// ✅ Prevent state loss
const preventStateLoss = () => {
  // Save state before any navigation
  window.addEventListener('beforeunload', () => {
    const currentState = getCurrentRedirectState();
    if (currentState) {
      saveRedirectState(currentState);
    }
  });
  
  // Handle tab visibility changes
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      const currentState = getCurrentRedirectState();
      if (currentState) {
        saveRedirectState(currentState);
      }
    }
  });
};
```

### **2. Invalid Redirect URLs**

**Problem**: Redirect URL is malformed or inaccessible

**Solution**:
```typescript
// ✅ Validate redirect URLs
const isValidRedirectUrl = (url: string): boolean => {
  try {
    // Basic URL validation
    const parsed = new URL(url, window.location.origin);
    
    // Security checks
    if (parsed.origin !== window.location.origin) {
      console.warn('Cross-origin redirect detected:', url);
      return false;
    }
    
    // Accessibility check (optional)
    return isUrlAccessible(url);
  } catch (error) {
    console.error('Invalid redirect URL:', url, error);
    return false;
  }
};

// ✅ Fallback redirect strategy
const getSafeRedirectUrl = (intendedUrl?: string): string => {
  if (intendedUrl && isValidRedirectUrl(intendedUrl)) {
    return intendedUrl;
  }
  
  // Fallback hierarchy
  const fallbackUrls = [
    '/dashboard',
    '/home',
    '/profile',
    '/',
  ];
  
  for (const fallback of fallbackUrls) {
    if (isValidRedirectUrl(fallback)) {
      return fallback;
    }
  }
  
  // Ultimate fallback
  return window.location.origin;
};
```

### **3. MFA Flow Interruption**

**Problem**: MFA flow is interrupted, leaving user in limbo

**Solution**:
```typescript
// ✅ Flow recovery mechanism
const recoverMFAFlow = () => {
  const savedState = getRedirectState();
  
  if (savedState) {
    const age = Date.now() - savedState.timestamp;
    const maxAge = 30 * 60 * 1000; // 30 minutes
    
    if (age < maxAge) {
      // Resume flow
      resumeMFAFlow(savedState);
    } else {
      // State expired, start fresh
      cleanupExpiredState(savedState.flowId);
      startFreshMFAFlow();
    }
  } else {
    // No saved state, start fresh
    startFreshMFAFlow();
  }
};
```

## 🔄 MFA Flow State Machine

```typescript
// ✅ Comprehensive state management
type MFAFlowState = {
  id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'expired';
  redirectUrl?: string;
  startTime: number;
  lastActivity: number;
  error?: string;
  retryCount: number;
};

class MFAFlowManager {
  private flows = new Map<string, MFAFlowState>();
  
  startFlow(redirectUrl?: string): string {
    const flowId = generateFlowId();
    const flow: MFAFlowState = {
      id: flowId,
      status: 'pending',
      redirectUrl,
      startTime: Date.now(),
      lastActivity: Date.now(),
      retryCount: 0,
    };
    
    this.flows.set(flowId, flow);
    this.saveFlowState(flow);
    
    return flowId;
  }
  
  updateFlow(flowId: string, updates: Partial<MFAFlowState>) {
    const flow = this.flows.get(flowId);
    if (!flow) return;
    
    const updatedFlow = {
      ...flow,
      ...updates,
      lastActivity: Date.now(),
    };
    
    this.flows.set(flowId, updatedFlow);
    this.saveFlowState(updatedFlow);
  }
  
  completeFlow(flowId: string) {
    this.updateFlow(flowId, { status: 'completed' });
    this.performRedirect(flowId);
    this.cleanupFlow(flowId);
  }
  
  failFlow(flowId: string, error: string) {
    const flow = this.flows.get(flowId);
    if (!flow) return;
    
    const retryCount = flow.retryCount + 1;
    
    if (retryCount < 3) {
      // Retry the flow
      this.updateFlow(flowId, { 
        status: 'pending', 
        error,
        retryCount 
      });
      this.retryFlow(flowId);
    } else {
      // Max retries reached
      this.updateFlow(flowId, { 
        status: 'failed', 
        error 
      });
      this.handleFailedFlow(flowId);
    }
  }
  
  private performRedirect(flowId: string) {
    const flow = this.flows.get(flowId);
    if (!flow) return;
    
    const redirectUrl = getSafeRedirectUrl(flow.redirectUrl);
    window.location.href = redirectUrl;
  }
  
  private handleFailedFlow(flowId: string) {
    const flow = this.flows.get(flowId);
    if (!flow) return;
    
    // Show error message
    showErrorMessage(`MFA flow failed: ${flow.error}`);
    
    // Redirect to safe location
    setTimeout(() => {
      window.location.href = getSafeRedirectUrl();
    }, 3000);
    
    this.cleanupFlow(flowId);
  }
}
```

## 🛡️ Security Considerations

### **Redirect URL Validation**
```typescript
// ✅ Security-focused validation
const validateRedirectUrl = (url: string, allowedOrigins: string[]): boolean => {
  try {
    const parsed = new URL(url, window.location.origin);
    
    // Check origin
    if (!allowedOrigins.includes(parsed.origin)) {
      return false;
    }
    
    // Check protocol
    if (!['https:', 'http:'].includes(parsed.protocol)) {
      return false;
    }
    
    // Check for dangerous patterns
    const dangerousPatterns = [
      /javascript:/i,
      /data:/i,
      /vbscript:/i,
      /file:/i,
      /ftp:/i,
    ];
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(url)) {
        return false;
      }
    }
    
    return true;
  } catch (error) {
    return false;
  }
};
```

### **State Expiration**
```typescript
// ✅ Automatic cleanup
const cleanupExpiredStates = () => {
  const maxAge = 30 * 60 * 1000; // 30 minutes
  const now = Date.now();
  
  // Clean localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('mfa_')) {
      try {
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        if (data.timestamp && (now - data.timestamp) > maxAge) {
          localStorage.removeItem(key);
        }
      } catch (error) {
        // Remove corrupted data
        localStorage.removeItem(key);
      }
    }
  }
};

// Run cleanup periodically
setInterval(cleanupExpiredStates, 5 * 60 * 1000); // Every 5 minutes
```

## 📝 Testing Checklist

### **Before Deploying MFA Changes**
- [ ] Test complete MFA flow with valid redirect
- [ ] Test MFA flow with invalid redirect URL
- [ ] Test MFA flow interruption and recovery
- [ ] Test MFA flow with network failures
- [ ] Test MFA flow with browser refresh
- [ ] Test MFA flow with tab closing/reopening
- [ ] Test MFA flow with multiple tabs
- [ ] Test MFA flow state expiration
- [ ] Test redirect to different origins (should fail safely)
- [ ] Test redirect to malformed URLs (should fallback)

### **Automated Tests**
```typescript
// ✅ Example test cases
describe('MFA Redirect Handling', () => {
  test('should save and restore redirect state', async () => {
    const redirectUrl = '/dashboard';
    const flowId = mfaManager.startFlow(redirectUrl);
    
    const savedState = getRedirectState();
    expect(savedState?.redirectUrl).toBe(redirectUrl);
    expect(savedState?.flowId).toBe(flowId);
  });
  
  test('should handle invalid redirect URLs', async () => {
    const invalidUrls = [
      'javascript:alert("xss")',
      'data:text/html,<script>alert("xss")</script>',
      'ftp://example.com',
    ];
    
    for (const url of invalidUrls) {
      const safeUrl = getSafeRedirectUrl(url);
      expect(safeUrl).not.toBe(url);
      expect(safeUrl).toMatch(/^https?:\/\//);
    }
  });
  
  test('should recover from interrupted flows', async () => {
    const flowId = mfaManager.startFlow('/dashboard');
    
    // Simulate interruption
    mfaManager.updateFlow(flowId, { status: 'failed', error: 'Network error' });
    
    // Should retry automatically
    expect(mfaManager.getFlow(flowId)?.retryCount).toBe(1);
  });
});
```

## 🚀 Implementation Checklist

### **For New MFA Features**
- [ ] Implement redirect state saving before MFA starts
- [ ] Add multiple storage mechanisms (localStorage, sessionStorage, memory)
- [ ] Implement redirect URL validation
- [ ] Add fallback redirect strategies
- [ ] Implement flow recovery mechanisms
- [ ] Add error handling with user-friendly messages
- [ ] Implement automatic state cleanup
- [ ] Add comprehensive logging
- [ ] Write tests for all scenarios
- [ ] Document the flow

### **For Existing MFA Features**
- [ ] Audit current redirect handling
- [ ] Add missing state persistence
- [ ] Improve error handling
- [ ] Add fallback mechanisms
- [ ] Update tests
- [ ] Update documentation

## 📚 References

- [PingOne MFA Documentation](https://docs.pingidentity.com/pingone/p1_cloud__platform_main_landing_page.html)
- [OAuth 2.0 Security Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
- [Browser Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Storage)

---

**Last Updated**: 2026-02-15  
**Version**: 1.0.0  
**Maintainer**: OAuth Playground Team

## 🔄 Maintenance

- Review and update this document quarterly
- Add new patterns and anti-patterns as they're discovered
- Update testing checklist based on new requirements
- Monitor MFA redirect failures and update guidance accordingly
