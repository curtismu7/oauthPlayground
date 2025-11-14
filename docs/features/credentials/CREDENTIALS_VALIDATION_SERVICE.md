# Credentials Validation Service

**Created:** 2025-10-08  
**Status:** ✅ Integrated into OAuth and OIDC Implicit V5 flows  

## Overview

The Credentials Validation Service provides reusable validation logic to prevent users from navigating to subsequent steps without filling in required fields.

## Problem Solved

**Before:** Users could click "Next" and reach step 2 (Authorization Request) without filling in required fields like:
- Environment ID
- Client ID  
- Redirect URI
- Scope (for OIDC)

**After:** Validation prevents navigation and shows clear error toast message listing missing fields.

## Usage

### Basic Import

```typescript
import { validateForStep, validateAndNotify } from '../../services/credentialsValidationService';
```

### Integration in Flow Components

```typescript
const validatedHandleNext = useCallback(() => {
	// Validate credentials before proceeding from step 0 to step 1
	if (currentStep === 0) {
		const validation = validateForStep(1, credentials, 'oauth-implicit');
		if (!validation.isValid) {
			const fieldNames = validation.missingFields
				.map(f => f === 'environmentId' ? 'Environment ID' : 
				         f === 'clientId' ? 'Client ID' : 
				         f === 'redirectUri' ? 'Redirect URI' : f)
				.join(', ');
			v4ToastManager.showError(`Please fill in required fields: ${fieldNames}`);
			return;
		}
	}

	// Continue with other validation...
	handleNext();
}, [handleNext, currentStep, credentials]);
```

## API Reference

### Core Functions

#### `validateForStep(stepNumber, credentials, flowType)`

Validates credentials for a specific step in a flow.

**Parameters:**
- `stepNumber` (number): Current step number (0-based)
- `credentials` (CredentialsToValidate): Credentials object
- `flowType`: Flow type identifier
  - `'oauth-implicit'` - OAuth 2.0 Implicit
  - `'oidc-implicit'` - OIDC Implicit
  - `'authorization-code'` - Auth Code with PKCE
  - `'client-credentials'` - Client Credentials
  - `'device-authorization'` - Device Authorization

**Returns:** `ValidationResult`
```typescript
{
	isValid: boolean,
	missingFields: string[],
	errorMessage?: string
}
```

**Example:**
```typescript
const validation = validateForStep(1, credentials, 'oidc-implicit');
if (!validation.isValid) {
	console.log('Missing:', validation.missingFields);
	// ['environmentId', 'clientId', 'scope']
}
```

#### `validateAndNotify(credentials, requirements, customMessage?)`

Validates and shows toast notification if invalid.

**Parameters:**
- `credentials` (CredentialsToValidate): Credentials object
- `requirements` (ValidationRequirements): Required fields config
- `customMessage?` (string): Optional custom error message

**Returns:** `boolean` - true if valid, false if invalid

**Example:**
```typescript
const isValid = validateAndNotify(
	credentials,
	{ environmentId: true, clientId: true, redirectUri: true }
);

if (isValid) {
	// Proceed to next step
}
```

#### `canNavigateToNextStep(credentials, requirements, stepName?)`

Check if navigation is allowed (validates and shows toast).

**Parameters:**
- `credentials` (CredentialsToValidate)
- `requirements` (ValidationRequirements)
- `stepName?` (string): Optional step name for error message

**Returns:** `boolean`

**Example:**
```typescript
if (canNavigateToNextStep(credentials, requirements, 'Authorization Request')) {
	setCurrentStep(1);
}
```

### Validation Requirements

Pre-configured requirements for each flow type:

#### OAuth 2.0 Implicit
```typescript
FlowValidationRequirements.oauthImplicit = {
	environmentId: true,    // Required
	clientId: true,         // Required
	clientSecret: false,    // Not required (public client)
	redirectUri: true,      // Required
	scope: false,           // Not required (OAuth doesn't need openid)
}
```

#### OIDC Implicit
```typescript
FlowValidationRequirements.oidcImplicit = {
	environmentId: true,    // Required
	clientId: true,         // Required
	clientSecret: false,    // Not required (public client)
	redirectUri: true,      // Required
	scope: true,            // Required (must include openid)
}
```

#### Authorization Code (PKCE)
```typescript
FlowValidationRequirements.authorizationCodePKCE = {
	environmentId: true,
	clientId: true,
	clientSecret: false,    // Not required (public client with PKCE)
	redirectUri: true,
	scope: false,
}
```

#### Client Credentials
```typescript
FlowValidationRequirements.clientCredentials = {
	environmentId: true,
	clientId: true,
	clientSecret: true,     // Required (confidential client)
	redirectUri: false,     // Not required (no redirect)
	scope: false,
}
```

#### Device Authorization
```typescript
FlowValidationRequirements.deviceAuthorization = {
	environmentId: true,
	clientId: true,
	clientSecret: false,
	redirectUri: false,     // Not required (no redirect)
	scope: false,
}
```

### Helper Functions

#### `isFieldEmpty(value)`
Check if a field is empty.

```typescript
if (isFieldEmpty(credentials.clientId)) {
	// Field is empty
}
```

#### `getEmptyRequiredFields(credentials, requirements)`
Get list of empty required fields.

```typescript
const emptyFields = getEmptyRequiredFields(credentials, requirements);
// ['environmentId', 'clientId']
```

#### `formatFieldName(fieldName)`
Convert field name to display name.

```typescript
formatFieldName('environmentId'); // "Environment ID"
formatFieldName('clientId');      // "Client ID"
formatFieldName('redirectUri');   // "Redirect URI"
```

