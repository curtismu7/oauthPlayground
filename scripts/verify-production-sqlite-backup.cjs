#!/usr/bin/env node

/**
 * Production Apps SQLite Backup Verification Script
 * 
 * This script verifies that all Production menu apps have SQLite backup integration
 * and provides a summary of the current state.
 */

const fs = require('fs');
const path = require('path');

// Production apps configuration
const PRODUCTION_APPS = {
	'unified-mfa': {
		name: 'Unified MFA',
		path: 'src/v8/flows/unified/UnifiedMFARegistrationFlowV8_Legacy.tsx',
		type: 'mfa',
		expectedService: 'UnifiedOAuthCredentialsServiceV8U'
	},
	'unified-oauth': {
		name: 'Unified OAuth & OIDC',
		path: 'src/v8u/flows/UnifiedOAuthFlowV8U.tsx',
		type: 'oauth',
		expectedService: 'UnifiedOAuthCredentialsServiceV8U'
	},
	'delete-devices': {
		name: 'Delete All Devices',
		path: 'src/v8/pages/DeleteAllDevicesUtilityV8.tsx',
		type: 'worker-token',
		expectedService: 'UnifiedWorkerTokenBackupServiceV8'
	},
	'token-monitoring': {
		name: 'Token Monitoring Dashboard',
		path: 'src/v8u/pages/TokenMonitoringPage.tsx',
		type: 'worker-token',
		expectedService: 'UnifiedWorkerTokenBackupServiceV8'
	},
	'enhanced-state': {
		name: 'Enhanced State Management',
		path: 'src/v8u/pages/EnhancedStateManagementPage.tsx',
		type: 'oauth',
		expectedService: 'UnifiedOAuthCredentialsServiceV8U'
	},
	'protect-portal': {
		name: 'Protect Portal App',
		path: 'src/pages/protect-portal/ProtectPortalApp.tsx',
		type: 'oauth',
		expectedService: 'UnifiedOAuthCredentialsServiceV8U'
	}
};

function checkFileExists(filePath) {
	try {
		return fs.existsSync(filePath);
	} catch (error) {
		return false;
	}
}

function checkServiceUsage(filePath, serviceName) {
	try {
		if (!fs.existsSync(filePath)) {
			return { exists: false, hasService: false };
		}
		
		const content = fs.readFileSync(filePath, 'utf8');
		
		// Check for actual usage patterns, not just imports
		const usagePatterns = [
			`${serviceName}.saveCredentials`,
			`${serviceName}.loadCredentials`,
			`${serviceName}.saveSharedCredentials`,
			`${serviceName}.loadSharedCredentials`,
			`${serviceName}.saveWorkerTokenBackup`,
			`${serviceName}.loadWorkerTokenBackup`,
		];
		
		const hasUsage = usagePatterns.some(pattern => content.includes(pattern));
		const hasImport = content.includes(serviceName);
		
		return { exists: true, hasService: hasUsage || hasImport };
	} catch (error) {
		return { exists: false, hasService: false, error: error.message };
	}
}

function main() {
	console.log('🔍 Production Apps SQLite Backup Verification');
	console.log('='.repeat(50));
	
	const results = [];
	let totalApps = 0;
	let appsWithBackup = 0;
	let appsNeedingIntegration = 0;
	
	for (const [appId, config] of Object.entries(PRODUCTION_APPS)) {
		totalApps++;
		
		const filePath = path.resolve(config.path);
		const fileExists = checkFileExists(filePath);
		const serviceCheck = fileExists ? checkServiceUsage(filePath, config.expectedService) : { exists: false, hasService: false };
		
		const hasBackup = serviceCheck.hasService;
		const status = hasBackup ? '✅' : '❌';
		
		if (hasBackup) {
			appsWithBackup++;
		} else {
			appsNeedingIntegration++;
		}
		
		results.push({
			appId,
			name: config.name,
			type: config.type,
			path: config.path,
			fileExists,
			hasBackup,
			status
		});
		
		console.log(`${status} ${config.name} (${appId})`);
		console.log(`   Type: ${config.type}`);
		console.log(`   Path: ${config.path}`);
		console.log(`   File exists: ${fileExists ? 'Yes' : 'No'}`);
		console.log(`   SQLite backup: ${hasBackup ? 'Yes' : 'No'}`);
		console.log('');
	}
	
	// Summary
	console.log('📊 Summary');
	console.log('='.repeat(30));
	console.log(`Total Production apps: ${totalApps}`);
	console.log(`Apps with SQLite backup: ${appsWithBackup}`);
	console.log(`Apps needing integration: ${appsNeedingIntegration}`);
	console.log(`Coverage: ${Math.round((appsWithBackup / totalApps) * 100)}%`);
	console.log('');
	
	// Apps needing integration
	if (appsNeedingIntegration > 0) {
		console.log('🔧 Apps needing SQLite backup integration:');
		console.log('-'.repeat(40));
		results.filter(r => !r.hasBackup).forEach(result => {
			console.log(`❌ ${result.name} (${result.appId})`);
			console.log(`   Expected service: ${PRODUCTION_APPS[result.appId].expectedService}`);
			console.log(`   Action: Add ${PRODUCTION_APPS[result.appId].expectedService} import and usage`);
		});
	} else {
		console.log('🎉 All Production apps have SQLite backup integration!');
	}
	
	// Exit with appropriate code
	process.exit(appsNeedingIntegration > 0 ? 1 : 0);
}

if (require.main === module) {
	main();
}
