#!/usr/bin/env node

/**
 * Cross-App Service Dependency Checker
 * 
 * This script analyzes service dependencies across all apps and identifies
 * which apps will be impacted when a service is updated.
 * 
 * Usage: node scripts/crossAppServiceChecker.js [--service serviceName] [--app appName] [--list-services] [--list-apps]
 */

const fs = require('fs');
const path = require('path');

// Configuration
const APPS_DIR = path.join(__dirname, '../src/apps');
const SHARED_DIR = path.join(__dirname, '../src/shared');
const V8_DIR = path.join(__dirname, '../src/v8');

// Service dependency mapping
const SERVICE_DEPENDENCIES = new Map();
const APP_DEPENDENCIES = new Map();

/**
 * Extract import statements from a file
 */
function extractImports(filePath) {
	const content = fs.readFileSync(filePath, 'utf8');
	const imports = [];
	
	// Match import statements
	const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
	let match;
	
	while ((match = importRegex.exec(content)) !== null) {
		imports.push(match[1]);
	}
	
	return imports;
}

/**
 * Categorize import path
 */
function categorizeImport(importPath) {
	if (importPath.startsWith('@/apps/')) {
		return 'app';
	} else if (importPath.startsWith('@/shared/')) {
		return 'shared';
	} else if (importPath.startsWith('@/v8/')) {
		return 'legacy';
	} else if (importPath.startsWith('.')) {
		return 'local';
	} else {
		return 'external';
	}
}

/**
 * Extract service name from import path
 */
function extractServiceName(importPath) {
	// Extract service name from paths like:
	// - @/apps/mfa/services/mfaServiceV8 -> mfaServiceV8
	// - @/shared/services/userServiceV8 -> userServiceV8
	// - @/v8/services/credentialsServiceV8 -> credentialsServiceV8
	
	const parts = importPath.split('/');
	const serviceIndex = parts.findIndex(part => part === 'services');
	
	if (serviceIndex !== -1 && serviceIndex + 1 < parts.length) {
		return parts[serviceIndex + 1];
	}
	
	return null;
}

/**
 * Analyze a single file for dependencies
 */
function analyzeFile(filePath, appName) {
	const imports = extractImports(filePath);
	const fileDependencies = [];
	
	for (const importPath of imports) {
		const category = categorizeImport(importPath);
		const serviceName = extractServiceName(importPath);
		
		if (serviceName) {
			fileDependencies.push({
				importPath,
				category,
				serviceName,
				app: category === 'app' ? importPath.split('/')[2] : null
			});
		}
	}
	
	return fileDependencies;
}

/**
 * Scan all apps for service dependencies
 */
function scanApps() {
	const apps = ['oauth', 'mfa', 'flows', 'unified'];
	
	for (const appName of apps) {
		const appDir = path.join(APPS_DIR, appName);
		if (!fs.existsSync(appDir)) continue;
		
		const appDependencies = new Set();
		
		// Scan all TypeScript/JavaScript files in the app
		function scanDirectory(dir) {
			const files = fs.readdirSync(dir);
			
			for (const file of files) {
				const filePath = path.join(dir, file);
				const stat = fs.statSync(filePath);
				
				if (stat.isDirectory()) {
					scanDirectory(filePath);
				} else if (file.match(/\.(ts|tsx|js|jsx)$/)) {
					const dependencies = analyzeFile(filePath, appName);
					for (const dep of dependencies) {
						appDependencies.add(dep.serviceName);
						
						// Track reverse dependencies
						if (!SERVICE_DEPENDENCIES.has(dep.serviceName)) {
							SERVICE_DEPENDENCIES.set(dep.serviceName, new Set());
						}
						SERVICE_DEPENDENCIES.get(dep.serviceName).add(appName);
					}
				}
			}
		}
		
		scanDirectory(appDir);
		APP_DEPENDENCIES.set(appName, appDependencies);
	}
}

/**
 * Get apps that depend on a specific service
 */
