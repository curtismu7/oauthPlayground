#!/usr/bin/env node

/**
 * Analyze the files that were skipped in Phase 2 to see if they're actually safe to remove
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Analyzing skipped files from Phase 2...\n');

const skippedFiles = [
  'src/utils/activityTracker.ts',
  'src/utils/callbackUrls.ts', 
  'src/utils/clipboard.ts',
  'src/utils/crypto.ts',
  'src/utils/jwt.ts',
  'src/utils/jwtGenerator.ts',
  'src/utils/logger.ts',
  'src/utils/scrollManager.ts',
  'src/utils/secureJson.ts',
  'src/services/config.ts'
];

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
      } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
        if (!item.includes('.test.') && !item.includes('.spec.')) {
          files.push(fullPath);
        }
      }
    }
  }
  
  traverse(dir);
  return files;
}

function findImportsOfFile(filePath) {
  const srcDir = path.join(__dirname, 'src');
  const files = getAllSourceFiles(srcDir);
  const imports = [];
  
  const relativePath = path.relative(path.join(__dirname, 'src'), filePath);
  const baseName = path.basename(relativePath, path.extname(relativePath));
  
  const importPatterns = [
    relativePath.replace(/\.(ts|tsx)$/, ''),
    './' + relativePath.replace(/\.(ts|tsx)$/, ''),
    '../' + relativePath.replace(/\.(ts|tsx)$/, ''),
    '../../' + relativePath.replace(/\.(ts|tsx)$/, ''),
    '../../../' + relativePath.replace(/\.(ts|tsx)$/, ''),
    baseName
  ];
  
  for (const file of files) {
    if (file === filePath) continue;
    
    try {
      const content = fs.readFileSync(file, 'utf8');
      const relativeFile = path.relative(__dirname, file);
      
      for (const pattern of importPatterns) {
        if (content.includes(`from '${pattern}'`) || 
            content.includes(`from "${pattern}"`) ||
            content.includes(`import('${pattern}')`) ||
            content.includes(`import("${pattern}")`)) {
          
          // Extract the actual import line
          const lines = content.split('\n');
          const importLine = lines.find(line => 
            line.includes(`from '${pattern}'`) || 
            line.includes(`from "${pattern}"`) ||
            line.includes(`import('${pattern}')`) ||
            line.includes(`import("${pattern}")`)
          );
          
          imports.push({
            file: relativeFile,
            importLine: importLine?.trim() || 'Unknown import'
          });
          break;
        }
      }
    } catch {
      // Skip files that can't be read
    }
  }
  
  return imports;
}

// Analyze each skipped file
for (const file of skippedFiles) {
  const fullPath = path.join(__dirname, file);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${file}`);
    continue;
  }
  
  console.log(`\n📁 ${file}:`);
  
  const imports = findImportsOfFile(fullPath);
  
  if (imports.length === 0) {
    console.log(`   ✅ Actually no imports found - safe to remove!`);
  } else {
    console.log(`   📍 Found ${imports.length} import(s):`);
    imports.forEach(({ file, importLine }) => {
      console.log(`      • ${file}: ${importLine}`);
    });
  }
}

console.log('\n🎯 Recommendation: Create Phase 2.5 to remove files with no actual imports');