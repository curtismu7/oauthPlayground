---
mode: edit
description: Scaffold a new service module following MasterFlow API conventions
---

Scaffold a new service for this project. Follow the patterns below **exactly**.

## Before creating anything

1. Search `src/services/` — there are 100+ services. Make sure no equivalent already exists.
2. If a service already covers the domain, extend it instead of adding a new file.

## What to create

1. `src/services/${serviceName}.ts` — the service

## Rules

- One exported class with `static getInstance()` singleton (or a plain object if stateless)
- `MODULE_TAG` constant used as the first argument of every `logger.*` call
- No `console.*` anywhere — only `logger` from `../utils/logger`
- Typed public interfaces exported (`${ServiceName}Config`, `${ServiceName}Result`, etc.)
- All public async methods use `try/catch` and re-throw after logging
- No direct `localStorage` / `sessionStorage` access — use `UnifiedTokenStorageService` for tokens, `ApiKeyService` for API keys, `EnvironmentIdPersistenceService` for env IDs
- Never log: `client_secret`, `access_token`, `refresh_token`, `id_token`, `code_verifier`, `Authorization` header values

## Template

```ts
// src/services/${serviceName}.ts
import { logger } from '../utils/logger';

const MODULE_TAG = '[🔧 ${SERVICE_NAME_UPPER}]';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface ${ServiceName}Config {
  /** Description of each field */
  environmentId: string;
  region: string;
}

export interface ${ServiceName}Result {
  success: boolean;
  data?: unknown;
  error?: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

class ${ServiceName}Service {
  private static instance: ${ServiceName}Service;

  private constructor() {
    // private — use getInstance()
  }

  static getInstance(): ${ServiceName}Service {
    if (!${ServiceName}Service.instance) {
      ${ServiceName}Service.instance = new ${ServiceName}Service();
    }
    return ${ServiceName}Service.instance;
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  async doSomething(config: ${ServiceName}Config): Promise<${ServiceName}Result> {
    logger.info(MODULE_TAG, 'doSomething called', { environmentId: config.environmentId });

    try {
      // Implementation here
      const result: ${ServiceName}Result = { success: true };
      logger.info(MODULE_TAG, 'doSomething succeeded');
      return result;
    } catch (error) {
      logger.error(MODULE_TAG, 'doSomething failed', error);
      throw error;
    }
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private buildUrl(environmentId: string, region: string): string {
    // Use regionService helpers — never hardcode PingOne base URLs
    return `${region}/${environmentId}/as/token`;
  }
}

// Export singleton instance AND the type
export const ${serviceNameCamel}Service = ${ServiceName}Service.getInstance();
export default ${ServiceName}Service;
```

## After scaffolding

- Replace placeholder methods with actual implementation
- Add unit tests: `src/services/__tests__/${serviceName}.test.ts` (use the `new-test` prompt)
- If this service replaces or extends an existing one: update `docs/updates-to-apps/` inventory
- `npm run type-check` must pass
