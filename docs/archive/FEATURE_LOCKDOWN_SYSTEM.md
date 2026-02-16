# Feature Lockdown System

**Purpose:** Isolate stable features with their own copies of dependencies to prevent breakage when shared services are updated.

## Problem

When working on a large codebase, changes to shared services (like `mfaServiceV8`, `workerTokenServiceV8`, etc.) can inadvertently break features that depend on them, even though the feature code itself hasn't changed.

**Example:** You update `workerTokenServiceV8.ts` to add a new feature, and suddenly MFA breaks because it depends on the old API.

## Solution

The Feature Lockdown System creates **complete isolated copies** of stable features, including:
- All feature files
- All dependencies (services, utils, types, components)
- Updated imports to use isolated versions
- Manifest tracking for verification

Once locked, a feature **will never break** when shared services are updated because it uses its own isolated copy of all dependencies.

## Usage

### Lock FIDO2 V8 ✅ (Recommended - Already Locked)

```bash
# Dry run to see what would be locked
npm run lock:fido2:dry-run

# Actually lock FIDO2 (already done)
npm run lock:fido2
```

After locking, FIDO2 will be in `src/locked/fido2-v8/` and will never break when shared services are updated.

**Status:** ✅ FIDO2 is currently locked with 140+ dependencies isolated.

### Lock MFA V8

```bash
# Dry run to see what would be locked
npm run lock:mfa:dry-run

# Actually lock MFA
npm run lock:mfa
```

After locking, MFA will be in `src/locked/mfa-v8/` and will never break when shared services are updated.

### Lock MFA Hub V8 ✅ (Recommended - Already Locked)

```bash
# Dry run to see what would be locked
npm run lock:mfa-hub:dry-run

# Actually lock MFA Hub (already done)
npm run lock:mfa-hub
```

After locking, MFA Hub will be in `src/locked/mfa-hub-v8/` and will never break when shared services are updated.

**Status:** ✅ MFA Hub is currently locked with 49 dependencies isolated.

### Lock Email MFA V8 ✅ (Recommended - Already Locked)

```bash
# Dry run to see what would be locked
npm run lock:email:dry-run

# Actually lock Email MFA (already done)
npm run lock:email
```

After locking, Email MFA will be in `src/locked/email-v8/` and will never break when shared services are updated.

**Status:** ✅ Email MFA is currently locked with 133 dependencies isolated (2 feature files, 20 critical dependencies, 111 transitive dependencies).

### Lock WhatsApp MFA V8 ✅ (Recommended - Already Locked)

```bash
# Dry run to see what would be locked
npm run lock:whatsapp:dry-run

# Actually lock WhatsApp MFA (already done)
npm run lock:whatsapp
```

After locking, WhatsApp MFA will be in `src/locked/whatsapp-v8/` and will never break when shared services are updated.

**Status:** ✅ WhatsApp MFA is currently locked with 138 dependencies isolated (2 feature files, 26 critical dependencies, 110 transitive dependencies).

### Lock Unified OAuth Flow V8U ✅ (Recommended - Already Locked)

```bash
# Dry run to see what would be locked
npm run lock:unified-flow:dry-run

# Actually lock Unified Flow (already done)
npm run lock:unified-flow
```

After locking, Unified Flow will be in `src/locked/unified-flow-v8u/` and will never break when shared services are updated.

**Status:** ✅ Unified OAuth Flow V8U is currently locked with 132 dependencies isolated (8 feature files, 23 critical dependencies, 101 transitive dependencies).

### What Gets Locked

When you lock MFA, the system:

1. **Copies all MFA flow files** to `src/locked/mfa-v8/feature/`
2. **Copies all dependencies** (services, utils, components) to `src/locked/mfa-v8/dependencies/`
3. **Updates imports** in feature files to use locked dependencies
4. **Creates a manifest** at `src/locked/mfa-v8/manifest.json` with file hashes

### Directory Structure

```
src/locked/
  mfa-v8/
    manifest.json          # Lock manifest with file hashes
    feature/               # Isolated MFA flow files
      SMSFlowV8.tsx
      EmailFlowV8.tsx
      WhatsAppFlowV8.tsx
      TOTPFlowV8.tsx
      FIDO2FlowV8.tsx
      MobileFlowV8.tsx
      ... (configuration pages)
    dependencies/          # Isolated dependencies
      v8/
        services/
          mfaServiceV8.ts
          mfaAuthenticationServiceV8.ts
          mfaConfigurationServiceV8.ts
          credentialsServiceV8.ts
          workerTokenServiceV8.ts
          ...
        utils/
          toastNotificationsV8.ts
          analyticsLoggerV8.ts
          ...
        flows/
          shared/
            MFAFlowBaseV8.tsx
            MFATypes.ts
            ...
        components/
          MFADeviceLimitModalV8.tsx
          ...
```

## Features

### Current Locked Features

- **fido2-v8** ✅: Complete FIDO2/WebAuthn MFA flow (3 feature files + 140+ dependencies)
- **mfa-v8**: Complete MFA V8 flow with all device types (SMS, Email, TOTP, FIDO2, WhatsApp, Mobile)

### Locking Other Features

To lock other features, create a similar script based on `scripts/lockdown/lock-mfa.mjs`:

1. Copy `lock-mfa.mjs` to `lock-<feature>.mjs`
2. Update the file lists and dependencies
3. Add npm script: `"lock:<feature>": "node scripts/lockdown/lock-<feature>.mjs"`

## Benefits

1. **Stability**: Locked features never break when shared services are updated
2. **Isolation**: Each locked feature has its own copy of dependencies
3. **Verification**: Manifest tracks file hashes for integrity checking
4. **Flexibility**: Can still update locked features by re-locking them

## Workflow

1. **Develop and test** your feature until it's stable
2. **Lock the feature** using `lock-feature.mjs`
3. **Verify** the locked feature still works
4. **Continue development** on other features without worrying about breaking locked ones

## Important Notes

- **Locked features are isolated** - they won't receive updates from shared services
- **To update a locked feature**, you need to unlock it, make changes, and re-lock it
- **The manifest** tracks all files and their hashes for verification
- **Imports are automatically updated** to use locked dependencies

## Future Enhancements

- Automatic verification on server start
- Integration with CI/CD
- Visual diff tool for locked vs. current versions
- Selective dependency locking (lock only critical dependencies)
