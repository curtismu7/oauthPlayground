# Advanced Parameters Integration Status

## Current State

### ✅ Completed:
1. **Save Button Fixed** - Now highly visible with green gradient background
2. **Title Updated** - Changes to "Advanced OIDC Parameters" for OIDC flows
3. **Storage Service** - `FlowStorageService.AdvancedParameters` ready
4. **UI Components** - All advanced parameter inputs working

### ⚠️ Issue: Parameters NOT Integrated with Flow

**Problem:** The advanced parameters (audience, resources, prompt, display, claims) are:
- ✅ Being collected in AdvancedParametersV6 page
- ✅ Being saved to localStorage
- ❌ **NOT being loaded by flows**
- ❌ **NOT being passed to authorization URLs**
- ❌ **NOT being included in token requests**

---

## What Needs to Happen

### Step 1: Load Saved Parameters in Flows
Each flow needs to:
```typescript
// On mount, load saved advanced parameters
useEffect(() => {
  const flowId = getFlowId(); // e.g., 'oauth-authz-v6'
  const saved = FlowStorageService.AdvancedParameters.get(flowId);
  if (saved) {
    setAudience(saved.audience || '');
    setResources(saved.resources || []);
    setPromptValues(saved.promptValues || []);
    setDisplayMode(saved.displayMode || 'page');
    setClaimsRequest(saved.claimsRequest || null);
  }
}, []);
```

### Step 2: Include Parameters in Authorization URL
When building the authorization URL:
```typescript
// Add audience
if (audience) {
  params.append('audience', audience);
}

// Add resources (multiple)
resources.forEach(resource => {
  params.append('resource', resource);
});

// Add prompt (multiple values)
if (promptValues.length > 0) {
  params.append('prompt', promptValues.join(' '));
}

// Add display (OIDC only)
if (displayMode && displayMode !== 'page') {
  params.append('display', displayMode);
}

// Add claims (OIDC only)
if (claimsRequest) {
  params.append('claims', JSON.stringify(claimsRequest));
}
```

### Step 3: Verify in Token Response
After token exchange, verify that:
- `aud` claim in JWT contains the audience
- Token was scoped to the specified resources
- Claims were honored (OIDC)

---

## Flows That Need Integration

### Priority 1: Authorization Code Flows
1. **OAuth Authorization Code** - `OAuthAuthorizationCodeFlowV6.tsx`
   - Load: audience, resources, promptValues
   - Include in authz URL

2. **OIDC Authorization Code** - `OIDCAuthorizationCodeFlowV6.tsx`
   - Load: audience, resources, promptValues, displayMode, claimsRequest
   - Include in authz URL

### Priority 2: Implicit Flows
3. **OAuth Implicit** - `OAuthImplicitFlowV6.tsx`
   - Load: audience, resources, promptValues
   - Include in authz URL

4. **OIDC Implicit** - `OIDCImplicitFlowV6.tsx`
   - Load: audience, resources, promptValues, displayMode, claimsRequest
   - Include in authz URL

### Priority 3: Other Flows
5. **PAR** - Load and pass parameters
6. **RAR** - Load and pass parameters
7. **Device Flows** - Load audience only

---

## Implementation Plan

### Phase 1: OAuth Authorization Code (Test Case)
1. Add `useEffect` to load saved parameters
2. Modify controller or URL building to include parameters
3. Test that parameters appear in authorization URL
4. Verify tokens reflect the parameters

### Phase 2: OIDC Authorization Code
1. Same as Phase 1, plus OIDC-specific parameters
2. Test claims request is honored
3. Test display parameter affects UI

### Phase 3: Remaining Flows
1. Apply same pattern to Implicit flows
2. Apply to PAR/RAR flows
3. Limited support for Device flows

---

## Current File Status

### ✅ Working Files:
- `src/services/flowStorageService.ts` - Storage service ready
- `src/pages/flows/AdvancedParametersV6.tsx` - Save/load working
- `src/components/AudienceParameterInput.tsx` - Component ready
- `src/components/ResourceParameterInput.tsx` - Component ready
- `src/components/EnhancedPromptSelector.tsx` - Component ready
- `src/components/DisplayParameterSelector.tsx` - Component ready
- `src/components/ClaimsRequestBuilder.tsx` - Component ready

### ⚠️ Files Needing Updates:
- `src/pages/flows/OAuthAuthorizationCodeFlowV6.tsx` - Load params
- `src/pages/flows/OIDCAuthorizationCodeFlowV6.tsx` - Load params
- `src/hooks/useAuthorizationCodeFlowController.ts` - Include params in URL
- (Other flows...)

---

## Testing Checklist

### After Integration:
- [ ] Save audience in Advanced Parameters
- [ ] Refresh browser - audience still saved
- [ ] Run OAuth Authz flow - audience appears in URL
- [ ] Get token - verify `aud` claim matches audience
- [ ] Save resources - verify multiple `resource` params in URL
- [ ] Save prompt values - verify `prompt` param in URL
- [ ] (OIDC) Save display - verify `display` param in URL
- [ ] (OIDC) Save claims - verify `claims` param in URL
- [ ] Tokens reflect the requested parameters

---

## Next Steps

1. **Investigate current URL building** - Find where authz URL is constructed
2. **Add parameter loading** - Load saved params on flow mount
3. **Modify URL construction** - Include parameters in URL
4. **Test end-to-end** - Verify parameters affect tokens
5. **Apply to all flows** - Roll out to remaining flows
6. **Document** - Add user docs explaining how to use

---

**Status:** Parameters are saved but not yet integrated with flows  
**Impact:** Users can save parameters but they don't affect OAuth/OIDC requests  
**Priority:** HIGH - Core functionality needs to work end-to-end
