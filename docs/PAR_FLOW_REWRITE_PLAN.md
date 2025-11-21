# PAR Flow V7 Rewrite - Implementation Plan

## Current Status
Terminal keeps crashing during file creation. Need to rewrite the PAR flow to match Authorization Code flow pattern.

## Problem
- Current file: `src/pages/flows/PingOnePARFlowV7.tsx` (2814 lines)
- Uses custom services pattern (doesn't match other flows)
- Too complex, not educational enough
- Needs complete rewrite based on Authorization Code flow

## Goal
Create a **simple, educational PAR flow** that:
1. Matches the Authorization Code flow structure
2. No custom services (uses existing hooks/utilities)
3. Educational tooltips/modals instead of text walls
4. Clear step-by-step progression

## Reference Files
- **Template to follow**: `src/pages/flows/ClientCredentialsFlowV7_Simple.tsx` (simple, clean pattern)
- **Canonical flow**: `src/pages/flows/OAuthAuthorizationCodeFlowV7.tsx` (full-featured)
- **Current PAR flow**: `src/pages/flows/PingOnePARFlowV7.tsx` (to be replaced)

## Implementation Steps

### Step 1: Create New PAR Flow File
**File**: `src/pages/flows/PARFlowV7.tsx`

**Key Components Needed**:
```typescript
// Imports
import { useAuthorizationCodeFlowController } from '../../hooks/useAuthorizationCodeFlowV7Controller';
import { useCredentialBackup } from '../../hooks/useCredentialBackup';
import { usePageScroll } from '../../hooks/usePageScroll';
import { LearningTooltip } from '../../components/LearningTooltip';
import { StepNavigationButtons } from '../../components/StepNavigationButtons';
import { FlowUIService } from '../../services/flowUIService';
import { UnifiedTokenDisplayService } from '../../services/unifiedTokenDisplayService';
import { PKCEGenerationService } from '../../services/pkceGenerationService';

// Use existing controller (no custom services!)
const controller = useAuthorizationCodeFlowController({
  flowKey: 'par-flow-v7',
  defaultFlowVariant: selectedVariant, // 'oauth' or 'oidc'
});
```

### Step 2: Define Flow Steps
```typescript
const STEP_METADATA = [
  { title: 'Configuration', subtitle: 'Set up credentials and PAR endpoint' },
  { title: 'PKCE Generation', subtitle: 'Generate code verifier and challenge' },
  { title: 'PAR Request', subtitle: 'Push authorization request to server' },
  { title: 'Authorization', subtitle: 'User authentication with request_uri' },
  { title: 'Token Exchange', subtitle: 'Exchange code for tokens' },
  { title: 'Token Display', subtitle: 'View and decode tokens' },
  { title: 'Complete', subtitle: 'Flow finished' },
];
```

### Step 3: PAR-Specific Logic

**PAR Request State**:
```typescript
const [parResponse, setParResponse] = useState<{
  request_uri: string;
  expires_in: number;
} | null>(null);
```

**PAR Request Handler**:
```typescript
const handlePARRequest = async () => {
  // Build PAR payload with all auth params
  const parPayload = {
    client_id: controller.credentials.clientId,
    response_type: 'code',
    redirect_uri: controller.credentials.redirectUri,
    scope: selectedVariant === 'oidc' ? 'openid profile email' : 'api.read',
    state: `par-${Date.now()}`,
    code_challenge: pkceCodes.codeChallenge,
    code_challenge_method: 'S256',
  };
  
  // POST to PAR endpoint
  const response = await fetch(parEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
    },
    body: new URLSearchParams(parPayload),
  });
  
  const data = await response.json();
  setParResponse(data);
};
```

**Authorization URL with PAR**:
```typescript
// Traditional: Long URL with all params
const traditionalUrl = `${authEndpoint}?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${scope}&state=${state}&code_challenge=${challenge}`;

// PAR: Short URL with request_uri
const parUrl = `${authEndpoint}?client_id=${clientId}&request_uri=${parResponse.request_uri}`;
```

### Step 4: Educational UI Elements

**Tooltips** (use LearningTooltip):
```tsx
<LearningTooltip
  variant="security"
  title="PAR Security"
  content="Sends auth params via secure back-channel instead of URL"
  placement="top"
>
  Pushed Authorization Request
</LearningTooltip>
```

**Comparison Modal** (show traditional vs PAR):
```tsx
<Modal>
  <h3>Traditional vs PAR</h3>
  <div>
    <h4>Traditional Authorization URL:</h4>
    <code>{traditionalUrl}</code>
    <p>❌ Long URL, parameters visible in browser</p>
  </div>
  <div>
    <h4>PAR Authorization URL:</h4>
    <code>{parUrl}</code>
    <p>✅ Short URL, parameters sent securely</p>
  </div>
</Modal>
```

**Info Cards**:
```tsx
<InfoBox>
  <FiInfo />
  The request_uri is a reference to the authorization request you pushed to the server.
  It expires in {parResponse.expires_in} seconds.
</InfoBox>
```

### Step 5: Variant Selector (OAuth vs OIDC)
```tsx
<VariantSelector>
  <VariantButton 
    $selected={selectedVariant === 'oauth'}
    onClick={() => setSelectedVariant('oauth')}
  >
    <VariantTitle>OAuth 2.0 PAR</VariantTitle>
    <VariantDescription>Access token only</VariantDescription>
  </VariantButton>
  <VariantButton 
    $selected={selectedVariant === 'oidc'}
    onClick={() => setSelectedVariant('oidc')}
  >
    <VariantTitle>OpenID Connect PAR</VariantTitle>
    <VariantDescription>ID token + Access token</VariantDescription>
  </VariantButton>
</VariantSelector>
```

### Step 6: Update App.tsx
```typescript
// Change import
import PARFlowV7 from './pages/flows/PARFlowV7';

// Update route
<Route path="/flows/pingone-par-v7" element={<PARFlowV7 />} />
```

### Step 7: Backend API Routes (if needed)
Add to `server.js`:
```javascript
// PAR endpoint proxy
app.post('/api/oauth/par', async (req, res) => {
  // Forward to PingOne PAR endpoint
  // Return request_uri and expires_in
});

// Token endpoint (already exists, verify it works)
app.post('/api/oauth/token', async (req, res) => {
  // Exchange code for tokens
});
```

## Key Principles

### ✅ DO
- Use `useAuthorizationCodeFlowController` hook
- Follow ClientCredentialsFlowV7_Simple.tsx structure
- Use LearningTooltip for education
- Keep step logic simple and clear
- Show before/after comparisons
- Use modals for detailed explanations

### ❌ DON'T
- Create custom services (PARService, etc.)
- Use walls of text
- Deviate from other V7 flow patterns
- Over-engineer the solution

## File Structure
```
src/pages/flows/
├── PARFlowV7.tsx                    ← NEW (create this)
├── PingOnePARFlowV7.tsx             ← OLD (can archive/delete later)
├── OAuthAuthorizationCodeFlowV7.tsx ← Reference for full features
└── ClientCredentialsFlowV7_Simple.tsx ← Reference for simple pattern
```

## Testing Checklist
- [ ] OAuth variant works
- [ ] OIDC variant works
- [ ] PAR request creates request_uri
- [ ] Authorization URL uses request_uri
- [ ] Token exchange works
- [ ] Tokens display correctly
- [ ] Tooltips show educational content
- [ ] Step navigation works
- [ ] Reset flow works
- [ ] Credentials persist across refreshes

## Next Steps When Kiro Restarts
1. Read this file
2. Create `src/pages/flows/PARFlowV7.tsx` using the simple pattern
3. Implement the 7 steps with PAR-specific logic
4. Add educational tooltips and modals
5. Update App.tsx to use new component
6. Test both OAuth and OIDC variants

## Estimated Size
- Target: ~800-1000 lines (similar to ClientCredentialsFlowV7_Simple)
- Current: 2814 lines (way too complex)
- Reduction: ~65% smaller, much cleaner

---

**Status**: Ready to implement when Kiro restarts
**Priority**: High - blocking PAR flow usability
**Complexity**: Medium - clear pattern to follow
