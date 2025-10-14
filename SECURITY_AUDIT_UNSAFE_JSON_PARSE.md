# Security Audit: Unsafe JSON.parse() Usage Across All Flows

## Date: October 11, 2025

## Executive Summary

🚨 **CRITICAL SECURITY ISSUE DISCOVERED**

While fixing the Hybrid Flow security vulnerability, we discovered **widespread unsafe `JSON.parse()` usage** across multiple flow controllers.

**Total Findings:** 15 instances of `JSON.parse()` across 8 controller files

**Risk Level by Category:**
- 🔴 **HIGH RISK (Storage Parsing):** 11 instances - Vulnerable to XSS, prototype pollution, DoS
- 🟡 **MEDIUM RISK (JWT Decoding):** 4 instances - Should use safe parsing for consistency
- 🟢 **LOW RISK (API Error Parsing):** 2 instances - Already in try/catch, but should improve

---

## Detailed Findings

### 🔴 HIGH RISK - Storage Parsing (11 instances)

These parse untrusted data from localStorage/sessionStorage and are vulnerable to:
- XSS injection
- Prototype pollution attacks
- Denial of Service (large payloads)
- Component crashes on malformed data

#### 1. useClientCredentialsFlowController.ts (3 instances)

**Lines 524-525: localStorage step results**
```typescript
// ❌ UNSAFE
const stepResults = JSON.parse(localStorage.getItem(`${persistKey}-step-results`) || '{}');
```

**Line 533: localStorage step check**
```typescript
// ❌ UNSAFE
const stepResults = JSON.parse(localStorage.getItem(`${persistKey}-step-results`) || '{}');
```

**Fix:**
```typescript
// ✅ SAFE
const stepResults = safeLocalStorageParse<Record<string, unknown>>(
    `${persistKey}-step-results`,
    {}
);
```

#### 2. useImplicitFlowController.ts (1 instance)

**Line 131: sessionStorage flow config**
```typescript
// ❌ UNSAFE
const stored = sessionStorage.getItem(storageKey);
if (stored) {
    const config = JSON.parse(stored);
}
```

**Fix:**
```typescript
// ✅ SAFE
const config = safeSessionStorageParse<FlowConfig>(
    storageKey,
    getDefaultConfig()
);
```

#### 3. useAuthorizationCodeFlowController.ts (2 instances)

**Line 231: sessionStorage PKCE codes**
```typescript
// ❌ UNSAFE
const stored = sessionStorage.getItem(pkceStorageKey);
if (stored) {
    try {
        const parsed = JSON.parse(stored);
    }
}
```

**Line 494: sessionStorage PingOne config**
```typescript
// ❌ UNSAFE
const storedConfig = sessionStorage.getItem(configKey);
if (storedConfig) {
    pingOneConfig = JSON.parse(storedConfig);
}
```

**Fix:**
```typescript
// ✅ SAFE
const parsed = safeSessionStorageParse<PKCECodes>(pkceStorageKey, null);
const pingOneConfig = safeSessionStorageParse<PingOneConfig>(configKey, null);
```

#### 4. useResourceOwnerPasswordFlowV5.ts (1 instance)

**Line 431: sessionStorage credentials**
```typescript
// ❌ UNSAFE
const sessionCredentials = sessionStorage.getItem('resource-owner-password-v5-credentials');
if (sessionCredentials) {
    const parsed = JSON.parse(sessionCredentials);
}
```

**Fix:**
```typescript
// ✅ SAFE
const parsed = safeSessionStorageParse<Credentials>(
    'resource-owner-password-v5-credentials',
    null
);
```

#### 5. useResourceOwnerPasswordFlowController.ts (1 instance)

**Line 49: sessionStorage credentials**
```typescript
// ❌ UNSAFE
const saved = sessionStorage.getItem('resource-owner-password-v5-credentials');
if (saved) {
    const parsed = JSON.parse(saved);
}
```

**Fix:**
```typescript
// ✅ SAFE
const parsed = safeSessionStorageParse<Credentials>(
    'resource-owner-password-v5-credentials',
    null
);
```

#### 6. useDeviceAuthorizationFlow.ts (1 instance)

