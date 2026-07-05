# Design System Foundation (Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract the `/v2/use-cases` look-and-feel into a neutral, documented `src/design/` module (tokens, primitives, typography, a page shell) that any page can adopt, with a `/design` style guide as the visible contract — and keep the 25 existing flows2 importers working via re-export shims.

**Architecture:** Physically move `tokens` to `src/design/tokens.ts` and promote the flows2 primitives to `src/design/primitives.tsx`; author a fresh `PageShell` + `typography` from the documented Use Cases recipe; barrel-export from `src/design/index.ts`. `src/flows2/framework/tokens.ts` and `primitives.tsx` become thin re-exports so nothing in flows2 changes behavior. A dev-facing `/design` page renders every token/primitive/shell as live examples.

**Tech Stack:** React 18, TypeScript, styled-components, react-router-dom v6, Vitest + @testing-library/react. Base branch: `feat/design-system-standard` (off current `origin/main`).

## Global Constraints

- **Neutral home:** the standard lives in `src/design/`; `src/flows2/framework/{tokens,primitives}` become re-export shims. No consumer's resolved import value may change.
- **Back-compat is mandatory:** all 25 files that import `framework/tokens` or `framework/primitives` on `origin/main` must keep working unchanged. Enforced by an identity test.
- **Palette is fixed (light only):** primary navy `#1e3a8a`, accent teal `#14b8a6`, accentHover `#0d9488`. Never hardcode hex in components — import from `src/design`.
- **Typography recipe:** body = system sans; **IBM Plex Mono (`'IBM Plex Mono', monospace`) for accents only** — numeric badges, eyebrows/labels, action buttons. Mono is never the body font.
- **Legacy theme untouched:** no edits to `src/styles/global.ts` or the global `ThemeProvider` in `src/main.tsx`.
- **No behavior changes:** `src/design/` is presentational only — no state, storage, network, or routing logic.
- **Lazy route:** the `/design` page registers with `lazy()` + the existing `<Suspense>` in `App.tsx`, like other routes.

---

## File Structure

- Create `src/design/tokens.ts` — the moved token object (single source of truth).
- Create `src/design/typography.ts` — body vs mono font stacks + usage constants.
- Create `src/design/primitives.tsx` — promoted `Toggle`, `Pill`, `Action`, `Note`, `Grid` + new `Card`.
- Create `src/design/PageShell.tsx` — `PageShell`, `Section`, `SectionHead`, `SectionOrder`.
- Create `src/design/index.ts` — barrel export.
- Create `src/design/__tests__/design.test.tsx` — identity + render tests.
- Modify `src/flows2/framework/tokens.ts` — becomes re-export of `src/design/tokens`.
- Modify `src/flows2/framework/primitives.tsx` — becomes re-export of `src/design/primitives`.
- Create `src/pages/design/DesignSystemPage.tsx` — the `/design` style guide.
- Modify `src/App.tsx` — lazy import + `<Route path="/design" …>`.
- Modify `src/config/sidebarMenuConfig.ts` — add a "Design System" nav item under the developer group.

---

## Task 1: Move tokens to `src/design/tokens.ts` with a back-compat shim

**Files:**
- Create: `src/design/tokens.ts`
- Modify: `src/flows2/framework/tokens.ts`
- Test: `src/design/__tests__/design.test.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: `export const tokens` (the object currently at `src/flows2/framework/tokens.ts`) from `src/design/tokens.ts`. `src/flows2/framework/tokens.ts` re-exports it: `export { tokens } from '../../design/tokens';`.

- [ ] **Step 1: Write the failing identity test**

Create `src/design/__tests__/design.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest';
import { tokens as designTokens } from '../tokens';
import { tokens as frameworkTokens } from '../../flows2/framework/tokens';

