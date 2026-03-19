#!/usr/bin/env node
/**
 * App Loading Test Script
 * Tests that all app/flow files can be parsed and their imports resolved
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
};

// Find all .tsx files in key directories
const searchDirs = [
  'src/pages/flows/v9',
  'src/v8/flows',
  'src/pages/protect',
  'src/v8u/pages',
  'src/pages',
];

const apps = [];

searchDirs.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(fullPath)) return;
  
  const files = fs.readdirSync(fullPath, { recursive: true });
  files.forEach(file => {
    if (typeof file === 'string' && file.endsWith('.tsx') && !file.includes('__tests__') && !file.includes('test')) {
      apps.push(path.join(dir, file));
    }
  });
});

log.info(`Found ${apps.length} app files to test`);

// Test each app using TypeScript compiler
let passed = 0;
let failed = 0;
const errors = [];

apps.forEach((app, index) => {
  const appPath = path.join(process.cwd(), app);
  
  try {
    // Try to parse the file with TypeScript
    execSync(`npx tsc --noEmit --skipLibCheck --target ES2020 --module ESNext --moduleResolution node --jsx react-jsx "${appPath}" 2>&1`, {
      encoding: 'utf8',
      timeout: 30000,
      maxBuffer: 1024 * 1024
    });
    log.success(`${app}`);
    passed++;
  } catch (error) {
    log.error(`${app}`);
    failed++;
    errors.push({ app, error: error.stdout || error.message });
  }
});

// Summary
console.log('\n' + '='.repeat(50));
log.info(`Results: ${passed} passed, ${failed} failed out of ${apps.length} apps`);

if (errors.length > 0) {
  console.log('\nErrors found:');
  errors.forEach(({ app, error }) => {
    console.log(`\n${colors.red}${app}:${colors.reset}`);
    // Show first few lines of error
    const errorLines = error.split('\n').slice(0, 5).join('\n');
    console.log(errorLines);
  });
  process.exit(1);
} else {
  log.success('All apps loaded successfully!');
  process.exit(0);
}
