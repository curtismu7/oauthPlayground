// src/services/v9/MockFlowLoggingService.ts
// Centralized logging service for all mock flows
// Logs API calls to backend for debugging and educational purposes

export type LogLevel = 'info' | 'error' | 'warn' | 'debug';
export type LogFile = 'oauth.log' | 'mfa.log' | 'client.log' | 'server.log';

interface LogWriteRequest {
	file: LogFile;
	message: string;
	level: LogLevel;
}

export interface MockApiCallLog {
	flowName: string;
	endpoint: string;
	method: string;
	request: Record<string, unknown>;
	response: Record<string, unknown>;
	logFile?: LogFile;
}

export interface MockErrorLog {
	flowName: string;
	error: string;
	context: Record<string, unknown>;
	logFile?: LogFile;
}

const API_ENDPOINT = '/api/logs/write';

/**
 * Write a log message to the backend
 */
async function writeLog(
	file: LogFile,
	message: string,
	level: LogLevel = 'info'
): Promise<void> {
	try {
		const response = await fetch(API_ENDPOINT, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				file,
				message,
				level,
			} as LogWriteRequest),
		});

		if (!response.ok) {
			console.error(`Failed to write log: ${response.status} ${response.statusText}`);
		}
	} catch (error) {
		console.error('Failed to write log:', error);
	}
}

/**
 * Log a mock API call with request/response details
 * 
 * Usage:
 * ```typescript
 * await logMockApiCall({
 *   flowName: 'Client Credentials V9',
 *   endpoint: '/token',
 *   method: 'POST',
 *   request: { grant_type: 'client_credentials' },
 *   response: { access_token: 'mock_token_xxx' }
 * });
 * ```
 */
export async function logMockApiCall({
	flowName,
	endpoint,
	method,
	request,
	response,
	logFile = 'oauth.log',
}: MockApiCallLog): Promise<void> {
	const timestamp = new Date().toISOString();
	const logMessage = [
		`[${timestamp}] [MOCK FLOW: ${flowName}]`,
		`${method} ${endpoint}`,
		`Request: ${JSON.stringify(request, null, 2)}`,
		`Response: ${JSON.stringify(response, null, 2)}`,
		'---',
	].join('\n');

	await writeLog(logFile, logMessage, 'info');
}

/**
 * Log a mock flow error with context
 */
export async function logMockError({
	flowName,
	error,
	context,
	logFile = 'oauth.log',
}: MockErrorLog): Promise<void> {
	const timestamp = new Date().toISOString();
	const logMessage = [
		`[${timestamp}] [MOCK FLOW ERROR: ${flowName}]`,
		`Error: ${error}`,
		`Context: ${JSON.stringify(context, null, 2)}`,
		'---',
	].join('\n');

	await writeLog(logFile, logMessage, 'error');
}

/**
 * Log a mock flow step execution
 */
export async function logMockStep(
	flowName: string,
	stepName: string,
	stepData: Record<string, unknown>,
	logFile: LogFile = 'oauth.log'
): Promise<void> {
	const timestamp = new Date().toISOString();
	const logMessage = [
		`[${timestamp}] [MOCK FLOW STEP: ${flowName}]`,
		`Step: ${stepName}`,
		`Data: ${JSON.stringify(stepData, null, 2)}`,
		'---',
	].join('\n');

	await writeLog(logFile, logMessage, 'debug');
}

/**
 * Log a mock flow completion
 */
export async function logMockFlowComplete(
	flowName: string,
	summary: Record<string, unknown>,
	logFile: LogFile = 'oauth.log'
): Promise<void> {
	const timestamp = new Date().toISOString();
	const logMessage = [
		`[${timestamp}] [MOCK FLOW COMPLETE: ${flowName}]`,
		`Summary: ${JSON.stringify(summary, null, 2)}`,
		'---',
	].join('\n');

	await writeLog(logFile, logMessage, 'info');
}
