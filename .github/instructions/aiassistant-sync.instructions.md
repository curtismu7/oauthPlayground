---
applyTo: "AIAssistant/**,src/components/AIAssistant.tsx"
---

# AIAssistant Sync Rules

The AI Assistant exists in two locations that must stay in sync:

| Role | Path |
|------|------|
| **Original** (main app) | `src/components/AIAssistant.tsx` |
| **Standalone copy** (sub-project) | `AIAssistant/src/components/AIAssistant.tsx` |

## Sync Protocol

Whenever `src/components/AIAssistant.tsx` is updated:
1. Run `diff src/components/AIAssistant.tsx AIAssistant/src/components/AIAssistant.tsx` to see what the standalone copy has on top of the original.
2. Apply the new changes to the standalone copy, **preserving** these standalone-only additions:
   - `AIAssistantProps` interface (`fullPage`, `onStartOAuthFlow`)
   - `React.FC<AIAssistantProps>` signature + `useState(fullPage ? true : false)`
   - `!fullPage` guards on FloatingButton, ExpandOverlay, CollapseButton / ExpandButton / CloseButton
   - `ChatWindow` styled component: `$fullPage` prop + `position:relative; 100%; border-radius:0; box-shadow:none` CSS block

## Sub-project Services

`AIAssistant/src/services/` is a **lean subset** of `src/services/`. When adding a service that the standalone assistant needs:
- Check if an equivalent already exists in `AIAssistant/src/services/` first.
- If it doesn't exist, copy only what's needed — do not create a dependency on the main `src/services/`.

## Logging in AIAssistant

```ts
import { logger } from '../utils/logger';  // AIAssistant/src/utils/logger — not the main app's
```

Always import from the local logger, not from `../../src/utils/logger`.

## Building the Sub-project

The standalone assistant has its own `vite.config.ts` and `tsconfig.json`. After changes:
```bash
cd AIAssistant && npm run build
```
Verify the build succeeds independently of the main app.
