# SWE-15 Unified CIBA Development Guide

## 🎯 Purpose
This guide provides Software Engineering Best Practices (SWE-15) for working with the Unified CIBA implementation to maintain code quality, avoid breaking changes, and ensure consistency.

## 🔍 Before Making Changes

### 1. Reference the Inventory
```bash
# Always check the inventory first
cat project/inventory/UNIFIED_CIBA_INVENTORY.md | grep -A 10 "### Core CIBA Files"
cat project/inventory/UNIFIED_CIBA_INVENTORY.md | grep -A 5 "####.*Issue"
```

### 2. Understand the Architecture
- **CIBA Protocol**: Don't modify core protocol requirements
- **Service Layer**: Use existing services before creating new ones
- **Component Hierarchy**: Understand parent-child relationships
- **Data Flow**: Know how data moves through the system

### 3. Check Dependencies
```bash
# Find what imports a component
grep -r "import.*CIBAFlowV9" src/
grep -r "import.*CibaServiceV8Enhanced" src/v8/
```

## 🛡️ SWE-15 Best Practices

### **1. Single Responsibility Principle**
- Each component/service has one clear purpose
- Don't mix UI logic with business logic
- Keep functions focused and testable

### **2. Open/Closed Principle**
- Extend functionality without modifying existing code
- Use composition over inheritance
- Add new token delivery modes without changing base protocol

### **3. Liskov Substitution**
- New components should work as drop-in replacements
- Maintain interface contracts
- Don't break expected behavior

### **4. Interface Segregation**
- Keep interfaces focused and minimal
- Don't force clients to depend on unused methods
- Use specific props for specific needs

### **5. Dependency Inversion**
- Depend on abstractions, not concretions
- Use dependency injection for services
- Make components testable

## Architecture

### CIBA Flow V9 Components

```
┌─────────────────────────────────────────────────────────────┐
│                    CIBA Flow V9 Page                        │
│  src/pages/flows/CIBAFlowV9.tsx                            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ├──> MFAHeaderV8 (Header)
                            ├──> WorkerTokenStatusDisplayV8 (Status)
                            ├──> Service Buttons (Get Token/Apps)
                            ├──> Configuration Checkboxes
                            ├──> API Display
                            └──> CIBA Configuration Form
                                    │
                                    ├──> Environment ID
                                    ├──> Client ID/Secret
                                    ├──> Scope
                                    ├──> Token Delivery Mode
                                    ├──> Login Hint (3 types)
                                    └──> Optional Fields
```

### Service Layer

```
CIBAFlowV9.tsx
    │
    ├──> useCibaFlowV8Enhanced (Hook)
    │       └──> CibaServiceV8Enhanced (Service)
    │               └──> PingOne CIBA API
    │
    ├──> unifiedWorkerTokenService
    │       └──> Worker Token Management
    │
    ├──> fetchApplications (pingOneApplicationService)
    │       └──> Application Discovery
    │
    └──> CredentialsServiceV8
            └──> Unified Storage System
```

## Recent Fixes & Features (Feb 2026)

### ✅ Critical Fixes Applied

1. **Infinite Loop Prevention (CRITICAL)**
   - **Issue:** Discovery metadata fetch caused infinite re-renders → ERR_INSUFFICIENT_RESOURCES
   - **Fix:** Removed automatic discovery fetch from useEffect
   - **Location:** Lines 329-331
   - **Impact:** Prevents browser crash and resource exhaustion

2. **Login Hint Field Simplification**
   - **Issue:** Dropdown selection broken, field hidden by default
   - **Fix:** Replaced with persistent `login_hint` input field (always visible)
   - **Location:** Lines 660-671
   - **Benefit:** Clearer UX, follows CIBA best practices

3. **Client Secret Visibility Toggle**
   - **Issue:** No way to view entered secret
   - **Fix:** Added eye icon toggle (FiEye/FiEyeOff)
   - **Location:** Lines 602-634
   - **Benefit:** Better UX for credential management

4. **Default Scope Optimization**
   - **Issue:** Default scope too broad ('openid profile email')
   - **Fix:** Changed to minimal 'openid' scope
   - **Location:** Lines 287, 324, 467
   - **Benefit:** Follows principle of least privilege

5. **Button Spacing Improvements**
   - **Service Actions:** Added 24px top margin
   - **Action Buttons:** Optimized to 2rem top margin, 1rem padding
   - **Benefit:** Better visual hierarchy

6. **JSX Structure Fix**
   - **Issue:** Missing closing </div> tag
   - **Fix:** Added closing tag at line 1064
   - **Benefit:** Proper component structure

7. **Import Corrections**
   - **ApiDisplayCheckbox:** Fixed import from SuperSimpleApiDisplayV8
   - **Location:** Line 47
   - **Benefit:** Eliminates import errors

### 🔒 CIBA Protocol Compliance

**Login Hint Support:**
- ✅ `login_hint` (primary) - email, phone, username
- ⚠️ `id_token_hint` - can be added to advanced options
- ⚠️ `login_hint_token` - can be added to advanced options

