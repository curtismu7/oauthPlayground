#!/usr/bin/env node

/**
 * Restore from backup created on 2025-10-01T13:17:34.429Z
 */

import fs from 'node:fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔄 Restoring from backup...');

const backupDir = '/Users/cmuir/P1Import-apps/oauth-playground/backup-2025-10-01T13-17-34';
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
    console.log(`📁 Restoring: ${item}`);
    
    // Remove existing if it exists
    if (fs.existsSync(destPath)) {
      fs.rmSync(destPath, { recursive: true, force: true });
    }
    
    restoreRecursive(sourcePath, destPath);
  }
}

console.log('✅ Restore completed!');
console.log('🔄 You may need to run: npm install');
