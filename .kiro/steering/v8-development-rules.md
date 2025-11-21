---
inclusion: always
---

# V8 Development Rules

**Purpose:** Ensure V8 development follows consistent patterns and preserves V7 functionality

---

## 1. NAMING CONVENTIONS (MANDATORY)

### 1.1 All V8 Code Must Include "V8" Suffix

**Files:**
- ✅ `TokenDisplayV8.tsx`
- ✅ `educationServiceV8.ts`
- ✅ `modalManagerV8.ts`
- ❌ `TokenDisplay.tsx` (ambiguous)
- ❌ `educationService.ts` (ambiguous)

**Components:**
```typescript
// ✅ CORRECT
export const TokenDisplayV8: React.FC<TokenDisplayV8Props> = () => {}
interface TokenDisplayV8Props {}

// ❌ WRONG
export const TokenDisplay: React.FC<TokenDisplayProps> = () => {}
```

**Services:**
```typescript
// ✅ CORRECT
export class EducationServiceV8 {}
export const educationServiceV8 = new EducationServiceV8();

// ❌ WRONG
export class EducationService {}
```

**Hooks:**
```typescript
// ✅ CORRECT
export const useModalManagerV8 = () => {}

// ❌ WRONG
export const useModalManager = () => {}
```

---

## 2. DIRECTORY STRUCTURE (MANDATORY)

### 2.1 V8 Directory Organization

```
src/
├── v8/                              # NEW: All V8 code goes here
│   ├── components/                  # V8 components
│   │   ├── TokenDisplayV8.tsx
│   │   ├── ScopeManagerV8.tsx
│   │   ├── EducationTooltip.tsx
│   │   ├── QuickStartModal.tsx
│   │   ├── ConfigCheckerModalV8.tsx
│   │   ├── DiscoveryModalV8.tsx
│   │   ├── CredentialsModalV8.tsx
│   │   └── ErrorDisplay.tsx
│   │
│   ├── services/                    # V8 services
│   │   ├── educationServiceV8.ts
│   │   ├── modalManagerV8.ts
│   │   ├── errorHandlerV8.ts
│   │   ├── validationServiceV8.ts
│   │   ├── urlBuilderV8.ts
│   │   ├── storageServiceV8.ts
│   │   ├── apiCallDisplayV8.ts
│   │   ├── tokenDisplayServiceV8.ts
│   │   ├── scopeEducationServiceV8.ts
│   │   ├── configCheckerServiceV8.ts
│   │   └── discoveryServiceV8.ts
│   │
│   ├── hooks/                       # V8 hooks
│   │   ├── useModalManagerV8.ts
│   │   ├── useEducationV8.ts
│   │   ├── useValidationV8.ts
│   │   └── useStorageV8.ts
│   │
│   ├── types/                       # V8 types
│   │   ├── education.ts
│   │   ├── modal.ts
│   │   ├── validation.ts
│   │   └── index.ts
│   │
│   ├── utils/                       # V8 utilities
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   └── constants.ts
│   │
│   └── flows/                       # V8 flows
│       ├── OAuthAuthorizationCodeFlowV8.tsx
│       ├── ImplicitFlowV8.tsx
│       └── [future flows]
│
├── pages/flows/                     # V7 and earlier flows (PRESERVE)
│   ├── OAuthAuthorizationCodeFlowV7.tsx
│   ├── ImplicitFlowV7.tsx
│   └── [other V7 flows]
│
├── services/                        # V7 services (PRESERVE)
│   ├── comprehensiveCredentialsService.tsx
│   └── [other V7 services]
│
└── components/                      # V7 components (PRESERVE)
    └── [V7 components]
```

---

## 3. IMPORT RULES (MANDATORY)

### 3.1 V8 Code Must Import from V8 Directory

```typescript
// ✅ CORRECT - V8 importing V8
import { EducationServiceV8 } from '@/v8/services/educationServiceV8';
import { TokenDisplayV8 } from '@/v8/components/TokenDisplayV8';

// ❌ WRONG - V8 importing from old structure
import { SomeService } from '@/services/someService';
```

### 3.2 V8 Can Import Shared Utilities (If Truly Shared)

```typescript
// ✅ ALLOWED - Truly shared utilities
import { logger } from '@/utils/logger';
import { v4ToastManager } from '@/utils/v4ToastMessages';

// ⚠️ CAUTION - Consider creating V8 version if it needs customization
import { someSharedUtil } from '@/utils/someSharedUtil';
```

### 3.3 V7 Code Must NOT Import V8 Code

```typescript
// ❌ FORBIDDEN - V7 importing V8
import { EducationServiceV8 } from '@/v8/services/educationServiceV8';

// ✅ CORRECT - V7 stays in V7
import { ComprehensiveCredentialsService } from '@/services/comprehensiveCredentialsService';
```

---