**Token Delivery Modes:**
- ✅ Poll (default, most common)
- ✅ Ping (requires client notification endpoint)
- ✅ Push (requires client notification endpoint)

**Authentication Methods:**
- ✅ Mobile push notifications (requires PingOne MFA)
- ✅ Email notifications (requires email service)
- ✅ SMS notifications (requires SMS service)

### 🚫 Critical Don'ts

1. **NEVER add automatic discovery fetch in useEffect**
   - Causes infinite loops and browser crashes
   - Discovery metadata is optional for CIBA

2. **NEVER hide the login_hint field**
   - It's the primary authentication identifier
   - Must be always visible and easily accessible

3. **NEVER change default scope without documentation**
   - Scope changes affect token claims
   - Document in inventory if changed

4. **NEVER modify timing/polling behavior globally**
   - CIBA is timing-sensitive
   - Changes must be scoped and tested

## Implementation Details

### State Management

```typescript
// Form credentials
const [credentials, setCredentials] = useState<CibaCredentials>({
  environmentId: '',
  clientId: '',
  clientSecret: '',
  scope: 'openid profile email',
  loginHint: '',
  tokenDeliveryMode: 'poll',
  clientAuthMethod: 'client_secret_basic',
  bindingMessage: '',
  userCode: '',
  requestContext: '',
  clientNotificationEndpoint: '',
});

// UI state
const [workerToken, setWorkerToken] = useState<string>('');
const [showWorkerTokenModal, setShowWorkerTokenModal] = useState(false);
const [isLoadingWorkerToken, setIsLoadingWorkerToken] = useState(false);
const [apps, setApps] = useState<Array<{ id: string; name: string; description: string }>>([]);
const [isLoadingApps, setIsLoadingApps] = useState(false);
```

### Handler Functions

#### Get Worker Token
```typescript
const handleGetWorkerToken = useCallback(async () => {
  setIsLoadingWorkerToken(true);
  try {
    const token = await unifiedWorkerTokenService.getToken();
    if (token) {
      setWorkerToken(token);
      toastV8.success('Worker token retrieved successfully');
    } else {
      setShowWorkerTokenModal(true);
    }
  } catch {
    setShowWorkerTokenModal(true);
  } finally {
    setIsLoadingWorkerToken(false);
  }
}, []);
```

#### Get Applications
```typescript
const handleGetApps = useCallback(async () => {
  setIsLoadingApps(true);
  try {
    const applications = await fetchApplications({
      environmentId: credentials.environmentId,
      workerToken: workerToken,
      clientId: credentials.clientId,
      ...(credentials.clientSecret && { clientSecret: credentials.clientSecret }),
    });
    const formattedApps = applications.map((app) => ({
      id: app.id,
      name: app.name,
      description: app.description || 'No description available',
    }));
    setApps(formattedApps);
    toastV8.success(`Found ${formattedApps.length} applications`);
  } catch (error) {
    console.error('Failed to get applications:', error);
    toastV8.error('Failed to get applications');
  } finally {
    setIsLoadingApps(false);
  }
}, [credentials.environmentId, credentials.clientId, credentials.clientSecret, workerToken]);
```

#### Save Configuration
```typescript
const handleSave = async () => {
  try {
    await CredentialsServiceV8.saveCredentials(FLOW_KEY, credentials, {
      flowKey: FLOW_KEY,
      flowType: 'oidc',
      includeClientSecret: true,
      includeRedirectUri: false,
      includeLogoutUri: false,
      includeScopes: true,
    });
    toastV8.success('Configuration saved successfully');
  } catch (error) {
    console.error('Failed to save configuration:', error);
    toastV8.error('Failed to save configuration');
  }
};
```

## CIBA Protocol Flow

### 1. Initiate Authentication
```
Client → PingOne: POST /bc-authorize
  - client_id
  - scope
  - login_hint (or id_token_hint or login_hint_token)
  - binding_message (optional)
  - user_code (optional)
  - requested_expiry (optional)

PingOne → Client: 200 OK
  - auth_req_id
  - expires_in
  - interval (for polling)
```

### 2. User Authentication (Out-of-Band)
```
User receives notification on mobile device
User authenticates and approves/denies request
```

### 3. Token Polling (Poll Mode)
```
Client → PingOne: POST /token
  - grant_type=urn:openid:params:grant-type:ciba
  - auth_req_id
  - client_id
  - client_secret

Responses:
- authorization_pending: Keep polling
- slow_down: Increase interval
- access_denied: User denied
- expired_token: Request expired
- 200 OK: Tokens issued
```

## Token Delivery Modes

### Poll Mode (Default)
- Client polls token endpoint at regular intervals
- Most common and widely supported
- Configurable polling interval and backoff

### Ping Mode
- Server notifies client when authentication complete
- Requires client notification endpoint
- Client then fetches tokens

### Push Mode
- Server pushes tokens directly to client
- Requires client notification endpoint
- Tokens delivered in notification

## Login Hint Options

