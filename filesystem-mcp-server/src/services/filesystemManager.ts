import fs from 'fs-extra';
import path from 'path';
import chokidar from 'chokidar';

export interface FileOperation {
	type: 'read' | 'write' | 'delete' | 'create';
	path: string;
	content?: string;
	timestamp: string;
	userId?: string;
}

export interface LogEntry {
	level: 'info' | 'warn' | 'error' | 'debug';
	message: string;
	timestamp: string;
	flowId?: string;
	userId?: string;
	metadata?: Record<string, unknown>;
}

export class FilesystemManager {
	private configDir: string;
	private logsDir: string;
	private tempDir: string;
	private auditLog: FileOperation[] = [];
	private logWatcher: import('chokidar').FSWatcher | null = null;

	constructor() {
		// Define secure directories within the playground
		this.configDir = path.join(process.cwd(), '.oauth-playground', 'configs');
		this.logsDir = path.join(process.cwd(), '.oauth-playground', 'logs');
		this.tempDir = path.join(process.cwd(), '.oauth-playground', 'temp');
	}

	async initialize(): Promise<void> {
		// Ensure directories exist
		await fs.ensureDir(this.configDir);
		await fs.ensureDir(this.logsDir);
		await fs.ensureDir(this.tempDir);

		// Set up log watching
		this.setupLogWatcher();

		console.error('[filesystem-mcp] Filesystem manager initialized');
	}

	async shutdown(): Promise<void> {
		if (this.logWatcher) {
			await this.logWatcher.close();
		}
		console.error('[filesystem-mcp] Filesystem manager shutdown');
	}

	private setupLogWatcher(): void {
		this.logWatcher = chokidar.watch(this.logsDir, {
			persistent: true,
			ignoreInitial: true,
		});

		this.logWatcher.on('change', (filePath: string) => {
			console.error(`[filesystem-mcp] Log file changed: ${filePath}`);
		});
	}

	private auditOperation(operation: Omit<FileOperation, 'timestamp'>): void {
		this.auditLog.push({
			...operation,
			timestamp: new Date().toISOString(),
		});

		// Keep only last 1000 operations
		if (this.auditLog.length > 1000) {
			this.auditLog = this.auditLog.slice(-1000);
		}
	}

	private validatePath(requestedPath: string): string {
		const resolvedPath = path.resolve(requestedPath);

		// Only allow access to our designated directories
		const allowedDirs = [this.configDir, this.logsDir, this.tempDir];
		const isAllowed = allowedDirs.some((dir) => resolvedPath.startsWith(dir));

		if (!isAllowed) {
			throw new Error(`Access denied: ${requestedPath} is not in allowed directories`);
		}

		return resolvedPath;
	}

	// Configuration Management
	async saveConfig(
		flowId: string,
		config: Record<string, unknown>,
		userId?: string
	): Promise<void> {
		const configPath = path.join(this.configDir, `${flowId}.json`);
		const validatedPath = this.validatePath(configPath);

		await fs.writeJson(validatedPath, config, { spaces: 2 });

		this.auditOperation({
			type: 'write',
			path: validatedPath,
			content: JSON.stringify(config),
			userId,
		});

		console.error(`[filesystem-mcp] Configuration saved for flow ${flowId}`);
	}

	async loadConfig(flowId: string): Promise<Record<string, unknown> | null> {
		const configPath = path.join(this.configDir, `${flowId}.json`);
		const validatedPath = this.validatePath(configPath);

		try {
			const config = await fs.readJson(validatedPath);

			this.auditOperation({
				type: 'read',
				path: validatedPath,
			});

			return config;
		} catch (_error) {
			// Parsing failed, but we still return the raw response
			const rawResponse = await fs.readFile(validatedPath, 'utf8');
			return { rawResponse };
		}
	}

	async deleteConfig(flowId: string, userId?: string): Promise<void> {
		const configPath = path.join(this.configDir, `${flowId}.json`);
		const validatedPath = this.validatePath(configPath);

		await fs.remove(validatedPath);

		this.auditOperation({
			type: 'delete',
			path: validatedPath,
			userId,
		});

		console.error(`[filesystem-mcp] Configuration deleted for flow ${flowId}`);
	}

