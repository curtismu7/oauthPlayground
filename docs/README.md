# OAuth Playground Documentation

Welcome to the OAuth Playground documentation! This directory contains comprehensive documentation for all features, flows, and utilities.

## 📖 Quick Start

**New to the documentation?** Start here: [Documentation Guide](./DOCUMENTATION_GUIDE.md)

The Documentation Guide explains:
- What each document type is (UI Contract, UI Doc, Restore)
- Where to find documentation
- How to use the documentation
- Quick reference guide

## 📁 Directory Structure

```
docs/
├── DOCUMENTATION_GUIDE.md          # Start here! Comprehensive guide to all documentation
├── flows/                           # Unified OAuth/OIDC flow documentation
│   ├── unified-flow-*-ui-contract.md
│   ├── unified-flow-*-ui-doc.md
│   └── unified-flow-*-restore.md
├── mfa-ui-documentation/            # MFA flow documentation
│   ├── MFA_*_UI_CONTRACT.md
│   ├── MFA_*_UI_DOC.md
│   └── MFA_*_RESTORE.md
└── v8-utilities/                    # Utility feature documentation
    ├── *-ui-contract.md
    ├── *-ui-doc.md
    └── *-restore.md
```

## 🔍 Finding Documentation

### By Feature Type

- **Unified OAuth/OIDC Flows**: `docs/flows/`
- **MFA Flows**: `docs/mfa-ui-documentation/`
- **Utilities**: `docs/v8-utilities/`

### By Document Type

- **UI Contracts** (for developers): `*-ui-contract.md`
- **UI Documentation** (for users): `*-ui-doc.md`
- **Restore Documentation** (for bug fixes): `*-restore.md`

## 📚 Documentation Types

### UI Contract (`*-ui-contract.md`)
Technical specification for developers. Contains component structure, API calls, state management, and testing checklists.

### UI Documentation (`*-ui-doc.md`)
End-user guide with step-by-step instructions, troubleshooting, and best practices.

### Restore Documentation (`*-restore.md`)
Implementation details for restoring features, including file locations, code snippets, and common fixes.

## 🆕 Recent Updates

- **Postman Collection Support**: All documentation now includes Postman collection download information
- **Complete Coverage**: All flows and utilities have full documentation (UI Contract, UI Doc, Restore)

## 📖 Full Documentation Guide

For complete details, see: [Documentation Guide](./DOCUMENTATION_GUIDE.md)
