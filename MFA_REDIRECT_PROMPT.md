# 🚀 MFA Redirect Implementation Prompt

## Quick Reference for Developers

### ⚡ Before You Start MFA Implementation

**Ask yourself these questions:**
1. Where will the user go after MFA completes?
2. What happens if the MFA flow fails?
3. What happens if the user refreshes during MFA?
4. What happens if the network connection drops?
5. How will we recover from interruptions?

### 🎯 Essential Implementation Pattern

```typescript
// ✅ ALWAYS follow this pattern for MFA redirects
const handleMFAWithRedirect = async (redirectUrl: string) => {
  // 1. SAVE STATE FIRST
  const redirectState = {
    url: redirectUrl,
    timestamp: Date.now(),
    flowId: generateFlowId(),
  };
  
  // 2. PERSIST TO MULTIPLE STORAGE
  localStorage.setItem('mfa_redirect_state', JSON.stringify(redirectState));
  sessionStorage.setItem('mfa_redirect_state', JSON.stringify(redirectState));
  
  // 3. START MFA WITH ERROR HANDLING
  try {
    await startMFAFlow({ redirectContext: redirectState });
  } catch (error) {
    // 4. NEVER LOSE THE REDIRECT
    handleMFAError(error, redirectState);
  }
};

// ✅ ALWAYS handle completion safely
const handleMFACompletion = async () => {
  try {
    const savedState = getRedirectState();
    const safeUrl = getSafeRedirectUrl(savedState?.url);
    window.location.href = safeUrl;
  } catch (error) {
    // 5. ULTIMATE FALLBACK
    window.location.href = '/dashboard';
  }
};
```

### 🚨 Common Mistakes to Avoid

```typescript
// ❌ NEVER do this - redirect state can be lost
const badMFAImplementation = async (redirectUrl: string) => {
  // No state saved!
  await startMFAFlow();
  // If MFA fails or user refreshes, redirectUrl is lost forever!
  window.location.href = redirectUrl;
};

// ❌ NEVER do this - no fallback
const noFallbackImplementation = async () => {
  const redirectUrl = localStorage.getItem('redirect_url');
  // What if redirectUrl is null or invalid?
  window.location.href = redirectUrl; // CRASH!
};

// ❌ NEVER do this - single point of failure
const singleStorageImplementation = async (redirectUrl: string) => {
  // Only localStorage - can be cleared by user/browser
  localStorage.setItem('redirect_url', redirectUrl);
  await startMFAFlow();
  // If localStorage is cleared, redirect is lost!
};
```

### ✅ Required Functions (Copy-Paste Ready)

```typescript
// ✅ Redirect state management
const saveRedirectState = (state: RedirectState) => {
  try {
    localStorage.setItem('mfa_redirect_state', JSON.stringify(state));
    sessionStorage.setItem('mfa_redirect_state', JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save redirect state:', error);
  }
};

const getRedirectState = (): RedirectState | null => {
  try {
    const localState = localStorage.getItem('mfa_redirect_state');
    if (localState) return JSON.parse(localState);
    
    const sessionState = sessionStorage.getItem('mfa_redirect_state');
    if (sessionState) return JSON.parse(sessionState);
    
    return null;
  } catch (error) {
    console.error('Failed to get redirect state:', error);
    return null;
  }
};

// ✅ Safe redirect validation
const getSafeRedirectUrl = (intendedUrl?: string): string => {
  const fallbackUrls = ['/dashboard', '/home', '/profile', '/'];
  
  if (intendedUrl && isValidRedirectUrl(intendedUrl)) {
    return intendedUrl;
  }
  
  for (const fallback of fallbackUrls) {
    if (isValidRedirectUrl(fallback)) {
      return fallback;
    }
  }
  
  return window.location.origin;
};

const isValidRedirectUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.origin === window.location.origin;
  } catch (error) {
    return false;
  }
};
```

### 🔄 Testing Checklist (Copy-Paste Ready)

```typescript
// ✅ Test these scenarios before deploying
describe('MFA Redirect Safety', () => {
  test('redirect state survives page refresh', async () => {
    // Save state, simulate refresh, verify state exists
  });
  
  test('invalid redirect URLs fallback safely', async () => {
    // Test javascript:, data:, ftp:, etc.
  });
  
  test('network failures dont lose redirect', async () => {
    // Simulate network error, verify redirect still works
  });
  
  test('MFA interruption recovery works', async () => {
    // Start MFA, interrupt, verify flow can resume
  });
  
  test('multiple tabs dont conflict', async () => {
    // Test concurrent MFA flows
  });
  
  test('expired states are cleaned up', async () => {
    // Test old redirect states are removed
  });
});
```

### 📋 Implementation Checklist

**Before PR:**
- [ ] Redirect state saved before MFA starts
- [ ] Multiple storage mechanisms implemented
- [ ] Redirect URL validation added
- [ ] Fallback redirect strategies in place
- [ ] Error handling doesn't lose redirect
- [ ] Tests cover all failure scenarios
- [ ] Documentation updated

**After Deploy:**
- [ ] Monitor redirect failures in logs
- [ ] Check for user complaints about lost redirects
- [ ] Verify error rates are acceptable
- [ ] Update documentation based on issues found

### 🚨 Emergency Response

If users report "stuck in MFA" or "redirect not working":

1. **Immediate Check**: Are redirect states being saved?
2. **Quick Fix**: Add more robust fallback URLs
3. **Long-term**: Review this checklist and improve implementation

### 📞 Get Help

- **Documentation**: `MFA_REDIRECT_BEST_PRACTICES.md`
- **Examples**: Look at existing working MFA flows
- **Testing**: Use the provided test patterns
- **Security**: Always validate redirect URLs

---

**Remember**: The goal is that MFA redirects NEVER fail, even in worst-case scenarios.
