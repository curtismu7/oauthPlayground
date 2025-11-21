#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { exit } from 'node:process';

const watchedPrefixes = ['src/services/'];

const runGitCommand = (command) => {
	try {
		return execSync(command, { stdio: ['ignore', 'pipe', 'ignore'] })
			.toString()
			.trim();
	} catch {
		return '';
	}
};

const stagedDiff = runGitCommand('git diff --cached --name-only');
const workingDiff = stagedDiff || runGitCommand('git diff --name-only');

if (!workingDiff) {
	exit(0);
}

const changedFiles = workingDiff
	.split('\n')
	.map((file) => file.trim())
	.filter(Boolean);

const touchedServices = changedFiles.filter((file) =>
	watchedPrefixes.some((prefix) => file.startsWith(prefix))
);

if (touchedServices.length === 0) {
	exit(0);
}

const packageDiff = runGitCommand('git diff --cached package.json');

if (!packageDiff.includes('"version"')) {
	console.error(
		'❌ Detected changes inside src/services/ but package.json version was not updated.\n' +
			'   Please bump the version in package.json (and regenerate dependent surfaces) before committing.'
	);
	exit(1);
}

console.log('✅ Service changes detected and version bump verified.');
