/**
 * Server Restart History Service
 * Tracks server restart events and provides historical data
 * for monitoring server lifecycle and status changes.
 */

export interface ServerRestartEvent {
	id: string;
	timestamp: Date;
	serverType: 'frontend' | 'backend';
	previousStatus: 'online' | 'offline' | 'unknown';
	newStatus: 'online' | 'offline' | 'unknown';
	uptimeAfterRestart: number; // seconds
	reason?: string;
}

class ServerRestartHistoryService {
	private static instance: ServerRestartHistoryService;
	private restartHistory: ServerRestartEvent[] = [];
	private maxHistorySize = 50;
	private lastServerStatus: Record<string, 'online' | 'offline' | 'unknown'> = {
		frontend: 'unknown',
		backend: 'unknown',
	};

	private constructor() {
		this.loadFromStorage();
		// Initialize with current status check
		this.checkInitialStatus();
	}

	static getInstance(): ServerRestartHistoryService {
		if (!ServerRestartHistoryService.instance) {
			ServerRestartHistoryService.instance = new ServerRestartHistoryService();
		}
		return ServerRestartHistoryService.instance;
	}

	private loadFromStorage(): void {
		try {
			const stored = localStorage.getItem('server_restart_history');
			if (stored) {
				const parsed = JSON.parse(stored);
				this.restartHistory = parsed.map((event: any) => ({
					...event,
					timestamp: new Date(event.timestamp),
				}));
			}

			const storedStatus = localStorage.getItem('server_last_status');
			if (storedStatus) {
				this.lastServerStatus = JSON.parse(storedStatus);
			}
		} catch (error) {
			console.warn('Failed to load server restart history from storage:', error);
			this.restartHistory = [];
		}
	}

	private saveToStorage(): void {
		try {
			localStorage.setItem('server_restart_history', JSON.stringify(this.restartHistory));
			localStorage.setItem('server_last_status', JSON.stringify(this.lastServerStatus));
		} catch (error) {
			console.warn('Failed to save server restart history to storage:', error);
		}
	}

	private checkInitialStatus(): void {
		// Check if this might be a server restart by comparing current time vs last known status
		const now = new Date();
		const lastCheck = new Date(localStorage.getItem('server_last_health_check') || 0);

		// If it's been more than 30 seconds since last check, assume server restart
		if (now.getTime() - lastCheck.getTime() > 30000) {
			this.recordRestart('frontend', 'unknown', 'online', 'Page refresh/initial load');
			this.recordRestart('backend', 'unknown', 'unknown', 'Page refresh/initial load');
		}
	}

	async checkServerStatus(serverType: 'frontend' | 'backend'): Promise<'online' | 'offline'> {
		try {
			if (serverType === 'frontend') {
				return 'online'; // Frontend is always online if we're running
			}

			// Check backend health
			const response = await fetch('/api/health', {
				method: 'GET',
				mode: 'cors',
				signal: AbortSignal.timeout(5000),
			});

			return response.ok ? 'online' : 'offline';
		} catch (_error) {
			return 'offline';
		}
	}

	recordRestart(
		serverType: 'frontend' | 'backend',
		previousStatus: 'online' | 'offline' | 'unknown',
		newStatus: 'online' | 'offline' | 'unknown',
		reason?: string
	): void {
		const _now = new Date();

		// Calculate uptime after restart (simplified - in a real implementation this would track actual uptime)
		let uptimeAfterRestart = 0;
		if (newStatus === 'online' && serverType === 'backend') {
			// For backend, we can get actual uptime from the health endpoint
			this.getBackendUptime()
				.then((uptime) => {
					uptimeAfterRestart = uptime;
					this.finalizeRestart(serverType, previousStatus, newStatus, uptimeAfterRestart, reason);
				})
				.catch(() => {
					this.finalizeRestart(serverType, previousStatus, newStatus, uptimeAfterRestart, reason);
				});
		} else {
			this.finalizeRestart(serverType, previousStatus, newStatus, uptimeAfterRestart, reason);
		}
	}

	private finalizeRestart(
		serverType: 'frontend' | 'backend',
		previousStatus: 'online' | 'offline' | 'unknown',
		newStatus: 'online' | 'offline' | 'unknown',
		uptimeAfterRestart: number,
		reason?: string
	): void {
		const event: ServerRestartEvent = {
			id: `${serverType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
			timestamp: new Date(),
			serverType,
			previousStatus,
			newStatus,
			uptimeAfterRestart,
		};

		if (reason !== undefined) {
			event.reason = reason;
		}

		this.restartHistory.unshift(event);

		// Keep only the most recent events
		if (this.restartHistory.length > this.maxHistorySize) {
			this.restartHistory = this.restartHistory.slice(0, this.maxHistorySize);
		}

		// Update last known status
		this.lastServerStatus[serverType] = newStatus;

		this.saveToStorage();
	}

	private async getBackendUptime(): Promise<number> {
		try {
			const response = await fetch('/api/health');
			if (response.ok) {
				const data = await response.json();
				return data.uptimeSeconds || 0;
			}
		} catch (error) {
			console.warn('Failed to get backend uptime:', error);
		}
		return 0;
	}

	getRestartHistory(limit = 20): ServerRestartEvent[] {
		return this.restartHistory.slice(0, limit);
	}

	getServerStatus(serverType: 'frontend' | 'backend'): 'online' | 'offline' | 'unknown' {
		return this.lastServerStatus[serverType] || 'unknown';
	}

	clearHistory(): void {
		this.restartHistory = [];
		this.saveToStorage();
	}

	// Monitor server status and detect restarts
	async monitorServerHealth(): Promise<void> {
		const now = new Date();
		localStorage.setItem('server_last_health_check', now.toISOString());

		// Check backend status
		const backendStatus = await this.checkServerStatus('backend');
		const lastBackendStatus = this.lastServerStatus.backend;

		if (backendStatus !== lastBackendStatus && lastBackendStatus !== 'unknown') {
			this.recordRestart(
				'backend',
				lastBackendStatus,
				backendStatus,
				backendStatus === 'online' ? 'Server recovered' : 'Server went offline'
			);
		} else if (backendStatus === 'online' && lastBackendStatus === 'unknown') {
			// First time checking - record as initial status
			this.recordRestart('backend', 'unknown', 'online', 'Initial server check');
		}

		this.lastServerStatus.backend = backendStatus;
		this.saveToStorage();
	}
}

export const serverRestartHistoryService = ServerRestartHistoryService.getInstance();
