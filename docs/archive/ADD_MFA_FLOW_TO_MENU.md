# Adding MFA Flow V8 to Menu and Routing

## Step 1: Add Route to App.tsx

Find the routes section in `src/App.tsx` and add:

```typescript
// Import the MFA Flow
import { MFAFlow } from './v8/flows/MFAFlow';

// In the Routes section, add:
<Route path="/flows/mfa-v8" element={<MFAFlow />} />
```

**Note**: The path should be `/flows/mfa-v8` (not `/v8/mfa`) to match the existing flow URL pattern.

---

## Step 2: Add to Sidebar Menu

Find the sidebar menu configuration in `src/components/Sidebar.tsx` and add the MFA flow to the V8 flows section:

```typescript
{
  id: 'mfa-v8',
  label: 'MFA Flow',
  path: '/flows/mfa-v8',
  icon: '📱', // or appropriate icon
  version: 'V8',
  description: 'SMS Device Registration and OTP Validation'
}
```

### Suggested Menu Structure

```
OAuth Flows
├── V8 Flows (New)
│   ├── 📱 MFA Flow
│   ├── 🔐 Authorization Code Flow V8
│   └── 🔓 Implicit Flow V8
├── V7 Flows
│   ├── Authorization Code Flow
│   ├── Implicit Flow
│   └── ...
```

---

## Step 3: Update Documentation

The correct URL for the MFA flow is:

```
http://localhost:3000/flows/mfa-v8
```

**NOT** `http://localhost:3000/v8/mfa`

This follows the existing pattern where all flows are under `/flows/` prefix.

---

## Example Implementation

### App.tsx Addition

```typescript
// Near the top with other imports
import { MFAFlow } from './v8/flows/MFAFlow';

// In the Routes component
<Routes>
  {/* ... existing routes ... */}
  
  {/* V8 Flows */}
  <Route path="/flows/mfa-v8" element={<MFAFlow />} />
  <Route path="/flows/oauth-authz-v8" element={<OAuthAuthorizationCodeFlow />} />
  <Route path="/flows/implicit-v8" element={<ImplicitFlow />} />
  
  {/* ... other routes ... */}
</Routes>
```

### Sidebar.tsx Addition

```typescript
const v8FlowsSection = {
  title: 'V8 Flows',
  items: [
    {
      id: 'mfa-v8',
      label: 'MFA Flow',
      path: '/flows/mfa-v8',
      icon: '📱',
      badge: 'NEW',
      description: 'PingOne MFA with SMS OTP'
    },
    {
      id: 'oauth-authz-v8',
      label: 'Authorization Code',
      path: '/flows/oauth-authz-v8',
      icon: '🔐',
      description: 'OAuth 2.0 with PKCE'
    },
    {
      id: 'implicit-v8',
      label: 'Implicit Flow',
      path: '/flows/implicit-v8',
      icon: '🔓',
      description: 'OAuth 2.0 Implicit'
    }
  ]
};
```

---

## Testing

After adding the route and menu item:

1. **Restart the development server** (if needed)
2. **Navigate to**: `http://localhost:3000/flows/mfa-v8`
3. **Check the sidebar** for the MFA Flow menu item
4. **Click the menu item** to navigate to the flow

---

## URL Pattern Consistency

All flows follow this pattern:

| Flow | URL |
|------|-----|
| MFA Flow V8 | `/flows/mfa-v8` |
| OAuth Authorization Code V8 | `/flows/oauth-authz-v8` |
| Implicit Flow V8 | `/flows/implicit-v8` |
| Authorization Code V7 | `/flows/authorization-code` |
| Implicit Flow V7 | `/flows/implicit` |

**Pattern**: `/flows/{flow-name}-{version}`

---

## Quick Reference

**Correct URLs**:
- ✅ `http://localhost:3000/flows/mfa-v8`
- ✅ `http://localhost:3000/flows/oauth-authz-v8`
- ✅ `http://localhost:3000/flows/implicit-v8`

**Incorrect URLs**:
- ❌ `http://localhost:3000/v8/mfa`
- ❌ `http://localhost:3000/mfa-v8`
- ❌ `http://localhost:3000/v8/flows/mfa`

---

## Files to Modify

1. **`src/App.tsx`** - Add route
2. **`src/components/Sidebar.tsx`** - Add menu item
3. **`MFA_FLOW_V8_IMPLEMENTATION.md`** - Update URL in documentation

---

**Status**: Ready to implement  
**Last Updated**: 2024-11-19
