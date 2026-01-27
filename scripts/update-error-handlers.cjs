#!/usr/bin/env node

/**
 * Script to update error handling patterns to use UnifiedFlowErrorHandler
 * 
 * This script updates common error handling patterns:
 * 1. logger.error + toastV8.error -> UnifiedFlowErrorHandler.handleError
 * 2. logger.warn in catch blocks -> UnifiedFlowErrorHandler.handleError (with showToast: false)
 * 
 * Usage: node scripts/update-error-handlers.cjs <file-path>
 */

const fs = require('fs');

function updateErrorHandlers(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let updateCount = 0;
  
  // Pattern 1: logger.error followed by toastV8.error in catch block
  // This is a common pattern that should use the error handler
  const pattern1 = /(\} catch \([^)]+\) \{[\s\S]*?)logger\.error\([^;]+;[\s\S]*?toastV8\.error\([^;]+;/g;
  
  // Pattern 2: Simple logger.warn in catch blocks (debug/storage errors)
  // Replace: logger.warn(`message`, { context })
  // With: UnifiedFlowErrorHandler.handleError(error, { context }, { showToast: false, logError: true })
  
  // For now, let's just report what we find
  const catches = content.match(/\} catch \([^)]+\) \{[\s\S]{0,500}?\}/g) || [];
  
  console.log(`\nFound ${catches.length} catch blocks in ${filePath}`);
  
  catches.forEach((catchBlock, idx) => {
    console.log(`\n--- Catch Block ${idx + 1} ---`);
    console.log(catchBlock.substring(0, 200) + '...');
    
    if (catchBlock.includes('logger.error') && catchBlock.includes('toastV8.error')) {
      console.log('  ⚠️  Contains logger.error + toastV8.error (should use error handler)');
    } else if (catchBlock.includes('logger.warn')) {
      console.log('  ℹ️  Contains logger.warn (consider using error handler with showToast: false)');
    } else if (catchBlock.includes('logger.error')) {
      console.log('  ⚠️  Contains logger.error (should use error handler)');
    }
  });
  
  return updateCount;
}

// Main execution
const filePath = process.argv[2];

if (!filePath) {
  console.error('Usage: node scripts/update-error-handlers.cjs <file-path>');
  process.exit(1);
}

if (!fs.existsSync(filePath)) {
  console.error(`Error: File not found: ${filePath}`);
  process.exit(1);
}

const updateCount = updateErrorHandlers(filePath);
console.log(`\n\nTotal updates: ${updateCount}`);
process.exit(0);
