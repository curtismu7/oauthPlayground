---
applyTo: "src/services/**,AIAssistant/src/services/**"
---

# Service Development Standards

## Inventory-First Rule

Before adding or modifying a service:
1. Check `src/services/` — there are 100+ services; search for an existing one before creating a new file.
2. Read `docs/updates-to-apps/` inventory files for context on consumers and contracts.
3. If a service already handles the domain, extend it rather than duplicate.

## File & Export Conventions

- One primary export class or namespace per file, named to match the filename (e.g. `apiKeyService.ts` exports `ApiKeyService` or a plain object).
- Use `const MODULE_TAG = '[🏷️ SERVICE-NAME]'` for log prefix — keep it consistent with the emoji pattern used in existing services.
- Singleton pattern for stateful services: `static getInstance()` returning a cached instance.
- Export a plain-object default when stateless helpers are sufficient — avoid unnecessary class ceremony.

## Logging

```ts
import { logger } from '../utils/logger';  // or AIAssistant/src/utils/logger

logger.info(MODULE_TAG, 'Something happened', { context });
logger.error(MODULE_TAG, 'Failed', error);
```

- **Never** use `console.log`, `console.error`, etc. in production paths.
- Log at the boundary (entry/exit of public methods), not inside every branch.
- Never log sensitive values: `client_secret`, `access_token`, `refresh_token`, `id_token`, `code_verifier`, `Authorization` header.

## Service Versioning

- If changing a service contract that's consumed by more than one flow: create `services/v2/yourService.ts` and migrate only the target consumer.
- Backward-compatible additions (new optional parameters, new exported types) are MINOR — no version required.
- Breaking changes (removed exports, changed signatures) are MAJOR — version required.

## Storage Services

- Token / credential storage: use `UnifiedTokenStorageService` — do not roll your own `localStorage` calls.
- API keys: use `ApiKeyService` — do not read `localStorage` directly for key management.
- Environment IDs: use `EnvironmentIdService` / `EnvironmentIdPersistenceService`.

## Async / Error Handling

```ts
// ✅ Always return a typed Result or throw explicitly
async function fetchToken(params: TokenParams): Promise<TokenResponse> {
  try {
    const res = await fetch(url, options);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<TokenResponse>;
  } catch (err) {
    logger.error(MODULE_TAG, 'fetchToken failed', err);
    throw err;  // re-throw so callers can decide recovery strategy
  }
}
```

- No floating promises — always `await` or chain `.catch()`.
- Return typed results; avoid `any` in service interfaces.

## Definition of Done for a New Service

- [ ] Named consistently with existing services (`fooBarService.ts`)
- [ ] Uses `logger`, not `console.*`
- [ ] Exports typed interfaces (`FooBarConfig`, `FooBarResult`, etc.)
- [ ] No direct storage access if a storage service exists
- [ ] At least one unit test in `src/services/__tests__/`
- [ ] Inventory / changelog entry if it replaces or extends an existing service
