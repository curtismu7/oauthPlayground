// src/services/configurationManagerDemo.js
// Demo of Enhanced Configuration Service
// Shows the capabilities without complex imports

const args = process.argv.slice(2);

console.log('🔧 Enhanced Configuration Service Demo\n');

// Mock configuration data to demonstrate functionality
const mockConfigs = {
	'oauth-authorization-code': {
		flowType: 'oauth-authorization-code',
		responseTypes: ['code'],
		grantTypes: ['authorization_code'],
		scopes: ['openid', 'profile', 'email'],
		requirePkce: true,
		allowHttpRedirects: false,
		enforceState: true,
		showAdvancedOptions: false,
		enableDebugMode: false,
		displayTokenDetails: true,
		validateRedirectUris: true,
		validateScopes: true,
		validateClientCredentials: true,
		requestTimeout: 30000,
		tokenExchangeTimeout: 30000,
		enableTokenIntrospection: true,
		enableTokenRevocation: true,
		enableRefreshTokens: true,
		enableBackChannelLogout: false,
		enablePar: true,
		enableCiba: false,
		enableDeviceFlow: false,
	},
	'oidc-authorization-code': {
		flowType: 'oidc-authorization-code',
		responseTypes: ['code'],
		grantTypes: ['authorization_code'],
		scopes: ['openid', 'profile', 'email', 'address', 'phone'],
		requirePkce: true,
		allowHttpRedirects: false,
		enforceState: true,
		showAdvancedOptions: false,
		enableDebugMode: false,
		displayTokenDetails: true,
		validateRedirectUris: true,
		validateScopes: true,
		validateClientCredentials: true,
		requestTimeout: 30000,
		tokenExchangeTimeout: 30000,
		enableTokenIntrospection: true,
		enableTokenRevocation: true,
		enableRefreshTokens: true,
		enableBackChannelLogout: true,
		enablePar: true,
		enableCiba: false,
		enableDeviceFlow: false,
	},
};

// Environment overrides simulation
const environmentOverrides = {
	development: {
		enableDebugLogging: true,
		allowInsecureRedirects: true,
		featureFlags: { experimentalFeatures: true },
	},
	production: {
		enableDebugLogging: false,
		allowInsecureRedirects: false,
		featureFlags: { securityHardening: true },
	},
};

function mergeConfigurations(baseConfig, envOverrides) {
	const merged = { ...baseConfig };

	if (envOverrides.enableDebugLogging !== undefined) {
		merged.enableDebugMode = envOverrides.enableDebugLogging;
	}

	if (envOverrides.allowInsecureRedirects !== undefined) {
		merged.allowHttpRedirects = envOverrides.allowInsecureRedirects;
	}

	if (envOverrides.featureFlags?.securityHardening) {
		merged.requirePkce = true;
		merged.validateRedirectUris = true;
	}

	return merged;
}

function validateConfiguration(config) {
	const errors = [];
	const warnings = [];
	const suggestions = [];

	// Security validations
	if (config.allowHttpRedirects && config.flowType !== 'oauth-implicit') {
		warnings.push({
			field: 'allowHttpRedirects',
			message: 'HTTP redirects enabled for non-implicit flow',
			impact: 'Reduces security by allowing unencrypted redirects',
		});
	}

	if (!config.requirePkce && config.responseTypes.includes('code')) {
		errors.push({
			field: 'requirePkce',
			message: 'PKCE required for authorization code flows',
			suggestion: 'Set requirePkce to true for authorization code flows',
		});
	}

	// Flow-specific validations
	if (config.flowType === 'oauth-client-credentials') {
		if (config.responseTypes.length > 0) {
			errors.push({
				field: 'responseTypes',
				message: 'Client credentials flow should not specify response types',
				suggestion: 'Set responseTypes to empty array for client credentials flow',
			});
		}
	}

	// OIDC validations
	if (config.flowType.includes('oidc')) {
		if (!config.scopes.includes('openid')) {
			errors.push({
				field: 'scopes',
				message: 'OpenID Connect flows must include openid scope',
				suggestion: 'Add "openid" to the scopes array',
			});
		}
	}

	// Suggestions
	if (!config.enablePar && config.flowType === 'oauth-authorization-code') {
		suggestions.push({
			field: 'enablePar',
			reason: 'Pushed Authorization Requests improve security',
			benefit: 'Reduces authorization code interception risk',
		});
	}

	return {
		isValid: errors.length === 0,
		errors,
		warnings,
		suggestions,
	};
}

