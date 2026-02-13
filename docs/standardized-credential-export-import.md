# Standardized Credential Export/Import for Production Apps

## Overview

All Production menu group apps now use a standardized credential export/import format to ensure users don't need multiple JSON files for different apps. The format is consistent across all apps and supports backward compatibility.

## Standard Format

```json
{
  "version": "1.0.0",
  "exportDate": "2026-01-16T21:43:35.125Z",
  "appName": "App Name",
  "appType": "oauth|worker-token|mfa|protect-portal|token-monitoring|api-status",
  "credentials": {
    "environmentId": "b9817c16-9910-4415-b67e-4ac687da74d9",
    "clientId": "66a4686b-9222-4ad2-91b6-03113711c9aa",
    "clientSecret": "3D_ksu7589TfcVJm2fqEHjXuhc-DCRfoxEv0urEw8GIK7qiJe72n92WRQ0uaT2tC",
    "scopes": ["openid"],
    "region": "us",
    "authMethod": "client_secret_basic"
  },
  "metadata": {
    "flowType": "authorization_code",
    "specVersion": "oidc-core-1.0",
    "environment": "b9817c16-9910-4415-b67e-4ac687da74d9",
    "additionalData": {}
  }
}
```

## Implementation Files

### 1. Core Service
- **`src/services/standardizedCredentialExportService.ts`**
  - Main export/import functions
  - Backward compatibility with old format
  - Type definitions

### 2. React Component
- **`src/components/StandardizedCredentialExportImport.tsx`**
  - Reusable export/import buttons
  - Consistent UI across all apps
  - Error handling and validation

### 3. Helper Utility
- **`src/utils/productionAppCredentialHelper.ts`**
  - App-specific configurations
  - Helper functions for each Production app
  - Credential loading/saving logic

## Apps Using Standardized Format

### ✅ Already Implemented
1. **Worker Token Modal** - Uses existing `credentialExportImportService.ts`
2. **Unified OAuth & OIDC** - Added to credentials form
3. **Unified MFA** - Added to device registration form

### 📋 Planned Implementation
4. **API Status** - Add to configuration section
5. **Flow Comparison Tool** - Add to credentials section
6. **Resources API Tutorial** - Add to credentials form
7. **SPIFFE/SPIRE Mock** - Add to configuration
8. **Postman Collection Generator** - Add to credentials section
9. **Delete All Devices** - Add to utility section
10. **Enhanced State Management** - Add to settings
11. **Token Monitoring Dashboard** - Already has export/import
12. **Protect Portal App** - Add to admin settings

## Usage Example

```tsx
import { StandardizedCredentialExportImport } from '@/components/StandardizedCredentialExportImport';

<StandardizedCredentialExportImport
  appName="My App"
  appType="oauth"
  credentials={credentials}
  metadata={{
    flowType: 'authorization_code',
    environment: credentials.environmentId
  }}
  onExport={() => console.log('Exported')}
  onImport={(imported) => {
    console.log('Imported:', imported);
    // Handle imported credentials
  }}
  onError={(error) => console.error('Error:', error)}
/>
```

## Backward Compatibility

The import function automatically detects and converts the old format:
```json
// Old format (still supported)
{
  "version": "1.0.0",
  "exportDate": "2026-01-16T21:43:35.125Z",
  "workerToken": { ... }
}

// Automatically converted to new format
{
  "version": "1.0.0",
  "exportDate": "2026-01-16T21:43:35.125Z",
  "appName": "Worker Token",
  "appType": "worker-token",
  "credentials": { ... },
  "metadata": { }
}
```

## Benefits

1. **Single JSON File** - Users only need one credential file for all apps
2. **Consistent Format** - Same structure across all Production apps
3. **Backward Compatible** - Old credential files still work
4. **Type Safety** - Full TypeScript support
5. **Easy Integration** - Simple component for any app to use
6. **Metadata Support** - Additional context for each app

## File Naming Convention

Exported files follow the pattern:
```
pingone-{app-name}-credentials-YYYY-MM-DD.json
```

Examples:
- `pingone-unified-oauth-oidc-credentials-2026-02-13.json`
- `pingone-unified-mfa-credentials-2026-02-13.json`
- `pingone-worker-token-credentials-2026-02-13.json`
