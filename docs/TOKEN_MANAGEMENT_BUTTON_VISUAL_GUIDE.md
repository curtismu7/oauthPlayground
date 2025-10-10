# Token Management Button - Visual Guide

## Button Appearance

Each token in Step 5 (Token Exchange) now displays three action buttons:

```
┌─────────────────────────────────────────────────────────────┐
│ Access Token [ACCESS]                                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  eyJhbGciOiJSUzI1NiIsImtpZCI6IjEyMzQ1Njc4OTAiLCJ0eXA...  │
│                                                              │
│  [🔓 Decode] [📋 Copy] [🔗 Token Management]                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Button Breakdown

### 1. Decode Button (Secondary)
- **Color:** Light gray background
- **Icon:** 🔓 Key icon
- **Function:** Toggle between encoded/decoded JWT view
- **Label:** "Decode" → "Encode" (when decoded)

### 2. Copy Button (Primary)
- **Color:** Blue background
- **Icon:** 📋 Copy icon
- **Function:** Copy token to clipboard
- **Label:** "Copy"

### 3. Token Management Button (NEW - Management)
- **Color:** Green gradient background
- **Icon:** 🔗 External link icon
- **Function:** Navigate to Token Management with token pre-filled
- **Label:** "Token Management"

## Example: OIDC Flow with All Tokens

```
Step 5: Token Exchange Results
════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────┐
│ Access Token [ACCESS]                                       │
├─────────────────────────────────────────────────────────────┤
│  eyJhbGciOiJSUzI1NiIsImtpZCI6IjEyMzQ1...                   │
│  [🔓 Decode] [📋 Copy] [🔗 Token Management]                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ ID Token (OIDC) [ID (OIDC)]                                │
├─────────────────────────────────────────────────────────────┤
│  eyJhbGciOiJSUzI1NiIsImtpZCI6IjY3ODkwMTIzNDUi...          │
│  [🔓 Decode] [📋 Copy] [🔗 Token Management]                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Refresh Token [REFRESH]                                     │
├─────────────────────────────────────────────────────────────┤
│  def50200-4b25-4c89-b8e3-f4f5e6f7a8b9                       │
│  [🔓 Decode] [📋 Copy] [🔗 Token Management]                │
│  ℹ️ Refresh Token is opaque and cannot be decoded as JWT.  │
└─────────────────────────────────────────────────────────────┘
```

## Example: OAuth Flow (No ID Token)

```
Step 5: Token Exchange Results
════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────┐
│ Access Token [ACCESS]                                       │
├─────────────────────────────────────────────────────────────┤
│  eyJhbGciOiJSUzI1NiIsImtpZCI6IjEyMzQ1...                   │
│  [🔓 Decode] [📋 Copy] [🔗 Token Management]                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Refresh Token [REFRESH]                                     │
├─────────────────────────────────────────────────────────────┤
│  abc12300-9b15-3c78-a7d2-e3e4d5e6f7g8                       │
│  [🔓 Decode] [📋 Copy] [🔗 Token Management]                │
│  ℹ️ Refresh Token is opaque and cannot be decoded as JWT.  │
└─────────────────────────────────────────────────────────────┘

Note: No ID Token displayed (OAuth provides authorization, not authentication)
```

## User Workflow

### Scenario: Analyzing an ID Token

**Step 1:** Complete OIDC Authorization Code flow
```
User completes authentication → Receives tokens
```

**Step 2:** View tokens in Step 5
```
✓ Access Token displayed
✓ ID Token displayed  ← User wants to analyze this
✓ Refresh Token displayed
```

**Step 3:** Click "Token Management" button on ID Token
```
Button: [🔗 Token Management]
         ↓ (User clicks)
