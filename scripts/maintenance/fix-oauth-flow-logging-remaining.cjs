#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../src/pages/flows/v9/OAuthAuthorizationCodeFlowV9.tsx');

console.log('🔧 Fixing remaining OAuthAuthorizationCodeFlowV9 logging...');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Count initial console statements
const initialCount = (content.match(/console\./g) || []).length;
console.log(`📊 Initial console statements: ${initialCount}`);

// Define replacements for remaining patterns
const replacements = [
  // AuthorizationCodeFlowV5 patterns
  {
    pattern: /console\.log\('🔍 \[AuthorizationCodeFlowV5\] (.+?)',?\s*\{([^}]+)\}\);?/g,
    replacement: 'logger.info(\'OAuthAuthorizationCodeFlowV9\', \'$1\', {$2});'
  },
  {
    pattern: /console\.log\('🚀 \[AuthorizationCodeFlowV5\] (.+?)',?\s*\{([^}]+)\}\);?/g,
    replacement: 'logger.info(\'OAuthAuthorizationCodeFlowV9\', \'$1\', {$2});'
  },
  {
    pattern: /console\.log\('🎉 \[AuthorizationCodeFlowV5\] (.+?)',?\s*\{([^}]+)\}\);?/g,
    replacement: 'logger.info(\'OAuthAuthorizationCodeFlowV9\', \'$1\', {$2});'
  },
  {
    pattern: /console\.error\('🚨 \[AuthorizationCodeFlowV5\] (.+?)',?\s*(.+?)\);?/g,
    replacement: 'logger.error(\'OAuthAuthorizationCodeFlowV9\', \'$1\', $2);'
  },
  
  // Multi-line console.log patterns
  {
    pattern: /console\.log\(\s*'([^']+)'\s*,\s*\{([^}]+)\}\s*\);?/g,
    replacement: 'logger.info(\'OAuthAuthorizationCodeFlowV9\', \'$1\', {$2});'
  },
  
  // Generic remaining patterns
  {
    pattern: /console\.log\(\s*'([^']+)'\s*\);?/g,
    replacement: 'logger.info(\'OAuthAuthorizationCodeFlowV9\', \'$1\');'
  },
  {
    pattern: /console\.warn\(\s*'([^']+)'\s*,\s*(.+?)\s*\);?/g,
    replacement: 'logger.warn(\'OAuthAuthorizationCodeFlowV9\', \'$1\', $2);'
  },
  {
    pattern: /console\.error\(\s*'([^']+)'\s*,\s*(.+?)\s*\);?/g,
    replacement: 'logger.error(\'OAuthAuthorizationCodeFlowV9\', \'$1\', $2);'
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

console.log('✅ OAuthAuthorizationCodeFlowV9 remaining logging fix completed!');
console.log(`📈 Progress: ${initialCount} → ${finalCount} (${((initialCount - finalCount) / initialCount * 100).toFixed(1)}% reduction)`);

if (finalCount > 0) {
  console.log('\n⚠️  Remaining console statements:');
  const lines = content.split('\n');
  lines.forEach((line, index) => {
    if (line.includes('console.')) {
      console.log(`  Line ${index + 1}: ${line.trim()}`);
    }
  });
}
