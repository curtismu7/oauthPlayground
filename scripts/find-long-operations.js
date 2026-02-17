#!/usr/bin/env node

/**
 * @file find-long-operations.js
 * @description Script to identify long-running operations that need modal spinners
 * @version 1.0.0
 */

import fs from 'fs';
import path from 'path';

// Patterns that indicate potentially long-running operations
const LONG_OPERATION_PATTERNS = [
  // API calls and network operations
  /fetch\s*\(/g,
  /axios\./g,
  /\.get\s*\(/g,
  /\.post\s*\(/g,
  /\.put\s*\(/g,
  /\.delete\s*\(/g,
  
  // Authentication flows
  /authenticate/g,
  /login/g,
  /authorize/g,
  /token.*exchange/g,
  /worker.*token/g,
  
  // MFA operations
  /mfa/gi,
  /device.*registration/g,
  /totp/gi,
  /fido/gi,
  /biometric/gi,
  
  // Data processing
  /process.*data/g,
  /parse.*data/g,
  /transform.*data/g,
  /validate.*data/g,
  
  // File operations
  /readFile/g,
  /writeFile/g,
  /upload/g,
  /download/g,
  
  // Time-consuming operations
  /timeout/g,
  /delay/g,
  /wait/g,
  /sleep/g,
  
  // Batch operations
  /batch/g,
  /bulk/g,
  /multiple/g,
  /all.*items/g
];

// Patterns that indicate quick operations (button spinner sufficient)
const QUICK_OPERATION_PATTERNS = [
  /copy.*clipboard/g,
  /copy.*text/g,
  /toggle/g,
  /switch/g,
  /show.*hide/g,
  /expand.*collapse/g,
  /set.*state/g,
  /clear/g,
  /reset/g
];

function findFiles(dir) {
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

function analyzeOperations(file) {
  try {
    const content = fs.readFileSync(file, 'utf8');
    
    // Skip certain files
    if (file.includes('test') || file.includes('spec') || file.includes('lockdown') || file.includes('backup')) {
      return null;
    }
    
    const longOps = [];
    const quickOps = [];
    const asyncOps = [];
    
    // Find async operations
    const asyncMatches = content.match(/onClick.*async|async.*onClick/g) || [];
    asyncOps.push(...asyncMatches);
    
    // Find long operation patterns
    LONG_OPERATION_PATTERNS.forEach(pattern => {
      const matches = content.match(pattern) || [];
      if (matches.length > 0) {
        longOps.push({
          pattern: pattern.source,
          count: matches.length,
          examples: matches.slice(0, 3) // Show first 3 examples
        });
      }
    });
    
    // Find quick operation patterns
    QUICK_OPERATION_PATTERNS.forEach(pattern => {
      const matches = content.match(pattern) || [];
      if (matches.length > 0) {
        quickOps.push({
          pattern: pattern.source,
          count: matches.length,
          examples: matches.slice(0, 3)
        });
      }
    });
    
    // Determine spinner type recommendation
    const hasLongOps = longOps.length > 0;
    const hasAsyncOps = asyncOps.length > 0;
    const hasQuickOps = quickOps.length > 0;
    
    let recommendation = 'none';
    let reason = '';
    
    if (hasLongOps && hasAsyncOps) {
      recommendation = 'modal';
      reason = 'Contains long-running operations with async handlers';
    } else if (hasAsyncOps && !hasQuickOps) {
      recommendation = 'modal';
      reason = 'Contains async operations (potentially long-running)';
    } else if (hasQuickOps && hasAsyncOps) {
      recommendation = 'button';
      reason = 'Contains quick operations with async handlers';
    } else if (hasAsyncOps) {
      recommendation = 'button';
      reason = 'Contains async operations (likely quick)';
    }
    
    return {
      file: file.replace('./src/', ''),
      asyncOps: asyncOps.length,
      longOps,
      quickOps,
      recommendation,
      reason
    };
    
  } catch (error) {
    console.error(`Error analyzing ${file}:`, error.message);
    return null;
  }
}

function main() {
  console.log('🔍 Analyzing long-running operations that need spinners...\n');
  
  const srcDir = './src';
  const files = findFiles(srcDir);
  const results = [];
  
  for (const file of files) {
    const analysis = analyzeOperations(file);
    if (analysis && (analysis.asyncOps > 0 || analysis.longOps.length > 0)) {
      results.push(analysis);
    }
  }
  
  if (results.length === 0) {
    console.log('✅ No async operations found that need spinners!');
    return;
  }
  
  // Sort by recommendation priority
  const modalOps = results.filter(r => r.recommendation === 'modal');
  const buttonOps = results.filter(r => r.recommendation === 'button');
  const noneOps = results.filter(r => r.recommendation === 'none');
  
  console.log(`📊 Analysis Results (${results.length} files with operations):\n`);
  
  // Modal spinner recommendations (high priority)
  if (modalOps.length > 0) {
    console.log('🔴 MODAL SPINNER RECOMMENDATIONS (Long-running operations):');
    console.log('=' .repeat(80));
    
    modalOps.forEach(({ file, asyncOps, longOps, quickOps, reason }) => {
      console.log(`\n📄 ${file}`);
      console.log(`   🔄 Async operations: ${asyncOps}`);
      console.log(`   ⏱️  Long operations: ${longOps.length}`);
      console.log(`   ⚡ Quick operations: ${quickOps.length}`);
      console.log(`   💡 Reason: ${reason}`);
      
      if (longOps.length > 0) {
        console.log(`   🔍 Long operation patterns:`);
        longOps.forEach(op => {
          console.log(`      - ${op.pattern} (${op.count} occurrences)`);
          if (op.examples.length > 0) {
            console.log(`        Examples: ${op.examples.slice(0, 2).join(', ')}`);
          }
        });
      }
    });
  }
  
  // Button spinner recommendations (medium priority)
  if (buttonOps.length > 0) {
    console.log(`\n🟡 BUTTON SPINNER RECOMMENDATIONS (Quick operations):`);
    console.log('=' .repeat(80));
    
    buttonOps.forEach(({ file, asyncOps, quickOps, reason }) => {
      console.log(`\n📄 ${file}`);
      console.log(`   🔄 Async operations: ${asyncOps}`);
      console.log(`   ⚡ Quick operations: ${quickOps.length}`);
      console.log(`   💡 Reason: ${reason}`);
      
      if (quickOps.length > 0) {
        console.log(`   🔍 Quick operation patterns:`);
        quickOps.forEach(op => {
          console.log(`      - ${op.pattern} (${op.count} occurrences)`);
        });
      }
    });
  }
  
  // Summary
  console.log(`\n📈 SUMMARY:`);
  console.log(`   🔴 Modal spinners needed: ${modalOps.length} files`);
  console.log(`   🟡 Button spinners needed: ${buttonOps.length} files`);
  console.log(`   📊 Total files with operations: ${results.length}`);
  
  console.log(`\n💡 RECOMMENDATIONS:`);
  console.log(`   1. Prioritize modal spinners for ${modalOps.length} files with long-running operations`);
  console.log(`   2. Add button spinners for ${buttonOps.length} files with quick operations`);
  console.log(`   3. Use StandardSpinner components for consistent implementation`);
  console.log(`   4. Test loading states don't exceed user attention spans`);
}

main();
