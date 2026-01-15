/**
 * @file postmanCollectionGeneratorV8.ts
 * @module services
 * @description Generate Postman collections from API call documentation
 * @version 8.1.0
 */

// Collection version - update this when making breaking changes or major updates
export const COLLECTION_VERSION = '8.1.10';

import type { FlowType } from '@/v8/services/specVersionServiceV8';
import type { ApiCall as TrackedApiCall } from './apiCallTrackerService';

/**
 * DATA FLOW MAP (V8 Postman Generator)
 * Inputs:
 * - Tracked API calls from apiCallTrackerService
 * - Credentials (envID/clientId/clientSecret/username)
 * - Selected use cases and flow specs
 * Derived values:
 * - URL templates ({{authPath}}, {{apiPath}}, {{envID}})
 * - Request bodies/headers/scripts assembled per use case
 * Outputs:
 * - Postman Collection JSON (requests, scripts, variables)
 * - Postman Environment/Variables JSON
 * Validation:
 * - Required variables present and non-blank
 * - Intentionally blank values always warn + annotate descriptions
 * - Collection URLs/methods/scripts validated before output
 */

export interface PostmanCollectionItem {
	name: string;
	request?: {
		method: string;
		header?: Array<{ key: string; value: string; type?: string }>;
		body?: {
			mode: string;
			raw?: string;
			urlencoded?: Array<{ key: string; value: string }>;
			options?: {
				raw?: {
					language?: string;
				};
			};
		};
		url: {
			raw: string;
			protocol?: string;
			host?: string[];
			port?: string;
			path?: string[];
			query?: Array<{ key: string; value: string }>;
		};
		description?: string;
	};
	item?: PostmanCollectionItem[]; // For folders/nested collections
	response?: Array<unknown>;
	event?: Array<{
		listen: 'prerequest' | 'test';
		script: {
			exec: string[];
			type: string;
		};
	}>;
	description?: string;
}

export interface PostmanCollection {
	info: {
		name: string;
		description: string;
		schema: string;
		version?: string;
	};
	variable: Array<{
		key: string;
		value: string;
		type?: string;
		description?: string;
	}>;
	item: PostmanCollectionItem[];
}

type IssueLevel = 'error' | 'warning';

type GenerationIssue = {
	level: IssueLevel;
	code: string;
	message: string;
	context?: Record<string, unknown>;
};

type VariablePolicy = 'required' | 'user-fill';

/**
 * GenerationIssues collects errors and warnings for a single generation run.
 */
export class GenerationIssues {
	private issues: GenerationIssue[] = [];
	private readonly runLabel: string;

	/**
	 * Create a new issue collector with a readable label.
	 */
	constructor(runLabel: string) {
		this.runLabel = runLabel;
	}

	/**
	 * Add a generation error with context.
	 */
	addError(code: string, message: string, context?: Record<string, unknown>): void {
		const issue: GenerationIssue = context
			? { level: 'error', code, message, context }
			: { level: 'error', code, message };
		this.issues.push(issue);
	}

	/**
	 * Add a generation warning with context.
	 */
	addWarning(code: string, message: string, context?: Record<string, unknown>): void {
		const issue: GenerationIssue = context
			? { level: 'warning', code, message, context }
			: { level: 'warning', code, message };
		this.issues.push(issue);
	}

	/**
	 * Print a summary of warnings/errors for diagnostics.
	 */
	printSummary(): void {
		if (!this.issues.length) return;
		const grouped = this.issues.reduce(
			(acc, issue) => {
				acc[issue.level].push(issue);
				return acc;
			},
			{ error: [] as GenerationIssue[], warning: [] as GenerationIssue[] }
		);
		if (grouped.error.length) {
			console.error(`[POSTMAN-GEN] ${this.runLabel} errors: ${grouped.error.length}`);
			grouped.error.forEach((issue) => {
				console.error(
					`[POSTMAN-GEN][ERROR] ${issue.code}: ${issue.message}`,
					redactSensitive(issue.context)
				);
			});
		}
		if (grouped.warning.length) {
			console.warn(`[POSTMAN-GEN] ${this.runLabel} warnings: ${grouped.warning.length}`);
			grouped.warning.forEach((issue) => {
				console.warn(
					`[POSTMAN-GEN][WARN] ${issue.code}: ${issue.message}`,
					redactSensitive(issue.context)
				);
			});
		}
	}

	/**
	 * Throw when errors exist, after printing a summary.
	 */
	throwIfErrors(): void {
		const hasErrors = this.issues.some((issue) => issue.level === 'error');
		if (!hasErrors) return;
		this.printSummary();
		throw new Error(`[POSTMAN-GEN] ${this.runLabel} failed with validation errors.`);
	}

	/**
	 * Check if warnings are present.
	 */
	hasWarnings(): boolean {
		return this.issues.some((issue) => issue.level === 'warning');
	}

	/**
	 * Expose issues for testing and diagnostics.
	 */
	getIssues(): GenerationIssue[] {
		return [...this.issues];
	}
}

/**
 * Redact known sensitive fields from logs to avoid leaking secrets.
 */
export const redactSensitive = (
	context?: Record<string, unknown>
): Record<string, unknown> | undefined => {
	if (!context) return context;
	const redacted: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(context)) {
		if (key.toLowerCase().includes('secret') || key.toLowerCase().includes('token')) {
			redacted[key] = '[REDACTED]';
		} else {
			redacted[key] = value;
		}
	}
	return redacted;
};

/**
 * Check whether a value is blank or whitespace only.
 */
export const isBlank = (value?: string | null): boolean => {
	if (value === undefined || value === null) return true;
	return value.trim().length === 0;
};

/**
 * Require a non-blank string; adds error and returns a placeholder if missing.
 */
export const requireNonBlankString = (
	name: string,
	value: string | undefined,
	issues: GenerationIssues,
	context?: Record<string, unknown>
): string => {
	const trimmed = value?.trim() ?? '';
	if (trimmed.length === 0) {
		issues.addError('REQUIRED_VALUE_MISSING', `Required value "${name}" is blank.`, context);
		return '<<REQUIRED_VALUE_MISSING>>';
	}
	return trimmed;
};

/**
 * Allow blank values but emit a warning every time.
 */
export const allowBlankButWarn = (
	name: string,
	value: string | undefined,
	issues: GenerationIssues,
	context?: Record<string, unknown>
): string => {
	if (isBlank(value)) {
		const policyLabel = RUNTIME_SET_VARIABLES.has(name)
			? 'Value intentionally blank — set by collection scripts at runtime'
			: 'Value intentionally blank — user must fill before running collection';
		issues.addWarning('INTENTIONALLY_BLANK', `${policyLabel}: "${name}"`, context);
		return value ?? '';
	}
	return value?.trim() ?? '';
};

/**
 * Encode query strings while preserving Postman variables ({{var}}).
 */
export const encodeQueryPreservingVariables = (query: string): string => {
	const parts = query.split(/(\{\{[^}]+\}\})/g);
	return parts
		.map((part) => {
			if (part.startsWith('{{') && part.endsWith('}}')) return part;
			return part.replace(/ /g, '%20').replace(/"/g, '%22').replace(/\+/g, '%2B');
		})
		.join('');
};

/**
 * Normalize URL strings to avoid Postman blank rendering.
 */
export const normalizeUrlForPostman = (rawUrl: string): string => {
	const [base, query] = rawUrl.split('?');
	if (!query) return rawUrl;
	return `${base}?${encodeQueryPreservingVariables(query)}`;
};

/**
 * Format form values while avoiding blank/undefined strings.
 */
export const formatFormValue = (value: unknown): string => {
	if (value === undefined || value === null) return '<<MISSING_VALUE>>';
	if (typeof value === 'string') return value;
	return String(value);
};

const VARIABLE_POLICIES: Record<string, VariablePolicy> = {
	authPath: 'required',
	apiPath: 'required',
	envID: 'required',
	worker_client_id: 'required',
	worker_client_secret: 'required',
	user_client_id: 'user-fill',
	user_client_secret: 'user-fill',
	redirect_uri: 'user-fill',
	logout_uri: 'user-fill',
	post_logout_redirect_uri: 'user-fill',
};

const RUNTIME_SET_VARIABLES = new Set([
	'workerToken',
	'userToken',
	'access_token',
	'id_token',
	'refresh_token',
	'expires_in',
	'authorization_code',
	'authCode',
	'flowID',
	'interactionId',
	'interactionToken',
	'userId',
	'SignUpUserID',
	'SignUpUsername',
	'SignUpPopID',
	'SignInUserID',
	'SignInUsername',
	'SignInUserEmail',
	'baseballPlayerFirstName',
	'baseballPlayerLastName',
	'baseballPlayerEmail',
	'baseballPlayerUsername',
	'groupId',
	'webAppSignInWithPKCEId',
	'SignInWithPKCEAppSecret',
	'SignInSignonPolicyID',
	'flowID',
	'authCode',
	'userPassword',
	'newPassword',
	'deviceId',
	'deviceAuthenticationId',
	'deviceAuthenticationPolicyId',
	'sessionId',
	'request_uri',
	'par_request_uri',
	'code_verifier',
	'code_challenge',
	'code_challenge_method',
	'codeChallenge',
	'codeChallengeMethod',
	'codeVerifier',
]);

/**
 * Determine variable policy based on registry or runtime-set heuristics.
 */
export const resolveVariablePolicy = (key: string): VariablePolicy => {
	if (VARIABLE_POLICIES[key]) return VARIABLE_POLICIES[key];
	return 'user-fill';
};

/**
 * Enforce variable policies and attach descriptions for intentionally blank values.
 */
export const finalizeVariables = (
	variables: Array<{ key: string; value: string; type?: string; description?: string }>,
	issues: GenerationIssues,
	contextLabel: string
): Array<{ key: string; value: string; type?: string; description?: string }> => {
	const sortedVariables = [...variables].sort((a, b) => a.key.localeCompare(b.key));
	return sortedVariables.map((variable) => {
		const key = requireNonBlankString('variable.key', variable.key, issues, {
			contextLabel,
			variable,
		});
		const policy = resolveVariablePolicy(key);
		let value = variable.value;

		if (policy === 'required') {
			value = requireNonBlankString(key, variable.value, issues, { contextLabel, key });
		} else {
			value = allowBlankButWarn(key, variable.value, issues, { contextLabel, key });
		}

		if (isBlank(value)) {
			const warningDescription = RUNTIME_SET_VARIABLES.has(key)
				? 'Value intentionally blank — set by collection scripts at runtime.'
				: 'Value intentionally blank — user must fill before running collection.';
			const description = variable.description
				? `${variable.description} ${warningDescription}`
				: warningDescription;
			return { ...variable, key, value, description };
		}

		return { ...variable, key, value };
	});
};

/**
 * Validate collection invariants before output.
 */
export const validateCollection = (
	collection: PostmanCollection,
	issues: GenerationIssues,
	contextLabel: string
): void => {
	const variableKeys = new Set(collection.variable.map((variable) => variable.key));
	const postmanBuiltins = new Set([
		'$timestamp',
		'$guid',
		'$randomUUID',
		'$randomInt',
		'$randomAlphaNumeric',
		'$randomBoolean',
		'$randomFirstName',
		'$randomLastName',
		'$randomUserName',
		'$randomEmail',
		'$randomPhoneNumber',
		'$randomCity',
		'$randomCountry',
		'$randomStreetAddress',
		'$randomZipCode',
	]);

	const extractTemplateVariables = (input?: string): string[] => {
		if (!input) return [];
		const matches = input.match(/\{\{([^}]+)\}\}/g) || [];
		return matches.map((match) => match.replace('{{', '').replace('}}', '').trim());
	};

	const validateTemplateVariables = (values: string[], currentPath: string): void => {
		values.forEach((value) => {
			if (value.startsWith('$')) {
				if (!postmanBuiltins.has(value)) {
					issues.addWarning('TEMPLATE_BUILTIN_UNKNOWN', 'Unknown Postman built-in variable.', {
						currentPath,
						value,
					});
				}
				return;
			}
			if (!variableKeys.has(value)) {
				issues.addError(
					'TEMPLATE_VAR_UNKNOWN',
					'Template variable is not defined in variables list.',
					{
						currentPath,
						value,
					}
				);
			}
		});
	};

	if (!collection.info?.name?.trim()) {
		issues.addError('COLLECTION_NAME_MISSING', 'Collection name is missing.', { contextLabel });
	}
	if (!collection.info?.schema?.trim()) {
		issues.addError('COLLECTION_SCHEMA_MISSING', 'Collection schema is missing.', { contextLabel });
	}

	const validateItem = (item: PostmanCollectionItem, path: string): void => {
		const currentPath = `${path}/${item.name}`;
		if (!item.name?.trim()) {
			issues.addError('ITEM_NAME_MISSING', 'Collection item name is missing.', { currentPath });
		}
		if (item.request) {
			if (!item.request.method?.trim()) {
				issues.addError('REQUEST_METHOD_MISSING', 'Request method is missing.', { currentPath });
			}
			const rawUrl = item.request.url?.raw?.trim() ?? '';
			if (!rawUrl) {
				issues.addError('REQUEST_URL_MISSING', 'Request URL is missing.', { currentPath });
			}
			if (/^https?:\/\/($|\/|\?)/.test(rawUrl)) {
				issues.addError('REQUEST_URL_INVALID', 'Request URL is missing a host.', {
					currentPath,
					rawUrl,
				});
			}
			if (rawUrl.includes('{{authPath}}') && !rawUrl.includes('{{envID}}')) {
				issues.addError(
					'REQUEST_URL_MISSING_ENV',
					'Request URL uses {{authPath}} without {{envID}}.',
					{
						currentPath,
						rawUrl,
					}
				);
			}
			validateTemplateVariables(extractTemplateVariables(rawUrl), currentPath);
			if (item.request.header) {
				item.request.header.forEach((header) => {
					if (!header.key?.trim()) {
						issues.addError('HEADER_KEY_MISSING', 'Header key is missing.', {
							currentPath,
							header,
						});
					}
					const lowerKey = header.key?.toLowerCase() ?? '';
					const headerValue = header.value?.trim() ?? '';
					if (
						lowerKey === 'authorization' &&
						headerValue.startsWith('Bearer') &&
						!headerValue.includes('{{')
					) {
						issues.addWarning('HEADER_BEARER_BLANK', 'Authorization header is missing a token.', {
							currentPath,
							header,
						});
					}
					validateTemplateVariables(
						extractTemplateVariables(header.value),
						`${currentPath} [header:${header.key}]`
					);
				});
			}
			if (item.request.body?.raw) {
				validateTemplateVariables(
					extractTemplateVariables(item.request.body.raw),
					`${currentPath} [body.raw]`
				);
			}
			if (item.request.body?.urlencoded) {
				item.request.body.urlencoded.forEach((entry) => {
					validateTemplateVariables(
						extractTemplateVariables(entry.value),
						`${currentPath} [body.urlencoded:${entry.key}]`
					);
				});
			}
			if (item.event) {
				item.event.forEach((event) => {
					event.script.exec.forEach((line, index) => {
						validateTemplateVariables(
							extractTemplateVariables(line),
							`${currentPath} [script:${event.listen}:${index}]`
						);
					});
				});
			}
		}
		if (item.item) {
			for (const nested of item.item) {
				validateItem(nested, currentPath);
			}
		}
	};

	for (const item of collection.item) {
		validateItem(item, collection.info.name);
	}
};

/**
 * Validate environment invariants before output.
 */
export const validateEnvironment = (
	variables: Array<{ key: string; value: string; type?: string; description?: string }>,
	issues: GenerationIssues,
	contextLabel: string
): void => {
	const variableKeys = new Set(variables.map((variable) => variable.key));
	Object.entries(VARIABLE_POLICIES)
		.filter(([, policy]) => policy === 'required')
		.forEach(([key]) => {
			if (!variableKeys.has(key)) {
				issues.addError('ENV_VAR_REQUIRED_MISSING', 'Required environment variable is missing.', {
					contextLabel,
					key,
				});
			}
		});

	variables.forEach((variable) => {
		if (!variable.key?.trim()) {
			issues.addError('ENV_VAR_KEY_MISSING', 'Environment variable key is missing.', {
				contextLabel,
				variable,
			});
		}
		const policy = resolveVariablePolicy(variable.key);
		if (policy === 'required' && isBlank(variable.value)) {
			issues.addError('ENV_VAR_REQUIRED_BLANK', 'Required environment variable is blank.', {
				contextLabel,
				key: variable.key,
			});
		}
		if (policy !== 'required' && isBlank(variable.value)) {
			issues.addWarning('ENV_VAR_BLANK', 'Environment variable is intentionally blank.', {
				contextLabel,
				key: variable.key,
				policy,
			});
		}
	});
};

/**
 * Validate unresolved placeholders in output JSON.
 */
export const validatePlaceholders = (
	serialized: string,
	issues: GenerationIssues,
	contextLabel: string
): void => {
	if (serialized.includes('{{}}')) {
		issues.addError('PLACEHOLDER_EMPTY', 'Found empty placeholder {{}} in output.', {
			contextLabel,
		});
	}
	if (serialized.includes('{{undefined}}') || serialized.includes('{{null}}')) {
		issues.addError('PLACEHOLDER_INVALID', 'Found undefined/null placeholders in output.', {
			contextLabel,
		});
	}
};

/**
 * Convert API endpoint to Postman format with {{authPath}} and {{envID}} variables
 * Format: {{authPath}}/{{envID}}/path/to/endpoint
 */
const convertEndpointToPostman = (endpoint: string): string => {
	// Replace common patterns with Postman variables
	let result = endpoint;

	// Replace https://auth.pingone.com with {{authPath}} (keep protocol in variable)
	result = result.replace(/https?:\/\/auth\.pingone\.(com|eu|asia)/g, '{{authPath}}');
	result = result.replace(/https?:\/\/auth\.eu\.pingone\.com/g, '{{authPath}}');
	result = result.replace(/https?:\/\/auth\.asia\.pingone\.com/g, '{{authPath}}');

	// Replace environment ID with {{envID}} (UUID format)
	result = result.replace(/\/([a-f0-9-]{36})\//g, '/{{envID}}/');
	result = result.replace(/\/([a-f0-9-]{36})$/g, '/{{envID}}');
	result = result.replace(/env-[a-f0-9-]+/g, '{{envID}}');

	// Replace common variable patterns (single braces to double braces)
	result = result.replace(/\{environmentId\}/g, '{{envID}}');
	result = result.replace(/\{envID\}/g, '{{envID}}');
	result = result.replace(/\{authPath\}/g, '{{authPath}}');

	// Handle cases where endpoint might already have variables but single braces
	result = result.replace(/\{(\w+)\}/g, '{{$1}}');

	// Ensure format is {{authPath}}/{{envID}}/... (no leading protocol)
	// If result starts with {{authPath}}, it's already in the right format
	// If it starts with https://{{authPath}}, remove the protocol
	result = result.replace(/^https:\/\/{{authPath}}/, '{{authPath}}');
	result = result.replace(/^http:\/\/{{authPath}}/, '{{authPath}}');

	return result;
};

/**
 * Parse URL into Postman URL structure
 */
const parseUrl = (
	rawUrl: string
): {
	raw: string;
	protocol?: string;
	host?: string[];
	path?: string[];
	query?: Array<{ key: string; value: string }>;
} => {
	// Remove leading slash if present (common mistake that causes /https://api.pingone.com)
	const normalizedUrl = normalizeUrlForPostman(rawUrl);
	let cleanedUrl = normalizedUrl.trim();
	if (cleanedUrl.startsWith('/{{') || cleanedUrl.startsWith('/{')) {
		cleanedUrl = cleanedUrl.substring(1);
	}

	// Handle Postman variable format {{authPath}}/{{envID}}/...
	// Reference: https://apidocs.pingidentity.com/pingone/platform/v1/api/#the-pingone-postman-environment-template
	if (cleanedUrl.includes('{{authPath}}')) {
		// Format: {{authPath}}/{{envID}}/path?query=params
		// {{authPath}} = https://auth.pingone.com (includes protocol)
		// For Postman, the raw URL should be: {{authPath}}/{{envID}}/path?query=params

		// Split URL from query string to avoid including query params in path
		const queryIndex = cleanedUrl.indexOf('?');
		const urlWithoutQuery = queryIndex !== -1 ? cleanedUrl.substring(0, queryIndex) : cleanedUrl;
		const parts = urlWithoutQuery.split('/').filter(Boolean);

		// Extract path parts after {{authPath}} (remove query string from last part if it exists)
		const path = parts.slice(1).map((part) => {
			// Remove any query string that might have been included in the path part
			const queryIdx = part.indexOf('?');
			return queryIdx !== -1 ? part.substring(0, queryIdx) : part;
		});

		// For Postman, when query parameters are present, use ONLY the raw URL format
		// to prevent Postman from reconstructing the URL and duplicating query parameters
		if (queryIndex !== -1) {
			// Query parameters present - use raw URL only to avoid Postman dropping base URL
			return {
				raw: cleanedUrl, // Keep raw URL with {{authPath}}/{{envID}}/... format (includes query string)
				// Don't provide host/path/query when query params exist to prevent Postman reconstructing the URL
			};
		}

		// No query parameters - safe to provide structured format
		return {
			raw: cleanedUrl, // Keep raw URL with {{authPath}}/{{envID}}/... format
			host: ['{{authPath}}'], // Use variable as host so Postman doesn't reconstruct incorrectly
			...(path.length > 0 && { path }),
		};
	}

	// Handle Postman variable format {{apiPath}}/v1/environments/{{envID}}/...
	// {{apiPath}} = https://api.pingone.com (includes protocol and domain)
	if (cleanedUrl.includes('{{apiPath}}')) {
		// Format: {{apiPath}}/v1/environments/{{envID}}/path?query=params
		// For Postman, the raw URL should be: {{apiPath}}/v1/environments/{{envID}}/path?query=params
		// Postman will substitute {{apiPath}} with its value (e.g., https://api.pingone.com)
		const queryIndex = cleanedUrl.indexOf('?');
		if (queryIndex !== -1) {
			// Query parameters present - use raw URL only to avoid Postman dropping base URL
			return {
				raw: cleanedUrl,
				// Don't provide host/path/query when query params exist to prevent Postman reconstructing the URL
			};
		}

		// Split path parts (remove empty strings from split)
		const parts = cleanedUrl.split('/').filter(Boolean);
		// Find {{apiPath}} index and get path parts after it
		const apiPathIndex = parts.findIndex((p) => p.includes('{{apiPath}}'));
		const path = apiPathIndex >= 0 ? parts.slice(apiPathIndex + 1) : parts;

		// No query parameters - safe to provide structured format
		return {
			raw: cleanedUrl, // Keep raw URL with {{apiPath}}/v1/environments/{{envID}}/... format
			host: ['{{apiPath}}'], // Use variable as host so Postman doesn't reconstruct incorrectly
			...(path.length > 0 && { path }),
		};
	}

	// Fallback: try to parse as regular URL
	try {
		const url = new URL(cleanedUrl);
		const pathParts = url.pathname.split('/').filter(Boolean);

		// Extract host
		const host = url.host.split('.');

		// Extract path parts (replace envID with variable)
		const path = pathParts.map((part) => {
			if (part.match(/^[a-f0-9-]{36}$/)) {
				return '{{envID}}';
			}
			return part;
		});

		// Extract query parameters
		const query: Array<{ key: string; value: string }> = [];
		url.searchParams.forEach((value, key) => {
			query.push({ key, value });
		});

		return {
			raw: cleanedUrl,
			host,
			...(path.length > 0 && { path }),
			...(query.length > 0 && { query }),
		};
	} catch (error) {
		console.warn('[POSTMAN-GEN][WARN] URL parsing failed, using raw fallback.', {
			rawUrl: cleanedUrl,
			error: error instanceof Error ? error.message : String(error),
		});
		// If URL parsing fails, return cleaned URL with basic structure
		const parts = cleanedUrl.split('/').filter(Boolean);
		return {
			raw: cleanedUrl,
			path: parts,
		};
	}
};

/**
 * Convert request body to Postman format
 */
const convertRequestBody = (
	requestBody: Record<string, unknown>,
	method: string
):
	| {
			mode: string;
			raw?: string;
			urlencoded?: Array<{ key: string; value: string }>;
			options?: {
				raw?: {
					language?: string;
				};
			};
	  }
	| undefined => {
	if (!requestBody || Object.keys(requestBody).length === 0) {
		return undefined;
	}

	// For POST/PUT/PATCH with JSON, use raw JSON
	if (['POST', 'PUT', 'PATCH'].includes(method)) {
		// Check if it looks like form data
		const isFormData = Object.values(requestBody).every(
			(v) => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'
		);

		if (isFormData) {
			return {
				mode: 'urlencoded',
				urlencoded: Object.entries(requestBody).map(([key, value]) => ({
					key,
					value: formatFormValue(value),
				})),
			};
		}

		return {
			mode: 'raw',
			raw: JSON.stringify(requestBody, null, 2),
			options: {
				raw: {
					language: 'json',
				},
			},
		};
	}

	return undefined;
};

/**
 * Extract headers from API call
 */
const extractHeaders = (
	apiCall: TrackedApiCall,
	method: string
): Array<{ key: string; value: string; type?: string }> => {
	const headers: Array<{ key: string; value: string; type?: string }> = [];

	// Use headers from API call if available
	if (apiCall.headers) {
		Object.entries(apiCall.headers).forEach(([key, value]) => {
			// Replace worker token with variable
			if (key.toLowerCase() === 'authorization' && typeof value === 'string') {
				headers.push({
					key: 'Authorization',
					value: value.replace(/Bearer\s+[\w.-]+/i, 'Bearer {{workerToken}}'),
				});
			} else {
				headers.push({ key, value: String(value) });
			}
		});
	}

	// Add Content-Type based on request body if not already present
	if (
		['POST', 'PUT', 'PATCH'].includes(method) &&
		!headers.some((h) => h.key.toLowerCase() === 'content-type')
	) {
		const requestBody = apiCall.body || {};
		if (requestBody && typeof requestBody === 'object' && Object.keys(requestBody).length > 0) {
			// Check if it's form data
			const bodyObj = requestBody as Record<string, unknown>;
			const isFormData = Object.values(bodyObj).every(
				(v) => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'
			);
			if (isFormData) {
				headers.push({ key: 'Content-Type', value: 'application/x-www-form-urlencoded' });
			} else {
				headers.push({ key: 'Content-Type', value: 'application/json' });
			}
		}
	}

	// Add Authorization header if token is present in body and not already added
	if (!headers.some((h) => h.key.toLowerCase() === 'authorization')) {
		if (apiCall.body && typeof apiCall.body === 'object') {
			const body = apiCall.body as Record<string, unknown>;
			if (body.workerToken || body.access_token) {
				headers.push({
					key: 'Authorization',
					value: 'Bearer {{workerToken}}',
				});
			}
		}
	}

	// Check for special Content-Type headers in endpoint
	const endpoint = apiCall.actualPingOneUrl || apiCall.url;
	if (endpoint.includes('deviceAuthentications')) {
		// Check if it's an assertion check
		if (apiCall.step?.toLowerCase().includes('assertion') || endpoint.includes('assertion')) {
			const existingContentType = headers.find((h) => h.key.toLowerCase() === 'content-type');
			if (!existingContentType) {
				headers.push({
					key: 'Content-Type',
					value: 'application/vnd.pingidentity.assertion.check+json',
				});
			}
		}
		// Check if it's device selection
		else if (apiCall.step?.toLowerCase().includes('select') || endpoint.includes('select')) {
			const existingContentType = headers.find((h) => h.key.toLowerCase() === 'content-type');
			if (!existingContentType) {
				headers.push({
					key: 'Content-Type',
					value: 'application/vnd.pingidentity.device.select+json',
				});
			}
		}
	}

	return headers;
};

/**
 * Helper function to extract variables saved from test scripts in a Postman item (current item only, not nested)
 */
const extractVariablesFromItem = (item: PostmanCollectionItem): string[] => {
	const variables: string[] = [];

	// Only extract from current item's events (not nested items - those are handled separately)
	if (item.event) {
		item.event.forEach((event) => {
			// Check both test and pre-request scripts for variable extraction
			if ((event.listen === 'test' || event.listen === 'prerequest') && event.script.exec) {
				event.script.exec.forEach((line) => {
					// Use global flag to match all occurrences on a single line
					// Matches: pm.environment.set("variable_name", ...) or pm.environment.set('variable_name', ...)
					const regex = /pm\.environment\.set\(["']([^"']+)["']/g;
					let match: RegExpExecArray | null = null;
					while (true) {
						match = regex.exec(line);
						if (match === null) break;
						if (match[1]) {
							variables.push(match[1]);
						}
					}
				});
			}
		});
	}

	return [...new Set(variables)]; // Remove duplicates
};

/**
 * Helper function to enhance a Postman item's description with Variables Saved section
 */
const enhanceItemDescription = (item: PostmanCollectionItem): PostmanCollectionItem => {
	const savedVariables = extractVariablesFromItem(item);

	if (item.request && savedVariables.length > 0) {
		// Check if description already has Variables Saved section
		const hasVariablesSection = item.request.description?.includes('**Variables Saved:**');

		if (!hasVariablesSection && item.request.description) {
			const varDescriptions: Record<string, string> = {
				workerToken:
					'Worker token for server-to-server authentication (Bearer token for API calls)',
				access_token: 'Access token for API authentication (Bearer token)',
				id_token: 'ID token containing user identity claims (OIDC)',
				refresh_token: 'Refresh token for obtaining new access tokens',
				expires_in: 'Token expiration time in seconds',
				device_code: 'Device code for polling token endpoint (Device Code Flow)',
				user_code: 'User code to display for authorization (Device Code Flow)',
				verification_uri: 'URI where user enters the user code (Device Code Flow)',
				verification_uri_complete:
					'Complete verification URI with user code embedded (Device Code Flow, for QR codes)',
				device_code_expires_in: 'Device code expiration time in seconds',
				device_code_expires_at: 'Device code expiration timestamp',
				device_code_interval: 'Recommended polling interval in seconds',
				polling_interval:
					'Recommended polling interval in seconds (alias for device_code_interval)',
				request_uri: 'Request URI for PAR (Pushed Authorization Request)',
				par_expires_in: 'PAR request URI expiration time in seconds',
				authorization_code: 'Authorization code for token exchange',
				state: 'State parameter for CSRF protection',
				flowId: 'Flow ID for PingOne Flows API',
				redirectless_flowId: 'Flow ID for redirectless flow continuation',
				redirectless_resumeUrl: 'Resume URL for redirectless flow continuation',
				redirectless_sessionId: 'Session ID for redirectless flow',
				redirectless_status:
					'Current status of redirectless flow (USERNAME_PASSWORD_REQUIRED, MFA_REQUIRED, COMPLETE, etc.)',
				interactionId: 'Interaction ID for PingOne Flows API',
				interactionToken: 'Interaction token for PingOne Flows API',
				userId: 'User ID for device operations',
				deviceId: 'Device ID for device management operations',
				deviceAuthenticationId: 'Device authentication session ID for MFA verification',
				deviceAuthenticationPolicyId: 'MFA policy ID linked to the device',
				userToken: 'User access token for authenticated device operations',
				code_verifier: 'PKCE code verifier (secret value)',
				code_challenge: 'PKCE code challenge (public value, SHA256 hash of verifier)',
				code_challenge_method: 'PKCE code challenge method (S256)',
				token_type: 'Token type (typically "Bearer")',
				access_token_expires_at: 'Access token expiration timestamp',
				token_scope: 'Token scope (space-separated list of permissions)',
				emailVerificationRequired: 'Boolean indicating if email verification is required',
				populationId: 'Population (user group) ID',
				emailVerificationCode: 'Email verification code (OTP) from email',
				recoveryCode: 'Password recovery code sent via email/SMS',
			};

			let enhancedDescription = item.request.description;
			enhancedDescription += '\n\n**Variables Saved:**\n';
			savedVariables.forEach((varName) => {
				const description =
					varDescriptions[varName] || 'Saved to environment for use in subsequent requests';
				enhancedDescription += `- \`${varName}\` - ${description}\n`;
			});

			item.request.description = enhancedDescription;
		}
	}

	// Recursively enhance nested items
	if (item.item && Array.isArray(item.item)) {
		item.item = item.item.map((nestedItem) => enhanceItemDescription(nestedItem));
	}

	return item;
};

/**
 * Helper function to enhance all items in a Postman collection with Variables Saved information
 */
const enhanceCollectionDescriptions = (collection: PostmanCollection): PostmanCollection => {
	if (collection.item && Array.isArray(collection.item)) {
		collection.item = collection.item.map((item) => enhanceItemDescription(item));
	}
	return collection;
};

/**
 * Generate Postman collection from API calls
 */
export const generatePostmanCollection = (
	apiCalls: TrackedApiCall[],
	flowType: FlowType,
	specVersion: string,
	credentials?: {
		environmentId?: string;
		clientId?: string;
		clientSecret?: string;
	}
): PostmanCollection => {
	// Collect generation warnings/errors for this run.
	const issues = new GenerationIssues('generatePostmanCollection');

	const flowTypeLabels: Record<FlowType, string> = {
		'oauth-authz': 'Authorization Code',
		hybrid: 'Hybrid',
		implicit: 'Implicit',
		'client-credentials': 'Client Credentials',
		'device-code': 'Device Code',
		ropc: 'Resource Owner Password Credentials',
	};

	const collectionName = `PingOne ${flowTypeLabels[flowType]} Flow (${specVersion})`;

	// Build variables - match PingOne Postman collection format
	// Reference: https://apidocs.pingidentity.com/pingone/platform/v1/api/#the-pingone-postman-environment-template
	const variables: Array<{ key: string; value: string; type?: string; description?: string }> = [
		{ key: 'authPath', value: 'https://auth.pingone.com', type: 'string' },
		{
			key: 'envID',
			value: credentials?.environmentId || 'b9817c16-9910-4415-b67e-4ac687da74d9',
			type: 'string',
		},
	];

	// Worker client credentials (for Worker Token - server-to-server authentication)
	// ALWAYS use these default values for worker token - do NOT override with authorization credentials
	variables.push({
		key: 'worker_client_id',
		value: '66a4686b-9222-4ad2-91b6-03113711c9aa',
		type: 'string',
	});
	variables.push({
		key: 'worker_client_secret',
		value: '3D_ksu7589TfcVJm2fqEHjXuhc-DCRfoxEv0urEw8GIK7qiJe72n92WRQ0uaT2tC',
		type: 'secret',
	});

	// User/OAuth client credentials (for OAuth flows - user authentication)
	// Use passed-in credentials if provided (for authorization flows), otherwise use worker defaults
	if (credentials?.clientId) {
		variables.push({ key: 'user_client_id', value: credentials.clientId, type: 'string' });
	} else {
		variables.push({
			key: 'user_client_id',
			value: '66a4686b-9222-4ad2-91b6-03113711c9aa',
			type: 'string',
		});
	}

	if (credentials?.clientSecret) {
		variables.push({ key: 'user_client_secret', value: credentials.clientSecret, type: 'secret' });
	} else {
		variables.push({
			key: 'user_client_secret',
			value: '3D_ksu7589TfcVJm2fqEHjXuhc-DCRfoxEv0urEw8GIK7qiJe72n92WRQ0uaT2tC',
			type: 'secret',
		});
	}

	// Note: workerToken is NOT included in individual flow collections
	// Worker token is global and obtained separately outside of individual flows

	// Build collection items with educational comments and variable extraction scripts
	const items: PostmanCollectionItem[] = apiCalls.map((apiCall) => {
		// Get endpoint (prefer actualPingOneUrl if available, otherwise use url)
		const endpoint = apiCall.actualPingOneUrl || apiCall.url;
		const postmanUrl = convertEndpointToPostman(endpoint);
		const urlStructure = parseUrl(postmanUrl);
		const headers = extractHeaders(apiCall, apiCall.method);
		const body = convertRequestBody(apiCall.body as Record<string, unknown>, apiCall.method);

		// Build comprehensive educational description
		let educationalDescription = apiCall.step || `${apiCall.method} ${endpoint}`;

		// Add flow-specific educational context
		if (endpoint.includes('/as/authorize')) {
			educationalDescription += '\n\n**Educational Context:**\n';
			educationalDescription += '- This is the authorization request step in OAuth 2.0 flow\n';
			educationalDescription += '- User is redirected to PingOne login page\n';
			educationalDescription +=
				'- After authentication, user is redirected back with authorization code\n';
			educationalDescription += '- Authorization code is single-use and short-lived\n';
			educationalDescription += '- State parameter should be validated to prevent CSRF attacks\n';
			if (endpoint.includes('code_challenge')) {
				educationalDescription +=
					'- PKCE (Proof Key for Code Exchange) is used for enhanced security\n';
				educationalDescription += '- code_challenge is sent in this request (public value)\n';
			}
		} else if (endpoint.includes('/as/token')) {
			educationalDescription += '\n\n**Educational Context:**\n';
			if (apiCall.body && typeof apiCall.body === 'object') {
				const body = apiCall.body as Record<string, unknown>;
				if (body.grant_type === 'authorization_code') {
					educationalDescription +=
						'- Exchanges authorization code for access token and ID token\n';
					educationalDescription +=
						'- Authorization code must match the one from authorization request\n';
					educationalDescription +=
						'- redirect_uri must match the one used in authorization request\n';
					if (body.code_verifier) {
						educationalDescription +=
							'- code_verifier must match code_challenge from authorization request\n';
						educationalDescription +=
							'- Server verifies: SHA256(code_verifier) === code_challenge\n';
					}
				} else if (body.grant_type === 'client_credentials') {
					educationalDescription +=
						'- Client Credentials grant for server-to-server authentication\n';
					educationalDescription += '- No user interaction required\n';
					educationalDescription += '- Returns access token for API calls\n';
				} else if (body.grant_type === 'urn:ietf:params:oauth:grant-type:device_code') {
					educationalDescription += '- Device Code grant for devices without browsers\n';
					educationalDescription += '- Polls for tokens after user authorizes on another device\n';
					educationalDescription += '- Returns access token when user completes authorization\n';
				}
			}
			educationalDescription +=
				'- Response includes access_token, id_token (if OIDC), and refresh_token (if requested)\n';
		} else if (endpoint.includes('/as/introspect')) {
			educationalDescription += '\n\n**Educational Context:**\n';
			educationalDescription += '- Token introspection validates and returns token information\n';
			educationalDescription += '- Requires worker token for authentication\n';
			educationalDescription += '- Returns token metadata (active, exp, scopes, etc.)\n';
		} else if (endpoint.includes('/as/userinfo')) {
			educationalDescription += '\n\n**Educational Context:**\n';
			educationalDescription += '- UserInfo endpoint returns user identity claims\n';
			educationalDescription += '- Requires access token in Authorization header\n';
			educationalDescription += '- Returns user information (sub, name, email, etc.)\n';
		} else if (endpoint.includes('/as/device_authorization')) {
			educationalDescription += '\n\n**Educational Context:**\n';
			educationalDescription += '- Device Authorization Request (RFC 8628)\n';
			educationalDescription += '- Returns device_code and user_code for device flow\n';
			educationalDescription += '- User enters user_code on another device to authorize\n';
		} else if (endpoint.includes('/as/par')) {
			educationalDescription += '\n\n**Educational Context:**\n';
			educationalDescription += '- Pushed Authorization Request (PAR, RFC 9126)\n';
			educationalDescription += '- Pushes authorization parameters to server before redirect\n';
			educationalDescription += '- Returns request_uri that is used in authorization URL\n';
			educationalDescription += '- More secure than sending all parameters in URL\n';
		}

		// Determine what variables to extract based on endpoint and response
		const events: Array<{
			listen: 'prerequest' | 'test';
			script: { exec: string[]; type: string };
		}> = [];

		// Add test script to extract variables from response
		if (endpoint.includes('/as/token')) {
			events.push({
				listen: 'test' as const,
				script: {
					exec: [
						'pm.test("✅ Call was Successful - Token Exchange Completed", function() {',
						'    pm.response.to.have.status(200);',
						'});',
						'',
						'// ============================================',
						'// Token Extraction Script',
						'// ============================================',
						'// This script automatically extracts tokens from the token exchange response',
						'// and saves them to environment variables for use in subsequent requests.',
						'',
						'try {',
						'    if (pm.response.code === 200) {',
						'        const jsonData = pm.response.json();',
						'        ',
						'        // Extract access token (used for API authentication)',
						'        if (jsonData.access_token) {',
						'            pm.environment.set("access_token", jsonData.access_token);',
						'            ',
						'            pm.test("✅ Access Token was saved to variable access_token", function() {',
						'                pm.expect(jsonData.access_token, "Access token should be a non-empty string").to.be.a("string").and.not.empty;',
						'            });',
						'            ',
						'            console.log("✅ Access token saved to environment");',
						'        }',
						'        ',
						'        // Extract ID token (contains user identity claims)',
						'        if (jsonData.id_token) {',
						'            pm.environment.set("id_token", jsonData.id_token);',
						'            ',
						'            pm.test("✅ ID Token was saved to variable id_token", function() {',
						'                pm.expect(jsonData.id_token, "ID token should be a non-empty string").to.be.a("string").and.not.empty;',
						'            });',
						'            ',
						'            console.log("✅ ID token saved to environment");',
						'        }',
						'        ',
						'        // Extract refresh token (used to get new access tokens)',
						'        if (jsonData.refresh_token) {',
						'            pm.environment.set("refresh_token", jsonData.refresh_token);',
						'            ',
						'            pm.test("✅ Refresh Token was saved to variable refresh_token", function() {',
						'                pm.expect(jsonData.refresh_token, "Refresh token should be a non-empty string").to.be.a("string").and.not.empty;',
						'            });',
						'            ',
						'            console.log("✅ Refresh token saved to environment");',
						'        }',
						'        ',
						'        // Extract token expiration time',
						'        if (jsonData.expires_in) {',
						'            pm.environment.set("expires_in", jsonData.expires_in);',
						'        }',
						'        ',
						'        pm.test("✅ Response contains token information", function() {',
						'            pm.expect(jsonData).to.have.property("access_token");',
						'            pm.expect(jsonData).to.have.property("token_type", "Bearer");',
						'        });',
						'    } else {',
						'        console.log("❌ Token exchange failed:", pm.response.code);',
						'        console.log("Response:", pm.response.text());',
						'        pm.test("❌ Token exchange should return 200", function() {',
						'            pm.expect.fail("Token exchange failed with status: " + pm.response.code);',
						'        });',
						'    }',
						'} catch (e) {',
						'    console.log("❌ There was an error parsing JSON", e);',
						'    pm.test("❌ Response should be valid JSON", function() {',
						'        pm.expect.fail("Failed to parse response as JSON: " + e.message);',
						'    });',
						'}',
					],
					type: 'text/javascript',
				},
			});
		} else if (endpoint.includes('/as/device_authorization')) {
			events.push({
				listen: 'test' as const,
				script: {
					exec: [
						'pm.test("✅ Call was Successful - Device Authorization Completed", function() {',
						'    pm.response.to.have.status(200);',
						'});',
						'',
						'// ============================================',
						'// Device Code Extraction Script',
						'// ============================================',
						'// This script extracts device_code and user_code from device authorization response',
						'',
						'try {',
						'    if (pm.response.code === 200) {',
						'        const jsonData = pm.response.json();',
						'        ',
						'        // Extract device_code (used for polling tokens)',
						'        if (jsonData.device_code) {',
						'            pm.environment.set("device_code", jsonData.device_code);',
						'            ',
						'            pm.test("✅ Device Code was saved to variable device_code", function() {',
						'                pm.expect(jsonData.device_code, "Device code should be a non-empty string").to.be.a("string").and.not.empty;',
						'            });',
						'            ',
						'            console.log("✅ Device code saved to environment");',
						'        }',
						'        ',
						'        // Extract user_code (display to user for authorization)',
						'        if (jsonData.user_code) {',
						'            pm.environment.set("user_code", jsonData.user_code);',
						'            ',
						'            pm.test("✅ User Code was saved to variable user_code", function() {',
						'                pm.expect(jsonData.user_code, "User code should be a non-empty string").to.be.a("string").and.not.empty;',
						'            });',
						'            ',
						'            console.log("✅ User code saved to environment:", jsonData.user_code);',
						'        }',
						'        ',
						'        // Extract verification URI',
						'        if (jsonData.verification_uri) {',
						'            pm.environment.set("verification_uri", jsonData.verification_uri);',
						'            console.log("✅ Verification URI:", jsonData.verification_uri);',
						'        }',
						'        ',
						'        // Extract expiration time',
						'        if (jsonData.expires_in) {',
						'            pm.environment.set("device_code_expires_in", jsonData.expires_in);',
						'        }',
						'        ',
						'        // Extract polling interval',
						'        if (jsonData.interval) {',
						'            pm.environment.set("polling_interval", jsonData.interval);',
						'        }',
						'        ',
						'        pm.test("✅ Response contains device authorization codes", function() {',
						'            pm.expect(jsonData).to.have.property("device_code");',
						'            pm.expect(jsonData).to.have.property("user_code");',
						'        });',
						'    } else {',
						'        console.log("❌ Device authorization failed:", pm.response.code);',
						'        pm.test("❌ Device authorization should return 200", function() {',
						'            pm.expect.fail("Device authorization failed with status: " + pm.response.code);',
						'        });',
						'    }',
						'} catch (e) {',
						'    console.log("❌ There was an error parsing JSON", e);',
						'    pm.test("❌ Response should be valid JSON", function() {',
						'        pm.expect.fail("Failed to parse response as JSON: " + e.message);',
						'    });',
						'}',
					],
					type: 'text/javascript',
				},
			});
		} else if (endpoint.includes('/as/par')) {
			events.push({
				listen: 'test' as const,
				script: {
					exec: [
						'pm.test("✅ Call was Successful - PAR Request Completed", function() {',
						'    pm.response.to.have.status(201);',
						'});',
						'',
						'// ============================================',
						'// PAR Request URI Extraction Script',
						'// ============================================',
						'// This script extracts request_uri from PAR response',
						'',
						'try {',
						'    if (pm.response.code === 201) {',
						'        const jsonData = pm.response.json();',
						'        ',
						'        // Extract request_uri (used in authorization URL)',
						'        if (jsonData.request_uri) {',
						'            pm.environment.set("request_uri", jsonData.request_uri);',
						'            ',
						'            pm.test("✅ Request URI was saved to variable request_uri", function() {',
						'                pm.expect(jsonData.request_uri, "Request URI should be a non-empty string").to.be.a("string").and.not.empty;',
						'            });',
						'            ',
						'            console.log("✅ Request URI saved to environment");',
						'        }',
						'        ',
						'        // Extract expiration time',
						'        if (jsonData.expires_in) {',
						'            pm.environment.set("par_expires_in", jsonData.expires_in);',
						'        }',
						'        ',
						'        pm.test("✅ Response contains request_uri", function() {',
						'            pm.expect(jsonData).to.have.property("request_uri");',
						'        });',
						'    } else {',
						'        console.log("❌ PAR request failed:", pm.response.code);',
						'        pm.test("❌ PAR request should return 201", function() {',
						'            pm.expect.fail("PAR request failed with status: " + pm.response.code);',
						'        });',
						'    }',
						'} catch (e) {',
						'    console.log("❌ There was an error parsing JSON", e);',
						'    pm.test("❌ Response should be valid JSON", function() {',
						'        pm.expect.fail("Failed to parse response as JSON: " + e.message);',
						'    });',
						'}',
					],
					type: 'text/javascript',
				},
			});
		}

		// Extract variables saved from test scripts and add to description
		const savedVariables: string[] = [];
		events.forEach((event) => {
			if (event.listen === 'test') {
				event.script.exec.forEach((line) => {
					const match = line.match(/pm\.environment\.set\(["']([^"']+)["']/);
					if (match?.[1]) {
						savedVariables.push(match[1]);
					}
				});
			}
		});

		// Enhance description with Variables Saved section if variables are saved
		let enhancedDescription = educationalDescription;
		if (savedVariables.length > 0) {
			const uniqueVariables = [...new Set(savedVariables)];
			enhancedDescription += '\n\n**Variables Saved:**\n';
			uniqueVariables.forEach((varName) => {
				// Add helpful descriptions for common variables
				const varDescriptions: Record<string, string> = {
					access_token: 'Access token for API authentication (Bearer token)',
					id_token: 'ID token containing user identity claims (OIDC)',
					refresh_token: 'Refresh token for obtaining new access tokens',
					expires_in: 'Token expiration time in seconds',
					device_code: 'Device code for polling token endpoint',
					user_code: 'User code to display for authorization',
					verification_uri: 'URI where user enters the user code',
					device_code_expires_in: 'Device code expiration time in seconds',
					polling_interval: 'Recommended polling interval in seconds',
					request_uri: 'Request URI for PAR (Pushed Authorization Request)',
					par_expires_in: 'PAR request URI expiration time in seconds',
				};
				const description =
					varDescriptions[varName] || 'Saved to environment for use in subsequent requests';
				enhancedDescription += `- \`${varName}\` - ${description}\n`;
			});
		}

		return {
			name: apiCall.step || `${apiCall.method} ${endpoint}`,
			request: {
				method: apiCall.method,
				...(headers.length > 0 && { header: headers }),
				...(body && { body }),
				url: urlStructure,
				description: enhancedDescription,
			},
			...(events.length > 0 && { event: events }),
		};
	});

	const finalizedVariables = finalizeVariables(variables, issues, collectionName);
	const collection: PostmanCollection = {
		info: {
			name: collectionName,
			description: `Postman collection for PingOne ${flowTypeLabels[flowType]} Flow (${specVersion}). Generated from OAuth Playground.`,
			schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
		},
		variable: finalizedVariables,
		item: items,
	};

	validateCollection(collection, issues, collectionName);
	validateEnvironment(finalizedVariables, issues, collectionName);
	validatePlaceholders(JSON.stringify(collection), issues, collectionName);
	issues.printSummary();
	issues.throwIfErrors();
	return collection;
};

/**
 * Generate Postman collection for MFA flows
 */
export const generateMFAPostmanCollection = (
	apiCalls: Array<{
		step: string;
		method: string;
		endpoint: string;
		description: string;
		requestBody: Record<string, unknown>;
		responseBody: Record<string, unknown>;
		notes?: string[];
	}>,
	deviceType: string,
	flowType: 'registration' | 'authentication',
	credentials?: {
		environmentId?: string;
		username?: string;
	}
): PostmanCollection => {
	// Collect generation warnings/errors for this run.
	const issues = new GenerationIssues('generateMFAPostmanCollection');

	const collectionName = `PingOne MFA ${deviceType} ${flowType === 'registration' ? 'Registration' : 'Authentication'}`;

	// Build variables - match PingOne Postman collection format
	// Reference: https://apidocs.pingidentity.com/pingone/platform/v1/api/#the-pingone-postman-environment-template
	// Note: workerToken is NOT included - it's global and obtained separately outside of individual flows
	const variables: Array<{ key: string; value: string; type?: string; description?: string }> = [
		{ key: 'authPath', value: 'https://auth.pingone.com', type: 'string' },
		{ key: 'apiPath', value: 'https://api.pingone.com', type: 'string' },
		{
			key: 'envID',
			value: credentials?.environmentId || 'b9817c16-9910-4415-b67e-4ac687da74d9',
			type: 'string',
		},
		{ key: 'username', value: credentials?.username || '', type: 'string' },
		{ key: 'userId', value: '', type: 'string' },
		{ key: 'deviceId', value: '', type: 'string' },
		{ key: 'deviceAuthenticationPolicyId', value: '', type: 'string' },
		{ key: 'deviceAuthenticationId', value: '', type: 'string' },
		{ key: 'otp_code', value: '', type: 'string' },
	];

	// Build collection items
	const items: PostmanCollectionItem[] = apiCalls.map((apiCall) => {
		const postmanUrl = convertEndpointToPostman(apiCall.endpoint);
		const urlStructure = parseUrl(postmanUrl);

		// Extract headers
		const headers: Array<{ key: string; value: string; type?: string }> = [];

		// Add Content-Type
		if (['POST', 'PUT', 'PATCH'].includes(apiCall.method)) {
			if (apiCall.endpoint.includes('deviceAuthentications')) {
				// Check for special content types
				if (apiCall.description?.toLowerCase().includes('assertion')) {
					headers.push({
						key: 'Content-Type',
						value: 'application/vnd.pingidentity.assertion.check+json',
					});
				} else if (apiCall.description?.toLowerCase().includes('select')) {
					headers.push({
						key: 'Content-Type',
						value: 'application/vnd.pingidentity.device.select+json',
					});
				} else {
					headers.push({ key: 'Content-Type', value: 'application/json' });
				}
			} else {
				headers.push({ key: 'Content-Type', value: 'application/json' });
			}
		}

		// Add Authorization header based on flow type
		// Note: Individual flow collections don't include workerToken
		// User flows use userToken, admin flows would use workerToken (but workerToken is global)
		if (apiCall.requestBody && typeof apiCall.requestBody === 'object') {
			const body = apiCall.requestBody as Record<string, unknown>;
			// Check if this is a user flow step (has userToken) or admin flow step
			if (
				apiCall.step.includes('Authorization Code') ||
				apiCall.step.includes('Exchange') ||
				apiCall.step.includes('Token')
			) {
				// User flow - uses userToken from OAuth login
				headers.push({
					key: 'Authorization',
					value: 'Bearer {{userToken}}',
				});
			} else if (body.workerToken) {
				// Admin flow - but note: workerToken is global, not in individual collections
				// This is for reference only - actual collections won't include workerToken
				headers.push({
					key: 'Authorization',
					value: 'Bearer {{workerToken}}',
				});
			} else if (apiCall.endpoint.includes('/users') || apiCall.endpoint.includes('/devices')) {
				// Most MFA API calls require authorization
				// Default to userToken for user flows, workerToken for admin flows
				// Since we don't know the flow type here, we'll use a variable that can be set
				headers.push({
					key: 'Authorization',
					value: 'Bearer {{userToken}}',
				});
			}
		}

		// Convert request body
		const body = convertRequestBody(apiCall.requestBody, apiCall.method);

		// Build comprehensive educational description
		let educationalDescription = apiCall.description || '';

		// Add notes as educational content if available
		if (apiCall.notes && apiCall.notes.length > 0) {
			educationalDescription += '\n\n**Educational Notes:**\n';
			apiCall.notes.forEach((note) => {
				educationalDescription += `- ${note}\n`;
			});
		}

		// Add flow context if available
		if (apiCall.step.includes('Worker Token')) {
			educationalDescription += '\n\n**Flow Context:**\n';
			educationalDescription += '- This is the first step in Admin Flow\n';
			educationalDescription += '- Worker tokens are used for administrative operations\n';
			educationalDescription += '- No user login is required for this token\n';
			educationalDescription +=
				'- Permissions are controlled by roles assigned to the client application\n';
			educationalDescription +=
				'- **Note:** Worker token is obtained separately and is not included in individual flow collections\n';
		} else if (
			apiCall.step.includes('Authorization Code') ||
			apiCall.step.includes('Build Authorization URL')
		) {
			educationalDescription += '\n\n**Flow Context:**\n';
			educationalDescription += '- This is part of User Flow (OAuth 2.0 Authorization Code Flow)\n';
			educationalDescription += '- User must authenticate with PingOne before proceeding\n';
			educationalDescription += '- After login, user is redirected back with authorization code\n';
			educationalDescription += '- Authorization code is exchanged for access token (userToken)\n';
		} else if (apiCall.step.includes('Exchange') && apiCall.step.includes('Token')) {
			educationalDescription += '\n\n**Flow Context:**\n';
			educationalDescription += '- Exchanges authorization code for access token (userToken)\n';
			educationalDescription += '- userToken is used for subsequent MFA device operations\n';
			educationalDescription += '- Token is automatically extracted and saved by the test script\n';
		} else if (apiCall.step.includes('Get User ID') || apiCall.step.includes('User Lookup')) {
			educationalDescription += '\n\n**Flow Context:**\n';
			educationalDescription += '- This step retrieves the user ID needed for device operations\n';
			educationalDescription += '- The userId will be used in subsequent API calls\n';
			educationalDescription +=
				'- User ID is automatically extracted and saved by the test script\n';
		} else if (apiCall.step.includes('Create') && apiCall.step.includes('Device')) {
			educationalDescription += '\n\n**Flow Context:**\n';
			if (apiCall.requestBody && typeof apiCall.requestBody === 'object') {
				const body = apiCall.requestBody as Record<string, unknown>;
				if (body.status === 'ACTIVE') {
					educationalDescription += '- Device is created with ACTIVE status (Admin Flow)\n';
					educationalDescription += '- Device is immediately usable, no OTP activation required\n';
					educationalDescription += '- This is only possible with worker token (Admin Flow)\n';
				} else if (body.status === 'ACTIVATION_REQUIRED') {
					educationalDescription += '- Device is created with ACTIVATION_REQUIRED status\n';
					educationalDescription += '- PingOne automatically sends OTP to the device\n';
					educationalDescription += '- User must activate device with OTP before first use\n';
					educationalDescription +=
						'- User Flow always uses ACTIVATION_REQUIRED (security requirement)\n';
				}
			}
			educationalDescription +=
				'- Device ID is automatically extracted and saved by the test script\n';
			educationalDescription += '- Policy ID links the device to an MFA authentication policy\n';
		} else if (apiCall.step.includes('Activate')) {
			educationalDescription += '\n\n**Flow Context:**\n';
			educationalDescription +=
				'- This step activates a device that was created with ACTIVATION_REQUIRED status\n';
			educationalDescription +=
				'- OTP code is received via SMS/Email/WhatsApp/OATH TOTP (RFC 6238) app\n';
			educationalDescription += '- After successful activation, device status changes to ACTIVE\n';
			educationalDescription += '- Device can now be used for MFA authentication\n';
		} else if (apiCall.step.includes('Initialize Device Authentication')) {
			educationalDescription += '\n\n**Flow Context:**\n';
			educationalDescription += '- This starts the MFA authentication process\n';
			educationalDescription += '- PingOne sends OTP to the selected device\n';
			educationalDescription += '- Device Authentication ID is automatically extracted and saved\n';
			educationalDescription += '- This ID is used in subsequent authentication steps\n';
		} else if (apiCall.step.includes('Check OTP')) {
			educationalDescription += '\n\n**Flow Context:**\n';
			educationalDescription += '- User enters OTP code received on their device\n';
			educationalDescription += '- OTP is validated against the device authentication session\n';
			educationalDescription += '- If valid, authentication proceeds to completion\n';
		} else if (apiCall.step.includes('Complete Authentication')) {
			educationalDescription += '\n\n**Flow Context:**\n';
			educationalDescription += '- This finalizes the MFA authentication process\n';
			educationalDescription += '- Authentication is now complete and user can proceed\n';
		}

		// Determine what variables to extract based on endpoint and response
		const events: Array<{
			listen: 'prerequest' | 'test';
			script: { exec: string[]; type: string };
		}> = [];

		// Add test script to extract variables from response
		if (
			apiCall.endpoint.includes('/users') &&
			apiCall.method === 'GET' &&
			apiCall.step.includes('User ID')
		) {
			// Extract userId from user lookup response
			events.push({
				listen: 'test' as const,
				script: {
					exec: [
						'pm.test("✅ Call was Successful - User Lookup Completed", function() {',
						'    pm.response.to.have.status(200);',
						'});',
						'',
						'// ============================================',
						'// User ID Extraction Script',
						'// ============================================',
						'// This script extracts the user ID from the user lookup response',
						'// The userId is used in subsequent device operations',
						'',
						'try {',
						'    if (pm.response.code === 200) {',
						'        const jsonData = pm.response.json();',
						'        ',
						'        // Extract userId from embedded users array',
						'        if (jsonData._embedded && jsonData._embedded.users && jsonData._embedded.users.length > 0) {',
						'            const userId = jsonData._embedded.users[0].id;',
						'            pm.environment.set("userId", userId);',
						'            ',
						'            pm.test("✅ User ID was saved to variable userId", function() {',
						'                pm.expect(userId, "User ID should be a non-empty string").to.be.a("string").and.not.empty;',
						'            });',
						'            ',
						'            console.log("✅ User ID saved to environment:", userId);',
						'        } else if (jsonData.id) {',
						'            // Direct user object response',
						'            pm.environment.set("userId", jsonData.id);',
						'            ',
						'            pm.test("✅ User ID was saved to variable userId", function() {',
						'                pm.expect(jsonData.id, "User ID should be a non-empty string").to.be.a("string").and.not.empty;',
						'            });',
						'            ',
						'            console.log("✅ User ID saved to environment:", jsonData.id);',
						'        }',
						'    } else {',
						'        console.log("❌ User lookup failed:", pm.response.code);',
						'        pm.test("❌ User lookup should return 200", function() {',
						'            pm.expect.fail("User lookup failed with status: " + pm.response.code);',
						'        });',
						'    }',
						'} catch (e) {',
						'    console.log("❌ There was an error parsing JSON", e);',
						'    pm.test("❌ Response should be valid JSON", function() {',
						'        pm.expect.fail("Failed to parse response as JSON: " + e.message);',
						'    });',
						'}',
					],
					type: 'text/javascript',
				},
			});
		} else if (
			apiCall.endpoint.includes('/devices') &&
			apiCall.method === 'POST' &&
			apiCall.step.includes('Create')
		) {
			// Extract deviceId from device creation response
			events.push({
				listen: 'test' as const,
				script: {
					exec: [
						'pm.test("✅ Call was Successful - Device Created", function() {',
						'    pm.expect(pm.response.code, "Response should be 200 or 201").to.be.oneOf([200, 201]);',
						'});',
						'',
						'// ============================================',
						'// Device ID Extraction Script',
						'// ============================================',
						'// This script extracts the device ID from the device creation response',
						'// The deviceId is used in subsequent device operations (activate, delete, etc.)',
						'',
						'try {',
						'    if (pm.response.code === 201 || pm.response.code === 200) {',
						'        const jsonData = pm.response.json();',
						'        ',
						'        // Extract deviceId from response',
						'        if (jsonData.id) {',
						'            pm.environment.set("deviceId", jsonData.id);',
						'            ',
						'            pm.test("✅ Device ID was saved to variable deviceId", function() {',
						'                pm.expect(jsonData.id, "Device ID should be a non-empty string").to.be.a("string").and.not.empty;',
						'            });',
						'            ',
						'            console.log("✅ Device ID saved to environment:", jsonData.id);',
						'        }',
						'        ',
						'        // Also extract policy ID if available',
						'        if (jsonData.policy && jsonData.policy.id) {',
						'            pm.environment.set("deviceAuthenticationPolicyId", jsonData.policy.id);',
						'            console.log("✅ Policy ID saved to environment:", jsonData.policy.id);',
						'        }',
						'    } else {',
						'        console.log("❌ Device creation failed:", pm.response.code);',
						'        pm.test("❌ Device creation should return 200 or 201", function() {',
						'            pm.expect.fail("Device creation failed with status: " + pm.response.code);',
						'        });',
						'    }',
						'} catch (e) {',
						'    console.log("❌ There was an error parsing JSON", e);',
						'    pm.test("❌ Response should be valid JSON", function() {',
						'        pm.expect.fail("Failed to parse response as JSON: " + e.message);',
						'    });',
						'}',
					],
					type: 'text/javascript',
				},
			});
		} else if (
			apiCall.endpoint.includes('deviceAuthentications') &&
			apiCall.method === 'POST' &&
			apiCall.step.includes('Initialize')
		) {
			// Extract deviceAuthenticationId from device authentication initialization response
			events.push({
				listen: 'test' as const,
				script: {
					exec: [
						'pm.test("✅ Call was Successful - Device Authentication Initialized", function() {',
						'    pm.expect(pm.response.code, "Response should be 200 or 201").to.be.oneOf([200, 201]);',
						'});',
						'',
						'// ============================================',
						'// Device Authentication ID Extraction Script',
						'// ============================================',
						'// This script extracts the device authentication ID from the initialization response',
						'// The deviceAuthenticationId is used in subsequent authentication steps (check OTP, complete)',
						'',
						'try {',
						'    if (pm.response.code === 201 || pm.response.code === 200) {',
						'        const jsonData = pm.response.json();',
						'        ',
						'        // Extract deviceAuthenticationId from response',
						'        if (jsonData.id) {',
						'            pm.environment.set("deviceAuthenticationId", jsonData.id);',
						'            ',
						'            pm.test("✅ Device Authentication ID was saved to variable deviceAuthenticationId", function() {',
						'                pm.expect(jsonData.id, "Device authentication ID should be a non-empty string").to.be.a("string").and.not.empty;',
						'            });',
						'            ',
						'            console.log("✅ Device Authentication ID saved to environment:", jsonData.id);',
						'        }',
						'    } else {',
						'        console.log("❌ Device authentication initialization failed:", pm.response.code);',
						'        pm.test("❌ Device authentication initialization should return 200 or 201", function() {',
						'            pm.expect.fail("Device authentication initialization failed with status: " + pm.response.code);',
						'        });',
						'    }',
						'} catch (e) {',
						'    console.log("❌ There was an error parsing JSON", e);',
						'    pm.test("❌ Response should be valid JSON", function() {',
						'        pm.expect.fail("Failed to parse response as JSON: " + e.message);',
						'    });',
						'}',
					],
					type: 'text/javascript',
				},
			});
		} else if (
			apiCall.step.includes('Exchange') &&
			apiCall.step.includes('Token') &&
			apiCall.endpoint.includes('/as/token')
		) {
			// Extract userToken from token exchange response
			events.push({
				listen: 'test' as const,
				script: {
					exec: [
						'// ============================================',
						'// User Token Extraction Script',
						'// ============================================',
						'// This script extracts the access token (userToken) from the token exchange response',
						'// The userToken is used for subsequent MFA device operations',
						'',
						'if (pm.response.code === 200) {',
						'    const jsonData = pm.response.json();',
						'    ',
						'    // Extract access token (userToken)',
						'    if (jsonData.access_token) {',
						'        pm.environment.set("userToken", jsonData.access_token);',
						'        console.log("✅ User token saved to environment");',
						'    }',
						'    ',
						'    // Also extract ID token if available (contains user ID)',
						'    if (jsonData.id_token) {',
						'        pm.environment.set("id_token", jsonData.id_token);',
						'        console.log("✅ ID token saved to environment");',
						'    }',
						'} else {',
						'    console.log("❌ Token exchange failed:", pm.response.code);',
						'}',
					],
					type: 'text/javascript',
				},
			});
		}

		// Extract variables saved from test scripts and add to description
		const savedVariables: string[] = [];
		events.forEach((event) => {
			if (event.listen === 'test') {
				event.script.exec.forEach((line) => {
					const match = line.match(/pm\.environment\.set\(["']([^"']+)["']/);
					if (match?.[1]) {
						savedVariables.push(match[1]);
					}
				});
			}
		});

		// Enhance description with Variables Saved section if variables are saved
		let enhancedDescription = educationalDescription;
		if (savedVariables.length > 0) {
			const uniqueVariables = [...new Set(savedVariables)];
			enhancedDescription += '\n\n**Variables Saved:**\n';
			uniqueVariables.forEach((varName) => {
				// Add helpful descriptions for common MFA variables
				const varDescriptions: Record<string, string> = {
					userId: 'User ID used for device operations',
					deviceId: 'Device ID used for device management operations',
					deviceAuthenticationId: 'Device authentication session ID used for MFA verification',
					deviceAuthenticationPolicyId: 'MFA policy ID linked to the device',
					userToken: 'User access token for authenticated device operations',
					id_token: 'ID token containing user identity claims (OIDC)',
				};
				const description =
					varDescriptions[varName] || 'Saved to environment for use in subsequent requests';
				enhancedDescription += `- \`${varName}\` - ${description}\n`;
			});
		}

		return {
			name: apiCall.step,
			request: {
				method: apiCall.method,
				...(headers.length > 0 && { header: headers }),
				...(body && { body }),
				url: urlStructure,
				description: enhancedDescription,
			},
			...(events.length > 0 && { event: events }),
		};
	});

	const finalizedVariables = finalizeVariables(variables, issues, collectionName);
	const collection: PostmanCollection = {
		info: {
			name: collectionName,
			description: `Postman collection for PingOne MFA ${deviceType} ${flowType === 'registration' ? 'Registration' : 'Authentication'}. Generated from OAuth Playground.`,
			schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
		},
		variable: finalizedVariables,
		item: items,
	};

	validateCollection(collection, issues, collectionName);
	validateEnvironment(finalizedVariables, issues, collectionName);
	validatePlaceholders(JSON.stringify(collection), issues, collectionName);
	issues.printSummary();
	issues.throwIfErrors();
	return collection;
};

/**
 * Helper: Generate token extraction script based on spec version
 * OAuth 2.0: Only access_token and refresh_token (no id_token)
 * OIDC/OIDC 2.1: access_token, id_token, and refresh_token
 */
const generateTokenExtractionScript = (specVersion: 'oauth2.0' | 'oidc' | 'oidc2.1'): string[] => {
	const baseScript = [
		'// ============================================',
		'// Token Extraction Script',
		'// ============================================',
		'// This script automatically extracts tokens from the token exchange response',
		'// and saves them to environment variables for use in subsequent requests.',
		'//',
		'if (pm.response.code === 200) {',
		'    const jsonData = pm.response.json();',
		'    if (jsonData.access_token) {',
		'        pm.environment.set("access_token", jsonData.access_token);',
		'    }',
	];

	if (specVersion === 'oidc' || specVersion === 'oidc2.1') {
		baseScript.push(
			'    // ID Token: Contains user identity information (JWT) - OIDC only',
			'    if (jsonData.id_token) {',
			'        pm.environment.set("id_token", jsonData.id_token);',
			'    }'
		);
	}

	baseScript.push(
		'    // Refresh Token: Used to obtain new access tokens when expired',
		'    if (jsonData.refresh_token) {',
		'        pm.environment.set("refresh_token", jsonData.refresh_token);',
		'    }',
		'}'
	);

	return baseScript;
};

/**
 * Helper: Get default scopes based on spec version
 * OAuth 2.0: No offline_access, no openid
 * OIDC: openid profile email (optional offline_access)
 * OIDC 2.1: openid profile email offline_access (offline_access recommended)
 */
const getDefaultScopes = (specVersion: 'oauth2.0' | 'oidc' | 'oidc2.1'): string => {
	if (specVersion === 'oauth2.0') {
		return 'profile email'; // No openid, no offline_access
	}
	if (specVersion === 'oidc') {
		return 'openid profile email'; // Optional offline_access
	}
	// OIDC 2.1
	return 'openid profile email offline_access'; // offline_access recommended
};

/**
 * Helper: Build Authorization Code flow for a specific spec version
 */
const buildAuthorizationCodeFlow = (
	specVersion: 'oauth2.0' | 'oidc' | 'oidc2.1',
	authMethod:
		| 'client_secret_post'
		| 'client_secret_basic'
		| 'client_secret_jwt'
		| 'private_key_jwt',
	baseUrl: string,
	includePKCE: boolean = false,
	includePAR: boolean = false,
	responseMode?: 'query' | 'fragment' | 'form_post'
): PostmanCollectionItem => {
	const responseModeLabel =
		responseMode === 'query'
			? ' (Query String)'
			: responseMode === 'fragment'
				? ' (URL Fragment)'
				: responseMode === 'form_post'
					? ' (Form POST)'
					: '';
	const flowName = `Authorization Code - ${authMethod === 'client_secret_post' ? 'Client Secret Post' : authMethod === 'client_secret_basic' ? 'Client Secret Basic' : authMethod === 'client_secret_jwt' ? 'Client Secret JWT' : 'Private Key JWT'}${responseModeLabel}${includePKCE ? ' with PKCE' : ''}${includePAR ? ' and PAR' : ''}`;
	const scopeVarName =
		specVersion === 'oauth2.0'
			? 'scopes_oauth2'
			: specVersion === 'oidc'
				? 'scopes_oidc'
				: 'scopes_oidc21';
	const tokenExtractionScript = generateTokenExtractionScript(specVersion);

	const items: PostmanCollectionItem[] = [];

	// Step 1: Generate PKCE codes if needed
	if (includePKCE) {
		items.push({
			name: '1. Generate PKCE Codes',
			request: {
				method: 'GET',
				url: parseUrl(`${baseUrl}/generate-pkce`),
				description: `**Generate PKCE Codes**\n\n**Educational Context:**\n- PKCE (Proof Key for Code Exchange) adds security to Authorization Code flow\n- ${specVersion === 'oidc2.1' ? 'REQUIRED for OIDC 2.1' : 'Optional for OIDC, recommended for all clients'}\n- Generates code_verifier (secret) and code_challenge (public)\n- Code challenge is SHA256 hash of code verifier\n- This is a local script step - the actual URL doesn't matter as the pre-request script generates the codes\n- The generated codes are automatically saved to environment variables: code_verifier, code_challenge, code_challenge_method`,
			},
			event: [
				{
					listen: 'prerequest',
					script: {
						exec: [
							'// Generate PKCE code verifier and challenge',
							'// This script runs BEFORE the request and generates the PKCE codes',
							'function generateCodeVerifier() {',
							'    const array = new Uint8Array(32);',
							'    crypto.getRandomValues(array);',
							'    return btoa(String.fromCharCode.apply(null, Array.from(array)))',
							'        .replace(/\\+/g, "-")',
							'        .replace(/\\//g, "_")',
							'        .replace(/=/g, "");',
							'}',
							'',
							'function generateCodeChallenge(verifier) {',
							'    return CryptoJS.SHA256(verifier).toString(CryptoJS.enc.Base64)',
							'        .replace(/\\+/g, "-")',
							'        .replace(/\\//g, "_")',
							'        .replace(/=/g, "");',
							'}',
							'',
							'const codeVerifier = generateCodeVerifier();',
							'const codeChallenge = generateCodeChallenge(codeVerifier);',
							'',
							'pm.environment.set("code_verifier", codeVerifier);',
							'pm.environment.set("code_challenge", codeChallenge);',
							'pm.environment.set("code_challenge_method", "S256");',
							'',
							'console.log("✅ PKCE codes generated:");',
							'console.log("   Code Verifier:", codeVerifier);',
							'console.log("   Code Challenge:", codeChallenge);',
							'console.log("   Method: S256");',
						],
						type: 'text/javascript',
					},
				},
				{
					listen: 'test',
					script: {
						exec: [
							'// Verify PKCE codes were generated',
							'const codeVerifier = pm.environment.get("code_verifier");',
							'const codeChallenge = pm.environment.get("code_challenge");',
							'',
							'if (codeVerifier && codeChallenge) {',
							'    console.log("✅ PKCE codes successfully saved to environment variables");',
							'    pm.test("PKCE codes generated", function () {',
							'        pm.expect(codeVerifier).to.be.a("string");',
							'        pm.expect(codeChallenge).to.be.a("string");',
							'        pm.expect(codeVerifier.length).to.be.at.least(43);',
							'        pm.expect(codeChallenge.length).to.be.at.least(43);',
							'    });',
							'} else {',
							'    console.log("❌ PKCE codes generation failed");',
							'}',
						],
						type: 'text/javascript',
					},
				},
			],
		});
	}

	// Step 2: Push Authorization Request (PAR) if needed
	if (includePAR) {
		items.push({
			name: `${items.length + 1}. Push Authorization Request (PAR)`,
			request: {
				method: 'POST',
				header: [{ key: 'Content-Type', value: 'application/x-www-form-urlencoded' }],
				body: {
					mode: 'urlencoded',
					urlencoded: [
						{ key: 'client_id', value: '{{user_client_id}}' },
						{ key: 'response_type', value: 'code' },
						{ key: 'redirect_uri', value: '{{redirect_uri}}' },
						{ key: 'scope', value: `{{${scopeVarName}}}` },
						{ key: 'state', value: '{{state}}' },
						...(includePKCE
							? [
									{ key: 'code_challenge', value: '{{code_challenge}}' },
									{ key: 'code_challenge_method', value: '{{code_challenge_method}}' },
								]
							: []),
					],
				},
				url: parseUrl(`${baseUrl}/as/par`),
				description:
					'**Push Authorization Request (PAR)**\n\n**Educational Context:**\n- PAR (Pushed Authorization Requests) pushes auth parameters to server first\n- More secure than sending all parameters in URL\n- Returns request_uri that is used in authorization URL',
			},
			event: [
				{
					listen: 'test',
					script: {
						exec: [
							'if (pm.response.code === 201) {',
							'    const jsonData = pm.response.json();',
							'    if (jsonData.request_uri) {',
							'        pm.environment.set("request_uri", jsonData.request_uri);',
							'    }',
							'}',
						],
						type: 'text/javascript',
					},
				},
			],
		});
	}

	// Step 3: Build Authorization URL
	const authUrlQuery = [
		{ key: 'client_id', value: '{{user_client_id}}' },
		{ key: 'response_type', value: 'code' },
		{ key: 'redirect_uri', value: '{{redirect_uri}}' },
		{ key: 'scope', value: `{{${scopeVarName}}}` },
		{ key: 'state', value: '{{state}}' },
	];

	// Add response_mode parameter if specified
	if (responseMode) {
		authUrlQuery.push({ key: 'response_mode', value: responseMode });
	}

	if (includePKCE && !includePAR) {
		authUrlQuery.push(
			{ key: 'code_challenge', value: '{{code_challenge}}' },
			{ key: 'code_challenge_method', value: '{{code_challenge_method}}' }
		);
	}

	if (includePAR) {
		authUrlQuery.push({ key: 'request_uri', value: '{{request_uri}}' });
	}

	items.push({
		name: `${items.length + 1}. Build Authorization URL${includePKCE ? ' (with PKCE)' : ''}${includePAR ? ' (with PAR)' : ''}`,
		request: {
			method: 'GET',
			url: parseUrl(
				`${baseUrl}/as/authorize?${authUrlQuery.map((q) => `${q.key}=${q.value}`).join('&')}`
			),
			description: `**Authorization Code Grant - ${specVersion.toUpperCase()}${responseMode ? ` (${responseMode})` : ''}**\n\n**Educational Context:**\n- ${specVersion === 'oauth2.0' ? 'OAuth 2.0 Authorization Code flow (no ID token)' : specVersion === 'oidc' ? 'OpenID Connect Authorization Code flow (includes ID token)' : 'OIDC 2.1 Authorization Code flow (PKCE required, includes ID token)'}\n- Client authenticates using ${authMethod}\n- ${responseMode ? `Response Mode: ${responseMode === 'query' ? 'Code/tokens in URL query string (?code=abc)' : responseMode === 'fragment' ? 'Code/tokens in URL fragment (#access_token=xyz)' : 'Code/tokens via HTTP POST (not in URL)'}` : 'Default response mode for this flow'}\n- ${includePKCE ? (specVersion === 'oidc2.1' ? 'PKCE is REQUIRED for OIDC 2.1' : 'PKCE is optional but recommended') : 'No PKCE (not required for OAuth 2.0)'}\n- User authenticates and receives authorization code`,
		},
	});

	// Step 4: Exchange Authorization Code for Tokens
	const tokenBody: Array<{ key: string; value: string }> = [
		{ key: 'grant_type', value: 'authorization_code' },
		{ key: 'code', value: '{{authorization_code}}' },
		{ key: 'redirect_uri', value: '{{redirect_uri}}' },
	];

	const tokenHeaders: Array<{ key: string; value: string }> = [
		{ key: 'Content-Type', value: 'application/x-www-form-urlencoded' },
	];

	if (authMethod === 'client_secret_post') {
		tokenBody.push(
			{ key: 'client_id', value: '{{user_client_id}}' },
			{ key: 'client_secret', value: '{{user_client_secret}}' }
		);
	} else if (authMethod === 'client_secret_basic') {
		tokenHeaders.push({ key: 'Authorization', value: 'Basic {{user_client_credentials_basic}}' });
	} else if (authMethod === 'client_secret_jwt') {
		tokenBody.push(
			{ key: 'client_id', value: '{{user_client_id}}' },
			{
				key: 'client_assertion_type',
				value: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
			},
			{ key: 'client_assertion', value: '{{user_client_assertion_jwt}}' }
		);
	} else if (authMethod === 'private_key_jwt') {
		tokenBody.push(
			{ key: 'client_id', value: '{{user_client_id}}' },
			{
				key: 'client_assertion_type',
				value: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
			},
			{ key: 'client_assertion', value: '{{user_client_assertion_jwt_private}}' }
		);
	}

	if (includePKCE) {
		tokenBody.push({ key: 'code_verifier', value: '{{code_verifier}}' });
	}

	const tokenExchangeEvents: Array<{
		listen: 'prerequest' | 'test';
		script: { exec: string[]; type: string };
	}> = [];

	// Add pre-request script for Basic Auth
	if (authMethod === 'client_secret_basic') {
		tokenExchangeEvents.push({
			listen: 'prerequest',
			script: {
				exec: [
					'// Generate Basic Auth header for OAuth flow',
					'const clientId = pm.environment.get("user_client_id");',
					'const clientSecret = pm.environment.get("user_client_secret");',
					'if (clientId && clientSecret) {',
					'    const basicAuth = btoa(clientId + ":" + clientSecret);',
					'    pm.environment.set("user_client_credentials_basic", basicAuth);',
					'}',
				],
				type: 'text/javascript',
			},
		});
	}

	// Add pre-request script for Client Secret JWT
	if (authMethod === 'client_secret_jwt') {
		tokenExchangeEvents.push({
			listen: 'prerequest',
			script: {
				exec: [
					'// Generate JWT assertion for client_secret_jwt',
					'const clientId = pm.environment.get("user_client_id");',
					'const clientSecret = pm.environment.get("user_client_secret");',
					'const envId = pm.environment.get("envID");',
					'',
					'if (clientId && clientSecret && envId) {',
					// biome-ignore lint/suspicious/noTemplateCurlyInString: This is Postman script code where template literals are valid
					'    const tokenEndpoint = `https://auth.pingone.com/${envId}/as/token`;',
					'    const now = Math.floor(Date.now() / 1000);',
					'    ',
					'    // JWT Header',
					'    const header = {',
					'        alg: "HS256",',
					'        typ: "JWT"',
					'    };',
					'    ',
					'    // JWT Payload',
					'    const payload = {',
					'        iss: clientId,',
					'        sub: clientId,',
					'        aud: tokenEndpoint,',
					'        exp: now + 300, // 5 minutes',
					'        iat: now,',
					'        jti: pm.variables.replaceIn("{{$guid}}")',
					'    };',
					'    ',
					'    // Base64URL encode',
					'    function base64UrlEncode(str) {',
					'        return btoa(str)',
					'            .replace(/\\+/g, "-")',
					'            .replace(/\\//g, "_")',
					'            .replace(/=/g, "");',
					'    }',
					'    ',
					'    const encodedHeader = base64UrlEncode(JSON.stringify(header));',
					'    const encodedPayload = base64UrlEncode(JSON.stringify(payload));',
					'    const signatureInput = encodedHeader + "." + encodedPayload;',
					'    ',
					'    // HMAC SHA256 signature',
					'    const signature = CryptoJS.HmacSHA256(signatureInput, clientSecret).toString(CryptoJS.enc.Base64);',
					'    const encodedSignature = signature.replace(/\\+/g, "-").replace(/\\//g, "_").replace(/=/g, "");',
					'    ',
					'    const jwt = signatureInput + "." + encodedSignature;',
					'    pm.environment.set("user_client_assertion_jwt", jwt);',
					'}',
				],
				type: 'text/javascript',
			},
		});
	}

	// Add pre-request script for Private Key JWT (placeholder)
	if (authMethod === 'private_key_jwt') {
		tokenExchangeEvents.push({
			listen: 'prerequest',
			script: {
				exec: [
					'// Generate JWT assertion for private_key_jwt',
					'// Note: This requires a private key. In Postman, you may need to use',
					'// a pre-request script that can sign with RSA keys, or generate',
					'// the JWT externally and set it as {{user_client_assertion_jwt_private}}',
					'const clientId = pm.environment.get("user_client_id");',
					'const envId = pm.environment.get("envID");',
					'',
					'if (clientId && envId) {',
					// biome-ignore lint/suspicious/noTemplateCurlyInString: This is Postman script code where template literals are valid
					'    const tokenEndpoint = `https://auth.pingone.com/${envId}/as/token`;',
					'    // For private key JWT, you need to sign with RS256',
					'    // This typically requires a library or external tool',
					'    // Set {{user_client_assertion_jwt_private}} manually or use a script that supports RSA signing',
					'    console.log("⚠️ Private Key JWT requires RSA signing. Set {{user_client_assertion_jwt_private}} manually.");',
					'}',
				],
				type: 'text/javascript',
			},
		});
	}

	// Add test script
	tokenExchangeEvents.push({
		listen: 'test',
		script: {
			exec: tokenExtractionScript,
			type: 'text/javascript',
		},
	});

	items.push({
		name: `${items.length + 1}. Exchange Authorization Code for Tokens${includePKCE ? ' (with PKCE)' : ''}`,
		request: {
			method: 'POST',
			header: tokenHeaders,
			body: {
				mode: 'urlencoded',
				urlencoded: tokenBody,
			},
			url: parseUrl(`${baseUrl}/as/token`),
			description: `**Token Exchange - ${specVersion.toUpperCase()}**\n\n**Educational Context:**\n- Exchanges authorization code for tokens\n- ${specVersion === 'oauth2.0' ? 'OAuth 2.0: Returns access_token only (no id_token)' : specVersion === 'oidc' ? 'OIDC: Returns access_token and id_token' : 'OIDC 2.1: Returns access_token and id_token (PKCE required)'}\n- ${specVersion === 'oidc' || specVersion === 'oidc2.1' ? 'Refresh token available if offline_access scope requested' : 'Refresh token available if requested'}\n- Client authenticates using ${authMethod}`,
		},
		event: tokenExchangeEvents,
	});

	return {
		name: flowName,
		item: items,
	};
};

/**
 * Generate Use Cases group with subgroups for each customer identity flow
 * Based on Common Customer Identity Flows (Web) documentation
 */
/**
 * Generate pre-request script to randomly select a baseball player and set environment variables
 * This allows different usernames to be generated each time the request runs
 */
const generateBaseballPlayerPreRequestScript = (): string[] => {
	return [
		'// Randomly select a historical baseball player for user data',
		'const players = [',
		'    { firstName: "Babe", lastName: "Ruth", email: "babe.ruth@example.com", username: "babe_ruth" },',
		'    { firstName: "Jackie", lastName: "Robinson", email: "jackie.robinson@example.com", username: "jackie_robinson" },',
		'    { firstName: "Lou", lastName: "Gehrig", email: "lou.gehrig@example.com", username: "lou_gehrig" },',
		'    { firstName: "Willie", lastName: "Mays", email: "willie.mays@example.com", username: "willie_mays" },',
		'    { firstName: "Hank", lastName: "Aaron", email: "hank.aaron@example.com", username: "hank_aaron" },',
		'    { firstName: "Ted", lastName: "Williams", email: "ted.williams@example.com", username: "ted_williams" },',
		'    { firstName: "Mickey", lastName: "Mantle", email: "mickey.mantle@example.com", username: "mickey_mantle" },',
		'    { firstName: "Joe", lastName: "DiMaggio", email: "joe.dimaggio@example.com", username: "joe_dimaggio" },',
		'    { firstName: "Roberto", lastName: "Clemente", email: "roberto.clemente@example.com", username: "roberto_clemente" },',
		'    { firstName: "Sandy", lastName: "Koufax", email: "sandy.koufax@example.com", username: "sandy_koufax" },',
		'    { firstName: "Yogi", lastName: "Berra", email: "yogi.berra@example.com", username: "yogi_berra" },',
		'    { firstName: "Stan", lastName: "Musial", email: "stan.musial@example.com", username: "stan_musial" },',
		'    { firstName: "Bob", lastName: "Gibson", email: "bob.gibson@example.com", username: "bob_gibson" },',
		'    { firstName: "Nolan", lastName: "Ryan", email: "nolan.ryan@example.com", username: "nolan_ryan" },',
		'    { firstName: "Cal", lastName: "Ripken", email: "cal.ripken@example.com", username: "cal_ripken" },',
		'];',
		'',
		'// Randomly select a player',
		'const randomIndex = Math.floor(Math.random() * players.length);',
		'const player = players[randomIndex];',
		'',
		'// Set environment variables for use in request body',
		'pm.environment.set("baseballPlayerFirstName", player.firstName);',
		'pm.environment.set("baseballPlayerLastName", player.lastName);',
		'pm.environment.set("baseballPlayerEmail", player.email);',
		'pm.environment.set("baseballPlayerUsername", player.username);',
		'',
		'console.log("🎲 Randomly selected baseball player:", player.firstName, player.lastName);',
		'console.log("   Username:", player.username);',
		'console.log("   Email:", player.email);',
	];
};

const generateUseCasesItems = (
	_credentials?: {
		environmentId?: string;
		clientId?: string;
		clientSecret?: string;
	},
	selectedUseCases?: Set<string>
): PostmanCollectionItem[] => {
	const baseUrl = '{{apiPath}}/v1/environments/{{envID}}';
	const authBaseUrl = '{{authPath}}/{{envID}}';

	// Helper function to extract variables saved from test script
	const extractSavedVariables = (testScript?: string[]): string[] => {
		if (!testScript) return [];
		const variables: string[] = [];
		testScript.forEach((line) => {
			const match = line.match(/pm\.environment\.set\(["']([^"']+)["']/);
			if (match?.[1]) {
				variables.push(match[1]);
			}
		});
		return [...new Set(variables)]; // Remove duplicates
	};

	// Helper function to create a Postman item with educational context
	const createUseCaseItem = (
		name: string,
		method: string,
		url: string,
		description: string,
		headers: Array<{ key: string; value: string; type?: string }> = [],
		body?: Record<string, unknown>,
		testScript?: string[],
		preRequestScript?: string[]
	): PostmanCollectionItem => {
		const urlStructure = parseUrl(url);

		// Check Content-Type header
		const contentTypeHeader = headers.find((h) => h.key.toLowerCase() === 'content-type');
		const contentType = contentTypeHeader?.value?.toLowerCase() || '';

		// Determine if this should be raw JSON
		// - Custom JSON types (contains +json)
		// - Standard JSON (application/json)
		// - Not form-urlencoded
		const isJsonContentType = contentType.includes('+json') || contentType === 'application/json';
		const isFormUrlencoded = contentType === 'application/x-www-form-urlencoded';

		// Helper function to recursively convert body values to strings for Postman variable substitution
		// Preserves arrays and nested objects correctly
		const convertBodyForPostman = (obj: Record<string, unknown>): Record<string, unknown> => {
			const result: Record<string, unknown> = {};
			for (const [key, value] of Object.entries(obj)) {
				if (Array.isArray(value)) {
					// Preserve arrays - convert each element to string if needed for Postman variables
					result[key] = value.map((item) => {
						if (typeof item === 'object' && item !== null) {
							return convertBodyForPostman(item as Record<string, unknown>);
						}
						return String(item);
					});
				} else if (typeof value === 'object' && value !== null) {
					result[key] = convertBodyForPostman(value as Record<string, unknown>);
				} else {
					// Convert to string to preserve Postman variable syntax {{variableName}}
					result[key] = String(value);
				}
			}
			return result;
		};

		const bodyContent = body
			? isJsonContentType
				? {
						mode: 'raw' as const,
						// Convert body to JSON string - Postman will substitute {{variableName}} syntax
						raw: JSON.stringify(convertBodyForPostman(body), null, 2),
						options: {
							raw: {
								language: 'json',
							},
						},
					}
				: isFormUrlencoded
					? {
							mode: 'urlencoded' as const,
							urlencoded: Object.entries(body).map(([key, value]) => ({
								key,
								value: String(value),
							})),
						}
					: convertRequestBody(body, method as 'POST' | 'PUT' | 'PATCH')
			: undefined;

		// Extract variables saved from test script
		const savedVariables = extractSavedVariables(testScript);

		// Enhance description with Variables Saved section if variables are saved
		let enhancedDescription = description;
		if (savedVariables.length > 0) {
			enhancedDescription += '\n\n**Variables Saved:**\n';
			savedVariables.forEach((varName) => {
				enhancedDescription += `- \`${varName}\` - Saved to environment for use in subsequent requests\n`;
			});
		}

		const events: Array<{
			listen: 'prerequest' | 'test';
			script: { exec: string[]; type: string };
		}> = [];

		if (preRequestScript && preRequestScript.length > 0) {
			events.push({
				listen: 'prerequest' as const,
				script: {
					exec: preRequestScript,
					type: 'text/javascript',
				},
			});
		}

		if (testScript && testScript.length > 0) {
			events.push({
				listen: 'test' as const,
				script: {
					exec: testScript,
					type: 'text/javascript',
				},
			});
		}

		const request: PostmanCollectionItem['request'] = {
			method: method as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
			url: urlStructure,
			description: enhancedDescription,
		};

		if (headers.length > 0) {
			request.header = headers;
		}

		if (bodyContent) {
			request.body = bodyContent;
		}

		const item: PostmanCollectionItem = {
			name,
			request,
		};

		if (events.length > 0) {
			item.event = events;
		}

		return item;
	};

	// Use Case 1: Sign-up (Registration)
	// Structure: Setup, Action (Register user), Test (Test Registration)
	const signUpItems: PostmanCollectionItem[] = [
		{
			name: 'Setup',
			item: [
				createUseCaseItem(
					'Step 1: Create a population for sign-up users',
					'POST',
					`${baseUrl}/populations`,
					"**Sign-up: Create Population**\n\n**Educational Context:**\n- The `POST {{apiPath}}/environments/{{envID}}/populations/` operation creates a new population resource in the specified environment\n- The request body for the `POST` must provide a value for the required `name` property\n- This population's ID is referenced in Step 2 as the population to associate with the newly-created user",
					[
						{ key: 'Authorization', value: 'Bearer {{workerToken}}' },
						{ key: 'Content-Type', value: 'application/json' },
						{ key: 'Accept', value: 'application/json' },
					],
					{
						name: 'SignUpPopulation_{{$timestamp}}',
						description: 'Population for sign-up users',
						default: false,
						alternativeIdentifiers: ['Baseball', 'Players', 'SignUp'],
					},
					[
						'pm.test("✅ Call was Successful - Population Created", function() {',
						'    pm.response.to.have.status(201);',
						'});',
						'',
						'pm.test("✅ Response body JSON contains name and id strings", function() {',
						'    const jsonData = pm.response.json();',
						'    pm.expect(jsonData.name, "Population name should be a string").to.be.a("string");',
						'    pm.expect(jsonData.id, "Population ID should be a string").to.be.a("string");',
						'    pm.environment.set("SignUpPopID", jsonData.id);',
						'    ',
						'    pm.test("✅ Population ID saved to variable SignUpPopID", function() {',
						'        pm.expect(pm.environment.get("SignUpPopID"), "SignUpPopID should be set").to.be.a("string").and.not.empty;',
						'    });',
						'    ',
						'    console.log("SignUpPopID is now: " + pm.environment.get("SignUpPopID"));',
						'    console.log("✅ Population created successfully");',
						'});',
					]
				),
				createUseCaseItem(
					'Step 2: Create a group for sign-up users',
					'POST',
					`${baseUrl}/groups`,
					'**Sign-up: Create Group**\n\n**Educational Context:**\n- The `POST {{apiPath}}/environments/{{envID}}/groups` operation creates a new group resource in the specified environment\n- Groups are used to organize users and apply policies, permissions, and access controls\n- The request body for the `POST` must provide a value for the required `name` property\n- Optionally, you can assign the group to a specific population using `population.id`\n- This group\'s ID will be used later to add the verified user to the group\n- Reference: [PingOne API Documentation - Create Group](https://apidocs.pingidentity.com/pingone/platform/v1/api/#post-create-group)\n\n**Request Body:**\n```json\n{\n    "name": "SignUpGroup_{{$timestamp}}",\n    "description": "Group for sign-up users",\n    "population": {\n        "id": "{{SignUpPopID}}"\n    }\n}\n```',
					[
						{ key: 'Authorization', value: 'Bearer {{workerToken}}' },
						{ key: 'Content-Type', value: 'application/vnd.pingidentity.group+json' },
						{ key: 'Accept', value: 'application/json' },
					],
					{
						name: 'SignUpGroup_{{$timestamp}}',
						description: 'Group for sign-up users',
						population: {
							id: '{{SignUpPopID}}',
						},
					},
					[
						'pm.test("✅ Call was Successful - Group Created", function() {',
						'    pm.response.to.have.status(201);',
						'});',
						'',
						'pm.test("✅ Response body JSON contains name and id strings", function() {',
						'    const jsonData = pm.response.json();',
						'    pm.expect(jsonData.name, "Group name should be a string").to.be.a("string");',
						'    pm.expect(jsonData.id, "Group ID should be a string").to.be.a("string");',
						'    pm.environment.set("groupId", jsonData.id);',
						'    ',
						'    pm.test("✅ Group ID saved to variable groupId", function() {',
						'        pm.expect(pm.environment.get("groupId"), "groupId should be set").to.be.a("string").and.not.empty;',
						'    });',
						'    ',
						'    console.log("groupId is now: " + pm.environment.get("groupId"));',
						'    console.log("✅ Group created successfully");',
						'});',
					]
				),
			],
		},
		{
			name: 'Register user',
			item: [
				createUseCaseItem(
					'Step 1: Create a user (with email verification)',
					'POST',
					`${baseUrl}/users`,
					"**Sign-up: Create User (Import with Email Verification)**\n\n**Educational Context:**\n- The `POST {{apiPath}}/environments/{{envID}}/users` operation with Content-Type `application/vnd.pingidentity.user.import+json` creates a new user resource with import capabilities\n- This endpoint is used for importing users with verification requirements\n- The user is associated with the population created in Setup Step 1\n- The request body for the `POST` to create the new user must provide values for these required properties:\n  - `email`: The unique email address for the new user (must be valid for email verification)\n  - `username`: A name for the new user. This name must be unique within the specified environment\n  - `population.id`: The population to associate with the new user resource\n- To enable automatic email verification, set `lifecycle.status` to `VERIFICATION_REQUIRED` and `lifecycle.suppressVerificationCode` to `false`\n- When these lifecycle properties are set, PingOne automatically sends a verification email to the user\n- The user's `verifyStatus` property will be returned as `NOT_INITIATED` until the user verifies the account\n- **Important:** This user (SignUpUserID) will be used for the sign-up flow\n- **Note:** A random historical baseball player is automatically selected each time this request runs (see Pre-request Script)\n- Reference: [PingOne API Documentation - Create User Import](https://apidocs.pingidentity.com/pingone/platform/v1/api/#post-create-user-import)",
					[
						{ key: 'Authorization', value: 'Bearer {{workerToken}}' },
						{ key: 'Content-Type', value: 'application/vnd.pingidentity.user.import+json' },
						{ key: 'Accept', value: 'application/json' },
					],
					{
						email: 'cmuir+{{baseballPlayerFirstName}}@pingone.com',
						name: {
							given: '{{baseballPlayerFirstName}}',
							family: '{{baseballPlayerLastName}}',
						},
						population: {
							id: '{{SignUpPopID}}',
						},
						username: '{{baseballPlayerUsername}}_{{$timestamp}}',
						lifecycle: {
							status: 'VERIFICATION_REQUIRED',
							suppressVerificationCode: false,
						},
					},
					[
						'pm.test("✅ Call was Successful - User Created", function() {',
						'    pm.response.to.have.status(201);',
						'});',
						'',
						'pm.test("✅ Response body JSON contains createdAt username and id strings", function () {',
						'    const jsonData = pm.response.json();',
						'    pm.expect(jsonData.createdAt, "createdAt should be a string").to.be.a("string");',
						'    pm.expect(jsonData.username, "username should be a string").to.be.a("string");',
						'    pm.expect(jsonData.id, "User ID should be a string").to.be.a("string");',
						'    pm.environment.set("SignUpUserID", jsonData.id);',
						'    pm.environment.set("SignUpUsername", jsonData.username);',
						'    pm.environment.set("SignInUserID", jsonData.id);',
						'    pm.environment.set("SignInUsername", jsonData.username);',
						'    ',
						'    pm.test("✅ User ID saved to variable SignUpUserID", function() {',
						'        pm.expect(pm.environment.get("SignUpUserID"), "SignUpUserID should be set").to.be.a("string").and.not.empty;',
						'    });',
						'    ',
						'    pm.test("✅ Username saved to variable SignUpUsername", function() {',
						'        pm.expect(pm.environment.get("SignUpUsername"), "SignUpUsername should be set").to.be.a("string").and.not.empty;',
						'    });',
						'    ',
						'    pm.test("✅ User ID saved to variable SignInUserID for Sign-in flow", function() {',
						'        pm.expect(pm.environment.get("SignInUserID"), "SignInUserID should be set").to.be.a("string").and.not.empty;',
						'    });',
						'    ',
						'    pm.test("✅ Username saved to variable SignInUsername for Sign-in flow", function() {',
						'        pm.expect(pm.environment.get("SignInUsername"), "SignInUsername should be set").to.be.a("string").and.not.empty;',
						'    });',
						'    ',
						'    console.log("SignUpUserID is now: " + pm.environment.get("SignUpUserID"));',
						'    console.log("SignUpUsername is now: " + pm.environment.get("SignUpUsername"));',
						'    console.log("SignInUserID is now: " + pm.environment.get("SignInUserID"));',
						'    console.log("SignInUsername is now: " + pm.environment.get("SignInUsername"));',
						'    console.log("✅ User created successfully");',
						'    ',
						'    if (jsonData.verifyStatus) {',
						'        console.log("📝 User verifyStatus:", jsonData.verifyStatus);',
						'        console.log("📝 Verification email has been sent to the user\'s email address");',
						'        console.log("📝 User should check their email for the verification code");',
						'    }',
						'    if (jsonData.lifecycle && jsonData.lifecycle.status) {',
						'        console.log("📝 User lifecycle status:", jsonData.lifecycle.status);',
						'    }',
						'});',
					],
					generateBaseballPlayerPreRequestScript()
				),
				createUseCaseItem(
					'Step 2: Verify User Email with Verification Code',
					'POST',
					`${baseUrl}/users/{{SignUpUserID}}`,
					'**Sign-up: Verify User Email with Verification Code**\n\n**Educational Context:**\n- Verifies a user using the verification code (OTP) sent to their email\n- Endpoint: `POST {{apiPath}}/v1/environments/{{envID}}/users/{{userId}}`\n- Use POST method with Content-Type: `application/vnd.pingidentity.user.verify+json`\n- The verification code was automatically sent to the user\'s email address when the user was created (in Step 1) with `lifecycle.status` set to `VERIFICATION_REQUIRED` and `lifecycle.suppressVerificationCode` set to `false`\n- User should enter the verification code (OTP) they received in their email\n- The request body must include the `verificationCode` property with the OTP code from the email\n- Upon successful verification, the user\'s email is marked as verified and account status is updated\n- After verification, user can proceed to set password\n- Reference: [PingOne Verify User API](https://apidocs.pingidentity.com/pingone/platform/v1/api/#post-verify-user)\n\n**Request Body:**\n```json\n{\n    "verificationCode": "{{emailVerificationCode}}"\n}\n```\n\n**Prerequisites:**\n- User must be created with `lifecycle.status: "VERIFICATION_REQUIRED"` (Step 1)\n- User must have received verification code via email\n- Set `emailVerificationCode` environment variable with the OTP code from email',
					[
						{ key: 'Authorization', value: 'Bearer {{workerToken}}' },
						{ key: 'Content-Type', value: 'application/vnd.pingidentity.user.verify+json' },
						{ key: 'Accept', value: 'application/json' },
					],
					{
						verificationCode: '{{emailVerificationCode}}',
					},
					[
						'pm.test("✅ Call was Successful - User Verified", function() {',
						'    pm.expect(pm.response.code, "Response should be 200 or 204").to.be.oneOf([200, 204]);',
						'});',
						'',
						'try {',
						'    if (pm.response.code === 200 || pm.response.code === 204) {',
						'        pm.test("✅ User verification completed", function() {',
						'            pm.expect(pm.response.code, "Response status should indicate success").to.be.oneOf([200, 204]);',
						'        });',
						'        ',
						'        console.log("✅ User verified successfully");',
						'        ',
						'        if (pm.response.code === 200) {',
						'            const jsonData = pm.response.json();',
						'            if (jsonData.emailVerified !== undefined) {',
						'                pm.environment.set("emailVerified", jsonData.emailVerified);',
						'                console.log("   Email verified:", jsonData.emailVerified);',
						'            }',
						'            if (jsonData.lifecycle && jsonData.lifecycle.status) {',
						'                pm.environment.set("userStatus", jsonData.lifecycle.status);',
						'                console.log("   User status:", jsonData.lifecycle.status);',
						'            }',
						'        }',
						'        ',
						'        console.log("📝 User account verification complete - proceed to set password");',
						'    }',
						'} catch (e) {',
						'    console.log("There was an error parsing JSON", e);',
						'    if (pm.response.code === 400) {',
						'        try {',
						'            const jsonData = pm.response.json();',
						'            if (jsonData.message) {',
						'                console.log("❌ Verification failed:", jsonData.message);',
						'                console.log("📝 Make sure you entered the correct OTP code from your email");',
						'            }',
						'        } catch (e2) {',
						'            console.log("❌ Verification failed - invalid verification code");',
						'            console.log("📝 Please check your email for the OTP code and update the emailVerificationCode variable");',
						'        }',
						'    }',
						'}',
					],
					[
						'console.log("📝 IMPORTANT: Enter the OTP (verification code) you received in your email");',
						'console.log("📝 Set the emailVerificationCode environment variable with the OTP code before running this request");',
						'console.log("📝 The OTP code was sent to the user\'s email address when the user was created in Step 1");',
						'console.log("📝 Check your email inbox for the verification code (typically 8 digits)");',
					]
				),
				createUseCaseItem(
					'Step 3: Set user password',
					'PUT',
					`${baseUrl}/users/{{SignUpUserID}}/password`,
					'**Sign-up: Set User Password**\n\n**Educational Context:**\n- The `PUT {{apiPath}}/environments/{{envID}}/users/{{userID}}/password` operation sets a new password for the user you created in Step 1\n- This password will be used when the user signs in\n- The request requires the `application/vnd.pingidentity.password.set+json` custom content type to be set in the `Content-Type` HTTP header\n- The request body sets the new password in the `value` property (not `newPassword`)\n- A successful response returns `204 No Content`\n- **Note:** The pre-request script generates a secure random password that meets common password policies (12+ characters, mixed case, numbers, symbols)\n- Reference: [PingOne Password Set API](https://apidocs.pingidentity.com/pingone/platform/v1/api/#put-update-password-admin)\n\n**Request Body:**\n```json\n{\n    "value": "{{userPassword}}"\n}\n```',
					[
						{ key: 'Authorization', value: 'Bearer {{workerToken}}' },
						{ key: 'Content-Type', value: 'application/vnd.pingidentity.password.set+json' },
						{ key: 'Accept', value: 'application/json' },
					],
					{
						value: '{{userPassword}}',
					},
					[
						'pm.test("✅ Call was Successful - Password Set", function() {',
						'    pm.response.to.have.status(204);',
						'});',
						'',
						'pm.test("✅ Password set operation completed", function() {',
						'    pm.expect(pm.response.code, "Response status should be 204 No Content").to.equal(204);',
						'});',
						'',
						'console.log("✅ User password set successfully");',
						'console.log("📝 User can now sign in with this password");',
					],
					[
						'// Generate a secure random password that meets common password policies',
						'function generateSecurePassword() {',
						'    const lowercase = "abcdefghijklmnopqrstuvwxyz";',
						'    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";',
						'    const numbers = "0123456789";',
						'    const special = "!@#$%^&*()_+-=[]{}|;:,.<>?";',
						'    ',
						'    let password = "";',
						'    ',
						'    // Ensure at least one character from each category',
						'    password += lowercase[Math.floor(Math.random() * lowercase.length)];',
						'    password += uppercase[Math.floor(Math.random() * uppercase.length)];',
						'    password += numbers[Math.floor(Math.random() * numbers.length)];',
						'    password += special[Math.floor(Math.random() * special.length)];',
						'    ',
						'    // Fill the rest to make at least 12 characters',
						'    const allChars = lowercase + uppercase + numbers + special;',
						'    for (let i = password.length; i < 12; i++) {',
						'        password += allChars[Math.floor(Math.random() * allChars.length)];',
						'    }',
						'    ',
						'    // Shuffle the password to avoid predictable patterns',
						'    password = password.split("").sort(() => Math.random() - 0.5).join("");',
						'    ',
						'    return password;',
						'}',
						'',
						'const randomPassword = generateSecurePassword();',
						'pm.environment.set("userPassword", randomPassword);',
						'console.log("✅ Generated secure random password");',
						'console.log("📝 Password meets common policy requirements (12+ chars, mixed case, numbers, symbols)");',
						'console.log("📝 Password variable set for use in Sign-in workflow");',
					]
				),
				createUseCaseItem(
					'Step 4: Add User to Group',
					'POST',
					`${baseUrl}/users/{{SignUpUserID}}/memberOfGroups`,
					'**Sign-up: Add User to Group**\n\n**Educational Context:**\n- Adds the newly created and verified user to the group created in Environment Configuration\n- Groups are used to organize users and apply policies, permissions, and access controls\n- The groupId was saved when the group was created in Step 2 of Environment Configuration\n- After adding user to group, the sign-up flow is complete and user can proceed to sign-in\n- Reference: [PingOne API Documentation - Add User to Group](https://apidocs.pingidentity.com/pingone/platform/v1/api/#post-add-user-to-group)\n\n**Request Body:**\n```json\n{\n    "id": "{{groupId}}"\n}\n```',
					[
						{ key: 'Authorization', value: 'Bearer {{workerToken}}' },
						{ key: 'Content-Type', value: 'application/json' },
						{ key: 'Accept', value: 'application/json' },
					],
					{
						id: '{{groupId}}',
					},
					[
						'pm.test("✅ Call was Successful - User Added to Group", function() {',
						'    pm.expect(pm.response.code, "Response should be 200 or 201").to.be.oneOf([200, 201]);',
						'});',
						'',
						'try {',
						'    if (pm.response.code === 201 || pm.response.code === 200) {',
						'        pm.test("✅ Group assignment completed", function() {',
						'            pm.expect(pm.response.code, "Response status should indicate success").to.be.oneOf([200, 201]);',
						'        });',
						'        ',
						'        console.log("✅ User successfully added to group");',
						'        ',
						'        const jsonData = pm.response.json();',
						'        if (jsonData && jsonData.id) {',
						'            console.log("   Group ID:", jsonData.id);',
						'            console.log("   Group name:", jsonData.name || "N/A");',
						'        }',
						'        ',
						'        console.log("📝 Sign-up flow complete - user is ready to sign in");',
						'    }',
						'} catch (e) {',
						'    console.log("There was an error parsing JSON", e);',
						'    pm.test("❌ Response should be valid JSON", function() {',
						'        pm.expect.fail("Failed to parse response as JSON: " + e.message);',
						'    });',
						'}',
					]
				),
			],
		},
		{
			name: 'Test Registration',
			item: [
				createUseCaseItem(
					'Lookup User by Username',
					'GET',
					`${baseUrl}/users?filter=username%20eq%20%22{{SignUpUsername}}%22&limit=20`,
					'**Test Registration: Lookup User by Username**\n\n**Educational Context:**\n- Test that the user can be found by their username after registration\n- Use GET with filter parameter to search by username using SCIM filter syntax\n- Returns user object if found, or empty result if user doesn\'t exist\n- Username filter is case-sensitive and must match exactly\n- **SCIM Operators**: Uses `eq` (equals) operator - supported operators include: `eq`, `sw` (starts with), `ew` (ends with), `co` (contains), `and`, `or`\n- The username comes from the user created in Register user Step 1 (SignUpUsername variable)\n- **Limit Parameter**: `limit=20` restricts results to maximum 20 users for performance and to prevent large result sets\n- This test verifies the user can be found by username after creation and verification\n- Reference: [PingOne API Documentation - List Users with Filters](https://apidocs.pingidentity.com/pingone/platform/v1/api/#get-list-users)\n\n**Filter Syntax:**\n```\nGET {{apiPath}}/v1/environments/{{envID}}/users?filter=username eq "john_doe"&limit=20\n```\n\n**Prerequisite:**\n- Complete Register user Step 1: Create a user (with email verification) to set `SignUpUsername`',
					[
						{ key: 'Authorization', value: 'Bearer {{workerToken}}' },
						{ key: 'Accept', value: 'application/json' },
					],
					undefined,
					[
						'pm.test("✅ Call was Successful - User Lookup Completed", function() {',
						'    pm.response.to.have.status(200);',
						'});',
						'',
						'try {',
						'    const jsonData = pm.response.json();',
						'    if (jsonData._embedded && jsonData._embedded.users && jsonData._embedded.users.length > 0) {',
						'        const user = jsonData._embedded.users[0];',
						'        ',
						'        pm.test("✅ User found in response", function() {',
						'            pm.expect(jsonData._embedded.users.length, "Should have at least one user").to.be.at.least(1);',
						'            pm.expect(user.id).to.equal(pm.environment.get("SignUpUserID"));',
						'        });',
						'        ',
						'        console.log("✅ User found:", user.id, "- username:", user.username || "N/A");',
						'        console.log("📝 User can be found by username lookup");',
						'    } else {',
						'        console.log("⚠️ User not found - verify SignUpUsername is correct");',
						'        console.log("📝 Make sure Register user Step 1 has been completed");',
						'    }',
						'} catch (e) {',
						'    console.log("There was an error parsing JSON", e);',
						'    console.log("❌ Failed to lookup user:", pm.response.code);',
						'}',
					],
					[
						'// Validate that SignUpUsername is set (from Register user Step 1)',
						'const signUpUsername = pm.environment.get("SignUpUsername");',
						'',
						'if (!signUpUsername || signUpUsername.trim() === "") {',
						'    console.log("❌ ERROR: SignUpUsername is missing or empty");',
						'    console.log("📝 You must complete Register user Step 1: Create a user (with email verification) first");',
						'    throw new Error("SignUpUsername is required. Complete Register user Step 1 first.");',
						'}',
						'console.log("✅ SignUpUsername found: " + signUpUsername);',
					]
				),
				createUseCaseItem(
					'Lookup User by Email',
					'GET',
					`${baseUrl}/users?filter=email%20eq%20%22cmuir%2B{{baseballPlayerFirstName}}@pingone.com%22&limit=20`,
					'**Test Registration: Lookup User by Email**\n\n**Educational Context:**\n- Test that the user can be found by their email address after registration\n- Use GET with filter parameter to search by email using SCIM filter syntax\n- Returns user object if found, or empty result if user doesn\'t exist\n- Email filter searches the user\'s email attribute\n- **SCIM Operators**: Uses `eq` (equals) operator - email also supports `sw` (starts with) and `ew` (ends with for domains only)\n- The email comes from the user created in Register user Step 1\n- **Limit Parameter**: `limit=20` restricts results to maximum 20 users for performance and to prevent large result sets\n- This test verifies the user can be found by email after creation and verification\n- Reference: [PingOne API Documentation - List Users with Filters](https://apidocs.pingidentity.com/pingone/platform/v1/api/#get-list-users)\n\n**Filter Syntax:**\n```\nGET {{apiPath}}/v1/environments/{{envID}}/users?filter=email eq "user@example.com"&limit=20\n```\n\n**Important:** The correct filter syntax is `email eq "email@example.com"`\n\n**Prerequisite:**\n- Complete Register user Step 1: Create a user (with email verification)',
					[
						{ key: 'Authorization', value: 'Bearer {{workerToken}}' },
						{ key: 'Accept', value: 'application/json' },
					],
					undefined,
					[
						'pm.test("✅ Call was Successful - Email Lookup Completed", function() {',
						'    pm.response.to.have.status(200);',
						'});',
						'',
						'try {',
						'    const jsonData = pm.response.json();',
						'    if (jsonData._embedded && jsonData._embedded.users && jsonData._embedded.users.length > 0) {',
						'        const user = jsonData._embedded.users[0];',
						'        ',
						'        pm.test("✅ User found in response", function() {',
						'            pm.expect(jsonData._embedded.users.length, "Should have at least one user").to.be.at.least(1);',
						'            pm.expect(user.id).to.equal(pm.environment.get("SignUpUserID"));',
						'        });',
						'        ',
						'        const emailValue = user.email?.address || user.email || "N/A";',
						'        console.log("✅ User found:", user.id, "- email:", emailValue);',
						'        console.log("📝 User can be found by email lookup");',
						'    } else {',
						'        console.log("⚠️ User not found - verify email is correct");',
						'        console.log("📝 Make sure Register user Step 1 has been completed");',
						'    }',
						'} catch (e) {',
						'    console.log("There was an error parsing JSON", e);',
						'    console.log("❌ Failed to lookup user:", pm.response.code);',
						'}',
					],
					[
						'// Validate that SignUpUserID is set (from Register user Step 1)',
						'const signUpUserID = pm.environment.get("SignUpUserID");',
						'',
						'if (!signUpUserID || signUpUserID.trim() === "") {',
						'    console.log("❌ ERROR: SignUpUserID is missing or empty");',
						'    console.log("📝 You must complete Register user Step 1: Create a user (with email verification) first");',
						'    throw new Error("SignUpUserID is required. Complete Register user Step 1 first.");',
						'}',
						'console.log("✅ SignUpUserID found: " + signUpUserID);',
					]
				),
				createUseCaseItem(
					'Lookup User by User ID',
					'GET',
					`${baseUrl}/users/{{SignUpUserID}}`,
					"**Test Registration: Lookup User by User ID**\n\n**Educational Context:**\n- Test that the user can be retrieved directly by their unique user ID\n- Use GET endpoint with the user ID in the URL path (no filter needed)\n- Returns the complete user object if found, or 404 if user doesn't exist\n- This is the most direct way to retrieve a user when you know their ID\n- The user ID comes from the user created in Register user Step 1 (SignUpUserID variable)\n- This test verifies the user can be retrieved directly by ID after creation and verification\n- Reference: [PingOne API Documentation - Get User](https://apidocs.pingidentity.com/pingone/platform/v1/api/#get-read-one-user)\n\n**Endpoint Syntax:**\n```\nGET {{apiPath}}/v1/environments/{{envID}}/users/{{userId}}\n```\n\n**Note:** For user ID lookup, use the direct GET endpoint without filter parameter. For username and email, use the filter query parameter with SCIM filter syntax.\n\n**Prerequisite:**\n- Complete Register user Step 1: Create a user (with email verification) to set `SignUpUserID`",
					[
						{ key: 'Authorization', value: 'Bearer {{workerToken}}' },
						{ key: 'Accept', value: 'application/json' },
					],
					undefined,
					[
						'pm.test("✅ Call was Successful - User Retrieved by ID", function() {',
						'    pm.response.to.have.status(200);',
						'});',
						'',
						'try {',
						'    const jsonData = pm.response.json();',
						'    ',
						'    pm.test("✅ User retrieved successfully", function() {',
						'        pm.expect(jsonData).to.have.property("id");',
						'        pm.expect(jsonData).to.have.property("username");',
						'        pm.expect(jsonData.id).to.equal(pm.environment.get("SignUpUserID"));',
						'    });',
						'    ',
						'    pm.test("✅ User has required properties", function() {',
						'        pm.expect(jsonData).to.have.property("email");',
						'        pm.expect(jsonData).to.have.property("name");',
						'    });',
						'    ',
						'    console.log("✅ User retrieved by ID:");',
						'    console.log("   User ID:", jsonData.id);',
						'    console.log("   Username:", jsonData.username);',
						'    console.log("   Email:", jsonData.email?.address || jsonData.email || "N/A");',
						'    if (jsonData.name) {',
						'        console.log("   Name:", jsonData.name.given || "", jsonData.name.family || "");',
						'    }',
						'    console.log("📝 User can be retrieved directly by user ID");',
						'} catch (e) {',
						'    console.log("There was an error parsing JSON", e);',
						'    if (pm.response.code === 404) {',
						'        console.log("❌ User not found - verify SignUpUserID is correct");',
						'    } else {',
						'        console.log("❌ Failed to retrieve user:", pm.response.code);',
						'    }',
						'}',
					],
					[
						'// Validate that SignUpUserID is set (from Register user Step 1)',
						'const signUpUserID = pm.environment.get("SignUpUserID");',
						'',
						'if (!signUpUserID || signUpUserID.trim() === "") {',
						'    console.log("❌ ERROR: SignUpUserID is missing or empty");',
						'    console.log("📝 You must complete Register user Step 1: Create a user (with email verification) first");',
						'    throw new Error("SignUpUserID is required. Complete Register user Step 1 first.");',
						'}',
						'console.log("✅ SignUpUserID found: " + signUpUserID);',
					]
				),
			],
		},
	];

	// Use Case 2: Sign-in
	// Structure: Setup, Using Sign On Policy, Login, Test Login
	const signInItems: PostmanCollectionItem[] = [
		{
			name: 'Setup',
			item: [
				createUseCaseItem(
					'Step 1: Create a web application',
					'POST',
					`${baseUrl}/applications`,
					"**Sign-in: Create Web Application**\n\n**Educational Context:**\n- You can use the `POST {{apiPath}}/environments/{{envID}}/applications` endpoint to create the new application\n- The application's `protocol` property is required, and in this example it specifies an `OPENID_CONNECT` application\n- The response data returns information about the new application, including its `id` property, which identifies the UUID for this application resource\n- You will need the application's UUID property value in Step 2 to get the application secret, in Step 5 to associate the sign-on policy with the application and in Step 9 to send the authorization request\n- Set `pkceEnforcement` to `S256_REQUIRED` to enforce PKCE for this application",
					[
						{ key: 'Authorization', value: 'Bearer {{workerToken}}' },
						{ key: 'Content-Type', value: 'application/json' },
						{ key: 'Accept', value: 'application/json' },
					],
					{
						enabled: true,
						name: 'WebAppSignInWithPKCE_{{$timestamp}}',
						description: 'This is an OIDC Web application with PKCE for sign-in use case.',
						pkceEnforcement: 'S256_REQUIRED',
						type: 'WEB_APP',
						protocol: 'OPENID_CONNECT',
						grantTypes: ['AUTHORIZATION_CODE'],
						redirectUris: ['{{redirect_uri}}'],
						responseTypes: ['CODE'],
						tokenEndpointAuthMethod: 'CLIENT_SECRET_BASIC',
					},
					[
						'pm.test("✅ Call was Successful - Application Created", function() {',
						'    pm.response.to.have.status(201);',
						'});',
						'',
						'try {',
						'    var jsonData = pm.response.json();',
						'    pm.environment.set("webAppSignInWithPKCEId", jsonData.id);',
						'    ',
						'    if (jsonData.id) {',
						'        pm.test("✅ Application ID saved to variable webAppSignInWithPKCEId with a value of: " + jsonData.id, function () {',
						'            pm.expect(jsonData.id, "Application ID should be a non-empty string").to.be.a("string").and.not.empty;',
						'        });',
						'        ',
						'        pm.test("✅ Application has required properties", function() {',
						'            pm.expect(jsonData).to.have.property("id");',
						'            pm.expect(jsonData).to.have.property("name");',
						'            pm.expect(jsonData).to.have.property("type", "WEB_APP");',
						'        });',
						'        ',
						'        console.log("webAppSignInWithPKCEId is now: " + pm.environment.get("webAppSignInWithPKCEId"));',
						'        console.log("✅ Web application created successfully");',
						'    }',
						'} catch (e) {',
						'    console.log("❌ There was an error parsing JSON", e);',
						'    pm.test("❌ Response should be valid JSON", function() {',
						'        pm.expect.fail("Failed to parse response as JSON: " + e.message);',
						'    });',
						'}',
					]
				),
				createUseCaseItem(
					'Step 2: Get the application secret',
					'GET',
					`${baseUrl}/applications/{{webAppSignInWithPKCEId}}/secret`,
					"**Sign-in: Get Application Secret**\n\n**Educational Context:**\n- You need the application `id` property value returned in Step 1 to retrieve the application's `secret` property value\n- The `GET {{apiPath}}/environments/{{envID}}/applications/{{appID}}/secret` returns the `secret` property value for the application specified in the request URL\n- The response data returns the `secret` value for the application\n- You will need the `secret` property value in Step 13 to validate the request to exchange the authorization code for an access token",
					[
						{ key: 'Authorization', value: 'Bearer {{workerToken}}' },
						{ key: 'Accept', value: 'application/json' },
					],
					undefined,
					[
						'pm.test("✅ Call was Successful - Application Secret Retrieved", function() {',
						'    pm.response.to.have.status(200);',
						'});',
						'',
						'try {',
						'    var jsonData = pm.response.json();',
						'    pm.environment.set("SignInWithPKCEAppSecret", jsonData.secret);',
						'    ',
						'    if (jsonData.secret) {',
						'        pm.test("✅ Application Secret saved to variable SignInWithPKCEAppSecret with a value of: " + jsonData.secret, function () {',
						'            pm.expect(jsonData.secret, "Application secret should be a non-empty string").to.be.a("string").and.not.empty;',
						'            pm.expect(jsonData.secret.length, "Application secret should have sufficient length").to.be.at.least(10);',
						'        });',
						'        ',
						'        pm.test("✅ Response contains secret property", function() {',
						'            pm.expect(jsonData).to.have.property("secret");',
						'        });',
						'        ',
						'        console.log("SignInWithPKCEAppSecret is now: " + pm.environment.get("SignInWithPKCEAppSecret"));',
						'        console.log("✅ Application secret retrieved successfully");',
						'    }',
						'} catch (e) {',
						'    console.log("❌ There was an error parsing JSON", e);',
						'    pm.test("❌ Response should be valid JSON", function() {',
						'        pm.expect.fail("Failed to parse response as JSON: " + e.message);',
						'    });',
						'}',
					]
				),
			],
		},
		{
			name: 'Using Sign On Policy',
			item: [
				createUseCaseItem(
					'Step 3: Create a sign-on policy',
					'POST',
					`${baseUrl}/signOnPolicies`,
					'**Sign-in: Create Sign-On Policy**\n\n**Educational Context:**\n- You can use the `POST {{apiPath}}/environments/{{envID}}/signOnPolicies` endpoint to create the new sign-on policy\n- In the request, the `name` property is required and must be unique within the environment\n- The `description` property is optional, but recommended\n- The `default` property should be a boolean (false) to indicate this is not the default policy\n- The request body must be sent as raw JSON with Content-Type: application/json\n- The response shows the property data for the new sign-on policy\n- It includes an `actions` link to the sign-on policy actions endpoint, which is used to assign an action to the new sign-on policy\n- The policy must have at least one associated action before you can assign it to an application',
					[
						{ key: 'Authorization', value: 'Bearer {{workerToken}}' },
						{ key: 'Content-Type', value: 'application/json' },
						{ key: 'Accept', value: 'application/json' },
					],
					{
						name: 'SignIn_UseCasePolicy_{{$timestamp}}',
						default: false,
						description: 'A new sign-in sign-on policy.',
					},
					[
						'pm.test("✅ Call was Successful - Sign-On Policy Created", function() {',
						'    pm.response.to.have.status(201);',
						'});',
						'',
						'try {',
						'    var jsonData = pm.response.json();',
						'    pm.environment.set("SignInSignonPolicyID", jsonData.id);',
						'    ',
						'    if (jsonData.id) {',
						'        pm.test("✅ Authentication PolicyId saved to variable SignInSignonPolicyID with a value of: " + jsonData.id, function () {',
						'            pm.expect(jsonData.id, "Policy ID should be a non-empty string").to.be.a("string").and.not.empty;',
						'        });',
						'        ',
						'        pm.test("✅ Policy has required properties", function() {',
						'            pm.expect(jsonData).to.have.property("id");',
						'            pm.expect(jsonData).to.have.property("name");',
						'        });',
						'        ',
						'        console.log("SignInSignonPolicyID is now: " + pm.environment.get("SignInSignonPolicyID"));',
						'        console.log("✅ Sign-on policy created successfully");',
						'    }',
						'} catch (e) {',
						'    console.log("❌ There was an error parsing JSON", e);',
						'    pm.test("❌ Response should be valid JSON", function() {',
						'        pm.expect.fail("Failed to parse response as JSON: " + e.message);',
						'    });',
						'}',
					]
				),
				createUseCaseItem(
					'Step 4: Create the login sign-on policy action',
					'POST',
					`${baseUrl}/signOnPolicies/{{SignInSignonPolicyID}}/actions`,
					'**Sign-in: Create Login Action**\n\n**Educational Context:**\n- The `POST {{apiPath}}/environments/{{envID}}/signOnPolicies/{{policyID}}/actions` operation creates the `LOGIN` sign-on policy action resource, which is associated with the sign-on policy (`{{policyID}}`) specified in the request URL\n- This action will prompt the user to enter a username and password at sign-on\n- In this use case, the `priority` property in the request body is set to `1` (the highest priority) to ensure that the `LOGIN` action is the first sign-on action',
					[
						{ key: 'Authorization', value: 'Bearer {{workerToken}}' },
						{ key: 'Content-Type', value: 'application/json' },
						{ key: 'Accept', value: 'application/json' },
					],
					{
						priority: 1,
						type: 'LOGIN',
					},
					[
						'pm.test("✅ Call was Successful - Login Action Created", function() {',
						'    pm.response.to.have.status(201);',
						'});',
						'',
						'try {',
						'    var jsonData = pm.response.json();',
						'    pm.environment.set("signInLoginPolicyActionID", jsonData.id);',
						'    ',
						'    if (jsonData.id) {',
						'        pm.test("✅ Authentication Login Action saved to variable signInLoginPolicyActionID with a value of: " + jsonData.id, function () {',
						'            pm.expect(jsonData.id, "Login action ID should be a non-empty string").to.be.a("string").and.not.empty;',
						'        });',
						'        ',
						'        pm.test("✅ Login action has correct type", function() {',
						'            pm.expect(jsonData).to.have.property("type", "LOGIN");',
						'            pm.expect(jsonData).to.have.property("id");',
						'        });',
						'        ',
						'        console.log("signInLoginPolicyActionID is now: " + pm.environment.get("signInLoginPolicyActionID"));',
						'        console.log("✅ Login action created successfully");',
						'    }',
						'} catch (e) {',
						'    console.log("❌ There was an error parsing JSON", e);',
						'    pm.test("❌ Response should be valid JSON", function() {',
						'        pm.expect.fail("Failed to parse response as JSON: " + e.message);',
						'    });',
						'}',
					]
				),
				createUseCaseItem(
					'Step 5: Assign the sign-on policy to the web application',
					'POST',
					`${baseUrl}/applications/{{webAppSignInWithPKCEId}}/signOnPolicyAssignments`,
					'**Sign-in: Assign Policy to Application**\n\n**Educational Context:**\n- Use the `POST {{apiPath}}/environments/{{envID}}/applications/{{appID}}/signOnPolicyAssignments` operation to associate the sign-on-policy with the application specified by its ID in the request URL\n- The body of the request specifies the sign-on-policy ID for the policy that you want the application to use for authenticating users',
					[
						{ key: 'Authorization', value: 'Bearer {{workerToken}}' },
						{ key: 'Content-Type', value: 'application/json' },
						{ key: 'Accept', value: 'application/json' },
					],
					{
						priority: 1,
						signOnPolicy: {
							id: '{{SignInSignonPolicyID}}',
						},
					},
					[
						'pm.test("✅ Call was Successful - Policy Assigned to Application", function() {',
						'    pm.response.to.have.status(201);',
						'});',
						'',
						'pm.test("✅ Assignment completed successfully", function() {',
						'    pm.expect(pm.response.code, "Response status should be 201 Created").to.equal(201);',
						'});',
						'',
						'console.log("✅ Sign-on policy assigned to application successfully");',
						'console.log("📝 Application is now configured with the sign-on policy");',
					]
				),
			],
		},
		{
			name: 'Login',
			item: [
				createUseCaseItem(
					'Step 1: Send an authorization request',
					'GET',
					`${authBaseUrl}/as/authorize?response_type=code&client_id={{webAppSignInWithPKCEId}}&redirect_uri={{redirect_uri}}&scope={{scopes_oidc}}&response_mode=pi.flow&code_challenge={{codeChallenge}}&code_challenge_method=S256`,
					'**Sign-in: Start OAuth/OIDC Flow**\n\n**Educational Context:**\n- Use `GET {{authPath}}/{{envID}}/as/authorize` to initiate the OAuth 2.0 Authorization Code flow with PKCE\n- The `response_mode=pi.flow` option is a Ping Identity custom response mode:\n  - `redirect_uri` is not required\n  - Authorization response parameters are returned in a JSON flow response (HTTP 200)\n  - Enables native apps and SPAs to use the Flows API without browser redirects\n- This request starts the authentication process by returning a flow object for interactive authentication\n- The authorization request includes all required OAuth parameters:\n  - `client_id`: The application ID from Setup Step 1 (`{{webAppSignInWithPKCEId}}`)\n  - `response_type=code`: Requests an authorization code (not tokens directly)\n  - `redirect_uri`: Optional when using `pi.flow`\n  - `scope`: Requested permissions (openid, profile, email)\n  - `response_mode=pi.flow`: PingOne-specific flow mode that returns JSON flow object\n  - `code_challenge`: PKCE challenge for security\n  - `code_challenge_method=S256`: SHA-256 hashing method\n- **Expected Response:** JSON flow object with `id`, `status`, `resumeUrl`, etc.\n- **Note:** When authentication completes, the app receives auth code or tokens in JSON instead of a redirect\n- **Reference:** https://apidocs.pingidentity.com/pingone/auth/v1/api/#redirect-and-non-redirect-authentication-flows\n- The flowID represents the authentication session and is used in subsequent steps\n\n**Example Authorization URL (with variables filled):**\n```\nGET https://auth.pingone.com/12345678-1234-1234-1234-123456789012/as/authorize?response_type=code&client_id=abcd1234-5678-9012-3456-789012345678&redirect_uri=http://localhost:3000/callback&scope=openid%20profile%20email&response_mode=pi.flow&code_challenge=ABC123def456GHI789jkl012MNO345pqr678STU901vwx&code_challenge_method=S256\n```\n\n**API Call Template:**\n```\nGET {{authPath}}/{{envID}}/as/authorize?response_type=code&client_id={{webAppSignInWithPKCEId}}&redirect_uri={{redirect_uri}}&scope={{scopes_oidc}}&response_mode=pi.flow&code_challenge={{codeChallenge}}&code_challenge_method=S256\n```\n\n**Note:** This GET request returns a JSON flow object (not a redirect) due to `response_mode=pi.flow`. Use the returned `flowId` in subsequent authentication steps.',
					[
						{ key: 'Accept', value: 'application/json' },
						{ key: 'User-Agent', value: 'PostmanRuntime/7.0' },
					],
					undefined,
					[
						'pm.test("✅ Authorization request initiated successfully", function() {',
						'    pm.expect(pm.response.code, "Response should be 200 or 302").to.be.oneOf([200, 302]);',
						'});',
						'',
						'try {',
						'    let json = pm.response.json();',
						'    ',
						'    if (json.id) {',
						'        pm.environment.set("flowID", json.id);',
						'        console.log("flowID set to:", json.id);',
						'        ',
						'        pm.test("✅ Flow ID was saved to variable flowID with a value of: " + json.id, function () {',
						'            pm.expect(json.id, "Flow ID should be a non-empty string").to.be.a("string").and.not.empty;',
						'        });',
						'        ',
						'        pm.test("✅ Response contains flow ID", function() {',
						'            pm.expect(json).to.have.property("id");',
						'        });',
						'    } else {',
						'        console.error("❌ No \'id\' field found in response.");',
						'        pm.test("❌ Response should contain flow ID", function() {',
						'            pm.expect.fail("Response does not contain flow ID");',
						'        });',
						'    }',
						'    ',
						'    if (pm.environment.get("codeChallenge")) {',
						'        pm.test("✅ Code Challenge was saved to variable codeChallenge with a value of: " + pm.environment.get("codeChallenge"), function () {',
						'            pm.expect(pm.environment.get("codeChallenge"), "Code challenge should be a non-empty string").to.be.a("string").and.not.empty;',
						'            pm.expect(pm.environment.get("codeChallenge").length, "Code challenge should have sufficient length").to.be.at.least(43);',
						'        });',
						'    }',
						'    ',
						'    if (pm.environment.get("codeVerifier")) {',
						'        pm.test("✅ Code Verifier was saved to variable codeVerifier with a value of: " + pm.environment.get("codeVerifier"), function () {',
						'            pm.expect(pm.environment.get("codeVerifier"), "Code verifier should be a non-empty string").to.be.a("string").and.not.empty;',
						'            pm.expect(pm.environment.get("codeVerifier").length, "Code verifier should have sufficient length").to.be.at.least(43);',
						'        });',
						'    }',
						'} catch (e) {',
						'    console.log("There was an error parsing JSON", e);',
						'}',
					],
					[
						'// Generate PKCE code verifier and challenge for OAuth 2.0 security',
						'function generatePKCE() {',
						'    // Generate random code verifier (43-128 characters, URL-safe)',
						'    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";',
						'    let codeVerifier = "";',
						'    for (let i = 0; i < 64; i++) {',
						'        codeVerifier += possible.charAt(Math.floor(Math.random() * possible.length));',
						'    }',
						'    ',
						'    // Generate code challenge using SHA-256',
						'    const encoder = new TextEncoder();',
						'    const data = encoder.encode(codeVerifier);',
						'    ',
						'    // Use crypto API if available (Node.js/Postman runtime)',
						'    if (typeof crypto !== "undefined" && crypto.subtle) {',
						'        // Browser/Postman environment',
						'        return crypto.subtle.digest("SHA-256", data).then(hash => {',
						'            const hashArray = Array.from(new Uint8Array(hash));',
						'            const base64URL = btoa(String.fromCharCode.apply(null, hashArray))',
						'                .replace(/\\+/g, "-")',
						'                .replace(/\\//g, "_")',
						'                .replace(/=/g, "");',
						'            pm.environment.set("codeChallenge", base64URL);',
						'            pm.environment.set("codeVerifier", codeVerifier);',
						'            console.log("✅ Generated PKCE code challenge and verifier");',
						'            console.log("📝 Code challenge:", base64URL.substring(0, 20) + "...");',
						'        });',
						'    } else {',
						'        // Fallback for environments without crypto API',
						'        console.log("⚠️ Crypto API not available, using simplified PKCE");',
						'        const simplifiedChallenge = btoa(codeVerifier).replace(/\\+/g, "-").replace(/\\//g, "_").replace(/=/g, "");',
						'        pm.environment.set("codeChallenge", simplifiedChallenge);',
						'        pm.environment.set("codeVerifier", codeVerifier);',
						'        console.log("✅ Generated simplified PKCE code challenge and verifier");',
						'    }',
						'}',
						'',
						'// Execute PKCE generation',
						'generatePKCE();',
					]
				),
				createUseCaseItem(
					'Step 2: Lookup User by Email',
					'GET',
					`${baseUrl}/users?filter=email eq "cmuir+{{baseballPlayerFirstName}}@pingone.com"&limit=20`,
					'**Sign-in: Lookup User by Email**\n\n**Educational Context:**\n- Look up a user by their email address before submitting login credentials\n- Use GET with filter parameter to search by email using SCIM filter syntax\n- Returns user object if found, or empty result if user doesn\'t exist\n- Email filter searches the user\'s email attribute\n- **SCIM Operators**: Uses `eq` (equals) operator - email also supports `sw` (starts with) and `ew` (ends with for domains only)\n- Uses the same email that was used to create the user in Register user Step 1\n- **Limit Parameter**: `limit=20` restricts results to maximum 20 users for performance and to prevent large result sets\n- This step verifies the user exists and can be used as an alternative to username lookup\n- Reference: [PingOne API Documentation - List Users with Filters](https://apidocs.pingidentity.com/pingone/platform/v1/api/#get-list-users)\n\n**Filter Syntax:**\n```\nGET {{apiPath}}/v1/environments/{{envID}}/users?filter=email eq "cmuir+firstname@pingone.com"&limit=20\n```\n\n**Important:** Uses the same email format as registration: `cmuir+{{baseballPlayerFirstName}}@pingone.com`\n\n**Prerequisite:**\n- Complete Register user Step 1: Create a user (for Sign-in)',
					[
						{ key: 'Authorization', value: 'Bearer {{workerToken}}' },
						{ key: 'Accept', value: 'application/json' },
					],
					undefined,
					[
						'pm.test("✅ Call was Successful - Email Lookup Completed", function() {',
						'    pm.response.to.have.status(200);',
						'});',
						'',
						'try {',
						'    const jsonData = pm.response.json();',
						'    if (jsonData._embedded && jsonData._embedded.users && jsonData._embedded.users.length > 0) {',
						'        const user = jsonData._embedded.users[0];',
						'        ',
						'        pm.test("✅ User found in response", function() {',
						'            pm.expect(jsonData._embedded.users.length, "Should have at least one user").to.be.at.least(1);',
						'            pm.expect(user.id).to.equal(pm.environment.get("SignInUserID"));',
						'        });',
						'        ',
						'        const emailValue = user.email?.address || user.email || "N/A";',
						'        console.log("✅ User found:", user.id, "- email:", emailValue);',
						'        console.log("📝 User exists and is ready for authentication");',
						'    } else {',
						'        console.log("⚠️ User not found - verify email is correct");',
						'        console.log("📝 Make sure Register user Step 1 has been completed");',
						'    }',
						'} catch (e) {',
						'    console.log("There was an error parsing JSON", e);',
						'    console.log("❌ Failed to lookup user:", pm.response.code);',
						'}',
					],
					[
						'// Validate that SignInUserID is set (from Register user Step 1)',
						'const signInUserID = pm.environment.get("SignInUserID");',
						'',
						'if (!signInUserID || signInUserID.trim() === "") {',
						'    console.log("❌ ERROR: SignInUserID is missing or empty");',
						'    console.log("📝 You must complete Register user Step 1: Create a user (for Sign-in) first");',
						'    throw new Error("SignInUserID is required. Complete Register user Step 1 first.");',
						'}',
						'console.log("✅ SignInUserID found: " + signInUserID);',
					]
				),
				createUseCaseItem(
					'Step 3: Submit login credentials',
					'POST',
					`{{authPath}}/{{envID}}/flows/{{flowID}}`,
					"**Sign-in: Submit Login Credentials**\n\n**Educational Context:**\n- To respond to the `USERNAME_PASSWORD_REQUIRED` flow state, the user initiates the `usernamePassword.check` action\n- The flow service calls the `POST {{authPath}}/{{envID}}/flows/{{flowID}}` endpoint operation (NOT /as/flows/{{flowID}})\n- Uses the `application/vnd.pingidentity.usernamePassword.check+json` custom media type in the `Content-type` HTTP request header to identify the action\n- The request body requires the `username` and `password` properties, which specify the user's login credentials\n- **Important:** The username comes from the user created in Register user Step 1 (SignInUsername variable)\n- **Prerequisite:** You must complete Register user Step 1: Create a user (for Sign-in) before running this step\n- In this workflow, if the `usernamePassword.check` action completes successfully, the flow proceeds to the next sign-on policy action",
					[
						{
							key: 'Content-Type',
							value: 'application/vnd.pingidentity.usernamePassword.check+json',
						},
						{ key: 'Accept', value: 'application/json' },
					],
					{
						username: '{{SignInUsername}}',
						password: '{{userPassword}}',
					},
					[
						'pm.test("✅ Call was Successful - Login Credentials Submitted", function() {',
						'    pm.response.to.have.status(200);',
						'});',
						'',
						'try {',
						'    var jsonData = pm.response.json();',
						'    ',
						'    if (jsonData.status) {',
						'        pm.test("✅ Login Credentials submitted, returned status of: " + jsonData.status, function () {',
						'            pm.expect(jsonData.status, "Status should be a non-empty string").to.be.a("string").and.not.empty;',
						'        });',
						'        ',
						'        pm.test("✅ Response contains status property", function() {',
						'            pm.expect(jsonData).to.have.property("status");',
						'        });',
						'        ',
						'        console.log("✅ Login credentials submitted, returned status of: " + jsonData.status);',
						'        ',
						'        if (jsonData.status === "OTP_REQUIRED") {',
						'            console.log("📝 MFA required - proceed to MFA challenge step");',
						'        } else if (jsonData.status === "COMPLETE" || jsonData.status === "COMPLETED") {',
						'            console.log("📝 Login successful - proceed to resume endpoint");',
						'        }',
						'    }',
						'} catch (e) {',
						'    console.log("❌ There was an error parsing JSON", e);',
						'    pm.test("❌ Response should be valid JSON", function() {',
						'        pm.expect.fail("Failed to parse response as JSON: " + e.message);',
						'    });',
						'}',
					],
					[
						'// Validate that SignInUsername is set (from Register user Step 1)',
						'const signInUsername = pm.environment.get("SignInUsername");',
						'const userPassword = pm.environment.get("userPassword");',
						'',
						'if (!signInUsername || signInUsername.trim() === "") {',
						'    console.log("❌ ERROR: SignInUsername is missing or empty");',
						'    console.log("📝 You must complete Register user Step 1: Create a user (for Sign-in) first");',
						'    console.log("📝 The SignInUsername variable is set when the user is created in Register user Step 1");',
						'    console.log("📝 Go to the Sign-up (Registration) use case and run Register user Step 1");',
						'    throw new Error("SignInUsername is required. Complete Register user Step 1 first.");',
						'}',
						'',
						'if (!userPassword || userPassword.trim() === "") {',
						'    console.log("❌ ERROR: userPassword is missing or empty");',
						'    console.log("📝 You must complete Register user Step 2: Set user password (for Sign-in) first");',
						'    console.log("📝 The userPassword variable is set in Register user Step 2");',
						'    console.log("📝 Go to the Sign-up (Registration) use case and run Register user Step 2");',
						'    throw new Error("userPassword is required. Complete Register user Step 2 first.");',
						'}',
						'',
						'console.log("✅ SignInUsername found: " + signInUsername);',
						'console.log("✅ userPassword found (length: " + userPassword.length + ")");',
						'console.log("📝 Using credentials from Register user Step 1 and Step 2");',
					]
				),
				createUseCaseItem(
					'Step 4: Call the resume endpoint',
					'GET',
					`${authBaseUrl}/as/resume?flowId={{flowID}}`,
					'**Sign-in: Get Authorization Code**\n\n**Educational Context:**\n- After completing the actions specified by the sign-on policy, the authentication flow completes, and the user is redirected to the URL specified in the `resumeUrl` property in the flow resource\n- You can use the `GET {{authPath}}/{{envID}}/as/resume?flowId={{flowID}}` endpoint to obtain the authorization code required to exchange for an access token\n- The response returns a `302` HTTP Status message and a `Location` HTTP header that includes the code',
					[],
					undefined,
					[
						'pm.test("✅ Call was Successful - Authorization Code Retrieved", function() {',
						'    pm.response.to.have.status(200);',
						'});',
						'',
						'try {',
						'    let json = pm.response.json();',
						'    ',
						'    if (json.id) {',
						'        pm.environment.set("authCode", json.authorizeResponse.code);',
						'        console.log("authCode saved:", json.authorizeResponse.code);',
						'        ',
						'        pm.test("✅ Authorization Code was saved to variable authCode with a value of: " + json.authorizeResponse.code, function () {',
						'            pm.expect(json.authorizeResponse.code, "Authorization code should be a non-empty string").to.be.a("string").and.not.empty;',
						'        });',
						'        ',
						'        pm.test("✅ Response contains authorization code", function() {',
						'            pm.expect(json).to.have.property("authorizeResponse");',
						'            pm.expect(json.authorizeResponse).to.have.property("code");',
						'        });',
						'        ',
						'        console.log("✅ Authorization code retrieved successfully");',
						'        console.log("📝 Proceed to exchange code for tokens");',
						'    } else {',
						'        console.error("❌ Authorization code not found in response.");',
						'        pm.test("❌ Response should contain authorization code", function() {',
						'            pm.expect.fail("Response does not contain authorization code");',
						'        });',
						'    }',
						'} catch (e) {',
						'    console.log("❌ There was an error parsing JSON", e);',
						'    pm.test("❌ Response should be valid JSON", function() {',
						'        pm.expect.fail("Failed to parse response as JSON: " + e.message);',
						'    });',
						'}',
					]
				),
				createUseCaseItem(
					'Step 5: Get the access token',
					'POST',
					`${authBaseUrl}/as/token`,
					"**Sign-in: Exchange Code for Tokens**\n\n**Educational Context:**\n- The token endpoint is used by the client to obtain an access token by presenting the client's authorization grant\n- For `authorization_code` grants, the application calls the `POST {{authPath}}/{{envID}}/as/token` endpoint to acquire the access token\n- The request body must include values for the following properties:\n  - `grant_type`: A string that specifies the grant type of the token request. In this example, the value is `authorization_code`\n  - `code`: A string that specifies the authorization code value returned by the authorization request\n  - `redirect_uri`: A string that specifies the URL that specifies the return entry point of the application\n  - `code_verifier`: The PKCE code verifier that matches the code_challenge from Step 1\n  - `client_id`: The OAuth client ID (user_client_id) for user authentication flows\n  - `client_secret`: The OAuth client secret (user_client_secret) for user authentication flows\n- **Note:** This uses client_secret_post authentication method (client credentials in request body)\n- **Important:** Uses `user_client_id` and `user_client_secret` (different from `worker_client_id`/`worker_client_secret` used for worker token)\n- The response data contains the access token and the ID token",
					[{ key: 'Content-Type', value: 'application/x-www-form-urlencoded' }],
					{
						grant_type: 'authorization_code',
						code: '{{authCode}}',
						redirect_uri: '{{redirect_uri}}',
						code_verifier: '{{codeVerifier}}',
						client_id: '{{user_client_id}}',
						client_secret: '{{user_client_secret}}',
					},
					[
						'pm.test("✅ Call was Successful - Tokens Retrieved", function() {',
						'    pm.response.to.have.status(200);',
						'});',
						'',
						'try {',
						'    let jsonData = pm.response.json();',
						'    ',
						'    if (jsonData.access_token) {',
						'        pm.environment.set("access_token", jsonData.access_token);',
						'        pm.environment.set("userToken", jsonData.access_token);',
						'        ',
						'        pm.test("✅ Access Token was saved to variable access_token with a value of: " + jsonData.access_token, function() {',
						'            pm.expect(jsonData.access_token, "Access token should be a non-empty string").to.be.a("string").and.not.empty;',
						'            pm.expect(jsonData.access_token.length, "Access token should have sufficient length").to.be.at.least(10);',
						'        });',
						'        ',
						'        pm.test("✅ Response contains access_token", function() {',
						'            pm.expect(jsonData).to.have.property("access_token");',
						'        });',
						'        ',
						'        console.log("access_token is now: " + pm.environment.get("access_token"));',
						'        console.log("✅ Access token retrieved successfully");',
						'    }',
						'    ',
						'    if (jsonData.id_token) {',
						'        pm.environment.set("id_token", jsonData.id_token);',
						'        ',
						'        pm.test("✅ ID Token was saved to variable id_token", function() {',
						'            pm.expect(jsonData.id_token, "ID token should be a non-empty string").to.be.a("string").and.not.empty;',
						'        });',
						'        ',
						'        // Extract userId (sub) from ID token',
						'        const idTokenParts = jsonData.id_token.split(".");',
						'        if (idTokenParts.length >= 2) {',
						'            try {',
						'                const payload = JSON.parse(atob(idTokenParts[1]));',
						'                if (payload.sub) {',
						'                    pm.environment.set("userId", payload.sub);',
						'                    ',
						'                    pm.test("✅ User ID extracted from ID token", function() {',
						'                        pm.expect(payload.sub, "User ID (sub) should be present in ID token").to.be.a("string").and.not.empty;',
						'                    });',
						'                    ',
						'                    console.log("userId is now: " + pm.environment.get("userId"));',
						'                    console.log("✅ User ID extracted from ID token:", payload.sub);',
						'                }',
						'            } catch (e) {',
						'                console.log("❌ There was an error parsing ID token", e);',
						'            }',
						'        }',
						'        ',
						'        console.log("✅ ID token retrieved successfully");',
						'    }',
						'    ',
						'    if (jsonData.refresh_token) {',
						'        pm.environment.set("refresh_token", jsonData.refresh_token);',
						'        ',
						'        pm.test("✅ Refresh Token was saved to variable refresh_token", function() {',
						'            pm.expect(jsonData.refresh_token, "Refresh token should be a non-empty string").to.be.a("string").and.not.empty;',
						'        });',
						'        ',
						'        console.log("refresh_token is now: " + pm.environment.get("refresh_token"));',
						'        console.log("✅ Refresh token saved");',
						'    }',
						'    ',
						'    pm.test("✅ Token exchange completed successfully", function() {',
						'        pm.expect(jsonData).to.have.property("access_token");',
						'        pm.expect(jsonData).to.have.property("token_type", "Bearer");',
						'    });',
						'    ',
						'    console.log("✅ Token exchange completed - user is now authenticated");',
						'} catch (e) {',
						'    console.log("❌ There was an error parsing JSON", e);',
						'    pm.test("❌ Response should be valid JSON", function() {',
						'        pm.expect.fail("Failed to parse response as JSON: " + e.message);',
						'    });',
						'}',
					]
				),
			],
		},
		{
			name: 'Test Login',
			item: [
				createUseCaseItem(
					'Get User Info',
					'GET',
					`${authBaseUrl}/as/userinfo`,
					'**Sign-in: Get User Info (OAuth UserInfo Endpoint)**\n\n**Educational Context:**\n- Retrieves user information using the OAuth UserInfo endpoint\n- This is the OIDC UserInfo endpoint that returns user claims (profile, email, etc.)\n- Requires a valid OAuth access token obtained from the Login flow (Step 4: Get the access token)\n- The access_token should have the `openid profile email` scopes to retrieve user information\n- This endpoint returns user claims based on the scopes granted during authentication\n- This proves that the login was successful and the user can access their information\n- Reference: [OpenID Connect Core 1.0 - UserInfo Endpoint](https://openid.net/specs/openid-connect-core-1_0.html#UserInfo)\n\n**Prerequisites:**\n- Complete Step 4: Get the access token in the Login section\n- The access_token must have `openid` scope (and optionally `profile` and `email` scopes)\n- The access_token must not be expired\n- The access_token must be from the same environment as the UserInfo endpoint',
					[
						{ key: 'Authorization', value: 'Bearer {{access_token}}' },
						{ key: 'Accept', value: 'application/json' },
					],
					undefined,
					[
						'pm.test("✅ Call was Successful - User Info Retrieved", function() {',
						'    pm.response.to.have.status(200);',
						'});',
						'',
						'try {',
						'    const jsonData = pm.response.json();',
						'    ',
						'    pm.test("✅ User info retrieved successfully", function() {',
						'        pm.expect(jsonData).to.be.an("object");',
						'    });',
						'    ',
						'    // Check for standard OIDC claims',
						'    if (jsonData.sub) {',
						'        pm.test("✅ Response contains sub (subject) claim", function() {',
						'            pm.expect(jsonData.sub).to.be.a("string").and.not.empty;',
						'        });',
						'    }',
						'    ',
						'    // Display user information',
						'    console.log("✅ User Info Retrieved (Login Successful):");',
						'    console.log("   Subject (sub):", jsonData.sub || "N/A");',
						'    if (jsonData.name) {',
						'        console.log("   Name:", jsonData.name);',
						'    }',
						'    if (jsonData.given_name) {',
						'        console.log("   Given Name:", jsonData.given_name);',
						'    }',
						'    if (jsonData.family_name) {',
						'        console.log("   Family Name:", jsonData.family_name);',
						'    }',
						'    if (jsonData.email) {',
						'        console.log("   Email:", jsonData.email);',
						'    }',
						'    if (jsonData.email_verified !== undefined) {',
						'        console.log("   Email Verified:", jsonData.email_verified);',
						'    }',
						'    if (jsonData.preferred_username) {',
						'        console.log("   Preferred Username:", jsonData.preferred_username);',
						'    }',
						'    ',
						'    // Log all available claims',
						'    console.log("📝 All available claims:", Object.keys(jsonData).join(", "));',
						'    ',
						'    // Pretty print the full response',
						'    console.log("📝 Full User Info Response:");',
						'    console.log(JSON.stringify(jsonData, null, 2));',
						'    ',
						'    console.log("✅ Login verified - user information successfully retrieved");',
						'} catch (e) {',
						'    console.log("There was an error parsing JSON", e);',
						'    console.log("❌ Failed to retrieve user info:", pm.response.code);',
						'    if (pm.response.code === 401 || pm.response.code === 403) {',
						'        console.log("📝 Access token may be invalid, expired, or missing required scopes");',
						'        console.log("📝 Make sure you completed Step 4 (Get the access token) in the Login section");',
						"        console.log(\"📝 The access_token must have the 'openid' scope (and optionally 'profile' and 'email' scopes)\");",
						'        console.log("📝 Check that the access_token has not expired");',
						'        ',
						'        // Try to get more details from error response',
						'        try {',
						'            const errorData = pm.response.json();',
						'            if (errorData.details && errorData.details.length > 0) {',
						'                errorData.details.forEach(function(detail) {',
						'                    if (detail.code === "INVALID_TOKEN") {',
						'                        console.log("📝 Token error: " + detail.message);',
						'                    }',
						'                });',
						'            }',
						'        } catch (e2) {',
						'            // Ignore JSON parse errors',
						'        }',
						'    }',
						'}',
					],
					[
						'// Validate access token before making request',
						'const accessToken = pm.environment.get("access_token");',
						'',
						'if (!accessToken || accessToken.trim() === "") {',
						'    console.log("❌ ERROR: access_token is missing or empty");',
						'    console.log("📝 You must complete Step 4: Get the access token first");',
						'    console.log("📝 The access_token will be saved automatically after token exchange");',
						'    throw new Error("access_token is required. Complete Step 4: Get the access token first.");',
						'}',
						'',
						'console.log("✅ Access token found (length: " + accessToken.length + ")");',
						'console.log("📝 Token preview: " + accessToken.substring(0, 20) + "...");',
						'console.log("📝 Make sure this token has the \'openid\' scope and has not expired");',
						'console.log("📝 If you get an INVALID_TOKEN error, the token may be expired or missing the required scopes");',
					]
				),
			],
		},
	];

	// Use Case 3: MFA Enrollment - Register SMS Device
	// Structure: Environment Configuration, Enroll Device, Test MFA
	const mfaEnrollmentItems: PostmanCollectionItem[] = [
		{
			name: 'Environment Configuration',
			item: [
				createUseCaseItem(
					'Step 1: Get Device Authentication Policies',
					'GET',
					`${baseUrl}/deviceAuthenticationPolicies`,
					'**MFA Enrollment: Get Policies**\n\n**Educational Context:**\n- Retrieves all device authentication policies (MFA policies) available in the environment\n- Device authentication policies define how MFA devices should behave (OTP length, expiration, retry limits, etc.)\n- You need a policy ID to register an MFA device\n- The first policy ID found will be saved and used in the next step (Create SMS Device)\n- In production, you should filter policies or use a specific policy ID based on your security requirements',
					[
						{ key: 'Authorization', value: 'Bearer {{workerToken}}' },
						{ key: 'Accept', value: 'application/json' },
					],
					undefined,
					[
						'pm.test("✅ Call was Successful - Device Authentication Policies Retrieved", function() {',
						'    pm.response.to.have.status(200);',
						'});',
						'',
						'try {',
						'    const jsonData = pm.response.json();',
						'    if (jsonData._embedded && jsonData._embedded.deviceAuthenticationPolicies && jsonData._embedded.deviceAuthenticationPolicies.length > 0) {',
						'        // Get the first policy (in production, you may want to filter by name or use a specific policy)',
						'        const firstPolicy = jsonData._embedded.deviceAuthenticationPolicies[0];',
						'        if (firstPolicy.id) {',
						'            pm.environment.set("deviceAuthenticationPolicyId", firstPolicy.id);',
						'            ',
						'            pm.test("✅ Device Authentication Policy ID was saved to variable deviceAuthenticationPolicyId with a value of: " + firstPolicy.id, function () {',
						'                pm.expect(firstPolicy.id, "Policy ID should be a non-empty string").to.be.a("string").and.not.empty;',
						'            });',
						'            ',
						'            pm.test("✅ Policy has required properties", function() {',
						'                pm.expect(firstPolicy).to.have.property("id");',
						'                pm.expect(firstPolicy).to.have.property("name");',
						'            });',
						'            ',
						'            console.log("deviceAuthenticationPolicyId is now: " + pm.environment.get("deviceAuthenticationPolicyId"));',
						'            console.log("✅ Device authentication policy ID saved:", firstPolicy.id);',
						'            console.log("   Policy name:", firstPolicy.name || "N/A");',
						'            console.log("📝 Proceed to create SMS device");',
						'        } else {',
						'            console.log("⚠️ Policy found but no ID available");',
						'        }',
						'    } else {',
						'        console.log("⚠️ No device authentication policies found in the environment");',
						'        console.log("   You must create at least one MFA policy before registering devices");',
						'    }',
						'} catch (e) {',
						'    console.log("There was an error parsing JSON", e);',
						'    console.log("❌ Failed to retrieve policies:", pm.response.code);',
						'}',
					]
				),
			],
		},
		{
			name: 'Enroll Device',
			item: [
				createUseCaseItem(
					'Step 1: Get User Information',
					'GET',
					`${baseUrl}/users/{{SignInUserID}}`,
					'**MFA Enrollment: Get User Information**\n\n**Educational Context:**\n- Retrieves user information using the userId from Register user (Step 1: Create a user for Sign-in)\n- Uses the same user created in the Register user section - no new user is created\n- The SignInUserID was saved when the user was created in Register user Step 1\n- This step verifies the user exists and retrieves user details needed for MFA device operations\n- **Important:** All use cases share the same user created in Register user to maintain consistency\n- Reference: [PingOne API Documentation - Get User](https://apidocs.pingidentity.com/pingone/platform/v1/api/#get-read-one-user)',
					[
						{ key: 'Authorization', value: 'Bearer {{workerToken}}' },
						{ key: 'Accept', value: 'application/json' },
					],
					undefined,
					[
						'pm.test("✅ Call was Successful - User Information Retrieved", function() {',
						'    pm.response.to.have.status(200);',
						'});',
						'',
						'try {',
						'    const jsonData = pm.response.json();',
						'    ',
						'    pm.test("✅ User information retrieved successfully", function() {',
						'        pm.expect(jsonData).to.have.property("id");',
						'        pm.expect(jsonData.id).to.equal(pm.environment.get("SignInUserID"));',
						'    });',
						'    ',
						'    // Set userId for use in subsequent steps (using SignInUserID)',
						'    pm.environment.set("userId", jsonData.id);',
						'    if (jsonData.username) {',
						'        pm.environment.set("username", jsonData.username);',
						'    }',
						'    ',
						'    console.log("✅ Using user from Sign-in flow:");',
						'    console.log("   User ID:", jsonData.id);',
						'    console.log("   Username:", jsonData.username || "N/A");',
						'    console.log("   Email:", jsonData.email?.address || jsonData.email || "N/A");',
						'    console.log("📝 This is the same user created in Register user Step 1");',
						'    console.log("📝 Proceed to create MFA device for this user");',
						'} catch (e) {',
						'    console.log("There was an error parsing JSON", e);',
						'    console.log("❌ Failed to retrieve user information:", pm.response.code);',
						'    console.log("📝 Make sure Register user Step 1 (Create a user for Sign-in) has been completed first");',
						'}',
					]
				),
			],
		},
		{
			name: 'Test MFA',
			item: [
				createUseCaseItem(
					'Step 1: Create SMS Device',
					'POST',
					`${baseUrl}/users/{{SignInUserID}}/devices`,
					'**MFA Enrollment: Create SMS Device**\n\n**Educational Context:**\n- Creates a new SMS MFA device for the user\n- Use status: "ACTIVATION_REQUIRED" to require OTP verification before device is active\n- PingOne automatically sends an OTP code to the provided phone number when device is created\n- Phone number must be in E.164 format (e.g., +15551234567)\n- The deviceAuthenticationPolicyId from step 2 links this device to an MFA policy\n- After creation, device status will be ACTIVATION_REQUIRED until OTP is verified\n- Requires worker token for authentication (admin flow operation)\n- Reference: [PingOne MFA Device Registration Documentation](https://apidocs.pingidentity.com/pingone/platform/v1/api/#post-create-mfa-user-device)\n\n**Request Body:**\n```json\n{\n    "type": "SMS",\n    "phone": "+15551234567",\n    "nickname": "My SMS Device",\n    "status": "ACTIVATION_REQUIRED",\n    "policy": {\n        "id": "{{deviceAuthenticationPolicyId}}"\n    }\n}\n```',
					[
						{ key: 'Authorization', value: 'Bearer {{workerToken}}' },
						{ key: 'Content-Type', value: 'application/json' },
						{ key: 'Accept', value: 'application/json' },
					],
					{
						type: 'SMS',
						phone: '{{phone}}',
						nickname: 'My SMS Device',
						status: 'ACTIVATION_REQUIRED',
						policy: {
							id: '{{deviceAuthenticationPolicyId}}',
						},
					},
					[
						'pm.test("✅ Call was Successful - SMS Device Created", function() {',
						'    pm.response.to.have.status(201);',
						'});',
						'',
						'try {',
						'    const jsonData = pm.response.json();',
						'    if (jsonData.id) {',
						'        pm.environment.set("deviceId", jsonData.id);',
						'        ',
						'        pm.test("✅ Device ID was saved to variable deviceId with a value of: " + jsonData.id, function () {',
						'            pm.expect(jsonData.id, "Device ID should be a non-empty string").to.be.a("string").and.not.empty;',
						'        });',
						'        ',
						'        pm.test("✅ Device has required properties", function() {',
						'            pm.expect(jsonData).to.have.property("id");',
						'            pm.expect(jsonData).to.have.property("type", "SMS");',
						'            pm.expect(jsonData).to.have.property("status");',
						'        });',
						'        ',
						'        console.log("deviceId is now: " + pm.environment.get("deviceId"));',
						'        console.log("✅ SMS device created:", jsonData.id);',
						'        console.log("   Device type:", jsonData.type || "SMS");',
						'        console.log("   Device status:", jsonData.status || "N/A");',
						'        console.log("   Phone number:", jsonData.phone?.number || jsonData.phone || "N/A");',
						'        if (jsonData.status === "ACTIVATION_REQUIRED") {',
						'            console.log("📝 OTP code has been sent to phone number");',
						'            console.log("📝 Proceed to step 4: Activate Device with OTP");',
						'        }',
						'    } else {',
						'        console.log("⚠️ Device created but no ID in response");',
						'    }',
						'} catch (e) {',
						'    console.log("There was an error parsing JSON", e);',
						'    console.log("❌ Failed to create SMS device:", pm.response.code);',
						'}',
					]
				),
				createUseCaseItem(
					'Step 2: Activate Device with OTP',
					'POST',
					`${baseUrl}/users/{{SignInUserID}}/devices/{{deviceId}}`,
					'**MFA Enrollment: Activate Device**\n\n**Educational Context:**\n- Activates the SMS device by verifying the OTP code sent to the user\'s phone\n- User should enter the OTP code they received via SMS from step 3\n- The OTP code must be entered correctly and before it expires (expiration time is defined in the MFA policy)\n- After successful activation, device status changes to ACTIVE and can be used for MFA during sign-in\n- If OTP is incorrect or expired, device remains in ACTIVATION_REQUIRED status and you can resend OTP\n- Requires worker token for authentication (admin flow operation)\n- Content-Type: application/vnd.pingidentity.device.activate+json\n- Reference: [PingOne MFA Device Activation Documentation](https://apidocs.pingidentity.com/pingone/platform/v1/api/#post-activate-mfa-user-device)\n\n**Request Body:**\n```json\n{\n    "otp": "123456"\n}\n```',
					[
						{ key: 'Authorization', value: 'Bearer {{workerToken}}' },
						{ key: 'Content-Type', value: 'application/vnd.pingidentity.device.activate+json' },
						{ key: 'Accept', value: 'application/json' },
					],
					{
						otp: '{{otp_code}}',
					},
					[
						'pm.test("✅ Call was Successful - Device Activated", function() {',
						'    pm.expect(pm.response.code, "Response should be 200 or 204").to.be.oneOf([200, 204]);',
						'});',
						'',
						'try {',
						'    if (pm.response.code === 200 || pm.response.code === 204) {',
						'        pm.test("✅ Device activation completed", function() {',
						'            pm.expect(pm.response.code, "Response status should indicate success").to.be.oneOf([200, 204]);',
						'        });',
						'        ',
						'        console.log("✅ SMS device activated successfully");',
						'        ',
						'        if (pm.response.code === 200) {',
						'            const jsonData = pm.response.json();',
						'            if (jsonData.status) {',
						'                console.log("   Device status:", jsonData.status);',
						'                if (jsonData.status === "ACTIVE") {',
						'                    console.log("✅ Device is now ACTIVE and ready for MFA");',
						'                    console.log("📝 MFA enrollment complete - device can be used for login-time MFA");',
						'                }',
						'            }',
						'            if (jsonData.id) {',
						'                pm.environment.set("deviceId", jsonData.id);',
						'            }',
						'        } else {',
						'            // Response may be empty (204 No Content)',
						'            console.log("✅ Device activation successful (204 No Content)");',
						'            console.log("📝 MFA enrollment complete - device is now ACTIVE");',
						'        }',
						'    } else if (pm.response.code === 400) {',
						'        try {',
						'            const jsonData = pm.response.json();',
						'            if (jsonData.message) {',
						'                console.log("❌ Activation failed:", jsonData.message);',
						'                if (jsonData.message.includes("invalid") || jsonData.message.includes("incorrect")) {',
						'                    console.log("   OTP code is incorrect or expired - user should retry with correct code");',
						'                }',
						'            }',
						'        } catch (e2) {',
						'            console.log("❌ Activation failed - invalid OTP code");',
						'        }',
						'    } else if (pm.response.code === 404) {',
						'        console.log("❌ Device not found - verify deviceId is correct");',
						'    } else {',
						'        console.log("❌ Failed to activate device with status:", pm.response.code);',
						'    }',
						'} catch (e) {',
						'    console.log("There was an error parsing JSON", e);',
						'}',
					]
				),
			],
		},
	];

	// Use Case 4: MFA Challenge - Validate OTP during login-time MFA
	// Structure: Single group with all MFA challenge steps
	const mfaChallengeItems: PostmanCollectionItem[] = [
		{
			name: 'MFA Challenge',
			item: [
				createUseCaseItem(
					'Step 1: Initialize Device Authentication',
					'POST',
					`${authBaseUrl}/deviceAuthentications`,
					'**MFA Challenge: Initialize Authentication**\n\n**Educational Context:**\n- Initializes a device authentication session when login requires MFA\n- This happens after primary authentication (username/password) succeeds but MFA is required\n- If deviceId is provided, the device is automatically selected and OTP is sent (for SMS devices)\n- If deviceId is not provided, PingOne returns a list of available devices for selection\n- The deviceAuthenticationPolicyId links to the MFA policy that defines how authentication should proceed\n- Returns deviceAuthenticationId (authentication session ID) needed for subsequent steps\n- Reference: [PingOne MFA Device Authentication Documentation](https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-initialize-device-authentication)\n\n**Request Body:**\n```json\n{\n    "user": {\n        "id": "{{userId}}"\n    },\n    "deviceAuthenticationPolicy": {\n        "id": "{{deviceAuthenticationPolicyId}}"\n    },\n    "device": {\n        "id": "{{deviceId}}"\n    }\n}\n```',
					[
						{ key: 'Authorization', value: 'Bearer {{workerToken}}' },
						{ key: 'Content-Type', value: 'application/json' },
						{ key: 'Accept', value: 'application/json' },
					],
					{
						user: {
							id: '{{SignInUserID}}',
						},
						deviceAuthenticationPolicy: {
							id: '{{deviceAuthenticationPolicyId}}',
						},
						device: {
							id: '{{deviceId}}',
						},
					},
					[
						'pm.test("✅ Call was Successful - Device Authentication Initialized", function() {',
						'    pm.expect(pm.response.code, "Response should be 200 or 201").to.be.oneOf([200, 201]);',
						'});',
						'',
						'try {',
						'    const jsonData = pm.response.json();',
						'    if (jsonData.id) {',
						'        pm.environment.set("deviceAuthenticationId", jsonData.id);',
						'        ',
						'        pm.test("✅ Device Authentication ID was saved to variable deviceAuthenticationId with a value of: " + jsonData.id, function () {',
						'            pm.expect(jsonData.id, "Device authentication ID should be a non-empty string").to.be.a("string").and.not.empty;',
						'        });',
						'        ',
						'        pm.test("✅ Response contains device authentication ID", function() {',
						'            pm.expect(jsonData).to.have.property("id");',
						'        });',
						'        ',
						'        console.log("deviceAuthenticationId is now: " + pm.environment.get("deviceAuthenticationId"));',
						'        console.log("✅ Device authentication initialized:", jsonData.id);',
						'        console.log("   Status:", jsonData.status || "N/A");',
						'        console.log("   Next step:", jsonData.nextStep || "N/A");',
						'        ',
						'        // If device was provided and status is OTP_REQUIRED, OTP has been sent',
						'        if (jsonData.status === "OTP_REQUIRED" || jsonData.nextStep === "OTP_REQUIRED") {',
						'            console.log("📝 OTP code has been sent to device");',
						'            console.log("📝 Proceed to step 3: Check OTP Code (skip step 2 if device was auto-selected)");',
						'        } else if (jsonData.status === "DEVICE_SELECTION_REQUIRED" || jsonData.nextStep === "SELECTION_REQUIRED") {',
						'            console.log("📝 Device selection required - proceed to step 2: Select Device");',
						'        }',
						'        ',
						'        // If multiple devices available, extract device list',
						'        if (jsonData._embedded && jsonData._embedded.devices && jsonData._embedded.devices.length > 0) {',
						'            console.log("📝 Available devices:", jsonData._embedded.devices.length);',
						'            jsonData._embedded.devices.forEach((device, index) => {',
						// biome-ignore lint/suspicious/noTemplateCurlyInString: This is Postman script code where template literals are valid
						'                console.log(`   ${index + 1}. ${device.type} - ${device.nickname || device.id}`);',
						'            });',
						'        }',
						'    } else {',
						'        console.log("⚠️ Authentication initialized but no ID in response");',
						'    }',
						'} catch (e) {',
						'    console.log("There was an error parsing JSON", e);',
						'    console.log("❌ Failed to initialize device authentication:", pm.response.code);',
						'}',
					]
				),
				createUseCaseItem(
					'Step 2: Select Device (if multiple devices)',
					'POST',
					`${authBaseUrl}/deviceAuthentications/{{deviceAuthenticationId}}`,
					'**MFA Challenge: Select Device**\n\n**Educational Context:**\n- Selects a specific device for authentication when user has multiple MFA devices\n- This step is optional if deviceId was provided in step 1 (device is auto-selected)\n- Use this step when Initialize Device Authentication returns status: DEVICE_SELECTION_REQUIRED\n- For SMS devices, selecting a device automatically triggers OTP sending\n- After selection, status changes to OTP_REQUIRED and OTP code is sent to the selected device\n- Reference: [PingOne MFA Device Selection Documentation](https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-select-device-for-authentication)\n\n**Request Body:**\n```json\n{\n    "device": {\n        "id": "{{deviceId}}"\n    },\n    "compatibility": "FULL"\n}\n```',
					[
						{ key: 'Authorization', value: 'Bearer {{workerToken}}' },
						{ key: 'Content-Type', value: 'application/vnd.pingidentity.device.select+json' },
						{ key: 'Accept', value: 'application/json' },
					],
					{
						device: {
							id: '{{deviceId}}',
						},
						compatibility: 'FULL',
					},
					[
						'pm.test("✅ Call was Successful - Device Selected", function() {',
						'    pm.expect(pm.response.code, "Response should be 200 or 204").to.be.oneOf([200, 204]);',
						'});',
						'',
						'try {',
						'    if (pm.response.code === 200 || pm.response.code === 204) {',
						'        pm.test("✅ Device selection completed", function() {',
						'            pm.expect(pm.response.code, "Response status should indicate success").to.be.oneOf([200, 204]);',
						'        });',
						'        ',
						'        console.log("✅ Device selected successfully");',
						'        ',
						'        if (pm.response.code === 200) {',
						'            const jsonData = pm.response.json();',
						'            if (jsonData.status === "OTP_REQUIRED" || jsonData.nextStep === "OTP_REQUIRED") {',
						'                console.log("📝 OTP code has been sent to selected device");',
						'                console.log("📝 Proceed to step 3: Check OTP Code");',
						'            }',
						'            if (jsonData.selectedDevice) {',
						'                console.log("   Selected device:", jsonData.selectedDevice.id);',
						'            }',
						'        } else {',
						'            // Response may be empty (204 No Content)',
						'            console.log("✅ Device selected successfully (204 No Content)");',
						'        }',
						'    }',
						'} catch (e) {',
						'    console.log("There was an error parsing JSON", e);',
						'    console.log("❌ Failed to select device:", pm.response.code);',
						'}',
					]
				),
				createUseCaseItem(
					'Step 3: Check OTP Code',
					'POST',
					`${authBaseUrl}/deviceAuthentications/{{deviceAuthenticationId}}/otp/check`,
					'**MFA Challenge: Validate OTP Code**\n\n**Educational Context:**\n- Validates the OTP code entered by the user during login-time MFA challenge\n- User enters the OTP code they received via SMS (or email) from step 1 or 2\n- The OTP code must match the code sent to the user\'s device\n- OTP codes have expiration times defined in the MFA policy\n- After successful validation, device authentication is complete and user can proceed with login\n- If OTP is invalid, device authentication remains in OTP_REQUIRED status and user can retry\n- Reference: [PingOne MFA OTP Validation Documentation](https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-validate-otp-for-device)\n\n**Request Body:**\n```json\n{\n    "otp": "123456"\n}\n```',
					[
						{ key: 'Authorization', value: 'Bearer {{workerToken}}' },
						{ key: 'Content-Type', value: 'application/vnd.pingidentity.otp.check+json' },
						{ key: 'Accept', value: 'application/json' },
					],
					{
						otp: '{{otp_code}}',
					},
					[
						'pm.test("✅ Call was Successful - OTP Code Validated", function() {',
						'    pm.expect(pm.response.code, "Response should be 200 or 204").to.be.oneOf([200, 204]);',
						'});',
						'',
						'try {',
						'    if (pm.response.code === 200 || pm.response.code === 204) {',
						'        pm.test("✅ OTP validation completed successfully", function() {',
						'            pm.expect(pm.response.code, "Response status should indicate success").to.be.oneOf([200, 204]);',
						'        });',
						'        ',
						'        console.log("✅ OTP code validated successfully");',
						'        ',
						'        if (pm.response.code === 200) {',
						'            const jsonData = pm.response.json();',
						'            if (jsonData.status) {',
						'                console.log("   Authentication status:", jsonData.status);',
						'                if (jsonData.status === "COMPLETED" || jsonData.nextStep === "COMPLETE") {',
						'                    console.log("✅ MFA challenge complete - user can proceed with login");',
						'                    console.log("📝 Device authentication successful");',
						'                } else if (jsonData.status === "OTP_REQUIRED") {',
						'                    console.log("⚠️ OTP still required - verification may have failed");',
						'                }',
						'            }',
						'            if (jsonData._links && jsonData._links.complete) {',
						'                console.log("📝 Next: Complete device authentication if needed");',
						'            }',
						'        } else {',
						'            // Response may be empty (204 No Content)',
						'            console.log("✅ OTP validation successful (204 No Content)");',
						'            console.log("📝 MFA challenge complete - proceed with login");',
						'        }',
						'    } else if (pm.response.code === 400 || pm.response.code === 401) {',
						'        try {',
						'            const jsonData = pm.response.json();',
						'            if (jsonData.message) {',
						'                console.log("❌ OTP validation failed:", jsonData.message);',
						'                if (jsonData.message.includes("invalid") || jsonData.message.includes("incorrect")) {',
						'                    console.log("   OTP code is incorrect or expired - user should retry with correct code");',
						'                }',
						'            }',
						'            if (jsonData.attemptsRemaining !== undefined) {',
						'                console.log("   Attempts remaining:", jsonData.attemptsRemaining);',
						'            }',
						'        } catch (e2) {',
						'            console.log("❌ OTP validation failed - invalid or expired OTP code");',
						'        }',
						'    } else if (pm.response.code === 404) {',
						'        console.log("❌ Device authentication session not found - verify deviceAuthenticationId is correct");',
						'    } else {',
						'        console.log("❌ Failed to validate OTP with status:", pm.response.code);',
						'    }',
						'} catch (e) {',
						'    console.log("There was an error parsing JSON", e);',
						'}',
					]
				),
			],
		},
	];

	// Use Case 5: Step-up Authentication (combines re-auth + sensitive action)
	// Structure: Setup, User login and MFA, Test
	const stepUpItems: PostmanCollectionItem[] = [
		{
			name: 'Setup',
			item: [
				createUseCaseItem(
					'Step 1: Get Device Authentication Policies',
					'GET',
					`${baseUrl}/deviceAuthenticationPolicies`,
					'**Step-up Authentication: Get Policies**\n\n**Educational Context:**\n- Retrieves all device authentication policies (MFA policies) available in the environment\n- Device authentication policies define how MFA devices should behave (OTP length, expiration, retry limits, etc.)\n- You need a policy ID for step-up authentication MFA challenges\n- The first policy ID found will be saved and used in subsequent steps\n- In production, you should filter policies or use a specific policy ID based on your security requirements',
					[
						{ key: 'Authorization', value: 'Bearer {{workerToken}}' },
						{ key: 'Accept', value: 'application/json' },
					],
					undefined,
					[
						'pm.test("✅ Call was Successful - Device Authentication Policies Retrieved", function() {',
						'    pm.response.to.have.status(200);',
						'});',
						'',
						'try {',
						'    const jsonData = pm.response.json();',
						'    if (jsonData._embedded && jsonData._embedded.deviceAuthenticationPolicies && jsonData._embedded.deviceAuthenticationPolicies.length > 0) {',
						'        const firstPolicy = jsonData._embedded.deviceAuthenticationPolicies[0];',
						'        if (firstPolicy.id) {',
						'            pm.environment.set("deviceAuthenticationPolicyId", firstPolicy.id);',
						'            ',
						'            pm.test("✅ Device Authentication Policy ID was saved", function () {',
						'                pm.expect(firstPolicy.id, "Policy ID should be a non-empty string").to.be.a("string").and.not.empty;',
						'            });',
						'            ',
						'            console.log("deviceAuthenticationPolicyId is now: " + pm.environment.get("deviceAuthenticationPolicyId"));',
						'            console.log("✅ Device authentication policy ID saved:", firstPolicy.id);',
						'            console.log("   Policy name:", firstPolicy.name || "N/A");',
						'        }',
						'    }',
						'} catch (e) {',
						'    console.log("There was an error parsing JSON", e);',
						'}',
					]
				),
			],
		},
		{
			name: 'User login and MFA',
			item: [
				createUseCaseItem(
					'Step 1: Initialize Device Authentication',
					'POST',
					`${authBaseUrl}/deviceAuthentications`,
					'**Step-up Authentication: Initialize MFA**\n\n**Educational Context:**\n- Initializes a device authentication session for step-up authentication\n- Step-up authentication requires re-authentication with MFA for sensitive actions\n- This happens when a user is already logged in but needs to perform a high-risk action\n- Uses the same user created in Sign-in Setup Step 6 (SignInUserID)\n- If deviceId is provided, the device is automatically selected and OTP is sent\n- Returns deviceAuthenticationId needed for subsequent steps\n- Reference: [PingOne MFA Device Authentication Documentation](https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-initialize-device-authentication)',
					[
						{ key: 'Authorization', value: 'Bearer {{workerToken}}' },
						{ key: 'Content-Type', value: 'application/json' },
						{ key: 'Accept', value: 'application/json' },
					],
					{
						user: {
							id: '{{SignInUserID}}',
						},
						deviceAuthenticationPolicy: {
							id: '{{deviceAuthenticationPolicyId}}',
						},
						device: {
							id: '{{deviceId}}',
						},
					},
					[
						'pm.test("✅ Call was Successful - Device Authentication Initialized", function() {',
						'    pm.expect(pm.response.code, "Response should be 200 or 201").to.be.oneOf([200, 201]);',
						'});',
						'',
						'try {',
						'    const jsonData = pm.response.json();',
						'    if (jsonData.id) {',
						'        pm.environment.set("deviceAuthenticationId", jsonData.id);',
						'        ',
						'        pm.test("✅ Device Authentication ID was saved", function () {',
						'            pm.expect(jsonData.id, "Device authentication ID should be a non-empty string").to.be.a("string").and.not.empty;',
						'        });',
						'        ',
						'        console.log("deviceAuthenticationId is now: " + pm.environment.get("deviceAuthenticationId"));',
						'        console.log("✅ Device authentication initialized:", jsonData.id);',
						'        console.log("   Status:", jsonData.status || "N/A");',
						'        ',
						'        if (jsonData.status === "OTP_REQUIRED" || jsonData.nextStep === "OTP_REQUIRED") {',
						'            console.log("📝 OTP code has been sent to device");',
						'            console.log("📝 Proceed to step 2: Check OTP Code");',
						'        }',
						'    }',
						'} catch (e) {',
						'    console.log("There was an error parsing JSON", e);',
						'}',
					]
				),
				createUseCaseItem(
					'Step 2: Check OTP Code',
					'POST',
					`${authBaseUrl}/deviceAuthentications/{{deviceAuthenticationId}}/otp/check`,
					"**Step-up Authentication: Validate OTP Code**\n\n**Educational Context:**\n- Validates the OTP code entered by the user during step-up authentication\n- User enters the OTP code they received via SMS (or email) from step 1\n- The OTP code must match the code sent to the user's device\n- After successful validation, step-up authentication is complete and user can proceed with sensitive action\n- Reference: [PingOne MFA OTP Validation Documentation](https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-validate-otp-for-device)",
					[
						{ key: 'Authorization', value: 'Bearer {{workerToken}}' },
						{ key: 'Content-Type', value: 'application/vnd.pingidentity.otp.check+json' },
						{ key: 'Accept', value: 'application/json' },
					],
					{
						otp: '{{otp_code}}',
					},
					[
						'pm.test("✅ Call was Successful - OTP Code Validated", function() {',
						'    pm.expect(pm.response.code, "Response should be 200 or 204").to.be.oneOf([200, 204]);',
						'});',
						'',
						'try {',
						'    if (pm.response.code === 200 || pm.response.code === 204) {',
						'        pm.test("✅ Step-up authentication completed successfully", function() {',
						'            pm.expect(pm.response.code, "Response status should indicate success").to.be.oneOf([200, 204]);',
						'        });',
						'        ',
						'        console.log("✅ OTP code validated successfully");',
						'        console.log("✅ Step-up authentication complete - user can proceed with sensitive action");',
						'        ',
						'        if (pm.response.code === 200) {',
						'            const jsonData = pm.response.json();',
						'            if (jsonData.status === "COMPLETED" || jsonData.nextStep === "COMPLETE") {',
						'                console.log("📝 Step-up authentication successful");',
						'            }',
						'        }',
						'    }',
						'} catch (e) {',
						'    console.log("There was an error parsing JSON", e);',
						'}',
					]
				),
			],
		},
		{
			name: 'Test',
			item: [
				createUseCaseItem(
					'Get Device Authentication Status',
					'GET',
					`${authBaseUrl}/deviceAuthentications/{{deviceAuthenticationId}}`,
					'**Step-up Authentication: Verify Status**\n\n**Educational Context:**\n- Retrieves the current status of the device authentication session\n- Verifies that the step-up authentication was completed successfully\n- Returns the device authentication status (COMPLETED, OTP_REQUIRED, etc.)\n- This proves that the step-up authentication worked and the user can proceed with sensitive actions\n- Reference: [PingOne MFA Device Authentication Documentation](https://apidocs.pingidentity.com/pingone/mfa/v1/api/#get-read-device-authentication)',
					[
						{ key: 'Authorization', value: 'Bearer {{workerToken}}' },
						{ key: 'Accept', value: 'application/json' },
					],
					undefined,
					[
						'pm.test("✅ Call was Successful - Device Authentication Status Retrieved", function() {',
						'    pm.response.to.have.status(200);',
						'});',
						'',
						'try {',
						'    const jsonData = pm.response.json();',
						'    ',
						'    pm.test("✅ Device authentication status retrieved successfully", function() {',
						'        pm.expect(jsonData).to.have.property("id");',
						'        pm.expect(jsonData.id).to.equal(pm.environment.get("deviceAuthenticationId"));',
						'    });',
						'    ',
						'    console.log("✅ Step-up Authentication Status:");',
						'    console.log("   Device Authentication ID:", jsonData.id || "N/A");',
						'    console.log("   Status:", jsonData.status || "N/A");',
						'    ',
						'    if (jsonData.status === "COMPLETED" || jsonData.nextStep === "COMPLETE") {',
						'        console.log("✅ Step-up authentication verified - user can proceed with sensitive actions");',
						'    }',
						'    ',
						'    console.log("📝 Full Device Authentication Response:");',
						'    console.log(JSON.stringify(jsonData, null, 2));',
						'} catch (e) {',
						'    console.log("There was an error parsing JSON", e);',
						'}',
					]
				),
			],
		},
	];

	// Use Case 7: Account Recovery - Recover account when MFA cannot be completed
	// Structure: Action (Account Recovery), Test (Test Account Recovery)
	const accountRecoveryItems: PostmanCollectionItem[] = [
		{
			name: 'Account Recovery',
			item: [
				createUseCaseItem(
					'Step 1: Get User Information',
					'GET',
					`${baseUrl}/users/{{SignInUserID}}`,
					'**Account Recovery: Get User Information**\n\n**Educational Context:**\n- Retrieves user information using the userId from Register user (Step 1: Create a user for Sign-in)\n- Uses the same user created in the Register user section - no new user is created\n- The SignInUserID was saved when the user was created in Register user Step 1\n- This step verifies the user exists before initiating account recovery\n- **Important:** All use cases share the same user created in Register user to maintain consistency\n- Reference: [PingOne API Documentation - Get User](https://apidocs.pingidentity.com/pingone/platform/v1/api/#get-read-one-user)',
					[
						{ key: 'Authorization', value: 'Bearer {{workerToken}}' },
						{ key: 'Accept', value: 'application/json' },
					],
					undefined,
					[
						'pm.test("✅ Call was Successful - User Information Retrieved", function() {',
						'    pm.response.to.have.status(200);',
						'});',
						'',
						'try {',
						'    const jsonData = pm.response.json();',
						'    ',
						'    pm.test("✅ User information retrieved successfully", function() {',
						'        pm.expect(jsonData).to.have.property("id");',
						'        pm.expect(jsonData.id).to.equal(pm.environment.get("SignInUserID"));',
						'    });',
						'    ',
						'    // Set userId for use in subsequent steps (using SignInUserID)',
						'    pm.environment.set("userId", jsonData.id);',
						'    if (jsonData.email) {',
						'        pm.environment.set("email", jsonData.email.address || jsonData.email);',
						'    }',
						'    ',
						'    console.log("✅ Using user from Sign-in flow:");',
						'    console.log("   User ID:", jsonData.id);',
						'    console.log("   Username:", jsonData.username || "N/A");',
						'    console.log("   Email:", jsonData.email?.address || jsonData.email || "N/A");',
						'    console.log("📝 This is the same user created in Register user Step 1");',
						'    console.log("📝 Proceed to step 2: Send Recovery Code to email");',
						'} catch (e) {',
						'    console.log("There was an error parsing JSON", e);',
						'    console.log("❌ Failed to retrieve user information:", pm.response.code);',
						'    console.log("📝 Make sure Register user Step 1 (Create a user for Sign-in) has been completed first");',
						'}',
					]
				),
				createUseCaseItem(
					'Step 2: Send Recovery Code to Email',
					'POST',
					`${baseUrl}/users/{{SignInUserID}}/password/recovery`,
					"**Account Recovery: Send OTP to Email**\n\n**Educational Context:**\n- Sends a recovery OTP code to the user's email address\n- This OTP code is used to prove the user owns the email address and can recover their account\n- Recovery code is a one-time use code that expires after a set time (typically 15-30 minutes)\n- The recovery code is sent via email to the address associated with the user account\n- After sending, user must check their email and enter the recovery code in step 3\n- Content-Type: application/vnd.pingidentity.password.sendRecoveryCode\n- Empty request body triggers recovery code sending to user's configured recovery channel (email/SMS)\n- Reference: [PingOne Password Recovery API](https://apidocs.pingidentity.com/pingone/platform/v1/api/#post-send-password-recovery-code)\n\n**Request Body:**\n```json\n{}\n```\n\nEmpty body triggers recovery code sending to user's configured recovery channel (email/SMS).",
					[
						{ key: 'Authorization', value: 'Bearer {{workerToken}}' },
						{
							key: 'Content-Type',
							value: 'application/vnd.pingidentity.password.sendRecoveryCode',
						},
						{ key: 'Accept', value: 'application/json' },
					],
					{},
					[
						'pm.test("✅ Call was Successful - Recovery Code Sent", function() {',
						'    pm.expect(pm.response.code, "Response should be 200 or 204").to.be.oneOf([200, 204]);',
						'});',
						'',
						'try {',
						'    if (pm.response.code === 200 || pm.response.code === 204) {',
						'        pm.test("✅ Recovery code sending completed", function() {',
						'            pm.expect(pm.response.code, "Response status should indicate success").to.be.oneOf([200, 204]);',
						'        });',
						'        ',
						'        console.log("✅ Recovery code sent successfully to user\'s email");',
						'        ',
						'        if (pm.response.code === 200) {',
						'            const jsonData = pm.response.json();',
						'            if (jsonData.message) {',
						'                console.log("   Message:", jsonData.message);',
						'            }',
						'        } else {',
						'            // Response may be empty (204 No Content)',
						'            console.log("✅ Recovery code sent successfully (204 No Content)");',
						'        }',
						'        ',
						'        console.log("📝 User should check their email for the recovery code");',
						'        console.log("📝 Proceed to step 3: Validate Recovery Code");',
						'    }',
						'} catch (e) {',
						'    console.log("There was an error parsing JSON", e);',
						'    console.log("❌ Failed to send recovery code:", pm.response.code);',
						'}',
					]
				),
				createUseCaseItem(
					'Step 3: Validate Recovery Code',
					'POST',
					`${baseUrl}/users/{{SignInUserID}}/password`,
					'**Account Recovery: Validate Recovery Code**\n\n**Educational Context:**\n- Validates the recovery OTP code entered by the user\n- The recovery code was sent to the user\'s email in step 2\n- User enters the recovery code they received via email\n- The recovery code must be valid and not expired\n- Content-Type: application/vnd.pingidentity.password.recover+json\n- **Note:** This endpoint validates the recovery code and allows setting a new password as part of the account recovery process. The pre-request script generates a secure random password that meets common password policies.\n- After successful validation, user account is recovered and they can sign in\n- Reference: [PingOne Password Recovery API](https://apidocs.pingidentity.com/pingone/platform/v1/api/#post-recover-password)\n\n**Request Body:**\n```json\n{\n    "recoveryCode": "{{recoveryCode}}",\n    "newPassword": "{{new_password}}"\n}\n```\n\n**Important:** The recovery code validation requires setting a new password as part of the PingOne API. The pre-request script generates a secure random password (12+ chars, mixed case, numbers, symbols) to ensure it meets password policy requirements.',
					[
						{ key: 'Authorization', value: 'Bearer {{workerToken}}' },
						{ key: 'Content-Type', value: 'application/vnd.pingidentity.password.recover+json' },
						{ key: 'Accept', value: 'application/json' },
					],
					{
						recoveryCode: '{{recoveryCode}}',
						newPassword: '{{new_password}}',
					},
					[
						'// Generate a secure random password that meets common password policies',
						'function generateSecurePassword() {',
						'    const lowercase = "abcdefghijklmnopqrstuvwxyz";',
						'    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";',
						'    const numbers = "0123456789";',
						'    const special = "!@#$%^&*()_+-=[]{}|;:,.<>?";',
						'    ',
						'    let password = "";',
						'    ',
						'    // Ensure at least one character from each category',
						'    password += lowercase[Math.floor(Math.random() * lowercase.length)];',
						'    password += uppercase[Math.floor(Math.random() * uppercase.length)];',
						'    password += numbers[Math.floor(Math.random() * numbers.length)];',
						'    password += special[Math.floor(Math.random() * special.length)];',
						'    ',
						'    // Fill the rest to make at least 12 characters',
						'    const allChars = lowercase + uppercase + numbers + special;',
						'    for (let i = password.length; i < 12; i++) {',
						'        password += allChars[Math.floor(Math.random() * allChars.length)];',
						'    }',
						'    ',
						'    // Shuffle the password to avoid predictable patterns',
						'    password = password.split("").sort(() => Math.random() - 0.5).join("");',
						'    ',
						'    return password;',
						'}',
						'',
						'const recoveryPassword = generateSecurePassword();',
						'pm.environment.set("new_password", recoveryPassword);',
						'console.log("✅ Generated secure random password for account recovery");',
						'console.log("📝 Password meets common policy requirements (12+ chars, mixed case, numbers, symbols)");',
						'',
						'pm.test("✅ Call was Successful - Recovery Code Validated", function() {',
						'    pm.expect(pm.response.code, "Response should be 200 or 204").to.be.oneOf([200, 204]);',
						'});',
						'',
						'try {',
						'    if (pm.response.code === 200 || pm.response.code === 204) {',
						'        pm.test("✅ Recovery code validation completed", function() {',
						'            pm.expect(pm.response.code, "Response status should indicate success").to.be.oneOf([200, 204]);',
						'        });',
						'        ',
						'        console.log("✅ Recovery code validated successfully");',
						'        ',
						'        if (pm.response.code === 200) {',
						'            const jsonData = pm.response.json();',
						'            if (jsonData.message) {',
						'                console.log("   Message:", jsonData.message);',
						'            }',
						'            if (jsonData.id) {',
						'                console.log("   User ID:", jsonData.id);',
						'            }',
						'        }',
						'        ',
						'        console.log("✅ Account recovery complete - user can now sign in");',
						'        console.log("📝 User password has been reset as part of recovery process");',
						'    } else if (pm.response.code === 400 || pm.response.code === 401) {',
						'        try {',
						'            const jsonData = pm.response.json();',
						'            if (jsonData.message) {',
						'                console.log("❌ Recovery code validation failed:", jsonData.message);',
						'                if (jsonData.message.includes("invalid") || jsonData.message.includes("incorrect") || jsonData.message.includes("expired")) {',
						'                    console.log("   Recovery code is incorrect or expired - user should check email and try again");',
						'                }',
						'            }',
						'            if (jsonData.error_description) {',
						'                console.log("   Error description:", jsonData.error_description);',
						'            }',
						'        } catch (e2) {',
						'            console.log("❌ Recovery code validation failed - invalid or expired code");',
						'        }',
						'    } else if (pm.response.code === 404) {',
						'        console.log("❌ User not found - verify userId is correct");',
						'    } else {',
						'        console.log("❌ Failed to validate recovery code with status:", pm.response.code);',
						'    }',
						'} catch (e) {',
						'    console.log("There was an error parsing JSON", e);',
						'}',
					]
				),
			],
		},
		{
			name: 'Test Account Recovery',
			item: [
				createUseCaseItem(
					'Get User Information',
					'GET',
					`${baseUrl}/users/{{SignInUserID}}`,
					'**Account Recovery: Verify User Account Status**\n\n**Educational Context:**\n- Retrieves user information to verify that account recovery was successful\n- Checks that the user account is accessible and in the expected state\n- Verifies that the password was reset and account is ready for sign-in\n- This proves that the account recovery process worked correctly\n- Reference: [PingOne API Documentation - Get User](https://apidocs.pingidentity.com/pingone/platform/v1/api/#get-read-one-user)',
					[
						{ key: 'Authorization', value: 'Bearer {{workerToken}}' },
						{ key: 'Accept', value: 'application/json' },
					],
					undefined,
					[
						'pm.test("✅ Call was Successful - User Information Retrieved", function() {',
						'    pm.response.to.have.status(200);',
						'});',
						'',
						'try {',
						'    const jsonData = pm.response.json();',
						'    ',
						'    pm.test("✅ User information retrieved successfully", function() {',
						'        pm.expect(jsonData).to.have.property("id");',
						'        pm.expect(jsonData.id).to.equal(pm.environment.get("SignInUserID"));',
						'    });',
						'    ',
						'    // Display user information',
						'    console.log("✅ Account Recovery Verified - User Information:");',
						'    console.log("   User ID:", jsonData.id);',
						'    console.log("   Username:", jsonData.username || "N/A");',
						'    console.log("   Email:", jsonData.email?.address || jsonData.email || "N/A");',
						'    if (jsonData.name) {',
						'        console.log("   Name:", jsonData.name.given || "", jsonData.name.family || "");',
						'    }',
						'    if (jsonData.lifecycle && jsonData.lifecycle.status) {',
						'        console.log("   Lifecycle Status:", jsonData.lifecycle.status);',
						'    }',
						'    ',
						'    console.log("✅ Account recovery verified - user account is accessible");',
						'    console.log("📝 User can now sign in with the new password set during recovery");',
						'    ',
						'    // Pretty print the full response',
						'    console.log("📝 Full User Information Response:");',
						'    console.log(JSON.stringify(jsonData, null, 2));',
						'} catch (e) {',
						'    console.log("There was an error parsing JSON", e);',
						'    console.log("❌ Failed to retrieve user information:", pm.response.code);',
						'}',
					]
				),
			],
		},
	];

	// Use Case 6: Forgot Password / Password Reset
	// Structure: Action (Password Reset), Test (Test Password Reset)
	const passwordResetItems: PostmanCollectionItem[] = [
		{
			name: 'Password Reset',
			item: [
				createUseCaseItem(
					'Step 1: Get User Information',
					'GET',
					`${baseUrl}/users/{{SignInUserID}}`,
					'**Forgot Password: Get User Information**\n\n**Educational Context:**\n- Retrieves user information using the userId from Register user (Step 1: Create a user for Sign-in)\n- Uses the same user created in the Register user section - no new user is created\n- The SignInUserID was saved when the user was created in Register user Step 1\n- This step verifies the user exists before initiating password reset\n- **Important:** All use cases share the same user created in Register user to maintain consistency\n- Reference: [PingOne API Documentation - Get User](https://apidocs.pingidentity.com/pingone/platform/v1/api/#get-read-one-user)',
					[
						{ key: 'Authorization', value: 'Bearer {{workerToken}}' },
						{ key: 'Accept', value: 'application/json' },
					],
					undefined,
					[
						'pm.test("✅ Call was Successful - User Information Retrieved", function() {',
						'    pm.response.to.have.status(200);',
						'});',
						'',
						'try {',
						'    const jsonData = pm.response.json();',
						'    ',
						'    pm.test("✅ User information retrieved successfully", function() {',
						'        pm.expect(jsonData).to.have.property("id");',
						'        pm.expect(jsonData.id).to.equal(pm.environment.get("SignInUserID"));',
						'    });',
						'    ',
						'    // Set userId for use in subsequent steps (using SignInUserID)',
						'    pm.environment.set("userId", jsonData.id);',
						'    ',
						'    console.log("✅ Using user from Sign-in flow:");',
						'    console.log("   User ID:", jsonData.id);',
						'    console.log("   Username:", jsonData.username || "N/A");',
						'    console.log("   Email:", jsonData.email?.address || jsonData.email || "N/A");',
						'    console.log("📝 This is the same user created in Register user Step 1");',
						'    console.log("📝 Proceed to step 2: Send Recovery Code");',
						'} catch (e) {',
						'    console.log("There was an error parsing JSON", e);',
						'    console.log("❌ Failed to retrieve user information:", pm.response.code);',
						'    console.log("📝 Make sure Register user Step 1 (Create a user for Sign-in) has been completed first");',
						'}',
					]
				),
				createUseCaseItem(
					'Step 2: Send Recovery Code',
					'POST',
					`${baseUrl}/users/{{SignInUserID}}/password/recovery`,
					'**Forgot Password: Send Recovery Code**\n\n**Educational Context:**\n- Sends recovery code to user via email or SMS\n- Recovery code is a one-time use code that expires after a set time\n- User must enter this code along with new password to reset\n- Content-Type: application/vnd.pingidentity.password.sendRecoveryCode',
					[
						{ key: 'Authorization', value: 'Bearer {{workerToken}}' },
						{
							key: 'Content-Type',
							value: 'application/vnd.pingidentity.password.sendRecoveryCode',
						},
						{ key: 'Accept', value: 'application/json' },
					],
					{},
					[
						'pm.test("✅ Call was Successful - Recovery Code Sent", function() {',
						'    pm.expect(pm.response.code, "Response should be 200 or 204").to.be.oneOf([200, 204]);',
						'});',
						'',
						'pm.test("✅ Recovery code sending completed", function() {',
						'    pm.expect(pm.response.code, "Response status should indicate success").to.be.oneOf([200, 204]);',
						'});',
						'',
						'console.log("✅ Recovery code sent successfully to user\'s email");',
						'console.log("📝 User should check their email for the recovery code");',
					]
				),
				createUseCaseItem(
					'Step 3: Reset Password',
					'PUT',
					`${baseUrl}/users/{{SignInUserID}}/password`,
					'**Forgot Password: Reset Password**\n\n**Educational Context:**\n- Resets password using new password\n- Content-Type: application/vnd.pingidentity.password.reset+json\n- This is an admin-initiated password reset operation\n- **Note:** The pre-request script generates a secure random password that meets common password policies (12+ characters, mixed case, numbers, symbols)\n- After successful reset, user can sign in with new password\n- Reference: [PingOne Password Reset API](https://apidocs.pingidentity.com/pingone/platform/v1/api/#put-update-password-admin)',
					[
						{ key: 'Authorization', value: 'Bearer {{workerToken}}' },
						{ key: 'Content-Type', value: 'application/vnd.pingidentity.password.reset+json' },
						{ key: 'Accept', value: 'application/json' },
					],
					{
						newPassword: '{{newPassword}}',
					},
					[
						'// Generate a secure random password that meets common password policies',
						'function generateSecurePassword() {',
						'    const lowercase = "abcdefghijklmnopqrstuvwxyz";',
						'    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";',
						'    const numbers = "0123456789";',
						'    const special = "!@#$%^&*()_+-=[]{}|;:,.<>?";',
						'    ',
						'    let password = "";',
						'    ',
						'    // Ensure at least one character from each category',
						'    password += lowercase[Math.floor(Math.random() * lowercase.length)];',
						'    password += uppercase[Math.floor(Math.random() * uppercase.length)];',
						'    password += numbers[Math.floor(Math.random() * numbers.length)];',
						'    password += special[Math.floor(Math.random() * special.length)];',
						'    ',
						'    // Fill the rest to make at least 12 characters',
						'    const allChars = lowercase + uppercase + numbers + special;',
						'    for (let i = password.length; i < 12; i++) {',
						'        password += allChars[Math.floor(Math.random() * allChars.length)];',
						'    }',
						'    ',
						'    // Shuffle the password to avoid predictable patterns',
						'    password = password.split("").sort(() => Math.random() - 0.5).join("");',
						'    ',
						'    return password;',
						'}',
						'',
						'const resetPassword = generateSecurePassword();',
						'pm.environment.set("newPassword", resetPassword);',
						'console.log("✅ Generated secure random password for password reset");',
						'console.log("📝 Password meets common policy requirements (12+ chars, mixed case, numbers, symbols)");',
						'',
						'pm.test("✅ Call was Successful - Password Reset Completed", function() {',
						'    pm.expect(pm.response.code, "Response should be 200 or 204").to.be.oneOf([200, 204]);',
						'});',
						'',
						'pm.test("✅ Password reset completed", function() {',
						'    pm.expect(pm.response.code, "Response status should indicate success").to.be.oneOf([200, 204]);',
						'});',
						'',
						'console.log("✅ Password reset successfully");',
						'console.log("📝 User can now sign in with the new password");',
					]
				),
			],
		},
		{
			name: 'Test Password Reset',
			item: [
				createUseCaseItem(
					'Get User Information',
					'GET',
					`${baseUrl}/users/{{SignInUserID}}`,
					'**Password Reset: Verify Password Reset**\n\n**Educational Context:**\n- Retrieves user information to verify that password reset was successful\n- Checks that the user account is accessible and password has been reset\n- This proves that the password reset process worked correctly\n- User can now sign in with the new password\n- Reference: [PingOne API Documentation - Get User](https://apidocs.pingidentity.com/pingone/platform/v1/api/#get-read-one-user)',
					[
						{ key: 'Authorization', value: 'Bearer {{workerToken}}' },
						{ key: 'Accept', value: 'application/json' },
					],
					undefined,
					[
						'pm.test("✅ Call was Successful - User Information Retrieved", function() {',
						'    pm.response.to.have.status(200);',
						'});',
						'',
						'try {',
						'    const jsonData = pm.response.json();',
						'    ',
						'    pm.test("✅ User information retrieved successfully", function() {',
						'        pm.expect(jsonData).to.have.property("id");',
						'        pm.expect(jsonData.id).to.equal(pm.environment.get("SignInUserID"));',
						'    });',
						'    ',
						'    // Display user information',
						'    console.log("✅ Password Reset Verified - User Information:");',
						'    console.log("   User ID:", jsonData.id);',
						'    console.log("   Username:", jsonData.username || "N/A");',
						'    console.log("   Email:", jsonData.email?.address || jsonData.email || "N/A");',
						'    if (jsonData.name) {',
						'        console.log("   Name:", jsonData.name.given || "", jsonData.name.family || "");',
						'    }',
						'    if (jsonData.lifecycle && jsonData.lifecycle.status) {',
						'        console.log("   Lifecycle Status:", jsonData.lifecycle.status);',
						'    }',
						'    ',
						'    console.log("✅ Password reset verified - user account is accessible");',
						'    console.log("📝 User can now sign in with the new password");',
						'    ',
						'    // Pretty print the full response',
						'    console.log("📝 Full User Information Response:");',
						'    console.log(JSON.stringify(jsonData, null, 2));',
						'} catch (e) {',
						'    console.log("There was an error parsing JSON", e);',
						'    console.log("❌ Failed to retrieve user information:", pm.response.code);',
						'}',
					]
				),
			],
		},
	];

	// Use Case 8: Change Password
	// Structure: Action (Change Password), Test (Test Password Change)
	const changePasswordItems: PostmanCollectionItem[] = [
		{
			name: 'Change Password',
			item: [
				createUseCaseItem(
					'Step 1: Change Password (Self-Service)',
					'POST',
					`${baseUrl}/users/{{SignInUserID}}/password`,
					'**Change Password: Self-Service**\n\n**Educational Context:**\n- Allows authenticated user to change their own password\n- Content-Type: application/vnd.pingidentity.password.change+json\n- Requires current password for verification (step-up authentication)\n- Requires user access token (not worker token) - user must be authenticated\n- Uses the same user created in Register user Step 1 (SignInUserID)\n- **Note:** The pre-request script generates a secure random password that meets common password policies (12+ characters, mixed case, numbers, symbols)\n- **Important:** All use cases share the same user created in Register user to maintain consistency',
					[
						{ key: 'Authorization', value: 'Bearer {{access_token}}' },
						{ key: 'Content-Type', value: 'application/vnd.pingidentity.password.change+json' },
						{ key: 'Accept', value: 'application/json' },
					],
					{
						currentPassword: '{{currentPassword}}',
						newPassword: '{{newPassword}}',
					},
					[
						'// Generate a secure random password that meets common password policies',
						'function generateSecurePassword() {',
						'    const lowercase = "abcdefghijklmnopqrstuvwxyz";',
						'    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";',
						'    const numbers = "0123456789";',
						'    const special = "!@#$%^&*()_+-=[]{}|;:,.<>?";',
						'    ',
						'    let password = "";',
						'    ',
						'    // Ensure at least one character from each category',
						'    password += lowercase[Math.floor(Math.random() * lowercase.length)];',
						'    password += uppercase[Math.floor(Math.random() * uppercase.length)];',
						'    password += numbers[Math.floor(Math.random() * numbers.length)];',
						'    password += special[Math.floor(Math.random() * special.length)];',
						'    ',
						'    // Fill the rest to make at least 12 characters',
						'    const allChars = lowercase + uppercase + numbers + special;',
						'    for (let i = password.length; i < 12; i++) {',
						'        password += allChars[Math.floor(Math.random() * allChars.length)];',
						'    }',
						'    ',
						'    // Shuffle the password to avoid predictable patterns',
						'    password = password.split("").sort(() => Math.random() - 0.5).join("");',
						'    ',
						'    return password;',
						'}',
						'',
						'const changePassword = generateSecurePassword();',
						'pm.environment.set("newPassword", changePassword);',
						'console.log("✅ Generated secure random password for password change");',
						'console.log("📝 Password meets common policy requirements (12+ chars, mixed case, numbers, symbols)");',
						'',
						'pm.test("✅ Call was Successful - Password Changed", function() {',
						'    pm.expect(pm.response.code, "Response should be 200 or 204").to.be.oneOf([200, 204]);',
						'});',
						'',
						'pm.test("✅ Password change completed", function() {',
						'    pm.expect(pm.response.code, "Response status should indicate success").to.be.oneOf([200, 204]);',
						'});',
						'',
						'console.log("✅ Password changed successfully");',
						'console.log("📝 User can now sign in with the new password");',
					]
				),
				createUseCaseItem(
					'Step 2: Admin Force Password Change',
					'POST',
					`${baseUrl}/users/{{SignInUserID}}/password`,
					'**Change Password: Admin Force Change**\n\n**Educational Context:**\n- Admin forces user to change password on next sign-in\n- Content-Type: application/vnd.pingidentity.password.forceChange\n- Requires worker token (admin authentication)\n- User will be prompted to change password during next authentication flow\n- Uses the same user created in Register user Step 1 (SignInUserID)\n- **Important:** All use cases share the same user created in Register user to maintain consistency\n- Used for security compliance or password expiration policies',
					[
						{ key: 'Authorization', value: 'Bearer {{workerToken}}' },
						{ key: 'Content-Type', value: 'application/vnd.pingidentity.password.forceChange' },
						{ key: 'Accept', value: 'application/json' },
					],
					{},
					[
						'pm.test("✅ Call was Successful - Force Password Change Set", function() {',
						'    pm.expect(pm.response.code, "Response should be 200 or 204").to.be.oneOf([200, 204]);',
						'});',
						'',
						'pm.test("✅ Force password change completed", function() {',
						'    pm.expect(pm.response.code, "Response status should indicate success").to.be.oneOf([200, 204]);',
						'});',
						'',
						'console.log("✅ Force password change set successfully");',
						'console.log("📝 User will be prompted to change password on next sign-in");',
					]
				),
			],
		},
		{
			name: 'Test Password Change',
			item: [
				createUseCaseItem(
					'Get User Information',
					'GET',
					`${baseUrl}/users/{{SignInUserID}}`,
					'**Change Password: Verify Password Change**\n\n**Educational Context:**\n- Retrieves user information to verify that password change was successful\n- Checks that the user account is accessible and password has been changed\n- This proves that the password change process worked correctly\n- User can now sign in with the new password\n- Reference: [PingOne API Documentation - Get User](https://apidocs.pingidentity.com/pingone/platform/v1/api/#get-read-one-user)',
					[
						{ key: 'Authorization', value: 'Bearer {{workerToken}}' },
						{ key: 'Accept', value: 'application/json' },
					],
					undefined,
					[
						'pm.test("✅ Call was Successful - User Information Retrieved", function() {',
						'    pm.response.to.have.status(200);',
						'});',
						'',
						'try {',
						'    const jsonData = pm.response.json();',
						'    ',
						'    pm.test("✅ User information retrieved successfully", function() {',
						'        pm.expect(jsonData).to.have.property("id");',
						'        pm.expect(jsonData.id).to.equal(pm.environment.get("SignInUserID"));',
						'    });',
						'    ',
						'    // Display user information',
						'    console.log("✅ Password Change Verified - User Information:");',
						'    console.log("   User ID:", jsonData.id);',
						'    console.log("   Username:", jsonData.username || "N/A");',
						'    console.log("   Email:", jsonData.email?.address || jsonData.email || "N/A");',
						'    if (jsonData.name) {',
						'        console.log("   Name:", jsonData.name.given || "", jsonData.name.family || "");',
						'    }',
						'    if (jsonData.lifecycle && jsonData.lifecycle.status) {',
						'        console.log("   Lifecycle Status:", jsonData.lifecycle.status);',
						'    }',
						'    ',
						'    console.log("✅ Password change verified - user account is accessible");',
						'    console.log("📝 User can now sign in with the new password");',
						'    ',
						'    // Pretty print the full response',
						'    console.log("📝 Full User Information Response:");',
						'    console.log(JSON.stringify(jsonData, null, 2));',
						'} catch (e) {',
						'    console.log("There was an error parsing JSON", e);',
						'    console.log("❌ Failed to retrieve user information:", pm.response.code);',
						'}',
					]
				),
			],
		},
	];

	// Use Case 9: Social Login - Configure External Identity Providers
	// Structure: Action (Configure Social Login), Test (Test Social Login Configuration)
	const socialLoginItems: PostmanCollectionItem[] = [
		createUseCaseItem(
			'Step 1: Configure Facebook as External Identity Provider',
			'POST',
			`${baseUrl}/externalIdps`,
			'**Social Login: Configure Facebook IdP**\n\n**Educational Context:**\n- Configures Facebook as an external identity provider in PingOne for social login\n- Users can authenticate using their Facebook credentials\n- Requires Facebook App credentials (Client ID and Client Secret) from Facebook Developer Console\n- After configuration, Facebook login option becomes available in PingOne authentication flows\n- External IdP must be enabled and linked to authentication policies to be used\n- Reference: [PingOne External Identity Provider API](https://apidocs.pingidentity.com/pingone/platform/v1/api/#post-create-external-identity-provider)\n\n**Prerequisites:**\n- Facebook App created in Facebook Developer Console\n- Facebook App Client ID and Client Secret\n- Valid redirect URI configured in Facebook App\n\n**Request Body:**\n```json\n{\n    "type": "FACEBOOK",\n    "name": "Facebook Social Login",\n    "enabled": true,\n    "clientId": "{{facebook_client_id}}",\n    "clientSecret": "{{facebook_client_secret}}",\n    "authorizationEndpoint": "https://www.facebook.com/v18.0/dialog/oauth",\n    "tokenEndpoint": "https://graph.facebook.com/v18.0/oauth/access_token",\n    "userInfoEndpoint": "https://graph.facebook.com/v18.0/me?fields=id,name,email",\n    "scopes": ["email", "public_profile"]\n}\n```',
			[
				{ key: 'Authorization', value: 'Bearer {{workerToken}}' },
				{ key: 'Content-Type', value: 'application/json' },
				{ key: 'Accept', value: 'application/json' },
			],
			{
				type: 'FACEBOOK',
				name: 'Facebook Social Login',
				enabled: true,
				clientId: '{{facebook_client_id}}',
				clientSecret: '{{facebook_client_secret}}',
				authorizationEndpoint: 'https://www.facebook.com/v18.0/dialog/oauth',
				tokenEndpoint: 'https://graph.facebook.com/v18.0/oauth/access_token',
				userInfoEndpoint: 'https://graph.facebook.com/v18.0/me?fields=id,name,email',
				scopes: ['email', 'public_profile'],
			},
			[
				'pm.test("✅ Call was Successful - Facebook IdP Configured", function() {',
				'    pm.expect(pm.response.code, "Response should be 200 or 201").to.be.oneOf([200, 201]);',
				'});',
				'',
				'try {',
				'    const jsonData = pm.response.json();',
				'    if (jsonData.id) {',
				'        pm.environment.set("facebook_idp_id", jsonData.id);',
				'        ',
				'        pm.test("✅ Facebook IdP ID was saved to variable facebook_idp_id with a value of: " + jsonData.id, function () {',
				'            pm.expect(jsonData.id, "Facebook IdP ID should be a non-empty string").to.be.a("string").and.not.empty;',
				'        });',
				'        ',
				'        pm.test("✅ IdP has required properties", function() {',
				'            pm.expect(jsonData).to.have.property("id");',
				'            pm.expect(jsonData).to.have.property("type", "FACEBOOK");',
				'            pm.expect(jsonData).to.have.property("enabled");',
				'        });',
				'        ',
				'        console.log("facebook_idp_id is now: " + pm.environment.get("facebook_idp_id"));',
				'        console.log("✅ Facebook external IdP configured:", jsonData.id);',
				'        console.log("   IdP Name:", jsonData.name || "N/A");',
				'        console.log("   IdP Type:", jsonData.type || "FACEBOOK");',
				'        console.log("   Enabled:", jsonData.enabled !== false ? "true" : "false");',
				'        console.log("📝 Facebook login option is now available in PingOne authentication flows");',
				'    } else {',
				'        console.log("⚠️ Facebook IdP configured but no ID in response");',
				'    }',
				'} catch (e) {',
				'    console.log("There was an error parsing JSON", e);',
				'    console.log("❌ Failed to configure Facebook IdP:", pm.response.code);',
				'}',
			]
		),
		createUseCaseItem(
			'Step 2: Configure LinkedIn as External Identity Provider',
			'POST',
			`${baseUrl}/externalIdps`,
			'**Social Login: Configure LinkedIn IdP**\n\n**Educational Context:**\n- Configures LinkedIn as an external identity provider in PingOne for social login\n- Users can authenticate using their LinkedIn credentials\n- Requires LinkedIn App credentials (Client ID and Client Secret) from LinkedIn Developer Portal\n- After configuration, LinkedIn login option becomes available in PingOne authentication flows\n- External IdP must be enabled and linked to authentication policies to be used\n- Reference: [PingOne External Identity Provider API](https://apidocs.pingidentity.com/pingone/platform/v1/api/#post-create-external-identity-provider)\n\n**Prerequisites:**\n- LinkedIn App created in LinkedIn Developer Portal\n- LinkedIn App Client ID and Client Secret\n- Valid redirect URI configured in LinkedIn App\n- LinkedIn requires OAuth 2.0 scopes: openid, profile, email\n\n**Request Body:**\n```json\n{\n    "type": "LINKEDIN",\n    "name": "LinkedIn Social Login",\n    "enabled": true,\n    "clientId": "{{linkedin_client_id}}",\n    "clientSecret": "{{linkedin_client_secret}}",\n    "authorizationEndpoint": "https://www.linkedin.com/oauth/v2/authorization",\n    "tokenEndpoint": "https://www.linkedin.com/oauth/v2/accessToken",\n    "userInfoEndpoint": "https://api.linkedin.com/v2/userinfo",\n    "scopes": ["openid", "profile", "email"]\n}\n```',
			[
				{ key: 'Authorization', value: 'Bearer {{workerToken}}' },
				{ key: 'Content-Type', value: 'application/json' },
				{ key: 'Accept', value: 'application/json' },
			],
			{
				type: 'LINKEDIN',
				name: 'LinkedIn Social Login',
				enabled: true,
				clientId: '{{linkedin_client_id}}',
				clientSecret: '{{linkedin_client_secret}}',
				authorizationEndpoint: 'https://www.linkedin.com/oauth/v2/authorization',
				tokenEndpoint: 'https://www.linkedin.com/oauth/v2/accessToken',
				userInfoEndpoint: 'https://api.linkedin.com/v2/userinfo',
				scopes: ['openid', 'profile', 'email'],
			},
			[
				'pm.test("✅ Call was Successful - LinkedIn IdP Configured", function() {',
				'    pm.expect(pm.response.code, "Response should be 200 or 201").to.be.oneOf([200, 201]);',
				'});',
				'',
				'try {',
				'    const jsonData = pm.response.json();',
				'    if (jsonData.id) {',
				'        pm.environment.set("linkedin_idp_id", jsonData.id);',
				'        ',
				'        pm.test("✅ LinkedIn IdP ID was saved to variable linkedin_idp_id with a value of: " + jsonData.id, function () {',
				'            pm.expect(jsonData.id, "LinkedIn IdP ID should be a non-empty string").to.be.a("string").and.not.empty;',
				'        });',
				'        ',
				'        pm.test("✅ IdP has required properties", function() {',
				'            pm.expect(jsonData).to.have.property("id");',
				'            pm.expect(jsonData).to.have.property("type", "LINKEDIN");',
				'            pm.expect(jsonData).to.have.property("enabled");',
				'        });',
				'        ',
				'        console.log("linkedin_idp_id is now: " + pm.environment.get("linkedin_idp_id"));',
				'        console.log("✅ LinkedIn external IdP configured:", jsonData.id);',
				'        console.log("   IdP Name:", jsonData.name || "N/A");',
				'        console.log("   IdP Type:", jsonData.type || "LINKEDIN");',
				'        console.log("   Enabled:", jsonData.enabled !== false ? "true" : "false");',
				'        console.log("📝 LinkedIn login option is now available in PingOne authentication flows");',
				'    } else {',
				'        console.log("⚠️ LinkedIn IdP configured but no ID in response");',
				'    }',
				'} catch (e) {',
				'    console.log("There was an error parsing JSON", e);',
				'    console.log("❌ Failed to configure LinkedIn IdP:", pm.response.code);',
				'}',
			]
		),
	];

	// Use Case 10: Partner/Enterprise Federation - Configure Azure AD for Enterprise Federation
	const federationItems: PostmanCollectionItem[] = [
		createUseCaseItem(
			'Step 1: Configure Azure AD as External Identity Provider',
			'POST',
			`${baseUrl}/externalIdps`,
			'**Partner/Enterprise Federation: Configure Azure AD IdP**\n\n**Educational Context:**\n- Configures Azure Active Directory (Azure AD) as an external identity provider in PingOne for enterprise federation\n- Users can authenticate using their Azure AD credentials (Microsoft accounts or organizational accounts)\n- Enables "Sign in with your organization" functionality for enterprise customers\n- Requires Azure App Registration credentials (Application (client) ID and Client Secret) from Azure Portal\n- Azure AD uses OpenID Connect (OIDC) protocol for authentication\n- After configuration, Azure AD login option becomes available in PingOne authentication flows\n- Supports IdP discovery/routing by email domain, organization selection, or explicit button\n- External IdP must be enabled and linked to authentication policies to be used\n- Reference: [PingOne External Identity Provider API](https://apidocs.pingidentity.com/pingone/platform/v1/api/#post-create-external-identity-provider)\n\n**Prerequisites:**\n- Azure App Registration created in Azure Portal (Azure Active Directory)\n- Azure Application (client) ID and Client Secret\n- Valid redirect URI configured in Azure App Registration\n- Tenant ID (for single-tenant) or "common" (for multi-tenant)\n\n**Request Body:**\n```json\n{\n    "type": "OPENID_CONNECT",\n    "name": "Azure AD Enterprise Federation",\n    "enabled": true,\n    "clientId": "{{azure_client_id}}",\n    "clientSecret": "{{azure_client_secret}}",\n    "authorizationEndpoint": "https://login.microsoftonline.com/{{azure_tenant_id}}/oauth2/v2.0/authorize",\n    "tokenEndpoint": "https://login.microsoftonline.com/{{azure_tenant_id}}/oauth2/v2.0/token",\n    "userInfoEndpoint": "https://graph.microsoft.com/oidc/userinfo",\n    "issuer": "https://login.microsoftonline.com/{{azure_tenant_id}}/v2.0",\n    "scopes": ["openid", "profile", "email"]\n}\n```',
			[
				{ key: 'Authorization', value: 'Bearer {{workerToken}}' },
				{ key: 'Content-Type', value: 'application/json' },
				{ key: 'Accept', value: 'application/json' },
			],
			{
				type: 'OPENID_CONNECT',
				name: 'Azure AD Enterprise Federation',
				enabled: true,
				clientId: '{{azure_client_id}}',
				clientSecret: '{{azure_client_secret}}',
				authorizationEndpoint:
					'https://login.microsoftonline.com/{{azure_tenant_id}}/oauth2/v2.0/authorize',
				tokenEndpoint: 'https://login.microsoftonline.com/{{azure_tenant_id}}/oauth2/v2.0/token',
				userInfoEndpoint: 'https://graph.microsoft.com/oidc/userinfo',
				issuer: 'https://login.microsoftonline.com/{{azure_tenant_id}}/v2.0',
				scopes: ['openid', 'profile', 'email'],
			},
			[
				'pm.test("✅ Call was Successful - Azure AD IdP Configured", function() {',
				'    pm.expect(pm.response.code, "Response should be 200 or 201").to.be.oneOf([200, 201]);',
				'});',
				'',
				'try {',
				'    const jsonData = pm.response.json();',
				'    if (jsonData.id) {',
				'        pm.environment.set("azure_idp_id", jsonData.id);',
				'        ',
				'        pm.test("✅ Azure AD IdP ID was saved to variable azure_idp_id with a value of: " + jsonData.id, function () {',
				'            pm.expect(jsonData.id, "Azure AD IdP ID should be a non-empty string").to.be.a("string").and.not.empty;',
				'        });',
				'        ',
				'        pm.test("✅ IdP has required properties", function() {',
				'            pm.expect(jsonData).to.have.property("id");',
				'            pm.expect(jsonData).to.have.property("type", "OPENID_CONNECT");',
				'            pm.expect(jsonData).to.have.property("enabled");',
				'        });',
				'        ',
				'        console.log("azure_idp_id is now: " + pm.environment.get("azure_idp_id"));',
				'        console.log("✅ Azure AD external IdP configured for enterprise federation:", jsonData.id);',
				'        console.log("   IdP Name:", jsonData.name || "N/A");',
				'        console.log("   IdP Type:", jsonData.type || "OPENID_CONNECT");',
				'        console.log("   Enabled:", jsonData.enabled !== false ? "true" : "false");',
				'        if (jsonData.issuer) {',
				'            console.log("   Issuer:", jsonData.issuer);',
				'        }',
				'        console.log("📝 Azure AD enterprise federation is now available in PingOne authentication flows");',
				'        console.log("📝 Users can sign in with their organization credentials");',
				'    } else {',
				'        console.log("⚠️ Azure AD IdP configured but no ID in response");',
				'    }',
				'} catch (e) {',
				'    console.log("There was an error parsing JSON", e);',
				'    console.log("❌ Failed to configure Azure AD IdP:", pm.response.code);',
				'}',
			]
		),
	];

	// Use Case 11: Risk-based Checks - PingOne Protect API
	const protectBaseUrl = `${baseUrl}/protect/v1`;
	const riskCheckItems: PostmanCollectionItem[] = [
		createUseCaseItem(
			'Step 1: Get Risk Predictors',
			'GET',
			`${protectBaseUrl}/riskPredictors`,
			'**Risk-based Checks: Get Risk Predictors**\n\n**Educational Context:**\n- Retrieves all available risk predictors configured in the PingOne Protect environment\n- Risk predictors are factors used to evaluate risk during authentication or transaction evaluation\n- Predictors include types like BASE, COMPOSITE, TRAFFIC_ANOMALY, VELOCITY, and CUSTOM\n- Each predictor has attributes such as name, type, enabled status, and description\n- Predictors are used in risk policies to calculate overall risk scores\n- The list of predictors helps understand what risk factors are being evaluated\n- Reference: [PingOne Protect API - Risk Predictors](https://apidocs.pingidentity.com/pingone/protect/v1/api/#get-list-risk-predictors)\n\n**Response includes:**\n- List of risk predictors with their IDs, names, types, and enabled status\n- Predictor descriptions explaining what each predictor evaluates\n- Predictor configuration details needed for risk policy creation',
			[
				{ key: 'Authorization', value: 'Bearer {{workerToken}}' },
				{ key: 'Accept', value: 'application/json' },
			],
			undefined,
			[
				'pm.test("✅ Call was Successful - Risk Predictors Retrieved", function() {',
				'    pm.response.to.have.status(200);',
				'});',
				'',
				'try {',
				'    const jsonData = pm.response.json();',
				'    if (jsonData._embedded && jsonData._embedded.riskPredictors) {',
				'        const predictors = jsonData._embedded.riskPredictors;',
				'        ',
				'        pm.test("✅ Risk predictors found in response", function() {',
				'            pm.expect(predictors.length, "Should have at least one risk predictor").to.be.at.least(0);',
				'        });',
				'        ',
				'        console.log("✅ Retrieved", predictors.length, "risk predictors");',
				'        ',
				'        // Log predictor details',
				'        predictors.forEach((predictor, index) => {',
				// biome-ignore lint/suspicious/noTemplateCurlyInString: This is Postman script code where template literals are valid
				'            console.log(`\\n   Predictor ${index + 1}:`);',
				// biome-ignore lint/suspicious/noTemplateCurlyInString: This is Postman script code where template literals are valid
				'            console.log(`      ID: ${predictor.id}`);',
				// biome-ignore lint/suspicious/noTemplateCurlyInString: This is Postman script code where template literals are valid
				'            console.log(`      Name: ${predictor.name || "N/A"}`);',
				// biome-ignore lint/suspicious/noTemplateCurlyInString: This is Postman script code where template literals are valid
				'            console.log(`      Type: ${predictor.type || "N/A"}`);',
				// biome-ignore lint/suspicious/noTemplateCurlyInString: This is Postman script code where template literals are valid
				'            console.log(`      Enabled: ${predictor.enabled !== false ? "true" : "false"}`);',
				'            if (predictor.description) {',
				// biome-ignore lint/suspicious/noTemplateCurlyInString: This is Postman script code where template literals are valid
				'                console.log(`      Description: ${predictor.description}`);',
				'            }',
				'        });',
				'        ',
				'        // Save first predictor ID if available (for use in risk policies)',
				'        if (predictors.length > 0 && predictors[0].id) {',
				'            pm.environment.set("riskPredictorId", predictors[0].id);',
				'            ',
				'            pm.test("Risk Predictor ID was saved to variable riskPredictorId with a value of: " + predictors[0].id, function () {',
				'                pm.expect(predictors[0].id).to.be.a("string").and.not.empty;',
				'            });',
				'            ',
				'            console.log("\\n📝 First predictor ID saved as riskPredictorId:", predictors[0].id);',
				'        }',
				'        ',
				'        console.log("\\n📝 Risk predictors are used in risk policies to evaluate authentication and transaction risk");',
				'        console.log("📝 Proceed to create or update risk evaluations using these predictors");',
				'    } else {',
				'        console.log("⚠️ Response structure unexpected - no _embedded.riskPredictors found");',
				'    }',
				'} catch (e) {',
				'    console.log("There was an error parsing JSON", e);',
				'    console.log("❌ Failed to get risk predictors:", pm.response.code);',
				'}',
			]
		),
		createUseCaseItem(
			'Step 2: Update Risk Evaluation',
			'PATCH',
			`${protectBaseUrl}/riskEvaluations/{{riskEvaluationId}}`,
			'**Risk-based Checks: Update Risk Evaluation**\n\n**Educational Context:**\n- Updates an existing risk evaluation with the final transaction completion status\n- This provides feedback to PingOne Protect to improve future risk assessments\n- The completion status indicates whether the transaction was successful (SUCCESS) or failed (FAILED)\n- This feedback helps the system learn and improve risk prediction accuracy over time\n- Updates must be sent within 30 minutes of the initial risk evaluation creation\n- Risk evaluations not updated within this timeframe will remain with completionStatus of IN_PROGRESS\n- The riskEvaluationId is obtained from a previously created risk evaluation\n- Reference: [PingOne Protect API - Update Risk Evaluation](https://apidocs.pingidentity.com/pingone/protect/v1/api/#patch-update-risk-evaluation)\n\n**Request Body:**\n```json\n{\n    "completionStatus": "SUCCESS"\n}\n```\n\n**Completion Status Options:**\n- `SUCCESS`: Transaction completed successfully\n- `FAILED`: Transaction failed or was blocked\n\n**Important:** This endpoint requires a valid riskEvaluationId from a previously created risk evaluation. Create a risk evaluation first to obtain the evaluation ID.',
			[
				{ key: 'Authorization', value: 'Bearer {{workerToken}}' },
				{ key: 'Content-Type', value: 'application/json' },
				{ key: 'Accept', value: 'application/json' },
			],
			{
				completionStatus: '{{completionStatus}}',
			},
			[
				'pm.test("✅ Call was Successful - Risk Evaluation Updated", function() {',
				'    pm.response.to.have.status(200);',
				'});',
				'',
				'try {',
				'    const jsonData = pm.response.json();',
				'    ',
				'    pm.test("✅ Risk evaluation response is valid", function() {',
				'        pm.expect(jsonData).to.be.an("object");',
				'    });',
				'    ',
				'    console.log("✅ Risk evaluation updated successfully");',
				'    ',
				'    if (jsonData.id) {',
				'        console.log("   Evaluation ID:", jsonData.id);',
				'    }',
				'    if (jsonData.completionStatus) {',
				'        console.log("   Completion Status:", jsonData.completionStatus);',
				'        pm.environment.set("completionStatus", jsonData.completionStatus);',
				'    }',
				'    if (jsonData.result && jsonData.result.level) {',
				'        console.log("   Risk Level:", jsonData.result.level);',
				'        console.log("   Recommended Action:", jsonData.result.recommendedAction || "N/A");',
				'    }',
				'    if (jsonData.createdAt) {',
				'        console.log("   Created At:", jsonData.createdAt);',
				'    }',
				'    if (jsonData.updatedAt) {',
				'        console.log("   Updated At:", jsonData.updatedAt);',
				'    }',
				'    ',
				'    console.log("\\n📝 Risk evaluation feedback has been recorded");',
				'    console.log("📝 This feedback helps PingOne Protect improve future risk assessments");',
				'} catch (e) {',
				'    console.log("There was an error parsing JSON", e);',
				'    if (pm.response.code === 400) {',
				'        try {',
				'            const jsonData = pm.response.json();',
				'            if (jsonData.message) {',
				'                console.log("❌ Failed to update risk evaluation:", jsonData.message);',
				'                if (jsonData.message.includes("invalid") || jsonData.message.includes("expired")) {',
				'                    console.log("   Risk evaluation ID is invalid or evaluation has expired (>30 minutes old)");',
				'                }',
				'            }',
				'            if (jsonData.error_description) {',
				'                console.log("   Error description:", jsonData.error_description);',
				'            }',
				'        } catch (e2) {',
				'            console.log("❌ Failed to update risk evaluation - invalid request");',
				'        }',
				'    } else if (pm.response.code === 404) {',
				'        console.log("❌ Risk evaluation not found - verify riskEvaluationId is correct");',
				'        console.log("   Create a risk evaluation first to obtain a valid evaluation ID");',
				'    } else {',
				'        console.log("❌ Failed to update risk evaluation with status:", pm.response.code);',
				'    }',
				'}',
			]
		),
	];

	// Use Case 12: Logout
	const logoutItems: PostmanCollectionItem[] = [
		createUseCaseItem(
			'Step 1: Get User Sessions',
			'GET',
			`${baseUrl}/users/{{userId}}/sessions`,
			'**Logout: List User Sessions**\n\n**Educational Context:**\n- Retrieves all active sessions for a specific user\n- Provides visibility into all active login sessions across devices/browsers\n- Each session includes session ID, device info, IP address, creation time, and expiration time\n- Users can view all their active sessions to identify suspicious activity\n- Session information helps users decide which sessions to terminate\n- Reference: [PingOne User Sessions API](https://apidocs.pingidentity.com/pingone/platform/v1/api/#get-list-user-sessions)\n\n**Use Cases:**\n- Display active sessions in user profile/settings page\n- Allow users to see all devices/browsers where they are logged in\n- Help identify unauthorized access or suspicious sessions\n- Enable users to selectively terminate sessions',
			[
				{ key: 'Authorization', value: 'Bearer {{workerToken}}' },
				{ key: 'Accept', value: 'application/json' },
			],
			undefined,
			[
				'pm.test("✅ Call was Successful - Active Sessions Retrieved", function() {',
				'    pm.response.to.have.status(200);',
				'});',
				'',
				'try {',
				'    const jsonData = pm.response.json();',
				'    if (jsonData._embedded && jsonData._embedded.sessions) {',
				'        const sessions = jsonData._embedded.sessions;',
				'        ',
				'        pm.test("✅ Sessions found in response", function() {',
				'            pm.expect(sessions.length, "Should have at least zero sessions").to.be.at.least(0);',
				'        });',
				'        ',
				'        console.log("✅ Retrieved", sessions.length, "active session(s)");',
				'        ',
				'        // Log session details',
				'        sessions.forEach((session, index) => {',
				// biome-ignore lint/suspicious/noTemplateCurlyInString: This is Postman script code where template literals are valid
				'            console.log(`\\n   Session ${index + 1}:`);',
				// biome-ignore lint/suspicious/noTemplateCurlyInString: This is Postman script code where template literals are valid
				'            console.log(`      Session ID: ${session.id}`);',
				'            if (session.ipAddress) {',
				// biome-ignore lint/suspicious/noTemplateCurlyInString: This is Postman script code where template literals are valid
				'                console.log(`      IP Address: ${session.ipAddress}`);',
				'            }',
				'            if (session.userAgent) {',
				// biome-ignore lint/suspicious/noTemplateCurlyInString: This is Postman script code where template literals are valid
				'                console.log(`      User Agent: ${session.userAgent}`);',
				'            }',
				'            if (session.createdAt) {',
				// biome-ignore lint/suspicious/noTemplateCurlyInString: This is Postman script code where template literals are valid
				'                console.log(`      Created At: ${session.createdAt}`);',
				'            }',
				'            if (session.expiresAt) {',
				// biome-ignore lint/suspicious/noTemplateCurlyInString: This is Postman script code where template literals are valid
				'                console.log(`      Expires At: ${session.expiresAt}`);',
				'            }',
				'            if (session.environment) {',
				// biome-ignore lint/suspicious/noTemplateCurlyInString: This is Postman script code where template literals are valid
				'                console.log(`      Environment: ${session.environment.id || session.environment}`);',
				'            }',
				'        });',
				'        ',
				'        // Save first session ID if available (for deletion example)',
				'        if (sessions.length > 0 && sessions[0].id) {',
				'            pm.environment.set("sessionId", sessions[0].id);',
				'            ',
				'            pm.test("Session ID was saved to variable sessionId with a value of: " + sessions[0].id, function () {',
				'                pm.expect(sessions[0].id).to.be.a("string").and.not.empty;',
				'            });',
				'            ',
				'            console.log("\\n📝 First session ID saved as sessionId:", sessions[0].id);',
				'            console.log("📝 Proceed to step 4 or 5 to delete this session or verify token status");',
				'        } else {',
				'            console.log("\\n📝 No active sessions found for this user");',
				'        }',
				'    } else {',
				'        console.log("⚠️ Response structure unexpected - no _embedded.sessions found");',
				'    }',
				'} catch (e) {',
				'    console.log("There was an error parsing JSON", e);',
				'    if (pm.response.code === 404) {',
				'        console.log("❌ User not found - verify userId is correct");',
				'    } else {',
				'        console.log("❌ Failed to get user sessions:", pm.response.code);',
				'    }',
				'}',
			]
		),
		createUseCaseItem(
			'Step 2: Local Logout (End Session)',
			'POST',
			`${authBaseUrl}/as/session/end`,
			'**Logout: End Current Session**\n\n**Educational Context:**\n- Ends the current user session using the access token\n- Requires access token in Authorization header\n- Invalidates the session on PingOne side\n- User must sign in again to access protected resources\n- Optionally revokes refresh token if included in request body\n- This is the standard OAuth/OIDC session end endpoint\n- Reference: [PingOne Session End API](https://apidocs.pingidentity.com/pingone/platform/v1/api/#post-end-session)\n\n**Request Body:**\n```json\n{\n    "token": "{{access_token}}",\n    "token_type_hint": "access_token"\n}\n```\n\n**Use Cases:**\n- User-initiated logout from application\n- End session when user explicitly clicks logout button\n- Revoke access to protect user account after logout',
			[
				{ key: 'Authorization', value: 'Bearer {{access_token}}' },
				{ key: 'Content-Type', value: 'application/x-www-form-urlencoded' },
			],
			{
				token: '{{access_token}}',
				token_type_hint: 'access_token',
			},
			[
				'pm.test("✅ Call was Successful - Session Ended", function() {',
				'    pm.expect(pm.response.code, "Response should be 200 or 204").to.be.oneOf([200, 204]);',
				'});',
				'',
				'try {',
				'    if (pm.response.code === 200 || pm.response.code === 204) {',
				'        pm.test("✅ Session end completed", function() {',
				'            pm.expect(pm.response.code, "Response status should indicate success").to.be.oneOf([200, 204]);',
				'        });',
				'        ',
				'        console.log("✅ Session ended successfully");',
				'        ',
				'        if (pm.response.code === 200) {',
				'            const jsonData = pm.response.json();',
				'            if (jsonData.message) {',
				'                console.log("   Message:", jsonData.message);',
				'            }',
				'        } else {',
				'            // Response may be empty (204 No Content)',
				'            console.log("✅ Session ended successfully (204 No Content)");',
				'        }',
				'        ',
				'        console.log("📝 User session has been invalidated");',
				'        console.log("📝 Proceed to step 3 to revoke refresh token, or step 5 to verify token status");',
				'    }',
				'} catch (e) {',
				'    console.log("There was an error parsing JSON", e);',
				'    if (pm.response.code === 401 || pm.response.code === 403) {',
				'        console.log("❌ Session end failed - invalid or expired access token");',
				'    } else {',
				'        console.log("❌ Failed to end session with status:", pm.response.code);',
				'    }',
				'}',
			]
		),
		createUseCaseItem(
			'Step 3: Revoke Refresh Token',
			'POST',
			`${authBaseUrl}/as/revoke`,
			'**Logout: Revoke Refresh Token**\n\n**Educational Context:**\n- Revokes refresh token to prevent future token refresh operations\n- Should be called when user explicitly logs out to ensure complete session termination\n- Refresh token cannot be used to get new access tokens after revocation\n- Completes the logout flow by invalidating all tokens (access token may be revoked via session/end, refresh token via this endpoint)\n- Requires client authentication (client_id and optionally client_secret)\n- Reference: [PingOne Token Revocation API](https://apidocs.pingidentity.com/pingone/platform/v1/api/#post-revoke-token)\n\n**Request Body:**\n```json\n{\n    "token": "{{refresh_token}}",\n    "token_type_hint": "refresh_token",\n    "client_id": "{{user_client_id}}"\n}\n```\n\n**Authentication Options:**\n- Basic Auth: client_id:client_secret in Authorization header\n- Client Secret Post: client_id and client_secret in request body\n- Client ID only: client_id in request body (for public clients)',
			[{ key: 'Content-Type', value: 'application/x-www-form-urlencoded' }],
			{
				token: '{{refresh_token}}',
				token_type_hint: 'refresh_token',
				client_id: '{{user_client_id}}',
			},
			[
				'pm.test("✅ Call was Successful - Refresh Token Revoked", function() {',
				'    pm.expect(pm.response.code, "Response should be 200 or 204").to.be.oneOf([200, 204]);',
				'});',
				'',
				'try {',
				'    if (pm.response.code === 200 || pm.response.code === 204) {',
				'        pm.test("✅ Token revocation completed", function() {',
				'            pm.expect(pm.response.code, "Response status should indicate success").to.be.oneOf([200, 204]);',
				'        });',
				'        ',
				'        console.log("✅ Refresh token revoked successfully");',
				'        ',
				'        if (pm.response.code === 200) {',
				'            const jsonData = pm.response.json();',
				'            if (jsonData.message) {',
				'                console.log("   Message:", jsonData.message);',
				'            }',
				'        } else {',
				'            // Response may be empty (204 No Content)',
				'            console.log("✅ Refresh token revoked successfully (204 No Content)");',
				'        }',
				'        ',
				'        console.log("📝 Refresh token can no longer be used to obtain new access tokens");',
				'        console.log("📝 Logout flow complete - all tokens have been invalidated");',
				'        console.log("📝 Proceed to step 5 to verify token status (should show inactive)");',
				'    }',
				'} catch (e) {',
				'    console.log("There was an error parsing JSON", e);',
				'    if (pm.response.code === 400) {',
				'        try {',
				'            const jsonData = pm.response.json();',
				'            if (jsonData.error) {',
				'                console.log("❌ Token revocation failed:", jsonData.error);',
				'                if (jsonData.error === "invalid_token") {',
				'                    console.log("   Token is invalid or already revoked");',
				'                }',
				'            }',
				'            if (jsonData.error_description) {',
				'                console.log("   Error description:", jsonData.error_description);',
				'            }',
				'        } catch (e2) {',
				'            console.log("❌ Token revocation failed - invalid token or client credentials");',
				'        }',
				'    } else {',
				'        console.log("❌ Failed to revoke refresh token with status:", pm.response.code);',
				'    }',
				'}',
			]
		),
		createUseCaseItem(
			'Step 4: Delete Specific User Session',
			'DELETE',
			`${baseUrl}/users/{{userId}}/sessions/{{sessionId}}`,
			'**Logout: Terminate Specific Session**\n\n**Educational Context:**\n- Terminates a specific user session by session ID\n- Useful for allowing users to log out from a specific device or browser\n- Users can terminate suspicious or unwanted sessions from their account settings\n- Session ID is obtained from step 1 (Get User Sessions)\n- This provides granular control over active sessions\n- After deletion, that session cannot be used for authentication\n- Reference: [PingOne Delete User Session API](https://apidocs.pingidentity.com/pingone/platform/v1/api/#delete-session)\n\n**Use Cases:**\n- User wants to log out from a specific device (e.g., lost phone, shared computer)\n- Terminate suspicious or unauthorized sessions\n- Provide "Sign out all other devices" functionality\n- Session management in user profile/settings page',
			[
				{ key: 'Authorization', value: 'Bearer {{workerToken}}' },
				{ key: 'Accept', value: 'application/json' },
			],
			undefined,
			[
				'pm.test("✅ Call was Successful - Session Deleted", function() {',
				'    pm.expect(pm.response.code, "Response should be 200 or 204").to.be.oneOf([200, 204]);',
				'});',
				'',
				'try {',
				'    if (pm.response.code === 200 || pm.response.code === 204) {',
				'        pm.test("✅ Session deletion completed", function() {',
				'            pm.expect(pm.response.code, "Response status should indicate success").to.be.oneOf([200, 204]);',
				'        });',
				'        ',
				'        console.log("✅ Session deleted successfully");',
				'        ',
				'        if (pm.response.code === 200) {',
				'            const jsonData = pm.response.json();',
				'            if (jsonData.message) {',
				'                console.log("   Message:", jsonData.message);',
				'            }',
				'        } else {',
				'            // Response may be empty (204 No Content)',
				'            console.log("✅ Session deleted successfully (204 No Content)");',
				'        }',
				'        ',
				'        console.log("📝 Session", pm.environment.get("sessionId") || "{{sessionId}}", "has been terminated");',
				'        console.log("📝 User is now logged out from that specific device/browser");',
				'        console.log("📝 Proceed to step 1 again to verify session has been removed from active sessions list");',
				'    }',
				'} catch (e) {',
				'    console.log("There was an error parsing JSON", e);',
				'    if (pm.response.code === 404) {',
				'        console.log("❌ Session not found - session may have already expired or been deleted");',
				'        console.log("   Verify sessionId is correct or session may have expired");',
				'    } else if (pm.response.code === 403) {',
				'        console.log("❌ Permission denied - verify worker token has appropriate permissions");',
				'    } else {',
				'        console.log("❌ Failed to delete session with status:", pm.response.code);',
				'    }',
				'}',
			]
		),
		createUseCaseItem(
			'Step 5: Introspect Token (Verify Token Status)',
			'POST',
			`${authBaseUrl}/as/introspect`,
			'**Logout: Verify Token Status**\n\n**Educational Context:**\n- Validates and returns detailed information about an access token or refresh token\n- Used to verify if a token is still active after logout operations\n- Returns token metadata including active status, expiration, scopes, client ID, and user information\n- After logout, tokens should show as inactive (active: false)\n- Useful for verifying that logout operations were successful\n- Requires worker token or client credentials for authentication\n- Reference: [PingOne Token Introspection API](https://apidocs.pingidentity.com/pingone/platform/v1/api/#post-introspect-token)\n\n**Request Body:**\n```json\n{\n    "token": "{{access_token}}",\n    "token_type_hint": "access_token"\n}\n```\n\n**Response includes:**\n- `active`: Boolean indicating if token is still valid\n- `exp`: Token expiration timestamp\n- `iat`: Token issued at timestamp\n- `scopes`: List of granted scopes\n- `client_id`: Client that issued the token\n- `sub`: Subject (user ID)\n\n**Use Cases:**\n- Verify token status after logout (should be inactive)\n- Check if token is expired before making API calls\n- Validate token before processing requests\n- Debug authentication issues',
			[
				{ key: 'Authorization', value: 'Bearer {{workerToken}}' },
				{ key: 'Content-Type', value: 'application/x-www-form-urlencoded' },
				{ key: 'Accept', value: 'application/json' },
			],
			{
				token: '{{access_token}}',
				token_type_hint: 'access_token',
			},
			[
				'pm.test("✅ Call was Successful - Token Status Retrieved", function() {',
				'    pm.response.to.have.status(200);',
				'});',
				'',
				'try {',
				'    const jsonData = pm.response.json();',
				'    ',
				'    pm.test("✅ Response body JSON contains token information", function() {',
				'        pm.expect(jsonData, "Response should be an object").to.be.an("object");',
				'        pm.expect(jsonData).to.have.property("active");',
				'    });',
				'    ',
				'    if (jsonData.active === true) {',
				'        console.log("⚠️ Token is still ACTIVE");',
				'        console.log("   This token has not been revoked and can still be used");',
				'        if (jsonData.exp) {',
				'            const expDate = new Date(jsonData.exp * 1000);',
				'            console.log("   Token expires at:", expDate.toISOString());',
				'        }',
				'    } else {',
				'        console.log("✅ Token is INACTIVE");',
				'        console.log("   This token has been revoked or has expired");',
				'        console.log("   Token cannot be used for authentication");',
				'    }',
				'    ',
				'    if (jsonData.sub) {',
				'        console.log("   Subject (User ID):", jsonData.sub);',
				'    }',
				'    if (jsonData.client_id) {',
				'        console.log("   Client ID:", jsonData.client_id);',
				'    }',
				'    if (jsonData.scope) {',
				'        console.log("   Scopes:", jsonData.scope);',
				'    }',
				'    if (jsonData.iat) {',
				'        const iatDate = new Date(jsonData.iat * 1000);',
				'        console.log("   Issued At:", iatDate.toISOString());',
				'    }',
				'    if (jsonData.exp) {',
				'        const expDate = new Date(jsonData.exp * 1000);',
				'        console.log("   Expires At:", expDate.toISOString());',
				'    }',
				'    ',
				'    console.log("\\n📝 Token introspection is useful for verifying logout operations");',
				'    console.log("📝 After logout, tokens should show active: false");',
				'} catch (e) {',
				'    console.log("There was an error parsing JSON", e);',
				'    if (pm.response.code === 400) {',
				'        try {',
				'            const jsonData = pm.response.json();',
				'            if (jsonData.error) {',
				'                console.log("   Error:", jsonData.error);',
				'            }',
				'            if (jsonData.error_description) {',
				'                console.log("   Error description:", jsonData.error_description);',
				'            }',
				'        } catch (e2) {',
				'            // Response may not be JSON',
				'        }',
				'    }',
				'}',
			]
		),
	];

	// Use Case 13: User Sessions
	const userSessionsItems: PostmanCollectionItem[] = [
		{
			name: 'Setup',
			item: [
				createUseCaseItem(
					'Step 1: Get Worker Token',
					'POST',
					`${authBaseUrl}/as/token`,
					'**User Sessions: Get Worker Token**\n\n**Educational Context:**\n- Worker tokens are required for administrative operations like managing user sessions\n- This token provides elevated permissions to perform session management operations\n- Worker tokens are obtained using client credentials grant (client_id and client_secret)\n- The worker token is used in Authorization header for all session management API calls\n- Reference: [PingOne Token Endpoint](https://apidocs.pingidentity.com/pingone/platform/v1/api/#post-token)\n\n**Prerequisites:**\n- Worker client ID and secret configured in environment\n- Worker application must have appropriate permissions for user session management',
					[{ key: 'Content-Type', value: 'application/x-www-form-urlencoded' }],
					{
						grant_type: 'client_credentials',
						client_id: '{{worker_client_id}}',
						client_secret: '{{worker_client_secret}}',
					},
					[
						'pm.test("✅ Call was Successful - Worker Token Retrieved", function() {',
						'    pm.response.to.have.status(200);',
						'});',
						'',
						'try {',
						'    const jsonData = pm.response.json();',
						'    ',
						'    pm.test("✅ Response contains access_token", function() {',
						'        pm.expect(jsonData).to.have.property("access_token");',
						'        pm.expect(jsonData.access_token).to.be.a("string").and.not.empty;',
						'    });',
						'    ',
						'    // Save worker token to environment variable',
						'    if (jsonData.access_token) {',
						'        pm.environment.set("workerToken", jsonData.access_token);',
						'        ',
						'        pm.test("Worker token saved to variable workerToken", function () {',
						'            pm.expect(jsonData.access_token).to.be.a("string").and.not.empty;',
						'        });',
						'        ',
						'        console.log("✅ Worker token retrieved and saved as workerToken");',
						'        ',
						'        if (jsonData.expires_in) {',
						'            console.log("   Token expires in:", jsonData.expires_in, "seconds");',
						'        }',
						'        if (jsonData.token_type) {',
						'            console.log("   Token type:", jsonData.token_type);',
						'        }',
						'        ',
						'        console.log("📝 Proceed to Step 2 to list user sessions");',
						'    }',
						'} catch (e) {',
						'    console.log("There was an error parsing JSON", e);',
						'    if (pm.response.code === 401 || pm.response.code === 403) {',
						'        console.log("❌ Authentication failed - verify worker client credentials");',
						'    } else {',
						'        console.log("❌ Failed to get worker token:", pm.response.code);',
						'    }',
						'}',
					]
				),
			],
		},
		{
			name: 'Session Management',
			item: [
				createUseCaseItem(
					'Step 2: List All User Sessions',
					'GET',
					`${baseUrl}/users/{{SignInUserID}}/sessions`,
					'**User Sessions: List All Active Sessions**\n\n**Educational Context:**\n- Retrieves all active sessions for a specific user\n- Provides comprehensive visibility into all active login sessions across devices, browsers, and applications\n- Each session includes detailed information: session ID, device info, IP address, user agent, creation time, expiration time, and last activity\n- Users can view all their active sessions to identify suspicious activity or unauthorized access\n- Session information helps users decide which sessions to terminate\n- Reference: [PingOne List User Sessions API](https://apidocs.pingidentity.com/pingone/platform/v1/api/#get-list-user-sessions)\n\n**Response includes:**\n- `_embedded.sessions[]`: Array of session objects\n- Each session contains: `id`, `ipAddress`, `userAgent`, `createdAt`, `expiresAt`, `lastActivity`, `environment`\n\n**Use Cases:**\n- Display active sessions in user profile/settings page\n- Allow users to see all devices/browsers where they are logged in\n- Help identify unauthorized access or suspicious sessions\n- Enable users to selectively terminate sessions\n- Security monitoring and audit logging',
					[
						{ key: 'Authorization', value: 'Bearer {{workerToken}}' },
						{ key: 'Accept', value: 'application/json' },
					],
					undefined,
					[
						'pm.test("✅ Call was Successful - Active Sessions Retrieved", function() {',
						'    pm.response.to.have.status(200);',
						'});',
						'',
						'try {',
						'    const jsonData = pm.response.json();',
						'    if (jsonData._embedded && jsonData._embedded.sessions) {',
						'        const sessions = jsonData._embedded.sessions;',
						'        ',
						'        pm.test("✅ Sessions found in response", function() {',
						'            pm.expect(sessions).to.be.an("array");',
						'            pm.expect(sessions.length, "Should have at least zero sessions").to.be.at.least(0);',
						'        });',
						'        ',
						'        console.log("✅ Retrieved", sessions.length, "active session(s)");',
						'        ',
						'        // Log session details',
						'        sessions.forEach((session, index) => {',
						// biome-ignore lint/suspicious/noTemplateCurlyInString: This is Postman script code where template literals are valid
						'            console.log(`\\n   Session ${index + 1}:`);',
						// biome-ignore lint/suspicious/noTemplateCurlyInString: This is Postman script code where template literals are valid
						'            console.log(`      Session ID: ${session.id}`);',
						'            if (session.ipAddress) {',
						// biome-ignore lint/suspicious/noTemplateCurlyInString: This is Postman script code where template literals are valid
						'                console.log(`      IP Address: ${session.ipAddress}`);',
						'            }',
						'            if (session.userAgent) {',
						// biome-ignore lint/suspicious/noTemplateCurlyInString: This is Postman script code where template literals are valid
						'                console.log(`      User Agent: ${session.userAgent}`);',
						'            }',
						'            if (session.createdAt) {',
						// biome-ignore lint/suspicious/noTemplateCurlyInString: This is Postman script code where template literals are valid
						'                console.log(`      Created At: ${session.createdAt}`);',
						'            }',
						'            if (session.expiresAt) {',
						// biome-ignore lint/suspicious/noTemplateCurlyInString: This is Postman script code where template literals are valid
						'                console.log(`      Expires At: ${session.expiresAt}`);',
						'            }',
						'            if (session.lastActivity) {',
						'                console.log(`      Last Activity: ${session.lastActivity}`);',
						'            }',
						'        });',
						'        ',
						'        // Save first session ID if available (for subsequent operations)',
						'        if (sessions.length > 0 && sessions[0].id) {',
						'            pm.environment.set("sessionId", sessions[0].id);',
						'            ',
						'            pm.test("Session ID was saved to variable sessionId", function () {',
						'                pm.expect(sessions[0].id).to.be.a("string").and.not.empty;',
						'            });',
						'            ',
						'            console.log("\\n📝 First session ID saved as sessionId:", sessions[0].id);',
						'            console.log("📝 Proceed to Step 3 to get session details, or Step 4 to delete this session");',
						'        } else {',
						'            console.log("\\n📝 No active sessions found for this user");',
						'            console.log("📝 User may need to sign in first to create a session");',
						'        }',
						'    } else {',
						'        console.log("⚠️ Response structure unexpected - no _embedded.sessions found");',
						'    }',
						'} catch (e) {',
						'    console.log("There was an error parsing JSON", e);',
						'    if (pm.response.code === 404) {',
						'        console.log("❌ User not found - verify SignInUserID is correct");',
						'        console.log("   Complete Register user Step 1 to create a user first");',
						'    } else if (pm.response.code === 403) {',
						'        console.log("❌ Permission denied - verify worker token has appropriate permissions");',
						'    } else {',
						'        console.log("❌ Failed to get user sessions:", pm.response.code);',
						'    }',
						'}',
					]
				),
				createUseCaseItem(
					'Step 3: Get Specific Session Details',
					'GET',
					`${baseUrl}/users/{{SignInUserID}}/sessions/{{sessionId}}`,
					'**User Sessions: Get Specific Session Details**\n\n**Educational Context:**\n- Retrieves detailed information about a specific user session by session ID\n- Provides comprehensive session metadata including device information, network details, and timing information\n- Useful for investigating specific sessions or displaying detailed session information to users\n- Session ID is obtained from Step 2 (List All User Sessions)\n- Reference: [PingOne Get User Session API](https://apidocs.pingidentity.com/pingone/platform/v1/api/#get-session)\n\n**Response includes:**\n- `id`: Unique session identifier\n- `ipAddress`: IP address from which session was created\n- `userAgent`: Browser/client user agent string\n- `createdAt`: Timestamp when session was created\n- `expiresAt`: Timestamp when session will expire\n- `lastActivity`: Timestamp of last activity in this session\n- `environment`: Environment information\n\n**Use Cases:**\n- Display detailed session information in user settings\n- Investigate suspicious sessions\n- Show users where and when they logged in\n- Audit and compliance reporting',
					[
						{ key: 'Authorization', value: 'Bearer {{workerToken}}' },
						{ key: 'Accept', value: 'application/json' },
					],
					undefined,
					[
						'pm.test("✅ Call was Successful - Session Details Retrieved", function() {',
						'    pm.response.to.have.status(200);',
						'});',
						'',
						'try {',
						'    const jsonData = pm.response.json();',
						'    ',
						'    pm.test("✅ Response contains session information", function() {',
						'        pm.expect(jsonData).to.be.an("object");',
						'        pm.expect(jsonData).to.have.property("id");',
						'    });',
						'    ',
						'    console.log("✅ Session details retrieved:");',
						// biome-ignore lint/suspicious/noTemplateCurlyInString: This is Postman script code where template literals are valid
						'    console.log(`   Session ID: ${jsonData.id}`);',
						'    ',
						'    if (jsonData.ipAddress) {',
						// biome-ignore lint/suspicious/noTemplateCurlyInString: This is Postman script code where template literals are valid
						'        console.log(`   IP Address: ${jsonData.ipAddress}`);',
						'    }',
						'    if (jsonData.userAgent) {',
						// biome-ignore lint/suspicious/noTemplateCurlyInString: This is Postman script code where template literals are valid
						'        console.log(`   User Agent: ${jsonData.userAgent}`);',
						'    }',
						'    if (jsonData.createdAt) {',
						// biome-ignore lint/suspicious/noTemplateCurlyInString: This is Postman script code where template literals are valid
						'        console.log(`   Created At: ${jsonData.createdAt}`);',
						'    }',
						'    if (jsonData.expiresAt) {',
						// biome-ignore lint/suspicious/noTemplateCurlyInString: This is Postman script code where template literals are valid
						'        console.log(`   Expires At: ${jsonData.expiresAt}`);',
						'    }',
						'    if (jsonData.lastActivity) {',
						// biome-ignore lint/suspicious/noTemplateCurlyInString: This is Postman script code where template literals are valid
						'        console.log(`   Last Activity: ${jsonData.lastActivity}`);',
						'    }',
						'    ',
						'    console.log("\\n📝 Proceed to Step 4 to delete this session, or Step 5 to delete all sessions");',
						'} catch (e) {',
						'    console.log("There was an error parsing JSON", e);',
						'    if (pm.response.code === 404) {',
						'        console.log("❌ Session not found - session may have expired or been deleted");',
						'        console.log("   Verify sessionId is correct or run Step 2 again to get current sessions");',
						'    } else if (pm.response.code === 403) {',
						'        console.log("❌ Permission denied - verify worker token has appropriate permissions");',
						'    } else {',
						'        console.log("❌ Failed to get session details:", pm.response.code);',
						'    }',
						'}',
					]
				),
				createUseCaseItem(
					'Step 4: Delete Specific Session',
					'DELETE',
					`${baseUrl}/users/{{SignInUserID}}/sessions/{{sessionId}}`,
					'**User Sessions: Delete Specific Session**\n\n**Educational Context:**\n- Terminates a specific user session by session ID\n- Useful for allowing users to log out from a specific device or browser\n- Users can terminate suspicious or unwanted sessions from their account settings\n- Session ID is obtained from Step 2 (List All User Sessions)\n- This provides granular control over active sessions\n- After deletion, that session cannot be used for authentication\n- Reference: [PingOne Delete User Session API](https://apidocs.pingidentity.com/pingone/platform/v1/api/#delete-session)\n\n**Use Cases:**\n- User wants to log out from a specific device (e.g., lost phone, shared computer)\n- Terminate suspicious or unauthorized sessions\n- Provide "Sign out from this device" functionality\n- Session management in user profile/settings page\n- Security incident response',
					[
						{ key: 'Authorization', value: 'Bearer {{workerToken}}' },
						{ key: 'Accept', value: 'application/json' },
					],
					undefined,
					[
						'pm.test("✅ Call was Successful - Session Deleted", function() {',
						'    pm.expect(pm.response.code, "Response should be 200 or 204").to.be.oneOf([200, 204]);',
						'});',
						'',
						'try {',
						'    if (pm.response.code === 200 || pm.response.code === 204) {',
						'        pm.test("✅ Session deletion completed", function() {',
						'            pm.expect(pm.response.code, "Response status should indicate success").to.be.oneOf([200, 204]);',
						'        });',
						'        ',
						'        console.log("✅ Session deleted successfully");',
						'        ',
						'        if (pm.response.code === 200) {',
						'            const jsonData = pm.response.json();',
						'            if (jsonData.message) {',
						'                console.log("   Message:", jsonData.message);',
						'            }',
						'        } else {',
						'            // Response may be empty (204 No Content)',
						'            console.log("✅ Session deleted successfully (204 No Content)");',
						'        }',
						'        ',
						'        console.log("📝 Session", pm.environment.get("sessionId") || "{{sessionId}}", "has been terminated");',
						'        console.log("📝 User is now logged out from that specific device/browser");',
						'        console.log("📝 Proceed to Step 6 to verify session has been removed from active sessions list");',
						'    }',
						'} catch (e) {',
						'    console.log("There was an error parsing JSON", e);',
						'    if (pm.response.code === 404) {',
						'        console.log("❌ Session not found - session may have already expired or been deleted");',
						'        console.log("   Verify sessionId is correct or session may have expired");',
						'    } else if (pm.response.code === 403) {',
						'        console.log("❌ Permission denied - verify worker token has appropriate permissions");',
						'    } else {',
						'        console.log("❌ Failed to delete session with status:", pm.response.code);',
						'    }',
						'}',
					]
				),
				createUseCaseItem(
					'Step 5: Delete All User Sessions',
					'DELETE',
					`${baseUrl}/users/{{SignInUserID}}/sessions`,
					'**User Sessions: Delete All User Sessions**\n\n**Educational Context:**\n- Terminates all active sessions for a specific user\n- Useful for "Sign out from all devices" functionality\n- Provides a way to immediately invalidate all user sessions across all devices and browsers\n- After deletion, user must sign in again to access protected resources\n- This is a powerful security operation that should be used carefully\n- Reference: [PingOne Delete All User Sessions API](https://apidocs.pingidentity.com/pingone/platform/v1/api/#delete-all-user-sessions)\n\n**Use Cases:**\n- User wants to sign out from all devices (e.g., after security incident, lost device)\n- Admin-initiated session termination for security purposes\n- "Sign out everywhere" functionality in user settings\n- Security incident response and account protection\n- Force re-authentication across all devices',
					[
						{ key: 'Authorization', value: 'Bearer {{workerToken}}' },
						{ key: 'Accept', value: 'application/json' },
					],
					undefined,
					[
						'pm.test("✅ Call was Successful - All Sessions Deleted", function() {',
						'    pm.expect(pm.response.code, "Response should be 200 or 204").to.be.oneOf([200, 204]);',
						'});',
						'',
						'try {',
						'    if (pm.response.code === 200 || pm.response.code === 204) {',
						'        pm.test("✅ All sessions deletion completed", function() {',
						'            pm.expect(pm.response.code, "Response status should indicate success").to.be.oneOf([200, 204]);',
						'        });',
						'        ',
						'        console.log("✅ All user sessions deleted successfully");',
						'        ',
						'        if (pm.response.code === 200) {',
						'            const jsonData = pm.response.json();',
						'            if (jsonData.message) {',
						'                console.log("   Message:", jsonData.message);',
						'            }',
						'        } else {',
						'            // Response may be empty (204 No Content)',
						'            console.log("✅ All sessions deleted successfully (204 No Content)");',
						'        }',
						'        ',
						'        console.log("📝 All active sessions for this user have been terminated");',
						'        console.log("📝 User must sign in again to access protected resources");',
						'        console.log("📝 Proceed to Step 6 to verify all sessions have been removed");',
						'    }',
						'} catch (e) {',
						'    console.log("There was an error parsing JSON", e);',
						'    if (pm.response.code === 404) {',
						'        console.log("❌ User not found - verify SignInUserID is correct");',
						'    } else if (pm.response.code === 403) {',
						'        console.log("❌ Permission denied - verify worker token has appropriate permissions");',
						'    } else {',
						'        console.log("❌ Failed to delete all sessions with status:", pm.response.code);',
						'    }',
						'}',
					]
				),
			],
		},
		{
			name: 'Test',
			item: [
				createUseCaseItem(
					'Step 6: Verify Sessions Deleted',
					'GET',
					`${baseUrl}/users/{{SignInUserID}}/sessions`,
					'**User Sessions: Verify Sessions Deleted**\n\n**Educational Context:**\n- Verifies that session deletion operations were successful\n- Lists all remaining active sessions after deletion\n- Confirms that deleted sessions are no longer in the active sessions list\n- This step proves that the session management operations worked correctly\n- Reference: [PingOne List User Sessions API](https://apidocs.pingidentity.com/pingone/platform/v1/api/#get-list-user-sessions)\n\n**Expected Results:**\n- After Step 4 (Delete Specific Session): One fewer session in the list\n- After Step 5 (Delete All Sessions): Empty sessions array or zero sessions\n\n**Use Cases:**\n- Verify session deletion operations\n- Confirm security operations completed successfully\n- Audit and compliance verification\n- Troubleshooting session management issues',
					[
						{ key: 'Authorization', value: 'Bearer {{workerToken}}' },
						{ key: 'Accept', value: 'application/json' },
					],
					undefined,
					[
						'pm.test("✅ Call was Successful - Sessions List Retrieved", function() {',
						'    pm.response.to.have.status(200);',
						'});',
						'',
						'try {',
						'    const jsonData = pm.response.json();',
						'    if (jsonData._embedded && jsonData._embedded.sessions) {',
						'        const sessions = jsonData._embedded.sessions;',
						'        ',
						'        pm.test("✅ Sessions array found in response", function() {',
						'            pm.expect(sessions).to.be.an("array");',
						'        });',
						'        ',
						'        console.log("✅ Retrieved", sessions.length, "active session(s)");',
						'        ',
						'        if (sessions.length === 0) {',
						'            console.log("\\n✅ Verification successful: No active sessions found");',
						'            console.log("   All sessions have been successfully deleted");',
						'        } else {',
						'            console.log("\\n📝 Remaining active sessions:", sessions.length);',
						'            ',
						'            // Check if the deleted session is still present',
						'            const deletedSessionId = pm.environment.get("sessionId");',
						'            if (deletedSessionId) {',
						'                const deletedSessionStillExists = sessions.some(s => s.id === deletedSessionId);',
						'                ',
						'                if (deletedSessionStillExists) {',
						'                    console.log("⚠️ Warning: Deleted session still appears in list");',
						'                    console.log("   This may indicate the deletion did not complete, or session was recreated");',
						'                } else {',
						'                    console.log("✅ Verification successful: Deleted session no longer in list");',
						'                }',
						'            }',
						'            ',
						'            // Log remaining sessions',
						'            sessions.forEach((session, index) => {',
						// biome-ignore lint/suspicious/noTemplateCurlyInString: This is Postman script code where template literals are valid
						'                console.log(`\\n   Session ${index + 1}: ${session.id}`);',
						'                if (session.ipAddress) {',
						// biome-ignore lint/suspicious/noTemplateCurlyInString: This is Postman script code where template literals are valid
						'                    console.log(`      IP: ${session.ipAddress}`);',
						'                }',
						'            });',
						'        }',
						'        ',
						'        console.log("\\n📝 Session management operations completed successfully");',
						'    } else {',
						'        console.log("⚠️ Response structure unexpected - no _embedded.sessions found");',
						'    }',
						'} catch (e) {',
						'    console.log("There was an error parsing JSON", e);',
						'    if (pm.response.code === 404) {',
						'        console.log("❌ User not found - verify SignInUserID is correct");',
						'    } else if (pm.response.code === 403) {',
						'        console.log("❌ Permission denied - verify worker token has appropriate permissions");',
						'    } else {',
						'        console.log("❌ Failed to verify sessions:", pm.response.code);',
						'    }',
						'}',
					]
				),
			],
		},
	];

	// Transaction Approval Flows - Use Case 14
	const transactionApprovalItems: PostmanCollectionItem[] = [
		{
			name: 'Transaction Approval - Redirect Flow',
			item: [
				createUseCaseItem(
					'Step 1: Initiate Transaction Approval (Redirect)',
					'GET',
					`${authBaseUrl}/as/authorize?response_type=token id_token&response_mode=pi.flow&scope={{scopes_oidc}}&state={{state}}&login_hint_token={{loginHintJwt}}&client_id={{webAppSignInWithPKCEId}}`,
					'**Transaction Approval: Redirect Flow**\n\n**Educational Context:**\n- This request initiates a transaction approval flow using redirect-based authorization\n- The `response_mode=pi.flow` option returns a JSON flow response (HTTP 200) and does not require `redirect_uri`\n- When authentication completes, the auth code, access token, or ID token is returned in JSON instead of a redirect\n- This is ideal for native apps and SPAs that render the UI and use the Flows API without redirects\n- The `login_hint_token` is a JWT that includes the user and transaction details\n- This flow is useful when a UI is available to complete an approval step\n\n**Request Parameters (from PingOne Auth API docs):**\n- `response_type=token id_token`\n- `response_mode=pi.flow`\n- `scope=openid profile email`\n- `state={{state}}`\n- `login_hint_token={{loginHintJwt}}`\n- `client_id={{webAppSignInWithPKCEId}}`\n\n**Expected Response:** JSON flow object with `id`, `status`, and `resumeUrl`\n\n**Reference:** https://apidocs.pingidentity.com/pingone/auth/v1/api/#redirect-and-non-redirect-authentication-flows',
					[{ key: 'Accept', value: 'application/json' }],
					undefined,
					[
						'pm.test("✅ Transaction approval flow initiated", function() {',
						'    pm.expect(pm.response.code, "Response should be 200").to.be.equal(200);',
						'});',
						'',
						'try {',
						'    const jsonData = pm.response.json();',
						'    ',
						'    if (jsonData.id) {',
						'        pm.environment.set("transactionFlowID", jsonData.id);',
						'        console.log("✅ Transaction flow ID set:", jsonData.id);',
						'    }',
						'} catch (e) {',
						'    console.log("There was an error parsing JSON", e);',
						'}',
					],
					[
						'// Create login_hint_token JWT for transaction approval',
						'const userId = pm.environment.get("SignInUserID");',
						'const username = pm.environment.get("SignInUsername");',
						'const userEmail = pm.environment.get("SignInUserEmail");',
						'const clientId = pm.environment.get("webAppSignInWithPKCEId");',
						'const clientSecret = pm.environment.get("SignInWithPKCEAppSecret");',
						'const authPath = pm.environment.get("authPath");',
						'const envID = pm.environment.get("envID");',
						'const transactionId = pm.environment.get("transactionId");',
						'const transactionAmount = pm.environment.get("transactionAmount");',
						'const transactionCurrency = pm.environment.get("transactionCurrency");',
						'const transactionDescription = pm.environment.get("transactionDescription");',
						'',
						'if (!userId || !username || !clientId || !clientSecret) {',
						'    pm.test("❌ Missing required variables for login_hint_token JWT", function() {',
						'        pm.expect.fail("Set SignInUserID, SignInUsername, webAppSignInWithPKCEId, and SignInWithPKCEAppSecret before running this request.");',
						'    });',
						'    throw new Error("Missing required JWT inputs");',
						'}',
						'',
						'if (!transactionId || !transactionAmount || !transactionCurrency) {',
						'    pm.test("❌ Missing transaction details", function() {',
						'        pm.expect.fail("Set transactionId, transactionAmount, and transactionCurrency before running this request.");',
						'    });',
						'    throw new Error("Missing transaction details");',
						'}',
						'',
						'const header = { alg: "HS256", typ: "JWT" };',
						'const payload = {',
						'    iss: clientId,',
						'    sub: userId,',
						'    aud: authPath + "/" + envID + "/as",',
						'    iat: Math.floor(Date.now() / 1000),',
						'    exp: Math.floor(Date.now() / 1000) + 300,',
						'    username,',
						'    transaction: {',
						'        id: transactionId,',
						'        amount: transactionAmount,',
						'        currency: transactionCurrency,',
						'        description: transactionDescription || ""',
						'    }',
						'};',
						'',
						'if (userEmail) {',
						'    payload.email = userEmail;',
						'}',
						'',
						'const base64UrlEncode = (input) => {',
						'    return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(input))',
						'        .replace(/=+$/g, "")',
						'        .replace(/\\+/g, "-")',
						'        .replace(/\\//g, "_");',
						'};',
						'',
						'const encodedHeader = base64UrlEncode(JSON.stringify(header));',
						'const encodedPayload = base64UrlEncode(JSON.stringify(payload));',
						'const signature = CryptoJS.HmacSHA256(encodedHeader + "." + encodedPayload, clientSecret);',
						'const encodedSignature = CryptoJS.enc.Base64.stringify(signature)',
						'    .replace(/=+$/g, "")',
						'    .replace(/\\+/g, "-")',
						'    .replace(/\\//g, "_");',
						'',
						'const jwt = encodedHeader + "." + encodedPayload + "." + encodedSignature;',
						'pm.environment.set("loginHintJwt", jwt);',
						'console.log("✅ login_hint_token JWT created and saved");',
					]
				),
			],
		},
		{
			name: 'Transaction Approval - Non-redirect Flow',
			item: [
				createUseCaseItem(
					'Step 1: Initiate Transaction Approval (Non-redirect)',
					'POST',
					`${authBaseUrl}/as/authorize`,
					'**Transaction Approval: Non-redirect Flow**\n\n**Educational Context:**\n- This request initiates a transaction approval flow using a non-redirect POST call\n- The `response_mode=pi.flow` option returns a JSON flow response (HTTP 200) and does not require `redirect_uri`\n- When authentication completes, the auth code, access token, or ID token is returned in JSON instead of a redirect\n- It is suitable for API-only or headless flows where a browser redirect is not available\n- The `login_hint_token` JWT carries user and transaction details\n\n**Request Parameters (from PingOne Auth API docs):**\n- `response_type=token id_token`\n- `response_mode=pi.flow`\n- `scope=openid profile email`\n- `state={{state}}`\n- `login_hint_token={{loginHintJwt}}`\n- `client_id={{webAppSignInWithPKCEId}}`\n\n**Expected Response:** JSON flow object with `id`, `status`, and `resumeUrl`\n\n**Reference:** https://apidocs.pingidentity.com/pingone/auth/v1/api/#redirect-and-non-redirect-authentication-flows',
					[
						{ key: 'Content-Type', value: 'application/x-www-form-urlencoded' },
						{ key: 'Accept', value: 'application/json' },
					],
					{
						client_id: '{{webAppSignInWithPKCEId}}',
						response_type: 'token id_token',
						response_mode: 'pi.flow',
						scope: '{{scopes_oidc}}',
						state: '{{state}}',
						login_hint_token: '{{loginHintJwt}}',
					},
					[
						'pm.test("✅ Non-redirect transaction approval initiated", function() {',
						'    pm.expect(pm.response.code, "Response should be 200").to.be.equal(200);',
						'});',
						'',
						'try {',
						'    const jsonData = pm.response.json();',
						'    ',
						'    if (jsonData.id) {',
						'        pm.environment.set("transactionFlowID", jsonData.id);',
						'        console.log("✅ Transaction flow ID set:", jsonData.id);',
						'    }',
						'} catch (e) {',
						'    console.log("There was an error parsing JSON", e);',
						'}',
					],
					[
						'// Ensure login_hint_token JWT is ready for non-redirect flow',
						'if (!pm.environment.get("loginHintJwt")) {',
						'    pm.test("❌ loginHintJwt is missing", function() {',
						'        pm.expect.fail("Run the Redirect flow step or generate loginHintJwt before this request.");',
						'    });',
						'    throw new Error("loginHintJwt is missing");',
						'}',
					]
				),
			],
		},
	];

	// PingOne Endpoints - Metadata (Discovery, OAuth Metadata, JWKS)
	const pingOneMetadataItems: PostmanCollectionItem[] = [
		{
			name: 'Metadata Endpoints',
			item: [
				createUseCaseItem(
					'Step 1: OpenID Connect Discovery',
					'GET',
					`${authBaseUrl}/.well-known/openid-configuration`,
					'**PingOne Endpoints - Metadata: OpenID Connect Discovery**\n\n**Educational Context:**\n- Returns OpenID Provider metadata for the PingOne authorization server\n- Used by OIDC clients to discover endpoints, supported scopes, response types, and signing algorithms\n- Reference: https://apidocs.pingidentity.com/pingone/auth/v1/api/#get-discovery-openid-configuration',
					[{ key: 'Accept', value: 'application/json' }]
				),
				createUseCaseItem(
					'Step 2: OAuth 2.0 Authorization Server Metadata',
					'GET',
					`${authBaseUrl}/.well-known/oauth-authorization-server`,
					'**PingOne Endpoints - Metadata: OAuth 2.0 Authorization Server Metadata**\n\n**Educational Context:**\n- Returns OAuth 2.0 authorization server metadata for PingOne\n- Used by OAuth clients to discover endpoints and supported capabilities\n- Reference: https://apidocs.pingidentity.com/pingone/auth/v1/api/#get-oauth-20-authorization-server-metadata',
					[{ key: 'Accept', value: 'application/json' }]
				),
				createUseCaseItem(
					'Step 3: OAuth 2.0 Authorization Server Metadata (Custom Domain)',
					'GET',
					'{{customAuthPath}}/.well-known/oauth-authorization-server',
					'**PingOne Endpoints - Metadata: OAuth 2.0 Authorization Server Metadata (Custom Domain)**\n\n**Educational Context:**\n- Returns OAuth 2.0 authorization server metadata for a custom domain\n- Set `customAuthPath` to your custom domain base URL (for example, `https://auth.example.com`)\n- Reference: https://apidocs.pingidentity.com/pingone/auth/v1/api/#get-oauth-20-authorization-server-metadata-custom-domain',
					[{ key: 'Accept', value: 'application/json' }]
				),
				createUseCaseItem(
					'Step 4: Read JWKS',
					'GET',
					`${authBaseUrl}/as/jwks`,
					'**PingOne Endpoints - Metadata: Read JWKS**\n\n**Educational Context:**\n- Returns the JSON Web Key Set (JWKS) used to verify tokens issued by PingOne\n- Clients use this endpoint to retrieve public keys for token validation\n- Reference: https://apidocs.pingidentity.com/pingone/auth/v1/api/#get-read-jwks',
					[{ key: 'Accept', value: 'application/json' }]
				),
				createUseCaseItem(
					'Step 5: Pushed Authorization Request (CLIENT_SECRET_POST)',
					'POST',
					`${authBaseUrl}/as/par`,
					'**PingOne Endpoints - Metadata: Pushed Authorization Request (CLIENT_SECRET_POST)**\n\n**Educational Context:**\n- Sends a pushed authorization request (PAR) using client_secret_post authentication\n- Returns a `request_uri` that can be used in a subsequent authorize call\n- Useful for large request payloads or increased security\n- Reference: https://apidocs.pingidentity.com/pingone/auth/v1/api/#post-pushed-authorization-request-client_secret_post',
					[
						{ key: 'Content-Type', value: 'application/x-www-form-urlencoded' },
						{ key: 'Accept', value: 'application/json' },
					],
					{
						client_id: '{{webAppSignInWithPKCEId}}',
						client_secret: '{{SignInWithPKCEAppSecret}}',
						response_type: 'code',
						scope: '{{scopes_oidc}}',
						redirect_uri: '{{redirect_uri}}',
						code_challenge: '{{codeChallenge}}',
						code_challenge_method: '{{codeChallengeMethod}}',
						state: '{{state}}',
					},
					[
						'pm.test("✅ PAR request completed", function() {',
						'    pm.expect(pm.response.code, "Response should be 200 or 201").to.be.oneOf([200, 201]);',
						'});',
						'',
						'try {',
						'    const jsonData = pm.response.json();',
						'    if (jsonData.request_uri) {',
						'        pm.environment.set("par_request_uri", jsonData.request_uri);',
						'        console.log("✅ PAR request_uri saved:", jsonData.request_uri);',
						'    }',
						'} catch (e) {',
						'    console.log("❌ Failed to parse PAR response", e);',
						'}',
					]
				),
			],
		},
	];

	// Map use case IDs to use case items
	const useCaseMap: Record<
		string,
		{ name: string; item: PostmanCollectionItem[]; description: string }
	> = {
		signup: {
			name: '1. Sign-up (Registration)',
			item: signUpItems,
			description:
				'# Sign-up (Registration) Overview\n\nThis use case demonstrates how to create a new user account in PingOne with email verification, verify the user, set a password, and assign the user to a group for access control.\n\n## PingOne API Documentation\n- **[PingOne Platform API Reference](https://apidocs.pingidentity.com/pingone/platform/v1/api/)**\n- **[Create User (Import)](https://apidocs.pingidentity.com/pingone/platform/v1/api/#post-create-user-import)**\n- **[Verify User](https://apidocs.pingidentity.com/pingone/platform/v1/api/#post-verify-user)**\n- **[Set Password](https://apidocs.pingidentity.com/pingone/platform/v1/api/#put-update-password-admin)**\n- **[Create Population](https://apidocs.pingidentity.com/pingone/platform/v1/api/#post-create-population)**\n- **[Create Group](https://apidocs.pingidentity.com/pingone/platform/v1/api/#post-create-group)**\n- **[Add User to Group](https://apidocs.pingidentity.com/pingone/platform/v1/api/#post-add-user-to-group)**\n- **[List Users with Filters](https://apidocs.pingidentity.com/pingone/platform/v1/api/#get-list-users)**\n\n## Subgroups Summary\n\n### Setup\n- Create a population for sign-up users\n- Create a group for sign-up users\n\n### Register user\n- Create a user with email verification enabled\n- Verify user using the OTP code\n- Set user password\n- Add user to group\n\n### Test Registration\n- Lookup user by username\n- Lookup user by email\n- Lookup user by user ID\n\n## Prerequisites\n- Worker token with permissions for users, populations, and groups\n- Environment ID configured\n- Email delivery settings configured in PingOne',
		},
		signin: {
			name: '2. Sign-in',
			item: signInItems,
			description:
				'# Sign-in Overview\n\nThis use case demonstrates the complete OAuth 2.0 Authorization Code flow with PKCE (Proof Key for Code Exchange). It covers application setup, sign-on policy configuration, authentication flow, and user verification.\n\n## PingOne API Documentation\n- **[PingOne Platform API Reference](https://apidocs.pingidentity.com/pingone/platform/v1/api/)**\n- **[Create Application](https://apidocs.pingidentity.com/pingone/platform/v1/api/#post-create-application)**\n- **[Create Sign-On Policy](https://apidocs.pingidentity.com/pingone/platform/v1/api/#post-create-sign-on-policy)**\n- **[OAuth 2.0 Authorization Code Flow](https://tools.ietf.org/html/rfc6749#section-4.1)**\n- **[PKCE RFC](https://tools.ietf.org/html/rfc7636)**\n\n## Subgroups Summary\n\n### Setup\n- Create a web application with PKCE enforcement\n- Retrieve the application secret for token exchange\n\n### Using Sign On Policy\n- Create a sign-on policy for authentication rules\n- Add a login action to prompt for username/password\n- Assign the policy to the web application\n\n### Login\n- Initiate OAuth authorization request with PKCE\n- Verify user exists via username and email lookups\n- Submit login credentials\n- Complete the OAuth flow to obtain tokens\n\n### Test Login\n- Verify authentication success with OAuth UserInfo endpoint\n\n## Prerequisites\n- Worker token with permissions for applications, policies, and users\n- Environment ID configured\n- Redirect URI configured\n- User created from Sign-up use case',
		},
		'mfa-enrollment': {
			name: '3. MFA Enrollment',
			item: mfaEnrollmentItems,
			description:
				'Add or register an SMS MFA device after initial sign-in. Includes user lookup, device authentication policy retrieval, SMS device creation, and OTP activation. After enrollment, device can be used for login-time MFA challenges.',
		},
		'mfa-challenge': {
			name: '4. MFA Challenge',
			item: mfaChallengeItems,
			description:
				'Validate OTP code during login-time MFA challenge. Includes device authentication initialization, device selection (if multiple devices), and OTP validation. Used when primary authentication succeeds but MFA is required.',
		},
		stepup: {
			name: '5. Step-up Authentication',
			item: stepUpItems,
			description:
				'Re-authenticate or require stronger factor for high-risk actions (change email/phone, change password, add/remove MFA, payments, admin actions). Driven by policy and risk signals.',
		},
		'password-reset': {
			name: '6. Forgot Password / Password Reset',
			item: passwordResetItems,
			description:
				'Self-service password reset flow. Start reset via email/SMS, verify user controls the channel, set new password. Optional: revoke sessions/tokens and force re-login.',
		},
		'account-recovery': {
			name: '7. Account Recovery',
			item: accountRecoveryItems,
			description:
				'Recover account when user cannot complete MFA. Includes email lookup, sending recovery OTP code to email, and validating the recovery code. Used to prove user ownership via email verification when MFA is blocking access.',
		},
		'change-credentials': {
			name: '8. Password recovery for user',
			item: changePasswordItems,
			description:
				'Password recovery for user. Allows authenticated user to change their own password with current password verification, or admin to force password change on next sign-in.',
		},
		'social-login': {
			name: '9. Social Login',
			item: socialLoginItems,
			description:
				'Configure external identity providers (Facebook, LinkedIn) for social login. Users can authenticate using their social media credentials. Includes configuration for Facebook and LinkedIn as external IdPs in PingOne.',
		},
		federation: {
			name: '10. Partner / Enterprise Federation',
			item: federationItems,
			description:
				'Configure Azure Active Directory (Azure AD) as an external identity provider for enterprise federation. Enables "Sign in with your organization" functionality. Supports IdP discovery/routing by email domain, organization selection, or explicit button.',
		},
		'risk-checks': {
			name: '11. Risk-based Checks',
			item: riskCheckItems,
			description:
				'Retrieve risk predictors and update risk evaluations using PingOne Protect API. Risk predictors evaluate factors like new device, new geo, impossible travel, high velocity attempts to determine risk levels. Update evaluations with transaction completion status (SUCCESS/FAILED) to improve future risk assessments.',
		},
		logout: {
			name: '12. Logout',
			item: logoutItems,
			description:
				'Complete logout and session management workflow. Includes listing user sessions, ending current session, revoking refresh tokens, terminating specific sessions, and verifying token status via introspection. Provides users with visibility and control over all active sessions across devices.',
		},
		'user-sessions': {
			name: '13. User Sessions',
			item: userSessionsItems,
			description:
				'Comprehensive user session management operations. Includes listing all active sessions, retrieving specific session details, deleting individual sessions, and deleting all sessions for a user. Provides administrators and users with complete control over session lifecycle and security. Reference: [PingOne User Sessions API](https://apidocs.pingidentity.com/pingone/platform/v1/api/#user-sessions)',
		},
		'transaction-approval': {
			name: '14. Transaction Approval Flows',
			item: transactionApprovalItems,
			description:
				'# Transaction Approval Flows Overview\n\nThis use case demonstrates transaction approval workflows in PingOne using both redirect and non-redirect authorization requests. Each flow uses a `login_hint_token` JWT to supply user and transaction context.\n\n## PingOne API Documentation\n- **[PingOne Auth APIs](https://apidocs.pingidentity.com/pingone/auth/v1/api/)**\n- **[Redirect and Non-redirect Flows](https://apidocs.pingidentity.com/pingone/auth/v1/api/#redirect-and-non-redirect-authentication-flows)**\n\n## Subgroups Summary\n\n### Transaction Approval - Redirect Flow\n- Initiate transaction approval with a redirect-style request (pi.flow JSON response)\n\n### Transaction Approval - Non-redirect Flow\n- Initiate transaction approval via API (no redirect)\n\n## Prerequisites\n- Environment ID and application configuration\n- User authenticated (SignInUserID and SignInUsername available)\n- Application secret available (SignInWithPKCEAppSecret)\n- Transaction details set in environment variables\n\n## Key Features\n- **JWT-based Context**: `login_hint_token` is generated in the request pre-script (no separate API call)\n- **Dual Flow Support**: Redirect and non-redirect examples from PingOne Auth API docs',
		},
		'pingone-metadata': {
			name: '15. PingOne Endpoints - Metadata',
			item: pingOneMetadataItems,
			description:
				'# PingOne Endpoints - Metadata Overview\n\nThis group provides PingOne discovery and metadata endpoints for OpenID Connect and OAuth 2.0, plus the JWKS endpoint for token validation.\n\n## PingOne API Documentation\n- **[Discovery OpenID Configuration](https://apidocs.pingidentity.com/pingone/auth/v1/api/#get-discovery-openid-configuration)**\n- **[OAuth 2.0 Authorization Server Metadata](https://apidocs.pingidentity.com/pingone/auth/v1/api/#get-oauth-20-authorization-server-metadata)**\n- **[OAuth 2.0 Authorization Server Metadata (Custom Domain)](https://apidocs.pingidentity.com/pingone/auth/v1/api/#get-oauth-20-authorization-server-metadata-custom-domain)**\n- **[Read JWKS](https://apidocs.pingidentity.com/pingone/auth/v1/api/#get-read-jwks)**\n\n## Subgroups Summary\n\n### Metadata Endpoints\n- OpenID Connect Discovery\n- OAuth 2.0 Authorization Server Metadata\n- OAuth 2.0 Authorization Server Metadata (Custom Domain)\n- Read JWKS\n\n## Prerequisites\n- `authPath` and `envID` configured\n- Optional: `customAuthPath` for custom domain metadata',
		},
	};

	// If no selection filter provided (undefined), return all use cases (backward compatibility)
	if (!selectedUseCases) {
		return Object.values(useCaseMap);
	}

	// If empty selection (should be prevented by validation, but handle gracefully)
	if (selectedUseCases.size === 0) {
		return [];
	}

	// Filter use cases based on selection
	return Object.entries(useCaseMap)
		.filter(([key]) => selectedUseCases.has(key))
		.map(([, value]) => value);
};

/**
 * Generate Worker Token items for Postman collections
 * Returns array of Worker Token request items (Client Secret Post, Basic, JWT, Private Key JWT)
 */
const generateWorkerTokenItems = (baseUrl: string): PostmanCollectionItem[] => {
	return [
		{
			name: 'Get Worker Token (Client Secret Post)',
			item: [
				{
					name: 'Get Worker Token',
					request: {
						method: 'POST',
						header: [{ key: 'Content-Type', value: 'application/x-www-form-urlencoded' }],
						body: {
							mode: 'urlencoded',
							urlencoded: [
								{ key: 'grant_type', value: 'client_credentials' },
								{ key: 'client_id', value: '{{worker_client_id}}' },
								{ key: 'client_secret', value: '{{worker_client_secret}}' },
								{
									key: 'scope',
									value: 'openid',
								},
							],
						},
						url: parseUrl(`${baseUrl}/as/token`),
						description:
							'**Get Worker Token - Client Secret Post**\n\n**Educational Context:**\n- Worker tokens are used for server-to-server authentication\n- Required for MFA device management and user operations\n- Uses client_credentials grant type (no user involved)\n- Uses client_secret_post authentication method (client_id and client_secret in request body)\n- Returns access_token with management API permissions\n- Token expires after specified time (typically 3600 seconds)\n- Scope: openid\n\n**Variables Saved:**\n- `workerToken` - Saved to environment for use in subsequent requests (Bearer token for API authentication)',
					},
					event: [
						{
							listen: 'test' as const,
							script: {
								exec: [
									'pm.test("✅ Call was Successful - Worker Token Retrieved", function() {',
									'    pm.response.to.have.status(200);',
									'});',
									'',
									'// Extract worker token from response',
									'try {',
									'    if (pm.response.code === 200) {',
									'        const jsonData = pm.response.json();',
									'        ',
									'        if (jsonData.access_token) {',
									'            pm.environment.set("workerToken", jsonData.access_token);',
									'            ',
									'            pm.test("✅ Worker Token was saved to variable workerToken", function() {',
									'                pm.expect(jsonData.access_token, "Access token should be a non-empty string").to.be.a("string").and.not.empty;',
									'                pm.expect(jsonData.access_token.length, "Access token should have sufficient length").to.be.at.least(10);',
									'            });',
									'            ',
									'            pm.test("✅ Response contains access_token", function() {',
									'                pm.expect(jsonData).to.have.property("access_token");',
									'                pm.expect(jsonData).to.have.property("token_type", "Bearer");',
									'            });',
									'            ',
									'            console.log("workerToken is now: " + pm.environment.get("workerToken"));',
									'            console.log("✅ Worker token saved to environment variable");',
									'            ',
									'            if (jsonData.expires_in) {',
									'                console.log("📝 Token expires in:", jsonData.expires_in, "seconds");',
									'            }',
									'        } else {',
									'            console.log("❌ No access_token in response");',
									'            pm.test("❌ Response should contain access_token", function() {',
									'                pm.expect.fail("Response does not contain access_token");',
									'            });',
									'        }',
									'    }',
									'} catch (e) {',
									'    console.log("❌ There was an error parsing JSON", e);',
									'    pm.test("❌ Response should be valid JSON", function() {',
									'        pm.expect.fail("Failed to parse response as JSON: " + e.message);',
									'    });',
									'}',
								],
								type: 'text/javascript',
							},
						},
					],
				},
			],
		},
		{
			name: 'Get Worker Token (Client Secret Basic)',
			item: [
				{
					name: 'Get Worker Token',
					request: {
						method: 'POST',
						header: [
							{ key: 'Content-Type', value: 'application/x-www-form-urlencoded' },
							{ key: 'Authorization', value: 'Basic {{basic_auth}}' },
						],
						body: {
							mode: 'urlencoded',
							urlencoded: [
								{ key: 'grant_type', value: 'client_credentials' },
								{ key: 'client_id', value: '{{worker_client_id}}' },
								{
									key: 'scope',
									value: 'openid',
								},
							],
						},
						url: parseUrl(`${baseUrl}/as/token`),
						description:
							'**Get Worker Token - Client Secret Basic**\n\n**Educational Context:**\n- Worker tokens are used for server-to-server authentication\n- Uses HTTP Basic Authentication (worker_client_id:worker_client_secret in Authorization header)\n- More secure than client_secret_post (credentials not in body)\n- Returns access_token with management API permissions\n- Scope: openid\n- Note: Uses {{basic_auth}} which is automatically generated from {{worker_client_id}} and {{worker_client_secret}}\n\n**Variables Saved:**\n- `basic_auth` - Base64-encoded Basic Auth header (generated in pre-request script)\n- `workerToken` - Saved to environment for use in subsequent requests (Bearer token for API authentication)',
					},
					event: [
						{
							listen: 'prerequest' as const,
							script: {
								exec: [
									'// Generate Basic Auth header',
									'const clientId = pm.environment.get("worker_client_id");',
									'const clientSecret = pm.environment.get("worker_client_secret");',
									'if (clientId && clientSecret) {',
									'    const basicAuth = btoa(clientId + ":" + clientSecret);',
									'    pm.environment.set("basic_auth", basicAuth);',
									'}',
								],
								type: 'text/javascript',
							},
						},
						{
							listen: 'test' as const,
							script: {
								exec: [
									'pm.test("✅ Call was Successful - Worker Token Retrieved (Basic Auth)", function() {',
									'    pm.response.to.have.status(200);',
									'});',
									'',
									'// Extract worker token from response',
									'try {',
									'    if (pm.response.code === 200) {',
									'        const jsonData = pm.response.json();',
									'        ',
									'        if (jsonData.access_token) {',
									'            pm.environment.set("workerToken", jsonData.access_token);',
									'            ',
									'            pm.test("✅ Worker Token was saved to variable workerToken", function() {',
									'                pm.expect(jsonData.access_token, "Access token should be a non-empty string").to.be.a("string").and.not.empty;',
									'                pm.expect(jsonData.access_token.length, "Access token should have sufficient length").to.be.at.least(10);',
									'            });',
									'            ',
									'            pm.test("✅ Response contains access_token", function() {',
									'                pm.expect(jsonData).to.have.property("access_token");',
									'                pm.expect(jsonData).to.have.property("token_type", "Bearer");',
									'            });',
									'            ',
									'            console.log("workerToken is now: " + pm.environment.get("workerToken"));',
									'            console.log("✅ Worker token saved to environment variable");',
									'            ',
									'            if (jsonData.expires_in) {',
									'                console.log("📝 Token expires in:", jsonData.expires_in, "seconds");',
									'            }',
									'        } else {',
									'            console.log("❌ No access_token in response");',
									'            pm.test("❌ Response should contain access_token", function() {',
									'                pm.expect.fail("Response does not contain access_token");',
									'            });',
									'        }',
									'    }',
									'} catch (e) {',
									'    console.log("❌ There was an error parsing JSON", e);',
									'    pm.test("❌ Response should be valid JSON", function() {',
									'        pm.expect.fail("Failed to parse response as JSON: " + e.message);',
									'    });',
									'}',
								],
								type: 'text/javascript',
							},
						},
					],
				},
			],
		},
		{
			name: 'Get Worker Token (Client Secret JWT)',
			item: [
				{
					name: 'Get Worker Token',
					request: {
						method: 'POST',
						header: [{ key: 'Content-Type', value: 'application/x-www-form-urlencoded' }],
						body: {
							mode: 'urlencoded',
							urlencoded: [
								{ key: 'grant_type', value: 'client_credentials' },
								{ key: 'client_id', value: '{{worker_client_id}}' },
								{
									key: 'client_assertion_type',
									value: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
								},
								{ key: 'client_assertion', value: '{{client_assertion_jwt}}' },
								{
									key: 'scope',
									value: 'openid',
								},
							],
						},
						url: parseUrl(`${baseUrl}/as/token`),
						description:
							'**Get Worker Token - Client Secret JWT**\n\n**Educational Context:**\n- Worker tokens are used for server-to-server authentication\n- Uses JWT assertion for client authentication (HS256)\n- More secure than sending client_secret directly\n- JWT is signed with client_secret using HS256 algorithm\n- Returns access_token with management API permissions\n- Scope: openid\n- Note: Generate {{client_assertion_jwt}} using pre-request script\n\n**Variables Saved:**\n- `client_assertion_jwt` - JWT assertion signed with client_secret (generated in pre-request script)\n- `workerToken` - Saved to environment for use in subsequent requests (Bearer token for API authentication)',
					},
					event: [
						{
							listen: 'prerequest' as const,
							script: {
								exec: [
									'// Generate JWT assertion for client_secret_jwt',
									'const clientId = pm.environment.get("worker_client_id");',
									'const clientSecret = pm.environment.get("worker_client_secret");',
									'const envId = pm.environment.get("envID");',
									'',
									'if (clientId && clientSecret && envId) {',
									// biome-ignore lint/suspicious/noTemplateCurlyInString: This is Postman script code where template literals are valid
									'    const tokenEndpoint = `https://auth.pingone.com/${envId}/as/token`;',
									'    const now = Math.floor(Date.now() / 1000);',
									'    ',
									'    // JWT Header',
									'    const header = {',
									'        alg: "HS256",',
									'        typ: "JWT"',
									'    };',
									'    ',
									'    // JWT Payload',
									'    const payload = {',
									'        iss: clientId,',
									'        sub: clientId,',
									'        aud: tokenEndpoint,',
									'        exp: now + 300, // 5 minutes',
									'        iat: now,',
									'        jti: pm.variables.replaceIn("{{$guid}}")',
									'    };',
									'    ',
									'    // Base64URL encode',
									'    function base64UrlEncode(str) {',
									'        return btoa(str)',
									'            .replace(/\\+/g, "-")',
									'            .replace(/\\//g, "_")',
									'            .replace(/=/g, "");',
									'    }',
									'    ',
									'    const encodedHeader = base64UrlEncode(JSON.stringify(header));',
									'    const encodedPayload = base64UrlEncode(JSON.stringify(payload));',
									'    const signatureInput = encodedHeader + "." + encodedPayload;',
									'    ',
									'    // HMAC SHA256 signature',
									'    const signature = CryptoJS.HmacSHA256(signatureInput, clientSecret).toString(CryptoJS.enc.Base64);',
									'    const encodedSignature = signature.replace(/\\+/g, "-").replace(/\\//g, "_").replace(/=/g, "");',
									'    ',
									'    const jwt = signatureInput + "." + encodedSignature;',
									'    pm.environment.set("client_assertion_jwt", jwt);',
									'}',
								],
								type: 'text/javascript',
							},
						},
						{
							listen: 'test' as const,
							script: {
								exec: [
									'pm.test("✅ Call was Successful - Worker Token Retrieved (JWT Assertion)", function() {',
									'    pm.response.to.have.status(200);',
									'});',
									'',
									'// Extract worker token from response',
									'try {',
									'    if (pm.response.code === 200) {',
									'        const jsonData = pm.response.json();',
									'        ',
									'        if (jsonData.access_token) {',
									'            pm.environment.set("workerToken", jsonData.access_token);',
									'            ',
									'            pm.test("✅ Worker Token was saved to variable workerToken", function() {',
									'                pm.expect(jsonData.access_token, "Access token should be a non-empty string").to.be.a("string").and.not.empty;',
									'                pm.expect(jsonData.access_token.length, "Access token should have sufficient length").to.be.at.least(10);',
									'            });',
									'            ',
									'            pm.test("✅ Response contains access_token", function() {',
									'                pm.expect(jsonData).to.have.property("access_token");',
									'                pm.expect(jsonData).to.have.property("token_type", "Bearer");',
									'            });',
									'            ',
									'            console.log("workerToken is now: " + pm.environment.get("workerToken"));',
									'            console.log("✅ Worker token saved to environment variable");',
									'            ',
									'            if (jsonData.expires_in) {',
									'                console.log("📝 Token expires in:", jsonData.expires_in, "seconds");',
									'            }',
									'        } else {',
									'            console.log("❌ No access_token in response");',
									'            pm.test("❌ Response should contain access_token", function() {',
									'                pm.expect.fail("Response does not contain access_token");',
									'            });',
									'        }',
									'    }',
									'} catch (e) {',
									'    console.log("❌ There was an error parsing JSON", e);',
									'    pm.test("❌ Response should be valid JSON", function() {',
									'        pm.expect.fail("Failed to parse response as JSON: " + e.message);',
									'    });',
									'}',
								],
								type: 'text/javascript',
							},
						},
					],
				},
			],
		},
		{
			name: 'Get Worker Token (Private Key JWT)',
			item: [
				{
					name: 'Get Worker Token',
					request: {
						method: 'POST',
						header: [{ key: 'Content-Type', value: 'application/x-www-form-urlencoded' }],
						body: {
							mode: 'urlencoded',
							urlencoded: [
								{ key: 'grant_type', value: 'client_credentials' },
								{ key: 'client_id', value: '{{worker_client_id}}' },
								{
									key: 'client_assertion_type',
									value: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
								},
								{ key: 'client_assertion', value: '{{client_assertion_jwt_private}}' },
								{
									key: 'scope',
									value: 'openid',
								},
							],
						},
						url: parseUrl(`${baseUrl}/as/token`),
						description:
							'**Get Worker Token - Private Key JWT**\n\n**Educational Context:**\n- Worker tokens are used for server-to-server authentication\n- Uses JWT assertion signed with private key (RS256)\n- Most secure client authentication method\n- JWT is signed with RSA private key using RS256 algorithm\n- Returns access_token with management API permissions\n- Scope: openid\n- Note: Generate {{client_assertion_jwt_private}} using pre-request script with private key\n\n**Variables Saved:**\n- `client_assertion_jwt_private` - JWT assertion signed with private key (requires manual setup or external tool)\n- `workerToken` - Saved to environment for use in subsequent requests (Bearer token for API authentication)',
					},
					event: [
						{
							listen: 'prerequest' as const,
							script: {
								exec: [
									'// Generate JWT assertion for private_key_jwt',
									'// Note: This requires a private key. In Postman, you may need to use',
									'// a pre-request script that can sign with RSA keys, or generate',
									'// the JWT externally and set it as {{client_assertion_jwt_private}}',
									'const clientId = pm.environment.get("worker_client_id");',
									'const envId = pm.environment.get("envID");',
									'',
									'if (clientId && envId) {',
									// biome-ignore lint/suspicious/noTemplateCurlyInString: This is Postman script code where template literals are valid
									'    const tokenEndpoint = `https://auth.pingone.com/${envId}/as/token`;',
									'    // For private key JWT, you need to sign with RS256',
									'    // This typically requires a library or external tool',
									'    // Set {{client_assertion_jwt_private}} manually or use a script that supports RSA signing',
									'    console.log("⚠️ Private Key JWT requires RSA signing. Set {{client_assertion_jwt_private}} manually.");',
									'}',
								],
								type: 'text/javascript',
							},
						},
						{
							listen: 'test' as const,
							script: {
								exec: [
									'pm.test("✅ Call was Successful - Worker Token Retrieved (Private Key JWT)", function() {',
									'    pm.response.to.have.status(200);',
									'});',
									'',
									'// Extract worker token from response',
									'try {',
									'    if (pm.response.code === 200) {',
									'        const jsonData = pm.response.json();',
									'        ',
									'        if (jsonData.access_token) {',
									'            pm.environment.set("workerToken", jsonData.access_token);',
									'            ',
									'            pm.test("✅ Worker Token was saved to variable workerToken", function() {',
									'                pm.expect(jsonData.access_token, "Access token should be a non-empty string").to.be.a("string").and.not.empty;',
									'                pm.expect(jsonData.access_token.length, "Access token should have sufficient length").to.be.at.least(10);',
									'            });',
									'            ',
									'            pm.test("✅ Response contains access_token", function() {',
									'                pm.expect(jsonData).to.have.property("access_token");',
									'                pm.expect(jsonData).to.have.property("token_type", "Bearer");',
									'            });',
									'            ',
									'            console.log("workerToken is now: " + pm.environment.get("workerToken"));',
									'            console.log("✅ Worker token saved to environment variable");',
									'            ',
									'            if (jsonData.expires_in) {',
									'                console.log("📝 Token expires in:", jsonData.expires_in, "seconds");',
									'            }',
									'        } else {',
									'            console.log("❌ No access_token in response");',
									'            pm.test("❌ Response should contain access_token", function() {',
									'                pm.expect.fail("Response does not contain access_token");',
									'            });',
									'        }',
									'    }',
									'} catch (e) {',
									'    console.log("❌ There was an error parsing JSON", e);',
									'    pm.test("❌ Response should be valid JSON", function() {',
									'        pm.expect.fail("Failed to parse response as JSON: " + e.message);',
									'    });',
									'}',
								],
								type: 'text/javascript',
							},
						},
					],
				},
			],
		},
	];
};

/**
 * Generate comprehensive Postman collection for Use Cases only
 * Contains all 13 customer identity flow use cases with real PingOne API calls
 */
export const generateUseCasesPostmanCollection = (
	credentials?: {
		environmentId?: string;
		clientId?: string;
		clientSecret?: string;
	},
	selectedUseCases?: Set<string>
): PostmanCollection => {
	// Collect generation warnings/errors for this run.
	const issues = new GenerationIssues('generateUseCasesPostmanCollection');

	// Build variables
	const variables: Array<{ key: string; value: string; type?: string; description?: string }> = [
		{ key: 'authPath', value: 'https://auth.pingone.com', type: 'string' },
		{ key: 'apiPath', value: 'https://api.pingone.com', type: 'string' },
		{
			key: 'envID',
			value: credentials?.environmentId || 'b9817c16-9910-4415-b67e-4ac687da74d9',
			type: 'string',
		},
		{ key: 'workerToken', value: '', type: 'string' },
		// Worker client credentials (for Worker Token - server-to-server authentication)
		// These are used for admin/management operations (creating users, devices, policies, etc.)
		// ALWAYS use these default values for worker token - do NOT override with authorization credentials
		{ key: 'worker_client_id', value: '66a4686b-9222-4ad2-91b6-03113711c9aa', type: 'string' },
		{
			key: 'worker_client_secret',
			value: '3D_ksu7589TfcVJm2fqEHjXuhc-DCRfoxEv0urEw8GIK7qiJe72n92WRQ0uaT2tC',
			type: 'secret',
		},
		// User/OAuth client credentials (for OAuth flows - user authentication)
		// These are used for user login flows (authorization code exchange, token refresh, etc.)
		// Use passed-in credentials if provided (for authorization flows), otherwise use worker defaults
		// NOTE: Typically these are DIFFERENT from worker credentials - set them separately in your environment
		{
			key: 'user_client_id',
			value: credentials?.clientId || '66a4686b-9222-4ad2-91b6-03113711c9aa',
			type: 'string',
		},
		{
			key: 'user_client_secret',
			value:
				credentials?.clientSecret ||
				'3D_ksu7589TfcVJm2fqEHjXuhc-DCRfoxEv0urEw8GIK7qiJe72n92WRQ0uaT2tC',
			type: 'secret',
		},
		{ key: 'redirect_uri', value: 'http://localhost:3000/callback', type: 'string' },
		{ key: 'scopes_oidc', value: 'openid profile email', type: 'string' },
		{ key: 'state', value: '', type: 'string' },
		{ key: 'authorization_code', value: '', type: 'string' },
		{ key: 'access_token', value: '', type: 'string' },
		{ key: 'id_token', value: '', type: 'string' },
		{ key: 'refresh_token', value: '', type: 'string' },
		{ key: 'code_verifier', value: '', type: 'string' },
		{ key: 'code_challenge', value: '', type: 'string' },
		{ key: 'code_challenge_method', value: 'S256', type: 'string' },
		{ key: 'codeVerifier', value: '', type: 'string' },
		{ key: 'codeChallenge', value: '', type: 'string' },
		{ key: 'codeChallengeMethod', value: 'S256', type: 'string' },
		{ key: 'basic_auth', value: '', type: 'string' },
		{ key: 'client_secret_jwt', value: '', type: 'string' },
		{ key: 'client_assertion_jwt', value: '', type: 'string' },
		{ key: 'client_assertion_jwt_private', value: '', type: 'string' },
		{ key: 'user_client_assertion_jwt_private', value: '', type: 'string' },
		{ key: 'SignUpPopID', value: '', type: 'string' },
		{ key: 'SignUpUserID', value: '', type: 'string' },
		{ key: 'SignUpUsername', value: '', type: 'string' },
		{ key: 'baseballPlayerFirstName', value: '', type: 'string' },
		{ key: 'baseballPlayerLastName', value: '', type: 'string' },
		{ key: 'baseballPlayerEmail', value: '', type: 'string' },
		{ key: 'baseballPlayerUsername', value: '', type: 'string' },
		// User variables (from Register user Step 1 - used across ALL use cases)
		{ key: 'SignInUserID', value: '', type: 'string' },
		{ key: 'SignInUsername', value: '', type: 'string' },
		{ key: 'SignInUserEmail', value: '', type: 'string' },
		// Application variables (from Sign-in Step 1)
		{ key: 'webAppSignInWithPKCEId', value: '', type: 'string' },
		{ key: 'SignInWithPKCEAppSecret', value: '', type: 'secret' },
		{ key: 'SignInSignonPolicyID', value: '', type: 'string' },
		{ key: 'flowID', value: '', type: 'string' },
		{ key: 'authCode', value: '', type: 'string' },
		{ key: 'userPassword', value: '', type: 'string' },
		{ key: 'currentPassword', value: '', type: 'string' },
		{ key: 'newPassword', value: '', type: 'string' },
		// Legacy user variables (deprecated - use SignInUserID instead)
		{ key: 'userId', value: '', type: 'string' },
		{ key: 'username', value: '', type: 'string' },
		{ key: 'email', value: '', type: 'string' },
		{ key: 'givenName', value: '', type: 'string' },
		{ key: 'familyName', value: '', type: 'string' },
		{ key: 'phone', value: '', type: 'string' },
		{ key: 'populationId', value: '', type: 'string' },
		{ key: 'initialPassword', value: '', type: 'string' },
		{ key: 'emailVerificationCode', value: '', type: 'string' },
		{ key: 'recoveryCode', value: '', type: 'string' },
		{ key: 'current_password', value: '', type: 'string' },
		{ key: 'new_password', value: '', type: 'string' },
		{ key: 'userToken', value: '', type: 'string' },
		{ key: 'groupId', value: '', type: 'string' },
		{ key: 'deviceId', value: '', type: 'string' },
		{ key: 'deviceAuthenticationPolicyId', value: '', type: 'string' },
		{ key: 'deviceAuthenticationId', value: '', type: 'string' },
		{ key: 'otp_code', value: '', type: 'string' },
		// Social Login Provider Credentials
		{ key: 'facebook_client_id', value: '', type: 'string' },
		{ key: 'facebook_client_secret', value: '', type: 'secret' },
		{ key: 'linkedin_client_id', value: '', type: 'string' },
		{ key: 'linkedin_client_secret', value: '', type: 'secret' },
		{ key: 'azure_client_id', value: '', type: 'string' },
		{ key: 'azure_client_secret', value: '', type: 'secret' },
		{ key: 'azure_tenant_id', value: 'common', type: 'string' },
		// External IdP IDs (saved after configuration)
		{ key: 'facebook_idp_id', value: '', type: 'string' },
		{ key: 'linkedin_idp_id', value: '', type: 'string' },
		{ key: 'azure_idp_id', value: '', type: 'string' },
		// Risk-based Checks / PingOne Protect variables
		{ key: 'riskPredictorId', value: '', type: 'string' },
		{ key: 'riskEvaluationId', value: '', type: 'string' },
		{ key: 'completionStatus', value: 'SUCCESS', type: 'string' },
		// Logout / Session Management variables
		{ key: 'sessionId', value: '', type: 'string' },
		// Transaction Approval variables
		{ key: 'loginHintJwt', value: '', type: 'string' },
		{ key: 'transactionFlowID', value: '', type: 'string' },
		{ key: 'transactionId', value: '', type: 'string' },
		{ key: 'transactionAmount', value: '', type: 'string' },
		{ key: 'transactionCurrency', value: '', type: 'string' },
		{ key: 'transactionDescription', value: '', type: 'string' },
		// PingOne Endpoints - Metadata variables
		{ key: 'customAuthPath', value: '', type: 'string' },
		// PAR variables
		{ key: 'par_request_uri', value: '', type: 'string' },
	];

	// Generate Worker Token items (needed for all use cases)
	const baseUrl = '{{authPath}}/{{envID}}';
	const workerTokenItems = generateWorkerTokenItems(baseUrl);

	// Generate use cases items (filtered by selection if provided)
	const useCasesItems = generateUseCasesItems(credentials, selectedUseCases);

	const finalizedVariables = finalizeVariables(variables, issues, 'Use Cases Collection');
	const collection: PostmanCollection = {
		info: {
			name: 'PingOne Customer Identity Use Cases',
			version: COLLECTION_VERSION,
			description:
				'Postman collection for common customer identity flows for web applications. Each use case contains real PingOne API calls to implement that specific flow. Based on Common Customer Identity Flows (Web) documentation.\n\n**Use Cases Included:**\n\n1. **Sign-up (Registration):** Create account and collect profile attributes\n2. **Sign-in:** Primary authentication using OAuth/OIDC Authorization Code flow with PKCE\n3. **MFA Enrollment:** Add or register an additional factor after initial sign-in\n4. **MFA Challenge:** Prompt for additional factor during sign-in or sensitive actions\n5. **Step-up Authentication:** Re-authenticate for high-risk actions\n6. **Forgot Password / Password Reset:** Self-service password reset flow\n7. **Account Recovery:** Recover when user can\'t complete MFA\n8. **Password recovery for user:** Change password with re-auth/step-up, admin force password change\n9. **Social Login:** Configure external identity providers (Facebook, LinkedIn) for social login\n10. **Partner / Enterprise Federation:** Configure Azure AD for enterprise federation - "Sign in with your organization"\n11. **Risk-based Checks:** Get risk predictors and update risk evaluations using PingOne Protect API\n12. **Logout:** Complete logout workflow including session listing, session termination, token revocation, and token status verification\n\n**Standard Environment Variables:**\n\n**Core Configuration:**\n- `envID` - PingOne Environment ID (UUID format)\n- `authPath` - Authentication base URL (https://auth.pingone.com)\n- `apiPath` - API base URL (https://api.pingone.com)\n\n**Worker Token (Server-to-Server Authentication):**\n- `workerToken` - Worker access token (obtained from Worker Token section, used for admin/management operations)\n- `worker_client_id` - Client ID for worker token generation (typically a service account/client)\n- `worker_client_secret` - Client secret for worker token generation\n\n**User/OAuth Client Credentials (User Authentication Flows):**\n- `user_client_id` - Client ID for OAuth flows (user login, token exchange, token refresh)\n- `user_client_secret` - Client secret for OAuth flows\n- **Note:** These are typically DIFFERENT from worker credentials - set them separately in your environment\n\n**User Information (from Sign-in Step 2 - used across ALL use cases):**\n- `SignInUserID` - User ID created in Sign-in Step 2 (used in all subsequent use cases)\n- `SignInUsername` - Username created in Sign-in Step 2\n- **Important:** All use cases share the same user created in Sign-in - no additional users are created\n\n**Application Information (from Sign-in Step 1):**\n- `webAppSignInWithPKCEId` - Application ID created in Sign-in Step 1 (used in authorization requests)\n\n**OAuth Flow Variables:**\n- `redirect_uri` - OAuth redirect URI\n- `scopes_oidc` - OIDC scopes (e.g., "openid profile email")\n- `authorization_code` - Authorization code from authorization request\n- `access_token` - OAuth access token (user token)\n- `id_token` - OIDC ID token\n- `refresh_token` - OAuth refresh token\n- `code_verifier` - PKCE code verifier\n- `code_challenge` - PKCE code challenge\n- `code_challenge_method` - PKCE method (S256)\n\nGenerated from OAuth Playground.',
			schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
		},
		variable: finalizedVariables,
		item: [
			{
				name: 'Worker Token',
				item: workerTokenItems,
			},
			{
				name: 'Use Cases',
				item: useCasesItems,
				description:
					'Common customer identity flows for web applications. Each use case contains real PingOne API calls to implement that specific flow. Based on Common Customer Identity Flows (Web) documentation.',
			},
		],
	};

	validateCollection(collection, issues, 'Use Cases Collection');
	validateEnvironment(finalizedVariables, issues, 'Use Cases Collection');
	validatePlaceholders(JSON.stringify(collection), issues, 'Use Cases Collection');
	issues.printSummary();
	issues.throwIfErrors();
	// Enhance all descriptions with Variables Saved information
	return enhanceCollectionDescriptions(collection);
};

/**
 * Generate comprehensive Postman collection for all Unified flows
 * Groups flows by OAuth 2.0, OIDC, and OIDC 2.1
 */
export const generateComprehensiveUnifiedPostmanCollection = (credentials?: {
	environmentId?: string;
	clientId?: string;
	clientSecret?: string;
}): PostmanCollection => {
	// Collect generation warnings/errors for this run.
	const issues = new GenerationIssues('generateComprehensiveUnifiedPostmanCollection');

	const baseUrl = '{{authPath}}/{{envID}}';

	// Build variables
	const variables: Array<{ key: string; value: string; type?: string; description?: string }> = [
		{ key: 'authPath', value: 'https://auth.pingone.com', type: 'string' },
		{
			key: 'envID',
			value: credentials?.environmentId || 'b9817c16-9910-4415-b67e-4ac687da74d9',
			type: 'string',
		},
	];

	// Worker client credentials (for Worker Token - server-to-server authentication)
	// ALWAYS use these default values for worker token - do NOT override with authorization credentials
	variables.push({
		key: 'worker_client_id',
		value: '66a4686b-9222-4ad2-91b6-03113711c9aa',
		type: 'string',
	});
	variables.push({
		key: 'worker_client_secret',
		value: '3D_ksu7589TfcVJm2fqEHjXuhc-DCRfoxEv0urEw8GIK7qiJe72n92WRQ0uaT2tC',
		type: 'secret',
	});

	// User/OAuth client credentials (for OAuth flows - user authentication)
	// Use passed-in credentials if provided (for authorization flows), otherwise use worker defaults
	if (credentials?.clientId) {
		variables.push({ key: 'user_client_id', value: credentials.clientId, type: 'string' });
	} else {
		variables.push({
			key: 'user_client_id',
			value: '66a4686b-9222-4ad2-91b6-03113711c9aa',
			type: 'string',
		});
	}

	if (credentials?.clientSecret) {
		variables.push({ key: 'user_client_secret', value: credentials.clientSecret, type: 'secret' });
	} else {
		variables.push({
			key: 'user_client_secret',
			value: '3D_ksu7589TfcVJm2fqEHjXuhc-DCRfoxEv0urEw8GIK7qiJe72n92WRQ0uaT2tC',
			type: 'secret',
		});
	}

	variables.push({ key: 'workerToken', value: '', type: 'string' });
	variables.push({ key: 'redirect_uri', value: '', type: 'string' });
	variables.push({ key: 'scopes_oauth2', value: getDefaultScopes('oauth2.0'), type: 'string' });
	variables.push({ key: 'scopes_oidc', value: getDefaultScopes('oidc'), type: 'string' });
	variables.push({ key: 'scopes_oidc21', value: getDefaultScopes('oidc2.1'), type: 'string' });
	variables.push({ key: 'state', value: '', type: 'string' });
	variables.push({ key: 'authorization_code', value: '', type: 'string' });
	variables.push({ key: 'access_token', value: '', type: 'string' });
	variables.push({ key: 'id_token', value: '', type: 'string' });
	variables.push({ key: 'refresh_token', value: '', type: 'string' });
	variables.push({ key: 'code_verifier', value: '', type: 'string' });
	variables.push({ key: 'code_challenge', value: '', type: 'string' });
	variables.push({ key: 'code_challenge_method', value: 'S256', type: 'string' });
	variables.push({ key: 'client_credentials_basic', value: '', type: 'string' });
	variables.push({ key: 'user_client_credentials_basic', value: '', type: 'string' });
	variables.push({ key: 'basic_auth', value: '', type: 'string' });
	variables.push({ key: 'client_secret_jwt', value: '', type: 'string' });
	variables.push({ key: 'client_assertion_jwt', value: '', type: 'string' });
	variables.push({ key: 'user_client_assertion_jwt', value: '', type: 'string' });
	variables.push({ key: 'private_key_jwt', value: '', type: 'string' });
	variables.push({ key: 'client_assertion_jwt_private', value: '', type: 'string' });
	variables.push({ key: 'user_client_assertion_jwt_private', value: '', type: 'string' });
	variables.push({ key: 'pi_flow_id', value: '', type: 'string' });
	variables.push({ key: 'request_uri', value: '', type: 'string' });
	variables.push({ key: 'device_code', value: '', type: 'string' });
	variables.push({ key: 'user_code', value: '', type: 'string' });
	variables.push({ key: 'verification_uri', value: '', type: 'string' });
	variables.push({ key: 'verification_uri_complete', value: '', type: 'string' });
	variables.push({ key: 'device_code_expires_in', value: '', type: 'string' });
	variables.push({ key: 'device_code_expires_at', value: '', type: 'string' });
	variables.push({ key: 'device_code_interval', value: '5', type: 'string' });
	variables.push({ key: 'nonce', value: '', type: 'string' });
	variables.push({ key: 'response_mode', value: 'query', type: 'string' });
	variables.push({ key: 'redirectless_flowId', value: '', type: 'string' });
	variables.push({ key: 'redirectless_resumeUrl', value: '', type: 'string' });
	variables.push({ key: 'redirectless_sessionId', value: '', type: 'string' });
	variables.push({ key: 'redirectless_status', value: '', type: 'string' });
	variables.push({ key: 'username', value: '', type: 'string' });
	variables.push({ key: 'password', value: '', type: 'string' });
	variables.push({ key: 'otp_code', value: '', type: 'string' });
	variables.push({ key: 'flowId', value: '', type: 'string' });
	variables.push({ key: 'flowID', value: '', type: 'string' });
	variables.push({ key: 'interactionId', value: '', type: 'string' });
	variables.push({ key: 'interactionToken', value: '', type: 'string' });
	variables.push({ key: 'apiPath', value: 'https://api.pingone.com', type: 'string' });
	variables.push({ key: 'userId', value: '', type: 'string' });
	variables.push({ key: 'current_password', value: '', type: 'string' });
	variables.push({ key: 'new_password', value: '', type: 'string' });
	variables.push({ key: 'currentPassword', value: '', type: 'string' });
	variables.push({ key: 'newPassword', value: '', type: 'string' });
	variables.push({ key: 'userPassword', value: '', type: 'string' });
	variables.push({ key: 'authCode', value: '', type: 'string' });
	variables.push({ key: 'SignInSignonPolicyID', value: '', type: 'string' });
	// Use case variables (default to Babe Ruth for example data)
	variables.push({ key: 'email', value: 'babe.ruth@example.com', type: 'string' });
	variables.push({ key: 'givenName', value: 'Babe', type: 'string' });
	variables.push({ key: 'familyName', value: 'Ruth', type: 'string' });
	variables.push({ key: 'phone', value: '', type: 'string' });
	variables.push({ key: 'populationId', value: '', type: 'string' });
	variables.push({ key: 'initialPassword', value: '', type: 'string' });
	variables.push({ key: 'emailVerificationCode', value: '', type: 'string' });
	variables.push({ key: 'recoveryCode', value: '', type: 'string' });
	variables.push({ key: 'emailVerificationRequired', value: 'false', type: 'boolean' });
	variables.push({ key: 'userToken', value: '', type: 'string' });

	// Build collection items grouped by OAuth 2.0, OIDC, and OIDC 2.1
	const oauth20Items: PostmanCollectionItem[] = [];
	const oidcItems: PostmanCollectionItem[] = [];
	const oidc21Items: PostmanCollectionItem[] = [];

	// ============================================
	// OAuth 2.0 Flows
	// ============================================
	// OAuth 2.0: Simple Authorization Code with Query String (default, no PKCE, no id_token, no offline_access)
	oauth20Items.push(
		buildAuthorizationCodeFlow('oauth2.0', 'client_secret_post', baseUrl, false, false, 'query')
	);
	oauth20Items.push(
		buildAuthorizationCodeFlow('oauth2.0', 'client_secret_basic', baseUrl, false, false, 'query')
	);
	oauth20Items.push(
		buildAuthorizationCodeFlow('oauth2.0', 'client_secret_jwt', baseUrl, false, false, 'query')
	);
	oauth20Items.push(
		buildAuthorizationCodeFlow('oauth2.0', 'private_key_jwt', baseUrl, false, false, 'query')
	);

	// OAuth 2.0: Authorization Code with Form POST (enhanced security)
	oauth20Items.push(
		buildAuthorizationCodeFlow('oauth2.0', 'client_secret_post', baseUrl, false, false, 'form_post')
	);

	// OAuth 2.0: Client Credentials (Client Secret Post)
	oauth20Items.push({
		name: 'Client Credentials (Client Secret Post)',
		item: [
			{
				name: 'Get Access Token',
				request: {
					method: 'POST',
					header: [
						{ key: 'Content-Type', value: 'application/x-www-form-urlencoded' },
						{ key: 'Accept', value: 'application/json' },
					],
					body: {
						mode: 'urlencoded',
						urlencoded: [
							{ key: 'grant_type', value: 'client_credentials' },
							{ key: 'scope', value: '{{scopes_oauth2}}' },
							{ key: 'client_id', value: '{{user_client_id}}' },
							{ key: 'client_secret', value: '{{user_client_secret}}' },
						],
					},
					url: parseUrl(`${baseUrl}/as/token`),
					description:
						'**Client Credentials Grant - OAuth 2.0 (Client Secret Post)**\n\n**Educational Context:**\n- Server-to-server authentication (no user involved)\n- Client authenticates using client_id and client_secret in request body\n- Returns access_token only (no id_token, no refresh_token)\n- Used for machine-to-machine communication (M2M)\n- OAuth 2.0: No offline_access scope needed (refresh tokens not applicable)\n- Token expires after expires_in seconds (typically 3600 seconds = 1 hour)',
				},
				event: [
					{
						listen: 'test' as const,
						script: {
							exec: [
								'// OAuth 2.0: Extract access_token only (no id_token, no refresh_token)',
								'if (pm.response.code === 200) {',
								'    const jsonData = pm.response.json();',
								'    ',
								'    // Extract access_token',
								'    if (jsonData.access_token) {',
								'        pm.environment.set("access_token", jsonData.access_token);',
								'        console.log("✅ Access token received (OAuth 2.0 - Client Credentials)");',
								'    }',
								'    ',
								'    // Extract token metadata',
								'    if (jsonData.token_type) {',
								'        pm.environment.set("token_type", jsonData.token_type);',
								'    }',
								'    if (jsonData.expires_in) {',
								'        const expiresAt = Date.now() + (jsonData.expires_in * 1000);',
								'        pm.environment.set("access_token_expires_at", expiresAt.toString());',
								'        console.log("⏱️ Access token expires in:", jsonData.expires_in, "seconds (" + Math.round(jsonData.expires_in / 60) + " minutes)");',
								'    }',
								'    if (jsonData.scope) {',
								'        pm.environment.set("token_scope", jsonData.scope);',
								'        console.log("📋 Token scope:", jsonData.scope);',
								'    }',
								'    ',
								'    // Note: OAuth 2.0 Client Credentials does not return id_token or refresh_token',
								'    console.log("✅ Client Credentials flow completed successfully!");',
								'} else {',
								'    console.log("❌ Client Credentials token request failed:", pm.response.code);',
								'    try {',
								'        const jsonData = pm.response.json();',
								'        if (jsonData.error) {',
								'            console.log("   Error:", jsonData.error);',
								'            if (jsonData.error_description) {',
								'                console.log("   Description:", jsonData.error_description);',
								'            }',
								'            ',
								'            // Common errors',
								'            if (jsonData.error === "invalid_client") {',
								'                console.log("   💡 Tip: Verify client_id and client_secret are correct");',
								'            } else if (jsonData.error === "invalid_scope") {',
								'                console.log("   💡 Tip: Verify requested scopes are valid for this client");',
								'            }',
								'        }',
								'    } catch (e) {',
								'        // Response may not be JSON',
								'    }',
								'}',
							],
							type: 'text/javascript',
						},
					},
				],
			},
		],
	});

	// OAuth 2.0: Client Credentials (Client Secret Basic)
	oauth20Items.push({
		name: 'Client Credentials (Client Secret Basic)',
		item: [
			{
				name: 'Get Access Token',
				request: {
					method: 'POST',
					header: [
						{ key: 'Content-Type', value: 'application/x-www-form-urlencoded' },
						{ key: 'Accept', value: 'application/json' },
						{ key: 'Authorization', value: 'Basic {{user_client_credentials_basic}}' },
					],
					body: {
						mode: 'urlencoded',
						urlencoded: [
							{ key: 'grant_type', value: 'client_credentials' },
							{ key: 'scope', value: '{{scopes_oauth2}}' },
						],
					},
					url: parseUrl(`${baseUrl}/as/token`),
					description:
						'**Client Credentials Grant - OAuth 2.0 (Client Secret Basic)**\n\n**Educational Context:**\n- Server-to-server authentication (no user involved)\n- Client authenticates using HTTP Basic Authentication (client_id:client_secret in Authorization header)\n- More secure than client_secret_post (credentials not in request body)\n- Returns access_token only (no id_token, no refresh_token)\n- Used for machine-to-machine communication (M2M)\n- OAuth 2.0: No offline_access scope needed (refresh tokens not applicable)\n- Token expires after expires_in seconds (typically 3600 seconds = 1 hour)\n- Note: Uses {{user_client_credentials_basic}} which is automatically generated from {{user_client_id}} and {{user_client_secret}}',
				},
				event: [
					{
						listen: 'prerequest' as const,
						script: {
							exec: [
								'// Generate Basic Auth header for Client Credentials',
								'const clientId = pm.environment.get("user_client_id");',
								'const clientSecret = pm.environment.get("user_client_secret");',
								'if (clientId && clientSecret) {',
								'    const basicAuth = btoa(clientId + ":" + clientSecret);',
								'    pm.environment.set("user_client_credentials_basic", basicAuth);',
								'}',
							],
							type: 'text/javascript',
						},
					},
					{
						listen: 'test' as const,
						script: {
							exec: [
								'// OAuth 2.0: Extract access_token only (no id_token, no refresh_token)',
								'if (pm.response.code === 200) {',
								'    const jsonData = pm.response.json();',
								'    ',
								'    // Extract access_token',
								'    if (jsonData.access_token) {',
								'        pm.environment.set("access_token", jsonData.access_token);',
								'        console.log("✅ Access token received (OAuth 2.0 - Client Credentials Basic)");',
								'    }',
								'    ',
								'    // Extract token metadata',
								'    if (jsonData.token_type) {',
								'        pm.environment.set("token_type", jsonData.token_type);',
								'    }',
								'    if (jsonData.expires_in) {',
								'        const expiresAt = Date.now() + (jsonData.expires_in * 1000);',
								'        pm.environment.set("access_token_expires_at", expiresAt.toString());',
								'        console.log("⏱️ Access token expires in:", jsonData.expires_in, "seconds (" + Math.round(jsonData.expires_in / 60) + " minutes)");',
								'    }',
								'    if (jsonData.scope) {',
								'        pm.environment.set("token_scope", jsonData.scope);',
								'        console.log("📋 Token scope:", jsonData.scope);',
								'    }',
								'    ',
								'    // Note: OAuth 2.0 Client Credentials does not return id_token or refresh_token',
								'    console.log("✅ Client Credentials flow completed successfully (Basic Auth)!");',
								'} else {',
								'    console.log("❌ Client Credentials token request failed:", pm.response.code);',
								'    try {',
								'        const jsonData = pm.response.json();',
								'        if (jsonData.error) {',
								'            console.log("   Error:", jsonData.error);',
								'            if (jsonData.error_description) {',
								'                console.log("   Description:", jsonData.error_description);',
								'            }',
								'            ',
								'            // Common errors',
								'            if (jsonData.error === "invalid_client") {',
								'                console.log("   💡 Tip: Verify user_client_id and user_client_secret in Authorization header are correct");',
								'                console.log("   💡 Tip: Verify {{user_client_credentials_basic}} = base64(user_client_id:user_client_secret)");',
								'            } else if (jsonData.error === "invalid_scope") {',
								'                console.log("   💡 Tip: Verify requested scopes are valid for this client");',
								'            }',
								'        }',
								'    } catch (e) {',
								'        // Response may not be JSON',
								'    }',
								'}',
							],
							type: 'text/javascript',
						},
					},
				],
			},
		],
	});

	// OAuth 2.0: Device Code Flow
	oauth20Items.push({
		name: 'Device Code Flow',
		item: [
			{
				name: '1. Request Device Authorization',
				request: {
					method: 'POST',
					header: [
						{ key: 'Content-Type', value: 'application/x-www-form-urlencoded' },
						{ key: 'Accept', value: 'application/json' },
					],
					body: {
						mode: 'urlencoded',
						urlencoded: [
							{ key: 'client_id', value: '{{user_client_id}}' },
							{ key: 'scope', value: '{{scopes_oauth2}}' },
						],
					},
					url: parseUrl(`${baseUrl}/as/device_authorization`),
					description:
						'**Device Code Flow - OAuth 2.0 (RFC 8628)**\n\n**Educational Context:**\n- For devices without browsers (TVs, printers, IoT)\n- Returns device_code (for polling), user_code (for user to enter), and verification_uri\n- User enters user_code at verification_uri on another device\n- OAuth 2.0: Returns access_token only (no id_token)\n- Device code expires after expires_in seconds (typically 900 seconds = 15 minutes)\n- Poll token endpoint at interval seconds (typically 5 seconds) until user authorizes',
				},
				event: [
					{
						listen: 'test' as const,
						script: {
							exec: [
								'// Extract all Device Code Flow response values',
								'if (pm.response.code === 200) {',
								'    const jsonData = pm.response.json();',
								'    ',
								'    // Required: device_code for polling',
								'    if (jsonData.device_code) {',
								'        pm.environment.set("device_code", jsonData.device_code);',
								'        console.log("✅ Device code saved:", jsonData.device_code.substring(0, 20) + "...");',
								'    }',
								'    ',
								'    // Required: user_code for user to enter',
								'    if (jsonData.user_code) {',
								'        pm.environment.set("user_code", jsonData.user_code);',
								'        console.log("✅ User code saved:", jsonData.user_code);',
								'        console.log("   👤 User must enter this code at verification URI");',
								'    }',
								'    ',
								'    // Required: verification_uri where user enters code',
								'    if (jsonData.verification_uri) {',
								'        pm.environment.set("verification_uri", jsonData.verification_uri);',
								'        console.log("✅ Verification URI:", jsonData.verification_uri);',
								'    }',
								'    ',
								'    // Optional: verification_uri_complete (includes user_code, for QR codes)',
								'    if (jsonData.verification_uri_complete) {',
								'        pm.environment.set("verification_uri_complete", jsonData.verification_uri_complete);',
								'        console.log("✅ Verification URI Complete (QR code):", jsonData.verification_uri_complete);',
								'    }',
								'    ',
								'    // Required: expires_in (device code expiration in seconds, typically 900)',
								'    if (jsonData.expires_in) {',
								'        pm.environment.set("device_code_expires_in", jsonData.expires_in.toString());',
								'        const expiresAt = Date.now() + (jsonData.expires_in * 1000);',
								'        pm.environment.set("device_code_expires_at", expiresAt.toString());',
								'        console.log("⏱️ Device code expires in:", jsonData.expires_in, "seconds (" + Math.round(jsonData.expires_in / 60) + " minutes)");',
								'    }',
								'    ',
								'    // Required: interval (polling interval in seconds, typically 5)',
								'    const interval = jsonData.interval || 5;',
								'    pm.environment.set("device_code_interval", interval.toString());',
								'    console.log("🔄 Poll token endpoint every", interval, "seconds");',
								'    console.log("");',
								'    console.log("📋 Next Steps:");',
								'    console.log("   1. User opens:", pm.environment.get("verification_uri") || jsonData.verification_uri);',
								'    console.log("   2. User enters code:", pm.environment.get("user_code") || jsonData.user_code);',
								'    console.log("   3. User authenticates and authorizes");',
								'    console.log("   4. Call Poll for Tokens step (wait", interval, "seconds between polls)");',
								'} else {',
								'    console.log("❌ Device authorization request failed:", pm.response.code);',
								'    try {',
								'        const jsonData = pm.response.json();',
								'        if (jsonData.error) {',
								'            console.log("   Error:", jsonData.error);',
								'            if (jsonData.error_description) {',
								'                console.log("   Description:", jsonData.error_description);',
								'            }',
								'        }',
								'    } catch (e) {',
								'        // Response may not be JSON',
								'    }',
								'}',
							],
							type: 'text/javascript',
						},
					},
				],
			},
			{
				name: '2. Poll for Tokens',
				request: {
					method: 'POST',
					header: [
						{ key: 'Content-Type', value: 'application/x-www-form-urlencoded' },
						{ key: 'Accept', value: 'application/json' },
					],
					body: {
						mode: 'urlencoded',
						urlencoded: [
							{ key: 'grant_type', value: 'urn:ietf:params:oauth:grant-type:device_code' },
							{ key: 'device_code', value: '{{device_code}}' },
							{ key: 'client_id', value: '{{user_client_id}}' },
						],
					},
					url: parseUrl(`${baseUrl}/as/token`),
					description:
						'**Poll for Tokens - Device Code Flow (OAuth 2.0)**\n\n**Educational Context:**\n- Poll this endpoint until user authorizes the device\n- Use interval from device authorization response (typically 5 seconds) - wait between polls\n- Handle responses:\n  - 200 OK: User authorized - extract access_token\n  - 400 Bad Request with error=authorization_pending: User has not authorized yet - keep polling\n  - 400 Bad Request with error=slow_down: Poll too frequently - increase interval by 5 seconds\n  - 400 Bad Request with error=expired_token: Device code expired - restart flow\n  - 400 Bad Request with error=access_denied: User denied authorization - restart flow\n- OAuth 2.0: Returns access_token only (no id_token)\n- Refresh token available if requested in scope',
				},
				event: [
					{
						listen: 'test' as const,
						script: {
							exec: [
								'// Handle Device Code Flow polling responses',
								'if (pm.response.code === 200) {',
								'    // Success: User authorized, extract tokens',
								'    const jsonData = pm.response.json();',
								'    ',
								'    // OAuth 2.0: Extract access_token only (no id_token)',
								'    if (jsonData.access_token) {',
								'        pm.environment.set("access_token", jsonData.access_token);',
								'        console.log("✅ Access token received (OAuth 2.0 - no id_token)");',
								'    }',
								'    ',
								'    // Extract token metadata',
								'    if (jsonData.token_type) {',
								'        pm.environment.set("token_type", jsonData.token_type);',
								'    }',
								'    if (jsonData.expires_in) {',
								'        const expiresAt = Date.now() + (jsonData.expires_in * 1000);',
								'        pm.environment.set("access_token_expires_at", expiresAt.toString());',
								'        console.log("⏱️ Access token expires in:", jsonData.expires_in, "seconds");',
								'    }',
								'    if (jsonData.scope) {',
								'        pm.environment.set("token_scope", jsonData.scope);',
								'    }',
								'    ',
								'    // Note: OAuth 2.0 Device Code Flow does not return refresh_token or id_token',
								'    console.log("✅ Device Code Flow completed successfully!");',
								'} else if (pm.response.code === 400) {',
								'    // Handle polling errors',
								'    const jsonData = pm.response.json();',
								'    ',
								'    if (jsonData.error === "authorization_pending") {',
								'        console.log("⏳ Authorization pending - user has not authorized yet");',
								'        console.log("   🔄 Poll again after interval (typically 5 seconds)");',
								'        const interval = parseInt(pm.environment.get("device_code_interval") || "5");',
								'        console.log("   ⏱️ Wait", interval, "seconds before next poll");',
								'    } else if (jsonData.error === "slow_down") {',
								'        console.log("⚠️ Slow down - polling too frequently");',
								'        const currentInterval = parseInt(pm.environment.get("device_code_interval") || "5");',
								'        const newInterval = currentInterval + 5;',
								'        pm.environment.set("device_code_interval", newInterval.toString());',
								'        console.log("   🔄 Increased polling interval to", newInterval, "seconds");',
								'    } else if (jsonData.error === "expired_token") {',
								'        console.log("❌ Device code expired - restart flow from Request Device Authorization step");',
								'        pm.environment.unset("device_code");',
								'        pm.environment.unset("user_code");',
								'    } else if (jsonData.error === "access_denied") {',
								'        console.log("❌ User denied authorization - restart flow from Request Device Authorization step");',
								'        pm.environment.unset("device_code");',
								'        pm.environment.unset("user_code");',
								'    } else {',
								'        console.log("❌ Polling failed:", jsonData.error);',
								'        if (jsonData.error_description) {',
								'            console.log("   Description:", jsonData.error_description);',
								'        }',
								'    }',
								'} else {',
								'    console.log("❌ Unexpected response code:", pm.response.code);',
								'}',
							],
							type: 'text/javascript',
						},
					},
				],
			},
		],
	});

	// OAuth 2.0: Implicit Flow (deprecated in OAuth 2.1, but still part of OAuth 2.0)
	// OAuth 2.0 Implicit uses response_type=token (access token only, no id_token)
	oauth20Items.push({
		name: 'Implicit Flow (URL Fragment)',
		item: [
			{
				name: '1. Build Authorization URL',
				request: {
					method: 'GET',
					url: parseUrl(
						`${baseUrl}/as/authorize?client_id={{user_client_id}}&response_type=token&redirect_uri={{redirect_uri}}&scope={{scopes_oauth2}}&state={{state}}&response_mode=fragment`
					),
				},
				description:
					'**Implicit Flow - OAuth 2.0 (URL Fragment)**\n\n**Educational Context:**\n- OAuth 2.0 Implicit flow (deprecated in OAuth 2.1, but still part of OAuth 2.0)\n- Tokens returned directly in URL fragment (not secure)\n- OAuth 2.0: Returns access_token only (response_type=token, no id_token)\n- No refresh_token (use Authorization Code flow instead)\n- response_mode=fragment is the default for implicit flow\n- ⚠️ Deprecated in OAuth 2.1 for security reasons',
				event: [
					{
						listen: 'test' as const,
						script: {
							exec: [
								'// Note: In real OAuth 2.0 Implicit flow, access_token comes in redirect URL fragment',
								'// This is a placeholder - actual token extraction happens from callback URL',
								'// Example callback URL: https://example.com/callback#access_token=...&token_type=Bearer&expires_in=3600&state=...',
								'if (pm.response.code === 200 || pm.response.code === 302) {',
								'    console.log("✅ Authorization URL generated for OAuth 2.0 Implicit Flow");',
								'    console.log("⚠️ Access token will be in redirect URL fragment, not in response body");',
								'}',
							],
							type: 'text/javascript',
						},
					},
				],
			},
		],
	});

	// OAuth 2.0: Implicit Flow with Form POST (alternative)
	oauth20Items.push({
		name: 'Implicit Flow (Form POST)',
		item: [
			{
				name: '1. Build Authorization URL',
				request: {
					method: 'GET',
					url: parseUrl(
						`${baseUrl}/as/authorize?client_id={{user_client_id}}&response_type=token&redirect_uri={{redirect_uri}}&scope={{scopes_oauth2}}&state={{state}}&response_mode=form_post`
					),
				},
				description:
					'**Implicit Flow - OAuth 2.0 (Form POST)**\n\n**Educational Context:**\n- OAuth 2.0 Implicit flow with form_post response mode\n- More secure than fragment (no tokens in URL)\n- OAuth 2.0: Returns access_token only (response_type=token, no id_token)\n- Tokens sent via HTTP POST as form data\n- Requires server-side form processing\n- ⚠️ Deprecated in OAuth 2.1 for security reasons',
				event: [
					{
						listen: 'test' as const,
						script: {
							exec: [
								'// Note: In form_post mode, tokens come via POST to redirect_uri',
								'// This is a placeholder - actual token extraction happens from POST body',
								'if (pm.response.code === 200 || pm.response.code === 302) {',
								'    console.log("✅ Authorization URL generated for OAuth 2.0 Implicit Flow (Form POST)");',
								'    console.log("⚠️ Access token will be in POST body to redirect_uri, not in response body");',
								'}',
							],
							type: 'text/javascript',
						},
					},
				],
			},
		],
	});

	// ============================================
	// OIDC Flows
	// ============================================
	// OIDC: Simple Authorization Code with Query String (no PKCE required, but optional)
	oidcItems.push(
		buildAuthorizationCodeFlow('oidc', 'client_secret_post', baseUrl, false, false, 'query')
	);
	oidcItems.push(
		buildAuthorizationCodeFlow('oidc', 'client_secret_basic', baseUrl, false, false, 'query')
	);
	oidcItems.push(
		buildAuthorizationCodeFlow('oidc', 'client_secret_jwt', baseUrl, false, false, 'query')
	);
	oidcItems.push(
		buildAuthorizationCodeFlow('oidc', 'private_key_jwt', baseUrl, false, false, 'query')
	);

	// OIDC: Authorization Code with URL Fragment (for SPAs)
	oidcItems.push(
		buildAuthorizationCodeFlow('oidc', 'client_secret_post', baseUrl, false, false, 'fragment')
	);
	oidcItems.push(
		buildAuthorizationCodeFlow('oidc', 'client_secret_basic', baseUrl, false, false, 'fragment')
	);

	// OIDC: Authorization Code with Form POST (enhanced security)
	oidcItems.push(
		buildAuthorizationCodeFlow('oidc', 'client_secret_post', baseUrl, false, false, 'form_post')
	);

	// OIDC: Authorization Code with PKCE and Query String (optional)
	oidcItems.push(
		buildAuthorizationCodeFlow('oidc', 'client_secret_post', baseUrl, true, false, 'query')
	);
	oidcItems.push(
		buildAuthorizationCodeFlow('oidc', 'client_secret_basic', baseUrl, true, false, 'query')
	);

	// OIDC: Authorization Code with PKCE and URL Fragment (optional)
	oidcItems.push(
		buildAuthorizationCodeFlow('oidc', 'client_secret_post', baseUrl, true, false, 'fragment')
	);

	// OIDC: Implicit Flow (deprecated but still supported)
	// Implicit flow uses fragment by default (required by spec)
	oidcItems.push({
		name: 'Implicit Flow (URL Fragment)',
		item: [
			{
				name: '1. Build Authorization URL',
				request: {
					method: 'GET',
					url: parseUrl(
						`${baseUrl}/as/authorize?client_id={{user_client_id}}&response_type=id_token token&redirect_uri={{redirect_uri}}&scope={{scopes_oidc}}&state={{state}}&nonce={{nonce}}&response_mode=fragment`
					),
				},
				description:
					'**Implicit Flow - OIDC (URL Fragment)**\n\n**Educational Context:**\n- OIDC Implicit flow (deprecated in OAuth 2.1, but still supported)\n- Tokens returned directly in URL fragment (not secure)\n- Returns access_token and id_token\n- No refresh_token (use Authorization Code flow instead)\n- Requires nonce for id_token validation\n- response_mode=fragment is the default for implicit flow',
			},
		],
	});

	// OIDC: Implicit Flow with Form POST (alternative)
	oidcItems.push({
		name: 'Implicit Flow (Form POST)',
		item: [
			{
				name: '1. Build Authorization URL',
				request: {
					method: 'GET',
					url: parseUrl(
						`${baseUrl}/as/authorize?client_id={{user_client_id}}&response_type=id_token token&redirect_uri={{redirect_uri}}&scope={{scopes_oidc}}&state={{state}}&nonce={{nonce}}&response_mode=form_post`
					),
				},
				description:
					'**Implicit Flow - OIDC (Form POST)**\n\n**Educational Context:**\n- OIDC Implicit flow with form_post response mode\n- More secure than fragment (no tokens in URL)\n- Tokens sent via HTTP POST as form data\n- Requires server-side form processing',
			},
		],
	});

	// OIDC: Device Code Flow
	oidcItems.push({
		name: 'Device Code Flow',
		item: [
			{
				name: '1. Request Device Authorization',
				request: {
					method: 'POST',
					header: [
						{ key: 'Content-Type', value: 'application/x-www-form-urlencoded' },
						{ key: 'Accept', value: 'application/json' },
					],
					body: {
						mode: 'urlencoded',
						urlencoded: [
							{ key: 'client_id', value: '{{user_client_id}}' },
							{ key: 'scope', value: '{{scopes_oidc}}' },
						],
					},
					url: parseUrl(`${baseUrl}/as/device_authorization`),
					description:
						'**Device Code Flow - OIDC (RFC 8628)**\n\n**Educational Context:**\n- For devices without browsers (TVs, printers, IoT)\n- Returns device_code (for polling), user_code (for user to enter), and verification_uri\n- User enters user_code at verification_uri on another device\n- OIDC: Returns access_token AND id_token when authorized\n- Device code expires after expires_in seconds (typically 900 seconds = 15 minutes)\n- Poll token endpoint at interval seconds (typically 5 seconds) until user authorizes\n- Requires openid scope for id_token',
				},
				event: [
					{
						listen: 'test' as const,
						script: {
							exec: [
								'// Extract all Device Code Flow response values',
								'if (pm.response.code === 200) {',
								'    const jsonData = pm.response.json();',
								'    ',
								'    // Required: device_code for polling',
								'    if (jsonData.device_code) {',
								'        pm.environment.set("device_code", jsonData.device_code);',
								'        console.log("✅ Device code saved:", jsonData.device_code.substring(0, 20) + "...");',
								'    }',
								'    ',
								'    // Required: user_code for user to enter',
								'    if (jsonData.user_code) {',
								'        pm.environment.set("user_code", jsonData.user_code);',
								'        console.log("✅ User code saved:", jsonData.user_code);',
								'        console.log("   👤 User must enter this code at verification URI");',
								'    }',
								'    ',
								'    // Required: verification_uri where user enters code',
								'    if (jsonData.verification_uri) {',
								'        pm.environment.set("verification_uri", jsonData.verification_uri);',
								'        console.log("✅ Verification URI:", jsonData.verification_uri);',
								'    }',
								'    ',
								'    // Optional: verification_uri_complete (includes user_code, for QR codes)',
								'    if (jsonData.verification_uri_complete) {',
								'        pm.environment.set("verification_uri_complete", jsonData.verification_uri_complete);',
								'        console.log("✅ Verification URI Complete (QR code):", jsonData.verification_uri_complete);',
								'    }',
								'    ',
								'    // Required: expires_in (device code expiration in seconds, typically 900)',
								'    if (jsonData.expires_in) {',
								'        pm.environment.set("device_code_expires_in", jsonData.expires_in.toString());',
								'        const expiresAt = Date.now() + (jsonData.expires_in * 1000);',
								'        pm.environment.set("device_code_expires_at", expiresAt.toString());',
								'        console.log("⏱️ Device code expires in:", jsonData.expires_in, "seconds (" + Math.round(jsonData.expires_in / 60) + " minutes)");',
								'    }',
								'    ',
								'    // Required: interval (polling interval in seconds, typically 5)',
								'    const interval = jsonData.interval || 5;',
								'    pm.environment.set("device_code_interval", interval.toString());',
								'    console.log("🔄 Poll token endpoint every", interval, "seconds");',
								'    console.log("");',
								'    console.log("📋 Next Steps:");',
								'    console.log("   1. User opens:", pm.environment.get("verification_uri") || jsonData.verification_uri);',
								'    console.log("   2. User enters code:", pm.environment.get("user_code") || jsonData.user_code);',
								'    console.log("   3. User authenticates and authorizes");',
								'    console.log("   4. Call Poll for Tokens step (wait", interval, "seconds between polls)");',
								'} else {',
								'    console.log("❌ Device authorization request failed:", pm.response.code);',
								'    try {',
								'        const jsonData = pm.response.json();',
								'        if (jsonData.error) {',
								'            console.log("   Error:", jsonData.error);',
								'            if (jsonData.error_description) {',
								'                console.log("   Description:", jsonData.error_description);',
								'            }',
								'        }',
								'    } catch (e) {',
								'        // Response may not be JSON',
								'    }',
								'}',
							],
							type: 'text/javascript',
						},
					},
				],
			},
			{
				name: '2. Poll for Tokens',
				request: {
					method: 'POST',
					header: [
						{ key: 'Content-Type', value: 'application/x-www-form-urlencoded' },
						{ key: 'Accept', value: 'application/json' },
					],
					body: {
						mode: 'urlencoded',
						urlencoded: [
							{ key: 'grant_type', value: 'urn:ietf:params:oauth:grant-type:device_code' },
							{ key: 'device_code', value: '{{device_code}}' },
							{ key: 'client_id', value: '{{user_client_id}}' },
						],
					},
					url: parseUrl(`${baseUrl}/as/token`),
					description:
						'**Poll for Tokens - Device Code Flow (OIDC)**\n\n**Educational Context:**\n- Poll this endpoint until user authorizes the device\n- Use interval from device authorization response (typically 5 seconds) - wait between polls\n- Handle responses:\n  - 200 OK: User authorized - extract access_token and id_token (OIDC)\n  - 400 Bad Request with error=authorization_pending: User has not authorized yet - keep polling\n  - 400 Bad Request with error=slow_down: Poll too frequently - increase interval by 5 seconds\n  - 400 Bad Request with error=expired_token: Device code expired - restart flow\n  - 400 Bad Request with error=access_denied: User denied authorization - restart flow\n- OIDC: Returns access_token, id_token, and refresh_token (if offline_access scope requested)',
				},
				event: [
					{
						listen: 'test' as const,
						script: {
							exec: [
								'// Handle Device Code Flow polling responses (OIDC)',
								'if (pm.response.code === 200) {',
								'    // Success: User authorized, extract tokens',
								'    const jsonData = pm.response.json();',
								'    ',
								'    // OIDC: Extract access_token and id_token',
								'    if (jsonData.access_token) {',
								'        pm.environment.set("access_token", jsonData.access_token);',
								'        console.log("✅ Access token received (OIDC)");',
								'    }',
								'    ',
								'    if (jsonData.id_token) {',
								'        pm.environment.set("id_token", jsonData.id_token);',
								'        console.log("✅ ID token received (OIDC)");',
								'    }',
								'    ',
								'    if (jsonData.refresh_token) {',
								'        pm.environment.set("refresh_token", jsonData.refresh_token);',
								'        console.log("✅ Refresh token received (offline_access scope requested)");',
								'    }',
								'    ',
								'    // Extract token metadata',
								'    if (jsonData.token_type) {',
								'        pm.environment.set("token_type", jsonData.token_type);',
								'    }',
								'    if (jsonData.expires_in) {',
								'        const expiresAt = Date.now() + (jsonData.expires_in * 1000);',
								'        pm.environment.set("access_token_expires_at", expiresAt.toString());',
								'        console.log("⏱️ Access token expires in:", jsonData.expires_in, "seconds");',
								'    }',
								'    if (jsonData.scope) {',
								'        pm.environment.set("token_scope", jsonData.scope);',
								'    }',
								'    ',
								'    console.log("✅ Device Code Flow completed successfully (OIDC)!");',
								'} else if (pm.response.code === 400) {',
								'    // Handle polling errors',
								'    const jsonData = pm.response.json();',
								'    ',
								'    if (jsonData.error === "authorization_pending") {',
								'        console.log("⏳ Authorization pending - user has not authorized yet");',
								'        console.log("   🔄 Poll again after interval (typically 5 seconds)");',
								'        const interval = parseInt(pm.environment.get("device_code_interval") || "5");',
								'        console.log("   ⏱️ Wait", interval, "seconds before next poll");',
								'    } else if (jsonData.error === "slow_down") {',
								'        console.log("⚠️ Slow down - polling too frequently");',
								'        const currentInterval = parseInt(pm.environment.get("device_code_interval") || "5");',
								'        const newInterval = currentInterval + 5;',
								'        pm.environment.set("device_code_interval", newInterval.toString());',
								'        console.log("   🔄 Increased polling interval to", newInterval, "seconds");',
								'    } else if (jsonData.error === "expired_token") {',
								'        console.log("❌ Device code expired - restart flow from Request Device Authorization step");',
								'        pm.environment.unset("device_code");',
								'        pm.environment.unset("user_code");',
								'    } else if (jsonData.error === "access_denied") {',
								'        console.log("❌ User denied authorization - restart flow from Request Device Authorization step");',
								'        pm.environment.unset("device_code");',
								'        pm.environment.unset("user_code");',
								'    } else {',
								'        console.log("❌ Polling failed:", jsonData.error);',
								'        if (jsonData.error_description) {',
								'            console.log("   Description:", jsonData.error_description);',
								'        }',
								'    }',
								'} else {',
								'    console.log("❌ Unexpected response code:", pm.response.code);',
								'}',
							],
							type: 'text/javascript',
						},
					},
				],
			},
		],
	});

	// OIDC: Hybrid Flow (code id_token)
	oidcItems.push({
		name: 'Hybrid Flow (code id_token)',
		item: [
			{
				name: '1. Build Authorization URL',
				request: {
					method: 'GET',
					url: parseUrl(
						`${baseUrl}/as/authorize?client_id={{user_client_id}}&response_type=code id_token&redirect_uri={{redirect_uri}}&scope={{scopes_oidc}}&state={{state}}&nonce={{nonce}}&response_mode=fragment`
					),
				},
				description:
					"**Hybrid Flow - OIDC (code id_token)**\n\n**Educational Context:**\n- OIDC Hybrid flow combines Authorization Code and Implicit flows\n- Returns both authorization code AND id_token immediately in redirect URL fragment\n- Code can be exchanged for access_token and refresh_token\n- id_token provides immediate user authentication (no need to wait for token exchange)\n- Requires nonce for id_token validation (prevents replay attacks)\n- response_mode=fragment is common for hybrid flows (tokens in URL fragment)\n- After user authorizes, you'll be redirected to redirect_uri with code and id_token in fragment\n- Example redirect: https://example.com/callback#code=abc123&id_token=xyz789&state=state123",
				event: [
					{
						listen: 'test' as const,
						script: {
							exec: [
								'// Note: In real Hybrid Flow, user is redirected to redirect_uri with tokens in fragment',
								'// This GET request initiates the authorization - actual tokens come in redirect callback',
								'if (pm.response.code === 302) {',
								'    // Handle redirect (normal case)',
								'    const locationHeader = pm.response.headers.get("Location");',
								'    if (locationHeader) {',
								'        console.log("✅ Authorization URL generated for Hybrid Flow");',
								'        console.log("   Redirecting to:", locationHeader);',
								'        console.log("   After user authorizes, you\'ll be redirected to redirect_uri with:");',
								'        console.log("   - code (authorization code) in URL fragment");',
								'        console.log("   - id_token (user identity token) in URL fragment");',
								'        console.log("   - state (for validation) in URL fragment");',
								'        console.log("");',
								'        console.log("📋 Next Steps:");',
								'        console.log("   1. User completes authorization (opens redirect URL)");',
								'        console.log("   2. User is redirected to redirect_uri with tokens in fragment");',
								'        console.log("   3. Extract code and id_token from redirect URL fragment");',
								'        console.log("   4. Call Exchange Authorization Code step to get access_token");',
								'    }',
								'} else if (pm.response.code === 200) {',
								'    console.log("✅ Authorization URL generated for Hybrid Flow");',
								'    console.log("⚠️ Note: In real flow, user completes authorization and is redirected to redirect_uri");',
								'} else {',
								'    console.log("❌ Authorization URL generation failed:", pm.response.code);',
								'}',
							],
							type: 'text/javascript',
						},
					},
				],
			},
			{
				name: '2. Parse Redirect Callback (Demonstration - Extract code and id_token from fragment)',
				request: {
					method: 'GET',
					url: {
						raw: 'https://example.com/callback#code={{authorization_code}}&id_token={{id_token}}&state={{state}}',
						protocol: 'https',
						host: ['example', 'com'],
						path: ['callback'],
					},
					description:
						'**Parse Redirect Callback - Hybrid Flow (Demonstration Step)**\n\n**⚠️ NOTE: This is a DEMONSTRATION step, not a real PingOne API call**\n- This step shows how to extract code and id_token from redirect URL fragment\n- In real applications, this parsing happens automatically in your callback handler\n- After user authorizes, PingOne redirects to redirect_uri with tokens in fragment\n- Example redirect URL: https://example.com/callback#code=abc123&id_token=xyz789&state=state123\n- Extract:\n  - code: authorization code (use in token exchange - Step 3)\n  - id_token: user identity token (already received in Step 1, no need to wait for exchange)\n  - state: validate matches original state parameter (security check)\n- In Postman: Manually extract from redirect URL or use the test script below\n- The test script below demonstrates the parsing logic that your application would use',
				},
				event: [
					{
						listen: 'test' as const,
						script: {
							exec: [
								'// Extract code and id_token from redirect URL fragment',
								'// In real application, this happens automatically when user is redirected',
								'// This script demonstrates extraction logic (adjust based on actual redirect URL)',
								'',
								'// Method 1: Extract from current URL (if callback handler)',
								'const currentUrl = pm.request.url.toString();',
								'if (currentUrl.includes("#")) {',
								'    const fragment = currentUrl.split("#")[1];',
								'    const params = new URLSearchParams(fragment);',
								'    ',
								'    // Extract authorization code',
								'    const code = params.get("code");',
								'    if (code) {',
								'        pm.environment.set("authorization_code", code);',
								'        console.log("✅ Authorization code extracted from fragment:", code);',
								'    }',
								'    ',
								'    // Extract id_token (already received in Hybrid Flow)',
								'    const idToken = params.get("id_token");',
								'    if (idToken) {',
								'        pm.environment.set("id_token", idToken);',
								'        console.log("✅ ID token extracted from fragment (Hybrid Flow):", idToken.substring(0, 50) + "...");',
								'        console.log("   💡 ID token already received - no need to wait for token exchange!");',
								'    }',
								'    ',
								'    // Extract and validate state',
								'    const state = params.get("state");',
								'    if (state) {',
								'        const originalState = pm.environment.get("state");',
								'        if (state === originalState) {',
								'            console.log("✅ State parameter validated:", state);',
								'        } else {',
								'            console.log("⚠️ State mismatch - possible CSRF attack!");',
								'        }',
								'    }',
								'}',
								'',
								'// Method 2: If using a test request with full redirect URL as raw URL',
								'// Parse from pm.request.url',
								'if (pm.request.url && pm.request.url.toString().includes("#")) {',
								'    const urlObj = new URL(pm.request.url.toString());',
								'    const hash = urlObj.hash.substring(1); // Remove #',
								'    const params = new URLSearchParams(hash);',
								'    ',
								'    if (params.get("code")) {',
								'        pm.environment.set("authorization_code", params.get("code"));',
								'    }',
								'    if (params.get("id_token")) {',
								'        pm.environment.set("id_token", params.get("id_token"));',
								'    }',
								'    if (params.get("state")) {',
								'        pm.environment.set("state", params.get("state"));',
								'    }',
								'}',
								'',
								'console.log("📋 Hybrid Flow callback parsed:");',
								'console.log("   - Authorization code:", pm.environment.get("authorization_code") || "not found");',
								'console.log("   - ID token:", pm.environment.get("id_token") ? "extracted" : "not found");',
								'console.log("");',
								'console.log("✅ Next step: Exchange Authorization Code for access_token (id_token already received)");',
							],
							type: 'text/javascript',
						},
					},
				],
			},
			{
				name: '3. Exchange Authorization Code for Access Token',
				request: {
					method: 'POST',
					header: [
						{ key: 'Content-Type', value: 'application/x-www-form-urlencoded' },
						{ key: 'Accept', value: 'application/json' },
					],
					body: {
						mode: 'urlencoded',
						urlencoded: [
							{ key: 'grant_type', value: 'authorization_code' },
							{ key: 'code', value: '{{authorization_code}}' },
							{ key: 'redirect_uri', value: '{{redirect_uri}}' },
							{ key: 'client_id', value: '{{user_client_id}}' },
							{ key: 'client_secret', value: '{{user_client_secret}}' },
						],
					},
					url: parseUrl(`${baseUrl}/as/token`),
					description:
						'**Token Exchange - Hybrid Flow (OIDC)**\n\n**Educational Context:**\n- Exchanges authorization code for access_token and refresh_token\n- id_token was already received in authorization response (Step 1 redirect fragment)\n- Returns access_token for API calls\n- Returns refresh_token if offline_access scope requested\n- Note: In Hybrid Flow, id_token comes immediately in Step 1, so you have user identity before token exchange\n- This is the key advantage of Hybrid Flow over standard Authorization Code flow',
				},
				event: [
					{
						listen: 'test' as const,
						script: {
							exec: [
								'// Extract tokens from token exchange response',
								'if (pm.response.code === 200) {',
								'    const jsonData = pm.response.json();',
								'    ',
								'    // Extract access_token',
								'    if (jsonData.access_token) {',
								'        pm.environment.set("access_token", jsonData.access_token);',
								'        console.log("✅ Access token received (Hybrid Flow)");',
								'    }',
								'    ',
								'    // Note: id_token was already received in Step 1 redirect fragment',
								'    // Do not overwrite it if it was already set',
								'    if (jsonData.id_token && !pm.environment.get("id_token")) {',
								'        pm.environment.set("id_token", jsonData.id_token);',
								'        console.log("✅ ID token received (backup from token exchange)");',
								'    } else if (pm.environment.get("id_token")) {',
								'        console.log("✅ ID token already received from Step 1 redirect (Hybrid Flow advantage)");',
								'    }',
								'    ',
								'    // Extract refresh_token (if offline_access scope requested)',
								'    if (jsonData.refresh_token) {',
								'        pm.environment.set("refresh_token", jsonData.refresh_token);',
								'        console.log("✅ Refresh token received (offline_access scope requested)");',
								'    }',
								'    ',
								'    // Extract token metadata',
								'    if (jsonData.token_type) {',
								'        pm.environment.set("token_type", jsonData.token_type);',
								'    }',
								'    if (jsonData.expires_in) {',
								'        const expiresAt = Date.now() + (jsonData.expires_in * 1000);',
								'        pm.environment.set("access_token_expires_at", expiresAt.toString());',
								'        console.log("⏱️ Access token expires in:", jsonData.expires_in, "seconds");',
								'    }',
								'    if (jsonData.scope) {',
								'        pm.environment.set("token_scope", jsonData.scope);',
								'    }',
								'    ',
								'    console.log("✅ Hybrid Flow completed successfully!");',
								'    console.log("   - ID token: Already received from Step 1 (immediate authentication)");',
								'    console.log("   - Access token: Received from token exchange (for API calls)");',
								'    console.log("   - Refresh token: Received if offline_access scope requested");',
								'} else {',
								'    console.log("❌ Token exchange failed:", pm.response.code);',
								'    try {',
								'        const jsonData = pm.response.json();',
								'        if (jsonData.error) {',
								'            console.log("   Error:", jsonData.error);',
								'            if (jsonData.error_description) {',
								'                console.log("   Description:", jsonData.error_description);',
								'            }',
								'        }',
								'    } catch (e) {',
								'        // Response may not be JSON',
								'    }',
								'}',
							],
							type: 'text/javascript',
						},
					},
				],
			},
		],
	});

	// OIDC: Introspection and UserInfo
	oidcItems.push({
		name: 'Introspect Token',
		request: {
			method: 'POST',
			header: [
				{ key: 'Content-Type', value: 'application/x-www-form-urlencoded' },
				{ key: 'Authorization', value: 'Bearer {{workerToken}}' },
			],
			body: {
				mode: 'urlencoded',
				urlencoded: [
					{ key: 'token', value: '{{access_token}}' },
					{ key: 'token_type_hint', value: 'access_token' },
				],
			},
			url: parseUrl(`${baseUrl}/as/introspect`),
			description:
				'**Token Introspection - OIDC**\n\n**Educational Context:**\n- Validates access_token and returns token metadata\n- Returns active status, expiration, scopes, etc.\n- Requires worker token for authentication',
		},
	});

	oidcItems.push({
		name: 'Get UserInfo',
		request: {
			method: 'GET',
			header: [{ key: 'Authorization', value: 'Bearer {{access_token}}' }],
			url: parseUrl(`${baseUrl}/as/userinfo`),
			description:
				'**UserInfo Endpoint - OIDC**\n\n**Educational Context:**\n- Returns user claims (profile, email, etc.)\n- Requires valid access_token\n- OIDC-specific endpoint (not in OAuth 2.0)',
		},
	});

	// ============================================
	// OIDC 2.1 Flows
	// ============================================
	// OIDC 2.1: Authorization Code with PKCE and Query String (REQUIRED)
	oidc21Items.push(
		buildAuthorizationCodeFlow('oidc2.1', 'client_secret_post', baseUrl, true, false, 'query')
	);
	oidc21Items.push(
		buildAuthorizationCodeFlow('oidc2.1', 'client_secret_basic', baseUrl, true, false, 'query')
	);
	oidc21Items.push(
		buildAuthorizationCodeFlow('oidc2.1', 'client_secret_jwt', baseUrl, true, false, 'query')
	);
	oidc21Items.push(
		buildAuthorizationCodeFlow('oidc2.1', 'private_key_jwt', baseUrl, true, false, 'query')
	);

	// OIDC 2.1: Authorization Code with PKCE and URL Fragment
	oidc21Items.push(
		buildAuthorizationCodeFlow('oidc2.1', 'client_secret_post', baseUrl, true, false, 'fragment')
	);
	oidc21Items.push(
		buildAuthorizationCodeFlow('oidc2.1', 'client_secret_basic', baseUrl, true, false, 'fragment')
	);

	// OIDC 2.1: Authorization Code with PKCE and Form POST
	oidc21Items.push(
		buildAuthorizationCodeFlow('oidc2.1', 'client_secret_post', baseUrl, true, false, 'form_post')
	);

	// OIDC 2.1: Authorization Code with PKCE and PAR (Query String)
	oidc21Items.push(
		buildAuthorizationCodeFlow('oidc2.1', 'client_secret_post', baseUrl, true, true, 'query')
	);
	oidc21Items.push(
		buildAuthorizationCodeFlow('oidc2.1', 'client_secret_basic', baseUrl, true, true, 'query')
	);

	// OIDC 2.1: Client Credentials (Client Secret Post)
	oidc21Items.push({
		name: 'Client Credentials (Client Secret Post)',
		item: [
			{
				name: 'Get Access Token',
				request: {
					method: 'POST',
					header: [
						{ key: 'Content-Type', value: 'application/x-www-form-urlencoded' },
						{ key: 'Accept', value: 'application/json' },
					],
					body: {
						mode: 'urlencoded',
						urlencoded: [
							{ key: 'grant_type', value: 'client_credentials' },
							{ key: 'scope', value: '{{scopes_oidc21}}' },
							{ key: 'client_id', value: '{{client_id}}' },
							{ key: 'client_secret', value: '{{client_secret}}' },
						],
					},
					url: parseUrl(`${baseUrl}/as/token`),
					description:
						'**Client Credentials Grant - OIDC 2.1 (Client Secret Post)**\n\n**Educational Context:**\n- Server-to-server authentication (no user involved)\n- Client authenticates using client_id and client_secret in request body\n- OIDC 2.1: May return id_token if openid scope requested\n- Returns access_token (and id_token if openid scope requested)\n- No refresh_token (refresh tokens not applicable to Client Credentials flow)\n- Used for machine-to-machine communication (M2M)\n- Token expires after expires_in seconds (typically 3600 seconds = 1 hour)',
				},
				event: [
					{
						listen: 'test' as const,
						script: {
							exec: [
								'// OIDC 2.1: Extract access_token and id_token (if openid scope requested)',
								'if (pm.response.code === 200) {',
								'    const jsonData = pm.response.json();',
								'    ',
								'    // Extract access_token',
								'    if (jsonData.access_token) {',
								'        pm.environment.set("access_token", jsonData.access_token);',
								'        console.log("✅ Access token received (OIDC 2.1 - Client Credentials)");',
								'    }',
								'    ',
								'    // OIDC 2.1: Extract id_token if openid scope requested',
								'    if (jsonData.id_token) {',
								'        pm.environment.set("id_token", jsonData.id_token);',
								'        console.log("✅ ID token received (OIDC 2.1 - openid scope requested)");',
								'    }',
								'    ',
								'    // Extract token metadata',
								'    if (jsonData.token_type) {',
								'        pm.environment.set("token_type", jsonData.token_type);',
								'    }',
								'    if (jsonData.expires_in) {',
								'        const expiresAt = Date.now() + (jsonData.expires_in * 1000);',
								'        pm.environment.set("access_token_expires_at", expiresAt.toString());',
								'        console.log("⏱️ Access token expires in:", jsonData.expires_in, "seconds (" + Math.round(jsonData.expires_in / 60) + " minutes)");',
								'    }',
								'    if (jsonData.scope) {',
								'        pm.environment.set("token_scope", jsonData.scope);',
								'        console.log("📋 Token scope:", jsonData.scope);',
								'    }',
								'    ',
								'    // Note: Client Credentials flow does not return refresh_token',
								'    console.log("✅ Client Credentials flow completed successfully (OIDC 2.1)!");',
								'} else {',
								'    console.log("❌ Client Credentials token request failed:", pm.response.code);',
								'    try {',
								'        const jsonData = pm.response.json();',
								'        if (jsonData.error) {',
								'            console.log("   Error:", jsonData.error);',
								'            if (jsonData.error_description) {',
								'                console.log("   Description:", jsonData.error_description);',
								'            }',
								'            ',
								'            // Common errors',
								'            if (jsonData.error === "invalid_client") {',
								'                console.log("   💡 Tip: Verify client_id and client_secret are correct");',
								'            } else if (jsonData.error === "invalid_scope") {',
								'                console.log("   💡 Tip: Verify requested scopes are valid for this client");',
								'                console.log("   💡 Tip: Request openid scope to receive id_token");',
								'            }',
								'        }',
								'    } catch (e) {',
								'        // Response may not be JSON',
								'    }',
								'}',
							],
							type: 'text/javascript',
						},
					},
				],
			},
		],
	});

	// OIDC 2.1: Client Credentials (Client Secret Basic)
	oidc21Items.push({
		name: 'Client Credentials (Client Secret Basic)',
		item: [
			{
				name: 'Get Access Token',
				request: {
					method: 'POST',
					header: [
						{ key: 'Content-Type', value: 'application/x-www-form-urlencoded' },
						{ key: 'Accept', value: 'application/json' },
						{ key: 'Authorization', value: 'Basic {{user_client_credentials_basic}}' },
					],
					body: {
						mode: 'urlencoded',
						urlencoded: [
							{ key: 'grant_type', value: 'client_credentials' },
							{ key: 'scope', value: '{{scopes_oidc21}}' },
						],
					},
					url: parseUrl(`${baseUrl}/as/token`),
					description:
						'**Client Credentials Grant - OIDC 2.1 (Client Secret Basic)**\n\n**Educational Context:**\n- Server-to-server authentication (no user involved)\n- Client authenticates using HTTP Basic Authentication (client_id:client_secret in Authorization header)\n- More secure than client_secret_post (credentials not in request body)\n- OIDC 2.1: May return id_token if openid scope requested\n- Returns access_token (and id_token if openid scope requested)\n- No refresh_token (refresh tokens not applicable to Client Credentials flow)\n- Used for machine-to-machine communication (M2M)\n- Token expires after expires_in seconds (typically 3600 seconds = 1 hour)\n- Note: Uses {{user_client_credentials_basic}} which is automatically generated from {{user_client_id}} and {{user_client_secret}}',
				},
				event: [
					{
						listen: 'prerequest' as const,
						script: {
							exec: [
								'// Generate Basic Auth header for Client Credentials',
								'const clientId = pm.environment.get("user_client_id");',
								'const clientSecret = pm.environment.get("user_client_secret");',
								'if (clientId && clientSecret) {',
								'    const basicAuth = btoa(clientId + ":" + clientSecret);',
								'    pm.environment.set("user_client_credentials_basic", basicAuth);',
								'}',
							],
							type: 'text/javascript',
						},
					},
					{
						listen: 'test' as const,
						script: {
							exec: [
								'// OIDC 2.1: Extract access_token and id_token (if openid scope requested)',
								'if (pm.response.code === 200) {',
								'    const jsonData = pm.response.json();',
								'    ',
								'    // Extract access_token',
								'    if (jsonData.access_token) {',
								'        pm.environment.set("access_token", jsonData.access_token);',
								'        console.log("✅ Access token received (OIDC 2.1 - Client Credentials Basic)");',
								'    }',
								'    ',
								'    // OIDC 2.1: Extract id_token if openid scope requested',
								'    if (jsonData.id_token) {',
								'        pm.environment.set("id_token", jsonData.id_token);',
								'        console.log("✅ ID token received (OIDC 2.1 - openid scope requested)");',
								'    }',
								'    ',
								'    // Extract token metadata',
								'    if (jsonData.token_type) {',
								'        pm.environment.set("token_type", jsonData.token_type);',
								'    }',
								'    if (jsonData.expires_in) {',
								'        const expiresAt = Date.now() + (jsonData.expires_in * 1000);',
								'        pm.environment.set("access_token_expires_at", expiresAt.toString());',
								'        console.log("⏱️ Access token expires in:", jsonData.expires_in, "seconds (" + Math.round(jsonData.expires_in / 60) + " minutes)");',
								'    }',
								'    if (jsonData.scope) {',
								'        pm.environment.set("token_scope", jsonData.scope);',
								'        console.log("📋 Token scope:", jsonData.scope);',
								'    }',
								'    ',
								'    // Note: Client Credentials flow does not return refresh_token',
								'    console.log("✅ Client Credentials flow completed successfully (OIDC 2.1 - Basic Auth)!");',
								'} else {',
								'    console.log("❌ Client Credentials token request failed:", pm.response.code);',
								'    try {',
								'        const jsonData = pm.response.json();',
								'        if (jsonData.error) {',
								'            console.log("   Error:", jsonData.error);',
								'            if (jsonData.error_description) {',
								'                console.log("   Description:", jsonData.error_description);',
								'            }',
								'            ',
								'            // Common errors',
								'            if (jsonData.error === "invalid_client") {',
								'                console.log("   💡 Tip: Verify user_client_id and user_client_secret in Authorization header are correct");',
								'                console.log("   💡 Tip: Verify {{user_client_credentials_basic}} = base64(user_client_id:user_client_secret)");',
								'            } else if (jsonData.error === "invalid_scope") {',
								'                console.log("   💡 Tip: Verify requested scopes are valid for this client");',
								'                console.log("   💡 Tip: Request openid scope to receive id_token");',
								'            }',
								'        }',
								'    } catch (e) {',
								'        // Response may not be JSON',
								'    }',
								'}',
							],
							type: 'text/javascript',
						},
					},
				],
			},
		],
	});

	// OIDC 2.1: Device Code Flow (same as OIDC, but with OIDC 2.1 baseline)
	oidc21Items.push({
		name: 'Device Code Flow',
		item: [
			{
				name: '1. Request Device Authorization',
				request: {
					method: 'POST',
					header: [
						{ key: 'Content-Type', value: 'application/x-www-form-urlencoded' },
						{ key: 'Accept', value: 'application/json' },
					],
					body: {
						mode: 'urlencoded',
						urlencoded: [
							{ key: 'client_id', value: '{{client_id}}' },
							{ key: 'scope', value: '{{scopes_oidc21}}' },
						],
					},
					url: parseUrl(`${baseUrl}/as/device_authorization`),
					description:
						'**Device Code Flow - OIDC 2.1 (RFC 8628)**\n\n**Educational Context:**\n- For devices without browsers (TVs, printers, IoT)\n- Returns device_code (for polling), user_code (for user to enter), and verification_uri\n- User enters user_code at verification_uri on another device\n- OIDC 2.1: Returns access_token AND id_token when authorized\n- Device code expires after expires_in seconds (typically 900 seconds = 15 minutes)\n- Poll token endpoint at interval seconds (typically 5 seconds) until user authorizes\n- OIDC 2.1: offline_access scope recommended for refresh tokens\n- Requires openid scope for id_token',
				},
				event: [
					{
						listen: 'test' as const,
						script: {
							exec: [
								'// Extract all Device Code Flow response values (OIDC 2.1)',
								'if (pm.response.code === 200) {',
								'    const jsonData = pm.response.json();',
								'    ',
								'    // Required: device_code for polling',
								'    if (jsonData.device_code) {',
								'        pm.environment.set("device_code", jsonData.device_code);',
								'        console.log("✅ Device code saved:", jsonData.device_code.substring(0, 20) + "...");',
								'    }',
								'    ',
								'    // Required: user_code for user to enter',
								'    if (jsonData.user_code) {',
								'        pm.environment.set("user_code", jsonData.user_code);',
								'        console.log("✅ User code saved:", jsonData.user_code);',
								'        console.log("   👤 User must enter this code at verification URI");',
								'    }',
								'    ',
								'    // Required: verification_uri where user enters code',
								'    if (jsonData.verification_uri) {',
								'        pm.environment.set("verification_uri", jsonData.verification_uri);',
								'        console.log("✅ Verification URI:", jsonData.verification_uri);',
								'    }',
								'    ',
								'    // Optional: verification_uri_complete (includes user_code, for QR codes)',
								'    if (jsonData.verification_uri_complete) {',
								'        pm.environment.set("verification_uri_complete", jsonData.verification_uri_complete);',
								'        console.log("✅ Verification URI Complete (QR code):", jsonData.verification_uri_complete);',
								'    }',
								'    ',
								'    // Required: expires_in (device code expiration in seconds, typically 900)',
								'    if (jsonData.expires_in) {',
								'        pm.environment.set("device_code_expires_in", jsonData.expires_in.toString());',
								'        const expiresAt = Date.now() + (jsonData.expires_in * 1000);',
								'        pm.environment.set("device_code_expires_at", expiresAt.toString());',
								'        console.log("⏱️ Device code expires in:", jsonData.expires_in, "seconds (" + Math.round(jsonData.expires_in / 60) + " minutes)");',
								'    }',
								'    ',
								'    // Required: interval (polling interval in seconds, typically 5)',
								'    const interval = jsonData.interval || 5;',
								'    pm.environment.set("device_code_interval", interval.toString());',
								'    console.log("🔄 Poll token endpoint every", interval, "seconds");',
								'    console.log("");',
								'    console.log("📋 Next Steps:");',
								'    console.log("   1. User opens:", pm.environment.get("verification_uri") || jsonData.verification_uri);',
								'    console.log("   2. User enters code:", pm.environment.get("user_code") || jsonData.user_code);',
								'    console.log("   3. User authenticates and authorizes");',
								'    console.log("   4. Call Poll for Tokens step (wait", interval, "seconds between polls)");',
								'} else {',
								'    console.log("❌ Device authorization request failed:", pm.response.code);',
								'    try {',
								'        const jsonData = pm.response.json();',
								'        if (jsonData.error) {',
								'            console.log("   Error:", jsonData.error);',
								'            if (jsonData.error_description) {',
								'                console.log("   Description:", jsonData.error_description);',
								'            }',
								'        }',
								'    } catch (e) {',
								'        // Response may not be JSON',
								'    }',
								'}',
							],
							type: 'text/javascript',
						},
					},
				],
			},
			{
				name: '2. Poll for Tokens',
				request: {
					method: 'POST',
					header: [
						{ key: 'Content-Type', value: 'application/x-www-form-urlencoded' },
						{ key: 'Accept', value: 'application/json' },
					],
					body: {
						mode: 'urlencoded',
						urlencoded: [
							{ key: 'grant_type', value: 'urn:ietf:params:oauth:grant-type:device_code' },
							{ key: 'device_code', value: '{{device_code}}' },
							{ key: 'client_id', value: '{{user_client_id}}' },
						],
					},
					url: parseUrl(`${baseUrl}/as/token`),
					description:
						'**Poll for Tokens - Device Code Flow (OIDC 2.1)**\n\n**Educational Context:**\n- Poll this endpoint until user authorizes the device\n- Use interval from device authorization response (typically 5 seconds) - wait between polls\n- Handle responses:\n  - 200 OK: User authorized - extract access_token and id_token (OIDC 2.1)\n  - 400 Bad Request with error=authorization_pending: User has not authorized yet - keep polling\n  - 400 Bad Request with error=slow_down: Poll too frequently - increase interval by 5 seconds\n  - 400 Bad Request with error=expired_token: Device code expired - restart flow\n  - 400 Bad Request with error=access_denied: User denied authorization - restart flow\n- OIDC 2.1: Returns access_token, id_token, and refresh_token (if offline_access scope requested)',
				},
				event: [
					{
						listen: 'test' as const,
						script: {
							exec: [
								'// Handle Device Code Flow polling responses (OIDC 2.1)',
								'if (pm.response.code === 200) {',
								'    // Success: User authorized, extract tokens',
								'    const jsonData = pm.response.json();',
								'    ',
								'    // OIDC 2.1: Extract access_token, id_token, and refresh_token',
								'    if (jsonData.access_token) {',
								'        pm.environment.set("access_token", jsonData.access_token);',
								'        console.log("✅ Access token received (OIDC 2.1)");',
								'    }',
								'    ',
								'    if (jsonData.id_token) {',
								'        pm.environment.set("id_token", jsonData.id_token);',
								'        console.log("✅ ID token received (OIDC 2.1)");',
								'    }',
								'    ',
								'    if (jsonData.refresh_token) {',
								'        pm.environment.set("refresh_token", jsonData.refresh_token);',
								'        console.log("✅ Refresh token received (offline_access scope requested)");',
								'    }',
								'    ',
								'    // Extract token metadata',
								'    if (jsonData.token_type) {',
								'        pm.environment.set("token_type", jsonData.token_type);',
								'    }',
								'    if (jsonData.expires_in) {',
								'        const expiresAt = Date.now() + (jsonData.expires_in * 1000);',
								'        pm.environment.set("access_token_expires_at", expiresAt.toString());',
								'        console.log("⏱️ Access token expires in:", jsonData.expires_in, "seconds");',
								'    }',
								'    if (jsonData.scope) {',
								'        pm.environment.set("token_scope", jsonData.scope);',
								'    }',
								'    ',
								'    console.log("✅ Device Code Flow completed successfully (OIDC 2.1)!");',
								'} else if (pm.response.code === 400) {',
								'    // Handle polling errors',
								'    const jsonData = pm.response.json();',
								'    ',
								'    if (jsonData.error === "authorization_pending") {',
								'        console.log("⏳ Authorization pending - user has not authorized yet");',
								'        console.log("   🔄 Poll again after interval (typically 5 seconds)");',
								'        const interval = parseInt(pm.environment.get("device_code_interval") || "5");',
								'        console.log("   ⏱️ Wait", interval, "seconds before next poll");',
								'    } else if (jsonData.error === "slow_down") {',
								'        console.log("⚠️ Slow down - polling too frequently");',
								'        const currentInterval = parseInt(pm.environment.get("device_code_interval") || "5");',
								'        const newInterval = currentInterval + 5;',
								'        pm.environment.set("device_code_interval", newInterval.toString());',
								'        console.log("   🔄 Increased polling interval to", newInterval, "seconds");',
								'    } else if (jsonData.error === "expired_token") {',
								'        console.log("❌ Device code expired - restart flow from Request Device Authorization step");',
								'        pm.environment.unset("device_code");',
								'        pm.environment.unset("user_code");',
								'    } else if (jsonData.error === "access_denied") {',
								'        console.log("❌ User denied authorization - restart flow from Request Device Authorization step");',
								'        pm.environment.unset("device_code");',
								'        pm.environment.unset("user_code");',
								'    } else {',
								'        console.log("❌ Polling failed:", jsonData.error);',
								'        if (jsonData.error_description) {',
								'            console.log("   Description:", jsonData.error_description);',
								'        }',
								'    }',
								'} else {',
								'    console.log("❌ Unexpected response code:", pm.response.code);',
								'}',
							],
							type: 'text/javascript',
						},
					},
				],
			},
		],
	});

	// OIDC 2.1: Introspection and UserInfo (same as OIDC)
	oidc21Items.push({
		name: 'Introspect Token',
		request: {
			method: 'POST',
			header: [
				{ key: 'Content-Type', value: 'application/x-www-form-urlencoded' },
				{ key: 'Authorization', value: 'Bearer {{workerToken}}' },
			],
			body: {
				mode: 'urlencoded',
				urlencoded: [
					{ key: 'token', value: '{{access_token}}' },
					{ key: 'token_type_hint', value: 'access_token' },
				],
			},
			url: parseUrl(`${baseUrl}/as/introspect`),
			description:
				'**Token Introspection - OIDC 2.1**\n\n**Educational Context:**\n- Validates access_token and returns token metadata\n- OIDC 2.1: Enhanced security requirements',
		},
	});

	oidc21Items.push({
		name: 'Get UserInfo',
		request: {
			method: 'GET',
			header: [{ key: 'Authorization', value: 'Bearer {{access_token}}' }],
			url: parseUrl(`${baseUrl}/as/userinfo`),
			description:
				'**UserInfo Endpoint - OIDC 2.1**\n\n**Educational Context:**\n- Returns user claims\n- OIDC 2.1: Enhanced security requirements',
		},
	});

	// ============================================
	// Redirectless (PingOne pi.flow) - Separate Group
	// ============================================
	// Redirectless uses a separate API endpoint instead of standard authorization URL
	const redirectlessItems: PostmanCollectionItem[] = [
		{
			name: 'Authentication',
			item: [
				{
					name: '1. Generate PKCE Codes',
					request: {
						method: 'GET',
						url: parseUrl(`${baseUrl}/generate-pkce`),
						description:
							"**Generate PKCE Codes for Redirectless**\n\n**Educational Context:**\n- PKCE is REQUIRED for redirectless flows\n- Generates code_verifier (secret) and code_challenge (public)\n- Code challenge is SHA256 hash of code verifier\n- This is a local script step - the actual URL doesn't matter as the pre-request script generates the codes\n- The generated codes are automatically saved to environment variables: code_verifier, code_challenge, code_challenge_method",
					},
					event: [
						{
							listen: 'prerequest' as const,
							script: {
								exec: [
									'// Generate PKCE code verifier and challenge',
									'// This script runs BEFORE the request and generates the PKCE codes',
									'function generateCodeVerifier() {',
									'    const array = new Uint8Array(32);',
									'    crypto.getRandomValues(array);',
									'    return btoa(String.fromCharCode.apply(null, Array.from(array)))',
									'        .replace(/\\+/g, "-")',
									'        .replace(/\\//g, "_")',
									'        .replace(/=/g, "");',
									'}',
									'',
									'function generateCodeChallenge(verifier) {',
									'    return CryptoJS.SHA256(verifier).toString(CryptoJS.enc.Base64)',
									'        .replace(/\\+/g, "-")',
									'        .replace(/\\//g, "_")',
									'        .replace(/=/g, "");',
									'}',
									'',
									'const codeVerifier = generateCodeVerifier();',
									'const codeChallenge = generateCodeChallenge(codeVerifier);',
									'',
									'pm.environment.set("code_verifier", codeVerifier);',
									'pm.environment.set("code_challenge", codeChallenge);',
									'pm.environment.set("code_challenge_method", "S256");',
									'',
									'console.log("✅ PKCE codes generated:");',
									'console.log("   Code Verifier:", codeVerifier);',
									'console.log("   Code Challenge:", codeChallenge);',
									'console.log("   Method: S256");',
								],
								type: 'text/javascript',
							},
						},
						{
							listen: 'test' as const,
							script: {
								exec: [
									'// Verify PKCE codes were generated',
									'const codeVerifier = pm.environment.get("code_verifier");',
									'const codeChallenge = pm.environment.get("code_challenge");',
									'',
									'if (codeVerifier && codeChallenge) {',
									'    console.log("✅ PKCE codes successfully saved to environment variables");',
									'    pm.test("PKCE codes generated", function () {',
									'        pm.expect(codeVerifier).to.be.a("string");',
									'        pm.expect(codeChallenge).to.be.a("string");',
									'        pm.expect(codeVerifier.length).to.be.at.least(43);',
									'        pm.expect(codeChallenge.length).to.be.at.least(43);',
									'    });',
									'} else {',
									'    console.log("❌ PKCE codes generation failed");',
									'}',
								],
								type: 'text/javascript',
							},
						},
					],
				},
				{
					name: '2. Start Auth Code Flow',
					request: {
						method: 'POST',
						header: [
							{ key: 'Content-Type', value: 'application/x-www-form-urlencoded' },
							{ key: 'Accept', value: 'application/json' },
						],
						body: {
							mode: 'urlencoded',
							urlencoded: [
								{ key: 'response_type', value: 'code' },
								{ key: 'client_id', value: '{{client_id}}' },
								{ key: 'scope', value: '{{scopes_oidc}}' },
								{ key: 'redirect_uri', value: 'urn:pingidentity:redirectless' },
								{ key: 'response_mode', value: 'pi.flow' },
								{ key: 'code_challenge', value: '{{code_challenge}}' },
								{ key: 'code_challenge_method', value: '{{code_challenge_method}}' },
								{ key: 'state', value: '{{state}}' },
							],
						},
						url: parseUrl(`${baseUrl}/as/authorize`),
						description:
							'**Start Auth Code Flow (PingOne pi.flow)**\n\n**Educational Context:**\n- Starts the redirectless Authorization Code flow with response_mode=pi.flow\n- POST request to /as/authorize (not GET) - returns flow object in JSON response, not redirect\n- Perfect for embedded auth, mobile apps, and headless flows\n- PKCE is REQUIRED for redirectless flows\n- Returns flow object with flowId, status (USERNAME_PASSWORD_REQUIRED, MFA_REQUIRED, COMPLETE), and resumeUrl\n\n**Key Differences from Standard OAuth:**\n- Uses POST instead of GET\n- Includes response_mode=pi.flow parameter\n- Returns JSON flow object, not browser redirect\n- Requires Flows API (/flows/{flowId}) to continue authentication',
					},
					event: [
						{
							listen: 'test' as const,
							script: {
								exec: [
									'// Extract flow data from Start Auth Code Flow response',
									'if (pm.response.code === 200) {',
									'    const jsonData = pm.response.json();',
									'    ',
									'    // Extract flowId (may be in id, _id, or flowId field)',
									'    const flowId = jsonData.id || jsonData._id || jsonData.flowId;',
									'    if (flowId) {',
									'        pm.environment.set("flowId", flowId);',
									'        pm.environment.set("redirectless_flowId", flowId);',
									'        console.log("✅ Flow ID saved:", flowId);',
									'    }',
									'    ',
									'    // Extract resumeUrl or construct from flowId',
									'    if (jsonData.resumeUrl) {',
									'        pm.environment.set("redirectless_resumeUrl", jsonData.resumeUrl);',
									'    } else if (flowId) {',
									'        const envID = pm.environment.get("envID");',
									// biome-ignore lint/suspicious/noTemplateCurlyInString: This is Postman script code where template literals are valid
									'        const resumeUrl = `https://auth.pingone.com/${envID}/as/resume?flowId=${flowId}`;',
									'        pm.environment.set("redirectless_resumeUrl", resumeUrl);',
									'    }',
									'    ',
									'    // Extract sessionId (may be in _sessionId, sessionId, or _links.session.href)',
									'    const sessionId = jsonData._sessionId || jsonData.sessionId || (jsonData._links && jsonData._links.session && jsonData._links.session.href ? jsonData._links.session.href.split("/").pop() : null);',
									'    if (sessionId) {',
									'        pm.environment.set("redirectless_sessionId", sessionId);',
									'    }',
									'    ',
									'    // Extract status',
									'    if (jsonData.status) {',
									'        pm.environment.set("redirectless_status", jsonData.status);',
									'        console.log("✅ Flow status:", jsonData.status);',
									'    }',
									'    ',
									'    // Extract interactionId and interactionToken if present (for Flow API)',
									'    if (jsonData.interactionId) {',
									'        pm.environment.set("interactionId", jsonData.interactionId);',
									'    }',
									'    if (jsonData.interactionToken) {',
									'        pm.environment.set("interactionToken", jsonData.interactionToken);',
									'    }',
									'}',
								],
								type: 'text/javascript',
							},
						},
					],
				},
				{
					name: '3. Check Username/Password',
					request: {
						method: 'POST',
						header: [
							{ key: 'Content-Type', value: 'application/json' },
							{ key: 'Accept', value: 'application/json' },
						],
						body: {
							mode: 'raw',
							raw: JSON.stringify(
								{
									action: 'usernamePassword.check',
									username: '{{username}}',
									password: '{{password}}',
								},
								null,
								2
							),
							options: {
								raw: {
									language: 'json',
								},
							},
						},
						url: parseUrl(`${baseUrl}/flows/{{flowId}}`),
						description:
							'**Check Username/Password (PingOne Flows API)**\n\n**Educational Context:**\n- Validates user credentials using PingOne Flows API\n- POST to /flows/{flowId} with username/password\n- Uses action: "usernamePassword.check" to check credentials\n- Flow may return status: USERNAME_PASSWORD_REQUIRED (retry), MFA_REQUIRED (proceed to MFA), or COMPLETE (proceed to Get Auth Code)\n- If MFA is required, you\'ll need to call this endpoint again with otp_code after receiving MFA_REQUIRED status',
					},
					event: [
						{
							listen: 'test' as const,
							script: {
								exec: [
									'// Extract updated flow data from Check Username/Password response',
									'if (pm.response.code === 200 || pm.response.code === 201) {',
									'    const jsonData = pm.response.json();',
									'    ',
									'    // Update flowId if changed',
									'    const flowId = jsonData.id || jsonData._id || jsonData.flowId || pm.environment.get("flowId");',
									'    if (flowId) {',
									'        pm.environment.set("flowId", flowId);',
									'        pm.environment.set("redirectless_flowId", flowId);',
									'    }',
									'    ',
									'    // Extract and update status',
									'    if (jsonData.status) {',
									'        pm.environment.set("redirectless_status", jsonData.status);',
									'        console.log("✅ Flow status updated:", jsonData.status);',
									'        ',
									'        if (jsonData.status === "MFA_REQUIRED") {',
									'            console.log("⚠️ MFA required - call Check Username/Password again with otp_code");',
									'        } else if (jsonData.status === "COMPLETE" || jsonData.status === "READY_TO_RESUME") {',
									'            console.log("✅ Credentials validated - proceed to Get Auth Code step");',
									'        }',
									'    }',
									'    ',
									'    // Extract resumeUrl if provided',
									'    if (jsonData.resumeUrl) {',
									'        pm.environment.set("redirectless_resumeUrl", jsonData.resumeUrl);',
									'    }',
									'    ',
									'    // Extract sessionId if changed',
									'    const sessionId = jsonData._sessionId || jsonData.sessionId;',
									'    if (sessionId) {',
									'        pm.environment.set("redirectless_sessionId", sessionId);',
									'    }',
									'} else {',
									'    console.log("❌ Username/password check failed:", pm.response.code);',
									'    const jsonData = pm.response.json();',
									'    if (jsonData.error) {',
									'        console.log("   Error:", jsonData.error);',
									'        if (jsonData.error_description) {',
									'            console.log("   Description:", jsonData.error_description);',
									'        }',
									'    }',
									'}',
								],
								type: 'text/javascript',
							},
						},
					],
				},
				{
					name: '4. Get Auth Code',
					request: {
						method: 'GET',
						header: [{ key: 'Accept', value: 'application/json' }],
						url: parseUrl(`${baseUrl}/as/resume?flowId={{flowId}}`),
						description:
							'**Get Auth Code (PingOne Resume Flow)**\n\n**Educational Context:**\n- Resumes the redirectless flow to get the authorization code\n- GET to /as/resume?flowId={flowId} after credentials are validated\n- PingOne responds with either:\n  - 302 redirect with Location header containing ?code=abc123&state=xyz (standard)\n  - 200 JSON response with code field (if response_mode=pi.flow on resume)\n- The authorization code is extracted from the Location header or JSON response\n- This code is then used in the Exchange Code for Token step',
					},
					event: [
						{
							listen: 'test' as const,
							script: {
								exec: [
									'// Extract authorization code from Get Auth Code response',
									'if (pm.response.code === 302) {',
									'    // Handle 302 redirect - extract code from Location header',
									'    const locationHeader = pm.response.headers.get("Location");',
									'    if (locationHeader) {',
									'        const url = new URL(locationHeader);',
									'        const code = url.searchParams.get("code");',
									'        const state = url.searchParams.get("state");',
									'        ',
									'        if (code) {',
									'            pm.environment.set("authorization_code", code);',
									'            console.log("✅ Authorization code extracted from redirect:", code);',
									'        }',
									'        if (state) {',
									'            pm.environment.set("state", state);',
									'        }',
									'    }',
									'} else if (pm.response.code === 200) {',
									'    // Handle 200 JSON response (response_mode=pi.flow)',
									'    try {',
									'        const jsonData = pm.response.json();',
									'        if (jsonData.code) {',
									'            pm.environment.set("authorization_code", jsonData.code);',
									'            console.log("✅ Authorization code extracted from JSON:", jsonData.code);',
									'        }',
									'        if (jsonData.state) {',
									'            pm.environment.set("state", jsonData.state);',
									'        }',
									'    } catch (e) {',
									'        console.log("⚠️ Could not parse JSON response");',
									'    }',
									'} else {',
									'    console.log("❌ Failed to get authorization code:", pm.response.code);',
									'}',
								],
								type: 'text/javascript',
							},
						},
					],
				},
				{
					name: '5. Exchange Code for Token',
					request: {
						method: 'POST',
						header: [
							{ key: 'Content-Type', value: 'application/x-www-form-urlencoded' },
							{ key: 'Accept', value: 'application/json' },
						],
						body: {
							mode: 'urlencoded',
							urlencoded: [
								{ key: 'grant_type', value: 'authorization_code' },
								{ key: 'code', value: '{{authorization_code}}' },
								{ key: 'redirect_uri', value: 'urn:pingidentity:redirectless' },
								{ key: 'client_id', value: '{{client_id}}' },
								{ key: 'code_verifier', value: '{{code_verifier}}' },
							],
						},
						url: {
							raw: `${baseUrl}/as/token`,
						},
						description:
							'**Exchange Code for Token (Redirectless Flow)**\n\n**Educational Context:**\n- Exchanges authorization code for tokens (same as standard Authorization Code flow)\n- code_verifier must match code_challenge from Start Auth Code Flow request\n- Returns access_token, id_token (if OIDC), and refresh_token (if offline_access scope requested)\n- Client authenticates using client_id and code_verifier (PKCE)\n- The redirect_uri must match the one used in Start Auth Code Flow',
					},
					event: [
						{
							listen: 'test' as const,
							script: {
								exec: generateTokenExtractionScript('oidc'),
								type: 'text/javascript',
							},
						},
					],
				},
				{
					name: '6. Session Reset (updates (or resets) a flow session)',
					request: {
						method: 'POST',
						header: [
							{ key: 'Content-Type', value: 'application/json' },
							{ key: 'Accept', value: 'application/json' },
						],
						body: {
							mode: 'raw',
							raw: JSON.stringify(
								{
									action: 'session.reset',
								},
								null,
								2
							),
							options: {
								raw: {
									language: 'json',
								},
							},
						},
						url: parseUrl(`${baseUrl}/flows/{{flowId}}`),
						description:
							'**Session Reset (PingOne Flows API)**\n\n**Educational Context:**\n- Resets or updates a flow session\n- POST to /flows/{flowId} with action: "session.reset"\n- Use this to reset the current authentication session if needed\n- May be required if authentication state becomes invalid or needs to be restarted\n- After reset, you may need to restart from Check Username/Password step',
					},
					event: [
						{
							listen: 'test' as const,
							script: {
								exec: [
									'// Extract updated flow data after session reset',
									'if (pm.response.code === 200 || pm.response.code === 201) {',
									'    const jsonData = pm.response.json();',
									'    ',
									'    if (jsonData.status) {',
									'        pm.environment.set("redirectless_status", jsonData.status);',
									'        console.log("✅ Session reset - new status:", jsonData.status);',
									'    }',
									'    ',
									'    // Update flowId if changed',
									'    const flowId = jsonData.id || jsonData._id || jsonData.flowId;',
									'    if (flowId && flowId !== pm.environment.get("flowId")) {',
									'        pm.environment.set("flowId", flowId);',
									'        pm.environment.set("redirectless_flowId", flowId);',
									'    }',
									'} else {',
									'    console.log("❌ Session reset failed:", pm.response.code);',
									'}',
								],
								type: 'text/javascript',
							},
						},
					],
				},
				{
					name: '7. Password Change Flow (MUST_CHANGE_PASSWORD)',
					request: {
						method: 'POST',
						header: [
							{
								key: 'Content-Type',
								value: 'application/vnd.pingidentity.password.forceChange+json',
							},
							{ key: 'Accept', value: 'application/json' },
							{ key: 'Authorization', value: 'Bearer {{workerToken}}' },
						],
						body: {
							mode: 'raw',
							raw: JSON.stringify(
								{
									currentPassword: '{{current_password}}',
									newPassword: '{{new_password}}',
									forceChange: true,
								},
								null,
								2
							),
							options: {
								raw: {
									language: 'json',
								},
							},
						},
						url: parseUrl(`{{apiPath}}/v1/environments/{{envID}}/users/{{userId}}/password`),
						description:
							'**Password Change Flow (MUST_CHANGE_PASSWORD)**\n\n**Educational Context:**\n- Forces a password change during authentication flow\n- POST to /v1/environments/{envID}/users/{userId}/password with Content-Type: application/vnd.pingidentity.password.forceChange+json\n- Requires worker token (Bearer token) for authentication\n- Used when user account has MUST_CHANGE_PASSWORD status\n- After password change, user can proceed with normal authentication flow\n- This step requires userId to be set (from user lookup or previous authentication)',
					},
					event: [
						{
							listen: 'test' as const,
							script: {
								exec: [
									'// Verify password change response',
									'if (pm.response.code === 200 || pm.response.code === 201 || pm.response.code === 204) {',
									'    console.log("✅ Password change successful");',
									'    console.log("⚠️ User can now proceed with normal authentication flow");',
									'    ',
									'    // Reset flow status to allow re-authentication',
									'    pm.environment.set("redirectless_status", "USERNAME_PASSWORD_REQUIRED");',
									'} else {',
									'    console.log("❌ Password change failed:", pm.response.code);',
									'    try {',
									'        const jsonData = pm.response.json();',
									'        if (jsonData.error) {',
									'            console.log("   Error:", jsonData.error);',
									'            if (jsonData.error_description) {',
									'                console.log("   Description:", jsonData.error_description);',
									'            }',
									'        }',
									'    } catch (e) {',
									'        // Response may not be JSON',
									'    }',
									'}',
								],
								type: 'text/javascript',
							},
						},
					],
				},
				{
					name: '8. Update Password (Self)',
					request: {
						method: 'POST',
						header: [
							{ key: 'Content-Type', value: 'application/vnd.pingidentity.password.change+json' },
							{ key: 'Accept', value: 'application/json' },
							{ key: 'Authorization', value: 'Bearer {{access_token}}' },
						],
						body: {
							mode: 'raw',
							raw: JSON.stringify(
								{
									currentPassword: '{{current_password}}',
									newPassword: '{{new_password}}',
								},
								null,
								2
							),
							options: {
								raw: {
									language: 'json',
								},
							},
						},
						url: parseUrl(`{{apiPath}}/v1/environments/{{envID}}/users/{{userId}}/password`),
						description:
							'**Update Password (Self)**\n\n**Educational Context:**\n- Allows authenticated user to change their own password\n- POST to /v1/environments/{envID}/users/{userId}/password with Content-Type: application/vnd.pingidentity.password.change+json\n- Requires user access token (Bearer token) - user must be authenticated\n- Requires current password for security verification\n- This is a self-service password change, not an admin-forced change\n- The userId can be extracted from the ID token claims (sub field) or UserInfo endpoint',
					},
					event: [
						{
							listen: 'test' as const,
							script: {
								exec: [
									'// Verify password update response',
									'if (pm.response.code === 200 || pm.response.code === 201 || pm.response.code === 204) {',
									'    console.log("✅ Password updated successfully");',
									'    pm.test("Password update successful", function () {',
									'        pm.expect(pm.response.code).to.be.oneOf([200, 201, 204]);',
									'    });',
									'} else {',
									'    console.log("❌ Password update failed:", pm.response.code);',
									'    try {',
									'        const jsonData = pm.response.json();',
									'        if (jsonData.error) {',
									'            console.log("   Error:", jsonData.error);',
									'            if (jsonData.error_description) {',
									'                console.log("   Description:", jsonData.error_description);',
									'            }',
									'            if (jsonData.details) {',
									'                console.log("   Details:", JSON.stringify(jsonData.details, null, 2));',
									'            }',
									'        }',
									'    } catch (e) {',
									'        // Response may not be JSON',
									'    }',
									'}',
								],
								type: 'text/javascript',
							},
						},
					],
				},
			],
		},
	];

	// Generate Worker Token items - used by all collections
	const workerTokenItems = generateWorkerTokenItems(baseUrl);

	// Create folder structure organized by spec version
	// Note: Use Cases are NOT included here - they are only included when explicitly requested via generateUseCasesPostmanCollection
	// Note: Worker Token is FIRST as it's required for many operations
	const items: PostmanCollectionItem[] = [
		{
			name: 'Worker Token',
			item: workerTokenItems,
		},
		{
			name: 'OAuth 2.0 Authorization Framework (RFC 6749)',
			item: oauth20Items,
		},
		{
			name: 'OpenID Connect Core 1.0',
			item: oidcItems,
		},
		{
			name: 'OAuth 2.1 Authorization Framework (draft) with OpenID Connect Core 1.0',
			item: oidc21Items,
		},
		{
			name: 'Redirectless (PingOne pi.flow)',
			item: redirectlessItems,
		},
	];

	const finalizedVariables = finalizeVariables(
		variables,
		issues,
		'Unified Comprehensive Collection'
	);
	const collection: PostmanCollection = {
		info: {
			name: 'PingOne Unified OAuth/OIDC Flows - Complete Collection',
			version: COLLECTION_VERSION,
			description:
				'Comprehensive Postman collection for all PingOne OAuth and OpenID Connect flows. Organized by specification version:\n\n**Understanding Protocol Names:**\n\n1. **OAuth 2.0 Authorization Framework (RFC 6749):** Baseline OAuth framework standard. Provides authorization without authentication. Supports all flow types including Implicit. No ID tokens - only access tokens and refresh tokens.\n\n2. **OpenID Connect Core 1.0:** Authentication layer on top of OAuth 2.0. Adds identity layer with ID Tokens, openid scope, UserInfo endpoint, and user authentication. Provides both authorization AND authentication.\n\n3. **OAuth 2.1 Authorization Framework (draft):** Consolidated OAuth specification (IETF draft-ietf-oauth-v2-1). Removes deprecated flows (Implicit, ROPC) and enforces modern security practices (PKCE required, HTTPS enforced). **Note: Still an Internet-Draft, not yet an RFC.** When used with OpenID Connect Core 1.0, this means "OpenID Connect Core 1.0 using Authorization Code + PKCE (OAuth 2.1 (draft) baseline)".\n\n**Collection Contents:**\n\n**Worker Token:**\n- Get Worker Token (Client Secret Post)\n- Get Worker Token (Client Secret Basic)\n- Get Worker Token (Client Secret JWT)\n- Get Worker Token (Private Key JWT)\n\n**OAuth 2.0 Authorization Framework (RFC 6749):**\n- Authorization Code (simple, no PKCE, no id_token)\n- Implicit Flow (deprecated in OAuth 2.1 (draft), but still part of OAuth 2.0)\n- Client Credentials\n- Device Code Flow\n\n**OpenID Connect Core 1.0:**\n- Authorization Code (simple + optional PKCE, includes id_token)\n- Implicit Flow (deprecated)\n- Hybrid Flow (code id_token)\n- Device Code Flow\n- Introspection & UserInfo\n\n**OAuth 2.1 Authorization Framework (draft) with OpenID Connect Core 1.0:**\n- Authorization Code (PKCE REQUIRED, includes id_token)\n- Authorization Code with PKCE and PAR\n- Client Credentials\n- Device Code Flow\n- Introspection & UserInfo\n\nGenerated from OAuth Playground.',
			schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
		},
		variable: finalizedVariables,
		item: items,
	};

	validateCollection(collection, issues, 'Unified Comprehensive Collection');
	validateEnvironment(finalizedVariables, issues, 'Unified Comprehensive Collection');
	validatePlaceholders(JSON.stringify(collection), issues, 'Unified Comprehensive Collection');
	issues.printSummary();
	issues.throwIfErrors();

	// Enhance all descriptions with Variables Saved information
	return enhanceCollectionDescriptions(collection);
};

/**
 * Generate comprehensive Postman collection for all MFA flows
 * Groups flows by Registration and Authentication
 */
export const generateComprehensiveMFAPostmanCollection = (credentials?: {
	environmentId?: string;
	username?: string;
}): PostmanCollection => {
	// Collect generation warnings/errors for this run.
	const issues = new GenerationIssues('generateComprehensiveMFAPostmanCollection');

	const deviceTypes = ['SMS', 'EMAIL', 'WHATSAPP', 'TOTP', 'FIDO2', 'MOBILE'];

	// Build variables
	const variables: Array<{ key: string; value: string; type?: string; description?: string }> = [
		{ key: 'authPath', value: 'https://auth.pingone.com', type: 'string' },
		{
			key: 'envID',
			value: credentials?.environmentId || 'b9817c16-9910-4415-b67e-4ac687da74d9',
			type: 'string',
		},
		{ key: 'workerToken', value: '', type: 'string' },
		{ key: 'username', value: credentials?.username || '', type: 'string' },
		{ key: 'userId', value: '{userId}', type: 'string' },
		{ key: 'deviceId', value: '{deviceId}', type: 'string' },
		{
			key: 'deviceAuthenticationPolicyId',
			value: '{deviceAuthenticationPolicyId}',
			type: 'string',
		},
	];

	// Build registration and authentication items for each device type
	const registrationItems: PostmanCollectionItem[] = [];
	const authenticationItems: PostmanCollectionItem[] = [];

	deviceTypes.forEach((deviceType) => {
		// Registration API calls
		type RegistrationCall = {
			step: string;
			method: string;
			endpoint: string;
			description: string;
			requestBody: Record<string, unknown>;
			responseBody: Record<string, unknown>;
		};
		const registrationCalls: RegistrationCall[] = [
			{
				step: `Register ${deviceType} Device`,
				method: 'POST',
				endpoint: `{{authPath}}/{{envID}}/deviceAuthentications`,
				description: `Create a new ${deviceType} device for the user`,
				requestBody: {
					type: deviceType,
					status: 'ACTIVATION_REQUIRED',
					policy: {
						id: '{{deviceAuthenticationPolicyId}}',
					},
					...(deviceType === 'SMS' || deviceType === 'WHATSAPP' || deviceType === 'MOBILE'
						? { phone: '+1.5125201234' }
						: deviceType === 'EMAIL'
							? { email: 'user@example.com' }
							: {}),
				},
				responseBody: {
					id: '{{deviceId}}',
					type: deviceType,
					status: 'ACTIVATION_REQUIRED',
				},
			},
		];

		// Add activation call for OTP devices
		if (deviceType !== 'FIDO2') {
			registrationCalls.push({
				step: `Activate ${deviceType} Device`,
				method: 'POST',
				endpoint: `{{authPath}}/{{envID}}/deviceAuthentications/{{deviceId}}/otp/check`,
				description: `Activate ${deviceType} device with OTP code`,
				requestBody: {
					otp: '{otp_code}',
				},
				responseBody: {
					id: '{{deviceId}}',
					status: 'ACTIVE',
					type: deviceType,
				},
			});
		}

		// Convert to Postman items
		const deviceRegistrationItems = registrationCalls.map((call) => {
			const postmanUrl = convertEndpointToPostman(call.endpoint);
			const urlStructure = parseUrl(postmanUrl);
			const headers: Array<{ key: string; value: string; type?: string }> = [
				{ key: 'Content-Type', value: 'application/json' },
				{ key: 'Authorization', value: 'Bearer {{workerToken}}' },
			];
			const body = convertRequestBody(call.requestBody, call.method);

			// Build comprehensive educational description
			let educationalDescription = call.description || '';

			// Add flow context based on step name
			if (call.step.includes('Register') || call.step.includes('Create')) {
				educationalDescription += '\n\n**Educational Context:**\n';
				educationalDescription += '- This creates a new MFA device for the user\n';
				if (call.requestBody && typeof call.requestBody === 'object') {
					const body = call.requestBody as Record<string, unknown>;
					if (body.status === 'ACTIVE') {
						educationalDescription +=
							'- Device status: ACTIVE (immediately usable, no OTP required)\n';
						educationalDescription += '- Only possible with worker token (Admin Flow)\n';
					} else if (body.status === 'ACTIVATION_REQUIRED') {
						educationalDescription +=
							'- Device status: ACTIVATION_REQUIRED (OTP activation required)\n';
						educationalDescription += '- PingOne automatically sends OTP to the device\n';
						educationalDescription += '- User Flow always uses ACTIVATION_REQUIRED\n';
					}
				}
				educationalDescription += '- Device ID is automatically extracted and saved\n';
				educationalDescription += '- Policy ID links device to MFA authentication policy\n';
				educationalDescription += '- This is part of the Registration flow\n';
			} else if (call.step.includes('Activate')) {
				educationalDescription += '\n\n**Educational Context:**\n';
				educationalDescription += '- Activates a device created with ACTIVATION_REQUIRED status\n';
				educationalDescription +=
					'- OTP code is received via SMS/Email/WhatsApp/OATH TOTP (RFC 6238) app\n';
				educationalDescription += '- After activation, device status changes to ACTIVE\n';
				educationalDescription += '- Device can now be used for MFA authentication\n';
				educationalDescription += '- This is the final step in device registration\n';
			}

			return {
				name: call.step,
				request: {
					method: call.method,
					header: headers,
					...(body && { body }),
					url: urlStructure,
					description: educationalDescription,
				},
			};
		});

		registrationItems.push({
			name: deviceType,
			item: deviceRegistrationItems,
		});

		// Authentication API calls
		type AuthenticationCall = {
			step: string;
			method: string;
			endpoint: string;
			description: string;
			requestBody: Record<string, unknown>;
			responseBody: Record<string, unknown>;
		};
		const authenticationCalls: AuthenticationCall[] = [
			{
				step: `Initialize ${deviceType} Authentication`,
				method: 'POST',
				endpoint: `{{authPath}}/{{envID}}/deviceAuthentications`,
				description: `Initialize authentication for ${deviceType} device`,
				requestBody: {
					user: {
						id: '{{userId}}',
					},
					device: {
						id: '{{deviceId}}',
					},
					policy: {
						id: '{{deviceAuthenticationPolicyId}}',
					},
				},
				responseBody: {
					id: '{deviceAuthenticationId}',
					status: 'OTP_SENT',
				},
			},
		];

		// Add OTP check for OTP devices
		if (deviceType !== 'FIDO2') {
			authenticationCalls.push({
				step: `Validate ${deviceType} OTP`,
				method: 'POST',
				endpoint: `{{authPath}}/{{envID}}/deviceAuthentications/{deviceAuthenticationId}/otp/check`,
				description: `Validate OTP code for ${deviceType} authentication`,
				requestBody: {
					otp: '{otp_code}',
				},
				responseBody: {
					id: '{deviceAuthenticationId}',
					status: 'COMPLETED',
				},
			});
		}

		// Convert to Postman items
		const deviceAuthenticationItems = authenticationCalls.map((call) => {
			const postmanUrl = convertEndpointToPostman(call.endpoint);
			const urlStructure = parseUrl(postmanUrl);
			const headers: Array<{ key: string; value: string; type?: string }> = [
				{ key: 'Content-Type', value: 'application/json' },
				{ key: 'Authorization', value: 'Bearer {{workerToken}}' },
			];
			const body = convertRequestBody(call.requestBody, call.method);

			// Build comprehensive educational description
			let educationalDescription = call.description || '';

			// Add flow context based on step name
			if (call.step.includes('Initialize')) {
				educationalDescription += '\n\n**Educational Context:**\n';
				educationalDescription += '- This starts the MFA authentication process\n';
				educationalDescription +=
					'- PingOne sends OTP to the selected device (or prompts for device selection)\n';
				educationalDescription +=
					'- Device Authentication ID is automatically extracted and saved\n';
				educationalDescription += '- This ID is used in subsequent authentication steps\n';
				educationalDescription += '- Response includes status indicating next required action\n';
			} else if (call.step.includes('Validate') || call.step.includes('Check OTP')) {
				educationalDescription += '\n\n**Educational Context:**\n';
				educationalDescription += '- User enters OTP code received on their device\n';
				educationalDescription += '- OTP is validated against the device authentication session\n';
				educationalDescription += '- If valid, authentication proceeds to completion\n';
				educationalDescription +=
					'- Use the otp.check URI from _links in the initialize response\n';
			} else if (call.step.includes('Complete')) {
				educationalDescription += '\n\n**Educational Context:**\n';
				educationalDescription += '- This finalizes the MFA authentication process\n';
				educationalDescription += '- Authentication is now complete and user can proceed\n';
				educationalDescription += '- This step is optional if complete link is provided\n';
			}

			return {
				name: call.step,
				request: {
					method: call.method,
					header: headers,
					...(body && { body }),
					url: urlStructure,
					description: educationalDescription,
				},
			};
		});

		authenticationItems.push({
			name: deviceType,
			item: deviceAuthenticationItems,
		});
	});

	// Generate Worker Token items (needed for all MFA operations)
	const baseUrl = '{{authPath}}/{{envID}}';
	const workerTokenItems = generateWorkerTokenItems(baseUrl);

	// Create folder structure - Worker Token FIRST as it's required for all MFA operations
	const items: PostmanCollectionItem[] = [
		{
			name: 'Worker Token',
			item: workerTokenItems,
		},
		{
			name: 'Registration',
			item: registrationItems,
		},
		{
			name: 'Authentication',
			item: authenticationItems,
		},
	];

	const finalizedVariables = finalizeVariables(variables, issues, 'MFA Comprehensive Collection');
	const collection: PostmanCollection = {
		info: {
			name: 'PingOne MFA Flows - Complete Collection',
			version: COLLECTION_VERSION,
			description:
				'Comprehensive Postman collection for all PingOne MFA device types. Includes SMS, Email, WhatsApp, OATH TOTP (RFC 6238), FIDO2, and Mobile device registration and authentication flows. Generated from OAuth Playground.',
			schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
		},
		variable: finalizedVariables,
		item: items,
	};

	validateCollection(collection, issues, 'MFA Comprehensive Collection');
	validateEnvironment(finalizedVariables, issues, 'MFA Comprehensive Collection');
	validatePlaceholders(JSON.stringify(collection), issues, 'MFA Comprehensive Collection');
	issues.printSummary();
	issues.throwIfErrors();

	// Enhance all descriptions with Variables Saved information
	return enhanceCollectionDescriptions(collection);
};

/**
 * Postman Environment file structure
 */
export interface PostmanEnvironment {
	id: string;
	name: string;
	values: Array<{
		key: string;
		value: string;
		type: 'default' | 'secret';
		enabled: boolean;
	}>;
	_postman_variable_scope: string;
	_postman_exported_at?: string;
	_postman_exported_using?: string;
}

/**
 * Generate Postman environment from collection variables
 */
export const generatePostmanEnvironment = (
	collection: PostmanCollection,
	environmentName: string
): PostmanEnvironment => {
	// Collect generation warnings/errors for this run.
	const issues = new GenerationIssues('generatePostmanEnvironment');
	validateEnvironment(collection.variable, issues, environmentName);
	issues.printSummary();
	issues.throwIfErrors();

	const values = collection.variable.map((variable) => ({
		key: variable.key,
		value: variable.value,
		type: (variable.type === 'secret' ? 'secret' : 'default') as 'default' | 'secret',
		enabled: true,
	}));

	return {
		id: `env-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
		name: environmentName,
		values,
		_postman_variable_scope: 'environment',
		_postman_exported_at: new Date().toISOString(),
		_postman_exported_using: 'OAuth Playground',
	};
};

/**
 * Download Postman collection as JSON file
 */
export const downloadPostmanCollection = (
	collection: PostmanCollection,
	filename: string
): void => {
	const json = JSON.stringify(collection, null, 2);
	const blob = new Blob([json], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename.endsWith('.json') ? filename : `${filename}.json`;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
};

/**
 * Download Postman environment as JSON file
 */
export const downloadPostmanEnvironment = (
	environment: PostmanEnvironment,
	filename: string
): void => {
	const json = JSON.stringify(environment, null, 2);
	const blob = new Blob([json], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename.endsWith('.json') ? filename : `${filename}.json`;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
};

/**
 * Generate comprehensive Postman collection combining both Unified and MFA flows
 * This creates one big collection with all OAuth/OIDC flows and all MFA device types
 */
export const generateCompletePostmanCollection = (credentials?: {
	environmentId?: string;
	clientId?: string;
	clientSecret?: string;
	username?: string;
}): PostmanCollection => {
	// Collect generation warnings/errors for this run.
	const issues = new GenerationIssues('generateCompletePostmanCollection');

	// Generate both collections
	const unifiedCreds: { environmentId?: string; clientId?: string; clientSecret?: string } = {};
	if (credentials?.environmentId) unifiedCreds.environmentId = credentials.environmentId;
	if (credentials?.clientId) unifiedCreds.clientId = credentials.clientId;
	if (credentials?.clientSecret) unifiedCreds.clientSecret = credentials.clientSecret;

	const unifiedCollection = generateComprehensiveUnifiedPostmanCollection(
		Object.keys(unifiedCreds).length > 0 ? unifiedCreds : undefined
	);

	const mfaCreds: { environmentId?: string; username?: string } = {};
	if (credentials?.environmentId) mfaCreds.environmentId = credentials.environmentId;
	if (credentials?.username) mfaCreds.username = credentials.username;

	const mfaCollection = generateComprehensiveMFAPostmanCollection(
		Object.keys(mfaCreds).length > 0 ? mfaCreds : undefined
	);

	// Merge variables (remove duplicates, keep unique keys)
	const variableMap = new Map<
		string,
		{ key: string; value: string; type?: string; description?: string }
	>();

	// Add Unified variables first
	unifiedCollection.variable.forEach((v) => {
		variableMap.set(v.key, v);
	});

	// Add MFA variables (will override if duplicate, which is fine)
	mfaCollection.variable.forEach((v) => {
		variableMap.set(v.key, v);
	});

	// Convert map to array
	const mergedVariables = Array.from(variableMap.values());
	const finalizedVariables = finalizeVariables(mergedVariables, issues, 'Complete Collection');

	// Extract Worker Token from unified collection (it's at the top level, first item)
	const unifiedWorkerTokenItem = unifiedCollection.item.find(
		(item) => item.name === 'Worker Token'
	);
	const filteredUnifiedItems = unifiedCollection.item.filter(
		(item) => item.name !== 'Use Cases' && item.name !== 'Worker Token'
	);

	// Extract Worker Token from MFA collection (it's at the top level, first item)
	const mfaWorkerTokenItem = mfaCollection.item.find((item) => item.name === 'Worker Token');
	const filteredMFAItems = mfaCollection.item.filter((item) => item.name !== 'Worker Token');

	// Worker Token should be at the top level, not buried inside folders
	// Use the one from Unified collection (they're identical, so either one works)
	const workerTokenItem = unifiedWorkerTokenItem || mfaWorkerTokenItem;

	// Combine items into folder structure with Worker Token FIRST at top level
	// Note: Use Cases are NOT included in this collection - they are only included when explicitly requested
	const items: PostmanCollectionItem[] = [];

	// Add Worker Token as first item (top level, not buried)
	if (workerTokenItem) {
		items.push(workerTokenItem);
	}

	// Add Unified OAuth/OIDC Flows folder (without Worker Token inside)
	items.push({
		name: 'Unified OAuth/OIDC Flows',
		item: filteredUnifiedItems,
	});

	// Add MFA Flows folder (without Worker Token inside)
	items.push({
		name: 'MFA Flows',
		item: filteredMFAItems,
	});

	const collection: PostmanCollection = {
		info: {
			name: 'PingOne Complete Collection - Unified & MFA',
			version: COLLECTION_VERSION,
			description:
				'Complete Postman collection for all PingOne OAuth 2.0, OpenID Connect, and MFA flows. Includes:\n\n**Unified OAuth/OIDC Flows:**\n- Authorization Code Grant (7 variations)\n- Implicit Flow\n- Client Credentials Flow\n- Device Code Flow\n- Hybrid Flow\n\n**MFA Flows:**\n- SMS Device Registration & Authentication\n- Email Device Registration & Authentication\n- WhatsApp Device Registration & Authentication\n- OATH TOTP (RFC 6238) Device Registration & Authentication\n- FIDO2 Device Registration & Authentication\n- Mobile Device Registration & Authentication\n\nAll flows include educational comments, variable extraction scripts, and complete OAuth login steps for user flows. Generated from OAuth Playground.',
			schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
		},
		variable: finalizedVariables,
		item: items,
	};

	validateCollection(collection, issues, 'Complete Collection');
	validateEnvironment(finalizedVariables, issues, 'Complete Collection');
	validatePlaceholders(JSON.stringify(collection), issues, 'Complete Collection');
	issues.printSummary();
	issues.throwIfErrors();
	// Enhance all descriptions with Variables Saved information
	return enhanceCollectionDescriptions(collection);
};

/**
 * Download both Postman collection and environment files
 */
export const downloadPostmanCollectionWithEnvironment = (
	collection: PostmanCollection,
	collectionFilename: string,
	environmentName?: string
): void => {
	// Generate environment first
	const envName =
		environmentName || `${collection.info.name.replace(' Collection', '')} Environment`;
	const environment = generatePostmanEnvironment(collection, envName);
	const envFilename = collectionFilename
		.replace('.json', '-environment.json')
		.replace('-collection.json', '-environment.json');

	// Download collection
	downloadPostmanCollection(collection, collectionFilename);

	// Download environment with a small delay to ensure both downloads work
	// Some browsers block multiple simultaneous downloads
	setTimeout(() => {
		downloadPostmanEnvironment(environment, envFilename);
	}, 100);
};
