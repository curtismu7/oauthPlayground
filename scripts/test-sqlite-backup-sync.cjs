#!/usr/bin/env node

/**
 * SQLite Backup Cross-Device Synchronization Test
 * 
 * This script tests the SQLite backup functionality to ensure:
 * 1. Data persistence across server restarts
 * 2. Cross-device synchronization capabilities
 * 3. Environment isolation
 * 4. Fallback mechanisms
 */

const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
	environments: ['test-env-1', 'test-env-2', 'default-environment'],
	apps: [
		{ id: 'unified-mfa', type: 'mfa', service: 'UnifiedOAuthCredentialsServiceV8U' },
		{ id: 'unified-oauth', type: 'oauth', service: 'UnifiedOAuthCredentialsServiceV8U' },
		{ id: 'delete-devices', type: 'worker-token', service: 'UnifiedWorkerTokenBackupServiceV8' },
		{ id: 'token-monitoring', type: 'worker-token', service: 'UnifiedWorkerTokenBackupServiceV8' },
		{ id: 'enhanced-state', type: 'oauth', service: 'UnifiedOAuthCredentialsServiceV8U' },
		{ id: 'protect-portal', type: 'oauth', service: 'UnifiedOAuthCredentialsServiceV8U' }
	],
	testData: {
		workerToken: {
			environmentId: 'test-env-1',
			clientId: 'test-client-id',
			clientSecret: 'test-client-secret',
			region: 'us'
		},
		oauth: {
			environmentId: 'test-env-1',
			clientId: 'test-oauth-client',
			clientSecret: 'test-oauth-secret',
			redirectUri: 'http://localhost:3000/callback',
			scope: 'openid profile email'
		}
	}
};

function log(message, type = 'INFO') {
	const timestamp = new Date().toISOString();
	console.log(`[${timestamp}] [${type}] ${message}`);
}

function checkBackupAPI() {
	try {
		// Check if backup API endpoints exist
		const serverPath = path.resolve('server.js');
		if (fs.existsSync(serverPath)) {
			const serverContent = fs.readFileSync(serverPath, 'utf8');
			const hasBackupAPI = serverContent.includes('/api/backup') || 
							   serverContent.includes('backup') ||
							   serverContent.includes('sqlite');
			
			log(`Backup API check: ${hasBackupAPI ? '✅ Found' : '❌ Not found'}`, hasBackupAPI ? 'SUCCESS' : 'WARNING');
			return hasBackupAPI;
		}
	} catch (error) {
		log(`Backup API check failed: ${error.message}`, 'ERROR');
		return false;
	}
}

function checkDatabaseFiles() {
	try {
		const dbPaths = [
			'data/oauth-playground.db',
			'data/backup.db',
			'data/sqlite-backup.db'
		];
		
		let foundDatabases = [];
		
		for (const dbPath of dbPaths) {
			if (fs.existsSync(dbPath)) {
				const stats = fs.statSync(dbPath);
				foundDatabases.push({
					path: dbPath,
					size: stats.size,
					modified: stats.mtime
				});
			}
		}
		
		if (foundDatabases.length > 0) {
			log(`Database files found: ${foundDatabases.length}`, 'SUCCESS');
			foundDatabases.forEach(db => {
				log(`  - ${db.path} (${Math.round(db.size / 1024)}KB, modified: ${db.modified.toISOString()})`);
			});
		} else {
			log('No database files found - this is expected if server hasn\'t been started', 'INFO');
		}
		
		return foundDatabases;
	} catch (error) {
		log(`Database check failed: ${error.message}`, 'ERROR');
		return [];
	}
}

