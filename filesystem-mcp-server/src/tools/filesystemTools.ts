import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { FilesystemManager } from '../services/filesystemManager.js';
import { LogEntry } from '../services/filesystemManager.js';

// Schema definitions
const SaveConfigSchema = z.object({
	flowId: z.string().describe('Flow identifier'),
	config: z.record(z.unknown()).describe('Configuration data'),
	userId: z.string().optional().describe('User ID for audit'),
});

const LoadConfigSchema = z.object({
	flowId: z.string().describe('Flow identifier'),
});

const DeleteConfigSchema = z.object({
	flowId: z.string().describe('Flow identifier'),
	userId: z.string().optional().describe('User ID for audit'),
});

const WriteLogSchema = z.object({
	level: z.enum(['info', 'warn', 'error', 'debug']).describe('Log level'),
	message: z.string().describe('Log message'),
	flowId: z.string().optional().describe('Associated flow ID'),
	userId: z.string().optional().describe('User ID'),
	metadata: z.record(z.unknown()).optional().describe('Additional metadata'),
});

const ReadLogsSchema = z.object({
	date: z.string().optional().describe('Date in YYYY-MM-DD format (default: today)'),
	level: z.enum(['info', 'warn', 'error', 'debug']).optional().describe('Filter by log level'),
});

const SearchLogsSchema = z.object({
	query: z.string().describe('Search query'),
	date: z.string().optional().describe('Date in YYYY-MM-DD format (default: today)'),
});

const CreateTempFileSchema = z.object({
	filename: z.string().describe('Temporary filename'),
	content: z.string().describe('File content'),
	userId: z.string().optional().describe('User ID for audit'),
});

const ExportLogsSchema = z.object({
	startDate: z.string().describe('Start date in YYYY-MM-DD format'),
	endDate: z.string().describe('End date in YYYY-MM-DD format'),
});

