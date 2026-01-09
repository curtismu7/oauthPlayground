# V8 Utilities Documentation

Documentation for V8 utility features and tools.

> **📖 New to the documentation?** See the [Documentation Guide](../DOCUMENTATION_GUIDE.md) for an overview of all documentation types.

## Documentation Structure

Each utility has three documentation files:

- **UI Contract** (`{utility-name}-ui-contract.md`) - Technical specification for developers
- **UI Documentation** (`{utility-name}-ui-doc.md`) - End-user guide
- **Restore Documentation** (`{utility-name}-restore.md`) - Implementation details for restoration

## Available Utilities

| Utility | UI Contract | UI Doc | Restore |
|---------|-------------|--------|---------|
| Delete All Users/Devices | ✅ | ✅ | ✅ |
| All Token Apps | ✅ | ✅ | ✅ |

## Utility Descriptions

### Delete All Users/Devices
Utility for bulk deletion of MFA devices for users with filtering options.

**Files:**
- `delete-all-users-ui-contract.md`
- `delete-all-users-ui-doc.md`
- `delete-all-users-restore.md`

### All Token Apps
Comprehensive token management interface for viewing, analyzing, and clearing OAuth/OIDC tokens.

**Files:**
- `all-token-apps-ui-contract.md`
- `all-token-apps-ui-doc.md`
- `all-token-apps-restore.md`
