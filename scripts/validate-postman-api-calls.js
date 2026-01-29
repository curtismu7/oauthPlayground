#!/usr/bin/env node
/**
 * Comprehensive validation script for Postman Collection API calls
 * Checks common patterns and validates JSON request bodies against PingOne API standards
 *
 * Usage: node scripts/validate-postman-api-calls.js
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_CALLS_FILE = path.join(__dirname, '../src/services/postmanCollectionGeneratorV8.ts');

// Common nested object patterns that must be objects with id property
const NESTED_OBJECT_PATTERNS = {
	population: { id: 'string' },
	policy: { id: 'string' },
	user: { id: 'string' },
	device: { id: 'string' },
	deviceAuthenticationPolicy: { id: 'string' },
	signOnPolicy: { id: 'string' },
	passwordPolicy: { id: 'string' },
	theme: { id: 'string' },
};

// Content-Type mappings for different operations
const CONTENT_TYPE_MAPPINGS = {
	'application/vnd.pingidentity.group+json': ['group'],
	'application/vnd.pingidentity.user.import+json': ['user.*import', 'user.*Import'],
	'application/vnd.pingidentity.user.verify+json': ['verify.*user', 'verify.*User'],
	'application/vnd.pingidentity.password.reset+json': ['password.*reset', 'reset.*password'],
	'application/vnd.pingidentity.password.set+json': ['password.*set', 'set.*password'],
	'application/vnd.pingidentity.password.change+json': ['password.*change', 'change.*password'],
	'application/vnd.pingidentity.password.forceChange': ['force.*password', 'password.*force'],
	'application/vnd.pingidentity.password.sendRecoveryCode': ['recovery.*code', 'send.*recovery'],
	'application/vnd.pingidentity.password.recover+json': ['recover.*password', 'validate.*recovery'],
	'application/vnd.pingidentity.device.activate+json': ['activate.*device', 'device.*activate'],
	'application/vnd.pingidentity.device.select+json': ['select.*device', 'device.*select'],
	'application/vnd.pingidentity.otp.check+json': ['check.*otp', 'otp.*check', 'validate.*otp'],
	'application/vnd.pingidentity.usernamePassword.check+json': [
		'username.*password',
		'login.*credentials',
	],
	'application/x-www-form-urlencoded': ['token', 'revoke', 'introspect', 'authorization.*code'],
};

// Authorization token patterns - which operations should use which token
const AUTHORIZATION_PATTERNS = {
	workerToken: [
		'population',
		'group',
		'user.*create',
		'application',
		'policy',
		'device',
		'password.*reset',
		'password.*force',
		'recovery',
		'externalIdp',
		'risk',
		'introspect',
	],
	access_token: ['password.*change.*self', 'session.*end', 'logout'],
	none: ['flow', 'token.*exchange', 'revoke'],
};

// Required fields by operation type
const REQUIRED_FIELDS = {
	population: ['name'],
	group: ['name'],
	user: ['username', 'population'],
	'user.import': ['username', 'population', 'email'],
	device: ['type', 'policy'],
	'device.auth': ['user'],
	password: {
		reset: ['newPassword'],
		change: ['currentPassword', 'newPassword'],
		force: [], // Empty body
		recovery: ['recoveryCode', 'newPassword'],
	},
	application: ['name', 'type', 'protocol'],
	policy: ['name'],
	'external.idp': ['type', 'name', 'clientId', 'clientSecret'],
};

/**
 * Extract API call information from createUseCaseItem calls
 */
