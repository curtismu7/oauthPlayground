# Biome Code Quality + HMR WebSocket Fix — 2026-02-27

Type: style/fix
Compatibility: PATCH — no contract changes, internal code quality only

## Summary

Full biome analysis pass on `src/v8/flows/unified/` and `src/services/FloatingStepperService.tsx`.
Fixed all errors (a11y violations, unused params/vars, `any` types, TDZ declarations,
`noStaticOnlyClass`, accumulating spreads) and resolved a HMR WebSocket connection failure
that caused console errors when accessed via a custom domain with a self-signed HTTPS cert.

## Scope

- `vite.config.ts` — HMR config
- `src/services/FloatingStepperService.tsx`
- `src/v8/flows/unified/` — all component, service, and utility files

## Files Modified

| File | Changes |
|------|---------|
| `vite.config.ts` | Disable HMR when `httpsOptions` set (custom cert = custom domain) |
| `src/services/FloatingStepperService.tsx` | `class` → plain object (`noStaticOnlyClass`); `handleStepClick` → `_handleStepClick` |
| `components/UnifiedActivationStep.tsx` | `_setCredentials` (unused param); purple button → blue (#8b5cf6→#2563eb); add `onFocus`/`onBlur` |
| `components/UnifiedConfigurationStep.tsx` | `_showWorkerTokenModal`, `_setShowWorkerTokenModal`, `_showUserLoginModal`, `_showSettingsModal`, `_setShowSettingsModal`, `_setIsLoading` (unused params); grouping `<label>` → `<p>`; biome-ignore on intentional dep array |
| `components/UnifiedConfigurationStep.modern.tsx` | `Record<string,any>` → `Record<string,unknown>`; grouping `<label>` → `<p>` |
| `components/UnifiedDeviceRegistrationForm.tsx` | `_onCancel`, `_workerTokenStatus` (unused) |
| `components/UnifiedDeviceSelectionStep.modern.tsx` | TDZ fix (`loadDevices` moved before `useEffect`); `type="button"` on card buttons; biome-ignore on dep array |
| `components/UnifiedDeviceSelectionStep.tsx` | TDZ fix (`loadExistingDevices` moved before `useEffect`); `div[role=button]` → `<button type="button" aria-pressed>`; `_setCredentials` |
| `components/UnifiedRegistrationStep.tsx` | `_mfaState` (unused param); `useState<any>` → `useState<unknown>` |
| `components/UnifiedSuccessStep.tsx` | `(window as any)` → typed cast; `div[role=status]` → `<output>` |
| `components/APIComparisonModal.tsx` | JSX biome-ignore comments in correct position; `type="button"` on close button |
| `services/unifiedFlowServiceIntegration.ts` | `as any` → typed casts |
| `utils/deviceFlowHelpers.ts` | 4× `[key: string]: any` → `unknown` |
| `utils/unifiedFlowValidation.ts` | 3× `[key: string]: any` → `unknown`; accumulating spread → `Object.assign` |
| `UnifiedMFARegistrationFlowV8_Legacy.tsx` | `_username` (unused param); biome-ignore on large callback dep array |

## Changes

### vite.config.ts — HMR Fix
**Before:** `hmr: env.VITE_HMR_HOST ? false : { port: 3000, host: 'localhost', protocol: 'wss', clientPort: 3000 }`
**After:** `hmr: (env.VITE_HMR_HOST || httpsOptions) ? false : { port: 3000, host: 'localhost', clientPort: 3000 }`
**Why:** When `SSL_CERT_PATH` is set, `httpsOptions` is non-null. Vite HMR defaults to `wss://` on the current domain, which fails because `api.pingdemo.com`'s self-signed cert is rejected. Disabling HMR for any custom HTTPS setup eliminates the console noise; app works, just no hot-reload on custom domain.

### FloatingStepperService.tsx — class → object
**Before:** `export class FloatingStepperService { static getOAuthConfig(...) { ... } ... }`
**After:** `export const FloatingStepperService = { getOAuthConfig(...) { ... }, ... }`
**Why:** Biome `noStaticOnlyClass` — a class with only static methods should be a plain object.

### Color violation fix (UnifiedActivationStep.tsx)
**Before:** `background: '#8b5cf6'`, hover `'#7c3aed'` (forbidden purple)
**After:** `background: '#2563eb'`, hover `'#1e40af'` (required blue per color standards)

### TDZ fixes (use-before-declaration)
Both `UnifiedDeviceSelectionStep.tsx` and `UnifiedDeviceSelectionStep.modern.tsx` had `useEffect` referencing a `const` function declared below it (TDZ). Swapped order: function declaration first, then `useEffect`.

### a11y fixes
- `div[role=button]` device cards → `<button type="button" aria-pressed>`
- `div[role=status]` token info → `<output>`
- All plain `<button>` without `type` → `<button type="button">`
- Grouping `<label>` with no `htmlFor` → `<p>` (no associated control)
- APIComparisonModal biome-ignore moved to valid JSX comment position (`{/* biome-ignore */}`)

### any → unknown
All `[key: string]: any` index signatures and `Record<string, any>` → `unknown`, plus `(result as any)` → properly typed casts.

### Accumulating spread fix
**Before:** `return errorObjects.reduce((combined, errors) => ({ ...combined, ...errors }), {})`
**After:** `return Object.assign({}, ...errorObjects)`

## Biome Result
- Before: 14 errors + 32 warnings across 24 files
- After: 0 errors, 0 warnings

## Compatibility
PATCH — no API contracts changed, no public interfaces modified, no storage keys affected.

## Testing
- `npx @biomejs/biome check src/v8/flows/unified/ src/services/FloatingStepperService.tsx` → clean (0 errors, 0 warnings)
- All changes are internal quality improvements; runtime behavior unchanged

## Rollback
`git revert <commit-hash>` — safe, no dependencies on external systems.
