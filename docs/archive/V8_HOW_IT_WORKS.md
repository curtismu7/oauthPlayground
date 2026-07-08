# V8: How It Works - Complete Visual Guide

**Date:** 2024-11-16  
**Purpose:** Show how validation, education, and step navigation work together

---

## 🎯 The Big Picture

```
User opens Authorization Code V8 flow
         ↓
    [Step 0: Configure Credentials]
         ↓
    Validation Service checks fields
         ↓
    ❌ Missing fields → Next button DISABLED
    ✅ All valid → Next button ENABLED
         ↓
    User clicks Next
         ↓
    [Step 1: Generate Auth URL]
         ↓
    ... and so on
```

---

## 1️⃣ Validation Service: How It Works

### Example: Step 0 Validation

**User fills in credentials:**
```typescript
const credentials = {
  environmentId: '12345678-1234-1234-1234-123456789012',
  clientId: 'my-client-id',
  redirectUri: 'http://localhost:3000/callback',
  scopes: 'openid profile email'
};
```

**Validation service checks:**
```typescript
const result = ValidationService.validateCredentials(credentials, 'oidc');

// Result:
{
  valid: true,
  canProceed: true,
  errors: [],
  warnings: []
}
```

**Next button enables!** ✅

---

### Example: Missing Fields

**User has incomplete credentials:**
```typescript
const credentials = {
  environmentId: '12345678-1234-1234-1234-123456789012',
  // Missing clientId
  // Missing redirectUri
  scopes: 'openid profile'
};
```

**Validation service checks:**
```typescript
const result = ValidationService.validateCredentials(credentials, 'oidc');

// Result:
{
  valid: false,
  canProceed: false,
  errors: [
    {
      field: 'clientId',
      message: 'Client ID is required',
      code: 'REQUIRED_FIELD_MISSING'
    },
    {
      field: 'redirectUri',
      message: 'Redirect URI is required',
      code: 'REQUIRED_FIELD_MISSING'
    }
  ],
  warnings: []
}
```

**Next button stays disabled!** ❌

**User hovers over disabled button:**
```
┌─────────────────────────────────┐
│ Cannot proceed                  │
│                                 │
│ Missing required fields:        │
│ • Client ID is required         │
│ • Redirect URI is required      │
└─────────────────────────────────┘
```

---

### Example: Invalid Format

**User enters invalid UUID:**
```typescript
const credentials = {
  environmentId: 'not-a-uuid',  // ❌ Invalid format
  clientId: 'my-client-id',
  redirectUri: 'http://localhost:3000/callback',
  scopes: 'openid profile'
};
```

**Validation service checks:**
```typescript
const result = ValidationService.validateCredentials(credentials, 'oidc');

// Result:
{
  valid: false,
  canProceed: false,
  errors: [
    {
      field: 'environmentId',
      message: 'Must be a valid UUID (36 characters with dashes)',
      suggestion: 'Format: 12345678-1234-1234-1234-123456789012',
      code: 'INVALID_FORMAT'
    }
  ],
  warnings: []
}
```

**UI shows error:**
```
┌─────────────────────────────────────────┐
│ Environment ID: [not-a-uuid____] ⚠️    │
│                                         │
│ ⚠️ Must be a valid UUID                │
│ Format: 12345678-1234-1234-1234-...    │
└─────────────────────────────────────────┘
```

---

### Example: OIDC Scope Validation

**User forgets 'openid' scope:**
```typescript
const credentials = {
  environmentId: '12345678-1234-1234-1234-123456789012',
  clientId: 'my-client-id',
  redirectUri: 'http://localhost:3000/callback',
  scopes: 'profile email'  // ❌ Missing 'openid'
};
```

**Validation service checks:**
```typescript
const result = ValidationService.validateCredentials(credentials, 'oidc');

// Result:
{
  valid: false,
  canProceed: false,
  errors: [
    {
      field: 'scopes',
      message: 'OIDC flows require the "openid" scope',
      suggestion: 'Add "openid" to your scopes',
      code: 'OPENID_SCOPE_REQUIRED'
    }
  ],
  warnings: []
}
```

