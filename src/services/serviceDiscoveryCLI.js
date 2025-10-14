// src/services/serviceDiscoveryCLI.js
// Simple JavaScript CLI for service discovery
// Basic implementation without TypeScript dependencies

const args = process.argv.slice(2);

console.log('🔍 OAuth Playground Service Discovery\n');

// Simple help
if (args.includes('--help') || args.includes('-h')) {
  console.log('USAGE: npm run service-discovery [options]\n');
  console.log('OPTIONS:');
  console.log('  --help, -h          Show this help');
  console.log('  --list              List all available services');
  console.log('  --flow <type>       Show services for specific flow type');
  console.log('  --search <term>     Search services by name or description\n');
  console.log('FLOW TYPES:');
  console.log('  oauth-authorization-code, oauth-implicit, oauth-client-credentials');
  console.log('  oidc-authorization-code, oidc-implicit, oidc-hybrid\n');
  console.log('EXAMPLES:');
  console.log('  npm run service-discovery --list');
  console.log('  npm run service-discovery --flow oauth-authorization-code');
  console.log('  npm run service-discovery --search token');
  process.exit(0);
}

// Mock service data (in real implementation, this would import from the actual service)
const services = [
  {
    name: 'ComprehensiveCredentialsService',
    category: 'credentials',
    description: 'Unified credential management with validation and discovery',
    flows: ['oauth-authorization-code', 'oidc-authorization-code', 'oauth-client-credentials']
  },
  {
    name: 'UnifiedTokenDisplayService',
    category: 'tokens',
    description: 'Consistent token visualization with decoding and management',
    flows: ['oauth-authorization-code', 'oidc-authorization-code', 'oauth-implicit']
  },
  {
    name: 'ErrorHandlingService',
    category: 'error-handling',
    description: 'Comprehensive error classification and user-friendly messages',
    flows: ['all']
  },
  {
    name: 'EnhancedApiCallDisplayService',
    category: 'ui-components',
    description: 'Visual API call display with request/response details',
    flows: ['oauth-authorization-code', 'oauth-client-credentials']
  }
];

// Handle commands
if (args.includes('--list')) {
  console.log('📦 Available Services:\n');
  services.forEach(service => {
    console.log(`  ${service.name}`);
    console.log(`    ${service.description}`);
    console.log(`    Category: ${service.category}`);
    console.log(`    Flows: ${service.flows.join(', ')}\n`);
  });
} else if (args.includes('--flow')) {
  const flowIndex = args.indexOf('--flow');
  if (flowIndex + 1 < args.length) {
    const flowType = args[flowIndex + 1];
    console.log(`🌊 Services for ${flowType}:\n`);

    const relevantServices = services.filter(service =>
      service.flows.includes(flowType) || service.flows.includes('all')
    );

    if (relevantServices.length === 0) {
      console.log(`No services found for flow type: ${flowType}`);
    } else {
      relevantServices.forEach(service => {
        console.log(`  ✅ ${service.name}`);
        console.log(`     ${service.description}\n`);
      });
    }
  } else {
    console.log('❌ Please specify a flow type after --flow');
  }
} else if (args.includes('--search')) {
  const searchIndex = args.indexOf('--search');
  if (searchIndex + 1 < args.length) {
    const searchTerm = args[searchIndex + 1].toLowerCase();
    console.log(`🔍 Services matching "${searchTerm}":\n`);

    const matchingServices = services.filter(service =>
      service.name.toLowerCase().includes(searchTerm) ||
      service.description.toLowerCase().includes(searchTerm) ||
      service.category.toLowerCase().includes(searchTerm)
    );

    if (matchingServices.length === 0) {
      console.log(`No services found matching: ${searchTerm}`);
    } else {
      matchingServices.forEach(service => {
        console.log(`  🔍 ${service.name}`);
        console.log(`     ${service.description}`);
        console.log(`     Category: ${service.category}\n`);
      });
    }
  } else {
    console.log('❌ Please specify a search term after --search');
  }
} else {
  console.log('💡 Use --help to see available commands\n');
  console.log('Quick examples:');
  console.log('  npm run service-discovery --list');
  console.log('  npm run service-discovery --flow oauth-authorization-code');
  console.log('  npm run service-discovery --search credentials');
}
