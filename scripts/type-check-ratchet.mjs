#!/usr/bin/env node
/**
 * Type-error ratchet.
 *
 * The codebase carries a large baseline of pre-existing TypeScript errors (Vite
 * builds never type-checked, so they accumulated). Fixing them all at once is not
 * practical, but we can stop the bleeding: this gate runs `tsc --noEmit` and fails
 * CI only if the error count is HIGHER than the committed baseline. New code that
 * introduces type errors is rejected; chipping away at the baseline is rewarded
 * (lower the number in .tsc-error-baseline whenever the count drops).
 *
 * Usage:
 *   node scripts/type-check-ratchet.mjs            # check against baseline
 *   node scripts/type-check-ratchet.mjs --update   # write current count as new baseline
 */
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const baselineFile = join(root, '.tsc-error-baseline');

function countErrors() {
	let out = '';
	try {
		out = execSync("npx tsc --noEmit --skipLibCheck", {
			cwd: root,
			encoding: 'utf8',
			stdio: ['ignore', 'pipe', 'pipe'],
			env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=8192' },
			maxBuffer: 128 * 1024 * 1024,
		});
	} catch (e) {
		// tsc exits non-zero when there are errors — that is the normal path here.
		out = `${e.stdout || ''}${e.stderr || ''}`;
	}
	const matches = out.match(/error TS\d+/g);
	return matches ? matches.length : 0;
}

const current = countErrors();
const update = process.argv.includes('--update');

if (update || !existsSync(baselineFile)) {
	writeFileSync(baselineFile, `${current}\n`);
	console.log(`✅ Type-error baseline written: ${current}`);
	process.exit(0);
}

const baseline = parseInt(readFileSync(baselineFile, 'utf8').trim(), 10) || 0;

if (current > baseline) {
	console.error(
		`❌ Type errors increased: ${current} (baseline ${baseline}, +${current - baseline}).\n` +
			`   New code must not add TypeScript errors. Run \`npx tsc --noEmit --skipLibCheck\` to see them.`
	);
	process.exit(1);
}

if (current < baseline) {
	console.log(
		`🎉 Type errors dropped to ${current} (baseline ${baseline}, -${baseline - current}).\n` +
			`   Lower the baseline: \`node scripts/type-check-ratchet.mjs --update\` and commit .tsc-error-baseline.`
	);
	process.exit(0);
}

console.log(`✅ Type errors held at baseline (${current}).`);
process.exit(0);
