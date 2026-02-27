# Plan: Create OauthPlaygroundPolicy from Default Policy

## Overview
Extract the "Default" Device Authentication Policy from PingOne and create a new policy called "OauthPlaygroundPolicy" based on it. This allows the OAuth Playground app to have its own dedicated MFA policy without modifying the system default.

## Reference Documentation
- [PingOne MFA Device Authentication Policies API](https://apidocs.pingidentity.com/pingone/mfa/v1/api/#device-authentication-policies)

## Phase 1: Backend API Endpoints (server.js)

### 1.1 Read All Device Authentication Policies
- **Endpoint**: `GET /api/pingone/mfa/device-authentication-policies`
- **Purpose**: List all policies to find the "Default" policy
- **Status**: ✅ Already exists (line 7434 in server.js)
- **Action**: Verify it works correctly

### 1.2 Read Single Policy by Name
- **Endpoint**: `GET /api/pingone/mfa/device-authentication-policies/by-name/:name`
- **Purpose**: Find a specific policy by name (e.g., "Default")
- **Implementation**:
  - Call existing read-all endpoint
  - Filter policies by `name` field
  - Return the matching policy or 404 if not found
- **Request**: `{ environmentId, workerToken }` (query params)
- **Response**: Single policy object

### 1.3 Create Policy from Template
- **Endpoint**: `POST /api/pingone/mfa/device-authentication-policies/create-from-template`
- **Purpose**: Create a new policy based on an existing policy
- **Request Body**:
  ```json
  {
    "environmentId": "string",
    "workerToken": "string",
    "templatePolicyId": "string",  // ID of Default policy
    "newPolicyName": "OauthPlaygroundPolicy",
    "description": "Optional description",
    "customSettings": {
      // Optional overrides for specific policy fields
      "pairingDisabled": false,
      "promptForNicknameOnPairing": true,
      "skipUserLockVerification": false
    }
  }
  ```
- **Implementation Steps**:
  1. Validate required fields
  2. Read the template policy (Default) using existing read endpoint
  3. Clone the policy object
  4. Remove system fields: `id`, `createdAt`, `updatedAt`, `_links`
  5. Set `name` to "OauthPlaygroundPolicy"
  6. Optionally merge `customSettings` into the policy object
  7. POST to PingOne API: `POST /v1/environments/{envID}/deviceAuthenticationPolicies`
  8. Return the created policy with its new ID
- **Error Handling**:
  - Template policy not found
  - Policy name already exists
  - Invalid custom settings
  - PingOne API errors

## Phase 2: Frontend Service (mfaServiceV8.ts)

### 2.1 Add Service Methods

#### `getAllDeviceAuthenticationPolicies(environmentId: string)`
- Calls backend: `GET /api/pingone/mfa/device-authentication-policies`
- Returns: Array of all policies
- Purpose: List all available policies

#### `getDeviceAuthenticationPolicyByName(environmentId: string, name: string)`
- Calls backend: `GET /api/pingone/mfa/device-authentication-policies/by-name/${name}`
- Returns: Single policy object or null
- Purpose: Find Default policy specifically

#### `createPolicyFromTemplate(params: CreatePolicyFromTemplateParams)`
- Calls backend: `POST /api/pingone/mfa/device-authentication-policies/create-from-template`
- Parameters:
  ```typescript
  interface CreatePolicyFromTemplateParams {
    environmentId: string;
    templatePolicyId: string;
    newPolicyName: string;
    description?: string;
    customSettings?: Partial<DeviceAuthenticationPolicy>;
  }
  ```
- Returns: Created policy object with new ID
- Purpose: Create OauthPlaygroundPolicy from Default

## Phase 3: UI Integration (MFAConfigurationPageV8.tsx)

### 3.1 Add New Section: "Device Authentication Policy Management"

**Location**: Add after "PingOne MFA Settings" section

**UI Components**:
1. **Section Header**:
   - Title: "Device Authentication Policy"
   - Description: "Create a dedicated policy for OAuth Playground based on the Default policy"
   - Info button with educational content

2. **Current Policy Display** (Read-only):
   - Show Default policy details if found:
     - Policy Name: "Default"
     - Policy ID: (display)
     - Status: Active/Inactive
     - Created Date
   - Show message if Default policy not found

3. **Create New Policy Section**:
   - Input field: Policy Name (default: "OauthPlaygroundPolicy", editable)
   - Input field: Description (optional)
   - Checkbox: "Use custom settings from config page" (optional, Phase 4)
   - Button: "Create OauthPlaygroundPolicy from Default"
     - Disabled if:
       - No Default policy found
       - Policy name already exists
       - Environment ID missing
     - Shows loading state during creation

4. **Created Policy Display** (if exists):
   - Show OauthPlaygroundPolicy details:
     - Policy Name: "OauthPlaygroundPolicy"
     - Policy ID: (display, copyable)
     - Status: Active
     - Created Date
   - Button: "View Policy Details" (opens modal or navigates to policy page)

5. **Confirmation Modal**:
   - Triggered before policy creation
   - Title: "Create OauthPlaygroundPolicy?"
   - Message: "This will create a new Device Authentication Policy based on the Default policy. Continue?"
   - Buttons: "Cancel", "Create Policy"

6. **Success/Error Feedback**:
   - Success toast: "OauthPlaygroundPolicy created successfully! Policy ID: {id}"
   - Error toast: Show specific error message
   - Update UI to show created policy

### 3.2 Settings Mapping (Optional - Phase 4)

**Note**: Most settings on `/v8/mfa-config` are environment-level (MFA Settings), not policy-level. Only map settings that belong to Device Authentication Policies.

**Mappable Settings**:
- `pairingDisabled`: From pairing settings (if applicable)
- `promptForNicknameOnPairing`: From pairing settings
- `skipUserLockVerification`: From lockout settings
- Device selection behavior
- FIDO2-specific settings (if any)

**Implementation**:
- Add checkbox: "Apply settings from config page"
- When checked, show which settings will be applied
- Map config page values to policy fields
- Merge into `customSettings` object when creating policy

## Phase 4: Implementation Details

### 4.1 Policy Extraction Logic

```javascript
// Pseudo-code for finding Default policy
async function findDefaultPolicy(environmentId, workerToken) {
  const allPolicies = await getAllDeviceAuthenticationPolicies(environmentId, workerToken);
  
  // Try to find by name first
  let defaultPolicy = allPolicies.find(p => p.name === "Default");
  
  // If not found, try by default flag
  if (!defaultPolicy) {
    defaultPolicy = allPolicies.find(p => p.default === true);
  }
  
  // If still not found, try case-insensitive
  if (!defaultPolicy) {
    defaultPolicy = allPolicies.find(p => 
      p.name.toLowerCase() === "default"
    );
  }
  
  return defaultPolicy;
}
```

### 4.2 Policy Creation Logic

```javascript
// Pseudo-code for creating policy from template
async function createPolicyFromTemplate(templatePolicy, newName, customSettings) {
  // Clone the template policy
  const newPolicy = { ...templatePolicy };
  
  // Remove system fields
  delete newPolicy.id;
  delete newPolicy.createdAt;
  delete newPolicy.updatedAt;
  delete newPolicy._links;
  
  // Set new name
  newPolicy.name = newName;
  
  // Apply custom settings if provided
  if (customSettings) {
    Object.assign(newPolicy, customSettings);
  }
  
  // Create via PingOne API
  const response = await fetch(
    `https://api.pingone.com/v1/environments/${envId}/deviceAuthenticationPolicies`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${workerToken}`
      },
      body: JSON.stringify(newPolicy)
    }
  );
  
  return await response.json();
}
```

### 4.3 Error Handling

**Policy Not Found**:
- Check if Default policy exists before showing create button
- Show helpful message: "Default policy not found. Please ensure your environment has a Default Device Authentication Policy."

**Policy Already Exists**:
- Before creation, check if "OauthPlaygroundPolicy" already exists
- If exists, show message: "OauthPlaygroundPolicy already exists. Policy ID: {id}"
- Option to update existing policy (future enhancement)

**Invalid Settings**:
- Validate custom settings against policy schema
- Show specific validation errors

**API Errors**:
- Handle 400 Bad Request (invalid policy structure)
- Handle 403 Forbidden (insufficient permissions)
- Handle 409 Conflict (policy name already exists)
- Show user-friendly error messages

## Phase 5: Testing Checklist

### 5.1 Backend Testing
- [ ] Read all policies endpoint returns correct data
- [ ] Read policy by name finds Default policy correctly
- [ ] Read policy by name returns 404 for non-existent policy
- [ ] Create policy from template successfully creates new policy
- [ ] Created policy has correct name "OauthPlaygroundPolicy"
- [ ] Created policy excludes system fields (id, createdAt, etc.)
- [ ] Custom settings are correctly merged into new policy
- [ ] Error handling works for all error cases

### 5.2 Frontend Testing
- [ ] Service methods correctly call backend endpoints
- [ ] Error handling in service methods
- [ ] UI displays Default policy information correctly
- [ ] UI shows appropriate message when Default policy not found
- [ ] Create button is disabled when appropriate
- [ ] Confirmation modal appears before creation
- [ ] Success toast shows correct policy ID
- [ ] Error toast shows helpful error messages
- [ ] Created policy is displayed after successful creation

### 5.3 Integration Testing
- [ ] Full flow: Find Default → Create OauthPlaygroundPolicy → Verify creation
- [ ] Verify new policy can be used in MFA flows
- [ ] Verify Default policy is unchanged
- [ ] Test with different environment configurations

## Phase 6: Considerations & Decisions

### 6.1 Policy vs Environment Settings

**Important Distinction**:
- **Environment-level settings** (MFA Settings API): Apply to all policies
  - Pairing settings (max devices, key format, timeout)
  - Lockout settings (failure count, duration)
  - OTP settings (length, validity)
  
- **Policy-level settings** (Device Authentication Policies API): Apply to specific policy
  - `pairingDisabled`: Whether pairing is allowed
  - `promptForNicknameOnPairing`: Whether to prompt for nickname
  - `skipUserLockVerification`: Whether to check user lock status
  - Device selection behavior
  - FIDO2-specific settings
  - Allowed device types

**Decision**: Only map settings that are actually policy-level. Environment-level settings should remain in MFA Settings.

### 6.2 Minimal vs Full Implementation

**Minimal Approach (Recommended for First Iteration)**:
- ✅ Phase 1: Backend endpoints only
- ✅ Phase 2: Basic frontend service methods
- ✅ Phase 3: Simple UI button to create policy
- ❌ Phase 4: Settings mapping (defer to later)

**Full Approach**:
- All phases including settings mapping
- More complex but more feature-complete

**Recommendation**: Start with minimal approach, add settings mapping in Phase 4 if needed.

### 6.3 Safety Measures

1. **Existence Check**: Verify "OauthPlaygroundPolicy" doesn't already exist before creation
2. **Confirmation Modal**: Require user confirmation before creating policy
3. **Read-only Default**: Never modify the Default policy, only read it
4. **Logging**: Log all policy creation operations for audit trail
5. **Error Recovery**: Provide clear error messages and recovery steps
6. **Policy ID Display**: Always show the created policy ID for reference

## Phase 7: Future Enhancements (Optional)

1. **Update Existing Policy**: Allow updating OauthPlaygroundPolicy if it already exists
2. **Delete Policy**: Add ability to delete OauthPlaygroundPolicy (with confirmation)
3. **Policy Comparison**: Show diff between Default and OauthPlaygroundPolicy
4. **Settings Mapping UI**: Visual interface for mapping config page settings to policy
5. **Policy Templates**: Save/load policy configurations as templates
6. **Bulk Operations**: Create multiple policies from templates

## Implementation Order

1. **Phase 1.2**: Read policy by name endpoint
2. **Phase 1.3**: Create policy from template endpoint
3. **Phase 2**: Frontend service methods
4. **Phase 3**: Basic UI (without settings mapping)
5. **Testing**: Verify all functionality
6. **Phase 4**: Add settings mapping (if needed)

## Notes

- The Default policy may be named differently in different environments
- Some environments may not have a "Default" policy
- Policy creation requires appropriate worker token permissions
- The created policy will be immediately available for use in MFA flows
- Policy changes may take a few seconds to propagate

