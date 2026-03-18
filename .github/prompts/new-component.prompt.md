---
mode: edit
description: Scaffold a new shared React component following MasterFlow API conventions
---

Scaffold a new React component for this project. Use the patterns below **exactly**.

## What to create

1. `src/components/${componentName}.tsx` — the component

## Rules

- Strict TypeScript — no `any`; export a named `${componentName}Props` interface
- Styled-components only — no inline styles except single-use layout values; no Tailwind classes
- Use `$`-prefixed transient props (e.g. `$variant`) for props that must NOT reach the DOM
- Accessibility: correct semantic element, `aria-label` / `aria-live` where needed; keyboard support for interactive elements
- No `console.*` — use `logger` from `../utils/logger` if the component needs to log
- Reuse `V9_COLORS` from `src/services/v9/V9ColorStandards.ts` for every colour value

## Template

```tsx
// src/components/${componentName}.tsx
import type React from 'react';
import styled from 'styled-components';
import { V9_COLORS } from '../services/v9/V9ColorStandards';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ${componentName}Props {
  /** Required: brief description */
  label: string;
  /** Optional: controls visual variant */
  variant?: 'default' | 'info' | 'success' | 'warning' | 'error';
  /** Optional: extra class for layout overrides from parent */
  className?: string;
}

// ─── Styled Components ────────────────────────────────────────────────────────

const Container = styled.div<{ $variant: NonNullable<${componentName}Props['variant']> }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  border: 1px solid ${({ $variant }) => {
    const map = {
      default: V9_COLORS.BORDER.GRAY,
      info:    V9_COLORS.BORDER.INFO,
      success: V9_COLORS.BG.SUCCESS_BORDER,
      warning: V9_COLORS.BG.WARNING_BORDER,
      error:   V9_COLORS.BG.ERROR_BORDER,
    };
    return map[$variant];
  }};
  background: ${({ $variant }) => {
    const map = {
      default: V9_COLORS.BG.WHITE,
      info:    V9_COLORS.BG.GRAY_LIGHT,
      success: V9_COLORS.BG.SUCCESS,
      warning: V9_COLORS.BG.WARNING,
      error:   V9_COLORS.BG.ERROR,
    };
    return map[$variant];
  }};
  color: ${V9_COLORS.TEXT.GRAY_DARK};
`;

const Label = styled.span`
  font-weight: 600;
  color: inherit;
`;

// ─── Component ────────────────────────────────────────────────────────────────

export const ${componentName}: React.FC<${componentName}Props> = ({
  label,
  variant = 'default',
  className,
}) => {
  return (
    <Container $variant={variant} className={className} role="status" aria-label={label}>
      <Label>{label}</Label>
    </Container>
  );
};

export default ${componentName};
```

## After scaffolding

- Replace placeholder JSX and styled components with actual component content
- Ensure `npm run type-check` passes
- Add a test file at `src/components/__tests__/${componentName}.test.tsx` (use the `new-test` prompt)