## Integration Examples

### Example 1: OAuth Implicit Flow

```typescript
import { validateForStep } from '../../services/credentialsValidationService';

const validatedHandleNext = useCallback(() => {
	// Validate before leaving step 0
	if (currentStep === 0) {
		const validation = validateForStep(1, credentials, 'oauth-implicit');
		if (!validation.isValid) {
			v4ToastManager.showError(validation.errorMessage);
			return;
		}
	}
	
	handleNext();
}, [currentStep, credentials, handleNext]);
```

### Example 2: OIDC Implicit Flow

```typescript
import { validateForStep } from '../../services/credentialsValidationService';

const validatedHandleNext = useCallback(() => {
	// Validate before leaving step 0
	if (currentStep === 0) {
		const validation = validateForStep(1, credentials, 'oidc-implicit');
		if (!validation.isValid) {
			// Custom error message with field names
			const fieldNames = validation.missingFields
				.map(f => f === 'scope' ? 'Scope (must include openid)' : formatFieldName(f))
				.join(', ');
			v4ToastManager.showError(`Required: ${fieldNames}`);
			return;
		}
	}
	
	handleNext();
}, [currentStep, credentials, handleNext]);
```

### Example 3: Custom Validation

```typescript
import { validateCredentials } from '../../services/credentialsValidationService';

const customValidation = validateCredentials(credentials, {
	environmentId: true,
	clientId: true,
	redirectUri: true,
	customFields: {
		myCustomField: true,  // Require custom field
	}
});

if (!customValidation.isValid) {
	console.log('Missing:', customValidation.missingFields);
}
```

## Validation Behavior by Step

### Step 0 (Introduction & Setup)
- ✅ No validation required
- User can freely navigate

### Step 1 (Authorization Request)
- 🔴 Validation REQUIRED before entering this step
- Checks all required fields based on flow type
- Prevents navigation if any required field is empty
- Shows toast with list of missing fields

### Step 2+ (Subsequent Steps)
- ✅ Assumes credentials already validated
- No additional credential validation needed

## Error Messages

### Standard Error Message
```
Please fill in required fields: Environment ID, Client ID, Redirect URI
```

### OIDC-Specific Message (includes scope)
```
Please fill in required fields: Environment ID, Client ID, Redirect URI, Scope (must include openid)
```

### Custom Message
```typescript
validateAndNotify(credentials, requirements, 'Complete setup before continuing');
```

## Field Display Names

The service automatically converts technical field names to user-friendly display names:

| Field Name | Display Name |
|------------|-------------|
| `environmentId` | Environment ID |
| `clientId` | Client ID |
| `clientSecret` | Client Secret |
| `redirectUri` | Redirect URI |
| `scope` | Scope |
| `scopes` | Scopes |

## Flows Currently Using This Service

### ✅ Integrated
- OAuth 2.0 Implicit V5
- OIDC Implicit V5

### 🔜 Ready to Integrate
- OAuth Authorization Code V5
- OIDC Authorization Code V5
- Client Credentials V5
- Device Authorization V5
- OIDC Device Authorization V5
- Hybrid Flow V5

## Benefits

1. **Consistent UX** - Same validation behavior across all flows
2. **Clear Error Messages** - Users know exactly what's missing
3. **Reusable** - One service for all flows
4. **Type-Safe** - Full TypeScript support
5. **Maintainable** - Update validation logic in one place
6. **Extensible** - Easy to add custom fields or flows

## Testing

### Manual Test Steps

1. Navigate to OAuth or OIDC Implicit V5 flow
2. Leave credentials blank
3. Click "Next" button
4. **Expected:** Toast error showing missing fields
5. **Expected:** Stay on step 0 (don't navigate)
6. Fill in credentials
7. Click "Next" button
8. **Expected:** Navigate to step 1 successfully

### What to Verify

- [ ] Validation prevents navigation when fields empty
- [ ] Error toast shows correct field names
- [ ] Validation allows navigation when fields filled
- [ ] Error messages are user-friendly
- [ ] Works for both OAuth and OIDC flows
- [ ] Different requirements per flow type

## Future Enhancements

### Potential Features
1. **Real-time validation** - Show errors as user types
2. **Visual indicators** - Red border on empty required fields
3. **Field-level validation** - Format validation (e.g., URL format)
4. **Async validation** - Verify credentials with PingOne
5. **Conditional requirements** - Dynamic required fields based on other selections

### Migration to Other Flows

To add validation to any flow:

```typescript
// 1. Import the service
import { validateForStep } from '../../services/credentialsValidationService';

// 2. Add validation in handleNext
const handleNext = useCallback(() => {
	if (currentStep === 0) {
		const validation = validateForStep(1, credentials, 'your-flow-type');
		if (!validation.isValid) {
			v4ToastManager.showError(validation.errorMessage);
			return;
		}
	}
	// ... rest of navigation logic
}, [currentStep, credentials]);
```

## File Location

```
src/services/credentialsValidationService.ts
```

## Dependencies

- `v4ToastMessages` - For showing error toasts
- TypeScript - For type safety

## Changelog

### 2025-10-08
- ✅ Created Credentials Validation Service
- ✅ Integrated into OAuth Implicit V5
- ✅ Integrated into OIDC Implicit V5
- ✅ Added pre-configured requirements for all flow types
- ✅ Added comprehensive documentation

---

**Created By:** AI Assistant  
**Status:** Production-ready  
**Impact:** Prevents user frustration by catching missing fields before navigation

