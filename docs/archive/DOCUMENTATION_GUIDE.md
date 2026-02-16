# OAuth Playground Documentation Guide

**Last Updated:** 2025-01-27  
**Purpose:** Comprehensive guide to finding and understanding all UI documentation, UI contracts, and restore documentation

---

## 📚 Documentation Types

The OAuth Playground uses three types of documentation for each flow/feature:

### 1. **UI Contract** (`*-ui-contract.md`)
**Purpose:** Technical specification for developers implementing or maintaining the UI

**Contains:**
- Component structure and props
- Step-by-step flow contracts
- State management details
- API call specifications
- Error handling requirements
- Testing checklists
- Component relationships

**Audience:** Developers, QA engineers, technical reviewers

**Example:** `docs/flows/unified-flow-client-credentials-ui-contract.md`

---

### 2. **UI Documentation** (`*-ui-doc.md`)
**Purpose:** End-user guide explaining how to use the feature

**Contains:**
- Step-by-step user instructions
- Screenshots/descriptions of UI elements
- Prerequisites and setup
- Troubleshooting tips
- Expected results
- Security best practices
- When to use the feature

**Audience:** End users, product managers, support teams

**Example:** `docs/flows/unified-flow-client-credentials-ui-doc.md`

---

### 3. **Restore Documentation** (`*-restore.md`)
**Purpose:** Implementation details for restoring features if they break or drift

**Contains:**
- File locations and component paths
- Critical implementation details
- Code snippets for restoration
- Storage and persistence strategies
- State restoration mechanisms
- Common issues and fixes
- Postman collection download information

**Audience:** Developers fixing bugs, restoring features, understanding persistence

**Example:** `docs/flows/unified-flow-client-credentials-restore.md`

---

## 📁 Documentation Structure

### Unified OAuth/OIDC Flows
**Location:** `docs/flows/`

**Flows:**
- **Client Credentials**: `unified-flow-client-credentials-*.md`
- **Implicit**: `unified-flow-implicit-*.md`
- **Hybrid**: `unified-flow-hybrid-*.md`
- **Device Authorization**: `unified-flow-device-auth-*.md`
- **SPIFFE/SPIRE**: `unified-flow-spiffe-spire-*.md`

**Files per flow:**
- `unified-flow-{flow-name}-ui-contract.md`
- `unified-flow-{flow-name}-ui-doc.md`
- `unified-flow-{flow-name}-restore.md`

---

### MFA (Multi-Factor Authentication) Flows
**Location:** `docs/mfa-ui-documentation/`

**Device Types:**
- **SMS**: `MFA_SMS-*.md`
- **Email**: `MFA_EMAIL-*.md`
- **WhatsApp**: `MFA_WHATSAPP-*.md`
- **TOTP**: `MFA_TOTP-*.md`
- **FIDO2**: `MFA_FIDO2-*.md`
- **Mobile**: `MFA_MOBILE-*.md`

**Additional MFA Documentation:**
- **Configuration Page**: `MFA_CONFIG_PAGE-*.md`
- **Success Page**: `MFA_SUCCESS_PAGE-*.md`
- **Worker Token**: `MFA_WORKER_TOKEN_UI_CONTRACT.md`
- **Documentation Page Master**: `MFA_DOCUMENTATION_PAGE_MASTER.md`
- **Documentation Modal Master**: `MFA_DOCUMENTATION_MODAL_MASTER.md`

**Files per device type:**
- `MFA_{DEVICE_TYPE}_UI_CONTRACT.md`
- `MFA_{DEVICE_TYPE}_UI_DOC.md`
- `MFA_{DEVICE_TYPE}_RESTORE.md`

---

### V8 Utilities
**Location:** `docs/v8-utilities/`

**Utilities:**
- **Delete All Users/Devices**: `delete-all-users-*.md`
- **All Token Apps**: `all-token-apps-*.md`

**Files per utility:**
- `{utility-name}-ui-contract.md`
- `{utility-name}-ui-doc.md`
- `{utility-name}-restore.md`

---

## 🔍 Quick Reference

### Finding Documentation by Use Case

#### "I want to understand how a feature works"
→ Read the **UI Documentation** (`*-ui-doc.md`)

#### "I need to implement or modify a feature"
→ Read the **UI Contract** (`*-ui-contract.md`)

#### "A feature is broken and I need to fix it"
→ Read the **Restore Documentation** (`*-restore.md`)

#### "I need to test a feature"
→ Read the **UI Contract** (contains testing checklists)

