# SERVICE_UPGRADES_CANDIDATES.md

This doc captures **service-level improvements** discovered during V9 upgrades/migrations so we:
1) avoid duplicating logic in flows/pages, and  
2) steadily converge on cleaner, reusable service APIs.

## How to use this doc
- When you are about to add **non-trivial logic** to a flow/page, first search the services directory for an existing solution.
- If you find a gap, add an entry below.
- Classify each item as either:
  - **Must replace now** (blocking correctness / repeated copy-paste / prevents consistent messaging), or
  - **Upgrade later** (nice-to-have refactor).

---

## Must replace now (critical)
Use 🔴 / 🟠 / 🟡 / ✅ to match the migration docs’ severity scheme.

| Severity | Area/Service | Problem | Why it matters now | Proposed change | Notes/Links |
|---|---|---|---|---|---|
|  |  |  |  |  |  |

### Criteria for “Must replace now”
- The current approach causes **broken behavior** or blocks a required flow.
- Multiple flows are copy/pasting the same logic (drift risk).
- The gap prevents consistent **Modern Messaging** (error normalization, retry semantics, timeouts).

---

## Upgrade later (backlog)
| Priority | Area/Service | Opportunity | Proposed change | Expected payoff | Notes/Links |
|---|---|---|---|---|---|
|  |  |  |  |  |  |

---

## Common upgrade themes (examples)
- **Error normalization:** a single helper that maps API errors → user guidance + retry suggestions (sanitized).
- **Timeout + retry policies:** shared, consistent behavior across services.
- **Polling utilities:** reusable polling with cancellation, backoff, max attempts, and surfaced status updates.
- **Request correlation:** consistent request IDs / durations captured via the logging service.
- **Input parsing/validation:** shared validators for issuer URL, scopes, audience, redirect URIs.