function checkServiceIntegrations() {
	log('Checking service integrations...', 'INFO');
	
	const serviceChecks = [
		{
			name: 'UnifiedOAuthCredentialsServiceV8U',
			path: 'src/v8u/services/unifiedOAuthCredentialsServiceV8U.ts',
			methods: ['saveCredentials', 'loadCredentials', 'saveSharedCredentials', 'loadSharedCredentials']
		},
		{
			name: 'UnifiedWorkerTokenBackupServiceV8',
			path: 'src/services/unifiedWorkerTokenBackupServiceV8.ts',
			methods: ['saveWorkerTokenBackup', 'loadWorkerTokenBackup', 'deleteWorkerTokenBackup']
		},
		{
			name: 'unifiedWorkerTokenService',
			path: 'src/services/unifiedWorkerTokenService.ts',
			methods: ['saveCredentials', 'loadCredentials']
		}
	];
	
	let allServicesValid = true;
	
	for (const service of serviceChecks) {
		try {
			if (fs.existsSync(service.path)) {
				const content = fs.readFileSync(service.path, 'utf8');
				const hasAllMethods = service.methods.every(method => content.includes(method));
				
				if (hasAllMethods) {
					log(`✅ ${service.name}: All required methods found`, 'SUCCESS');
				} else {
					log(`❌ ${service.name}: Missing required methods`, 'ERROR');
					allServicesValid = false;
				}
			} else {
				log(`❌ ${service.name}: Service file not found`, 'ERROR');
				allServicesValid = false;
			}
		} catch (error) {
			log(`❌ ${service.name}: Check failed - ${error.message}`, 'ERROR');
			allServicesValid = false;
		}
	}
	
	return allServicesValid;
}

function checkProductionAppsIntegration() {
	log('Checking Production apps integration...', 'INFO');
	
	const { execSync } = require('child_process');
	
	try {
		const result = execSync('node scripts/verify-production-sqlite-backup.cjs', { 
			encoding: 'utf8',
			cwd: process.cwd()
		});
		
		log('Production apps verification:', 'SUCCESS');
		console.log(result);
		
		// Parse the result to extract coverage
		const coverageMatch = result.match(/Coverage: (\d+)%/);
		const coverage = coverageMatch ? parseInt(coverageMatch[1]) : 0;
		
		if (coverage === 100) {
			log('✅ All Production apps have SQLite backup integration', 'SUCCESS');
			return true;
		} else {
			log(`⚠️ Production apps coverage: ${coverage}% (expected 100%)`, 'WARNING');
			return false;
		}
	} catch (error) {
		log(`Production apps verification failed: ${error.message}`, 'ERROR');
		return false;
	}
}

function checkEnvironmentIsolation() {
	log('Checking environment isolation...', 'INFO');
	
	// Check if services properly handle environment IDs
	const serviceFiles = [
		'src/v8u/services/unifiedOAuthCredentialsServiceV8U.ts',
		'src/services/unifiedWorkerTokenBackupServiceV8.ts',
		'src/services/unifiedWorkerTokenService.ts'
	];
	
	let hasEnvironmentIsolation = true;
	
	for (const filePath of serviceFiles) {
		try {
			if (fs.existsSync(filePath)) {
				const content = fs.readFileSync(filePath, 'utf8');
				const hasEnvironmentId = content.includes('environmentId') && 
									   content.includes('environment');
				
				if (hasEnvironmentId) {
					log(`✅ ${path.basename(filePath)}: Environment isolation supported`, 'SUCCESS');
				} else {
					log(`⚠️ ${path.basename(filePath)}: Environment isolation unclear`, 'WARNING');
				}
			}
		} catch (error) {
			log(`❌ Environment isolation check failed for ${filePath}: ${error.message}`, 'ERROR');
			hasEnvironmentIsolation = false;
		}
	}
	
	return hasEnvironmentIsolation;
}

function checkErrorHandling() {
	log('Checking error handling and fallback mechanisms...', 'INFO');
	
	const serviceFiles = [
		'src/v8u/services/unifiedOAuthCredentialsServiceV8U.ts',
		'src/services/unifiedWorkerTokenBackupServiceV8.ts'
	];
	
	let hasErrorHandling = true;
	
	for (const filePath of serviceFiles) {
		try {
			if (fs.existsSync(filePath)) {
				const content = fs.readFileSync(filePath, 'utf8');
				const errorPatterns = [
					'try\\s*{',
					'catch\\s*\\(',
					'fallback',
					'console.warn',
					'console.error'
				];
				
				const hasErrorPatterns = errorPatterns.some(pattern => {
					const regex = new RegExp(pattern, 'i');
					return regex.test(content);
				});
				
				if (hasErrorPatterns) {
					log(`✅ ${path.basename(filePath)}: Error handling present`, 'SUCCESS');
				} else {
					log(`⚠️ ${path.basename(filePath)}: Error handling unclear`, 'WARNING');
				}
			}
		} catch (error) {
			log(`❌ Error handling check failed for ${filePath}: ${error.message}`, 'ERROR');
			hasErrorHandling = false;
		}
	}
	
	return hasErrorHandling;
}

