# Credential Storage Integration Plan

## Problem Statement

Currently:
- ❌ **Save Button Service** saves credentials with flow-specific keys
- ❌ **ComprehensiveCredentialsService** doesn't load from flow-specific keys
- ❌ **Flows** don't automatically load saved credentials on mount
- ❌ **No integration** between save and load functionality

## Solution Architecture

### 1. Add Credential Loading to ComprehensiveCredentialsService ✅

The service should:
- Load credentials from flow-specific key on mount
- Fall back to global credentials if flow-specific not found
- Integrate with existing `FlowStorageService`
- Call `onCredentialsChange` to populate parent component

### 2. Integration Points

```
┌─────────────────────────────────────────────────────────────┐
│                         Flow Component                       │
│  - Manages credentials state                                │
│  - Passes to ComprehensiveCredentialsService                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              ComprehensiveCredentialsService                 │
│  - Loads credentials on mount (NEW)                         │
│  - Displays credential inputs                               │
│  - Handles credential changes                               │
│  - Integrates with SaveButton                               │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│   FlowStorageService     │  │      SaveButton          │
│  - Load credentials      │  │  - Save credentials      │
│  - Flow-specific keys    │  │  - Show "Saved!"         │
└──────────────────────────┘  └──────────────────────────┘
                    │                   │
                    └─────────┬─────────┘
                              ▼
                    ┌──────────────────┐
                    │   localStorage   │
                    │  flow_credentials│
                    └──────────────────┘
```

## Implementation Steps

### Step 1: Add Auto-Load to ComprehensiveCredentialsService

Add a `useEffect` that loads credentials on mount:

```typescript
// In ComprehensiveCredentialsService
useEffect(() => {
  if (!flowType || !onCredentialsChange) return;
  
  // Load credentials from flow-specific storage
  const loaded = FlowStorageService.loadCredentials(flowType);
  
  if (loaded) {
    console.log(`[ComprehensiveCredentialsService] Auto-loaded credentials for: ${flowType}`);
    onCredentialsChange(loaded);
  }
}, [flowType]); // Only run on mount or flowType change
```

**Benefits:**
- ✅ Automatic credential loading
- ✅ No code changes needed in flows
- ✅ Works with existing flows
- ✅ Backward compatible

### Step 2: Add autoLoad Prop (Optional)

Allow flows to disable auto-loading if needed:

```typescript
interface ComprehensiveCredentialsServiceProps {
  // ... existing props
  autoLoad?: boolean; // Default: true
}

// In component
useEffect(() => {
  if (!flowType || !onCredentialsChange || autoLoad === false) return;
  // ... load logic
}, [flowType, autoLoad]);
```

### Step 3: Import FlowStorageService

Add import at top of ComprehensiveCredentialsService:

```typescript
import { FlowStorageService } from './saveButtonService';
```

### Step 4: Add SaveButton Integration

Add optional SaveButton to the service:

```typescript
interface ComprehensiveCredentialsServiceProps {
  // ... existing props
  showSaveButton?: boolean; // Default: false
}

// In render
{showSaveButton && (
  <SaveButton
    flowType={flowType}
    credentials={resolvedCredentials}
    onSave={saveHandler}
  />
)}
```

## Flow Integration Pattern

### Pattern 1: Minimal Changes (Recommended)

**Flow component stays the same:**
```typescript
const MyFlow: React.FC = () => {
  const [credentials, setCredentials] = useState<StepCredentials>({
    environmentId: '',
    clientId: '',
    // ... defaults
  });

  return (
    <ComprehensiveCredentialsService
      flowType="my-flow-v7"
      credentials={credentials}
      onCredentialsChange={setCredentials}
      showSaveButton={true}  // ← Add this
    />
  );
};
```

**What happens:**
1. Component mounts with empty credentials
2. ComprehensiveCredentialsService loads from `flow_credentials_my-flow-v7`
3. Calls `setCredentials` with loaded data
4. Component re-renders with loaded credentials
5. User can modify and save with SaveButton

### Pattern 2: Explicit Loading

