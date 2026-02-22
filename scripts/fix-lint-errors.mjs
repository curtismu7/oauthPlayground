#!/usr/bin/env node

/**
 * Lint Error Fix Script
 * 
 * Automatically fixes common lint errors in the codebase
 * Focuses on accessibility issues and TypeScript errors
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Common button type fixes
const BUTTON_TYPE_FIXES = [
  {
    pattern: /<button\s+onClick=/g,
    replacement: '<button type="button" onClick='
  },
  {
    pattern: /<button\s+className=/g,
    replacement: '<button type="button" className='
  },
  {
    pattern: /<button\s+disabled=/g,
    replacement: '<button type="button" disabled='
  }
];

// Form label fixes
const FORM_LABEL_FIXES = [
  // Add htmlFor to labels
  {
    pattern: /<label([^>]*)>([^<]*)([^<]*)<\/label>/g,
    replacement: (match, attrs, text, after) => {
      // Try to extract input name from text
      const inputName = text.toLowerCase().replace(/[^a-z0-9]/g, '');
      return `<label${attrs} htmlFor="${inputName}">${text}${after}</label>`;
    }
  }
];

// Static element interaction fixes
const STATIC_ELEMENT_FIXES = [
  {
    pattern: /<div\s+([^>]*)onClick=/g,
    replacement: '<div role="button" tabIndex={0} $1onClick='
  }
];

function fixFile(filePath) {
  console.log(`🔧 Fixing ${filePath}...`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Apply button type fixes
  BUTTON_TYPE_FIXES.forEach(fix => {
    const originalContent = content;
    content = content.replace(fix.pattern, fix.replacement);
    if (content !== originalContent) {
      modified = true;
      console.log(`  ✅ Fixed button type`);
    }
  });
  
  // Apply form label fixes
  FORM_LABEL_FIXES.forEach(fix => {
    const originalContent = content;
    content = content.replace(fix.pattern, fix.replacement);
    if (content !== originalContent) {
      modified = true;
      console.log(`  ✅ Fixed form label`);
    }
  });
  
  // Apply static element fixes
  STATIC_ELEMENT_FIXES.forEach(fix => {
    const originalContent = content;
    content = content.replace(fix.pattern, fix.replacement);
    if (content !== originalContent) {
      modified = true;
      console.log(`  ✅ Fixed static element interaction`);
    }
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`  💾 Saved changes`);
  } else {
    console.log(`  ℹ️ No changes needed`);
  }
}

function findFilesToFix(dir, extensions = ['.tsx', '.ts', '.jsx', '.js']) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        traverse(fullPath);
      } else if (stat.isFile()) {
        const ext = path.extname(item);
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }
  
  traverse(dir);
  return files;
}

// Main execution
const srcDir = path.join(__dirname, '..', 'src');
const files = findFilesToFix(srcDir);

console.log(`🚀 Starting lint fix process...`);
console.log(`📁 Found ${files.length} files to check`);

let fixedCount = 0;
files.forEach(file => {
  try {
    fixFile(file);
    fixedCount++;
  } catch (error) {
    console.error(`❌ Error fixing ${file}:`, error.message);
  }
});

console.log(`\n✅ Lint fix complete! Processed ${fixedCount} files`);
console.log(`🎯 Run 'npm run lint' again to see remaining errors`);
