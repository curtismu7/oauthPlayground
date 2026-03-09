# Component Documentation

## Overview

MasterFlow API uses a component-based architecture with React and TypeScript.

## Components


### AudienceParameterInput

**File**: `components/AudienceParameterInput.tsx`

**Props**:
- `value`: `string`
- `onChange`: `(value`
- `disabled?`: `boolean`
- `flowType?`: `'oauth' | 'oidc'`
- `tokenEndpoint?`: `string | undefined; // From OIDC discovery`
- `issuer?`: `string | undefined; // From OIDC discovery`
- `autoFillFromDiscovery?`: `boolean; // Whether to auto-fill on load`

**Usage**:
```tsx
import { AudienceParameterInput } from '@/components/AudienceParameterInput'

<AudienceParameterInput />
```


### PingOneAppConfig

**File**: `components/PingOneAppConfig.tsx`

**Props**:
- `onConfigChange?`: `(config`
- `initialConfig?`: `Partial<PingOneConfig>`
- `storageKey?`: `string`

**Usage**:
```tsx
import { PingOneAppConfig } from '@/components/PingOneAppConfig'

<PingOneAppConfig />
```


### DEVICE_TYPES

**File**: `components/DeviceTypeSelector.tsx`

**Props**:
- `selectedDevice`: `string`
- `onDeviceChange`: `(deviceType`
- `variant?`: `'default' | 'compact'`

**Usage**:
```tsx
import { DEVICE_TYPES } from '@/components/DEVICE_TYPES'

<DEVICE_TYPES />
```


### WorkerTokenModal

**File**: `components/WorkerTokenModal.tsx`

**Props**:
- `isOpen`: `boolean`
- `onClose`: `() => void`
- `onContinue`: `() => void`
- `flowType?`: `string`
- `environmentId?`: `string`
- `skipCredentialsStep?`: `boolean; // If true, skip to token generation form directly`
- `prefillCredentials?`: `{`
- `clientId?`: `string`
- `clientSecret?`: `string`
- `region?`: `string`
- `scopes?`: `string`

**Usage**:
```tsx
import { WorkerTokenModal } from '@/components/WorkerTokenModal'

<WorkerTokenModal />
```


### PingOneDocumentationLinks

**File**: `components/PingOneDocumentationLinks.tsx`

**Props**:
- No props defined

**Usage**:
```tsx
import { PingOneDocumentationLinks } from '@/components/PingOneDocumentationLinks'

<PingOneDocumentationLinks />
```


### TokenDisplayModal

**File**: `components/TokenDisplayModal.tsx`

**Props**:
- `isOpen`: `boolean`
- `onClose`: `() => void`
- `tokens`: `{`
- `access_token?`: `string`
- `id_token?`: `string`
- `refresh_token?`: `string`
- `token_type?`: `string`
- `expires_in?`: `number`
- `scope?`: `string`

**Usage**:
```tsx
import { TokenDisplayModal } from '@/components/TokenDisplayModal'

<TokenDisplayModal />
```


### RedirectUriEducationalModal

**File**: `components/RedirectUriEducationalModal.tsx`

**Props**:
- `flowKey`: `string`
- `isOpen`: `boolean`
- `onClose`: `() => void`

**Usage**:
```tsx
import { RedirectUriEducationalModal } from '@/components/RedirectUriEducationalModal'

<RedirectUriEducationalModal />
```


### withOAuthFlowErrorBoundary

**File**: `components/OAuthFlowErrorBoundary.tsx`

**Props**:
- `children`: `ReactNode`
- `fallback?`: `ReactNode`
- `onError?`: `(error`
- `resetOnPropsChange?`: `boolean`
- `resetKeys?`: `Array<string | number>`
- `flowType?`: `string`

**Usage**:
```tsx
import { withOAuthFlowErrorBoundary } from '@/components/withOAuthFlowErrorBoundary'

<withOAuthFlowErrorBoundary />
```


### WorkerTokenRequestModal

**File**: `components/WorkerTokenRequestModal.tsx`

**Props**:
- `isOpen`: `boolean`
- `onClose`: `() => void`
- `onProceed`: `(token`
- `tokenEndpoint`: `string`
- `requestParams`: `{`
- `grant_type`: `string`
- `client_id`: `string`
- `client_secret`: `string`
- `scope?`: `string`

**Usage**:
```tsx
import { WorkerTokenRequestModal } from '@/components/WorkerTokenRequestModal'

<WorkerTokenRequestModal />
```


### InlineTokenDisplay

**File**: `components/InlineTokenDisplay.tsx`

