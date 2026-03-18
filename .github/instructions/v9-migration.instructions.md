---
applyTo: "src/pages/flows/v9/**,src/v8/**,src/v7/**,src/v8u/**,src/services/v9/**,A-Migration/**"
---

# V7 / V8 → V9 Migration

> **Source of truth for this topic:** `A-Migration/01-MIGRATION-GUIDE.md` through `04-REFERENCE.md`.  
> Read those four docs before starting any migration.

---

## Pre-Migration Checklist

Before touching any V7/V8 flow:
1. Build a feature inventory: every function, UI widget, service call, state variable, error path, and data-persistence point in the source flow.
2. Read `docs/UPDATE_LOG_AND_REGRESSION_PLAN.md` Section 4 (regression checklist) and Section 7 (do-not-break areas).
3. Read `A-Migration/02-SERVICES-AND-CONTRACTS.md` — check worker token usage and whether a service upgrade is needed before migrating.

---

## Required: Modern Messaging (no legacy toast)

All V9 flows must use Modern Messaging. Remove `v4ToastManager` when you touch a file.

| Situation | Use |
|-----------|-----|
| Blocking work (user can't proceed) | Wait screen |
| Persistent context / warning | Banner messaging |
| Unrecoverable error | Red critical error block with next-step guidance |
| Low-noise status (polling, copy) | Footer messaging |

**Never** use `console.error` / `console.warn` for runtime failures — use structured logging (`logger`) + user-facing message.

---

## Engineering Quality Gates (every migration)

- [ ] Modern Messaging used (wait / banner / red error / footer)
- [ ] No `console.error` / `console.warn` for failures
- [ ] Async cleanup: `AbortController` for fetches; clear intervals/timeouts; no setState after unmount
- [ ] Flow state machine: `idle → loading → success → error`; disable submit while in-flight; safe retries
- [ ] Input validation with guidance; critical error block for "can't proceed"
- [ ] Tokens / secrets masked in UI (never rendered raw)
- [ ] Accessibility: keyboard, focus after transitions, `aria-live` for dynamic content
- [ ] At least one failure-path test + one happy-path test for critical flows
- [ ] `tsc --noEmit` and `npx biome check src/` pass before merge

---

## Services-First Rule

- No direct `fetch` / protocol code in UI — call a service (or a hook that calls a service).
- No duplicated protocol logic across flows — centralize in `src/services/` or `src/services/v9/`.
- Before adding non-trivial logic: search `src/services/` first.

**Worker token (mandatory pattern):**
- Use `WorkerTokenSectionV8` / `WorkerTokenModalV8` — no custom "Get Token" buttons.
- Load credentials from `unifiedWorkerTokenService.loadCredentials()` or `unifiedTokenStorage.getWorkerTokenCredentials()` first; fall back to localStorage.
- Save credentials via `unifiedTokenStorage.storeWorkerTokenCredentials()` — not direct `localStorage.setItem`.

---

## New V9 Flow: File Checklist

1. Create `src/pages/flows/v9/MyFlowV9.tsx`
2. Fix V8-internal imports using path alias `@/v8/...`:
   ```bash
   FLOW="src/pages/flows/v9/MyFlowV9.tsx"
   sed -i '' "s|from '../services/|from '@/v8/services/|g" "$FLOW"
   sed -i '' "s|from '../components/|from '@/v8/components/|g" "$FLOW"
   sed -i '' "s|from '../hooks/|from '@/v8/hooks/|g" "$FLOW"
   sed -i '' "s|from '../utils/|from '@/v8/utils/|g" "$FLOW"
   ```
3. Register route in `src/App.tsx`
4. Add sidebar entry in `src/config/sidebarMenuConfig.ts`
5. Use blue header gradient (see colors below)

---

## UI Color Standards

**Approved colors:**

| Use | Value |
|-----|-------|
| Primary actions / headers | `#2563eb`, `#1e40af`, `#1e3a8a` |
| Header gradient (default) | `linear-gradient(135deg, #2563eb 0%, #1e40af 100%)` |
| Header gradient (PingOne Mgmt API pages **only**) | `linear-gradient(135deg, #ef4444 0%, #dc2626 100%)` |
| Errors / destructive | `#dc2626`, `#fef2f2` |
| Neutral | `#111827`, `#1f2937`, `#6b7280`, `#f9fafb`, `#e5e7eb` |
| Status: valid | `#10b981` (badges/indicators **only**) |
| Status: warning | `#f59e0b` (badges/indicators **only**) |
| Status: invalid | `#ef4444` (badges/indicators **only**) |

**Forbidden:** Purple. Green/amber outside status indicators. No orange.

---

## Infinite Loop Prevention

Dangerous pattern — never write this:
```ts
// ❌ useEffect depends on state it updates
useEffect(() => {
  controller.setCredentials(load());
}, [controller.credentials, controller.setCredentials]);
```

Safe approach: depend only on inputs that don't change as a side effect of the effect (route params, selected variant). Use a stable `ref` or a one-time init guard if reacting to credentials.

**Audit command:**
```bash
grep -n "useEffect" src/pages/flows/v9/MyFlowV9.tsx
```
Review every dependency array for state that the effect itself writes.

---

## Migration Status Quick-Reference

| Area | Status |
|------|--------|
| Auth Code + PKCE, Device Auth, Client Credentials, Hybrid, JWT Bearer, SAML Bearer, RAR, CIBA, Redirectless | ✅ Migrated to V9 |
| Token Exchange V7 | 🔴 CRITICAL — not yet V9 |
| PingOne PAR, PingOne MFA, Worker Token V7, ROPC | 🔴 Not yet V9 |
| Auth Code V8, Implicit V8, DPoP Auth Code V8 | 🟡 V8 in sidebar — no V9 yet |

**Service migration strategy:** Foundation (logging) → Token (worker token status) → MFA → Credentials. Always add an adapter so existing V8 callers keep working during rollout.

---

## Post-Migration Parity Test

Before merge, verify against the source flow:
- [ ] Every feature in V7/V8 exists in V9 (no "we'll add it later")
- [ ] Worker token loads / saves correctly
- [ ] Error paths show user-facing guidance (not raw stack traces)
- [ ] Data persistence survives page reload
- [ ] No regressions in other flows (run `npm test`)