Toast: ✅ "ID Token sent to Token Management"
```

**Step 4:** Navigate to Token Management page
```
✓ ID Token automatically populated
✓ JWT automatically decoded
✓ Source: "ID Token (OIDC) from oidc-authorization-code-v6"
✓ Claims displayed (sub, aud, iss, exp, etc.)
✓ Security analysis available
✓ Introspection ready
```

**Step 5:** User can now:
- View decoded claims
- Check token expiration
- Introspect token (if configured)
- View security score
- Export token data
- Navigate back to flow

## Button Behavior Matrix

| Token Type | OAuth Flow | OIDC Flow | Button Appears? |
|------------|------------|-----------|-----------------|
| Access Token | ✅ | ✅ | ✅ Always |
| ID Token | ❌ | ✅ | ✅ OIDC only |
| Refresh Token | ✅ | ✅ | ✅ When present |

## Color Coding

### Button Colors (Visual)

```
┌─────────────────────────┐
│  Decode                 │  ← Gray (#f3f4f6)
├─────────────────────────┤
│  Copy                   │  ← Blue (#3b82f6)
├─────────────────────────┤
│  Token Management       │  ← Green Gradient (#10b981 → #059669)
└─────────────────────────┘
```

### Token Type Badges

```
[ACCESS]   ← Blue background (#dbeafe)
[ID]       ← Green background (#dcfce7)
[REFRESH]  ← Yellow background (#fef3c7)
```

## Interactive States

### Normal State
```
┌──────────────────────────────┐
│ 🔗 Token Management          │  Green gradient
└──────────────────────────────┘
```

### Hover State
```
┌──────────────────────────────┐
│ 🔗 Token Management          │  Darker green + lift up
└──────────────────────────────┘  Shadow appears
     ↑ (Subtle lift animation)
```

### Clicked State
```
┌──────────────────────────────┐
│ 🔗 Token Management          │  Brief press down
└──────────────────────────────┘
     ↓
Navigate to /token-management with state
```

## Mobile Responsive Design

### Desktop (> 768px)
```
┌──────────────────────────────────────────────────────────────┐
│ Access Token [ACCESS]                                        │
│ eyJhbGciOiJSUzI1NiIsImtpZCI6IjEyMzQ1Njc4OTAi...             │
│ [🔓 Decode] [📋 Copy] [🔗 Token Management]                  │
└──────────────────────────────────────────────────────────────┘
```

### Mobile (< 768px)
```
┌──────────────────────────────┐
│ Access Token [ACCESS]        │
├──────────────────────────────┤
│ eyJhbGciOiJSUzI1NiIsImtp...  │
│ (token truncated for mobile) │
├──────────────────────────────┤
│ [🔓 Decode]                  │
│ [📋 Copy]                    │
│ [🔗 Token Management]        │
└──────────────────────────────┘
```

## Accessibility Features

### Keyboard Navigation
- **Tab:** Move between buttons
- **Enter/Space:** Activate button
- **Shift+Tab:** Move backwards

### Screen Reader
```
Button: "Token Management - Send Access Token to Token Management page"
Role: Button
State: Enabled
Aria-label: "Send Access Token to Token Management"
```

### Focus Indicators
- Blue outline on focus (browser default)
- Clear visual indication of which button is focused
- High contrast for accessibility compliance

## Animation Details

### Lift Animation (on hover)
```css
transform: translateY(-1px);
transition: all 0.2s ease;
box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
```

### Press Animation (on click)
```css
transform: translateY(0);
```

### Smooth Transitions
- All button state changes animate smoothly
- 200ms transition duration
- Ease timing function for natural feel

## Error States

### Invalid Token
```
┌─────────────────────────────────────────────────────────────┐
│ Access Token [ACCESS]                                       │
├─────────────────────────────────────────────────────────────┤
│  (Invalid or malformed token)                               │
│  [🔓 Decode] [📋 Copy] [🔗 Token Management]                │
│  ⚠️ Token may be invalid - decode failed                    │
└─────────────────────────────────────────────────────────────┘
Button still works - sends token to management for analysis
```

### No Token
```
No token buttons appear if token doesn't exist in response
```

## Success Feedback

### Toast Notification
```
┌────────────────────────────────────┐
│ ✅ Success                          │
│ ID Token sent to Token Management  │
└────────────────────────────────────┘
(Appears for 3 seconds in top-right corner)
```

### Navigation State
```
Console: ✅ [TokenManagement] Found token from navigation state
Browser: Navigates to /token-management
Page: Token auto-populated and decoded
```

## Implementation Note

All buttons are generated by `UnifiedTokenDisplayService.showTokens()`:
- Single source of truth
- Consistent behavior across all V6 flows
- Easy to maintain and update
- Type-safe implementation

**File:** `src/services/unifiedTokenDisplayService.tsx`

