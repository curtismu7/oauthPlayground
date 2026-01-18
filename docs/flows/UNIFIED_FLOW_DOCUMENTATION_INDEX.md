# Unified Flow Documentation Index

**Last Updated:** 2025-01-27  
**Purpose:** Complete index of all unified flow documentation

---

## Documentation Types

Each flow has three types of documentation:

1. **UI Contract** (`*-ui-contract.md`) - Technical specification for developers
2. **UI Documentation** (`*-ui-doc.md`) - End-user guide
3. **Restore Documentation** (`*-restore.md`) - Implementation details for restoration

---

## Flow Documentation Status

| Flow Type | UI Contract | UI Doc | Restore | Status |
|-----------|-------------|--------|---------|--------|
| **Authorization Code** | ✅ | ✅ | ✅ | Complete |
| **Implicit** | ✅ | ✅ | ✅ | Complete |
| **Client Credentials** | ✅ | ✅ | ✅ | Complete |
| **Device Code** | ✅ | ✅ | ✅ | Complete |
| **Hybrid** | ✅ | ✅ | ✅ | Complete |

---

## Documentation Files

### Authorization Code Flow

- **UI Contract**: [`unified-flow-authorization-code-ui-contract.md`](./unified-flow-authorization-code-ui-contract.md)
- **UI Documentation**: [`unified-flow-authorization-code-ui-doc.md`](./unified-flow-authorization-code-ui-doc.md)
- **Restore Documentation**: [`unified-flow-authorization-code-restore.md`](./unified-flow-authorization-code-restore.md)

**Flow Type**: `oauth-authz`  
**Spec Versions**: OAuth 2.0, OIDC Core 1.0, OAuth 2.1  
**Steps**: 6 (0-5, with optional PKCE step)

### Implicit Flow

- **UI Contract**: [`unified-flow-implicit-ui-contract.md`](./unified-flow-implicit-ui-contract.md)
- **UI Documentation**: [`unified-flow-implicit-ui-doc.md`](./unified-flow-implicit-ui-doc.md)
- **Restore Documentation**: [`unified-flow-implicit-restore.md`](./unified-flow-implicit-restore.md)

**Flow Type**: `implicit`  
**Spec Versions**: OAuth 2.0 only (deprecated in OAuth 2.1)  
**Steps**: 5 (0-4)

### Client Credentials Flow

- **UI Contract**: [`unified-flow-client-credentials-ui-contract.md`](./unified-flow-client-credentials-ui-contract.md)
- **UI Documentation**: [`unified-flow-client-credentials-ui-doc.md`](./unified-flow-client-credentials-ui-doc.md)
- **Restore Documentation**: [`unified-flow-client-credentials-restore.md`](./unified-flow-client-credentials-restore.md)

**Flow Type**: `client-credentials`  
**Spec Versions**: OAuth 2.0, OAuth 2.1  
**Steps**: 4 (0-3)

### Device Code Flow

- **UI Contract**: [`unified-flow-device-auth-ui-contract.md`](./unified-flow-device-auth-ui-contract.md)
- **UI Documentation**: [`unified-flow-device-auth-ui-doc.md`](./unified-flow-device-auth-ui-doc.md)
- **Restore Documentation**: [`unified-flow-device-auth-restore.md`](./unified-flow-device-auth-restore.md)

**Flow Type**: `device-code`  
**Spec Versions**: OAuth 2.0, OAuth 2.1  
**Steps**: 5 (0-4)

### Hybrid Flow

- **UI Contract**: [`unified-flow-hybrid-ui-contract.md`](./unified-flow-hybrid-ui-contract.md)
- **UI Documentation**: [`unified-flow-hybrid-ui-doc.md`](./unified-flow-hybrid-ui-doc.md)
- **Restore Documentation**: [`unified-flow-hybrid-restore.md`](./unified-flow-hybrid-restore.md)

**Flow Type**: `hybrid`  
**Spec Versions**: OIDC Core 1.0 only  
**Steps**: 6 (0-5)

### Main Page

- **UI Contract**: [`unified-flow-main-page-ui-contract.md`](./unified-flow-main-page-ui-contract.md)
- **UI Documentation**: [`unified-flow-main-page-ui-doc.md`](./unified-flow-main-page-ui-doc.md)
- **Restore Documentation**: [`unified-flow-main-page-restore.md`](./unified-flow-main-page-restore.md)

**Component**: `UnifiedOAuthFlowV8U`  
**Purpose**: Main container for all unified flows

---

## Quick Reference

### Finding Documentation

**By Flow Type**:
- Authorization Code: `unified-flow-authorization-code-*.md`
- Implicit: `unified-flow-implicit-*.md`
- Client Credentials: `unified-flow-client-credentials-*.md`
- Device Code: `unified-flow-device-auth-*.md`
- Hybrid: `unified-flow-hybrid-*.md`

**By Document Type**:
- UI Contracts: `*-ui-contract.md`
- UI Documentation: `*-ui-doc.md`
- Restore Documentation: `*-restore.md`

### Using Documentation

**For Developers**:
- Start with **UI Contract** for technical specifications
- Use **Restore Documentation** for implementation details

**For End Users**:
- Start with **UI Documentation** for step-by-step guides

**For Bug Fixes**:
- Use **Restore Documentation** for file locations and persistence details

---

## Related Documentation

- [Documentation Guide](../DOCUMENTATION_GUIDE.md) - Overview of all documentation types
- [Unified Flow Architecture](../architecture/UNIFIED_FLOW_ARCHITECTURE.md) - System architecture
- [Unified Flow Component Map](../architecture/UNIFIED_FLOW_COMPONENT_MAP.md) - Component relationships

---

## Documentation Standards

All unified flow documentation follows these standards:

### UI Contract Sections
- Overview
- Flow Steps
- Step-by-Step Contract
- Component Structure
- State Management
- API Calls
- Error Handling
- Testing Checklist
- References

### UI Documentation Sections
- Overview
- Getting Started
- Step-by-Step Guide
- Understanding the Results
- Troubleshooting
- FAQ

### Restore Documentation Sections
- Overview
- Storage Locations
- Credential Persistence
- Token Persistence
- State Restoration
- URL Parameter Handling
- Reset Semantics
- Session Management
- Data Flow
- File Locations
- Common Issues & Fixes

---

## Maintenance

**Last Updated**: 2025-01-27  
**Maintainer**: Development Team  
**Update Frequency**: When flow implementation changes

**Update Checklist**:
- [ ] Update UI Contract when step logic changes
- [ ] Update UI Documentation when user-facing changes occur
- [ ] Update Restore Documentation when storage/persistence changes
- [ ] Update this index when new flows are added
