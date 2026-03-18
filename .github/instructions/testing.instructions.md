---
applyTo: "src/**/*.test.ts,src/**/*.test.tsx,src/**/*.spec.ts,tests/**,AIAssistant/src/**/*.test.ts"
---

# Testing Standards (Vitest)

## Stack

- **Vitest** + `@testing-library/react` + `@testing-library/user-event`
- **MSW** for network mocking (prefer over manual `fetch` mocks where MSW is already set up)
- Run: `npm test` (or `npx vitest run`)

## Test File Location

| Type | Location |
|------|----------|
| Service unit tests | `src/services/__tests__/<serviceName>.test.ts` |
| Component tests | Co-located: `src/components/__tests__/<ComponentName>.test.tsx` |
| Hook tests | `src/hooks/__tests__/<hookName>.test.ts` |
| Integration / flow | `tests/` |

## Required Coverage per Test Suite

Every test file must include at minimum:
1. **Happy path** — normal, expected usage
2. **At least 2 edge cases** — boundary values, empty inputs, optional fields absent
3. **Error handling path** — what happens when the API fails, throws, or returns a bad status

For services with network calls, also include:
4. **API call validation** — assert method, URL, headers, body shape, and both success + error response handling

## Patterns

```ts
// ✅ Assert user-visible outcomes, not implementation details
expect(screen.getByRole('button', { name: /authorize/i })).toBeEnabled();

// ✅ Use fake timers for polling / debounce logic
vi.useFakeTimers();
// ... trigger action
vi.advanceTimersByTime(5000);
vi.useRealTimers();

// ✅ Prefer MSW for fetch mocking
server.use(
  http.post('*/as/token', () => HttpResponse.json({ access_token: 'REDACTED' }))
);
```

## Security in Tests

- Never use real `client_secret`, `access_token`, or token values in test fixtures — use obviously fake placeholders like `'test-secret'`, `'fake-token'`.
- Do not commit `.env` values into test files.

## Determinism

- No `setTimeout` with real delays — use `vi.useFakeTimers()`.
- Mock `Date.now()` / `new Date()` when testing expiry logic.
- Seed random values explicitly for PKCE / state generation tests.

## Running Quality Gates

```bash
npm run type-check   # TypeScript must compile cleanly
npx biome check src/ # Zero lint violations
npm test             # All Vitest tests must pass
```
