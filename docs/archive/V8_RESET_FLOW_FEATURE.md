# V8 Reset Flow Feature

**Date:** 2024-11-16  
**Status:** ✅ Complete with 15 tests passing

---

## 🎯 Overview

The Reset Flow feature allows users to clear tokens and PingOne sessions while preserving credentials and worker tokens. This enables users to restart the OAuth/OIDC flow without losing their configuration.

---

## 🔄 Reset Button

**Location:** Bottom center of step navigation  
**Color:** Orange (#ff9800)  
**Label:** 🔄 Reset Flow

**Behavior:**
1. Shows confirmation dialog
2. Lists what will be cleared
3. Clears tokens and session
4. Returns to Step 0
5. Keeps credentials and worker token

---

## 📋 What Gets Cleared

### ✓ Always Cleared
- Access tokens
- ID tokens
- Refresh tokens
- Step progress
- PingOne session data

### ✓ Kept by Default
- Credentials (environment ID, client ID, redirect URI, scopes)
- Worker token (for admin operations)
- Preferences
- Discovery cache (can be cleared separately)

---

## 🔧 FlowResetService API

### resetFlow(flowKey, keepWorkerToken?)
**Resets flow to initial state**

```typescript
// Reset flow (clears tokens, keeps credentials)
const result = FlowResetService.resetFlow('authz-code');

// Result:
{
  success: true,
  cleared: ['tokens', 'step_progress'],
  kept: ['v8:credentials', 'worker_token'],
  message: 'Flow reset complete. Cleared 2 items, kept 2 items.'
}
```

**Parameters:**
- `flowKey` (string) - Flow identifier (e.g., 'authz-code', 'implicit')
- `keepWorkerToken` (boolean, default: true) - Whether to keep worker token

**Returns:** ResetResult with success status and details

---

### fullReset(flowKey)
**Complete reset - clears everything for a flow**

```typescript
// Full reset (clears everything including credentials)
const result = FlowResetService.fullReset('authz-code');

// Result:
{
  success: true,
  cleared: ['tokens', 'credentials', 'step_progress', 'discovery'],
  kept: [],
  message: 'Full reset complete. Cleared 4 items.'
}
```

---

### clearTokens(flowKey)
**Clear only tokens**

```typescript
const result = FlowResetService.clearTokens('authz-code');

// Keeps: credentials, session, progress
// Clears: tokens only
```

---

### clearSession(flowKey)
**Clear session data but keep credentials and tokens**

```typescript
const result = FlowResetService.clearSession('authz-code');

// Keeps: credentials, tokens
// Clears: session data, progress
```

---

### clearProgress(flowKey)
**Clear only step progress**

```typescript
const result = FlowResetService.clearProgress('authz-code');

// Keeps: credentials, tokens, session
// Clears: step progress only
```

---

### clearPingOneSession(flowKey)
**Clear PingOne session (discovery and preferences)**

```typescript
const result = FlowResetService.clearPingOneSession('authz-code');

// Keeps: credentials, tokens, progress
// Clears: discovery, preferences
```

---

### getResetSummary(flowKey)
**Get summary of what would be cleared**

```typescript
const summary = FlowResetService.getResetSummary('authz-code');

// Result:
{
  tokens: true,
  session: true,
  progress: true,
  discovery: true,
  preferences: false,
  credentials: true,
  workerToken: true
}
```

---

### getResetMessage(flowKey)
**Get user-friendly reset message**

```typescript
const message = FlowResetService.getResetMessage('authz-code');

// Result:
// 🔄 Reset Flow?
//
// This will:
// ✓ Clear all tokens
// ✓ Clear PingOne session
// ✓ Return to Step 0
// ✓ Keep credentials
// ✓ Keep worker token
//
// Continue?
```

---

## 💻 Implementation in Components

### Step Navigation Component

```typescript
import { FlowResetService } from '@/v8/services/flowResetService';

const handleResetFlow = () => {
  const message = FlowResetService.getResetMessage('authz-code');
  
  if (confirm(message)) {
    const result = FlowResetService.resetFlow('authz-code');
    
    if (result.success) {
      // Reset UI
      setCurrentStep(0);
      setCredentials(initialCredentials);
      
      // Show success message
      v4ToastManager.showSuccess('Flow reset. Ready to start again!');
      
      // Log
      console.log('[🔄 FLOW-RESET-V8] Flow reset complete', result);
    } else {
      v4ToastManager.showError('Failed to reset flow');
    }
  }
};

// In JSX
<button 
  className="reset-button" 
  onClick={handleResetFlow}
>
  🔄 Reset Flow
</button>
```

---

## 🎯 Use Cases

### 1. User Wants to Try Again
**Scenario:** User made a mistake and wants to restart

**Action:** Click Reset Flow  
**Result:** Tokens cleared, back to Step 0, credentials preserved

---

### 2. Testing Different Configurations
**Scenario:** Developer wants to test with different credentials

**Action:** 
1. Click Reset Flow
2. Change credentials
3. Start flow again

**Result:** Clean state with new configuration

---

### 3. Session Expired
**Scenario:** PingOne session expired, need to re-authenticate

**Action:** Click Reset Flow  
**Result:** Session cleared, can re-authenticate

---

### 4. Worker Token Flow
**Scenario:** Using worker token for admin operations

**Action:** Click Reset Flow (keepWorkerToken: true)  
**Result:** Tokens cleared, worker token preserved

---

## 🧪 Test Coverage

**15 tests passing:**
- ✅ resetFlow clears tokens and keeps credentials
- ✅ resetFlow keeps worker token by default
- ✅ resetFlow clears worker token when requested
- ✅ fullReset clears all data
- ✅ clearTokens clears only tokens
- ✅ clearTokens handles missing tokens
- ✅ clearSession clears session but keeps credentials
- ✅ clearProgress clears only progress
- ✅ clearPingOneSession clears discovery and preferences
- ✅ getResetSummary returns accurate summary
- ✅ getResetSummary handles empty storage
- ✅ getResetMessage generates user-friendly message
- ✅ getResetMessage includes worker token
- ✅ Multiple flows handled independently
- ✅ Error handling works gracefully

---

## 📊 Storage Management

### What Gets Stored

```typescript
// Credentials (preserved on reset)
v8:credentials = {
  environmentId: '...',
  clientId: '...',
  redirectUri: '...',
  scopes: [...]
}

// Tokens (cleared on reset)
v8:tokens = {
  access_token: '...',
  id_token: '...',
  refresh_token: '...'
}

// Progress (cleared on reset)
v8:step-progress = {
  currentStep: 2,
  completedSteps: [0, 1]
}

// Discovery (cleared on reset)
v8:discovery = {
  authorization_endpoint: '...',
  token_endpoint: '...',
  ...
}

// Worker Token (kept on reset)
v8:worker-token = {
  token: '...',
  expiresAt: ...
}
```

---

## 🔐 Security Considerations

### What's NOT Cleared
- Worker tokens (admin credentials)
- Credentials (user configuration)
- Preferences (user settings)

### Why?
- **Worker tokens:** Needed for admin operations, separate from user flow
- **Credentials:** User configuration, not sensitive data
- **Preferences:** User settings, not session data

### What IS Cleared
- **Access tokens:** User authentication tokens
- **ID tokens:** User identity information
- **Refresh tokens:** Long-lived credentials
- **Session data:** PingOne session information

---

## 🎨 UI/UX Design

### Reset Button Styling

```css
.reset-button {
  background: #ff9800;
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.reset-button:hover {
  background: #f57c00;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 152, 0, 0.4);
}
```

### Confirmation Dialog

```
🔄 Reset Flow?

This will:
✓ Clear all tokens
✓ Clear PingOne session
✓ Return to Step 0
✓ Keep credentials
✓ Keep worker token

[Cancel] [Continue]
```

### Success Message

```
✅ Flow Reset
Tokens and session cleared. Ready to start again!
```

---

## 📝 Logging

All reset operations are logged with the module tag `[🔄 FLOW-RESET-V8]`:

```typescript
console.log('[🔄 FLOW-RESET-V8] Resetting flow', { 
  flowKey: 'authz-code',
  keepWorkerToken: true 
});

console.log('[🔄 FLOW-RESET-V8] Flow reset complete', {
  flowKey: 'authz-code',
  cleared: 2,
  kept: 1
});
```

---

## 🚀 Integration Checklist

- [ ] Add reset button to step navigation
- [ ] Import FlowResetService
- [ ] Implement handleResetFlow function
- [ ] Add confirmation dialog
- [ ] Show success/error messages
- [ ] Test with different flows
- [ ] Test with worker token
- [ ] Verify credentials are preserved
- [ ] Verify tokens are cleared
- [ ] Test multiple flows independently

---

## 📚 Related Services

- **StorageService** - Manages versioned storage
- **ValidationService** - Validates credentials
- **ErrorHandler** - Handles errors
- **EducationService** - Provides help content

---

**Status:** ✅ Complete and tested  
**Module Tag:** `[🔄 FLOW-RESET-V8]`  
**Tests:** 15/15 passing
