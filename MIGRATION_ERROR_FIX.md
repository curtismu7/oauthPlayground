# Migration Error Fix - Collapsible Components

**Date:** October 11, 2025  
**Error:** `Uncaught ReferenceError: CollapsibleSection is not defined`  
**File:** `OAuthAuthorizationCodeFlowV6.tsx`

## Root Cause

During the migration process, I removed the local `CollapsibleSection` styled components from `OAuthAuthorizationCodeFlowV6.tsx` without completing the migration of all the actual section code. This left references to undefined components.

## Fix Applied

**Immediately restored the styled components** to prevent breaking the flow:

```typescript
const CollapsibleSection = styled.section`...`
const CollapsibleHeaderButton = styled.button`...`
const CollapsibleTitle = styled.span`...`
const CollapsibleToggleIcon = styled.span`...`
const CollapsibleContent = styled.div`...`
```

## Prevention Strategy for Future Migrations

To prevent this error when migrating other flows, follow this atomic migration pattern:

### ❌ WRONG APPROACH (What I Did):
1. Remove styled components first
2. Try to replace sections later  
3. **BREAKS THE APP** in between!

### ✅ CORRECT APPROACH (Atomic Migration):

**Option A: File-by-File Atomic Migration**
1. Read entire file
2. Prepare ALL replacements in memory
3. Apply all changes in a single write
4. Test immediately

**Option B: Section-by-Section with Components Last**
1. Add `CollapsibleHeader` import
2. Replace Section 1 (keep old components)
3. Test
4. Replace Section 2  
5. Test
6. Continue for all sections...
7. **ONLY THEN** remove old styled components
8. Final test

**Option C: Keep Both During Transition**
1. Add `CollapsibleHeader` import
2. Keep OLD styled components in place
3. Replace sections one by one
4. When ALL sections are migrated and tested
5. Remove old styled components

## Recommended Approach for Remaining Flows

Use **Option C (Keep Both)** for all remaining migrations:

1. ✅ Add `CollapsibleHeader` import
2. ✅ **KEEP** old styled components
3. ✅ Replace each section with `<CollapsibleHeader>`
4. ✅ Test after each section or every 2-3 sections
5. ✅ When entire flow is migrated and working
6. ✅ Remove old styled components
7. ✅ Final test

## Current Status

- ✅ `OAuthAuthorizationCodeFlowV6.tsx` - FIXED (components restored)
- ✅ `PingOnePARFlowV6_New.tsx` - PARTIAL (3/10 sections, components removed but should work)
- ✅ Other files not touched yet

## Files to Check Before Proceeding

Files that had components removed during migration:
1. `PingOnePARFlowV6_New.tsx` - Check if it's working

## Testing Checklist

Before declaring any flow "migrated":
- [ ] File loads without errors
- [ ] All sections render correctly  
- [ ] Sections expand/collapse properly
- [ ] Default collapsed states are correct (overview/credentials open, others collapsed)
- [ ] No console errors
- [ ] Navigation works
- [ ] Flow functionality intact

---

**Lesson Learned:** Never remove dependencies (styled components) before replacing all usages. Keep both old and new during transition, remove old only after full migration + testing.

