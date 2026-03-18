# AI Menu Index — Implementation Status

**Date:** 2026-03-08  
**Branch:** `cleanup/linter-elimination-20260308-193757`  
**Goal:** Index sidebar menu into `aiAgentService` so users can ask AIAssistant "show me mock flows", "show unified flows", etc. and get back clickable links.

---

## ✅ Designed (not yet written to disk)

### 1. `AIAssistant/src/services/aiAgentService.ts`

Three changes needed in this one file:

#### A. Add `MenuEntry` interface + `menuIndex` field to `CapabilityIndex`

```typescript
interface MenuEntry {
  label: string;
  path: string;
  group: string;
  groupId: string;
  keywords: string[];
  description: string;
  mock?: boolean;
}

interface CapabilityIndex {
  // ...existing fields...
  menuIndex: MenuEntry[];
}
```

#### B. Populate `menuIndex` inside `buildCapabilityIndex()`

All 13 groups from `src/config/sidebarMenuConfig.ts` — ~55 entries:

| groupId | groupLabel | # items |
|---|---|---|
| `dashboard` | Dashboard | 1 |
| `admin-configuration` | Admin & Configuration | 8 |
| `pingone-platform` | PingOne Platform | 5 |
| `unified-production-flows` | Unified & Production Flows | 8 |
| `oauth-flows` | OAuth 2.0 Flows | 7 |
| `oidc-flows` | OpenID Connect | 5 |
| `pingone-flows` | PingOne Flows | 5 |
| `tokens-session` | Tokens & Session | 5 |
| `developer-tools` | Developer & Tools | 4 |
| `education-tutorials` | Education & Tutorials | 4 |
| `mock-educational-flows` | Mock & Educational Flows | 3 (mock: true) |
| `artificial-intelligence` | Artificial Intelligence | 4 |
| `documentation-reference` | Documentation & Reference | 3 |

Full entry list was spelled out in the previous session — all paths verbatim from `sidebarMenuConfig.ts`.

#### C. Add to `search()` — loop over `menuIndex`

```typescript
for (const item of this.capabilityIndex.menuIndex) {
  const relevance = this.calculateRelevance(
    normalizedQuery, item.label,
    `${item.description} ${item.group}`, item.keywords
  );
  if (relevance > 0) {
    results.push({
      title: `${item.label}${item.mock ? ' 🎭' : ''}`,
      content: `${item.group} — ${item.description}`,
      path: item.path,
      type: 'flow',
      relevance,
      external: item.path.startsWith('http'),
    });
  }
}
```

#### D. Add to `getAnswer()` — two new branches BEFORE existing patterns

**Branch 1: topic-based listing** (triggers on "show/list/find/where + topic keyword")

13-entry `MENU_TOPICS` array maps groupId → regex:
- `ai|agent|assistant|mcp|llm|groq` → `artificial-intelligence`
- `unified|v8u` → `unified-production-flows`
- `oauth.*flows?` → `oauth-flows`
- `oidc|openid` → `oidc-flows`
- `mock|simulated|educational` → `mock-educational-flows`
- `pingone flows?` → `pingone-flows`
- `tokens?` → `tokens-session`
- `developer tools?|debug|code generator` → `developer-tools`
- `admin|configuration|credential management` → `admin-configuration`
- `pingone platform|protect portal|jwks` → `pingone-platform`
- `education|tutorial|user guide` → `education-tutorials`
- `docs? reference|documentation reference` → `documentation-reference`
- `dashboard` → `dashboard`

Returns:
- `answer`: short header + bulleted descriptions (NO raw paths in text)
- `relatedLinks`: all items as `type: 'flow'` so chat renders 🔄 clickable `LinkItem` buttons

**Branch 2: full dump** (triggers on "all menu|full menu|full sidebar|entire menu")

Groups all items by `item.group`, renders as grouped markdown headers + descriptions.  
`relatedLinks`: first 10 items (chat UI limit).

---

## ⚠️ Blocked by

`AIAssistant/src/services/aiAgentService.ts` was **not in the working set** — exact method signatures (`SearchOptions`, `SearchResult`, `calculateRelevance` arguments) could not be verified.

---

## 🔁 To resume

1. Open `AIAssistant/src/services/aiAgentService.ts` in VS Code (`Cmd+P`)
2. In Copilot Chat:
   ```
   #file:AIAssistant/src/services/aiAgentService.ts implement the menuIndex as documented in AI_MENU_INDEX_STATUS.md
   ```
3. Copilot will see real method signatures and produce a clean, compiling diff

---

## 🧪 Test prompts once implemented

| Prompt | Expected result |
|---|---|
| `show me mock flows` | Mock & Educational Flows — 3 clickable links |
| `show ai menu items` | Artificial Intelligence — 4 clickable links |
| `what unified flows exist` | Unified & Production Flows — 8 clickable links |
| `show oidc menu` | OpenID Connect — 5 clickable links |
| `find token flows` | Tokens & Session — 5 clickable links |
| `show developer tools` | Developer & Tools — 4 clickable links |
| `show full menu` | All 13 groups, first 10 as clickable links |
| `where is protect portal` | Matched via search → PingOne Platform |
| `find configuration page` | Matched via search → Admin & Configuration |

---

## Definition of Done

- [ ] `npm run type-check` passes
- [ ] `npx biome check AIAssistant/src/` passes
- [ ] No unused imports added
- [ ] Prompts in test table above all return clickable links
