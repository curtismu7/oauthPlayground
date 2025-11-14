# Phase 3 Manual Migration Guide

**Purpose**: Step-by-step guide to migrate the 4 remaining flows from OLD CollapsibleHeaderButton to NEW CollapsibleHeader service.

**Estimated Time**: 2-3 hours per file = 8-12 hours total

---

## 🎯 Files to Migrate

1. **OAuthImplicitFlowV6.tsx** (1,723 lines, 23 sections) - START HERE (smallest)
2. **DeviceAuthorizationFlowV6.tsx** (2,412 lines, 15 sections)
3. **OIDCAuthorizationCodeFlowV6.tsx** (2,621 lines, 21 sections)
4. **OAuthAuthorizationCodeFlowV6.tsx** (2,667 lines, 25 sections)

---

## 📋 Migration Checklist (Per File)

### Step 1: Preparation
- [ ] Create backup: `git checkout -b phase3-migration-[filename]`
- [ ] Note current line count
- [ ] Count CollapsibleHeaderButton instances: `grep -c "CollapsibleHeaderButton" [file]`
- [ ] Test current functionality

### Step 2: Add Imports
- [ ] Add CollapsibleHeader import:
```typescript
import { CollapsibleHeader } from '../../services/collapsibleHeaderService';
```

- [ ] Add required icons (if missing):
```typescript
import {
    // ... existing icons
    FiBook,
    FiPackage,
    FiSend,
    FiSettings,
} from 'react-icons/fi';
```

### Step 3: Remove State Management
- [ ] Find and remove `collapsedSections` state:
```typescript
// REMOVE THIS:
const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    overview: false,
    credentials: false,
    // ... etc
});
```

- [ ] Find and remove `toggleSection` function:
```typescript
// REMOVE THIS:
const toggleSection = useCallback((key: string) => {
    setCollapsedSections(prev => ({
        ...prev,
        [key]: !prev[key]
    }));
}, []);
```

### Step 4: Convert Each Section

**OLD Pattern:**
```typescript
<CollapsibleSection>
    <CollapsibleHeaderButton
        onClick={() => toggleSection('overview')}
        aria-expanded={!collapsedSections.overview}
    >
        <CollapsibleTitle>
            <FiInfo /> OAuth 2.0 Authorization Code Overview
        </CollapsibleTitle>
        <CollapsibleToggleIcon $collapsed={collapsedSections.overview}>
            <FiChevronDown />
        </CollapsibleToggleIcon>
    </CollapsibleHeaderButton>
    {!collapsedSections.overview && (
        <CollapsibleContent>
            {/* Content here */}
        </CollapsibleContent>
    )}
</CollapsibleSection>
```

**NEW Pattern:**
```typescript
<CollapsibleHeader
    title="OAuth 2.0 Authorization Code Overview"
    subtitle="Understanding when to use the OAuth 2.0 Authorization Code flow"
    icon={<FiBook />}
    theme="yellow"
    defaultCollapsed={shouldCollapseAll}
>
    {/* Content here */}
</CollapsibleHeader>
```

### Step 5: Apply Color Scheme

**Configuration Sections** → Orange + Settings:
- "Application Configuration & Credentials"
- "Advanced Parameters"
- "PKCE Parameters"
- "Settings"

```typescript
<CollapsibleHeader
    title="Application Configuration & Credentials"
    subtitle="Configure your PingOne client and redirect URIs"
    icon={<FiSettings />}
    theme="orange"
    defaultCollapsed={shouldCollapseAll}
>
```

**Educational Sections (Odd)** → Yellow + Book:
- "Overview"
- "What is..."
- "How it Works"

```typescript
<CollapsibleHeader
    title="OAuth 2.0 Overview"
    icon={<FiBook />}
    theme="yellow"
    defaultCollapsed={shouldCollapseAll}
>
```

**Educational Sections (Even)** → Green + Book:
- "Deep Dive"
- "Details"
- "Parameters Explained"

```typescript
<CollapsibleHeader
    title="Deep Dive into OAuth"
    icon={<FiBook />}
    theme="green"
    defaultCollapsed={shouldCollapseAll}
>
```

**Execution Sections** → Blue + Send:
- "Authorization Request"
- "Generate URL"
- "Request Token"

```typescript
<CollapsibleHeader
    title="Authorization Request"
    icon={<FiSend />}
    theme="blue"
    defaultCollapsed={shouldCollapseAll}
>
```

**Results Sections** → Default + Package:
- "Token Response"
- "Code Received"
- "Results"

```typescript
<CollapsibleHeader
    title="Token Response"
    icon={<FiPackage />}
    defaultCollapsed={shouldCollapseAll}
>
```

