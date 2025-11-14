# V7 Flow Storage Keys - Conflict Prevention

## ✅ **All V7 Flows Have Unique Storage Keys**

| Flow Name | Storage Key | Status |
|-----------|-------------|---------|
| **OAuth Authorization Code Flow V7** | `oauth-authorization-code-v7` | ✅ Unique |
| **OIDC Hybrid Flow V7** | `hybrid-flow-v7` | ✅ Unique |
| **Client Credentials Flow V7** | `client-credentials-v7` | ✅ Unique |
| **Implicit Flow V7** | `implicit-v7` | ✅ Unique |
| **Device Authorization Flow V7** | `device-authorization-v7` | ✅ Unique |
| **PingOne PAR Flow V7** | `pingone-par-flow-v7` | ✅ Unique |

## 🔄 **Dual Storage System**

Each flow uses **two separate storage systems**:

### 1. **Primary Browser Storage** (FlowCredentialService)
- **Key Pattern**: `{flowKey}-credentials`
- **Purpose**: Main credential storage for flow operation
- **Contains**: Complete credentials including secrets
- **Example**: `oauth-authorization-code-v7-credentials`

### 2. **Backup Storage** (CredentialBackupService)
- **Key Pattern**: `V7_CREDENTIAL_BACKUP_{flowKey}`
- **Purpose**: Non-sensitive credential backup
- **Contains**: Only non-sensitive data (no secrets)
- **Example**: `V7_CREDENTIAL_BACKUP_oauth-authorization-code-v7`

## 🛡️ **Conflict Prevention Measures**

### ✅ **Unique Flow Keys**
- Each V7 flow has a distinct `flowKey`
- No two flows share the same storage namespace
- Clear separation between OAuth and OIDC variants

### ✅ **Consistent Implementation**
- All flows use `FlowCredentialService.saveFlowCredentials()`
- All flows use `FlowCredentialService.clearFlowState()`
- All flows use `useCredentialBackup` hook
- All flows clear backup on reset

### ✅ **Storage Isolation**
- Each flow's credentials are stored independently
- No cross-flow credential contamination
- Dedicated reset functionality per flow

## 📊 **Storage Key Verification**

```typescript
// Example storage keys for OAuth Authorization Code Flow V7:
const primaryStorageKey = 'oauth-authorization-code-v7-credentials';
const backupStorageKey = 'V7_CREDENTIAL_BACKUP_oauth-authorization-code-v7';

// Example storage keys for OIDC Hybrid Flow V7:
const primaryStorageKey = 'hybrid-flow-v7-credentials';
const backupStorageKey = 'V7_CREDENTIAL_BACKUP_hybrid-flow-v7';
```

## 🎯 **Benefits**

- **No Storage Conflicts**: Each flow maintains its own isolated storage
- **Independent Operation**: Flows can run simultaneously without interference
- **Clean Resets**: Each flow can be reset without affecting others
- **Backup Safety**: Non-sensitive credentials are preserved across browser storage clears
- **Security**: Sensitive credentials are never backed up

## ✅ **Verification Complete**

All V7 flows have been verified to use unique storage keys with no conflicts. The dual storage system ensures both normal operation and backup functionality work independently for each flow.