## 4. LOGGING STANDARDS (MANDATORY)

### 4.1 All V8 Logs Must Use Module Tags

```typescript
// ✅ CORRECT
console.log('[📚 EDUCATION-V8] Tooltip shown', { key });
console.log('[🪟 MODAL-MANAGER-V8] Modal opened', { id });
console.log('[🚨 ERROR-HANDLER-V8] Error handled', { type });

// ❌ WRONG
console.log('Tooltip shown', { key });
console.log('Modal opened');
```

### 4.2 Module Tag Registry

```typescript
// V8 Module Tags (use these consistently)
const MODULE_TAGS = {
  EDUCATION: '[📚 EDUCATION-V8]',
  MODAL_MANAGER: '[🪟 MODAL-MANAGER-V8]',
  ERROR_HANDLER: '[🚨 ERROR-HANDLER-V8]',
  VALIDATION: '[✅ VALIDATION-V8]',
  URL_BUILDER: '[🔗 URL-BUILDER-V8]',
  STORAGE: '[💾 STORAGE-V8]',
  API_CALL: '[📡 API-CALL-V8]',
  TOKEN_DISPLAY: '[🧪 TOKEN-DISPLAY-V8]',
  SCOPE_EDUCATION: '[🔑 SCOPE-EDUCATION-V8]',
  CONFIG_CHECKER: '[🔍 CONFIG-CHECKER-V8]',
  DISCOVERY: '[📡 DISCOVERY-V8]',
};
```

---

## 5. TESTING RULES (MANDATORY)

### 5.1 All V8 Code Must Have Tests

```
src/v8/
├── components/
│   ├── TokenDisplayV8.tsx
│   └── __tests__/
│       └── TokenDisplayV8.test.tsx
│
└── services/
    ├── educationServiceV8.ts
    └── __tests__/
        └── educationServiceV8.test.ts
```

### 5.2 Test Naming Convention

```typescript
// ✅ CORRECT
describe('TokenDisplayV8', () => {
  describe('copyToken', () => {
    it('should copy token to clipboard', () => {});
  });
});

// ❌ WRONG
describe('TokenDisplay', () => {});
```

---

## 6. DOCUMENTATION RULES (MANDATORY)

### 6.1 All V8 Files Must Have Header Comments

```typescript
/**
 * @file TokenDisplayV8.tsx
 * @module v8/components
 * @description Unified token display component for all V8 flows
 * @version 8.0.0
 * @since 2024-11-16
 * 
 * @example
 * <TokenDisplayV8 
 *   tokens={tokens} 
 *   flowType="oidc" 
 *   flowKey="authz-code-v8"
 * />
 */
```

### 6.2 All V8 Services Must Document Public Methods

```typescript
/**
 * Get educational tooltip content
 * @param key - Tooltip content key (e.g., 'credential.clientId')
 * @returns Tooltip content with title, description, and optional learn more link
 * @throws {Error} If key is not found in content registry
 * @example
 * const tooltip = EducationServiceV8.getTooltip('credential.clientId');
 */
static getTooltip(key: string): TooltipContent {
  // implementation
}
```

---

## 7. CODE SAFETY RULES (MANDATORY)

### 7.1 Never Modify V7 Code When Building V8

```typescript
// ❌ FORBIDDEN - Modifying V7 service
// File: src/services/comprehensiveCredentialsService.tsx
export class ComprehensiveCredentialsService {
  // Don't add V8-specific code here!
}

// ✅ CORRECT - Create new V8 service
// File: src/v8/services/comprehensiveCredentialsServiceV8.tsx
export class ComprehensiveCredentialsServiceV8 {
  // V8-specific code here
}
```

### 7.2 Use Feature Flags for Gradual Rollout

```typescript
// ✅ CORRECT - Feature flag for V8
const useV8Components = process.env.REACT_APP_USE_V8 === 'true';

if (useV8Components) {
  return <TokenDisplayV8 {...props} />;
} else {
  return <TokenDisplay {...props} />;
}
```

### 7.3 Tag Critical Code Sections

```typescript
// V8_HARDENED: Critical validation logic - test before changing
if (!credentials.clientId) {
  throw new Error('Client ID is required');
}

// FLOW_SAFE_CHANGE: Do not modify without updating tests
const authUrl = UrlBuilderV8.buildAuthorizationUrl(params);
```

---

## 8. MIGRATION RULES (MANDATORY)

### 8.1 V8 Flows Must Be New Files

```typescript
// ❌ WRONG - Modifying existing V7 flow
// File: src/pages/flows/OAuthAuthorizationCodeFlowV7.tsx
// Adding V8 features here

// ✅ CORRECT - New V8 flow file
// File: src/v8/flows/OAuthAuthorizationCodeFlowV8.tsx
// All V8 features here
```

### 8.2 Preserve V7 Routes

