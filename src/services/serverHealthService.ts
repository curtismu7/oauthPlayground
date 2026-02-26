/**
 * Shared server health check for Dashboard and API Status page.
 * Single place for backend health URL, simple and detailed status so we don't duplicate logic.
 * See docs/updates-to-apps/dashboard-updates.md.
 */

export type ServerStatusValue = 'online' | 'offline' | 'checking';

export interface SimpleServerStatus {
	frontend: ServerStatusValue;
	backend: ServerStatusValue;
}

/** Health payload returned by backend GET /api/health (and minimal shape for frontend). */
export interface HealthData {
	status: string;
	timestamp: string;
	version: string;
	versions: { app: string; mfaV8: string; unifiedV8u: string };
	pid: number;
	startTime: string;
	uptimeSeconds: number;
	environment: string;
	node: { version: string; platform: string; arch: string };
	memory: {
		rss: number;
		heapTotal: number;
		heapUsed: number;
		external: number;
		arrayBuffers: number;
	};
	systemMemory: { total: number; free: number; used: number };
	loadAverage: number[];
	cpuUsage: { avg1mPercent: number; avg5mPercent: number; avg15mPercent: number };
	requestStats: {
		totalRequests: number;
		activeConnections: number;
		avgResponseTime: number;
		errorRate: number;
	};
}

/** Per-server status with optional health details (used by Dashboard and API Status page). */
export interface DetailedServerStatus {
	name: string;
	port: number;
	protocol: 'HTTP' | 'HTTPS';
	status: ServerStatusValue;
	healthData: HealthData | null;
	error: string | null;
	lastChecked: Date | null;
}

/**
 * Backend health URL. Prefers relative /api/health so the Vite dev proxy is used (avoids
 * ERR_CERT_AUTHORITY_INVALID when the backend uses a self-signed cert). Use VITE_BACKEND_URL
 * only when set and not localhost (e.g. production backend on a different host with valid cert).
 */
export function getBackendHealthUrl(): string {
	const base = import.meta.env.VITE_BACKEND_URL as string | undefined;
	if (base && !base.includes('localhost')) {
		const normalized = base.replace(/\/$/, '');
		return `${normalized}/api/health`;
	}
	return '/api/health';
}

/** Simple check used by Dashboard: frontend is online if we're in the app; backend from /api/health. */
export async function checkServerStatusForDashboard(): Promise<SimpleServerStatus> {
	const result: SimpleServerStatus = {
		frontend: 'online',
		backend: 'checking',
	};
	try {
		const url = getBackendHealthUrl();
		const response = await fetch(url, {
			method: 'GET',
			mode: 'cors',
			signal: AbortSignal.timeout(3000),
		});
		result.backend = response.ok ? 'online' : 'offline';
	} catch {
		result.backend = 'offline';
	}
	return result;
}

/** Format bytes for display (e.g. "12.5 MB"). */
export function formatBytes(bytes: number): string {
	if (bytes === 0) return '0 Bytes';
	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

/** Format uptime seconds for display (e.g. "2h 30m"). */
export function formatUptime(seconds: number): string {
	const days = Math.floor(seconds / 86400);
	const hours = Math.floor((seconds % 86400) / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	if (days > 0) return `${days}d ${hours}h ${minutes}m`;
	if (hours > 0) return `${hours}h ${minutes}m`;
	return `${minutes}m`;
}

const DEFAULT_SERVERS: DetailedServerStatus[] = [
	{
		name: 'Frontend Server',
		port: 3000,
		protocol: 'HTTPS',
		status: 'checking',
		healthData: null,
		error: null,
		lastChecked: null,
	},
	{
		name: 'Backend Server',
		port: 3001,
		protocol: 'HTTPS',
		status: 'checking',
		healthData: null,
		error: null,
		lastChecked: null,
	},
];

/** Minimal frontend health data for display consistency. */
function minimalFrontendHealthData(): HealthData {
	return {
		status: 'ok',
		timestamp: new Date().toISOString(),
		version: '9.4.8',
		versions: { app: '9.4.8', mfaV8: '9.4.8', unifiedV8u: '9.4.8' },
		pid: 0,
		startTime: new Date().toISOString(),
		uptimeSeconds: 0,
		environment: 'development',
		node: { version: 'v22.16.0', platform: 'darwin', arch: 'arm64' },
		memory: { rss: 0, heapTotal: 0, heapUsed: 0, external: 0, arrayBuffers: 0 },
		systemMemory: { total: 0, free: 0, used: 0 },
		loadAverage: [0, 0, 0],
		cpuUsage: { avg1mPercent: 0, avg5mPercent: 0, avg15mPercent: 0 },
		requestStats: { totalRequests: 0, activeConnections: 0, avgResponseTime: 0, errorRate: 0 },
	};
}

/**
 * Fetch detailed health for both frontend and backend. Used by Dashboard and API Status page
 * so both show the same details (version, uptime, memory, CPU, request stats).
 */
export async function fetchDetailedHealth(): Promise<DetailedServerStatus[]> {
	const backendUrl = getBackendHealthUrl();
	const results: DetailedServerStatus[] = [];

	for (const server of DEFAULT_SERVERS) {
		const updated = { ...server, status: 'checking' as const };
		try {
			const isFrontend = server.port === 3000;
			const url = isFrontend ? '/' : backendUrl;
			const response = await fetch(url, {
				method: 'GET',
				signal: AbortSignal.timeout(5000),
			});
			if (!response.ok) {
				results.push({
					...updated,
					status: 'offline',
					healthData: null,
					error: `HTTP ${response.status}: ${response.statusText}`,
					lastChecked: new Date(),
				});
				continue;
			}
			let healthData: HealthData;
			if (isFrontend) {
				healthData = minimalFrontendHealthData();
			} else {
				healthData = (await response.json()) as HealthData;
			}
			results.push({
				...updated,
				status: 'online',
				healthData,
				error: null,
				lastChecked: new Date(),
			});
		} catch (err) {
			results.push({
				...updated,
				status: 'offline',
				healthData: null,
				error: err instanceof Error ? err.message : 'Failed to fetch health data',
				lastChecked: new Date(),
			});
		}
	}
	return results;
}
