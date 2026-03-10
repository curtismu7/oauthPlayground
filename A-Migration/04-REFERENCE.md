# Quick Reference

**V9 flow template, colors, and pointers to other guides.**  
**Last updated:** February 2026

---

## 1. V9 Flow Template (minimal)

1. Create `src/pages/flows/v9/MyFlowV9.tsx`.
2. Use **blue** header gradient: `linear-gradient(135deg, #2563eb 0%, #1e40af 100%)` (red only for PingOne Management API pages).
3. Imports: use `@/v8/...` for V8 components/services (e.g. `WorkerTokenSectionV8`, `messaging` from `@/v8/utils/toastNotificationsV8`). Use `../../../` for `src/` when not using alias.
4. Register route in `src/App.tsx` and sidebar in `src/config/sidebarMenuConfig.ts`.
5. Use Modern Messaging (wait screen, banner, footer, red critical errors) — no legacy toast. See **01-MIGRATION-GUIDE.md** § 1 and § 5.

**Starter snippet (header only):**

```tsx
const FlowHeader = styled.div`
  background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
  color: #ffffff;
  padding: 2rem;
`;
```

Full template and patterns: see archived `V9_FLOW_TEMPLATE*.md` or **01-MIGRATION-GUIDE.md**.

---

## 2. Colors and Accessibility

**Approved:** Blue (#2563eb, #1e40af), Red (#dc2626), Black/White/Gray (#111827, #1f2937, #6b7280, #f9fafb, #e5e7eb). Status indicators only: green #10b981, amber #f59e0b, red #ef4444. **Forbidden:** Purple; green/amber for non-status UI.

**Accessibility:** Keyboard support, focus management after transitions/errors, `aria-live` for dynamic banners/errors. See **01-MIGRATION-GUIDE.md** § 5 and § 2.

---

## 3. Other Guides (pointers)

- **JWKS:** See `JWKS_MIGRATION_GUIDE.md` in archive (or repo search).
- **MFA:** See `MFA_MIGRATION_GUIDE.md` in archive for flow dependency map and migration order.
- **V8 flow patterns:** Import depth and sed commands in **01-MIGRATION-GUIDE.md** § 4.
- **Historical (V5→V6, V6→V7):** See `v5-to-v6/` and `v6-to-v7/` in this folder (or archive).

---

## 4. Doc Map

| Doc | Purpose |
|-----|--------|
| **01-MIGRATION-GUIDE.md** | How to migrate; quality gates; V8 layout; colors; common errors; services summary |
| **02-SERVICES-AND-CONTRACTS.md** | Service upgrade candidates; worker token consistency; priority 1 services |
| **03-TESTING-AND-RULES.md** | Zero-tolerance rules; testing prevention; infinite loop and runtime safeguards |
| **04-REFERENCE.md** | This file — template, colors, pointers |
| **README.md** | Entry point and index |

All other migration docs are in **archive/** (or legacy locations) for reference.
