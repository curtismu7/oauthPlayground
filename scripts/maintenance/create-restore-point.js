#!/usr/bin/env node

/**
 * Create a comprehensive restore point before cleanup
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('💾 Creating comprehensive restore point...\n');

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const backupDir = path.join(__dirname, `backup-${timestamp}`);

function createBackup() {
	// Create backup directory
	fs.mkdirSync(backupDir, { recursive: true });

	// Files and directories to backup
	const itemsToBackup = [
		'src',
		'package.json',
		'package-lock.json',
		'tsconfig.json',
		'vite.config.ts',
		'eslint.config.js',
	];

	let backedUpCount = 0;
	let totalSize = 0;

	function copyRecursive(source, destination) {
		const stats = fs.statSync(source);

		if (stats.isDirectory()) {
			// Skip node_modules, .git, and other unnecessary directories
			const dirName = path.basename(source);
			if (['node_modules', '.git', 'dist', 'build', '.vscode'].includes(dirName)) {
				return;
			}

			fs.mkdirSync(destination, { recursive: true });

			const items = fs.readdirSync(source);
			for (const item of items) {
				const sourcePath = path.join(source, item);
				const destPath = path.join(destination, item);
				copyRecursive(sourcePath, destPath);
			}
		} else {
			// Skip large files and unnecessary files
			const ext = path.extname(source);
			const fileName = path.basename(source);

			if (
				['.log', '.cache', '.tmp'].includes(ext) ||
				fileName.startsWith('.DS_Store') ||
				stats.size > 10 * 1024 * 1024
			) {
				// Skip files > 10MB
				return;
			}

			fs.copyFileSync(source, destination);
			backedUpCount++;
			totalSize += stats.size;
		}
	}

	for (const item of itemsToBackup) {
		const sourcePath = path.join(__dirname, item);
		const destPath = path.join(backupDir, item);

		if (fs.existsSync(sourcePath)) {
			console.log(`📁 Backing up: ${item}`);
			copyRecursive(sourcePath, destPath);
		}
	}

	// Create restore script
	const restoreScript = `#!/usr/bin/env node

/**
 * Restore from backup created on ${new Date().toISOString()}
 */

import fs from 'node:fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔄 Restoring from backup...');

const backupDir = '${backupDir}';
const projectRoot = path.dirname(__dirname);

function restoreRecursive(source, destination) {
  if (!fs.existsSync(source)) return;
  
  const stats = fs.statSync(source);
  
  if (stats.isDirectory()) {
    fs.mkdirSync(destination, { recursive: true });
    
    const items = fs.readdirSync(source);
    for (const item of items) {
      const sourcePath = path.join(source, item);
      const destPath = path.join(destination, item);
      restoreRecursive(sourcePath, destPath);
    }
  } else {
    fs.copyFileSync(source, destination);
  }
}

// Restore items
const itemsToRestore = ['src', 'package.json', 'package-lock.json', 'tsconfig.json', 'vite.config.ts', 'eslint.config.js'];

for (const item of itemsToRestore) {
  const sourcePath = path.join(backupDir, item);
  const destPath = path.join(projectRoot, item);
  
  if (fs.existsSync(sourcePath)) {
    console.log(\`📁 Restoring: \${item}\`);
    
    // Remove existing if it exists
    if (fs.existsSync(destPath)) {
      fs.rmSync(destPath, { recursive: true, force: true });
    }
    
    restoreRecursive(sourcePath, destPath);
  }
}

console.log('✅ Restore completed!');
console.log('🔄 You may need to run: npm install');
`;

	fs.writeFileSync(path.join(backupDir, 'restore.js'), restoreScript);

	// Create backup manifest
	const manifest = {
		timestamp: new Date().toISOString(),
		backupDir: backupDir,
		filesBackedUp: backedUpCount,
		totalSize: totalSize,
		sizeFormatted: `${(totalSize / 1024 / 1024).toFixed(2)} MB`,
		items: itemsToBackup,
	};

	fs.writeFileSync(path.join(backupDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

	return { backedUpCount, totalSize, backupDir };
}

// Execute backup
const result = createBackup();

console.log('\n✅ Restore point created successfully!');
console.log('📊 Backup Summary:');
console.log(`   📁 Location: ${result.backupDir}`);
console.log(`   📄 Files backed up: ${result.backedUpCount}`);
console.log(`   💾 Total size: ${(result.totalSize / 1024 / 1024).toFixed(2)} MB`);
console.log('\n🔄 To restore if needed:');
console.log(`   node "${path.join(result.backupDir, 'restore.js')}"`);
console.log('\n⚠️  Keep this backup until cleanup is verified successful!');
