#!/usr/bin/env node

/**
 * Check Production Apps Storage Implementation - Targeted Version
 * 
 * This script specifically checks the Production menu group apps for proper storage usage
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the specific files for each Production app
const productionAppFiles = {
  'mfa-feature-flags': [
    'src/v8/pages/MFAFeatureFlagsAdminPageV8.tsx',
    'src/v8/services/mfaFeatureFlagsServiceV8.ts'
  ],
  'api-status': [
    'src/pages/api-status/ApiStatusPage.tsx'
  ],
  'flow-comparison': [
    'src/v8u/pages/FlowComparisonPage.tsx',
    'src/v8u/services/flowComparisonService.ts'
  ],
  'resources-api': [
    'src/v8/pages/ResourcesAPIPageV8.tsx'
  ],
  'spiffe-spire': [
    'src/v8u/pages/SPIFFESpirePageV8U.tsx',
    'src/v8u/flows/SPIFFESpireFlowV8U.tsx'
  ],
  'postman-generator': [
    'src/pages/PostmanCollectionGeneratorPage.tsx',
    'src/services/postmanCollectionService.ts'
  ],
  'unified-mfa': [
    'src/v8/flows/unified/UnifiedMFARegistrationFlowV8_Legacy.tsx',
    'src/v8/services/mfaServiceV8.ts'
  ],
  'unified-oauth': [
    'src/v8u/pages/UnifiedOAuthPageV8U.tsx',
    'src/v8u/flows/UnifiedOAuthFlowV8U.tsx',
    'src/v8u/services/unifiedOAuthCredentialsServiceV8U.ts'
  ],
  'delete-devices': [
    'src/v8/pages/DeleteAllDevicesUtilityV8.tsx'
  ],
  'enhanced-state': [
    'src/v8u/pages/EnhancedStateManagementPageV8U.tsx'
  ],
  'token-monitoring': [
    'src/v8u/pages/TokenMonitoringPage.tsx',
    'src/v8u/services/tokenMonitoringService.ts'
  ],
  'protect-portal': [
    'src/pages/protect-portal/ProtectPortalApp.tsx',
    'src/pages/protect-portal/services/protectPortalAuthService.ts'
  ]
};

// Storage patterns to check
const storagePatterns = {
  good: [
    /indexedDB/i,
    /unifiedStorageManager/i,
    /workerTokenManager/i,
    /unifiedWorkerTokenService/i,
    /DualStorageServiceV8/i,
    /UnifiedOAuthCredentialsServiceV8U/i,
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

function checkFileStorage(filePath) {
  try {
    const fullPath = path.join(__dirname, '..', filePath);
    if (!fs.existsSync(fullPath)) {
      return { exists: false };
    }
    
    const content = fs.readFileSync(fullPath, 'utf8');
    const result = {
      exists: true,
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
      
      // Check for bad storage patterns (but ignore comments)
      if (!line.trim().startsWith('//') && !line.trim().startsWith('*')) {
        for (const pattern of storagePatterns.bad) {
          if (pattern.test(line)) {
            result.hasBadStorage = true;
            result.badStorageLines.push(`Line ${index + 1}: ${line.trim()}`);
          }
        }
      }
    });
    
    return result;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return { exists: false, error: error.message };
  }
}

console.log('🔍 Checking Production Apps Storage Implementation (Targeted)\n');

const results = [];

for (const [appName, files] of Object.entries(productionAppFiles)) {
  console.log(`\n📱 Checking: ${appName}`);
  
  let appResult = {
    app: appName,
    status: 'GOOD',
    files: [],
    hasBadStorage: false,
    hasGoodStorage: false
  };
  
  for (const file of files) {
    const fileResult = checkFileStorage(file);
    
    if (!fileResult.exists) {
      console.log(`  ⚠️  File not found: ${file}`);
      appResult.files.push({
        path: file,
        exists: false,
        error: fileResult.error
      });
      continue;
    }
    
    if (fileResult.hasBadStorage) {
      appResult.hasBadStorage = true;
      appResult.status = 'NEEDS_REVIEW';
    }
    
    if (fileResult.hasGoodStorage) {
      appResult.hasGoodStorage = true;
    }
    
    appResult.files.push({
      path: file,
      exists: true,
      hasGoodStorage: fileResult.hasGoodStorage,
      hasBadStorage: fileResult.hasBadStorage,
      badStorageLines: fileResult.badStorageLines,
      goodStorageLines: fileResult.goodStorageLines
    });
  }
  
  results.push(appResult);
  
  // Print result for this app
  if (appResult.hasBadStorage) {
    console.log(`  ⚠️  Contains localStorage/sessionStorage usage - REVIEW NEEDED`);
    appResult.files.forEach(file => {
      if (file.hasBadStorage) {
        console.log(`    📄 ${file.path}`);
        file.badStorageLines.forEach(line => {
          console.log(`      ${line}`);
        });
      }
    });
  } else if (appResult.hasGoodStorage) {
    console.log(`  ✅ Using proper storage (IndexedDB/SQLite)`);
  } else {
    console.log(`  ℹ️  No storage usage detected`);
  }
}

// Summary
console.log('\n📊 SUMMARY');
console.log('=========');

const goodApps = results.filter(r => !r.hasBadStorage && r.hasGoodStorage);
const reviewApps = results.filter(r => r.hasBadStorage);
const noStorageApps = results.filter(r => !r.hasBadStorage && !r.hasGoodStorage);

console.log(`✅ Using proper storage: ${goodApps.length}`);
goodApps.forEach(app => console.log(`  - ${app.app}`));

if (noStorageApps.length > 0) {
  console.log(`\nℹ️  No storage usage: ${noStorageApps.length}`);
  noStorageApps.forEach(app => console.log(`  - ${app.app}`));
}

console.log(`\n⚠️  Contains localStorage/sessionStorage: ${reviewApps.length}`);
reviewApps.forEach(app => console.log(`  - ${app.app}`));

// Final verdict
console.log(`\n🎯 VERDICT:`);
if (reviewApps.length === 0) {
  console.log(`✅ All Production apps are using proper storage!`);
} else {
  console.log(`⚠️  Some apps have localStorage/sessionStorage usage that should be reviewed.`);
  console.log(`   Note: Some usage might be acceptable (UI preferences, temporary data, etc.)`);
}

// Exit with success (0) since we're just checking
process.exit(0);