// Handle commands
if (args.includes('--help') || args.includes('-h') || args.length === 0) {
	console.log('USAGE: npm run config [command] [options]\n');
	console.log('COMMANDS:');
	console.log('  get          Get configuration for a flow type');
	console.log('  validate     Validate configuration for a flow type');
	console.log('  help         Show this help message\n');
	console.log('OPTIONS:');
	console.log('  --flow <type>    Flow type (oauth-authorization-code, oidc-authorization-code)');
	console.log('  --env <env>      Environment (development, production)\n');
	console.log('EXAMPLES:');
	console.log('  npm run config get --flow oauth-authorization-code');
	console.log('  npm run config validate --flow oidc-authorization-code --env production');
	process.exit(0);
}

if (args.includes('get')) {
	const flowIndex = args.indexOf('--flow');
	const envIndex = args.indexOf('--env');

	if (flowIndex === -1 || flowIndex + 1 >= args.length) {
		console.log('❌ Flow type is required. Use --flow <type>');
		process.exit(1);
	}

	const flowType = args[flowIndex + 1];
	const environment =
		envIndex !== -1 && envIndex + 1 < args.length ? args[envIndex + 1] : 'development';

	console.log(`📋 Getting configuration for ${flowType} in ${environment}...\n`);

	const baseConfig = mockConfigs[flowType];
	if (!baseConfig) {
		console.log(`❌ Unknown flow type: ${flowType}`);
		process.exit(1);
	}

	const envOverrides = environmentOverrides[environment] || {};
	const finalConfig = mergeConfigurations(baseConfig, envOverrides);

	console.log('🔧 Configuration Details:');
	console.log(`   Flow Type: ${finalConfig.flowType}`);
	console.log(`   Response Types: ${finalConfig.responseTypes.join(', ')}`);
	console.log(`   Grant Types: ${finalConfig.grantTypes.join(', ')}`);
	console.log(`   Scopes: ${finalConfig.scopes.join(', ')}`);
	console.log(`   Require PKCE: ${finalConfig.requirePkce}`);
	console.log(`   Enable Debug: ${finalConfig.enableDebugMode}`);
	console.log(`   Request Timeout: ${finalConfig.requestTimeout}ms`);
	console.log(`   Token Introspection: ${finalConfig.enableTokenIntrospection}`);
	console.log(`   PAR Enabled: ${finalConfig.enablePar}`);
} else if (args.includes('validate')) {
	const flowIndex = args.indexOf('--flow');
	const envIndex = args.indexOf('--env');

	if (flowIndex === -1 || flowIndex + 1 >= args.length) {
		console.log('❌ Flow type is required. Use --flow <type>');
		process.exit(1);
	}

	const flowType = args[flowIndex + 1];
	const environment =
		envIndex !== -1 && envIndex + 1 < args.length ? args[envIndex + 1] : 'development';

	console.log(`🔍 Validating configuration for ${flowType} in ${environment}...\n`);

	const baseConfig = mockConfigs[flowType];
	if (!baseConfig) {
		console.log(`❌ Unknown flow type: ${flowType}`);
		process.exit(1);
	}

	const envOverrides = environmentOverrides[environment] || {};
	const finalConfig = mergeConfigurations(baseConfig, envOverrides);
	const validation = validateConfiguration(finalConfig);

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
				console.log(`      Benefit: ${suggestion.benefit}`);
			});
		}
	}
} else {
	console.log('❌ Unknown command. Use --help for available commands.');
	process.exit(1);
}
