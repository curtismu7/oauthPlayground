# PingOne Identity Metrics — Update Log

## Update 1 — 2026-02-27

### Change: JSON Response View Toggle

**File:** `src/pages/PingOneIdentityMetrics.tsx`

**What changed:**
- Added `showRawJson` boolean state (defaults to `false` — formatted view on load)
- Added **Formatted / Raw JSON** toggle pill in the "Full API Response" card header
- **Formatted** view: renders `JSONHighlighter` component (syntax-highlighted, collapsible tree)
- **Raw JSON** view: renders `<pre>` block with `JSON.stringify(metrics, null, 2)` — dark background, monospace font, word-wrap enabled
- Toggle only appears when response data is present (`formattedMetrics !== null`)

**Compatibility:** PATCH — additive UI change, no API contract changes, no shared service impact.

**Risk:** Low — isolated to display logic in `PingOneIdentityMetrics`. Existing formatted view is unchanged and remains the default.
