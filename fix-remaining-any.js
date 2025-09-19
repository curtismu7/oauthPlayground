#!/usr/bin/env node

/**
 * Fix remaining TypeScript any types
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Fixing remaining TypeScript any types...\n');

// Specific files and fixes based on ESLint output
const specificFixes = [
  {
    file: 'src/utils/advancedOIDC.ts',
    fixes: [
      { from: '.setProtectedHeader(header).sign(secretKey);', to: '.setProtectedHeader(header).sign(secretKey);' },
      { from: 'new SignJWT(claims)', to: 'new SignJWT(claims as Record<string, unknown>)' }
    ]
  },
  {
    file: 'src/utils/apiClient.ts',
    fixes: [
      { from: 'export interface ApiResponse<T = any>', to: 'export interface ApiResponse<T = unknown>' },
      { from: 'data?: any', to: 'data?: unknown' },
      { from: 'error?: any', to: 'error?: Error | unknown' }
    ]
  },
  {
    file: 'src/utils/validation.ts',
    fixes: [
      { from: 'value: any', to: 'value: unknown' },
      { from: 'data: any', to: 'data: unknown' },
      { from: 'obj: any', to: 'obj: Record<string, unknown>' }
    ]
  },
  {
    file: 'src/utils/tokenAnalysis.ts',
    fixes: [
      { from: 'payload: any', to: 'payload: Record<string, unknown>' },
      { from: 'token: any', to: 'token: string | Record<string, unknown>' }
    ]
  },
  {
    file: 'src/utils/userBehaviorTracking.ts',
    fixes: [
      { from: 'properties?: any', to: 'properties?: Record<string, unknown>' },
      { from: 'metadata?: any', to: 'metadata?: Record<string, unknown>' }
    ]
  }
];

function applySpecificFixes() {
  let totalFixes = 0;
  
  for (const { file, fixes } of specificFixes) {
    const filePath = path.join(__dirname, file);
    
    try {
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️ File not found: ${file}`);
        continue;
      }
      
      let content = fs.readFileSync(filePath, 'utf8');
      let fileFixCount = 0;
      
      for (const { from, to } of fixes) {
        if (content.includes(from)) {
          content = content.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), to);
          fileFixCount++;
          totalFixes++;
        }
      }
      
      if (fileFixCount > 0) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ ${file}: ${fileFixCount} fixes applied`);
      }
      
    } catch (error) {
      console.log(`❌ ${file}: Error - ${error.message}`);
    }
  }
  
  console.log(`\n🎉 Applied ${totalFixes} specific fixes`);
}

// Generic any type fixes
function applyGenericFixes() {
  const srcDir = path.join(__dirname, 'src');
  
  function getAllFiles(dir) {
    const files = [];
    
    function traverse(currentDir) {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          traverse(fullPath);
        } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
          files.push(fullPath);
        }
      }
    }
    
    traverse(dir);
    return files;
  }
  
  const files = getAllFiles(srcDir);
  let totalFixes = 0;
  
  console.log('\n🔧 Applying generic any type fixes...\n');
  
  for (const filePath of files) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      let fileFixCount = 0;
      
      // More specific patterns
      const patterns = [
        // Function parameters
        { from: /\(([^)]*): any\)/g, to: '($1: unknown)' },
        // Array types
        { from: /: any\[\]/g, to: ': unknown[]' },
        // Generic types
        { from: /<any>/g, to: '<unknown>' },
        // Object properties
        { from: /: any;/g, to: ': unknown;' },
        // Function return types
        { from: /\): any/g, to: '): unknown' },
        // Variable declarations
        { from: /: any =/g, to: ': unknown =' },
        // Type assertions
        { from: / as any/g, to: ' as unknown' }
      ];
      
      for (const { from, to } of patterns) {
        const matches = content.match(from);
        if (matches) {
          content = content.replace(from, to);
          fileFixCount += matches.length;
          totalFixes += matches.length;
        }
      }
      
      if (fileFixCount > 0) {
        fs.writeFileSync(filePath, content, 'utf8');
        const relativePath = path.relative(__dirname, filePath);
        console.log(`✅ ${relativePath}: ${fileFixCount} fixes applied`);
      }
      
    } catch (error) {
      const relativePath = path.relative(__dirname, filePath);
      console.log(`❌ ${relativePath}: Error - ${error.message}`);
    }
  }
  
  console.log(`\n🎉 Applied ${totalFixes} generic fixes`);
}

// Main execution
async function main() {
  applySpecificFixes();
  applyGenericFixes();
  
  console.log('\n✅ Remaining any type fixes completed!');
  console.log('\n📊 Run npm run lint to check progress');
}

main().catch(console.error);