```typescript
// ✅ CORRECT - Both routes exist
<Route path="/flows/oauth-authz-v7" element={<OAuthAuthorizationCodeFlowV7 />} />
<Route path="/flows/oauth-authz-v8" element={<OAuthAuthorizationCodeFlowV8 />} />

// ❌ WRONG - Replacing V7 route
<Route path="/flows/oauth-authz" element={<OAuthAuthorizationCodeFlowV8 />} />
```

---

## 9. PERFORMANCE RULES (RECOMMENDED)

### 9.1 Lazy Load V8 Components

```typescript
// ✅ CORRECT
const TokenDisplayV8 = lazy(() => import('@/v8/components/TokenDisplayV8'));

// ⚠️ CAUTION - Eager loading increases bundle size
import { TokenDisplayV8 } from '@/v8/components/TokenDisplayV8';
```

### 9.2 Memoize Expensive Operations

```typescript
// ✅ CORRECT
const validationResult = useMemo(
  () => ValidationServiceV8.validateCredentials(credentials, flowType),
  [credentials, flowType]
);
```

---

## 10. ACCESSIBILITY RULES (MANDATORY)

### 10.1 All V8 Components Must Be Accessible

```typescript
// ✅ CORRECT
<button
  aria-label="Copy token to clipboard"
  onClick={handleCopy}
>
  Copy
</button>

// ❌ WRONG
<div onClick={handleCopy}>Copy</div>
```

### 10.2 Tooltips Must Be Keyboard Accessible

```typescript
// ✅ CORRECT
<EducationTooltip
  contentKey="credential.clientId"
  triggerOnFocus={true}
  triggerOnHover={true}
>
  <Label>Client ID</Label>
</EducationTooltip>
```

---

## 11. ENFORCEMENT

### 11.1 Pre-commit Checks

```bash
# Check for V8 naming violations
npm run lint:v8-naming

# Check for V7 modifications
npm run lint:v7-protected

# Check for missing tests
npm run test:coverage -- --threshold=80
```

### 11.2 Code Review Checklist

- [ ] All files have "V8" suffix
- [ ] All files in `src/v8/` directory
- [ ] No V7 code modified
- [ ] All imports from V8 directory
- [ ] Module tags used in logging
- [ ] Tests included
- [ ] Documentation complete
- [ ] Accessibility verified

---

## 12. QUICK REFERENCE

### Creating a New V8 Component

```bash
# 1. Create file in V8 directory
touch src/v8/components/MyComponentV8.tsx

# 2. Create test file
touch src/v8/components/__tests__/MyComponentV8.test.tsx

# 3. Use V8 naming
export const MyComponentV8: React.FC<MyComponentV8Props> = () => {}

# 4. Add module tag logging
console.log('[🎯 MY-COMPONENT-V8] Action performed', { data });

# 5. Document
/** @file MyComponentV8.tsx ... */
```

### Creating a New V8 Service

```bash
# 1. Create file in V8 directory
touch src/v8/services/myServiceV8.ts

# 2. Create test file
touch src/v8/services/__tests__/myServiceV8.test.ts

# 3. Use V8 naming
export class MyServiceV8 {}

# 4. Add module tag
const MODULE_TAG = '[🎯 MY-SERVICE-V8]';

# 5. Document all public methods
/** @description ... @param ... @returns ... @example ... */
```

---

## 13. VIOLATIONS

### Common Violations to Avoid

❌ **Missing V8 suffix**
```typescript
// WRONG
export const TokenDisplay = () => {}
```

❌ **Wrong directory**
```typescript
// WRONG: src/components/TokenDisplayV8.tsx
// RIGHT: src/v8/components/TokenDisplayV8.tsx
```

❌ **Modifying V7 code**
```typescript
// WRONG: Editing src/services/comprehensiveCredentialsService.tsx
// RIGHT: Create src/v8/services/comprehensiveCredentialsServiceV8.tsx
```

❌ **Missing module tag**
```typescript
// WRONG
console.log('Action performed');

// RIGHT
console.log('[🎯 MODULE-V8] Action performed', { data });
```

❌ **No tests**
```typescript
// WRONG: Component without tests
// RIGHT: Component with __tests__/ComponentV8.test.tsx
```

---

## 14. BENEFITS

Following these rules ensures:

✅ **No Breaking Changes** - V7 code remains untouched  
✅ **Clear Separation** - V8 code is isolated and identifiable  
✅ **Easy Rollback** - Can disable V8 features if needed  
✅ **Parallel Development** - V7 and V8 can coexist  
✅ **Future-Proof** - Clear pattern for V9, V10, etc.  
✅ **Maintainable** - Easy to find and update V8 code  
✅ **Testable** - All V8 code has tests  
✅ **Documented** - All V8 code is documented  

---

**Last Updated:** 2024-11-16  
**Version:** 1.0.0  
**Status:** Active - All V8 development must follow these rules
