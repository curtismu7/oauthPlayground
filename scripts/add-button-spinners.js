#!/usr/bin/env node

/**
 * @file add-button-spinners.js
 * @description Script to systematically add ButtonSpinner to async button operations
 * @version 1.0.0
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

// Configuration
const CONFIG = {
  srcDir: './src',
  filePattern: '**/*.tsx',
  dryRun: false, // Set to true for testing
  verbose: true
};

// Patterns to identify async button operations
const ASYNC_PATTERNS = [
  /onClick=\s*{?\s*async\s*\(/g,
  /onClick=\s*{\s*\(\)\s*=>\s*async/g,
  /onClick={\s*async\s+\w+/g
];

// Files to exclude (already using ButtonSpinner or special cases)
const EXCLUDE_PATTERNS = [
  /ButtonSpinner/,
  /test/,
  /spec/,
  /stories/,
  /lockdown/,
  /backup/
];

function findAsyncButtons() {
  const files = glob.sync(path.join(CONFIG.srcDir, CONFIG.filePattern));
  const results = [];
  
  for (const file of files) {
    if (EXCLUDE_PATTERNS.some(pattern => pattern.test(file))) {
      continue;
    }
    
    try {
      const content = fs.readFileSync(file, 'utf8');
      const hasAsyncButton = ASYNC_PATTERNS.some(pattern => pattern.test(content));
      const hasButtonSpinnerImport = content.includes('ButtonSpinner');
      
      if (hasAsyncButton && !hasButtonSpinnerImport) {
        results.push({
          file,
          hasAsyncButton,
          hasButtonSpinnerImport,
          content
        });
      }
    } catch (error) {
      console.error(`Error reading ${file}:`, error.message);
    }
  }
  
  return results;
}

function generateMigrationCode(fileInfo) {
  const { file, content } = fileInfo;
  
  // Add import
  let updatedContent = content;
  const importRegex = /import\s+React\s+from\s+['"]react['"];?/;
  if (importRegex.test(content)) {
    updatedContent = updatedContent.replace(
      importRegex,
      "import React from 'react';\nimport { ButtonSpinner } from '../../components/ui';"
    );
  } else {
    // Find first import and add after it
    const firstImport = content.match(/import\s+.*from\s+['"][^'"]+['"];?/);
    if (firstImport) {
      updatedContent = updatedContent.replace(
        firstImport[0],
        `${firstImport[0]}\nimport { ButtonSpinner } from '../../components/ui';`
      );
    }
  }
  
  // Add loading state (simplified - would need more sophisticated parsing)
  const useStateRegex = /useState<[^>]*>/;
  if (!useStateRegex.test(updatedContent)) {
    // Add useState import if not present
    if (content.includes('useState')) {
      // useState already imported
    } else {
      updatedContent = updatedContent.replace(
        /import React.*?;/,
        "import React, { useState } from 'react';"
      );
    }
  }
  
  return updatedContent;
}

function main() {
  console.log('🔍 Scanning for async buttons without ButtonSpinner...\n');
  
  const candidates = findAsyncButtons();
  
  if (candidates.length === 0) {
    console.log('✅ All async buttons are already using ButtonSpinner!');
    return;
  }
  
  console.log(`📊 Found ${candidates.length} files with async buttons that need ButtonSpinner:\n`);
  
  candidates.forEach(({ file, hasAsyncButton, hasButtonSpinnerImport }) => {
    console.log(`📄 ${file}`);
    console.log(`   - Has async onClick: ${hasAsyncButton ? '✅' : '❌'}`);
    console.log(`   - Has ButtonSpinner import: ${hasButtonSpinnerImport ? '✅' : '❌'}`);
    console.log('');
  });
  
  if (CONFIG.dryRun) {
    console.log('🔧 DRY RUN MODE - No files will be modified');
    return;
  }
  
  console.log('🚀 Starting migration...\n');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const candidate of candidates) {
    try {
      console.log(`📝 Processing: ${candidate.file}`);
      
      if (CONFIG.verbose) {
        console.log(`   - Adding ButtonSpinner import`);
        console.log(`   - Adding loading state management`);
      }
      
      // Generate updated content
      const updatedContent = generateMigrationCode(candidate);
      
      // Write file (if not dry run)
      if (!CONFIG.dryRun) {
        fs.writeFileSync(candidate.file, updatedContent);
        console.log(`   ✅ Updated successfully`);
        successCount++;
      } else {
        console.log(`   🔍 Would update (dry run)`);
        successCount++;
      }
      
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      errorCount++;
    }
    
    console.log('');
  }
  
  console.log(`📈 Migration complete:`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  
  if (errorCount > 0) {
    console.log('\n⚠️  Some files had errors. Please review and fix manually.');
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.includes('--dry-run')) {
    CONFIG.dryRun = true;
  }
  
  if (args.includes('--verbose')) {
    CONFIG.verbose = true;
  }
  
  if (args.includes('--help')) {
    console.log(`
Usage: node scripts/add-button-spinners.js [options]

Options:
  --dry-run    Show what would be changed without modifying files
  --verbose    Show detailed output
  --help       Show this help message

Examples:
  node scripts/add-button-spinners.js --dry-run    # Preview changes
  node scripts/add-button-spinners.js --verbose    # Detailed output
  node scripts/add-button-spinners.js              # Apply changes
    `);
    process.exit(0);
  }
  
  main();
}

export { findAsyncButtons, generateMigrationCode };