### login_hint (Simple String)
```typescript
credentials.loginHint = "user@example.com";
// or
credentials.loginHint = "+1234567890";
```

### id_token_hint (Previously Issued ID Token)
```typescript
credentials.idTokenHint = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...";
```

### login_hint_token (Signed JWT)
```typescript
// Must be signed with RS256
// PingOne must trust the signing key
const header = {
  alg: 'RS256',
  typ: 'JWT',
  kid: 'your-key-id'
};

const payload = {
  iss: clientId,
  sub: 'user@example.com',
  aud: `https://auth.pingone.com/${environmentId}`,
  exp: Math.floor(Date.now() / 1000) + 3600,
  iat: Math.floor(Date.now() / 1000),
  login_hint: 'user@example.com'
};

// Sign with your private key
credentials.loginHintToken = signJWT(header, payload, privateKey);
```

## API Endpoints

### POST /api/tokens/store
Stores tokens in unified storage system (IndexedDB primary, SQLite fallback).

**Request:**
```json
{
  "flowKey": "ciba-v9",
  "data": {
    "access_token": "...",
    "id_token": "...",
    "refresh_token": "..."
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token storage acknowledged",
  "flowKey": "ciba-v9"
}
```

### POST /api/generate-login-hint-token
Generates a signed JWT for login_hint_token (demo purposes).

**Request:**
```json
{
  "clientId": "abc123",
  "environmentId": "env-id",
  "loginHint": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "payload": { ... },
  "warning": "This is a DEMO token signed with a temporary key..."
}
```

## Troubleshooting

### Issue: "Token delivery mode must be one of: poll, ping, push"
**Cause:** Token delivery mode field missing or not set
**Solution:** Ensure `tokenDeliveryMode` field exists in form and has a value

### Issue: Import error for toastV9
**Cause:** Incorrect import path
**Solution:** Use `import { toastV8 } from '@/v8/utils/toastNotificationsV8'`

### Issue: Missing header or worker token section
**Cause:** Components not imported or rendered
**Solution:** Ensure all V8 components are imported and included in JSX

### Issue: 404 on /api/tokens/store
**Cause:** API endpoint not loaded or server needs restart
**Solution:** Restart dev server to pick up new API endpoints

### Issue: Duplicate token delivery mode fields
**Cause:** Field added multiple times during development
**Solution:** Search for "Token Delivery Mode" and ensure only one instance

## Testing

### Unit Tests
```bash
npm run test -- CIBAFlowV9
```

### Integration Tests
```bash
# Test CIBA initiation
npm run test:e2e -- --grep "CIBA authentication"

# Test polling behavior
npm run test:e2e -- --grep "CIBA polling"
```

### Manual Testing Checklist
- [ ] Page loads without errors
- [ ] Header displays correctly
- [ ] Worker token section visible
- [ ] Get Worker Token button functional
- [ ] Get Apps button functional
- [ ] All form fields present and functional
- [ ] Token delivery mode dropdown works
- [ ] Login hint type selector works
- [ ] Save button persists configuration
- [ ] Initiate authentication starts flow
- [ ] Polling behavior correct
- [ ] Tokens displayed after authentication
- [ ] Error handling works correctly

## Best Practices

### DO
- ✅ Use unified storage system for credentials
- ✅ Validate all required fields before initiating auth
- ✅ Handle all CIBA error responses appropriately
- ✅ Implement proper polling with backoff
- ✅ Display clear error messages to users
- ✅ Save configuration to localStorage
- ✅ Use worker token for application discovery

### DON'T
- ❌ Modify shared services without considering blast radius
- ❌ Change polling intervals globally
- ❌ Skip validation of required fields
- ❌ Ignore CIBA error responses
- ❌ Hard-code credentials
- ❌ Remove protocol-required fields
- ❌ Break auth_req_id lifecycle

## Deployment

### Pre-Deployment Checklist
- [ ] All tests passing
- [ ] Biome formatting clean
- [ ] No console errors
- [ ] Regression gate passing
- [ ] Documentation updated
- [ ] Inventory updated

### Deployment Steps
1. Run regression check: `./scripts/ciba-regression-check.sh`
2. Build application: `npm run build`
3. Test build: `npm run preview`
4. Deploy to staging
5. Smoke test on staging
6. Deploy to production

## References

### PingOne Documentation
- [CIBA Flow](https://docs.pingidentity.com/ciam/en/client-initiated-backchannel-authentication-flow--ciba-.html)
- [PingOne API](https://developer.pingidentity.com/pingone-api/getting-started/introduction.html)
- [Authentication API](https://apidocs.pingidentity.com/pingone/platform/v1/api/#authentication-apis)

### OpenID Specifications
- [CIBA Core 1.0](https://openid.net/specs/openid-client-initiated-backchannel-authentication-core-1_0.html)
- [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html)

### Internal Documentation
- Inventory: `project/inventory/UNIFIED_CIBA_INVENTORY.md`
- Master Prompts: `master3-prompts.md` (CIBA section)