**UI shows error:**
```
┌─────────────────────────────────────────┐
│ Scopes: [profile email_________] ⚠️    │
│                                         │
│ ⚠️ OIDC flows require "openid" scope   │
│ → Add "openid" to your scopes          │
└─────────────────────────────────────────┘
```

---

### Example: Security Warnings

**User uses HTTP for non-localhost:**
```typescript
const credentials = {
  environmentId: '12345678-1234-1234-1234-123456789012',
  clientId: 'my-client-id',
  redirectUri: 'http://example.com/callback',  // ⚠️ HTTP
  scopes: 'openid profile'
};
```

**Validation service checks:**
```typescript
const result = ValidationService.validateCredentials(credentials, 'oidc');

// Result:
{
  valid: true,
  canProceed: true,  // Can proceed, but with warning
  errors: [],
  warnings: [
    {
      field: 'redirectUri',
      message: 'Using HTTP (not HTTPS) for non-localhost URLs is insecure',
      canProceed: true,
      severity: 'high'
    }
  ]
}
```

**UI shows warning (but allows proceed):**
```
┌─────────────────────────────────────────┐
│ Redirect URI: [http://example.com...] │
│                                         │
│ ⚠️ Using HTTP is insecure              │
│ Consider using HTTPS for production    │
│                                         │
│ [Next Step ▶] (enabled, but warned)   │
└─────────────────────────────────────────┘
```

---

## 2️⃣ Education Service: Tooltips Everywhere

### Example: Client ID Tooltip

**User hovers over ℹ️ icon:**
```tsx
<EducationTooltip contentKey="credential.clientId">
  <Label>Client ID</Label>
</EducationTooltip>
```

**Tooltip appears:**
```
┌─────────────────────────────────┐
│ 🔑 Client ID                    │
│                                 │
│ Public identifier for your      │
│ application. This is safe to    │
│ include in client-side code.    │
│                                 │
│ [Learn more →]                  │
└─────────────────────────────────┘
```

**Behind the scenes:**
```typescript
const tooltip = EducationService.getTooltip('credential.clientId');

// Returns:
{
  title: 'Client ID',
  description: 'Public identifier for your application. This is safe to include in client-side code.',
  icon: '🔑',
  learnMoreUrl: '/docs/setup/client-credentials'
}
```

---

### Example: offline_access Scope

**User hovers over offline_access checkbox:**
```tsx
<EducationTooltip 
  contentKey="scope.offline_access"
  expandable={true}
>
  <Checkbox>offline_access</Checkbox>
</EducationTooltip>
```

**Tooltip appears:**
```
┌─────────────────────────────────────────┐
│ 🔄 Offline Access (Refresh Token)      │
│                                         │
│ Requests a refresh token for long-     │
│ lived access without re-authentication. │
│ Essential for background sync.          │
│                                         │
│ [Learn more →]                          │
└─────────────────────────────────────────┘
```

**User clicks "Learn more":**
```
┌─────────────────────────────────────────────────────┐
│ Understanding offline_access Scope             [×]  │
├─────────────────────────────────────────────────────┤
│                                                      │
│ The offline_access scope requests a refresh token   │
│ for long-lived access without re-authentication.    │
│                                                      │
│ This is essential for:                              │
│ • Background synchronization when user is offline   │
│ • Long-running sessions that outlast access tokens  │
│ • Mobile applications that need persistent access   │
│ • Offline access to user data                       │
│                                                      │
│ Security Considerations:                             │
│ Refresh tokens are long-lived credentials (can      │
│ last months or years). They must be:                │
│ • Stored securely (never in localStorage)           │
│ • Transmitted only over HTTPS                       │
│ • Never exposed in client-side code or logs         │
│ • Rotated regularly for security                    │
│                                                      │
│ Example:                                             │
│ ┌──────────────────────────────────────────────┐   │
│ │ scopes: "openid profile email offline_access"│   │
│ └──────────────────────────────────────────────┘   │
│                                                      │
│ Code Example:                                        │
│ ┌──────────────────────────────────────────────┐   │
│ │ // Request with offline_access               │   │
│ │ const authUrl = buildAuthUrl({               │   │
│ │   scopes: 'openid profile offline_access',   │   │
│ │   // ... other params                        │   │
│ │ });                                          │   │
│ │                                              │   │
│ │ // Later, use refresh token                  │   │
│ │ const newTokens = await refreshAccessToken(  │   │
│ │   refreshToken                               │   │
│ │ );                                           │   │
│ └──────────────────────────────────────────────┘   │
│                                                      │
│ Related Topics:                                      │
│ • Refresh Tokens                                     │
│ • Access Tokens                                      │
│ • Token Expiry                                       │
│                                                      │
│                                        [Close]      │
└─────────────────────────────────────────────────────┘
```