**Line 118: localStorage credentials**
```typescript
// ❌ UNSAFE
const savedCreds = localStorage.getItem('device_flow_credentials');
if (savedCreds) {
    const creds = JSON.parse(savedCreds);
}
```

**Fix:**
```typescript
// ✅ SAFE
const creds = safeLocalStorageParse<Credentials>(
    'device_flow_credentials',
    null
);
```

#### 7. useMockOIDCResourceOwnerPasswordController.ts (1 instance)

**Line 287: sessionStorage credentials**
```typescript
// ❌ UNSAFE
const savedCredentials = sessionStorage.getItem('mock-oidc-rop-credentials');
if (savedCredentials) {
    try {
        const parsed = JSON.parse(savedCredentials);
    }
}
```

**Fix:**
```typescript
// ✅ SAFE
const parsed = safeSessionStorageParse<Credentials>(
    'mock-oidc-rop-credentials',
    null
);
```

---

### 🟡 MEDIUM RISK - JWT Decoding (4 instances)

These decode Base64-encoded JWT tokens. While less critical (JWT structure is predictable), they should still use safe parsing for consistency.

#### 8. useClientCredentialsFlowController.ts (2 instances)

**Lines 176-177: JWT header and payload**
```typescript
// ⚠️ POTENTIALLY UNSAFE
const header = JSON.parse(base64UrlDecode(parts[0]));
const payload = JSON.parse(base64UrlDecode(parts[1]));
```

**Risk:** JWT tokens can be crafted with malicious payloads

**Fix:**
```typescript
// ✅ SAFE
const header = safeJsonParse<JWTHeader>(base64UrlDecode(parts[0]));
const payload = safeJsonParse<JWTPayload>(base64UrlDecode(parts[1]));
if (!header || !payload) return null;
```

#### 9. useClientCredentialsFlow.ts (2 instances)

**Lines 110-111: JWT header and payload**
```typescript
// ⚠️ POTENTIALLY UNSAFE
const header = JSON.parse(base64UrlDecode(parts[0]));
const payload = JSON.parse(base64UrlDecode(parts[1]));
```

**Fix:** Same as above

---

### 🟢 LOW RISK - API Error Parsing (2 instances)

These parse API error responses and are already in try/catch blocks. Lower risk but should still improve.

#### 10. useAuthorizationCodeFlowController.ts (1 instance)

**Line 875: Parse API error response**
```typescript
try {
    const errorJson = JSON.parse(errorText);
    if (errorJson.error === 'invalid_grant') {
        // ...
    }
}
```

**Status:** Already in try/catch, but should use `safeJsonParse` for consistency

#### 11. useDeviceAuthorizationFlow.ts (1 instance)

**Line 208: Parse API error response**
```typescript
try {
    errorData = JSON.parse(errorText);
} catch {
    errorData = { message: errorText };
}
```

**Status:** Already has fallback, but should use `safeJsonParse` for consistency

---

## Summary by File

| File | HIGH | MEDIUM | LOW | Total |
|------|------|--------|-----|-------|
| useClientCredentialsFlowController.ts | 3 | 2 | 0 | 5 |
| useAuthorizationCodeFlowController.ts | 2 | 0 | 1 | 3 |
| useClientCredentialsFlow.ts | 0 | 2 | 0 | 2 |
| useDeviceAuthorizationFlow.ts | 1 | 0 | 1 | 2 |
| useImplicitFlowController.ts | 1 | 0 | 0 | 1 |
| useResourceOwnerPasswordFlowV5.ts | 1 | 0 | 0 | 1 |
| useResourceOwnerPasswordFlowController.ts | 1 | 0 | 0 | 1 |
| useMockOIDCResourceOwnerPasswordController.ts | 1 | 0 | 0 | 1 |
| **TOTAL** | **11** | **4** | **2** | **17** |

---

## Attack Scenarios

### Scenario 1: XSS via localStorage
```javascript
// Attacker injects malicious data into localStorage
localStorage.setItem('client-credentials-v6-step-results', 
    '{"step1":"<script>alert(document.cookie)</script>"}');

// Application parses without validation
const stepResults = JSON.parse(localStorage.getItem('...')); // ❌ Unsafe
// XSS payload could execute if rendered
```

