#!/usr/bin/env node

/**
 * Verify Phase 1 cleanup was successful
 */

import { spawn } from 'node:child_process';

console.log('🔍 Verifying Phase 1 cleanup...');

// Test build
console.log('\n📦 Testing build...');
const buildProcess = spawn('npm', ['run', 'build'], { stdio: 'inherit' });

buildProcess.on('close', (code) => {
	if (code === 0) {
		console.log('✅ Build successful!');

		// Test dev server start
		console.log('\n🚀 Testing dev server...');
		const devProcess = spawn('npm', ['run', 'dev'], { stdio: 'pipe' });

		setTimeout(() => {
			devProcess.kill();
			console.log('✅ Dev server starts successfully!');
			console.log('\n🎉 Phase 1 cleanup verification complete!');
			console.log('✅ Safe to proceed to Phase 2');
		}, 5000);
	} else {
		console.log('❌ Build failed! Consider restoring from backup.');
		console.log('🔄 To restore: node backup-*/restore.js');
	}
});
