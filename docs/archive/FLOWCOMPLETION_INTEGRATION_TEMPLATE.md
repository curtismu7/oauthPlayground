# FlowCompletionService Integration Template

## Quick Reference for Remaining 5 Flows

### **Files to Update:**
1. ✅ OAuthAuthorizationCodeFlowV6.tsx - DONE
2. ✅ OIDCAuthorizationCodeFlowV6.tsx - DONE
3. ⚠️ PingOnePARFlowV6_New.tsx
4. ⚠️ RARFlowV6_New.tsx
5. ⚠️ RedirectlessFlowV6_Real.tsx
6. ⚠️ OAuthImplicitFlowV5.tsx
7. ⚠️ OIDCImplicitFlowV5_Full.tsx

---

## Template for PAR, RAR, Redirectless (AuthZ Flows)

### **Step 1: Add Imports**
```typescript
import { FlowCompletionService, FlowCompletionConfigs } from '../../services/flowCompletionService';
import { getFlowSequence } from '../../services/flowSequenceService';
```

### **Step 2: Add State**
```typescript
const [completionCollapsed, setCompletionCollapsed] = useState(false);
```

### **Step 3: Add flowSequence** (if not present)
```typescript
const flowSequence = useMemo(() => {
  return getFlowSequence('authorization-code'); // or 'rar', 'redirectless'
}, []);
```

### **Step 4: Add to Final Step (after TokenIntrospect)**

**For PAR:**
```typescript
<FlowCompletionService
  config={{
    ...FlowCompletionConfigs.authorizationCode,
    flowName: 'PingOne PAR Flow V6',
    flowDescription: 'You\'ve successfully completed the PAR (Pushed Authorization Requests) flow. Authorization request parameters were pushed via back-channel for enhanced security.',
    onStartNewFlow: handleResetFlow,
    showUserInfo: true,
    showIntrospection: !!introspectionApiCall,
    userInfo: controller.userInfo,
    introspectionResult: introspectionApiCall,
    nextSteps: [
      'Store tokens securely',
      'Note: PAR enhances security by pushing parameters server-to-server',
      'Use PAR in production for sensitive authorization requests',
      'Implement proper error handling for PAR endpoint failures'
    ]
  }}
  collapsed={completionCollapsed}
  onToggleCollapsed={() => setCompletionCollapsed(!completionCollapsed)}
/>
```

**For RAR:**
```typescript
<FlowCompletionService
  config={{
    ...FlowCompletionConfigs.authorizationCode,
    flowName: 'Rich Authorization Requests (RAR) Flow V6',
    flowDescription: 'You\'ve successfully completed the RAR flow. Fine-grained authorization details were requested and granted using structured JSON.',
    onStartNewFlow: handleResetFlow,
    showUserInfo: true,
    showIntrospection: !!introspectionApiCall,
    userInfo: controller.userInfo,
    introspectionResult: introspectionApiCall,
    nextSteps: [
      'Store tokens securely',
      'Parse authorization_details from access token',
      'Enforce fine-grained permissions in your application',
      'Note: RAR enables precise, scope-independent authorization',
      'Implement proper error handling for authorization_details'
    ]
  }}
  collapsed={completionCollapsed}
  onToggleCollapsed={() => setCompletionCollapsed(!completionCollapsed)}
/>
```

**For Redirectless:**
```typescript
<FlowCompletionService
  config={{
    ...FlowCompletionConfigs.authorizationCode,
    flowName: 'PingOne Redirectless Flow V6 (pi.flow)',
    flowDescription: 'You\'ve successfully completed the Redirectless flow using response_mode=pi.flow. Tokens were received via API without browser redirects.',
    onStartNewFlow: handleResetFlow,
    showUserInfo: true,
    showIntrospection: !!introspectionApiCall,
    userInfo: controller.userInfo,
    introspectionResult: introspectionApiCall,
    nextSteps: [
      'Store tokens securely',
      'Note: pi.flow is PingOne proprietary API-driven authentication',
      'Use for embedded authentication scenarios',
      'No full-page redirect required - better UX',
      'Implement proper error handling for pi.flow responses'
    ]
  }}
  collapsed={completionCollapsed}
  onToggleCollapsed={() => setCompletionCollapsed(!completionCollapsed)}
/>
```

### **Step 5: Add Dependencies to useMemo**
```typescript
completionCollapsed,
introspectionApiCall,
```

### **Step 6: Update FlowHeader and VersionBadge**
```typescript
<FlowHeader flowId="pingone-par-v6" /> // or "rar-v6", "redirectless-v6-real"
<VersionBadge>PAR Flow · V6</VersionBadge> // or "RAR Flow · V6", "Redirectless Flow · V6"
flowVersion="V6" // in TokenIntrospect
```

---

## Template for Implicit Flows

### **For OAuth Implicit:**
```typescript
<FlowCompletionService
  config={{
    ...FlowCompletionConfigs.implicit,
    flowName: 'OAuth 2.0 Implicit Flow V5',
    onStartNewFlow: handleResetFlow,
    showUserInfo: false,
    showIntrospection: false,
    nextSteps: [
      'Store the access token securely',
      'Use the access token to call protected APIs',
      'Note: Implicit flow returns tokens directly (no refresh token)',
      'OAuth provides authorization only - use OIDC for user identity',
      'Handle token expiration and re-authorization'
    ]
  }}
  collapsed={completionCollapsed}
  onToggleCollapsed={() => setCompletionCollapsed(!completionCollapsed)}
/>
```

### **For OIDC Implicit:**
```typescript
<FlowCompletionService
  config={{
    ...FlowCompletionConfigs.implicit,
    flowName: 'OpenID Connect Implicit Flow V5',
    onStartNewFlow: handleResetFlow,
    showUserInfo: true,
    userInfo: controller.userInfo,
    showIntrospection: false,
    nextSteps: [
      'Store the ID token and access token securely',
      'Validate ID token signature and claims before trusting user identity',
      'Use access token to call protected APIs',
      'Note: Implicit flow returns tokens directly (no refresh token)',
      'Handle token expiration and re-authorization'
    ]
  }}
  collapsed={completionCollapsed}
  onToggleCollapsed={() => setCompletionCollapsed(!completionCollapsed)}
/>
```

---

## Quick Checklist Per Flow

- [ ] Import FlowCompletionService and FlowCompletionConfigs
- [ ] Import getFlowSequence (if not present)
- [ ] Add completionCollapsed state
- [ ] Add flowSequence useMemo (if not present)
- [ ] Add FlowCompletionService component to final step
- [ ] Add dependencies to useMemo array
- [ ] Update FlowHeader flowId to v6
- [ ] Update VersionBadge to V6
- [ ] Update TokenIntrospect flowVersion to V6
- [ ] Commit

---

## Customization Per Flow Type

| Flow | flowName | showUserInfo | Special Notes |
|------|----------|--------------|---------------|
| OAuth AuthZ | OAuth 2.0 Authorization Code Flow V6 | false | No ID token |
| OIDC AuthZ | OpenID Connect Authorization Code Flow V6 | true | Has ID token |
| PAR | PingOne PAR Flow V6 | true | PAR education |
| RAR | Rich Authorization Requests Flow V6 | true | RAR education |
| Redirectless | PingOne Redirectless Flow V6 | true | pi.flow education |
| OAuth Implicit | OAuth 2.0 Implicit Flow V5 | false | No ID token |
| OIDC Implicit | OpenID Connect Implicit Flow V5 | true | Has ID token |

