# eslint-disable / biome-ignore fix plan

**Goal:** Reduce the 172 eslint-disable + biome-ignore count by fixing root causes and removing suppressions.

**Dashboard:** The cleanliness dashboard tracks this under "ESLint/Biome disable directives". Run `npm run update-dashboards` to refresh counts.

---

## Categories and approach

| Category | Example | Fix strategy |
|----------|---------|--------------|
| **no-explicit-any** | flowUIService cache types, report params | Add proper types (interfaces, generics, or `unknown` where appropriate). |
| **no-alert** | V7 pages, EnvironmentManagementPageV8, MFAFeatureFlagsAdminV8 | Replace `alert()` / `confirm()` with `modernMessaging` or a confirmation modal. |
| **no-unused-vars** | CompleteMFAFlowV7, ConfigCheckerButtons, CredentialsFormV8U | Remove unused variables or prefix with `_`. |
| **useExhaustiveDependencies / react-hooks/exhaustive-deps** | useEffect/useCallback deps | Add correct deps, or wrap in useCallback/useRef where deps are intentionally omitted; keep comment only if truly intentional. |
| **noStaticOnlyClass** | logFileService, V8 services | Lower priority; refactor to functions or keep if legacy API contract required. |
| **a11y (noStaticElementInteractions, useKeyWithClickEvents, useSemanticElements)** | Modals, drop zones, sidebar | Prefer semantic elements and keyboard handlers; keep only where library (e.g. DragDrop) or Bootstrap constrains the DOM. |
| **noDangerouslySetInnerHtml** | Trusted helper text, syntax highlight | Ensure content is sanitized; keep if documented and safe. |
| **noTemplateCurlyInString** | Postman generator templates | Intentional for generated script code; keep or narrow to template files. |

---

## Completed

- **flowUIService.tsx** – Replaced 21× `@typescript-eslint/no-explicit-any` on styled-component caches with a `StyledCache` type alias (`ReturnType<typeof styled.div>` union, etc.).

---

## Suggested order for next sessions

1. **no-alert** – Replace with `modernMessaging.showBanner` / confirm modal (V7 pages, EnvironmentManagementPageV8, MFAFeatureFlagsAdminV8, PingOneWebhookViewer, V9FlowRestartButton, etc.).
2. **no-unused-vars** – Remove or rename (CompleteMFAFlowV7, ConfigCheckerButtons, KrogerGroceryStoreMFA).
3. **no-explicit-any** – Add types in remaining files (KrogerGroceryStoreMFA, MFAReportingFlowV8, ConfigurationSummaryCard, CredentialSetupModal, etc.).
4. **useExhaustiveDependencies** – Review each effect; add deps or document why omitted (CredentialsFormV8U, UnifiedMFARegistrationFlowV8, WorkerTokenFlowV9, etc.).
5. **a11y** – Fix where straightforward (e.g. add `role`/`onKeyDown`); leave documented exceptions for library constraints.

---

## Verification

- After changes: `npm run update-dashboards` and check "eslint-disable count" on the cleanliness dashboard.
- Run `pnpm run check` or `npm run fix` (Biome) and fix any new issues; avoid adding new suppressions unless documented here.
