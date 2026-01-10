# MFA FIDO2 Restore Document

**Last Updated:** 2026-01-27  
**Version:** 1.0.0  
**Purpose:** Implementation details for restoring the FIDO2 flow if it breaks or drifts  
**Usage:** Use this document to restore correct implementations when FIDO2 flows break or regress

---

## Related Documentation

- [MFA FIDO2 UI Contract](./MFA_FIDO2_UI_CONTRACT.md) - UI behavior contracts
- [MFA FIDO2 UI Documentation](./MFA_FIDO2_UI_DOC.md) - Complete UI structure
- [MFA FIDO2 Master Document](./MFA_FIDO2_MASTER.md) - FIDO2 flow patterns and API details

---

## Overview

This document provides implementation details, code snippets, and restoration guidance for the FIDO2 MFA flow (`FIDO2FlowV8.tsx` and `FIDO2ConfigurationPageV8.tsx`).

---

## File Locations

**Components:**
- `src/v8/flows/types/FIDO2FlowV8.tsx` - Main FIDO2 flow component
- `src/v8/flows/types/FIDO2ConfigurationPageV8.tsx` - FIDO2 configuration page
- `src/v8/pages/FIDO2RegistrationDocsPageV8.tsx` - FIDO2 documentation page

**Controllers:**
- `src/v8/flows/controllers/FIDO2FlowController.ts` - FIDO2 flow business logic

**Services:**
- `src/v8/services/mfaServiceV8.ts` - MFA API calls
- `src/v8/services/mfaAuthenticationServiceV8.ts` - MFA authentication calls

---

## Critical Implementation Details

### 1. Environment ID Loading (CRITICAL FIX - 2026-01-27)

**Issue:** FIDO2 policies not showing because `environmentId` is empty when `loadFido2Policies` is called.

**Root Cause:** `FIDO2ConfigurationPageV8.tsx` only loads `environmentId` from `EnvironmentIdServiceV8.getEnvironmentId()`, which may be empty. Other MFA configuration pages load it from `CredentialsServiceV8.loadCredentials('mfa-flow-v8', ...)` which includes the environment ID from worker token credentials.

**Correct Implementation:**
```typescript
// In FIDO2ConfigurationPageV8.tsx
import { CredentialsServiceV8 } from '@/v8/services/credentialsServiceV8';

// Load environment ID from multiple sources
useEffect(() => {
    // Try EnvironmentIdServiceV8 first
    let envId = EnvironmentIdServiceV8.getEnvironmentId();
    
    // Fallback to worker token credentials if not found
    if (!envId) {
        try {
            const credentials = workerTokenServiceV8.loadCredentials();
            envId = credentials?.environmentId?.trim() || '';
        } catch {
            // Ignore errors
        }
    }
    
    // Fallback to MFA flow credentials if still not found
    if (!envId) {
        try {
            const stored = CredentialsServiceV8.loadCredentials('mfa-flow-v8', {
                flowKey: 'mfa-flow-v8',
                flowType: 'oidc',
                includeClientSecret: false,
                includeRedirectUri: false,
                includeLogoutUri: false,
                includeScopes: false,
            });
            envId = stored.environmentId?.trim() || '';
        } catch {
            // Ignore errors
        }
    }
    
    if (envId) {
        setEnvironmentId(envId);
    }
}, []);
```

**Incorrect Implementation (DO NOT DO THIS):**
```typescript
// ❌ WRONG: Only checks EnvironmentIdServiceV8
useEffect(() => {
    const envId = EnvironmentIdServiceV8.getEnvironmentId();
    if (envId) {
        setEnvironmentId(envId);
    }
}, []);
// This will fail if EnvironmentIdServiceV8 returns empty string,
// even though environmentId exists in worker token credentials
```

**Symptoms:**
- FIDO2 policies don't load/show up
- "No FIDO2 policies found" message appears even with valid worker token
- `loadFido2Policies` function returns early due to empty `environmentId`
- Logs show: `{"hasEnvironmentId":false,"hasToken":true}`

**Verification:**
Check logs for early return:
```json
{"location":"FIDO2ConfigurationPageV8.tsx:207","message":"Early return - missing prerequisites","data":{"hasEnvironmentId":false,"hasToken":true}}
```

---

### 2. FIDO2 Policy Loading Function

**Contract:** Must handle multiple API response structures and provide fallback environment ID sources.

