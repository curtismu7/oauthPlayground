# MasterFlow API Documentation

## Overview

MasterFlow API is a comprehensive PingOne integration platform that provides OAuth 2.0, OIDC, and MFA testing capabilities.

## Base URL

```
https://api.pingone.com
```

## Authentication

Most endpoints require Bearer token authentication:

```http
Authorization: Bearer <access_token>
```

## API Endpoints


### /api/pingone/calls/${encodeURIComponent(callId)}

**File**: `utils/pingOneFetch.ts`

**Description**: API endpoint for  Api Pingone Calls ${Encodeuricomponent(Callid)}

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/pingone/calls/${encodeURIComponent(callId)}
```


### /oauth/token

**File**: `utils/errorDiagnosis.ts`

**Description**: API endpoint for  Oauth Token

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/oauth/token
```


### /api/file-storage/save

**File**: `utils/fileStorageUtil.ts`

**Description**: API endpoint for  Api File-Storage Save

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/file-storage/save
```


### /api/file-storage/load

**File**: `utils/fileStorageUtil.ts`

**Description**: API endpoint for  Api File-Storage Load

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/file-storage/load
```


### /api/health

**File**: `utils/backendHealthCheck.ts`

**Description**: API endpoint for  Api Health

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/health
```


### /__client-log

**File**: `utils/clientLogger.ts`

**Description**: API endpoint for  __Client-Log

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/__client-log
```


### /api/pingone/log-call

**File**: `utils/trackedFetch.ts`

**Description**: API endpoint for  Api Pingone Log-Call

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/pingone/log-call
```


### /api/env-config

**File**: `utils/credentialManager.ts`

**Description**: API endpoint for  Api Env-Config

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/env-config
```


### /api/token-exchange

**File**: `hooks/useOIDCCompliantAuthorizationCodeFlow.ts`

**Description**: API endpoint for  Api Token-Exchange

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/token-exchange
```


### /api/userinfo?access_token=${encodeURIComponent(state.tokens.access_token)}&environment_id=${encodeURIComponent(state.credentials.environmentId)}

**File**: `hooks/useOIDCCompliantAuthorizationCodeFlow.ts`

**Description**: API endpoint for  Api Userinfo?Access_Token=${Encodeuricomponent(State.Tokens.Access_Token)}&Environment_Id=${Encodeuricomponent(State.Credentials.Environmentid)}

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/userinfo?access_token=${encodeURIComponent(state.tokens.access_token)}&environment_id=${encodeURIComponent(state.credentials.environmentId)}
```


### /api/token-exchange

**File**: `hooks/useResourceOwnerPasswordFlowV7.ts`

**Description**: API endpoint for  Api Token-Exchange

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/token-exchange
```


### /api/userinfo

**File**: `hooks/useResourceOwnerPasswordFlowV7.ts`

**Description**: API endpoint for  Api Userinfo

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/userinfo
```


### /api/token-exchange

**File**: `hooks/useResourceOwnerPasswordFlowV7.ts`

**Description**: API endpoint for  Api Token-Exchange

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/token-exchange
```


### /api/health

**File**: `hooks/useServerHealth.ts`

**Description**: API endpoint for  Api Health

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/health
```


### /api/token-exchange

**File**: `hooks/useHybridFlowController.ts`

**Description**: API endpoint for  Api Token-Exchange

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/token-exchange
```


### /api/token-exchange

**File**: `hooks/useV7RMOIDCResourceOwnerPasswordController.ts`

**Description**: API endpoint for  Api Token-Exchange

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/token-exchange
```


### /api/userinfo

**File**: `hooks/useV7RMOIDCResourceOwnerPasswordController.ts`

**Description**: API endpoint for  Api Userinfo

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/userinfo
```


### /api/ciba-token

**File**: `hooks/useCibaFlowV7.ts`

**Description**: API endpoint for  Api Ciba-Token

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/ciba-token
```


### /api/ciba-backchannel

**File**: `hooks/useCibaFlowV7.ts`

**Description**: API endpoint for  Api Ciba-Backchannel

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/ciba-backchannel
```


### /api/token-exchange

**File**: `hooks/useOAuth2CompliantAuthorizationCodeFlow.ts`

**Description**: API endpoint for  Api Token-Exchange

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/token-exchange
```


### /api/settings/${API_KEY}

**File**: `services/environmentIdService.ts`

**Description**: API endpoint for  Api Settings ${Api_Key}

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/settings/${API_KEY}
```


### /api/settings/${API_KEY}

**File**: `services/environmentIdService.ts`

**Description**: API endpoint for  Api Settings ${Api_Key}

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/settings/${API_KEY}
```


