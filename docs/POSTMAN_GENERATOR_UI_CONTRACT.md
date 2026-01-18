# Postman Collection Generator - UI Contract (Technical Specification)

## Overview

The Postman Collection Generator is a TypeScript/React component that generates Postman Collection v2.1.0 JSON files with PingOne API requests, scripts, and environment variables.

## Architecture

### Component Structure

**File:** `src/pages/PostmanCollectionGenerator.tsx`

**Main Component:** `PostmanCollectionGenerator`

**State Management:**
- Collection type selection (Use Cases, Unified, MFA)
- Use case selection (Set of UseCaseType)
- Unified spec version selection (OAuth 2.0, OIDC, OAuth 2.1)
- MFA device type selection
- Credentials (optional pre-fill)

### Generator Functions

**File:** `src/services/postmanCollectionGeneratorV8.ts`

**Exported Functions:**

1. `generateUseCasesPostmanCollection(credentials?, selectedUseCases?)`
   - Generates customer identity flow use cases
   - Returns: `PostmanCollection`

2. `generateComprehensiveUnifiedPostmanCollection(credentials?)`
   - Generates OAuth/OIDC flows organized by spec version
   - Returns: `PostmanCollection`

3. `generateComprehensiveMFAPostmanCollection(credentials?)`
   - Generates MFA device flows
   - Returns: `PostmanCollection`

4. `generateCompletePostmanCollection(credentials?)`
   - Combines Unified + MFA collections
   - Returns: `PostmanCollection`

5. `generatePostmanEnvironment(collection, environmentName?)`
   - Generates Postman environment file
   - Returns: `PostmanEnvironment`

6. `downloadPostmanCollection(collection, filename)`
   - Downloads collection JSON file

7. `downloadPostmanEnvironment(environment, filename)`
   - Downloads environment JSON file

8. `downloadPostmanCollectionWithEnvironment(collection, filename, environmentName?)`
   - Downloads both collection and environment files

## Data Structures

### PostmanCollection Interface

```typescript
interface PostmanCollection {
  info: {
    name: string;
    description: string;
    schema: string; // "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    version?: string;
  };
  variable: Array<{
    key: string;
    value: string;
    type?: string;
  }>;
  item: PostmanCollectionItem[];
}
```

### PostmanCollectionItem Interface

```typescript
interface PostmanCollectionItem {
  name: string;
  request?: {
    method: string;
    header?: Array<{ key: string; value: string; type?: string }>;
    body?: {
      mode: 'raw' | 'urlencoded';
      raw?: string;
      urlencoded?: Array<{ key: string; value: string }>;
      options?: {
        raw?: {
          language?: string;
        };
      };
    };
    url: {
      raw: string;
      protocol?: string;
      host?: string[];
      path?: string[];
      query?: Array<{ key: string; value: string }>;
    };
    description?: string;
  };
  item?: PostmanCollectionItem[]; // For folders/nested collections
  event?: Array<{
    listen: 'prerequest' | 'test';
    script: {
      exec: string[];
      type: 'text/javascript';
    };
  }>;
  description?: string;
}
```

## Collection Types

### Use Cases Collection

**Function:** `generateUseCasesPostmanCollection()`

**Structure:**
- Worker Token folder (4 authentication methods)
- Use Case folders (16 use cases)
  - Environment Configuration
  - Configure Your Test User
  - Test The Workflow

**Use Cases:**
```typescript
type UseCaseType =
  | 'signup'
  | 'signin'
  | 'mfa-enrollment'
  | 'mfa-challenge'
  | 'stepup'
  | 'password-reset'
  | 'account-recovery'
  | 'change-credentials'
  | 'social-login'
  | 'federation'
  | 'oauth-login'
  | 'risk-checks'
  | 'logout'
  | 'user-sessions'
  | 'transaction-approval'
  | 'pingone-metadata';
```

### Unified OAuth/OIDC Collection

**Function:** `generateComprehensiveUnifiedPostmanCollection()`

**Structure:**
- Worker Token folder
- OAuth 2.0 Authorization Framework (RFC 6749)
- OpenID Connect Core 1.0
- OAuth 2.1 Authorization Framework (draft)

**Flow Types:**
- Authorization Code Grant (7 variations)
- Implicit Flow
- Client Credentials Flow
- Device Code Flow
- Hybrid Flow

### MFA Collection

**Function:** `generateComprehensiveMFAPostmanCollection()`

**Structure:**
- Worker Token folder
- Device type folders (6 types)
  - SMS
  - Email
  - WhatsApp
  - TOTP
  - FIDO2
  - Mobile

**Flow Types per Device:**
- Admin Flow (ACTIVE devices)
- User Flow (ACTIVATION_REQUIRED devices)

## Key Features Implementation

### 1. Random Username Generation

**Function:** `generateRandomBaseballPlayerScript(prefix: string)`

