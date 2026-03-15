#!/usr/bin/env node

/**
 * Component import test script
 * Tests each component individually to identify import issues
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing React Component Imports...\n');

// List of components to test
const components = [
  'Login',
  'Dashboard', 
  'UserLookup',
  'CreditAssessment',
  'UserProfile',
  'AdminPanel',
  'ErrorBoundary'
];

// Test each component file
components.forEach(componentName => {
  const componentPath = path.join(__dirname, 'src', 'components', `${componentName}.js`);
  
  console.log(`📁 Testing ${componentName}...`);
  
  if (fs.existsSync(componentPath)) {
    try {
      const content = fs.readFileSync(componentPath, 'utf8');
      
      // Check for export
      const hasDefaultExport = content.includes(`export default ${componentName}`);
      const hasNamedExport = content.includes(`export { ${componentName} }`);
      const hasExport = hasDefaultExport || hasNamedExport;
      
      // Check for React import
      const hasReactImport = content.includes("import React");
      
      // Check for other imports
      const importLines = content.split('\n').filter(line => line.trim().startsWith('import'));
      
      console.log(`  ✅ File exists`);
      console.log(`  ${hasExport ? '✅' : '❌'} Has export (default: ${hasDefaultExport}, named: ${hasNamedExport})`);
      console.log(`  ${hasReactImport ? '✅' : '❌'} Has React import`);
      console.log(`  📦 Imports (${importLines.length}):`);
      
      importLines.forEach(line => {
        console.log(`    ${line.trim()}`);
      });
      
    } catch (error) {
      console.log(`  ❌ Error reading file: ${error.message}`);
    }
  } else {
    console.log(`  ❌ File not found: ${componentPath}`);
  }
  
  console.log('');
});

// Test hooks and services
const otherModules = [
  { name: 'NotificationSystem', path: 'src/components/NotificationSystem.js' },
  { name: 'OfflineHandler', path: 'src/components/OfflineHandler.js' },
  { name: 'useErrorHandling', path: 'src/hooks/useErrorHandling.js' }
];

console.log('🔧 Testing Hooks and Services...\n');

otherModules.forEach(module => {
  const modulePath = path.join(__dirname, module.path);
  
  console.log(`📁 Testing ${module.name}...`);
  
  if (fs.existsSync(modulePath)) {
    try {
      const content = fs.readFileSync(modulePath, 'utf8');
      
      // Check for exports
      const exportLines = content.split('\n').filter(line => 
        line.trim().startsWith('export') && !line.includes('//')
      );
      
      console.log(`  ✅ File exists`);
      console.log(`  📤 Exports (${exportLines.length}):`);
      
      exportLines.forEach(line => {
        console.log(`    ${line.trim()}`);
      });
      
    } catch (error) {
      console.log(`  ❌ Error reading file: ${error.message}`);
    }
  } else {
    console.log(`  ❌ File not found: ${modulePath}`);
  }
  
  console.log('');
});

console.log('✨ Component test completed!');