	async listConfigs(): Promise<string[]> {
		try {
			const files = await fs.readdir(this.configDir);
			const configFiles = files.filter((file) => file.endsWith('.json'));

			this.auditOperation({
				type: 'read',
				path: this.configDir,
			});

			return configFiles.map((file) => file.replace('.json', ''));
		} catch (_error) {
			return [];
		}
	}

	// Log Management
	async writeLog(entry: LogEntry): Promise<void> {
		const logFileName = `oauth-playground-${new Date().toISOString().split('T')[0]}.log`;
		const logPath = path.join(this.logsDir, logFileName);
		const validatedPath = this.validatePath(logPath);

		const logLine = JSON.stringify(entry) + '\n';
		await fs.appendFile(validatedPath, logLine);

		console.error(`[filesystem-mcp] Log entry written to ${logFileName}`);
	}

	async readLogs(date?: string, level?: LogEntry['level']): Promise<LogEntry[]> {
		const logFileName = date
			? `oauth-playground-${date}.log`
			: `oauth-playground-${new Date().toISOString().split('T')[0]}.log`;
		const logPath = path.join(this.logsDir, logFileName);
		const validatedPath = this.validatePath(logPath);

		try {
			const content = await fs.readFile(validatedPath, 'utf8');
			const lines = content
				.trim()
				.split('\n')
				.filter((line) => line);

			const logs: LogEntry[] = lines
				.map((line) => {
					try {
						return JSON.parse(line);
					} catch {
						return null;
					}
				})
				.filter(Boolean);

			// Filter by level if specified
			if (level) {
				return logs.filter((log) => log.level === level);
			}

			this.auditOperation({
				type: 'read',
				path: validatedPath,
			});

			return logs;
		} catch (_error) {
			return [];
		}
	}

	async searchLogs(query: string, date?: string): Promise<LogEntry[]> {
		const logs = await this.readLogs(date);
		const queryLower = query.toLowerCase();

		return logs.filter(
			(log) =>
				log.message.toLowerCase().includes(queryLower) ||
				JSON.stringify(log.metadata || {})
					.toLowerCase()
					.includes(queryLower)
		);
	}

	// Temporary File Management
	async createTempFile(filename: string, content: string, userId?: string): Promise<string> {
		const tempPath = path.join(this.tempDir, filename);
		const validatedPath = this.validatePath(tempPath);

		await fs.writeFile(validatedPath, content);

		this.auditOperation({
			type: 'create',
			path: validatedPath,
			content,
			userId,
		});

		return validatedPath;
	}

	async cleanupTempFiles(olderThanHours: number = 24): Promise<number> {
		try {
			const files = await fs.readdir(this.tempDir);
			const cutoffTime = Date.now() - olderThanHours * 60 * 60 * 1000;
			let deletedCount = 0;

			for (const file of files) {
				const filePath = path.join(this.tempDir, file);
				const stats = await fs.stat(filePath);

				if (stats.mtime.getTime() < cutoffTime) {
					await fs.remove(filePath);
					deletedCount++;
				}
			}

			console.error(`[filesystem-mcp] Cleaned up ${deletedCount} temporary files`);
			return deletedCount;
		} catch (error) {
			console.error('Error cleaning up temp files:', error);
			return 0;
		}
	}

	// Audit and Security
	async getAuditLog(userId?: string): Promise<FileOperation[]> {
		if (userId) {
			return this.auditLog.filter((op) => op.userId === userId);
		}
		return [...this.auditLog];
	}

	async exportLogs(startDate: string, endDate: string): Promise<string> {
		const exportPath = path.join(this.tempDir, `logs-export-${Date.now()}.json`);
		const validatedPath = this.validatePath(exportPath);

		const logs: LogEntry[] = [];
		const start = new Date(startDate);
		const end = new Date(endDate);

		// Collect logs from each day in the range
		for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
			const dateStr = date.toISOString().split('T')[0];
			const dayLogs = await this.readLogs(dateStr);
			logs.push(...dayLogs);
		}

		await fs.writeJson(validatedPath, logs, { spaces: 2 });
		return validatedPath;
	}
}
