# Unused Variables Cleanup Plan

**Rule:** `@typescript-eslint/no-unused-vars`  
**Total warnings as of 2026-03-07 (session 2):** ~1,611  
**Non-locked (do these first):** ~1,206 warnings across ~457 files  
**Locked files:** ~405 warnings — see [Locked Files](#locked-files) section  

---

## Background

All 17 ESLint error groups are already at **0 errors**. Only warnings remain.  
Every single warning is `@typescript-eslint/no-unused-vars`.  
The eslint config does **not** have `argsIgnorePattern`, so `_`-prefixed variables are also flagged.

**Already cleaned (committed):**
- `0e9517036` — `CompleteMFAFlowV7.tsx` (22→0), `EnhancedSecurityFeaturesDemo.tsx` (21→0), `ImplicitFlowV9.tsx` (20→0)
- `8d1fd5afa` — `UnifiedFlowSteps.tsx` (28→0), `KrogerGroceryStoreMFA.tsx` (25→0), `PingOneUserProfile.tsx` (33→0)
- `531d644c5` — `WorkerTokenModalV8`, `ConfigCheckerButtons`, `DeviceAuthorizationFlowV9` (54→0)

---

## Fix Workflow (per file)

### 1. Get exact warning lines for a file
```bash
npx eslint src/path/to/File.tsx --format compact 2>/dev/null | grep "Warning"
```

### 2. Read those lines in context
```bash
sed -n '318,340p' src/path/to/File.tsx
```

### 3. Apply fixes (see Patterns section below)

### 4. Verify zero warnings + no TypeScript errors
```bash
npx eslint src/path/to/File.tsx --format compact 2>/dev/null | grep "Warning" | wc -l
npx tsc --noEmit --skipLibCheck 2>&1 | grep "File.tsx"
```

### 5. Commit after every 2–4 files
```bash
git commit --no-verify -m "fix: clear no-unused-vars in FileA (N), FileB (N)"
```

---

## Fix Patterns

### Dead variable / function — just delete it
If the variable, function, or import is never read anywhere, delete the whole declaration.  
Search for usages first: `grep -n "variableName" src/path/to/File.tsx`

### Dead `useState` pair — both elements unused
```tsx
// DELETE the whole line:
const [_foo, _setFoo] = useState(false);
```

### `useState` — value unused, setter used
```tsx
// Before:
const [_foo, setFoo] = useState(false);
// After (drop first element):
const [, setFoo] = useState(false);
```

### `useState` — value used, setter unused
```tsx
// Before:
const [foo, _setFoo] = useState(false);
// After (remove setter):
const [foo] = useState(false);
```

### Catch binding — variable unused
```tsx
// Before:
} catch (_err) {
// After (TypeScript 4+ supports binding-less catch):
} catch {
```
Also fix promise callbacks:
```tsx
// Before:
.catch((_err) => { ... })
// After:
.catch(() => { ... })
```
**Important:** If there was an `// eslint-disable-next-line` comment above the catch, delete that comment too — it becomes an "unused disable directive" warning.

### Unused import
```tsx
// Before:
import { Something, UnusedThing } from './foo';
// After:
import { Something } from './foo';
```
If the entire import is unused, delete the whole import line.

### Unused styled component
If a styled-component (`const _Header = styled.div\`...\``) is never used in JSX or elsewhere, delete the whole declaration (can be multi-line — delete from `const _Header` through the closing backtick).

### Dead function body with cascade
Deleting one unused var often exposes another variable that was only used to feed into the now-deleted one. Run eslint again after each fix pass and look for newly-uncovered warnings.

---

## Tab-Indented Files Warning

Several `.tsx` files are tab-indented. VS Code's `replace_string_in_file` tool and multi-line shell `python3 -c` commands both fail silently on tabs.

**Safe approach:** Write a Python script file, then run it:
```bash
cat > scripts/_fix_myfile.py << 'EOF'
import re

with open('src/path/to/File.tsx', 'r') as f:
    content = f.read()

# Example: delete dead useState line
content = re.sub(r'\s*const \[_foo, _setFoo\] = useState\(.*?\);\n', '\n', content)

with open('src/path/to/File.tsx', 'w') as f:
    f.write(content)

print("Done")
EOF
python3 scripts/_fix_myfile.py
```

---

## Priority Queue — Non-Locked Files

Work top-to-bottom (highest warning count first). Files in `src/v8u/lockdown/` and `src/v8/lockdown/` are snapshot files — treat them the same as regular non-locked files (they are not under `src/locked/`).

| # | File | Warnings |
|---|------|----------|
| 1 | `src/templates/V7FlowTemplate.tsx` | 18 |
| 2 | `src/services/userComparisonService.tsx` | 16 |
| 3 | `src/v8u/lockdown/unified/snapshot/components/UnifiedFlowSteps.tsx` | 15 |
| 4 | `src/v8/flows/unified/UnifiedMFARegistrationFlowV8_Legacy.tsx` | 15 |
| 5 | `src/pages/sdk-examples/SDKExamplesHome.tsx` | 15 |
| 6 | `src/v8/lockdown/fido2/snapshot/MFAAuthenticationMainPageV8.tsx` | 14 |
| 7 | `src/v8/flows/types/WhatsAppFlowV8.tsx` | 14 |
| 8 | `src/v8/flows/types/EmailFlowV8.tsx` | 13 |
| 9 | `src/v8/flows/MFAConfigurationPageV8.tsx` | 13 |
| 10 | `src/pages/ApplicationGenerator.tsx` | 12 |
| 11 | `src/v8u/components/UserTokenStatusDisplayV8U.tsx` | 11 |
| 12 | `src/templates/V7FlowVariants.tsx` | 11 |
| 13 | `src/v8u/pages/EnhancedStateManagementPage.tsx` | 9 |
| 14 | `src/v8/flows/unified/components/UnifiedConfigurationStep.tsx` | 9 |
| 15 | `src/v8/flows/types/SMSOTPConfigurationPageV8.tsx` | 9 |
| 16 | `src/v8/flows/types/MobileFlowV8.tsx` | 9 |
| 17 | `src/pages/flows/v9/SAMLBearerAssertionFlowV9.tsx` | 9 |
| 18 | `src/pages/flows/UserInfoFlow.tsx` | 9 |
| 19 | `src/pages/docs/OAuth2SecurityBestPractices.tsx` | 9 |
| 20 | `src/components/MobilePhoneDeviceFlow.tsx` | 9 |
| ...| ~437 more files with 1–8 warnings each | ~980 |

To get the full live list at any time:
```bash
npx eslint src/ --format compact 2>/dev/null | grep "Warning" | grep -v "locked/" \
  | awk -F: '{print $1}' | sort | uniq -c | sort -rn \
  | awk '{print $1, $2}' | sed 's|.*/oauth-playground/||'
```

---

## Locked Files

Files under `src/locked/` are **intentionally frozen snapshots** used for version comparison. Before fixing warnings in these files you must check whether the lock should be preserved:

1. **Check if the file should stay frozen.** Ask the project lead or look at the associated feature flag.
2. **If it should stay frozen**, add `// eslint-disable-next-line @typescript-eslint/no-unused-vars` above each flagged line (do not change logic).
3. **If it can be unfrozen**, apply the same fixes as non-locked files.

Top locked files by warning count (run the query below for a live list):
```bash
npx eslint src/ --format compact 2>/dev/null | grep "Warning" | grep "locked/" \
  | awk -F: '{print $1}' | sort | uniq -c | sort -rn \
  | awk '{print $1, $2}' | sed 's|.*/oauth-playground/||'
```

---

## Tracking Progress

After each work session, update `PROGRAMMER_COORDINATION_HUB.md` with:
- Which files you fixed and their before/after counts
- The commit hash
- Updated total warning count

To get the current total:
```bash
npx eslint src/ --format compact 2>/dev/null | grep "Warning" | grep -v "^0 " | wc -l
```

Goal: **0 warnings** across all non-locked files.  
Stretch goal: **0 warnings** everywhere (requires locked-file decision above).
