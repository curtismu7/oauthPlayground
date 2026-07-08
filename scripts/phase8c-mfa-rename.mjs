#!/usr/bin/env node
/**
 * Phase 8c: strip V8 from mfa/ filenames and symbols (import paths + identifiers).
 */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ROOT = path.resolve(import.meta.dirname, '..');
const MFA_ROOT = path.join(ROOT, 'src', 'mfa');
const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', 'coverage']);
const SKIP_EXT = new Set(['.png', '.jpg', '.svg', '.woff', '.woff2', '.map']);

/** Keep V8 suffix — not part of mfa/ rename batch. */
const STEM_EXCLUSIONS = new Set([
	'EnvironmentManagementPageV8',
	'JWTConfigV8',
	'PostmanCollectionGeneratorV8',
	'JwtAuthServiceV8',
	'EnvironmentServiceV8',
	'jwtAuthServiceV8',
	'postmanCollectionGeneratorV8',
	'environmentServiceV8',
]);

function walk(dir, files = []) {
	for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
		if (SKIP_DIRS.has(ent.name)) continue;
		const p = path.join(dir, ent.name);
		if (ent.isDirectory()) walk(p, files);
		else files.push(p);
	}
	return files;
}

function stem(filename) {
	return filename.replace(/\.[^.]+$/, '');
}

function stripV8FromBasename(basename) {
	return basename.replace(/V8/g, '');
}

function collectMfaV8Files() {
	const files = [];
	function scan(dir) {
		for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
			const p = path.join(dir, ent.name);
			if (ent.isDirectory()) scan(p);
			else if (ent.name.includes('V8')) files.push(p);
		}
	}
	scan(MFA_ROOT);
	return files.sort((a, b) => b.length - a.length);
}

function gitMvAndBuildRenameMap() {
	const files = collectMfaV8Files();
	const renamePairs = [];

	for (const file of files) {
		const base = path.basename(file);
		const newBase = stripV8FromBasename(base);
		if (base === newBase) continue;
		const target = path.join(path.dirname(file), newBase);
		if (fs.existsSync(target)) {
			throw new Error(`Collision: ${file} -> ${target}`);
		}
		const oldStem = stem(base);
		const newStem = stem(newBase);
		if (oldStem !== newStem && !STEM_EXCLUSIONS.has(oldStem)) {
			renamePairs.push([oldStem, newStem]);
		}
		execSync(`git mv "${file}" "${target}"`, { cwd: ROOT, stdio: 'pipe' });
	}

	renamePairs.sort((a, b) => b[0].length - a[0].length);
	console.log(`git mv: ${files.length} mfa files, ${renamePairs.length} stem pairs`);
	return renamePairs;
}

function shouldProcess(file) {
	const ext = path.extname(file);
	if (SKIP_EXT.has(ext)) return false;
	if (file.endsWith('.bak')) return false;
	return (
		file.includes(`${path.sep}src${path.sep}`) ||
		file.includes(`${path.sep}scripts${path.sep}`) ||
		file.includes(`${path.sep}docs${path.sep}`)
	);
}

function escapeRegExp(s) {
	return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function applyStemRenames(text, renamePairs) {
	for (const [oldStem, newStem] of renamePairs) {
		const re = new RegExp(`\\b${escapeRegExp(oldStem)}\\b`, 'g');
		text = text.replace(re, newStem);
	}
	return text;
}

function stripResidualV8Symbols(text) {
	text = text.replace(/\b([A-Z][a-zA-Z0-9]*)V8\b/g, (match, name) => {
		if (STEM_EXCLUSIONS.has(match)) return match;
		return name;
	});
	text = text.replace(/\b([a-z][a-zA-Z0-9]*)V8\b/g, (match, name) => {
		if (STEM_EXCLUSIONS.has(match)) return match;
		return name;
	});
	return text;
}

function updateFileContents(renamePairs) {
	let changed = 0;
	for (const file of walk(ROOT)) {
		if (!shouldProcess(file)) continue;
		let text = fs.readFileSync(file, 'utf8');
		const orig = text;
		text = applyStemRenames(text, renamePairs);
		text = stripResidualV8Symbols(text);
		if (text !== orig) {
			fs.writeFileSync(file, text);
			changed++;
		}
	}
	console.log(`Updated ${changed} files`);
}

const renamePairs = gitMvAndBuildRenameMap();
updateFileContents(renamePairs);
