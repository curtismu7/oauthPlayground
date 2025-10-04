// src/services/enhancedApiCallDisplayService.ts
// Enhanced API Call Display Service with OAuth-specific features

// Enhanced interfaces
export interface EnhancedApiCallData {
	method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
	url: string;
	headers?: Record<string, string>;
	body?: string | object | null;
	queryParams?: Record<string, string>;
	response?: {
		status: number;
		statusText: string;
		headers?: Record<string, string>;
		data?: unknown;
		error?: string;
	};
	timestamp?: Date;
	duration?: number;
	// OAuth-specific fields
	flowType?: 'authorization-code' | 'implicit' | 'client-credentials' | 'device-code' | 'rar' | 'hybrid' | 'ciba' | 'worker-token';
	stepName?: string;
	description?: string;
	educationalNotes?: string[];
}

export interface URLHighlightRule {
	pattern: string | RegExp;
	label: string;
	description: string;
	color?: string;
	backgroundColor?: string;
}

export interface ApiCallDisplayOptions {
	includeHeaders?: boolean;
	includeBody?: boolean;
	includeQueryParams?: boolean;
	prettyPrint?: boolean;
	verbose?: boolean;
	insecure?: boolean;
	showEducationalNotes?: boolean;
	showFlowContext?: boolean;
	theme?: 'light' | 'dark';
	urlHighlightRules?: URLHighlightRule[];
}

export interface ApiCallDisplayResult {
	formattedCall: string;
	curlCommand: string;
	responseSummary: string;
	timingInfo?: string;
	educationalNotes?: string[];
	flowContext?: string;
}

