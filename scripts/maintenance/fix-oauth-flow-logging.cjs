#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../src/pages/flows/v9/OAuthAuthorizationCodeFlowV9.tsx');

console.log('🔧 Fixing OAuthAuthorizationCodeFlowV9 logging...');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Count initial console statements
const initialCount = (content.match(/console\./g) || []).length;
console.log(`📊 Initial console statements: ${initialCount}`);

// Define replacements for common patterns
const replacements = [
  // Debug and info logs
  {
    pattern: /console\.log\('🔗 \[V7\.2\] (.+?)'\);?/g,
    replacement: 'logger.info(\'OAuthAuthorizationCodeFlowV9\', \'$1\');'
  },
  {
    pattern: /console\.log\('🔄 \[V7\.2\] (.+?)'\);?/g,
    replacement: 'logger.info(\'OAuthAuthorizationCodeFlowV9\', \'$1\');'
  },
  {
    pattern: /console\.log\('✅ \[V7\.2\] (.+?)'\);?/g,
    replacement: 'logger.info(\'OAuthAuthorizationCodeFlowV9\', \'$1\');'
  },
  {
    pattern: /console\.log\('⚠️ \[V7\.2\] (.+?)'\);?/g,
    replacement: 'logger.warn(\'OAuthAuthorizationCodeFlowV9\', \'$1\');'
  },
  {
    pattern: /console\.log\('❌ \[V7\.2\] (.+?)'\);?/g,
    replacement: 'logger.error(\'OAuthAuthorizationCodeFlowV9\', \'$1\');'
  },
  
  // Generic console.log patterns
  {
    pattern: /console\.log\('([^']+?)'\);?/g,
    replacement: 'logger.info(\'OAuthAuthorizationCodeFlowV9\', \'$1\');'
  },
  
  // Console.error patterns
  {
    pattern: /console\.error\('([^']+?)',?\s*(.+?)\);?/g,
    replacement: 'logger.error(\'OAuthAuthorizationCodeFlowV9\', \'$1\', $2);'
  },
  
  // Console.warn patterns  
  {
    pattern: /console\.warn\('([^']+?)',?\s*(.+?)\);?/g,
    replacement: 'logger.warn(\'OAuthAuthorizationCodeFlowV9\', \'$1\', $2);'
  },
  
  // Console.log with data
  {
    pattern: /console\.log\('([^']+?)',?\s*(.+?)\);?/g,
    replacement: 'logger.info(\'OAuthAuthorizationCodeFlowV9\', \'$1\', $2);'
  }
];

// Apply replacements
let replacedCount = 0;
replacements.forEach(({ pattern, replacement }) => {
  const before = content;
  content = content.replace(pattern, replacement);
  const after = content;
  const count = (before.match(pattern) || []).length;
  if (count > 0) {
    console.log(`  ✅ Applied pattern: ${pattern.toString().substring(0, 50)}... (${count} replacements)`);
    replacedCount += count;
  }
});

// Count final console statements
const finalCount = (content.match(/console\./g) || []).length;
console.log(`📊 Final console statements: ${finalCount}`);
console.log(`🎯 Replaced ${replacedCount} statements`);

// Write the file back
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ OAuthAuthorizationCodeFlowV9 logging fix completed!');
console.log(`📈 Progress: ${initialCount} → ${finalCount} (${((initialCount - finalCount) / initialCount * 100).toFixed(1)}% reduction)`);
