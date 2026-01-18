# Locked Features Directory

This directory contains **isolated, locked versions** of stable features that should never break when shared services are updated.

## Purpose

When a feature is marked as "done" and locked, it gets:
- Its own isolated copy of all dependencies
- Updated imports to use locked dependencies
- Protection from breaking changes in shared services

## Current Locked Features

### FIDO2 V8 (`fido2-v8/`) ✅ LOCKED

Complete FIDO2/WebAuthn MFA flow:
- FIDO2FlowV8.tsx - Main flow component
- FIDO2ConfigurationPageV8.tsx - Configuration page
- FIDO2FlowController.ts - Flow controller
- All dependencies (services, utils, components) - 140+ files isolated

**Status:** ✅ Locked and isolated - Will never break from shared service changes

### MFA V8 (`mfa-v8/`)

Complete MFA V8 flow with all device types:
- SMS, Email, TOTP, FIDO2, WhatsApp, Mobile
- All configuration pages
- All dependencies (services, utils, components)

**Status:** Available for locking (use `npm run lock:mfa`)

## How It Works

1. **Lock a feature** using `npm run lock:mfa`
2. The feature is copied to `src/locked/<feature-name>/`
3. All dependencies are copied to `dependencies/`
4. Imports are updated to use locked dependencies
5. A manifest tracks all files and their hashes

## Important Notes

- **Locked features are isolated** - they won't receive updates from shared services
- **To update a locked feature**, you need to unlock it, make changes, and re-lock it
- **The manifest** tracks all files and their hashes for verification
- **Never manually edit** locked features - always unlock, update, and re-lock

## Workflow

1. **Develop and test** your feature until it's stable
2. **Lock the feature** using the lock script
3. **Verify** the locked feature still works
4. **Continue development** on other features without worrying about breaking locked ones

## Unlocking a Feature

To update a locked feature:

1. Make changes to the original files in `src/v8/flows/types/`
2. Re-run the lock script: `npm run lock:mfa`
3. The locked version will be updated with your changes
