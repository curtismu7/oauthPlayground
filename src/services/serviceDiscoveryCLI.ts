#!/usr/bin/env node

// src/services/serviceDiscoveryCLI.ts
// Command-line interface for service discovery
// Allows developers to explore services from the terminal

import { FlowType, ServiceCategory, ServiceDiscoveryService } from './serviceDiscoveryService.js';

interface CLIOptions {
	flowType?: FlowType;
	category?: ServiceCategory;
	search?: string;
	details?: boolean;
	examples?: boolean;
	json?: boolean;
}

class ServiceDiscoveryCLI {
	private static parseArgs(): CLIOptions {
		const args = process.argv.slice(2);
		const options: CLIOptions = {};

		for (let i = 0; i < args.length; i++) {
			const arg = args[i];
			const nextArg = args[i + 1];

			switch (arg) {
				case '--flow':
				case '--flow-type':
					if (nextArg && Object.values(FlowType).includes(nextArg as FlowType)) {
						options.flowType = nextArg as FlowType;
						i++; // Skip next arg
					}
					break;

				case '--category':
				case '--cat':
					if (nextArg && Object.values(ServiceCategory).includes(nextArg as ServiceCategory)) {
						options.category = nextArg as ServiceCategory;
						i++; // Skip next arg
					}
					break;

				case '--search':
				case '--query':
				case '-q':
					if (nextArg) {
						options.search = nextArg;
						i++; // Skip next arg
					}
					break;

				case '--details':
				case '--detail':
				case '-d':
					options.details = true;
					break;

				case '--examples':
				case '--example':
				case '-e':
					options.examples = true;
					break;

				case '--json':
				case '-j':
					options.json = true;
					break;

				case '--help':
				case '-h':
					ServiceDiscoveryCLI.showHelp();
					process.exit(0);
					break;
			}
		}

		return options;
	}

	private static showHelp(): void {
		console.log(`
🔍 MasterFlow API Service Discovery CLI

USAGE:
  npx service-discovery [options]

OPTIONS:
  --flow, --flow-type <type>    Filter by flow type (e.g., oauth-authorization-code)
  --category, --cat <category>  Filter by category (e.g., credentials, tokens)
  --search, --query, -q <text>  Search services by name, description, or features
  --details, -d                 Show detailed information for each service
  --examples, -e                Include usage examples
  --json, -j                    Output in JSON format
  --help, -h                    Show this help message

FLOW TYPES:
  oauth-authorization-code    OAuth 2.0 Authorization Code Flow
  oauth-implicit             OAuth 2.0 Implicit Flow
  oauth-client-credentials   OAuth 2.0 Client Credentials Flow
  oauth-device-code          OAuth 2.0 Device Authorization Flow
  oidc-authorization-code    OIDC Authorization Code Flow
  oidc-implicit             OIDC Implicit Flow
  oidc-hybrid               OIDC Hybrid Flow
  oidc-device-authorization OIDC Device Authorization Flow

CATEGORIES:
  credentials    Credential management services
  tokens         Token handling services
  authentication Authentication flow services
  authorization  Authorization services
  ui-components  UI component services
  configuration  Configuration services
  validation     Validation services
  logging        Logging services
  analytics      Analytics services
  error-handling Error handling services
  flow-control   Flow control services
  utilities      Utility services

EXAMPLES:
  # Show all services
  npx service-discovery

  # Find services for OAuth Authorization Code flow
  npx service-discovery --flow oauth-authorization-code

  # Search for token-related services
  npx service-discovery --search token

  # Get detailed info about credential services
  npx service-discovery --category credentials --details

  # Show usage examples for token services
  npx service-discovery --category tokens --examples

  # Get recommendations for OIDC flows in JSON format
  npx service-discovery --flow oidc-authorization-code --json
`);
	}

