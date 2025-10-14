# Advanced Parameters - Organization by PingOne Support

## Current State
All parameters are available in the "Advanced Parameters" page for OAuth/OIDC flows, but:
- Some are well-supported by PingOne ✅
- Some are rarely supported or ignored ⚠️

## New Organization Plan

### 🔵 OAuth/OIDC Flows (PingOne-Supported)
**Keep only parameters that PingOne reliably supports:**

#### OAuth Authorization Code Flow:
- ✅ **Audience** - PingOne supports this
- ✅ **Prompt** - Core OIDC feature, works well
- ❌ Remove Resources (move to mock)
- ❌ Remove Display (not reliably supported)

#### OIDC Authorization Code Flow:
- ✅ **Audience** - PingOne supports this
- ✅ **Prompt** - Core OIDC feature, works well
- ✅ **Claims Request** - Core OIDC feature, works well
- ❌ Remove Resources (move to mock)
- ❌ Remove Display (not reliably supported)

### 🎭 Mock Flows (Demonstrate Unsupported Features)
**Add parameters that aren't reliably supported, with mock responses:**

#### New: "Advanced OAuth Parameters Demo" Mock Flow
Demonstrates:
- ✅ **Resources (RFC 8707)** - Shows how multiple resource parameters work
- ✅ **Display Parameter** - Shows different UI modes
- ✅ **Full Claims Request** - Advanced claims scenarios
- ✅ **ACR Values** - Authentication Context Class Reference
- ✅ **Max Age** - Token aging parameters
- ✅ **UI Locales** - Internationalization

**Why Mock?**
- Users can see how these WOULD work with a fully compliant server
- Educational: Shows the full OAuth/OIDC spec
- No disappointment when PingOne ignores them

---

## Implementation Plan

### Phase 1: Update AdvancedParametersV6.tsx ✅ (Already Done)
- Parameters are already configurable
- Save/load working
- Integration with flows working

### Phase 2: Refine Real Flows (OAuth/OIDC AuthZ)
**File:** `src/pages/flows/AdvancedParametersV6.tsx`

**Changes:**
1. When `flowType` is OAuth/OIDC Authorization Code:
   - Hide "Resources" section (or mark as "Not supported by PingOne")
   - Hide "Display" section (OIDC only, or mark as "Limited support")
   - Keep Audience, Prompt, Claims

2. Add info boxes:
   ```
   ℹ️ Note: Resource Indicators (RFC 8707) are not supported by PingOne.
   Try the "Advanced OAuth Parameters Demo" flow to see how they work.
   ```

### Phase 3: Create Mock Flow - "Advanced OAuth Parameters Demo"
**File:** `src/pages/flows/AdvancedOAuthParametersDemoFlow.tsx`

**Purpose:**
- Demonstrate ALL advanced OAuth/OIDC parameters
- Generate mock authorization URLs with all parameters
- Show mock tokens that reflect the parameters
- Educational content explaining each parameter

**Sections:**
1. **Resources (RFC 8707)**
   - Add multiple resources
   - Show how `aud` claim becomes an array
   - Explain token binding to resources

2. **Display Parameter**
   - Select: page, popup, touch, wap
   - Show mockup of how UI would differ
   - Explain when to use each

3. **ACR Values**
   - Add authentication context class references
   - Show how they affect authentication strength
   - Mock token with `acr` claim

4. **Max Age**
   - Set max authentication age
   - Show token with `auth_time` claim
   - Explain session management

5. **UI Locales**
   - Set preferred locales (en, es, fr, de)
   - Show how UI would adapt
   - Mock localized consent screen

6. **ID Token Hint**
   - Provide previous ID token
   - Show seamless re-authentication

7. **Login Hint**
   - Pre-populate username
   - Show UX improvement

**Mock Token Generation:**
```javascript
// Generate mock access token with resources
const mockAccessToken = {
  iss: "https://auth.example.com",
  sub: "user123",
  aud: ["https://api1.example.com", "https://api2.example.com"], // Multiple resources!
  exp: Date.now() / 1000 + 3600,
  iat: Date.now() / 1000,
  scope: "read:api1 write:api1 read:api2",
  acr: "urn:mace:incommon:iap:silver", // ACR value reflected
  auth_time: Date.now() / 1000 - 300 // 5 minutes ago
};
```

---

## Detailed Changes by File

### 1. `src/pages/flows/AdvancedParametersV6.tsx`
**Current:** Shows all parameters for all flows
**New:** Hide/warn about unsupported parameters for PingOne flows