function extractAPICalls(content) {
	const apiCalls = [];
	// Find all createUseCaseItem calls - match the function name and opening parenthesis
	const functionPattern = /createUseCaseItem\s*\(/g;

	let functionMatch;
	while ((functionMatch = functionPattern.exec(content)) !== null) {
		const startPos = functionMatch.index;
		const callStart = content.substring(startPos);

		// Extract name (first parameter - string)
		const nameMatch = callStart.match(/['"]([^'"]+)['"]/);
		if (!nameMatch) continue;
		const name = nameMatch[1];

		// Extract method (second parameter - string)
		const methodMatch = callStart
			.substring(nameMatch.index + nameMatch[0].length)
			.match(/['"](GET|POST|PUT|PATCH|DELETE)['"]/);
		if (!methodMatch) continue;
		const method = methodMatch[1];

		// Extract URL (third parameter - template literal)
		const urlMatch = callStart
			.substring(nameMatch.index + nameMatch[0].length + methodMatch.index + methodMatch[0].length)
			.match(/`([^`]+)`/);
		if (!urlMatch) continue;
		const url = urlMatch[1];

		// Extract description (fourth parameter - string, can be multiline)
		const descStart = callStart.substring(
			nameMatch.index +
				nameMatch[0].length +
				methodMatch.index +
				methodMatch[0].length +
				urlMatch.index +
				urlMatch[0].length
		);
		const descMatch = descStart.match(/['"]([^'"]*(?:'[^']*)*)['"]/);
		if (!descMatch) continue;
		const description = descMatch[1];

		// Extract headers (fifth parameter - array)
		const headersStart = descStart.substring(descMatch.index + descMatch[0].length);
		const headersMatch = headersStart.match(/\[\s*([\s\S]*?)\]\s*,/);
		if (!headersMatch) continue;
		const headersString = headersMatch[1];
		const headers = parseHeaders(headersString);

		// Extract body (sixth parameter - object, optional)
		const bodyStart = headersStart.substring(headersMatch.index + headersMatch[0].length);
		let body = null;
		let bodyString = '';

		// Check if next token is an object
		const bodyMatch = bodyStart.match(/^\s*(\{[\s\S]*?\})\s*,/);
		if (bodyMatch) {
			bodyString = bodyMatch[1];
			try {
				// Try to parse as JavaScript object (replace single quotes, handle template strings)
				const jsObjectString = bodyString
					.replace(/'/g, '"') // Replace single quotes
					.replace(/(\w+):/g, '"$1":') // Quote keys
					.replace(/,\s*}/g, '}') // Remove trailing commas
					.replace(/,\s*]/g, ']') // Remove trailing commas in arrays
					.replace(/\{\{([^}]+)\}\}/g, '"{{$1}}"'); // Preserve Postman variables
				body = JSON.parse(jsObjectString);
			} catch (_e) {
				// If parsing fails, keep as string for pattern matching
				body = bodyString;
			}
		}

		const lineNumber = content.substring(0, startPos).split('\n').length;

		apiCalls.push({
			name,
			method,
			url,
			description,
			headers,
			body,
			bodyString: bodyString || '',
			lineNumber,
		});
	}

	return apiCalls;
}

/**
 * Parse headers array string
 */
function parseHeaders(headersString) {
	const headers = [];
	const headerPattern = /\{\s*key:\s*['"]([^'"]+)['"],\s*value:\s*['"]([^'"]+)['"]\s*\}/g;
	let match;

	while ((match = headerPattern.exec(headersString)) !== null) {
		headers.push({
			key: match[1],
			value: match[2],
		});
	}

	return headers;
}

/**
 * Validate nested object structures
 */
function validateNestedObjects(apiCall, issues) {
	if (!apiCall.body || typeof apiCall.body !== 'object') {
		return;
	}

	const bodyString = typeof apiCall.body === 'string' ? apiCall.body : JSON.stringify(apiCall.body);

	// Check each nested object pattern
	Object.keys(NESTED_OBJECT_PATTERNS).forEach((key) => {
		const pattern = new RegExp(`${key}:\\s*['"]`, 'i');
		if (bodyString.match(pattern)) {
			issues.push({
				type: 'nested_object',
				severity: 'error',
				line: apiCall.lineNumber,
				apiCall: apiCall.name,
				field: key,
				message: `${apiCall.name}: ${key} should be an object with id property: { id: "value" }`,
				fix: `Change to: ${key}: { id: "value" }`,
			});
		}
	});
}

/**
 * Validate Content-Type headers match the operation
 */
function validateContentType(apiCall, issues) {
	const contentTypeHeader = apiCall.headers.find((h) => h.key.toLowerCase() === 'content-type');

	if (!contentTypeHeader) {
		// Some operations don't need Content-Type (GET, DELETE, etc.)
		if (['POST', 'PUT', 'PATCH'].includes(apiCall.method)) {
			// Check if it's a form-encoded operation
			const isFormEncoded =
				apiCall.url.includes('/token') ||
				apiCall.url.includes('/revoke') ||
				apiCall.url.includes('/introspect') ||
				apiCall.url.includes('/session/end');

			if (!isFormEncoded) {
				issues.push({
					type: 'content_type',
					severity: 'warning',
					line: apiCall.lineNumber,
					apiCall: apiCall.name,
					message: `${apiCall.name}: Missing Content-Type header for ${apiCall.method} request`,
				});
			}
		}
		return;
	}

	const contentType = contentTypeHeader.value;
	const callNameLower = apiCall.name.toLowerCase();

	// Check if Content-Type matches expected pattern
	let matches = false;
	Object.entries(CONTENT_TYPE_MAPPINGS).forEach(([expectedType, patterns]) => {
		if (contentType === expectedType) {
			patterns.forEach((pattern) => {
				if (new RegExp(pattern, 'i').test(callNameLower)) {
					matches = true;
				}
			});
		}
	});

	// Special cases
	if (contentType === 'application/json' && !matches) {
		// JSON is often correct, so don't flag it
		matches = true;
	}

	if (contentType === 'application/x-www-form-urlencoded') {
		const isFormOperation =
			apiCall.url.includes('/token') ||
			apiCall.url.includes('/revoke') ||
			apiCall.url.includes('/introspect') ||
			apiCall.url.includes('/session/end');
		if (isFormOperation) {
			matches = true;
		}
	}

	if (!matches && ['POST', 'PUT', 'PATCH'].includes(apiCall.method)) {
		// This is a warning, not an error, as Content-Type might be correct
		// but not in our mapping
	}
}

/**
 * Validate authorization tokens
 */
function validateAuthorization(apiCall, issues) {
	const authHeader = apiCall.headers.find((h) => h.key.toLowerCase() === 'authorization');

	if (!authHeader) {
		// Some operations don't need authorization (flow-based, token exchange)
		const noAuthPatterns = ['flow', 'token.*exchange', 'revoke'];
		const needsAuth = !noAuthPatterns.some(
			(pattern) =>
				new RegExp(pattern, 'i').test(apiCall.name) || new RegExp(pattern, 'i').test(apiCall.url)
		);

		if (needsAuth && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(apiCall.method)) {
			issues.push({
				type: 'authorization',
				severity: 'warning',
				line: apiCall.lineNumber,
				apiCall: apiCall.name,
				message: `${apiCall.name}: Missing Authorization header for ${apiCall.method} request`,
			});
		}
		return;
	}

	const authValue = authHeader.value;
	const callNameLower = apiCall.name.toLowerCase();

	// Check if token type matches expected pattern
	let expectedToken = null;
	Object.entries(AUTHORIZATION_PATTERNS).forEach(([tokenType, patterns]) => {
		patterns.forEach((pattern) => {
			if (
				new RegExp(pattern, 'i').test(callNameLower) ||
				new RegExp(pattern, 'i').test(apiCall.url)
			) {
				expectedToken = tokenType;
			}
		});
	});

	if (expectedToken) {
		const hasWorkerToken = authValue.includes('{{workerToken}}');
		const hasAccessToken = authValue.includes('{{access_token}}');

		if (expectedToken === 'workerToken' && !hasWorkerToken) {
			issues.push({
				type: 'authorization',
				severity: 'error',
				line: apiCall.lineNumber,
				apiCall: apiCall.name,
				message: `${apiCall.name}: Should use {{workerToken}} for admin operation, but found ${authValue}`,
				fix: 'Change to: Bearer {{workerToken}}',
			});
		} else if (expectedToken === 'access_token' && !hasAccessToken) {
			issues.push({
				type: 'authorization',
				severity: 'error',
				line: apiCall.lineNumber,
				apiCall: apiCall.name,
				message: `${apiCall.name}: Should use {{access_token}} for user operation, but found ${authValue}`,
				fix: 'Change to: Bearer {{access_token}}',
			});
		} else if (expectedToken === 'none' && authHeader) {
			issues.push({
				type: 'authorization',
				severity: 'warning',
				line: apiCall.lineNumber,
				apiCall: apiCall.name,
				message: `${apiCall.name}: Should not have Authorization header for this operation`,
			});
		}
	}
}

/**
 * Validate required fields
 */
function validateRequiredFields(apiCall, issues) {
	if (!apiCall.body || typeof apiCall.body !== 'object') {
		return;
	}

	const callNameLower = apiCall.name.toLowerCase();
	const bodyString = typeof apiCall.body === 'string' ? apiCall.body : JSON.stringify(apiCall.body);

	// Determine operation type
	let operationType = null;
	if (callNameLower.includes('population')) {
		operationType = 'population';
	} else if (callNameLower.includes('group')) {
		operationType = 'group';
	} else if (callNameLower.includes('user') && callNameLower.includes('import')) {
		operationType = 'user.import';
	} else if (callNameLower.includes('user')) {
		operationType = 'user';
	} else if (callNameLower.includes('device') && callNameLower.includes('authentication')) {
		operationType = 'device.auth';
	} else if (callNameLower.includes('device')) {
		operationType = 'device';
	} else if (callNameLower.includes('password')) {
		if (callNameLower.includes('reset')) {
			operationType = 'password.reset';
		} else if (callNameLower.includes('change')) {
			operationType = 'password.change';
		} else if (callNameLower.includes('force')) {
			operationType = 'password.force';
		} else if (callNameLower.includes('recover')) {
			operationType = 'password.recovery';
		}
	} else if (callNameLower.includes('application')) {
		operationType = 'application';
	} else if (callNameLower.includes('policy')) {
		operationType = 'policy';
	} else if (callNameLower.includes('external') || callNameLower.includes('idp')) {
		operationType = 'external.idp';
	}

	if (operationType && REQUIRED_FIELDS[operationType]) {
		const required = Array.isArray(REQUIRED_FIELDS[operationType])
			? REQUIRED_FIELDS[operationType]
			: Object.values(REQUIRED_FIELDS[operationType]).flat();

		required.forEach((field) => {
			if (!bodyString.includes(`"${field}"`) && !bodyString.includes(`'${field}'`)) {
				// Check if it's an empty body operation (like force password change)
				if (operationType === 'password.force' && bodyString.trim() === '{}') {
					return; // Empty body is correct for force password change
				}

				issues.push({
					type: 'required_field',
					severity: 'error',
					line: apiCall.lineNumber,
					apiCall: apiCall.name,
					field,
					message: `${apiCall.name}: Missing required field '${field}'`,
				});
			}
		});
	}
}

/**
 * Validate alternativeIdentifiers format
 */
function validateAlternativeIdentifiers(apiCall, issues) {
	if (!apiCall.body) return;

	const bodyString = typeof apiCall.body === 'string' ? apiCall.body : JSON.stringify(apiCall.body);

	if (bodyString.includes('alternativeIdentifiers')) {
		// Check if it's an object with tags property (wrong format)
		if (bodyString.includes('alternativeIdentifiers:') && bodyString.includes('tags:')) {
			issues.push({
				type: 'alternativeIdentifiers',
				severity: 'error',
				line: apiCall.lineNumber,
				apiCall: apiCall.name,
				message: `${apiCall.name}: alternativeIdentifiers should be an array of strings, not an object with tags`,
				fix: 'Change to: alternativeIdentifiers: ["value1", "value2"]',
			});
		}
		// Check if it's a string instead of array
		else if (bodyString.match(/alternativeIdentifiers:\s*['"][^'"]+['"]/)) {
			issues.push({
				type: 'alternativeIdentifiers',
				severity: 'error',
				line: apiCall.lineNumber,
				apiCall: apiCall.name,
				message: `${apiCall.name}: alternativeIdentifiers should be an array of strings, not a single string`,
				fix: 'Change to: alternativeIdentifiers: ["value1", "value2"]',
			});
		}
	}
}

/**
 * Main validation function
 */
function validateFile() {
	console.log('🔍 Validating Postman Collection API Calls...\n');

	if (!fs.existsSync(API_CALLS_FILE)) {
		console.error(`❌ File not found: ${API_CALLS_FILE}`);
		process.exit(1);
	}

	const content = fs.readFileSync(API_CALLS_FILE, 'utf8');
	const apiCalls = extractAPICalls(content);
	const issues = [];

	console.log(`📊 Found ${apiCalls.length} API calls to validate\n`);

	// Count by method
	const byMethod = {};
	apiCalls.forEach((call) => {
		byMethod[call.method] = (byMethod[call.method] || 0) + 1;
	});

	console.log('📈 API Calls by Method:');
	Object.entries(byMethod).forEach(([method, count]) => {
		console.log(`   ${method}: ${count}`);
	});
	console.log('');

	// Validate each API call
	apiCalls.forEach((apiCall) => {
		validateNestedObjects(apiCall, issues);
		validateContentType(apiCall, issues);
		validateAuthorization(apiCall, issues);
		validateRequiredFields(apiCall, issues);
		validateAlternativeIdentifiers(apiCall, issues);
	});

	// Report results
	if (issues.length === 0) {
		console.log('✅ No validation issues found!\n');
		return 0;
	}

	console.log(`\n⚠️  Found ${issues.length} potential issue(s):\n`);

	// Group by type
	const byType = {};
	issues.forEach((issue) => {
		if (!byType[issue.type]) {
			byType[issue.type] = [];
		}
		byType[issue.type].push(issue);
	});

	// Sort by severity (errors first)
	const severityOrder = { error: 0, warning: 1 };

	Object.entries(byType)
		.sort(([a], [b]) => {
			const aSeverity = issues.find((i) => i.type === a)?.severity || 'warning';
			const bSeverity = issues.find((i) => i.type === b)?.severity || 'warning';
			return severityOrder[aSeverity] - severityOrder[bSeverity];
		})
		.forEach(([issueType, issueList]) => {
			const severity = issueList[0]?.severity || 'warning';
			const icon = severity === 'error' ? '❌' : '⚠️';
			console.log(`\n${icon} ${issueType} (${issueList.length} occurrence(s)):`);
			issueList.forEach((issue) => {
				console.log(`   Line ${issue.line}: ${issue.apiCall}`);
				console.log(`      ${issue.message}`);
				if (issue.fix) {
					console.log(`      💡 Fix: ${issue.fix}`);
				}
			});
		});

	console.log('\n');

	// Return exit code based on errors
	const errorCount = issues.filter((i) => i.severity === 'error').length;
	return errorCount > 0 ? 1 : 0;
}

// Run validation
const exitCode = validateFile();
process.exit(exitCode);

export { validateFile, NESTED_OBJECT_PATTERNS, CONTENT_TYPE_MAPPINGS, AUTHORIZATION_PATTERNS };
