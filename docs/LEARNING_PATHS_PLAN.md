# Learning Paths (#3) — Implementation Plan

A curriculum spine over the existing flows. The app has 16 `flows2` flows
routed under `/v2/flows/*` and no ordering — a newcomer can't tell whether to
start with Client Credentials or CIBA. Learning Paths add ordered tracks,
checkpoint questions between flows, and locally-stored progress, reusing what
already exists instead of building new flow UI.

## Goal / success criteria

- Three ordered tracks a learner can follow start-to-finish.
- Each track step links to an existing `/v2/flows/*` page; between steps, a
  short checkpoint quiz (2–3 questions) gates "mark complete."
- Progress (which steps done, which track active) persists across reloads
  locally — no backend, consistent with the app's local-educational threat
  model.
- A learner can always free-roam; paths are guidance, not a lock.

## What already exists (reuse, don't rebuild)

- **Flows**: 16 `flows2` flows (`src/flows2/flows/*.flow.tsx`) at stable
  `/v2/flows/*` routes.
- **Quiz content + shape**: `src/services/v7EducationalContentService.ts`
  already defines `interactiveLearning.quizzes: { question, options[],
  correctAnswer, explanation }[]` with real questions (state parameter, nonce,
  required auth params, OIDC scopes). Harvest these as the checkpoint seed;
  the type is the contract to reuse.
- **Local storage canonical**: follow `docs/STORAGE_CANONICAL.md` — add a
  small dedicated progress store, do NOT scatter `localStorage` calls.
- **Framework**: `FlowContainer`/`FlowStep`/`tokens`/`primitives` for the
  path UI so it matches the flows.

## Data model

New file `src/flows2/content/learningPaths.ts`:

```ts
export interface Checkpoint {
  question: string;
  options: string[];
  correctAnswer: number;   // index — same shape as v7EducationalContentService
  explanation: string;
}
export interface PathStep {
  id: string;              // stable, e.g. "authz-code"
  flowRoute: string;       // "/v2/flows/authorization-code"
  title: string;
  why: string;             // one sentence: why this step, here
  checkpoints: Checkpoint[];
}
export interface LearningPath {
  id: 'oauth-fundamentals' | 'oidc' | 'advanced-pingone';
  title: string;
  summary: string;
  steps: PathStep[];
}
export const learningPaths: LearningPath[];
```

### The three tracks (proposed ordering)

1. **OAuth Fundamentals** — Client Credentials (simplest, no user) →
   Authorization Code + PKCE (the one that matters) → Refresh Token →
   Token Introspection → Token Revocation.
2. **OIDC** — OIDC Discovery → Authorization Code with `openid` (id_token,
   nonce, UserInfo) → Implicit/Hybrid (and *why they're discouraged*) →
   UserInfo.
3. **Advanced / PingOne** — PAR → RAR → DPoP → Token Exchange → Device
   Authorization → Redirectless. (These are where PingOne-specific behavior is
   richest; pairs naturally with the Spec-vs-PingOne callouts from feature #4.)

## Progress store

New file `src/flows2/services/learningProgress.ts` — a thin typed wrapper over
one namespaced localStorage key (`flows2:learning-progress`):

```ts
interface Progress { activePathId: string | null; completedStepIds: string[]; }
export function getProgress(): Progress;
export function markStepComplete(pathId: string, stepId: string): void;
export function setActivePath(pathId: string | null): void;
export function resetProgress(): void;
```

One key, one module — no direct `localStorage` in components (per
`STORAGE_CANONICAL.md`).

## UI (three components + one page)

New files under `src/flows2/learning/`:

- **`LearningPathsPage.tsx`** (route `/v2/learn`) — the three tracks as cards
  with a progress ring (`completedStepIds ∩ path.steps`), "Start / Continue".
- **`PathOverview.tsx`** (route `/v2/learn/:pathId`) — ordered step list, each
  showing its `why`, done/current/locked state, deep-link to the flow route,
  and a "checkpoint" affordance.
- **`CheckpointModal.tsx`** — renders a step's `checkpoints`; on all-correct,
  calls `markStepComplete` and advances. Reuse the quiz shape from
  v7EducationalContentService; show `explanation` after each answer.
- **`PathProgressBadge.tsx`** — small "Step 2 of 5 · OAuth Fundamentals"
  banner the flow pages can optionally render when reached via a path
  (read `activePathId`); keeps free-roam unaffected when no path is active.

## Wiring

- Add routes in `src/App.tsx`: `/v2/learn` and `/v2/learn/:pathId` (lazy, like
  the other v2 routes).
- Add a "Learn" entry to the sidebar/nav pointing at `/v2/learn`.
- Optional, low-risk: flows read `activePathId` to show `PathProgressBadge`.
  No change to flow logic — the badge is additive and self-hides.

## Phasing (each independently shippable)

1. **Content + store** — `learningPaths.ts` (all three tracks, harvest
   checkpoints from v7 content) + `learningProgress.ts` + unit tests for the
   store (get/mark/reset round-trip). No UI yet. *Ship.*
2. **Pages** — `LearningPathsPage` + `PathOverview` + route wiring + nav
   entry. Deep-links to flows work; completion is manual (button) for now.
   *Ship.*
3. **Checkpoints** — `CheckpointModal` gating completion + `PathProgressBadge`
   in flows. *Ship.*

## Verification per phase

- `npx vitest run src/flows2/services/__tests__/learningProgress.test.ts`
  (store round-trip, ∩ math).
- `npx vite build` succeeds; `node scripts/type-check-ratchet.mjs` holds the
  baseline.
- Manual: start a path, open a flow, pass a checkpoint, reload → progress
  survives; with no active path, flows render unchanged (no badge).

## Scope guards

- Do NOT add a backend or accounts — local progress only.
- Do NOT modify flow logic; the badge and deep-links are additive.
- Checkpoint content must be spec-accurate; reuse/extend the existing
  v7 questions rather than inventing shaky ones.
- Estimated size: content ~1 file, store ~1 file, UI ~4 files, ~2 routes —
  small, because it sequences existing flows rather than building new ones.