export function registerFilesystemTools(
	server: McpServer,
	filesystemManager: FilesystemManager
): void {
	// Save configuration
	server.tool(
		'save-config',
		'Save OAuth flow configuration securely',
		SaveConfigSchema.shape,
		async ({ flowId, config, userId }) => {
			try {
				await filesystemManager.saveConfig(flowId, config, userId);
				return {
					content: [
						{
							type: 'text',
							text: `✅ Configuration saved for flow ${flowId}`,
						},
					],
				};
			} catch (error) {
				return {
					content: [
						{
							type: 'text',
							text: `❌ Failed to save configuration: ${error instanceof Error ? error.message : String(error)}`,
						},
					],
					isError: true,
				};
			}
		}
	);

	// Load configuration
	server.tool(
		'load-config',
		'Load OAuth flow configuration',
		LoadConfigSchema.shape,
		async ({ flowId }) => {
			try {
				const config = await filesystemManager.loadConfig(flowId);
				if (config) {
					return {
						content: [
							{
								type: 'text',
								text: `📋 Configuration for ${flowId}:\n\n${JSON.stringify(config, null, 2)}`,
							},
						],
					};
				} else {
					return {
						content: [
							{
								type: 'text',
								text: `ℹ️ No configuration found for flow ${flowId}`,
							},
						],
					};
				}
			} catch (error) {
				return {
					content: [
						{
							type: 'text',
							text: `❌ Failed to load configuration: ${error instanceof Error ? error.message : String(error)}`,
						},
					],
					isError: true,
				};
			}
		}
	);

	// Delete configuration
	server.tool(
		'delete-config',
		'Delete OAuth flow configuration',
		DeleteConfigSchema.shape,
		async ({ flowId, userId }) => {
			try {
				await filesystemManager.deleteConfig(flowId, userId);
				return {
					content: [
						{
							type: 'text',
							text: `🗑️ Configuration deleted for flow ${flowId}`,
						},
					],
				};
			} catch (error) {
				return {
					content: [
						{
							type: 'text',
							text: `❌ Failed to delete configuration: ${error instanceof Error ? error.message : String(error)}`,
						},
					],
					isError: true,
				};
			}
		}
	);

	// List configurations
	server.tool('list-configs', 'List all saved OAuth flow configurations', {}, async () => {
		try {
			const configs = await filesystemManager.listConfigs();
			return {
				content: [
					{
						type: 'text',
						text: `📁 Saved configurations:\n\n${configs.join('\n')}`,
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: 'text',
						text: `❌ Failed to list configurations: ${error instanceof Error ? error.message : String(error)}`,
					},
				],
				isError: true,
			};
		}
	});

	// Write log entry
	server.tool(
		'write-log',
		'Write a log entry to the OAuth playground logs',
		WriteLogSchema.shape,
		async ({ level, message, flowId, userId, metadata }) => {
			try {
				const logEntry: LogEntry = {
					level,
					message,
					timestamp: new Date().toISOString(),
					flowId,
					userId,
					metadata,
				};

				await filesystemManager.writeLog(logEntry);
				return {
					content: [
						{
							type: 'text',
							text: `📝 Log entry written: [${level.toUpperCase()}] ${message}`,
						},
					],
				};
			} catch (error) {
				return {
					content: [
						{
							type: 'text',
							text: `❌ Failed to write log: ${error instanceof Error ? error.message : String(error)}`,
						},
					],
					isError: true,
				};
			}
		}
	);

	// Read logs
	server.tool(
		'read-logs',
		'Read OAuth playground logs',
		ReadLogsSchema.shape,
		async ({ date, level }) => {
			try {
				const logs = await filesystemManager.readLogs(date, level);
				const logText = logs
					.map(
						(log) =>
							`[${log.level.toUpperCase()}] ${log.timestamp} - ${log.message}${log.flowId ? ` (flow: ${log.flowId})` : ''}`
					)
					.join('\n');

				return {
					content: [
						{
							type: 'text',
							text: `📋 Logs${date ? ` for ${date}` : ''}${level ? ` (${level} level)` : ''}:\n\n${logText}`,
						},
					],
				};
			} catch (error) {
				return {
					content: [
						{
							type: 'text',
							text: `❌ Failed to read logs: ${error instanceof Error ? error.message : String(error)}`,
						},
					],
					isError: true,
				};
			}
		}
	);

	// Search logs
	server.tool(
		'search-logs',
		'Search OAuth playground logs',
		SearchLogsSchema.shape,
		async ({ query, date }) => {
			try {
				const logs = await filesystemManager.searchLogs(query, date);
				const logText = logs
					.map(
						(log) =>
							`[${log.level.toUpperCase()}] ${log.timestamp} - ${log.message}${log.flowId ? ` (flow: ${log.flowId})` : ''}`
					)
					.join('\n');

				return {
					content: [
						{
							type: 'text',
							text: `🔍 Search results for "${query}"${date ? ` on ${date}` : ''}:\n\n${logText}`,
						},
					],
				};
			} catch (error) {
				return {
					content: [
						{
							type: 'text',
							text: `❌ Failed to search logs: ${error instanceof Error ? error.message : String(error)}`,
						},
					],
					isError: true,
				};
			}
		}
	);

	// Create temporary file
	server.tool(
		'create-temp-file',
		'Create a temporary file for testing or analysis',
		CreateTempFileSchema.shape,
		async ({ filename, content, userId }) => {
			try {
				const filePath = await filesystemManager.createTempFile(filename, content, userId);
				return {
					content: [
						{
							type: 'text',
							text: `📄 Temporary file created: ${filePath}`,
						},
					],
				};
			} catch (error) {
				return {
					content: [
						{
							type: 'text',
							text: `❌ Failed to create temporary file: ${error instanceof Error ? error.message : String(error)}`,
						},
					],
					isError: true,
				};
			}
		}
	);

	// Cleanup temporary files
	server.tool(
		'cleanup-temp-files',
		'Clean up temporary files older than specified hours',
		z.object({
			olderThanHours: z
				.number()
				.optional()
				.default(24)
				.describe('Files older than this many hours will be deleted'),
		}).shape,
		async ({ olderThanHours }) => {
			try {
				const deletedCount = await filesystemManager.cleanupTempFiles(olderThanHours);
				return {
					content: [
						{
							type: 'text',
							text: `🧹 Cleaned up ${deletedCount} temporary files older than ${olderThanHours} hours`,
						},
					],
				};
			} catch (error) {
				return {
					content: [
						{
							type: 'text',
							text: `❌ Failed to cleanup temp files: ${error instanceof Error ? error.message : String(error)}`,
						},
					],
					isError: true,
				};
			}
		}
	);

	// Export logs
	server.tool(
		'export-logs',
		'Export logs for a date range',
		ExportLogsSchema.shape,
		async ({ startDate, endDate }) => {
			try {
				const exportPath = await filesystemManager.exportLogs(startDate, endDate);
				return {
					content: [
						{
							type: 'text',
							text: `📤 Logs exported to: ${exportPath}`,
						},
					],
				};
			} catch (error) {
				return {
					content: [
						{
							type: 'text',
							text: `❌ Failed to export logs: ${error instanceof Error ? error.message : String(error)}`,
						},
					],
					isError: true,
				};
			}
		}
	);

	// Get audit log
	server.tool(
		'get-audit-log',
		'Get filesystem operation audit log',
		z.object({
			userId: z.string().optional().describe('Filter by user ID'),
		}).shape,
		async ({ userId }) => {
			try {
				const auditLog = await filesystemManager.getAuditLog(userId);
				const auditText = auditLog
					.map(
						(op) =>
							`[${op.type.toUpperCase()}] ${op.path} ${op.userId ? `(user: ${op.userId})` : ''} - ${op.timestamp}`
					)
					.join('\n');

				return {
					content: [
						{
							type: 'text',
							text: `📋 Audit log${userId ? ` for user ${userId}` : ''}:\n\n${auditText}`,
						},
					],
				};
			} catch (error) {
				return {
					content: [
						{
							type: 'text',
							text: `❌ Failed to get audit log: ${error instanceof Error ? error.message : String(error)}`,
						},
					],
					isError: true,
				};
			}
		}
	);
}
