# Worker-Token Credentials Dialog — Consolidation Plan

**Goal:** One canonical credentials component across the whole platform, with size/orientation
variants and a grant-type selector (Client Credentials + Authorization Code). Replaces 6–7
versioned forks (~6,000 lines) across ~44 call-sites.

**Reference design:** `~/Desktop/worker-token-modal-mock.html` (approved) — single-screen layout,
AI-Demo (ping2026) styling, collapsed help `<details>`, `.ctl-select` skins, app-standard switch,
segmented grant-type control, conditional Redirect URI field.

---

## Target component

`src/components/credentials/WorkerTokenCredentials.tsx` (unversioned, per de-version-on-touch rule).

```ts
type GrantType = 'client_credentials' | 'authorization_code';

interface WorkerTokenCredentialsProps {
  variant?: 'modal' | 'inline';     // dialog vs in-page section (default 'modal')
  size?: 'compact' | 'full';        // replaces old `compact` (default 'full')

  // modal-only
  isOpen?: boolean;
  onClose?: () => void;
  showTokenOnly?: boolean;          // unifies V8 showTokenOnly + V9 skipCredentialsStep

  // shared
  environmentId?: string;
  grantType?: GrantType;            // NEW
  redirectUri?: string;             // NEW (authorization_code only)
  onTokenGenerated?: (token: string) => void;  // unifies onTokenGenerated + onTokenUpdated

  // inline (section) extras
  showStatusCard?: boolean;
  showSettings?: boolean;
  silentApiRetrieval?: boolean;
  onSilentApiRetrievalChange?: (v: boolean) => void;
  showTokenAtEnd?: boolean;
  onShowTokenAtEndChange?: (v: boolean) => void;
}
```

`variant="inline"` renders the old Section (status card + "Get token" button that opens the
`variant="modal"` form). Reuse existing services unchanged: `unifiedWorkerTokenService`,
`workerTokenCredentialsService`, `AuthMethodServiceV8`, `MFAConfigurationServiceV8`.

---

## Phase 0 — Free wins (no behavior change)
- [ ] Delete dead `components/CredentialSetupModal.tsx` (1354 lines, **0 imports**).
- [ ] Land the visual single-screen reduction already in PR #11.
- **Done when:** `npm run type-check` + `biome lint` clean; build green.

## Phase 1 — Build the canonical component
- [ ] Create `WorkerTokenCredentials.tsx` from the mock: modal + inline variants, both grant types.
- [ ] Inline the AI-Demo tokens/controls locally (oauthPlayground does NOT load AI-Demo's
      `controls.css`/`v2-global-theme.css` — do not rely on shared classes).
- [ ] Client Credentials path: identical behavior to today's V8 modal (POST to token endpoint).
- [ ] Authorization Code path: grant-type selector + Redirect URI field. **Wiring is real work**
      — `/authorize` → callback → code exchange + PKCE/state; a registered redirect URI on the
      Worker app. If not ready, ship the option disabled with a "coming soon" note rather than a
      broken flow.
- [ ] Fold in the education modal content as the collapsed `<details>` (retires
      `WorkerTokenVsClientCredentialsEducationModalV8`).
- **Done when:** Storybook/standalone render matches the mock for all variant×size×grantType combos;
      unit tests for token-generation handler pass.

## Phase 2 — Migrate V8 modal call-sites (17)
Repoint each `WorkerTokenModalV8` import → `WorkerTokenCredentials variant="modal"`:
`v8/components/AppPickerV8`, `v8/components/WorkerTokenSectionV8`, `v8/flows/EmailMFASignOnFlowV8`,
`MFAConfigurationPageV8`, `MFADeviceManagementFlowV8`, `MFADeviceOrderingFlowV8`, `MFAReportingFlowV8`,
`PingOneProtectFlowV8`, `shared/MFAFlowBaseV8`, `types/FIDO2ConfigurationPageV8`,
`types/MobileOTPConfigurationPageV8`, `v8/pages/DeviceAuthenticationDetailsV8`,
`MFADeviceCreateDemoV8`, `v8/services/workerTokenUIServiceV8`, `v8u/components/UnifiedFlowSteps`,
`v8u/flows/UnifiedOAuthFlowV8U`, `v8u/pages/TokenMonitoringPage`.
- [ ] Also fold `WorkerTokenRequestModalV8` (only used by the V8 modal) as an internal sub-step.
- [ ] Delete `WorkerTokenModalV8.tsx` + `WorkerTokenRequestModalV8.tsx` when last importer flips.
- **Done when:** build green; the chip/flow smoke paths that open the modal still generate a token.

