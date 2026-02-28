#!/usr/bin/env node
/**
 * icons:fix — Rewrites all `from 'react-icons/fi'` imports to `from '@icons'`.
 *
 * Safe: only changes the import source string, not the imported names.
 * Files that already use '@icons' are skipped.
 * src/icons/index.ts itself is skipped (it IS the barrel).
 *
 * Usage: npm run icons:fix
 *   or:  node scripts/icons-fix.mjs [--dry-run]
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SRC = join(ROOT, 'src');
const DRY_RUN = process.argv.includes('--dry-run');

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

let changed = 0;
let skipped = 0;

for (const file of walk(SRC)) {
  const shortPath = file.replace(ROOT + '/', '');

  // Skip the barrel itself
  if (shortPath === 'src/icons/index.ts') continue;

  const code = readFileSync(file, 'utf8');
  if (!code.includes('react-icons/fi')) continue;

  // Replace all occurrences of 'react-icons/fi' with '@icons'
  const updated = code
    .replace(/from\s+'react-icons\/fi'/g, "from '@icons'")
    .replace(/from\s+"react-icons\/fi"/g, 'from "@icons"');

  if (updated === code) {
    skipped++;
    continue;
  }

  if (DRY_RUN) {
    console.log(`[dry-run] would update: ${shortPath}`);
  } else {
    writeFileSync(file, updated, 'utf8');
    console.log(`  ✓ ${shortPath}`);
  }
  changed++;
}

if (DRY_RUN) {
  console.log(`\n[dry-run] Would update ${changed} file(s). Run without --dry-run to apply.`);
} else {
  console.log(`\nDone. Updated ${changed} file(s).`);
  if (changed > 0) {
    console.log(`Run 'npm run icons:check' to verify all imports are valid.`);
  }
}