**Success Sections** → Green + Checkmark:
- "Flow Complete"
- "Success"
- "Next Steps"

```typescript
<CollapsibleHeader
    title="Flow Complete"
    icon={<FiCheckCircle />}
    theme="green"
    defaultCollapsed={shouldCollapseAll}
>
```

### Step 6: Clean Up Styled Components (Optional)
- [ ] Remove unused styled components (if no other files use them):
```typescript
// Can remove these if unused:
const CollapsibleSection = styled.div`...`;
const CollapsibleHeaderButton = styled.button`...`;
const CollapsibleTitle = styled.div`...`;
const CollapsibleToggleIcon = styled.div`...`;
const CollapsibleContent = styled.div`...`;
```

### Step 7: Test
- [ ] Run build: `npm run build`
- [ ] Fix any TypeScript errors
- [ ] Test the flow in browser
- [ ] Check all sections expand/collapse correctly
- [ ] Verify colors match specification

### Step 8: Commit
- [ ] `git add [file]`
- [ ] `git commit -m "feat: migrate [filename] to CollapsibleHeader service with color standardization"`
- [ ] Test again
- [ ] Merge to main if successful

---

## 🎨 Quick Reference: Color Scheme

| Section Type | Icon | Theme | Example |
|--------------|------|-------|---------|
| Configuration | `<FiSettings />` | `"orange"` | Credentials, Settings |
| Execution | `<FiSend />` | `"blue"` | Requests, Generate |
| Educational (Odd) | `<FiBook />` | `"yellow"` | Overview, What is |
| Educational (Even) | `<FiBook />` | `"green"` | Deep Dive, Details |
| Results | `<FiPackage />` | (none) | Responses, Received |
| Success | `<FiCheckCircle />` | `"green"` | Complete, Success |

---

## ⚠️ Common Pitfalls

1. **Whitespace Matters**: Match exact indentation (tabs vs spaces)
2. **Don't Remove Content**: Only replace the wrapper, keep all content inside
3. **Test After Each Section**: Don't migrate all sections at once
4. **Check Dependencies**: Some sections might reference `collapsedSections` in content
5. **Conditional Rendering**: Remove `{!collapsedSections.X && (...)}` wrapper

---

## 🔍 Finding Sections

Use these commands to find sections:

```bash
# Count sections
grep -c "CollapsibleHeaderButton" src/pages/flows/[file].tsx

# List all section titles
grep -A 2 "CollapsibleTitle" src/pages/flows/[file].tsx

# Find state management
grep -n "collapsedSections" src/pages/flows/[file].tsx

# Find toggle functions
grep -n "toggleSection" src/pages/flows/[file].tsx
```

---

## 📊 Progress Tracking

### OAuthImplicitFlowV6.tsx
- [ ] Imports added
- [ ] State removed
- [ ] Section 1/23 converted
- [ ] Section 2/23 converted
- [ ] ... (continue for all 23)
- [ ] Tested
- [ ] Committed

### DeviceAuthorizationFlowV6.tsx
- [ ] Imports added
- [ ] State removed
- [ ] Sections converted (15 total)
- [ ] Tested
- [ ] Committed

### OIDCAuthorizationCodeFlowV6.tsx
- [ ] Imports added
- [ ] State removed
- [ ] Sections converted (21 total)
- [ ] Tested
- [ ] Committed

### OAuthAuthorizationCodeFlowV6.tsx
- [ ] Imports added
- [ ] State removed
- [ ] Sections converted (25 total)
- [ ] Tested
- [ ] Committed

---

## 🎯 Success Criteria

- ✅ All 4 files migrated
- ✅ All sections use new CollapsibleHeader
- ✅ Colors match specification
- ✅ Build passes with no errors
- ✅ All flows tested in browser
- ✅ No visual regressions
- ✅ 100% color standardization complete!

---

## 💡 Tips for Success

1. **Work in small batches**: Migrate 3-5 sections, test, commit
2. **Use find/replace carefully**: But verify each replacement
3. **Keep original file open**: For reference
4. **Test frequently**: Don't wait until the end
5. **Take breaks**: This is tedious work
6. **Ask for help**: If stuck, consult the team

---

## 🚀 Estimated Timeline

- **OAuthImplicitFlowV6**: 2 hours (23 sections)
- **DeviceAuthorizationFlowV6**: 1.5 hours (15 sections)
- **OIDCAuthorizationCodeFlowV6**: 2 hours (21 sections)
- **OAuthAuthorizationCodeFlowV6**: 2.5 hours (25 sections)

**Total**: 8 hours of focused work

---

**Good luck! You've got this!** 🎉

Once complete, update `COLLAPSIBLE_HEADER_MIGRATION_PLAN.md` to reflect 100% completion.