describe('design/tokens', () => {
	it('exposes the navy + teal palette', () => {
		expect(designTokens.color.primary).toBe('#1e3a8a');
		expect(designTokens.color.accent).toBe('#14b8a6');
		expect(designTokens.color.accentHover).toBe('#0d9488');
	});

	it('is the exact same object the flows2 framework re-exports (back-compat)', () => {
		expect(frameworkTokens).toBe(designTokens);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/design/__tests__/design.test.tsx`
Expected: FAIL — cannot resolve `../tokens`.

- [ ] **Step 3: Create `src/design/tokens.ts`**

Copy the current contents of `src/flows2/framework/tokens.ts` verbatim into `src/design/tokens.ts`, updating only the header comment path. The object is:

```ts
// src/design/tokens.ts
//
// Design tokens — the single source of truth for the app's standard visual
// language (navy primary + electric-teal accent), promoted from the flows2
// framework so any page can adopt the standard. Import this instead of
// hardcoding hex. src/flows2/framework/tokens.ts re-exports this for back-compat.

export const tokens = {
	color: {
		primary: '#1e3a8a',
		primaryHover: '#1e40af',
		primarySubtle: '#eff6ff',
		primaryBorder: '#bfdbfe',
		accent: '#14b8a6',
		accentHover: '#0d9488',
		accentBg: '#f0fdfa',
		neutral100: '#f9fafb',
		neutral300: '#e5e7eb',
		neutral600: '#4b5563',
		text: '#0f172a',
		textMuted: '#475569',
		textSecondary: '#334155',
		border: '#e2e8f0',
		borderSubtle: '#cbd5e1',
		bg: '#ffffff',
		bgSubtle: '#f8fafc',
		bgAccent: '#eff6ff',
		success: '#16a34a',
		successHover: '#15803d',
		successBg: '#f0fdf4',
		successBorder: '#bbf7d0',
		error: '#dc2626',
		errorMuted: '#991b1b',
		errorBg: '#fef2f2',
		errorBorder: '#fecaca',
		codeBg: '#0f172a',
		codeText: '#e2e8f0',
		codeBorder: '#1e293b',
	},
	space: {
		xs: '0.25rem',
		sm: '0.5rem',
		md: '0.75rem',
		lg: '1rem',
		xl: '1.25rem',
		'2xl': '1.5rem',
		'3xl': '2rem',
	},
	radius: {
		sm: '6px',
		md: '8px',
		lg: '10px',
		xl: '14px',
		pill: '999px',
	},
} as const;
```

> Before writing, open the current `src/flows2/framework/tokens.ts` and copy its exact object so no value drifts. If it differs from the block above, the real file wins — copy that.

- [ ] **Step 4: Replace `src/flows2/framework/tokens.ts` with a re-export**

Set the entire file contents to:

```ts
// src/flows2/framework/tokens.ts
//
// Back-compat shim. The design tokens moved to src/design/tokens.ts (the neutral,
// app-wide home). This re-export keeps every existing flows2 importer working.

export { tokens } from '../../design/tokens';
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/design/__tests__/design.test.tsx`
Expected: PASS (2 tests) — including the `toBe` identity check.

- [ ] **Step 6: Verify no flows2 regression from the move**

Run: `npx vitest run src/flows2`
Expected: PASS (existing flows2 suite unaffected).

Run: `npx vite build`
Expected: build succeeds (all 25 importers resolve through the shim).

- [ ] **Step 7: Commit**

```bash
git add src/design/tokens.ts src/flows2/framework/tokens.ts src/design/__tests__/design.test.tsx
git commit -m "refactor(design): move tokens to src/design with flows2 re-export shim"
```

---

## Task 2: Promote primitives to `src/design/primitives.tsx` with a shim

**Files:**
- Create: `src/design/primitives.tsx`
- Modify: `src/flows2/framework/primitives.tsx`
- Test: `src/design/__tests__/design.test.tsx` (extend)

**Interfaces:**
- Consumes: `tokens` from `./tokens`.
- Produces: `export const Toggle`, `Pill` (`{ $active: boolean }`), `Action`, `Note`, `Grid`, and a new `export const Card` from `src/design/primitives.tsx`. `src/flows2/framework/primitives.tsx` re-exports all of them.

- [ ] **Step 1: Extend the test (add primitive smoke + shim identity)**

Append to `src/design/__tests__/design.test.tsx`:

```tsx
import { render } from '@testing-library/react';
import { Pill, Action, Card } from '../primitives';
import { Pill as FwPill } from '../../flows2/framework/primitives';

describe('design/primitives', () => {
	it('re-exports the same Pill through the flows2 shim', () => {
		expect(FwPill).toBe(Pill);
	});

	it('renders Pill, Action, and Card without error', () => {
		const { getByText } = render(
			<>
				<Pill $active={false} type="button">chip</Pill>
				<Action type="button">go</Action>
				<Card>body</Card>
			</>,
		);
		expect(getByText('chip')).toBeInTheDocument();
		expect(getByText('go')).toBeInTheDocument();
		expect(getByText('body')).toBeInTheDocument();
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/design/__tests__/design.test.tsx`
Expected: FAIL — cannot resolve `../primitives`.

- [ ] **Step 3: Create `src/design/primitives.tsx`**

Copy the current `Toggle`, `Pill`, `Action`, `Note`, `Grid` from `src/flows2/framework/primitives.tsx` verbatim, importing `tokens` from `./tokens`, and add a `Card` promoted from the Use Cases page recipe:

```tsx
// src/design/primitives.tsx
//
// Shared look-and-feel primitives for the app's standard visual language
// (navy + teal, IBM Plex Mono accents). Promoted from the flows2 framework so
// any page can adopt them. src/flows2/framework/primitives.tsx re-exports these.

import styled from 'styled-components';
import { tokens } from './tokens';

const MONO = "'IBM Plex Mono', monospace";

// Row of pills (toggles, grouped actions). Wraps on small screens.
export const Toggle = styled.div`
	display: flex;
	gap: 0.5rem;
	flex-wrap: wrap;
`;

// Signature pill button. Active = teal fill.
export const Pill = styled.button<{ $active: boolean }>`
	font-size: 0.82rem;
	font-weight: 600;
	padding: 0.4rem 0.9rem;
	border-radius: 8px;
	cursor: pointer;
	border: 2px solid ${({ $active }) => ($active ? tokens.color.accent : tokens.color.neutral300)};
	background: ${({ $active }) => ($active ? tokens.color.accent : tokens.color.neutral100)};
	color: ${({ $active }) => ($active ? '#fff' : tokens.color.primary)};
	transition: all 150ms ease;
	&:hover {
		border-color: ${tokens.color.accent};
	}
`;

// Primary action button (teal, mono).
export const Action = styled.button`
	align-self: flex-start;
	font-family: ${MONO};
	font-size: 0.85rem;
	font-weight: 700;
	letter-spacing: 0.05em;
	padding: 0.7rem 1.4rem;
	border-radius: 8px;
	border: none;
	background: ${tokens.color.accent};
	color: #fff;
	cursor: pointer;
	transition: all 150ms ease;
	&:hover:not(:disabled) {
		background: ${tokens.color.accentHover};
		transform: translateY(-1px);
	}
	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

// Inline teaching/caveat note with a teal left rule.
export const Note = styled.p`
	margin: 0;
	font-size: 0.82rem;
	line-height: 1.5;
	color: ${tokens.color.neutral600};
	background: ${tokens.color.neutral100};
	border-left: 3px solid ${tokens.color.accent};
	border-radius: 0 8px 8px 0;
	padding: 0.75rem 1rem;
`;

// Two-column responsive field grid.
export const Grid = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 0.9rem;
	@media (max-width: 640px) {
		grid-template-columns: 1fr;
	}
`;

// Content card (the Use Cases expandable-card surface).
export const Card = styled.div`
	padding: 1rem 1.15rem;
	background: ${tokens.color.bgSubtle};
	border: 1px solid ${tokens.color.border};
	border-radius: ${tokens.radius.lg};
`;
```

> Before writing, open the current `src/flows2/framework/primitives.tsx` and copy `Toggle`/`Pill`/`Action`/`Note`/`Grid` exactly. If any differ from the block above, the real file wins.

- [ ] **Step 4: Replace `src/flows2/framework/primitives.tsx` with a re-export**

Set the entire file contents to:

```tsx
// src/flows2/framework/primitives.tsx
//
// Back-compat shim. The shared primitives moved to src/design/primitives.tsx.
// This re-export keeps every existing flows2 importer working.

export { Toggle, Pill, Action, Note, Grid, Card } from '../../design/primitives';
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/design/__tests__/design.test.tsx`
Expected: PASS (identity + smoke).

- [ ] **Step 6: Verify no flows2 regression**

Run: `npx vitest run src/flows2`
Expected: PASS.

Run: `npx vite build`
Expected: build succeeds.

- [ ] **Step 7: Commit**

```bash
git add src/design/primitives.tsx src/flows2/framework/primitives.tsx src/design/__tests__/design.test.tsx
git commit -m "refactor(design): promote primitives to src/design with flows2 re-export shim"
```

---

## Task 3: `typography.ts`, `PageShell.tsx`, and the barrel `index.ts`

**Files:**
- Create: `src/design/typography.ts`
- Create: `src/design/PageShell.tsx`
- Create: `src/design/index.ts`
- Test: `src/design/__tests__/design.test.tsx` (extend)

**Interfaces:**
- Consumes: `tokens` from `./tokens`.
- Produces:
  - `export const fonts = { body: string; mono: string }` from `src/design/typography.ts`.
  - `export interface PageShellProps { title: string; intro?: React.ReactNode; children: React.ReactNode; }` and `export const PageShell: React.FC<PageShellProps>` from `src/design/PageShell.tsx`, plus `export const Section`, `export const SectionHead`, `export const SectionOrder` (styled-components).
  - `src/design/index.ts` re-exports everything from `./tokens`, `./typography`, `./primitives`, `./PageShell`.

- [ ] **Step 1: Extend the test (PageShell contract)**

Append to `src/design/__tests__/design.test.tsx`:

```tsx
import { PageShell } from '../PageShell';
import { fonts } from '../typography';

describe('design/typography', () => {
	it('documents a mono accent stack distinct from body', () => {
		expect(fonts.mono).toContain('IBM Plex Mono');
		expect(fonts.body).not.toBe(fonts.mono);
	});
});

describe('design/PageShell', () => {
	it('renders the title as an h1, the intro, and children', () => {
		const { getByRole, getByText } = render(
			<PageShell title="Dashboard" intro="Welcome back">
				<div>page body</div>
			</PageShell>,
		);
		expect(getByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument();
		expect(getByText('Welcome back')).toBeInTheDocument();
		expect(getByText('page body')).toBeInTheDocument();
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/design/__tests__/design.test.tsx`
Expected: FAIL — cannot resolve `../PageShell` / `../typography`.

- [ ] **Step 3: Create `src/design/typography.ts`**

```ts
// src/design/typography.ts
//
// Typography recipe for the standard visual language. Body text uses the system
// sans stack; IBM Plex Mono is the SIGNATURE ACCENT — used for numeric badges,
// eyebrows/labels, and action buttons. Mono is never the body font.

export const fonts = {
	body: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
	mono: "'IBM Plex Mono', monospace",
} as const;
```

- [ ] **Step 4: Create `src/design/PageShell.tsx`**

Author from the Use Cases page recipe (centered column, navy H1, muted intro, themed sections with a mono order-badge):

```tsx
// src/design/PageShell.tsx
//
// The standard page frame, extracted from the /v2/use-cases reference: a centered
// max-width column, a navy page title, a muted intro line, and slotted content.
// Section/SectionHead/SectionOrder are the grouping blocks the reference uses.

import React from 'react';
import styled from 'styled-components';
import { tokens } from './tokens';
import { fonts } from './typography';

const Page = styled.div`
	max-width: 960px;
	margin: 0 auto;
	padding: 2rem 1.25rem 4rem;
	color: ${tokens.color.text};
`;

const PageTitle = styled.h1`
	margin: 0 0 0.35rem;
	font-size: 1.6rem;
	color: ${tokens.color.primary};
`;

const Intro = styled.p`
	margin: 0 0 2rem;
	font-size: 0.95rem;
	line-height: 1.55;
	color: ${tokens.color.textMuted};
`;

export const Section = styled.section`
	margin-bottom: 2.25rem;
`;

export const SectionHead = styled.div`
	display: flex;
	align-items: baseline;
	gap: 0.6rem;
	margin-bottom: 0.15rem;
`;

export const SectionOrder = styled.span`
	font-family: ${fonts.mono};
	font-size: 0.85rem;
	font-weight: 700;
	color: ${tokens.color.accentHover};
`;

export interface PageShellProps {
	title: string;
	intro?: React.ReactNode;
	children: React.ReactNode;
}

export const PageShell: React.FC<PageShellProps> = ({ title, intro, children }) => (
	<Page>
		<PageTitle>{title}</PageTitle>
		{intro ? <Intro>{intro}</Intro> : null}
		{children}
	</Page>
);
```

- [ ] **Step 5: Create `src/design/index.ts`**

```ts
// src/design/index.ts
//
// Barrel export for the app's standard design system. Import from 'src/design'.

export { tokens } from './tokens';
export { fonts } from './typography';
export { Toggle, Pill, Action, Note, Grid, Card } from './primitives';
export { PageShell, Section, SectionHead, SectionOrder } from './PageShell';
export type { PageShellProps } from './PageShell';
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx vitest run src/design/__tests__/design.test.tsx`
Expected: PASS (all suites).

- [ ] **Step 7: Commit**

```bash
git add src/design/typography.ts src/design/PageShell.tsx src/design/index.ts src/design/__tests__/design.test.tsx
git commit -m "feat(design): add typography recipe, PageShell, and barrel export"
```

---

## Task 4: `/design` style-guide page + route + nav

**Files:**
- Create: `src/pages/design/DesignSystemPage.tsx`
- Modify: `src/App.tsx` (lazy import near other page imports; `<Route>` in the routes block)
- Modify: `src/config/sidebarMenuConfig.ts` (nav item under the developer group)
- Test: `src/pages/design/__tests__/DesignSystemPage.test.tsx`

**Interfaces:**
- Consumes: everything from `src/design` (`PageShell`, `Section`, `SectionHead`, `SectionOrder`, `tokens`, `fonts`, `Pill`, `Action`, `Note`, `Card`, `Grid`).
- Produces: default export `DesignSystemPage` mounted at `/design`.

- [ ] **Step 1: Write the failing test**

Create `src/pages/design/__tests__/DesignSystemPage.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DesignSystemPage from '../DesignSystemPage';

describe('DesignSystemPage', () => {
	it('renders the style-guide title and a token swatch label', () => {
		render(
			<MemoryRouter>
				<DesignSystemPage />
			</MemoryRouter>,
		);
		expect(screen.getByRole('heading', { level: 1, name: /Design System/i })).toBeInTheDocument();
		expect(screen.getByText('accent')).toBeInTheDocument();
	});

	it('renders primitive examples (a Pill and an Action)', () => {
		render(
			<MemoryRouter>
				<DesignSystemPage />
			</MemoryRouter>,
		);
		expect(screen.getByRole('button', { name: /Active pill/i })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /Action button/i })).toBeInTheDocument();
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/pages/design/__tests__/DesignSystemPage.test.tsx`
Expected: FAIL — cannot resolve `../DesignSystemPage`.

- [ ] **Step 3: Create `src/pages/design/DesignSystemPage.tsx`**

```tsx
// src/pages/design/DesignSystemPage.tsx
//
// Living style guide for the app's standard visual language (route /design).
// Renders every token, primitive, and the page shell as live examples — the
// visible contract each migrated page is checked against.

import React from 'react';
import styled from 'styled-components';
import {
	PageShell,
	Section,
	SectionHead,
	SectionOrder,
	tokens,
	fonts,
	Pill,
	Action,
	Note,
	Card,
	Grid,
} from '../../design';

const Swatches = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 0.75rem;
`;

const Swatch = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
	font-size: 0.72rem;
	color: ${tokens.color.textMuted};
`;

const Chip = styled.div<{ $bg: string }>`
	width: 88px;
	height: 44px;
	border-radius: ${tokens.radius.md};
	border: 1px solid ${tokens.color.border};
	background: ${({ $bg }) => $bg};
`;

const Row = styled.div`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.6rem;
	margin-bottom: 0.75rem;
`;

const Mono = styled.p`
	font-family: ${fonts.mono};
	color: ${tokens.color.text};
	margin: 0;
`;

const palette: Array<[string, string]> = [
	['primary', tokens.color.primary],
	['accent', tokens.color.accent],
	['accentHover', tokens.color.accentHover],
	['text', tokens.color.text],
	['textMuted', tokens.color.textMuted],
	['bgSubtle', tokens.color.bgSubtle],
	['border', tokens.color.border],
	['success', tokens.color.success],
	['error', tokens.color.error],
];

const DesignSystemPage: React.FC = () => (
	<PageShell
		title="Design System"
		intro="The standard visual language, promoted from the Use Cases page. Every page adopting the standard composes these tokens and primitives."
	>
		<Section>
			<SectionHead>
				<SectionOrder>1</SectionOrder>
				<h2>Color</h2>
			</SectionHead>
			<Swatches>
				{palette.map(([name, hex]) => (
					<Swatch key={name}>
						<Chip $bg={hex} />
						<span>{name}</span>
						<span>{hex}</span>
					</Swatch>
				))}
			</Swatches>
		</Section>

		<Section>
			<SectionHead>
				<SectionOrder>2</SectionOrder>
				<h2>Primitives</h2>
			</SectionHead>
			<Row>
				<Pill $active type="button">Active pill</Pill>
				<Pill $active={false} type="button">Inactive pill</Pill>
				<Action type="button">Action button</Action>
			</Row>
			<Note>Note — inline teaching/caveat with a teal left rule.</Note>
			<Grid style={{ marginTop: '0.9rem' }}>
				<Card>Card A</Card>
				<Card>Card B</Card>
			</Grid>
		</Section>

		<Section>
			<SectionHead>
				<SectionOrder>3</SectionOrder>
				<h2>Typography</h2>
			</SectionHead>
			<p>Body text uses the system sans stack.</p>
			<Mono>IBM Plex Mono — the signature accent (badges, labels, actions).</Mono>
		</Section>
	</PageShell>
);

export default DesignSystemPage;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/pages/design/__tests__/DesignSystemPage.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Register the lazy route in `src/App.tsx`**

Add near the other lazy page imports (e.g. by `const Documentation = lazy(...)` around line 137):

```tsx
const DesignSystemPage = lazy(() => import('./pages/design/DesignSystemPage'));
```

Add a route in the routes block (near `/documentation`):

```tsx
<Route path="/design" element={<DesignSystemPage />} />
```

- [ ] **Step 6: Add the nav entry in `src/config/sidebarMenuConfig.ts`**

Find the developer group (`label: 'Developer & Tools'`). Add `['/design', 'Design System', true]` to its `items([...])` list (append as the first or last entry, matching the existing tuple shape `[path, label, migratedToV9?, mock?]`).

- [ ] **Step 7: Verify build, types, and full design tests**

Run: `npx vitest run src/design/__tests__/design.test.tsx src/pages/design/__tests__/DesignSystemPage.test.tsx`
Expected: PASS (all).

Run: `npx vite build`
Expected: build succeeds.

Run: `node scripts/type-check-ratchet.mjs`
Expected: baseline holds (no new type errors).

- [ ] **Step 8: Manual verification**

Serve the build and open `/design`. Confirm: page renders in the centered column with a navy title; the color swatches, primitives (pills/action/note/card/grid), and the mono typography sample all render and visually match the `/v2/use-cases` look.

- [ ] **Step 9: Commit**

```bash
git add src/pages/design/DesignSystemPage.tsx src/pages/design/__tests__/DesignSystemPage.test.tsx src/App.tsx src/config/sidebarMenuConfig.ts
git commit -m "feat(design): add /design living style guide with route and nav"
```

---

## Self-Review Notes

- **Spec coverage:** `src/design/` module (Tasks 1–3) covers tokens/primitives/typography/PageShell; the re-export shims + identity tests (Tasks 1–2) cover the back-compat requirement; the `/design` style guide (Task 4) covers the "visible contract." Legacy theme is never touched. The typography recipe (mono = accent) is encoded in `typography.ts` and asserted in a test.
- **Type consistency:** `tokens`, `fonts`, `PageShell`/`PageShellProps`, `Section`/`SectionHead`/`SectionOrder`, and the primitive names (`Toggle`, `Pill`, `Action`, `Note`, `Grid`, `Card`) are identical across Tasks 1–4 and the barrel.
- **Back-compat guard:** the `toBe` identity tests (`frameworkTokens === designTokens`, `FwPill === Pill`) fail loudly if a shim is written as a copy instead of a re-export.

## Subsequent plans (pilot pages — authored after this ships)

Phases 2–5 from the spec each become their own focused plan, written against the live page file once the `src/design/` primitives exist (they depend on this foundation, and each restyle must be designed against the page's actual current markup rather than guessed):

- **Phase 2 — Dashboard** (`src/pages/Dashboard.tsx`): wrap in `PageShell`; replace ad-hoc containers/headings/buttons with `tokens` + primitives. Visual-only.
- **Phase 3 — Configuration** (`src/pages/Configuration.tsx`): `PageShell`; credential forms adopt `Card`/`Grid`/`Action`.
- **Phase 4 — Documentation** (`src/pages/Documentation.tsx`): `PageShell` + `typography` + `Section`/`Note` for long-form.
- **Phase 5 — Flow index** (`src/pages/OAuthFlowsNew.tsx`): restyle to the Use Cases chip/card language.

Each is independently shippable, visual-only, and verified by build + type-check + a browser screenshot against the `/v2/use-cases` reference and the `/design` style guide.
```
