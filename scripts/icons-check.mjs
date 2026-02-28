#!/usr/bin/env node
/**
 * icons:check — Validates all react-icons/fi imports and direct-import usage.
 *
 * Exits 0 if clean, 1 if any invalid icon names found.
 * Also warns about files still importing directly from 'react-icons/fi'
 * instead of '@icons'.
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SRC = join(ROOT, 'src');

// Load valid icon names from installed package
let fi;
try {
  fi = require('react-icons/fi');
} catch {
  console.error('❌ react-icons not found. Run npm install first.');
  process.exit(1);
}
const VALID = new Set(Object.keys(fi).filter(k => k.startsWith('Fi')));

function walk(dir) {
  const files = [];
  for (const f of readdirSync(dir)) {
    const full = join(dir, f);
    const stat = statSync(full);
    if (stat.isDirectory()) files.push(...walk(full));
    else if (['.tsx', '.ts'].includes(extname(f))) files.push(full);
  }
  return files;
}

const NAMES_RE = /import\s*\{([^}]+)\}\s*from\s*['"]react-icons\/fi['"]/gs;

const errors = [];
const directImports = [];

for (const file of walk(SRC)) {
  const code = readFileSync(file, 'utf8');
  if (!code.includes('react-icons/fi')) continue;

  const shortPath = file.replace(ROOT + '/', '');
  directImports.push(shortPath);

  let m;
  NAMES_RE.lastIndex = 0;
  while ((m = NAMES_RE.exec(code)) !== null) {
    const block = m[1];
    for (const entry of block.split(',')) {
      const clean = entry.trim().replace(/\s+as\s+\w+/, '').trim();
      if (!clean || !clean.startsWith('Fi')) continue;
      if (!VALID.has(clean)) {
        const before = code.slice(0, m.index);
        const line = before.split('\n').length;
        errors.push({ file: shortPath, name: clean, line });
      }
    }
  }
}

// Report invalid icons
if (errors.length > 0) {
  console.error(`\n❌ INVALID ICON NAMES (${errors.length} occurrences):\n`);
  const byName = {};
  for (const e of errors) {
    if (!byName[e.name]) byName[e.name] = [];
    byName[e.name].push(`    ${e.file}:${e.line}`);
  }
  for (const [name, locs] of Object.entries(byName)) {
    console.error(`  ${name}`);
    for (const l of locs) console.error(l);
  }
  console.error('\nFix: Replace with valid feather icon names from https://feathericons.com');
  console.error('     or add to src/icons/index.ts if valid but missing from barrel.\n');
  process.exit(1);
} else {
  console.log(`✓ No invalid icon names found (scanned ${walk(SRC).length} files)`);
}

// Warn about direct imports (not errors, just advisory)
// Filter out src/icons/index.ts itself
const directNonBarrel = directImports.filter(f => !f.endsWith('icons/index.ts'));
if (directNonBarrel.length > 0) {
  console.warn(`\n⚠  ${directNonBarrel.length} file(s) still import directly from 'react-icons/fi'`);
  console.warn(`   Run 'npm run icons:fix' to migrate them to '@icons'.\n`);
} else {
  console.log(`✓ All icon imports use '@icons' barrel`);
}