#### "I need to understand how data is persisted"
→ Read the **Restore Documentation** (contains storage strategies)

#### "I want to download Postman collections"
→ Read the **Restore Documentation** (contains Postman collection download information)

---

## 📋 Documentation Index

### Unified Flows

| Flow | UI Contract | UI Doc | Restore |
|------|-------------|--------|---------|
| Client Credentials | ✅ | ✅ | ✅ |
| Implicit | ✅ | ✅ | ✅ |
| Hybrid | ✅ | ✅ | ✅ |
| Device Authorization | ✅ | ✅ | ✅ |
| SPIFFE/SPIRE | ✅ | ✅ | ✅ |

### MFA Flows

| Device Type | UI Contract | UI Doc | Restore |
|-------------|-------------|--------|---------|
| SMS | ✅ | ✅ | ✅ |
| Email | ✅ | ✅ | ✅ |
| WhatsApp | ✅ | ✅ | ✅ |
| TOTP | ✅ | ✅ | ✅ |
| FIDO2 | ✅ | ✅ | ✅ |
| Mobile | ✅ | ✅ | ✅ |
| Config Page | ✅ | ✅ | ✅ |
| Success Page | ✅ | ✅ | - |

### V8 Utilities

| Utility | UI Contract | UI Doc | Restore |
|---------|-------------|--------|---------|
| Delete All Users | ✅ | ✅ | ✅ |
| All Token Apps | ✅ | ✅ | ✅ |

---

## 🔗 Related Documentation

### Master Documents
- **MFA Documentation Page Master**: `docs/mfa-ui-documentation/MFA_DOCUMENTATION_PAGE_MASTER.md`
- **MFA Documentation Modal Master**: `docs/mfa-ui-documentation/MFA_DOCUMENTATION_MODAL_MASTER.md`
- **MFA Success Page Master**: `docs/mfa-ui-documentation/MFA_SUCCESS_PAGE_MASTER.md`

### API Documentation
- **MFA API Reference**: `docs/MFA_API_REFERENCE.md`
- **MFA Reporting APIs**: `docs/MFA_REPORTING_APIS.md`

### Architecture Documentation
- **Unified Flow Architecture**: `docs/UNIFIED_FLOW_ARCHITECTURE.md`
- **Unified Flow Component Map**: `docs/UNIFIED_FLOW_COMPONENT_MAP.md`

---

## 📝 Documentation Standards

### Naming Convention
- **UI Contract**: `{feature-name}-ui-contract.md`
- **UI Doc**: `{feature-name}-ui-doc.md`
- **Restore**: `{feature-name}-restore.md`

### Required Sections

#### UI Contract
- Overview
- Flow Steps
- Step-by-Step Contract
- Component Structure
- State Management
- API Calls
- Error Handling
- Testing Checklist
- References

#### UI Documentation
- Overview
- Prerequisites
- Step-by-Step Instructions
- Understanding the Results
- Troubleshooting
- Security Best Practices
- When to Use
- Additional Resources
- References

#### Restore Documentation
- Overview
- File Locations
- Critical Implementation Details
- Storage Strategy
- State Persistence
- URL State
- Postman Collection Downloads
- Common Issues and Fixes
- Data Flow

---

## 🆕 Recent Updates

### Postman Collection Support (2025-01-27)
All documentation now includes information about Postman collection downloads:
- **UI Contracts**: Step documentation includes Postman collection button details
- **UI Docs**: Download instructions for Postman collections
- **Restore Docs**: Postman collection generation and storage details

### Documentation Coverage
- ✅ All Unified flows have complete documentation (UI Contract, UI Doc, Restore)
- ✅ All MFA device types have complete documentation
- ✅ All V8 utilities have complete documentation
- ✅ Postman collection download feature documented across all flows

---

## 🚀 Getting Started

1. **For End Users**: Start with `*-ui-doc.md` files
2. **For Developers**: Start with `*-ui-contract.md` files
3. **For Bug Fixes**: Start with `*-restore.md` files

---

## 📞 Need Help?

- **Documentation Issues**: Check the restore documentation for common issues
- **Implementation Questions**: Refer to the UI contract for technical details
- **User Questions**: Refer to the UI documentation for step-by-step guides

---

## 🔄 Documentation Maintenance

When updating documentation:
1. Update all three document types (UI Contract, UI Doc, Restore)
2. Update version numbers and last updated dates
3. Ensure Postman collection information is included
4. Verify all links and references are correct
5. Test any code snippets or examples

---

**Last Updated:** 2025-01-27  
**Maintained By:** OAuth Playground Development Team