## Phase 3 — Migrate V8 section call-sites (11)
Repoint `WorkerTokenSectionV8` → `WorkerTokenCredentials variant="inline"` (map `compact`→`size`,
keep `showStatusCard`/`showSettings`/silent/showTokenAtEnd props):
`pages/Configuration`, `CredentialManagement`, `EnvironmentManagementPageV8`, `PingOneAuditActivities`,
`PingOneIdentityMetrics`, `PingOneUserProfile`, `PingOneWebhookViewer`, `docs/migration/MigrationGuide`,
`protect-portal/ProtectPortalApp`, `v8/flows/unified/UnifiedMFARegistrationFlowV8`,
`v8/pages/DeleteAllDevicesUtilityV8`.
- [ ] Delete `WorkerTokenSectionV8.tsx` when last importer flips.

## Phase 4 — Migrate V9 modal + section (11 + 2)
- [ ] `WorkerTokenModalV9` (11 sites incl. `commonImportsService`, `comprehensiveCredentialsService`,
      `ConfigurationURIChecker`, `CompactAppPickerDemo`, `CustomDomainTestPage`, `TokenRevocationFlow`,
      `SDKExamplesHome`, `HelioMartPasswordReset`, `ImplicitFlowTest`, `MFAFlowsApiTest`).
- [ ] `WorkerTokenSectionV9` (2 sites: `McpServerConfigFlowV9`, `PingOneSessionsAPIFlowV9`).
- [ ] Delete both V9 files when last importer flips.

## Phase 5 — Legacy + Authorization-Code modal
- [ ] `WorkerTokenModal` (legacy, 1 site: `OrganizationLicensing`) → canonical; delete file.
- [ ] `AuthorizationCodeConfigModal` (2 sites: `KrogerGroceryStoreMFA`, `HelioMartPasswordReset`) →
      decide: merge into canonical "Authorization Code" branch, or keep separate. If merged, delete.
- [ ] `WorkerTokenPromptModalV8` (1 site: `MFAFlowBaseV8`) → fold or repoint.

## Phase 6 — Cleanup
- [ ] Remove now-unused service helpers / `workerTokenModalHelperV8`, `workerTokenUIServiceV8` if orphaned.
- [ ] Grep for any remaining `WorkerTokenModalV*` / `WorkerTokenSectionV*` imports → 0.
- [ ] Update tests referencing deleted components.

---

## Out of scope (flag, separate effort)
Generic OAuth-flow credential inputs — related pattern, **not** worker-token specific:
`components/FlowCredentials.tsx` (20 sites), `components/CredentialsInput.tsx` (3),
`v8u/components/CredentialsFormV8U.tsx` (6795 lines, 1). Consolidating these is a much larger,
independent project.

## Risks & mitigations
- **44 call-sites** → migrate in version-batched PRs (Phase 2/3/4/5 each its own PR); never delete a
  file until its last importer flips, verified by grep.
- **Authorization Code flow is net-new behavior** — gate behind the disabled-option fallback if the
  redirect/callback/code-exchange wiring isn't ready; don't block the consolidation on it.
- **Prop drift** between V8/V9 (showStatusCard/silent/showTokenAtEnd exist only on V8 section) —
  unified props superset covers both; V9 sites simply omit the extras.
- **Styling divergence** — inline the AI-Demo tokens; verify served bundle (Docker layer cache can
  ship a stale bundle — `--no-cache` if the change doesn't appear).
- **Worktree image-name gotcha** if deploying from a worktree — set `COMPOSE_PROJECT_NAME`.

## Success criteria (whole effort)
1. Exactly one credentials component; `rg "WorkerTokenModalV|WorkerTokenSectionV"` returns 0 imports.
2. Every migrated surface still generates a worker token (CC path) with no regression.
3. Grant-type selector + Redirect URI present everywhere; Authz-Code either fully wired or cleanly disabled.
4. `npm run type-check` + `biome lint` + `vite build` all green.
5. ~6,000 lines / 6–7 files removed.
