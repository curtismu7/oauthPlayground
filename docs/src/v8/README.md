# V8 Architecture

**Version:** 8.0.0  
**Status:** Active Development  
**Purpose:** Reusable, educational, accessible OAuth/OIDC components and services

---

## Directory Structure

```
src/v8/
├── components/          # Reusable UI components
├── services/            # Business logic services
├── hooks/               # React hooks
├── types/               # TypeScript types
├── utils/               # Utility functions
└── flows/               # V8 flow implementations
```

---

## Naming Convention

**All V8 code MUST include "V8" suffix:**
- Files: `TokenDisplay.tsx`, `educationService.ts`
- Components: `export const TokenDisplay = () => {}`
- Services: `export class EducationService {}`
- Hooks: `export const useModalManager = () => {}`

---

## Module Tags

All logging must use consistent module tags:

- `[📚 EDUCATION-V8]` - Education service
- `[🪟 MODAL-MANAGER-V8]` - Modal management
- `[🚨 ERROR-HANDLER-V8]` - Error handling
- `[✅ VALIDATION-V8]` - Validation
- `[🔗 URL-BUILDER-V8]` - URL building
- `[💾 STORAGE-V8]` - Storage
- `[📡 API-CALL-V8]` - API calls
- `[🧪 TOKEN-DISPLAY-V8]` - Token display
- `[🔑 SCOPE-EDUCATION-V8]` - Scope education
- `[🔍 CONFIG-CHECKER-V8]` - Config checking
- `[📡 DISCOVERY-V8]` - OIDC discovery

---

## Design Principles

1. **Reusable** - Components work across all V8 flows
2. **Educational** - Built-in learning without overwhelming
3. **Accessible** - Keyboard navigation, screen readers
4. **Testable** - All code has tests
5. **Documented** - Clear documentation for all public APIs

---

## Getting Started

See `docs/V8_DESIGN_SPECIFICATION.md` for complete design documentation.

See `.kiro/steering/v8-development-rules.md` for development rules.

---

**Last Updated:** 2024-11-16
