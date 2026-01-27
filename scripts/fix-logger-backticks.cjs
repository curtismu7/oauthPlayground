#!/usr/bin/env node

/**
 * Script to fix logger statements missing opening backticks
 * 
 * Fixes patterns like:
 *   logger.debug(Some message`, ...)
 * To:
 *   logger.debug(`Some message`, ...)
 */

const fs = require('fs');

function fixLoggerBackticks(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let fixCount = 0;
  
  // Fix logger.debug/info/warn/error statements missing opening backtick
  // Pattern: logger.METHOD(TEXT` where TEXT doesn't start with backtick
  const pattern = /(logger\.(debug|info|warn|error|success)\()([^`][^`]*?`)/g;
  
  content = content.replace(pattern, (match, prefix, method, text) => {
    fixCount++;
    return `${prefix}\`${text}`;
  });
  
  fs.writeFileSync(filePath, content, 'utf-8');
  
  console.log(`Fixed ${fixCount} logger statements in ${filePath}`);
  return fixCount;
}

// Main execution
const filePath = process.argv[2];

if (!filePath) {
  console.error('Usage: node scripts/fix-logger-backticks.cjs <file-path>');
  process.exit(1);
}

if (!fs.existsSync(filePath)) {
  console.error(`Error: File not found: ${filePath}`);
  process.exit(1);
}

const fixCount = fixLoggerBackticks(filePath);
process.exit(fixCount > 0 ? 0 : 1);