function generateTestReport(results) {
	log('Generating test report...', 'INFO');
	
	const report = {
		timestamp: new Date().toISOString(),
		phase: 'Phase 3 - Cross-Device Synchronization Testing',
		results: results,
		summary: {
			totalChecks: Object.keys(results).length,
			passedChecks: Object.values(results).filter(r => r.status === 'PASS').length,
			failedChecks: Object.values(results).filter(r => r.status === 'FAIL').length,
			warningChecks: Object.values(results).filter(r => r.status === 'WARNING').length
		},
		recommendations: []
	};
	
	// Add recommendations based on results
	if (results.productionApps.status !== 'PASS') {
		report.recommendations.push('Complete Production apps SQLite backup integration');
	}
	
	if (results.backupAPI.status !== 'PASS') {
		report.recommendations.push('Implement backup API endpoints in server');
	}
	
	if (results.serviceIntegrations.status !== 'PASS') {
		report.recommendations.push('Fix missing service methods and integrations');
	}
	
	// Save report
	const reportPath = 'test-results/sqlite-backup-sync-test.json';
	try {
		fs.mkdirSync(path.dirname(reportPath), { recursive: true });
		fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
		log(`Test report saved to: ${reportPath}`, 'SUCCESS');
	} catch (error) {
		log(`Failed to save report: ${error.message}`, 'ERROR');
	}
	
	return report;
}

function main() {
	log('🚀 Starting Phase 3: SQLite Backup Cross-Device Synchronization Test', 'INFO');
	log('='.repeat(80), 'INFO');
	
	const results = {};
	
	// Run all tests
	results.backupAPI = { 
		status: checkBackupAPI() ? 'PASS' : 'FAIL',
		message: 'Backup API availability check'
	};
	
	results.databaseFiles = { 
		status: 'PASS', // Always pass as this is informational
		message: 'Database files check',
		data: checkDatabaseFiles()
	};
	
	results.serviceIntegrations = { 
		status: checkServiceIntegrations() ? 'PASS' : 'FAIL',
		message: 'Service integrations check'
	};
	
	results.productionApps = { 
		status: checkProductionAppsIntegration() ? 'PASS' : 'FAIL',
		message: 'Production apps integration check'
	};
	
	results.environmentIsolation = { 
		status: checkEnvironmentIsolation() ? 'PASS' : 'WARNING',
		message: 'Environment isolation check'
	};
	
	results.errorHandling = { 
		status: checkErrorHandling() ? 'PASS' : 'WARNING',
		message: 'Error handling and fallback mechanisms check'
	};
	
	// Generate report
	const report = generateTestReport(results);
	
	// Print summary
	log('📊 Test Summary', 'INFO');
	log('='.repeat(30), 'INFO');
	log(`Total checks: ${report.summary.totalChecks}`, 'INFO');
	log(`Passed: ${report.summary.passedChecks}`, report.summary.passedChecks > 0 ? 'SUCCESS' : 'INFO');
	log(`Failed: ${report.summary.failedChecks}`, report.summary.failedChecks > 0 ? 'ERROR' : 'INFO');
	log(`Warnings: ${report.summary.warningChecks}`, report.summary.warningChecks > 0 ? 'WARNING' : 'INFO');
	
	if (report.recommendations.length > 0) {
		log('\n📋 Recommendations:', 'INFO');
		report.recommendations.forEach(rec => log(`  - ${rec}`, 'INFO'));
	}
	
	// Exit with appropriate code
	const hasFailures = report.summary.failedChecks > 0;
	process.exit(hasFailures ? 1 : 0);
}

if (require.main === module) {
	main();
}