**Location:** `src/services/postmanCollectionGeneratorV8.ts` line ~1785

**Implementation:**
- Pre-request script that randomly selects from 15 historical baseball players
- Sets variables: `{prefix}FirstName`, `{prefix}LastName`, `{prefix}Username`, `{prefix}Email`
- Email format: `cmuir+{firstName}@pingone.com`
- Username format: `{player_username}_{timestamp}`

**Usage:**
- Sign-up flow: `generateRandomBaseballPlayerScript('SignUp')`
- Sign-in flow: `generateRandomBaseballPlayerScript('SignIn')`

### 2. Password Generation

**Function:** `generatePasswordScript()`

**Location:** `src/services/postmanCollectionGeneratorV8.ts` line ~1824

**Implementation:**
- Pre-request script that generates password
- Default base: `"2Federate!"`
- Adds random 4-digit suffix (1000-9999)
- Sets both `userPassword` and `newPassword` variables

**Usage:**
- All password-setting endpoints use this script

### 3. JWT Assertion Generation

**Function:** Pre-request script in Client Secret JWT worker token

**Location:** `src/services/postmanCollectionGeneratorV8.ts` line ~4700

**Implementation:**
- Generates JWT with HS256 signature
- Claims: iss, sub, aud, exp, iat, jti
- Signed with client secret
- Saves to `client_assertion_jwt` variable

### 4. Variable Extraction

**Function:** Test scripts in each request

**Pattern:**
```javascript
const jsonData = pm.response.json();
pm.environment.set("variableName", jsonData.property);
```

**Common Variables Extracted:**
- `workerToken` - From token endpoint
- `access_token` - From token exchange
- `id_token` - From OIDC flows
- `refresh_token` - From token exchange
- `SignUpUserID` - From user creation
- `deviceId` - From device creation
- And many more...

## URL Structure

### Base URLs

**API Base:** `{{apiPath}}/v1/environments/{{envID}}`
- `{{apiPath}}` = `https://api.pingone.com`
- `{{envID}}` = Environment ID (UUID)

**Auth Base:** `{{authPath}}/{{envID}}`
- `{{authPath}}` = `https://auth.pingone.com`
- `{{envID}}` = Environment ID (UUID)

### URL Parsing

**Function:** `parseUrl(rawUrl: string)`

**Location:** `src/services/postmanCollectionGeneratorV8.ts` line ~101

**Purpose:**
- Converts URL strings to Postman URL structure
- Handles `{{apiPath}}` and `{{authPath}}` variables
- Extracts query parameters
- Preserves variable format for Postman

## Content-Type Headers

### Standard Content-Types

| Operation | Content-Type |
|-----------|--------------|
| Create User (Import) | `application/vnd.pingidentity.user.import+json` |
| Verify User | `application/vnd.pingidentity.user.verify+json` |
| Set Password | `application/vnd.pingidentity.password.set+json` |
| Reset Password | `application/vnd.pingidentity.password.reset+json` |
| Change Password | `application/vnd.pingidentity.password.change+json` |
| Recover Password | `application/vnd.pingidentity.password.recover+json` |
| Send Recovery Code | `application/vnd.pingidentity.password.sendRecoveryCode` |
| Force Password Change | `application/vnd.pingidentity.password.forceChange` |
| Activate Device | `application/vnd.pingidentity.device.activate+json` |
| Select Device | `application/vnd.pingidentity.device.select+json` |
| Check OTP | `application/vnd.pingidentity.otp.check+json` |
| Username/Password Check | `application/vnd.pingidentity.usernamePassword.check+json` |

### Content-Type Rules

1. **JSON Body Operations:** Use `application/vnd.pingidentity.{operation}+json`
2. **Empty Body Operations:** Use `application/vnd.pingidentity.{operation}` (no `+json`)
3. **Standard JSON:** Use `application/json` for standard operations

## Worker Token Configuration

### Default Worker Credentials

**Location:** `src/services/postmanCollectionGeneratorV8.ts` line ~4925

**Values:**
- `worker_client_id`: `'66a4686b-9222-4ad2-91b6-03113711c9aa'`
- `worker_client_secret`: `'3D_ksu7589TfcVJm2fqEHjXuhc-DCRfoxEv0urEw8GIK7qiJe72n92WRQ0uaT2tC'`

**Important:**
- Worker credentials are ALWAYS hardcoded (never use authorization credentials)
- User/OAuth credentials can be overridden with passed credentials

## Request Building

### Helper Function

**Function:** `createUseCaseItem()`

**Location:** `src/services/postmanCollectionGeneratorV8.ts` line ~1832

**Parameters:**
- `name: string` - Request name
- `method: string` - HTTP method
- `url: string` - Endpoint URL
- `description: string` - Educational description
- `headers: Array<{key, value}>` - Request headers
- `body?: Record<string, unknown>` - Request body
- `testScript?: string[]` - Test script lines
- `preRequestScript?: string[]` - Pre-request script lines

