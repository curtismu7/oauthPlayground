#!/usr/bin/env node

/**
 * Dashboard Update Script - Runs on Commit
 * Automatically updates dashboards when changes are committed
 * @version 1.0.0
 * @since 2026-03-10
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');

// ============================================================================
// DASHBOARD CONFIGURATION
// ============================================================================

const DASHBOARD_CONFIG = {
	// Token Monitoring Dashboard
	tokenMonitoring: {
		script: path.join(PROJECT_ROOT, 'scripts', 'update-dashboards.mjs'),
		description: 'Token Monitoring Dashboard',
		priority: 1,
	},
	
	// API Call Statistics Dashboard  
	apiStats: {
		script: path.join(PROJECT_ROOT, 'scripts', 'update-api-stats-dashboard.mjs'),
		description: 'API Call Statistics Dashboard',
		priority: 2,
	},
	
	// User Activity Dashboard
	userActivity: {
		script: path.join(PROJECT_ROOT, 'scripts', 'update-user-activity-dashboard.mjs'),
		description: 'User Activity Dashboard', 
		priority: 3,
	},
	
	// Performance Metrics Dashboard
	performance: {
		script: path.join(PROJECT_ROOT, 'scripts', 'update-performance-dashboard.mjs'),
		description: 'Performance Metrics Dashboard',
		priority: 4,
	},
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Log message with timestamp
 */
function log(message, type = 'INFO') {
	const timestamp = new Date().toISOString();
	console.log(`[${timestamp}] [${type}] [DASHBOARD-UPDATE] ${message}`);
}

/**
 * Check if a dashboard script exists and is executable
 */
function validateDashboardScript(config) {
	if (!fs.existsSync(config.script)) {
		log(`Dashboard script not found: ${config.script}`, 'WARN');
		return false;
	}
	
	try {
		// Check if script is readable
		fs.accessSync(config.script, fs.constants.R_OK);
		return true;
	} catch (error) {
		log(`Dashboard script not accessible: ${config.script}`, 'ERROR');
		return false;
	}
}

/**
 * Execute a dashboard update script
 */
async function executeDashboardScript(config) {
	try {
		log(`Starting update: ${config.description}`);
		
		// Import and execute the dashboard script
		const { updateDashboard } = await import(config.script);
		
		if (typeof updateDashboard === 'function') {
			const result = await updateDashboard();
			
			if (result.success) {
				log(`✅ Updated: ${config.description} - ${result.message || 'Success'}`);
				return { success: true, message: result.message };
			} else {
				log(`❌ Failed: ${config.description} - ${result.error || 'Unknown error'}`, 'ERROR');
				return { success: false, error: result.error };
			}
		} else {
			log(`❌ Invalid script format: ${config.description}`, 'ERROR');
			return { success: false, error: 'Invalid script format' };
		}
	} catch (error) {
		log(`❌ Script execution error: ${config.description} - ${error.message}`, 'ERROR');
		return { success: false, error: error.message };
	}
}

/**
 * Get changed files from git
 */
function getChangedFiles() {
	try {
		const { execSync } = require('child_process');
		const output = execSync('git diff --cached --name-only', { encoding: 'utf8' });
		return output.trim().split('\n').filter(file => file.length > 0);
	} catch (error) {
		log('Failed to get changed files from git', 'ERROR');
		return [];
	}
}

/**
 * Determine which dashboards need updates based on changed files
 */
function determineDashboardsToUpdate(changedFiles) {
	const dashboardsToUpdate = [];
	
	// Check for changes that would affect different dashboards
	const filePatterns = {
		tokenMonitoring: [
			/src\/services.*token/,
			/src\/v8u\/services.*token/,
			/src\/components.*Token/,
			/logs.*token/,
			/src\/server\/data.*token/,
		],
		apiStats: [
			/src\/services.*api/,
			/logs.*pingone-api/,
			/src\/components.*Api/,
			/server.js/,
		],
		userActivity: [
			/src\/components.*User/,
			/src\/pages.*User/,
			/src\/contexts.*Auth/,
			/src\/services.*user/,
		],
		performance: [
			/src\/components.*Performance/,
			/src\/utils.*performance/,
			/vite.config.ts/,
			/package.json/,
		],
	};
	
	// Check each dashboard
	Object.entries(filePatterns).forEach(([dashboardName, patterns]) => {
		const shouldUpdate = patterns.some(pattern => 
			changedFiles.some(file => file.match(pattern))
		);
		
		if (shouldUpdate) {
			dashboardsToUpdate.push(dashboardName);
		}
	});
	
	// Always update if no specific patterns matched (conservative approach)
	if (dashboardsToUpdate.length === 0 && changedFiles.length > 0) {
		log('No specific dashboard triggers found, updating token monitoring by default');
		dashboardsToUpdate.push('tokenMonitoring');
	}
	
	return dashboardsToUpdate;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
	log('Starting dashboard update process...');
	
	try {
		// Get changed files
		const changedFiles = getChangedFiles();
		log(`Found ${changedFiles.length} changed files`);
		
		if (changedFiles.length === 0) {
			log('No files to process, skipping dashboard updates');
			process.exit(0);
		}
		
		// Determine which dashboards need updates
		const dashboardsToUpdate = determineDashboardsToUpdate(changedFiles);
		log(`Dashboards to update: ${dashboardsToUpdate.join(', ')}`);
		
		// Sort by priority
		const sortedDashboards = dashboardsToUpdate
			.map(name => ({ name, ...DASHBOARD_CONFIG[name] }))
			.sort((a, b) => a.priority - b.priority);
		
		// Execute dashboard updates
		const results = [];
		for (const dashboard of sortedDashboards) {
			if (validateDashboardScript(dashboard)) {
				const result = await executeDashboardScript(dashboard);
				results.push({ dashboard: dashboard.description, ...result });
			} else {
				results.push({ 
					dashboard: dashboard.description, 
					success: false, 
					error: 'Script not found or not accessible' 
				});
			}
		}
		
		// Summary
		log('\n=== Dashboard Update Summary ===');
		const successCount = results.filter(r => r.success).length;
		const failureCount = results.filter(r => !r.success).length;
		
		results.forEach(result => {
			const status = result.success ? '✅' : '❌';
			log(`${status} ${result.dashboard}: ${result.success ? result.message : result.error}`);
		});
		
		log(`\nCompleted: ${successCount} successful, ${failureCount} failed`);
		
		// Exit with appropriate code
		if (failureCount > 0) {
			process.exit(1);
		} else {
			process.exit(0);
		}
		
	} catch (error) {
		log(`Fatal error: ${error.message}`, 'ERROR');
		process.exit(1);
	}
}

// Execute main function
if (import.meta.url === `file://${process.argv[1]}`) {
	main();
}

export { main, determineDashboardsToUpdate, executeDashboardScript };
