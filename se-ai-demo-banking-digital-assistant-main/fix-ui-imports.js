#!/usr/bin/env node

/**
 * Quick fix script for UI import issues
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing UI Import Issues...\n');

// Check if all required components exist and have proper exports
const components = [
  'Login',
  'Dashboard', 
  'UserLookup',
  'CreditAssessment',
  'UserProfile',
  'AdminPanel',
  'ErrorBoundary'
];

let hasIssues = false;

components.forEach(componentName => {
  const componentPath = path.join(__dirname, 'lending_api_ui', 'src', 'components', `${componentName}.js`);
  
  console.log(`🔍 Checking ${componentName}...`);
  
  if (fs.existsSync(componentPath)) {
    try {
      const content = fs.readFileSync(componentPath, 'utf8');
      
      // Check for export
      const hasDefaultExport = content.includes(`export default ${componentName}`);
      
      if (hasDefaultExport) {
        console.log(`  ✅ ${componentName}: Properly exported`);
      } else {
        console.log(`  ❌ ${componentName}: Missing default export`);
        hasIssues = true;
      }
      
    } catch (error) {
      console.log(`  ❌ ${componentName}: Error reading file - ${error.message}`);
      hasIssues = true;
    }
  } else {
    console.log(`  ❌ ${componentName}: File not found`);
    hasIssues = true;
  }
});

console.log('\n🔍 Checking special imports...');

// Check NotificationProvider
const notificationPath = path.join(__dirname, 'lending_api_ui', 'src', 'components', 'NotificationSystem.js');
if (fs.existsSync(notificationPath)) {
  const content = fs.readFileSync(notificationPath, 'utf8');
  if (content.includes('export const NotificationProvider')) {
    console.log('  ✅ NotificationProvider: Named export found');
  } else {
    console.log('  ❌ NotificationProvider: Named export missing');
    hasIssues = true;
  }
} else {
  console.log('  ❌ NotificationSystem.js: File not found');
  hasIssues = true;
}

// Check OfflineBanner
const offlinePath = path.join(__dirname, 'lending_api_ui', 'src', 'components', 'OfflineHandler.js');
if (fs.existsSync(offlinePath)) {
  const content = fs.readFileSync(offlinePath, 'utf8');
  if (content.includes('export const OfflineBanner')) {
    console.log('  ✅ OfflineBanner: Named export found');
  } else {
    console.log('  ❌ OfflineBanner: Named export missing');
    hasIssues = true;
  }
} else {
  console.log('  ❌ OfflineHandler.js: File not found');
  hasIssues = true;
}

// Check useGlobalErrorHandler
const errorHookPath = path.join(__dirname, 'lending_api_ui', 'src', 'hooks', 'useErrorHandling.js');
if (fs.existsSync(errorHookPath)) {
  const content = fs.readFileSync(errorHookPath, 'utf8');
  if (content.includes('export const useGlobalErrorHandler')) {
    console.log('  ✅ useGlobalErrorHandler: Named export found');
  } else {
    console.log('  ❌ useGlobalErrorHandler: Named export missing');
    hasIssues = true;
  }
} else {
  console.log('  ❌ useErrorHandling.js: File not found');
  hasIssues = true;
}

console.log('\n📋 Summary:');
if (hasIssues) {
  console.log('❌ Issues found with component imports/exports');
  console.log('\n💡 Recommendations:');
  console.log('1. Check browser console for specific error details');
  console.log('2. Verify all components have proper default exports');
  console.log('3. Check named exports for NotificationProvider, OfflineBanner, useGlobalErrorHandler');
  console.log('4. Consider using the simple App.js version temporarily');
} else {
  console.log('✅ All component imports/exports look correct');
  console.log('\n💡 If still having issues:');
  console.log('1. Check browser console for runtime errors');
  console.log('2. Clear browser cache and restart dev server');
  console.log('3. Check for circular import dependencies');
}

console.log('\n🎯 Quick Fix Options:');
console.log('1. Use simple UI: cp lending_api_ui/src/App.simple.js lending_api_ui/src/App.js');
console.log('2. Use debug UI: cp lending_api_ui/src/App.debug.js lending_api_ui/src/App.js');
console.log('3. Check browser at: http://localhost:3003');

console.log('\n✨ Fix check completed!');