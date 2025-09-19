#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// Component files to fix based on highest error counts
const filesToFix = [
  'src/components/EnhancedStepFlowV2.tsx',
  'src/components/CredentialStatusPanel.tsx',
  'src/components/PingOneErrorDisplay.tsx',
  'src/components/OAuthErrorHelper.tsx',
  'src/components/OAuthFlowErrorBoundary.tsx',
  'src/components/JWTGenerator.tsx',
  'src/components/UserFriendlyError.tsx',
  'src/components/ErrorBoundary.tsx',
  'src/components/TokenSharing.tsx'
];

function fixComponentSyntaxErrors(content) {
  let fixed = content;
  
  // Fix missing styled-components import
  if (fixed.includes('styled.') && !fixed.includes('import styled')) {
    fixed = fixed.replace(
      /(import React[^;]*;)/,
      '$1\nimport styled from \'styled-components\';'
    );
  }
  
  // Fix missing React import when JSX is used
  if (fixed.includes('<') && fixed.includes('>') && !fixed.includes('import React')) {
    fixed = fixed.replace(
      /(\/\* eslint-disable \*\/\s*)/,
      '$1import React from \'react\';\n'
    );
  }
  
  // Fix missing closing braces in object literals (common in setState calls)
  fixed = fixed.replace(
    /(\w+)\(\s*{\s*([^}]*)\s*\n\s*(\w+)/gm,
    (match, funcName, objContent, nextLine) => {
      if (!objContent.includes('}') && !match.includes('});')) {
        return `${funcName}({\n    ${objContent.trim()}\n  });\n\n  ${nextLine}`;
      }
      return match;
    }
  );
  
  // Fix incomplete logger calls
  fixed = fixed.replace(
    /logger\.(info|success|error|warn)\([^}]*{\s*([^}]*)\s*\n\s*([^}])/gm,
    (match, level, params, nextChar) => {
      if (!match.includes('});')) {
        const beforeNext = match.replace(/\n\s*[^}].*$/, '');
        return beforeNext + '\n  });\n\n  ' + nextChar;
      }
      return match;
    }
  );
  
  // Fix floating CSS that should be in styled components
  fixed = fixed.replace(
    /`;\s*\n\s*\/\/ ([^`]*)\s*\n\s*([a-z-]+):\s*([^;]+);/gm,
    '`;\n\n// $1\nconst StyledComponent = styled.div`\n  $2: $3;'
  );
  
  return fixed;
}

function processFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return false;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const fixedContent = fixComponentSyntaxErrors(content);
    
    if (content !== fixedContent) {
      fs.writeFileSync(filePath, fixedContent);
      console.log(`✅ Fixed syntax errors in: ${filePath}`);
      return true;
    } else {
      console.log(`ℹ️  No changes needed in: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

console.log('🔧 Starting component files syntax error fixes...\n');

let fixedCount = 0;
for (const file of filesToFix) {
  if (processFile(file)) {
    fixedCount++;
  }
}

console.log(`\n✨ Completed! Fixed ${fixedCount} files.`);