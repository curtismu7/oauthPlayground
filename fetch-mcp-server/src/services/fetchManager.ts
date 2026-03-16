import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import * as cheerio from 'cheerio';
import { URL } from 'url';

export interface FetchRequest {
	url: string;
	method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
	headers?: Record<string, string>;
	body?: string;
	timeout?: number;
	allowRedirects?: boolean;
	validateSSL?: boolean;
}

export interface FetchResponse {
	status: number;
	statusText: string;
	headers: Record<string, string>;
	body: string;
	responseTime: number;
	url: string;
	redirects?: string[];
}

export interface OAuthTestResult {
	url: string;
	test: string;
	result: 'pass' | 'fail' | 'warning';
	message: string;
	details?: Record<string, unknown>;
	responseTime: number;
}

export class FetchManager {
	private requestHistory: FetchResponse[] = [];
	private maxHistorySize = 100;

	async initialize(): Promise<void> {
		console.log('Fetch manager initialized');
	}

	async shutdown(): Promise<void> {
		console.log('Fetch manager shutdown');
	}

	private addToHistory(response: FetchResponse): void {
		this.requestHistory.push(response);
		if (this.requestHistory.length > this.maxHistorySize) {
			this.requestHistory = this.requestHistory.slice(-this.maxHistorySize);
		}
	}

