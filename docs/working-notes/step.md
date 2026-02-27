# Controller update: normalize MFA nextStep/status values (to prevent regressions)

Goal: Prevent regressions where the UI falls into a default path or hides features because the controller/service returns a status the UI flows don’t handle.

---

## Problem

Your UI flow components tend to switch on `nextStep` and commonly only handle a small set of values, e.g.:

- `COMPLETED`
- `OTP_REQUIRED`
- `SELECTION_REQUIRED`

But the controller/service layer can return additional values such as:

- `DEVICE_SELECTION_REQUIRED`
- `PASSCODE_REQUIRED`

When the controller returns one of these “extra” values, the UI can hit `default` and do the wrong thing (navigate incorrectly, render the wrong component, or hide UI sections), which looks like a regression.

---

## Fix: normalize statuses at the controller boundary

Create one shared helper that maps all service/status variants into the small stable set used by the UI.

### Suggested mappings (adapt to your actual enums/strings)

- `DEVICE_SELECTION_REQUIRED` → `SELECTION_REQUIRED`
- `PASSCODE_REQUIRED` → `OTP_REQUIRED`

Then, in the controller, always return a normalized `nextStep` to the UI.

---

## Implementation sketch

### 1) Create a single normalizer

Example:

```ts
export function normalizeMfaNextStep(step: string | undefined): 'COMPLETED' | 'OTP_REQUIRED' | 'SELECTION_REQUIRED' {
  switch (step) {
    case 'COMPLETED':
      return 'COMPLETED';
    case 'OTP_REQUIRED':
    case 'PASSCODE_REQUIRED':
      return 'OTP_REQUIRED';
    case 'SELECTION_REQUIRED':
    case 'DEVICE_SELECTION_REQUIRED':
      return 'SELECTION_REQUIRED';
    default:
      // Choose a safe default for your product (often SELECTION_REQUIRED or OTP_REQUIRED)
      return 'SELECTION_REQUIRED';
  }
}
```

### 2) Apply it inside the controller (right after service calls)

Pattern:

```ts
const result = await mfaService.initializeDeviceAuthentication(...);

return {
  ...result,
  nextStep: normalizeMfaNextStep(result.nextStep ?? result.status),
};
```

Key idea: normalize using `nextStep ?? status` so you catch both shapes consistently.

---

## Tests (strongly recommended)

Add a small unit test that asserts:

- `DEVICE_SELECTION_REQUIRED` maps to `SELECTION_REQUIRED`
- `PASSCODE_REQUIRED` maps to `OTP_REQUIRED`
- known “good” values pass through unchanged
- unknown values fail loudly or map to your chosen safe default

This makes future regressions obvious when new statuses are introduced.

---

## Cursor prompt to apply this safely (small diff)

- Edit only: the controller file(s) that return `nextStep` to UI + the new normalizer + tests
- Do not refactor unrelated code
- Keep existing behavior except for status normalization
- Add tests covering the mapping table
