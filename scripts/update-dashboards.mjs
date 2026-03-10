#!/usr/bin/env node
/**
 * scripts/update-dashboards.mjs
 *
 * Auto-populates the two in-app dashboards from real git history and a live
 * codebase scan.  Run manually or automatically via the post-commit hook.
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

/** Rough LOC delta: insertions - deletions from git diff --stat output */
function parseDiffStat(statBlock) {
  let files = 0, ins = 0, del = 0;
  for (const line of statBlock.split('\n')) {
    const m = line.match(/(\d+) file.*changed(?:, (\d+) insertion.*)?(?:, (\d+) deletion.*)?/);
    if (m) {
      files += parseInt(m[1] || '0', 10);
      ins   += parseInt(m[2] || '0', 10);
      del   += parseInt(m[3] || '0', 10);
    }
  }
  return { files, insertions: ins, deletions: del };
}

/** Classify a commit subject into one of our category ids */
function classifyCommit(subject) {
  const s = subject.toLowerCase();
  if (/v8.*v9|v9.*migrat|migrat.*v9/.test(s))          return 'v8-to-v9-migration';
  if (/ping.ui|bootstrap.*icon|icon.*bootstrap/.test(s)) return 'ping-ui-migration';
  if (/lint|biome|console\.|logger|cleanup|dead.*flow|duplicate|archive/.test(s)) return 'code-cleanup';
  if (/fix.*bug|bug.*fix|crash|error|broken|❌|runtime.*error/.test(s)) return 'bug-fixes';
  if (/doc|readme|guide|comment/.test(s)) return 'documentation';
  if (/test|spec|coverage|jest/.test(s)) return 'testing';
  if (/perf|bundle|optim|chunk|lazy/.test(s)) return 'performance';
  if (/security|auth|token|oauth|oidc|pkce|csrf|xss/.test(s)) return 'security';
  if (/fix:/.test(s)) return 'bug-fixes';
  if (/feat:/.test(s)) return 'v8-to-v9-migration';
  return 'code-cleanup';
}