### /api/token-exchange

**File**: `services/clientCredentialsSharedService.ts`

**Description**: API endpoint for  Api Token-Exchange

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/token-exchange
```


### /api/token-exchange

**File**: `services/pingOneApplicationService.ts`

**Description**: API endpoint for  Api Token-Exchange

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/token-exchange
```


### /api/pingone/applications?${searchParams.toString()}

**File**: `services/pingOneApplicationService.ts`

**Description**: API endpoint for  Api Pingone Applications?${Searchparams.Tostring()}

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/pingone/applications?${searchParams.toString()}
```


### /api/pingone/mfa/policies

**File**: `services/enhancedPingOneMfaService.ts`

**Description**: API endpoint for  Api Pingone Mfa Policies

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/pingone/mfa/policies
```


### /api/pingone/organization-licensing

**File**: `services/organizationLicensingService.ts`

**Description**: API endpoint for  Api Pingone Organization-Licensing

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/pingone/organization-licensing
```


### /api/pingone/environment/licensing

**File**: `services/organizationLicensingService.ts`

**Description**: API endpoint for  Api Pingone Environment Licensing

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/pingone/environment/licensing
```


### /api/pingone/all-licenses

**File**: `services/organizationLicensingService.ts`

**Description**: API endpoint for  Api Pingone All-Licenses

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/pingone/all-licenses
```


### /api/pingone/redirectless/authorize

**File**: `services/redirectlessAuthService.ts`

**Description**: API endpoint for  Api Pingone Redirectless Authorize

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/pingone/redirectless/authorize
```


### /api/pingone/flows/check-username-password

**File**: `services/redirectlessAuthService.ts`

**Description**: API endpoint for  Api Pingone Flows Check-Username-Password

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/pingone/flows/check-username-password
```


### /api/pingone/resume

**File**: `services/redirectlessAuthService.ts`

**Description**: API endpoint for  Api Pingone Resume

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/pingone/resume
```


### /api/tokens/store

**File**: `services/unifiedTokenStorageService.ts`

**Description**: API endpoint for  Api Tokens Store

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/tokens/store
```


### /api/tokens/${tokenId}

**File**: `services/unifiedTokenStorageService.ts`

**Description**: API endpoint for  Api Tokens ${Tokenid}

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/tokens/${tokenId}
```


### /api/tokens/${tokenId}

**File**: `services/unifiedTokenStorageService.ts`

**Description**: API endpoint for  Api Tokens ${Tokenid}

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/tokens/${tokenId}
```


### /api/tokens/clear

**File**: `services/unifiedTokenStorageService.ts`

**Description**: API endpoint for  Api Tokens Clear

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/tokens/clear
```


### /api/settings/${API_KEY}

**File**: `services/regionService.ts`

**Description**: API endpoint for  Api Settings ${Api_Key}

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/settings/${API_KEY}
```


### /api/settings/${API_KEY}

**File**: `services/regionService.ts`

**Description**: API endpoint for  Api Settings ${Api_Key}

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/settings/${API_KEY}
```


### /api/worker-token

**File**: `services/codeGeneration/templates/frontend/nextjsTemplates.ts`

**Description**: API endpoint for  Api Worker-Token

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/worker-token
```


### /api/mfa/challenge

**File**: `services/codeGeneration/templates/frontend/nextjsTemplates.ts`

**Description**: API endpoint for  Api Mfa Challenge

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/mfa/challenge
```


### /api/mfa/verify

**File**: `services/codeGeneration/templates/frontend/nextjsTemplates.ts`

**Description**: API endpoint for  Api Mfa Verify

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/mfa/verify
```


### /api/devices/register

**File**: `services/codeGeneration/templates/frontend/nextjsTemplates.ts`

**Description**: API endpoint for  Api Devices Register

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/devices/register
```


### /api/pingone/mfa/send-otp

**File**: `sdk/p1mfa/sms.ts`

**Description**: API endpoint for  Api Pingone Mfa Send-Otp

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/pingone/mfa/send-otp
```


### /api/pingone/mfa/register-device

**File**: `sdk/p1mfa/P1MFASDK.ts`

**Description**: API endpoint for  Api Pingone Mfa Register-Device

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/pingone/mfa/register-device
```


### /api/pingone/mfa/activate-device

**File**: `sdk/p1mfa/P1MFASDK.ts`

**Description**: API endpoint for  Api Pingone Mfa Activate-Device

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/pingone/mfa/activate-device
```


### /api/pingone/mfa/get-all-devices

**File**: `sdk/p1mfa/P1MFASDK.ts`

**Description**: API endpoint for  Api Pingone Mfa Get-All-Devices

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/pingone/mfa/get-all-devices
```


