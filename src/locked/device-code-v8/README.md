# Device Code Authorization V8 - Locked Feature

**Status:** ✅ Locked Down  
**Version:** 1.0.0  
**Locked At:** 2026-01-17

## Overview

This is a locked-down version of the Device Code Authorization flow (RFC 8628) for OAuth 2.0/OIDC. This feature has been isolated to prevent breaking changes from shared service updates.

## What Was Locked

### Feature Files
- `feature/v8/services/deviceCodeIntegrationServiceV8.ts` - Core device code integration service
- `feature/services/deviceFlowService.ts` - Device flow state management service

### Dependencies
- **Device Flow Components** (23 components):
  - `DynamicDeviceFlow.tsx` - Main dynamic device flow component
  - `DeviceTypeSelector.tsx` - Device type selection component
  - All device-specific flow components (Smart TV, Gaming Console, IoT devices, etc.)

- **Services**:
  - `credentialsServiceV8.ts` - Credentials management
  - `sharedCredentialsServiceV8.ts` - Shared credentials across flows
  - `environmentIdServiceV8.ts` - Environment ID management
  - `pingOneFetch.ts` - PingOne API fetch utility
  - `logger.ts` - Logging utility

- **Components**:
  - `ColoredUrlDisplay.tsx` - URL display component
  - `StandardizedTokenDisplay.tsx` - Token display component
  - `InlineTokenDisplay.tsx` - Inline token display

- **Transitive Dependencies**:
  - `apiCallTrackerService.ts` - API call tracking

## Protection

This component is locked down to prevent:
- Breaking changes from service updates
- Changes to device flow components affecting device code authorization
- Credential service changes breaking device code flow
- API fetch utility changes breaking device code requests

## Usage

Device Code Authorization is used in:
- `src/v8u/components/UnifiedFlowSteps.tsx` - Unified OAuth flow steps (device code flow steps)
- `src/v8u/services/unifiedFlowIntegrationV8U.ts` - Unified flow integration (device code methods)

## Device Code Flow (RFC 8628)

The Device Code flow is designed for input-constrained devices:
1. Device requests authorization → receives `device_code` and `user_code`
2. User visits `verification_uri` and enters `user_code`
3. User authenticates and authorizes on separate device
4. Device polls token endpoint with `device_code` until authorized
5. Device receives tokens when user completes authorization

## Important Notes

- **Locked features are isolated** - they won't receive updates from shared services
- **To update a locked feature**, you need to unlock it, make changes, and re-lock it
- **The manifest** tracks all files and their hashes for verification
- **Never manually edit** locked features - always unlock, update, and re-lock

## Workflow

1. **Develop and test** device code changes until stable
2. **Lock the feature** using `npm run lock:device-code`
3. **Verify** the locked feature still works
4. **Continue development** on other features without worrying about breaking device code authorization

## Unlocking a Feature

To update a locked feature:

1. Make changes to the original files in `src/v8/services/` and `src/services/`
2. Re-run the lock script: `npm run lock:device-code`