**Flow component loads explicitly:**
```typescript
const MyFlow: React.FC = () => {
  const [credentials, setCredentials] = useState<StepCredentials>({
    environmentId: '',
    clientId: '',
    // ... defaults
  });

  // Load on mount
  useEffect(() => {
    const loaded = FlowStorageService.loadCredentials('my-flow-v7');
    if (loaded) {
      setCredentials(loaded);
    }
  }, []);

  return (
    <ComprehensiveCredentialsService
      flowType="my-flow-v7"
      credentials={credentials}
      onCredentialsChange={setCredentials}
      autoLoad={false}  // ← Disable auto-load
      showSaveButton={true}
    />
  );
};
```

### Pattern 3: Using Hook

**Flow component uses hook:**
```typescript
const MyFlow: React.FC = () => {
  const { save, load, isSaving, saved } = useSaveButton('my-flow-v7');
  const [credentials, setCredentials] = useState<StepCredentials>({
    environmentId: '',
    clientId: '',
    // ... defaults
  });

  // Load on mount
  useEffect(() => {
    const loaded = load();
    if (loaded) {
      setCredentials(loaded);
    }
  }, [load]);

  const handleSave = async () => {
    await save(credentials);
  };

  return (
    <>
      <ComprehensiveCredentialsService
        flowType="my-flow-v7"
        credentials={credentials}
        onCredentialsChange={setCredentials}
        autoLoad={false}
      />
      <button onClick={handleSave} disabled={isSaving}>
        {saved ? 'Saved!' : 'Save'}
      </button>
    </>
  );
};
```

## Recommended Approach: Pattern 1 (Auto-Load)

**Why:**
- ✅ Minimal code changes
- ✅ Works with existing flows
- ✅ Automatic credential loading
- ✅ Integrated SaveButton
- ✅ Consistent behavior

**Implementation:**
1. Update ComprehensiveCredentialsService to auto-load
2. Add `showSaveButton` prop
3. Flows just add `showSaveButton={true}`
4. Done!

## Migration Plan

### Phase 1: Update ComprehensiveCredentialsService ✅

**File:** `src/services/comprehensiveCredentialsService.tsx`

**Changes:**
1. Import `FlowStorageService` and `SaveButton`
2. Add `autoLoad` prop (default: true)
3. Add `showSaveButton` prop (default: false)
4. Add `useEffect` to load credentials on mount
5. Add SaveButton to render (if enabled)

**Code:**
```typescript
// Add imports
import { FlowStorageService, SaveButton } from './saveButtonService';

// Add to props interface
interface ComprehensiveCredentialsServiceProps {
  // ... existing props
  autoLoad?: boolean;
  showSaveButton?: boolean;
}

// Add to component
const ComprehensiveCredentialsService: React.FC<Props> = ({
  // ... existing props
  autoLoad = true,
  showSaveButton = false,
  // ...
}) => {
  // Auto-load credentials on mount
  useEffect(() => {
    if (!flowType || !onCredentialsChange || !autoLoad) return;
    
    const loaded = FlowStorageService.loadCredentials(flowType);
    if (loaded) {
      console.log(`[ComprehensiveCredentialsService] Auto-loaded credentials for: ${flowType}`);
      onCredentialsChange(loaded);
    }
  }, [flowType, onCredentialsChange, autoLoad]);

  // ... rest of component

  return (
    <CollapsibleHeader {...headerProps}>
      {/* ... existing content */}
      
      {/* Add SaveButton at bottom */}
      {showSaveButton && (
        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
          <SaveButton
            flowType={flowType}
            credentials={resolvedCredentials}
            onSave={saveHandler}
          />
        </div>
      )}
    </CollapsibleHeader>
  );
};
```

### Phase 2: Update Configuration Page ✅ DONE

Already updated to use SaveButton.

### Phase 3: Update Flows (One by One)

For each flow using ComprehensiveCredentialsService:

**Before:**
```typescript
<ComprehensiveCredentialsService
  flowType="oauth-authorization-code-v7"
  credentials={credentials}
  onCredentialsChange={setCredentials}
/>
```

**After:**
```typescript
<ComprehensiveCredentialsService
  flowType="oauth-authorization-code-v7"
  credentials={credentials}
  onCredentialsChange={setCredentials}
  showSaveButton={true}  // ← Add this line
/>
```

**That's it!** The service will:
- Auto-load credentials on mount
- Display SaveButton
- Save with flow-specific key
- Show "Saved!" feedback

### Phase 4: Test Each Flow

