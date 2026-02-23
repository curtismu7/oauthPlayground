export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Configuration for logging behavior
const LOG_CONFIG = {
	// Enable/disable console logging
	consoleEnabled: true,
	// Enable/disable disk logging via server endpoint
	diskEnabled: true,
	// Minimum level to log to disk (debug, info, warn, error)
	diskMinLevel: 'info' as LogLevel,
	// Tags that should always be logged to disk regardless of level
	forceDiskTags: ['[ERROR]', '[AuthModal]', '[FlowState]', '[FlowContextService]', '[QRCodeService]', '[CredentialBackup]'],
};

// Check if a message should be logged to disk based on level and tags
function shouldLogToDisk(level: LogLevel, message: string): boolean {
	if (!LOG_CONFIG.diskEnabled) return false;
	
	// Check minimum level
	const levelPriority = { debug: 0, info: 1, warn: 2, error: 3 };
	const minPriority = levelPriority[LOG_CONFIG.diskMinLevel];
	const messagePriority = levelPriority[level];
	
	if (messagePriority < minPriority) return false;
	
	// Check for forced tags
	return LOG_CONFIG.forceDiskTags.some(tag => message.includes(tag));
}

export async function clientLog(
	level: LogLevel,
	message: string,
	meta?: Record<string, unknown>
): Promise<void> {
	try {
		const prefix = `[client:${level}]`;
		
		// Console logging (always enabled for now, but can be disabled)
		if (LOG_CONFIG.consoleEnabled) {
			if (level === 'debug') console.debug(prefix, message, meta || {});
			else if (level === 'info') console.info(prefix, message, meta || {});
			else if (level === 'warn') console.warn(prefix, message, meta || {});
			else console.error(prefix, message, meta || {});
		}

		// Disk logging via server endpoint
		if (shouldLogToDisk(level, message)) {
			await fetch('/__client-log', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ level, message, meta, timestamp: new Date().toISOString() }),
				keepalive: true,
			}).catch(() => {});
		}
	} catch {}
}

// Convenience functions for different log levels
export const clientDebug = (message: string, meta?: Record<string, unknown>) => clientLog('debug', message, meta);
export const clientInfo = (message: string, meta?: Record<string, unknown>) => clientLog('info', message, meta);
export const clientWarn = (message: string, meta?: Record<string, unknown>) => clientLog('warn', message, meta);
export const clientError = (message: string, meta?: Record<string, unknown>) => clientLog('error', message, meta);

// Function to update logging configuration (for future use)
export function updateLogConfig(config: Partial<typeof LOG_CONFIG>) {
	Object.assign(LOG_CONFIG, config);
}
