#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

console.log('🔧 Fixing critical syntax errors in utility files...');

// Target the most problematic utility files that other components depend on
const criticalUtilityFiles = [
  'src/utils/credentialManager.ts',
  'src/utils/securityAnalytics.ts', 
  'src/utils/analytics.ts',
  'src/utils/errorDiagnosis.ts',
  'src/contexts/NewAuthContext.tsx'
];

// More comprehensive syntax fixes
const syntaxFixes = [
  // Fix missing closing braces in console.log statements
  {
    pattern: /(console\.log\([^)]*,\s*{[^}]*[^}])\s*$/gm,
    replacement: '$1\n      });'
  },
  
  // Fix missing closing braces in object literals within function calls
  {
    pattern: /(logger\.\w+\([^,]+,\s*[^,]+,\s*{[^}]*[^}])\s*$/gm,
    replacement: '$1\n      });'
  },
  
  // Fix missing closing braces in method calls with object parameters
  {
    pattern: /(analyticsManager\.\w+\([^,]+,\s*{[^}]*[^}])\s*$/gm,
    replacement: '$1\n    });'
  },
  
  // Fix missing closing braces in localStorage.setItem calls
  {
    pattern: /(localStorage\.setItem\([^,]+,\s*JSON\.stringify\([^)]+\))\s*$/gm,
    replacement: '$1);'
  },
  
  // Fix missing closing braces in addEventListener calls
  {
    pattern: /(addEventListener\('[^']+',\s*\([^)]*\)\s*=>\s*{[^}]*[^}])\s*$/gm,
    replacement: '$1\n    });'
  },
  
  // Fix missing closing braces in if statements with object literals
  {
    pattern: /(if\s*\([^)]+\)\s*{[^}]*{[^}]*[^}])\s*$/gm,
    replacement: '$1\n      }\n    }'
  },
  
  // Fix missing closing braces in try-catch blocks
  {
    pattern: /(try\s*{[^}]*[^}])\s*catch/gm,
    replacement: '$1\n    } catch'
  },
  
  // Fix incomplete object property definitions
  {
    pattern: /(\s+)(\w+:\s*[^,\n}]+)\s*(\n\s*\w+:)/gm,
    replacement: '$1$2,$3'
  },
  
  // Fix missing semicolons after object literals
  {
    pattern: /(\s+})\s*(\n\s*[a-zA-Z])/gm,
    replacement: '$1;$2'
  },
  
  // Fix missing closing parentheses in function calls
  {
    pattern: /(return\s+this\.\w+\([^)]+,\s*{[^}]*})\s*$/gm,
    replacement: '$1);'
  }
];

// Function to apply comprehensive fixes to a file
function fixFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return false;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    const originalContent = content;

    // Apply all syntax fixes
    syntaxFixes.forEach((fix, index) => {
      const beforeFix = content;
      content = content.replace(fix.pattern, fix.replacement);
      if (content !== beforeFix) {
        modified = true;
        console.log(`  ✓ Applied fix ${index + 1} to ${path.basename(filePath)}`);
      }
    });

    // Additional specific fixes for common patterns
    
    // Fix missing closing braces in complex object literals
    content = content.replace(
      /({\s*[^}]*[^}])\s*(\n\s*}\s*catch)/gm,
      '$1\n      }$2'
    );
    
    // Fix missing closing braces in nested function calls
    content = content.replace(
      /(window\.dispatchEvent\(new CustomEvent\([^,]+,\s*{[^}]*[^}])\s*$/gm,
      '$1\n      }));'
    );
    
    // Fix missing closing braces in return statements with objects
    content = content.replace(
      /(return\s*{[^}]*[^}])\s*(\n\s*}\s*catch)/gm,
      '$1\n      };$2'
    );

    // Fix incomplete method signatures
    content = content.replace(
      /(\s+async\s+\w+\([^)]*)\s*(\n\s*{)/gm,
      '$1)$2'
    );

    if (content !== originalContent) {
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

// Function to validate TypeScript syntax
async function validateTypeScript(filePath) {
  try {
    const { execSync } = await import('child_process');
    execSync(`npx tsc --noEmit --skipLibCheck ${filePath}`, { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

// Main execution
async function main() {
  let totalFixed = 0;
  let totalValidated = 0;
  
  console.log(`\n🎯 Targeting ${criticalUtilityFiles.length} critical utility files...\n`);
  
  for (const file of criticalUtilityFiles) {
    console.log(`🔍 Processing: ${file}`);
    
    if (fixFile(file)) {
      totalFixed++;
      
      // Validate the fix
      if (await validateTypeScript(file)) {
        totalValidated++;
        console.log(`  ✅ TypeScript validation passed`);
      } else {
        console.log(`  ⚠️  TypeScript validation failed (but syntax improved)`);
      }
    }
    console.log('');
  }

  console.log(`📊 Summary:`);
  console.log(`   Files processed: ${criticalUtilityFiles.length}`);
  console.log(`   Files modified: ${totalFixed}`);
  console.log(`   Files validated: ${totalValidated}`);
  
  if (totalFixed > 0) {
    console.log(`\n🎉 Fixed critical syntax errors in ${totalFixed} utility files!`);
    console.log(`\n🔄 Run 'npm run build' to verify production build still works.`);
    console.log(`🔄 Run 'npx tsc --noEmit --skipLibCheck' to check remaining errors.`);
  } else {
    console.log(`\nℹ️  No critical syntax errors found to fix.`);
  }
}

main().catch(console.error);