	private static displayService(service: any, options: CLIOptions): void {
		console.log(`\n📦 ${service.name}`);
		console.log(`   ${service.description}`);

		if (options.details) {
			console.log(`\n   📂 Category: ${service.category}`);
			console.log(`   🔧 Complexity: ${service.complexity}`);
			console.log(`   📊 Maturity: ${service.maturity}`);
			console.log(`   📋 Version: ${service.version}`);
			console.log(`   👤 Author: ${service.author}`);

			if (service.supportedFlowTypes?.length > 0) {
				console.log(`   🌊 Supported Flows: ${service.supportedFlowTypes.join(', ')}`);
			}

			if (service.features?.length > 0) {
				console.log(`\n   ✨ Features:`);
				service.features.forEach((feature: string) => {
					console.log(`     • ${feature}`);
				});
			}

			if (service.dependencies?.length > 0) {
				console.log(`\n   🔗 Dependencies:`);
				service.dependencies.forEach((dep: any) => {
					console.log(
						`     • ${dep.name}: ${dep.purpose}${dep.required ? ' (required)' : ' (optional)'}`
					);
				});
			}

			if (options.examples && service.usageExamples?.length > 0) {
				console.log(`\n   💡 Usage Examples:`);
				service.usageExamples.forEach((example: any, index: number) => {
					console.log(`\n     ${index + 1}. ${example.title}`);
					console.log(`        ${example.description}`);
					console.log(`\n        ${example.code.replace(/\n/g, '\n        ')}`);
				});
			}

			if (service.bestPractices?.length > 0) {
				console.log(`\n   🎯 Best Practices:`);
				service.bestPractices.forEach((practice: string) => {
					console.log(`     • ${practice}`);
				});
			}

			if (service.relatedServices?.length > 0) {
				console.log(`\n   🤝 Related Services: ${service.relatedServices.join(', ')}`);
			}
		}

		console.log(''); // Empty line between services
	}

	private static displayStatistics(): void {
		const stats = ServiceDiscoveryService.getServiceStatistics();

		console.log('\n📊 Service Registry Statistics:');
		console.log(`   Total Services: ${stats.totalServices}`);

		console.log('\n   Services by Category:');
		Object.entries(stats.servicesByCategory).forEach(([category, count]) => {
			if (count > 0) {
				console.log(`     ${category}: ${count}`);
			}
		});

		console.log('\n   Services by Maturity:');
		Object.entries(stats.servicesByMaturity).forEach(([maturity, count]) => {
			if (count > 0) {
				console.log(`     ${maturity}: ${count}`);
			}
		});

		console.log('\n   Services by Complexity:');
		Object.entries(stats.servicesByComplexity).forEach(([complexity, count]) => {
			if (count > 0) {
				console.log(`     ${complexity}: ${count}`);
			}
		});

		console.log('');
	}

	static run(): void {
		try {
			const options = ServiceDiscoveryCLI.parseArgs();

			// Show statistics
			ServiceDiscoveryCLI.displayStatistics();

			let services: any[] = [];
			let title = 'Available Services';

			if (options.flowType) {
				// Get recommendations for specific flow type
				const recommendations = ServiceDiscoveryService.getServiceRecommendations(options.flowType);
				services = recommendations.map((rec) => ({
					...rec.service,
					relevance: rec.relevance,
					rationale: rec.rationale,
				}));
				title = `Recommended Services for ${options.flowType}`;
			} else {
				// Get filtered services
				const searchQuery: any = {};

				if (options.category) searchQuery.category = options.category;
				if (options.search) searchQuery.keywords = [options.search];

				services = ServiceDiscoveryService.findServices(searchQuery);
			}

			if (options.json) {
				console.log(
					JSON.stringify(
						{
							title,
							services,
							count: services.length,
							options,
						},
						null,
						2
					)
				);
				return;
			}

			console.log(`🔍 ${title} (${services.length} found)\n`);

			if (services.length === 0) {
				console.log(
					'No services found matching your criteria. Try adjusting your search or use --help for options.'
				);
				return;
			}

			services.forEach((service) => {
				ServiceDiscoveryCLI.displayService(service, options);
			});

			console.log(`\n💡 Tip: Use --details for more information or --examples to see usage code.`);
			console.log(`🔗 Use --json for machine-readable output.`);
		} catch (error) {
			console.error('❌ Error running service discovery:', error);
			process.exit(1);
		}
	}
}

// Run the CLI if this file is executed directly
if (require.main === module) {
	ServiceDiscoveryCLI.run();
}

export default ServiceDiscoveryCLI;
