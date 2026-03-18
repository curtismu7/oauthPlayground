import persist from 'node-persist';

export interface UserPreference {
	userId: string;
	preferences: {
		defaultFlow: 'admin' | 'user' | 'pingone';
		preferredMfaMethod: 'sms' | 'email' | 'totp' | 'push';
		rememberCredentials: boolean;
		autoTestMode: boolean;
		debugMode: boolean;
		timezone: string;
	};
	lastUsed: {
		flow: string;
		timestamp: string;
		success: boolean;
	};
}

export interface OAuthFlowMemory {
	flowId: string;
	flowType: 'admin' | 'user' | 'pingone';
	configuration?: {
		environmentId?: string;
		clientId?: string;
		authzClientId?: string;
		scopes?: string[];
		redirectUri?: string;
	};
	issues: Array<{
		type: 'error' | 'warning' | 'info';
		message: string;
		timestamp: string;
		resolution?: string;
	}>;
	successPatterns: Array<{
		description: string;
		configuration: Record<string, unknown>;
		timestamp: string;
	}>;
}

export class MemoryManager {
	private storage: persist.LocalStorage;

	constructor() {
		this.storage = persist.create({
			dir: './memory-storage',
			encoding: 'utf8',
			parse: JSON.parse,
			stringify: JSON.stringify,
		});
	}

	async initialize(): Promise<void> {
		await this.storage.init();
		console.error('[memory-mcp] Memory storage initialized');
	}

	async shutdown(): Promise<void> {
		// node-persist doesn't have a close method, just clear if needed
		console.error('[memory-mcp] Memory storage closed');
	}

	// User Preferences
	async saveUserPreference(
		userId: string,
		preferences: Partial<UserPreference['preferences']>
	): Promise<void> {
		const existing = await this.getUserPreference(userId);
		const updated = {
			...existing,
			userId,
			preferences: { ...existing.preferences, ...preferences },
			lastUsed: existing.lastUsed,
		};
		await this.storage.setItem(`user:${userId}`, updated);
	}

	async getUserPreference(userId: string): Promise<UserPreference> {
		const stored = await this.storage.getItem(`user:${userId}`);
		if (!stored) {
			// Return default preferences
			return {
				userId,
				preferences: {
					defaultFlow: 'user',
					preferredMfaMethod: 'totp',
					rememberCredentials: false,
					autoTestMode: false,
					debugMode: false,
					timezone: 'UTC',
				},
				lastUsed: {
					flow: '',
					timestamp: '',
					success: false,
				},
			};
		}
		return stored;
	}

	async updateUserLastUsed(userId: string, flow: string, success: boolean): Promise<void> {
		const existing = await this.getUserPreference(userId);
		existing.lastUsed = {
			flow,
			timestamp: new Date().toISOString(),
			success,
		};
		await this.storage.setItem(`user:${userId}`, existing);
	}

	// OAuth Flow Memory
	async saveFlowMemory(flowMemory: Partial<OAuthFlowMemory>): Promise<void> {
		const flowId = flowMemory.flowId || `flow_${Date.now()}`;
		const existing = await this.getFlowMemory(flowId);
		const updated = { ...existing, ...flowMemory, flowId };
		await this.storage.setItem(`flow:${flowId}`, updated);
	}

	async getFlowMemory(flowId: string): Promise<OAuthFlowMemory> {
		const stored = await this.storage.getItem(`flow:${flowId}`);
		if (!stored) {
			return {
				flowId,
				flowType: 'user',
				configuration: { scopes: [] },
				issues: [],
				successPatterns: [],
			};
		}
		return stored;
	}

	async addFlowIssue(
		flowId: string,
		issue: Omit<OAuthFlowMemory['issues'][0], 'timestamp'>
	): Promise<void> {
		const flow = await this.getFlowMemory(flowId);
		flow.issues.push({
			...issue,
			timestamp: new Date().toISOString(),
		});
		await this.storage.setItem(`flow:${flowId}`, flow);
	}

	async addFlowSuccessPattern(
		flowId: string,
		pattern: Omit<OAuthFlowMemory['successPatterns'][0], 'timestamp'>
	): Promise<void> {
		const flow = await this.getFlowMemory(flowId);
		flow.successPatterns.push({
			...pattern,
			timestamp: new Date().toISOString(),
		});
		await this.storage.setItem(`flow:${flowId}`, flow);
	}

	// Search and Analytics
	async searchUserHistory(
		userId: string,
		query: string
	): Promise<Array<UserPreference | OAuthFlowMemory>> {
		const results: Array<UserPreference | OAuthFlowMemory> = [];
		const userPref = await this.getUserPreference(userId);

		// Simple text search in preferences and history
		const queryLower = query.toLowerCase();
		if (
			userPref.preferences.defaultFlow.includes(queryLower) ||
			userPref.preferences.preferredMfaMethod.includes(queryLower) ||
			userPref.lastUsed.flow.includes(queryLower)
		) {
			results.push(userPref);
		}

		// Search through flow memories
		const keys = await this.storage.keys();
		for (const key of keys) {
			if (key.startsWith('flow:')) {
				const flow = await this.storage.getItem(key);
				const flowStr = JSON.stringify(flow).toLowerCase();
				if (flowStr.includes(queryLower)) {
					results.push(flow);
				}
			}
		}

		return results;
	}

	async getCommonIssues(): Promise<
		Array<{ issue: string; count: number; commonResolution?: string }>
	> {
		const keys = await this.storage.keys();
		const issueCounts = new Map<string, { count: number; resolutions: string[] }>();

		for (const key of keys) {
			if (key.startsWith('flow:')) {
				const flow: OAuthFlowMemory = await this.storage.getItem(key);
				for (const issue of flow.issues) {
					const existing = issueCounts.get(issue.message) || { count: 0, resolutions: [] };
					existing.count++;
					if (issue.resolution) {
						existing.resolutions.push(issue.resolution);
					}
					issueCounts.set(issue.message, existing);
				}
			}
		}

		return Array.from(issueCounts.entries())
			.map(([issue, data]) => ({
				issue,
				count: data.count,
				commonResolution: data.resolutions[0], // Most recent resolution
			}))
			.sort((a, b) => b.count - a.count)
			.slice(0, 10); // Top 10 issues
	}
}