function getAppsDependingOnService(serviceName) {
	return SERVICE_DEPENDENCIES.get(serviceName) || new Set();
}

/**
 * Get services that an app depends on
 */
function getServicesDependedByApp(appName) {
	return APP_DEPENDENCIES.get(appName) || new Set();
}

/**
 * List all services and their dependencies
 */
function listAllServices() {
	console.log('\n🔍 All Services and Their Dependencies:');
	console.log('=' .repeat(50));
	
	for (const [serviceName, dependentApps] of SERVICE_DEPENDENCIES) {
		const apps = Array.from(dependentApps).sort();
		console.log(`\n📦 ${serviceName}:`);
		if (apps.length === 0) {
			console.log('   ⚠️  No dependent apps found');
		} else {
			apps.forEach(app => {
				console.log(`   📱 ${app}`);
			});
		}
	}
}

/**
 * List all apps and their dependencies
 */
function listAllApps() {
	console.log('\n📱 All Apps and Their Service Dependencies:');
	console.log('=' .repeat(50));
	
	for (const [appName, services] of APP_DEPENDENCIES) {
		const serviceList = Array.from(services).sort();
		console.log(`\n📱 ${appName}:`);
		if (serviceList.length === 0) {
			console.log('   ⚠️  No service dependencies found');
		} else {
			serviceList.forEach(service => {
				console.log(`   📦 ${service}`);
			});
		}
	}
}

/**
 * Check impact of service update
 */
function checkServiceImpact(serviceName) {
	const dependentApps = getAppsDependingOnService(serviceName);
	
	console.log(`\n🔍 Impact Analysis for Service: ${serviceName}`);
	console.log('=' .repeat(50));
	
	if (dependentApps.size === 0) {
		console.log('✅ No apps depend on this service - Safe to update');
		return;
	}
	
	console.log(`\n⚠️  ${dependentApps.size} app(s) depend on this service:`);
	
	for (const app of dependentApps) {
		console.log(`\n📱 ${app}:`);
		
		// Get specific files that import this service
		const appDir = path.join(APPS_DIR, app);
		const filesUsingService = [];
		
		function scanDirectory(dir) {
			const files = fs.readdirSync(dir);
			
			for (const file of files) {
				const filePath = path.join(dir, file);
				const stat = fs.statSync(filePath);
				
				if (stat.isDirectory()) {
					scanDirectory(filePath);
				} else if (file.match(/\.(ts|tsx|js|jsx)$/)) {
					const dependencies = analyzeFile(filePath, app);
					const usesService = dependencies.some(dep => dep.serviceName === serviceName);
					if (usesService) {
						const relativePath = path.relative(appDir, filePath);
						filesUsingService.push(relativePath);
					}
				}
			}
		}
		
		scanDirectory(appDir);
		
		if (filesUsingService.length > 0) {
			console.log('   📁 Files using this service:');
			filesUsingService.forEach(file => {
				console.log(`     • ${file}`);
			});
		}
		
		// Check if app has tests
		const testDir = path.join(appDir, '__tests__');
		if (fs.existsSync(testDir)) {
			console.log('   🧪 Has test directory - Run tests after update');
		} else {
			console.log('   ⚠️  No test directory found - Manual testing required');
		}
	}
	
	console.log('\n📋 Recommended Actions:');
	console.log('   1. Update the service');
	console.log('   2. Run build: npm run build');
	console.log('   3. Run tests for each affected app');
	console.log('   4. Test functionality manually in each affected app');
	console.log('   5. Update documentation if API changed');
}

/**
 * Generate service dependency report
 */