**Behind the scenes:**
```typescript
const explanation = EducationService.getExplanation('offline_access');

// Returns:
{
  title: 'Understanding offline_access Scope',
  summary: 'The offline_access scope requests a refresh token...',
  details: 'When you request the offline_access scope...',
  example: 'scopes: "openid profile email offline_access"',
  codeSnippet: '// Request with offline_access\nconst authUrl = ...',
  learnMoreUrl: '/docs/tokens/refresh-tokens',
  relatedTopics: ['token.refresh', 'token.access', 'scope.openid']
}
```

---

### Example: Quick Start Presets

**User clicks "Quick Start" button:**
```typescript
const presets = EducationService.getAvailablePresets('oidc');
```

**Modal shows presets:**
```
┌─────────────────────────────────────────────────────┐
│ Quick Start                                    [×]  │
├─────────────────────────────────────────────────────┤
│                                                      │
│ Choose a preset to get started quickly:             │
│                                                      │
│ ┌──────────────────────────────────────────────┐   │
│ │ 🔐 PingOne OIDC                              │   │
│ │ Standard OpenID Connect flow with PingOne    │   │
│ │ Scopes: openid, profile, email               │   │
│ │                                    [Select]  │   │
│ └──────────────────────────────────────────────┘   │
│                                                      │
│ ┌──────────────────────────────────────────────┐   │
│ │ 🔄 PingOne OAuth with Refresh Token          │   │
│ │ OAuth 2.0 flow with refresh token support    │   │
│ │ Scopes: openid, profile, email, offline_...  │   │
│ │                                    [Select]  │   │
│ └──────────────────────────────────────────────┘   │
│                                                      │
│ ┌──────────────────────────────────────────────┐   │
│ │ 📱 SPA / Public Client                       │   │
│ │ For single-page apps without client secret   │   │
│ │ Scopes: openid, profile, email               │   │
│ │                                    [Select]  │   │
│ └──────────────────────────────────────────────┘   │
│                                                      │
│ [Skip - Configure Manually]                         │
└─────────────────────────────────────────────────────┘
```

**User selects "PingOne OIDC":**
```typescript
const preset = EducationService.getQuickStartPreset('pingone-oidc');

// Returns:
{
  id: 'pingone-oidc',
  name: 'PingOne OIDC',
  description: 'Standard OpenID Connect flow with PingOne',
  icon: '🔐',
  config: {
    issuer: 'https://auth.pingone.com/{environmentId}',
    responseType: 'code',
    grantType: 'authorization_code',
    clientAuthMethod: 'client_secret_post',
    usePkce: true,
    redirectUri: 'http://localhost:3000/authz-callback'
  },
  scopes: ['openid', 'profile', 'email'],
  flowType: 'oidc',
  tags: ['pingone', 'oidc', 'recommended']
}
```

**Form auto-fills with preset values!** ✨

---

## 3️⃣ Step Navigation: How It All Comes Together

### Complete Flow Example

**Step 0: Configure Credentials (Empty)**

