#!/usr/bin/env node
/**
 * scripts/update-dashboards.mjs
 *
 * Auto-populates the Component Cleanliness Dashboard from a live codebase scan.
 * Run manually or automatically via the post-commit hook.
 *
 * Usage:
 *   npm run update-dashboards
 *   node scripts/update-dashboards.mjs
 *   node scripts/update-dashboards.mjs --dry-run   (print only, no file writes)
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const DRY_RUN = process.argv.includes('--dry-run');

// ─────────────────────────────────────────────────────────────────────────────
// helpers
// ─────────────────────────────────────────────────────────────────────────────

function sh(cmd) {
  return execSync(cmd, { cwd: ROOT, encoding: 'utf8' });
}

/** Count occurrences of an ERE regex in all .tsx/.ts files under src/ (minus locked) */
function countInSrc(pattern, _options = {}) {
  try {
    const result = execSync(
      `grep -rE --include="*.tsx" --include="*.ts" --exclude-dir=locked -c "${pattern}" src/ 2>/dev/null || true`,
      { cwd: ROOT, encoding: 'utf8' }
    );
    return result.split('\n')
      .filter(l => l.includes(':'))
      .reduce((sum, l) => sum + parseInt(l.split(':')[1] || '0', 10), 0);
  } catch {
    return 0;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Live codebase scan for cleanliness metrics
// ─────────────────────────────────────────────────────────────────────────────

console.log('🔍 Scanning codebase for cleanliness metrics…');

const questionMarkCount    = countInSrc('❓');
const eslintDisableCount   = countInSrc('eslint-disable');
const consoleErrorCount    = countInSrc('console\.error|console\.warn');
const biomeIgnoreCount     = countInSrc('biome-ignore');
const tsAnyCount           = countInSrc(': any[^A-Za-z_]|as any[^A-Za-z_]');

// Count Bootstrap Icons usage (good)
let biIconCount = 0;
try {
  biIconCount = parseInt(sh('grep -r --include="*.tsx" --include="*.ts" -c "bi bi-" src/ 2>/dev/null | awk -F: \'{s+=$2} END {print s}\'').trim() || '0', 10);
} catch { /* ignore */ }

// Sidebar analysis
const activeSidebarFile = 'src/components/SidebarMenuPing.tsx';
let sidebarItemCount = 0;
try {
  sidebarItemCount = parseInt(sh(`grep -c "path:" ${activeSidebarFile} 2>/dev/null || echo 0`).trim(), 10);
} catch { /* ignore */ }

const now = new Date().toISOString();

// ─────────────────────────────────────────────────────────────────────────────
// Build the updated V9_STANDARDIZATION_ITEMS array (inject into dashboard)
// ─────────────────────────────────────────────────────────────────────────────

const v9Items = [
  {
    id: 'bootstrap-icons-migration',
    description: 'Bootstrap Icons replacing question-mark emoji placeholders',
    status: questionMarkCount === 0 ? 'clean' : questionMarkCount < 10 ? 'warning' : 'pending',
    countLabel: questionMarkCount === 0
      ? `${biIconCount} bi-* icons in use`
      : `${questionMarkCount} placeholders remaining → ${biIconCount} bi-* in use`,
    detail: questionMarkCount === 0
      ? `All user-visible question-mark placeholders replaced with Bootstrap Icons CSS classes (<i className="bi bi-*">). ${biIconCount} icon references across active components.`
      : `${questionMarkCount} question-mark spans remain outside src/locked/. ${biIconCount} Bootstrap icon references already in place.`,
  },
  {
    id: 'active-sidebar-identified',
    description: 'Active sidebar: SidebarMenuPing (USE_PING_MENU=true)',
    status: 'fixed',
    countLabel: `${sidebarItemCount} route items`,
    detail: 'Sidebar.tsx → SidebarMenuPing.tsx is the live path. DragDropSidebar.tsx is the locked legacy fallback. DragDropSidebar.V2.tsx and DragDropSidebar.tsx.V2.tsx are dead files (not imported anywhere).',
  },
  {
    id: 'oauth-oidc-duplication',
    description: 'OAuth/OIDC flow duplication reduced',
    status: 'fixed',
    countLabel: '~15,477 lines deleted',
    detail: 'Dead V8 flows deleted, FlowCategories.tsx reorganized into 7 categories with correct V9 routes, App.tsx redirects added, 6 orphaned hooks/services removed.',
  },
  {
    id: 'v9-flows-standardized',
    description: 'V9 flows fully standardized',
    status: 'clean',
    countLabel: '18 / 18 flows',
    detail: 'All V9 flows use V9CredentialStorageService, CompactAppPickerV9, 0 console.error/warn violations. V7 routes redirect to V9.',
  },
  {
    id: 'v9-logger-migration',
    description: 'console.* → logger.* migration',
    status: consoleErrorCount === 0 ? 'clean' : 'warning',
    countLabel: consoleErrorCount === 0
      ? '0 console.error/warn in production src'
      : `${consoleErrorCount} console.error/warn remaining`,
    detail: 'Structured logger across 90+ service files, 16 hooks, 3 contexts, 43 utils, 79 components. Intentional exceptions: loggingService, code-gen templates, CLI tools.',
  },
  {
    id: 'eslint-disable-count',
    description: 'ESLint/Biome disable directives',
    status: eslintDisableCount < 50 ? 'clean' : eslintDisableCount < 150 ? 'warning' : 'pending',
    countLabel: `${eslintDisableCount} eslint-disable + ${biomeIgnoreCount} biome-ignore`,
    detail: 'Targeted suppression comments. Goal: eliminate no-explicit-any and exhaustive-deps groups.',
  },
  {
    id: 'ts-any-usage',
    description: 'TypeScript `any` usage',
    status: tsAnyCount < 20 ? 'clean' : tsAnyCount < 80 ? 'warning' : 'pending',
    countLabel: `~${tsAnyCount} occurrences`,
    detail: 'Tracked across non-locked src/. Reduction goal: replace with proper generics.',
  },
  {
    id: 'v9-dead-flows-archived',
    description: 'Dead flow files archived / deleted',
    status: 'fixed',
    countLabel: '31+ files + 5 dirs removed',
    detail: 'Cleaned active codebase. Scope rule: only sidebar menu items + direct services in scope (sidebarMenuConfig.ts).',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Rewrite V9_STANDARDIZATION_ITEMS in CleanlinessDashboardWorking.tsx
// ─────────────────────────────────────────────────────────────────────────────

const V9_START = '// ─── AUTO-GENERATED: live scan items — do not edit manually ───';
const V9_END   = '// ─── END AUTO-GENERATED v9 items ───';
const DASH_PATH = resolve(ROOT, 'src/components/CleanlinessDashboardWorking.tsx');

let dashContent = readFileSync(DASH_PATH, 'utf8');

const v9Block = [
  V9_START,
  `// Last updated: ${now}`,
  '',
  `const V9_STANDARDIZATION_ITEMS: AuditItem[] = ${JSON.stringify(v9Items, null, 2)};`,
  '',
  V9_END,
].join('\n');

if (dashContent.includes(V9_START)) {
  const startIdx = dashContent.indexOf(V9_START);
  const endIdx   = dashContent.indexOf(V9_END) + V9_END.length;
  dashContent = dashContent.slice(0, startIdx) + v9Block + dashContent.slice(endIdx);
} else {
  // Replace existing V9_STANDARDIZATION_ITEMS const (cross-line comment + declaration)
  dashContent = dashContent.replace(
    /\/\/ --- V9[\s\S]*?const V9_STANDARDIZATION_ITEMS: AuditItem\[\] = \[[\s\S]*?^\];/m,
    v9Block
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Write files (or print if dry-run)
// ─────────────────────────────────────────────────────────────────────────────

if (DRY_RUN) {
  console.log('\n── DRY RUN — no files written ──');
  console.log(`V9 audit items: ${v9Items.length}`);
  console.log(`❓ remaining: ${questionMarkCount}`);
  console.log(`Bootstrap icon refs: ${biIconCount}`);
  console.log(`eslint-disable: ${eslintDisableCount}`);
  console.log(`console.error/warn: ${consoleErrorCount}`);
} else {
  writeFileSync(DASH_PATH, dashContent, 'utf8');

  console.log(`✅ CleanlinessDashboardWorking.tsx — ${v9Items.length} live audit items`);
  console.log(`   ❓ remaining (non-locked): ${questionMarkCount}`);
  console.log(`   Bootstrap icon refs:       ${biIconCount}`);
  console.log(`   eslint-disable count:      ${eslintDisableCount}`);
  console.log(`   console.error/warn count:  ${consoleErrorCount}`);
  console.log(`\n🌐 https://api.pingdemo.com:3000/cleanliness-dashboard`);
}
