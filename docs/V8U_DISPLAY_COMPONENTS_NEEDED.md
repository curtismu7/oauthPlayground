# V8U Display Components Needed

**Date:** 2024-11-16  
**Status:** 🔍 Assessment

---

## Current Status

### ✅ Available in V7/Shared (Can be reused)

1. **UltimateTokenDisplay** (`src/components/UltimateTokenDisplay.tsx`)
   - Full-featured token display with decode, copy, mask
   - Supports access_token, id_token, refresh_token
   - Has educational mode
   - **Status:** Can be imported and used in V8U

2. **ColoredTokenDisplay** (`src/components/ColoredTokenDisplay.tsx`)
   - Simpler token display with syntax highlighting
   - Copy button support
   - **Status:** Can be imported and used in V8U

3. **TokenDisplayService** (`src/services/tokenDisplayService.ts`)
   - JWT decoding
   - Token validation
   - Token formatting
   - **Status:** Service - can be used directly

### ❌ Missing - Need to Create for V8

These should be created in V8 (not V8U) so they can be shared:

1. **TokenDisplayV8** Component
   - V8-specific token display
   - Uses V8 styling and patterns
   - Integrates with V8 education system
   - **Location:** `src/v8/components/TokenDisplayV8.tsx`
   - **Status:** ❌ Does not exist

2. **URIDisplayV8** Component
   - Colored URL/URI display
   - Syntax highlighting for query parameters
   - Copy button
   - Expand/collapse for long URLs
   - **Location:** `src/v8/components/URIDisplayV8.tsx`
   - **Status:** ❌ Does not exist

3. **JSONDisplayV8** Component
   - Colored JSON display
   - Syntax highlighting
   - Copy button
   - Expand/collapse
   - **Location:** `src/v8/components/JSONDisplayV8.tsx`
   - **Status:** ❌ Does not exist

4. **CodeDisplayV8** Component
   - Generic code display with syntax highlighting
   - Multiple language support
   - Copy button
   - **Location:** `src/v8/components/CodeDisplayV8.tsx`
   - **Status:** ❌ Does not exist

### 🔄 V8U-Specific Components Needed

1. **Breadcrumbs in Header**
   - Show current spec version (OAuth 2.0 / 2.1 / OIDC)
   - Show current flow type
   - Show current step
   - **Location:** Update `src/v8u/flows/UnifiedOAuthFlowV8U.tsx`
   - **Status:** ❌ Not implemented

---

## Recommended Approach

### Phase 1: Add Breadcrumbs to V8U Header ✅ (Do Now)

Update `UnifiedOAuthFlowV8U.tsx` header to show:
```
Home > V8U Unified Flow > OAuth 2.0 > Authorization Code > Step 2: Generate Auth URL
```

### Phase 2: Create V8 Display Components (Do Next)

Create these in V8 so they can be shared by both V8 and V8U:

1. **TokenDisplayV8.tsx**
   ```typescript
   interface TokenDisplayV8Props {
     tokens: TokenSet;
     flowType: FlowType;
     showDecode?: boolean;
     showCopy?: boolean;
     showMask?: boolean;
   }
   ```

2. **URIDisplayV8.tsx**
   ```typescript
   interface URIDisplayV8Props {
     uri: string;
     label?: string;
     showCopy?: boolean;
     showExpand?: boolean;
   }
   ```

3. **JSONDisplayV8.tsx**
   ```typescript
   interface JSONDisplayV8Props {
     data: object;
     label?: string;
     showCopy?: boolean;
     showExpand?: boolean;
   }
   ```

### Phase 3: Use V8 Components in V8U (After Phase 2)

Import and use V8 display components in V8U:
```typescript
import { TokenDisplayV8 } from '@/v8/components/TokenDisplayV8';
import { URIDisplayV8 } from '@/v8/components/URIDisplayV8';
import { JSONDisplayV8 } from '@/v8/components/JSONDisplayV8';
```

---

## Temporary Solution (Until Phase 2)

For now, V8U can use the existing V7 components:
```typescript
import { UltimateTokenDisplay } from '@/components/UltimateTokenDisplay';
import { ColoredTokenDisplay } from '@/components/ColoredTokenDisplay';
```

But these should be replaced with V8 components once created.

---

## Priority Order

1. **🔥 HIGH: Breadcrumbs** - Add to V8U header now
2. **🔥 HIGH: TokenDisplayV8** - Most commonly needed
3. **🟡 MEDIUM: URIDisplayV8** - Needed for auth URLs
4. **🟡 MEDIUM: JSONDisplayV8** - Needed for response display
5. **🟢 LOW: CodeDisplayV8** - Nice to have for examples

---

## Next Steps

1. ✅ Add breadcrumbs to V8U header (do now)
2. Create TokenDisplayV8 component in V8
3. Create URIDisplayV8 component in V8
4. Create JSONDisplayV8 component in V8
5. Update V8U to use V8 display components
6. Remove dependency on V7 display components