**Behavior:**
- Automatically determines body format (raw JSON vs form-urlencoded)
- Parses URL structure
- Adds scripts as events
- Returns `PostmanCollectionItem`

## Environment Variables

### Variable Categories

1. **Base Configuration:**
   - `authPath`, `apiPath`, `envID`

2. **Worker Credentials:**
   - `worker_client_id`, `worker_client_secret`, `workerToken`

3. **User/OAuth Credentials:**
   - `user_client_id`, `user_client_secret`

4. **OAuth Flow Variables:**
   - `redirect_uri`, `scopes_oauth2`, `scopes_oidc`, `state`, `nonce`

5. **Token Variables:**
   - `authorization_code`, `access_token`, `id_token`, `refresh_token`

6. **PKCE Variables:**
   - `code_verifier`, `code_challenge`, `code_challenge_method`

7. **User Variables:**
   - `SignUpUserID`, `SignInUserID`, `username`, `email`, `password`

8. **MFA Variables:**
   - `deviceId`, `deviceAuthenticationId`, `otp_code`

9. **Use Case Variables:**
   - `emailVerificationCode`, `recoveryCode`, `newPassword`, etc.

## Validation

### Collection Validation

**Function:** `validateCollection()`

**Checks:**
- URL structure validity
- Required variables present
- Template variable usage
- Request format correctness

### Placeholder Validation

**Function:** `validatePlaceholders()`

**Checks:**
- No `{{undefined}}` or `{{null}}` in output
- No sentinel values (`<<MISSING_VALUE>>`, `<<REQUIRED_VALUE_MISSING>>`)
- All template variables are defined

## Error Handling

### Generation Issues

**Class:** `GenerationIssues`

**Features:**
- Collects warnings and errors
- Categorizes by severity
- Provides summary output
- Throws on critical errors

### Common Issues

1. **Missing Required Variables:**
   - Substituted with `<<REQUIRED_VALUE_MISSING>>`
   - Warning logged
   - User must fill in Postman

2. **Invalid URLs:**
   - Parsing errors logged
   - Fallback to raw URL format

3. **Content-Type Mismatches:**
   - Body format determined by Content-Type
   - Raw JSON for `+json` types
   - Form-urlencoded for `application/x-www-form-urlencoded`

## Version Information

**Collection Version:** `9.0.0`

**Location:** `src/services/postmanCollectionGeneratorV8.ts` line ~9

**Export:** `export const COLLECTION_VERSION = '9.0.0';`

## Dependencies

### External Dependencies
- React
- TypeScript
- Postman Collection Schema v2.1.0

### Internal Dependencies
- `@/v8/services/credentialsServiceV8`
- `@/v8/services/environmentIdServiceV8`
- `@/v8/services/specVersionServiceV8`
- `@/services/apiCallTrackerService`

## File Structure

```
src/
├── pages/
│   └── PostmanCollectionGenerator.tsx  # UI Component
└── services/
    └── postmanCollectionGeneratorV8.ts  # Generator Logic
        ├── Interfaces
        ├── Helper Functions
        ├── URL Parsing
        ├── Request Building
        ├── Use Case Generation
        ├── Unified Flow Generation
        ├── MFA Flow Generation
        └── Validation
```

## API Reference

### Main Exports

```typescript
// Collection Generators
export const generateUseCasesPostmanCollection: (
  credentials?: Credentials,
  selectedUseCases?: Set<UseCaseType>
) => PostmanCollection;

export const generateComprehensiveUnifiedPostmanCollection: (
  credentials?: Credentials
) => PostmanCollection;

export const generateComprehensiveMFAPostmanCollection: (
  credentials?: Credentials
) => PostmanCollection;

export const generateCompletePostmanCollection: (
  credentials?: Credentials
) => PostmanCollection;

// Environment Generator
export const generatePostmanEnvironment: (
  collection: PostmanCollection,
  environmentName?: string
) => PostmanEnvironment;

// Download Functions
export const downloadPostmanCollection: (
  collection: PostmanCollection,
  filename: string
) => void;

export const downloadPostmanEnvironment: (
  environment: PostmanEnvironment,
  filename: string
) => void;

export const downloadPostmanCollectionWithEnvironment: (
  collection: PostmanCollection,
  filename: string,
  environmentName?: string
) => void;

// Version
export const COLLECTION_VERSION: string;
```

## Testing

### Manual Testing

1. Generate collection with all options selected
2. Import into Postman
3. Verify all requests are present
4. Test variable extraction
5. Verify scripts execute correctly

### Validation Testing

1. Check for missing variables
2. Verify URL structure
3. Validate Content-Type headers
4. Test error handling

## Performance Considerations

- Collections can be large (1000+ requests)
- Generation is synchronous (may take 1-2 seconds)
- File downloads are handled by browser
- No server-side processing required