### /api/pingone/mfa/delete-device

**File**: `sdk/p1mfa/P1MFASDK.ts`

**Description**: API endpoint for  Api Pingone Mfa Delete-Device

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/pingone/mfa/delete-device
```


### /api/pingone/mfa/initialize-device-authentication

**File**: `sdk/p1mfa/P1MFASDK.ts`

**Description**: API endpoint for  Api Pingone Mfa Initialize-Device-Authentication

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/pingone/mfa/initialize-device-authentication
```


### /api/pingone/mfa/complete

**File**: `sdk/p1mfa/P1MFASDK.ts`

**Description**: API endpoint for  Api Pingone Mfa Complete

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/pingone/mfa/complete
```


### /api/pingone/calls/${encodeURIComponent(callId)}

**File**: `locked/email-v8/dependencies/utils/pingOneFetch.ts`

**Description**: API endpoint for  Api Pingone Calls ${Encodeuricomponent(Callid)}

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/pingone/calls/${encodeURIComponent(callId)}
```


### /api/env-config

**File**: `locked/email-v8/dependencies/utils/credentialManager.ts`

**Description**: API endpoint for  Api Env-Config

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/env-config
```


### /api/token-exchange

**File**: `locked/email-v8/dependencies/services/pingOneApplicationService.ts`

**Description**: API endpoint for  Api Token-Exchange

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/token-exchange
```


### /api/pingone/applications?${searchParams.toString()}

**File**: `locked/email-v8/dependencies/services/pingOneApplicationService.ts`

**Description**: API endpoint for  Api Pingone Applications?${Searchparams.Tostring()}

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/pingone/applications?${searchParams.toString()}
```


### /api/pingone/mfa/initialize-device-authentication

**File**: `locked/email-v8/dependencies/v8/services/mfaAuthenticationServiceV8.ts`

**Description**: API endpoint for  Api Pingone Mfa Initialize-Device-Authentication

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/pingone/mfa/initialize-device-authentication
```


### /api/pingone/mfa/initialize-device-authentication

**File**: `locked/email-v8/dependencies/v8/services/mfaAuthenticationServiceV8.ts`

**Description**: API endpoint for  Api Pingone Mfa Initialize-Device-Authentication

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/pingone/mfa/initialize-device-authentication
```


### /api/pingone/mfa/list-users

**File**: `locked/email-v8/dependencies/v8/services/mfaServiceV8.ts`

**Description**: API endpoint for  Api Pingone Mfa List-Users

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/pingone/mfa/list-users
```


### /api/pingone/mfa/device-authentication-policies

**File**: `locked/email-v8/dependencies/v8/services/mfaServiceV8.ts`

**Description**: API endpoint for  Api Pingone Mfa Device-Authentication-Policies

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/pingone/mfa/device-authentication-policies
```


### /api/pingone/calls/${encodeURIComponent(callId)}

**File**: `locked/unified-flow-v8u/dependencies/utils/pingOneFetch.ts`

**Description**: API endpoint for  Api Pingone Calls ${Encodeuricomponent(Callid)}

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/pingone/calls/${encodeURIComponent(callId)}
```


### /api/pingone/oidc-discovery

**File**: `locked/unified-flow-v8u/dependencies/v8/services/oidcDiscoveryServiceV8.ts`

**Description**: API endpoint for  Api Pingone Oidc-Discovery

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/pingone/oidc-discovery
```


### /api/pingone/calls/${encodeURIComponent(callId)}

**File**: `locked/device-code-v8/dependencies/utils/pingOneFetch.ts`

**Description**: API endpoint for  Api Pingone Calls ${Encodeuricomponent(Callid)}

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/pingone/calls/${encodeURIComponent(callId)}
```


### /api/credentials/load?directory=${encodeURIComponent(directory)}&filename=${encodeURIComponent(filename)}

**File**: `locked/device-code-v8/dependencies/v8/services/credentialsServiceV8.ts`

**Description**: API endpoint for  Api Credentials Load?Directory=${Encodeuricomponent(Directory)}&Filename=${Encodeuricomponent(Filename)}

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/credentials/load?directory=${encodeURIComponent(directory)}&filename=${encodeURIComponent(filename)}
```


### /api/credentials/save

**File**: `locked/device-code-v8/dependencies/v8/services/credentialsServiceV8.ts`

**Description**: API endpoint for  Api Credentials Save

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/credentials/save
```


