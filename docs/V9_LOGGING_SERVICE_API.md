# V9 Logging Service — API Summary

**Location:** `src/services/v9/V9LoggingService.ts`  
**Import:** `import { V9LoggingService } from '@/services/v9';` or `import V9LoggingService from '@/services/v9/V9LoggingService';`

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
| **`V9LoggingService.debug(message, context?)`** | Debug/trace. |
| **`V9LoggingService.info(message, context?)`** | General info. |
| **`V9LoggingService.warn(message, context?)`** | Warnings. |
| **`V9LoggingService.error(message, context?, err?)`** | Errors; pass an `Error` as 3rd arg to attach name, message, stack. |
| **`V9LoggingService.success(message, context?)`** | Success / completion. |
| **`V9LoggingService.log(level, message, context?)`** | Generic log by level. |

**Examples:**

```ts
V9LoggingService.info('Flow started', { flowType: 'PAR', step: 0 });
V9LoggingService.error('Token exchange failed', { flowType: 'RAR' }, err);
V9LoggingService.success('Authorization complete', { flowType: 'OIDC', step: 2 });
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
| **`V9LoggingService.setMinimumLogLevel(level)`** | `void` | Set minimum level (e.g. `'debug'` in dev). |
| **`V9LoggingService.shouldLog(level)`** | `boolean` | Whether the level is enabled. |
| **`V9LoggingService.getLogHistory()`** | `Array<{ level, message, context, timestamp }>` | Last 200 log entries. |
| **`V9LoggingService.clearHistory()`** | `void` | Clear history and performance metrics. |

---

## Performance

| Method | Returns | Purpose |
|--------|--------|--------|
| **`V9LoggingService.startPerformance(operation, context?)`** | `() => void` | Call the returned function when the operation ends; it records duration and logs at debug. |
| **`V9LoggingService.getPerformanceMetrics()`** | `PerformanceMetric[]` | Last 100 metrics: `{ operation, duration, flowType?, timestamp }`. |

**Example:**

```ts
const stop = V9LoggingService.startPerformance('tokenExchange', { flowType: 'PAR' });
await exchangeToken();
stop();
```

---

## Export

| Method | Returns | Purpose |
|--------|--------|--------|
| **`V9LoggingService.exportLogs()`** | `string` | JSON string of `history`, `performance`, and `exportedAt`. |

---

## Types (exported)

- **`LogLevel`** — `'debug' | 'info' | 'warn' | 'error' | 'success'`
- **`LogContext`** — optional context object (see above)
- **`PerformanceMetric`** — `{ operation: string; duration: number; flowType?: string; timestamp: number }`

---

## Quick reference

```ts
import { V9LoggingService } from '@/services/v9';

// Log
V9LoggingService.debug('detail', { flowType: 'PAR' });
V9LoggingService.info('message', { step: 1 });
V9LoggingService.warn('warning');
V9LoggingService.error('failed', {}, err);
V9LoggingService.success('done', { flowType: 'RAR' });

// Level
V9LoggingService.setMinimumLogLevel('debug');
V9LoggingService.shouldLog('info');

// History & export
const history = V9LoggingService.getLogHistory();
V9LoggingService.clearHistory();
const json = V9LoggingService.exportLogs();

// Performance
const end = V9LoggingService.startPerformance('myOp', { flowType: 'OIDC' });
// ... do work ...
end();
const metrics = V9LoggingService.getPerformanceMetrics();
```