**Correct Implementation:**
```typescript
// In FIDO2ConfigurationPageV8.tsx
const loadFido2Policies = useCallback(async () => {
    if (!environmentId || !tokenStatus.isValid) {
        return; // Early return if prerequisites missing
    }

    setIsLoadingPolicies(true);
    setPoliciesError(null);

    try {
        const workerToken = await workerTokenServiceV8.getToken();
        if (!workerToken) {
            throw new Error('Worker token not found');
        }

        const credentialsData = await workerTokenServiceV8.loadCredentials();
        const region = credentialsData?.region || 'na';

        const params = new URLSearchParams({
            environmentId,
            workerToken: workerToken.trim(),
            region,
        });

        const response = await fetch(`/api/pingone/mfa/fido2-policies?${params.toString()}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(
                errorData.message ||
                errorData.error ||
                `Failed to load FIDO2 policies: ${response.status} ${response.statusText}`
            );
        }

        const data = await response.json();
        
        // Handle different response structures
        let policiesList: Array<{ id: string; name: string; default?: boolean; description?: string }> = [];
        
        if (Array.isArray(data)) {
            policiesList = data;
        } else if (data._embedded?.fido2Policies) {
            policiesList = data._embedded.fido2Policies;
        } else if (data._embedded && Array.isArray(data._embedded)) {
            policiesList = data._embedded;
        } else if (data.items && Array.isArray(data.items)) {
            policiesList = data.items;
        } else {
            // Try to extract any array from the response
            const keys = Object.keys(data);
            for (const key of keys) {
                if (Array.isArray(data[key])) {
                    policiesList = data[key];
                    break;
                }
            }
        }

        setFido2Policies(policiesList);
        setPoliciesError(null);

        // Auto-select default policy
        if (policiesList.length > 0) {
            const defaultPolicy =
                policiesList.find((p: { default?: boolean }) => p.default) || policiesList[0];
            if (defaultPolicy.id) {
                setSelectedFido2PolicyId(defaultPolicy.id);
            }
        }
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : 'Failed to load FIDO2 policies';
        setPoliciesError(errorMessage);
        setFido2Policies([]);
    } finally {
        setIsLoadingPolicies(false);
    }
}, [environmentId, tokenStatus.isValid]);
```

---

### 3. FIDO2 Flow Policy Loading

**Contract:** `FIDO2FlowV8.tsx` must also check multiple sources for environment ID.

**Correct Implementation:**
```typescript
// In FIDO2FlowV8.tsx
const fetchFido2Policies = useCallback(async () => {
    const storedCredentials = CredentialsServiceV8.loadCredentials('mfa-flow-v8', {
        flowKey: 'mfa-flow-v8',
        flowType: 'oidc',
        includeClientSecret: false,
        includeRedirectUri: false,
        includeLogoutUri: false,
        includeScopes: false,
    });
    const envId = storedCredentials.environmentId?.trim();
    const tokenValid = WorkerTokenStatusServiceV8.checkWorkerTokenStatus().isValid;
    
    if (!envId || !tokenValid) {
        setFido2Policies([]);
        setFido2PoliciesError(null);
        lastFetchedFido2EnvIdRef.current = null;
        return;
    }

    // Prevent duplicate calls
    if (isFetchingFido2PoliciesRef.current || lastFetchedFido2EnvIdRef.current === envId) {
        return;
    }

    // ... rest of policy loading logic
}, []);
```

**Note:** `FIDO2FlowV8.tsx` already loads from `CredentialsServiceV8`, which is correct. The issue was only in `FIDO2ConfigurationPageV8.tsx`.

---

## Postman Collection Downloads

### Overview

The MFA documentation page provides a **Postman Collection** download feature that generates a complete Postman collection JSON file with all API calls from the FIDO2 device registration/authentication flow.

### Collection Format

The generated Postman collection follows the [PingOne Postman Environment Template](https://apidocs.pingidentity.com/pingone/platform/v1/api/#the-pingone-postman-environment-template) format:

- **URL Format**: `{{authPath}}/{{envID}}/deviceAuthentications`, `{{apiPath}}/environments/{{envID}}/fido2Policies`
- **Variables**: Pre-configured with values from credentials
- **Headers**: Automatically set (Content-Type, Authorization with worker token)
- **Request Bodies**: Pre-filled with example data

### Variables Included

- `authPath`: `https://auth.pingone.com`
- `apiPath`: `https://api.pingone.com`
- `envID`: Environment ID from credentials
- `workerToken`: Worker token for API authentication
- `userId`: User ID (extracted from API responses)
- `deviceId`: Device ID (extracted from API responses)
- `deviceAuthenticationId`: Device authentication ID (extracted from API responses)
- `fido2PolicyId`: FIDO2 policy ID

---

## Troubleshooting

### FIDO2 Policies Not Showing

**Symptoms:**
- Policies dropdown is empty
- "No FIDO2 policies found" message
- "Loading policies..." never completes

**Debug Steps:**
1. Check browser console for errors
2. Verify worker token is valid and has `p1:read:fido2Policy` scope
3. Verify environment ID is loaded (check logs for `hasEnvironmentId: false`)
4. Check network tab for `/api/pingone/mfa/fido2-policies` request
5. Verify API response structure matches expected format

**Fix:**
- Ensure `environmentId` is loaded from multiple sources (see Critical Implementation Detail #1)
- Verify `loadFido2Policies` is not returning early due to empty `environmentId`
- Check that worker token credentials contain `environmentId`

---

## Common Issues and Fixes

### Issue: Policies Load But Don't Appear in Dropdown

**Cause:** Response structure doesn't match expected format.

**Fix:** Ensure parsing logic handles all response structures (direct array, `_embedded.fido2Policies`, `items`, etc.)

### Issue: "Worker token not found" Error

**Cause:** Worker token not configured or expired.

**Fix:** Generate a new worker token using the "Manage Token" button.

### Issue: Policies Load But Can't Select

**Cause:** `selectedFido2PolicyId` state not updating.

**Fix:** Verify `setSelectedFido2PolicyId` is called after policies load, and check that policy IDs are valid strings.

---

## Related Files

- `src/v8/flows/types/FIDO2ConfigurationPageV8.tsx` - Configuration page
- `src/v8/flows/types/FIDO2FlowV8.tsx` - Registration/authentication flow
- `src/v8/services/mfaServiceV8.ts` - MFA API service
- `server.js` - Backend FIDO2 policy endpoint (`/api/pingone/mfa/fido2-policies`)
