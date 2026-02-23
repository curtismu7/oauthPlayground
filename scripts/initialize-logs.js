// scripts/initialize-logs.js
/**
 * Initialize all log files with consistent headers and formatting
 * 
 * This script ensures all log files have:
 * - Consistent banner headers
 * - Proper descriptions
 * - File information
 * - Version tracking
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOG_FILES = [
	{
		path: 'logs/sms.log',
		icon: '📱',
		title: 'SMS Flow API Call Log',
		description: 'SMS OTP device authentication and registration API calls',
		includes: [
			'Device registration for SMS devices',
			'Device activation for SMS devices', 
			'Device authentication/verification for SMS devices',
			'Policy lookups and configuration',
			'Any other API calls detected as part of the SMS flow',
		],
	},
	{
		path: 'logs/email.log',
		icon: '📧',
		title: 'Email Flow API Call Log',
		description: 'Email OTP device authentication and registration API calls',
		includes: [
			'Device registration for Email devices',
			'Device activation for Email devices',
			'Device authentication/verification for Email devices',
			'Policy lookups and configuration',
			'Any other API calls detected as part of the Email flow',
		],
	},
	{
		path: 'logs/fido.log',
		icon: '🔐',
		title: 'FIDO2 Flow API Call Log',
		description: 'FIDO2/Passkey device authentication and registration API calls',
		includes: [
			'Device registration for FIDO2 devices',
			'Device activation for FIDO2 devices',
			'Device authentication/verification for FIDO2 devices',
			'Policy lookups and configuration',
			'Any other API calls detected as part of the FIDO2 flow',
		],
	},
	{
		path: 'logs/authz-redirects.log',
		icon: '🔄',
		title: 'Authorization Code Flow Redirects Log',
		description: 'OAuth 2.0 Authorization Code Flow redirects and navigation events',
		includes: [
			'Authorization URL generation (REDIRECT 1: Frontend → PingOne)',
			'Callback redirects (REDIRECT 2: PingOne → Frontend)',
			'Token exchange API calls (NOT redirects)',
			'Post-token-exchange navigation',
			'URL parameter cleanup events',
			'State parameter validation',
			'PKCE code verifier/challenge details',
		],
	},
	{
		path: 'logs/server.log',
		icon: '🖥️',
		title: 'Server Operations Log',
		description: 'Backend server operations and system events',
		includes: [
			'Server startup and shutdown events',
			'API request handling',
			'Database operations',
			'Authentication and authorization',
			'Error handling and exceptions',
			'Performance metrics',
		],
	},
	{
		path: 'logs/client.log',
		icon: '💻',
		title: 'Client Operations Log',
		description: 'Frontend client operations and user interactions',
		includes: [
			'User interface events',
			'Client-side API calls',
			'Form submissions and validations',
			'Navigation events',
			'Client-side errors',
			'Performance metrics',
		],
	},
	{
		path: 'logs/pingone-api.log',
		icon: '🔑',
		title: 'PingOne API Operations Log',
		description: 'All PingOne API calls and responses',
		includes: [
			'Authentication requests',
			'User management operations',
			'MFA device operations',
			'Application management',
			'Policy and configuration',
			'API errors and responses',
		],
	},
	{
		path: 'logs/startup.log',
		icon: '🚀',
		title: 'Application Startup Log',
		description: 'Application startup sequence and initialization',
		includes: [
			'Service initialization',
			'Configuration loading',
			'Database connections',
			'Environment setup',
			'Dependency checks',
			'Startup errors and warnings',
		],
	},
	{
		path: 'logs/client-code.log',
		icon: '💻',
		title: 'Code Generation Operations Log',
		description: 'Code generation and client operations',
		includes: [
			'Code generation requests',
			'Template processing',
			'File operations',
			'Validation and testing',
			'Export operations',
			'Code generation errors',
		],
	},
	{
		path: 'logs/flow.log',
		icon: '🌊',
		title: 'Flow Execution Log',
		description: 'OAuth and MFA flow execution events',
		includes: [
			'Flow state transitions',
			'Step completions',
			'Flow errors and retries',
			'User interactions',
			'Flow metrics',
			'Flow debugging information',
		],
	},
	{
		path: 'logs/system.log',
		icon: '⚙️',
		title: 'System Operations Log',
		description: 'General system operations and maintenance',
		includes: [
			'System health checks',
			'Maintenance operations',
			'Configuration changes',
			'System errors',
			'Performance monitoring',
			'Security events',
		],
	},
];

function createLogHeader(config) {
	const width = 120;
	const borderChar = '═';
	const sideChar = '║';
	
	let header = '\n';
	
	// Top banner
	header += `${borderChar.repeat(width)}\n`;
	
	// Title
	const titleLine = `${config.icon} ${config.title}`;
	const titlePadding = Math.max(0, width - titleLine.length - 4);
	header += `${sideChar} ${titleLine}${' '.repeat(titlePadding)} ${sideChar}\n`;
	
	// Second banner
	header += `${borderChar.repeat(width)}\n`;
	
	// Description
	header += `${sideChar} ${config.description} ${sideChar}\n`;
	header += `${borderChar.repeat(width)}\n`;
	
	// Includes section
	header += `${sideChar} This includes: ${sideChar}\n`;
	config.includes.forEach(item => {
		header += `${sideChar}   • ${item} ${sideChar}\n`;
	});
	
	// Detection method
	header += `${sideChar} ${sideChar}\n`;
	header += `${sideChar} Detection is based on: ${sideChar}\n`;
	header += `${sideChar}   • deviceType metadata in API call ${sideChar}\n`;
	header += `${sideChar}   • URL patterns (e.g., /fido2, /sms, /email, etc.) ${sideChar}\n`;
	header += `${sideChar}   • Operation names and context ${sideChar}\n`;
	
	// File information
	header += `${sideChar} ${sideChar}\n`;
	header += `${sideChar} Log File Information: ${sideChar}\n`;
	header += `${sideChar}   • Created: ${new Date().toLocaleString()} ${sideChar}\n`;
	header += `${sideChar}   • Version: 9.3.6 ${sideChar}\n`;
	header += `${sideChar}   • Format: Unified Logging System V9 ${sideChar}\n`;
	header += `${sideChar}   • Encoding: UTF-8 ${sideChar}\n`;
	
	// Bottom banner
	header += `${borderChar.repeat(width)}\n`;
	header += `${sideChar} ${config.icon} START OF LOG FILE ${sideChar}\n`;
	header += `${borderChar.repeat(width)}\n\n`;
	
	return header;
}

function initializeLogFiles() {
	console.log('🔧 Initializing log files with consistent headers...');
	
	// Ensure logs directory exists
	const logsDir = path.join(process.cwd(), 'logs');
	if (!fs.existsSync(logsDir)) {
		fs.mkdirSync(logsDir, { recursive: true });
		console.log('📁 Created logs directory');
	}
	
	// Initialize each log file
	LOG_FILES.forEach(config => {
		const fullPath = path.join(process.cwd(), config.path);
		const logDir = path.dirname(fullPath);
		
		// Ensure directory exists
		if (!fs.existsSync(logDir)) {
			fs.mkdirSync(logDir, { recursive: true });
		}
		
		// Create header
		const header = createLogHeader(config);
		
		// Write header to file (overwrite if exists)
		try {
			fs.writeFileSync(fullPath, header, 'utf8');
			console.log(`✅ Initialized: ${config.path}`);
		} catch (error) {
			console.error(`❌ Failed to initialize ${config.path}:`, error.message);
		}
	});
	
	console.log('🎉 Log file initialization complete!');
	console.log('📊 All log files now have consistent formatting and headers.');
}

// Run initialization if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
	initializeLogFiles();
}

export { initializeLogFiles, LOG_FILES };