```typescript
// Add conditional rendering
const isPingOneFlow = flowType.includes('oauth-authorization') || 
                      flowType.includes('oidc-authorization');

// In render:
{isPingOneFlow && (
  <InfoBox variant="warning">
    <FiAlertCircle />
    <strong>Note:</strong> Resource Indicators (RFC 8707) are not supported by PingOne.
    For a demonstration of this feature, see the <Link to="/flows/advanced-params-demo">
    Advanced OAuth Parameters Demo</Link>.
  </InfoBox>
)}

// Conditionally hide Resources section for PingOne flows
{!isPingOneFlow && (
  <CollapsibleHeader ... >
    <ResourceParameterInput ... />
  </CollapsibleHeader>
)}
```

### 2. New File: `src/pages/flows/AdvancedOAuthParametersDemoFlow.tsx`
**Purpose:** Full-featured demo of ALL OAuth/OIDC parameters

**Structure:**
```typescript
const AdvancedOAuthParametersDemoFlow = () => {
  // State for ALL parameters
  const [audience, setAudience] = useState('');
  const [resources, setResources] = useState<string[]>([]);
  const [displayMode, setDisplayMode] = useState<'page' | 'popup' | 'touch' | 'wap'>('page');
  const [acrValues, setAcrValues] = useState<string[]>([]);
  const [maxAge, setMaxAge] = useState<number | null>(null);
  const [uiLocales, setUiLocales] = useState<string[]>([]);
  const [idTokenHint, setIdTokenHint] = useState('');
  const [loginHint, setLoginHint] = useState('');
  const [prompt, setPrompt] = useState<string[]>([]);
  const [claimsRequest, setClaimsRequest] = useState(null);

  // Generate mock authorization URL
  const generateMockAuthUrl = () => {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: 'demo-client',
      redirect_uri: 'https://example.com/callback',
      scope: 'openid profile email',
      state: 'demo-state-' + Math.random(),
    });

    if (audience) params.set('audience', audience);
    resources.forEach(r => params.append('resource', r));
    if (displayMode !== 'page') params.set('display', displayMode);
    if (acrValues.length) params.set('acr_values', acrValues.join(' '));
    if (maxAge) params.set('max_age', maxAge.toString());
    if (uiLocales.length) params.set('ui_locales', uiLocales.join(' '));
    if (idTokenHint) params.set('id_token_hint', idTokenHint);
    if (loginHint) params.set('login_hint', loginHint);
    if (prompt.length) params.set('prompt', prompt.join(' '));
    if (claimsRequest) params.set('claims', JSON.stringify(claimsRequest));

    return `https://auth.example.com/authorize?${params.toString()}`;
  };

  // Generate mock tokens
  const generateMockTokens = () => {
    const now = Math.floor(Date.now() / 1000);
    
    return {
      access_token: jwt.sign({
        iss: 'https://auth.example.com',
        sub: 'demo-user-123',
        aud: resources.length > 0 ? resources : audience || 'demo-client',
        exp: now + 3600,
        iat: now,
        scope: 'openid profile email read:api write:api',
        ...(acrValues.length > 0 && { acr: acrValues[0] }),
        ...(maxAge && { auth_time: now - 60 }) // Authenticated 1 min ago
      }, 'demo-secret'),
      
      id_token: jwt.sign({
        iss: 'https://auth.example.com',
        sub: 'demo-user-123',
        aud: 'demo-client',
        exp: now + 3600,
        iat: now,
        email: 'user@example.com',
        name: 'Demo User',
        // Include requested claims from claimsRequest
        ...extractRequestedClaims(claimsRequest)
      }, 'demo-secret')
    };
  };

  return (
    <Container>
      <FlowHeader 
        title="Advanced OAuth Parameters Demo"
        subtitle="Explore ALL OAuth 2.0 and OIDC parameters with mock responses"
      />
      
      {/* Educational intro */}
      <InfoBox>
        This is a <strong>demonstration flow</strong> showing advanced OAuth/OIDC parameters
        that may not be supported by all authorization servers (including PingOne).
        All responses are mocked to show you how these parameters would work.
      </InfoBox>

      {/* Step 1: Configure ALL parameters */}
      <CollapsibleHeader theme="orange" icon={<FiSettings />}>
        {/* All parameter inputs */}
      </CollapsibleHeader>

      {/* Step 2: Generate mock URL */}
      <CollapsibleHeader theme="blue" icon={<FiLink />}>
        {/* Show generated URL with all params */}
      </CollapsibleHeader>

      {/* Step 3: Mock authorization */}
      <CollapsibleHeader theme="green" icon={<FiCheckCircle />}>
        {/* Visual demo of how display/ui_locales affect UI */}
      </CollapsibleHeader>

      {/* Step 4: Mock tokens */}
      <CollapsibleHeader theme="highlight" icon={<FiPackage />}>
        {/* Show mock tokens with all claims reflecting parameters */}
        <UnifiedTokenDisplayService.showTokens(mockTokens) />
      </CollapsibleHeader>

      {/* Educational content */}
      <EducationalContentService>
        {/* Deep dive into each parameter */}
      </EducationalContentService>
    </Container>
  );
};
```

### 3. Update `src/App.tsx`
Add route for new demo flow:
```typescript
<Route 
  path="/flows/advanced-oauth-params-demo" 
  element={<AdvancedOAuthParametersDemoFlow />} 