```
┌─────────────────────────────────────────────────────────────┐
│ OAuth Authorization Code Flow                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Progress: ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0% (0 of 4) │
│                                                              │
│ ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐ │
│ │ ▶ Step 0 │───│   Step 1 │───│   Step 2 │───│   Step 3 │ │
│ │ Config   │   │ Auth URL │   │ Callback │   │  Tokens  │ │
│ └──────────┘   └──────────┘   └──────────┘   └──────────┘ │
│   Active         Locked         Locked         Locked      │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ Step 0: Configure Credentials                          │ │
│ │                                                         │ │
│ │ Environment ID: [_____________________________] ℹ️     │ │
│ │                 ↑ Hover shows tooltip                  │ │
│ │                                                         │ │
│ │ Client ID:      [_____________________________] ℹ️     │ │
│ │                                                         │ │
│ │ Redirect URI:   [_____________________________] ℹ️     │ │
│ │                                                         │ │
│ │ Scopes:         ☐ openid ℹ️                           │ │
│ │                 ☐ profile ℹ️                          │ │
│ │                 ☐ email ℹ️                            │ │
│ │                 ☐ offline_access ℹ️                   │ │
│ │                                                         │ │
│ │ [⚡ Quick Start]                                       │ │
│ │                                                         │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│ ⚠️ Complete all required fields before proceeding           │
│                                                              │
│ [◀ Previous]                    [Next Step ▶] (DISABLED)   │
│  (disabled)                      ↑                          │
│                                  │                          │
│                    Hover shows: "Missing required fields:  │
│                                  • Environment ID          │
│                                  • Client ID               │
│                                  • Redirect URI            │
│                                  • Scopes"                 │
└─────────────────────────────────────────────────────────────┘
```

**Behind the scenes:**
```typescript
// Component validates on every change
const validation = ValidationService.validateCredentials(
  credentials,
  'oidc'
);

// Result:
{
  valid: false,
  canProceed: false,
  errors: [
    { field: 'environmentId', message: 'Environment ID is required' },
    { field: 'clientId', message: 'Client ID is required' },
    { field: 'redirectUri', message: 'Redirect URI is required' },
    { field: 'scopes', message: 'At least one scope is required' }
  ]
}

// Next button disabled
<button disabled={!validation.canProceed}>
  Next Step ▶
</button>
```

---

**User clicks "Quick Start" → Selects "PingOne OIDC"**

```
┌─────────────────────────────────────────────────────────────┐
│ Step 0: Configure Credentials                               │
│                                                              │
│ Environment ID: [12345678-1234-1234-1234-...] ✓ ℹ️         │
│                 ↑ Auto-filled from preset                   │
│                                                              │
│ Client ID:      [my-client-id_______________] ✓ ℹ️         │
│                 ↑ User enters their client ID               │
│                                                              │
│ Redirect URI:   [http://localhost:3000/callback] ✓ ℹ️      │
│                 ↑ Auto-filled from preset                   │
│                                                              │
│ Scopes:         ☑ openid ℹ️                                │
│                 ☑ profile ℹ️                               │
│                 ☑ email ℹ️                                 │
│                 ☐ offline_access ℹ️                        │
│                 ↑ Auto-selected from preset                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Behind the scenes:**
```typescript
// Preset applied
const preset = EducationService.getQuickStartPreset('pingone-oidc');

// Form updates
setCredentials({
  ...preset.config,
  scopes: preset.scopes.join(' ')
});

// Validation runs
const validation = ValidationService.validateCredentials(
  credentials,
  'oidc'
);

// Result:
{
  valid: true,
  canProceed: true,
  errors: [],
  warnings: []
}

