# Toast Replacement UX Directive

## Objective

Replace all toast-based notifications with more user-centered,
context-aware feedback patterns. Toasts should not be used unless
explicitly justified.

The replacement must improve:

- Clarity
- Persistence (when needed)
- Context alignment
- Accessibility
- Actionability

Do not introduce breaking changes. Reuse existing UI components and
design tokens where possible.

------------------------------------------------------------------------ -----------------------------------------------------------------------

## Core Principles

1. **Feedback must be anchored to context.** Notifications should
    appear near the UI element or workflow that triggered them.

2. **Ephemeral feedback is only acceptable for non-critical,
    non-blocking events.**

3. **Errors must be actionable and specific.** Users should never have
    to guess what failed or what to do next.

4. **Critical system state changes must persist.**

5. **Avoid modal interruptions unless absolutely necessary.**

------------------------------------------------------------------------ -----------------------------------------------------------------------

## Replacement Decision Framework

When replacing a toast, classify the original intent:

### 1) Success Confirmation

If the toast confirms a completed action, replace with one of:

- Inline confirmation message near the triggering element
- Button state transition (e.g., `Save` → `Saved ✓`)
- Contextual success banner within the active view

Do not rely on transient overlays.

------------------------------------------------------------------------ -----------------------------------------------------------------------

### 2) Validation Error

If the toast communicates form or input errors, replace with:

- Field-level validation messages
- Visual state indicators (error border, icon)
- Scroll-to-first-error behavior
- Optional form-level error summary banner

Never use global notifications for validation errors.

------------------------------------------------------------------------ -----------------------------------------------------------------------

### 3) System Warning / Account State / Permissions

If the toast communicates environmental or account-level issues, replace
with:

- Persistent top-of-page alert banner
- Clear severity styling (info, warning, critical)
- Optional CTA button
- Dismiss control if appropriate

The banner must remain until resolved or dismissed.

------------------------------------------------------------------------ -----------------------------------------------------------------------

### 4) Reversible Action (Undo Pattern)

If the toast contains an Undo option, replace with:

- Snackbar (persistent, anchored, 6--10 second duration)
- Prominent "Undo" action
- Accessible focus handling

Do not auto-dismiss in under 5 seconds.

------------------------------------------------------------------------ -----------------------------------------------------------------------

### 5) Multi-Step or Complex State Changes

If the toast explains something non-trivial, replace with:

- Inline expandable section
- Side panel / drawer
- Contextual detail view

Users must understand what changed and what to do next.

------------------------------------------------------------------------ -----------------------------------------------------------------------

## Accessibility Requirements

All replacements must:

- Support screen readers (ARIA live regions when needed)
- Meet contrast requirements
- Not rely solely on color for meaning
- Preserve keyboard navigation

------------------------------------------------------------------------ -----------------------------------------------------------------------

## Implementation Constraints

- Do not introduce new notification systems unless necessary.
- Prefer extending existing components.
- Avoid breaking API contracts.
- Consider cross-app impact before altering shared services.
- If a change affects other modules, flag it before implementation.

------------------------------------------------------------------------ -----------------------------------------------------------------------

## Output Requirements (For Coding Agent)

When replacing a toast:

1. Identify the original use case.
2. Justify the selected replacement pattern.
3. Specify:

   - Component used
   - Placement
   - Dismiss behavior
   - Duration (if applicable)

4. Note any side effects on existing flows.
5. Provide updated UI logic pseudocode if required.

------------------------------------------------------------------------ -----------------------------------------------------------------------

## Explicit Prohibition

Do NOT:

- Replace toast with another transient overlay by default.
- Hide errors in global notification layers.
- Introduce silent failures.
- Make critical alerts auto-dismiss.

------------------------------------------------------------------------ -----------------------------------------------------------------------

## Goal

Deliver feedback that is:

- Contextual
- Visible
- Actionable
- Durable when necessary
- Predictable across the application
