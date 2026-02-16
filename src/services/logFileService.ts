/**
 * @file logFileService.ts
 * @module services
 * @description Service for interacting with log file API endpoints
 * @version 1.0.0
 */

const MODULE_TAG = '[📁 LOG-FILE-SERVICE]';

export interface LogFile {
	name: string;
	size: number;
	modified: Date;
	category: 'server' | 'api' | 'frontend' | 'mfa' | 'oauth' | 'other';
}

export interface LogFileContent {
	content: string;
	totalLines: number;
	fileSize: number;
	modified: Date;
}

export class LogFileService {
	private static readonly API_BASE = '/api/logs';

	/**
	 * List all available log files
	 */
	static async listLogFiles(): Promise<LogFile[]> {
		try {
			const response = await fetch(`${LogFileService.API_BASE}/list`);
			if (!response.ok) {
				throw new Error(`Failed to list log files: ${response.statusText}`);
			}
			const files = (await response.json()) as Array<{
				name: string;
				size: number;
				modified: string;
				category: string;
			}>;
			return files.map((f) => ({
				...f,
				modified: new Date(f.modified),
				category: f.category as LogFile['category'],
			}));
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to list log files:`, error);
			throw error;
		}
	}

	/**
	 * Read log file content
	 */
	static async readLogFile(
		file: string,
		lines: number = 100,
		tail: boolean = true
	): Promise<LogFileContent> {
		try {
			const params = new URLSearchParams({
				file,
				lines: lines.toString(),
				tail: tail.toString(),
			});

			const response = await fetch(`${LogFileService.API_BASE}/read?${params}`);
			if (!response.ok) {
				// Try to get error message, but handle if it's not JSON
				let errorMessage = `Failed to read log file: ${response.statusText}`;
				try {
					const errorData = await response.json();
					errorMessage = errorData.message || errorMessage;
				} catch {
					// If response is not JSON, use status text
				}
				throw new Error(errorMessage);
			}

			// Handle empty response
			const text = await response.text();
			if (!text) {
				throw new Error('Empty response from server');
			}

			let data;
			try {
				data = JSON.parse(text);
			} catch (parseError: unknown) {
				const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parsing error';
				throw new Error(`Invalid JSON response: ${errorMessage}`);
			}
			return {
				...data,
				modified: new Date(data.modified),
			};
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to read log file:`, error);
			throw error;
		}
	}

	/**
	 * Create a tail stream using Server-Sent Events
	 */
	static createTailStream(file: string): EventSource {
		const params = new URLSearchParams({ file });
		const eventSource = new EventSource(`${LogFileService.API_BASE}/tail?${params}`);

		console.log(`${MODULE_TAG} Created tail stream for: ${file}`);

		return eventSource;
	}

	/**
	 * Parse log entry from line (handles JSON and plain text)
	 */
	static parseLogEntry(line: string): Record<string, unknown> | { raw: string } {
		// Try to parse as JSON first
		try {
			return JSON.parse(line) as Record<string, unknown>;
		} catch {
			// Not JSON, return as plain text
			return { raw: line };
		}
	}

	/**
	 * Categorize log file by name
	 */
	static categorizeLogFile(filename: string): string {
		const lower = filename.toLowerCase();

		if (
			['server.log', 'backend.log', 'server-error.log'].includes(lower) ||
			/^server(-|_).+\.log$/i.test(lower)
		) {
			return 'Server Logs';
		} else if (
			['api-log.log', 'real-api.log', 'pingone-api.log'].includes(lower) ||
			/(api|pingone).+\.log$/i.test(lower)
		) {
			return 'API Logs';
		} else if (['client.log'].includes(lower) || /(client|frontend|browser).+\.log$/i.test(lower)) {
			return 'Frontend Logs';
		} else if (
			['fido.log', 'sms.log', 'email.log', 'whatsapp.log', 'voice.log'].includes(lower) ||
			/(fido|sms|email|whatsapp|voice|mfa).+\.log$/i.test(lower)
		) {
			return 'MFA Device Logs';
		} else if (
			['authz-redirects.log', 'oauth.log', 'oidc.log'].includes(lower) ||
			/(authz|oauth|oidc|redirect).+\.log$/i.test(lower)
		) {
			return 'OAuth Logs';
		}
		return 'Other Logs';
	}

	/**
	 * Format file size for display
	 */
	static formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${(bytes / k ** i).toFixed(2)} ${sizes[i]}`;
	}

	/**
	 * Check if file is large (>100MB)
	 */
	static isLargeFile(bytes: number): boolean {
		return bytes > 100 * 1024 * 1024;
	}
}
