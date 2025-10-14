// src/services/configurationManagerCLI.js
// CLI tool for configuration management
// Allows developers to manage configurations from the terminal

import fs from 'fs';

// Dynamic import for the service (since it's TypeScript)
const { EnhancedConfigurationService, FlowType, Environment } = await import('./enhancedConfigurationService.ts');

const args = process.argv.slice(2);

console.log('🔧 OAuth Playground Configuration Manager\n');

// Parse arguments
function parseArgs() {
  const options = {
    command: 'help',
    flowType: null,
    environment: Environment.DEVELOPMENT,
    output: 'console',
    file: null
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case 'get':
      case 'validate':
      case 'export':
      case 'import':
        options.command = arg;
        break;

      case '--flow':
      case '--flow-type':
        if (nextArg && Object.values(FlowType).includes(nextArg)) {
          options.flowType = nextArg;
          i++; // Skip next arg
        }
        break;

      case '--env':
      case '--environment':
        if (nextArg && Object.values(Environment).includes(nextArg)) {
          options.environment = nextArg;
          i++; // Skip next arg
        }
        break;

      case '--output':
        if (nextArg) {
          options.output = nextArg;
          i++; // Skip next arg
        }
        break;

      case '--file':
        if (nextArg) {
          options.file = nextArg;
          i++; // Skip next arg
        }
        break;

      case '--help':
      case '-h':
        showHelp();
        process.exit(0);
        break;
    }
  }

  return options;
}

function showHelp() {
  console.log('USAGE: npm run config [command] [options]\n');
  console.log('COMMANDS:');
  console.log('  get          Get configuration for a flow type');
  console.log('  validate     Validate configuration for a flow type');
  console.log('  export       Export configuration to a file');
  console.log('  import       Import configuration from a file');
  console.log('  help         Show this help message\n');
  console.log('OPTIONS:');
  console.log('  --flow, --flow-type <type>    Flow type (oauth-authorization-code, etc.)');
  console.log('  --env, --environment <env>    Environment (development, staging, production)');
  console.log('  --output <format>             Output format (console, json)');
  console.log('  --file <path>                 File path for import/export\n');
  console.log('FLOW TYPES:');
  console.log('  oauth-authorization-code, oauth-implicit, oauth-client-credentials');
  console.log('  oauth-device-code, oidc-authorization-code, oidc-implicit');
  console.log('  oidc-hybrid, oidc-device-authorization\n');
  console.log('EXAMPLES:');
  console.log('  npm run config get --flow oauth-authorization-code');
  console.log('  npm run config validate --flow oidc-hybrid --env production');
  console.log('  npm run config export --flow oauth-authorization-code --file config.json');
  console.log('  npm run config import --file config.json');
}

function executeCommand(options) {
  try {
    switch (options.command) {
      case 'get':
        return handleGet(options);
      case 'validate':
        return handleValidate(options);
      case 'export':
        return handleExport(options);
      case 'import':
        return handleImport(options);
      default:
        console.log('❌ Unknown command. Use --help for available commands.');
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

function handleGet(options) {
  if (!options.flowType) {
    console.log('❌ Flow type is required. Use --flow <type>');
    process.exit(1);
  }

  console.log(`📋 Getting configuration for ${options.flowType} in ${options.environment}...\n`);

  const config = EnhancedConfigurationService.getFlowConfig(options.flowType, options.environment);

  if (options.output === 'json') {
    console.log(JSON.stringify(config, null, 2));
  } else {
    console.log('🔧 Configuration Details:');
    console.log(`   Flow Type: ${config.flowType}`);
    console.log(`   Response Types: ${config.responseTypes.join(', ')}`);
    console.log(`   Grant Types: ${config.grantTypes.join(', ')}`);
    console.log(`   Scopes: ${config.scopes.join(', ')}`);
    console.log(`   Require PKCE: ${config.requirePkce}`);
    console.log(`   Enable Debug: ${config.enableDebugMode}`);
    console.log(`   Request Timeout: ${config.requestTimeout}ms`);
    console.log(`   Token Introspection: ${config.enableTokenIntrospection}`);
    console.log(`   Refresh Tokens: ${config.enableRefreshTokens}`);
  }
}

function handleValidate(options) {
  if (!options.flowType) {
    console.log('❌ Flow type is required. Use --flow <type>');
    process.exit(1);
  }

  console.log(`🔍 Validating configuration for ${options.flowType} in ${options.environment}...\n`);

  const config = EnhancedConfigurationService.getFlowConfig(options.flowType, options.environment);
  const validation = EnhancedConfigurationService.validateConfiguration(config);

  if (validation.isValid) {
    console.log('✅ Configuration is valid!');
  } else {
    console.log('❌ Configuration has issues:');

    if (validation.errors.length > 0) {
      console.log('\n🚨 Errors:');
      validation.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error.field}: ${error.message}`);
        if (error.suggestion) {
          console.log(`      💡 ${error.suggestion}`);
        }
      });
    }

    if (validation.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      validation.warnings.forEach((warning, index) => {
        console.log(`   ${index + 1}. ${warning.field}: ${warning.message}`);
      });
    }

    if (validation.suggestions.length > 0) {
      console.log('\n💡 Suggestions:');
      validation.suggestions.forEach((suggestion, index) => {
        console.log(`   ${index + 1}. ${suggestion.field}: ${suggestion.reason}`);
        console.log(`      Current: ${JSON.stringify(suggestion.currentValue)}`);
        console.log(`      Suggested: ${JSON.stringify(suggestion.suggestedValue)}`);
        console.log(`      Benefit: ${suggestion.benefit}`);
      });
    }
  }
}

function handleExport(options) {
  if (!options.flowType) {
    console.log('❌ Flow type is required. Use --flow <type>');
    process.exit(1);
  }

  const fileName = options.file || `${options.flowType}-${options.environment}-config.json`;
  console.log(`📤 Exporting configuration for ${options.flowType} to ${fileName}...\n`);

  const exportData = EnhancedConfigurationService.exportConfiguration(options.flowType, options.environment);

  fs.writeFileSync(fileName, exportData);
  console.log(`✅ Configuration exported to ${fileName}`);
}

function handleImport(options) {
  if (!options.file) {
    console.log('❌ File path is required. Use --file <path>');
    process.exit(1);
  }

  console.log(`📥 Importing configuration from ${options.file}...\n`);

  try {
    const content = fs.readFileSync(options.file, 'utf8');
    const imported = EnhancedConfigurationService.importConfiguration(content);

    console.log('✅ Configuration imported successfully!');
    console.log(`   Flow Type: ${imported.flowType}`);
    console.log(`   Configuration loaded and validated`);

    // Validate the imported configuration
    const validation = EnhancedConfigurationService.validateConfiguration(imported.config);
    if (validation.isValid) {
      console.log('   ✅ Configuration is valid');
    } else {
      console.log('   ⚠️  Configuration has validation issues');
      console.log(`   Errors: ${validation.errors.length}, Warnings: ${validation.warnings.length}`);
    }

  } catch (error) {
    console.error('❌ Failed to import configuration:', error.message);
    process.exit(1);
  }
}

// Main execution
const options = parseArgs();

if (options.command === 'help') {
  showHelp();
} else {
  executeCommand(options);
}
