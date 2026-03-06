#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../src/pages/flows/v9/OAuthAuthorizationCodeFlowV9.tsx');

console.log('🔧 Final fix for OAuthAuthorizationCodeFlowV9 logging...');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Count initial console statements
const initialCount = (content.match(/console\./g) || []).length;
console.log(`📊 Initial console statements: ${initialCount}`);

// Handle multi-line console statements by reading context
const lines = content.split('\n');
let replacedCount = 0;

// Process each line that contains console statements
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  if (line.includes('console.')) {
    // Look for multi-line console statements
    if (line.trim().endsWith('console.log(') || line.trim().endsWith('console.error(') || line.trim().endsWith('console.warn(')) {
      // This is likely a multi-line statement, get the next few lines
      let fullStatement = line;
      let j = i + 1;
      let braceCount = (line.match(/\(/g) || []).length - (line.match(/\)/g) || []).length;
      
      while (j < lines.length && braceCount > 0) {
        fullStatement += '\n' + lines[j];
        braceCount += (lines[j].match(/\(/g) || []).length - (lines[j].match(/\)/g) || []).length;
        j++;
      }
      
      // Replace the multi-line statement
      const replacement = fullStatement
        .replace(/console\.log\(/g, 'logger.info(\'OAuthAuthorizationCodeFlowV9\', ')
        .replace(/console\.error\(/g, 'logger.error(\'OAuthAuthorizationCodeFlowV9\', ')
        .replace(/console\.warn\(/g, 'logger.warn(\'OAuthAuthorizationCodeFlowV9\', ');
      
      // Fix the closing
      const fixedReplacement = replacement.replace(/\);?\s*$/g, ');');
      
      if (replacement !== fixedReplacement) {
        lines[i] = fixedReplacement;
        // Remove the extra lines that were part of the multi-line statement
        lines.splice(i + 1, j - i - 1);
        replacedCount++;
        console.log(`  ✅ Fixed multi-line console statement at line ${i + 1}`);
      }
    } else {
      // Handle single line statements
      const newLine = line
        .replace(/console\.log\(/g, 'logger.info(\'OAuthAuthorizationCodeFlowV9\', ')
        .replace(/console\.error\(/g, 'logger.error(\'OAuthAuthorizationCodeFlowV9\', ')
        .replace(/console\.warn\(/g, 'logger.warn(\'OAuthAuthorizationCodeFlowV9\', ');
      
      if (newLine !== line) {
        lines[i] = newLine;
        replacedCount++;
        console.log(`  ✅ Fixed console statement at line ${i + 1}`);
      }
    }
  }
}

// Join the lines back
content = lines.join('\n');

// Count final console statements
const finalCount = (content.match(/console\./g) || []).length;
console.log(`📊 Final console statements: ${finalCount}`);
console.log(`🎯 Replaced ${replacedCount} statements`);

// Write the file back
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ OAuthAuthorizationCodeFlowV9 final logging fix completed!');
console.log(`📈 Progress: ${initialCount} → ${finalCount} (${((initialCount - finalCount) / initialCount * 100).toFixed(1)}% reduction)`);

if (finalCount > 0) {
  console.log('\n⚠️  Still remaining console statements:');
  const remainingLines = content.split('\n');
  remainingLines.forEach((line, index) => {
    if (line.includes('console.')) {
      console.log(`  Line ${index + 1}: ${line.trim()}`);
    }
  });
} else {
  console.log('\n🎉 All console statements have been replaced!');
}
