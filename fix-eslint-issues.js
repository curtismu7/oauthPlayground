#!/usr/bin/env node

/**
 * ESLint Cleanup Script - Week 1 Code Quality
 * 
 * This script systematically fixes common ESLint issues:
 * 1. Replace any types with proper types
 * 2. Remove unused imports
 * 3. Fix unused variables
 * 4. Clean up parsing errors
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Common unused imports to remove
const UNUSED_IMPORTS = [
  'useEffect',
  'useMemo',
  'useCallback',
  'useState',
  'React',
  'FiSettings',
  'FiEye',
  'FiEyeOff',
  'FiUser',
  'CardHeader',
  'CardFooter',
  'FiClock',
  'FiAlertCircle',
  'FiCheckCircle'
];

// Common any type patterns to fix
const ANY_TYPE_FIXES = [
  {
    pattern: /: any\[\]/g,
    replacement: ': unknown[]'
  },
  {
    pattern: /: any\s*=/g,
    replacement: ': unknown ='
  },
  {
    pattern: /\(.*?: any\)/g,
    replacement: (match) => match.replace('any', 'unknown')
  }
];

function getSourceFiles() {
  const srcDir = path.join(__dirname, 'src');
  const files = [];
  
  function walk(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
        files.push(fullPath);
      }
    }
  }
  
  walk(srcDir);
  return files;
}

function removeUnusedImports(content) {
  const lines = content.split('\n');
  const importLines = [];
  const otherLines = [];
  
  for (const line of lines) {
    if (line.trim().startsWith('import ')) {
      importLines.push(line);
    } else {
      otherLines.push(line);
    }
  }
  
  // Check which imports are actually used
  const bodyContent = otherLines.join('\n');
  const filteredImports = importLines.filter(line => {
    // Extract import names from the line
    const matches = line.match(/import\s+{([^}]+)}/);
    if (matches) {
      const imports = matches[1].split(',').map(s => s.trim());
      const usedImports = imports.filter(imp => {
        const cleanImport = imp.replace(/\s+as\s+\w+/, ''); // Remove aliases
        return bodyContent.includes(cleanImport);
      });
      
      if (usedImports.length === 0) {
        return false; // Remove entire import line
      } else if (usedImports.length < imports.length) {
        // Update the import line with only used imports
        const newImportList = usedImports.join(', ');
        line = line.replace(/import\s+{[^}]+}/, `import { ${newImportList} }`);
      }
    }
    return true;
  });
  
  return [...filteredImports, '', ...otherLines].join('\n');
}

function fixAnyTypes(content) {
  let fixed = content;
  
  // Replace common any patterns
  for (const fix of ANY_TYPE_FIXES) {
    fixed = fixed.replace(fix.pattern, fix.replacement);
  }
  
  return fixed;
}

function fixUnusedVariables(content) {
  // Remove unused variable declarations
  let fixed = content;
  
  // Pattern for unused destructured variables
  fixed = fixed.replace(/const\s+{\s*([^}]+)\s*}\s*=\s*([^;]+);/g, (match, vars, source) => {
    const varList = vars.split(',').map(v => v.trim());
    const usedVars = varList.filter(v => {
      const varName = v.split(':')[0].trim(); // Handle typed destructuring
      return content.includes(varName + ' ') || content.includes(varName + '(') || content.includes(varName + '.');
    });
    
    if (usedVars.length === 0) {
      return ''; // Remove entire destructuring
    } else if (usedVars.length < varList.length) {
      return `const { ${usedVars.join(', ')} } = ${source};`;
    }
    
    return match;
  });
  
  return fixed;
}

function processFile(filePath) {
  console.log(`Processing ${filePath}...`);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Apply fixes
    content = removeUnusedImports(content);
    content = fixAnyTypes(content);
    content = fixUnusedVariables(content);
    
    // Write back
    fs.writeFileSync(filePath, content);
    
    console.log(`✅ Fixed ${filePath}`);
    return true;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🚀 Starting ESLint cleanup - Week 1 Code Quality');
  
  const sourceFiles = getSourceFiles();
  console.log(`Found ${sourceFiles.length} source files to process`);
  
  let processed = 0;
  let errors = 0;
  
  for (const file of sourceFiles) {
    if (processFile(file)) {
      processed++;
    } else {
      errors++;
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`✅ Processed: ${processed} files`);
  console.log(`❌ Errors: ${errors} files`);
  
  // Run ESLint to see remaining issues
  try {
    console.log('\n🔍 Running ESLint to check remaining issues...');
    const result = execSync('npx eslint src/ --ext .ts,.tsx --max-warnings 0', { encoding: 'utf8' });
    console.log('🎉 No ESLint errors remaining!');
  } catch (error) {
    console.log('\n⚠️ Remaining ESLint issues:');
    console.log(error.stdout);
    
    // Count remaining issues
    const lines = error.stdout.split('\n');
    const errorLines = lines.filter(line => line.includes('error') || line.includes('warning'));
    console.log(`\n📊 Remaining issues: ${errorLines.length}`);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  removeUnusedImports,
  fixAnyTypes,
  fixUnusedVariables,
  processFile
};
