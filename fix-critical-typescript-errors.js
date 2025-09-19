#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

console.log('🔧 Fixing critical TypeScript syntax errors...');

// List of files with critical syntax errors that need fixing
const criticalFiles = [
  'src/api/pingone.ts',
  'src/utils/userBehaviorTracking.ts',
  'src/utils/validation.ts',
  'src/utils/credentialManager.ts',
  'src/utils/securityAnalytics.ts'
];

// Common syntax fixes
const syntaxFixes = [
  // Fix missing closing braces and parentheses
  {
    pattern: /(\s+)(method:\s*'[^']+',?\s*body:\s*JSON\.stringify\([^)]+\))\s*$/gm,
    replacement: '$1$2\n$1});'
  },
  // Fix missing closing braces in object literals
  {
    pattern: /(\s+)(\w+:\s*[^,\n}]+)\s*$/gm,
    replacement: (match, indent, content) => {
      if (!content.includes('}') && !content.includes(');')) {
        return `${indent}${content}`;
      }
      return match;
    }
  },
  // Fix missing type annotations for function parameters
  {
    pattern: /async\s+(\w+)\(([^)]+)\)\s*{/g,
    replacement: (match, funcName, params) => {
      // Add basic type annotations if missing
      const typedParams = params.split(',').map(param => {
        const trimmed = param.trim();
        if (!trimmed.includes(':') && trimmed.length > 0) {
          return `${trimmed}: any`;
        }
        return trimmed;
      }).join(', ');
      return `async ${funcName}(${typedParams}) {`;
    }
  }
];

// Function to apply fixes to a file
function fixFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return false;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Apply syntax fixes
    syntaxFixes.forEach(fix => {
      const originalContent = content;
      if (typeof fix.replacement === 'function') {
        content = content.replace(fix.pattern, fix.replacement);
      } else {
        content = content.replace(fix.pattern, fix.replacement);
      }
      if (content !== originalContent) {
        modified = true;
      }
    });

    // Specific fixes for common patterns
    
    // Fix missing closing braces in method calls
    content = content.replace(
      /(return this\.request\([^)]+\),\s*{\s*method:\s*'[^']+',?\s*body:\s*JSON\.stringify\([^)]+\))\s*$/gm,
      '$1\n    });'
    );

    // Fix missing closing braces in addEventListener calls
    content = content.replace(
      /(document\.addEventListener\('[^']+',\s*\([^)]*\)\s*=>\s*{[^}]*})\s*$/gm,
      '$1);'
    );

    // Fix missing closing braces in object literals within function calls
    content = content.replace(
      /(analyticsManager\.\w+\([^,]+,\s*{[^}]*[^}])\s*$/gm,
      '$1\n    });'
    );

    if (modified || content !== fs.readFileSync(filePath, 'utf8')) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed syntax errors in: ${filePath}`);
      return true;
    } else {
      console.log(`ℹ️  No changes needed in: ${filePath}`);
      return false;
    }

  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

// Main execution
async function main() {
  let totalFixed = 0;
  
  for (const file of criticalFiles) {
    console.log(`\n🔍 Processing: ${file}`);
    if (fixFile(file)) {
      totalFixed++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Files processed: ${criticalFiles.length}`);
  console.log(`   Files modified: ${totalFixed}`);
  
  if (totalFixed > 0) {
    console.log(`\n🎉 Fixed critical syntax errors in ${totalFixed} files!`);
    console.log(`\n🔄 Run 'npx tsc --noEmit' to check remaining TypeScript errors.`);
  } else {
    console.log(`\nℹ️  No critical syntax errors found to fix.`);
  }
}

main().catch(console.error);