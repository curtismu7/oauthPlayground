# Client Credentials Flow V5 - Refactoring Notes

## Current Issues
1. Uses local `formData` state instead of credentialManager
2. Custom form inputs instead of CredentialsInput component
3. Missing FlowWalkthrough component
4. Missing PingOneApplicationConfig component
5. Doesn't match V5 pattern used in other flows

## Changes Needed

### 1. Update Imports
```typescript
import CredentialsInput from '../../components/CredentialsInput';
import FlowWalkthrough from '../../components/FlowWalkthrough';
import PingOneApplicationConfig from '../../components/PingOneApplicationConfig';
import { credentialManager } from '../../utils/credentialManager';
```

### 2. Replace Local State with Credential Manager
Replace lines 395-409 (formData state) with:
```typescript
const [credentials, setCredentials] = useState(() => credentialManager.getCredentials());
const [pingOneConfig, setPingOneConfig] = useState<PingOneApplicationState>({
  useGlobalConfig: false,
  showCredentialsModal: false,
});
const [copiedField, setCopiedField] = useState<string | null>(null);
```

### 3. Add Credential Handlers
```typescript
const handleFieldChange = useCallback((field: string, value: string) => {
  setCredentials(prev => ({ ...prev, [field]: value }));
}, []);

const handleSaveConfiguration = useCallback(() => {
  credentialManager.saveCredentials(credentials);
  v4ToastManager.showSuccess('Configuration saved!');
}, [credentials]);

const handleCopy = useCallback((field: string, value: string) => {
  navigator.clipboard.writeText(value);
  setCopiedField(field);
  setTimeout(() => setCopiedField(null), 2000);
}, []);
```

### 4. Replace Configuration Section (lines 503-670)
Replace custom form with:
```typescript
<PingOneApplicationConfig 
  value={pingOneConfig} 
  onChange={setPingOneConfig} 
/>

<CredentialsInput
  environmentId={credentials.environmentId || ''}
  clientId={credentials.clientId || ''}
  clientSecret={credentials.clientSecret || ''}
  scopes={credentials.scopes || credentials.scope || ''}
  onEnvironmentIdChange={(value) => handleFieldChange('environmentId', value)}
  onClientIdChange={(value) => handleFieldChange('clientId', value)}
  onClientSecretChange={(value) => handleFieldChange('clientSecret', value)}
  onScopesChange={(value) => handleFieldChange('scopes', value)}
  onCopy={handleCopy}
  copiedField={copiedField}
/>
```

### 5. Add FlowWalkthrough (after overview section)
```typescript
<FlowWalkthrough
  title="Client Credentials Flow Walkthrough"
  icon={<FiServer size={24} />}
  steps={[
    { title: 'Application authenticates with client credentials' },
    { title: 'Token endpoint validates credentials' },
    { title: 'Access token is returned' },
    { title: 'Application uses token to access APIs' },
  ]}
/>
```

## Files to Reference
- `/src/pages/flows/OAuthAuthorizationCodeFlowV5.tsx` - Best example of V5 pattern
- `/src/components/CredentialsInput.tsx` - Shared credential input component
- `/src/components/PingOneApplicationConfig.tsx` - PingOne config component
- `/src/utils/credentialManager.ts` - Credential management service

## Testing Checklist
- [ ] Credentials load from credentialManager on mount
- [ ] Save Configuration button persists to credentialManager
- [ ] Copy buttons work for all fields
- [ ] PingOne config toggles work
- [ ] Flow walkthrough displays correctly
- [ ] Token exchange uses saved credentials