### /api/pingone/calls/${encodeURIComponent(callId)}

**File**: `locked/fido2-v8/dependencies/utils/pingOneFetch.ts`

**Description**: API endpoint for  Api Pingone Calls ${Encodeuricomponent(Callid)}

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/pingone/calls/${encodeURIComponent(callId)}
```


### /api/env-config

**File**: `locked/fido2-v8/dependencies/utils/credentialManager.ts`

**Description**: API endpoint for  Api Env-Config

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/env-config
```


### /api/health

**File**: `locked/fido2-v8/dependencies/hooks/useServerHealth.ts`

**Description**: API endpoint for  Api Health

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/health
```


### /api/token-exchange

**File**: `locked/fido2-v8/dependencies/services/pingOneApplicationService.ts`

**Description**: API endpoint for  Api Token-Exchange

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/token-exchange
```


### /api/pingone/applications?${searchParams.toString()}

**File**: `locked/fido2-v8/dependencies/services/pingOneApplicationService.ts`

**Description**: API endpoint for  Api Pingone Applications?${Searchparams.Tostring()}

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/pingone/applications?${searchParams.toString()}
```


### /api/pingone/mfa/initialize-device-authentication

**File**: `locked/fido2-v8/dependencies/v8/services/mfaAuthenticationServiceV8.ts`

**Description**: API endpoint for  Api Pingone Mfa Initialize-Device-Authentication

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/pingone/mfa/initialize-device-authentication
```


### /api/pingone/mfa/initialize-device-authentication

**File**: `locked/fido2-v8/dependencies/v8/services/mfaAuthenticationServiceV8.ts`

**Description**: API endpoint for  Api Pingone Mfa Initialize-Device-Authentication

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/pingone/mfa/initialize-device-authentication
```


### /api/pingone/mfa/list-users

**File**: `locked/fido2-v8/dependencies/v8/services/mfaServiceV8.ts`

**Description**: API endpoint for  Api Pingone Mfa List-Users

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/pingone/mfa/list-users
```


### /api/pingone/mfa/device-authentication-policies

**File**: `locked/fido2-v8/dependencies/v8/services/mfaServiceV8.ts`

**Description**: API endpoint for  Api Pingone Mfa Device-Authentication-Policies

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/pingone/mfa/device-authentication-policies
```


### /api/env-config

**File**: `locked/mfa-hub-v8/dependencies/utils/credentialManager.ts`

**Description**: API endpoint for  Api Env-Config

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/env-config
```


### /api/logs

**File**: `locked/mfa-hub-v8/dependencies/v8/services/unifiedLoggerV8.ts`

**Description**: API endpoint for  Api Logs

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/logs
```


### /api/v1/logs

**File**: `locked/mfa-hub-v8/dependencies/v8/services/unifiedLogShipperV8.ts`

**Description**: API endpoint for  Api V1 Logs

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/v1/logs
```


### /api/users/recent/${environmentId}?limit=100

**File**: `v8/hooks/useUserSearch.ts`

**Description**: API endpoint for  Api Users Recent ${Environmentid}?Limit=100

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/users/recent/${environmentId}?limit=100
```


### /api/users/search?environmentId=${environmentId}&q=${encodeURIComponent(searchQuery)}&limit=100

**File**: `v8/hooks/useUserSearch.ts`

**Description**: API endpoint for  Api Users Search?Environmentid=${Environmentid}&Q=${Encodeuricomponent(Searchquery)}&Limit=100

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/users/search?environmentId=${environmentId}&q=${encodeURIComponent(searchQuery)}&limit=100
```


### /api/pingone/mfa/initialize-device-authentication

**File**: `v8/services/mfaAuthenticationServiceV8.ts`

**Description**: API endpoint for  Api Pingone Mfa Initialize-Device-Authentication

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/pingone/mfa/initialize-device-authentication
```


### /api/pingone/mfa/initialize-device-authentication

**File**: `v8/services/mfaAuthenticationServiceV8.ts`

**Description**: API endpoint for  Api Pingone Mfa Initialize-Device-Authentication

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/pingone/mfa/initialize-device-authentication
```


### /api/auth/passkey/options/authentication

**File**: `v8/services/passkeyServiceV8.ts`

**Description**: API endpoint for  Api Auth Passkey Options Authentication

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/auth/passkey/options/authentication
```


### /api/auth/passkey/verify-authentication

**File**: `v8/services/passkeyServiceV8.ts`

**Description**: API endpoint for  Api Auth Passkey Verify-Authentication

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/auth/passkey/verify-authentication
```


### /api/auth/passkey/options/registration