### Scenario 2: Prototype Pollution
```javascript
// Attacker injects prototype pollution
sessionStorage.setItem('oauth-v6-pkce-codes',
    '{"__proto__":{"isAdmin":true}}');

// Application parses without validation
const pkce = JSON.parse(sessionStorage.getItem('...')); // ❌ Unsafe
// All objects now have isAdmin = true
```

### Scenario 3: Denial of Service
```javascript
// Attacker stores massive JSON string
const huge = '{"data":"' + 'x'.repeat(10000000) + '"}';
localStorage.setItem('device_flow_credentials', huge);

// Application attempts to parse
const creds = JSON.parse(localStorage.getItem('...')); // ❌ Browser freezes
```

---

## Recommended Fix Priority

### Phase 1: Immediate (HIGH RISK - Storage Parsing)
**Priority:** 🔴 CRITICAL
**Timeline:** Fix immediately

1. ✅ useHybridFlowController.ts (ALREADY FIXED)
2. ❌ useClientCredentialsFlowController.ts (3 instances)
3. ❌ useImplicitFlowController.ts (1 instance)
4. ❌ useAuthorizationCodeFlowController.ts (2 instances)
5. ❌ useResourceOwnerPasswordFlowV5.ts (1 instance)
6. ❌ useResourceOwnerPasswordFlowController.ts (1 instance)
7. ❌ useDeviceAuthorizationFlow.ts (1 instance)
8. ❌ useMockOIDCResourceOwnerPasswordController.ts (1 instance)

**Total to fix:** 11 instances across 7 files

### Phase 2: Important (MEDIUM RISK - JWT Decoding)
**Priority:** 🟡 HIGH
**Timeline:** Fix within 24 hours

1. ❌ useClientCredentialsFlowController.ts (2 instances)
2. ❌ useClientCredentialsFlow.ts (2 instances)

**Total to fix:** 4 instances across 2 files

### Phase 3: Improvement (LOW RISK - API Errors)
**Priority:** 🟢 MEDIUM
**Timeline:** Fix within 1 week

1. ❌ useAuthorizationCodeFlowController.ts (1 instance)
2. ❌ useDeviceAuthorizationFlow.ts (1 instance)

**Total to fix:** 2 instances across 2 files

---

## Required Imports for Each File

### Files needing `safeLocalStorageParse`:
```typescript
import { safeLocalStorageParse } from '../utils/secureJson';
```
- useClientCredentialsFlowController.ts
- useDeviceAuthorizationFlow.ts

### Files needing `safeSessionStorageParse`:
```typescript
import { safeSessionStorageParse } from '../utils/secureJson';
```
- useImplicitFlowController.ts
- useAuthorizationCodeFlowController.ts
- useResourceOwnerPasswordFlowV5.ts
- useResourceOwnerPasswordFlowController.ts
- useMockOIDCResourceOwnerPasswordController.ts

### Files needing `safeJsonParse`:
```typescript
import { safeJsonParse } from '../utils/secureJson';
```
- useClientCredentialsFlowController.ts (JWT decoding)
- useClientCredentialsFlow.ts (JWT decoding)
- useAuthorizationCodeFlowController.ts (API errors)
- useDeviceAuthorizationFlow.ts (API errors)

---

## Testing Strategy

### 1. Functional Testing
For each fixed file:
- ✅ Verify flow loads correctly
- ✅ Verify credentials save/load
- ✅ Verify no errors in console
- ✅ Verify linter passes

### 2. Security Testing
Test with malicious data:
```javascript
// XSS Test
sessionStorage.setItem('test-key', '{"data":"<script>alert(1)</script>"}');

// Prototype Pollution Test
sessionStorage.setItem('test-key', '{"__proto__":{"polluted":true}}');

// DoS Test
sessionStorage.setItem('test-key', '{"data":"' + 'x'.repeat(1000000) + '"}');

// Malformed JSON Test
sessionStorage.setItem('test-key', '{invalid json');
```

Expected results:
- ✅ `safeJsonParse` returns `null` or default value
- ✅ No XSS execution
- ✅ No prototype pollution
- ✅ No browser freeze
- ✅ Graceful error handling

---

## Implementation Checklist

