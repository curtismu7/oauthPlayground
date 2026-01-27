#!/usr/bin/env node

/**
 * Script to help migrate error handling to use UnifiedFlowErrorHandler
 * 
 * This script identifies error handling patterns that need migration:
 * 1. try-catch blocks with logger.error
 * 2. catch blocks that throw new Error
 * 3. catch blocks with toast notifications
 * 
 * Usage: node scripts/migrate-error-handlers.cjs <file-path>
 */

const fs = require('fs');
const path = require('path');

function analyzeErrorHandling(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  const patterns = {
    tryCatchBlocks: [],
    loggerErrors: [],
    throwErrors: [],
    toastErrors: [],
  };
  
  let inTryBlock = false;
  let inCatchBlock = false;
  let tryStartLine = 0;
  let catchStartLine = 0;
  let braceDepth = 0;
  let catchBraceDepth = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    
    // Track try blocks
    if (line.match(/\btry\s*\{/)) {
      inTryBlock = true;
      tryStartLine = lineNum;
      braceDepth = 1;
    }
    
    // Track catch blocks
    if (line.match(/\bcatch\s*\(/)) {
      inCatchBlock = true;
      catchStartLine = lineNum;
      catchBraceDepth = 0;
      patterns.tryCatchBlocks.push({
        tryLine: tryStartLine,
        catchLine: lineNum,
      });
    }
    
    if (inCatchBlock) {
      // Count braces in catch block
      const openBraces = (line.match(/\{/g) || []).length;
      const closeBraces = (line.match(/\}/g) || []).length;
      catchBraceDepth += openBraces - closeBraces;
      
      // Check for logger.error
      if (line.match(/logger\.error\(/)) {
        patterns.loggerErrors.push({
          line: lineNum,
          catchBlock: catchStartLine,
          content: line.trim(),
        });
      }
      
      // Check for throw new Error
      if (line.match(/throw new Error\(/)) {
        patterns.throwErrors.push({
          line: lineNum,
          catchBlock: catchStartLine,
          content: line.trim(),
        });
      }
      
      // Check for toast
      if (line.match(/toast.*\.error\(/)) {
        patterns.toastErrors.push({
          line: lineNum,
          catchBlock: catchStartLine,
          content: line.trim(),
        });
      }
      
      // End of catch block
      if (catchBraceDepth === 0 && line.includes('}')) {
        inCatchBlock = false;
      }
    }
  }
  
  return patterns;
}

function generateReport(filePath, patterns) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Error Handling Analysis: ${path.basename(filePath)}`);
  console.log('='.repeat(80));
  
  console.log(`\n📊 Summary:`);
  console.log(`  - Try-catch blocks: ${patterns.tryCatchBlocks.length}`);
  console.log(`  - logger.error calls: ${patterns.loggerErrors.length}`);
  console.log(`  - throw new Error: ${patterns.throwErrors.length}`);
  console.log(`  - toast.error calls: ${patterns.toastErrors.length}`);
  
  if (patterns.tryCatchBlocks.length > 0) {
    console.log(`\n🔍 Try-Catch Blocks:`);
    patterns.tryCatchBlocks.forEach((block, idx) => {
      console.log(`  ${idx + 1}. Try: line ${block.tryLine}, Catch: line ${block.catchLine}`);
    });
  }
  
  if (patterns.loggerErrors.length > 0) {
    console.log(`\n📝 Logger.error Calls (should use UnifiedFlowErrorHandler):`);
    patterns.loggerErrors.forEach((item, idx) => {
      console.log(`  ${idx + 1}. Line ${item.line} (in catch at ${item.catchBlock})`);
      console.log(`     ${item.content}`);
    });
  }
  
  if (patterns.throwErrors.length > 0) {
    console.log(`\n⚠️  Throw Errors (should use UnifiedFlowErrorHandler):`);
    patterns.throwErrors.forEach((item, idx) => {
      console.log(`  ${idx + 1}. Line ${item.line} (in catch at ${item.catchBlock})`);
      console.log(`     ${item.content}`);
    });
  }
  
  console.log(`\n${'='.repeat(80)}\n`);
}

// Main execution
const filePath = process.argv[2];

if (!filePath) {
  console.error('Usage: node scripts/migrate-error-handlers.cjs <file-path>');
  process.exit(1);
}

if (!fs.existsSync(filePath)) {
  console.error(`Error: File not found: ${filePath}`);
  process.exit(1);
}

const patterns = analyzeErrorHandling(filePath);
generateReport(filePath, patterns);

// Exit with code indicating if migration is needed
process.exit(patterns.tryCatchBlocks.length > 0 ? 0 : 1);