export class EnhancedApiCallDisplayService {
	/**
	 * Generate OAuth flow-specific API call templates
	 */
	static createOAuthTemplate(flowType: string, stepName: string, config: Record<string, unknown>): EnhancedApiCallData {
		const templates: Record<string, Record<string, Partial<EnhancedApiCallData>>> = {
			'authorization-code': {
				'authorization-request': {
					method: 'GET' as const,
					url: `https://auth.pingone.com/${config.environmentId as string}/as/authorize`,
					queryParams: {
						response_type: 'code',
						client_id: config.clientId as string,
						redirect_uri: config.redirectUri as string,
						scope: (config.scopes as string[])?.join(' ') || 'openid profile email',
						state: 'random-state-value'
					},
					description: 'Initiate OAuth 2.0 Authorization Code flow',
					educationalNotes: [
						'The user will be redirected to this URL to authenticate',
						'After authentication, the user will be redirected back with an authorization code',
						'The state parameter helps prevent CSRF attacks'
					]
				},
				'token-exchange': {
					method: 'POST' as const,
					url: `https://auth.pingone.com/${config.environmentId as string}/as/token`,
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
						'Authorization': `Basic ${btoa(`${config.clientId as string}:${config.clientSecret as string}`)}`
					},
					body: {
						grant_type: 'authorization_code',
						code: '[authorization_code]',
						redirect_uri: config.redirectUri as string
					},
					description: 'Exchange authorization code for access token',
					educationalNotes: [
						'This request exchanges the authorization code for an access token',
						'Client credentials are sent via Basic authentication',
						'The response will contain access_token and refresh_token'
					]
				}
			},
			'rar': {
				'authorization-request': {
					method: 'GET' as const,
					url: `https://auth.pingone.com/${config.environmentId as string}/as/authorize`,
					queryParams: {
						response_type: 'code',
						client_id: config.clientId as string,
						redirect_uri: config.redirectUri as string,
						scope: (config.scopes as string[])?.join(' ') || 'openid profile email',
						state: 'rar-flow-state',
						authorization_details: JSON.stringify({
							type: 'oauth_authorization_details',
							authorization_details: (config.authorizationDetails as unknown[]) || []
						})
					},
					description: 'Initiate RAR (Rich Authorization Requests) flow',
					educationalNotes: [
						'RAR extends OAuth 2.0 with granular authorization details',
						'The authorization_details parameter specifies exact permissions',
						'This enables fine-grained access control for APIs'
					]
				},
				'token-exchange': {
					method: 'POST' as const,
					url: `https://auth.pingone.com/${config.environmentId as string}/as/token`,
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
						'Authorization': `Basic ${btoa(`${config.clientId as string}:${config.clientSecret as string}`)}`
					},
					body: {
						grant_type: 'authorization_code',
						code: (config.authorizationCode as string) || '[authorization_code]',
						redirect_uri: config.redirectUri as string
					},
					description: 'Exchange authorization code for access token with RAR claims',
					educationalNotes: [
						'The access token will contain authorization_details as claims',
						'These claims specify exactly what the client is authorized to do',
						'Resource servers can use these claims for fine-grained authorization'
					]
				}
			}
		};

		const flowTemplates = templates[flowType];
		if (!flowTemplates) {
			throw new Error(`Flow type not supported: ${flowType}`);
		}

		const template = flowTemplates[stepName];
		if (!template) {
			throw new Error(`Step not found for flow ${flowType}: ${stepName}`);
		}

		return {
			...template,
			flowType: flowType as EnhancedApiCallData['flowType'],
			stepName,
			timestamp: new Date()
		} as EnhancedApiCallData;
	}

	/**
	 * Generate URL highlighting rules based on flow type
	 */
	static getDefaultHighlightRules(flowType?: string): URLHighlightRule[] {
		const rules: URLHighlightRule[] = [];

		switch (flowType) {
			case 'rar':
				rules.push({
					pattern: 'authorization_details=',
					label: 'RAR Parameter',
					description: 'Rich Authorization Requests parameter containing granular authorization requirements',
					color: '#92400e',
					backgroundColor: '#fef3c7'
				});
				break;
			case 'par':
				rules.push({
					pattern: 'request_uri=',
					label: 'PAR Parameter',
					description: 'Pushed Authorization Request URI parameter',
					color: '#1e40af',
					backgroundColor: '#dbeafe'
				});
				break;
			case 'pkce':
				rules.push(
					{
						pattern: 'code_challenge=',
						label: 'PKCE Challenge',
						description: 'PKCE code challenge parameter for security',
						color: '#059669',
						backgroundColor: '#d1fae5'
					},
					{
						pattern: 'code_challenge_method=',
						label: 'PKCE Method',
						description: 'PKCE challenge method (S256 recommended)',
						color: '#059669',
						backgroundColor: '#d1fae5'
					}
				);
				break;
			case 'oidc':
				rules.push(
					{
						pattern: 'nonce=',
						label: 'Nonce',
						description: 'OIDC nonce parameter for ID token binding',
						color: '#7c3aed',
						backgroundColor: '#ede9fe'
					},
					{
						pattern: 'prompt=',
						label: 'Prompt',
						description: 'OIDC prompt parameter for user interaction control',
						color: '#7c3aed',
						backgroundColor: '#ede9fe'
					}
				);
				break;
			case 'worker-token':
				rules.push(
					{
						pattern: 'grant_type=',
						label: 'Grant Type',
						description: 'OAuth 2.0 grant type (client_credentials for worker tokens)',
						color: '#dc2626',
						backgroundColor: '#fef2f2'
					},
					{
						pattern: 'scope=',
						label: 'Scope',
						description: 'OAuth 2.0 scope parameter defining access permissions',
						color: '#dc2626',
						backgroundColor: '#fef2f2'
					}
				);
				break;
		}

		return rules;
	}

	/**
	 * Highlight URL parts based on provided rules
	 */
	static highlightURL(url: string, rules: URLHighlightRule[] = []): Array<{
		content: string;
		isHighlighted: boolean;
		label?: string;
		description?: string;
		color?: string | undefined;
		backgroundColor?: string | undefined;
	}> {
		if (!url || rules.length === 0) {
			return [{ content: url, isHighlighted: false }];
		}

		const parts: Array<{
			content: string;
			isHighlighted: boolean;
			label?: string;
			description?: string;
			color?: string | undefined;
			backgroundColor?: string | undefined;
		}> = [];

		let remainingUrl = url;
		let lastIndex = 0;

		// Find all matches for all rules
		const matches: Array<{
			start: number;
			end: number;
			rule: URLHighlightRule;
		}> = [];

		rules.forEach(rule => {
			const pattern = typeof rule.pattern === 'string' ? new RegExp(rule.pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g') : rule.pattern;
			let match;
			while ((match = pattern.exec(remainingUrl)) !== null) {
				matches.push({
					start: match.index,
					end: match.index + match[0].length,
					rule
				});
			}
		});

		// Sort matches by start position
		matches.sort((a, b) => a.start - b.start);

		// Build highlighted parts
		matches.forEach((match) => {
			// Add non-highlighted content before this match
			if (match.start > lastIndex) {
				parts.push({
					content: remainingUrl.substring(lastIndex, match.start),
					isHighlighted: false
				});
			}

			// Add highlighted content
			parts.push({
				content: remainingUrl.substring(match.start, match.end),
				isHighlighted: true,
				label: match.rule.label,
				description: match.rule.description,
				color: match.rule.color || undefined,
				backgroundColor: match.rule.backgroundColor || undefined
			});

			lastIndex = match.end;
		});

		// Add remaining non-highlighted content
		if (lastIndex < remainingUrl.length) {
			parts.push({
				content: remainingUrl.substring(lastIndex),
				isHighlighted: false
			});
		}

		return parts;
	}

	/**
	 * Generate enhanced curl command with better formatting
	 */
	static generateEnhancedCurlCommand(apiCall: EnhancedApiCallData, options: ApiCallDisplayOptions = {}): string {
		const { includeHeaders = true, includeBody = true, includeQueryParams = true, verbose = false, insecure = false } = options;

		let curlCommand = 'curl';
		const lines: string[] = [];

		// Add flags
		if (verbose) curlCommand += ' -v';
		if (insecure) curlCommand += ' -k';

		// Add method
		if (apiCall.method !== 'GET') {
			curlCommand += ` -X ${apiCall.method}`;
		}

		// Add headers
		if (includeHeaders && apiCall.headers) {
			Object.entries(apiCall.headers).forEach(([key, value]) => {
				lines.push(`  -H "${key}: ${value}"`);
			});
		}

		// Add query parameters
		if (includeQueryParams && apiCall.queryParams) {
			const queryString = new URLSearchParams(apiCall.queryParams).toString();
			if (queryString) {
				lines.push(`  -G --data-urlencode "${queryString}"`);
			}
		}

		// Add body data
		if (includeBody && apiCall.body) {
			let bodyData = '';
			if (typeof apiCall.body === 'string') {
				bodyData = apiCall.body;
			} else if (typeof apiCall.body === 'object') {
				bodyData = JSON.stringify(apiCall.body);
				if (!apiCall.headers?.['Content-Type']) {
					lines.push(`  -H "Content-Type: application/json"`);
				}
			}

			if (bodyData) {
				const escapedBody = bodyData.replace(/"/g, '\\"');
				lines.push(`  -d "${escapedBody}"`);
			}
		}

		// Add URL
		lines.push(`  "${apiCall.url}"`);

		// Format multi-line curl command
		if (lines.length > 0) {
			curlCommand += ' \\\n' + lines.join(' \\\n');
		} else {
			curlCommand += ` "${apiCall.url}"`;
		}

		return curlCommand;
	}

	/**
	 * Format API call as readable text
	 */
	static formatApiCallText(apiCall: EnhancedApiCallData, prettyPrint: boolean = true): string {
		let result = `${apiCall.method} ${apiCall.url}`;

		if (apiCall.queryParams && Object.keys(apiCall.queryParams).length > 0) {
			result += '\nQuery Parameters:';
			Object.entries(apiCall.queryParams).forEach(([key, value]) => {
				result += `\n  ${key}: ${value}`;
			});
		}

		if (apiCall.headers && Object.keys(apiCall.headers).length > 0) {
			result += '\nHeaders:';
			Object.entries(apiCall.headers).forEach(([key, value]) => {
				result += `\n  ${key}: ${value}`;
			});
		}

		if (apiCall.body) {
			result += '\nBody:';
			if (typeof apiCall.body === 'string') {
				result += `\n  ${apiCall.body}`;
			} else if (typeof apiCall.body === 'object') {
				if (prettyPrint) {
					result += `\n  ${JSON.stringify(apiCall.body, null, 2)}`;
				} else {
					result += `\n  ${JSON.stringify(apiCall.body)}`;
				}
			}
		}

		return result;
	}

	/**
	 * Format response summary
	 */
	static formatResponseSummary(apiCall: EnhancedApiCallData): string {
		if (!apiCall.response) {
			return 'No response received';
		}

		const { status, statusText, data, error } = apiCall.response;
		let summary = `HTTP ${status} ${statusText}`;

		if (error) {
			summary += `\nError: ${error}`;
		} else if (data) {
			summary += '\nResponse:';
			if (typeof data === 'string') {
				summary += `\n  ${data}`;
			} else if (typeof data === 'object') {
				try {
					summary += `\n  ${JSON.stringify(data, null, 2)}`;
				} catch {
					summary += `\n  ${String(data)}`;
				}
			} else {
				summary += `\n  ${String(data)}`;
			}
		}

		return summary;
	}

	/**
	 * Format timing information
	 */
	static formatTimingInfo(duration: number): string {
		if (duration < 1000) {
			return `Duration: ${duration}ms`;
		} else {
			const seconds = (duration / 1000).toFixed(2);
			return `Duration: ${seconds}s`;
		}
	}

	/**
	 * Determine API call status based on response
	 */
	static getApiCallStatus(apiCall: EnhancedApiCallData): 'success' | 'error' | 'pending' | 'info' {
		if (apiCall.response) {
			if (apiCall.response.status >= 200 && apiCall.response.status < 300) {
				return 'success';
			} else if (apiCall.response.status >= 400) {
				return 'error';
			}
		}
		return 'info';
	}

	/**
	 * Track API call execution
	 */
	static async trackApiCall(
		apiCall: EnhancedApiCallData, 
		executeFn: () => Promise<Response>
	): Promise<EnhancedApiCallData> {
		const startTime = Date.now();
		
		try {
			const response = await executeFn();
			const duration = Date.now() - startTime;
			
			const responseData = await response.json().catch(() => null);
			
			return {
				...apiCall,
				response: {
					status: response.status,
					statusText: response.statusText,
					headers: Object.fromEntries(response.headers.entries()),
					data: responseData
				},
				duration,
				timestamp: new Date()
			};
		} catch (error) {
			const duration = Date.now() - startTime;
			
			return {
				...apiCall,
				response: {
					status: 0,
					statusText: 'Network Error',
					error: error instanceof Error ? error.message : 'Unknown error'
				},
				duration,
				timestamp: new Date()
			};
		}
	}

	/**
	 * Create a complete display string with all API call information
	 */
	static createFullDisplay(apiCall: EnhancedApiCallData, options: ApiCallDisplayOptions = {}): string {
		const curlCommand = this.generateEnhancedCurlCommand(apiCall, options);
		const formattedCall = this.formatApiCallText(apiCall, options.prettyPrint);
		const responseSummary = this.formatResponseSummary(apiCall);
		const timingInfo = apiCall.duration ? this.formatTimingInfo(apiCall.duration) : undefined;

		let display = '🚀 API Call Details\n';
		display += '='.repeat(50) + '\n\n';

		display += '📤 Request:\n';
		display += formattedCall + '\n\n';

		display += '💻 cURL Command:\n';
		display += curlCommand + '\n\n';

		display += '📥 Response:\n';
		display += responseSummary + '\n';

		if (timingInfo) {
			display += '\n⏱️  ' + timingInfo + '\n';
		}

		if (apiCall.educationalNotes && apiCall.educationalNotes.length > 0) {
			display += '\n📚 Educational Notes:\n';
			apiCall.educationalNotes.forEach((note, index) => {
				display += `${index + 1}. ${note}\n`;
			});
		}

		return display;
	}
}

// Export utility functions
export const createOAuthTemplate = (flowType: string, stepName: string, config: Record<string, unknown>) =>
	EnhancedApiCallDisplayService.createOAuthTemplate(flowType, stepName, config);

export const generateEnhancedCurlCommand = (apiCall: EnhancedApiCallData, options?: ApiCallDisplayOptions) =>
	EnhancedApiCallDisplayService.generateEnhancedCurlCommand(apiCall, options);

export const trackApiCall = (apiCall: EnhancedApiCallData, executeFn: () => Promise<Response>) =>
	EnhancedApiCallDisplayService.trackApiCall(apiCall, executeFn);