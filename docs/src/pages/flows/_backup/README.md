# Backup Folder - Legacy Flow Components

This folder contains **V2, V3, and V4** flow implementations that have been superseded by **V5** versions.

## Why These Were Backed Up
- ✅ All flows have V5 replacements
- ✅ Not shown in the sidebar menu
- ✅ Routes removed from App.tsx
- ✅ No longer actively maintained

## Files in This Folder (20 total)

### V4 Flows (2 files)
- `AuthorizationCodeFlowV4.tsx` - Replaced by `OAuthAuthorizationCodeFlowV5.tsx` and `OIDCAuthorizationCodeFlowV5.tsx`
- `AuthzV4NewWindsurfFlow.tsx` - Experimental V4 flow

### V3 Flows (6 files)
- `OAuth2ImplicitFlowV3.tsx` - Replaced by `OAuthImplicitFlowV5.tsx`
- `OIDCImplicitFlowV3.tsx` - Replaced by `OIDCImplicitFlowV5.tsx`
- `OIDCHybridFlowV3.tsx` - Replaced by `OIDCHybridFlowV5.tsx`
- `OAuth2ClientCredentialsFlowV3.tsx` - Replaced by `ClientCredentialsFlowV5.tsx`
- `OIDCClientCredentialsFlowV3.tsx` - Replaced by `ClientCredentialsFlowV5.tsx`
- `WorkerTokenFlowV3.tsx` - Replaced by `WorkerTokenFlowV5.tsx`

### V2 Flows (1 file)
- `EnhancedAuthorizationCodeFlowV2.tsx` - Replaced by V5 authorization code flows

### Legacy Flows - No Version (11 files)
- `AuthorizationCodeFlow.tsx` - Original implementation
- `EnhancedAuthorizationCodeFlow.tsx` - Enhanced version (pre-V2)
- `ImplicitGrantFlow.tsx` - Original implicit flow
- `ClientCredentialsFlow.tsx` - Original client credentials
- `WorkerTokenFlow.tsx` - Original worker token
- `HybridFlow.tsx` - Original hybrid flow
- `HybridPostFlow.tsx` - Hybrid flow variant
- `DeviceCodeFlow.tsx` - Original device code
- `DeviceCodeFlowOIDC.tsx` - OIDC device code variant
- `ResourceOwnerPasswordFlow.tsx` - Resource owner password (deprecated)
- `PingOnePARFlow.tsx` - Non-V5 PAR implementation

## Active V5 Flows (Still in src/pages/flows/)

### OAuth 2.0 V5
- `OAuthAuthorizationCodeFlowV5.tsx`
- `OAuthImplicitFlowV5.tsx`
- `DeviceAuthorizationFlowV5.tsx`
- `ClientCredentialsFlowV5.tsx`
- `OAuth2ResourceOwnerPasswordFlow.tsx`

### OIDC V5
- `OIDCAuthorizationCodeFlowV5.tsx`
- `OIDCImplicitFlowV5.tsx`
- `OIDCDeviceAuthorizationFlowV5.tsx`
- `OIDCHybridFlowV5.tsx`

### PingOne Tokens V5
- `WorkerTokenFlowV5.tsx`
- `PingOnePARFlowV5.tsx`
- `RedirectlessFlowV5.tsx`
- `RedirectlessFlowV5Real.tsx`

### Educational/Unsupported V5
- `CIBAFlowV5.tsx`

## Restoration Instructions

If you need to restore any of these flows:

1. Copy the file back to `src/pages/flows/`
2. Add the route back to `src/App.tsx`
3. Add the menu item to `src/components/Sidebar.tsx`
4. Update imports if needed

## Date Backed Up
October 2, 2025

## Backup Reason
Consolidating to V5 flows only for better maintainability and consistency.
