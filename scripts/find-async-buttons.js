#!/usr/bin/env node

/**
 * @file find-async-buttons.js
 * @description Simple script to find async buttons that need ButtonSpinner
 * @version 1.0.0
 */

import fs from 'fs';
import path from 'path';

function findFiles(dir, pattern = '*.tsx') {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        traverse(fullPath);
      } else if (stat.isFile() && item.endsWith('.tsx')) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

function findAsyncButtons() {
  const srcDir = './src';
  const files = findFiles(srcDir);
  const results = [];
  
  for (const file of files) {
    // Skip certain files
    if (file.includes('test') || file.includes('spec') || file.includes('lockdown') || file.includes('backup')) {
      continue;
    }
    
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for async onClick patterns
      const hasAsyncOnClick = /onClick.*async/.test(content);
      const hasButtonSpinner = content.includes('ButtonSpinner');
      
      if (hasAsyncOnClick && !hasButtonSpinner) {
        results.push({
          file: file.replace('./src/', ''),
          hasAsyncOnClick,
          hasButtonSpinner
        });
      }
    } catch (error) {
      console.error(`Error reading ${file}:`, error.message);
    }
  }
  
  return results;
}

function main() {
  console.log('🔍 Finding async buttons without ButtonSpinner...\n');
  
  const candidates = findAsyncButtons();
  
  if (candidates.length === 0) {
    console.log('✅ All async buttons are already using ButtonSpinner!');
    return;
  }
  
  console.log(`📊 Found ${candidates.length} files that need ButtonSpinner:\n`);
  
  candidates.forEach(({ file, hasAsyncOnClick, hasButtonSpinner }) => {
    console.log(`📄 ${file}`);
    console.log(`   - Has async onClick: ${hasAsyncOnClick ? '✅' : '❌'}`);
    console.log(`   - Has ButtonSpinner: ${hasButtonSpinner ? '✅' : '❌'}`);
    console.log('');
  });
  
  console.log(`🎯 Total files to update: ${candidates.length}`);
  console.log(`💡 Use the AsyncButtonWrapper component to safely add ButtonSpinner behavior`);
}

main();