/>
```

### 4. Update Sidebar Navigation
**File:** `src/components/Sidebar.tsx` (or navigation component)

Add new menu item under "Mock Flows":
```typescript
{
  title: "Advanced Parameters Demo",
  path: "/flows/advanced-oauth-params-demo",
  icon: <FiSettings />,
  badge: "NEW"
}
```

---

## Parameter Distribution

### PingOne Flows (OAuth/OIDC Authorization Code)
| Parameter | OAuth | OIDC | Notes |
|-----------|-------|------|-------|
| Audience | ✅ | ✅ | Well-supported |
| Prompt | ✅ | ✅ | Core feature |
| Claims Request | ❌ | ✅ | OIDC only |
| Resources | ❌ | ❌ | → Move to mock |
| Display | ❌ | ❌ | → Move to mock |
| ACR Values | ❌ | ❌ | → Move to mock |
| Max Age | ❌ | ❌ | → Move to mock |
| UI Locales | ❌ | ❌ | → Move to mock |
| ID Token Hint | ❌ | ❌ | → Move to mock |
| Login Hint | ❌ | ❌ | → Move to mock |

### Mock Demo Flow (All Parameters)
| Parameter | Supported | Mock Behavior |
|-----------|-----------|---------------|
| Audience | ✅ | Show in `aud` claim |
| Resources | ✅ | Show as array in `aud` |
| Prompt | ✅ | Visual demo of screens |
| Display | ✅ | Visual mockups of UI modes |
| Claims Request | ✅ | Show claims in ID token |
| ACR Values | ✅ | Show `acr` claim |
| Max Age | ✅ | Show `auth_time` claim |
| UI Locales | ✅ | Show localized UI mockup |
| ID Token Hint | ✅ | Show seamless re-auth |
| Login Hint | ✅ | Show pre-filled login |

---

## Benefits

### For Real Flows (OAuth/OIDC):
- ✅ No confusion about what works with PingOne
- ✅ Cleaner UI - only show what's relevant
- ✅ Better user experience - no "why isn't this working?"
- ✅ Clear expectations set upfront

### For Mock Demo Flow:
- ✅ Educational - learn the full OAuth/OIDC spec
- ✅ No disappointment - clearly marked as demo
- ✅ Visual examples of how parameters affect flow
- ✅ Can be used for presentations/teaching
- ✅ Shows what's possible with other auth servers

---

## Implementation Order

### Priority 1: Update Real Flows ⚡
1. Modify `AdvancedParametersV6.tsx` to hide unsupported params
2. Add warning messages with link to demo
3. Test OAuth/OIDC flows with only supported params
**Estimate:** 1-2 hours

### Priority 2: Create Mock Demo Flow 🎭
1. Create new file `AdvancedOAuthParametersDemoFlow.tsx`
2. Implement all parameter inputs
3. Generate mock URLs and tokens
4. Add educational content
5. Add to navigation
**Estimate:** 4-6 hours

### Priority 3: Documentation 📚
1. Update user guides
2. Create comparison chart (PingOne vs Full Spec)
3. Add troubleshooting for "parameter not working"
**Estimate:** 1-2 hours

---

## Questions to Resolve

1. **Should we completely hide unsupported params or just warn?**
   - Option A: Hide them (cleaner, less confusion)
   - Option B: Show but disable with warning (more transparent)
   - **Recommendation:** Hide them, add link to demo flow

2. **Should mock flow generate real JWTs?**
   - Option A: Generate real (unsigned) JWTs for decode demo
   - Option B: Show JSON representation
   - **Recommendation:** Generate real JWTs with HS256 (demo key)

3. **Should we support "Resources" in PingOne flows at all?**
   - Some PingOne environments might support it
   - Could add feature detection
   - **Recommendation:** Remove for now, can add back if needed

---

## Summary

**Goal:** Organize advanced parameters by PingOne support level
- ✅ Keep supported params in real flows (Audience, Prompt, Claims)
- 🎭 Move unsupported params to dedicated mock demo flow (Resources, Display, ACR, etc.)
- 📚 Add educational content explaining the difference
- 🔗 Link between flows for easy navigation

**Result:** 
- Real flows work reliably with PingOne ✅
- Mock flow demonstrates full OAuth/OIDC spec 🎓
- No user confusion about "why isn't this working?" 💡
