#!/usr/bin/env node

/**
 * Check Production Apps Storage Implementation
 * 
 * This script verifies that all Production menu group apps are using
 * IndexedDB and SQLite for persistent storage instead of localStorage/sessionStorage
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Production apps from the menu
const productionApps = [
  { id: 'mfa-feature-flags-admin-v8', path: '/v8/mfa-feature-flags', name: 'MFA Feature Flags' },
  { id: 'api-status-page', path: '/api-status', name: 'API Status' },
  { id: 'flow-comparison-tool', path: '/v8u/flow-comparison', name: 'Flow Comparison Tool' },
  { id: 'resources-api-v8', path: '/v8/resources-api', name: 'Resources API Tutorial' },
  { id: 'spiffe-spire-flow-v8u', path: '/v8u/spiffe-spire', name: 'SPIFFE/SPIRE Mock' },
  { id: 'postman-collection-generator', path: '/postman-collection-generator', name: 'Postman Collection Generator' },
  { id: 'new-unified-mfa-v8', path: '/v8/unified-mfa', name: 'New Unified MFA' },
  { id: 'unified-oauth-flow-v8u', path: '/v8u/unified', name: 'Unified OAuth & OIDC' },
  { id: 'delete-all-devices-utility-v8', path: '/v8/delete-all-devices', name: 'Delete All Devices' },
  { id: 'enhanced-state-management', path: '/v8u/enhanced-state-management', name: 'Enhanced State Management' },
  { id: 'token-monitoring-dashboard', path: '/v8u/token-monitoring', name: 'Token Monitoring Dashboard' },
  { id: 'protect-portal-app', path: '/protect-portal', name: 'Protect Portal App' }
];

const storagePatterns = {
  good: [
    /indexedDB/i,
    /unifiedStorageManager/i,
    /workerTokenManager/i,
    /unifiedWorkerTokenService/i,
    /sqlite/i
  ],
  bad: [
    /localStorage\.setItem\(/,
    /localStorage\.getItem\(/,
    /sessionStorage\.setItem\(/,
    /sessionStorage\.getItem\(/,
    /localStorage\['/,
    /sessionStorage\['/
  ]
};

function findAppFiles(appId) {
  const possiblePaths = [
    `src/pages${appId.includes('v8') ? '/v8' : ''}${appId.includes('v8u') ? '/v8u' : ''}`,
    `src/v8${appId.includes('mfa') ? '/flows' : '/pages'}`,
    `src/v8u/components`,
    `src/pages`,
    `src/components`
  ];
  
  const files = [];
  
  for (const basePath of possiblePaths) {
    const fullPath = path.join(__dirname, '..', basePath);
    if (fs.existsSync(fullPath)) {
      const dirFiles = fs.readdirSync(fullPath, { withFileTypes: true })
        .filter(dirent => dirent.isFile())
        .map(dirent => path.join(fullPath, dirent.name));
      
      files.push(...dirFiles.filter(file => 
        file.includes('.tsx') || file.includes('.ts') || file.includes('.js')
      ));
    }
  }
  
  return files;
}

function checkFileStorage(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const result = {
      hasGoodStorage: false,
      hasBadStorage: false,
      badStorageLines: [],
      goodStorageLines: []
    };
    
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      // Check for good storage patterns
      for (const pattern of storagePatterns.good) {
        if (pattern.test(line)) {
          result.hasGoodStorage = true;
          result.goodStorageLines.push(`Line ${index + 1}: ${line.trim()}`);
        }
      }
      
      // Check for bad storage patterns
      for (const pattern of storagePatterns.bad) {
        if (pattern.test(line)) {
          result.hasBadStorage = true;
          result.badStorageLines.push(`Line ${index + 1}: ${line.trim()}`);
        }
      }
    });
    
    return result;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return null;
  }
}

console.log('🔍 Checking Production Apps Storage Implementation\n');

const results = [];

for (const app of productionApps) {
  console.log(`\n📱 Checking: ${app.name} (${app.id})`);
  
  const files = findAppFiles(app.id);
  
  if (files.length === 0) {
    console.log(`  ⚠️  No files found for app`);
    results.push({ app, status: 'NOT_FOUND', files: [] });
    continue;
  }
  
  let appResult = {
    app,
    status: 'GOOD',
    files: [],
    hasBadStorage: false
  };
  
  for (const file of files) {
    const fileResult = checkFileStorage(file);
    
    if (fileResult) {
      if (fileResult.hasBadStorage) {
        appResult.hasBadStorage = true;
        appResult.status = 'NEEDS_UPDATE';
      }
      
      appResult.files.push({
        path: file,
        hasGoodStorage: fileResult.hasGoodStorage,
        hasBadStorage: fileResult.hasBadStorage,
        badStorageLines: fileResult.badStorageLines,
        goodStorageLines: fileResult.goodStorageLines
      });
    }
  }
  
  results.push(appResult);
  
  // Print result for this app
  if (appResult.status === 'NOT_FOUND') {
    console.log(`  ❌ App files not found`);
  } else if (appResult.hasBadStorage) {
    console.log(`  ❌ Using localStorage/sessionStorage - NEEDS UPDATE`);
    appResult.files.forEach(file => {
      if (file.hasBadStorage) {
        console.log(`    📄 ${path.relative(path.join(__dirname, '..'), file.path)}`);
        file.badStorageLines.forEach(line => {
          console.log(`      ${line}`);
        });
      }
    });
  } else {
    console.log(`  ✅ Using proper storage (IndexedDB/SQLite)`);
  }
}

// Summary
console.log('\n📊 SUMMARY');
console.log('=========');

const goodApps = results.filter(r => r.status === 'GOOD');
const badApps = results.filter(r => r.status === 'NEEDS_UPDATE');
const notFoundApps = results.filter(r => r.status === 'NOT_FOUND');

console.log(`✅ Using proper storage: ${goodApps.length}`);
goodApps.forEach(app => console.log(`  - ${app.app.name}`));

console.log(`\n❌ Need updates: ${badApps.length}`);
badApps.forEach(app => console.log(`  - ${app.app.name}`));

if (notFoundApps.length > 0) {
  console.log(`\n⚠️  Not found: ${notFoundApps.length}`);
  notFoundApps.forEach(app => console.log(`  - ${app.app.name}`));
}

// Exit with error code if apps need updates
process.exit(badApps.length > 0 ? 1 : 0);
