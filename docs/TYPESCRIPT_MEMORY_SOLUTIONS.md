# TypeScript Memory Solutions for MasterFlow API

## Problem

TypeScript compiler runs out of memory during `npm run type-check` due to large codebase (~2,700 files).

## Solutions Implemented

### 1. Increased Memory Allocation (Primary Solution)

Added `NODE_OPTIONS` to increase heap size for TypeScript compiler:

```bash
# Default type-check now uses 8GB memory
npm run type-check

# Equivalent manual command
NODE_OPTIONS='--max-old-space-size=8192' tsc --noEmit
```

### 2. Alternative Type-Check Strategies

#### Quick Syntax Check (Fastest)

Use Biome for syntax validation instead of full type-check:

```bash
npm run verify:types
```

#### Skip Library Checking (Faster)

Skip type definitions from node_modules:

```bash
npm run type-check:small
```

#### Incremental Checking

Use TypeScript's incremental compilation:

```bash
npm run type-check:incremental
```

#### File-Based Checking (Targeted)

Check only specific files defined in `tsconfig.check.json`:

```bash
npm run type-check:file
```

#### Watch Mode (Development)

Run type-check in watch mode with increased memory:

```bash
npm run type-check:watch
```

### 3. Build with Increased Memory

```bash
# Production build with 8GB memory
npm run build:prod

# Or use NODE_OPTIONS directly
NODE_OPTIONS='--max-old-space-size=8192' npm run build
```

### 4. Quick Verification (No Type-Check)

```bash
# Verify types with Biome + build
npm run test:build
```

## Memory Configuration Options

| Command                    | Memory  | Use Case           |
| -------------------------- | ------- | ------------------ |
| `npm run type-check`       | 8GB     | Full type checking |
| `npm run type-check:small` | Default | Skip lib check     |
| `npm run verify:types`     | Minimal | Syntax only        |
| `npm run build:prod`       | 8GB     | Production builds  |

## Environment Variable (Permanent Fix)

Add to your shell profile (`.bashrc`, `.zshrc`, etc.):

```bash
# For macOS/Linux
export NODE_OPTIONS='--max-old-space-size=8192'

# For Windows (PowerShell)
$env:NODE_OPTIONS='--max-old-space-size=8192'

# For Windows (CMD)
set NODE_OPTIONS=--max-old-space-size=8192
```

## Recommended Workflow

### For Development (Fast Feedback)

```bash
npm run verify:types    # Quick syntax check
```

### Before Commit (Thorough)

```bash
npm run type-check:small   # Skip libraries
npm run check              # Biome lint + format
```

### Before Build (Complete)

```bash
npm run type-check     # Full type check with 8GB
npm run build:prod      # Production build
```

### CI/CD Pipeline

```bash
npm run type-check:file    # Check core files only
npm run test:quick-check   # Quick validation
```

## Troubleshooting

### Still Running Out of Memory?

Try these in order:

1. **Close other applications** to free system RAM
2. **Increase to 12GB**:
   ```bash
   NODE_OPTIONS='--max-old-space-size=12288' npm run type-check
   ```
3. **Check specific files only**:
   ```bash
   npx tsc --noEmit src/pages/SpecificFile.tsx
   ```
4. **Restart your terminal/IDE** to clear memory

### Verify System Memory

```bash
# macOS
vm_stat | head -5

# Linux
free -h

# Windows
systeminfo | findstr "Total Physical Memory"
```

## Files Created/Modified

- `package.json` - Added memory-safe scripts
- `tsconfig.check.json` - Targeted type-checking config
- `docs/TYPESCRIPT_MEMORY_SOLUTIONS.md` - This documentation

## Notes

- The 8GB allocation should be sufficient for the current ~2,700 file codebase
- Biome syntax checking is much faster and uses less memory than TypeScript
- The `tsconfig.check.json` excludes test files and focuses on core source files
- Incremental type-checking saves time on subsequent runs