**Props**:
- `label`: `string`
- `token?`: `string`
- `tokenType`: `'access' | 'id' | 'refresh'`
- `isOIDC?`: `boolean`
- `flowKey?`: `string`
- `className?`: `string`
- `defaultMasked?`: `boolean`
- `allowMaskToggle?`: `boolean`

**Usage**:
```tsx
import { InlineTokenDisplay } from '@/components/InlineTokenDisplay'

<InlineTokenDisplay />
```


### EnhancedFlowWalkthrough

**File**: `components/EnhancedFlowWalkthrough.tsx`

**Props**:
- `flowId`: `string`
- `customConfig?`: `Partial<FlowWalkthroughConfig>`
- `defaultCollapsed?`: `boolean`
- `className?`: `string`

**Usage**:
```tsx
import { EnhancedFlowWalkthrough } from '@/components/EnhancedFlowWalkthrough'

<EnhancedFlowWalkthrough />
```


### ClaimsRequestBuilder

**File**: `components/ClaimsRequestBuilder.tsx`

**Props**:
- `value`: `ClaimsRequestStructure | null`
- `onChange`: `(value`
- `collapsed?`: `boolean`
- `onToggleCollapsed?`: `() => void`

**Usage**:
```tsx
import { ClaimsRequestBuilder } from '@/components/ClaimsRequestBuilder'

<ClaimsRequestBuilder />
```


### AuthorizationUrlExplainer

**File**: `components/AuthorizationUrlExplainer.tsx`

**Props**:
- `authUrl`: `string`
- `isOpen`: `boolean`
- `onClose`: `() => void`

**Usage**:
```tsx
import { AuthorizationUrlExplainer } from '@/components/AuthorizationUrlExplainer'

<AuthorizationUrlExplainer />
```


### EnvironmentIdInput

**File**: `components/EnvironmentIdInput.tsx`

**Props**:
- `onDiscoveryComplete?`: `(result`
- `onEnvironmentIdChange?`: `(envId`
- `onIssuerUrlChange?`: `(issuerUrl`
- `initialEnvironmentId?`: `string`
- `className?`: `string`
- `disabled?`: `boolean`
- `autoDiscover?`: `boolean`
- `region?`: `'us' | 'eu' | 'ap' | 'ca'`

**Usage**:
```tsx
import { EnvironmentIdInput } from '@/components/EnvironmentIdInput'

<EnvironmentIdInput />
```


### InlineTokenDisplay

**File**: `components/TokenCard.tsx`

**Props**:
- `label`: `string`
- `token?`: `string`
- `tokenType`: `'access' | 'id' | 'refresh'`
- `isOIDC?`: `boolean`
- `flowKey?`: `string`
- `className?`: `string`
- `defaultMasked?`: `boolean`
- `allowMaskToggle?`: `boolean`

**Usage**:
```tsx
import { InlineTokenDisplay } from '@/components/InlineTokenDisplay'

<InlineTokenDisplay />
```


### CodeExamplesDisplay

**File**: `components/CodeExamplesDisplay.tsx`

**Props**:
- `flowType`: `string`
- `stepId`: `string`
- `config?`: `Partial<CodeExamplesConfig>`
- `className?`: `string`

**Usage**:
```tsx
import { CodeExamplesDisplay } from '@/components/CodeExamplesDisplay'

<CodeExamplesDisplay />
```


### CodeExamplesInline

**File**: `components/CodeExamplesInline.tsx`

**Props**:
- `flowType`: `string`
- `stepId`: `string`
- `config?`: `Partial<CodeExamplesConfig>`
- `className?`: `string`
- `compact?`: `boolean`

**Usage**:
```tsx
import { CodeExamplesInline } from '@/components/CodeExamplesInline'

<CodeExamplesInline />
```


### StartupWrapper

**File**: `components/StartupWrapper.tsx`

**Props**:
- `children`: `React.ReactNode`

**Usage**:
```tsx
import { StartupWrapper } from '@/components/StartupWrapper'

<StartupWrapper />
```


### AuthorizationDetailsEditor

**File**: `components/AuthorizationDetailsEditor.tsx`

**Props**:
- `authorizationDetails`: `AuthorizationDetail[]`
- `onUpdate`: `(details`
- `className?`: `string`

**Usage**:
```tsx
import { AuthorizationDetailsEditor } from '@/components/AuthorizationDetailsEditor'

<AuthorizationDetailsEditor />
```


### StandardMessage

**File**: `components/StandardMessage.tsx`

**Props**:
- `type`: `MessageType`
- `title?`: `string`
- `message`: `string`
- `onDismiss?`: `() => void`
- `className?`: `string`

**Usage**:
```tsx
import { StandardMessage } from '@/components/StandardMessage'

<StandardMessage />
```

