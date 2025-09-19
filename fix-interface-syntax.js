#!/usr/bin/env node

import fs from 'fs';

console.log('🔧 Fixing interface and type definition syntax errors...');

const files = [
  'src/utils/securityAnalytics.ts',
  'src/utils/analytics.ts',
  'src/utils/credentialManager.ts',
  'src/utils/errorDiagnosis.ts'
];

function fixInterfaceSyntax(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return false;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Fix extra commas in interface properties
    content = content.replace(/(\w+\??:\s*[^;,\n]+);,/g, '$1;');
    content = content.replace(/(\w+\??:\s*[^;,\n]+),;/g, '$1;');
    
    // Fix extra semicolons after interface closing braces
    content = content.replace(/};\s*export interface/g, '}\n\nexport interface');
    content = content.replace(/};\s*export type/g, '}\n\nexport type');
    content = content.replace(/};\s*export class/g, '}\n\nexport class');
    
    // Fix malformed property definitions
    content = content.replace(/(\w+):\s*([^;,\n]+);,(\s*\w+)/g, '$1: $2;$3');
    content = content.replace(/(\w+):\s*([^;,\n]+),;(\s*\w+)/g, '$1: $2;$3');
    
    // Remove duplicate semicolons and commas
    content = content.replace(/;;+/g, ';');
    content = content.replace(/,,+/g, ',');
    
    // Fix array type definitions
    content = content.replace(/(\w+\[\]);,/g, '$1[];');
    content = content.replace(/(\w+\[\]),;/g, '$1[];');
    
    // Fix Record type definitions
    content = content.replace(/(Record<[^>]+>);,/g, '$1;');
    content = content.replace(/(Record<[^>]+>),;/g, '$1;');

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed interface syntax in: ${filePath}`);
      return true;
    } else {
      console.log(`ℹ️  No interface syntax issues in: ${filePath}`);
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
  
  for (const file of files) {
    console.log(`🔍 Processing: ${file}`);
    if (fixInterfaceSyntax(file)) {
      totalFixed++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Files processed: ${files.length}`);
  console.log(`   Files fixed: ${totalFixed}`);
  
  if (totalFixed > 0) {
    console.log(`\n🎉 Fixed interface syntax errors in ${totalFixed} files!`);
  }
}

main().catch(console.error);