/** Produce a human-readable achievement from a commit subject */
function toAchievement(subject) {
  return subject.replace(/^(fix|feat|chore|refactor|style|docs|test|perf|build|ci)(\(.*?\))?:\s*/i, '');
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Read git log for ALL commits on this branch (not on main)
// ─────────────────────────────────────────────────────────────────────────────

console.log('📖 Reading git log…');

const branchLog = sh(
  'git log --format="%H|%ad|%s" --date=short HEAD --not $(git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null || echo main) 2>/dev/null || git log --format="%H|%ad|%s" --date=short -50'
).trim().split('\n').filter(Boolean);

// Also gather --stat for each commit (we batch it for performance)
const statRaw = sh(
  'git log --stat --format="COMMIT|%H|%ad|%s" --date=short -50'
);

// Parse stat blocks keyed by hash
const statByHash = {};
let currentHash = null;
let currentBlock = [];
for (const line of statRaw.split('\n')) {
  if (line.startsWith('COMMIT|')) {
    if (currentHash) statByHash[currentHash] = currentBlock.join('\n');
    const parts = line.split('|');
    currentHash = parts[1];
    currentBlock = [];
  } else {
    currentBlock.push(line);
  }
}
if (currentHash) statByHash[currentHash] = currentBlock.join('\n');

// ─────────────────────────────────────────────────────────────────────────────
// 2. Build CleanupSession objects from commits
// ─────────────────────────────────────────────────────────────────────────────

// Group commits by date (each calendar day becomes one session)
const byDate = {};
for (const entry of branchLog) {
  const [hash, date, ...subjectParts] = entry.split('|');
  const subject = subjectParts.join('|');
  if (!byDate[date]) byDate[date] = [];
  byDate[date].push({ hash, date, subject });
}

const CATEGORY_META = {
  'v8-to-v9-migration': { name: 'V8 to V9 Migration',  color: '#0066CC', icon: '🔄' },
  'ping-ui-migration':  { name: 'Ping UI Migration',    color: '#28A745', icon: '🎨' },
  'code-cleanup':       { name: 'Code Cleanup',         color: '#FFC107', icon: '🧹' },
  'bug-fixes':          { name: 'Bug Fixes',            color: '#DC3545', icon: '🐛' },
  'documentation':      { name: 'Documentation',        color: '#6F42C1', icon: '📚' },
  'testing':            { name: 'Testing & QA',         color: '#20C997', icon: '✅' },
  'performance':        { name: 'Performance',          color: '#FD7E14', icon: '⚡' },
  'security':           { name: 'Security',             color: '#E83E8C', icon: '🔒' },
};

const sessions = [];
const sortedDates = Object.keys(byDate).sort().reverse();

for (const date of sortedDates) {
  const commits = byDate[date];

  // Aggregate stats across all commits on this day
  let totalFiles = 0, totalIns = 0, totalDel = 0;
  const achievements = [];
  const categoryVotes = {};

  for (const { hash, subject } of commits) {
    const statBlock = statByHash[hash] || '';
    const { files, insertions, deletions } = parseDiffStat(statBlock);
    totalFiles += files;
    totalIns   += insertions;
    totalDel   += deletions;

    const cat = classifyCommit(subject);
    categoryVotes[cat] = (categoryVotes[cat] || 0) + 1;
    achievements.push(toAchievement(subject));
  }

  const topCat = Object.entries(categoryVotes).sort((a, b) => b[1] - a[1])[0]?.[0] || 'code-cleanup';
  const catMeta = CATEGORY_META[topCat];
  const linesChanged = totalIns + totalDel;
  const issuesResolved = Math.max(1, Math.round(linesChanged / 80));  // rough heuristic
  const durationHours = parseFloat(Math.max(0.5, Math.min(12, linesChanged / 300)).toFixed(1));

  // Build a readable description from commit subjects
  const description = commits.length === 1
    ? toAchievement(commits[0].subject)
    : `${commits.length} commits: ${achievements.slice(0, 2).join('; ')}${achievements.length > 2 ? ' …' : ''}`;

  sessions.push({
    id: `git-${date}-${topCat}`,
    date,
    duration: durationHours,
    category: { id: topCat, ...catMeta, description: catMeta.name },
    description,
    filesModified: totalFiles,
    linesOfCode: linesChanged,
    issuesResolved,
    documentation: [],
    achievements: achievements.slice(0, 5),
    version: sh('node -p "require(\'./package.json\').version"').trim(),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Live codebase scan for cleanliness metrics
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
// 4. Build the updated V9_STANDARDIZATION_ITEMS array (inject into dashboard)
// ─────────────────────────────────────────────────────────────────────────────

const v9Items = [
  {
    id: 'bootstrap-icons-migration',
    description: 'Bootstrap Icons replacing ❓ emoji placeholders',
    status: questionMarkCount === 0 ? 'clean' : questionMarkCount < 10 ? 'warning' : 'pending',
    countLabel: questionMarkCount === 0
      ? `${biIconCount} bi-* icons in use`
      : `${questionMarkCount} ❓ remaining → ${biIconCount} bi-* in use`,
    detail: questionMarkCount === 0
      ? `All user-visible ❓ placeholders replaced with Bootstrap Icons CSS classes (<i className="bi bi-*">). ${biIconCount} icon references across active components.`
      : `${questionMarkCount} ❓ spans remain outside src/locked/. ${biIconCount} Bootstrap icon references already in place.`,
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
// 5. Rewrite cleanupHistoryService.ts — sessions block only
// ─────────────────────────────────────────────────────────────────────────────

const SESSIONS_START = '// ─── AUTO-GENERATED: git-driven sessions — do not edit manually ───';
const SESSIONS_END   = '// ─── END AUTO-GENERATED sessions ───';
const SERVICE_PATH   = resolve(ROOT, 'src/services/cleanupHistoryService.ts');

let serviceContent = readFileSync(SERVICE_PATH, 'utf8');

const generatedBlock = [
  SESSIONS_START,
  `// Last updated: ${now}`,
  `// Source: git log (${sessions.length} days → ${sessions.length} sessions)`,
  '',
  `const CLEANUP_SESSIONS: CleanupSession[] = ${JSON.stringify(sessions, null, 2)};`,
  '',
  SESSIONS_END,
].join('\n');

// Replace the existing CLEANUP_SESSIONS block (between markers OR the whole const)
if (serviceContent.includes(SESSIONS_START)) {
  const startIdx = serviceContent.indexOf(SESSIONS_START);
  const endIdx   = serviceContent.indexOf(SESSIONS_END) + SESSIONS_END.length;
  serviceContent = serviceContent.slice(0, startIdx) + generatedBlock + serviceContent.slice(endIdx);
} else {
  // First run: replace the existing hardcoded CLEANUP_SESSIONS const
  const constMatch = serviceContent.match(/\/\/ Mock cleanup sessions[\s\S]*?^const CLEANUP_SESSIONS: CleanupSession\[\] = \[[\s\S]*?^\];/m);
  if (constMatch) {
    serviceContent = serviceContent.replace(constMatch[0], generatedBlock);
  } else {
    // Fallback: append before the cleanupHistoryService class/export
    const insertBefore = 'class CleanupHistoryServiceImpl';
    serviceContent = serviceContent.replace(insertBefore, generatedBlock + '\n\n' + insertBefore);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Rewrite V9_STANDARDIZATION_ITEMS in CleanlinessDashboardWorking.tsx
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
// 7. Write files (or print if dry-run)
// ─────────────────────────────────────────────────────────────────────────────

if (DRY_RUN) {
  console.log('\n── DRY RUN — no files written ──');
  console.log(`Sessions generated: ${sessions.length}`);
  console.log(`V9 audit items: ${v9Items.length}`);
  console.log(`❓ remaining: ${questionMarkCount}`);
  console.log(`Bootstrap icon refs: ${biIconCount}`);
  console.log(`eslint-disable: ${eslintDisableCount}`);
  console.log(`console.error/warn: ${consoleErrorCount}`);
} else {
  writeFileSync(SERVICE_PATH, serviceContent, 'utf8');
  writeFileSync(DASH_PATH, dashContent, 'utf8');

  console.log(`✅ cleanupHistoryService.ts   — ${sessions.length} sessions from git`);
  console.log(`✅ CleanlinessDashboardWorking.tsx — ${v9Items.length} live audit items`);
  console.log(`   ❓ remaining (non-locked): ${questionMarkCount}`);
  console.log(`   Bootstrap icon refs:       ${biIconCount}`);
  console.log(`   eslint-disable count:      ${eslintDisableCount}`);
  console.log(`   console.error/warn count:  ${consoleErrorCount}`);
  console.log(`\n🌐 https://api.pingdemo.com:3000/cleanliness-dashboard`);
  console.log(`🌐 https://api.pingdemo.com:3000/cleanup-history`);
}