For each updated flow:
1. Navigate to flow
2. Verify credentials auto-load (if previously saved)
3. Modify credentials
4. Click "Save Configuration"
5. Verify "Saved!" appears for 10 seconds
6. Refresh page
7. Verify credentials still loaded

## Flows to Update

### High Priority (Most Used)
1. ✅ Configuration Page (DONE)
2. OAuth Authorization Code V7
3. OIDC Hybrid V7
4. Device Authorization V7
5. Client Credentials V7

### Medium Priority
6. Implicit OAuth V7
7. Implicit OIDC V7
8. CIBA V7
9. PAR V7
10. RAR V7

### Low Priority
11. Worker Token V7
12. JWT Bearer V7
13. SAML Bearer V7
14. ROPC V7
15. Token Exchange V7
16. DPoP V7

## Storage Key Reference

| Flow | Flow Type | Storage Key |
|------|-----------|-------------|
| Configuration | `configuration` | `flow_credentials_configuration` |
| OAuth Authz Code V7 | `oauth-authorization-code-v7` | `flow_credentials_oauth-authorization-code-v7` |
| OIDC Authz Code V7 | `oidc-authorization-code-v7` | `flow_credentials_oidc-authorization-code-v7` |
| OIDC Hybrid V7 | `oidc-hybrid-v7` | `flow_credentials_oidc-hybrid-v7` |
| Device Authz V7 | `device-authorization-v7` | `flow_credentials_device-authorization-v7` |
| Client Credentials V7 | `client-credentials-v7` | `flow_credentials_client-credentials-v7` |
| Implicit OAuth V7 | `implicit-oauth-v7` | `flow_credentials_implicit-oauth-v7` |
| Implicit OIDC V7 | `implicit-oidc-v7` | `flow_credentials_implicit-oidc-v7` |
| CIBA V7 | `ciba-v7` | `flow_credentials_ciba-v7` |
| PAR V7 | `par-v7` | `flow_credentials_par-v7` |
| RAR V7 | `rar-v7` | `flow_credentials_rar-v7` |

## Benefits

### For Users
- ✅ Credentials automatically loaded
- ✅ No need to re-enter credentials
- ✅ Consistent save experience
- ✅ Clear "Saved!" feedback

### For Developers
- ✅ Minimal code changes
- ✅ One-line addition per flow
- ✅ Automatic integration
- ✅ Consistent pattern

### For the App
- ✅ Credential isolation per flow
- ✅ Backward compatible
- ✅ Centralized logic
- ✅ Easy to maintain

## Testing Checklist

### Test Auto-Load
- [ ] Navigate to flow
- [ ] Verify empty credentials initially
- [ ] Save credentials
- [ ] Refresh page
- [ ] Verify credentials auto-loaded

### Test Save
- [ ] Modify credentials
- [ ] Click "Save Configuration"
- [ ] Verify "Saving..." appears
- [ ] Verify "Saved!" appears
- [ ] Wait 10 seconds
- [ ] Verify button resets

### Test Isolation
- [ ] Save credentials in Flow A
- [ ] Navigate to Flow B
- [ ] Verify Flow B has different/empty credentials
- [ ] Save credentials in Flow B
- [ ] Navigate back to Flow A
- [ ] Verify Flow A credentials unchanged

### Test Fallback
- [ ] Clear flow-specific storage
- [ ] Keep global credentials
- [ ] Refresh page
- [ ] Verify global credentials loaded

## Next Steps

### Immediate (This Session)
1. ✅ Create integration plan (this document)
2. Update ComprehensiveCredentialsService
3. Test with Configuration page
4. Verify auto-load works

### Short Term (Next Session)
1. Update OAuth Authorization Code V7
2. Update OIDC Hybrid V7
3. Update Device Authorization V7
4. Test thoroughly

### Long Term (Future)
1. Update all remaining flows
2. Add auto-save option
3. Add unsaved changes indicator
4. Add export/import functionality

## Summary

✅ **Auto-load in ComprehensiveCredentialsService** - Loads credentials on mount
✅ **SaveButton integration** - Optional save button in service
✅ **Flow-specific storage** - Each flow isolated
✅ **Minimal changes** - One line per flow
✅ **Backward compatible** - Falls back to global credentials
✅ **Comprehensive plan** - Clear migration path

The integration is designed to be seamless, requiring minimal changes to existing flows while providing automatic credential loading and saving functionality.
