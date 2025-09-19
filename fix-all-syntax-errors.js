#!/usr/bin/env node

/**
 * Comprehensive syntax error fix for the entire codebase
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Comprehensive syntax error fix...\n');

function getAllSourceFiles(dir) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (!item.includes('test') && !item.includes('node_modules')) {
          traverse(fullPath);
        }
      } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
        if (!item.includes('.test.') && !item.includes('.spec.')) {
          files.push(fullPath);
        }
      }
    }
  }
  
  traverse(dir);
  return files;
}

function fixSyntaxErrors(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    let fixed = false;
    
    // Fix 1: Remove duplicate imports
    content = content.replace(/import\s+[^;]+;\s*import\s+[^;]+;\s*import\s+([^;]+;)/g, 'import $1');
    
    // Fix 2: Fix malformed imports with numbers
    content = content.replace(/import\s*\{\s*([^}]*)\s+\d+([^}]*)\s*\}/g, 'import { $1$2 }');
    
    // Fix 3: Fix orphaned CSS rules after styled components
    content = content.replace(/(`;\s*\n\s*\n\s*)([a-z-]+\s*:\s*[^;]+;[^`]*?)(\n\s*const\s+)/g, 
      (match, closing, cssRules, nextConst) => {
        if (cssRules.includes(':') && !cssRules.includes('const')) {
          return closing + `\nconst StyledElement = styled.div\`\n  ${cssRules}\n\`;\n${nextConst}`;
        }
        return match;
      });
    
    // Fix 4: Fix orphaned CSS at end of file
    content = content.replace(/(`;\s*\n\s*\n\s*)([a-z-][^`]*?)(\s*$)/g, 
      (match, closing, cssRules, end) => {
        if (cssRules.includes(':') && !cssRules.includes('const') && !cssRules.includes('function')) {
          return closing + `\nconst StyledElement = styled.div\`\n${cssRules}\n\`;\n${end}`;
        }
        return match;
      });
    
    // Fix 5: Fix malformed catch blocks
    content = content.replace(/(\s+)\} catch \(([^)]+)\) \{/g, '$1} catch ($2) {');
    
    // Fix 6: Remove orphaned closing braces/parentheses
    content = content.replace(/^\s*\}\s*\)\s*;\s*$/gm, '');
    
    // Fix 7: Fix template literal issues
    content = content.replace(/\$\{(\d+)([a-zA-Z])/g, '${$1 + "$2"}');
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      fixed = true;
    }
    
    return fixed;
  } catch (error) {
    console.log(`❌ Error processing ${filePath}: ${error.message}`);
    return false;
  }
}

// Get all source files
const srcDir = path.join(__dirname, 'src');
const files = getAllSourceFiles(srcDir);

let fixedCount = 0;

console.log('🔍 Processing files...\n');

// Process each file
for (const file of files) {
  const relativePath = path.relative(__dirname, file);
  
  if (fixSyntaxErrors(file)) {
    console.log(`✅ Fixed: ${relativePath}`);
    fixedCount++;
  }
}

console.log(`\n📊 Summary: Fixed ${fixedCount} files`);

// Apply specific manual fixes for known problematic files
const manualFixes = [
  {
    file: 'src/components/Spinner.tsx',
    fix: (content) => {
      // Fix template literal issues
      return content.replace(/(\d+)px/g, '"$1px"')
                   .replace(/(\d+)rem/g, '"$1rem"')
                   .replace(/(\d+)em/g, '"$1em"');
    }
  },
  {
    file: 'src/components/OAuthUtilities.tsx',
    fix: (content) => {
      // Fix numeric literal issues
      return content.replace(/(\d+)([a-zA-Z_$])/g, '$1 + "$2"');
    }
  }
];

for (const { file, fix } of manualFixes) {
  const fullPath = path.join(__dirname, file);
  
  if (fs.existsSync(fullPath)) {
    try {
      let content = fs.readFileSync(fullPath, 'utf8');
      const fixedContent = fix(content);
      
      if (fixedContent !== content) {
        fs.writeFileSync(fullPath, fixedContent, 'utf8');
        console.log(`✅ Applied manual fix: ${file}`);
        fixedCount++;
      }
    } catch (error) {
      console.log(`❌ Failed manual fix for ${file}: ${error.message}`);
    }
  }
}

console.log(`\n🎉 Total fixes applied: ${fixedCount}`);
console.log('\n🔍 Testing build...');

// Test the build
import { spawn } from 'child_process';

const buildProcess = spawn('npm', ['run', 'build'], { stdio: 'pipe' });

let buildOutput = '';

buildProcess.stdout.on('data', (data) => {
  buildOutput += data.toString();
});

buildProcess.stderr.on('data', (data) => {
  buildOutput += data.toString();
});

buildProcess.on('close', (code) => {
  if (code === 0) {
    console.log('✅ BUILD SUCCESSFUL! All syntax errors have been fixed.');
  } else {
    console.log('❌ Build still failing. Remaining errors:');
    console.log(buildOutput);
    
    // Extract specific error information
    const errorMatch = buildOutput.match(/ERROR: (.+)/);
    if (errorMatch) {
      console.log(`\n🎯 Next error to fix: ${errorMatch[1]}`);
    }
  }
});