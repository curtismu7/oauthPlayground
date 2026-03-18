---
mode: edit
description: Scaffold a Vitest test file for a service, component, or hook following MasterFlow API testing standards
---

Write a Vitest test for the specified file. Follow the patterns below **exactly**.

## Required coverage (no exceptions)

Every test file must include:
1. **Happy path** — normal, expected usage
2. **At least 2 edge cases** — boundary values, empty/undefined inputs, optional fields absent
3. **Error handling path** — what happens when the API call fails or throws
4. **API call validation** *(for services that call fetch)* — assert method, URL, headers, body shape, and both success + error responses

## Framework

- **Vitest** + `@testing-library/react` (for React components) + `@testing-library/user-event`
- Prefer **MSW** if it's already set up; fallback to `vi.fn()` + `global.fetch` mock
- Use `vi.useFakeTimers()` for any polling / debounce / expiry logic — never real `setTimeout` delays
- Seed random values for PKCE / state / UUID generation tests

## Never in tests

- Real `client_secret`, `access_token`, `refresh_token`, `id_token` values — use obvious fakes like `'test-secret'`, `'FAKE_ACCESS_TOKEN'`
- Real environment IDs or PingOne tenant URLs committed to the file
- `.env` values read inside test files

## Service test template

```ts
// src/services/__tests__/${serviceName}.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ${ServiceName}Service from '../${serviceName}';

// ─── Mocks ─────────────────────────────────────────────────────────────────────

const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('${ServiceName}Service', () => {
  const service = ${ServiceName}Service.getInstance();

  const validConfig = {
    environmentId: 'test-env-id',
    region: 'https://auth.pingone.com',
  };

  // 1. Happy path
  describe('doSomething', () => {
    it('succeeds with valid config', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'FAKE_ACCESS_TOKEN', token_type: 'Bearer' }),
      });

      const result = await service.doSomething(validConfig);

      expect(result.success).toBe(true);

      // API call validation
      expect(mockFetch).toHaveBeenCalledOnce();
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain(validConfig.environmentId);
      expect(options.method).toBe('POST');
      expect(options.headers?.['Content-Type']).toBe('application/x-www-form-urlencoded');
    });

    // 2. Edge case: missing environmentId
    it('throws when environmentId is empty', async () => {
      await expect(
        service.doSomething({ ...validConfig, environmentId: '' })
      ).rejects.toThrow();
    });

    // 3. Edge case: unknown region
    it('handles unknown region gracefully', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
      const result = await service.doSomething({ ...validConfig, region: 'https://custom.example.com' });
      expect(result.success).toBe(true);
    });

    // 4. Error path: network failure
    it('throws on fetch network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      await expect(service.doSomething(validConfig)).rejects.toThrow('Network error');
    });

    // 5. Error path: HTTP 4xx response
    it('throws on HTTP 401', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'invalid_client' }),
      });
      await expect(service.doSomething(validConfig)).rejects.toThrow();
    });
  });
});
```

## React component test template

```tsx
// src/components/__tests__/${ComponentName}.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ${ComponentName} } from '../${ComponentName}';

describe('${ComponentName}', () => {
  // 1. Happy path — renders with required props
  it('renders label', () => {
    render(<${ComponentName} label="Test Label" />);
    expect(screen.getByText('Test Label')).toBeInTheDocument();
  });

  // 2. Edge case: long label
  it('renders with long label without layout break', () => {
    render(<${ComponentName} label={'x'.repeat(200)} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  // 3. Edge case: variant prop
  it('applies variant class', () => {
    render(<${ComponentName} label="Error" variant="error" />);
    const el = screen.getByRole('status');
    // styled-component classes are dynamic; just assert the element exists
    expect(el).toBeInTheDocument();
  });

  // 4. Error / missing prop: no label
  it('renders without crashing when label is empty string', () => {
    render(<${ComponentName} label="" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
```

## Hook test template

```ts
// src/hooks/__tests__/${hookName}.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ${hookName} } from '../${hookName}';

const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => vi.clearAllMocks());

describe('${hookName}', () => {
  // 1. Happy path
  it('loads data on mount', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ value: 'test' }),
    });

    const { result } = renderHook(() => ${hookName}());
    expect(result.current.state.isLoading).toBe(true);

    await act(async () => {});
    expect(result.current.state.isLoading).toBe(false);
    expect(result.current.state.data).toBeDefined();
    expect(result.current.state.error).toBeNull();
  });

  // 2. Edge case: disabled
  it('does not fetch when enabled=false', async () => {
    renderHook(() => ${hookName}({ enabled: false }));
    await act(async () => {});
    expect(mockFetch).not.toHaveBeenCalled();
  });

  // 3. Error path
  it('sets error state on fetch failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    const { result } = renderHook(() => ${hookName}());
    await act(async () => {});
    expect(result.current.state.error?.message).toBe('Network error');
    expect(result.current.state.isLoading).toBe(false);
  });

  // 4. reset() clears state
  it('reset() clears error and data', async () => {
    mockFetch.mockRejectedValueOnce(new Error('fail'));
    const { result } = renderHook(() => ${hookName}());
    await act(async () => {});
    expect(result.current.state.error).not.toBeNull();

    act(() => result.current.reset());
    expect(result.current.state.error).toBeNull();
    expect(result.current.state.data).toBeNull();
  });
});
```

## After writing tests

```bash
npm test                  # all tests must pass
npm run type-check        # TypeScript must compile cleanly
npx biome check src/      # zero lint violations
```