function generateDependencyReport() {
	const report = {
		timestamp: new Date().toISOString(),
		totalServices: SERVICE_DEPENDENCIES.size,
		totalApps: APP_DEPENDENCIES.size,
		services: {},
		apps: {}
	};
	
	// Service dependencies
	for (const [serviceName, dependentApps] of SERVICE_DEPENDENCIES) {
		report.services[serviceName] = {
			dependentApps: Array.from(dependentApps),
			riskLevel: dependentApps.size > 2 ? 'HIGH' : dependentApps.size > 0 ? 'MEDIUM' : 'LOW'
		};
	}
	
	// App dependencies
	for (const [appName, services] of APP_DEPENDENCIES) {
		report.apps[appName] = {
			serviceDependencies: Array.from(services),
			dependencyCount: services.size
		};
	}
	
	// Write report to file
	const reportPath = path.join(__dirname, '../service-dependency-report.json');
	fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
	
	console.log(`\n📊 Dependency report generated: ${reportPath}`);
	
	// Show high-risk services
	const highRiskServices = Object.entries(report.services)
		.filter(([_, info]) => info.riskLevel === 'HIGH')
		.map(([name, _]) => name);
	
	if (highRiskServices.length > 0) {
		console.log('\n🚨 High-Risk Services (used by 3+ apps):');
		highRiskServices.forEach(service => {
			console.log(`   • ${service} (${report.services[service].dependentApps.length} apps)`);
		});
	}
}

/**
 * Main execution
 */
function main() {
	const args = process.argv.slice(2);
	const options = {
		service: null,
		app: null,
		listServices: false,
		listApps: false,
		report: false
	};
	
	// Parse arguments
	for (let i = 0; i < args.length; i++) {
		switch (args[i]) {
			case '--service':
				options.service = args[++i];
				break;
			case '--app':
				options.app = args[++i];
				break;
			case '--list-services':
				options.listServices = true;
				break;
			case '--list-apps':
				options.listApps = true;
				break;
			case '--report':
				options.report = true;
				break;
			case '--help':
			case '-h':
				console.log(`
Cross-App Service Dependency Checker

Usage: node ${path.basename(__filename)} [options]

Options:
  --service <name>     Show apps that depend on this service
  --app <name>         Show services this app depends on
  --list-services      List all services and their dependencies
  --list-apps          List all apps and their dependencies
  --report             Generate dependency report
  --help, -h           Show this help

Examples:
  node ${path.basename(__filename)} --service mfaServiceV8
  node ${path.basename(__filename)} --app mfa
  node ${path.basename(__filename)} --list-services
  node ${path.basename(__filename)} --report
				`);
				return;
		}
	}
	
	// Scan all apps for dependencies
	console.log('🔍 Scanning apps for service dependencies...');
	scanApps();
	
	// Execute requested action
	if (options.service) {
		checkServiceImpact(options.service);
	} else if (options.app) {
		const services = getServicesDependedByApp(options.app);
		console.log(`\n📱 Services used by ${options.app}:`);
		if (services.size === 0) {
			console.log('   ⚠️  No service dependencies found');
		} else {
			Array.from(services).sort().forEach(service => {
				console.log(`   📦 ${service}`);
			});
		}
	} else if (options.listServices) {
		listAllServices();
	} else if (options.listApps) {
		listAllApps();
	} else if (options.report) {
		generateDependencyReport();
	} else {
		console.log('\n📊 Cross-App Service Dependency Summary:');
		console.log(`   📦 Total Services: ${SERVICE_DEPENDENCIES.size}`);
		console.log(`   📱 Total Apps: ${APP_DEPENDENCIES.size}`);
		
		// Show high-risk services
		const highRiskServices = Array.from(SERVICE_DEPENDENCIES.entries())
			.filter(([_, apps]) => apps.size > 2);
		
		if (highRiskServices.length > 0) {
			console.log(`\n🚨 High-Risk Services (used by 3+ apps):`);
			highRiskServices.forEach(([service, apps]) => {
				console.log(`   • ${service} (${apps.size} apps)`);
			});
		}
		
		console.log('\nUse --help for more options');
	}
}

// Run if executed directly
if (require.main === module) {
	main();
}

module.exports = {
	scanApps,
	getAppsDependingOnService,
	getServicesDependedByApp,
	generateDependencyReport
};
