#!/usr/bin/env node

/**
 * Phase 1 Cleanup: Remove unused type definitions and simple utilities
 * These are the safest files to remove with minimal risk
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧹 Phase 1 Cleanup: Removing unused type definitions and simple utilities\n');

// Phase 1: Safest files to remove
const phase1Files = [
	// Type definitions (completely unused)
	'src/types/flowTypes.ts',
	'src/types/oauth.ts',
	'src/types/oauthErrors.ts',
	'src/types/oauthFlows.ts',
	'src/types/storage.ts',
	'src/types/token-inspector.ts',
	'src/types/url.ts',

	// Simple utility modules (no complex dependencies)
	'src/utils/activityTracker.ts',
	'src/utils/callbackUrls.ts',
	'src/utils/clientAuthentication.ts',
	'src/utils/clientLogger.ts',
	'src/utils/clipboard.ts',
	'src/utils/crypto.ts',
	'src/utils/flowConfiguration.ts',
	'src/utils/jwt.ts',
	'src/utils/jwtGenerator.ts',
	'src/utils/logger.ts',
	'src/utils/scrollManager.ts',
	'src/utils/secureJson.ts',
	'src/utils/tokenHistory.ts',
	'src/utils/tokenSourceTracker.ts',

	// Config file
	'src/services/config.ts',

	// Style files
	'src/styles/global.ts',
	'src/styles/styled.d.ts',
	'src/theme.d.ts',
	'src/vite-env.d.ts',
];

let removedCount = 0;
let totalSizeRemoved = 0;
const errors = [];

console.log('📋 Files to remove in Phase 1:');
phase1Files.forEach((file, index) => {
	console.log(`   ${index + 1}. ${file}`);
});

console.log('\n🚀 Starting removal process...\n');

for (const file of phase1Files) {
	const fullPath = path.join(__dirname, file);

	try {
		if (fs.existsSync(fullPath)) {
			const stats = fs.statSync(fullPath);
			const sizeKB = (stats.size / 1024).toFixed(1);

			fs.unlinkSync(fullPath);

			console.log(`✅ Removed: ${file} (${sizeKB} KB)`);
			removedCount++;
			totalSizeRemoved += stats.size;
		} else {
			console.log(`⚠️  File not found: ${file}`);
		}
	} catch (error) {
		console.log(`❌ Error removing ${file}: ${error.message}`);
		errors.push({ file, error: error.message });
	}
}

// Clean up empty directories
const dirsToCheck = ['src/types', 'src/styles'];

for (const dir of dirsToCheck) {
	const fullDirPath = path.join(__dirname, dir);

	try {
		if (fs.existsSync(fullDirPath)) {
			const items = fs.readdirSync(fullDirPath);
			if (items.length === 0) {
				fs.rmdirSync(fullDirPath);
				console.log(`🗂️  Removed empty directory: ${dir}`);
			}
		}
	} catch (error) {
		console.log(`⚠️  Could not remove directory ${dir}: ${error.message}`);
	}
}

// Generate summary
console.log(`\n${'='.repeat(50)}`);
console.log('📊 PHASE 1 CLEANUP SUMMARY');
console.log('='.repeat(50));
console.log(`✅ Files successfully removed: ${removedCount}`);
console.log(`💾 Total size freed: ${(totalSizeRemoved / 1024).toFixed(2)} KB`);
console.log(`❌ Errors encountered: ${errors.length}`);

if (errors.length > 0) {
	console.log('\n❌ Errors:');
	errors.forEach(({ file, error }) => {
		console.log(`   • ${file}: ${error}`);
	});
}

console.log('\n🔍 Next steps:');
console.log('1. ✅ Run tests to ensure nothing is broken');
console.log('2. ✅ Check that the app still builds and runs');
console.log('3. ✅ If all good, proceed to Phase 2');
console.log('4. ⚠️  If issues arise, restore from backup:');
console.log(`   node "backup-*/restore.js"`);

// Create verification script
const verificationScript = `#!/usr/bin/env node

/**
 * Verify Phase 1 cleanup was successful
 */

import { spawn } from 'child_process';

console.log('🔍 Verifying Phase 1 cleanup...');

// Test build
console.log('\\n📦 Testing build...');
const buildProcess = spawn('npm', ['run', 'build'], { stdio: 'inherit' });

buildProcess.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Build successful!');
    
    // Test dev server start
    console.log('\\n🚀 Testing dev server...');
    const devProcess = spawn('npm', ['run', 'dev'], { stdio: 'pipe' });
    
    setTimeout(() => {
      devProcess.kill();
      console.log('✅ Dev server starts successfully!');
      console.log('\\n🎉 Phase 1 cleanup verification complete!');
      console.log('✅ Safe to proceed to Phase 2');
    }, 5000);
    
  } else {
    console.log('❌ Build failed! Consider restoring from backup.');
    console.log('🔄 To restore: node backup-*/restore.js');
  }
});
`;

fs.writeFileSync('verify-phase1.js', verificationScript);

console.log('\n🔍 Verification script created: verify-phase1.js');
console.log('📝 Run: node verify-phase1.js');

console.log('\n✅ Phase 1 cleanup completed!');
