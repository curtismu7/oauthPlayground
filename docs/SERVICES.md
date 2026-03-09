# Service Documentation

## Overview

Services handle business logic, API calls, and data management in MasterFlow API.

## Services


### environmentIdService

**File**: `services/environmentIdService.ts`

**Functions**:
- `isValidEnvId()`
- `openDB()`
- `db()`
- `getEnvIdFromIndexedDB()`
- `setEnvIdInIndexedDB()`
- `getEnvIdFromApi()`
- `data()`
- `setEnvIdInApi()`
- `loadEnvironmentId()`
- `saveEnvironmentId()`

**Usage**:
```typescript
import { environmentIdService } from '@/services/environmentIdService'

// Example usage
environmentIdService.isValidEnvId()
```


### flowSequenceService

**File**: `services/flowSequenceService.ts`

**Functions**:
- `normalizeFlowType()`
- `getFlowSequence()`
- `getAvailableFlowTypes()`
- `hasFlowSequence()`

**Usage**:
```typescript
import { flowSequenceService } from '@/services/flowSequenceService'

// Example usage
flowSequenceService.normalizeFlowType()
```


### loggingService

**File**: `services/loggingService.ts`

**Functions**:
- `logError()`
- `logWarn()`
- `logInfo()`
- `logDebug()`

**Usage**:
```typescript
import { loggingService } from '@/services/loggingService'

// Example usage
loggingService.logError()
```


### clientCredentialsSharedService

**File**: `services/clientCredentialsSharedService.ts`

**Functions**:
- `isErrorObject()`

**Usage**:
```typescript
import { clientCredentialsSharedService } from '@/services/clientCredentialsSharedService'

// Example usage
clientCredentialsSharedService.isErrorObject()
```


### pingOneAppCreationService

**File**: `services/pingOneAppCreationService.ts`

**Functions**:
- `normalizeArray()`
- `normalizeArray()`

**Usage**:
```typescript
import { pingOneAppCreationService } from '@/services/pingOneAppCreationService'

// Example usage
pingOneAppCreationService.normalizeArray()
```


### configComparisonService

**File**: `services/configComparisonService.ts`

**Functions**:
- `pick()`

**Usage**:
```typescript
import { configComparisonService } from '@/services/configComparisonService'

// Example usage
configComparisonService.pick()
```


### enhancedConfigurationService

**File**: `services/enhancedConfigurationService.ts`

**Functions**:
- `value1()`
- `value2()`

**Usage**:
```typescript
import { enhancedConfigurationService } from '@/services/enhancedConfigurationService'

// Example usage
enhancedConfigurationService.value1()
```


### apiCallDisplayService

**File**: `services/apiCallDisplayService.ts`

**Functions**:
- `sanitizeObject()`
- `formatApiCallText()`
- `formatResponseSummary()`
- `formatTimingInfo()`
- `generateCurlCommand()`
- `formatApiCall()`
- `createFullDisplay()`
- `createCompactDisplay()`
- `validateApiCall()`
- `sanitizeApiCall()`

**Usage**:
```typescript
import { apiCallDisplayService } from '@/services/apiCallDisplayService'

// Example usage
apiCallDisplayService.sanitizeObject()
```


### authConfigurationService

**File**: `services/authConfigurationService.ts`

**Functions**:
- `getWindow()`
- `getOrigin()`
- `buildEndpoints()`
- `normaliseScopes()`
- `buildConfigFromCredentials()`
- `environmentId()`
- `redirectUri()`
- `authorizationEndpoint()`
- `tokenEndpoint()`
- `userInfoEndpoint()`
- `endSessionEndpoint()`
- `createDefaultAuthConfig()`
- `buildEnvConfig()`
- `loadFromFlowCredentialService()`
- `loadFromCredentialManager()`
- `loadFromPingOneConfigService()`
- `loadAuthConfiguration()`
- `subscribeToAuthConfigurationChanges()`
- `listener()`

**Usage**:
```typescript
import { authConfigurationService } from '@/services/authConfigurationService'

// Example usage
authConfigurationService.getWindow()
```


### fieldEditingService

**File**: `services/fieldEditingService.ts`

**Functions**:
- `useFieldEditingProtection()`

**Usage**:
```typescript
import { fieldEditingService } from '@/services/fieldEditingService'

// Example usage
fieldEditingService.useFieldEditingProtection()
```


### apiUtils

**File**: `services/apiUtils.ts`

**Functions**:
- `createApiError()`
- `handleApiResponse()`
- `errorStatus()`

**Usage**:
```typescript
import { apiUtils } from '@/services/apiUtils'

// Example usage
apiUtils.createApiError()
```


### credentialExportImportService

**File**: `services/credentialExportImportService.ts`

**Functions**:
- `exportAuthzCredentials()`
- `exportWorkerTokenCredentials()`
- `importCredentials()`
- `triggerFileImport()`
- `file()`

**Usage**:
```typescript
import { credentialExportImportService } from '@/services/credentialExportImportService'

// Example usage
credentialExportImportService.exportAuthzCredentials()
```


### FlowInfoService

**File**: `services/FlowInfoService.ts`

**Functions**:
- `normalizeFlowKey()`
- `getFlowInfo()`
- `generateFlowInfoCard()`
- `getAvailableFlowTypes()`
- `getFlowsByCategory()`
- `getFlowsByComplexity()`
- `getFlowsBySecurityLevel()`
- `searchFlows()`
- `getRelatedFlows()`
- `getCommonIssues()`
- `getImplementationNotes()`
- `getDocumentationLinks()`
- `getCategoryBadge()`
- `getFlowIcon()`
- `getComplexityLabel()`
- `getSecurityLevelLabel()`
- `getUserInteractionLabel()`

**Usage**:
```typescript
import { FlowInfoService } from '@/services/FlowInfoService'

// Example usage
FlowInfoService.normalizeFlowKey()
```


### serverHealthService

**File**: `services/serverHealthService.ts`

**Functions**:
- `getBackendHealthUrl()`
- `checkServerStatusForDashboard()`
- `formatBytes()`
- `formatUptime()`
- `minimalFrontendHealthData()`
- `fetchDetailedHealth()`

**Usage**:
```typescript
import { serverHealthService } from '@/services/serverHealthService'

// Example usage
serverHealthService.getBackendHealthUrl()
```


### qrCodeService

**File**: `services/qrCodeService.ts`

**Functions**:
- `shouldFill()`
- `code()`

**Usage**:
```typescript
import { qrCodeService } from '@/services/qrCodeService'

// Example usage
qrCodeService.shouldFill()
```