// Next button enables!
```

---

**Step 0: Complete**

```
┌─────────────────────────────────────────────────────────────┐
│ Progress: ████████░░░░░░░░░░░░░░░░░░░░░░░░░░ 25% (1 of 4) │
│                                                              │
│ ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐ │
│ │ ▶ Step 0 │───│   Step 1 │───│   Step 2 │───│   Step 3 │ │
│ │ Config   │   │ Auth URL │   │ Callback │   │  Tokens  │ │
│ └──────────┘   └──────────┘   └──────────┘   └──────────┘ │
│   Active         Available      Locked         Locked      │
│                  ↑ Now clickable!                           │
│                                                              │
│ ✅ All required fields complete                             │
│                                                              │
│ [◀ Previous]                    [Next Step ▶] (ENABLED)    │
│  (disabled)                      ↑ Click to proceed!        │
└─────────────────────────────────────────────────────────────┘
```

**User clicks "Next Step":**
```typescript
// Validation passes
if (validation.canProceed) {
  setCurrentStep(1);
  console.log('[🎯 STEP-NAV-V8] Moving to step 1');
}
```

---

**Step 1: Generate Authorization URL**

```
┌─────────────────────────────────────────────────────────────┐
│ Progress: ████████████████░░░░░░░░░░░░░░░░ 50% (2 of 4)   │
│                                                              │
│ ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐ │
│ │ ✓ Step 0 │───│ ▶ Step 1 │───│   Step 2 │───│   Step 3 │ │
│ │ Config   │   │ Auth URL │   │ Callback │   │  Tokens  │ │
│ └──────────┘   └──────────┘   └──────────┘   └──────────┘ │
│  Completed       Active         Locked         Locked      │
│  ↑ Can click to go back                                     │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ Step 1: Generate Authorization URL                     │ │
│ │                                                         │ │
│ │ [Generate Authorization URL]                           │ │
│ │                                                         │ │
│ │ Authorization URL:                                     │ │
│ │ ┌────────────────────────────────────────────────────┐ │ │
│ │ │ https://auth.pingone.com/.../as/authorize?...     │ │ │
│ │ └────────────────────────────────────────────────────┘ │ │
│ │                                                         │ │
│ │ [Copy URL] [Edit URL] [Open in Browser]               │ │
│ │                                                         │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│ ✅ Authorization URL generated successfully                 │
│                                                              │
│ [◀ Previous]                    [Next Step ▶] (ENABLED)    │
│  ↑ Go back to Step 0            ↑ Proceed to Step 2        │
└─────────────────────────────────────────────────────────────┘
```

**Behind the scenes:**
```typescript
// Validate Step 1
const validation = ValidationService.validateAuthorizationUrlParams({
  authorizationEndpoint: endpoints.authorization_endpoint,
  clientId: credentials.clientId,
  redirectUri: credentials.redirectUri,
  scope: credentials.scopes,
  responseType: 'code',
  state: generatedState,
  codeChallenge: pkceCodes.codeChallenge,
  codeChallengeMethod: 'S256'
});

// Result:
{
  valid: true,
  canProceed: true,
  errors: [],
  warnings: []
}

// Next button enabled!
```

---

## 🎯 Summary: How It All Works Together

### 1. **Validation Service** provides the rules
```typescript
ValidationService.validateCredentials(credentials, 'oidc')
→ Returns: { valid, canProceed, errors, warnings }
```

### 2. **Education Service** provides the content
```typescript
EducationService.getTooltip('credential.clientId')
→ Returns: { title, description, icon, learnMoreUrl }

EducationService.getQuickStartPreset('pingone-oidc')
→ Returns: { config, scopes, description }
```

### 3. **Step Navigation** uses both
```typescript
// Check if can proceed
const validation = ValidationService.validateCredentials(...);

// Show tooltips
<EducationTooltip contentKey="credential.clientId">
  <Label>Client ID</Label>
</EducationTooltip>

// Enable/disable Next button
<button disabled={!validation.canProceed}>
  Next Step ▶
</button>

// Show errors
{!validation.valid && (
  <StepValidationFeedback 
    validation={validation}
    step={currentStep}
  />
)}
```

---

## 🎉 Result: Perfect User Experience

**Before V8:**
- ❌ User can click any step
- ❌ Can submit incomplete data
- ❌ Cryptic error messages
- ❌ No guidance

**After V8:**
- ✅ Clear step progression
- ✅ Next button disabled until valid
- ✅ Helpful error messages
- ✅ Tooltips everywhere
- ✅ Quick Start presets
- ✅ Cannot proceed with bad data
- ✅ Self-service success!

---

**This is the V8 difference!** 🚀
