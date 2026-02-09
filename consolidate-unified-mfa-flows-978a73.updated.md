# Consolidate Unified MFA Flows Plan

This plan consolidates the duplicate Unified MFA flows into a single, consistent implementation to eliminate confusion and maintenance overhead **without breaking existing deep links**.

## Current Situation Analysis

### Two Duplicate Flows Exist
1. **`/v8/mfa-unified`** → `UnifiedMFARegistrationFlowV8_Legacy` (direct)
2. **`/v8/unified-mfa`** → `UnifiedMFAV8_Simple` → `UnifiedMFARegistrationFlowV8_Legacy` (wrapper)

### Key Findings
- **Both routes render the same underlying flow** (`UnifiedMFARegistrationFlowV8_Legacy`)
- **`UnifiedMFAV8_Simple` is a thin wrapper** (minimal styling / indirection)
- **Two separate `UnifiedMFARegistrationFlowV8*` files exist** but only `*_Legacy` is routed today
- **Both sidebars have duplicate menu entries** with inconsistent styling and labels
- **User confusion risk**: two URLs + two nav entries that appear to do the same thing

### Files Involved
- `src/App.tsx` (routing; currently has both `/v8/mfa-unified` and `/v8/unified-mfa`)
- `src/locked/mfa-hub-v8/feature/UnifiedMFAV8_Simple.tsx` (wrapper)
- `src/v8/flows/unified/UnifiedMFARegistrationFlowV8_Legacy.tsx` (main component)
- `src/v8/flows/unified/UnifiedMFARegistrationFlowV8.tsx` (unused duplicate)
- `src/components/Sidebar.tsx` (main sidebar)
- `src/components/DragDropSidebar.tsx` (secondary sidebar)

---

## Consolidation Strategy

### Phase 1: Choose a Canonical URL (and keep old links working)
- **Canonical URL**: `/v8/unified-mfa`
- **Legacy alias**: `/v8/mfa-unified` should **redirect** (or route-alias) to the canonical URL for at least 1–2 releases
- **Rationale**: preserve bookmarks, old docs, and shared links; avoid user-facing 404s while still simplifying the codebase

> UX note: A raw 404 is the worst migration experience; redirect/alias gives the cleanup win without user pain.

### Phase 2: Update Routing (remove the wrapper, keep compatibility)
Update `App.tsx` so:
- `/v8/unified-mfa` renders `UnifiedMFARegistrationFlowV8_Legacy` directly
- `/v8/mfa-unified` becomes a redirect to `/v8/unified-mfa` (using `<Navigate ... replace />`)
- Keep `/v8/mfa-unified-callback` as-is (no change implied)

Suggested routing shape:

```tsx
<Route path="/v8/unified-mfa" element={<UnifiedMFARegistrationFlowV8_Legacy />} />
<Route path="/v8/mfa-unified" element={<Navigate to="/v8/unified-mfa" replace />} />
```

Optional (recommended): add a lightweight telemetry/log line on the legacy route hit (or a temporary banner) so you can measure remaining usage and know when it’s safe to remove the alias later.

### Phase 3: Clean Up Sidebars (one entry, durable naming)
- Keep **one** menu entry that points to `/v8/unified-mfa`
- Remove `/v8/mfa-unified` entries from both sidebars
- Standardize styling across sidebars

**Labeling guidance:**
- Avoid “New …” in the actual name (it becomes stale quickly)
- Prefer something durable: **“Unified MFA”** or **“Unified MFA (v8)”**
- If you need emphasis, use a badge that can be toggled/removed centrally (e.g., `BETA`, `NEW`, `UPDATED`) rather than baking it into the label text

### Phase 4: Code Cleanup (safe deletion)
- Delete `UnifiedMFAV8_Simple.tsx` after routing is updated
- Delete `UnifiedMFARegistrationFlowV8.tsx` **only after** confirming it’s truly unused (no dynamic import, feature flag, test, or documentation references)
- Verify no other imports reference removed files

---

## Expected Outcome

### Single Point of Entry
- **One URL users see/share**: `/v8/unified-mfa`
- **One routed component**: `UnifiedMFARegistrationFlowV8_Legacy`
- **One nav entry**: “Unified MFA” (optional badge)

### Benefits
- ✅ Eliminates “which link do I use?” confusion
- ✅ Reduces maintenance overhead (less routing + less indirection)
- ✅ Cleaner codebase (removes unnecessary wrapper)
- ✅ Consistent navigation semantics across sidebars
- ✅ Preserves deep links via redirect/alias (no user-facing 404s)

### Migration Impact
- ✅ No behavior change to the underlying flow
- ✅ Existing bookmarks continue to work (redirect/alias)
- ⚠️ Deprecation plan: after 1–2 releases (or once telemetry shows near-zero usage), remove the `/v8/mfa-unified` alias entirely

---

## Implementation Steps (Recommended Order)

1. **Update `App.tsx` routing**
   - Point `/v8/unified-mfa` directly at `UnifiedMFARegistrationFlowV8_Legacy`
   - Change `/v8/mfa-unified` to a redirect/alias to `/v8/unified-mfa`
2. **Update both sidebar components**
   - Ensure both use the same label/styling and link to `/v8/unified-mfa`
   - Remove duplicate/legacy entries
3. **Remove the wrapper**
   - Delete `UnifiedMFAV8_Simple.tsx` once nothing references it
4. **Confirm safe deletion of the duplicate flow file**
   - Search for imports / dynamic imports / tests referencing `UnifiedMFARegistrationFlowV8.tsx`
   - Delete only if truly unused
5. **Testing checklist**
   - Direct navigation to `/v8/unified-mfa`
   - Direct navigation to `/v8/mfa-unified` (should redirect)
   - Refresh on both routes
   - Sidebar navigation from both sidebars
6. Update version numbers and commit

This consolidation delivers a single, clean entry point for Unified MFA while protecting existing user links and reducing future maintenance risk.
