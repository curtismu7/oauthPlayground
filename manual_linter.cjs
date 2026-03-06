#!/usr/bin/env node

/**
 * Manual Linter Error Detector
 * Created to work around Biome terminal hanging issues
 * Analyzes files for common linting patterns
 */

const fs = require('fs');
const path = require('path');

// Files to check - All V9 flows + key standardized apps
const filesToCheck = [
  // Standardized Apps
  'src/pages/flows/UserInfoFlow.tsx',
  'src/pages/flows/KrogerGroceryStoreMFA.tsx',
  
  // All V9 Flows
  'src/pages/flows/v9/ClientCredentialsFlowV9.tsx',
  'src/pages/flows/v9/DPoPAuthorizationCodeFlowV9.tsx',
  'src/pages/flows/v9/DeviceAuthorizationFlowV9.tsx',
  'src/pages/flows/v9/ImplicitFlowV9.tsx',
  'src/pages/flows/v9/JWTBearerTokenFlowV9.tsx',
  'src/pages/flows/v9/MFALoginHintFlowV9.tsx',
  'src/pages/flows/v9/MFAWorkflowLibraryFlowV9.tsx',
  'src/pages/flows/v9/OAuthAuthorizationCodeFlowV9.tsx',
  'src/pages/flows/v9/OAuthROPCFlowV9.tsx',
  'src/pages/flows/v9/OIDCHybridFlowV9.tsx',
  'src/pages/flows/v9/PingOnePARFlowV9.tsx',
  'src/pages/flows/v9/RARFlowV9.tsx',
  'src/pages/flows/v9/SAMLBearerAssertionFlowV9.tsx',
  'src/pages/flows/v9/TokenExchangeFlowV9.tsx',
  'src/pages/flows/v9/WorkerTokenFlowV9.tsx',
  
  // Key Documentation/Training
  'src/pages/OAuthOIDCTraining.tsx'
];

console.log('🔍 Manual Linter Error Detector');
console.log('=====================================\n');

const results = {
  errors: [],
  warnings: [],
  info: []
};

// Common patterns to check
const patterns = {
  // Critical errors
  duplicateFunction: /const\s+(\w+):\s*React\.FC.*=\s*\(\)\s*=>\s*{/g,
  missingImport: /import.*from.*['"][^'"]*['"];?\s*\n(?!.*import)/,
  syntaxError: /export\s+default\s+\w+;\s*\n\s*\}/,
  
  // Warnings
  unusedVariable: /const\s+_(\w+)|let\s+_(\w+)|var\s+_(\w+)/g,
  unusedImport: /import.*_(\w+).*from/g,
  consoleStatement: /console\.(log|error|warn|info|debug)/g,
  
  // TypeScript issues
  anyType: /:\s*any\b/g,
  missingType: /=\s*[^;]+;\s*\/\/.*type/g
};

function analyzeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const fileResults = {
      filePath,
      errors: [],
      warnings: [],
      info: []
    };

    // Check for duplicate function definitions
    const functionMatches = content.match(patterns.duplicateFunction);
    if (functionMatches && functionMatches.length > 1) {
      fileResults.errors.push({
        line: 'Multiple',
        message: `Duplicate function definitions found: ${functionMatches.length} matches`,
        severity: 'error'
      });
    }

    // Check for unused variables
    const unusedMatches = content.match(patterns.unusedVariable);
    if (unusedMatches) {
      fileResults.warnings.push({
        line: 'Multiple',
        message: `Unused variables with underscore prefix: ${unusedMatches.length} matches`,
        severity: 'warning'
      });
    }

    // Check for console statements
    const consoleMatches = content.match(patterns.consoleStatement);
    if (consoleMatches) {
      fileResults.warnings.push({
        line: 'Multiple', 
        message: `Console statements found: ${consoleMatches.length} matches`,
        severity: 'warning'
      });
    }

    // Check for any types
    const anyMatches = content.match(patterns.anyType);
    if (anyMatches) {
      fileResults.warnings.push({
        line: 'Multiple',
        message: `Any types found: ${anyMatches.length} matches`,
        severity: 'warning'
      });
    }

    // Check for export syntax issues
    if (content.includes('export default') && content.includes('};\nexport default')) {
      fileResults.errors.push({
        line: 'Multiple',
        message: 'Export statement appears to be inside function scope',
        severity: 'error'
      });
    }

    return fileResults;
  } catch (error) {
    return {
      filePath,
      errors: [{ line: '0', message: `Failed to read file: ${error.message}`, severity: 'error' }],
      warnings: [],
      info: []
    };
  }
}

// Analyze all files
filesToCheck.forEach(file => {
  if (fs.existsSync(file)) {
    const result = analyzeFile(file);
    results.errors.push(...result.errors.map(e => ({...e, file})));
    results.warnings.push(...result.warnings.map(w => ({...w, file})));
    results.info.push(...result.info.map(i => ({...i, file})));
  } else {
    results.errors.push({
      file,
      line: '0',
      message: 'File not found',
      severity: 'error'
    });
  }
});

// Generate report
console.log(`📊 ANALYSIS RESULTS`);
console.log(`==================`);
console.log(`Total Files Checked: ${filesToCheck.length}`);
console.log(`Total Errors: ${results.errors.length}`);
console.log(`Total Warnings: ${results.warnings.length}`);
console.log(`Total Info: ${results.info.length}\n`);

if (results.errors.length > 0) {
  console.log(`🔴 CRITICAL ERRORS (${results.errors.length})`);
  console.log(`============================`);
  results.errors.forEach(error => {
    console.log(`❌ ${error.file}:${error.line} - ${error.message}`);
  });
  console.log('');
}

if (results.warnings.length > 0) {
  console.log(`🟡 WARNINGS (${results.warnings.length})`);
  console.log(`========================`);
  results.warnings.forEach(warning => {
    console.log(`⚠️  ${warning.file}:${warning.line} - ${warning.message}`);
  });
  console.log('');
}

// Save detailed results to file
const reportData = {
  timestamp: new Date().toISOString(),
  summary: {
    totalFiles: filesToCheck.length,
    errors: results.errors.length,
    warnings: results.warnings.length,
    info: results.info.length
  },
  results
};

fs.writeFileSync('linter_errors_manual.json', JSON.stringify(reportData, null, 2));
console.log(`📄 Detailed report saved to: linter_errors_manual.json`);

if (results.errors.length > 0) {
  process.exit(1);
} else {
  console.log(`✅ No critical errors found!`);
  process.exit(0);
}
