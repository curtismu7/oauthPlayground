# V9 Logging Service — API Summary

**Location:** `src/services/v9/PlatformLoggingService.ts`  
**Import:** `import { PlatformLoggingService } from '@/services/v9';` or `import PlatformLoggingService from '@/services/v9/PlatformLoggingService';`

Structured logging for V9 flows and unified UI. Replaces `unifiedFlowLoggerServiceV8U` where migrated. Sanitizes credentials (redacts `clientSecret`, `privateKey`) and keeps an in-memory history for export.

---

## Log levels

`'debug' | 'info' | 'warn' | 'error' | 'success'`

- **Production:** minimum level is `'error'`.
- **Dev:** minimum level is `'warn'` (override with `setMinimumLogLevel`).

---

## Logging methods

All take `(message: string, context?: LogContext)`. Optional context is merged into the log line and stored (credentials sanitized).

| Method | Use |
|--------|-----|
| **`PlatformLoggingService.debug(message, context?)`** | Debug/trace. |
| **`PlatformLoggingService.info(message, context?)`** | General info. |
| **`PlatformLoggingService.warn(message, context?)`** | Warnings. |
| **`PlatformLoggingService.error(message, context?, err?)`** | Errors; pass an `Error` as 3rd arg to attach name, message, stack. |
| **`PlatformLoggingService.success(message, context?)`** | Success / completion. |
| **`PlatformLoggingService.log(level, message, context?)`** | Generic log by level. |

**Examples:**

```ts
PlatformLoggingService.info('Flow started', { flowType: 'PAR', step: 0 });
PlatformLoggingService.error('Token exchange failed', { flowType: 'RAR' }, err);
PlatformLoggingService.success('Authorization complete', { flowType: 'OIDC', step: 2 });
```

---

## Context shape (`LogContext`)

Optional object; any extra keys allowed.

| Field | Purpose |
|-------|--------|
| `flowType?: string` | e.g. `'PAR'`, `'RAR'`, `'OIDC'`. |
| `specVersion?: string` | e.g. `'OAuth 2.1'`. |
| `step?: number` | Step index. |
| `operation?: string` | Operation name. |
| `credentials?: Record<string, unknown>` | Auto-redacted (clientSecret, privateKey). |
| `[key: string]: unknown` | Any other data. |

---

## Level and history

| Method | Returns | Purpose |
|--------|--------|--------|
| **`PlatformLoggingService.setMinimumLogLevel(level)`** | `void` | Set minimum level (e.g. `'debug'` in dev). |
| **`PlatformLoggingService.shouldLog(level)`** | `boolean` | Whether the level is enabled. |
| **`PlatformLoggingService.getLogHistory()`** | `Array<{ level, message, context, timestamp }>` | Last 200 log entries. |
| **`PlatformLoggingService.clearHistory()`** | `void` | Clear history and performance metrics. |

---

## Performance

| Method | Returns | Purpose |
|--------|--------|--------|
| **`PlatformLoggingService.startPerformance(operation, context?)`** | `() => void` | Call the returned function when the operation ends; it records duration and logs at debug. |
| **`PlatformLoggingService.getPerformanceMetrics()`** | `PerformanceMetric[]` | Last 100 metrics: `{ operation, duration, flowType?, timestamp }`. |

**Example:**

```ts
const stop = PlatformLoggingService.startPerformance('tokenExchange', { flowType: 'PAR' });
await exchangeToken();
stop();
```

---

## Export

| Method | Returns | Purpose |
|--------|--------|--------|
| **`PlatformLoggingService.exportLogs()`** | `string` | JSON string of `history`, `performance`, and `exportedAt`. |

---

## Types (exported)

- **`LogLevel`** — `'debug' | 'info' | 'warn' | 'error' | 'success'`
- **`LogContext`** — optional context object (see above)
- **`PerformanceMetric`** — `{ operation: string; duration: number; flowType?: string; timestamp: number }`

---

## Quick reference

```ts
import { PlatformLoggingService } from '@/services/v9';

// Log
PlatformLoggingService.debug('detail', { flowType: 'PAR' });
PlatformLoggingService.info('message', { step: 1 });
PlatformLoggingService.warn('warning');
PlatformLoggingService.error('failed', {}, err);
PlatformLoggingService.success('done', { flowType: 'RAR' });

// Level
PlatformLoggingService.setMinimumLogLevel('debug');
PlatformLoggingService.shouldLog('info');

// History & export
const history = PlatformLoggingService.getLogHistory();
PlatformLoggingService.clearHistory();
const json = PlatformLoggingService.exportLogs();

// Performance
const end = PlatformLoggingService.startPerformance('myOp', { flowType: 'OIDC' });
// ... do work ...
end();
const metrics = PlatformLoggingService.getPerformanceMetrics();
```