### Preparation
- [ ] Review all 17 instances identified
- [ ] Prepare fix patches for each file
- [ ] Set up test environment

### Phase 1: HIGH RISK (Storage Parsing)
- [ ] Fix useClientCredentialsFlowController.ts (3 instances)
- [ ] Fix useImplicitFlowController.ts (1 instance)
- [ ] Fix useAuthorizationCodeFlowController.ts (2 instances)
- [ ] Fix useResourceOwnerPasswordFlowV5.ts (1 instance)
- [ ] Fix useResourceOwnerPasswordFlowController.ts (1 instance)
- [ ] Fix useDeviceAuthorizationFlow.ts (1 instance)
- [ ] Fix useMockOIDCResourceOwnerPasswordController.ts (1 instance)
- [ ] Test all 7 files
- [ ] Verify no linter errors
- [ ] Verify all flows work

### Phase 2: MEDIUM RISK (JWT Decoding)
- [ ] Fix useClientCredentialsFlowController.ts (2 instances)
- [ ] Fix useClientCredentialsFlow.ts (2 instances)
- [ ] Test JWT decoding with malicious payloads
- [ ] Verify token validation still works

### Phase 3: LOW RISK (API Errors)
- [ ] Improve useAuthorizationCodeFlowController.ts (1 instance)
- [ ] Improve useDeviceAuthorizationFlow.ts (1 instance)
- [ ] Test error handling

### Documentation
- [ ] Update SECURITY.md with secure coding guidelines
- [ ] Document safe parsing utilities
- [ ] Add code review checklist
- [ ] Create security testing guide

---

## Lessons Learned

### Why This Happened

1. **Inconsistent Patterns**
   - Some controllers used safe parsing, others didn't
   - No enforced coding standards for storage parsing

2. **Legacy Code**
   - Older controllers used direct `JSON.parse()`
   - Migration didn't include security audit

3. **Lack of Tooling**
   - No linter rules for unsafe JSON.parse
   - No automated security scanning

4. **Documentation Gap**
   - Security utilities exist but weren't well-documented
   - No clear guidance on when to use them

### Prevention Strategies

1. **Code Review Checklist**
   - ✅ No direct `JSON.parse()` for storage or user input
   - ✅ All storage parsing uses safe utilities
   - ✅ All JWT decoding uses safe utilities
   - ✅ API responses use safe parsing

2. **Linter Rules**
   ```javascript
   // Add to ESLint config
   {
     "rules": {
       "no-restricted-syntax": [
         "error",
         {
           "selector": "CallExpression[callee.object.name='JSON'][callee.property.name='parse']",
           "message": "Use safeJsonParse instead of JSON.parse for security"
         }
       ]
     }
   }
   ```

3. **Documentation**
   - Document security utilities prominently
   - Add examples to CONTRIBUTING.md
   - Create security best practices guide

4. **Automated Testing**
   - Add security tests to CI/CD pipeline
   - Test with malicious payloads
   - Verify prototype pollution prevention

---

## Next Steps

1. **Immediate:** Fix Phase 1 (11 HIGH RISK instances)
2. **Today:** Fix Phase 2 (4 MEDIUM RISK instances)
3. **This Week:** Fix Phase 3 (2 LOW RISK instances)
4. **This Month:** Implement prevention strategies

**Estimated Time:**
- Phase 1: 2-3 hours
- Phase 2: 1 hour
- Phase 3: 30 minutes
- Testing: 1 hour
- Documentation: 1 hour
- **Total:** ~5-6 hours

---

## Conclusion

This audit revealed a **systemic security issue** affecting 8 out of ~15 flow controllers in the codebase. While discovered during a routine verification, this represents a significant vulnerability that needs immediate attention.

**Impact:**
- 🔴 11 HIGH RISK vulnerabilities (storage parsing)
- 🟡 4 MEDIUM RISK issues (JWT decoding)
- 🟢 2 LOW RISK issues (API error handling)

**Action Required:**
Immediate fix of all HIGH RISK instances, followed by systematic improvement of all JSON parsing in the codebase.

**Positive Note:**
The security utilities (`safeJsonParse`, `safeLocalStorageParse`, `safeSessionStorageParse`) already exist and are well-designed. We just need to use them consistently across all controllers.