	private validateUrl(url: string): string {
		try {
			const parsedUrl = new URL(url);
			if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
				throw new Error(`Protocol ${parsedUrl.protocol} not allowed`);
			}
			return parsedUrl.toString();
		} catch (error) {
			throw new Error(`Invalid URL: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	async fetch(request: FetchRequest): Promise<FetchResponse> {
		const startTime = Date.now();
		const validUrl = this.validateUrl(request.url);

		const config: AxiosRequestConfig = {
			method: request.method || 'GET',
			url: validUrl,
			headers: request.headers,
			data: request.body,
			timeout: request.timeout || 30000,
			maxRedirects: request.allowRedirects !== false ? 5 : 0,
			validateStatus: () => true, // Don't throw on HTTP errors
		};

		// SSL validation
		if (request.validateSSL === false) {
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			const https = require('https');
			config.httpsAgent = new https.Agent({
				rejectUnauthorized: false,
			});
		}

		try {
			const response: AxiosResponse = await axios(config);
			const responseTime = Date.now() - startTime;

			const fetchResponse: FetchResponse = {
				status: response.status,
				statusText: response.statusText,
				headers: response.headers as Record<string, string>,
				body: typeof response.data === 'string' ? response.data : JSON.stringify(response.data),
				responseTime,
				url: response.config.url || validUrl,
				redirects: response.request?.res?.responseUrl ? [response.request.res.responseUrl] : [],
			};

			this.addToHistory(fetchResponse);
			return fetchResponse;
		} catch (error) {
			const responseTime = Date.now() - startTime;

			// Handle network errors
			const errorResponse: FetchResponse = {
				status: 0,
				statusText: error instanceof Error ? error.message : 'Network Error',
				headers: {},
				body: '',
				responseTime,
				url: validUrl,
			};

			this.addToHistory(errorResponse);
			return errorResponse;
		}
	}

	async fetchAndParse(
		request: FetchRequest
	): Promise<FetchResponse & { parsedContent?: Record<string, unknown> }> {
		const response = await this.fetch(request);
		let parsedContent: Record<string, unknown> | undefined;

		try {
			// Try to parse as JSON first
			if (response.headers['content-type']?.includes('application/json')) {
				parsedContent = JSON.parse(response.body);
			}
			// Try to parse as HTML
			else if (response.headers['content-type']?.includes('text/html')) {
				const $ = cheerio.load(response.body);
				parsedContent = {
					title: $('title').text(),
					meta: {
						description: $('meta[name="description"]').attr('content'),
						keywords: $('meta[name="keywords"]').attr('content'),
					},
					forms: $('form')
						.map((_, form) => ({
							action: $(form).attr('action'),
							method: $(form).attr('method'),
							inputs: $(form)
								.find('input')
								.map((_, input) => ({
									name: $(input).attr('name'),
									type: $(input).attr('type'),
									id: $(input).attr('id'),
								}))
								.get(),
						}))
						.get(),
					links: $('a')
						.map((_, link) => ({
							href: $(link).attr('href'),
							text: $(link).text().trim(),
						}))
						.get(),
				};
			}
		} catch (_parseError) {
			// Parsing failed, but we still return the raw response
		}

		return { ...response, parsedContent };
	}

	// OAuth-specific testing methods
	async testOAuthEndpoint(baseUrl: string, path: string, token?: string): Promise<OAuthTestResult> {
		const url = `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
		const headers: Record<string, string> = {
			Accept: 'application/json',
			'User-Agent': 'OAuth-Playground/1.0',
		};

		if (token) {
			headers['Authorization'] = `Bearer ${token}`;
		}

		const startTime = Date.now();
		const response = await this.fetch({
			url,
			headers,
			timeout: 15000,
		});

		const responseTime = Date.now() - startTime;

		// Analyze response for common OAuth patterns
		if (response.status === 200) {
			try {
				const data = JSON.parse(response.body);
				if (data.access_token || data.id_token) {
					return {
						url,
						test: 'Token endpoint validation',
						result: 'pass',
						message: 'Valid token response received',
						details: {
							tokenTypes: Object.keys(data).filter((key) => key.includes('token')),
							expiresIn: data.expires_in,
						},
						responseTime,
					};
				}
			} catch {
				// Not JSON, continue with other checks
			}

			return {
				url,
				test: 'Endpoint accessibility',
				result: 'pass',
				message: 'Endpoint is accessible and responding',
				responseTime,
			};
		} else if (response.status === 401) {
			return {
				url,
				test: 'Authentication required',
				result: 'pass',
				message: 'Endpoint correctly requires authentication',
				responseTime,
			};
		} else if (response.status === 403) {
			return {
				url,
				test: 'Authorization check',
				result: 'warning',
				message: 'Access forbidden - check scopes or permissions',
				responseTime,
			};
		} else {
			return {
				url,
				test: 'Endpoint availability',
				result: 'fail',
				message: `Unexpected status: ${response.status} ${response.statusText}`,
				details: {
					body: response.body.substring(0, 500),
				},
				responseTime,
			};
		}
	}

	async testRedirectFlow(startUrl: string, maxRedirects: number = 5): Promise<OAuthTestResult> {
		const startTime = Date.now();
		const redirects: string[] = [];
		let currentUrl = startUrl;
		let finalStatus = 0;
		let finalStatusText = '';

		for (let i = 0; i < maxRedirects; i++) {
			const response = await this.fetch({
				url: currentUrl,
				allowRedirects: false,
				timeout: 10000,
			});

			redirects.push(currentUrl);

			if (response.status >= 300 && response.status < 400) {
				const location = response.headers['location'];
				if (!location) {
					break;
				}

				// Handle relative URLs
				if (location.startsWith('/')) {
					const baseUrl = new URL(currentUrl);
					currentUrl = `${baseUrl.protocol}//${baseUrl.host}${location}`;
				} else if (location.startsWith('http')) {
					currentUrl = location;
				} else {
					// Relative URL
					const baseUrl = new URL(currentUrl);
					currentUrl = `${baseUrl.protocol}//${baseUrl.host}/${location}`;
				}
			} else {
				finalStatus = response.status;
				finalStatusText = response.statusText;
				break;
			}
		}

		const responseTime = Date.now() - startTime;

		if (redirects.length === 1 && finalStatus === 200) {
			return {
				url: startUrl,
				test: 'Redirect flow',
				result: 'pass',
				message: 'Direct access successful (no redirects)',
				details: { redirects },
				responseTime,
			};
		} else if (redirects.length > 1) {
			return {
				url: startUrl,
				test: 'Redirect flow',
				result: 'pass',
				message: `Redirect chain completed with ${redirects.length} steps`,
				details: { redirects, finalStatus },
				responseTime,
			};
		} else {
			return {
				url: startUrl,
				test: 'Redirect flow',
				result: 'fail',
				message: `Redirect flow failed: ${finalStatus} ${finalStatusText}`,
				details: { redirects },
				responseTime,
			};
		}
	}

	async testWellKnownEndpoints(baseUrl: string): Promise<OAuthTestResult[]> {
		const endpoints = [
			'/.well-known/openid_configuration',
			'/.well-known/oauth-authorization-server',
			'/.well-known/jwks.json',
		];

		const results: OAuthTestResult[] = [];

		for (const endpoint of endpoints) {
			const result = await this.testOAuthEndpoint(baseUrl, endpoint);
			result.test = `Well-known endpoint: ${endpoint}`;
			results.push(result);
		}

		return results;
	}

	// History and analytics
	getRequestHistory(limit?: number): FetchResponse[] {
		if (limit) {
			return this.requestHistory.slice(-limit);
		}
		return [...this.requestHistory];
	}

	clearHistory(): void {
		this.requestHistory = [];
	}

	getAnalytics(): {
		totalRequests: number;
		averageResponseTime: number;
		statusCodes: Record<number, number>;
		topDomains: Array<{ domain: string; count: number }>;
	} {
		if (this.requestHistory.length === 0) {
			return {
				totalRequests: 0,
				averageResponseTime: 0,
				statusCodes: {},
				topDomains: [],
			};
		}

		const statusCodes: Record<number, number> = {};
		const domainCounts: Record<string, number> = {};
		let totalResponseTime = 0;

		for (const response of this.requestHistory) {
			// Status code analysis
			statusCodes[response.status] = (statusCodes[response.status] || 0) + 1;

			// Domain analysis
			try {
				const domain = new URL(response.url).hostname;
				domainCounts[domain] = (domainCounts[domain] || 0) + 1;
			} catch {
				// Invalid URL, skip
			}

			// Response time analysis
			totalResponseTime += response.responseTime;
		}

		const topDomains = Object.entries(domainCounts)
			.map(([domain, count]) => ({ domain, count }))
			.sort((a, b) => b.count - a.count)
			.slice(0, 10);

		return {
			totalRequests: this.requestHistory.length,
			averageResponseTime: totalResponseTime / this.requestHistory.length,
			statusCodes,
			topDomains,
		};
	}
}
