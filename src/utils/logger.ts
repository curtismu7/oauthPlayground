// Enhanced logging utility for OAuth Playground

// Define specific data types for different logging contexts
type LogData =
	| string
	| number
	| boolean
	| object
	| null
	| undefined
	| Array<unknown>
	| Record<string, unknown>;

interface LogEntry {
	timestamp: string;
	level: string;
	component: string;
	message: string;
	data?: LogData;
	error?: Error;
}

class Logger {
	private logHistory: LogEntry[] = [];
	private maxLogEntries = 500;
	private lastUserActivity = Date.now();
	private idleThreshold = 30000; // 30 seconds of inactivity
	private isIdle = false;

	private addToHistory(
		level: string,
		component: string,
		message: string,
		data?: LogData,
		error?: Error
	) {
		const entry: LogEntry = {
			timestamp: new Date().toISOString(),
			level,
			component,
			message,
			data,
			...(error && { error }),
		};

		this.logHistory.push(entry);

		// Enforce the 500 entry limit by removing old entries
		while (this.logHistory.length > this.maxLogEntries) {
			this.logHistory.shift();
		}
	}

	// Track user activity
	recordUserActivity() {
		this.lastUserActivity = Date.now();
		this.isIdle = false;
	}

	// Check if user is idle
	private checkIdleStatus() {
		const now = Date.now();
		const timeSinceActivity = now - this.lastUserActivity;
		this.isIdle = timeSinceActivity > this.idleThreshold;
		return this.isIdle;
	}

	// Check if we should log based on activity and level
	private shouldLog(level: string, component: string): boolean {
		// Always log errors and warnings regardless of idle status
		if (level === 'ERROR' || level === 'WARN') {
			return true;
		}

		// Always log user-initiated actions
		if (component.includes('Button') || component.includes('Click') || component.includes('User')) {
			return true;
		}

		// Check if user is idle
		const isIdle = this.checkIdleStatus();

		// Don't log debug/info messages when idle unless they're important
		if (isIdle && (level === 'DEBUG' || level === 'INFO')) {
			return false;
		}

		return true;
	}

	// Public method to add entries from console interception
	addEntry(level: string, component: string, message: string, data?: LogData, error?: Error) {
		// Check if we should log this entry
		if (!this.shouldLog(level, component)) {
			return;
		}

		this.addToHistory(level, component, message, data, error);
	}

	error(component: string, message: string, data?: LogData, error?: Error) {
		this.addToHistory('ERROR', component, message, data, error);
		// Log to console
		if (component !== 'CONSOLE') {
			console.error(` [${component}] ${message}`, data || '', error || '');
		}
	}

	warn(component: string, message: string, data?: LogData) {
		this.addToHistory('WARN', component, message, data);
		// Log to console
		if (component !== 'CONSOLE') {
			console.warn(` [${component}] ${message}`, data || '');
		}
	}

	info(component: string, message: string, data?: LogData) {
		// Check if we should log info messages
		if (!this.shouldLog('INFO', component)) {
			return;
		}

		this.addToHistory('INFO', component, message, data);
		// Log to console
		if (component !== 'CONSOLE') {
			console.log(` [${component}] ${message}`, data || '');
		}
	}

	debug(component: string, message: string, data?: LogData) {
		// Check if we should log debug messages
		if (!this.shouldLog('DEBUG', component)) {
			return;
		}

		this.addToHistory('DEBUG', component, message, data);
		// Log to console
		if (component !== 'CONSOLE') {
			console.debug(` [${component}] ${message}`, data || '');
		}
	}

	success(component: string, message: string, data?: LogData) {
		this.addToHistory('SUCCESS', component, message, data);
		// Log to console
		if (component !== 'CONSOLE') {
			console.log(` [${component}] ${message}`, data || '');
		}
	}

	flow(component: string, message: string, data?: LogData) {
		this.addToHistory('FLOW', component, message, data);
		// Log to console
		if (component !== 'CONSOLE') {
			console.log(` [${component}] ${message}`, data || '');
		}
	}

	security(component: string, message: string, data?: LogData) {
		this.addToHistory('SECURITY', component, message, data);
		// Log to console
		if (component !== 'CONSOLE') {
			console.log(` [${component}] ${message}`, data || '');
		}
	}

	auth(component: string, message: string, data?: LogData) {
		this.addToHistory('AUTH', component, message, data);
		// Log to console
		if (component !== 'CONSOLE') {
			console.log(` [${component}] ${message}`, data || '');
		}
	}

	config(component: string, message: string, data?: LogData) {
		this.addToHistory('CONFIG', component, message, data);
		// Log to console
		if (component !== 'CONSOLE') {
			console.log(` [${component}] ${message}`, data || '');
		}
	}

	api(component: string, message: string, data?: LogData) {
		this.addToHistory('API', component, message, data);
		// Log to console
		if (component !== 'CONSOLE') {
			console.log(` [${component}] ${message}`, data || '');
		}
	}

	storage(component: string, message: string, data?: LogData) {
		this.addToHistory('STORAGE', component, message, data);
		// Log to console
		if (component !== 'CONSOLE') {
			console.log(` [${component}] ${message}`, data || '');
		}
	}

	ui(component: string, message: string, data?: LogData) {
		this.addToHistory('UI', component, message, data);
		// Log to console
		if (component !== 'CONSOLE') {
			console.log(` [${component}] ${message}`, data || '');
		}
	}

	discovery(component: string, message: string, data?: LogData) {
		this.addToHistory('DISCOVERY', component, message, data);
		// Log to console
		if (component !== 'CONSOLE') {
			console.log(` [${component}] ${message}`, data || '');
		}
	}

	getLogHistory(): LogEntry[] {
		return [...this.logHistory];
	}

	getLogCount(): number {
		return this.logHistory.length;
	}

	clearHistory() {
		this.logHistory = [];
	}

	exportLogs(): string {
		// Safe JSON stringify that handles circular references and DOM elements
		const safeStringify = (obj: any, space?: number): string => {
			const seen = new WeakSet();
			return JSON.stringify(
				obj,
				(_, value) => {
					// Skip circular references
					if (typeof value === 'object' && value !== null) {
						if (seen.has(value)) {
							return '[Circular Reference]';
						}
						seen.add(value);
					}

					// Handle DOM elements
					if (value instanceof HTMLElement) {
						return `[HTMLElement: ${value.tagName}]`;
					}

					// Handle React components
					if (value && typeof value === 'object' && value.$$typeof) {
						return '[React Component]';
					}

					// Handle functions
					if (typeof value === 'function') {
						return '[Function]';
					}

					return value;
				},
				space
			);
		};

		return safeStringify(this.logHistory, 2);
	}
}

export const logger = new Logger();
export default logger;