**File**: `v8/services/passkeyServiceV8.ts`

**Description**: API endpoint for  Api Auth Passkey Options Registration

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/auth/passkey/options/registration
```


### /api/auth/passkey/verify-registration

**File**: `v8/services/passkeyServiceV8.ts`

**Description**: API endpoint for  Api Auth Passkey Verify-Registration

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/auth/passkey/verify-registration
```


### /api/ciba-backchannel

**File**: `v8/services/cibaServiceV8Enhanced.ts`

**Description**: API endpoint for  Api Ciba-Backchannel

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/ciba-backchannel
```


### /api/pingone/oidc-discovery

**File**: `v8/services/oidcDiscoveryServiceV8.ts`

**Description**: API endpoint for  Api Pingone Oidc-Discovery

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/pingone/oidc-discovery
```


### /api/users/count/${environmentId}

**File**: `v8/services/sqliteStatsServiceV8.ts`

**Description**: API endpoint for  Api Users Count ${Environmentid}

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/users/count/${environmentId}
```


### /api/users/sync-metadata/${environmentId}

**File**: `v8/services/sqliteStatsServiceV8.ts`

**Description**: API endpoint for  Api Users Sync-Metadata ${Environmentid}

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/users/sync-metadata/${environmentId}
```


### /api/pingone/mfa/list-users

**File**: `v8/services/userServiceV8.ts`

**Description**: API endpoint for  Api Pingone Mfa List-Users

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/pingone/mfa/list-users
```


### /api/pingone/mfa/get-user

**File**: `v8/services/userServiceV8.ts`

**Description**: API endpoint for  Api Pingone Mfa Get-User

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/pingone/mfa/get-user
```


### /api/pingone/redirectless/authorize

**File**: `v8/services/redirectlessServiceV8.ts`

**Description**: API endpoint for  Api Pingone Redirectless Authorize

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/pingone/redirectless/authorize
```


### /api/pingone/flows/check-username-password

**File**: `v8/services/redirectlessServiceV8.ts`

**Description**: API endpoint for  Api Pingone Flows Check-Username-Password

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/pingone/flows/check-username-password
```


### /api/pingone/resume

**File**: `v8/services/redirectlessServiceV8.ts`

**Description**: API endpoint for  Api Pingone Resume

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/pingone/resume
```


### /api/pingone/mfa/device-authentication-policies

**File**: `v8/services/mfaServiceV8_Legacy.ts`

**Description**: API endpoint for  Api Pingone Mfa Device-Authentication-Policies

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/pingone/mfa/device-authentication-policies
```


### /api/pingone/mfa/device-authentication-policies

**File**: `v8/services/mfaServiceV8.ts`

**Description**: API endpoint for  Api Pingone Mfa Device-Authentication-Policies

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/pingone/mfa/device-authentication-policies
```


### /api/par

**File**: `v8/flows/PingOnePARFlowV8/hooks/usePAROperations.ts`

**Description**: API endpoint for  Api Par

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/par
```


### /api/pingone/mfa/initialize-device-authentication

**File**: `v8/lockdown/fido2/snapshot/mfaAuthenticationServiceV8.ts`

**Description**: API endpoint for  Api Pingone Mfa Initialize-Device-Authentication

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/pingone/mfa/initialize-device-authentication
```


### /api/pingone/mfa/initialize-device-authentication

**File**: `v8/lockdown/fido2/snapshot/mfaAuthenticationServiceV8.ts`

**Description**: API endpoint for  Api Pingone Mfa Initialize-Device-Authentication

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/pingone/mfa/initialize-device-authentication
```


### /api/pingone/mfa/lookup-user

**File**: `v8/lockdown/fido2/snapshot/mfaServiceV8.ts`

**Description**: API endpoint for  Api Pingone Mfa Lookup-User

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/pingone/mfa/lookup-user
```


### /api/pingone/mfa/list-users

**File**: `v8/lockdown/fido2/snapshot/mfaServiceV8.ts`

**Description**: API endpoint for  Api Pingone Mfa List-Users

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/pingone/mfa/list-users
```


### /api/pingone/mfa/set-device-order

**File**: `v8/lockdown/fido2/snapshot/mfaServiceV8.ts`

**Description**: API endpoint for  Api Pingone Mfa Set-Device-Order

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/pingone/mfa/set-device-order
```


### /api/pingone/mfa/device-authentication-policies

**File**: `v8/lockdown/fido2/snapshot/mfaServiceV8.ts`

**Description**: API endpoint for  Api Pingone Mfa Device-Authentication-Policies

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
/api/pingone/mfa/device-authentication-policies
```

